// actors/companions.js
// Reconstruido de publicado/juego.js (módulo __esm «vv»). Nombres locales aún minificados.

import { shade, heroLook } from './look.js';
import { Yn } from './appearance.js';

function Jf(o, e = {}) {
  let t = COMPANIONS[o];
  if (!t) return null;
  let a = heroLook({ ...t, id: o }, e);
  return tL(a, t.tweak);
}
function tL(o, e) {
  if (!e) return o;
  if ((e.outfit && Object.assign(o.outfit, e.outfit), e.gear))
    for (let [t, a] of Object.entries(e.gear)) a === null ? delete o.gear[t] : (o.gear[t] = a);
  return (e.posture && (o.posture = { ...(o.posture || {}), ...e.posture }), o);
}
function aL(o) {
  let e = Yn(o),
    t = (r) => r[Math.floor(e() * r.length)],
    a = e() < 0.5 ? 'f' : 'm',
    n = t(['human', 'human', 'human', 'human', 'halfling', 'dwarf', 'half_elf']),
    s = {
      id: `aldeano_${o}`,
      species: n,
      class: 'commoner',
      pronoun: a,
      appearance: {
        body: a,
        face: Math.floor(e() * 4),
        hair: t(a === 'f' ? ['largo', 'mono', 'trenza', 'coleta'] : ['raya', 'rapado', 'calvo', 'raya']),
        hairColor: t(['#2a2018', '#4a3020', '#6b4a2b', '#8a5a2e', '#9a948c', '#c9b48a']),
        beard: a === 'm' ? t(['ninguna', 'barba', 'bigote', 'perilla']) : 'ninguna',
        cloth1: t(['#6a5a40', '#5a4a3a', '#4a5a6a', '#6a3a2e', '#5a6a4a', '#7a6a50']),
        cloth2: t(['#d8ccb0', '#c9b48a', '#b8a888']),
        height: 0.96 + e() * 0.08,
        build: t(['delgada', 'media', 'robusta']),
      },
    },
    i = heroLook(s);
  return (
    (i.outfit = { torso: 'ca', brazos: 'ca', piernas: 'ca', pies: 'ca' }),
    (i.gear = e() < 0.3 ? { apron: '#c8bca0' } : {}),
    a === 'f' && e() < 0.5 && (i.gear.robe = 'larga'),
    (i.kind = 'npc'),
    i
  );
}
function pT(o) {
  typeof o == 'string' && (o = { id: o });
  let e = o.visual ? { ...o.visual, id: o.id, pronoun: o.pronoun } : o,
    t = e.id;
  if (t && COMPANIONS[t]) return Jf(t);
  if (t === 'aldeano' || e.villager) return aL(e.seed ?? 1);
  let a = t && NPC_LOOKS[t];
  if (a && !a.villager) {
    let i = heroLook({ ...a, id: t, armor: '', weapons: [], shield: !1 });
    return (
      (i.outfit = { ...a.outfit }),
      (i.gear = { ...a.gear }),
      (i.grips = i.gear.main ? ['r'] : []),
      (i.style = 'unarmed'),
      a.posture && (i.posture = a.posture),
      (i.kind = 'npc'),
      e.skin && (i.colors.skin = e.skin),
      e.hair && (i.colors.hair = e.hair),
      e.cloth && (i.colors.cloth1 = e.cloth),
      i
    );
  }
  let n = {
      id: t,
      species: e.species || 'human',
      class: e.class || 'commoner',
      pronoun: e.pronoun,
      armor: '',
      weapons: [],
      shield: !1,
      appearance: {
        body: e.pronoun === 'f' ? 'f' : 'm',
        skin: e.skin,
        hairColor: e.hair,
        cloth1: e.cloth,
        cloth2: e.cloth ? shade(e.cloth, 1.6) : void 0,
      },
    },
    s = heroLook(n);
  return (
    ['wizard', 'cleric', 'druid', 'paladin', 'fighter'].includes(n.class) ||
      (s.outfit = { torso: 'ca', brazos: 'ca', piernas: 'ca', pies: 'ca' }),
    (s.kind = 'npc'),
    s
  );
}
const COMPANIONS = {
  brenna: {
    name: 'Brenna Halvard',
    species: 'human',
    class: 'fighter',
    armor: 'chain_mail',
    shield: !0,
    weapons: ['longsword', 'javelin'],
    pronoun: 'f',
    appearance: {
      body: 'f',
      face: 2,
      skin: '#e8c0a0',
      eyes: '#4a6a5a',
      hair: 'mono',
      hairColor: '#5a2416',
      cloth1: '#6e2a24',
      cloth2: '#c9b48a',
      metal: 'acero',
      height: 1.03,
      build: 'robusta',
    },
    tweak: { gear: { cape: 'corta', capeColor: '#4a2420' } },
  },
  pip: {
    name: 'Pip Tallowmere',
    species: 'halfling',
    class: 'rogue',
    armor: 'leather',
    shield: !1,
    weapons: ['shortsword', 'dagger', 'light_crossbow'],
    pronoun: 'm',
    appearance: {
      body: 'm',
      face: 1,
      skin: '#e2b48a',
      eyes: '#5a3a1e',
      hair: 'raya',
      hairColor: '#7a4a24',
      cloth1: '#4e5a3a',
      cloth2: '#c9b48a',
      metal: 'bronce',
      build: 'media',
    },
    tweak: { outfit: { capucha: !1 }, gear: { pouch: !0 } },
  },
  ilyra: {
    name: 'Ilyra Sorendel',
    species: 'elf',
    lineage: 'wood_elf',
    class: 'cleric',
    armor: 'chain_mail',
    shield: !0,
    weapons: ['longsword'],
    pronoun: 'f',
    appearance: {
      body: 'f',
      face: 3,
      skin: '#f0d4bc',
      eyes: '#4a7a4a',
      hair: 'largo',
      hairColor: '#e2c88a',
      ears: 'largas',
      cloth1: '#ece2c8',
      cloth2: '#c9a64a',
      metal: 'laton',
      height: 1.02,
      build: 'delgada',
    },
    tweak: { gear: { tabardColor: '#ece2c8' } },
  },
  odvar: {
    name: 'Maese Odvar',
    species: 'dwarf',
    class: 'wizard',
    armor: '',
    shield: !1,
    weapons: ['quarterstaff', 'dagger'],
    pronoun: 'm',
    appearance: {
      body: 'm',
      face: 1,
      skin: '#e0b08a',
      eyes: '#3a5a8a',
      hair: 'calvo',
      hairColor: '#c8c0b4',
      beard: 'trenzada',
      cloth1: '#3e4e6e',
      cloth2: '#c9a64a',
      metal: 'laton',
      build: 'robusta',
    },
    tweak: { gear: { hat: null, glasses: !0, mantle: null } },
  },
};
const NPC_LOOKS = {
  corwin: {
    name: 'Corwin',
    species: 'human',
    class: 'commoner',
    pronoun: 'm',
    appearance: {
      body: 'm',
      face: 2,
      skin: '#e0b090',
      hair: 'raya',
      hairColor: '#4a3020',
      beard: 'barba',
      cloth1: '#7a3b2e',
      cloth2: '#e8dcc0',
      build: 'robusta',
      height: 1.02,
    },
    outfit: { torso: 'ca', brazos: 'ca', piernas: 'ca', pies: 'ca' },
    gear: { apron: '#d8ccb0', main: 'mug' },
  },
  dagna: {
    name: 'Dagna Emberforge',
    species: 'dwarf',
    class: 'commoner',
    pronoun: 'f',
    appearance: {
      body: 'f',
      face: 2,
      skin: '#c9946c',
      hair: 'trenza',
      hairColor: '#9a4a24',
      cloth1: '#5b4332',
      cloth2: '#8a6a4a',
      build: 'robusta',
    },
    outfit: { torso: 'ca', brazos: 'piel', piernas: 'ex', pies: 'ex', cintos: !0 },
    gear: { apron: '#4a3020', main: 'light_hammer', bracers: 'cuero' },
  },
  ysolde: {
    name: 'Ysolde',
    species: 'human',
    class: 'commoner',
    pronoun: 'f',
    appearance: {
      body: 'f',
      face: 3,
      skin: '#e8c3a0',
      hair: 'largo',
      hairColor: '#c9b48a',
      cloth1: '#4f6b3a',
      cloth2: '#d8ccb0',
      build: 'delgada',
    },
    outfit: { torso: 'ca', brazos: 'ca', piernas: 'ca', pies: 'ca' },
    gear: { robe: 'larga', robeColor: '#4f6b3a', pouch: !0, mantle: 'hojas' },
  },
  tobin: {
    name: 'Tobin Hilltopple',
    species: 'halfling',
    class: 'commoner',
    pronoun: 'm',
    appearance: {
      body: 'm',
      face: 1,
      skin: '#d9a882',
      hair: 'raya',
      hairColor: '#6b4a2b',
      beard: 'bigote',
      cloth1: '#7a5a2a',
      cloth2: '#c9b48a',
    },
    outfit: { torso: 'ca', brazos: 'ca', piernas: 'ca', pies: 'ca' },
    gear: { hat: 'chambergo', back: ['mochila'], pouch: !0 },
  },
  aldis: {
    name: 'Hermana Aldis',
    species: 'human',
    class: 'commoner',
    pronoun: 'f',
    appearance: {
      body: 'f',
      face: 0,
      skin: '#f0d0b0',
      hair: 'mono',
      hairColor: '#d8d8d0',
      cloth1: '#d8c890',
      cloth2: '#f0e8d0',
      build: 'media',
    },
    outfit: { torso: 'ca', brazos: 'ca', piernas: 'ca', pies: 'ca' },
    gear: {
      robe: 'larga',
      robeColor: '#e8dcc0',
      tabard: 'larga',
      tabardColor: '#d8c890',
      emblem: !0,
      hat: 'diadema',
      book: !0,
    },
    posture: { hunch: 0.08 },
  },
  maren: {
    name: 'Maren Ashford',
    species: 'human',
    class: 'commoner',
    pronoun: 'f',
    appearance: {
      body: 'f',
      face: 2,
      skin: '#d8b090',
      hair: 'mono',
      hairColor: '#2e2a28',
      cloth1: '#5a3f6b',
      cloth2: '#c9b48a',
      build: 'media',
    },
    outfit: { torso: 'ca', brazos: 'ca', piernas: 'ex', pies: 'ex', cintos: !0 },
    gear: { cape: 'larga', capeColor: '#3e2a4a', chain: !0 },
  },
  holt: {
    name: 'Holt Varga',
    species: 'human',
    class: 'commoner',
    pronoun: 'm',
    appearance: {
      body: 'm',
      face: 1,
      skin: '#e8c4a4',
      hair: 'raya',
      hairColor: '#8a8478',
      beard: 'perilla',
      cloth1: '#26364a',
      cloth2: '#c9b48a',
      build: 'delgada',
      height: 1.01,
    },
    outfit: { torso: 'ca', brazos: 'ca', piernas: 'ex', pies: 'ex', cintos: !0 },
    gear: { robe: 'corta', robeColor: '#26364a', cape: 'larga', capeColor: '#1e2a3a', chain: !0, pouch: !0 },
  },
  sedge: {
    name: 'La vieja Sedge',
    species: 'human',
    class: 'commoner',
    pronoun: 'f',
    appearance: {
      body: 'f',
      face: 1,
      skin: '#d4a888',
      hair: 'trenza',
      hairColor: '#e4e0d8',
      cloth1: '#6a5a40',
      cloth2: '#9a8a6a',
      build: 'delgada',
      height: 0.96,
    },
    outfit: { torso: 'ca', brazos: 'ca', piernas: 'ca', pies: 'ca' },
    gear: { robe: 'larga', robeColor: '#5a4a34', mantle: 'pieles', mantleColor: '#9a8a70', main: 'crook' },
    posture: { hunch: 0.32 },
  },
  aldeano: { villager: !0 },
};

export { COMPANIONS, Jf, NPC_LOOKS, pT };
