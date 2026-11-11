// actors/geometry.js
// Reconstruido de publicado/juego.js (módulo __esm «iu»).
//
// Geometría procedural del equipo visible de los personajes: armas, escudos, cascos y sombreros,
// armaduras, túnicas, capas, tabardos y accesorios. Todo se construye con primitivas de three,
// se «pinta» con atributos de vértice (color y metal/brillo, ver paint) y se fusiona en una sola
// BufferGeometry por pieza. También exporta `mat`, ayudantes de matrices (T, R en grados, S, mul).
// Lo usan humanoid.js (montaje del equipo), sculpt.js, monster-parts.js y beasts.js.

import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  ExtrudeGeometry,
  Float32BufferAttribute,
  MathUtils,
  Matrix4,
  OctahedronGeometry,
  PlaneGeometry,
  Quaternion,
  Shape,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Prepara una geometría para el material de personaje: la desindexa, aplica `matrix`, deja solo
 * posición y normal y añade los atributos `color` (con variación pseudoaleatoria `vary`) y
 * `metal` (metal, brillo). Devuelve la geometría resultante.
 */
function paint(geo, { color = 8947848, metal = 0, glow = 0, matrix = null, vary = 0 } = {}) {
  let out = geo.index ? geo.toNonIndexed() : geo;
  (matrix && out.applyMatrix4(matrix), out.attributes.normal || out.computeVertexNormals());
  for (let attr of Object.keys(out.attributes))
    ['position', 'normal'].includes(attr) || out.deleteAttribute(attr);
  let count = out.attributes.position.count,
    base = new Color(color),
    colors = new Float32Array(count * 3),
    metals = new Float32Array(count * 2);
  for (let v = 0; v < count; v++) {
    let shade = vary ? 1 + ((Math.sin(v * 12.9898) * 43758.5453) % 1) * vary : 1;
    (colors.set([base.r * shade, base.g * shade, base.b * shade], v * 3), metals.set([metal, glow], v * 2));
  }
  return (
    out.setAttribute('color', new BufferAttribute(colors, 3)),
    out.setAttribute('metal', new BufferAttribute(metals, 2)),
    out
  );
}
/** Fusiona las piezas no nulas (devuelve la única si hay una, o null si no hay ninguna). */
function mergeParts(parts) {
  let valid = parts.filter(Boolean);
  return valid.length ? (valid.length === 1 ? valid[0] : mergeGeometries(valid, !1)) : null;
}
/** Paleta del equipo según el aspecto: metales, maderas, cueros, telas (cloth1/cloth2), hueso y cuerda. */
function gearPalette(look) {
  let metal = new Color(look.metalColor || '#b8bec6');
  return {
    metal,
    metalDark: metal.clone().multiplyScalar(0.55),
    gold: new Color('#d4a63a'),
    wood: new Color('#6b4a2e'),
    woodDark: new Color('#3e2a1a'),
    leather: new Color('#4a3020'),
    leatherDark: new Color('#2a1c14'),
    cloth1: new Color(look.colors?.cloth1 || '#3f5f9a'),
    cloth2: new Color(look.colors?.cloth2 || '#c9b48a'),
    bone: new Color('#d8ccb0'),
    string: new Color('#d8d0b8'),
  };
}
/** Hoja extruida de longitud y anchura dadas, con curva, punta y estrechamiento opcionales. */
function bladeGeometry(len, width, { curve = 0, thick = 0.012, point = 0.18, taper = 0.35 } = {}) {
  let shape = new Shape(),
    steps = 8,
    halfW = width / 2,
    edge = [];
  for (let k = 0; k <= steps; k++) {
    let f = k / steps,
      y = f * len * (1 - point),
      w = halfW * (1 - f * taper);
    edge.push([y, w]);
  }
  let bend = (y) => curve * (y / len) * (y / len) * len;
  shape.moveTo(-halfW + bend(0), 0);
  for (let [y, w] of edge) shape.lineTo(-w + bend(y), y);
  shape.lineTo(bend(len) + (curve ? halfW * 0.4 : 0), len);
  for (let k = edge.length - 1; k >= 0; k--) shape.lineTo(edge[k][1] + bend(edge[k][0]), edge[k][0]);
  let geo = new ExtrudeGeometry(shape, {
    depth: thick,
    bevelEnabled: !0,
    bevelThickness: thick * 0.45,
    bevelSize: Math.min(width * 0.18, 0.008),
    bevelSegments: 1,
    curveSegments: 4,
  });
  return (geo.translate(0, 0, -thick / 2), geo);
}
/** Cilindro cerrado de un solo anillo de altura. */
function cylinder(rTop, rBottom, height, segs = 8) {
  return new CylinderGeometry(rTop, rBottom, height, segs, 1);
}
/**
 * Geometría de un arma u objeto de mano por su id de reglas (longsword, greataxe, shortbow,
 * arcane_staff, mug, holy_symbol…), con la empuñadura en el origen. null si no se conoce.
 */
