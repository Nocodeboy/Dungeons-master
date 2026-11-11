// actors/beasts.js
// Reconstruido de publicado/juego.js (módulo __esm «dT»).
//
// Araña gigante hecha por código: cabeza (ojos, quelíceros, pedipalpos, pelos), abdomen con
// marcas y ocho patas de tres segmentos, unidas en una SkinnedMesh con un esqueleto propio, y un
// animador procedural (sin clips) que imita la interfaz de animación de Character: andar con IK de
// patas, atacar, recibir golpes, esquivar, morir y revivir. Lo usa index.js (makeMonster).

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
import { makeGearMaterial } from './materials.js';
import { paint, mergeParts, mat } from './geometry.js';
import { taperedTube } from './sculpt.js';
import { Character } from './character.js';
import { seededRandom } from './appearance.js';

/** Cefalotórax de la araña con ojos brillantes, quelíceros, pedipalpos y pelos. */
function spiderHeadGeometry(pal) {
  let parts = [],
    head = new SphereGeometry(0.32, 14, 10);
  (head.scale(0.95, 0.62, 1.15), parts.push(paint(head, { color: pal.body, vary: 0.12 })));
  let eyes = [
    [0.06, 0.12, 0.33, 0.05],
    [-0.06, 0.12, 0.33, 0.05],
    [0.13, 0.15, 0.28, 0.03],
    [-0.13, 0.15, 0.28, 0.03],
    [0.05, 0.19, 0.27, 0.025],
    [-0.05, 0.19, 0.27, 0.025],
    [0.16, 0.1, 0.24, 0.022],
    [-0.16, 0.1, 0.24, 0.022],
  ];
  for (let [x, y, z, r] of eyes)
    parts.push(
      paint(new SphereGeometry(r, 8, 6), { color: pal.eyes, metal: 0.4, glow: 0.8, matrix: mat.T(x, y, z) }),
    );
  for (let side of [-1, 1])
    (parts.push(
      paint(new SphereGeometry(0.075, 8, 6), {
        color: pal.body,
        matrix: mat.mul(mat.T(side * 0.08, -0.04, 0.36), mat.S(0.9, 1.1, 1.2)),
      }),
    ),
      parts.push(
        paint(
          taperedTube(
            [vec3(side * 0.08, -0.1, 0.42), vec3(side * 0.07, -0.2, 0.44), vec3(side * 0.03, -0.25, 0.39)],
            0.022,
            0.003,
            {
              radial: 6,
              segs: 6,
            },
          ),
          { color: pal.fang, metal: 0.3 },
        ),
      ));
  for (let side of [-1, 1])
    parts.push(
      paint(
        taperedTube(
          [vec3(side * 0.16, -0.02, 0.3), vec3(side * 0.22, 0.04, 0.45), vec3(side * 0.2, -0.08, 0.55)],
          0.03,
          0.018,
          {
            radial: 6,
            segs: 6,
          },
        ),
        { color: pal.leg },
      ),
    );
  let rand = seededRandom(77);
  for (let k = 0; k < 40; k++) {
    let ang = rand() * Math.PI * 2,
      tilt = rand() * 0.9,
      pos = vec3(
        Math.cos(ang) * Math.sin(tilt) * 0.3,
        Math.cos(tilt) * 0.2,
        Math.sin(ang) * Math.sin(tilt) * 0.36,
      ),
      rot = new Quaternion().setFromUnitVectors(vec3(0, 1, 0), pos.clone().normalize());
    parts.push(
      paint(new ConeGeometry(0.008, 0.07, 3), {
        color: pal.hair,
        matrix: new Matrix4().compose(pos, rot, vec3(1, 1, 1)),
      }),
    );
  }
  return mergeParts(parts);
}
/** Abdomen con franjas y raya dorsal pintadas por vértice y pelos; termina en las hileras. */
function spiderAbdomenGeometry(pal) {
  let parts = [],
    sphere = new SphereGeometry(0.5, 18, 14);
  (sphere.scale(0.92, 0.78, 1.18), sphere.translate(0, 0.12, -0.55));
  let abdomen = paint(sphere, { color: pal.body, vary: 0.1 }),
    pos = abdomen.attributes.position,
    colors = abdomen.attributes.color,
    base = new Color(pal.body),
    mark = new Color(pal.mark);
  for (let k = 0; k < pos.count; k++) {
    let x = pos.getX(k),
      y = pos.getY(k),
      z = pos.getZ(k),
      top = MathUtils.smoothstep(y, 0.2, 0.45),
      wave = Math.abs(Math.sin((z + 0.55) * 9 + Math.abs(x) * 7)),
      stripe = top * (wave > 0.82 ? 1 : 0) * (Math.abs(x) < 0.3 ? 1 : 0),
      spine = Math.abs(x) < 0.04 && top > 0.5 ? 0.6 : 0,
      markK = Math.max(stripe, spine),
      col = base.clone().lerp(mark, markK);
    colors.setXYZ(k, col.r, col.g, col.b);
  }
  (parts.push(abdomen),
    parts.push(
      paint(new ConeGeometry(0.06, 0.12, 6), {
        color: pal.leg,
        matrix: mat.mul(mat.T(0, 0.05, -1.13), mat.R(-90, 0, 0)),
      }),
    ));
  let rand = seededRandom(91);
  for (let k = 0; k < 70; k++) {
    let ang = rand() * Math.PI * 2,
      tilt = rand() * 1.3,
      pos = vec3(
        Math.cos(ang) * Math.sin(tilt) * 0.46,
        Math.cos(tilt) * 0.39 + 0.12,
        Math.sin(ang) * Math.sin(tilt) * 0.59 - 0.55,
      ),
      dir = pos
        .clone()
        .sub(vec3(0, 0.12, -0.55))
        .normalize(),
      rot = new Quaternion().setFromUnitVectors(vec3(0, 1, 0), dir);
    parts.push(
      paint(new ConeGeometry(0.01, 0.09, 3), {
        color: pal.hair,
        matrix: new Matrix4().compose(pos, rot, vec3(1, 1, 1)),
      }),
    );
  }
  return mergeParts(parts);
}
/** Segmento de pata de longitud `len` (radio r0→r1), con banda de color opcional y pelos. */
function legSegmentGeometry(len, r0, r1, pal, banded) {
  let pts = [vec3(0, 0, 0), vec3(0, len * 0.5, 0), vec3(0, len, 0)],
    parts = [
      paint(taperedTube(pts, r0, r1, { radial: 7, segs: 4, closed: !0 }), { color: pal.leg, vary: 0.08 }),
    ];
  (parts.push(paint(new SphereGeometry(r0 * 1.15, 7, 5), { color: pal.leg })),
    banded &&
      parts.push(
        paint(new CylinderGeometry(r1 * 1.12, r1 * 1.12, len * 0.18, 7, 1, !0), {
          color: pal.mark,
          matrix: mat.T(0, len * 0.86, 0),
        }),
      ));
  for (let k = 0; k < 6; k++)
    parts.push(
      paint(new ConeGeometry(0.006, 0.05, 3), {
        color: pal.hair,
        matrix: mat.mul(mat.T(0, len * (0.2 + k * 0.12), 0), mat.R(0, k * 70, 55), mat.T(0, r0 * 0.9, 0)),
      }),
    );
  return mergeParts(parts);
}
/** Pesa todos los vértices de una geometría al hueso `boneIndex`. */
function bindToBone(geo, boneIndex) {
  let count = geo.attributes.position.count,
    idx = new Uint16Array(count * 4),
    w = new Float32Array(count * 4);
  for (let k = 0; k < count; k++) ((idx[k * 4] = boneIndex), (w[k * 4] = 1));
  return (
    geo.setAttribute('skinIndex', new BufferAttribute(idx, 4)),
    geo.setAttribute('skinWeight', new BufferAttribute(w, 4)),
    geo
  );
}
/** Crea una araña gigante (Character con animador procedural); `index` varía colores y tamaño. */
async function makeGiantSpider({ index = 0, scale = 1 } = {}) {
  let rand = seededRandom(500 + index * 7),
    pal = {
      body: ['#2a221c', '#30261e', '#241e1a'][index % 3],
      leg: ['#3a2e24', '#40342a', '#342a22'][index % 3],
      hair: '#5a4a3a',
      mark: ['#a08a5a', '#8a6a3a', '#b09a70'][index % 3],
      fang: '#1a1410',
      eyes: '#c02818',
    },
    legLens = [0.55, 0.62, 0.42],
    bones = [],
    addBone = (name, parent) => {
      let bone = new Bone();
      return ((bone.name = name), parent && parent.add(bone), bones.push(bone), bone);
    },
    rootBone = addBone('raiz'),
    bodyBone = addBone('cuerpo', rootBone),
    abdomenBone = addBone('abdomen', bodyBone),
    legBones = [];
  for (let leg = 0; leg < LEG_COUNT; leg++)
    legBones.push([
      addBone(`pata${leg}_0`, rootBone),
      addBone(`pata${leg}_1`, rootBone),
      addBone(`pata${leg}_2`, rootBone),
    ]);
  let geos = [bindToBone(spiderHeadGeometry(pal), 1), bindToBone(spiderAbdomenGeometry(pal), 2)];
  for (let leg = 0; leg < LEG_COUNT; leg++)
    (geos.push(bindToBone(legSegmentGeometry(legLens[0], 0.045, 0.035, pal, !0), 3 + leg * 3)),
      geos.push(bindToBone(legSegmentGeometry(legLens[1], 0.034, 0.024, pal, !0), 4 + leg * 3)),
      geos.push(bindToBone(legSegmentGeometry(legLens[2], 0.022, 0.01, pal, !1), 5 + leg * 3)));
  let geo = mergeParts(geos),
    material = makeGearMaterial(),
    mesh = new SkinnedMesh(geo, material),
    model = new Group();
  (model.add(rootBone), model.add(mesh), bodyBone.position.set(0, 0, 0), model.updateMatrixWorld(!0));
  let skeleton = new Skeleton(
    bones,
    bones.map(() => new Matrix4()),
  );
  (mesh.bind(skeleton, new Matrix4()),
    (mesh.castShadow = !0),
    (mesh.receiveShadow = !0),
    (mesh.frustumCulled = !1));
  let root = new Group();
  root.name = 'arana_gigante';
  let size = (0.9 + rand() * 0.12) * scale;
  (model.scale.setScalar(size), root.add(model));
  let procedural = spiderAnimator({
      bodyB: bodyBone,
      abdB: abdomenBone,
      legB: legBones,
      lens: legLens,
      rand,
    }),
    character = new Character({
      id: 'giant_spider',
      kind: 'monster',
      root,
      model,
      procedural,
      anims: {},
      head: bodyBone,
      height: 0.9 * size,
      radius: 1 * size,
    });
  return ((character.userData.materials = { gear: material }), (character.speed = 2.2), character);
}
/**
 * Animador procedural de la araña: devuelve {play, playOnce, length, update} como espera
 * Character.procedural. Mueve cuerpo y abdomen y resuelve cada pata con IK de dos huesos hacia un pie
 * que avanza por fases alternas.
 */
