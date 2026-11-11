// story/runner.js
// Reconstruido de publicado/juego.js (módulo __esm «mE»). Nombres locales aún minificados.

import { conditionAtoms, evalCondition } from './conditions.js';
import { conditionTag, formatText, SKILL_NAMES, SKILL_ABILITIES, ABILITY_NAMES } from './text.js';
import { parseEffect, rollDice, DEFERRED_EFFECTS } from './actions.js';

function DD(o) {
  let e = [];
  for (let t of o) {
    let a = String(t).trim(),
      n = /^\*[^*]+\*$/.test(a);
    n && (a = a.slice(1, -1));
    for (let s of a.split(/\n{2,}/)) {
      if (((s = s.trim()), !s)) continue;
      let i = (s.match(/\*/g) || []).length;
      (n || (!i && !s.startsWith('\xAB'))
        ? (s = `*${s.replace(/^\*+|\*+$/g, '')}*`)
        : i % 2 && (s = s.startsWith('*') ? `${s}*` : `*${s}`),
        e.push(s));
    }
  }
  return e;
}
function ID(o) {
  return String(o)
    .split(/\n{2,}/)
    .map((e) => {
      if (!((e.match(/\*/g) || []).length % 2)) return e;
      let a = e.trim();
      return a.startsWith('*') ? `${a}*` : `*${a}`;
    }).join(`

`);
}
const bi = ['brenna', 'pip', 'ilyra', 'odvar'];
const fE = 4;
const HD = 20;
const ND = ['amable', 'sarcastico', 'frio'];
const _u = { text: 'Continuar', kind: 'continue' };
const FD = (o, e, t) => Math.max(e, Math.min(t, o));
const Ln = (o) => (o == null ? [] : Array.isArray(o) ? o : [o]);
const StoryRunner = class {
  constructor(e, t, a = {}) {
    ((this.game = e),
      (this.data = t),
      (this.dialogs = t.dialogs || {}),
      (this.now = a.now || (() => (typeof performance < 'u' ? performance.now() : Date.now()))),
      (this.rnd = a.random || Math.random),
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
  get st() {
    let e = this.cp;
    if (!e)
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
    e.story ??= {};
    let t = e.story;
    t.v ??= 1;
    for (let a of [
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
      t[a] ??= {};
    for (let a of bi) t.approval[a] === void 0 && (t.approval[a] = this.data.companions?.[a]?.start ?? 0);
    return t;
  }
  log(...e) {
    this.debug.log?.(e.join(' '));
  }
  flag(e) {
    return this.cp?.flags?.[e];
  }
  setFlag(e, t = !0) {
    this.cp && (this.store.setFlag(e, t), this.log('flag', e, '=', JSON.stringify(t)));
  }
  hero() {
    let e = this.cp;
    return e?.members?.hero || (e?.party?.[0] ? e.members?.[e.party[0]] : null) || {};
  }
  party() {
    return this.cp?.party || [];
  }
  inParty(e) {
    return this.party().includes(e) && !this.isDead(e);
  }
  isDead(e) {
    return !!this.cp?.state?.[e]?.dead;
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
  levelId() {
    return this.ctx?.level || this.game.explore?.level?.id || this.cp?.location?.level || '';
  }
  get vars() {
    return this.st.vars;
  }
  itemCount(e) {
    let t = 0;
    for (let a of this.party()) {
      let n = this.cp.members?.[a];
      if (n) {
        t += Number(n.items?.[e] || 0);
        for (let s of n.pack || []) s?.id === e && t++;
        n.ammo && e in n.ammo && (t += Number(n.ammo[e] || 0));
      }
    }
    return t;
  }
  approval(e) {
    return this.st.approval[e] ?? 0;
  }
  seen(e) {
    return this.st.seen[e] || 0;
  }
  tried(e) {
    return this.st.tried[e];
  }
  knows(e, t) {
    return !!this.st.codex?.[e]?.[t];
  }
  quest(e) {
    return this.questState(e);
  }
  test(e, t = this.ctx) {
    if (e == null || e === '') return !0;
    let a = this.ctx;
    this.ctx = t || {};
    try {
      return evalCondition(e, this);
    } catch (n) {
      return (console.warn('[historia] condici\xF3n:', e, n.message), !1);
    } finally {
      this.ctx = a;
    }
  }
  text(e) {
    return Array.isArray(e)
      ? e
          .filter((t) => typeof t == 'string' || this.test(t.if))
          .map((t) => formatText(typeof t == 'string' ? t : t.text, this))
          .filter(Boolean).join(`

`)
      : e && typeof e == 'object'
        ? this.test(e.if)
          ? formatText(e.text, this)
          : ''
        : formatText(e, this);
  }
  companion(e) {
    let t = this.data.companions?.[e],
      a = this.cp?.members?.[e];
    return {
      id: e,
      name: t?.short || a?.name?.split(' ')[0] || e,
      full: t?.name || a?.name || e,
      title: t?.title || a?.title || '',
    };
  }
  name(e) {
    return e === 'hero'
      ? this.hero().name || 'T\xFA'
      : bi.includes(e)
        ? this.companion(e).name
        : this.cp?.members?.[e]?.name || e;
  }
  rules(e, t) {
    let a = this.game.api;
    try {
      let n;
      return (
        a?.call
          ? (n = a.call(e, t))
          : this.game.rules
            ? (n = this.game.rules(e, t))
            : (n = { error: 'sin n\xFAcleo' }),
        n || { error: 'sin respuesta' }
      );
    } catch (n) {
      return { error: String(n?.message || n) };
    }
  }
  applyCp(e) {
    e?.cp && !e.error && this.store.set(e.cp);
  }
  questState(e) {
    let t = this.data.quests?.[e];
    return t
      ? t.fail && this.test(t.fail, {})
        ? 'failed'
        : t.done && this.test(t.done, {})
          ? 'done'
          : this.test(t.start, {})
            ? 'active'
            : 'none'
      : 'none';
  }
  quests() {
    let e = [];
    for (let [t, a] of Object.entries(this.data.quests || {})) {
      let n = this.questState(t);
      if (n === 'none') continue;
      let s = (a.steps || [])
          .filter((r) => this.test(r.show ?? a.start, {}))
          .map((r) => ({
            id: r.id,
            text: this.text(r.text),
            done: r.done ? this.test(r.done, {}) : !1,
            optional: !!r.optional,
          })),
        i = (a.outcomes || []).find((r) => this.test(r.if, {}));
      e.push({
        id: t,
        name: a.name,
        main: !!a.main,
        state: n,
        desc: this.text(a.desc),
        steps: s,
        outcome: n === 'active' ? null : i ? this.text(i.text) : null,
      });
    }
    return e.sort(
      (t, a) =>
        (t.state === 'active' ? 0 : 1) - (a.state === 'active' ? 0 : 1) ||
        (a.main ? 1 : 0) - (t.main ? 1 : 0),
    );
  }
  syncQuests() {
    if (!this.cp) return;
    let e = this.st;
    for (let [t, a] of Object.entries(this.data.quests || {})) {
      let n = this.questState(t),
        s = (e.quests[t] ??= { state: 'none', steps: {} });
      for (let r of a.steps || [])
        !r.id ||
          s.steps[r.id] ||
          !r.done ||
          n === 'none' ||
          (this.test(r.done, {}) &&
            ((s.steps[r.id] = this.day()),
            r.journal && this.journal(this.text(r.journal), `${t}.${r.id}`),
            this.game.bus?.emit('quest:update', { id: t, state: n, step: r.id })));
      if (s.state === n) continue;
      let i = s.state;
      if (
        ((s.state = n),
        this.game.bus?.emit('quest:update', { id: t, state: n, step: null, old: i }),
        n === 'active' && i === 'none')
      )
        (this.toast(`Misi\xF3n nueva: ${a.name}`, 'info'),
          a.journal && this.journal(this.text(a.journal), `${t}.start`));
      else if (n === 'done') {
        this.toast(`Misi\xF3n completada: ${a.name}`, 'bien');
        let r = (a.outcomes || []).find((l) => this.test(l.if, {}));
        r?.journal && this.journal(this.text(r.journal), `${t}.end`);
      } else
        n === 'failed' &&
          (this.toast(`Misi\xF3n fallida: ${a.name}`, 'mal'),
          a.failJournal && this.journal(this.text(a.failJournal), `${t}.fail`));
    }
  }
  journal(e, t = null) {
    if (!this.cp || !e) return;
    let a = t || e.slice(0, 60);
    this.st.journal[a] ||
      ((this.st.journal[a] = this.day()),
      (this.cp.journal ??= []),
      this.cp.journal.includes(e) || this.cp.journal.push(e),
      this.game.bus?.emit('journal:add', { text: e, key: a }));
  }
  approve(e, t, { silent: a = !1 } = {}) {
    if (!t) return;
    let n = e === 'all' ? bi.filter((s) => this.inParty(s)) : [e];
    for (let s of n) {
      if (!bi.includes(s) || this.flag(`${s}_left`) || (s === 'ilyra' && this.flag('ilyra_dead'))) continue;
      let i = this.st,
        r = FD((i.approval[s] ?? 0) + t, -100, 100);
      ((i.approval[s] = r),
        this.game.bus?.emit('approval', { who: s, delta: t, value: r }),
        this.log('aprobaci\xF3n', s, t > 0 ? `+${t}` : t, '\u2192', r),
        this.inParty(s) &&
          !a &&
          this.toast(
            `${this.companion(s).name} ${t > 0 ? 'lo aprueba' : 'no lo aprueba'}.`,
            t > 0 ? 'bien' : 'mal',
          ),
        r <= -50 &&
          this.inParty(s) &&
          !this._pendingLeave?.includes(s) &&
          (this._pendingLeave ??= []).push(s));
    }
  }
  mood(e) {
    let t = this.approval(e);
    return t >= 60
      ? 'Leal'
      : t >= 25
        ? 'Amistoso'
        : t > -10
          ? 'Neutral'
          : t > -35
            ? 'Molesto'
            : 'A punto de irse';
  }
  companions() {
    return bi
      .filter((e) => this.cp?.members?.[e] || this.flag(`${e}_joined`))
      .map((e) => ({
        id: e,
        name: this.companion(e).full,
        approval: this.approval(e),
        mood: this.mood(e),
        inParty: this.inParty(e),
        waiting: !!this.flag(`${e}_waiting`),
        left: !!this.flag(`${e}_left`),
      }));
  }
  async recruit(e) {
    if (this.inParty(e) || !this.cp) return !0;
    if (this.party().length >= fE) {
      let a = this.party().filter((r) => r !== 'hero' && bi.includes(r)),
        n = this.mercs(),
        s = a.map((r) => ({ text: `Que ${this.companion(r).name} espere en la posada de Merrowick.` }));
      for (let r of n) s.push({ text: `Despedir a ${this.memberName(r)}, que se pag\xF3 por adelantado.` });
      s.push({ text: `Que ${this.companion(e).name} espere en la posada de Merrowick.` });
      let i = await this.show({
        speaker: '',
        text: '*El grupo est\xE1 completo: como mucho viaj\xE1is cuatro. Alguien tendr\xE1 que esperar en la posada del Toro Dormido.*',
        options: s,
      });
      if (i >= a.length && i < a.length + n.length) await this.fireMerc(n[i - a.length]);
      else {
        let r = a[i];
        if (!r)
          return (
            this.setFlag(`${e}_waiting`, !0),
            this.toast(`${this.companion(e).name} os esperar\xE1 en la posada.`, 'info'),
            !1
          );
        await this.sendToInn(r);
      }
    }
    let t = this.rules('cp_recruit', { cp: this.cp, id: e });
    if (t?.error || t?.ok === !1) {
      t?.reason && console.warn('[historia] cp_recruit:', t.reason);
      let a = this.cp;
      ((a.members[e] ??= { ...(this.data.partySheets?.[e] || { name: this.companion(e).full }), id: e }),
        a.party.includes(e) || a.party.push(e),
        (a.state ??= {}),
        (a.state[e] ??= { hp: 10, dead: !1 }),
        this.store.set(a));
    } else this.applyCp(t);
    (this.setFlag(`${e}_joined`, !0), this.flag(`${e}_waiting`) && this.setFlag(`${e}_waiting`, !1));
    try {
      this.game.explore?.addCompanion?.(e);
    } catch (a) {
      console.warn(a);
    }
    return (
      this.game.bus?.emit('companion:join', { id: e }),
      this.toast(`${this.companion(e).full} se une al grupo.`, 'bien'),
      !0
    );
  }
  async dismiss(e, { left: t = !1 } = {}) {
    if (!this.party().includes(e)) return;
    let a = this.rules('cp_dismiss', { cp: this.cp, id: e });
    if (a?.error) {
      let n = this.cp;
      ((n.party = n.party.filter((s) => s !== e)), this.store.set(n));
    } else this.applyCp(a);
    try {
      this.game.explore?.removeCompanion?.(e);
    } catch (n) {
      console.warn(n);
    }
    (t && this.setFlag(`${e}_left`, !0), this.game.bus?.emit('companion:leave', { id: e, left: t }));
  }
  hirePrice() {
    return HD * Math.max(1, this.level());
  }
  isMerc(e) {
    return e !== 'hero' && !bi.includes(e) && (!!this.cp?.members?.[e]?.mercenary || /^merc_/.test(e));
  }
  mercs() {
    return this.party().filter((e) => this.isMerc(e));
  }
  memberName(e) {
    return this.cp?.members?.[e]?.name || this.companion(e)?.name || e;
  }
  async hire() {
    let e = this.game.ui,
      t = this.hirePrice();
    if (!this.cp) return null;
    if (this.party().length >= fE)
      return (this.toast('El grupo est\xE1 completo: como mucho viaj\xE1is cuatro.', 'mal'), null);
    if (this.gold() < t) return (this.toast(`Un mercenario cuesta ${t} po y no os llega.`, 'mal'), null);
    if (!(typeof e?.has == 'function' ? e.has('creador') : !!e?.open))
      return (this.toast('No hay creador de mercenarios en esta versi\xF3n.', 'mal'), null);
    let n = new Set(this.party()),
      s = null;
    try {
      s = await e.open('creador', { mode: 'mercenario', title: 'Nuevo mercenario', price: t });
    } catch (r) {
      if (r?.abort) throw r;
      console.warn('[historia] creador de mercenarios:', r);
    }
    let i = this.party().find((r) => !n.has(r));
    if (!s || !i) return null;
    (await this.gainGold(-t),
      (this.st.vars.mercs_hired = (Number(this.st.vars.mercs_hired) || 0) + 1),
      this.journal(
        `Contratamos a ${this.memberName(i)} en el tabl\xF3n del Toro Dormido por ${t} piezas de oro.`,
        `merc.${i}`,
      ));
    try {
      await this.game.explore?.addCompanion?.(i);
    } catch (r) {
      console.warn(r);
    }
    return i;
  }
  async fireMerc(e) {
    if (!this.isMerc(e) || !this.party().includes(e)) return !1;
    let t = this.memberName(e);
    await this.dismiss(e);
    let a = this.cp;
    return (
      delete a.members?.[e],
      a.state && delete a.state[e],
      this.store.set?.(a),
      this.toast(`${t} recoge sus cosas y se despide.`, 'info'),
      !0
    );
  }
  async sendToInn(e) {
    (await this.dismiss(e),
      this.setFlag(`${e}_waiting`, !0),
      this.toast(`${this.companion(e).name} os esperar\xE1 en la posada.`, 'info'));
  }
  async flushLeaves() {
    let e = this._pendingLeave || [];
    this._pendingLeave = [];
    for (let t of e) {
      if (!this.inParty(t)) continue;
      let a = this.data.companions?.[t];
      (await this.show({
        speaker: this.companion(t).full,
        title: this.companion(t).title,
        who: t,
        portrait: await this.portrait(t),
        text: this.text(a?.leave || '\xABHasta aqu\xED he llegado.\xBB'),
        options: [{ text: 'Dejarle marchar.', kind: 'end' }],
      }),
        await this.dismiss(t, { left: !0 }),
        this.toast(`${this.companion(t).name} ha dejado el grupo.`, 'mal'));
    }
  }
  decide(e, t) {
    let a = this.st;
    if (a.decisions[e] === t) return;
    ((a.decisions[e] = t), this.setFlag(e, t), this.game.bus?.emit('decision', { id: e, choice: t }));
    let n = t === !0 ? e : `${e}=${t}`;
    for (let s of Ln(this.data.reactions?.[n]))
      (s.if && !this.test(s.if, {})) ||
        (this.approve(s.who, s.delta || 0, { silent: !0 }),
        this.inParty(s.who) &&
          s.text &&
          this._pendingReactions.push({ who: s.who, text: s.text, delta: s.delta || 0 }));
  }
  async flushReactions() {
    let e = this._pendingReactions.splice(0);
    for (let t of e) {
      let a = this.companion(t.who);
      (await this.show({
        speaker: a.name,
        title: a.title,
        who: t.who,
        portrait: await this.portrait(t.who),
        text: this.text(t.text),
        options: [_u],
      }),
        t.delta &&
          this.toast(
            `${a.name} ${t.delta > 0 ? 'lo aprueba' : 'no lo aprueba'}.`,
            t.delta > 0 ? 'bien' : 'mal',
          ));
    }
  }
  toast(e, t = 'info') {
    try {
      this.game.ui?.toast?.(e, t);
    } catch {}
  }
  async portrait(e) {
    if (!e) return null;
    if (this._portraits.has(e)) return this._portraits.get(e);
    let t = null;
    try {
      let a = this.game.portrait || this.game.ui?.portrait;
      typeof a == 'function' && (t = (await a(e)) || null);
    } catch {
      t = null;
    }
    return (t && this._portraits.set(e, t), t);
  }
  async show(e) {
    let t = this.game.ui,
      a = e.options?.length ? e.options : [_u],
      n = { speaker: '', title: '', portrait: null, ...e, options: a };
    typeof n.text == 'string' && n.text.includes('*') && (n.text = ID(n.text));
    let s = a.filter((c) => c.kind === 'check').length,
      i = a.filter((c) => c.kind === 'special').length,
      r = a.filter((c) => c.tone).length;
    (s || i || r) && this.game.bus?.emit('story:options', { checks: s, specials: i, tones: r });
    let l = 0;
    try {
      l = Number(await t.dialog(n));
    } catch (c) {
      if (c?.abort) throw c;
      (console.warn('[historia] ui.dialog:', c), (l = a.length - 1));
    }
    return ((l >= 0 && l < a.length) || (l = a.length - 1), l);
  }
  async narrateLines(e, { title: t = '', last: a = null } = {}) {
    let n = Ln(e)
      .map((i) => this.text(i))
      .filter(Boolean);
    if (!n.length) return;
    let s = DD(n).join(`

`);
    await this.show({ speaker: '', title: t, text: s, options: [a || _u] });
  }
  has(e) {
    return !!this.dialogs[e];
  }
  pickStart(e, t) {
    for (let a of Ln(e.start)) {
      if (typeof a == 'string') return a;
      if (this.test(a.if, t)) return a.goto;
    }
    return Object.keys(e.nodes || {})[0];
  }
  async run(e, t = {}, a = null) {
    let n = this.dialogs[e];
    if (!n || !this.cp) return !1;
    if (this.active)
      return (
        console.warn(`[historia] ya hay una conversaci\xF3n abierta (${this.active}); ignoro ${e}`),
        !1
      );
    ((this.active = e),
      (this.ctx = { ...t, level: t.level || this.levelId() }),
      (this._proceed = !1),
      this.game.bus?.emit('dialog:open', { id: e, npc: n.npc || e, important: !!(n.important ?? n.camp) }));
    try {
      this.game.explore?.busy?.(!0);
    } catch {}
    let s = a || this.pickStart(n, this.ctx),
      i,
      r = 0;
    try {
      for (; s && s !== 'end' && r++ < 200;) {
        if (s.startsWith('@')) {
          let [x, g] = s.slice(1).split('.');
          if (((n = this.dialogs[x]), !n)) break;
          s = g || this.pickStart(n, this.ctx);
          continue;
        }
        let c = n.nodes?.[s];
        if (!c) {
          console.warn(`[historia] nodo inexistente ${n.id}.${s}`);
          break;
        }
        let d = `${n.id}.${s}`;
        ((this._at = d), (this.st.seen[d] = (this.st.seen[d] || 0) + 1));
        let u = Ln(c.redirect).find((x) => this.test(x.if));
        if (u) {
          s = u.goto;
          continue;
        }
        let h = await this.apply(c.do);
        if (h.end) break;
        if (h.goto) {
          s = h.goto;
          continue;
        }
        let p = await this.pieces(n, c),
          m = h.deferredEnd ? [] : this.options(n, s, c);
        for (let x = 0; x < p.length - 1; x++)
          (await this.show({ ...p[x], roll: x === 0 ? i : void 0, options: [_u] }), (i = void 0));
        let _ = p[p.length - 1] || { speaker: '', text: '' };
        if (!m.length) {
          let x = h.deferredEnd ? null : c.next,
            g = x ? _u : { text: c.endText || 'Continuar', kind: 'end' };
          (await this.show({ ..._, roll: p.length === 1 ? i : void 0, options: [g] }),
            (i = void 0),
            await this.apply(c.then),
            await this.flushReactions(),
            (s = x || 'end'));
          continue;
        }
        let b = await this.show({ ..._, roll: p.length === 1 ? i : void 0, options: m.map((x) => x.view) });
        ((i = void 0), await this.apply(c.then));
        let f = m[b],
          v = await this.choose(n, s, f);
        if ((await this.flushReactions(), v.end)) break;
        ((i = v.roll), (s = v.goto));
      }
    } finally {
      ((this.active = null), (this.ctx = {}), this.game.bus?.emit('dialog:close', { id: e }));
      try {
        this.game.explore?.busy?.(!1);
      } catch {}
    }
    (await this.flushReactions(), await this.flushLeaves(), this.syncQuests());
    try {
      this._needRefresh && this.game.explore?.refresh?.();
    } catch (c) {
      console.warn(c);
    }
    this._needRefresh = !1;
    let l = this._deferred.splice(0);
    for (let c of l) await this.runDeferred(c);
    return (this.syncQuests(), !0);
  }
  async pieces(e, t) {
    let a = [],
      n = t.who || null,
      s = n ? this.companion(n).name : t.speaker !== void 0 ? t.speaker : e.speaker,
      i = !n && t.speaker === '',
      r = n ? this.companion(n).title : t.title !== void 0 ? t.title : i ? '' : e.title,
      l = n || t.portrait || e.portrait || e.npc || e.id,
      c = this.text(t.text),
      d = c
        ? {
            speaker: this.text(s || ''),
            title: this.text(r || ''),
            who: n || void 0,
            npc: !n && s ? l : void 0,
            portrait: s ? await this.portrait(l) : null,
            text: c,
          }
        : null,
      u = [],
      h = [];
    for (let p of Ln(t.say)) {
      if (!this.inParty(p.who) || !this.test(p.if)) continue;
      let m = this.companion(p.who),
        _ = {
          speaker: m.name,
          title: m.title,
          who: p.who,
          portrait: await this.portrait(p.who),
          text: this.text(p.text),
        },
        b = p.at === 'before' ? u : h;
      if ((b.push(_), p.approve)) for (let [f, v] of Object.entries(p.approve)) this.approve(f, v);
      p.reply && d && b.push({ ...d, text: this.text(p.reply) });
    }
    return (
      a.push(...u),
      d && a.push(d),
      a.push(...h),
      a.length || a.push({ speaker: '', text: '\u2026' }),
      a
    );
  }
  checkSpec(e) {
    if (!e) return null;
    if (typeof e == 'string') {
      let [t, a, n] = e.split(':');
      return { skill: t, dc: Number(a), who: n || 'hero' };
    }
    return { who: 'hero', ...e };
  }
  dcOf(e) {
    let t = Number(e.dc ?? 10);
    for (let a of Ln(e.easier)) this.test(a.if) && (t = Math.min(t, Number(a.dc)));
    for (let a of Ln(e.harder)) this.test(a.if) && (t = Math.max(t, Number(a.dc)));
    return t;
  }
  costOf(e) {
    if (!e.cost) return 0;
    if (typeof e.cost == 'number') return e.cost;
    let t = /^party\*(\d+)$/.exec(String(e.cost));
    return t ? this.partySize() * Number(t[1]) : Number(e.cost) || 0;
  }
  options(e, t, a) {
    let n = [],
      s = a.optionsFrom ? e.nodes?.[a.optionsFrom] : a,
      i = a.optionsFrom || t;
    return (
      Ln(s?.options)
        .flatMap((l, c) =>
          l.each
            ? this.eachOf(l.each).map((d) => ({
                ...this.bindEach(l, d),
                key: `${l.key || `${e.id}.${i}.${c}`}.${d.id}`,
              }))
            : [{ ...l, key: l.key || `${e.id}.${i}.${c}` }],
        )
        .forEach((l) => {
          let c = l.key,
            d = this.checkSpec(l.check);
          if (
            (d && d.who && !['hero', 'best', 'group'].includes(d.who) && !this.inParty(d.who)) ||
            !this.test(l.if)
          )
            return;
          let u = this.costOf(l);
          if (u && this.gold() < u) return;
          let h = l.price === 'hire' ? this.hirePrice() : Number(l.price) || 0;
          if (
            (h && this.gold() < h) ||
            ((l.once || (d && l.once !== !1)) && (this.st.once[c] || this.st.tried[c]))
          )
            return;
          let p = l.tag || null,
            m = l.end ? 'end' : null;
          if (d) {
            let b = d.skill
              ? SKILL_NAMES[d.skill] || d.skill
              : d.ability
                ? ABILITY_NAMES[d.ability]
                : d.save
                  ? `Salvaci\xF3n de ${ABILITY_NAMES[d.save]}`
                  : '?';
            ((p = `[${d.who === 'hero' || d.who === 'best' ? '' : d.who === 'group' ? 'Grupo \xB7 ' : `${this.companion(d.who).name} \xB7 `}${b} CD ${this.dcOf(d)}]`),
              (m = 'check'));
          } else if (!p && typeof l.special == 'string') ((p = `[${l.special}]`), (m = 'special'));
          else if (!p && l.if && l.special !== !1) {
            for (let b of conditionAtoms(l.if)) {
              let f = conditionTag(b);
              if (f && !l.if.startsWith('!')) {
                p = f;
                break;
              }
            }
            p && (m = 'special');
          }
          (l.special && l.special !== !0 && !p && (p = `[${l.special}]`),
            l.special && !d && (m = 'special'),
            (u || h) && (p = `${p ? p + ' ' : ''}[${u || h} po]`),
            l.free && (p = `${p ? p + ' ' : ''}[${l.free}]`));
          let _ = { text: this.text(l.text), tag: p, kind: m };
          (l.tone && ND.includes(l.tone) && (_.tone = l.tone),
            n.push({ ...l, key: c, spec: d, view: _, cost: u }));
        }),
      n
    );
  }
  eachOf(e) {
    return e === 'merc'
      ? this.mercs().map((t) => ({ id: t, name: this.memberName(t) }))
      : e === 'companion'
        ? this.party()
            .filter((t) => bi.includes(t))
            .map((t) => ({ id: t, name: this.companion(t).name }))
        : [];
  }
  bindEach(e, t) {
    let a = (i) =>
        typeof i == 'string'
          ? i.replace(/\{each:id\}/g, t.id).replace(/\{each:name\}/g, t.name)
          : Array.isArray(i)
            ? i.map(a)
            : i && typeof i == 'object'
              ? Object.fromEntries(Object.entries(i).map(([r, l]) => [r, a(l)]))
              : i,
      { each: n, ...s } = e;
    return a(s);
  }
  async choose(e, t, a) {
    let n = this.st;
    if (
      (a.tone && (n.tone[a.tone] = (n.tone[a.tone] || 0) + 1),
      a.once && (n.once[a.key] = 1),
      a.cost && (await this.gainGold(-this.costOf(a))),
      a.approve)
    )
      for (let [i, r] of Object.entries(a.approve)) this.approve(i, r);
    let s = await this.apply(a.do);
    if (s.end || s.deferredEnd) return { end: !0 };
    if (s.goto) return { goto: s.goto };
    if (a.spec) {
      let i = await this.check(a.spec);
      n.tried[a.key] = i.success ? 'ok' : 'fail';
      let r = i.success ? a.success : a.failure,
        l = await this.apply(i.success ? a.onSuccess : a.onFailure);
      return l.end || l.deferredEnd ? { end: !0, roll: i } : { goto: l.goto || r || 'end', roll: i };
    }
    return a.end ? { end: !0 } : { goto: a.goto || 'end' };
  }
  async check(e) {
    e = this.checkSpec(e);
    let t = this.cp,
      a = this.dcOf(e),
      n = e.adv ? this.test(e.adv) : !1,
      s = e.dis ? this.test(e.dis) : !1,
      i = e.who || 'hero',
      r;
    if (i === 'group') {
      let l = this.rules('group_check', { cp: t, skill: e.skill, dc: a });
      if (!l?.error && l?.results)
        r = {
          ...(l.results.slice().sort((d, u) => u.total - d.total)[0] || {}),
          who: 'Grupo',
          label: `${SKILL_NAMES[e.skill] || e.skill} (grupo)`,
          dc: a,
          success: !!l.success,
          group: l.results,
        };
      else {
        let c = this.party()
            .filter((h) => !this.isDead(h))
            .map((h) => this.fallbackCheck(h, e, a, n, s)),
          d = c.filter((h) => h.success).length * 2 >= c.length;
        r = {
          ...(c.slice().sort((h, p) => p.total - h.total)[0] || {}),
          who: 'Grupo',
          label: `${SKILL_NAMES[e.skill] || e.skill} (grupo)`,
          dc: a,
          success: d,
          group: c,
          provisional: !0,
        };
      }
    } else {
      if (i === 'best') {
        let c = e.skill ? this.rules('best', { cp: t, skill: e.skill }) : { error: 'sin habilidad' };
        if (!c?.error && c?.who) i = c.who;
        else {
          let d = -99;
          for (let u of this.party()) {
            if (this.isDead(u)) continue;
            let h = this.fallbackMod(u, e);
            h > d && ((d = h), (i = u));
          }
          i === 'best' && (i = 'hero');
        }
      }
      let l = { cp: t, who: i, dc: a, adv: n, dis: s };
      (e.skill ? (l.skill = e.skill) : e.ability ? (l.ability = e.ability) : e.save && (l.save = e.save),
        e.tool && (l.tool = e.tool),
        (r = this.rules('check', l)),
        (r?.error || typeof r?.total != 'number') && (r = this.fallbackCheck(i, e, a, n, s)),
        (r = { ...r, id: i, who: r.who && r.who !== i ? r.who : this.name(i) }));
    }
    return (
      (r.dc = a),
      (r.label ||= e.skill ? SKILL_NAMES[e.skill] : e.ability ? ABILITY_NAMES[e.ability] : `Salvaci\xF3n de ${ABILITY_NAMES[e.save]}`),
      this.debug.rollMode === 'success' &&
        !r.success &&
        Object.assign(r, { success: !0, total: Math.max(r.total ?? 0, a), forced: !0 }),
      this.debug.rollMode === 'failure' &&
        r.success &&
        Object.assign(r, { success: !1, total: Math.min(r.total ?? 0, a - 1), forced: !0 }),
      this.log('tirada', r.who, r.label, `${r.total} vs CD ${a}`, r.success ? '\xE9xito' : 'fallo'),
      this.game.bus?.emit('story:roll', { roll: r }),
      r
    );
  }
  fallbackMod(e, t) {
    let a = this.cp?.members?.[e] || {},
      n = t.skill ? SKILL_ABILITIES[t.skill] : t.ability || t.save,
      s = Number(a.final_abilities?.[n] ?? (a.abilities?.[n] ?? 10) + Number(a.bg_bonus?.[n] ?? 0)),
      i = Math.floor((s - 10) / 2),
      r = 2 + Math.floor((Math.max(1, this.level()) - 1) / 4);
    return (
      t.skill && Ln(a.skills).includes(t.skill) && (i += Ln(a.expertise).includes(t.skill) ? r * 2 : r),
      i
    );
  }
  fallbackCheck(e, t, a, n, s) {
    let i = this.fallbackMod(e, t),
      r = 1 + Math.floor(this.rnd() * 20),
      l = 1 + Math.floor(this.rnd() * 20),
      c = n && !s ? [r, l] : s && !n ? [r, l] : [r],
      d = n && !s ? Math.max(r, l) : s && !n ? Math.min(r, l) : r,
      u = d + i;
    return {
      who: this.name(e),
      id: e,
      label: t.skill ? SKILL_NAMES[t.skill] : ABILITY_NAMES[t.ability || t.save],
      d20: c,
      mod: i,
      total: u,
      dc: a,
      success: u >= a,
      crit: d === 20,
      provisional: !0,
    };
  }
  async apply(e) {
    let t = {};
    for (let a of Ln(e)) {
      let n;
      try {
        n = parseEffect(a);
      } catch (s) {
        console.warn('[historia]', s.message);
        continue;
      }
      if (n.op === 'cond') {
        let s = await this.apply(this.test(n.if) ? n.do : n.else);
        if ((s.deferredEnd && (t.deferredEnd = !0), s.end || s.goto)) return { ...t, ...s };
        continue;
      }
      if (n.op === 'goto') return { goto: n.node };
      if (n.op === 'end') return ((t.end = !0), t);
      if (DEFERRED_EFFECTS.has(n.op)) {
        (this._deferred.push(n),
          n.op === 'battle' && (this._groupOutcome = 'battle'),
          n.op !== 'levelup' && (t.deferredEnd = !0));
        continue;
      }
      await this.effect(n);
    }
    return t;
  }
  async effect(e) {
    let t = this.game;
    switch (e.op) {
      case 'set':
        (this.setFlag(e.flag, e.value), (this._needRefresh = !0));
        break;
      case 'unset':
        (this.cp?.flags &&
          (delete this.cp.flags[e.flag], t.bus?.emit('flag:set', { name: e.flag, value: void 0, old: !0 })),
          (this._needRefresh = !0));
        break;
      case 'inc':
        this.setFlag(e.flag, Number(this.flag(e.flag) || 0) + e.by);
        break;
      case 'var':
        this.st.vars[e.name] = e.value;
        break;
      case 'gold':
        await this.gainGold(e.delta);
        break;
      case 'give':
        this.giveItem(e.item, e.n);
        break;
      case 'take':
        this.takeItem(e.item, e.n);
        break;
      case 'recruit':
        await this.recruit(e.who);
        break;
      case 'dismiss':
        await this.dismiss(e.who, { left: !0 });
        break;
      case 'wait':
        await this.sendToInn(e.who);
        break;
      case 'fire':
        await this.fireMerc(e.who);
        break;
      case 'approve':
        this.approve(e.who, e.delta);
        break;
      case 'decision':
        (this.decide(e.id, e.choice), (this._needRefresh = !0));
        break;
      case 'journal':
        this.journal(this.text(e.text));
        break;
      case 'toast':
        this.toast(this.text(e.text), 'info');
        break;
      case 'leave':
        this._groupOutcome = 'leave';
        try {
          await t.explore?.removeGroup?.(e.group, { flee: !0 });
        } catch (a) {
          if (a?.abort) throw a;
          console.warn(a);
        }
        t.bus?.emit('story:group_left', { group: e.group });
        break;
      case 'place':
        (this.setFlag(`place_${e.id}`, !0),
          this.toast(`Nuevo lugar en el mapa: ${this.data.places?.[e.id] || e.id}.`, 'info'));
        break;
      case 'object':
        try {
          t.explore?.setObjectState?.(e.id, e.state);
        } catch (a) {
          if (a?.abort) throw a;
          console.warn(a);
        }
        this._needRefresh = !0;
        break;
      case 'npc':
        try {
          e.state === 'hide' && t.explore?.removeNpc?.(e.id);
        } catch (a) {
          if (a?.abort) throw a;
          console.warn(a);
        }
        this._needRefresh = !0;
        break;
      case 'refresh':
        this._needRefresh = !0;
        break;
      case 'heal': {
        let a = this.rules('cp_heal', { cp: this.cp, id: 'all' });
        if (a?.error) {
          for (let n of this.party()) {
            let s = this.cp.state?.[n];
            s && s.max_hp && !s.dead && (s.hp = s.max_hp);
          }
          this.store.set(this.cp);
        } else this.applyCp(a);
        (this.toast('Las heridas se cierran: todo el grupo recupera sus puntos de golpe.', 'bien'),
          t.bus?.emit('story:healed', {}));
        break;
      }
      case 'identify': {
        let a = this.rules('identify', { cp: this.cp });
        if (a?.error)
          this.toast(
            'La hermana Aldis examina vuestras cosas\u2026 (identificar: pendiente del n\xFAcleo)',
            'info',
          );
        else {
          this.applyCp(a);
          let n = Ln(a.identified).map((s) => s.name || s);
          this.toast(n.length ? `Identificado: ${n.join(', ')}.` : 'No hay nada por identificar.', 'info');
        }
        break;
      }
      case 'raise': {
        let a = this.rules('cp_revive', { cp: this.cp, id: e.who });
        if (!a?.error && a?.cp) {
          (this.applyCp(a), this.toast(`${this.name(e.who)} vuelve a respirar.`, 'bien'));
          break;
        }
        let n = this.cp?.state?.[e.who];
        n &&
          ((n.dead = !1),
          (n.hp = Math.max(1, n.hp || 0)),
          this.store.set(this.cp),
          this.toast(`${this.name(e.who)} vuelve a respirar.`, 'bien'));
        break;
      }
      case 'damage': {
        let a = e.who === 'actor' ? this.ctx.actor || 'hero' : e.who === 'leader' ? this.party()[0] : e.who,
          n = rollDice(e.dice, this.rnd),
          s = !1;
        if (e.save) {
          let r = await this.check({ save: e.save, dc: e.dc || 12, who: a });
          ((s = r.success), s && (n = Math.floor(n / 2)), (this._lastRoll = r));
        }
        let i = this.rules('cp_damage', { cp: this.cp, id: a, amount: n, type: e.type });
        if (i?.error) {
          let r = this.cp.state?.[a];
          r && (r.hp = Math.max(0, (r.hp ?? 10) - n));
        } else this.applyCp(i);
        (this.toast(
          `${this.name(a)} sufre ${n} de da\xF1o${s ? ' (se aparta a tiempo: la mitad)' : ''}.`,
          'mal',
        ),
          t.bus?.emit('story:damage', { who: a, amount: n, type: e.type }));
        break;
      }
      case 'narrate': {
        let a = await this.narrate(e.moment, { ...(e.data || {}), fallback: e.lines });
        a && (await this.narrateLines([a]));
        break;
      }
      case 'say':
        try {
          t.explore?.say
            ? t.explore.say(e.who, this.text(e.text))
            : this.toast(`${this.name(e.who)}: ${this.text(e.text)}`, 'info');
        } catch {}
        break;
      case 'sfx':
        try {
          t.audio?.sfx?.(e.name);
        } catch {}
        t.bus?.emit('story:sfx', { name: e.name });
        break;
      case 'proceed':
        this._proceed = !0;
        break;
      case 'prefetch':
        this.narrator?.prefetch?.(e.moment, { key: e.key || 'final' });
        break;
      default:
        console.warn('[historia] efecto sin implementar:', e.op);
    }
  }
  async runDeferred(e) {
    let t = this.game;
    switch (e.op) {
      case 'battle': {
        this._battleSeq++;
        let a = this._battleSeq,
          n = { won: !1, fled: !1 };
        try {
          t.explore?.startBattle
            ? (n = (await t.explore.startBattle(e.group, { surprise: e.surprise })) || n)
            : console.warn('[historia] sin exploraci\xF3n: combate', e.group, 'no empieza');
        } catch (s) {
          if (s?.abort) throw s;
          console.warn(s);
        }
        !this._afterHandled.has(`${e.group}#${a}`) &&
          t.explore?.startBattle &&
          (await this.afterBattle({
            group: e.group,
            won: !!n.won,
            fled: !!n.fled,
            level: this.levelId(),
            _seq: a,
          }));
        break;
      }
      case 'shop':
        await t.ui?.open?.('tienda', { merchant: e.merchant });
        break;
      case 'rest': {
        let a = e.where === 'camp' ? 'campamento' : 'posada',
          n = await t.ui?.open?.('descanso', { kind: 'largo', where: a, paid: !0 });
        n != null && (await this.rest({ kind: 'largo', where: a }));
        break;
      }
      case 'levelup':
        await this.levelUp(e.level);
        break;
      case 'hire':
        await this.hire();
        break;
      case 'travel':
        try {
          t.explore?.travel?.(e.level, e.spawn);
        } catch (a) {
          if (a?.abort) throw a;
          console.warn(a);
        }
        break;
      case 'epilogue':
        await this.playEpilogue();
        break;
    }
  }
  async levelUp(e) {
    if (!this.cp || this.level() >= e) return;
    let t = this.game.ui;
    if (
      (typeof t?.has == 'function' ? t.has('nivel') : !!t?.open) &&
      (await t.open('nivel', { level: e }), this.level() >= e)
    )
      return;
    let n = this.rules('cp_level_up', { cp: this.cp, level: e });
    n?.error ||
      (this.applyCp(n), this.game.bus?.emit('levelup', { level: e }), this.toast(`\xA1Nivel ${e}!`, 'bien'));
  }
  async gainGold(e) {
    if (!e || !this.cp) return;
    let t = this.rules('cp_gold', { cp: this.cp, delta: e });
    (t?.error
      ? ((this.cp.gold = Math.max(0, (this.cp.gold || 0) + e)), this.store.set(this.cp))
      : this.applyCp(t),
      this.game.bus?.emit('gold', { delta: e }),
      this.toast(e > 0 ? `Recib\xEDs ${e} po.` : `Pag\xE1is ${-e} po.`, e > 0 ? 'botin' : 'info'));
  }
  giveItem(e, t = 1) {
    if (!this.cp) return;
    let a = this.rules('cp_give', { cp: this.cp, item: e, n: t });
    if (a?.error) {
      let s = this.cp.members?.hero || this.cp.members?.[this.party()[0]];
      s && ((s.items ??= {}), (s.items[e] = Number(s.items[e] || 0) + t), this.store.set(this.cp));
    } else this.applyCp(a);
    (this.onLoot?.({ items: [{ id: e, n: t }] }),
      this.game.bus?.emit('item:gain', { id: e, n: t, who: a?.who || 'hero', source: 'story' }));
    let n = this.data.items?.[e]?.name || e;
    this.toast(`Obtenido: ${n}${t > 1 ? ` \xD7${t}` : ''}.`, 'botin');
  }
  takeItem(e, t = 1) {
    if (!this.cp) return;
    let a = this.rules('cp_take', { cp: this.cp, item: e, n: t });
    if (!a?.error) {
      this.applyCp(a);
      return;
    }
    let n = this.rules('has_item', { cp: this.cp, item: e });
    if (!n?.error && Array.isArray(n.holders)) {
      let i = t;
      for (let r of n.holders) {
        if (i <= 0) break;
        let l = Math.min(i, Number(r.n || 1)),
          c = this.rules('inv_drop', { cp: this.cp, who: r.id, item: e, n: l });
        !c?.error && c?.ok !== !1 && (this.applyCp(c), (i -= l));
      }
      if (i <= 0) return;
    }
    let s = t;
    for (let i of this.party()) {
      let r = this.cp.members?.[i];
      if (!r || s <= 0) continue;
      let l = Number(r.items?.[e] || 0);
      if (l > 0) {
        let c = Math.min(l, s);
        ((r.items[e] = l - c), r.items[e] || delete r.items[e], (s -= c));
      }
      if (s > 0 && Array.isArray(r.pack))
        for (let c = r.pack.length - 1; c >= 0 && s > 0; c--)
          r.pack[c]?.id === e && (r.pack.splice(c, 1), s--);
    }
    this.store.set(this.cp);
  }
  async narrate(e, t = {}) {
    return this.narrator ? this.narrator.narrate(e, t) : this.narrationFallback(e, t);
  }
  narrationFallback(e, t = {}) {
    if (t.fallback) return this.text(Ln(t.fallback));
    let a = this.data.narration?.moments?.[e];
    if (!a) return '';
    let n = Ln(a.variants).find((s) => this.test(s.if, t.ctx || {}));
    return this.text(Ln(n?.text ?? a.text));
  }
};

export { StoryRunner };
