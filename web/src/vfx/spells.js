// vfx/spells.js
// Coreografía visual de cada conjuro y rasgo de clase. `playSpellFx` elige la coreografía de
// `SPELL_FX` (o una genérica según la ficha del conjuro: proyectil, rayo, toque, cono, área, aura o
// marca) y `playFeatureFx` la de `FEATURE_FX`. Las coreografías reciben `fx`, el director de efectos
// de vfx/index.js (p, burst, beam, ring, dome, pillar, hexwave, projectile, element, light, wait,
// after, stream…), el estilo de styles.js y `ev`, el evento del combate: caster y targets
// (unidades con pos, chest, head, hand), cells, center, dir, hit, crit, phase, dtype…
// Las llama vfx/index.js (métodos spell y feature); combat/controller.js usa SPELL_LIKE_FEATURES.
// Reconstruido de publicado/juego.js (módulo __esm «s1»).

import { QuadraticBezierCurve3, Vector3 } from 'three';
import { FRAME } from './atlas.js';
import { getStyle, DAMAGE_STYLE } from './styles.js';

/** Vector al azar dentro de una esfera de radio `radius`. */
function randInSphere(radius) {
  let x, y, z;
  do ((x = Math.random() * 2 - 1), (y = Math.random() * 2 - 1), (z = Math.random() * 2 - 1));
  while (x * x + y * y + z * z > 1);
  return vec3(x * radius, y * radius, z * radius);
}
/** Punto de salida del conjuro: la mano del lanzador (o su pecho, o su posición). */
function castOrigin(ev) {
  let caster = ev.caster;
  return caster ? (caster.hand || caster.chest || caster.pos).clone() : vec3(0, 1.2, 0);
}
/** Centro del área del evento: `center`, media de sus casillas, primer objetivo o lanzador. */
function areaCenter(fx, ev) {
  if (ev.center) return ev.center.clone();
  if (ev.cells && ev.cells.length) {
    let sum = vec3();
    for (let cell of ev.cells) sum.add(fx.cellToWorld(cell));
    return sum.divideScalar(ev.cells.length);
  }
  return ev.targets && ev.targets[0] ? ev.targets[0].pos.clone() : ev.caster ? ev.caster.pos.clone() : vec3();
}
/** Altura del pecho de una unidad (copia). */
function chestOf(unit) {
  return (unit.chest || unit.pos.clone().setY(unit.pos.y + 1)).clone();
}
/** Posiciones de las casillas; si hay más de `max`, una muestra al azar de `max`. */
function samplePoints(fx, cells, max = 14) {
  let points = cells.map((cell) => fx.cellToWorld(cell));
  if (points.length <= max) return points;
  let picked = [];
  for (let i = 0; i < max; i++) picked.push(points[Math.floor(Math.random() * points.length)]);
  return picked;
}
/** Proyectil del lanzador al primer objetivo; al fallar estalla, más pequeño, donde cae. */
async function projectileSpell(fx, style, ev, opts = {}) {
  let target = ev.targets?.[0];
  if (!target) return;
  let from = castOrigin(ev),
    to = chestOf(target),
    landed = await fx.projectile(style, from, to, {
      speed: opts.speed ?? 15,
      size: opts.size ?? 1,
      miss: ev.hit === !1,
      curve: opts.curve ?? 0,
      arc: opts.arc,
    });
  if (ev.hit === !1) {
    fx.element(style, landed, { k: 0.4 });
    return;
  }
  fx.element(style, to, { k: (opts.k ?? 1) * (ev.crit ? 1.4 : 1) });
}
/** Rayo continuo con núcleo brillante y chispas a lo largo; al fallar se desvía. */
async function raySpell(fx, style, ev, opts = {}) {
  let target = ev.targets?.[0];
  if (!target) return;
  let def = getStyle(style),
    from = castOrigin(ev),
    to = chestOf(target);
  if (ev.hit === !1) {
    let dir = to.clone().sub(from).normalize();
    to = to
      .clone()
      .addScaledVector(dir, 3)
      .add(vec3(randRange(-0.6, 0.6), randRange(-0.3, 0.3), randRange(-0.6, 0.6)));
  }
  (fx.fx('launch', { style, at: from }),
    fx.beam(from, to, {
      col: opts.col ?? def.c,
      width: opts.width ?? 0.2,
      life: opts.life ?? 0.42,
      mode: opts.mode ?? 'beam',
      glow: opts.glow ?? 2,
      jitter: opts.jitter ?? 0.3,
      hot: 0.6,
    }),
    opts.core !== !1 &&
      fx.beam(from, to, {
        col: def.c2,
        width: (opts.width ?? 0.2) * 0.3,
        life: (opts.life ?? 0.42) * 0.8,
        glow: 1.5,
        hot: 0.4,
      }),
    fx.glow(from, def.c, 0.6, 0.2, 2.5),
    fx.light(to, def.c, 7, 6, 0.4));
  let count = Math.round(18 * fx.quality);
  for (let i = 0; i < count; i++) {
    let p = from.clone().lerp(to, Math.random());
    fx.p({
      p: p.add(randInSphere(0.12)),
      v: randInSphere(0.5).setY(randRange(-0.2, 0.4)),
      life: randRange(0.4, 0.8),
      size: randRange(0.06, 0.12),
      size1: 0.02,
      col: def.c2,
      col1: def.c,
      frame: def.p,
      glow: 1.6,
      spin: 3,
      a: 0.9,
    });
  }
  if ((await fx.wait(0.08), ev.hit === !1)) {
    fx.burst(to, { n: 6, col: def.c2, speed: 2, life: 0.3, size: 0.06 });
    return;
  }
  fx.element(style, to, { k: ev.crit ? 1.4 : 0.9 });
}
/** Conjuro de toque: descarga corta (relámpago si es eléctrico) e impacto en el objetivo. */
async function touchSpell(fx, style, ev) {
  let target = ev.targets?.[0];
  if (!target) return;
  let to = chestOf(target),
    from = castOrigin(ev),
    def = getStyle(style);
  if (
    (fx.beam(from, to, {
      col: def.c,
      width: 0.08,
      life: 0.2,
      mode: style === 'lightning' ? 'bolt' : 'beam',
      glow: 3,
    }),
    await fx.wait(0.05),
    ev.hit === !1)
  ) {
    fx.burst(to, { n: 6, col: def.c2, speed: 2, life: 0.3, size: 0.06 });
    return;
  }
  fx.element(style, to, { k: ev.crit ? 1.4 : 1 });
}
/** Anillo e impacto elemental sobre cada objetivo (salvaciones sin área). */
async function targetBurst(fx, style, ev, opts = {}) {
  let def = getStyle(style);
  for (let target of ev.targets || []) {
    let to = chestOf(target);
    (fx.ring(target.pos, { color: def.c, radius: opts.radius ?? 0.8, life: 0.5, thick: 0.2, fill: 0.4 }),
      fx.element(style, to, { k: opts.k ?? 0.9 }));
  }
  await fx.wait(0.12);
}
/** Área: oleada de casillas desde el origen e impactos repartidos según la distancia. */
async function areaWave(fx, style, ev, opts = {}) {
  let def = getStyle(style),
    center = areaCenter(fx, ev),
    cells = ev.cells || [];
  (fx.hexwave(cells, {
    origin: opts.origin ?? center,
    color: def.c,
    life: opts.life ?? 0.9,
    spread: opts.spread ?? 0.3,
    glow: 1.6,
    blend: def.blend || 'add',
  }),
    samplePoints(fx, cells, Math.round((opts.points ?? 10) * fx.quality) + 2).forEach((p, i) =>
      fx.after((opts.spread ?? 0.3) * (p.distanceTo(center) / Math.max(1, opts.radius ?? 3)) + i * 0.01, () =>
        fx.element(style, p.clone().setY(p.y + 0.5), { k: opts.k ?? 0.6 }),
      ),
    ),
    fx.glow(center.clone().setY(center.y + 0.8), def.c2, (opts.radius ?? 3) * 0.9, 0.35, 2.4),
    fx.light(center.clone().setY(center.y + 1.5), def.c, 10, (opts.radius ?? 3) * 3, 0.6),
    fx.fx('area', { style, at: center }),
    await fx.wait(0.15));
}
/** Cono: chorro de partículas desde el lanzador durante `opts.dur` segundos. */
async function coneSpray(fx, style, ev, opts = {}) {
  let def = getStyle(style),
    origin = castOrigin(ev),
    cells = ev.cells || [],
    center = areaCenter(fx, ev),
    dir = (
      ev.dir && ev.dir.lengthSq() > 0 ? vec3(ev.dir.x, 0, ev.dir.z) : center.clone().sub(origin).setY(0)
    ).normalize(),
    reach = Math.max(2.5, ...cells.map((cell) => fx.cellToWorld(cell).distanceTo(origin))),
    spread = opts.spread ?? 0.5,
    colors = opts.colors;
  (fx.fx('area', { style, at: center }),
    fx.light(origin, def.c, 10, reach * 1.5, 0.8),
    fx.stream(opts.dur ?? 0.55, (dt) => {
      let count = Math.max(2, Math.round((opts.rate ?? 160) * dt * fx.quality));
      for (let i = 0; i < count; i++) {
        let v = dir.clone(),
          angle = randRange(-spread, spread);
        (v.applyAxisAngle(vec3(0, 1, 0), angle), (v.y = randRange(-0.08, 0.15)));
        let speed = randRange(reach * 1.2, reach * 2),
          col = colors
            ? colors[Math.floor(Math.random() * colors.length)]
            : Math.random() < 0.4
              ? def.c2
              : def.c;
        (fx.p({
          p: origin.clone().add(randInSphere(0.08)),
          v: v.clone().multiplyScalar(speed),
          life: randRange(0.35, 0.55),
          size: randRange(0.08, 0.16),
          size1: randRange(0.3, 0.55),
          col,
          col1: colors ? col : def.c,
          frame: opts.frame ?? def.p,
          glow: 1.5,
          drag: 1.2,
          grav: style === 'fire' ? 1.5 : 0,
          spin: 3,
          a: 0.75,
        }),
          Math.random() < 0.35 &&
            fx.p({
              p: origin.clone(),
              v: v.clone().multiplyScalar(speed * 1.1),
              life: 0.3,
              size: 0.04,
              col: def.c2,
              frame: FRAME.spark,
              glow: 2.4,
              stretch: 0.05,
              drag: 0.8,
            }));
      }
      style === 'fire' &&
        Math.random() < 0.5 &&
        fx.p({
          p: origin.clone().addScaledVector(dir, reach * 0.5),
          v: dir.clone().multiplyScalar(2).setY(0.8),
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
    fx.hexwave(cells, { origin, color: colors ? colors[0] : def.c, life: 0.9, spread: 0.35, glow: 1.5 }),
    await fx.wait(0.25));
  for (let p of samplePoints(fx, cells, 6))
    fx.after(randRange(0, 0.2), () => fx.element(style, p.clone().setY(p.y + 0.5), { k: 0.45 }));
}
/** Mejora o curación: anillo, lluvia de partículas y brillo sobre cada objetivo (o el lanzador). */
async function buffAura(fx, style, ev, opts = {}) {
  let def = getStyle(style),
    targets = ev.targets?.length ? ev.targets : ev.caster ? [ev.caster] : [];
  for (let target of targets) {
    let top = target.pos.clone().setY(target.pos.y + 2.6);
    (fx.ring(target.pos, { color: def.c, radius: opts.radius ?? 0.85, life: 0.8, thick: 0.18, fill: 0.5 }),
      fx.burst(top, {
        n: 16,
        col: def.c2,
        col1: def.c,
        speed: 0.6,
        up: -2.2,
        life: 0.9,
        size: 0.12,
        size1: 0.03,
        frame: opts.frame ?? def.p,
        glow: 1.8,
        radius: 0.35,
        spin: 3,
        drag: 0.5,
      }),
      fx.p({
        p: chestOf(target),
        life: 0.5,
        size: 0.9,
        size1: 1.3,
        col: def.c,
        frame: FRAME.glow,
        glow: 1.2,
        a: 0.5,
      }));
  }
  (targets[0] && fx.light(chestOf(targets[0]), def.c, 4, 5, 0.6),
    fx.fx('aura_on', { style, at: targets[0]?.pos }),
    await fx.wait(0.35));
}
/** Encantamiento o marca: icono `frame` que baja sobre la cabeza de cada objetivo. */
async function markSpell(fx, style, ev, frame, opts = {}) {
  let def = getStyle(style);
  for (let target of ev.targets || []) {
    let top = (target.head || chestOf(target)).clone().setY((target.head || chestOf(target)).y + 0.4);
    (fx.p({
      p: top.clone().setY(top.y + 0.6),
      v: [0, -1.2, 0],
      life: 0.6,
      size: 0.5,
      size1: 0.35,
      col: def.c2,
      frame,
      glow: 2,
      a: 1,
      a1: 0,
      rot: 0,
      spin: opts.spin ?? 0,
    }),
      fx.ring(target.pos, { color: def.c, radius: 0.9, life: 0.6, thick: 0.2, fill: 0.3 }),
      fx.burst(chestOf(target), {
        n: 12,
        col: def.c2,
        col1: def.c,
        speed: 1.6,
        life: 0.6,
        size: 0.1,
        frame: opts.small ?? FRAME.spark,
        glow: 1.8,
      }));
  }
  (ev.caster &&
    ev.targets?.[0] &&
    opts.link !== !1 &&
    fx.beam(castOrigin(ev), chestOf(ev.targets[0]), { col: def.c, width: 0.06, life: 0.35, glow: 2.4 }),
    await fx.wait(0.3));
}
/** Bocanada de niebla al desaparecer en `from` y al aparecer en `to`. */
async function teleportPuff(fx, from, to, color = 14674175) {
  for (let p of [from, to])
    p &&
      (fx.burst(p.clone().setY(p.y + 0.8), {
        n: 20,
        col: color,
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
      fx.burst(p.clone().setY(p.y + 0.8), {
        n: 12,
        col: 16777215,
        speed: 2,
        life: 0.5,
        size: 0.06,
        glow: 2,
      }));
  (fx.fx('teleport', { at: to || from }), await fx.wait(0.1));
}
/** Efecto añadido a un golpe (castigos, golpe enredador): columna, onda u hojas. */
async function smiteRider(fx, style, ev) {
  for (let target of ev.targets || []) {
    let def = getStyle(style);
    (style === 'radiant' &&
      fx.pillar(target.pos, { color: 16769162, radius: 0.7, height: 6, life: 0.6, drop: 0.12 }),
      style === 'thunder' &&
        fx.ring(target.pos, { color: def.c, radius: 2.4, life: 0.45, thick: 0.15, fill: 0.6 }),
      style === 'nature' &&
        fx.burst(target.pos.clone().setY(0.1), {
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
      fx.element(style, chestOf(target), { k: 1.3 }),
      fx.light(chestOf(target), def.c, 10, 7, 0.5));
  }
  await fx.wait(0.12);
}
/**
 * Reproduce la coreografía del conjuro `spellId` (`def`: su ficha de datos/efectos/conjuros.json;
 * a = tipo de ataque, sh = forma, sz = tamaño, h = curación, r = añadido a un golpe) para la fase
 * `ev.phase` (cast, attack, dart, burst, rider, teleport).
 */
async function playSpellFx(fx, spellId, def, style, ev) {
  let phase = ev.phase || 'cast';
  if (phase === 'rider' || def.r)
    return phase === 'rider' ? smiteRider(fx, SMITE_STYLES[spellId] || style, ev) : null;
  if (phase === 'dart') {
    let target = ev.targets?.[0];
    if (!target) return null;
    let to = chestOf(target);
    return (
      await fx.projectile('missile', castOrigin(ev).add(randInSphere(0.25)), to, {
        speed: 13,
        size: 0.8,
        curve: randRange(-1.2, 1.2),
        arc: randRange(0.3, 1.3),
      }),
      fx.element('missile', to, { k: 0.55 }),
      null
    );
  }
  if (phase === 'burst') {
    let burstStyle = style === 'nature' ? 'nature' : style;
    if (burstStyle === 'nature')
      for (let p of samplePoints(fx, ev.cells || [], 10))
        fx.burst(p.clone().setY(0.6), {
          n: 8,
          col: 9424992,
          speed: 3,
          life: 0.5,
          size: 0.14,
          frame: FRAME.thorn,
          spin: 8,
          grav: -6,
        });
    return areaWave(fx, burstStyle, ev, { radius: 1.5, points: 4, k: 0.5, spread: 0.1 });
  }
  let choreo = SPELL_FX[spellId];
  return choreo
    ? choreo(fx, style, ev)
    : phase === 'attack'
      ? def.a === 'melee'
        ? touchSpell(fx, style, ev)
        : projectileSpell(fx, style, ev)
      : def.a
        ? null
        : def.sh === 'cone'
          ? coneSpray(fx, style, ev)
          : ev.cells && ev.cells.length
            ? areaWave(fx, style, ev, { radius: Math.max(1.5, ((def.sz || 10) / 5) * 0.75) })
            : def.h || style === 'heal'
              ? buffAura(fx, 'heal', ev)
              : ['buff', 'wind', 'nature', 'arcane', 'radiant'].includes(style) ||
                  (ev.targets || []).every((target) => target.ally)
                ? buffAura(fx, style, ev)
                : ev.targets && ev.targets.length
                  ? targetBurst(fx, style, ev)
                  : buffAura(fx, style, { ...ev, targets: ev.caster ? [ev.caster] : [] });
}
/** Estallido de furia alrededor del lanzador (furia, ataque temerario…), con temblor de cámara. */
async function furyBurst(fx, ev, color = 16726554) {
  let caster = ev.caster;
  (fx.ring(caster.pos, { color, radius: 2.2, life: 0.5, thick: 0.2, fill: 0.5 }),
    fx.burst(caster.chest || caster.pos, {
      n: 26,
      col: 16756832,
      col1: color,
      speed: 3,
      up: 1.5,
      life: 0.8,
      size: 0.06,
      stretch: 0.05,
      glow: 2.5,
      grav: -1,
    }),
    fx.light(caster.chest || caster.pos, color, 8, 6, 0.6),
    fx.shake(0.006, 0.25),
    await fx.wait(0.2));
}
/** Columna de chispas que sube desde los pies y emblema `frame` (rasgos de poder). */
async function powerSurge(fx, ev, color = 16766314, frame = FRAME.star) {
  let caster = ev.caster;
  (fx.ring(caster.pos, { color, radius: 1.2, life: 0.6, thick: 0.25, fill: 0.6 }),
    fx.stream(0.45, (dt) => {
      let count = Math.max(1, Math.round(60 * dt * fx.quality));
      for (let i = 0; i < count; i++) {
        let angle = Math.random() * Math.PI * 2;
        fx.p({
          p: [
            caster.pos.x + Math.cos(angle) * 0.45,
            caster.pos.y + randRange(0, 0.3),
            caster.pos.z + Math.sin(angle) * 0.45,
          ],
          v: [0, randRange(3, 5), 0],
          life: 0.45,
          size: 0.06,
          stretch: 0.08,
          col: color,
          frame: FRAME.spark,
          glow: 2.4,
        });
      }
    }),
    fx.p({
      p: caster.chest || caster.pos,
      life: 0.5,
      size: 0.8,
      size1: 1.4,
      col: color,
      frame,
      glow: 2,
      rot: 0,
    }),
    fx.light(caster.chest || caster.pos, color, 6, 5, 0.5),
    await fx.wait(0.25));
}
/** Remolino de viento alrededor del lanzador (segundo aliento, paso del viento…). */
async function windSwirl(fx, ev) {
  let caster = ev.caster;
  (fx.stream(0.5, (dt, progress, elapsed) => {
    let count = Math.max(1, Math.round(40 * dt * fx.quality));
    for (let i = 0; i < count; i++) {
      let angle = elapsed * 10 + Math.random() * 6.28;
      fx.p({
        p: [
          caster.pos.x + Math.cos(angle) * 0.55,
          caster.pos.y + randRange(0.05, 1.2),
          caster.pos.z + Math.sin(angle) * 0.55,
        ],
        v: [-Math.sin(angle) * 3, 0.6, Math.cos(angle) * 3],
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
    await fx.wait(0.15));
}
/** Reproduce la coreografía del rasgo `featureId` (o un destello genérico si no tiene). */
async function playFeatureFx(fx, featureId, ev) {
  let choreo = FEATURE_FX[featureId];
  return choreo ? choreo(fx, ev) : ev.caster ? powerSurge(fx, ev, 16766314, FRAME.star) : null;
}
/** Atajo de `new Vector3`. */
const vec3 = (x = 0, y = 0, z = 0) => new Vector3(x, y, z);
/** Número al azar en [min, max). */
const randRange = (min, max) => min + Math.random() * (max - min);
// Coreografías propias de cada conjuro: (fx, style, ev) => promesa o null (null = usar la genérica).
const SPELL_FX = {
  fire_bolt: (fx, style, ev) =>
    ev.phase === 'attack' ? projectileSpell(fx, 'fire', ev, { speed: 15, size: 1.4 }) : null,
  produce_flame_hurl: (fx, style, ev) =>
    ev.phase === 'attack' ? projectileSpell(fx, 'fire', ev, { speed: 14, size: 0.9, arc: 0.6 }) : null,
  starry_wisp: (fx, style, ev) =>
    ev.phase === 'attack' ? projectileSpell(fx, 'radiant', ev, { speed: 18, size: 0.7, curve: 0.4 }) : null,
  chill_touch: (fx, style, ev) =>
    ev.phase === 'attack' ? projectileSpell(fx, 'necrotic', ev, { speed: 11, size: 0.9, curve: -0.3 }) : null,
  sorcerous_burst: (fx, style, ev) =>
    ev.phase === 'attack' ? projectileSpell(fx, style, ev, { speed: 16, size: 1 }) : null,
  chromatic_orb: (fx, style, ev) =>
    ev.phase === 'attack' ? projectileSpell(fx, style, ev, { speed: 13, size: 1.25, arc: 0.4 }) : null,
  guiding_bolt: async (fx, style, ev) => {
    ev.phase === 'attack' &&
      (await projectileSpell(fx, 'radiant', ev, { speed: 20, size: 1.3 }),
      ev.hit !== !1 &&
        ev.targets?.[0] &&
        fx.pillar(ev.targets[0].pos, { color: 16769162, radius: 0.5, height: 3, life: 0.5 }));
  },
  ray_of_frost: (fx, style, ev) =>
    ev.phase === 'attack' ? raySpell(fx, 'frost', ev, { width: 0.22, life: 0.5, glow: 1.3 }) : null,
  eldritch_blast: (fx, style, ev) =>
    ev.phase === 'attack'
      ? raySpell(fx, 'eldritch', ev, { width: 0.26, life: 0.4, mode: 'bolt', jitter: 0.18 })
      : null,
  scorching_ray: (fx, style, ev) =>
    ev.phase === 'attack' ? raySpell(fx, 'fire', ev, { width: 0.18, life: 0.35 }) : null,
  ray_of_sickness: (fx, style, ev) =>
    ev.phase === 'attack' ? raySpell(fx, 'poison', ev, { width: 0.2, life: 0.5 }) : null,
  shocking_grasp: (fx, style, ev) => (ev.phase === 'attack' ? touchSpell(fx, 'lightning', ev) : null),
  inflict_wounds: (fx, style, ev) => (ev.phase === 'attack' ? touchSpell(fx, 'necrotic', ev) : null),
  flame_blade_strike: (fx, style, ev) => {
    if (ev.phase !== 'attack' || !ev.targets?.[0]) return null;
    let to = chestOf(ev.targets[0]);
    return (
      fx.slash(to, { color: 16747050, size: 1.4, life: 0.3, glow: 3 }),
      ev.hit !== !1 && fx.element('fire', to, { k: ev.crit ? 1.3 : 0.8 }),
      fx.wait(0.05)
    );
  },
  ice_knife: async (fx, style, ev) => {
    if (ev.phase !== 'attack' || !ev.targets?.[0]) return;
    let from = castOrigin(ev),
      to = chestOf(ev.targets[0]);
    fx.burst(from, { n: 8, col: 15268607, speed: 1, life: 0.3, size: 0.06, frame: FRAME.flake });
    let landed = await fx.projectile('frost', from, to, { speed: 22, size: 0.6, miss: ev.hit === !1 });
    fx.burst(landed, {
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
  acid_arrow: async (fx, style, ev) => {
    if (ev.phase !== 'attack' || !ev.targets?.[0]) return;
    let to = chestOf(ev.targets[0]),
      landed = await fx.projectile('acid', castOrigin(ev), to, {
        speed: 18,
        size: 0.7,
        arc: 0.5,
        miss: ev.hit === !1,
      });
    fx.element('acid', ev.hit === !1 ? landed : to, { k: ev.hit === !1 ? 0.6 : 1 });
  },
  spiritual_weapon: (fx, style, ev) => (
    ev.phase === 'attack' &&
      ev.targets?.[0] &&
      ev.hit !== !1 &&
      fx.element('force', chestOf(ev.targets[0]), { k: ev.crit ? 1.3 : 0.8 }),
    null
  ),
  sacred_flame: async (fx, style, ev) => {
    for (let target of ev.targets || [])
      (fx.pillar(target.pos, { color: 16765040, radius: 0.5, height: 6, life: 0.85, drop: 0.16 }),
        fx.after(0.12, () => {
          (fx.element('radiant', chestOf(target), { k: 0.9 }),
            fx.burst(target.pos.clone().setY(target.pos.y + 0.1), {
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
    (fx.fx('area', { style: 'radiant', at: ev.targets?.[0]?.pos }), await fx.wait(0.18));
  },
  toll_the_dead: async (fx, style, ev) => {
    for (let target of ev.targets || []) {
      let top = target.pos.clone().setY(target.pos.y + 2.4);
      fx.p({
        p: top,
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
      for (let i = 0; i < 3; i++)
        fx.after(i * 0.16, () =>
          fx.ring(chestOf(target), {
            color: 9067208,
            radius: 1 + i * 0.5,
            life: 0.6,
            thick: 0.1,
            vertical: fx.camera.position.clone().sub(chestOf(target)),
            y: 0,
          }),
        );
      fx.after(0.15, () => fx.element('necrotic', chestOf(target), { k: 0.9 }));
    }
    (fx.fx('area', { style: 'necrotic', at: ev.targets?.[0]?.pos }), await fx.wait(0.2));
  },
  vicious_mockery: async (fx, style, ev) => {
    let target = ev.targets?.[0];
    if (!target) return;
    let from = ev.caster ? ev.caster.head || castOrigin(ev) : chestOf(target),
      to = target.head || chestOf(target),
      dir = to.clone().sub(from);
    for (let i = 0; i < 5; i++)
      fx.after(i * 0.06, () => {
        let f = 0.15 + i * 0.2,
          pos = from.clone().lerp(to, f);
        fx.ring(pos, {
          color: 16743128,
          radius: 0.3 + i * 0.16,
          life: 0.45,
          thick: 0.3,
          vertical: dir,
          y: 0,
        });
      });
    for (let i = 0; i < Math.round(10 * fx.quality) + 4; i++)
      fx.after(i * 0.025, () =>
        fx.p({
          p: from.clone().add(randInSphere(0.1)),
          v: dir.clone().multiplyScalar(randRange(2.2, 3)).add(randInSphere(0.6)),
          life: 0.4,
          size: randRange(0.16, 0.24),
          col: 16756968,
          frame: Math.random() < 0.3 ? FRAME.skull : FRAME.note,
          glow: 1.8,
          drag: 1.5,
          rot: randRange(-0.4, 0.4),
          a: 0.95,
        }),
      );
    (await fx.wait(0.3),
      fx.burst(to, {
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
      fx.p({
        p: to.clone().setY(to.y + 0.5),
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
      fx.element('psychic', chestOf(target), { k: 0.8 }));
  },
  mind_spike: async (fx, style, ev) => {
    let target = ev.targets?.[0];
    target &&
      (fx.beam(castOrigin(ev), target.head || chestOf(target), {
        col: 16739024,
        width: 0.07,
        life: 0.3,
        glow: 3,
      }),
      await fx.wait(0.06),
      fx.element('psychic', target.head || chestOf(target), { k: 1 }));
  },
  dissonant_whispers: async (fx, style, ev) => {
    for (let target of ev.targets || []) {
      let head = target.head || chestOf(target);
      for (let i = 0; i < 4; i++)
        fx.after(i * 0.1, () =>
          fx.ring(head, {
            color: 12607743,
            radius: 0.5 + i * 0.25,
            life: 0.5,
            thick: 0.18,
            vertical: fx.camera.position.clone().sub(head),
            y: 0,
          }),
        );
      fx.burst(head, {
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
    await fx.wait(0.3);
  },
  poison_spray: async (fx, style, ev) => {
    let target = ev.targets?.[0];
    if (!target) return;
    let from = castOrigin(ev),
      to = chestOf(target),
      dir = to.clone().sub(from),
      missed = ev.hit === !1;
    (fx.stream(0.4, (dt) => {
      let count = Math.max(2, Math.round(150 * dt * fx.quality));
      for (let i = 0; i < count; i++) {
        let vel = dir
          .clone()
          .normalize()
          .add(randInSphere(0.16))
          .normalize()
          .multiplyScalar(dir.length() * randRange(1.7, 2.5));
        (fx.p({
          p: from,
          v: vel,
          life: randRange(0.45, 0.6),
          size: 0.14,
          size1: randRange(0.6, 0.9),
          col: 11591776,
          col1: 4880922,
          frame: FRAME.smoke,
          blend: 'alpha',
          a: 0.55,
          drag: 1.5,
        }),
          Math.random() < 0.4 &&
            fx.p({
              p: from.clone().add(randInSphere(0.05)),
              v: vel.clone().multiplyScalar(1.05),
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
      await fx.wait(0.25));
    let cloudPos = missed ? to.clone().addScaledVector(dir.clone().normalize(), 1.2) : to;
    for (let i = 0; i < 6; i++)
      fx.p({
        p: cloudPos.clone().add(randInSphere(0.35)),
        v: randInSphere(0.3).setY(0.25),
        life: randRange(1.1, 1.6),
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
    missed || fx.element('poison', to, { k: 1 });
  },
  thorn_whip: async (fx, style, ev) => {
    let target = ev.targets?.[0];
    if (!target) return;
    let from = castOrigin(ev),
      to = chestOf(target),
      mid = from
        .clone()
        .lerp(to, 0.5)
        .add(vec3(0, 0.8, 0)),
      curve = new QuadraticBezierCurve3(from, mid, to);
    (fx.ribbon(curve.getPoints(16), { col: 6278986, width: 0.09, life: 0.45, glow: 1.4 }),
      await fx.wait(0.12),
      ev.hit !== !1 &&
        (fx.element('nature', to, { k: 0.8 }),
        fx.burst(to, { n: 8, col: 9424992, speed: 3, life: 0.4, size: 0.12, frame: FRAME.thorn, spin: 6 })));
  },
  hellish_rebuke: async (fx, style, ev) => {
    for (let target of ev.targets || [])
      (fx.stream(0.6, (dt) => {
        let count = Math.max(1, Math.round(70 * dt * fx.quality));
        for (let i = 0; i < count; i++) {
          let angle = Math.random() * Math.PI * 2;
          fx.p({
            p: [
              target.pos.x + Math.cos(angle) * 0.35,
              target.pos.y + randRange(0, 0.4),
              target.pos.z + Math.sin(angle) * 0.35,
            ],
            v: [0, randRange(2, 3.5), 0],
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
        fx.after(0.1, () => fx.element('fire', chestOf(target), { k: 0.9 })));
    await fx.wait(0.2);
  },
  word_of_radiance: async (fx, style, ev) => {
    let caster = ev.caster;
    (fx.glow(caster.chest || caster.pos, 16773312, 2.5, 0.3, 3),
      fx.ring(caster.pos, { color: 16765024, radius: 2.6, life: 0.6, thick: 0.18, fill: 0.8 }),
      fx.burst(caster.chest || caster.pos, {
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
      await areaWave(fx, 'radiant', ev, { radius: 2, points: 4, k: 0.5, spread: 0.15, origin: caster.pos }));
  },
  thunderclap: async (fx, style, ev) => {
    let caster = ev.caster;
    (fx.ring(caster.pos, { color: 12103935, radius: 3, life: 0.45, thick: 0.12, fill: 0.5 }),
      fx.dome(caster.pos, { color: 15131391, radius: 2.2, life: 0.35, alpha: 0.6 }),
      fx.burst(caster.pos.clone().setY(0.3), {
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
      fx.shake(0.01, 0.35),
      fx.fx('area', { style: 'thunder', at: caster.pos }),
      fx.hexwave(ev.cells, { origin: caster.pos, color: 11051263, life: 0.6, spread: 0.15 }),
      await fx.wait(0.1));
  },
  arms_of_hadar: async (fx, style, ev) => {
    let caster = ev.caster;
    fx.ring(caster.pos, { color: 6961824, radius: 4, life: 0.8, thick: 0.25, fill: 1 });
    for (let p of samplePoints(fx, ev.cells || [], 12))
      fx.after(randRange(0, 0.2), () => {
        (fx.burst(p.clone().setY(0.2), {
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
          fx.beam(
            p.clone().setY(0),
            p.clone().add(vec3(randRange(-0.3, 0.3), randRange(1.4, 2.2), randRange(-0.3, 0.3))),
            {
              col: 9067208,
              width: 0.08,
              life: 0.5,
              mode: 'bolt',
              jitter: 0.3,
              glow: 2,
            },
          ));
      });
    (fx.fx('area', { style: 'necrotic', at: caster.pos }),
      fx.hexwave(ev.cells, { origin: caster.pos, color: 6961824, life: 0.9, spread: 0.2 }),
      await fx.wait(0.3));
  },
  acid_splash: async (fx, style, ev) => {
    let center = areaCenter(fx, ev);
    (await fx.projectile('acid', castOrigin(ev), center.clone().setY(center.y + 0.4), {
      speed: 12,
      size: 1,
      arc: 1.2,
    }),
      fx.burst(center.clone().setY(center.y + 0.3), {
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
      await areaWave(fx, 'acid', ev, { radius: 1.5, points: 3, k: 0.6, spread: 0.1 }));
  },
  sleep: async (fx, style, ev) => {
    let center = areaCenter(fx, ev);
    (fx.hexwave(ev.cells, { origin: center, color: 10259711, life: 1.6, spread: 0.4, glow: 1.2 }),
      fx.stream(1.1, (dt) => {
        let count = Math.max(1, Math.round(50 * dt * fx.quality));
        for (let i = 0; i < count; i++) {
          let p = center.clone().add(vec3(randRange(-1.9, 1.9), randRange(2.2, 3.2), randRange(-1.9, 1.9)));
          fx.p({
            p,
            v: [randRange(-0.2, 0.2), randRange(-1.4, -0.8), randRange(-0.2, 0.2)],
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
      fx.fx('area', { style: 'sleep', at: center }),
      fx.light(center.clone().setY(2), 10259711, 5, 8, 1.4),
      await fx.wait(0.6));
  },
  thunderwave: async (fx, style, ev) => {
    let caster = ev.caster,
      center = areaCenter(fx, ev),
      dir = center.clone().sub(caster.pos).setY(0).normalize();
    for (let i = 0; i < 3; i++)
      fx.after(i * 0.07, () => {
        let p = caster.pos
          .clone()
          .addScaledVector(dir, 0.8 + i * 1.2)
          .setY(1);
        fx.ring(p, {
          color: 13156607,
          radius: 1.2 + i * 0.6,
          life: 0.4,
          thick: 0.15,
          vertical: dir,
          y: 0,
          glow: 2.4,
        });
      });
    (fx.burst(center.clone().setY(0.3), {
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
      dir,
      cone: 0.8,
    }),
      fx.hexwave(ev.cells, { origin: caster.pos, color: 11051263, life: 0.7, spread: 0.2 }),
      fx.shake(0.012, 0.4),
      fx.fx('area', { style: 'thunder', at: center }),
      await fx.wait(0.18));
  },
  burning_hands: (fx, style, ev) => coneSpray(fx, 'fire', ev, { spread: 0.55, rate: 180 }),
  color_spray: (fx, style, ev) =>
    coneSpray(fx, 'color', ev, {
      spread: 0.55,
      rate: 140,
      frame: FRAME.star,
      colors: [16734810, 16760896, 16773216, 6356864, 6340863, 12611839],
    }),
  dragons_breath_exhale: (fx, style, ev) =>
    coneSpray(fx, DAMAGE_STYLE[ev.dtype] || 'fire', ev, { spread: 0.5 }),
  shatter: async (fx, style, ev) => {
    let center = areaCenter(fx, ev),
      top = center.clone().setY(center.y + 1);
    (fx.glow(top, 16777215, 2.5, 0.2, 3.5),
      fx.dome(center, { color: 14207231, radius: 3.2, life: 0.5, alpha: 0.5, half: !0 }),
      fx.ring(center, { color: 12624127, radius: 4, life: 0.6, thick: 0.12, fill: 0.6 }),
      fx.burst(top, {
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
      fx.shake(0.014, 0.45),
      await areaWave(fx, 'shatter', ev, { radius: 3, points: 5, k: 0.5, spread: 0.12 }));
  },
  faerie_fire: async (fx, style, ev) => {
    let center = areaCenter(fx, ev);
    fx.hexwave(ev.cells, { origin: center, color: 11567359, life: 1.4, spread: 0.3 });
    for (let p of samplePoints(fx, ev.cells || [], 16))
      fx.burst(p.clone().setY(p.y + 0.6), {
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
    (fx.fx('area', { style: 'faerie', at: center }), await fx.wait(0.3));
  },
  hail_of_thorns: () => null,
  spider_web: async (fx, style, ev) => {
    let target = ev.targets?.[0];
    if (!target) return;
    let from = ev.caster ? (ev.caster.head || ev.caster.chest).clone() : chestOf(target).add(vec3(0, 2, 0));
    (await fx.projectile('web', from, chestOf(target), { speed: 11, size: 0.7, arc: 0.6 }),
      fx.burst(chestOf(target), {
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
      fx.fx('area', { style: 'web', at: target.pos }));
  },
  entangle: async (fx, style, ev) => {
    let center = areaCenter(fx, ev);
    for (let p of samplePoints(fx, ev.cells || [], 16))
      fx.after(randRange(0, 0.3), () =>
        fx.burst(p.clone().setY(0.1), {
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
    (fx.fx('area', { style: 'nature', at: center }), await fx.wait(0.35));
  },
  web: async (fx, style, ev) => {
    let center = areaCenter(fx, ev);
    (await fx.projectile('web', castOrigin(ev), center.clone().setY(center.y + 0.6), {
      speed: 14,
      size: 0.6,
      arc: 0.8,
    }),
      fx.burst(center.clone().setY(0.8), {
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
      fx.fx('area', { style: 'web', at: center }));
  },
  fog_cloud: async (fx, style, ev) => {
    let center = areaCenter(fx, ev);
    (fx.burst(center.clone().setY(0.6), {
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
      fx.fx('area', { style: 'fog', at: center }),
      await fx.wait(0.3));
  },
  darkness: async (fx, style, ev) => {
    let center = areaCenter(fx, ev);
    (fx.burst(center.clone().setY(1), {
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
      fx.fx('area', { style: 'darkness', at: center }),
      await fx.wait(0.3));
  },
  grease: async (fx, style, ev) => {
    let center = areaCenter(fx, ev);
    (fx.burst(center.clone().setY(1.2), {
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
      fx.fx('area', { style: 'grease', at: center }),
      await fx.wait(0.3));
  },
  spike_growth: async (fx, style, ev) => {
    let center = areaCenter(fx, ev);
    for (let p of samplePoints(fx, ev.cells || [], 16))
      fx.after(randRange(0, 0.3), () =>
        fx.burst(p.clone().setY(0.05), {
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
    (fx.fx('area', { style: 'nature', at: center }), await fx.wait(0.3));
  },
  moonbeam: async (fx, style, ev) => {
    let center = areaCenter(fx, ev);
    (fx.pillar(center, {
      color: 11060479,
      radius: 1.3,
      height: 9,
      life: 0.9,
      drop: 0.25,
      alpha: 0.55,
      glow: 1.1,
    }),
      fx.light(center.clone().setY(2), 13623551, 8, 8, 0.9),
      fx.fx('area', { style: 'moon', at: center }),
      await fx.wait(0.25));
    for (let target of ev.targets || []) fx.element('radiant', chestOf(target), { k: 0.7 });
  },
  flaming_sphere: async (fx, style, ev) => {
    let pos = ev.cell ? fx.cellToWorld(ev.cell) : areaCenter(fx, ev);
    (fx.burst(pos.clone().setY(0.5), {
      n: 30,
      col: 16765562,
      col1: 16726536,
      speed: 3,
      life: 0.6,
      size: 0.3,
      frame: FRAME.flame,
      glow: 2,
    }),
      await fx.wait(0.1));
  },
  cure_wounds: async (fx, style, ev) => {
    let target = ev.targets?.[0];
    if (!target) return;
    let from = castOrigin(ev);
    (fx.p({ p: from, life: 0.5, size: 0.4, size1: 0.8, col: 10289072, frame: FRAME.glow, glow: 2.2 }),
      fx.beam(from, chestOf(target), { col: 10289072, width: 0.08, life: 0.35, glow: 2 }),
      await fx.wait(0.15));
  },
  healing_word: async (fx, style, ev) => {
    let target = ev.targets?.[0];
    if (!target) return;
    let from = castOrigin(ev),
      to = chestOf(target);
    (await fx.projectile('heal', from, to, { speed: 12, size: 0.6, arc: 0.8 }),
      fx.p({
        p: to.clone().setY(to.y + 0.6),
        v: [0, 0.6, 0],
        life: 0.9,
        size: 0.45,
        col: 16774336,
        frame: FRAME.note,
        glow: 2,
        rot: 0,
      }));
  },
  spare_the_dying: (fx, style, ev) => buffAura(fx, 'heal', ev, { radius: 0.7 }),
  lesser_restoration: (fx, style, ev) => buffAura(fx, 'heal', ev),
  bless: (fx, style, ev) => buffAura(fx, 'buff', ev),
  aid: (fx, style, ev) => buffAura(fx, 'buff', ev, { radius: 1 }),
  heroism: (fx, style, ev) => buffAura(fx, 'buff', ev, { frame: FRAME.sun }),
  guidance: (fx, style, ev) => buffAura(fx, 'buff', ev, { radius: 0.6, frame: FRAME.star }),
  bane: (fx, style, ev) => markSpell(fx, 'curse', ev, FRAME.skull, { link: !1 }),
  shield_of_faith: async (fx, style, ev) => {
    for (let target of ev.targets || [])
      fx.dome(target.pos, { color: 16766314, radius: 1, life: 0.9, alpha: 0.7, grow: !0, hex: 1 });
    await buffAura(fx, 'buff', ev, { frame: FRAME.shield });
  },
  sanctuary: async (fx, style, ev) => {
    for (let target of ev.targets || [])
      fx.dome(target.pos, { color: 16315647, radius: 1.1, life: 1, alpha: 0.6 });
    await buffAura(fx, 'buff', ev, { frame: FRAME.ankh });
  },
  protection_from_evil_and_good: (fx, style, ev) => buffAura(fx, 'radiant', ev, { frame: FRAME.ankh }),
  warding_bond: async (fx, style, ev) => {
    let target = ev.targets?.[0];
    (target &&
      ev.caster &&
      fx.beam(chestOf(ev.caster), chestOf(target), { col: 16766314, width: 0.06, life: 0.9, glow: 2 }),
      await buffAura(fx, 'buff', ev, { frame: FRAME.chain }));
  },
  mage_armor: async (fx, style, ev) => {
    for (let target of ev.targets?.length ? ev.targets : [ev.caster])
      target && fx.dome(target.pos, { color: 9416959, radius: 0.9, life: 0.8, alpha: 0.6, hex: 1 });
    await fx.wait(0.2);
  },
  armor_of_agathys: async (fx, style, ev) => {
    let caster = ev.caster;
    (fx.dome(caster.pos, { color: 10477823, radius: 1, life: 1, alpha: 0.8, hex: 1 }),
      fx.burst(caster.chest || caster.pos, {
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
      await fx.wait(0.25));
  },
  false_life: async (fx, style, ev) => {
    let caster = ev.caster;
    for (let i = 0; i < Math.round(26 * fx.quality); i++) {
      let offset = randInSphere(1.4);
      ((offset.y = Math.abs(offset.y)),
        fx.p({
          p: (caster.chest || caster.pos).clone().add(offset),
          v: offset.clone().multiplyScalar(-2),
          life: 0.5,
          size: 0.1,
          size1: 0.03,
          col: 10289050,
          col1: 6961824,
          frame: FRAME.spark,
          glow: 1.8,
        }));
    }
    (fx.after(0.4, () => fx.glow(caster.chest || caster.pos, 9067208, 1.2, 0.3, 2)), await fx.wait(0.45));
  },
  divine_favor: (fx, style, ev) => buffAura(fx, 'radiant', ev, { radius: 0.7 }),
  shield: async (fx, style, ev) => {
    let caster = ev.caster,
      pos = (caster.chest || caster.pos).clone().addScaledVector(caster.fwd || vec3(0, 0, 1), 0.45);
    (fx.ring(pos, {
      color: 10471679,
      radius: 0.9,
      life: 0.5,
      thick: 0.35,
      fill: 1,
      vertical: caster.fwd || vec3(0, 0, 1),
      y: 0,
      glow: 2.4,
    }),
      fx.p({ p: pos, life: 0.5, size: 1.4, size1: 1.6, col: 10471679, frame: FRAME.sigil, glow: 2, rot: 0 }),
      fx.p({
        p: pos,
        life: 0.6,
        size: 0.6,
        size1: 0.75,
        col: 14741759,
        frame: FRAME.shield,
        glow: 2.2,
        rot: 0,
      }),
      fx.fx('shield', { at: pos }),
      await fx.wait(0.15));
  },
  misty_step: async (fx, style, ev) => {
    ev.phase === 'teleport'
      ? await teleportPuff(fx, ev.caster?.pos, ev.cell ? fx.cellToWorld(ev.cell) : null)
      : fx.burst((ev.caster?.chest || vec3()).clone(), {
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
  expeditious_retreat: (fx, style, ev) => buffAura(fx, 'wind', ev, { frame: FRAME.swirl }),
  longstrider: (fx, style, ev) => buffAura(fx, 'wind', ev, { frame: FRAME.feather }),
  barkskin: (fx, style, ev) => buffAura(fx, 'nature', ev, { frame: FRAME.leaf }),
  invisibility: async (fx, style, ev) => {
    for (let target of ev.targets || [])
      fx.burst(chestOf(target), {
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
    await fx.wait(0.3);
  },
  blur: async (fx, style, ev) => {
    let caster = ev.caster;
    (fx.burst(caster.chest || caster.pos, {
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
      await fx.wait(0.25));
  },
  mirror_image: async (fx, style, ev) => {
    let caster = ev.caster;
    (fx.burst(caster.chest || caster.pos, {
      n: 26,
      col: 12628223,
      speed: 2.2,
      life: 0.7,
      size: 0.1,
      frame: FRAME.star,
      glow: 2,
      flat: !0,
    }),
      await fx.wait(0.25));
  },
  magic_weapon: (fx, style, ev) => buffAura(fx, 'arcane', ev, { radius: 0.6, frame: FRAME.sword }),
  enlarge_reduce: (fx, style, ev) => buffAura(fx, 'arcane', ev, { radius: 1.1, frame: FRAME.star }),
  true_strike: (fx, style, ev) => buffAura(fx, 'radiant', ev, { radius: 0.6, frame: FRAME.cross }),
  shillelagh: (fx, style, ev) => buffAura(fx, 'nature', ev, { radius: 0.6 }),
  produce_flame: async (fx, style, ev) => {
    let from = castOrigin(ev);
    (fx.burst(from, {
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
      await fx.wait(0.1));
  },
  flame_blade: async (fx, style, ev) => {
    let from = castOrigin(ev);
    (fx.burst(from, {
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
      fx.light(from, 16742954, 6, 5, 0.6),
      await fx.wait(0.15));
  },
  dragons_breath: (fx, style, ev) => buffAura(fx, DAMAGE_STYLE[ev.dtype] || 'fire', ev),
  command: (fx, style, ev) => markSpell(fx, 'command', ev, FRAME.rune),
  charm_person: (fx, style, ev) => markSpell(fx, 'charm', ev, FRAME.heart, { small: FRAME.heart }),
  suggestion: (fx, style, ev) => markSpell(fx, 'charm', ev, FRAME.spiral, { spin: 4 }),
  hideous_laughter: (fx, style, ev) =>
    markSpell(fx, 'psychic', ev, FRAME.spiral, { spin: 6, small: FRAME.note }),
  hold_person: (fx, style, ev) => markSpell(fx, 'command', ev, FRAME.chain),
  blindness_deafness: (fx, style, ev) => markSpell(fx, 'curse', ev, FRAME.eye),
  ray_of_enfeeblement: async (fx, style, ev) => {
    let target = ev.targets?.[0];
    (target && fx.beam(castOrigin(ev), chestOf(target), { col: 6961824, width: 0.16, life: 0.5, glow: 2 }),
      await markSpell(fx, 'necrotic', ev, FRAME.skull, { link: !1 }));
  },
  hex: (fx, style, ev) => markSpell(fx, 'curse', ev, FRAME.sigil, { spin: 1.5 }),
  hunters_mark: (fx, style, ev) => markSpell(fx, 'mark', ev, FRAME.cross, { spin: 1 }),
};
// Estilo del efecto añadido de cada castigo o golpe especial.
const SMITE_STYLES = {
  divine_smite: 'radiant',
  shining_smite: 'radiant',
  searing_smite: 'fire',
  thunderous_smite: 'thunder',
  wrathful_smite: 'necrotic',
  ensnaring_strike: 'nature',
};
// Coreografías de los rasgos de clase y especie: (fx, ev) => promesa.
const FEATURE_FX = {
  rage: (fx, ev) => furyBurst(fx, ev, 16722448),
  reckless: (fx, ev) => furyBurst(fx, ev, 16738848),
  frenzy: (fx, ev) => furyBurst(fx, ev, 16722448),
  action_surge: (fx, ev) => powerSurge(fx, ev, 16766314, FRAME.bolt),
  second_wind: async (fx, ev) => {
    await windSwirl(fx, ev);
  },
  innate_sorcery: (fx, ev) => powerSurge(fx, ev, 11567359, FRAME.rune),
  create_slot: (fx, ev) => powerSurge(fx, ev, 10320895, FRAME.rune),
  metamagic: (fx, ev) => powerSurge(fx, ev, 12615935, FRAME.rune),
  sacred_weapon: (fx, ev) => powerSurge(fx, ev, 16769162, FRAME.sword),
  uncanny_metabolism: (fx, ev) => powerSurge(fx, ev, 10289072, FRAME.swirl),
  relentless_endurance: (fx, ev) => furyBurst(fx, ev, 16747056),
  adrenaline_rush: async (fx, ev) => {
    (await windSwirl(fx, ev), await furyBurst(fx, ev, 16732208));
  },
  flurry: (fx, ev) => powerSurge(fx, ev, 12574975, FRAME.fist),
  patient_defense: (fx, ev) => windSwirl(fx, ev),
  step_of_wind: (fx, ev) => windSwirl(fx, ev),
  steady_aim: async (fx, ev) => {
    let caster = ev.caster;
    (fx.p({
      p: (caster.head || caster.chest).clone().setY((caster.head || caster.chest).y + 0.5),
      life: 0.9,
      size: 0.5,
      size1: 0.3,
      col: 12123978,
      frame: FRAME.cross,
      glow: 2,
      spin: 2,
    }),
      await fx.wait(0.2));
  },
  fires_burn: async (fx, ev) => {
    ev.targets?.[0] && fx.element('fire', chestOf(ev.targets[0]), { k: 0.8 });
  },
  frosts_chill: async (fx, ev) => {
    ev.targets?.[0] && fx.element('frost', chestOf(ev.targets[0]), { k: 0.8 });
  },
  hills_tumble: async (fx, ev) => {
    ev.targets?.[0] && fx.element('thunder', ev.targets[0].pos.clone().setY(0.4), { k: 0.6 });
  },
  clouds_jaunt: (fx, ev) => teleportPuff(fx, ev.caster?.pos, ev.to || null, 15791359),
  bardic_inspiration: async (fx, ev) => {
    let target = ev.targets?.[0];
    if (!target) return;
    let from = castOrigin(ev),
      to = chestOf(target);
    for (let i = 0; i < 5; i++)
      fx.after(i * 0.06, () => {
        let mid = from
            .clone()
            .lerp(to, 0.5)
            .add(vec3(randRange(-0.6, 0.6), randRange(0.8, 1.6), randRange(-0.6, 0.6))),
          curve = new QuadraticBezierCurve3(from.clone(), mid, to.clone()),
          f = 0;
        fx.stream(0.6, (dt) => {
          f = Math.min(1, f + dt / 0.55);
          let p = curve.getPoint(f);
          fx.p({
            p,
            life: 0.3,
            size: 0.3,
            size1: 0.14,
            col: i % 2 ? 16769162 : 16774336,
            frame: FRAME.note,
            glow: 2,
            rot: 0,
            a: 0.95,
          });
        });
      });
    (fx.fx('launch', { style: 'buff', at: from }),
      await fx.wait(0.65),
      fx.p({
        p: to.clone().setY(to.y + 0.9),
        v: [0, 0.4, 0],
        life: 1.2,
        size: 0.45,
        col: 16766314,
        frame: FRAME.die,
        glow: 2,
        rot: 0,
      }),
      fx.burst(to, { n: 14, col: 16774336, speed: 1.5, life: 0.7, size: 0.1, frame: FRAME.star, glow: 2 }));
  },
  divine_spark: async (fx, ev) => {
    let target = ev.targets?.[0];
    target &&
      (fx.beam(castOrigin(ev), chestOf(target), { col: 16769162, width: 0.18, life: 0.45, glow: 2.6 }),
      await fx.wait(0.08),
      target.ally ? fx.heal(target.pos, 8) : fx.element('radiant', chestOf(target), { k: 1 }));
  },
  turn_undead: async (fx, ev) => {
    let caster = ev.caster;
    (fx.p({
      p: (caster.head || caster.chest).clone().setY((caster.head || caster.chest).y + 0.6),
      life: 1.2,
      size: 0.7,
      size1: 0.9,
      col: 16769162,
      frame: FRAME.ankh,
      glow: 2.4,
      rot: 0,
    }),
      fx.ring(caster.pos, { color: 16765024, radius: 9, life: 1.1, thick: 0.06, fill: 0.4, glow: 2.2 }),
      fx.dome(caster.pos, { color: 16773312, radius: 3, life: 0.6, alpha: 0.6 }),
      fx.light(caster.chest || caster.pos, 16766842, 10, 12, 0.9),
      fx.fx('area', { style: 'radiant', at: caster.pos }),
      await fx.wait(0.35));
    for (let target of ev.targets || []) fx.element('radiant', chestOf(target), { k: 0.6 });
  },
  preserve_life: async (fx, ev) => {
    let caster = ev.caster;
    fx.ring(caster.pos, { color: 9437104, radius: 6, life: 0.9, thick: 0.08, fill: 0.5 });
    for (let target of ev.targets || [])
      fx.beam(chestOf(caster), chestOf(target), { col: 10289072, width: 0.08, life: 0.5, glow: 2 });
    await fx.wait(0.3);
  },
  lands_aid: async (fx, ev) => {
    for (let p of samplePoints(fx, ev.cells || [], 10))
      fx.after(randRange(0, 0.2), () => {
        (fx.burst(p.clone().setY(0.1), {
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
          fx.element('necrotic', p.clone().setY(0.6), { k: 0.4 }));
      });
    (fx.hexwave(ev.cells, { color: 6278986, life: 0.9 }),
      fx.fx('area', { style: 'nature', at: areaCenter(fx, ev) }),
      await fx.wait(0.3));
  },
  lay_on_hands: async (fx, ev) => {
    let target = ev.targets?.[0] || ev.caster,
      from = castOrigin(ev);
    (fx.p({ p: from, life: 0.6, size: 0.5, size1: 0.9, col: 16769162, frame: FRAME.glow, glow: 2.4 }),
      fx.pillar(target.pos, { color: 16773312, radius: 0.5, height: 3.5, life: 0.7 }),
      await fx.wait(0.2));
  },
  breath_weapon: (fx, ev) => {
    let style = DAMAGE_STYLE[ev.dtype] || 'fire';
    if (ev.shape === 'line') {
      let caster = ev.caster,
        end = areaCenter(fx, ev)
          .clone()
          .sub(caster.pos)
          .setY(0)
          .normalize()
          .multiplyScalar(9)
          .add(caster.pos)
          .setY(1.2);
      return (
        fx.beam(castOrigin(ev), end, {
          col: getStyle(style).c,
          width: 0.6,
          life: 0.6,
          mode: style === 'lightning' ? 'bolt' : 'beam',
          glow: 2.4,
        }),
        areaWave(fx, style, ev, { origin: caster.pos, radius: 4, points: 6, k: 0.5, spread: 0.25 })
      );
    }
    return coneSpray(fx, style, ev, { spread: 0.5 });
  },
  move_mark: (fx, ev) => markSpell(fx, 'mark', ev, FRAME.cross, { spin: 1 }),
};
/** Rasgos que el controlador de combate anima como un conjuro (con gesto de lanzamiento). */
const SPELL_LIKE_FEATURES = new Set([
  'bardic_inspiration',
  'divine_spark',
  'turn_undead',
  'preserve_life',
  'lands_aid',
  'lay_on_hands',
  'breath_weapon',
]);

export { playSpellFx, playFeatureFx, SPELL_LIKE_FEATURES };
