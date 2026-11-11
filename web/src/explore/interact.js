// explore/interact.js — Interacción con el mundo de exploración: acercarse a un objeto, cofres y botín,
// cerraduras (llave, herramientas, Abrir, fuerza), trampas (descubrir, desactivar, saltar), puertas,
// carteles, escaleras, PNJ (saludo, tienda, posada, templo), compañeros, descanso corto y largo y la
// etiqueta de lo que hay bajo el puntero. Antes de la lógica propia pregunta a la historia
// (`story.interact`). Todas las funciones reciben la instancia de Explore.
// Lo usan explore/index.js y detection.js.
// Reconstruido de publicado/juego.js (módulo __esm «ty»).

import { Vector3 } from 'three';
import { cellKey, neighbors, hexDistance } from './hex.js';
import { lootDialog, showInterlude } from './hud.js';
/** Import solo por orden de inicialización (en el bundle original este módulo inicializaba checks.js). */
import './checks.js';
import { startBattle } from './battle.js';

/** Lleva al miembro (o al líder) junto a la casilla (o encima, sin `adjacent`); false si no hay camino. */
async function approach(explore, cell, { actorId = null, adjacent = !0 } = {}) {
  let who = explore.member(actorId) || explore.lead();
  if (!who) return !1;
  if ((adjacent && hexDistance(who.cell, cell) <= 1) || (who.cell[0] === cell[0] && who.cell[1] === cell[1]))
    return (who.moving && explore.stopAll(), explore.faceTo(who.id, cell), !0);
  let blocked = explore.blocked(),
    dest = null;
  if (!adjacent && explore.xmap.walkable(cell) && !blocked.has(cellKey(cell[0], cell[1]))) dest = cell;
  else {
    let best = null;
    for (let nb of neighbors(cell[0], cell[1])) {
      if (!explore.xmap.walkable(nb) || blocked.has(cellKey(nb[0], nb[1]))) continue;
      let path = explore.xmap.path(who.cell, nb, blocked);
      path.length && (!best || path.length < best.length) && (best = path);
    }
    dest = best ? best[best.length - 1] : null;
  }
  if (!dest)
    return (
      explore.toast('No hay forma de llegar hasta ah\xED.', 'apagado'),
      explore.game.bus.emit('ui:error', {}),
      !1
    );
  let ok = await explore.moveParty(dest, { leaderId: who.id });
  return (ok && explore.faceTo(who.id, cell), ok);
}
/** Emite «interact» y deja que la historia trate la interacción; true si la ha resuelto. */
async function storyInteract(explore, ctx) {
  let game = explore.game;
  game.bus.emit('interact', { object: ctx.object, level: explore.levelId, actor: ctx.actor, kind: ctx.kind });
  let fn = game.story?.interact;
  if (typeof fn != 'function') return !1;
  try {
    return !!(await explore.withBusy(() =>
      fn.call(game.story, { ...ctx, level: explore.levelId, explore: game.explore }),
    ));
  } catch (err) {
    return (console.error('[exploraci\xF3n] story.interact', err), !1);
  }
}
/** Contenido actual de un contenedor (el guardado en el nivel o el inicial del objeto). */
function lootOf(explore, obj) {
  return explore.ls.loot[obj.id]
    ? explore.ls.loot[obj.id]
    : (obj.loot || []).map((entry) => ({
        id: entry[0],
        n: entry[1] ?? 1,
        unid: explore.rules.unidentified(entry[0]),
      }));
}
/** Abre un contenedor y muestra su botín (pantalla «botin» o ventana de sustituto). */
async function openLoot(explore, id, by = explore.leader) {
  let obj = explore.objects.get(id);
  if (!obj) return;
  let loot = lootOf(explore, obj);
  if (
    ((explore.ls.loot[id] = loot),
    explore.ls.opened.includes(id) || explore.ls.opened.push(id),
    explore.world.setObjectState?.(id, loot.length ? 'open' : 'empty'),
    explore.game.bus.emit('object:state', { id, object: obj, state: 'open' }),
    !loot.length)
  ) {
    (explore.toast(`${obj.name || 'Cofre'}: vac\xEDo.`, 'apagado'), explore.refreshObject(id));
    return;
  }
  let gold = loot.filter((it) => it.id === 'gold').reduce((sum, it) => sum + it.n, 0),
    items = loot.filter((it) => it.id !== 'gold');
  if (explore.hasScreen('botin')) {
    let res = await explore.withBusy(() =>
      explore.game.ui.open('botin', { title: obj.name || 'Bot\xEDn', items, gold, object: id }),
    );
    if (res) {
      let left = (res.left || [])
          .filter((it) => it.id !== 'gold')
          .map((it) => ({ id: it.id, n: it.n ?? 1, unid: !!it.unid })),
        goldLeft =
          (res.left || []).filter((it) => it.id === 'gold').reduce((sum, it) => sum + (it.n || 0), 0) ||
          Math.max(0, gold - (Number(res.gold) || 0));
      ((explore.ls.loot[id] = goldLeft > 0 ? [{ id: 'gold', n: goldLeft, unid: !1 }, ...left] : left),
        ((res.taken || []).length || res.gold) &&
          explore.game.bus.emit('loot:taken', {
            items: res.taken || [],
            gold: Number(res.gold) || 0,
            by,
            object: obj,
          }));
    }
  } else {
    let res = await explore.withBusy(() =>
      lootDialog(explore.game.ui.root, {
        title: obj.name || 'Bot\xEDn',
        items,
        gold,
        names: (item) => explore.rules.itemName(item),
      }),
    );
    applyLootChoice(explore, id, loot, items, res, by);
  }
  (explore.world.setObjectState?.(id, explore.ls.loot[id].length ? 'open' : 'empty'),
    explore.refreshObject(id),
    explore.updateHud());
}
/** Aplica lo elegido en la ventana de sustituto: da objetos y oro y deja el resto en el contenedor. */
function applyLootChoice(explore, id, all, items, res, by) {
  if (!res) return;
  let takenIdx = new Set();
  for (let t of res.taken || [])
    if (typeof t == 'number') takenIdx.add(t);
    else {
      let idx = items.findIndex((it, k) => !takenIdx.has(k) && it.id === t.id);
      idx >= 0 && takenIdx.add(idx);
    }
  let taken = [],
    byWho = new Map();
  for (let k of takenIdx) {
    let it = items[k];
    if (!it) continue;
    let who = explore.rules.give(it.id, it.n, !!it.unid);
    taken.push({ id: it.id, n: it.n, who });
    let name = who ? explore.rules.shortName(who) : '';
    (byWho.has(name) || byWho.set(name, []),
      byWho.get(name).push(`${explore.rules.itemName(it.id)}${it.n > 1 ? ` \xD7${it.n}` : ''}`));
  }
  let gold =
    typeof res.gold == 'number'
      ? res.gold
      : res.gold
        ? all.filter((it) => it.id === 'gold').reduce((sum, it) => sum + it.n, 0)
        : 0;
  gold > 0 && explore.rules.gold(gold);
  let left = items.filter((it, k) => !takenIdx.has(k)),
    goldLeft = all.filter((it) => it.id === 'gold').reduce((sum, it) => sum + it.n, 0) - gold;
  if (
    (goldLeft > 0 && left.unshift({ id: 'gold', n: goldLeft, unid: !1 }),
    (explore.ls.loot[id] = left),
    taken.length || gold)
  ) {
    explore.game.bus.emit('loot:taken', { items: taken, gold, by, object: explore.objects.get(id) || id });
    let parts = [];
    gold && parts.push(`+${gold} po`);
    for (let [name, list] of byWho) parts.push(`${name ? `${name} guarda ` : ''}${list.join(', ')}`);
    explore.toast(parts.join(' \xB7 '), 'botin', 5e3);
  }
}
/** Id del primer miembro con el conjuro Abrir preparado, o null. */
function knockCaster(explore) {
  for (let m of explore.members)
    if ((explore.rules.summary(m.id)?.spells?.prepared || []).some((sp) => (sp.id || sp) === 'knock'))
      return m.id;
  return null;
}
/** Opciones para abrir una cerradura (llave, herramientas, Abrir, fuerza); true si se abre. */
async function chooseUnlock(explore, id) {
  let obj = explore.objects.get(id),
    lock = obj.lock || {},
    dc = lock.dc ?? 13,
    rules = explore.rules,
    options = [];
  if (lock.key) {
    let who = rules.holder(lock.key);
    who &&
      options.push({
        text: `Abrir con ${lowerFirst(rules.itemName(lock.key))} (la lleva ${rules.shortName(who)})`,
        value: { how: 'key', who },
      });
  }
  if (rules.holder('thieves_tools')) {
    let best = rules.best('thieves_tools');
    options.push({
      text: `Forzar la cerradura: ${rules.shortName(best.who)}`,
      tag: `[Herramientas de ladr\xF3n ${signed(best.mod)} \xB7 CD ${dc}]`,
      kind: 'check',
      value: { how: 'tools', who: best.who },
    });
  } else
    options.push({
      text: 'Forzar la cerradura',
      hint: 'hacen falta herramientas de ladr\xF3n',
      disabled: !0,
    });
  let caster = knockCaster(explore);
  caster &&
    options.push({
      text: `${rules.shortName(caster)} lanza Abrir`,
      tag: '[Conjuro de nivel 2]',
      kind: 'special',
      value: { how: 'knock', who: caster },
    });
  let strong = rules.best('athletics'),
    crowbar = rules.holder('crowbar');
  (options.push({
    text: `Romperla a golpes: ${rules.shortName(strong.who)}${crowbar ? ', con la palanca' : ''}`,
    tag: `[Atletismo ${signed(strong.mod)} \xB7 CD ${dc + 2}${crowbar ? ' \xB7 ventaja' : ''}]`,
    kind: 'check',
    value: { how: 'force', who: strong.who },
  }),
    options.push({ text: 'Dejarlo', kind: 'end', value: null }));
  let choice = await explore.choose({
    speaker: obj.name || 'Cerradura',
    title: 'Cerrado con llave',
    text: obj.lock_text || 'Una cerradura s\xF3lida. Habr\xE1 que abrirla de alguna forma.',
    options,
  });
  return choice ? tryUnlock(explore, id, choice.how, choice.who, dc) : !1;
}
/** Intenta abrir con el método elegido; el conjuro y la fuerza hacen ruido y pueden atraer enemigos. */
async function tryUnlock(explore, id, how, who, dc) {
  let obj = explore.objects.get(id),
    rules = explore.rules;
  if (!(await approach(explore, obj.cell, { actorId: who }))) return !1;
  let actor = explore.member(who)?.actor;
  return explore.withBusy(async () => {
    if (how === 'key')
      return (
        await actor?.once('interact'),
        markUnlocked(explore, id, who, 'key', `${rules.shortName(who)} gira la llave.`)
      );
    if (how === 'knock')
      return (
        await actor?.once('cast'),
        rules.call('cp_cast', { cp: explore.game.store.cp, who, spell: 'knock' }),
        makeNoise(explore, obj.cell, 'Un golpe seco resuena: el conjuro Abrir no es nada discreto.'),
        markUnlocked(explore, id, who, 'knock', 'La cerradura cede con un chasquido.')
      );
    let res =
        how === 'tools'
          ? rules.check({ who, tool: 'thieves_tools', dc })
          : rules.check({ who, skill: 'athletics', dc: dc + 2, adv: !!rules.holder('crowbar') }),
      anim = actor?.once(how === 'tools' ? 'kneel' : 'attack_melee', { speed: how === 'tools' ? 1.4 : 1.2 });
    return (
      await sleep(how === 'tools' ? 900 : 500),
      floatRoll(explore, who, res),
      await anim,
      how === 'force' && makeNoise(explore, obj.cell, 'Los golpes se oyen desde lejos.'),
      res.success
        ? markUnlocked(
            explore,
            id,
            who,
            how,
            `${rules.shortName(who)} lo consigue (${res.total} contra CD ${res.dc}).`,
          )
        : (explore.game.bus.emit('ui:error', {}),
          explore.toast(
            `${rules.shortName(who)} no lo consigue (${res.total} contra CD ${res.dc}). Puede volver a intentarlo.`,
            'mal',
          ),
          !1)
    );
  });
}
/** Muestra el resultado de una prueba sobre la cabeza del miembro. */
function floatRoll(explore, who, res) {
  let actor = explore.member(who)?.actor;
  actor &&
    explore.overlay.float(
      (v) => actor.head(v).add(new Vector3(0, 0.25, 0)),
      `${res.label} ${res.total}`,
      res.success ? 'bien' : 'mal',
      { dur: 1.6 },
    );
}
/** Ruido: si hay un grupo enemigo visible a 7 casillas o menos, empieza el combate. */
function makeNoise(explore, cell, text) {
  for (let [gid, group] of explore.groups)
    if (!group.hidden && group.enemies.some((en) => !en.dead && hexDistance(en.cell, cell) <= 7)) {
      (explore.toast(text, 'mal'),
        setTimeout(() => !explore.inBattle && explore.groups.has(gid) && startBattle(explore, gid, {}), 900));
      return;
    }
}
/** Marca la cerradura como abierta y emite «lock:opened». */
function markUnlocked(explore, id, who, how, text) {
  return (
    explore.ls.unlocked.includes(id) || explore.ls.unlocked.push(id),
    explore.game.bus.emit('lock:opened', { object: explore.objects.get(id) || id, by: who, how }),
    explore.toast(text, 'bien'),
    !0
  );
}
/** Revela un objeto oculto (o una trampa) encontrado por `who`; `why` explica la tirada. */
function revealObject(explore, id, who, why) {
  let obj = explore.objects.get(id);
  if (!obj || explore.ls.found.includes(id)) return;
  (explore.ls.found.push(id), explore.refreshObject(id));
  let trap = obj.type === 'trap',
    pos = explore.world.cellToWorld(obj.cell).add(new Vector3(0, 0.9, 0));
  explore.overlay.float(pos, trap ? '\xA1Trampa!' : '\xA1Algo escondido!', trap ? 'mal' : 'oro', {
    dur: 1.8,
    size: 1.15,
  });
  let name = who ? explore.rules.shortName(who) : '';
  (trap
    ? (explore.stopAll(),
      explore.toast(
        `${name} ve una trampa: ${lowerFirst(obj.name || 'trampa')}${why ? ` (${why})` : ''}.`,
        'mal',
        5e3,
      ))
    : explore.toast(
        `${name} encuentra ${lowerFirst(obj.name || 'algo')}${why ? ` (${why})` : ''}.`,
        'botin',
        5e3,
      ),
    obj.found_text && explore.hint(obj.found_text),
    explore.game.bus.emit('hidden:found', { object: obj, by: who }));
}
/** Desactivar una trampa descubierta; si se falla por 5 o más, salta. */
async function chooseDisarm(explore, id) {
  let trap = explore.objects.get(id),
    rules = explore.rules,
    dc = trap.dc_disarm ?? 13,
    options = [];
  if (rules.holder('thieves_tools')) {
    let best = rules.best('thieves_tools');
    options.push({
      text: `Desactivarla: ${rules.shortName(best.who)}`,
      tag: `[Herramientas de ladr\xF3n ${signed(best.mod)} \xB7 CD ${dc}]`,
      kind: 'check',
      value: best.who,
    });
  } else options.push({ text: 'Desactivarla', hint: 'hacen falta herramientas de ladr\xF3n', disabled: !0 });
  options.push({ text: 'Dejarla y rodearla', kind: 'end', value: null });
  let who = await explore.choose({
    speaker: trap.name || 'Trampa',
    title: 'Trampa descubierta',
    text: trap.desc || 'Un mecanismo escondido. Si alguien lo pisa, saltar\xE1.',
    options,
  });
  who &&
    (await approach(explore, trap.cell, { actorId: who })) &&
    (await explore.withBusy(async () => {
      let actor = explore.member(who)?.actor,
        res = rules.check({ who, tool: 'thieves_tools', dc }),
        anim = actor?.once('kneel', { speed: 1.3 });
      (await sleep(1e3),
        floatRoll(explore, who, res),
        await anim,
        res.success
          ? (explore.ls.disarmed.push(id),
            explore.refreshObject(id),
            explore.world.setObjectState?.(id, 'disarmed'),
            explore.toast(
              `${rules.shortName(who)} desactiva ${lowerFirst(trap.name || 'la trampa')} (${res.total} contra CD ${dc}).`,
              'bien',
            ),
            explore.game.bus.emit('trap:disarmed', { object: trap, by: who }))
          : res.total <= dc - 5
            ? (explore.toast(
                `${rules.shortName(who)} se equivoca (${res.total} contra CD ${dc})\u2026`,
                'mal',
              ),
              await sleep(400),
              springTrap(explore, id, who))
            : (explore.game.bus.emit('ui:error', {}),
              explore.toast(
                `${rules.shortName(who)} no lo consigue (${res.total} contra CD ${dc}). Puede volver a intentarlo.`,
                'mal',
              )));
    }));
}
/** Salta una trampa sobre `who`: daño (salvación a la mitad) y alarma opcional. */
function springTrap(explore, id, who) {
  explore.stopAll();
  let trap = explore.objects.get(id),
    rules = explore.rules;
  (explore.ls.found.includes(id) || explore.ls.found.push(id),
    explore.ls.disarmed.includes(id) || explore.ls.disarmed.push(id));
  let dmg = rules.roll(trap.damage ?? '1d6'),
    text = `\xA1${rules.shortName(who)} pisa ${lowerFirst(trap.name || 'una trampa')}!`;
  if (trap.save && dmg > 0) {
    let save = rules.check({ who, save: trap.save.ab || 'dex', dc: trap.save.dc ?? 12 });
    save.success
      ? ((dmg = Math.floor(dmg / 2)), (text += ` Salva (${save.total}) y se lleva la mitad.`))
      : (text += ` Falla la salvaci\xF3n (${save.total}).`);
  }
  let m = explore.member(who);
  (dmg > 0 &&
    (rules.damage(who, dmg, trap.dtype || 'piercing'),
    m?.actor.once('hit', { speed: 1.2 }),
    m && explore.overlay.float((v) => m.actor.head(v), `-${dmg}`, 'mal', { size: 1.3 })),
    explore.world.setObjectState?.(id, 'sprung'),
    explore.marks.trap(id, null),
    explore.refreshObject(id),
    explore.toast(text + (dmg > 0 ? ` ${dmg} de da\xF1o.` : ''), 'mal', 5500),
    explore.game.bus.emit('trap:triggered', { object: trap, by: who }),
    explore.updateHud(),
    trap.alarm &&
      (explore.hud?.banner?.('\xA1Una alarma!', 'mal', 1300),
      explore.toast('Una cuerda tensa, un ruido de latas: el campamento sabe que est\xE1is aqu\xED.', 'mal'),
      explore.groups.has(trap.alarm) &&
        setTimeout(() => !explore.inBattle && startBattle(explore, trap.alarm, {}), 1300)));
}
/** Puertas: a otro nivel (`to`), de un PNJ, decorativas (`target`), cerradas o que se abren. */
async function useDoor(explore, id) {
  let door = explore.objects.get(id);
  if (door.npc && explore.npcs.has(door.npc)) return talkToNpc(explore, door.npc, { skipApproach: !0 });
  if (door.to) {
    if (!explore.flag(door.requires)) {
      explore.toast(door.closed || 'La puerta est\xE1 cerrada.', 'apagado', 4500);
      return;
    }
    if (door.lock && !explore.ls.unlocked.includes(id) && !(await chooseUnlock(explore, id))) return;
    (explore.world.setObjectState?.(id, 'open'),
      explore.game.bus.emit('object:state', { id, object: door, state: 'open' }),
      await new Promise((resolve) => setTimeout(resolve, 350)),
      explore.disposed || explore.useExit({ to: door.to }));
    return;
  }
  if (door.target) {
    explore.toast(
      `${door.name || 'Puerta'}: ${door.closed || 'La puerta est\xE1 cerrada. Nadie contesta.'}`,
      'apagado',
      4500,
    );
    return;
  }
  if (explore.ls.states[id] === 'open') {
    explore.toast(`${door.name || 'La puerta'} ya est\xE1 abierta.`, 'apagado');
    return;
  }
  if (!explore.flag(door.requires)) {
    explore.toast(
      door.closed || 'No se abre. No hay tirador, ni bisagras, ni cerradura: algo la mantiene cerrada.',
      'apagado',
      5e3,
    );
    return;
  }
  (door.lock && !explore.ls.unlocked.includes(id) && !(await chooseUnlock(explore, id))) ||
    openDoor(explore, id);
}
/** Abre una puerta del nivel (cambia la casilla del mapa a transitable). */
function openDoor(explore, id) {
  let door = explore.objects.get(id);
  ((explore.ls.states[id] = 'open'),
    door?.cell && !door.target && explore.xmap.setTile(door.cell, door.open_tile || '.'),
    explore.world.setObjectState?.(id, 'open'),
    explore.game.bus.emit('object:state', { id, object: door, state: 'open' }),
    explore.refreshObject(id));
}
/**
 * Usar un objeto del nivel tras acercarse: contenedores, carteles, runas, puertas, trampas,
 * escaleras, hogueras y posada.
 */