function weaponGeometry(id, palette) {
  let pal = palette,
    grip = (len = 0.12, r = 0.016) => paint(cylinder(r, r * 1.05, len, 8), { color: pal.leatherDark }),
    pommel = (y, r = 0.024) =>
      paint(new SphereGeometry(r, 8, 6), { color: pal.metal, metal: 1, matrix: mat.T(0, y, 0) }),
    guard = (width, y, height = 0.025) =>
      paint(new BoxGeometry(width, height, 0.03), { color: pal.metal, metal: 1, matrix: mat.T(0, y, 0) }),
    haft = (len, r = 0.017, bottom = -0.15) =>
      paint(cylinder(r * 0.9, r, len, 8), { color: pal.wood, matrix: mat.T(0, bottom + len / 2, 0) }),
    metal = (geo, matrix) => paint(geo, { color: pal.metal, metal: 1, matrix }),
    shiftDown = (geo, dy = 0.34) => geo.translate(0, -dy, 0);
  switch (id) {
    case 'longsword':
    case 'shortsword':
    case 'greatsword':
    case 'dagger': {
      let bladeLen = { longsword: 0.82, shortsword: 0.55, greatsword: 1.15, dagger: 0.24 }[id],
        bladeWidth = { longsword: 0.05, shortsword: 0.048, greatsword: 0.065, dagger: 0.034 }[id],
        hiltLen = id === 'greatsword' ? 0.26 : id === 'dagger' ? 0.09 : 0.13;
      return mergeParts([
        metal(bladeGeometry(bladeLen, bladeWidth, { point: 0.14 }), mat.T(0, hiltLen / 2 + 0.02, 0)),
        guard(id === 'dagger' ? 0.07 : bladeWidth * 3.6, hiltLen / 2 + 0.012),
        paint(cylinder(0.016, 0.017, hiltLen, 8), { color: pal.leatherDark }),
        pommel(-hiltLen / 2 - 0.012, id === 'dagger' ? 0.016 : 0.022),
      ]);
    }
    case 'rapier':
      return mergeParts([
        metal(bladeGeometry(0.9, 0.022, { point: 0.08, taper: 0.5, thick: 0.008 }), mat.T(0, 0.08, 0)),
        metal(new SphereGeometry(0.05, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.2), mat.T(0, 0.075, 0)),
        metal(new TorusGeometry(0.045, 0.005, 4, 12, Math.PI), mat.mul(mat.T(0, 0.02, 0), mat.R(0, 90, 180))),
        grip(0.11, 0.014),
        pommel(-0.065, 0.018),
      ]);
    case 'scimitar':
      return mergeParts([
        metal(bladeGeometry(0.72, 0.055, { curve: 0.12, point: 0.1, taper: 0.1 }), mat.T(0, 0.08, 0)),
        guard(0.12, 0.068, 0.02),
        grip(0.12),
        pommel(-0.07, 0.02),
      ]);
    case 'sickle':
      return mergeParts([
        haft(0.3, 0.015, -0.12),
        metal(
          new TorusGeometry(0.13, 0.012, 3, 14, Math.PI * 1.1),
          mat.mul(mat.T(0.12, 0.2, 0), mat.R(0, 0, 10), mat.S(1, 1, 0.4)),
        ),
      ]);
    case 'handaxe':
    case 'battleaxe':
    case 'greataxe':
    case 'war_pick': {
      let haftLen = { handaxe: 0.45, battleaxe: 0.75, greataxe: 1.15, war_pick: 0.7 }[id],
        headY = haftLen - 0.2,
        headShape = new Shape();
      if (id === 'war_pick')
        (headShape.moveTo(-0.03, -0.03),
          headShape.lineTo(0.22, -0.01),
          headShape.lineTo(0.24, 0),
          headShape.lineTo(0.22, 0.012),
          headShape.lineTo(-0.03, 0.03));
      else {
        let bit = id === 'greataxe' ? 0.2 : id === 'battleaxe' ? 0.15 : 0.1;
        (headShape.moveTo(-0.02, -0.035),
          headShape.lineTo(bit * 0.55, -0.05),
          headShape.quadraticCurveTo(bit * 1.1, -bit * 0.9, bit * 1.15, -bit),
          headShape.quadraticCurveTo(bit * 1.35, 0, bit * 1.15, bit),
          headShape.quadraticCurveTo(bit * 1.1, bit * 0.9, bit * 0.55, 0.05),
          headShape.lineTo(-0.02, 0.035));
      }
      let headGeo = new ExtrudeGeometry(headShape, {
        depth: 0.018,
        bevelEnabled: !0,
        bevelThickness: 0.006,
        bevelSize: 0.006,
        bevelSegments: 1,
        curveSegments: 6,
      });
      headGeo.translate(0, 0, -0.009);
      let backHead = id === 'greataxe' ? headGeo.clone() : null,
        parts = [haft(haftLen, id === 'greataxe' ? 0.02 : 0.017), metal(headGeo, mat.T(0.015, headY, 0))];
      return (
        backHead && parts.push(metal(backHead, mat.mul(mat.T(-0.015, headY, 0), mat.R(0, 180, 0)))),
        parts.push(metal(cylinder(0.022, 0.022, 0.07, 8), mat.T(0, headY, 0))),
        mergeParts(parts)
      );
    }
    case 'mace':
    case 'morningstar':
    case 'light_hammer':
    case 'warhammer':
    case 'maul':
    case 'club':
    case 'greatclub': {
      let haftLen = {
        mace: 0.6,
        morningstar: 0.65,
        light_hammer: 0.42,
        warhammer: 0.72,
        maul: 1.15,
        club: 0.55,
        greatclub: 0.95,
      }[id];
      if (id === 'club' || id === 'greatclub') {
        let clubR = id === 'club' ? 0.04 : 0.065;
        return paint(cylinder(clubR, clubR * 0.45, haftLen, 7), {
          color: pal.wood,
          matrix: mat.T(0, haftLen / 2 - 0.12, 0),
          vary: 0.1,
        });
      }
      let headY = haftLen - 0.17,
        parts = [haft(haftLen, 0.016)];
      if (id === 'mace') {
        parts.push(metal(new SphereGeometry(0.045, 8, 6), mat.T(0, headY, 0)));
        for (let k = 0; k < 6; k++)
          parts.push(
            metal(new BoxGeometry(0.075, 0.09, 0.012), mat.mul(mat.T(0, headY, 0), mat.R(0, k * 30, 0))),
          );
      } else if (id === 'morningstar') {
        parts.push(metal(new SphereGeometry(0.06, 10, 8), mat.T(0, headY, 0)));
        let spikeDirs = [
          [1, 0, 0],
          [-1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
          [0, 0, -1],
          [0.7, 0.7, 0],
          [-0.7, 0.7, 0],
          [0, 0.7, 0.7],
          [0, 0.7, -0.7],
        ];
        for (let dir of spikeDirs) {
          let axis = new Vector3(...dir).normalize(),
            rot = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), axis);
          parts.push(
            metal(
              new ConeGeometry(0.014, 0.05, 5),
              new Matrix4().compose(
                axis
                  .clone()
                  .multiplyScalar(0.075)
                  .add(new Vector3(0, headY, 0)),
                rot,
                new Vector3(1, 1, 1),
              ),
            ),
          );
        }
      } else {
        let isMaul = id === 'maul',
          headW = isMaul ? 0.24 : id === 'warhammer' ? 0.16 : 0.12,
          headH = isMaul ? 0.1 : 0.06;
        (parts.push(metal(new BoxGeometry(headW, headH, headH), mat.T(0, headY, 0))),
          id === 'warhammer' &&
            parts.push(
              metal(new ConeGeometry(0.025, 0.1, 4), mat.mul(mat.T(-0.12, headY, 0), mat.R(0, 0, 90))),
            ));
      }
      return mergeParts(parts);
    }
    case 'flail':
      return mergeParts([
        haft(0.45, 0.016),
        ...[0, 1, 2, 3].map((k) =>
          metal(
            new TorusGeometry(0.014, 0.004, 4, 8),
            mat.mul(mat.T(0.02 * k, 0.32 + 0.025 * k, 0), mat.R(0, k % 2 ? 90 : 0, 30)),
          ),
        ),
        metal(new SphereGeometry(0.05, 8, 6), mat.T(0.1, 0.42, 0)),
      ]);
    case 'quarterstaff':
      return shiftDown(
        mergeParts([
          paint(cylinder(0.02, 0.022, 1.7, 8), { color: pal.wood, matrix: mat.T(0, 0.35, 0), vary: 0.08 }),
          metal(cylinder(0.025, 0.025, 0.06, 8), mat.T(0, 1.18, 0)),
          metal(cylinder(0.025, 0.025, 0.06, 8), mat.T(0, -0.48, 0)),
        ]),
      );
    case 'spear':
    case 'javelin':
    case 'glaive':
    case 'halberd': {
      let shaftLen = { spear: 1.9, javelin: 1.35, glaive: 2, halberd: 2.05 }[id],
        parts = [
          paint(cylinder(0.016, 0.018, shaftLen, 8), {
            color: pal.wood,
            matrix: mat.T(0, shaftLen / 2 - 0.45, 0),
          }),
        ],
        tipY = shaftLen - 0.45;
      if (
        ((id === 'spear' || id === 'javelin') &&
          parts.push(
            metal(
              bladeGeometry(id === 'spear' ? 0.26 : 0.18, 0.05, { point: 0.5, taper: 0.2 }),
              mat.T(0, tipY, 0),
            ),
          ),
        id === 'glaive' &&
          parts.push(
            metal(
              bladeGeometry(0.5, 0.07, { curve: 0.08, point: 0.25, taper: 0.1 }),
              mat.T(0, tipY - 0.05, 0),
            ),
          ),
        id === 'halberd')
      ) {
        parts.push(metal(bladeGeometry(0.3, 0.035, { point: 0.4 }), mat.T(0, tipY, 0)));
        let hookShape = new Shape();
        (hookShape.moveTo(0, -0.07),
          hookShape.quadraticCurveTo(0.18, -0.12, 0.2, -0.14),
          hookShape.quadraticCurveTo(0.26, 0, 0.2, 0.14),
          hookShape.quadraticCurveTo(0.18, 0.08, 0, 0.07));
        let hookGeo = new ExtrudeGeometry(hookShape, { depth: 0.014, bevelEnabled: !1, curveSegments: 6 });
        (hookGeo.translate(0, 0, -0.007),
          parts.push(metal(hookGeo, mat.T(0.01, tipY - 0.08, 0))),
          parts.push(
            metal(new ConeGeometry(0.02, 0.1, 4), mat.mul(mat.T(-0.06, tipY - 0.08, 0), mat.R(0, 0, 90))),
          ));
      }
      return mergeParts(parts);
    }
    case 'shortbow':
    case 'longbow':
      return bowGeometry(id === 'longbow' ? 1.55 : 1.05, pal);
    case 'light_crossbow':
    case 'heavy_crossbow':
    case 'hand_crossbow':
      return crossbowGeometry(id === 'heavy_crossbow' ? 1.25 : id === 'hand_crossbow' ? 0.55 : 0.95, pal);
    case 'dart':
      return mergeParts([
        paint(cylinder(0.004, 0.006, 0.18, 5), { color: pal.wood, matrix: mat.T(0, 0.05, 0) }),
        metal(new ConeGeometry(0.007, 0.05, 5), mat.T(0, 0.16, 0)),
      ]);
    case 'sling':
      return paint(new TorusGeometry(0.06, 0.006, 4, 10), {
        color: pal.leather,
        matrix: mat.mul(mat.T(0, -0.05, 0), mat.S(0.5, 1, 1)),
      });
    case 'wand':
      return mergeParts([
        paint(cylinder(0.008, 0.012, 0.3, 6), { color: pal.woodDark, matrix: mat.T(0, 0.08, 0) }),
        paint(new OctahedronGeometry(0.018), { color: '#9fd8ff', glow: 1, matrix: mat.T(0, 0.24, 0) }),
      ]);
    case 'arcane_staff':
      return shiftDown(
        mergeParts([
          paint(cylinder(0.018, 0.024, 1.75, 7), {
            color: pal.woodDark,
            matrix: mat.T(0, 0.38, 0),
            vary: 0.1,
          }),
          ...[0, 1, 2].map((k) =>
            paint(new ConeGeometry(0.014, 0.16, 4), {
              color: pal.woodDark,
              matrix: mat.mul(mat.T(0, 1.27, 0), mat.R(0, k * 120, 25), mat.T(0, 0.06, 0)),
            }),
          ),
          paint(new OctahedronGeometry(0.045), {
            color: '#8fd0ff',
            glow: 1,
            matrix: mat.mul(mat.T(0, 1.33, 0), mat.S(0.8, 1.3, 0.8)),
          }),
        ]),
      );
    case 'druid_staff':
      return shiftDown(
        mergeParts([
          paint(cylinder(0.02, 0.026, 1.7, 7), { color: '#5a4630', matrix: mat.T(0, 0.37, 0), vary: 0.12 }),
          paint(new TorusGeometry(0.07, 0.016, 5, 10, Math.PI * 1.4), {
            color: '#5a4630',
            matrix: mat.mul(mat.T(0, 1.27, 0), mat.R(0, 0, 120)),
          }),
          ...[0, 1, 2, 3, 4].map((k) =>
            paint(new SphereGeometry(0.03, 5, 4), {
              color: k % 2 ? '#4f7a32' : '#6a9a3a',
              matrix: mat.mul(
                mat.T(Math.cos(k * 1.3) * 0.06, 1.25 + (k % 3) * 0.04, Math.sin(k * 1.3) * 0.05),
                mat.S(1, 0.5, 1.6),
              ),
            }),
          ),
        ]),
      );
    case 'mug':
      return mergeParts([
        paint(cylinder(0.045, 0.04, 0.12, 10), { color: pal.wood, matrix: mat.T(0.02, 0, 0), vary: 0.08 }),
        paint(new TorusGeometry(0.046, 0.006, 4, 10), {
          color: pal.metalDark,
          metal: 1,
          matrix: mat.mul(mat.T(0.02, 0.04, 0), mat.R(90, 0, 0)),
        }),
        paint(new TorusGeometry(0.03, 0.008, 4, 8, Math.PI), {
          color: pal.wood,
          matrix: mat.mul(mat.T(-0.03, 0, 0), mat.R(0, 0, 90)),
        }),
        paint(new CircleGeometry(0.04, 10), {
          color: '#e8dcb0',
          matrix: mat.mul(mat.T(0.02, 0.058, 0), mat.R(-90, 0, 0)),
        }),
      ]);
    case 'crook':
      return shiftDown(
        mergeParts([
          paint(cylinder(0.016, 0.02, 1.55, 7), { color: '#6a5034', matrix: mat.T(0, 0.45, 0), vary: 0.1 }),
          paint(new TorusGeometry(0.08, 0.016, 5, 12, Math.PI * 1.2), {
            color: '#6a5034',
            matrix: mat.mul(mat.T(0.08, 1.22, 0), mat.R(0, 0, -10)),
          }),
        ]),
        0.28,
      );
    case 'holy_symbol':
      return mergeParts([
        paint(new CircleGeometry(0.05, 12), { color: pal.gold, metal: 1 }),
        paint(new TorusGeometry(0.05, 0.008, 4, 12), { color: pal.gold, metal: 1 }),
      ]);
    default:
      return null;
  }
}
/** Arco (pala curva, cuerda y empuñadura) de la longitud dada. */
function bowGeometry(len, pal) {
  let half = len / 2,
    curve = new CatmullRomCurve3([
      new Vector3(0, -half, -0.12),
      new Vector3(0, -half * 0.55, -0.02),
      new Vector3(0, 0, 0.04),
      new Vector3(0, half * 0.55, -0.02),
      new Vector3(0, half, -0.12),
    ]),
    limb = new TubeGeometry(curve, 16, 0.012, 5, !1),
    stringLine = new BufferGeometry().setFromPoints([
      new Vector3(0, -half, -0.12),
      new Vector3(0, half, -0.12),
    ]);
  return mergeParts([
    paint(limb, { color: pal.wood }),
    paint(cylinder(0.0022, 0.0022, len * 0.98, 3), { color: pal.string, matrix: mat.T(0, 0, -0.12) }),
    paint(cylinder(0.017, 0.017, 0.12, 6), { color: pal.leatherDark, matrix: mat.T(0, 0, 0.04) }),
  ]);
}
/** Ballesta a escala `size` (0,95 = ligera). */
function crossbowGeometry(size, pal) {
  let k = size / 0.95;
  return mergeParts([
    paint(new BoxGeometry(0.045 * k, 0.05 * k, 0.7 * k), { color: pal.wood, matrix: mat.T(0, 0, 0.22 * k) }),
    paint(new TorusGeometry(0.3 * k, 0.012 * k, 4, 12, Math.PI * 0.8), {
      color: pal.metalDark,
      metal: 1,
      matrix: mat.mul(mat.T(0, 0.02, 0.55 * k), mat.R(90, 0, 0), mat.R(0, 0, 18)),
    }),
    paint(cylinder(0.002, 0.002, 0.5 * k, 3), {
      color: pal.string,
      matrix: mat.mul(mat.T(0, 0.03, 0.42 * k), mat.R(0, 0, 90)),
    }),
    paint(new BoxGeometry(0.03 * k, 0.07 * k, 0.05 * k), {
      color: pal.metalDark,
      metal: 1,
      matrix: mat.T(0, -0.04, 0.05 * k),
    }),
  ]);
}
/** Escudo: «redondo», «tosco» (rodela de madera) o de cometa (por defecto), «sol» con sol dorado. */
function shieldGeometry(style, pal) {
  if (style === 'redondo' || style === 'tosco') {
    let radius = style === 'tosco' ? 0.24 : 0.3,
      board = paint(cylinder(radius, radius, 0.025, 16), {
        color: style === 'tosco' ? '#5a4a36' : pal.cloth1,
        matrix: mat.R(90, 0, 0),
        vary: 0.08,
      });
    return mergeParts([
      board,
      paint(new TorusGeometry(radius, 0.012, 4, 20), {
        color: style === 'tosco' ? pal.woodDark : pal.metal,
        metal: style === 'tosco' ? 0 : 1,
      }),
      paint(new SphereGeometry(0.06, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), {
        color: pal.metal,
        metal: 1,
        matrix: mat.R(90, 0, 0),
      }),
    ]);
  }
  let outline = new Shape();
  (outline.moveTo(0, 0.36),
    outline.quadraticCurveTo(0.24, 0.36, 0.25, 0.2),
    outline.quadraticCurveTo(0.25, -0.12, 0, -0.42),
    outline.quadraticCurveTo(-0.25, -0.12, -0.25, 0.2),
    outline.quadraticCurveTo(-0.24, 0.36, 0, 0.36));
  let face = new ExtrudeGeometry(outline, {
      depth: 0.02,
      bevelEnabled: !0,
      bevelThickness: 0.012,
      bevelSize: 0.018,
      bevelSegments: 1,
      curveSegments: 8,
    }),
    parts = [paint(face, { color: style === 'sol' ? '#e8dcc0' : pal.cloth1 })],
    rim = new ExtrudeGeometry(outline, { depth: 0.012, bevelEnabled: !1, curveSegments: 8 });
  if (
    (parts.push(
      paint(rim, { color: pal.metal, metal: 1, matrix: mat.mul(mat.T(0, 0, -0.008), mat.S(1.06, 1.05, 1)) }),
    ),
    style === 'sol')
  ) {
    parts.push(
      paint(new CircleGeometry(0.08, 14), { color: pal.gold, metal: 1, matrix: mat.T(0, 0.04, 0.034) }),
    );
    for (let k = 0; k < 12; k++)
      parts.push(
        paint(new ConeGeometry(0.018, 0.08, 3), {
          color: pal.gold,
          metal: 1,
          matrix: mat.mul(mat.T(0, 0.04, 0.034), mat.R(0, 0, k * 30), mat.T(0, 0.12, 0)),
        }),
      );
  } else
    (parts.push(
      paint(new BoxGeometry(0.05, 0.6, 0.01), { color: pal.cloth2, matrix: mat.T(0, -0.02, 0.034) }),
    ),
      parts.push(
        paint(new BoxGeometry(0.4, 0.05, 0.01), { color: pal.cloth2, matrix: mat.T(0, 0.12, 0.034) }),
      ));
  return mergeParts(parts);
}
/** Carcaj con flechas emplumadas. */
function quiverGeometry(pal) {
  let parts = [paint(cylinder(0.05, 0.045, 0.5, 8), { color: pal.leather, matrix: mat.T(0, 0.25, 0) })];
  for (let k = 0; k < 6; k++) {
    let x = Math.cos(k * 2.1) * 0.025,
      z = Math.sin(k * 2.1) * 0.025;
    (parts.push(paint(cylinder(0.004, 0.004, 0.2, 3), { color: pal.wood, matrix: mat.T(x, 0.58, z) })),
      parts.push(
        paint(new BoxGeometry(0.003, 0.05, 0.02), {
          color: k % 2 ? '#e8e0d0' : '#a03020',
          matrix: mat.T(x, 0.66, z),
        }),
      ));
  }
  return mergeParts(parts);
}
/** Laúd para la espalda. */
function luteGeometry(pal) {
  return mergeParts([
    paint(new SphereGeometry(0.15, 10, 8), {
      color: '#8a5a2a',
      matrix: mat.mul(mat.T(0, 0, 0), mat.S(1, 1.25, 0.5)),
    }),
    paint(new BoxGeometry(0.045, 0.38, 0.025), { color: pal.woodDark, matrix: mat.T(0, 0.33, 0.02) }),
    paint(new BoxGeometry(0.06, 0.1, 0.02), {
      color: pal.woodDark,
      matrix: mat.mul(mat.T(0, 0.55, 0), mat.R(-25, 0, 0)),
    }),
    paint(new CircleGeometry(0.035, 10), { color: '#1e140c', matrix: mat.T(0, 0.04, 0.077) }),
  ]);
}
/** Mochila con petate enrollado. */
function backpackGeometry(pal) {
  return mergeParts([
    paint(new BoxGeometry(0.3, 0.42, 0.2), { color: pal.leather, vary: 0.06 }),
    paint(new CylinderGeometry(0.08, 0.08, 0.34, 8), {
      color: '#8a7a5a',
      matrix: mat.mul(mat.T(0, 0.26, 0), mat.R(0, 0, 90)),
    }),
    paint(new CylinderGeometry(0.06, 0.05, 0.05, 8), {
      color: pal.metalDark,
      metal: 1,
      matrix: mat.T(0.17, -0.05, 0.02),
    }),
    paint(new BoxGeometry(0.22, 0.12, 0.05), { color: pal.leatherDark, matrix: mat.T(0, -0.08, -0.12) }),
  ]);
}
/** Anteojos dorados centrados en `pos`. */
function glassesGeometry(pos, pal) {
  let { x, y, z } = pos;
  return mergeParts([
    paint(new TorusGeometry(0.017, 0.0025, 4, 12), {
      color: pal.gold,
      metal: 1,
      matrix: mat.T(x + 0.031, y, z),
    }),
    paint(new TorusGeometry(0.017, 0.0025, 4, 12), {
      color: pal.gold,
      metal: 1,
      matrix: mat.T(x - 0.031, y, z),
    }),
    paint(new BoxGeometry(0.03, 0.004, 0.004), { color: pal.gold, metal: 1, matrix: mat.T(x, y + 0.004, z) }),
  ]);
}
/** Libro colgado del cinturón. */
function bookGeometry(pal) {
  return mergeParts([
    paint(new BoxGeometry(0.16, 0.2, 0.05), { color: '#5a2a3a' }),
    paint(new BoxGeometry(0.15, 0.185, 0.052), { color: '#e8dcc0', matrix: mat.T(0.008, 0, 0) }),
    paint(new BoxGeometry(0.03, 0.04, 0.056), { color: pal.gold, metal: 1, matrix: mat.T(-0.06, 0, 0) }),
  ]);
}
/** Bolsa de cuero del cinturón. */
function pouchGeometry(pal) {
  return paint(new SphereGeometry(0.06, 7, 5), { color: pal.leather, matrix: mat.S(1, 1.1, 0.6) });
}
/** Hombrera de tres placas con ribete dorado; `side` = ±1 (izquierda/derecha). */
function pauldronGeometry(side, pos, pal, { size = 1, color } = {}) {
  let base = color || pal.metal,
    parts = [];
  for (let k = 0; k < 3; k++) {
    let radius = (0.11 - k * 0.012) * size,
      cap = new SphereGeometry(radius, 10, 5, 0, Math.PI * 2, 0, Math.PI * 0.42);
    parts.push(
      paint(cap, {
        color: k === 0 ? base : base.clone().multiplyScalar(0.85),
        metal: 1,
        matrix: mat.mul(
          mat.T(pos.x + side * k * 0.035 * size, pos.y + 0.03 - k * 0.035 * size, pos.z),
          mat.R(0, 0, -side * (28 + k * 14)),
          mat.S(1, 0.75, 1.05),
        ),
      }),
    );
  }
  return (
    parts.push(
      paint(new TorusGeometry(0.107 * size, 0.007, 4, 14, Math.PI), {
        color: pal.gold,
        metal: 1,
        matrix: mat.mul(
          mat.T(pos.x, pos.y + 0.03, pos.z),
          mat.R(0, 0, -side * 28),
          mat.T(0, 0.02 * size, 0),
          mat.S(1, 1, 1.05),
          mat.R(0, side * 90, 0),
          mat.R(90, 0, 0),
        ),
      }),
    ),
    mergeParts(parts)
  );
}
/** Peto (mitades delantera y trasera) y, con `plate`, faldar de tres lamas. */
function breastplateGeometry(dims, pal, { color, plate = !0 } = {}) {
  let base = color || pal.metal,
    front = new SphereGeometry(1, 14, 8, -Math.PI / 2, Math.PI, Math.PI * 0.18, Math.PI * 0.6),
    back = new SphereGeometry(1, 14, 8, Math.PI / 2, Math.PI, Math.PI * 0.18, Math.PI * 0.6),
    parts = [
      paint(front, {
        color: base,
        metal: 1,
        matrix: mat.mul(mat.T(0, dims.y, dims.cz), mat.S(dims.w, dims.h, dims.front)),
      }),
      paint(back, {
        color: base.clone().multiplyScalar(0.9),
        metal: 1,
        matrix: mat.mul(mat.T(0, dims.y, dims.cz), mat.S(dims.w, dims.h, dims.back)),
      }),
    ];
  if (plate)
    for (let k = 0; k < 3; k++) {
      let y = dims.y - dims.h * 0.62 - k * 0.045;
      parts.push(
        paint(new CylinderGeometry(dims.w * (0.92 + k * 0.05), dims.w * (0.95 + k * 0.06), 0.05, 14, 1, !0), {
          color: base.clone().multiplyScalar(0.9 - k * 0.05),
          metal: 1,
          matrix: mat.mul(mat.T(0, y, dims.cz), mat.S(1, 1, dims.front / dims.w)),
        }),
      );
    }
  return mergeParts(parts);
}
/** Tubo abierto entre dos puntos con radios distintos en cada extremo (brazales, grebas). */
function cylinderBetween(from, to, rFrom, rTo, pal, { color, metal = 1 } = {}) {
  let dir = new Vector3().subVectors(to, from),
    len = dir.length(),
    geo = new CylinderGeometry(rTo, rFrom, len, 10, 1, !0),
    rot = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize()),
    matrix = new Matrix4().compose(from.clone().add(to).multiplyScalar(0.5), rot, new Vector3(1, 1, 1));
  return paint(geo, { color: color || pal.metal, metal, matrix });
}
/**
 * Tocado sobre la cabeza `head` ({x, y, z, r}): «casco», «yelmo», «corona», «mago» (sombrero
 * puntiagudo), «chambergo» (con pluma), «diadema» o «astas».
 */
