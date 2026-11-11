// actors/sculpt.js
// Reconstruido de publicado/juego.js (módulo __esm «Of»).
//
// Escultura procedural de cabezas y apéndices. makeHeadSculpt devuelve un deformador de vértices
// (orejas, rasgos de cara, nariz, mandíbula, hocico, cráneo) que rig.js aplica al hornear la malla
// de cada humanoide. El resto crea geometría: cuernos, colmillos, gorgueras, colas, peinados
// (coleta, trenza, cresta) y tubos con radio variable; tailWeights/hairWeights dan los pesos de
// hueso para pielarlos. Lo usan humanoid.js, beasts.js y monster-parts.js.

import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Quaternion,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { paint, mergeParts, mat } from './geometry.js';

/**
 * Deformador de la cabeza según `head` ({ears, face, nose, jaw, snout, skullScale}) o null si no
 * cambia nada. Firma: (pos, normal, weight, center, part): mueve `pos` (mundo) con peso `weight`
 * (peso del hueso Head) respecto al centro de la cabeza; `part.hair` indica que es pelo.
 */
function makeHeadSculpt(head) {
  let deformers = [],
    ears = head.ears;
  if (ears && ears.len > 0) {
    let dir = new Vector3(...ears.dir).normalize();
    deformers.push((p, part) => {
      if (part.hair) return;
      let ax = Math.abs(p.x),
        mask = smoothstep(0.071, 0.088, ax) * band(p.y, 0.045, 0.135, 0.02) * band(p.z, -0.06, 0.035, 0.015);
      if (!mask) return;
      let rise = smoothstep(ears.from ?? 0.065, 0.13, p.y),
        amount = mask * (0.25 + 0.75 * rise) * ears.len;
      ((p.x += Math.sign(p.x) * dir.x * amount), (p.y += dir.y * amount), (p.z += dir.z * amount));
    });
  }
  let face = head.face || 0;
  if (
    (face === 1
      ? deformers.push((p) => {
          let mask = band(p.x, -0.022, 0.022, 0.01) * band(p.y, 0.015, 0.085) * smoothstep(0.08, 0.11, p.z);
          ((p.z += mask * 0.012),
            (p.y -= mask * 0.004),
            p.y < 0.04 && p.z > 0 && (p.x *= 1 - 0.06 * smoothstep(0.04, -0.03, p.y)));
        })
      : face === 2
        ? deformers.push((p) => {
            let mask = smoothstep(0.04, -0.02, p.y) * smoothstep(-0.02, 0.04, p.z);
            ((p.x *= 1 + mask * 0.09), (p.z += mask * smoothstep(0.06, 0.1, p.z) * 0.01));
          })
        : face === 3 &&
          deformers.push((p) => {
            let cheeks =
              band(Math.abs(p.x), 0.035, 0.075) * band(p.y, 0.04, 0.085) * smoothstep(0.02, 0.06, p.z);
            p.x *= 1 + cheeks * 0.07;
            let bridge = band(p.x, -0.02, 0.02, 0.01) * band(p.y, 0.015, 0.075) * smoothstep(0.09, 0.12, p.z);
            p.z -= bridge * 0.008;
          }),
    head.nose)
  ) {
    let { len = 0, wide = 0, drop = 0 } = head.nose;
    deformers.push((p) => {
      let mask =
        band(p.x, -0.026, 0.026, 0.012) * band(p.y, 0.01, 0.085, 0.012) * smoothstep(0.075, 0.115, p.z);
      if (!mask) return;
      let tip = smoothstep(0.1, 0.13, p.z);
      ((p.z += mask * len * (0.4 + 0.6 * tip)), (p.y -= mask * drop * tip), (p.x *= 1 + mask * wide));
    });
  }
  if (head.jaw) {
    let { wide = 0, fwd = 0, brow = 0 } = head.jaw;
    deformers.push((p) => {
      let mask = smoothstep(0.045, -0.02, p.y) * smoothstep(-0.03, 0.03, p.z);
      ((p.x *= 1 + mask * wide), (p.z += mask * fwd * smoothstep(0, 0.08, p.z)));
      let browMask = band(p.y, 0.105, 0.14, 0.012) * smoothstep(0.04, 0.085, p.z);
      p.z += browMask * brow;
    });
  }
  if (head.snout) {
    let snout = head.snout;
    deformers.push((p, part) => {
      let mask =
        smoothstep(0, 0.085, p.z) *
        band(p.y, -0.07, 0.085, 0.03) *
        (1 - smoothstep(0.045, 0.085, Math.abs(p.x)) * 0.6);
      ((p.z += mask * snout), (p.y -= mask * snout * 0.12), (p.x *= 1 - mask * 0.22));
      let browMask = band(p.y, 0.105, 0.14, 0.012) * smoothstep(0.04, 0.085, p.z);
      if (((p.z += browMask * 0.012), p.y > 0.15 && (p.y = 0.15 + (p.y - 0.15) * 0.85), !part.hair)) {
        let sides = smoothstep(0.07, 0.09, Math.abs(p.x)) * band(p.y, 0.04, 0.14);
        p.x -= Math.sign(p.x) * sides * 0.012;
      }
    });
  }
  if (head.skullScale) {
    let scale = head.skullScale;
    deformers.push((p) => {
      ((p.x *= scale[0]), (p.y *= scale[1]), (p.z *= scale[2]));
    });
  }
  if (!deformers.length) return null;
  let local = new Vector3();
  return (pos, normal, weight, center, part) => {
    if (weight <= 0.001) return;
    local.copy(pos).sub(center);
    let before = local.clone();
    for (let deform of deformers) deform(local, part);
    pos.addScaledVector(local.sub(before), weight);
  };
}
/** Tubo a lo largo de una curva Catmull-Rom con radio de r0 a r1 (y tapa final si `closed`). */
function taperedTube(points, r0, r1, { radial = 7, segs = 14, closed = !0, flat = 1 } = {}) {
  let curve = new CatmullRomCurve3(points),
    frames = curve.computeFrenetFrames(segs, !1),
    verts = [],
    index = [];
  for (let i = 0; i <= segs; i++) {
    let t = i / segs,
      center = curve.getPointAt(t),
      radius = r0 + (r1 - r0) * t,
      normal = frames.normals[i],
      binormal = frames.binormals[i];
    for (let j = 0; j < radial; j++) {
      let ang = (j / radial) * Math.PI * 2,
        pt = center
          .clone()
          .addScaledVector(normal, Math.cos(ang) * radius)
          .addScaledVector(binormal, Math.sin(ang) * radius * flat);
      verts.push(pt.x, pt.y, pt.z);
    }
  }
  for (let i = 0; i < segs; i++)
    for (let j = 0; j < radial; j++) {
      let a = i * radial + j,
        b = i * radial + ((j + 1) % radial),
        c = (i + 1) * radial + j,
        d = (i + 1) * radial + ((j + 1) % radial);
      index.push(a, c, b, b, c, d);
    }
  if (closed) {
    let tip = curve.getPointAt(1),
      tipIndex = verts.length / 3;
    verts.push(tip.x, tip.y, tip.z);
    for (let j = 0; j < radial; j++)
      index.push(segs * radial + j, tipIndex, segs * radial + ((j + 1) % radial));
  }
  let geo = new BufferGeometry();
  return (
    geo.setAttribute('position', new Float32BufferAttribute(verts, 3)),
    geo.setIndex(index),
    geo.computeVertexNormals(),
    geo
  );
}
/** Par de cuernos: «carnero», «rectos», «toro», «atras» o curvos por defecto. */
function hornsGeometry(kind, color, scale = 1) {
  let parts = [];
  for (let side of [-1, 1]) {
    let pts,
      radius = 0.018;
    kind === 'carnero'
      ? ((pts = [
          vec3(side * 0.05, 0.16, 0.04),
          vec3(side * 0.09, 0.19, -0.02),
          vec3(side * 0.12, 0.14, -0.07),
          vec3(side * 0.115, 0.07, -0.03),
          vec3(side * 0.1, 0.07, 0.03),
          vec3(side * 0.12, 0.11, 0.05),
        ]),
        (radius = 0.024))
      : kind === 'rectos'
        ? (pts = [
            vec3(side * 0.04, 0.17, 0.05),
            vec3(side * 0.05, 0.23, 0.06),
            vec3(side * 0.055, 0.29, 0.05),
            vec3(side * 0.05, 0.33, 0.03),
          ])
        : kind === 'toro'
          ? ((pts = [
              vec3(side * 0.09, 0.16, 0),
              vec3(side * 0.17, 0.17, 0.02),
              vec3(side * 0.23, 0.21, 0.07),
              vec3(side * 0.24, 0.28, 0.12),
            ]),
            (radius = 0.026))
          : kind === 'atras'
            ? ((pts = [
                vec3(side * 0.045, 0.17, 0.05),
                vec3(side * 0.06, 0.2, -0.02),
                vec3(side * 0.065, 0.2, -0.1),
                vec3(side * 0.06, 0.17, -0.17),
              ]),
              (radius = 0.02))
            : (pts = [
                vec3(side * 0.04, 0.17, 0.05),
                vec3(side * 0.08, 0.22, 0.03),
                vec3(side * 0.11, 0.25, -0.03),
                vec3(side * 0.1, 0.29, -0.07),
              ]);
    let geo = taperedTube(
      pts.map((p) => p.multiplyScalar(1)),
      radius * scale,
      0.002,
      { radial: 7, segs: 12 },
    );
    if (scale !== 1) {
      let root = pts[0];
      (geo.translate(-root.x, -root.y, -root.z),
        geo.scale(scale, scale, scale),
        geo.translate(root.x, root.y, root.z));
    }
    parts.push(paint(geo, { color, vary: 0.08 }));
    for (let k = 1; k < 3; k++) {
      let t = k / 4,
        point = new CatmullRomCurve3(pts).getPointAt(t);
    }
  }
  return mergeParts(parts);
}
/** Colmillos inferiores («grandes» o pequeños). */
function tusksGeometry(size) {
  let big = size === 'grandes',
    parts = [];
  for (let side of [-1, 1]) {
    let cone = new ConeGeometry(big ? 0.0075 : 0.005, big ? 0.032 : 0.02, 6);
    parts.push(
      paint(cone, {
        color: '#efe6cc',
        matrix: mat.mul(mat.T(side * 0.024, big ? 0.008 : 0.004, 0.096), mat.R(-12, 0, side * -12)),
      }),
    );
  }
  return mergeParts(parts);
}
/** Cresta de púas en el cráneo («cresta») o gorguera a los lados («gola»). */
function frillGeometry(kind, color) {
  let parts = [];
  if (kind === 'cresta')
    for (let k = 0; k < 6; k++) {
      let ang = 0.4 + k * 0.28,
        y = 0.08 + Math.sin(ang) * 0.13,
        z = Math.cos(ang) * 0.1 - 0.02,
        len = 0.05 - k * 0.004;
      parts.push(
        paint(new ConeGeometry(0.012, len, 4), {
          color,
          matrix: mat.mul(
            mat.T(0, y, z),
            mat.R(-Math.cos(ang) * 60 - 40, 0, 0),
            mat.T(0, len / 2, 0),
            mat.S(0.5, 1, 1.6),
          ),
        }),
      );
    }
  else if (kind === 'gola')
    for (let side of [-1, 1])
      for (let k = 0; k < 4; k++)
        parts.push(
          paint(new ConeGeometry(0.01, 0.07 - k * 0.008, 4), {
            color,
            matrix: mat.mul(
              mat.T(side * 0.07, 0.03 + k * 0.03, -0.04),
              mat.R(0, 0, side * -(70 + k * 8)),
              mat.R(-25, 0, 0),
              mat.T(0, 0.03, 0),
              mat.S(0.4, 1, 1.4),
            ),
          }),
        );
  return mergeParts(parts);
}
/** Cola que nace en `base` (pelvis) con longitud relativa y punta de flecha opcional. */
function tailGeometry(base, color, { length = 1, tip = !0 } = {}) {
  let b = base,
    len = length,
    pts = [
      vec3(b.x, b.y - 0.02, b.z - 0.11),
      vec3(b.x, b.y - 0.18 * len, b.z - 0.26 * len),
      vec3(b.x + 0.1 * len, b.y - 0.5 * len, b.z - 0.36 * len),
      vec3(b.x + 0.04, b.y - 0.78 * len, b.z - 0.32 * len),
      vec3(b.x - 0.08 * len, b.y - 0.86 * len, b.z - 0.2 * len),
    ],
    parts = [paint(taperedTube(pts, 0.03, 0.008, { radial: 7, segs: 18, closed: !1 }), { color })];
  if (tip) {
    let end = pts[pts.length - 1],
      shape = new Shape();
    (shape.moveTo(0, -0.01), shape.lineTo(0.035, 0.03), shape.lineTo(0, 0.08), shape.lineTo(-0.035, 0.03));
    let tipGeo = new ExtrudeGeometry(shape, { depth: 0.008, bevelEnabled: !1 });
    parts.push(paint(tipGeo, { color, matrix: mat.mul(mat.T(end.x, end.y, end.z), mat.R(0, 60, 100)) }));
  }
  return mergeParts(parts);
}
/** Pesos de hueso de la cola: pelvis y muslos según la caída desde baseY. */
function tailWeights(baseY) {
  return (v) => {
    let k = Math.min(1, Math.max(0, (baseY - v.y) / 0.6));
    return [
      ['pelvis', 1 - k * 0.35],
      ['thigh_l', k * 0.2],
      ['thigh_r', k * 0.15],
    ];
  };
}
/** UV cilíndricas en la zona de pelo del atlas, a lo largo de `axis` («y» o «z»). */
function cylindricalUv(geo, axis = 'y') {
  let pos = geo.attributes.position;
  geo.computeBoundingBox();
  let box = geo.boundingBox,
    uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    let v =
        axis === 'y'
          ? (pos.getY(i) - box.min.y) / Math.max(1e-4, box.max.y - box.min.y)
          : (pos.getZ(i) - box.min.z) / Math.max(1e-4, box.max.z - box.min.z),
      u = (Math.atan2(pos.getX(i), pos.getZ(i) + 0.001) / Math.PI) * 0.5 + 0.5;
    ((uvs[i * 2] = 0.06 + u * 0.36), (uvs[i * 2 + 1] = 0.08 + v * 0.34));
  }
  return (geo.setAttribute('uv', new BufferAttribute(uvs, 2)), geo);
}
/** Coleta con su lazo. */
function ponytailGeometry(len = 1) {
  let pts = [
      vec3(0, 0.15, -0.085),
      vec3(0, 0.13, -0.135),
      vec3(0, 0.06, -0.15),
      vec3(0, -0.04, -0.14),
      vec3(0, -0.12 * len, -0.12),
    ],
    tail = taperedTube(pts, 0.03, 0.012, { radial: 8, segs: 14 }).toNonIndexed(),
    tie = new TorusGeometry(0.022, 0.007, 5, 10).toNonIndexed();
  return (
    tie.rotateX(Math.PI / 2 - 0.3),
    tie.translate(0, 0.125, -0.135),
    mergeWithUv([cylindricalUv(tail), cylindricalUv(tie)])
  );
}
/** Trenza de cuentas alternas con lazo final; `len` alarga el número de cuentas. */
function braidGeometry(len = 1) {
  let parts = [],
    count = Math.round(9 * len);
  for (let k = 0; k < count; k++) {
    let f = k / (count - 1),
      y = 0.12 - f * 0.38 * len,
      z = -0.1 - Math.sin(f * Math.PI * 0.6) * 0.06 - f * 0.03,
      radius = 0.024 - f * 0.008,
      bead = new SphereGeometry(radius, 7, 5).toNonIndexed();
    (bead.scale(1, 1.5, 0.85),
      bead.rotateZ((k % 2 ? 1 : -1) * 0.5),
      bead.translate((k % 2 ? 1 : -1) * 0.004, y, z),
      parts.push(cylindricalUv(bead)));
  }
  let tie = new TorusGeometry(0.014, 0.005, 5, 10).toNonIndexed();
  return (
    tie.rotateX(Math.PI / 2),
    tie.translate(0, 0.12 - 0.36 * len, -0.1 - 0.06 * Math.sin(Math.PI * 0.6) - 0.03),
    parts.push(cylindricalUv(tie)),
    mergeWithUv(parts)
  );
}
/** Cresta de pelo de púas. */
function mohawkGeometry() {
  let parts = [];
  for (let k = 0; k < 9; k++) {
    let ang = -0.2 + k * 0.33,
      y = 0.1 + Math.cos(ang - 0.6) * 0.115,
      z = Math.sin(ang - 0.6) * -0.11 + 0.01,
      len = 0.06 + Math.sin((k / 8) * Math.PI) * 0.03,
      spike = new ConeGeometry(0.018, len, 5).toNonIndexed();
    spike.scale(0.5, 1, 1.6);
    let dir = vec3(0, y - 0.06, z).normalize();
    (spike.applyQuaternion(new Quaternion().setFromUnitVectors(vec3(0, 1, 0), dir)),
      spike.translate(0, y + dir.y * len * 0.4, z + dir.z * len * 0.4),
      parts.push(cylindricalUv(spike)));
  }
  return mergeWithUv(parts);
}
/** Une geometrías no indexadas con posición, normal y uv en una sola. */
function mergeWithUv(geos) {
  let pos = [],
    normals = [],
    uvs = [];
  for (let g of geos)
    (g.attributes.normal || g.computeVertexNormals(),
      pos.push(...g.attributes.position.array),
      normals.push(...g.attributes.normal.array),
      uvs.push(...g.attributes.uv.array));
  let geo = new BufferGeometry();
  return (
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3)),
    geo.setAttribute('normal', new Float32BufferAttribute(normals, 3)),
    geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2)),
    geo
  );
}
/** Pesos de hueso del pelo largo: cabeza y, por debajo, cuello y columna. */
function hairWeights(headY) {
  return (v) => {
    let k = Math.min(1, Math.max(0, (headY + 0.08 - v.y) / 0.3));
    return [
      ['Head', 1 - k],
      ['neck_01', k * 0.4],
      ['spine_03', k * 0.6],
    ];
  };
}
/** smoothstep de GLSL. */
const smoothstep = (e0, e1, x) => {
  let t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
/** Ventana suave: 1 entre lo y hi, con bordes de anchura `soft`. */
const band = (x, lo, hi, soft = 0.015) => smoothstep(lo - soft, lo, x) * (1 - smoothstep(hi, hi + soft, x));
const vec3 = (x, y, z) => new Vector3(x, y, z);

export {
  tailWeights,
  frillGeometry,
  hairWeights,
  hornsGeometry,
  makeHeadSculpt,
  tusksGeometry,
  tailGeometry,
  braidGeometry,
  taperedTube,
  mohawkGeometry,
  ponytailGeometry,
};
