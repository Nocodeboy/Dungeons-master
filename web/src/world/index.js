// world/index.js
// Reconstruido de publicado/juego.js (módulo __esm «ck»). Nombres locales aún minificados.

import { Box3, Group, MathUtils, Raycaster, Vector3 } from 'three';
import { T3, gn } from './kit.js';
import { No } from './materials.js';
import { TIMES, Vm } from './times.js';
import { Le, Ym } from './ground.js';
import { H3 } from './vegetation.js';
import { j3 } from './buildings.js';
import { J3, K3 } from './props.js';
import { $3 } from './interiors.js';
import { ok } from './procedural.js';
import { L3, fs } from './water.js';
import { n0 } from './crypt.js';
import { o0 } from './particles.js';
import { makeRng, hashString, cellToWorld, worldToCell, HEX_SIZE, TileMap } from './grid.js';

async function buildLevel(
  o,
  e,
  { quality: t = { level: 1, shadowMap: 512 }, store: a = null, timeOfDay: n = null, stage: s = null } = {},
) {
  let i = e.ambient || 'dusk',
    r = i === 'crypt',
    l = i === 'inn',
    c = r || l,
    d = hashString(e.id || 'nivel'),
    u = makeRng(d),
    h = new TileMap(e),
    p = new Set((e.rows || []).join('')),
    m = [...(e.props || []), ...(e.decor || [])].map((L) => K3(L.key)),
    _ = ['atrezo'];
  ((!c || ['B', 'H', 'f'].some((L) => p.has(L))) && _.push('aldea'),
    (!c || ['T', 'r', 'b'].some((L) => p.has(L))) && _.push('naturaleza'),
    (r || (!l && p.has('#')) || m.some((L) => U9.has(L))) && _.push('mazmorra'),
    await T3(_));
  let b = new Group();
  ((b.name = `nivel:${e.id}`), o.add(b));
  let f = new Ym(h, e, { ambient: i, quality: t, seed: d, margin: c ? 3 : 12 }),
    v = new Vector3(h.sizeX / 2, 0, h.sizeZ / 2),
    x = n || q9[i] || 'dusk';
  !n && e.id === 'merrowick' && a?.flag?.('e1_done') && (x = 'day');
  let g = new Vm(o, { center: v, radius: Math.max(h.sizeX, h.sizeZ), quality: t, ambient: r ? 'crypt' : x }),
    y = new o0(b, { quality: t, ambient: i }),
    w = { scene: b, map: h, level: e, ground: f, rnd: u, quality: t, ambient: i, fx: y, sky: g };
  f.paintTiles();
  let k = new gn({
    fade: !0,
    contactH: 1.4,
    contactMin: 0.42,
    groundAt: (L, O) => f.heightAt(L, O),
    finish: { wind: 0 },
  });
  w.merger = k;
  let T = c ? [] : j3(w);
  ((w.static = k.view({ bld: 0, contactH: 0.7, contactMin: 0.5 })), (w.buildings = T));
  let E = await J3(w),
    S = new Map();
  for (let L of e.props || []) L.key === 'lantern' && S.set(`${L.cell[0]},${L.cell[1]}`, L);
  for (let L of e.lights || []) {
    let O = cellToWorld(L.cell[0], L.cell[1]);
    L.offset && ((O.x += L.offset[0] * HEX_SIZE), (O.z += L.offset[1] * HEX_SIZE));
    let B = f.heightAt(O.x, O.z) + (L.height ?? 1.2) * HEX_SIZE,
      $ = S.get(`${L.cell[0]},${L.cell[1]}`);
    if ($ && !r) {
      let be = MathUtils.degToRad($.rot || 0);
      ((O.x += Math.sin(be) * 0.48), (O.z += Math.cos(be) * 0.48), (B = f.heightAt(O.x, O.z) + 2.05));
    }
    let ee = L.energy ?? 1;
    ee <= 0 ||
      (y.addLamp({
        pos: new Vector3(O.x, B, O.z),
        color: L.color || '#ffb060',
        range: (L.range ?? 4) * HEX_SIZE,
        energy: ee,
        kind: 'lamp',
        haloSize: 1.1 + ee * 0.5,
        haloAlpha: 0.45,
      }),
      f.blob(Le.light, O.x, O.z, (L.range ?? 4) * HEX_SIZE * 0.45, Math.min(1, 0.55 + ee * 0.3)));
  }
  for (let L of T) {
    for (let O of L.lamps)
      (O.kind === 'wall' && y.lampSources.some((B) => B.pos.distanceTo(O.pos) < 2.6)) ||
        (y.addLamp({
          ...O,
          haloSize: O.kind === 'forge' ? 2.2 : 1.3,
          haloAlpha: O.kind === 'forge' ? 0.5 : 0.45,
        }),
        f.blob(Le.light, O.pos.x, O.pos.z, O.range * 0.45, 0.8));
    for (let O of L.windows) {
      let B = O.clone().sub(L.center).setY(0).normalize();
      f.blob(Le.light, O.x + B.x * 1.2, O.z + B.z * 1.2, 1.5, 0.5);
    }
  }
  ((y.smokeOrigins = T.flatMap((L) => L.smoke)), f.readMasks());
  let z = new Set('BH#wcSPOgr'.split('')),
    D = T.map((L) => ({ c: L.center, r2: (Math.max(L.W, L.D) / 2 + 0.6) ** 2 }));
  w.blocked = (L, O, B = !1) => {
    let [$, ee] = worldToCell(L, O),
      be = h.inside($, ee) ? h.tile($, ee) : null;
    if (be && z.has(be) && !(B && be === 'w')) return !0;
    for (let Ce of D) if ((L - Ce.c.x) ** 2 + (O - Ce.c.z) ** 2 < Ce.r2) return !0;
    return !1;
  };
  let M = H3(w),
    R = ok(w);
  y.flames.push(...R.flames);
  let A = null,
    P = e.rows?.some((L) => L.includes('#'));
  (l
    ? (A = await $3(w))
    : P && ((A = new n0(w, { height: e.wall_height ?? (r ? 0.85 : 0.8), torches: r })), b.add(A.group)),
    c &&
      h.each((L, O, B) => {
        if (B !== '#') return;
        let $ = cellToWorld(L, O);
        f.blob(Le.ao, $.x, $.z, 1.2, 1);
      }),
    f.build(b));
  let I = c ? null : L3(b, f, g, t),
    U = k.build('fundido');
  b.add(U);
  for (let L of T) for (let O of L.dynamic) b.add(O);
  (y.build(o.fog),
    (w.onFire = (L, O) => {
      let B = y.flames.find(($) => $.id === L);
      B && y.setFlame(B, O);
      for (let $ of y.lampSources) $.id === L && ($.on = O);
    }));
  for (let [L, O] of R.anchors) O.userData.type === 'campfire' && w.onFire(L, O.userData.state !== 'out');
  if (
    (c ? y.ambientAround('dust', v) : (i === 'forest' || i === 'kesh') && y.ambientAround('leaf', v),
    c || y.ambientAround('firefly', v),
    i === 'forest' || i === 'kesh')
  ) {
    let L = [];
    for (let O = 0; O < 60 && L.length < (i === 'forest' ? 14 : 7); O++) {
      let B = u() * h.sizeX,
        $ = u() * h.sizeZ,
        [ee, be] = worldToCell(B, $);
      h.tile(ee, be) === 'T' || h.tile(ee, be) === 'w' || L.push(new Vector3(B, f.heightAt(B, $), $));
    }
    y.sunShafts(L, g.cur.sunDir, i === 'forest' ? 16770728 : 16765600);
  }
  let j = new Set();
  b.traverse((L) => {
    L.isMesh && L.material?.userData?.window && j.add(L.material);
  });
  let X = new Box3(
      new Vector3(-HEX_SIZE, -1, -HEX_SIZE),
      new Vector3(h.sizeX + HEX_SIZE, 12, h.sizeZ + HEX_SIZE),
    ),
    J = [
      ...M.occluders,
      ...T.filter((L) => L.idx > 0).map((L) => ({
        kind: 'building',
        idx: L.idx,
        box: L.box,
        pos: L.center,
        h: L.top,
        r: Math.max(L.W, L.D) * 0.75,
      })),
    ],
    Z = new Map(),
    K = !1,
    ve = 0,
    ge = v.clone(),
    ue = new Vector3(),
    Q = new Vector3(),
    oe = new Vector3(),
    ie = new Vector3(),
    we = new Vector3(),
    ce = new Raycaster(),
    ke = {
      animals: (e.animals || []).map((L) => {
        let O = cellToWorld(L.cell[0], L.cell[1]);
        return ((O.y = f.heightAt(O.x, O.z)), { ...L, pos: O });
      }),
      spawns: Object.fromEntries(
        Object.entries(e.spawns || {}).map(([L, O]) => [L, cellToWorld(O[0], O[1])]),
      ),
      sounds: [],
    };
  {
    let L = [];
    h.each((O, B, $) => {
      if ($ !== 'w') return;
      let ee = cellToWorld(O, B);
      L.some((be) => be.distanceTo(ee) < 7) ||
        (L.push(ee), ke.sounds.push({ kind: e.ambient === 'forest' ? 'pond' : 'river', pos: ee.setY(fs) }));
    });
    for (let O of y.lampSources)
      (O.kind === 'fire' || O.kind === 'forge' || O.kind === 'torch') &&
        ke.sounds.push({ kind: O.kind, pos: O.pos.clone() });
    for (let O of T)
      ['windmill', 'watermill', 'blacksmith', 'tavern'].includes(O.key) &&
        ke.sounds.push({ kind: O.key, pos: O.center.clone() });
  }
  function Qe(L) {
    for (let O of j) O.emissiveIntensity = L.windows * 2.2;
    (f.uniforms && ((f.uniforms.uLamp.value = L.lamps), (f.uniforms.uClouds.value = L.clouds || 0)),
      y.setLevels({
        lamps: L.lamps,
        fireflies: L.fireflies,
        light: Math.min(1, 0.18 + (L.sunI / 3.4) * 0.6 + L.hemiI * 0.15),
      }),
      w.statue?.userData.blood && (w.statue.userData.blood.emissiveIntensity = 0.25 + L.lamps * 0.2));
  }
  (g.onChange(Qe), Qe(g.cur));
  let N = {
    level: e,
    root: b,
    map: h,
    width: h.w,
    height: h.h,
    ground: f,
    sky: g,
    fx: y,
    center: v,
    focus: ge,
    spots: ke,
    buildings: T,
    sun: g.sun,
    hemi: g.hemi,
    bounds: { min: X.min.clone(), max: X.max.clone() },
    objects: R.anchors,
    timeOfDay: x,
    cellToWorld([L, O], B = new Vector3()) {
      (cellToWorld(L, O, B), (B.y = f.heightAt(B.x, B.z)));
      let $ = h.tile(L, O);
      return (($ === 'w' || $ === '~') && I && (B.y = Math.max(B.y, fs)), B);
    },
    worldToCell(L) {
      return worldToCell(L.x, L.z);
    },
    heightAt: (L, O) => f.heightAt(L, O),
    pick(L) {
      let O = L.ray || L,
        B = f.raycast(O);
      return B ? { point: B, cell: worldToCell(B.x, B.z) } : null;
    },
    setObjectState(L, O) {
      if (L === 'bull' && w.statue) {
        let B = y.lampSources.find(($) => $.id === 'bull');
        if (O === 'active' && !B) {
          let $ = w.statue.position.clone().add(new Vector3(0, 2.2, 0));
          y.addLamp({ pos: $, color: 16722452, range: 9, energy: 1.6, kind: 'fire', id: 'bull' });
        } else B && (B.on = O === 'active');
      }
      return R.set(L, O);
    },
    addObject(L) {
      let O = R.flames.length,
        B = R.create(L);
      for (let $ of R.flames.slice(O)) y.addFire($);
      return (
        B && L.type === 'campfire' && w.onFire(L.id, B.userData.state !== 'out'),
        B || R.anchors.get(L.id) || null
      );
    },
    setObjectGlow(L, O) {
      R.setGlow(L, O);
    },
    setGrid(L) {
      ve = L;
    },
    setCombatView(L) {
      K = !!L;
    },
    setQuality(L) {
      t.level = L;
      for (let B of M.groups) B.name?.startsWith('hierba') && (B.visible = L > 0 || B.userData.keep);
      y.maxLights = L === 0 ? 2 : L === 1 ? 4 : y.lights.length;
      for (let B of y.systems) /humo|smoke|ember/.test(B.name) && (B.visible = L > 0);
      let O = L === 0 ? 512 : L === 1 ? 1024 : g.sun.shadow.mapSize.x;
      g.sun.shadow.mapSize.x > O &&
        (g.sun.shadow.mapSize.set(O, O), g.sun.shadow.map?.dispose(), (g.sun.shadow.map = null));
    },
    setTimeOfDay(L, O = 2.5) {
      TIMES[L] && ((N.timeOfDay = L), g.set(L, O));
    },
    fadeOccluders(L, O = []) {
      let B = new Set(),
        $ = L.position;
      for (let ee of O) {
        let be = ee.isObject3D ? ee.getWorldPosition(ue) : ue.copy(ee),
          Ce = oe
            .copy(be)
            .setY(be.y + 0.9)
            .sub($),
          ze = Ce.length();
        (Ce.normalize(), ce.ray.set($, Ce));
        for (let W of J)
          if (!(Math.abs(W.pos.x - be.x) > 14 || Math.abs(W.pos.z - be.z) > 14))
            if (W.kind === 'building') {
              let De = ce.ray.intersectBox(W.box, we);
              ((De && $.distanceTo(De) < ze - 0.5) || (K && W.box.distanceToPoint(be) < 2.5)) && B.add(W);
            } else {
              let De = ie
                  .copy(W.pos)
                  .setY(W.pos.y + W.h * 0.6)
                  .sub($),
                rt = De.dot(Ce);
              if (rt <= 0 || rt > ze + 2) continue;
              if ((W.pos.x - be.x) ** 2 + (W.pos.z - be.z) ** 2 < (3.5 + W.r * 0.3) ** 2) {
                B.add(W);
                continue;
              }
              if (rt > ze - 0.3) continue;
              De.addScaledVector(Ce, -rt).length() < W.r * (K ? 1.25 : 1) + 0.5 && B.add(W);
            }
      }
      for (let ee of J) {
        let be = B.has(ee) ? 0.2 : 1,
          Ce = Z.get(ee) ?? 1;
        Ce !== be && (Z.set(ee, be), (ee.target = be), ee.cur || (ee.cur = Ce));
      }
    },
    update(L, O, B) {
      if (
        ((No.uTime.value = O),
        (No.uSquash.value += ((K ? 0.45 : 1) - No.uSquash.value) * Math.min(1, L * 3)),
        f.uniforms && (f.uniforms.uGrid.value += (ve - f.uniforms.uGrid.value) * Math.min(1, L * 5)),
        B)
      ) {
        let $ = B.getWorldDirection(ue);
        if ($.y < -0.05) {
          let ee = (B.position.y - 0) / -$.y;
          (ge.copy(B.position).addScaledVector($, ee),
            (ge.x = Math.max(f.x0, Math.min(f.x1, ge.x))),
            (ge.z = Math.max(f.z0, Math.min(f.z1, ge.z))));
        }
        (A && A.updateCutaway($), g.dome.position.copy(B.position));
      }
      (g.update(L, O, ge, B ? B.position.distanceTo(ge) : 0),
        s?.grade && s.grade.uniforms.uTint.value.copy(g.cur.tint),
        I?.update(O),
        R.update(L));
      for (let $ of T) $.update?.(L);
      y.update(L, O, B || { fov: 32 }, ge, innerHeight);
      for (let $ of J) {
        if ($.target == null) continue;
        let ee = $.cur ?? 1,
          be = ee + ($.target - ee) * Math.min(1, L * 6),
          Ce = Math.abs(be - $.target) < 0.01 ? $.target : be;
        (($.cur = Ce),
          $.kind === 'building'
            ? No.uBld.value[$.idx].set(Ce, Ce)
            : $.attr && (($.attr.array[$.i] = Ce), ($.attr.needsUpdate = !0)),
          Ce === $.target && $.target === 1 && ($.target = null));
      }
    },
    dispose() {
      o.remove(b);
      for (let O of [g.sun, g.sun.target, g.bounce, g.bounce.target, g.hemi, g.dome]) o.remove(O);
      ((o.fog = null), (o.background = null));
      let L = new Set();
      b.traverse((O) => {
        if (O.isMesh || O.isPoints || O.isInstancedMesh) {
          O.geometry?.dispose();
          for (let B of Array.isArray(O.material) ? O.material : [O.material])
            for (let $ of ['map', 'emissiveMap', 'alphaMap']) B?.[$]?.isCanvasTexture && L.add(B[$]);
        }
      });
      for (let O of L) O.dispose();
      (f.dispose(), y.dispose(), g.dispose());
      for (let O of No.uBld.value) O.set(1, 1);
    },
  };
  if (a?.flag)
    for (let L of e.objects || [])
      (L.hidden_until && a.flag(L.hidden_until) && N.setObjectState(L.id, 'revealed'),
        L.type === 'campfire' && L.requires && a.flag(L.requires) && N.setObjectState(L.id, 'lit'));
  return N;
}
const q9 = {
  dusk: 'dusk',
  day: 'day',
  forest: 'forest',
  night: 'night',
  crypt: 'crypt',
  kesh: 'kesh',
  inn: 'inn',
};
const U9 = new Set([
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
