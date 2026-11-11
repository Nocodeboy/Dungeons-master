// Escenarios del creador de personajes y de la subida de nivel: hoja nueva, cambios al azar entre
// las opciones que ofrece el oráculo (y algunos que no valen), vistas de cada paso, validación,
// hoja final, resumen y elecciones de nivel 2 y 3.
import { generador } from './jugador.mjs';

const CLASES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];

/** Cambios posibles según las vistas de las opciones (como los botones de la interfaz). */
function candidatos(o, rnd) {
  const v = o?.views || {};
  const out = [];
  const cards = (x) => (x?.cards || []).map((c) => c.id);
  const chips = (x) => (x?.chips || []).map((c) => c.id);
  if (v.class) out.push(...cards(v.class).map((id) => ({ what: 'class', value: id })));
  if (v.species) {
    out.push(...cards(v.species).map((id) => ({ what: 'species', value: id })));
    out.push(...cards(v.species.lineages).map((id) => ({ what: 'lineage', value: id })));
    out.push(...cards(v.species.ancestries).map((id) => ({ what: 'ancestry', value: id })));
    out.push(...chips(v.species.lineage_ability).map((id) => ({ what: 'lineage_ability', value: id })));
    out.push(...chips(v.species.sizes).map((id) => ({ what: 'size', value: id })));
    out.push(...cards(v.species.human_feat).map((id) => ({ what: 'human_feat', value: id })));
  }
  if (v.background) {
    out.push(...cards(v.background).map((id) => ({ what: 'background', value: id })));
    out.push({ what: 'bg_mode', value: rnd.pick(['2_1', '1_1_1']) });
    for (const a of v.background.bonus?.allowed || []) out.push({ what: 'bg_bonus', ability: a.id, amount: rnd.pick([1, 2]) });
  }
  if (v.abilities) {
    out.push({ what: 'method', value: rnd.pick(['standard', 'point_buy', 'roll']) }, { what: 'reroll' }, { what: 'recommended' });
    for (const r of v.abilities.rows || []) out.push({ what: 'adjust', ability: r.id, dir: rnd.pick([1, -1]) });
  }
  if (v.skills) {
    out.push(...(v.skills.cards || []).map((c) => ({ what: 'skill', value: c.id })));
    out.push(...chips(v.skills.expertise).map((id) => ({ what: 'expertise', value: id })));
  }
  for (const s of v.options?.sections || []) {
    if (!s.what) continue;
    out.push(...[...cards(s), ...chips(s)].map((id) => ({ what: s.what, value: id })));
  }
  if (v.spells) {
    out.push(...cards(v.spells.cantrips).map((id) => ({ what: 'cantrip', value: id })));
    for (const l of v.spells.prepared?.by_level || []) out.push(...cards(l).map((id) => ({ what: 'prepared', value: id })));
    const mi = v.spells.magic_initiate;
    if (mi) {
      out.push(...chips(mi).map((id) => ({ what: 'mi_list', value: id })));
      out.push(...(mi.lists || []).map((c) => ({ what: 'mi_list', value: c.id })));
      out.push(...(mi.abilities || []).map((c) => ({ what: 'mi_ability', value: c.id })));
      out.push(...cards(mi.cantrips).map((id) => ({ what: 'mi_cantrip', value: id })));
      out.push(...cards(mi.spell).map((id) => ({ what: 'mi_spell', value: id })));
    }
  }
  if (v.equipment) out.push(...(v.equipment.kits || []).map((k) => ({ what: 'kit', value: k.id })));
  if (v.look) {
    for (const b of v.look.bodies || []) out.push({ what: 'visual', key: 'model', value: b.id });
    for (const b of v.look.heads || []) out.push({ what: 'visual', key: 'head', value: b.id });
    for (const t of v.look.toggles || []) out.push({ what: 'visual_toggle', key: t.key });
    for (const k of ['skin', 'hair', 'cloth']) for (const c of v.look[k]?.colors || []) out.push({ what: 'visual', key: k, value: c.color });
    out.push({ what: 'random_look' });
  }
  if (v.identity) {
    out.push({ what: 'name', value: rnd.pick(['Aldra', 'Bo', '  ', 'Nombre muy largo que no cabe en la ficha', '']) }, { what: 'random_name' });
    out.push(...(v.identity.pronouns || []).map((p) => ({ what: 'pronoun', value: p.id })));
  }
  if (v.advance) {
    out.push(...chips(v.advance.new_skills).map((id) => ({ what: 'new_skill', value: id })));
    out.push(...cards(v.advance.land).map((id) => ({ what: 'land', value: id })));
    out.push(...cards(v.advance.hunters_prey).map((id) => ({ what: 'hunters_prey', value: id })));
  }
  return out;
}

