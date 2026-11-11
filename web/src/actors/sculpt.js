// actors/sculpt.js
// Reconstruido de publicado/juego.js (módulo __esm «Of»). Nombres locales aún minificados.

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

function I2(o) {
  let e = [],
    t = o.ears;
  if (t && t.len > 0) {
    let s = new Vector3(...t.dir).normalize();
    e.push((i, r) => {
      if (r.hair) return;
      let l = Math.abs(i.x),
        c = Ha(0.071, 0.088, l) * Xn(i.y, 0.045, 0.135, 0.02) * Xn(i.z, -0.06, 0.035, 0.015);
      if (!c) return;
      let d = Ha(t.from ?? 0.065, 0.13, i.y),
        u = c * (0.25 + 0.75 * d) * t.len;
      ((i.x += Math.sign(i.x) * s.x * u), (i.y += s.y * u), (i.z += s.z * u));
    });
  }
  let a = o.face || 0;
  if (
    (a === 1
      ? e.push((s) => {
          let i = Xn(s.x, -0.022, 0.022, 0.01) * Xn(s.y, 0.015, 0.085) * Ha(0.08, 0.11, s.z);
          ((s.z += i * 0.012),
            (s.y -= i * 0.004),
            s.y < 0.04 && s.z > 0 && (s.x *= 1 - 0.06 * Ha(0.04, -0.03, s.y)));
        })
      : a === 2
        ? e.push((s) => {
            let i = Ha(0.04, -0.02, s.y) * Ha(-0.02, 0.04, s.z);
            ((s.x *= 1 + i * 0.09), (s.z += i * Ha(0.06, 0.1, s.z) * 0.01));
          })
        : a === 3 &&
          e.push((s) => {
            let i = Xn(Math.abs(s.x), 0.035, 0.075) * Xn(s.y, 0.04, 0.085) * Ha(0.02, 0.06, s.z);
            s.x *= 1 + i * 0.07;
            let r = Xn(s.x, -0.02, 0.02, 0.01) * Xn(s.y, 0.015, 0.075) * Ha(0.09, 0.12, s.z);
            s.z -= r * 0.008;
          }),
    o.nose)
  ) {
    let { len: s = 0, wide: i = 0, drop: r = 0 } = o.nose;
    e.push((l) => {
      let c = Xn(l.x, -0.026, 0.026, 0.012) * Xn(l.y, 0.01, 0.085, 0.012) * Ha(0.075, 0.115, l.z);
      if (!c) return;
      let d = Ha(0.1, 0.13, l.z);
      ((l.z += c * s * (0.4 + 0.6 * d)), (l.y -= c * r * d), (l.x *= 1 + c * i));
    });
  }
  if (o.jaw) {
    let { wide: s = 0, fwd: i = 0, brow: r = 0 } = o.jaw;
    e.push((l) => {
      let c = Ha(0.045, -0.02, l.y) * Ha(-0.03, 0.03, l.z);
      ((l.x *= 1 + c * s), (l.z += c * i * Ha(0, 0.08, l.z)));
      let d = Xn(l.y, 0.105, 0.14, 0.012) * Ha(0.04, 0.085, l.z);
      l.z += d * r;
    });
  }
  if (o.snout) {
    let s = o.snout;
    e.push((i, r) => {
      let l = Ha(0, 0.085, i.z) * Xn(i.y, -0.07, 0.085, 0.03) * (1 - Ha(0.045, 0.085, Math.abs(i.x)) * 0.6);
      ((i.z += l * s), (i.y -= l * s * 0.12), (i.x *= 1 - l * 0.22));
      let c = Xn(i.y, 0.105, 0.14, 0.012) * Ha(0.04, 0.085, i.z);
      if (((i.z += c * 0.012), i.y > 0.15 && (i.y = 0.15 + (i.y - 0.15) * 0.85), !r.hair)) {
        let d = Ha(0.07, 0.09, Math.abs(i.x)) * Xn(i.y, 0.04, 0.14);
        i.x -= Math.sign(i.x) * d * 0.012;
      }
    });
  }
  if (o.skullScale) {
    let s = o.skullScale;
    e.push((i) => {
      ((i.x *= s[0]), (i.y *= s[1]), (i.z *= s[2]));
    });
  }
  if (!e.length) return null;
  let n = new Vector3();
  return (s, i, r, l, c) => {
    if (r <= 0.001) return;
    n.copy(s).sub(l);
    let d = n.clone();
    for (let u of e) u(n, c);
    s.addScaledVector(n.sub(d), r);
  };
}
function hi(o, e, t, { radial: a = 7, segs: n = 14, closed: s = !0, flat: i = 1 } = {}) {
  let r = new CatmullRomCurve3(o),
    l = r.computeFrenetFrames(n, !1),
    c = [],
    d = [];
  for (let h = 0; h <= n; h++) {
    let p = h / n,
      m = r.getPointAt(p),
      _ = e + (t - e) * p,
      b = l.normals[h],
      f = l.binormals[h];
    for (let v = 0; v < a; v++) {
      let x = (v / a) * Math.PI * 2,
        g = m
          .clone()
          .addScaledVector(b, Math.cos(x) * _)
          .addScaledVector(f, Math.sin(x) * _ * i);
      c.push(g.x, g.y, g.z);
    }
  }
  for (let h = 0; h < n; h++)
    for (let p = 0; p < a; p++) {
      let m = h * a + p,
        _ = h * a + ((p + 1) % a),
        b = (h + 1) * a + p,
        f = (h + 1) * a + ((p + 1) % a);
      d.push(m, b, _, _, b, f);
    }
  if (s) {
    let h = r.getPointAt(1),
      p = c.length / 3;
    c.push(h.x, h.y, h.z);
    for (let m = 0; m < a; m++) d.push(n * a + m, p, n * a + ((m + 1) % a));
  }
  let u = new BufferGeometry();
  return (
    u.setAttribute('position', new Float32BufferAttribute(c, 3)),
    u.setIndex(d),
    u.computeVertexNormals(),
    u
  );
}
function H2(o, e, t = 1) {
  let a = [];
  for (let n of [-1, 1]) {
    let s,
      i = 0.018;
    o === 'carnero'
      ? ((s = [
          jt(n * 0.05, 0.16, 0.04),
          jt(n * 0.09, 0.19, -0.02),
          jt(n * 0.12, 0.14, -0.07),
          jt(n * 0.115, 0.07, -0.03),
          jt(n * 0.1, 0.07, 0.03),
          jt(n * 0.12, 0.11, 0.05),
        ]),
        (i = 0.024))
      : o === 'rectos'
        ? (s = [
            jt(n * 0.04, 0.17, 0.05),
            jt(n * 0.05, 0.23, 0.06),
            jt(n * 0.055, 0.29, 0.05),
            jt(n * 0.05, 0.33, 0.03),
          ])
        : o === 'toro'
          ? ((s = [
              jt(n * 0.09, 0.16, 0),
              jt(n * 0.17, 0.17, 0.02),
              jt(n * 0.23, 0.21, 0.07),
              jt(n * 0.24, 0.28, 0.12),
            ]),
            (i = 0.026))
          : o === 'atras'
            ? ((s = [
                jt(n * 0.045, 0.17, 0.05),
                jt(n * 0.06, 0.2, -0.02),
                jt(n * 0.065, 0.2, -0.1),
                jt(n * 0.06, 0.17, -0.17),
              ]),
              (i = 0.02))
            : (s = [
                jt(n * 0.04, 0.17, 0.05),
                jt(n * 0.08, 0.22, 0.03),
                jt(n * 0.11, 0.25, -0.03),
                jt(n * 0.1, 0.29, -0.07),
              ]);
    let r = hi(
      s.map((l) => l.multiplyScalar(1)),
      i * t,
      0.002,
      { radial: 7, segs: 12 },
    );
    if (t !== 1) {
      let l = s[0];
      (r.translate(-l.x, -l.y, -l.z), r.scale(t, t, t), r.translate(l.x, l.y, l.z));
    }
    a.push(paint(r, { color: e, vary: 0.08 }));
    for (let l = 1; l < 3; l++) {
      let c = l / 4,
        d = new CatmullRomCurve3(s).getPointAt(c);
    }
  }
  return mergeParts(a);
}
function N2(o) {
  let e = o === 'grandes',
    t = [];
  for (let a of [-1, 1]) {
    let n = new ConeGeometry(e ? 0.0075 : 0.005, e ? 0.032 : 0.02, 6);
    t.push(
      paint(n, {
        color: '#efe6cc',
        matrix: mat.mul(mat.T(a * 0.024, e ? 0.008 : 0.004, 0.096), mat.R(-12, 0, a * -12)),
      }),
    );
  }
  return mergeParts(t);
}
function F2(o, e) {
  let t = [];
  if (o === 'cresta')
    for (let a = 0; a < 6; a++) {
      let n = 0.4 + a * 0.28,
        s = 0.08 + Math.sin(n) * 0.13,
        i = Math.cos(n) * 0.1 - 0.02,
        r = 0.05 - a * 0.004;
      t.push(
        paint(new ConeGeometry(0.012, r, 4), {
          color: e,
          matrix: mat.mul(
            mat.T(0, s, i),
            mat.R(-Math.cos(n) * 60 - 40, 0, 0),
            mat.T(0, r / 2, 0),
            mat.S(0.5, 1, 1.6),
          ),
        }),
      );
    }
  else if (o === 'gola')
    for (let a of [-1, 1])
      for (let n = 0; n < 4; n++)
        t.push(
          paint(new ConeGeometry(0.01, 0.07 - n * 0.008, 4), {
            color: e,
            matrix: mat.mul(
              mat.T(a * 0.07, 0.03 + n * 0.03, -0.04),
              mat.R(0, 0, a * -(70 + n * 8)),
              mat.R(-25, 0, 0),
              mat.T(0, 0.03, 0),
              mat.S(0.4, 1, 1.4),
            ),
          }),
        );
  return mergeParts(t);
}
function O2(o, e, { length: t = 1, tip: a = !0 } = {}) {
  let n = o,
    s = t,
    i = [
      jt(n.x, n.y - 0.02, n.z - 0.11),
      jt(n.x, n.y - 0.18 * s, n.z - 0.26 * s),
      jt(n.x + 0.1 * s, n.y - 0.5 * s, n.z - 0.36 * s),
      jt(n.x + 0.04, n.y - 0.78 * s, n.z - 0.32 * s),
      jt(n.x - 0.08 * s, n.y - 0.86 * s, n.z - 0.2 * s),
    ],
    r = [paint(hi(i, 0.03, 0.008, { radial: 7, segs: 18, closed: !1 }), { color: e })];
  if (a) {
    let l = i[i.length - 1],
      c = new Shape();
    (c.moveTo(0, -0.01), c.lineTo(0.035, 0.03), c.lineTo(0, 0.08), c.lineTo(-0.035, 0.03));
    let d = new ExtrudeGeometry(c, { depth: 0.008, bevelEnabled: !1 });
    r.push(paint(d, { color: e, matrix: mat.mul(mat.T(l.x, l.y, l.z), mat.R(0, 60, 100)) }));
  }
  return mergeParts(r);
}
function B2(o) {
  return (e) => {
    let t = Math.min(1, Math.max(0, (o - e.y) / 0.6));
    return [
      ['pelvis', 1 - t * 0.35],
      ['thigh_l', t * 0.2],
      ['thigh_r', t * 0.15],
    ];
  };
}
function ru(o, e = 'y') {
  let t = o.attributes.position;
  o.computeBoundingBox();
  let a = o.boundingBox,
    n = new Float32Array(t.count * 2);
  for (let s = 0; s < t.count; s++) {
    let i =
        e === 'y'
          ? (t.getY(s) - a.min.y) / Math.max(1e-4, a.max.y - a.min.y)
          : (t.getZ(s) - a.min.z) / Math.max(1e-4, a.max.z - a.min.z),
      r = (Math.atan2(t.getX(s), t.getZ(s) + 0.001) / Math.PI) * 0.5 + 0.5;
    ((n[s * 2] = 0.06 + r * 0.36), (n[s * 2 + 1] = 0.08 + i * 0.34));
  }
  return (o.setAttribute('uv', new BufferAttribute(n, 2)), o);
}
function q2(o = 1) {
  let e = [
      jt(0, 0.15, -0.085),
      jt(0, 0.13, -0.135),
      jt(0, 0.06, -0.15),
      jt(0, -0.04, -0.14),
      jt(0, -0.12 * o, -0.12),
    ],
    t = hi(e, 0.03, 0.012, { radial: 8, segs: 14 }).toNonIndexed(),
    a = new TorusGeometry(0.022, 0.007, 5, 10).toNonIndexed();
  return (a.rotateX(Math.PI / 2 - 0.3), a.translate(0, 0.125, -0.135), ev([ru(t), ru(a)]));
}
function U2(o = 1) {
  let e = [],
    t = Math.round(9 * o);
  for (let n = 0; n < t; n++) {
    let s = n / (t - 1),
      i = 0.12 - s * 0.38 * o,
      r = -0.1 - Math.sin(s * Math.PI * 0.6) * 0.06 - s * 0.03,
      l = 0.024 - s * 0.008,
      c = new SphereGeometry(l, 7, 5).toNonIndexed();
    (c.scale(1, 1.5, 0.85),
      c.rotateZ((n % 2 ? 1 : -1) * 0.5),
      c.translate((n % 2 ? 1 : -1) * 0.004, i, r),
      e.push(ru(c)));
  }
  let a = new TorusGeometry(0.014, 0.005, 5, 10).toNonIndexed();
  return (
    a.rotateX(Math.PI / 2),
    a.translate(0, 0.12 - 0.36 * o, -0.1 - 0.06 * Math.sin(Math.PI * 0.6) - 0.03),
    e.push(ru(a)),
    ev(e)
  );
}
function j2() {
  let o = [];
  for (let e = 0; e < 9; e++) {
    let t = -0.2 + e * 0.33,
      a = 0.1 + Math.cos(t - 0.6) * 0.115,
      n = Math.sin(t - 0.6) * -0.11 + 0.01,
      s = 0.06 + Math.sin((e / 8) * Math.PI) * 0.03,
      i = new ConeGeometry(0.018, s, 5).toNonIndexed();
    i.scale(0.5, 1, 1.6);
    let r = jt(0, a - 0.06, n).normalize();
    (i.applyQuaternion(new Quaternion().setFromUnitVectors(jt(0, 1, 0), r)),
      i.translate(0, a + r.y * s * 0.4, n + r.z * s * 0.4),
      o.push(ru(i)));
  }
  return ev(o);
}
function ev(o) {
  let e = [],
    t = [],
    a = [];
  for (let s of o)
    (s.attributes.normal || s.computeVertexNormals(),
      e.push(...s.attributes.position.array),
      t.push(...s.attributes.normal.array),
      a.push(...s.attributes.uv.array));
  let n = new BufferGeometry();
  return (
    n.setAttribute('position', new Float32BufferAttribute(e, 3)),
    n.setAttribute('normal', new Float32BufferAttribute(t, 3)),
    n.setAttribute('uv', new Float32BufferAttribute(a, 2)),
    n
  );
}
function G2(o) {
  return (e) => {
    let t = Math.min(1, Math.max(0, (o + 0.08 - e.y) / 0.3));
    return [
      ['Head', 1 - t],
      ['neck_01', t * 0.4],
      ['spine_03', t * 0.6],
    ];
  };
}
const Ha = (o, e, t) => {
  let a = Math.min(1, Math.max(0, (t - o) / (e - o)));
  return a * a * (3 - 2 * a);
};
const Xn = (o, e, t, a = 0.015) => Ha(e - a, e, o) * (1 - Ha(t, t + a, o));
const jt = (o, e, t) => new Vector3(o, e, t);

export { B2, F2, G2, H2, I2, N2, O2, U2, hi, j2, q2 };
