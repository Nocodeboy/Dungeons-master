// actors/appearance.js
// Reconstruido de publicado/juego.js (módulo __esm «Ur»).
//
// Aspecto físico de los héroes por especie: campos del creador de personajes (cuerpo, rostro,
// piel, ojos, pelo, barba, telas, metal, altura, complexión, casco, capucha y rasgos de especie),
// valores por defecto, aspecto al azar y normalización. También las paletas (pieles, pelos, ojos,
// telas, metales, colores dracónidos), las proporciones de cada especie (SPECIES_BODY) y el
// generador pseudoaleatorio con semilla seededRandom que usan los demás módulos de actors/.
// Lo usan look.js, companions.js, monsters.js, beasts.js, animals.js y, por index.js, el creador.

/** Campos de aspecto propios de la especie (orejas, cuernos, cola, cresta, colmillos, marcas). */
function speciesFields(species) {
  let fields = [];
  return (
    (species === 'elf' || species === 'half_elf' || species === 'gnome') &&
      fields.push({
        key: 'ears',
        label: 'Orejas',
        type: 'choice',
        options: toOptions([
          ['puntiagudas', 'Puntiagudas'],
          ['largas', 'Largas'],
          ['cortas', 'Cortas'],
        ]),
      }),
    species === 'tiefling' &&
      (fields.push({
        key: 'horns',
        label: 'Cuernos',
        type: 'choice',
        options: toOptions([
          ['curvos', 'Curvos'],
          ['carnero', 'De carnero'],
          ['rectos', 'Rectos'],
          ['atras', 'Hacia atr\xE1s'],
          ['ninguno', 'Sin cuernos'],
        ]),
      }),
      fields.push({
        key: 'hornColor',
        label: 'Color de los cuernos',
        type: 'color',
        options: ['#2a2020', '#4a3a30', '#6a5a4a', '#c8b8a0', '#3a2a40', '#8a2a2a'],
      }),
      fields.push({ key: 'tail', label: 'Cola', type: 'toggle' })),
    species === 'dragonborn' &&
      (fields.push({
        key: 'horns',
        label: 'Cuernos',
        type: 'choice',
        options: toOptions([
          ['atras', 'Hacia atr\xE1s'],
          ['rectos', 'Rectos'],
          ['curvos', 'Curvos'],
          ['ninguno', 'Sin cuernos'],
        ]),
      }),
      fields.push({
        key: 'hornColor',
        label: 'Color de los cuernos',
        type: 'color',
        options: ['#e8dcc0', '#c8b8a0', '#5a4a3a', '#2a2420', '#b0a090'],
      }),
      fields.push({
        key: 'frill',
        label: 'Cresta',
        type: 'choice',
        options: toOptions([
          ['cresta', 'Cresta'],
          ['gola', 'Gola'],
          ['ninguna', 'Ninguna'],
        ]),
      })),
    (species === 'orc' || species === 'half_orc') &&
      fields.push({
        key: 'tusks',
        label: 'Colmillos',
        type: 'choice',
        options: toOptions([
          ['grandes', 'Grandes'],
          ['pequenos', 'Peque\xF1os'],
          ['ninguno', 'Ninguno'],
        ]),
      }),
    species === 'goliath' &&
      (fields.push({
        key: 'marks',
        label: 'Marcas',
        type: 'choice',
        options: toOptions([
          ['lineas', 'L\xEDneas'],
          ['manchas', 'Manchas'],
          ['runas', 'Runas'],
          ['ninguna', 'Ninguna'],
        ]),
      }),
      fields.push({
        key: 'marksColor',
        label: 'Color de las marcas',
        type: 'color',
        options: ['#4a4a52', '#3a3028', '#6a7a8a', '#2a3a4a', '#7a5a3a'],
      })),
    fields
  );
}
/** Tonos de piel posibles; en dracónidos, el color de su ancestro primero y el resto detrás. */
function skinOptions(species, { lineage, ancestry } = {}) {
  if (species === 'dragonborn') {
    let main = DRAGON_COLORS[ancestry] || DRAGON_COLORS.red;
    return [main, ...Object.values(DRAGON_COLORS).filter((c) => c !== main)];
  }
  return species === 'elf' && lineage === 'drow' ? SKIN_TONES.drow : SKIN_TONES[species] || SKIN_TONES.human;
}
/**
 * Descripción del formulario de aspecto para una especie: {species, name, fields, defaults}, donde
 * cada campo es {key, label, type: choice|color|range|toggle, options…}. `opts`: {lineage, ancestry,
 * body, pronoun}.
 */
