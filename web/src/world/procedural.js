// world/procedural.js — objetos interactivos del nivel (`level.objects`) hechos con geometría sencilla:
// puertas de cripta, cofres y sarcófagos, alijos, botín, carteles y tablones, hogueras, escaleras,
// trampas (foso, placa, cuerda, cepo), piedras rúnicas con glifos, sellos, palancas, estelas y el
// zócalo del cuerno. `buildObjects` los crea, gestiona su estado (abrir, encender, disparar, romper…)
// con interpolaciones y los resalta con un anillo.
// Reconstruido de publicado/juego.js (módulo __esm «sk»). Lo usa index.js (`world.objects`, `setObjectState`).

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
import { LAYER } from './ground.js';

/** Materiales compartidos de los objetos (madera, hierro, piedra, runas, brasas…). */
function objectMats() {
  return (
    objectMatsCache ||
    ((objectMatsCache = {
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
    objectMatsCache)
  );
}
/** Cofre con tapa abatible (`userData.lid`). */
function makeChest(scale = 1) {
  let mats = objectMats(),
    group = new Group(),
    body = box(0.9, 0.48, 0.58, mats.wood);
  group.add(body);
  for (let x of [-0.36, 0.36]) group.add(box(0.07, 0.5, 0.6, mats.iron, x, 0, 0));
  let lid = new Group();
  lid.position.set(0, 0.48, -0.29);
  let lidMesh = new Mesh(
    new CylinderGeometry(0.29, 0.29, 0.9, 12, 1, !1, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI / 2),
    mats.wood,
  );
  (lidMesh.position.set(0, 0, 0.29),
    lidMesh.scale.set(1, 0.7, 1),
    (lidMesh.castShadow = !0),
    lid.add(lidMesh));
  for (let x of [-0.36, 0.36]) {
    let band = new Mesh(
      new CylinderGeometry(0.3, 0.3, 0.07, 12, 1, !1, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI / 2),
      mats.iron,
    );
    (band.position.set(x, 0, 0.29), band.scale.set(1, 0.7, 1), lid.add(band));
  }
  return (
    group.add(lid),
    group.add(box(0.12, 0.14, 0.04, mats.brass, 0, 0.32, 0.3)),
    group.scale.setScalar(scale),
    (group.userData.lid = lid),
    group
  );
}
/** Dibuja en un lienzo el glifo dado (agua, monte, cuernos, ojo, llama u otro por defecto). */
function drawGlyph(g2d, glyph, size) {
  (g2d.clearRect(0, 0, size, size),
    (g2d.strokeStyle = '#fff'),
    (g2d.lineWidth = size * 0.07),
    (g2d.lineCap = 'round'),
    (g2d.lineJoin = 'round'));
  let mid = size / 2;
  switch ((g2d.beginPath(), glyph)) {
    case 'agua':
      for (let k = 0; k < 3; k++) {
        let y = mid - size * 0.18 + k * size * 0.18;
        (g2d.moveTo(size * 0.2, y),
          g2d.bezierCurveTo(size * 0.35, y - size * 0.12, size * 0.45, y + size * 0.12, mid, y),
          g2d.bezierCurveTo(size * 0.55, y - size * 0.12, size * 0.65, y + size * 0.12, size * 0.8, y));
      }
      break;
    case 'monte':
      (g2d.moveTo(size * 0.15, size * 0.75),
        g2d.lineTo(size * 0.4, size * 0.3),
        g2d.lineTo(size * 0.55, size * 0.55),
        g2d.lineTo(size * 0.68, size * 0.38),
        g2d.lineTo(size * 0.85, size * 0.75),
        g2d.closePath());
      break;
    case 'cuernos':
      (g2d.moveTo(size * 0.2, size * 0.25),
        g2d.quadraticCurveTo(size * 0.25, size * 0.6, mid, size * 0.62),
        g2d.quadraticCurveTo(size * 0.75, size * 0.6, size * 0.8, size * 0.25),
        g2d.moveTo(mid, size * 0.62),
        g2d.lineTo(mid, size * 0.85));
      break;
    case 'ojo':
      (g2d.moveTo(size * 0.15, mid),
        g2d.quadraticCurveTo(mid, size * 0.2, size * 0.85, mid),
        g2d.quadraticCurveTo(mid, size * 0.8, size * 0.15, mid),
        g2d.moveTo(mid + size * 0.09, mid),
        g2d.arc(mid, mid, size * 0.09, 0, Math.PI * 2));
      break;
    case 'llama':
      (g2d.moveTo(mid, size * 0.15),
        g2d.bezierCurveTo(size * 0.75, size * 0.45, size * 0.7, size * 0.8, mid, size * 0.85),
        g2d.bezierCurveTo(size * 0.3, size * 0.8, size * 0.25, size * 0.5, size * 0.45, size * 0.4),
        g2d.bezierCurveTo(size * 0.45, size * 0.55, size * 0.55, size * 0.6, mid, size * 0.15));
      break;
    default:
      (g2d.moveTo(mid, size * 0.15),
        g2d.lineTo(mid, size * 0.85),
        g2d.moveTo(mid, size * 0.35),
        g2d.lineTo(size * 0.72, size * 0.2),
        g2d.moveTo(mid, size * 0.55),
        g2d.lineTo(size * 0.28, size * 0.4));
  }
  g2d.stroke();
}
/** Sarcófago con losa deslizante (`userData.lid`, `slide`). */
function makeSarcophagus() {
  let mats = objectMats(),
    group = new Group();
  (group.add(box(2.1, 0.85, 0.95, mats.stone, 0, 0, 0)),
    group.add(box(2.25, 0.12, 1.08, mats.stoneDark, 0, 0, 0)));
  let lid = new Group(),
    slab = box(2.2, 0.16, 1.02, mats.stone, 0, 0, 0);
  lid.add(slab);
  let panel = box(1.3, 0.1, 0.36, mats.stoneDark, 0, 0.16, 0);
  lid.add(panel);
  let knob = new Mesh(new SphereGeometry(0.17, 10, 8), mats.stoneDark);
  return (
    knob.position.set(-0.8, 0.24, 0),
    knob.scale.set(1, 0.6, 1),
    lid.add(knob),
    (lid.position.y = 0.85),
    group.add(lid),
    (group.userData.lid = lid),
    (group.userData.slide = !0),
    group
  );
}
/** Piedra rúnica giratoria con glifo luminoso; `userData.setGlyph(glifo)` lo cambia. */
function makeRuneStone(blue = !1) {
  let mats = objectMats(),
    group = new Group(),
    geo = new CylinderGeometry(0.32, 0.42, 1.5, 6, 3),
    pos = geo.getAttribute('position');
  for (let k = 0; k < pos.count; k++) {
    let y = pos.getY(k);
    (pos.setX(k, pos.getX(k) * (1 + Math.sin(k * 1.7) * 0.06)),
      pos.setZ(k, pos.getZ(k) * 0.62 * (1 + Math.cos(k * 2.3) * 0.06)),
      y > 0.6 && pos.setX(k, pos.getX(k) * 0.8));
  }
  geo.computeVertexNormals();
  let turn = new Group(),
    stone = new Mesh(geo, mats.stone);
  ((stone.position.y = 0.72), (stone.castShadow = !0), (stone.receiveShadow = !0), turn.add(stone));
  let size = 128,
    canvas = document.createElement('canvas');
  ((canvas.width = canvas.height = size), drawGlyph(canvas.getContext('2d'), null, size));
  let tex = new CanvasTexture(canvas),
    glowMat = new MeshStandardMaterial({
      color: 1709072,
      emissive: blue ? 7387391 : 16752704,
      emissiveMap: tex,
      alphaMap: tex,
      transparent: !0,
      emissiveIntensity: 0.35,
      roughness: 0.8,
      depthWrite: !1,
    }),
    face = new Mesh(new PlaneGeometry(0.42, 0.42), glowMat);
  return (
    face.position.set(0, 0.95, 0.265),
    (face.rotation.x = -0.05),
    turn.add(face),
    group.add(turn),
    (group.userData.glow = glowMat),
    (group.userData.turn = turn),
    (group.userData.setGlyph = (glyph) => {
      (drawGlyph(canvas.getContext('2d'), glyph, size), (tex.needsUpdate = !0));
    }),
    group
  );
}
/** Estela con líneas de runas brillantes. */
function makeStele() {
  let mats = objectMats(),
    group = new Group(),
    slab = box(1.1, 1.7, 0.3, mats.stone, 0, 0, 0);
  (group.add(slab), group.add(box(1.3, 0.2, 0.42, mats.stoneDark, 0, 0, 0)));
  let glowMat = mats.rune.clone();
  glowMat.emissiveIntensity = 0.6;
  for (let k = 0; k < 4; k++) {
    let line = new Mesh(new PlaneGeometry(0.7 - (k % 2) * 0.15, 0.05), glowMat);
    (line.position.set(0, 1.3 - k * 0.2, 0.152), group.add(line));
  }
  return ((group.userData.glow = glowMat), group);
}
/** Pedestal con hueco y el cuerno oculto (`userData.horn`). */
function makeHornSocket() {
  let mats = objectMats(),
    group = new Group(),
    pedestal = new Mesh(new CylinderGeometry(0.42, 0.5, 0.95, 8), mats.stone);
  ((pedestal.position.y = 0.47), (pedestal.castShadow = !0), group.add(pedestal));
  let cap = new Mesh(new CylinderGeometry(0.5, 0.42, 0.12, 8), mats.stoneDark);
  ((cap.position.y = 1), group.add(cap));
  let hole = new Mesh(new CircleGeometry(0.16, 12).rotateX(-Math.PI / 2), mats.hole);
  ((hole.position.y = 1.065), group.add(hole));
  let horn = new Mesh(new ConeGeometry(0.1, 0.65, 10, 4, !1), mats.stone),
    pos = horn.geometry.getAttribute('position');
  for (let k = 0; k < pos.count; k++) {
    let y = pos.getY(k) + 0.325;
    pos.setX(k, pos.getX(k) + y * y * 0.35);
  }
  return (
    horn.geometry.computeVertexNormals(),
    horn.position.set(0, 1.35, 0),
    (horn.visible = !1),
    group.add(horn),
    (group.userData.horn = horn),
    group
  );
}
/** Losa de sello con el símbolo «toro», «rio» o «piedra» en runas. */
function makeSealPlate(symbol = 'toro') {
  let mats = objectMats(),
    group = new Group(),
    base = new Mesh(new CylinderGeometry(0.62, 0.66, 0.12, 6), mats.stone);
  ((base.position.y = 0.06), (base.rotation.y = Math.PI / 6), (base.receiveShadow = !0), group.add(base));
  let glowMat = mats.rune.clone(),
    marks = new Group(),
    addMark = (geo, x, z, rot = 0) => {
      let mesh = new Mesh(geo, glowMat);
      ((mesh.rotation.x = -Math.PI / 2),
        (mesh.rotation.z = rot),
        mesh.position.set(x, 0.125, z),
        marks.add(mesh));
    };
  if (symbol === 'toro')
    (addMark(new RingGeometry(0.16, 0.22, 16, 1, 0, Math.PI), 0, -0.02, Math.PI),
      addMark(new CircleGeometry(0.16, 16), 0, 0.12));
  else if (symbol === 'rio')
    for (let k = 0; k < 3; k++)
      addMark(
        new RingGeometry(0.08, 0.12, 12, 1, 0, Math.PI),
        -0.2 + k * 0.2,
        -0.05 + (k % 2) * 0.1,
        (k % 2) * Math.PI,
      );
  else
    (addMark(new RingGeometry(0.2, 0.26, 4), 0, 0, Math.PI / 4),
      addMark(new CircleGeometry(0.08, 4), 0, 0, Math.PI / 4));
  return (group.add(marks), (group.userData.glow = glowMat), group);
}
/** Gran sello rojo con grietas y el bloque central (`userData.boss`). */
function makeSeal() {
  let mats = objectMats(),
    group = new Group(),
    disc = new Mesh(new CylinderGeometry(1.5, 1.6, 0.25, 32), mats.stoneDark);
  ((disc.position.y = 0.12), (disc.receiveShadow = !0), group.add(disc));
  let glowMat = mats.sealGlow.clone(),
    ring = new Mesh(new RingGeometry(1, 1.15, 40), glowMat);
  ((ring.rotation.x = -Math.PI / 2), (ring.position.y = 0.255), group.add(ring));
  for (let k = 0; k < 7; k++) {
    let crack = new Mesh(new PlaneGeometry(0.05, 0.9 + Math.random() * 0.4), glowMat);
    ((crack.rotation.x = -Math.PI / 2),
      (crack.rotation.z = (k / 7) * Math.PI * 2 + Math.random() * 0.3),
      (crack.position.y = 0.256),
      crack.translateY(0.5),
      group.add(crack));
  }
  let boss = new Mesh(new CylinderGeometry(0.45, 0.55, 0.35, 6), mats.stone);
  return (
    (boss.position.y = 0.3),
    (boss.castShadow = !0),
    group.add(boss),
    (group.userData.glow = glowMat),
    (group.userData.boss = boss),
    group
  );
}
/** Poste con carteles, o tablón de anuncios si `board`. */
function makeSign(board) {
  let mats = objectMats(),
    group = new Group();
  if (board) {
    (group.add(box(0.1, 1.9, 0.1, mats.dark, -0.55, 0, 0)),
      group.add(box(0.1, 1.9, 0.1, mats.dark, 0.55, 0, 0)),
      group.add(box(1.35, 0.85, 0.06, mats.wood, 0, 0.85, 0)));
    let roof = box(1.5, 0.06, 0.4, mats.dark, 0, 1.78, 0.02);
    ((roof.rotation.x = -0.25), group.add(roof));
    for (let k = 0; k < 4; k++) {
      let paper = box(
        0.26 + Math.random() * 0.08,
        0.32,
        0.01,
        mats.paper,
        -0.45 + k * 0.3,
        1.05 + (k % 2) * 0.12,
        0.04,
      );
      ((paper.rotation.z = (Math.random() - 0.5) * 0.15), group.add(paper));
    }
  } else {
    group.add(box(0.12, 1.7, 0.12, mats.dark, 0, 0, 0));
    let plankA = box(0.95, 0.26, 0.05, mats.wood, 0.35, 1.32, 0.05);
    group.add(plankA);
    let plankB = box(0.8, 0.22, 0.05, mats.wood, -0.28, 1, 0.05);
    ((plankB.rotation.y = 0.3), group.add(plankB));
  }
  return group;
}
/** Hoguera de piedras y leños con brasas (`userData.coals`). */
function makeCampfire() {
  let mats = objectMats(),
    group = new Group();
  for (let k = 0; k < 9; k++) {
    let angle = (k / 9) * Math.PI * 2,
      stone = new Mesh(new DodecahedronGeometry(0.16, 0), mats.stone);
    (stone.position.set(Math.cos(angle) * 0.55, 0.08, Math.sin(angle) * 0.55),
      stone.rotation.set(Math.random(), Math.random(), Math.random()),
      stone.scale.set(1.2, 0.8, 1),
      (stone.castShadow = !0),
      group.add(stone));
  }
  for (let k = 0; k < 4; k++) {
    let log = new Mesh(new CylinderGeometry(0.06, 0.07, 0.8, 7).rotateZ(Math.PI / 2), mats.dark);
    ((log.rotation.y = (k * Math.PI) / 4), (log.rotation.z = 0.25), (log.position.y = 0.12), group.add(log));
  }
  let coals = new Mesh(new CircleGeometry(0.36, 12).rotateX(-Math.PI / 2), mats.ember.clone());
  return ((coals.position.y = 0.04), group.add(coals), (group.userData.coals = coals), group);
}
/** Hueco con peldaños que bajan. */
function makeStairsDown() {
  let mats = objectMats(),
    group = new Group(),
    hole = new Mesh(new PlaneGeometry(1.2, 1.5).rotateX(-Math.PI / 2), mats.hole);
  ((hole.position.y = 0.02), group.add(hole));
  for (let k = 0; k < 4; k++)
    group.add(box(1.2, 0.08, 0.3, mats.stone, 0, -0.05 - k * 0.18 + 0.02, -0.55 + k * 0.32));
  return (
    group.add(box(0.16, 0.2, 1.7, mats.stoneDark, -0.7, -0.05, 0)),
    group.add(box(0.16, 0.2, 1.7, mats.stoneDark, 0.7, -0.05, 0)),
    group
  );
}
/** Trampa del tipo `kind`: pit, plate, wire o cepo; pinchos en `userData.spikes`. */
function makeTrap(kind) {
  let mats = objectMats(),
    group = new Group();
  if (kind === 'pit') {
    let cover = new Mesh(new CircleGeometry(0.6, 10).rotateX(-Math.PI / 2), mats.dark);
    ((cover.position.y = 0.02), group.add(cover), (group.userData.cover = cover));
    for (let k = 0; k < 5; k++) {
      let spike = new Mesh(new ConeGeometry(0.04, 0.4, 5), mats.wood);
      (spike.position.set((Math.random() - 0.5) * 0.6, -0.1, (Math.random() - 0.5) * 0.6),
        (spike.visible = !1),
        group.add(spike),
        (group.userData.spikes ??= []).push(spike));
    }
  } else if (kind === 'plate') {
    let plate = box(0.9, 0.04, 0.9, mats.stoneDark, 0, -0.01, 0);
    (group.add(plate), (group.userData.plate = plate));
    for (let k = 0; k < 9; k++) {
      let spike = new Mesh(new ConeGeometry(0.035, 0.45, 5), mats.iron);
      (spike.position.set(-0.3 + (k % 3) * 0.3, -0.2, -0.3 + Math.floor(k / 3) * 0.3),
        (spike.visible = !1),
        group.add(spike),
        (group.userData.spikes ??= []).push(spike));
    }
  } else if (kind === 'wire') {
    let wire = box(1.3, 0.012, 0.012, mats.dark, 0, 0.12, 0);
    group.add(wire);
    for (let x of [-0.65, 0.65]) group.add(box(0.04, 0.2, 0.04, mats.wood, x, 0, 0));
    let bell = new Mesh(new CylinderGeometry(0.05, 0.05, 0.1, 8), mats.iron);
    (bell.position.set(0.7, 0.2, 0.05), group.add(bell));
  } else {
    let ring = new Mesh(new TorusGeometry(0.22, 0.025, 6, 16).rotateX(Math.PI / 2), mats.iron);
    ((ring.position.y = 0.03), group.add(ring));
    for (let k = 0; k < 8; k++) {
      let tooth = new Mesh(new ConeGeometry(0.025, 0.1, 4), mats.iron),
        angle = (k / 8) * Math.PI * 2;
      (tooth.position.set(Math.cos(angle) * 0.2, 0.08, Math.sin(angle) * 0.2), group.add(tooth));
    }
  }
  return group;
}
/** Palanca con brazo móvil (`userData.arm`). */
function makeLever() {
  let mats = objectMats(),
    group = new Group();
  group.add(box(0.4, 0.3, 0.3, mats.stoneDark));
  let arm = new Group();
  arm.position.y = 0.3;
  let rod = box(0.05, 0.7, 0.05, mats.iron);
  arm.add(rod);
  let knob = new Mesh(new SphereGeometry(0.06, 8, 6), mats.dark);
  return (
    (knob.position.y = 0.7),
    arm.add(knob),
    (arm.rotation.x = -0.6),
    group.add(arm),
    (group.userData.arm = arm),
    group
  );
}
/** Puerta de cripta: marco y losa que baja (`userData.slab`) con una runa. */
function makeVaultDoor(style = 'stone') {
  let mats = objectMats(),
    group = new Group(),
    frame = new Group();
  (frame.add(box(0.35, 2.6, 0.5, mats.stoneDark, -0.95, 0, 0)),
    frame.add(box(0.35, 2.6, 0.5, mats.stoneDark, 0.95, 0, 0)),
    frame.add(box(2.3, 0.4, 0.55, mats.stoneDark, 0, 2.5, 0)),
    group.add(frame));
  let slabGroup = new Group(),
    slab = box(1.6, 2.5, 0.22, style === 'stone' ? mats.stone : mats.iron, 0, 0, 0);
  slabGroup.add(slab);
  let glowMat = mats.rune.clone(),
    rune = new Mesh(new RingGeometry(0.22, 0.3, 6), glowMat);
  return (
    rune.position.set(0, 1.45, 0.12),
    slabGroup.add(rune),
    group.add(slabGroup),
    (group.userData.slab = slabGroup),
    (group.userData.glow = glowMat),
    group
  );
}
/** Funde las mallas lisas que no se mueven de un objeto (y de cada parte móvil). */
function mergeObjectStatic(root) {
  let moving = new Set();
  for (let key of ['lid', 'arm', 'slab', 'turn', 'horn', 'boss', 'coals', 'cover'])
    root.userData[key] && moving.add(root.userData[key]);
  for (let spike of root.userData.spikes || []) moving.add(spike);
  mergeFlatMeshes(root, moving, 'objeto');
  for (let part of moving)
    part.isMesh || mergeFlatMeshes(part, new Set([...moving].filter((other) => other !== part)), 'pieza');
}
/** Funde en `root` sus mallas de material liso, salvo las que cuelgan de `skip`. */
function mergeFlatMeshes(root, skip, name) {
  root.updateMatrixWorld(!0);
  let inverse = new Matrix4().copy(root.matrixWorld).invert(),
    merger = new MeshMerger({ contactH: 0.5, contactMin: 0.6, metal: !1 }),
    meshes = [];
  if (
    (root.traverse((node) => {
      if (!(node === root || !node.isMesh || !isFlatMaterial(node.material))) {
        for (let p = node; p && p !== root; p = p.parent) if (skip.has(p)) return;
        meshes.push(node);
      }
    }),
    !(meshes.length < 2))
  ) {
    for (let mesh of meshes)
      (merger.addGeometry(
        mesh.geometry,
        mesh.material,
        new Matrix4().multiplyMatrices(inverse, mesh.matrixWorld),
      ),
        mesh.parent.remove(mesh));
    root.add(merger.build(name));
  }
}
/**
 * Crea los objetos de `ctx.level.objects` y devuelve `{anchors, flames, create(def), set(id, estado),
 * update(dt), setGlow(id, color|false)}`. Los estados (closed/open, lit/out, hidden/revealed,
 * triggered, broken…) se animan con interpolaciones suaves.
 */
function buildObjects(ctx) {
  let { scene, level, ground } = ctx,
    anchors = new Map(),
    tweens = [],
    pos = new Vector3(),
    doorBuildings = new Map();
  for (let bld of ctx.buildings || []) bld.doorObj && doorBuildings.set(bld.doorObj.id, bld);
  let flames = [];
  function create(def) {
    if (!def.cell || anchors.has(def.id)) return null;
    cellToWorld(def.cell[0], def.cell[1], pos);
    let anchor = new Group();
    ((anchor.name = `obj:${def.id}`),
      anchor.position.set(pos.x, ground.heightAt(pos.x, pos.z), pos.z),
      (anchor.rotation.y = degToRad(def.rot ?? def.face ?? 0)),
      (anchor.userData = { id: def.id, type: def.type, def, state: null }));
    let vis = null;
    switch (def.type) {
      case 'door': {
        let bld = doorBuildings.get(def.id);
        bld
          ? ((anchor.userData.building = bld), (anchor.userData.leaf = bld.doorLeaf))
          : ((vis = makeVaultDoor(def.style || 'stone')),
            (anchor.userData.slab = vis.userData.slab),
            (anchor.userData.glow = vis.userData.glow));
        break;
      }
      case 'chest':
        ((vis = /sarc/i.test(def.id + (def.name || '')) ? makeSarcophagus() : makeChest(def.big ? 1.25 : 1)),
          (anchor.userData.lid = vis.userData.lid),
          (anchor.userData.slide = vis.userData.slide),
          (vis.rotation.y = (((def.id.length * 37) % 50) - 25) * 0.01));
        break;
      case 'cache': {
        if (((vis = new Group()), hasPiece('sack'))) {
          let sack = pieceMesh('sack');
          (sack.scale.setScalar(0.8), vis.add(sack));
        }
        if (hasPiece('Pebble_Round_4'))
          for (let j = 0; j < 3; j++) {
            let pebble = pieceMesh('Pebble_Round_4');
            (pebble.position.set(0.25 + j * 0.1, 0, -0.15 + j * 0.12),
              pebble.scale.setScalar(1.5),
              vis.add(pebble));
          }
        break;
      }
      case 'loot': {
        if (
          ((vis = new Group()),
          hasPiece('q_bag') && vis.add(pieceMesh('q_bag')),
          hasPiece('skull') && /peregrin|restos/i.test(def.name || ''))
        ) {
          let skull = pieceMesh('skull');
          (skull.position.set(0.35, 0, 0.1), vis.add(skull));
        }
        break;
      }
      case 'sign':
        vis = makeSign(!1);
        break;
      case 'board':
        vis = makeSign(!0);
        break;
      case 'campfire': {
        ((vis = makeCampfire()), (anchor.userData.coals = vis.userData.coals));
        let firePos = anchor.position.clone().add(new Vector3(0, 0.15, 0));
        (flames.push({ pos: firePos, scale: 1.3, id: def.id }),
          ctx.fx?.addLamp({
            pos: firePos.clone().add(new Vector3(0, 0.6, 0)),
            color: 16744496,
            range: 7,
            energy: 1.6,
            kind: 'fire',
            id: def.id,
            haloSize: 2.4,
            haloAlpha: 0.6,
          }));
        break;
      }
      case 'stairs':
        /up|subir|arriba/i.test(def.id) || (def.to || '').includes(':merrowick')
          ? ((vis = hasPiece('stairs') ? pieceMesh('stairs') : makeStairsDown()),
            hasPiece('stairs') && vis.scale.setScalar(0.6))
          : (vis = makeStairsDown());
        break;
      case 'trap': {
        let trapKind = /pit|foso/.test(def.id + def.name)
          ? 'pit'
          : /wire|cuerda/.test(def.id + def.name)
            ? 'wire'
            : /trap_\d/.test(def.id) || level.ambient === 'crypt'
              ? 'plate'
              : 'snare';
        ((vis = makeTrap(trapKind)),
          (anchor.userData.spikes = vis.userData.spikes),
          (anchor.userData.trapKind = trapKind));
        break;
      }
      case 'rune':
        (/seal_/.test(def.id)
          ? (vis = makeSealPlate(
              def.symbol || ['toro', 'rio', 'piedra'][Number(def.id.slice(-1)) - 1] || 'toro',
            ))
          : ((vis = makeRuneStone(!1)),
            (anchor.userData.setGlyph = vis.userData.setGlyph),
            (anchor.userData.turn = vis.userData.turn)),
          (anchor.userData.glow = vis.userData.glow));
        break;
      case 'seal':
        ((vis = makeSeal()),
          (anchor.userData.glow = vis.userData.glow),
          (anchor.userData.boss = vis.userData.boss),
          ctx.fx?.addLamp({
            pos: anchor.position.clone().add(new Vector3(0, 0.8, 0)),
            color: 16723992,
            range: 7,
            energy: 1.6,
            kind: 'fire',
            id: def.id,
            haloSize: 3.2,
            haloAlpha: 0.35,
          }));
        break;
      case 'lever':
        ((vis = makeLever()), (anchor.userData.arm = vis.userData.arm));
        break;
      case 'inspect':
        def.stele
          ? ((vis = makeStele()), (anchor.userData.glow = vis.userData.glow))
          : def.socket && ((vis = makeHornSocket()), (anchor.userData.horn = vis.userData.horn));
        break;
      default:
        break;
    }
    if (vis) {
      mergeObjectStatic(vis);
      let box = new Box3().setFromObject(vis),
        small = box.isEmpty() || box.max.y - box.min.y < 1.1;
      (vis.traverse((node) => {
        node.isMesh &&
          ((node.castShadow = !small && (node.castShadow || node.geometry.boundingSphere?.radius > 0.2)),
          (node.receiveShadow = !0));
      }),
        small &&
          !box.isEmpty() &&
          def.type !== 'trap' &&
          ground.blob(LAYER.ao, anchor.position.x, anchor.position.z, 0.75, 0.5),
        anchor.add(vis),
        (anchor.userData.vis = vis));
    }
    return (
      scene.add(anchor),
      anchors.set(def.id, anchor),
      def.hidden || def.hidden_until || def.type === 'trap'
        ? setState(anchor, 'hidden', !0)
        : def.type === 'campfire'
          ? setState(anchor, def.requires ? 'out' : 'lit', !0)
          : def.type === 'seal'
            ? setState(anchor, 'active', !0)
            : setState(anchor, def.type === 'door' || def.type === 'chest' ? 'closed' : 'idle', !0),
      anchor
    );
  }
  for (let def of level.objects || []) create(def);
  function setState(anchor, state, instant = !1) {
    let ud = anchor.userData,
      prev = ud.state;
    ud.state = state;
    let tween = (from, to, dur, fn) => tweens.push({ t: instant ? dur : 0, dur, from, to, fn });
    if (
      (state === 'sprung' && (state = 'triggered'),
      state === 'empty' && (state = 'open'),
      state !== 'hidden' && (anchor.visible = !0),
      GLYPHS.includes(state) && ud.setGlyph)
    )
      return (
        ud.setGlyph(state),
        ud.turn &&
          tween(
            ud.turn.rotation.y,
            ud.turn.rotation.y + Math.PI * 2,
            0.9,
            (val) => (ud.turn.rotation.y = val),
          ),
        ud.glow && tween(ud.glow.emissiveIntensity, 1.6, 0.6, (val) => (ud.glow.emissiveIntensity = val)),
        (ud.glyph = state),
        prev
      );
    if ((state === 'pressed' || state === 'up') && ud.vis && /seal_/.test(ud.id))
      return (
        tween(ud.vis.position.y, state === 'pressed' ? -0.09 : 0, 0.35, (val) => (ud.vis.position.y = val)),
        ud.glow &&
          tween(
            ud.glow.emissiveIntensity,
            state === 'pressed' ? 2 : 0.3,
            0.4,
            (val) => (ud.glow.emissiveIntensity = val),
          ),
        prev
      );
    if (ud.horn && (state === 'solved' || state === 'placed'))
      return ((ud.horn.visible = !0), tween(1.9, 1.35, 0.8, (val) => (ud.horn.position.y = val)), prev);
    switch (state) {
      case 'hidden':
        anchor.visible = !1;
        break;
      case 'revealed':
      case 'idle':
        anchor.visible = !0;
        break;
      case 'open':
        (ud.vis && (ud.vis.visible = !0),
          ud.leaf && tween(ud.leaf.rotation.y, -1.75, 0.8, (val) => (ud.leaf.rotation.y = val)),
          ud.lid && ud.slide
            ? (tween(ud.lid.position.x, 0.75, 1.2, (val) => (ud.lid.position.x = val)),
              tween(ud.lid.rotation.z, -0.12, 1.2, (val) => (ud.lid.rotation.z = val)))
            : ud.lid && tween(ud.lid.rotation.x, -1.9, 0.6, (val) => (ud.lid.rotation.x = val)),
          ud.slab && tween(ud.slab.position.y, -2.45, 2.2, (val) => (ud.slab.position.y = val)));
        break;
      case 'closed':
        (ud.vis && (ud.vis.visible = !0),
          ud.leaf && tween(ud.leaf.rotation.y, 0, 0.6, (val) => (ud.leaf.rotation.y = val)),
          ud.lid && ud.slide
            ? (tween(ud.lid.position.x, 0, 1, (val) => (ud.lid.position.x = val)),
              tween(ud.lid.rotation.z, 0, 1, (val) => (ud.lid.rotation.z = val)))
            : ud.lid && tween(ud.lid.rotation.x, 0, 0.5, (val) => (ud.lid.rotation.x = val)),
          ud.slab && tween(ud.slab.position.y, 0, 1.2, (val) => (ud.slab.position.y = val)));
        break;
      case 'lit':
      case 'on':
      case 'active':
      case 'solved':
        (ud.vis && (ud.vis.visible = !0),
          ud.glow &&
            tween(
              ud.glow.emissiveIntensity,
              state === 'active' ? 1.2 : 2.4,
              0.8,
              (val) => (ud.glow.emissiveIntensity = val),
            ),
          ud.coals && (ud.coals.material.emissiveIntensity = 1.5),
          ud.arm && tween(ud.arm.rotation.x, 0.6, 0.4, (val) => (ud.arm.rotation.x = val)),
          ud.type === 'campfire' && ctx.onFire?.(ud.id, !0));
        break;
      case 'out':
      case 'off':
        (ud.glow && tween(ud.glow.emissiveIntensity, 0, 0.6, (val) => (ud.glow.emissiveIntensity = val)),
          ud.coals && (ud.coals.material.emissiveIntensity = 0.05),
          ud.arm && tween(ud.arm.rotation.x, -0.6, 0.4, (val) => (ud.arm.rotation.x = val)),
          ud.type === 'campfire' && ctx.onFire?.(ud.id, !1));
        break;
      case 'disarmed':
        if ((ud.vis && (ud.vis.visible = !0), ud.spikes)) for (let spike of ud.spikes) spike.visible = !1;
        ud.vis && ud.vis.traverse((node) => node.isMesh && (node.rotation.z = 0.4));
        break;
      case 'triggered':
        if ((ud.vis && (ud.vis.visible = !0), ud.spikes))
          for (let spike of ud.spikes)
            ((spike.visible = !0), tween(-0.2, 0.18, 0.12, (val) => (spike.position.y = val)));
        ud.trapKind === 'pit' && ud.vis.userData.cover && (ud.vis.userData.cover.visible = !1);
        break;
      case 'broken':
        (ud.glow && tween(ud.glow.emissiveIntensity, 0, 2, (val) => (ud.glow.emissiveIntensity = val)),
          ud.boss &&
            (tween(ud.boss.position.y, 0.12, 1.5, (val) => (ud.boss.position.y = val)),
            ud.boss.rotation.set(0.3, 0.4, 0.2)),
          ctx.onSeal?.(ud.id, 'broken'));
        break;
      case 'restored':
        (ud.glow &&
          (ud.glow.emissive?.set(6340863),
          tween(ud.glow.emissiveIntensity, 2.2, 1.5, (val) => (ud.glow.emissiveIntensity = val))),
          ctx.onSeal?.(ud.id, 'restored'));
        break;
      default:
        ud.vis && (ud.vis.visible = !0);
    }
    return prev;
  }
  let clock = 0;
  function tick(dt) {
    clock += dt;
    for (let k = tweens.length - 1; k >= 0; k--) {
      let tw = tweens[k];
      tw.t = Math.min(tw.dur, tw.t + dt);
      let p = tw.t / tw.dur,
        ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      (tw.fn(tw.from + (tw.to - tw.from) * ease), tw.t >= tw.dur && tweens.splice(k, 1));
    }
    for (let [, anchor] of anchors) {
      let ud = anchor.userData;
      if (
        ud.glow &&
        (ud.state === 'active' || ud.state === 'lit' || ud.state === 'solved') &&
        !tweens.length
      ) {
        let base = ud.state === 'active' ? 1 : 2.2;
        ud.glow.emissiveIntensity = base * (0.8 + 0.2 * Math.sin(clock * (ud.type === 'seal' ? 1.4 : 2.2)));
      }
    }
  }
  let glows = new Map(),
    glowRing = new RingGeometry(0.35, 0.95, 40).rotateX(-Math.PI / 2);
  function setGlow(id, color) {
    let anchor = anchors.get(id);
    if (!anchor) return;
    let ring = glows.get(id);
    if (color == null || color === !1) {
      ring && (anchor.remove(ring), ring.material.dispose(), glows.delete(id));
      return;
    }
    if (!ring) {
      let mat = new ShaderMaterial({
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
      ((ring = new Mesh(glowRing, mat)),
        (ring.position.y = 0.05),
        (ring.renderOrder = 6),
        (ring.name = 'resalte'),
        anchor.add(ring),
        glows.set(id, ring));
    }
    ring.material.uniforms.uColor.value.set(color === !0 ? 16767088 : color);
  }
  let tickFn = tick;
  function update(dt) {
    tickFn(dt);
    for (let [, ring] of glows) ring.material.uniforms.uTime.value = clock;
  }
  return {
    anchors,
    flames,
    create,
    set: (id, state) => (anchors.has(id) ? setState(anchors.get(id), state) : void 0),
    update,
    setGlow,
  };
}
let objectMatsCache = null;
/** Caja w×h×d con material, apoyada en (x, y, z) y con sombras. */
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => {
  let mesh = new Mesh(new BoxGeometry(w, h, d), mat);
  return (mesh.position.set(x, y + h / 2, z), (mesh.castShadow = !0), (mesh.receiveShadow = !0), mesh);
};
/** Glifos de las piedras rúnicas. */
const GLYPHS = ['agua', 'monte', 'cuernos', 'ojo', 'llama'];

export { buildObjects };
