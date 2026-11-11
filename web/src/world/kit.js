// world/kit.js — piezas glTF de los kits del mundo (assets/world/aldea, naturaleza, atrezo y
// assets/dungeon/mazmorra): carga, despiece en {geo, mat} con la transformación horneada,
// instanciado con fundido y `MeshMerger`, que funde geometría estática por material con AO de contacto
// en un atributo y colores de vértice. Reconstruido de publicado/juego.js (módulo __esm «pr»).
// Lo usan index.js, buildings.js, crypt.js, interiors.js, procedural.js, props.js y vegetation.js.

import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { loadGLTF } from '../assets.js';
import { worldMaterial, worldDepthMaterial } from './materials.js';

/** Carga los kits nombrados (claves de `KIT_FILES`) y registra sus piezas y materiales. */
async function loadKits(names) {
  await Promise.all(
    names.map(async (name) => {
      if (kits.has(name)) return;
      let gltf = await loadGLTF(KIT_FILES[name]);
      gltf.scene.updateMatrixWorld(!0);
      let pieces = new Map();
      for (let child of gltf.scene.children) pieces.set(child.name, child);
      (gltf.scene.traverse((node) => {
        if (node.isMesh)
          for (let mat of [].concat(node.material))
            kitMaterials.has(mat.name) || kitMaterials.set(mat.name, mat);
      }),
        kits.set(name, pieces));
    }),
  );
}
/** Nodo raíz de la pieza `name` en cualquier kit cargado, o null. */
function findPiece(name) {
  for (let [, pieces] of kits) if (pieces.has(name)) return pieces.get(name);
  return null;
}
/** ¿Existe la pieza `name` en algún kit cargado? */
function hasPiece(name) {
  return !!findPiece(name);
}
/** Copia un atributo como Float32 no normalizado y no entrelazado. */
function toFloatAttribute(attr) {
  if (attr.array instanceof Float32Array && !attr.normalized && !attr.isInterleavedBufferAttribute)
    return attr.clone();
  let array = new Float32Array(attr.count * attr.itemSize);
  for (let i = 0; i < attr.count; i++)
    for (let c = 0; c < attr.itemSize; c++)
      array[i * attr.itemSize + c] = attr.getComponent
        ? attr.getComponent(i, c)
        : [attr.getX(i), attr.getY(i), attr.getZ(i), attr.getW(i)][c];
  return new BufferAttribute(array, attr.itemSize);
}
/** Geometría con posición/normal/uv/color y la matriz aplicada (invierte caras si refleja). */
function bakeGeometry(src, matrix) {
  let geo = new BufferGeometry();
  for (let name of ['position', 'normal', 'uv', 'color']) {
    let attr = src.getAttribute(name);
    attr && geo.setAttribute(name, toFloatAttribute(attr));
  }
  if (
    (geo.getAttribute('uv') ||
      geo.setAttribute(
        'uv',
        new BufferAttribute(new Float32Array(geo.getAttribute('position').count * 2), 2),
      ),
    geo.getAttribute('normal') || geo.computeVertexNormals(),
    src.index && geo.setIndex(Array.from(src.index.array)),
    geo.applyMatrix4(matrix),
    matrix.determinant() < 0 && geo.index)
  ) {
    let index = geo.index.array;
    for (let k = 0; k < index.length; k += 3) [index[k + 1], index[k + 2]] = [index[k + 2], index[k + 1]];
  }
  return (geo.computeBoundingBox(), geo.computeBoundingSphere(), geo);
}
/**
 * Partes de una pieza como [{geo, mat, name}] relativas a su raíz (una por material). Cacheado.
 * Avisa una vez por consola si la pieza no existe.
 */
