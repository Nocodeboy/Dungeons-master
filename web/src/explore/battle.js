// explore/battle.js — Paso de la exploración al combate y vuelta, en el mismo mundo: prepara la escena
// (rejilla, PNJ ocultos, animales que huyen), llama a battle_start y a combat/runBattle, y al terminar
// reparte botín, banderas, diario, PX y subida de nivel, o gestiona la derrota. Si falta el área de
// combate o el núcleo, usa un combate automático con la IA del núcleo o uno simulado en JS.
// Lo usan explore/index.js, detection.js e interact.js.
// Reconstruido de publicado/juego.js (módulo __esm «p0»).

import { MathUtils } from 'three';
import { hexDistance } from './hex.js';
import { rollDice } from './checks.js';

/** Llama a `fn(k)` con k de 0 a 1 durante `seconds` (en requestAnimationFrame); promesa al acabar. */
function tween(seconds, fn) {
  return new Promise((resolve) => {
    let t0 = performance.now(),
      step = () => {
        let k = Math.min(1, (performance.now() - t0) / (seconds * 1e3));
        (fn(k), k < 1 ? requestAnimationFrame(step) : resolve());
      };
    step();
  });
}
/** Mueve un actor por una lista de casillas a `speed` m/s con la animación `anim`. */
function walkPath(explore, actor, cells, { speed = 3.8, anim = 'run' } = {}) {
  if (!cells.length) return Promise.resolve();
  actor.anim(anim, { mps: speed });
  let points = cells.map((c) => explore.world.cellToWorld(c));
  return new Promise((resolve) => {
    let last = performance.now(),
      step = () => {
        let now = performance.now(),
          dt = Math.min(0.05, (now - last) / 1e3) * (explore.turbo || 1);
        last = now;
        let pos = actor.root.position,
          left = speed * dt;
        for (; left > 0 && points.length;) {
          let pt = points[0],
            dx = pt.x - pos.x,
            dz = pt.z - pos.z,
            dist = Math.hypot(dx, dz);
          (dist > 1e-4 && (actor.root.rotation.y = Math.atan2(dx, dz)),
            dist <= left
              ? (pos.set(pt.x, pt.y, pt.z), points.shift(), (left -= dist))
              : ((pos.x += (dx / dist) * left), (pos.z += (dz / dist) * left), (left = 0)));
        }
        (explore.world.heightAt && (pos.y = explore.world.heightAt(pos.x, pos.z)),
          points.length && !explore.disposed
            ? requestAnimationFrame(step)
            : (actor.anim('idle', { fade: 0.25 }), resolve()));
      };
    step();
  });
}
/** Gira `actor` para que mire a `target`. */
function faceActor(actor, target) {
  let from = actor.root.position,
    to = target.root.position;
  Math.abs(from.x - to.x) + Math.abs(from.z - to.z) > 0.001 &&
    (actor.root.rotation.y = Math.atan2(to.x - from.x, to.z - from.z));
}
/**
 * El jugador ataca a un enemigo: si su grupo quiere hablar, conversación; si no, combate
 * (con sorpresa si el grupo iba en sigilo sin ser visto).
 */
async function attackEnemy(explore, id) {
  let enemy = explore.enemy(id);
  if (!enemy) return;
  let group = explore.groups.get(enemy.group);
  if (!group) return;
  let sight = group.def.sight ?? 8,
    seen = explore.members.some((m) =>
      group.enemies.some(
        (en) => !en.dead && hexDistance(en.cell, m.cell) <= sight && explore.xmap.los(en.cell, m.cell),
      ),
    ),
    surprise = explore.stealth && (group.roll ? group.roll.success : !seen),
    detection = await import('./detection.js');
  if (detection.wantsTalk(explore, group))
    return detection.talkGroup(explore, group.def.id, enemy, { stealth: surprise });
  let hidden = {};
  if (surprise) for (let r of group.roll?.results || []) r.success && (hidden[r.who] = r.total);
  await startBattle(explore, group.def.id, { surprise, hidden });
}
/**
 * Empieza el combate contra el grupo `gid` (y los grupos enlazados). Opciones: `surprise` (el grupo
 * sorprende), `surprisedParty` (ids sorprendidos del grupo), `hidden` (totales de sigilo) y `ambush`.
 * Devuelve {won, fled}.
 */
