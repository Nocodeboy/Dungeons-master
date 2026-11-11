// world/vegetation.js — vegetación del nivel: árboles de las casillas «T» y del relieve exterior
// (instanciados, con fundido para los que tapan la cámara), arbustos de las casillas «b», hierba en
// matas por trozos, flores, setas, guijarros y plantas de agua (nenúfares, juncos).
// Reconstruido de publicado/juego.js (módulo __esm «N3»). Lo usa index.js.

import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  InstancedMesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import { hasPiece, pieceBounds, instancePiece, composeMatrix, MeshMerger } from './kit.js';
import { worldMaterial } from './materials.js';
import { LAYER } from './ground.js';
import { cellToWorld, worldToCell, neighbors, HEX_SIZE } from './grid.js';
import { WATER_LEVEL } from './water.js';

/** Elige un nombre de `entries` ([[nombre, peso]…]) al azar según su peso. */
function pickWeighted(rnd, entries) {
  let total = 0;
  for (let [, w] of entries) total += w;
  let roll = rnd() * total;
  for (let [name, weight] of entries) if (((roll -= weight), roll <= 0)) return name;
  return entries[0][0];
}
/** Geometría de una mata de hierba (briznas triangulares con color de vértice), por variante. */
function tuftGeometry(variant) {
  if (((tuftCache ??= new Map()), tuftCache.has(variant))) return tuftCache.get(variant);
  let seed = 1e3 + variant * 77,
    rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647,
    positions = [],
    colors = [],
    clumps = variant === 2 ? 5 : 6;
  for (let clump = 0; clump < clumps; clump++) {
    let cx = (rand() - 0.5) * 0.9,
      cz = (rand() - 0.5) * 0.9,
      blades = 9 + Math.floor(rand() * 5),
      tall = variant === 2 || rand() < 0.2,
      height = (0.17 + rand() * 0.13) * (tall ? 1.6 : 1),
      dry = rand() < (variant === 1 ? 0.35 : 0.16),
      rootColor = new Color().setRGB(0.16 + rand() * 0.04, 0.24 + rand() * 0.04, 0.08),
      tipColor = dry
        ? new Color().setRGB(0.56 + rand() * 0.08, 0.5, 0.24)
        : new Color().setRGB(0.36 + rand() * 0.08, 0.5 + rand() * 0.06, 0.16);
    for (let blade = 0; blade < blades; blade++) {
      let angle = rand() * Math.PI * 2,
        dx = Math.cos(angle),
        dz = Math.sin(angle),
        lean = 0.04 + rand() * 0.1,
        bladeH = height * (0.6 + rand() * 0.5),
        halfW = 0.014 + rand() * 0.012,
        bx = cx + dx * rand() * 0.06,
        bz = cz + dz * rand() * 0.06,
        wx = -dz * halfW,
        wz = dx * halfW;
      positions.push(bx - wx, 0, bz - wz, bx + wx, 0, bz + wz, bx + dx * lean, bladeH, bz + dz * lean);
      for (let color of [rootColor, rootColor, tipColor]) colors.push(color.r, color.g, color.b);
    }
  }
  let geo = new BufferGeometry();
  (geo.setAttribute('position', new Float32BufferAttribute(positions, 3)),
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3)));
  let normals = new Float32Array(positions.length);
  for (let j = 1; j < normals.length; j += 3) normals[j] = 1;
  return (
    geo.setAttribute('normal', new BufferAttribute(normals, 3)),
    geo.setAttribute('uv', new BufferAttribute(new Float32Array((positions.length / 3) * 2), 2)),
    tuftCache.set(variant, geo),
    geo
  );
}
/** Material compartido de las briznas (viento, aplastado y AO de contacto). */
function grassMaterial() {
  if (!grassMat) {
    let base = new MeshStandardMaterial({ vertexColors: !0, roughness: 0.9, side: DoubleSide });
    ((base.name = 'Briznas'),
      (grassMat = worldMaterial(base, {
        wind: 0.05,
        windRef: 0.35,
        squash: !0,
        upNormal: 1,
        contact: 'local',
        contactH: 0.3,
        contactMin: 0.7,
      })));
  }
  return grassMat;
}
/**
 * Planta la vegetación del nivel sobre `ctx` (el contexto de buildLevel: scene, map, ground, rnd,
 * quality, ambient, blocked). Devuelve `{occluders, groups}`: los árboles que pueden fundirse al
 * tapar la cámara y los grupos añadidos a la escena.
 */
