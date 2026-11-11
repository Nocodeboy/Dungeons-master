// actors/monster-parts.js
// Reconstruido de publicado/juego.js (módulo __esm «X2»).
//
// Piezas de los no muertos: carga assets/monsters/piezas.json (cráneos, mandíbula, ojos y piezas
// sueltas «kk_*» de KayKit), construye el esqueleto visible hueso a hueso sobre el esqueleto del
// humanoide (skeletonParts) y los harapos (ragsGeometry). Lo usa humanoid.js para la familia
// `undead` y la ropa `gear.rags`.

import {
  BoxGeometry,
  BufferAttribute,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  LatheGeometry,
  Matrix4,
  Quaternion,
  SphereGeometry,
  Vector2,
  Vector3,
} from 'three';
import { loadGLTF } from '../assets.js';
import { paint, mergeParts, mat } from './geometry.js';
import { taperedTube } from './sculpt.js';

/** Copia de la geometría con todos los atributos en Float32 sin normalizar (para poder fundirla). */
function toFloatAttributes(geo) {
  let out = geo.clone();
  for (let [name, attr] of Object.entries(out.attributes)) {
    if (attr.array instanceof Float32Array && !attr.normalized && !attr.isInterleavedBufferAttribute)
      continue;
    let count = attr.count,
      size = attr.itemSize,
      arr = new Float32Array(count * size),
      getters = [attr.getX, attr.getY, attr.getZ, attr.getW];
    for (let i = 0; i < count; i++)
      for (let j = 0; j < size; j++) arr[i * size + j] = getters[j].call(attr, i);
    out.setAttribute(name, new BufferAttribute(arr, size));
  }
  return out;
}
/** Carga (una vez) piezas.json: Map(nombre → geometría en mundo) con `headScale` según el cráneo. */
function loadMonsterPieces() {
  return (
    piecesPromise ||
      (piecesPromise = loadGLTF('assets/monsters/piezas.json').then((gltf) => {
        let pieces = new Map();
        (gltf.scene.updateMatrixWorld(!0),
          gltf.scene.traverse((obj) => {
            if (obj.isMesh) {
              let geo = toFloatAttributes(obj.geometry);
              (geo.applyMatrix4(obj.matrixWorld), pieces.set(obj.name, geo));
            }
          }));
        let skull = pieces.get('kk_craneo');
        return (
          skull &&
            (skull.computeBoundingBox(),
            (pieces.headScale = 0.17 / (skull.boundingBox.max.x - skull.boundingBox.min.x))),
          pieces
        );
      })),
    piecesPromise
  );
}
/** Geometría lista para el material de equipo de la pieza `name` (escala, matriz, metal, brillo, tinte). */
function pieceGeometry(pieces, name, { scale = 1, matrix = null, metal = 0, glow = 0, tint = null } = {}) {
  let src = pieces.get(name);
  if (!src) return null;
  let geo = src.index ? src.toNonIndexed() : src.clone();
  (scale !== 1 && geo.scale(scale, scale, scale), matrix && geo.applyMatrix4(matrix));
  let count = geo.attributes.position.count;
  if (geo.attributes.color) {
    if (geo.attributes.color.itemSize === 4) {
      let rgba = geo.attributes.color,
        rgb = new Float32Array(count * 3);
      for (let k = 0; k < count; k++) rgb.set([rgba.getX(k), rgba.getY(k), rgba.getZ(k)], k * 3);
      geo.setAttribute('color', new BufferAttribute(rgb, 3));
    }
  } else {
    let colors = new Float32Array(count * 3).fill(0.8);
    geo.setAttribute('color', new BufferAttribute(colors, 3));
  }
  if (tint) {
    let tintColor = new Color(tint),
      col = geo.attributes.color;
    for (let k = 0; k < count; k++)
      col.setXYZ(k, col.getX(k) * tintColor.r, col.getY(k) * tintColor.g, col.getZ(k) * tintColor.b);
  }
  let metals = new Float32Array(count * 2);
  for (let k = 0; k < count; k++) metals.set([metal, glow], k * 2);
  geo.setAttribute('metal', new BufferAttribute(metals, 2));
  for (let attr of Object.keys(geo.attributes))
    ['position', 'normal', 'color', 'metal'].includes(attr) || geo.deleteAttribute(attr);
  return geo;
}
/** Hueso torneado entre dos puntos con cabezas de `knob` × radio (palito simple si es muy fino). */
function boneGeometry(from, to, radius, color, { knob = 1.7, flat = 1 } = {}) {
  let len = from.distanceTo(to);
  if (radius < 0.0065) {
    let lathe = new LatheGeometry(
        [
          new Vector2(1e-4, 0),
          new Vector2(radius * 1.4, len * 0.12),
          new Vector2(radius * 0.9, len * 0.5),
          new Vector2(radius * 1.4, len * 0.88),
          new Vector2(1e-4, len),
        ],
        4,
      ),
      rot = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), to.clone().sub(from).normalize());
    return (
      lathe.applyMatrix4(new Matrix4().compose(from, rot, new Vector3(1, 1, 1))),
      paint(lathe, { color, vary: 0.12 })
    );
  }
  let profile = [
      new Vector2(1e-4, 0),
      new Vector2(radius * knob * 0.9, len * 0.02),
      new Vector2(radius * knob, len * 0.07),
      new Vector2(radius * 1.05, len * 0.18),
      new Vector2(radius * 0.85, len * 0.5),
      new Vector2(radius * 1.05, len * 0.82),
      new Vector2(radius * knob, len * 0.93),
      new Vector2(radius * knob * 0.85, len * 0.985),
      new Vector2(1e-4, len),
    ],
    lathe = new LatheGeometry(profile, 7);
  lathe.scale(1, 1, flat);
  let rot = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), to.clone().sub(from).normalize());
  return (
    lathe.applyMatrix4(new Matrix4().compose(from, rot, new Vector3(1, 1, 1))),
    paint(lathe, { color, vary: 0.12 })
  );
}
/**
 * Esqueleto visible sobre los huesos de animación `srcBones`: brazos, manos, piernas, pies,
 * columna, pelvis, costillas, esternón y, con `opts.pieces`, cráneo, mandíbula y ojos. Devuelve
 * [{geometry, bone}] para bakeSkinnedMeshes.
 */