function pieceParts(name) {
  if (partsCache.has(name)) return partsCache.get(name);
  let root = findPiece(name);
  if (!root)
    return (
      missingPieces.has(name) || console.warn('[mundo] pieza desconocida', name),
      missingPieces.add(name),
      []
    );
  let inverse = new Matrix4().copy(root.matrixWorld).invert(),
    parts = [];
  if (
    (root.traverse((node) => {
      if (!node.isMesh) return;
      let mats = Array.isArray(node.material) ? node.material : [node.material],
        matrix = new Matrix4().multiplyMatrices(inverse, node.matrixWorld);
      if (mats.length === 1)
        parts.push({ geo: bakeGeometry(node.geometry, matrix), mat: kitMaterial(mats[0]), name: node.name });
      else
        for (let group of node.geometry.groups) {
          let geo = node.geometry.clone();
          (geo.setIndex(Array.from(node.geometry.index.array.slice(group.start, group.start + group.count))),
            parts.push({
              geo: bakeGeometry(geo, matrix),
              mat: kitMaterial(mats[group.materialIndex]),
              name: node.name,
            }));
        }
    }),
    /^Bush_/.test(name))
  ) {
    let leafMat = kitMaterials.get('Leaves_NormalTree');
    for (let part of parts)
      if (part.mat.name === 'Leaves_TwistedTree' && leafMat) {
        let mat = part.mat.clone();
        ((mat.name = 'Leaves_Bush'), (mat.map = leafMat.map), mat.color.set(14214832), (part.mat = mat));
      }
  }
  return (partsCache.set(name, parts), parts);
}
/** Copia ajustada de un material del kit (tinte, anisotropía, doble cara, vidrio de ventana). */
function kitMaterial(src) {
  if (kitMaterialCache.has(src.uuid)) return kitMaterialCache.get(src.uuid);
  let mat = src.clone();
  mat.name = src.name;
  let tint = KIT_TINTS[src.name];
  return (
    tint && mat.color.multiply(new Color(tint)),
    mat.map && (mat.map.anisotropy = 4),
    (mat.alphaTest > 0 || mat.transparent) && (mat.side = DoubleSide),
    mat.name === 'MI_WindowGlass' &&
      ((mat.transparent = !1),
      (mat.opacity = 1),
      mat.color.setRGB(0.12, 0.09, 0.07),
      (mat.emissive = new Color(16754768)),
      (mat.emissiveIntensity = 0),
      (mat.roughness = 0.25),
      (mat.userData.window = !0)),
    (mat.metalness = Math.min(mat.metalness, 0.2)),
    kitMaterialCache.set(src.uuid, mat),
    mat
  );
}
/** Caja envolvente de una pieza en su espacio local. */
function pieceBounds(name) {
  let box = new Box3();
  for (let part of pieceParts(name)) box.union(part.geo.boundingBox);
  return box;
}
/** Opciones de `worldMaterial` según el tipo de material (hojas, hierba, corteza). */
function finishFor(mat, opts = {}) {
  let name = mat.name || '',
    cfg = { ...opts };
  return (
    /^Leaves|^Leaf/.test(name)
      ? Object.assign(cfg, { wind: opts.wind ?? 0.22, upNormal: 0.45 })
      : /Grass|Flowers/.test(name)
        ? Object.assign(cfg, { wind: opts.wind ?? 0.06, upNormal: 0.8, contact: null })
        : /^Bark/.test(name) && Object.assign(cfg, { wind: opts.wind != null ? opts.wind * 0.35 : 0.06 }),
    cfg
  );
}
/**
 * Grupo de `InstancedMesh` (uno por parte) de la pieza `name` en las matrices dadas. Con
 * `opts.fade` añade el atributo `aFade` (en `group.userData.fade`) para fundir instancias.
 */
