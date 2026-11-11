// actors/poses.js
// Reconstruido de publicado/juego.js (módulo __esm «K2»).
//
// Animaciones de arco hechas por código. El paquete de animaciones no trae clips de arco, así que
// se parte de la pose de reposo en guardia y se orientan brazos y columna hacia direcciones fijas
// para cuatro poses (preparado, tensar, apuntar, soltar), con las que se crean los clips
// P_Bow_Shoot, P_Bow_Aim y P_Bow_Ready. Lo usa humanoid.js si anims.json no los tiene.

import { AnimationClip, Quaternion, QuaternionKeyframeTrack, Vector3, VectorKeyframeTrack } from 'three';

/** Cuaterniones de los huesos y posición de la pelvis de un clip en el instante `time`. */
function sampleRestPose(clip, time, bones) {
  let quats = new Map();
  for (let bone of bones) quats.set(bone.name, bone.quaternion.clone());
  let pelvis = new Vector3();
  for (let track of clip.tracks) {
    let [boneName, prop] = track.name.split('.'),
      times = track.times,
      frame = 0;
    for (; frame < times.length - 1 && times[frame + 1] <= time;) frame++;
    let size = track.getValueSize();
    (prop === 'quaternion' &&
      quats.has(boneName) &&
      quats.set(boneName, new Quaternion().fromArray(track.values, frame * size)),
      prop === 'position' && boneName === 'pelvis' && pelvis.fromArray(track.values, frame * size));
  }
  return { q: quats, pelvis };
}
/**
 * Recorre los huesos desde `root` y gira los que tienen dirección en `dirs` para que su eje Y apunte
 * hacia ella (en mundo); `offsets[nombre]` se aplica antes y `offsets[nombre+]` después del giro.
 * Devuelve Map(nombre → cuaternión local).
 */
function aimBones(root, baseQuats, dirs, offsets = {}) {
  let local = new Map(),
    world = new Map(),
    visit = (bone, parentQ) => {
      let localQ = (baseQuats.get(bone.name) || bone.quaternion).clone();
      offsets[bone.name] && localQ.multiply(offsets[bone.name]);
      let worldQ = parentQ.clone().multiply(localQ),
        target = dirs[bone.name];
      if (target) {
        let axis = UP.clone().applyQuaternion(worldQ);
        ((worldQ = new Quaternion().setFromUnitVectors(axis, target.clone().normalize()).multiply(worldQ)),
          offsets[`${bone.name}+`] && worldQ.multiply(offsets[`${bone.name}+`]),
          (localQ = parentQ.clone().invert().multiply(worldQ)));
      }
      (local.set(bone.name, localQ), world.set(bone.name, worldQ));
      for (let child of bone.children) child.isBone && visit(child, worldQ);
    },
    parentWorld = new Quaternion();
  return (root.parent?.getWorldQuaternion(parentWorld), visit(root, parentWorld), local);
}
/** Clips de arco (disparar, apuntar, preparado) para el esqueleto de `rootBone`; [] si no hay reposo. */
function makeBowClips(rootBone, clips) {
  let bones = [];
  rootBone.traverse((b) => b.isBone && bones.push(b));
  let base = clips.get('Sword_Idle') || clips.get('Idle_Loop');
  if (!base) return [];
  let { q: quats, pelvis } = sampleRestPose(base, 0.2, bones),
    yaw = (ang) => new Quaternion().setFromAxisAngle(UP, ang),
    quarterTurn = new Quaternion().setFromAxisAngle(UP, Math.PI / 2),
    twists = {
      spine_02: yaw(-0.25),
      spine_03: yaw(-0.3),
      neck_01: yaw(0.25),
      Head: yaw(0.3),
      'lowerarm_l+': quarterTurn,
    },
    bowArm = dir(0.12, 0.1, 1),
    poseReady = aimBones(
      rootBone,
      quats,
      {
        upperarm_l: dir(0.35, -0.55, 0.8),
        lowerarm_l: dir(0.2, -0.2, 1),
        hand_l: dir(0.2, -0.15, 1),
        upperarm_r: dir(-0.3, -0.85, 0.2),
        lowerarm_r: dir(-0.05, -0.5, 0.8),
      },
      twists,
    ),
    poseDraw = aimBones(
      rootBone,
      quats,
      {
        upperarm_l: bowArm,
        lowerarm_l: bowArm,
        hand_l: bowArm,
        upperarm_r: dir(-0.62, 0.08, -0.55),
        lowerarm_r: dir(0.7, 0.12, 0.72),
        hand_r: dir(0.6, 0.1, 0.8),
      },
      twists,
    ),
    poseAim = aimBones(
      rootBone,
      quats,
      {
        upperarm_l: bowArm,
        lowerarm_l: bowArm,
        hand_l: bowArm,
        upperarm_r: dir(-0.6, 0.1, -0.75),
        lowerarm_r: dir(0.62, 0.15, 0.72),
        hand_r: dir(0.55, 0.1, 0.8),
      },
      twists,
    ),
    poseLoose = aimBones(
      rootBone,
      quats,
      {
        upperarm_l: bowArm,
        lowerarm_l: bowArm,
        hand_l: bowArm,
        upperarm_r: dir(-0.75, 0.15, -0.6),
        lowerarm_r: dir(-0.2, 0.35, -0.9),
        hand_r: dir(-0.3, 0.2, -0.9),
      },
      twists,
    ),
    makeClip = (name, keys) => {
      let tracks = [];
      for (let bone of bones) {
        let times = [],
          values = [];
        for (let [t, pose] of keys) (times.push(t), values.push(...pose.get(bone.name).toArray()));
        tracks.push(new QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, values));
      }
      return (
        tracks.push(
          new VectorKeyframeTrack(
            'pelvis.position',
            [0, keys[keys.length - 1][0]],
            [...pelvis.toArray(), ...pelvis.toArray()],
          ),
        ),
        new AnimationClip(name, keys[keys.length - 1][0], tracks)
      );
    };
  return [
    makeClip('P_Bow_Shoot', [
      [0, poseReady],
      [0.32, poseDraw],
      [0.55, poseAim],
      [0.62, poseLoose],
      [0.85, poseLoose],
      [1.15, poseReady],
    ]),
    makeClip('P_Bow_Aim', [
      [0, poseAim],
      [1.2, poseDraw],
      [2.4, poseAim],
    ]),
    makeClip('P_Bow_Ready', [
      [0, poseReady],
      [2, poseReady],
    ]),
  ];
}
const UP = new Vector3(0, 1, 0);
const dir = (x, y, z) => new Vector3(x, y, z).normalize();

export { makeBowClips };