const RAROS = [{ what: 'class', value: 'necromancer' }, { what: 'species', value: 'kobold' }, { what: 'zz', value: 1 }, {},
  { what: 'skill', value: 'arcana' }, { what: 'pronoun', value: 'x' }, { what: 'method', value: 'dados' }, { what: 'reroll' },
  { what: 'mastery', value: 'longbow' }, { what: 'cantrip', value: 'fire_bolt' }, { what: 'size', value: 'large' },
  { what: 'subclass', value: 'champion' }, { what: 'land', value: 'arctic' }, { what: 'hunters_prey', value: 'x' }];

function sesion(call, rnd, hoja, nivel, pasos, step0) {
  let sheet = hoja;
  let opts = call('sheet_options', { sheet, level: nivel });
  for (let i = 0; i < pasos; i++) {
    const cand = candidatos(opts, rnd);
    const steps = (opts?.steps || []).map((s) => s.id);
    const step = rnd() < 0.7 ? rnd.pick(steps) || step0 : undefined;
    let pet;
    if (rnd() < 0.08) pet = { sheet, set: rnd.pick(RAROS) };
    else if (rnd() < 0.15 && cand.length > 1) pet = { sheet, sets: [rnd.pick(cand), rnd.pick(cand)] };
    else pet = { sheet, set: rnd.pick(cand) || { what: 'random_name' } };
    if (step) pet.step = step;
    if (rnd() < 0.5) pet.seed = rnd.int(100000);
    const r = call('sheet_set', pet);
    if (r?.sheet) sheet = r.sheet;
    if (r?.options) opts = r.options.views && Object.keys(r.options.views).length > 1 ? r.options : call('sheet_options', { sheet, level: nivel });
    if (rnd() < 0.15) call('sheet_options', { sheet, step: rnd.pick(steps) });
    if (rnd() < 0.1) call('sheet_validate', { sheet, level: nivel });
  }
  return sheet;
}

export const escenarios = {
  basicos(call) {
    call('sheet_new');
    call('sheet_new', { seed: 1 });
    call('sheet_new', { class: 'wizard', species: 'elf', pronoun: 'f', seed: 2 });
    call('sheet_new', { class: 'zz', species: 'zz', seed: 3, name: 'Probo' });
    for (const s of [{}, { class: 'wizard' }, { class: 'rogue', species: 'halfling', name: 'Pim' }, 7, null]) {
      call('sheet_options', { sheet: s });
      call('sheet_options', { sheet: s, step: 'skills', level: 2 });
      call('sheet_complete', { sheet: s });
      call('sheet_complete', { sheet: s, level: 3 });
      call('sheet_validate', { sheet: s });
      call('sheet_finish', { sheet: s });
      call('sheet_summary', { sheet: s });
      call('sheet_set', { sheet: s, set: { what: 'name', value: 'X' } });
      call('level_choices', { sheet: s, from: 1 });
      call('levelup_begin', { sheet: s, level: 2 });
    }
    call('sheet_set', {});
    call('level_choices', { sheet: { class: 'fighter' }, from: 3 });
    call('levelup_begin', { sheet: { class: 'fighter' }, level: 4 });
  },
};

for (let i = 0; i < CLASES.length; i++) {
  const cls = CLASES[i];
  escenarios[`crear_${cls}`] = (call) => {
    const rnd = generador(3100 + i);
    const n = call('sheet_new', { seed: 50 + i });
    let sheet = call('sheet_set', { sheet: n.sheet, set: { what: 'class', value: cls }, seed: 7 }).sheet;
    sheet = sesion(call, rnd, sheet, 1, 90, 'class');
    call('sheet_validate', { sheet });
    call('sheet_complete', { sheet, level: 1 });
    const fin = call('sheet_finish', { sheet });
    call('sheet_summary', { sheet: fin.sheet, level: 1 });
    // Subida a nivel 2 y 3
    let hero = fin.sheet;
    for (const lv of [2, 3]) {
      const lc = call('level_choices', rnd() < 0.5 ? { sheet: hero, from: lv - 1 } : { sheet: hero, from: lv - 1, to: 3 });
      if (!lc?.sheet) break;
      let s = sesion(call, rnd, lc.sheet, lv, 25, 'advance');
      call('sheet_validate', { sheet: s, level: lv });
      const f = call('sheet_finish', { sheet: s });
      hero = { ...f.sheet, choices_level: lv };
      call('sheet_summary', { sheet: hero, level: lv });
      call('levelup_begin', { sheet: hero, level: lv });
    }
  };
}
