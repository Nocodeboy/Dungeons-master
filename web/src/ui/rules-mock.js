// ui/rules-mock.js
// Reconstruido de publicado/juego.js (módulo __esm «Ww»). Nombres locales aún minificados.

import { createSimulator } from './catalog.js';

function createRulesBridge(o, { mock: e = !0 } = {}) {
  let t = new Set(),
    a = null,
    n = { core: new Set(), mock: new Set() };
  function s(h, p = {}) {
    if (!t.has(h) && typeof o.rules == 'function')
      try {
        let m = o.rules(h, p);
        if (!(m && m.error && sz.test(String(m.error)))) return (n.core.add(h), m);
        t.add(h);
      } catch (m) {
        (console.warn(`[interfaz] ${h}:`, m), t.add(h));
      }
    if (e && ((a ??= createSimulator()), a[h])) {
      (n.mock.has(h) ||
        console.info(`[interfaz] \xAB${h}\xBB con el simulador (el n\xFAcleo a\xFAn no la tiene)`),
        n.mock.add(h));
      try {
        return a[h](structuredClone(p));
      } catch (m) {
        return (console.error(`[interfaz] simulador ${h}:`, m), { error: String(m.message || m) });
      }
    }
    return { error: `No disponible: ${h}` };
  }
  function i(h) {
    return (h && h.cp && !h.error && o.store.set(h.cp), h);
  }
  let r = () => o.store.cp,
    l = new Map();
  function c(h) {
    if (!l.has(h)) {
      let p = s('data', { name: h });
      l.set(h, p && !p.error ? p : {});
    }
    return l.get(h);
  }
  let d = new Map();
  function u(h) {
    if (!h) return null;
    if (!d.has(h)) {
      let p = s('item_info', { id: h });
      d.set(h, p && !p.error ? p : { id: h, name: h, kind: 'gear', desc: '' });
    }
    return d.get(h);
  }
  return {
    call: s,
    apply: i,
    data: c,
    item: u,
    stats: n,
    real: (h) => n.core.has(h),
    sheetNew: (h = {}) => s('sheet_new', h),
    sheetSet: (h, p, m = {}) =>
      s('sheet_set', { sheet: h, ...(Array.isArray(p) ? { sets: p } : { set: p }), ...m }),
    sheetView: (h, p = {}) => s('sheet_options', { sheet: h, ...p }),
    sheetFinish: (h) => s('sheet_finish', { sheet: h }),
    sheetOptions: (h, p = 1) => s('sheet_options', { sheet: h, level: p }),
    sheetComplete: (h, p = 1) => s('sheet_complete', { sheet: h, level: p }),
    sheetValidate: (h, p = 1) => s('sheet_validate', { sheet: h, level: p }),
    sheetSummary: (h, p = 1, m) => s('sheet_summary', { sheet: h, level: p, state: m }),
    randomName: (h, p) => s('random_name', { species: h, pronoun: p })?.name || '',
    levelChoices: (h, p, m) => s('level_choices', m ? { sheet: h, from: p, to: m } : { sheet: h, from: p }),
    cpNew: (h, p = ['brenna']) => s('cp_new', { hero: h, companions: p }),
    hire: (h) => i(s('cp_hire', { cp: r(), sheet: h })),
    partySummary: () => {
      let h = r() ? s('party_summary', { cp: r() }) : [];
      return Array.isArray(h) ? h : h?.party || [];
    },
    shortRest: (h) => i(s('cp_short_rest', { cp: r(), spend: h })),
    longRest: () => i(s('cp_long_rest', { cp: r() })),
    levelUp: (h, p) => i(s('cp_level_up', { cp: r(), level: h, choices: p })),
    gold: (h) => i(s('cp_gold', { cp: r(), delta: h })),
    give: (h, p = 1, m, _) => i(s('cp_give', { cp: r(), item: h, n: p, to: m, unid: _ })),
    passHours: (h) => i(s('cp_pass_hours', { cp: r(), hours: h })),
    inv: (h) => s('inv', { cp: r(), who: h }),
    invPreview: (h, p, m) => s('inv_preview', { cp: r(), who: h, item: p, slot: m }),
    equip: (h, p, m) => i(s('inv_equip', { cp: r(), who: h, item: p, slot: m })),
    unequip: (h, p) => i(s('inv_unequip', { cp: r(), who: h, slot: p })),
    giveTo: (h, p, m, _ = 1) => i(s('inv_give', { cp: r(), from: h, to: p, item: m, n: _ })),
    use: (h, p, m) => i(s('inv_use', { cp: r(), who: h, item: p, target: m })),
    drop: (h, p, m = 1) => i(s('inv_drop', { cp: r(), who: h, item: p, n: m })),
    shop: (h) => s('shop', { cp: r(), merchant: h }),
    buy: (h, p, m = 1, _) => i(s('shop_buy', { cp: r(), merchant: h, item: p, n: m, who: _ })),
    sell: (h, p, m, _ = 1) => i(s('shop_sell', { cp: r(), merchant: h, who: p, item: m, n: _ })),
    check: (h) => s('check', { cp: r(), ...h }),
  };
}
const sz = /op desconocida|unknown op|sin combate/i;

export { createRulesBridge };