function buildVegetation(ctx) {
  let { scene, map, ground, rnd, quality, ambient } = ctx,
    treeMix = TREE_MIX[ambient] || TREE_MIX.dusk,
    occluders = [],
    groups = [],
    pos = new Vector3(),
    nearTrees = new Map(),
    farTrees = new Map(),
    pushTo = (bucket, key, item) => {
      (bucket.has(key) || bucket.set(key, []), bucket.get(key).push(item));
    },
    boundsCache = new Map(),
    boundsOf = (name) => (
      boundsCache.has(name) || boundsCache.set(name, pieceBounds(name)),
      boundsCache.get(name)
    ),
    addTree = (name, x, z, scale, near, fadeable = !1) => {
      let y = ground.heightAt(x, z) - 0.05,
        matrix = composeMatrix(x, y, z, rnd() * Math.PI * 2, scale),
        box = boundsOf(name),
        tree = {
          m: matrix,
          pos: new Vector3(x, y, z),
          h: box.max.y * scale,
          r: Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * 0.5 * scale,
          fadeable,
        };
      pushTo(near ? nearTrees : farTrees, name, tree);
    },
    isOpen = (col, row) => map.inside(col, row) && map.tile(col, row) !== 'T',
    nearOpen = (col, row) =>
      neighbors(col, row).some(
        ([nc, nr]) => isOpen(nc, nr) || neighbors(nc, nr).some(([nc2, nr2]) => isOpen(nc2, nr2)),
      );
  map.each((col, row, ch) => {
    if (ch !== 'T') return;
    cellToWorld(col, row, pos);
    let kind = pickWeighted(rnd, treeMix),
      scale = (ambient === 'forest' ? 0.6 : ambient === 'kesh' ? 0.72 : 0.8) + rnd() * 0.26,
      near = quality.level >= 2 || nearOpen(col, row);
    (addTree(kind, pos.x + (rnd() - 0.5) * 0.4, pos.z + (rnd() - 0.5) * 0.4, scale, near, !near),
      ground.blob(LAYER.ao, pos.x, pos.z, 1.6, 0.35));
  });
  let minX = -HEX_SIZE * 0.5,
    maxX = map.sizeX,
    minZ = -HEX_SIZE * 0.5,
    maxZ = map.sizeZ + HEX_SIZE * 0.5,
    treeDensity = { dusk: 0.42, day: 0.42, forest: 0.85, kesh: 0.5, crypt: 0, inn: 0 }[ambient] ?? 0.4,
    maxTrees = quality.level === 0 ? 110 : quality.level === 1 ? 190 : 280,
    placed = 0,
    step = 2.6;
  for (let wz = ground.z0 + 1; wz < ground.z1 - 1 && treeDensity > 0; wz += step)
    for (let wx = ground.x0 + 1; wx < ground.x1 - 1; wx += step) {
      let jx = wx + (rnd() - 0.5) * step * 0.9,
        jz = wz + (rnd() - 0.5) * step * 0.9,
        outside = Math.max(minX - jx, jx - maxX, minZ - jz, jz - maxZ);
      if (
        outside < 1.2 ||
        ctx.blocked?.(jx, jz) ||
        ground.maskAt(LAYER.path, jx, jz) > 0.25 ||
        ground.maskAt(LAYER.gravel, jx, jz) > 0.3 ||
        ground.waterAt(jx, jz) > 0.05
      )
        continue;
      let density = 0.5 + ground.noise(jx * 0.08, jz * 0.08) * 1.2;
      if (rnd() > treeDensity * density * Math.min(1, outside / 3) || placed++ > maxTrees) continue;
      let kind = pickWeighted(rnd, treeMix);
      addTree(kind, jx, jz, 0.85 + rnd() * 0.45, outside < 5);
    }
  for (let [name, list] of nearTrees) {
    let piece = quality.level < 2 && hasPiece(`${name}_lod`) ? `${name}_lod` : name,
      group = instancePiece(
        piece,
        list.map((tree) => tree.m),
        { fade: !0, cast: !0, finish: { windRef: list[0].h, wind: 0.16 } },
      );
    ((group.name = `arboles:${name}`),
      scene.add(group),
      groups.push(group),
      list.forEach((tree, idx) =>
        occluders.push({
          pos: tree.pos,
          h: tree.h,
          r: tree.r,
          attr: group.userData.fade,
          i: idx,
          kind: 'tree',
        }),
      ));
  }
  for (let [name, list] of farTrees) {
    let piece = hasPiece(`${name}_lod`) ? `${name}_lod` : name,
      anyFade = list.some((tree) => tree.fadeable),
      group = instancePiece(
        piece,
        list.map((tree) => tree.m),
        { fade: anyFade, cast: quality.level === 2, finish: { windRef: list[0].h, wind: 0.14 } },
      );
    ((group.name = `arboles_lejos:${name}`),
      scene.add(group),
      groups.push(group),
      anyFade &&
        list.forEach(
          (tree, idx) =>
            tree.fadeable &&
            occluders.push({
              pos: tree.pos,
              h: tree.h,
              r: tree.r,
              attr: group.userData.fade,
              i: idx,
              kind: 'tree',
            }),
        ));
  }
  let bushes = { Bush_Common: [], Bush_Common_Flowers: [], Fern_1: [], Plant_7_Big: [], Rock_Medium_2: [] };
  map.each((col, row, ch) => {
    if (ch !== 'b') return;
    cellToWorld(col, row, pos);
    let kind =
        ambient === 'forest' || ambient === 'kesh'
          ? rnd() < 0.45
            ? 'Fern_1'
            : 'Bush_Common'
          : rnd() < 0.35
            ? 'Bush_Common_Flowers'
            : 'Bush_Common',
      bx = pos.x + (rnd() - 0.5) * 0.3,
      bz = pos.z + (rnd() - 0.5) * 0.3;
    if (
      (bushes[kind].push(
        composeMatrix(bx, ground.heightAt(bx, bz) - 0.05, bz, rnd() * 6.28, 0.95 + rnd() * 0.35),
      ),
      rnd() < 0.7)
    ) {
      let sx = pos.x + (rnd() - 0.5) * 1,
        sz = pos.z + (rnd() - 0.5) * 1;
      bushes.Bush_Common.push(
        composeMatrix(sx, ground.heightAt(sx, sz) - 0.05, sz, rnd() * 6.28, 0.55 + rnd() * 0.25),
      );
    }
  });
  for (let [name, list] of Object.entries(bushes)) {
    if (!list.length) continue;
    let group = instancePiece(name, list, { cast: !0, finish: { wind: 0.04, windRef: 1 } });
    (scene.add(group), groups.push(group));
  }
  return (
    ambient !== 'crypt' && ambient !== 'inn' && groups.push(...scatterGroundDetail(ctx)),
    { occluders, groups }
  );
}
/** Añade a `out` (pieza → matrices) plantas de orilla y nenúfares según la profundidad del agua. */
function scatterWaterPlants(ctx, out) {
  let { map, ground, rnd, quality, ambient } = ctx,
    step = quality.level === 0 ? 0.9 : 0.5,
    lilyRate = ambient === 'forest' ? 1 : ambient === 'kesh' ? 0.08 : 0.5;
  for (let name of ['waterplant', 'waterlily', 'waterlily_b']) out[name] ??= [];
  let scaleVec = new Vector3(1, 1, 1);
  for (let wz = ground.z0 + 0.4; wz < ground.z1 - 0.4; wz += step)
    for (let wx = ground.x0 + 0.4; wx < ground.x1 - 0.4; wx += step) {
      let px = wx + (rnd() - 0.5) * step,
        pz = wz + (rnd() - 0.5) * step;
      if (ground.waterAt(px, pz) < 0.06) continue;
      let [col, row] = worldToCell(px, pz),
        ch = map.tile(col, row);
      if (ch === '~' || ch === ':' || ch === '=' || ch === 'P' || ctx.blocked?.(px, pz, !0)) continue;
      let depth = WATER_LEVEL - ground.heightAt(px, pz),
        clump = ground.noise(px * 0.32 + 11, pz * 0.32 - 4);
      if (depth > -0.14 && depth < 0.24) {
        if (rnd() > 0.18 + clump * 1.1) continue;
        let matrix = composeMatrix(
          px,
          Math.min(ground.heightAt(px, pz), WATER_LEVEL) - 0.04,
          pz,
          rnd() * 6.28,
          0.9 + rnd() * 0.5,
        );
        rnd() < 0.3
          ? out.waterplant.push(matrix)
          : out.Grass_Wispy_Tall.push(matrix.scale(scaleVec.set(1, 1.5 + rnd() * 0.6, 1)));
      } else
        depth > 0.3 &&
          depth < 0.75 &&
          rnd() < 0.05 * lilyRate * (1 + clump * 2) &&
          out[rnd() < 0.6 ? 'waterlily' : 'waterlily_b'].push(
            composeMatrix(px, WATER_LEVEL + 0.012, pz, rnd() * 6.28, 0.7 + rnd() * 0.6),
          );
    }
}
/** Hierba por trozos, flores, setas y guijarros fuera de caminos; devuelve las mallas creadas. */
function scatterGroundDetail(ctx) {
  let { scene, map, ground, rnd, quality, ambient } = ctx,
    level = quality.level,
    step = level === 0 ? 1.15 : level === 1 ? 0.78 : 0.6,
    chunk = level >= 2 ? 24 : 40,
    tufts = new Map(),
    details = {
      Flower_3_Group: [],
      Flower_4_Group: [],
      Flower_3_Single: [],
      Clover_1: [],
      Clover_2: [],
      Fern_1: [],
      Mushroom_Common: [],
      Mushroom_Laetiporus: [],
      Plant_1: [],
      Grass_Wispy_Tall: [],
      Pebble_Round_1: [],
      Pebble_Round_4: [],
      Pebble_Square_3: [],
    },
    minX = -HEX_SIZE * 0.5,
    maxX = map.sizeX,
    minZ = -HEX_SIZE * 0.5,
    maxZ = map.sizeZ + HEX_SIZE * 0.5,
    forest = ambient === 'forest';
  for (let wz = ground.z0 + 0.4; wz < ground.z1 - 0.4; wz += step)
    for (let wx = ground.x0 + 0.4; wx < ground.x1 - 0.4; wx += step) {
      let px = wx + (rnd() - 0.5) * step,
        pz = wz + (rnd() - 0.5) * step,
        outside = Math.max(minX - px, px - maxX, minZ - pz, pz - maxZ);
      if (
        (outside > 2 && rnd() > Math.max(0.25, 1 - outside / 14)) ||
        ctx.blocked?.(px, pz) ||
        ground.waterAt(px, pz) > 0.02
      )
        continue;
      let path = ground.maskAt(LAYER.path, px, pz),
        pave = ground.maskAt(LAYER.pave, px, pz),
        mud = ground.maskAt(LAYER.mud, px, pz),
        gravel = ground.maskAt(LAYER.gravel, px, pz),
        field = ground.maskAt(LAYER.field, px, pz),
        litter = ground.maskAt(LAYER.litter, px, pz),
        py = ground.heightAt(px, pz);
      if (path > 0.45 || pave > 0.3 || gravel > 0.35 || field > 0.3) {
        (path > 0.45 || gravel > 0.35) &&
          rnd() < 0.035 &&
          details[rnd() < 0.5 ? 'Pebble_Round_1' : rnd() < 0.5 ? 'Pebble_Round_4' : 'Pebble_Square_3'].push(
            composeMatrix(px, py, pz, rnd() * 6.28, 0.8 + rnd() * 0.8),
          );
        continue;
      }
      if (mud > 0.5) continue;
      let density = Math.max(
          0,
          ground.noise(px * 0.18, pz * 0.18) * 1.6 + ground.noise(px * 0.6 + 7, pz * 0.6) * 0.5 + 0.3,
        ),
        edge = path > 0.12 || pave > 0.08 || mud > 0.2 ? 0.7 : 0;
      if (rnd() > Math.min(1, density + edge) * (forest ? 0.75 + (1 - litter) * 0.25 : 0.9)) continue;
      if (rnd() < (forest ? 0.035 : 0.045)) {
        let scale = 0.8 + rnd() * 0.5,
          matrix = composeMatrix(px, py, pz, rnd() * 6.28, scale);
        if (forest) {
          let roll = rnd();
          roll < 0.45
            ? details.Fern_1.push(matrix)
            : roll < 0.62
              ? details.Mushroom_Common.push(matrix)
              : roll < 0.7
                ? details.Mushroom_Laetiporus.push(matrix)
                : roll < 0.85
                  ? details.Plant_1.push(matrix)
                  : details.Clover_2.push(matrix);
        } else {
          let roll = rnd();
          roll < 0.3
            ? details.Flower_3_Group.push(matrix)
            : roll < 0.5
              ? details.Flower_4_Group.push(matrix)
              : roll < 0.6
                ? details.Flower_3_Single.push(matrix)
                : roll < 0.8
                  ? details.Clover_1.push(matrix)
                  : roll < 0.9
                    ? details.Grass_Wispy_Tall.push(matrix)
                    : details.Plant_1.push(matrix);
        }
        continue;
      }
      let key = `${Math.floor(px / chunk)},${Math.floor(pz / chunk)}|0`;
      (tufts.has(key) || tufts.set(key, []),
        tufts.get(key).push(composeMatrix(px, py - 0.02, pz, rnd() * 6.28, 0.85 + rnd() * 0.5)));
    }
  let meshes = [],
    material = grassMaterial();
  for (let [chunkKey, matrices] of tufts) {
    let variant = Number(chunkKey.split('|')[1]),
      mesh = new InstancedMesh(tuftGeometry(variant), material, matrices.length);
    (matrices.forEach((matrix, idx) => mesh.setMatrixAt(idx, matrix)),
      (mesh.instanceMatrix.needsUpdate = !0),
      (mesh.castShadow = !1),
      (mesh.receiveShadow = !0),
      mesh.computeBoundingSphere(),
      (mesh.name = `hierba:${chunkKey}`),
      scene.add(mesh),
      meshes.push(mesh));
  }
  scatterWaterPlants(ctx, details);
  let merger = new MeshMerger({
    contactH: 0.3,
    contactMin: 0.7,
    cast: !1,
    finish: { squash: !0, wind: 0.05, windRef: 0.6 },
    groundAt: (x, z) => ground.heightAt(x, z),
  });
  for (let [name, list] of Object.entries(details))
    for (let matrix of list) hasPiece(name) && merger.add(name, matrix);
  let merged = merger.build('detalle');
  for (let child of merged.children) child.castShadow = !1;
  return (scene.add(merged), meshes.push(merged), meshes);
}
/** Mezcla de especies de árbol [pieza, peso] por ambiente. */
const TREE_MIX = {
  dusk: [
    ['CommonTree_3', 3],
    ['CommonTree_4', 3],
    ['CommonTree_1', 2.5],
    ['Pine_2', 1.2],
  ],
  day: [
    ['CommonTree_3', 3],
    ['CommonTree_4', 3],
    ['CommonTree_1', 2.5],
    ['Pine_2', 1.2],
  ],
  forest: [
    ['Pine_1', 3],
    ['Pine_2', 3],
    ['Pine_5', 3],
    ['Pine_4', 1.5],
    ['DeadTree_1', 0.3],
  ],
  kesh: [
    ['Pine_2', 2.5],
    ['Pine_5', 2.5],
    ['DeadTree_2', 0.9],
    ['TwistedTree_3', 0.3],
  ],
  crypt: [
    ['DeadTree_1', 1],
    ['DeadTree_2', 1],
  ],
};
let tuftCache = null;
let grassMat = null;

export { buildVegetation };