function instancePiece(name, matrices, opts = {}) {
  let group = new Group();
  if (((group.name = `inst:${name}`), !matrices.length)) return group;
  let parts = pieceParts(name),
    fades = opts.fade ? new Float32Array(matrices.length).fill(1) : null,
    fadeAttr = fades ? new InstancedBufferAttribute(fades, 1) : null;
  fadeAttr && fadeAttr.setUsage(DynamicDrawUsage);
  for (let part of parts) {
    let cfg = finishFor(part.mat, { fade: opts.fade ? 'instance' : null, ...(opts.finish || {}) }),
      mat = worldMaterial(part.mat, cfg),
      geo = part.geo.clone();
    fadeAttr && geo.setAttribute('aFade', fadeAttr);
    let mesh = new InstancedMesh(geo, mat, matrices.length);
    for (let k = 0; k < matrices.length; k++) mesh.setMatrixAt(k, matrices[k]);
    ((mesh.instanceMatrix.needsUpdate = !0),
      (mesh.castShadow = opts.cast ?? !0),
      (mesh.receiveShadow = opts.receive ?? !0),
      cfg.wind > 0 && mesh.castShadow && (mesh.customDepthMaterial = worldDepthMaterial(part.mat, cfg)),
      mesh.computeBoundingSphere(),
      mesh.computeBoundingBox(),
      group.add(mesh));
  }
  return ((group.userData.fade = fadeAttr), group);
}
/** ¿Es un material liso sin texturas, sustituible por el material de colores de vértice? */
function isFlatMaterial(mat) {
  return (
    !!mat &&
    mat.isMeshStandardMaterial &&
    !mat.map &&
    !mat.normalMap &&
    !mat.transparent &&
    !mat.alphaTest &&
    !(mat.emissiveIntensity > 0 && mat.emissive && mat.emissive.getHex() !== 0) &&
    !mat.userData?.window
  );
}
/** Matriz de posición (x, y, z), giro en Y y escala (número o Vector3). */
function composeMatrix(x, y, z, rotY = 0, scale = 1, out = new Matrix4()) {
  let quat = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), rotY),
    scl = typeof scale == 'number' ? new Vector3(scale, scale, scale) : scale;
  return out.compose(new Vector3(x, y, z), quat, scl);
}
/** Grupo de mallas sueltas (no fundidas) de una pieza, con sombras. */
function pieceMesh(name, opts = {}) {
  let group = new Group();
  group.name = name;
  for (let part of pieceParts(name)) {
    let mesh = new Mesh(part.geo, worldMaterial(part.mat, { ...finishFor(part.mat, {}), ...opts }));
    ((mesh.castShadow = !0), (mesh.receiveShadow = !0), group.add(mesh));
  }
  return group;
}
/** Sustituye la transmisión de los materiales de vidrio por transparencia simple. */
function fixGlass(root) {
  return (
    root.traverse((node) => {
      if (node.isMesh)
        for (let mat of Array.isArray(node.material) ? node.material : [node.material])
          mat.transmission > 0 &&
            ((mat.transmission = 0),
            (mat.transparent = !0),
            (mat.opacity = Math.min(mat.opacity, 0.45)),
            (mat.depthWrite = !1));
    }),
    root
  );
}
/** Archivos de cada kit. */
const KIT_FILES = {
  aldea: 'assets/world/aldea.json',
  naturaleza: 'assets/world/naturaleza.json',
  atrezo: 'assets/world/atrezo.json',
  mazmorra: 'assets/dungeon/mazmorra.json',
};
/** Tintes que se multiplican al color de algunos materiales del kit. */
const KIT_TINTS = {
  MI_Vine: 13623456,
  Leaves_NormalTree: 15265476,
  Leaves: 15790296,
  Leaves_Pine: 13162672,
  Bark_NormalTree: 13351080,
  Grass: 13819802,
  Rocks: 14078148,
  PathRocks: 14209216,
};
/** Kits cargados: nombre → Map(nombre de pieza → nodo). */
const kits = new Map();
const partsCache = new Map();
const kitMaterials = new Map();
const missingPieces = new Set();
const kitMaterialCache = new Map();
/** Materiales de colores de vértice que sustituyen a los lisos al fundir (`isFlatMaterial`). */
const flatMaterial = new MeshStandardMaterial({
  color: 16777215,
  roughness: 0.85,
  metalness: 0,
  vertexColors: !0,
});
flatMaterial.name = 'plano';
const flatMetalMaterial = new MeshStandardMaterial({
  color: 16777215,
  roughness: 0.45,
  metalness: 0.7,
  vertexColors: !0,
});
flatMetalMaterial.name = 'plano_metal';
/**
 * Acumula geometría estática por material y la funde en pocas mallas (`build`). Hornea en cada
 * vértice la AO de contacto (`aAO`, por altura sobre `groundAt`), el índice de edificio para el
 * fundido (`aBld`) y el tinte como color de vértice. `view(defaults)` da una vista con opciones fijas.
 */
