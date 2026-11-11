// ui/creator-look.js
// Aspecto del personaje en el creador: campos (cuerpo, piel, pelo, cuernos…) y valores por defecto según
// la especie, completar y aleatorizar. Usa game.actors si trae su propia versión. Lo usa creator.js.
// Reconstruido de publicado/juego.js (módulo __esm «ZT»).

function defaultAppearanceOptions(species, { lineage, ancestry } = {}) {
  let skins = SKIN_TONES[species] || SKIN_TONES.human;
  (species === 'elf' && lineage === 'drow' && (skins = SKIN_TONES.drow),
    species === 'dragonborn' &&
      (skins = [DRAGON_COLORS[ancestry] || '#b33a2c', '#6a4a3a', '#3a3a3a', '#c8b89a']));
  let exotic = ['tiefling', 'dragonborn', 'goliath'].includes(species) || lineage === 'drow',
    fields = [
      {
        key: 'body',
        label: 'Cuerpo',
        type: 'choice',
        options: toOptions([
          ['m', 'Masculino'],
          ['f', 'Femenino'],
        ]),
      },
      { key: 'build', label: 'Complexi\xF3n', type: 'choice', options: toOptions(BUILDS) },
      { key: 'height', label: 'Altura', type: 'range', min: 0.94, max: 1.06, step: 0.01 },
      {
        key: 'face',
        label: 'Rostro',
        type: 'choice',
        options: [0, 1, 2, 3].map((index) => ({ id: index, label: `Rostro ${index + 1}` })),
      },
      { key: 'skin', label: species === 'dragonborn' ? 'Escamas' : 'Piel', type: 'color', options: skins },
      {
        key: 'eyes',
        label: 'Ojos',
        type: 'color',
        options: exotic ? [...EYE_COLORS, ...EXOTIC_EYE_COLORS] : EYE_COLORS,
      },
    ];
  (species !== 'dragonborn' &&
    (fields.push({ key: 'hair', label: 'Peinado', type: 'choice', options: toOptions(HAIR_STYLES) }),
    fields.push({
      key: 'hairColor',
      label: 'Color del pelo',
      type: 'color',
      options: exotic ? [...HAIR_COLORS, ...EXOTIC_HAIR_COLORS] : HAIR_COLORS,
    }),
    ['elf'].includes(species) ||
      fields.push({ key: 'beard', label: 'Barba', type: 'choice', options: toOptions(BEARDS) })),
    ['elf', 'half_elf', 'gnome'].includes(species) &&
      fields.push({ key: 'ears', label: 'Orejas', type: 'choice', options: toOptions(EARS) }),
    ['tiefling', 'dragonborn'].includes(species) &&
      (fields.push({ key: 'horns', label: 'Cuernos', type: 'choice', options: toOptions(HORNS) }),
      fields.push({ key: 'hornColor', label: 'Color de los cuernos', type: 'color', options: HORN_COLORS })),
    species === 'tiefling' && fields.push({ key: 'tail', label: 'Cola', type: 'toggle' }),
    ['orc', 'half_orc'].includes(species) &&
      fields.push({ key: 'tusks', label: 'Colmillos', type: 'choice', options: toOptions(TUSKS) }),
    species === 'goliath' &&
      (fields.push({ key: 'marks', label: 'Marcas', type: 'choice', options: toOptions(MARKS) }),
      fields.push({
        key: 'marksColor',
        label: 'Color de las marcas',
        type: 'color',
        options: ['#3a4a5a', '#5a3a2a', '#2a2a2a', '#7a8a9a', '#8a3a2a'],
      })),
    species === 'dragonborn' &&
      fields.push({ key: 'frill', label: 'Cresta', type: 'choice', options: toOptions(FRILLS) }),
    fields.push({ key: 'cloth1', label: 'Color principal', type: 'color', options: CLOTH_COLORS }),
    fields.push({ key: 'cloth2', label: 'Color secundario', type: 'color', options: CLOTH_COLORS }),
    fields.push({ key: 'metal', label: 'Metal', type: 'choice', options: toOptions(METALS) }));
  let defaults = {
    body: 'm',
    face: 0,
    skin: skins[1] || skins[0],
    eyes: EYE_COLORS[0],
    hair: species === 'dwarf' ? 'rapado' : 'raya',
    hairColor: HAIR_COLORS[2],
    beard: species === 'dwarf' ? 'larga' : 'ninguna',
    cloth1: CLOTH_COLORS[0],
    cloth2: CLOTH_COLORS[7],
    metal: 'acero',
    height: 1,
    build: species === 'dwarf' || species === 'goliath' ? 'robusta' : 'media',
    ears: 'puntiagudas',
    horns: species === 'dragonborn' ? 'atras' : 'curvos',
    hornColor: HORN_COLORS[0],
    tail: species === 'tiefling',
    tusks: 'pequenos',
    marks: 'lineas',
    marksColor: '#3a4a5a',
    frill: 'cresta',
  };
  return { name: species, fields, defaults };
}
/** Campos de aspecto y valores por defecto para una especie (los de game.actors si existen). */
function appearanceOptions(game, species, opts) {
  try {
    let fn = game.actors?.appearanceOptions;
    if (fn) return fn(species, opts);
  } catch (err) {
    console.warn('[interfaz] appearanceOptions', err);
  }
  return defaultAppearanceOptions(species, opts);
}
/** Completa un aspecto con los valores por defecto y corrige colores de piel no válidos. */
function completeAppearance(game, species, look = {}, opts) {
  try {
    if (game.actors?.completeAppearance) return game.actors.completeAppearance(look, species, opts);
  } catch {}
  let spec = appearanceOptions(game, species, opts),
    out = {};
  for (let field of spec.fields) out[field.key] = look[field.key] ?? spec.defaults[field.key];
  for (let field of spec.fields)
    field.type === 'color' &&
      Array.isArray(field.options) &&
      !field.options.includes(out[field.key]) &&
      ['skin'].includes(field.key) &&
      (out[field.key] = spec.defaults[field.key]);
  return out;
}
/** Aspecto al azar para una especie. */
function randomAppearance(game, species, opts) {
  try {
    if (game.actors?.randomAppearance) return game.actors.randomAppearance(species, opts);
  } catch {}
  let spec = appearanceOptions(game, species, opts),
    pick = (list) => list[Math.floor(Math.random() * list.length)],
    out = {};
  for (let field of spec.fields)
    field.type === 'choice'
      ? (out[field.key] = pick(field.options).id)
      : field.type === 'color'
        ? (out[field.key] = pick(field.options))
        : field.type === 'range'
          ? (out[field.key] =
              Math.round(
                (field.options.min + Math.random() * (field.options.max - field.options.min)) * 100,
              ) / 100)
          : field.type === 'toggle' && (out[field.key] = Math.random() < 0.7);
  return (out.body === 'f' && out.beard && (out.beard = 'ninguna'), out);
}
const SKIN_TONES = {
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
const HAIR_COLORS = [
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
const EXOTIC_HAIR_COLORS = ['#c8d0e0', '#3a3a5a', '#5a2a4a', '#2a4a5a', '#8a2a2a'];
const EYE_COLORS = ['#5a3a1e', '#3a5a8a', '#4a7a4a', '#7a6a4a', '#5a5a6a', '#2a1a12'];
const EXOTIC_EYE_COLORS = ['#d8a020', '#c03020', '#e8e0c0', '#8040c0', '#20a0a0'];
const CLOTH_COLORS = [
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
const METALS = [
  ['acero', 'Acero', '#b8bec6'],
  ['hierro', 'Hierro', '#7d8188'],
  ['bronce', 'Bronce', '#b5803e'],
  ['laton', 'Lat\xF3n', '#c9a64a'],
  ['oro', 'Oro', '#e0b84a'],
  ['pavonado', 'Pavonado', '#3c4048'],
];
const HAIR_STYLES = [
  ['raya', 'Con raya'],
  ['largo', 'Largo'],
  ['mono', 'Mo\xF1os'],
  ['coleta', 'Coleta'],
  ['trenza', 'Trenza'],
  ['rapado', 'Rapado'],
  ['cresta', 'Cresta'],
  ['calvo', 'Calvo'],
];
const BEARDS = [
  ['ninguna', 'Sin barba'],
  ['barba', 'Barba'],
  ['perilla', 'Perilla'],
  ['bigote', 'Bigote'],
  ['larga', 'Barba larga'],
  ['trenzada', 'Trenzada'],
];
const BUILDS = [
  ['delgada', 'Delgada'],
  ['media', 'Media'],
  ['robusta', 'Robusta'],
];
const EARS = [
  ['puntiagudas', 'Puntiagudas'],
  ['largas', 'Largas'],
  ['cortas', 'Cortas'],
];
const HORNS = [
  ['curvos', 'Curvos'],
  ['carnero', 'De carnero'],
  ['rectos', 'Rectos'],
  ['atras', 'Hacia atr\xE1s'],
  ['ninguno', 'Sin cuernos'],
];
const TUSKS = [
  ['grandes', 'Grandes'],
  ['pequenos', 'Peque\xF1os'],
  ['ninguno', 'Sin colmillos'],
];
const MARKS = [
  ['ninguna', 'Ninguna'],
  ['lineas', 'L\xEDneas'],
  ['manchas', 'Manchas'],
  ['runas', 'Runas'],
];
const FRILLS = [
  ['ninguna', 'Ninguna'],
  ['cresta', 'Cresta'],
  ['gola', 'Gola'],
];
const HORN_COLORS = ['#2a2020', '#4a3a2e', '#7a6a58', '#c8b8a0', '#5a2a2a', '#3a3a4a'];
const toOptions = (list) => list.map(([id, label, swatch]) => ({ id, label, ...(swatch ? { swatch } : {}) }));
/** Grupos de campos de aspecto, en el orden en que los enseña el creador. */
const LOOK_GROUPS = [
  ['Figura', ['body', 'build', 'height', 'face']],
  ['Piel y ojos', ['skin', 'eyes']],
  ['Pelo', ['hair', 'hairColor', 'beard']],
  ['Rasgos de tu especie', ['ears', 'horns', 'hornColor', 'tail', 'tusks', 'marks', 'marksColor', 'frill']],
  ['Ropa y metal', ['cloth1', 'cloth2', 'metal', 'helmet', 'hood']],
];

export { randomAppearance, LOOK_GROUPS, appearanceOptions, completeAppearance };
