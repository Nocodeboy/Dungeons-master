// world/grid.js — utilidades básicas del mundo: rejilla hexagonal odd-r (vértice arriba, K = 1,5 m),
// azar con semilla, hash de textos, ruido de valor 2D y el mapa de casillas del nivel (`TileMap`).
// Reconstruido de publicado/juego.js (módulo __esm «Mi»). Lo usan todos los módulos de world/.
// Las fórmulas de rejilla son las mismas que explore/hex.js (copia propia del área).

import { MathUtils, Vector3 } from 'three';

/**
 * Generador pseudoaleatorio con semilla (mulberry32). Devuelve `rnd()` en [0, 1) con ayudantes
 * `rnd.range(min, max)`, `rnd.int(n)`, `rnd.pick(lista)` y `rnd.chance(p)`.
 */
function makeRng(seed = 1) {
  let state = seed >>> 0,
    rnd = () => {
      state = (state + 1831565813) | 0;
      let x = Math.imul(state ^ (state >>> 15), 1 | state);
      return ((x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x), ((x ^ (x >>> 14)) >>> 0) / 4294967296);
    };
  return (
    (rnd.range = (min, max) => min + (max - min) * rnd()),
    (rnd.int = (n) => Math.floor(rnd() * n)),
    (rnd.pick = (list) => list[Math.floor(rnd() * list.length)]),
    (rnd.chance = (p) => rnd() < p),
    rnd
  );
}
/** Hash FNV-1a de 32 bits de un texto (semilla estable a partir del id del nivel). */
function hashString(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return hash >>> 0;
}
/** Centro de la casilla (col, row) en coordenadas del mundo (y = 0). */
function cellToWorld(col, row, out = new Vector3()) {
  return out.set((col + (row & 1 ? 0.5 : 0)) * HEX_SIZE, 0, row * ROW_STEP * HEX_SIZE);
}
/** Casilla [col, row] que contiene el punto (wx, wz) del mundo (redondeo cúbico). */
function worldToCell(wx, wz) {
  let px = wx / HEX_SIZE,
    py = wz / HEX_SIZE,
    qf = ((Math.sqrt(3) / 3) * px - py / 3) / HEX_RADIUS,
    rf = ((2 / 3) * py) / HEX_RADIUS,
    qi = Math.round(qf),
    ri = Math.round(rf),
    sf = -qf - rf,
    si = Math.round(sf),
    dq = Math.abs(qi - qf),
    dr = Math.abs(ri - rf),
    ds = Math.abs(si - sf);
  return (
    dq > ds && dq > dr ? (qi = -si - ri) : dr > ds && (ri = -qi - si),
    [qi + ((ri - (ri & 1)) >> 1), ri]
  );
}
/** Las seis casillas vecinas de (col, row) en la rejilla odd-r. */
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
/** Interpolación suave de Hermite entre edge0 y edge1, como el `smoothstep` de GLSL. */
function smoothstep(edge0, edge1, x) {
  let k = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return k * k * (3 - 2 * k);
}
/**
 * Ruido de valor 2D con semilla: `noise(x, y)` en [-1, 1] interpolado suave en una red entera y
 * `noise.fbm(x, y, octavas)` (suma fractal de octavas).
 */
function makeNoise(seed = 1) {
  let rnd = makeRng(seed),
    perm = new Uint8Array(512),
    values = new Float32Array(256);
  for (let i = 0; i < 256; i++) ((perm[i] = i), (values[i] = rnd() * 2 - 1));
  for (let i = 255; i > 0; i--) {
    let j = Math.floor(rnd() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
  let lattice = (ix, iy) => values[perm[(perm[ix & 255] + iy) & 511] & 255],
    noise = (x, y) => {
      let x0 = Math.floor(x),
        y0 = Math.floor(y),
        fx = x - x0,
        fy = y - y0,
        sx = fx * fx * (3 - 2 * fx),
        sy = fy * fy * (3 - 2 * fy),
        v00 = lattice(x0, y0),
        v10 = lattice(x0 + 1, y0),
        v01 = lattice(x0, y0 + 1),
        v11 = lattice(x0 + 1, y0 + 1);
      return v00 + (v10 - v00) * sx + (v01 - v00) * sy + (v00 - v10 - v01 + v11) * sx * sy;
    };
  return (
    (noise.fbm = (x, y, octaves = 4) => {
      let sum = 0,
        amp = 0.5,
        freq = 1;
      for (let octave = 0; octave < octaves; octave++)
        ((sum += amp * noise(x * freq, y * freq)), (freq *= 2.03), (amp *= 0.5));
      return sum;
    }),
    noise
  );
}
/** Tamaño de casilla (K = 1,5 m): unidad de longitud de los niveles. */
const HEX_SIZE = 1.5;
/** Separación entre filas, en casillas (√3/2). */
const ROW_STEP = 0.8660254;
/** Radio del hexágono, en casillas (1/√3). */
const HEX_RADIUS = 0.5773503;
/** Clave de texto «col,row» de una casilla para Map/Set. */
const cellKey = (col, row) => `${col},${row}`;
/**
 * Mapa de casillas del nivel: filas de caracteres (`level.rows`, ver explore/terrain.js) y
 * pintura de suelo por casilla (`level.paint`). Tamaño del mundo en `sizeX`/`sizeZ`.
 */
const TileMap = class {
  constructor(level) {
    ((this.rows = level.rows || []),
      (this.h = this.rows.length),
      (this.w = level.width || Math.max(0, ...this.rows.map((row) => row.length))),
      (this.paint = new Map()));
    for (let patch of level.paint || [])
      for (let cell of patch.cells) this.paint.set(cellKey(cell[0], cell[1]), patch.ground);
  }
  inside(col, row) {
    return col >= 0 && row >= 0 && col < this.w && row < this.h;
  }
  tile(col, row) {
    return this.inside(col, row) ? (this.rows[row][col] ?? ' ') : ' ';
  }
  each(fn) {
    for (let row = 0; row < this.h; row++)
      for (let col = 0; col < this.w; col++) fn(col, row, this.rows[row][col] ?? ' ');
  }
  /** Regiones conexas de casillas cuyo carácter está en `chars` (relleno por inundación). */
  regions(chars) {
    let wanted = new Set(chars),
      seen = new Set(),
      regions = [];
    return (
      this.each((col, row, ch) => {
        if (!wanted.has(ch) || seen.has(cellKey(col, row))) return;
        let region = [],
          stack = [[col, row]];
        for (; stack.length;) {
          let [curCol, curRow] = stack.pop(),
            key = cellKey(curCol, curRow);
          if (!(seen.has(key) || !wanted.has(this.tile(curCol, curRow)))) {
            (seen.add(key), region.push([curCol, curRow]));
            for (let next of neighbors(curCol, curRow)) stack.push(next);
          }
        }
        regions.push(region);
      }),
      regions
    );
  }
  get sizeX() {
    return (this.w + 0.5) * HEX_SIZE;
  }
  get sizeZ() {
    return (this.h - 1) * ROW_STEP * HEX_SIZE;
  }
};
/** Grados a radianes (alias de MathUtils.degToRad). */
const degToRad = MathUtils.degToRad;

export {
  TileMap,
  hashString,
  ROW_STEP,
  HEX_RADIUS,
  makeRng,
  makeNoise,
  smoothstep,
  degToRad,
  worldToCell,
  HEX_SIZE,
  neighbors,
  cellToWorld,
  cellKey,
};
