// explore/detection.js — Sigilo, percepción y emboscadas de la exploración: percepción pasiva de objetos
// ocultos, búsqueda activa, modo sigilo, detección del grupo por los enemigos (y al revés), emboscadas,
// grupos que hablan antes de luchar y disparadores de casillas del nivel.
// Todas las funciones reciben la instancia de Explore. Lo usan explore/index.js y battle.js (con import()
// dinámico: por eso sus nombres exportados son los del bundle publicado).
// Reconstruido de publicado/juego.js (módulo __esm «h0»).

import { Vector3 } from 'three';
import { hexDistance } from './hex.js';
import { storyInteract, revealObject } from './interact.js';
import { startBattle } from './battle.js';
import { SKILL_LABELS } from './checks.js';

/** Percepción pasiva de un miembro (las del grupo se calculan una vez y se guardan en `explore.pp`). */
function passivePerception(explore, id) {
  return (explore.pp || (explore.pp = explore.rules.passive('perception')), explore.pp[id] ?? 10);
}
/** Revela los objetos ocultos cercanos y a la vista que la percepción pasiva del miembro supera. */
function perceive(explore, member) {
  let pp = passivePerception(explore, member.id);
  for (let [id, obj] of explore.objects) {
    if (
      !obj.hidden ||
      explore.ls.found.includes(id) ||
      !explore.flag(obj.requires) ||
      !explore.flag(obj.hidden_until) ||
      !obj.cell
    )
      continue;
    let dist = hexDistance(member.cell, obj.cell);
    dist > PASSIVE_RANGE ||
      (dist > 1 && !explore.xmap.los(member.cell, obj.cell)) ||
      (pp >= (obj.hidden.dc ?? 15) && revealObject(explore, id, member.id, `Percepci\xF3n pasiva ${pp}`));
  }
}
/**
 * Búsqueda activa (botón «Buscar»): cada miembro tira Percepción o Investigación contra objetos
 * ocultos y grupos agazapados cercanos.
 */
