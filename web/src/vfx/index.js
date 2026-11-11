// vfx/index.js
// Director de efectos visuales del combate. `createVfx` crea, sobre la escena, dos sistemas de
// partículas (aditivo y normal), una reserva de luces puntuales, las piezas con sombreador de
// shaders.js, las auras (conditions.js) y las zonas (zones.js), y devuelve el objeto `vfx` con la API
// que usan las coreografías de spells.js y el controlador de combate: partículas (p, burst, glow),
// piezas (ring, dome, pillar, hexwave, runes, slash, decal, beam, ribbon), proyectiles, impactos
// (hit, element, crit, miss, heal, death, blood), lanzamiento (castStart), temporización (wait,
// after, stream), cámara (shake, flash) y conjuros/rasgos (spell, feature). `vfx.onFx` recibe los
// avisos de efecto (cast, launch, impact, area…): combat/controller.js los reenvía al bus como
// 'battle:fx' y audio/reactions.js los convierte en sonidos.
// Lo crea combat/index.js (runBattle). Es un área cargable: sus exports son públicos.
// Reconstruido de publicado/juego.js (módulo __esm «p1»).

import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  Vector3,
} from 'three';
import { ParticleSystem } from './particles.js';
import { FRAME } from './atlas.js';
import { Beam, RingWave, Dome, LightPillar, HexWave, RuneCircle, SlashArc, Decal } from './shaders.js';
import { getStyle, resolveStyleKey, DAMAGE_STYLE } from './styles.js';
import efectosConjuros from '../datos/efectos/conjuros.json';
import { playSpellFx, playFeatureFx } from './spells.js';
import { AuraEffects } from './conditions.js';
import { ZoneEffects } from './zones.js';

/** Punto al azar dentro de una esfera de radio `radius` (escrito en `target`). */
function rsphere(radius = 1, target = vec3()) {
  let x, y, z;
  do ((x = Math.random() * 2 - 1), (y = Math.random() * 2 - 1), (z = Math.random() * 2 - 1));
  while (x * x + y * y + z * z > 1);
  return target.set(x * radius, y * radius, z * radius);
}
/** Dirección unitaria al azar dentro de un cono de semiángulo `angle` alrededor de `dir`. */
function rcone(dir, angle, target = vec3()) {
  let axis = dir.clone().normalize(),
    ref = Math.abs(axis.y) < 0.95 ? vec3(0, 1, 0) : vec3(1, 0, 0),
    u = vec3().crossVectors(axis, ref).normalize(),
    w = vec3().crossVectors(u, axis).normalize(),
    theta = Math.random() * Math.PI * 2,
    spread = Math.tan(angle) * Math.sqrt(Math.random());
  return target
    .copy(axis)
    .addScaledVector(u, Math.cos(theta) * spread)
    .addScaledVector(w, Math.sin(theta) * spread)
    .normalize();
}
/** Malla de munición física: 'dagger', 'bolt', 'javelin' o flecha (cualquier otro valor). */
function buildAmmoMesh(kind) {
  if (!ammoMaterials) {
    let wood = new MeshStandardMaterial({ color: 6965802, roughness: 0.8 }),
      iron = new MeshStandardMaterial({ color: 10132128, metalness: 0.7, roughness: 0.35 }),
      fletch = new MeshStandardMaterial({ color: 15261904, side: DoubleSide, roughness: 0.9 }),
      steel = new MeshStandardMaterial({ color: 13684952, metalness: 0.85, roughness: 0.25 }),
      leather = new MeshStandardMaterial({ color: 3810322, roughness: 0.9 });
    ammoMaterials = { wood, iron, fletch, steel, leather };
  }
  let mats = ammoMaterials,
    group = new Group();
  if (kind === 'dagger') {
    let blade = new Mesh(new BoxGeometry(0.035, 0.008, 0.24), mats.steel);
    blade.position.z = 0.09;
    let grip = new Mesh(new BoxGeometry(0.026, 0.026, 0.1), mats.leather);
    grip.position.z = -0.07;
    let guard = new Mesh(new BoxGeometry(0.09, 0.02, 0.02), mats.iron);
    return ((guard.position.z = -0.02), group.add(blade, grip, guard), group);
  }
  let length = kind === 'bolt' ? 0.42 : kind === 'javelin' ? 1.25 : 0.72,
    shaft = new Mesh(
      new CylinderGeometry(kind === 'javelin' ? 0.02 : 0.011, kind === 'javelin' ? 0.02 : 0.011, length, 5),
      mats.wood,
    );
  shaft.rotation.x = Math.PI / 2;
  let head = new Mesh(
    new ConeGeometry(kind === 'javelin' ? 0.04 : 0.024, kind === 'javelin' ? 0.16 : 0.08, 5),
    mats.iron,
  );
  if (
    ((head.rotation.x = Math.PI / 2),
    (head.position.z = length / 2 + 0.03),
    group.add(shaft, head),
    kind !== 'javelin')
  )
    for (let angle of [0, Math.PI / 2]) {
      let fin = new Mesh(new PlaneGeometry(0.05, 0.12), mats.fletch);
      (fin.rotation.set(Math.PI / 2, angle, 0), (fin.position.z = -length / 2 + 0.06), group.add(fin));
    }
  return group;
}
/**
 * Crea el director de efectos. `quality.level` (0–2) fija el número de partículas y luces;
 * `cellToWorld` pasa casillas a posiciones; `grade` es el pase de gradación (uniforme uFlash).
 */
