// actors/companions.js
// Reconstruido de publicado/juego.js (módulo __esm «vv»).
//
// Aspecto de los compañeros (Brenna, Pip, Ilyra, Odvar) y de los PNJ con nombre (COMPANIONS y
// NPC_LOOKS: hojas de personaje con su aspecto y retoques de ropa y equipo), aldeanos al azar con
// semilla y PNJ genéricos a partir de su campo `visual`. Devuelven looks para buildHumanoid.
// Lo usan index.js (makeCompanion, makeNpc) y portraits.js.

import { shade, heroLook } from './look.js';
import { seededRandom } from './appearance.js';

/** Look de un compañero por id (null si no existe), con sus retoques aplicados. */
function companionLook(id, opts = {}) {
  let def = COMPANIONS[id];
  if (!def) return null;
  let look = heroLook({ ...def, id }, opts);
  return applyTweak(look, def.tweak);
}
/** Aplica a un look los retoques {outfit, gear (null borra), posture}. */
function applyTweak(look, tweak) {
  if (!tweak) return look;
  if ((tweak.outfit && Object.assign(look.outfit, tweak.outfit), tweak.gear))
    for (let [key, value] of Object.entries(tweak.gear))
      value === null ? delete look.gear[key] : (look.gear[key] = value);
  return (tweak.posture && (look.posture = { ...(look.posture || {}), ...tweak.posture }), look);
}
/** Aldeano al azar pero determinista según `seed` (especie, cuerpo, pelo, ropa, delantal…). */
function villagerLook(seed) {
  let rand = seededRandom(seed),
    pick = (list) => list[Math.floor(rand() * list.length)],
    body = rand() < 0.5 ? 'f' : 'm',
    species = pick(['human', 'human', 'human', 'human', 'halfling', 'dwarf', 'half_elf']),
    sheet = {
      id: `aldeano_${seed}`,
      species,
      class: 'commoner',
      pronoun: body,
      appearance: {
        body,
        face: Math.floor(rand() * 4),
        hair: pick(
          body === 'f' ? ['largo', 'mono', 'trenza', 'coleta'] : ['raya', 'rapado', 'calvo', 'raya'],
        ),
        hairColor: pick(['#2a2018', '#4a3020', '#6b4a2b', '#8a5a2e', '#9a948c', '#c9b48a']),
        beard: body === 'm' ? pick(['ninguna', 'barba', 'bigote', 'perilla']) : 'ninguna',
        cloth1: pick(['#6a5a40', '#5a4a3a', '#4a5a6a', '#6a3a2e', '#5a6a4a', '#7a6a50']),
        cloth2: pick(['#d8ccb0', '#c9b48a', '#b8a888']),
        height: 0.96 + rand() * 0.08,
        build: pick(['delgada', 'media', 'robusta']),
      },
    },
    look = heroLook(sheet);
  return (
    (look.outfit = { torso: 'ca', brazos: 'ca', piernas: 'ca', pies: 'ca' }),
    (look.gear = rand() < 0.3 ? { apron: '#c8bca0' } : {}),
    body === 'f' && rand() < 0.5 && (look.gear.robe = 'larga'),
    (look.kind = 'npc'),
    look
  );
}
/**
 * Look de un PNJ: compañero, aldeano (`id === 'aldeano'` o `villager`), PNJ con nombre de NPC_LOOKS o
 * genérico a partir de {species, class, pronoun, skin, hair, cloth}. Acepta un id o una definición.
 */
function npcLook(def) {
  typeof def == 'string' && (def = { id: def });
  let visual = def.visual ? { ...def.visual, id: def.id, pronoun: def.pronoun } : def,
    id = visual.id;
  if (id && COMPANIONS[id]) return companionLook(id);
  if (id === 'aldeano' || visual.villager) return villagerLook(visual.seed ?? 1);
  let preset = id && NPC_LOOKS[id];
  if (preset && !preset.villager) {
    let look = heroLook({ ...preset, id, armor: '', weapons: [], shield: !1 });
    return (
      (look.outfit = { ...preset.outfit }),
      (look.gear = { ...preset.gear }),
      (look.grips = look.gear.main ? ['r'] : []),
      (look.style = 'unarmed'),
      preset.posture && (look.posture = preset.posture),
      (look.kind = 'npc'),
      visual.skin && (look.colors.skin = visual.skin),
      visual.hair && (look.colors.hair = visual.hair),
      visual.cloth && (look.colors.cloth1 = visual.cloth),
      look
    );
  }
  let sheet = {
      id,
      species: visual.species || 'human',
      class: visual.class || 'commoner',
      pronoun: visual.pronoun,
      armor: '',
      weapons: [],
      shield: !1,
      appearance: {
        body: visual.pronoun === 'f' ? 'f' : 'm',
        skin: visual.skin,
        hairColor: visual.hair,
        cloth1: visual.cloth,
        cloth2: visual.cloth ? shade(visual.cloth, 1.6) : void 0,
      },
    },
    look = heroLook(sheet);
  return (
    ['wizard', 'cleric', 'druid', 'paladin', 'fighter'].includes(sheet.class) ||
      (look.outfit = { torso: 'ca', brazos: 'ca', piernas: 'ca', pies: 'ca' }),
    (look.kind = 'npc'),
    look
  );
}
/** Compañeros reclutables: hoja de personaje, aspecto y retoques (`tweak`). */
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
/** PNJ con nombre: aspecto, ropa (outfit), equipo (gear) y postura. */
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

export { COMPANIONS, companionLook, NPC_LOOKS, npcLook };
