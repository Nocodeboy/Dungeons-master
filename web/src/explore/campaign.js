// explore/campaign.js
// Reconstruido de publicado/juego.js (módulo __esm «SS»). Nombres locales aún minificados.

function ES(o, { party: e = null, level: t = 1 } = {}) {
  let a = o.store;
  if (a.cp) return a.cp;
  let n = o.params?.get?.('grupo'),
    s =
      e ||
      (n === 'completo'
        ? ['brenna', 'pip', 'ilyra']
        : n === 'odvar'
          ? ['brenna', 'pip', 'odvar']
          : ['brenna']),
    i = null;
  try {
    let r = o.rules?.('cp_new', { hero: MS, companions: s });
    r && !r.error && r.cp && (i = r.cp);
  } catch {}
  if (i) {
    for (let r of s)
      if (!i.party.includes(r)) {
        let l = o.rules('cp_recruit', { cp: i, id: r });
        l?.cp && (i = l.cp);
      }
  } else i = TI(s, t);
  for (let r of (o.params?.get?.('banderas') || '').split(',').filter(Boolean)) {
    let [l, c] = r.split('=');
    ((i.flags ??= {}), (i.flags[l] = c ?? !0));
  }
  return (a.start(i), a.cp);
}
function TI(o = ['brenna'], e = 1) {
  let t = { hero: { ...MS } },
    a = ['hero'];
  for (let s of o) TS[s] && ((t[s] = { id: s, ...TS[s] }), a.push(s));
  let n = {};
  for (let s of a) {
    let i = t[s],
      r = { fighter: 10, ranger: 10, rogue: 8, cleric: 8, wizard: 6 }[i.class] || 8,
      l = Math.floor(((i.abilities?.con ?? 10) - 10) / 2),
      c = r + l + (e - 1) * (r / 2 + 1 + l);
    n[s] = {
      hp: c,
      max_hp: c,
      temp_hp: 0,
      slots: [],
      resources: {},
      free_casts: {},
      hit_dice: e,
      dead: !1,
      buffs: [],
    };
  }
  return {
    version: 1,
    members: t,
    party: a,
    state: n,
    party_level: e,
    gold: 15,
    location: {},
    flags: {},
    journal: [],
    day: 1,
    playtime: 0,
    short_rests_left: 2,
    levels: {},
    merchants: {},
    story: {},
    _sustituto: !0,
  };
}
const MS = {
  id: 'hero',
  name: 'Aren Vael',
  pronoun: 'm',
  class: 'ranger',
  species: 'elf',
  lineage: 'wood_elf',
  background: 'outlander',
  abilities: { str: 12, dex: 17, con: 14, int: 10, wis: 15, cha: 8 },
  skills: ['perception', 'stealth', 'survival', 'athletics'],
  armor: 'leather',
  weapons: ['longbow', 'shortsword'],
  items: { potion_healing: 1 },
  appearance: { skin: '#e8c3a0', hair: '#6b4a2b', eyes: '#3a6b4a', body: 'm' },
};
const TS = {
  brenna: {
    name: 'Brenna Halvard',
    pronoun: 'f',
    class: 'fighter',
    subclass: 'champion',
    species: 'human',
    background: 'soldier',
    abilities: { str: 17, dex: 13, con: 15, int: 8, wis: 12, cha: 10 },
    skills: ['athletics', 'intimidation', 'perception', 'survival', 'insight'],
    armor: 'chain_mail',
    shield: !0,
    weapons: ['longsword', 'javelin'],
    items: { potion_healing: 1 },
  },
  pip: {
    name: 'Pip Tallowmere',
    pronoun: 'm',
    class: 'rogue',
    subclass: 'thief',
    species: 'halfling',
    background: 'criminal',
    abilities: { str: 8, dex: 17, con: 15, int: 12, wis: 13, cha: 10 },
    skills: ['sleight_of_hand', 'stealth', 'acrobatics', 'perception', 'deception', 'investigation'],
    expertise: ['stealth', 'sleight_of_hand'],
    armor: 'leather',
    weapons: ['shortsword', 'dagger', 'light_crossbow'],
    items: { potion_healing: 1, thieves_tools: 1 },
  },
  ilyra: {
    name: 'Ilyra Sorendel',
    pronoun: 'f',
    class: 'cleric',
    subclass: 'life',
    species: 'elf',
    lineage: 'wood_elf',
    background: 'acolyte',
    abilities: { str: 13, dex: 12, con: 14, int: 8, wis: 17, cha: 11 },
    skills: ['insight', 'religion', 'medicine', 'persuasion', 'perception'],
    armor: 'chain_mail',
    shield: !0,
    weapons: ['longsword'],
    items: { potion_healing: 1 },
  },
  odvar: {
    name: 'Maese Odvar Stonebrow',
    pronoun: 'm',
    class: 'wizard',
    subclass: 'evoker',
    species: 'dwarf',
    background: 'sage',
    abilities: { str: 10, dex: 12, con: 15, int: 17, wis: 13, cha: 8 },
    skills: ['arcana', 'history', 'investigation', 'insight'],
    armor: null,
    weapons: ['quarterstaff', 'dagger'],
    items: { potion_healing: 1 },
  },
};

export { ES };
