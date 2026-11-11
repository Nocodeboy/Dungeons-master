// actors/rig.js
// Reconstruido de publicado/juego.js (módulo __esm «p2»).
//
// Esqueleto y animaciones de los humanoides. Carga assets/chars/humanos.json (cuerpos «m»/«f»,
// piezas de ropa y pelo como SkinnedMesh) y assets/chars/anims.json (clips, con el movimiento
// raíz recortado y la altura de la pelvis corregida con datos/animaciones.json). bakeSkinnedMeshes
// «hornea» todas las piezas de un personaje (mallas del glTF y geometría procedural) en el
// esqueleto clonado y escalado, fundiéndolas en una SkinnedMesh por material. Lo usa humanoid.js.

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

/**
 * Carga (una vez) humanos.json: devuelve {gltf, parts, rootBone}, donde `parts` agrupa las
 * SkinnedMesh por pieza («m_…», «f_…», «pelo_…») y `rootBone` da el hueso raíz de cada cuerpo.
 */
function loadHumanRig() {
  return (
    rigPromise ||
      (rigPromise = loadGLTF('assets/chars/humanos.json').then((gltf) => {
        (gltf.scene.traverse((obj) => {
          obj.userData && obj.userData.n && (obj.name = obj.userData.n);
        }),
          gltf.scene.updateMatrixWorld(!0));
        let parts = new Map();
        gltf.scene.traverse((obj) => {
          if (!obj.isSkinnedMesh) return;
          let group = obj;
          for (; group && !/^(m|f|pelo)_/.test(group.name);) group = group.parent;
          let key = group ? group.name : obj.name;
          (parts.has(key) || parts.set(key, []), parts.get(key).push(obj));
        });
        let rootOf = (body) =>
          gltf.scene
            .getObjectByName(`humano_${body}`)
            .children.find((child) => child.isBone || child.name === 'root');
        return { gltf, parts, rootBone: { m: rootOf('m'), f: rootOf('f') } };
      })),
    rigPromise
  );
}
/**
 * Carga (una vez) anims.json y devuelve Map(nombre → AnimationClip) sin pistas de escala ni de
 * posición salvo la de la pelvis, que se recorta (clampRootMotion) y se pega al suelo (groundTrack).
 * Con `globalThis.__mdgSinSuelo` no se aplica la corrección de suelo.
 */
