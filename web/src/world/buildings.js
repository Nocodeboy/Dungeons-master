// world/buildings.js — edificios de la aldea: busca el solar de cada atrezo con `foot` (regiones «B»/«H»
// del mapa), elige tamaño y orientación (hacia su puerta si la hay) y los monta con piezas modulares
// del kit «aldea» (muros por planta, esquinas, tejado, chimenea, ventanas, contraventanas, puerta,
// farol) fundidas en el `MeshMerger`. Casos propios: taberna, iglesia, herrería, molino de viento y de
// agua, mina, granero, mercado, pozo y ruina; además, casas sueltas en las afueras.
// Reconstruido de publicado/juego.js (módulo __esm «G3»). Lo usa index.js.

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
import { LAYER } from './ground.js';
import { cellToWorld, worldToCell, HEX_SIZE, cellKey, degToRad } from './grid.js';

/** Región «B»/«H» libre más cercana a `cell` (a 3 casillas como mucho), o null. */
function findLot(map, cell, used) {
  let regions = (map._bRegions ??= map.regions(['B', 'H'])),
    best = null,
    bestD = 1 / 0;
  for (let region of regions)
    if (!used.has(region))
      for (let [col, row] of region) {
        let dist = Math.abs(col - cell[0]) + Math.abs(row - cell[1]);
        dist < bestD && ((bestD = dist), (best = region));
      }
  return bestD <= 3 ? best : null;
}
/** ¿Cabe la planta W×D girada `ry` en las casillas de `cellSet`? */
function footprintFits(cellSet, center, ry, W, D, inset = 0.55) {
  let cos = Math.cos(ry),
    sin = Math.sin(ry),
    hw = W / 2 - inset,
    hd = D / 2 - inset,
    pts = [];
  for (let [px, pz] of [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
    [0, hd],
    [0, -hd],
    [hw, 0],
    [-hw, 0],
  ])
    pts.push([center.x + px * cos + pz * sin, center.z - px * sin + pz * cos]);
  return pts.every(([px, pz]) => cellSet.has(cellKey(...worldToCell(px, pz))));
}
/** Huecos de muro de una planta W×D: [lado, x, z, giro, índice] por cada tramo de 2 m. */
function wallSlots(W, D) {
  let slots = [];
  for (let k = 0; k < W / WALL_W; k++) slots.push(['front', -W / 2 + 1 + k * WALL_W, D / 2, 0, k]);
  for (let k = 0; k < W / WALL_W; k++) slots.push(['back', W / 2 - 1 - k * WALL_W, -D / 2, Math.PI, k]);
  for (let k = 0; k < D / WALL_W; k++) slots.push(['right', W / 2, D / 2 - 1 - k * WALL_W, Math.PI / 2, k]);
  for (let k = 0; k < D / WALL_W; k++) slots.push(['left', -W / 2, -D / 2 + 1 + k * WALL_W, -Math.PI / 2, k]);
  return slots;
}
/**
 * Casa genérica por plantas con estilos de `WALL_STYLES` y tejado. `opts`: W, D, floors, styles,
 * door, shutters, vines, chimney, dormer, boxes, curb, rnd. Devuelve las partes (ventanas, puerta,
 * chimenea, alturas) en coordenadas locales.
 */
