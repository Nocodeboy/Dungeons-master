// rules.js
// Reconstruido de publicado/juego.js (parte sin envolver del final del bundle). Nombres locales aún minificados.

var rulesPromise = null;
function loadRules() {
  return (
    rulesPromise ||
    ((rulesPromise = (async () => {
      let o = new URL('rules/', document.baseURI).href,
        t = await (await import(`${o}rules.mjs`)).default({ locateFile: (a) => o + a });
      return (a, n = {}) => {
        let s = t.stringToNewUTF8(JSON.stringify({ op: a, ...n }));
        try {
          return JSON.parse(t.UTF8ToString(t._mdg_call(s)));
        } finally {
          t._free(s);
        }
      };
    })()),
    rulesPromise)
  );
}
function createApi(o) {
  let e = (a, n = {}) => {
      let s = o(a, n);
      return (s && s.error && console.warn(`[api] ${a}: ${s.error}`), s);
    },
    t = (a) => (a && typeof a == 'object' ? a : {});
  return {
    call: e,
    data: (a) => e('data', { name: a }),
    loc: (a) => e('loc', a ? { keys: a } : {}),
    monsterInfo: (a) => e('monster_info', { id: a }),
    sheetNew: (a) => e('sheet_new', t(a)),
    sheetSet: (a, n, s) =>
      e('sheet_set', { sheet: a, ...(Array.isArray(n) ? { sets: n } : { set: n }), ...t(s) }),
    sheetOptions: (a, n) => e('sheet_options', { sheet: a, ...t(n) }),
    sheetComplete: (a, n = 1) => e('sheet_complete', { sheet: a, level: n }),
    sheetValidate: (a, n) => e('sheet_validate', n ? { sheet: a, level: n } : { sheet: a }),
    sheetFinish: (a) => e('sheet_finish', { sheet: a }),
    randomName: (a, n = 'm', s) =>
      e('random_name', s == null ? { species: a, pronoun: n } : { species: a, pronoun: n, seed: s }),
    sheetSummary: (a, n, s) =>
      e('sheet_summary', s ? { sheet: a, level: n, state: s } : { sheet: a, level: n }),
    levelChoices: (a, n, s) => e('level_choices', { sheet: a, from: n, to: s }),
    cpNew: (a, n = ['brenna'], s) =>
      e('cp_new', s == null ? { hero: a, companions: n } : { hero: a, companions: n, seed: s }),
    cpRecruit: (a, n) => e('cp_recruit', { cp: a, id: n }),
    cpDismiss: (a, n) => e('cp_dismiss', { cp: a, id: n }),
    cpHire: (a, n) => e('cp_hire', { cp: a, sheet: n }),
    cpShortRest: (a, n, s) =>
      e('cp_short_rest', { cp: a, ...(n ? { spend: n } : {}), ...(s == null ? {} : { seed: s }) }),
    cpLongRest: (a, n) => e('cp_long_rest', n == null ? { cp: a } : { cp: a, seed: n }),
    cpLevelUp: (a, n, s) => e('cp_level_up', { cp: a, level: n, ...(s ? { choices: s } : {}) }),
    cpGold: (a, n) => e('cp_gold', { cp: a, delta: n }),
    cpGive: (a, n, s = 1, i) => e('cp_give', { cp: a, item: n, n: s, ...t(i) }),
    cpHeal: (a, n, s) => e('cp_heal', { cp: a, id: n, amount: s }),
    cpDamage: (a, n, s, i, r) =>
      e('cp_damage', { cp: a, id: n, amount: s, ...(i ? { type: i } : {}), ...t(r) }),
    cpPassHours: (a, n) => e('cp_pass_hours', { cp: a, hours: n }),
    cpRevive: (a, n) => e('cp_revive', { cp: a, id: n }),
    cpLoad: (a) => e('cp_load', { cp: a }),
    partySummary: (a) => e('party_summary', { cp: a }),
    itemInfo: (a, n = !1) => e('item_info', { id: a, unid: n }),
    inv: (a, n) => e('inv', { cp: a, who: n }),
    invPreview: (a, n, s, i) => e('inv_preview', { cp: a, who: n, item: s, ...(i ? { slot: i } : {}) }),
    invEquip: (a, n, s, i) => e('inv_equip', { cp: a, who: n, item: s, ...(i ? { slot: i } : {}) }),
    invUnequip: (a, n, s) => e('inv_unequip', { cp: a, who: n, slot: s }),
    invGive: (a, n, s, i, r = 1) => e('inv_give', { cp: a, from: n, to: s, item: i, n: r }),
    invUse: (a, n, s, i) => e('inv_use', { cp: a, who: n, item: s, ...(i ? { target: i } : {}) }),
    invDrop: (a, n, s, i = 1) => e('inv_drop', { cp: a, who: n, item: s, n: i }),
    identify: (a) => e('identify', { cp: a }),
    shop: (a, n, s) => e('shop', { cp: a, merchant: n, ...(s ? { who: s } : {}) }),
    shopBuy: (a, n, s, i = 1, r) =>
      e('shop_buy', { cp: a, merchant: n, item: s, n: i, ...(r ? { who: r } : {}) }),
    shopSell: (a, n, s, i, r = 1) => e('shop_sell', { cp: a, merchant: n, who: s, item: i, n: r }),
    check: (a, n, s) => e('check', { cp: a, who: n, ...t(s) }),
    groupCheck: (a, n, s, i) => e('group_check', { cp: a, skill: n, dc: s, ...t(i) }),
    passive: (a, n = 'perception') => e('passive', { cp: a, skill: n }),
    best: (a, n) => e('best', { cp: a, skill: n }),
    xmapLoad: (a) => e('xmap_load', { rows: a }),
    xmapPath: (a, n, s) => e('xmap_path', { from: a, to: n, ...t(s) }),
    xmapLos: (a, n) => e('xmap_los', { from: a, to: n }),
    xmapWalkable: (a) => e('xmap_walkable', { cells: a }),
    xmapReach: (a, n, s) => e('xmap_reach', { from: a, max: n, ...t(s) }),
    xmapFree: (a, n, s) => e('xmap_free', { near: a, n, ...t(s) }),
    xmapCell: (a) => e('xmap_cell', { cell: a }),
    battleStart: (a) => e('battle_start', a),
    battleEnd: (a, n, s) => e('battle_end', { cp: a, won: n, ...t(s) }),
    init: (a, n) => e('init', { encounter: a, seed: n }),
    state: () => e('state'),
    options: () => e('options'),
    threats: (a) => e('threats', { path: a }),
    move: (a, n = !1) => e('move', { path: a, dash: n }),
    undoMove: () => e('undo_move'),
    attackPlan: (a, n) => e('attack_plan', n ? { target: a, key: n } : { target: a }),
    attack: (a, n, s) => e('attack', { key: a, target: n, path: s }),
    offhand: (a, n) => e('offhand', { key: a, target: n }),
    spellBegin: (a, n) => e('spell_begin', { spell: a, slot: n }),
    spellPreview: (a) => e('spell_preview', a),
    cast: (a) => e('cast', a),
    simpleTargets: (a) => e('simple_targets', { what: a }),
    simple: (a, n) => e('simple', { what: a, target: n }),
    feature: (a) => e('feature', a),
    aiTurn: () => e('ai_turn'),
    endTurn: () => e('end_turn'),
  };
}

export { createApi, loadRules };
