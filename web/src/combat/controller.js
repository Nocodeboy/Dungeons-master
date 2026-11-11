// combat/controller.js — Controlador del combate táctico (clase Controller).
// Lleva los turnos sobre el núcleo de reglas (state, options, move, attack, cast, simple, feature, ai_turn,
// end_turn…), la entrada del jugador (ratón, toque y teclado) con previsiones y elección de objetivos, la
// cámara, y convierte cada evento del núcleo ({t: 'attack' | 'damage' | 'cast' | …}) en animaciones de
// las unidades, efectos (vfx) y avisos del HUD. Emite por el bus «battle:start», «battle:turn»,
// «battle:event», «battle:fx» y «battle:end». Lo crea combat/index.js (runBattle).

import { MathUtils, Raycaster, Vector2, Vector3 } from 'three';
import { worldToPlane, planeToCell, cellKey, hexDistance, HEX_SIZE } from '../explore/hex.js';
import { handWorld, anchorsOf } from './hands.js';
import { BS } from '../vfx/conditions.js';
import efectosConjuros from '../datos/efectos/conjuros.json';
import { o1 } from '../vfx/spells.js';
import { DAMAGE_STYLE } from '../vfx/styles.js';
import { FRAME } from '../vfx/atlas.js';
import { makeBeast } from './creatures.js';
import { conditionName, shortName, formatNumber } from './hud.js';

/** Promesa que se cumple tras `ms` milisegundos. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/** ¿Pantalla táctil? (cambia el texto de las indicaciones). */
const TOUCH = typeof matchMedia == 'function' && matchMedia('(pointer: coarse)').matches;
const TAP_AGAIN = TOUCH ? 'Toca otra vez a' : 'Haz clic otra vez en';
/** Texto flotante de cada rasgo de clase al usarlo. */
const FEATURE_NAMES = {
  second_wind: 'Tomar aliento',
  action_surge: '\xA1Oleada de acci\xF3n!',
  rage: '\xA1FURIA!',
  reckless: '\xA1Temerario!',
  frenzy: 'Frenes\xED',
  flurry: 'R\xE1faga de golpes',
  patient_defense: 'Defensa paciente',
  step_of_wind: 'Paso del viento',
  sacred_weapon: 'Arma sagrada',
  relentless_endurance: '\xA1Aguante incansable!',
  steady_aim: 'Punter\xEDa firme',
  innate_sorcery: 'Hechicer\xEDa innata',
  create_slot: 'Fuente de magia',
  uncanny_metabolism: 'Metabolismo asombroso',
  fires_burn: 'Ardor del fuego',
  frosts_chill: 'G\xE9lido aliento',
  hills_tumble: 'Embestida',
  clouds_jaunt: 'Salto de las nubes',
  adrenaline_rush: '\xA1Adrenalina!',
};
/** Clase CSS del número de daño por tipo elemental. */
const DAMAGE_CLASS = {
  fire: 'fuego',
  cold: 'frio',
  lightning: 'rayo',
  acid: 'acido',
  poison: 'veneno',
  necrotic: 'necrotico',
  radiant: 'radiante',
  psychic: 'psiquico',
  force: 'fuerza',
  thunder: 'trueno',
};
/** Nombres de los tipos de daño. */
const DAMAGE_TYPE_NAMES = {
  slashing: 'cortante',
  piercing: 'perforante',
  bludgeoning: 'contundente',
  fire: 'fuego',
  cold: 'fr\xEDo',
  lightning: 'rel\xE1mpago',
  thunder: 'trueno',
  acid: '\xE1cido',
  poison: 'veneno',
  necrotic: 'necr\xF3tico',
  radiant: 'radiante',
  psychic: 'ps\xEDquico',
  force: 'fuerza',
};
/** Plantillas de no muertos (sin sangre, muerte con polvo). */
const UNDEAD_RE = /skeleton|zombie|wight|ghoul|ghost|specter|wraith|mummy/;
/**
 * Controlador del combate: bucle de turnos sobre el núcleo de reglas, entrada del jugador, cámara y
 * reproducción de los eventos del núcleo con animaciones, efectos y HUD.
 * Modos: «busy» (reproduciendo o turno ajeno), «idle» (turno del jugador) y «target» (eligiendo objetivo).
 */
