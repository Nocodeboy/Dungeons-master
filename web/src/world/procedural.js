// world/procedural.js
// Reconstruido de publicado/juego.js (módulo __esm «sk»). Nombres locales aún minificados.

import {
  AdditiveBlending,
  Box3,
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { hasPiece, isFlatMaterial, pieceMesh, MeshMerger } from './kit.js';
import { standardMaterial } from './materials.js';
import { cellToWorld, degToRad } from './grid.js';
import { Le } from './ground.js';

function mo() {
  return (
    a0 ||
    ((a0 = {
      wood: standardMaterial({ color: 8016438, roughness: 0.8 }),
      dark: standardMaterial({ color: 3876889, roughness: 0.9 }),
      iron: standardMaterial({ color: 4538684, roughness: 0.5, metalness: 0.7 }),
      brass: standardMaterial({ color: 13146696, roughness: 0.35, metalness: 0.85 }),
      stone: standardMaterial({ color: 9275261, roughness: 0.95 }),
      stoneDark: standardMaterial({ color: 6117458, roughness: 0.95 }),
      paper: standardMaterial({ color: 15524552, roughness: 1 }),
      hole: new MeshBasicMaterial({ color: 328707 }),
      cloth: standardMaterial({ color: 6965806, roughness: 1 }),
      rune: new MeshStandardMaterial({
        color: 2760728,
        emissive: 16742960,
        emissiveIntensity: 0,
        roughness: 0.8,
      }),
      runeBlue: new MeshStandardMaterial({
        color: 1712166,
        emissive: 6336767,
        emissiveIntensity: 0,
        roughness: 0.8,
      }),
      sealGlow: new MeshStandardMaterial({
        color: 2098180,
        emissive: 16719888,
        emissiveIntensity: 1.2,
        roughness: 0.7,
      }),
      ember: new MeshStandardMaterial({
        color: 1705986,
        emissive: 16732176,
        emissiveIntensity: 1.5,
        roughness: 1,
      }),
    }),
    a0)
  );
}
function T9(o = 1) {
  let e = mo(),
    t = new Group(),
    a = ia(0.9, 0.48, 0.58, e.wood);
  t.add(a);
  for (let i of [-0.36, 0.36]) t.add(ia(0.07, 0.5, 0.6, e.iron, i, 0, 0));
  let n = new Group();
  n.position.set(0, 0.48, -0.29);
  let s = new Mesh(
    new CylinderGeometry(0.29, 0.29, 0.9, 12, 1, !1, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI / 2),
    e.wood,
  );
  (s.position.set(0, 0, 0.29), s.scale.set(1, 0.7, 1), (s.castShadow = !0), n.add(s));
  for (let i of [-0.36, 0.36]) {
    let r = new Mesh(
      new CylinderGeometry(0.3, 0.3, 0.07, 12, 1, !1, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI / 2),
      e.iron,
    );
    (r.position.set(i, 0, 0.29), r.scale.set(1, 0.7, 1), n.add(r));
  }
  return (
    t.add(n),
    t.add(ia(0.12, 0.14, 0.04, e.brass, 0, 0.32, 0.3)),
    t.scale.setScalar(o),
    (t.userData.lid = n),
    t
  );
}
function ek(o, e, t) {
  (o.clearRect(0, 0, t, t),
    (o.strokeStyle = '#fff'),
    (o.lineWidth = t * 0.07),
    (o.lineCap = 'round'),
    (o.lineJoin = 'round'));
  let a = t / 2;
  switch ((o.beginPath(), e)) {
    case 'agua':
      for (let n = 0; n < 3; n++) {
        let s = a - t * 0.18 + n * t * 0.18;
        (o.moveTo(t * 0.2, s),
          o.bezierCurveTo(t * 0.35, s - t * 0.12, t * 0.45, s + t * 0.12, a, s),
          o.bezierCurveTo(t * 0.55, s - t * 0.12, t * 0.65, s + t * 0.12, t * 0.8, s));
      }
      break;
    case 'monte':
      (o.moveTo(t * 0.15, t * 0.75),
        o.lineTo(t * 0.4, t * 0.3),
        o.lineTo(t * 0.55, t * 0.55),
        o.lineTo(t * 0.68, t * 0.38),
        o.lineTo(t * 0.85, t * 0.75),
        o.closePath());
      break;
    case 'cuernos':
      (o.moveTo(t * 0.2, t * 0.25),
        o.quadraticCurveTo(t * 0.25, t * 0.6, a, t * 0.62),
        o.quadraticCurveTo(t * 0.75, t * 0.6, t * 0.8, t * 0.25),
        o.moveTo(a, t * 0.62),
        o.lineTo(a, t * 0.85));
      break;
    case 'ojo':
      (o.moveTo(t * 0.15, a),
        o.quadraticCurveTo(a, t * 0.2, t * 0.85, a),
        o.quadraticCurveTo(a, t * 0.8, t * 0.15, a),
        o.moveTo(a + t * 0.09, a),
        o.arc(a, a, t * 0.09, 0, Math.PI * 2));
      break;
    case 'llama':
      (o.moveTo(a, t * 0.15),
        o.bezierCurveTo(t * 0.75, t * 0.45, t * 0.7, t * 0.8, a, t * 0.85),
        o.bezierCurveTo(t * 0.3, t * 0.8, t * 0.25, t * 0.5, t * 0.45, t * 0.4),
        o.bezierCurveTo(t * 0.45, t * 0.55, t * 0.55, t * 0.6, a, t * 0.15));
      break;
    default:
      (o.moveTo(a, t * 0.15),
        o.lineTo(a, t * 0.85),
        o.moveTo(a, t * 0.35),
        o.lineTo(t * 0.72, t * 0.2),
        o.moveTo(a, t * 0.55),
        o.lineTo(t * 0.28, t * 0.4));
  }
  o.stroke();
}
function E9() {
  let o = mo(),
    e = new Group();
  (e.add(ia(2.1, 0.85, 0.95, o.stone, 0, 0, 0)), e.add(ia(2.25, 0.12, 1.08, o.stoneDark, 0, 0, 0)));
  let t = new Group(),
    a = ia(2.2, 0.16, 1.02, o.stone, 0, 0, 0);
  t.add(a);
  let n = ia(1.3, 0.1, 0.36, o.stoneDark, 0, 0.16, 0);
  t.add(n);
  let s = new Mesh(new SphereGeometry(0.17, 10, 8), o.stoneDark);
  return (
    s.position.set(-0.8, 0.24, 0),
    s.scale.set(1, 0.6, 1),
    t.add(s),
    (t.position.y = 0.85),
    e.add(t),
    (e.userData.lid = t),
    (e.userData.slide = !0),
    e
  );
}
function S9(o = !1) {
  let e = mo(),
    t = new Group(),
    a = new CylinderGeometry(0.32, 0.42, 1.5, 6, 3),
    n = a.getAttribute('position');
  for (let h = 0; h < n.count; h++) {
    let p = n.getY(h);
    (n.setX(h, n.getX(h) * (1 + Math.sin(h * 1.7) * 0.06)),
      n.setZ(h, n.getZ(h) * 0.62 * (1 + Math.cos(h * 2.3) * 0.06)),
      p > 0.6 && n.setX(h, n.getX(h) * 0.8));
  }
  a.computeVertexNormals();
  let s = new Group(),
    i = new Mesh(a, e.stone);
  ((i.position.y = 0.72), (i.castShadow = !0), (i.receiveShadow = !0), s.add(i));
  let r = 128,
    l = document.createElement('canvas');
  ((l.width = l.height = r), ek(l.getContext('2d'), null, r));
  let c = new CanvasTexture(l),
    d = new MeshStandardMaterial({
      color: 1709072,
      emissive: o ? 7387391 : 16752704,
      emissiveMap: c,
      alphaMap: c,
      transparent: !0,
      emissiveIntensity: 0.35,
      roughness: 0.8,
      depthWrite: !1,
    }),
    u = new Mesh(new PlaneGeometry(0.42, 0.42), d);
  return (
    u.position.set(0, 0.95, 0.265),
    (u.rotation.x = -0.05),
    s.add(u),
    t.add(s),
    (t.userData.glow = d),
    (t.userData.turn = s),
    (t.userData.setGlyph = (h) => {
      (ek(l.getContext('2d'), h, r), (c.needsUpdate = !0));
    }),
    t
  );
}
function k9() {
  let o = mo(),
    e = new Group(),
    t = ia(1.1, 1.7, 0.3, o.stone, 0, 0, 0);
  (e.add(t), e.add(ia(1.3, 0.2, 0.42, o.stoneDark, 0, 0, 0)));
  let a = o.rune.clone();
  a.emissiveIntensity = 0.6;
  for (let n = 0; n < 4; n++) {
    let s = new Mesh(new PlaneGeometry(0.7 - (n % 2) * 0.15, 0.05), a);
    (s.position.set(0, 1.3 - n * 0.2, 0.152), e.add(s));
  }
  return ((e.userData.glow = a), e);
}
function A9() {
  let o = mo(),
    e = new Group(),
    t = new Mesh(new CylinderGeometry(0.42, 0.5, 0.95, 8), o.stone);
  ((t.position.y = 0.47), (t.castShadow = !0), e.add(t));
  let a = new Mesh(new CylinderGeometry(0.5, 0.42, 0.12, 8), o.stoneDark);
  ((a.position.y = 1), e.add(a));
  let n = new Mesh(new CircleGeometry(0.16, 12).rotateX(-Math.PI / 2), o.hole);
  ((n.position.y = 1.065), e.add(n));
  let s = new Mesh(new ConeGeometry(0.1, 0.65, 10, 4, !1), o.stone),
    i = s.geometry.getAttribute('position');
  for (let r = 0; r < i.count; r++) {
    let l = i.getY(r) + 0.325;
    i.setX(r, i.getX(r) + l * l * 0.35);
  }
  return (
    s.geometry.computeVertexNormals(),
    s.position.set(0, 1.35, 0),
    (s.visible = !1),
    e.add(s),
    (e.userData.horn = s),
    e
  );
}
function R9(o = 'toro') {
  let e = mo(),
    t = new Group(),
    a = new Mesh(new CylinderGeometry(0.62, 0.66, 0.12, 6), e.stone);
  ((a.position.y = 0.06), (a.rotation.y = Math.PI / 6), (a.receiveShadow = !0), t.add(a));
  let n = e.rune.clone(),
    s = new Group(),
    i = (r, l, c, d = 0) => {
      let u = new Mesh(r, n);
      ((u.rotation.x = -Math.PI / 2), (u.rotation.z = d), u.position.set(l, 0.125, c), s.add(u));
    };
  if (o === 'toro')
    (i(new RingGeometry(0.16, 0.22, 16, 1, 0, Math.PI), 0, -0.02, Math.PI),
      i(new CircleGeometry(0.16, 16), 0, 0.12));
  else if (o === 'rio')
    for (let r = 0; r < 3; r++)
      i(
        new RingGeometry(0.08, 0.12, 12, 1, 0, Math.PI),
        -0.2 + r * 0.2,
        -0.05 + (r % 2) * 0.1,
        (r % 2) * Math.PI,
      );
  else
    (i(new RingGeometry(0.2, 0.26, 4), 0, 0, Math.PI / 4), i(new CircleGeometry(0.08, 4), 0, 0, Math.PI / 4));
  return (t.add(s), (t.userData.glow = n), t);
}
function C9() {
  let o = mo(),
    e = new Group(),
    t = new Mesh(new CylinderGeometry(1.5, 1.6, 0.25, 32), o.stoneDark);
  ((t.position.y = 0.12), (t.receiveShadow = !0), e.add(t));
  let a = o.sealGlow.clone(),
    n = new Mesh(new RingGeometry(1, 1.15, 40), a);
  ((n.rotation.x = -Math.PI / 2), (n.position.y = 0.255), e.add(n));
  for (let i = 0; i < 7; i++) {
    let r = new Mesh(new PlaneGeometry(0.05, 0.9 + Math.random() * 0.4), a);
    ((r.rotation.x = -Math.PI / 2),
      (r.rotation.z = (i / 7) * Math.PI * 2 + Math.random() * 0.3),
      (r.position.y = 0.256),
      r.translateY(0.5),
      e.add(r));
  }
  let s = new Mesh(new CylinderGeometry(0.45, 0.55, 0.35, 6), o.stone);
  return (
    (s.position.y = 0.3),
    (s.castShadow = !0),
    e.add(s),
    (e.userData.glow = a),
    (e.userData.boss = s),
    e
  );
}
function tk(o) {
  let e = mo(),
    t = new Group();
  if (o) {
    (t.add(ia(0.1, 1.9, 0.1, e.dark, -0.55, 0, 0)),
      t.add(ia(0.1, 1.9, 0.1, e.dark, 0.55, 0, 0)),
      t.add(ia(1.35, 0.85, 0.06, e.wood, 0, 0.85, 0)));
    let a = ia(1.5, 0.06, 0.4, e.dark, 0, 1.78, 0.02);
    ((a.rotation.x = -0.25), t.add(a));
    for (let n = 0; n < 4; n++) {
      let s = ia(
        0.26 + Math.random() * 0.08,
        0.32,
        0.01,
        e.paper,
        -0.45 + n * 0.3,
        1.05 + (n % 2) * 0.12,
        0.04,
      );
      ((s.rotation.z = (Math.random() - 0.5) * 0.15), t.add(s));
    }
  } else {
    t.add(ia(0.12, 1.7, 0.12, e.dark, 0, 0, 0));
    let a = ia(0.95, 0.26, 0.05, e.wood, 0.35, 1.32, 0.05);
    t.add(a);
    let n = ia(0.8, 0.22, 0.05, e.wood, -0.28, 1, 0.05);
    ((n.rotation.y = 0.3), t.add(n));
  }
  return t;
}
function P9() {
  let o = mo(),
    e = new Group();
  for (let a = 0; a < 9; a++) {
    let n = (a / 9) * Math.PI * 2,
      s = new Mesh(new DodecahedronGeometry(0.16, 0), o.stone);
    (s.position.set(Math.cos(n) * 0.55, 0.08, Math.sin(n) * 0.55),
      s.rotation.set(Math.random(), Math.random(), Math.random()),
      s.scale.set(1.2, 0.8, 1),
      (s.castShadow = !0),
      e.add(s));
  }
  for (let a = 0; a < 4; a++) {
    let n = new Mesh(new CylinderGeometry(0.06, 0.07, 0.8, 7).rotateZ(Math.PI / 2), o.dark);
    ((n.rotation.y = (a * Math.PI) / 4), (n.rotation.z = 0.25), (n.position.y = 0.12), e.add(n));
  }
  let t = new Mesh(new CircleGeometry(0.36, 12).rotateX(-Math.PI / 2), o.ember.clone());
  return ((t.position.y = 0.04), e.add(t), (e.userData.coals = t), e);
}
function ak() {
  let o = mo(),
    e = new Group(),
    t = new Mesh(new PlaneGeometry(1.2, 1.5).rotateX(-Math.PI / 2), o.hole);
  ((t.position.y = 0.02), e.add(t));
  for (let a = 0; a < 4; a++)
    e.add(ia(1.2, 0.08, 0.3, o.stone, 0, -0.05 - a * 0.18 + 0.02, -0.55 + a * 0.32));
  return (
    e.add(ia(0.16, 0.2, 1.7, o.stoneDark, -0.7, -0.05, 0)),
    e.add(ia(0.16, 0.2, 1.7, o.stoneDark, 0.7, -0.05, 0)),
    e
  );
}
function z9(o) {
  let e = mo(),
    t = new Group();
  if (o === 'pit') {
    let a = new Mesh(new CircleGeometry(0.6, 10).rotateX(-Math.PI / 2), e.dark);
    ((a.position.y = 0.02), t.add(a), (t.userData.cover = a));
    for (let n = 0; n < 5; n++) {
      let s = new Mesh(new ConeGeometry(0.04, 0.4, 5), e.wood);
      (s.position.set((Math.random() - 0.5) * 0.6, -0.1, (Math.random() - 0.5) * 0.6),
        (s.visible = !1),
        t.add(s),
        (t.userData.spikes ??= []).push(s));
    }
  } else if (o === 'plate') {
    let a = ia(0.9, 0.04, 0.9, e.stoneDark, 0, -0.01, 0);
    (t.add(a), (t.userData.plate = a));
    for (let n = 0; n < 9; n++) {
      let s = new Mesh(new ConeGeometry(0.035, 0.45, 5), e.iron);
      (s.position.set(-0.3 + (n % 3) * 0.3, -0.2, -0.3 + Math.floor(n / 3) * 0.3),
        (s.visible = !1),
        t.add(s),
        (t.userData.spikes ??= []).push(s));
    }
  } else if (o === 'wire') {
    let a = ia(1.3, 0.012, 0.012, e.dark, 0, 0.12, 0);
    t.add(a);
    for (let s of [-0.65, 0.65]) t.add(ia(0.04, 0.2, 0.04, e.wood, s, 0, 0));
    let n = new Mesh(new CylinderGeometry(0.05, 0.05, 0.1, 8), e.iron);
    (n.position.set(0.7, 0.2, 0.05), t.add(n));
  } else {
    let a = new Mesh(new TorusGeometry(0.22, 0.025, 6, 16).rotateX(Math.PI / 2), e.iron);
    ((a.position.y = 0.03), t.add(a));
    for (let n = 0; n < 8; n++) {
      let s = new Mesh(new ConeGeometry(0.025, 0.1, 4), e.iron),
        i = (n / 8) * Math.PI * 2;
      (s.position.set(Math.cos(i) * 0.2, 0.08, Math.sin(i) * 0.2), t.add(s));
    }
  }
  return t;
}
function L9() {
  let o = mo(),
    e = new Group();
  e.add(ia(0.4, 0.3, 0.3, o.stoneDark));
  let t = new Group();
  t.position.y = 0.3;
  let a = ia(0.05, 0.7, 0.05, o.iron);
  t.add(a);
  let n = new Mesh(new SphereGeometry(0.06, 8, 6), o.dark);
  return ((n.position.y = 0.7), t.add(n), (t.rotation.x = -0.6), e.add(t), (e.userData.arm = t), e);
}
function D9(o = 'stone') {
  let e = mo(),
    t = new Group(),
    a = new Group();
  (a.add(ia(0.35, 2.6, 0.5, e.stoneDark, -0.95, 0, 0)),
    a.add(ia(0.35, 2.6, 0.5, e.stoneDark, 0.95, 0, 0)),
    a.add(ia(2.3, 0.4, 0.55, e.stoneDark, 0, 2.5, 0)),
    t.add(a));
  let n = new Group(),
    s = ia(1.6, 2.5, 0.22, o === 'stone' ? e.stone : e.iron, 0, 0, 0);
  n.add(s);
  let i = e.rune.clone(),
    r = new Mesh(new RingGeometry(0.22, 0.3, 6), i);
  return (r.position.set(0, 1.45, 0.12), n.add(r), t.add(n), (t.userData.slab = n), (t.userData.glow = i), t);
}
function I9(o) {
  let e = new Set();
  for (let t of ['lid', 'arm', 'slab', 'turn', 'horn', 'boss', 'coals', 'cover'])
    o.userData[t] && e.add(o.userData[t]);
  for (let t of o.userData.spikes || []) e.add(t);
  nk(o, e, 'objeto');
  for (let t of e) t.isMesh || nk(t, new Set([...e].filter((a) => a !== t)), 'pieza');
}
function nk(o, e, t) {
  o.updateMatrixWorld(!0);
  let a = new Matrix4().copy(o.matrixWorld).invert(),
    n = new MeshMerger({ contactH: 0.5, contactMin: 0.6, metal: !1 }),
    s = [];
  if (
    (o.traverse((i) => {
      if (!(i === o || !i.isMesh || !isFlatMaterial(i.material))) {
        for (let r = i; r && r !== o; r = r.parent) if (e.has(r)) return;
        s.push(i);
      }
    }),
    !(s.length < 2))
  ) {
    for (let i of s)
      (n.addGeometry(i.geometry, i.material, new Matrix4().multiplyMatrices(a, i.matrixWorld)),
        i.parent.remove(i));
    o.add(n.build(t));
  }
}
function ok(o) {
  let { scene: e, level: t, ground: a } = o,
    n = new Map(),
    s = [],
    i = new Vector3(),
    r = new Map();
  for (let v of o.buildings || []) v.doorObj && r.set(v.doorObj.id, v);
  let l = [];
  function c(v) {
    if (!v.cell || n.has(v.id)) return null;
    cellToWorld(v.cell[0], v.cell[1], i);
    let x = new Group();
    ((x.name = `obj:${v.id}`),
      x.position.set(i.x, a.heightAt(i.x, i.z), i.z),
      (x.rotation.y = degToRad(v.rot ?? v.face ?? 0)),
      (x.userData = { id: v.id, type: v.type, def: v, state: null }));
    let g = null;
    switch (v.type) {
      case 'door': {
        let y = r.get(v.id);
        y
          ? ((x.userData.building = y), (x.userData.leaf = y.doorLeaf))
          : ((g = D9(v.style || 'stone')),
            (x.userData.slab = g.userData.slab),
            (x.userData.glow = g.userData.glow));
        break;
      }
      case 'chest':
        ((g = /sarc/i.test(v.id + (v.name || '')) ? E9() : T9(v.big ? 1.25 : 1)),
          (x.userData.lid = g.userData.lid),
          (x.userData.slide = g.userData.slide),
          (g.rotation.y = (((v.id.length * 37) % 50) - 25) * 0.01));
        break;
      case 'cache': {
        if (((g = new Group()), hasPiece('sack'))) {
          let y = pieceMesh('sack');
          (y.scale.setScalar(0.8), g.add(y));
        }
        if (hasPiece('Pebble_Round_4'))
          for (let y = 0; y < 3; y++) {
            let w = pieceMesh('Pebble_Round_4');
            (w.position.set(0.25 + y * 0.1, 0, -0.15 + y * 0.12), w.scale.setScalar(1.5), g.add(w));
          }
        break;
      }
      case 'loot': {
        if (
          ((g = new Group()),
          hasPiece('q_bag') && g.add(pieceMesh('q_bag')),
          hasPiece('skull') && /peregrin|restos/i.test(v.name || ''))
        ) {
          let y = pieceMesh('skull');
          (y.position.set(0.35, 0, 0.1), g.add(y));
        }
        break;
      }
      case 'sign':
        g = tk(!1);
        break;
      case 'board':
        g = tk(!0);
        break;
      case 'campfire': {
        ((g = P9()), (x.userData.coals = g.userData.coals));
        let y = x.position.clone().add(new Vector3(0, 0.15, 0));
        (l.push({ pos: y, scale: 1.3, id: v.id }),
          o.fx?.addLamp({
            pos: y.clone().add(new Vector3(0, 0.6, 0)),
            color: 16744496,
            range: 7,
            energy: 1.6,
            kind: 'fire',
            id: v.id,
            haloSize: 2.4,
            haloAlpha: 0.6,
          }));
        break;
      }
      case 'stairs':
        /up|subir|arriba/i.test(v.id) || (v.to || '').includes(':merrowick')
          ? ((g = hasPiece('stairs') ? pieceMesh('stairs') : ak()),
            hasPiece('stairs') && g.scale.setScalar(0.6))
          : (g = ak());
        break;
      case 'trap': {
        let y = /pit|foso/.test(v.id + v.name)
          ? 'pit'
          : /wire|cuerda/.test(v.id + v.name)
            ? 'wire'
            : /trap_\d/.test(v.id) || t.ambient === 'crypt'
              ? 'plate'
              : 'snare';
        ((g = z9(y)), (x.userData.spikes = g.userData.spikes), (x.userData.trapKind = y));
        break;
      }
      case 'rune':
        (/seal_/.test(v.id)
          ? (g = R9(v.symbol || ['toro', 'rio', 'piedra'][Number(v.id.slice(-1)) - 1] || 'toro'))
          : ((g = S9(!1)), (x.userData.setGlyph = g.userData.setGlyph), (x.userData.turn = g.userData.turn)),
          (x.userData.glow = g.userData.glow));
        break;
      case 'seal':
        ((g = C9()),
          (x.userData.glow = g.userData.glow),
          (x.userData.boss = g.userData.boss),
          o.fx?.addLamp({
            pos: x.position.clone().add(new Vector3(0, 0.8, 0)),
            color: 16723992,
            range: 7,
            energy: 1.6,
            kind: 'fire',
            id: v.id,
            haloSize: 3.2,
            haloAlpha: 0.35,
          }));
        break;
      case 'lever':
        ((g = L9()), (x.userData.arm = g.userData.arm));
        break;
      case 'inspect':
        v.stele
          ? ((g = k9()), (x.userData.glow = g.userData.glow))
          : v.socket && ((g = A9()), (x.userData.horn = g.userData.horn));
        break;
      default:
        break;
    }
    if (g) {
      I9(g);
      let y = new Box3().setFromObject(g),
        w = y.isEmpty() || y.max.y - y.min.y < 1.1;
      (g.traverse((k) => {
        k.isMesh &&
          ((k.castShadow = !w && (k.castShadow || k.geometry.boundingSphere?.radius > 0.2)),
          (k.receiveShadow = !0));
      }),
        w && !y.isEmpty() && v.type !== 'trap' && a.blob(Le.ao, x.position.x, x.position.z, 0.75, 0.5),
        x.add(g),
        (x.userData.vis = g));
    }
    return (
      e.add(x),
      n.set(v.id, x),
      v.hidden || v.hidden_until || v.type === 'trap'
        ? d(x, 'hidden', !0)
        : v.type === 'campfire'
          ? d(x, v.requires ? 'out' : 'lit', !0)
          : v.type === 'seal'
            ? d(x, 'active', !0)
            : d(x, v.type === 'door' || v.type === 'chest' ? 'closed' : 'idle', !0),
      x
    );
  }
  for (let v of t.objects || []) c(v);
  function d(v, x, g = !1) {
    let y = v.userData,
      w = y.state;
    y.state = x;
    let k = (T, E, S, z) => s.push({ t: g ? S : 0, dur: S, from: T, to: E, fn: z });
    if (
      (x === 'sprung' && (x = 'triggered'),
      x === 'empty' && (x = 'open'),
      x !== 'hidden' && (v.visible = !0),
      M9.includes(x) && y.setGlyph)
    )
      return (
        y.setGlyph(x),
        y.turn && k(y.turn.rotation.y, y.turn.rotation.y + Math.PI * 2, 0.9, (T) => (y.turn.rotation.y = T)),
        y.glow && k(y.glow.emissiveIntensity, 1.6, 0.6, (T) => (y.glow.emissiveIntensity = T)),
        (y.glyph = x),
        w
      );
    if ((x === 'pressed' || x === 'up') && y.vis && /seal_/.test(y.id))
      return (
        k(y.vis.position.y, x === 'pressed' ? -0.09 : 0, 0.35, (T) => (y.vis.position.y = T)),
        y.glow &&
          k(y.glow.emissiveIntensity, x === 'pressed' ? 2 : 0.3, 0.4, (T) => (y.glow.emissiveIntensity = T)),
        w
      );
    if (y.horn && (x === 'solved' || x === 'placed'))
      return ((y.horn.visible = !0), k(1.9, 1.35, 0.8, (T) => (y.horn.position.y = T)), w);
    switch (x) {
      case 'hidden':
        v.visible = !1;
        break;
      case 'revealed':
      case 'idle':
        v.visible = !0;
        break;
      case 'open':
        (y.vis && (y.vis.visible = !0),
          y.leaf && k(y.leaf.rotation.y, -1.75, 0.8, (T) => (y.leaf.rotation.y = T)),
          y.lid && y.slide
            ? (k(y.lid.position.x, 0.75, 1.2, (T) => (y.lid.position.x = T)),
              k(y.lid.rotation.z, -0.12, 1.2, (T) => (y.lid.rotation.z = T)))
            : y.lid && k(y.lid.rotation.x, -1.9, 0.6, (T) => (y.lid.rotation.x = T)),
          y.slab && k(y.slab.position.y, -2.45, 2.2, (T) => (y.slab.position.y = T)));
        break;
      case 'closed':
        (y.vis && (y.vis.visible = !0),
          y.leaf && k(y.leaf.rotation.y, 0, 0.6, (T) => (y.leaf.rotation.y = T)),
          y.lid && y.slide
            ? (k(y.lid.position.x, 0, 1, (T) => (y.lid.position.x = T)),
              k(y.lid.rotation.z, 0, 1, (T) => (y.lid.rotation.z = T)))
            : y.lid && k(y.lid.rotation.x, 0, 0.5, (T) => (y.lid.rotation.x = T)),
          y.slab && k(y.slab.position.y, 0, 1.2, (T) => (y.slab.position.y = T)));
        break;
      case 'lit':
      case 'on':
      case 'active':
      case 'solved':
        (y.vis && (y.vis.visible = !0),
          y.glow &&
            k(
              y.glow.emissiveIntensity,
              x === 'active' ? 1.2 : 2.4,
              0.8,
              (T) => (y.glow.emissiveIntensity = T),
            ),
          y.coals && (y.coals.material.emissiveIntensity = 1.5),
          y.arm && k(y.arm.rotation.x, 0.6, 0.4, (T) => (y.arm.rotation.x = T)),
          y.type === 'campfire' && o.onFire?.(y.id, !0));
        break;
      case 'out':
      case 'off':
        (y.glow && k(y.glow.emissiveIntensity, 0, 0.6, (T) => (y.glow.emissiveIntensity = T)),
          y.coals && (y.coals.material.emissiveIntensity = 0.05),
          y.arm && k(y.arm.rotation.x, -0.6, 0.4, (T) => (y.arm.rotation.x = T)),
          y.type === 'campfire' && o.onFire?.(y.id, !1));
        break;
      case 'disarmed':
        if ((y.vis && (y.vis.visible = !0), y.spikes)) for (let T of y.spikes) T.visible = !1;
        y.vis && y.vis.traverse((T) => T.isMesh && (T.rotation.z = 0.4));
        break;
      case 'triggered':
        if ((y.vis && (y.vis.visible = !0), y.spikes))
          for (let T of y.spikes) ((T.visible = !0), k(-0.2, 0.18, 0.12, (E) => (T.position.y = E)));
        y.trapKind === 'pit' && y.vis.userData.cover && (y.vis.userData.cover.visible = !1);
        break;
      case 'broken':
        (y.glow && k(y.glow.emissiveIntensity, 0, 2, (T) => (y.glow.emissiveIntensity = T)),
          y.boss &&
            (k(y.boss.position.y, 0.12, 1.5, (T) => (y.boss.position.y = T)),
            y.boss.rotation.set(0.3, 0.4, 0.2)),
          o.onSeal?.(y.id, 'broken'));
        break;
      case 'restored':
        (y.glow &&
          (y.glow.emissive?.set(6340863),
          k(y.glow.emissiveIntensity, 2.2, 1.5, (T) => (y.glow.emissiveIntensity = T))),
          o.onSeal?.(y.id, 'restored'));
        break;
      default:
        y.vis && (y.vis.visible = !0);
    }
    return w;
  }
  let u = 0;
  function h(v) {
    u += v;
    for (let x = s.length - 1; x >= 0; x--) {
      let g = s[x];
      g.t = Math.min(g.dur, g.t + v);
      let y = g.t / g.dur,
        w = y < 0.5 ? 2 * y * y : 1 - Math.pow(-2 * y + 2, 2) / 2;
      (g.fn(g.from + (g.to - g.from) * w), g.t >= g.dur && s.splice(x, 1));
    }
    for (let [, x] of n) {
      let g = x.userData;
      if (g.glow && (g.state === 'active' || g.state === 'lit' || g.state === 'solved') && !s.length) {
        let y = g.state === 'active' ? 1 : 2.2;
        g.glow.emissiveIntensity = y * (0.8 + 0.2 * Math.sin(u * (g.type === 'seal' ? 1.4 : 2.2)));
      }
    }
  }
  let p = new Map(),
    m = new RingGeometry(0.35, 0.95, 40).rotateX(-Math.PI / 2);
  function _(v, x) {
    let g = n.get(v);
    if (!g) return;
    let y = p.get(v);
    if (x == null || x === !1) {
      y && (g.remove(y), y.material.dispose(), p.delete(v));
      return;
    }
    if (!y) {
      let w = new ShaderMaterial({
        transparent: !0,
        depthWrite: !1,
        blending: AdditiveBlending,
        uniforms: { uColor: { value: new Color() }, uTime: { value: 0 } },
        vertexShader:
          'varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform vec3 uColor; uniform float uTime; varying vec2 vP;
          void main(){ float d = length(vP); float a = smoothstep(0.35, 0.6, d) * smoothstep(0.95, 0.62, d);
            a *= 0.55 + 0.45 * sin(uTime * 3.5); gl_FragColor = vec4(uColor * a * 1.6, a); }`,
      });
      ((y = new Mesh(m, w)),
        (y.position.y = 0.05),
        (y.renderOrder = 6),
        (y.name = 'resalte'),
        g.add(y),
        p.set(v, y));
    }
    y.material.uniforms.uColor.value.set(x === !0 ? 16767088 : x);
  }
  let b = h;
  function f(v) {
    b(v);
    for (let [, x] of p) x.material.uniforms.uTime.value = u;
  }
  return {
    anchors: n,
    flames: l,
    create: c,
    set: (v, x) => (n.has(v) ? d(n.get(v), x) : void 0),
    update: f,
    setGlow: _,
  };
}
let a0 = null;
const ia = (o, e, t, a, n = 0, s = 0, i = 0) => {
  let r = new Mesh(new BoxGeometry(o, e, t), a);
  return (r.position.set(n, s + e / 2, i), (r.castShadow = !0), (r.receiveShadow = !0), r);
};
const M9 = ['agua', 'monte', 'cuernos', 'ojo', 'llama'];

export { ok };
