// explore/terrain.js
// Reconstruido de publicado/juego.js (módulo __esm «_S»). Nombres locales aún minificados.

import { cellToPlane, planeToCell, cellKey, neighbors, hexDistance } from './hex.js';

const xS = {
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
const bI = xS['.'];
const Tm = class {
  constructor(e = null) {
    ((this.api = e),
      (this.native = !1),
      (this.rows = []),
      (this.w = 0),
      (this.h = 0),
      (this.losCache = new Map()),
      (this.stats = { path: 0, los: 0, losHits: 0 }));
  }
  load(e) {
    ((this.rows = e.map((a) => a)),
      (this.h = e.length),
      (this.w = Math.max(0, ...e.map((a) => a.length))),
      (this.rows = this.rows.map((a) => a.padEnd(this.w, ' '))));
    let t = this.w * this.h;
    ((this.walk = new Uint8Array(t)), (this.cost = new Uint8Array(t)), (this.cover = new Uint8Array(t)));
    for (let a = 0; a < this.h; a++)
      for (let n = 0; n < this.w; n++) {
        let s = xS[this.rows[a][n]] || bI,
          i = n + a * this.w;
        ((this.walk[i] = s[0] ? 1 : 0), (this.cost[i] = s[1]), (this.cover[i] = s[2]));
      }
    if ((this.losCache.clear(), (this.native = !1), this.api?.call)) {
      let a = this.api.call('xmap_load', { rows: this.rows });
      this.native = !!(a && !a.error && a.w);
    }
    return { w: this.w, h: this.h };
  }
  setTile(e, t) {
    let [a, n] = e;
    if (!this.inBounds(e)) return;
    let s = this.rows[n];
    s[a] !== t && ((this.rows[n] = s.slice(0, a) + t + s.slice(a + 1)), this.load(this.rows));
  }
  inBounds([e, t]) {
    return e >= 0 && t >= 0 && e < this.w && t < this.h;
  }
  tile([e, t]) {
    return this.inBounds([e, t]) ? this.rows[t][e] : ' ';
  }
  walkable(e) {
    return this.inBounds(e) && this.walk[e[0] + e[1] * this.w] === 1;
  }
  difficult(e) {
    return this.inBounds(e) && this.cost[e[0] + e[1] * this.w] > 1;
  }
  path(e, t, a = null, n = 6e3) {
    if ((this.stats.path++, e[0] === t[0] && e[1] === t[1])) return [e.slice()];
    if (this.native) {
      let s = a ? [...a].map((r) => r.split(',').map(Number)) : void 0,
        i = this.api.call('xmap_path', { from: e, to: t, blocked: s });
      if (i && !i.error && Array.isArray(i.path)) return i.path;
    }
    return this._astar(e, t, a, n);
  }
  _astar(e, t, a, n) {
    let s = this.w;
    if (!this.inBounds(t) || !this.walkable(t) || !this.inBounds(e)) return [];
    if (a && a.has(cellKey(t[0], t[1]))) return [];
    let i = s * this.h,
      r = new Int32Array(i).fill(1 << 29),
      l = new Int32Array(i).fill(-1),
      c = e[0] + e[1] * s,
      d = t[0] + t[1] * s;
    r[c] = 0;
    let u = [],
      h = (f, v) => {
        u.push([f, v]);
        let x = u.length - 1;
        for (; x > 0;) {
          let g = (x - 1) >> 1;
          if (u[g][0] <= u[x][0]) break;
          (([u[g], u[x]] = [u[x], u[g]]), (x = g));
        }
      },
      p = () => {
        let f = u[0],
          v = u.pop();
        if (u.length) {
          u[0] = v;
          let x = 0;
          for (;;) {
            let g = 2 * x + 1,
              y = g + 1,
              w = x;
            if (
              (g < u.length && u[g][0] < u[w][0] && (w = g),
              y < u.length && u[y][0] < u[w][0] && (w = y),
              w === x)
            )
              break;
            (([u[w], u[x]] = [u[x], u[w]]), (x = w));
          }
        }
        return f;
      };
    h(hexDistance(e, t), c);
    let m = 0,
      _ = !1;
    for (; u.length && m++ < n;) {
      let [, f] = p();
      if (f === d) {
        _ = !0;
        break;
      }
      let v = f % s,
        x = (f / s) | 0;
      for (let [g, y] of neighbors(v, x)) {
        if (g < 0 || y < 0 || g >= s || y >= this.h) continue;
        let w = g + y * s;
        if (!this.walk[w] || (a && w !== d && a.has(cellKey(g, y)))) continue;
        let k = r[f] + (this.cost[w] > 1 ? 2 : 1);
        k < r[w] && ((r[w] = k), (l[w] = f), h(k + hexDistance([g, y], t), w));
      }
    }
    if (!_) return [];
    let b = [];
    for (let f = d; f >= 0 && (b.push([f % s, (f / s) | 0]), f !== c); f = l[f]);
    return b.reverse();
  }
  los(e, t) {
    if ((e[0] === t[0] && e[1] === t[1]) || hexDistance(e, t) <= 1) return !0;
    let a = `${e[0]},${e[1]}|${t[0]},${t[1]}`,
      n = this.losCache.get(a);
    if (n !== void 0) return (this.stats.losHits++, n);
    this.stats.los++;
    let s;
    if (this.native) {
      let i = this.api.call('xmap_los', { from: e, to: t });
      s = i && !i.error ? !!i.los : this._coverHex(e, t) < 3;
    } else s = this._coverHex(e, t) < 3;
    return (this.losCache.size > 2e4 && this.losCache.clear(), this.losCache.set(a, s), s);
  }
  _segment(e, t, a = 0.12) {
    let n = [],
      s = new Set(),
      i = Math.hypot(t.x - e.x, t.y - e.y),
      r = Math.max(1, Math.ceil(i / a));
    for (let l = 0; l <= r; l++) {
      let c = l / r,
        d = planeToCell(e.x + (t.x - e.x) * c, e.y + (t.y - e.y) * c),
        u = d[0] * 4096 + d[1];
      s.has(u) || (s.add(u), n.push(d));
    }
    return n;
  }
  _coverAt(e) {
    return this.inBounds(e) ? this.cover[e[0] + e[1] * this.w] : 0;
  }
  _coverHex(e, t) {
    let a = cellToPlane(e[0], e[1]),
      n = cellToPlane(t[0], t[1]),
      s = Math.hypot(n.x - a.x, n.y - a.y) || 1,
      i = { x: (n.x - a.x) / s, y: (n.y - a.y) / s },
      r = { x: -i.y * 0.38, y: i.x * 0.38 },
      l = [a, { x: a.x + r.x, y: a.y + r.y }, { x: a.x - r.x, y: a.y - r.y }],
      c = [n, { x: n.x + r.x, y: n.y + r.y }, { x: n.x - r.x, y: n.y - r.y }],
      d = 99;
    for (let u of l) {
      let h = 0;
      for (let p of c)
        for (let m of this._segment(u, p, 0.18))
          if (
            !((m[0] === e[0] && m[1] === e[1]) || (m[0] === t[0] && m[1] === t[1])) &&
            this._coverAt(m) >= 3
          ) {
            h++;
            break;
          }
      d = Math.min(d, h);
    }
    return d >= 3 ? 3 : d;
  }
  straight(e, t, a = null) {
    for (let n of this._segment(e, t, 0.18))
      if (!this.walkable(n) || (a && a.has(cellKey(n[0], n[1])))) return !1;
    return !0;
  }
  freeNear(e, t, a = null, { maxR: n = 12 } = {}) {
    let s = [],
      i = new Set([cellKey(e[0], e[1])]),
      r = [e];
    for (; r.length && s.length < t;) {
      let l = r.shift();
      this.walkable(l) && !(a && a.has(cellKey(l[0], l[1]))) && s.push(l);
      for (let c of neighbors(l[0], l[1])) {
        let d = cellKey(c[0], c[1]);
        i.has(d) || !this.inBounds(c) || hexDistance(c, e) > n || (i.add(d), r.push(c));
      }
    }
    return s;
  }
};

export { Tm };