async function startBattle(
  explore,
  gid,
  { surprise = !1, surprisedParty = [], hidden = {}, ambush = !1 } = {},
) {
  if (explore.inBattle || !explore.groups.has(gid) || explore.disposed)
    return { won: !1, fled: !1, error: 'no hay combate' };
  let group = explore.groups.get(gid),
    game = explore.game,
    rules = explore.rules;
  (explore.stopAll(),
    (explore.inBattle = !0),
    explore.busyN++,
    explore.overlay.setLabel(null),
    explore.overlay.clearBubbles(),
    explore.marks.setHover(null),
    explore.marks.hideRings(!0),
    explore.marks.clearDestination(),
    explore.hud?.hide?.(),
    (game.stage.renderer.domElement.style.cursor = ''));
  let gids = [gid, ...(group.def.link || []).filter((id) => explore.groups.has(id) && id !== gid)],
    groups = gids.map((id) => explore.groups.get(id));
  await Promise.all(groups.map((g) => g.ready));
  for (let g of groups)
    (g.hidden && (await import('./detection.js')).revealGroup(explore, g.def.id), (g.alerted = !0));
  game.bus.emit('battle:start', {
    group: gid,
    groups: gids,
    surprise,
    level: explore.levelId,
    ambush,
    surprisedParty,
  });
  let gridAlpha = explore.level.ambient === 'crypt' ? 0.28 : 0.35;
  (tween(0.6, (k) => explore.world.setGrid?.(k * gridAlpha)), explore.world.setCombatView?.(!0));
  for (let m of explore.members) m.actor.setShadowed(!1);
  for (let npc of explore.npcs.values()) {
    let root = npc.actor.root,
      scale0 = root.scale.x;
    ((npc.scale0 = scale0),
      tween(0.45, (k) => root.scale.setScalar(scale0 * Math.max(0.001, 1 - k))).then(
        () => (root.visible = !1),
      ));
  }
  let combatants = [
    ...explore.members.map((m) => m.actor),
    ...groups.flatMap((g) => g.enemies.filter((en) => !en.dead).map((en) => en.actor)),
  ];
  (explore.animals?.flee(combatants.map((a) => a.root.position)),
    await Promise.all(
      explore.members.map((m) => {
        let from = m.actor.root.position.clone(),
          to = explore.world.cellToWorld(m.cell);
        return (m.actor.anim('idle'), tween(0.25, (k) => m.actor.root.position.lerpVectors(from, to, k)));
      }),
    ),
    surprise &&
      !explore.mods.combat &&
      explore.hud?.banner?.('\xA1Los cog\xE9is por sorpresa!', 'bien', 1600));
  let cp = game.store.cp,
    party = explore.members.map((m) => ({
      id: m.id,
      cell: m.cell.slice(),
      face: Math.round(radToDeg(m.actor.root.rotation.y)),
    })),
    enemies = groups.flatMap((g) =>
      g.enemies
        .filter((en) => !en.dead)
        .map((en) => ({
          id: en.id,
          monster: en.monster,
          cell: en.cell.slice(),
          face: Math.round(radToDeg(en.actor.root.rotation.y)),
          group: g.def.id,
        })),
    ),
    encounter = {
      id: gid,
      name: group.def.name || '\xA1Combate!',
      place: explore.level.name,
      tips: group.def.tips || [],
      ambient: explore.level.ambient || 'dusk',
      level: cp.party_level || 1,
      sunlight: explore.level.ambient === 'day',
    },
    surprised = surprise ? enemies.map((en) => en.id) : surprisedParty.slice(),
    seed = Number(game.params?.get?.('semilla')) || Math.floor(Math.random() * 1e9),
    cpBefore = null;
  try {
    cpBefore = structuredClone(cp);
  } catch {
    cpBefore = JSON.parse(JSON.stringify(cp));
  }
  let keysWas = game.ui?.keys?.disabled,
    init = rules.call('battle_start', {
      cp,
      rows: explore.xmap.rows,
      party,
      enemies,
      group: gid,
      encounter,
      surprised,
      surprise: surprise || void 0,
      hidden,
      seed,
    });
  init?.cp && rules.apply(init);
  let actors = new Map();
  for (let m of explore.members) actors.set(m.id, m.actor);
  for (let g of groups) for (let en of g.enemies) en.dead || actors.set(en.id, en.actor);
  let result = { won: !1, fled: !1 },
    native = init && !init.error && init.state;
  try {
    if (native && explore.mods.combat) {
      explore.camera.suspended = !0;
      let auto = game.params?.has?.('autocombate')
        ? new Set(explore.members.map((m) => m.id))
        : game.store.settings.autoCompanions !== !1
          ? new Set(explore.members.filter((m) => m.id !== 'hero').map((m) => m.id))
          : void 0;
      result =
        (await explore.mods.combat.runBattle(game, {
          three: explore.three,
          world: explore.world,
          actors,
          init,
          hud: explore.hud,
          group: gid,
          groups: gids,
          surprise,
          surprised,
          level: explore.levelId,
          auto,
          portrait: (c) =>
            explore.portraits.get(c.id) ||
            game.ui.portrait?.(c.id) ||
            explore.factory.portrait(actors.get(c.id), {
              ...explore.rules.sheet(c.id),
              id: c.id,
              name: c.name || explore.rules.name(c.id),
            }),
          makeMonster: (c) => explore.factory.monster(c.template || c.monster, c.id),
          makeForm: (kind, id) => explore.factory.monster(kind, id),
        })) || result;
    } else
      native
        ? (result = await autoBattle(explore, init, actors))
        : (result = await simulatedBattle(explore, groups, actors));
  } catch (err) {
    return (
      console.error('[exploraci\xF3n] el combate ha fallado', err),
      recoverFromError(explore, gid, gids, {
        cpBefore,
        keysWas,
        error: String(err?.message || err),
        args: { surprise, surprisedParty, hidden, ambush },
      })
    );
  }
  return finishBattle(explore, gid, gids, result, native);
}
/** Si el combate falla: restaura la campaña de antes y ofrece repetirlo, cargar o retirarse. */
async function recoverFromError(explore, gid, gids, { cpBefore, keysWas, error, args }) {
  let game = explore.game;
  (game.battle && (game.battle = null),
    game.ui?.keys && keysWas !== void 0 && (game.ui.keys.disabled = keysWas),
    cpBefore && game.store.set(cpBefore));
  for (let actor of [
    ...explore.members.map((m) => m.actor),
    ...gids.flatMap(
      (id) =>
        explore.groups
          .get(id)
          ?.enemies.filter((en) => !en.dead)
          .map((en) => en.actor) || [],
    ),
  ])
    actor &&
      (actor.ch && (actor.ch._mdgDown = !1),
      (actor.root.visible = !0),
      (actor.cur = null),
      actor.anim('idle', { fade: 0.2 }));
  if (
    (game.bus.emit('ui:error', { what: 'battle', error }),
    await finishBattle(explore, gid, gids, { won: !1, fled: !0 }, !1, { quiet: !0 }),
    explore.disposed)
  )
    return { won: !1, fled: !0, error };
  let choice = await explore.choose({
    speaker: 'Algo ha fallado',
    text: `*El combate se ha interrumpido por un error del juego. Todo ha vuelto a como estaba justo antes de empezar.*

(${error})`,
    options: [
      { text: 'Volver a empezar el combate', value: 'retry' },
      { text: 'Cargar la \xFAltima partida autom\xE1tica', value: 'load' },
      { text: 'Retirarse por ahora', kind: 'end', value: null },
    ],
  });
  if (choice === 'retry' && explore.groups.has(gid)) return startBattle(explore, gid, args);
  if (choice === 'load') {
    let saved = await game.store.load('auto');
    saved?.location?.level &&
      ((game.store.cp = game.rules?.('cp_load', { cp: saved })?.cp || saved),
      game.go('explore', { level: saved.location.level, spawn: 'saved' }));
  }
  return { won: !1, fled: !0, error };
}
/**
 * Cierre del combate: battle_end, muertos, botín, banderas, historia (afterBattle), PX, subida de
 * nivel y guardado automático. `native` indica si el combate fue del núcleo.
 */
