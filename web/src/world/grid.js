// world/grid.js
// Reconstruido de publicado/juego.js (módulo __esm «Mi»). Nombres locales aún minificados.

import { MathUtils, Vector3 } from 'three';

function Ou(o = 1) {
  let e = o >>> 0,
    t = () => {
      e = (e + 1831565813) | 0;
      let a = Math.imul(e ^ (e >>> 15), 1 | e);
      return ((a = (a + Math.imul(a ^ (a >>> 7), 61 | a)) ^ a), ((a ^ (a >>> 14)) >>> 0) / 4294967296);
    };
  return (
    (t.range = (a, n) => a + (n - a) * t()),
    (t.int = (a) => Math.floor(t() * a)),
    (t.pick = (a) => a[Math.floor(t() * a.length)]),
    (t.chance = (a) => t() < a),
    t
  );
}
function C3(o) {
  let e = 2166136261;
  for (let t = 0; t < o.length; t++) e = Math.imul(e ^ o.charCodeAt(t), 16777619);
  return e >>> 0;
}
function qt(o, e, t = new Vector3()) {
  return t.set((o + (e & 1 ? 0.5 : 0)) * ot, 0, e * Fu * ot);
}
function ho(o, e) {
  let t = o / ot,
    a = e / ot,
    n = ((Math.sqrt(3) / 3) * t - a / 3) / Nu,
    s = ((2 / 3) * a) / Nu,
    i = Math.round(n),
    r = Math.round(s),
    l = -n - s,
    c = Math.round(l),
    d = Math.abs(i - n),
    u = Math.abs(r - s),
    h = Math.abs(c - l);
  return (d > h && d > u ? (i = -c - r) : u > h && (r = -i - c), [i + ((r - (r & 1)) >> 1), r]);
}
function po(o, e) {
  return (
    e & 1
      ? [
          [1, 0],
          [-1, 0],
          [0, -1],
          [1, -1],
          [0, 1],
          [1, 1],
        ]
      : [
          [1, 0],
          [-1, 0],
          [-1, -1],
          [0, -1],
          [-1, 1],
          [0, 1],
        ]
  ).map(([a, n]) => [o + a, e + n]);
}
function Wm(o, e, t) {
  let a = Math.min(1, Math.max(0, (t - o) / (e - o)));
  return a * a * (3 - 2 * a);
}
function P3(o = 1) {
  let e = Ou(o),
    t = new Uint8Array(512),
    a = new Float32Array(256);
  for (let i = 0; i < 256; i++) ((t[i] = i), (a[i] = e() * 2 - 1));
  for (let i = 255; i > 0; i--) {
    let r = Math.floor(e() * (i + 1));
    [t[i], t[r]] = [t[r], t[i]];
  }
  for (let i = 0; i < 256; i++) t[i + 256] = t[i];
  let n = (i, r) => a[t[(t[i & 255] + r) & 511] & 255],
    s = (i, r) => {
      let l = Math.floor(i),
        c = Math.floor(r),
        d = i - l,
        u = r - c,
        h = d * d * (3 - 2 * d),
        p = u * u * (3 - 2 * u),
        m = n(l, c),
        _ = n(l + 1, c),
        b = n(l, c + 1),
        f = n(l + 1, c + 1);
      return m + (_ - m) * h + (b - m) * p + (m - _ - b + f) * h * p;
    };
  return (
    (s.fbm = (i, r, l = 4) => {
      let c = 0,
        d = 0.5,
        u = 1;
      for (let h = 0; h < l; h++) ((c += d * s(i * u, r * u)), (u *= 2.03), (d *= 0.5));
      return c;
    }),
    s
  );
}
const ot = 1.5;
const Fu = 0.8660254;
const Nu = 0.5773503;
const zt = (o, e) => `${o},${e}`;
const $m = class {
  constructor(e) {
    ((this.rows = e.rows || []),
      (this.h = this.rows.length),
      (this.w = e.width || Math.max(0, ...this.rows.map((t) => t.length))),
      (this.paint = new Map()));
    for (let t of e.paint || []) for (let a of t.cells) this.paint.set(zt(a[0], a[1]), t.ground);
  }
  inside(e, t) {
    return e >= 0 && t >= 0 && e < this.w && t < this.h;
  }
  tile(e, t) {
    return this.inside(e, t) ? (this.rows[t][e] ?? ' ') : ' ';
  }
  each(e) {
    for (let t = 0; t < this.h; t++) for (let a = 0; a < this.w; a++) e(a, t, this.rows[t][a] ?? ' ');
  }
  regions(e) {
    let t = new Set(e),
      a = new Set(),
      n = [];
    return (
      this.each((s, i, r) => {
        if (!t.has(r) || a.has(zt(s, i))) return;
        let l = [],
          c = [[s, i]];
        for (; c.length;) {
          let [d, u] = c.pop(),
            h = zt(d, u);
          if (!(a.has(h) || !t.has(this.tile(d, u)))) {
            (a.add(h), l.push([d, u]));
            for (let p of po(d, u)) c.push(p);
          }
        }
        n.push(l);
      }),
      n
    );
  }
  get sizeX() {
    return (this.w + 0.5) * ot;
  }
  get sizeZ() {
    return (this.h - 1) * Fu * ot;
  }
};
const fo = MathUtils.degToRad;

export { $m, C3, Fu, Nu, Ou, P3, Wm, fo, ho, ot, po, qt, zt };
