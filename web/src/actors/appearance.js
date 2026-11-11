// actors/appearance.js
// Reconstruido de publicado/juego.js (módulo __esm «Ur»). Nombres locales aún minificados.

function Rz(o) {
  let e = [];
  return (
    (o === 'elf' || o === 'half_elf' || o === 'gnome') &&
      e.push({
        key: 'ears',
        label: 'Orejas',
        type: 'choice',
        options: ss([
          ['puntiagudas', 'Puntiagudas'],
          ['largas', 'Largas'],
          ['cortas', 'Cortas'],
        ]),
      }),
    o === 'tiefling' &&
      (e.push({
        key: 'horns',
        label: 'Cuernos',
        type: 'choice',
        options: ss([
          ['curvos', 'Curvos'],
          ['carnero', 'De carnero'],
          ['rectos', 'Rectos'],
          ['atras', 'Hacia atr\xE1s'],
          ['ninguno', 'Sin cuernos'],
        ]),
      }),
      e.push({
        key: 'hornColor',
        label: 'Color de los cuernos',
        type: 'color',
        options: ['#2a2020', '#4a3a30', '#6a5a4a', '#c8b8a0', '#3a2a40', '#8a2a2a'],
      }),
      e.push({ key: 'tail', label: 'Cola', type: 'toggle' })),
    o === 'dragonborn' &&
      (e.push({
        key: 'horns',
        label: 'Cuernos',
        type: 'choice',
        options: ss([
          ['atras', 'Hacia atr\xE1s'],
          ['rectos', 'Rectos'],
          ['curvos', 'Curvos'],
          ['ninguno', 'Sin cuernos'],
        ]),
      }),
      e.push({
        key: 'hornColor',
        label: 'Color de los cuernos',
        type: 'color',
        options: ['#e8dcc0', '#c8b8a0', '#5a4a3a', '#2a2420', '#b0a090'],
      }),
      e.push({
        key: 'frill',
        label: 'Cresta',
        type: 'choice',
        options: ss([
          ['cresta', 'Cresta'],
          ['gola', 'Gola'],
          ['ninguna', 'Ninguna'],
        ]),
      })),
    (o === 'orc' || o === 'half_orc') &&
      e.push({
        key: 'tusks',
        label: 'Colmillos',
        type: 'choice',
        options: ss([
          ['grandes', 'Grandes'],
          ['pequenos', 'Peque\xF1os'],
          ['ninguno', 'Ninguno'],
        ]),
      }),
    o === 'goliath' &&
      (e.push({
        key: 'marks',
        label: 'Marcas',
        type: 'choice',
        options: ss([
          ['lineas', 'L\xEDneas'],
          ['manchas', 'Manchas'],
          ['runas', 'Runas'],
          ['ninguna', 'Ninguna'],
        ]),
      }),
      e.push({
        key: 'marksColor',
        label: 'Color de las marcas',
        type: 'color',
        options: ['#4a4a52', '#3a3028', '#6a7a8a', '#2a3a4a', '#7a5a3a'],
      })),
    e
  );
}
function iv(o, { lineage: e, ancestry: t } = {}) {
  if (o === 'dragonborn') {
    let a = DRAGON_COLORS[t] || DRAGON_COLORS.red;
    return [a, ...Object.values(DRAGON_COLORS).filter((n) => n !== a)];
  }
  return o === 'elf' && e === 'drow' ? nv.drow : nv[o] || nv.human;
}
function appearanceOptions(o, e = {}) {
  let t = lu[o] ? o : 'human',
    a = t === 'tiefling' || t === 'dragonborn' || (t === 'elf' && e.lineage === 'drow'),
    n = [
      {
        key: 'body',
        label: 'Cuerpo',
        type: 'choice',
        options: ss([
          ['m', 'Masculino'],
          ['f', 'Femenino'],
        ]),
      },
      {
        key: 'face',
        label: 'Rostro',
        type: 'choice',
        options: [0, 1, 2, 3].map((s) => ({ id: s, label: ['I', 'II', 'III', 'IV'][s] })),
      },
      { key: 'skin', label: t === 'dragonborn' ? 'Escamas' : 'Piel', type: 'color', options: iv(t, e) },
      { key: 'eyes', label: 'Ojos', type: 'color', options: a ? [...Mz, ...sv] : sv },
    ];
  return (
    t !== 'dragonborn' &&
      (n.push({ key: 'hair', label: 'Peinado', type: 'choice', options: ss(Ez) }),
      n.push({
        key: 'hairColor',
        label: 'Color del pelo',
        type: 'color',
        options: a || t === 'elf' ? [...ov, ...Tz] : ov,
      }),
      n.push({ key: 'beard', label: 'Barba', type: 'choice', options: ss(Sz) })),
    n.push(
      { key: 'cloth1', label: 'Ropa (color principal)', type: 'color', options: J2 },
      { key: 'cloth2', label: 'Ropa (color secundario)', type: 'color', options: J2 },
      {
        key: 'metal',
        label: 'Metal',
        type: 'choice',
        options: Object.entries(METALS).map(([s, i]) => ({ id: s, label: i.label, swatch: i.color })),
      },
      { key: 'height', label: 'Altura', type: 'range', min: 0.94, max: 1.06, step: 0.01 },
      { key: 'build', label: 'Complexi\xF3n', type: 'choice', options: ss(kz) },
      { key: 'helmet', label: 'Casco (con armadura media o pesada)', type: 'toggle' },
      {
        key: 'hood',
        label: 'Capucha',
        type: 'choice',
        options: ss([
          ['auto', 'Seg\xFAn la clase'],
          ['si', 'Puesta'],
          ['no', 'Quitada'],
        ]),
      },
      ...Rz(t),
    ),
    { species: t, name: Az[t], fields: n, defaults: defaultAppearance(t, e) }
  );
}
function defaultAppearance(o, e = {}) {
  let t = lu[o] ? o : 'human',
    a = e.body || (e.pronoun === 'f' ? 'f' : 'm'),
    n = iv(t, e),
    s = {
      body: a,
      face: 0,
      skin: n[t === 'human' ? 1 : 0],
      eyes: sv[0],
      hair: a === 'f' ? 'largo' : 'raya',
      hairColor: t === 'elf' && e.lineage === 'drow' ? '#e8e4dc' : ov[1],
      beard: a === 'm' && t === 'dwarf' ? 'larga' : 'ninguna',
      cloth1: '#3f5f9a',
      cloth2: '#c9b48a',
      metal: 'acero',
      height: 1,
      build: t === 'dwarf' || t === 'goliath' || t === 'orc' ? 'robusta' : 'media',
      helmet: !1,
      hood: 'auto',
      ...(Cz[t] || {}),
    };
  return (
    t === 'dragonborn' && ((s.hair = 'calvo'), (s.beard = 'ninguna'), (s.eyes = '#d8a020')),
    t === 'tiefling' && (s.eyes = '#d8a020'),
    t === 'goliath' && (s.hair = 'rapado'),
    s
  );
}
function Yn(o = 1) {
  let e = (typeof o == 'string' ? [...o].reduce((t, a) => (t * 31 + a.charCodeAt(0)) | 0, 7) : o) >>> 0 || 1;
  return () => ((e ^= e << 13), (e ^= e >>> 17), (e ^= e << 5), ((e >>> 0) % 1e5) / 1e5);
}
function randomAppearance(o, e = {}, t = Date.now()) {
  let a = Yn(t),
    n = (r) => r[Math.floor(a() * r.length)],
    s = appearanceOptions(o, e),
    i = { ...s.defaults };
  for (let r of s.fields)
    r.type === 'choice'
      ? (i[r.key] = n(r.options).id)
      : r.type === 'color'
        ? (i[r.key] = n(r.options))
        : r.type === 'range'
          ? (i[r.key] = Math.round((r.min + a() * (r.max - r.min)) / r.step) * r.step)
          : r.type === 'toggle' && (i[r.key] = a() < 0.7);
  return (
    e.body && (i.body = e.body),
    i.body === 'f' && a() < 0.9 && (i.beard = 'ninguna'),
    o === 'dwarf' && i.body === 'm' && i.beard === 'ninguna' && (i.beard = 'larga'),
    o === 'dragonborn' && (i.skin = iv(o, e)[0]),
    i
  );
}
function completeAppearance(o = {}, e = 'human', t = {}) {
  let n = { ...defaultAppearance(e, { ...t, body: o.body || t.body }) };
  for (let [s, i] of Object.entries(o || {})) i != null && i !== '' && (n[s] = i);
  return (
    (typeof n.height != 'number' || !isFinite(n.height)) && (n.height = 1),
    (n.height = Math.min(1.08, Math.max(0.92, n.height))),
    (n.face = Math.max(0, Math.min(3, Number(n.face) || 0))),
    n
  );
}
const nv = {
  human: ['#f1c9a5', '#e0ac83', '#c68a5c', '#a0683f', '#7a4a2a', '#4f2f1c'],
  elf: ['#f4d8c0', '#e8c09a', '#c99a72', '#a77a58', '#8d6a8f', '#5d4b6e'],
  drow: ['#5d4b6e', '#4a3f5c', '#3b3550', '#55505e', '#2f2a3a', '#6a5a7a'],
  half_elf: ['#f3d3b5', '#e6bc96', '#cf9c72', '#a8764f', '#7f5538', '#5a3c2a'],
  dwarf: ['#f0c8a0', '#d9a77d', '#b98157', '#8f5d3a', '#6b4227', '#a88a78'],
  halfling: ['#f2cfa8', '#e2b48a', '#c9925f', '#9c6b42', '#6e4728'],
  gnome: ['#f3d2b0', '#e3b58f', '#c48f66', '#9a6a46', '#7a5a48'],
  goliath: ['#c9b8a6', '#a89a8c', '#8f8a86', '#b7a189', '#7d7468', '#9aa0a8'],
  orc: ['#7f9a6a', '#6b8a5c', '#8c9a7a', '#5d6e55', '#9aa58a', '#7a7f6e'],
  half_orc: ['#a9b18f', '#93a07c', '#c4a98a', '#8f8f7a', '#7c8a68', '#b59a7a'],
  tiefling: ['#b84a4a', '#9b3c55', '#7d4e8f', '#c9826b', '#5a3e6e', '#d8a0a0', '#e0ac83'],
};
const DRAGON_COLORS = {
  black: '#2b2b33',
  blue: '#2f5fb3',
  brass: '#c79a3c',
  bronze: '#9c6b2f',
  copper: '#b8693a',
  gold: '#d9b13b',
  green: '#3f8a4a',
  red: '#b33a2c',
  silver: '#b9c2cc',
  white: '#e8eef2',
};
const ov = [
  '#1e1612',
  '#3b2a1e',
  '#5a3a22',
  '#8a5a2e',
  '#b0702e',
  '#9a3a1c',
  '#d8b070',
  '#e8d8a8',
  '#9a948c',
  '#e8e4dc',
];
const Tz = ['#e8e4dc', '#c8d0e0', '#3a3a5a', '#5a2a4a', '#2a4a5a', '#8a2a2a'];
const sv = ['#5a3a1e', '#3a5a8a', '#4a7a4a', '#7a6a4a', '#5a5a6a', '#2a1a12'];
const Mz = ['#d8a020', '#c03020', '#e8e0c0', '#8040c0', '#20a0a0'];
const J2 = [
  '#3f5f9a',
  '#7a2e2a',
  '#3e6b3a',
  '#5a3f6b',
  '#2e2a28',
  '#8a6a3a',
  '#c9b48a',
  '#e8dcc0',
  '#6b6f78',
  '#2f4f5a',
  '#9a7a2a',
  '#4a2e1e',
];
const METALS = {
  acero: { label: 'Acero', color: '#b8bec6' },
  hierro: { label: 'Hierro', color: '#7d8188' },
  bronce: { label: 'Bronce', color: '#b5803e' },
  laton: { label: 'Lat\xF3n', color: '#c9a64a' },
  oro: { label: 'Oro', color: '#e0b84a' },
  pavonado: { label: 'Pavonado', color: '#3c4048' },
};
const Ez = [
  ['raya', 'Con raya'],
  ['largo', 'Largo'],
  ['mono', 'Mo\xF1os'],
  ['coleta', 'Coleta'],
  ['trenza', 'Trenza'],
  ['rapado', 'Rapado'],
  ['cresta', 'Cresta'],
  ['calvo', 'Calvo'],
];
const Sz = [
  ['ninguna', 'Sin barba'],
  ['barba', 'Barba'],
  ['perilla', 'Perilla'],
  ['bigote', 'Bigote'],
  ['larga', 'Barba larga'],
  ['trenzada', 'Barba trenzada'],
];
const kz = [
  ['delgada', 'Delgada'],
  ['media', 'Media'],
  ['robusta', 'Robusta'],
];
const lu = {
  human: { scale: 1 },
  elf: { scale: 1, width: 0.94, legs: 1.03, neck: 1.05 },
  half_elf: { scale: 1, width: 0.97 },
  dwarf: { scale: 0.8, width: 1.18, head: 1.12, legs: 0.82, arms: 0.95, hands: 1.12, neck: 0.8 },
  halfling: { scale: 0.57, width: 1.04, head: 1.16, legs: 0.92, hands: 1 },
  gnome: { scale: 0.55, width: 1, head: 1.24, legs: 0.88, hands: 1.05 },
  dragonborn: { scale: 1.07, width: 1.08, neck: 1.12, hands: 1.08 },
  goliath: { scale: 1.17, width: 1.1, hands: 1.1, head: 0.96 },
  orc: { scale: 1.05, width: 1.1, hands: 1.08, neck: 0.92 },
  half_orc: { scale: 1.03, width: 1.06, hands: 1.04 },
  tiefling: { scale: 1, width: 0.98 },
};
const Az = {
  human: 'Humano',
  elf: 'Elfo',
  half_elf: 'Semielfo',
  dwarf: 'Enano',
  halfling: 'Mediano',
  gnome: 'Gnomo',
  dragonborn: 'Drac\xF3nido',
  goliath: 'Goliat',
  orc: 'Orco',
  half_orc: 'Semiorco',
  tiefling: 'Tiflin',
};
const ss = (o) => o.map(([e, t]) => ({ id: e, label: t }));
const Cz = {
  elf: { ears: 'largas' },
  half_elf: { ears: 'puntiagudas' },
  gnome: { ears: 'puntiagudas' },
  tiefling: { horns: 'curvos', hornColor: '#2a2020', tail: !0 },
  dragonborn: { horns: 'atras', hornColor: '#e8dcc0', frill: 'cresta' },
  orc: { tusks: 'grandes' },
  half_orc: { tusks: 'pequenos' },
  goliath: { marks: 'lineas', marksColor: '#4a4a52' },
};

export {
  DRAGON_COLORS,
  METALS,
  Yn,
  appearanceOptions,
  completeAppearance,
  defaultAppearance,
  lu,
  randomAppearance,
};
