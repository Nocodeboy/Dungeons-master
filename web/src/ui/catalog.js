// ui/catalog.js
// Reconstruido de publicado/juego.js (módulo __esm «Vw»). Nombres locales aún minificados.

import reglasEspecies from '../datos/reglas/especies.json';
import reglasClases from '../datos/reglas/clases.json';
import reglasTrasfondos from '../datos/reglas/trasfondos.json';
import reglasDotes from '../datos/reglas/dotes.json';
import reglasConjuros from '../datos/reglas/conjuros.json';
import reglasArmas from '../datos/reglas/armas.json';
import reglasArmaduras from '../datos/reglas/armaduras.json';
import reglasObjetos from '../datos/reglas/objetos.json';
import reglasComerciantes from '../datos/reglas/comerciantes.json';
import reglasCompaneros from '../datos/reglas/companeros.json';
import reglasNombres from '../datos/reglas/nombres.json';
import reglasRasgos from '../datos/reglas/rasgos.json';

function $t(o) {
  if (!o) return null;
  if (reglasArmas[o]) {
    let e = reglasArmas[o];
    return {
      ...e,
      id: o,
      kind: 'weapon',
      slot: 'main',
      price: e.cost ?? 0,
      icon: e.kind === 'ranged' ? 'ranged' : 'sword',
    };
  }
  if (reglasArmaduras[o]) {
    let e = reglasArmaduras[o];
    return { ...e, id: o, kind: 'armor', slot: 'armor', price: e.cost ?? 0, icon: 'armor' };
  }
  if (reglasObjetos[o]) {
    let e = reglasObjetos[o],
      t = e.slot || '';
    return (
      (e.kind === 'weapon' || (e.base && reglasArmas[e.base])) && (t = 'main'),
      (e.kind === 'armor' || (e.base && reglasArmaduras[e.base])) && (t = 'armor'),
      t === 'shield' && (t = 'off'),
      e.kind === 'ammo' && (t = 'ammo'),
      { ...e, id: o, slot: t, price: e.value ?? 0 }
    );
  }
  return { id: o, name: o, kind: 'gear', price: 0 };
}
function Lw(o) {
  let e = $t(o),
    t = [];
  if (e.kind === 'weapon' || reglasArmas[e.base]) {
    let a = reglasArmas[e.base] || e;
    t.push(`${a.damage}${e.bonus ? ` + ${e.bonus}` : ''} ${Fw[a.type] || a.type}`);
    for (let n of a.props || [])
      t.push(
        {
          finesse: 'Sutil',
          light: 'Ligera',
          heavy: 'Pesada',
          two_handed: 'A dos manos',
          versatile: `Vers\xE1til (${a.versatile})`,
          thrown: 'Arrojadiza',
          ammunition: 'Munici\xF3n',
          loading: 'Recarga',
          reach: 'Alcance',
        }[n] || n,
      );
    a.mastery &&
      t.push(
        `Maestr\xEDa: ${{ cleave: 'Hendir', graze: 'Rozar', nick: 'Encadenar', push: 'Empujar', sap: 'Debilitar', slow: 'Ralentizar', topple: 'Derribar', vex: 'Hostigar' }[a.mastery]}`,
      );
  }
  if (e.kind === 'armor' || reglasArmaduras[e.base]) {
    let a = reglasArmaduras[e.base] || e;
    (t.push(`CA ${a.base}${a.dex_cap === 0 ? '' : a.dex_cap ? ' + Des (m\xE1x. 2)' : ' + Des'}`),
      a.str_req && t.push(`Fuerza ${a.str_req}`),
      a.stealth_dis && t.push('Desventaja en Sigilo'));
  }
  return (
    e.attune && t.push('Requiere sinton\xEDa'),
    {
      id: o,
      name: e.name || o,
      kind: e.kind,
      slot: e.slot || '',
      desc: e.desc || '',
      price: e.price || 0,
      weight: e.weight || 0,
      props: t,
      magic: (!!e.rarity && e.rarity !== 'common') || !!e.bonus,
      rarity: e.rarity || 'common',
      unidentified_name: e.unid_name || '',
      icon: e.icon || '',
    }
  );
}
function ac(o) {
  let e = o.base_abilities || o.abilities || reglasClases[o.class]?.std_array || {},
    t = {};
  for (let a of kf) t[a] = Number(e[a] ?? 10) + Number((o.bg_bonus || {})[a] || 0);
  return t;
}
function V6(o) {
  let t = (reglasTrasfondos[o.background] || {}).abilities || ['str', 'dex', 'con'],
    a = reglasClases[o.class]?.primary || [],
    n = [...t].sort(
      (s, i) =>
        (a.indexOf(i) >= 0 ? 1 : 0) - (a.indexOf(s) >= 0 ? 1 : 0) ||
        (reglasClases[o.class]?.std_array?.[i] || 0) - (reglasClases[o.class]?.std_array?.[s] || 0),
    );
  return { [n[0]]: 2, [n[1]]: 1 };
}
function $6() {
  return Object.keys(reglasDotes).filter((o) => reglasDotes[o].category === 'origin');
}
function Ow(o) {
  let e = [],
    t = reglasTrasfondos[o.background]?.feat;
  return (
    t && e.push(t),
    reglasEspecies[o.species]?.extra_origin_feat &&
      e.push(o.human_feat || (t === 'skilled' ? 'alert' : 'skilled')),
    e
  );
}
function W6(o, e) {
  let t = reglasClases[o.class] || {},
    a = reglasEspecies[o.species] || {},
    n = Number(t.skills?.choose || 2);
  return (
    a.keen_senses && n++,
    (n += Number(a.skill_choices || 0)),
    Ow(o).includes('skilled') && (n += 3),
    n + (o.class === 'bard' && e >= 3 ? 3 : 0)
  );
}
function Bw(o) {
  return [...(reglasTrasfondos[o.background]?.skills || []), ...(reglasEspecies[o.species]?.skills || [])];
}
function Rf(o, e) {
  return Number(Or(reglasClases[o.class]?.casting?.cantrips, e, 0));
}
function Cf(o, e) {
  return Number(Or(reglasClases[o.class]?.casting?.prepared, e, 0));
}
function X6(o, e) {
  let t = reglasClases[o]?.casting?.type;
  return t === 'full'
    ? e >= 3
      ? 2
      : 1
    : t === 'half'
      ? e >= 2
        ? 1
        : 0
      : t === 'pact'
        ? e >= 3
          ? 2
          : 1
        : 0;
}
function Y6(o, e) {
  let t = reglasClases[o]?.casting?.type;
  return t === 'full'
    ? [[2, 3, 4][e - 1] || 4, e >= 3 ? 2 : 0]
    : t === 'half'
      ? e >= 2
        ? [e === 2 ? 2 : 3]
        : []
      : t === 'pact'
        ? e >= 3
          ? [0, 2]
          : [e >= 2 ? 2 : 1]
        : [];
}
function ec(o) {
  let e = reglasConjuros[o] || {};
  return {
    id: o,
    name: e.name || o,
    level: e.level || 0,
    school: e.school || '',
    tags: e.tags || [],
    desc: e.desc || '',
    concentration: !!e.concentration,
    ritual: !!e.ritual,
    cast: e.cast || 'action',
    range: e.range || 0,
  };
}
function qw(o) {
  let e = o.prepared;
  return Array.isArray(e) ? e : e && typeof e == 'object' ? [...new Set(Object.values(e).flat())] : [];
}
function tu(o, e = 1) {
  let t = ga(o || {});
  ((t.class ??= 'fighter'),
    (t.species ??= 'human'),
    (t.background ??= j6[t.class] || 'soldier'),
    (t.ability_method ??= 'standard'),
    (t.base_abilities ??= ga(reglasClases[t.class]?.std_array || {})),
    (!t.bg_bonus || !Object.keys(t.bg_bonus).length) && (t.bg_bonus = V6(t)));
  let a = reglasEspecies[t.species] || {};
  (a.lineages && !a.lineages[t.lineage] && (t.lineage = Object.keys(a.lineages)[0]),
    a.ancestries && !a.ancestries[t.ancestry] && (t.ancestry = Object.keys(a.ancestries)[0]),
    a.lineage_ability && !t.lineage_ability && (t.lineage_ability = 'int'),
    (a.sizes || []).length > 1 && !t.size && (t.size = 'medium'),
    (t.feats = Ow(t)));
  let n = reglasClases[t.class] || {},
    s = Bw(t);
  if (t.skills) t.skills = [...new Set([...s, ...t.skills])];
  else {
    let c = [...(n.skills?.from || [])].filter((d) => !s.includes(d));
    ((t.skills = [...s, ...c.slice(0, Number(n.skills?.choose || 2))]),
      a.keen_senses && t.skills.push(a.keen_senses.find((d) => !t.skills.includes(d)) || 'perception'));
  }
  let i = Number(Or(n.expertise_count, e, 0));
  i && !t.expertise && (t.expertise = t.skills.slice(0, i));
  let r = Number(Or(n.mastery_count, e, 0));
  (r && !t.masteries && (t.masteries = (n.kits?.[0]?.weapons || []).slice(0, r)),
    n.fighting_style_level &&
      n.fighting_style_level <= e &&
      !t.fighting_style &&
      (t.fighting_style = 'defense'),
    n.orders &&
      !t[t.class === 'cleric' ? 'divine_order' : 'primal_order'] &&
      (t[t.class === 'cleric' ? 'divine_order' : 'primal_order'] = Object.keys(n.orders)[0]));
  let l = n.casting;
  if (l) {
    let c = l.recommended || {};
    (t.cantrips ||
      (t.cantrips = (c.cantrips || l.list.filter((d) => (reglasConjuros[d]?.level || 0) === 0)).slice(
        0,
        Rf(t, e),
      )),
      t.prepared ||
        (t.prepared = {
          1: (c[1] || l.list.filter((d) => reglasConjuros[d]?.level === 1)).slice(0, Cf(t, e)),
        }));
  }
  return (
    n.subclasses && e >= 3 && !t.subclass && (t.subclass = Object.keys(n.subclasses)[0]),
    t.kit || (t.kit = n.kits?.[0]?.id || ''),
    (t.name ??= ''),
    (t.pronoun ??= 'm'),
    t
  );
}
function au(o) {
  let e = reglasClases[o.class] || {};
  return (e.kits || []).find((t) => t.id === o.kit) || e.kits?.[0] || {};
}
function Pf(o, e) {
  let t = reglasClases[o.class] || {},
    a = Number(t.hit_die || 8),
    n = co(ac(o).con),
    s = a + n + (e - 1) * (Math.floor(a / 2) + 1 + n);
  return (o.species === 'dwarf' && (s += e), Math.max(1, s));
}
function Uw(o) {
  let e = ac(o),
    t = co(e.dex),
    a = [],
    n = o.weapons ? null : au(o),
    s = n ? n.armor : o.armor,
    i = s ? reglasArmaduras[$t(s).base || s] : null,
    r;
  if (i) {
    let l = i.dex_cap === 0 ? 0 : i.dex_cap ? Math.min(i.dex_cap, t) : t;
    ((r = i.base + l), a.push(`${i.name} ${i.base}`), l && a.push(`Destreza ${l >= 0 ? '+' : ''}${l}`));
  } else
    o.class === 'barbarian'
      ? ((r = 10 + t + co(e.con)), a.push('Defensa sin armadura'))
      : o.class === 'monk'
        ? ((r = 10 + t + co(e.wis)), a.push('Defensa sin armadura'))
        : ((r = 10 + t), a.push('Base 10', `Destreza ${t >= 0 ? '+' : ''}${t}`));
  if (n ? n.shield : o.shield) {
    let l = 2 + Number($t(o.shield_id || 'shield').bonus || 0);
    ((r += l), a.push(`Escudo +${l}`));
  }
  o.fighting_style === 'defense' && i && ((r += 1), a.push('Defensa +1'));
  for (let l of ['cloak', 'ring1', 'ring2', 'amulet', 'boots', 'gloves']) {
    let c = $t(o.worn?.[l])?.mods?.ac;
    c && ((r += c), a.push(`${$t(o.worn[l]).name} +${c}`));
  }
  return { ac: r, parts: a };
}
function K6(o, e) {
  let t = ac(o),
    a = [],
    n = [...(o.weapons || au(o).weapons || [])].slice(0, 3);
  n.length || n.push('unarmed');
  for (let s of n) {
    let i = $t(s),
      r = reglasArmas[i.base || s] || {
        name: 'Desarmado',
        damage: '1',
        type: 'bludgeoning',
        props: [],
        kind: 'melee',
      },
      l = r.kind === 'ranged',
      c = l || ((r.props || []).includes('finesse') && t.dex > t.str),
      d = co(c ? t.dex : t.str) + Number(i.bonus || 0),
      u = d + Db(e);
    a.push({
      key: s,
      name: i.name || r.name,
      to_hit: u,
      damage: `${r.damage}${d ? (d > 0 ? ` + ${d}` : ` \u2212 ${-d}`) : ''} ${Fw[r.type] || ''}`.trim(),
      mastery: (o.masteries || []).includes(i.base || s) ? r.mastery : '',
      range: l ? `${Math.round((r.range || 80) * 0.3)} m` : '1,5 m',
      ammo: l ? (o.ammo?.[i.base || s] ?? null) : null,
    });
  }
  return a;
}
function Hs(o, e = 1, t = null) {
  let a = tu(o, e);
  for (let v of ['weapons', 'armor', 'shield', 'shield_id', 'worn', 'pack', 'items', 'ammo'])
    o?.[v] !== void 0 && (a[v] = o[v]);
  let n = reglasClases[a.class] || {},
    s = reglasEspecies[a.species] || {},
    i = ac(a),
    r = Db(e),
    l = n.saves || [],
    c = Uw(a),
    d = Pf(a, e),
    u = Hw.map((v) => {
      let x = (a.skills || []).includes(v),
        g = (a.expertise || []).includes(v);
      return {
        id: v,
        name: Nw[v],
        ability: zw[v],
        mod: co(i[zw[v]]) + (x ? r : 0) + (g ? r : 0),
        prof: x,
        expert: g,
      };
    }),
    h = (v) => u.find((x) => x.id === v).mod,
    p = n.casting,
    m = [];
  for (let v = 1; v <= e; v++) for (let x of n.features?.[String(v)] || []) x !== 'subclass' && m.push(x);
  if (a.subclass)
    for (let v = 1; v <= e; v++)
      for (let x of n.subclasses?.[a.subclass]?.features?.[String(v)] || []) m.push(x);
  for (let v of s.traits || []) m.push(v);
  let _ = t || {},
    b = s.lineages?.[a.lineage],
    f = s.ancestries?.[a.ancestry];
  return {
    name: a.name || 'Sin nombre',
    species_name: s.name + (b ? ` (${b.name.toLowerCase()})` : f ? ` (${f.name.toLowerCase()})` : ''),
    class_name: n.name,
    subclass_name: n.subclasses?.[a.subclass]?.name || '',
    background_name: reglasTrasfondos[a.background]?.name || '',
    level: e,
    prof: r,
    abilities: Object.fromEntries(
      kf.map((v) => [
        v,
        { score: i[v], mod: co(i[v]), save: co(i[v]) + (l.includes(v) ? r : 0), save_prof: l.includes(v) },
      ]),
    ),
    ac: c.ac,
    ac_parts: c.parts,
    hp: _.hp ?? d,
    max_hp: d,
    temp_hp: _.temp_hp || 0,
    speed: Number(b?.speed || s.speed || 30),
    speed_text: `${String(Number(b?.speed || s.speed || 30) * 0.3).replace('.', ',')} m`,
    initiative: co(i.dex) + (a.feats.includes('alert') ? r : 0),
    passive: {
      perception: 10 + h('perception'),
      investigation: 10 + h('investigation'),
      insight: 10 + h('insight'),
    },
    darkvision: Number(b?.darkvision || s.darkvision || 0),
    skills: u,
    languages: [
      'Com\xFAn',
      ...(a.species === 'dwarf' ? ['Enano'] : a.species === 'elf' ? ['\xC9lfico'] : []),
    ],
    tools: [reglasTrasfondos[a.background]?.tool].filter(Boolean),
    attacks: K6(a, e),
    spells: p
      ? {
          ability: p.ability,
          dc: 8 + r + co(i[p.ability]),
          attack: r + co(i[p.ability]),
          slots: Y6(a.class, e)
            .map((v, x) => ({ level: x + 1, cur: _.slots?.[x] ?? v, max: v }))
            .filter((v) => v.max > 0),
          cantrips: (a.cantrips || []).map(ec),
          prepared: qw(a).map(ec),
        }
      : null,
    features: [...new Set(m)].map((v) => ({
      id: v,
      name: reglasRasgos[v]?.name || v,
      desc: reglasRasgos[v]?.desc || '',
      uses: v === 'second_wind' ? 2 : null,
      max: v === 'second_wind' ? 2 : null,
    })),
    feats: a.feats.map((v) => ({ id: v, name: reglasDotes[v]?.name || v, desc: reglasDotes[v]?.desc || '' })),
    resources: {},
    conditions: _.conditions || [],
    traits: s.traits || [],
    hit_dice: { cur: _.hit_dice ?? e, max: e, die: Number(n.hit_die || 8) },
    saves: Object.fromEntries(kf.map((v) => [v, co(i[v]) + (l.includes(v) ? r : 0)])),
    class: a.class,
    species: a.species,
    background: a.background,
    pronoun: a.pronoun,
  };
}
function Lb(o, e = 1) {
  let t = tu(o, e),
    a = reglasClases[t.class] || {},
    n = reglasEspecies[t.species] || {},
    s = [],
    i = ac(t),
    r = kf.reduce((y, w) => y + (U6[t.base_abilities?.[w]] ?? 99), 0);
  t.ability_method === 'point_buy' && r > 27 && s.push('Has gastado m\xE1s de 27 puntos.');
  let l = W6(t, e),
    c = Bw(t),
    d = (o.skills || t.skills).filter((y) => !c.includes(y));
  d.length < l && s.push(`Te faltan ${l - d.length} habilidades por elegir.`);
  let u = a.casting,
    h = t.feats.includes('magic_initiate'),
    p = u?.list || [],
    m = X6(t.class, e),
    _ = Rf(t, e),
    b = Cf(t, e);
  (u &&
    ((o.cantrips || t.cantrips).length < _ || qw(o.prepared ? o : t).length < b) &&
    s.push('Te quedan conjuros por elegir.'),
    String(o.name || '').trim() || s.push('Falta el nombre.'));
  let f = au(t),
    v = Number(Or(a.mastery_count, e, 0)),
    x = Number(Or(a.invocation_count, e, 0)),
    g = reglasTrasfondos[t.background]?.feat_list || 'wizard';
  return {
    final_abilities: i,
    point_buy_spent: r,
    point_buy_max: 27,
    standard_array: [15, 14, 13, 12, 10, 8],
    recommended_abilities: ga(a.std_array || {}),
    primary: a.primary || [],
    skill_slots: {
      count: l,
      from: a.skills?.from || Hw,
      any: Number(n.skill_choices || 0) + (t.feats.includes('skilled') ? 3 : 0),
      keen: n.keen_senses || [],
    },
    fixed_skills: c,
    expertise_count: Number(Or(a.expertise_count, e, 0)),
    expertise_from: a.expertise_from || t.skills,
    feats_needed: n.extra_origin_feat ? 1 : 0,
    origin_feats: $6().map((y) => ({ id: y, name: reglasDotes[y].name, desc: reglasDotes[y].desc })),
    feats: t.feats.map((y) => ({ id: y, name: reglasDotes[y]?.name || y, desc: reglasDotes[y]?.desc || '' })),
    fighting_styles:
      a.fighting_style_level && a.fighting_style_level <= e
        ? Object.keys(reglasDotes)
            .filter(
              (y) =>
                reglasDotes[y].category === 'fighting_style' &&
                (y !== 'blessed_warrior' || t.class === 'paladin') &&
                (y !== 'druidic_warrior' || t.class === 'ranger'),
            )
            .map((y) => ({ id: y, name: reglasDotes[y].name, desc: reglasDotes[y].desc }))
        : [],
    orders: a.orders
      ? {
          key: t.class === 'cleric' ? 'divine_order' : 'primal_order',
          label: reglasRasgos[t.class === 'cleric' ? 'divine_order' : 'primal_order']?.name || 'Orden',
          from: Object.entries(a.orders).map(([y, w]) => ({ id: y, name: w.name, desc: w.desc })),
        }
      : null,
    invocations: x
      ? {
          count: x,
          from: Object.entries(reglasRasgos.invocations || {})
            .filter(([, y]) => (y.level || 1) <= e)
            .map(([y, w]) => ({ id: y, name: w.name, desc: w.desc, requires: w.requires || '' })),
        }
      : null,
    masteries: v
      ? {
          count: v,
          from: Object.entries(reglasArmas)
            .filter(
              ([, y]) =>
                y.mastery &&
                (a.weapons || []).some(
                  (w) => w === y.cat || w === 'martial' || (w === 'simple' && y.cat === 'simple'),
                ),
            )
            .map(([y, w]) => ({
              id: y,
              name: w.name,
              mastery: w.mastery,
              desc: '',
              mine: (f.weapons || []).includes(y),
            })),
        }
      : null,
    cantrips: u
      ? {
          count: _,
          from: p.filter((y) => (reglasConjuros[y]?.level || 0) === 0).map(ec),
          recommended: u.recommended?.cantrips || [],
        }
      : null,
    spells: u
      ? {
          count: b,
          max_level: m,
          from: p
            .filter((y) => reglasConjuros[y] && reglasConjuros[y].level >= 1 && reglasConjuros[y].level <= m)
            .map(ec),
          always: [],
          recommended: [...(u.recommended?.['1'] || []), ...(e >= 2 ? u.recommended?.['2'] || [] : [])],
        }
      : null,
    magic_initiate: h
      ? {
          list: g,
          cantrips: {
            count: 2,
            from: Object.keys(reglasConjuros)
              .filter(
                (y) => reglasConjuros[y].level === 0 && (reglasClases[g]?.casting?.list || []).includes(y),
              )
              .map(ec),
          },
          spell: {
            count: 1,
            from: Object.keys(reglasConjuros)
              .filter(
                (y) => reglasConjuros[y].level === 1 && (reglasClases[g]?.casting?.list || []).includes(y),
              )
              .map(ec),
          },
        }
      : null,
    kits: (a.kits || []).map((y) => ({
      id: y.id,
      name: y.name,
      weapons: (y.weapons || []).map((w) => reglasArmas[w]?.name || w),
      armor: reglasArmaduras[y.armor]?.name || '',
      shield: !!y.shield,
      items: Object.entries(y.items || {}).map(
        ([w, k]) => `${reglasObjetos[w]?.name || w}${k > 1 ? ` \xD7${k}` : ''}`,
      ),
      ammo: Object.entries(y.ammo || {}).map(
        ([w, k]) =>
          `${k} ${reglasArmas[w]?.kind === 'ranged' ? 'proyectiles' : (reglasArmas[w]?.name || w).toLowerCase()}`,
      ),
      gold: y.gold || 0,
      gold_instead: Math.max(50, (y.gold || 0) + 60),
    })),
    kit: t.kit,
    bg_items: Object.entries(reglasTrasfondos[t.background]?.items || {}).map(
      ([y, w]) => `${reglasObjetos[y]?.name || y}${w > 1 ? ` \xD7${w}` : ''}`,
    ),
    bg_gold: reglasTrasfondos[t.background]?.gold || 0,
    bg_gold_instead: 50,
    hp: Pf(t, e),
    ac: Uw(t).ac,
    speed: Number(n.speed || 30),
    errors: s,
    sheet: t,
  };
}
function J6({ species: o = 'human', pronoun: e = 'm' } = {}) {
  let t = reglasNombres[o] || reglasNombres.human,
    a = (i) => i[Af(i.length) - 1],
    n = e === 'f' ? t.end_f : e === 'n' ? [...t.end_m, ...t.end_f] : t.end_m,
    s = a(t.start) + a(n);
  return { name: t.family ? `${s} ${a(t.family)}` : s };
}
function Wn(o) {
  if (o.weapons) return o;
  let e = au(o);
  ((o.weapons = [...(e.weapons || [])]),
    (o.armor = e.armor || ''),
    (o.shield = !!e.shield),
    (o.worn = {}),
    (o.pack = []),
    (o.items = { ...(e.items || {}) }),
    (o.ammo = {}));
  for (let [t, a] of Object.entries(e.ammo || {})) o.ammo[t] = a;
  for (let [t, a] of Object.entries(reglasTrasfondos[o.background]?.items || {}))
    o.items[t] = (o.items[t] || 0) + a;
  return ((o.items.potion_healing = (o.items.potion_healing || 0) + 1), o);
}
function tc(o, e = !1) {
  let t = $t(o);
  return {
    id: o,
    name: e ? t.unid_name || `${t.name} (sin identificar)` : t.name || o,
    kind: t.kind,
    icon: t.icon || '',
    rarity: e ? '' : t.rarity || '',
    magic: !!(t.rarity && t.rarity !== 'common') || !!t.bonus,
    unid: e,
  };
}
function az(o, e) {
  let t = Wn(o.members[e]),
    a = {},
    n = [],
    s = (l, c, d) => {
      ((a[l] = d ? { key: l, label: c, empty: !1, ...tc(d) } : { key: l, label: c, empty: !0, id: null }),
        n.push(l));
    };
  for (let l = 0; l < 4; l++) s(`weapon:${l}`, `Arma ${l + 1}`, t.weapons[l] || '');
  (s('armor', 'Armadura', t.armor), s('shield', 'Escudo', t.shield ? t.shield_id || 'shield' : ''));
  for (let [l, c] of [
    ['cloak', 'Capa'],
    ['ring1', 'Anillo'],
    ['ring2', 'Anillo'],
    ['amulet', 'Amuleto'],
    ['boots', 'Botas'],
    ['gloves', 'Guantes'],
  ])
    s(l, c, t.worn?.[l] || '');
  let i = [];
  t.pack.forEach((l, c) =>
    i.push({
      ...tc(l.id, !!l.unid),
      where: 'pack',
      idx: c,
      n: 1,
      slot: l.unid ? '' : zf(l.id),
      equippable: !l.unid && !!zf(l.id),
      value: Math.max(1, Math.floor(($t(l.id).price || 2) / 2)),
    }),
  );
  for (let [l, c] of Object.entries(t.items || {}))
    c > 0 &&
      i.push({
        ...tc(l),
        where: 'stack',
        n: c,
        label: `${$t(l).name}${c > 1 ? ` \xD7${c}` : ''}`,
        usable: $t(l).kind === 'potion' && !!$t(l).use?.heal,
        value: Math.max(1, Math.floor(($t(l).price || 2) / 2)),
      });
  let r = Hs(t, o.party_level, o.state[e]);
  return {
    who: e,
    name: t.name,
    short_name: String(t.name).split(' ')[0],
    slots: a,
    slot_order: n,
    weapons: t.weapons,
    bag: i,
    ammo: Object.entries(t.ammo || {}).map(([l, c]) => ({
      key: l,
      name: Q6[Z6[l] || l] || reglasArmas[l]?.name || l,
      n: c,
    })),
    attuned: { n: Object.values(t.worn || {}).filter((l) => $t(l)?.attune).length, max: 3 },
    gold: o.gold,
    stats: {
      ac: r.ac,
      hp: r.hp,
      max_hp: r.max_hp,
      speed: r.speed,
      speed_text: r.speed_text,
      attacks: r.attacks.map((l) => ({
        ...l,
        to_hit_text: (l.to_hit >= 0 ? '+' : '\u2212') + Math.abs(l.to_hit),
      })),
      abilities: Object.fromEntries(Object.entries(r.abilities).map(([l, c]) => [l, c.score])),
    },
    dead: !!o.state[e]?.dead,
  };
}
function Dw(o, e, t) {
  let a = o.pack[e];
  if (!a) return 'No existe ese objeto.';
  if (a.unid) return 'Primero ten\xE9is que identificarlo.';
  let n = zf(a.id);
  if (!n) return 'Eso no se puede equipar.';
  if ((o.pack.splice(e, 1), (o.worn ??= {}), n === 'weapon'))
    o.weapons.length >= 4
      ? (o.pack.push({ id: o.weapons[0] }), (o.weapons[0] = a.id))
      : o.weapons.unshift(a.id);
  else if (n === 'armor') (o.armor && o.pack.push({ id: o.armor }), (o.armor = a.id));
  else if (n === 'shield')
    (o.shield && o.pack.push({ id: o.shield_id || 'shield' }), (o.shield = !0), (o.shield_id = a.id));
  else {
    let s = n === 'ring' ? t || (o.worn.ring1 ? 'ring2' : 'ring1') : n;
    (o.worn[s] && o.pack.push({ id: o.worn[s] }), (o.worn[s] = a.id));
  }
  return '';
}
function nz(o, e) {
  if (e.startsWith('weapon:')) {
    let t = Number(e.split(':')[1]);
    return o.weapons[t]
      ? (o.pack.push({ id: o.weapons[t] }), o.weapons.splice(t, 1), '')
      : 'No hay nada ah\xED.';
  }
  return e === 'armor'
    ? o.armor
      ? (o.pack.push({ id: o.armor }), (o.armor = ''), '')
      : 'No hay nada ah\xED.'
    : e === 'shield'
      ? o.shield
        ? (o.pack.push({ id: o.shield_id || 'shield' }), (o.shield = !1), delete o.shield_id, '')
        : 'No hay nada ah\xED.'
      : o.worn?.[e]
        ? (o.pack.push({ id: o.worn[e] }), delete o.worn[e], '')
        : 'No hay nada ah\xED.';
}
function Iw(o, e, t = 1, a = !1) {
  if ((Wn(o), tz(e) && !a)) o.items[e] = (o.items[e] || 0) + t;
  else for (let n = 0; n < t; n++) o.pack.push(a ? { id: e, unid: !0 } : { id: e });
}
function Lf(o, e) {
  let t = Hs(o.members[e], o.party_level);
  return {
    hp: t.max_hp,
    temp_hp: 0,
    slots: (t.spells?.slots || []).map((a) => a.max),
    resources: {},
    free_casts: {},
    hit_dice: o.party_level,
    dead: !1,
    buffs: [],
  };
}
function oz({ hero: o, companions: e = [] }) {
  let t = Wn(tu(o, 1));
  ((t.id = 'hero'), (t.is_hero = !0));
  let a = {
    members: { hero: t },
    party: ['hero'],
    state: {},
    party_level: 1,
    gold: (au(t).gold || 0) + (reglasTrasfondos[t.background]?.gold || 0),
    location: { level: 'merrowick', spawn: 'arrival', name: 'Merrowick' },
    flags: {},
    journal: [],
    day: 1,
    playtime: 0,
    short_rests_left: 2,
    levels: {},
    merchants: Object.fromEntries(
      Object.keys(reglasComerciantes)
        .filter((n) => !n.startsWith('_'))
        .map((n) => [n, { stock: ga(reglasComerciantes[n].stock) }]),
    ),
  };
  for (let n of e) jw(a, n);
  for (let n of a.party) a.state[n] = Lf(a, n);
  return { cp: a };
}
function jw(o, e) {
  let t = reglasCompaneros[e];
  if (!t || o.party.length >= 4) return !1;
  let a = ga(t);
  return (
    (a.id = e),
    (a.base_abilities = a.abilities),
    delete a.abilities,
    (a.bg_bonus = { str: 0 }),
    (a.worn = {}),
    (a.pack = []),
    (a.items = { ...(a.items || {}) }),
    (o.members[e] = a),
    o.party.push(e),
    (o.state[e] = Lf(o, e)),
    !0
  );
}
function createSimulator() {
  return {
    data: ({ name: e }) => ga(q6[e] ?? {}),
    loc: () => ({}),
    sheet_options: ({ sheet: e, level: t = 1 }) => Lb(e, t),
    sheet_complete: ({ sheet: e, level: t = 1 }) => tu(e, t),
    sheet_validate: ({ sheet: e, level: t = 1 }) => {
      let a = Lb(e, t).errors;
      return { ok: !a.length, errors: a };
    },
    random_name: J6,
    sheet_summary: ({ sheet: e, level: t = 1, state: a }) => Hs(e, t, a),
    level_choices: ({ sheet: e, from: t = 1, to: a = 2 }) => {
      let n = tu(e, a),
        s = Lb(n, a),
        i = reglasClases[n.class] || {},
        r = [];
      for (let l of i.features?.[String(a)] || [])
        r.push(
          l === 'subclass'
            ? { id: 'subclass', name: i.subclass_label || 'Subclase', desc: 'Eliges tu especialidad.' }
            : { id: l, name: reglasRasgos[l]?.name || l, desc: reglasRasgos[l]?.desc || '' },
        );
      return {
        ...s,
        from: t,
        to: a,
        hp_gain: Pf(n, a) - Pf(n, t),
        hp_avg: Math.floor((i.hit_die || 8) / 2) + 1 + co(ac(n).con),
        hit_die: i.hit_die || 8,
        prof: Db(a),
        gained: r,
        subclasses:
          a === 3 && i.subclasses
            ? {
                label: i.subclass_label || 'Subclase',
                from: Object.entries(i.subclasses).map(([l, c]) => ({ id: l, name: c.name, desc: c.desc })),
              }
            : null,
        new_cantrips: Rf(n, a) - Rf(n, t),
        new_spells: Cf(n, a) - Cf(n, t),
        metamagic:
          n.class === 'sorcerer' && a === 2
            ? {
                count: 2,
                from: Object.entries(reglasRasgos.metamagic_options || {}).map(([l, c]) => ({
                  id: l,
                  name: c.name,
                  desc: c.desc,
                  cost: c.cost,
                })),
              }
            : null,
      };
    },
    cp_new: oz,
    cp_recruit: ({ cp: e, id: t }) => {
      e = ga(e);
      let a = jw(e, t);
      return { cp: e, ok: a, reason: a ? '' : 'El grupo est\xE1 completo.' };
    },
    cp_dismiss: ({ cp: e, id: t }) => ((e = ga(e)), (e.party = e.party.filter((a) => a !== t)), { cp: e }),
    cp_short_rest: ({ cp: e, spend: t = {} }) => {
      e = ga(e);
      let a = {};
      e.short_rests_left = Math.max(0, (e.short_rests_left ?? 2) - 1);
      for (let s of e.party) {
        let i = e.state[s],
          r = Hs(e.members[s], e.party_level, i),
          l = 0,
          c = [],
          d = Number(t[s] ?? 0);
        for (; d-- > 0 && i.hit_dice > 0;) {
          let u = Af(r.hit_dice.die);
          (c.push(u), (l += Math.max(1, u + r.abilities.con.mod)), i.hit_dice--);
        }
        ((i.hp = Math.min(r.max_hp, i.hp + l)),
          (a[s] = {
            healed: l,
            dice: c.length,
            rolls: c,
            die: r.hit_dice.die,
            con: r.abilities.con.mod,
            hp: i.hp,
            max_hp: r.max_hp,
          }));
      }
      let n = [];
      for (let s of e.party)
        for (let i of Wn(e.members[s]).pack) i.unid && (delete i.unid, n.push(Lw(i.id).name));
      return { cp: e, report: a, identified: n, text: n.length ? `Identific\xE1is: ${n.join(', ')}.` : '' };
    },
    cp_long_rest: ({ cp: e }) => {
      e = ga(e);
      for (let t of e.party) e.state[t] = Lf(e, t);
      return ((e.short_rests_left = 2), (e.day = (e.day || 1) + 1), { cp: e });
    },
    cp_level_up: ({ cp: e, level: t, choices: a = {} }) => {
      e = ga(e);
      let n = {};
      for (let s of e.party) {
        Object.assign(e.members[s], a[s] || {});
        let i = reglasClases[e.members[s].class] || {};
        n[s] = (i.features?.[String(t)] || []).map((r) => ({
          id: r,
          name: reglasRasgos[r]?.name || r,
          desc: reglasRasgos[r]?.desc || '',
        }));
      }
      e.party_level = t;
      for (let s of e.party) e.state[s] = Lf(e, s);
      return { cp: e, gained: n };
    },
    cp_gold: ({ cp: e, delta: t }) => (
      (e = ga(e)),
      e.gold + t < 0 ? { cp: e, ok: !1 } : ((e.gold += t), { cp: e, ok: !0 })
    ),
    cp_give: ({ cp: e, item: t, n: a = 1, unid: n, to: s }) => {
      e = ga(e);
      let i = s && e.party.includes(s) ? s : e.party[0];
      return (Iw(e.members[i], t, a, n), { cp: e, who: i, ok: !0 });
    },
    cp_heal: ({ cp: e, id: t, amount: a }) => {
      e = ga(e);
      let n = e.state[t],
        s = Hs(e.members[t], e.party_level).max_hp;
      return ((n.hp = Math.min(s, n.hp + a)), { cp: e, hp: n.hp, down: !1, dead: !1 });
    },
    cp_damage: ({ cp: e, id: t, amount: a }) => {
      e = ga(e);
      let n = e.state[t];
      return ((n.hp = Math.max(0, n.hp - a)), { cp: e, hp: n.hp, down: n.hp <= 0, dead: !1 });
    },
    cp_pass_hours: ({ cp: e, hours: t }) => (
      (e = ga(e)),
      (e.hour = ((e.hour ?? 18) + t) % 24),
      (e.hour ?? 18) < t && (e.day = (e.day || 1) + 1),
      { cp: e }
    ),
    party_summary: ({ cp: e }) =>
      e.party.map((t) => ({
        id: t,
        ...Hs(e.members[t], e.party_level, e.state[t]),
        dead: !!e.state[t]?.dead,
        is_hero: t === 'hero',
        title: reglasCompaneros[t]?.title || '',
      })),
    item_info: ({ id: e, unid: t }) => {
      let a = Lw(e);
      return {
        ...a,
        name: (t && a.unidentified_name) || a.name,
        real_name: a.name,
        lines: [
          a.desc,
          ...a.props.filter((n) => typeof n == 'string' && /CA|Fuerza|Sigilo|sintonía/.test(n)),
        ].filter(Boolean),
        sell: Math.max(1, Math.floor((a.price || 2) / 2)),
        rarity_name:
          { uncommon: 'Poco com\xFAn', rare: 'Raro', very_rare: 'Muy raro', legendary: 'Legendario' }[
            a.rarity
          ] || '',
        attune: !!$t(e).attune,
        props: a.props.filter((n) => !/^CA|Maestría|Fuerza|Sigilo|sintonía/.test(n)).slice(1),
      };
    },
    inv: ({ cp: e, who: t }) => az(ga(e), t || e.party[0]),
    inv_preview: ({ cp: e, who: t, item: a, slot: n }) => {
      let s = ga(e),
        i = Wn(s.members[t]),
        r = Hs(i, s.party_level, s.state[t]),
        l = Dw(i, typeof a == 'object' ? a.idx : a, n);
      if (l) return { ok: !1, reason: l, lines: [l], before: { ac: r.ac }, after: { ac: r.ac } };
      let c = Hs(i, s.party_level, s.state[t]),
        d = [];
      c.ac !== r.ac && d.push({ what: 'ac', from: r.ac, to: c.ac, better: c.ac > r.ac });
      let u = r.attacks[0],
        h = c.attacks[0];
      return (
        u &&
          h &&
          h.to_hit !== u.to_hit &&
          d.push({ what: 'attack', from: u.to_hit, to: h.to_hit, better: h.to_hit > u.to_hit }),
        {
          ok: !0,
          reason: '',
          before: { ac: r.ac, attacks: r.attacks },
          after: { ac: c.ac, attacks: c.attacks },
          lines:
            h && h.key !== u?.key
              ? [`Con ${h.name}: ${h.to_hit >= 0 ? '+' : '\u2212'}${Math.abs(h.to_hit)} \xB7 ${h.damage}`]
              : [],
          changes: d,
        }
      );
    },
    inv_equip: ({ cp: e, who: t, item: a, slot: n }) => {
      e = ga(e);
      let s = Wn(e.members[t]),
        i = $t(s.pack[typeof a == 'object' ? a.idx : a]?.id)?.name,
        r = Dw(s, typeof a == 'object' ? a.idx : a, n);
      return { cp: e, ok: !r, reason: r, text: r || `${String(s.name).split(' ')[0]} se equipa: ${i}.` };
    },
    inv_unequip: ({ cp: e, who: t, slot: a }) => {
      e = ga(e);
      let n = nz(Wn(e.members[t]), a);
      return { cp: e, ok: !n, reason: n, text: n || 'Guardado en la mochila.' };
    },
    inv_give: ({ cp: e, from: t, who: a, to: n, item: s, n: i }) => {
      ((e = ga(e)), (t = t || a));
      let r = Wn(e.members[t]),
        l = Wn(e.members[n]),
        c = '';
      if (typeof s == 'object') {
        let d = r.pack.splice(s.idx, 1)[0];
        if (!d) return { cp: e, ok: !1, reason: 'No lo lleva.' };
        (l.pack.push(d), (c = $t(d.id).name));
      } else {
        let d = Math.min(i ?? r.items[s] ?? 0, r.items[s] ?? 0);
        if (d <= 0) return { cp: e, ok: !1, reason: 'No lo lleva.' };
        ((r.items[s] -= d),
          r.items[s] || delete r.items[s],
          (l.items[s] = (l.items[s] || 0) + d),
          (c = `${$t(s).name}${d > 1 ? ` \xD7${d}` : ''}`));
      }
      return {
        cp: e,
        ok: !0,
        text: `${String(r.name).split(' ')[0]} da ${c} a ${String(l.name).split(' ')[0]}.`,
      };
    },
    inv_drop: ({ cp: e, who: t, item: a, n }) => {
      e = ga(e);
      let s = Wn(e.members[t]);
      return (
        typeof a == 'object'
          ? s.pack.splice(a.idx, 1)
          : ((s.items[a] = Math.max(0, (s.items[a] || 0) - (n || s.items[a]))),
            s.items[a] || delete s.items[a]),
        { cp: e, ok: !0, text: `${String(s.name).split(' ')[0]} lo deja.` }
      );
    },
    inv_use: ({ cp: e, who: t, item: a, target: n }) => {
      e = ga(e);
      let s = Wn(e.members[t]),
        i = $t(a);
      if (!i.use?.heal) return { cp: e, ok: !1, reason: 'Se usa en combate, desde el bot\xF3n Objetos.' };
      if (!(s.items[a] > 0)) return { cp: e, ok: !1, reason: 'No lo lleva.' };
      let r = n || t,
        l = e.state[r],
        c = Hs(e.members[r], e.party_level).max_hp;
      if (l.hp >= c) return { cp: e, ok: !1, reason: 'No le hace falta: est\xE1 ileso.' };
      (s.items[a]--, s.items[a] || delete s.items[a]);
      let d = G6(i.use.heal);
      return (
        (l.hp = Math.min(c, l.hp + d)),
        {
          cp: e,
          ok: !0,
          healed: d,
          hp: l.hp,
          max_hp: c,
          text: `${String(e.members[r].name).split(' ')[0]} recupera ${d} PG.`,
        }
      );
    },
    identify: ({ cp: e }) => {
      e = ga(e);
      let t = [];
      for (let a of e.party)
        for (let n of Wn(e.members[a]).pack) n.unid && (delete n.unid, t.push($t(n.id).name));
      return { cp: e, identified: t };
    },
    shop: ({ cp: e, merchant: t, who: a }) => {
      let n = reglasComerciantes[t] || {},
        s = e.merchants?.[t]?.stock || n.stock || {},
        i = Object.entries(s)
          .filter(([, c]) => c !== 0)
          .map(([c, d]) => {
            let u = Math.ceil(($t(c).price || 1) * (n.markup || 1));
            return {
              ...tc(c),
              n: d,
              unlimited: d < 0,
              price: u,
              can_afford: e.gold >= u,
              label: `${$t(c).name}${d < 0 ? '' : `  (${d})`}`,
              desc: $t(c).desc || '',
            };
          }),
        r = [],
        l = ga(e);
      for (let c of l.party) {
        if (a && c !== a) continue;
        let d = Wn(l.members[c]);
        d.pack.forEach(
          (u, h) =>
            (n.buys || []).includes($t(u.id).kind) &&
            r.push({
              ...tc(u.id, !!u.unid),
              who: c,
              where: 'pack',
              idx: h,
              n: 1,
              price: Math.max(1, Math.floor(($t(u.id).price || 1) / 2)),
            }),
        );
        for (let [u, h] of Object.entries(d.items || {}))
          h > 0 &&
            (n.buys || []).includes($t(u).kind) &&
            r.push({
              ...tc(u),
              who: c,
              where: 'stack',
              n: h,
              price: Math.max(1, Math.floor(($t(u).price || 1) / 2)),
              label: `${$t(u).name}${h > 1 ? ` \xD7${h}` : ''}`,
            });
      }
      return {
        id: t,
        name: n.name || t,
        npc: n.who || '',
        markup: n.markup || 1,
        buys_kinds: n.buys || [],
        stock: i,
        buys: r,
        gold: e.gold,
        who: a || '',
      };
    },
    shop_buy: ({ cp: e, merchant: t, item: a, n = 1, who: s }) => {
      e = ga(e);
      let i = reglasComerciantes[t] || {},
        r = Math.ceil(($t(a).price || 1) * (i.markup || 1)) * n;
      if (e.gold < r) return { cp: e, ok: !1, reason: 'No ten\xE9is oro suficiente.' };
      e.gold -= r;
      let l = e.merchants[t].stock;
      l[a] > 0 && (l[a] -= n);
      let c = s || e.party[0];
      return (
        Iw(e.members[c], a, n),
        { cp: e, ok: !0, who: c, text: `Comprado: ${$t(a).name}${n > 1 ? ` \xD7${n}` : ''} por ${r} po.` }
      );
    },
    shop_sell: ({ cp: e, merchant: t, who: a, item: n, n: s = 1 }) => {
      e = ga(e);
      let i = Wn(e.members[a]),
        r = n;
      if (typeof n == 'object') {
        let d = i.pack.splice(n.idx, 1)[0];
        if (!d) return { cp: e, ok: !1, reason: 'No lo lleva.' };
        ((r = d.id), (s = 1));
      } else {
        if (!(i.items[n] >= s)) return { cp: e, ok: !1, reason: 'No lo lleva.' };
        ((i.items[n] -= s), i.items[n] || delete i.items[n]);
      }
      let l = Math.max(1, Math.floor(($t(r).price || 1) / 2)) * s;
      e.gold += l;
      let c = e.merchants[t].stock;
      return (
        c[r] < 0 || (c[r] = (c[r] || 0) + s),
        {
          cp: e,
          ok: !0,
          price: l,
          gold: e.gold,
          text: `Vendido: ${$t(r).name}${s > 1 ? ` \xD7${s}` : ''} por ${l} po.`,
        }
      );
    },
    check: ({ cp: e, who: t = 'best', skill: a, ability: n, dc: s = 10 }) => {
      let i = t === 'best' ? e.party : [t],
        r = null;
      for (let d of i) {
        let u = Hs(e.members[d], e.party_level),
          h = a ? (u.skills.find((p) => p.id === a)?.mod ?? 0) : u.abilities[n || 'str'].mod;
        (!r || h > r.mod) && (r = { who: d, mod: h });
      }
      let l = Af(20),
        c = l + r.mod;
      return {
        who: r.who,
        label: a ? Nw[a] : n,
        d20: [l],
        mod: r.mod,
        total: c,
        dc: s,
        success: c >= s || l === 20,
        crit: l === 20,
        text: '',
      };
    },
  };
}
const q6 = {
  species: reglasEspecies,
  classes: reglasClases,
  backgrounds: reglasTrasfondos,
  feats: reglasDotes,
  spells: reglasConjuros,
  weapons: reglasArmas,
  armor: reglasArmaduras,
  items: reglasObjetos,
  merchants: reglasComerciantes,
  party: reglasCompaneros,
  names: reglasNombres,
  features: reglasRasgos,
};
const kf = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const Hw = [
  'acrobatics',
  'animal_handling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleight_of_hand',
  'stealth',
  'survival',
];
const zw = {
  acrobatics: 'dex',
  animal_handling: 'wis',
  arcana: 'int',
  athletics: 'str',
  deception: 'cha',
  history: 'int',
  insight: 'wis',
  intimidation: 'cha',
  investigation: 'int',
  medicine: 'wis',
  nature: 'int',
  perception: 'wis',
  performance: 'cha',
  persuasion: 'cha',
  religion: 'int',
  sleight_of_hand: 'dex',
  stealth: 'dex',
  survival: 'wis',
};
const Nw = {
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
const Fw = {
  bludgeoning: 'contundente',
  piercing: 'perforante',
  slashing: 'cortante',
  fire: 'fuego',
  cold: 'fr\xEDo',
  lightning: 'rayo',
  thunder: 'trueno',
  radiant: 'radiante',
  necrotic: 'necr\xF3tico',
  force: 'fuerza',
  poison: 'veneno',
  acid: '\xE1cido',
  psychic: 'ps\xEDquico',
};
const U6 = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const j6 = {
  barbarian: 'soldier',
  bard: 'minstrel',
  cleric: 'acolyte',
  druid: 'warden',
  fighter: 'soldier',
  monk: 'acolyte',
  paladin: 'noble',
  ranger: 'warden',
  rogue: 'criminal',
  sorcerer: 'sage',
  warlock: 'criminal',
  wizard: 'sage',
};
const ga = (o) => JSON.parse(JSON.stringify(o));
const co = (o) => Math.floor((Number(o) - 10) / 2);
const Or = (o, e, t = 0) => {
  if (!o) return t;
  let a = t;
  for (let n = 1; n <= e; n++) o[String(n)] != null && (a = o[String(n)]);
  return a;
};
const Db = (o) => 2 + Math.floor((Math.max(1, o) - 1) / 4);
let zb = 7;
const Af = (o) => ((zb = (zb * 1103515245 + 12345) & 2147483647), 1 + (zb % o));
const G6 = (o) => {
  let e = /^(\d*)d(\d+)([+-]\d+)?$/.exec(String(o).replace(/\s/g, ''));
  if (!e) return Number(o) || 0;
  let t = 0;
  for (let a = 0; a < Number(e[1] || 1); a++) t += Af(Number(e[2]));
  return t + Number(e[3] || 0);
};
const Z6 = {
  longbow: 'arrows',
  shortbow: 'arrows',
  light_crossbow: 'bolts',
  heavy_crossbow: 'bolts',
  sling: 'bullets',
};
const Q6 = {
  arrows: 'Flechas',
  bolts: 'Virotes',
  bullets: 'Balas',
  javelin: 'Jabalinas',
  dagger: 'Dagas',
  handaxe: 'Hachas de mano',
};
const ez = new Set(['potion', 'scroll', 'wand', 'ammo', 'gear', 'tool', 'treasure', 'key', 'quest']);
const zf = (o) => {
  let e = $t(o);
  return e.kind === 'weapon'
    ? 'weapon'
    : e.kind === 'armor'
      ? 'armor'
      : e.kind === 'shield' || String(o).startsWith('shield')
        ? 'shield'
        : ['cloak', 'amulet', 'boots', 'gloves', 'ring'].includes(e.slot)
          ? e.slot
          : '';
};
const tz = (o) => !zf(o) && ez.has($t(o).kind || 'gear');

export { createSimulator };