async function useObject(explore, id) {
  let obj = explore.objects.get(id);
  if (!obj) return;
  if (obj.type === 'door' && obj.npc && explore.npcs.has(obj.npc)) return talkToNpc(explore, obj.npc);
  if (!(await approach(explore, obj.cell, { adjacent: !0 })) || explore.disposed) return;
  let by = explore.leader;
  if (await storyInteract(explore, { object: obj, kind: 'object', actor: by })) {
    explore.refreshObject(id);
    return;
  }
  let actor = explore.member(by)?.actor;
  switch (obj.type) {
    case 'chest':
    case 'cache':
    case 'loot':
      obj.lock && !explore.ls.unlocked.includes(id)
        ? (actor?.once('interact'), (await chooseUnlock(explore, id)) && (await openLoot(explore, id, by)))
        : (await explore.withBusy(() =>
            actor?.once(obj.type === 'chest' ? 'interact' : 'kneel', { speed: 1.5 }),
          ),
          await openLoot(explore, id, by));
      break;
    case 'sign':
    case 'board':
    case 'inspect':
    case 'rune':
    case 'seal': {
      actor?.once('interact');
      let lines = [].concat(
        obj.text ||
          (obj.type === 'rune' || obj.type === 'seal'
            ? ['Unas runas durn talladas en la piedra. No pasa nada al tocarlas\u2026 todav\xEDa.']
            : ['\u2026']),
      );
      (await explore.narrate(lines, {
        title: obj.name || '',
        sub: obj.type === 'board' ? 'Tabl\xF3n de anuncios' : '',
      }),
        obj.journal && explore.addJournal(obj.journal),
        obj.sets && explore.game.store.setFlag(obj.sets, !0));
      break;
    }
    case 'door':
      await useDoor(explore, id);
      break;
    case 'trap':
      await chooseDisarm(explore, id);
      break;
    case 'stairs': {
      let up = /merrowick|arriba|subir/i.test(obj.to || '') || /sube/i.test((obj.text || []).join(' '));
      (await explore.choose({
        speaker: obj.name || 'Escalera',
        text:
          (obj.text || []).map((line) => explore.heroText(line)).join(`

`) || (up ? 'La escalera sube.' : 'La escalera baja a la oscuridad.'),
        options: [
          { text: up ? 'Subir' : 'Bajar', value: 'go' },
          { text: 'Todav\xEDa no', kind: 'end', value: null },
        ],
      })) === 'go' && explore.useExit({ to: obj.to });
      break;
    }
    case 'campfire':
      await openRest(explore, { camp: !0, where: obj.name });
      break;
    case 'inn': {
      actor?.once('interact');
      let price = innPrice(explore);
      (await explore.choose({
        speaker: obj.name || 'Habitaciones',
        text:
          [].concat(obj.text || []).map((line) => explore.heroText(line)).join(`

`) || 'Una escalera estrecha sube a las habitaciones.',
        options: [
          {
            text: `Pasar la noche (${price.free ? 'invita la casa' : `${price.cost} po`})`,
            value: 'inn',
            disabled: !price.ok,
            hint: price.ok ? null : 'no os llega',
          },
          { text: 'Todav\xEDa no', kind: 'end', value: null },
        ],
      })) === 'inn' && (await stayAtInn(explore));
      break;
    }
    default:
      obj.text && (await explore.narrate(obj.text, { title: obj.name || '' }));
      break;
  }
}
/** Hablar con un compañero (la historia o una frase suelta). */
async function talkToMember(explore, id) {
  let m = explore.member(id);
  if (!m || explore.isBusy()) return;
  let lead = explore.lead();
  if (
    (lead && lead.id !== id && (explore.faceTo(id, lead.id), explore.faceTo(lead.id, m.cell)),
    await storyInteract(explore, { object: id, kind: 'npc', actor: explore.leader, companion: !0 }))
  )
    return;
  let lines = ['\xBFSeguimos?', 'Te escucho.', 'Aqu\xED estoy.', 'No me gusta este silencio.'];
  explore.say(id, lines[Math.floor(Math.random() * lines.length)], { dur: 2.5 });
}
/** Hablar con un PNJ: acercarse, mirarse y conversación de la historia o menú propio. */
async function talkToNpc(explore, id, { skipApproach = !1 } = {}) {
  let npc = explore.npcs.get(id);
  if (!npc || (!skipApproach && (!(await approach(explore, npc.cell, { adjacent: !0 })) || explore.disposed)))
    return;
  let lead = explore.lead();
  (lead && (explore.faceTo(id, lead.id), explore.faceTo(lead.id, npc.cell)), npc.actor.once('interact'));
  let def = npc.def;
  (await storyInteract(explore, { object: def, kind: 'npc', actor: explore.leader })) ||
    (await npcMenu(explore, id));
}
/** Menú de sustituto de un PNJ: comerciar, posada, templo (curar, identificar, resucitar), preguntar. */
async function npcMenu(explore, id) {
  let npc = explore.npcs.get(id),
    def = npc.def,
    rules = explore.rules,
    greets = [].concat(def.greet || ['\u2026']),
    text = `*${greets[Math.floor(Math.random() * greets.length)]}*`,
    asked = !1,
    portrait =
      explore.game.ui.portrait?.(def.id) ||
      (await explore.factory.portrait(npc.actor, { id: def.id, name: def.name, class: def.visual?.class }));
  for (;;) {
    let options = [];
    if ((def.shop && options.push({ text: 'Comerciar', value: 'shop' }), def.inn)) {
      let price = innPrice(explore);
      options.push({
        text: `Pasar la noche (${price.free ? 'invita la casa' : `${price.cost} po`})`,
        value: 'inn',
        disabled: !price.ok,
        hint: price.ok ? null : 'no os llega',
      });
    }
    if (def.temple) {
      (options.push({
        text: 'Curar heridas (10 po)',
        value: 'heal',
        disabled: (explore.game.store.cp.gold || 0) < 10,
      }),
        options.push({
          text: 'Identificar objetos (20 po)',
          value: 'identify',
          disabled: (explore.game.store.cp.gold || 0) < 20,
        }));
      for (let deadId of explore.dead)
        options.push({
          text: `Devolver a la vida a ${rules.shortName(deadId)} (150 po)`,
          value: `raise:${deadId}`,
          disabled: (explore.game.store.cp.gold || 0) < 150,
        });
    }
    (def.talk?.length && !asked && options.push({ text: 'Preguntar', value: 'ask' }),
      options.push({ text: 'Adi\xF3s', kind: 'end', value: 'bye' }));
    let choice = await explore.choose({ speaker: def.name, title: def.title || '', portrait, text, options });
    if (!choice || choice === 'bye') break;
    if (choice === 'ask') {
      ((asked = !0),
        (text = [].concat(def.talk).map((line) => `*${line}*`).join(`

`)),
        def.journal && explore.addJournal(def.journal),
        def.sets && explore.game.store.setFlag(def.sets, !0));
      continue;
    }
    if (choice === 'shop') {
      await explore.openScreen('tienda', { merchant: def.shop, npc: id });
      break;
    }
    if (choice === 'inn') {
      await stayAtInn(explore);
      break;
    }
    if (choice === 'heal') {
      if (!rules.gold(-10)) break;
      let res = rules.call('cp_heal', { cp: explore.game.store.cp, id: 'all' });
      if (res?.cp) rules.apply(res);
      else {
        for (let m of explore.members) rules.state(m.id).hp = rules.hp(m.id).max;
        explore.game.store.set(explore.game.store.cp);
      }
      (explore.game.bus.emit('ui:sfx', { name: 'curacion' }),
        (text = '*Hermana Aldis os pone las manos encima y murmura una oraci\xF3n. Las heridas se cierran.*'),
        explore.toast('Todos recuper\xE1is los puntos de golpe.', 'bien'),
        explore.updateHud());
      continue;
    }
    if (choice === 'identify') {
      let res = rules.call('identify', { cp: explore.game.store.cp, cost: 20 });
      res?.cp && res.ok !== !1
        ? (rules.apply(res),
          explore.toast(
            res.identified?.length
              ? `Identificado: ${res.identified.map((it) => it.name || it).join(', ')}.`
              : 'No hab\xEDa nada que identificar.',
            'magia',
            6e3,
          ))
        : explore.toast('Identificar todav\xEDa no est\xE1 disponible.', 'apagado');
      continue;
    }
    if (choice.startsWith('raise:')) {
      let id = choice.slice(6);
      if (!rules.gold(-150)) break;
      let res = rules.call('cp_revive', { cp: explore.game.store.cp, id });
      if (res?.cp) rules.apply(res);
      else {
        let st = rules.state(id);
        ((st.dead = !1), (st.hp = 1), explore.game.store.set(explore.game.store.cp));
      }
      (explore.game.bus.emit('ui:sfx', { name: 'curacion' }),
        explore.toast(`${rules.shortName(id)} vuelve a respirar.`, 'bien', 5e3),
        await explore.rebuildParty());
      break;
    }
  }
  npc.actor.anim(npc.def.anim || 'idle');
}
/** ¿Hay algún enemigo vivo a `range` casillas o menos de algún miembro? */
function enemiesNear(explore, range = 14) {
  for (let group of explore.groups.values())
    for (let en of group.enemies)
      if (!en.dead) {
        for (let m of explore.members) if (hexDistance(en.cell, m.cell) <= range) return !0;
      }
  return !1;
}
/** Precio de la posada: la primera noche invita la casa; después 2 po por miembro. */
function innPrice(explore) {
  let free = !explore.game.store.flag('inn_first_night'),
    cost = free ? 0 : 2 * explore.members.length;
  return { free, cost, ok: (explore.game.store.cp.gold || 0) >= cost };
}
/** Paga y hace un descanso largo en la posada. */
async function stayAtInn(explore) {
  let { cost } = innPrice(explore);
  (cost && !explore.rules.gold(-cost)) ||
    (explore.game.store.setFlag('inn_first_night', !0),
    await doRest(
      explore,
      'largo',
      'Cen\xE1is caliente, dorm\xEDs bajo techo y, por una noche, nadie os despierta.',
      {
        where: 'posada',
      },
    ));
}
/**
 * Descanso: pantalla «descanso» o diálogo; el largo solo junto a una hoguera o en la posada y sin
 * enemigos cerca.
 */
