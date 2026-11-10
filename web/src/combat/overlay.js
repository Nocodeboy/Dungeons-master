// combat/overlay.js
// Reconstruido de publicado/juego.js (módulo __esm «GS»). Nombres locales aún minificados.

import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Plane,
  RingGeometry,
  ShaderMaterial,
  ShapeGeometry,
  Vector3,
} from 'three';
import { xc, ds, Us, nt, fn } from '../explore/hex.js';

const eH = {
  move: { y: 0.035, fill: 0.1, line: 0.42 },
  dash: { y: 0.034, fill: 0, line: 0.16 },
  range: { y: 0.036, fill: 0.07, line: 0.26 },
  path: { y: 0.04, fill: 0.2, line: 0.6 },
  target: { y: 0.042, fill: 0.22, line: 1 },
  area: { y: 0.044, fill: 0.34, line: 0.95 },
  hover: { y: 0.046, fill: 0.18, line: 1 },
  threat: { y: 0.043, fill: 0.16, line: 0.8 },
};
const tH =
  'attribute float aD; varying float vD; varying vec2 vUv; void main(){ vD = aD; vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const aH = `
uniform vec3 uColor; uniform float uTime; uniform float uLen;
varying float vD; varying vec2 vUv;
void main(){
  float across = abs(vUv.y * 2.0 - 1.0);
  float dash = step(0.45, fract(vD * 1.6 - uTime * 1.2));
  float edge = 1.0 - smoothstep(0.55, 1.0, across);
  float head = smoothstep(uLen - 0.6, uLen, vD);
  float a = edge * (0.35 + 0.55 * dash) * (1.0 - head * 0.6);
  gl_FragColor = vec4(uColor * (1.0 + dash * 0.6), a);
}`;
const Om = class {
  constructor(e, t, { cellToWorld: a = null, pick: n = null } = {}) {
    ((this.scene = e),
      (this.w = t.w),
      (this.h = t.h),
      (this.rows = t.rows),
      (this.cellToWorld = a || ((p) => xc(p[0], p[1]))),
      (this.pickFn = n));
    let s = fn * nt,
      i = new ShapeGeometry(Us(s * 0.93));
    i.rotateX(-Math.PI / 2);
    let r = Us(s * 0.95);
    r.holes.push(Us(s * 0.84));
    let l = new ShapeGeometry(r);
    (l.rotateX(-Math.PI / 2), (this.layers = {}), (this.meshes = []));
    let c = this.w * this.h;
    for (let [p, m] of Object.entries(eH)) {
      let _ = (b, f) => {
        let v = new InstancedMesh(
          b,
          new MeshBasicMaterial({ transparent: !0, opacity: f, depthWrite: !1, toneMapped: !1 }),
          c,
        );
        return (
          (v.count = 0),
          (v.renderOrder = 3),
          (v.frustumCulled = !1),
          (v.instanceColor = new InstancedBufferAttribute(new Float32Array(c * 3), 3)),
          e.add(v),
          this.meshes.push(v),
          v
        );
      };
      this.layers[p] = { cfg: m, fill: _(i, m.fill), line: _(l, m.line) };
    }
    ((this.geos = [i, l]),
      (this.plane = new Plane(new Vector3(0, 1, 0), 0)),
      (this.tmp = new Matrix4()),
      (this.col = new Color()),
      (this.pathU = { uColor: { value: new Vector3(1, 1, 1) }, uTime: { value: 0 }, uLen: { value: 1 } }));
    let d = new BufferGeometry(),
      u = 160;
    (d.setAttribute('position', new BufferAttribute(new Float32Array(u * 6), 3).setUsage(DynamicDrawUsage)),
      d.setAttribute('uv', new BufferAttribute(new Float32Array(u * 4), 2).setUsage(DynamicDrawUsage)),
      d.setAttribute('aD', new BufferAttribute(new Float32Array(u * 2), 1).setUsage(DynamicDrawUsage)));
    let h = [];
    for (let p = 0; p < u - 1; p++) h.push(p * 2, p * 2 + 1, p * 2 + 2, p * 2 + 1, p * 2 + 3, p * 2 + 2);
    (d.setIndex(h),
      d.setDrawRange(0, 0),
      (this.pathMesh = new Mesh(
        d,
        new ShaderMaterial({
          uniforms: this.pathU,
          vertexShader: tH,
          fragmentShader: aH,
          transparent: !0,
          depthWrite: !1,
          side: DoubleSide,
        }),
      )),
      (this.pathMesh.frustumCulled = !1),
      (this.pathMesh.renderOrder = 4),
      (this.pathMax = u),
      e.add(this.pathMesh),
      (this.goal = new Mesh(
        new RingGeometry(0.32, 0.42, 6),
        new MeshBasicMaterial({
          color: 16777215,
          transparent: !0,
          opacity: 0.9,
          depthWrite: !1,
          toneMapped: !1,
          side: DoubleSide,
        }),
      )),
      (this.goal.rotation.x = -Math.PI / 2),
      (this.goal.rotation.z = Math.PI / 6),
      (this.goal.visible = !1),
      (this.goal.renderOrder = 4),
      e.add(this.goal));
  }
  inBounds(e, t) {
    return e >= 0 && t >= 0 && e < this.w && t < this.h;
  }
  set(e, t, a = 16777215) {
    let n = this.layers[e],
      s = 0;
    for (let i = 0; i < t.length; i++) {
      let [r, l] = t[i];
      if (!this.inBounds(r, l)) continue;
      let c = this.cellToWorld([r, l]);
      (this.tmp.makeTranslation(c.x, c.y + n.cfg.y, c.z),
        this.col.setHex(typeof a == 'function' ? a(t[i], i) : a));
      for (let d of [n.fill, n.line]) (d.setMatrixAt(s, this.tmp), d.setColorAt(s, this.col));
      s++;
    }
    for (let i of [n.fill, n.line])
      ((i.count = s),
        (i.instanceMatrix.needsUpdate = !0),
        i.instanceColor && (i.instanceColor.needsUpdate = !0));
  }
  clear(...e) {
    for (let t of e.length ? e : Object.keys(this.layers))
      ((this.layers[t].fill.count = 0), (this.layers[t].line.count = 0));
    (!e.length || e.includes('path')) && this.clearRoute();
  }
  route(e, t, a = 15397631) {
    let n = [e, ...t].map((b) => this.cellToWorld(b).add(new Vector3(0, 0.07, 0)));
    if (n.length < 2) {
      this.clearRoute();
      return;
    }
    let s = new CatmullRomCurve3(n, !1, 'centripetal', 0.3),
      i = Math.min(this.pathMax, Math.max(8, n.length * 8)),
      r = s.getSpacedPoints(i - 1),
      l = this.pathMesh.geometry.attributes.position.array,
      c = this.pathMesh.geometry.attributes.uv.array,
      d = this.pathMesh.geometry.attributes.aD.array,
      u = 0,
      h = 0.13;
    for (let b = 0; b < r.length; b++) {
      b > 0 && (u += r[b].distanceTo(r[b - 1]));
      let f = r[Math.max(0, b - 1)],
        v = r[Math.min(r.length - 1, b + 1)],
        x = v.x - f.x,
        g = v.z - f.z,
        y = Math.hypot(x, g) || 1,
        w = (-g / y) * h,
        k = (x / y) * h;
      (l.set([r[b].x + w, r[b].y, r[b].z + k, r[b].x - w, r[b].y, r[b].z - k], b * 6),
        c.set([0, 0, 0, 1], b * 4),
        (d[b * 2] = d[b * 2 + 1] = u));
    }
    let p = this.pathMesh.geometry;
    ((p.attributes.position.needsUpdate = !0),
      (p.attributes.uv.needsUpdate = !0),
      (p.attributes.aD.needsUpdate = !0),
      p.setDrawRange(0, (r.length - 1) * 6));
    let m = new Color(a);
    (this.pathU.uColor.value.set(m.r, m.g, m.b), (this.pathU.uLen.value = u));
    let _ = r[r.length - 1];
    (this.goal.position.set(_.x, _.y, _.z), this.goal.material.color.copy(m), (this.goal.visible = !0));
  }
  clearRoute() {
    (this.pathMesh.geometry.setDrawRange(0, 0), (this.goal.visible = !1));
  }
  update(e) {
    ((this.pathU.uTime.value += e), this.goal.visible && (this.goal.rotation.z += e * 1.2));
  }
  ground(e) {
    if (this.pickFn) {
      let a = this.pickFn(e);
      if (a) return a.point;
    }
    let t = new Vector3();
    return e.ray.intersectPlane(this.plane, t) ? t : null;
  }
  cellAtWorld(e) {
    let t = ds(e.x / nt, e.z / nt);
    return this.inBounds(t[0], t[1]) ? t : null;
  }
  tile(e, t) {
    return this.inBounds(e, t) ? this.rows[t][e] : ' ';
  }
  dispose() {
    for (let e of this.meshes) (this.scene.remove(e), e.material.dispose(), e.dispose?.());
    for (let e of this.geos) e.dispose();
    (this.scene.remove(this.pathMesh, this.goal),
      this.pathMesh.geometry.dispose(),
      this.pathMesh.material.dispose(),
      this.goal.geometry.dispose(),
      this.goal.material.dispose());
  }
};

export { Om };