async function search(explore) {
  if (explore.isBusy()) return;
  explore.stopAll();
  let rules = explore.rules;
  await explore.withBusy(async () => {
    let rolls = [],
      found = !1,
      anims = [];
    for (let m of explore.members) {
      let skill =
          rules.skillMod(m.id, 'perception') >= rules.skillMod(m.id, 'investigation')
            ? 'perception'
            : 'investigation',
        res = rules.check({ who: m.id, skill });
      (rolls.push(`${rules.shortName(m.id)} ${res.total}`),
        anims.push(m.actor.once('kneel', { speed: 1.4 })),
        explore.overlay.float(
          (v) => m.actor.head(v).add(new Vector3(0, 0.25, 0)),
          `${SKILL_LABELS[skill]} ${res.total}`,
          'apagado',
          { dur: 1.8 },
        ));
      for (let [id, obj] of explore.objects) {
        if (
          !obj.hidden ||
          explore.ls.found.includes(id) ||
          !explore.flag(obj.requires) ||
          !explore.flag(obj.hidden_until) ||
          !obj.cell
        )
          continue;
        let dist = hexDistance(m.cell, obj.cell);
        dist > SEARCH_RANGE ||
          (dist > 1 && !explore.xmap.los(m.cell, obj.cell)) ||
          (res.total >= (obj.hidden.dc ?? 15) &&
            (revealObject(explore, id, m.id, `${SKILL_LABELS[skill]} ${res.total}`), (found = !0)));
      }
      for (let [gid, group] of explore.groups) {
        if (!group.hidden) continue;
        let seen = group.enemies.some(
            (en) =>
              !en.dead &&
              hexDistance(en.cell, m.cell) <= SEARCH_RANGE * 2 &&
              explore.xmap.los(en.cell, m.cell),
          ),
          dc = 10 + Math.max(...group.enemies.map((en) => explore.rules.monster(en.monster).stealth || 0));
        seen &&
          res.total >= dc &&
          (revealGroup(explore, gid),
          explore.toast(
            `${rules.shortName(m.id)} ve a alguien agazapado: \xA1${group.def.name ? lowerFirst(group.def.name) : 'enemigos'} al acecho!`,
            'mal',
            5e3,
          ),
          (found = !0));
      }
    }
    (await Promise.all(anims),
      await sleep(200),
      found ||
        explore.toast(
          `Busc\xE1is con calma\u2026 (${rolls.join(', ')}). No encontr\xE1is nada m\xE1s por aqu\xED.`,
          'apagado',
          5e3,
        ));
  });
}
/** Activa o desactiva el sigilo del grupo (fuera de combate). */
function toggleStealth(explore, on = !explore.stealth) {
  if (!explore.inBattle) {
    explore.stealth = on;
    for (let group of explore.groups.values()) group.roll = null;
    for (let m of explore.members)
      (m.actor.setShadowed(on), m.moving || m.actor.anim(on ? 'crouch' : 'idle', { fade: 0.3 }));
    (explore.hud?.status?.(on ? 'Sigilo: avanz\xE1is agachados' : ''),
      explore.toast(
        on ? 'Sigilo: os mov\xE9is despacio e intent\xE1is que no os vean.' : 'Sigilo desactivado.',
        on ? 'magia' : 'apagado',
      ),
      explore.game.bus.emit(on ? 'stealth:on' : 'stealth:off', {}),
      explore.updateHud());
  }
}
/** Comprueba cada fotograma si algún grupo enemigo ve a un miembro: sigilo, emboscada, aviso o combate. */
function detect(explore) {
  for (let [gid, group] of explore.groups) {
    if (group.cooldown > 0 || group.alerted) continue;
    let sight = group.def.sight ?? 8;
    for (let enemy of group.enemies)
      if (!enemy.dead)
        for (let m of explore.members) {
          let dist = hexDistance(enemy.cell, m.cell);
          if (!(dist > sight) && explore.xmap.los(enemy.cell, m.cell)) {
            if (explore.stealth && (group.roll || stealthRoll(explore, group), group.roll.success)) {
              if ((group.hidden && noticeHidden(explore, gid, m), dist <= 1)) {
                ((group.alerted = !0),
                  explore.stopAll(),
                  startBattle(explore, gid, { surprise: !0, hidden: stealthTotals(group) }));
                return;
              }
              continue;
            }
            if (group.hidden) {
              springAmbush(explore, gid, m);
              return;
            }
            spotted(explore, gid, enemy, m);
            return;
          }
        }
  }
}
/** Un miembro descubre a un grupo agazapado antes de ser visto si su pasiva supera su sigilo. */
function noticeHidden(explore, gid, member) {
  let group = explore.groups.get(gid);
  if (!group?.hidden) return;
  let dc =
      10 +
      Math.max(
        0,
        ...group.enemies.filter((en) => !en.dead).map((en) => explore.rules.monster(en.monster).stealth || 0),
      ),
    pp = passivePerception(explore, member.id);
  pp < dc ||
    (revealGroup(explore, gid),
    explore.toast(
      `${explore.rules.shortName(member.id)} ve a alguien agazapado antes de que os vean (Percepci\xF3n ${pp}): \xA1${lowerFirst(group.def.name || 'enemigos')} al acecho!`,
      'magia',
      5500,
    ),
    explore.game.bus.emit('hidden:found', {
      object: { id: gid, type: 'group', cell: group.enemies[0]?.cell },
      by: member.id,
      group: gid,
    }));
}
/** Totales de Sigilo con éxito por miembro (para la sorpresa del combate). */
function stealthTotals(group) {
  let out = {};
  for (let r of group.roll?.results || []) r.success && (out[r.who] = r.total);
  return out;
}
/** Prueba de Sigilo de grupo contra la mejor Percepción pasiva del grupo enemigo (se guarda en `group.roll`). */
function stealthRoll(explore, group) {
  let dc = explore.groupPP(group);
  group.roll = explore.rules.groupCheck('stealth', dc);
  for (let r of group.roll.results || []) {
    let m = explore.member(r.who);
    m &&
      explore.overlay.float(
        (v) => m.actor.head(v).add(new Vector3(0, 0.25, 0)),
        `Sigilo ${r.total}`,
        r.success ? 'bien' : 'mal',
        { dur: 1.6 },
      );
  }
  return (
    explore.toast(
      group.roll.success
        ? `No os han visto (Sigilo del grupo contra Percepci\xF3n ${dc}).`
        : `Os han o\xEDdo (Sigilo del grupo contra Percepci\xF3n ${dc})\u2026`,
      group.roll.success ? 'magia' : 'mal',
    ),
    group.roll
  );
}
/** Un enemigo ve al grupo: alerta y, según el grupo, conversación o combate. */
async function spotted(explore, gid, enemy, member) {
  let group = explore.groups.get(gid);
  if (
    !(!group || group.alerted) &&
    ((group.alerted = !0),
    explore.stopAll(),
    await group.ready,
    !(explore.disposed || !explore.groups.has(gid)))
  ) {
    if (
      (explore.faceTo(enemy.id, member.id),
      explore.overlay.alert((v) => enemy.actor.head(v).add(new Vector3(0, 0.45, 0))),
      explore.game.bus.emit('spotted', { group: gid, by: enemy.id, who: member.id }),
      wantsTalk(explore, group))
    ) {
      await talkGroup(explore, gid, enemy);
      return;
    }
    (await explore.withBusy(() => sleep(650)),
      explore.groups.has(gid) && !explore.inBattle
        ? await startBattle(explore, gid, {})
        : explore.groups.has(gid) && (group.alerted = !1));
  }
}
/** ¿El grupo enemigo quiere hablar antes de luchar? */
function wantsTalk(explore, group) {
  return group?.def.talk
    ? typeof explore.game.story?.interact == 'function'
      ? !0
      : !explore.ls.talked.includes(group.def.id)
    : !1;
}
/** Conversación con un grupo enemigo; si no se resuelve hablando, empieza el combate. */
async function talkGroup(explore, gid, enemy = null, { stealth = !1 } = {}) {
  let group = explore.groups.get(gid);
  if (!group || (await group.ready, explore.disposed || !explore.groups.has(gid))) return;
  let talker =
    enemy ||
    group.enemies.find((en) => !en.dead && /boss|chief/.test(en.monster)) ||
    group.enemies.find((en) => !en.dead);
  explore.stopAll();
  let lead = explore.lead();
  talker && lead && (explore.faceTo(talker.id, lead.id), explore.faceTo(lead.id, talker.cell));
  let settled = await storyInteract(explore, {
    object: group.def,
    kind: 'group',
    actor: explore.leader,
    enemy: talker?.id,
    group: gid,
    stealth,
  });
  if (!(!explore.groups.has(gid) || explore.inBattle)) {
    if (settled) {
      ((group.alerted = !1), (group.cooldown = 4));
      return;
    }
    (explore.ls.talked.includes(gid) || explore.ls.talked.push(gid),
      talker &&
        (await explore.say(talker.id, group.def.taunt || '\xAB\xA1Ni un paso m\xE1s, carne blanda!\xBB', {
          dur: 2.2,
        })),
      await startBattle(explore, gid, {}));
  }
}
/** Emboscada de un grupo oculto: quien no lo ve venir queda sorprendido. */
async function springAmbush(explore, gid, member) {
  let group = explore.groups.get(gid);
  if (
    !group ||
    group.alerted ||
    ((group.alerted = !0), explore.stopAll(), await group.ready, explore.disposed || !explore.groups.has(gid))
  )
    return;
  let rules = explore.rules,
    stealth = Math.max(
      0,
      ...group.enemies.filter((en) => !en.dead).map((en) => rules.monster(en.monster).stealth || 0),
    ),
    roll = rules.d20() + stealth,
    surprised = explore.members.filter((m) => passivePerception(explore, m.id) < roll).map((m) => m.id),
    spotter = explore.members
      .filter((m) => !surprised.includes(m.id))
      .sort((a, b) => passivePerception(explore, b.id) - passivePerception(explore, a.id))[0];
  revealGroup(explore, gid);
  for (let en of group.enemies) en.dead || explore.faceTo(en.id, member.id);
  let banner = (text, ms) => !explore.mods.combat && explore.hud?.banner?.(text, 'mal', ms);
  (surprised.length
    ? surprised.length === explore.members.length
      ? (banner('\xA1Emboscada!', 1500),
        explore.toast(`Os han cogido desprevenidos (Sigilo ${roll}).`, 'mal', 5e3))
      : (banner('\xA1Emboscada!', 1500),
        explore.toast(
          `${surprised.map((id) => rules.shortName(id)).join(', ')} no lo ve${surprised.length > 1 ? 'n' : ''} venir (Sigilo ${roll}).`,
          'mal',
          5e3,
        ))
    : (explore.hud?.banner?.('\xA1Enemigos!', 'mal', 1300),
      explore.toast(
        `${rules.shortName(spotter.id)} ve movimiento a tiempo (Percepci\xF3n ${passivePerception(explore, spotter.id)} contra Sigilo ${roll}): \xA1nadie os coge desprevenidos!`,
        'bien',
        5500,
      )),
    explore.game.bus.emit('spotted', { group: gid, ambush: !0, surprised }),
    await explore.withBusy(() => sleep(900)),
    explore.groups.has(gid) &&
      !explore.inBattle &&
      (await startBattle(explore, gid, { surprisedParty: surprised, ambush: !0 })));
}
/** Hace visibles a los enemigos de un grupo oculto (con una animación de escala). */
function revealGroup(explore, gid) {
  let group = explore.groups.get(gid);
  if (!(!group || !group.hidden)) {
    group.hidden = !1;
    for (let en of group.enemies) {
      if (en.dead || !en.actor) continue;
      ((en.actor.root.visible = !0), en.actor.root.scale.multiplyScalar(0.001), (en.grow = 0));
      let full = en.actor.root.scale.clone().divideScalar(0.001),
        t0 = performance.now(),
        grow = () => {
          let k = Math.min(1, (performance.now() - t0) / 350);
          (en.actor.root.scale.copy(full).multiplyScalar(0.001 + 0.999 * (1 - Math.pow(1 - k, 3))),
            k < 1 && requestAnimationFrame(grow));
        };
      grow();
    }
  }
}
/**
 * Dispara los disparadores del nivel al cargar (`onLoad`) o al pisar `cell`; devuelve si alguno
 * detiene al grupo.
 */