async function openRest(explore, { camp = !1, where = '' } = {}) {
  if (explore.isBusy()) return;
  explore.stopAll();
  let cp = explore.game.store.cp,
    danger = enemiesNear(explore),
    safe = camp;
  for (let [id, obj] of explore.objects)
    obj.type === 'campfire' &&
      explore.objectVisible(obj) &&
      hexDistance(obj.cell, explore.lead().cell) <= 3 &&
      ((safe = !0), (where ||= obj.name));
  let shortLeft = cp.short_rests_left ?? 2,
    allowShort = shortLeft > 0 && !danger,
    allowLong = safe && !danger,
    reason = danger ? 'hay enemigos cerca' : '';
  if (explore.hasScreen('descanso')) {
    let res = await explore.openScreen('descanso', {
      kind: 'elegir',
      where: where || explore.level.name,
      allowShort,
      allowLong,
      reason,
      shortLeft,
    });
    res?.kind && (await afterRest(explore, res.kind, { ...res, screen: !0 }));
    return;
  }
  let lines = explore.members.map((m) => {
      let hp = explore.rules.hp(m.id);
      return `${explore.rules.shortName(m.id)}: ${hp.hp}/${hp.max} PG \xB7 ${explore.rules.state(m.id).hit_dice ?? '?'} dados de golpe`;
    }),
    choice = await explore.choose({
      speaker: 'Descansar',
      title: `D\xEDa ${cp.day || 1}${where ? ` \xB7 ${where}` : ''}`,
      text: `${lines.join(`
`)}

*El descanso corto cura con los dados de golpe y recupera algunos recursos (como mucho dos entre descansos largos). El largo lo restablece todo.*`,
      options: [
        {
          text: `Descanso corto: 1 hora (quedan ${shortLeft})`,
          value: 'corto',
          disabled: !allowShort,
          hint: allowShort ? null : reason || 'haced un descanso largo',
        },
        {
          text: 'Descanso largo: hasta ma\xF1ana',
          value: 'largo',
          disabled: !allowLong,
          hint: allowLong ? null : reason || 'solo en la posada o junto a una hoguera segura',
        },
        { text: 'Seguir', kind: 'end', value: null },
      ],
    });
  choice &&
    (await doRest(
      explore,
      choice,
      choice === 'largo' ? 'Mont\xE1is guardias junto al fuego. La noche pasa sin sobresaltos.' : '',
      { where },
    ));
}
/** Hace el descanso `kind` («corto» o «largo») con el núcleo o con el sustituto. */
async function doRest(explore, kind, text = '', { where = '' } = {}) {
  let rules = explore.rules,
    cp = explore.game.store.cp,
    report = null;
  if (explore.hasScreen('descanso')) {
    let res = await explore.openScreen('descanso', {
      kind,
      where: where || explore.level.name,
      allowShort: !0,
      allowLong: !0,
      text,
    });
    res?.kind && (await afterRest(explore, res.kind, { ...res, screen: !0 }));
    return;
  }
  (await explore.withBusy(async () => {
    if (kind === 'corto') {
      let res = rules.call('cp_short_rest', { cp });
      if (res?.cp) (rules.apply(res), (report = res.report));
      else {
        (rules.fallback('cp_short_rest'), (report = {}));
        for (let m of explore.members) {
          let st = rules.state(m.id),
            hp = rules.hp(m.id),
            dice = Math.min(st.hit_dice ?? 1, hp.hp < hp.max ? 1 : 0),
            healed = dice ? Math.min(hp.max - hp.hp, rules.roll('1d8') + rules.abilityMod(m.id, 'con')) : 0;
          ((st.hp = hp.hp + Math.max(0, healed)),
            (st.hit_dice = (st.hit_dice ?? 1) - dice),
            (report[m.id] = { healed: Math.max(0, healed), dice }));
        }
        ((cp.short_rests_left = Math.max(0, (cp.short_rests_left ?? 2) - 1)), explore.game.store.set(cp));
      }
      await showInterlude(explore.game.ui.root, 'Una hora despu\xE9s\u2026', 1100);
    } else {
      let res = rules.call('cp_long_rest', { cp });
      if (res?.cp) rules.apply(res);
      else {
        rules.fallback('cp_long_rest');
        for (let id of cp.party) {
          let st = rules.state(id);
          st.dead || ((st.hp = rules.hp(id).max), (st.temp_hp = 0), (st.hit_dice = rules.level()));
        }
        ((cp.short_rests_left = 2), (cp.day = (cp.day || 1) + 1), explore.game.store.set(cp));
      }
      await showInterlude(explore.game.ui.root, `Amanece. D\xEDa ${explore.game.store.cp.day || 1}.`, 1400);
    }
  }),
    await afterRest(explore, kind, { report, text }));
}
/** Tras descansar: reconstruye el grupo, avisa y guarda la partida automática. */
async function afterRest(explore, kind, opts = {}) {
  let rules = explore.rules;
  if ((await explore.rebuildParty(), opts.screen)) {
    (explore.updateHud(), explore.game.store.save('auto'));
    return;
  }
  if (kind === 'corto') {
    let report = opts.report || {},
      lines = explore.members
        .filter((m) => report[m.id]?.healed > 0)
        .map((m) => `${rules.shortName(m.id)} +${report[m.id].healed} PG`);
    (explore.toast(
      `Descanso corto. ${lines.length ? lines.join(', ') : 'Nadie necesitaba curarse.'}`,
      'bien',
      5e3,
    ),
      explore.game.bus.emit('rest:short', { report }));
  } else
    (opts.text && explore.toast(opts.text, 'bien', 5500),
      explore.game.bus.emit('rest:long', { level: explore.levelId }));
  (explore.updateHud(), explore.game.store.save('auto'));
}
/**
 * Etiqueta y anclas del objetivo bajo el puntero (npc, enemy, member, object, exit):
 * {title, sub, bad, anchor, ring, ringKind, size}.
 */
