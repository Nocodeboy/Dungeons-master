// world/index.js — punto de entrada del área mundo (escenarios): `buildLevel` monta un nivel completo
// (kits, terreno, cielo, edificios, atrezo, vegetación, objetos, muros o interior, agua, efectos) y
// devuelve la API del mundo que usan la exploración y el combate. Exporta también `TIMES`.
// Reconstruido de publicado/juego.js (módulo __esm «ck»). Lo carga explore/areas.js con import()
// (`loadArea('world')`): sus exports (`buildLevel`, `TIMES`) son los nombres originales y no se cambian.

import { Box3, Group, MathUtils, Raycaster, Vector3 } from 'three';
import { loadKits, MeshMerger } from './kit.js';
import { worldUniforms } from './materials.js';
import { TIMES, Sky } from './times.js';
import { LAYER, Ground } from './ground.js';
import { buildVegetation } from './vegetation.js';
import { j3 } from './buildings.js';
import { J3, K3 } from './props.js';
import { $3 } from './interiors.js';
import { ok } from './procedural.js';
import { buildWater, WATER_LEVEL } from './water.js';
import { CryptWalls } from './crypt.js';
import { WorldFx } from './particles.js';
import { makeRng, hashString, cellToWorld, worldToCell, HEX_SIZE, TileMap } from './grid.js';

/**
 * Construye el nivel `level` (JSON de datos/niveles) en `scene`. Opciones: `quality`, `store` (para
 * banderas de historia), `timeOfDay` y `stage` (gradación de color). Devuelve el mundo:
 * `{level, root, map, ground, sky, fx, spots, buildings, objects, bounds, cellToWorld, worldToCell,
 * heightAt, pick, setObjectState, addObject, setObjectGlow, setGrid, setCombatView, setQuality,
 * setTimeOfDay, fadeOccluders, update(dt, time, camera), dispose}`.
 */
