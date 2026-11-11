// combat/index.js — Entrada del área de combate: `runBattle` monta un combate sobre el mundo actual.
// A partir del estado inicial del núcleo (battle_start), crea los efectos (vfx), las unidades (figuras de la
// exploración o monstruos nuevos), la superposición del tablero, el HUD y el controlador de turnos; ejecuta el
// combate hasta el final y lo desmonta. No cambia de escena. Lo carga explore/battle.js con loadArea('combat');
// sus exports conservan el nombre original (módulo con espacio de nombres). Con ?depurar expone
// window.__combate = {ctl, vfx, units, board, hud}.

import { Vector3 } from 'three';
import { createVfx } from '../vfx/index.js';
import { cellToWorld, planeToCell, HEX_SIZE } from '../explore/hex.js';
import { Overlay } from './overlay.js';
import { Hud } from './hud.js';
import { Controller } from './controller.js';
import { p3 } from './units.js';

/** Rectángulo en el mundo (minX, maxX, minZ, maxZ) que ocupan las esquinas del mapa. */
function boardBounds(map, toWorld) {
  let corners = [
    [0, 0],
    [map.w - 1, 0],
    [0, map.h - 1],
    [map.w - 1, map.h - 1],
  ].map((cell) => toWorld(cell));
  return {
    minX: Math.min(...corners.map((p) => p.x)),
    maxX: Math.max(...corners.map((p) => p.x)),
    minZ: Math.min(...corners.map((p) => p.z)),
    maxZ: Math.max(...corners.map((p) => p.z)),
  };
}
/** Ids de las criaturas sorprendidas: lista explícita o «enemies»/«party» (también en español). */
function surprisedIds(opts, creatures) {
  if (Array.isArray(opts.surprised)) return opts.surprised;
  let surprise = opts.surprise;
  return surprise === !0 || surprise === 'enemies' || surprise === 'enemigos'
    ? creatures.filter((c) => c.team !== 0).map((c) => c.id)
    : surprise === 'party' || surprise === 'grupo'
      ? creatures.filter((c) => c.team === 0).map((c) => c.id)
      : [];
}
/**
 * Ejecuta un combate completo sobre el mundo.
 * @param {object} game contexto del juego
 * @param {object} opts three (escena), world, actors (figuras existentes), init (respuesta de battle_start),
 *   group/groups, surprise, level, auto, mount, portrait, makeMonster, makeForm, manageWorld, emitStartEnd
 * @returns {Promise<object>} resultado de Controller.run (won, fled…)
 */
