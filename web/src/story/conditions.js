// story/conditions.js
// Reconstruido de publicado/juego.js (módulo __esm «aE»). Nombres locales aún minificados.

function QM(o) {
  if (o == null || o === '') return { t: 'true' };
  if (typeof o != 'string') throw new Error(`condici\xF3n no es texto: ${JSON.stringify(o)}`);
  if (Vv.has(o)) return Vv.get(o);
  let e = [],
    t = /\s*(\(|\)|&|\||!(?!=)|[A-Za-z_][\w]*(?::[\w.]+)?(?:(?:>=|<=|!=|=|>|<)[\w.+-]+)?)/y,
    a = 0;
  for (; a < o.length;) {
    if (/\s/.test(o[a])) {
      a++;
      continue;
    }
    t.lastIndex = a;
    let u = t.exec(o);
    if (!u) throw new Error(`no entiendo \xAB${o.slice(a)}\xBB en \xAB${o}\xBB`);
    (e.push(u[1]), (a = t.lastIndex));
  }
  let n = 0,
    s = () => e[n],
    i = () => e[n++];
  function r() {
    let u = l();
    for (; s() === '|';) (i(), (u = { t: 'or', a: u, b: l() }));
    return u;
  }
  function l() {
    let u = c();
    for (; s() === '&';) (i(), (u = { t: 'and', a: u, b: c() }));
    return u;
  }
  function c() {
    if (s() === '!') return (i(), { t: 'not', a: c() });
    if (s() === '(') {
      i();
      let h = r();
      if (i() !== ')') throw new Error(`falta \xAB)\xBB en \xAB${o}\xBB`);
      return h;
    }
    let u = i();
    if (!u || '()&|!'.includes(u)) throw new Error(`esperaba una condici\xF3n en \xAB${o}\xBB`);
    return PD(u);
  }
  let d = r();
  if (n < e.length) throw new Error(`sobra \xAB${e.slice(n).join(' ')}\xBB en \xAB${o}\xBB`);
  return (Vv.set(o, d), d);
}
function PD(o) {
  let e = null,
    t = null,
    a = o;
  for (let r of ZM) {
    let l = o.indexOf(r);
    if (l > 0) {
      let c = o.slice(0, l);
      if (ZM.some((d) => c.includes(d))) continue;
      ((e = r), (a = c), (t = o.slice(l + r.length)));
      break;
    }
  }
  let n = a.indexOf(':'),
    s = n > 0 ? a.slice(0, n) : null,
    i = n > 0 ? a.slice(n + 1) : a;
  return { t: 'atom', ns: s, name: i, op: e, value: t };
}
function eE(o) {
  let e = [],
    t = (a) => {
      a && (a.t === 'atom' ? e.push(a) : (t(a.a), t(a.b)));
    };
  return (t(QM(o)), e);
}
function cs(o, e, t) {
  if (e === '=') return String(o) === String(t) || (t === 'true' && o === !0) || (t === 'false' && !o);
  if (e === '!=') return !cs(o, '=', t);
  let a = Number(o ?? 0),
    n = Number(t);
  return e === '>=' ? a >= n : e === '<=' ? a <= n : e === '>' ? a > n : e === '<' ? a < n : !1;
}
function tE(o, e) {
  if (o == null || o === '') return !0;
  let t = typeof o == 'string' ? QM(o) : o;
  return bc(t, e);
}
function bc(o, e) {
  switch (o.t) {
    case 'true':
      return !0;
    case 'not':
      return !bc(o.a, e);
    case 'and':
      return bc(o.a, e) && bc(o.b, e);
    case 'or':
      return bc(o.a, e) || bc(o.b, e);
    case 'atom':
      return zD(o, e);
  }
  return !1;
}
function zD({ ns: o, name: e, op: t, value: a }, n) {
  let s = (r) => (t ? cs(r, t, a) : r != null && r !== !1 && r !== 0 && r !== '');
  if (!o)
    return e === 'true'
      ? !0
      : e === 'false'
        ? !1
        : e === 'stealth'
          ? s(!!(n.ctx?.stealth || n.stealthNow?.()))
          : e === 'alone'
            ? n.partySize() <= 1
            : t && e === 'gold'
              ? cs(n.gold(), t, a === 'precio' ? (n.hirePrice?.() ?? 0) : a)
              : e === 'mercs'
                ? s(n.mercs?.().length ?? 0)
                : t && e === 'level'
                  ? cs(n.level(), t, a)
                  : t && e === 'day'
                    ? cs(n.day(), t, a)
                    : t && e === 'party'
                      ? cs(n.partySize(), t, a)
                      : s(n.flag(e));
  let i = () => n.hero() || {};
  switch (o) {
    case 'party':
      return s(n.inParty(e));
    case 'species':
      return s(i().species === e);
    case 'lineage':
      return s(i().lineage === e || i().ancestry === e);
    case 'class':
      return s(i().class === e);
    case 'subclass':
      return s(i().subclass === e);
    case 'bg':
      return s(i().background === e);
    case 'pronoun':
      return s((i().pronoun || 'm') === e);
    case 'item':
    case 'has':
      return t ? cs(n.itemCount(e), t, a) : n.itemCount(e) > 0;
    case 'approval':
      return t ? cs(n.approval(e), t, a) : n.approval(e) > 0;
    case 'seen':
      return t ? cs(n.seen(e), t, a) : n.seen(e) > 0;
    case 'tried':
      return t ? cs(n.tried(e), t, a) : !!n.tried(e);
    case 'quest':
      return t ? cs(n.quest(e), t, a) : n.quest(e) !== 'none';
    case 'ctx':
      return s(n.ctx?.[e]);
    case 'in':
      return n.levelId() === e;
    case 'var':
      return s(n.vars?.[e]);
    case 'dead':
      return s(n.isDead?.(e));
    case 'visited':
    case 'met':
    case 'fought':
    case 'killed':
      return s(n.knows?.(o, e));
    default:
      return !1;
  }
}
const ZM = ['>=', '<=', '!=', '=', '>', '<'];
const Vv = new Map();

export { eE, tE };
