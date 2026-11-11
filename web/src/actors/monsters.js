// actors/monsters.js
// Reconstruido de publicado/juego.js (módulo __esm «pv»).
//
// Catálogo visual de monstruos (MONSTER_DEFS, por id de reglas): trasgos (esbirro, guerrero,
// arquero, cabecilla), esqueletos, zombis y Vorhan el tumulario son humanoides con un look propio,
// variado con semilla por índice; la araña gigante y los animales se delegan a beasts.js y
// animals.js. Lo usan index.js (makeMonster) y portraits.js.

import { seededRandom } from './appearance.js';

/** Look base de trasgo (piel, pelo, proporciones, cabeza) con el generador `rand`. */
function goblinBase(rand, role) {
  let skin = pick(rand, GOBLIN_SKINS);
  return {
    kind: 'monster',
    family: 'goblin',
    species: 'goblin',
    body: 'm',
    hair: role === 'boss' ? 'cresta' : pick(rand, ['calvo', 'calvo', 'cresta', 'rapado']),
    beard: 'ninguna',
    brows: !0,
    colors: {
      skin,
      hair: pick(rand, ['#1e1a16', '#2a2418', '#3a3024']),
      eyes: '#e8c030',
      cloth1: '#5a4632',
      cloth2: '#7a6a4a',
    },
    metalColor: '#7a7468',
    glowEyes: 0.3,
    prop: {
      scale: 0.6 + rand() * 0.04,
      width: 0.9,
      head: 1.32,
      legs: 0.84,
      arms: 1.12,
      hands: 1.28,
      neck: 0.85,
      thick: 0.82,
    },
    head: {
      ears: { len: 0.12 + rand() * 0.03, dir: [1, 0.32, -0.4], from: 0.05 },
      nose: { len: 0.032 + rand() * 0.012, drop: 0.012, wide: 0.12 },
      jaw: { wide: 0.12, fwd: 0.008, brow: 0.016 },
      skullScale: [1.06, 0.9, 1.02],
      face: Math.floor(rand() * 4),
    },
    posture: { hunch: 0.55 },
    speeds: { walk: 1.15, run: 1.1 },
  };
}
/** Look de trasgo por papel («minion», «warrior», «archer», «boss») y número de ejemplar. */
function goblinLook(role, index = 0) {
  let rand = seededRandom(1e3 + index * 17 + role.length),
    look = goblinBase(rand, role);
  return (
    role === 'minion'
      ? ((look.outfit = { torso: 'piel', brazos: 'piel', piernas: 'ca', pies: 'piel' }),
        (look.colors.cloth1 = pick(rand, ['#5a4632', '#4a3a2a', '#62503a'])),
        (look.colors.cloth2 = '#6a5a40'),
        (look.gear = { main: 'dagger', sash: '#3a2a1c' }),
        (look.grips = ['r']),
        (look.style = '1h'),
        (look.prop.width = 0.86))
      : role === 'warrior'
        ? ((look.outfit = {
            torso: 'ex',
            brazos: 'piel',
            piernas: 'ca',
            pies: 'piel',
            cintos: !0,
            hombrera: !0,
          }),
          (look.colors.cloth1 = '#7a3a26'),
          (look.colors.cloth2 = '#5a4a36'),
          (look.gear = { main: 'scimitar', shield: 'tosco', helmet: 'casco' }),
          (look.grips = ['r']),
          (look.style = 'shield'),
          (look.prop.width = 0.96),
          (look.prop.thick = 0.92))
        : role === 'archer'
          ? ((look.outfit = {
              torso: 'ex',
              brazos: 'ex',
              piernas: 'ca',
              pies: 'piel',
              capucha: !0,
              cintos: !0,
            }),
            (look.colors.cloth1 = '#4f5e36'),
            (look.colors.cloth2 = '#5a4a36'),
            (look.gear = { off: 'shortbow', back: ['carcaj'], sheath: 'dagger' }),
            (look.grips = ['l']),
            (look.style = 'bow'))
          : role === 'boss' &&
            ((look.prop = { ...look.prop, scale: 0.74, width: 1.06, thick: 1, head: 1.24 }),
            (look.outfit = {
              torso: 'ex',
              brazos: 'piel',
              piernas: 'ex',
              pies: 'ex',
              cintos: !0,
              hombrera: !0,
            }),
            (look.colors.cloth1 = '#3a2a22'),
            (look.colors.cloth2 = '#6a2a20'),
            (look.colors.skin = '#6c7660'),
            (look.skinFx = { pattern: 2, patternColor: '#8a2418' }),
            (look.gear = {
              main: 'scimitar',
              shield: 'tosco',
              helmet: 'casco',
              mantle: 'pieles',
              mantleColor: '#26221e',
              necklace: 'colmillos',
            }),
            (look.extras = { horns: { kind: 'carnero', color: '#cfc4a8', scale: 0.8 } }),
            (look.missingFingers = ['ring_l', 'pinky_l']),
            (look.grips = ['r']),
            (look.style = 'shield'),
            (look.posture = { hunch: 0.4 })),
    look
  );
}
/** Look de esqueleto («warrior», «archer») o del tumulario («wight»). */
function skeletonLook(role, index = 0) {
  let rand = seededRandom(2e3 + index * 13 + role.length),
    boneColor = pick(rand, ['#d8ccae', '#cfc2a0', '#ddd2b8', '#c8bc9c']),
    base = {
      kind: 'monster',
      family: 'skeleton',
      body: 'm',
      noHead: !0,
      outfit: {},
      colors: { cloth1: '#4a3a30', cloth2: '#3a3028' },
      metalColor: '#6e6a62',
      prop: { scale: 0.98 + rand() * 0.05, width: 0.95 },
      undead: { skull: 'guerrero', color: boneColor },
      posture: { hunch: 0.12 },
      speeds: { walk: 0.95 },
      gait: { walk: 1 },
    };
  return role === 'archer'
    ? {
        ...base,
        gear: {
          off: 'shortbow',
          back: ['carcaj'],
          kk: [{ name: 'kk_capucha', bone: 'Head' }],
          rags: '#3a2e2a',
        },
        grips: ['l'],
        style: 'bow',
      }
    : role === 'wight'
      ? {
          ...base,
          id: 'vorhan',
          prop: { scale: 1.24, width: 1.12, thick: 1.1 },
          undead: { skull: 'guerrero', color: '#c4b898', eyes: '#70b0ff', headScale: 1.08 },
          metalColor: '#6a5a44',
          gear: {
            main: 'greatsword',
            breastplate: 'placas',
            pauldrons: 'grandes',
            greaves: !0,
            bracers: !0,
            helmet: 'corona',
            cape: 'larga',
            capeColor: '#3a1a1a',
            rags: '#2a1a16',
          },
          extras: { horns: { kind: 'toro', color: '#d8ccb0', scale: 1.15 } },
          glowEyes: 1,
          grips: ['r', 'l'],
          style: '2h',
          posture: { hunch: 0.05 },
          speeds: { walk: 0.9 },
        }
      : {
          ...base,
          gear: {
            kk: [
              { name: 'kk_hoja', hand: 'r' },
              { name: 'kk_escudo', hand: 'l' },
              ...(rand() < 0.5 ? [{ name: 'kk_casco', bone: 'Head' }] : []),
            ],
            rags: pick(rand, ['#3a2e2a', '#4a3a2a', '#2e2a26']),
          },
          grips: ['r'],
          style: 'shield',
        };
}
/** Look de zombi (ropa hecha jirones y piel en descomposición). */
function zombieLook(index = 0) {
  let rand = seededRandom(3e3 + index * 11);
  return {
    kind: 'monster',
    family: 'zombie',
    body: rand() < 0.3 ? 'f' : 'm',
    hair: pick(rand, ['largo', 'raya', 'calvo']),
    beard: 'ninguna',
    colors: {
      skin: pick(rand, ['#8a927c', '#7d8a74', '#94927e']),
      hair: '#3a3630',
      eyes: '#d0e090',
      cloth1: pick(rand, ['#4a4236', '#3e3a30', '#52463a']),
      cloth2: '#6a6250',
    },
    skinFx: { pattern: 5, patternColor: '#5a3a30' },
    glowEyes: 0.5,
    outfit: { torso: 'ca', brazos: 'piel', piernas: 'ca', pies: 'piel', under: !0, tatters: 0.38 },
    prop: { scale: 0.98, width: 0.95, thick: 0.92 },
    posture: { hunch: 0.42 },
    gait: { walk: 0.7, run: 0.8 },
    gear: {},
    grips: [],
    style: 'unarmed',
    speeds: { walk: 0.85, run: 0.9 },
  };
}
/** Elemento al azar de `list` con el generador `rand`. */
const pick = (rand, list) => list[Math.floor(rand() * list.length)];
const GOBLIN_SKINS = ['#7c8a6c', '#6e7e62', '#86907a', '#747c6c', '#6a7a5c', '#808878'];
/** Monstruos por id: tipo (humanoid, spider, animal), look(índice) o especie animal, y nombre. */
const MONSTER_DEFS = {
  goblin_minion: { type: 'humanoid', look: (index) => goblinLook('minion', index), name: 'Trasgo esbirro' },
  goblin_warrior: {
    type: 'humanoid',
    look: (index) => goblinLook('warrior', index),
    name: 'Trasgo guerrero',
  },
  goblin_archer: { type: 'humanoid', look: (index) => goblinLook('archer', index), name: 'Trasgo arquero' },
  goblin_boss: { type: 'humanoid', look: (index) => goblinLook('boss', index), name: 'Cabecilla trasgo' },
  skeleton: { type: 'humanoid', look: (index) => skeletonLook('warrior', index), name: 'Esqueleto' },
  skeleton_archer: {
    type: 'humanoid',
    look: (index) => skeletonLook('archer', index),
    name: 'Esqueleto arquero',
  },
  zombie: { type: 'humanoid', look: (index) => zombieLook(index), name: 'Zombi' },
  wight: { type: 'humanoid', look: (index) => skeletonLook('wight', index), name: 'Vorhan, el tumulario' },
  giant_spider: { type: 'spider', name: 'Ara\xF1a gigante' },
  wolf: { type: 'animal', kind: 'lobo', name: 'Lobo' },
  mastiff: { type: 'animal', kind: 'mastin', name: 'Mast\xEDn' },
  elk: { type: 'animal', kind: 'alce', name: 'Alce' },
  riding_horse: { type: 'animal', kind: 'caballo', name: 'Caballo de monta' },
};
const MONSTER_IDS = Object.keys(MONSTER_DEFS);

export { MONSTER_DEFS, MONSTER_IDS };
