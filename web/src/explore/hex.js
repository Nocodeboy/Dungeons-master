// explore/hex.js
// Reconstruido de publicado/juego.js (módulo __esm «Kn»). Nombres locales aún minificados.

import { Shape, Vector3 } from 'three';

function cellToPlane(o, e) {
  return { x: o + (e & 1 ? 0.5 : 0), y: e * ROW_STEP };
}
function cellToWorld(o, e, t = new Vector3()) {
  let a = cellToPlane(o, e);
  return t.set(a.x * HEX_SIZE, 0, a.y * HEX_SIZE);
}
function worldToPlane(o) {
  return { x: o.x / HEX_SIZE, y: o.z / HEX_SIZE };
}
function planeToCell(o, e) {
  let t = ((Math.sqrt(3) / 3) * o - e / 3) / HEX_RADIUS,
    a = ((2 / 3) * e) / HEX_RADIUS,
    n = Math.round(t),
    s = Math.round(a),
    i = -t - a,
    r = Math.round(i),
    l = Math.abs(n - t),
    c = Math.abs(s - a),
    d = Math.abs(r - i);
  return (l > d && l > c ? (n = -r - s) : c > d && (s = -n - r), [n + ((s - (s & 1)) >> 1), s]);
}
function cellKey(o, e) {
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
function hexDistance(o, e) {
  let t = o[0] - ((o[1] - (o[1] & 1)) >> 1),
    a = e[0] - ((e[1] - (e[1] & 1)) >> 1),
    n = t - a,
    s = o[1] - e[1];
  return (Math.abs(n) + Math.abs(s) + Math.abs(n + s)) / 2;
}
function hexShape(o = HEX_RADIUS * HEX_SIZE) {
  let e = new Shape();
  for (let t = 0; t < 6; t++) {
    let a = (Math.PI / 3) * t + Math.PI / 6,
      n = Math.cos(a) * o,
      s = Math.sin(a) * o;
    t === 0 ? e.moveTo(n, s) : e.lineTo(n, s);
  }
  return (e.closePath(), e);
}
const HEX_SIZE = 1.5;
const ROW_STEP = 0.8660254;
const HEX_RADIUS = 0.5773503;

export {
  HEX_RADIUS,
  HEX_SIZE,
  ROW_STEP,
  cellKey,
  cellToPlane,
  cellToWorld,
  hexDistance,
  hexShape,
  neighbors,
  planeToCell,
  worldToPlane,
};