function appearanceOptions(species, opts = {}) {
  let sp = SPECIES_BODY[species] ? species : 'human',
    exotic = sp === 'tiefling' || sp === 'dragonborn' || (sp === 'elf' && opts.lineage === 'drow'),
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
      {
        key: 'face',
        label: 'Rostro',
        type: 'choice',
        options: [0, 1, 2, 3].map((k) => ({ id: k, label: ['I', 'II', 'III', 'IV'][k] })),
      },
      {
        key: 'skin',
        label: sp === 'dragonborn' ? 'Escamas' : 'Piel',
        type: 'color',
        options: skinOptions(sp, opts),
      },
      {
        key: 'eyes',
        label: 'Ojos',
        type: 'color',
        options: exotic ? [...EXOTIC_EYE_COLORS, ...EYE_COLORS] : EYE_COLORS,
      },
    ];
  return (
    sp !== 'dragonborn' &&
      (fields.push({ key: 'hair', label: 'Peinado', type: 'choice', options: toOptions(HAIR_STYLES) }),
      fields.push({
        key: 'hairColor',
        label: 'Color del pelo',
        type: 'color',
        options: exotic || sp === 'elf' ? [...HAIR_COLORS, ...EXOTIC_HAIR_COLORS] : HAIR_COLORS,
      }),
      fields.push({ key: 'beard', label: 'Barba', type: 'choice', options: toOptions(BEARD_STYLES) })),
    fields.push(
      { key: 'cloth1', label: 'Ropa (color principal)', type: 'color', options: CLOTH_COLORS },
      { key: 'cloth2', label: 'Ropa (color secundario)', type: 'color', options: CLOTH_COLORS },
      {
        key: 'metal',
        label: 'Metal',
        type: 'choice',
        options: Object.entries(METALS).map(([id, metal]) => ({
          id,
          label: metal.label,
          swatch: metal.color,
        })),
      },
      { key: 'height', label: 'Altura', type: 'range', min: 0.94, max: 1.06, step: 0.01 },
      { key: 'build', label: 'Complexi\xF3n', type: 'choice', options: toOptions(BUILDS) },
      { key: 'helmet', label: 'Casco (con armadura media o pesada)', type: 'toggle' },
      {
        key: 'hood',
        label: 'Capucha',
        type: 'choice',
        options: toOptions([
          ['auto', 'Seg\xFAn la clase'],
          ['si', 'Puesta'],
          ['no', 'Quitada'],
        ]),
      },
      ...speciesFields(sp),
    ),
    { species: sp, name: SPECIES_NAMES[sp], fields, defaults: defaultAppearance(sp, opts) }
  );
}
/** Aspecto por defecto de una especie (cuerpo según `opts.body` o el pronombre). */
function defaultAppearance(species, opts = {}) {
  let sp = SPECIES_BODY[species] ? species : 'human',
    body = opts.body || (opts.pronoun === 'f' ? 'f' : 'm'),
    skins = skinOptions(sp, opts),
    look = {
      body,
      face: 0,
      skin: skins[sp === 'human' ? 1 : 0],
      eyes: EYE_COLORS[0],
      hair: body === 'f' ? 'largo' : 'raya',
      hairColor: sp === 'elf' && opts.lineage === 'drow' ? '#e8e4dc' : HAIR_COLORS[1],
      beard: body === 'm' && sp === 'dwarf' ? 'larga' : 'ninguna',
      cloth1: '#3f5f9a',
      cloth2: '#c9b48a',
      metal: 'acero',
      height: 1,
      build: sp === 'dwarf' || sp === 'goliath' || sp === 'orc' ? 'robusta' : 'media',
      helmet: !1,
      hood: 'auto',
      ...(SPECIES_DEFAULTS[sp] || {}),
    };
  return (
    sp === 'dragonborn' && ((look.hair = 'calvo'), (look.beard = 'ninguna'), (look.eyes = '#d8a020')),
    sp === 'tiefling' && (look.eyes = '#d8a020'),
    sp === 'goliath' && (look.hair = 'rapado'),
    look
  );
}
/** Generador xorshift con semilla numérica o de texto; devuelve una función que da valores en [0, 1). */
function seededRandom(seed = 1) {
  let state =
    (typeof seed == 'string' ? [...seed].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7) : seed) >>>
      0 || 1;
  return () => (
    (state ^= state << 13),
    (state ^= state >>> 17),
    (state ^= state << 5),
    ((state >>> 0) % 1e5) / 1e5
  );
}
/** Aspecto al azar (determinista con `seed`) entre las opciones del formulario. */
function randomAppearance(species, opts = {}, seed = Date.now()) {
  let rand = seededRandom(seed),
    pick = (list) => list[Math.floor(rand() * list.length)],
    spec = appearanceOptions(species, opts),
    look = { ...spec.defaults };
  for (let field of spec.fields)
    field.type === 'choice'
      ? (look[field.key] = pick(field.options).id)
      : field.type === 'color'
        ? (look[field.key] = pick(field.options))
        : field.type === 'range'
          ? (look[field.key] =
              Math.round((field.min + rand() * (field.max - field.min)) / field.step) * field.step)
          : field.type === 'toggle' && (look[field.key] = rand() < 0.7);
  return (
    opts.body && (look.body = opts.body),
    look.body === 'f' && rand() < 0.9 && (look.beard = 'ninguna'),
    species === 'dwarf' && look.body === 'm' && look.beard === 'ninguna' && (look.beard = 'larga'),
    species === 'dragonborn' && (look.skin = skinOptions(species, opts)[0]),
    look
  );
}
/** Completa un aspecto parcial con los valores por defecto y acota altura (0,92–1,08) y rostro (0–3). */
function completeAppearance(look = {}, species = 'human', opts = {}) {
  let full = { ...defaultAppearance(species, { ...opts, body: look.body || opts.body }) };
  for (let [key, value] of Object.entries(look || {})) value != null && value !== '' && (full[key] = value);
  return (
    (typeof full.height != 'number' || !isFinite(full.height)) && (full.height = 1),
    (full.height = Math.min(1.08, Math.max(0.92, full.height))),
    (full.face = Math.max(0, Math.min(3, Number(full.face) || 0))),
    full
  );
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
const EXOTIC_HAIR_COLORS = ['#e8e4dc', '#c8d0e0', '#3a3a5a', '#5a2a4a', '#2a4a5a', '#8a2a2a'];
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
const METALS = {
  acero: { label: 'Acero', color: '#b8bec6' },
  hierro: { label: 'Hierro', color: '#7d8188' },
  bronce: { label: 'Bronce', color: '#b5803e' },
  laton: { label: 'Lat\xF3n', color: '#c9a64a' },
  oro: { label: 'Oro', color: '#e0b84a' },
  pavonado: { label: 'Pavonado', color: '#3c4048' },
};
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
const BEARD_STYLES = [
  ['ninguna', 'Sin barba'],
  ['barba', 'Barba'],
  ['perilla', 'Perilla'],
  ['bigote', 'Bigote'],
  ['larga', 'Barba larga'],
  ['trenzada', 'Barba trenzada'],
];
const BUILDS = [
  ['delgada', 'Delgada'],
  ['media', 'Media'],
  ['robusta', 'Robusta'],
];
/** Proporciones por especie: escala general y factores de anchura, cabeza, piernas, brazos, manos y cuello. */
const SPECIES_BODY = {
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
const SPECIES_NAMES = {
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
/** [[id, etiqueta]…] → [{id, label}…]. */
const toOptions = (pairs) => pairs.map(([id, label]) => ({ id, label }));
/** Rasgos por defecto de cada especie. */
const SPECIES_DEFAULTS = {
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
  seededRandom,
  appearanceOptions,
  completeAppearance,
  defaultAppearance,
  SPECIES_BODY,
  randomAppearance,
};
