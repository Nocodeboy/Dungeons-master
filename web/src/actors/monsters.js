// actors/monsters.js
// Reconstruido de publicado/juego.js (módulo __esm «pv»). Nombres locales aún minificados.

import { Yn } from './appearance.js';

function Wz(o, e) {
  let t = fi(o, $z);
  return {
    kind: 'monster',
    family: 'goblin',
    species: 'goblin',
    body: 'm',
    hair: e === 'boss' ? 'cresta' : fi(o, ['calvo', 'calvo', 'cresta', 'rapado']),
    beard: 'ninguna',
    brows: !0,
    colors: {
      skin: t,
      hair: fi(o, ['#1e1a16', '#2a2418', '#3a3024']),
      eyes: '#e8c030',
      cloth1: '#5a4632',
      cloth2: '#7a6a4a',
    },
    metalColor: '#7a7468',
    glowEyes: 0.3,
    prop: {
      scale: 0.6 + o() * 0.04,
      width: 0.9,
      head: 1.32,
      legs: 0.84,
      arms: 1.12,
      hands: 1.28,
      neck: 0.85,
      thick: 0.82,
    },
    head: {
      ears: { len: 0.12 + o() * 0.03, dir: [1, 0.32, -0.4], from: 0.05 },
      nose: { len: 0.032 + o() * 0.012, drop: 0.012, wide: 0.12 },
      jaw: { wide: 0.12, fwd: 0.008, brow: 0.016 },
      skullScale: [1.06, 0.9, 1.02],
      face: Math.floor(o() * 4),
    },
    posture: { hunch: 0.55 },
    speeds: { walk: 1.15, run: 1.1 },
  };
}
function Xf(o, e = 0) {
  let t = Yn(1e3 + e * 17 + o.length),
    a = Wz(t, o);
  return (
    o === 'minion'
      ? ((a.outfit = { torso: 'piel', brazos: 'piel', piernas: 'ca', pies: 'piel' }),
        (a.colors.cloth1 = fi(t, ['#5a4632', '#4a3a2a', '#62503a'])),
        (a.colors.cloth2 = '#6a5a40'),
        (a.gear = { main: 'dagger', sash: '#3a2a1c' }),
        (a.grips = ['r']),
        (a.style = '1h'),
        (a.prop.width = 0.86))
      : o === 'warrior'
        ? ((a.outfit = {
            torso: 'ex',
            brazos: 'piel',
            piernas: 'ca',
            pies: 'piel',
            cintos: !0,
            hombrera: !0,
          }),
          (a.colors.cloth1 = '#7a3a26'),
          (a.colors.cloth2 = '#5a4a36'),
          (a.gear = { main: 'scimitar', shield: 'tosco', helmet: 'casco' }),
          (a.grips = ['r']),
          (a.style = 'shield'),
          (a.prop.width = 0.96),
          (a.prop.thick = 0.92))
        : o === 'archer'
          ? ((a.outfit = { torso: 'ex', brazos: 'ex', piernas: 'ca', pies: 'piel', capucha: !0, cintos: !0 }),
            (a.colors.cloth1 = '#4f5e36'),
            (a.colors.cloth2 = '#5a4a36'),
            (a.gear = { off: 'shortbow', back: ['carcaj'], sheath: 'dagger' }),
            (a.grips = ['l']),
            (a.style = 'bow'))
          : o === 'boss' &&
            ((a.prop = { ...a.prop, scale: 0.74, width: 1.06, thick: 1, head: 1.24 }),
            (a.outfit = { torso: 'ex', brazos: 'piel', piernas: 'ex', pies: 'ex', cintos: !0, hombrera: !0 }),
            (a.colors.cloth1 = '#3a2a22'),
            (a.colors.cloth2 = '#6a2a20'),
            (a.colors.skin = '#6c7660'),
            (a.skinFx = { pattern: 2, patternColor: '#8a2418' }),
            (a.gear = {
              main: 'scimitar',
              shield: 'tosco',
              helmet: 'casco',
              mantle: 'pieles',
              mantleColor: '#26221e',
              necklace: 'colmillos',
            }),
            (a.extras = { horns: { kind: 'carnero', color: '#cfc4a8', scale: 0.8 } }),
            (a.missingFingers = ['ring_l', 'pinky_l']),
            (a.grips = ['r']),
            (a.style = 'shield'),
            (a.posture = { hunch: 0.4 })),
    a
  );
}
function hv(o, e = 0) {
  let t = Yn(2e3 + e * 13 + o.length),
    a = fi(t, ['#d8ccae', '#cfc2a0', '#ddd2b8', '#c8bc9c']),
    n = {
      kind: 'monster',
      family: 'skeleton',
      body: 'm',
      noHead: !0,
      outfit: {},
      colors: { cloth1: '#4a3a30', cloth2: '#3a3028' },
      metalColor: '#6e6a62',
      prop: { scale: 0.98 + t() * 0.05, width: 0.95 },
      undead: { skull: 'guerrero', color: a },
      posture: { hunch: 0.12 },
      speeds: { walk: 0.95 },
      gait: { walk: 1 },
    };
  return o === 'archer'
    ? {
        ...n,
        gear: {
          off: 'shortbow',
          back: ['carcaj'],
          kk: [{ name: 'kk_capucha', bone: 'Head' }],
          rags: '#3a2e2a',
        },
        grips: ['l'],
        style: 'bow',
      }
    : o === 'wight'
      ? {
          ...n,
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
          ...n,
          gear: {
            kk: [
              { name: 'kk_hoja', hand: 'r' },
              { name: 'kk_escudo', hand: 'l' },
              ...(t() < 0.5 ? [{ name: 'kk_casco', bone: 'Head' }] : []),
            ],
            rags: fi(t, ['#3a2e2a', '#4a3a2a', '#2e2a26']),
          },
          grips: ['r'],
          style: 'shield',
        };
}
function Xz(o = 0) {
  let e = Yn(3e3 + o * 11);
  return {
    kind: 'monster',
    family: 'zombie',
    body: e() < 0.3 ? 'f' : 'm',
    hair: fi(e, ['largo', 'raya', 'calvo']),
    beard: 'ninguna',
    colors: {
      skin: fi(e, ['#8a927c', '#7d8a74', '#94927e']),
      hair: '#3a3630',
      eyes: '#d0e090',
      cloth1: fi(e, ['#4a4236', '#3e3a30', '#52463a']),
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
const fi = (o, e) => e[Math.floor(o() * e.length)];
const $z = ['#7c8a6c', '#6e7e62', '#86907a', '#747c6c', '#6a7a5c', '#808878'];
const MONSTER_DEFS = {
  goblin_minion: { type: 'humanoid', look: (o) => Xf('minion', o), name: 'Trasgo esbirro' },
  goblin_warrior: { type: 'humanoid', look: (o) => Xf('warrior', o), name: 'Trasgo guerrero' },
  goblin_archer: { type: 'humanoid', look: (o) => Xf('archer', o), name: 'Trasgo arquero' },
  goblin_boss: { type: 'humanoid', look: (o) => Xf('boss', o), name: 'Cabecilla trasgo' },
  skeleton: { type: 'humanoid', look: (o) => hv('warrior', o), name: 'Esqueleto' },
  skeleton_archer: { type: 'humanoid', look: (o) => hv('archer', o), name: 'Esqueleto arquero' },
  zombie: { type: 'humanoid', look: (o) => Xz(o), name: 'Zombi' },
  wight: { type: 'humanoid', look: (o) => hv('wight', o), name: 'Vorhan, el tumulario' },
  giant_spider: { type: 'spider', name: 'Ara\xF1a gigante' },
  wolf: { type: 'animal', kind: 'lobo', name: 'Lobo' },
  mastiff: { type: 'animal', kind: 'mastin', name: 'Mast\xEDn' },
  elk: { type: 'animal', kind: 'alce', name: 'Alce' },
  riding_horse: { type: 'animal', kind: 'caballo', name: 'Caballo de monta' },
};
const MONSTER_IDS = Object.keys(MONSTER_DEFS);

export { MONSTER_DEFS, MONSTER_IDS };
