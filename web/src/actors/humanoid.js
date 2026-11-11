// actors/humanoid.js
// Reconstruido de publicado/juego.js (módulo __esm «Wf»). Nombres locales aún minificados.

import {
  AnimationMixer,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Matrix4,
  Quaternion,
  TorusGeometry,
  Vector3,
} from 'three';
import {
  loadHumanRig,
  loadAnimClips,
  triangleSubset,
  cloneSkeleton,
  scaleBones,
  bakeSkinnedMeshes,
  ANIM_PELVIS_HEIGHT,
} from './rig.js';
import { makeCharacterMaterial } from './materials.js';
import {
  makeHeadSculpt,
  hornsGeometry,
  tusksGeometry,
  frillGeometry,
  tailGeometry,
  tailWeights,
  ponytailGeometry,
  braidGeometry,
  mohawkGeometry,
  hairWeights,
} from './sculpt.js';
import {
  paint,
  mergeParts,
  gearPalette,
  weaponGeometry,
  shieldGeometry,
  quiverGeometry,
  luteGeometry,
  backpackGeometry,
  glassesGeometry,
  bookGeometry,
  pouchGeometry,
  pauldronGeometry,
  breastplateGeometry,
  cylinderBetween,
  headwearGeometry,
  robeGeometry,
  capeGeometry,
  mantleGeometry,
  beltGeometry,
  tabardGeometry,
  mat,
} from './geometry.js';
import { Character } from './character.js';
import { ANIM_CLIPS, GRIP_CLIPS, RACE_CLIPS } from './anims.js';
import { loadMonsterPieces, pieceGeometry, skeletonParts, ragsGeometry } from './monster-parts.js';
import { makeBowClips } from './poses.js';

