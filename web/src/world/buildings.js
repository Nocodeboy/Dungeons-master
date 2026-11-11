// world/buildings.js
// Reconstruido de publicado/juego.js (módulo __esm «G3»). Nombres locales aún minificados.

import {
  Box3,
  BoxGeometry,
  BufferAttribute,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { hasPiece, pieceBounds, composeMatrix, pieceMesh } from './kit.js';
import { worldMaterial } from './materials.js';
import { Le } from './ground.js';
import { cellToWorld, worldToCell, HEX_SIZE, cellKey, degToRad } from './grid.js';

function BH(o, e, t) {
  let a = (o._bRegions ??= o.regions(['B', 'H'])),
    n = null,
    s = 1 / 0;
  for (let i of a)
    if (!t.has(i))
      for (let [r, l] of i) {
        let c = Math.abs(r - e[0]) + Math.abs(l - e[1]);
        c < s && ((s = c), (n = i));
      }
  return s <= 3 ? n : null;
}
function qH(o, e, t, a, n, s = 0.55) {
  let i = Math.cos(t),
    r = Math.sin(t),
    l = a / 2 - s,
    c = n / 2 - s,
    d = [];
  for (let [u, h] of [
    [-l, -c],
    [l, -c],
    [l, c],
    [-l, c],
    [0, c],
    [0, -c],
    [l, 0],
    [-l, 0],
  ])
    d.push([e.x + u * i + h * r, e.z - u * r + h * i]);
  return d.every(([u, h]) => o.has(cellKey(...worldToCell(u, h))));
}
function Zm(o, e) {
  let t = [];
  for (let a = 0; a < o / Oo; a++) t.push(['front', -o / 2 + 1 + a * Oo, e / 2, 0, a]);
  for (let a = 0; a < o / Oo; a++) t.push(['back', o / 2 - 1 - a * Oo, -e / 2, Math.PI, a]);
  for (let a = 0; a < e / Oo; a++) t.push(['right', o / 2, e / 2 - 1 - a * Oo, Math.PI / 2, a]);
  for (let a = 0; a < e / Oo; a++) t.push(['left', -o / 2, -e / 2 + 1 + a * Oo, -Math.PI / 2, a]);
  return t;
}
function Rc(o, e) {
  let { W: t, D: a, floors: n, rnd: s } = e,
    i = { windows: [], doorLocal: null, chimneyTop: null, lamps: [] };
  for (let l = 0; l < n; l++) {
    let c = q3[e.styles[Math.min(l, e.styles.length - 1)]],
      d = l * Bo;
    for (let [h, p, m, _, b] of Zm(t, a)) {
      let f = l === 0 && h === 'front' && b === e.door,
        v = c.plain,
        x = null,
        g = null;
      if (
        (f
          ? (v = c.door)
          : s() < (h === 'front' || h === 'back' ? 0.62 : 0.45)
            ? ([v, x, g] = s() < 0.55 ? c.wide : c.thin)
            : c.alt && s() < 0.3 && (v = c.alt),
        o.put(v, p, d, m, _),
        x)
      ) {
        o.put(x, p, d, m, _);
        let y = new Vector3(0, d + 1.8, 0.25)
          .applyAxisAngle(new Vector3(0, 1, 0), _)
          .add(new Vector3(p, 0, m));
        if ((i.windows.push(y), g && s() < e.shutters && o.put(g, p, d, m, _), s() < (e.boxes ?? 0.3))) {
          let w = new Vector3(0, 0, 0.3).applyAxisAngle(new Vector3(0, 1, 0), _);
          (o.geo(Hn(0.95, 0.16, 0.24), js().darkWood, p + w.x, d + 0.86, m + w.z, _),
            o.put(s() < 0.5 ? 'Flower_3_Group' : 'Flower_4_Group', p + w.x, d + 1, m + w.z, _, { s: 0.55 }));
        }
      }
      (f && (i.doorLocal = { x: p, y: d, z: m, ry: _ }),
        l > 0 && o.put('Wall_BottomCover', p, d, m, _),
        !f &&
          s() < e.vines &&
          l === n - 1 &&
          o.put(
            s() < 0.5 ? 'Prop_Vine1' : 'Prop_Vine2',
            p + (s() - 0.5) * 0.6 * Math.cos(_),
            d + 2.75,
            m + 0.12,
            _,
          ));
    }
    let u = c.corner;
    (o.put(u, -t / 2, d, a / 2, 0),
      o.put(u, t / 2, d, a / 2, Math.PI / 2),
      o.put(u, t / 2, d, -a / 2, Math.PI),
      o.put(u, -t / 2, d, -a / 2, -Math.PI / 2));
  }
  for (let l = -t / 2 + 1; l < t / 2; l += Oo)
    for (let c = -a / 2 + 1; c < a / 2; c += Oo) o.put('Floor_WoodDark', l, 0.03, c, 0);
  if (e.curb !== !1) {
    for (let [, l, c, d] of Zm(t, a)) o.put('Prop_ExteriorBorder_Straight1', l, -0.04, c, d, { sz: 0.55 });
    (o.put('Prop_ExteriorBorder_Corner', -t / 2, -0.04, a / 2, 0, { sz: 0.55, sx: 0.55 }),
      o.put('Prop_ExteriorBorder_Corner', t / 2, -0.04, a / 2, Math.PI / 2, { sz: 0.55, sx: 0.55 }),
      o.put('Prop_ExteriorBorder_Corner', t / 2, -0.04, -a / 2, Math.PI, { sz: 0.55, sx: 0.55 }),
      o.put('Prop_ExteriorBorder_Corner', -t / 2, -0.04, -a / 2, -Math.PI / 2, { sz: 0.55, sx: 0.55 }));
  }
  let r = n * Bo;
  return ((i.top = r), UH(o, t, a, r, e, i), i);
}
function UH(o, e, t, a, n, s) {
  let i = e <= t,
    r = i ? e : t,
    l = i ? t : e,
    d = (F3[r] || F3[4]).reduce((v, x) => (Math.abs(x - l) < Math.abs(v - l) ? x : v)),
    u = `Roof_RoundTiles_${r}x${d}`,
    h = i ? 0 : Math.PI / 2,
    p = l / d;
  o.put(u, 0, a, 0, h, { roof: !0, sz: p });
  let m = `Roof_Front_Brick${r}`;
  i
    ? (o.put(m, 0, a, t / 2, 0, { roof: !0 }), o.put(m, 0, a, -t / 2, Math.PI, { roof: !0 }))
    : (o.put(m, e / 2, a, 0, Math.PI / 2, { roof: !0 }), o.put(m, -e / 2, a, 0, -Math.PI / 2, { roof: !0 }));
  let _ = pieceBounds(u),
    b = _.max.y,
    f = _.max.x;
  if (((s.roofTop = a + b), n.chimney)) {
    let v = r / 2 - 0.9,
      g = (b * (1 - v / f) + 1.3 + 0.5) / 3.18,
      y = n.rnd() < 0.5 ? -1 : 1,
      w = (l / 2 - 1.1) * (n.rnd() < 0.5 ? -1 : 1),
      k = i ? v * y : w,
      T = i ? w : v * y;
    (o.put('Prop_Chimney', k, a - 0.5, T, 0, { roof: !0, sy: g, s: 0.9 }),
      (s.chimneyTop = new Vector3(k, a - 0.5 + 3.18 * g + 0.1, T)));
  }
  n.dormer &&
    r >= 6 &&
    o.put('Roof_Dormer_RoundTile', i ? -r / 2 + 0.6 : 0, a + 0.6, i ? 0 : r / 2 - 0.6, i ? -Math.PI / 2 : 0, {
      roof: !0,
    });
}
function Hn(o, e, t, a = 0) {
  let n = new BoxGeometry(o, e, t);
  return (n.translate(0, a + e / 2, 0), n);
}
function js() {
  return (
    Jm ||
    ((Jm = {
      wood: new MeshStandardMaterial({ color: 7031346, roughness: 0.85, name: 'madera_aspas' }),
      darkWood: new MeshStandardMaterial({ color: 4140062, roughness: 0.9, name: 'madera_oscura' }),
      cloth: new MeshStandardMaterial({ color: 15260864, roughness: 0.95, side: DoubleSide, name: 'lona' }),
      stone: new MeshStandardMaterial({ color: 10130570, roughness: 0.95, name: 'piedra' }),
      dark: new MeshStandardMaterial({ color: 460036, roughness: 1, name: 'negro' }),
      iron: new MeshStandardMaterial({ color: 3815478, roughness: 0.55, metalness: 0.6, name: 'hierro' }),
      brass: new MeshStandardMaterial({ color: 14724696, roughness: 0.35, metalness: 0.8, name: 'laton' }),
      coal: new MeshStandardMaterial({
        color: 2755844,
        emissive: 16734736,
        emissiveIntensity: 2.2,
        roughness: 0.9,
        name: 'brasas',
      }),
      hay: new MeshStandardMaterial({ color: 14202976, roughness: 1, name: 'heno' }),
      water: new MeshStandardMaterial({ color: 1845802, roughness: 0.15, metalness: 0.2, name: 'agua_pozo' }),
    }),
    Jm)
  );
}
function U3(o) {
  o.updateMatrixWorld(!0);
  let e = [];
  o.traverse((s) => {
    if (!s.isMesh) return;
    let i = (s.geometry.index ? s.geometry.toNonIndexed() : s.geometry.clone()).applyMatrix4(s.matrixWorld);
    for (let c of Object.keys(i.attributes)) ['position', 'normal'].includes(c) || i.deleteAttribute(c);
    let r = i.getAttribute('position').count,
      l = new Float32Array(r * 3);
    for (let c = 0; c < r; c++) l.set([s.material.color.r, s.material.color.g, s.material.color.b], c * 3);
    (i.setAttribute('color', new BufferAttribute(l, 3)), e.push(i));
  });
  let t = mergeGeometries(e, !1),
    a = worldMaterial(
      new MeshStandardMaterial({ vertexColors: !0, roughness: 0.9, side: DoubleSide, name: 'giratorio' }),
      { contact: null },
    ),
    n = new Mesh(t, a);
  return ((n.castShadow = !0), (n.receiveShadow = !0), n);
}
function jH() {
  let o = js(),
    e = new Group(),
    t = new Mesh(new CylinderGeometry(0.28, 0.28, 0.5, 10).rotateX(Math.PI / 2), o.darkWood);
  e.add(t);
  for (let a = 0; a < 4; a++) {
    let n = new Group();
    n.rotation.z = (a * Math.PI) / 2;
    let s = new Mesh(new BoxGeometry(0.14, 5.2, 0.12), o.wood);
    ((s.position.y = 2.6), n.add(s));
    let i = new Mesh(new PlaneGeometry(1.15, 3.9), o.cloth);
    (i.position.set(0.66, 3.05, 0.05), (i.rotation.y = 0.12), n.add(i));
    for (let l = 0; l < 6; l++) {
      let c = new Mesh(new BoxGeometry(1.3, 0.05, 0.05), o.wood);
      (c.position.set(0.62, 1.2 + l * 0.72, 0.02), n.add(c));
    }
    let r = new Mesh(new BoxGeometry(0.06, 3.9, 0.06), o.wood);
    (r.position.set(1.25, 3.05, 0.03), n.add(r), e.add(n));
  }
  return (
    e.traverse((a) => {
      a.isMesh && ((a.castShadow = !0), (a.receiveShadow = !0));
    }),
    e
  );
}
function GH(o = 1.7, e = 0.9) {
  let t = js(),
    a = new Group();
  for (let s of [-e / 2, e / 2]) {
    let i = new Mesh(new TorusGeometry(o, 0.07, 6, 28).rotateY(Math.PI / 2), t.wood);
    ((i.position.x = s), a.add(i));
    for (let r = 0; r < 6; r++) {
      let l = new Mesh(new BoxGeometry(0.07, o * 2, 0.09), t.wood);
      ((l.rotation.x = (r * Math.PI) / 6), (l.position.x = s), a.add(l));
    }
  }
  let n = new Mesh(new CylinderGeometry(0.12, 0.12, e + 0.8, 8).rotateZ(Math.PI / 2), t.darkWood);
  a.add(n);
  for (let s = 0; s < 14; s++) {
    let i = (s / 14) * Math.PI * 2,
      r = new Mesh(new BoxGeometry(e + 0.1, 0.06, 0.5), t.wood);
    (r.position.set(0, Math.cos(i) * (o - 0.15), Math.sin(i) * (o - 0.15)), (r.rotation.x = -i), a.add(r));
  }
  return (
    a.traverse((s) => {
      s.isMesh && ((s.castShadow = !0), (s.receiveShadow = !0));
    }),
    a
  );
}
function j3(o) {
  let { map: e, level: t, rnd: a, merger: n, ground: s } = o,
    i = new Set(),
    r = [],
    l = new Map();
  for (let u of t.objects || []) u.type === 'door' && u.target && l.set(cellKey(...u.target), u);
  let c = 1,
    d = new Vector3();
  for (let u of t.props || []) {
    if (u.foot == null) continue;
    let h = BH(e, u.cell, i);
    h && i.add(h);
    let p = h || [u.cell],
      m = new Set(p.map(([w, k]) => cellKey(w, k))),
      _ = new Vector3();
    for (let [w, k] of p) _.add(cellToWorld(w, k, d));
    _.divideScalar(p.length);
    let b = degToRad(u.rot || 0),
      f = l.get(cellKey(...u.cell));
    if (f) {
      let w = cellToWorld(f.cell[0], f.cell[1]);
      b = Math.atan2(w.x - _.x, w.z - _.z);
    }
    let v = {
        id: f?.id || `${u.key}_${u.cell.join('_')}`,
        key: u.key,
        prop: u,
        cells: p,
        set: m,
        center: _,
        ry: b,
        idx: 0,
        smoke: [],
        windows: [],
        lamps: [],
        dynamic: [],
        doorObj: f || null,
      },
      x = u.foot,
      g =
        x >= 2
          ? [
              [6, 6],
              [6, 4],
              [4, 6],
              [4, 4],
            ]
          : x === 1
            ? [
                [4, 4],
                [4, 2],
              ]
            : [[2, 2]],
      y = null;
    for (let w of [
      b,
      Math.round(b / degToRad(30)) * degToRad(30),
      Math.round(b / degToRad(60)) * degToRad(60),
    ])
      for (let [k, T] of g)
        if (qH(m, _, w, k, T)) {
          (!y || k * T > y.W * y.D) && (y = { W: k, D: T, ry: w });
          break;
        }
    (y || (y = { W: g[g.length - 1][0], D: g[g.length - 1][1], ry: b }),
      Object.assign(v, y),
      (v.idx = u.key === 'well' || u.key === 'market' ? 0 : c++),
      B3(o, v));
    for (let [w, k] of p)
      (cellToWorld(w, k, d), s.blob(Le.ao, d.x, d.z, 1.5, 0.5), s.blob(Le.path, d.x, d.z, 1.4, 0.5));
    r.push(v);
  }
  if (((o._nextBld = c), o.ambient === 'dusk' || o.ambient === 'day'))
    for (let u of VH(o)) {
      let h = {
        id: `afueras_${r.length}`,
        key: u.key,
        prop: { smoke: !0 },
        cells: [],
        set: new Set(),
        center: u.c,
        ry: u.ry,
        W: u.W,
        D: u.D,
        idx: o._nextBld++,
        smoke: [],
        windows: [],
        lamps: [],
        dynamic: [],
        doorObj: null,
        outside: !0,
      };
      if (h.idx > 62) break;
      (B3(o, h),
        o.ground.blob(Le.path, u.c.x, u.c.z, 3.4, 0.45),
        o.ground.blob(Le.ao, u.c.x, u.c.z, 3.2, 0.5),
        r.push(h));
    }
  return r;
}
function VH(o) {
  let { map: e, ground: t, rnd: a } = o,
    n = [],
    s = -HEX_SIZE * 0.5,
    i = e.sizeX,
    r = -HEX_SIZE * 0.5,
    l = e.sizeZ + HEX_SIZE * 0.5,
    c = 160;
  for (let d = 0; d < c && n.length < 7; d++) {
    let u = t.x0 + 3 + a() * (t.x1 - t.x0 - 6),
      h = t.z0 + 3 + a() * (t.z1 - t.z0 - 6),
      p = Math.max(s - u, u - i, r - h, h - l);
    if (p < 4.5 || p > o.ground.margin - 3) continue;
    let m = !1,
      _ = !1;
    for (let v = 0; v < 8; v++) {
      let x = u + Math.cos((v / 8) * Math.PI * 2) * 4.5,
        g = h + Math.sin((v / 8) * Math.PI * 2) * 4.5;
      (t.maskAt(Le.path, x, g) > 0.4 && (m = !0), t.waterAt(x, g) > 0.02 && (_ = !0));
    }
    for (let v = 0; v < 6; v++) {
      let x = u + Math.cos((v / 6) * Math.PI * 2) * 2.6,
        g = h + Math.sin((v / 6) * Math.PI * 2) * 2.6;
      (t.maskAt(Le.path, x, g) > 0.3 || t.waterAt(x, g) > 0.01) && (_ = !0);
    }
    if (_ || (!m && a() < 0.75) || n.some((v) => v.c.distanceTo(new Vector3(u, 0, h)) < 9)) continue;
    let b = Math.atan2((s + i) / 2 - u, (r + l) / 2 - h) + (a() - 0.5) * 0.6,
      f = a() < 0.4;
    n.push({ key: 'house', c: new Vector3(u, 0, h), ry: b, W: 4, D: f ? 6 : 4 });
  }
  return n;
}
function B3(o, e) {
  let { merger: t, rnd: a, ground: n } = o,
    s = composeMatrix(e.center.x, n.heightAt(e.center.x, e.center.z), e.center.z, e.ry);
  e.base = s;
  let i = new Color(O3[Math.floor(a() * O3.length)]).multiplyScalar(1.4);
  (e.key === 'house_blue' && i.set(6259888), e.key === 'house_green' && i.set(6983760));
  let r = new P1(t, s, e.idx, { MI_WoodTrim_Wear: i }),
    l = e.W,
    c = e.D,
    d = Math.floor((l / Oo - 1) / 2),
    u;
  switch (e.key) {
    case 'tavern':
      ((u = Rc(r, {
        W: l,
        D: c,
        floors: 2,
        styles: ['brick', 'upper'],
        door: d,
        shutters: 0.8,
        vines: 0.3,
        chimney: !0,
        dormer: !0,
        rnd: a,
      })),
        WH(o, e, r, u));
      break;
    case 'church':
      u = XH(r, e, a);
      break;
    case 'blacksmith':
      ((u = Rc(r, {
        W: 4,
        D: 4,
        floors: 1,
        styles: ['brick'],
        door: 0,
        shutters: 0.5,
        vines: 0.1,
        chimney: !0,
        rnd: a,
      })),
        YH(o, e, r, u));
      break;
    case 'windmill':
      u = KH(o, e, r);
      break;
    case 'watermill':
      ((u = Rc(r, {
        W: 4,
        D: 4,
        floors: 2,
        styles: ['brick', 'upper'],
        door: 0,
        shutters: 0.6,
        vines: 0.4,
        chimney: !1,
        rnd: a,
      })),
        JH(o, e, r));
      break;
    case 'mine':
      u = ZH(o, e, r);
      break;
    case 'grain':
      u = Rc(r, {
        W: 4,
        D: 4,
        floors: 1,
        styles: ['plaster'],
        door: 0,
        shutters: 0.2,
        vines: 0.2,
        chimney: !1,
        rnd: a,
      });
      for (let _ = 0; _ < 3; _++) QH(r, 2.6 + a() * 0.3, 0, -1 + _ * 1, a);
      break;
    case 'market':
      u = e9(o, e, r);
      break;
    case 'well':
      u = t9(o, e, r);
      break;
    case 'ruin':
      u = a9(o, e, r);
      break;
    default: {
      let _ = l >= 6 || a() < 0.55;
      u = Rc(r, {
        W: l,
        D: c,
        floors: _ ? 2 : 1,
        styles: _ ? [a() < 0.6 ? 'brick' : 'plaster', 'upper'] : [a() < 0.5 ? 'plaster' : 'brick'],
        door: d,
        shutters: 0.75,
        vines: 0.35,
        chimney: !0,
        dormer: l >= 6,
        rnd: a,
      });
    }
  }
  ((e.top = u.roofTop ?? u.top ?? 4),
    u.chimneyTop &&
      e.prop.smoke !== !1 &&
      e.smoke.push(r.world(u.chimneyTop.x, u.chimneyTop.y, u.chimneyTop.z)));
  for (let _ of u.windows || []) e.windows.push(r.world(_.x, _.y, _.z));
  if (u.doorLocal) {
    let _ = u.doorLocal,
      b =
        e.key === 'church'
          ? 'Door_2_Round'
          : e.key === 'tavern'
            ? 'Door_8_Round'
            : a() < 0.5
              ? 'Door_1_Round'
              : 'Door_4_Flat';
    if (hasPiece(b) && !e.doorObj) {
      let f = new Matrix4()
        .makeRotationY(_.ry)
        .setPosition(_.x, _.y, _.z)
        .multiply(new Matrix4().makeTranslation(-0.55, 0, -0.08));
      r.merger.add(b, new Matrix4().multiplyMatrices(s, f), { bld: e.idx, tints: r.tints });
    }
    if (hasPiece(b) && e.doorObj) {
      let f = pieceMesh(b, { fade: null });
      f.traverse((g) => {
        g.isMesh && (g.castShadow = !1);
      });
      let v = new Group();
      (v.position.set(_.x, _.y, _.z), (v.rotation.y = _.ry));
      let x = new Group();
      (x.position.set(-0.55, 0, -0.08),
        x.add(f),
        v.add(x),
        v.applyMatrix4(s),
        (e.doorLeaf = x),
        e.dynamic.push(v));
    }
    if (hasPiece(b)) {
      e.doorWorld = r.world(_.x, 0, _.z + 0.6);
      let f = new Vector3(_.x + 0.95, _.y + 2.35, _.z + 0.3);
      hasPiece('q_lantern') &&
        a() < 0.85 &&
        (r.put('q_lantern', f.x, f.y - 0.35, _.z + 0.44, _.ry),
        e.lamps.push({
          pos: r.world(f.x, f.y - 0.05, _.z + 0.72),
          color: 16756832,
          range: 6,
          energy: 1.2,
          kind: 'wall',
        }));
    }
  }
  ((e.parts = u), $H(o, e, r));
  let h = e.W / 2 + 0.8,
    p = e.D / 2 + 0.8,
    m = new Box3();
  for (let [_, b] of [
    [-h, -p],
    [h, -p],
    [h, p],
    [-h, p],
  ])
    for (let f of [0, e.top]) m.expandByPoint(r.world(_, f, b));
  e.box = m;
}
function $H(o, e, t) {
  let a = o.rnd;
  if (!e.set?.size || ['market', 'well', 'mine', 'ruin'].includes(e.key)) return;
  let n = ['q_barrel', 'q_crate', 'lumber', 'q_bucket', 'sack', 'q_farmcrate', 'q_barrel', 'stump'],
    s = e.W,
    i = e.D,
    r = 0;
  for (let l = 0; l < 14 && r < 4; l++) {
    let c = Math.floor(a() * 4),
      d = (a() - 0.5) * (c < 2 ? s : i) * 0.85,
      u = 0.65 + a() * 0.35,
      h = c === 0 || c === 1 ? d : c === 2 ? s / 2 + u : -s / 2 - u,
      p = c === 0 ? i / 2 + u : c === 1 ? -i / 2 - u : d;
    if (c === 0 && Math.abs(h) < 1.4) continue;
    let m = t.world(h, 0, p);
    if (!e.set.has(cellKey(...worldToCell(m.x, m.z)))) continue;
    let _ = n[Math.floor(a() * n.length)];
    (t.put(_, h, 0, p, a() * 6.28, { s: 0.85 + a() * 0.25 }), r++);
  }
}
function WH(o, e, t, a) {
  let n = js(),
    s = a.doorLocal;
  if (!s) return;
  let i = s.x - 1.45,
    r = Hn(0.07, 0.07, 1.15);
  t.geo(r, n.darkWood, i, 2.95, s.z + 0.68, s.ry);
  let l = Hn(0.05, 0.05, 0.75);
  (l.rotateX(0.75), t.geo(l, n.darkWood, i, 2.62, s.z + 0.38, s.ry));
  let c = document.createElement('canvas');
  ((c.width = 256), (c.height = 192));
  let d = c.getContext('2d');
  ((d.fillStyle = '#5a3a22'),
    d.fillRect(0, 0, 256, 192),
    (d.strokeStyle = '#2e1c10'),
    (d.lineWidth = 10),
    d.strokeRect(5, 5, 246, 182),
    (d.fillStyle = '#e8d6b0'),
    d.beginPath(),
    d.ellipse(132, 112, 72, 34, 0, 0, Math.PI * 2),
    d.fill(),
    d.beginPath(),
    d.ellipse(62, 122, 28, 22, -0.3, 0, Math.PI * 2),
    d.fill(),
    (d.strokeStyle = '#e8d6b0'),
    (d.lineWidth = 7),
    d.beginPath(),
    d.moveTo(50, 104),
    d.quadraticCurveTo(36, 78, 54, 70),
    d.moveTo(70, 102),
    d.quadraticCurveTo(80, 76, 96, 78),
    d.stroke(),
    (d.fillStyle = '#2e1c10'),
    (d.font = 'bold 22px Georgia, serif'),
    (d.textAlign = 'center'),
    d.fillText('ZZZ', 196, 62));
  let u = new CanvasTexture(c);
  u.colorSpace = SRGBColorSpace;
  let h = new Mesh(
    new PlaneGeometry(0.85, 0.64),
    worldMaterial(
      new MeshStandardMaterial({ map: u, roughness: 0.8, side: DoubleSide, name: 'cartel_posada' }),
      {
        contact: null,
      },
    ),
  );
  (h.position.copy(t.world(i, 2.45, s.z + 1.12)),
    (h.rotation.y = e.ry + s.ry + Math.PI / 2),
    (h.castShadow = !0),
    e.dynamic.push(h),
    t.put('q_bench', s.x + 2, 0, s.z + 0.9, s.ry),
    t.put('q_barrel', s.x - 2.2, 0, s.z + 0.7, s.ry));
}
function XH(o, e, t) {
  let a = Math.min(e.W, 6),
    n = Math.max(Math.min(e.D, 6), 4),
    s = Rc(o, {
      W: a,
      D: n,
      floors: 2,
      styles: ['brick', 'brick'],
      door: Math.floor((a / Oo - 1) / 2),
      shutters: 0,
      vines: 0.25,
      chimney: !1,
      rnd: () => t() * 0.9 + 0.05,
    }),
    i = -a / 2 - 0.2,
    r = n / 2 - 0.6;
  for (let d = 0; d < 3; d++) {
    let u = d * Bo;
    for (let [h, p, m] of [
      [i, r + 1, 0],
      [i + 1, r, Math.PI / 2],
      [i, r - 1, Math.PI],
      [i - 1, r, -Math.PI / 2],
    ])
      (o.put(d === 2 ? 'Wall_UnevenBrick_Window_Thin_Round' : 'Wall_UnevenBrick_Straight', h, u, p, m, {
        sx: 1,
      }),
        d === 2 && o.put('Window_Thin_Round1', h, u, p, m));
    (o.put('Corner_Exterior_Brick', i - 1, u, r + 1, 0),
      o.put('Corner_Exterior_Brick', i + 1, u, r + 1, Math.PI / 2),
      o.put('Corner_Exterior_Brick', i + 1, u, r - 1, Math.PI),
      o.put('Corner_Exterior_Brick', i - 1, u, r - 1, -Math.PI / 2));
  }
  o.put('Roof_Tower_RoundTiles', i, 3 * Bo, r, 0, { roof: !0, s: 0.48 });
  let l = js(),
    c = new CylinderGeometry(0.55, 0.55, 0.06, 24).rotateX(Math.PI / 2);
  o.geo(c, l.brass, 0, 2 * Bo + 1, n / 2 + 0.35, 0, { roof: !0 });
  for (let d = 0; d < 12; d++) {
    let h = Hn(0.06, 0.32, 0.04)
      .clone()
      .translate(0, 0.62, 0)
      .rotateZ((d / 12) * Math.PI * 2);
    o.geo(h, l.brass, 0, 2 * Bo + 1, n / 2 + 0.36, 0, { roof: !0 });
  }
  return ((s.roofTop = Math.max(s.roofTop || 0, 3 * Bo + 3.4)), s);
}
function YH(o, e, t, a) {
  let n = js(),
    s = 2;
  for (let [l, c] of [
    [s + 1.8, 1.4],
    [s + 1.8, -1.4],
  ])
    t.geo(Hn(0.18, 2.5, 0.18), n.darkWood, l, 0, c);
  (t.geo(Hn(2.2, 0.12, 3.4), n.darkWood, s + 0.9, 2.45, 0, 0, { roof: !0 }),
    t.put('Roof_Wooden_2x1', s + 0.9, 2.5, -1, -Math.PI / 2, { roof: !0, s: 1.1 }),
    t.put('Roof_Wooden_2x1', s + 0.9, 2.5, 1, -Math.PI / 2, { roof: !0, s: 1.1 }),
    t.geo(Hn(1.1, 0.8, 1.1), n.stone, s + 0.6, 0, -0.6));
  let i = new CylinderGeometry(0.38, 0.42, 0.12, 12);
  (i.translate(0, 0.86, 0),
    t.geo(i, n.coal, s + 0.6, 0, -0.6),
    t.put('q_anvil', s + 0.8, 0, 0.8, 0.4),
    t.put('bucket_metal', s + 1.4, 0, -1.3, 0));
  let r = t.world(s + 0.6, 1.2, -0.6);
  (e.lamps.push({ pos: r, color: 16738848, range: 5, energy: 2, kind: 'forge' }),
    e.smoke.push(t.world(s + 0.6, 2.7, -0.6)));
}
function KH(o, e, t) {
  let a = o.rnd,
    n = { windows: [], doorLocal: null },
    s = 4;
  for (let l = 0; l < 3; l++) {
    let c = q3[l < 2 ? 'brick' : 'upper'],
      d = l * Bo;
    for (let [u, h, p, m, _] of Zm(s, s)) {
      let b = l === 0 && u === 'front' && _ === 0,
        f = b ? c.door : c.plain;
      if (!b && l > 0 && a() < 0.5) {
        let [v, x] = c.thin;
        ((f = v), t.put(x, h, d, p, m));
      }
      (t.put(f, h, d, p, m), b && (n.doorLocal = { x: h, y: d, z: p, ry: m }));
    }
    (t.put(c.corner, -2, d, 2, 0),
      t.put(c.corner, 2, d, 2, Math.PI / 2),
      t.put(c.corner, 2, d, -2, Math.PI),
      t.put(c.corner, -2, d, -2, -Math.PI / 2));
  }
  (t.put('Roof_Tower_RoundTiles', 0, 3 * Bo, 0, 0, { roof: !0, s: 0.82 }),
    (n.top = 3 * Bo),
    (n.roofTop = 3 * Bo + 5.8));
  let i = U3(jH()),
    r = new Group();
  return (
    r.position.set(0, 3 * Bo - 0.2, s / 2 + 0.45),
    r.add(i),
    r.applyMatrix4(e.base),
    e.dynamic.push(r),
    (e.update = (l) => {
      i.rotation.z -= l * 0.35;
    }),
    n
  );
}
function JH(o, e, t) {
  let { ground: a } = o,
    n = 1,
    s = -1;
  for (let c of [1, -1]) {
    let d = t.world(c * 3, 0, 0),
      u = a.waterAt(d.x, d.z) + a.waterAt(t.world(c * 4.2, 0, 0).x, t.world(c * 4.2, 0, 0).z);
    u > s && ((s = u), (n = c));
  }
  let i = U3(GH(1.75, 0.9)),
    r = new Group();
  (r.position.set(n * 2.75, 1.25, 0), r.add(i), r.applyMatrix4(e.base), e.dynamic.push(r));
  let l = js();
  (t.geo(Hn(0.25, 1.5, 0.25), l.darkWood, n * 2.4, 0, 0.7),
    t.geo(Hn(0.25, 1.5, 0.25), l.darkWood, n * 2.4, 0, -0.7),
    (e.update = (c) => {
      i.rotation.x += c * 0.6 * -n;
    }));
}
function ZH(o, e, t) {
  let a = o.rnd,
    n = js(),
    s = ['Rock_Medium_1', 'Rock_Medium_2', 'Rock_Medium_3'],
    i = [
      [-2.2, -1.2, 3.2],
      [2.2, -1, 3],
      [0, -2.4, 3.6],
      [-2.8, 1, 2.2],
      [2.9, 1.2, 2.3],
      [-1.2, -0.2, 2.8],
      [1.3, 0, 2.6],
      [0, -0.8, 3],
    ];
  for (let [r, l, c] of i)
    t.put(a.pick ? a.pick(s) : s[Math.floor(a() * 3)], r, -0.3, l, a() * 6.28, { s: c * 0.95, roof: !0 });
  t.geo(Hn(1.6, 2.1, 0.2), n.dark, 0, 0, 0.9);
  for (let r of [-0.95, 0.95]) t.geo(Hn(0.24, 2.3, 0.24), n.darkWood, r, 0, 1.15);
  t.geo(Hn(2.3, 0.26, 0.3), n.darkWood, 0, 2.2, 1.15);
  for (let r = 0; r < 6; r++) t.geo(Hn(0.9, 0.06, 0.14), n.darkWood, 0, 0.02, 1.4 + r * 0.45);
  for (let r of [-0.35, 0.35]) t.geo(Hn(0.05, 0.06, 2.8), n.iron, r, 0.06, 2.4);
  return (
    t.put('q_pickaxe', 1.4, 0, 1.8, 0.6),
    t.put('crate_open', -1.5, 0, 2, 0.3),
    t.put('q_lantern', 1.15, 1.5, 1.4, 0),
    e.lamps.push({ pos: t.world(1.15, 1.7, 1.5), color: 16752720, range: 5, energy: 1.1, kind: 'wall' }),
    { top: 3, roofTop: 4.5, windows: [] }
  );
}
function QH(o, e, t, a, n) {
  let s = js(),
    i = new CylinderGeometry(0.42, 0.42, 0.9, 12).rotateZ(Math.PI / 2).translate(0, 0.42, 0);
  o.geo(i, s.hay, e, t, a, n() * 0.6);
}
function e9(o, e, t) {
  let a = o.rnd;
  return (
    t.put('q_stall', -1.3, 0, 0, 0),
    t.put('q_stall_cart', 1.6, 0, 0.3, -0.3),
    t.put('q_farmcrate_apple', -1, 0, 1.4, 0.2),
    t.put('q_farmcrate_carrot', -2, 0, 1.3, -0.3),
    t.put('q_barrel_apples', 0.4, 0, 1.6, 0),
    t.put('sack', 2.6, 0, 1.4, a() * 6),
    { top: 2.5, roofTop: 3, windows: [] }
  );
}
function t9(o, e, t) {
  let a = js(),
    n = new CylinderGeometry(0.85, 0.92, 0.85, 16, 1, !0);
  n.translate(0, 0.42, 0);
  let s = new MeshStandardMaterial({
    color: 12102552,
    roughness: 0.95,
    side: DoubleSide,
    name: 'piedra_pozo',
  });
  t.geo(n, s, 0, 0, 0);
  let i = new TorusGeometry(0.88, 0.1, 6, 18).rotateX(Math.PI / 2).translate(0, 0.86, 0);
  t.geo(i, s, 0, 0, 0);
  let r = new CircleGeometry(0.8, 16).rotateX(-Math.PI / 2).translate(0, 0.35, 0);
  t.geo(r, a.water, 0, 0, 0);
  for (let l of [-0.8, 0.8]) t.geo(Hn(0.14, 2.1, 0.14), a.darkWood, l, 0, 0);
  return (
    t.geo(
      new CylinderGeometry(0.07, 0.07, 1.8, 8).rotateZ(Math.PI / 2).translate(0, 1.75, 0),
      a.darkWood,
      0,
      0,
      0,
    ),
    t.put('Roof_Wooden_2x1', 0, 2, -0.55, 0, { roof: !0, s: 0.72 }),
    t.put('Roof_Wooden_2x1', 0, 2, 0.55, Math.PI, { roof: !0, s: 0.72 }),
    t.put('q_bucket', 0.6, 0.88, 0.2, 0),
    { top: 2.2, roofTop: 2.9, windows: [] }
  );
}
function a9(o, e, t) {
  let a = o.rnd,
    n = 4,
    s = 6;
  for (let [i, r, l, c] of Zm(n, s)) {
    if (a() < 0.25) continue;
    let d =
      i === 'front'
        ? 'Wall_UnevenBrick_Door_Round'
        : a() < 0.5
          ? 'Wall_UnevenBrick_Window_Thin_Round'
          : 'Wall_UnevenBrick_Straight';
    t.put(d, r, -0.2 - a() * 0.6, l, c + (a() - 0.5) * 0.05, { sy: 0.45 + a() * 0.5 });
  }
  for (let i = 0; i < 6; i++)
    t.put(`Prop_Brick${1 + Math.floor(a() * 4)}`, (a() - 0.5) * 6, 0, (a() - 0.5) * 7, a() * 6.28);
  return { top: 3, roofTop: 3, windows: [] };
}
const Oo = 2;
const Bo = 3;
const F3 = { 4: [4, 6, 8], 6: [6, 8, 10], 8: [8, 10] };
const O3 = [8010282, 4151930, 5139002, 9071162, 5982826, 6959152];
const P1 = class {
  constructor(e, t, a, n) {
    ((this.merger = e),
      (this.base = t),
      (this.bld = a),
      (this.tints = n),
      (this.m = new Matrix4()),
      (this.l = new Matrix4()));
  }
  put(e, t, a, n, s = 0, { roof: i = !1, s: r = 1, sx: l = null, sy: c = null, sz: d = null } = {}) {
    if (!hasPiece(e)) return;
    let u = new Vector3(l ?? r, c ?? r, d ?? r);
    (composeMatrix(t, a, n, s, u, this.l),
      this.m.multiplyMatrices(this.base, this.l),
      this.merger.add(e, this.m, { bld: this.bld, roof: i, tints: this.tints }));
  }
  geo(e, t, a, n, s, i = 0, { roof: r = !1, s: l = 1 } = {}) {
    (composeMatrix(a, n, s, i, l, this.l),
      this.m.multiplyMatrices(this.base, this.l),
      this.merger.addGeometry(e, t, this.m, { bld: this.bld, roof: r }));
  }
  world(e, t, a, n = new Vector3()) {
    return n.set(e, t, a).applyMatrix4(this.base);
  }
};
const q3 = {
  brick: {
    plain: 'Wall_UnevenBrick_Straight',
    wide: ['Wall_UnevenBrick_Window_Wide_Round', 'Window_Wide_Round1', 'WindowShutters_Wide_Round_Open'],
    thin: ['Wall_UnevenBrick_Window_Thin_Round', 'Window_Thin_Round1', 'WindowShutters_Thin_Round_Open'],
    door: 'Wall_UnevenBrick_Door_Round',
    corner: 'Corner_Exterior_Brick',
  },
  plaster: {
    plain: 'Wall_Plaster_Straight_Base',
    wide: ['Wall_Plaster_Window_Wide_Flat', 'Window_Wide_Flat1', 'WindowShutters_Wide_Flat_Open'],
    thin: ['Wall_Plaster_Window_Thin_Round', 'Window_Thin_Round1', 'WindowShutters_Thin_Round_Open'],
    door: 'Wall_Plaster_Door_Flat',
    corner: 'Corner_Exterior_Wood',
  },
  upper: {
    plain: 'Wall_Plaster_WoodGrid',
    wide: ['Wall_Plaster_Window_Wide_Round', 'Window_Wide_Round1', 'WindowShutters_Wide_Round_Open'],
    thin: ['Wall_Plaster_Window_Thin_Round', 'Window_Thin_Round1', 'WindowShutters_Thin_Round_Closed'],
    door: 'Wall_Plaster_Door_Round',
    corner: 'Corner_Exterior_Wood',
    alt: 'Wall_Plaster_Straight',
  },
};
let Jm = null;

export { j3 };
