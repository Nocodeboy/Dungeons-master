// story/story.js — La historia del capítulo (clase Story, game.story).
// Extiende StoryRunner con lo que conecta la historia con el juego: conversaciones con PNJ y grupos de
// enemigos, objetos del nivel, disparadores y regresos al entrar en un nivel, consecuencias de los combates
// (datos battles), botín con banderas, trampas, charlas entre compañeros, escenas de campamento al descansar,
// prólogo y epílogo, y guardado del estado de historia. Los flujos van de uno en uno (`exclusive`).
// La crea story/index.js; la usan explore/ (talk, interact, trigger, afterBattle, banter, rest) y ui/.

import { StoryRunner } from './runner.js';

/** Valor o lista → lista. */
const toList = (value) => (value == null ? [] : Array.isArray(value) ? value : [value]);
/** Separación mínima entre charlas de compañeros (ms). */
const BANTER_GAP = 6e4;
/** Espera antes de repetir la conversación con un grupo de enemigos (ms). */
const GROUP_TALK_COOLDOWN = 15e3;
/** Historia del capítulo sobre el motor de diálogos. */
const Story = class extends StoryRunner {
  /** Enlaza `this` en los métodos que se pasan como funciones sueltas (explore/ y ui/). */
  constructor(game, data, opts) {
    (super(game, data, opts),
      (this._lock = Promise.resolve()),
      (this._inFlow = !1),
      (this._lastBanter = this.now() - BANTER_GAP + 45e3));
    for (let method of [
      'talk',
      'has',
      'interact',
      'trigger',
      'afterBattle',
      'quests',
      'approval',
      'companions',
      'narrate',
      'banter',
      'rest',
      'prologue',
      'epilogue',
      'playEpilogue',
      'save',
      'load',
      'text',
      'describe',
    ])
      this[method] = this[method].bind(this);
  }
  /** Engancha los oyentes del bus (partida, banderas, sigilo, combate, nivel, descanso, trampas, botín). */
  attach() {
    let bus = this.game.bus;
    if (!bus || this._attached) return;
    this._attached = !0;
    let initQuests = () => {
      this.st;
      for (let [id] of Object.entries(this.data.quests || {})) {
        let saved = (this.st.quests[id] ??= { state: 'none', steps: {} });
        saved.state = this.questState(id);
      }
    };
    (bus.on('game:start', () => {
      (initQuests(), this.syncQuests());
    }),
      bus.on('game:loaded', initQuests));
    let syncPending = !1;
    (bus.on('flag:set', (data) => {
      if (
        data?.value === !0 &&
        this.data.flags?.[data.name]?.values &&
        this.st.decisions?.[data.name] !== void 0 &&
        this.st.decisions[data.name] !== !0
      ) {
        let decided = this.st.decisions[data.name];
        queueMicrotask(() => this.setFlag(data.name, decided));
      }
      syncPending ||
        ((syncPending = !0),
        queueMicrotask(() => {
          ((syncPending = !1), this.syncQuests());
        }));
    }),
      bus.on('stealth:on', () => (this._stealth = !0)),
      bus.on('stealth:off', () => (this._stealth = !1)),
      bus.on('spotted', () => (this._stealth = !1)),
      bus.on('battle:start', () => this._battleSeq++),
      bus.on('battle:end', (data) => this.battleState(data || {})),
      bus.on('level:enter', (data) => this.onLevelEnter(data || {})),
      bus.on('rest:long', () => {
        this.now() - this._lastRest > 5e3 &&
          setTimeout(
            () =>
              this.rest({ kind: 'largo', where: this.levelId() === 'merrowick' ? 'posada' : 'campamento' }),
            400,
          );
      }),
      bus.on('trap:triggered', (data) => this.onTrap(data, 'triggered')),
      bus.on('trap:disarmed', (data) => this.onTrap(data, 'disarmed')),
      bus.on('hidden:found', (data) => this.onTrap(data, 'found')),
      bus.on('loot:taken', (data) => this.onLoot(data || {})),
      bus.on(
        'item:gain',
        (data) => data?.id && data.source !== 'story' && this.onLoot({ items: [{ id: data.id, n: data.n }] }),
      ));
  }
  /** Ejecuta `fn` sin solaparse con otro flujo de historia (cola con promesas; reentrante). */
  async exclusive(fn) {
    if (this._inFlow) return fn();
    let previous = this._lock,
      release;
    ((this._lock = new Promise((resolve) => (release = resolve))), await previous, (this._inFlow = !0));
    try {
      return await fn();
    } finally {
      ((this._inFlow = !1), release());
    }
  }
  /** Habla con un PNJ o con un grupo de enemigos (si `id` es un grupo). */
  async talk(id, ctx = {}) {
    return this.data.groups?.[id] || ctx.kind === 'group'
      ? this.talkGroup(id, ctx)
      : this.dialogs[id]
        ? this.exclusive(() => this.run(id, ctx))
        : !1;
  }
  /**
   * Interacción con un objeto, PNJ, compañero o grupo del nivel.
   * @returns {Promise<boolean>} si la historia se ha ocupado (la exploración no hace lo suyo)
   */
  async interact({ object, level, actor, kind, ...rest } = {}) {
    let id = typeof object == 'string' ? object : object?.id || object?.group;
    if (!id || !this.cp) return !1;
    let levelKey = level || this.levelId(),
      ctx = { ...rest, level: levelKey, actor, kind, object: id },
      group = rest.group || (kind === 'group' ? id : null) || (typeof object == 'object' && object?.group);
    if (group || this.data.groups?.[id]) return this.talkGroup(group || id, ctx);
    let def = this.data.objects?.[`${levelKey}.${id}`] || this.data.objects?.[id],
      companion = typeof object == 'object' ? object?.companion : null;
    return companion && this.dialogs[companion] && !def
      ? this.exclusive(() => this.run(companion, ctx))
      : (kind === 'npc' || !def) && this.dialogs[id]
        ? this.exclusive(() => this.run(id, ctx))
        : !def || (def.if && !this.test(def.if, ctx))
          ? !1
          : this.exclusive(async () => {
              if (def.dialog)
                return (
                  (this._proceed = !1),
                  await this.run(def.dialog, { ...ctx, ...(def.ctx || {}) }),
                  !this._proceed
                );
              let onceKey = `obj.${levelKey}.${id}`,
                lines = this.objectLines(def, ctx);
              return lines.length && (!def.once || !this.st.once[onceKey])
                ? ((this.st.once[onceKey] = 1),
                  await this.narrateLines(lines, { title: def.title || '' }),
                  await this.apply(def.do),
                  this.syncQuests(),
                  def.own !== !1)
                : def.own === !0 && !def.once;
            });
  }
  /** Líneas de un objeto o escena (la primera variante cuya condición se cumple). */
  objectLines(def, ctx = {}) {
    let variant = toList(def.variants).find((v) => this.test(v.if, ctx));
    return toList(variant ? variant.lines : def.lines).filter((line) => typeof line == 'string' || this.test(line.if, ctx));
  }
  /** Descripción de un objeto del nivel. */
  describe(id, level = this.levelId()) {
    let def = this.data.objects?.[`${level}.${id}`] || this.data.objects?.[id];
    return def ? this.text(this.objectLines(def)) : '';
  }
  /** Conversación con un grupo de enemigos (con espera tras hablar si no hubo combate ni huida). */
  async talkGroup(id, ctx = {}) {
    let group = this.data.groups?.[id];
    if (!group || !this.cp || !this.test(group.if, ctx)) return !1;
    let last = this._groupCooldown.get(id);
    return last && this.now() - last < GROUP_TALK_COOLDOWN
      ? !0
      : this.exclusive(async () => {
          this._groupOutcome = null;
          let stealth = !!(ctx.stealth || this._stealth),
            ran = await this.run(group.dialog, { ...ctx, group: id, stealth });
          return (ran && !this._groupOutcome && this._groupCooldown.set(id, this.now()), ran);
        });
  }
  /** Dispara un disparador del nivel (una vez, salvo `once: false`). */
  async trigger(id, { level, trigger } = {}) {
    let levelKey = level || this.levelId(),
      def = this.data.triggers?.[`${levelKey}.${id}`] || this.data.triggers?.[id];
    if (!def || !this.cp) return !1;
    if (def.if && !this.test(def.if, { level: levelKey })) return def.consume === !0;
    let onceKey = `trg.${levelKey}.${id}`;
    return def.once !== !1 && this.st.once[onceKey]
      ? !0
      : this.exclusive(
          async () => (
            (this.st.once[onceKey] = 1),
            await this.playScene(def, { level: levelKey, trigger, tkey: `${levelKey}.${id}` }),
            !0
          ),
        );
  }
  /** Escena de disparador o regreso: narración, efectos, diálogo, efectos aplazados y consejo/pista. */
  async playScene(scene, ctx = {}) {
    if (scene.narrate || scene.lines) {
      let lines = this.objectLines(scene, ctx),
        text = scene.narrate ? await this.narrate(scene.narrate, { fallback: lines, level: ctx.level, ctx }) : this.text(lines);
      text && (await this.narrateLines([text], { title: this.text(scene.title || '') }));
    }
    (scene.do && (await this.apply(scene.do)), scene.dialog && (await this.run(scene.dialog, ctx)));
    let deferred = this._deferred.splice(0);
    for (let effect of deferred) await this.runDeferred(effect);
    if ((scene.tip && this.tips?.fire(scene.tip), scene.hint)) {
      let hint = this.text(scene.hint);
      if (this.tips) this.tips.hint(hint, ctx.tkey ? `hint:${ctx.tkey}` : null);
      else
        try {
          this.game.ui?.hud?.hint ? this.game.ui.hud.hint(hint) : this.toast(hint, 'info');
        } catch {
          this.toast(hint, 'info');
        }
    }
    this.syncQuests();
  }
  /** Aplica las consecuencias de un combate terminado (bandera, onWin/onFlee). */
  battleState({ group, groups, won, fled }) {
    if (this.cp) {
      for (let id of groups?.length ? groups : [group]) {
        let battle = this.data.battles?.[id];
        if (battle) {
          if (won) {
            battle.flag && this.setFlag(battle.flag, !0);
            for (let effect of toList(battle.onWin)) this._syncEffect(effect);
          } else if (fled) for (let effect of toList(battle.onFlee)) this._syncEffect(effect);
        }
      }
      this.syncQuests();
    }
  }
  /** Aplica al momento un efecto sencillo (decision, set, unset, give, place) o lo pasa a `apply`. */
  _syncEffect(effect) {
    if (effect && typeof effect == 'object' && effect.if !== void 0) {
      for (let sub of toList(this.test(effect.if) ? effect.do : effect.else)) this._syncEffect(sub);
      return;
    }
    let text = String(effect);
    if (text.startsWith('decision:')) {
      let [name, value] = text.slice(9).split('=');
      this.decide(name, value === void 0 || value === 'true' ? !0 : value);
    } else if (text.startsWith('set:')) {
      let [name, value] = text.slice(4).split('=');
      this.setFlag(name, value === void 0 || value === 'true' ? !0 : value === 'false' ? !1 : value);
    } else if (text.startsWith('unset:')) this.cp?.flags && delete this.cp.flags[text.slice(6)];
    else if (text.startsWith('give:')) {
      let [item, count] = text.slice(5).split('*');
      this.giveItem(item, Number(count || 1));
    } else text.startsWith('place:') ? this.setFlag(`place_${text.slice(6)}`, !0) : this.apply([effect]);
  }
  /** Narración y diálogo posteriores a un combate (una vez por combate). */
  async afterBattle({ group, groups, won, fled, level, _seq: seq } = {}) {
    let key = `${group}#${this._battleSeq}`;
    if (this._afterHandled.has(key)) return !0;
    (this._afterHandled.add(key),
      seq !== void 0 && this._afterHandled.add(`${group}#${seq}`),
      this.battleState({ group, groups, won, fled }));
    let battle = this.data.battles?.[group];
    return !battle || !this.cp
      ? !1
      : this.exclusive(async () => {
          if (((this._groupOutcome = 'battle'), won)) {
            let lines = this.objectLines({ lines: battle.after, variants: battle.variants });
            if (lines.length || battle.narrate) {
              let text = battle.narrate
                ? await this.narrate(battle.narrate, { fallback: lines, level, group, ctx: { group } })
                : this.text(lines);
              text && (await this.narrateLines([text], { title: this.text(battle.title || '') }));
            }
            (battle.then && (await this.apply(battle.then)),
              battle.dialog && this.test(battle.dialogIf) && (await this.run(battle.dialog, { level, after: group })));
          } else fled && battle.fled && (await this.narrateLines(this.objectLines({ lines: battle.fled })));
          (await this.flushReactions(), await this.flushLeaves(), this.syncQuests());
          let deferred = this._deferred.splice(0);
          for (let effect of deferred) await this.runDeferred(effect);
          return !0;
        });
  }
  /** Al entrar en un nivel: escenas de regreso y subida a nivel 3 tras Kesh. */
  async onLevelEnter({ level }) {
    if (!(!this.cp || !level)) {
      level === 'tumulo' && !this.flag('tumulo_entered') && this.setFlag('tumulo_entered', !0);
      for (let ret of toList(this.data.returns))
        if (!(ret.level !== level || this.st.once[`ret.${ret.id}`] || !this.test(ret.if, { level }))) {
          ((this.st.once[`ret.${ret.id}`] = 1),
            setTimeout(() => this.exclusive(() => this.playScene(ret, { level })), ret.delay ?? 1200));
          break;
        }
      level !== 'kesh' &&
        this.flag('kesh_done') &&
        this.level() < 3 &&
        !this.st.once.lvl3 &&
        ((this.st.once.lvl3 = 1),
        setTimeout(
          () =>
            this.exclusive(async () => {
              (await this.narrateLines(
                this.data.narration?.levelup3 || ['Lo que hab\xE9is visto en Kesh os ha cambiado.'],
              ),
                await this.levelUp(3));
            }),
          2500,
        ));
    }
  }
  /** Trampas encontradas, desactivadas o disparadas: banderas del túmulo, avisos y comentarios. */
  onTrap(data, what) {
    let id = typeof data?.object == 'string' ? data.object : data?.object?.id;
    if (!id) return;
    let levelKey = this.levelId();
    levelKey === 'tumulo' &&
      (id === 'trap_1' || id === 'trap_2') &&
      what !== 'found' &&
      this.setFlag(`tumulo_traps_${id.slice(-1)}`, what === 'disarmed' ? 'disarmed' : 'sprung');
    let def = this.data.objects?.[`${levelKey}.${id}`] || this.data.objects?.[id],
      msg = def?.[what];
    if ((msg && this.toast(this.text(msg), what === 'triggered' ? 'mal' : 'info'), what === 'triggered' && def?.say)) {
      let line = toList(def.say).find((entry) => this.inParty(entry.who) && this.test(entry.if));
      line && setTimeout(() => this.game.explore?.say?.(line.who, this.text(line.text)), 900);
    }
  }
  /** Banderas asociadas al botín (datos lootFlags). */
  onLoot({ items }) {
    for (let item of toList(items)) {
      let id = typeof item == 'string' ? item : item?.id,
        effects = this.data.lootFlags?.[id];
      if (effects) for (let effect of toList(effects)) this._syncEffect(effect);
    }
    this.syncQuests();
  }
  /** Siguiente charla de compañeros disponible (o null); emite «banter». */
  banter(opts = {}) {
    if (this.active || !this.cp || this._inFlow) return null;
    let now = this.now();
    if (now - this._lastBanter < (opts.gap ?? BANTER_GAP)) return null;
    let levelKey = opts.level || this.levelId(),
      st = this.st,
      chat = toList(this.data.banter).find(
        (candidate) =>
          !st.banter[candidate.id] &&
          (!candidate.where || toList(candidate.where).includes(levelKey)) &&
          candidate.lines.every((line) => this.inParty(line.who)) &&
          this.test(candidate.if, { level: levelKey }),
      );
    if (!chat) return null;
    ((st.banter[chat.id] = this.day()), (this._lastBanter = now));
    let lines = chat.lines.map((line) => ({ who: line.who, name: this.companion(line.who).name, text: this.text(line.text) }));
    if ((this.game.bus?.emit('banter', { id: chat.id, lines }), opts.show && !this.game.explore?.say))
      for (let line of lines) this.toast(`${line.name}: ${line.text}`, 'info');
    return lines;
  }
  /** Descanso largo con narración y, si hay, una escena de campamento. */
  async rest({ kind = 'largo', where } = {}) {
    return !['largo', 'long'].includes(kind) || !this.cp || this.now() - this._lastRest < 5e3
      ? !1
      : ((this._lastRest = this.now()),
        this.exclusive(async () => {
          let place = where || (this.levelId() === 'merrowick' ? 'posada' : 'campamento'),
            text = await this.narrate('rest', { place, level: this.levelId(), ctx: { place } });
          text && (await this.narrateLines([text]));
          let st = this.st,
            dialog = Object.values(this.dialogs)
              .filter((d) => d.camp)
              .sort((x, y) => (x.camp.order ?? 99) - (y.camp.order ?? 99))
              .find((d) => !st.camp[d.id] && this.test(d.camp.if, { place }));
          return (dialog && ((st.camp[dialog.id] = this.day()), await this.run(dialog.id, { place })), !0);
        }));
  }
  /** Prólogo: relato (pantalla «relato») y diálogo «prologue». */
  async prologue() {
    return this.cp
      ? this.exclusive(async () => {
          let def = this.data.prologue || {},
            lines = this.objectLines({ lines: def.lines }),
            ui = this.game.ui;
          return (
            ui?.has?.('relato')
              ? await ui.open('relato', {
                  title: def.title,
                  place: this.text(def.place),
                  paragraphs: lines.map((line) => this.text(line)),
                  button: 'Continuar',
                })
              : await this.narrateLines(lines, { title: def.title }),
            this.dialogs.prologue && (await this.run('prologue', { level: 'camino' })),
            this.setFlag('prologue_done', !0),
            this.syncQuests(),
            !0
          );
        })
      : !1;
  }
  /** Láminas del epílogo según las decisiones y el cierre narrado. */
  epilogue() {
    let def = this.data.epilogue || {},
      slides = [];
    for (let slide of toList(def.slides)) {
      if (slide.if && !this.test(slide.if, {})) continue;
      let variant = toList(slide.variants).find((v) => this.test(v.if, {}));
      if (!variant) continue;
      let extras = toList(slide.extras)
          .filter((extra) => this.test(extra.if, {}))
          .map((extra) => this.text(extra.text)),
        text = [this.text(variant.text), ...extras].filter(Boolean).join(`

`);
      slides.push({ id: slide.id, title: this.text(slide.title), text });
    }
    let closing = this.st.narr['epilogue|final'] || this.text(toList(def.closing));
    return {
      title: this.text(def.title || 'Ep\xEDlogo'),
      subtitle: this.text(def.subtitle || ''),
      slides,
      closing,
    };
  }
  /** Cierra el capítulo: narración final, guardado y escena «ending» (o láminas como diálogo). */
  async playEpilogue() {
    if (!this.cp) return;
    let closingLines = toList(this.data.epilogue?.closing),
      closing = await this.narrate('epilogue', { fallback: closingLines, key: 'final' });
    (closing && (this.st.narr['epilogue|final'] = closing), this.setFlag('chapter1_done', !0), this.syncQuests());
    let epilogue = this.epilogue();
    try {
      await this.store.save?.('auto');
    } catch {}
    if (this.game.scenes?.registry?.has?.('ending')) {
      await this.game.go('ending', { epilogue });
      return;
    }
    for (let slide of epilogue.slides) await this.narrateLines([slide.text], { title: slide.title });
    await this.narrateLines([epilogue.closing], {
      title: epilogue.subtitle || 'Fin del cap\xEDtulo 1',
      last: { text: 'Fin', kind: 'end' },
    });
  }
  /** Atajos al libro de saber (story.lore). */
  codex(opts) {
    return this.lore ? this.lore.list(opts) : [];
  }
  codexEntry(id) {
    return this.lore?.entry(id) || null;
  }
  codexRead(id) {
    this.lore?.read(id);
  }
  /** Copia del estado de historia (para guardar aparte). */
  save() {
    return JSON.parse(JSON.stringify(this.st));
  }
  /** Restaura el estado de historia y recalcula las misiones. */
  load(saved) {
    if (this.cp) {
      (saved && typeof saved == 'object' && (this.cp.story = JSON.parse(JSON.stringify(saved))), this.st);
      for (let id of Object.keys(this.data.quests || {}))
        (this.st.quests[id] ??= { state: 'none', steps: {} }).state = this.questState(id);
    }
  }
};

export { Story };
