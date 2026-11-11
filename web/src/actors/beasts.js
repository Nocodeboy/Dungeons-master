// actors/beasts.js
// Reconstruido de publicado/juego.js (módulo __esm «dT»). Nombres locales aún minificados.

import {
  Bone,
  BufferAttribute,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  MathUtils,
  Matrix4,
  Quaternion,
  Skeleton,
  SkinnedMesh,
  SphereGeometry,
  Vector3,
} from 'three';
import { x2 } from './materials.js';
import { paint, mergeParts, mat } from './geometry.js';
import { hi } from './sculpt.js';
import { Character } from './character.js';
import { Yn } from './appearance.js';

function Kz(o) {
  let e = [],
    t = new SphereGeometry(0.32, 14, 10);
  (t.scale(0.95, 0.62, 1.15), e.push(paint(t, { color: o.body, vary: 0.12 })));
  let a = [
    [0.06, 0.12, 0.33, 0.05],
    [-0.06, 0.12, 0.33, 0.05],
    [0.13, 0.15, 0.28, 0.03],
    [-0.13, 0.15, 0.28, 0.03],
    [0.05, 0.19, 0.27, 0.025],
    [-0.05, 0.19, 0.27, 0.025],
    [0.16, 0.1, 0.24, 0.022],
    [-0.16, 0.1, 0.24, 0.022],
  ];
  for (let [s, i, r, l] of a)
    e.push(
      paint(new SphereGeometry(l, 8, 6), { color: o.eyes, metal: 0.4, glow: 0.8, matrix: mat.T(s, i, r) }),
    );
  for (let s of [-1, 1])
    (e.push(
      paint(new SphereGeometry(0.075, 8, 6), {
        color: o.body,
        matrix: mat.mul(mat.T(s * 0.08, -0.04, 0.36), mat.S(0.9, 1.1, 1.2)),
      }),
    ),
      e.push(
        paint(
          hi([Ma(s * 0.08, -0.1, 0.42), Ma(s * 0.07, -0.2, 0.44), Ma(s * 0.03, -0.25, 0.39)], 0.022, 0.003, {
            radial: 6,
            segs: 6,
          }),
          { color: o.fang, metal: 0.3 },
        ),
      ));
  for (let s of [-1, 1])
    e.push(
      paint(
        hi([Ma(s * 0.16, -0.02, 0.3), Ma(s * 0.22, 0.04, 0.45), Ma(s * 0.2, -0.08, 0.55)], 0.03, 0.018, {
          radial: 6,
          segs: 6,
        }),
        { color: o.leg },
      ),
    );
  let n = Yn(77);
  for (let s = 0; s < 40; s++) {
    let i = n() * Math.PI * 2,
      r = n() * 0.9,
      l = Ma(Math.cos(i) * Math.sin(r) * 0.3, Math.cos(r) * 0.2, Math.sin(i) * Math.sin(r) * 0.36),
      c = new Quaternion().setFromUnitVectors(Ma(0, 1, 0), l.clone().normalize());
    e.push(
      paint(new ConeGeometry(0.008, 0.07, 3), {
        color: o.hair,
        matrix: new Matrix4().compose(l, c, Ma(1, 1, 1)),
      }),
    );
  }
  return mergeParts(e);
}
function Jz(o) {
  let e = [],
    t = new SphereGeometry(0.5, 18, 14);
  (t.scale(0.92, 0.78, 1.18), t.translate(0, 0.12, -0.55));
  let a = paint(t, { color: o.body, vary: 0.1 }),
    n = a.attributes.position,
    s = a.attributes.color,
    i = new Color(o.body),
    r = new Color(o.mark);
  for (let c = 0; c < n.count; c++) {
    let d = n.getX(c),
      u = n.getY(c),
      h = n.getZ(c),
      p = MathUtils.smoothstep(u, 0.2, 0.45),
      m = Math.abs(Math.sin((h + 0.55) * 9 + Math.abs(d) * 7)),
      _ = p * (m > 0.82 ? 1 : 0) * (Math.abs(d) < 0.3 ? 1 : 0),
      b = Math.abs(d) < 0.04 && p > 0.5 ? 0.6 : 0,
      f = Math.max(_, b),
      v = i.clone().lerp(r, f);
    s.setXYZ(c, v.r, v.g, v.b);
  }
  (e.push(a),
    e.push(
      paint(new ConeGeometry(0.06, 0.12, 6), {
        color: o.leg,
        matrix: mat.mul(mat.T(0, 0.05, -1.13), mat.R(-90, 0, 0)),
      }),
    ));
  let l = Yn(91);
  for (let c = 0; c < 70; c++) {
    let d = l() * Math.PI * 2,
      u = l() * 1.3,
      h = Ma(
        Math.cos(d) * Math.sin(u) * 0.46,
        Math.cos(u) * 0.39 + 0.12,
        Math.sin(d) * Math.sin(u) * 0.59 - 0.55,
      ),
      p = h
        .clone()
        .sub(Ma(0, 0.12, -0.55))
        .normalize(),
      m = new Quaternion().setFromUnitVectors(Ma(0, 1, 0), p);
    e.push(
      paint(new ConeGeometry(0.01, 0.09, 3), {
        color: o.hair,
        matrix: new Matrix4().compose(h, m, Ma(1, 1, 1)),
      }),
    );
  }
  return mergeParts(e);
}
function fv(o, e, t, a, n) {
  let s = [Ma(0, 0, 0), Ma(0, o * 0.5, 0), Ma(0, o, 0)],
    i = [paint(hi(s, e, t, { radial: 7, segs: 4, closed: !0 }), { color: a.leg, vary: 0.08 })];
  (i.push(paint(new SphereGeometry(e * 1.15, 7, 5), { color: a.leg })),
    n &&
      i.push(
        paint(new CylinderGeometry(t * 1.12, t * 1.12, o * 0.18, 7, 1, !0), {
          color: a.mark,
          matrix: mat.T(0, o * 0.86, 0),
        }),
      ));
  for (let r = 0; r < 6; r++)
    i.push(
      paint(new ConeGeometry(0.006, 0.05, 3), {
        color: a.hair,
        matrix: mat.mul(mat.T(0, o * (0.2 + r * 0.12), 0), mat.R(0, r * 70, 55), mat.T(0, e * 0.9, 0)),
      }),
    );
  return mergeParts(i);
}
function du(o, e) {
  let t = o.attributes.position.count,
    a = new Uint16Array(t * 4),
    n = new Float32Array(t * 4);
  for (let s = 0; s < t; s++) ((a[s * 4] = e), (n[s * 4] = 1));
  return (
    o.setAttribute('skinIndex', new BufferAttribute(a, 4)),
    o.setAttribute('skinWeight', new BufferAttribute(n, 4)),
    o
  );
}
async function cT({ index: o = 0, scale: e = 1 } = {}) {
  let t = Yn(500 + o * 7),
    a = {
      body: ['#2a221c', '#30261e', '#241e1a'][o % 3],
      leg: ['#3a2e24', '#40342a', '#342a22'][o % 3],
      hair: '#5a4a3a',
      mark: ['#a08a5a', '#8a6a3a', '#b09a70'][o % 3],
      fang: '#1a1410',
      eyes: '#c02818',
    },
    n = [0.55, 0.62, 0.42],
    s = [],
    i = (y, w) => {
      let k = new Bone();
      return ((k.name = y), w && w.add(k), s.push(k), k);
    },
    r = i('raiz'),
    l = i('cuerpo', r),
    c = i('abdomen', l),
    d = [];
  for (let y = 0; y < Yf; y++) d.push([i(`pata${y}_0`, r), i(`pata${y}_1`, r), i(`pata${y}_2`, r)]);
  let u = [du(Kz(a), 1), du(Jz(a), 2)];
  for (let y = 0; y < Yf; y++)
    (u.push(du(fv(n[0], 0.045, 0.035, a, !0), 3 + y * 3)),
      u.push(du(fv(n[1], 0.034, 0.024, a, !0), 4 + y * 3)),
      u.push(du(fv(n[2], 0.022, 0.01, a, !1), 5 + y * 3)));
  let h = mergeParts(u),
    p = x2(),
    m = new SkinnedMesh(h, p),
    _ = new Group();
  (_.add(r), _.add(m), l.position.set(0, 0, 0), _.updateMatrixWorld(!0));
  let b = new Skeleton(
    s,
    s.map(() => new Matrix4()),
  );
  (m.bind(b, new Matrix4()), (m.castShadow = !0), (m.receiveShadow = !0), (m.frustumCulled = !1));
  let f = new Group();
  f.name = 'arana_gigante';
  let v = (0.9 + t() * 0.12) * e;
  (_.scale.setScalar(v), f.add(_));
  let x = Zz({ bodyB: l, abdB: c, legB: d, lens: n, rand: t }),
    g = new Character({
      id: 'giant_spider',
      kind: 'monster',
      root: f,
      model: _,
      procedural: x,
      anims: {},
      head: l,
      height: 0.9 * v,
      radius: 1 * v,
    });
  return ((g.userData.materials = { gear: p }), (g.speed = 2.2), g);
}
function Zz({ bodyB: o, abdB: e, legB: t, lens: a, rand: n }) {
  let s = {
      name: 'idle',
      t: 0,
      once: null,
      gait: 0,
      speed: 0,
      dead: 0,
      lift: 0,
      rear: 0,
      recoil: 0,
      curl: 0,
      hold: !1,
    },
    i = [],
    r = [];
  for (let _ = 0; _ < Yf; _++) {
    let b = _ < 4 ? 1 : -1,
      f = _ % 4,
      v = Yz[f] * 0.42;
    i.push(Ma(b * 0.22, 0.02, v));
    let x = [0.75, 0.25, -0.2, -0.65][f];
    r.push(Ma(b * (1.05 - Math.abs(x) * 0.15), 0, v + x * 1));
  }
  let l = 0.62,
    c = Ma(0, 0, 0),
    d = Ma(0, 1, 0),
    u = (_, b, f) => {
      (_.position.copy(b), c.copy(f).sub(b).normalize(), _.quaternion.setFromUnitVectors(d, c));
    },
    h = {
      attack_melee: 0.9,
      attack_bite: 0.9,
      hit: 0.45,
      die: 1.4,
      dodge: 0.5,
      cheer: 1.4,
      taunt: 1.4,
      cast: 0.9,
      attack_ranged: 0.9,
      block: 0.45,
      interact: 0.8,
      revive: 1.2,
      awaken: 1.2,
    },
    p = (_) =>
      ({
        Sword_Attack: 'attack_melee',
        Death01: 'die',
        Hit_Chest: 'hit',
        Hit_Head: 'hit',
        Jog_Fwd_Loop: 'run',
        Walk_Loop: 'walk',
        Sprint_Loop: 'run',
        Idle_Loop: 'idle',
        Sword_Idle: 'idle_combat',
      })[_] || _;
  return {
    play(_, { speed: b } = {}) {
      ((_ = p(_)), !(s.dead && _ !== 'revive') && ((s.once = null), (s.name = _), (s.rate = b || 1)));
    },
    playOnce(_, { speed: b = 1, hold: f = !1 } = {}) {
      ((_ = p(_)), (_ === 'prone' || _ === 'down') && (_ = 'die'));
      let v = (h[_] || 0.8) / b;
      return (
        (s.once = { name: _, t: 0, d: v, hold: f }),
        _ === 'revive' && (s.dead = 0),
        new Promise((x) => (s.once.res = x))
      );
    },
    length(_) {
      return h[p(_)] || 0.8;
    },
    update(_, b, f = !1) {
      f ? (s.t = _) : (s.t += _);
      let v = s.name,
        g =
          v === 'walk' || v === 'run' || v === 'sprint' || v === 'crouch_walk' ? (v === 'walk' ? 1 : 1.8) : 0;
      ((s.speed += (g - s.speed) * Math.min(1, _ * 6)),
        (s.gait += _ * (1.4 + s.speed * 2.6) * (s.rate || 1)));
      let y = 0,
        w = 0,
        k = 0,
        T = s.dead,
        E = 0,
        S = s.once;
      if (S) {
        S.t += _;
        let R = Math.min(1, S.t / S.d),
          A = Math.sin(R * Math.PI);
        (S.name === 'attack_melee' ||
        S.name === 'attack_bite' ||
        S.name === 'cast' ||
        S.name === 'attack_ranged'
          ? ((y = R < 0.55 ? MathUtils.smoothstep(R, 0, 0.5) : 1 - MathUtils.smoothstep(R, 0.55, 1)),
            (k = R > 0.5 && R < 0.8 ? Math.sin(((R - 0.5) / 0.3) * Math.PI) : 0))
          : S.name === 'hit' || S.name === 'block'
            ? (w = A)
            : S.name === 'dodge'
              ? (E = A)
              : S.name === 'cheer' || S.name === 'taunt'
                ? (y = A * 1.2)
                : S.name === 'die'
                  ? (T = R)
                  : (S.name === 'revive' || S.name === 'awaken') && (T = 1 - R),
          R >= 1 && (S.name === 'die' && (s.dead = 1), (s.once = null), S.res?.()));
      }
      let z = Math.sin(s.t * 2.2) * 0.012,
        D = Math.abs(Math.sin(s.gait * Math.PI)) * 0.03 * Math.min(1, s.speed),
        M = l * (1 - T * 0.75) + z + D + E * 0.25 + y * 0.15;
      (o.position.set(0, M, -w * 0.12 - E * 0.3),
        o.rotation.set(
          -y * 0.55 + w * 0.12 - k * 0.25,
          Math.sin(s.t * 0.7) * 0.03,
          Math.sin(s.gait * Math.PI) * 0.03 * s.speed,
        ),
        e.rotation.set(Math.sin(s.t * 2.2) * 0.04 + y * 0.45, 0, 0),
        e.position.set(0, 0, 0),
        o.updateMatrixWorld(!0));
      for (let R = 0; R < Yf; R++) {
        let A = R < 4 ? 1 : -1,
          P = R % 4,
          I = (P + (A > 0 ? 0 : 1)) % 2,
          U = (s.gait + I * 0.5) % 1,
          j = o.localToWorld(i[R].clone());
        j.applyMatrix4(new Matrix4().copy(o.parent.matrixWorld).invert());
        let X = r[R].clone(),
          J = 0.32 * Math.min(1.4, s.speed);
        (s.speed > 0.02
          ? U < 0.5
            ? ((X.z += -J / 2 + (U / 0.5) * J),
              (X.y += Math.sin((U / 0.5) * Math.PI) * 0.18 * Math.min(1, s.speed)))
            : (X.z += J / 2 - ((U - 0.5) / 0.5) * J)
          : (X.y += Math.max(0, Math.sin(s.t * 1.3 + R * 1.7)) * 0.015),
          P === 0 && (y || k)
            ? X.set(A * 0.55, M + 0.55 * y - k * 0.5, 0.75 + k * 0.35)
            : P === 1 && y && (X.y += y * 0.25),
          T && X.lerp(Ma(A * 0.25, M * 0.4, i[R].z * 0.8), T));
        let Z = a[0],
          K = a[1],
          ve = a[2],
          ue = X.clone()
            .add(Ma(A * 0.06, ve * 0.92, 0))
            .clone()
            .sub(j),
          Q = Math.min(ue.length(), Z + K - 0.001),
          oe = ue.clone().normalize(),
          ie = (Z * Z + Q * Q - K * K) / (2 * Z * Q),
          we = Math.acos(MathUtils.clamp(ie, -1, 1)),
          ce = Ma(A * 0.5, 1, 0).normalize(),
          ke = ce.clone().addScaledVector(oe, -ce.dot(oe)).normalize(),
          Qe = oe.clone().multiplyScalar(Math.cos(we)).addScaledVector(ke, Math.sin(we)),
          N = j.clone().addScaledVector(Qe, Z),
          L = j.clone().addScaledVector(oe, Q),
          [O, B, $] = t[R];
        (u(O, j, N), u(B, N, L), u($, L, X.clone().add(Ma(A * 0.02, 0, 0.01))));
      }
    },
  };
}
const Ma = (o, e, t) => new Vector3(o, e, t);
const Yf = 8;
const Yz = [0.62, 0.22, -0.18, -0.55];

export { cT };
