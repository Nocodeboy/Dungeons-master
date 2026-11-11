// actors/rig.js
// Reconstruido de publicado/juego.js (módulo __esm «p2»). Nombres locales aún minificados.

import {
  AnimationClip,
  BufferAttribute,
  BufferGeometry,
  Matrix3,
  Matrix4,
  Skeleton,
  SkinnedMesh,
  Sphere,
  Vector3,
  VectorKeyframeTrack,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import datosAnimaciones from '../datos/animaciones.json';
import { loadGLTF } from '../assets.js';

function c2() {
  return (
    Bb ||
      (Bb = loadGLTF('assets/chars/humanos.json').then((o) => {
        (o.scene.traverse((a) => {
          a.userData && a.userData.n && (a.name = a.userData.n);
        }),
          o.scene.updateMatrixWorld(!0));
        let e = new Map();
        o.scene.traverse((a) => {
          if (!a.isSkinnedMesh) return;
          let n = a;
          for (; n && !/^(m|f|pelo)_/.test(n.name);) n = n.parent;
          let s = n ? n.name : a.name;
          (e.has(s) || e.set(s, []), e.get(s).push(a));
        });
        let t = (a) =>
          o.scene.getObjectByName(`humano_${a}`).children.find((s) => s.isBone || s.name === 'root');
        return { gltf: o, parts: e, rootBone: { m: t('m'), f: t('f') } };
      })),
    Bb
  );
}
function d2() {
  return (
    qb ||
      (qb = loadGLTF('assets/chars/anims.json').then((o) => {
        let e = new Map(),
          t = o.animations
            .find((s) => s.name === 'Idle_Loop')
            ?.tracks.find((s) => s.name === 'pelvis.position'),
          a = t ? Array.from(t.values.slice(0, 3)) : [0, 0, jb],
          n = [0, 1, 2].reduce((s, i) => (Math.abs(a[i]) > Math.abs(a[s]) ? i : s), 0);
        for (let s of o.animations) {
          let i = s.tracks.filter((l) =>
              l.name.endsWith('.scale')
                ? !1
                : l.name.endsWith('.position')
                  ? l.name.startsWith('pelvis.')
                  : !l.name.startsWith('Armature.'),
            ),
            r = i.find((l) => l.name === 'pelvis.position');
          if (r) {
            dz(s.name, r, a, n);
            let l =
              datosAnimaciones[s.name] && !globalThis.__mdgSinSuelo
                ? uz(r, datosAnimaciones[s.name], n)
                : null;
            l && (i[i.indexOf(r)] = r = l);
          }
          e.set(s.name, new AnimationClip(s.name, s.duration, i));
        }
        return e;
      })),
    qb
  );
}
function dz(o, e, t, a) {
  let n = e.values,
    s = e.times,
    i = s.length;
  if (i < 2) return;
  let [r, l] = [0, 1, 2].filter((m) => m !== a),
    c = t[r],
    d = t[l];
  if (/Awaken_Standing/.test(o)) {
    let m = n[r] - c,
      _ = n[l] - d,
      b = s[i - 1] - s[0] || 1;
    for (let f = 0; f < i; f++) {
      let v = 1 - (s[f] - s[0]) / b;
      ((n[f * 3 + r] -= m * v), (n[f * 3 + l] -= _ * v));
    }
  }
  let u = 0;
  for (let m = 0; m < i; m++) u = Math.max(u, Math.hypot(n[m * 3 + r] - c, n[m * 3 + l] - d));
  let h = /Dodge/.test(o) ? 0.35 : /Skeletons/.test(o) ? 0.6 : 1.1;
  if (u <= h) return;
  let p = h / u;
  for (let m = 0; m < i; m++)
    ((n[m * 3 + r] = c + (n[m * 3 + r] - c) * p), (n[m * 3 + l] = d + (n[m * 3 + l] - d) * p));
}
function uz(o, [e, t], a) {
  let n = t.length,
    s = new Float32Array(n),
    i = new Float32Array(n * 3),
    r = o.createInterpolant();
  for (let l = 0; l < n; l++) {
    s[l] = l * e;
    let c = r.evaluate(s[l]);
    (i.set(c, l * 3), (i[l * 3 + a] += t[l]));
  }
  return new VectorKeyframeTrack(o.name, s, i);
}
function Gb(o, e) {
  let t = `${o.uuid}|${e.join(',')}`;
  if (Ub.has(t)) return Ub.get(t);
  let a = o.geometry,
    n = a.attributes.skinIndex,
    s = a.attributes.skinWeight,
    i = o.skeleton.bones.map((u) => u.name),
    r = e.map((u) => hz[u]),
    l = new Uint8Array(n.count);
  for (let u = 0; u < n.count; u++) {
    let h = 0,
      p = 0;
    for (let m = 0; m < 4; m++) {
      let _ = s.getComponent(u, m);
      _ > h && ((h = _), (p = n.getComponent(u, m)));
    }
    l[u] = r.some((m) => m.test(i[p])) ? 1 : 0;
  }
  let c = a.index,
    d = [];
  for (let u = 0; u < c.count; u += 3) {
    let h = c.getX(u),
      p = c.getX(u + 1),
      m = c.getX(u + 2);
    l[h] && l[p] && l[m] && d.push(h, p, m);
  }
  return (Ub.set(t, d), d);
}
function u2(o) {
  let e = o.clone(!0),
    t = [],
    a = new Map();
  return (
    e.traverse((n) => {
      n.isBone && (t.push(n), a.set(n.name, n));
    }),
    { root: e, bones: t, byName: a }
  );
}
function h2(o, e) {
  let t = new Vector3(1, 1, 1);
  o.root.traverse((a) => {
    if (!a.isBone) return;
    let n = e.get(a.name) || t;
    for (let s of a.children) s.isBone && s.position.multiply(n);
  });
}
function Vb(o, e, t, a, n, s = null) {
  a.updateMatrixWorld(!0);
  let i = new Matrix4().copy(a.matrixWorld).invert(),
    r = new Map(o.bones.map((S, z) => [S.name, z])),
    l = s ? s.Wnew : o.bones.map((S) => i.clone().multiply(S.matrixWorld)),
    c = new Vector3(1, 1, 1),
    d = new Map(),
    u = new Vector3(),
    h = new Vector3(),
    p = new Vector3(),
    m = new Vector3(),
    _ = new Vector3(),
    b = new Vector3(),
    f = new Vector3(),
    v = new Map(),
    x = (S, z) => {
      let D = S;
      if (z === void 0 && v.has(D)) return v.get(D);
      let M = r.has(S) ? r.get(S) : 0,
        R = t.get(S) || c,
        A = z || n.get(S)?.matrixWorld || l[M],
        P = l[M].clone()
          .multiply(new Matrix4().makeScale(R.x, R.y, R.z))
          .multiply(A.clone().invert()),
        I = [P, new Matrix3().getNormalMatrix(P), M];
      return (z === void 0 && v.set(D, I), I);
    },
    g = n.get('Head'),
    y = g ? new Vector3().setFromMatrixPosition(g.matrixWorld) : new Vector3();
  for (let S of e) {
    let z;
    if ((S.mesh ? (z = w(S)) : (z = k(S)), !z)) continue;
    let D = S.material;
    (d.has(D) || d.set(D, []), d.get(D).push(z));
  }
  function w(S) {
    let z = S.mesh,
      D = z.skeleton,
      M = [],
      R = [],
      A = [],
      P = [],
      I = -1;
    for (let L = 0; L < D.bones.length; L++) {
      let O = D.bones[L].name;
      O === 'Head' && (I = L);
      let B = D.bones[L].matrixWorld,
        $ = B.clone().multiply(D.boneInverses[L]).multiply(z.bindMatrix);
      (M.push($), R.push(new Matrix3().getNormalMatrix($)));
      let ee = x(O, B);
      (A.push(ee), P.push(ee[2]));
    }
    let U = I >= 0 ? new Vector3().setFromMatrixPosition(D.bones[I].matrixWorld) : y,
      j = z.geometry,
      X = j.attributes.position,
      J = j.attributes.normal,
      Z = j.attributes.uv,
      K = j.attributes.skinIndex,
      ve = j.attributes.skinWeight,
      ge = S.index || (j.index ? Array.from(j.index.array) : [...Array(X.count).keys()]),
      ue = new Int32Array(X.count).fill(-1),
      Q = [];
    for (let L of ge) ue[L] < 0 && ((ue[L] = Q.length), Q.push(L));
    let oe = Q.length,
      ie = new Float32Array(oe * 3),
      we = new Float32Array(oe * 3),
      ce = new Float32Array(oe * 2),
      ke = new Uint16Array(oe * 4),
      Qe = new Float32Array(oe * 4);
    for (let L = 0; L < oe; L++) {
      let O = Q[L];
      (_.fromBufferAttribute(X, O), b.fromBufferAttribute(J, O), u.set(0, 0, 0), h.set(0, 0, 0));
      let B = 0;
      for (let $ = 0; $ < 4; $++) {
        let ee = ve.getComponent(O, $);
        if (ee === 0) continue;
        let be = K.getComponent(O, $);
        (be === I && (B += ee),
          u.addScaledVector(f.copy(_).applyMatrix4(M[be]), ee),
          h.addScaledVector(f.copy(b).applyMatrix3(R[be]), ee));
      }
      (h.normalize(), S.deform && S.deform(u, h, B, U, S), p.set(0, 0, 0), m.set(0, 0, 0));
      for (let $ = 0; $ < 4; $++) {
        let ee = ve.getComponent(O, $),
          be = K.getComponent(O, $);
        ((ke[L * 4 + $] = P[be]),
          (Qe[L * 4 + $] = ee),
          ee !== 0 &&
            (p.addScaledVector(f.copy(u).applyMatrix4(A[be][0]), ee),
            m.addScaledVector(f.copy(h).applyMatrix3(A[be][1]), ee)));
      }
      (m.normalize(),
        (ie[L * 3] = p.x),
        (ie[L * 3 + 1] = p.y),
        (ie[L * 3 + 2] = p.z),
        (we[L * 3] = m.x),
        (we[L * 3 + 1] = m.y),
        (we[L * 3 + 2] = m.z),
        Z && ((ce[L * 2] = Z.getX(O)), (ce[L * 2 + 1] = Z.getY(O))));
    }
    let N = new BufferGeometry();
    return (
      N.setAttribute('position', new BufferAttribute(ie, 3)),
      N.setAttribute('normal', new BufferAttribute(we, 3)),
      N.setAttribute('uv', new BufferAttribute(ce, 2)),
      N.setAttribute('gcol', new BufferAttribute(new Float32Array(oe * 3).fill(1), 3)),
      N.setAttribute('gpar', new BufferAttribute(new Float32Array(oe * 3), 3)),
      N.setAttribute('skinIndex', new BufferAttribute(ke, 4)),
      N.setAttribute('skinWeight', new BufferAttribute(Qe, 4)),
      N.setIndex(ge.map((L) => ue[L])),
      N
    );
  }
  function k(S) {
    let z = S.geometry;
    if (!z) return null;
    z.index && (z = z.toNonIndexed());
    let D = z.attributes.position,
      M = z.attributes.normal,
      R = D.count,
      A = new Float32Array(R * 3),
      P = new Float32Array(R * 3),
      I = new Uint16Array(R * 4),
      U = new Float32Array(R * 4);
    for (let ue = 0; ue < R; ue++) {
      (u.fromBufferAttribute(D, ue), h.fromBufferAttribute(M, ue));
      let Q = S.weights ? S.weights(u) : [[S.bone, 1]];
      (S.deform && S.deform(u, h, 1, y, S), p.set(0, 0, 0), m.set(0, 0, 0));
      let oe = 0,
        ie = 0;
      for (let [we, ce] of Q) {
        if (ie >= 4 || !(ce > 0)) continue;
        let ke = x(we);
        ((I[ue * 4 + ie] = ke[2]),
          (U[ue * 4 + ie] = ce),
          p.addScaledVector(f.copy(u).applyMatrix4(ke[0]), ce),
          m.addScaledVector(f.copy(h).applyMatrix3(ke[1]), ce),
          (oe += ce),
          ie++);
      }
      if (oe) {
        p.multiplyScalar(1 / oe);
        for (let we = 0; we < 4; we++) U[ue * 4 + we] /= oe;
        (m.normalize(), A.set([p.x, p.y, p.z], ue * 3), P.set([m.x, m.y, m.z], ue * 3));
      }
    }
    let j = new BufferGeometry();
    (j.setAttribute('position', new BufferAttribute(A, 3)),
      j.setAttribute('normal', new BufferAttribute(P, 3)));
    let X = z.attributes.uv,
      J = z.attributes.color,
      Z = z.attributes.metal,
      K = new Float32Array(R * 2),
      ve = new Float32Array(R * 3).fill(1),
      ge = new Float32Array(R * 3);
    for (let ue = 0; ue < R; ue++)
      (X && ((K[ue * 2] = X.getX(ue)), (K[ue * 2 + 1] = X.getY(ue))),
        J &&
          ((ve[ue * 3] = J.getX(ue)),
          (ve[ue * 3 + 1] = J.getY(ue)),
          (ve[ue * 3 + 2] = J.getZ(ue)),
          (ge[ue * 3] = Z ? Z.getX(ue) : 0),
          (ge[ue * 3 + 1] = Z ? Z.getY(ue) : 0),
          (ge[ue * 3 + 2] = 1)));
    return (
      j.setAttribute('uv', new BufferAttribute(K, 2)),
      j.setAttribute('gcol', new BufferAttribute(ve, 3)),
      j.setAttribute('gpar', new BufferAttribute(ge, 3)),
      j.setAttribute('skinIndex', new BufferAttribute(I, 4)),
      j.setAttribute('skinWeight', new BufferAttribute(U, 4)),
      j
    );
  }
  let T =
      s?.skeleton ||
      new Skeleton(
        o.bones,
        l.map((S) => S.clone().invert()),
      ),
    E = [];
  for (let [S, z] of d) {
    let M = z.some((P) => P.index) ? z.map((P) => (P.index ? P : pz(P))) : z,
      R = M.length > 1 ? mergeGeometries(M, !1) : M[0];
    if (!R) {
      console.warn('[personajes] no se pudieron fundir las piezas de', S.name || S.type);
      continue;
    }
    for (let P of M) P !== R && P.dispose();
    R.computeBoundingSphere();
    let A = new SkinnedMesh(R, S);
    (A.bind(T, new Matrix4()),
      (A.castShadow = !0),
      (A.receiveShadow = !0),
      (A.boundingSphere = new Sphere(new Vector3(0, 0.9, 0), 1.6)),
      (A.frustumCulled = !0),
      E.push(A));
  }
  return { meshes: E, skeleton: T, Wnew: l, boneIndex: r };
}
function pz(o) {
  let e = o.attributes.position.count,
    t = new (e > 65535 ? Uint32Array : Uint16Array)(e);
  for (let a = 0; a < e; a++) t[a] = a;
  return (o.setIndex(new BufferAttribute(t, 1)), o);
}
let Bb = null;
let qb = null;
const jb = 0.917;
const hz = {
  cabeza: /^(Head|neck_01)$/,
  torso: /^(spine_0[123]|clavicle_[lr])$/,
  cadera: /^pelvis$/,
  brazos: /^(upperarm|lowerarm)_[lr]$/,
  manos: /^(hand_[lr]|(index|middle|ring|pinky|thumb)_\d\d(_leaf)?_[lr])$/,
  piernas: /^(thigh|calf)_[lr]$/,
  pantorrillas: /^calf_[lr]$/,
  pies: /^(foot|ball)(_leaf)?_[lr]$/,
};
const Ub = new Map();

export { Gb, Vb, c2, d2, h2, jb, u2 };