function createVfx({ scene, camera, quality = { level: 1 }, cellToWorld = null, grade = null } = {}) {
  let level = quality.level ?? 1,
    qualityScale = [0.45, 0.75, 1][level] ?? 0.75,
    root = new Group();
  ((root.name = 'vfx'), scene.add(root));
  let addParticles = new ParticleSystem(level === 0 ? 1400 : level === 1 ? 2600 : 4e3, 'add'),
    alphaParticles = new ParticleSystem(level === 0 ? 500 : level === 1 ? 900 : 1400, 'alpha');
  root.add(alphaParticles.mesh, addParticles.mesh);
  let lights = new LightPool(root, level === 0 ? 1 : level === 1 ? 2 : 4),
    pieces = [],
    timers = [],
    clock = 0,
    shakeAmount = 0,
    shakeTime = 0,
    flashAmount = 0,
    reducedMotion = typeof matchMedia == 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    vfx = {
      root,
      camera,
      quality: qualityScale,
      level,
      add: addParticles,
      alp: alphaParticles,
      lights,
      cellToWorld: cellToWorld || ((cell) => vec3(cell[0], 0, cell[1])),
      onFx: null,
      timeScale: 1,
      setLevel(newLevel) {
        ((qualityScale = [0.45, 0.75, 1][newLevel] ?? qualityScale),
          (this.quality = qualityScale),
          (this.level = newLevel));
      },
      /** Promesa que se resuelve tras `seconds` del reloj de efectos (afectado por timeScale). */
      wait(seconds) {
        return new Promise((resolve) => timers.push({ at: clock + seconds, fn: resolve }));
      },
      /** Llama a `fn` tras `seconds`. */
      after(seconds, fn) {
        timers.push({ at: clock + seconds, fn });
      },
      /** Llama a `fn(dt, progreso, transcurrido)` en cada fotograma durante `duration` s. */
      stream(duration, fn) {
        pieces.push({
          t: 0,
          update(dt) {
            return ((this.t += dt), fn(dt, Math.min(1, this.t / duration), this.t), this.t < duration);
          },
          dispose() {},
        });
      },
      /** Avisa a `onFx` (sonido) de un efecto; `at` se pasa como [x, y, z]. */
      fx(name, data = {}) {
        if (this.onFx)
          try {
            let at = data.at ? (data.at.isVector3 ? [data.at.x, data.at.y, data.at.z] : data.at) : void 0;
            this.onFx(name, { ...data, at });
          } catch (err) {
            console.error('[vfx] onFx', err);
          }
      },
      /** Crea una partícula (en el sistema normal si `blend` es 'alpha'). */
      p(opts) {
        return (opts.blend === 'alpha' ? alphaParticles : addParticles).spawn(opts);
      },
      /** Estallido de `n` partículas (escalado por calidad) desde `pos`. */
      burst(
        pos,
        {
          n = 20,
          col = 16777215,
          col1,
          speed = 3,
          speedMin = null,
          up = 0,
          life = 0.6,
          lifeVar = 0.4,
          size = 0.12,
          size1,
          frame = FRAME.spark,
          grav = 0,
          drag = 1.5,
          stretch = 0,
          blend = 'add',
          glow = 1.5,
          a = 1,
          a1 = 0,
          dir = null,
          cone = 0.6,
          radius = 0,
          spin = 0,
          fadeIn = 0.05,
          flicker = 0,
          flat = !1,
        } = {},
      ) {
        let count = Math.max(1, Math.round(n * qualityScale)),
          dirVec = vec3(),
          origin = vec3();
        for (let i = 0; i < count; i++) {
          (dir ? rcone(dir, cone, dirVec) : rsphere(1, dirVec).normalize(),
            flat && ((dirVec.y = Math.abs(dirVec.y) * 0.15), dirVec.normalize()));
          let s = speedMin !== null ? randRange(speedMin, speed) : speed * (0.35 + 0.65 * Math.random());
          (origin.copy(pos),
            radius > 0 && origin.add(rsphere(radius, vec3())),
            this.p({
              p: origin,
              v: [dirVec.x * s, dirVec.y * s + up, dirVec.z * s],
              life: life * (1 - lifeVar / 2 + Math.random() * lifeVar),
              size: size * randRange(0.7, 1.3),
              size1: size1 ?? size * 0.3,
              col,
              col1: col1 ?? col,
              a,
              a1,
              frame,
              grav,
              drag,
              stretch,
              blend,
              glow,
              spin: spin ? randRange(-spin, spin) : 0,
              fadeIn,
              flicker,
            }));
        }
      },
      glow(pos, color = 16777215, size = 1.5, life = 0.25, glow = 2.5) {
        this.p({
          p: pos,
          life,
          size: size * 0.6,
          size1: size,
          col: color,
          a: 1,
          a1: 0,
          frame: FRAME.glow,
          glow,
          fadeIn: 0.02,
        });
      },
      ring(pos, opts = {}) {
        return this.piece(new RingWave(pos, opts));
      },
      dome(pos, opts = {}) {
        return this.piece(new Dome(pos, opts));
      },
      pillar(pos, opts = {}) {
        return this.piece(new LightPillar(pos, opts));
      },
      hexwave(cells, opts = {}) {
        return !cells || !cells.length ? null : this.piece(new HexWave(cells, this.cellToWorld, opts));
      },
      runes(pos, opts = {}) {
        return this.piece(new RuneCircle(pos, opts));
      },
      slash(pos, opts = {}) {
        return this.piece(new SlashArc(pos, camera, opts));
      },
      decal(pos, opts = {}) {
        return this.piece(new Decal(pos, opts));
      },
      beam(
        from,
        to,
        {
          col = 16777215,
          width = 0.16,
          life = 0.45,
          mode = 'beam',
          glow = 2.2,
          speed = 8,
          jitter = 0.3,
          alpha = 1,
          hot = null,
        } = {},
      ) {
        let beam = new Beam({
          width,
          color: col,
          life,
          mode,
          glow,
          speed,
          jitter,
          alpha,
          hot,
        });
        return (beam.setLine(from, to, mode === 'bolt' ? 18 : 14), this.piece(beam));
      },
      ribbon(points, opts = {}) {
        let beam = new Beam({
          width: opts.width ?? 0.12,
          color: opts.col ?? 16777215,
          life: opts.life ?? 0.5,
          mode: opts.mode ?? 'beam',
          glow: opts.glow ?? 2,
          speed: opts.speed ?? 6,
          alpha: opts.alpha ?? 1,
        });
        return (beam.setPoints(points), this.piece(beam));
      },
      light(pos, color, intensity = 6, distance = 6, life = 0.4, follow = null) {
        return lights.flash(pos, color, intensity, distance, life, follow);
      },
      piece(piece) {
        return (root.add(piece.mesh), pieces.push(piece), piece);
      },
      remove(piece) {
        let index = pieces.indexOf(piece);
        (index >= 0 && pieces.splice(index, 1), root.remove(piece.mesh), piece.dispose());
      },
      shake(amount = 0.006, duration = 0.3) {
        reducedMotion ||
          this.noShake ||
          (level === 0 && (amount *= 0.6),
          (shakeAmount = Math.max(shakeAmount, amount)),
          (shakeTime = Math.max(shakeTime, duration)));
      },
      flash(amount = 0.45) {
        (reducedMotion && (amount *= 0.4), (flashAmount = Math.max(flashAmount, amount)));
      },
      /** Círculo de runas y chispas hacia la mano al empezar a lanzar; devuelve `{ release() }`. */
      castStart(style, pos, hand, { radius = 0.9, big = !1 } = {}) {
        let def = getStyle(style),
          runes = this.runes(pos, {
            color: def.c,
            radius: big ? radius * 1.5 : radius,
            life: 0,
            spin: 1.2,
            alpha: 0.85,
          }),
          emitSparks = (dt) => {
            if (!hand) return;
            let count = Math.max(1, Math.round(60 * dt * qualityScale));
            for (let i = 0; i < count; i++) {
              let offset = rsphere(0.55, vec3()).add(vec3(0, 0.1, 0));
              this.p({
                p: hand.clone().add(offset),
                v: offset.clone().multiplyScalar(-2.2),
                life: 0.28,
                size: 0.07,
                size1: 0.02,
                col: def.c2,
                col1: def.c,
                frame: FRAME.spark,
                glow: 2,
                a: 0.9,
                a1: 0.2,
                stretch: 0.05,
              });
            }
            Math.random() < 0.5 &&
              this.p({
                p: hand,
                life: 0.12,
                size: 0.28,
                size1: 0.34,
                col: def.c,
                frame: FRAME.glow,
                glow: 1.8,
                a: 0.8,
              });
          },
          active = !0;
        return (
          this.stream(1.2, (dt) => active && emitSparks(dt)),
          this.fx('cast', { style, at: pos }),
          {
            release: () => {
              ((active = !1), runes.close(0.35));
            },
          }
        );
      },
      /** Lanza un proyectil de `from` a `to`; la promesa se resuelve con el punto de llegada. */
      projectile(
        style,
        from,
        to,
        { kind = 'orb', speed = 16, arc = null, miss = !1, size = 1, trail = !0, curve = 0, light = !0 } = {},
      ) {
        let def = getStyle(style),
          end = to.clone();
        if (miss) {
          let dir = to.clone().sub(from).setY(0).normalize(),
            side = vec3(-dir.z, 0, dir.x).multiplyScalar(randRange(-1, 1) * 0.9);
          ((end = to.clone().addScaledVector(dir, 2.6).add(side)), (end.y = Math.max(0.05, to.y - 1.2)));
        }
        let dist = from.distanceTo(end),
          duration = Math.max(0.12, dist / speed),
          isAmmo = kind !== 'orb' && kind !== 'dart',
          arcHeight = arc ?? (isAmmo ? Math.min(1.4, dist * 0.06) : dist * 0.02),
          bend = vec3().subVectors(end, from).setY(0).normalize();
        bend.set(-bend.z, 0, bend.x).multiplyScalar(curve * dist * 0.25);
        let ammo = null;
        isAmmo && ((ammo = buildAmmoMesh(kind === 'dart' ? 'arrow' : kind)), root.add(ammo));
        let trailBeam = trail
          ? new Beam({
              width: isAmmo ? 0.05 : 0.34 * size,
              color: isAmmo ? 16774368 : def.c,
              glow: isAmmo ? 0.8 : 1.5,
              life: 0,
              mode: 'trail',
              alpha: isAmmo ? 0.35 : 0.85,
              speed: 10,
              hot: isAmmo ? 0.2 : 0.3,
            })
          : null;
        trailBeam && this.piece(trailBeam);
        let trailPts = [],
          pos = from.clone(),
          ahead = vec3(),
          glowLight = light && !isAmmo ? lights.flash(from, def.c, 5 * size, 5, 0, () => pos) : null;
        this.fx('launch', { style: isAmmo ? kind : style, at: from });
        let self = this;
        return new Promise((resolve) => {
          let done = !1;
          pieces.push({
            t: 0,
            update(dt) {
              this.t += dt;
              let progress = Math.min(1, this.t / duration),
                pointAt = (f, out) => (
                  out.copy(from).lerp(end, f),
                  (out.y += Math.sin(f * Math.PI) * arcHeight),
                  out.addScaledVector(bend, Math.sin(f * Math.PI)),
                  out
                );
              if ((pointAt(progress, pos), pointAt(Math.min(1, progress + 0.02), ahead), ammo))
                (ammo.position.copy(pos),
                  kind === 'dagger' ? (ammo.lookAt(ahead), ammo.rotateX(this.t * 22)) : ammo.lookAt(ahead));
              else {
                (self.p({
                  p: pos,
                  life: 0.06,
                  size: 0.3 * size,
                  size1: 0.26 * size,
                  col: def.c2,
                  frame: FRAME.glow,
                  glow: 2.4,
                  a: 1,
                }),
                  self.p({
                    p: pos,
                    life: 0.1,
                    size: 0.75 * size,
                    size1: 0.6 * size,
                    col: def.c,
                    frame: FRAME.glow,
                    glow: 1.4,
                    a: 0.6,
                  }));
                let count = Math.max(1, Math.round(90 * dt * qualityScale * size));
                for (let i = 0; i < count; i++) {
                  let p = rsphere(0.1 * size, vec3()).add(pos);
                  self.p({
                    p,
                    v: rsphere(0.7, vec3()),
                    life: randRange(0.2, 0.5),
                    size: (style === 'fire' ? 0.24 : 0.13) * size,
                    size1: 0.03,
                    col: def.c2,
                    col1: def.c,
                    frame: def.p,
                    glow: 1.6,
                    a: 0.85,
                    grav: style === 'fire' ? 1.4 : style === 'acid' ? -3 : 0,
                    spin: 3,
                  });
                }
                (style === 'fire' &&
                  Math.random() < 0.6 &&
                  self.p({
                    p: pos,
                    v: [0, 0.6, 0],
                    life: 0.7,
                    size: 0.2,
                    size1: 0.5,
                    col: 2760728,
                    a: 0.35,
                    frame: FRAME.smoke,
                    blend: 'alpha',
                    fadeIn: 0.2,
                  }),
                  style === 'necrotic' &&
                    Math.random() < 0.7 &&
                    self.p({
                      p: pos,
                      v: rsphere(0.3, vec3()),
                      life: 0.6,
                      size: 0.25,
                      size1: 0.45,
                      col: 1706532,
                      a: 0.45,
                      frame: FRAME.smoke,
                      blend: 'alpha',
                      fadeIn: 0.15,
                    }));
              }
              return (
                trailBeam &&
                  (trailPts.push(pos.clone()),
                  trailPts.length > 14 && trailPts.shift(),
                  trailBeam.setPoints(trailPts)),
                progress >= 1 &&
                  !done &&
                  ((done = !0),
                  ammo &&
                    (miss
                      ? (ammo.position.copy(end), self.after(1.4, () => root.remove(ammo)))
                      : root.remove(ammo)),
                  trailBeam && ((trailBeam.life = 0.18), (trailBeam.t = 0)),
                  glowLight && lights.release(glowLight, 0.15),
                  miss && self.fx('whiff', { style, at: end }),
                  resolve(end)),
                !done
              );
            },
            dispose() {
              ammo && root.remove(ammo);
            },
          });
        });
      },
      /** Impacto de arma según el tipo de daño (cortante, perforante, contundente o elemental). */
      hit(type, pos, { crit = !1, dir = null, small = !1, blood = !0 } = {}) {
        let scale = crit ? 1.6 : small ? 0.6 : 1,
          hitDir = dir ? dir.clone().normalize() : null;
        switch (((this._noBlood = !blood), this.fx('impact', { type, crit, at: pos }), type)) {
          case 'slashing':
            (this.slash(pos, { color: 16773852, size: 1.2 * scale, life: 0.26 }),
              this.burst(pos, {
                n: 10 * scale,
                col: 16769712,
                speed: 4,
                life: 0.3,
                size: 0.06,
                stretch: 0.08,
                dir: hitDir,
                cone: 1.2,
              }),
              this.blood(pos, scale, hitDir));
            break;
          case 'piercing':
            (this.burst(pos, {
              n: 12 * scale,
              col: 16773328,
              speed: 6,
              life: 0.22,
              size: 0.05,
              stretch: 0.12,
              dir: hitDir,
              cone: 0.5,
            }),
              this.glow(pos, 16771264, 0.5 * scale, 0.12, 2),
              this.blood(pos, scale * 0.8, hitDir));
            break;
          case 'bludgeoning':
            (this.ring(pos.clone().setY(pos.y - 0.2), {
              color: 16773336,
              radius: 0.9 * scale,
              life: 0.3,
              thick: 0.3,
              vertical: camera.position.clone().sub(pos),
              y: 0,
            }),
              this.burst(pos, {
                n: 14 * scale,
                col: 11575440,
                speed: 2.2,
                life: 0.6,
                size: 0.18,
                size1: 0.4,
                frame: FRAME.dust,
                blend: 'alpha',
                a: 0.5,
                drag: 3,
              }),
              this.burst(pos, {
                n: 6 * scale,
                col: 16773328,
                speed: 4,
                life: 0.2,
                size: 0.06,
                stretch: 0.06,
              }),
              this.blood(pos, scale * 0.6, hitDir));
            break;
          default:
            this.element(DAMAGE_STYLE[type] || 'arcane', pos, { k: scale, dir: hitDir });
        }
        crit && this.crit(pos);
      },
      blood(pos, amount = 1, dir = null, color = 7998728) {
        if (this._noBlood) {
          (this.burst(pos, {
            n: 7 * amount,
            col: 15261900,
            speed: 2.6,
            up: 1,
            life: 0.6,
            size: 0.06,
            frame: FRAME.shard,
            grav: -9,
            spin: 8,
            blend: 'alpha',
            a: 1,
          }),
            this.burst(pos, {
              n: 4 * amount,
              col: 13616816,
              speed: 0.8,
              life: 0.8,
              size: 0.2,
              size1: 0.45,
              frame: FRAME.dust,
              blend: 'alpha',
              a: 0.4,
            }));
          return;
        }
        this.bloodless ||
          this.burst(pos, {
            n: 8 * amount,
            col: color,
            speed: 2.4,
            up: 1.2,
            life: 0.55,
            size: 0.07,
            size1: 0.05,
            frame: FRAME.drop,
            grav: -9,
            drag: 0.5,
            blend: 'alpha',
            a: 0.95,
            a1: 0.8,
            dir: dir ? dir.clone().setY(0.3) : null,
            cone: 1,
            stretch: 0.05,
          });
      },
      /** Impacto elemental del estilo `style` con fuerza `power`. */
      element(style, pos, { k: power = 1, dir = null } = {}) {
        let def = getStyle(style);
        switch (style) {
          case 'fire':
            (this.glow(pos, 16752704, 1.4 * power, 0.22, 3),
              this.burst(pos, {
                n: 26 * power,
                col: 16765562,
                col1: 16726536,
                speed: 2.6,
                up: 1.2,
                life: 0.55,
                size: 0.3,
                size1: 0.08,
                frame: FRAME.flame,
                glow: 2,
                grav: 2,
              }),
              this.burst(pos, {
                n: 14 * power,
                col: 16760928,
                speed: 5,
                life: 0.5,
                size: 0.05,
                stretch: 0.06,
                grav: -4,
                glow: 2.5,
              }),
              this.burst(pos, {
                n: 8 * power,
                col: 2628628,
                speed: 0.8,
                up: 0.9,
                life: 1.1,
                size: 0.35,
                size1: 0.8,
                frame: FRAME.smoke,
                blend: 'alpha',
                a: 0.4,
                fadeIn: 0.2,
              }),
              this.light(pos, 16742954, 9 * power, 7, 0.45));
            break;
          case 'frost':
            (this.glow(pos, 12577023, 1.1 * power, 0.2, 2.4),
              this.burst(pos, {
                n: 16 * power,
                col: 15268607,
                col1: 8377599,
                speed: 4,
                life: 0.6,
                size: 0.16,
                size1: 0.06,
                frame: FRAME.shard,
                glow: 1.6,
                grav: -6,
                spin: 6,
              }),
              this.burst(pos, {
                n: 12 * power,
                col: 16777215,
                speed: 1.5,
                life: 1,
                size: 0.08,
                size1: 0.04,
                frame: FRAME.flake,
                glow: 1.4,
                grav: -0.6,
                spin: 2,
              }),
              this.burst(pos, {
                n: 6 * power,
                col: 13625599,
                speed: 0.6,
                life: 1.2,
                size: 0.4,
                size1: 0.9,
                frame: FRAME.smoke,
                blend: 'alpha',
                a: 0.3,
                fadeIn: 0.2,
              }),
              this.decal(pos.clone().setY(0), {
                frame: FRAME.flake,
                color: 12577023,
                size: 1.2 * power,
                life: 2.2,
                alpha: 0.5,
                glow: 1.2,
              }),
              this.light(pos, 9427199, 6 * power, 6, 0.4));
            break;
          case 'lightning': {
            let from = pos.clone();
            for (let i = 0; i < 4 * power; i++)
              this.after(i * 0.03, () =>
                this.beam(from, from.clone().add(rsphere(1.1, vec3()).setY(randRange(-0.6, 0.8))), {
                  col: 12112127,
                  width: 0.07,
                  life: 0.26,
                  mode: 'bolt',
                  jitter: 0.35,
                  glow: 3,
                }),
              );
            (this.glow(pos, 14674175, 1.2 * power, 0.15, 3.5),
              this.burst(pos, {
                n: 18 * power,
                col: 15791871,
                speed: 6,
                life: 0.3,
                size: 0.05,
                stretch: 0.1,
                glow: 3,
              }),
              this.light(pos, 11061503, 10 * power, 7, 0.25));
            break;
          }
          case 'thunder':
          case 'shatter':
            (this.ring(pos.clone().setY(0), {
              color: def.c,
              radius: 2.2 * power,
              life: 0.5,
              thick: 0.15,
              fill: 0.6,
            }),
              this.dome(pos.clone().setY(0), {
                color: def.c2,
                radius: 1.3 * power,
                life: 0.4,
                alpha: 0.7,
                half: !0,
              }),
              this.burst(pos, {
                n: 14 * power,
                col: 11049608,
                speed: 2.5,
                life: 0.8,
                size: 0.25,
                size1: 0.6,
                frame: FRAME.dust,
                blend: 'alpha',
                a: 0.45,
                drag: 2.5,
                flat: !0,
              }),
              style === 'shatter' &&
                this.burst(pos, {
                  n: 16 * power,
                  col: 15261439,
                  speed: 5,
                  life: 0.6,
                  size: 0.12,
                  frame: FRAME.shard,
                  grav: -8,
                  spin: 8,
                  glow: 1.6,
                }),
              this.shake(0.007 * power, 0.3));
            break;
          case 'radiant':
          case 'moon':
            (this.glow(pos, 16773312, 1.6 * power, 0.3, 3),
              this.burst(pos, {
                n: 18 * power,
                col: 16774864,
                col1: 16760896,
                speed: 3,
                life: 0.7,
                size: 0.18,
                size1: 0.04,
                frame: FRAME.star,
                glow: 2.2,
                spin: 3,
                drag: 2,
              }),
              this.burst(pos, {
                n: 10 * power,
                col: 16769168,
                speed: 6,
                life: 0.3,
                size: 0.05,
                stretch: 0.12,
                glow: 3,
              }),
              this.light(pos, 16766842, 8 * power, 7, 0.5));
            break;
          case 'necrotic': {
            for (let i = 0; i < Math.round(18 * power * qualityScale); i++) {
              let offset = rsphere(1.1, vec3());
              this.p({
                p: pos.clone().add(offset),
                v: offset.clone().multiplyScalar(-2.6),
                life: 0.4,
                size: 0.12,
                size1: 0.03,
                col: 10289050,
                col1: 6961824,
                frame: FRAME.spark,
                glow: 1.8,
                stretch: 0.05,
              });
            }
            let at = pos.clone();
            (this.after(0.12, () => {
              (this.glow(at, 10514656, 1.1 * power, 0.3, 2.2),
                this.ring(at, {
                  color: 10119896,
                  radius: 0.7 * power,
                  life: 0.4,
                  thick: 0.25,
                  vertical: camera.position.clone().sub(at),
                  y: 0,
                }));
            }),
              this.burst(pos, {
                n: 10 * power,
                col: 1706532,
                speed: 0.9,
                up: 0.5,
                life: 1.1,
                size: 0.35,
                size1: 0.8,
                frame: FRAME.smoke,
                blend: 'alpha',
                a: 0.55,
                fadeIn: 0.15,
              }),
              this.burst(pos, {
                n: 6 * power,
                col: 9067208,
                speed: 0.6,
                up: 1.4,
                life: 1.1,
                size: 0.2,
                size1: 0.05,
                frame: FRAME.skull,
                glow: 1.4,
                a: 0.7,
                drag: 1,
              }),
              this.light(pos, 8014591, 4 * power, 5, 0.5));
            break;
          }
          case 'poison':
            (this.burst(pos, {
              n: 12 * power,
              col: 3828244,
              speed: 1,
              up: 0.4,
              life: 1,
              size: 0.35,
              size1: 0.8,
              frame: FRAME.smoke,
              blend: 'alpha',
              a: 0.5,
              fadeIn: 0.1,
            }),
              this.burst(pos, {
                n: 14 * power,
                col: 12124010,
                speed: 1.4,
                up: 1,
                life: 0.9,
                size: 0.1,
                size1: 0.05,
                frame: FRAME.bubble,
                glow: 1.4,
                drag: 1.5,
              }));
            break;
          case 'acid':
            (this.burst(pos, {
              n: 18 * power,
              col: 13172554,
              speed: 3,
              up: 1.5,
              life: 0.7,
              size: 0.1,
              size1: 0.06,
              frame: FRAME.drop,
              glow: 1.6,
              grav: -9,
              stretch: 0.05,
            }),
              this.burst(pos, {
                n: 8 * power,
                col: 6982170,
                speed: 0.6,
                up: 0.6,
                life: 1.2,
                size: 0.25,
                size1: 0.6,
                frame: FRAME.smoke,
                blend: 'alpha',
                a: 0.35,
                fadeIn: 0.2,
              }),
              this.decal(pos.clone().setY(0), {
                frame: FRAME.drop,
                color: 10288954,
                size: 0.9 * power,
                life: 2.5,
                alpha: 0.45,
              }));
            break;
          case 'psychic':
            for (let i = 0; i < 3; i++)
              this.after(i * 0.08, () =>
                this.ring(pos, {
                  color: 16743128,
                  radius: (0.8 + i * 0.4) * power,
                  life: 0.45,
                  thick: 0.12,
                  vertical: camera.position.clone().sub(pos),
                  y: 0,
                }),
              );
            this.burst(pos, {
              n: 10 * power,
              col: 16756968,
              speed: 1.6,
              life: 0.7,
              size: 0.16,
              size1: 0.05,
              frame: FRAME.spiral,
              glow: 1.6,
              spin: 6,
            });
            break;
          case 'force':
          case 'missile':
          case 'eldritch':
          case 'arcane':
            (this.glow(pos, def.c2, 1 * power, 0.18, 2.6),
              this.ring(pos, {
                color: def.c,
                radius: 0.8 * power,
                life: 0.3,
                thick: 0.2,
                vertical: camera.position.clone().sub(pos),
                y: 0,
              }),
              this.burst(pos, {
                n: 16 * power,
                col: def.c2,
                col1: def.c,
                speed: 4.5,
                life: 0.35,
                size: 0.07,
                stretch: 0.08,
                glow: 2.4,
              }),
              this.light(pos, def.c, 5 * power, 5, 0.3));
            break;
          case 'nature':
            (this.burst(pos, {
              n: 14 * power,
              col: 9424992,
              col1: 4885034,
              speed: 2.2,
              up: 1,
              life: 0.9,
              size: 0.14,
              frame: FRAME.leaf,
              blend: 'alpha',
              grav: -2,
              drag: 1.5,
              spin: 5,
              a: 0.95,
              a1: 0.6,
            }),
              this.burst(pos, {
                n: 8 * power,
                col: 14221210,
                speed: 3,
                life: 0.3,
                size: 0.05,
                stretch: 0.06,
                glow: 2,
              }));
            break;
          default:
            (this.glow(pos, def.c2, 0.9 * power, 0.2, 2.2),
              this.burst(pos, {
                n: 14 * power,
                col: def.c2,
                col1: def.c,
                speed: 3,
                life: 0.5,
                size: 0.12,
                size1: 0.03,
                frame: def.p,
                glow: 1.8,
                spin: 3,
                blend: def.blend || 'add',
              }));
        }
      },
      crit(pos) {
        (this.glow(pos, 16765056, 2.6, 0.3, 3.2),
          this.p({
            p: pos,
            life: 0.4,
            size: 1.2,
            size1: 2.2,
            col: 16771248,
            frame: FRAME.star,
            glow: 3,
            rot: Math.random(),
            spin: 2,
          }),
          this.burst(pos, { n: 18, col: 16767120, speed: 7, life: 0.35, size: 0.06, stretch: 0.12, glow: 3 }),
          this.shake(0.01, 0.32),
          this.fx('crit', { at: pos }));
      },
      miss(pos) {
        (this.burst(pos, { n: 6, col: 16773328, speed: 3, life: 0.2, size: 0.04, stretch: 0.08 }),
          this.burst(pos.clone().setY(0.2), {
            n: 4,
            col: 11049608,
            speed: 0.8,
            life: 0.6,
            size: 0.2,
            size1: 0.45,
            frame: FRAME.dust,
            blend: 'alpha',
            a: 0.3,
            flat: !0,
          }));
      },
      heal(pos, amount = 8) {
        let scale = Math.min(1.6, 0.7 + amount / 20);
        (this.ring(pos, { color: 7339936, radius: 0.9, life: 0.7, thick: 0.25, fill: 0.5 }),
          this.stream(0.6, (dt) => {
            let count = Math.max(1, Math.round(45 * dt * qualityScale * scale));
            for (let i = 0; i < count; i++) {
              let angle = Math.random() * Math.PI * 2,
                dist = randRange(0.15, 0.45);
              this.p({
                p: [
                  pos.x + Math.cos(angle) * dist,
                  pos.y + randRange(0, 0.4),
                  pos.z + Math.sin(angle) * dist,
                ],
                v: [0, randRange(1, 2.2), 0],
                life: randRange(0.6, 1),
                size: randRange(0.06, 0.13),
                size1: 0.02,
                col: Math.random() < 0.3 ? 16774336 : 9437104,
                frame: Math.random() < 0.3 ? FRAME.star : FRAME.spark,
                glow: 1.8,
                drag: 0.5,
                spin: 2,
              });
            }
          }),
          this.p({
            p: pos.clone().setY(pos.y + 1),
            life: 0.6,
            size: 1.2,
            size1: 1.6,
            col: 7339936,
            frame: FRAME.glow,
            glow: 1.2,
            a: 0.5,
          }),
          this.light(pos.clone().setY(pos.y + 1), 8388520, 4, 4, 0.7),
          this.fx('heal', { at: pos, amount }));
      },
      /** Efecto de muerte (no muerto: humo y alma que sube). */
      death(pos, { undead = !1, pc = !1 } = {}) {
        let center = pos.clone().setY(pos.y + 0.9);
        if ((this.fx('death', { at: pos, undead, pc }), undead)) {
          (this.burst(center, {
            n: 22,
            col: 14209216,
            speed: 1.6,
            up: 0.3,
            life: 1.3,
            size: 0.25,
            size1: 0.7,
            frame: FRAME.dust,
            blend: 'alpha',
            a: 0.55,
            grav: -0.5,
            drag: 2,
          }),
            this.burst(center, {
              n: 10,
              col: 10289072,
              speed: 0.6,
              up: 1.6,
              life: 1.4,
              size: 0.25,
              size1: 0.06,
              frame: FRAME.skull,
              glow: 1.5,
              a: 0.8,
              drag: 0.8,
            }),
            this.light(center, 9109424, 3, 4, 0.8));
          return;
        }
        if (pc) {
          (this.flash(0.6), this.ring(pos, { color: 16728112, radius: 1.4, life: 0.8, thick: 0.15 }));
          return;
        }
        (this.burst(center, {
          n: 10,
          col: 3814448,
          speed: 0.8,
          up: 0.8,
          life: 1.2,
          size: 0.3,
          size1: 0.8,
          frame: FRAME.smoke,
          blend: 'alpha',
          a: 0.35,
          fadeIn: 0.15,
        }),
          this.after(0.25, () => {
            (this.p({
              p: center,
              v: [0, 1.2, 0],
              life: 1.4,
              size: 0.35,
              size1: 0.1,
              col: 14215423,
              frame: FRAME.glow,
              glow: 1.5,
              a: 0.6,
            }),
              this.burst(center, {
                n: 8,
                col: 14215423,
                speed: 0.5,
                up: 1.3,
                life: 1.2,
                size: 0.07,
                frame: FRAME.spark,
                glow: 1.5,
                drag: 0.5,
              }));
          }));
      },
      /** Reproduce la coreografía de un conjuro (ver spells.js). */
      spell(spellId, ev = {}) {
        let def = efectosConjuros[spellId] || {},
          style = resolveStyleKey(ev.fx ?? def.fx, ev.dtype || def.d);
        return playSpellFx(this, spellId, def, style, ev);
      },
      /** Reproduce la coreografía de un rasgo de clase (ver spells.js). */
      feature(featureId, ev = {}) {
        return playFeatureFx(this, featureId, ev);
      },
      /** Avanza temporizadores, piezas, auras, zonas, partículas, luces, temblor y destello. */
      update(dt) {
        ((dt *= this.timeScale), (clock += dt));
        for (let i = timers.length - 1; i >= 0; i--)
          if (timers[i].at <= clock) {
            let timer = timers[i];
            timers.splice(i, 1);
            try {
              timer.fn();
            } catch (err) {
              console.error('[vfx]', err);
            }
          }
        for (let i = pieces.length - 1; i >= 0; i--) {
          let piece = pieces[i],
            alive = !1;
          try {
            alive = piece.update(dt, camera);
          } catch (err) {
            console.error('[vfx] pieza', err);
          }
          alive || (pieces.splice(i, 1), piece.mesh && root.remove(piece.mesh), piece.dispose?.());
        }
        if (
          (this.auras.update(dt),
          this.zones.update(dt),
          addParticles.update(dt),
          alphaParticles.update(dt),
          lights.update(dt),
          shakeTime > 0)
        ) {
          shakeTime -= dt;
          let amp = shakeAmount * Math.max(0, shakeTime / 0.3),
            viewW = 1e3,
            viewH = viewW / camera.aspect;
          (camera.setViewOffset(
            viewW,
            viewH,
            (Math.random() - 0.5) * 2 * amp * viewW,
            (Math.random() - 0.5) * 2 * amp * viewH,
            viewW,
            viewH,
          ),
            shakeTime <= 0 && ((shakeAmount = 0), camera.clearViewOffset()));
        }
        grade &&
          grade.uniforms.uFlash &&
          flashAmount > 0 &&
          ((grade.uniforms.uFlash.value = flashAmount),
          (flashAmount = Math.max(0, flashAmount - dt * 1.6)),
          flashAmount === 0 && (grade.uniforms.uFlash.value = 0));
      },
      /** Compila de antemano los sombreadores de todas las piezas para evitar tirones. */
      async prewarm(renderer, target = scene) {
        let hidden = new Vector3(0, -50, 0),
          samples = [
            new Beam({ life: 0 }).setLine(hidden, hidden.clone().add(new Vector3(1, 0, 0)), 2),
            new Beam({ life: 0, mode: 'trail' }),
            new RingWave(hidden, { life: 1 }),
            new Dome(hidden, { life: 0 }),
            new LightPillar(hidden, { life: 0 }),
            new HexWave([[0, 0]], () => hidden.clone(), { life: 1 }),
            new HexWave([[0, 0]], () => hidden.clone(), { life: 1, blend: 'alpha' }),
            new RuneCircle(hidden, { life: 0 }),
            new SlashArc(hidden, camera, {}),
            new Decal(hidden, { life: 0 }),
            new Decal(hidden, { life: 0, blend: 'alpha' }),
          ];
        for (let piece of samples) root.add(piece.mesh);
        (addParticles.spawn({ p: hidden, life: 0.01, size: 0.01 }),
          alphaParticles.spawn({ p: hidden, life: 0.01, size: 0.01 }));
        try {
          renderer.compileAsync
            ? await renderer.compileAsync(target, camera)
            : renderer.compile(target, camera);
        } catch (err) {
          console.warn('[vfx] prewarm', err);
        }
        for (let piece of samples) (root.remove(piece.mesh), piece.dispose());
      },
      stats() {
        return {
          add: addParticles.alive,
          alpha: alphaParticles.alive,
          pieces: pieces.length,
          auras: this.auras.count(),
          zones: this.zones.count(),
        };
      },
      /** Quita las piezas no permanentes (`keep`) y las partículas no fijadas. */
      clearTransient() {
        for (let i = pieces.length - 1; i >= 0; i--) {
          let piece = pieces[i];
          piece.keep || (pieces.splice(i, 1), piece.mesh && root.remove(piece.mesh), piece.dispose?.());
        }
        (addParticles.clear(!0), alphaParticles.clear(!0));
      },
      dispose() {
        (this.clearTransient(),
          this.auras.dispose(),
          this.zones.dispose(),
          (timers.length = 0),
          shakeTime > 0 && camera.clearViewOffset(),
          grade && grade.uniforms.uFlash && (grade.uniforms.uFlash.value = 0),
          scene.remove(root),
          addParticles.dispose(),
          alphaParticles.dispose());
      },
    };
  return (
    (vfx.auras = new AuraEffects(vfx)),
    (vfx.zones = new ZoneEffects(vfx)),
    (vfx.aura = (id, anchor, key, on) => vfx.auras.set(id, anchor, key, on)),
    (vfx.zone = (id, kind, cells, color) => vfx.zones.zone(id, kind, cells, color)),
    (vfx.zoneOff = (id) => vfx.zones.zoneOff(id)),
    (vfx.token = (id, kind, pos) => vfx.zones.token(id, kind, pos)),
    (vfx.tokenMove = (id, to) => vfx.zones.tokenMove(id, to)),
    (vfx.tokenStrike = (id, target) => vfx.zones.tokenStrike(id, target)),
    (vfx.tokenOff = (id) => vfx.zones.tokenOff(id)),
    vfx
  );
}
/** Atajo de `new Vector3`. */
const vec3 = (x = 0, y = 0, z = 0) => new Vector3(x, y, z);
/** Número al azar en [min, max). */
const randRange = (min, max) => min + Math.random() * (max - min);
/** Reserva fija de PointLight que se reutilizan para destellos (la más débil si no hay libres). */
const LightPool = class {
  constructor(root, count) {
    this.list = [];
    for (let i = 0; i < count; i++) {
      let light = new PointLight(16777215, 0, 6, 2);
      ((light.userData = { life: 0, t: 0, base: 0, follow: null }), root.add(light), this.list.push(light));
    }
  }
  /** Enciende una luz en `pos` que se apaga en `life` s (0 = fija); `follow()` la mueve. */
  flash(pos, color, intensity = 6, distance = 6, life = 0.4, follow = null) {
    if (!this.list.length) return null;
    let free = this.list.filter((light) => !(light.userData.base > 0 && light.userData.life === 0)),
      candidates = free.length ? free : this.list,
      pick = candidates[0];
    for (let light of candidates) light.intensity < pick.intensity && (pick = light);
    return (
      pick.position.copy(pos),
      pick.color.set(color),
      (pick.distance = distance),
      (pick.intensity = intensity),
      Object.assign(pick.userData, { life, t: 0, base: intensity, follow }),
      pick
    );
  }
  update(dt) {
    for (let light of this.list) {
      let data = light.userData;
      if (!(data.base <= 0)) {
        if (((data.t += dt), data.follow)) {
          let pos = data.follow();
          pos && light.position.copy(pos);
        }
        if (data.life > 0) {
          let progress = data.t / data.life;
          ((light.intensity = data.base * Math.max(0, 1 - progress) ** 1.5),
            progress >= 1 && ((data.base = 0), (data.follow = null), (light.intensity = 0)));
        }
      }
    }
  }
  /** Apaga en `fade` segundos una luz fija. */
  release(light, fade = 0.2) {
    light &&
      ((light.userData.follow = null),
      (light.userData.life = fade),
      (light.userData.t = 0),
      (light.userData.base = light.intensity));
  }
};
// Materiales de la munición, creados la primera vez.
let ammoMaterials = null;

export { DAMAGE_STYLE, STYLE } from './styles.js';
export { FRAME } from './atlas.js';
export { default as SPELLS } from '../datos/efectos/conjuros.json';
export { createVfx, rcone, rsphere };
