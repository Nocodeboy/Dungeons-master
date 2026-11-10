// explore/hex.js
// Reconstruido de publicado/juego.js (módulo __esm «Kn»). Nombres locales aún minificados.

import { Shape, Vector3 } from 'three';

function uo(o, e) {
  return { x: o + (e & 1 ? 0.5 : 0), y: e * _m };
}
function xc(o, e, t = new Vector3()) {
  let a = uo(o, e);
  return t.set(a.x * nt, 0, a.y * nt);
}
function wm(o) {
  return { x: o.x / nt, y: o.z / nt };
}
function ds(o, e) {
  let t = ((Math.sqrt(3) / 3) * o - e / 3) / fn,
    a = ((2 / 3) * e) / fn,
    n = Math.round(t),
    s = Math.round(a),
    i = -t - a,
    r = Math.round(i),
    l = Math.abs(n - t),
    c = Math.abs(s - a),
    d = Math.abs(r - i);
  return (l > d && l > c ? (n = -r - s) : c > d && (s = -n - r), [n + ((s - (s & 1)) >> 1), s]);
}
function Ut(o, e) {
  return `${o},${e}`;
}
function neighbors(o, e) {
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
  ).map(([n, s]) => [o + n, e + s]);
}
function Wt(o, e) {
  let t = o[0] - ((o[1] - (o[1] & 1)) >> 1),
    a = e[0] - ((e[1] - (e[1] & 1)) >> 1),
    n = t - a,
    s = o[1] - e[1];
  return (Math.abs(n) + Math.abs(s) + Math.abs(n + s)) / 2;
}
function Us(o = fn * nt) {
  let e = new Shape();
  for (let t = 0; t < 6; t++) {
    let a = (Math.PI / 3) * t + Math.PI / 6,
      n = Math.cos(a) * o,
      s = Math.sin(a) * o;
    t === 0 ? e.moveTo(n, s) : e.lineTo(n, s);
  }
  return (e.closePath(), e);
}
const nt = 1.5;
const _m = 0.8660254;
const fn = 0.5773503;

export { Us, Ut, Wt, _m, ds, fn, neighbors, nt, uo, wm, xc };