const MeshMerger = class {
  constructor({
    fade = !1,
    contactH = 1,
    contactMin = 0.5,
    groundAt = null,
    cast = !0,
    finish = null,
    metal = !0,
  } = {}) {
    ((this.finish = finish),
      (this.metal = metal),
      (this.fade = fade),
      (this.contactH = contactH),
      (this.contactMin = contactMin),
      (this.groundAt = groundAt),
      (this.cast = cast),
      (this.byMat = new Map()));
  }
  add(name, matrix, opts = {}) {
    for (let part of pieceParts(name)) this.addGeometry(part.geo, part.mat, matrix, opts);
  }
  view(defaults) {
    return {
      add: (name, matrix, opts = {}) => this.add(name, matrix, { ...defaults, ...opts }),
      addGeometry: (geo, mat, matrix, opts = {}) =>
        this.addGeometry(geo, mat, matrix, { ...defaults, ...opts }),
    };
  }
  addGeometry(geo, mat, matrix, opts = {}) {
    let copy = geo.clone();
    if ((copy.applyMatrix4(matrix), matrix.determinant() < 0 && copy.index)) {
      let idx = copy.index.array;
      for (let j = 0; j < idx.length; j += 3) [idx[j + 1], idx[j + 2]] = [idx[j + 2], idx[j + 1]];
    }
    let pos = copy.getAttribute('position'),
      count = pos.count,
      ao = new Float32Array(count),
      groundY = opts.groundY ?? 0,
      contactH = opts.contactH ?? this.contactH,
      contactMin = opts.contactMin ?? this.contactMin;
    for (let k = 0; k < count; k++) {
      let height = pos.getY(k) - (this.groundAt ? this.groundAt(pos.getX(k), pos.getZ(k)) : groundY),
        ramp = Math.min(1, Math.max(0, height / contactH));
      ao[k] = contactMin + (1 - contactMin) * (ramp * ramp * (3 - 2 * ramp));
    }
    (copy.setAttribute('aAO', new BufferAttribute(ao, 1)),
      this.fade &&
        copy.setAttribute(
          'aBld',
          new BufferAttribute(new Float32Array(count).fill((opts.bld ?? 0) + (opts.roof ? 0.5 : 0)), 1),
        ));
    let baseColor = null,
      hasColors = !!mat.vertexColors;
    isFlatMaterial(mat) &&
      ((baseColor = mat.color), (mat = this.metal && mat.metalness > 0.4 ? flatMetalMaterial : flatMaterial));
    let tint = opts.tints?.[mat.name] || opts.tint || baseColor || null,
      srcColors = hasColors && copy.getAttribute('color'),
      colors = new Float32Array(count * 3).fill(1);
    if (srcColors) {
      let src = copy.getAttribute('color');
      for (let j = 0; j < count; j++)
        ((colors[j * 3] = src.getX(j)), (colors[j * 3 + 1] = src.getY(j)), (colors[j * 3 + 2] = src.getZ(j)));
    }
    if (tint)
      for (let k = 0; k < count; k++)
        ((colors[k * 3] *= tint.r), (colors[k * 3 + 1] *= tint.g), (colors[k * 3 + 2] *= tint.b));
    copy.setAttribute('color', new BufferAttribute(colors, 3));
    let key = mat.uuid + (opts.matKey || '');
    (this.byMat.has(key) || this.byMat.set(key, { mat, geos: [], cast: opts.cast ?? this.cast }),
      this.byMat.get(key).geos.push((copy.index, copy)));
  }
  build(name = 'fundido') {
    let group = new Group();
    group.name = name;
    for (let [, { mat, geos, cast }] of this.byMat) {
      let list = geos.every((g) => g.index) ? geos : geos.map((g) => (g.index ? g.toNonIndexed() : g)),
        merged = mergeGeometries(list, !1);
      if (!merged) continue;
      let mesh = new Mesh(
        merged,
        worldMaterial(mat, {
          ...finishFor(mat, {}),
          ...(this.finish || {}),
          contact: 'attr',
          fade: this.fade ? 'building' : null,
          vcol: !0,
        }),
      );
      ((mesh.castShadow = cast),
        (mesh.receiveShadow = !0),
        (mesh.name = mat.name),
        merged.computeBoundingSphere(),
        group.add(mesh));
    }
    return group;
  }
};

export {
  instancePiece,
  fixGlass,
  isFlatMaterial,
  loadKits,
  pieceParts,
  MeshMerger,
  pieceMesh,
  hasPiece,
  pieceBounds,
  composeMatrix,
};
