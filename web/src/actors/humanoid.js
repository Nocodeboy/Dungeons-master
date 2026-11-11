// actors/humanoid.js
// Reconstruido de publicado/juego.js (módulo __esm «Wf»).
//
// Construcción de humanoides (héroes, compañeros, PNJ y monstruos con forma humana) a partir de
// un «look» (look.js, companions.js, monsters.js): clona y escala el esqueleto de humanos.json,
// elige cuerpo, ropa y pelo del glTF, esculpe la cabeza, añade equipo procedural (geometry.js,
// sculpt.js, monster-parts.js), lo hornea todo en SkinnedMesh (rig.js) y devuelve un Character
// con sus clips, empuñadura de dedos, postura encorvada y ajuste de la pelvis al tumbarse.
// Es un espacio de nombres (portraits.js lo carga con import()). Lo usan index.js y preview.js.

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

/** Posición mundial de un hueso por nombre. */
function bonePos(bones, name) {
  return bones.get(name).getWorldPosition(new Vector3());
}
/** Escalas por hueso (Map nombre → Vector3) según las proporciones `prop` (width, thick, arms, legs…). */
function boneScales(prop) {
  let scales = new Map(),
    scale = (re, v) => {
      for (let name of SCALED_BONES)
        re.test(name) && scales.set(name, (scales.get(name) || vec3(1, 1, 1)).clone().multiply(v));
    },
    width = prop.width ?? 1,
    thick = prop.thick ?? 1;
  (scale(/^spine_0[123]$|^pelvis$/, vec3(width, 1, width)),
    scale(/^clavicle_[lr]$/, vec3(1, 1 + (width - 1) * 0.7, 1)),
    scale(
      /^(upperarm|lowerarm)_[lr]$/,
      vec3(thick * (1 + (width - 1) * 0.7), prop.arms ?? 1, thick * (1 + (width - 1) * 0.7)),
    ),
    scale(
      /^(thigh|calf)_[lr]$/,
      vec3(thick * (1 + (width - 1) * 0.6), prop.legs ?? 1, thick * (1 + (width - 1) * 0.6)),
    ),
    scale(/^hand_[lr]$/, vec3(prop.hands ?? 1, prop.hands ?? 1, prop.hands ?? 1)),
    scale(/^neck_01$/, vec3(1 + (width - 1) * 0.5, prop.neck ?? 1, 1 + (width - 1) * 0.5)));
  let head = prop.head ?? 1;
  return (
    scale(/^Head$/, vec3(head, head, head)),
    prop.spine && scale(/^spine_0[123]$/, vec3(1, prop.spine, 1)),
    scales
  );
}
/** Posiciones de los vértices de una SkinnedMesh en su pose de reposo, en mundo (cacheadas). */
function bindPositions(mesh) {
  if (bindPosCache.has(mesh)) return bindPosCache.get(mesh);
  let geo = mesh.geometry,
    skel = mesh.skeleton,
    mats = skel.bones.map((bone, k) =>
      bone.matrixWorld.clone().multiply(skel.boneInverses[k]).multiply(mesh.bindMatrix),
    ),
    posAttr = geo.attributes.position,
    skinIdx = geo.attributes.skinIndex,
    skinW = geo.attributes.skinWeight,
    out = new Float32Array(posAttr.count * 3),
    v = new Vector3(),
    acc = new Vector3(),
    tmp = new Vector3();
  for (let k = 0; k < posAttr.count; k++) {
    (v.fromBufferAttribute(posAttr, k), acc.set(0, 0, 0));
    for (let j = 0; j < 4; j++) {
      let w = skinW.getComponent(k, j);
      w && acc.addScaledVector(tmp.copy(v).applyMatrix4(mats[skinIdx.getComponent(k, j)]), w);
    }
    out.set([acc.x, acc.y, acc.z], k * 3);
  }
  return (bindPosCache.set(mesh, out), out);
}
/** Posición mundial del hueso Head del esqueleto de una malla. */
function headCenter(mesh) {
  return new Vector3().setFromMatrixPosition(
    mesh.skeleton.bones.find((bone) => bone.name === 'Head').matrixWorld,
  );
}
/** Triángulos cuyos tres vértices (relativos a `center`) cumplen `keep` (recortes de barba y cresta). */
function filterTriangles(mesh, center, keep) {
  let positions = bindPositions(mesh),
    index = mesh.geometry.index,
    tris = [],
    rel = new Vector3(),
    test = (v) =>
      keep(
        rel.set(
          positions[v * 3] - center.x,
          positions[v * 3 + 1] - center.y,
          positions[v * 3 + 2] - center.z,
        ),
      );
  for (let k = 0; k < index.count; k += 3) {
    let a = index.getX(k),
      b = index.getX(k + 1),
      c = index.getX(k + 2);
    test(a) && test(b) && test(c) && tris.push(a, b, c);
  }
  return tris;
}
/** Cuaterniones de los dedos cerrados sobre el arma (primer fotograma de Sword_Idle), cacheados. */
function fingerGripPose(clips) {
  if (fingerPoseCache) return fingerPoseCache;
  fingerPoseCache = new Map();
  let clip = clips.get('Sword_Idle');
  if (!clip) return fingerPoseCache;
  for (let track of clip.tracks) {
    let [bone, prop] = track.name.split('.');
    prop !== 'quaternion' ||
      !/^(index|middle|ring|pinky|thumb)_/.test(bone) ||
      fingerPoseCache.set(bone, new Quaternion().fromArray(track.values, 0));
  }
  return fingerPoseCache;
}
/**
 * Construye un humanoide animado a partir de su look ({body, prop, colors, outfit, gear, hair, beard,
 * head, extras, style, grips, family, posture…}). Devuelve un Character con `userData.look`,
 * `userData.rig` y `userData.setWeapon(modo)` («melee», «ranged» o «none») para los héroes.
 */
