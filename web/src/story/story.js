// story/story.js
// Reconstruido de publicado/juego.js (módulo __esm «bE»). Nombres locales aún minificados.

import { StoryRunner } from './runner.js';

const pn = (o) => (o == null ? [] : Array.isArray(o) ? o : [o]);
const gE = 6e4;
const OD = 15e3;
const Story = class extends StoryRunner {
  constructor(e, t, a) {
    (super(e, t, a),
      (this._lock = Promise.resolve()),
      (this._inFlow = !1),
      (this._lastBanter = this.now() - gE + 45e3));
    for (let n of [
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
      this[n] = this[n].bind(this);
  }
  attach() {
    let e = this.game.bus;
    if (!e || this._attached) return;
    this._attached = !0;
    let t = () => {
      this.st;
      for (let [n] of Object.entries(this.data.quests || {})) {
        let s = (this.st.quests[n] ??= { state: 'none', steps: {} });
        s.state = this.questState(n);
      }
    };
    (e.on('game:start', () => {
      (t(), this.syncQuests());
    }),
      e.on('game:loaded', t));
    let a = !1;
    (e.on('flag:set', (n) => {
      if (
        n?.value === !0 &&
        this.data.flags?.[n.name]?.values &&
        this.st.decisions?.[n.name] !== void 0 &&
        this.st.decisions[n.name] !== !0
      ) {
        let s = this.st.decisions[n.name];
        queueMicrotask(() => this.setFlag(n.name, s));
      }
      a ||
        ((a = !0),
        queueMicrotask(() => {
          ((a = !1), this.syncQuests());
        }));
    }),
      e.on('stealth:on', () => (this._stealth = !0)),
      e.on('stealth:off', () => (this._stealth = !1)),
      e.on('spotted', () => (this._stealth = !1)),
      e.on('battle:start', () => this._battleSeq++),
      e.on('battle:end', (n) => this.battleState(n || {})),
      e.on('level:enter', (n) => this.onLevelEnter(n || {})),
      e.on('rest:long', () => {
        this.now() - this._lastRest > 5e3 &&
          setTimeout(
            () =>
              this.rest({ kind: 'largo', where: this.levelId() === 'merrowick' ? 'posada' : 'campamento' }),
            400,
          );
      }),
      e.on('trap:triggered', (n) => this.onTrap(n, 'triggered')),
      e.on('trap:disarmed', (n) => this.onTrap(n, 'disarmed')),
      e.on('hidden:found', (n) => this.onTrap(n, 'found')),
      e.on('loot:taken', (n) => this.onLoot(n || {})),
      e.on(
        'item:gain',
        (n) => n?.id && n.source !== 'story' && this.onLoot({ items: [{ id: n.id, n: n.n }] }),
      ));
  }
  async exclusive(e) {
    if (this._inFlow) return e();
    let t = this._lock,
      a;
    ((this._lock = new Promise((n) => (a = n))), await t, (this._inFlow = !0));
    try {
      return await e();
    } finally {
      ((this._inFlow = !1), a());
    }
  }
  async talk(e, t = {}) {
    return this.data.groups?.[e] || t.kind === 'group'
      ? this.talkGroup(e, t)
      : this.dialogs[e]
        ? this.exclusive(() => this.run(e, t))
        : !1;
  }
  async interact({ object: e, level: t, actor: a, kind: n, ...s } = {}) {
    let i = typeof e == 'string' ? e : e?.id || e?.group;
    if (!i || !this.cp) return !1;
    let r = t || this.levelId(),
      l = { ...s, level: r, actor: a, kind: n, object: i },
      c = s.group || (n === 'group' ? i : null) || (typeof e == 'object' && e?.group);
    if (c || this.data.groups?.[i]) return this.talkGroup(c || i, l);
    let d = this.data.objects?.[`${r}.${i}`] || this.data.objects?.[i],
      u = typeof e == 'object' ? e?.companion : null;
    return u && this.dialogs[u] && !d
      ? this.exclusive(() => this.run(u, l))
      : (n === 'npc' || !d) && this.dialogs[i]
        ? this.exclusive(() => this.run(i, l))
        : !d || (d.if && !this.test(d.if, l))
          ? !1
          : this.exclusive(async () => {
              if (d.dialog)
                return (
                  (this._proceed = !1),
                  await this.run(d.dialog, { ...l, ...(d.ctx || {}) }),
                  !this._proceed
                );
              let h = `obj.${r}.${i}`,
                p = this.objectLines(d, l);
              return p.length && (!d.once || !this.st.once[h])
                ? ((this.st.once[h] = 1),
                  await this.narrateLines(p, { title: d.title || '' }),
                  await this.apply(d.do),
                  this.syncQuests(),
                  d.own !== !1)
                : d.own === !0 && !d.once;
            });
  }
  objectLines(e, t = {}) {
    let a = pn(e.variants).find((n) => this.test(n.if, t));
    return pn(a ? a.lines : e.lines).filter((n) => typeof n == 'string' || this.test(n.if, t));
  }
  describe(e, t = this.levelId()) {
    let a = this.data.objects?.[`${t}.${e}`] || this.data.objects?.[e];
    return a ? this.text(this.objectLines(a)) : '';
  }
  async talkGroup(e, t = {}) {
    let a = this.data.groups?.[e];
    if (!a || !this.cp || !this.test(a.if, t)) return !1;
    let n = this._groupCooldown.get(e);
    return n && this.now() - n < OD
      ? !0
      : this.exclusive(async () => {
          this._groupOutcome = null;
          let s = !!(t.stealth || this._stealth),
            i = await this.run(a.dialog, { ...t, group: e, stealth: s });
          return (i && !this._groupOutcome && this._groupCooldown.set(e, this.now()), i);
        });
  }
  async trigger(e, { level: t, trigger: a } = {}) {
    let n = t || this.levelId(),
      s = this.data.triggers?.[`${n}.${e}`] || this.data.triggers?.[e];
    if (!s || !this.cp) return !1;
    if (s.if && !this.test(s.if, { level: n })) return s.consume === !0;
    let i = `trg.${n}.${e}`;
    return s.once !== !1 && this.st.once[i]
      ? !0
      : this.exclusive(
          async () => (
            (this.st.once[i] = 1),
            await this.playScene(s, { level: n, trigger: a, tkey: `${n}.${e}` }),
            !0
          ),
        );
  }
  async playScene(e, t = {}) {
    if (e.narrate || e.lines) {
      let n = this.objectLines(e, t),
        s = e.narrate ? await this.narrate(e.narrate, { fallback: n, level: t.level, ctx: t }) : this.text(n);
      s && (await this.narrateLines([s], { title: this.text(e.title || '') }));
    }
    (e.do && (await this.apply(e.do)), e.dialog && (await this.run(e.dialog, t)));
    let a = this._deferred.splice(0);
    for (let n of a) await this.runDeferred(n);
    if ((e.tip && this.tips?.fire(e.tip), e.hint)) {
      let n = this.text(e.hint);
      if (this.tips) this.tips.hint(n, t.tkey ? `hint:${t.tkey}` : null);
      else
        try {
          this.game.ui?.hud?.hint ? this.game.ui.hud.hint(n) : this.toast(n, 'info');
        } catch {
          this.toast(n, 'info');
        }
    }
    this.syncQuests();
  }
  battleState({ group: e, groups: t, won: a, fled: n }) {
    if (this.cp) {
      for (let s of t?.length ? t : [e]) {
        let i = this.data.battles?.[s];
        if (i) {
          if (a) {
            i.flag && this.setFlag(i.flag, !0);
            for (let r of pn(i.onWin)) this._syncEffect(r);
          } else if (n) for (let r of pn(i.onFlee)) this._syncEffect(r);
        }
      }
      this.syncQuests();
    }
  }
  _syncEffect(e) {
    if (e && typeof e == 'object' && e.if !== void 0) {
      for (let a of pn(this.test(e.if) ? e.do : e.else)) this._syncEffect(a);
      return;
    }
    let t = String(e);
    if (t.startsWith('decision:')) {
      let [a, n] = t.slice(9).split('=');
      this.decide(a, n === void 0 || n === 'true' ? !0 : n);
    } else if (t.startsWith('set:')) {
      let [a, n] = t.slice(4).split('=');
      this.setFlag(a, n === void 0 || n === 'true' ? !0 : n === 'false' ? !1 : n);
    } else if (t.startsWith('unset:')) this.cp?.flags && delete this.cp.flags[t.slice(6)];
    else if (t.startsWith('give:')) {
      let [a, n] = t.slice(5).split('*');
      this.giveItem(a, Number(n || 1));
    } else t.startsWith('place:') ? this.setFlag(`place_${t.slice(6)}`, !0) : this.apply([e]);
  }
  async afterBattle({ group: e, groups: t, won: a, fled: n, level: s, _seq: i } = {}) {
    let r = `${e}#${this._battleSeq}`;
    if (this._afterHandled.has(r)) return !0;
    (this._afterHandled.add(r),
      i !== void 0 && this._afterHandled.add(`${e}#${i}`),
      this.battleState({ group: e, groups: t, won: a, fled: n }));
    let l = this.data.battles?.[e];
    return !l || !this.cp
      ? !1
      : this.exclusive(async () => {
          if (((this._groupOutcome = 'battle'), a)) {
            let d = this.objectLines({ lines: l.after, variants: l.variants });
            if (d.length || l.narrate) {
              let u = l.narrate
                ? await this.narrate(l.narrate, { fallback: d, level: s, group: e, ctx: { group: e } })
                : this.text(d);
              u && (await this.narrateLines([u], { title: this.text(l.title || '') }));
            }
            (l.then && (await this.apply(l.then)),
              l.dialog && this.test(l.dialogIf) && (await this.run(l.dialog, { level: s, after: e })));
          } else n && l.fled && (await this.narrateLines(this.objectLines({ lines: l.fled })));
          (await this.flushReactions(), await this.flushLeaves(), this.syncQuests());
          let c = this._deferred.splice(0);
          for (let d of c) await this.runDeferred(d);
          return !0;
        });
  }
  async onLevelEnter({ level: e }) {
    if (!(!this.cp || !e)) {
      e === 'tumulo' && !this.flag('tumulo_entered') && this.setFlag('tumulo_entered', !0);
      for (let t of pn(this.data.returns))
        if (!(t.level !== e || this.st.once[`ret.${t.id}`] || !this.test(t.if, { level: e }))) {
          ((this.st.once[`ret.${t.id}`] = 1),
            setTimeout(() => this.exclusive(() => this.playScene(t, { level: e })), t.delay ?? 1200));
          break;
        }
      e !== 'kesh' &&
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
  onTrap(e, t) {
    let a = typeof e?.object == 'string' ? e.object : e?.object?.id;
    if (!a) return;
    let n = this.levelId();
    n === 'tumulo' &&
      (a === 'trap_1' || a === 'trap_2') &&
      t !== 'found' &&
      this.setFlag(`tumulo_traps_${a.slice(-1)}`, t === 'disarmed' ? 'disarmed' : 'sprung');
    let s = this.data.objects?.[`${n}.${a}`] || this.data.objects?.[a],
      i = s?.[t];
    if ((i && this.toast(this.text(i), t === 'triggered' ? 'mal' : 'info'), t === 'triggered' && s?.say)) {
      let r = pn(s.say).find((l) => this.inParty(l.who) && this.test(l.if));
      r && setTimeout(() => this.game.explore?.say?.(r.who, this.text(r.text)), 900);
    }
  }
  onLoot({ items: e }) {
    for (let t of pn(e)) {
      let a = typeof t == 'string' ? t : t?.id,
        n = this.data.lootFlags?.[a];
      if (n) for (let s of pn(n)) this._syncEffect(s);
    }
    this.syncQuests();
  }
  banter(e = {}) {
    if (this.active || !this.cp || this._inFlow) return null;
    let t = this.now();
    if (t - this._lastBanter < (e.gap ?? gE)) return null;
    let a = e.level || this.levelId(),
      n = this.st,
      s = pn(this.data.banter).find(
        (r) =>
          !n.banter[r.id] &&
          (!r.where || pn(r.where).includes(a)) &&
          r.lines.every((l) => this.inParty(l.who)) &&
          this.test(r.if, { level: a }),
      );
    if (!s) return null;
    ((n.banter[s.id] = this.day()), (this._lastBanter = t));
    let i = s.lines.map((r) => ({ who: r.who, name: this.companion(r.who).name, text: this.text(r.text) }));
    if ((this.game.bus?.emit('banter', { id: s.id, lines: i }), e.show && !this.game.explore?.say))
      for (let r of i) this.toast(`${r.name}: ${r.text}`, 'info');
    return i;
  }
  async rest({ kind: e = 'largo', where: t } = {}) {
    return !['largo', 'long'].includes(e) || !this.cp || this.now() - this._lastRest < 5e3
      ? !1
      : ((this._lastRest = this.now()),
        this.exclusive(async () => {
          let a = t || (this.levelId() === 'merrowick' ? 'posada' : 'campamento'),
            n = await this.narrate('rest', { place: a, level: this.levelId(), ctx: { place: a } });
          n && (await this.narrateLines([n]));
          let s = this.st,
            r = Object.values(this.dialogs)
              .filter((l) => l.camp)
              .sort((l, c) => (l.camp.order ?? 99) - (c.camp.order ?? 99))
              .find((l) => !s.camp[l.id] && this.test(l.camp.if, { place: a }));
          return (r && ((s.camp[r.id] = this.day()), await this.run(r.id, { place: a })), !0);
        }));
  }
  async prologue() {
    return this.cp
      ? this.exclusive(async () => {
          let e = this.data.prologue || {},
            t = this.objectLines({ lines: e.lines }),
            a = this.game.ui;
          return (
            a?.has?.('relato')
              ? await a.open('relato', {
                  title: e.title,
                  place: this.text(e.place),
                  paragraphs: t.map((n) => this.text(n)),
                  button: 'Continuar',
                })
              : await this.narrateLines(t, { title: e.title }),
            this.dialogs.prologue && (await this.run('prologue', { level: 'camino' })),
            this.setFlag('prologue_done', !0),
            this.syncQuests(),
            !0
          );
        })
      : !1;
  }
  epilogue() {
    let e = this.data.epilogue || {},
      t = [];
    for (let n of pn(e.slides)) {
      if (n.if && !this.test(n.if, {})) continue;
      let s = pn(n.variants).find((l) => this.test(l.if, {}));
      if (!s) continue;
      let i = pn(n.extras)
          .filter((l) => this.test(l.if, {}))
          .map((l) => this.text(l.text)),
        r = [this.text(s.text), ...i].filter(Boolean).join(`

`);
      t.push({ id: n.id, title: this.text(n.title), text: r });
    }
    let a = this.st.narr['epilogue|final'] || this.text(pn(e.closing));
    return {
      title: this.text(e.title || 'Ep\xEDlogo'),
      subtitle: this.text(e.subtitle || ''),
      slides: t,
      closing: a,
    };
  }
  async playEpilogue() {
    if (!this.cp) return;
    let e = pn(this.data.epilogue?.closing),
      t = await this.narrate('epilogue', { fallback: e, key: 'final' });
    (t && (this.st.narr['epilogue|final'] = t), this.setFlag('chapter1_done', !0), this.syncQuests());
    let a = this.epilogue();
    try {
      await this.store.save?.('auto');
    } catch {}
    if (this.game.scenes?.registry?.has?.('ending')) {
      await this.game.go('ending', { epilogue: a });
      return;
    }
    for (let n of a.slides) await this.narrateLines([n.text], { title: n.title });
    await this.narrateLines([a.closing], {
      title: a.subtitle || 'Fin del cap\xEDtulo 1',
      last: { text: 'Fin', kind: 'end' },
    });
  }
  codex(e) {
    return this.lore ? this.lore.list(e) : [];
  }
  codexEntry(e) {
    return this.lore?.entry(e) || null;
  }
  codexRead(e) {
    this.lore?.read(e);
  }
  save() {
    return JSON.parse(JSON.stringify(this.st));
  }
  load(e) {
    if (this.cp) {
      (e && typeof e == 'object' && (this.cp.story = JSON.parse(JSON.stringify(e))), this.st);
      for (let t of Object.keys(this.data.quests || {}))
        (this.st.quests[t] ??= { state: 'none', steps: {} }).state = this.questState(t);
    }
  }
};

export { Story };