function headwearGeometry(kind, head, pal, { color } = {}) {
  let base = color || pal.metal,
    { x, y, z, r } = head,
    parts = [];
  if (kind === 'casco' || kind === 'yelmo')
    (parts.push(
      paint(new SphereGeometry(r * 1.12, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), {
        color: base,
        metal: 1,
        matrix: mat.mul(mat.T(x, y - r * 0.05, z - r * 0.05), mat.S(1, 1.05, 1.1)),
      }),
    ),
      parts.push(
        paint(new TorusGeometry(r * 1.12, r * 0.08, 4, 18), {
          color: base.clone().multiplyScalar(0.8),
          metal: 1,
          matrix: mat.mul(mat.T(x, y - r * 0.18, z - r * 0.05), mat.R(90, 0, 0), mat.S(1, 1.1, 1)),
        }),
      ),
      kind === 'casco'
        ? parts.push(
            paint(new BoxGeometry(r * 0.16, r * 0.75, r * 0.1), {
              color: base,
              metal: 1,
              matrix: mat.T(x, y - r * 0.5, z + r * 1.12),
            }),
          )
        : (parts.push(
            paint(new CylinderGeometry(r * 1.1, r * 1.08, r * 1.15, 14, 1, !0), {
              color: base,
              metal: 1,
              matrix: mat.mul(mat.T(x, y - r * 0.75, z - r * 0.03), mat.S(1, 1, 1.12)),
            }),
          ),
          parts.push(
            paint(new BoxGeometry(r * 1.1, r * 0.08, r * 0.08), {
              color: '#101010',
              matrix: mat.T(x, y - r * 0.5, z + r * 1.2),
            }),
          ),
          parts.push(
            paint(new BoxGeometry(r * 0.08, r * 0.6, r * 0.08), {
              color: base,
              metal: 1,
              matrix: mat.T(x, y - r * 0.75, z + r * 1.22),
            }),
          )));
  else if (kind === 'corona') {
    parts.push(
      paint(new CylinderGeometry(r * 1.05, r * 1.02, r * 0.28, 14, 1, !0), {
        color: pal.gold,
        metal: 1,
        matrix: mat.T(x, y + r * 0.15, z - r * 0.05),
      }),
    );
    for (let k = 0; k < 8; k++)
      parts.push(
        paint(new ConeGeometry(r * 0.12, r * 0.38, 4), {
          color: pal.gold,
          metal: 1,
          matrix: mat.mul(mat.T(x, y + r * 0.42, z - r * 0.05), mat.R(0, k * 45, 0), mat.T(0, 0, r * 1.02)),
        }),
      );
  } else if (kind === 'mago') {
    let brimY = y + r * 0.78,
      hatParts = [];
    hatParts.push(
      paint(new CylinderGeometry(r * 1.85, r * 1.85, r * 0.06, 18), {
        color: pal.cloth1,
        matrix: mat.T(x, brimY, z - r * 0.05),
      }),
    );
    let cone = new ConeGeometry(r * 1.05, r * 3.2, 14, 4, !0),
      pos = cone.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      let t = pos.getY(k) / (r * 3.2) + 0.5;
      pos.setX(k, pos.getX(k) - t * t * r * 0.9);
    }
    (hatParts.push(paint(cone, { color: pal.cloth1, matrix: mat.T(x, brimY + r * 1.6, z - r * 0.05) })),
      hatParts.push(
        paint(new CylinderGeometry(r * 1.06, r * 1.06, r * 0.18, 14, 1, !0), {
          color: pal.cloth2,
          matrix: mat.T(x, brimY + r * 0.1, z - r * 0.05),
        }),
      ));
    let hat = mergeParts(hatParts);
    (hat.applyMatrix4(mat.mul(mat.T(x, y, z), mat.R(-12, 0, 0), mat.T(-x, -y, -z))), parts.push(hat));
  } else if (kind === 'chambergo') {
    (parts.push(
      paint(new CylinderGeometry(r * 1.9, r * 1.9, r * 0.05, 16), {
        color: pal.cloth1,
        matrix: mat.mul(mat.T(x, y + r * 0.45, z - r * 0.05), mat.R(-8, 0, 6)),
      }),
    ),
      parts.push(
        paint(new SphereGeometry(r * 1.08, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), {
          color: pal.cloth1,
          matrix: mat.mul(mat.T(x, y + r * 0.45, z - r * 0.05), mat.S(1, 0.7, 1)),
        }),
      ));
    let feather = new SphereGeometry(r * 0.25, 6, 4);
    parts.push(
      paint(feather, {
        color: '#c03030',
        matrix: mat.mul(mat.T(x + r * 0.7, y + r * 1, z - r * 0.4), mat.R(0, 0, -30), mat.S(0.5, 3, 0.25)),
      }),
    );
  } else if (kind === 'diadema') {
    let circlet = mergeParts([
      paint(new TorusGeometry(r * 1.03, r * 0.05, 4, 18), {
        color: pal.gold,
        metal: 1,
        matrix: mat.mul(mat.T(x, y + r * 0.42, z), mat.R(90, 0, 0)),
      }),
      paint(new OctahedronGeometry(r * 0.12), {
        color: '#e8c050',
        glow: 0.6,
        matrix: mat.T(x, y + r * 0.47, z + r * 1.05),
      }),
    ]);
    (circlet.applyMatrix4(mat.mul(mat.T(x, y, z), mat.R(-14, 0, 0), mat.T(-x, -y, -z))), parts.push(circlet));
  } else if (kind === 'astas') {
    for (let side of [-1, 1]) {
      let curve = new CatmullRomCurve3([
        new Vector3(x + side * r * 0.6, y + r * 0.4, z),
        new Vector3(x + side * r * 1.1, y + r * 1.1, z - r * 0.2),
        new Vector3(x + side * r * 1.3, y + r * 1.8, z - r * 0.1),
      ]);
      (parts.push(paint(new TubeGeometry(curve, 6, r * 0.07, 4), { color: '#8a7050' })),
        parts.push(
          paint(new ConeGeometry(r * 0.06, r * 0.5, 4), {
            color: '#8a7050',
            matrix: mat.mul(mat.T(x + side * r * 1.15, y + r * 1.2, z - r * 0.1), mat.R(0, 0, -side * 50)),
          }),
        ));
    }
    parts.push(
      paint(new TorusGeometry(r * 1.02, r * 0.05, 4, 18), {
        color: '#5a4630',
        matrix: mat.mul(mat.T(x, y + r * 0.2, z), mat.R(90, 0, 0)),
      }),
    );
  }
  return mergeParts(parts);
}
/** Túnica: tronco de cono abierto por delante (`open`), ondulado y aplastado en profundidad. */
function robeGeometry({
  yTop,
  yBottom,
  rTop,
  rBottom,
  cz = -0.01,
  depth = 0.85,
  open = 0,
  color,
  segs = 18,
  rings = 6,
}) {
  let geo = new CylinderGeometry(
    rTop,
    rBottom,
    yTop - yBottom,
    segs,
    rings,
    !0,
    open * Math.PI,
    Math.PI * 2 * (1 - open),
  );
  (geo.rotateY(Math.PI / 2 + open * Math.PI),
    geo.translate(0, (yTop + yBottom) / 2, cz),
    geo.scale(1, 1, depth));
  let pos = geo.attributes.position;
  for (let k = 0; k < pos.count; k++) {
    let f = (yTop - pos.getY(k)) / (yTop - yBottom),
      ang = Math.atan2(pos.getZ(k), pos.getX(k)),
      wave = 1 + Math.sin(ang * 7) * 0.035 * f;
    (pos.setX(k, pos.getX(k) * wave), pos.setZ(k, pos.getZ(k) * wave));
  }
  return (geo.computeVertexNormals(), paint(geo, { color, vary: 0.04 }));
}
/** Capa: plano deformado entre y0 y y1 con abombamiento; `back` invierte las caras para la espalda. */
function capeGeometry({ y0, y1, w0, w1, z, bulge = 0.02, color, segs = 6, rings = 8, back = !1 }) {
  let plane = new PlaneGeometry(1, 1, segs, rings),
    pos = plane.attributes.position;
  for (let k = 0; k < pos.count; k++) {
    let fx = pos.getX(k) + 0.5,
      fy = pos.getY(k) + 0.5,
      w = w1 + (w0 - w1) * fy,
      px = (fx - 0.5) * w,
      py = y1 + (y0 - y1) * fy,
      pz = z + (back ? -1 : 1) * (Math.sin(fx * Math.PI) * bulge + (1 - fy) * bulge * 0.6);
    pos.setXYZ(k, px, py, pz);
  }
  (back && plane.rotateY(0), plane.computeVertexNormals());
  let geo = paint(plane, { color, vary: 0.03 });
  if (back) {
    let posAttr = geo.attributes.position;
    for (let tri = 0; tri < posAttr.count; tri += 3)
      for (let name of ['position', 'normal', 'color', 'metal']) {
        let attr = geo.attributes[name],
          size = attr.itemSize;
        for (let c = 0; c < size; c++) {
          let tmp = attr.array[(tri + 1) * size + c];
          ((attr.array[(tri + 1) * size + c] = attr.array[(tri + 2) * size + c]),
            (attr.array[(tri + 2) * size + c] = tmp));
        }
      }
    geo.computeVertexNormals();
  }
  return geo;
}
/** Esclavina o manto de hombros (toro deformado); con `leaves`, más irregular, como de hojas. */
function mantleGeometry({ y, rx, rz, cz = -0.01, color, thick = 0.06, leaves = !1 }) {
  let geo = new TorusGeometry(1, 0.38, 6, 22);
  geo.rotateX(Math.PI / 2);
  let pos = geo.attributes.position;
  for (let k = 0; k < pos.count; k++) {
    let vx = pos.getX(k),
      vy = pos.getY(k),
      vz = pos.getZ(k),
      ang = Math.atan2(vz, vx),
      wobble = 1 + Math.sin(ang * 9 + vy * 5) * 0.12 + Math.sin(ang * 23) * 0.06;
    pos.setXYZ(
      k,
      vx * rx * wobble,
      y + vy * thick * (vz < 0 ? 1.3 : 0.9) - (vz < 0 ? 0.03 : 0),
      vz * rz * wobble + cz,
    );
  }
  return (geo.computeVertexNormals(), paint(geo, { color, vary: leaves ? 0.35 : 0.18 }));
}
/** Faja o cinturón elíptico con hebilla dorada (`P` es la paleta). */
function beltGeometry({ y, rx, rz, cz, P: pal, color }) {
  let band = new CylinderGeometry(1, 1, 0.045, 18, 1, !0);
  return (
    band.scale(rx, 1, rz),
    band.translate(0, y, cz),
    mergeParts([
      paint(band, { color: color || pal.leatherDark }),
      paint(new BoxGeometry(0.05, 0.05, 0.012), {
        color: pal.gold,
        metal: 1,
        matrix: mat.T(0, y, cz + rz + 0.004),
      }),
    ])
  );
}
/** Interpola la profundidad del torso (`side` = front/back) a la altura `y` en un perfil de TORSO_PROFILES. */
function profileAt(profile, y, side) {
  let ys = profile.y,
    zs = profile[side];
  if (y <= ys[0]) return zs[0];
  for (let k = 0; k < ys.length - 1; k++)
    if (y <= ys[k + 1]) return zs[k] + ((zs[k + 1] - zs[k]) * (y - ys[k])) / (ys[k + 1] - ys[k]);
  return zs[zs.length - 1];
}
/**
 * Paneles de tabardo o delantal que siguen el perfil del torso (`g` = «m» o «f»), partidos en dos
 * por la entrepierna con `split`. Devuelve [{geometry, weights}], con `weights(v)` = pesos de hueso
 * del vértice para el esqueleto (columna, pelvis, muslos).
 */