function skeletonParts(srcBones, opts = {}) {
  let posOf = (name) => srcBones.get(name).getWorldPosition(new Vector3()),
    boneColor = new Color(opts.color || '#d8ccae'),
    darkColor = boneColor.clone().multiplyScalar(0.7),
    parts = [],
    add = (geometry, bone) => geometry && parts.push({ geometry, bone });
  for (let side of ['l', 'r']) {
    add(
      boneGeometry(posOf(`upperarm_${side}`), posOf(`lowerarm_${side}`), 0.017, boneColor),
      `upperarm_${side}`,
    );
    let elbow = posOf(`lowerarm_${side}`),
      wrist = posOf(`hand_${side}`),
      offset = new Vector3(0, 0, 0.011);
    (add(
      boneGeometry(elbow.clone().add(offset), wrist.clone().add(offset), 0.009, boneColor),
      `lowerarm_${side}`,
    ),
      add(
        boneGeometry(
          elbow.clone().sub(offset),
          wrist
            .clone()
            .sub(offset)
            .add(new Vector3(0, -0.006, 0)),
          0.008,
          darkColor,
        ),
        `lowerarm_${side}`,
      ),
      add(
        boneGeometry(
          posOf(`clavicle_${side}`).add(new Vector3(0, 0, 0.02)),
          posOf(`upperarm_${side}`).add(new Vector3(0, 0.01, 0.02)),
          0.009,
          boneColor,
          { knob: 1.4 },
        ),
        `clavicle_${side}`,
      ));
    let blade = posOf(`upperarm_${side}`)
      .lerp(posOf('spine_03'), 0.45)
      .add(new Vector3(0, -0.04, -0.09));
    add(
      paint(new CircleGeometry(0.06, 3), {
        color: darkColor,
        matrix: mat.mul(mat.T(blade.x, blade.y, blade.z), mat.R(0, 180, side === 'l' ? 15 : -15)),
      }),
      'spine_03',
    );
    for (let finger of ['index', 'middle', 'ring', 'pinky', 'thumb']) {
      let joints = [
        `${finger}_01_${side}`,
        `${finger}_02_${side}`,
        `${finger}_03_${side}`,
        `${finger}_04_leaf_${side}`,
      ].filter((name) => srcBones.has(name));
      add(
        boneGeometry(posOf(`hand_${side}`), posOf(joints[0]), 0.0045, boneColor, { knob: 1.3 }),
        `hand_${side}`,
      );
      for (let j = 0; j + 1 < joints.length; j++)
        add(boneGeometry(posOf(joints[j]), posOf(joints[j + 1]), 0.004, boneColor, { knob: 1.3 }), joints[j]);
    }
    add(boneGeometry(posOf(`thigh_${side}`), posOf(`calf_${side}`), 0.022, boneColor), `thigh_${side}`);
    let knee = posOf(`calf_${side}`),
      ankle = posOf(`foot_${side}`);
    (add(boneGeometry(knee, ankle, 0.017, boneColor), `calf_${side}`),
      add(
        boneGeometry(
          knee.clone().add(new Vector3(side === 'l' ? 0.02 : -0.02, -0.03, -0.01)),
          ankle.clone().add(new Vector3(side === 'l' ? 0.022 : -0.022, 0.02, -0.01)),
          0.007,
          darkColor,
        ),
        `calf_${side}`,
      ),
      add(
        paint(new SphereGeometry(0.022, 6, 4), {
          color: boneColor,
          matrix: mat.mul(mat.T(knee.x, knee.y + 0.01, knee.z + 0.035), mat.S(1, 1.2, 0.6)),
        }),
        `calf_${side}`,
      ));
    let ball = posOf(`ball_${side}`);
    for (let dx of [-0.025, -0.008, 0.008, 0.025])
      (add(
        boneGeometry(
          ankle.clone().add(new Vector3(dx * 0.5, -0.02, 0)),
          ball.clone().add(new Vector3(dx, 0, 0)),
          0.006,
          boneColor,
          {
            knob: 1.3,
          },
        ),
        `foot_${side}`,
      ),
        srcBones.has(`ball_leaf_${side}`) &&
          add(
            boneGeometry(
              ball.clone().add(new Vector3(dx, 0, 0)),
              posOf(`ball_leaf_${side}`).add(new Vector3(dx, 0.003, -0.02)),
              0.005,
              boneColor,
              { knob: 1.2 },
            ),
            `ball_${side}`,
          ));
    add(
      paint(new SphereGeometry(0.03, 6, 4), {
        color: boneColor,
        matrix: mat.mul(mat.T(ankle.x, ankle.y - 0.04, ankle.z - 0.035), mat.S(0.8, 0.7, 1.1)),
      }),
      `foot_${side}`,
    );
  }
  let chain = ['pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01', 'Head'];
  for (let k = 0; k + 1 < chain.length; k++) {
    let a = posOf(chain[k]),
      b = posOf(chain[k + 1]),
      count = chain[k] === 'neck_01' ? 3 : 4;
    for (let j = 0; j < count; j++) {
      let pos = a
          .clone()
          .lerp(b, (j + 0.5) / count)
          .add(new Vector3(0, 0, -0.03)),
        radius = chain[k].startsWith('neck') ? 0.014 : 0.019;
      (add(
        paint(new CylinderGeometry(radius, radius, 0.022, 7), {
          color: boneColor,
          matrix: mat.T(pos.x, pos.y, pos.z),
        }),
        chain[k],
      ),
        add(
          paint(new ConeGeometry(0.008, 0.035, 4), {
            color: darkColor,
            matrix: mat.mul(mat.T(pos.x, pos.y - 0.008, pos.z - 0.025), mat.R(-110, 0, 0)),
          }),
          chain[k],
        ));
    }
  }
  let pelvis = posOf('pelvis');
  for (let side of [-1, 1])
    (add(
      paint(new SphereGeometry(0.075, 8, 5, 0, Math.PI, 0, Math.PI * 0.75), {
        color: boneColor,
        matrix: mat.mul(
          mat.T(pelvis.x + side * 0.075, pelvis.y + 0.02, pelvis.z - 0.01),
          mat.R(0, side * 90 + 180, 0),
          mat.S(1, 0.85, 0.35),
        ),
      }),
      'pelvis',
    ),
      add(
        boneGeometry(
          new Vector3(pelvis.x + side * 0.03, pelvis.y - 0.06, pelvis.z + 0.04),
          new Vector3(pelvis.x + side * 0.09, pelvis.y - 0.03, pelvis.z + 0),
          0.012,
          boneColor,
          { knob: 1.2 },
        ),
        'pelvis',
      ));
  add(
    paint(new ConeGeometry(0.04, 0.11, 6), {
      color: darkColor,
      matrix: mat.mul(mat.T(pelvis.x, pelvis.y - 0.03, pelvis.z - 0.05), mat.R(180, 0, 0)),
    }),
    'pelvis',
  );
  let chest = posOf('spine_03'),
    spine2 = posOf('spine_02');
  for (let k = 0; k < 6; k++) {
    let f = k / 5,
      y = chest.y + 0.1 - f * 0.21,
      rx = 0.085 + Math.sin((f * 0.75 + 0.15) * Math.PI) * 0.055,
      rz = 0.075 + Math.sin((f * 0.8 + 0.1) * Math.PI) * 0.035,
      z = chest.z - 0.01,
      bone = y > chest.y - 0.02 ? 'spine_03' : 'spine_02';
    for (let side of [-1, 1]) {
      let pts = [];
      for (let j = 0; j <= 6; j++) {
        let ang = -Math.PI / 2 + (j / 6) * Math.PI * 0.92;
        pts.push(new Vector3(side * Math.cos(ang) * rx, y - j * 0.008 + (k > 3, 0), z + Math.sin(ang) * rz));
      }
      ((pts[0].z = z - rz * 0.75),
        (pts[0].x = side * 0.015),
        add(
          paint(taperedTube(pts, 0.007, 0.005, { radial: 5, segs: 8, closed: !1, flat: 0.6 }), {
            color: boneColor,
            vary: 0.1,
          }),
          bone,
        ));
    }
  }
  if (
    (add(
      paint(new BoxGeometry(0.03, 0.17, 0.012), {
        color: boneColor,
        matrix: mat.T(chest.x, chest.y - 0.02, chest.z + 0.1),
      }),
      'spine_03',
    ),
    opts.pieces)
  ) {
    let head = posOf('Head'),
      scale = (opts.pieces.headScale || 0.2) * (opts.headScale ?? 1),
      skullName = opts.skull === 'mago' ? 'kk_craneo_mago' : 'kk_craneo',
      matrix = mat.mul(mat.T(head.x, head.y - 0.055, head.z + 0.005), mat.S(scale));
    (add(
      pieceGeometry(opts.pieces, skullName, {
        matrix,
        tint: opts.color ? boneColor.clone().multiplyScalar(1.25) : null,
      }),
      'Head',
    ),
      add(
        pieceGeometry(opts.pieces, 'kk_mandibula', {
          matrix,
          tint: opts.color ? boneColor.clone().multiplyScalar(1.25) : null,
        }),
        'Head',
      ),
      add(pieceGeometry(opts.pieces, 'kk_ojos', { matrix, glow: 1, tint: opts.eyes || null }), 'Head'));
  }
  return parts;
}
/** Faldón de harapos con el borde dentado entre y0 y y1 alrededor de la pelvis. */
function ragsGeometry(srcBones, color, { y0, y1, w = 0.3 } = {}) {
  let pelvis = ((name) => srcBones.get(name).getWorldPosition(new Vector3()))('pelvis'),
    geo = new CylinderGeometry(0.14, 0.2, y0 - y1, 12, 4, !0);
  (geo.translate(0, (y0 + y1) / 2, pelvis.z - 0.01), geo.scale(1, 1, 0.8));
  let pos = geo.attributes.position;
  for (let k = 0; k < pos.count; k++) {
    let f = (y0 - pos.getY(k)) / (y0 - y1),
      ang = Math.atan2(pos.getZ(k), pos.getX(k));
    pos.setY(k, pos.getY(k) - Math.max(0, Math.sin(ang * 5) * 0.06 * f));
  }
  return (geo.computeVertexNormals(), mergeParts([paint(geo, { color, vary: 0.25 })]));
}
let piecesPromise = null;

export { skeletonParts, loadMonsterPieces, ragsGeometry, pieceGeometry };
