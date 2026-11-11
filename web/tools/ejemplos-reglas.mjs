// Llama al núcleo de reglas publicado (publicado/rules/rules.mjs + rules.wasm) desde Node con una
// secuencia realista (creador -> campaña -> inventario/tienda -> pruebas -> mapa -> combate) y guarda
// petición y respuesta (recortada) de cada operación en tools/salida/ejemplos-reglas.json.
// Sirve para documentar el contrato JSON de mdg_call (web/MAPA.md) y para comparar con el núcleo
// reconstruido del área motor.
//
// Uso: node tools/ejemplos-reglas.mjs [ruta/a/rules/]
import fs from 'node:fs';

const RAIZ = new URL('..', import.meta.url).pathname;
const dir = process.argv[2] || RAIZ + '../publicado/rules/';
const mod = await import(dir + 'rules.mjs');
const t = await mod.default({ locateFile: (a) => dir + a });
const llamar = (op, args = {}) => {
  const s = t.stringToNewUTF8(JSON.stringify({ op, ...args }));
  try { return JSON.parse(t.UTF8ToString(t._mdg_call(s))); } finally { t._free(s); }
};
const recorte = (v, n = 600) => {
  const s = JSON.stringify(v);
  return s.length > n ? s.slice(0, n) + '…' : s;
};
const ejemplos = [];
const hacer = (op, args = {}, { mostrar = args } = {}) => {
  const r = llamar(op, args);
  ejemplos.push({ op, peticion: recorte({ op, ...mostrar }, 400), respuesta: recorte(r) });
  return r;
};
// Para no repetir hojas y campañas enteras en los ejemplos.
const ref = (nombre) => `<${nombre}>`;

hacer('data', { name: 'species' });
hacer('loc', { keys: ['ability.str'] });
hacer('random_name', { species: 'elf', pronoun: 'f', seed: 3 });
let { sheet } = hacer('sheet_new', {});
hacer('sheet_options', { sheet }, { mostrar: { sheet: ref('hoja') } });
({ sheet } = hacer('sheet_set', { sheet, set: { what: 'class', value: 'wizard' } }, { mostrar: { sheet: ref('hoja'), set: { what: 'class', value: 'wizard' } } }));
hacer('sheet_complete', { sheet, level: 1 }, { mostrar: { sheet: ref('hoja'), level: 1 } });
hacer('sheet_validate', { sheet }, { mostrar: { sheet: ref('hoja') } });
hacer('sheet_summary', { sheet, level: 1 }, { mostrar: { sheet: ref('hoja'), level: 1 } });
const fin = hacer('sheet_finish', { sheet }, { mostrar: { sheet: ref('hoja') } });
const heroe = fin.hero || fin.sheet || sheet;
let { cp } = hacer('cp_new', { hero: heroe, companions: ['brenna'], seed: 7 }, { mostrar: { hero: ref('héroe de sheet_finish'), companions: ['brenna'], seed: 7 } });
const C = { cp: ref('campaña') };
if (cp) {
  hacer('party_summary', { cp }, { mostrar: C });
  hacer('cp_load', { cp }, { mostrar: C });
  hacer('cp_recruit', { cp, id: 'pip' }, { mostrar: { ...C, id: 'pip' } });
  hacer('cp_gold', { cp, delta: 25 }, { mostrar: { ...C, delta: 25 } });
  hacer('cp_give', { cp, item: 'potion_healing', n: 1 }, { mostrar: { ...C, item: 'potion_healing', n: 1 } });
  hacer('has_item', { cp, item: 'potion_healing' }, { mostrar: { ...C, item: 'potion_healing' } });
  hacer('cp_take', { cp, item: 'potion_healing', n: 1 }, { mostrar: { ...C, item: 'potion_healing', n: 1 } });
  hacer('cp_damage', { cp, id: 'brenna', amount: 3, type: 'slashing' }, { mostrar: { ...C, id: 'brenna', amount: 3, type: 'slashing' } });
  hacer('cp_heal', { cp, id: 'brenna', amount: 2 }, { mostrar: { ...C, id: 'brenna', amount: 2 } });
  hacer('cp_short_rest', { cp, seed: 1 }, { mostrar: { ...C, seed: 1 } });
  hacer('cp_long_rest', { cp, seed: 1 }, { mostrar: { ...C, seed: 1 } });
  hacer('cp_pass_hours', { cp, hours: 2 }, { mostrar: { ...C, hours: 2 } });
  hacer('cp_cast', { cp, who: 'hero', spell: 'knock' }, { mostrar: { ...C, who: 'hero', spell: 'knock' } });
  hacer('item_info', { id: 'longsword', unid: false });
  hacer('inv', { cp, who: 'hero' }, { mostrar: { ...C, who: 'hero' } });
  hacer('inv_preview', { cp, who: 'brenna', item: 'longsword' }, { mostrar: { ...C, who: 'brenna', item: 'longsword' } });
  hacer('inv_equip', { cp, who: 'brenna', item: 'longsword' }, { mostrar: { ...C, who: 'brenna', item: 'longsword' } });
  hacer('inv_unequip', { cp, who: 'brenna', slot: 'main' }, { mostrar: { ...C, who: 'brenna', slot: 'main' } });
  hacer('inv_give', { cp, from: 'hero', to: 'brenna', item: 'potion_healing', n: 1 }, { mostrar: { ...C, from: 'hero', to: 'brenna', item: 'potion_healing', n: 1 } });
  hacer('inv_use', { cp, who: 'brenna', item: 'potion_healing' }, { mostrar: { ...C, who: 'brenna', item: 'potion_healing' } });
  hacer('inv_drop', { cp, who: 'hero', item: 'potion_healing', n: 1 }, { mostrar: { ...C, who: 'hero', item: 'potion_healing', n: 1 } });
  hacer('identify', { cp }, { mostrar: C });
  hacer('shop', { cp, merchant: 'smith' }, { mostrar: { ...C, merchant: 'smith' } });
  hacer('shop_buy', { cp, merchant: 'smith', item: 'shield', n: 1 }, { mostrar: { ...C, merchant: 'smith', item: 'shield', n: 1 } });
  hacer('shop_sell', { cp, merchant: 'smith', who: 'hero', item: 'shield', n: 1 }, { mostrar: { ...C, merchant: 'smith', who: 'hero', item: 'shield', n: 1 } });
  hacer('check', { cp, who: 'hero', skill: 'perception', dc: 12 }, { mostrar: { ...C, who: 'hero', skill: 'perception', dc: 12 } });
  hacer('group_check', { cp, skill: 'stealth', dc: 12 }, { mostrar: { ...C, skill: 'stealth', dc: 12 } });
  hacer('passive', { cp, skill: 'perception' }, { mostrar: { ...C, skill: 'perception' } });
  hacer('best', { cp, skill: 'athletics' }, { mostrar: { ...C, skill: 'athletics' } });
  hacer('level_choices', { sheet, from: 1, to: 2 }, { mostrar: { sheet: ref('hoja'), from: 1, to: 2 } });
  hacer('cp_level_up', { cp, level: 2 }, { mostrar: { ...C, level: 2 } });
}
hacer('monster_info', { id: 'goblin_minion' });