function tabardGeometry({
  g: gender = 'm',
  top,
  hip,
  bottom,
  w0 = 0.27,
  w1 = 0.32,
  out = 0.022,
  color,
  front = !0,
  back = !0,
  split = !0,
}) {
  let profile = TORSO_PROFILES[gender] || TORSO_PROFILES.m,
    panels = [],
    rows = 12,
    cols = 6,
    sides = [];
  (front && sides.push('front'), back && sides.push('back'));
  for (let side of sides) {
    let sign = side === 'front' ? 1 : -1,
      halves = split
        ? [
            [-1, -0.012],
            [1, 0.012],
          ]
        : [[0, 0]];
    for (let [half, gap] of halves) {
      let verts = [],
        index = [];
      for (let row = 0; row <= rows; row++) {
        let fy = row / rows,
          y = top + (bottom - top) * fy,
          width = w0 + (w1 - w0) * Math.max(0, y < hip ? (hip - y) / (hip - bottom) : 0),
          baseZ = profileAt(profile, Math.min(y, hip + 0.02), side),
          below = Math.max(0, hip - y),
          zRow = baseZ + sign * (out + below * 0.12);
        for (let col = 0; col <= cols; col++) {
          let fx = col / cols,
            x;
          half === 0 || y > hip
            ? (x = (fx - 0.5) * width)
            : (x =
                half < 0
                  ? -width / 2 + fx * (width / 2 - Math.abs(gap))
                  : Math.abs(gap) + fx * (width / 2 - Math.abs(gap)));
          let edge = Math.abs(x) / (width / 2),
            z = zRow - sign * edge * edge * 0.035;
          verts.push(x, y, z);
        }
      }
      for (let row = 0; row < rows; row++)
        for (let col = 0; col < cols; col++) {
          let i00 = row * (cols + 1) + col,
            i01 = i00 + 1,
            i10 = i00 + cols + 1,
            i11 = i10 + 1;
          sign > 0 ? index.push(i00, i10, i01, i01, i10, i11) : index.push(i00, i01, i10, i01, i11, i10);
        }
      let geo = new BufferGeometry();
      (geo.setAttribute('position', new Float32BufferAttribute(verts, 3)),
        geo.setIndex(index),
        geo.computeVertexNormals());
      let weights = (v) => {
        if (v.y > top - 0.12) return [['spine_03', 1]];
        if (v.y > hip + 0.12)
          return [
            ['spine_02', 0.5],
            ['spine_01', 0.5],
          ];
        if (v.y > hip - 0.04) return [['pelvis', 1]];
        let t = Math.min(1, (hip - 0.04 - v.y) / 0.35);
        if (!split)
          return [
            ['pelvis', 1 - t * 0.5],
            ['thigh_l', t * 0.25],
            ['thigh_r', t * 0.25],
          ];
        let thigh = v.x > 0 ? 'thigh_l' : 'thigh_r';
        return [
          ['pelvis', 1 - t * 0.75],
          [thigh, t * 0.75],
        ];
      };
      panels.push({ geometry: paint(geo, { color, vary: 0.03 }), weights });
    }
  }
  return panels;
}
const deg = MathUtils.degToRad;
/** Ayudantes de matrices: traslación T, rotación R (grados, orden XYZ), escala S y producto mul. */
const mat = {
  T: (x, y, z) => new Matrix4().makeTranslation(x, y, z),
  R: (x, y, z) => new Matrix4().makeRotationFromEuler(new Euler(deg(x), deg(y), deg(z))),
  S: (x, y = x, z = x) => new Matrix4().makeScale(x, y, z),
  mul: (...ms) => ms.reduce((acc, m) => acc.multiply(m), new Matrix4()),
};
/** Perfil del torso por sexo: profundidad delantera y trasera a varias alturas (m). */
const TORSO_PROFILES = {
  m: {
    y: [0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5],
    front: [0.126, 0.107, 0.1, 0.105, 0.131, 0.112, 0.05],
    back: [-0.2, -0.143, -0.116, -0.122, -0.136, -0.147, -0.14],
  },
  f: {
    y: [0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.48],
    front: [0.113, 0.108, 0.108, 0.16, 0.16, 0.096, 0.03],
    back: [-0.18, -0.154, -0.09, -0.101, -0.134, -0.141, -0.11],
  },
};

export {
  pauldronGeometry,
  headwearGeometry,
  beltGeometry,
  glassesGeometry,
  mergeParts,
  weaponGeometry,
  mat,
  shieldGeometry,
  gearPalette,
  mantleGeometry,
  backpackGeometry,
  robeGeometry,
  tabardGeometry,
  breastplateGeometry,
  bookGeometry,
  luteGeometry,
  cylinderBetween,
  paint,
  pouchGeometry,
  quiverGeometry,
  capeGeometry,
};
