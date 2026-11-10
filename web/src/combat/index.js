// combat/index.js
// Reconstruido de publicado/juego.js (módulo __esm «b3»). Nombres locales aún minificados.

import { Vector3 } from 'three';
import { createVfx } from '../vfx/index.js';
import { xc, ds, nt } from '../explore/hex.js';
import { Om } from './overlay.js';
import { Hud } from './hud.js';
import { Controller } from './controller.js';
import { p3 } from './units.js';

function boardBounds(o, e) {
  let t = [
    [0, 0],
    [o.w - 1, 0],
    [0, o.h - 1],
    [o.w - 1, o.h - 1],
  ].map((a) => e(a));
  return {
    minX: Math.min(...t.map((a) => a.x)),
    maxX: Math.max(...t.map((a) => a.x)),
    minZ: Math.min(...t.map((a) => a.z)),
    maxZ: Math.max(...t.map((a) => a.z)),
  };
}
function kH(o, e) {
  if (Array.isArray(o.surprised)) return o.surprised;
  let t = o.surprise;
  return t === !0 || t === 'enemies' || t === 'enemigos'
    ? e.filter((a) => a.team !== 0).map((a) => a.id)
    : t === 'party' || t === 'grupo'
      ? e.filter((a) => a.team === 0).map((a) => a.id)
      : [];
}
async function runBattle(o, e = {}) {
  let { three: t, world: a = null, actors: n = null, init: s } = e;
  if (!s || !s.state) throw new Error('runBattle: falta init.state');
  let i = o.stage,
    r = a?.cellToWorld ? (A) => a.cellToWorld(A, new Vector3()) : (A) => xc(A[0], A[1]),
    l = a?.pick ? (A) => a.pick(A) : null,
    c = s.state.map || { w: 0, h: 0, rows: [] };
  !c.w && c.rows?.length && ((c.h = c.rows.length), (c.w = c.rows[0].length));
  let d = c.w
    ? boardBounds(c, r)
    : a?.bounds
      ? { minX: a.bounds.min.x, maxX: a.bounds.max.x, minZ: a.bounds.min.z, maxZ: a.bounds.max.z }
      : null;
  e.manageWorld && (a?.setGrid?.(0.35), a?.setCombatView?.(!0));
  let u = createVfx({
      scene: t,
      camera: i.camera,
      quality: o.quality || i.quality,
      cellToWorld: r,
      grade: i.grade,
    }),
    h = new Map(),
    p = (A) => {
      let P = h.get(A) || 0;
      return (h.set(A, P + 1), P);
    },
    m =
      e.makeMonster || o.actors?.makeMonster
        ? async (A) => {
            let I = await (
              e.makeMonster || ((U) => o.actors.makeMonster(U.template, { index: p(U.template) }))
            )(A);
            if (I?.root) {
              let U = r(A.cell);
              I.root.position.copy(U);
            }
            return I;
          }
        : null,
    _ = await p3(t, s.state.creatures, n, { cellToWorld: r, makeMissing: m });
  if (a?.cellToWorld) {
    let A = (P, I) => r(ds(P / nt, I / nt)).y;
    for (let P of _.list) P.groundAt = A;
  }
  let b = new Om(t, c, { cellToWorld: r, pick: l });
  await u.prewarm(i.renderer, t);
  let f = e.mount || o.ui?.root || document.body,
    v =
      e.portrait ||
      (o.actors?.portrait ? (A) => o.actors.portrait(A.inner || A.ch || A.id, { size: 96 }) : null),
    x = new Hud(f, { standalone: !1, portrait: v }),
    g = o.ui?.keys,
    y = g ? g.disabled : void 0;
  g && (g.disabled = !0);
  let w = new Controller({
    rules: o.rules,
    stage: i,
    scene: t,
    hud: x,
    units: _,
    board: b,
    vfx: u,
    bus: o.bus,
    init: s,
    cellToWorld: r,
    bounds: d,
    standalone: !1,
    shotMode: o.params?.has?.('captura'),
    surprised: kH(e, s.state.creatures),
    meta: {
      group: e.group,
      groups: e.groups,
      surprise: e.surprise,
      level: e.level,
      auto: e.auto,
      makeForm:
        e.makeForm || (o.actors?.makeMonster ? (A) => o.actors.makeMonster(A, { index: p(A) }) : null),
      skipIntro: !0,
      emitStartEnd: !!e.emitStartEnd,
      ui: o.ui,
    },
  });
  o.params?.has?.('turbo') && (w.turbo = 5);
  let k = o.bus?.on?.('quality:changed', ({ level: A }) => u.setLevel(A));
  o.params?.has?.('depurar') && (window.__combate = { ctl: w, vfx: u, units: _, board: b, hud: x });
  let T = 0,
    E = 0,
    S = performance.now(),
    z = {
      controller: w,
      vfx: u,
      update(A) {
        ((T = performance.now()), D(A));
      },
      afterRender(A) {
        x.place(i.camera, i.renderer.domElement, Math.min(A, 0.1));
      },
    };
  function D(A) {
    ((A = Math.min(A, w.turbo > 1 ? 0.3 : 1 / 20)), _.update(A), w.update(A), u.update(A));
  }
  let M = () => {
    if (!E) return;
    let A = performance.now(),
      P = (A - S) / 1e3;
    ((S = A),
      A - T > 150 && (D(P), x.place(i.camera, i.renderer.domElement, Math.min(P, 0.1))),
      (E = requestAnimationFrame(M)));
  };
  ((E = requestAnimationFrame(M)), (o.battle = z));
  let R;
  try {
    R = await w.run();
  } finally {
    (cancelAnimationFrame(E), (E = 0), k?.(), w.dispose(), b.dispose());
    for (let A of _.list) (A.detach(), A.owns && t.remove(A.root));
    (u.dispose(),
      x.dispose(),
      g && (g.disabled = y),
      e.manageWorld && (a?.setGrid?.(0), a?.setCombatView?.(!1)),
      o.battle === z && (o.battle = null));
  }
  return R;
}

export { Controller } from './controller.js';
export { Hud } from './hud.js';
export { boardBounds, runBattle };