async function finishBattle(explore, gid, gids, result, native, { quiet = !1 } = {}) {
  let game = explore.game,
    rules = explore.rules,
    won = !!result.won,
    fled = !!result.fled,
    end = null,
    loot = gids.flatMap((id) => explore.groups.get(id)?.def.loot || []);
  (native &&
    ((end = rules.call('battle_end', { cp: game.store.cp, won, loot: won ? loot : [] })),
    end?.cp && rules.apply(end)),
    (explore.camera.suspended = !1),
    explore.camera.configure());
  for (let id of end?.enemies_dead || []) {
    let en = explore.enemy(id);
    en && (en.dead = !0);
  }
  game.bus.emit('battle:end', { group: gid, groups: gids, won, fled, level: explore.levelId });
  for (let m of explore.members) m.cell = explore.world.worldToCell(m.actor.root.position);
  if (
    (tween(0.8, (k) => explore.world.setGrid?.((1 - k) * 0.35)).then(() => explore.world.setGrid?.(0)),
    explore.world.setCombatView?.(!1),
    !won && !fled)
  )
    return defeat(explore, null);
  let cp = game.store.cp;
  if (won && rules.state('hero').dead)
    return defeat(
      explore,
      'Tus compa\xF1eros han ganado el combate, pero t\xFA no has sobrevivido. Sin la Marca, nadie sabr\xE1 qu\xE9 duerme bajo el toro\u2026',
    );
  for (let npc of explore.npcs.values()) {
    let root = npc.actor.root;
    root.visible = !0;
    let scale0 = npc.scale0 ?? 1;
    tween(0.45, (k) => root.scale.setScalar(scale0 * Math.max(0.001, k)));
  }
  let defs = gids.map((id) => explore.groups.get(id)?.def).filter(Boolean),
    drops = [];
  if (won) {
    let lastCell = null;
    for (let id of gids) {
      let group = explore.groups.get(id);
      if (group) {
        explore.ls.dead.includes(id) || explore.ls.dead.push(id);
        for (let en of group.enemies) {
          ((en.cell = explore.world.worldToCell(en.actor.root.position)), (lastCell = en.cell));
          let spared = !!end?.captured?.[en.id] || (end?.enemies_alive || []).includes(en.id);
          (!end && !spared && drops.push(...rules.drops(en.monster)),
            en.dead ||
              ((en.dead = !0), !en.actor.ch?._mdgDown && !spared && en.actor.once('die', { hold: !0 })));
        }
        if (!end)
          for (let entry of group.def.loot || [])
            drops.push({ id: entry[0], n: entry[1] ?? 1, unid: rules.unidentified(entry[0]) });
        ((explore.corpses ??= []), explore.corpses.push(...group.enemies), explore.groups.delete(id));
      }
    }
    if (
      (end?.loot && (drops = end.loot.map((it) => ({ id: it.id, n: it.n ?? 1, unid: !!it.unid }))),
      (drops = mergeLoot(drops)),
      drops.length && lastCell)
    ) {
      let dropId = `drop_${gid}`,
        cell = lastCell;
      explore.xmap.walkable(cell) || (cell = explore.xmap.freeNear(cell, 1)[0] || cell);
      let obj = { id: dropId, type: 'loot', cell, name: 'Restos del combate' };
      ((explore.ls.drops[dropId] = obj), (explore.ls.loot[dropId] = drops), explore.addObject(obj));
    }
  } else
    for (let id of gids) {
      let group = explore.groups.get(id);
      if (group) {
        ((group.alerted = !1), (group.cooldown = 12));
        for (let en of group.enemies)
          ((en.cell = explore.world.worldToCell(en.actor.root.position)),
            !en.dead && en.actor.cur == null && en.actor.anim('idle'));
      }
    }
  await explore.rebuildParty();
  for (let m of explore.members)
    ((m.actor.cur = null),
      m.actor.anim(explore.stealth ? 'crouch' : 'idle', { fade: 0.4 }),
      m.actor.setShadowed(explore.stealth));
  ((explore.inBattle = !1),
    (explore.busyN = Math.max(0, explore.busyN - 1)),
    explore.marks.hideRings(!1),
    explore.updateRings(),
    explore.hud?.show?.());
  let handled = !1;
  try {
    handled = !!(await game.story?.afterBattle?.({
      group: gid,
      groups: gids,
      won,
      fled,
      level: explore.levelId,
      explore: game.explore,
    }));
  } catch (err) {
    console.error('[exploraci\xF3n] story.afterBattle', err);
  }
  if (won) {
    let first = defs[0] || {};
    for (let def of defs) def.flag && !game.store.flag(def.flag) && game.store.setFlag(def.flag, !0);
    for (let def of defs) def.journal && explore.addJournal(def.journal);
    (drops.length && explore.toast('Han dejado algo: mirad los restos del combate.', 'botin', 5e3),
      end?.xp && explore.toast(`+${end.xp} PX`, 'oro'),
      first.after && !handled && (await explore.narrate(first.after)),
      await explore.refreshWorld(),
      first.level_after &&
        first.level_after > (game.store.cp.party_level || 1) &&
        (await levelUp(explore, first.level_after)),
      first.story_after &&
        (await explore.narrate(first.story_after, { title: first.story_title || explore.level.name })));
  } else
    quiet || explore.toast('Os retir\xE1is. Los enemigos no os siguen\u2026 de momento.', 'apagado', 5e3);
  return (explore.updateHud(), quiet || game.store.save('auto'), { won, fled });
}
/** Junta en una sola entrada los objetos apilables iguales (oro, flechas, monedas…). */
function mergeLoot(items) {
  let out = [];
  for (let it of items) {
    let same = !it.unid && out.find((x) => x.id === it.id && !x.unid);
    same && (it.id === 'gold' || /arrows|bolts|coin|charm|pelt|gem|potion|ration|torch/.test(it.id))
      ? (same.n += it.n)
      : out.push({ ...it });
  }
  return out;
}
/** Sube el grupo de nivel: pantalla «nivel», o cp_level_up, o un sustituto que recalcula los PG. */
async function levelUp(explore, level) {
  let game = explore.game,
    rules = explore.rules;
  if (
    (explore.hud?.banner?.(`\xA1Nivel ${level}!`, '', 1800),
    await sleep(1500),
    explore.hasScreen('nivel') && !game.params?.has?.('autonivel'))
  )
    await explore.openScreen('nivel', { level });
  else {
    let res = rules.call('cp_level_up', { cp: game.store.cp, level });
    if (res?.cp) rules.apply(res);
    else {
      rules.fallback('cp_level_up');
      let cp = game.store.cp,
        oldMax = {};
      for (let id of cp.party) oldMax[id] = rules.hp(id).max;
      cp.party_level = level;
      for (let id of cp.party) {
        let st = rules.state(id);
        delete st.max_hp;
        let max = rules.maxHpGuess(id);
        ((st.max_hp = max),
          (st.hp = Math.min(max, (st.hp ?? max) + (max - oldMax[id]))),
          (st.hit_dice = level));
      }
      game.store.set(cp);
    }
    (explore.toast(`El grupo sube a nivel ${level}.`, 'oro', 5e3), game.bus.emit('levelup', { level }));
  }
  await explore.rebuildParty();
}
/** Derrota: pantalla «derrota» o diálogo para cargar la partida automática o volver al menú. */
async function defeat(explore, text) {
  let game = explore.game;
  if (
    ((explore.inBattle = !1),
    (explore.busyN = Math.max(0, explore.busyN - 1)),
    game.bus.emit('game:over', { level: explore.levelId, text }),
    explore.hasScreen('derrota'))
  )
    return (await game.ui.open('derrota', { text, level: explore.levelId }), { won: !1, fled: !1 });
  let saved =
    (await explore.choose({
      speaker: 'Derrota',
      text: `*${text || 'El \xFAltimo de vosotros cae. La oscuridad se cierra sobre el prado y, muy por debajo, algo sonr\xEDe.'}*`,
      options: [
        { text: 'Cargar la \xFAltima partida autom\xE1tica', value: 'load' },
        { text: 'Volver al men\xFA principal', kind: 'end', value: 'menu' },
      ],
    })) === 'load'
      ? await game.store.load('auto')
      : null;
  return (
    saved?.location?.level
      ? ((game.store.cp = game.rules?.('cp_load', { cp: saved })?.cp || saved),
        game.go('explore', { level: saved.location.level, spawn: 'saved' }))
      : game.go('menu'),
    { won: !1, fled: !1 }
  );
}
/** Un grupo enemigo se marcha (tras hablar, o huyendo con `flee`) y desaparece del nivel. */
async function withdrawGroup(explore, gid, { flee = !1 } = {}) {
  let group = explore.groups.get(gid);
  if (!group) return;
  (await group.ready, explore.ls.gone.includes(gid) || explore.ls.gone.push(gid), explore.groups.delete(gid));
  let lead = explore.lead(),
    moves = group.enemies
      .filter((en) => !en.dead && en.actor)
      .map(async (en) => {
        let dest = explore.xmap
          .freeNear(en.cell, 30, explore.blocked(!0), { maxR: 9 })
          .sort((a, b) => hexDistance(b, lead?.cell || en.cell) - hexDistance(a, lead?.cell || en.cell))[0];
        if (dest) {
          let path = explore.xmap.path(en.cell, dest, explore.blocked(!0)).slice(1, 9);
          await walkPath(explore, en.actor, path, { speed: flee ? 4.2 : 2.2, anim: flee ? 'run' : 'walk' });
        }
        let root = en.actor.root,
          scale0 = root.scale.x;
        (await tween(0.5, (k) => root.scale.setScalar(scale0 * Math.max(0.001, 1 - k))), en.actor.dispose());
      });
  await Promise.all(moves);
}
/** Combate automático (sin el área de combate): turnos del núcleo con ai_turn hasta que acabe. */
async function autoBattle(explore, init, actors) {
  let rules = explore.rules;
  explore.toast(
    'Combate autom\xE1tico (sustituto: el combate t\xE1ctico de Combate todav\xEDa no est\xE1 enganchado).',
    'apagado',
    6e3,
  );
  let log = [],
    state = init.state;
  await playEvents(explore, init.events || [], actors, log);
  let guard = 0;
  for (; state && !state.over && guard++ < 600 && !explore.disposed;) {
    let cur = (state.creatures || []).find((c) => c.id === state.current);
    if (cur && cur.hp > 0 && !cur.dead) {
      let actor = actors.get(cur.id);
      actor && explore.camera.focus(actor.root.position);
      let res = rules.call('ai_turn');
      await playEvents(explore, res?.events || [], actors, log);
    }
    if (((state = rules.call('state')), !state || state.over)) break;
    let res = rules.call('end_turn');
    (await playEvents(explore, res?.events || [], actors, log), (state = rules.call('state')));
  }
  return (await sleep(500 / (explore.turbo || 1)), { won: state?.winner === 0, fled: !1, events: log });
}
/** Representa los eventos del núcleo (move, attack, damage, heal, cast, death…) con animaciones. */
async function playEvents(explore, events, actors, log) {
  let wait = (ms) => sleep(ms / (explore.turbo || 1));
  for (let ev of events) {
    (log.push(ev), explore.game.bus.emit('battle:event', { ev }));
    let actor = ev.who ? actors.get(ev.who) : null;
    try {
      switch (ev.t) {
        case 'turn':
          explore.game.bus.emit('battle:turn', { creature: ev.who, isPc: !!explore.member(ev.who) });
          break;
        case 'move': {
          if (!actor) break;
          let path = (ev.path || []).slice(1);
          await walkPath(explore, actor, path, { speed: ev.dash ? 5 : 3.6 });
          let m = explore.member(ev.who);
          m && path.length && (m.cell = path[path.length - 1].slice());
          let en = explore.enemy(ev.who);
          en && path.length && (en.cell = path[path.length - 1].slice());
          break;
        }
        case 'attack': {
          let target = actors.get(ev.target);
          if (!actor || !target) break;
          faceActor(actor, target);
          let anim = actor.once(ev.kind === 'melee' ? 'attack_melee' : 'attack_ranged', { speed: 1.3 });
          (await wait(380),
            ev.hit
              ? target.once('hit', { speed: 1.2 })
              : explore.overlay.float(
                  (v) => target.head(v),
                  ev.natural === 1 ? 'Pifia' : 'Falla',
                  'apagado',
                  { dur: 1 },
                ),
            await anim);
          break;
        }
        case 'damage':
          (actor &&
            ev.amount > 0 &&
            explore.overlay.float((v) => actor.head(v), `${ev.amount}`, explore.member(ev.who) ? 'mal' : '', {
              dur: 1.1,
              size: ev.crit ? 1.4 : 1.1,
            }),
            await wait(150));
          break;
        case 'heal':
          actor &&
            ev.amount > 0 &&
            explore.overlay.float((v) => actor.head(v), `+${ev.amount}`, 'bien', { dur: 1.1 });
          break;
        case 'cast':
          actor &&
            (explore.overlay.float((v) => actor.head(v), ev.name || 'Conjuro', 'magia', { dur: 1.1 }),
            await actor.once('cast', { speed: 1.3 }));
          break;
        case 'downed':
        case 'death':
          if (actor) {
            ((actor.ch._mdgDown = !0), actor.once('die', { hold: !0 }));
            let en = explore.enemy(ev.who);
            en && ev.t === 'death' && (en.dead = !0);
            let m = explore.member(ev.who);
            m && (m.down = !0);
          }
          await wait(400);
          break;
        case 'revive':
        case 'stand':
          actor && ((actor.ch._mdgDown = !1), (actor.cur = null), actor.anim('idle'));
          break;
        default:
          break;
      }
    } catch (err) {
      console.warn('[exploraci\xF3n] evento', ev.t, err);
    }
  }
}
/** Combate simulado en JS (sin battle_start en el núcleo): golpes simples hasta que caiga un bando. */
async function simulatedBattle(explore, groups, actors) {
  let rules = explore.rules;
  (explore.rules.fallback('battle_start'),
    explore.toast(
      'Combate simulado (sustituto: el n\xFAcleo todav\xEDa no tiene battle_start).',
      'apagado',
      6e3,
    ));
  let enemies = groups.flatMap((g) => g.enemies.filter((en) => !en.dead)),
    hp = new Map(enemies.map((en) => [en.id, rules.monster(en.monster).hp || 8])),
    level = rules.level(),
    partyHp = explore.members.reduce((sum, m) => sum + rules.hp(m.id).hp, 0),
    rounds = 0;
  for (; enemies.some((en) => !en.dead) && partyHp > 0 && rounds++ < 30 && !explore.disposed;) {
    for (let m of explore.members) {
      let target = enemies.find((en) => !en.dead);
      if (!target) break;
      (faceActor(m.actor, target.actor), explore.camera.focus(target.actor.root.position));
      let anim = m.actor.once('attack_melee', { speed: 1.4 });
      await sleep(300 / (explore.turbo || 1));
      let dmg = rules.d20() + 3 >= 13 ? rollDice('1d8', rules.rng) + 2 + level : 0;
      (dmg
        ? (target.actor.once('hit'),
          explore.overlay.float((v) => target.actor.head(v), `${dmg}`, '', { dur: 1 }),
          hp.set(target.id, hp.get(target.id) - dmg),
          hp.get(target.id) <= 0 &&
            ((target.dead = !0), (target.actor.ch._mdgDown = !0), target.actor.once('die', { hold: !0 })))
        : explore.overlay.float((v) => target.actor.head(v), 'Falla', 'apagado', { dur: 1 }),
        await anim);
    }
    for (let en of enemies.filter((en) => !en.dead)) {
      let target = explore.members[Math.floor(rules.rng() * explore.members.length)];
      faceActor(en.actor, target.actor);
      let anim = en.actor.once('attack_melee', { speed: 1.4 });
      if ((await sleep(250 / (explore.turbo || 1)), rules.d20() + 4 >= 14)) {
        let dmg = rollDice('1d6', rules.rng) + 1;
        partyHp -= dmg;
        let st = rules.state(target.id);
        ((st.hp = Math.max(1, rules.hp(target.id).hp - dmg)),
          target.actor.once('hit'),
          explore.overlay.float((v) => target.actor.head(v), `${dmg}`, 'mal', { dur: 1 }));
      }
      await anim;
    }
  }
  return (explore.game.store.set(explore.game.store.cp), { won: partyHp > 0, fled: !1 });
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const radToDeg = MathUtils.radToDeg;

export { withdrawGroup, attackEnemy, startBattle };