async function buildLevel(
  scene,
  level,
  { quality = { level: 1, shadowMap: 512 }, store = null, timeOfDay = null, stage = null } = {},
) {
  let ambient = level.ambient || 'dusk',
    isCrypt = ambient === 'crypt',
    isInn = ambient === 'inn',
    indoor = isCrypt || isInn,
    seed = hashString(level.id || 'nivel'),
    rnd = makeRng(seed),
    map = new TileMap(level),
    chars = new Set((level.rows || []).join('')),
    propPieces = [...(level.props || []), ...(level.decor || [])].map((prop) => K3(prop.key)),
    kitNames = ['atrezo'];
  ((!indoor || ['B', 'H', 'f'].some((ch) => chars.has(ch))) && kitNames.push('aldea'),
    (!indoor || ['T', 'r', 'b'].some((ch) => chars.has(ch))) && kitNames.push('naturaleza'),
    (isCrypt || (!isInn && chars.has('#')) || propPieces.some((piece) => DUNGEON_PIECES.has(piece))) &&
      kitNames.push('mazmorra'),
    await loadKits(kitNames));
  let root = new Group();
  ((root.name = `nivel:${level.id}`), scene.add(root));
  let ground = new Ground(map, level, { ambient, quality, seed, margin: indoor ? 3 : 12 }),
    center = new Vector3(map.sizeX / 2, 0, map.sizeZ / 2),
    timeName = timeOfDay || DEFAULT_TIME[ambient] || 'dusk';
  !timeOfDay && level.id === 'merrowick' && store?.flag?.('e1_done') && (timeName = 'day');
  let sky = new Sky(scene, {
      center,
      radius: Math.max(map.sizeX, map.sizeZ),
      quality,
      ambient: isCrypt ? 'crypt' : timeName,
    }),
    fx = new WorldFx(root, { quality, ambient }),
    ctx = { scene: root, map, level, ground, rnd, quality, ambient, fx, sky };
  ground.paintTiles();
  let merger = new MeshMerger({
    fade: !0,
    contactH: 1.4,
    contactMin: 0.42,
    groundAt: (x, z) => ground.heightAt(x, z),
    finish: { wind: 0 },
  });
  ctx.merger = merger;
  let buildings = indoor ? [] : j3(ctx);
  ((ctx.static = merger.view({ bld: 0, contactH: 0.7, contactMin: 0.5 })), (ctx.buildings = buildings));
  let props = await J3(ctx),
    lanterns = new Map();
  for (let prop of level.props || [])
    prop.key === 'lantern' && lanterns.set(`${prop.cell[0]},${prop.cell[1]}`, prop);
  for (let light of level.lights || []) {
    let pos = cellToWorld(light.cell[0], light.cell[1]);
    light.offset && ((pos.x += light.offset[0] * HEX_SIZE), (pos.z += light.offset[1] * HEX_SIZE));
    let lampY = ground.heightAt(pos.x, pos.z) + (light.height ?? 1.2) * HEX_SIZE,
      lantern = lanterns.get(`${light.cell[0]},${light.cell[1]}`);
    if (lantern && !isCrypt) {
      let rot = MathUtils.degToRad(lantern.rot || 0);
      ((pos.x += Math.sin(rot) * 0.48),
        (pos.z += Math.cos(rot) * 0.48),
        (lampY = ground.heightAt(pos.x, pos.z) + 2.05));
    }
    let energy = light.energy ?? 1;
    energy <= 0 ||
      (fx.addLamp({
        pos: new Vector3(pos.x, lampY, pos.z),
        color: light.color || '#ffb060',
        range: (light.range ?? 4) * HEX_SIZE,
        energy,
        kind: 'lamp',
        haloSize: 1.1 + energy * 0.5,
        haloAlpha: 0.45,
      }),
      ground.blob(
        LAYER.light,
        pos.x,
        pos.z,
        (light.range ?? 4) * HEX_SIZE * 0.45,
        Math.min(1, 0.55 + energy * 0.3),
      ));
  }
  for (let bld of buildings) {
    for (let lamp of bld.lamps)
      (lamp.kind === 'wall' && fx.lampSources.some((other) => other.pos.distanceTo(lamp.pos) < 2.6)) ||
        (fx.addLamp({
          ...lamp,
          haloSize: lamp.kind === 'forge' ? 2.2 : 1.3,
          haloAlpha: lamp.kind === 'forge' ? 0.5 : 0.45,
        }),
        ground.blob(LAYER.light, lamp.pos.x, lamp.pos.z, lamp.range * 0.45, 0.8));
    for (let win of bld.windows) {
      let out = win.clone().sub(bld.center).setY(0).normalize();
      ground.blob(LAYER.light, win.x + out.x * 1.2, win.z + out.z * 1.2, 1.5, 0.5);
    }
  }
  ((fx.smokeOrigins = buildings.flatMap((bld) => bld.smoke)), ground.readMasks());
  let solid = new Set('BH#wcSPOgr'.split('')),
    footprints = buildings.map((bld) => ({ c: bld.center, r2: (Math.max(bld.W, bld.D) / 2 + 0.6) ** 2 }));
  ctx.blocked = (x, z, allowWater = !1) => {
    let [col, row] = worldToCell(x, z),
      ch = map.inside(col, row) ? map.tile(col, row) : null;
    if (ch && solid.has(ch) && !(allowWater && ch === 'w')) return !0;
    for (let fp of footprints) if ((x - fp.c.x) ** 2 + (z - fp.c.z) ** 2 < fp.r2) return !0;
    return !1;
  };
  let vegetation = buildVegetation(ctx),
    objects = ok(ctx);
  fx.flames.push(...objects.flames);
  let walls = null,
    hasWalls = level.rows?.some((line) => line.includes('#'));
  (isInn
    ? (walls = await $3(ctx))
    : hasWalls &&
      ((walls = new CryptWalls(ctx, {
        height: level.wall_height ?? (isCrypt ? 0.85 : 0.8),
        torches: isCrypt,
      })),
      root.add(walls.group)),
    indoor &&
      map.each((col, row, ch) => {
        if (ch !== '#') return;
        let pos = cellToWorld(col, row);
        ground.blob(LAYER.ao, pos.x, pos.z, 1.2, 1);
      }),
    ground.build(root));
  let water = indoor ? null : buildWater(root, ground, sky, quality),
    merged = merger.build('fundido');
  root.add(merged);
  for (let bld of buildings) for (let obj of bld.dynamic) root.add(obj);
  (fx.build(scene.fog),
    (ctx.onFire = (id, on) => {
      let flame = fx.flames.find((f) => f.id === id);
      flame && fx.setFlame(flame, on);
      for (let lamp of fx.lampSources) lamp.id === id && (lamp.on = on);
    }));
  for (let [id, anchor] of objects.anchors)
    anchor.userData.type === 'campfire' && ctx.onFire(id, anchor.userData.state !== 'out');
  if (
    (indoor
      ? fx.ambientAround('dust', center)
      : (ambient === 'forest' || ambient === 'kesh') && fx.ambientAround('leaf', center),
    indoor || fx.ambientAround('firefly', center),
    ambient === 'forest' || ambient === 'kesh')
  ) {
    let shaftSpots = [];
    for (let tries = 0; tries < 60 && shaftSpots.length < (ambient === 'forest' ? 14 : 7); tries++) {
      let sx = rnd() * map.sizeX,
        sz = rnd() * map.sizeZ,
        [col, row] = worldToCell(sx, sz);
      map.tile(col, row) === 'T' ||
        map.tile(col, row) === 'w' ||
        shaftSpots.push(new Vector3(sx, ground.heightAt(sx, sz), sz));
    }
    fx.sunShafts(shaftSpots, sky.cur.sunDir, ambient === 'forest' ? 16770728 : 16765600);
  }
  let windowMats = new Set();
  root.traverse((node) => {
    node.isMesh && node.material?.userData?.window && windowMats.add(node.material);
  });
  let bounds = new Box3(
      new Vector3(-HEX_SIZE, -1, -HEX_SIZE),
      new Vector3(map.sizeX + HEX_SIZE, 12, map.sizeZ + HEX_SIZE),
    ),
    occluders = [
      ...vegetation.occluders,
      ...buildings
        .filter((bld) => bld.idx > 0)
        .map((bld) => ({
          kind: 'building',
          idx: bld.idx,
          box: bld.box,
          pos: bld.center,
          h: bld.top,
          r: Math.max(bld.W, bld.D) * 0.75,
        })),
    ],
    fadeState = new Map(),
    combatView = !1,
    gridTarget = 0,
    focus = center.clone(),
    tmpA = new Vector3(),
    tmpQ = new Vector3(),
    tmpDir = new Vector3(),
    tmpB = new Vector3(),
    tmpHit = new Vector3(),
    raycaster = new Raycaster(),
    spots = {
      animals: (level.animals || []).map((animal) => {
        let pos = cellToWorld(animal.cell[0], animal.cell[1]);
        return ((pos.y = ground.heightAt(pos.x, pos.z)), { ...animal, pos });
      }),
      spawns: Object.fromEntries(
        Object.entries(level.spawns || {}).map(([name, cell]) => [name, cellToWorld(cell[0], cell[1])]),
      ),
      sounds: [],
    };
  {
    let seen = [];
    map.each((col, row, ch) => {
      if (ch !== 'w') return;
      let pos = cellToWorld(col, row);
      seen.some((prev) => prev.distanceTo(pos) < 7) ||
        (seen.push(pos),
        spots.sounds.push({
          kind: level.ambient === 'forest' ? 'pond' : 'river',
          pos: pos.setY(WATER_LEVEL),
        }));
    });
    for (let lamp of fx.lampSources)
      (lamp.kind === 'fire' || lamp.kind === 'forge' || lamp.kind === 'torch') &&
        spots.sounds.push({ kind: lamp.kind, pos: lamp.pos.clone() });
    for (let bld of buildings)
      ['windmill', 'watermill', 'blacksmith', 'tavern'].includes(bld.key) &&
        spots.sounds.push({ kind: bld.key, pos: bld.center.clone() });
  }
  function applyLight(light) {
    for (let mat of windowMats) mat.emissiveIntensity = light.windows * 2.2;
    (ground.uniforms &&
      ((ground.uniforms.uLamp.value = light.lamps), (ground.uniforms.uClouds.value = light.clouds || 0)),
      fx.setLevels({
        lamps: light.lamps,
        fireflies: light.fireflies,
        light: Math.min(1, 0.18 + (light.sunI / 3.4) * 0.6 + light.hemiI * 0.15),
      }),
      ctx.statue?.userData.blood && (ctx.statue.userData.blood.emissiveIntensity = 0.25 + light.lamps * 0.2));
  }
  (sky.onChange(applyLight), applyLight(sky.cur));
  let world = {
    level,
    root,
    map,
    width: map.w,
    height: map.h,
    ground,
    sky,
    fx,
    center,
    focus,
    spots,
    buildings,
    sun: sky.sun,
    hemi: sky.hemi,
    bounds: { min: bounds.min.clone(), max: bounds.max.clone() },
    objects: objects.anchors,
    timeOfDay: timeName,
    cellToWorld([col, row], out = new Vector3()) {
      (cellToWorld(col, row, out), (out.y = ground.heightAt(out.x, out.z)));
      let ch = map.tile(col, row);
      return ((ch === 'w' || ch === '~') && water && (out.y = Math.max(out.y, WATER_LEVEL)), out);
    },
    worldToCell(pos) {
      return worldToCell(pos.x, pos.z);
    },
    heightAt: (x, z) => ground.heightAt(x, z),
    pick(input) {
      let ray = input.ray || input,
        point = ground.raycast(ray);
      return point ? { point, cell: worldToCell(point.x, point.z) } : null;
    },
    setObjectState(id, state) {
      if (id === 'bull' && ctx.statue) {
        let lamp = fx.lampSources.find((l) => l.id === 'bull');
        if (state === 'active' && !lamp) {
          let pos = ctx.statue.position.clone().add(new Vector3(0, 2.2, 0));
          fx.addLamp({ pos, color: 16722452, range: 9, energy: 1.6, kind: 'fire', id: 'bull' });
        } else lamp && (lamp.on = state === 'active');
      }
      return objects.set(id, state);
    },
    addObject(def) {
      let before = objects.flames.length,
        obj = objects.create(def);
      for (let flame of objects.flames.slice(before)) fx.addFire(flame);
      return (
        obj && def.type === 'campfire' && ctx.onFire(def.id, obj.userData.state !== 'out'),
        obj || objects.anchors.get(def.id) || null
      );
    },
    setObjectGlow(id, on) {
      objects.setGlow(id, on);
    },
    setGrid(v) {
      gridTarget = v;
    },
    setCombatView(on) {
      combatView = !!on;
    },
    setQuality(level) {
      quality.level = level;
      for (let group of vegetation.groups)
        group.name?.startsWith('hierba') && (group.visible = level > 0 || group.userData.keep);
      fx.maxLights = level === 0 ? 2 : level === 1 ? 4 : fx.lights.length;
      for (let sys of fx.systems) /humo|smoke|ember/.test(sys.name) && (sys.visible = level > 0);
      let size = level === 0 ? 512 : level === 1 ? 1024 : sky.sun.shadow.mapSize.x;
      sky.sun.shadow.mapSize.x > size &&
        (sky.sun.shadow.mapSize.set(size, size), sky.sun.shadow.map?.dispose(), (sky.sun.shadow.map = null));
    },
    setTimeOfDay(name, duration = 2.5) {
      TIMES[name] && ((world.timeOfDay = name), sky.set(name, duration));
    },
    fadeOccluders(camera, targets = []) {
      let hidden = new Set(),
        eye = camera.position;
      for (let target of targets) {
        let tp = target.isObject3D ? target.getWorldPosition(tmpA) : tmpA.copy(target),
          dir = tmpDir
            .copy(tp)
            .setY(tp.y + 0.9)
            .sub(eye),
          dist = dir.length();
        (dir.normalize(), raycaster.ray.set(eye, dir));
        for (let occ of occluders)
          if (!(Math.abs(occ.pos.x - tp.x) > 14 || Math.abs(occ.pos.z - tp.z) > 14))
            if (occ.kind === 'building') {
              let hit = raycaster.ray.intersectBox(occ.box, tmpHit);
              ((hit && eye.distanceTo(hit) < dist - 0.5) ||
                (combatView && occ.box.distanceToPoint(tp) < 2.5)) &&
                hidden.add(occ);
            } else {
              let rel = tmpB
                  .copy(occ.pos)
                  .setY(occ.pos.y + occ.h * 0.6)
                  .sub(eye),
                along = rel.dot(dir);
              if (along <= 0 || along > dist + 2) continue;
              if ((occ.pos.x - tp.x) ** 2 + (occ.pos.z - tp.z) ** 2 < (3.5 + occ.r * 0.3) ** 2) {
                hidden.add(occ);
                continue;
              }
              if (along > dist - 0.3) continue;
              rel.addScaledVector(dir, -along).length() < occ.r * (combatView ? 1.25 : 1) + 0.5 &&
                hidden.add(occ);
            }
      }
      for (let occ of occluders) {
        let want = hidden.has(occ) ? 0.2 : 1,
          prev = fadeState.get(occ) ?? 1;
        prev !== want && (fadeState.set(occ, want), (occ.target = want), occ.cur || (occ.cur = prev));
      }
    },
    update(dt, time, camera) {
      if (
        ((worldUniforms.uTime.value = time),
        (worldUniforms.uSquash.value +=
          ((combatView ? 0.45 : 1) - worldUniforms.uSquash.value) * Math.min(1, dt * 3)),
        ground.uniforms &&
          (ground.uniforms.uGrid.value += (gridTarget - ground.uniforms.uGrid.value) * Math.min(1, dt * 5)),
        camera)
      ) {
        let dir = camera.getWorldDirection(tmpA);
        if (dir.y < -0.05) {
          let t = (camera.position.y - 0) / -dir.y;
          (focus.copy(camera.position).addScaledVector(dir, t),
            (focus.x = Math.max(ground.x0, Math.min(ground.x1, focus.x))),
            (focus.z = Math.max(ground.z0, Math.min(ground.z1, focus.z))));
        }
        (walls && walls.updateCutaway(dir), sky.dome.position.copy(camera.position));
      }
      (sky.update(dt, time, focus, camera ? camera.position.distanceTo(focus) : 0),
        stage?.grade && stage.grade.uniforms.uTint.value.copy(sky.cur.tint),
        water?.update(time),
        objects.update(dt));
      for (let bld of buildings) bld.update?.(dt);
      fx.update(dt, time, camera || { fov: 32 }, focus, innerHeight);
      for (let occ of occluders) {
        if (occ.target == null) continue;
        let cur = occ.cur ?? 1,
          next = cur + (occ.target - cur) * Math.min(1, dt * 6),
          v = Math.abs(next - occ.target) < 0.01 ? occ.target : next;
        ((occ.cur = v),
          occ.kind === 'building'
            ? worldUniforms.uBld.value[occ.idx].set(v, v)
            : occ.attr && ((occ.attr.array[occ.i] = v), (occ.attr.needsUpdate = !0)),
          v === occ.target && occ.target === 1 && (occ.target = null));
      }
    },
    dispose() {
      scene.remove(root);
      for (let obj of [sky.sun, sky.sun.target, sky.bounce, sky.bounce.target, sky.hemi, sky.dome])
        scene.remove(obj);
      ((scene.fog = null), (scene.background = null));
      let textures = new Set();
      root.traverse((node) => {
        if (node.isMesh || node.isPoints || node.isInstancedMesh) {
          node.geometry?.dispose();
          for (let mat of Array.isArray(node.material) ? node.material : [node.material])
            for (let key of ['map', 'emissiveMap', 'alphaMap'])
              mat?.[key]?.isCanvasTexture && textures.add(mat[key]);
        }
      });
      for (let tex of textures) tex.dispose();
      (ground.dispose(), fx.dispose(), sky.dispose());
      for (let v of worldUniforms.uBld.value) v.set(1, 1);
    },
  };
  if (store?.flag)
    for (let obj of level.objects || [])
      (obj.hidden_until && store.flag(obj.hidden_until) && world.setObjectState(obj.id, 'revealed'),
        obj.type === 'campfire' &&
          obj.requires &&
          store.flag(obj.requires) &&
          world.setObjectState(obj.id, 'lit'));
  return world;
}
/** Momento del día por defecto según el ambiente del nivel. */
const DEFAULT_TIME = {
  dusk: 'dusk',
  day: 'day',
  forest: 'forest',
  night: 'night',
  crypt: 'crypt',
  kesh: 'kesh',
  inn: 'inn',
};
/** Piezas del kit «mazmorra»: si el nivel usa alguna como atrezo, se carga el kit. */
const DUNGEON_PIECES = new Set([
  'wall',
  'wall_cracked',
  'wall_broken',
  'wall_arched',
  'wall_shelves',
  'wall_window',
  'wall_doorway',
  'wall_gated',
  'wall_pillar',
  'wall_corner',
  'wall_half',
  'pillar',
  'pillar_deco',
  'column',
  'rubble',
  'rubble_large',
  'torch_wall',
  'torch',
  'candles',
  'candle_lit',
  'barrel_d',
  'chest',
  'chest_gold',
  'banner',
  'banner_thin',
  'banner_brown',
  'floor_tile',
  'floor_tile_rocks',
  'floor_spikes',
  'floor_grate',
  'stairs',
  'stairs_walled',
  'box_large',
  'box_stacked',
  'keg',
  'sword_shield',
  'shelf_small',
  'table_broken',
  'chair',
  'coin_stack',
  'trunk',
]);

export { TIMES } from './times.js';
export { buildLevel };
