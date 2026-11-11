// rules.js — Puente con el núcleo de reglas 5e en C++ compilado a WebAssembly.
// Contrato único: `mdg_call(json) → json`, con la petición `{op, ...args}` y la respuesta en JSON
// (`{error: '…'}` si la operación falla o no existe). `game.rules` es la función de `loadRules` y
// `game.api = createApi(game.rules)` añade un método por operación. La interfaz tiene su propio
// envoltorio con simulador (ui/rules-mock.js). Ejemplos reales de cada operación en web/MAPA.md.

/** Promesa única de la función de llamada al núcleo (se carga una sola vez). */
var rulesPromise = null;
/**
 * Carga `rules/rules.mjs` + `rules.wasm` (Emscripten) junto a la página y devuelve
 * `call(op, args) → objeto`, que serializa `{op, ...args}`, llama a `_mdg_call` y decodifica la respuesta.
 */
function loadRules() {
  return (
    rulesPromise ||
    ((rulesPromise = (async () => {
      let base = new URL('rules/', document.baseURI).href,
        wasm = await (await import(`${base}rules.mjs`)).default({ locateFile: (file) => base + file });
      return (op, args = {}) => {
        let jsonPtr = wasm.stringToNewUTF8(JSON.stringify({ op, ...args }));
        try {
          return JSON.parse(wasm.UTF8ToString(wasm._mdg_call(jsonPtr)));
        } finally {
          wasm._free(jsonPtr);
        }
      };
    })()),
    rulesPromise)
  );
}
/**
 * API con un método por operación del núcleo sobre la función de `loadRules`.
 * Las operaciones de combate (move, attack, cast, simple, feature, ai_turn, end_turn, undo_move)
 * devuelven `{events: [...]}`, que combat/controller.js convierte en animaciones y efectos.
 */
