// story/runner.js — Motor de flujos de historia (clase StoryRunner, base de Story).
// Ejecuta diálogos de datos/historia/dialogos/: nodos con texto, intervenciones de compañeros («say»),
// redirecciones, opciones (con condiciones, coste, tono, pruebas de habilidad y plantillas «each») y efectos
// («do»/«then», ver actions.js). Los efectos que abren otra cosa (combate, tienda, descanso, viaje, nivel,
// contratar, epílogo) se aplazan hasta cerrar el diálogo. También lleva la aprobación de los compañeros, las
// misiones, el diario, el oro y los objetos, llamando al núcleo de reglas (cp_*) con alternativas en JS si
// falla. Es el contexto de evaluación de conditions.js y text.js. Lo extiende story/story.js.

import { conditionAtoms, evalCondition } from './conditions.js';
import { conditionTag, formatText, SKILL_NAMES, SKILL_ABILITIES, ABILITY_NAMES } from './text.js';
import { parseEffect, rollDice, DEFERRED_EFFECTS } from './actions.js';

/** Parte las líneas en párrafos y pone en cursiva («*…*») la narración (lo que no empieza por «). */
function narrationParagraphs(lines) {
  let out = [];
  for (let line of lines) {
    let text = String(line).trim(),
      wholeItalic = /^\*[^*]+\*$/.test(text);
    wholeItalic && (text = text.slice(1, -1));
    for (let para of text.split(/\n{2,}/)) {
      if (((para = para.trim()), !para)) continue;
      let stars = (para.match(/\*/g) || []).length;
      (wholeItalic || (!stars && !para.startsWith('\xAB'))
        ? (para = `*${para.replace(/^\*+|\*+$/g, '')}*`)
        : stars % 2 && (para = para.startsWith('*') ? `${para}*` : `*${para}`),
        out.push(para));
    }
  }
  return out;
}
/** Cierra los asteriscos de cursiva que quedan sin pareja en cada párrafo. */
function balanceAsterisks(text) {
  return String(text)
    .split(/\n{2,}/)
    .map((para) => {
      if (!((para.match(/\*/g) || []).length % 2)) return para;
      let trimmed = para.trim();
      return trimmed.startsWith('*') ? `${trimmed}*` : `*${trimmed}`;
    }).join(`

`);
}
/** Compañeros de historia (los mercenarios no cuentan). */
const COMPANION_IDS = ['brenna', 'pip', 'ilyra', 'odvar'];
/** Tamaño máximo del grupo. */
const MAX_PARTY = 4;
/** Precio de un mercenario por nivel del grupo (po). */
const HIRE_PRICE_PER_LEVEL = 20;
/** Tonos de respuesta que se cuentan en st.tone (los usa el narrador). */
const TONES = ['amable', 'sarcastico', 'frio'];
/** Opción única «Continuar». */
const CONTINUE_OPTION = { text: 'Continuar', kind: 'continue' };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const toList = (value) => (value == null ? [] : Array.isArray(value) ? value : [value]);
/** Motor de diálogos y efectos de historia sobre la campaña del núcleo (game.store.cp). */
const StoryRunner = class {
  constructor(game, data, opts = {}) {
    ((this.game = game),
      (this.data = data),
      (this.dialogs = data.dialogs || {}),
      (this.now = opts.now || (() => (typeof performance < 'u' ? performance.now() : Date.now()))),
      (this.rnd = opts.random || Math.random),
      (this.active = null),
      (this.ctx = {}),
      (this.stealthNow = () => !!this._stealth),
      (this._stealth = !1),
      (this._pendingReactions = []),
      (this._deferred = []),
      (this._groupCooldown = new Map()),
      (this._lastBanter = -1e9),
      (this._lastRest = -1e9),
      (this._afterHandled = new Set()),
      (this._battleSeq = 0),
      (this._portraits = new Map()),
      (this.debug = { rollMode: 'real', log: null }),
      (this.narrator = null));
  }
  get store() {
    return this.game.store;
  }
  get cp() {
    return this.game.store?.cp || null;
  }
  /** Estado de historia de la partida (cp.story), con todos sus apartados creados. */
  get st() {
    let cp = this.cp;
    if (!cp)
      return {
        quests: {},
        approval: {},
        decisions: {},
        seen: {},
        tried: {},
        banter: {},
        camp: {},
        tone: {},
        narr: {},
        vars: {},
        once: {},
        journal: {},
        tips: {},
        codex: {},
      };
    cp.story ??= {};
    let st = cp.story;
    st.v ??= 1;
    for (let key of [
      'quests',
      'approval',
      'decisions',
      'seen',
      'tried',
      'banter',
      'camp',
      'tone',
      'narr',
      'vars',
      'once',
      'journal',
      'tips',
      'codex',
    ])
      st[key] ??= {};
    for (let id of COMPANION_IDS) st.approval[id] === void 0 && (st.approval[id] = this.data.companions?.[id]?.start ?? 0);
    return st;
  }
  log(...parts) {
    this.debug.log?.(parts.join(' '));
  }
  /** Valor de una bandera. */
  flag(name) {
    return this.cp?.flags?.[name];
  }
  /** Pone una bandera (a través del store, que emite «flag:set»). */
  setFlag(name, value = !0) {
    this.cp && (this.store.setFlag(name, value), this.log('flag', name, '=', JSON.stringify(value)));
  }
  /** Hoja del héroe (o del primer miembro). */
  hero() {
    let cp = this.cp;
    return cp?.members?.hero || (cp?.party?.[0] ? cp.members?.[cp.party[0]] : null) || {};
  }
  party() {
    return this.cp?.party || [];
  }
  /** ¿Está en el grupo y vivo? */
  inParty(id) {
    return this.party().includes(id) && !this.isDead(id);
  }
  isDead(id) {
    return !!this.cp?.state?.[id]?.dead;
  }
  partySize() {
    return this.party().length;
  }
  gold() {
    return this.cp?.gold ?? 0;
  }
  level() {
    return this.cp?.party_level ?? 1;
  }
  day() {
    return this.cp?.day ?? 1;
  }
  /** Nivel actual (del contexto del diálogo, de la exploración o de la partida). */
  levelId() {
    return this.ctx?.level || this.game.explore?.level?.id || this.cp?.location?.level || '';
  }
  get vars() {
    return this.st.vars;
  }
  /** Unidades de un objeto entre todo el grupo (objetos, mochila y munición). */
  itemCount(item) {
    let count = 0;
    for (let id of this.party()) {
      let member = this.cp.members?.[id];
      if (member) {
        count += Number(member.items?.[item] || 0);
        for (let entry of member.pack || []) entry?.id === item && count++;
        member.ammo && item in member.ammo && (count += Number(member.ammo[item] || 0));
      }
    }
    return count;
  }
  approval(id) {
    return this.st.approval[id] ?? 0;
  }
  seen(key) {
    return this.st.seen[key] || 0;
  }
  tried(key) {
    return this.st.tried[key];
  }
  knows(kind, id) {
    return !!this.st.codex?.[kind]?.[id];
  }
  quest(id) {
    return this.questState(id);
  }
  /** Evalúa una condición con `ctx` como contexto («ctx:x»); los errores cuentan como falso. */
  test(cond, ctx = this.ctx) {
    if (cond == null || cond === '') return !0;
    let prevCtx = this.ctx;
    this.ctx = ctx || {};
    try {
      return evalCondition(cond, this);
    } catch (err) {
      return (console.warn('[historia] condici\xF3n:', cond, err.message), !1);
    } finally {
      this.ctx = prevCtx;
    }
  }
  /** Texto con plantillas: cadena, {if, text} o lista de ellos (une los que se cumplen). */
  text(value) {
    return Array.isArray(value)
      ? value
          .filter((part) => typeof part == 'string' || this.test(part.if))
          .map((part) => formatText(typeof part == 'string' ? part : part.text, this))
          .filter(Boolean).join(`

`)
      : value && typeof value == 'object'
        ? this.test(value.if)
          ? formatText(value.text, this)
          : ''
        : formatText(value, this);
  }
  /** Nombre corto, completo y título de un compañero. */
  companion(id) {
    let def = this.data.companions?.[id],
      member = this.cp?.members?.[id];
    return {
      id,
      name: def?.short || member?.name?.split(' ')[0] || id,
      full: def?.name || member?.name || id,
      title: def?.title || member?.title || '',
    };
  }
  /** Nombre para mostrar de cualquier miembro. */
  name(id) {
    return id === 'hero'
      ? this.hero().name || 'T\xFA'
      : COMPANION_IDS.includes(id)
        ? this.companion(id).name
        : this.cp?.members?.[id]?.name || id;
  }
  /** Llama al núcleo de reglas; nunca lanza: devuelve {error} si falla. */
  rules(op, args) {
    let api = this.game.api;
    try {
      let res;
      return (
        api?.call
          ? (res = api.call(op, args))
          : this.game.rules
            ? (res = this.game.rules(op, args))
            : (res = { error: 'sin n\xFAcleo' }),
        res || { error: 'sin respuesta' }
      );
    } catch (err) {
      return { error: String(err?.message || err) };
    }
  }
  /** Si la respuesta trae campaña, la guarda en el store. */
  applyCp(res) {
    res?.cp && !res.error && this.store.set(res.cp);
  }
  /** Estado de una misión según sus condiciones: none, active, done o failed. */
  questState(id) {
    let quest = this.data.quests?.[id];
    return quest
      ? quest.fail && this.test(quest.fail, {})
        ? 'failed'
        : quest.done && this.test(quest.done, {})
          ? 'done'
          : this.test(quest.start, {})
            ? 'active'
            : 'none'
      : 'none';
  }
  /** Misiones visibles para el diario (activas primero, luego las principales). */
  quests() {
    let list = [];
    for (let [id, quest] of Object.entries(this.data.quests || {})) {
      let state = this.questState(id);
      if (state === 'none') continue;
      let steps = (quest.steps || [])
          .filter((step) => this.test(step.show ?? quest.start, {}))
          .map((step) => ({
            id: step.id,
            text: this.text(step.text),
            done: step.done ? this.test(step.done, {}) : !1,
            optional: !!step.optional,
          })),
        outcome = (quest.outcomes || []).find((candidate) => this.test(candidate.if, {}));
      list.push({
        id,
        name: quest.name,
        main: !!quest.main,
        state,
        desc: this.text(quest.desc),
        steps,
        outcome: state === 'active' ? null : outcome ? this.text(outcome.text) : null,
      });
    }
    return list.sort(
      (x, y) =>
        (x.state === 'active' ? 0 : 1) - (y.state === 'active' ? 0 : 1) ||
        (y.main ? 1 : 0) - (x.main ? 1 : 0),
    );
  }
  /** Apunta pasos y cambios de estado de las misiones (avisos, diario y «quest:update»). */
  syncQuests() {
    if (!this.cp) return;
    let st = this.st;
    for (let [id, quest] of Object.entries(this.data.quests || {})) {
      let state = this.questState(id),
        saved = (st.quests[id] ??= { state: 'none', steps: {} });
      for (let step of quest.steps || [])
        !step.id ||
          saved.steps[step.id] ||
          !step.done ||
          state === 'none' ||
          (this.test(step.done, {}) &&
            ((saved.steps[step.id] = this.day()),
            step.journal && this.journal(this.text(step.journal), `${id}.${step.id}`),
            this.game.bus?.emit('quest:update', { id, state, step: step.id })));
      if (saved.state === state) continue;
      let old = saved.state;
      if (
        ((saved.state = state),
        this.game.bus?.emit('quest:update', { id, state, step: null, old }),
        state === 'active' && old === 'none')
      )
        (this.toast(`Misi\xF3n nueva: ${quest.name}`, 'info'),
          quest.journal && this.journal(this.text(quest.journal), `${id}.start`));
      else if (state === 'done') {
        this.toast(`Misi\xF3n completada: ${quest.name}`, 'bien');
        let outcome = (quest.outcomes || []).find((candidate) => this.test(candidate.if, {}));
        outcome?.journal && this.journal(this.text(outcome.journal), `${id}.end`);
      } else
        state === 'failed' &&
          (this.toast(`Misi\xF3n fallida: ${quest.name}`, 'mal'),
          quest.failJournal && this.journal(this.text(quest.failJournal), `${id}.fail`));
    }
  }
  /** Añade una entrada al diario una sola vez (por `key` o por el principio del texto). */
  journal(text, key = null) {
    if (!this.cp || !text) return;
    let entryKey = key || text.slice(0, 60);
    this.st.journal[entryKey] ||
      ((this.st.journal[entryKey] = this.day()),
      (this.cp.journal ??= []),
      this.cp.journal.includes(text) || this.cp.journal.push(text),
      this.game.bus?.emit('journal:add', { text, key: entryKey }));
  }
  /** Cambia la aprobación de un compañero (o de todos, «all»); a −50 o menos, se irá del grupo. */
  approve(who, delta, { silent = !1 } = {}) {
    if (!delta) return;
    let ids = who === 'all' ? COMPANION_IDS.filter((id) => this.inParty(id)) : [who];
    for (let id of ids) {
      if (!COMPANION_IDS.includes(id) || this.flag(`${id}_left`) || (id === 'ilyra' && this.flag('ilyra_dead'))) continue;
      let st = this.st,
        value = clamp((st.approval[id] ?? 0) + delta, -100, 100);
      ((st.approval[id] = value),
        this.game.bus?.emit('approval', { who: id, delta, value }),
        this.log('aprobaci\xF3n', id, delta > 0 ? `+${delta}` : delta, '\u2192', value),
        this.inParty(id) &&
          !silent &&
          this.toast(
            `${this.companion(id).name} ${delta > 0 ? 'lo aprueba' : 'no lo aprueba'}.`,
            delta > 0 ? 'bien' : 'mal',
          ),
        value <= -50 &&
          this.inParty(id) &&
          !this._pendingLeave?.includes(id) &&
          (this._pendingLeave ??= []).push(id));
    }
  }
  /** Ánimo de un compañero según su aprobación. */
  mood(id) {
    let value = this.approval(id);
    return value >= 60
      ? 'Leal'
      : value >= 25
        ? 'Amistoso'
        : value > -10
          ? 'Neutral'
          : value > -35
            ? 'Molesto'
            : 'A punto de irse';
  }
  /** Compañeros conocidos con su aprobación y estado (pantalla de grupo). */
  companions() {
    return COMPANION_IDS
      .filter((id) => this.cp?.members?.[id] || this.flag(`${id}_joined`))
      .map((id) => ({
        id,
        name: this.companion(id).full,
        approval: this.approval(id),
        mood: this.mood(id),
        inParty: this.inParty(id),
        waiting: !!this.flag(`${id}_waiting`),
        left: !!this.flag(`${id}_left`),
      }));
  }
  /** Une un compañero; si el grupo está lleno, pregunta quién espera en la posada. */
  async recruit(id) {
    if (this.inParty(id) || !this.cp) return !0;
    if (this.party().length >= MAX_PARTY) {
      let companions = this.party().filter((memberId) => memberId !== 'hero' && COMPANION_IDS.includes(memberId)),
        mercs = this.mercs(),
        options = companions.map((memberId) => ({ text: `Que ${this.companion(memberId).name} espere en la posada de Merrowick.` }));
      for (let merc of mercs) options.push({ text: `Despedir a ${this.memberName(merc)}, que se pag\xF3 por adelantado.` });
      options.push({ text: `Que ${this.companion(id).name} espere en la posada de Merrowick.` });
      let choice = await this.show({
        speaker: '',
        text: '*El grupo est\xE1 completo: como mucho viaj\xE1is cuatro. Alguien tendr\xE1 que esperar en la posada del Toro Dormido.*',
        options,
      });
      if (choice >= companions.length && choice < companions.length + mercs.length) await this.fireMerc(mercs[choice - companions.length]);
      else {
        let other = companions[choice];
        if (!other)
          return (
            this.setFlag(`${id}_waiting`, !0),
            this.toast(`${this.companion(id).name} os esperar\xE1 en la posada.`, 'info'),
            !1
          );
        await this.sendToInn(other);
      }
    }
    let res = this.rules('cp_recruit', { cp: this.cp, id });
    if (res?.error || res?.ok === !1) {
      res?.reason && console.warn('[historia] cp_recruit:', res.reason);
      let cp = this.cp;
      ((cp.members[id] ??= { ...(this.data.partySheets?.[id] || { name: this.companion(id).full }), id }),
        cp.party.includes(id) || cp.party.push(id),
        (cp.state ??= {}),
        (cp.state[id] ??= { hp: 10, dead: !1 }),
        this.store.set(cp));
    } else this.applyCp(res);
    (this.setFlag(`${id}_joined`, !0), this.flag(`${id}_waiting`) && this.setFlag(`${id}_waiting`, !1));
    try {
      this.game.explore?.addCompanion?.(id);
    } catch (err) {
      console.warn(err);
    }
    return (
      this.game.bus?.emit('companion:join', { id }),
      this.toast(`${this.companion(id).full} se une al grupo.`, 'bien'),
      !0
    );
  }
  /** Saca a un miembro del grupo (`left`: se marcha para siempre). */
  async dismiss(id, { left = !1 } = {}) {
    if (!this.party().includes(id)) return;
    let res = this.rules('cp_dismiss', { cp: this.cp, id });
    if (res?.error) {
      let cp = this.cp;
      ((cp.party = cp.party.filter((member) => member !== id)), this.store.set(cp));
    } else this.applyCp(res);
    try {
      this.game.explore?.removeCompanion?.(id);
    } catch (err) {
      console.warn(err);
    }
    (left && this.setFlag(`${id}_left`, !0), this.game.bus?.emit('companion:leave', { id, left }));
  }
  /** Precio de un mercenario. */
  hirePrice() {
    return HIRE_PRICE_PER_LEVEL * Math.max(1, this.level());
  }
  /** ¿Es un mercenario? */
  isMerc(id) {
    return id !== 'hero' && !COMPANION_IDS.includes(id) && (!!this.cp?.members?.[id]?.mercenary || /^merc_/.test(id));
  }
  mercs() {
    return this.party().filter((id) => this.isMerc(id));
  }
  memberName(id) {
    return this.cp?.members?.[id]?.name || this.companion(id)?.name || id;
  }
  /** Contrata un mercenario con el creador («creador» en modo mercenario); devuelve su id o null. */
  async hire() {
    let ui = this.game.ui,
      price = this.hirePrice();
    if (!this.cp) return null;
    if (this.party().length >= MAX_PARTY)
      return (this.toast('El grupo est\xE1 completo: como mucho viaj\xE1is cuatro.', 'mal'), null);
    if (this.gold() < price) return (this.toast(`Un mercenario cuesta ${price} po y no os llega.`, 'mal'), null);
    if (!(typeof ui?.has == 'function' ? ui.has('creador') : !!ui?.open))
      return (this.toast('No hay creador de mercenarios en esta versi\xF3n.', 'mal'), null);
    let before = new Set(this.party()),
      result = null;
    try {
      result = await ui.open('creador', { mode: 'mercenario', title: 'Nuevo mercenario', price });
    } catch (err) {
      if (err?.abort) throw err;
      console.warn('[historia] creador de mercenarios:', err);
    }
    let newId = this.party().find((id) => !before.has(id));
    if (!result || !newId) return null;
    (await this.gainGold(-price),
      (this.st.vars.mercs_hired = (Number(this.st.vars.mercs_hired) || 0) + 1),
      this.journal(
        `Contratamos a ${this.memberName(newId)} en el tabl\xF3n del Toro Dormido por ${price} piezas de oro.`,
        `merc.${newId}`,
      ));
    try {
      await this.game.explore?.addCompanion?.(newId);
    } catch (err) {
      console.warn(err);
    }
    return newId;
  }
  /** Despide a un mercenario y lo borra de la campaña. */
  async fireMerc(id) {
    if (!this.isMerc(id) || !this.party().includes(id)) return !1;
    let name = this.memberName(id);
    await this.dismiss(id);
    let cp = this.cp;
    return (
      delete cp.members?.[id],
      cp.state && delete cp.state[id],
      this.store.set?.(cp),
      this.toast(`${name} recoge sus cosas y se despide.`, 'info'),
      !0
    );
  }
  /** Manda a un compañero a esperar en la posada de Merrowick. */
  async sendToInn(id) {
    (await this.dismiss(id),
      this.setFlag(`${id}_waiting`, !0),
      this.toast(`${this.companion(id).name} os esperar\xE1 en la posada.`, 'info'));
  }
  /** Despide a los compañeros pendientes de irse (aprobación muy baja). */
  async flushLeaves() {
    let pending = this._pendingLeave || [];
    this._pendingLeave = [];
    for (let id of pending) {
      if (!this.inParty(id)) continue;
      let def = this.data.companions?.[id];
      (await this.show({
        speaker: this.companion(id).full,
        title: this.companion(id).title,
        who: id,
        portrait: await this.portrait(id),
        text: this.text(def?.leave || '\xABHasta aqu\xED he llegado.\xBB'),
        options: [{ text: 'Dejarle marchar.', kind: 'end' }],
      }),
        await this.dismiss(id, { left: !0 }),
        this.toast(`${this.companion(id).name} ha dejado el grupo.`, 'mal'));
    }
  }
  /** Registra una decisión y aplica las reacciones de los compañeros (datos reactions). */
  decide(id, choice) {
    let st = this.st;
    if (st.decisions[id] === choice) return;
    ((st.decisions[id] = choice), this.setFlag(id, choice), this.game.bus?.emit('decision', { id, choice }));
    let key = choice === !0 ? id : `${id}=${choice}`;
    for (let reaction of toList(this.data.reactions?.[key]))
      (reaction.if && !this.test(reaction.if, {})) ||
        (this.approve(reaction.who, reaction.delta || 0, { silent: !0 }),
        this.inParty(reaction.who) &&
          reaction.text &&
          this._pendingReactions.push({ who: reaction.who, text: reaction.text, delta: reaction.delta || 0 }));
  }
  /** Muestra las reacciones de los compañeros pendientes. */
  async flushReactions() {
    let pending = this._pendingReactions.splice(0);
    for (let reaction of pending) {
      let companion = this.companion(reaction.who);
      (await this.show({
        speaker: companion.name,
        title: companion.title,
        who: reaction.who,
        portrait: await this.portrait(reaction.who),
        text: this.text(reaction.text),
        options: [CONTINUE_OPTION],
      }),
        reaction.delta &&
          this.toast(
            `${companion.name} ${reaction.delta > 0 ? 'lo aprueba' : 'no lo aprueba'}.`,
            reaction.delta > 0 ? 'bien' : 'mal',
          ));
    }
  }
  toast(text, kind = 'info') {
    try {
      this.game.ui?.toast?.(text, kind);
    } catch {}
  }
  /** Retrato de un personaje (game.portrait), cacheado. */
  async portrait(id) {
    if (!id) return null;
    if (this._portraits.has(id)) return this._portraits.get(id);
    let img = null;
    try {
      let render = this.game.portrait || this.game.ui?.portrait;
      typeof render == 'function' && (img = (await render(id)) || null);
    } catch {
      img = null;
    }
    return (img && this._portraits.set(id, img), img);
  }
  /**
   * Muestra una pieza de diálogo con sus opciones (game.ui.dialog).
   * @returns {Promise<number>} índice de la opción elegida
   */
  async show(spec) {
    let ui = this.game.ui,
      options = spec.options?.length ? spec.options : [CONTINUE_OPTION],
      view = { speaker: '', title: '', portrait: null, ...spec, options };
    typeof view.text == 'string' && view.text.includes('*') && (view.text = balanceAsterisks(view.text));
    let checks = options.filter((opt) => opt.kind === 'check').length,
      specials = options.filter((opt) => opt.kind === 'special').length,
      tones = options.filter((opt) => opt.tone).length;
    (checks || specials || tones) && this.game.bus?.emit('story:options', { checks, specials, tones });
    let choice = 0;
    try {
      choice = Number(await ui.dialog(view));
    } catch (err) {
      if (err?.abort) throw err;
      (console.warn('[historia] ui.dialog:', err), (choice = options.length - 1));
    }
    return ((choice >= 0 && choice < options.length) || (choice = options.length - 1), choice);
  }
  /** Muestra líneas de narración como una sola pieza. */
  async narrateLines(lines, { title = '', last = null } = {}) {
    let texts = toList(lines)
      .map((line) => this.text(line))
      .filter(Boolean);
    if (!texts.length) return;
    let text = narrationParagraphs(texts).join(`

`);
    await this.show({ speaker: '', title, text, options: [last || CONTINUE_OPTION] });
  }
  /** ¿Existe el diálogo? */
  has(id) {
    return !!this.dialogs[id];
  }
  /** Nodo inicial del diálogo según sus condiciones de inicio. */
  pickStart(dialog, ctx) {
    for (let start of toList(dialog.start)) {
      if (typeof start == 'string') return start;
      if (this.test(start.if, ctx)) return start.goto;
    }
    return Object.keys(dialog.nodes || {})[0];
  }
  /**
   * Ejecuta un diálogo completo (nodo a nodo, máximo 200) y después los efectos aplazados.
   * Un nodo «@dialogo.nodo» salta a otro diálogo.
   * @returns {Promise<boolean>} false si no existe, no hay partida o ya hay otro abierto
   */
  async run(id, ctx = {}, startNode = null) {
    let dialog = this.dialogs[id];
    if (!dialog || !this.cp) return !1;
    if (this.active)
      return (
        console.warn(`[historia] ya hay una conversaci\xF3n abierta (${this.active}); ignoro ${id}`),
        !1
      );
    ((this.active = id),
      (this.ctx = { ...ctx, level: ctx.level || this.levelId() }),
      (this._proceed = !1),
      this.game.bus?.emit('dialog:open', { id, npc: dialog.npc || id, important: !!(dialog.important ?? dialog.camp) }));
    try {
      this.game.explore?.busy?.(!0);
    } catch {}
    let nodeId = startNode || this.pickStart(dialog, this.ctx),
      roll,
      guard = 0;
    try {
      for (; nodeId && nodeId !== 'end' && guard++ < 200;) {
        if (nodeId.startsWith('@')) {
          let [dialogId, nodeRef] = nodeId.slice(1).split('.');
          if (((dialog = this.dialogs[dialogId]), !dialog)) break;
          nodeId = nodeRef || this.pickStart(dialog, this.ctx);
          continue;
        }
        let node = dialog.nodes?.[nodeId];
        if (!node) {
          console.warn(`[historia] nodo inexistente ${dialog.id}.${nodeId}`);
          break;
        }
        let nodeKey = `${dialog.id}.${nodeId}`;
        ((this._at = nodeKey), (this.st.seen[nodeKey] = (this.st.seen[nodeKey] || 0) + 1));
        let redirect = toList(node.redirect).find((rule) => this.test(rule.if));
        if (redirect) {
          nodeId = redirect.goto;
          continue;
        }
        let result = await this.apply(node.do);
        if (result.end) break;
        if (result.goto) {
          nodeId = result.goto;
          continue;
        }
        let pieces = await this.pieces(dialog, node),
          options = result.deferredEnd ? [] : this.options(dialog, nodeId, node);
        for (let k = 0; k < pieces.length - 1; k++)
          (await this.show({ ...pieces[k], roll: k === 0 ? roll : void 0, options: [CONTINUE_OPTION] }), (roll = void 0));
        let last = pieces[pieces.length - 1] || { speaker: '', text: '' };
        if (!options.length) {
          let nextId = result.deferredEnd ? null : node.next,
            endOption = nextId ? CONTINUE_OPTION : { text: node.endText || 'Continuar', kind: 'end' };
          (await this.show({ ...last, roll: pieces.length === 1 ? roll : void 0, options: [endOption] }),
            (roll = void 0),
            await this.apply(node.then),
            await this.flushReactions(),
            (nodeId = nextId || 'end'));
          continue;
        }
        let choice = await this.show({ ...last, roll: pieces.length === 1 ? roll : void 0, options: options.map((opt) => opt.view) });
        ((roll = void 0), await this.apply(node.then));
        let picked = options[choice],
          outcome = await this.choose(dialog, nodeId, picked);
        if ((await this.flushReactions(), outcome.end)) break;
        ((roll = outcome.roll), (nodeId = outcome.goto));
      }
    } finally {
      ((this.active = null), (this.ctx = {}), this.game.bus?.emit('dialog:close', { id }));
      try {
        this.game.explore?.busy?.(!1);
      } catch {}
    }
    (await this.flushReactions(), await this.flushLeaves(), this.syncQuests());
    try {
      this._needRefresh && this.game.explore?.refresh?.();
    } catch (err) {
      console.warn(err);
    }
    this._needRefresh = !1;
    let deferred = this._deferred.splice(0);
    for (let deferredEffect of deferred) await this.runDeferred(deferredEffect);
    return (this.syncQuests(), !0);
  }
  /** Piezas de un nodo: intervenciones «before», el texto del nodo y las «after». */
  async pieces(dialog, node) {
    let out = [],
      who = node.who || null,
      speaker = who ? this.companion(who).name : node.speaker !== void 0 ? node.speaker : dialog.speaker,
      silent = !who && node.speaker === '',
      title = who ? this.companion(who).title : node.title !== void 0 ? node.title : silent ? '' : dialog.title,
      portraitId = who || node.portrait || dialog.portrait || dialog.npc || dialog.id,
      text = this.text(node.text),
      main = text
        ? {
            speaker: this.text(speaker || ''),
            title: this.text(title || ''),
            who: who || void 0,
            npc: !who && speaker ? portraitId : void 0,
            portrait: speaker ? await this.portrait(portraitId) : null,
            text,
          }
        : null,
      before = [],
      after = [];
    for (let line of toList(node.say)) {
      if (!this.inParty(line.who) || !this.test(line.if)) continue;
      let companion = this.companion(line.who),
        piece = {
          speaker: companion.name,
          title: companion.title,
          who: line.who,
          portrait: await this.portrait(line.who),
          text: this.text(line.text),
        },
        bucket = line.at === 'before' ? before : after;
      if ((bucket.push(piece), line.approve)) for (let [companionId, delta] of Object.entries(line.approve)) this.approve(companionId, delta);
      line.reply && main && bucket.push({ ...main, text: this.text(line.reply) });
    }
    return (
      out.push(...before),
      main && out.push(main),
      out.push(...after),
      out.length || out.push({ speaker: '', text: '\u2026' }),
      out
    );
  }
  /** Prueba de una opción: «habilidad:CD[:quien]» u objeto. */
  checkSpec(spec) {
    if (!spec) return null;
    if (typeof spec == 'string') {
      let [skill, dc, who] = spec.split(':');
      return { skill, dc: Number(dc), who: who || 'hero' };
    }
    return { who: 'hero', ...spec };
  }
  /** CD de una prueba con sus ajustes «easier»/«harder» condicionales. */
  dcOf(spec) {
    let dc = Number(spec.dc ?? 10);
    for (let mod of toList(spec.easier)) this.test(mod.if) && (dc = Math.min(dc, Number(mod.dc)));
    for (let mod of toList(spec.harder)) this.test(mod.if) && (dc = Math.max(dc, Number(mod.dc)));
    return dc;
  }
  /** Coste en oro de una opción («party*N»: N por miembro). */
  costOf(option) {
    if (!option.cost) return 0;
    if (typeof option.cost == 'number') return option.cost;
    let match = /^party\*(\d+)$/.exec(String(option.cost));
    return match ? this.partySize() * Number(match[1]) : Number(option.cost) || 0;
  }
  /** Opciones visibles de un nodo con su etiqueta ([Habilidad CD], [Mago], [N po]…). */
  options(dialog, nodeId, node) {
    let out = [],
      source = node.optionsFrom ? dialog.nodes?.[node.optionsFrom] : node,
      sourceId = node.optionsFrom || nodeId;
    return (
      toList(source?.options)
        .flatMap((opt, index) =>
          opt.each
            ? this.eachOf(opt.each).map((item) => ({
                ...this.bindEach(opt, item),
                key: `${opt.key || `${dialog.id}.${sourceId}.${index}`}.${item.id}`,
              }))
            : [{ ...opt, key: opt.key || `${dialog.id}.${sourceId}.${index}` }],
        )
        .forEach((opt) => {
          let key = opt.key,
            check = this.checkSpec(opt.check);
          if (
            (check && check.who && !['hero', 'best', 'group'].includes(check.who) && !this.inParty(check.who)) ||
            !this.test(opt.if)
          )
            return;
          let cost = this.costOf(opt);
          if (cost && this.gold() < cost) return;
          let price = opt.price === 'hire' ? this.hirePrice() : Number(opt.price) || 0;
          if (
            (price && this.gold() < price) ||
            ((opt.once || (check && opt.once !== !1)) && (this.st.once[key] || this.st.tried[key]))
          )
            return;
          let tag = opt.tag || null,
            kind = opt.end ? 'end' : null;
          if (check) {
            let skillName = check.skill
              ? SKILL_NAMES[check.skill] || check.skill
              : check.ability
                ? ABILITY_NAMES[check.ability]
                : check.save
                  ? `Salvaci\xF3n de ${ABILITY_NAMES[check.save]}`
                  : '?';
            ((tag = `[${check.who === 'hero' || check.who === 'best' ? '' : check.who === 'group' ? 'Grupo \xB7 ' : `${this.companion(check.who).name} \xB7 `}${skillName} CD ${this.dcOf(check)}]`),
              (kind = 'check'));
          } else if (!tag && typeof opt.special == 'string') ((tag = `[${opt.special}]`), (kind = 'special'));
          else if (!tag && opt.if && opt.special !== !1) {
            for (let atom of conditionAtoms(opt.if)) {
              let atomTag = conditionTag(atom);
              if (atomTag && !opt.if.startsWith('!')) {
                tag = atomTag;
                break;
              }
            }
            tag && (kind = 'special');
          }
          (opt.special && opt.special !== !0 && !tag && (tag = `[${opt.special}]`),
            opt.special && !check && (kind = 'special'),
            (cost || price) && (tag = `${tag ? tag + ' ' : ''}[${cost || price} po]`),
            opt.free && (tag = `${tag ? tag + ' ' : ''}[${opt.free}]`));
          let view = { text: this.text(opt.text), tag, kind };
          (opt.tone && TONES.includes(opt.tone) && (view.tone = opt.tone),
            out.push({ ...opt, key, spec: check, view, cost }));
        }),
      out
    );
  }
  /** Elementos de una opción plantilla («merc» o «companion»). */
  eachOf(kind) {
    return kind === 'merc'
      ? this.mercs().map((id) => ({ id, name: this.memberName(id) }))
      : kind === 'companion'
        ? this.party()
            .filter((id) => COMPANION_IDS.includes(id))
            .map((id) => ({ id, name: this.companion(id).name }))
        : [];
  }
  /** Copia la opción sustituyendo {each:id} y {each:name}. */
  bindEach(option, item) {
    let bind = (value) =>
        typeof value == 'string'
          ? value.replace(/\{each:id\}/g, item.id).replace(/\{each:name\}/g, item.name)
          : Array.isArray(value)
            ? value.map(bind)
            : value && typeof value == 'object'
              ? Object.fromEntries(Object.entries(value).map(([key, v]) => [key, bind(v)]))
              : value,
      { each, ...rest } = option;
    return bind(rest);
  }
  /** Aplica la opción elegida (tono, coste, aprobación, efectos, prueba) y devuelve {goto} o {end}. */
  async choose(dialog, nodeId, option) {
    let st = this.st;
    if (
      (option.tone && (st.tone[option.tone] = (st.tone[option.tone] || 0) + 1),
      option.once && (st.once[option.key] = 1),
      option.cost && (await this.gainGold(-this.costOf(option))),
      option.approve)
    )
      for (let [who, delta] of Object.entries(option.approve)) this.approve(who, delta);
    let result = await this.apply(option.do);
    if (result.end || result.deferredEnd) return { end: !0 };
    if (result.goto) return { goto: result.goto };
    if (option.spec) {
      let roll = await this.check(option.spec);
      st.tried[option.key] = roll.success ? 'ok' : 'fail';
      let next = roll.success ? option.success : option.failure,
        after = await this.apply(roll.success ? option.onSuccess : option.onFailure);
      return after.end || after.deferredEnd ? { end: !0, roll } : { goto: after.goto || next || 'end', roll };
    }
    return option.end ? { end: !0 } : { goto: option.goto || 'end' };
  }
  /**
   * Tira una prueba (núcleo `check`/`group_check`/`best`, o tirada propia si falla) y emite «story:roll».
   * `who`: un id, «hero», «best» (el mejor del grupo) o «group» (prueba de grupo).
   */
  async check(spec) {
    spec = this.checkSpec(spec);
    let cp = this.cp,
      dc = this.dcOf(spec),
      adv = spec.adv ? this.test(spec.adv) : !1,
      dis = spec.dis ? this.test(spec.dis) : !1,
      who = spec.who || 'hero',
      roll;
    if (who === 'group') {
      let res = this.rules('group_check', { cp, skill: spec.skill, dc });
      if (!res?.error && res?.results)
        roll = {
          ...(res.results.slice().sort((x, y) => y.total - x.total)[0] || {}),
          who: 'Grupo',
          label: `${SKILL_NAMES[spec.skill] || spec.skill} (grupo)`,
          dc,
          success: !!res.success,
          group: res.results,
        };
      else {
        let rolls = this.party()
            .filter((id) => !this.isDead(id))
            .map((id) => this.fallbackCheck(id, spec, dc, adv, dis)),
          success = rolls.filter((entry) => entry.success).length * 2 >= rolls.length;
        roll = {
          ...(rolls.slice().sort((x, y) => y.total - x.total)[0] || {}),
          who: 'Grupo',
          label: `${SKILL_NAMES[spec.skill] || spec.skill} (grupo)`,
          dc,
          success,
          group: rolls,
          provisional: !0,
        };
      }
    } else {
      if (who === 'best') {
        let best = spec.skill ? this.rules('best', { cp, skill: spec.skill }) : { error: 'sin habilidad' };
        if (!best?.error && best?.who) who = best.who;
        else {
          let bestMod = -99;
          for (let id of this.party()) {
            if (this.isDead(id)) continue;
            let mod = this.fallbackMod(id, spec);
            mod > bestMod && ((bestMod = mod), (who = id));
          }
          who === 'best' && (who = 'hero');
        }
      }
      let args = { cp, who, dc, adv, dis };
      (spec.skill ? (args.skill = spec.skill) : spec.ability ? (args.ability = spec.ability) : spec.save && (args.save = spec.save),
        spec.tool && (args.tool = spec.tool),
        (roll = this.rules('check', args)),
        (roll?.error || typeof roll?.total != 'number') && (roll = this.fallbackCheck(who, spec, dc, adv, dis)),
        (roll = { ...roll, id: who, who: roll.who && roll.who !== who ? roll.who : this.name(who) }));
    }
    return (
      (roll.dc = dc),
      (roll.label ||= spec.skill ? SKILL_NAMES[spec.skill] : spec.ability ? ABILITY_NAMES[spec.ability] : `Salvaci\xF3n de ${ABILITY_NAMES[spec.save]}`),
      this.debug.rollMode === 'success' &&
        !roll.success &&
        Object.assign(roll, { success: !0, total: Math.max(roll.total ?? 0, dc), forced: !0 }),
      this.debug.rollMode === 'failure' &&
        roll.success &&
        Object.assign(roll, { success: !1, total: Math.min(roll.total ?? 0, dc - 1), forced: !0 }),
      this.log('tirada', roll.who, roll.label, `${roll.total} vs CD ${dc}`, roll.success ? '\xE9xito' : 'fallo'),
      this.game.bus?.emit('story:roll', { roll }),
      roll
    );
  }
  /** Modificador aproximado de un miembro (característica + competencia/pericia) sin el núcleo. */
  fallbackMod(id, spec) {
    let member = this.cp?.members?.[id] || {},
      ability = spec.skill ? SKILL_ABILITIES[spec.skill] : spec.ability || spec.save,
      score = Number(member.final_abilities?.[ability] ?? (member.abilities?.[ability] ?? 10) + Number(member.bg_bonus?.[ability] ?? 0)),
      mod = Math.floor((score - 10) / 2),
      prof = 2 + Math.floor((Math.max(1, this.level()) - 1) / 4);
    return (
      spec.skill && toList(member.skills).includes(spec.skill) && (mod += toList(member.expertise).includes(spec.skill) ? prof * 2 : prof),
      mod
    );
  }
  /** Prueba tirada en JS (d20 con ventaja/desventaja) cuando el núcleo no responde. */
  fallbackCheck(id, spec, dc, adv, dis) {
    let mod = this.fallbackMod(id, spec),
      d1 = 1 + Math.floor(this.rnd() * 20),
      d2 = 1 + Math.floor(this.rnd() * 20),
      dice = adv && !dis ? [d1, d2] : dis && !adv ? [d1, d2] : [d1],
      kept = adv && !dis ? Math.max(d1, d2) : dis && !adv ? Math.min(d1, d2) : d1,
      total = kept + mod;
    return {
      who: this.name(id),
      id,
      label: spec.skill ? SKILL_NAMES[spec.skill] : ABILITY_NAMES[spec.ability || spec.save],
      d20: dice,
      mod,
      total,
      dc,
      success: total >= dc,
      crit: kept === 20,
      provisional: !0,
    };
  }
  /** Aplica una lista de efectos; devuelve {goto}, {end} o {deferredEnd} si alguno corta el diálogo. */
  async apply(effects) {
    let result = {};
    for (let spec of toList(effects)) {
      let effect;
      try {
        effect = parseEffect(spec);
      } catch (err) {
        console.warn('[historia]', err.message);
        continue;
      }
      if (effect.op === 'cond') {
        let sub = await this.apply(this.test(effect.if) ? effect.do : effect.else);
        if ((sub.deferredEnd && (result.deferredEnd = !0), sub.end || sub.goto)) return { ...result, ...sub };
        continue;
      }
      if (effect.op === 'goto') return { goto: effect.node };
      if (effect.op === 'end') return ((result.end = !0), result);
      if (DEFERRED_EFFECTS.has(effect.op)) {
        (this._deferred.push(effect),
          effect.op === 'battle' && (this._groupOutcome = 'battle'),
          effect.op !== 'levelup' && (result.deferredEnd = !0));
        continue;
      }
      await this.effect(effect);
    }
    return result;
  }
  /** Aplica un efecto inmediato (banderas, oro, objetos, compañeros, curación, daño, narración…). */
  async effect(effect) {
    let game = this.game;
    switch (effect.op) {
      case 'set':
        (this.setFlag(effect.flag, effect.value), (this._needRefresh = !0));
        break;
      case 'unset':
        (this.cp?.flags &&
          (delete this.cp.flags[effect.flag], game.bus?.emit('flag:set', { name: effect.flag, value: void 0, old: !0 })),
          (this._needRefresh = !0));
        break;
      case 'inc':
        this.setFlag(effect.flag, Number(this.flag(effect.flag) || 0) + effect.by);
        break;
      case 'var':
        this.st.vars[effect.name] = effect.value;
        break;
      case 'gold':
        await this.gainGold(effect.delta);
        break;
      case 'give':
        this.giveItem(effect.item, effect.n);
        break;
      case 'take':
        this.takeItem(effect.item, effect.n);
        break;
      case 'recruit':
        await this.recruit(effect.who);
        break;
      case 'dismiss':
        await this.dismiss(effect.who, { left: !0 });
        break;
      case 'wait':
        await this.sendToInn(effect.who);
        break;
      case 'fire':
        await this.fireMerc(effect.who);
        break;
      case 'approve':
        this.approve(effect.who, effect.delta);
        break;
      case 'decision':
        (this.decide(effect.id, effect.choice), (this._needRefresh = !0));
        break;
      case 'journal':
        this.journal(this.text(effect.text));
        break;
      case 'toast':
        this.toast(this.text(effect.text), 'info');
        break;
      case 'leave':
        this._groupOutcome = 'leave';
        try {
          await game.explore?.removeGroup?.(effect.group, { flee: !0 });
        } catch (err) {
          if (err?.abort) throw err;
          console.warn(err);
        }
        game.bus?.emit('story:group_left', { group: effect.group });
        break;
      case 'place':
        (this.setFlag(`place_${effect.id}`, !0),
          this.toast(`Nuevo lugar en el mapa: ${this.data.places?.[effect.id] || effect.id}.`, 'info'));
        break;
      case 'object':
        try {
          game.explore?.setObjectState?.(effect.id, effect.state);
        } catch (err) {
          if (err?.abort) throw err;
          console.warn(err);
        }
        this._needRefresh = !0;
        break;
      case 'npc':
        try {
          effect.state === 'hide' && game.explore?.removeNpc?.(effect.id);
        } catch (err) {
          if (err?.abort) throw err;
          console.warn(err);
        }
        this._needRefresh = !0;
        break;
      case 'refresh':
        this._needRefresh = !0;
        break;
      case 'heal': {
        let res = this.rules('cp_heal', { cp: this.cp, id: 'all' });
        if (res?.error) {
          for (let id of this.party()) {
            let state = this.cp.state?.[id];
            state && state.max_hp && !state.dead && (state.hp = state.max_hp);
          }
          this.store.set(this.cp);
        } else this.applyCp(res);
        (this.toast('Las heridas se cierran: todo el grupo recupera sus puntos de golpe.', 'bien'),
          game.bus?.emit('story:healed', {}));
        break;
      }
      case 'identify': {
        let res = this.rules('identify', { cp: this.cp });
        if (res?.error)
          this.toast(
            'La hermana Aldis examina vuestras cosas\u2026 (identificar: pendiente del n\xFAcleo)',
            'info',
          );
        else {
          this.applyCp(res);
          let names = toList(res.identified).map((item) => item.name || item);
          this.toast(names.length ? `Identificado: ${names.join(', ')}.` : 'No hay nada por identificar.', 'info');
        }
        break;
      }
      case 'raise': {
        let res = this.rules('cp_revive', { cp: this.cp, id: effect.who });
        if (!res?.error && res?.cp) {
          (this.applyCp(res), this.toast(`${this.name(effect.who)} vuelve a respirar.`, 'bien'));
          break;
        }
        let state = this.cp?.state?.[effect.who];
        state &&
          ((state.dead = !1),
          (state.hp = Math.max(1, state.hp || 0)),
          this.store.set(this.cp),
          this.toast(`${this.name(effect.who)} vuelve a respirar.`, 'bien'));
        break;
      }
      case 'damage': {
        let target = effect.who === 'actor' ? this.ctx.actor || 'hero' : effect.who === 'leader' ? this.party()[0] : effect.who,
          amount = rollDice(effect.dice, this.rnd),
          saved = !1;
        if (effect.save) {
          let roll = await this.check({ save: effect.save, dc: effect.dc || 12, who: target });
          ((saved = roll.success), saved && (amount = Math.floor(amount / 2)), (this._lastRoll = roll));
        }
        let res = this.rules('cp_damage', { cp: this.cp, id: target, amount, type: effect.type });
        if (res?.error) {
          let state = this.cp.state?.[target];
          state && (state.hp = Math.max(0, (state.hp ?? 10) - amount));
        } else this.applyCp(res);
        (this.toast(
          `${this.name(target)} sufre ${amount} de da\xF1o${saved ? ' (se aparta a tiempo: la mitad)' : ''}.`,
          'mal',
        ),
          game.bus?.emit('story:damage', { who: target, amount, type: effect.type }));
        break;
      }
      case 'narrate': {
        let text = await this.narrate(effect.moment, { ...(effect.data || {}), fallback: effect.lines });
        text && (await this.narrateLines([text]));
        break;
      }
      case 'say':
        try {
          game.explore?.say
            ? game.explore.say(effect.who, this.text(effect.text))
            : this.toast(`${this.name(effect.who)}: ${this.text(effect.text)}`, 'info');
        } catch {}
        break;
      case 'sfx':
        try {
          game.audio?.sfx?.(effect.name);
        } catch {}
        game.bus?.emit('story:sfx', { name: effect.name });
        break;
      case 'proceed':
        this._proceed = !0;
        break;
      case 'prefetch':
        this.narrator?.prefetch?.(effect.moment, { key: effect.key || 'final' });
        break;
      default:
        console.warn('[historia] efecto sin implementar:', effect.op);
    }
  }
  /** Ejecuta un efecto aplazado al cerrar el diálogo (combate, tienda, descanso, nivel, viaje…). */
  async runDeferred(effect) {
    let game = this.game;
    switch (effect.op) {
      case 'battle': {
        this._battleSeq++;
        let seq = this._battleSeq,
          outcome = { won: !1, fled: !1 };
        try {
          game.explore?.startBattle
            ? (outcome = (await game.explore.startBattle(effect.group, { surprise: effect.surprise })) || outcome)
            : console.warn('[historia] sin exploraci\xF3n: combate', effect.group, 'no empieza');
        } catch (err) {
          if (err?.abort) throw err;
          console.warn(err);
        }
        !this._afterHandled.has(`${effect.group}#${seq}`) &&
          game.explore?.startBattle &&
          (await this.afterBattle({
            group: effect.group,
            won: !!outcome.won,
            fled: !!outcome.fled,
            level: this.levelId(),
            _seq: seq,
          }));
        break;
      }
      case 'shop':
        await game.ui?.open?.('tienda', { merchant: effect.merchant });
        break;
      case 'rest': {
        let where = effect.where === 'camp' ? 'campamento' : 'posada',
          res = await game.ui?.open?.('descanso', { kind: 'largo', where, paid: !0 });
        res != null && (await this.rest({ kind: 'largo', where }));
        break;
      }
      case 'levelup':
        await this.levelUp(effect.level);
        break;
      case 'hire':
        await this.hire();
        break;
      case 'travel':
        try {
          game.explore?.travel?.(effect.level, effect.spawn);
        } catch (err) {
          if (err?.abort) throw err;
          console.warn(err);
        }
        break;
      case 'epilogue':
        await this.playEpilogue();
        break;
    }
  }
  /** Sube el grupo de nivel (pantalla «nivel» o directamente con el núcleo). */
  async levelUp(level) {
    if (!this.cp || this.level() >= level) return;
    let ui = this.game.ui;
    if (
      (typeof ui?.has == 'function' ? ui.has('nivel') : !!ui?.open) &&
      (await ui.open('nivel', { level }), this.level() >= level)
    )
      return;
    let res = this.rules('cp_level_up', { cp: this.cp, level });
    res?.error ||
      (this.applyCp(res), this.game.bus?.emit('levelup', { level }), this.toast(`\xA1Nivel ${level}!`, 'bien'));
  }
  /** Suma o resta oro y avisa. */
  async gainGold(delta) {
    if (!delta || !this.cp) return;
    let res = this.rules('cp_gold', { cp: this.cp, delta });
    (res?.error
      ? ((this.cp.gold = Math.max(0, (this.cp.gold || 0) + delta)), this.store.set(this.cp))
      : this.applyCp(res),
      this.game.bus?.emit('gold', { delta }),
      this.toast(delta > 0 ? `Recib\xEDs ${delta} po.` : `Pag\xE1is ${-delta} po.`, delta > 0 ? 'botin' : 'info'));
  }
  /** Da objetos al grupo y emite «item:gain». */
  giveItem(item, count = 1) {
    if (!this.cp) return;
    let res = this.rules('cp_give', { cp: this.cp, item, n: count });
    if (res?.error) {
      let member = this.cp.members?.hero || this.cp.members?.[this.party()[0]];
      member && ((member.items ??= {}), (member.items[item] = Number(member.items[item] || 0) + count), this.store.set(this.cp));
    } else this.applyCp(res);
    (this.onLoot?.({ items: [{ id: item, n: count }] }),
      this.game.bus?.emit('item:gain', { id: item, n: count, who: res?.who || 'hero', source: 'story' }));
    let name = this.data.items?.[item]?.name || item;
    this.toast(`Obtenido: ${name}${count > 1 ? ` \xD7${count}` : ''}.`, 'botin');
  }
  /** Quita objetos del grupo: cp_take, si no inv_drop por portador y, si no, a mano. */
  takeItem(item, count = 1) {
    if (!this.cp) return;
    let res = this.rules('cp_take', { cp: this.cp, item, n: count });
    if (!res?.error) {
      this.applyCp(res);
      return;
    }
    let holding = this.rules('has_item', { cp: this.cp, item });
    if (!holding?.error && Array.isArray(holding.holders)) {
      let toDrop = count;
      for (let holder of holding.holders) {
        if (toDrop <= 0) break;
        let take = Math.min(toDrop, Number(holder.n || 1)),
          dropRes = this.rules('inv_drop', { cp: this.cp, who: holder.id, item, n: take });
        !dropRes?.error && dropRes?.ok !== !1 && (this.applyCp(dropRes), (toDrop -= take));
      }
      if (toDrop <= 0) return;
    }
    let remaining = count;
    for (let id of this.party()) {
      let member = this.cp.members?.[id];
      if (!member || remaining <= 0) continue;
      let have = Number(member.items?.[item] || 0);
      if (have > 0) {
        let take = Math.min(have, remaining);
        ((member.items[item] = have - take), member.items[item] || delete member.items[item], (remaining -= take));
      }
      if (remaining > 0 && Array.isArray(member.pack))
        for (let k = member.pack.length - 1; k >= 0 && remaining > 0; k--)
          member.pack[k]?.id === item && (member.pack.splice(k, 1), remaining--);
    }
    this.store.set(this.cp);
  }
  /** Narración de un momento (con IA si hay narrador). */
  async narrate(moment, data = {}) {
    return this.narrator ? this.narrator.narrate(moment, data) : this.narrationFallback(moment, data);
  }
  /** Texto de respaldo de un momento (datos narration.moments o `data.fallback`). */
  narrationFallback(moment, data = {}) {
    if (data.fallback) return this.text(toList(data.fallback));
    let def = this.data.narration?.moments?.[moment];
    if (!def) return '';
    let variant = toList(def.variants).find((v) => this.test(v.if, data.ctx || {}));
    return this.text(toList(variant?.text ?? def.text));
  }
};

export { StoryRunner };