function tn(o, e) {
  return o.get(e).getWorldPosition(new Vector3());
}
function Iz(o) {
  let e = new Map(),
    t = (i, r) => {
      for (let l of Hz) i.test(l) && e.set(l, (e.get(l) || an(1, 1, 1)).clone().multiply(r));
    },
    a = o.width ?? 1,
    n = o.thick ?? 1;
  (t(/^spine_0[123]$|^pelvis$/, an(a, 1, a)),
    t(/^clavicle_[lr]$/, an(1, 1 + (a - 1) * 0.7, 1)),
    t(/^(upperarm|lowerarm)_[lr]$/, an(n * (1 + (a - 1) * 0.7), o.arms ?? 1, n * (1 + (a - 1) * 0.7))),
    t(/^(thigh|calf)_[lr]$/, an(n * (1 + (a - 1) * 0.6), o.legs ?? 1, n * (1 + (a - 1) * 0.6))),
    t(/^hand_[lr]$/, an(o.hands ?? 1, o.hands ?? 1, o.hands ?? 1)),
    t(/^neck_01$/, an(1 + (a - 1) * 0.5, o.neck ?? 1, 1 + (a - 1) * 0.5)));
  let s = o.head ?? 1;
  return (t(/^Head$/, an(s, s, s)), o.spine && t(/^spine_0[123]$/, an(1, o.spine, 1)), e);
}
function sT(o) {
  if (dv.has(o)) return dv.get(o);
  let e = o.geometry,
    t = o.skeleton,
    a = t.bones.map((u, h) => u.matrixWorld.clone().multiply(t.boneInverses[h]).multiply(o.bindMatrix)),
    n = e.attributes.position,
    s = e.attributes.skinIndex,
    i = e.attributes.skinWeight,
    r = new Float32Array(n.count * 3),
    l = new Vector3(),
    c = new Vector3(),
    d = new Vector3();
  for (let u = 0; u < n.count; u++) {
    (l.fromBufferAttribute(n, u), c.set(0, 0, 0));
    for (let h = 0; h < 4; h++) {
      let p = i.getComponent(u, h);
      p && c.addScaledVector(d.copy(l).applyMatrix4(a[s.getComponent(u, h)]), p);
    }
    r.set([c.x, c.y, c.z], u * 3);
  }
  return (dv.set(o, r), r);
}
function nT(o) {
  return new Vector3().setFromMatrixPosition(o.skeleton.bones.find((e) => e.name === 'Head').matrixWorld);
}
function uv(o, e, t) {
  let a = sT(o),
    n = o.geometry.index,
    s = [],
    i = new Vector3(),
    r = (l) => t(i.set(a[l * 3] - e.x, a[l * 3 + 1] - e.y, a[l * 3 + 2] - e.z));
  for (let l = 0; l < n.count; l += 3) {
    let c = n.getX(l),
      d = n.getX(l + 1),
      u = n.getX(l + 2);
    r(c) && r(d) && r(u) && s.push(c, d, u);
  }
  return s;
}
function Nz(o) {
  if (dc) return dc;
  dc = new Map();
  let e = o.get('Sword_Idle');
  if (!e) return dc;
  for (let t of e.tracks) {
    let [a, n] = t.name.split('.');
    n !== 'quaternion' ||
      !/^(index|middle|ring|pinky|thumb)_/.test(a) ||
      dc.set(a, new Quaternion().fromArray(t.values, 0));
  }
  return dc;
}
async function buildHumanoid(o) {
  let [e, t] = await Promise.all([loadHumanRig(), loadAnimClips()]);
  if (!t.has('P_Bow_Shoot')) for (let ie of makeBowClips(e.rootBone.m, t)) t.set(ie.name, ie);
  let a = o.body === 'f' ? 'f' : 'm',
    n = e.rootBone[a],
    s = new Map();
  n.traverse((ie) => ie.isBone && s.set(ie.name, ie));
  let i = cloneSkeleton(n),
    r = new Group();
  ((r.name = 'modelo'), r.add(i.root));
  let l = o.prop || {},
    c = Iz(l);
  (scaleBones(i, c), r.updateMatrixWorld(!0));
  let d = tn(s, 'ball_l'),
    u = i.byName.get('ball_l').getWorldPosition(new Vector3()),
    h = i.byName.get('pelvis');
  {
    let ie = h.getWorldPosition(new Vector3());
    ((ie.y -= u.y - d.y), h.position.copy(h.parent.worldToLocal(ie)), r.updateMatrixWorld(!0));
  }
  let p = h.getWorldPosition(new Vector3()).y,
    m = tn(s, 'Head'),
    _ = gearPalette(o),
    b = o.colors || {},
    f = makeCharacterMaterial(
      a,
      {
        skin: b.skin,
        cloth1: b.cloth1,
        cloth2: b.cloth2,
        metal: o.metalColor,
        leather: b.leather,
        hair: b.hair,
        eyes: b.eyes,
      },
      {
        pattern: o.skinFx?.pattern || 0,
        patternColor: o.skinFx?.patternColor,
        mail: o.mail || 0,
        glowEyes: o.glowEyes || 0,
      },
    ),
    v = f,
    x = f,
    g = makeHeadSculpt(o.head || {}),
    y = [],
    w = o.outfit || {},
    k = (ie, we = {}) => {
      let ce = e.parts.get(ie);
      if (!ce) {
        ce = [];
        for (let L = 1; e.parts.has(`${ie}_${L}`); L++) ce.push(...e.parts.get(`${ie}_${L}`));
        if (!ce.length) return;
      }
      let ke = /^pelo_|_ojos$|_cejas$/.test(ie),
        Qe = w.tatters && /_(ca|ex)_(torso|piernas|brazos)$/.test(ie),
        N = o.gear?.robe && /_(ca|ex)_torso$/.test(ie);
      for (let L of ce) {
        let O = Qe
          ? jz(L, w.tatters)
          : N
            ? triangleSubset(L, ['torso', 'brazos', 'manos', 'cabeza'])
            : void 0;
        y.push({ mesh: L, material: ke ? v : f, deform: g, index: O, ...we });
      }
    },
    T = [];
  if (
    (o.noHead || T.push('cabeza'),
    (w.torso === 'piel' || w.under) && T.push('torso'),
    (w.brazos === 'piel' || w.under) && T.push('brazos', 'manos'),
    (w.piernas === 'piel' || w.under) && T.push('piernas', 'cadera'),
    w.pies === 'piel' && T.push('pies', 'pantorrillas'),
    T.length)
  ) {
    let ie = e.parts.get(`${a}_cuerpo`)[0];
    y.push({ mesh: ie, index: triangleSubset(ie, T), material: f, deform: g });
  }
  let E = (ie, we) => {
    let ce = w[ie];
    ce && ce !== 'piel' && we[ce] && k(`${a}_${ce}_${we[ce]}`);
  };
  (E('torso', { ex: 'torso', ca: 'torso' }),
    E('brazos', { ex: 'brazos', ca: 'brazos' }),
    E('piernas', { ex: 'piernas', ca: 'piernas' }),
    E('pies', { ex: 'botas', ca: 'pies' }),
    w.capucha && k(`${a}_ex_capucha`),
    w.hombrera && k(`${a}_ex_hombrera`),
    w.brazales && k(`${a}_ex_brazales`),
    w.cintos && (k(`${a}_ex_cinto1`), k(`${a}_ex_cinto2`)),
    o.noHead || (k(`${a}_ojos`, { hair: !0 }), o.brows !== !1 && k(`${a}_cejas`, { hair: !0 })));
  let S = w.capucha || o.gear?.helmet === 'yelmo' ? null : Dz[o.hair || 'raya'];
  if (S && !o.noHead) {
    let ie = e.parts.get(`pelo_${S === 'rapado' && a === 'f' ? 'rapado_f' : S}`)?.[0];
    ie &&
      (o.hair === 'cresta'
        ? y.push({
            mesh: ie,
            index: uv(ie, nT(ie), (we) => Math.abs(we.x) < 0.028),
            material: v,
            deform: g,
            hair: !0,
          })
        : y.push({ mesh: ie, material: v, deform: g, hair: !0 }));
  }
  if (!o.noHead && o.gear?.helmet !== 'yelmo') {
    let ie = {
        coleta: () => ponytailGeometry(1),
        trenza: () => braidGeometry(o.hairLong ?? 1),
        cresta: () => (w.capucha ? null : mohawkGeometry()),
      }[o.hair],
      we = ie && ie();
    we &&
      (we.translate(m.x, m.y, m.z),
      y.push({
        geometry: we,
        material: v,
        weights: o.hair === 'cresta' ? null : hairWeights(m.y),
        bone: 'Head',
        deform: g,
        hair: !0,
      }));
  }
  let z = o.beard && o.beard !== 'ninguna' && !o.noHead ? o.beard : null;
  if (z) {
    let ie = e.parts.get('pelo_barba')[0],
      we = nT(ie),
      ce;
    z === 'perilla'
      ? (ce = uv(ie, we, (N) => Math.abs(N.x) < 0.032 && (N.y < 0.012 || N.y > 0.022)))
      : z === 'bigote' && (ce = uv(ie, we, (N) => N.y > 0.004 && N.y < 0.04 && N.z > 0.07));
    let ke = z === 'larga' || z === 'trenzada',
      Qe = (N, L, O, B, $) => {
        if ((g && g(N, L, O, B, $), ke)) {
          let ee = N.clone().sub(B),
            be = Math.max(0, 0.02 - ee.y);
          ((N.y -= be * 2.2), (N.z += be * 0.35), (N.x -= ee.x * Math.min(0.5, be * 6)));
        }
      };
    y.push({ mesh: ie, index: ce, material: v, deform: Qe, hair: !0 });
  }
  let D = y.slice(),
    M = await oT(o, s, _, x, m);
  for (let ie of M) y.push(ie);
  let R = bakeSkinnedMeshes(i, y, c, r, s);
  for (let ie of R.meshes) r.add(ie);
  let A = new Group();
  A.name = o.id ? `pj_${o.id}` : 'humanoide';
  let P = (l.scale ?? 1) * (l.height ?? 1);
  (r.scale.setScalar(P), A.add(r));
  let I = new AnimationMixer(i.root),
    U = { ...ANIM_CLIPS, ...(RACE_CLIPS[o.family] || {}), ...(GRIP_CLIPS[o.style] || {}) },
    j = new Character({
      id: o.id,
      kind: o.kind || 'hero',
      def: { id: o.id, scale: P, anim: 'idle', walk: 'walk' },
      root: A,
      model: r,
      mixer: I,
      clips: t,
      anims: U,
      head: i.byName.get('Head'),
      height: 1.8 * P,
      radius: 0.35 * P * (l.width ?? 1),
      speeds: o.speeds || {},
      gait: {
        walk: (o.gait?.walk ?? 1.35) * P,
        run: (o.gait?.run ?? 3.1) * P,
        sprint: 5 * P,
        crouch_walk: 1 * P,
      },
    });
  ((j.userData.look = o), (j.userData.rig = i));
  let X = { Wnew: R.Wnew, skeleton: R.skeleton },
    J = R.meshes;
  ((j.userData.setWeapon = async (ie) => {
    let we = j.userData.sheet;
    if (!we || o.kind !== 'hero') return;
    let { heroLook: ce } = await import('./look.js'),
      ke = ce(we, { prefer: ie === 'ranged' ? 'ranged' : 'melee' });
    ie === 'none' && ((ke.gear.main = null), (ke.gear.off = null));
    let Qe = await oT(ke, s, gearPalette(ke), x, m),
      N = bakeSkinnedMeshes(i, [...D, ...Qe], c, r, s, X);
    for (let L of J) (r.remove(L), L.geometry.dispose());
    J = N.meshes;
    for (let L of J) r.add(L);
    ((o.gear = ke.gear),
      (o.style = ke.style),
      Object.assign(j.anims, {
        ...ANIM_CLIPS,
        ...(RACE_CLIPS[o.family] || {}),
        ...(GRIP_CLIPS[ke.style] || {}),
      }),
      ue(ke.grips || []));
  }),
    (j.userData.materials = { atlas: f }));
  let Z = p / ANIM_PELVIS_HEIGHT,
    K = Fz(i, t, Z, h, J, A),
    ve = new Vector3(NaN, 0, 0);
  j.post.push(() => {
    h.position.equals(ve) ||
      (h.position.multiplyScalar(Z),
      K && (h.position.z += K.dz * Math.min(1, Math.max(0, (K.restZ - h.position.z) / (K.restZ - K.lowZ)))),
      ve.copy(h.position));
  });
  let ge = [],
    ue = (ie) => {
      let we = Nz(t);
      ge = [];
      for (let [ce, ke] of we) ie.some((Qe) => ce.endsWith(`_${Qe}`)) && ge.push([i.byName.get(ce), ke]);
    };
  (ue(o.grips || []),
    j.post.push(() => {
      for (let [ie, we] of ge) ie && ie.quaternion.copy(we);
    }));
  for (let ie of o.missingFingers || []) {
    let [we, ce] = ie.split('_'),
      ke = i.byName.get(`${we}_01_${ce}`);
    ke && ke.scale.setScalar(0.02);
  }
  let Q = o.posture?.hunch || 0;
  if (Q) {
    let we = [
      [i.byName.get('spine_01'), new Quaternion().setFromAxisAngle(an(1, 0, 0), Q * 0.25)],
      [i.byName.get('spine_02'), new Quaternion().setFromAxisAngle(an(1, 0, 0), Q * 0.3)],
      [i.byName.get('spine_03'), new Quaternion().setFromAxisAngle(an(1, 0, 0), Q * 0.2)],
      [i.byName.get('neck_01'), new Quaternion().setFromAxisAngle(an(1, 0, 0), -Q * 0.45)],
      [i.byName.get('Head'), new Quaternion().setFromAxisAngle(an(1, 0, 0), -Q * 0.25)],
    ]
      .filter(([ce]) => ce)
      .map(([ce, ke]) => ({ b: ce, q: ke, base: ce.quaternion.clone(), last: new Quaternion(NaN, 0, 0, 1) }));
    j.post.push(() => {
      for (let ce of we)
        (ce.b.quaternion.equals(ce.last) || ce.base.copy(ce.b.quaternion),
          ce.b.quaternion.copy(ce.base).multiply(ce.q),
          ce.last.copy(ce.b.quaternion));
    });
  }
  let oe = Uz(j, i, s, () => o);
  return (
    oe && j.post.push(oe),
    j.play('idle', 0),
    j.current && (j.current.time = Math.random() * j.current.getClip().duration),
    j
  );
}
function Fz(o, e, t, a, n, s) {
  let i = e.get('Death01'),
    r = e.get('Idle_Loop')?.tracks.find((w) => w.name === 'pelvis.position'),
    l = n.find((w) => w.isSkinnedMesh);
  if (!i || !r || !l) return null;
  let c = [];
  o.root.traverse((w) => c.push([w, w.position.clone(), w.quaternion.clone()]));
  let d = new AnimationMixer(o.root),
    u = d.clipAction(i);
  (u.play(), d.setTime(i.duration - 0.001), a.position.multiplyScalar(t));
  let h = a.position.z;
  (s.updateMatrixWorld(!0), l.skeleton.update());
  let p = l.geometry.attributes.gpar,
    m = l.geometry.attributes.position.count,
    _ = !1;
  for (let w = 0; w < m && !_; w += 7) _ = p.getZ(w) < 0.5;
  let b = new Vector3(),
    f = 1 / 0;
  for (let w = 0; w < m; w += 3)
    (_ && p.getZ(w) >= 0.5) || (l.getVertexPosition(w, b).applyMatrix4(l.matrixWorld), b.y < f && (f = b.y));
  let v = a.getWorldPosition(new Vector3()).y;
  ((a.position.z += 0.1), s.updateMatrixWorld(!0));
  let x = (a.getWorldPosition(new Vector3()).y - v) / 0.1;
  (u.stop(), d.uncacheRoot(o.root));
  for (let [w, k, T] of c) (w.position.copy(k), w.quaternion.copy(T));
  s.updateMatrixWorld(!0);
  let g = r.values[2] * t,
    y = (-0.02 - f) / (x || 1);
  return !Number.isFinite(y) || Math.abs(y) < 0.005 || g - h < 0.2 ? null : { restZ: g, lowZ: h, dz: y };
}
function Uz(o, e, t, a) {
  let n = ['r', 'l']
    .map((h) => {
      let p = e.byName.get(`hand_${h}`);
      if (!p) return null;
      let m = new Quaternion().setFromRotationMatrix(new Matrix4().extractRotation(gripMatrix(t, h))),
        _ = new Vector3(0, 1, 0).applyQuaternion(m);
      e.root.updateMatrixWorld(!0);
      let b = p.getWorldQuaternion(new Quaternion()),
        f = _.applyQuaternion(b.invert()).normalize();
      return {
        side: h,
        hand: p,
        dLocal: f,
        base: p.quaternion.clone(),
        last: new Quaternion(NaN, 0, 0, 1),
        w: 0,
      };
    })
    .filter(Boolean);
  if (!n.length) return null;
  let s = new Quaternion(),
    i = new Quaternion(),
    r = new Vector3(),
    l = new Vector3(),
    c = new Quaternion(),
    d = new Quaternion(),
    u = new Quaternion();
  return (h) => {
    let p = a(),
      m = p.gear || {},
      _ = Oz.has(o.currentName) && p.style !== 'crossbow';
    for (let b of n) {
      let f = b.side === 'r' ? m.main : m.off,
        v = _ && f && !qz.test(f) ? 1 : 0;
      if (
        ((b.w += (v - b.w) * Math.min(1, (h || 0.016) * 7)),
        b.hand.quaternion.equals(b.last) || b.base.copy(b.hand.quaternion),
        b.w < 0.002)
      ) {
        (b.hand.quaternion.copy(b.base), b.last.copy(b.base));
        continue;
      }
      let x = Bz.test(f || ''),
        g = b.side === 'r' ? -1 : 1;
      (x ? l.set(0.1 * g, 0.93, 0.35) : l.set(0.08 * g, -0.55, 0.83),
        o.root.getWorldQuaternion(i),
        l.normalize().applyQuaternion(i),
        b.hand.parent.getWorldQuaternion(s),
        r.copy(b.dLocal).applyQuaternion(b.base).applyQuaternion(s),
        d.setFromUnitVectors(r, l),
        c.slerpQuaternions(u, d, b.w));
      let y = s.clone().invert().multiply(c).multiply(s).multiply(b.base);
      (b.hand.quaternion.copy(y), b.last.copy(y));
    }
  };
}
async function oT(o, e, t, a, n) {
  let s = [],
    i = (c, d, u = {}) => c && s.push({ geometry: c, material: a, bone: d, ...u }),
    r = (c) => c && c.translate(n.x, n.y, n.z),
    l = o.extras || {};
  if (
    (l.horns && i(r(hornsGeometry(l.horns.kind, l.horns.color, l.horns.scale || 1)), 'Head'),
    l.tusks && i(r(tusksGeometry(l.tusks)), 'Head'),
    l.frill && i(r(frillGeometry(l.frill.kind, l.frill.color)), 'Head'),
    l.tail)
  ) {
    let c = tn(e, 'pelvis');
    s.push({ geometry: tailGeometry(c, l.tail.color, l.tail), material: a, weights: tailWeights(c.y) });
  }
  if (o.undead || o.gear?.kk) {
    let c = await loadMonsterPieces();
    if (o.undead)
      for (let d of skeletonParts(e, { ...o.undead, pieces: c }))
        s.push({ geometry: d.geometry, material: a, bone: d.bone });
    for (let d of o.gear?.kk || []) {
      let u;
      if (d.bone === 'Head') {
        let h = (c.headScale || 0.2) * (o.undead?.headScale ?? 1);
        ((u = pieceGeometry(c, d.name, {
          matrix: mat.mul(mat.T(n.x, n.y - 0.055, n.z + 0.005), mat.S(h)),
          metal: d.name === 'kk_casco' ? 0.6 : 0,
        })),
          u && i(u, 'Head'));
      } else if (d.hand) {
        if (((u = pieceGeometry(c, d.name, { metal: 0.5 })), !u)) continue;
        u.computeBoundingBox();
        let h = u.boundingBox,
          p = d.name.includes('escudo'),
          m = p ? h.max.x - h.min.x : h.max.y - h.min.y,
          _ = p ? 0.48 : d.name === 'kk_baston' ? 1.6 : 0.75;
        if ((u.scale(_ / m, _ / m, _ / m), p)) {
          let f = tn(e, 'lowerarm_l').lerp(tn(e, 'hand_l'), 0.45);
          (u.applyMatrix4(mat.mul(mat.T(f.x, f.y + 0.07, f.z), mat.R(-90, 0, 0), mat.R(0, 0, 90))),
            i(u, 'lowerarm_l'));
        } else (u.applyMatrix4(gripMatrix(e, d.hand)), i(u, `hand_${d.hand}`));
      }
    }
  }
  if (o.gear?.rags) {
    let c = tn(e, 'pelvis');
    s.push({
      geometry: ragsGeometry(e, o.gear.rags, { y0: c.y + 0.06, y1: c.y - 0.32 }),
      material: a,
      weights: iT(c.y + 0.06),
    });
  }
  return (Gz(o, e, t, i, s, a, n), s);
}
function gripMatrix(o, e) {
  let t = tn(o, `hand_${e}`),
    a = e === 'r' ? -1 : 1;
  return mat.mul(mat.T(t.x + a * 0.088, t.y - 0.028, t.z - 0.004), mat.R(90, 0, 0), mat.R(0, a * 90, 0));
}
function jz(o, e) {
  let t = sT(o),
    a = o.geometry.index,
    n = [],
    s = (i, r, l) =>
      (Math.sin(i * 37.1 + r * 11.7) * Math.cos(l * 29.3 - r * 23.9) + Math.sin(r * 61.3 + i * 7.1) * 0.5) *
        0.5 +
      0.5;
  for (let i = 0; i < a.count; i += 3) {
    let r = a.getX(i),
      l = a.getX(i + 1),
      c = a.getX(i + 2),
      d = (t[r * 3] + t[l * 3] + t[c * 3]) / 3,
      u = (t[r * 3 + 1] + t[l * 3 + 1] + t[c * 3 + 1]) / 3,
      h = (t[r * 3 + 2] + t[l * 3 + 2] + t[c * 3 + 2]) / 3;
    s(d, u, h) + (u < 0.6 ? 0.25 : 0) * (0.6 - u) * 3 < 1 - e && n.push(r, l, c);
  }
  return n;
}
function Gz(o, e, t, a, n, s, i) {
  let r = o.gear || {},
    l = o.body === 'f',
    c = (g) => tn(e, `hand_${g}`),
    d = (g, y = new Matrix4()) => gripMatrix(e, g).multiply(y),
    u = (g, y, w) => {
      let k = weaponGeometry(g, t);
      k && (k.applyMatrix4(d(y, w)), a(k, `hand_${y}`));
    };
  if ((r.main && u(r.main, 'r'), r.off && u(r.off, 'l'), r.shield)) {
    let g = shieldGeometry(r.shield, t),
      y = tn(e, 'lowerarm_l'),
      w = c('l'),
      k = y.clone().lerp(w, 0.45);
    (g.applyMatrix4(mat.mul(mat.T(k.x, k.y + 0.07, k.z), mat.R(-90, 0, 0), mat.R(0, 0, 90))),
      a(g, 'lowerarm_l'));
  }
  let h = tn(e, 'spine_03'),
    p = h.z - (l ? 0.15 : 0.17);
  for (let g of r.back || []) {
    let y = null;
    (g === 'carcaj'
      ? ((y = quiverGeometry(t)), y.applyMatrix4(mat.mul(mat.T(0.08, h.y - 0.3, p - 0.04), mat.R(0, 0, -25))))
      : g === 'laud'
        ? ((y = luteGeometry(t)),
          y.applyMatrix4(mat.mul(mat.T(-0.04, h.y - 0.15, p - 0.07), mat.R(0, 180, 35))))
        : g === 'mochila'
          ? ((y = backpackGeometry(t)), y.applyMatrix4(mat.T(0, h.y - 0.12, p - 0.1)))
          : g.startsWith('escudo:')
            ? ((y = shieldGeometry(g.slice(7), t)),
              y.applyMatrix4(mat.mul(mat.T(0, h.y - 0.05, p - 0.03), mat.R(0, 180, 0))))
            : g.startsWith('arma:') &&
              ((y = weaponGeometry(g.slice(5), t)),
              y && y.applyMatrix4(mat.mul(mat.T(0.02, h.y - 0.05, p - 0.06), mat.R(0, 0, 155)))),
      y && a(y, 'spine_03'));
  }
  let m = tn(e, 'pelvis'),
    _ = m.y + (l ? 0.1 : 0.08);
  if (r.book) {
    let g = bookGeometry(t);
    (g.applyMatrix4(mat.mul(mat.T(l ? 0.19 : 0.18, _ - 0.1, 0), mat.R(0, 90, 8))), a(g, 'pelvis'));
  }
  if (r.pouch) {
    let g = pouchGeometry(t);
    (g.applyMatrix4(mat.T(l ? -0.17 : -0.16, _ - 0.08, 0.05)), a(g, 'pelvis'));
  }
  if (r.sheath) {
    let g = weaponGeometry(r.sheath, t);
    g &&
      (g.applyMatrix4(mat.mul(mat.T(l ? 0.2 : 0.19, _ - 0.05, -0.04), mat.R(0, 0, 180), mat.R(-18, 0, 0))),
      a(g, 'pelvis'));
  }
  let b = tn(e, 'upperarm_l'),
    f = tn(e, 'upperarm_r');
  if (r.pauldrons) {
    let g = r.pauldrons === 'grandes' ? 1.25 : 1;
    for (let [y, w] of [
      [1, b],
      [-1, f],
    ]) {
      let k = pauldronGeometry(y, w.clone().add(an(-y * 0.02, 0.02, 0.01)), t, { size: g });
      n.push({
        geometry: k,
        material: s,
        weights: () => [
          [y > 0 ? 'upperarm_l' : 'upperarm_r', 0.55],
          [y > 0 ? 'clavicle_l' : 'clavicle_r', 0.45],
        ],
      });
    }
  }
  if (r.breastplate) {
    let g = l
        ? { y: h.y - 0.02, w: 0.19, h: 0.25, front: 0.175, back: 0.155, cz: -0 }
        : { y: h.y + 0.02, w: 0.215, h: 0.26, front: 0.155, back: 0.175, cz: -0.01 },
      y = breastplateGeometry(g, t, { plate: r.breastplate !== 'coraza' });
    n.push({
      geometry: y,
      material: s,
      weights: (w) =>
        w.y > h.y - 0.05
          ? [['spine_03', 1]]
          : w.y > h.y - 0.2
            ? [['spine_02', 1]]
            : [
                ['spine_01', 0.6],
                ['pelvis', 0.4],
              ],
    });
  }
  if (r.bracers)
    for (let g of ['l', 'r']) {
      let y = tn(e, `lowerarm_${g}`),
        w = c(g);
      a(
        cylinderBetween(y.clone().lerp(w, 0.25), y.clone().lerp(w, 0.92), 0.043, 0.037, t, {
          color: r.bracers === 'cuero' ? t.leather : null,
          metal: r.bracers === 'cuero' ? 0 : 1,
        }),
        `lowerarm_${g}`,
      );
    }
  if (r.greaves)
    for (let g of ['l', 'r']) {
      let y = tn(e, `calf_${g}`),
        w = tn(e, `foot_${g}`);
      a(
        cylinderBetween(
          y
            .clone()
            .lerp(w, 0.05)
            .add(an(0, 0, 0.02)),
          y
            .clone()
            .lerp(w, 0.72)
            .add(an(0, 0, 0.03)),
          0.068,
          0.058,
          t,
        ),
        `calf_${g}`,
      );
    }
  let v = { x: i.x, y: i.y + 0.1, z: i.z + 0.005, r: l ? 0.098 : 0.104 },
    x = r.helmet || r.hat;
  if ((x && a(headwearGeometry(x, v, t), 'Head'), r.robe)) {
    let g = m.y + 0.13,
      y = robeGeometry({
        yTop: g,
        yBottom: r.robe === 'corta' ? 0.48 : 0.07,
        rTop: l ? 0.215 : 0.205,
        rBottom: r.robe === 'corta' ? 0.32 : 0.36,
        cz: m.z - 0.005,
        depth: 0.88,
        color: r.robeColor || t.cloth1,
        open: r.robeOpen || 0,
      });
    n.push({ geometry: y, material: s, weights: iT(g) });
  }
  if (r.tabard) {
    let g = r.tabardColor || t.cloth1,
      y = r.breastplate ? 0.075 : 0.022,
      w = h.y + (l ? 0.1 : 0.12);
    for (let k of tabardGeometry({
      g: l ? 'f' : 'm',
      top: w,
      hip: m.y + 0.02,
      bottom: r.tabard === 'corta' ? m.y - 0.22 : 0.48,
      w0: l ? 0.24 : 0.27,
      w1: 0.3,
      out: y,
      color: g,
    }))
      n.push({ geometry: k.geometry, material: s, weights: k.weights });
    if (r.emblem) {
      let k = (l ? 0.16 : 0.13) + y + 0.004,
        T = paint(new CircleGeometry(0.055, 14), {
          color: t.gold,
          metal: 0.8,
          matrix: mat.T(0, h.y - (l ? 0.08 : 0.06), k),
        }),
        E = [];
      for (let S = 0; S < 8; S++)
        E.push(
          paint(new ConeGeometry(0.014, 0.05, 3), {
            color: t.gold,
            metal: 0.8,
            matrix: mat.mul(
              mat.T(0, h.y - (l ? 0.08 : 0.06), k),
              mat.R(0, 0, S * 45),
              mat.T(0, 0.075, 0),
              mat.S(1, 1, 0.2),
            ),
          }),
        );
      n.push({ geometry: mergeParts([T, ...E]), material: s, bone: 'spine_03' });
    }
  }
  if (r.cape) {
    let g = h.z - (l ? 0.18 : 0.2),
      y = capeGeometry({
        y0: h.y + 0.13,
        y1: r.cape === 'corta' ? m.y - 0.1 : 0.2,
        w0: 0.36,
        w1: r.cape === 'corta' ? 0.46 : 0.62,
        z: g,
        bulge: 0.05,
        color: r.capeColor || t.cloth1,
        back: !0,
      });
    n.push({ geometry: y, material: s, weights: Vz(h.y, m.y) });
    let w = paint(new TorusGeometry(0.2, 0.012, 4, 14, Math.PI), {
      color: r.capeColor || t.cloth1,
      matrix: mat.mul(mat.T(0, h.y + 0.13, h.z - 0.03), mat.R(90, 0, 0), mat.S(1.05, 0.9, 1)),
    });
    n.push({ geometry: w, material: s, bone: 'spine_03' });
  }
  if (r.mantle) {
    let g = r.mantle === 'hojas',
      y = mantleGeometry({
        y: h.y + 0.12,
        rx: l ? 0.17 : 0.19,
        rz: l ? 0.13 : 0.14,
        cz: h.z - 0.02,
        color: g ? '#4f6a32' : r.mantleColor || '#6a5440',
        thick: 0.07,
        leaves: g,
      });
    n.push({
      geometry: y,
      material: s,
      weights: (w) => [
        ['spine_03', 0.7],
        [w.x > 0 ? 'clavicle_l' : 'clavicle_r', 0.3],
      ],
    });
  }
  if (r.apron)
    for (let g of tabardGeometry({
      g: l ? 'f' : 'm',
      top: h.y - 0.02,
      hip: m.y + 0.02,
      bottom: m.y - 0.42,
      w0: 0.24,
      w1: 0.34,
      out: 0.018,
      color: r.apron,
      back: !1,
      split: !1,
    }))
      n.push({ geometry: g.geometry, material: s, weights: g.weights });
  if (r.chain) {
    let g = paint(new TorusGeometry(l ? 0.1 : 0.115, 0.007, 4, 18, Math.PI), {
      color: t.gold,
      metal: 1,
      matrix: mat.mul(mat.T(0, h.y + 0.08, h.z + (l ? 0.06 : 0.05)), mat.R(180, 0, 0), mat.R(-62, 0, 0)),
    });
    a(
      mergeParts([
        g,
        paint(new CylinderGeometry(0.025, 0.025, 0.008, 10), {
          color: t.gold,
          metal: 1,
          matrix: mat.mul(mat.T(0, h.y - 0.03, h.z + (l ? 0.17 : 0.155)), mat.R(90, 0, 0)),
        }),
      ]),
      'spine_03',
    );
  }
  if (
    (r.glasses && a(glassesGeometry({ x: i.x, y: i.y + 0.098, z: i.z + (l ? 0.1 : 0.112) }, t), 'Head'),
    r.necklace)
  ) {
    let g = tn(e, 'neck_01'),
      y = [];
    for (let w = 0; w < 9; w++) {
      let k = (-0.75 + (w / 8) * 1.5) * Math.PI * 0.5,
        T = Math.sin(k) * (l ? 0.075 : 0.085),
        E = g.z + Math.cos(k) * (l ? 0.07 : 0.08) + 0.01,
        S = g.y - 0.06 - Math.cos(k) * 0.03;
      y.push(
        paint(new ConeGeometry(0.008, 0.04, 5), {
          color: '#e8dcc0',
          matrix: mat.mul(mat.T(T, S, E), mat.R(180, 0, 0), mat.T(0, 0.015, 0)),
        }),
      );
    }
    (y.push(
      paint(new TorusGeometry(0.085, 0.004, 4, 16), {
        color: '#3a2a1c',
        matrix: mat.mul(mat.T(0, g.y - 0.05, g.z + 0.01), mat.R(75, 0, 0)),
      }),
    ),
      a(mergeParts(y), 'spine_03'));
  }
  r.sash &&
    a(
      beltGeometry({ y: _, rx: l ? 0.15 : 0.16, rz: l ? 0.12 : 0.13, cz: m.z + 0, P: t, color: r.sash }),
      'pelvis',
    );
}
function iT(o) {
  return (e) => {
    let t = Math.min(1, Math.max(0, (o - e.y) / 0.55)),
      a = Math.max(-1, Math.min(1, e.x / 0.12)),
      n = (0.5 + a * 0.5) * t * 0.85,
      s = (0.5 - a * 0.5) * t * 0.85;
    return [
      ['pelvis', 1 - n - s + 0.001],
      ['thigh_l', n],
      ['thigh_r', s],
    ];
  };
}
function Vz(o, e) {
  return (t) => {
    if (t.y > o - 0.05) return [['spine_03', 1]];
    if (t.y > e + 0.1) {
      let n = (o - 0.05 - t.y) / (o - e - 0.15);
      return [
        ['spine_03', 1 - n],
        ['spine_01', n],
      ];
    }
    let a = Math.min(1, (e + 0.1 - t.y) / 0.7);
    return [
      ['spine_01', 0.3 * (1 - a)],
      ['pelvis', 0.7 + 0.1 * a],
      ['thigh_l', a * 0.15],
      ['thigh_r', a * 0.15],
    ];
  };
}
const an = (o, e, t) => new Vector3(o, e, t);
const Dz = {
  raya: 'raya',
  largo: 'largo',
  mono: 'mono',
  coleta: 'raya',
  trenza: 'rapado_f',
  rapado: 'rapado',
  cresta: 'rapado',
  calvo: null,
};
const Hz = [
  'pelvis',
  'spine_01',
  'spine_02',
  'spine_03',
  'neck_01',
  'Head',
  'clavicle_l',
  'clavicle_r',
  'upperarm_l',
  'upperarm_r',
  'lowerarm_l',
  'lowerarm_r',
  'hand_l',
  'hand_r',
  'thigh_l',
  'thigh_r',
  'calf_l',
  'calf_r',
];
const dv = new Map();
let dc = null;
const Oz = new Set(['idle', 'idle_alt', 'walk', 'run', 'sprint', 'walk_back', 'talk', 'sit', 'sit_talk']);
const Bz = /great|maul|quarterstaff|staff|spear|glaive|halberd|javelin|bow|crook|pike|lance|trident/;
const qz = /mug|holy_symbol|book|lute|torch/;

export { buildHumanoid, gripMatrix };