function checkTriggers(explore, onLoad, cell = null) {
  let blocking = !1;
  for (let trig of explore.level.triggers || []) {
    if (((trig.once ?? !0) && explore.ls.fired.includes(trig.id)) || !explore.flag(trig.requires)) continue;
    let hit = !1;
    (onLoad && trig.on_load && (!trig.spawn || trig.spawn === explore.spawn)
      ? (hit = !0)
      : !onLoad && cell && (hit = (trig.cells || []).some((c) => c[0] === cell[0] && c[1] === cell[1])),
      hit &&
        (explore.ls.fired.includes(trig.id) || explore.ls.fired.push(trig.id),
        trig.text && ((blocking = !0), explore.stopAll()),
        fireTrigger(explore, trig)));
  }
  return blocking;
}
/** Ejecuta un disparador: evento, bandera, historia o, si la historia no lo trata, diario, texto y pista. */
async function fireTrigger(explore, trig) {
  let game = explore.game;
  (game.bus.emit('trigger', { id: trig.id, level: explore.levelId }),
    trig.flag && game.store.setFlag(trig.flag, !0));
  let handled = !1;
  try {
    handled = !!(await explore.withBusy(() =>
      game.story?.trigger?.(trig.id, { level: explore.levelId, trigger: trig, explore: game.explore }),
    ));
  } catch (err) {
    console.error('[exploraci\xF3n] story.trigger', err);
  }
  handled ||
    explore.disposed ||
    (trig.journal && explore.addJournal(trig.journal),
    trig.text && (await explore.narrate(trig.text)),
    trig.hint && explore.hint(trig.hint));
}
/** Alcance (casillas) de la percepción pasiva. */
const PASSIVE_RANGE = 5;
/** Alcance (casillas) de la búsqueda activa. */
const SEARCH_RANGE = 6;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const lowerFirst = (text) => text && text[0].toLowerCase() + text.slice(1);

export {
  checkTriggers,
  detect,
  perceive,
  revealGroup,
  search,
  spotted,
  springAmbush,
  stealthRoll,
  talkGroup,
  toggleStealth,
  wantsTalk,
};
