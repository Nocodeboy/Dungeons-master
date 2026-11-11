// world/interiors.js — interior de la posada (ambiente «inn»): calcula la sala a partir del suelo del
// mapa, levanta los cuatro muros con huecos de puertas (las salidas) y ventanas, vigas y zócalos, en
// versión completa y recortada (`updateCutaway` muestra la recortada en los muros que miran a la
// cámara), y monta los decorados propios: chimenea con hogar, barra, estantes de botellas, escalera,
// lámpara de araña, faroles de pared, alfombras y leña.
// Reconstruido de publicado/juego.js (módulo __esm «I1»). Lo usan index.js y props.js (`INTERIOR_DECOR`).

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
import { fixGlass, MeshMerger } from './kit.js';
import { LAYER } from './ground.js';
import { cellToWorld, HEX_SIZE, HEX_RADIUS, cellKey, degToRad } from './grid.js';

/** Materiales del interior (revoco, vigas, tablas, piedra, pizarra, barra, vidrio…). */
function interiorMats() {
  if (interiorMatsCache) return interiorMatsCache;
  let named = (mat, name) => ((mat.name = name), mat),
    plain = (color, name, extra = {}) =>
      named(new MeshStandardMaterial({ color, roughness: 0.85, ...extra }), name);
  return (
    (interiorMatsCache = {
      plaster: named(pbrMaterial('plastered_stone_wall', { tint: 15260356, ao: !1 }), 'revoco'),
      timber: named(pbrMaterial('medieval_wood', { tint: 7231041, ao: !1 }), 'viga'),
      panel: named(pbrMaterial('rough_wood', { tint: 8413247, ao: !1 }), 'tablas'),
      stone: named(pbrMaterial('castle_wall_varriation', { tint: 13616050, ao: !1 }), 'piedra_hogar'),
      slate: named(pbrMaterial('slate_floor', { tint: 9210510, ao: !1 }), 'pizarra'),
      barWood: named(pbrMaterial('rough_wood', { tint: 6177065, ao: !1 }), 'barra'),
      barTop: named(pbrMaterial('medieval_wood', { tint: 8017976, ao: !1 }), 'tablero'),
      soot: plain(1314057, 'hollin', { roughness: 1 }),
      iron: plain(2894118, 'hierro', { metalness: 0.7, roughness: 0.5 }),
      bark: plain(4863526, 'corteza', { roughness: 0.95 }),
      logEnd: plain(11569759, 'tocon'),
      green: plain(2048038, 'vidrio_verde', { roughness: 0.25 }),
      amber: plain(6960144, 'vidrio_ambar', { roughness: 0.25 }),
      clay: plain(10115642, 'barro_cocido'),
    }),
    interiorMatsCache
  );
}
/** Caja con UV proporcionales al tamaño de cada cara (copia de la de props.js). */
function blockGeometry(w, h, d, texel = 1) {
  let geo = new BoxGeometry(w, h, d),
    uv = geo.getAttribute('uv'),
    faceSizes = [
      [d, h],
      [d, h],
      [w, d],
      [w, d],
      [w, h],
      [w, h],
    ];
  for (let face = 0; face < 6; face++)
    for (let k = 0; k < 4; k++) {
      let idx = face * 4 + k;
      uv.setXY(idx, (uv.getX(idx) * faceSizes[face][0]) / texel, (uv.getY(idx) * faceSizes[face][1]) / texel);
    }
  return geo;
}
/** Añade al `merger` una caja w×h×d apoyada en (x, y, z) y girada `ry`. */
function addBlock(merger, mat, w, h, d, x, y, z, ry = 0, texel = 1) {
  merger.addGeometry(blockGeometry(w, h, d, texel).translate(0, h / 2, 0), mat, xform(x, y, z, ry));
}
/** Textura de alfombra con rombos y flecos, dibujada en un lienzo. */
function rugTexture(colors = ['#6b2a1f', '#c9a25e', '#2f3a52']) {
  let canvas = document.createElement('canvas');
  ((canvas.width = 256), (canvas.height = 384));
  let g2d = canvas.getContext('2d'),
    [bg, line, fill] = colors;
  ((g2d.fillStyle = bg),
    g2d.fillRect(0, 0, 256, 384),
    (g2d.strokeStyle = line),
    (g2d.lineWidth = 6),
    g2d.strokeRect(14, 14, 228, 356),
    (g2d.lineWidth = 2),
    g2d.strokeRect(26, 26, 204, 332),
    (g2d.fillStyle = fill));
  for (let k = 0; k < 4; k++) {
    let cy = 70 + k * 82;
    (g2d.beginPath(),
      g2d.moveTo(128, cy - 34),
      g2d.lineTo(178, cy),
      g2d.lineTo(128, cy + 34),
      g2d.lineTo(78, cy),
      g2d.closePath(),
      g2d.fill(),
      (g2d.strokeStyle = line),
      g2d.stroke());
  }
  let img = g2d.getImageData(0, 0, 256, 384);
  for (let p = 0; p < img.data.length; p += 4) {
    let row = Math.floor(p / 4 / 256),
      noise = (Math.random() - 0.5) * 22 + (row % 3 === 0 ? -8 : 0);
    for (let ch = 0; ch < 3; ch++) img.data[p + ch] = Math.max(0, Math.min(255, img.data[p + ch] + noise));
  }
  (g2d.putImageData(img, 0, 0), (g2d.strokeStyle = '#d8cbb0'), (g2d.lineWidth = 1));
  for (let x = 16; x < 240; x += 4)
    (g2d.beginPath(),
      g2d.moveTo(x, 0),
      g2d.lineTo(x + (Math.random() - 0.5) * 2, 10),
      g2d.moveTo(x, 384),
      g2d.lineTo(x + (Math.random() - 0.5) * 2, 374),
      g2d.stroke());
  let tex = new CanvasTexture(canvas);
  return ((tex.colorSpace = SRGBColorSpace), (tex.anisotropy = 4), tex);
}
/** Material emisivo de ventana de día (cielo con cuarterones). */
function daylightWindowMat() {
  if (windowMatCache) return windowMatCache;
  let canvas = document.createElement('canvas');
  ((canvas.width = 64), (canvas.height = 96));
  let g2d = canvas.getContext('2d'),
    grad = g2d.createLinearGradient(0, 0, 0, 96);
  (grad.addColorStop(0, '#d8e8f4'),
    grad.addColorStop(1, '#8fb0c8'),
    (g2d.fillStyle = grad),
    g2d.fillRect(0, 0, 64, 96),
    (g2d.strokeStyle = '#2a2622'),
    (g2d.lineWidth = 2));
  for (let p = 0; p <= 64; p += 16)
    (g2d.beginPath(), g2d.moveTo(p, 0), g2d.lineTo(p + 0.01, 96), g2d.stroke());
  for (let p = 0; p <= 96; p += 16) (g2d.beginPath(), g2d.moveTo(0, p), g2d.lineTo(64, p), g2d.stroke());
  let tex = new CanvasTexture(canvas);
  return (
    (tex.colorSpace = SRGBColorSpace),
    (windowMatCache = new MeshStandardMaterial({
      map: tex,
      emissive: 16777215,
      emissiveMap: tex,
      emissiveIntensity: 0.55,
      roughness: 0.2,
      name: 'ventana_dia',
    })),
    windowMatCache
  );
}
/** Botella por revolución, de la altura dada. */
function bottleGeometry(height = 0.3) {
  let profile = [
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
  ].map(([r, y]) => new Vector2(r * height * 2.2, y * height));
  return new LatheGeometry(profile, 8);
}
/**
 * Construye el interior del nivel sobre `ctx` (scene, map, level, ground, fx, static, rnd).
 * Devuelve `{group, room: {x0, x1, z0, z1}, updateCutaway(dirección de la cámara)}`.
 */