function createApi(rules) {
  let call = (op, args = {}) => {
      let res = rules(op, args);
      return (res && res.error && console.warn(`[api] ${op}: ${res.error}`), res);
    },
    asObject = (value) => (value && typeof value == 'object' ? value : {});
  return {
    /** `call(op, args)`: llamada genérica; avisa por consola si la respuesta trae `error`. */
    call,
    /** `data`: tabla de datos del núcleo por nombre («species», «classes»…). */
    data: (name) => call('data', { name }),
    /** `loc`: textos localizados por clave (todos si no se dan claves). */
    loc: (keys) => call('loc', keys ? { keys } : {}),
    /** `monster_info`: ficha de un monstruo (tamaño, tipo, VD, PX, CA, PG…). */
    monsterInfo: (id) => call('monster_info', { id }),
    /** `sheet_new`: hoja de personaje nueva con los valores por defecto. */
    sheetNew: (opts) => call('sheet_new', asObject(opts)),
    /** `sheet_set`: aplica un cambio `{what, value}` (o una lista, `sets`) y devuelve `{sheet}`. */
    sheetSet: (sheet, set, opts) =>
      call('sheet_set', { sheet, ...(Array.isArray(set) ? { sets: set } : { set }), ...asObject(opts) }),
    /** `sheet_options`: pasos y opciones del creador para la hoja (modo, nivel, pasos, kit). */
    sheetOptions: (sheet, opts) => call('sheet_options', { sheet, ...asObject(opts) }),
    /** `sheet_complete`: completa la hoja hasta `level` con elecciones por defecto. */
    sheetComplete: (sheet, level = 1) => call('sheet_complete', { sheet, level }),
    /** `sheet_validate`: `{ok, errors}` de la hoja (opcionalmente a un nivel). */
    sheetValidate: (sheet, level) => call('sheet_validate', level ? { sheet, level } : { sheet }),
    /** `sheet_finish`: cierra la creación y devuelve la hoja definitiva del héroe. */
    sheetFinish: (sheet) => call('sheet_finish', { sheet }),
    /** `random_name`: nombre aleatorio para una especie y un pronombre (semilla opcional). */
    randomName: (species, pronoun = 'm', seed) =>
      call('random_name', seed == null ? { species, pronoun } : { species, pronoun, seed }),
    /** `sheet_summary`: resumen legible de la hoja (nombre, especie, clase…), con estado opcional. */
    sheetSummary: (sheet, level, state) =>
      call('sheet_summary', state ? { sheet, level, state } : { sheet, level }),
    /** `level_choices`: elecciones pendientes para subir la hoja del nivel `from` a `to`. */
    levelChoices: (sheet, from, to) => call('level_choices', { sheet, from, to }),
    /** `cp_new`: campaña nueva con el héroe y los compañeros iniciales; devuelve `{cp}`. */
    cpNew: (hero, companions = ['brenna'], seed) =>
      call('cp_new', seed == null ? { hero, companions } : { hero, companions, seed }),
    /** `cp_recruit`: une un compañero al grupo. */
    cpRecruit: (cp, id) => call('cp_recruit', { cp, id }),
    /** `cp_dismiss`: despide a un miembro del grupo. */
    cpDismiss: (cp, id) => call('cp_dismiss', { cp, id }),
    /** `cp_hire`: contrata un mercenario a partir de su hoja. */
    cpHire: (cp, sheet) => call('cp_hire', { cp, sheet }),
    /** `cp_short_rest`: descanso corto (`spend`: dados de golpe que gasta cada miembro). */
    cpShortRest: (cp, spend, seed) =>
      call('cp_short_rest', { cp, ...(spend ? { spend } : {}), ...(seed == null ? {} : { seed }) }),
    /** `cp_long_rest`: descanso largo. */
    cpLongRest: (cp, seed) => call('cp_long_rest', seed == null ? { cp } : { cp, seed }),
    /** `cp_level_up`: sube el grupo a `level` con las elecciones dadas. */
    cpLevelUp: (cp, level, choices) => call('cp_level_up', { cp, level, ...(choices ? { choices } : {}) }),
    /** `cp_gold`: suma (o resta, si `delta` < 0) oro al grupo. */
    cpGold: (cp, delta) => call('cp_gold', { cp, delta }),
    /** `cp_give`: da `count` unidades de un objeto al grupo. */
    cpGive: (cp, item, count = 1, opts) => call('cp_give', { cp, item, n: count, ...asObject(opts) }),
    /** `cp_heal`: cura `amount` PG a un miembro. */
    cpHeal: (cp, id, amount) => call('cp_heal', { cp, id, amount }),
    /** `cp_damage`: inflige `amount` de daño (de tipo `type`) a un miembro. */
    cpDamage: (cp, id, amount, type, opts) =>
      call('cp_damage', { cp, id, amount, ...(type ? { type } : {}), ...asObject(opts) }),
    /** `cp_pass_hours`: hace pasar horas en la campaña. */
    cpPassHours: (cp, hours) => call('cp_pass_hours', { cp, hours }),
    /** `cp_revive`: revive a un miembro caído. */
    cpRevive: (cp, id) => call('cp_revive', { cp, id }),
    /** `cp_load`: valida y normaliza una campaña guardada. */
    cpLoad: (cp) => call('cp_load', { cp }),
    /** `party_summary`: resumen de cada miembro del grupo. */
    partySummary: (cp) => call('party_summary', { cp }),
    /** `item_info`: ficha de un objeto (como se ve sin identificar si `unidentified`). */
    itemInfo: (id, unidentified = !1) => call('item_info', { id, unid: unidentified }),
    /** `inv`: inventario y huecos de equipo de un miembro. */
    inv: (cp, who) => call('inv', { cp, who }),
    /** `inv_preview`: qué cambiaría al equipar un objeto (`{ok, reason, lines}`). */
    invPreview: (cp, who, item, slot) => call('inv_preview', { cp, who, item, ...(slot ? { slot } : {}) }),
    /** `inv_equip`: equipa un objeto (en `slot` si se indica). */
    invEquip: (cp, who, item, slot) => call('inv_equip', { cp, who, item, ...(slot ? { slot } : {}) }),
    /** `inv_unequip`: quita lo equipado en un hueco. */
    invUnequip: (cp, who, slot) => call('inv_unequip', { cp, who, slot }),
    /** `inv_give`: pasa objetos de un miembro a otro. */
    invGive: (cp, from, to, item, count = 1) => call('inv_give', { cp, from, to, item, n: count }),
    /** `inv_use`: usa un objeto (poción…), sobre `target` si se indica. */
    invUse: (cp, who, item, target) => call('inv_use', { cp, who, item, ...(target ? { target } : {}) }),
    /** `inv_drop`: tira objetos del inventario. */
    invDrop: (cp, who, item, count = 1) => call('inv_drop', { cp, who, item, n: count }),
    /** `identify`: identifica los objetos del grupo. */
    identify: (cp) => call('identify', { cp }),
    /** `shop`: género, precios y qué compra un comerciante. */
    shop: (cp, merchant, who) => call('shop', { cp, merchant, ...(who ? { who } : {}) }),
    /** `shop_buy`: compra a un comerciante. */
    shopBuy: (cp, merchant, item, count = 1, who) =>
      call('shop_buy', { cp, merchant, item, n: count, ...(who ? { who } : {}) }),
    /** `shop_sell`: vende a un comerciante. */
    shopSell: (cp, merchant, who, item, count = 1) => call('shop_sell', { cp, merchant, who, item, n: count }),
    /** `check`: prueba de característica o habilidad de un miembro (`opts`: skill/ability, dc…). */
    check: (cp, who, opts) => call('check', { cp, who, ...asObject(opts) }),
    /** `group_check`: prueba de grupo de una habilidad contra una CD. */
    groupCheck: (cp, skill, dc, opts) => call('group_check', { cp, skill, dc, ...asObject(opts) }),
    /** `passive`: puntuación pasiva de cada miembro (`{id: valor}`). */
    passive: (cp, skill = 'perception') => call('passive', { cp, skill }),
    /** `best`: miembro con mejor modificador en una habilidad. */
    best: (cp, skill) => call('best', { cp, skill }),
    /** `xmap_load`: carga el mapa de exploración (filas de caracteres de terreno). */
    xmapLoad: (rows) => call('xmap_load', { rows }),
    /** `xmap_path`: camino entre dos casillas. */
    xmapPath: (from, to, opts) => call('xmap_path', { from, to, ...asObject(opts) }),
    /** `xmap_los`: línea de visión entre dos casillas (`{los, cover, dist}`). */
    xmapLos: (from, to) => call('xmap_los', { from, to }),
    /** `xmap_walkable`: si cada casilla es transitable y si es terreno difícil. */
    xmapWalkable: (cells) => call('xmap_walkable', { cells }),
    /** `xmap_reach`: casillas alcanzables desde `from` con coste ≤ `max` (`[x, y, coste]`). */
    xmapReach: (from, max, opts) => call('xmap_reach', { from, max, ...asObject(opts) }),
    /** `xmap_free`: `count` casillas libres cerca de `near`. */
    xmapFree: (near, count, opts) => call('xmap_free', { near, n: count, ...asObject(opts) }),
    /** `xmap_cell`: terreno y propiedades de una casilla. */
    xmapCell: (cell) => call('xmap_cell', { cell }),
    /** `battle_start`: empieza un combate sobre el mapa (grupo, enemigos, sorpresa); devuelve `{state}`. */
    battleStart: (request) => call('battle_start', request),
    /** `battle_end`: cierra el combate y vuelca el resultado en la campaña (`{cp}`). */
    battleEnd: (cp, won, opts) => call('battle_end', { cp, won, ...asObject(opts) }),
    /** `init`: combate de un encuentro predefinido (banco de pruebas de combat/hud.js). */
    init: (encounter, seed) => call('init', { encounter, seed }),
    /** `state`: estado del combate (ronda, turno actual, orden, criaturas, mapa). */
    state: () => call('state'),
    /** `options`: acciones disponibles para la criatura del turno actual. */
    options: () => call('options'),
    /** `threats`: ataques de oportunidad que provocaría recorrer `path`. */
    threats: (path) => call('threats', { path }),
    /** `move`: mueve la criatura del turno por `path` (`dash`: con la acción de correr). */
    move: (path, dash = !1) => call('move', { path, dash }),
    /** `undo_move`: deshace el último movimiento. */
    undoMove: () => call('undo_move'),
    /** `attack_plan`: previsión de un ataque contra `target` (con el ataque `key`). */
    attackPlan: (target, key) => call('attack_plan', key ? { target, key } : { target }),
    /** `attack`: ataca a `target` con el ataque `key`, moviéndose antes por `path`. */
    attack: (key, target, path) => call('attack', { key, target, path }),
    /** `offhand`: ataque con la mano torpe. */
    offhand: (key, target) => call('offhand', { key, target }),
    /** `spell_begin`: empieza a lanzar un conjuro (con su nivel de espacio) y devuelve cómo se apunta. */
    spellBegin: (spell, slot) => call('spell_begin', { spell, slot }),
    /** `spell_preview`: criaturas afectadas y previsión del conjuro con los objetivos dados. */
    spellPreview: (request) => call('spell_preview', request),
    /** `cast`: lanza el conjuro. */
    cast: (request) => call('cast', request),
    /** `simple_targets`: objetivos válidos de una acción simple (`what`). */
    simpleTargets: (what) => call('simple_targets', { what }),
    /** `simple`: acción simple (`what`: esquivar, ayudar, destrabarse…) sobre `target`. */
    simple: (what, target) => call('simple', { what, target }),
    /** `feature`: usa un rasgo de clase (`{name}`: segundo aliento, oleada de acción…). */
    feature: (request) => call('feature', request),
    /** `ai_turn`: juega el turno de la criatura actual con la IA del núcleo. */
    aiTurn: () => call('ai_turn'),
    /** `end_turn`: termina el turno actual y pasa al siguiente. */
    endTurn: () => call('end_turn'),
  };
}

export { createApi, loadRules };
