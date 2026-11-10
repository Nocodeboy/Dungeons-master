// world/kit.js
// Reconstruido de publicado/juego.js (módulo __esm «pr»). Nombres locales aún minificados.

import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { loadGLTF } from '../assets.js';
import { Zn, v3 } from './materials.js';

async function T3(o) {
  await Promise.all(
    o.map(async (e) => {
      if (T1.has(e)) return;
      let t = await loadGLTF(CH[e]);
      t.scene.updateMatrixWorld(!0);
      let a = new Map();
      for (let n of t.scene.children) a.set(n.name, n);
      (t.scene.traverse((n) => {
        if (n.isMesh) for (let s of [].concat(n.material)) M1.has(s.name) || M1.set(s.name, s);
      }),
        T1.set(e, a));
    }),
  );
}
function M3(o) {
  for (let [, e] of T1) if (e.has(o)) return e.get(o);
  return null;
}
function pa(o) {
  return !!M3(o);
}
function zH(o) {
  if (o.array instanceof Float32Array && !o.normalized && !o.isInterleavedBufferAttribute) return o.clone();
  let e = new Float32Array(o.count * o.itemSize);
  for (let t = 0; t < o.count; t++)
    for (let a = 0; a < o.itemSize; a++)
      e[t * o.itemSize + a] = o.getComponent
        ? o.getComponent(t, a)
        : [o.getX(t), o.getY(t), o.getZ(t), o.getW(t)][a];
  return new BufferAttribute(e, o.itemSize);
}
function x3(o, e) {
  let t = new BufferGeometry();
  for (let a of ['position', 'normal', 'uv', 'color']) {
    let n = o.getAttribute(a);
    n && t.setAttribute(a, zH(n));
  }
  if (
    (t.getAttribute('uv') ||
      t.setAttribute('uv', new BufferAttribute(new Float32Array(t.getAttribute('position').count * 2), 2)),
    t.getAttribute('normal') || t.computeVertexNormals(),
    o.index && t.setIndex(Array.from(o.index.array)),
    t.applyMatrix4(e),
    e.determinant() < 0 && t.index)
  ) {
    let a = t.index.array;
    for (let n = 0; n < a.length; n += 3) [a[n + 1], a[n + 2]] = [a[n + 2], a[n + 1]];
  }
  return (t.computeBoundingBox(), t.computeBoundingSphere(), t);
}
function dr(o) {
  if (_1.has(o)) return _1.get(o);
  let e = M3(o);
  if (!e) return (_3.has(o) || console.warn('[mundo] pieza desconocida', o), _3.add(o), []);
  let t = new Matrix4().copy(e.matrixWorld).invert(),
    a = [];
  if (
    (e.traverse((n) => {
      if (!n.isMesh) return;
      let s = Array.isArray(n.material) ? n.material : [n.material],
        i = new Matrix4().multiplyMatrices(t, n.matrixWorld);
      if (s.length === 1) a.push({ geo: x3(n.geometry, i), mat: w3(s[0]), name: n.name });
      else
        for (let r of n.geometry.groups) {
          let l = n.geometry.clone();
          (l.setIndex(Array.from(n.geometry.index.array.slice(r.start, r.start + r.count))),
            a.push({ geo: x3(l, i), mat: w3(s[r.materialIndex]), name: n.name }));
        }
    }),
    /^Bush_/.test(o))
  ) {
    let n = M1.get('Leaves_NormalTree');
    for (let s of a)
      if (s.mat.name === 'Leaves_TwistedTree' && n) {
        let i = s.mat.clone();
        ((i.name = 'Leaves_Bush'), (i.map = n.map), i.color.set(14214832), (s.mat = i));
      }
  }
  return (_1.set(o, a), a);
}
function w3(o) {
  if (w1.has(o.uuid)) return w1.get(o.uuid);
  let e = o.clone();
  e.name = o.name;
  let t = PH[o.name];
  return (
    t && e.color.multiply(new Color(t)),
    e.map && (e.map.anisotropy = 4),
    (e.alphaTest > 0 || e.transparent) && (e.side = DoubleSide),
    e.name === 'MI_WindowGlass' &&
      ((e.transparent = !1),
      (e.opacity = 1),
      e.color.setRGB(0.12, 0.09, 0.07),
      (e.emissive = new Color(16754768)),
      (e.emissiveIntensity = 0),
      (e.roughness = 0.25),
      (e.userData.window = !0)),
    (e.metalness = Math.min(e.metalness, 0.2)),
    w1.set(o.uuid, e),
    e
  );
}
function ur(o) {
  let e = new Box3();
  for (let t of dr(o)) e.union(t.geo.boundingBox);
  return e;
}
function E1(o, e = {}) {
  let t = o.name || '',
    a = { ...e };
  return (
    /^Leaves|^Leaf/.test(t)
      ? Object.assign(a, { wind: e.wind ?? 0.22, upNormal: 0.45 })
      : /Grass|Flowers/.test(t)
        ? Object.assign(a, { wind: e.wind ?? 0.06, upNormal: 0.8, contact: null })
        : /^Bark/.test(t) && Object.assign(a, { wind: e.wind != null ? e.wind * 0.35 : 0.06 }),
    a
  );
}
function Gm(o, e, t = {}) {
  let a = new Group();
  if (((a.name = `inst:${o}`), !e.length)) return a;
  let n = dr(o),
    s = t.fade ? new Float32Array(e.length).fill(1) : null,
    i = s ? new InstancedBufferAttribute(s, 1) : null;
  i && i.setUsage(DynamicDrawUsage);
  for (let r of n) {
    let l = E1(r.mat, { fade: t.fade ? 'instance' : null, ...(t.finish || {}) }),
      c = Zn(r.mat, l),
      d = r.geo.clone();
    i && d.setAttribute('aFade', i);
    let u = new InstancedMesh(d, c, e.length);
    for (let h = 0; h < e.length; h++) u.setMatrixAt(h, e[h]);
    ((u.instanceMatrix.needsUpdate = !0),
      (u.castShadow = t.cast ?? !0),
      (u.receiveShadow = t.receive ?? !0),
      l.wind > 0 && u.castShadow && (u.customDepthMaterial = v3(r.mat, l)),
      u.computeBoundingSphere(),
      u.computeBoundingBox(),
      a.add(u));
  }
  return ((a.userData.fade = i), a);
}
function S1(o) {
  return (
    !!o &&
    o.isMeshStandardMaterial &&
    !o.map &&
    !o.normalMap &&
    !o.transparent &&
    !o.alphaTest &&
    !(o.emissiveIntensity > 0 && o.emissive && o.emissive.getHex() !== 0) &&
    !o.userData?.window
  );
}
function xt(o, e, t, a = 0, n = 1, s = new Matrix4()) {
  let i = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), a),
    r = typeof n == 'number' ? new Vector3(n, n, n) : n;
  return s.compose(new Vector3(o, e, t), i, r);
}
function hr(o, e = {}) {
  let t = new Group();
  t.name = o;
  for (let a of dr(o)) {
    let n = new Mesh(a.geo, Zn(a.mat, { ...E1(a.mat, {}), ...e }));
    ((n.castShadow = !0), (n.receiveShadow = !0), t.add(n));
  }
  return t;
}
function Hu(o) {
  return (
    o.traverse((e) => {
      if (e.isMesh)
        for (let t of Array.isArray(e.material) ? e.material : [e.material])
          t.transmission > 0 &&
            ((t.transmission = 0),
            (t.transparent = !0),
            (t.opacity = Math.min(t.opacity, 0.45)),
            (t.depthWrite = !1));
    }),
    o
  );
}
const CH = {
  aldea: 'assets/world/aldea.json',
  naturaleza: 'assets/world/naturaleza.json',
  atrezo: 'assets/world/atrezo.json',
  mazmorra: 'assets/dungeon/mazmorra.json',
};
const PH = {
  MI_Vine: 13623456,
  Leaves_NormalTree: 15265476,
  Leaves: 15790296,
  Leaves_Pine: 13162672,
  Bark_NormalTree: 13351080,
  Grass: 13819802,
  Rocks: 14078148,
  PathRocks: 14209216,
};
const T1 = new Map();
const _1 = new Map();
const M1 = new Map();
const _3 = new Set();
const w1 = new Map();
const E3 = new MeshStandardMaterial({ color: 16777215, roughness: 0.85, metalness: 0, vertexColors: !0 });
E3.name = 'plano';
const S3 = new MeshStandardMaterial({ color: 16777215, roughness: 0.45, metalness: 0.7, vertexColors: !0 });
S3.name = 'plano_metal';
const gn = class {
  constructor({
    fade: e = !1,
    contactH: t = 1,
    contactMin: a = 0.5,
    groundAt: n = null,
    cast: s = !0,
    finish: i = null,
    metal: r = !0,
  } = {}) {
    ((this.finish = i),
      (this.metal = r),
      (this.fade = e),
      (this.contactH = t),
      (this.contactMin = a),
      (this.groundAt = n),
      (this.cast = s),
      (this.byMat = new Map()));
  }
  add(e, t, a = {}) {
    for (let n of dr(e)) this.addGeometry(n.geo, n.mat, t, a);
  }
  view(e) {
    return {
      add: (t, a, n = {}) => this.add(t, a, { ...e, ...n }),
      addGeometry: (t, a, n, s = {}) => this.addGeometry(t, a, n, { ...e, ...s }),
    };
  }
  addGeometry(e, t, a, n = {}) {
    let s = e.clone();
    if ((s.applyMatrix4(a), a.determinant() < 0 && s.index)) {
      let v = s.index.array;
      for (let x = 0; x < v.length; x += 3) [v[x + 1], v[x + 2]] = [v[x + 2], v[x + 1]];
    }
    let i = s.getAttribute('position'),
      r = i.count,
      l = new Float32Array(r),
      c = n.groundY ?? 0,
      d = n.contactH ?? this.contactH,
      u = n.contactMin ?? this.contactMin;
    for (let v = 0; v < r; v++) {
      let x = i.getY(v) - (this.groundAt ? this.groundAt(i.getX(v), i.getZ(v)) : c),
        g = Math.min(1, Math.max(0, x / d));
      l[v] = u + (1 - u) * (g * g * (3 - 2 * g));
    }
    (s.setAttribute('aAO', new BufferAttribute(l, 1)),
      this.fade &&
        s.setAttribute(
          'aBld',
          new BufferAttribute(new Float32Array(r).fill((n.bld ?? 0) + (n.roof ? 0.5 : 0)), 1),
        ));
    let h = null,
      p = !!t.vertexColors;
    S1(t) && ((h = t.color), (t = this.metal && t.metalness > 0.4 ? S3 : E3));
    let m = n.tints?.[t.name] || n.tint || h || null,
      _ = p && s.getAttribute('color'),
      b = new Float32Array(r * 3).fill(1);
    if (_) {
      let v = s.getAttribute('color');
      for (let x = 0; x < r; x++)
        ((b[x * 3] = v.getX(x)), (b[x * 3 + 1] = v.getY(x)), (b[x * 3 + 2] = v.getZ(x)));
    }
    if (m) for (let v = 0; v < r; v++) ((b[v * 3] *= m.r), (b[v * 3 + 1] *= m.g), (b[v * 3 + 2] *= m.b));
    s.setAttribute('color', new BufferAttribute(b, 3));
    let f = t.uuid + (n.matKey || '');
    (this.byMat.has(f) || this.byMat.set(f, { mat: t, geos: [], cast: n.cast ?? this.cast }),
      this.byMat.get(f).geos.push((s.index, s)));
  }
  build(e = 'fundido') {
    let t = new Group();
    t.name = e;
    for (let [, { mat: a, geos: n, cast: s }] of this.byMat) {
      let r = n.every((d) => d.index) ? n : n.map((d) => (d.index ? d.toNonIndexed() : d)),
        l = mergeGeometries(r, !1);
      if (!l) continue;
      let c = new Mesh(
        l,
        Zn(a, {
          ...E1(a, {}),
          ...(this.finish || {}),
          contact: 'attr',
          fade: this.fade ? 'building' : null,
          vcol: !0,
        }),
      );
      ((c.castShadow = s), (c.receiveShadow = !0), (c.name = a.name), l.computeBoundingSphere(), t.add(c));
    }
    return t;
  }
};

export { Gm, Hu, S1, T3, dr, gn, hr, pa, ur, xt };