async function buildHumanoid(look) {
  let [rig, clips] = await Promise.all([loadHumanRig(), loadAnimClips()]);
  if (!clips.has('P_Bow_Shoot'))
    for (let clip of makeBowClips(rig.rootBone.m, clips)) clips.set(clip.name, clip);
  let body = look.body === 'f' ? 'f' : 'm',
    rootBone = rig.rootBone[body],
    srcBones = new Map();
  rootBone.traverse((obj) => obj.isBone && srcBones.set(obj.name, obj));
  let skel = cloneSkeleton(rootBone),
    model = new Group();
  ((model.name = 'modelo'), model.add(skel.root));
  let prop = look.prop || {},
    scales = boneScales(prop);
  (scaleBones(skel, scales), model.updateMatrixWorld(!0));
  let srcBall = bonePos(srcBones, 'ball_l'),
    ball = skel.byName.get('ball_l').getWorldPosition(new Vector3()),
    pelvis = skel.byName.get('pelvis');
  {
    let pos = pelvis.getWorldPosition(new Vector3());
    ((pos.y -= ball.y - srcBall.y),
      pelvis.position.copy(pelvis.parent.worldToLocal(pos)),
      model.updateMatrixWorld(!0));
  }
  let pelvisY = pelvis.getWorldPosition(new Vector3()).y,
    headPos = bonePos(srcBones, 'Head'),
    palette = gearPalette(look),
    colors = look.colors || {},
    atlasMat = makeCharacterMaterial(
      body,
      {
        skin: colors.skin,
        cloth1: colors.cloth1,
        cloth2: colors.cloth2,
        metal: look.metalColor,
        leather: colors.leather,
        hair: colors.hair,
        eyes: colors.eyes,
      },
      {
        pattern: look.skinFx?.pattern || 0,
        patternColor: look.skinFx?.patternColor,
        mail: look.mail || 0,
        glowEyes: look.glowEyes || 0,
      },
    ),
    hairMat = atlasMat,
    gearMat = atlasMat,
    sculpt = makeHeadSculpt(look.head || {}),
    parts = [],
    outfit = look.outfit || {},
    addMesh = (name, extra = {}) => {
      let meshes = rig.parts.get(name);
      if (!meshes) {
        meshes = [];
        for (let k = 1; rig.parts.has(`${name}_${k}`); k++) meshes.push(...rig.parts.get(`${name}_${k}`));
        if (!meshes.length) return;
      }
      let isHair = /^pelo_|_ojos$|_cejas$/.test(name),
        tattered = outfit.tatters && /_(ca|ex)_(torso|piernas|brazos)$/.test(name),
        robed = look.gear?.robe && /_(ca|ex)_torso$/.test(name);
      for (let mesh of meshes) {
        let index = tattered
          ? tatteredTriangles(mesh, outfit.tatters)
          : robed
            ? triangleSubset(mesh, ['torso', 'brazos', 'manos', 'cabeza'])
            : void 0;
        parts.push({ mesh, material: isHair ? hairMat : atlasMat, deform: sculpt, index, ...extra });
      }
    },
    bareRegions = [];
  if (
    (look.noHead || bareRegions.push('cabeza'),
    (outfit.torso === 'piel' || outfit.under) && bareRegions.push('torso'),
    (outfit.brazos === 'piel' || outfit.under) && bareRegions.push('brazos', 'manos'),
    (outfit.piernas === 'piel' || outfit.under) && bareRegions.push('piernas', 'cadera'),
    outfit.pies === 'piel' && bareRegions.push('pies', 'pantorrillas'),
    bareRegions.length)
  ) {
    let bodyMesh = rig.parts.get(`${body}_cuerpo`)[0];
    parts.push({
      mesh: bodyMesh,
      index: triangleSubset(bodyMesh, bareRegions),
      material: atlasMat,
      deform: sculpt,
    });
  }
  let addClothing = (zone, variants) => {
    let kind = outfit[zone];
    kind && kind !== 'piel' && variants[kind] && addMesh(`${body}_${kind}_${variants[kind]}`);
  };
  (addClothing('torso', { ex: 'torso', ca: 'torso' }),
    addClothing('brazos', { ex: 'brazos', ca: 'brazos' }),
    addClothing('piernas', { ex: 'piernas', ca: 'piernas' }),
    addClothing('pies', { ex: 'botas', ca: 'pies' }),
    outfit.capucha && addMesh(`${body}_ex_capucha`),
    outfit.hombrera && addMesh(`${body}_ex_hombrera`),
    outfit.brazales && addMesh(`${body}_ex_brazales`),
    outfit.cintos && (addMesh(`${body}_ex_cinto1`), addMesh(`${body}_ex_cinto2`)),
    look.noHead ||
      (addMesh(`${body}_ojos`, { hair: !0 }), look.brows !== !1 && addMesh(`${body}_cejas`, { hair: !0 })));
  let hairStyle = outfit.capucha || look.gear?.helmet === 'yelmo' ? null : HAIR_MESHES[look.hair || 'raya'];
  if (hairStyle && !look.noHead) {
    let hairMesh = rig.parts.get(
      `pelo_${hairStyle === 'rapado' && body === 'f' ? 'rapado_f' : hairStyle}`,
    )?.[0];
    hairMesh &&
      (look.hair === 'cresta'
        ? parts.push({
            mesh: hairMesh,
            index: filterTriangles(hairMesh, headCenter(hairMesh), (p) => Math.abs(p.x) < 0.028),
            material: hairMat,
            deform: sculpt,
            hair: !0,
          })
        : parts.push({ mesh: hairMesh, material: hairMat, deform: sculpt, hair: !0 }));
  }
  if (!look.noHead && look.gear?.helmet !== 'yelmo') {
    let buildHair = {
        coleta: () => ponytailGeometry(1),
        trenza: () => braidGeometry(look.hairLong ?? 1),
        cresta: () => (outfit.capucha ? null : mohawkGeometry()),
      }[look.hair],
      hairGeo = buildHair && buildHair();
    hairGeo &&
      (hairGeo.translate(headPos.x, headPos.y, headPos.z),
      parts.push({
        geometry: hairGeo,
        material: hairMat,
        weights: look.hair === 'cresta' ? null : hairWeights(headPos.y),
        bone: 'Head',
        deform: sculpt,
        hair: !0,
      }));
  }
  let beard = look.beard && look.beard !== 'ninguna' && !look.noHead ? look.beard : null;
  if (beard) {
    let beardMesh = rig.parts.get('pelo_barba')[0],
      center = headCenter(beardMesh),
      index;
    beard === 'perilla'
      ? (index = filterTriangles(
          beardMesh,
          center,
          (p) => Math.abs(p.x) < 0.032 && (p.y < 0.012 || p.y > 0.022),
        ))
      : beard === 'bigote' &&
        (index = filterTriangles(beardMesh, center, (p) => p.y > 0.004 && p.y < 0.04 && p.z > 0.07));
    let long = beard === 'larga' || beard === 'trenzada',
      beardDeform = (pos, normal, weight, center, part) => {
        if ((sculpt && sculpt(pos, normal, weight, center, part), long)) {
          let rel = pos.clone().sub(center),
            drop = Math.max(0, 0.02 - rel.y);
          ((pos.y -= drop * 2.2), (pos.z += drop * 0.35), (pos.x -= rel.x * Math.min(0.5, drop * 6)));
        }
      };
    parts.push({ mesh: beardMesh, index, material: hairMat, deform: beardDeform, hair: !0 });
  }
  let baseParts = parts.slice(),
    gearParts = await buildGearParts(look, srcBones, palette, gearMat, headPos);
  for (let part of gearParts) parts.push(part);
  let baked = bakeSkinnedMeshes(skel, parts, scales, model, srcBones);
  for (let mesh of baked.meshes) model.add(mesh);
  let root = new Group();
  root.name = look.id ? `pj_${look.id}` : 'humanoide';
  let scale = (prop.scale ?? 1) * (prop.height ?? 1);
  (model.scale.setScalar(scale), root.add(model));
  let mixer = new AnimationMixer(skel.root),
    anims = { ...ANIM_CLIPS, ...(RACE_CLIPS[look.family] || {}), ...(GRIP_CLIPS[look.style] || {}) },
    character = new Character({
      id: look.id,
      kind: look.kind || 'hero',
      def: { id: look.id, scale, anim: 'idle', walk: 'walk' },
      root,
      model,
      mixer,
      clips,
      anims,
      head: skel.byName.get('Head'),
      height: 1.8 * scale,
      radius: 0.35 * scale * (prop.width ?? 1),
      speeds: look.speeds || {},
      gait: {
        walk: (look.gait?.walk ?? 1.35) * scale,
        run: (look.gait?.run ?? 3.1) * scale,
        sprint: 5 * scale,
        crouch_walk: 1 * scale,
      },
    });
  ((character.userData.look = look), (character.userData.rig = skel));
  let prevBake = { Wnew: baked.Wnew, skeleton: baked.skeleton },
    meshes = baked.meshes;
  ((character.userData.setWeapon = async (mode) => {
    let sheet = character.userData.sheet;
    if (!sheet || look.kind !== 'hero') return;
    let { heroLook } = await import('./look.js'),
      newLook = heroLook(sheet, { prefer: mode === 'ranged' ? 'ranged' : 'melee' });
    mode === 'none' && ((newLook.gear.main = null), (newLook.gear.off = null));
    let gear = await buildGearParts(newLook, srcBones, gearPalette(newLook), gearMat, headPos),
      rebaked = bakeSkinnedMeshes(skel, [...baseParts, ...gear], scales, model, srcBones, prevBake);
    for (let mesh of meshes) (model.remove(mesh), mesh.geometry.dispose());
    meshes = rebaked.meshes;
    for (let mesh of meshes) model.add(mesh);
    ((look.gear = newLook.gear),
      (look.style = newLook.style),
      Object.assign(character.anims, {
        ...ANIM_CLIPS,
        ...(RACE_CLIPS[look.family] || {}),
        ...(GRIP_CLIPS[newLook.style] || {}),
      }),
      setGrips(newLook.grips || []));
  }),
    (character.userData.materials = { atlas: atlasMat }));
  let pelvisScale = pelvisY / ANIM_PELVIS_HEIGHT,
    lying = measureLyingOffset(skel, clips, pelvisScale, pelvis, meshes, root),
    lastPelvis = new Vector3(NaN, 0, 0);
  character.post.push(() => {
    pelvis.position.equals(lastPelvis) ||
      (pelvis.position.multiplyScalar(pelvisScale),
      lying &&
        (pelvis.position.z +=
          lying.dz *
          Math.min(1, Math.max(0, (lying.restZ - pelvis.position.z) / (lying.restZ - lying.lowZ)))),
      lastPelvis.copy(pelvis.position));
  });
  let fingerPose = [],
    setGrips = (sides) => {
      let pose = fingerGripPose(clips);
      fingerPose = [];
      for (let [name, q] of pose)
        sides.some((side) => name.endsWith(`_${side}`)) && fingerPose.push([skel.byName.get(name), q]);
    };
  (setGrips(look.grips || []),
    character.post.push(() => {
      for (let [bone, q] of fingerPose) bone && bone.quaternion.copy(q);
    }));
  for (let finger of look.missingFingers || []) {
    let [name, side] = finger.split('_'),
      bone = skel.byName.get(`${name}_01_${side}`);
    bone && bone.scale.setScalar(0.02);
  }
  let hunch = look.posture?.hunch || 0;
  if (hunch) {
    let bends = [
      [skel.byName.get('spine_01'), new Quaternion().setFromAxisAngle(vec3(1, 0, 0), hunch * 0.25)],
      [skel.byName.get('spine_02'), new Quaternion().setFromAxisAngle(vec3(1, 0, 0), hunch * 0.3)],
      [skel.byName.get('spine_03'), new Quaternion().setFromAxisAngle(vec3(1, 0, 0), hunch * 0.2)],
      [skel.byName.get('neck_01'), new Quaternion().setFromAxisAngle(vec3(1, 0, 0), -hunch * 0.45)],
      [skel.byName.get('Head'), new Quaternion().setFromAxisAngle(vec3(1, 0, 0), -hunch * 0.25)],
    ]
      .filter(([b]) => b)
      .map(([b, q]) => ({ b, q, base: b.quaternion.clone(), last: new Quaternion(NaN, 0, 0, 1) }));
    character.post.push(() => {
      for (let bend of bends)
        (bend.b.quaternion.equals(bend.last) || bend.base.copy(bend.b.quaternion),
          bend.b.quaternion.copy(bend.base).multiply(bend.q),
          bend.last.copy(bend.b.quaternion));
    });
  }
  let relaxedGrip = makeRelaxedGrip(character, skel, srcBones, () => look);
  return (
    relaxedGrip && character.post.push(relaxedGrip),
    character.play('idle', 0),
    character.current && (character.current.time = Math.random() * character.current.getClip().duration),
    character
  );
}
/**
 * Mide, con la última pose de Death01, cuánto hay que bajar la pelvis para que el cuerpo tumbado toque
 * el suelo: {restZ, lowZ, dz} o null si no hace falta. Restaura después la pose del esqueleto.
 */
