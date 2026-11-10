// story/codex.js
// Reconstruido de publicado/juego.js (módulo __esm «gS»). Nombres locales aún minificados.

import historiaSaber from '../datos/historia/saber.json';

const mS = ['visited', 'met', 'fought', 'killed'];
const Yv = (o) => (o == null ? [] : Array.isArray(o) ? o : [o]);
const gI = (o) => String(o).replace('.', ',');
const Codex = class {
  constructor(e, t = historiaSaber) {
    ((this.story = e),
      (this.game = e.game),
      (this.data = t || { entries: {} }),
      (this._monsters = new Map()),
      (this._t = 0),
      (this._cp = null),
      (this.quiet = !1));
  }
  get st() {
    let e = this.story.st;
    e.codex ??= {};
    for (let t of ['u', 'read', ...mS]) e.codex[t] ??= {};
    return e.codex;
  }
  knows(e, t) {
    return this.story.cp ? !!this.st[e]?.[t] : !1;
  }
  note(e, t) {
    if (!t || typeof t != 'string' || !this.story.cp || !mS.includes(e)) return !1;
    let a = this.st[e];
    return a[t] ? !1 : ((a[t] = 1), this.soon(), !0);
  }
  soon() {
    (clearTimeout(this._t), (this._t = setTimeout(() => this.sync(), 60)));
  }
  sync({ quiet: e = this.quiet } = {}) {
    if (!this.story.cp) return [];
    this._cp !== this.story.cp && ((this._cp = this.story.cp), e || this.sync({ quiet: !0 }));
    let t = this.st,
      a = [];
    for (let [n, s] of Object.entries(this.data.entries || {}))
      t.u[n] ||
        (this.story.test(s.unlock || 'true', {}) &&
          ((t.u[n] = this.story.cp.day || 1), e && (t.read[n] = 1), a.push(n)));
    if (!e && a.length) {
      for (let s of a)
        this.game.bus?.emit('codex:unlock', { id: s, cat: this.data.entries[s].cat, title: this.title(s) });
      let n =
        a.length === 1
          ? `Saber nuevo: ${this.title(a[0])}.`
          : `Saber nuevo: ${a.length} entradas en el diario.`;
      try {
        this.game.ui?.toast?.(n, 'info');
      } catch {}
    }
    return a;
  }
  title(e) {
    let t = this.data.entries?.[e];
    if (!t) return '';
    for (let a of Yv(t.title)) {
      if (typeof a == 'string') return this.story.text(a);
      if (a && this.story.test(a.if, {})) return this.story.text(a.text);
    }
    return '';
  }
  monsterInfo(e) {
    if (this._monsters.has(e)) return this._monsters.get(e);
    let t = null;
    try {
      ((t = this.story.rules('monster_info', { id: e })), (!t || t.error) && (t = null));
    } catch {
      t = null;
    }
    return (t && this._monsters.set(e, t), t);
  }
  groupMonsters(e) {
    let a = (this.game.explore?.level?.groups || []).find((s) => s.id === e),
      n = a ? (a.enemies || []).map((s) => s.id || s.template || s) : this.data.groups?.[e] || [];
    return [...new Set(n.filter((s) => typeof s == 'string'))];
  }
  facts(e) {
    let t = [];
    for (let a of Yv(e.monsters)) {
      if (!this.knows('fought', a)) continue;
      let n = this.monsterInfo(a);
      if (!n) continue;
      let s = {
        id: a,
        name: n.name,
        ac: n.ac,
        hp: n.hp,
        speed: n.speed_text,
        cr: n.cr,
        type: n.type_name,
        lines: [],
      };
      if (this.knows('killed', a)) {
        (n.vulnerable?.length && s.lines.push(`Vulnerable: ${n.vulnerable.join(', ')}.`),
          n.resist?.length && s.lines.push(`Resiste: ${n.resist.join(', ')}.`),
          n.immune?.length && s.lines.push(`Inmune: ${n.immune.join(', ')}.`));
        for (let i of n.traits || []) i?.name && i.desc && s.lines.push(`${i.name}: ${i.desc}`);
      }
      t.push(s);
    }
    return t;
  }
  factsText(e) {
    if (!e.length) return '';
    let t = '*Lo que sab\xE9is tras luchar:*',
      a = e.map((n) => {
        let s = `**${n.name}** \xB7 CA ${n.ac} \xB7 ${n.hp} PG \xB7 ${n.speed} \xB7 desaf\xEDo ${gI(n.cr)}`;
        return n.lines.length
          ? `${s}
${n.lines.join(`
`)}`
          : s;
      });
    return [t, ...a].join(`

`);
  }
  entry(e) {
    let t = this.data.entries?.[e];
    if (!t) return null;
    let a = !!(this.story.cp && this.st.u[e]),
      n = this.data.cats || {};
    if (!a)
      return {
        id: e,
        cat: t.cat,
        catName: n[t.cat] || t.cat,
        title: '???',
        text: '',
        unlocked: !1,
        fresh: !1,
        facts: [],
      };
    let s = this.facts(t),
      i = Yv(t.text)
        .map((l) => this.story.text(l))
        .filter(Boolean),
      r = this.factsText(s);
    return (
      r && i.push(r),
      {
        id: e,
        cat: t.cat,
        catName: n[t.cat] || t.cat,
        title: this.title(e),
        text: i.join(`

`),
        unlocked: !0,
        fresh: !this.st.read[e],
        facts: s,
      }
    );
  }
  list({ all: e = !0 } = {}) {
    let t = Object.keys(this.data.cats || {});
    return Object.keys(this.data.entries || {})
      .map((n) => this.entry(n))
      .filter((n) => n && (e || n.unlocked))
      .sort((n, s) => t.indexOf(n.cat) - t.indexOf(s.cat));
  }
  read(e) {
    this.story.cp && this.st.u[e] && (this.st.read[e] = 1);
  }
  attach() {
    let e = this.game.bus;
    if (!e || this._attached) return;
    this._attached = !0;
    let t = (s, i) =>
        e.on(s, (r) => {
          try {
            i(r || {});
          } catch (l) {
            console.warn('[historia] saber', s, l);
          }
        }),
      a = () => {
        let s = this.story.levelId();
        (s && this.story.cp && (this.st.visited[s] = 1),
          (this._cp = this.story.cp),
          this.sync({ quiet: !0 }));
      };
    (t('game:start', a),
      t('game:loaded', a),
      t('level:enter', (s) => this.note('visited', s.level)),
      t('dialog:open', (s) => {
        (this.note('met', s.id), s.npc && s.npc !== s.id && this.note('met', s.npc));
      }),
      t('interact', (s) => {
        if (s.kind !== 'npc') return;
        let i = typeof s.object == 'string' ? s.object : s.object?.id;
        this.note('met', i);
      }));
    let n = (s) => (s.groups?.length ? s.groups : [s.group]).filter(Boolean);
    (t('battle:start', (s) => {
      for (let i of n(s)) for (let r of this.groupMonsters(i)) this.note('fought', r);
    }),
      t('battle:end', (s) => {
        if (s.won) for (let i of n(s)) for (let r of this.groupMonsters(i)) this.note('killed', r);
      }));
    for (let s of ['flag:set', 'item:gain', 'companion:join', 'quest:update', 'dialog:close'])
      t(s, () => this.soon());
  }
};

export { Codex };
