// world/crypt.js
// Reconstruido de publicado/juego.js (módulo __esm «ik»). Nombres locales aún minificados.

import { Group, InstancedMesh, Matrix4, Mesh, Vector3 } from 'three';
import { hasPiece, pieceParts } from './kit.js';
import { worldMaterial } from './materials.js';
import { HEX_SIZE, ROW_STEP } from './grid.js';

const H9 = [
  ['wall', 58],
  ['wall_cracked', 16],
  ['wall_arched', 9],
  ['wall_shelves', 7],
  ['wall_broken', 5],
  ['wall_window', 5],
];
const N9 = [
  ['wall', 55],
  ['wall_cracked', 28],
  ['wall_broken', 12],
  ['wall_arched', 5],
];
const Pc = 0.3;
const F9 = 4;
const O9 = 4;
const n0 = class {
  constructor(e, { height: t = 0.85, torches: a = !0 } = {}) {
    ((this.torches = a),
      (this.ctx = e),
      (this.map = e.map),
      (this.rnd = e.rnd),
      (this.fullH = Math.max(1.2, t * 2)),
      (this.midH = 0.95),
      (this.lowH = 0.3),
      (this.pieces = []),
      (this.group = new Group()),
      (this.group.name = 'muros'),
      (this.lastFwd = new Vector3()),
      (this.deco = []));
    let n = this.segments();
    for (let s of n) this.addSegment(s.a, s.b, s.n);
    (this.buildMeshes(), this.decorate(), this.updateCutaway(new Vector3(0.57, 0, -0.82), !0));
  }
  floor(e, t) {
    return this.map.inside(e, t) && this.map.tile(e, t) !== '#' && this.map.tile(e, t) !== ' ';
  }
  block(e, t) {
    let a = Math.floor((t % 2 === 0 ? e : e - 1) / 2);
    return this.floor(a, t);
  }
  rowZ(e) {
    return e * ROW_STEP + 0.5;
  }
  segments() {
    let e = [],
      t = this.map,
      a = -4,
      n = t.w * 2 + 4,
      s = ROW_STEP * 0.5,
      i = {};
    for (let r = -1; r <= t.h; r++) {
      let l = [];
      for (let c = a; c < n; c++) {
        let d = this.block(c, r),
          u = this.block(c + 1, r);
        d !== u && l.push({ x: (c + 1) * 0.5, n: d ? -1 : 1, r, next: null, prev: null });
      }
      i[r] = l;
    }
    for (let r = -1; r < t.h; r++)
      for (let l of i[r]) {
        let c = null,
          d = 0.51;
        for (let u of i[r + 1] || [])
          u.n === l.n && !u.prev && Math.abs(u.x - l.x) < d && ((d = Math.abs(u.x - l.x)), (c = u));
        c && ((l.next = c), (c.prev = l));
      }
    for (let r = -1; r <= t.h; r++)
      for (let l of i[r]) {
        let c = l.x;
        (l.prev && l.next
          ? (c = (l.prev.x + 2 * l.x + l.next.x) / 4)
          : l.prev
            ? (c = (l.prev.x + l.x) / 2)
            : l.next && (c = (l.next.x + l.x) / 2),
          (l.xs = c));
      }
    this.vc = i;
    for (let r = -1; r <= t.h; r++)
      for (let l of i[r]) {
        if (l.prev && Math.abs(l.prev.xs - l.xs) < 0.01) continue;
        let c = this.rowZ(r) - s,
          d = l;
        for (; d.next && Math.abs(d.next.xs - l.xs) < 0.01;) d = d.next;
        let u = this.rowZ(d.r) + s;
        e.push({ a: [l.xs, c], b: [l.xs, u], n: [l.n, 0] });
      }
    for (let r = -2; r <= t.h; r++) {
      let l = this.rowZ(r) + s,
        c = a;
      for (; c < n;) {
        let d = this.block(c, r),
          u = this.block(c, r + 1);
        if (d === u) {
          c++;
          continue;
        }
        let h = c;
        for (; c < n && this.block(c, r) === d && this.block(c, r + 1) === u;) c++;
        let p = h * 0.5,
          m = c * 0.5;
        if (m - p <= 0.51) continue;
        let _ = d ? -1 : 1;
        ((p = this.snapEnd(p, r, -1)),
          (m = this.snapEnd(m, r, 1)),
          e.push({ a: [p, l], b: [m, l], n: [0, _] }));
      }
    }
    return e;
  }
  snapEnd(e, t, a) {
    let n = e,
      s = 0.4;
    for (let i of [t, t + 1])
      for (let r of this.vc[i] || []) {
        let l = Math.abs(r.xs - e);
        l < s && ((s = l), (n = r.xs + a * Pc * 0.5));
      }
    return n;
  }
  pick() {
    let e = this.rnd() * 100;
    for (let [t, a] of this.ctx?.ambient === 'crypt' ? H9 : N9)
      if (((e -= a), e < 0)) return hasPiece(t) ? t : 'wall';
    return 'wall';
  }
  addSegment(e, t, a) {
    let n = t[0] - e[0],
      s = t[1] - e[1],
      i = Math.hypot(n, s);
    if (i < 0.05) return;
    let r = Math.max(1, Math.round(i / 1.1)),
      l = i / r;
    for (let c = 0; c < r; c++) {
      let d = (e[0] + (n / i) * l * (c + 0.5) - a[0] * Pc * 0.5 - 0.5) * HEX_SIZE,
        u = (e[1] + (s / i) * l * (c + 0.5) - a[1] * Pc * 0.5 - 0.5) * HEX_SIZE;
      this.pieces.push({
        variant: this.pick(),
        center: new Vector3(d, 0, u),
        normal: new Vector3(a[0], 0, a[1]),
        w: l * 1.02 * HEX_SIZE,
        h: this.fullH * HEX_SIZE,
        deco: [],
      });
    }
  }
  xform(e, t, a = new Matrix4()) {
    let n = e.normal,
      s = new Vector3(0, 1, 0).cross(n),
      i = new Matrix4().makeBasis(
        s.multiplyScalar(e.w / F9),
        new Vector3(0, t / O9, 0),
        n.clone().multiplyScalar((Pc * HEX_SIZE) / 1),
      );
    return a.copy(i).setPosition(e.center);
  }
  buildMeshes() {
    let e = new Map();
    for (let t of this.pieces)
      (e.has(t.variant) || e.set(t.variant, []), (t.i = e.get(t.variant).length), e.get(t.variant).push(t));
    this.meshes = new Map();
    for (let [t, a] of e) {
      let n = [];
      for (let s of pieceParts(t)) {
        let i = new InstancedMesh(
          s.geo,
          worldMaterial(s.mat, { contact: 'local', contactH: 1.2, contactMin: 0.45 }),
          a.length,
        );
        ((i.castShadow = !0), (i.receiveShadow = !0), (i.frustumCulled = !1), this.group.add(i), n.push(i));
      }
      this.meshes.set(t, n);
    }
  }
  decorate() {
    let e = this.ctx,
      t = 0;
    for (let a of this.pieces) {
      if (a.variant !== 'wall' && a.variant !== 'wall_cracked') continue;
      let n = a.center,
        s = a.normal,
        i = ((Math.floor((n.x * 7) / HEX_SIZE + (n.z * 13) / HEX_SIZE) % 9) + 9) % 9;
      if (this.torches) {
        if (i === 0 && t < 14 && hasPiece('torch_wall')) {
          t++;
          let r = new Group();
          for (let u of pieceParts('torch_wall')) {
            let h = new Mesh(u.geo, worldMaterial(u.mat, {}));
            ((h.castShadow = !1), r.add(h));
          }
          (r.scale.setScalar(0.42),
            r.position
              .copy(n)
              .addScaledVector(s, Pc * HEX_SIZE * 0.5)
              .add(new Vector3(0, 1.35, 0)),
            (r.rotation.y = Math.atan2(s.x, s.z)),
            this.group.add(r),
            a.deco.push(r));
          let l = r.position
              .clone()
              .addScaledVector(s, 0.22)
              .add(new Vector3(0, 0.36, 0)),
            c = { pos: l, scale: 0.55, embers: !1 };
          (e.fx.flames.push(c),
            (a.flame = c),
            e.fx.addLamp({
              pos: l
                .clone()
                .add(new Vector3(0, 0.1, 0))
                .addScaledVector(s, 0.2),
              color: 16747066,
              range: 7,
              energy: 1.5,
              kind: 'torch',
              haloSize: 1.4,
              haloAlpha: 0.55,
              piece: a,
            }));
          let d = n.clone().addScaledVector(s, 1.2);
          e.ground.blob(6, d.x, d.z, 3.2, 0.85);
        } else if (i === 4 && hasPiece('banner_thin')) {
          let r = new Group();
          for (let l of pieceParts('banner_thin')) r.add(new Mesh(l.geo, worldMaterial(l.mat, {})));
          (r.scale.setScalar(0.42),
            r.position
              .copy(n)
              .addScaledVector(s, Pc * HEX_SIZE * 0.5 + 0.02)
              .add(new Vector3(0, 0.15, 0)),
            (r.rotation.y = Math.atan2(s.x, s.z)),
            this.group.add(r),
            a.deco.push(r));
        }
      }
    }
  }
  updateCutaway(e, t = !1) {
    let a = new Vector3(e.x, 0, e.z);
    if (a.lengthSq() < 1e-6 || (a.normalize(), !t && a.dot(this.lastFwd) > 0.985)) return;
    this.lastFwd.copy(a);
    let n = new Matrix4();
    for (let s of this.pieces) {
      let i = s.normal.dot(a.clone().negate()),
        r = (i > 0.35 ? this.fullH : i < -0.35 ? this.lowH : this.midH) * HEX_SIZE;
      ((s.h = r), this.xform(s, r, n));
      for (let l of this.meshes.get(s.variant)) l.setMatrixAt(s.i, n);
      for (let l of s.deco) l.visible = r >= this.fullH * HEX_SIZE - 0.01;
      s.flame && this.ctx.fx.setFlame(s.flame, r >= this.fullH * HEX_SIZE - 0.01);
    }
    for (let [, s] of this.meshes) for (let i of s) i.instanceMatrix.needsUpdate = !0;
    for (let s of this.ctx.fx.lampSources) s.piece && (s.on = s.piece.h >= this.fullH * HEX_SIZE - 0.01);
  }
};

export { n0 };
