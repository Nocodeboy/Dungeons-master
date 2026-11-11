// explore/hex.js — Rejilla hexagonal odd-r (hexágonos con vértice arriba, HEX_SIZE = 1,5 m por casilla).
// Conversiones casilla ↔ plano (unidades de casilla) ↔ mundo, vecinos, distancia y la forma del hexágono.
// La usan explore/*, combat/* y vfx/shaders.js.
// Reconstruido de publicado/juego.js (módulo __esm «Kn»).

import { Shape, Vector3 } from 'three';

/** Centro de la casilla [col, row] en el plano, en unidades de casilla (filas impares desplazadas ½). */
function cellToPlane(col, row) {
  return { x: col + (row & 1 ? 0.5 : 0), y: row * ROW_STEP };
}
/** Centro de la casilla en coordenadas de mundo (y = 0); escribe en `out`. */
function cellToWorld(col, row, out = new Vector3()) {
  let p = cellToPlane(col, row);
  return out.set(p.x * HEX_SIZE, 0, p.y * HEX_SIZE);
}
/** Posición de mundo (x, z) → plano en unidades de casilla. */
function worldToPlane(pos) {
  return { x: pos.x / HEX_SIZE, y: pos.z / HEX_SIZE };
}
/** Punto del plano → casilla [col, row] que lo contiene (redondeo en coordenadas cúbicas). */
function planeToCell(x, y) {
  let q = ((Math.sqrt(3) / 3) * x - y / 3) / HEX_RADIUS,
    r = ((2 / 3) * y) / HEX_RADIUS,
    rq = Math.round(q),
    rr = Math.round(r),
    s = -q - r,
    rs = Math.round(s),
    dq = Math.abs(rq - q),
    dr = Math.abs(rr - r),
    ds = Math.abs(rs - s);
  return (
    dq > ds && dq > dr ? (rq = -rs - rr) : dr > ds && (rr = -rq - rs),
    [rq + ((rr - (rr & 1)) >> 1), rr]
  );
}
/** Clave de texto «col,row» para conjuntos y mapas. */
function cellKey(col, row) {
  return `${col},${row}`;
}
/** Las 6 casillas vecinas de [col, row] (los desplazamientos dependen de la paridad de la fila). */
function neighbors(col, row) {
  return (
    row & 1
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
  ).map(([dc, dr]) => [col + dc, row + dr]);
}
/** Distancia en casillas entre dos casillas [col, row]. */
function hexDistance(a, b) {
  let aq = a[0] - ((a[1] - (a[1] & 1)) >> 1),
    bq = b[0] - ((b[1] - (b[1] & 1)) >> 1),
    dq = aq - bq,
    dr = a[1] - b[1];
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}
/** Contorno hexagonal (three.Shape) de radio `radius` en metros, con vértice arriba. */
function hexShape(radius = HEX_RADIUS * HEX_SIZE) {
  let shape = new Shape();
  for (let i = 0; i < 6; i++) {
    let angle = (Math.PI / 3) * i + Math.PI / 6,
      x = Math.cos(angle) * radius,
      y = Math.sin(angle) * radius;
    i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
  }
  return (shape.closePath(), shape);
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
