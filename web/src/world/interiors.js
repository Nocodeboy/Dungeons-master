// world/interiors.js
// Reconstruido de publicado/juego.js (módulo __esm «I1»). Nombres locales aún minificados.

import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  Euler,
  Group,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { loadProp, pbrMaterial } from '../assets.js';
import { Hu, gn } from './kit.js';
import { Le } from './ground.js';
import { qt, ot, Nu, zt, fo } from './grid.js';

function V3() {
  if (Qm) return Qm;
  let o = (t, a) => ((t.name = a), t),
    e = (t, a, n = {}) => o(new MeshStandardMaterial({ color: t, roughness: 0.85, ...n }), a);
  return (
    (Qm = {
      plaster: o(pbrMaterial('plastered_stone_wall', { tint: 15260356, ao: !1 }), 'revoco'),
      timber: o(pbrMaterial('medieval_wood', { tint: 7231041, ao: !1 }), 'viga'),
      panel: o(pbrMaterial('rough_wood', { tint: 8413247, ao: !1 }), 'tablas'),
      stone: o(pbrMaterial('castle_wall_varriation', { tint: 13616050, ao: !1 }), 'piedra_hogar'),
      slate: o(pbrMaterial('slate_floor', { tint: 9210510, ao: !1 }), 'pizarra'),
      barWood: o(pbrMaterial('rough_wood', { tint: 6177065, ao: !1 }), 'barra'),
      barTop: o(pbrMaterial('medieval_wood', { tint: 8017976, ao: !1 }), 'tablero'),
      soot: e(1314057, 'hollin', { roughness: 1 }),
      iron: e(2894118, 'hierro', { metalness: 0.7, roughness: 0.5 }),
      bark: e(4863526, 'corteza', { roughness: 0.95 }),
      logEnd: e(11569759, 'tocon'),
      green: e(2048038, 'vidrio_verde', { roughness: 0.25 }),
      amber: e(6960144, 'vidrio_ambar', { roughness: 0.25 }),
      clay: e(10115642, 'barro_cocido'),
    }),
    Qm
  );
}
function L1(o, e, t, a = 1) {
  let n = new BoxGeometry(o, e, t),
    s = n.getAttribute('uv'),
    i = [
      [t, e],
      [t, e],
      [o, t],
      [o, t],
      [o, e],
      [o, e],
    ];
  for (let r = 0; r < 6; r++)
    for (let l = 0; l < 4; l++) {
      let c = r * 4 + l;
      s.setXY(c, (s.getX(c) * i[r][0]) / a, (s.getY(c) * i[r][1]) / a);
    }
  return n;
}
function Ft(o, e, t, a, n, s, i, r, l = 0, c = 1) {
  o.addGeometry(L1(t, a, n, c).translate(0, a / 2, 0), e, qo(s, i, r, l));
}
function n9(o = ['#6b2a1f', '#c9a25e', '#2f3a52']) {
  let e = document.createElement('canvas');
  ((e.width = 256), (e.height = 384));
  let t = e.getContext('2d'),
    [a, n, s] = o;
  ((t.fillStyle = a),
    t.fillRect(0, 0, 256, 384),
    (t.strokeStyle = n),
    (t.lineWidth = 6),
    t.strokeRect(14, 14, 228, 356),
    (t.lineWidth = 2),
    t.strokeRect(26, 26, 204, 332),
    (t.fillStyle = s));
  for (let l = 0; l < 4; l++) {
    let c = 70 + l * 82;
    (t.beginPath(),
      t.moveTo(128, c - 34),
      t.lineTo(178, c),
      t.lineTo(128, c + 34),
      t.lineTo(78, c),
      t.closePath(),
      t.fill(),
      (t.strokeStyle = n),
      t.stroke());
  }
  let i = t.getImageData(0, 0, 256, 384);
  for (let l = 0; l < i.data.length; l += 4) {
    let c = Math.floor(l / 4 / 256),
      d = (Math.random() - 0.5) * 22 + (c % 3 === 0 ? -8 : 0);
    for (let u = 0; u < 3; u++) i.data[l + u] = Math.max(0, Math.min(255, i.data[l + u] + d));
  }
  (t.putImageData(i, 0, 0), (t.strokeStyle = '#d8cbb0'), (t.lineWidth = 1));
  for (let l = 16; l < 240; l += 4)
    (t.beginPath(),
      t.moveTo(l, 0),
      t.lineTo(l + (Math.random() - 0.5) * 2, 10),
      t.moveTo(l, 384),
      t.lineTo(l + (Math.random() - 0.5) * 2, 374),
      t.stroke());
  let r = new CanvasTexture(e);
  return ((r.colorSpace = SRGBColorSpace), (r.anisotropy = 4), r);
}
function o9() {
  if (e0) return e0;
  let o = document.createElement('canvas');
  ((o.width = 64), (o.height = 96));
  let e = o.getContext('2d'),
    t = e.createLinearGradient(0, 0, 0, 96);
  (t.addColorStop(0, '#d8e8f4'),
    t.addColorStop(1, '#8fb0c8'),
    (e.fillStyle = t),
    e.fillRect(0, 0, 64, 96),
    (e.strokeStyle = '#2a2622'),
    (e.lineWidth = 2));
  for (let n = 0; n <= 64; n += 16) (e.beginPath(), e.moveTo(n, 0), e.lineTo(n + 0.01, 96), e.stroke());
  for (let n = 0; n <= 96; n += 16) (e.beginPath(), e.moveTo(0, n), e.lineTo(64, n), e.stroke());
  let a = new CanvasTexture(o);
  return (
    (a.colorSpace = SRGBColorSpace),
    (e0 = new MeshStandardMaterial({
      map: a,
      emissive: 16777215,
      emissiveMap: a,
      emissiveIntensity: 0.55,
      roughness: 0.2,
      name: 'ventana_dia',
    })),
    e0
  );
}
function s9(o = 0.3) {
  let e = [
    [0, 0],
    [0.045, 0],
    [0.05, 0.01],
    [0.05, 0.55],
    [0.03, 0.7],
    [0.016, 0.76],
    [0.016, 0.95],
    [0.02, 0.97],
    [0.014, 1],
    [0, 1],
  ].map(([t, a]) => new Vector2(t * o * 2.2, a * o));
  return new LatheGeometry(e, 8);
}
async function $3(o) {
  let { scene: e, map: t, level: a, ground: n, fx: s } = o,
    i = o.static,
    r = V3(),
    l = a.interior?.height ?? 3.4,
    c = o.rnd,
    d = new Group();
  ((d.name = 'interior'), e.add(d));
  let u = new Vector3(),
    h = new Set();
  for (let E of a.exits || []) for (let S of E.cells) h.add(zt(S[0], S[1]));
  let p = 1 / 0,
    m = -1 / 0,
    _ = 1 / 0,
    b = -1 / 0;
  t.each((E, S, z) => {
    z === '#' ||
      z === ' ' ||
      h.has(zt(E, S)) ||
      (qt(E, S, u),
      (p = Math.min(p, u.x - ot / 2)),
      (m = Math.max(m, u.x + ot / 2)),
      (_ = Math.min(_, u.z - Nu * ot)),
      (b = Math.max(b, u.z + Nu * ot)));
  });
  let f = { x0: p, x1: m, z0: _, z1: b },
    v = a.decor || [],
    x = (E) => {
      let S = qt(E.cell[0], E.cell[1]);
      return (E.offset && ((S.x += E.offset[0] * ot), (S.z += E.offset[1] * ot)), S);
    },
    g = {
      n: { n: new Vector3(0, 0, -1), u0: p, u1: m, fixed: _, along: 'x' },
      s: { n: new Vector3(0, 0, 1), u0: p, u1: m, fixed: b, along: 'x' },
      w: { n: new Vector3(-1, 0, 0), u0: _, u1: b, fixed: p, along: 'z' },
      e: { n: new Vector3(1, 0, 0), u0: _, u1: b, fixed: m, along: 'z' },
    },
    y = (E, S, z = 0) =>
      E.along === 'x' ? new Vector3(S, 0, E.fixed + E.n.z * z) : new Vector3(E.fixed + E.n.x * z, 0, S),
    w = (E) => (E.along === 'x' ? 0 : Math.PI / 2);
  for (let E of Object.values(g)) E.open = [];
  for (let E of a.exits || [])
    for (let S of E.cells) {
      qt(S[0], S[1], u);
      let z = { n: Math.abs(u.z - _), s: Math.abs(u.z - b), w: Math.abs(u.x - p), e: Math.abs(u.x - m) },
        D = Object.keys(z).sort((A, P) => z[A] - z[P])[0],
        M = g[D],
        R = M.along === 'x' ? u.x : u.z;
      M.open.push({ a: R - 0.68, b: R + 0.68, v0: 0, v1: 2.25, door: !0 });
    }
  for (let E of v.filter((S) => S.key === 'window')) {
    let S = g[E.side || 'n'],
      z = x(E),
      D = S.along === 'x' ? z.x : z.z;
    S.open.push({ a: D - 0.55, b: D + 0.55, v0: 1, v1: 2.25, window: !0 });
  }
  let k = {};
  for (let [E, S] of Object.entries(g)) {
    let z = new gn({ contactH: 0.8, contactMin: 0.72, groundAt: () => 0, finish: { wind: 0 } }),
      D = new gn({ contactH: 0.5, contactMin: 0.7, groundAt: () => 0, finish: { wind: 0 } }),
      M = w(S),
      R = S.u0 - Ba,
      A = S.u1 + Ba,
      P = S.open.sort((K, ve) => K.a - ve.a),
      I = [R, A];
    for (let K of P) I.push(K.a, K.b);
    I.sort((K, ve) => K - ve);
    for (let K = 0; K < I.length - 1; K++) {
      let ve = I[K],
        ge = I[K + 1];
      if (ge - ve < 0.01) continue;
      let ue = (ve + ge) / 2,
        Q = P.find((ce) => ue > ce.a && ue < ce.b),
        oe = y(S, ue, Ba / 2),
        ie = ge - ve,
        we = (ce, ke, Qe) => Ft(ce, r.plaster, ie, Qe - ke, Ba, oe.x, ke, oe.z, M, 2.4);
      if (
        (Q
          ? (Q.v0 > 0 && (we(z, 0, Q.v0), we(D, 0, Math.min(z1, Q.v0))), we(z, Q.v1, l))
          : (we(z, 0, l), we(D, 0, z1)),
        !Q?.door)
      ) {
        let ce = y(S, ue, -0.02);
        Ft(z, r.panel, ie, 1, 0.04, ce.x, 0, ce.z, M, 1.2);
        let ke = y(S, ue, -0.045);
        Ft(z, r.timber, ie, 0.07, 0.09, ke.x, 1, ke.z, M, 1.5);
      }
    }
    let U = y(S, (R + A) / 2, Ba / 2 - 0.04);
    Ft(z, r.timber, A - R, 0.24, Ba + 0.08, U.x, l - 0.02, U.z, M, 1.5);
    let j = [S.u0 + 0.12, S.u1 - 0.12];
    for (let K = S.u0 + 3.2; K < S.u1 - 1.5; K += 3.3)
      P.some((ve) => K > ve.a - 0.3 && K < ve.b + 0.3) || j.push(K);
    for (let K of j) {
      let ve = y(S, K, -0.07);
      Ft(z, r.timber, 0.24, l, 0.14, ve.x, 0, ve.z, M, 1.2);
    }
    for (let K of P) {
      let ve = (K.a + K.b) / 2,
        ge = K.b - K.a;
      if (K.door) {
        for (let Q of [K.a - 0.07, K.b + 0.07]) {
          let oe = y(S, Q, Ba / 2);
          (Ft(z, r.timber, 0.16, K.v1 + 0.1, Ba + 0.1, oe.x, 0, oe.z, M, 1.2),
            Ft(D, r.timber, 0.16, z1 + 0.18, Ba + 0.1, oe.x, 0, oe.z, M, 1.2));
        }
        let ue = y(S, ve, Ba / 2);
        (Ft(z, r.timber, ge + 0.3, 0.18, Ba + 0.12, ue.x, K.v1, ue.z, M, 1.2),
          Ft(z, r.slate, ge, 0.05, Ba + 0.12, ue.x, 0, ue.z, M, 1),
          Ft(D, r.slate, ge, 0.05, Ba + 0.12, ue.x, 0, ue.z, M, 1),
          n.blob(Le.ao, ue.x, ue.z, 1, 0.35));
      } else {
        let ue = y(S, ve, Ba / 2);
        (Ft(z, r.timber, ge + 0.16, 0.1, Ba + 0.06, ue.x, K.v1, ue.z, M, 1.2),
          Ft(z, r.timber, ge + 0.28, 0.08, Ba + 0.2, ue.x, K.v0 - 0.08, ue.z, M, 1.2));
        for (let Q of [K.a - 0.05, K.b + 0.05]) {
          let oe = y(S, Q, Ba / 2);
          Ft(z, r.timber, 0.1, K.v1 - K.v0 + 0.1, Ba + 0.06, oe.x, K.v0 - 0.05, oe.z, M, 1.2);
        }
      }
    }
    let X = z.build(`muro_${E}`),
      J = D.build(`muro_${E}_cortado`);
    for (let K of P.filter((ve) => ve.window)) {
      let ve = new Mesh(new PlaneGeometry(K.b - K.a, K.v1 - K.v0), o9()),
        ge = y(S, (K.a + K.b) / 2, Ba * 0.5);
      (ve.position.set(ge.x, (K.v0 + K.v1) / 2, ge.z),
        (ve.rotation.y =
          S.along === 'x' ? (S.n.z > 0 ? Math.PI : 0) : S.n.x > 0 ? -Math.PI / 2 : Math.PI / 2),
        X.add(ve));
      let ue = y(S, (K.a + K.b) / 2, -1.4);
      n.blob(Le.light, ue.x, ue.z, 1.2, 0.35);
    }
    for (let K of J.children) K.castShadow = !1;
    (d.add(X, J), (J.visible = !1));
    let Z = new gn({ contactH: 0.1, contactMin: 1, finish: { wind: 0 } });
    k[E] = { s: S, full: X, cut: J, lamps: [], extra: Z };
  }
  for (let E of v) {
    if (!D1.has(E.key)) continue;
    let S = x(E);
    switch (E.key) {
      case 'hearth':
        await i9(o, r, k.n, S, l, f);
        break;
      case 'bar':
        r9(o, r, E, S, x({ cell: E.to }));
        break;
      case 'bar_shelves':
        l9(o, r, k.w, S, x({ cell: E.to }), f);
        break;
      case 'stairs_up':
        c9(o, r, k.e, S, x({ cell: E.to }), f, l);
        break;
      case 'chandelier':
        await d9(o, r, S, f, l);
        break;
      case 'wall_lantern': {
        let z = k[E.side || 'n'],
          D = z.s.along === 'x' ? S.x : S.z,
          M = y(z.s, D, -0.36);
        z.extra.add('q_lantern', qo(M.x, 1.5, M.z, Math.atan2(-z.s.n.x, -z.s.n.z)));
        let R = s.addLamp({
          pos: M.clone().setY(1.85),
          color: 16753226,
          range: 5.5,
          energy: 0.9,
          kind: 'lamp',
          haloSize: 1.1,
          haloAlpha: 0.45,
        });
        (z.lamps.push(R || M.clone().setY(1.85)),
          o.ground.blob(Le.light, M.x - z.s.n.x * 1.2, M.z - z.s.n.z * 1.2, 2.2, 0.7));
        break;
      }
      case 'rug': {
        let [z, D] = E.size || [1.4, 2.4],
          M = new Mesh(
            new PlaneGeometry(z, D),
            new MeshStandardMaterial({ map: n9(E.colors), roughness: 0.95, name: 'alfombra' }),
          );
        (M.rotation.set(-Math.PI / 2, 0, fo(E.rot || 0)),
          M.position.set(S.x, 0.008, S.z),
          (M.receiveShadow = !0),
          d.add(M));
        break;
      }
      case 'woodpile': {
        let z = [];
        for (let D = 0; D < 3; D++)
          for (let M = 0; M < 4 - D; M++) {
            let R = new CylinderGeometry(0.065, 0.068, 0.6, 8).rotateZ(Math.PI / 2);
            (R.translate(0, 0.066 + D * 0.115, (M - (3 - D) / 2) * 0.135), z.push(R));
          }
        (i.addGeometry(mergeGeometries(z), r.bark, qo(S.x, 0, S.z - 0.3, Math.PI / 2 + (c() - 0.5) * 0.2)),
          n.blob(Le.ao, S.x, S.z - 0.3, 0.6, 0.45));
        break;
      }
      default:
    }
  }
  for (let E of Object.values(k)) {
    let S = E.extra.build('colgado');
    for (let z of S.children) z.castShadow = !1;
    E.full.add(S);
  }
  for (let E of Object.values(k))
    E.lampSrc = E.lamps.map((S) => (S.isVector3 ? s.lampSources.find((z) => z.pos.distanceTo(S) < 0.3) : S));
  for (let E of Object.values(g))
    for (let S = E.u0; S <= E.u1; S += 0.8) {
      let z = y(E, S, -0.2);
      n.blob(Le.ao, z.x, z.z, 0.7, 0.4);
    }
  let T = '';
  return {
    group: d,
    room: f,
    updateCutaway(E) {
      let S = Object.values(k)
        .map((z) => (z.s.n.dot(E) < -0.18 ? 1 : 0))
        .join('');
      S !== T &&
        ((T = S),
        Object.values(k).forEach((z, D) => {
          let M = S[D] === '1';
          ((z.full.visible = !M), (z.cut.visible = M));
          for (let R of z.lampSrc || []) R && (R.on = !M);
        }));
    },
  };
}
async function i9(o, e, t, a, n, s) {
  let i = o.static,
    { ground: r, fx: l } = o,
    c = s.z0,
    d = a.x,
    u = new gn({ contactH: 0.6, contactMin: 0.8, groundAt: () => 0, finish: { wind: 0 } });
  for (let m of [-1.05, 1.05]) Ft(i, e.stone, 0.5, 1.2, 0.62, d + m, 0, c + 0.31, 0, 1.4);
  (Ft(i, e.soot, 1.62, 1.2, 0.04, d, 0, c + 0.02),
    Ft(i, e.slate, 1.6, 0.06, 0.6, d, 0, c + 0.3, 0, 1),
    Ft(i, e.slate, 3.1, 0.07, 0.85, d, 0, c + 1.04, 0, 1),
    Ft(u, e.stone, 2.6, 0.42, 0.66, d, 1.2, c + 0.33, 0, 1.4),
    Ft(u, e.stone, 2.36, n - 1.62, 0.5, d, 1.62, c + 0.25, 0, 1.4),
    Ft(u, e.timber, 2.95, 0.14, 0.36, d, 1.62, c + 0.66, 0, 1.2),
    t.full.add(u.build('chimenea')));
  let h = [];
  for (let [m, _, b, f] of [
    [-0.18, 0.02, 0.2, 1.45],
    [0.2, -0.04, -0.3, 1.5],
    [0, 0.08, 1.2, 1.57],
  ]) {
    let v = new CylinderGeometry(0.06, 0.063, 0.7, 8);
    (v.applyMatrix4(new Matrix4().makeRotationFromEuler(new Euler(0, b, f))),
      v.translate(m, 0.13, _),
      h.push(v));
  }
  i.addGeometry(mergeGeometries(h), e.bark, qo(d, 0, c + 0.34));
  let p = new Vector3(d, 0.12, c + 0.36);
  (l.flames.push({ pos: p, scale: 1.7 }),
    l.addLamp({
      pos: p.clone().add(new Vector3(0, 0.55, 0.35)),
      color: 16747060,
      range: 10,
      energy: 2.4,
      kind: 'fire',
      haloSize: 2.4,
      haloAlpha: 0.5,
    }),
    r.blob(Le.light, d, c + 1.6, 3.4, 1),
    r.blob(Le.ao, d, c + 0.3, 1.2, 0.5));
  try {
    let m = Hu(await loadProp('bull_head'));
    (m.scale.setScalar(1.55),
      m.position.set(d, 2.05, c + 0.52),
      m.traverse((_) => {
        _.isMesh && (_.castShadow = !1);
      }),
      t.full.add(m));
  } catch {}
  for (let m of [-1.15, 1.15]) t.extra.add('q_candles3', qo(d + m, 1.76, c + 0.66));
  for (let m of [-1.15, 1.15])
    l.addLamp({
      pos: new Vector3(d + m, 2.15, c + 0.7),
      color: 16756832,
      range: 3,
      energy: 0.6,
      kind: 'lamp',
      haloSize: 0.8,
      haloAlpha: 0.4,
    });
  (t.extra.add('q_shield', qo(d + 2.25, 1.55, c + 0.11, 0, 1.25)),
    i.add('q_cauldron', qo(d - 1.75, 0, c + 0.75, 0.6)),
    o.ground.blob(Le.ao, d - 1.75, c + 0.75, 0.6, 0.4));
}
function r9(o, e, t, a, n) {
  let s = o.static,
    i = (a.x + n.x) / 2 + 0.25,
    r = Math.min(a.z, n.z) - 0.45,
    l = Math.max(a.z, n.z) + 0.45,
    c = l - r,
    d = (r + l) / 2;
  (Ft(s, e.barWood, 0.55, 1, c, i, 0, d, 0, 1),
    Ft(s, e.barTop, 0.8, 0.08, c + 0.2, i, 1, d, 0, 1.4),
    Ft(s, e.soot, 0.6, 0.12, c, i + 0.02, 0, d));
  for (let m = r + 0.25; m < l; m += 0.48) Ft(s, e.timber, 0.04, 0.82, 0.09, i + 0.29, 0.1, m, 0, 1);
  let u = new gn({ contactH: 0.1, contactMin: 1, finish: { wind: 0 } });
  for (let [m, _] of [
    [0.3, 0.3],
    [0.5, -0.6],
    [1.6, 2.1],
    [2.9, 1],
  ])
    u.add('q_mug', qo(i + 0.05, 1.08, r + m, _));
  u.add('q_candles3', qo(i - 0.05, 1.08, r + 0.95, 0.4));
  let h = (r + l) / 2 + 0.6;
  u.add('lantern', qo(i - 0.05, 1.08, h, 0.3, 0.3));
  let p = u.build('barra_cosas');
  for (let m of p.children) m.castShadow = !1;
  (o.scene.add(p),
    o.fx.addLamp({
      pos: new Vector3(i - 0.05, 1.32, h),
      color: 16753226,
      range: 5.5,
      energy: 1,
      kind: 'lamp',
      haloSize: 1,
      haloAlpha: 0.45,
    }),
    o.ground.blob(Le.light, i + 0.6, h, 2, 0.7),
    o.ground.blob(Le.ao, i, d, 1, 0.45));
  for (let m = r; m <= l; m += 0.6) o.ground.blob(Le.ao, i, m, 0.7, 0.3);
}
function l9(o, e, t, a, n, s) {
  let i = o.static,
    r = Math.min(a.z, n.z) - 0.3,
    l = Math.max(a.z, n.z) + 0.3,
    c = l - r,
    d = (r + l) / 2,
    u = s.x0;
  (Ft(i, e.barWood, 0.42, 0.9, c, u + 0.21, 0, d, 0, 1),
    Ft(i, e.barTop, 0.48, 0.05, c + 0.06, u + 0.24, 0.9, d, 0, 1.4));
  let h = [],
    p = [];
  for (let _ = 0; _ < Math.floor(c / 0.19); _++) {
    let b = s9(0.26 + (_ % 3) * 0.04).translate(u + 0.2 + (_ % 2) * 0.08, 0.95, r + 0.15 + _ * 0.19);
    (_ % 3 === 1 ? p : h).push(b);
  }
  (h.length && i.addGeometry(mergeGeometries(h), e.green, new Matrix4()),
    p.length && i.addGeometry(mergeGeometries(p), e.amber, new Matrix4()));
  let m = new gn({ contactH: 0.1, contactMin: 1, finish: { wind: 0 } });
  for (let _ of [1.48, 2.06]) {
    Ft(m, e.barTop, 0.32, 0.05, c, u + 0.18, _, d, 0, 1.4);
    for (let b of [r + 0.3, d, l - 0.3]) Ft(m, e.iron, 0.05, 0.16, 0.05, u + 0.06, _ - 0.16, b);
  }
  for (let _ = 0; _ < Math.floor(c / 0.32); _++)
    m.add('q_mug', qo(u + 0.18, 1.505, r + 0.2 + _ * 0.32, Math.PI));
  for (let _ = 0; _ < Math.floor(c / 0.4); _++) {
    let b = new CylinderGeometry(0.11, 0.11, 0.02, 14).rotateZ(Math.PI / 2 - 0.25);
    m.addGeometry(b, e.clay, qo(u + 0.12, 2.2, r + 0.25 + _ * 0.4));
  }
  t.full.add(m.build('estantes'));
}
function c9(o, e, t, a, n, s, i) {
  let r = o.static,
    l = 1.1,
    c = s.x1 - l / 2,
    d = a.z + 0.5,
    u = Math.max(s.z0 + 0.5, n.z - 0.4),
    h = Math.min(i - 0.8, 2.6),
    p = d - u,
    m = Math.max(6, Math.round(h / 0.2)),
    _ = p / m,
    b = h / m;
  for (let w = 0; w < m; w++) {
    let k = b * (w + 1),
      T = d - _ * (w + 0.5);
    (Ft(r, e.panel, l, 0.05, _ + 0.04, c, k - 0.05, T, 0, 1),
      Ft(r, e.barWood, l, b, 0.03, c, k - b, T + _ / 2, 0, 1));
  }
  let f = Math.hypot(p, h),
    v = L1(0.08, 0.26, f, 1.2);
  (v.rotateX(Math.atan2(h, p)),
    v.translate(c - l / 2 - 0.04, h / 2 - 0.05, (d + u) / 2),
    r.addGeometry(v, e.timber, new Matrix4()),
    Ft(r, e.panel, l, 0.08, u - s.z0, c, h - 0.08, (u + s.z0) / 2, 0, 1),
    Ft(r, e.timber, 0.14, h, 0.14, c - l / 2 + 0.07, 0, u, 0, 1),
    Ft(r, e.timber, 0.14, h, 0.14, c - l / 2 + 0.07, 0, s.z0 + 0.07, 0, 1));
  for (let w = 0; w <= m; w += 3) {
    let k = b * w,
      T = d - _ * w;
    Ft(r, e.timber, 0.06, 0.9, 0.06, c - l / 2 + 0.05, k, T, 0, 1);
  }
  let x = L1(0.07, 0.07, f, 1.2);
  (x.rotateX(Math.atan2(h, p)),
    x.translate(c - l / 2 + 0.05, h / 2 + 0.9, (d + u) / 2),
    r.addGeometry(x, e.timber, new Matrix4()));
  let g = new gn({ contactH: 0.1, contactMin: 1, finish: { wind: 0 } }),
    y = (u + s.z0) / 2;
  (Ft(g, e.soot, 0.04, 2, 0.9, s.x1 - 0.02, h, y),
    Ft(g, e.timber, 0.12, 0.14, 1.15, s.x1 - 0.05, h + 2, y, 0, 1));
  for (let w of [-0.52, 0.52]) Ft(g, e.timber, 0.12, 2, 0.12, s.x1 - 0.05, h, y + w, 0, 1);
  (t.full.add(g.build('puerta_habitaciones')), o.ground.blob(Le.ao, c, (d + u) / 2, 1.2, 0.4));
}
async function d9(o, e, t, a, n) {
  let s = o.static;
  Ft(s, e.timber, a.x1 - a.x0 + 2 * Ba, 0.26, 0.24, (a.x0 + a.x1) / 2, n - 0.36, t.z, 0, 1.5);
  try {
    let r = Hu(await loadProp('lantern_chandelier_01'));
    (r.scale.setScalar(1.15),
      r.position.set(t.x, n - 0.48, t.z),
      r.traverse((l) => {
        l.isMesh && (l.castShadow = !1);
      }),
      o.scene.add(r));
  } catch {}
  let i = new Mesh(new BoxGeometry(0.03, 0.14, 0.03), V3().iron);
  (i.position.set(t.x, n - 0.44, t.z),
    o.scene.add(i),
    o.fx.addLamp({
      pos: new Vector3(t.x, n - 1.1, t.z),
      color: 16756838,
      range: 10,
      energy: 1.6,
      kind: 'lamp',
      haloSize: 1.6,
      haloAlpha: 0.45,
    }),
    o.ground.blob(Le.light, t.x, t.z, 3.5, 0.75));
}
const D1 = new Set([
  'hearth',
  'window',
  'bar',
  'bar_shelves',
  'stairs_up',
  'chandelier',
  'wall_lantern',
  'rug',
  'woodpile',
]);
const Ba = 0.3;
const z1 = 0.45;
let Qm = null;
const xW = new Matrix4();
const qo = (o, e, t, a = 0, n = 1) =>
  new Matrix4().compose(
    new Vector3(o, e, t),
    new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), a),
    new Vector3(n, n, n),
  );
let e0 = null;

export { $3, D1 };
