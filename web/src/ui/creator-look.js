// ui/creator-look.js
// Reconstruido de publicado/juego.js (módulo __esm «ZT»). Nombres locales aún minificados.

function VL(o, { lineage: e, ancestry: t } = {}) {
  let a = Av[o] || Av.human;
  (o === 'elf' && e === 'drow' && (a = Av.drow),
    o === 'dragonborn' && (a = [LL[t] || '#b33a2c', '#6a4a3a', '#3a3a3a', '#c8b89a']));
  let n = ['tiefling', 'dragonborn', 'goliath'].includes(o) || e === 'drow',
    s = [
      {
        key: 'body',
        label: 'Cuerpo',
        type: 'choice',
        options: Os([
          ['m', 'Masculino'],
          ['f', 'Femenino'],
        ]),
      },
      { key: 'build', label: 'Complexi\xF3n', type: 'choice', options: Os(OL) },
      { key: 'height', label: 'Altura', type: 'range', min: 0.94, max: 1.06, step: 0.01 },
      {
        key: 'face',
        label: 'Rostro',
        type: 'choice',
        options: [0, 1, 2, 3].map((r) => ({ id: r, label: `Rostro ${r + 1}` })),
      },
      { key: 'skin', label: o === 'dragonborn' ? 'Escamas' : 'Piel', type: 'color', options: a },
      { key: 'eyes', label: 'Ojos', type: 'color', options: n ? [...Cv, ...IL] : Cv },
    ];
  (o !== 'dragonborn' &&
    (s.push({ key: 'hair', label: 'Peinado', type: 'choice', options: Os(NL) }),
    s.push({ key: 'hairColor', label: 'Color del pelo', type: 'color', options: n ? [...Rv, ...DL] : Rv }),
    ['elf'].includes(o) || s.push({ key: 'beard', label: 'Barba', type: 'choice', options: Os(FL) })),
    ['elf', 'half_elf', 'gnome'].includes(o) &&
      s.push({ key: 'ears', label: 'Orejas', type: 'choice', options: Os(BL) }),
    ['tiefling', 'dragonborn'].includes(o) &&
      (s.push({ key: 'horns', label: 'Cuernos', type: 'choice', options: Os(qL) }),
      s.push({ key: 'hornColor', label: 'Color de los cuernos', type: 'color', options: KT })),
    o === 'tiefling' && s.push({ key: 'tail', label: 'Cola', type: 'toggle' }),
    ['orc', 'half_orc'].includes(o) &&
      s.push({ key: 'tusks', label: 'Colmillos', type: 'choice', options: Os(UL) }),
    o === 'goliath' &&
      (s.push({ key: 'marks', label: 'Marcas', type: 'choice', options: Os(jL) }),
      s.push({
        key: 'marksColor',
        label: 'Color de las marcas',
        type: 'color',
        options: ['#3a4a5a', '#5a3a2a', '#2a2a2a', '#7a8a9a', '#8a3a2a'],
      })),
    o === 'dragonborn' && s.push({ key: 'frill', label: 'Cresta', type: 'choice', options: Os(GL) }),
    s.push({ key: 'cloth1', label: 'Color principal', type: 'color', options: nm }),
    s.push({ key: 'cloth2', label: 'Color secundario', type: 'color', options: nm }),
    s.push({ key: 'metal', label: 'Metal', type: 'choice', options: Os(HL) }));
  let i = {
    body: 'm',
    face: 0,
    skin: a[1] || a[0],
    eyes: Cv[0],
    hair: o === 'dwarf' ? 'rapado' : 'raya',
    hairColor: Rv[2],
    beard: o === 'dwarf' ? 'larga' : 'ninguna',
    cloth1: nm[0],
    cloth2: nm[7],
    metal: 'acero',
    height: 1,
    build: o === 'dwarf' || o === 'goliath' ? 'robusta' : 'media',
    ears: 'puntiagudas',
    horns: o === 'dragonborn' ? 'atras' : 'curvos',
    hornColor: KT[0],
    tail: o === 'tiefling',
    tusks: 'pequenos',
    marks: 'lineas',
    marksColor: '#3a4a5a',
    frill: 'cresta',
  };
  return { name: o, fields: s, defaults: i };
}
function om(o, e, t) {
  try {
    let a = o.actors?.appearanceOptions;
    if (a) return a(e, t);
  } catch (a) {
    console.warn('[interfaz] appearanceOptions', a);
  }
  return VL(e, t);
}
function zv(o, e, t = {}, a) {
  try {
    if (o.actors?.completeAppearance) return o.actors.completeAppearance(t, e, a);
  } catch {}
  let n = om(o, e, a),
    s = {};
  for (let i of n.fields) s[i.key] = t[i.key] ?? n.defaults[i.key];
  for (let i of n.fields)
    i.type === 'color' &&
      Array.isArray(i.options) &&
      !i.options.includes(s[i.key]) &&
      ['skin'].includes(i.key) &&
      (s[i.key] = n.defaults[i.key]);
  return s;
}
function JT(o, e, t) {
  try {
    if (o.actors?.randomAppearance) return o.actors.randomAppearance(e, t);
  } catch {}
  let a = om(o, e, t),
    n = (i) => i[Math.floor(Math.random() * i.length)],
    s = {};
  for (let i of a.fields)
    i.type === 'choice'
      ? (s[i.key] = n(i.options).id)
      : i.type === 'color'
        ? (s[i.key] = n(i.options))
        : i.type === 'range'
          ? (s[i.key] =
              Math.round((i.options.min + Math.random() * (i.options.max - i.options.min)) * 100) / 100)
          : i.type === 'toggle' && (s[i.key] = Math.random() < 0.7);
  return (s.body === 'f' && s.beard && (s.beard = 'ninguna'), s);
}
const Av = {
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
const LL = {
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
const Rv = [
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
const DL = ['#c8d0e0', '#3a3a5a', '#5a2a4a', '#2a4a5a', '#8a2a2a'];
const Cv = ['#5a3a1e', '#3a5a8a', '#4a7a4a', '#7a6a4a', '#5a5a6a', '#2a1a12'];
const IL = ['#d8a020', '#c03020', '#e8e0c0', '#8040c0', '#20a0a0'];
const nm = [
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
const HL = [
  ['acero', 'Acero', '#b8bec6'],
  ['hierro', 'Hierro', '#7d8188'],
  ['bronce', 'Bronce', '#b5803e'],
  ['laton', 'Lat\xF3n', '#c9a64a'],
  ['oro', 'Oro', '#e0b84a'],
  ['pavonado', 'Pavonado', '#3c4048'],
];
const NL = [
  ['raya', 'Con raya'],
  ['largo', 'Largo'],
  ['mono', 'Mo\xF1os'],
  ['coleta', 'Coleta'],
  ['trenza', 'Trenza'],
  ['rapado', 'Rapado'],
  ['cresta', 'Cresta'],
  ['calvo', 'Calvo'],
];
const FL = [
  ['ninguna', 'Sin barba'],
  ['barba', 'Barba'],
  ['perilla', 'Perilla'],
  ['bigote', 'Bigote'],
  ['larga', 'Barba larga'],
  ['trenzada', 'Trenzada'],
];
const OL = [
  ['delgada', 'Delgada'],
  ['media', 'Media'],
  ['robusta', 'Robusta'],
];
const BL = [
  ['puntiagudas', 'Puntiagudas'],
  ['largas', 'Largas'],
  ['cortas', 'Cortas'],
];
const qL = [
  ['curvos', 'Curvos'],
  ['carnero', 'De carnero'],
  ['rectos', 'Rectos'],
  ['atras', 'Hacia atr\xE1s'],
  ['ninguno', 'Sin cuernos'],
];
const UL = [
  ['grandes', 'Grandes'],
  ['pequenos', 'Peque\xF1os'],
  ['ninguno', 'Sin colmillos'],
];
const jL = [
  ['ninguna', 'Ninguna'],
  ['lineas', 'L\xEDneas'],
  ['manchas', 'Manchas'],
  ['runas', 'Runas'],
];
const GL = [
  ['ninguna', 'Ninguna'],
  ['cresta', 'Cresta'],
  ['gola', 'Gola'],
];
const KT = ['#2a2020', '#4a3a2e', '#7a6a58', '#c8b8a0', '#5a2a2a', '#3a3a4a'];
const Os = (o) => o.map(([e, t, a]) => ({ id: e, label: t, ...(a ? { swatch: a } : {}) }));
const Pv = [
  ['Figura', ['body', 'build', 'height', 'face']],
  ['Piel y ojos', ['skin', 'eyes']],
  ['Pelo', ['hair', 'hairColor', 'beard']],
  ['Rasgos de tu especie', ['ears', 'horns', 'hornColor', 'tail', 'tusks', 'marks', 'marksColor', 'frill']],
  ['Ropa y metal', ['cloth1', 'cloth2', 'metal', 'helmet', 'hood']],
];

export { JT, Pv, om, zv };
