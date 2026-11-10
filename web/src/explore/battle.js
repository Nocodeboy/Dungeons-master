// explore/battle.js
// Reconstruido de publicado/juego.js (módulo __esm «p0»). Nombres locales aún minificados.

import { MathUtils } from 'three';
import { hexDistance } from './hex.js';
import { rollDice } from './checks.js';

function Dc(o, e) {
  return new Promise((t) => {
    let a = performance.now(),
      n = () => {
        let s = Math.min(1, (performance.now() - a) / (o * 1e3));
        (e(s), s < 1 ? requestAnimationFrame(n) : t());
      };
    n();
  });
}
function qk(o, e, t, { speed: a = 3.8, anim: n = 'run' } = {}) {
  if (!t.length) return Promise.resolve();
  e.anim(n, { mps: a });
  let s = t.map((i) => o.world.cellToWorld(i));
  return new Promise((i) => {
    let r = performance.now(),
      l = () => {
        let c = performance.now(),
          d = Math.min(0.05, (c - r) / 1e3) * (o.turbo || 1);
        r = c;
        let u = e.root.position,
          h = a * d;
        for (; h > 0 && s.length;) {
          let p = s[0],
            m = p.x - u.x,
            _ = p.z - u.z,
            b = Math.hypot(m, _);
          (b > 1e-4 && (e.root.rotation.y = Math.atan2(m, _)),
            b <= h
              ? (u.set(p.x, p.y, p.z), s.shift(), (h -= b))
              : ((u.x += (m / b) * h), (u.z += (_ / b) * h), (h = 0)));
        }
        (o.world.heightAt && (u.y = o.world.heightAt(u.x, u.z)),
          s.length && !o.disposed ? requestAnimationFrame(l) : (e.anim('idle', { fade: 0.25 }), i()));
      };
    l();
  });
}
function ny(o, e) {
  let t = o.root.position,
    a = e.root.position;
  Math.abs(t.x - a.x) + Math.abs(t.z - a.z) > 0.001 && (o.root.rotation.y = Math.atan2(a.x - t.x, a.z - t.z));
}
async function Uk(o, e) {
  let t = o.enemy(e);
  if (!t) return;
  let a = o.groups.get(t.group);
  if (!a) return;
  let n = a.def.sight ?? 8,
    s = o.members.some((c) =>
      a.enemies.some((d) => !d.dead && hexDistance(d.cell, c.cell) <= n && o.xmap.los(d.cell, c.cell)),
    ),
    i = o.stealth && (a.roll ? a.roll.success : !s),
    r = await import('./detection.js');
  if (r.wantsTalk(o, a)) return r.talkGroup(o, a.def.id, t, { stealth: i });
  let l = {};
  if (i) for (let c of a.roll?.results || []) c.success && (l[c.who] = c.total);
  await Uo(o, a.def.id, { surprise: i, hidden: l });
}
async function Uo(o, e, { surprise: t = !1, surprisedParty: a = [], hidden: n = {}, ambush: s = !1 } = {}) {
  if (o.inBattle || !o.groups.has(e) || o.disposed) return { won: !1, fled: !1, error: 'no hay combate' };
  let i = o.groups.get(e),
    r = o.game,
    l = o.rules;
  (o.stopAll(),
    (o.inBattle = !0),
    o.busyN++,
    o.overlay.setLabel(null),
    o.overlay.clearBubbles(),
    o.marks.setHover(null),
    o.marks.hideRings(!0),
    o.marks.clearDestination(),
    o.hud?.hide?.(),
    (r.stage.renderer.domElement.style.cursor = ''));
  let c = [e, ...(i.def.link || []).filter((E) => o.groups.has(E) && E !== e)],
    d = c.map((E) => o.groups.get(E));
  await Promise.all(d.map((E) => E.ready));
  for (let E of d) (E.hidden && (await import('./detection.js')).revealGroup(o, E.def.id), (E.alerted = !0));
  r.bus.emit('battle:start', {
    group: e,
    groups: c,
    surprise: t,
    level: o.levelId,
    ambush: s,
    surprisedParty: a,
  });
  let u = o.level.ambient === 'crypt' ? 0.28 : 0.35;
  (Dc(0.6, (E) => o.world.setGrid?.(E * u)), o.world.setCombatView?.(!0));
  for (let E of o.members) E.actor.setShadowed(!1);
  for (let E of o.npcs.values()) {
    let S = E.actor.root,
      z = S.scale.x;
    ((E.scale0 = z),
      Dc(0.45, (D) => S.scale.setScalar(z * Math.max(0.001, 1 - D))).then(() => (S.visible = !1)));
  }
  let h = [
    ...o.members.map((E) => E.actor),
    ...d.flatMap((E) => E.enemies.filter((S) => !S.dead).map((S) => S.actor)),
  ];
  (o.animals?.flee(h.map((E) => E.root.position)),
    await Promise.all(
      o.members.map((E) => {
        let S = E.actor.root.position.clone(),
          z = o.world.cellToWorld(E.cell);
        return (E.actor.anim('idle'), Dc(0.25, (D) => E.actor.root.position.lerpVectors(S, z, D)));
      }),
    ),
    t && !o.mods.combat && o.hud?.banner?.('\xA1Los cog\xE9is por sorpresa!', 'bien', 1600));
  let p = r.store.cp,
    m = o.members.map((E) => ({
      id: E.id,
      cell: E.cell.slice(),
      face: Math.round(Ok(E.actor.root.rotation.y)),
    })),
    _ = d.flatMap((E) =>
      E.enemies
        .filter((S) => !S.dead)
        .map((S) => ({
          id: S.id,
          monster: S.monster,
          cell: S.cell.slice(),
          face: Math.round(Ok(S.actor.root.rotation.y)),
          group: E.def.id,
        })),
    ),
    b = {
      id: e,
      name: i.def.name || '\xA1Combate!',
      place: o.level.name,
      tips: i.def.tips || [],
      ambient: o.level.ambient || 'dusk',
      level: p.party_level || 1,
      sunlight: o.level.ambient === 'day',
    },
    f = t ? _.map((E) => E.id) : a.slice(),
    v = Number(r.params?.get?.('semilla')) || Math.floor(Math.random() * 1e9),
    x = null;
  try {
    x = structuredClone(p);
  } catch {
    x = JSON.parse(JSON.stringify(p));
  }
  let g = r.ui?.keys?.disabled,
    y = l.call('battle_start', {
      cp: p,
      rows: o.xmap.rows,
      party: m,
      enemies: _,
      group: e,
      encounter: b,
      surprised: f,
      surprise: t || void 0,
      hidden: n,
      seed: v,
    });
  y?.cp && l.apply(y);
  let w = new Map();
  for (let E of o.members) w.set(E.id, E.actor);
  for (let E of d) for (let S of E.enemies) S.dead || w.set(S.id, S.actor);
  let k = { won: !1, fled: !1 },
    T = y && !y.error && y.state;
  try {
    if (T && o.mods.combat) {
      o.camera.suspended = !0;
      let E = r.params?.has?.('autocombate')
        ? new Set(o.members.map((S) => S.id))
        : r.store.settings.autoCompanions !== !1
          ? new Set(o.members.filter((S) => S.id !== 'hero').map((S) => S.id))
          : void 0;
      k =
        (await o.mods.combat.runBattle(r, {
          three: o.three,
          world: o.world,
          actors: w,
          init: y,
          hud: o.hud,
          group: e,
          groups: c,
          surprise: t,
          surprised: f,
          level: o.levelId,
          auto: E,
          portrait: (S) =>
            o.portraits.get(S.id) ||
            r.ui.portrait?.(S.id) ||
            o.factory.portrait(w.get(S.id), {
              ...o.rules.sheet(S.id),
              id: S.id,
              name: S.name || o.rules.name(S.id),
            }),
          makeMonster: (S) => o.factory.monster(S.template || S.monster, S.id),
          makeForm: (S, z) => o.factory.monster(S, z),
        })) || k;
    } else T ? (k = await fN(o, y, w)) : (k = await mN(o, d, w));
  } catch (E) {
    return (
      console.error('[exploraci\xF3n] el combate ha fallado', E),
      uN(o, e, c, {
        cpBefore: x,
        keysWas: g,
        error: String(E?.message || E),
        args: { surprise: t, surprisedParty: a, hidden: n, ambush: s },
      })
    );
  }
  return jk(o, e, c, k, T);
}
async function uN(o, e, t, { cpBefore: a, keysWas: n, error: s, args: i }) {
  let r = o.game;
  (r.battle && (r.battle = null),
    r.ui?.keys && n !== void 0 && (r.ui.keys.disabled = n),
    a && r.store.set(a));
  for (let c of [
    ...o.members.map((d) => d.actor),
    ...t.flatMap(
      (d) =>
        o.groups
          .get(d)
          ?.enemies.filter((u) => !u.dead)
          .map((u) => u.actor) || [],
    ),
  ])
    c && (c.ch && (c.ch._mdgDown = !1), (c.root.visible = !0), (c.cur = null), c.anim('idle', { fade: 0.2 }));
  if (
    (r.bus.emit('ui:error', { what: 'battle', error: s }),
    await jk(o, e, t, { won: !1, fled: !0 }, !1, { quiet: !0 }),
    o.disposed)
  )
    return { won: !1, fled: !0, error: s };
  let l = await o.choose({
    speaker: 'Algo ha fallado',
    text: `*El combate se ha interrumpido por un error del juego. Todo ha vuelto a como estaba justo antes de empezar.*

(${s})`,
    options: [
      { text: 'Volver a empezar el combate', value: 'retry' },
      { text: 'Cargar la \xFAltima partida autom\xE1tica', value: 'load' },
      { text: 'Retirarse por ahora', kind: 'end', value: null },
    ],
  });
  if (l === 'retry' && o.groups.has(e)) return Uo(o, e, i);
  if (l === 'load') {
    let c = await r.store.load('auto');
    c?.location?.level &&
      ((r.store.cp = r.rules?.('cp_load', { cp: c })?.cp || c),
      r.go('explore', { level: c.location.level, spawn: 'saved' }));
  }
  return { won: !1, fled: !0, error: s };
}
async function jk(o, e, t, a, n, { quiet: s = !1 } = {}) {
  let i = o.game,
    r = o.rules,
    l = !!a.won,
    c = !!a.fled,
    d = null,
    u = t.flatMap((b) => o.groups.get(b)?.def.loot || []);
  (n && ((d = r.call('battle_end', { cp: i.store.cp, won: l, loot: l ? u : [] })), d?.cp && r.apply(d)),
    (o.camera.suspended = !1),
    o.camera.configure());
  for (let b of d?.enemies_dead || []) {
    let f = o.enemy(b);
    f && (f.dead = !0);
  }
  i.bus.emit('battle:end', { group: e, groups: t, won: l, fled: c, level: o.levelId });
  for (let b of o.members) b.cell = o.world.worldToCell(b.actor.root.position);
  if (
    (Dc(0.8, (b) => o.world.setGrid?.((1 - b) * 0.35)).then(() => o.world.setGrid?.(0)),
    o.world.setCombatView?.(!1),
    !l && !c)
  )
    return Bk(o, null);
  let h = i.store.cp;
  if (l && r.state('hero').dead)
    return Bk(
      o,
      'Tus compa\xF1eros han ganado el combate, pero t\xFA no has sobrevivido. Sin la Marca, nadie sabr\xE1 qu\xE9 duerme bajo el toro\u2026',
    );
  for (let b of o.npcs.values()) {
    let f = b.actor.root;
    f.visible = !0;
    let v = b.scale0 ?? 1;
    Dc(0.45, (x) => f.scale.setScalar(v * Math.max(0.001, x)));
  }
  let p = t.map((b) => o.groups.get(b)?.def).filter(Boolean),
    m = [];
  if (l) {
    let b = null;
    for (let f of t) {
      let v = o.groups.get(f);
      if (v) {
        o.ls.dead.includes(f) || o.ls.dead.push(f);
        for (let x of v.enemies) {
          ((x.cell = o.world.worldToCell(x.actor.root.position)), (b = x.cell));
          let g = !!d?.captured?.[x.id] || (d?.enemies_alive || []).includes(x.id);
          (!d && !g && m.push(...r.drops(x.monster)),
            x.dead || ((x.dead = !0), !x.actor.ch?._mdgDown && !g && x.actor.once('die', { hold: !0 })));
        }
        if (!d)
          for (let x of v.def.loot || []) m.push({ id: x[0], n: x[1] ?? 1, unid: r.unidentified(x[0]) });
        ((o.corpses ??= []), o.corpses.push(...v.enemies), o.groups.delete(f));
      }
    }
    if (
      (d?.loot && (m = d.loot.map((f) => ({ id: f.id, n: f.n ?? 1, unid: !!f.unid }))),
      (m = hN(m)),
      m.length && b)
    ) {
      let f = `drop_${e}`,
        v = b;
      o.xmap.walkable(v) || (v = o.xmap.freeNear(v, 1)[0] || v);
      let x = { id: f, type: 'loot', cell: v, name: 'Restos del combate' };
      ((o.ls.drops[f] = x), (o.ls.loot[f] = m), o.addObject(x));
    }
  } else
    for (let b of t) {
      let f = o.groups.get(b);
      if (f) {
        ((f.alerted = !1), (f.cooldown = 12));
        for (let v of f.enemies)
          ((v.cell = o.world.worldToCell(v.actor.root.position)),
            !v.dead && v.actor.cur == null && v.actor.anim('idle'));
      }
    }
  await o.rebuildParty();
  for (let b of o.members)
    ((b.actor.cur = null),
      b.actor.anim(o.stealth ? 'crouch' : 'idle', { fade: 0.4 }),
      b.actor.setShadowed(o.stealth));
  ((o.inBattle = !1),
    (o.busyN = Math.max(0, o.busyN - 1)),
    o.marks.hideRings(!1),
    o.updateRings(),
    o.hud?.show?.());
  let _ = !1;
  try {
    _ = !!(await i.story?.afterBattle?.({
      group: e,
      groups: t,
      won: l,
      fled: c,
      level: o.levelId,
      explore: i.explore,
    }));
  } catch (b) {
    console.error('[exploraci\xF3n] story.afterBattle', b);
  }
  if (l) {
    let b = p[0] || {};
    for (let f of p) f.flag && !i.store.flag(f.flag) && i.store.setFlag(f.flag, !0);
    for (let f of p) f.journal && o.addJournal(f.journal);
    (m.length && o.toast('Han dejado algo: mirad los restos del combate.', 'botin', 5e3),
      d?.xp && o.toast(`+${d.xp} PX`, 'oro'),
      b.after && !_ && (await o.narrate(b.after)),
      await o.refreshWorld(),
      b.level_after && b.level_after > (i.store.cp.party_level || 1) && (await pN(o, b.level_after)),
      b.story_after && (await o.narrate(b.story_after, { title: b.story_title || o.level.name })));
  } else s || o.toast('Os retir\xE1is. Los enemigos no os siguen\u2026 de momento.', 'apagado', 5e3);
  return (o.updateHud(), s || i.store.save('auto'), { won: l, fled: c });
}
function hN(o) {
  let e = [];
  for (let t of o) {
    let a = !t.unid && e.find((n) => n.id === t.id && !n.unid);
    a && (t.id === 'gold' || /arrows|bolts|coin|charm|pelt|gem|potion|ration|torch/.test(t.id))
      ? (a.n += t.n)
      : e.push({ ...t });
  }
  return e;
}
async function pN(o, e) {
  let t = o.game,
    a = o.rules;
  if (
    (o.hud?.banner?.(`\xA1Nivel ${e}!`, '', 1800),
    await Yu(1500),
    o.hasScreen('nivel') && !t.params?.has?.('autonivel'))
  )
    await o.openScreen('nivel', { level: e });
  else {
    let n = a.call('cp_level_up', { cp: t.store.cp, level: e });
    if (n?.cp) a.apply(n);
    else {
      a.fallback('cp_level_up');
      let s = t.store.cp,
        i = {};
      for (let r of s.party) i[r] = a.hp(r).max;
      s.party_level = e;
      for (let r of s.party) {
        let l = a.state(r);
        delete l.max_hp;
        let c = a.maxHpGuess(r);
        ((l.max_hp = c), (l.hp = Math.min(c, (l.hp ?? c) + (c - i[r]))), (l.hit_dice = e));
      }
      t.store.set(s);
    }
    (o.toast(`El grupo sube a nivel ${e}.`, 'oro', 5e3), t.bus.emit('levelup', { level: e }));
  }
  await o.rebuildParty();
}
async function Bk(o, e) {
  let t = o.game;
  if (
    ((o.inBattle = !1),
    (o.busyN = Math.max(0, o.busyN - 1)),
    t.bus.emit('game:over', { level: o.levelId, text: e }),
    o.hasScreen('derrota'))
  )
    return (await t.ui.open('derrota', { text: e, level: o.levelId }), { won: !1, fled: !1 });
  let n =
    (await o.choose({
      speaker: 'Derrota',
      text: `*${e || 'El \xFAltimo de vosotros cae. La oscuridad se cierra sobre el prado y, muy por debajo, algo sonr\xEDe.'}*`,
      options: [
        { text: 'Cargar la \xFAltima partida autom\xE1tica', value: 'load' },
        { text: 'Volver al men\xFA principal', kind: 'end', value: 'menu' },
      ],
    })) === 'load'
      ? await t.store.load('auto')
      : null;
  return (
    n?.location?.level
      ? ((t.store.cp = t.rules?.('cp_load', { cp: n })?.cp || n),
        t.go('explore', { level: n.location.level, spawn: 'saved' }))
      : t.go('menu'),
    { won: !1, fled: !1 }
  );
}
async function Gk(o, e, { flee: t = !1 } = {}) {
  let a = o.groups.get(e);
  if (!a) return;
  (await a.ready, o.ls.gone.includes(e) || o.ls.gone.push(e), o.groups.delete(e));
  let n = o.lead(),
    s = a.enemies
      .filter((i) => !i.dead && i.actor)
      .map(async (i) => {
        let r = o.xmap
          .freeNear(i.cell, 30, o.blocked(!0), { maxR: 9 })
          .sort((d, u) => hexDistance(u, n?.cell || i.cell) - hexDistance(d, n?.cell || i.cell))[0];
        if (r) {
          let d = o.xmap.path(i.cell, r, o.blocked(!0)).slice(1, 9);
          await qk(o, i.actor, d, { speed: t ? 4.2 : 2.2, anim: t ? 'run' : 'walk' });
        }
        let l = i.actor.root,
          c = l.scale.x;
        (await Dc(0.5, (d) => l.scale.setScalar(c * Math.max(0.001, 1 - d))), i.actor.dispose());
      });
  await Promise.all(s);
}
async function fN(o, e, t) {
  let a = o.rules;
  o.toast(
    'Combate autom\xE1tico (sustituto: el combate t\xE1ctico de Combate todav\xEDa no est\xE1 enganchado).',
    'apagado',
    6e3,
  );
  let n = [],
    s = e.state;
  await ay(o, e.events || [], t, n);
  let i = 0;
  for (; s && !s.over && i++ < 600 && !o.disposed;) {
    let r = (s.creatures || []).find((c) => c.id === s.current);
    if (r && r.hp > 0 && !r.dead) {
      let c = t.get(r.id);
      c && o.camera.focus(c.root.position);
      let d = a.call('ai_turn');
      await ay(o, d?.events || [], t, n);
    }
    if (((s = a.call('state')), !s || s.over)) break;
    let l = a.call('end_turn');
    (await ay(o, l?.events || [], t, n), (s = a.call('state')));
  }
  return (await Yu(500 / (o.turbo || 1)), { won: s?.winner === 0, fled: !1, events: n });
}
async function ay(o, e, t, a) {
  let n = (s) => Yu(s / (o.turbo || 1));
  for (let s of e) {
    (a.push(s), o.game.bus.emit('battle:event', { ev: s }));
    let i = s.who ? t.get(s.who) : null;
    try {
      switch (s.t) {
        case 'turn':
          o.game.bus.emit('battle:turn', { creature: s.who, isPc: !!o.member(s.who) });
          break;
        case 'move': {
          if (!i) break;
          let r = (s.path || []).slice(1);
          await qk(o, i, r, { speed: s.dash ? 5 : 3.6 });
          let l = o.member(s.who);
          l && r.length && (l.cell = r[r.length - 1].slice());
          let c = o.enemy(s.who);
          c && r.length && (c.cell = r[r.length - 1].slice());
          break;
        }
        case 'attack': {
          let r = t.get(s.target);
          if (!i || !r) break;
          ny(i, r);
          let l = i.once(s.kind === 'melee' ? 'attack_melee' : 'attack_ranged', { speed: 1.3 });
          (await n(380),
            s.hit
              ? r.once('hit', { speed: 1.2 })
              : o.overlay.float((c) => r.head(c), s.natural === 1 ? 'Pifia' : 'Falla', 'apagado', { dur: 1 }),
            await l);
          break;
        }
        case 'damage':
          (i &&
            s.amount > 0 &&
            o.overlay.float((r) => i.head(r), `${s.amount}`, o.member(s.who) ? 'mal' : '', {
              dur: 1.1,
              size: s.crit ? 1.4 : 1.1,
            }),
            await n(150));
          break;
        case 'heal':
          i && s.amount > 0 && o.overlay.float((r) => i.head(r), `+${s.amount}`, 'bien', { dur: 1.1 });
          break;
        case 'cast':
          i &&
            (o.overlay.float((r) => i.head(r), s.name || 'Conjuro', 'magia', { dur: 1.1 }),
            await i.once('cast', { speed: 1.3 }));
          break;
        case 'downed':
        case 'death':
          if (i) {
            ((i.ch._mdgDown = !0), i.once('die', { hold: !0 }));
            let r = o.enemy(s.who);
            r && s.t === 'death' && (r.dead = !0);
            let l = o.member(s.who);
            l && (l.down = !0);
          }
          await n(400);
          break;
        case 'revive':
        case 'stand':
          i && ((i.ch._mdgDown = !1), (i.cur = null), i.anim('idle'));
          break;
        default:
          break;
      }
    } catch (r) {
      console.warn('[exploraci\xF3n] evento', s.t, r);
    }
  }
}
async function mN(o, e, t) {
  let a = o.rules;
  (o.rules.fallback('battle_start'),
    o.toast('Combate simulado (sustituto: el n\xFAcleo todav\xEDa no tiene battle_start).', 'apagado', 6e3));
  let n = e.flatMap((c) => c.enemies.filter((d) => !d.dead)),
    s = new Map(n.map((c) => [c.id, a.monster(c.monster).hp || 8])),
    i = a.level(),
    r = o.members.reduce((c, d) => c + a.hp(d.id).hp, 0),
    l = 0;
  for (; n.some((c) => !c.dead) && r > 0 && l++ < 30 && !o.disposed;) {
    for (let c of o.members) {
      let d = n.find((p) => !p.dead);
      if (!d) break;
      (ny(c.actor, d.actor), o.camera.focus(d.actor.root.position));
      let u = c.actor.once('attack_melee', { speed: 1.4 });
      await Yu(300 / (o.turbo || 1));
      let h = a.d20() + 3 >= 13 ? rollDice('1d8', a.rng) + 2 + i : 0;
      (h
        ? (d.actor.once('hit'),
          o.overlay.float((p) => d.actor.head(p), `${h}`, '', { dur: 1 }),
          s.set(d.id, s.get(d.id) - h),
          s.get(d.id) <= 0 && ((d.dead = !0), (d.actor.ch._mdgDown = !0), d.actor.once('die', { hold: !0 })))
        : o.overlay.float((p) => d.actor.head(p), 'Falla', 'apagado', { dur: 1 }),
        await u);
    }
    for (let c of n.filter((d) => !d.dead)) {
      let d = o.members[Math.floor(a.rng() * o.members.length)];
      ny(c.actor, d.actor);
      let u = c.actor.once('attack_melee', { speed: 1.4 });
      if ((await Yu(250 / (o.turbo || 1)), a.d20() + 4 >= 14)) {
        let h = rollDice('1d6', a.rng) + 1;
        r -= h;
        let p = a.state(d.id);
        ((p.hp = Math.max(1, a.hp(d.id).hp - h)),
          d.actor.once('hit'),
          o.overlay.float((m) => d.actor.head(m), `${h}`, 'mal', { dur: 1 }));
      }
      await u;
    }
  }
  return (o.game.store.set(o.game.store.cp), { won: r > 0, fled: !1 });
}
const Yu = (o) => new Promise((e) => setTimeout(e, o));
const Ok = MathUtils.radToDeg;

export { Gk, Uk, Uo };
