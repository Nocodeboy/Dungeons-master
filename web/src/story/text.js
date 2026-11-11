// story/text.js — Textos de la historia: plantillas con el héroe y su pronombre, y nombres de reglas.
// `formatText` sustituye {hero}, {nombre}, {especie}, {clase}, {trasfondo}, {gold}, {precio}, {var:x}, {flag:x}
// y las alternativas por pronombre «{o/a/e}» (m/f/n). Lo usa story/runner.js (diálogos, avisos y pruebas).

/** Etiqueta «[Humano]», «[Mago]»… de un átomo de condición de especie, clase, trasfondo o linaje (o null). */
function conditionTag(atom) {
  let table = { species: SPECIES_WORDS, class: CLASS_WORDS, bg: BACKGROUND_WORDS }[atom.ns];
  return table?.[atom.name] ? `[${table[atom.name][2]}]` : atom.ns === 'lineage' && LINEAGE_NAMES[atom.name] ? `[${LINEAGE_NAMES[atom.name]}]` : null;
}
/** Rellena una plantilla de texto con los datos del héroe (ctx.hero()) y del contexto de la historia. */
function formatText(text, ctx) {
  if (text == null) return '';
  let hero = ctx?.hero?.() || {},
    form = pronounIndex(hero.pronoun);
  return String(text).replace(/\{([^{}]+)\}/g, (match, key) => {
    if (key.includes('/')) {
      let parts = key.split('/');
      return form === 2 ? (parts[2] ?? parts[0]) : (parts[form] ?? parts[0]);
    }
    let word = (table, id) => {
      let entry = table[id];
      return entry ? (form === 1 ? entry[1] : entry[0]) : id || '';
    };
    switch (key) {
      case 'hero':
        return hero.name || 'forastero';
      case 'nombre':
        return String(hero.name || 'forastero').split(' ')[0];
      case 'especie':
        return word(SPECIES_WORDS, hero.species);
      case 'clase':
        return word(CLASS_WORDS, hero.class);
      case 'trasfondo':
        return word(BACKGROUND_WORDS, hero.background);
      case 'gold':
        return String(ctx?.gold?.() ?? 0);
      case 'precio':
        return String(ctx?.hirePrice?.() ?? 0);
      default:
        return key.startsWith('var:')
          ? String(ctx?.vars?.[key.slice(4)] ?? '')
          : key.startsWith('flag:')
            ? String(ctx?.flag?.(key.slice(5)) ?? '')
            : match;
    }
  });
}
/** Nombres en español de las habilidades. */
const SKILL_NAMES = {
  acrobatics: 'Acrobacias',
  animal_handling: 'Trato con animales',
  arcana: 'Arcanos',
  athletics: 'Atletismo',
  deception: 'Enga\xF1o',
  history: 'Historia',
  insight: 'Perspicacia',
  intimidation: 'Intimidaci\xF3n',
  investigation: 'Investigaci\xF3n',
  medicine: 'Medicina',
  nature: 'Naturaleza',
  perception: 'Percepci\xF3n',
  performance: 'Interpretaci\xF3n',
  persuasion: 'Persuasi\xF3n',
  religion: 'Religi\xF3n',
  sleight_of_hand: 'Juego de manos',
  stealth: 'Sigilo',
  survival: 'Supervivencia',
};
/** Característica de cada habilidad. */
const SKILL_ABILITIES = {
  athletics: 'str',
  acrobatics: 'dex',
  sleight_of_hand: 'dex',
  stealth: 'dex',
  arcana: 'int',
  history: 'int',
  investigation: 'int',
  nature: 'int',
  religion: 'int',
  animal_handling: 'wis',
  insight: 'wis',
  medicine: 'wis',
  perception: 'wis',
  survival: 'wis',
  deception: 'cha',
  intimidation: 'cha',
  performance: 'cha',
  persuasion: 'cha',
};
/** Nombres en español de las características. */
const ABILITY_NAMES = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constituci\xF3n',
  int: 'Inteligencia',
  wis: 'Sabidur\xEDa',
  cha: 'Carisma',
};
/** Especies: [masculino, femenino, etiqueta]. Igual para clases y trasfondos. */
const SPECIES_WORDS = {
  human: ['humano', 'humana', 'Humano'],
  elf: ['elfo', 'elfa', 'Elfo'],
  half_elf: ['semielfo', 'semielfa', 'Semielfo'],
  dwarf: ['enano', 'enana', 'Enano'],
  halfling: ['mediano', 'mediana', 'Mediano'],
  gnome: ['gnomo', 'gnoma', 'Gnomo'],
  dragonborn: ['drac\xF3nido', 'drac\xF3nida', 'Drac\xF3nido'],
  goliath: ['goliat', 'goliat', 'Goliat'],
  orc: ['orco', 'orca', 'Orco'],
  half_orc: ['semiorco', 'semiorca', 'Semiorco'],
  tiefling: ['tiflin', 'tiflin', 'Tiflin'],
};
const CLASS_WORDS = {
  barbarian: ['b\xE1rbaro', 'b\xE1rbara', 'B\xE1rbaro'],
  bard: ['bardo', 'barda', 'Bardo'],
  cleric: ['cl\xE9rigo', 'cl\xE9riga', 'Cl\xE9rigo'],
  druid: ['druida', 'druida', 'Druida'],
  fighter: ['guerrero', 'guerrera', 'Guerrero'],
  monk: ['monje', 'monja', 'Monje'],
  paladin: ['palad\xEDn', 'paladina', 'Palad\xEDn'],
  ranger: ['explorador', 'exploradora', 'Explorador'],
  rogue: ['p\xEDcaro', 'p\xEDcara', 'P\xEDcaro'],
  sorcerer: ['hechicero', 'hechicera', 'Hechicero'],
  warlock: ['brujo', 'bruja', 'Brujo'],
  wizard: ['mago', 'maga', 'Mago'],
};
const BACKGROUND_WORDS = {
  acolyte: ['ac\xF3lito', 'ac\xF3lita', 'Ac\xF3lito'],
  criminal: ['criminal', 'criminal', 'Criminal'],
  sage: ['sabio', 'sabia', 'Sabio'],
  soldier: ['soldado', 'soldado', 'Soldado'],
  warden: ['guardabosques', 'guardabosques', 'Guardabosques'],
  minstrel: ['juglar', 'juglaresa', 'Juglar'],
  noble: ['heredero', 'heredera', 'Heredero'],
  bounty_hunter: ['cazarrecompensas', 'cazarrecompensas', 'Cazarrecompensas'],
};
/** Nombres de los linajes (subespecies). */
const LINEAGE_NAMES = {
  wood_elf: 'Elfo de los bosques',
  high_elf: 'Alto elfo',
  drow: 'Drow',
  rock_gnome: 'Gnomo de las rocas',
  forest_gnome: 'Gnomo de los bosques',
};
/** Índice de la forma por pronombre: m → 0, f → 1, n → 2. */
const pronounIndex = (pronoun) => (pronoun === 'f' ? 1 : pronoun === 'n' ? 2 : 0);

export { formatText, conditionTag, SKILL_ABILITIES, SKILL_NAMES, ABILITY_NAMES };
