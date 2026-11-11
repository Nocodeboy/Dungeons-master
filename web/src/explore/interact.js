// explore/interact.js
// Reconstruido de publicado/juego.js (módulo __esm «ty»). Nombres locales aún minificados.

import { Vector3 } from 'three';
import { cellKey, neighbors, hexDistance } from './hex.js';
import { lootDialog, showInterlude } from './hud.js';
import './checks.js';
import { Uo } from './battle.js';

async function f0(o, e, { actorId: t = null, adjacent: a = !0 } = {}) {
  let n = o.member(t) || o.lead();
  if (!n) return !1;
  if ((a && hexDistance(n.cell, e) <= 1) || (n.cell[0] === e[0] && n.cell[1] === e[1]))
    return (n.moving && o.stopAll(), o.faceTo(n.id, e), !0);
  let s = o.blocked(),
    i = null;
  if (!a && o.xmap.walkable(e) && !s.has(cellKey(e[0], e[1]))) i = e;
  else {
    let l = null;
    for (let c of neighbors(e[0], e[1])) {
      if (!o.xmap.walkable(c) || s.has(cellKey(c[0], c[1]))) continue;
      let d = o.xmap.path(n.cell, c, s);
      d.length && (!l || d.length < l.length) && (l = d);
    }
    i = l ? l[l.length - 1] : null;
  }
  if (!i)
    return (o.toast('No hay forma de llegar hasta ah\xED.', 'apagado'), o.game.bus.emit('ui:error', {}), !1);
  let r = await o.moveParty(i, { leaderId: n.id });
  return (r && o.faceTo(n.id, e), r);
}
async function Wu(o, e) {
  let t = o.game;
  t.bus.emit('interact', { object: e.object, level: o.levelId, actor: e.actor, kind: e.kind });
  let a = t.story?.interact;
  if (typeof a != 'function') return !1;
  try {
    return !!(await o.withBusy(() => a.call(t.story, { ...e, level: o.levelId, explore: t.explore })));
  } catch (n) {
    return (console.error('[exploraci\xF3n] story.interact', n), !1);
  }
}
function Ju(o, e) {
  return o.ls.loot[e.id]
    ? o.ls.loot[e.id]
    : (e.loot || []).map((t) => ({ id: t[0], n: t[1] ?? 1, unid: o.rules.unidentified(t[0]) }));
}
async function Vk(o, e, t = o.leader) {
  let a = o.objects.get(e);
  if (!a) return;
  let n = Ju(o, a);
  if (
    ((o.ls.loot[e] = n),
    o.ls.opened.includes(e) || o.ls.opened.push(e),
    o.world.setObjectState?.(e, n.length ? 'open' : 'empty'),
    o.game.bus.emit('object:state', { id: e, object: a, state: 'open' }),
    !n.length)
  ) {
    (o.toast(`${a.name || 'Cofre'}: vac\xEDo.`, 'apagado'), o.refreshObject(e));
    return;
  }
  let s = n.filter((r) => r.id === 'gold').reduce((r, l) => r + l.n, 0),
    i = n.filter((r) => r.id !== 'gold');
  if (o.hasScreen('botin')) {
    let r = await o.withBusy(() =>
      o.game.ui.open('botin', { title: a.name || 'Bot\xEDn', items: i, gold: s, object: e }),
    );
    if (r) {
      let l = (r.left || [])
          .filter((d) => d.id !== 'gold')
          .map((d) => ({ id: d.id, n: d.n ?? 1, unid: !!d.unid })),
        c =
          (r.left || []).filter((d) => d.id === 'gold').reduce((d, u) => d + (u.n || 0), 0) ||
          Math.max(0, s - (Number(r.gold) || 0));
      ((o.ls.loot[e] = c > 0 ? [{ id: 'gold', n: c, unid: !1 }, ...l] : l),
        ((r.taken || []).length || r.gold) &&
          o.game.bus.emit('loot:taken', {
            items: r.taken || [],
            gold: Number(r.gold) || 0,
            by: t,
            object: a,
          }));
    }
  } else {
    let r = await o.withBusy(() =>
      lootDialog(o.game.ui.root, {
        title: a.name || 'Bot\xEDn',
        items: i,
        gold: s,
        names: (l) => o.rules.itemName(l),
      }),
    );
    gN(o, e, n, i, r, t);
  }
  (o.world.setObjectState?.(e, o.ls.loot[e].length ? 'open' : 'empty'), o.refreshObject(e), o.updateHud());
}
function gN(o, e, t, a, n, s) {
  if (!n) return;
  let i = new Set();
  for (let h of n.taken || [])
    if (typeof h == 'number') i.add(h);
    else {
      let p = a.findIndex((m, _) => !i.has(_) && m.id === h.id);
      p >= 0 && i.add(p);
    }
  let r = [],
    l = new Map();
  for (let h of i) {
    let p = a[h];
    if (!p) continue;
    let m = o.rules.give(p.id, p.n, !!p.unid);
    r.push({ id: p.id, n: p.n, who: m });
    let _ = m ? o.rules.shortName(m) : '';
    (l.has(_) || l.set(_, []), l.get(_).push(`${o.rules.itemName(p.id)}${p.n > 1 ? ` \xD7${p.n}` : ''}`));
  }
  let c =
    typeof n.gold == 'number'
      ? n.gold
      : n.gold
        ? t.filter((h) => h.id === 'gold').reduce((h, p) => h + p.n, 0)
        : 0;
  c > 0 && o.rules.gold(c);
  let d = a.filter((h, p) => !i.has(p)),
    u = t.filter((h) => h.id === 'gold').reduce((h, p) => h + p.n, 0) - c;
  if ((u > 0 && d.unshift({ id: 'gold', n: u, unid: !1 }), (o.ls.loot[e] = d), r.length || c)) {
    o.game.bus.emit('loot:taken', { items: r, gold: c, by: s, object: o.objects.get(e) || e });
    let h = [];
    c && h.push(`+${c} po`);
    for (let [p, m] of l) h.push(`${p ? `${p} guarda ` : ''}${m.join(', ')}`);
    o.toast(h.join(' \xB7 '), 'botin', 5e3);
  }
}
function bN(o) {
  for (let e of o.members)
    if ((o.rules.summary(e.id)?.spells?.prepared || []).some((n) => (n.id || n) === 'knock')) return e.id;
  return null;
}
async function iy(o, e) {
  let t = o.objects.get(e),
    a = t.lock || {},
    n = a.dc ?? 13,
    s = o.rules,
    i = [];
  if (a.key) {
    let h = s.holder(a.key);
    h &&
      i.push({
        text: `Abrir con ${Ku(s.itemName(a.key))} (la lleva ${s.shortName(h)})`,
        value: { how: 'key', who: h },
      });
  }
  if (s.holder('thieves_tools')) {
    let h = s.best('thieves_tools');
    i.push({
      text: `Forzar la cerradura: ${s.shortName(h.who)}`,
      tag: `[Herramientas de ladr\xF3n ${ry(h.mod)} \xB7 CD ${n}]`,
      kind: 'check',
      value: { how: 'tools', who: h.who },
    });
  } else i.push({ text: 'Forzar la cerradura', hint: 'hacen falta herramientas de ladr\xF3n', disabled: !0 });
  let l = bN(o);
  l &&
    i.push({
      text: `${s.shortName(l)} lanza Abrir`,
      tag: '[Conjuro de nivel 2]',
      kind: 'special',
      value: { how: 'knock', who: l },
    });
  let c = s.best('athletics'),
    d = s.holder('crowbar');
  (i.push({
    text: `Romperla a golpes: ${s.shortName(c.who)}${d ? ', con la palanca' : ''}`,
    tag: `[Atletismo ${ry(c.mod)} \xB7 CD ${n + 2}${d ? ' \xB7 ventaja' : ''}]`,
    kind: 'check',
    value: { how: 'force', who: c.who },
  }),
    i.push({ text: 'Dejarlo', kind: 'end', value: null }));
  let u = await o.choose({
    speaker: t.name || 'Cerradura',
    title: 'Cerrado con llave',
    text: t.lock_text || 'Una cerradura s\xF3lida. Habr\xE1 que abrirla de alguna forma.',
    options: i,
  });
  return u ? vN(o, e, u.how, u.who, n) : !1;
}
async function vN(o, e, t, a, n) {
  let s = o.objects.get(e),
    i = o.rules;
  if (!(await f0(o, s.cell, { actorId: a }))) return !1;
  let r = o.member(a)?.actor;
  return o.withBusy(async () => {
    if (t === 'key')
      return (await r?.once('interact'), oy(o, e, a, 'key', `${i.shortName(a)} gira la llave.`));
    if (t === 'knock')
      return (
        await r?.once('cast'),
        i.call('cp_cast', { cp: o.game.store.cp, who: a, spell: 'knock' }),
        $k(o, s.cell, 'Un golpe seco resuena: el conjuro Abrir no es nada discreto.'),
        oy(o, e, a, 'knock', 'La cerradura cede con un chasquido.')
      );
    let l =
        t === 'tools'
          ? i.check({ who: a, tool: 'thieves_tools', dc: n })
          : i.check({ who: a, skill: 'athletics', dc: n + 2, adv: !!i.holder('crowbar') }),
      c = r?.once(t === 'tools' ? 'kneel' : 'attack_melee', { speed: t === 'tools' ? 1.4 : 1.2 });
    return (
      await sy(t === 'tools' ? 900 : 500),
      Wk(o, a, l),
      await c,
      t === 'force' && $k(o, s.cell, 'Los golpes se oyen desde lejos.'),
      l.success
        ? oy(o, e, a, t, `${i.shortName(a)} lo consigue (${l.total} contra CD ${l.dc}).`)
        : (o.game.bus.emit('ui:error', {}),
          o.toast(
            `${i.shortName(a)} no lo consigue (${l.total} contra CD ${l.dc}). Puede volver a intentarlo.`,
            'mal',
          ),
          !1)
    );
  });
}
function Wk(o, e, t) {
  let a = o.member(e)?.actor;
  a &&
    o.overlay.float(
      (n) => a.head(n).add(new Vector3(0, 0.25, 0)),
      `${t.label} ${t.total}`,
      t.success ? 'bien' : 'mal',
      { dur: 1.6 },
    );
}
function $k(o, e, t) {
  for (let [a, n] of o.groups)
    if (!n.hidden && n.enemies.some((s) => !s.dead && hexDistance(s.cell, e) <= 7)) {
      (o.toast(t, 'mal'), setTimeout(() => !o.inBattle && o.groups.has(a) && Uo(o, a, {}), 900));
      return;
    }
}
function oy(o, e, t, a, n) {
  return (
    o.ls.unlocked.includes(e) || o.ls.unlocked.push(e),
    o.game.bus.emit('lock:opened', { object: o.objects.get(e) || e, by: t, how: a }),
    o.toast(n, 'bien'),
    !0
  );
}
function Xu(o, e, t, a) {
  let n = o.objects.get(e);
  if (!n || o.ls.found.includes(e)) return;
  (o.ls.found.push(e), o.refreshObject(e));
  let s = n.type === 'trap',
    i = o.world.cellToWorld(n.cell).add(new Vector3(0, 0.9, 0));
  o.overlay.float(i, s ? '\xA1Trampa!' : '\xA1Algo escondido!', s ? 'mal' : 'oro', { dur: 1.8, size: 1.15 });
  let r = t ? o.rules.shortName(t) : '';
  (s
    ? (o.stopAll(),
      o.toast(`${r} ve una trampa: ${Ku(n.name || 'trampa')}${a ? ` (${a})` : ''}.`, 'mal', 5e3))
    : o.toast(`${r} encuentra ${Ku(n.name || 'algo')}${a ? ` (${a})` : ''}.`, 'botin', 5e3),
    n.found_text && o.hint(n.found_text),
    o.game.bus.emit('hidden:found', { object: n, by: t }));
}
async function yN(o, e) {
  let t = o.objects.get(e),
    a = o.rules,
    n = t.dc_disarm ?? 13,
    s = [];
  if (a.holder('thieves_tools')) {
    let r = a.best('thieves_tools');
    s.push({
      text: `Desactivarla: ${a.shortName(r.who)}`,
      tag: `[Herramientas de ladr\xF3n ${ry(r.mod)} \xB7 CD ${n}]`,
      kind: 'check',
      value: r.who,
    });
  } else s.push({ text: 'Desactivarla', hint: 'hacen falta herramientas de ladr\xF3n', disabled: !0 });
  s.push({ text: 'Dejarla y rodearla', kind: 'end', value: null });
  let i = await o.choose({
    speaker: t.name || 'Trampa',
    title: 'Trampa descubierta',
    text: t.desc || 'Un mecanismo escondido. Si alguien lo pisa, saltar\xE1.',
    options: s,
  });
  i &&
    (await f0(o, t.cell, { actorId: i })) &&
    (await o.withBusy(async () => {
      let r = o.member(i)?.actor,
        l = a.check({ who: i, tool: 'thieves_tools', dc: n }),
        c = r?.once('kneel', { speed: 1.3 });
      (await sy(1e3),
        Wk(o, i, l),
        await c,
        l.success
          ? (o.ls.disarmed.push(e),
            o.refreshObject(e),
            o.world.setObjectState?.(e, 'disarmed'),
            o.toast(
              `${a.shortName(i)} desactiva ${Ku(t.name || 'la trampa')} (${l.total} contra CD ${n}).`,
              'bien',
            ),
            o.game.bus.emit('trap:disarmed', { object: t, by: i }))
          : l.total <= n - 5
            ? (o.toast(`${a.shortName(i)} se equivoca (${l.total} contra CD ${n})\u2026`, 'mal'),
              await sy(400),
              cy(o, e, i))
            : (o.game.bus.emit('ui:error', {}),
              o.toast(
                `${a.shortName(i)} no lo consigue (${l.total} contra CD ${n}). Puede volver a intentarlo.`,
                'mal',
              )));
    }));
}
function cy(o, e, t) {
  o.stopAll();
  let a = o.objects.get(e),
    n = o.rules;
  (o.ls.found.includes(e) || o.ls.found.push(e), o.ls.disarmed.includes(e) || o.ls.disarmed.push(e));
  let s = n.roll(a.damage ?? '1d6'),
    i = `\xA1${n.shortName(t)} pisa ${Ku(a.name || 'una trampa')}!`;
  if (a.save && s > 0) {
    let l = n.check({ who: t, save: a.save.ab || 'dex', dc: a.save.dc ?? 12 });
    l.success
      ? ((s = Math.floor(s / 2)), (i += ` Salva (${l.total}) y se lleva la mitad.`))
      : (i += ` Falla la salvaci\xF3n (${l.total}).`);
  }
  let r = o.member(t);
  (s > 0 &&
    (n.damage(t, s, a.dtype || 'piercing'),
    r?.actor.once('hit', { speed: 1.2 }),
    r && o.overlay.float((l) => r.actor.head(l), `-${s}`, 'mal', { size: 1.3 })),
    o.world.setObjectState?.(e, 'sprung'),
    o.marks.trap(e, null),
    o.refreshObject(e),
    o.toast(i + (s > 0 ? ` ${s} de da\xF1o.` : ''), 'mal', 5500),
    o.game.bus.emit('trap:triggered', { object: a, by: t }),
    o.updateHud(),
    a.alarm &&
      (o.hud?.banner?.('\xA1Una alarma!', 'mal', 1300),
      o.toast('Una cuerda tensa, un ruido de latas: el campamento sabe que est\xE1is aqu\xED.', 'mal'),
      o.groups.has(a.alarm) && setTimeout(() => !o.inBattle && Uo(o, a.alarm, {}), 1300)));
}
async function xN(o, e) {
  let t = o.objects.get(e);
  if (t.npc && o.npcs.has(t.npc)) return m0(o, t.npc, { skipApproach: !0 });
  if (t.to) {
    if (!o.flag(t.requires)) {
      o.toast(t.closed || 'La puerta est\xE1 cerrada.', 'apagado', 4500);
      return;
    }
    if (t.lock && !o.ls.unlocked.includes(e) && !(await iy(o, e))) return;
    (o.world.setObjectState?.(e, 'open'),
      o.game.bus.emit('object:state', { id: e, object: t, state: 'open' }),
      await new Promise((a) => setTimeout(a, 350)),
      o.disposed || o.useExit({ to: t.to }));
    return;
  }
  if (t.target) {
    o.toast(
      `${t.name || 'Puerta'}: ${t.closed || 'La puerta est\xE1 cerrada. Nadie contesta.'}`,
      'apagado',
      4500,
    );
    return;
  }
  if (o.ls.states[e] === 'open') {
    o.toast(`${t.name || 'La puerta'} ya est\xE1 abierta.`, 'apagado');
    return;
  }
  if (!o.flag(t.requires)) {
    o.toast(
      t.closed || 'No se abre. No hay tirador, ni bisagras, ni cerradura: algo la mantiene cerrada.',
      'apagado',
      5e3,
    );
    return;
  }
  (t.lock && !o.ls.unlocked.includes(e) && !(await iy(o, e))) || _N(o, e);
}
function _N(o, e) {
  let t = o.objects.get(e);
  ((o.ls.states[e] = 'open'),
    t?.cell && !t.target && o.xmap.setTile(t.cell, t.open_tile || '.'),
    o.world.setObjectState?.(e, 'open'),
    o.game.bus.emit('object:state', { id: e, object: t, state: 'open' }),
    o.refreshObject(e));
}
async function Xk(o, e) {
  let t = o.objects.get(e);
  if (!t) return;
  if (t.type === 'door' && t.npc && o.npcs.has(t.npc)) return m0(o, t.npc);
  if (!(await f0(o, t.cell, { adjacent: !0 })) || o.disposed) return;
  let n = o.leader;
  if (await Wu(o, { object: t, kind: 'object', actor: n })) {
    o.refreshObject(e);
    return;
  }
  let s = o.member(n)?.actor;
  switch (t.type) {
    case 'chest':
    case 'cache':
    case 'loot':
      t.lock && !o.ls.unlocked.includes(e)
        ? (s?.once('interact'), (await iy(o, e)) && (await Vk(o, e, n)))
        : (await o.withBusy(() => s?.once(t.type === 'chest' ? 'interact' : 'kneel', { speed: 1.5 })),
          await Vk(o, e, n));
      break;
    case 'sign':
    case 'board':
    case 'inspect':
    case 'rune':
    case 'seal': {
      s?.once('interact');
      let i = [].concat(
        t.text ||
          (t.type === 'rune' || t.type === 'seal'
            ? ['Unas runas durn talladas en la piedra. No pasa nada al tocarlas\u2026 todav\xEDa.']
            : ['\u2026']),
      );
      (await o.narrate(i, { title: t.name || '', sub: t.type === 'board' ? 'Tabl\xF3n de anuncios' : '' }),
        t.journal && o.addJournal(t.journal),
        t.sets && o.game.store.setFlag(t.sets, !0));
      break;
    }
    case 'door':
      await xN(o, e);
      break;
    case 'trap':
      await yN(o, e);
      break;
    case 'stairs': {
      let i = /merrowick|arriba|subir/i.test(t.to || '') || /sube/i.test((t.text || []).join(' '));
      (await o.choose({
        speaker: t.name || 'Escalera',
        text:
          (t.text || []).map((l) => o.heroText(l)).join(`

`) || (i ? 'La escalera sube.' : 'La escalera baja a la oscuridad.'),
        options: [
          { text: i ? 'Subir' : 'Bajar', value: 'go' },
          { text: 'Todav\xEDa no', kind: 'end', value: null },
        ],
      })) === 'go' && o.useExit({ to: t.to });
      break;
    }
    case 'campfire':
      await uy(o, { camp: !0, where: t.name });
      break;
    case 'inn': {
      s?.once('interact');
      let i = dy(o);
      (await o.choose({
        speaker: t.name || 'Habitaciones',
        text:
          [].concat(t.text || []).map((l) => o.heroText(l)).join(`

`) || 'Una escalera estrecha sube a las habitaciones.',
        options: [
          {
            text: `Pasar la noche (${i.free ? 'invita la casa' : `${i.cost} po`})`,
            value: 'inn',
            disabled: !i.ok,
            hint: i.ok ? null : 'no os llega',
          },
          { text: 'Todav\xEDa no', kind: 'end', value: null },
        ],
      })) === 'inn' && (await Kk(o));
      break;
    }
    default:
      t.text && (await o.narrate(t.text, { title: t.name || '' }));
      break;
  }
}
async function Yk(o, e) {
  let t = o.member(e);
  if (!t || o.isBusy()) return;
  let a = o.lead();
  if (
    (a && a.id !== e && (o.faceTo(e, a.id), o.faceTo(a.id, t.cell)),
    await Wu(o, { object: e, kind: 'npc', actor: o.leader, companion: !0 }))
  )
    return;
  let n = ['\xBFSeguimos?', 'Te escucho.', 'Aqu\xED estoy.', 'No me gusta este silencio.'];
  o.say(e, n[Math.floor(Math.random() * n.length)], { dur: 2.5 });
}
async function m0(o, e, { skipApproach: t = !1 } = {}) {
  let a = o.npcs.get(e);
  if (!a || (!t && (!(await f0(o, a.cell, { adjacent: !0 })) || o.disposed))) return;
  let n = o.lead();
  (n && (o.faceTo(e, n.id), o.faceTo(n.id, a.cell)), a.actor.once('interact'));
  let s = a.def;
  (await Wu(o, { object: s, kind: 'npc', actor: o.leader })) || (await wN(o, e));
}
async function wN(o, e) {
  let t = o.npcs.get(e),
    a = t.def,
    n = o.rules,
    s = [].concat(a.greet || ['\u2026']),
    i = `*${s[Math.floor(Math.random() * s.length)]}*`,
    r = !1,
    l =
      o.game.ui.portrait?.(a.id) ||
      (await o.factory.portrait(t.actor, { id: a.id, name: a.name, class: a.visual?.class }));
  for (;;) {
    let c = [];
    if ((a.shop && c.push({ text: 'Comerciar', value: 'shop' }), a.inn)) {
      let u = dy(o);
      c.push({
        text: `Pasar la noche (${u.free ? 'invita la casa' : `${u.cost} po`})`,
        value: 'inn',
        disabled: !u.ok,
        hint: u.ok ? null : 'no os llega',
      });
    }
    if (a.temple) {
      (c.push({ text: 'Curar heridas (10 po)', value: 'heal', disabled: (o.game.store.cp.gold || 0) < 10 }),
        c.push({
          text: 'Identificar objetos (20 po)',
          value: 'identify',
          disabled: (o.game.store.cp.gold || 0) < 20,
        }));
      for (let u of o.dead)
        c.push({
          text: `Devolver a la vida a ${n.shortName(u)} (150 po)`,
          value: `raise:${u}`,
          disabled: (o.game.store.cp.gold || 0) < 150,
        });
    }
    (a.talk?.length && !r && c.push({ text: 'Preguntar', value: 'ask' }),
      c.push({ text: 'Adi\xF3s', kind: 'end', value: 'bye' }));
    let d = await o.choose({ speaker: a.name, title: a.title || '', portrait: l, text: i, options: c });
    if (!d || d === 'bye') break;
    if (d === 'ask') {
      ((r = !0),
        (i = [].concat(a.talk).map((u) => `*${u}*`).join(`

`)),
        a.journal && o.addJournal(a.journal),
        a.sets && o.game.store.setFlag(a.sets, !0));
      continue;
    }
    if (d === 'shop') {
      await o.openScreen('tienda', { merchant: a.shop, npc: e });
      break;
    }
    if (d === 'inn') {
      await Kk(o);
      break;
    }
    if (d === 'heal') {
      if (!n.gold(-10)) break;
      let u = n.call('cp_heal', { cp: o.game.store.cp, id: 'all' });
      if (u?.cp) n.apply(u);
      else {
        for (let h of o.members) n.state(h.id).hp = n.hp(h.id).max;
        o.game.store.set(o.game.store.cp);
      }
      (o.game.bus.emit('ui:sfx', { name: 'curacion' }),
        (i = '*Hermana Aldis os pone las manos encima y murmura una oraci\xF3n. Las heridas se cierran.*'),
        o.toast('Todos recuper\xE1is los puntos de golpe.', 'bien'),
        o.updateHud());
      continue;
    }
    if (d === 'identify') {
      let u = n.call('identify', { cp: o.game.store.cp, cost: 20 });
      u?.cp && u.ok !== !1
        ? (n.apply(u),
          o.toast(
            u.identified?.length
              ? `Identificado: ${u.identified.map((h) => h.name || h).join(', ')}.`
              : 'No hab\xEDa nada que identificar.',
            'magia',
            6e3,
          ))
        : o.toast('Identificar todav\xEDa no est\xE1 disponible.', 'apagado');
      continue;
    }
    if (d.startsWith('raise:')) {
      let u = d.slice(6);
      if (!n.gold(-150)) break;
      let h = n.call('cp_revive', { cp: o.game.store.cp, id: u });
      if (h?.cp) n.apply(h);
      else {
        let p = n.state(u);
        ((p.dead = !1), (p.hp = 1), o.game.store.set(o.game.store.cp));
      }
      (o.game.bus.emit('ui:sfx', { name: 'curacion' }),
        o.toast(`${n.shortName(u)} vuelve a respirar.`, 'bien', 5e3),
        await o.rebuildParty());
      break;
    }
  }
  t.actor.anim(t.def.anim || 'idle');
}
function TN(o, e = 14) {
  for (let t of o.groups.values())
    for (let a of t.enemies)
      if (!a.dead) {
        for (let n of o.members) if (hexDistance(a.cell, n.cell) <= e) return !0;
      }
  return !1;
}
function dy(o) {
  let e = !o.game.store.flag('inn_first_night'),
    t = e ? 0 : 2 * o.members.length;
  return { free: e, cost: t, ok: (o.game.store.cp.gold || 0) >= t };
}
async function Kk(o) {
  let { cost: e } = dy(o);
  (e && !o.rules.gold(-e)) ||
    (o.game.store.setFlag('inn_first_night', !0),
    await Jk(o, 'largo', 'Cen\xE1is caliente, dorm\xEDs bajo techo y, por una noche, nadie os despierta.', {
      where: 'posada',
    }));
}
async function uy(o, { camp: e = !1, where: t = '' } = {}) {
  if (o.isBusy()) return;
  o.stopAll();
  let a = o.game.store.cp,
    n = TN(o),
    s = e;
  for (let [h, p] of o.objects)
    p.type === 'campfire' &&
      o.objectVisible(p) &&
      hexDistance(p.cell, o.lead().cell) <= 3 &&
      ((s = !0), (t ||= p.name));
  let i = a.short_rests_left ?? 2,
    r = i > 0 && !n,
    l = s && !n,
    c = n ? 'hay enemigos cerca' : '';
  if (o.hasScreen('descanso')) {
    let h = await o.openScreen('descanso', {
      kind: 'elegir',
      where: t || o.level.name,
      allowShort: r,
      allowLong: l,
      reason: c,
      shortLeft: i,
    });
    h?.kind && (await ly(o, h.kind, { ...h, screen: !0 }));
    return;
  }
  let d = o.members.map((h) => {
      let p = o.rules.hp(h.id);
      return `${o.rules.shortName(h.id)}: ${p.hp}/${p.max} PG \xB7 ${o.rules.state(h.id).hit_dice ?? '?'} dados de golpe`;
    }),
    u = await o.choose({
      speaker: 'Descansar',
      title: `D\xEDa ${a.day || 1}${t ? ` \xB7 ${t}` : ''}`,
      text: `${d.join(`
`)}

*El descanso corto cura con los dados de golpe y recupera algunos recursos (como mucho dos entre descansos largos). El largo lo restablece todo.*`,
      options: [
        {
          text: `Descanso corto: 1 hora (quedan ${i})`,
          value: 'corto',
          disabled: !r,
          hint: r ? null : c || 'haced un descanso largo',
        },
        {
          text: 'Descanso largo: hasta ma\xF1ana',
          value: 'largo',
          disabled: !l,
          hint: l ? null : c || 'solo en la posada o junto a una hoguera segura',
        },
        { text: 'Seguir', kind: 'end', value: null },
      ],
    });
  u &&
    (await Jk(
      o,
      u,
      u === 'largo' ? 'Mont\xE1is guardias junto al fuego. La noche pasa sin sobresaltos.' : '',
      { where: t },
    ));
}
async function Jk(o, e, t = '', { where: a = '' } = {}) {
  let n = o.rules,
    s = o.game.store.cp,
    i = null;
  if (o.hasScreen('descanso')) {
    let r = await o.openScreen('descanso', {
      kind: e,
      where: a || o.level.name,
      allowShort: !0,
      allowLong: !0,
      text: t,
    });
    r?.kind && (await ly(o, r.kind, { ...r, screen: !0 }));
    return;
  }
  (await o.withBusy(async () => {
    if (e === 'corto') {
      let r = n.call('cp_short_rest', { cp: s });
      if (r?.cp) (n.apply(r), (i = r.report));
      else {
        (n.fallback('cp_short_rest'), (i = {}));
        for (let l of o.members) {
          let c = n.state(l.id),
            d = n.hp(l.id),
            u = Math.min(c.hit_dice ?? 1, d.hp < d.max ? 1 : 0),
            h = u ? Math.min(d.max - d.hp, n.roll('1d8') + n.abilityMod(l.id, 'con')) : 0;
          ((c.hp = d.hp + Math.max(0, h)),
            (c.hit_dice = (c.hit_dice ?? 1) - u),
            (i[l.id] = { healed: Math.max(0, h), dice: u }));
        }
        ((s.short_rests_left = Math.max(0, (s.short_rests_left ?? 2) - 1)), o.game.store.set(s));
      }
      await showInterlude(o.game.ui.root, 'Una hora despu\xE9s\u2026', 1100);
    } else {
      let r = n.call('cp_long_rest', { cp: s });
      if (r?.cp) n.apply(r);
      else {
        n.fallback('cp_long_rest');
        for (let l of s.party) {
          let c = n.state(l);
          c.dead || ((c.hp = n.hp(l).max), (c.temp_hp = 0), (c.hit_dice = n.level()));
        }
        ((s.short_rests_left = 2), (s.day = (s.day || 1) + 1), o.game.store.set(s));
      }
      await showInterlude(o.game.ui.root, `Amanece. D\xEDa ${o.game.store.cp.day || 1}.`, 1400);
    }
  }),
    await ly(o, e, { report: i, text: t }));
}
async function ly(o, e, t = {}) {
  let a = o.rules;
  if ((await o.rebuildParty(), t.screen)) {
    (o.updateHud(), o.game.store.save('auto'));
    return;
  }
  if (e === 'corto') {
    let n = t.report || {},
      s = o.members
        .filter((i) => n[i.id]?.healed > 0)
        .map((i) => `${a.shortName(i.id)} +${n[i.id].healed} PG`);
    (o.toast(`Descanso corto. ${s.length ? s.join(', ') : 'Nadie necesitaba curarse.'}`, 'bien', 5e3),
      o.game.bus.emit('rest:short', { report: n }));
  } else (t.text && o.toast(t.text, 'bien', 5500), o.game.bus.emit('rest:long', { level: o.levelId }));
  (o.updateHud(), o.game.store.save('auto'));
}
function Zk(o, e) {
  let t = (n) => (s) => s.copy(e.actor.root.position).add(new Vector3(0, n, 0)),
    a = (n) => (s) => s.copy(n.root.position);
  switch (e.kind) {
    case 'npc': {
      let n = o.npcs.get(e.id);
      return {
        title: n.def.name,
        sub: n.def.title || 'Hablar',
        anchor: t((n.actor.height || 1.7) + 0.35),
        ring: a(n.actor),
        ringKind: 'npc',
      };
    }
    case 'enemy': {
      let n = o.enemy(e.id),
        s = o.groups.get(n.group),
        i =
          s.def.talk && (typeof o.game.story?.interact == 'function' || !o.ls.talked.includes(s.def.id))
            ? 'Hablar'
            : o.stealth && (s.roll?.success || !s.roll)
              ? 'Atacar por sorpresa'
              : 'Atacar';
      return {
        title: n.name,
        sub: i,
        bad: !0,
        anchor: t((n.actor.height || 1.4) + 0.3),
        ring: a(n.actor),
        ringKind: 'enemy',
      };
    }
    case 'member':
      return {
        title: o.rules.name(e.id),
        sub: e.id === o.leader ? 'Va en cabeza' : 'Poner en cabeza',
        anchor: t((e.actor.height || 1.7) + 0.35),
        ring: null,
      };
    case 'object': {
      let n = o.objects.get(e.id),
        s = o.anchorOf(e.id),
        i = s ? s.getWorldPosition(new Vector3()) : o.world.cellToWorld(n.cell),
        r = n.type === 'sign' || n.type === 'board' ? 1.7 : n.type === 'door' ? 2.4 : 1,
        l = (u) => u.copy(i).add(new Vector3(0, r, 0)),
        c = '',
        d = !1;
      switch (n.type) {
        case 'chest':
          c =
            n.lock && !o.ls.unlocked.includes(n.id)
              ? 'Cerrado con llave'
              : o.ls.opened.includes(n.id) && !Ju(o, n).length
                ? 'Vac\xEDo'
                : 'Abrir';
          break;
        case 'cache':
        case 'loot':
          c = 'Registrar';
          break;
        case 'sign':
        case 'board':
          c = 'Leer';
          break;
        case 'door':
          c =
            n.npc && o.npcs.has(n.npc)
              ? `Llamar \xB7 ${o.npcs.get(n.npc).def.name}`
              : n.to
                ? o.flag(n.requires)
                  ? 'Entrar'
                  : 'Cerrada'
                : o.ls.states[n.id] === 'open'
                  ? 'Abierta'
                  : 'Llamar';
          break;
        case 'inn':
          c = 'Pasar la noche';
          break;
        case 'trap':
          ((c = 'Trampa \xB7 desactivar'), (d = !0));
          break;
        case 'stairs':
          c = /merrowick/.test(n.to || '') ? 'Subir' : 'Bajar';
          break;
        case 'campfire':
          c = 'Descansar';
          break;
        default:
          c = 'Examinar';
      }
      return {
        title: n.name || n.id,
        sub: c,
        bad: d,
        anchor: l,
        ring: (u) => u.copy(i),
        ringKind: d ? 'enemy' : 'object',
        size: n.type === 'door' ? 1.3 : 1,
      };
    }
    case 'exit': {
      let n = e.exit,
        s = o.flag(n.requires) && !!n.to,
        i = o.world.cellToWorld(e.cell);
      return {
        title: n.label || 'Salida',
        sub: s ? 'Salir' : 'Cerrado',
        bad: !s,
        anchor: (r) => r.copy(i).add(new Vector3(0, 1.2, 0)),
        ring: null,
      };
    }
    default:
      return null;
  }
}
const sy = (o) => new Promise((e) => setTimeout(e, o));
const Ku = (o) => o && o[0].toLowerCase() + o.slice(1);
const ry = (o) => (o >= 0 ? `+${o}` : `${o}`);

export { Ju, Wu, Xk, Xu, Yk, Zk, cy, m0, uy };
