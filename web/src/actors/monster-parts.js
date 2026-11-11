// actors/monster-parts.js
// Reconstruido de publicado/juego.js (módulo __esm «X2»). Nombres locales aún minificados.

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
import { hi } from './sculpt.js';

function _z(o) {
  let e = o.clone();
  for (let [t, a] of Object.entries(e.attributes)) {
    if (a.array instanceof Float32Array && !a.normalized && !a.isInterleavedBufferAttribute) continue;
    let n = a.count,
      s = a.itemSize,
      i = new Float32Array(n * s),
      r = [a.getX, a.getY, a.getZ, a.getW];
    for (let l = 0; l < n; l++) for (let c = 0; c < s; c++) i[l * s + c] = r[c].call(a, l);
    e.setAttribute(t, new BufferAttribute(i, s));
  }
  return e;
}
function V2() {
  return (
    tv ||
      (tv = loadGLTF('assets/monsters/piezas.json').then((o) => {
        let e = new Map();
        (o.scene.updateMatrixWorld(!0),
          o.scene.traverse((a) => {
            if (a.isMesh) {
              let n = _z(a.geometry);
              (n.applyMatrix4(a.matrixWorld), e.set(a.name, n));
            }
          }));
        let t = e.get('kk_craneo');
        return (
          t && (t.computeBoundingBox(), (e.headScale = 0.17 / (t.boundingBox.max.x - t.boundingBox.min.x))),
          e
        );
      })),
    tv
  );
}
function rc(o, e, { scale: t = 1, matrix: a = null, metal: n = 0, glow: s = 0, tint: i = null } = {}) {
  let r = o.get(e);
  if (!r) return null;
  let l = r.index ? r.toNonIndexed() : r.clone();
  (t !== 1 && l.scale(t, t, t), a && l.applyMatrix4(a));
  let c = l.attributes.position.count;
  if (l.attributes.color) {
    if (l.attributes.color.itemSize === 4) {
      let u = l.attributes.color,
        h = new Float32Array(c * 3);
      for (let p = 0; p < c; p++) h.set([u.getX(p), u.getY(p), u.getZ(p)], p * 3);
      l.setAttribute('color', new BufferAttribute(h, 3));
    }
  } else {
    let u = new Float32Array(c * 3).fill(0.8);
    l.setAttribute('color', new BufferAttribute(u, 3));
  }
  if (i) {
    let u = new Color(i),
      h = l.attributes.color;
    for (let p = 0; p < c; p++) h.setXYZ(p, h.getX(p) * u.r, h.getY(p) * u.g, h.getZ(p) * u.b);
  }
  let d = new Float32Array(c * 2);
  for (let u = 0; u < c; u++) d.set([n, s], u * 2);
  l.setAttribute('metal', new BufferAttribute(d, 2));
  for (let u of Object.keys(l.attributes))
    ['position', 'normal', 'color', 'metal'].includes(u) || l.deleteAttribute(u);
  return l;
}
function Lo(o, e, t, a, { knob: n = 1.7, flat: s = 1 } = {}) {
  let i = o.distanceTo(e);
  if (t < 0.0065) {
    let d = new LatheGeometry(
        [
          new Vector2(1e-4, 0),
          new Vector2(t * 1.4, i * 0.12),
          new Vector2(t * 0.9, i * 0.5),
          new Vector2(t * 1.4, i * 0.88),
          new Vector2(1e-4, i),
        ],
        4,
      ),
      u = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), e.clone().sub(o).normalize());
    return (
      d.applyMatrix4(new Matrix4().compose(o, u, new Vector3(1, 1, 1))),
      paint(d, { color: a, vary: 0.12 })
    );
  }
  let r = [
      new Vector2(1e-4, 0),
      new Vector2(t * n * 0.9, i * 0.02),
      new Vector2(t * n, i * 0.07),
      new Vector2(t * 1.05, i * 0.18),
      new Vector2(t * 0.85, i * 0.5),
      new Vector2(t * 1.05, i * 0.82),
      new Vector2(t * n, i * 0.93),
      new Vector2(t * n * 0.85, i * 0.985),
      new Vector2(1e-4, i),
    ],
    l = new LatheGeometry(r, 7);
  l.scale(1, 1, s);
  let c = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), e.clone().sub(o).normalize());
  return (
    l.applyMatrix4(new Matrix4().compose(o, c, new Vector3(1, 1, 1))),
    paint(l, { color: a, vary: 0.12 })
  );
}
function $2(o, e = {}) {
  let t = (u) => o.get(u).getWorldPosition(new Vector3()),
    a = new Color(e.color || '#d8ccae'),
    n = a.clone().multiplyScalar(0.7),
    s = [],
    i = (u, h) => u && s.push({ geometry: u, bone: h });
  for (let u of ['l', 'r']) {
    i(Lo(t(`upperarm_${u}`), t(`lowerarm_${u}`), 0.017, a), `upperarm_${u}`);
    let h = t(`lowerarm_${u}`),
      p = t(`hand_${u}`),
      m = new Vector3(0, 0, 0.011);
    (i(Lo(h.clone().add(m), p.clone().add(m), 0.009, a), `lowerarm_${u}`),
      i(
        Lo(
          h.clone().sub(m),
          p
            .clone()
            .sub(m)
            .add(new Vector3(0, -0.006, 0)),
          0.008,
          n,
        ),
        `lowerarm_${u}`,
      ),
      i(
        Lo(
          t(`clavicle_${u}`).add(new Vector3(0, 0, 0.02)),
          t(`upperarm_${u}`).add(new Vector3(0, 0.01, 0.02)),
          0.009,
          a,
          { knob: 1.4 },
        ),
        `clavicle_${u}`,
      ));
    let _ = t(`upperarm_${u}`)
      .lerp(t('spine_03'), 0.45)
      .add(new Vector3(0, -0.04, -0.09));
    i(
      paint(new CircleGeometry(0.06, 3), {
        color: n,
        matrix: mat.mul(mat.T(_.x, _.y, _.z), mat.R(0, 180, u === 'l' ? 15 : -15)),
      }),
      'spine_03',
    );
    for (let x of ['index', 'middle', 'ring', 'pinky', 'thumb']) {
      let g = [`${x}_01_${u}`, `${x}_02_${u}`, `${x}_03_${u}`, `${x}_04_leaf_${u}`].filter((y) => o.has(y));
      i(Lo(t(`hand_${u}`), t(g[0]), 0.0045, a, { knob: 1.3 }), `hand_${u}`);
      for (let y = 0; y + 1 < g.length; y++) i(Lo(t(g[y]), t(g[y + 1]), 0.004, a, { knob: 1.3 }), g[y]);
    }
    i(Lo(t(`thigh_${u}`), t(`calf_${u}`), 0.022, a), `thigh_${u}`);
    let b = t(`calf_${u}`),
      f = t(`foot_${u}`);
    (i(Lo(b, f, 0.017, a), `calf_${u}`),
      i(
        Lo(
          b.clone().add(new Vector3(u === 'l' ? 0.02 : -0.02, -0.03, -0.01)),
          f.clone().add(new Vector3(u === 'l' ? 0.022 : -0.022, 0.02, -0.01)),
          0.007,
          n,
        ),
        `calf_${u}`,
      ),
      i(
        paint(new SphereGeometry(0.022, 6, 4), {
          color: a,
          matrix: mat.mul(mat.T(b.x, b.y + 0.01, b.z + 0.035), mat.S(1, 1.2, 0.6)),
        }),
        `calf_${u}`,
      ));
    let v = t(`ball_${u}`);
    for (let x of [-0.025, -0.008, 0.008, 0.025])
      (i(
        Lo(f.clone().add(new Vector3(x * 0.5, -0.02, 0)), v.clone().add(new Vector3(x, 0, 0)), 0.006, a, {
          knob: 1.3,
        }),
        `foot_${u}`,
      ),
        o.has(`ball_leaf_${u}`) &&
          i(
            Lo(
              v.clone().add(new Vector3(x, 0, 0)),
              t(`ball_leaf_${u}`).add(new Vector3(x, 0.003, -0.02)),
              0.005,
              a,
              { knob: 1.2 },
            ),
            `ball_${u}`,
          ));
    i(
      paint(new SphereGeometry(0.03, 6, 4), {
        color: a,
        matrix: mat.mul(mat.T(f.x, f.y - 0.04, f.z - 0.035), mat.S(0.8, 0.7, 1.1)),
      }),
      `foot_${u}`,
    );
  }
  let r = ['pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01', 'Head'];
  for (let u = 0; u + 1 < r.length; u++) {
    let h = t(r[u]),
      p = t(r[u + 1]),
      m = r[u] === 'neck_01' ? 3 : 4;
    for (let _ = 0; _ < m; _++) {
      let b = h
          .clone()
          .lerp(p, (_ + 0.5) / m)
          .add(new Vector3(0, 0, -0.03)),
        f = r[u].startsWith('neck') ? 0.014 : 0.019;
      (i(paint(new CylinderGeometry(f, f, 0.022, 7), { color: a, matrix: mat.T(b.x, b.y, b.z) }), r[u]),
        i(
          paint(new ConeGeometry(0.008, 0.035, 4), {
            color: n,
            matrix: mat.mul(mat.T(b.x, b.y - 0.008, b.z - 0.025), mat.R(-110, 0, 0)),
          }),
          r[u],
        ));
    }
  }
  let l = t('pelvis');
  for (let u of [-1, 1])
    (i(
      paint(new SphereGeometry(0.075, 8, 5, 0, Math.PI, 0, Math.PI * 0.75), {
        color: a,
        matrix: mat.mul(
          mat.T(l.x + u * 0.075, l.y + 0.02, l.z - 0.01),
          mat.R(0, u * 90 + 180, 0),
          mat.S(1, 0.85, 0.35),
        ),
      }),
      'pelvis',
    ),
      i(
        Lo(
          new Vector3(l.x + u * 0.03, l.y - 0.06, l.z + 0.04),
          new Vector3(l.x + u * 0.09, l.y - 0.03, l.z + 0),
          0.012,
          a,
          { knob: 1.2 },
        ),
        'pelvis',
      ));
  i(
    paint(new ConeGeometry(0.04, 0.11, 6), {
      color: n,
      matrix: mat.mul(mat.T(l.x, l.y - 0.03, l.z - 0.05), mat.R(180, 0, 0)),
    }),
    'pelvis',
  );
  let c = t('spine_03'),
    d = t('spine_02');
  for (let u = 0; u < 6; u++) {
    let h = u / 5,
      p = c.y + 0.1 - h * 0.21,
      m = 0.085 + Math.sin((h * 0.75 + 0.15) * Math.PI) * 0.055,
      _ = 0.075 + Math.sin((h * 0.8 + 0.1) * Math.PI) * 0.035,
      b = c.z - 0.01,
      f = p > c.y - 0.02 ? 'spine_03' : 'spine_02';
    for (let v of [-1, 1]) {
      let x = [];
      for (let g = 0; g <= 6; g++) {
        let y = -Math.PI / 2 + (g / 6) * Math.PI * 0.92;
        x.push(new Vector3(v * Math.cos(y) * m, p - g * 0.008 + (u > 3, 0), b + Math.sin(y) * _));
      }
      ((x[0].z = b - _ * 0.75),
        (x[0].x = v * 0.015),
        i(
          paint(hi(x, 0.007, 0.005, { radial: 5, segs: 8, closed: !1, flat: 0.6 }), { color: a, vary: 0.1 }),
          f,
        ));
    }
  }
  if (
    (i(
      paint(new BoxGeometry(0.03, 0.17, 0.012), { color: a, matrix: mat.T(c.x, c.y - 0.02, c.z + 0.1) }),
      'spine_03',
    ),
    e.pieces)
  ) {
    let u = t('Head'),
      h = (e.pieces.headScale || 0.2) * (e.headScale ?? 1),
      p = e.skull === 'mago' ? 'kk_craneo_mago' : 'kk_craneo',
      m = mat.mul(mat.T(u.x, u.y - 0.055, u.z + 0.005), mat.S(h));
    (i(rc(e.pieces, p, { matrix: m, tint: e.color ? a.clone().multiplyScalar(1.25) : null }), 'Head'),
      i(
        rc(e.pieces, 'kk_mandibula', { matrix: m, tint: e.color ? a.clone().multiplyScalar(1.25) : null }),
        'Head',
      ),
      i(rc(e.pieces, 'kk_ojos', { matrix: m, glow: 1, tint: e.eyes || null }), 'Head'));
  }
  return s;
}
function W2(o, e, { y0: t, y1: a, w: n = 0.3 } = {}) {
  let i = ((c) => o.get(c).getWorldPosition(new Vector3()))('pelvis'),
    r = new CylinderGeometry(0.14, 0.2, t - a, 12, 4, !0);
  (r.translate(0, (t + a) / 2, i.z - 0.01), r.scale(1, 1, 0.8));
  let l = r.attributes.position;
  for (let c = 0; c < l.count; c++) {
    let d = (t - l.getY(c)) / (t - a),
      u = Math.atan2(l.getZ(c), l.getX(c));
    l.setY(c, l.getY(c) - Math.max(0, Math.sin(u * 5) * 0.06 * d));
  }
  return (r.computeVertexNormals(), mergeParts([paint(r, { color: e, vary: 0.25 })]));
}
let tv = null;

export { $2, V2, W2, rc };