function measureLyingOffset(skel, clips, pelvisScale, pelvis, meshes, root) {
  let death = clips.get('Death01'),
    restTrack = clips.get('Idle_Loop')?.tracks.find((track) => track.name === 'pelvis.position'),
    skinned = meshes.find((m) => m.isSkinnedMesh);
  if (!death || !restTrack || !skinned) return null;
  let saved = [];
  skel.root.traverse((obj) => saved.push([obj, obj.position.clone(), obj.quaternion.clone()]));
  let mixer = new AnimationMixer(skel.root),
    action = mixer.clipAction(death);
  (action.play(), mixer.setTime(death.duration - 0.001), pelvis.position.multiplyScalar(pelvisScale));
  let lowZ = pelvis.position.z;
  (root.updateMatrixWorld(!0), skinned.skeleton.update());
  let gpar = skinned.geometry.attributes.gpar,
    count = skinned.geometry.attributes.position.count,
    hasSkin = !1;
  for (let k = 0; k < count && !hasSkin; k += 7) hasSkin = gpar.getZ(k) < 0.5;
  let v = new Vector3(),
    minY = 1 / 0;
  for (let k = 0; k < count; k += 3)
    (hasSkin && gpar.getZ(k) >= 0.5) ||
      (skinned.getVertexPosition(k, v).applyMatrix4(skinned.matrixWorld), v.y < minY && (minY = v.y));
  let y0 = pelvis.getWorldPosition(new Vector3()).y;
  ((pelvis.position.z += 0.1), root.updateMatrixWorld(!0));
  let slope = (pelvis.getWorldPosition(new Vector3()).y - y0) / 0.1;
  (action.stop(), mixer.uncacheRoot(skel.root));
  for (let [obj, pos, quat] of saved) (obj.position.copy(pos), obj.quaternion.copy(quat));
  root.updateMatrixWorld(!0);
  let restZ = restTrack.values[2] * pelvisScale,
    dz = (-0.02 - minY) / (slope || 1);
  return !Number.isFinite(dz) || Math.abs(dz) < 0.005 || restZ - lowZ < 0.2 ? null : { restZ, lowZ, dz };
}
/**
 * Ajuste posterior a la animación que, en reposo o caminando, gira las manos para que las armas
 * apunten hacia abajo (o hacia arriba las largas) en vez de seguir el ángulo del clip.
 * Devuelve la función (dt) o null si no hay manos.
 */
