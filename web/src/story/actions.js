// story/actions.js
// Reconstruido de publicado/juego.js (módulo __esm «pE»). Nombres locales aún minificados.

function dE(o) {
  if (o && typeof o == 'object') {
    if (o.if !== void 0 || o.do || o.else)
      return { op: 'cond', if: o.if, do: o.do || [], else: o.else || [] };
    if (o.narrate) return { op: 'narrate', moment: o.narrate, lines: o.lines, data: o.data };
    if (o.say) return { op: 'say', who: o.say, text: o.text };
    if (o.op) return o;
    throw new Error(`efecto desconocido: ${JSON.stringify(o)}`);
  }
  let e = String(o).trim(),
    t = e.indexOf(':'),
    a = t < 0 ? e : e.slice(0, t),
    n = t < 0 ? '' : e.slice(t + 1),
    s = (i) => {
      let r = i.indexOf('=');
      return r < 0 ? [i, void 0] : [i.slice(0, r), i.slice(r + 1)];
    };
  switch (a) {
    case 'set': {
      let [i, r] = s(n);
      return { op: a, flag: i, value: r === void 0 ? !0 : $v(r) };
    }
    case 'unset':
      return { op: a, flag: n };
    case 'inc':
      return { op: a, flag: n.split('+')[0], by: Number(n.split('+')[1] || 1) };
    case 'var': {
      let [i, r] = s(n);
      return { op: a, name: i, value: r === void 0 ? !0 : $v(r) };
    }
    case 'gold':
      return { op: a, delta: Number(n) };
    case 'give':
    case 'take': {
      let [i, r] = n.split('*');
      return { op: a, item: i, n: Number(r || 1) };
    }
    case 'recruit':
    case 'dismiss':
    case 'wait':
    case 'raise':
    case 'fire':
      return { op: a, who: n };
    case 'approve': {
      let i = /^([a-z_]+)([+-]\d+)$/.exec(n);
      if (!i) throw new Error(`approve mal escrito: ${e}`);
      return { op: a, who: i[1], delta: Number(i[2]) };
    }
    case 'decision': {
      let [i, r] = s(n);
      return { op: a, id: i, choice: r === void 0 ? !0 : $v(r) };
    }
    case 'journal':
    case 'toast':
      return { op: a, text: n };
    case 'battle':
      return { op: a, group: n.replace(/!$/, ''), surprise: n.endsWith('!') };
    case 'leave':
      return { op: a, group: n };
    case 'place':
      return { op: a, id: n };
    case 'object':
    case 'npc': {
      let [i, r] = s(n);
      return { op: a, id: i, state: r };
    }
    case 'shop':
      return { op: a, merchant: n };
    case 'rest':
      return { op: a, where: n || 'inn' };
    case 'heal':
      return { op: a, who: n || 'party' };
    case 'damage': {
      let [i, r = '1d4'] = s(n),
        [l, c = 'piercing', d, u] = r.split(':');
      return { op: a, who: i, dice: l, type: c, save: d || null, dc: u ? Number(u) : null };
    }
    case 'levelup':
      return { op: a, level: Number(n) };
    case 'narrate':
    case 'prefetch':
      return { op: a, moment: n };
    case 'sfx':
      return { op: a, name: n };
    case 'travel': {
      let [i, r] = n.split(':');
      return { op: a, level: i, spawn: r };
    }
    case 'goto':
      return { op: a, node: n };
    case 'identify':
    case 'hire':
    case 'refresh':
    case 'proceed':
    case 'end':
    case 'epilogue':
      return { op: a };
    default:
      throw new Error(`efecto desconocido: ${e}`);
  }
}
function hE(o, e = Math.random) {
  let t = /^(\d*)d(\d+)([+-]\d+)?$/.exec(String(o).trim());
  if (!t) return Number(o) || 0;
  let a = Number(t[3] || 0);
  for (let n = 0; n < Number(t[1] || 1); n++) a += 1 + Math.floor(e() * Number(t[2]));
  return Math.max(0, a);
}
const $v = (o) =>
  o === 'true' ? !0 : o === 'false' ? !1 : o !== '' && !Number.isNaN(Number(o)) ? Number(o) : o;
const uE = new Set(['battle', 'shop', 'rest', 'travel', 'epilogue', 'levelup', 'hire']);

export { dE, hE, uE };
