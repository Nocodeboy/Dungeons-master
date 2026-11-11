// actors/animals.js
// Reconstruido de publicado/juego.js (módulo __esm «bv»). Nombres locales aún minificados.

import {
  AnimationClip,
  AnimationMixer,
  Box3,
  Group,
  Quaternion,
  QuaternionKeyframeTrack,
  Vector3,
} from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { loadGLTF } from '../assets.js';
import { Character } from './character.js';
import { WILD_ANIMAL_CLIPS, FARM_ANIMAL_CLIPS } from './anims.js';
import { Yn } from './appearance.js';
import { m2 } from './materials.js';

function uu(o) {
  return ANIMAL_DEFS[o] ? o : Qz[o] || null;
}
function eL(o, e) {
  let t = {};
  o.traverse((l) => {
    l.isBone && (t[l.name.replace(/_\d+$/, '')] = l);
  });
  let a = new Map(e),
    n = (l, c, d) => l.quaternion.clone().multiply(new Quaternion().setFromAxisAngle(c, d)),
    s = new Vector3(1, 0, 0),
    i = (l, c, d, u = 16) => {
      let h = [],
        p = [];
      for (let m = 0; m <= u; m++) {
        let _ = (m / u) * d;
        (h.push(_), p.push(...c(_ / d).toArray()));
      }
      return new QuaternionKeyframeTrack(`${l.name}.quaternion`, h, p);
    },
    r = [
      ['FrontUpLeg_L', 0],
      ['BackUpLeg_R', 0],
      ['FrontUpLeg_R', 0.5],
      ['BackUpLeg_L', 0.5],
    ];
  if (t.FrontUpLeg_L) {
    let c = [];
    for (let [h, p] of r) {
      let m = t[h];
      m && c.push(i(m, (b) => n(m, s, Math.sin((b + p) * Math.PI * 2) * 0.45), 0.9));
      let _ = t[h.replace('Up', 'Low')];
      _ && c.push(i(_, (b) => n(_, s, Math.max(0, Math.sin((b + p + 0.25) * Math.PI * 2)) * -0.5), 0.9));
    }
    (t.Head && c.push(i(t.Head, (h) => n(t.Head, s, Math.sin(h * Math.PI * 4) * 0.06), 0.9)),
      a.set('Walk', new AnimationClip('Walk', 0.9, c)));
    let d = [],
      u = 3;
    (t.Neck &&
      d.push(
        i(
          t.Neck,
          (h) =>
            n(
              t.Neck,
              s,
              (0.8 - Math.abs(Math.sin(h * Math.PI)) * 0.1) * Math.min(1, Math.sin(h * Math.PI) * 4),
            ),
          u,
          24,
        ),
      ),
      t.Head &&
        d.push(
          i(
            t.Head,
            (h) =>
              n(t.Head, s, Math.sin(h * Math.PI * 10) * 0.08 + 0.2 * Math.min(1, Math.sin(h * Math.PI) * 4)),
            u,
            24,
          ),
        ),
      d.length && a.set('Eating', new AnimationClip('Eating', u, d)));
  }
  return a;
}
async function gv(o, { index: e = 0, tint: t = null } = {}) {
  let a = uu(o);
  if (!a) throw new Error(`animal desconocido: ${o}`);
  let n = ANIMAL_DEFS[a],
    s = await loadGLTF(`assets/animals/${n.file}.json`),
    i = clone(s.scene),
    r = Yn(e * 31 + a.length),
    l = { ...(n.tint || {}), ...(t || {}) },
    c = 0.9 + r() * 0.2;
  if (
    (i.traverse((x) => {
      if (!x.isMesh) return;
      ((x.castShadow = !0),
        (x.receiveShadow = !0),
        (x.frustumCulled = !1),
        (x.material = x.material.clone()));
      let g = l[x.material.name];
      (g && x.material.color.set(g),
        /Eye/.test(x.material.name) || x.material.color.multiplyScalar(c),
        (x.material.roughness = 0.85),
        (x.material.metalness = 0),
        m2(x.material));
    }),
    !mv.has(a))
  ) {
    let x = new Box3().setFromObject(s.scene, !0);
    mv.set(a, x);
  }
  let d = mv.get(a),
    u = (n.height / Math.max(0.01, d.max.y - d.min.y)) * (0.95 + r() * 0.1),
    h = new Group();
  (h.add(i), i.scale.multiplyScalar(u), (i.position.y = -d.min.y * u));
  let p = new Group();
  ((p.name = `animal_${a}`),
    p.add(h),
    p.updateMatrixWorld(!0),
    i.traverse((x) => {
      x.isSkinnedMesh &&
        (x.skeleton.update(),
        x.computeBoundingSphere(),
        (x.boundingSphere.radius *= 1.8),
        (x.frustumCulled = !0));
    }));
  let m = new AnimationMixer(i),
    _ = new Map(s.animations.map((x) => [x.name, x]));
  n.farm && !n.bird && (_ = eL(i, _));
  let b = n.farm
      ? {
          ...FARM_ANIMAL_CLIPS,
          ...(n.bird
            ? {
                walk: ['Walk'],
                eat: ['Yes', 'Idle'],
                attack_melee: ['Bite_Front'],
                hit: ['HitRecieve'],
                die: ['Death'],
                cheer: ['Dance'],
              }
            : {}),
        }
      : WILD_ANIMAL_CLIPS,
    f = i.getObjectByName('Head') || i.getObjectByName('Head_1') || null,
    v = new Character({
      id: a,
      kind: 'animal',
      root: p,
      model: h,
      mixer: m,
      clips: _,
      anims: b,
      head: f,
      height: n.height,
      radius: n.height * 0.45,
      gait: { walk: n.height * 0.9, run: n.height * 3.6, sprint: n.height * 3.6 },
    });
  return (
    (v.speed = n.height > 1.2 ? 1.1 : 0.7),
    (v.userData.kind = a),
    v.play('idle', 0),
    v.current && (v.current.time = r() * v.current.getClip().duration),
    v
  );
}
function wander(o, e, { radius: t = 1.2, seed: a = 1, speed: n } = {}) {
  let s = Yn(a),
    i = { mode: 'idle', t: 1 + s() * 4, home: e.clone(), radius: t },
    r = ['idle', 'eat', 'idle_alt', 'eat'];
  return (
    o.root.position.copy(e),
    (o.root.rotation.y = s() * Math.PI * 2),
    o.play(r[Math.floor(s() * r.length)]),
    {
      update(l) {
        if (((i.t -= l), i.mode === 'walk')) {
          (!o.path.length || i.t <= 0) &&
            ((o.path = []),
            (i.mode = 'idle'),
            (i.t = 3 + s() * 6),
            o.play(r[Math.floor(s() * r.length)], 0.4));
          return;
        }
        if (!(i.t > 0))
          if (i.radius > 0.1 && s() < 0.5) {
            let c = s() * Math.PI * 2,
              d = 0.3 + s() * i.radius;
            ((i.mode = 'walk'),
              (i.t = 9),
              (o.speed = n ?? o.speed),
              o.walkTo([i.home.clone().add(new Vector3(Math.cos(c) * d, 0, Math.sin(c) * d))], null, {
                anim: 'walk',
              }));
          } else ((i.t = 3 + s() * 6), o.play(r[Math.floor(s() * r.length)], 0.4));
      },
      flee(l) {
        let c = o.root.position.clone().sub(l);
        ((c.y = 0), c.lengthSq() < 1e-4 && c.set(1, 0, 0));
        let d = o.root.position.clone().addScaledVector(c.normalize(), 6);
        (i.home.copy(d), (i.radius = 0.8), (i.mode = 'walk'), (i.t = 10));
        let u = o.speed;
        ((o.speed = u * 2.5),
          o.walkTo(
            [d],
            () => {
              o.speed = u;
            },
            { anim: 'run' },
          ));
      },
    }
  );
}
const ANIMAL_DEFS = {
  oveja: { file: 'oveja', height: 0.85, farm: !0 },
  cerdo: { file: 'cerdo', height: 0.62, farm: !0 },
  gallina: { file: 'gallina', height: 0.38, farm: !0, bird: !0 },
  vaca: { file: 'vaca', height: 1.45 },
  toro: { file: 'toro', height: 1.55 },
  caballo: { file: 'caballo', height: 1.7 },
  burro: { file: 'burro', height: 1.25 },
  perro: { file: 'perro', height: 0.55 },
  ciervo: { file: 'ciervo', height: 1.35 },
  alce: { file: 'alce', height: 2.15 },
  lobo: { file: 'lobo', height: 0.9 },
  mastin: { file: 'mastin', height: 0.85 },
};
const Qz = {
  sheep: 'oveja',
  pig: 'cerdo',
  chicken: 'gallina',
  hen: 'gallina',
  cow: 'vaca',
  bull: 'toro',
  horse: 'caballo',
  riding_horse: 'caballo',
  donkey: 'burro',
  dog: 'perro',
  deer: 'ciervo',
  elk: 'alce',
  stag: 'alce',
  wolf: 'lobo',
  mastiff: 'mastin',
};
const ANIMAL_KINDS = [
  'oveja',
  'cerdo',
  'gallina',
  'vaca',
  'toro',
  'caballo',
  'burro',
  'perro',
  'ciervo',
  'alce',
  'lobo',
  'mastin',
];
const mv = new Map();

export { ANIMAL_DEFS, ANIMAL_KINDS, gv, uu, wander };