function buildHouse(bb, opts) {
  let { W, D, floors, rnd } = opts,
    parts = { windows: [], doorLocal: null, chimneyTop: null, lamps: [] };
  for (let floor = 0; floor < floors; floor++) {
    let style = WALL_STYLES[opts.styles[Math.min(floor, opts.styles.length - 1)]],
      fy = floor * FLOOR_H;
    for (let [side, px, pz, ry, slot] of wallSlots(W, D)) {
      let isDoor = floor === 0 && side === 'front' && slot === opts.door,
        wall = style.plain,
        winPiece = null,
        shutter = null;
      if (
        (isDoor
          ? (wall = style.door)
          : rnd() < (side === 'front' || side === 'back' ? 0.62 : 0.45)
            ? ([wall, winPiece, shutter] = rnd() < 0.55 ? style.wide : style.thin)
            : style.alt && rnd() < 0.3 && (wall = style.alt),
        bb.put(wall, px, fy, pz, ry),
        winPiece)
      ) {
        bb.put(winPiece, px, fy, pz, ry);
        let winPos = new Vector3(0, fy + 1.8, 0.25)
          .applyAxisAngle(new Vector3(0, 1, 0), ry)
          .add(new Vector3(px, 0, pz));
        if (
          (parts.windows.push(winPos),
          shutter && rnd() < opts.shutters && bb.put(shutter, px, fy, pz, ry),
          rnd() < (opts.boxes ?? 0.3))
        ) {
          let boxOff = new Vector3(0, 0, 0.3).applyAxisAngle(new Vector3(0, 1, 0), ry);
          (bb.geo(
            boxGeo(0.95, 0.16, 0.24),
            buildingMats().darkWood,
            px + boxOff.x,
            fy + 0.86,
            pz + boxOff.z,
            ry,
          ),
            bb.put(
              rnd() < 0.5 ? 'Flower_3_Group' : 'Flower_4_Group',
              px + boxOff.x,
              fy + 1,
              pz + boxOff.z,
              ry,
              { s: 0.55 },
            ));
        }
      }
      (isDoor && (parts.doorLocal = { x: px, y: fy, z: pz, ry }),
        floor > 0 && bb.put('Wall_BottomCover', px, fy, pz, ry),
        !isDoor &&
          rnd() < opts.vines &&
          floor === floors - 1 &&
          bb.put(
            rnd() < 0.5 ? 'Prop_Vine1' : 'Prop_Vine2',
            px + (rnd() - 0.5) * 0.6 * Math.cos(ry),
            fy + 2.75,
            pz + 0.12,
            ry,
          ));
    }
    let corner = style.corner;
    (bb.put(corner, -W / 2, fy, D / 2, 0),
      bb.put(corner, W / 2, fy, D / 2, Math.PI / 2),
      bb.put(corner, W / 2, fy, -D / 2, Math.PI),
      bb.put(corner, -W / 2, fy, -D / 2, -Math.PI / 2));
  }
  for (let fx = -W / 2 + 1; fx < W / 2; fx += WALL_W)
    for (let fz = -D / 2 + 1; fz < D / 2; fz += WALL_W) bb.put('Floor_WoodDark', fx, 0.03, fz, 0);
  if (opts.curb !== !1) {
    for (let [, bx, bz, bry] of wallSlots(W, D))
      bb.put('Prop_ExteriorBorder_Straight1', bx, -0.04, bz, bry, { sz: 0.55 });
    (bb.put('Prop_ExteriorBorder_Corner', -W / 2, -0.04, D / 2, 0, { sz: 0.55, sx: 0.55 }),
      bb.put('Prop_ExteriorBorder_Corner', W / 2, -0.04, D / 2, Math.PI / 2, { sz: 0.55, sx: 0.55 }),
      bb.put('Prop_ExteriorBorder_Corner', W / 2, -0.04, -D / 2, Math.PI, { sz: 0.55, sx: 0.55 }),
      bb.put('Prop_ExteriorBorder_Corner', -W / 2, -0.04, -D / 2, -Math.PI / 2, { sz: 0.55, sx: 0.55 }));
  }
  let top = floors * FLOOR_H;
  return ((parts.top = top), buildRoof(bb, W, D, top, opts, parts), parts);
}
/** Tejado de tejas a dos aguas con hastiales, chimenea y buhardilla opcionales. */
function buildRoof(bb, W, D, baseY, opts, parts) {
  let alongZ = W <= D,
    span = alongZ ? W : D,
    length = alongZ ? D : W,
    roofLen = (ROOF_LENGTHS[span] || ROOF_LENGTHS[4]).reduce((best, len) =>
      Math.abs(len - length) < Math.abs(best - length) ? len : best,
    ),
    roofPiece = `Roof_RoundTiles_${span}x${roofLen}`,
    ry = alongZ ? 0 : Math.PI / 2,
    stretch = length / roofLen;
  bb.put(roofPiece, 0, baseY, 0, ry, { roof: !0, sz: stretch });
  let gable = `Roof_Front_Brick${span}`;
  alongZ
    ? (bb.put(gable, 0, baseY, D / 2, 0, { roof: !0 }),
      bb.put(gable, 0, baseY, -D / 2, Math.PI, { roof: !0 }))
    : (bb.put(gable, W / 2, baseY, 0, Math.PI / 2, { roof: !0 }),
      bb.put(gable, -W / 2, baseY, 0, -Math.PI / 2, { roof: !0 }));
  let box = pieceBounds(roofPiece),
    roofH = box.max.y,
    roofHalfW = box.max.x;
  if (((parts.roofTop = baseY + roofH), opts.chimney)) {
    let inset = span / 2 - 0.9,
      chimneyS = (roofH * (1 - inset / roofHalfW) + 1.3 + 0.5) / 3.18,
      sideSign = opts.rnd() < 0.5 ? -1 : 1,
      along = (length / 2 - 1.1) * (opts.rnd() < 0.5 ? -1 : 1),
      cx = alongZ ? inset * sideSign : along,
      cz = alongZ ? along : inset * sideSign;
    (bb.put('Prop_Chimney', cx, baseY - 0.5, cz, 0, { roof: !0, sy: chimneyS, s: 0.9 }),
      (parts.chimneyTop = new Vector3(cx, baseY - 0.5 + 3.18 * chimneyS + 0.1, cz)));
  }
  opts.dormer &&
    span >= 6 &&
    bb.put(
      'Roof_Dormer_RoundTile',
      alongZ ? -span / 2 + 0.6 : 0,
      baseY + 0.6,
      alongZ ? 0 : span / 2 - 0.6,
      alongZ ? -Math.PI / 2 : 0,
      {
        roof: !0,
      },
    );
}
/** Caja w×h×d apoyada en y. */
function boxGeo(w, h, d, y = 0) {
  let geo = new BoxGeometry(w, h, d);
  return (geo.translate(0, y + h / 2, 0), geo);
}
/** Materiales sencillos compartidos (madera, lona, piedra, hierro, latón, brasas, heno, agua). */
function buildingMats() {
  return (
    matsCache ||
    ((matsCache = {
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
    matsCache)
  );
}
/** Funde un grupo en una sola malla de colores de vértice (aspas, rueda) para girarla entera. */
function bakeSpinner(root) {
  root.updateMatrixWorld(!0);
  let geos = [];
  root.traverse((node) => {
    if (!node.isMesh) return;
    let geo = (node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone()).applyMatrix4(
      node.matrixWorld,
    );
    for (let name of Object.keys(geo.attributes))
      ['position', 'normal'].includes(name) || geo.deleteAttribute(name);
    let count = geo.getAttribute('position').count,
      colors = new Float32Array(count * 3);
    for (let k = 0; k < count; k++)
      colors.set([node.material.color.r, node.material.color.g, node.material.color.b], k * 3);
    (geo.setAttribute('color', new BufferAttribute(colors, 3)), geos.push(geo));
  });
  let merged = mergeGeometries(geos, !1),
    material = worldMaterial(
      new MeshStandardMaterial({ vertexColors: !0, roughness: 0.9, side: DoubleSide, name: 'giratorio' }),
      { contact: null },
    ),
    mesh = new Mesh(merged, material);
  return ((mesh.castShadow = !0), (mesh.receiveShadow = !0), mesh);
}
/** Aspas del molino de viento. */
function windmillSails() {
  let m = buildingMats(),
    group = new Group(),
    hub = new Mesh(new CylinderGeometry(0.28, 0.28, 0.5, 10).rotateX(Math.PI / 2), m.darkWood);
  group.add(hub);
  for (let k = 0; k < 4; k++) {
    let arm = new Group();
    arm.rotation.z = (k * Math.PI) / 2;
    let spar = new Mesh(new BoxGeometry(0.14, 5.2, 0.12), m.wood);
    ((spar.position.y = 2.6), arm.add(spar));
    let sail = new Mesh(new PlaneGeometry(1.15, 3.9), m.cloth);
    (sail.position.set(0.66, 3.05, 0.05), (sail.rotation.y = 0.12), arm.add(sail));
    for (let j = 0; j < 6; j++) {
      let slat = new Mesh(new BoxGeometry(1.3, 0.05, 0.05), m.wood);
      (slat.position.set(0.62, 1.2 + j * 0.72, 0.02), arm.add(slat));
    }
    let edge = new Mesh(new BoxGeometry(0.06, 3.9, 0.06), m.wood);
    (edge.position.set(1.25, 3.05, 0.03), arm.add(edge), group.add(arm));
  }
  return (
    group.traverse((node) => {
      node.isMesh && ((node.castShadow = !0), (node.receiveShadow = !0));
    }),
    group
  );
}
/** Rueda del molino de agua. */
function waterWheel(radius = 1.7, width = 0.9) {
  let m = buildingMats(),
    group = new Group();
  for (let side of [-width / 2, width / 2]) {
    let ring = new Mesh(new TorusGeometry(radius, 0.07, 6, 28).rotateY(Math.PI / 2), m.wood);
    ((ring.position.x = side), group.add(ring));
    for (let j = 0; j < 6; j++) {
      let spoke = new Mesh(new BoxGeometry(0.07, radius * 2, 0.09), m.wood);
      ((spoke.rotation.x = (j * Math.PI) / 6), (spoke.position.x = side), group.add(spoke));
    }
  }
  let axle = new Mesh(new CylinderGeometry(0.12, 0.12, width + 0.8, 8).rotateZ(Math.PI / 2), m.darkWood);
  group.add(axle);
  for (let k = 0; k < 14; k++) {
    let angle = (k / 14) * Math.PI * 2,
      paddle = new Mesh(new BoxGeometry(width + 0.1, 0.06, 0.5), m.wood);
    (paddle.position.set(0, Math.cos(angle) * (radius - 0.15), Math.sin(angle) * (radius - 0.15)),
      (paddle.rotation.x = -angle),
      group.add(paddle));
  }
  return (
    group.traverse((node) => {
      node.isMesh && ((node.castShadow = !0), (node.receiveShadow = !0));
    }),
    group
  );
}
/**
 * Crea todos los edificios del nivel sobre `ctx` (map, level, rnd, merger, ground). Devuelve la lista
 * de edificios {id, key, cells, center, ry, W, D, idx, box, top, windows, lamps, smoke, dynamic,
 * doorObj, doorLeaf, update…}; `idx` es su índice de fundido en `worldUniforms.uBld`.
 */
function buildBuildings(ctx) {
  let { map, level, rnd, merger, ground } = ctx,
    usedLots = new Set(),
    buildings = [],
    doors = new Map();
  for (let obj of level.objects || [])
    obj.type === 'door' && obj.target && doors.set(cellKey(...obj.target), obj);
  let nextIdx = 1,
    tmp = new Vector3();
  for (let prop of level.props || []) {
    if (prop.foot == null) continue;
    let lot = findLot(map, prop.cell, usedLots);
    lot && usedLots.add(lot);
    let cells = lot || [prop.cell],
      cellSet = new Set(cells.map(([col, row]) => cellKey(col, row))),
      center = new Vector3();
    for (let [col, row] of cells) center.add(cellToWorld(col, row, tmp));
    center.divideScalar(cells.length);
    let angle = degToRad(prop.rot || 0),
      door = doors.get(cellKey(...prop.cell));
    if (door) {
      let target = cellToWorld(door.cell[0], door.cell[1]);
      angle = Math.atan2(target.x - center.x, target.z - center.z);
    }
    let bld = {
        id: door?.id || `${prop.key}_${prop.cell.join('_')}`,
        key: prop.key,
        prop,
        cells,
        set: cellSet,
        center,
        ry: angle,
        idx: 0,
        smoke: [],
        windows: [],
        lamps: [],
        dynamic: [],
        doorObj: door || null,
      },
      foot = prop.foot,
      sizes =
        foot >= 2
          ? [
              [6, 6],
              [6, 4],
              [4, 6],
              [4, 4],
            ]
          : foot === 1
            ? [
                [4, 4],
                [4, 2],
              ]
            : [[2, 2]],
      fit = null;
    for (let ry of [
      angle,
      Math.round(angle / degToRad(30)) * degToRad(30),
      Math.round(angle / degToRad(60)) * degToRad(60),
    ])
      for (let [W, D] of sizes)
        if (footprintFits(cellSet, center, ry, W, D)) {
          (!fit || W * D > fit.W * fit.D) && (fit = { W, D, ry });
          break;
        }
    (fit || (fit = { W: sizes[sizes.length - 1][0], D: sizes[sizes.length - 1][1], ry: angle }),
      Object.assign(bld, fit),
      (bld.idx = prop.key === 'well' || prop.key === 'market' ? 0 : nextIdx++),
      buildBuilding(ctx, bld));
    for (let [col, row] of cells)
      (cellToWorld(col, row, tmp),
        ground.blob(LAYER.ao, tmp.x, tmp.z, 1.5, 0.5),
        ground.blob(LAYER.path, tmp.x, tmp.z, 1.4, 0.5));
    buildings.push(bld);
  }
  if (((ctx._nextBld = nextIdx), ctx.ambient === 'dusk' || ctx.ambient === 'day'))
    for (let spot of outskirtsSpots(ctx)) {
      let bld = {
        id: `afueras_${buildings.length}`,
        key: spot.key,
        prop: { smoke: !0 },
        cells: [],
        set: new Set(),
        center: spot.c,
        ry: spot.ry,
        W: spot.W,
        D: spot.D,
        idx: ctx._nextBld++,
        smoke: [],
        windows: [],
        lamps: [],
        dynamic: [],
        doorObj: null,
        outside: !0,
      };
      if (bld.idx > 62) break;
      (buildBuilding(ctx, bld),
        ctx.ground.blob(LAYER.path, spot.c.x, spot.c.z, 3.4, 0.45),
        ctx.ground.blob(LAYER.ao, spot.c.x, spot.c.z, 3.2, 0.5),
        buildings.push(bld));
    }
  return buildings;
}
/** Sitios para casas sueltas fuera del tablero, cerca de caminos y lejos del agua. */
function outskirtsSpots(ctx) {
  let { map, ground, rnd } = ctx,
    spots = [],
    minX = -HEX_SIZE * 0.5,
    maxX = map.sizeX,
    minZ = -HEX_SIZE * 0.5,
    maxZ = map.sizeZ + HEX_SIZE * 0.5,
    tries = 160;
  for (let k = 0; k < tries && spots.length < 7; k++) {
    let cx = ground.x0 + 3 + rnd() * (ground.x1 - ground.x0 - 6),
      cz = ground.z0 + 3 + rnd() * (ground.z1 - ground.z0 - 6),
      outside = Math.max(minX - cx, cx - maxX, minZ - cz, cz - maxZ);
    if (outside < 4.5 || outside > ctx.ground.margin - 3) continue;
    let nearPath = !1,
      blocked = !1;
    for (let j = 0; j < 8; j++) {
      let px = cx + Math.cos((j / 8) * Math.PI * 2) * 4.5,
        pz = cz + Math.sin((j / 8) * Math.PI * 2) * 4.5;
      (ground.maskAt(LAYER.path, px, pz) > 0.4 && (nearPath = !0),
        ground.waterAt(px, pz) > 0.02 && (blocked = !0));
    }
    for (let j = 0; j < 6; j++) {
      let px = cx + Math.cos((j / 6) * Math.PI * 2) * 2.6,
        pz = cz + Math.sin((j / 6) * Math.PI * 2) * 2.6;
      (ground.maskAt(LAYER.path, px, pz) > 0.3 || ground.waterAt(px, pz) > 0.01) && (blocked = !0);
    }
    if (
      blocked ||
      (!nearPath && rnd() < 0.75) ||
      spots.some((spot) => spot.c.distanceTo(new Vector3(cx, 0, cz)) < 9)
    )
      continue;
    let ry = Math.atan2((minX + maxX) / 2 - cx, (minZ + maxZ) / 2 - cz) + (rnd() - 0.5) * 0.6,
      long = rnd() < 0.4;
    spots.push({ key: 'house', c: new Vector3(cx, 0, cz), ry, W: 4, D: long ? 6 : 4 });
  }
  return spots;
}
/** Monta un edificio según su `key` y registra ventanas, humo, puerta, farol y caja envolvente. */
function buildBuilding(ctx, bld) {
  let { merger, rnd, ground } = ctx,
    base = composeMatrix(bld.center.x, ground.heightAt(bld.center.x, bld.center.z), bld.center.z, bld.ry);
  bld.base = base;
  let trim = new Color(TRIM_COLORS[Math.floor(rnd() * TRIM_COLORS.length)]).multiplyScalar(1.4);
  (bld.key === 'house_blue' && trim.set(6259888), bld.key === 'house_green' && trim.set(6983760));
  let bb = new BuildingBuilder(merger, base, bld.idx, { MI_WoodTrim_Wear: trim }),
    W = bld.W,
    D = bld.D,
    door = Math.floor((W / WALL_W - 1) / 2),
    parts;
  switch (bld.key) {
    case 'tavern':
      ((parts = buildHouse(bb, {
        W,
        D,
        floors: 2,
        styles: ['brick', 'upper'],
        door,
        shutters: 0.8,
        vines: 0.3,
        chimney: !0,
        dormer: !0,
        rnd,
      })),
        tavernSign(ctx, bld, bb, parts));
      break;
    case 'church':
      parts = buildChurch(bb, bld, rnd);
      break;
    case 'blacksmith':
      ((parts = buildHouse(bb, {
        W: 4,
        D: 4,
        floors: 1,
        styles: ['brick'],
        door: 0,
        shutters: 0.5,
        vines: 0.1,
        chimney: !0,
        rnd,
      })),
        buildForge(ctx, bld, bb, parts));
      break;
    case 'windmill':
      parts = buildWindmill(ctx, bld, bb);
      break;
    case 'watermill':
      ((parts = buildHouse(bb, {
        W: 4,
        D: 4,
        floors: 2,
        styles: ['brick', 'upper'],
        door: 0,
        shutters: 0.6,
        vines: 0.4,
        chimney: !1,
        rnd,
      })),
        buildWatermill(ctx, bld, bb));
      break;
    case 'mine':
      parts = buildMine(ctx, bld, bb);
      break;
    case 'grain':
      parts = buildHouse(bb, {
        W: 4,
        D: 4,
        floors: 1,
        styles: ['plaster'],
        door: 0,
        shutters: 0.2,
        vines: 0.2,
        chimney: !1,
        rnd,
      });
      for (let k = 0; k < 3; k++) hayBale(bb, 2.6 + rnd() * 0.3, 0, -1 + k * 1, rnd);
      break;
    case 'market':
      parts = buildMarket(ctx, bld, bb);
      break;
    case 'well':
      parts = buildWell(ctx, bld, bb);
      break;
    case 'ruin':
      parts = buildRuin(ctx, bld, bb);
      break;
    default: {
      let tall = W >= 6 || rnd() < 0.55;
      parts = buildHouse(bb, {
        W,
        D,
        floors: tall ? 2 : 1,
        styles: tall ? [rnd() < 0.6 ? 'brick' : 'plaster', 'upper'] : [rnd() < 0.5 ? 'plaster' : 'brick'],
        door,
        shutters: 0.75,
        vines: 0.35,
        chimney: !0,
        dormer: W >= 6,
        rnd,
      });
    }
  }
  ((bld.top = parts.roofTop ?? parts.top ?? 4),
    parts.chimneyTop &&
      bld.prop.smoke !== !1 &&
      bld.smoke.push(bb.world(parts.chimneyTop.x, parts.chimneyTop.y, parts.chimneyTop.z)));
  for (let win of parts.windows || []) bld.windows.push(bb.world(win.x, win.y, win.z));
  if (parts.doorLocal) {
    let dl = parts.doorLocal,
      doorPiece =
        bld.key === 'church'
          ? 'Door_2_Round'
          : bld.key === 'tavern'
            ? 'Door_8_Round'
            : rnd() < 0.5
              ? 'Door_1_Round'
              : 'Door_4_Flat';
    if (hasPiece(doorPiece) && !bld.doorObj) {
      let local = new Matrix4()
        .makeRotationY(dl.ry)
        .setPosition(dl.x, dl.y, dl.z)
        .multiply(new Matrix4().makeTranslation(-0.55, 0, -0.08));
      bb.merger.add(doorPiece, new Matrix4().multiplyMatrices(base, local), {
        bld: bld.idx,
        tints: bb.tints,
      });
    }
    if (hasPiece(doorPiece) && bld.doorObj) {
      let leaf = pieceMesh(doorPiece, { fade: null });
      leaf.traverse((node) => {
        node.isMesh && (node.castShadow = !1);
      });
      let pivot = new Group();
      (pivot.position.set(dl.x, dl.y, dl.z), (pivot.rotation.y = dl.ry));
      let hinge = new Group();
      (hinge.position.set(-0.55, 0, -0.08),
        hinge.add(leaf),
        pivot.add(hinge),
        pivot.applyMatrix4(base),
        (bld.doorLeaf = hinge),
        bld.dynamic.push(pivot));
    }
    if (hasPiece(doorPiece)) {
      bld.doorWorld = bb.world(dl.x, 0, dl.z + 0.6);
      let lampPos = new Vector3(dl.x + 0.95, dl.y + 2.35, dl.z + 0.3);
      hasPiece('q_lantern') &&
        rnd() < 0.85 &&
        (bb.put('q_lantern', lampPos.x, lampPos.y - 0.35, dl.z + 0.44, dl.ry),
        bld.lamps.push({
          pos: bb.world(lampPos.x, lampPos.y - 0.05, dl.z + 0.72),
          color: 16756832,
          range: 6,
          energy: 1.2,
          kind: 'wall',
        }));
    }
  }
  ((bld.parts = parts), scatterYard(ctx, bld, bb));
  let hw = bld.W / 2 + 0.8,
    hd = bld.D / 2 + 0.8,
    box = new Box3();
  for (let [cx, cz] of [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ])
    for (let cy of [0, bld.top]) box.expandByPoint(bb.world(cx, cy, cz));
  bld.box = box;
}
/** Barriles, cajas y sacos alrededor de una casa, dentro de su solar. */
function scatterYard(ctx, bld, bb) {
  let rnd = ctx.rnd;
  if (!bld.set?.size || ['market', 'well', 'mine', 'ruin'].includes(bld.key)) return;
  let props = ['q_barrel', 'q_crate', 'lumber', 'q_bucket', 'sack', 'q_farmcrate', 'q_barrel', 'stump'],
    W = bld.W,
    D = bld.D,
    placed = 0;
  for (let tries = 0; tries < 14 && placed < 4; tries++) {
    let side = Math.floor(rnd() * 4),
      along = (rnd() - 0.5) * (side < 2 ? W : D) * 0.85,
      off = 0.65 + rnd() * 0.35,
      lx = side === 0 || side === 1 ? along : side === 2 ? W / 2 + off : -W / 2 - off,
      lz = side === 0 ? D / 2 + off : side === 1 ? -D / 2 - off : along;
    if (side === 0 && Math.abs(lx) < 1.4) continue;
    let pos = bb.world(lx, 0, lz);
    if (!bld.set.has(cellKey(...worldToCell(pos.x, pos.z)))) continue;
    let piece = props[Math.floor(rnd() * props.length)];
    (bb.put(piece, lx, 0, lz, rnd() * 6.28, { s: 0.85 + rnd() * 0.25 }), placed++);
  }
}
/** Cartel colgante de la posada (dibujado en un lienzo), banco y barril. */
function tavernSign(ctx, bld, bb, parts) {
  let mats = buildingMats(),
    door = parts.doorLocal;
  if (!door) return;
  let postX = door.x - 1.45,
    beam = boxGeo(0.07, 0.07, 1.15);
  bb.geo(beam, mats.darkWood, postX, 2.95, door.z + 0.68, door.ry);
  let brace = boxGeo(0.05, 0.05, 0.75);
  (brace.rotateX(0.75), bb.geo(brace, mats.darkWood, postX, 2.62, door.z + 0.38, door.ry));
  let canvas = document.createElement('canvas');
  ((canvas.width = 256), (canvas.height = 192));
  let g2d = canvas.getContext('2d');
  ((g2d.fillStyle = '#5a3a22'),
    g2d.fillRect(0, 0, 256, 192),
    (g2d.strokeStyle = '#2e1c10'),
    (g2d.lineWidth = 10),
    g2d.strokeRect(5, 5, 246, 182),
    (g2d.fillStyle = '#e8d6b0'),
    g2d.beginPath(),
    g2d.ellipse(132, 112, 72, 34, 0, 0, Math.PI * 2),
    g2d.fill(),
    g2d.beginPath(),
    g2d.ellipse(62, 122, 28, 22, -0.3, 0, Math.PI * 2),
    g2d.fill(),
    (g2d.strokeStyle = '#e8d6b0'),
    (g2d.lineWidth = 7),
    g2d.beginPath(),
    g2d.moveTo(50, 104),
    g2d.quadraticCurveTo(36, 78, 54, 70),
    g2d.moveTo(70, 102),
    g2d.quadraticCurveTo(80, 76, 96, 78),
    g2d.stroke(),
    (g2d.fillStyle = '#2e1c10'),
    (g2d.font = 'bold 22px Georgia, serif'),
    (g2d.textAlign = 'center'),
    g2d.fillText('ZZZ', 196, 62));
  let tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  let sign = new Mesh(
    new PlaneGeometry(0.85, 0.64),
    worldMaterial(
      new MeshStandardMaterial({ map: tex, roughness: 0.8, side: DoubleSide, name: 'cartel_posada' }),
      {
        contact: null,
      },
    ),
  );
  (sign.position.copy(bb.world(postX, 2.45, door.z + 1.12)),
    (sign.rotation.y = bld.ry + door.ry + Math.PI / 2),
    (sign.castShadow = !0),
    bld.dynamic.push(sign),
    bb.put('q_bench', door.x + 2, 0, door.z + 0.9, door.ry),
    bb.put('q_barrel', door.x - 2.2, 0, door.z + 0.7, door.ry));
}
/** Iglesia: nave de dos plantas, torre y reloj. */
function buildChurch(bb, bld, rnd) {
  let W = Math.min(bld.W, 6),
    D = Math.max(Math.min(bld.D, 6), 4),
    parts = buildHouse(bb, {
      W,
      D,
      floors: 2,
      styles: ['brick', 'brick'],
      door: Math.floor((W / WALL_W - 1) / 2),
      shutters: 0,
      vines: 0.25,
      chimney: !1,
      rnd: () => rnd() * 0.9 + 0.05,
    }),
    tx = -W / 2 - 0.2,
    tz = D / 2 - 0.6;
  for (let floor = 0; floor < 3; floor++) {
    let fy = floor * FLOOR_H;
    for (let [px, pz, ry] of [
      [tx, tz + 1, 0],
      [tx + 1, tz, Math.PI / 2],
      [tx, tz - 1, Math.PI],
      [tx - 1, tz, -Math.PI / 2],
    ])
      (bb.put(
        floor === 2 ? 'Wall_UnevenBrick_Window_Thin_Round' : 'Wall_UnevenBrick_Straight',
        px,
        fy,
        pz,
        ry,
        {
          sx: 1,
        },
      ),
        floor === 2 && bb.put('Window_Thin_Round1', px, fy, pz, ry));
    (bb.put('Corner_Exterior_Brick', tx - 1, fy, tz + 1, 0),
      bb.put('Corner_Exterior_Brick', tx + 1, fy, tz + 1, Math.PI / 2),
      bb.put('Corner_Exterior_Brick', tx + 1, fy, tz - 1, Math.PI),
      bb.put('Corner_Exterior_Brick', tx - 1, fy, tz - 1, -Math.PI / 2));
  }
  bb.put('Roof_Tower_RoundTiles', tx, 3 * FLOOR_H, tz, 0, { roof: !0, s: 0.48 });
  let mats = buildingMats(),
    dial = new CylinderGeometry(0.55, 0.55, 0.06, 24).rotateX(Math.PI / 2);
  bb.geo(dial, mats.brass, 0, 2 * FLOOR_H + 1, D / 2 + 0.35, 0, { roof: !0 });
  for (let k = 0; k < 12; k++) {
    let tick = boxGeo(0.06, 0.32, 0.04)
      .clone()
      .translate(0, 0.62, 0)
      .rotateZ((k / 12) * Math.PI * 2);
    bb.geo(tick, mats.brass, 0, 2 * FLOOR_H + 1, D / 2 + 0.36, 0, { roof: !0 });
  }
  return ((parts.roofTop = Math.max(parts.roofTop || 0, 3 * FLOOR_H + 3.4)), parts);
}
/** Herrería: cobertizo con fragua encendida, yunque y cubo. */
function buildForge(ctx, bld, bb, parts) {
  let mats = buildingMats(),
    ox = 2;
  for (let [px, pz] of [
    [ox + 1.8, 1.4],
    [ox + 1.8, -1.4],
  ])
    bb.geo(boxGeo(0.18, 2.5, 0.18), mats.darkWood, px, 0, pz);
  (bb.geo(boxGeo(2.2, 0.12, 3.4), mats.darkWood, ox + 0.9, 2.45, 0, 0, { roof: !0 }),
    bb.put('Roof_Wooden_2x1', ox + 0.9, 2.5, -1, -Math.PI / 2, { roof: !0, s: 1.1 }),
    bb.put('Roof_Wooden_2x1', ox + 0.9, 2.5, 1, -Math.PI / 2, { roof: !0, s: 1.1 }),
    bb.geo(boxGeo(1.1, 0.8, 1.1), mats.stone, ox + 0.6, 0, -0.6));
  let coals = new CylinderGeometry(0.38, 0.42, 0.12, 12);
  (coals.translate(0, 0.86, 0),
    bb.geo(coals, mats.coal, ox + 0.6, 0, -0.6),
    bb.put('q_anvil', ox + 0.8, 0, 0.8, 0.4),
    bb.put('bucket_metal', ox + 1.4, 0, -1.3, 0));
  let firePos = bb.world(ox + 0.6, 1.2, -0.6);
  (bld.lamps.push({ pos: firePos, color: 16738848, range: 5, energy: 2, kind: 'forge' }),
    bld.smoke.push(bb.world(ox + 0.6, 2.7, -0.6)));
}
/** Molino de viento: torre de tres plantas y aspas que giran (`bld.update`). */
function buildWindmill(ctx, bld, bb) {
  let rnd = ctx.rnd,
    parts = { windows: [], doorLocal: null },
    size = 4;
  for (let floor = 0; floor < 3; floor++) {
    let style = WALL_STYLES[floor < 2 ? 'brick' : 'upper'],
      fy = floor * FLOOR_H;
    for (let [side, px, pz, ry, slot] of wallSlots(size, size)) {
      let isDoor = floor === 0 && side === 'front' && slot === 0,
        wall = isDoor ? style.door : style.plain;
      if (!isDoor && floor > 0 && rnd() < 0.5) {
        let [wallPiece, winPiece] = style.thin;
        ((wall = wallPiece), bb.put(winPiece, px, fy, pz, ry));
      }
      (bb.put(wall, px, fy, pz, ry), isDoor && (parts.doorLocal = { x: px, y: fy, z: pz, ry }));
    }
    (bb.put(style.corner, -2, fy, 2, 0),
      bb.put(style.corner, 2, fy, 2, Math.PI / 2),
      bb.put(style.corner, 2, fy, -2, Math.PI),
      bb.put(style.corner, -2, fy, -2, -Math.PI / 2));
  }
  (bb.put('Roof_Tower_RoundTiles', 0, 3 * FLOOR_H, 0, 0, { roof: !0, s: 0.82 }),
    (parts.top = 3 * FLOOR_H),
    (parts.roofTop = 3 * FLOOR_H + 5.8));
  let sails = bakeSpinner(windmillSails()),
    hub = new Group();
  return (
    hub.position.set(0, 3 * FLOOR_H - 0.2, size / 2 + 0.45),
    hub.add(sails),
    hub.applyMatrix4(bld.base),
    bld.dynamic.push(hub),
    (bld.update = (dt) => {
      sails.rotation.z -= dt * 0.35;
    }),
    parts
  );
}
/** Molino de agua: la rueda va del lado con más agua y gira (`bld.update`). */
function buildWatermill(ctx, bld, bb) {
  let { ground } = ctx,
    side = 1,
    best = -1;
  for (let dir of [1, -1]) {
    let pos = bb.world(dir * 3, 0, 0),
      wet =
        ground.waterAt(pos.x, pos.z) +
        ground.waterAt(bb.world(dir * 4.2, 0, 0).x, bb.world(dir * 4.2, 0, 0).z);
    wet > best && ((best = wet), (side = dir));
  }
  let wheel = bakeSpinner(waterWheel(1.75, 0.9)),
    hub = new Group();
  (hub.position.set(side * 2.75, 1.25, 0), hub.add(wheel), hub.applyMatrix4(bld.base), bld.dynamic.push(hub));
  let mats = buildingMats();
  (bb.geo(boxGeo(0.25, 1.5, 0.25), mats.darkWood, side * 2.4, 0, 0.7),
    bb.geo(boxGeo(0.25, 1.5, 0.25), mats.darkWood, side * 2.4, 0, -0.7),
    (bld.update = (dt) => {
      wheel.rotation.x += dt * 0.6 * -side;
    }));
}
/** Entrada de mina con rocas, vigas, raíles y farol. */
function buildMine(ctx, bld, bb) {
  let rnd = ctx.rnd,
    mats = buildingMats(),
    rocks = ['Rock_Medium_1', 'Rock_Medium_2', 'Rock_Medium_3'],
    spots = [
      [-2.2, -1.2, 3.2],
      [2.2, -1, 3],
      [0, -2.4, 3.6],
      [-2.8, 1, 2.2],
      [2.9, 1.2, 2.3],
      [-1.2, -0.2, 2.8],
      [1.3, 0, 2.6],
      [0, -0.8, 3],
    ];
  for (let [px, pz, scale] of spots)
    bb.put(rnd.pick ? rnd.pick(rocks) : rocks[Math.floor(rnd() * 3)], px, -0.3, pz, rnd() * 6.28, {
      s: scale * 0.95,
      roof: !0,
    });
  bb.geo(boxGeo(1.6, 2.1, 0.2), mats.dark, 0, 0, 0.9);
  for (let px of [-0.95, 0.95]) bb.geo(boxGeo(0.24, 2.3, 0.24), mats.darkWood, px, 0, 1.15);
  bb.geo(boxGeo(2.3, 0.26, 0.3), mats.darkWood, 0, 2.2, 1.15);
  for (let k = 0; k < 6; k++) bb.geo(boxGeo(0.9, 0.06, 0.14), mats.darkWood, 0, 0.02, 1.4 + k * 0.45);
  for (let px of [-0.35, 0.35]) bb.geo(boxGeo(0.05, 0.06, 2.8), mats.iron, px, 0.06, 2.4);
  return (
    bb.put('q_pickaxe', 1.4, 0, 1.8, 0.6),
    bb.put('crate_open', -1.5, 0, 2, 0.3),
    bb.put('q_lantern', 1.15, 1.5, 1.4, 0),
    bld.lamps.push({ pos: bb.world(1.15, 1.7, 1.5), color: 16752720, range: 5, energy: 1.1, kind: 'wall' }),
    { top: 3, roofTop: 4.5, windows: [] }
  );
}
/** Bala de heno cilíndrica. */
function hayBale(bb, x, y, z, rnd) {
  let mats = buildingMats(),
    geo = new CylinderGeometry(0.42, 0.42, 0.9, 12).rotateZ(Math.PI / 2).translate(0, 0.42, 0);
  bb.geo(geo, mats.hay, x, y, z, rnd() * 0.6);
}
/** Puesto de mercado con carro y cajas de fruta. */
function buildMarket(ctx, bld, bb) {
  let rnd = ctx.rnd;
  return (
    bb.put('q_stall', -1.3, 0, 0, 0),
    bb.put('q_stall_cart', 1.6, 0, 0.3, -0.3),
    bb.put('q_farmcrate_apple', -1, 0, 1.4, 0.2),
    bb.put('q_farmcrate_carrot', -2, 0, 1.3, -0.3),
    bb.put('q_barrel_apples', 0.4, 0, 1.6, 0),
    bb.put('sack', 2.6, 0, 1.4, rnd() * 6),
    { top: 2.5, roofTop: 3, windows: [] }
  );
}
/** Pozo de piedra con tejadillo y cubo. */
function buildWell(ctx, bld, bb) {
  let mats = buildingMats(),
    wall = new CylinderGeometry(0.85, 0.92, 0.85, 16, 1, !0);
  wall.translate(0, 0.42, 0);
  let stone = new MeshStandardMaterial({
    color: 12102552,
    roughness: 0.95,
    side: DoubleSide,
    name: 'piedra_pozo',
  });
  bb.geo(wall, stone, 0, 0, 0);
  let rim = new TorusGeometry(0.88, 0.1, 6, 18).rotateX(Math.PI / 2).translate(0, 0.86, 0);
  bb.geo(rim, stone, 0, 0, 0);
  let water = new CircleGeometry(0.8, 16).rotateX(-Math.PI / 2).translate(0, 0.35, 0);
  bb.geo(water, mats.water, 0, 0, 0);
  for (let px of [-0.8, 0.8]) bb.geo(boxGeo(0.14, 2.1, 0.14), mats.darkWood, px, 0, 0);
  return (
    bb.geo(
      new CylinderGeometry(0.07, 0.07, 1.8, 8).rotateZ(Math.PI / 2).translate(0, 1.75, 0),
      mats.darkWood,
      0,
      0,
      0,
    ),
    bb.put('Roof_Wooden_2x1', 0, 2, -0.55, 0, { roof: !0, s: 0.72 }),
    bb.put('Roof_Wooden_2x1', 0, 2, 0.55, Math.PI, { roof: !0, s: 0.72 }),
    bb.put('q_bucket', 0.6, 0.88, 0.2, 0),
    { top: 2.2, roofTop: 2.9, windows: [] }
  );
}
/** Casa en ruinas: muros incompletos a distintas alturas y ladrillos sueltos. */
function buildRuin(ctx, bld, bb) {
  let rnd = ctx.rnd,
    W = 4,
    D = 6;
  for (let [side, px, pz, ry] of wallSlots(W, D)) {
    if (rnd() < 0.25) continue;
    let piece =
      side === 'front'
        ? 'Wall_UnevenBrick_Door_Round'
        : rnd() < 0.5
          ? 'Wall_UnevenBrick_Window_Thin_Round'
          : 'Wall_UnevenBrick_Straight';
    bb.put(piece, px, -0.2 - rnd() * 0.6, pz, ry + (rnd() - 0.5) * 0.05, { sy: 0.45 + rnd() * 0.5 });
  }
  for (let k = 0; k < 6; k++)
    bb.put(`Prop_Brick${1 + Math.floor(rnd() * 4)}`, (rnd() - 0.5) * 6, 0, (rnd() - 0.5) * 7, rnd() * 6.28);
  return { top: 3, roofTop: 3, windows: [] };
}
/** Ancho de un tramo de muro (m) y alto de una planta (m). */
const WALL_W = 2;
const FLOOR_H = 3;
/** Largos de tejado disponibles en el kit para cada luz. */
const ROOF_LENGTHS = { 4: [4, 6, 8], 6: [6, 8, 10], 8: [8, 10] };
/** Colores de las maderas de las fachadas (se elige uno por edificio). */
const TRIM_COLORS = [8010282, 4151930, 5139002, 9071162, 5982826, 6959152];
/**
 * Ayudante para colocar piezas (`put`) o geometría suelta (`geo`) en coordenadas locales de un
 * edificio y enviarlas al `MeshMerger` con su índice de fundido; `world()` pasa a coordenadas del mundo.
 */
const BuildingBuilder = class {
  constructor(merger, base, bld, tints) {
    ((this.merger = merger),
      (this.base = base),
      (this.bld = bld),
      (this.tints = tints),
      (this.m = new Matrix4()),
      (this.l = new Matrix4()));
  }
  put(name, x, y, z, ry = 0, { roof = !1, s: scale = 1, sx = null, sy = null, sz = null } = {}) {
    if (!hasPiece(name)) return;
    let scl = new Vector3(sx ?? scale, sy ?? scale, sz ?? scale);
    (composeMatrix(x, y, z, ry, scl, this.l),
      this.m.multiplyMatrices(this.base, this.l),
      this.merger.add(name, this.m, { bld: this.bld, roof, tints: this.tints }));
  }
  geo(geo, mat, x, y, z, ry = 0, { roof = !1, s: scale = 1 } = {}) {
    (composeMatrix(x, y, z, ry, scale, this.l),
      this.m.multiplyMatrices(this.base, this.l),
      this.merger.addGeometry(geo, mat, this.m, { bld: this.bld, roof }));
  }
  world(x, y, z, out = new Vector3()) {
    return out.set(x, y, z).applyMatrix4(this.base);
  }
};
/** Piezas de muro por estilo: liso, ventana ancha/estrecha [muro, ventana, contraventana], puerta, esquina. */
const WALL_STYLES = {
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
let matsCache = null;

export { buildBuildings };