async function buildInterior(ctx) {
  let { scene, map, level, ground, fx } = ctx,
    merger = ctx.static,
    mats = interiorMats(),
    height = level.interior?.height ?? 3.4,
    rnd = ctx.rnd,
    group = new Group();
  ((group.name = 'interior'), scene.add(group));
  let tmp = new Vector3(),
    exitCells = new Set();
  for (let exit of level.exits || []) for (let cell of exit.cells) exitCells.add(cellKey(cell[0], cell[1]));
  let minX = 1 / 0,
    maxX = -1 / 0,
    minZ = 1 / 0,
    maxZ = -1 / 0;
  map.each((col, row, ch) => {
    ch === '#' ||
      ch === ' ' ||
      exitCells.has(cellKey(col, row)) ||
      (cellToWorld(col, row, tmp),
      (minX = Math.min(minX, tmp.x - HEX_SIZE / 2)),
      (maxX = Math.max(maxX, tmp.x + HEX_SIZE / 2)),
      (minZ = Math.min(minZ, tmp.z - HEX_RADIUS * HEX_SIZE)),
      (maxZ = Math.max(maxZ, tmp.z + HEX_RADIUS * HEX_SIZE)));
  });
  let room = { x0: minX, x1: maxX, z0: minZ, z1: maxZ },
    decor = level.decor || [],
    posOf = (item) => {
      let p = cellToWorld(item.cell[0], item.cell[1]);
      return (item.offset && ((p.x += item.offset[0] * HEX_SIZE), (p.z += item.offset[1] * HEX_SIZE)), p);
    },
    walls = {
      n: { n: new Vector3(0, 0, -1), u0: minX, u1: maxX, fixed: minZ, along: 'x' },
      s: { n: new Vector3(0, 0, 1), u0: minX, u1: maxX, fixed: maxZ, along: 'x' },
      w: { n: new Vector3(-1, 0, 0), u0: minZ, u1: maxZ, fixed: minX, along: 'z' },
      e: { n: new Vector3(1, 0, 0), u0: minZ, u1: maxZ, fixed: maxX, along: 'z' },
    },
    wallPoint = (wall, u, inset = 0) =>
      wall.along === 'x'
        ? new Vector3(u, 0, wall.fixed + wall.n.z * inset)
        : new Vector3(wall.fixed + wall.n.x * inset, 0, u),
    wallRot = (wall) => (wall.along === 'x' ? 0 : Math.PI / 2);
  for (let wall of Object.values(walls)) wall.open = [];
  for (let exit of level.exits || [])
    for (let cell of exit.cells) {
      cellToWorld(cell[0], cell[1], tmp);
      let dists = {
          n: Math.abs(tmp.z - minZ),
          s: Math.abs(tmp.z - maxZ),
          w: Math.abs(tmp.x - minX),
          e: Math.abs(tmp.x - maxX),
        },
        side = Object.keys(dists).sort((sa, sb) => dists[sa] - dists[sb])[0],
        wall = walls[side],
        along = wall.along === 'x' ? tmp.x : tmp.z;
      wall.open.push({ a: along - 0.68, b: along + 0.68, v0: 0, v1: 2.25, door: !0 });
    }
  for (let win of decor.filter((item) => item.key === 'window')) {
    let wall = walls[win.side || 'n'],
      wp = posOf(win),
      along = wall.along === 'x' ? wp.x : wp.z;
    wall.open.push({ a: along - 0.55, b: along + 0.55, v0: 1, v1: 2.25, window: !0 });
  }
  let sides = {};
  for (let [side, wall] of Object.entries(walls)) {
    let full = new MeshMerger({ contactH: 0.8, contactMin: 0.72, groundAt: () => 0, finish: { wind: 0 } }),
      cut = new MeshMerger({ contactH: 0.5, contactMin: 0.7, groundAt: () => 0, finish: { wind: 0 } }),
      rot = wallRot(wall),
      start = wall.u0 - WALL_THICK,
      end = wall.u1 + WALL_THICK,
      opens = wall.open.sort((oa, ob) => oa.a - ob.a),
      stops = [start, end];
    for (let op of opens) stops.push(op.a, op.b);
    stops.sort((na, nb) => na - nb);
    for (let seg = 0; seg < stops.length - 1; seg++) {
      let u0 = stops[seg],
        u1 = stops[seg + 1];
      if (u1 - u0 < 0.01) continue;
      let mid = (u0 + u1) / 2,
        opening = opens.find((op) => mid > op.a && mid < op.b),
        wpos = wallPoint(wall, mid, WALL_THICK / 2),
        len = u1 - u0,
        wallPiece = (mg, y0, y1) =>
          addBlock(mg, mats.plaster, len, y1 - y0, WALL_THICK, wpos.x, y0, wpos.z, rot, 2.4);
      if (
        (opening
          ? (opening.v0 > 0 &&
              (wallPiece(full, 0, opening.v0), wallPiece(cut, 0, Math.min(CUT_HEIGHT, opening.v0))),
            wallPiece(full, opening.v1, height))
          : (wallPiece(full, 0, height), wallPiece(cut, 0, CUT_HEIGHT)),
        !opening?.door)
      ) {
        let panelPos = wallPoint(wall, mid, -0.02);
        addBlock(full, mats.panel, len, 1, 0.04, panelPos.x, 0, panelPos.z, rot, 1.2);
        let beamPos = wallPoint(wall, mid, -0.045);
        addBlock(full, mats.timber, len, 0.07, 0.09, beamPos.x, 1, beamPos.z, rot, 1.5);
      }
    }
    let topPos = wallPoint(wall, (start + end) / 2, WALL_THICK / 2 - 0.04);
    addBlock(
      full,
      mats.timber,
      end - start,
      0.24,
      WALL_THICK + 0.08,
      topPos.x,
      height - 0.02,
      topPos.z,
      rot,
      1.5,
    );
    let posts = [wall.u0 + 0.12, wall.u1 - 0.12];
    for (let pu = wall.u0 + 3.2; pu < wall.u1 - 1.5; pu += 3.3)
      opens.some((op) => pu > op.a - 0.3 && pu < op.b + 0.3) || posts.push(pu);
    for (let pu of posts) {
      let postPos = wallPoint(wall, pu, -0.07);
      addBlock(full, mats.timber, 0.24, height, 0.14, postPos.x, 0, postPos.z, rot, 1.2);
    }
    for (let op of opens) {
      let mid = (op.a + op.b) / 2,
        width = op.b - op.a;
      if (op.door) {
        for (let pu of [op.a - 0.07, op.b + 0.07]) {
          let jamb = wallPoint(wall, pu, WALL_THICK / 2);
          (addBlock(full, mats.timber, 0.16, op.v1 + 0.1, WALL_THICK + 0.1, jamb.x, 0, jamb.z, rot, 1.2),
            addBlock(
              cut,
              mats.timber,
              0.16,
              CUT_HEIGHT + 0.18,
              WALL_THICK + 0.1,
              jamb.x,
              0,
              jamb.z,
              rot,
              1.2,
            ));
        }
        let lintel = wallPoint(wall, mid, WALL_THICK / 2);
        (addBlock(
          full,
          mats.timber,
          width + 0.3,
          0.18,
          WALL_THICK + 0.12,
          lintel.x,
          op.v1,
          lintel.z,
          rot,
          1.2,
        ),
          addBlock(full, mats.slate, width, 0.05, WALL_THICK + 0.12, lintel.x, 0, lintel.z, rot, 1),
          addBlock(cut, mats.slate, width, 0.05, WALL_THICK + 0.12, lintel.x, 0, lintel.z, rot, 1),
          ground.blob(LAYER.ao, lintel.x, lintel.z, 1, 0.35));
      } else {
        let lintel = wallPoint(wall, mid, WALL_THICK / 2);
        (addBlock(
          full,
          mats.timber,
          width + 0.16,
          0.1,
          WALL_THICK + 0.06,
          lintel.x,
          op.v1,
          lintel.z,
          rot,
          1.2,
        ),
          addBlock(
            full,
            mats.timber,
            width + 0.28,
            0.08,
            WALL_THICK + 0.2,
            lintel.x,
            op.v0 - 0.08,
            lintel.z,
            rot,
            1.2,
          ));
        for (let pu of [op.a - 0.05, op.b + 0.05]) {
          let jamb = wallPoint(wall, pu, WALL_THICK / 2);
          addBlock(
            full,
            mats.timber,
            0.1,
            op.v1 - op.v0 + 0.1,
            WALL_THICK + 0.06,
            jamb.x,
            op.v0 - 0.05,
            jamb.z,
            rot,
            1.2,
          );
        }
      }
    }
    let fullGroup = full.build(`muro_${side}`),
      cutGroup = cut.build(`muro_${side}_cortado`);
    for (let op of opens.filter((cand) => cand.window)) {
      let glass = new Mesh(new PlaneGeometry(op.b - op.a, op.v1 - op.v0), daylightWindowMat()),
        gpos = wallPoint(wall, (op.a + op.b) / 2, WALL_THICK * 0.5);
      (glass.position.set(gpos.x, (op.v0 + op.v1) / 2, gpos.z),
        (glass.rotation.y =
          wall.along === 'x' ? (wall.n.z > 0 ? Math.PI : 0) : wall.n.x > 0 ? -Math.PI / 2 : Math.PI / 2),
        fullGroup.add(glass));
      let lightPos = wallPoint(wall, (op.a + op.b) / 2, -1.4);
      ground.blob(LAYER.light, lightPos.x, lightPos.z, 1.2, 0.35);
    }
    for (let child of cutGroup.children) child.castShadow = !1;
    (group.add(fullGroup, cutGroup), (cutGroup.visible = !1));
    let extra = new MeshMerger({ contactH: 0.1, contactMin: 1, finish: { wind: 0 } });
    sides[side] = { s: wall, full: fullGroup, cut: cutGroup, lamps: [], extra };
  }
  for (let item of decor) {
    if (!INTERIOR_DECOR.has(item.key)) continue;
    let pos = posOf(item);
    switch (item.key) {
      case 'hearth':
        await buildHearth(ctx, mats, sides.n, pos, height, room);
        break;
      case 'bar':
        buildBar(ctx, mats, item, pos, posOf({ cell: item.to }));
        break;
      case 'bar_shelves':
        buildBarShelves(ctx, mats, sides.w, pos, posOf({ cell: item.to }), room);
        break;
      case 'stairs_up':
        buildStairs(ctx, mats, sides.e, pos, posOf({ cell: item.to }), room, height);
        break;
      case 'chandelier':
        await buildChandelier(ctx, mats, pos, room, height);
        break;
      case 'wall_lantern': {
        let side = sides[item.side || 'n'],
          along = side.s.along === 'x' ? pos.x : pos.z,
          lpos = wallPoint(side.s, along, -0.36);
        side.extra.add('q_lantern', xform(lpos.x, 1.5, lpos.z, Math.atan2(-side.s.n.x, -side.s.n.z)));
        let lamp = fx.addLamp({
          pos: lpos.clone().setY(1.85),
          color: 16753226,
          range: 5.5,
          energy: 0.9,
          kind: 'lamp',
          haloSize: 1.1,
          haloAlpha: 0.45,
        });
        (side.lamps.push(lamp || lpos.clone().setY(1.85)),
          ctx.ground.blob(LAYER.light, lpos.x - side.s.n.x * 1.2, lpos.z - side.s.n.z * 1.2, 2.2, 0.7));
        break;
      }
      case 'rug': {
        let [rw, rd] = item.size || [1.4, 2.4],
          rug = new Mesh(
            new PlaneGeometry(rw, rd),
            new MeshStandardMaterial({ map: rugTexture(item.colors), roughness: 0.95, name: 'alfombra' }),
          );
        (rug.rotation.set(-Math.PI / 2, 0, degToRad(item.rot || 0)),
          rug.position.set(pos.x, 0.008, pos.z),
          (rug.receiveShadow = !0),
          group.add(rug));
        break;
      }
      case 'woodpile': {
        let logs = [];
        for (let layer = 0; layer < 3; layer++)
          for (let slot = 0; slot < 4 - layer; slot++) {
            let log = new CylinderGeometry(0.065, 0.068, 0.6, 8).rotateZ(Math.PI / 2);
            (log.translate(0, 0.066 + layer * 0.115, (slot - (3 - layer) / 2) * 0.135), logs.push(log));
          }
        (merger.addGeometry(
          mergeGeometries(logs),
          mats.bark,
          xform(pos.x, 0, pos.z - 0.3, Math.PI / 2 + (rnd() - 0.5) * 0.2),
        ),
          ground.blob(LAYER.ao, pos.x, pos.z - 0.3, 0.6, 0.45));
        break;
      }
      default:
    }
  }
  for (let side of Object.values(sides)) {
    let hung = side.extra.build('colgado');
    for (let child of hung.children) child.castShadow = !1;
    side.full.add(hung);
  }
  for (let side of Object.values(sides))
    side.lampSrc = side.lamps.map((lamp) =>
      lamp.isVector3 ? fx.lampSources.find((src) => src.pos.distanceTo(lamp) < 0.3) : lamp,
    );
  for (let wall of Object.values(walls))
    for (let pu = wall.u0; pu <= wall.u1; pu += 0.8) {
      let aoPos = wallPoint(wall, pu, -0.2);
      ground.blob(LAYER.ao, aoPos.x, aoPos.z, 0.7, 0.4);
    }
  let cutKey = '';
  return {
    group,
    room,
    updateCutaway(dir) {
      let key = Object.values(sides)
        .map((side) => (side.s.n.dot(dir) < -0.18 ? 1 : 0))
        .join('');
      key !== cutKey &&
        ((cutKey = key),
        Object.values(sides).forEach((side, idx) => {
          let cut = key[idx] === '1';
          ((side.full.visible = !cut), (side.cut.visible = cut));
          for (let lamp of side.lampSrc || []) lamp && (lamp.on = !cut);
        }));
    },
  };
}
/** Chimenea con hogar encendido, cabeza de toro, velas, escudo y caldero. */
async function buildHearth(ctx, mats, side, pos, height, room) {
  let merger = ctx.static,
    { ground, fx } = ctx,
    z0 = room.z0,
    cx = pos.x,
    chimney = new MeshMerger({ contactH: 0.6, contactMin: 0.8, groundAt: () => 0, finish: { wind: 0 } });
  for (let dx of [-1.05, 1.05]) addBlock(merger, mats.stone, 0.5, 1.2, 0.62, cx + dx, 0, z0 + 0.31, 0, 1.4);
  (addBlock(merger, mats.soot, 1.62, 1.2, 0.04, cx, 0, z0 + 0.02),
    addBlock(merger, mats.slate, 1.6, 0.06, 0.6, cx, 0, z0 + 0.3, 0, 1),
    addBlock(merger, mats.slate, 3.1, 0.07, 0.85, cx, 0, z0 + 1.04, 0, 1),
    addBlock(chimney, mats.stone, 2.6, 0.42, 0.66, cx, 1.2, z0 + 0.33, 0, 1.4),
    addBlock(chimney, mats.stone, 2.36, height - 1.62, 0.5, cx, 1.62, z0 + 0.25, 0, 1.4),
    addBlock(chimney, mats.timber, 2.95, 0.14, 0.36, cx, 1.62, z0 + 0.66, 0, 1.2),
    side.full.add(chimney.build('chimenea')));
  let logs = [];
  for (let [lx, lz, ry, rz] of [
    [-0.18, 0.02, 0.2, 1.45],
    [0.2, -0.04, -0.3, 1.5],
    [0, 0.08, 1.2, 1.57],
  ]) {
    let log = new CylinderGeometry(0.06, 0.063, 0.7, 8);
    (log.applyMatrix4(new Matrix4().makeRotationFromEuler(new Euler(0, ry, rz))),
      log.translate(lx, 0.13, lz),
      logs.push(log));
  }
  merger.addGeometry(mergeGeometries(logs), mats.bark, xform(cx, 0, z0 + 0.34));
  let firePos = new Vector3(cx, 0.12, z0 + 0.36);
  (fx.flames.push({ pos: firePos, scale: 1.7 }),
    fx.addLamp({
      pos: firePos.clone().add(new Vector3(0, 0.55, 0.35)),
      color: 16747060,
      range: 10,
      energy: 2.4,
      kind: 'fire',
      haloSize: 2.4,
      haloAlpha: 0.5,
    }),
    ground.blob(LAYER.light, cx, z0 + 1.6, 3.4, 1),
    ground.blob(LAYER.ao, cx, z0 + 0.3, 1.2, 0.5));
  try {
    let head = fixGlass(await loadProp('bull_head'));
    (head.scale.setScalar(1.55),
      head.position.set(cx, 2.05, z0 + 0.52),
      head.traverse((node) => {
        node.isMesh && (node.castShadow = !1);
      }),
      side.full.add(head));
  } catch {}
  for (let dx of [-1.15, 1.15]) side.extra.add('q_candles3', xform(cx + dx, 1.76, z0 + 0.66));
  for (let dx of [-1.15, 1.15])
    fx.addLamp({
      pos: new Vector3(cx + dx, 2.15, z0 + 0.7),
      color: 16756832,
      range: 3,
      energy: 0.6,
      kind: 'lamp',
      haloSize: 0.8,
      haloAlpha: 0.4,
    });
  (side.extra.add('q_shield', xform(cx + 2.25, 1.55, z0 + 0.11, 0, 1.25)),
    merger.add('q_cauldron', xform(cx - 1.75, 0, z0 + 0.75, 0.6)),
    ctx.ground.blob(LAYER.ao, cx - 1.75, z0 + 0.75, 0.6, 0.4));
}
/** Barra de la posada entre `from` y `to`, con jarras, velas y farol. */
function buildBar(ctx, mats, item, from, to) {
  let merger = ctx.static,
    bx = (from.x + to.x) / 2 + 0.25,
    z0 = Math.min(from.z, to.z) - 0.45,
    z1 = Math.max(from.z, to.z) + 0.45,
    len = z1 - z0,
    cz = (z0 + z1) / 2;
  (addBlock(merger, mats.barWood, 0.55, 1, len, bx, 0, cz, 0, 1),
    addBlock(merger, mats.barTop, 0.8, 0.08, len + 0.2, bx, 1, cz, 0, 1.4),
    addBlock(merger, mats.soot, 0.6, 0.12, len, bx + 0.02, 0, cz));
  for (let pz = z0 + 0.25; pz < z1; pz += 0.48)
    addBlock(merger, mats.timber, 0.04, 0.82, 0.09, bx + 0.29, 0.1, pz, 0, 1);
  let items = new MeshMerger({ contactH: 0.1, contactMin: 1, finish: { wind: 0 } });
  for (let [dz, ry] of [
    [0.3, 0.3],
    [0.5, -0.6],
    [1.6, 2.1],
    [2.9, 1],
  ])
    items.add('q_mug', xform(bx + 0.05, 1.08, z0 + dz, ry));
  items.add('q_candles3', xform(bx - 0.05, 1.08, z0 + 0.95, 0.4));
  let lampZ = (z0 + z1) / 2 + 0.6;
  items.add('lantern', xform(bx - 0.05, 1.08, lampZ, 0.3, 0.3));
  let itemsGroup = items.build('barra_cosas');
  for (let child of itemsGroup.children) child.castShadow = !1;
  (ctx.scene.add(itemsGroup),
    ctx.fx.addLamp({
      pos: new Vector3(bx - 0.05, 1.32, lampZ),
      color: 16753226,
      range: 5.5,
      energy: 1,
      kind: 'lamp',
      haloSize: 1,
      haloAlpha: 0.45,
    }),
    ctx.ground.blob(LAYER.light, bx + 0.6, lampZ, 2, 0.7),
    ctx.ground.blob(LAYER.ao, bx, cz, 1, 0.45));
  for (let pz = z0; pz <= z1; pz += 0.6) ctx.ground.blob(LAYER.ao, bx, pz, 0.7, 0.3);
}
/** Estantes de botellas, jarras y platos tras la barra, en el muro oeste. */
function buildBarShelves(ctx, mats, side, from, to, room) {
  let merger = ctx.static,
    z0 = Math.min(from.z, to.z) - 0.3,
    z1 = Math.max(from.z, to.z) + 0.3,
    len = z1 - z0,
    cz = (z0 + z1) / 2,
    x0 = room.x0;
  (addBlock(merger, mats.barWood, 0.42, 0.9, len, x0 + 0.21, 0, cz, 0, 1),
    addBlock(merger, mats.barTop, 0.48, 0.05, len + 0.06, x0 + 0.24, 0.9, cz, 0, 1.4));
  let green = [],
    amber = [];
  for (let k = 0; k < Math.floor(len / 0.19); k++) {
    let bottle = bottleGeometry(0.26 + (k % 3) * 0.04).translate(
      x0 + 0.2 + (k % 2) * 0.08,
      0.95,
      z0 + 0.15 + k * 0.19,
    );
    (k % 3 === 1 ? amber : green).push(bottle);
  }
  (green.length && merger.addGeometry(mergeGeometries(green), mats.green, new Matrix4()),
    amber.length && merger.addGeometry(mergeGeometries(amber), mats.amber, new Matrix4()));
  let shelves = new MeshMerger({ contactH: 0.1, contactMin: 1, finish: { wind: 0 } });
  for (let sy of [1.48, 2.06]) {
    addBlock(shelves, mats.barTop, 0.32, 0.05, len, x0 + 0.18, sy, cz, 0, 1.4);
    for (let bz of [z0 + 0.3, cz, z1 - 0.3])
      addBlock(shelves, mats.iron, 0.05, 0.16, 0.05, x0 + 0.06, sy - 0.16, bz);
  }
  for (let k = 0; k < Math.floor(len / 0.32); k++)
    shelves.add('q_mug', xform(x0 + 0.18, 1.505, z0 + 0.2 + k * 0.32, Math.PI));
  for (let k = 0; k < Math.floor(len / 0.4); k++) {
    let plate = new CylinderGeometry(0.11, 0.11, 0.02, 14).rotateZ(Math.PI / 2 - 0.25);
    shelves.addGeometry(plate, mats.clay, xform(x0 + 0.12, 2.2, z0 + 0.25 + k * 0.4));
  }
  side.full.add(shelves.build('estantes'));
}
/** Escalera hacia el piso de arriba con barandilla y puerta de las habitaciones. */
function buildStairs(ctx, mats, side, from, to, room, height) {
  let merger = ctx.static,
    width = 1.1,
    sx = room.x1 - width / 2,
    zStart = from.z + 0.5,
    zEnd = Math.max(room.z0 + 0.5, to.z - 0.4),
    rise = Math.min(height - 0.8, 2.6),
    run = zStart - zEnd,
    steps = Math.max(6, Math.round(rise / 0.2)),
    stepRun = run / steps,
    stepRise = rise / steps;
  for (let j = 0; j < steps; j++) {
    let sy = stepRise * (j + 1),
      sz = zStart - stepRun * (j + 0.5);
    (addBlock(merger, mats.panel, width, 0.05, stepRun + 0.04, sx, sy - 0.05, sz, 0, 1),
      addBlock(merger, mats.barWood, width, stepRise, 0.03, sx, sy - stepRise, sz + stepRun / 2, 0, 1));
  }
  let slope = Math.hypot(run, rise),
    stringer = blockGeometry(0.08, 0.26, slope, 1.2);
  (stringer.rotateX(Math.atan2(rise, run)),
    stringer.translate(sx - width / 2 - 0.04, rise / 2 - 0.05, (zStart + zEnd) / 2),
    merger.addGeometry(stringer, mats.timber, new Matrix4()),
    addBlock(merger, mats.panel, width, 0.08, zEnd - room.z0, sx, rise - 0.08, (zEnd + room.z0) / 2, 0, 1),
    addBlock(merger, mats.timber, 0.14, rise, 0.14, sx - width / 2 + 0.07, 0, zEnd, 0, 1),
    addBlock(merger, mats.timber, 0.14, rise, 0.14, sx - width / 2 + 0.07, 0, room.z0 + 0.07, 0, 1));
  for (let j = 0; j <= steps; j += 3) {
    let py = stepRise * j,
      pz = zStart - stepRun * j;
    addBlock(merger, mats.timber, 0.06, 0.9, 0.06, sx - width / 2 + 0.05, py, pz, 0, 1);
  }
  let rail = blockGeometry(0.07, 0.07, slope, 1.2);
  (rail.rotateX(Math.atan2(rise, run)),
    rail.translate(sx - width / 2 + 0.05, rise / 2 + 0.9, (zStart + zEnd) / 2),
    merger.addGeometry(rail, mats.timber, new Matrix4()));
  let door = new MeshMerger({ contactH: 0.1, contactMin: 1, finish: { wind: 0 } }),
    doorZ = (zEnd + room.z0) / 2;
  (addBlock(door, mats.soot, 0.04, 2, 0.9, room.x1 - 0.02, rise, doorZ),
    addBlock(door, mats.timber, 0.12, 0.14, 1.15, room.x1 - 0.05, rise + 2, doorZ, 0, 1));
  for (let dz of [-0.52, 0.52])
    addBlock(door, mats.timber, 0.12, 2, 0.12, room.x1 - 0.05, rise, doorZ + dz, 0, 1);
  (side.full.add(door.build('puerta_habitaciones')),
    ctx.ground.blob(LAYER.ao, sx, (zStart + zEnd) / 2, 1.2, 0.4));
}
/** Viga y lámpara de araña colgada del techo. */
async function buildChandelier(ctx, mats, pos, room, height) {
  let merger = ctx.static;
  addBlock(
    merger,
    mats.timber,
    room.x1 - room.x0 + 2 * WALL_THICK,
    0.26,
    0.24,
    (room.x0 + room.x1) / 2,
    height - 0.36,
    pos.z,
    0,
    1.5,
  );
  try {
    let lamp = fixGlass(await loadProp('lantern_chandelier_01'));
    (lamp.scale.setScalar(1.15),
      lamp.position.set(pos.x, height - 0.48, pos.z),
      lamp.traverse((node) => {
        node.isMesh && (node.castShadow = !1);
      }),
      ctx.scene.add(lamp));
  } catch {}
  let hook = new Mesh(new BoxGeometry(0.03, 0.14, 0.03), interiorMats().iron);
  (hook.position.set(pos.x, height - 0.44, pos.z),
    ctx.scene.add(hook),
    ctx.fx.addLamp({
      pos: new Vector3(pos.x, height - 1.1, pos.z),
      color: 16756838,
      range: 10,
      energy: 1.6,
      kind: 'lamp',
      haloSize: 1.6,
      haloAlpha: 0.45,
    }),
    ctx.ground.blob(LAYER.light, pos.x, pos.z, 3.5, 0.75));
}
/** Claves de `level.decor` que construye este módulo (props.js las salta). */
const INTERIOR_DECOR = new Set([
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
/** Grosor de los muros (m) y altura de los muros recortados (m). */
const WALL_THICK = 0.3;
const CUT_HEIGHT = 0.45;
let interiorMatsCache = null;
const tmpMatrix = new Matrix4();
/** Matriz de posición, giro en Y y escala uniforme. */
const xform = (x, y, z, ry = 0, scale = 1) =>
  new Matrix4().compose(
    new Vector3(x, y, z),
    new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), ry),
    new Vector3(scale, scale, scale),
  );
let windowMatCache = null;

export { buildInterior, INTERIOR_DECOR };
