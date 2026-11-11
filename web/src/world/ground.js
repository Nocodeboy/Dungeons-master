// world/ground.js
// Reconstruido de publicado/juego.js (módulo __esm «Zr»). Nombres locales aún minificados.

import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DataTexture,
  DoubleSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  NoColorSpace,
  PlaneGeometry,
  RGBAFormat,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
  Vector4,
} from 'three';
import {
  makeRng,
  cellToWorld,
  worldToCell,
  neighbors,
  smoothstep,
  makeNoise,
  HEX_SIZE,
  cellKey,
} from './grid.js';
import { worldUniforms } from './materials.js';

function z3(o, e = !0) {
  return Bu(`assets/tex/${o}.webp`, e);
}
function Bu(o, e) {
  let t = o + e;
  if (!k1.has(t)) {
    let a = IH.load(o);
    ((a.wrapS = a.wrapT = RepeatWrapping),
      (a.colorSpace = e ? SRGBColorSpace : NoColorSpace),
      (a.anisotropy = 8),
      k1.set(t, a));
  }
  return k1.get(t);
}
function A1(o, e, t, a) {
  let n = new Float32Array(o.length);
  for (let s = 0; s < 2; s++) {
    for (let i = 0; i < t; i++)
      for (let r = 0; r < e; r++) {
        let l = 0,
          c = 0;
        for (let d = -a; d <= a; d++) {
          let u = r + d;
          u < 0 || u >= e || ((l += o[i * e + u]), c++);
        }
        n[i * e + r] = l / c;
      }
    for (let i = 0; i < t; i++)
      for (let r = 0; r < e; r++) {
        let l = 0,
          c = 0;
        for (let d = -a; d <= a; d++) {
          let u = i + d;
          u < 0 || u >= t || ((l += n[u * e + r]), c++);
        }
        o[i * e + r] = l / c;
      }
  }
}
const Xm = 'assets/tex/';
const LH = {
  outdoor: {
    grass: ['leafy_grass', 0.2],
    dirt: ['rocky_trail', 0.24],
    pave: ['grassy_cobblestone', 0.3],
    mud: ['brown_mud_02', 0.3],
    litter: ['forest_floor', 0.25],
    gravel: ['river_small_rocks', 0.32],
  },
  forest: {
    grass: ['leafy_grass', 0.2],
    dirt: ['forest_ground_04', 0.24],
    pave: ['grassy_cobblestone', 0.3],
    mud: ['brown_mud_02', 0.3],
    litter: ['forest_floor', 0.22],
    gravel: ['river_small_rocks', 0.32],
  },
  inn: {
    grass: ['old_wood_floor', 0.4],
    dirt: ['slate_floor', 0.3],
    pave: ['monastery_stone_floor', 0.45],
    mud: ['brown_mud_02', 0.3],
    litter: ['old_wood_floor', 0.4],
    gravel: ['river_small_rocks', 0.32],
  },
  crypt: {
    grass: ['monastery_stone_floor', 0.32],
    dirt: ['forest_ground_04', 0.3],
    pave: ['medieval_blocks_06', 0.3],
    mud: ['brown_mud_02', 0.3],
    litter: ['slate_floor', 0.3],
    gravel: ['river_small_rocks', 0.32],
  },
};
const DH = new Set([
  'grassy_cobblestone',
  'brown_mud_02',
  'river_small_rocks',
  'forest_floor',
  'rocky_trail',
]);
const IH = new TextureLoader();
const k1 = new Map();
const Le = { path: 0, pave: 1, mud: 2, litter: 3, gravel: 4, ao: 5, light: 6, field: 7 };
const Ym = class {
  constructor(e, t, { ambient: a = 'dusk', quality: n, seed: s = 1, margin: i = 12 } = {}) {
    ((this.map = e),
      (this.level = t),
      (this.ambient = a),
      (this.inn = a === 'inn'),
      (this.crypt = a === 'crypt' || this.inn),
      (this.quality = n),
      (this.rnd = makeRng(s)),
      (this.noise = makeNoise(s + 7)),
      (this.margin = i),
      (this.x0 = -HEX_SIZE * 0.5 - i),
      (this.z0 = -HEX_SIZE * 0.5 - i),
      (this.x1 = e.sizeX + i),
      (this.z1 = e.sizeZ + HEX_SIZE * 0.5 + i),
      (this.S = n.level === 0 ? 4 : 6),
      (this.cw = Math.ceil((this.x1 - this.x0) * this.S)),
      (this.chh = Math.ceil((this.z1 - this.z0) * this.S)),
      (this.layers = []));
    for (let r = 0; r < 8; r++) {
      let l = document.createElement('canvas');
      ((l.width = this.cw), (l.height = this.chh));
      let c = l.getContext('2d', { willReadFrequently: !0 });
      ((c.fillStyle = '#000'),
        c.fillRect(0, 0, this.cw, this.chh),
        (c.globalCompositeOperation = 'lighter'),
        this.layers.push({ cv: l, g: c }));
    }
    ((this.groundKind = t.ground || {}), this.buildHeights());
  }
  kindOf(e, t) {
    let a = this.map,
      n = a.tile(e, t),
      s = a.paint.get(cellKey(e, t));
    if (s) return s === 'dirt' ? 'field' : s === 'paved' ? 'pave' : s;
    if (this.groundKind[n]) {
      let i = this.groundKind[n];
      return i === 'paved' ? 'pave' : i;
    }
    switch (n) {
      case ':':
        return 'path';
      case '.':
        return this.inn ? 'grass' : this.crypt ? 'pave' : 'dirt';
      case '=':
      case 'P':
      case 'S':
        return 'pave';
      case '~':
        return 'mud';
      case 'w':
        return 'water';
      case 'x':
        return 'rubble';
      case 'H':
      case 'B':
        return 'dirt';
      case '#':
        return this.crypt ? 'rock' : 'hill';
      case ' ':
        return 'void';
      default:
        return 'grass';
    }
  }
  buildHeights() {
    let e = this.map,
      t = 0.5;
    ((this.hr = t),
      (this.hw = Math.ceil((this.x1 - this.x0) / t) + 1),
      (this.hh = Math.ceil((this.z1 - this.z0) / t) + 1));
    let a = new Float32Array(this.hw * this.hh),
      n = new Float32Array(this.hw * this.hh),
      s = new Float32Array(this.hw * this.hh),
      i = new Vector3();
    (e.each((m, _, b) => {
      if (b !== 'w' && b !== '~') return;
      cellToWorld(m, _, i);
      let f = b === 'w' ? n : s,
        v = b === 'w' ? 1.05 : 0.95,
        x = Math.floor((i.x - v - this.x0) / t),
        g = Math.ceil((i.x + v - this.x0) / t),
        y = Math.floor((i.z - v - this.z0) / t),
        w = Math.ceil((i.z + v - this.z0) / t);
      for (let k = y; k <= w; k++)
        for (let T = x; T <= g; T++) {
          if (T < 0 || k < 0 || T >= this.hw || k >= this.hh) continue;
          let E = this.x0 + T * t,
            S = this.z0 + k * t,
            z = Math.hypot(E - i.x, S - i.z) / v,
            D = Math.max(0, 1 - z * z);
          f[k * this.hw + T] = Math.max(f[k * this.hw + T], D);
        }
    }),
      A1(n, this.hw, this.hh, 2),
      A1(s, this.hw, this.hh, 1),
      (this.waterField = n));
    let r = new Float32Array(this.hw * this.hh);
    if (!this.crypt) {
      let m = new Map(),
        _ = [];
      for (
        e.each((b, f, v) => {
          v !== '#' && (m.set(cellKey(b, f), 0), _.push([b, f]));
        });
        _.length;
      ) {
        let [b, f] = _.shift(),
          v = m.get(cellKey(b, f));
        for (let [x, g] of neighbors(b, f))
          !e.inside(x, g) || m.has(cellKey(x, g)) || (m.set(cellKey(x, g), v + 1), _.push([x, g]));
      }
      this.hillDist = m;
      for (let b = 0; b < this.hh; b++)
        for (let f = 0; f < this.hw; f++) {
          let [v, x] = worldToCell(this.x0 + f * t, this.z0 + b * t);
          e.tile(v, x) === '#' && (r[b * this.hw + f] = smoothstep(0.5, 3, m.get(cellKey(v, x)) || 0));
        }
      A1(r, this.hw, this.hh, 1);
      for (let b = 0; b < this.hh; b++)
        for (let f = 0; f < this.hw; f++) {
          let [v, x] = worldToCell(this.x0 + f * t, this.z0 + b * t);
          e.inside(v, x) && e.tile(v, x) !== '#' && (r[b * this.hw + f] = 0);
        }
    }
    let l = this.noise,
      c = -HEX_SIZE * 0.5,
      d = e.sizeX,
      u = -HEX_SIZE * 0.5,
      h = e.sizeZ + HEX_SIZE * 0.5,
      p = this.edgeWater();
    for (let m = 0; m < this.hh; m++)
      for (let _ = 0; _ < this.hw; _++) {
        let b = this.x0 + _ * t,
          f = this.z0 + m * t,
          v = Math.max(c - b, b - d, u - f, f - h, 0),
          x = l.fbm(b * 0.11, f * 0.11, 3) * 0.06;
        if (this.crypt) {
          a[m * this.hw + _] = 0;
          continue;
        }
        if (v > 0) {
          let y = smoothstep(0.5, 9, v) * (0.9 + 1.6 * (0.5 + l.fbm(b * 0.045, f * 0.045, 3)));
          x += y * (this.ambient === 'kesh' ? 1.4 : 1);
          let w = p(b, f);
          ((x *= 1 - w.path * 0.85), (x -= w.water * 0.55));
        }
        x += r[m * this.hw + _] * 2.6;
        let g = n[m * this.hw + _] + (v > 0 ? p(b, f).water : 0);
        ((x -= Math.min(1, g * 1.2) * 0.95), (x -= s[m * this.hw + _] * 0.08), (a[m * this.hw + _] = x));
      }
    this.H = a;
  }
  edgeWater() {
    let e = this.map,
      t = [],
      a = new Vector3();
    return (
      e.each((n, s, i) => {
        if (!(n === 0 || s === 0 || n === e.w - 1 || s === e.h - 1)) return;
        let l =
          i === 'w' || i === '~'
            ? 'water'
            : i === ':' || (i === '.' && this.kindOf(n, s) !== 'grass')
              ? 'path'
              : null;
        if (!l) return;
        cellToWorld(n, s, a);
        let c = new Vector2(n === 0 ? -1 : n === e.w - 1 ? 1 : 0, s === 0 ? -1 : s === e.h - 1 ? 1 : 0);
        (c.lengthSq() > 1 && c.normalize(), t.push({ x: a.x, z: a.z, dx: c.x, dz: c.y, kind: l }));
      }),
      (this.exits = t),
      (n, s) => {
        let i = 0,
          r = 0;
        for (let l of t) {
          let c = n - l.x,
            d = s - l.z,
            u = c * l.dx + d * l.dz;
          if (u < 0) continue;
          let h = Math.abs(c * -l.dz + d * l.dx),
            p = this.noise(u * 0.15 + l.x, l.z) * 1.2,
            m =
              1 -
              smoothstep(
                l.kind === 'water' ? 0.6 : 0.8,
                l.kind === 'water' ? 1.6 : 2.4,
                Math.abs(h - p * 0.3),
              );
          l.kind === 'water' ? (i = Math.max(i, m)) : (r = Math.max(r, m));
        }
        return { water: i, path: r };
      }
    );
  }
  heightAt(e, t) {
    let a = (e - this.x0) / this.hr,
      n = (t - this.z0) / this.hr,
      s = Math.max(0, Math.min(this.hw - 2, Math.floor(a))),
      i = Math.max(0, Math.min(this.hh - 2, Math.floor(n))),
      r = Math.min(1, Math.max(0, a - s)),
      l = Math.min(1, Math.max(0, n - i)),
      c = this.H,
      d = c[i * this.hw + s],
      u = c[i * this.hw + s + 1],
      h = c[(i + 1) * this.hw + s],
      p = c[(i + 1) * this.hw + s + 1];
    return d + (u - d) * r + (h - d) * l + (d - u - h + p) * r * l;
  }
  waterAt(e, t) {
    let a = Math.round((e - this.x0) / this.hr),
      n = Math.round((t - this.z0) / this.hr);
    return a < 0 || n < 0 || a >= this.hw || n >= this.hh ? 0 : this.waterField[n * this.hw + a];
  }
  px(e) {
    return (e - this.x0) * this.S;
  }
  pz(e) {
    return (e - this.z0) * this.S;
  }
  blob(e, t, a, n, s = 1, i = 0.5) {
    let r = this.layers[e].g,
      l = this.px(t),
      c = this.pz(a),
      d = n * this.S,
      u = r.createRadialGradient(l, c, 0, l, c, d),
      h = Math.round(s * 255);
    (u.addColorStop(0, `rgb(${h},${h},${h})`),
      u.addColorStop(i, `rgb(${Math.round(h * 0.8)},${Math.round(h * 0.8)},${Math.round(h * 0.8)})`),
      u.addColorStop(1, 'rgb(0,0,0)'),
      (r.fillStyle = u),
      r.fillRect(l - d, c - d, d * 2, d * 2));
  }
  splotch(e, t, a, n, s = 1, i = 4) {
    for (let r = 0; r < i; r++) {
      let l = this.rnd() * Math.PI * 2,
        c = this.rnd() * n * 0.45;
      this.blob(
        e,
        t + Math.cos(l) * c,
        a + Math.sin(l) * c,
        n * (0.55 + this.rnd() * 0.35),
        s * (0.6 + this.rnd() * 0.4),
      );
    }
  }
  stroke(e, t, a, n = 1, s = 4) {
    let i = this.layers[e].g;
    (i.save(), (i.filter = `blur(${s}px)`));
    let r = Math.round(n * 255);
    ((i.strokeStyle = `rgb(${r},${r},${r})`),
      (i.lineWidth = a * this.S),
      (i.lineCap = 'round'),
      (i.lineJoin = 'round'),
      i.beginPath(),
      i.moveTo(this.px(t[0][0]), this.pz(t[0][1])));
    for (let l = 1; l < t.length; l++) i.lineTo(this.px(t[l][0]), this.pz(t[l][1]));
    (i.stroke(), i.restore());
  }
  hexFill(e, t, a, n = 1, s = 1.08, i = 2) {
    let r = this.layers[e].g,
      l = cellToWorld(t, a),
      c = 0.5773503 * HEX_SIZE * s;
    (r.save(), (r.filter = `blur(${i}px)`));
    let d = Math.round(n * 255);
    ((r.fillStyle = `rgb(${d},${d},${d})`), r.beginPath());
    for (let u = 0; u < 6; u++) {
      let h = (Math.PI / 3) * u + Math.PI / 6,
        p = this.px(l.x + Math.cos(h) * c),
        m = this.pz(l.z + Math.sin(h) * c);
      u === 0 ? r.moveTo(p, m) : r.lineTo(p, m);
    }
    (r.closePath(), r.fill(), r.restore());
  }
  paintTiles() {
    let e = this.map,
      t = new Vector3(),
      a = new Vector3(),
      n = this.rnd,
      s = new Set();
    e.each((r, l, c) => {
      let d = this.kindOf(r, l);
      if ((cellToWorld(r, l, t), d === 'path' || d === 'dirt')) {
        let u = d === 'path' ? 1.55 : 1.9;
        this.blob(Le.path, t.x, t.z, u * 0.62, d === 'path' ? 0.9 : 0.75);
        for (let [h, p] of neighbors(r, l)) {
          let m = this.kindOf(h, p);
          if (m !== 'path' && m !== 'dirt') continue;
          let _ = [cellKey(r, l), cellKey(h, p)].sort().join('|');
          if (s.has(_)) continue;
          (s.add(_), cellToWorld(h, p, a));
          let b = (t.x + a.x) / 2 + (n() - 0.5) * 0.35,
            f = (t.z + a.z) / 2 + (n() - 0.5) * 0.35;
          this.stroke(
            Le.path,
            [
              [t.x, t.z],
              [b, f],
              [a.x, a.z],
            ],
            u * (0.85 + n() * 0.2),
            d === 'path' ? 0.85 : 0.7,
            3,
          );
        }
        (this.blob(Le.path, t.x, t.z, 2.3, 0.18),
          n() < 0.25 && this.blob(Le.mud, t.x + (n() - 0.5), t.z + (n() - 0.5), 0.5 + n() * 0.4, 0.5));
      } else
        d === 'pave'
          ? (this.hexFill(Le.pave, r, l, 1, 1.12, 3), this.blob(Le.path, t.x, t.z, 1.5, 0.25))
          : d === 'mud'
            ? (this.splotch(Le.mud, t.x, t.z, 1.4, 0.95), this.blob(Le.gravel, t.x, t.z, 0.7, 0.25))
            : d === 'water'
              ? (this.blob(Le.gravel, t.x, t.z, 1.5, 1), this.blob(Le.mud, t.x, t.z, 2.1, 0.55))
              : d === 'rubble'
                ? (this.splotch(this.crypt ? Le.path : Le.gravel, t.x, t.z, 1.1, 0.8),
                  this.blob(Le.path, t.x, t.z, 1.2, 0.5))
                : d === 'litter'
                  ? this.splotch(Le.litter, t.x, t.z, 1.3, 0.9)
                  : d === 'hill'
                    ? (n() < 0.5 && this.blob(Le.gravel, t.x + (n() - 0.5), t.z + (n() - 0.5), 0.9, 0.5),
                      this.blob(Le.litter, t.x, t.z, 1.2, 0.35))
                    : d === 'field'
                      ? this.hexFill(Le.field, r, l, 1, 1.18, 4)
                      : d === 'rock' && this.hexFill(Le.path, r, l, 0.8, 1.1, 3);
      c === 'T'
        ? (this.blob(
            Le.litter,
            t.x,
            t.z,
            this.ambient === 'forest' ? 2.2 : 1.6,
            this.ambient === 'forest' ? 0.85 : 0.55,
          ),
          this.blob(Le.ao, t.x, t.z, 1.3, 0.5))
        : c === 'b'
          ? (this.blob(Le.litter, t.x, t.z, 1.2, 0.5), this.blob(Le.ao, t.x, t.z, 0.9, 0.35))
          : c === 'r'
            ? (this.blob(Le.gravel, t.x, t.z, 1.1, 0.6), this.blob(Le.ao, t.x, t.z, 1, 0.55))
            : c === 'c' || c === 'o' || c === 'O'
              ? (this.blob(Le.ao, t.x, t.z, 0.9, 0.4), this.inn || this.blob(Le.path, t.x, t.z, 1, 0.25))
              : c === 'B' || c === 'H'
                ? this.blob(Le.path, t.x, t.z, 1.2, 0.45)
                : c === 'f'
                  ? this.blob(Le.path, t.x, t.z, 0.8, 0.22)
                  : c === ',' &&
                    this.ambient === 'forest' &&
                    n() < 0.35 &&
                    this.blob(Le.litter, t.x + (n() - 0.5), t.z + (n() - 0.5), 1.2 + n(), 0.5);
    });
    for (let r of this.exits || []) {
      let l = [];
      for (let c = 0; c <= this.margin + 4; c += 1.5) {
        let d = this.noise(c * 0.15 + r.x, r.z) * 1.2;
        l.push([r.x + r.dx * c + -r.dz * d * 0.3, r.z + r.dz * c + r.dx * d * 0.3]);
      }
      r.kind === 'path'
        ? (this.stroke(Le.path, l, 1.7, 0.85, 3), this.stroke(Le.path, l, 3.6, 0.15, 8))
        : (this.stroke(Le.gravel, l, 2.6, 1, 4), this.stroke(Le.mud, l, 3.6, 0.5, 6));
    }
    let i = this.inn ? 0 : this.ambient === 'forest' ? 70 : this.crypt ? 30 : 40;
    for (let r = 0; r < i; r++) {
      let l = this.x0 + n() * (this.x1 - this.x0),
        c = this.z0 + n() * (this.z1 - this.z0);
      this.crypt
        ? this.blob(n() < 0.5 ? Le.litter : Le.path, l, c, 1 + n() * 2.5, 0.35)
        : this.blob(this.ambient === 'forest' ? Le.litter : Le.path, l, c, 1.2 + n() * 2.8, 0.12 + n() * 0.2);
    }
  }
  readMasks() {
    let e = this.cw * this.chh,
      t = (n) => this.layers[n].g.getImageData(0, 0, this.cw, this.chh).data,
      a = [new Uint8Array(e * 4), new Uint8Array(e * 4)];
    for (let n = 0; n < 2; n++)
      for (let s = 0; s < 4; s++) {
        let i = t(n * 4 + s),
          r = a[n];
        for (let l = 0; l < e; l++) r[l * 4 + s] = i[l * 4];
      }
    return ((this.maskData = a), a);
  }
  bakeMasks() {
    let e = this.readMasks();
    this.masks = e.map((t) => {
      let a = new DataTexture(t, this.cw, this.chh, RGBAFormat);
      return (
        (a.flipY = !1),
        (a.magFilter = LinearFilter),
        (a.minFilter = LinearMipmapLinearFilter),
        (a.generateMipmaps = !0),
        (a.needsUpdate = !0),
        a
      );
    });
  }
  maskAt(e, t, a) {
    if (!this.maskData) return 0;
    let n = Math.floor(this.px(t)),
      s = Math.floor(this.pz(a));
    return n < 0 || s < 0 || n >= this.cw || s >= this.chh
      ? 0
      : this.maskData[e >> 2][(s * this.cw + n) * 4 + (e & 3)] / 255;
  }
  cellTexture() {
    let e = this.map,
      t = new Uint8Array(e.w * e.h * 4);
    e.each((n, s, i) => {
      let r = !' #'.includes(i) && !(this.crypt && i === '#');
      t[(s * e.w + n) * 4] = r ? 255 : 0;
    });
    let a = new DataTexture(t, e.w, e.h, RGBAFormat);
    return (
      (a.magFilter = NearestFilter),
      (a.minFilter = NearestFilter),
      (a.needsUpdate = !0),
      (this.cellTex = a),
      a
    );
  }
  build(e) {
    this.bakeMasks();
    let t = LH[this.inn ? 'inn' : this.crypt ? 'crypt' : this.ambient === 'forest' ? 'forest' : 'outdoor'],
      a = this.quality.level === 0,
      n = (f) => {
        let v = this.maskData[f >> 2];
        for (let x = f & 3; x < v.length; x += 4) if (v[x] > 6) return !0;
        return !1;
      },
      s = {
        grass: !0,
        dirt: n(Le.path) || n(Le.field),
        pave: n(Le.pave),
        mud: n(Le.mud) || n(Le.field),
        litter: n(Le.litter),
        gravel: n(Le.gravel),
      },
      i = {},
      [r] = t.grass;
    for (let [f, [v, x]] of Object.entries(t)) {
      let g = s[f] ? v : r,
        y = !a && s[f] && ['grass', 'dirt', 'pave', 'gravel'].includes(f);
      i[f] = {
        d: Bu(`${Xm}${g}_diff.webp`, !0),
        n: y ? Bu(`${Xm}${g}_nor.webp`, !1) : null,
        s: x,
        h: DH.has(g),
      };
    }
    let l =
      this.flatNormal ||
      (this.flatNormal = (() => {
        let f = new DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1, RGBAFormat);
        return ((f.needsUpdate = !0), f);
      })());
    this.uniforms = {
      tMask1: { value: this.masks[0] },
      tMask2: { value: this.masks[1] },
      tCells: { value: this.cellTexture() },
      uRect: { value: new Vector4(this.x0, this.z0, this.x1 - this.x0, this.z1 - this.z0) },
      uBoard: { value: new Vector2(this.map.w, this.map.h) },
      uGrid: { value: 0 },
      uGridColor: { value: new Color(this.crypt ? 14207144 : 16773840) },
      uLamp: { value: 0 },
      uLampColor: { value: new Color(16752704) },
      uGrassTint: {
        value: new Color(
          this.inn
            ? 10525332
            : this.ambient === 'forest'
              ? 9676916
              : this.ambient === 'kesh'
                ? 11052674
                : 10663028,
        ),
      },
      uWet: { value: 1 },
      uClouds: { value: 0 },
      uTime: worldUniforms.uTime,
    };
    for (let [f, v] of Object.entries(i))
      ((this.uniforms[`t_${f}`] = { value: v.d }),
        (this.uniforms[`s_${f}`] = { value: v.s }),
        !a &&
          ['grass', 'dirt', 'pave', 'gravel'].includes(f) &&
          (this.uniforms[`n_${f}`] = { value: v.n || l }));
    let c = new MeshStandardMaterial({ color: 16777215, roughness: 0.95, metalness: 0 }),
      d = this.uniforms,
      u = (f) => (i[f].h ? '1.0' : '0.0');
    ((c.onBeforeCompile = (f) => {
      (Object.assign(f.uniforms, d),
        (f.vertexShader = f.vertexShader
          .replace(
            '#include <common>',
            `#include <common>
varying vec3 vWp; varying vec3 vWn;`,
          )
          .replace(
            '#include <worldpos_vertex>',
            `#include <worldpos_vertex>
vWp = (modelMatrix * vec4(transformed, 1.0)).xyz; vWn = normalize(mat3(modelMatrix) * objectNormal);`,
          )));
      let v = Object.keys(d)
          .filter((g) => g.startsWith('t_') || g.startsWith('n_'))
          .map((g) => `uniform sampler2D ${g};`).join(`
`),
        x = Object.keys(d)
          .filter((g) => g.startsWith('s_'))
          .map((g) => `uniform float ${g};`).join(`
`);
      f.fragmentShader = f.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
varying vec3 vWp; varying vec3 vWn;
uniform sampler2D tMask1; uniform sampler2D tMask2; uniform sampler2D tCells;
uniform vec4 uRect; uniform vec2 uBoard; uniform float uGrid; uniform vec3 uGridColor;
uniform float uLamp; uniform vec3 uLampColor; uniform vec3 uGrassTint; uniform float uWet; uniform float uClouds; uniform float uTime;
${v}
${x}
float gLum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
float gH21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float gVn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(gH21(i), gH21(i+vec2(1,0)), f.x), mix(gH21(i+vec2(0,1)), gH21(i+vec2(1,1)), f.x), f.y); }
// Casilla (odd-r) y distancia al borde del hex\xE1gono, en el plano de casillas
vec3 gHex(vec2 p){
  float q = (0.57735027 * p.x - p.y / 3.0) / 0.57735027;
  float r = (2.0 / 3.0 * p.y) / 0.57735027;
  float s = -q - r;
  float rq = floor(q + 0.5), rr = floor(r + 0.5), rs = floor(s + 0.5);
  float dq = abs(rq - q), dr = abs(rr - r), ds = abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs; else if (dr > ds) rr = -rq - rs;
  float row = rr;
  float col = rq + floor((rr - mod(rr, 2.0)) / 2.0);
  vec2 c = vec2(col + 0.5 * mod(row, 2.0), row * 0.8660254);
  vec2 d = abs(p - c);
  float e = 0.5 - max(d.x, d.x * 0.5 + d.y * 0.8660254);
  return vec3(col, row, e);
}`,
        )
        .replace(
          '#include <map_fragment>',
          `
  vec2 w = vWp.xz;
  vec2 muv = (w - uRect.xy) / uRect.zw;
  vec4 m1 = texture2D(tMask1, muv);
  vec4 m2 = texture2D(tMask2, muv);
  // bordes org\xE1nicos: el ruido mueve un poco los l\xEDmites de las capas
  float nz = gVn(w * 1.3) * 0.6 + gVn(w * 4.1) * 0.4;
  float macro = texture2D(t_grass, w * 0.013).g;
  // muestras
  vec4 cg1 = texture2D(t_grass, w * s_grass);
  vec4 cg2 = texture2D(t_grass, w * s_grass * 0.31 + 0.37);
  vec4 cg = mix(cg1, cg2, 0.35);
  vec4 cd = texture2D(t_dirt, w * s_dirt);
  vec4 cp = texture2D(t_pave, w * s_pave);
  vec4 cm = texture2D(t_mud, w * s_mud);
  vec4 cl = texture2D(t_litter, w * s_litter);
  vec4 cr = texture2D(t_gravel, w * s_gravel);
  float hg = ${u('grass')} > 0.5 ? cg.a : gLum(cg.rgb);
  float hd = ${u('dirt')} > 0.5 ? cd.a : gLum(cd.rgb) * 1.2;
  float hp = ${u('pave')} > 0.5 ? cp.a : gLum(cp.rgb) * 1.4;
  float hm = ${u('mud')} > 0.5 ? cm.a : gLum(cm.rgb);
  float hl = ${u('litter')} > 0.5 ? cl.a : gLum(cl.rgb);
  float hr = ${u('gravel')} > 0.5 ? cr.a : gLum(cr.rgb);
  // pesos pintados (con borde roto por el ruido)
  float aP = clamp(m1.r * 1.25 - (nz - 0.5) * 0.45, 0.0, 1.0);
  float aV = clamp(m1.g * 1.3 - (nz - 0.5) * 0.25, 0.0, 1.0);
  float aM = clamp(m1.b * 1.2 - (nz - 0.5) * 0.4, 0.0, 1.0);
  float aL = clamp(m1.a * 1.15 - (nz - 0.5) * 0.5, 0.0, 1.0);
  float aR = clamp(m2.r * 1.2 - (nz - 0.5) * 0.35, 0.0, 1.0);
  float aF = clamp(m2.a, 0.0, 1.0);
  float aG = clamp(1.0 - max(max(max(aP, aV), max(aM, aL)), max(aR, aF)), 0.0, 1.0);
  // mezcla por altura: las piedras asoman sobre el barro y la hierba
  float dep = 0.28;
  float bG = aG + hg * dep, bP = aP + hd * dep, bV = aV + hp * dep * 1.3, bM = aM + hm * dep * 0.6, bL = aL + hl * dep, bR = aR + hr * dep * 1.2, bF = aF + hd * dep * 0.5;
  float mx = max(max(max(bG, bP), max(bV, bM)), max(max(bL, bR), bF)) - 0.12;
  vec4 wA = max(vec4(bG, bP, bV, bM) - mx, 0.0);
  vec3 wB = max(vec3(bL, bR, bF) - mx, 0.0);
  float wsum = wA.x + wA.y + wA.z + wA.w + wB.x + wB.y + wB.z + 1e-4;
  wA /= wsum; wB /= wsum;
  vec3 grassC = cg.rgb * uGrassTint * 1.6;
  grassC *= mix(0.78, 1.16, smoothstep(0.2, 0.75, macro));
  grassC = mix(grassC, grassC * vec3(1.18, 1.02, 0.68), smoothstep(0.55, 0.85, gVn(w * 0.07)) * 0.6);
  vec3 dirtC = cd.rgb * vec3(1.08, 1.0, 0.88);
  vec3 paveC = cp.rgb * 1.02;
  vec3 mudC = cm.rgb * 0.8;
  vec3 litC = cl.rgb * vec3(1.0, 0.95, 0.85);
  vec3 grvC = cr.rgb * 0.95;
  vec3 fieldC = mix(cm.rgb * 1.15, cd.rgb * 0.8, 0.35) * (0.82 + 0.18 * smoothstep(-0.3, 0.3, sin(w.x * 6.0 + gVn(w * 0.5) * 2.0)));
  vec3 gcol = grassC * wA.x + dirtC * wA.y + paveC * wA.z + mudC * wA.w + litC * wB.x + grvC * wB.y + fieldC * wB.z;
  // oscurecido de contacto pintado (bajo casas, \xE1rboles, rocas) y humedad del barro
  float ao = 1.0 - m2.g * 0.55;
  gcol *= ao;
  float wetK = (wA.w + wB.y * 0.6) * uWet;
  // sombras de nubes que pasan (de d\xEDa)
  if (uClouds > 0.001) {
    vec2 cw = w * 0.022 + vec2(uTime * 0.012, uTime * 0.005);
    float cl = smoothstep(0.52, 0.8, gVn(cw) * 0.65 + gVn(cw * 2.3 + 3.1) * 0.35);
    gcol *= 1.0 - cl * 0.22 * uClouds;
  }
  diffuseColor.rgb *= gcol;`,
        )
        .replace(
          '#include <roughnessmap_fragment>',
          `
  float roughnessFactor = mix(roughness, 0.42, wetK * 0.8);`,
        )
        .replace(
          '#include <normal_fragment_maps>',
          a
            ? ''
            : `
  {
    vec3 tn = vec3(0.0);
    tn += (texture2D(n_grass, w * s_grass).xyz * 2.0 - 1.0) * (wA.x + wB.x * 0.5);
    tn += (texture2D(n_dirt, w * s_dirt).xyz * 2.0 - 1.0) * (wA.y + wB.z + wA.w * 0.5);
    tn += (texture2D(n_pave, w * s_pave).xyz * 2.0 - 1.0) * wA.z * 1.4;
    tn += (texture2D(n_gravel, w * s_gravel).xyz * 2.0 - 1.0) * (wB.y * 1.3 + wB.x * 0.5);
    vec3 nW = normalize(vWn + vec3(tn.x, 0.0, tn.y) * 0.9);
    normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz);
  }`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
  totalEmissiveRadiance += uLampColor * m2.b * m2.b * uLamp * 0.55 * gcol * 2.2;
  // rejilla de hex\xE1gonos (solo dentro del tablero)
  if (uGrid > 0.001) {
    vec3 hx = gHex(w / ${HEX_SIZE.toFixed(2)});
    vec2 cuv = (hx.xy + 0.5) / uBoard;
    float inside = step(0.0, hx.x) * step(0.0, hx.y) * step(hx.x, uBoard.x - 1.0) * step(hx.y, uBoard.y - 1.0);
    float on = inside * texture2D(tCells, cuv).r;
    float aa = fwidth(hx.z) * 1.2;
    float line = 1.0 - smoothstep(0.011, 0.011 + aa, hx.z);
    float inner = (1.0 - smoothstep(0.0, 0.16, hx.z)) * 0.18;
    float g = (line * 0.85 + inner) * on * uGrid;
    diffuseColor.rgb = mix(diffuseColor.rgb, uGridColor * 0.9, g * 0.5);
    totalEmissiveRadiance += uGridColor * g * 0.14;
  }`,
        );
    }),
      (c.customProgramCacheKey = () => `suelo|${this.crypt}|${this.ambient}|${a}`),
      (this.material = c));
    let h = this.hw,
      p = this.hh,
      m = new PlaneGeometry(this.x1 - this.x0, this.z1 - this.z0, h - 1, p - 1);
    m.rotateX(-Math.PI / 2);
    let _ = m.getAttribute('position');
    for (let f = 0; f < _.count; f++) {
      let v = _.getX(f) + (this.x0 + this.x1) / 2,
        x = _.getZ(f) + (this.z0 + this.z1) / 2;
      _.setXYZ(f, v, this.heightAt(v, x), x);
    }
    (m.computeVertexNormals(), m.computeBoundingBox(), m.computeBoundingSphere());
    let b = new Mesh(m, c);
    return ((b.receiveShadow = !0), (b.name = 'suelo'), e.add(b), (this.mesh = b), this.buildPlinth(e), b);
  }
  buildPlinth(e) {
    let t = this.crypt ? -1.2 : -2.6,
      a = [],
      n = 0.5,
      s = (E, S) => a.push([E, S]);
    for (let E = this.x0; E < this.x1; E += n) s(E, this.z0);
    for (let E = this.z0; E < this.z1; E += n) s(this.x1, E);
    for (let E = this.x1; E > this.x0; E -= n) s(E, this.z1);
    for (let E = this.z1; E > this.z0; E -= n) s(this.x0, E);
    s(this.x0, this.z0);
    let i = a.length,
      r = new Float32Array(i * 2 * 3),
      l = new Float32Array(i * 2 * 2),
      c = 0;
    for (let E = 0; E < i; E++) {
      let [S, z] = a[E];
      E > 0 && (c += Math.hypot(S - a[E - 1][0], z - a[E - 1][1]));
      let D = this.heightAt(S, z);
      (r.set([S, D, z, S, t, z], E * 6), l.set([c, D, c, t], E * 4));
    }
    let d = [];
    for (let E = 0; E < i - 1; E++) {
      let S = E * 2;
      d.push(S, S + 2, S + 1, S + 1, S + 2, S + 3);
    }
    let u = new BufferGeometry();
    (u.setAttribute('position', new BufferAttribute(r, 3)),
      u.setAttribute('uv', new BufferAttribute(l, 2)),
      u.setIndex(d),
      u.computeVertexNormals());
    let h = Bu(`${Xm}rock_ground_diff.webp`, !0),
      p = new MeshStandardMaterial({ color: 16777215, roughness: 1, side: DoubleSide }),
      m = this.crypt;
    ((p.onBeforeCompile = (E) => {
      ((E.uniforms.tRock = { value: h }),
        (E.vertexShader = E.vertexShader
          .replace(
            '#include <common>',
            `#include <common>
varying vec2 vSide;`,
          )
          .replace(
            '#include <uv_vertex>',
            `#include <uv_vertex>
vSide = uv;`,
          )),
        (E.fragmentShader = E.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
varying vec2 vSide; uniform sampler2D tRock;
float sH(float x){ return fract(sin(x * 91.7) * 4375.85); }`,
          )
          .replace(
            '#include <map_fragment>',
            `
  float d = vSide.x;
  float y = vSide.y;
  vec3 rk = texture2D(tRock, vec2(d * 0.35, y * 0.35)).rgb;
  // estratos: tierra oscura arriba, capas de piedra y arcilla debajo
  float wav = sin(d * 0.9) * 0.08 + sin(d * 2.3 + 1.0) * 0.04;
  float t = y + wav;
  vec3 soil = vec3(0.30, 0.21, 0.14);
  vec3 clay = vec3(0.46, 0.33, 0.22);
  vec3 stone = vec3(0.42, 0.40, 0.37);
  vec3 c = mix(soil, clay, smoothstep(-0.5, -0.9, t));
  c = mix(c, stone, smoothstep(-1.3, -1.6, t) * (1.0 - smoothstep(-1.9, -2.1, t)));
  c = mix(c, clay * 0.8, smoothstep(-2.0, -2.3, t));
  c *= 0.75 + rk * 0.55;
  ${m ? 'c = mix(c, vec3(0.22, 0.21, 0.22) * (0.6 + rk), 0.7);' : ''}
  // labio de hierba en el borde superior
  ${m ? '' : 'c = mix(c, vec3(0.32, 0.36, 0.16) * (0.7 + rk * 0.5), smoothstep(-0.12, -0.02, y));'}
  diffuseColor.rgb *= c;`,
          )));
    }),
      (p.customProgramCacheKey = () => `zocalo|${m}`));
    for (let E = 0; E < i; E++) {
      let S = r[E * 6 + 1];
      ((l[E * 4 + 1] = 0), (l[E * 4 + 3] = t - S));
    }
    u.getAttribute('uv').needsUpdate = !0;
    let _ = new Mesh(u, p);
    ((_.receiveShadow = !0), (_.name = 'zocalo'), e.add(_));
    let b = Bu(`${Xm}medieval_wood_diff.webp`, !0).clone();
    (b.repeat.set(8, 0.4), (b.needsUpdate = !0));
    let f = new MeshStandardMaterial({ map: b, color: 6964784, roughness: 0.55, metalness: 0 }),
      v = this.x1 - this.x0,
      x = this.z1 - this.z0,
      g = new Mesh(new BoxGeometry(v + 0.9, 0.9, x + 0.9), f);
    (g.position.set((this.x0 + this.x1) / 2, t - 0.45, (this.z0 + this.z1) / 2),
      (g.receiveShadow = !0),
      (g.name = 'base'),
      e.add(g));
    let y = new MeshStandardMaterial({ color: 13146698, roughness: 0.32, metalness: 0.85 }),
      w = new Mesh(new BoxGeometry(v + 0.96, 0.06, x + 0.96), y);
    (w.position.set(g.position.x, t - 0.02, g.position.z), e.add(w));
    let k = this.level.name || '',
      T = null;
    if (k) {
      let E = document.createElement('canvas');
      ((E.width = 1024), (E.height = 128));
      let S = E.getContext('2d'),
        z = S.createLinearGradient(0, 0, 0, 128);
      (z.addColorStop(0, '#d9b36a'),
        z.addColorStop(0.5, '#a9803c'),
        z.addColorStop(1, '#7a5a26'),
        (S.fillStyle = z),
        S.fillRect(0, 0, 1024, 128),
        (S.strokeStyle = '#5a3f18'),
        (S.lineWidth = 6),
        S.strokeRect(8, 8, 1008, 112),
        (S.fillStyle = '#3a2810'),
        (S.font = '600 64px Cinzel, "Alegreya SC", Georgia, serif'),
        (S.textAlign = 'center'),
        (S.textBaseline = 'middle'),
        S.fillText(k.toUpperCase(), 512, 68));
      let D = new CanvasTexture(E);
      ((D.colorSpace = SRGBColorSpace),
        (D.anisotropy = 4),
        (T = new Mesh(
          new PlaneGeometry(5.2, 0.62),
          new MeshStandardMaterial({ map: D, roughness: 0.35, metalness: 0.75 }),
        )),
        T.position.set((this.x0 + this.x1) / 2, t - 0.45, this.z1 + 0.455),
        e.add(T));
    }
    ((this.plinth = [_, g, w, ...(T ? [T] : [])]), (this.bottom = t));
  }
  raycast(e, t = 400) {
    let a = e.origin,
      n = e.direction;
    if (n.y >= -1e-4 && a.y < -3) return null;
    let s = 0,
      i = a.y - this.heightAt(a.x, a.z),
      r = 0.4;
    (a.y > 4 && n.y < 0 && (s = Math.max(0, (a.y - 4) / -n.y)),
      (i = a.y + n.y * s - this.heightAt(a.x + n.x * s, a.z + n.z * s)));
    for (let l = 0; l < 600 && s < t; l++) {
      let c = s + r,
        d = a.y + n.y * c,
        u = a.x + n.x * c,
        h = a.z + n.z * c,
        p = d - this.heightAt(u, h);
      if (p <= 0) {
        let m = s,
          _ = c;
        for (let f = 0; f < 10; f++) {
          let v = (m + _) / 2;
          a.y + n.y * v - this.heightAt(a.x + n.x * v, a.z + n.z * v) > 0 ? (m = v) : (_ = v);
        }
        let b = (m + _) / 2;
        return new Vector3(a.x + n.x * b, a.y + n.y * b, a.z + n.z * b);
      }
      ((i = p), (s = c));
    }
    return null;
  }
  dispose() {
    (this.mesh?.geometry.dispose(), this.material?.dispose());
    for (let e of this.masks || []) e.dispose();
    this.cellTex?.dispose();
    for (let e of this.plinth || []) (e.geometry.dispose(), e.material.dispose());
  }
};

export { Le, Ym, z3 };