async function runBattle(game, opts = {}) {
  let { three: scene, world = null, actors = null, init } = opts;
  if (!init || !init.state) throw new Error('runBattle: falta init.state');
  let stage = game.stage,
    toWorld = world?.cellToWorld ? (cell) => world.cellToWorld(cell, new Vector3()) : (cell) => cellToWorld(cell[0], cell[1]),
    pick = world?.pick ? (raycaster) => world.pick(raycaster) : null,
    map = init.state.map || { w: 0, h: 0, rows: [] };
  !map.w && map.rows?.length && ((map.h = map.rows.length), (map.w = map.rows[0].length));
  let bounds = map.w
    ? boardBounds(map, toWorld)
    : world?.bounds
      ? { minX: world.bounds.min.x, maxX: world.bounds.max.x, minZ: world.bounds.min.z, maxZ: world.bounds.max.z }
      : null;
  opts.manageWorld && (world?.setGrid?.(0.35), world?.setCombatView?.(!0));
  let vfx = createVfx({
      scene,
      camera: stage.camera,
      quality: game.quality || stage.quality,
      cellToWorld: toWorld,
      grade: stage.grade,
    }),
    monsterCounts = new Map(),
    nextIndex = (template) => {
      let count = monsterCounts.get(template) || 0;
      return (monsterCounts.set(template, count + 1), count);
    },
    makeMissing =
      opts.makeMonster || game.actors?.makeMonster
        ? async (creature) => {
            let form = await (
              opts.makeMonster || ((c) => game.actors.makeMonster(c.template, { index: nextIndex(c.template) }))
            )(creature);
            if (form?.root) {
              let pos = toWorld(creature.cell);
              form.root.position.copy(pos);
            }
            return form;
          }
        : null,
    units = await p3(scene, init.state.creatures, actors, { cellToWorld: toWorld, makeMissing });
  if (world?.cellToWorld) {
    let groundAt = (x, z) => toWorld(planeToCell(x / HEX_SIZE, z / HEX_SIZE)).y;
    for (let unit of units.list) unit.groundAt = groundAt;
  }
  let board = new Overlay(scene, map, { cellToWorld: toWorld, pick });
  await vfx.prewarm(stage.renderer, scene);
  let mount = opts.mount || game.ui?.root || document.body,
    portrait =
      opts.portrait ||
      (game.actors?.portrait ? (unit) => game.actors.portrait(unit.inner || unit.ch || unit.id, { size: 96 }) : null),
    hud = new Hud(mount, { standalone: !1, portrait }),
    keys = game.ui?.keys,
    keysDisabled = keys ? keys.disabled : void 0;
  keys && (keys.disabled = !0);
  let controller = new Controller({
    rules: game.rules,
    stage,
    scene,
    hud,
    units,
    board,
    vfx,
    bus: game.bus,
    init,
    cellToWorld: toWorld,
    bounds,
    standalone: !1,
    shotMode: game.params?.has?.('captura'),
    surprised: surprisedIds(opts, init.state.creatures),
    meta: {
      group: opts.group,
      groups: opts.groups,
      surprise: opts.surprise,
      level: opts.level,
      auto: opts.auto,
      makeForm:
        opts.makeForm || (game.actors?.makeMonster ? (template) => game.actors.makeMonster(template, { index: nextIndex(template) }) : null),
      skipIntro: !0,
      emitStartEnd: !!opts.emitStartEnd,
      ui: game.ui,
    },
  });
  game.params?.has?.('turbo') && (controller.turbo = 5);
  let offQuality = game.bus?.on?.('quality:changed', ({ level }) => vfx.setLevel(level));
  game.params?.has?.('depurar') && (window.__combate = { ctl: controller, vfx, units, board, hud });
  let lastUpdate = 0,
    rafId = 0,
    lastFrame = performance.now(),
    battle = {
      controller,
      vfx,
      update(dt) {
        ((lastUpdate = performance.now()), step(dt));
      },
      afterRender(dt) {
        hud.place(stage.camera, stage.renderer.domElement, Math.min(dt, 0.1));
      },
    };
  function step(dt) {
    ((dt = Math.min(dt, controller.turbo > 1 ? 0.3 : 1 / 20)), units.update(dt), controller.update(dt), vfx.update(dt));
  }
  let tick = () => {
    if (!rafId) return;
    let now = performance.now(),
      dt = (now - lastFrame) / 1e3;
    ((lastFrame = now),
      now - lastUpdate > 150 && (step(dt), hud.place(stage.camera, stage.renderer.domElement, Math.min(dt, 0.1))),
      (rafId = requestAnimationFrame(tick)));
  };
  ((rafId = requestAnimationFrame(tick)), (game.battle = battle));
  let result;
  try {
    result = await controller.run();
  } finally {
    (cancelAnimationFrame(rafId), (rafId = 0), offQuality?.(), controller.dispose(), board.dispose());
    for (let unit of units.list) (unit.detach(), unit.owns && scene.remove(unit.root));
    (vfx.dispose(),
      hud.dispose(),
      keys && (keys.disabled = keysDisabled),
      opts.manageWorld && (world?.setGrid?.(0), world?.setCombatView?.(!1)),
      game.battle === battle && (game.battle = null));
  }
  return result;
}

export { Controller } from './controller.js';
export { Hud } from './hud.js';
export { boardBounds, runBattle };
