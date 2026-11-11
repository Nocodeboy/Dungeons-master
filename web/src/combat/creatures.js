// combat/creatures.js — Figuras de criaturas para el combate.
// Bestias procedurales (lobo, mastín, alce, caballo y araña gigante) hechas con primitivas de three y una
// animación propia (paso de patas, ataque, golpe, caída) con la misma interfaz que Character (play,
// playOnce, walkTo, update, headWorld…). También el aspecto de los no muertos y bandidos que se montan sobre
// el humanoide de actors/ (equipo, recoloreado, ojos brillantes). Lo usan combat/units.js y
// combat/controller.js (formas cambiadas, p. ej. Forma salvaje).

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

/** Arco sencillo (curva tubular) para el esqueleto arquero. */
function makeBow() {
  let bow = new Group(),
    mat = new MeshStandardMaterial({ color: 3811870, roughness: 0.85 }),
    curve = new QuadraticBezierCurve3(new Vector3(0, -0.46, 0), new Vector3(0, 0, 0.18), new Vector3(0, 0.46, 0));
  return (bow.add(new Mesh(new TubeGeometry(curve, 16, 0.013, 5), mat)), bow);
}
/** Extra que añade dos ojos brillantes al hueso «Head» de la figura. */
function glowingEyes(color) {
  return (root) => {
    let head = root.getObjectByName('Head');
    if (!head) return;
    let mat = new MeshBasicMaterial({ color: new Color(color).multiplyScalar(3) }),
      inverse = new Matrix4().copy(head.matrixWorld).invert(),
      headPos = head.getWorldPosition(new Vector3());
    for (let side of [-1, 1]) {
      let eye = new Mesh(new SphereGeometry(0.018, 6, 4), mat);
      (eye.position.copy(
        headPos
          .clone()
          .add(new Vector3(side * 0.04, 0.07, 0.1))
          .applyMatrix4(inverse),
      ),
        head.add(eye));
    }
  };
}
/** Aspecto humanoide de un monstruo por plantilla: esqueleto (y arquero), zombi, tumulario o bandido. */
function humanoidMonsterLook(creature) {
  let template = creature.template || '';
  return template === 'skeleton' || template === 'skeleton_archer'
    ? {
        outfit: 'Male_Peasant',
        variant: 'T_Peasant_2_BaseColor',
        recolor: { from: 0.08, width: 0.5, shift: 0, sat: 0.15, val: 0.45 },
        skin: 15656658,
        skinLum: !0,
        scale: 0.95,
        anim: template === 'skeleton' ? 'Sword_Idle' : 'Idle_Loop',
        walk: 'Walk_Loop',
        attach:
          template === 'skeleton'
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
            : [{ make: makeBow, bone: 'hand_l', scale: 1, pos: [0, 0.08, 0], rot: [0, 0, 90] }],
        extras: glowingEyes(10289072),
      }
    : template === 'zombie'
      ? {
          outfit: 'Male_Peasant',
          recolor: { from: 0.08, width: 0.5, shift: 0.15, sat: 0.4, val: 0.5 },
          skin: 9083512,
          skinLum: !0,
          scale: 1.02,
          anim: 'Idle_Loop',
          walk: 'Walk_Loop',
          extras: glowingEyes(14221178),
        }
      : template === 'wight'
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
            extras: glowingEyes(10475775),
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
/** ¿Se dibuja como bestia procedural? */
function isBeast(template) {
  return !!BEASTS[template] || template === 'giant_spider';
}
/** Araña gigante procedural con ocho patas animadas. */
function makeGiantSpider(id) {
  let shellMat = new MeshStandardMaterial({ color: 2761760, roughness: 0.55, metalness: 0.1 }),
    furMat = new MeshStandardMaterial({ color: 4864554, roughness: 0.95 }),
    eyeMat = new MeshBasicMaterial({ color: new Color(16724e3).multiplyScalar(2.2) }),
    root = new Group();
  root.name = `pj_${id}`;
  let body = new Group();
  root.add(body);
  let abdomen = new Mesh(new SphereGeometry(0.62, 16, 12), furMat);
  (abdomen.scale.set(1, 0.8, 1.25), abdomen.position.set(0, 0.95, -0.75));
  let thorax = new Mesh(new SphereGeometry(0.42, 14, 10), shellMat);
  (thorax.scale.set(1, 0.7, 1.1), thorax.position.set(0, 0.8, 0.15), body.add(abdomen, thorax));
  let head = new Object3D();
  ((head.name = 'Head'), head.position.set(0, 0.95, 0.55), body.add(head));
  for (let j = 0; j < 8; j++) {
    let eye = new Mesh(new SphereGeometry(j < 2 ? 0.07 : 0.04, 6, 4), eyeMat);
    (eye.position.set(
      (j % 2 ? 1 : -1) * (0.08 + Math.floor(j / 2) * 0.06),
      0.95 + (j < 4 ? 0.06 : 0),
      0.55 - Math.floor(j / 2) * 0.03,
    ),
      body.add(eye));
  }
  for (let side of [-1, 1]) {
    let fang = new Mesh(new ConeGeometry(0.05, 0.25, 5), shellMat);
    (fang.position.set(side * 0.1, 0.62, 0.55), (fang.rotation.x = Math.PI), body.add(fang));
  }
  let legs = [];
  for (let j = 0; j < 8; j++) {
    let side = j < 4 ? -1 : 1,
      k = j % 4,
      hip = new Group();
    (hip.position.set(side * 0.3, 0.82, 0.35 - k * 0.22),
      (hip.rotation.y = side * (Math.PI / 2) + (k - 1.5) * 0.45 * -side));
    let femur = new Mesh(new CylinderGeometry(0.045, 0.06, 0.95, 5), shellMat);
    ((femur.rotation.z = Math.PI / 2 - 0.9), femur.position.set(0, 0.3, 0.38), femur.rotation.set(-0.9, 0, 0), hip.add(femur));
    let knee = new Group();
    (knee.position.set(0, 0.6, 0.72), hip.add(knee));
    let shin = new Mesh(new CylinderGeometry(0.035, 0.02, 1.2, 5), furMat);
    (shin.position.set(0, -0.5, 0.25),
      (shin.rotation.x = 0.45),
      knee.add(shin),
      root.add(hip),
      legs.push({ hip, phase: j * 0.8 + (side > 0 ? Math.PI : 0) }));
  }
  root.traverse((obj) => {
    obj.isMesh && ((obj.castShadow = !0), (obj.receiveShadow = !0));
  });
  let actor = makeBeastActor(root, body, head, legs, (leg, t, moving) => {
    leg.hip.rotation.x = moving ? Math.sin(t * 1.4 + leg.phase) * 0.35 : Math.sin(t * 0.2 + leg.phase) * 0.03;
  });
  return ((actor.def.id = id), actor);
}
/**
 * Actor mínimo compatible con Character para una figura procedural.
 * @param {Function} animateLeg (pata, fase, ¿se mueve?) → anima una pata
 */
function makeBeastActor(root, body, head, legs, animateLeg) {
  return {
    def: { scale: 1, anim: 'idle', walk: 'walk' },
    root,
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
      ].map((name) => [name, !0]),
    ),
    has(name) {
      return this.actions.has(name);
    },
    play(name) {
      (!this.once || this.once.name !== 'die') && (this.current = name);
    },
    playOnce(name, { hold = !1 } = {}) {
      return new Promise((resolve) => {
        this.once = { name, t: 0, dur: name === 'die' ? 0.9 : 0.5, hold, res: resolve };
      });
    },
    clipLength(name) {
      return name === 'die' ? 0.9 : 1.2;
    },
    headWorld(out = new Vector3()) {
      return head.getWorldPosition(out);
    },
    walkTo(path, onArrive) {
      ((this.path = path.slice()), (this.onArrive = onArrive), (this.current = 'walk'));
    },
    update(dt) {
      this.t += dt;
      let moving = this.current === 'walk' || this.current === 'run' || this.current === 'jog';
      if (this.path.length) {
        moving = !0;
        let target = this.path[0],
          pos = root.position,
          dx = target.x - pos.x,
          dz = target.z - pos.z,
          dist = Math.hypot(dx, dz),
          step = this.speed * dt,
          turn = Math.atan2(dx, dz) - root.rotation.y;
        ((turn = Math.atan2(Math.sin(turn), Math.cos(turn))),
          (root.rotation.y += turn * Math.min(1, dt * 10)),
          dist <= step
            ? ((pos.x = target.x),
              (pos.z = target.z),
              this.path.shift(),
              this.path.length || ((this.current = 'idle'), this.onArrive?.()))
            : ((pos.x += (dx / dist) * step), (pos.z += (dz / dist) * step)));
      }
      let phase = this.t * 9;
      for (let leg of legs) animateLeg(leg, phase, moving);
      body.position.y = moving ? Math.abs(Math.sin(phase)) * 0.03 : Math.sin(this.t * 1.5) * 0.015;
      let once = this.once;
      if (once) {
        once.t += dt;
        let k = Math.min(1, once.t / once.dur),
          swing = Math.sin(k * Math.PI);
        (once.name === 'attack_melee' || once.name === 'cast'
          ? ((body.position.z = swing * 0.4), (body.rotation.x = -swing * 0.25))
          : once.name === 'hit' || once.name === 'hit_head'
            ? (body.position.z = -swing * 0.15)
            : (once.name === 'die' || once.name === 'prone') &&
              ((body.rotation.z = k * 2.6), (body.position.y = 0.4 * k)),
          k >= 1 &&
            (once.hold ? (once.t = once.dur) : ((this.once = null), (body.position.z = 0), (body.rotation.x = 0)),
            once.done || ((once.done = !0), once.res())));
      }
    },
  };
}
/** Bestia cuadrúpeda procedural según BEASTS (o la araña gigante). */
function makeBeast(template, id) {
  if (template === 'giant_spider') return makeGiantSpider(id);
  let def = BEASTS[template] || BEASTS.wolf,
    furMat = new MeshStandardMaterial({ color: def.fur, roughness: 0.95 }),
    bellyMat = new MeshStandardMaterial({ color: def.belly, roughness: 0.95 }),
    darkMat = new MeshStandardMaterial({ color: 1709586, roughness: 0.6 }),
    eyeMat = new MeshBasicMaterial({ color: new Color(16764992).multiplyScalar(2) }),
    root = new Group();
  root.name = `pj_${id}`;
  let body = new Group();
  root.add(body);
  let len = def.len,
    height = def.h,
    torso = new Mesh(new CapsuleGeometry(height * 0.32, len * 0.62, 6, 12), furMat);
  ((torso.rotation.x = Math.PI / 2), (torso.position.y = height), torso.scale.set(1, 1, 0.9), body.add(torso));
  let chest = new Mesh(new SphereGeometry(height * 0.36, 12, 10), bellyMat);
  (chest.position.set(0, height * 0.95, len * 0.32), chest.scale.set(0.85, 0.9, 1), body.add(chest));
  let head = new Group();
  (head.position.set(0, height * 1.12, len * 0.45), body.add(head));
  let skull = new Mesh(new SphereGeometry(def.head, 12, 10), furMat);
  (skull.scale.set(0.85, 0.85, 1.05), skull.position.set(0, def.head * 0.4, def.head * 0.5), head.add(skull));
  let snout = new Mesh(new ConeGeometry(def.head * 0.5, def.head * 1.5, 8), furMat);
  ((snout.rotation.x = Math.PI / 2), snout.position.set(0, def.head * 0.2, def.head * 1.45), head.add(snout));
  let nose = new Mesh(new SphereGeometry(def.head * 0.14, 6, 5), darkMat);
  (nose.position.set(0, def.head * 0.22, def.head * 2.15), head.add(nose));
  for (let side of [-1, 1]) {
    let ear = new Mesh(new ConeGeometry(def.head * 0.28, def.head * 0.7, 5), furMat);
    (ear.position.set(side * def.head * 0.45, def.head * 1.1, def.head * 0.3), (ear.rotation.z = -side * 0.25), head.add(ear));
    let eye = new Mesh(new SphereGeometry(def.head * 0.09, 6, 4), eyeMat);
    if ((eye.position.set(side * def.head * 0.38, def.head * 0.55, def.head * 1.05), head.add(eye), def.antlers)) {
      let antler = new Mesh(
        new CylinderGeometry(0.02, 0.03, 0.6, 5),
        new MeshStandardMaterial({ color: 14207144, roughness: 0.8 }),
      );
      (antler.position.set(side * 0.15, def.head * 1.6, 0), (antler.rotation.z = -side * 0.6), head.add(antler));
    }
  }
  let headAnchor = new Object3D();
  ((headAnchor.name = 'Head'), headAnchor.position.set(0, def.head * 0.6, def.head * 0.8), head.add(headAnchor));
  let tail = new Group();
  (tail.position.set(0, height * 1.1, -len * 0.5), body.add(tail));
  let tailMesh = new Mesh(new ConeGeometry(height * 0.12, def.tail, 6), furMat);
  ((tailMesh.rotation.x = -Math.PI / 2 - 0.5), tailMesh.position.set(0, -def.tail * 0.2, -def.tail * 0.45), tail.add(tailMesh));
  let legs = [];
  for (let [sx, sz] of [
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ]) {
    let hip = new Group();
    hip.position.set(sx * height * 0.22, height * 0.82, sz * len * 0.36);
    let leg = new Mesh(new CylinderGeometry(height * 0.075, height * 0.06, height * 0.85, 6), furMat);
    ((leg.position.y = -height * 0.42), hip.add(leg));
    let paw = new Mesh(new SphereGeometry(height * 0.08, 6, 4), darkMat);
    ((paw.position.y = -height * 0.84),
      paw.scale.set(1, 0.6, 1.3),
      hip.add(paw),
      root.add(hip),
      legs.push({ hip, phase: (sx > 0 ? 0 : Math.PI) + (sz > 0 ? 0 : Math.PI * 0.5) }));
  }
  return (
    root.traverse((obj) => {
      obj.isMesh && ((obj.castShadow = !0), (obj.receiveShadow = !0));
    }),
    root.scale.setScalar(def.scale),
    {
      def: { id, scale: def.scale, anim: 'idle', walk: 'walk' },
      root,
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
        ].map((name) => [name, !0]),
      ),
      has(name) {
        return this.actions.has(name);
      },
      play(name) {
        (!this.once || this.once.name !== 'die') && (this.current = name);
      },
      playOnce(name, { hold = !1 } = {}) {
        return new Promise((resolve) => {
          this.once = {
            name,
            t: 0,
            dur: name === 'die' ? 0.8 : name === 'attack_melee' ? 0.55 : 0.35,
            hold,
            res: resolve,
          };
        });
      },
      clipLength(name) {
        return name === 'attack_melee' ? ((0.55 * 1.2) / 0.42) * 0.42 : name === 'die' ? 0.8 : 0.4;
      },
      headWorld(out = new Vector3()) {
        return headAnchor.getWorldPosition(out);
      },
      walkTo(path, onArrive) {
        ((this.path = path.slice()), (this.onArrive = onArrive), (this.current = 'walk'));
      },
      update(dt) {
        this.t += dt;
        let moving = this.current === 'walk' || this.current === 'run' || this.current === 'jog' ? 1 : 0;
        if (this.path.length) {
          moving = 1;
          let target = this.path[0],
            pos = root.position,
            dx = target.x - pos.x,
            dz = target.z - pos.z,
            dist = Math.hypot(dx, dz),
            step = this.speed * dt,
            turn = Math.atan2(dx, dz) - root.rotation.y;
          ((turn = Math.atan2(Math.sin(turn), Math.cos(turn))),
            (root.rotation.y += turn * Math.min(1, dt * 10)),
            dist <= step
              ? ((pos.x = target.x),
                (pos.z = target.z),
                this.path.shift(),
                this.path.length || ((this.current = 'idle'), this.onArrive?.()))
              : ((pos.x += (dx / dist) * step), (pos.z += (dz / dist) * step)));
        }
        let phase = this.t * (moving ? 11 : 0);
        for (let leg of legs) leg.hip.rotation.x = moving ? Math.sin(phase + leg.phase) * 0.6 : 0;
        ((body.position.y = moving ? Math.abs(Math.sin(phase)) * 0.04 : Math.sin(this.t * 2) * 0.01),
          (tail.rotation.y = Math.sin(this.t * (moving ? 9 : 2)) * 0.3),
          (head.rotation.x = moving ? 0.12 : Math.sin(this.t * 0.8) * 0.05),
          (body.rotation.z = 0));
        let once = this.once;
        if (once) {
          once.t += dt;
          let j = Math.min(1, once.t / once.dur);
          if (once.name === 'attack_melee') {
            let swing = Math.sin(j * Math.PI);
            ((body.position.z = swing * 0.45), (head.rotation.x = -swing * 0.5), (body.rotation.x = -swing * 0.15));
          } else if (once.name === 'hit' || once.name === 'hit_head')
            ((body.position.z = -Math.sin(j * Math.PI) * 0.15), (head.rotation.x = Math.sin(j * Math.PI) * 0.4));
          else if (once.name === 'die' || once.name === 'prone') {
            ((body.rotation.z = j * 1.45), (body.position.y = -j * height * 0.35));
            for (let leg of legs) leg.hip.rotation.z = j * 1.2;
          } else (once.name === 'cheer' || once.name === 'taunt') && (head.rotation.x = -Math.sin(j * Math.PI) * 0.7);
          j >= 1 &&
            (once.hold ? (once.t = once.dur) : ((this.once = null), (body.position.z = 0), (body.rotation.x = 0)),
            once.done || ((once.done = !0), once.res()));
        }
      },
    }
  );
}
/** Colores y proporciones de las bestias cuadrúpedas. */
const BEASTS = {
  wolf: { fur: 6972508, belly: 11051152, len: 1, h: 0.52, head: 0.24, scale: 1, tail: 0.45 },
  mastiff: { fur: 9071176, belly: 12624e3, len: 0.95, h: 0.55, head: 0.27, scale: 1, tail: 0.3 },
  elk: { fur: 8018490, belly: 12624e3, len: 1.5, h: 1.1, head: 0.3, scale: 1, tail: 0.12, antlers: !0 },
  riding_horse: { fur: 5913124, belly: 5913124, len: 1.7, h: 1.1, head: 0.34, scale: 1, tail: 0.6 },
};

export { isBeast, makeBeast, humanoidMonsterLook };
