// actors/look.js
// Reconstruido de publicado/juego.js (módulo __esm «cu»).
//
// De la hoja de personaje (clase, especie, armadura, armas, escudo, aspecto) al «look» que construye
// humanoid.js: proporciones, rasgos de especie (cabeza esculpida, cuernos, cola…), ropa por clase,
// equipo visible y estilo de empuñadura (weaponLoadout). Es un espacio de nombres: humanoid.js lo
// carga con import() para cambiar de arma, así que sus exports conservan el nombre original.
// Lo usan index.js (makeHero), companions.js, preview.js y humanoid.js.

import { completeAppearance, DRAGON_COLORS, METALS, SPECIES_BODY } from './appearance.js';

/** Rasgos de especie: {head} para makeHeadSculpt, {extras} (cuernos, colmillos, cola, cresta) y {fx} de piel. */
function speciesFeatures(species, look, opts) {
  let head = { face: look.face || 0 },
    extras = {},
    fx = {},
    earLens = { largas: 0.075, puntiagudas: 0.045, cortas: 0.022 };
  if (species === 'elf' || species === 'half_elf' || species === 'gnome') {
    let len = earLens[look.ears] ?? (species === 'elf' ? 0.075 : 0.04);
    head.ears = { len: species === 'half_elf' ? len * 0.7 : len, dir: [0.45, 0.85, -0.6] };
  }
  if (
    (species === 'gnome' && (head.nose = { len: 0.012, wide: 0.18, drop: 0.004 }),
    species === 'dwarf' &&
      ((head.nose = { len: 0.008, wide: 0.14, drop: 0.003 }), (head.jaw = { wide: 0.05, brow: 0.006 })),
    species === 'halfling' && (head.nose = { len: 0.003, wide: 0.06 }),
    species === 'orc' || species === 'half_orc')
  ) {
    let k = species === 'orc' ? 1 : 0.55;
    ((head.jaw = { wide: 0.11 * k, fwd: 0.014 * k, brow: 0.013 * k }),
      (head.nose = { len: -0.004 * k, wide: 0.22 * k }),
      (head.ears = { len: 0.022 * k, dir: [0.6, 0.6, -0.5] }),
      look.tusks && look.tusks !== 'ninguno' && (extras.tusks = look.tusks));
  }
  if (species === 'goliath') {
    head.jaw = { wide: 0.06, brow: 0.01 };
    let pattern = { lineas: 2, manchas: 3, runas: 4 }[look.marks];
    pattern && Object.assign(fx, { pattern, patternColor: look.marksColor || '#4a4a52' });
  }
  return (
    species === 'tiefling' &&
      (look.horns &&
        look.horns !== 'ninguno' &&
        (extras.horns = { kind: look.horns, color: look.hornColor || '#2a2020' }),
      look.tail !== !1 && (extras.tail = { color: shade(look.skin, 0.9), tip: !0 }),
      (head.jaw = { brow: 0.004 })),
    species === 'dragonborn' &&
      ((head.snout = 0.068),
      look.horns &&
        look.horns !== 'ninguno' &&
        (extras.horns = { kind: look.horns, color: look.hornColor || '#e8dcc0', scale: 1.1 }),
      look.frill &&
        look.frill !== 'ninguna' &&
        (extras.frill = { kind: look.frill, color: shade(look.skin, 0.75) }),
      Object.assign(fx, { pattern: 1, patternColor: shade(look.skin, 0.5) })),
    { head, extras, fx }
  );
}
/** Multiplica un color «#rrggbb» por `k` (aclara u oscurece). */
function shade(hex, k) {
  let rgb = parseInt(String(hex || '#888888').slice(1), 16);
  return (
    '#' +
    [(rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255]
      .map((c) => Math.max(0, Math.min(255, Math.round(c * k))))
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')
  );
}
/**
 * Qué lleva en las manos y a la espalda según las armas de la hoja: {main, off, shield, back, sheath,
 * style, grips}. `prefer` («melee» o «ranged») elige entre cuerpo a cuerpo y distancia; `style` es
 * la clave de GRIP_CLIPS (1h, 2h, polearm, dual, bow, crossbow, staff, caster, shield, unarmed).
 */
function weaponLoadout(sheet, { prefer } = {}) {
  let cls = sheet.class || '',
    weapons = (sheet.weapons || []).filter((w) => w && w !== 'unarmed');
  (ARCANE_CASTERS.has(cls) || cls === 'druid') &&
    (weapons = weapons.map((w) =>
      w === 'quarterstaff' ? (cls === 'druid' ? 'druid_staff' : 'arcane_staff') : w,
    ));
  let melee = weapons.filter((w) => !RANGED_WEAPONS.has(w) && w !== 'javelin'),
    ranged = weapons.filter((w) => RANGED_WEAPONS.has(w) && w !== 'dart'),
    hasShield = !!sheet.shield,
    loadout = { main: null, off: null, shield: null, back: [], sheath: null, style: '1h', grips: [] },
    shieldStyle =
      cls === 'cleric' || cls === 'paladin'
        ? cls === 'cleric'
          ? 'sol'
          : 'cometa'
        : sheet.armor && ARMOR_LOOKS[sheet.armor]?.cat === 'heavy'
          ? 'cometa'
          : 'redondo';
  if (
    (prefer === 'ranged' ||
      (prefer !== 'melee' &&
        ranged.length &&
        (!melee.length || ((cls === 'ranger' || cls === 'rogue') && RANGED_WEAPONS.has(weapons[0]))))) &&
    ranged.length
  ) {
    let weapon = ranged[0];
    (weapon.endsWith('bow') && !weapon.includes('crossbow')
      ? ((loadout.off = weapon), loadout.grips.push('l'), (loadout.style = 'bow'))
      : ((loadout.main = weapon), loadout.grips.push('r'), (loadout.style = 'crossbow')),
      melee[0] && (loadout.sheath = melee[0]),
      hasShield && loadout.back.push(`escudo:${shieldStyle}`));
  } else {
    let weapon = melee[0];
    if (
      (weapon &&
        ((loadout.main = weapon),
        loadout.grips.push('r'),
        TWO_HANDED.has(weapon)
          ? ((loadout.style =
              (weapon.endsWith('staff') || weapon === 'quarterstaff') &&
              (ARCANE_CASTERS.has(cls) || cls === 'druid')
                ? 'staff'
                : '2h'),
            loadout.grips.push('l'))
          : POLEARMS.has(weapon) && ((loadout.style = 'polearm'), loadout.grips.push('l'))),
      hasShield && !TWO_HANDED.has(weapon) && !POLEARMS.has(weapon)
        ? ((loadout.shield = shieldStyle), (loadout.style = weapon ? 'shield' : loadout.style))
        : weapon &&
          LIGHT_WEAPONS.has(weapon) &&
          melee[1] &&
          LIGHT_WEAPONS.has(melee[1]) &&
          !TWO_HANDED.has(weapon) &&
          ((loadout.off = melee[1]), loadout.grips.push('l'), (loadout.style = 'dual')),
      ranged[0])
    ) {
      let backup = ranged[0];
      backup.endsWith('bow') && !backup.includes('crossbow')
        ? loadout.back.push(`arma:${backup}`)
        : backup !== 'sling' && loadout.back.push(`arma:${backup}`);
    }
    (!weapon &&
      !ranged.length &&
      (ARCANE_CASTERS.has(cls)
        ? ((loadout.main = 'wand'), loadout.grips.push('r'), (loadout.style = 'caster'))
        : (loadout.style = 'unarmed')),
      ARCANE_CASTERS.has(cls) && weapon && !TWO_HANDED.has(weapon) && (loadout.style = 'caster'));
  }
  return (
    ranged.some((w) => w.endsWith('bow') && !w.includes('crossbow')) && loadout.back.unshift('carcaj'),
    loadout
  );
}
/** Ropa (piezas del glTF por zona), equipo procedural y cota de malla según armadura y clase. */
function outfitFor(sheet, look, loadout) {
  let cls = sheet.class || 'fighter',
    armor = ARMOR_LOOKS[sheet.armor] || null,
    outfit = { torso: 'ex', brazos: 'ex', piernas: 'ex', pies: 'ex', cintos: !0 },
    gear = {
      main: loadout.main,
      off: loadout.off,
      shield: loadout.shield,
      back: loadout.back.slice(),
      sheath: loadout.sheath,
    },
    mail = 0,
    armorLook = armor?.look;
  switch (
    ((armorLook === 'malla' || armorLook === 'anillas' || armorLook === 'camisote') && (mail = 1),
    armorLook === 'escamas' && (mail = 2),
    (armorLook === 'semiplacas' || armorLook === 'bandas' || armorLook === 'placas') &&
      ((mail = 1),
      (gear.breastplate = 'placas'),
      (gear.pauldrons = armorLook === 'semiplacas' ? !0 : 'grandes'),
      (gear.greaves = !0),
      armorLook !== 'semiplacas' && (gear.bracers = !0)),
    armorLook === 'coraza' && (gear.breastplate = 'coraza'),
    armor &&
      (armor.cat === 'medium' || armor.cat === 'heavy') &&
      armorLook !== 'pieles' &&
      (outfit.hombrera = !gear.pauldrons),
    armorLook === 'pieles' && (gear.mantle = 'pieles'),
    armor && armor.cat !== 'light' && (outfit.brazales = !gear.bracers),
    armorLook === 'acolchada' && (outfit.torso = 'ca'),
    cls)
  ) {
    case 'barbarian':
      armor ||
        ((outfit.torso = 'piel'),
        (outfit.brazos = 'piel'),
        (gear.mantle = 'pieles'),
        (gear.bracers = 'cuero'));
      break;
    case 'bard':
      ((outfit.torso = 'ca'),
        (outfit.brazos = 'ca'),
        (gear.cape = 'corta'),
        (gear.hat = 'chambergo'),
        gear.back.push('laud'));
      break;
    case 'cleric':
      ((gear.tabard = 'larga'),
        (gear.emblem = !0),
        armor || ((outfit.torso = 'ca'), (outfit.brazos = 'ca'), (gear.robe = 'larga')));
      break;
    case 'druid':
      ((outfit.torso = 'ca'), (outfit.brazos = 'ca'), (gear.mantle = 'hojas'), (gear.hat = 'astas'));
      break;
    case 'fighter':
      break;
    case 'monk':
      ((outfit.torso = 'ca'),
        (outfit.brazos = 'ca'),
        (outfit.piernas = 'ca'),
        (outfit.pies = 'ca'),
        (outfit.cintos = !1),
        (gear.sash = look.cloth2));
      break;
    case 'paladin':
      ((gear.tabard = 'larga'), (gear.emblem = !0), (gear.cape = 'larga'));
      break;
    case 'ranger':
      ((outfit.capucha = !0), (outfit.hombrera = !0));
      break;
    case 'rogue':
      ((outfit.capucha = !0), (gear.pouch = !0));
      break;
    case 'sorcerer':
      ((outfit.torso = 'ca'), (outfit.brazos = 'ca'), (gear.robe = 'corta'), (gear.hat = 'diadema'));
      break;
    case 'warlock':
      ((outfit.torso = 'ca'),
        (outfit.brazos = 'ca'),
        (outfit.capucha = !0),
        (gear.robe = 'larga'),
        (gear.book = !0));
      break;
    case 'wizard':
      ((outfit.torso = 'ca'),
        (outfit.brazos = 'ca'),
        (gear.robe = 'larga'),
        (gear.hat = 'mago'),
        (gear.book = !0),
        (gear.pouch = !0));
      break;
    default:
      break;
  }
  return (
    gear.robe && (outfit.cintos = !1),
    look.helmet &&
      (armor?.cat === 'heavy' || armor?.cat === 'medium') &&
      (gear.helmet = look.helmet === !0 ? 'casco' : look.helmet),
    (look.hood === !1 || look.hood === 'no') && (outfit.capucha = !1),
    (look.hood === !0 || look.hood === 'si') && (outfit.capucha = !0),
    { outfit, gear, mail }
  );
}
/** Look completo de un héroe a partir de su hoja (y `opts.prefer` para el arma). */
function heroLook(sheet, opts = {}) {
  let species = SPECIES_BODY[sheet.species] ? sheet.species : 'human',
    speciesOpts = { lineage: sheet.lineage, ancestry: sheet.ancestry, pronoun: sheet.pronoun },
    look = completeAppearance(sheet.appearance || legacyAppearance(sheet), species, speciesOpts);
  species === 'dragonborn' &&
    !sheet.appearance?.skin &&
    sheet.ancestry &&
    (look.skin = DRAGON_COLORS[sheet.ancestry] || look.skin);
  let body = { ...SPECIES_BODY[species] };
  sheet.size === 'small' &&
    (body.scale ?? 1) > 0.7 &&
    ((body.scale = 0.64), (body.head = (body.head ?? 1) * 1.12));
  let build =
      { delgada: { width: 0.94, thick: 0.92 }, media: {}, robusta: { width: 1.07, thick: 1.1 } }[
        look.build
      ] || {},
    prop = {
      ...body,
      width: (body.width ?? 1) * (build.width ?? 1),
      thick: build.thick ?? 1,
      height: look.height ?? 1,
    },
    { head, extras, fx: skinFx } = speciesFeatures(species, look, speciesOpts),
    loadout = weaponLoadout(sheet, opts),
    { outfit, gear, mail } = outfitFor(sheet, look, loadout),
    metalColor = METALS[look.metal]?.color || look.metal || METALS.acero.color;
  return {
    id: sheet.id || sheet.name || '',
    kind: 'hero',
    species,
    body: look.body,
    hair: species === 'dragonborn' ? 'calvo' : look.hair,
    beard: species === 'dragonborn' ? 'ninguna' : look.beard,
    brows: species !== 'dragonborn',
    colors: {
      skin: look.skin,
      hair: look.hairColor,
      eyes: look.eyes,
      cloth1: look.cloth1,
      cloth2: look.cloth2,
    },
    metalColor,
    skinFx,
    mail,
    glowEyes: species === 'tiefling' ? 0.35 : species === 'dragonborn' ? 0.15 : 0,
    prop,
    head,
    extras,
    outfit,
    gear,
    style: loadout.style,
    grips: loadout.grips,
    appearance: look,
  };
}
/** Aspecto mínimo desde el campo antiguo `visual` de la hoja (piel, pelo, tela) y el pronombre. */
function legacyAppearance(sheet) {
  let visual = sheet.visual || {},
    look = {};
  return (
    visual.skin && (look.skin = visual.skin),
    visual.hair && (look.hairColor = visual.hair),
    visual.cloth && (look.cloth1 = visual.cloth),
    sheet.pronoun === 'f' && (look.body = 'f'),
    look
  );
}
/** Hoja de ejemplo de una clase con armadura, armas y colores típicos (vista previa y pruebas). */
function sampleSheet(cls, body = 'm', species = 'human') {
  let preset = {
      barbarian: {
        armor: '',
        weapons: ['greataxe', 'handaxe'],
        shield: !1,
        appearance: {
          cloth1: '#6b3a2a',
          cloth2: '#8a6a3a',
          hair: 'largo',
          beard: 'barba',
          hairColor: '#8a5a2e',
        },
      },
      bard: {
        armor: 'leather',
        weapons: ['rapier', 'dagger'],
        shield: !1,
        appearance: { cloth1: '#7a2e5a', cloth2: '#e8dcc0', hair: 'raya' },
      },
      cleric: {
        armor: 'scale_mail',
        weapons: ['mace'],
        shield: !0,
        appearance: { cloth1: '#e8dcc0', cloth2: '#c9a64a', metal: 'laton', hair: 'mono' },
      },
      druid: {
        armor: 'leather',
        weapons: ['quarterstaff', 'sickle'],
        shield: !1,
        appearance: { cloth1: '#3e6b3a', cloth2: '#8a6a3a', hair: 'trenza', hairColor: '#b0702e' },
      },
      fighter: {
        armor: 'chain_mail',
        weapons: ['longsword', 'javelin'],
        shield: !0,
        appearance: { cloth1: '#7a2e2a', cloth2: '#c9b48a', hair: 'rapado', beard: 'perilla' },
      },
      monk: {
        armor: '',
        weapons: ['quarterstaff', 'dart'],
        shield: !1,
        appearance: { cloth1: '#c9822a', cloth2: '#7a2e2a', hair: 'calvo' },
      },
      paladin: {
        armor: 'plate',
        weapons: ['longsword', 'javelin'],
        shield: !0,
        appearance: {
          cloth1: '#3f5f9a',
          cloth2: '#e8dcc0',
          metal: 'acero',
          hair: 'raya',
          hairColor: '#d8b070',
        },
      },
      ranger: {
        armor: 'studded_leather',
        weapons: ['longbow', 'shortsword', 'shortsword'],
        shield: !1,
        appearance: { cloth1: '#3e6b3a', cloth2: '#6b5a3a' },
      },
      rogue: {
        armor: 'leather',
        weapons: ['shortsword', 'dagger', 'shortbow'],
        shield: !1,
        appearance: { cloth1: '#2e2a28', cloth2: '#4a3a30' },
      },
      sorcerer: {
        armor: '',
        weapons: ['dagger'],
        shield: !1,
        appearance: { cloth1: '#7a2e2a', cloth2: '#d8b070', hair: 'coleta', hairColor: '#9a3a1c' },
      },
      warlock: {
        armor: 'leather',
        weapons: ['dagger'],
        shield: !1,
        appearance: { cloth1: '#2a2438', cloth2: '#5a3f6b' },
      },
      wizard: {
        armor: '',
        weapons: ['quarterstaff', 'dagger'],
        shield: !1,
        appearance: { cloth1: '#2f4f8a', cloth2: '#c9a64a', beard: 'larga', hairColor: '#9a948c' },
      },
    }[cls] || { armor: '', weapons: [] },
    appearance = { body, ...preset.appearance };
  return (body === 'f' && delete appearance.beard, { class: cls, species, ...preset, appearance });
}
/** Armadura de reglas → categoría y aspecto visual. */
const ARMOR_LOOKS = {
  padded: { cat: 'light', look: 'acolchada' },
  leather: { cat: 'light', look: 'cuero' },
  studded_leather: { cat: 'light', look: 'tachonada' },
  hide: { cat: 'medium', look: 'pieles' },
  chain_shirt: { cat: 'medium', look: 'camisote' },
  scale_mail: { cat: 'medium', look: 'escamas' },
  breastplate: { cat: 'medium', look: 'coraza' },
  half_plate: { cat: 'medium', look: 'semiplacas' },
  ring_mail: { cat: 'heavy', look: 'anillas' },
  chain_mail: { cat: 'heavy', look: 'malla' },
  splint: { cat: 'heavy', look: 'bandas' },
  plate: { cat: 'heavy', look: 'placas' },
};
const RANGED_WEAPONS = new Set([
  'shortbow',
  'longbow',
  'light_crossbow',
  'heavy_crossbow',
  'hand_crossbow',
  'sling',
  'dart',
]);
const TWO_HANDED = new Set([
  'greatsword',
  'greataxe',
  'maul',
  'greatclub',
  'quarterstaff',
  'arcane_staff',
  'druid_staff',
]);
const POLEARMS = new Set(['spear', 'glaive', 'halberd', 'javelin']);
const LIGHT_WEAPONS = new Set([
  'dagger',
  'shortsword',
  'scimitar',
  'handaxe',
  'light_hammer',
  'sickle',
  'club',
]);
const ARCANE_CASTERS = new Set(['wizard', 'sorcerer', 'warlock']);

export { heroLook, sampleSheet, shade, weaponLoadout };
