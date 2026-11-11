// explore/terrain.js — Mapa de exploración (ExploreMap): rejilla de caracteres `rows` del nivel con
// transitabilidad, coste y cobertura por casilla, caminos A*, línea de visión y casillas libres.
// Si el núcleo de reglas tiene las operaciones xmap_load/xmap_path/xmap_los, las usa (modo «native»);
// si no, calcula en JS. Lo usa explore/index.js (y desde ahí interact, detection y battle).
// Reconstruido de publicado/juego.js (módulo __esm «_S»).

import { cellToPlane, planeToCell, cellKey, neighbors, hexDistance } from './hex.js';

/** Propiedades por carácter del mapa: [transitable, coste (2 = difícil), cobertura 0–3, difícil]. */
const TILE_PROPS = {
  '.': [!0, 1, 0, !1],
  ',': [!0, 1, 0, !1],
  ':': [!0, 1, 0, !1],
  '=': [!0, 1, 0, !1],
  '~': [!0, 2, 0, !0],
  b: [!0, 2, 0, !0],
  x: [!0, 2, 0, !0],
  f: [!0, 2, 1, !0],
  '#': [!1, 0, 3, !1],
  H: [!1, 0, 3, !1],
  B: [!1, 0, 3, !1],
  T: [!1, 0, 3, !1],
  P: [!1, 0, 3, !1],
  S: [!1, 0, 3, !1],
  r: [!1, 0, 1, !1],
  c: [!1, 0, 1, !1],
  g: [!1, 0, 1, !1],
  w: [!1, 0, 0, !1],
  o: [!1, 0, 1, !1],
  O: [!1, 0, 3, !1],
  ' ': [!1, 0, 0, !1],
};
const DEFAULT_TILE = TILE_PROPS['.'];
/** Mapa de exploración de un nivel. `api` es el envoltorio de reglas (opcional, con `call`). */
const ExploreMap = class {
  constructor(api = null) {
    ((this.api = api),
      (this.native = !1),
      (this.rows = []),
      (this.w = 0),
      (this.h = 0),
      (this.losCache = new Map()),
      (this.stats = { path: 0, los: 0, losHits: 0 }));
  }
  /** Carga las filas del mapa (se rellenan con espacios) y avisa al núcleo con xmap_load. */
  load(rows) {
    ((this.rows = rows.map((row) => row)),
      (this.h = rows.length),
      (this.w = Math.max(0, ...rows.map((row) => row.length))),
      (this.rows = this.rows.map((row) => row.padEnd(this.w, ' '))));
    let size = this.w * this.h;
    ((this.walk = new Uint8Array(size)),
      (this.cost = new Uint8Array(size)),
      (this.cover = new Uint8Array(size)));
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        let props = TILE_PROPS[this.rows[y][x]] || DEFAULT_TILE,
          idx = x + y * this.w;
        ((this.walk[idx] = props[0] ? 1 : 0), (this.cost[idx] = props[1]), (this.cover[idx] = props[2]));
      }
    if ((this.losCache.clear(), (this.native = !1), this.api?.call)) {
      let res = this.api.call('xmap_load', { rows: this.rows });
      this.native = !!(res && !res.error && res.w);
    }
    return { w: this.w, h: this.h };
  }
  /** Cambia el carácter de una casilla (p. ej. puerta abierta) y recarga el mapa. */
  setTile(cell, ch) {
    let [x, y] = cell;
    if (!this.inBounds(cell)) return;
    let row = this.rows[y];
    row[x] !== ch && ((this.rows[y] = row.slice(0, x) + ch + row.slice(x + 1)), this.load(this.rows));
  }
  inBounds([x, y]) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }
  tile([x, y]) {
    return this.inBounds([x, y]) ? this.rows[y][x] : ' ';
  }
  /** ¿Se puede pisar la casilla? */
  walkable(cell) {
    return this.inBounds(cell) && this.walk[cell[0] + cell[1] * this.w] === 1;
  }
  /** ¿Es terreno difícil (coste > 1)? */
  difficult(cell) {
    return this.inBounds(cell) && this.cost[cell[0] + cell[1] * this.w] > 1;
  }
  /** Camino de casillas de `from` a `to` evitando `blocked` (Set de claves «x,y»); [] si no hay. */
  path(from, to, blocked = null, maxSteps = 6e3) {
    if ((this.stats.path++, from[0] === to[0] && from[1] === to[1])) return [from.slice()];
    if (this.native) {
      let blockedCells = blocked ? [...blocked].map((key) => key.split(',').map(Number)) : void 0,
        res = this.api.call('xmap_path', { from: from, to: to, blocked: blockedCells });
      if (res && !res.error && Array.isArray(res.path)) return res.path;
    }
    return this._astar(from, to, blocked, maxSteps);
  }
  /** A* en JS con montículo binario (coste 2 en terreno difícil). */
  _astar(from, to, blocked, maxSteps) {
    let width = this.w;
    if (!this.inBounds(to) || !this.walkable(to) || !this.inBounds(from)) return [];
    if (blocked && blocked.has(cellKey(to[0], to[1]))) return [];
    let size = width * this.h,
      dist = new Int32Array(size).fill(1 << 29),
      prev = new Int32Array(size).fill(-1),
      start = from[0] + from[1] * width,
      goal = to[0] + to[1] * width;
    dist[start] = 0;
    let heap = [],
      push = (prio, node) => {
        heap.push([prio, node]);
        let i = heap.length - 1;
        for (; i > 0;) {
          let parent = (i - 1) >> 1;
          if (heap[parent][0] <= heap[i][0]) break;
          (([heap[parent], heap[i]] = [heap[i], heap[parent]]), (i = parent));
        }
      },
      pop = () => {
        let top = heap[0],
          last = heap.pop();
        if (heap.length) {
          heap[0] = last;
          let i = 0;
          for (;;) {
            let left = 2 * i + 1,
              right = left + 1,
              min = i;
            if (
              (left < heap.length && heap[left][0] < heap[min][0] && (min = left),
              right < heap.length && heap[right][0] < heap[min][0] && (min = right),
              min === i)
            )
              break;
            (([heap[min], heap[i]] = [heap[i], heap[min]]), (i = min));
          }
        }
        return top;
      };
    push(hexDistance(from, to), start);
    let steps = 0,
      found = !1;
    for (; heap.length && steps++ < maxSteps;) {
      let [, cur] = pop();
      if (cur === goal) {
        found = !0;
        break;
      }
      let cx = cur % width,
        cy = (cur / width) | 0;
      for (let [nx, ny] of neighbors(cx, cy)) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= this.h) continue;
        let next = nx + ny * width;
        if (!this.walk[next] || (blocked && next !== goal && blocked.has(cellKey(nx, ny)))) continue;
        let cost = dist[cur] + (this.cost[next] > 1 ? 2 : 1);
        cost < dist[next] &&
          ((dist[next] = cost), (prev[next] = cur), push(cost + hexDistance([nx, ny], to), next));
      }
    }
    if (!found) return [];
    let out = [];
    for (
      let node = goal;
      node >= 0 && (out.push([node % width, (node / width) | 0]), node !== start);
      node = prev[node]
    );
    return out.reverse();
  }
  /** Línea de visión entre casillas (con caché); falsa si la cobertura es total (3). */
  los(from, to) {
    if ((from[0] === to[0] && from[1] === to[1]) || hexDistance(from, to) <= 1) return !0;
    let key = `${from[0]},${from[1]}|${to[0]},${to[1]}`,
      cached = this.losCache.get(key);
    if (cached !== void 0) return (this.stats.losHits++, cached);
    this.stats.los++;
    let visible;
    if (this.native) {
      let res = this.api.call('xmap_los', { from: from, to: to });
      visible = res && !res.error ? !!res.los : this._coverHex(from, to) < 3;
    } else visible = this._coverHex(from, to) < 3;
    return (this.losCache.size > 2e4 && this.losCache.clear(), this.losCache.set(key, visible), visible);
  }
  /** Casillas que atraviesa el segmento entre dos puntos del plano, muestreado cada `step`. */
  _segment(from, to, step = 0.12) {
    let cells = [],
      seen = new Set(),
      len = Math.hypot(to.x - from.x, to.y - from.y),
      count = Math.max(1, Math.ceil(len / step));
    for (let i = 0; i <= count; i++) {
      let f = i / count,
        cell = planeToCell(from.x + (to.x - from.x) * f, from.y + (to.y - from.y) * f),
        code = cell[0] * 4096 + cell[1];
      seen.has(code) || (seen.add(code), cells.push(cell));
    }
    return cells;
  }
  _coverAt(cell) {
    return this.inBounds(cell) ? this.cover[cell[0] + cell[1] * this.w] : 0;
  }
  /** Cobertura 0–3: cuántos de los 3 rayos (centro y bordes) quedan tapados por casillas opacas. */
  _coverHex(from, to) {
    let pa = cellToPlane(from[0], from[1]),
      pb = cellToPlane(to[0], to[1]),
      len = Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1,
      dir = { x: (pb.x - pa.x) / len, y: (pb.y - pa.y) / len },
      side = { x: -dir.y * 0.38, y: dir.x * 0.38 },
      fromPts = [pa, { x: pa.x + side.x, y: pa.y + side.y }, { x: pa.x - side.x, y: pa.y - side.y }],
      toPts = [pb, { x: pb.x + side.x, y: pb.y + side.y }, { x: pb.x - side.x, y: pb.y - side.y }],
      best = 99;
    for (let p0 of fromPts) {
      let blockedRays = 0;
      for (let p1 of toPts)
        for (let cell of this._segment(p0, p1, 0.18))
          if (
            !((cell[0] === from[0] && cell[1] === from[1]) || (cell[0] === to[0] && cell[1] === to[1])) &&
            this._coverAt(cell) >= 3
          ) {
            blockedRays++;
            break;
          }
      best = Math.min(best, blockedRays);
    }
    return best >= 3 ? 3 : best;
  }
  /** ¿El segmento entre dos puntos del plano pasa solo por casillas transitables y libres? */
  straight(from, to, blocked = null) {
    for (let cell of this._segment(from, to, 0.18))
      if (!this.walkable(cell) || (blocked && blocked.has(cellKey(cell[0], cell[1])))) return !1;
    return !0;
  }
  /** Hasta `count` casillas transitables y libres cerca de `center` (búsqueda en anchura). */
  freeNear(center, count, blocked = null, { maxR: maxR = 12 } = {}) {
    let out = [],
      seen = new Set([cellKey(center[0], center[1])]),
      queue = [center];
    for (; queue.length && out.length < count;) {
      let cell = queue.shift();
      this.walkable(cell) && !(blocked && blocked.has(cellKey(cell[0], cell[1]))) && out.push(cell);
      for (let nb of neighbors(cell[0], cell[1])) {
        let key = cellKey(nb[0], nb[1]);
        seen.has(key) ||
          !this.inBounds(nb) ||
          hexDistance(nb, center) > maxR ||
          (seen.add(key), queue.push(nb));
      }
    }
    return out;
  }
};

export { ExploreMap };
