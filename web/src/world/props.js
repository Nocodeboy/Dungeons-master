// world/props.js — atrezo del nivel: `level.props` sin planta de edificio y `level.decor` (piezas del
// kit, cultivos instanciados, piezas de Poly Haven «ph:…», especiales como hoguera, telaraña,
// tendedero, huevos o pasaderas), atrezo por casilla del mapa («c» cajas, «r» rocas, «x» escombros,
// «o»/«O» objetos sueltos, «P» columnas, «g» tumbas, «f» vallas, «S» estatua del toro), puentes,
// santuario y ruinas sueltas. Casi todo se funde en la vista estática del `MeshMerger`.
// Reconstruido de publicado/juego.js (módulo __esm «Q3»). Lo usa index.js.

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

/** Pieza del kit y escala de una clave de atrezo ([pieza, escala]), según `PROP_PIECES`. */
function resolvePiece(key) {
  return PROP_PIECES[key] ? PROP_PIECES[key] : [key, 1];
}
/**
 * Coloca todo el atrezo del nivel sobre `ctx` (scene, map, level, ground, rnd, ambient, static).
 * Deja la estatua en `ctx.statue` y devuelve `{dynamic}` (objetos sueltos añadidos a la escena).
 */
async function buildProps(ctx) {
  let { scene, map, level, ground, rnd, ambient } = ctx,
    merger = ctx.static,
    isCrypt = ambient === 'crypt',
    pos = new Vector3(),
    batches = new Map();
  ctx.webs = [];
  let queue = (key, matrix) => {
      (batches.has(key) || batches.set(key, []), batches.get(key).push(matrix));
    },
    place = (key, px, pz, ry = 0, scale = 1, atY = null) => {
      let [piece, factor] = resolvePiece(key);
      if (!hasPiece(piece)) return !1;
      let py = atY ?? ground.heightAt(px, pz),
        scl = Array.isArray(scale)
          ? new Vector3(scale[0] * factor, scale[1] * factor, scale[2] * factor)
          : scale * factor;
      return (merger.add(piece, composeMatrix(px, py, pz, ry, scl)), !0);
    };
  for (let prop of level.props || []) {
    if (prop.foot != null) continue;
    cellToWorld(prop.cell[0], prop.cell[1], pos);
    let px = pos.x + (prop.offset ? prop.offset[0] * HEX_SIZE : 0),
      pz = pos.z + (prop.offset ? prop.offset[1] * HEX_SIZE : 0),
      ry = degToRad(prop.rot || 0);
    if (prop.key === 'footbridge') {
      buildFootbridge(ctx, px, pz, ry, (prop.length || 2.8) * HEX_SIZE, (prop.width || 1.15) * HEX_SIZE);
      continue;
    }
    if (prop.key === 'shrine') {
      buildShrine(ctx, px, pz, ry, prop.scale || 1);
      continue;
    }
    if (prop.key === 'ruin') {
      buildRuinWalls(ctx, px, pz, ry, prop.scale || 1);
      continue;
    }
    (CROPS.has(prop.key)
      ? queue(prop.key, composeMatrix(px, ground.heightAt(px, pz), pz, ry, prop.scale || 1))
      : place(prop.key, px, pz, ry, prop.scale || 1),
      ground.blob(LAYER.ao, px, pz, 0.9, 0.35));
  }
  for (let item of level.decor || []) {
    cellToWorld(item.cell[0], item.cell[1], pos);
    let px = pos.x + (item.offset ? item.offset[0] * HEX_SIZE : 0),
      pz = pos.z + (item.offset ? item.offset[1] * HEX_SIZE : 0),
      ry = degToRad(item.rot ?? rnd() * 360);
    if (item.key === 'wheat_patch') {
      for (let wi = 0; wi < 4; wi++)
        for (let wj = 0; wj < 4; wj++) {
          let wx = pos.x - 0.6 + wi * 0.4 + (rnd() - 0.5) * 0.12,
            wz = pos.z - 0.55 + wj * 0.37 + (rnd() - 0.5) * 0.12;
          queue('wheat', composeMatrix(wx, ground.heightAt(wx, wz), wz, rnd() * 6.28, 0.55 + rnd() * 0.25));
        }
      continue;
    }
    if (D1.has(item.key) || decorSpecial(ctx, item, px, pz, ry, queue)) continue;
    if (item.key.startsWith('ph:')) {
      try {
        let model = fixGlass(await loadProp(item.key.slice(3)));
        (model.position.set(px, ground.heightAt(px, pz) + (item.y || 0), pz),
          (model.rotation.y = ry),
          model.scale.setScalar(item.scale || 1),
          scene.add(model),
          ground.blob(LAYER.ao, px, pz, 0.8, 0.4));
      } catch (err) {
        console.warn('[mundo] pieza de Poly Haven', item.key, err);
      }
      continue;
    }
    let onTop = item.on ? pieceBounds(resolvePiece(item.on)[0]).max.y * (item.onScale ?? 1) : null,
      baseY =
        item.y != null
          ? ground.heightAt(px, pz) + item.y
          : onTop != null
            ? ground.heightAt(px, pz) + onTop
            : null;
    CROPS.has(item.key)
      ? queue(
          item.key,
          composeMatrix(px, ground.heightAt(px, pz), pz, ry, (item.scale || 1) * (0.9 + rnd() * 0.2)),
        )
      : place(item.key, px, pz, ry, item.scale || 1, baseY);
  }
  if (ctx.webs.length) {
    let web = new Mesh(mergeGeometries(ctx.webs), webMaterial());
    ((web.name = 'telaranas'), (web.renderOrder = 3), scene.add(web));
    for (let geo of ctx.webs) geo.dispose();
  }
  let occupied = new Set();
  for (let entry of [
    ...(level.props || []),
    ...(level.decor || []),
    ...(level.objects || []).filter((obj) => obj.type && obj.type !== 'npc' && obj.type !== 'inspect'),
  ])
    entry.cell && occupied.add(cellKey(entry.cell[0], entry.cell[1]));
  let fenceCells = [],
    statueCells = [];
  (map.each((col, row, ch) => {
    cellToWorld(col, row, pos);
    let jx = pos.x + (rnd() - 0.5) * 0.25,
      jz = pos.z + (rnd() - 0.5) * 0.25;
    switch (ch) {
      case 'c':
        if (ambient === 'inn') break;
        (isCrypt
          ? place(rnd() < 0.5 ? 'barrel_d' : 'box_stacked', jx, jz, rnd() * 6.28, 1)
          : (place(
              rnd() < 0.5 ? 'crate' : 'q_crate',
              jx - 0.2,
              jz - 0.1,
              rnd() * 0.6 + (rnd() < 0.5 ? 0 : Math.PI / 2),
              1,
            ),
            place(rnd() < 0.5 ? 'q_barrel' : 'barrel', jx + 0.45, jz + 0.35, rnd() * 6.28, 1),
            rnd() < 0.5 && place('sack', jx - 0.4, jz + 0.45, rnd() * 6.28, 0.9)),
          ground.blob(LAYER.ao, pos.x, pos.z, 1, 0.45));
        break;
      case 'r': {
        let rock = ['Rock_Medium_1', 'Rock_Medium_2', 'Rock_Medium_3'][Math.floor(rnd() * 3)];
        place(rock, jx, jz, rnd() * 6.28, 0.8 + rnd() * 0.35, ground.heightAt(jx, jz) - 0.12);
        for (let j = 0; j < 3; j++) {
          let qx = pos.x + (rnd() - 0.5) * 1.3,
            qz = pos.z + (rnd() - 0.5) * 1.3;
          queue(
            rnd() < 0.5 ? 'Pebble_Round_2' : 'Pebble_Square_1',
            composeMatrix(qx, ground.heightAt(qx, qz), qz, rnd() * 6.28, 1 + rnd() * 1.5),
          );
        }
        break;
      }
      case 'x':
        if (isCrypt)
          (place('rubble', jx, jz, rnd() * 6.28, 0.7 + rnd() * 0.3),
            rnd() < 0.5 &&
              place(
                rnd() < 0.5 ? 'skull' : rnd() < 0.5 ? 'bones' : 'ribcage',
                pos.x + (rnd() - 0.5) * 0.8,
                pos.z + (rnd() - 0.5) * 0.8,
                rnd() * 6.28,
                1,
              ));
        else {
          for (let j = 0; j < 4; j++)
            place(
              `Prop_Brick${1 + Math.floor(rnd() * 4)}`,
              pos.x + (rnd() - 0.5) * 1.1,
              pos.z + (rnd() - 0.5) * 1.1,
              rnd() * 6.28,
              1.2 + rnd() * 0.8,
            );
          place(
            ['Rock_Medium_2', 'Rock_Medium_3'][Math.floor(rnd() * 2)],
            jx,
            jz,
            rnd() * 6.28,
            0.45 + rnd() * 0.2,
            ground.heightAt(jx, jz) - 0.15,
          );
        }
        break;
      case 'o':
        if (occupied.has(cellKey(col, row)) || ambient === 'inn') break;
        (smallProp(ctx, place, queue, pos, ambient), ground.blob(LAYER.ao, pos.x, pos.z, 0.8, 0.35));
        break;
      case 'O':
        if (occupied.has(cellKey(col, row)) || ambient === 'inn') break;
        (bigProp(ctx, place, pos, ambient), ground.blob(LAYER.ao, pos.x, pos.z, 1, 0.4));
        break;
      case 'P':
        isCrypt
          ? place(
              rnd() < 0.5 ? 'pillar_deco' : 'pillar',
              pos.x,
              pos.z,
              (Math.floor(rnd() * 4) * Math.PI) / 2,
              0.92,
            )
          : brokenColumn(ctx, place, pos);
        break;
      case 'g':
        if (isCrypt) {
          let vertical = map.tile(col + 1, row) === 'g' || rnd() < 0.5;
          place('coffin', pos.x, pos.z, vertical ? Math.PI / 2 : 0, 0.75);
        } else place(rnd() < 0.5 ? 'gravestone' : 'gravemarker', jx, jz, (rnd() - 0.5) * 0.4, 1);
        break;
      case 'f':
        fenceCells.push([col, row]);
        break;
      case '=':
      case '.':
        if (ambient === 'kesh' && ch === '=') {
          let mats = stoneMats();
          for (let [nc, nr] of neighbors(col, row)) {
            let nch = map.tile(nc, nr);
            if (nch !== 'w' && nch !== '~') continue;
            let npos = cellToWorld(nc, nr),
              dx = npos.x - pos.x,
              dz = npos.z - pos.z,
              bx = pos.x + dx * 0.45,
              bz = pos.z + dz * 0.45,
              block = blockGeometry(0.95, 0.42 + rnd() * 0.3, 0.38, 1.4);
            (block.translate(0, 0.2, 0),
              merger.addGeometry(
                block,
                mats.blocks,
                composeMatrix(
                  bx,
                  ground.heightAt(bx, bz) - 0.05,
                  bz,
                  Math.atan2(dx, dz) + (rnd() - 0.5) * 0.1,
                ),
                { contactH: 0.25, contactMin: 0.75 },
              ));
          }
        }
        if (isCrypt && rnd() < 0.09 && neighbors(col, row).some(([nc, nr]) => map.tile(nc, nr) === '#')) {
          let piece =
            rnd() < 0.3
              ? 'skull'
              : rnd() < 0.5
                ? 'bones'
                : rnd() < 0.6
                  ? 'candle_lit'
                  : rnd() < 0.8
                    ? 'q_vase_s'
                    : 'q_vase_rubble';
          place(piece, jx, jz, rnd() * 6.28, piece === 'candle_lit' ? 0.25 : 1);
        }
        break;
      case 'S':
        statueCells.push([col, row]);
        break;
      default:
    }
  }),
    fenceCells.length && buildFences(ctx, fenceCells, level.fence || 'q_fence'));
  let dynamic = [];
  if (statueCells.length) {
    let statue = await buildStatue(ctx, statueCells, ambient === 'kesh' || level.statue === 'fallen');
    statue && dynamic.push(statue);
  }
  for (let [key, list] of batches) {
    let [piece] = resolvePiece(key);
    if (hasPiece(piece))
      for (let matrix of list)
        merger.add(piece, matrix, { cast: key === 'pumpkin' || key === 'wheat' || key === 'corn' });
  }
  return { dynamic };
}
/** Decorados construidos a mano (hoguera, telaraña, tendedero, huevos, pasadera); true si lo era. */
function decorSpecial(ctx, item, px, pz, ry, queue) {
  let { ground, fx } = ctx,
    merger = ctx.static,
    rnd = ctx.rnd,
    gy = ground.heightAt(px, pz);
  switch (item.key) {
    case 'fire_pit': {
      let mats = stoneMats();
      for (let j = 0; j < 9; j++) {
        let angle = (j / 9) * Math.PI * 2,
          stone = new DodecahedronGeometry(0.16, 0);
        (stone.scale(1.25, 0.75, 1),
          merger.addGeometry(
            stone,
            mats.stone,
            composeMatrix(px + Math.cos(angle) * 0.55, gy + 0.08, pz + Math.sin(angle) * 0.55, rnd() * 6),
          ));
      }
      for (let j = 0; j < 4; j++) {
        let log = new CylinderGeometry(0.06, 0.07, 0.8, 7).rotateZ(Math.PI / 2 - 0.25);
        merger.addGeometry(log, mats.darkPlank, composeMatrix(px, gy + 0.13, pz, (j * Math.PI) / 4));
      }
      let firePos = new Vector3(px, gy + 0.15, pz);
      return (
        fx.flames.push({ pos: firePos, scale: 1.2 }),
        fx.addLamp({
          pos: firePos.clone().add(new Vector3(0, 0.7, 0)),
          color: 16747060,
          range: 7,
          energy: 1.5,
          kind: 'fire',
          haloSize: 2.2,
          haloAlpha: 0.55,
        }),
        ground.blob(LAYER.ao, px, pz, 0.9, 0.6),
        ground.blob(LAYER.light, px, pz, 3, 0.9),
        !0
      );
    }
    case 'web': {
      let size = (item.scale || 1) * 1.6,
        obj = new Object3D();
      return (
        obj.position.set(px, gy + size * 0.42, pz),
        obj.rotation.set(-0.35 - rnd() * 0.5, ry, (rnd() - 0.5) * 0.4),
        obj.updateMatrix(),
        ctx.webs.push(new PlaneGeometry(size, size).applyMatrix4(obj.matrix)),
        obj.position.set(px + (rnd() - 0.5) * 0.4, gy + 0.03, pz + (rnd() - 0.5) * 0.4),
        obj.rotation.set(0, rnd() * 6, 0),
        obj.updateMatrix(),
        ctx.webs.push(new CircleGeometry(size * 0.55, 10).rotateX(-Math.PI / 2).applyMatrix4(obj.matrix)),
        ground.blob(LAYER.ao, px, pz, 1, 0.35),
        !0
      );
    }
    case 'clothesline': {
      let mat = new MeshStandardMaterial({ color: 6966838, roughness: 0.9 }),
        half = (item.length || 2) * HEX_SIZE * 0.5,
        at = (along, up, side) =>
          composeMatrix(
            px + Math.cos(ry) * along + Math.sin(ry) * side,
            gy + up,
            pz - Math.sin(ry) * along + Math.cos(ry) * side,
            ry,
          );
      for (let end of [-half, half]) {
        let post = new CylinderGeometry(0.045, 0.06, 1.95, 6).translate(0, 0.97, 0);
        (merger.addGeometry(post, mat, at(end, 0, 0)),
          merger.addGeometry(new BoxGeometry(0.06, 0.06, 0.36).translate(0, 1.84, 0), mat, at(end, 0, 0)));
      }
      let sag = (t) => 1.84 - Math.sin(t * Math.PI) * 0.16,
        pts = [];
      for (let j = 0; j <= 10; j++) pts.push(new Vector3(-half + (2 * half * j) / 10, sag(j / 10), 0));
      let rope = new TubeGeometry(new CatmullRomCurve3(pts), 16, 0.011, 4),
        ropeMat = new MeshStandardMaterial({ color: 13153420, roughness: 0.9 });
      merger.addGeometry(rope, ropeMat, at(0, 0, 0));
      let colors = [15327952, 14209728, 9413560, 13214302, 11032394, 14998731, 8228714],
        pos = 0.08 + rnd() * 0.06;
      for (; pos < 0.9;) {
        let clothW = 0.32 + rnd() * 0.34,
          clothH = 0.38 + rnd() * 0.36,
          mid = Math.min(0.95, pos + clothW / (4 * half)),
          hangY = sag(mid) - 0.01,
          cloth = new BoxGeometry(clothW, clothH, 0.012, 2, 3, 1),
          attr = cloth.getAttribute('position');
        for (let j = 0; j < attr.count; j++)
          attr.setZ(
            j,
            attr.getZ(j) +
              Math.sin((attr.getY(j) / clothH + 0.5) * Math.PI) * 0.035 * (0.5 - attr.getY(j) / clothH),
          );
        (cloth.computeVertexNormals(), cloth.translate(0, -clothH / 2, 0));
        let clothMat = new MeshStandardMaterial({
          color: colors[Math.floor(rnd() * colors.length)],
          roughness: 0.95,
        });
        (merger.addGeometry(cloth, clothMat, at(-half + 2 * half * mid, hangY, 0)),
          (pos = mid + clothW / (4 * half) + 0.04 + rnd() * 0.08));
      }
      return (ground.blob(LAYER.ao, px, pz, 1.2, 0.25), !0);
    }
    case 'egg_sac': {
      let mat = eggMaterial();
      for (let j = 0; j < 4; j++) {
        let egg = new SphereGeometry(0.16 + rnd() * 0.06, 10, 8);
        (egg.scale(1, 1.3, 1),
          merger.addGeometry(
            egg,
            mat,
            composeMatrix(px + (rnd() - 0.5) * 0.4, gy + 0.16, pz + (rnd() - 0.5) * 0.4, rnd() * 6),
          ));
      }
      return !0;
    }
    case 'stepstone': {
      let piece = ['RockPath_Round_Small_1', 'RockPath_Round_Small_2', 'RockPath_Round_Small_3'][
          Math.floor(rnd() * 3)
        ],
        py = Math.max(gy, -0.2) - 0.02;
      return (
        hasPiece(piece) && merger.add(piece, composeMatrix(px, py, pz, ry, (item.scale || 1) * 1.3)),
        !0
      );
    }
    default:
      return !1;
  }
}
/** Material de telaraña con la textura dibujada en un lienzo. */
function webMaterial() {
  if (webMat) return webMat;
  let canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  let g2d = canvas.getContext('2d');
  ((g2d.strokeStyle = 'rgba(240,240,232,0.85)'), (g2d.lineWidth = 1.4));
  let mid = 128,
    count = 11,
    angles = [];
  for (let k = 0; k < count; k++) angles.push((k / count) * Math.PI * 2 + Math.random() * 0.2);
  for (let angle of angles)
    (g2d.beginPath(),
      g2d.moveTo(mid, mid),
      g2d.lineTo(mid + Math.cos(angle) * 124, mid + Math.sin(angle) * 124),
      g2d.stroke());
  g2d.lineWidth = 1;
  for (let rad = 10; rad < 120; rad += 9 + Math.random() * 3)
    (g2d.beginPath(),
      angles.forEach((ang, k) => {
        let rr = rad * (0.92 + Math.random() * 0.1),
          px = mid + Math.cos(ang) * rr,
          py = mid + Math.sin(ang) * rr;
        k === 0 ? g2d.moveTo(px, py) : g2d.lineTo(px, py);
      }),
      g2d.closePath(),
      g2d.stroke());
  let tex = new CanvasTexture(canvas);
  return (
    (tex.colorSpace = SRGBColorSpace),
    (webMat = new MeshStandardMaterial({
      map: tex,
      transparent: !0,
      alphaTest: 0.05,
      side: DoubleSide,
      roughness: 0.6,
      depthWrite: !1,
      emissive: 3158064,
    })),
    (webMat.name = 'telarana'),
    webMat
  );
}
/** Material de los huevos de araña. */
function eggMaterial() {
  return ((eggMat ??= standardMaterial({ color: 15262412, roughness: 0.5, name: 'huevos' })), eggMat);
}
/** Objeto suelto de casilla «o» según el ambiente. */
function smallProp(ctx, place, queue, pos, ambient) {
  let rnd = ctx.rnd,
    px = pos.x + (rnd() - 0.5) * 0.3,
    pz = pos.z + (rnd() - 0.5) * 0.3,
    ry = rnd() * 6.28;
  if (ambient === 'crypt')
    return place(rnd() < 0.4 ? 'q_vase_rubble' : rnd() < 0.5 ? 'candles' : 'q_vase', px, pz, ry, 1);
  if (ambient === 'forest' || ambient === 'kesh') {
    let roll = rnd();
    return roll < 0.3
      ? place('stump', px, pz, ry, 0.8 + rnd() * 0.3)
      : roll < 0.55
        ? place('Rock_Medium_3', px, pz, ry, 0.45 + rnd() * 0.2, ctx.ground.heightAt(px, pz) - 0.08)
        : roll < 0.75
          ? place('lumber', px, pz, ry, 0.7)
          : roll < 0.88
            ? place('q_crate', px, pz, ry, 0.9)
            : place('sack', px, pz, ry, 1);
  }
  let choice = rnd();
  return choice < 0.22
    ? place('q_barrel', px, pz, ry, 1)
    : choice < 0.4
      ? place('crate', px, pz, ry, 0.9)
      : choice < 0.52
        ? place('sack', px, pz, ry, 1)
        : choice < 0.64
          ? place('q_bucket', px, pz, ry, 1.2)
          : choice < 0.76
            ? place('lumber', px, pz, ry, 0.75)
            : choice < 0.88
              ? place('q_farmcrate', px, pz, ry, 1)
              : place('stump', px, pz, ry, 0.8);
}
/** Objeto grande de casilla «O» según el ambiente. */
function bigProp(ctx, place, pos, ambient) {
  let rnd = ctx.rnd,
    ry = rnd() * 6.28;
  if (ambient === 'crypt') return place('pillar', pos.x, pos.z, 0, 0.6);
  if (ambient === 'forest') {
    let roll = rnd();
    return roll < 0.4
      ? place('q_banner2', pos.x, pos.z, ry, 1)
      : roll < 0.7
        ? place('weaponrack', pos.x, pos.z, ry, 1)
        : place('dead_tree', pos.x, pos.z, ry, 0.7);
  }
  if (ambient === 'kesh') return brokenColumn(ctx, place, pos);
  let choice = rnd();
  return choice < 0.35
    ? place('q_barrel_holder', pos.x, pos.z, ry, 1)
    : choice < 0.6
      ? place('q_weaponstand', pos.x, pos.z, ry, 1)
      : choice < 0.8
        ? place('Prop_Wagon', pos.x, pos.z, ry, 0.7)
        : place('q_banner', pos.x, pos.z, ry, 1);
}
/** Columna rota de piedra con basa y, a veces, un tambor caído. */
function brokenColumn(ctx, place, pos) {
  let rnd = ctx.rnd,
    merger = ctx.static,
    mats = stoneMats(),
    height = 1.4 + rnd() * 1.8,
    y = ctx.ground.heightAt(pos.x, pos.z),
    base = scaleUv(new CylinderGeometry(0.55, 0.62, 0.35, 8), 1.2, 0.35 / 2);
  (base.translate(0, 0.17, 0),
    merger.addGeometry(base, mats.blocks, composeMatrix(pos.x, y, pos.z, rnd() * 6.28)));
  let shaft = scaleUv(new CylinderGeometry(0.36, 0.42, height, 10, 3), 1, height / 2),
    attr = shaft.getAttribute('position');
  for (let k = 0; k < attr.count; k++)
    attr.getY(k) > height / 2 - 0.01 && attr.setY(k, attr.getY(k) - Math.random() * 0.45);
  if (
    (shaft.computeVertexNormals(),
    shaft.translate(0, height / 2 + 0.35, 0),
    merger.addGeometry(shaft, mats.blocks, composeMatrix(pos.x, y, pos.z, rnd() * 6.28, 1)),
    rnd() < 0.5)
  ) {
    let drum = scaleUv(new CylinderGeometry(0.38, 0.38, 0.7, 10), 1, 0.35).rotateZ(Math.PI / 2);
    (drum.translate(0, 0.36, 0),
      merger.addGeometry(drum, mats.blocks, composeMatrix(pos.x + 1, y, pos.z + 0.4, rnd() * 6.28)));
  }
}
/** Escala las UV de una geometría (en sitio). */
function scaleUv(geo, su, sv) {
  let uv = geo.getAttribute('uv');
  for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * su, uv.getY(k) * sv);
  return geo;
}
/** Materiales PBR perezosos de piedra, sillar y tablones. */
function stoneMats() {
  if (stoneMatsCache) return stoneMatsCache;
  let lazy = (make) => {
      let value = null;
      return () => (value ??= make());
    },
    stone = lazy(() =>
      Object.assign(pbrMaterial('rock_ground', { repeat: [1, 1], tint: 13026494, ao: !1 }), {
        name: 'piedra_durn',
      }),
    ),
    blocks = lazy(() =>
      Object.assign(pbrMaterial('castle_wall_varriation', { repeat: [1, 1], tint: 14078666, ao: !1 }), {
        name: 'sillar',
      }),
    ),
    plank = lazy(() =>
      Object.assign(pbrMaterial('rough_wood', { repeat: [0.3, 1], tint: 10122322, ao: !1 }), {
        name: 'tablon',
      }),
    ),
    darkPlank = lazy(() =>
      Object.assign(pbrMaterial('rough_wood', { repeat: [0.3, 1], tint: 6177840, ao: !1 }), {
        name: 'tablon_oscuro',
      }),
    );
  return (
    (stoneMatsCache = {
      get stone() {
        return stone();
      },
      get blocks() {
        return blocks();
      },
      get plank() {
        return plank();
      },
      get darkPlank() {
        return darkPlank();
      },
    }),
    stoneMatsCache
  );
}
/** Vallas (o empalizada) entre casillas «f» vecinas, cerrando también los triángulos. */
function buildFences(ctx, cells, kind) {
  let { map, ground } = ctx,
    merger = ctx.static,
    cellSet = new Set(cells.map(([col, row]) => cellKey(col, row))),
    edges = [],
    degree = new Map();
  for (let [col, row] of cells)
    for (let [nc, nr] of neighbors(col, row))
      cellSet.has(cellKey(nc, nr)) &&
        (nr < row ||
          (nr === row && nc < col) ||
          (edges.push([
            [col, row],
            [nc, nr],
          ]),
          degree.set(cellKey(col, row), (degree.get(cellKey(col, row)) || 0) + 1),
          degree.set(cellKey(nc, nr), (degree.get(cellKey(nc, nr)) || 0) + 1)));
  let skipped = new Set();
  for (let [ea, eb] of edges)
    for (let nb of neighbors(...ea)) {
      if (!cellSet.has(cellKey(...nb))) continue;
      if (
        neighbors(...eb)
          .map(([vc, vr]) => cellKey(vc, vr))
          .includes(cellKey(...nb)) &&
        !skipped.has(cellKey(...ea) + cellKey(...eb))
      ) {
        skipped.add(cellKey(...ea) + cellKey(...eb));
        break;
      }
    }
  let pa = new Vector3(),
    pb = new Vector3();
  if (kind === 'palisade') {
    let mats = stoneMats(),
      rnd = ctx.rnd;
    for (let [ea, eb] of edges) {
      if (skipped.has(cellKey(...ea) + cellKey(...eb))) continue;
      (cellToWorld(...ea, pa), cellToWorld(...eb, pb));
      let posts = 4;
      for (let j = 0; j < posts; j++) {
        let frac = (j + 0.5) / posts,
          px = pa.x + (pb.x - pa.x) * frac + (rnd() - 0.5) * 0.08,
          pz = pa.z + (pb.z - pa.z) * frac + (rnd() - 0.5) * 0.08,
          height = 1.5 + rnd() * 0.6,
          post = new CylinderGeometry(0.11, 0.13, height, 7);
        post.translate(0, height / 2, 0);
        let tip = new ConeGeometry(0.11, 0.32, 7);
        tip.translate(0, height + 0.16, 0);
        let matrix = composeMatrix(px, ground.heightAt(px, pz) - 0.05, pz, rnd() * 6, 1).multiply(
          new Matrix4().makeRotationZ((rnd() - 0.5) * 0.12),
        );
        (merger.addGeometry(post, mats.darkPlank, matrix), merger.addGeometry(tip, mats.plank, matrix));
      }
      ground.blob(LAYER.path, (pa.x + pb.x) / 2, (pa.z + pb.z) / 2, 0.8, 0.25);
    }
    return;
  }
  let [piece] = resolvePiece(kind),
    pieceLen = hasPiece(piece) ? pieceBounds(piece).max.x - pieceBounds(piece).min.x : 2;
  for (let [ea, eb] of edges) {
    if (skipped.has(cellKey(...ea) + cellKey(...eb))) continue;
    (cellToWorld(...ea, pa), cellToWorld(...eb, pb));
    let mx = (pa.x + pb.x) / 2,
      mz = (pa.z + pb.z) / 2,
      ry = Math.atan2(-(pb.z - pa.z), pb.x - pa.x),
      len = pa.distanceTo(pb),
      scl = new Vector3((len / pieceLen) * 1.02, 1, 1);
    (merger.add(piece, composeMatrix(mx, ground.heightAt(mx, mz), mz, ry, scl)),
      ground.blob(LAYER.path, mx, mz, 0.7, 0.12));
  }
}
/** Pasarela de tablones con postes y barandillas. */
function buildFootbridge(ctx, x, z, ry, length, width) {
  let merger = ctx.static,
    mats = stoneMats(),
    rnd = ctx.rnd,
    deckY = 0.18,
    planks = Math.round(length / 0.32);
  for (let k = 0; k < planks; k++) {
    let pz = -length / 2 + (k + 0.5) * (length / planks),
      plank = new BoxGeometry(width * (0.94 + rnd() * 0.06), 0.07, (length / planks) * 0.86);
    merger.addGeometry(
      plank,
      mats.plank,
      composeMatrix(x, deckY, z, ry).multiply(
        composeMatrix((rnd() - 0.5) * 0.04, 0, pz, (rnd() - 0.5) * 0.06),
      ),
    );
  }
  for (let side of [-1, 1]) {
    merger.addGeometry(
      new BoxGeometry(0.12, 0.1, length + 0.3),
      mats.darkPlank,
      composeMatrix(x, deckY - 0.06, z, ry).multiply(composeMatrix(side * width * 0.36, 0, 0)),
    );
    let posts = Math.floor(length / 1.1) + 1;
    for (let j = 0; j < posts; j++) {
      let postZ = -length / 2 + (j * length) / (posts - 1),
        post = new BoxGeometry(0.1, 1.15, 0.1);
      (post.translate(0, 0.35, 0),
        merger.addGeometry(
          post,
          mats.darkPlank,
          composeMatrix(x, deckY, z, ry).multiply(composeMatrix(side * width * 0.5, 0, postZ)),
        ));
    }
    merger.addGeometry(
      new BoxGeometry(0.08, 0.08, length),
      mats.plank,
      composeMatrix(x, deckY + 0.9, z, ry).multiply(composeMatrix(side * width * 0.5, 0, 0)),
    );
  }
}
/** Santuario: plataforma circular, altar, menhires y disco de alba. */
function buildShrine(ctx, x, z, ry, scale) {
  let merger = ctx.static,
    mats = stoneMats(),
    rnd = ctx.rnd,
    y = ctx.ground.heightAt(x, z),
    base = new CylinderGeometry(2.4 * scale, 2.6 * scale, 0.12, 8);
  (base.translate(0, 0.06, 0), merger.addGeometry(base, mats.blocks, composeMatrix(x, y, z, ry)));
  let rim = new CylinderGeometry(2.8 * scale, 3 * scale, 0.06, 8);
  (rim.translate(0, 0.03, 0), merger.addGeometry(rim, mats.blocks, composeMatrix(x, y, z, ry)));
  let altar = new BoxGeometry(1.2, 0.9, 0.7);
  (altar.translate(0, 0.75, 0),
    merger.addGeometry(altar, mats.blocks, composeMatrix(x, y, z, ry).multiply(composeMatrix(0, 0, -0.9))));
  for (let k = 0; k < 6; k++) {
    let angle = (k / 6) * Math.PI * 2 + 0.3,
      height = k % 2 === 0 ? 0.6 + rnd() * 1 : 2.4 + rnd() * 0.6,
      stone = new CylinderGeometry(0.22, 0.26, height, 8);
    (stone.translate(0, height / 2 + 0.1, 0),
      merger.addGeometry(
        stone,
        mats.stone,
        composeMatrix(x, y, z, ry).multiply(
          composeMatrix(Math.cos(angle) * 1.9 * scale, 0, Math.sin(angle) * 1.9 * scale),
        ),
      ));
  }
  let disc = new CylinderGeometry(0.55, 0.55, 0.07, 20).rotateX(Math.PI / 2 - 0.35);
  (disc.translate(0.6, 0.35, 0.6),
    merger.addGeometry(
      disc,
      standardMaterial({ color: 11569232, roughness: 0.45, metalness: 0.7, name: 'disco_alba' }),
      composeMatrix(x, y, z, ry),
    ));
  let ground = ctx.ground;
  if (
    (ground.blob(LAYER.ao, x, z, 3.2, 0.55),
    ground.blob(LAYER.litter, x, z, 3.5, 0.6),
    ground.blob(LAYER.pave, x, z, 2.6, 0.7),
    hasPiece('Prop_Brick1'))
  )
    for (let k = 0; k < 8; k++)
      merger.add(
        `Prop_Brick${1 + (k % 4)}`,
        composeMatrix(x + (rnd() - 0.5) * 5, y, z + (rnd() - 0.5) * 5, rnd() * 6.28, 1.4),
      );
}
/** Restos de muros de ladrillo y ladrillos sueltos (atrezo «ruin»). */
function buildRuinWalls(ctx, x, z, ry, scale) {
  let merger = ctx.static,
    rnd = ctx.rnd,
    y = ctx.ground.heightAt(x, z),
    walls = [
      [-2, 0, Math.PI / 2],
      [2, 0, -Math.PI / 2],
      [0, -2.6, 0],
      [-1, 2.6, Math.PI],
      [1.2, 2.6, Math.PI],
    ];
  for (let [wx, wz, wry] of walls) {
    if (rnd() < 0.2) continue;
    let piece = rnd() < 0.5 ? 'Wall_UnevenBrick_Window_Thin_Round' : 'Wall_UnevenBrick_Straight';
    if (!hasPiece(piece)) continue;
    let matrix = composeMatrix(x, y - 0.3 - rnd() * 0.4, z, ry).multiply(
      composeMatrix(wx * scale, 0, wz * scale, wry, new Vector3(1, 0.4 + rnd() * 0.45, 1)),
    );
    merger.add(piece, matrix);
  }
  for (let k = 0; k < 7; k++)
    merger.add(
      `Prop_Brick${1 + (k % 4)}`,
      composeMatrix(x + (rnd() - 0.5) * 5, y, z + (rnd() - 0.5) * 5, rnd() * 6.28, 1.5),
    );
  ctx.ground.blob(LAYER.pave, x, z, 2.6, 0.55);
}
/** Estatua de granito del toro sobre su plinto (o caída), con la sangre de su leyenda. */
async function buildStatue(ctx, cells, fallen) {
  let { scene, ground } = ctx,
    center = new Vector3(),
    tmp = new Vector3();
  for (let [col, row] of cells) center.add(cellToWorld(col, row, tmp));
  center.divideScalar(cells.length);
  let y = ground.heightAt(center.x, center.z),
    group = new Group();
  ((group.name = 'toro'),
    group.position.set(center.x, y, center.z),
    (group.rotation.y = fallen ? 0.6 : 0.12));
  let plinth = fallen
      ? null
      : [
          new BoxGeometry(4.6, 0.22, 2.9).translate(0, 0.11, 0),
          new BoxGeometry(3.7, 0.95, 2).translate(0, 0.69, 0),
          new BoxGeometry(3.9, 0.12, 2.2).translate(0, 1.2, 0),
          new BoxGeometry(3.85, 0.08, 2.15).translate(0, 0.26, 0),
        ].map((geo) => geo.toNonIndexed()),
    bull;
  try {
    let gltf = await loadGLTF('assets/nature/Bull.json');
    bull = clone(gltf.scene);
  } catch {
    bull = null;
  }
  let material = new MeshStandardMaterial({
    color: 11842736,
    roughness: 0.82,
    metalness: 0,
    map: worldTexture('rock_ground_diff'),
  });
  if (
    ((material.onBeforeCompile = (shader) => {
      ((shader.vertexShader = shader.vertexShader
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
        (shader.fragmentShader = shader.fragmentShader
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
    (material.customProgramCacheKey = () => 'piedra-triplanar'),
    bull)
  ) {
    (bull.traverse((node) => {
      node.isMesh &&
        ((node.material = material),
        (node.castShadow = !0),
        (node.receiveShadow = !0),
        (node.frustumCulled = !1));
    }),
      (bull.rotation.y = Math.PI / 2),
      group.add(bull),
      group.updateMatrixWorld(!0));
    let box = new Box3().setFromObject(bull, !0),
      size = box.getSize(new Vector3());
    (bull.scale.multiplyScalar(3.1 / Math.max(size.x, size.z)),
      group.updateMatrixWorld(!0),
      (box = new Box3().setFromObject(bull, !0)));
    let lift = fallen ? 0 : 1.26;
    ((bull.position.y += lift - (box.min.y - y)),
      (bull.position.x -= (box.min.x + box.max.x) / 2 - center.x),
      (bull.position.z -= (box.min.z + box.max.z) / 2 - center.z),
      fallen && ((bull.rotation.z = Math.PI / 2.2), (bull.position.y += 0.6)),
      group.updateMatrixWorld(!0));
    let merged = bakeStatueGeometry(bull, group, plinth);
    if (merged) {
      group.remove(bull);
      let mesh = new Mesh(merged, material);
      ((mesh.name = 'toro_piedra'), group.add(mesh));
    }
  }
  if (!fallen) {
    let bloodMat = new MeshStandardMaterial({
        color: 2753285,
        emissive: 5899272,
        emissiveIntensity: 0.35,
        roughness: 0.1,
        metalness: 0.2,
      }),
      geos = [
        new PlaneGeometry(0.12, 1).translate(0.35, 0.72, 1.01),
        new PlaneGeometry(0.07, 0.7).translate(-0.6, 0.8, 1.01),
        new CircleGeometry(0.5, 24)
          .rotateX(-Math.PI / 2)
          .scale(1.4, 1, 0.8)
          .translate(0.35, 0.235, 1.2),
      ],
      blood = new Mesh(mergeGeometries(geos), bloodMat);
    ((blood.name = 'sangre'),
      (blood.userData.noShadow = !0),
      group.add(blood),
      (group.userData.blood = bloodMat));
  }
  return (
    group.traverse((node) => {
      node.isMesh && ((node.castShadow = !node.userData.noShadow), (node.receiveShadow = !0));
    }),
    scene.add(group),
    ground.blob(LAYER.pave, center.x, center.z, 3.4, 0.9),
    ground.blob(LAYER.ao, center.x, center.z, 2.8, 0.45),
    (ctx.statue = group),
    group
  );
}
/** Funde las mallas (también con piel) de la estatua y el plinto en una geometría estática. */
function bakeStatueGeometry(root, parent, extra = null) {
  let inverse = new Matrix4().copy(parent.matrixWorld).invert(),
    geos = [],
    v = new Vector3();
  if (
    (root.traverse((node) => {
      if (!node.isMesh) return;
      let pos = node.geometry.getAttribute('position'),
        out = new Float32Array(pos.count * 3),
        matrix = new Matrix4().multiplyMatrices(inverse, node.matrixWorld);
      for (let k = 0; k < pos.count; k++)
        (node.isSkinnedMesh ? node.getVertexPosition(k, v) : v.fromBufferAttribute(pos, k),
          v.applyMatrix4(matrix),
          (out[k * 3] = v.x),
          (out[k * 3 + 1] = v.y),
          (out[k * 3 + 2] = v.z));
      let geo = new BufferGeometry();
      (geo.setAttribute('position', new BufferAttribute(out, 3)),
        geo.setAttribute('uv', new BufferAttribute(new Float32Array(pos.count * 2), 2)),
        node.geometry.index && (geo.setIndex(node.geometry.index.clone()), (geo = geo.toNonIndexed())),
        geos.push(geo));
    }),
    !geos.length)
  )
    return null;
  for (let g of extra || []) {
    let copy = new BufferGeometry();
    (copy.setAttribute('position', g.getAttribute('position')),
      copy.setAttribute('uv', new BufferAttribute(new Float32Array(g.getAttribute('position').count * 2), 2)),
      geos.push(copy));
  }
  let merged = mergeGeometries(geos);
  return (merged.computeVertexNormals(), merged);
}
/** Caja con UV proporcionales al tamaño de cada cara. */
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
/** Clave de atrezo → [pieza del kit, escala] cuando no coinciden. */
const PROP_PIECES = {
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
/** Cultivos que se instancian en lote (con sombras). */
const CROPS = new Set(['cabbage', 'carrots', 'pumpkin', 'wheat', 'corn']);
/** Nombre de la pieza del kit para una clave de atrezo. */
const propPiece = (key) => resolvePiece(key)[0];
let webMat = null;
let eggMat = null;
let stoneMatsCache = null;

export { buildProps, propPiece };
