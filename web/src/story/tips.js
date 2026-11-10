// story/tips.js
// Reconstruido de publicado/juego.js (módulo __esm «hS»). Nombres locales aún minificados.

import historiaConsejos from '../datos/historia/consejos.json';

const pI = () => {
  try {
    return !!globalThis.matchMedia?.('(pointer: coarse)')?.matches;
  } catch {
    return !1;
  }
};
const fI = (o) => String(o || '').split(/\s+/)[0];
const ym = class {
  constructor(e, t = historiaConsejos) {
    ((this.story = e),
      (this.game = e.game),
      (this.data = t || { tips: {} }),
      (this.queue = []),
      (this.last = -1e9),
      (this.timer = 0),
      (this.pcs = new Set()),
      (this.shown = []),
      (this._weightT = 0),
      (this._weights = new Map()),
      (this.now = () => Date.now()),
      (this.coarse = pI));
  }
  get store() {
    let e = this.story.st;
    return ((e.tips ??= {}), e.tips);
  }
  enabled() {
    return this.game.store?.settings?.tips !== !1;
  }
  seen(e) {
    return !!this.store[e];
  }
  reset() {
    (this.story.cp?.story && (this.story.cp.story.tips = {}), (this.queue.length = 0));
  }
  list() {
    return Object.keys(this.data.tips || {}).map((e) => ({ id: e, text: this.text(e), seen: this.seen(e) }));
  }
  text(e, t = {}) {
    let a = this.data.tips?.[e];
    if (!a) return '';
    let s = ((this.coarse() ? a.touch : a.mouse) || a.text || '').replace(/\{name\}/g, t.name || 'Alguien');
    return this.story.text ? this.story.text(s) : s;
  }
  fire(e, t = {}) {
    let a = this.data.tips?.[e];
    return !a || !this.story.cp || !this.enabled() || this.seen(e) || this.queue.some((n) => n.id === e)
      ? !1
      : (this.queue.push({ id: e, vars: t, at: this.now(), now: !!a.now, ttl: (a.ttl ?? 40) * 1e3 }),
        this.pump(),
        !0);
  }
  hint(e, t = null) {
    return !e || !this.enabled() || (t && this.store[t])
      ? !1
      : (t && (this.store[t] = 1),
        this.queue.push({ id: t, text: e, at: this.now(), now: !1, ttl: 6e4 }),
        this.pump(),
        !0);
  }
  busy() {
    let e = this.game.ui;
    try {
      if (e?.dialogOpen?.()) return 'dialog';
      if (e?.isOpen?.()) return 'screen';
    } catch {}
    return '';
  }
  pump() {
    (clearTimeout(this.timer), (this.timer = 0));
    let e = this.now();
    if (((this.queue = this.queue.filter((r) => e - r.at <= r.ttl)), !this.queue.length)) return;
    let t = (this.data.gap ?? 7) * 1e3,
      a = this.busy(),
      n = this.queue.findIndex((r) => r.now),
      s = n >= 0 ? this.queue[n] : a ? null : this.queue[0],
      i = t - (e - this.last);
    if (!s || (i > 0 && !(s.now && e - this.last > 2500))) {
      this.timer = setTimeout(() => this.pump(), Math.max(400, Math.min(i > 0 ? i : 800, 3e3)));
      return;
    }
    (this.queue.splice(this.queue.indexOf(s), 1),
      this.show(s),
      this.queue.length && (this.timer = setTimeout(() => this.pump(), t)));
  }
  show(e) {
    if (!this.enabled()) return;
    let t = e.text || this.text(e.id, e.vars);
    if (!t) return;
    (e.id && this.data.tips?.[e.id] && (this.store[e.id] = 1), (this.last = this.now()));
    let a = this.game.ui,
      n = 'toast';
    try {
      !this.busy() && typeof a?.hud?.hint == 'function'
        ? (a.hud.hint(t), (n = 'hint'))
        : a?.toast?.(t, 'info');
    } catch {
      try {
        a?.toast?.(t, 'info');
      } catch {}
    }
    (this.shown.push({ id: e.id, text: t, how: n }), this.game.bus?.emit('tip', { id: e.id, text: t }));
  }
  isPc(e) {
    if (!e) return !1;
    let t = this.story.cp;
    return this.pcs.has(e) || !!t?.party?.includes(e);
  }
  nameOf(e) {
    let t = this.story.cp?.members?.[e];
    return fI(
      t?.short_name ||
        t?.name ||
        this.story.data.companions?.[e]?.short ||
        this.story.data.companions?.[e]?.name ||
        e,
    );
  }
  weightOf(e) {
    if (!e) return 0;
    if (this._weights.has(e)) return this._weights.get(e);
    let t = 0;
    try {
      let a = this.story.rules('item_info', { id: e });
      t = Number(a?.weight) || 0;
    } catch {
      t = 0;
    }
    return (this._weights.set(e, t), t);
  }
  checkWeight() {
    (clearTimeout(this._weightT),
      (this._weightT = setTimeout(() => {
        let e = this.story.cp;
        if (!(!e || this.seen('heavy')))
          for (let t of e.party || []) {
            let a = e.members?.[t];
            if (!a) continue;
            let n = 0;
            for (let i of a.pack || []) n += this.weightOf(i?.id || i);
            for (let [i, r] of Object.entries(a.items || {})) n += this.weightOf(i) * (Number(r) || 0);
            for (let i of a.weapons || []) n += this.weightOf(i);
            (a.armor && (n += this.weightOf(a.armor)), a.shield && (n += 6));
            let s = (a.abilities?.str ?? 10) * 15;
            if (n > s) return void this.fire('heavy', { name: this.nameOf(t) });
          }
      }, 300)));
  }
  attach() {
    let e = this.game.bus;
    if (!e || this._attached) return;
    this._attached = !0;
    let t = (n, s) =>
        e.on(n, (i) => {
          try {
            s(i || {});
          } catch (r) {
            console.warn('[historia] consejo', n, r);
          }
        }),
      a = !1;
    (t('step', (n) => {
      a || !this.isPc(n.who) || ((a = !0), setTimeout(() => this.fire('move'), 2500));
    }),
      t('story:options', (n) => {
        n.checks
          ? this.fire('dialog_check')
          : n.specials
            ? this.fire('dialog_special')
            : n.tones && this.fire('dialog_tone');
      }),
      t('quest:update', (n) => n.state === 'active' && !n.step && this.fire('journal')),
      t('codex:unlock', () => this.fire('codex')),
      t('companion:join', (n) => this.fire('companion_talk', { name: this.nameOf(n.id) })),
      t('approval', (n) => {
        n.delta < 0
          ? this.fire('approval_down', { name: this.nameOf(n.who) })
          : n.delta > 0 && this.fire('approval_up', { name: this.nameOf(n.who) });
      }),
      t('interact', (n) => {
        let s = n.object;
        s &&
          typeof s == 'object' &&
          s.lock &&
          (s.type === 'chest' || s.type === 'door' || s.type === 'cache') &&
          this.fire('locked');
      }),
      t('hidden:found', (n) => {
        let s = n.object?.type;
        s === 'trap'
          ? this.fire('trap_found')
          : s === 'group' || n.group
            ? this.fire('ambush_found')
            : this.fire('hidden_found', { name: this.nameOf(n.by) });
      }),
      t('trap:triggered', () => this.fire('trap_hit')),
      t('stealth:on', () => this.fire('stealth')),
      t('spotted', (n) => (n.ambush ? this.fire('ambushed') : this.fire('spotted'))),
      t('loot:taken', (n) => {
        let s = n.items || [];
        ((s.length || n.gold) && this.fire('loot'),
          s.some((i) => i && (i.unid || i.unidentified)) && this.fire('unidentified'),
          this.checkWeight());
      }),
      t('item:gain', () => this.checkWeight()),
      t('ui:open', (n) => n.name === 'tienda' && this.fire('shop')),
      t('scene:enter', (n) => n.name === 'travel' && this.fire('travel')),
      t('rest:short', () => this.fire('rest_short')),
      t('rest:long', () => this.fire('rest_long')),
      t('levelup', () => this.fire('levelup')),
      t('battle:start', (n) => {
        (this.fire('battle'),
          n.surprise ? this.fire('surprise') : n.surprisedParty?.length && this.fire('ambushed'));
      }),
      t('battle:turn', (n) => {
        n.isPc && (this.pcs.add(n.creature), this.fire('turn'));
      }),
      t('battle:event', ({ ev: n }) => {
        if (!n?.t) return;
        let s = this.isPc(n.who),
          i = () => this.nameOf(n.who);
        switch (n.t) {
          case 'attack':
            if ((n.oa && this.isPc(n.target) && this.fire('opportunity'), !s)) break;
            (this.fire('attack'), n.mode && this.fire('advantage'));
            break;
          case 'cast':
            s && this.fire('spell');
            break;
          case 'concentration':
            s && n.on !== !1 && this.fire('concentration', { name: i() });
            break;
          case 'condition':
            s && n.on && n.cond !== 'unconscious' && this.fire('condition', { name: i() });
            break;
          case 'downed':
            s && this.fire('downed', { name: i() });
            break;
          case 'death':
            s && this.fire('dead', { name: i() });
            break;
          case 'sneak':
            s && this.fire('sneak');
            break;
          case 'hide':
            s && n.success !== !1 && this.fire('hide');
            break;
          case 'dash':
            s && this.fire('dash');
            break;
          case 'disengage':
            s && this.fire('disengage');
            break;
          case 'item':
            s && this.fire('potion');
            break;
          case 'reaction':
            s && this.fire('reaction');
            break;
        }
      }),
      t('battle:end', (n) => {
        n.fled ? this.fire('fled') : n.won && setTimeout(() => this.fire('save'), 4e3);
      }),
      t('game:loaded', () => (this.queue.length = 0)));
  }
};

export { ym };
