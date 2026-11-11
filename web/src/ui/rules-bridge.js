// ui/rules-bridge.js
// Puente de reglas de la interfaz (ui.R): llama al núcleo (game.rules, es decir, mdg_call) y, si la
// operación no existe o no hay combate, usa el simulador JS de simulator.js. Cachea datos y fichas de
// objetos y ofrece la API de alto nivel (hojas, campaña, inventario, tiendas, pruebas). Lo crea ui/index.js.
// Reconstruido de publicado/juego.js (módulo __esm «Ww»).

import { createSimulator } from './simulator.js';

/**
 * Crea ui.R: call(op, args) con respaldo del simulador (si `mock`), apply(res) guarda la campaña que
 * devuelva una operación, data/item con caché y los métodos de la API (sheetNew, equip, buy…).
 */
function createRulesBridge(game, { mock = !0 } = {}) {
  let missing = new Set(),
    simulator = null,
    stats = { core: new Set(), mock: new Set() };
  function call(op, args = {}) {
    if (!missing.has(op) && typeof game.rules == 'function')
      try {
        let res = game.rules(op, args);
        if (!(res && res.error && MISSING_OP.test(String(res.error)))) return (stats.core.add(op), res);
        missing.add(op);
      } catch (err) {
        (console.warn(`[interfaz] ${op}:`, err), missing.add(op));
      }
    if (mock && ((simulator ??= createSimulator()), simulator[op])) {
      (stats.mock.has(op) ||
        console.info(`[interfaz] \xAB${op}\xBB con el simulador (el n\xFAcleo a\xFAn no la tiene)`),
        stats.mock.add(op));
      try {
        return simulator[op](structuredClone(args));
      } catch (err) {
        return (console.error(`[interfaz] simulador ${op}:`, err), { error: String(err.message || err) });
      }
    }
    return { error: `No disponible: ${op}` };
  }
  function apply(res) {
    return (res && res.cp && !res.error && game.store.set(res.cp), res);
  }
  let currentCp = () => game.store.cp,
    dataCache = new Map();
  function data(name) {
    if (!dataCache.has(name)) {
      let res = call('data', { name });
      dataCache.set(name, res && !res.error ? res : {});
    }
    return dataCache.get(name);
  }
  let itemCache = new Map();
  function item(id) {
    if (!id) return null;
    if (!itemCache.has(id)) {
      let res = call('item_info', { id });
      itemCache.set(id, res && !res.error ? res : { id, name: id, kind: 'gear', desc: '' });
    }
    return itemCache.get(id);
  }
  return {
    call,
    apply,
    data,
    item,
    stats,
    real: (op) => stats.core.has(op),
    sheetNew: (args = {}) => call('sheet_new', args),
    sheetSet: (sheet, set, extra = {}) =>
      call('sheet_set', { sheet, ...(Array.isArray(set) ? { sets: set } : { set }), ...extra }),
    sheetView: (sheet, extra = {}) => call('sheet_options', { sheet, ...extra }),
    sheetFinish: (sheet) => call('sheet_finish', { sheet }),
    sheetOptions: (sheet, level = 1) => call('sheet_options', { sheet, level }),
    sheetComplete: (sheet, level = 1) => call('sheet_complete', { sheet, level }),
    sheetValidate: (sheet, level = 1) => call('sheet_validate', { sheet, level }),
    sheetSummary: (sheet, level = 1, state) => call('sheet_summary', { sheet, level, state }),
    randomName: (species, pronoun) => call('random_name', { species, pronoun })?.name || '',
    levelChoices: (sheet, from, to) => call('level_choices', to ? { sheet, from, to } : { sheet, from }),
    cpNew: (hero, companions = ['brenna']) => call('cp_new', { hero, companions }),
    hire: (sheet) => apply(call('cp_hire', { cp: currentCp(), sheet })),
    partySummary: () => {
      let res = currentCp() ? call('party_summary', { cp: currentCp() }) : [];
      return Array.isArray(res) ? res : res?.party || [];
    },
    shortRest: (spend) => apply(call('cp_short_rest', { cp: currentCp(), spend })),
    longRest: () => apply(call('cp_long_rest', { cp: currentCp() })),
    levelUp: (level, choices) => apply(call('cp_level_up', { cp: currentCp(), level, choices })),
    gold: (delta) => apply(call('cp_gold', { cp: currentCp(), delta })),
    give: (itemId, n = 1, to, unid) => apply(call('cp_give', { cp: currentCp(), item: itemId, n, to, unid })),
    passHours: (hours) => apply(call('cp_pass_hours', { cp: currentCp(), hours })),
    inv: (who) => call('inv', { cp: currentCp(), who }),
    invPreview: (who, itemId, slot) => call('inv_preview', { cp: currentCp(), who, item: itemId, slot }),
    equip: (who, itemId, slot) => apply(call('inv_equip', { cp: currentCp(), who, item: itemId, slot })),
    unequip: (who, slot) => apply(call('inv_unequip', { cp: currentCp(), who, slot })),
    giveTo: (from, to, itemId, n = 1) =>
      apply(call('inv_give', { cp: currentCp(), from, to, item: itemId, n })),
    use: (who, itemId, target) => apply(call('inv_use', { cp: currentCp(), who, item: itemId, target })),
    drop: (who, itemId, n = 1) => apply(call('inv_drop', { cp: currentCp(), who, item: itemId, n })),
    shop: (merchant) => call('shop', { cp: currentCp(), merchant }),
    buy: (merchant, itemId, n = 1, who) =>
      apply(call('shop_buy', { cp: currentCp(), merchant, item: itemId, n, who })),
    sell: (merchant, who, itemId, n = 1) =>
      apply(call('shop_sell', { cp: currentCp(), merchant, who, item: itemId, n })),
    check: (args) => call('check', { cp: currentCp(), ...args }),
  };
}
const MISSING_OP = /op desconocida|unknown op|sin combate/i;

export { createRulesBridge };