function makeRelaxedGrip(character, skel, srcBones, getLook) {
  let hands = ['r', 'l']
    .map((side) => {
      let hand = skel.byName.get(`hand_${side}`);
      if (!hand) return null;
      let gripQ = new Quaternion().setFromRotationMatrix(
          new Matrix4().extractRotation(gripMatrix(srcBones, side)),
        ),
        axis = new Vector3(0, 1, 0).applyQuaternion(gripQ);
      skel.root.updateMatrixWorld(!0);
      let handWorldQ = hand.getWorldQuaternion(new Quaternion()),
        dLocal = axis.applyQuaternion(handWorldQ.invert()).normalize();
      return {
        side,
        hand,
        dLocal,
        base: hand.quaternion.clone(),
        last: new Quaternion(NaN, 0, 0, 1),
        w: 0,
      };
    })
    .filter(Boolean);
  if (!hands.length) return null;
  let parentQ = new Quaternion(),
    rootQ = new Quaternion(),
    current = new Vector3(),
    target = new Vector3(),
    q = new Quaternion(),
    full = new Quaternion(),
    identity = new Quaternion();
  return (dt) => {
    let look = getLook(),
      gear = look.gear || {},
      relaxed = RELAXED_ANIMS.has(character.currentName) && look.style !== 'crossbow';
    for (let hs of hands) {
      let item = hs.side === 'r' ? gear.main : gear.off,
        want = relaxed && item && !HELD_ITEMS.test(item) ? 1 : 0;
      if (
        ((hs.w += (want - hs.w) * Math.min(1, (dt || 0.016) * 7)),
        hs.hand.quaternion.equals(hs.last) || hs.base.copy(hs.hand.quaternion),
        hs.w < 0.002)
      ) {
        (hs.hand.quaternion.copy(hs.base), hs.last.copy(hs.base));
        continue;
      }
      let isLong = LONG_WEAPONS.test(item || ''),
        sign = hs.side === 'r' ? -1 : 1;
      (isLong ? target.set(0.1 * sign, 0.93, 0.35) : target.set(0.08 * sign, -0.55, 0.83),
        character.root.getWorldQuaternion(rootQ),
        target.normalize().applyQuaternion(rootQ),
        hs.hand.parent.getWorldQuaternion(parentQ),
        current.copy(hs.dLocal).applyQuaternion(hs.base).applyQuaternion(parentQ),
        full.setFromUnitVectors(current, target),
        q.slerpQuaternions(identity, full, hs.w));
      let local = parentQ.clone().invert().multiply(q).multiply(parentQ).multiply(hs.base);
      (hs.hand.quaternion.copy(local), hs.last.copy(local));
    }
  };
}
/** Piezas de rasgos (cuernos, colmillos, cresta, cola), de no muerto (kk_*), harapos y equipo del look. */
async function buildGearParts(look, srcBones, palette, material, headPos) {
  let parts = [],
    add = (geo, bone, extra = {}) => geo && parts.push({ geometry: geo, material, bone, ...extra }),
    atHead = (geo) => geo && geo.translate(headPos.x, headPos.y, headPos.z),
    extras = look.extras || {};
  if (
    (extras.horns &&
      add(atHead(hornsGeometry(extras.horns.kind, extras.horns.color, extras.horns.scale || 1)), 'Head'),
    extras.tusks && add(atHead(tusksGeometry(extras.tusks)), 'Head'),
    extras.frill && add(atHead(frillGeometry(extras.frill.kind, extras.frill.color)), 'Head'),
    extras.tail)
  ) {
    let pelvis = bonePos(srcBones, 'pelvis');
    parts.push({
      geometry: tailGeometry(pelvis, extras.tail.color, extras.tail),
      material,
      weights: tailWeights(pelvis.y),
    });
  }
  if (look.undead || look.gear?.kk) {
    let pieces = await loadMonsterPieces();
    if (look.undead)
      for (let piece of skeletonParts(srcBones, { ...look.undead, pieces }))
        parts.push({ geometry: piece.geometry, material, bone: piece.bone });
    for (let item of look.gear?.kk || []) {
      let geo;
      if (item.bone === 'Head') {
        let scale = (pieces.headScale || 0.2) * (look.undead?.headScale ?? 1);
        ((geo = pieceGeometry(pieces, item.name, {
          matrix: mat.mul(mat.T(headPos.x, headPos.y - 0.055, headPos.z + 0.005), mat.S(scale)),
          metal: item.name === 'kk_casco' ? 0.6 : 0,
        })),
          geo && add(geo, 'Head'));
      } else if (item.hand) {
        if (((geo = pieceGeometry(pieces, item.name, { metal: 0.5 })), !geo)) continue;
        geo.computeBoundingBox();
        let box = geo.boundingBox,
          isShield = item.name.includes('escudo'),
          size = isShield ? box.max.x - box.min.x : box.max.y - box.min.y,
          target = isShield ? 0.48 : item.name === 'kk_baston' ? 1.6 : 0.75;
        if ((geo.scale(target / size, target / size, target / size), isShield)) {
          let pos = bonePos(srcBones, 'lowerarm_l').lerp(bonePos(srcBones, 'hand_l'), 0.45);
          (geo.applyMatrix4(mat.mul(mat.T(pos.x, pos.y + 0.07, pos.z), mat.R(-90, 0, 0), mat.R(0, 0, 90))),
            add(geo, 'lowerarm_l'));
        } else (geo.applyMatrix4(gripMatrix(srcBones, item.hand)), add(geo, `hand_${item.hand}`));
      }
    }
  }
  if (look.gear?.rags) {
    let pelvis = bonePos(srcBones, 'pelvis');
    parts.push({
      geometry: ragsGeometry(srcBones, look.gear.rags, { y0: pelvis.y + 0.06, y1: pelvis.y - 0.32 }),
      material,
      weights: skirtWeights(pelvis.y + 0.06),
    });
  }
  return (addEquipment(look, srcBones, palette, add, parts, material, headPos), parts);
}
/** Matriz que coloca un objeto en la palma de la mano «r» o «l» (eje Y del objeto = hacia delante). */
function gripMatrix(bones, side) {
  let hand = bonePos(bones, `hand_${side}`),
    sign = side === 'r' ? -1 : 1;
  return mat.mul(
    mat.T(hand.x + sign * 0.088, hand.y - 0.028, hand.z - 0.004),
    mat.R(90, 0, 0),
    mat.R(0, sign * 90, 0),
  );
}
/** Quita triángulos de una prenda con ruido (más abajo, más agujeros) para que parezca hecha jirones. */
function tatteredTriangles(mesh, amount) {
  let positions = bindPositions(mesh),
    index = mesh.geometry.index,
    tris = [],
    noise = (x, y, z) =>
      (Math.sin(x * 37.1 + y * 11.7) * Math.cos(z * 29.3 - y * 23.9) + Math.sin(y * 61.3 + x * 7.1) * 0.5) *
        0.5 +
      0.5;
  for (let k = 0; k < index.count; k += 3) {
    let a = index.getX(k),
      b = index.getX(k + 1),
      c = index.getX(k + 2),
      x = (positions[a * 3] + positions[b * 3] + positions[c * 3]) / 3,
      y = (positions[a * 3 + 1] + positions[b * 3 + 1] + positions[c * 3 + 1]) / 3,
      z = (positions[a * 3 + 2] + positions[b * 3 + 2] + positions[c * 3 + 2]) / 3;
    noise(x, y, z) + (y < 0.6 ? 0.25 : 0) * (0.6 - y) * 3 < 1 - amount && tris.push(a, b, c);
  }
  return tris;
}
/**
 * Añade el equipo visible de `look.gear`: armas y escudo en mano, objetos a la espalda y al cinto,
 * hombreras, peto, brazales, grebas, tocado, túnica, tabardo y emblema, capa, manto, delantal,
 * cadena, anteojos, collar y faja.
 */