// Mapa de exploración y combate con el nivel de Merrowick y el grupo e1.
const nivel = JSON.parse(fs.readFileSync(RAIZ + 'src/datos/niveles/merrowick.json', 'utf8'));
hacer('xmap_load', { rows: nivel.rows }, { mostrar: { rows: [nivel.rows[0].slice(0, 20) + '…', '…'] } });
hacer('xmap_cell', { cell: [2, 17] });
hacer('xmap_walkable', { cells: [[2, 17], [0, 0]] });
hacer('xmap_path', { from: [2, 17], to: [20, 15] });
hacer('xmap_los', { from: [2, 17], to: [20, 15] });
hacer('xmap_reach', { from: [2, 17], max: 4 });
hacer('xmap_free', { near: [2, 17], n: 3 });
if (cp) {
  const g = nivel.groups.find((x) => x.id === 'e1');
  const party = [{ id: 'hero', cell: [20, 15], face: 90 }, { id: 'brenna', cell: [20, 16], face: 90 }, { id: 'pip', cell: [19, 15], face: 90 }];
  const enemies = g.enemies.map((e, i) => ({ id: `${e.id}_${i}`, monster: e.id, cell: e.cell, face: e.face, group: 'e1' }));
  const encounter = { id: 'e1', name: g.name, place: nivel.name, tips: [], ambient: nivel.ambient, level: 1, sunlight: false };
  const bs = hacer('battle_start', { cp, rows: nivel.rows, party, enemies, group: 'e1', encounter, surprised: [], seed: 42 },
    { mostrar: { ...C, rows: ['…'], party, enemies: enemies.slice(0, 2).concat(['…']), group: 'e1', encounter, surprised: [], seed: 42 } });
  hacer('state');
  hacer('options');
  hacer('threats', { path: [[20, 15], [21, 15]] });
  hacer('attack_plan', { target: enemies[0].id });
  hacer('simple_targets', { what: 'dodge' });
  hacer('feature', { name: 'second_wind' });
  hacer('ai_turn');
  hacer('end_turn');
  hacer('undo_move');
  hacer('battle_end', { cp: bs?.cp || cp, won: true }, { mostrar: { ...C, won: true } });
}
hacer('init', { encounter: 'e1_prado', seed: 1 });
hacer('op_inexistente');

fs.mkdirSync(RAIZ + 'tools/salida', { recursive: true });
fs.writeFileSync(RAIZ + 'tools/salida/ejemplos-reglas.json', JSON.stringify(ejemplos, null, 1));
console.log(ejemplos.map((e) => `${e.op}: ${e.respuesta.slice(0, 110)}`).join('\n'));