function loadAnimClips() {
  return (
    clipsPromise ||
      (clipsPromise = loadGLTF('assets/chars/anims.json').then((gltf) => {
        let clips = new Map(),
          restTrack = gltf.animations
            .find((anim) => anim.name === 'Idle_Loop')
            ?.tracks.find((track) => track.name === 'pelvis.position'),
          rest = restTrack ? Array.from(restTrack.values.slice(0, 3)) : [0, 0, ANIM_PELVIS_HEIGHT],
          upAxis = [0, 1, 2].reduce(
            (best, axis) => (Math.abs(rest[axis]) > Math.abs(rest[best]) ? axis : best),
            0,
          );
        for (let anim of gltf.animations) {
          let tracks = anim.tracks.filter((track) =>
              track.name.endsWith('.scale')
                ? !1
                : track.name.endsWith('.position')
                  ? track.name.startsWith('pelvis.')
                  : !track.name.startsWith('Armature.'),
            ),
            pelvis = tracks.find((track) => track.name === 'pelvis.position');
          if (pelvis) {
            clampRootMotion(anim.name, pelvis, rest, upAxis);
            let grounded =
              datosAnimaciones[anim.name] && !globalThis.__mdgSinSuelo
                ? groundTrack(pelvis, datosAnimaciones[anim.name], upAxis)
                : null;
            grounded && (tracks[tracks.indexOf(pelvis)] = pelvis = grounded);
          }
          clips.set(anim.name, new AnimationClip(anim.name, anim.duration, tracks));
        }
        return clips;
      })),
    clipsPromise
  );
}
/** Limita el desplazamiento horizontal de la pelvis de un clip (y lo devuelve al origen en «Awaken»). */
function clampRootMotion(name, track, rest, upAxis) {
  let values = track.values,
    times = track.times,
    count = times.length;
  if (count < 2) return;
  let [ax1, ax2] = [0, 1, 2].filter((axis) => axis !== upAxis),
    rest1 = rest[ax1],
    rest2 = rest[ax2];
  if (/Awaken_Standing/.test(name)) {
    let off1 = values[ax1] - rest1,
      off2 = values[ax2] - rest2,
      span = times[count - 1] - times[0] || 1;
    for (let k = 0; k < count; k++) {
      let fade = 1 - (times[k] - times[0]) / span;
      ((values[k * 3 + ax1] -= off1 * fade), (values[k * 3 + ax2] -= off2 * fade));
    }
  }
  let maxDist = 0;
  for (let k = 0; k < count; k++)
    maxDist = Math.max(maxDist, Math.hypot(values[k * 3 + ax1] - rest1, values[k * 3 + ax2] - rest2));
  let limit = /Dodge/.test(name) ? 0.35 : /Skeletons/.test(name) ? 0.6 : 1.1;
  if (maxDist <= limit) return;
  let scale = limit / maxDist;
  for (let k = 0; k < count; k++)
    ((values[k * 3 + ax1] = rest1 + (values[k * 3 + ax1] - rest1) * scale),
      (values[k * 3 + ax2] = rest2 + (values[k * 3 + ax2] - rest2) * scale));
}
/** Remuestrea la pista de la pelvis cada `step` s sumando `offsets` en el eje vertical. */
function groundTrack(track, [step, offsets], upAxis) {
  let count = offsets.length,
    times = new Float32Array(count),
    values = new Float32Array(count * 3),
    interp = track.createInterpolant();
  for (let k = 0; k < count; k++) {
    times[k] = k * step;
    let v = interp.evaluate(times[k]);
    (values.set(v, k * 3), (values[k * 3 + upAxis] += offsets[k]));
  }
  return new VectorKeyframeTrack(track.name, times, values);
}
/**
 * Índices de los triángulos de una SkinnedMesh cuyos tres vértices dependen sobre todo de huesos de
 * las regiones dadas (BODY_REGIONS: cabeza, torso, brazos…). Se cachea por malla y regiones.
 */
function triangleSubset(mesh, regions) {
  let key = `${mesh.uuid}|${regions.join(',')}`;
  if (subsetCache.has(key)) return subsetCache.get(key);
  let geo = mesh.geometry,
    skinIndex = geo.attributes.skinIndex,
    skinWeight = geo.attributes.skinWeight,
    boneNames = mesh.skeleton.bones.map((bone) => bone.name),
    patterns = regions.map((region) => BODY_REGIONS[region]),
    keep = new Uint8Array(skinIndex.count);
  for (let v = 0; v < skinIndex.count; v++) {
    let best = 0,
      bone = 0;
    for (let j = 0; j < 4; j++) {
      let w = skinWeight.getComponent(v, j);
      w > best && ((best = w), (bone = skinIndex.getComponent(v, j)));
    }
    keep[v] = patterns.some((re) => re.test(boneNames[bone])) ? 1 : 0;
  }
  let index = geo.index,
    tris = [];
  for (let k = 0; k < index.count; k += 3) {
    let a = index.getX(k),
      b = index.getX(k + 1),
      c = index.getX(k + 2);
    keep[a] && keep[b] && keep[c] && tris.push(a, b, c);
  }
  return (subsetCache.set(key, tris), tris);
}
/** Clona la jerarquía de huesos: {root, bones, byName}. */
function cloneSkeleton(rootBone) {
  let root = rootBone.clone(!0),
    bones = [],
    byName = new Map();
  return (
    root.traverse((obj) => {
      obj.isBone && (bones.push(obj), byName.set(obj.name, obj));
    }),
    { root, bones, byName }
  );
}
/** Escala las posiciones de los hijos de cada hueso según `scales` (Map nombre → Vector3). */
function scaleBones(rig, scales) {
  let one = new Vector3(1, 1, 1);
  rig.root.traverse((bone) => {
    if (!bone.isBone) return;
    let scale = scales.get(bone.name) || one;
    for (let child of bone.children) child.isBone && child.position.multiply(scale);
  });
}
/**
 * Hornea las piezas de un personaje en el esqueleto `rig` (ya escalado). Cada pieza es
 * {mesh, index?, material, deform?} (malla del glTF, se repielan sus vértices) o
 * {geometry, material, bone | weights, deform?} (geometría procedural). `srcBones` son los huesos
 * originales; `prev` ({Wnew, skeleton}) reutiliza el esqueleto al cambiar de arma.
 * Devuelve {meshes, skeleton, Wnew, boneIndex}.
 */