function addEquipment(look, srcBones, palette, add, parts, material, headPos) {
  let gear = look.gear || {},
    female = look.body === 'f',
    handPos = (side) => bonePos(srcBones, `hand_${side}`),
    handMatrix = (side, offset = new Matrix4()) => gripMatrix(srcBones, side).multiply(offset),
    holdItem = (id, side, offset) => {
      let geo = weaponGeometry(id, palette);
      geo && (geo.applyMatrix4(handMatrix(side, offset)), add(geo, `hand_${side}`));
    };
  if ((gear.main && holdItem(gear.main, 'r'), gear.off && holdItem(gear.off, 'l'), gear.shield)) {
    let shield = shieldGeometry(gear.shield, palette),
      forearm = bonePos(srcBones, 'lowerarm_l'),
      hand = handPos('l'),
      mount = forearm.clone().lerp(hand, 0.45);
    (shield.applyMatrix4(mat.mul(mat.T(mount.x, mount.y + 0.07, mount.z), mat.R(-90, 0, 0), mat.R(0, 0, 90))),
      add(shield, 'lowerarm_l'));
  }
  let chest = bonePos(srcBones, 'spine_03'),
    backZ = chest.z - (female ? 0.15 : 0.17);
  for (let item of gear.back || []) {
    let geo = null;
    (item === 'carcaj'
      ? ((geo = quiverGeometry(palette)),
        geo.applyMatrix4(mat.mul(mat.T(0.08, chest.y - 0.3, backZ - 0.04), mat.R(0, 0, -25))))
      : item === 'laud'
        ? ((geo = luteGeometry(palette)),
          geo.applyMatrix4(mat.mul(mat.T(-0.04, chest.y - 0.15, backZ - 0.07), mat.R(0, 180, 35))))
        : item === 'mochila'
          ? ((geo = backpackGeometry(palette)), geo.applyMatrix4(mat.T(0, chest.y - 0.12, backZ - 0.1)))
          : item.startsWith('escudo:')
            ? ((geo = shieldGeometry(item.slice(7), palette)),
              geo.applyMatrix4(mat.mul(mat.T(0, chest.y - 0.05, backZ - 0.03), mat.R(0, 180, 0))))
            : item.startsWith('arma:') &&
              ((geo = weaponGeometry(item.slice(5), palette)),
              geo && geo.applyMatrix4(mat.mul(mat.T(0.02, chest.y - 0.05, backZ - 0.06), mat.R(0, 0, 155)))),
      geo && add(geo, 'spine_03'));
  }
  let pelvis = bonePos(srcBones, 'pelvis'),
    beltY = pelvis.y + (female ? 0.1 : 0.08);
  if (gear.book) {
    let book = bookGeometry(palette);
    (book.applyMatrix4(mat.mul(mat.T(female ? 0.19 : 0.18, beltY - 0.1, 0), mat.R(0, 90, 8))),
      add(book, 'pelvis'));
  }
  if (gear.pouch) {
    let pouch = pouchGeometry(palette);
    (pouch.applyMatrix4(mat.T(female ? -0.17 : -0.16, beltY - 0.08, 0.05)), add(pouch, 'pelvis'));
  }
  if (gear.sheath) {
    let sheath = weaponGeometry(gear.sheath, palette);
    sheath &&
      (sheath.applyMatrix4(
        mat.mul(mat.T(female ? 0.2 : 0.19, beltY - 0.05, -0.04), mat.R(0, 0, 180), mat.R(-18, 0, 0)),
      ),
      add(sheath, 'pelvis'));
  }
  let shoulderL = bonePos(srcBones, 'upperarm_l'),
    shoulderR = bonePos(srcBones, 'upperarm_r');
  if (gear.pauldrons) {
    let size = gear.pauldrons === 'grandes' ? 1.25 : 1;
    for (let [side, shoulder] of [
      [1, shoulderL],
      [-1, shoulderR],
    ]) {
      let geo = pauldronGeometry(side, shoulder.clone().add(vec3(-side * 0.02, 0.02, 0.01)), palette, {
        size,
      });
      parts.push({
        geometry: geo,
        material,
        weights: () => [
          [side > 0 ? 'upperarm_l' : 'upperarm_r', 0.55],
          [side > 0 ? 'clavicle_l' : 'clavicle_r', 0.45],
        ],
      });
    }
  }
  if (gear.breastplate) {
    let dims = female
        ? { y: chest.y - 0.02, w: 0.19, h: 0.25, front: 0.175, back: 0.155, cz: -0 }
        : { y: chest.y + 0.02, w: 0.215, h: 0.26, front: 0.155, back: 0.175, cz: -0.01 },
      geo = breastplateGeometry(dims, palette, { plate: gear.breastplate !== 'coraza' });
    parts.push({
      geometry: geo,
      material,
      weights: (v) =>
        v.y > chest.y - 0.05
          ? [['spine_03', 1]]
          : v.y > chest.y - 0.2
            ? [['spine_02', 1]]
            : [
                ['spine_01', 0.6],
                ['pelvis', 0.4],
              ],
    });
  }
  if (gear.bracers)
    for (let side of ['l', 'r']) {
      let elbow = bonePos(srcBones, `lowerarm_${side}`),
        hand = handPos(side);
      add(
        cylinderBetween(
          elbow.clone().lerp(hand, 0.25),
          elbow.clone().lerp(hand, 0.92),
          0.043,
          0.037,
          palette,
          {
            color: gear.bracers === 'cuero' ? palette.leather : null,
            metal: gear.bracers === 'cuero' ? 0 : 1,
          },
        ),
        `lowerarm_${side}`,
      );
    }
  if (gear.greaves)
    for (let side of ['l', 'r']) {
      let knee = bonePos(srcBones, `calf_${side}`),
        ankle = bonePos(srcBones, `foot_${side}`);
      add(
        cylinderBetween(
          knee
            .clone()
            .lerp(ankle, 0.05)
            .add(vec3(0, 0, 0.02)),
          knee
            .clone()
            .lerp(ankle, 0.72)
            .add(vec3(0, 0, 0.03)),
          0.068,
          0.058,
          palette,
        ),
        `calf_${side}`,
      );
    }
  let headSphere = { x: headPos.x, y: headPos.y + 0.1, z: headPos.z + 0.005, r: female ? 0.098 : 0.104 },
    headwear = gear.helmet || gear.hat;
  if ((headwear && add(headwearGeometry(headwear, headSphere, palette), 'Head'), gear.robe)) {
    let top = pelvis.y + 0.13,
      geo = robeGeometry({
        yTop: top,
        yBottom: gear.robe === 'corta' ? 0.48 : 0.07,
        rTop: female ? 0.215 : 0.205,
        rBottom: gear.robe === 'corta' ? 0.32 : 0.36,
        cz: pelvis.z - 0.005,
        depth: 0.88,
        color: gear.robeColor || palette.cloth1,
        open: gear.robeOpen || 0,
      });
    parts.push({ geometry: geo, material, weights: skirtWeights(top) });
  }
  if (gear.tabard) {
    let color = gear.tabardColor || palette.cloth1,
      out = gear.breastplate ? 0.075 : 0.022,
      top = chest.y + (female ? 0.1 : 0.12);
    for (let panel of tabardGeometry({
      g: female ? 'f' : 'm',
      top,
      hip: pelvis.y + 0.02,
      bottom: gear.tabard === 'corta' ? pelvis.y - 0.22 : 0.48,
      w0: female ? 0.24 : 0.27,
      w1: 0.3,
      out,
      color,
    }))
      parts.push({ geometry: panel.geometry, material, weights: panel.weights });
    if (gear.emblem) {
      let z = (female ? 0.16 : 0.13) + out + 0.004,
        disc = paint(new CircleGeometry(0.055, 14), {
          color: palette.gold,
          metal: 0.8,
          matrix: mat.T(0, chest.y - (female ? 0.08 : 0.06), z),
        }),
        rays = [];
      for (let k = 0; k < 8; k++)
        rays.push(
          paint(new ConeGeometry(0.014, 0.05, 3), {
            color: palette.gold,
            metal: 0.8,
            matrix: mat.mul(
              mat.T(0, chest.y - (female ? 0.08 : 0.06), z),
              mat.R(0, 0, k * 45),
              mat.T(0, 0.075, 0),
              mat.S(1, 1, 0.2),
            ),
          }),
        );
      parts.push({ geometry: mergeParts([disc, ...rays]), material, bone: 'spine_03' });
    }
  }
  if (gear.cape) {
    let z = chest.z - (female ? 0.18 : 0.2),
      geo = capeGeometry({
        y0: chest.y + 0.13,
        y1: gear.cape === 'corta' ? pelvis.y - 0.1 : 0.2,
        w0: 0.36,
        w1: gear.cape === 'corta' ? 0.46 : 0.62,
        z,
        bulge: 0.05,
        color: gear.capeColor || palette.cloth1,
        back: !0,
      });
    parts.push({ geometry: geo, material, weights: capeWeights(chest.y, pelvis.y) });
    let clasp = paint(new TorusGeometry(0.2, 0.012, 4, 14, Math.PI), {
      color: gear.capeColor || palette.cloth1,
      matrix: mat.mul(mat.T(0, chest.y + 0.13, chest.z - 0.03), mat.R(90, 0, 0), mat.S(1.05, 0.9, 1)),
    });
    parts.push({ geometry: clasp, material, bone: 'spine_03' });
  }
  if (gear.mantle) {
    let leafy = gear.mantle === 'hojas',
      geo = mantleGeometry({
        y: chest.y + 0.12,
        rx: female ? 0.17 : 0.19,
        rz: female ? 0.13 : 0.14,
        cz: chest.z - 0.02,
        color: leafy ? '#4f6a32' : gear.mantleColor || '#6a5440',
        thick: 0.07,
        leaves: leafy,
      });
    parts.push({
      geometry: geo,
      material,
      weights: (v) => [
        ['spine_03', 0.7],
        [v.x > 0 ? 'clavicle_l' : 'clavicle_r', 0.3],
      ],
    });
  }
  if (gear.apron)
    for (let panel of tabardGeometry({
      g: female ? 'f' : 'm',
      top: chest.y - 0.02,
      hip: pelvis.y + 0.02,
      bottom: pelvis.y - 0.42,
      w0: 0.24,
      w1: 0.34,
      out: 0.018,
      color: gear.apron,
      back: !1,
      split: !1,
    }))
      parts.push({ geometry: panel.geometry, material, weights: panel.weights });
  if (gear.chain) {
    let chain = paint(new TorusGeometry(female ? 0.1 : 0.115, 0.007, 4, 18, Math.PI), {
      color: palette.gold,
      metal: 1,
      matrix: mat.mul(
        mat.T(0, chest.y + 0.08, chest.z + (female ? 0.06 : 0.05)),
        mat.R(180, 0, 0),
        mat.R(-62, 0, 0),
      ),
    });
    add(
      mergeParts([
        chain,
        paint(new CylinderGeometry(0.025, 0.025, 0.008, 10), {
          color: palette.gold,
          metal: 1,
          matrix: mat.mul(mat.T(0, chest.y - 0.03, chest.z + (female ? 0.17 : 0.155)), mat.R(90, 0, 0)),
        }),
      ]),
      'spine_03',
    );
  }
  if (
    (gear.glasses &&
      add(
        glassesGeometry(
          { x: headPos.x, y: headPos.y + 0.098, z: headPos.z + (female ? 0.1 : 0.112) },
          palette,
        ),
        'Head',
      ),
    gear.necklace)
  ) {
    let neck = bonePos(srcBones, 'neck_01'),
      beads = [];
    for (let k = 0; k < 9; k++) {
      let ang = (-0.75 + (k / 8) * 1.5) * Math.PI * 0.5,
        x = Math.sin(ang) * (female ? 0.075 : 0.085),
        z = neck.z + Math.cos(ang) * (female ? 0.07 : 0.08) + 0.01,
        y = neck.y - 0.06 - Math.cos(ang) * 0.03;
      beads.push(
        paint(new ConeGeometry(0.008, 0.04, 5), {
          color: '#e8dcc0',
          matrix: mat.mul(mat.T(x, y, z), mat.R(180, 0, 0), mat.T(0, 0.015, 0)),
        }),
      );
    }
    (beads.push(
      paint(new TorusGeometry(0.085, 0.004, 4, 16), {
        color: '#3a2a1c',
        matrix: mat.mul(mat.T(0, neck.y - 0.05, neck.z + 0.01), mat.R(75, 0, 0)),
      }),
    ),
      add(mergeParts(beads), 'spine_03'));
  }
  gear.sash &&
    add(
      beltGeometry({
        y: beltY,
        rx: female ? 0.15 : 0.16,
        rz: female ? 0.12 : 0.13,
        cz: pelvis.z + 0,
        P: palette,
        color: gear.sash,
      }),
      'pelvis',
    );
}
/** Pesos de hueso de faldas y túnicas: pelvis arriba y muslos (según el lado) hacia abajo. */
function skirtWeights(topY) {
  return (v) => {
    let k = Math.min(1, Math.max(0, (topY - v.y) / 0.55)),
      side = Math.max(-1, Math.min(1, v.x / 0.12)),
      wl = (0.5 + side * 0.5) * k * 0.85,
      wr = (0.5 - side * 0.5) * k * 0.85;
    return [
      ['pelvis', 1 - wl - wr + 0.001],
      ['thigh_l', wl],
      ['thigh_r', wr],
    ];
  };
}
/** Pesos de hueso de la capa: columna arriba, pelvis y muslos abajo. */
function capeWeights(chestY, pelvisY) {
  return (v) => {
    if (v.y > chestY - 0.05) return [['spine_03', 1]];
    if (v.y > pelvisY + 0.1) {
      let k = (chestY - 0.05 - v.y) / (chestY - pelvisY - 0.15);
      return [
        ['spine_03', 1 - k],
        ['spine_01', k],
      ];
    }
    let k = Math.min(1, (pelvisY + 0.1 - v.y) / 0.7);
    return [
      ['spine_01', 0.3 * (1 - k)],
      ['pelvis', 0.7 + 0.1 * k],
      ['thigh_l', k * 0.15],
      ['thigh_r', k * 0.15],
    ];
  };
}
const vec3 = (x, y, z) => new Vector3(x, y, z);
/** Peinado → malla de pelo del glTF que lo sirve de base (null = calvo). */
const HAIR_MESHES = {
  raya: 'raya',
  largo: 'largo',
  mono: 'mono',
  coleta: 'raya',
  trenza: 'rapado_f',
  rapado: 'rapado',
  cresta: 'rapado',
  calvo: null,
};
/** Huesos a los que se aplican las proporciones del cuerpo. */
const SCALED_BONES = [
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
const bindPosCache = new Map();
let fingerPoseCache = null;
/** Animaciones en las que makeRelaxedGrip recoloca las manos. */
const RELAXED_ANIMS = new Set([
  'idle',
  'idle_alt',
  'walk',
  'run',
  'sprint',
  'walk_back',
  'talk',
  'sit',
  'sit_talk',
]);
/** Armas largas, que en reposo se llevan apuntando hacia arriba. */
const LONG_WEAPONS =
  /great|maul|quarterstaff|staff|spear|glaive|halberd|javelin|bow|crook|pike|lance|trident/;
/** Objetos de mano que no se recolocan. */
const HELD_ITEMS = /mug|holy_symbol|book|lute|torch/;

export { buildHumanoid, gripMatrix };
