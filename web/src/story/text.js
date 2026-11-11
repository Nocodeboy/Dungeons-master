// story/text.js
// Reconstruido de publicado/juego.js (módulo __esm «cE»). Nombres locales aún minificados.

function lE(o) {
  let e = { species: sE, class: iE, bg: rE }[o.ns];
  return e?.[o.name] ? `[${e[o.name][2]}]` : o.ns === 'lineage' && nE[o.name] ? `[${nE[o.name]}]` : null;
}
function fm(o, e) {
  if (o == null) return '';
  let t = e?.hero?.() || {},
    a = LD(t.pronoun);
  return String(o).replace(/\{([^{}]+)\}/g, (n, s) => {
    if (s.includes('/')) {
      let r = s.split('/');
      return a === 2 ? (r[2] ?? r[0]) : (r[a] ?? r[0]);
    }
    let i = (r, l) => {
      let c = r[l];
      return c ? (a === 1 ? c[1] : c[0]) : l || '';
    };
    switch (s) {
      case 'hero':
        return t.name || 'forastero';
      case 'nombre':
        return String(t.name || 'forastero').split(' ')[0];
      case 'especie':
        return i(sE, t.species);
      case 'clase':
        return i(iE, t.class);
      case 'trasfondo':
        return i(rE, t.background);
      case 'gold':
        return String(e?.gold?.() ?? 0);
      case 'precio':
        return String(e?.hirePrice?.() ?? 0);
      default:
        return s.startsWith('var:')
          ? String(e?.vars?.[s.slice(4)] ?? '')
          : s.startsWith('flag:')
            ? String(e?.flag?.(s.slice(5)) ?? '')
            : n;
    }
  });
}
const vc = {
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
const oE = {
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
const yc = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constituci\xF3n',
  int: 'Inteligencia',
  wis: 'Sabidur\xEDa',
  cha: 'Carisma',
};
const sE = {
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
const iE = {
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
const rE = {
  acolyte: ['ac\xF3lito', 'ac\xF3lita', 'Ac\xF3lito'],
  criminal: ['criminal', 'criminal', 'Criminal'],
  sage: ['sabio', 'sabia', 'Sabio'],
  soldier: ['soldado', 'soldado', 'Soldado'],
  warden: ['guardabosques', 'guardabosques', 'Guardabosques'],
  minstrel: ['juglar', 'juglaresa', 'Juglar'],
  noble: ['heredero', 'heredera', 'Heredero'],
  bounty_hunter: ['cazarrecompensas', 'cazarrecompensas', 'Cazarrecompensas'],
};
const nE = {
  wood_elf: 'Elfo de los bosques',
  high_elf: 'Alto elfo',
  drow: 'Drow',
  rock_gnome: 'Gnomo de las rocas',
  forest_gnome: 'Gnomo de los bosques',
};
const LD = (o) => (o === 'f' ? 1 : o === 'n' ? 2 : 0);

export { fm, lE, oE, vc, yc };
