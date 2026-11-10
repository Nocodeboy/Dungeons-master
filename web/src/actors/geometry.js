// actors/geometry.js
// Reconstruido de publicado/juego.js (módulo __esm «iu»). Nombres locales aún minificados.

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

function _e(o, { color: e = 8947848, metal: t = 0, glow: a = 0, matrix: n = null, vary: s = 0 } = {}) {
  let i = o.index ? o.toNonIndexed() : o;
  (n && i.applyMatrix4(n), i.attributes.normal || i.computeVertexNormals());
  for (let u of Object.keys(i.attributes)) ['position', 'normal'].includes(u) || i.deleteAttribute(u);
  let r = i.attributes.position.count,
    l = new Color(e),
    c = new Float32Array(r * 3),
    d = new Float32Array(r * 2);
  for (let u = 0; u < r; u++) {
    let h = s ? 1 + ((Math.sin(u * 12.9898) * 43758.5453) % 1) * s : 1;
    (c.set([l.r * h, l.g * h, l.b * h], u * 3), d.set([t, a], u * 2));
  }
  return (
    i.setAttribute('color', new BufferAttribute(c, 3)),
    i.setAttribute('metal', new BufferAttribute(d, 2)),
    i
  );
}
function Et(o) {
  let e = o.filter(Boolean);
  return e.length ? (e.length === 1 ? e[0] : mergeGeometries(e, !1)) : null;
}
function Kb(o) {
  let e = new Color(o.metalColor || '#b8bec6');
  return {
    metal: e,
    metalDark: e.clone().multiplyScalar(0.55),
    gold: new Color('#d4a63a'),
    wood: new Color('#6b4a2e'),
    woodDark: new Color('#3e2a1a'),
    leather: new Color('#4a3020'),
    leatherDark: new Color('#2a1c14'),
    cloth1: new Color(o.colors?.cloth1 || '#3f5f9a'),
    cloth2: new Color(o.colors?.cloth2 || '#c9b48a'),
    bone: new Color('#d8ccb0'),
    string: new Color('#d8d0b8'),
  };
}
function ic(o, e, { curve: t = 0, thick: a = 0.012, point: n = 0.18, taper: s = 0.35 } = {}) {
  let i = new Shape(),
    r = 8,
    l = e / 2,
    c = [];
  for (let h = 0; h <= r; h++) {
    let p = h / r,
      m = p * o * (1 - n),
      _ = l * (1 - p * s);
    c.push([m, _]);
  }
  let d = (h) => t * (h / o) * (h / o) * o;
  i.moveTo(-l + d(0), 0);
  for (let [h, p] of c) i.lineTo(-p + d(h), h);
  i.lineTo(d(o) + (t ? l * 0.4 : 0), o);
  for (let h = c.length - 1; h >= 0; h--) i.lineTo(c[h][1] + d(c[h][0]), c[h][0]);
  let u = new ExtrudeGeometry(i, {
    depth: a,
    bevelEnabled: !0,
    bevelThickness: a * 0.45,
    bevelSize: Math.min(e * 0.18, 0.008),
    bevelSegments: 1,
    curveSegments: 4,
  });
  return (u.translate(0, 0, -a / 2), u);
}
function Ia(o, e, t, a = 8) {
  return new CylinderGeometry(o, e, t, a, 1);
}
function Ff(o, e) {
  let t = e,
    a = (c = 0.12, d = 0.016) => _e(Ia(d, d * 1.05, c, 8), { color: t.leatherDark }),
    n = (c, d = 0.024) => _e(new SphereGeometry(d, 8, 6), { color: t.metal, metal: 1, matrix: G.T(0, c, 0) }),
    s = (c, d, u = 0.025) =>
      _e(new BoxGeometry(c, u, 0.03), { color: t.metal, metal: 1, matrix: G.T(0, d, 0) }),
    i = (c, d = 0.017, u = -0.15) =>
      _e(Ia(d * 0.9, d, c, 8), { color: t.wood, matrix: G.T(0, u + c / 2, 0) }),
    r = (c, d) => _e(c, { color: t.metal, metal: 1, matrix: d }),
    l = (c, d = 0.34) => c.translate(0, -d, 0);
  switch (o) {
    case 'longsword':
    case 'shortsword':
    case 'greatsword':
    case 'dagger': {
      let c = { longsword: 0.82, shortsword: 0.55, greatsword: 1.15, dagger: 0.24 }[o],
        d = { longsword: 0.05, shortsword: 0.048, greatsword: 0.065, dagger: 0.034 }[o],
        u = o === 'greatsword' ? 0.26 : o === 'dagger' ? 0.09 : 0.13;
      return Et([
        r(ic(c, d, { point: 0.14 }), G.T(0, u / 2 + 0.02, 0)),
        s(o === 'dagger' ? 0.07 : d * 3.6, u / 2 + 0.012),
        _e(Ia(0.016, 0.017, u, 8), { color: t.leatherDark }),
        n(-u / 2 - 0.012, o === 'dagger' ? 0.016 : 0.022),
      ]);
    }
    case 'rapier':
      return Et([
        r(ic(0.9, 0.022, { point: 0.08, taper: 0.5, thick: 0.008 }), G.T(0, 0.08, 0)),
        r(new SphereGeometry(0.05, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.2), G.T(0, 0.075, 0)),
        r(new TorusGeometry(0.045, 0.005, 4, 12, Math.PI), G.mul(G.T(0, 0.02, 0), G.R(0, 90, 180))),
        a(0.11, 0.014),
        n(-0.065, 0.018),
      ]);
    case 'scimitar':
      return Et([
        r(ic(0.72, 0.055, { curve: 0.12, point: 0.1, taper: 0.1 }), G.T(0, 0.08, 0)),
        s(0.12, 0.068, 0.02),
        a(0.12),
        n(-0.07, 0.02),
      ]);
    case 'sickle':
      return Et([
        i(0.3, 0.015, -0.12),
        r(
          new TorusGeometry(0.13, 0.012, 3, 14, Math.PI * 1.1),
          G.mul(G.T(0.12, 0.2, 0), G.R(0, 0, 10), G.S(1, 1, 0.4)),
        ),
      ]);
    case 'handaxe':
    case 'battleaxe':
    case 'greataxe':
    case 'war_pick': {
      let c = { handaxe: 0.45, battleaxe: 0.75, greataxe: 1.15, war_pick: 0.7 }[o],
        d = c - 0.2,
        u = new Shape();
      if (o === 'war_pick')
        (u.moveTo(-0.03, -0.03),
          u.lineTo(0.22, -0.01),
          u.lineTo(0.24, 0),
          u.lineTo(0.22, 0.012),
          u.lineTo(-0.03, 0.03));
      else {
        let _ = o === 'greataxe' ? 0.2 : o === 'battleaxe' ? 0.15 : 0.1;
        (u.moveTo(-0.02, -0.035),
          u.lineTo(_ * 0.55, -0.05),
          u.quadraticCurveTo(_ * 1.1, -_ * 0.9, _ * 1.15, -_),
          u.quadraticCurveTo(_ * 1.35, 0, _ * 1.15, _),
          u.quadraticCurveTo(_ * 1.1, _ * 0.9, _ * 0.55, 0.05),
          u.lineTo(-0.02, 0.035));
      }
      let h = new ExtrudeGeometry(u, {
        depth: 0.018,
        bevelEnabled: !0,
        bevelThickness: 0.006,
        bevelSize: 0.006,
        bevelSegments: 1,
        curveSegments: 6,
      });
      h.translate(0, 0, -0.009);
      let p = o === 'greataxe' ? h.clone() : null,
        m = [i(c, o === 'greataxe' ? 0.02 : 0.017), r(h, G.T(0.015, d, 0))];
      return (
        p && m.push(r(p, G.mul(G.T(-0.015, d, 0), G.R(0, 180, 0)))),
        m.push(r(Ia(0.022, 0.022, 0.07, 8), G.T(0, d, 0))),
        Et(m)
      );
    }
    case 'mace':
    case 'morningstar':
    case 'light_hammer':
    case 'warhammer':
    case 'maul':
    case 'club':
    case 'greatclub': {
      let c = {
        mace: 0.6,
        morningstar: 0.65,
        light_hammer: 0.42,
        warhammer: 0.72,
        maul: 1.15,
        club: 0.55,
        greatclub: 0.95,
      }[o];
      if (o === 'club' || o === 'greatclub') {
        let h = o === 'club' ? 0.04 : 0.065;
        return _e(Ia(h, h * 0.45, c, 7), { color: t.wood, matrix: G.T(0, c / 2 - 0.12, 0), vary: 0.1 });
      }
      let d = c - 0.17,
        u = [i(c, 0.016)];
      if (o === 'mace') {
        u.push(r(new SphereGeometry(0.045, 8, 6), G.T(0, d, 0)));
        for (let h = 0; h < 6; h++)
          u.push(r(new BoxGeometry(0.075, 0.09, 0.012), G.mul(G.T(0, d, 0), G.R(0, h * 30, 0))));
      } else if (o === 'morningstar') {
        u.push(r(new SphereGeometry(0.06, 10, 8), G.T(0, d, 0)));
        let h = [
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
        for (let p of h) {
          let m = new Vector3(...p).normalize(),
            _ = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), m);
          u.push(
            r(
              new ConeGeometry(0.014, 0.05, 5),
              new Matrix4().compose(
                m
                  .clone()
                  .multiplyScalar(0.075)
                  .add(new Vector3(0, d, 0)),
                _,
                new Vector3(1, 1, 1),
              ),
            ),
          );
        }
      } else {
        let h = o === 'maul',
          p = h ? 0.24 : o === 'warhammer' ? 0.16 : 0.12,
          m = h ? 0.1 : 0.06;
        (u.push(r(new BoxGeometry(p, m, m), G.T(0, d, 0))),
          o === 'warhammer' &&
            u.push(r(new ConeGeometry(0.025, 0.1, 4), G.mul(G.T(-0.12, d, 0), G.R(0, 0, 90)))));
      }
      return Et(u);
    }
    case 'flail':
      return Et([
        i(0.45, 0.016),
        ...[0, 1, 2, 3].map((c) =>
          r(
            new TorusGeometry(0.014, 0.004, 4, 8),
            G.mul(G.T(0.02 * c, 0.32 + 0.025 * c, 0), G.R(0, c % 2 ? 90 : 0, 30)),
          ),
        ),
        r(new SphereGeometry(0.05, 8, 6), G.T(0.1, 0.42, 0)),
      ]);
    case 'quarterstaff':
      return l(
        Et([
          _e(Ia(0.02, 0.022, 1.7, 8), { color: t.wood, matrix: G.T(0, 0.35, 0), vary: 0.08 }),
          r(Ia(0.025, 0.025, 0.06, 8), G.T(0, 1.18, 0)),
          r(Ia(0.025, 0.025, 0.06, 8), G.T(0, -0.48, 0)),
        ]),
      );
    case 'spear':
    case 'javelin':
    case 'glaive':
    case 'halberd': {
      let c = { spear: 1.9, javelin: 1.35, glaive: 2, halberd: 2.05 }[o],
        d = [_e(Ia(0.016, 0.018, c, 8), { color: t.wood, matrix: G.T(0, c / 2 - 0.45, 0) })],
        u = c - 0.45;
      if (
        ((o === 'spear' || o === 'javelin') &&
          d.push(r(ic(o === 'spear' ? 0.26 : 0.18, 0.05, { point: 0.5, taper: 0.2 }), G.T(0, u, 0))),
        o === 'glaive' &&
          d.push(r(ic(0.5, 0.07, { curve: 0.08, point: 0.25, taper: 0.1 }), G.T(0, u - 0.05, 0))),
        o === 'halberd')
      ) {
        d.push(r(ic(0.3, 0.035, { point: 0.4 }), G.T(0, u, 0)));
        let h = new Shape();
        (h.moveTo(0, -0.07),
          h.quadraticCurveTo(0.18, -0.12, 0.2, -0.14),
          h.quadraticCurveTo(0.26, 0, 0.2, 0.14),
          h.quadraticCurveTo(0.18, 0.08, 0, 0.07));
        let p = new ExtrudeGeometry(h, { depth: 0.014, bevelEnabled: !1, curveSegments: 6 });
        (p.translate(0, 0, -0.007),
          d.push(r(p, G.T(0.01, u - 0.08, 0))),
          d.push(r(new ConeGeometry(0.02, 0.1, 4), G.mul(G.T(-0.06, u - 0.08, 0), G.R(0, 0, 90)))));
      }
      return Et(d);
    }
    case 'shortbow':
    case 'longbow':
      return bz(o === 'longbow' ? 1.55 : 1.05, t);
    case 'light_crossbow':
    case 'heavy_crossbow':
    case 'hand_crossbow':
      return vz(o === 'heavy_crossbow' ? 1.25 : o === 'hand_crossbow' ? 0.55 : 0.95, t);
    case 'dart':
      return Et([
        _e(Ia(0.004, 0.006, 0.18, 5), { color: t.wood, matrix: G.T(0, 0.05, 0) }),
        r(new ConeGeometry(0.007, 0.05, 5), G.T(0, 0.16, 0)),
      ]);
    case 'sling':
      return _e(new TorusGeometry(0.06, 0.006, 4, 10), {
        color: t.leather,
        matrix: G.mul(G.T(0, -0.05, 0), G.S(0.5, 1, 1)),
      });
    case 'wand':
      return Et([
        _e(Ia(0.008, 0.012, 0.3, 6), { color: t.woodDark, matrix: G.T(0, 0.08, 0) }),
        _e(new OctahedronGeometry(0.018), { color: '#9fd8ff', glow: 1, matrix: G.T(0, 0.24, 0) }),
      ]);
    case 'arcane_staff':
      return l(
        Et([
          _e(Ia(0.018, 0.024, 1.75, 7), { color: t.woodDark, matrix: G.T(0, 0.38, 0), vary: 0.1 }),
          ...[0, 1, 2].map((c) =>
            _e(new ConeGeometry(0.014, 0.16, 4), {
              color: t.woodDark,
              matrix: G.mul(G.T(0, 1.27, 0), G.R(0, c * 120, 25), G.T(0, 0.06, 0)),
            }),
          ),
          _e(new OctahedronGeometry(0.045), {
            color: '#8fd0ff',
            glow: 1,
            matrix: G.mul(G.T(0, 1.33, 0), G.S(0.8, 1.3, 0.8)),
          }),
        ]),
      );
    case 'druid_staff':
      return l(
        Et([
          _e(Ia(0.02, 0.026, 1.7, 7), { color: '#5a4630', matrix: G.T(0, 0.37, 0), vary: 0.12 }),
          _e(new TorusGeometry(0.07, 0.016, 5, 10, Math.PI * 1.4), {
            color: '#5a4630',
            matrix: G.mul(G.T(0, 1.27, 0), G.R(0, 0, 120)),
          }),
          ...[0, 1, 2, 3, 4].map((c) =>
            _e(new SphereGeometry(0.03, 5, 4), {
              color: c % 2 ? '#4f7a32' : '#6a9a3a',
              matrix: G.mul(
                G.T(Math.cos(c * 1.3) * 0.06, 1.25 + (c % 3) * 0.04, Math.sin(c * 1.3) * 0.05),
                G.S(1, 0.5, 1.6),
              ),
            }),
          ),
        ]),
      );
    case 'mug':
      return Et([
        _e(Ia(0.045, 0.04, 0.12, 10), { color: t.wood, matrix: G.T(0.02, 0, 0), vary: 0.08 }),
        _e(new TorusGeometry(0.046, 0.006, 4, 10), {
          color: t.metalDark,
          metal: 1,
          matrix: G.mul(G.T(0.02, 0.04, 0), G.R(90, 0, 0)),
        }),
        _e(new TorusGeometry(0.03, 0.008, 4, 8, Math.PI), {
          color: t.wood,
          matrix: G.mul(G.T(-0.03, 0, 0), G.R(0, 0, 90)),
        }),
        _e(new CircleGeometry(0.04, 10), {
          color: '#e8dcb0',
          matrix: G.mul(G.T(0.02, 0.058, 0), G.R(-90, 0, 0)),
        }),
      ]);
    case 'crook':
      return l(
        Et([
          _e(Ia(0.016, 0.02, 1.55, 7), { color: '#6a5034', matrix: G.T(0, 0.45, 0), vary: 0.1 }),
          _e(new TorusGeometry(0.08, 0.016, 5, 12, Math.PI * 1.2), {
            color: '#6a5034',
            matrix: G.mul(G.T(0.08, 1.22, 0), G.R(0, 0, -10)),
          }),
        ]),
        0.28,
      );
    case 'holy_symbol':
      return Et([
        _e(new CircleGeometry(0.05, 12), { color: t.gold, metal: 1 }),
        _e(new TorusGeometry(0.05, 0.008, 4, 12), { color: t.gold, metal: 1 }),
      ]);
    default:
      return null;
  }
}
function bz(o, e) {
  let t = o / 2,
    a = new CatmullRomCurve3([
      new Vector3(0, -t, -0.12),
      new Vector3(0, -t * 0.55, -0.02),
      new Vector3(0, 0, 0.04),
      new Vector3(0, t * 0.55, -0.02),
      new Vector3(0, t, -0.12),
    ]),
    n = new TubeGeometry(a, 16, 0.012, 5, !1),
    s = new BufferGeometry().setFromPoints([new Vector3(0, -t, -0.12), new Vector3(0, t, -0.12)]);
  return Et([
    _e(n, { color: e.wood }),
    _e(Ia(0.0022, 0.0022, o * 0.98, 3), { color: e.string, matrix: G.T(0, 0, -0.12) }),
    _e(Ia(0.017, 0.017, 0.12, 6), { color: e.leatherDark, matrix: G.T(0, 0, 0.04) }),
  ]);
}
function vz(o, e) {
  let t = o / 0.95;
  return Et([
    _e(new BoxGeometry(0.045 * t, 0.05 * t, 0.7 * t), { color: e.wood, matrix: G.T(0, 0, 0.22 * t) }),
    _e(new TorusGeometry(0.3 * t, 0.012 * t, 4, 12, Math.PI * 0.8), {
      color: e.metalDark,
      metal: 1,
      matrix: G.mul(G.T(0, 0.02, 0.55 * t), G.R(90, 0, 0), G.R(0, 0, 18)),
    }),
    _e(Ia(0.002, 0.002, 0.5 * t, 3), {
      color: e.string,
      matrix: G.mul(G.T(0, 0.03, 0.42 * t), G.R(0, 0, 90)),
    }),
    _e(new BoxGeometry(0.03 * t, 0.07 * t, 0.05 * t), {
      color: e.metalDark,
      metal: 1,
      matrix: G.T(0, -0.04, 0.05 * t),
    }),
  ]);
}
function Jb(o, e) {
  if (o === 'redondo' || o === 'tosco') {
    let i = o === 'tosco' ? 0.24 : 0.3,
      r = _e(Ia(i, i, 0.025, 16), {
        color: o === 'tosco' ? '#5a4a36' : e.cloth1,
        matrix: G.R(90, 0, 0),
        vary: 0.08,
      });
    return Et([
      r,
      _e(new TorusGeometry(i, 0.012, 4, 20), {
        color: o === 'tosco' ? e.woodDark : e.metal,
        metal: o === 'tosco' ? 0 : 1,
      }),
      _e(new SphereGeometry(0.06, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), {
        color: e.metal,
        metal: 1,
        matrix: G.R(90, 0, 0),
      }),
    ]);
  }
  let t = new Shape();
  (t.moveTo(0, 0.36),
    t.quadraticCurveTo(0.24, 0.36, 0.25, 0.2),
    t.quadraticCurveTo(0.25, -0.12, 0, -0.42),
    t.quadraticCurveTo(-0.25, -0.12, -0.25, 0.2),
    t.quadraticCurveTo(-0.24, 0.36, 0, 0.36));
  let a = new ExtrudeGeometry(t, {
      depth: 0.02,
      bevelEnabled: !0,
      bevelThickness: 0.012,
      bevelSize: 0.018,
      bevelSegments: 1,
      curveSegments: 8,
    }),
    n = [_e(a, { color: o === 'sol' ? '#e8dcc0' : e.cloth1 })],
    s = new ExtrudeGeometry(t, { depth: 0.012, bevelEnabled: !1, curveSegments: 8 });
  if (
    (n.push(_e(s, { color: e.metal, metal: 1, matrix: G.mul(G.T(0, 0, -0.008), G.S(1.06, 1.05, 1)) })),
    o === 'sol')
  ) {
    n.push(_e(new CircleGeometry(0.08, 14), { color: e.gold, metal: 1, matrix: G.T(0, 0.04, 0.034) }));
    for (let i = 0; i < 12; i++)
      n.push(
        _e(new ConeGeometry(0.018, 0.08, 3), {
          color: e.gold,
          metal: 1,
          matrix: G.mul(G.T(0, 0.04, 0.034), G.R(0, 0, i * 30), G.T(0, 0.12, 0)),
        }),
      );
  } else
    (n.push(_e(new BoxGeometry(0.05, 0.6, 0.01), { color: e.cloth2, matrix: G.T(0, -0.02, 0.034) })),
      n.push(_e(new BoxGeometry(0.4, 0.05, 0.01), { color: e.cloth2, matrix: G.T(0, 0.12, 0.034) })));
  return Et(n);
}
function w2(o) {
  let e = [_e(Ia(0.05, 0.045, 0.5, 8), { color: o.leather, matrix: G.T(0, 0.25, 0) })];
  for (let t = 0; t < 6; t++) {
    let a = Math.cos(t * 2.1) * 0.025,
      n = Math.sin(t * 2.1) * 0.025;
    (e.push(_e(Ia(0.004, 0.004, 0.2, 3), { color: o.wood, matrix: G.T(a, 0.58, n) })),
      e.push(
        _e(new BoxGeometry(0.003, 0.05, 0.02), {
          color: t % 2 ? '#e8e0d0' : '#a03020',
          matrix: G.T(a, 0.66, n),
        }),
      ));
  }
  return Et(e);
}
function T2(o) {
  return Et([
    _e(new SphereGeometry(0.15, 10, 8), { color: '#8a5a2a', matrix: G.mul(G.T(0, 0, 0), G.S(1, 1.25, 0.5)) }),
    _e(new BoxGeometry(0.045, 0.38, 0.025), { color: o.woodDark, matrix: G.T(0, 0.33, 0.02) }),
    _e(new BoxGeometry(0.06, 0.1, 0.02), {
      color: o.woodDark,
      matrix: G.mul(G.T(0, 0.55, 0), G.R(-25, 0, 0)),
    }),
    _e(new CircleGeometry(0.035, 10), { color: '#1e140c', matrix: G.T(0, 0.04, 0.077) }),
  ]);
}
function M2(o) {
  return Et([
    _e(new BoxGeometry(0.3, 0.42, 0.2), { color: o.leather, vary: 0.06 }),
    _e(new CylinderGeometry(0.08, 0.08, 0.34, 8), {
      color: '#8a7a5a',
      matrix: G.mul(G.T(0, 0.26, 0), G.R(0, 0, 90)),
    }),
    _e(new CylinderGeometry(0.06, 0.05, 0.05, 8), {
      color: o.metalDark,
      metal: 1,
      matrix: G.T(0.17, -0.05, 0.02),
    }),
    _e(new BoxGeometry(0.22, 0.12, 0.05), { color: o.leatherDark, matrix: G.T(0, -0.08, -0.12) }),
  ]);
}
function E2(o, e) {
  let { x: t, y: a, z: n } = o;
  return Et([
    _e(new TorusGeometry(0.017, 0.0025, 4, 12), { color: e.gold, metal: 1, matrix: G.T(t + 0.031, a, n) }),
    _e(new TorusGeometry(0.017, 0.0025, 4, 12), { color: e.gold, metal: 1, matrix: G.T(t - 0.031, a, n) }),
    _e(new BoxGeometry(0.03, 0.004, 0.004), { color: e.gold, metal: 1, matrix: G.T(t, a + 0.004, n) }),
  ]);
}
function S2(o) {
  return Et([
    _e(new BoxGeometry(0.16, 0.2, 0.05), { color: '#5a2a3a' }),
    _e(new BoxGeometry(0.15, 0.185, 0.052), { color: '#e8dcc0', matrix: G.T(0.008, 0, 0) }),
    _e(new BoxGeometry(0.03, 0.04, 0.056), { color: o.gold, metal: 1, matrix: G.T(-0.06, 0, 0) }),
  ]);
}
function k2(o) {
  return _e(new SphereGeometry(0.06, 7, 5), { color: o.leather, matrix: G.S(1, 1.1, 0.6) });
}
function A2(o, e, t, { size: a = 1, color: n } = {}) {
  let s = n || t.metal,
    i = [];
  for (let r = 0; r < 3; r++) {
    let l = (0.11 - r * 0.012) * a,
      c = new SphereGeometry(l, 10, 5, 0, Math.PI * 2, 0, Math.PI * 0.42);
    i.push(
      _e(c, {
        color: r === 0 ? s : s.clone().multiplyScalar(0.85),
        metal: 1,
        matrix: G.mul(
          G.T(e.x + o * r * 0.035 * a, e.y + 0.03 - r * 0.035 * a, e.z),
          G.R(0, 0, -o * (28 + r * 14)),
          G.S(1, 0.75, 1.05),
        ),
      }),
    );
  }
  return (
    i.push(
      _e(new TorusGeometry(0.107 * a, 0.007, 4, 14, Math.PI), {
        color: t.gold,
        metal: 1,
        matrix: G.mul(
          G.T(e.x, e.y + 0.03, e.z),
          G.R(0, 0, -o * 28),
          G.T(0, 0.02 * a, 0),
          G.S(1, 1, 1.05),
          G.R(0, o * 90, 0),
          G.R(90, 0, 0),
        ),
      }),
    ),
    Et(i)
  );
}
function R2(o, e, { color: t, plate: a = !0 } = {}) {
  let n = t || e.metal,
    s = new SphereGeometry(1, 14, 8, -Math.PI / 2, Math.PI, Math.PI * 0.18, Math.PI * 0.6),
    i = new SphereGeometry(1, 14, 8, Math.PI / 2, Math.PI, Math.PI * 0.18, Math.PI * 0.6),
    r = [
      _e(s, { color: n, metal: 1, matrix: G.mul(G.T(0, o.y, o.cz), G.S(o.w, o.h, o.front)) }),
      _e(i, {
        color: n.clone().multiplyScalar(0.9),
        metal: 1,
        matrix: G.mul(G.T(0, o.y, o.cz), G.S(o.w, o.h, o.back)),
      }),
    ];
  if (a)
    for (let l = 0; l < 3; l++) {
      let c = o.y - o.h * 0.62 - l * 0.045;
      r.push(
        _e(new CylinderGeometry(o.w * (0.92 + l * 0.05), o.w * (0.95 + l * 0.06), 0.05, 14, 1, !0), {
          color: n.clone().multiplyScalar(0.9 - l * 0.05),
          metal: 1,
          matrix: G.mul(G.T(0, c, o.cz), G.S(1, 1, o.front / o.w)),
        }),
      );
    }
  return Et(r);
}
function Zb(o, e, t, a, n, { color: s, metal: i = 1 } = {}) {
  let r = new Vector3().subVectors(e, o),
    l = r.length(),
    c = new CylinderGeometry(a, t, l, 10, 1, !0),
    d = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), r.normalize()),
    u = new Matrix4().compose(o.clone().add(e).multiplyScalar(0.5), d, new Vector3(1, 1, 1));
  return _e(c, { color: s || n.metal, metal: i, matrix: u });
}
function C2(o, e, t, { color: a } = {}) {
  let n = a || t.metal,
    { x: s, y: i, z: r, r: l } = e,
    c = [];
  if (o === 'casco' || o === 'yelmo')
    (c.push(
      _e(new SphereGeometry(l * 1.12, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), {
        color: n,
        metal: 1,
        matrix: G.mul(G.T(s, i - l * 0.05, r - l * 0.05), G.S(1, 1.05, 1.1)),
      }),
    ),
      c.push(
        _e(new TorusGeometry(l * 1.12, l * 0.08, 4, 18), {
          color: n.clone().multiplyScalar(0.8),
          metal: 1,
          matrix: G.mul(G.T(s, i - l * 0.18, r - l * 0.05), G.R(90, 0, 0), G.S(1, 1.1, 1)),
        }),
      ),
      o === 'casco'
        ? c.push(
            _e(new BoxGeometry(l * 0.16, l * 0.75, l * 0.1), {
              color: n,
              metal: 1,
              matrix: G.T(s, i - l * 0.5, r + l * 1.12),
            }),
          )
        : (c.push(
            _e(new CylinderGeometry(l * 1.1, l * 1.08, l * 1.15, 14, 1, !0), {
              color: n,
              metal: 1,
              matrix: G.mul(G.T(s, i - l * 0.75, r - l * 0.03), G.S(1, 1, 1.12)),
            }),
          ),
          c.push(
            _e(new BoxGeometry(l * 1.1, l * 0.08, l * 0.08), {
              color: '#101010',
              matrix: G.T(s, i - l * 0.5, r + l * 1.2),
            }),
          ),
          c.push(
            _e(new BoxGeometry(l * 0.08, l * 0.6, l * 0.08), {
              color: n,
              metal: 1,
              matrix: G.T(s, i - l * 0.75, r + l * 1.22),
            }),
          )));
  else if (o === 'corona') {
    c.push(
      _e(new CylinderGeometry(l * 1.05, l * 1.02, l * 0.28, 14, 1, !0), {
        color: t.gold,
        metal: 1,
        matrix: G.T(s, i + l * 0.15, r - l * 0.05),
      }),
    );
    for (let d = 0; d < 8; d++)
      c.push(
        _e(new ConeGeometry(l * 0.12, l * 0.38, 4), {
          color: t.gold,
          metal: 1,
          matrix: G.mul(G.T(s, i + l * 0.42, r - l * 0.05), G.R(0, d * 45, 0), G.T(0, 0, l * 1.02)),
        }),
      );
  } else if (o === 'mago') {
    let d = i + l * 0.78,
      u = [];
    u.push(
      _e(new CylinderGeometry(l * 1.85, l * 1.85, l * 0.06, 18), {
        color: t.cloth1,
        matrix: G.T(s, d, r - l * 0.05),
      }),
    );
    let h = new ConeGeometry(l * 1.05, l * 3.2, 14, 4, !0),
      p = h.attributes.position;
    for (let _ = 0; _ < p.count; _++) {
      let b = p.getY(_) / (l * 3.2) + 0.5;
      p.setX(_, p.getX(_) - b * b * l * 0.9);
    }
    (u.push(_e(h, { color: t.cloth1, matrix: G.T(s, d + l * 1.6, r - l * 0.05) })),
      u.push(
        _e(new CylinderGeometry(l * 1.06, l * 1.06, l * 0.18, 14, 1, !0), {
          color: t.cloth2,
          matrix: G.T(s, d + l * 0.1, r - l * 0.05),
        }),
      ));
    let m = Et(u);
    (m.applyMatrix4(G.mul(G.T(s, i, r), G.R(-12, 0, 0), G.T(-s, -i, -r))), c.push(m));
  } else if (o === 'chambergo') {
    (c.push(
      _e(new CylinderGeometry(l * 1.9, l * 1.9, l * 0.05, 16), {
        color: t.cloth1,
        matrix: G.mul(G.T(s, i + l * 0.45, r - l * 0.05), G.R(-8, 0, 6)),
      }),
    ),
      c.push(
        _e(new SphereGeometry(l * 1.08, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), {
          color: t.cloth1,
          matrix: G.mul(G.T(s, i + l * 0.45, r - l * 0.05), G.S(1, 0.7, 1)),
        }),
      ));
    let d = new SphereGeometry(l * 0.25, 6, 4);
    c.push(
      _e(d, {
        color: '#c03030',
        matrix: G.mul(G.T(s + l * 0.7, i + l * 1, r - l * 0.4), G.R(0, 0, -30), G.S(0.5, 3, 0.25)),
      }),
    );
  } else if (o === 'diadema') {
    let d = Et([
      _e(new TorusGeometry(l * 1.03, l * 0.05, 4, 18), {
        color: t.gold,
        metal: 1,
        matrix: G.mul(G.T(s, i + l * 0.42, r), G.R(90, 0, 0)),
      }),
      _e(new OctahedronGeometry(l * 0.12), {
        color: '#e8c050',
        glow: 0.6,
        matrix: G.T(s, i + l * 0.47, r + l * 1.05),
      }),
    ]);
    (d.applyMatrix4(G.mul(G.T(s, i, r), G.R(-14, 0, 0), G.T(-s, -i, -r))), c.push(d));
  } else if (o === 'astas') {
    for (let d of [-1, 1]) {
      let u = new CatmullRomCurve3([
        new Vector3(s + d * l * 0.6, i + l * 0.4, r),
        new Vector3(s + d * l * 1.1, i + l * 1.1, r - l * 0.2),
        new Vector3(s + d * l * 1.3, i + l * 1.8, r - l * 0.1),
      ]);
      (c.push(_e(new TubeGeometry(u, 6, l * 0.07, 4), { color: '#8a7050' })),
        c.push(
          _e(new ConeGeometry(l * 0.06, l * 0.5, 4), {
            color: '#8a7050',
            matrix: G.mul(G.T(s + d * l * 1.15, i + l * 1.2, r - l * 0.1), G.R(0, 0, -d * 50)),
          }),
        ));
    }
    c.push(
      _e(new TorusGeometry(l * 1.02, l * 0.05, 4, 18), {
        color: '#5a4630',
        matrix: G.mul(G.T(s, i + l * 0.2, r), G.R(90, 0, 0)),
      }),
    );
  }
  return Et(c);
}
function P2({
  yTop: o,
  yBottom: e,
  rTop: t,
  rBottom: a,
  cz: n = -0.01,
  depth: s = 0.85,
  open: i = 0,
  color: r,
  segs: l = 18,
  rings: c = 6,
}) {
  let d = new CylinderGeometry(t, a, o - e, l, c, !0, i * Math.PI, Math.PI * 2 * (1 - i));
  (d.rotateY(Math.PI / 2 + i * Math.PI), d.translate(0, (o + e) / 2, n), d.scale(1, 1, s));
  let u = d.attributes.position;
  for (let h = 0; h < u.count; h++) {
    let p = (o - u.getY(h)) / (o - e),
      m = Math.atan2(u.getZ(h), u.getX(h)),
      _ = 1 + Math.sin(m * 7) * 0.035 * p;
    (u.setX(h, u.getX(h) * _), u.setZ(h, u.getZ(h) * _));
  }
  return (d.computeVertexNormals(), _e(d, { color: r, vary: 0.04 }));
}
function z2({
  y0: o,
  y1: e,
  w0: t,
  w1: a,
  z: n,
  bulge: s = 0.02,
  color: i,
  segs: r = 6,
  rings: l = 8,
  back: c = !1,
}) {
  let d = new PlaneGeometry(1, 1, r, l),
    u = d.attributes.position;
  for (let p = 0; p < u.count; p++) {
    let m = u.getX(p) + 0.5,
      _ = u.getY(p) + 0.5,
      b = a + (t - a) * _,
      f = (m - 0.5) * b,
      v = e + (o - e) * _,
      x = n + (c ? -1 : 1) * (Math.sin(m * Math.PI) * s + (1 - _) * s * 0.6);
    u.setXYZ(p, f, v, x);
  }
  (c && d.rotateY(0), d.computeVertexNormals());
  let h = _e(d, { color: i, vary: 0.03 });
  if (c) {
    let p = h.attributes.position;
    for (let m = 0; m < p.count; m += 3)
      for (let _ of ['position', 'normal', 'color', 'metal']) {
        let b = h.attributes[_],
          f = b.itemSize;
        for (let v = 0; v < f; v++) {
          let x = b.array[(m + 1) * f + v];
          ((b.array[(m + 1) * f + v] = b.array[(m + 2) * f + v]), (b.array[(m + 2) * f + v] = x));
        }
      }
    h.computeVertexNormals();
  }
  return h;
}
function L2({ y: o, rx: e, rz: t, cz: a = -0.01, color: n, thick: s = 0.06, leaves: i = !1 }) {
  let r = new TorusGeometry(1, 0.38, 6, 22);
  r.rotateX(Math.PI / 2);
  let l = r.attributes.position;
  for (let c = 0; c < l.count; c++) {
    let d = l.getX(c),
      u = l.getY(c),
      h = l.getZ(c),
      p = Math.atan2(h, d),
      m = 1 + Math.sin(p * 9 + u * 5) * 0.12 + Math.sin(p * 23) * 0.06;
    l.setXYZ(c, d * e * m, o + u * s * (h < 0 ? 1.3 : 0.9) - (h < 0 ? 0.03 : 0), h * t * m + a);
  }
  return (r.computeVertexNormals(), _e(r, { color: n, vary: i ? 0.35 : 0.18 }));
}
function D2({ y: o, rx: e, rz: t, cz: a, P: n, color: s }) {
  let i = new CylinderGeometry(1, 1, 0.045, 18, 1, !0);
  return (
    i.scale(e, 1, t),
    i.translate(0, o, a),
    Et([
      _e(i, { color: s || n.leatherDark }),
      _e(new BoxGeometry(0.05, 0.05, 0.012), { color: n.gold, metal: 1, matrix: G.T(0, o, a + t + 0.004) }),
    ])
  );
}
function yz(o, e, t) {
  let a = o.y,
    n = o[t];
  if (e <= a[0]) return n[0];
  for (let s = 0; s < a.length - 1; s++)
    if (e <= a[s + 1]) return n[s] + ((n[s + 1] - n[s]) * (e - a[s])) / (a[s + 1] - a[s]);
  return n[n.length - 1];
}
function Qb({
  g: o = 'm',
  top: e,
  hip: t,
  bottom: a,
  w0: n = 0.27,
  w1: s = 0.32,
  out: i = 0.022,
  color: r,
  front: l = !0,
  back: c = !0,
  split: d = !0,
}) {
  let u = _2[o] || _2.m,
    h = [],
    p = 12,
    m = 6,
    _ = [];
  (l && _.push('front'), c && _.push('back'));
  for (let b of _) {
    let f = b === 'front' ? 1 : -1,
      v = d
        ? [
            [-1, -0.012],
            [1, 0.012],
          ]
        : [[0, 0]];
    for (let [x, g] of v) {
      let y = [],
        w = [];
      for (let E = 0; E <= p; E++) {
        let S = E / p,
          z = e + (a - e) * S,
          D = n + (s - n) * Math.max(0, z < t ? (t - z) / (t - a) : 0),
          M = yz(u, Math.min(z, t + 0.02), b),
          R = Math.max(0, t - z),
          A = M + f * (i + R * 0.12);
        for (let P = 0; P <= m; P++) {
          let I = P / m,
            U;
          x === 0 || z > t
            ? (U = (I - 0.5) * D)
            : (U = x < 0 ? -D / 2 + I * (D / 2 - Math.abs(g)) : Math.abs(g) + I * (D / 2 - Math.abs(g)));
          let j = Math.abs(U) / (D / 2),
            X = A - f * j * j * 0.035;
          y.push(U, z, X);
        }
      }
      for (let E = 0; E < p; E++)
        for (let S = 0; S < m; S++) {
          let z = E * (m + 1) + S,
            D = z + 1,
            M = z + m + 1,
            R = M + 1;
          f > 0 ? w.push(z, M, D, D, M, R) : w.push(z, D, M, D, R, M);
        }
      let k = new BufferGeometry();
      (k.setAttribute('position', new Float32BufferAttribute(y, 3)), k.setIndex(w), k.computeVertexNormals());
      let T = (E) => {
        if (E.y > e - 0.12) return [['spine_03', 1]];
        if (E.y > t + 0.12)
          return [
            ['spine_02', 0.5],
            ['spine_01', 0.5],
          ];
        if (E.y > t - 0.04) return [['pelvis', 1]];
        let S = Math.min(1, (t - 0.04 - E.y) / 0.35);
        if (!d)
          return [
            ['pelvis', 1 - S * 0.5],
            ['thigh_l', S * 0.25],
            ['thigh_r', S * 0.25],
          ];
        let z = E.x > 0 ? 'thigh_l' : 'thigh_r';
        return [
          ['pelvis', 1 - S * 0.75],
          [z, S * 0.75],
        ];
      };
      h.push({ geometry: _e(k, { color: r, vary: 0.03 }), weights: T });
    }
  }
  return h;
}
const Yb = MathUtils.degToRad;
const G = {
  T: (o, e, t) => new Matrix4().makeTranslation(o, e, t),
  R: (o, e, t) => new Matrix4().makeRotationFromEuler(new Euler(Yb(o), Yb(e), Yb(t))),
  S: (o, e = o, t = o) => new Matrix4().makeScale(o, e, t),
  mul: (...o) => o.reduce((e, t) => e.multiply(t), new Matrix4()),
};
const _2 = {
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

export { A2, C2, D2, E2, Et, Ff, G, Jb, Kb, L2, M2, P2, Qb, R2, S2, T2, Zb, _e, k2, w2, z2 };
