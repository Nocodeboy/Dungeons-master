// vfx/spells.js
// Reconstruido de publicado/juego.js (módulo __esm «s1»). Nombres locales aún minificados.

import { QuadraticBezierCurve3, Vector3 } from 'three';
import { FRAME } from './atlas.js';
import { Jn, DAMAGE_STYLE } from './styles.js';

function hs(o) {
  let e, t, a;
  do ((e = Math.random() * 2 - 1), (t = Math.random() * 2 - 1), (a = Math.random() * 2 - 1));
  while (e * e + t * t + a * a > 1);
  return Dn(e * o, t * o, a * o);
}
function Sa(o) {
  let e = o.caster;
  return e ? (e.hand || e.chest || e.pos).clone() : Dn(0, 1.2, 0);
}
function nn(o, e) {
  if (e.center) return e.center.clone();
  if (e.cells && e.cells.length) {
    let t = Dn();
    for (let a of e.cells) t.add(o.cellToWorld(a));
    return t.divideScalar(e.cells.length);
  }
  return e.targets && e.targets[0] ? e.targets[0].pos.clone() : e.caster ? e.caster.pos.clone() : Dn();
}
function Mt(o) {
  return (o.chest || o.pos.clone().setY(o.pos.y + 1)).clone();
}
function lr(o, e, t = 14) {
  let a = e.map((s) => o.cellToWorld(s));
  if (a.length <= t) return a;
  let n = [];
  for (let s = 0; s < t; s++) n.push(a[Math.floor(Math.random() * a.length)]);
  return n;
}
async function ir(o, e, t, a = {}) {
  let n = t.targets?.[0];
  if (!n) return;
  let s = Sa(t),
    i = Mt(n),
    r = await o.projectile(e, s, i, {
      speed: a.speed ?? 15,
      size: a.size ?? 1,
      miss: t.hit === !1,
      curve: a.curve ?? 0,
      arc: a.arc,
    });
  if (t.hit === !1) {
    o.element(e, r, { k: 0.4 });
    return;
  }
  o.element(e, i, { k: (a.k ?? 1) * (t.crit ? 1.4 : 1) });
}
async function Dm(o, e, t, a = {}) {
  let n = t.targets?.[0];
  if (!n) return;
  let s = Jn(e),
    i = Sa(t),
    r = Mt(n);
  if (t.hit === !1) {
    let c = r.clone().sub(i).normalize();
    r = r
      .clone()
      .addScaledVector(c, 3)
      .add(Dn(Rt(-0.6, 0.6), Rt(-0.3, 0.3), Rt(-0.6, 0.6)));
  }
  (o.fx('launch', { style: e, at: i }),
    o.beam(i, r, {
      col: a.col ?? s.c,
      width: a.width ?? 0.2,
      life: a.life ?? 0.42,
      mode: a.mode ?? 'beam',
      glow: a.glow ?? 2,
      jitter: a.jitter ?? 0.3,
      hot: 0.6,
    }),
    a.core !== !1 &&
      o.beam(i, r, {
        col: s.c2,
        width: (a.width ?? 0.2) * 0.3,
        life: (a.life ?? 0.42) * 0.8,
        glow: 1.5,
        hot: 0.4,
      }),
    o.glow(i, s.c, 0.6, 0.2, 2.5),
    o.light(r, s.c, 7, 6, 0.4));
  let l = Math.round(18 * o.quality);
  for (let c = 0; c < l; c++) {
    let d = i.clone().lerp(r, Math.random());
    o.p({
      p: d.add(hs(0.12)),
      v: hs(0.5).setY(Rt(-0.2, 0.4)),
      life: Rt(0.4, 0.8),
      size: Rt(0.06, 0.12),
      size1: 0.02,
      col: s.c2,
      col1: s.c,
      frame: s.p,
      glow: 1.6,
      spin: 3,
      a: 0.9,
    });
  }
  if ((await o.wait(0.08), t.hit === !1)) {
    o.burst(r, { n: 6, col: s.c2, speed: 2, life: 0.3, size: 0.06 });
    return;
  }
  o.element(e, r, { k: t.crit ? 1.4 : 0.9 });
}
async function n1(o, e, t) {
  let a = t.targets?.[0];
  if (!a) return;
  let n = Mt(a),
    s = Sa(t),
    i = Jn(e);
  if (
    (o.beam(s, n, { col: i.c, width: 0.08, life: 0.2, mode: e === 'lightning' ? 'bolt' : 'beam', glow: 3 }),
    await o.wait(0.05),
    t.hit === !1)
  ) {
    o.burst(n, { n: 6, col: i.c2, speed: 2, life: 0.3, size: 0.06 });
    return;
  }
  o.element(e, n, { k: t.crit ? 1.4 : 1 });
}
async function VI(o, e, t, a = {}) {
  let n = Jn(e);
  for (let s of t.targets || []) {
    let i = Mt(s);
    (o.ring(s.pos, { color: n.c, radius: a.radius ?? 0.8, life: 0.5, thick: 0.2, fill: 0.4 }),
      o.element(e, i, { k: a.k ?? 0.9 }));
  }
  await o.wait(0.12);
}
async function wc(o, e, t, a = {}) {
  let n = Jn(e),
    s = nn(o, t),
    i = t.cells || [];
  (o.hexwave(i, {
    origin: a.origin ?? s,
    color: n.c,
    life: a.life ?? 0.9,
    spread: a.spread ?? 0.3,
    glow: 1.6,
    blend: n.blend || 'add',
  }),
    lr(o, i, Math.round((a.points ?? 10) * o.quality) + 2).forEach((l, c) =>
      o.after((a.spread ?? 0.3) * (l.distanceTo(s) / Math.max(1, a.radius ?? 3)) + c * 0.01, () =>
        o.element(e, l.clone().setY(l.y + 0.5), { k: a.k ?? 0.6 }),
      ),
    ),
    o.glow(s.clone().setY(s.y + 0.8), n.c2, (a.radius ?? 3) * 0.9, 0.35, 2.4),
    o.light(s.clone().setY(s.y + 1.5), n.c, 10, (a.radius ?? 3) * 3, 0.6),
    o.fx('area', { style: e, at: s }),
    await o.wait(0.15));
}
async function Lu(o, e, t, a = {}) {
  let n = Jn(e),
    s = Sa(t),
    i = t.cells || [],
    r = nn(o, t),
    l = (t.dir && t.dir.lengthSq() > 0 ? Dn(t.dir.x, 0, t.dir.z) : r.clone().sub(s).setY(0)).normalize(),
    c = Math.max(2.5, ...i.map((h) => o.cellToWorld(h).distanceTo(s))),
    d = a.spread ?? 0.5,
    u = a.colors;
  (o.fx('area', { style: e, at: r }),
    o.light(s, n.c, 10, c * 1.5, 0.8),
    o.stream(a.dur ?? 0.55, (h) => {
      let p = Math.max(2, Math.round((a.rate ?? 160) * h * o.quality));
      for (let m = 0; m < p; m++) {
        let _ = l.clone(),
          b = Rt(-d, d);
        (_.applyAxisAngle(Dn(0, 1, 0), b), (_.y = Rt(-0.08, 0.15)));
        let f = Rt(c * 1.2, c * 2),
          v = u ? u[Math.floor(Math.random() * u.length)] : Math.random() < 0.4 ? n.c2 : n.c;
        (o.p({
          p: s.clone().add(hs(0.08)),
          v: _.clone().multiplyScalar(f),
          life: Rt(0.35, 0.55),
          size: Rt(0.08, 0.16),
          size1: Rt(0.3, 0.55),
          col: v,
          col1: u ? v : n.c,
          frame: a.frame ?? n.p,
          glow: 1.5,
          drag: 1.2,
          grav: e === 'fire' ? 1.5 : 0,
          spin: 3,
          a: 0.75,
        }),
          Math.random() < 0.35 &&
            o.p({
              p: s.clone(),
              v: _.clone().multiplyScalar(f * 1.1),
              life: 0.3,
              size: 0.04,
              col: n.c2,
              frame: FRAME.spark,
              glow: 2.4,
              stretch: 0.05,
              drag: 0.8,
            }));
      }
      e === 'fire' &&
        Math.random() < 0.5 &&
        o.p({
          p: s.clone().addScaledVector(l, c * 0.5),
          v: l.clone().multiplyScalar(2).setY(0.8),
          life: 1,
          size: 0.4,
          size1: 1.1,
          col: 2760728,
          a: 0.35,
          frame: FRAME.smoke,
          blend: 'alpha',
          fadeIn: 0.2,
        });
    }),
    o.hexwave(i, { origin: s, color: u ? u[0] : n.c, life: 0.9, spread: 0.35, glow: 1.5 }),
    await o.wait(0.25));
  for (let h of lr(o, i, 6)) o.after(Rt(0, 0.2), () => o.element(e, h.clone().setY(h.y + 0.5), { k: 0.45 }));
}
async function Ra(o, e, t, a = {}) {
  let n = Jn(e),
    s = t.targets?.length ? t.targets : t.caster ? [t.caster] : [];
  for (let i of s) {
    let r = i.pos.clone().setY(i.pos.y + 2.6);
    (o.ring(i.pos, { color: n.c, radius: a.radius ?? 0.85, life: 0.8, thick: 0.18, fill: 0.5 }),
      o.burst(r, {
        n: 16,
        col: n.c2,
        col1: n.c,
        speed: 0.6,
        up: -2.2,
        life: 0.9,
        size: 0.12,
        size1: 0.03,
        frame: a.frame ?? n.p,
        glow: 1.8,
        radius: 0.35,
        spin: 3,
        drag: 0.5,
      }),
      o.p({ p: Mt(i), life: 0.5, size: 0.9, size1: 1.3, col: n.c, frame: FRAME.glow, glow: 1.2, a: 0.5 }));
  }
  (s[0] && o.light(Mt(s[0]), n.c, 4, 5, 0.6),
    o.fx('aura_on', { style: e, at: s[0]?.pos }),
    await o.wait(0.35));
}
async function us(o, e, t, a, n = {}) {
  let s = Jn(e);
  for (let i of t.targets || []) {
    let r = (i.head || Mt(i)).clone().setY((i.head || Mt(i)).y + 0.4);
    (o.p({
      p: r.clone().setY(r.y + 0.6),
      v: [0, -1.2, 0],
      life: 0.6,
      size: 0.5,
      size1: 0.35,
      col: s.c2,
      frame: a,
      glow: 2,
      a: 1,
      a1: 0,
      rot: 0,
      spin: n.spin ?? 0,
    }),
      o.ring(i.pos, { color: s.c, radius: 0.9, life: 0.6, thick: 0.2, fill: 0.3 }),
      o.burst(Mt(i), {
        n: 12,
        col: s.c2,
        col1: s.c,
        speed: 1.6,
        life: 0.6,
        size: 0.1,
        frame: n.small ?? FRAME.spark,
        glow: 1.8,
      }));
  }
  (t.caster &&
    t.targets?.[0] &&
    n.link !== !1 &&
    o.beam(Sa(t), Mt(t.targets[0]), { col: s.c, width: 0.06, life: 0.35, glow: 2.4 }),
    await o.wait(0.3));
}
async function NS(o, e, t, a = 14674175) {
  for (let n of [e, t])
    n &&
      (o.burst(n.clone().setY(n.y + 0.8), {
        n: 20,
        col: a,
        speed: 1.4,
        life: 0.9,
        size: 0.3,
        size1: 0.8,
        frame: FRAME.cloud,
        blend: 'alpha',
        a: 0.5,
        drag: 2,
        radius: 0.3,
      }),
      o.burst(n.clone().setY(n.y + 0.8), { n: 12, col: 16777215, speed: 2, life: 0.5, size: 0.06, glow: 2 }));
  (o.fx('teleport', { at: t || e }), await o.wait(0.1));
}
async function XI(o, e, t) {
  for (let a of t.targets || []) {
    let n = Jn(e);
    (e === 'radiant' && o.pillar(a.pos, { color: 16769162, radius: 0.7, height: 6, life: 0.6, drop: 0.12 }),
      e === 'thunder' && o.ring(a.pos, { color: n.c, radius: 2.4, life: 0.45, thick: 0.15, fill: 0.6 }),
      e === 'nature' &&
        o.burst(a.pos.clone().setY(0.1), {
          n: 16,
          col: 7323450,
          speed: 1,
          up: 2.6,
          life: 0.8,
          size: 0.16,
          frame: FRAME.leaf,
          blend: 'alpha',
          grav: -3,
          spin: 4,
        }),
      o.element(e, Mt(a), { k: 1.3 }),
      o.light(Mt(a), n.c, 10, 7, 0.5));
  }
  await o.wait(0.12);
}
async function FS(o, e, t, a, n) {
  let s = n.phase || 'cast';
  if (s === 'rider' || t.r) return s === 'rider' ? XI(o, WI[e] || a, n) : null;
  if (s === 'dart') {
    let r = n.targets?.[0];
    if (!r) return null;
    let l = Mt(r);
    return (
      await o.projectile('missile', Sa(n).add(hs(0.25)), l, {
        speed: 13,
        size: 0.8,
        curve: Rt(-1.2, 1.2),
        arc: Rt(0.3, 1.3),
      }),
      o.element('missile', l, { k: 0.55 }),
      null
    );
  }
  if (s === 'burst') {
    let r = a === 'nature' ? 'nature' : a;
    if (r === 'nature')
      for (let l of lr(o, n.cells || [], 10))
        o.burst(l.clone().setY(0.6), {
          n: 8,
          col: 9424992,
          speed: 3,
          life: 0.5,
          size: 0.14,
          frame: FRAME.thorn,
          spin: 8,
          grav: -6,
        });
    return wc(o, r, n, { radius: 1.5, points: 4, k: 0.5, spread: 0.1 });
  }
  let i = $I[e];
  return i
    ? i(o, a, n)
    : s === 'attack'
      ? t.a === 'melee'
        ? n1(o, a, n)
        : ir(o, a, n)
      : t.a
        ? null
        : t.sh === 'cone'
          ? Lu(o, a, n)
          : n.cells && n.cells.length
            ? wc(o, a, n, { radius: Math.max(1.5, ((t.sz || 10) / 5) * 0.75) })
            : t.h || a === 'heal'
              ? Ra(o, 'heal', n)
              : ['buff', 'wind', 'nature', 'arcane', 'radiant'].includes(a) ||
                  (n.targets || []).every((r) => r.ally)
                ? Ra(o, a, n)
                : n.targets && n.targets.length
                  ? VI(o, a, n)
                  : Ra(o, a, { ...n, targets: n.caster ? [n.caster] : [] });
}
async function zu(o, e, t = 16726554) {
  let a = e.caster;
  (o.ring(a.pos, { color: t, radius: 2.2, life: 0.5, thick: 0.2, fill: 0.5 }),
    o.burst(a.chest || a.pos, {
      n: 26,
      col: 16756832,
      col1: t,
      speed: 3,
      up: 1.5,
      life: 0.8,
      size: 0.06,
      stretch: 0.05,
      glow: 2.5,
      grav: -1,
    }),
    o.light(a.chest || a.pos, t, 8, 6, 0.6),
    o.shake(0.006, 0.25),
    await o.wait(0.2));
}
async function rr(o, e, t = 16766314, a = FRAME.star) {
  let n = e.caster;
  (o.ring(n.pos, { color: t, radius: 1.2, life: 0.6, thick: 0.25, fill: 0.6 }),
    o.stream(0.45, (s) => {
      let i = Math.max(1, Math.round(60 * s * o.quality));
      for (let r = 0; r < i; r++) {
        let l = Math.random() * Math.PI * 2;
        o.p({
          p: [n.pos.x + Math.cos(l) * 0.45, n.pos.y + Rt(0, 0.3), n.pos.z + Math.sin(l) * 0.45],
          v: [0, Rt(3, 5), 0],
          life: 0.45,
          size: 0.06,
          stretch: 0.08,
          col: t,
          frame: FRAME.spark,
          glow: 2.4,
        });
      }
    }),
    o.p({ p: n.chest || n.pos, life: 0.5, size: 0.8, size1: 1.4, col: t, frame: a, glow: 2, rot: 0 }),
    o.light(n.chest || n.pos, t, 6, 5, 0.5),
    await o.wait(0.25));
}
async function Im(o, e) {
  let t = e.caster;
  (o.stream(0.5, (a, n, s) => {
    let i = Math.max(1, Math.round(40 * a * o.quality));
    for (let r = 0; r < i; r++) {
      let l = s * 10 + Math.random() * 6.28;
      o.p({
        p: [t.pos.x + Math.cos(l) * 0.55, t.pos.y + Rt(0.05, 1.2), t.pos.z + Math.sin(l) * 0.55],
        v: [-Math.sin(l) * 3, 0.6, Math.cos(l) * 3],
        life: 0.35,
        size: 0.22,
        size1: 0.4,
        col: 15267071,
        frame: FRAME.swirl,
        glow: 1.2,
        a: 0.5,
        spin: 6,
      });
    }
  }),
    await o.wait(0.15));
}
async function OS(o, e, t) {
  let a = YI[e];
  return a ? a(o, t) : t.caster ? rr(o, t, 16766314, FRAME.star) : null;
}
const Dn = (o = 0, e = 0, t = 0) => new Vector3(o, e, t);
const Rt = (o, e) => o + Math.random() * (e - o);
const $I = {
  fire_bolt: (o, e, t) => (t.phase === 'attack' ? ir(o, 'fire', t, { speed: 15, size: 1.4 }) : null),
  produce_flame_hurl: (o, e, t) =>
    t.phase === 'attack' ? ir(o, 'fire', t, { speed: 14, size: 0.9, arc: 0.6 }) : null,
  starry_wisp: (o, e, t) =>
    t.phase === 'attack' ? ir(o, 'radiant', t, { speed: 18, size: 0.7, curve: 0.4 }) : null,
  chill_touch: (o, e, t) =>
    t.phase === 'attack' ? ir(o, 'necrotic', t, { speed: 11, size: 0.9, curve: -0.3 }) : null,
  sorcerous_burst: (o, e, t) => (t.phase === 'attack' ? ir(o, e, t, { speed: 16, size: 1 }) : null),
  chromatic_orb: (o, e, t) =>
    t.phase === 'attack' ? ir(o, e, t, { speed: 13, size: 1.25, arc: 0.4 }) : null,
  guiding_bolt: async (o, e, t) => {
    t.phase === 'attack' &&
      (await ir(o, 'radiant', t, { speed: 20, size: 1.3 }),
      t.hit !== !1 &&
        t.targets?.[0] &&
        o.pillar(t.targets[0].pos, { color: 16769162, radius: 0.5, height: 3, life: 0.5 }));
  },
  ray_of_frost: (o, e, t) =>
    t.phase === 'attack' ? Dm(o, 'frost', t, { width: 0.22, life: 0.5, glow: 1.3 }) : null,
  eldritch_blast: (o, e, t) =>
    t.phase === 'attack'
      ? Dm(o, 'eldritch', t, { width: 0.26, life: 0.4, mode: 'bolt', jitter: 0.18 })
      : null,
  scorching_ray: (o, e, t) => (t.phase === 'attack' ? Dm(o, 'fire', t, { width: 0.18, life: 0.35 }) : null),
  ray_of_sickness: (o, e, t) => (t.phase === 'attack' ? Dm(o, 'poison', t, { width: 0.2, life: 0.5 }) : null),
  shocking_grasp: (o, e, t) => (t.phase === 'attack' ? n1(o, 'lightning', t) : null),
  inflict_wounds: (o, e, t) => (t.phase === 'attack' ? n1(o, 'necrotic', t) : null),
  flame_blade_strike: (o, e, t) => {
    if (t.phase !== 'attack' || !t.targets?.[0]) return null;
    let a = Mt(t.targets[0]);
    return (
      o.slash(a, { color: 16747050, size: 1.4, life: 0.3, glow: 3 }),
      t.hit !== !1 && o.element('fire', a, { k: t.crit ? 1.3 : 0.8 }),
      o.wait(0.05)
    );
  },
  ice_knife: async (o, e, t) => {
    if (t.phase !== 'attack' || !t.targets?.[0]) return;
    let a = Sa(t),
      n = Mt(t.targets[0]);
    o.burst(a, { n: 8, col: 15268607, speed: 1, life: 0.3, size: 0.06, frame: FRAME.flake });
    let s = await o.projectile('frost', a, n, { speed: 22, size: 0.6, miss: t.hit === !1 });
    o.burst(s, {
      n: 10,
      col: 15268607,
      speed: 3,
      life: 0.5,
      size: 0.12,
      frame: FRAME.shard,
      grav: -8,
      spin: 8,
    });
  },
  acid_arrow: async (o, e, t) => {
    if (t.phase !== 'attack' || !t.targets?.[0]) return;
    let a = Mt(t.targets[0]),
      n = await o.projectile('acid', Sa(t), a, { speed: 18, size: 0.7, arc: 0.5, miss: t.hit === !1 });
    o.element('acid', t.hit === !1 ? n : a, { k: t.hit === !1 ? 0.6 : 1 });
  },
  spiritual_weapon: (o, e, t) => (
    t.phase === 'attack' &&
      t.targets?.[0] &&
      t.hit !== !1 &&
      o.element('force', Mt(t.targets[0]), { k: t.crit ? 1.3 : 0.8 }),
    null
  ),
  sacred_flame: async (o, e, t) => {
    for (let a of t.targets || [])
      (o.pillar(a.pos, { color: 16765040, radius: 0.5, height: 6, life: 0.85, drop: 0.16 }),
        o.after(0.12, () => {
          (o.element('radiant', Mt(a), { k: 0.9 }),
            o.burst(a.pos.clone().setY(a.pos.y + 0.1), {
              n: 18,
              col: 16771232,
              col1: 16751152,
              speed: 2,
              up: 2.6,
              life: 0.6,
              size: 0.2,
              size1: 0.05,
              frame: FRAME.flame,
              glow: 2,
            }));
        }));
    (o.fx('area', { style: 'radiant', at: t.targets?.[0]?.pos }), await o.wait(0.18));
  },
  toll_the_dead: async (o, e, t) => {
    for (let a of t.targets || []) {
      let n = a.pos.clone().setY(a.pos.y + 2.4);
      o.p({
        p: n,
        life: 0.9,
        size: 0.55,
        size1: 0.65,
        col: 10518736,
        frame: FRAME.bell,
        glow: 1.6,
        a: 0.95,
        rot: 0.25,
        spin: -0.6,
      });
      for (let s = 0; s < 3; s++)
        o.after(s * 0.16, () =>
          o.ring(Mt(a), {
            color: 9067208,
            radius: 1 + s * 0.5,
            life: 0.6,
            thick: 0.1,
            vertical: o.camera.position.clone().sub(Mt(a)),
            y: 0,
          }),
        );
      o.after(0.15, () => o.element('necrotic', Mt(a), { k: 0.9 }));
    }
    (o.fx('area', { style: 'necrotic', at: t.targets?.[0]?.pos }), await o.wait(0.2));
  },
  vicious_mockery: async (o, e, t) => {
    let a = t.targets?.[0];
    if (!a) return;
    let n = t.caster ? t.caster.head || Sa(t) : Mt(a),
      s = a.head || Mt(a),
      i = s.clone().sub(n);
    for (let r = 0; r < 5; r++)
      o.after(r * 0.06, () => {
        let l = 0.15 + r * 0.2,
          c = n.clone().lerp(s, l);
        o.ring(c, { color: 16743128, radius: 0.3 + r * 0.16, life: 0.45, thick: 0.3, vertical: i, y: 0 });
      });
    for (let r = 0; r < Math.round(10 * o.quality) + 4; r++)
      o.after(r * 0.025, () =>
        o.p({
          p: n.clone().add(hs(0.1)),
          v: i.clone().multiplyScalar(Rt(2.2, 3)).add(hs(0.6)),
          life: 0.4,
          size: Rt(0.16, 0.24),
          col: 16756968,
          frame: Math.random() < 0.3 ? FRAME.skull : FRAME.note,
          glow: 1.8,
          drag: 1.5,
          rot: Rt(-0.4, 0.4),
          a: 0.95,
        }),
      );
    (await o.wait(0.3),
      o.burst(s, {
        n: 12,
        col: 16756968,
        col1: 13652144,
        speed: 1.6,
        up: 0.8,
        life: 1.1,
        size: 0.26,
        size1: 0.12,
        frame: FRAME.note,
        glow: 1.8,
        spin: 3,
        drag: 1,
      }),
      o.p({
        p: s.clone().setY(s.y + 0.5),
        v: [0, 0.4, 0],
        life: 1,
        size: 0.45,
        size1: 0.55,
        col: 16747232,
        frame: FRAME.spiral,
        glow: 1.6,
        spin: 6,
        a: 0.9,
      }),
      o.element('psychic', Mt(a), { k: 0.8 }));
  },
  mind_spike: async (o, e, t) => {
    let a = t.targets?.[0];
    a &&
      (o.beam(Sa(t), a.head || Mt(a), { col: 16739024, width: 0.07, life: 0.3, glow: 3 }),
      await o.wait(0.06),
      o.element('psychic', a.head || Mt(a), { k: 1 }));
  },
  dissonant_whispers: async (o, e, t) => {
    for (let a of t.targets || []) {
      let n = a.head || Mt(a);
      for (let s = 0; s < 4; s++)
        o.after(s * 0.1, () =>
          o.ring(n, {
            color: 12607743,
            radius: 0.5 + s * 0.25,
            life: 0.5,
            thick: 0.18,
            vertical: o.camera.position.clone().sub(n),
            y: 0,
          }),
        );
      o.burst(n, {
        n: 10,
        col: 16756991,
        speed: 1,
        up: 0.5,
        life: 1,
        size: 0.18,
        frame: FRAME.spiral,
        glow: 1.8,
        spin: 5,
      });
    }
    await o.wait(0.3);
  },
  poison_spray: async (o, e, t) => {
    let a = t.targets?.[0];
    if (!a) return;
    let n = Sa(t),
      s = Mt(a),
      i = s.clone().sub(n),
      r = t.hit === !1;
    (o.stream(0.4, (c) => {
      let d = Math.max(2, Math.round(150 * c * o.quality));
      for (let u = 0; u < d; u++) {
        let h = i
          .clone()
          .normalize()
          .add(hs(0.16))
          .normalize()
          .multiplyScalar(i.length() * Rt(1.7, 2.5));
        (o.p({
          p: n,
          v: h,
          life: Rt(0.45, 0.6),
          size: 0.14,
          size1: Rt(0.6, 0.9),
          col: 11591776,
          col1: 4880922,
          frame: FRAME.smoke,
          blend: 'alpha',
          a: 0.55,
          drag: 1.5,
        }),
          Math.random() < 0.4 &&
            o.p({
              p: n.clone().add(hs(0.05)),
              v: h.clone().multiplyScalar(1.05),
              life: 0.4,
              size: 0.07,
              size1: 0.02,
              col: 14221178,
              frame: FRAME.drop,
              glow: 1.8,
              drag: 1.2,
              a: 0.9,
            }));
      }
    }),
      await o.wait(0.25));
    let l = r ? s.clone().addScaledVector(i.clone().normalize(), 1.2) : s;
    for (let c = 0; c < 6; c++)
      o.p({
        p: l.clone().add(hs(0.35)),
        v: hs(0.3).setY(0.25),
        life: Rt(1.1, 1.6),
        size: 0.5,
        size1: 1.1,
        col: 9093184,
        col1: 3033616,
        frame: FRAME.cloud,
        blend: 'alpha',
        a: 0.45,
        fadeIn: 0.15,
        drag: 1,
        spin: 0.5,
      });
    r || o.element('poison', s, { k: 1 });
  },
  thorn_whip: async (o, e, t) => {
    let a = t.targets?.[0];
    if (!a) return;
    let n = Sa(t),
      s = Mt(a),
      i = n
        .clone()
        .lerp(s, 0.5)
        .add(Dn(0, 0.8, 0)),
      r = new QuadraticBezierCurve3(n, i, s);
    (o.ribbon(r.getPoints(16), { col: 6278986, width: 0.09, life: 0.45, glow: 1.4 }),
      await o.wait(0.12),
      t.hit !== !1 &&
        (o.element('nature', s, { k: 0.8 }),
        o.burst(s, { n: 8, col: 9424992, speed: 3, life: 0.4, size: 0.12, frame: FRAME.thorn, spin: 6 })));
  },
  hellish_rebuke: async (o, e, t) => {
    for (let a of t.targets || [])
      (o.stream(0.6, (n) => {
        let s = Math.max(1, Math.round(70 * n * o.quality));
        for (let i = 0; i < s; i++) {
          let r = Math.random() * Math.PI * 2;
          o.p({
            p: [a.pos.x + Math.cos(r) * 0.35, a.pos.y + Rt(0, 0.4), a.pos.z + Math.sin(r) * 0.35],
            v: [0, Rt(2, 3.5), 0],
            life: 0.5,
            size: 0.3,
            size1: 0.08,
            col: 16765562,
            col1: 16722440,
            frame: FRAME.flame,
            glow: 2,
          });
        }
      }),
        o.after(0.1, () => o.element('fire', Mt(a), { k: 0.9 })));
    await o.wait(0.2);
  },
  word_of_radiance: async (o, e, t) => {
    let a = t.caster;
    (o.glow(a.chest || a.pos, 16773312, 2.5, 0.3, 3),
      o.ring(a.pos, { color: 16765024, radius: 2.6, life: 0.6, thick: 0.18, fill: 0.8 }),
      o.burst(a.chest || a.pos, {
        n: 30,
        col: 16774864,
        speed: 5,
        life: 0.5,
        size: 0.14,
        frame: FRAME.star,
        glow: 2.4,
        flat: !0,
        spin: 4,
      }),
      await wc(o, 'radiant', t, { radius: 2, points: 4, k: 0.5, spread: 0.15, origin: a.pos }));
  },
  thunderclap: async (o, e, t) => {
    let a = t.caster;
    (o.ring(a.pos, { color: 12103935, radius: 3, life: 0.45, thick: 0.12, fill: 0.5 }),
      o.dome(a.pos, { color: 15131391, radius: 2.2, life: 0.35, alpha: 0.6 }),
      o.burst(a.pos.clone().setY(0.3), {
        n: 24,
        col: 11049608,
        speed: 4,
        life: 0.8,
        size: 0.3,
        size1: 0.7,
        frame: FRAME.dust,
        blend: 'alpha',
        a: 0.45,
        drag: 3,
        flat: !0,
      }),
      o.shake(0.01, 0.35),
      o.fx('area', { style: 'thunder', at: a.pos }),
      o.hexwave(t.cells, { origin: a.pos, color: 11051263, life: 0.6, spread: 0.15 }),
      await o.wait(0.1));
  },
  arms_of_hadar: async (o, e, t) => {
    let a = t.caster;
    o.ring(a.pos, { color: 6961824, radius: 4, life: 0.8, thick: 0.25, fill: 1 });
    for (let n of lr(o, t.cells || [], 12))
      o.after(Rt(0, 0.2), () => {
        (o.burst(n.clone().setY(0.2), {
          n: 6,
          col: 1706532,
          speed: 0.6,
          up: 2.6,
          life: 0.8,
          size: 0.25,
          size1: 0.6,
          frame: FRAME.smoke,
          blend: 'alpha',
          a: 0.65,
        }),
          o.beam(n.clone().setY(0), n.clone().add(Dn(Rt(-0.3, 0.3), Rt(1.4, 2.2), Rt(-0.3, 0.3))), {
            col: 9067208,
            width: 0.08,
            life: 0.5,
            mode: 'bolt',
            jitter: 0.3,
            glow: 2,
          }));
      });
    (o.fx('area', { style: 'necrotic', at: a.pos }),
      o.hexwave(t.cells, { origin: a.pos, color: 6961824, life: 0.9, spread: 0.2 }),
      await o.wait(0.3));
  },
  acid_splash: async (o, e, t) => {
    let a = nn(o, t);
    (await o.projectile('acid', Sa(t), a.clone().setY(a.y + 0.4), { speed: 12, size: 1, arc: 1.2 }),
      o.burst(a.clone().setY(a.y + 0.3), {
        n: 30,
        col: 13172554,
        speed: 3.5,
        up: 2,
        life: 0.8,
        size: 0.12,
        frame: FRAME.drop,
        glow: 1.6,
        grav: -9,
        stretch: 0.05,
      }),
      await wc(o, 'acid', t, { radius: 1.5, points: 3, k: 0.6, spread: 0.1 }));
  },
  sleep: async (o, e, t) => {
    let a = nn(o, t);
    (o.hexwave(t.cells, { origin: a, color: 10259711, life: 1.6, spread: 0.4, glow: 1.2 }),
      o.stream(1.1, (n) => {
        let s = Math.max(1, Math.round(50 * n * o.quality));
        for (let i = 0; i < s; i++) {
          let r = a.clone().add(Dn(Rt(-1.9, 1.9), Rt(2.2, 3.2), Rt(-1.9, 1.9)));
          o.p({
            p: r,
            v: [Rt(-0.2, 0.2), Rt(-1.4, -0.8), Rt(-0.2, 0.2)],
            life: 2,
            size: 0.12,
            size1: 0.05,
            col: Math.random() < 0.5 ? 15261951 : 10259711,
            frame: FRAME.star,
            glow: 1.6,
            spin: 2,
            a: 0.9,
          });
        }
      }),
      o.fx('area', { style: 'sleep', at: a }),
      o.light(a.clone().setY(2), 10259711, 5, 8, 1.4),
      await o.wait(0.6));
  },
  thunderwave: async (o, e, t) => {
    let a = t.caster,
      n = nn(o, t),
      s = n.clone().sub(a.pos).setY(0).normalize();
    for (let i = 0; i < 3; i++)
      o.after(i * 0.07, () => {
        let r = a.pos
          .clone()
          .addScaledVector(s, 0.8 + i * 1.2)
          .setY(1);
        o.ring(r, {
          color: 13156607,
          radius: 1.2 + i * 0.6,
          life: 0.4,
          thick: 0.15,
          vertical: s,
          y: 0,
          glow: 2.4,
        });
      });
    (o.burst(n.clone().setY(0.3), {
      n: 30,
      col: 11049608,
      speed: 4.5,
      life: 0.9,
      size: 0.3,
      size1: 0.8,
      frame: FRAME.dust,
      blend: 'alpha',
      a: 0.45,
      drag: 3,
      dir: s,
      cone: 0.8,
    }),
      o.hexwave(t.cells, { origin: a.pos, color: 11051263, life: 0.7, spread: 0.2 }),
      o.shake(0.012, 0.4),
      o.fx('area', { style: 'thunder', at: n }),
      await o.wait(0.18));
  },
  burning_hands: (o, e, t) => Lu(o, 'fire', t, { spread: 0.55, rate: 180 }),
  color_spray: (o, e, t) =>
    Lu(o, 'color', t, {
      spread: 0.55,
      rate: 140,
      frame: FRAME.star,
      colors: [16734810, 16760896, 16773216, 6356864, 6340863, 12611839],
    }),
  dragons_breath_exhale: (o, e, t) => Lu(o, DAMAGE_STYLE[t.dtype] || 'fire', t, { spread: 0.5 }),
  shatter: async (o, e, t) => {
    let a = nn(o, t),
      n = a.clone().setY(a.y + 1);
    (o.glow(n, 16777215, 2.5, 0.2, 3.5),
      o.dome(a, { color: 14207231, radius: 3.2, life: 0.5, alpha: 0.5, half: !0 }),
      o.ring(a, { color: 12624127, radius: 4, life: 0.6, thick: 0.12, fill: 0.6 }),
      o.burst(n, {
        n: 36,
        col: 15261439,
        speed: 7,
        life: 0.8,
        size: 0.16,
        frame: FRAME.shard,
        grav: -8,
        spin: 9,
        glow: 1.8,
      }),
      o.shake(0.014, 0.45),
      await wc(o, 'shatter', t, { radius: 3, points: 5, k: 0.5, spread: 0.12 }));
  },
  faerie_fire: async (o, e, t) => {
    let a = nn(o, t);
    o.hexwave(t.cells, { origin: a, color: 11567359, life: 1.4, spread: 0.3 });
    for (let n of lr(o, t.cells || [], 16))
      o.burst(n.clone().setY(n.y + 0.6), {
        n: 8,
        col: Math.random() < 0.5 ? 8442111 : 13668607,
        speed: 0.8,
        up: 0.8,
        life: 1.4,
        size: 0.1,
        frame: FRAME.star,
        glow: 2.2,
        spin: 3,
        radius: 0.4,
        flicker: 0.4,
      });
    (o.fx('area', { style: 'faerie', at: a }), await o.wait(0.3));
  },
  hail_of_thorns: () => null,
  spider_web: async (o, e, t) => {
    let a = t.targets?.[0];
    if (!a) return;
    let n = t.caster ? (t.caster.head || t.caster.chest).clone() : Mt(a).add(Dn(0, 2, 0));
    (await o.projectile('web', n, Mt(a), { speed: 11, size: 0.7, arc: 0.6 }),
      o.burst(Mt(a), {
        n: 18,
        col: 16777215,
        speed: 2.6,
        life: 0.5,
        size: 0.35,
        size1: 0.6,
        frame: FRAME.web,
        blend: 'alpha',
        a: 0.85,
        spin: 2,
      }),
      o.fx('area', { style: 'web', at: a.pos }));
  },
  entangle: async (o, e, t) => {
    let a = nn(o, t);
    for (let n of lr(o, t.cells || [], 16))
      o.after(Rt(0, 0.3), () =>
        o.burst(n.clone().setY(0.1), {
          n: 6,
          col: 7323450,
          col1: 3828250,
          speed: 1.2,
          up: 2.4,
          life: 0.9,
          size: 0.16,
          frame: FRAME.leaf,
          blend: 'alpha',
          grav: -3,
          spin: 4,
          a: 0.95,
        }),
      );
    (o.fx('area', { style: 'nature', at: a }), await o.wait(0.35));
  },
  web: async (o, e, t) => {
    let a = nn(o, t);
    (await o.projectile('web', Sa(t), a.clone().setY(a.y + 0.6), { speed: 14, size: 0.6, arc: 0.8 }),
      o.burst(a.clone().setY(0.8), {
        n: 24,
        col: 16777215,
        speed: 4,
        life: 0.5,
        size: 0.4,
        size1: 0.6,
        frame: FRAME.web,
        blend: 'alpha',
        a: 0.8,
        flat: !0,
        spin: 2,
      }),
      o.fx('area', { style: 'web', at: a }));
  },
  fog_cloud: async (o, e, t) => {
    let a = nn(o, t);
    (o.burst(a.clone().setY(0.6), {
      n: 30,
      col: 14212580,
      speed: 3,
      life: 1.4,
      size: 0.6,
      size1: 1.6,
      frame: FRAME.cloud,
      blend: 'alpha',
      a: 0.5,
      drag: 2,
      flat: !0,
    }),
      o.fx('area', { style: 'fog', at: a }),
      await o.wait(0.3));
  },
  darkness: async (o, e, t) => {
    let a = nn(o, t);
    (o.burst(a.clone().setY(1), {
      n: 30,
      col: 656912,
      speed: 4,
      life: 1.2,
      size: 0.6,
      size1: 1.8,
      frame: FRAME.cloud,
      blend: 'alpha',
      a: 0.85,
      drag: 2.5,
    }),
      o.fx('area', { style: 'darkness', at: a }),
      await o.wait(0.3));
  },
  grease: async (o, e, t) => {
    let a = nn(o, t);
    (o.burst(a.clone().setY(1.2), {
      n: 22,
      col: 5917216,
      speed: 2.5,
      up: 1,
      life: 0.8,
      size: 0.12,
      frame: FRAME.drop,
      blend: 'alpha',
      grav: -9,
      a: 0.95,
    }),
      o.fx('area', { style: 'grease', at: a }),
      await o.wait(0.3));
  },
  spike_growth: async (o, e, t) => {
    let a = nn(o, t);
    for (let n of lr(o, t.cells || [], 16))
      o.after(Rt(0, 0.3), () =>
        o.burst(n.clone().setY(0.05), {
          n: 5,
          col: 9072696,
          speed: 0.6,
          up: 1.6,
          life: 0.5,
          size: 0.18,
          frame: FRAME.thorn,
          blend: 'alpha',
          grav: -4,
          a: 1,
        }),
      );
    (o.fx('area', { style: 'nature', at: a }), await o.wait(0.3));
  },
  moonbeam: async (o, e, t) => {
    let a = nn(o, t);
    (o.pillar(a, { color: 11060479, radius: 1.3, height: 9, life: 0.9, drop: 0.25, alpha: 0.55, glow: 1.1 }),
      o.light(a.clone().setY(2), 13623551, 8, 8, 0.9),
      o.fx('area', { style: 'moon', at: a }),
      await o.wait(0.25));
    for (let n of t.targets || []) o.element('radiant', Mt(n), { k: 0.7 });
  },
  flaming_sphere: async (o, e, t) => {
    let a = t.cell ? o.cellToWorld(t.cell) : nn(o, t);
    (o.burst(a.clone().setY(0.5), {
      n: 30,
      col: 16765562,
      col1: 16726536,
      speed: 3,
      life: 0.6,
      size: 0.3,
      frame: FRAME.flame,
      glow: 2,
    }),
      await o.wait(0.1));
  },
  cure_wounds: async (o, e, t) => {
    let a = t.targets?.[0];
    if (!a) return;
    let n = Sa(t);
    (o.p({ p: n, life: 0.5, size: 0.4, size1: 0.8, col: 10289072, frame: FRAME.glow, glow: 2.2 }),
      o.beam(n, Mt(a), { col: 10289072, width: 0.08, life: 0.35, glow: 2 }),
      await o.wait(0.15));
  },
  healing_word: async (o, e, t) => {
    let a = t.targets?.[0];
    if (!a) return;
    let n = Sa(t),
      s = Mt(a);
    (await o.projectile('heal', n, s, { speed: 12, size: 0.6, arc: 0.8 }),
      o.p({
        p: s.clone().setY(s.y + 0.6),
        v: [0, 0.6, 0],
        life: 0.9,
        size: 0.45,
        col: 16774336,
        frame: FRAME.note,
        glow: 2,
        rot: 0,
      }));
  },
  spare_the_dying: (o, e, t) => Ra(o, 'heal', t, { radius: 0.7 }),
  lesser_restoration: (o, e, t) => Ra(o, 'heal', t),
  bless: (o, e, t) => Ra(o, 'buff', t),
  aid: (o, e, t) => Ra(o, 'buff', t, { radius: 1 }),
  heroism: (o, e, t) => Ra(o, 'buff', t, { frame: FRAME.sun }),
  guidance: (o, e, t) => Ra(o, 'buff', t, { radius: 0.6, frame: FRAME.star }),
  bane: (o, e, t) => us(o, 'curse', t, FRAME.skull, { link: !1 }),
  shield_of_faith: async (o, e, t) => {
    for (let a of t.targets || [])
      o.dome(a.pos, { color: 16766314, radius: 1, life: 0.9, alpha: 0.7, grow: !0, hex: 1 });
    await Ra(o, 'buff', t, { frame: FRAME.shield });
  },
  sanctuary: async (o, e, t) => {
    for (let a of t.targets || []) o.dome(a.pos, { color: 16315647, radius: 1.1, life: 1, alpha: 0.6 });
    await Ra(o, 'buff', t, { frame: FRAME.ankh });
  },
  protection_from_evil_and_good: (o, e, t) => Ra(o, 'radiant', t, { frame: FRAME.ankh }),
  warding_bond: async (o, e, t) => {
    let a = t.targets?.[0];
    (a && t.caster && o.beam(Mt(t.caster), Mt(a), { col: 16766314, width: 0.06, life: 0.9, glow: 2 }),
      await Ra(o, 'buff', t, { frame: FRAME.chain }));
  },
  mage_armor: async (o, e, t) => {
    for (let a of t.targets?.length ? t.targets : [t.caster])
      a && o.dome(a.pos, { color: 9416959, radius: 0.9, life: 0.8, alpha: 0.6, hex: 1 });
    await o.wait(0.2);
  },
  armor_of_agathys: async (o, e, t) => {
    let a = t.caster;
    (o.dome(a.pos, { color: 10477823, radius: 1, life: 1, alpha: 0.8, hex: 1 }),
      o.burst(a.chest || a.pos, {
        n: 24,
        col: 15268607,
        speed: 1.6,
        life: 1,
        size: 0.1,
        frame: FRAME.flake,
        glow: 1.6,
        spin: 3,
        radius: 0.4,
      }),
      await o.wait(0.25));
  },
  false_life: async (o, e, t) => {
    let a = t.caster;
    for (let n = 0; n < Math.round(26 * o.quality); n++) {
      let s = hs(1.4);
      ((s.y = Math.abs(s.y)),
        o.p({
          p: (a.chest || a.pos).clone().add(s),
          v: s.clone().multiplyScalar(-2),
          life: 0.5,
          size: 0.1,
          size1: 0.03,
          col: 10289050,
          col1: 6961824,
          frame: FRAME.spark,
          glow: 1.8,
        }));
    }
    (o.after(0.4, () => o.glow(a.chest || a.pos, 9067208, 1.2, 0.3, 2)), await o.wait(0.45));
  },
  divine_favor: (o, e, t) => Ra(o, 'radiant', t, { radius: 0.7 }),
  shield: async (o, e, t) => {
    let a = t.caster,
      n = (a.chest || a.pos).clone().addScaledVector(a.fwd || Dn(0, 0, 1), 0.45);
    (o.ring(n, {
      color: 10471679,
      radius: 0.9,
      life: 0.5,
      thick: 0.35,
      fill: 1,
      vertical: a.fwd || Dn(0, 0, 1),
      y: 0,
      glow: 2.4,
    }),
      o.p({ p: n, life: 0.5, size: 1.4, size1: 1.6, col: 10471679, frame: FRAME.sigil, glow: 2, rot: 0 }),
      o.p({ p: n, life: 0.6, size: 0.6, size1: 0.75, col: 14741759, frame: FRAME.shield, glow: 2.2, rot: 0 }),
      o.fx('shield', { at: n }),
      await o.wait(0.15));
  },
  misty_step: async (o, e, t) => {
    t.phase === 'teleport'
      ? await NS(o, t.caster?.pos, t.cell ? o.cellToWorld(t.cell) : null)
      : o.burst((t.caster?.chest || Dn()).clone(), {
          n: 14,
          col: 14674175,
          speed: 1,
          life: 0.7,
          size: 0.25,
          size1: 0.6,
          frame: FRAME.cloud,
          blend: 'alpha',
          a: 0.5,
        });
  },
  expeditious_retreat: (o, e, t) => Ra(o, 'wind', t, { frame: FRAME.swirl }),
  longstrider: (o, e, t) => Ra(o, 'wind', t, { frame: FRAME.feather }),
  barkskin: (o, e, t) => Ra(o, 'nature', t, { frame: FRAME.leaf }),
  invisibility: async (o, e, t) => {
    for (let a of t.targets || [])
      o.burst(Mt(a), {
        n: 24,
        col: 13162751,
        speed: 1.2,
        life: 0.9,
        size: 0.12,
        frame: FRAME.star,
        glow: 1.6,
        radius: 0.4,
        flicker: 0.5,
      });
    await o.wait(0.3);
  },
  blur: async (o, e, t) => {
    let a = t.caster;
    (o.burst(a.chest || a.pos, {
      n: 20,
      col: 11575551,
      speed: 1,
      life: 0.8,
      size: 0.25,
      size1: 0.6,
      frame: FRAME.swirl,
      glow: 1.4,
      spin: 5,
      radius: 0.3,
    }),
      await o.wait(0.25));
  },
  mirror_image: async (o, e, t) => {
    let a = t.caster;
    (o.burst(a.chest || a.pos, {
      n: 26,
      col: 12628223,
      speed: 2.2,
      life: 0.7,
      size: 0.1,
      frame: FRAME.star,
      glow: 2,
      flat: !0,
    }),
      await o.wait(0.25));
  },
  magic_weapon: (o, e, t) => Ra(o, 'arcane', t, { radius: 0.6, frame: FRAME.sword }),
  enlarge_reduce: (o, e, t) => Ra(o, 'arcane', t, { radius: 1.1, frame: FRAME.star }),
  true_strike: (o, e, t) => Ra(o, 'radiant', t, { radius: 0.6, frame: FRAME.cross }),
  shillelagh: (o, e, t) => Ra(o, 'nature', t, { radius: 0.6 }),
  produce_flame: async (o, e, t) => {
    let a = Sa(t);
    (o.burst(a, {
      n: 18,
      col: 16765562,
      col1: 16726536,
      speed: 1,
      up: 1.4,
      life: 0.5,
      size: 0.18,
      frame: FRAME.flame,
      glow: 2,
    }),
      await o.wait(0.1));
  },
  flame_blade: async (o, e, t) => {
    let a = Sa(t);
    (o.burst(a, {
      n: 24,
      col: 16765562,
      col1: 16726536,
      speed: 1.5,
      up: 1.6,
      life: 0.6,
      size: 0.2,
      frame: FRAME.flame,
      glow: 2,
    }),
      o.light(a, 16742954, 6, 5, 0.6),
      await o.wait(0.15));
  },
  dragons_breath: (o, e, t) => Ra(o, DAMAGE_STYLE[t.dtype] || 'fire', t),
  command: (o, e, t) => us(o, 'command', t, FRAME.rune),
  charm_person: (o, e, t) => us(o, 'charm', t, FRAME.heart, { small: FRAME.heart }),
  suggestion: (o, e, t) => us(o, 'charm', t, FRAME.spiral, { spin: 4 }),
  hideous_laughter: (o, e, t) => us(o, 'psychic', t, FRAME.spiral, { spin: 6, small: FRAME.note }),
  hold_person: (o, e, t) => us(o, 'command', t, FRAME.chain),
  blindness_deafness: (o, e, t) => us(o, 'curse', t, FRAME.eye),
  ray_of_enfeeblement: async (o, e, t) => {
    let a = t.targets?.[0];
    (a && o.beam(Sa(t), Mt(a), { col: 6961824, width: 0.16, life: 0.5, glow: 2 }),
      await us(o, 'necrotic', t, FRAME.skull, { link: !1 }));
  },
  hex: (o, e, t) => us(o, 'curse', t, FRAME.sigil, { spin: 1.5 }),
  hunters_mark: (o, e, t) => us(o, 'mark', t, FRAME.cross, { spin: 1 }),
};
const WI = {
  divine_smite: 'radiant',
  shining_smite: 'radiant',
  searing_smite: 'fire',
  thunderous_smite: 'thunder',
  wrathful_smite: 'necrotic',
  ensnaring_strike: 'nature',
};
const YI = {
  rage: (o, e) => zu(o, e, 16722448),
  reckless: (o, e) => zu(o, e, 16738848),
  frenzy: (o, e) => zu(o, e, 16722448),
  action_surge: (o, e) => rr(o, e, 16766314, FRAME.bolt),
  second_wind: async (o, e) => {
    await Im(o, e);
  },
  innate_sorcery: (o, e) => rr(o, e, 11567359, FRAME.rune),
  create_slot: (o, e) => rr(o, e, 10320895, FRAME.rune),
  metamagic: (o, e) => rr(o, e, 12615935, FRAME.rune),
  sacred_weapon: (o, e) => rr(o, e, 16769162, FRAME.sword),
  uncanny_metabolism: (o, e) => rr(o, e, 10289072, FRAME.swirl),
  relentless_endurance: (o, e) => zu(o, e, 16747056),
  adrenaline_rush: async (o, e) => {
    (await Im(o, e), await zu(o, e, 16732208));
  },
  flurry: (o, e) => rr(o, e, 12574975, FRAME.fist),
  patient_defense: (o, e) => Im(o, e),
  step_of_wind: (o, e) => Im(o, e),
  steady_aim: async (o, e) => {
    let t = e.caster;
    (o.p({
      p: (t.head || t.chest).clone().setY((t.head || t.chest).y + 0.5),
      life: 0.9,
      size: 0.5,
      size1: 0.3,
      col: 12123978,
      frame: FRAME.cross,
      glow: 2,
      spin: 2,
    }),
      await o.wait(0.2));
  },
  fires_burn: async (o, e) => {
    e.targets?.[0] && o.element('fire', Mt(e.targets[0]), { k: 0.8 });
  },
  frosts_chill: async (o, e) => {
    e.targets?.[0] && o.element('frost', Mt(e.targets[0]), { k: 0.8 });
  },
  hills_tumble: async (o, e) => {
    e.targets?.[0] && o.element('thunder', e.targets[0].pos.clone().setY(0.4), { k: 0.6 });
  },
  clouds_jaunt: (o, e) => NS(o, e.caster?.pos, e.to || null, 15791359),
  bardic_inspiration: async (o, e) => {
    let t = e.targets?.[0];
    if (!t) return;
    let a = Sa(e),
      n = Mt(t);
    for (let s = 0; s < 5; s++)
      o.after(s * 0.06, () => {
        let i = a
            .clone()
            .lerp(n, 0.5)
            .add(Dn(Rt(-0.6, 0.6), Rt(0.8, 1.6), Rt(-0.6, 0.6))),
          r = new QuadraticBezierCurve3(a.clone(), i, n.clone()),
          l = 0;
        o.stream(0.6, (c) => {
          l = Math.min(1, l + c / 0.55);
          let d = r.getPoint(l);
          o.p({
            p: d,
            life: 0.3,
            size: 0.3,
            size1: 0.14,
            col: s % 2 ? 16769162 : 16774336,
            frame: FRAME.note,
            glow: 2,
            rot: 0,
            a: 0.95,
          });
        });
      });
    (o.fx('launch', { style: 'buff', at: a }),
      await o.wait(0.65),
      o.p({
        p: n.clone().setY(n.y + 0.9),
        v: [0, 0.4, 0],
        life: 1.2,
        size: 0.45,
        col: 16766314,
        frame: FRAME.die,
        glow: 2,
        rot: 0,
      }),
      o.burst(n, { n: 14, col: 16774336, speed: 1.5, life: 0.7, size: 0.1, frame: FRAME.star, glow: 2 }));
  },
  divine_spark: async (o, e) => {
    let t = e.targets?.[0];
    t &&
      (o.beam(Sa(e), Mt(t), { col: 16769162, width: 0.18, life: 0.45, glow: 2.6 }),
      await o.wait(0.08),
      t.ally ? o.heal(t.pos, 8) : o.element('radiant', Mt(t), { k: 1 }));
  },
  turn_undead: async (o, e) => {
    let t = e.caster;
    (o.p({
      p: (t.head || t.chest).clone().setY((t.head || t.chest).y + 0.6),
      life: 1.2,
      size: 0.7,
      size1: 0.9,
      col: 16769162,
      frame: FRAME.ankh,
      glow: 2.4,
      rot: 0,
    }),
      o.ring(t.pos, { color: 16765024, radius: 9, life: 1.1, thick: 0.06, fill: 0.4, glow: 2.2 }),
      o.dome(t.pos, { color: 16773312, radius: 3, life: 0.6, alpha: 0.6 }),
      o.light(t.chest || t.pos, 16766842, 10, 12, 0.9),
      o.fx('area', { style: 'radiant', at: t.pos }),
      await o.wait(0.35));
    for (let a of e.targets || []) o.element('radiant', Mt(a), { k: 0.6 });
  },
  preserve_life: async (o, e) => {
    let t = e.caster;
    o.ring(t.pos, { color: 9437104, radius: 6, life: 0.9, thick: 0.08, fill: 0.5 });
    for (let a of e.targets || []) o.beam(Mt(t), Mt(a), { col: 10289072, width: 0.08, life: 0.5, glow: 2 });
    await o.wait(0.3);
  },
  lands_aid: async (o, e) => {
    for (let t of lr(o, e.cells || [], 10))
      o.after(Rt(0, 0.2), () => {
        (o.burst(t.clone().setY(0.1), {
          n: 8,
          col: 5933610,
          speed: 1,
          up: 2.4,
          life: 0.8,
          size: 0.18,
          frame: FRAME.thorn,
          blend: 'alpha',
          grav: -4,
        }),
          o.element('necrotic', t.clone().setY(0.6), { k: 0.4 }));
      });
    (o.hexwave(e.cells, { color: 6278986, life: 0.9 }),
      o.fx('area', { style: 'nature', at: nn(o, e) }),
      await o.wait(0.3));
  },
  lay_on_hands: async (o, e) => {
    let t = e.targets?.[0] || e.caster,
      a = Sa(e);
    (o.p({ p: a, life: 0.6, size: 0.5, size1: 0.9, col: 16769162, frame: FRAME.glow, glow: 2.4 }),
      o.pillar(t.pos, { color: 16773312, radius: 0.5, height: 3.5, life: 0.7 }),
      await o.wait(0.2));
  },
  breath_weapon: (o, e) => {
    let t = DAMAGE_STYLE[e.dtype] || 'fire';
    if (e.shape === 'line') {
      let a = e.caster,
        s = nn(o, e).clone().sub(a.pos).setY(0).normalize().multiplyScalar(9).add(a.pos).setY(1.2);
      return (
        o.beam(Sa(e), s, {
          col: Jn(t).c,
          width: 0.6,
          life: 0.6,
          mode: t === 'lightning' ? 'bolt' : 'beam',
          glow: 2.4,
        }),
        wc(o, t, e, { origin: a.pos, radius: 4, points: 6, k: 0.5, spread: 0.25 })
      );
    }
    return Lu(o, t, e, { spread: 0.5 });
  },
  move_mark: (o, e) => us(o, 'mark', e, FRAME.cross, { spin: 1 }),
};
const o1 = new Set([
  'bardic_inspiration',
  'divine_spark',
  'turn_undead',
  'preserve_life',
  'lands_aid',
  'lay_on_hands',
  'breath_weapon',
]);

export { FS, OS, o1 };
