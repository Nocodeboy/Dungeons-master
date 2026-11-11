// actors/look.js
// Reconstruido de publicado/juego.js (módulo __esm «cu»). Nombres locales aún minificados.

import { completeAppearance, DRAGON_COLORS, METALS, lu } from './appearance.js';

function Pz(o, e, t) {
  let a = { face: e.face || 0 },
    n = {},
    s = {},
    i = { largas: 0.075, puntiagudas: 0.045, cortas: 0.022 };
  if (o === 'elf' || o === 'half_elf' || o === 'gnome') {
    let r = i[e.ears] ?? (o === 'elf' ? 0.075 : 0.04);
    a.ears = { len: o === 'half_elf' ? r * 0.7 : r, dir: [0.45, 0.85, -0.6] };
  }
  if (
    (o === 'gnome' && (a.nose = { len: 0.012, wide: 0.18, drop: 0.004 }),
    o === 'dwarf' &&
      ((a.nose = { len: 0.008, wide: 0.14, drop: 0.003 }), (a.jaw = { wide: 0.05, brow: 0.006 })),
    o === 'halfling' && (a.nose = { len: 0.003, wide: 0.06 }),
    o === 'orc' || o === 'half_orc')
  ) {
    let r = o === 'orc' ? 1 : 0.55;
    ((a.jaw = { wide: 0.11 * r, fwd: 0.014 * r, brow: 0.013 * r }),
      (a.nose = { len: -0.004 * r, wide: 0.22 * r }),
      (a.ears = { len: 0.022 * r, dir: [0.6, 0.6, -0.5] }),
      e.tusks && e.tusks !== 'ninguno' && (n.tusks = e.tusks));
  }
  if (o === 'goliath') {
    a.jaw = { wide: 0.06, brow: 0.01 };
    let r = { lineas: 2, manchas: 3, runas: 4 }[e.marks];
    r && Object.assign(s, { pattern: r, patternColor: e.marksColor || '#4a4a52' });
  }
  return (
    o === 'tiefling' &&
      (e.horns && e.horns !== 'ninguno' && (n.horns = { kind: e.horns, color: e.hornColor || '#2a2020' }),
      e.tail !== !1 && (n.tail = { color: shade(e.skin, 0.9), tip: !0 }),
      (a.jaw = { brow: 0.004 })),
    o === 'dragonborn' &&
      ((a.snout = 0.068),
      e.horns &&
        e.horns !== 'ninguno' &&
        (n.horns = { kind: e.horns, color: e.hornColor || '#e8dcc0', scale: 1.1 }),
      e.frill && e.frill !== 'ninguna' && (n.frill = { kind: e.frill, color: shade(e.skin, 0.75) }),
      Object.assign(s, { pattern: 1, patternColor: shade(e.skin, 0.5) })),
    { head: a, extras: n, fx: s }
  );
}
function shade(o, e) {
  let t = parseInt(String(o || '#888888').slice(1), 16);
  return (
    '#' +
    [(t >> 16) & 255, (t >> 8) & 255, t & 255]
      .map((n) => Math.max(0, Math.min(255, Math.round(n * e))))
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
  );
}
function weaponLoadout(o, { prefer: e } = {}) {
  let t = o.class || '',
    a = (o.weapons || []).filter((d) => d && d !== 'unarmed');
  (Gf.has(t) || t === 'druid') &&
    (a = a.map((d) => (d === 'quarterstaff' ? (t === 'druid' ? 'druid_staff' : 'arcane_staff') : d)));
  let n = a.filter((d) => !lv.has(d) && d !== 'javelin'),
    s = a.filter((d) => lv.has(d) && d !== 'dart'),
    i = !!o.shield,
    r = { main: null, off: null, shield: null, back: [], sheath: null, style: '1h', grips: [] },
    l =
      t === 'cleric' || t === 'paladin'
        ? t === 'cleric'
          ? 'sol'
          : 'cometa'
        : o.armor && tT[o.armor]?.cat === 'heavy'
          ? 'cometa'
          : 'redondo';
  if (
    (e === 'ranged' ||
      (e !== 'melee' && s.length && (!n.length || ((t === 'ranger' || t === 'rogue') && lv.has(a[0]))))) &&
    s.length
  ) {
    let d = s[0];
    (d.endsWith('bow') && !d.includes('crossbow')
      ? ((r.off = d), r.grips.push('l'), (r.style = 'bow'))
      : ((r.main = d), r.grips.push('r'), (r.style = 'crossbow')),
      n[0] && (r.sheath = n[0]),
      i && r.back.push(`escudo:${l}`));
  } else {
    let d = n[0];
    if (
      (d &&
        ((r.main = d),
        r.grips.push('r'),
        jf.has(d)
          ? ((r.style =
              (d.endsWith('staff') || d === 'quarterstaff') && (Gf.has(t) || t === 'druid') ? 'staff' : '2h'),
            r.grips.push('l'))
          : Q2.has(d) && ((r.style = 'polearm'), r.grips.push('l'))),
      i && !jf.has(d) && !Q2.has(d)
        ? ((r.shield = l), (r.style = d ? 'shield' : r.style))
        : d &&
          eT.has(d) &&
          n[1] &&
          eT.has(n[1]) &&
          !jf.has(d) &&
          ((r.off = n[1]), r.grips.push('l'), (r.style = 'dual')),
      s[0])
    ) {
      let u = s[0];
      u.endsWith('bow') && !u.includes('crossbow')
        ? r.back.push(`arma:${u}`)
        : u !== 'sling' && r.back.push(`arma:${u}`);
    }
    (!d &&
      !s.length &&
      (Gf.has(t) ? ((r.main = 'wand'), r.grips.push('r'), (r.style = 'caster')) : (r.style = 'unarmed')),
      Gf.has(t) && d && !jf.has(d) && (r.style = 'caster'));
  }
  return (s.some((d) => d.endsWith('bow') && !d.includes('crossbow')) && r.back.unshift('carcaj'), r);
}
function zz(o, e, t) {
  let a = o.class || 'fighter',
    n = tT[o.armor] || null,
    s = { torso: 'ex', brazos: 'ex', piernas: 'ex', pies: 'ex', cintos: !0 },
    i = { main: t.main, off: t.off, shield: t.shield, back: t.back.slice(), sheath: t.sheath },
    r = 0,
    l = n?.look;
  switch (
    ((l === 'malla' || l === 'anillas' || l === 'camisote') && (r = 1),
    l === 'escamas' && (r = 2),
    (l === 'semiplacas' || l === 'bandas' || l === 'placas') &&
      ((r = 1),
      (i.breastplate = 'placas'),
      (i.pauldrons = l === 'semiplacas' ? !0 : 'grandes'),
      (i.greaves = !0),
      l !== 'semiplacas' && (i.bracers = !0)),
    l === 'coraza' && (i.breastplate = 'coraza'),
    n && (n.cat === 'medium' || n.cat === 'heavy') && l !== 'pieles' && (s.hombrera = !i.pauldrons),
    l === 'pieles' && (i.mantle = 'pieles'),
    n && n.cat !== 'light' && (s.brazales = !i.bracers),
    l === 'acolchada' && (s.torso = 'ca'),
    a)
  ) {
    case 'barbarian':
      n || ((s.torso = 'piel'), (s.brazos = 'piel'), (i.mantle = 'pieles'), (i.bracers = 'cuero'));
      break;
    case 'bard':
      ((s.torso = 'ca'), (s.brazos = 'ca'), (i.cape = 'corta'), (i.hat = 'chambergo'), i.back.push('laud'));
      break;
    case 'cleric':
      ((i.tabard = 'larga'), (i.emblem = !0), n || ((s.torso = 'ca'), (s.brazos = 'ca'), (i.robe = 'larga')));
      break;
    case 'druid':
      ((s.torso = 'ca'), (s.brazos = 'ca'), (i.mantle = 'hojas'), (i.hat = 'astas'));
      break;
    case 'fighter':
      break;
    case 'monk':
      ((s.torso = 'ca'),
        (s.brazos = 'ca'),
        (s.piernas = 'ca'),
        (s.pies = 'ca'),
        (s.cintos = !1),
        (i.sash = e.cloth2));
      break;
    case 'paladin':
      ((i.tabard = 'larga'), (i.emblem = !0), (i.cape = 'larga'));
      break;
    case 'ranger':
      ((s.capucha = !0), (s.hombrera = !0));
      break;
    case 'rogue':
      ((s.capucha = !0), (i.pouch = !0));
      break;
    case 'sorcerer':
      ((s.torso = 'ca'), (s.brazos = 'ca'), (i.robe = 'corta'), (i.hat = 'diadema'));
      break;
    case 'warlock':
      ((s.torso = 'ca'), (s.brazos = 'ca'), (s.capucha = !0), (i.robe = 'larga'), (i.book = !0));
      break;
    case 'wizard':
      ((s.torso = 'ca'),
        (s.brazos = 'ca'),
        (i.robe = 'larga'),
        (i.hat = 'mago'),
        (i.book = !0),
        (i.pouch = !0));
      break;
    default:
      break;
  }
  return (
    i.robe && (s.cintos = !1),
    e.helmet &&
      (n?.cat === 'heavy' || n?.cat === 'medium') &&
      (i.helmet = e.helmet === !0 ? 'casco' : e.helmet),
    (e.hood === !1 || e.hood === 'no') && (s.capucha = !1),
    (e.hood === !0 || e.hood === 'si') && (s.capucha = !0),
    { outfit: s, gear: i, mail: r }
  );
}
function heroLook(o, e = {}) {
  let t = lu[o.species] ? o.species : 'human',
    a = { lineage: o.lineage, ancestry: o.ancestry, pronoun: o.pronoun },
    n = completeAppearance(o.appearance || Lz(o), t, a);
  t === 'dragonborn' && !o.appearance?.skin && o.ancestry && (n.skin = DRAGON_COLORS[o.ancestry] || n.skin);
  let s = { ...lu[t] };
  o.size === 'small' && (s.scale ?? 1) > 0.7 && ((s.scale = 0.64), (s.head = (s.head ?? 1) * 1.12));
  let i =
      { delgada: { width: 0.94, thick: 0.92 }, media: {}, robusta: { width: 1.07, thick: 1.1 } }[n.build] ||
      {},
    r = { ...s, width: (s.width ?? 1) * (i.width ?? 1), thick: i.thick ?? 1, height: n.height ?? 1 },
    { head: l, extras: c, fx: d } = Pz(t, n, a),
    u = weaponLoadout(o, e),
    { outfit: h, gear: p, mail: m } = zz(o, n, u),
    _ = METALS[n.metal]?.color || n.metal || METALS.acero.color;
  return {
    id: o.id || o.name || '',
    kind: 'hero',
    species: t,
    body: n.body,
    hair: t === 'dragonborn' ? 'calvo' : n.hair,
    beard: t === 'dragonborn' ? 'ninguna' : n.beard,
    brows: t !== 'dragonborn',
    colors: { skin: n.skin, hair: n.hairColor, eyes: n.eyes, cloth1: n.cloth1, cloth2: n.cloth2 },
    metalColor: _,
    skinFx: d,
    mail: m,
    glowEyes: t === 'tiefling' ? 0.35 : t === 'dragonborn' ? 0.15 : 0,
    prop: r,
    head: l,
    extras: c,
    outfit: h,
    gear: p,
    style: u.style,
    grips: u.grips,
    appearance: n,
  };
}
function Lz(o) {
  let e = o.visual || {},
    t = {};
  return (
    e.skin && (t.skin = e.skin),
    e.hair && (t.hairColor = e.hair),
    e.cloth && (t.cloth1 = e.cloth),
    o.pronoun === 'f' && (t.body = 'f'),
    t
  );
}
function sampleSheet(o, e = 'm', t = 'human') {
  let a = {
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
    }[o] || { armor: '', weapons: [] },
    n = { body: e, ...a.appearance };
  return (e === 'f' && delete n.beard, { class: o, species: t, ...a, appearance: n });
}
const tT = {
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
const lv = new Set([
  'shortbow',
  'longbow',
  'light_crossbow',
  'heavy_crossbow',
  'hand_crossbow',
  'sling',
  'dart',
]);
const jf = new Set([
  'greatsword',
  'greataxe',
  'maul',
  'greatclub',
  'quarterstaff',
  'arcane_staff',
  'druid_staff',
]);
const Q2 = new Set(['spear', 'glaive', 'halberd', 'javelin']);
const eT = new Set(['dagger', 'shortsword', 'scimitar', 'handaxe', 'light_hammer', 'sickle', 'club']);
const Gf = new Set(['wizard', 'sorcerer', 'warlock']);

export { heroLook, sampleSheet, shade, weaponLoadout };
