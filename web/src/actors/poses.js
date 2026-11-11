// actors/poses.js
// Reconstruido de publicado/juego.js (módulo __esm «K2»). Nombres locales aún minificados.

import { AnimationClip, Quaternion, QuaternionKeyframeTrack, Vector3, VectorKeyframeTrack } from 'three';

function wz(o, e, t) {
  let a = new Map();
  for (let s of t) a.set(s.name, s.quaternion.clone());
  let n = new Vector3();
  for (let s of o.tracks) {
    let [i, r] = s.name.split('.'),
      l = s.times,
      c = 0;
    for (; c < l.length - 1 && l[c + 1] <= e;) c++;
    let d = s.getValueSize();
    (r === 'quaternion' && a.has(i) && a.set(i, new Quaternion().fromArray(s.values, c * d)),
      r === 'position' && i === 'pelvis' && n.fromArray(s.values, c * d));
  }
  return { q: a, pelvis: n };
}
function Bf(o, e, t, a = {}) {
  let n = new Map(),
    s = new Map(),
    i = (l, c) => {
      let d = (e.get(l.name) || l.quaternion).clone();
      a[l.name] && d.multiply(a[l.name]);
      let u = c.clone().multiply(d),
        h = t[l.name];
      if (h) {
        let p = av.clone().applyQuaternion(u);
        ((u = new Quaternion().setFromUnitVectors(p, h.clone().normalize()).multiply(u)),
          a[`${l.name}+`] && u.multiply(a[`${l.name}+`]),
          (d = c.clone().invert().multiply(u)));
      }
      (n.set(l.name, d), s.set(l.name, u));
      for (let p of l.children) p.isBone && i(p, u);
    },
    r = new Quaternion();
  return (o.parent?.getWorldQuaternion(r), i(o, r), n);
}
function Y2(o, e) {
  let t = [];
  o.traverse((_) => _.isBone && t.push(_));
  let a = e.get('Sword_Idle') || e.get('Idle_Loop');
  if (!a) return [];
  let { q: n, pelvis: s } = wz(a, 0.2, t),
    i = (_) => new Quaternion().setFromAxisAngle(av, _),
    r = new Quaternion().setFromAxisAngle(av, Math.PI / 2),
    l = { spine_02: i(-0.25), spine_03: i(-0.3), neck_01: i(0.25), Head: i(0.3), 'lowerarm_l+': r },
    c = zn(0.12, 0.1, 1),
    d = Bf(
      o,
      n,
      {
        upperarm_l: zn(0.35, -0.55, 0.8),
        lowerarm_l: zn(0.2, -0.2, 1),
        hand_l: zn(0.2, -0.15, 1),
        upperarm_r: zn(-0.3, -0.85, 0.2),
        lowerarm_r: zn(-0.05, -0.5, 0.8),
      },
      l,
    ),
    u = Bf(
      o,
      n,
      {
        upperarm_l: c,
        lowerarm_l: c,
        hand_l: c,
        upperarm_r: zn(-0.62, 0.08, -0.55),
        lowerarm_r: zn(0.7, 0.12, 0.72),
        hand_r: zn(0.6, 0.1, 0.8),
      },
      l,
    ),
    h = Bf(
      o,
      n,
      {
        upperarm_l: c,
        lowerarm_l: c,
        hand_l: c,
        upperarm_r: zn(-0.6, 0.1, -0.75),
        lowerarm_r: zn(0.62, 0.15, 0.72),
        hand_r: zn(0.55, 0.1, 0.8),
      },
      l,
    ),
    p = Bf(
      o,
      n,
      {
        upperarm_l: c,
        lowerarm_l: c,
        hand_l: c,
        upperarm_r: zn(-0.75, 0.15, -0.6),
        lowerarm_r: zn(-0.2, 0.35, -0.9),
        hand_r: zn(-0.3, 0.2, -0.9),
      },
      l,
    ),
    m = (_, b) => {
      let f = [];
      for (let v of t) {
        let x = [],
          g = [];
        for (let [y, w] of b) (x.push(y), g.push(...w.get(v.name).toArray()));
        f.push(new QuaternionKeyframeTrack(`${v.name}.quaternion`, x, g));
      }
      return (
        f.push(
          new VectorKeyframeTrack(
            'pelvis.position',
            [0, b[b.length - 1][0]],
            [...s.toArray(), ...s.toArray()],
          ),
        ),
        new AnimationClip(_, b[b.length - 1][0], f)
      );
    };
  return [
    m('P_Bow_Shoot', [
      [0, d],
      [0.32, u],
      [0.55, h],
      [0.62, p],
      [0.85, p],
      [1.15, d],
    ]),
    m('P_Bow_Aim', [
      [0, h],
      [1.2, u],
      [2.4, h],
    ]),
    m('P_Bow_Ready', [
      [0, d],
      [2, d],
    ]),
  ];
}
const av = new Vector3(0, 1, 0);
const zn = (o, e, t) => new Vector3(o, e, t).normalize();

export { Y2 };
