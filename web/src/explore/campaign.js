// explore/campaign.js — Asegura que hay una campaña activa al entrar en exploración. La crea con
// cp_new/cp_recruit del núcleo o, si no responde, con una campaña sustituta en JS. Lee los parámetros
// de depuración ?grupo=completo|odvar y ?banderas=a,b=valor. Lo usa explore/index.js.
// Reconstruido de publicado/juego.js (módulo __esm «SS»).

/** Devuelve la campaña activa de `game.store` o crea una nueva (héroe por defecto y compañeros). */
function ensureCampaign(game, { party = null, level = 1 } = {}) {
  let store = game.store;
  if (store.cp) return store.cp;
  let groupParam = game.params?.get?.('grupo'),
    companions =
      party ||
      (groupParam === 'completo'
        ? ['brenna', 'pip', 'ilyra']
        : groupParam === 'odvar'
          ? ['brenna', 'pip', 'odvar']
          : ['brenna']),
    cp = null;
  try {
    let res = game.rules?.('cp_new', { hero: DEFAULT_HERO, companions });
    res && !res.error && res.cp && (cp = res.cp);
  } catch {}
  if (cp) {
    for (let id of companions)
      if (!cp.party.includes(id)) {
        let rec = game.rules('cp_recruit', { cp, id });
        rec?.cp && (cp = rec.cp);
      }
  } else cp = buildFallbackCampaign(companions, level);
  for (let pair of (game.params?.get?.('banderas') || '').split(',').filter(Boolean)) {
    let [flag, value] = pair.split('=');
    ((cp.flags ??= {}), (cp.flags[flag] = value ?? !0));
  }
  return (store.start(cp), store.cp);
}
/** Campaña mínima en JS (marcada `_sustituto`) para cuando el núcleo de reglas no está. */
function buildFallbackCampaign(companions = ['brenna'], level = 1) {
  let members = { hero: { ...DEFAULT_HERO } },
    party = ['hero'];
  for (let id of companions)
    FALLBACK_COMPANIONS[id] && ((members[id] = { id, ...FALLBACK_COMPANIONS[id] }), party.push(id));
  let state = {};
  for (let id of party) {
    let m = members[id],
      hitDie = { fighter: 10, ranger: 10, rogue: 8, cleric: 8, wizard: 6 }[m.class] || 8,
      conMod = Math.floor(((m.abilities?.con ?? 10) - 10) / 2),
      hp = hitDie + conMod + (level - 1) * (hitDie / 2 + 1 + conMod);
    state[id] = {
      hp,
      max_hp: hp,
      temp_hp: 0,
      slots: [],
      resources: {},
      free_casts: {},
      hit_dice: level,
      dead: !1,
      buffs: [],
    };
  }
  return {
    version: 1,
    members,
    party,
    state,
    party_level: level,
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
/** Héroe por defecto para la exploración directa (sin pasar por el creador). */
const DEFAULT_HERO = {
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
/** Fichas de los compañeros para la campaña sustituta. */
const FALLBACK_COMPANIONS = {
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

export { ensureCampaign };
