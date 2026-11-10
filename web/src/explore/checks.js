// explore/checks.js
// Reconstruido de publicado/juego.js (módulo __esm «Mu»). Nombres locales aún minificados.

function Tu(o, e = Math.random) {
  let t = String(o ?? '0').replace(/\s+/g, ''),
    a = /^(\d*)d(\d+)([+-]\d+)?$/.exec(t);
  if (!a) return Number(t) || 0;
  let n = Number(a[1] || 1),
    s = Number(a[2]),
    i = Number(a[3] || 0);
  for (let r = 0; r < n; r++) i += 1 + Math.floor(e() * s);
  return Math.max(0, i);
}
function wI(o) {
  return () => {
    ((o |= 0), (o = (o + 1831565813) | 0));
    let e = Math.imul(o ^ (o >>> 15), 1 | o);
    return ((e = (e + Math.imul(e ^ (e >>> 7), 61 | e)) ^ e), ((e ^ (e >>> 14)) >>> 0) / 4294967296);
  };
}
const Zv = {
  athletics: 'str',
  acrobatics: 'dex',
  sleight_of_hand: 'dex',
  stealth: 'dex',
  arcana: 'int',
  history: 'int',
  investigation: 'int',
  nature: 'int',
  religion: 'int',
  animal_handling: 'wis',
  insight: 'wis',
  medicine: 'wis',
  perception: 'wis',
  survival: 'wis',
  deception: 'cha',
  intimidation: 'cha',
  performance: 'cha',
  persuasion: 'cha',
};
const wu = {
  athletics: 'Atletismo',
  acrobatics: 'Acrobacias',
  sleight_of_hand: 'Juego de manos',
  stealth: 'Sigilo',
  arcana: 'Arcanos',
  history: 'Historia',
  investigation: 'Investigaci\xF3n',
  nature: 'Naturaleza',
  religion: 'Religi\xF3n',
  animal_handling: 'Trato con animales',
  insight: 'Perspicacia',
  medicine: 'Medicina',
  perception: 'Percepci\xF3n',
  survival: 'Supervivencia',
  deception: 'Enga\xF1o',
  intimidation: 'Intimidaci\xF3n',
  performance: 'Interpretaci\xF3n',
  persuasion: 'Persuasi\xF3n',
  thieves_tools: 'Herramientas de ladr\xF3n',
};
const wS = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constituci\xF3n',
  int: 'Inteligencia',
  wis: 'Sabidur\xEDa',
  cha: 'Carisma',
};
const vI = {
  barbarian: 12,
  fighter: 10,
  paladin: 10,
  ranger: 10,
  bard: 8,
  cleric: 8,
  druid: 8,
  monk: 8,
  rogue: 8,
  warlock: 8,
  sorcerer: 6,
  wizard: 6,
};
const yI = {
  barbarian: ['str', 'con'],
  bard: ['dex', 'cha'],
  cleric: ['wis', 'cha'],
  druid: ['int', 'wis'],
  fighter: ['str', 'con'],
  monk: ['str', 'dex'],
  paladin: ['wis', 'cha'],
  ranger: ['str', 'dex'],
  rogue: ['dex', 'int'],
  sorcerer: ['con', 'cha'],
  warlock: ['wis', 'cha'],
  wizard: ['int', 'wis'],
};
const xI = {
  goblin_minion: {
    name: 'Trasgo esbirro',
    pp: 9,
    stealth: 6,
    size: 'small',
    drops: [
      { id: 'gold', n: '1d4', chance: 0.7 },
      { id: 'goblin_charm', n: 1, chance: 0.25 },
    ],
  },
  goblin_warrior: {
    name: 'Trasgo guerrero',
    pp: 9,
    stealth: 6,
    size: 'small',
    drops: [
      { id: 'gold', n: '1d6', chance: 0.8 },
      { id: 'scimitar', n: 1, chance: 0.25 },
    ],
  },
  goblin_archer: {
    name: 'Trasgo arquero',
    pp: 10,
    stealth: 6,
    size: 'small',
    drops: [
      { id: 'gold', n: '1d4', chance: 0.7 },
      { id: 'arrows', n: 1, chance: 0.35 },
    ],
  },
  goblin_boss: {
    name: 'Grisk, cabecilla',
    pp: 9,
    stealth: 6,
    size: 'small',
    drops: [
      { id: 'gold', n: '3d6', chance: 1 },
      { id: 'key_cache', n: 1, chance: 1 },
      { id: 'potion_healing', n: 1, chance: 0.5 },
    ],
  },
  goblin_shaman: {
    name: 'Trasgo cham\xE1n',
    pp: 10,
    stealth: 6,
    size: 'small',
    drops: [{ id: 'gold', n: '1d6', chance: 0.8 }],
  },
  wolf: { name: 'Lobo', pp: 15, stealth: 4, size: 'medium', drops: [{ id: 'wolf_pelt', n: 1, chance: 0.5 }] },
  skeleton: {
    name: 'Esqueleto',
    pp: 9,
    stealth: 0,
    size: 'medium',
    drops: [{ id: 'coin_durn', n: 1, chance: 0.35 }],
  },
  skeleton_archer: {
    name: 'Esqueleto arquero',
    pp: 10,
    stealth: 0,
    size: 'medium',
    drops: [{ id: 'coin_durn', n: 1, chance: 0.35 }],
  },
  zombie: { name: 'Zombi', pp: 8, stealth: 0, size: 'medium', drops: [] },
  wight: {
    name: 'Vorhan, el guardi\xE1n',
    pp: 13,
    stealth: 4,
    size: 'medium',
    drops: [
      { id: 'gold', n: '2d10', chance: 1 },
      { id: 'coin_durn', n: 3, chance: 1 },
    ],
  },
  giant_spider: { name: 'Ara\xF1a gigante', pp: 14, stealth: 7, size: 'large', drops: [] },
  swarm_of_rats: { name: 'Enjambre de ratas', pp: 10, stealth: 0, size: 'medium', drops: [] },
  mastiff: { name: 'Mast\xEDn', pp: 15, stealth: 0, size: 'medium', drops: [] },
};
const _I = {
  gold: 'Oro',
  potion_healing: 'Poci\xF3n de curaci\xF3n',
  potion_greater_healing: 'Poci\xF3n de curaci\xF3n mayor',
  rope: 'Cuerda',
  bolts: 'Virotes',
  arrows: 'Flechas',
  scroll_cure_wounds: 'Pergamino de Curar heridas',
  scroll_bless: 'Pergamino de Bendici\xF3n',
  scroll_web: 'Pergamino de Telara\xF1a',
  coin_durn: 'Moneda durn',
  torch: 'Antorcha',
  rations: 'Raciones',
  holy_symbol: 'S\xEDmbolo sagrado',
  gloves_thievery: 'Guantes de latrocinio',
  periapt_wound_closure: 'Amuleto de cierre de heridas',
  gem_quartz: 'Cuarzo',
  gem_garnet: 'Granate',
  gem_agate: '\xC1gata',
  durn_tablet: 'Tablilla durn',
  shortbow_p1: 'Arco corto +1',
  shield_p1: 'Escudo +1',
  goblin_charm: 'Amuleto trasgo',
  wolf_pelt: 'Piel de lobo',
  key_cache: 'Llave oxidada',
  key_mill: 'Llave del molino',
  scimitar: 'Cimitarra',
  thieves_tools: 'Herramientas de ladr\xF3n',
  crowbar: 'Palanca',
  healers_kit: 'Kit de curandero',
};
const Mm = (o) => 1 + Math.floor(o() * 20);
const Em = class {
  constructor(e) {
    ((this.game = e), (this.missing = new Set()), (this.used = new Set()));
    let t = Number(e.params?.get?.('semilla'));
    ((this.rng = Number.isFinite(t) && t ? wI(t) : Math.random),
      (this.summaryCache = null),
      e.bus?.on?.('cp:changed', () => (this.summaryCache = null)));
  }
  get cp() {
    return this.game.store.cp;
  }
  call(e, t = {}) {
    if (this.missing.has(e) || typeof this.game.rules != 'function') return null;
    let a;
    try {
      a = this.game.rules(e, t);
    } catch (n) {
      return (console.warn(`[exploraci\xF3n] ${e}:`, n), null);
    }
    return a && a.error && /op desconocida|sin combate|desconocid/i.test(String(a.error))
      ? (this.missing.add(e), null)
      : (a && a.error && console.warn(`[exploraci\xF3n] ${e}: ${a.error}`), a);
  }
  fallback(e) {
    this.used.has(e) || (this.used.add(e), console.info(`[exploraci\xF3n] sustituto en JS: ${e}`));
  }
  apply(e) {
    return (e?.cp && !e.cp.error && this.game.store.set(e.cp), e);
  }
  sheet(e) {
    return this.cp?.members?.[e] || {};
  }
  state(e) {
    let t = this.cp;
    return t ? ((t.state ??= {}), (t.state[e] ??= {}), t.state[e]) : {};
  }
  name(e) {
    return this.sheet(e).name || e;
  }
  shortName(e) {
    let t = this.name(e);
    return t.startsWith('Maese ') ? t.slice(6) : t.split(' ')[0];
  }
  alive() {
    return (this.cp?.party || []).filter((t) => !this.state(t).dead);
  }
  level() {
    return this.cp?.party_level || 1;
  }
  prof() {
    return 2 + Math.floor((this.level() - 1) / 4);
  }
  abilityMod(e, t) {
    let a = this.sheet(e),
      n = a.final_abilities?.[t] ?? a.abilities?.[t] ?? 10;
    return Math.floor((n - 10) / 2);
  }
  skillMod(e, t) {
    let n = this.summary(e)?.skills?.find?.((d) => d.id === t);
    if (n) return n.mod;
    let s = this.sheet(e),
      i = Zv[t] || 'wis',
      r = this.abilityMod(e, i),
      l = s.skills || [],
      c = t === 'perception' && (s.species === 'elf' || /elf/.test(s.lineage || ''));
    return (
      (l.includes(t) || c) && (r += this.prof()),
      (s.expertise || []).includes(t) && (r += this.prof()),
      r
    );
  }
  saveMod(e, t) {
    let a = this.summary(e);
    if (a?.abilities?.[t]?.save !== void 0) return a.abilities[t].save;
    let n = this.sheet(e),
      s = this.abilityMod(e, t);
    return ((yI[n.class] || []).includes(t) && (s += this.prof()), s);
  }
  toolMod(e, t) {
    let a = this.sheet(e),
      n = this.abilityMod(e, 'dex');
    return (
      t === 'thieves_tools' &&
        (a.class === 'rogue' || a.background === 'criminal' || (a.tools || []).includes(t)) &&
        (n += this.prof()),
      this.count(e, 'gloves_thievery') > 0 && (n += 5),
      n
    );
  }
  summary(e) {
    if (!this.summaryCache) {
      let t = this.cp ? this.call('party_summary', { cp: this.cp }) : null;
      this.summaryCache = new Map();
      let a = Array.isArray(t) ? t : t?.party || t?.members || [];
      for (let n of a) n?.id && this.summaryCache.set(n.id, n);
    }
    return this.summaryCache.get(e) || null;
  }
  hp(e) {
    let t = this.state(e),
      n = this.summary(e)?.max_hp ?? t.max_hp ?? this.maxHpGuess(e);
    return { hp: t.hp ?? n, max: n, temp: t.temp_hp || 0 };
  }
  maxHpGuess(e) {
    let t = this.sheet(e),
      a = vI[t.class] || 8,
      n = this.abilityMod(e, 'con'),
      s = this.level();
    return Math.max(1, a + n + (s - 1) * (a / 2 + 1 + n));
  }
  passive(e = 'perception') {
    let t = this.cp,
      a = t ? this.call('passive', { cp: t, skill: e }) : null;
    if (a && !a.error && typeof a == 'object') return a;
    this.fallback('passive');
    let n = {};
    for (let s of this.alive()) n[s] = 10 + this.skillMod(s, e);
    return n;
  }
  best(e) {
    let t = this.cp,
      a = t
        ? this.call(
            'best',
            e === 'thieves_tools' ? { cp: t, tool: e } : Zv[e] ? { cp: t, skill: e } : { cp: t, ability: e },
          )
        : null;
    if (a && !a.error && a.who) return a;
    let n = null;
    for (let s of this.alive()) {
      let i =
        e === 'thieves_tools' ? this.toolMod(s, e) : Zv[e] ? this.skillMod(s, e) : this.abilityMod(s, e);
      (!n || i > n.mod) && (n = { who: s, mod: i });
    }
    return n || { who: null, mod: 0 };
  }
  check(e) {
    let t = this.cp,
      a = { cp: t, ...e };
    if (t) {
      let m = this.call('check', a);
      if (m && !m.error && m.total !== void 0) return m;
    }
    this.fallback('check');
    let n = e.who,
      s = e.tool || e.skill || e.save || e.ability;
    (!n || n === 'best') && (n = this.best(s).who || this.alive()[0]);
    let i, r;
    e.tool
      ? ((i = this.toolMod(n, e.tool)), (r = wu[e.tool] || e.tool))
      : e.skill
        ? ((i = this.skillMod(n, e.skill)), (r = wu[e.skill] || e.skill))
        : e.save
          ? ((i = this.saveMod(n, e.save)), (r = `Salvaci\xF3n de ${wS[e.save] || e.save}`))
          : ((i = this.abilityMod(n, e.ability)), (r = wS[e.ability] || e.ability));
    let l = Mm(this.rng),
      c = [l],
      d = l;
    e.adv && !e.dis
      ? (c.push(Mm(this.rng)), (d = Math.max(...c)))
      : e.dis && !e.adv && (c.push(Mm(this.rng)), (d = Math.min(...c)));
    let u = d + i,
      h = e.dc ?? null,
      p = h == null ? !0 : u >= h;
    return {
      who: n,
      label: r,
      d20: c,
      mod: i,
      total: u,
      dc: h,
      success: p,
      crit: d === 20,
      text: `${this.shortName(n)}: ${r} ${u}${h != null ? ` contra CD ${h}` : ''}`,
    };
  }
  groupCheck(e, t) {
    let a = this.cp,
      n = a ? this.call('group_check', { cp: a, skill: e, dc: t }) : null;
    if (n && !n.error && Array.isArray(n.results)) return n;
    this.fallback('group_check');
    let s = this.alive().map((r) => {
        let l = this.sheet(r),
          c = e === 'stealth' && ['chain_mail', 'splint', 'plate', 'ring_mail'].includes(l.armor);
        return this.check({ who: r, skill: e, dc: t, dis: c });
      }),
      i = s.filter((r) => r.success).length;
    return { results: s, success: i * 2 >= s.length };
  }
  damage(e, t, a = 'piercing') {
    let n = this.cp,
      s = n ? this.call('cp_damage', { cp: n, id: e, amount: t, type: a }) : null;
    if (s && !s.error && s.cp) return (this.apply(s), s);
    this.fallback('cp_damage');
    let i = this.state(e),
      { hp: r, max: l } = this.hp(e),
      c = t,
      d = Math.min(i.temp_hp || 0, c);
    return (
      (i.temp_hp = (i.temp_hp || 0) - d),
      (c -= d),
      (i.hp = Math.max(1, r - c)),
      (i.max_hp ??= l),
      this.game.store.set(n),
      { hp: i.hp, down: !1, dead: !1 }
    );
  }
  count(e, t) {
    let a = this.sheet(e),
      n = Number(a.items?.[t] || 0);
    for (let s of a.pack || []) s.id === t && (n += Number(s.n || 1));
    return (t === 'thieves_tools' && n === 0 && (a.kit?.items || []).includes?.(t) && (n = 1), n);
  }
  holder(e) {
    let t = this.cp,
      a = t ? this.call('has_item', { cp: t, item: e }) : null;
    if (a && !a.error && 'who' in a) {
      let s =
        (a.holders || []).find((i) => !i.dead && this.alive().includes(i.id))?.id ||
        (a.who && this.alive().includes(a.who) ? a.who : null);
      if (s || e !== 'thieves_tools') return s;
    } else for (let n of this.alive()) if (this.count(n, e) > 0) return n;
    if (e === 'thieves_tools') {
      for (let n of this.alive())
        if (this.sheet(n).class === 'rogue' || this.sheet(n).background === 'criminal') return n;
    }
    return null;
  }
  give(e, t = 1, a = !1, n = void 0) {
    let s = this.cp;
    if (!s) return null;
    if (e === 'gold') return (this.gold(t), null);
    let i = this.call('cp_give', { cp: s, item: e, n: t, unid: a, to: n });
    if (i && !i.error && i.cp)
      return (this.apply(i), this.game.bus.emit('item:gain', { id: e, n: t, who: i.who }), i.who);
    this.fallback('cp_give');
    let r = n || this.alive()[0] || 'hero',
      l = s.members[r] || (s.members[r] = {});
    return (
      (l.items ??= {}),
      (l.items[e] = (l.items[e] || 0) + t),
      this.game.store.set(s),
      this.game.bus.emit('item:gain', { id: e, n: t, who: r }),
      r
    );
  }
  gold(e) {
    let t = this.cp;
    if (!t) return !1;
    let a = this.call('cp_gold', { cp: t, delta: e });
    return a && !a.error && a.cp
      ? (this.apply(a), a.ok !== !1 && this.game.bus.emit('gold', { delta: e }), a.ok !== !1)
      : (this.fallback('cp_gold'),
        (t.gold || 0) + e < 0
          ? !1
          : ((t.gold = (t.gold || 0) + e),
            this.game.store.set(t),
            this.game.bus.emit('gold', { delta: e }),
            !0));
  }
  info(e) {
    if (((this._info ??= new Map()), !this._info.has(e))) {
      let t = this.call('item_info', { id: e });
      this._info.set(e, t && !t.error ? t : null);
    }
    return this._info.get(e);
  }
  itemName(e) {
    let t = this.info(e);
    return t?.name ? t.name : _I[e] || e.replace(/_/g, ' ');
  }
  unidentified(e) {
    let t = this.info(e);
    return t
      ? !!(t.magic && ['weapon', 'armor', 'shield', 'wondrous'].includes(t.kind))
      : /_p1$|^cloak_|^ring_|^boots_|^gloves_|^gauntlets_|^bracers_|^periapt_|^amulet_|^brooch_|^stone_/.test(
          e,
        );
  }
  monster(e) {
    if (!this._monsters) {
      let a = this.call('data', { name: 'monsters' });
      this._monsters = a && !a.error && typeof a == 'object' ? a : null;
    }
    let t = this._monsters?.[e];
    return t
      ? {
          name: t.name,
          pp: t.passive_perception ?? 10,
          stealth: t.skills?.stealth ?? 0,
          size: t.size,
          drops: t.drops || [],
          hp: t.hp,
          ac: t.ac,
        }
      : xI[e] || { name: e, pp: 10, stealth: 0, size: 'medium', drops: [] };
  }
  drops(e) {
    let t = [];
    for (let a of this.monster(e).drops || []) {
      if (this.rng() > (a.chance ?? 1)) continue;
      let n = typeof a.n == 'string' ? Tu(a.n, this.rng) : Number(a.n ?? 1);
      n > 0 && t.push({ id: a.id, n });
    }
    return t;
  }
  d20() {
    return Mm(this.rng);
  }
  roll(e) {
    return Tu(e, this.rng);
  }
};

export { Em, Tu, wu };