const Controller = class {
  /** `opts`: rules, stage, scene, hud, units, board, vfx, bus, init (battle_start), cellToWorld, bounds, standalone, shotMode, surprised, meta. */
  constructor(opts) {
    ((this.rules = opts.rules),
      (this.S = opts.stage),
      (this.scene = opts.scene),
      (this.hud = opts.hud),
      (this.units = opts.units),
      (this.board = opts.board),
      (this.vfx = opts.vfx),
      (this.bus = opts.bus || null),
      (this.cellToWorld = opts.cellToWorld),
      (this.bounds = opts.bounds),
      (this.standalone = !!opts.standalone),
      (this.shotMode = !!opts.shotMode),
      (this.meta = opts.meta || {}),
      (this.state = opts.init.state),
      (this.encounter = opts.init.state.encounter || {}),
      (this.initEvents = opts.init.events || []),
      (this.surprised = new Set(opts.surprised || [])),
      (this.mode = 'busy'),
      (this.pending = null),
      (this.opts = null),
      (this.speed = 1),
      (this.turbo = 1),
      (this.fast = !1),
      (this.camGoal = null),
      (this.ray = new Raycaster()),
      (this.ptr = new Vector2()),
      (this.hoverKey = ''),
      (this.turnDone = null),
      (this.allEvents = []),
      (this.zoneKinds = new Map()),
      (this.recentImpact = new Map()),
      (this.forms = new Map()),
      (this.off = []),
      (this.disposed = !1),
      (this.vfx.onFx = (kind, data) => this.bus?.emit('battle:fx', { ...data, kind })),
      (this.vfx.bloodless = !1),
      this.bindInput(),
      this.hud.bind(this),
      this.hud.setup(this.state, this.units, this.encounter),
      this.hud.setSurprised([...this.surprised]));
    for (let id of this.meta.auto || []) this.hud.setAuto(id, !0);
    this.syncAuras();
  }
  /** Criatura del estado del núcleo por id. */
  creature(id) {
    return this.state.creatures.find((c) => c.id === id);
  }
  /** Unidad (figura) por id. */
  unit(id) {
    return this.units.byId.get(id);
  }
  /** Pide `state` al núcleo y actualiza HUD y auras. */
  refresh() {
    let state = this.rules('state');
    return (
      state && !state.error && (state.encounter || (state.encounter = this.encounter), (this.state = state)),
      this.hud.refresh(this.state),
      this.syncAuras(),
      this.state
    );
  }
  /** Auras de estado de cada unidad y tamaño por Agrandar/Reducir. */
  syncAuras() {
    for (let creature of this.state.creatures) {
      let unit = this.unit(creature.id);
      if (!unit) continue;
      this.vfx.auras.sync(creature.id, anchorsOf(unit), unit.dead ? new Set() : BS(creature));
      let kinds = new Set((creature.effects || []).map((effect) => effect.kind)),
        size = kinds.has('enlarged') ? 1.35 : kinds.has('reduced') ? 0.7 : 1;
      (unit.sizeK === void 0 && (unit.sizeK = 1),
        unit.sizeK !== size && (unit.root.scale.multiplyScalar(size / unit.sizeK), (unit.sizeK = size)));
    }
  }
  /** Espera ajustada a la velocidad (turnos rápidos y ?turbo). */
  wait(ms) {
    return sleep(ms / this.speed / this.turbo);
  }
  /** Datos de anclaje de una unidad para los efectos (pos, pecho, cabeza, mano, frente, aliado). */
  who(unitOrId) {
    let unit = typeof unitOrId == 'string' ? this.unit(unitOrId) : unitOrId;
    if (!unit) return null;
    let pos = unit.root.getWorldPosition(new Vector3()),
      yaw = unit.targetYaw ?? unit.root.rotation.y;
    return {
      id: unit.id,
      pos,
      chest: unit.chest(),
      head: unit.headWorld(),
      hand: handWorld(unit),
      fwd: new Vector3(Math.sin(yaw), 0, Math.cos(yaw)),
      ally: unit.team === 0,
    };
  }
  /** Punto del plano hexagonal → mundo (a la altura del suelo de su casilla). */
  planeToWorld(point) {
    let cell = planeToCell(point[0], point[1]),
      ground = this.cellToWorld(cell);
    return new Vector3(point[0] * HEX_SIZE, ground.y, point[1] * HEX_SIZE);
  }
  /** Emite por el bus sin dejar que un oyente rompa el combate. */
  emit(name, data) {
    try {
      this.bus?.emit(name, data);
    } catch (err) {
      console.error('[combate] bus', name, err);
    }
  }
  /** Lleva la cámara hacia un punto (si no está ya cómodo en pantalla, salvo `force`). */
  focus(point, dist = null, force = !1) {
    if (!force && this.comfortable(point, dist)) return;
    let goalDist = dist ?? this.camGoal?.dist ?? null;
    this.camGoal = { target: new Vector3(point.x, (point.y || 0) + 0.6, point.z), dist: goalDist };
  }
  /** ¿Se ve bien el punto (cerca del centro) a la distancia pedida? */
  comfortable(point, dist) {
    let ndc = new Vector3(point.x, (point.y || 0) + 0.6, point.z).project(this.S.camera);
    if (ndc.z > 1) return !1;
    let centered = Math.abs(ndc.x) < 0.55 && Math.abs(ndc.y) < 0.5,
      current = this.camDist(),
      distOk = !dist || Math.abs(current - dist) / dist < 0.35;
    return centered && distOk;
  }
  focusUnit(unit, dist = null, force = !1) {
    unit && this.focus(unit.root.getWorldPosition(new Vector3()), dist, force);
  }
  /** Encuadra a dos unidades (atacante y objetivo). */
  framePair(first, second, force = !1) {
    if (!first || !second) return;
    let posA = first.root.getWorldPosition(new Vector3()),
      posB = second.root.getWorldPosition(new Vector3());
    if (!force && this.comfortable(posA, null) && this.comfortable(posB, null)) return;
    let gap = posA.distanceTo(posB);
    this.focus(
      posA.clone().add(posB).multiplyScalar(0.5),
      Math.max(Math.min(this.camDist(), 30), gap * 1.25 + 12),
      !0,
    );
  }
  /** Encuadra un área de casillas. */
  frameArea(cells) {
    if (!cells || !cells.length) return;
    let points = cells.map((cell) => this.cellToWorld(cell)),
      center = points.reduce((sum, p) => sum.add(p), new Vector3()).divideScalar(points.length),
      radius = 0;
    for (let point of points) radius = Math.max(radius, point.distanceTo(center));
    this.focus(center, Math.max(this.camDist(), radius * 2.4 + 12));
  }
  /** Centra la cámara en quien tiene el turno. */
  centerOnCurrent() {
    let unit = this.unit(this.state.current);
    unit && this.focusUnit(unit, 24, !0);
  }
  camDist() {
    return this.S.camera.position.distanceTo(this.S.controls.target);
  }
  /** Fotograma: tablero, cámara hacia su meta, límites del mapa y teclado (WASD/flechas, Q/E). */
  update(dt) {
    if ((this.board.update(dt), this.camGoal)) {
      let controls = this.S.controls,
        k = Math.min(1, dt * 3.2),
        prevTarget = controls.target.clone();
      if (
        (controls.target.lerp(this.camGoal.target, k),
        this.S.camera.position.add(controls.target.clone().sub(prevTarget)),
        this.camGoal.dist)
      ) {
        let offset = this.S.camera.position.clone().sub(controls.target),
          len = offset.length();
        (offset.setLength(len + (this.camGoal.dist - len) * k), this.S.camera.position.copy(controls.target).add(offset));
      }
      controls.target.distanceTo(this.camGoal.target) < 0.02 &&
        (!this.camGoal.dist || Math.abs(this.camDist() - this.camGoal.dist) < 0.05) &&
        (this.camGoal = null);
    }
    let target = this.S.controls.target,
      bounds = this.bounds;
    if (bounds) {
      let x = MathUtils.clamp(target.x, bounds.minX - 6, bounds.maxX + 6),
        z = MathUtils.clamp(target.z, bounds.minZ - 5, bounds.maxZ + 5);
      (x !== target.x || z !== target.z) &&
        ((this.S.camera.position.x += x - target.x), (this.S.camera.position.z += z - target.z), (target.x = x), (target.z = z));
    }
    if (this.keys && this.keys.size) {
      let move = new Vector3(),
        fwd = target.clone().sub(this.S.camera.position).setY(0).normalize(),
        right = new Vector3(-fwd.z, 0, fwd.x);
      ((this.keys.has('w') || this.keys.has('arrowup')) && move.add(fwd),
        (this.keys.has('s') || this.keys.has('arrowdown')) && move.sub(fwd),
        (this.keys.has('d') || this.keys.has('arrowright')) && move.add(right),
        (this.keys.has('a') || this.keys.has('arrowleft')) && move.sub(right),
        move.lengthSq() && (move.setLength(dt * 14), target.add(move), this.S.camera.position.add(move), (this.camGoal = null)),
        (this.keys.has('q') || this.keys.has('e')) && this.rotate(this.keys.has('q') ? dt * 1.6 : -dt * 1.6));
    }
  }
  /** Gira la cámara alrededor de su objetivo. */
  rotate(angle) {
    let target = this.S.controls.target,
      offset = this.S.camera.position.clone().sub(target);
    (offset.applyAxisAngle(new Vector3(0, 1, 0), angle), this.S.camera.position.copy(target).add(offset));
  }
  /** Centro de las unidades vivas de un equipo. */
  centroid(team) {
    let alive = this.units.list.filter((u) => u.team === team && !u.dead);
    return alive.length
      ? alive
          .reduce((sum, u) => sum.add(u.root.getWorldPosition(new Vector3())), new Vector3())
          .divideScalar(alive.length)
      : null;
  }
  /** Ejecuta el combate; la promesa da {won, fled, events, rounds}. */
  run() {
    return new Promise((resolve) => {
      ((this.resolveRun = resolve),
        this.start().catch((err) => {
          (console.error('[combate]', err), this.finish());
        }));
    });
  }
  /** Presentación: cámara, registro, «battle:start», sorpresa/emboscada y eventos iniciales; luego el bucle. */
  async start() {
    let stage = this.S,
      partyCenter = this.centroid(0) || new Vector3(),
      enemyCenter = this.centroid(1) || partyCenter.clone(),
      mid = partyCenter.clone().add(enemyCenter).multiplyScalar(0.5),
      aspect = innerWidth / innerHeight;
    if (this.standalone) {
      let bounds = this.bounds,
        center = bounds ? new Vector3((bounds.minX + bounds.maxX) / 2, 0, (bounds.minZ + bounds.maxZ) / 2) : mid;
      stage.controls.target.set(center.x, 0.6, center.z);
      let dist = aspect < 1 ? 50 : aspect < 1.5 ? 42 : 37,
        tilt = 1.02;
      (stage.camera.position.copy(stage.controls.target).add(new Vector3(0, Math.sin(tilt) * dist, Math.cos(tilt) * dist)),
        stage.camera.lookAt(stage.controls.target));
    } else this.focus(mid, Math.max(this.camDist(), partyCenter.distanceTo(enemyCenter) * 1.1 + 14), !0);
    if (
      (this.hud.log(
        `<b>${this.encounter.name || 'Combate'}</b>${this.encounter.place ? ` \xB7 ${this.encounter.place}` : ''}`,
      ),
      this.meta.emitStartEnd &&
        this.emit('battle:start', {
          group: this.meta.group ?? null,
          groups: this.meta.groups ?? null,
          surprise: this.meta.surprise ?? null,
          level: this.meta.level ?? null,
          encounter: this.encounter.id,
          creatures: this.state.creatures.map((c) => ({ id: c.id, team: c.team, name: c.name })),
        }),
      this.standalone &&
        !this.shotMode &&
        !this.meta.skipIntro &&
        (this.focus(enemyCenter, 30, !0), await this.hud.intro(this.encounter)),
      this.focus(partyCenter, aspect < 1 ? 44 : 35, !0),
      this.surprised.size && !this.shotMode)
    ) {
      let enemiesSurprised = [...this.surprised].every((id) => this.creature(id)?.team === 1),
        partySurprised = [...this.surprised].every((id) => this.creature(id)?.team === 0);
      enemiesSurprised
        ? await this.hud.big(
            '\xA1Sorpresa!',
            'Los enemigos no os han visto venir: tiran la iniciativa con desventaja.',
            '',
            1900,
          )
        : partySurprised &&
          (await this.hud.big(
            '\xA1Emboscada!',
            'Os han pillado desprevenidos: el grupo tira la iniciativa con desventaja.',
            'malo',
            1900,
          ));
    } else
      !this.standalone &&
        !this.shotMode &&
        this.hud.banner('\xA1Combate!', 'oro', 1200, this.encounter.name || '');
    (await this.play(this.initEvents), this.refresh(), await this.loop());
  }
  /** Bucle de turnos hasta que el núcleo da el combate por terminado. */
  async loop() {
    let guard = 0;
    for (; !this.state.over && !this.disposed && guard++ < 3e3;) {
      let creature = this.creature(this.state.current);
      if (!creature) break;
      if (
        (this.hud.refresh(this.state),
        this.emit('battle:turn', {
          creature: creature.id,
          isPc: creature.team === 0,
          name: creature.name,
          round: this.state.round,
        }),
        creature.team === 0 && creature.can_act && !this.autoParty && !this.isAuto(creature)
          ? await this.playerTurn(creature)
          : await this.aiTurn(creature),
        this.disposed)
      )
        return;
      if ((this.refresh(), this.state.over)) break;
      (await this.play(this.rules('end_turn').events),
        this.refresh(),
        this.round1 && this.state.round > 1 && (this.round1 = !1),
        this.state.round > 1 && this.surprised.size && (this.surprised.clear(), this.hud.setSurprised([])));
    }
    await this.finish();
  }
  /** ¿Lleva la IA a este miembro del grupo? */
  isAuto(creature) {
    return this.meta.auto?.has?.(creature.id) || !1;
  }
  /** Activa o quita la IA de un miembro (si es su turno, la IA lo termina). */
  toggleAuto(id) {
    this.meta.auto instanceof Set || (this.meta.auto = new Set(this.meta.auto || []));
    let on = !this.meta.auto.has(id);
    if (
      (on ? this.meta.auto.add(id) : this.meta.auto.delete(id),
      this.hud.setAuto(id, on),
      on && this.turnDone && this.state.current === id && this.mode !== 'busy')
    ) {
      let done = this.turnDone;
      ((this.turnDone = null),
        (this.mode = 'busy'),
        this.clearTargeting(),
        this.hud.turnBar(null),
        this.aiTurn(this.creature(id)).then(done));
    }
  }
  /** Turno de la IA del núcleo (`ai_turn`) con su reproducción. */
  async aiTurn(creature) {
    ((this.mode = 'busy'), this.clearTargeting());
    let enemy = creature.team === 1;
    ((this.speed = enemy ? (this.fast ? 2.6 : 1.5) : 1),
      (this.vfx.timeScale = this.turbo * (enemy && this.fast ? 1.6 : 1)));
    let unit = this.unit(creature.id);
    if (creature.hp > 0 && !creature.dead) {
      (this.setActive(creature.id),
        this.focusUnit(unit, null, !this.comfortable(unit.root.position, null)),
        this.hud.thinking(`Turno de ${shortName(creature)}\u2026`),
        enemy && !this.fast && !this.shotMode && this.hud.banner(shortName(creature), 'enemigo', 650),
        await this.wait(enemy ? 420 : 260));
      let res = this.rules('ai_turn');
      (this.hud.thinking(''), await this.play(res.events || []), await this.wait(enemy ? 260 : 180));
    }
    ((this.speed = 1), (this.vfx.timeScale = this.turbo));
  }
  /** Turno del jugador: promesa que se cumple al terminar el turno. */
  playerTurn(creature) {
    return new Promise((resolve) => {
      ((this.turnDone = resolve),
        (this.speed = 1),
        (this.vfx.timeScale = this.turbo),
        this.focusUnit(this.unit(creature.id), null, !1),
        this.hud.banner(`Turno de ${shortName(creature)}`, 'oro', 900),
        this.enterIdle(creature));
    });
  }
  /** Termina el turno del jugador. */
  endTurn() {
    if (!this.turnDone) return;
    ((this.mode = 'busy'), this.clearTargeting(), this.hud.turnBar(null));
    let done = this.turnDone;
    ((this.turnDone = null), done());
  }
  /** Marca la unidad activa (anillo y HUD). */
  setActive(id) {
    for (let unit of this.units.list) unit.setRing(unit.id === id ? 'active' : 'idle');
    this.hud.setActive(id);
  }
  /** Resalta una unidad al pasar por su ficha de iniciativa. */
  highlight(id, on) {
    let unit = this.unit(id);
    !unit ||
      unit.dead ||
      (on && unit.ringState === 'idle' ? unit.setRing('hover') : !on && unit.ringState === 'hover' && unit.setRing('idle'));
  }
  /** Vuelve al modo de turno del jugador: pide `options` y muestra el alcance de movimiento. */
  enterIdle(creature) {
    ((creature = this.creature(creature.id) || creature),
      (this.mode = 'idle'),
      (this.pending = null),
      this.hud.hidePreview(),
      this.hud.prompt(''),
      this.hud.closeSheet(),
      (this.opts = this.rules('options') || {}),
      this.setActive(creature.id),
      this.showMoveRange(creature),
      this.hud.turnBar(creature, this.opts),
      this.opts.nothing_left &&
        setTimeout(() => {
          this.mode === 'idle' && this.state.current === creature.id && this.endTurn();
        }, 700));
  }
  /** Casillas alcanzables (movimiento y carrera) según `options`. */
  showMoveRange(creature) {
    let opts = this.opts;
    (this.board.clear(), (this.moveMap = new Map()));
    for (let [x, y, ft, px, py] of opts.move || [])
      this.moveMap.set(cellKey(x, y), { cell: [x, y], ft, prev: [px, py], dash: !1 });
    this.dashMap = new Map();
    for (let [x, y, ft, px, py] of opts.dash || [])
      this.moveMap.has(cellKey(x, y)) ||
        this.dashMap.set(cellKey(x, y), { cell: [x, y], ft, prev: [px, py], dash: !0 });
    let here = cellKey(...creature.cell);
    (this.board.set(
      'move',
      [...this.moveMap.values()].filter((m) => cellKey(...m.cell) !== here).map((m) => m.cell),
      5941503,
    ),
      this.board.set(
        'dash',
        [...this.dashMap.values()].map((m) => m.cell),
        16763989,
      ));
  }
  /** Camino hasta una casilla siguiendo los «prev» del alcance; {path, dash, ft}. */
  pathTo(cell, from) {
    let key = cellKey(...cell),
      map = this.moveMap?.has(key) ? this.moveMap : this.dashMap?.has(key) ? this.dashMap : null;
    if (!map) return null;
    let path = [],
      node = map.get(key),
      guard = 0;
    for (; node && guard++ < 80 && !(node.cell[0] === from[0] && node.cell[1] === from[1]);) {
      path.unshift(node.cell);
      let prevKey = cellKey(...node.prev);
      if (prevKey === cellKey(...node.cell)) break;
      node = map.get(prevKey) || (map === this.dashMap ? this.moveMap.get(prevKey) : null);
    }
    return { path, dash: map === this.dashMap, ft: map.get(key).ft };
  }
  /** Quita resaltados, notas, previsión, indicación y hoja. */
  clearTargeting() {
    (this.board.clear(),
      this.hud.cursorNote(''),
      (this.hoverKey = ''),
      this.hud.hidePreview(),
      this.hud.prompt(''),
      this.hud.closeSheet(),
      this.hud.hideTip());
    for (let unit of this.units.list)
      (unit.ringState === 'target' || unit.ringState === 'hover' || unit.ringState === 'threat') && unit.setRing('idle');
  }
  /** Cancela la elección de objetivo en curso. */
  cancelPending() {
    let creature = this.creature(this.state.current);
    this.mode === 'target' && creature && this.turnDone ? this.enterIdle(creature) : this.hud.hidePreview();
  }
  /** addEventListener que se retira al desmontar. */
  listen(target, type, fn, opts) {
    (target.addEventListener(type, fn, opts), this.off.push(() => target.removeEventListener(type, fn, opts)));
  }
  /** Ratón/toque (clic sin arrastre) y teclado (Esc, espacio, 1–5, Z, C, F, L, cámara). */
  bindInput() {
    let canvas = this.S.renderer.domElement,
      down = null;
    (this.listen(canvas, 'pointerdown', (ev) => {
      ev.button === 0 && (down = [ev.clientX, ev.clientY, performance.now()]);
    }),
      this.listen(canvas, 'pointerup', (ev) => {
        if (ev.button !== 0 || !down) return;
        let dist = Math.hypot(ev.clientX - down[0], ev.clientY - down[1]);
        ((down = null), !(dist > 8) && this.onTap(ev));
      }),
      this.listen(canvas, 'pointermove', (ev) => this.onHover(ev)),
      this.listen(canvas, 'contextmenu', (ev) => ev.preventDefault()),
      this.listen(canvas, 'pointerleave', () => this.hud.hideTip()),
      (this.keys = new Set()),
      this.listen(window, 'keydown', (ev) => {
        if (ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA')) return;
        let key = ev.key.toLowerCase();
        if (key === 'escape') {
          this.hud.sheetOpen()
            ? this.hud.closeSheet()
            : this.mode === 'target' || this.hud.previewOpen()
              ? this.cancelPending()
              : this.meta.ui?.open && this.meta.ui.open('pausa', { combat: !0 });
          return;
        }
        if (key === ' ' || key === 'enter') {
          this.hud.previewOpen() && this.hud.onConfirm
            ? (ev.preventDefault(), this.hud.confirmPreview())
            : this.mode === 'idle' && this.turnDone && (ev.preventDefault(), this.endTurn());
          return;
        }
        let menu = { 1: 'attack', 2: 'spells', 3: 'features', 4: 'actions', 5: 'items' }[key];
        if (menu && this.turnDone) {
          this.menu(menu);
          return;
        }
        if (key === 'z' && this.turnDone) return void this.undoMove();
        if (key === 'c') return void this.centerOnCurrent();
        if (key === 'f') return void this.hud.toggleFast();
        if (key === 'l') return void this.hud.toggleLog();
        this.keys.add(key);
      }),
      this.listen(window, 'keyup', (ev) => this.keys.delete(ev.key.toLowerCase())),
      this.listen(window, 'blur', () => this.keys.clear()));
  }
  /** Qué hay bajo el puntero: {cell, gp (punto del suelo), creature}. */
  pick(ev) {
    let rect = this.S.renderer.domElement.getBoundingClientRect();
    (this.ptr.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1),
      this.ray.setFromCamera(this.ptr, this.S.camera));
    let hits = this.ray.intersectObjects(this.units.proxies, !1),
      hitUnit = null;
    for (let hit of hits) {
      let unit = this.unit(hit.object.userData.unit),
        creature = unit && this.creature(unit.id);
      if (creature && !creature.dead) {
        hitUnit = unit;
        break;
      }
    }
    let ground = this.board.ground(this.ray),
      cell = ground ? this.board.cellAtWorld(ground) : null;
    hitUnit && (cell = hitUnit.cell.slice());
    let occupant = cell ? this.state.creatures.find((c) => !c.dead && c.cell[0] === cell[0] && c.cell[1] === cell[1]) : null;
    return { cell, gp: ground, creature: occupant || (hitUnit ? this.creature(hitUnit.id) : null) };
  }
  /** Puntero encima: ficha, ruta con coste y amenazas, cursor y previsión de áreas. */
  onHover(ev) {
    if (this.disposed) return;
    let hit = this.pick(ev),
      current = this.creature(this.state.current),
      myTurn = this.turnDone && current && current.team === 0;
    hit.creature
      ? this.hud.tip(hit.creature, ev.clientX, ev.clientY, !1, this.tipExtra(current, hit.creature))
      : this.hud.hideTip();
    for (let unit of this.units.list) unit.ringState === 'hover' && unit.setRing('idle');
    if (hit.creature && hit.creature.id !== this.state.current) {
      let unit = this.unit(hit.creature.id);
      unit && unit.ringState === 'idle' && unit.setRing('hover');
    }
    let key = hit.cell ? cellKey(...hit.cell) : '';
    if (!myTurn) {
      (this.board.clear('hover'), (this.S.renderer.domElement.style.cursor = 'default'));
      return;
    }
    let cursor = 'default';
    if (this.mode === 'idle')
      if (
        (hit.creature && hit.creature.team !== 0 && hit.creature.hp > 0
          ? (cursor = 'crosshair')
          : hit.cell && (this.moveMap?.has(key) || this.dashMap?.has(key)) && (cursor = 'pointer'),
        key !== this.hoverKey)
      ) {
        ((this.hoverKey = key), this.board.clear('path', 'hover', 'threat'));
        for (let unit of this.units.list) unit.ringState === 'threat' && unit.setRing('idle');
        if (hit.cell && !hit.creature && (this.moveMap.has(key) || this.dashMap.has(key))) {
          let route = this.pathTo(hit.cell, current.cell);
          if (route) {
            let threats = this.threatsOf(route.path),
              color = threats.length ? 16742992 : route.dash ? 16766842 : 15397631;
            (this.board.route(current.cell, route.path, color), this.board.set('path', [hit.cell], color));
            for (let id of threats) this.unit(id)?.setRing('threat');
            this.hud.cursorNote(
              `${formatNumber((route.ft / 5) * 1.5)} m${route.dash ? ' \xB7 corriendo' : ''}${threats.length ? ' \xB7 \xA1ataque de oportunidad!' : ''}`,
              ev.clientX,
              ev.clientY,
            );
          }
        } else this.hud.cursorNote('');
        hit.creature &&
          hit.creature.team !== 0 &&
          hit.creature.hp > 0 &&
          this.board.set('hover', [hit.cell], 16734778);
      } else this.hud.cursorNoteVisible() && this.hud.moveCursorNote(ev.clientX, ev.clientY);
    else if (this.mode === 'target' && this.pending) {
      let kind = this.pending.kind;
      if (
        (kind === 'spell' || kind === 'feature') &&
        (this.pending.target === 'point' || this.pending.target === 'direction') &&
        hit.gp
      ) {
        cursor = 'crosshair';
        let now = performance.now();
        !this.pending.locked &&
          now - (this.lastAreaHover || 0) > 60 &&
          ((this.lastAreaHover = now),
          kind === 'spell' ? this.previewArea(worldToPlane(hit.gp), !0) : this.previewFeatureArea(hit, !0));
      } else hit.creature && (cursor = 'pointer');
    }
    this.S.renderer.domElement.style.cursor = cursor;
  }
  /** Ids de los enemigos que harían un ataque de oportunidad en ese camino (cacheado). */
  threatsOf(path) {
    let key = path.map((cell) => cell.join(',')).join(';');
    if (this._threatKey === key) return this._threatIds;
    let names = this.rules('threats', { path }) || [],
      ids = [];
    for (let name of Array.isArray(names) ? names : []) {
      let creature = this.state.creatures.find((c) => c.name === name && c.team !== 0);
      creature && ids.push(creature.id);
    }
    return ((this._threatKey = key), (this._threatIds = ids), ids);
  }
  /** Probabilidad de impacto del ataque por defecto para la ficha del enemigo. */
  tipExtra(current, target) {
    if (!current || current.team !== 0 || !this.turnDone || target.team === 0 || target.hp <= 0 || this.mode !== 'idle') return '';
    if (!this._planCache || this._planCache.id !== target.id || this._planCache.turn !== current.id) {
      let fresh = this.rules('attack_plan', { target: target.id, key: '' });
      this._planCache = { id: target.id, turn: current.id, plan: fresh };
    }
    let plan = this._planCache.plan;
    return plan?.ok
      ? `<span>${plan.name}: ${Math.round(plan.p_hit * 100)} % de impacto</span>`
      : plan?.reason
        ? `<span class="dim">${plan.reason}</span>`
        : '';
  }
  /** Clic o toque en el tablero. */
  onTap(ev) {
    if (this.mode === 'busy' || this.disposed) return;
    if (this.hud.sheetOpen()) {
      this.hud.closeSheet();
      return;
    }
    let creature = this.creature(this.state.current);
    if (!creature || creature.team !== 0 || !this.turnDone) return;
    let hit = this.pick(ev);
    (!hit.cell && !hit.gp) ||
      (this.mode === 'idle' ? this.tapIdle(creature, hit, ev) : this.mode === 'target' && this.tapTarget(creature, hit, ev));
  }
  /** Clic en modo libre: atacar a un enemigo, ver a un aliado o moverse (avisando de ataques de oportunidad). */
  async tapIdle(creature, hit, ev) {
    let other = hit.creature;
    if (other && other.team !== creature.team && other.hp > 0) {
      this.proposeAttack(creature, other, '');
      return;
    }
    if (other) {
      this.hud.tip(other, ev.clientX, ev.clientY, !0);
      return;
    }
    if (!hit.cell) return;
    let route = this.pathTo(hit.cell, creature.cell);
    if (!route) {
      this.hud.banner('No llegas ah\xED', 'apagado', 700);
      return;
    }
    let threats = this.rules('threats', { path: route.path });
    if (threats.length) {
      ((this.mode = 'target'),
        (this.pending = { kind: 'move', path: route.path, dash: route.dash, cell: hit.cell }),
        this.board.route(creature.cell, route.path, 16742992),
        this.hud.preview(
          this.cellToWorld(hit.cell),
          [
            {
              t: 'bad',
              s: `Cuidado: al alejarte provocar\xE1s un ataque de oportunidad de ${threats.join(', ')}.`,
            },
            { t: 'dim', s: 'Usa Destrabarse para evitarlo.' },
          ],
          'Moverse igualmente',
          () => this.doMove(creature, route.path, route.dash),
        ),
        this.hud.prompt('Movimiento arriesgado', !0));
      return;
    }
    await this.doMove(creature, route.path, route.dash);
  }
  /** Mueve por el camino con el núcleo y reproduce los eventos. */
  async doMove(creature, path, dash) {
    ((this.mode = 'busy'), this.clearTargeting());
    let res = this.rules('move', { path, dash });
    (await this.play(res.events), this.afterAction(creature));
  }
  /** Tras una acción: termina el turno si acabó el combate o la criatura ya no puede actuar. */
  afterAction(creature) {
    if (this.disposed) return;
    if ((this.refresh(), this.state.over)) {
      this.endTurn();
      return;
    }
    let fresh = this.creature(creature.id);
    if (this.state.current !== creature.id || !fresh || !fresh.can_act) {
      this.endTurn();
      return;
    }
    this.enterIdle(fresh);
  }
  /** Previsión de ataque (`attack_plan`) con armas alternativas; segundo clic o botón para atacar. */
  proposeAttack(attacker, target, key) {
    let plan = this.rules('attack_plan', { target: target.id, key });
    if (!plan.ok) {
      this.hud.banner(plan.reason || 'No puedes', 'apagado', 900);
      return;
    }
    ((this.mode = 'target'), (this.pending = { kind: 'attack', plan }));
    let targetUnit = this.unit(target.id),
      attackerUnit = this.unit(attacker.id);
    (this.board.clear('move', 'dash', 'hover', 'path'),
      this.board.set('target', [target.cell], 16730672),
      plan.path.length && this.board.route(attacker.cell, plan.path, plan.risky ? 16742992 : 15397631),
      targetUnit.setRing('target'),
      this.framePair(attackerUnit, targetUnit));
    let others = plan.others.map((other) => ({ label: other.name, on: () => this.proposeAttack(attacker, target, other.key) }));
    (this.hud.preview(targetUnit.headWorld(), plan.lines, plan.button, () => this.executeAttack(), others, !0, plan.p_hit),
      this.hud.prompt(`${TAP_AGAIN} ${target.name} o confirma`, !0));
  }
  /** Ataca con el plan elegido; ofrece la otra mano si se puede. */
  async executeAttack() {
    let creature = this.creature(this.state.current),
      plan = this.pending.plan;
    ((this.mode = 'busy'), this.clearTargeting());
    let res = this.rules('attack', { key: plan.key, target: plan.target, path: plan.path });
    if ((await this.play(res.events), this.refresh(), res.offhand && !this.state.over)) {
      this.offerOffhand(creature, res.offhand);
      return;
    }
    this.afterAction(creature);
  }
  /** Ofrece el ataque con la mano torpe. */
  offerOffhand(creature, off) {
    ((this.mode = 'target'), (this.pending = { kind: 'offhand', off }));
    let targetUnit = this.unit(off.target);
    (targetUnit.setRing('target'),
      this.hud.preview(
        targetUnit.headWorld(),
        [
          { t: 'b', s: 'Ataque con la otra mano' },
          {
            t: '',
            s: `${off.name} contra ${off.target_name} (acci\xF3n adicional, sin modificador al da\xF1o).`,
          },
        ],
        'Golpear',
        async () => {
          ((this.mode = 'busy'),
            this.clearTargeting(),
            await this.play(this.rules('offhand', { key: off.key, target: off.target }).events),
            this.afterAction(creature));
        },
      ),
      this.hud.prompt('\xBFAtacar tambi\xE9n con la otra mano?', !0));
  }
  /** Elegir objetivo para un arma concreta del menú de ataque. */
  startAttackPick(creature, key) {
    ((this.mode = 'target'), (this.pending = { kind: 'attack_pick', key }));
    let cells = [];
    for (let c of this.state.creatures) {
      if (c.team === creature.team || c.dead || c.hp <= 0) continue;
      this.rules('attack_plan', { target: c.id, key }).ok && cells.push(c.cell);
    }
    (this.board.clear('hover', 'path'), this.board.set('target', cells, 16730672));
    let profile = (this.opts.profiles || []).find((p) => p.key === key);
    this.hud.prompt(cells.length ? `Elige objetivo: ${profile ? profile.name : ''}` : 'Nadie a tu alcance con esa arma', !0);
  }
  /** Elegir el nivel del espacio si el conjuro se puede subir. */
  chooseSpell(creature, spell) {
    let slots = spell.slots || [];
    if (slots.length > 1 && spell.upcastable) {
      this.hud.sheet(
        '\xBFA qu\xE9 nivel?',
        slots.map((lvl) => ({
          id: String(lvl),
          icon: 'magic',
          title: `Nivel ${lvl}`,
          cost: `${creature.slots[lvl - 1] ?? 0} libres`,
          desc: `Lanzar ${spell.name} con un espacio de nivel ${lvl}.`,
          enabled: !0,
          magic: !0,
        })),
        (entry) => this.startSpell(creature, spell, Number(entry.id)),
      );
      return;
    }
    this.startSpell(creature, spell, slots.length ? slots[0] : 0);
  }
  /** Empieza un conjuro (`spell_begin`) y prepara la elección según su tipo de objetivo. */
  startSpell(creature, spell, slot) {
    let begin = this.rules('spell_begin', { spell: spell.id, slot });
    ((this.mode = 'target'),
      (this.pending = {
        kind: 'spell',
        spell: spell.id,
        name: begin.name,
        slot,
        target: begin.target,
        area: begin.area,
        max: begin.max,
        n: begin.n,
        valid: begin.valid || [],
        cells: begin.cells || [],
        targets: [],
      }),
      this.board.clear());
    let target = begin.target;
    if (target === 'self') {
      ((this.pending.targets = [creature.id]),
        begin.area
          ? ((this.pending.locked = !0),
            this.previewArea(null, !1),
            this.hud.prompt(`${begin.name}: confirma para lanzarlo a tu alrededor`, !0))
          : this.confirmSpell());
      return;
    }
    if (target === 'point' || target === 'direction') {
      (target === 'point' && this.board.set('range', begin.cells, 11832575),
        this.hud.prompt(
          target === 'point'
            ? `${begin.name}: elige d\xF3nde centrar el \xE1rea`
            : `${begin.name}: elige hacia d\xF3nde lanzarlo`,
          !0,
        ));
      return;
    }
    if (target === 'cell') {
      (this.board.set('range', begin.cells, 11832575), this.hud.prompt(`${begin.name}: elige una casilla`, !0));
      return;
    }
    if (target === 'darts' || target === 'rays') {
      (this.highlightSpellTargets(creature),
        this.hud.prompt(
          begin.n === 1
            ? `${begin.name}: elige objetivo`
            : `${begin.name}: reparte ${begin.n} ${target === 'darts' ? 'dardos' : 'rayos'} entre los enemigos`,
          !0,
        ));
      return;
    }
    (this.highlightSpellTargets(creature),
      this.pending.valid.length
        ? this.hud.prompt(
            `${begin.name}: elige ${begin.max === 1 ? 'objetivo' : `hasta ${begin.max} objetivos`}`,
            !0,
            begin.max > 1
              ? { label: 'Lanzar', on: () => this.pending.targets.length && this.confirmSpell() }
              : null,
          )
        : this.hud.prompt(`${begin.name}: no hay objetivos v\xE1lidos`, !0));
  }
  /** Resalta los objetivos válidos del conjuro. */
  highlightSpellTargets(creature) {
    let cells = [],
      colors = [];
    for (let id of this.pending.valid) {
      let c = this.creature(id);
      c && (cells.push(c.cell), colors.push(c.team !== creature.team ? 12619007 : 7331978));
    }
    this.board.set('target', cells, (cell, i) => colors[i]);
  }
  /** Área del conjuro en un punto o dirección (`spell_preview`) y previsión; `hover` no fija nada. */
  previewArea(point, hover) {
    let pending = this.pending,
      req = { spell: pending.spell, slot: pending.slot, targets: pending.targets };
    (point && pending.target === 'point' && (req.point = [point.x, point.y]),
      point && pending.target === 'direction' && (req.dir = [point.x, point.y]));
    let res = this.rules('spell_preview', req);
    if (!res.ok)
      return (
        this.board.clear('area'),
        hover || this.hud.banner(res.reason || 'Fuera de alcance', 'apagado', 700),
        null
      );
    let allyCells = new Set((res.allies_hit || []).map((id) => cellKey(...this.creature(id).cell)));
    this.board.set('area', res.area || [], (cell) => (allyCells.has(cellKey(...cell)) ? 16728112 : 11566335));
    for (let unit of this.units.list) unit.ringState === 'target' && unit.setRing('idle');
    for (let cell of res.area || []) {
      let occupant = this.state.creatures.find((c) => !c.dead && c.cell[0] === cell[0] && c.cell[1] === cell[1]);
      occupant && this.unit(occupant.id)?.setRing('target');
    }
    if (!hover) {
      (res.point && (pending.point = res.point), req.dir && (pending.dir = req.dir), (pending.area = res.area || []));
      let at =
        res.area && res.area.length
          ? this.cellToWorld(res.area[Math.floor(res.area.length / 2)])
          : this.unit(this.state.current).root.position;
      this.hud.preview(at, res.lines, 'Lanzar', () => this.confirmSpell(), [], res.can !== !1);
    }
    return res;
  }
  /** Clic al apuntar un conjuro (punto, dirección, casilla, dardos/rayos u objetivos). */
  tapSpell(creature, hit) {
    let pending = this.pending,
      target = pending.target;
    if (target === 'point' || target === 'direction') {
      if (!hit.gp) return;
      let point = worldToPlane(hit.gp);
      if (target === 'point' && pending.point && Math.hypot(pending.point[0] - point.x, pending.point[1] - point.y) < 0.6) {
        this.confirmSpell();
        return;
      }
      if (
        target === 'direction' &&
        pending.area &&
        hit.cell &&
        pending.area.some((c) => c[0] === hit.cell[0] && c[1] === hit.cell[1]) &&
        pending.dir
      ) {
        this.confirmSpell();
        return;
      }
      ((pending.locked = !1), this.previewArea(point, !1) && (pending.locked = !0));
      return;
    }
    if (target === 'cell') {
      if (!hit.cell || !pending.cells.some((c) => c[0] === hit.cell[0] && c[1] === hit.cell[1])) {
        this.hud.banner('Casilla no v\xE1lida', 'apagado', 700);
        return;
      }
      if (pending.cell && pending.cell[0] === hit.cell[0] && pending.cell[1] === hit.cell[1]) {
        this.confirmSpell();
        return;
      }
      ((pending.cell = hit.cell),
        this.board.set('target', [hit.cell], 11832575),
        this.hud.prompt(`${pending.name}: confirma la casilla`, !0, {
          label: 'Lanzar',
          on: () => this.confirmSpell(),
        }));
      return;
    }
    let picked = hit.creature;
    if (!(!picked || !pending.valid.includes(picked.id))) {
      if (target === 'darts' || target === 'rays') {
        (pending.targets.push(picked.id),
          this.hud.float(
            this.unit(picked.id).headWorld(),
            `\xD7${pending.targets.filter((id) => id === picked.id).length}`,
            'magia',
          ),
          pending.targets.length >= pending.n
            ? this.confirmSpell()
            : this.hud.prompt(`${pending.name}: ${pending.targets.length}/${pending.n} \xB7 elige m\xE1s objetivos`, !0, {
                label: 'Todos al \xFAltimo',
                on: () => this.confirmSpell(),
              }));
        return;
      }
      if (pending.targets.includes(picked.id)) {
        if (pending.max === 1) {
          this.confirmSpell();
          return;
        }
        pending.targets = pending.targets.filter((id) => id !== picked.id);
      } else pending.max === 1 ? (pending.targets = [picked.id]) : pending.targets.length < pending.max && pending.targets.push(picked.id);
      if (pending.max === 1) {
        this.spellPreview(creature);
        return;
      }
      (this.board.set(
        'area',
        pending.targets.map((id) => this.creature(id).cell),
        16767050,
      ),
        this.hud.prompt(
          `${pending.name}: ${pending.targets.length}/${pending.max} elegidos`,
          !0,
          pending.targets.length ? { label: 'Lanzar', on: () => this.confirmSpell() } : null,
        ),
        pending.targets.length >= pending.max && this.spellPreview(creature));
    }
  }
  /** Previsión del conjuro con los objetivos elegidos. */
  spellPreview(creature) {
    let pending = this.pending,
      res = this.rules('spell_preview', { spell: pending.spell, slot: pending.slot, targets: pending.targets }),
      targetUnit = this.unit(pending.targets[0]) || this.unit(creature.id);
    pending.targets[0] && pending.targets[0] !== creature.id && (this.framePair(this.unit(creature.id), targetUnit), targetUnit.setRing('target'));
    let chance = (res.lines || []).map((line) => /(\d+) %/.exec(line.s)).find(Boolean);
    this.hud.preview(
      targetUnit.headWorld(),
      res.lines || [],
      'Lanzar',
      () => this.confirmSpell(),
      [],
      !0,
      chance ? Number(chance[1]) / 100 : null,
    );
  }
  /** Lanza el conjuro (`cast`) con los objetivos elegidos. */
  async confirmSpell() {
    let creature = this.creature(this.state.current),
      pending = this.pending;
    if (!pending) return;
    if ((pending.target === 'darts' || pending.target === 'rays') && pending.targets.length && pending.targets.length < pending.n) {
      let last = pending.targets[pending.targets.length - 1];
      for (; pending.targets.length < pending.n;) pending.targets.push(last);
    }
    if ((pending.target === 'point' && !pending.point) || (pending.target === 'direction' && !pending.dir)) return;
    let req = { spell: pending.spell, slot: pending.slot, targets: pending.targets };
    (pending.point && (req.point = pending.point),
      pending.dir && (req.dir = pending.dir),
      pending.cell && (req.cell = pending.cell),
      (this.mode = 'busy'),
      this.clearTargeting());
    let res = this.rules('cast', req);
    (res.ok || this.hud.banner('No se puede lanzar as\xED', 'malo', 900),
      await this.play(res.events || []),
      this.afterAction(creature));
  }
  /** Abre la hoja de un menú del turno: attack, spells, features, actions o items. */
  menu(kind) {
    let creature = this.creature(this.state.current);
    if (!creature || !this.turnDone || this.mode === 'busy') return;
    this.mode === 'target' && this.enterIdle(creature);
    let opts = this.opts;
    if (kind === 'attack') {
      let entries = (opts.profiles || []).map((p) => ({
        id: p.key,
        icon: p.kind === 'melee' ? 'melee' : p.kind === 'thrown' ? 'thrown' : 'ranged',
        title: p.name,
        cost: `${p.bonus >= 0 ? '+' : ''}${p.bonus}`,
        desc: `${p.damage_text.join(' + ')} \xB7 ${p.kind === 'melee' ? `alcance ${formatNumber(p.reach * 1.5)} m` : `distancia ${formatNumber(p.range[0] * 1.5)}/${formatNumber(p.range[1] * 1.5)} m`}${p.mastery_name ? ` \xB7 ${p.mastery_name}` : ''}${p.ammo_left >= 0 ? ` \xB7 quedan ${p.ammo_left}` : ''}`,
        enabled: creature.turn.action > 0 || creature.turn.attack_left > 0,
      }));
      if (!entries.length) return;
      this.hud.sheet('Atacar con\u2026', entries, (entry) => this.startAttackPick(creature, entry.id));
    } else if (kind === 'spells') {
      let spells = (opts.spells || []).slice().sort((x, y) => x.level - y.level);
      if (!spells.length) return;
      let entries = spells.map((spell) => ({
        id: spell.id,
        icon: spell.icon || 'magic',
        title: spell.name,
        group:
          spell.level === 0
            ? 'Trucos'
            : `Nivel ${spell.level}${creature.slots_max?.[spell.level - 1] ? ` \xB7 ${creature.slots?.[spell.level - 1] ?? 0}/${creature.slots_max[spell.level - 1]} espacios` : ''}`,
        cost: { action: 'Acci\xF3n', bonus: 'Adicional', reaction: 'Reacci\xF3n' }[spell.cost] || '',
        note: spell.at_will
          ? 'a voluntad'
          : spell.free
            ? 'gratis 1/d\xEDa'
            : spell.concentration
              ? 'concentraci\xF3n'
              : '',
        desc: !spell.usable && spell.reason ? spell.reason : spell.desc,
        enabled: spell.usable,
        magic: !0,
        data: spell,
      }));
      this.hud.sheet('Conjuros', entries, (entry) => this.chooseSpell(creature, entry.data));
    } else if (kind === 'features') {
      if (!(opts.features || []).length) return;
      this.hud.sheet(
        'Habilidades',
        (opts.features || []).map((f) => ({ ...f, cost: f.cost })),
        (entry) => this.useFeature(creature, entry),
      );
    } else if (kind === 'actions') this.hud.sheet('Acciones', opts.actions || [], (entry) => this.basicAction(creature, entry));
    else if (kind === 'items') {
      if (!(opts.items || []).length) return;
      this.hud.sheet('Objetos', opts.items || [], (entry) =>
        this.startSimple(
          creature,
          entry.target,
          `${entry.title.replace(/ ×\d+$/, '')}: elige a qui\xE9n (t\xFA o un aliado adyacente)`,
        ),
      );
    }
  }
  /** Ejecuta una operación del núcleo (simple, feature) y reproduce sus eventos. */
  async runAction(creature, req) {
    ((this.mode = 'busy'), this.clearTargeting());
    let res = this.rules(req.op, req);
    (res.ok === !1 && this.hud.banner('No se puede ahora', 'apagado', 800),
      await this.play(res.events || []),
      this.afterAction(creature));
  }
  /** Acción básica (esquivar, ayudar, empujar, estabilizar…). */
  basicAction(creature, action) {
    action.target === 'none'
      ? this.runAction(creature, { op: 'simple', what: action.id })
      : this.startSimple(
          creature,
          action.target,
          {
            help: 'Elige un enemigo adyacente al que distraer',
            shove: 'Elige un enemigo adyacente para derribarlo',
            stabilize: 'Elige un aliado ca\xEDdo adyacente',
          }[action.target] || 'Elige objetivo',
        );
  }
  /** Usa un rasgo según su objetivo (ninguno, elección, criatura o área). */
  useFeature(creature, feature) {
    let target = feature.target || 'none';
    target === 'none'
      ? this.runAction(creature, { op: 'feature', id: feature.id })
      : target === 'choice'
        ? this.hud.sheet(
            feature.title,
            (feature.options || []).map((option) => ({
              id: option.id,
              icon: option.icon || feature.icon,
              title: option.title,
              cost: '',
              desc: option.desc || '',
              enabled: option.enabled !== !1,
            })),
            (option) => this.runAction(creature, { op: 'feature', id: feature.id, choice: option.id }),
          )
        : ['enemy', 'enemy_adjacent', 'ally_other', 'ally_touch', 'creature'].includes(target)
          ? this.startSimple(creature, `feat:${feature.id}`, `${feature.title}: elige objetivo`)
          : target === 'point' || target === 'direction' || target === 'cell'
            ? this.startFeatureArea(creature, feature)
            : this.hud.banner('Esta habilidad a\xFAn no se puede usar aqu\xED', 'apagado', 1200);
  }
  /** Elegir punto, dirección o casilla para un rasgo de área (aliento, etc.). */
  startFeatureArea(creature, feature) {
    let range = feature.range ?? (feature.target === 'cell' ? 6 : 12);
    this.mode = 'target';
    let radiusFt = feature.radius ?? (feature.zone !== void 0 ? 5 : 10);
    ((this.pending = {
      kind: 'feature',
      id: feature.id,
      name: feature.title,
      target: feature.target,
      range,
      radius: Math.max(1, Math.round(radiusFt / 5)),
      shape: feature.shape || (feature.id === 'breath_line' ? 'line' : 'cone'),
      zone: feature.zone,
    }),
      this.board.clear());
    let cells = [];
    for (let y = 0; y < this.board.h; y++)
      for (let x = 0; x < this.board.w; x++) hexDistance([x, y], creature.cell) <= range && cells.push([x, y]);
    ((this.pending.cells =
      feature.target === 'cell'
        ? cells.filter(
            (cell) =>
              this.board.tile(...cell) !== '#' &&
              !this.state.creatures.some((c) => !c.dead && c.cell[0] === cell[0] && c.cell[1] === cell[1]),
          )
        : cells),
      feature.target !== 'direction' && this.board.set('range', this.pending.cells, 11832575),
      this.hud.prompt(
        feature.target === 'direction'
          ? `${feature.title}: elige hacia d\xF3nde`
          : feature.target === 'cell'
            ? `${feature.title}: elige una casilla`
            : `${feature.title}: elige d\xF3nde`,
        !0,
      ));
  }
  /** Casillas afectadas por el rasgo de área en la posición del puntero. */
  featureCells(creature, hit) {
    let pending = this.pending;
    if (pending.target === 'point') {
      if (!hit.cell || hexDistance(hit.cell, creature.cell) > pending.range) return null;
      let cells = [];
      for (let y = 0; y < this.board.h; y++)
        for (let x = 0; x < this.board.w; x++) hexDistance([x, y], hit.cell) <= pending.radius && cells.push([x, y]);
      return cells;
    }
    if (pending.target === 'direction' && hit.gp) {
      let origin = this.cellToWorld(creature.cell),
        dir = hit.gp.clone().sub(origin).setY(0);
      if (dir.lengthSq() < 0.01) return null;
      dir.normalize();
      let reach = pending.shape === 'line' ? 6 : 3,
        cells = [];
      for (let y = 0; y < this.board.h; y++)
        for (let x = 0; x < this.board.w; x++) {
          let offset = this.cellToWorld([x, y]).sub(origin),
            along = offset.x * dir.x + offset.z * dir.z,
            across = Math.abs(offset.x * dir.z - offset.z * dir.x);
          along <= 0.3 ||
            along > reach * HEX_SIZE + 0.2 ||
            (pending.shape === 'line' ? across > 0.75 : across > along * 0.55 + 0.35) ||
            cells.push([x, y]);
        }
      return cells;
    }
    return pending.target === 'cell' && hit.cell && pending.cells.some((c) => c[0] === hit.cell[0] && c[1] === hit.cell[1])
      ? [hit.cell]
      : null;
  }
  /** Resalta el área del rasgo y su previsión (avisa si alcanza a aliados). */
  previewFeatureArea(hit, hover) {
    let creature = this.creature(this.state.current),
      cells = this.featureCells(creature, hit);
    if (!cells) return (this.board.clear('area'), null);
    let allies = [],
      enemies = [];
    for (let cell of cells) {
      let occupant = this.state.creatures.find((c) => !c.dead && c.cell[0] === cell[0] && c.cell[1] === cell[1]);
      occupant && (occupant.team === creature.team ? allies : enemies).push(occupant);
    }
    let allyCells = new Set(allies.map((c) => cellKey(...c.cell)));
    if (
      (this.board.set('area', cells, (cell) =>
        allyCells.has(cellKey(...cell)) && this.pending.id.startsWith('breath') ? 16728112 : 11566335,
      ),
      !hover)
    ) {
      let pending = this.pending;
      ((pending.area = cells), (pending.at = hit));
      let lines = [{ t: 'b', s: pending.name }];
      (pending.target !== 'cell' && lines.push({ t: '', s: `Enemigos en el \xE1rea: ${enemies.length}` }),
        allies.length &&
          pending.id.startsWith('breath') &&
          lines.push({ t: 'bad', s: `\xA1Cuidado! Alcanza a ${allies.length} aliado(s).` }),
        this.hud.preview(this.cellToWorld(cells[Math.floor(cells.length / 2)]), lines, 'Usar', () =>
          this.confirmFeatureArea(),
        ));
    }
    return cells;
  }
  /** Clic al apuntar un rasgo de área. */
  tapFeature(creature, hit) {
    let pending = this.pending;
    if (
      pending.area &&
      hit.cell &&
      pending.area.some((c) => c[0] === hit.cell[0] && c[1] === hit.cell[1]) &&
      pending.target !== 'direction'
    ) {
      this.confirmFeatureArea();
      return;
    }
    if (
      pending.target === 'direction' &&
      pending.area &&
      hit.cell &&
      pending.area.some((c) => c[0] === hit.cell[0] && c[1] === hit.cell[1])
    ) {
      this.confirmFeatureArea();
      return;
    }
    ((pending.locked = !1),
      this.previewFeatureArea(hit, !1) ? (pending.locked = !0) : this.hud.banner('Fuera de alcance', 'apagado', 700));
  }
  /** Usa el rasgo de área elegido. */
  confirmFeatureArea() {
    let creature = this.creature(this.state.current),
      pending = this.pending;
    if (!pending || !pending.at) return;
    let req = { op: 'feature', id: pending.id };
    if ((pending.zone !== void 0 && pending.zone !== null && (req.zone = pending.zone), pending.target === 'point')) {
      let cell = pending.at.cell,
        pos = this.cellToWorld(cell);
      req.point = [pos.x / HEX_SIZE, pos.z / HEX_SIZE];
    } else if (pending.target === 'direction') {
      let plane = worldToPlane(pending.at.gp);
      ((req.dir = [plane.x, plane.y]), (req.point = req.dir));
    } else pending.target === 'cell' && (req.cell = pending.at.cell);
    this.runAction(creature, req);
  }
  /** Elegir objetivo de una acción simple u objeto (`simple_targets`). */
  startSimple(creature, what, promptText) {
    let valid = this.rules('simple_targets', { what });
    if (!valid.length) {
      (this.hud.banner('No hay objetivos v\xE1lidos', 'apagado', 900), this.enterIdle(creature));
      return;
    }
    ((this.mode = 'target'),
      (this.pending = { kind: 'simple', what, valid }),
      this.board.clear(),
      this.board.set(
        'target',
        valid.map((id) => this.creature(id).cell),
        (cell) => {
          let occupant = this.state.creatures.find((c) => c.cell[0] === cell[0] && c.cell[1] === cell[1] && !c.dead);
          return occupant && occupant.team === creature.team ? 7331978 : 16734784;
        },
      ),
      this.hud.prompt(promptText, !0));
  }
  /** Clic en modo de elección de objetivo según lo pendiente. */
  tapTarget(creature, hit) {
    let pending = this.pending;
    if (!pending) return;
    let other = hit.creature;
    switch (pending.kind) {
      case 'move':
        hit.cell && hit.cell[0] === pending.cell[0] && hit.cell[1] === pending.cell[1]
          ? this.doMove(creature, pending.path, pending.dash)
          : (this.enterIdle(creature), this.tapIdle(creature, hit, {}));
        break;
      case 'attack':
        other && other.id === pending.plan.target
          ? this.executeAttack()
          : other && other.team !== creature.team && other.hp > 0
            ? this.proposeAttack(creature, other, pending.plan.key)
            : this.enterIdle(creature);
        break;
      case 'attack_pick':
        other && other.team !== creature.team && other.hp > 0 && this.proposeAttack(creature, other, pending.key);
        break;
      case 'offhand':
        other && other.id === pending.off.target ? this.hud.confirmPreview() : this.afterAction(creature);
        break;
      case 'spell':
        this.tapSpell(creature, hit);
        break;
      case 'feature':
        this.tapFeature(creature, hit);
        break;
      case 'simple':
        other && pending.valid.includes(other.id) && this.runAction(creature, { op: 'simple', what: pending.what, target: other.id });
        break;
      default:
        break;
    }
  }
  /** Deshace el último movimiento (`undo_move`). */
  async undoMove() {
    let creature = this.creature(this.state.current);
    if (!creature || this.mode === 'busy' || !this.opts?.can_undo) return;
    ((this.mode = 'busy'), this.clearTargeting());
    let res = this.rules('undo_move'),
      unit = this.unit(creature.id);
    (await this.play(res.events), this.refresh());
    let fresh = this.creature(creature.id);
    (fresh &&
      (fresh.cell[0] !== unit.cell[0] ||
        fresh.cell[1] !== unit.cell[1] ||
        unit.root.position.distanceTo(this.cellToWorld(fresh.cell)) > 0.1) &&
      unit.place(fresh.cell),
      this.afterAction(creature));
  }
  /** Une salvaciones fallidas y efectos con el estado que causan para mostrar un solo texto. */
  markMerges(events) {
    let list = events || [];
    for (let k = 0; k < list.length; k++) {
      let ev = list[k];
      if (ev.t === 'save' && !ev.success && ev.who)
        for (let j = k + 1; j < Math.min(list.length, k + 8); j++) {
          let next = list[j];
          if (next.who === ev.who) {
            if ((next.t === 'condition' || next.t === 'effect') && next.on) {
              ((ev._merged = !0), (next._saveNote = `salvaci\xF3n ${ev.total} vs CD ${ev.dc}`));
              break;
            }
            if (next.t === 'damage' || next.t === 'save') break;
          }
        }
      if (ev.t === 'effect' && ev.on && ev.who)
        for (let j = k + 1; j < Math.min(list.length, k + 4); j++) {
          let next = list[j];
          if (next.who === ev.who && next.t === 'condition' && next.on) {
            ((ev._quiet = !0), (next._saveNote = next._saveNote || ev._saveNote || ''), (next._from = ev.name));
            break;
          }
        }
    }
  }
  /** Reproduce una lista de eventos del núcleo en orden (emite «battle:event»). */
  async play(events) {
    this.markMerges(events);
    for (let ev of events || []) {
      if (this.disposed) return;
      (this.allEvents.push(ev), ev.t !== 'log' && this.emit('battle:event', { ev }));
      try {
        await this.playOne(ev);
      } catch (err) {
        console.error('[combate] evento', ev.t, err);
      }
    }
  }
  /** Apunta que una unidad acaba de recibir un impacto visual (evita duplicar golpes). */
  markImpact(id) {
    this.recentImpact.set(id, performance.now());
  }
  impactedRecently(id) {
    let at = this.recentImpact.get(id);
    return at && performance.now() - at < 900 / this.turbo;
  }
  /** Reproduce un evento del núcleo (move, attack, damage, cast, condition, death, zone…). */
  async playOne(ev) {
    let hud = this.hud,
      vfx = this.vfx,
      unit = ev.who ? this.unit(ev.who) : null;
    switch (ev.t) {
      case 'log':
        hud.log(ev.text);
        break;
      case 'round':
        (hud.round(ev.n), ev.n > 1 && hud.banner(`Ronda ${ev.n}`, 'oro', 700));
        break;
      case 'turn':
        this.setActive(ev.who);
        break;
      case 'initiative':
        (hud.setInitiative(ev.who, ev.roll),
          unit && !this.shotMode && hud.float(unit.headWorld(), `Iniciativa ${ev.roll}`, 'tirada', 0.9));
        break;
      case 'move': {
        if (!unit) break;
        let path = (ev.path || []).filter((cell, k) => k > 0 || cell[0] !== unit.cell[0] || cell[1] !== unit.cell[1]);
        (unit.team === 1 && this.focusUnit(unit),
          this.emit('battle:fx', { kind: 'step', who: ev.who, run: !!ev.dash, at: unit.root.position.toArray() }),
          await unit.walk(path, { run: !!ev.dash }));
        break;
      }
      case 'dash':
        unit && hud.float(unit.headWorld(), '\xA1Corre!', 'apagado');
        break;
      case 'disengage':
        unit &&
          (hud.float(unit.headWorld(), 'Se destraba', 'apagado'),
          vfx.feature('step_of_wind', { caster: this.who(unit) }));
        break;
      case 'stand':
        unit && (unit.idle(0.3), hud.float(unit.headWorld(), 'Se levanta', 'apagado'));
        break;
      case 'attack':
        await this.playAttack(ev);
        break;
      case 'damage':
        await this.playDamage(ev, unit);
        break;
      case 'heal':
        unit &&
          ev.amount > 0 &&
          (vfx.heal(unit.root.getWorldPosition(new Vector3()), ev.amount),
          hud.float(unit.chest(), `+${ev.amount}`, 'cura', 1.15),
          hud.setHp(ev.who, ev.hp, ev.max),
          await this.wait(300));
        break;
      case 'temp_hp':
        unit &&
          (hud.float(unit.chest(), `+${ev.amount ?? ''} temporales`, 'bueno', 0.9),
          vfx.burst(unit.chest(), {
            n: 12,
            col: 10471679,
            speed: 1,
            life: 0.6,
            size: 0.08,
            frame: FRAME.star,
            glow: 1.8,
          }));
        break;
      case 'save':
        (unit &&
          (ev._merged ||
            hud.float(
              unit.headWorld(),
              `Salvaci\xF3n ${ev.success ? 'superada' : 'fallada'}`,
              ev.success ? 'apagado' : 'malo',
              0.85,
              `${ev.total} vs CD ${ev.dc}`,
            ),
          vfx.ring(unit.root.position, {
            color: ev.success ? 9429152 : 16736320,
            radius: 0.7,
            life: 0.4,
            thick: 0.25,
          })),
          await this.wait(220));
        break;
      case 'condition':
        unit &&
          ((ev.cond !== 'unconscious' || !unit.down) &&
            hud.float(
              unit.headWorld(),
              `${ev.on ? '' : 'Ya no: '}${conditionName(ev.cond)}`,
              ev.on ? 'malo' : 'apagado',
              0.9,
              [ev._from, ev._saveNote].filter(Boolean).join(' \xB7 '),
            ),
          ev.cond === 'prone' &&
            (unit.prone(ev.on),
            ev.on &&
              vfx.burst(unit.root.position.clone().setY(unit.root.position.y + 0.2), {
                n: 10,
                col: 11049608,
                speed: 1.6,
                life: 0.7,
                size: 0.25,
                size1: 0.6,
                frame: FRAME.dust,
                blend: 'alpha',
                a: 0.45,
                flat: !0,
              })),
          ev.cond === 'unconscious' && ev.on && !unit.down && unit.fall(),
          this.syncAuras());
        break;
      case 'effect':
        (unit &&
          ev.name &&
          !ev._quiet &&
          !(
            ev.on &&
            ev.positive &&
            this.lastCast &&
            this.lastCast.name === ev.name &&
            performance.now() - this.lastCast.t < 4e3
          ) &&
          hud.float(
            unit.headWorld(),
            `${ev.on ? '' : 'Fin: '}${ev.name}`,
            ev.positive ? 'bueno' : 'malo',
            0.85,
            ev._saveNote || '',
          ),
          this.refresh());
        break;
      case 'downed':
        unit &&
          (unit.fall(),
          unit.team === 0 && vfx.death(unit.root.position.clone(), { pc: !0 }),
          hud.float(unit.headWorld(), '\xA1Cae!', 'malo', 1.2),
          this.refresh(),
          await this.wait(500));
        break;
      case 'death':
        if (unit) {
          let creature = this.creature(ev.who);
          (vfx.death(unit.root.position.clone(), {
            undead: UNDEAD_RE.test(creature?.template || '') || creature?.ctype === 'undead',
            pc: unit.team === 0,
          }),
            unit.die(),
            this.vfx.auras.clear(ev.who),
            unit.team === 0 ? hud.float(unit.headWorld(), 'Muere', 'malo', 1.3) : this.standalone && unit.sink(2.6),
            this.refresh(),
            await this.wait(450));
        }
        break;
      case 'death_save':
        (unit &&
          ev.roll > 0 &&
          (hud.float(
            unit.headWorld(),
            `Salvaci\xF3n de muerte: ${ev.roll}`,
            ev.roll >= 10 ? 'bueno' : 'malo',
            0.9,
            `${ev.successes}\u2713 ${ev.failures}\u2717`,
          ),
          await this.wait(500)),
          this.refresh());
        break;
      case 'stable':
        unit && hud.float(unit.headWorld(), 'Estable', 'bueno');
        break;
      case 'revive':
        unit &&
          (unit.revive(),
          vfx.heal(unit.root.position.clone(), 6),
          hud.float(unit.headWorld(), '\xA1Vuelve en s\xED!', 'bueno', 1.1),
          this.refresh());
        break;
      case 'push':
        unit &&
          ev.to &&
          (vfx.burst(unit.root.position.clone().setY(unit.root.position.y + 0.2), {
            n: 10,
            col: 11049608,
            speed: 2,
            life: 0.6,
            size: 0.25,
            size1: 0.6,
            frame: FRAME.dust,
            blend: 'alpha',
            a: 0.45,
            flat: !0,
          }),
          await unit.walk([ev.to], { run: !0 }));
        break;
      case 'teleport':
        if (unit && ev.to) {
          let from = unit.root.position.clone(),
            to = this.cellToWorld(ev.to);
          (vfx.spell('misty_step', { phase: 'teleport', caster: this.who(unit), cell: ev.to }),
            await this.wait(180),
            unit.place(ev.to),
            vfx.burst(to.clone().setY(to.y + 0.8), {
              n: 14,
              col: 14674175,
              speed: 1.2,
              life: 0.8,
              size: 0.3,
              size1: 0.7,
              frame: FRAME.cloud,
              blend: 'alpha',
              a: 0.5,
            }));
        }
        break;
      case 'swap': {
        let unitA = this.unit(ev.a),
          unitB = this.unit(ev.b);
        (unitA && ev.a_cell && unitA.walk([ev.a_cell], { run: !0 }),
          unitB && ev.b_cell && (await unitB.walk([ev.b_cell], { run: !0 })));
        break;
      }
      case 'cast':
        await this.playCast(ev);
        break;
      case 'missile': {
        let source = this.unit(ev.who),
          target = this.unit(ev.target);
        source &&
          target &&
          (await vfx.spell('magic_missile', { phase: 'dart', caster: this.who(source), targets: [this.who(target)] }),
          this.markImpact(ev.target));
        break;
      }
      case 'reaction':
        await this.playReaction(ev, unit);
        break;
      case 'sneak':
        if (unit) {
          let target = this.unit(ev.target);
          (hud.float((target || unit).headWorld(), `Ataque furtivo +${ev.amount}`, 'oro', 1),
            target && vfx.slash(target.chest(), { color: 10119935, size: 1.3, life: 0.3, glow: 2.4 }));
        }
        break;
      case 'feature':
        if (unit) {
          (hud.float(
            unit.headWorld(),
            ev.name ||
              FEATURE_NAMES[ev.feature] ||
              (this.opts?.features || []).find((f) => f.id === ev.feature)?.title ||
              'Habilidad',
            ['rage', 'reckless', 'frenzy'].includes(ev.feature) ? 'malo' : 'oro',
            1,
          ),
            ['rage', 'reckless'].includes(ev.feature)
              ? unit.once('taunt', { speed: 1.1 })
              : [
                  'frenzy',
                  'fires_burn',
                  'frosts_chill',
                  'hills_tumble',
                  'flurry',
                  'uncanny_metabolism',
                  'relentless_endurance',
                ].includes(ev.feature) || unit.once('cast_buff', { speed: 1.2 }));
          let chains = ['fires_burn', 'frosts_chill', 'hills_tumble', 'frenzy'].includes(ev.feature),
            targetId = ev.target || (chains && this.lastTarget?.id) || null,
            targetWho = targetId ? this.who(targetId) : null;
          await vfx.feature(ev.feature, { caster: this.who(unit), targets: targetWho ? [targetWho] : [] });
        }
        break;
      case 'item':
        unit &&
          (hud.float(unit.headWorld(), ev.item && ev.item.includes('potion') ? 'Poci\xF3n' : 'Objeto', 'cura'),
          unit.once('use', { speed: 1.2 }),
          vfx.burst(handWorld(unit), {
            n: 10,
            col: 16738954,
            speed: 1,
            up: 1,
            life: 0.6,
            size: 0.08,
            frame: FRAME.bubble,
            glow: 1.6,
          }),
          await this.wait(300));
        break;
      case 'hide':
        unit &&
          (hud.float(unit.headWorld(), ev.success === !1 ? 'No logra esconderse' : 'Se esconde', 'apagado'),
          ev.success !== !1 && unit.anim('crouch_walk', 0.3),
          vfx.burst(unit.root.position.clone().setY(unit.root.position.y + 0.5), {
            n: 8,
            col: 3814448,
            speed: 0.6,
            life: 0.8,
            size: 0.3,
            size1: 0.6,
            frame: FRAME.smoke,
            blend: 'alpha',
            a: 0.4,
          }),
          this.refresh());
        break;
      case 'reveal':
        unit && (hud.float(unit.headWorld(), '\xA1Descubierto!', 'apagado'), unit.idle(0.3), this.refresh());
        break;
      case 'shove': {
        let target = this.unit(ev.target);
        unit &&
          target &&
          (unit.faceUnit(target),
          unit.attack('unarmed'),
          await this.wait(260),
          ev.success ? (target.hurt(), vfx.hit('bludgeoning', target.chest(), { small: !0 })) : vfx.miss(target.chest()),
          hud.float(unit.headWorld(), ev.success === !1 ? 'Empuj\xF3n fallido' : 'Empuj\xF3n', 'apagado'));
        break;
      }
      case 'blocked':
        if (unit) {
          hud.float(unit.headWorld(), 'No se atreve\u2026', 'apagado');
          let target = this.unit(ev.target);
          target && vfx.dome(target.root.position, { color: 16052479, radius: 1, life: 0.6, alpha: 0.6 });
        }
        break;
      case 'immune':
        unit && hud.float(unit.headWorld(), 'Inmune', 'apagado');
        break;
      case 'concentration':
        (unit && !ev.on && hud.float(unit.headWorld(), 'Pierde la concentraci\xF3n', 'malo', 0.85), this.refresh());
        break;
      case 'zone':
        ev.on
          ? (this.zoneKinds.set(ev.id, ev.kind),
            vfx.zone(ev.id, ev.kind, ev.cells || [], ev.color),
            ev.moved || (await this.wait(200)))
          : (vfx.zoneOff(ev.id), this.zoneKinds.delete(ev.id));
        break;
      case 'zone_hit':
        if (unit) {
          let element = ev.token
            ? 'fire'
            : { moonbeam: 'radiant', spike: 'piercing', web: 'force' }[this.zoneKinds.get(ev.id)] || 'force';
          (element === 'piercing'
            ? vfx.hit('piercing', unit.chest(), { small: !0 })
            : vfx.element(element, unit.chest(), { k: 0.7 }),
            ev.token && (await vfx.tokenStrike(ev.token, unit.chest())),
            this.markImpact(ev.who));
        }
        break;
      case 'burst':
        await vfx.spell('', {
          phase: 'burst',
          cells: ev.cells || [],
          fx: ev.fx || 'arcane',
          caster: unit ? this.who(unit) : null,
        });
        break;
      case 'summon': {
        let pos = this.cellToWorld(ev.cell);
        (vfx.token(ev.id, ev.kind, pos), await this.wait(250));
        break;
      }
      case 'summon_move':
        await vfx.tokenMove(ev.id, this.cellToWorld(ev.to));
        break;
      case 'unsummon':
        vfx.tokenOff(ev.id);
        break;
      case 'shape':
        unit && (await this.wildShape(unit, ev.form));
        break;
      case 'resize':
        unit &&
          (vfx.burst(unit.chest(), {
            n: 20,
            col: 12624127,
            speed: 1.6,
            life: 0.7,
            size: 0.1,
            frame: FRAME.star,
            glow: 2,
          }),
          this.refresh());
        break;
      case 'escape':
        unit &&
          hud.float(
            unit.headWorld(),
            ev.success ? '\xA1Libre!' : 'Sigue apresado',
            ev.success ? 'bueno' : 'apagado',
            0.9,
          );
        break;
      case 'mirror':
        unit &&
          (vfx.auras.popGhost(ev.who),
          hud.float(unit.headWorld(), '\xA1Era una imagen!', 'magia', 0.9),
          vfx.burst(unit.chest(), {
            n: 20,
            col: 12628223,
            speed: 2,
            life: 0.6,
            size: 0.12,
            frame: FRAME.star,
            glow: 2,
          }));
        break;
      case 'inspiration':
        unit &&
          (hud.float(
            unit.headWorld(),
            ev.kind === 'bardic' ? `\xA1Inspirado! +${ev.amount}` : 'Inspiraci\xF3n heroica',
            'oro',
            0.9,
          ),
          vfx.burst(unit.chest(), {
            n: 12,
            col: 16769162,
            speed: 1.4,
            up: 0.6,
            life: 0.8,
            size: 0.16,
            frame: FRAME.note,
            glow: 2,
          }));
        break;
      case 'special': {
        let target = this.unit(ev.target);
        unit &&
          target &&
          (unit.faceUnit(target),
          unit.attack('melee'),
          await this.wait(250),
          vfx.beam(target.chest(), unit.chest(), { col: 6961824, width: 0.1, life: 0.6, glow: 2 }),
          hud.float(unit.headWorld(), ev.name || 'Drenar vida', 'malo', 0.9),
          await this.wait(300));
        break;
      }
      case 'buff':
        unit && (await vfx.feature('innate_sorcery', { caster: this.who(unit) }));
        break;
      case 'max_hp':
        this.refresh();
        break;
      case 'recharge':
        unit &&
          ev.ok &&
          (hud.float(unit.headWorld(), `\xA1${ev.name || 'Recargado'} listo!`, 'malo', 0.9),
          vfx.burst(unit.headWorld(), {
            n: 10,
            col: 16777215,
            speed: 1,
            life: 0.6,
            size: 0.12,
            frame: FRAME.web,
            blend: 'alpha',
            a: 0.7,
          }));
        break;
      default:
        break;
    }
  }
  /** Daño: golpe, sangre, destello en pantalla si es del grupo, número flotante y pausa en críticos. */
  async playDamage(ev, unit) {
    if (!unit) return;
    let hud = this.hud,
      crit = !!ev.crit,
      type = ev.type || '';
    if (ev.amount > 0) {
      unit.hurt();
      let recent = this.impactedRecently(ev.who),
        physical = type === 'slashing' || type === 'piercing' || type === 'bludgeoning' || !type,
        creature = this.creature(ev.who),
        undead = UNDEAD_RE.test(creature?.template || '') || creature?.ctype === 'undead';
      (!recent || physical
        ? this.vfx.hit(type || 'bludgeoning', unit.chest(), {
            crit,
            dir: this.lastAttackDir,
            small: recent,
            blood: !undead && creature?.ctype !== 'construct',
          })
        : crit && this.vfx.crit(unit.chest()),
        unit.team === 0 && this.vfx.flash(crit ? 0.55 : 0.32));
    }
    let cls =
      ev.amount <= 0 ? 'apagado' : crit ? 'critico' : unit.team === 0 ? 'dano-pj' : DAMAGE_CLASS[type] ? `dano ${DAMAGE_CLASS[type]}` : 'dano';
    (hud.float(
      unit.chest(),
      ev.amount > 0 ? `${ev.amount}` : 'Sin da\xF1o',
      cls,
      crit ? 1.5 : 1.15,
      crit ? '\xA1Cr\xEDtico!' : ev.amount > 0 && DAMAGE_TYPE_NAMES[type] ? DAMAGE_TYPE_NAMES[type] : '',
    ),
      hud.setHp(ev.who, ev.hp, ev.max),
      crit && (await this.hitStop([unit, this.lastAttacker].filter(Boolean))),
      await this.wait(crit ? 380 : 240));
  }
  /** Congela un instante las animaciones (crítico). */
  async hitStop(units) {
    let mixers = units.map((u) => u.mixer).filter(Boolean);
    for (let m of mixers) m.timeScale = 0.05;
    await sleep(110 / this.turbo);
    for (let m of mixers) m.timeScale = 1;
  }
  /** Ataque: tirada, animación, proyectil o tajo, impacto o fallo. */
  async playAttack(ev) {
    let attacker = this.unit(ev.who),
      target = this.unit(ev.target);
    if (!attacker || !target) return;
    ((this.lastAttacker = attacker),
      (this.lastTarget = target),
      (this.lastAttackDir = target.root.position.clone().sub(attacker.root.position).setY(0).normalize()),
      ev.token || attacker.faceUnit(target),
      (attacker.team === 1 || this.autoParty) && this.framePair(attacker, target));
    let hud = this.hud,
      vfx = this.vfx;
    ev.oa && hud.float(attacker.headWorld(), 'Ataque de oportunidad', 'oro', 0.85);
    let rollText = `${ev.natural}${ev.rolls && ev.rolls.length > 1 ? ` (${ev.rolls.join('/')})` : ''} + ${ev.bonus}${ev.bless ? ` + ${ev.bless}` : ''} = ${ev.total} vs CA ${ev.ac}`;
    if (
      (hud.log(`<span class="tirada">${ev.name}: ${rollText}</span>`),
      !this.fast &&
        !this.shotMode &&
        hud.float(
          attacker.headWorld(),
          `${ev.mode > 0 ? '\u25B2 ' : ev.mode < 0 ? '\u25BC ' : ''}${ev.natural} \u2192 ${ev.total} vs ${ev.ac}`,
          'tirada',
          0.8,
        ),
      ev.token)
    ) {
      (await vfx.tokenStrike(ev.token, target.chest()),
        ev.hit
          ? (vfx.element('force', target.chest(), { k: ev.crit ? 1.3 : 0.8 }), this.markImpact(ev.target))
          : vfx.miss(target.chest()),
        ev.crit && hud.float(target.headWorld(), '\xA1Cr\xEDtico!', 'critico', 1.2),
        await this.wait(80));
      return;
    }
    if (ev.spell) {
      let melee = String(ev.kind || '').startsWith('melee');
      (this.castReady && this.castReady.who === ev.who && this.castReady.sid === ev.sid && !this.castReady.used
        ? (this.castReady.used = !0)
        : (attacker.once(melee ? 'attack_melee' : 'cast', { speed: 1.4 }),
          await this.wait(attacker.hitTime(melee ? 'melee' : 'spell') * 520)),
        await vfx.spell(ev.sid || '', {
          phase: 'attack',
          caster: this.who(attacker),
          targets: [this.who(target)],
          hit: !!ev.hit,
          crit: !!ev.crit,
          dtype: ev.dtype,
          fx: ev.fx,
        }),
        ev.hit
          ? this.markImpact(ev.target)
          : (hud.float(target.headWorld(), ev.natural === 1 ? 'Pifia' : 'Falla', 'apagado', 1),
            target.once('dodge', { speed: 1.6 })),
        await this.wait(ev.hit ? 60 : 260));
      return;
    }
    let kind =
      ev.kind === 'melee' ? (ev.unarmed ? 'unarmed' : 'melee') : ev.kind === 'thrown' ? 'thrown' : 'ranged';
    if (
      (this.emit('battle:fx', {
        kind: kind === 'melee' || kind === 'unarmed' ? 'swing' : 'shoot',
        weapon: ev.weapon,
        who: ev.who,
        target: ev.target,
        at: attacker.root.position.toArray(),
      }),
      attacker.attack(kind),
      await this.wait(attacker.hitTime(kind === 'unarmed' ? 'melee' : kind) * 1e3),
      kind === 'ranged' || kind === 'thrown')
    ) {
      let weapon = String(ev.weapon || ''),
        missile = weapon.includes('crossbow')
          ? 'bolt'
          : weapon.includes('dagger')
            ? 'dagger'
            : weapon.includes('javelin') || weapon.includes('spear')
              ? 'javelin'
              : weapon.includes('sling')
                ? 'orb'
                : 'arrow';
      await vfx.projectile('physical', attacker.chest().add(new Vector3(0, 0.15, 0)), target.chest(), {
        kind: missile === 'orb' ? 'orb' : missile,
        speed: 26 / Math.min(this.speed, 1.6),
        miss: !ev.hit,
        size: 0.3,
      });
    } else
      ev.hit &&
        vfx.slash(target.chest().lerp(attacker.chest(), 0.25), {
          color: ev.crit ? 16765056 : 16051420,
          size: 1,
          life: 0.22,
          glow: ev.crit ? 3 : 1.6,
          alpha: 0.75,
        });
    (ev.hit
      ? (ev.crit && hud.float(target.headWorld(), '\xA1Cr\xEDtico!', 'critico', 1.2),
        ev.flurry &&
          vfx.burst(target.chest(), {
            n: 10,
            col: 12574975,
            speed: 3,
            life: 0.25,
            size: 0.06,
            stretch: 0.08,
            glow: 2,
          }))
      : (hud.float(target.headWorld(), ev.natural === 1 ? 'Pifia' : 'Falla', 'apagado', 1),
        (kind === 'melee' || kind === 'unarmed') && vfx.miss(target.chest()),
        target.once('dodge', { speed: 1.6 })),
      await this.wait(ev.hit ? 60 : 320));
  }
  /** Lanzamiento de conjuro o rasgo con su coreografía de vfx/spells.js. */
  async playCast(ev) {
    let caster = this.unit(ev.who);
    if (!caster) return;
    let vfx = this.vfx,
      spell = ev.spell || '',
      def = efectosConjuros[spell] || {},
      targets = (ev.targets || []).map((id) => this.who(id)).filter(Boolean),
      cells = ev.cells || [];
    (this.hud.float(caster.headWorld(), ev.name || def.n || 'Conjuro', 'magia', 1),
      (this.lastCast = { name: ev.name || def.n, t: performance.now() }));
    let params = {
      caster: this.who(caster),
      targets,
      cells,
      dtype: ev.dtype,
      fx: ev.fx,
      slot: ev.slot,
      cell: ev.cell,
    };
    if (
      (ev.point && (params.center = this.planeToWorld(ev.point)),
      ev.dir && !ev.point && (params.dir = this.planeToWorld(ev.dir).sub(params.caster.pos).setY(0).normalize()),
      cells.length &&
        !params.center &&
        (params.center = cells
          .map((cell) => this.cellToWorld(cell))
          .reduce((sum, p) => sum.add(p), new Vector3())
          .divideScalar(cells.length)),
      ev.rider)
    ) {
      await vfx.spell(spell, { ...params, phase: 'rider' });
      for (let target of targets) this.markImpact(target.id);
      return;
    }
    let firstOther = targets.find((w) => w.id !== caster.id);
    (firstOther ? caster.faceUnit(this.unit(firstOther.id)) : params.center && caster.face(params.center.x, params.center.z),
      (caster.team === 1 || this.autoParty) &&
        (cells.length ? this.frameArea(cells) : firstOther && this.framePair(caster, this.unit(firstOther.id))));
    let support =
        def.h ||
        ['buff', 'heal', 'wind', 'nature'].includes(def.fx) ||
        ['bardic_inspiration', 'lay_on_hands', 'preserve_life', 'turn_undead'].includes(spell),
      spellAttack = !!def.a,
      fxName = ev.fx || def.fx,
      castStyle =
        spell === 'breath_weapon'
          ? DAMAGE_STYLE[ev.dtype] || 'fire'
          : fxName === 'fire_cone'
            ? 'fire'
            : fxName || (o1.has(spell) ? 'buff' : 'arcane'),
      anim = support ? 'buff' : def.a === 'melee' ? 'melee' : 'spell';
    caster.attack(anim);
    let charge = vfx.castStart(castStyle, params.caster.pos, params.caster.hand, {
      big: (def.l || 0) >= 1,
      radius: (def.l || 0) >= 1 ? 0.9 : 0.7,
    });
    if (
      (await this.wait(caster.hitTime(anim) * 1e3),
      charge.release(),
      (params.caster = this.who(caster)),
      (this.castReady = spellAttack ? { who: ev.who, sid: spell, used: !1 } : null),
      o1.has(spell)
        ? (spell === 'breath_weapon' &&
            (params.shape = Math.max(0, ...cells.map((cell) => hexDistance(cell, caster.cell))) > 3 ? 'line' : 'cone'),
          await vfx.feature(spell, params))
        : await vfx.spell(spell, { ...params, phase: 'cast' }),
      !spellAttack)
    )
      for (let target of targets) this.markImpact(target.id);
    if (cells.length)
      for (let creature of this.state.creatures)
        cells.some((cell) => cell[0] === creature.cell[0] && cell[1] === creature.cell[1]) && this.markImpact(creature.id);
    await this.wait(100);
  }
  /** Reacciones (Escudo, Reprensión infernal, Desviar proyectiles, Aguante…). */
  async playReaction(ev, unit) {
    if (!unit) return;
    let hud = this.hud,
      vfx = this.vfx;
    hud.float(unit.headWorld(), `\xA1${ev.name}!`, 'magia', 1.1);
    let target = ev.target ? this.unit(ev.target) : null;
    (ev.spell === 'shield'
      ? await vfx.spell('shield', { caster: this.who(unit) })
      : ev.spell === 'hellish_rebuke' && target
        ? (unit.once('cast', { speed: 1.4 }),
          await vfx.spell('hellish_rebuke', { caster: this.who(unit), targets: [this.who(target)] }),
          this.markImpact(target.id))
        : /Trueno/.test(ev.name) && target
          ? (vfx.beam(unit.chest(), target.chest(), {
              col: 12103935,
              width: 0.12,
              life: 0.35,
              mode: 'bolt',
              glow: 2.4,
            }),
            vfx.element('thunder', target.chest(), { k: 0.6 }),
            this.markImpact(target.id))
          : /Palabras/.test(ev.name) && target
            ? await vfx.spell('vicious_mockery', { caster: this.who(unit), targets: [this.who(target)] })
            : /Desviar/.test(ev.name)
              ? (vfx.burst(unit.chest(), {
                  n: 16,
                  col: 16773328,
                  speed: 4,
                  life: 0.25,
                  size: 0.05,
                  stretch: 0.1,
                  glow: 2.4,
                }),
                vfx.ring(unit.chest(), {
                  color: 12574975,
                  radius: 0.8,
                  life: 0.3,
                  thick: 0.25,
                  vertical: this.S.camera.position.clone().sub(unit.chest()),
                  y: 0,
                }))
              : /Aguante/.test(ev.name)
                ? vfx.burst(unit.chest(), {
                    n: 16,
                    col: 11575440,
                    speed: 1.6,
                    life: 0.7,
                    size: 0.25,
                    size1: 0.5,
                    frame: FRAME.dust,
                    blend: 'alpha',
                    a: 0.5,
                  })
                : vfx.burst(unit.root.position.clone().setY(unit.root.position.y + 0.9), {
                    n: 18,
                    col: 10471679,
                    speed: 1.4,
                    life: 0.8,
                    size: 0.08,
                    frame: FRAME.star,
                    glow: 2,
                  }),
      await this.wait(300));
  }
  /** Forma salvaje: cambia la figura por la bestia (o la devuelve). */
  async wildShape(unit, form) {
    let vfx = this.vfx;
    if (
      (vfx.burst(unit.chest(), {
        n: 26,
        col: 6982218,
        speed: 1.6,
        life: 0.9,
        size: 0.35,
        size1: 0.8,
        frame: FRAME.smoke,
        blend: 'alpha',
        a: 0.6,
      }),
      vfx.burst(unit.chest(), {
        n: 20,
        col: 9424992,
        speed: 2.2,
        up: 1,
        life: 1,
        size: 0.14,
        frame: FRAME.leaf,
        blend: 'alpha',
        grav: -2,
        spin: 5,
      }),
      form)
    ) {
      let head = unit.headWorld();
      vfx.p({
        p: head.setY(head.y + 0.5),
        v: [0, 0.5, 0],
        life: 1,
        size: 0.5,
        size1: 0.6,
        col: 12116096,
        frame: FRAME.paw,
        glow: 1.8,
        rot: 0,
      });
    }
    (this.emit('battle:fx', { kind: 'shape', who: unit.id, form }), await this.wait(250));
    let makeForm = this.meta.makeForm,
      current = this.forms.get(unit.id);
    if (form) {
      let beast = null;
      try {
        beast = makeForm ? await makeForm(form, unit.id) : null;
      } catch (err) {
        console.warn('[combate] forma salvaje: sin modelo de', form, err);
      }
      if ((beast || (beast = makeBeast(form, unit.id)), !beast)) return;
      let orig = current ? current.orig : { ch: unit.ch, root: unit.root, owns: unit.owns };
      (current && this.scene.remove(current.beast.root),
        beast.root.position.copy(unit.root.position),
        (beast.root.rotation.y = unit.root.rotation.y),
        this.scene.add(beast.root),
        (orig.root.visible = !1),
        this.forms.set(unit.id, { orig, beast }),
        unit.setCharacter(beast, !0));
    } else
      current &&
        (current.orig.root.position.copy(unit.root.position),
        (current.orig.root.rotation.y = unit.root.rotation.y),
        (current.orig.root.visible = !0),
        this.scene.remove(current.beast.root),
        unit.setCharacter(current.orig.ch, current.orig.owns),
        this.forms.delete(unit.id));
    this.refresh();
  }
  /** Fin del combate: celebración, «battle:end», cartel y resolución de `run`. */
  async finish() {
    if (this.finished) return;
    ((this.finished = !0),
      (this.mode = 'busy'),
      this.clearTargeting(),
      this.hud.turnBar(null),
      this.hud.thinking(''));
    let won = this.state.winner === 0;
    await sleep(600 / this.turbo);
    let alive = this.units.list.filter((u) => u.team === 0 && !u.dead);
    if ((alive.length && this.focus(this.centroid(0), 18, !0), won))
      for (let unit of alive) unit.down || unit.once('cheer', { speed: 0.9 });
    (this.meta.emitStartEnd &&
      this.emit('battle:end', {
        group: this.meta.group ?? null,
        groups: this.meta.groups ?? null,
        won,
        fled: !1,
        level: this.meta.level ?? null,
        rounds: this.state.round,
      }),
      this.shotMode ||
        (await this.hud.big(
          won ? '\xA1Victoria!' : 'Derrota',
          won ? this.encounter.name || '' : 'El grupo ha ca\xEDdo',
          won ? '' : 'malo',
          2e3,
        )));
    let party = this.state.creatures.filter((c) => c.team === 0);
    (this.standalone &&
      this.hud.finish({ won, rounds: this.state.round, encounter: this.encounter, party }),
      this.resolveRun?.({ won, fled: !1, events: this.allEvents, rounds: this.state.round }));
  }
  /** Turnos enemigos rápidos. */
  setFast(on) {
    this.fast = on;
  }
  /** Desmonta oyentes, cierra el turno pendiente y devuelve las figuras originales. */
  dispose() {
    this.disposed = !0;
    for (let unbind of this.off.splice(0)) unbind();
    if (this.turnDone) {
      let done = this.turnDone;
      ((this.turnDone = null), done());
    }
    for (let [id, form] of this.forms) {
      let unit = this.unit(id);
      ((form.orig.root.visible = !0),
        unit && form.orig.root.position.copy(unit.root.position),
        this.scene.remove(form.beast.root),
        unit && unit.setCharacter(form.orig.ch, form.orig.owns));
    }
    (this.forms.clear(), (this.S.renderer.domElement.style.cursor = 'default'));
  }
};

export { Controller };