function bakeSkinnedMeshes(rig, parts, scales, model, srcBones, prev = null) {
  model.updateMatrixWorld(!0);
  let modelInv = new Matrix4().copy(model.matrixWorld).invert(),
    boneIndex = new Map(rig.bones.map((bone, idx) => [bone.name, idx])),
    bindWorld = prev ? prev.Wnew : rig.bones.map((bone) => modelInv.clone().multiply(bone.matrixWorld)),
    one = new Vector3(1, 1, 1),
    byMaterial = new Map(),
    pos = new Vector3(),
    nrm = new Vector3(),
    outPos = new Vector3(),
    outNrm = new Vector3(),
    srcPos = new Vector3(),
    srcNrm = new Vector3(),
    tmp = new Vector3(),
    xformCache = new Map(),
    boneXform = (name, srcMatrix) => {
      let key = name;
      if (srcMatrix === void 0 && xformCache.has(key)) return xformCache.get(key);
      let idx = boneIndex.has(name) ? boneIndex.get(name) : 0,
        scale = scales.get(name) || one,
        src = srcMatrix || srcBones.get(name)?.matrixWorld || bindWorld[idx],
        xf = bindWorld[idx]
          .clone()
          .multiply(new Matrix4().makeScale(scale.x, scale.y, scale.z))
          .multiply(src.clone().invert()),
        entry = [xf, new Matrix3().getNormalMatrix(xf), idx];
      return (srcMatrix === void 0 && xformCache.set(key, entry), entry);
    },
    head = srcBones.get('Head'),
    headPos = head ? new Vector3().setFromMatrixPosition(head.matrixWorld) : new Vector3();
  for (let part of parts) {
    let geo;
    if ((part.mesh ? (geo = bakeMesh(part)) : (geo = bakeGeometry(part)), !geo)) continue;
    let material = part.material;
    (byMaterial.has(material) || byMaterial.set(material, []), byMaterial.get(material).push(geo));
  }
  function bakeMesh(part) {
    let mesh = part.mesh,
      skel = mesh.skeleton,
      skinMats = [],
      normalMats = [],
      boneXforms = [],
      boneIdx = [],
      headIdx = -1;
    for (let j = 0; j < skel.bones.length; j++) {
      let name = skel.bones[j].name;
      name === 'Head' && (headIdx = j);
      let world = skel.bones[j].matrixWorld,
        skinMat = world.clone().multiply(skel.boneInverses[j]).multiply(mesh.bindMatrix);
      (skinMats.push(skinMat), normalMats.push(new Matrix3().getNormalMatrix(skinMat)));
      let xf = boneXform(name, world);
      (boneXforms.push(xf), boneIdx.push(xf[2]));
    }
    let center =
        headIdx >= 0 ? new Vector3().setFromMatrixPosition(skel.bones[headIdx].matrixWorld) : headPos,
      geo = mesh.geometry,
      posAttr = geo.attributes.position,
      nrmAttr = geo.attributes.normal,
      uvAttr = geo.attributes.uv,
      skinIdxAttr = geo.attributes.skinIndex,
      skinWAttr = geo.attributes.skinWeight,
      indices = part.index || (geo.index ? Array.from(geo.index.array) : [...Array(posAttr.count).keys()]),
      remap = new Int32Array(posAttr.count).fill(-1),
      used = [];
    for (let v of indices) remap[v] < 0 && ((remap[v] = used.length), used.push(v));
    let n = used.length,
      positions = new Float32Array(n * 3),
      normals = new Float32Array(n * 3),
      uvs = new Float32Array(n * 2),
      outIdx = new Uint16Array(n * 4),
      outW = new Float32Array(n * 4);
    for (let k = 0; k < n; k++) {
      let v = used[k];
      (srcPos.fromBufferAttribute(posAttr, v),
        srcNrm.fromBufferAttribute(nrmAttr, v),
        pos.set(0, 0, 0),
        nrm.set(0, 0, 0));
      let headW = 0;
      for (let j = 0; j < 4; j++) {
        let w = skinWAttr.getComponent(v, j);
        if (w === 0) continue;
        let bone = skinIdxAttr.getComponent(v, j);
        (bone === headIdx && (headW += w),
          pos.addScaledVector(tmp.copy(srcPos).applyMatrix4(skinMats[bone]), w),
          nrm.addScaledVector(tmp.copy(srcNrm).applyMatrix3(normalMats[bone]), w));
      }
      (nrm.normalize(),
        part.deform && part.deform(pos, nrm, headW, center, part),
        outPos.set(0, 0, 0),
        outNrm.set(0, 0, 0));
      for (let j = 0; j < 4; j++) {
        let w = skinWAttr.getComponent(v, j),
          bone = skinIdxAttr.getComponent(v, j);
        ((outIdx[k * 4 + j] = boneIdx[bone]),
          (outW[k * 4 + j] = w),
          w !== 0 &&
            (outPos.addScaledVector(tmp.copy(pos).applyMatrix4(boneXforms[bone][0]), w),
            outNrm.addScaledVector(tmp.copy(nrm).applyMatrix3(boneXforms[bone][1]), w)));
      }
      (outNrm.normalize(),
        (positions[k * 3] = outPos.x),
        (positions[k * 3 + 1] = outPos.y),
        (positions[k * 3 + 2] = outPos.z),
        (normals[k * 3] = outNrm.x),
        (normals[k * 3 + 1] = outNrm.y),
        (normals[k * 3 + 2] = outNrm.z),
        uvAttr && ((uvs[k * 2] = uvAttr.getX(v)), (uvs[k * 2 + 1] = uvAttr.getY(v))));
    }
    let out = new BufferGeometry();
    return (
      out.setAttribute('position', new BufferAttribute(positions, 3)),
      out.setAttribute('normal', new BufferAttribute(normals, 3)),
      out.setAttribute('uv', new BufferAttribute(uvs, 2)),
      out.setAttribute('gcol', new BufferAttribute(new Float32Array(n * 3).fill(1), 3)),
      out.setAttribute('gpar', new BufferAttribute(new Float32Array(n * 3), 3)),
      out.setAttribute('skinIndex', new BufferAttribute(outIdx, 4)),
      out.setAttribute('skinWeight', new BufferAttribute(outW, 4)),
      out.setIndex(indices.map((v) => remap[v])),
      out
    );
  }
  function bakeGeometry(part) {
    let geo = part.geometry;
    if (!geo) return null;
    geo.index && (geo = geo.toNonIndexed());
    let posAttr = geo.attributes.position,
      nrmAttr = geo.attributes.normal,
      count = posAttr.count,
      positions = new Float32Array(count * 3),
      normals = new Float32Array(count * 3),
      outIdx = new Uint16Array(count * 4),
      outW = new Float32Array(count * 4);
    for (let v = 0; v < count; v++) {
      (pos.fromBufferAttribute(posAttr, v), nrm.fromBufferAttribute(nrmAttr, v));
      let weights = part.weights ? part.weights(pos) : [[part.bone, 1]];
      (part.deform && part.deform(pos, nrm, 1, headPos, part), outPos.set(0, 0, 0), outNrm.set(0, 0, 0));
      let total = 0,
        slot = 0;
      for (let [bone, w] of weights) {
        if (slot >= 4 || !(w > 0)) continue;
        let xf = boneXform(bone);
        ((outIdx[v * 4 + slot] = xf[2]),
          (outW[v * 4 + slot] = w),
          outPos.addScaledVector(tmp.copy(pos).applyMatrix4(xf[0]), w),
          outNrm.addScaledVector(tmp.copy(nrm).applyMatrix3(xf[1]), w),
          (total += w),
          slot++);
      }
      if (total) {
        outPos.multiplyScalar(1 / total);
        for (let j = 0; j < 4; j++) outW[v * 4 + j] /= total;
        (outNrm.normalize(),
          positions.set([outPos.x, outPos.y, outPos.z], v * 3),
          normals.set([outNrm.x, outNrm.y, outNrm.z], v * 3));
      }
    }
    let out = new BufferGeometry();
    (out.setAttribute('position', new BufferAttribute(positions, 3)),
      out.setAttribute('normal', new BufferAttribute(normals, 3)));
    let uvAttr = geo.attributes.uv,
      colAttr = geo.attributes.color,
      metalAttr = geo.attributes.metal,
      uvs = new Float32Array(count * 2),
      gcol = new Float32Array(count * 3).fill(1),
      gpar = new Float32Array(count * 3);
    for (let v = 0; v < count; v++)
      (uvAttr && ((uvs[v * 2] = uvAttr.getX(v)), (uvs[v * 2 + 1] = uvAttr.getY(v))),
        colAttr &&
          ((gcol[v * 3] = colAttr.getX(v)),
          (gcol[v * 3 + 1] = colAttr.getY(v)),
          (gcol[v * 3 + 2] = colAttr.getZ(v)),
          (gpar[v * 3] = metalAttr ? metalAttr.getX(v) : 0),
          (gpar[v * 3 + 1] = metalAttr ? metalAttr.getY(v) : 0),
          (gpar[v * 3 + 2] = 1)));
    return (
      out.setAttribute('uv', new BufferAttribute(uvs, 2)),
      out.setAttribute('gcol', new BufferAttribute(gcol, 3)),
      out.setAttribute('gpar', new BufferAttribute(gpar, 3)),
      out.setAttribute('skinIndex', new BufferAttribute(outIdx, 4)),
      out.setAttribute('skinWeight', new BufferAttribute(outW, 4)),
      out
    );
  }
  let skeleton =
      prev?.skeleton ||
      new Skeleton(
        rig.bones,
        bindWorld.map((m) => m.clone().invert()),
      ),
    meshes = [];
  for (let [material, geos] of byMaterial) {
    let indexed = geos.some((g) => g.index) ? geos.map((g) => (g.index ? g : ensureIndex(g))) : geos,
      merged = indexed.length > 1 ? mergeGeometries(indexed, !1) : indexed[0];
    if (!merged) {
      console.warn('[personajes] no se pudieron fundir las piezas de', material.name || material.type);
      continue;
    }
    for (let g of indexed) g !== merged && g.dispose();
    merged.computeBoundingSphere();
    let mesh = new SkinnedMesh(merged, material);
    (mesh.bind(skeleton, new Matrix4()),
      (mesh.castShadow = !0),
      (mesh.receiveShadow = !0),
      (mesh.boundingSphere = new Sphere(new Vector3(0, 0.9, 0), 1.6)),
      (mesh.frustumCulled = !0),
      meshes.push(mesh));
  }
  return { meshes, skeleton, Wnew: bindWorld, boneIndex };
}
/** Añade un índice trivial a una geometría no indexada (para poder fundirla con otras). */
function ensureIndex(geo) {
  let count = geo.attributes.position.count,
    index = new (count > 65535 ? Uint32Array : Uint16Array)(count);
  for (let i = 0; i < count; i++) index[i] = i;
  return (geo.setIndex(new BufferAttribute(index, 1)), geo);
}
let rigPromise = null;
let clipsPromise = null;
/** Altura de la pelvis (m) del esqueleto con el que se grabaron las animaciones. */
const ANIM_PELVIS_HEIGHT = 0.917;
/** Regiones del cuerpo → huesos que las forman (para quitar la piel tapada por la ropa). */
const BODY_REGIONS = {
  cabeza: /^(Head|neck_01)$/,
  torso: /^(spine_0[123]|clavicle_[lr])$/,
  cadera: /^pelvis$/,
  brazos: /^(upperarm|lowerarm)_[lr]$/,
  manos: /^(hand_[lr]|(index|middle|ring|pinky|thumb)_\d\d(_leaf)?_[lr])$/,
  piernas: /^(thigh|calf)_[lr]$/,
  pantorrillas: /^calf_[lr]$/,
  pies: /^(foot|ball)(_leaf)?_[lr]$/,
};
const subsetCache = new Map();

export {
  triangleSubset,
  bakeSkinnedMeshes,
  loadHumanRig,
  loadAnimClips,
  scaleBones,
  ANIM_PELVIS_HEIGHT,
  cloneSkeleton,
};