function hoverInfo(explore, target) {
  let above = (dy) => (v) => v.copy(target.actor.root.position).add(new Vector3(0, dy, 0)),
    ringAt = (actor) => (v) => v.copy(actor.root.position);
  switch (target.kind) {
    case 'npc': {
      let npc = explore.npcs.get(target.id);
      return {
        title: npc.def.name,
        sub: npc.def.title || 'Hablar',
        anchor: above((npc.actor.height || 1.7) + 0.35),
        ring: ringAt(npc.actor),
        ringKind: 'npc',
      };
    }
    case 'enemy': {
      let enemy = explore.enemy(target.id),
        group = explore.groups.get(enemy.group),
        sub =
          group.def.talk &&
          (typeof explore.game.story?.interact == 'function' || !explore.ls.talked.includes(group.def.id))
            ? 'Hablar'
            : explore.stealth && (group.roll?.success || !group.roll)
              ? 'Atacar por sorpresa'
              : 'Atacar';
      return {
        title: enemy.name,
        sub,
        bad: !0,
        anchor: above((enemy.actor.height || 1.4) + 0.3),
        ring: ringAt(enemy.actor),
        ringKind: 'enemy',
      };
    }
    case 'member':
      return {
        title: explore.rules.name(target.id),
        sub: target.id === explore.leader ? 'Va en cabeza' : 'Poner en cabeza',
        anchor: above((target.actor.height || 1.7) + 0.35),
        ring: null,
      };
    case 'object': {
      let obj = explore.objects.get(target.id),
        anchorObj = explore.anchorOf(target.id),
        pos = anchorObj ? anchorObj.getWorldPosition(new Vector3()) : explore.world.cellToWorld(obj.cell),
        lift = obj.type === 'sign' || obj.type === 'board' ? 1.7 : obj.type === 'door' ? 2.4 : 1,
        anchorFn = (v) => v.copy(pos).add(new Vector3(0, lift, 0)),
        sub = '',
        bad = !1;
      switch (obj.type) {
        case 'chest':
          sub =
            obj.lock && !explore.ls.unlocked.includes(obj.id)
              ? 'Cerrado con llave'
              : explore.ls.opened.includes(obj.id) && !lootOf(explore, obj).length
                ? 'Vac\xEDo'
                : 'Abrir';
          break;
        case 'cache':
        case 'loot':
          sub = 'Registrar';
          break;
        case 'sign':
        case 'board':
          sub = 'Leer';
          break;
        case 'door':
          sub =
            obj.npc && explore.npcs.has(obj.npc)
              ? `Llamar \xB7 ${explore.npcs.get(obj.npc).def.name}`
              : obj.to
                ? explore.flag(obj.requires)
                  ? 'Entrar'
                  : 'Cerrada'
                : explore.ls.states[obj.id] === 'open'
                  ? 'Abierta'
                  : 'Llamar';
          break;
        case 'inn':
          sub = 'Pasar la noche';
          break;
        case 'trap':
          ((sub = 'Trampa \xB7 desactivar'), (bad = !0));
          break;
        case 'stairs':
          sub = /merrowick/.test(obj.to || '') ? 'Subir' : 'Bajar';
          break;
        case 'campfire':
          sub = 'Descansar';
          break;
        default:
          sub = 'Examinar';
      }
      return {
        title: obj.name || obj.id,
        sub,
        bad,
        anchor: anchorFn,
        ring: (v) => v.copy(pos),
        ringKind: bad ? 'enemy' : 'object',
        size: obj.type === 'door' ? 1.3 : 1,
      };
    }
    case 'exit': {
      let exit = target.exit,
        open = explore.flag(exit.requires) && !!exit.to,
        pos = explore.world.cellToWorld(target.cell);
      return {
        title: exit.label || 'Salida',
        sub: open ? 'Salir' : 'Cerrado',
        bad: !open,
        anchor: (v) => v.copy(pos).add(new Vector3(0, 1.2, 0)),
        ring: null,
      };
    }
    default:
      return null;
  }
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const lowerFirst = (text) => text && text[0].toLowerCase() + text.slice(1);
/** Modificador con signo («+3», «-1»). */
const signed = (n) => (n >= 0 ? `+${n}` : `${n}`);

export {
  lootOf,
  storyInteract,
  useObject,
  revealObject,
  talkToMember,
  hoverInfo,
  springTrap,
  talkToNpc,
  openRest,
};
