// explore/detection.js
// Reconstruido de publicado/juego.js (módulo __esm «h0»). Nombres locales aún minificados.

import { Vector3 } from 'three';
import { hexDistance } from './hex.js';
import { Wu, Xu } from './interact.js';
import { Uo } from './battle.js';
import { wu } from './checks.js';

function Lc(o, e) {
  return (o.pp || (o.pp = o.rules.passive('perception')), o.pp[e] ?? 10);
}
function perceive(o, e) {
  let t = Lc(o, e.id);
  for (let [a, n] of o.objects) {
    if (!n.hidden || o.ls.found.includes(a) || !o.flag(n.requires) || !o.flag(n.hidden_until) || !n.cell)
      continue;
    let s = hexDistance(e.cell, n.cell);
    s > rN ||
      (s > 1 && !o.xmap.los(e.cell, n.cell)) ||
      (t >= (n.hidden.dc ?? 15) && Xu(o, a, e.id, `Percepci\xF3n pasiva ${t}`));
  }
}
async function search(o) {
  if (o.isBusy()) return;
  o.stopAll();
  let e = o.rules;
  await o.withBusy(async () => {
    let t = [],
      a = !1,
      n = [];
    for (let s of o.members) {
      let i =
          e.skillMod(s.id, 'perception') >= e.skillMod(s.id, 'investigation')
            ? 'perception'
            : 'investigation',
        r = e.check({ who: s.id, skill: i });
      (t.push(`${e.shortName(s.id)} ${r.total}`),
        n.push(s.actor.once('kneel', { speed: 1.4 })),
        o.overlay.float(
          (l) => s.actor.head(l).add(new Vector3(0, 0.25, 0)),
          `${wu[i]} ${r.total}`,
          'apagado',
          { dur: 1.8 },
        ));
      for (let [l, c] of o.objects) {
        if (!c.hidden || o.ls.found.includes(l) || !o.flag(c.requires) || !o.flag(c.hidden_until) || !c.cell)
          continue;
        let d = hexDistance(s.cell, c.cell);
        d > Pk ||
          (d > 1 && !o.xmap.los(s.cell, c.cell)) ||
          (r.total >= (c.hidden.dc ?? 15) && (Xu(o, l, s.id, `${wu[i]} ${r.total}`), (a = !0)));
      }
      for (let [l, c] of o.groups) {
        if (!c.hidden) continue;
        let d = c.enemies.some(
            (h) => !h.dead && hexDistance(h.cell, s.cell) <= Pk * 2 && o.xmap.los(h.cell, s.cell),
          ),
          u = 10 + Math.max(...c.enemies.map((h) => o.rules.monster(h.monster).stealth || 0));
        d &&
          r.total >= u &&
          (revealGroup(o, l),
          o.toast(
            `${e.shortName(s.id)} ve a alguien agazapado: \xA1${c.def.name ? zk(c.def.name) : 'enemigos'} al acecho!`,
            'mal',
            5e3,
          ),
          (a = !0));
      }
    }
    (await Promise.all(n),
      await Y1(200),
      a ||
        o.toast(
          `Busc\xE1is con calma\u2026 (${t.join(', ')}). No encontr\xE1is nada m\xE1s por aqu\xED.`,
          'apagado',
          5e3,
        ));
  });
}
function toggleStealth(o, e = !o.stealth) {
  if (!o.inBattle) {
    o.stealth = e;
    for (let t of o.groups.values()) t.roll = null;
    for (let t of o.members)
      (t.actor.setShadowed(e), t.moving || t.actor.anim(e ? 'crouch' : 'idle', { fade: 0.3 }));
    (o.hud?.status?.(e ? 'Sigilo: avanz\xE1is agachados' : ''),
      o.toast(
        e ? 'Sigilo: os mov\xE9is despacio e intent\xE1is que no os vean.' : 'Sigilo desactivado.',
        e ? 'magia' : 'apagado',
      ),
      o.game.bus.emit(e ? 'stealth:on' : 'stealth:off', {}),
      o.updateHud());
  }
}
function detect(o) {
  for (let [e, t] of o.groups) {
    if (t.cooldown > 0 || t.alerted) continue;
    let a = t.def.sight ?? 8;
    for (let n of t.enemies)
      if (!n.dead)
        for (let s of o.members) {
          let i = hexDistance(n.cell, s.cell);
          if (!(i > a) && o.xmap.los(n.cell, s.cell)) {
            if (o.stealth && (t.roll || stealthRoll(o, t), t.roll.success)) {
              if ((t.hidden && lN(o, e, s), i <= 1)) {
                ((t.alerted = !0), o.stopAll(), Uo(o, e, { surprise: !0, hidden: cN(t) }));
                return;
              }
              continue;
            }
            if (t.hidden) {
              springAmbush(o, e, s);
              return;
            }
            spotted(o, e, n, s);
            return;
          }
        }
  }
}
function lN(o, e, t) {
  let a = o.groups.get(e);
  if (!a?.hidden) return;
  let n =
      10 +
      Math.max(0, ...a.enemies.filter((i) => !i.dead).map((i) => o.rules.monster(i.monster).stealth || 0)),
    s = Lc(o, t.id);
  s < n ||
    (revealGroup(o, e),
    o.toast(
      `${o.rules.shortName(t.id)} ve a alguien agazapado antes de que os vean (Percepci\xF3n ${s}): \xA1${zk(a.def.name || 'enemigos')} al acecho!`,
      'magia',
      5500,
    ),
    o.game.bus.emit('hidden:found', {
      object: { id: e, type: 'group', cell: a.enemies[0]?.cell },
      by: t.id,
      group: e,
    }));
}
function cN(o) {
  let e = {};
  for (let t of o.roll?.results || []) t.success && (e[t.who] = t.total);
  return e;
}
function stealthRoll(o, e) {
  let t = o.groupPP(e);
  e.roll = o.rules.groupCheck('stealth', t);
  for (let a of e.roll.results || []) {
    let n = o.member(a.who);
    n &&
      o.overlay.float(
        (s) => n.actor.head(s).add(new Vector3(0, 0.25, 0)),
        `Sigilo ${a.total}`,
        a.success ? 'bien' : 'mal',
        { dur: 1.6 },
      );
  }
  return (
    o.toast(
      e.roll.success
        ? `No os han visto (Sigilo del grupo contra Percepci\xF3n ${t}).`
        : `Os han o\xEDdo (Sigilo del grupo contra Percepci\xF3n ${t})\u2026`,
      e.roll.success ? 'magia' : 'mal',
    ),
    e.roll
  );
}
async function spotted(o, e, t, a) {
  let n = o.groups.get(e);
  if (
    !(!n || n.alerted) &&
    ((n.alerted = !0), o.stopAll(), await n.ready, !(o.disposed || !o.groups.has(e)))
  ) {
    if (
      (o.faceTo(t.id, a.id),
      o.overlay.alert((s) => t.actor.head(s).add(new Vector3(0, 0.45, 0))),
      o.game.bus.emit('spotted', { group: e, by: t.id, who: a.id }),
      wantsTalk(o, n))
    ) {
      await talkGroup(o, e, t);
      return;
    }
    (await o.withBusy(() => Y1(650)),
      o.groups.has(e) && !o.inBattle ? await Uo(o, e, {}) : o.groups.has(e) && (n.alerted = !1));
  }
}
function wantsTalk(o, e) {
  return e?.def.talk
    ? typeof o.game.story?.interact == 'function'
      ? !0
      : !o.ls.talked.includes(e.def.id)
    : !1;
}
async function talkGroup(o, e, t = null, { stealth: a = !1 } = {}) {
  let n = o.groups.get(e);
  if (!n || (await n.ready, o.disposed || !o.groups.has(e))) return;
  let s =
    t || n.enemies.find((l) => !l.dead && /boss|chief/.test(l.monster)) || n.enemies.find((l) => !l.dead);
  o.stopAll();
  let i = o.lead();
  s && i && (o.faceTo(s.id, i.id), o.faceTo(i.id, s.cell));
  let r = await Wu(o, { object: n.def, kind: 'group', actor: o.leader, enemy: s?.id, group: e, stealth: a });
  if (!(!o.groups.has(e) || o.inBattle)) {
    if (r) {
      ((n.alerted = !1), (n.cooldown = 4));
      return;
    }
    (o.ls.talked.includes(e) || o.ls.talked.push(e),
      s && (await o.say(s.id, n.def.taunt || '\xAB\xA1Ni un paso m\xE1s, carne blanda!\xBB', { dur: 2.2 })),
      await Uo(o, e, {}));
  }
}
async function springAmbush(o, e, t) {
  let a = o.groups.get(e);
  if (!a || a.alerted || ((a.alerted = !0), o.stopAll(), await a.ready, o.disposed || !o.groups.has(e)))
    return;
  let n = o.rules,
    s = Math.max(0, ...a.enemies.filter((d) => !d.dead).map((d) => n.monster(d.monster).stealth || 0)),
    i = n.d20() + s,
    r = o.members.filter((d) => Lc(o, d.id) < i).map((d) => d.id),
    l = o.members.filter((d) => !r.includes(d.id)).sort((d, u) => Lc(o, u.id) - Lc(o, d.id))[0];
  revealGroup(o, e);
  for (let d of a.enemies) d.dead || o.faceTo(d.id, t.id);
  let c = (d, u) => !o.mods.combat && o.hud?.banner?.(d, 'mal', u);
  (r.length
    ? r.length === o.members.length
      ? (c('\xA1Emboscada!', 1500), o.toast(`Os han cogido desprevenidos (Sigilo ${i}).`, 'mal', 5e3))
      : (c('\xA1Emboscada!', 1500),
        o.toast(
          `${r.map((d) => n.shortName(d)).join(', ')} no lo ve${r.length > 1 ? 'n' : ''} venir (Sigilo ${i}).`,
          'mal',
          5e3,
        ))
    : (o.hud?.banner?.('\xA1Enemigos!', 'mal', 1300),
      o.toast(
        `${n.shortName(l.id)} ve movimiento a tiempo (Percepci\xF3n ${Lc(o, l.id)} contra Sigilo ${i}): \xA1nadie os coge desprevenidos!`,
        'bien',
        5500,
      )),
    o.game.bus.emit('spotted', { group: e, ambush: !0, surprised: r }),
    await o.withBusy(() => Y1(900)),
    o.groups.has(e) && !o.inBattle && (await Uo(o, e, { surprisedParty: r, ambush: !0 })));
}
function revealGroup(o, e) {
  let t = o.groups.get(e);
  if (!(!t || !t.hidden)) {
    t.hidden = !1;
    for (let a of t.enemies) {
      if (a.dead || !a.actor) continue;
      ((a.actor.root.visible = !0), a.actor.root.scale.multiplyScalar(0.001), (a.grow = 0));
      let n = a.actor.root.scale.clone().divideScalar(0.001),
        s = performance.now(),
        i = () => {
          let r = Math.min(1, (performance.now() - s) / 350);
          (a.actor.root.scale.copy(n).multiplyScalar(0.001 + 0.999 * (1 - Math.pow(1 - r, 3))),
            r < 1 && requestAnimationFrame(i));
        };
      i();
    }
  }
}
function checkTriggers(o, e, t = null) {
  let a = !1;
  for (let n of o.level.triggers || []) {
    if (((n.once ?? !0) && o.ls.fired.includes(n.id)) || !o.flag(n.requires)) continue;
    let s = !1;
    (e && n.on_load && (!n.spawn || n.spawn === o.spawn)
      ? (s = !0)
      : !e && t && (s = (n.cells || []).some((i) => i[0] === t[0] && i[1] === t[1])),
      s && (o.ls.fired.includes(n.id) || o.ls.fired.push(n.id), n.text && ((a = !0), o.stopAll()), dN(o, n)));
  }
  return a;
}
async function dN(o, e) {
  let t = o.game;
  (t.bus.emit('trigger', { id: e.id, level: o.levelId }), e.flag && t.store.setFlag(e.flag, !0));
  let a = !1;
  try {
    a = !!(await o.withBusy(() =>
      t.story?.trigger?.(e.id, { level: o.levelId, trigger: e, explore: t.explore }),
    ));
  } catch (n) {
    console.error('[exploraci\xF3n] story.trigger', n);
  }
  a ||
    o.disposed ||
    (e.journal && o.addJournal(e.journal), e.text && (await o.narrate(e.text)), e.hint && o.hint(e.hint));
}
const rN = 5;
const Pk = 6;
const Y1 = (o) => new Promise((e) => setTimeout(e, o));
const zk = (o) => o && o[0].toLowerCase() + o.slice(1);

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