function spiderAnimator({ bodyB, abdB, legB, lens, rand }) {
  let state = {
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
    hips = [],
    feet = [];
  for (let k = 0; k < LEG_COUNT; k++) {
    let side = k < 4 ? 1 : -1,
      slot = k % 4,
      z = LEG_Z[slot] * 0.42;
    hips.push(vec3(side * 0.22, 0.02, z));
    let reach = [0.75, 0.25, -0.2, -0.65][slot];
    feet.push(vec3(side * (1.05 - Math.abs(reach) * 0.15), 0, z + reach * 1));
  }
  let bodyH = 0.62,
    dir = vec3(0, 0, 0),
    up = vec3(0, 1, 0),
    aimBone = (bone, from, to) => {
      (bone.position.copy(from),
        dir.copy(to).sub(from).normalize(),
        bone.quaternion.setFromUnitVectors(up, dir));
    },
    DURATIONS = {
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
    logicalName = (name) =>
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
      })[name] || name;
  return {
    play(name, { speed } = {}) {
      ((name = logicalName(name)),
        !(state.dead && name !== 'revive') &&
          ((state.once = null), (state.name = name), (state.rate = speed || 1)));
    },
    playOnce(name, { speed = 1, hold = !1 } = {}) {
      ((name = logicalName(name)), (name === 'prone' || name === 'down') && (name = 'die'));
      let dur = (DURATIONS[name] || 0.8) / speed;
      return (
        (state.once = { name, t: 0, d: dur, hold }),
        name === 'revive' && (state.dead = 0),
        new Promise((resolve) => (state.once.res = resolve))
      );
    },
    length(name) {
      return DURATIONS[logicalName(name)] || 0.8;
    },
    update(dt, character, absolute = !1) {
      absolute ? (state.t = dt) : (state.t += dt);
      let name = state.name,
        target =
          name === 'walk' || name === 'run' || name === 'sprint' || name === 'crouch_walk'
            ? name === 'walk'
              ? 1
              : 1.8
            : 0;
      ((state.speed += (target - state.speed) * Math.min(1, dt * 6)),
        (state.gait += dt * (1.4 + state.speed * 2.6) * (state.rate || 1)));
      let lunge = 0,
        flinch = 0,
        bite = 0,
        dead = state.dead,
        dodge = 0,
        once = state.once;
      if (once) {
        once.t += dt;
        let k = Math.min(1, once.t / once.d),
          bump = Math.sin(k * Math.PI);
        (once.name === 'attack_melee' ||
        once.name === 'attack_bite' ||
        once.name === 'cast' ||
        once.name === 'attack_ranged'
          ? ((lunge = k < 0.55 ? MathUtils.smoothstep(k, 0, 0.5) : 1 - MathUtils.smoothstep(k, 0.55, 1)),
            (bite = k > 0.5 && k < 0.8 ? Math.sin(((k - 0.5) / 0.3) * Math.PI) : 0))
          : once.name === 'hit' || once.name === 'block'
            ? (flinch = bump)
            : once.name === 'dodge'
              ? (dodge = bump)
              : once.name === 'cheer' || once.name === 'taunt'
                ? (lunge = bump * 1.2)
                : once.name === 'die'
                  ? (dead = k)
                  : (once.name === 'revive' || once.name === 'awaken') && (dead = 1 - k),
          k >= 1 && (once.name === 'die' && (state.dead = 1), (state.once = null), once.res?.()));
      }
      let breathe = Math.sin(state.t * 2.2) * 0.012,
        bob = Math.abs(Math.sin(state.gait * Math.PI)) * 0.03 * Math.min(1, state.speed),
        height = bodyH * (1 - dead * 0.75) + breathe + bob + dodge * 0.25 + lunge * 0.15;
      (bodyB.position.set(0, height, -flinch * 0.12 - dodge * 0.3),
        bodyB.rotation.set(
          -lunge * 0.55 + flinch * 0.12 - bite * 0.25,
          Math.sin(state.t * 0.7) * 0.03,
          Math.sin(state.gait * Math.PI) * 0.03 * state.speed,
        ),
        abdB.rotation.set(Math.sin(state.t * 2.2) * 0.04 + lunge * 0.45, 0, 0),
        abdB.position.set(0, 0, 0),
        bodyB.updateMatrixWorld(!0));
      for (let leg = 0; leg < LEG_COUNT; leg++) {
        let side = leg < 4 ? 1 : -1,
          slot = leg % 4,
          phase = (slot + (side > 0 ? 0 : 1)) % 2,
          cycle = (state.gait + phase * 0.5) % 1,
          hip = bodyB.localToWorld(hips[leg].clone());
        hip.applyMatrix4(new Matrix4().copy(bodyB.parent.matrixWorld).invert());
        let foot = feet[leg].clone(),
          stride = 0.32 * Math.min(1.4, state.speed);
        (state.speed > 0.02
          ? cycle < 0.5
            ? ((foot.z += -stride / 2 + (cycle / 0.5) * stride),
              (foot.y += Math.sin((cycle / 0.5) * Math.PI) * 0.18 * Math.min(1, state.speed)))
            : (foot.z += stride / 2 - ((cycle - 0.5) / 0.5) * stride)
          : (foot.y += Math.max(0, Math.sin(state.t * 1.3 + leg * 1.7)) * 0.015),
          slot === 0 && (lunge || bite)
            ? foot.set(side * 0.55, height + 0.55 * lunge - bite * 0.5, 0.75 + bite * 0.35)
            : slot === 1 && lunge && (foot.y += lunge * 0.25),
          dead && foot.lerp(vec3(side * 0.25, height * 0.4, hips[leg].z * 0.8), dead));
        let l1 = lens[0],
          l2 = lens[1],
          l3 = lens[2],
          toFoot = foot
            .clone()
            .add(vec3(side * 0.06, l3 * 0.92, 0))
            .clone()
            .sub(hip),
          dist = Math.min(toFoot.length(), l1 + l2 - 0.001),
          dir = toFoot.clone().normalize(),
          cosA = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist),
          angA = Math.acos(MathUtils.clamp(cosA, -1, 1)),
          pole = vec3(side * 0.5, 1, 0).normalize(),
          bend = pole.clone().addScaledVector(dir, -pole.dot(dir)).normalize(),
          upperDir = dir.clone().multiplyScalar(Math.cos(angA)).addScaledVector(bend, Math.sin(angA)),
          knee = hip.clone().addScaledVector(upperDir, l1),
          ankle = hip.clone().addScaledVector(dir, dist),
          [b0, b1, b2] = legB[leg];
        (aimBone(b0, hip, knee),
          aimBone(b1, knee, ankle),
          aimBone(b2, ankle, foot.clone().add(vec3(side * 0.02, 0, 0.01))));
      }
    },
  };
}
const vec3 = (x, y, z) => new Vector3(x, y, z);
const LEG_COUNT = 8;
const LEG_Z = [0.62, 0.22, -0.18, -0.55];

export { makeGiantSpider };
