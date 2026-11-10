// combat/creatures.js
// Reconstruido de publicado/juego.js (módulo __esm «b1»). Nombres locales aún minificados.

import {
  CapsuleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  QuadraticBezierCurve3,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three';

function uH() {
  let o = new Group(),
    e = new MeshStandardMaterial({ color: 3811870, roughness: 0.85 }),
    t = new QuadraticBezierCurve3(new Vector3(0, -0.46, 0), new Vector3(0, 0, 0.18), new Vector3(0, 0.46, 0));
  return (o.add(new Mesh(new TubeGeometry(t, 16, 0.013, 5), e)), o);
}
function m1(o) {
  return (e) => {
    let t = e.getObjectByName('Head');
    if (!t) return;
    let a = new MeshBasicMaterial({ color: new Color(o).multiplyScalar(3) }),
      n = new Matrix4().copy(t.matrixWorld).invert(),
      s = t.getWorldPosition(new Vector3());
    for (let i of [-1, 1]) {
      let r = new Mesh(new SphereGeometry(0.018, 6, 4), a);
      (r.position.copy(
        s
          .clone()
          .add(new Vector3(i * 0.04, 0.07, 0.1))
          .applyMatrix4(n),
      ),
        t.add(r));
    }
  };
}
function t3(o) {
  let e = o.template || '';
  return e === 'skeleton' || e === 'skeleton_archer'
    ? {
        outfit: 'Male_Peasant',
        variant: 'T_Peasant_2_BaseColor',
        recolor: { from: 0.08, width: 0.5, shift: 0, sat: 0.15, val: 0.45 },
        skin: 15656658,
        skinLum: !0,
        scale: 0.95,
        anim: e === 'skeleton' ? 'Sword_Idle' : 'Idle_Loop',
        walk: 'Walk_Loop',
        attach:
          e === 'skeleton'
            ? [
                {
                  prop: 'q_Sword_Bronze',
                  bone: 'hand_r',
                  scale: 0.55,
                  pos: [0, 0.05, 0.02],
                  rot: [0, 0, -90],
                },
                {
                  prop: 'q_Shield_Wooden',
                  bone: 'lowerarm_l',
                  scale: 0.75,
                  pos: [0.06, 0.13, -0.05],
                  rot: [0, 90, 0],
                },
              ]
            : [{ make: uH, bone: 'hand_l', scale: 1, pos: [0, 0.08, 0], rot: [0, 0, 90] }],
        extras: m1(10289072),
      }
    : e === 'zombie'
      ? {
          outfit: 'Male_Peasant',
          recolor: { from: 0.08, width: 0.5, shift: 0.15, sat: 0.4, val: 0.5 },
          skin: 9083512,
          skinLum: !0,
          scale: 1.02,
          anim: 'Idle_Loop',
          walk: 'Walk_Loop',
          extras: m1(14221178),
        }
      : e === 'wight'
        ? {
            outfit: 'Male_Ranger',
            variant: 'T_Ranger_3_BaseColor',
            recolor: { from: 0.33, width: 0.5, shift: 0.3, sat: 0.4, val: 0.35 },
            skin: 11056328,
            skinLum: !0,
            scale: 1.08,
            anim: 'Sword_Idle',
            walk: 'Walk_Loop',
            attach: [
              { prop: 'antique_estoc', bone: 'hand_r', scale: 0.66, pos: [0, 0.07, 0.03], rot: [0, 0, -90] },
            ],
            extras: m1(10475775),
          }
        : {
            outfit: 'Male_Peasant',
            recolor: { from: 0.08, width: 0.3, shift: 0.5, sat: 0.5, val: 0.6 },
            skin: 13150344,
            anim: 'Sword_Idle',
            walk: 'Jog_Fwd_Loop',
            attach: [
              { prop: 'q_Axe_Bronze', bone: 'hand_r', scale: 0.55, pos: [0, 0.05, 0.02], rot: [0, 0, -90] },
            ],
          };
}
function a3(o) {
  return !!g1[o] || o === 'giant_spider';
}
function hH(o) {
  let e = new MeshStandardMaterial({ color: 2761760, roughness: 0.55, metalness: 0.1 }),
    t = new MeshStandardMaterial({ color: 4864554, roughness: 0.95 }),
    a = new MeshBasicMaterial({ color: new Color(16724e3).multiplyScalar(2.2) }),
    n = new Group();
  n.name = `pj_${o}`;
  let s = new Group();
  n.add(s);
  let i = new Mesh(new SphereGeometry(0.62, 16, 12), t);
  (i.scale.set(1, 0.8, 1.25), i.position.set(0, 0.95, -0.75));
  let r = new Mesh(new SphereGeometry(0.42, 14, 10), e);
  (r.scale.set(1, 0.7, 1.1), r.position.set(0, 0.8, 0.15), s.add(i, r));
  let l = new Object3D();
  ((l.name = 'Head'), l.position.set(0, 0.95, 0.55), s.add(l));
  for (let u = 0; u < 8; u++) {
    let h = new Mesh(new SphereGeometry(u < 2 ? 0.07 : 0.04, 6, 4), a);
    (h.position.set(
      (u % 2 ? 1 : -1) * (0.08 + Math.floor(u / 2) * 0.06),
      0.95 + (u < 4 ? 0.06 : 0),
      0.55 - Math.floor(u / 2) * 0.03,
    ),
      s.add(h));
  }
  for (let u of [-1, 1]) {
    let h = new Mesh(new ConeGeometry(0.05, 0.25, 5), e);
    (h.position.set(u * 0.1, 0.62, 0.55), (h.rotation.x = Math.PI), s.add(h));
  }
  let c = [];
  for (let u = 0; u < 8; u++) {
    let h = u < 4 ? -1 : 1,
      p = u % 4,
      m = new Group();
    (m.position.set(h * 0.3, 0.82, 0.35 - p * 0.22),
      (m.rotation.y = h * (Math.PI / 2) + (p - 1.5) * 0.45 * -h));
    let _ = new Mesh(new CylinderGeometry(0.045, 0.06, 0.95, 5), e);
    ((_.rotation.z = Math.PI / 2 - 0.9), _.position.set(0, 0.3, 0.38), _.rotation.set(-0.9, 0, 0), m.add(_));
    let b = new Group();
    (b.position.set(0, 0.6, 0.72), m.add(b));
    let f = new Mesh(new CylinderGeometry(0.035, 0.02, 1.2, 5), t);
    (f.position.set(0, -0.5, 0.25),
      (f.rotation.x = 0.45),
      b.add(f),
      n.add(m),
      c.push({ hip: m, phase: u * 0.8 + (h > 0 ? Math.PI : 0) }));
  }
  n.traverse((u) => {
    u.isMesh && ((u.castShadow = !0), (u.receiveShadow = !0));
  });
  let d = pH(n, s, l, c, (u, h, p) => {
    u.hip.rotation.x = p ? Math.sin(h * 1.4 + u.phase) * 0.35 : Math.sin(h * 0.2 + u.phase) * 0.03;
  });
  return ((d.def.id = o), d);
}
function pH(o, e, t, a, n) {
  return {
    def: { scale: 1, anim: 'idle', walk: 'walk' },
    root: o,
    path: [],
    speed: 3.2,
    idle: 'idle',
    current: 'idle',
    once: null,
    t: Math.random() * 5,
    actions: new Map(
      [
        'idle',
        'walk',
        'run',
        'jog',
        'attack_melee',
        'cast',
        'hit',
        'hit_head',
        'die',
        'cheer',
        'taunt',
        'prone',
      ].map((s) => [s, !0]),
    ),
    has(s) {
      return this.actions.has(s);
    },
    play(s) {
      (!this.once || this.once.name !== 'die') && (this.current = s);
    },
    playOnce(s, { hold: i = !1 } = {}) {
      return new Promise((r) => {
        this.once = { name: s, t: 0, dur: s === 'die' ? 0.9 : 0.5, hold: i, res: r };
      });
    },
    clipLength(s) {
      return s === 'die' ? 0.9 : 1.2;
    },
    headWorld(s = new Vector3()) {
      return t.getWorldPosition(s);
    },
    walkTo(s, i) {
      ((this.path = s.slice()), (this.onArrive = i), (this.current = 'walk'));
    },
    update(s) {
      this.t += s;
      let i = this.current === 'walk' || this.current === 'run' || this.current === 'jog';
      if (this.path.length) {
        i = !0;
        let c = this.path[0],
          d = o.position,
          u = c.x - d.x,
          h = c.z - d.z,
          p = Math.hypot(u, h),
          m = this.speed * s,
          _ = Math.atan2(u, h) - o.rotation.y;
        ((_ = Math.atan2(Math.sin(_), Math.cos(_))),
          (o.rotation.y += _ * Math.min(1, s * 10)),
          p <= m
            ? ((d.x = c.x),
              (d.z = c.z),
              this.path.shift(),
              this.path.length || ((this.current = 'idle'), this.onArrive?.()))
            : ((d.x += (u / p) * m), (d.z += (h / p) * m)));
      }
      let r = this.t * 9;
      for (let c of a) n(c, r, i);
      e.position.y = i ? Math.abs(Math.sin(r)) * 0.03 : Math.sin(this.t * 1.5) * 0.015;
      let l = this.once;
      if (l) {
        l.t += s;
        let c = Math.min(1, l.t / l.dur),
          d = Math.sin(c * Math.PI);
        (l.name === 'attack_melee' || l.name === 'cast'
          ? ((e.position.z = d * 0.4), (e.rotation.x = -d * 0.25))
          : l.name === 'hit' || l.name === 'hit_head'
            ? (e.position.z = -d * 0.15)
            : (l.name === 'die' || l.name === 'prone') &&
              ((e.rotation.z = c * 2.6), (e.position.y = 0.4 * c)),
          c >= 1 &&
            (l.hold ? (l.t = l.dur) : ((this.once = null), (e.position.z = 0), (e.rotation.x = 0)),
            l.done || ((l.done = !0), l.res())));
      }
    },
  };
}
function jm(o, e) {
  if (o === 'giant_spider') return hH(e);
  let t = g1[o] || g1.wolf,
    a = new MeshStandardMaterial({ color: t.fur, roughness: 0.95 }),
    n = new MeshStandardMaterial({ color: t.belly, roughness: 0.95 }),
    s = new MeshStandardMaterial({ color: 1709586, roughness: 0.6 }),
    i = new MeshBasicMaterial({ color: new Color(16764992).multiplyScalar(2) }),
    r = new Group();
  r.name = `pj_${e}`;
  let l = new Group();
  r.add(l);
  let c = t.len,
    d = t.h,
    u = new Mesh(new CapsuleGeometry(d * 0.32, c * 0.62, 6, 12), a);
  ((u.rotation.x = Math.PI / 2), (u.position.y = d), u.scale.set(1, 1, 0.9), l.add(u));
  let h = new Mesh(new SphereGeometry(d * 0.36, 12, 10), n);
  (h.position.set(0, d * 0.95, c * 0.32), h.scale.set(0.85, 0.9, 1), l.add(h));
  let p = new Group();
  (p.position.set(0, d * 1.12, c * 0.45), l.add(p));
  let m = new Mesh(new SphereGeometry(t.head, 12, 10), a);
  (m.scale.set(0.85, 0.85, 1.05), m.position.set(0, t.head * 0.4, t.head * 0.5), p.add(m));
  let _ = new Mesh(new ConeGeometry(t.head * 0.5, t.head * 1.5, 8), a);
  ((_.rotation.x = Math.PI / 2), _.position.set(0, t.head * 0.2, t.head * 1.45), p.add(_));
  let b = new Mesh(new SphereGeometry(t.head * 0.14, 6, 5), s);
  (b.position.set(0, t.head * 0.22, t.head * 2.15), p.add(b));
  for (let w of [-1, 1]) {
    let k = new Mesh(new ConeGeometry(t.head * 0.28, t.head * 0.7, 5), a);
    (k.position.set(w * t.head * 0.45, t.head * 1.1, t.head * 0.3), (k.rotation.z = -w * 0.25), p.add(k));
    let T = new Mesh(new SphereGeometry(t.head * 0.09, 6, 4), i);
    if ((T.position.set(w * t.head * 0.38, t.head * 0.55, t.head * 1.05), p.add(T), t.antlers)) {
      let E = new Mesh(
        new CylinderGeometry(0.02, 0.03, 0.6, 5),
        new MeshStandardMaterial({ color: 14207144, roughness: 0.8 }),
      );
      (E.position.set(w * 0.15, t.head * 1.6, 0), (E.rotation.z = -w * 0.6), p.add(E));
    }
  }
  let f = new Object3D();
  ((f.name = 'Head'), f.position.set(0, t.head * 0.6, t.head * 0.8), p.add(f));
  let v = new Group();
  (v.position.set(0, d * 1.1, -c * 0.5), l.add(v));
  let x = new Mesh(new ConeGeometry(d * 0.12, t.tail, 6), a);
  ((x.rotation.x = -Math.PI / 2 - 0.5), x.position.set(0, -t.tail * 0.2, -t.tail * 0.45), v.add(x));
  let g = [];
  for (let [w, k] of [
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ]) {
    let T = new Group();
    T.position.set(w * d * 0.22, d * 0.82, k * c * 0.36);
    let E = new Mesh(new CylinderGeometry(d * 0.075, d * 0.06, d * 0.85, 6), a);
    ((E.position.y = -d * 0.42), T.add(E));
    let S = new Mesh(new SphereGeometry(d * 0.08, 6, 4), s);
    ((S.position.y = -d * 0.84),
      S.scale.set(1, 0.6, 1.3),
      T.add(S),
      r.add(T),
      g.push({ hip: T, phase: (w > 0 ? 0 : Math.PI) + (k > 0 ? 0 : Math.PI * 0.5) }));
  }
  return (
    r.traverse((w) => {
      w.isMesh && ((w.castShadow = !0), (w.receiveShadow = !0));
    }),
    r.scale.setScalar(t.scale),
    {
      def: { id: e, scale: t.scale, anim: 'idle', walk: 'walk' },
      root: r,
      path: [],
      speed: 3.2,
      idle: 'idle',
      current: 'idle',
      once: null,
      t: Math.random() * 5,
      actions: new Map(
        [
          'idle',
          'walk',
          'run',
          'jog',
          'attack_melee',
          'hit',
          'hit_head',
          'die',
          'cheer',
          'taunt',
          'prone',
        ].map((w) => [w, !0]),
      ),
      has(w) {
        return this.actions.has(w);
      },
      play(w) {
        (!this.once || this.once.name !== 'die') && (this.current = w);
      },
      playOnce(w, { hold: k = !1 } = {}) {
        return new Promise((T) => {
          this.once = {
            name: w,
            t: 0,
            dur: w === 'die' ? 0.8 : w === 'attack_melee' ? 0.55 : 0.35,
            hold: k,
            res: T,
          };
        });
      },
      clipLength(w) {
        return w === 'attack_melee' ? ((0.55 * 1.2) / 0.42) * 0.42 : w === 'die' ? 0.8 : 0.4;
      },
      headWorld(w = new Vector3()) {
        return f.getWorldPosition(w);
      },
      walkTo(w, k) {
        ((this.path = w.slice()), (this.onArrive = k), (this.current = 'walk'));
      },
      update(w) {
        this.t += w;
        let k = this.current === 'walk' || this.current === 'run' || this.current === 'jog' ? 1 : 0;
        if (this.path.length) {
          k = 1;
          let S = this.path[0],
            z = r.position,
            D = S.x - z.x,
            M = S.z - z.z,
            R = Math.hypot(D, M),
            A = this.speed * w,
            P = Math.atan2(D, M) - r.rotation.y;
          ((P = Math.atan2(Math.sin(P), Math.cos(P))),
            (r.rotation.y += P * Math.min(1, w * 10)),
            R <= A
              ? ((z.x = S.x),
                (z.z = S.z),
                this.path.shift(),
                this.path.length || ((this.current = 'idle'), this.onArrive?.()))
              : ((z.x += (D / R) * A), (z.z += (M / R) * A)));
        }
        let T = this.t * (k ? 11 : 0);
        for (let S of g) S.hip.rotation.x = k ? Math.sin(T + S.phase) * 0.6 : 0;
        ((l.position.y = k ? Math.abs(Math.sin(T)) * 0.04 : Math.sin(this.t * 2) * 0.01),
          (v.rotation.y = Math.sin(this.t * (k ? 9 : 2)) * 0.3),
          (p.rotation.x = k ? 0.12 : Math.sin(this.t * 0.8) * 0.05),
          (l.rotation.z = 0));
        let E = this.once;
        if (E) {
          E.t += w;
          let S = Math.min(1, E.t / E.dur);
          if (E.name === 'attack_melee') {
            let z = Math.sin(S * Math.PI);
            ((l.position.z = z * 0.45), (p.rotation.x = -z * 0.5), (l.rotation.x = -z * 0.15));
          } else if (E.name === 'hit' || E.name === 'hit_head')
            ((l.position.z = -Math.sin(S * Math.PI) * 0.15), (p.rotation.x = Math.sin(S * Math.PI) * 0.4));
          else if (E.name === 'die' || E.name === 'prone') {
            ((l.rotation.z = S * 1.45), (l.position.y = -S * d * 0.35));
            for (let z of g) z.hip.rotation.z = S * 1.2;
          } else (E.name === 'cheer' || E.name === 'taunt') && (p.rotation.x = -Math.sin(S * Math.PI) * 0.7);
          S >= 1 &&
            (E.hold ? (E.t = E.dur) : ((this.once = null), (l.position.z = 0), (l.rotation.x = 0)),
            E.done || ((E.done = !0), E.res()));
        }
      },
    }
  );
}
const g1 = {
  wolf: { fur: 6972508, belly: 11051152, len: 1, h: 0.52, head: 0.24, scale: 1, tail: 0.45 },
  mastiff: { fur: 9071176, belly: 12624e3, len: 0.95, h: 0.55, head: 0.27, scale: 1, tail: 0.3 },
  elk: { fur: 8018490, belly: 12624e3, len: 1.5, h: 1.1, head: 0.3, scale: 1, tail: 0.12, antlers: !0 },
  riding_horse: { fur: 5913124, belly: 5913124, len: 1.7, h: 1.1, head: 0.34, scale: 1, tail: 0.6 },
};

export { a3, jm, t3 };
