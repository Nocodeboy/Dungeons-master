// world/props.js
// Reconstruido de publicado/juego.js (módulo __esm «Q3»). Nombres locales aún minificados.

import {
  Box3,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  DoubleSide,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { hasPiece, pieceBounds, composeMatrix, fixGlass } from './kit.js';
import { standardMaterial } from './materials.js';
import { worldTexture, LAYER } from './ground.js';
import { cellToWorld, neighbors, HEX_SIZE, cellKey, degToRad } from './grid.js';
import { loadGLTF, loadProp, pbrMaterial } from '../assets.js';
import { D1 } from './interiors.js';

function Uu(o) {
  return W3[o] ? W3[o] : [o, 1];
}
async function J3(o) {
  let { scene: e, map: t, level: a, ground: n, rnd: s, ambient: i } = o,
    r = o.static,
    l = i === 'crypt',
    c = new Vector3(),
    d = new Map();
  o.webs = [];
  let u = (f, v) => {
      (d.has(f) || d.set(f, []), d.get(f).push(v));
    },
    h = (f, v, x, g = 0, y = 1, w = null) => {
      let [k, T] = Uu(f);
      if (!hasPiece(k)) return !1;
      let E = w ?? n.heightAt(v, x),
        S = Array.isArray(y) ? new Vector3(y[0] * T, y[1] * T, y[2] * T) : y * T;
      return (r.add(k, composeMatrix(v, E, x, g, S)), !0);
    };
  for (let f of a.props || []) {
    if (f.foot != null) continue;
    cellToWorld(f.cell[0], f.cell[1], c);
    let v = c.x + (f.offset ? f.offset[0] * HEX_SIZE : 0),
      x = c.z + (f.offset ? f.offset[1] * HEX_SIZE : 0),
      g = degToRad(f.rot || 0);
    if (f.key === 'footbridge') {
      b9(o, v, x, g, (f.length || 2.8) * HEX_SIZE, (f.width || 1.15) * HEX_SIZE);
      continue;
    }
    if (f.key === 'shrine') {
      v9(o, v, x, g, f.scale || 1);
      continue;
    }
    if (f.key === 'ruin') {
      y9(o, v, x, g, f.scale || 1);
      continue;
    }
    (X3.has(f.key)
      ? u(f.key, composeMatrix(v, n.heightAt(v, x), x, g, f.scale || 1))
      : h(f.key, v, x, g, f.scale || 1),
      n.blob(LAYER.ao, v, x, 0.9, 0.35));
  }
  for (let f of a.decor || []) {
    cellToWorld(f.cell[0], f.cell[1], c);
    let v = c.x + (f.offset ? f.offset[0] * HEX_SIZE : 0),
      x = c.z + (f.offset ? f.offset[1] * HEX_SIZE : 0),
      g = degToRad(f.rot ?? s() * 360);
    if (f.key === 'wheat_patch') {
      for (let k = 0; k < 4; k++)
        for (let T = 0; T < 4; T++) {
          let E = c.x - 0.6 + k * 0.4 + (s() - 0.5) * 0.12,
            S = c.z - 0.55 + T * 0.37 + (s() - 0.5) * 0.12;
          u('wheat', composeMatrix(E, n.heightAt(E, S), S, s() * 6.28, 0.55 + s() * 0.25));
        }
      continue;
    }
    if (D1.has(f.key) || u9(o, f, v, x, g, u)) continue;
    if (f.key.startsWith('ph:')) {
      try {
        let k = fixGlass(await loadProp(f.key.slice(3)));
        (k.position.set(v, n.heightAt(v, x) + (f.y || 0), x),
          (k.rotation.y = g),
          k.scale.setScalar(f.scale || 1),
          e.add(k),
          n.blob(LAYER.ao, v, x, 0.8, 0.4));
      } catch (k) {
        console.warn('[mundo] pieza de Poly Haven', f.key, k);
      }
      continue;
    }
    let y = f.on ? pieceBounds(Uu(f.on)[0]).max.y * (f.onScale ?? 1) : null,
      w = f.y != null ? n.heightAt(v, x) + f.y : y != null ? n.heightAt(v, x) + y : null;
    X3.has(f.key)
      ? u(f.key, composeMatrix(v, n.heightAt(v, x), x, g, (f.scale || 1) * (0.9 + s() * 0.2)))
      : h(f.key, v, x, g, f.scale || 1, w);
  }
  if (o.webs.length) {
    let f = new Mesh(mergeGeometries(o.webs), h9());
    ((f.name = 'telaranas'), (f.renderOrder = 3), e.add(f));
    for (let v of o.webs) v.dispose();
  }
  let p = new Set();
  for (let f of [
    ...(a.props || []),
    ...(a.decor || []),
    ...(a.objects || []).filter((v) => v.type && v.type !== 'npc' && v.type !== 'inspect'),
  ])
    f.cell && p.add(cellKey(f.cell[0], f.cell[1]));
  let m = [],
    _ = [];
  (t.each((f, v, x) => {
    cellToWorld(f, v, c);
    let g = c.x + (s() - 0.5) * 0.25,
      y = c.z + (s() - 0.5) * 0.25;
    switch (x) {
      case 'c':
        if (i === 'inn') break;
        (l
          ? h(s() < 0.5 ? 'barrel_d' : 'box_stacked', g, y, s() * 6.28, 1)
          : (h(
              s() < 0.5 ? 'crate' : 'q_crate',
              g - 0.2,
              y - 0.1,
              s() * 0.6 + (s() < 0.5 ? 0 : Math.PI / 2),
              1,
            ),
            h(s() < 0.5 ? 'q_barrel' : 'barrel', g + 0.45, y + 0.35, s() * 6.28, 1),
            s() < 0.5 && h('sack', g - 0.4, y + 0.45, s() * 6.28, 0.9)),
          n.blob(LAYER.ao, c.x, c.z, 1, 0.45));
        break;
      case 'r': {
        let w = ['Rock_Medium_1', 'Rock_Medium_2', 'Rock_Medium_3'][Math.floor(s() * 3)];
        h(w, g, y, s() * 6.28, 0.8 + s() * 0.35, n.heightAt(g, y) - 0.12);
        for (let k = 0; k < 3; k++) {
          let T = c.x + (s() - 0.5) * 1.3,
            E = c.z + (s() - 0.5) * 1.3;
          u(
            s() < 0.5 ? 'Pebble_Round_2' : 'Pebble_Square_1',
            composeMatrix(T, n.heightAt(T, E), E, s() * 6.28, 1 + s() * 1.5),
          );
        }
        break;
      }
      case 'x':
        if (l)
          (h('rubble', g, y, s() * 6.28, 0.7 + s() * 0.3),
            s() < 0.5 &&
              h(
                s() < 0.5 ? 'skull' : s() < 0.5 ? 'bones' : 'ribcage',
                c.x + (s() - 0.5) * 0.8,
                c.z + (s() - 0.5) * 0.8,
                s() * 6.28,
                1,
              ));
        else {
          for (let w = 0; w < 4; w++)
            h(
              `Prop_Brick${1 + Math.floor(s() * 4)}`,
              c.x + (s() - 0.5) * 1.1,
              c.z + (s() - 0.5) * 1.1,
              s() * 6.28,
              1.2 + s() * 0.8,
            );
          h(
            ['Rock_Medium_2', 'Rock_Medium_3'][Math.floor(s() * 2)],
            g,
            y,
            s() * 6.28,
            0.45 + s() * 0.2,
            n.heightAt(g, y) - 0.15,
          );
        }
        break;
      case 'o':
        if (p.has(cellKey(f, v)) || i === 'inn') break;
        (f9(o, h, u, c, i), n.blob(LAYER.ao, c.x, c.z, 0.8, 0.35));
        break;
      case 'O':
        if (p.has(cellKey(f, v)) || i === 'inn') break;
        (m9(o, h, c, i), n.blob(LAYER.ao, c.x, c.z, 1, 0.4));
        break;
      case 'P':
        l
          ? h(s() < 0.5 ? 'pillar_deco' : 'pillar', c.x, c.z, (Math.floor(s() * 4) * Math.PI) / 2, 0.92)
          : Z3(o, h, c);
        break;
      case 'g':
        if (l) {
          let w = t.tile(f + 1, v) === 'g' || s() < 0.5;
          h('coffin', c.x, c.z, w ? Math.PI / 2 : 0, 0.75);
        } else h(s() < 0.5 ? 'gravestone' : 'gravemarker', g, y, (s() - 0.5) * 0.4, 1);
        break;
      case 'f':
        m.push([f, v]);
        break;
      case '=':
      case '.':
        if (i === 'kesh' && x === '=') {
          let w = Cc();
          for (let [k, T] of neighbors(f, v)) {
            let E = t.tile(k, T);
            if (E !== 'w' && E !== '~') continue;
            let S = cellToWorld(k, T),
              z = S.x - c.x,
              D = S.z - c.z,
              M = c.x + z * 0.45,
              R = c.z + D * 0.45,
              A = w9(0.95, 0.42 + s() * 0.3, 0.38, 1.4);
            (A.translate(0, 0.2, 0),
              r.addGeometry(
                A,
                w.blocks,
                composeMatrix(M, n.heightAt(M, R) - 0.05, R, Math.atan2(z, D) + (s() - 0.5) * 0.1),
                { contactH: 0.25, contactMin: 0.75 },
              ));
          }
        }
        if (l && s() < 0.09 && neighbors(f, v).some(([w, k]) => t.tile(w, k) === '#')) {
          let w =
            s() < 0.3
              ? 'skull'
              : s() < 0.5
                ? 'bones'
                : s() < 0.6
                  ? 'candle_lit'
                  : s() < 0.8
                    ? 'q_vase_s'
                    : 'q_vase_rubble';
          h(w, g, y, s() * 6.28, w === 'candle_lit' ? 0.25 : 1);
        }
        break;
      case 'S':
        _.push([f, v]);
        break;
      default:
    }
  }),
    m.length && g9(o, m, a.fence || 'q_fence'));
  let b = [];
  if (_.length) {
    let f = await x9(o, _, i === 'kesh' || a.statue === 'fallen');
    f && b.push(f);
  }
  for (let [f, v] of d) {
    let [x] = Uu(f);
    if (hasPiece(x)) for (let g of v) r.add(x, g, { cast: f === 'pumpkin' || f === 'wheat' || f === 'corn' });
  }
  return { dynamic: b };
}
function u9(o, e, t, a, n, s) {
  let { ground: i, fx: r } = o,
    l = o.static,
    c = o.rnd,
    d = i.heightAt(t, a);
  switch (e.key) {
    case 'fire_pit': {
      let u = Cc();
      for (let p = 0; p < 9; p++) {
        let m = (p / 9) * Math.PI * 2,
          _ = new DodecahedronGeometry(0.16, 0);
        (_.scale(1.25, 0.75, 1),
          l.addGeometry(
            _,
            u.stone,
            composeMatrix(t + Math.cos(m) * 0.55, d + 0.08, a + Math.sin(m) * 0.55, c() * 6),
          ));
      }
      for (let p = 0; p < 4; p++) {
        let m = new CylinderGeometry(0.06, 0.07, 0.8, 7).rotateZ(Math.PI / 2 - 0.25);
        l.addGeometry(m, u.darkPlank, composeMatrix(t, d + 0.13, a, (p * Math.PI) / 4));
      }
      let h = new Vector3(t, d + 0.15, a);
      return (
        r.flames.push({ pos: h, scale: 1.2 }),
        r.addLamp({
          pos: h.clone().add(new Vector3(0, 0.7, 0)),
          color: 16747060,
          range: 7,
          energy: 1.5,
          kind: 'fire',
          haloSize: 2.2,
          haloAlpha: 0.55,
        }),
        i.blob(LAYER.ao, t, a, 0.9, 0.6),
        i.blob(LAYER.light, t, a, 3, 0.9),
        !0
      );
    }
    case 'web': {
      let u = (e.scale || 1) * 1.6,
        h = new Object3D();
      return (
        h.position.set(t, d + u * 0.42, a),
        h.rotation.set(-0.35 - c() * 0.5, n, (c() - 0.5) * 0.4),
        h.updateMatrix(),
        o.webs.push(new PlaneGeometry(u, u).applyMatrix4(h.matrix)),
        h.position.set(t + (c() - 0.5) * 0.4, d + 0.03, a + (c() - 0.5) * 0.4),
        h.rotation.set(0, c() * 6, 0),
        h.updateMatrix(),
        o.webs.push(new CircleGeometry(u * 0.55, 10).rotateX(-Math.PI / 2).applyMatrix4(h.matrix)),
        i.blob(LAYER.ao, t, a, 1, 0.35),
        !0
      );
    }
    case 'clothesline': {
      let u = new MeshStandardMaterial({ color: 6966838, roughness: 0.9 }),
        h = (e.length || 2) * HEX_SIZE * 0.5,
        p = (g, y, w) =>
          composeMatrix(
            t + Math.cos(n) * g + Math.sin(n) * w,
            d + y,
            a - Math.sin(n) * g + Math.cos(n) * w,
            n,
          );
      for (let g of [-h, h]) {
        let y = new CylinderGeometry(0.045, 0.06, 1.95, 6).translate(0, 0.97, 0);
        (l.addGeometry(y, u, p(g, 0, 0)),
          l.addGeometry(new BoxGeometry(0.06, 0.06, 0.36).translate(0, 1.84, 0), u, p(g, 0, 0)));
      }
      let m = (g) => 1.84 - Math.sin(g * Math.PI) * 0.16,
        _ = [];
      for (let g = 0; g <= 10; g++) _.push(new Vector3(-h + (2 * h * g) / 10, m(g / 10), 0));
      let b = new TubeGeometry(new CatmullRomCurve3(_), 16, 0.011, 4),
        f = new MeshStandardMaterial({ color: 13153420, roughness: 0.9 });
      l.addGeometry(b, f, p(0, 0, 0));
      let v = [15327952, 14209728, 9413560, 13214302, 11032394, 14998731, 8228714],
        x = 0.08 + c() * 0.06;
      for (; x < 0.9;) {
        let g = 0.32 + c() * 0.34,
          y = 0.38 + c() * 0.36,
          w = Math.min(0.95, x + g / (4 * h)),
          k = m(w) - 0.01,
          T = new BoxGeometry(g, y, 0.012, 2, 3, 1),
          E = T.getAttribute('position');
        for (let z = 0; z < E.count; z++)
          E.setZ(z, E.getZ(z) + Math.sin((E.getY(z) / y + 0.5) * Math.PI) * 0.035 * (0.5 - E.getY(z) / y));
        (T.computeVertexNormals(), T.translate(0, -y / 2, 0));
        let S = new MeshStandardMaterial({ color: v[Math.floor(c() * v.length)], roughness: 0.95 });
        (l.addGeometry(T, S, p(-h + 2 * h * w, k, 0)), (x = w + g / (4 * h) + 0.04 + c() * 0.08));
      }
      return (i.blob(LAYER.ao, t, a, 1.2, 0.25), !0);
    }
    case 'egg_sac': {
      let u = p9();
      for (let h = 0; h < 4; h++) {
        let p = new SphereGeometry(0.16 + c() * 0.06, 10, 8);
        (p.scale(1, 1.3, 1),
          l.addGeometry(
            p,
            u,
            composeMatrix(t + (c() - 0.5) * 0.4, d + 0.16, a + (c() - 0.5) * 0.4, c() * 6),
          ));
      }
      return !0;
    }
    case 'stepstone': {
      let u = ['RockPath_Round_Small_1', 'RockPath_Round_Small_2', 'RockPath_Round_Small_3'][
          Math.floor(c() * 3)
        ],
        h = Math.max(d, -0.2) - 0.02;
      return (hasPiece(u) && l.add(u, composeMatrix(t, h, a, n, (e.scale || 1) * 1.3)), !0);
    }
    default:
      return !1;
  }
}
function h9() {
  if (qu) return qu;
  let o = document.createElement('canvas');
  o.width = o.height = 256;
  let e = o.getContext('2d');
  ((e.strokeStyle = 'rgba(240,240,232,0.85)'), (e.lineWidth = 1.4));
  let t = 128,
    a = 11,
    n = [];
  for (let i = 0; i < a; i++) n.push((i / a) * Math.PI * 2 + Math.random() * 0.2);
  for (let i of n)
    (e.beginPath(), e.moveTo(t, t), e.lineTo(t + Math.cos(i) * 124, t + Math.sin(i) * 124), e.stroke());
  e.lineWidth = 1;
  for (let i = 10; i < 120; i += 9 + Math.random() * 3)
    (e.beginPath(),
      n.forEach((r, l) => {
        let c = i * (0.92 + Math.random() * 0.1),
          d = t + Math.cos(r) * c,
          u = t + Math.sin(r) * c;
        l === 0 ? e.moveTo(d, u) : e.lineTo(d, u);
      }),
      e.closePath(),
      e.stroke());
  let s = new CanvasTexture(o);
  return (
    (s.colorSpace = SRGBColorSpace),
    (qu = new MeshStandardMaterial({
      map: s,
      transparent: !0,
      alphaTest: 0.05,
      side: DoubleSide,
      roughness: 0.6,
      depthWrite: !1,
      emissive: 3158064,
    })),
    (qu.name = 'telarana'),
    qu
  );
}
function p9() {
  return ((Y3 ??= standardMaterial({ color: 15262412, roughness: 0.5, name: 'huevos' })), Y3);
}
function f9(o, e, t, a, n) {
  let s = o.rnd,
    i = a.x + (s() - 0.5) * 0.3,
    r = a.z + (s() - 0.5) * 0.3,
    l = s() * 6.28;
  if (n === 'crypt') return e(s() < 0.4 ? 'q_vase_rubble' : s() < 0.5 ? 'candles' : 'q_vase', i, r, l, 1);
  if (n === 'forest' || n === 'kesh') {
    let d = s();
    return d < 0.3
      ? e('stump', i, r, l, 0.8 + s() * 0.3)
      : d < 0.55
        ? e('Rock_Medium_3', i, r, l, 0.45 + s() * 0.2, o.ground.heightAt(i, r) - 0.08)
        : d < 0.75
          ? e('lumber', i, r, l, 0.7)
          : d < 0.88
            ? e('q_crate', i, r, l, 0.9)
            : e('sack', i, r, l, 1);
  }
  let c = s();
  return c < 0.22
    ? e('q_barrel', i, r, l, 1)
    : c < 0.4
      ? e('crate', i, r, l, 0.9)
      : c < 0.52
        ? e('sack', i, r, l, 1)
        : c < 0.64
          ? e('q_bucket', i, r, l, 1.2)
          : c < 0.76
            ? e('lumber', i, r, l, 0.75)
            : c < 0.88
              ? e('q_farmcrate', i, r, l, 1)
              : e('stump', i, r, l, 0.8);
}
function m9(o, e, t, a) {
  let n = o.rnd,
    s = n() * 6.28;
  if (a === 'crypt') return e('pillar', t.x, t.z, 0, 0.6);
  if (a === 'forest') {
    let r = n();
    return r < 0.4
      ? e('q_banner2', t.x, t.z, s, 1)
      : r < 0.7
        ? e('weaponrack', t.x, t.z, s, 1)
        : e('dead_tree', t.x, t.z, s, 0.7);
  }
  if (a === 'kesh') return Z3(o, e, t);
  let i = n();
  return i < 0.35
    ? e('q_barrel_holder', t.x, t.z, s, 1)
    : i < 0.6
      ? e('q_weaponstand', t.x, t.z, s, 1)
      : i < 0.8
        ? e('Prop_Wagon', t.x, t.z, s, 0.7)
        : e('q_banner', t.x, t.z, s, 1);
}
function Z3(o, e, t) {
  let a = o.rnd,
    n = o.static,
    s = Cc(),
    i = 1.4 + a() * 1.8,
    r = o.ground.heightAt(t.x, t.z),
    l = H1(new CylinderGeometry(0.55, 0.62, 0.35, 8), 1.2, 0.35 / 2);
  (l.translate(0, 0.17, 0), n.addGeometry(l, s.blocks, composeMatrix(t.x, r, t.z, a() * 6.28)));
  let c = H1(new CylinderGeometry(0.36, 0.42, i, 10, 3), 1, i / 2),
    d = c.getAttribute('position');
  for (let u = 0; u < d.count; u++) d.getY(u) > i / 2 - 0.01 && d.setY(u, d.getY(u) - Math.random() * 0.45);
  if (
    (c.computeVertexNormals(),
    c.translate(0, i / 2 + 0.35, 0),
    n.addGeometry(c, s.blocks, composeMatrix(t.x, r, t.z, a() * 6.28, 1)),
    a() < 0.5)
  ) {
    let u = H1(new CylinderGeometry(0.38, 0.38, 0.7, 10), 1, 0.35).rotateZ(Math.PI / 2);
    (u.translate(0, 0.36, 0), n.addGeometry(u, s.blocks, composeMatrix(t.x + 1, r, t.z + 0.4, a() * 6.28)));
  }
}
function H1(o, e, t) {
  let a = o.getAttribute('uv');
  for (let n = 0; n < a.count; n++) a.setXY(n, a.getX(n) * e, a.getY(n) * t);
  return o;
}
function Cc() {
  if (t0) return t0;
  let o = (s) => {
      let i = null;
      return () => (i ??= s());
    },
    e = o(() =>
      Object.assign(pbrMaterial('rock_ground', { repeat: [1, 1], tint: 13026494, ao: !1 }), {
        name: 'piedra_durn',
      }),
    ),
    t = o(() =>
      Object.assign(pbrMaterial('castle_wall_varriation', { repeat: [1, 1], tint: 14078666, ao: !1 }), {
        name: 'sillar',
      }),
    ),
    a = o(() =>
      Object.assign(pbrMaterial('rough_wood', { repeat: [0.3, 1], tint: 10122322, ao: !1 }), {
        name: 'tablon',
      }),
    ),
    n = o(() =>
      Object.assign(pbrMaterial('rough_wood', { repeat: [0.3, 1], tint: 6177840, ao: !1 }), {
        name: 'tablon_oscuro',
      }),
    );
  return (
    (t0 = {
      get stone() {
        return e();
      },
      get blocks() {
        return t();
      },
      get plank() {
        return a();
      },
      get darkPlank() {
        return n();
      },
    }),
    t0
  );
}
function g9(o, e, t) {
  let { map: a, ground: n } = o,
    s = o.static,
    i = new Set(e.map(([m, _]) => cellKey(m, _))),
    r = [],
    l = new Map();
  for (let [m, _] of e)
    for (let [b, f] of neighbors(m, _))
      i.has(cellKey(b, f)) &&
        (f < _ ||
          (f === _ && b < m) ||
          (r.push([
            [m, _],
            [b, f],
          ]),
          l.set(cellKey(m, _), (l.get(cellKey(m, _)) || 0) + 1),
          l.set(cellKey(b, f), (l.get(cellKey(b, f)) || 0) + 1)));
  let c = new Set();
  for (let [m, _] of r)
    for (let b of neighbors(...m)) {
      if (!i.has(cellKey(...b))) continue;
      if (
        neighbors(..._)
          .map(([v, x]) => cellKey(v, x))
          .includes(cellKey(...b)) &&
        !c.has(cellKey(...m) + cellKey(..._))
      ) {
        c.add(cellKey(...m) + cellKey(..._));
        break;
      }
    }
  let d = new Vector3(),
    u = new Vector3();
  if (t === 'palisade') {
    let m = Cc(),
      _ = o.rnd;
    for (let [b, f] of r) {
      if (c.has(cellKey(...b) + cellKey(...f))) continue;
      (cellToWorld(...b, d), cellToWorld(...f, u));
      let v = 4;
      for (let x = 0; x < v; x++) {
        let g = (x + 0.5) / v,
          y = d.x + (u.x - d.x) * g + (_() - 0.5) * 0.08,
          w = d.z + (u.z - d.z) * g + (_() - 0.5) * 0.08,
          k = 1.5 + _() * 0.6,
          T = new CylinderGeometry(0.11, 0.13, k, 7);
        T.translate(0, k / 2, 0);
        let E = new ConeGeometry(0.11, 0.32, 7);
        E.translate(0, k + 0.16, 0);
        let S = composeMatrix(y, n.heightAt(y, w) - 0.05, w, _() * 6, 1).multiply(
          new Matrix4().makeRotationZ((_() - 0.5) * 0.12),
        );
        (s.addGeometry(T, m.darkPlank, S), s.addGeometry(E, m.plank, S));
      }
      n.blob(LAYER.path, (d.x + u.x) / 2, (d.z + u.z) / 2, 0.8, 0.25);
    }
    return;
  }
  let [h] = Uu(t),
    p = hasPiece(h) ? pieceBounds(h).max.x - pieceBounds(h).min.x : 2;
  for (let [m, _] of r) {
    if (c.has(cellKey(...m) + cellKey(..._))) continue;
    (cellToWorld(...m, d), cellToWorld(..._, u));
    let b = (d.x + u.x) / 2,
      f = (d.z + u.z) / 2,
      v = Math.atan2(-(u.z - d.z), u.x - d.x),
      x = d.distanceTo(u),
      g = new Vector3((x / p) * 1.02, 1, 1);
    (s.add(h, composeMatrix(b, n.heightAt(b, f), f, v, g)), n.blob(LAYER.path, b, f, 0.7, 0.12));
  }
}
function b9(o, e, t, a, n, s) {
  let i = o.static,
    r = Cc(),
    l = o.rnd,
    c = 0.18,
    d = Math.round(n / 0.32);
  for (let u = 0; u < d; u++) {
    let h = -n / 2 + (u + 0.5) * (n / d),
      p = new BoxGeometry(s * (0.94 + l() * 0.06), 0.07, (n / d) * 0.86);
    i.addGeometry(
      p,
      r.plank,
      composeMatrix(e, c, t, a).multiply(composeMatrix((l() - 0.5) * 0.04, 0, h, (l() - 0.5) * 0.06)),
    );
  }
  for (let u of [-1, 1]) {
    i.addGeometry(
      new BoxGeometry(0.12, 0.1, n + 0.3),
      r.darkPlank,
      composeMatrix(e, c - 0.06, t, a).multiply(composeMatrix(u * s * 0.36, 0, 0)),
    );
    let h = Math.floor(n / 1.1) + 1;
    for (let p = 0; p < h; p++) {
      let m = -n / 2 + (p * n) / (h - 1),
        _ = new BoxGeometry(0.1, 1.15, 0.1);
      (_.translate(0, 0.35, 0),
        i.addGeometry(_, r.darkPlank, composeMatrix(e, c, t, a).multiply(composeMatrix(u * s * 0.5, 0, m))));
    }
    i.addGeometry(
      new BoxGeometry(0.08, 0.08, n),
      r.plank,
      composeMatrix(e, c + 0.9, t, a).multiply(composeMatrix(u * s * 0.5, 0, 0)),
    );
  }
}
function v9(o, e, t, a, n) {
  let s = o.static,
    i = Cc(),
    r = o.rnd,
    l = o.ground.heightAt(e, t),
    c = new CylinderGeometry(2.4 * n, 2.6 * n, 0.12, 8);
  (c.translate(0, 0.06, 0), s.addGeometry(c, i.blocks, composeMatrix(e, l, t, a)));
  let d = new CylinderGeometry(2.8 * n, 3 * n, 0.06, 8);
  (d.translate(0, 0.03, 0), s.addGeometry(d, i.blocks, composeMatrix(e, l, t, a)));
  let u = new BoxGeometry(1.2, 0.9, 0.7);
  (u.translate(0, 0.75, 0),
    s.addGeometry(u, i.blocks, composeMatrix(e, l, t, a).multiply(composeMatrix(0, 0, -0.9))));
  for (let m = 0; m < 6; m++) {
    let _ = (m / 6) * Math.PI * 2 + 0.3,
      b = m % 2 === 0 ? 0.6 + r() * 1 : 2.4 + r() * 0.6,
      f = new CylinderGeometry(0.22, 0.26, b, 8);
    (f.translate(0, b / 2 + 0.1, 0),
      s.addGeometry(
        f,
        i.stone,
        composeMatrix(e, l, t, a).multiply(composeMatrix(Math.cos(_) * 1.9 * n, 0, Math.sin(_) * 1.9 * n)),
      ));
  }
  let h = new CylinderGeometry(0.55, 0.55, 0.07, 20).rotateX(Math.PI / 2 - 0.35);
  (h.translate(0.6, 0.35, 0.6),
    s.addGeometry(
      h,
      standardMaterial({ color: 11569232, roughness: 0.45, metalness: 0.7, name: 'disco_alba' }),
      composeMatrix(e, l, t, a),
    ));
  let p = o.ground;
  if (
    (p.blob(LAYER.ao, e, t, 3.2, 0.55),
    p.blob(LAYER.litter, e, t, 3.5, 0.6),
    p.blob(LAYER.pave, e, t, 2.6, 0.7),
    hasPiece('Prop_Brick1'))
  )
    for (let m = 0; m < 8; m++)
      s.add(
        `Prop_Brick${1 + (m % 4)}`,
        composeMatrix(e + (r() - 0.5) * 5, l, t + (r() - 0.5) * 5, r() * 6.28, 1.4),
      );
}
function y9(o, e, t, a, n) {
  let s = o.static,
    i = o.rnd,
    r = o.ground.heightAt(e, t),
    l = [
      [-2, 0, Math.PI / 2],
      [2, 0, -Math.PI / 2],
      [0, -2.6, 0],
      [-1, 2.6, Math.PI],
      [1.2, 2.6, Math.PI],
    ];
  for (let [c, d, u] of l) {
    if (i() < 0.2) continue;
    let h = i() < 0.5 ? 'Wall_UnevenBrick_Window_Thin_Round' : 'Wall_UnevenBrick_Straight';
    if (!hasPiece(h)) continue;
    let p = composeMatrix(e, r - 0.3 - i() * 0.4, t, a).multiply(
      composeMatrix(c * n, 0, d * n, u, new Vector3(1, 0.4 + i() * 0.45, 1)),
    );
    s.add(h, p);
  }
  for (let c = 0; c < 7; c++)
    s.add(
      `Prop_Brick${1 + (c % 4)}`,
      composeMatrix(e + (i() - 0.5) * 5, r, t + (i() - 0.5) * 5, i() * 6.28, 1.5),
    );
  o.ground.blob(LAYER.pave, e, t, 2.6, 0.55);
}
async function x9(o, e, t) {
  let { scene: a, ground: n } = o,
    s = new Vector3(),
    i = new Vector3();
  for (let [h, p] of e) s.add(cellToWorld(h, p, i));
  s.divideScalar(e.length);
  let r = n.heightAt(s.x, s.z),
    l = new Group();
  ((l.name = 'toro'), l.position.set(s.x, r, s.z), (l.rotation.y = t ? 0.6 : 0.12));
  let c = t
      ? null
      : [
          new BoxGeometry(4.6, 0.22, 2.9).translate(0, 0.11, 0),
          new BoxGeometry(3.7, 0.95, 2).translate(0, 0.69, 0),
          new BoxGeometry(3.9, 0.12, 2.2).translate(0, 1.2, 0),
          new BoxGeometry(3.85, 0.08, 2.15).translate(0, 0.26, 0),
        ].map((h) => h.toNonIndexed()),
    d;
  try {
    let h = await loadGLTF('assets/nature/Bull.json');
    d = clone(h.scene);
  } catch {
    d = null;
  }
  let u = new MeshStandardMaterial({
    color: 11842736,
    roughness: 0.82,
    metalness: 0,
    map: worldTexture('rock_ground_diff'),
  });
  if (
    ((u.onBeforeCompile = (h) => {
      ((h.vertexShader = h.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
varying vec3 vTp; varying vec3 vTn;`,
        )
        .replace(
          '#include <project_vertex>',
          `#include <project_vertex>
vTp = (modelMatrix * vec4(transformed, 1.0)).xyz; vTn = normalize(mat3(modelMatrix) * objectNormal);`,
        )),
        (h.fragmentShader = h.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
varying vec3 vTp; varying vec3 vTn;`,
          )
          .replace(
            '#include <map_fragment>',
            `
  vec3 bw = pow(abs(normalize(vTn)), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
  vec3 tx = texture2D(map, vTp.zy * 0.6).rgb * bw.x + texture2D(map, vTp.xz * 0.6).rgb * bw.y + texture2D(map, vTp.xy * 0.6).rgb * bw.z;
  // granito: la textura de roca, casi sin color y con un moteado fino
  float gl = dot(tx, vec3(0.3, 0.59, 0.11));
  float mot = fract(sin(dot(floor(vTp * 38.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  tx = mix(vec3(gl), tx, 0.25) * (0.9 + mot * 0.2);
  diffuseColor.rgb *= tx * 1.8;`,
          )));
    }),
    (u.customProgramCacheKey = () => 'piedra-triplanar'),
    d)
  ) {
    (d.traverse((b) => {
      b.isMesh && ((b.material = u), (b.castShadow = !0), (b.receiveShadow = !0), (b.frustumCulled = !1));
    }),
      (d.rotation.y = Math.PI / 2),
      l.add(d),
      l.updateMatrixWorld(!0));
    let h = new Box3().setFromObject(d, !0),
      p = h.getSize(new Vector3());
    (d.scale.multiplyScalar(3.1 / Math.max(p.x, p.z)),
      l.updateMatrixWorld(!0),
      (h = new Box3().setFromObject(d, !0)));
    let m = t ? 0 : 1.26;
    ((d.position.y += m - (h.min.y - r)),
      (d.position.x -= (h.min.x + h.max.x) / 2 - s.x),
      (d.position.z -= (h.min.z + h.max.z) / 2 - s.z),
      t && ((d.rotation.z = Math.PI / 2.2), (d.position.y += 0.6)),
      l.updateMatrixWorld(!0));
    let _ = _9(d, l, c);
    if (_) {
      l.remove(d);
      let b = new Mesh(_, u);
      ((b.name = 'toro_piedra'), l.add(b));
    }
  }
  if (!t) {
    let h = new MeshStandardMaterial({
        color: 2753285,
        emissive: 5899272,
        emissiveIntensity: 0.35,
        roughness: 0.1,
        metalness: 0.2,
      }),
      p = [
        new PlaneGeometry(0.12, 1).translate(0.35, 0.72, 1.01),
        new PlaneGeometry(0.07, 0.7).translate(-0.6, 0.8, 1.01),
        new CircleGeometry(0.5, 24)
          .rotateX(-Math.PI / 2)
          .scale(1.4, 1, 0.8)
          .translate(0.35, 0.235, 1.2),
      ],
      m = new Mesh(mergeGeometries(p), h);
    ((m.name = 'sangre'), (m.userData.noShadow = !0), l.add(m), (l.userData.blood = h));
  }
  return (
    l.traverse((h) => {
      h.isMesh && ((h.castShadow = !h.userData.noShadow), (h.receiveShadow = !0));
    }),
    a.add(l),
    n.blob(LAYER.pave, s.x, s.z, 3.4, 0.9),
    n.blob(LAYER.ao, s.x, s.z, 2.8, 0.45),
    (o.statue = l),
    l
  );
}
function _9(o, e, t = null) {
  let a = new Matrix4().copy(e.matrixWorld).invert(),
    n = [],
    s = new Vector3();
  if (
    (o.traverse((r) => {
      if (!r.isMesh) return;
      let l = r.geometry.getAttribute('position'),
        c = new Float32Array(l.count * 3),
        d = new Matrix4().multiplyMatrices(a, r.matrixWorld);
      for (let h = 0; h < l.count; h++)
        (r.isSkinnedMesh ? r.getVertexPosition(h, s) : s.fromBufferAttribute(l, h),
          s.applyMatrix4(d),
          (c[h * 3] = s.x),
          (c[h * 3 + 1] = s.y),
          (c[h * 3 + 2] = s.z));
      let u = new BufferGeometry();
      (u.setAttribute('position', new BufferAttribute(c, 3)),
        u.setAttribute('uv', new BufferAttribute(new Float32Array(l.count * 2), 2)),
        r.geometry.index && (u.setIndex(r.geometry.index.clone()), (u = u.toNonIndexed())),
        n.push(u));
    }),
    !n.length)
  )
    return null;
  for (let r of t || []) {
    let l = new BufferGeometry();
    (l.setAttribute('position', r.getAttribute('position')),
      l.setAttribute('uv', new BufferAttribute(new Float32Array(r.getAttribute('position').count * 2), 2)),
      n.push(l));
  }
  let i = mergeGeometries(n);
  return (i.computeVertexNormals(), i);
}
function w9(o, e, t, a = 1) {
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
const W3 = {
  wagon: ['Prop_Wagon', 0.85],
  crate: ['q_crate', 1],
  crate_b: ['q_crate', 0.95],
  barrel: ['q_barrel', 1],
  weaponrack: ['q_weaponstand', 1],
  lantern: ['post_lantern', 1],
  q_fence: ['Prop_WoodenFence_Single', 1],
  q_fence_b: ['Prop_WoodenFence_Extension1', 1],
  rubble: ['rubble', 0.32],
  rubble_large: ['rubble_large', 0.32],
  pillar: ['pillar', 0.7],
  pillar_deco: ['pillar_deco', 0.7],
  column: ['column', 0.7],
  torch_wall: ['torch_wall', 0.8],
  torch: ['torch', 0.9],
  candles: ['candles', 0.7],
  barrel_d: ['barrel_d', 0.45],
  banner: ['banner', 0.6],
  banner_thin: ['banner_thin', 0.6],
  chest_d: ['chest', 0.55],
  q_vase_rubble: ['q_vase_rubble', 1],
  coffin: ['coffin', 1],
  dead_tree: ['dead_tree', 1],
  stump: ['stump', 1],
  bones: ['bones', 1],
  vine_1: ['Prop_Vine4', 1],
  reeds: ['Grass_Wispy_Tall', 1.1],
  waterlily: ['waterlily', 1],
  rock_a: ['Rock_Medium_1', 0.8],
  rock_b: ['Rock_Medium_2', 0.8],
  rock_m1: ['Rock_Medium_1', 1],
  rock_m2: ['Rock_Medium_2', 1],
  rock_m3: ['Rock_Medium_3', 1],
  mushroom: ['Mushroom_Common', 1],
  fern: ['Fern_1', 1],
  bush_q: ['Bush_Common', 1],
};
const X3 = new Set(['cabbage', 'carrots', 'pumpkin', 'wheat', 'corn']);
const K3 = (o) => Uu(o)[0];
let qu = null;
let Y3 = null;
let t0 = null;

export { J3, K3 };
