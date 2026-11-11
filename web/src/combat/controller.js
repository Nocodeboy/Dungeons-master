// combat/controller.js
// Reconstruido de publicado/juego.js (módulo __esm «y1»). Nombres locales aún minificados.

import { MathUtils, Raycaster, Vector2, Vector3 } from 'three';
import { worldToPlane, planeToCell, cellKey, hexDistance, HEX_SIZE } from '../explore/hex.js';
import { Um, QS } from './hands.js';
import { auraStatesOf as BS } from '../vfx/conditions.js';
import efectosConjuros from '../datos/efectos/conjuros.json';
import { SPELL_LIKE_FEATURES as o1 } from '../vfx/spells.js';
import { DAMAGE_STYLE } from '../vfx/styles.js';
import { FRAME } from '../vfx/atlas.js';
import { jm } from './creatures.js';
import { Bm, cr, Ec } from './hud.js';

const v1 = (o) => new Promise((e) => setTimeout(e, o));
const fH = typeof matchMedia == 'function' && matchMedia('(pointer: coarse)').matches;
const mH = fH ? 'Toca otra vez a' : 'Haz clic otra vez en';
const gH = {
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
const n3 = {
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
const o3 = {
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
const s3 = /skeleton|zombie|wight|ghoul|ghost|specter|wraith|mummy/;
const Controller = class {
  constructor(e) {
    ((this.rules = e.rules),
      (this.S = e.stage),
      (this.scene = e.scene),
      (this.hud = e.hud),
      (this.units = e.units),
      (this.board = e.board),
      (this.vfx = e.vfx),
      (this.bus = e.bus || null),
      (this.cellToWorld = e.cellToWorld),
      (this.bounds = e.bounds),
      (this.standalone = !!e.standalone),
      (this.shotMode = !!e.shotMode),
      (this.meta = e.meta || {}),
      (this.state = e.init.state),
      (this.encounter = e.init.state.encounter || {}),
      (this.initEvents = e.init.events || []),
      (this.surprised = new Set(e.surprised || [])),
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
      (this.vfx.onFx = (t, a) => this.bus?.emit('battle:fx', { ...a, kind: t })),
      (this.vfx.bloodless = !1),
      this.bindInput(),
      this.hud.bind(this),
      this.hud.setup(this.state, this.units, this.encounter),
      this.hud.setSurprised([...this.surprised]));
    for (let t of this.meta.auto || []) this.hud.setAuto(t, !0);
    this.syncAuras();
  }
  creature(e) {
    return this.state.creatures.find((t) => t.id === e);
  }
  unit(e) {
    return this.units.byId.get(e);
  }
  refresh() {
    let e = this.rules('state');
    return (
      e && !e.error && (e.encounter || (e.encounter = this.encounter), (this.state = e)),
      this.hud.refresh(this.state),
      this.syncAuras(),
      this.state
    );
  }
  syncAuras() {
    for (let e of this.state.creatures) {
      let t = this.unit(e.id);
      if (!t) continue;
      this.vfx.auras.sync(e.id, QS(t), t.dead ? new Set() : BS(e));
      let a = new Set((e.effects || []).map((s) => s.kind)),
        n = a.has('enlarged') ? 1.35 : a.has('reduced') ? 0.7 : 1;
      (t.sizeK === void 0 && (t.sizeK = 1),
        t.sizeK !== n && (t.root.scale.multiplyScalar(n / t.sizeK), (t.sizeK = n)));
    }
  }
  wait(e) {
    return v1(e / this.speed / this.turbo);
  }
  who(e) {
    let t = typeof e == 'string' ? this.unit(e) : e;
    if (!t) return null;
    let a = t.root.getWorldPosition(new Vector3()),
      n = t.targetYaw ?? t.root.rotation.y;
    return {
      id: t.id,
      pos: a,
      chest: t.chest(),
      head: t.headWorld(),
      hand: Um(t),
      fwd: new Vector3(Math.sin(n), 0, Math.cos(n)),
      ally: t.team === 0,
    };
  }
  planeToWorld(e) {
    let t = planeToCell(e[0], e[1]),
      a = this.cellToWorld(t);
    return new Vector3(e[0] * HEX_SIZE, a.y, e[1] * HEX_SIZE);
  }
  emit(e, t) {
    try {
      this.bus?.emit(e, t);
    } catch (a) {
      console.error('[combate] bus', e, a);
    }
  }
  focus(e, t = null, a = !1) {
    if (!a && this.comfortable(e, t)) return;
    let n = t ?? this.camGoal?.dist ?? null;
    this.camGoal = { target: new Vector3(e.x, (e.y || 0) + 0.6, e.z), dist: n };
  }
  comfortable(e, t) {
    let a = new Vector3(e.x, (e.y || 0) + 0.6, e.z).project(this.S.camera);
    if (a.z > 1) return !1;
    let n = Math.abs(a.x) < 0.55 && Math.abs(a.y) < 0.5,
      s = this.camDist(),
      i = !t || Math.abs(s - t) / t < 0.35;
    return n && i;
  }
  focusUnit(e, t = null, a = !1) {
    e && this.focus(e.root.getWorldPosition(new Vector3()), t, a);
  }
  framePair(e, t, a = !1) {
    if (!e || !t) return;
    let n = e.root.getWorldPosition(new Vector3()),
      s = t.root.getWorldPosition(new Vector3());
    if (!a && this.comfortable(n, null) && this.comfortable(s, null)) return;
    let i = n.distanceTo(s);
    this.focus(
      n.clone().add(s).multiplyScalar(0.5),
      Math.max(Math.min(this.camDist(), 30), i * 1.25 + 12),
      !0,
    );
  }
  frameArea(e) {
    if (!e || !e.length) return;
    let t = e.map((s) => this.cellToWorld(s)),
      a = t.reduce((s, i) => s.add(i), new Vector3()).divideScalar(t.length),
      n = 0;
    for (let s of t) n = Math.max(n, s.distanceTo(a));
    this.focus(a, Math.max(this.camDist(), n * 2.4 + 12));
  }
  centerOnCurrent() {
    let e = this.unit(this.state.current);
    e && this.focusUnit(e, 24, !0);
  }
  camDist() {
    return this.S.camera.position.distanceTo(this.S.controls.target);
  }
  update(e) {
    if ((this.board.update(e), this.camGoal)) {
      let n = this.S.controls,
        s = Math.min(1, e * 3.2),
        i = n.target.clone();
      if (
        (n.target.lerp(this.camGoal.target, s),
        this.S.camera.position.add(n.target.clone().sub(i)),
        this.camGoal.dist)
      ) {
        let r = this.S.camera.position.clone().sub(n.target),
          l = r.length();
        (r.setLength(l + (this.camGoal.dist - l) * s), this.S.camera.position.copy(n.target).add(r));
      }
      n.target.distanceTo(this.camGoal.target) < 0.02 &&
        (!this.camGoal.dist || Math.abs(this.camDist() - this.camGoal.dist) < 0.05) &&
        (this.camGoal = null);
    }
    let t = this.S.controls.target,
      a = this.bounds;
    if (a) {
      let n = MathUtils.clamp(t.x, a.minX - 6, a.maxX + 6),
        s = MathUtils.clamp(t.z, a.minZ - 5, a.maxZ + 5);
      (n !== t.x || s !== t.z) &&
        ((this.S.camera.position.x += n - t.x), (this.S.camera.position.z += s - t.z), (t.x = n), (t.z = s));
    }
    if (this.keys && this.keys.size) {
      let n = new Vector3(),
        s = t.clone().sub(this.S.camera.position).setY(0).normalize(),
        i = new Vector3(-s.z, 0, s.x);
      ((this.keys.has('w') || this.keys.has('arrowup')) && n.add(s),
        (this.keys.has('s') || this.keys.has('arrowdown')) && n.sub(s),
        (this.keys.has('d') || this.keys.has('arrowright')) && n.add(i),
        (this.keys.has('a') || this.keys.has('arrowleft')) && n.sub(i),
        n.lengthSq() && (n.setLength(e * 14), t.add(n), this.S.camera.position.add(n), (this.camGoal = null)),
        (this.keys.has('q') || this.keys.has('e')) && this.rotate(this.keys.has('q') ? e * 1.6 : -e * 1.6));
    }
  }
  rotate(e) {
    let t = this.S.controls.target,
      a = this.S.camera.position.clone().sub(t);
    (a.applyAxisAngle(new Vector3(0, 1, 0), e), this.S.camera.position.copy(t).add(a));
  }
  centroid(e) {
    let t = this.units.list.filter((a) => a.team === e && !a.dead);
    return t.length
      ? t
          .reduce((a, n) => a.add(n.root.getWorldPosition(new Vector3())), new Vector3())
          .divideScalar(t.length)
      : null;
  }
  run() {
    return new Promise((e) => {
      ((this.resolveRun = e),
        this.start().catch((t) => {
          (console.error('[combate]', t), this.finish());
        }));
    });
  }
  async start() {
    let e = this.S,
      t = this.centroid(0) || new Vector3(),
      a = this.centroid(1) || t.clone(),
      n = t.clone().add(a).multiplyScalar(0.5),
      s = innerWidth / innerHeight;
    if (this.standalone) {
      let i = this.bounds,
        r = i ? new Vector3((i.minX + i.maxX) / 2, 0, (i.minZ + i.maxZ) / 2) : n;
      e.controls.target.set(r.x, 0.6, r.z);
      let l = s < 1 ? 50 : s < 1.5 ? 42 : 37,
        c = 1.02;
      (e.camera.position.copy(e.controls.target).add(new Vector3(0, Math.sin(c) * l, Math.cos(c) * l)),
        e.camera.lookAt(e.controls.target));
    } else this.focus(n, Math.max(this.camDist(), t.distanceTo(a) * 1.1 + 14), !0);
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
          creatures: this.state.creatures.map((i) => ({ id: i.id, team: i.team, name: i.name })),
        }),
      this.standalone &&
        !this.shotMode &&
        !this.meta.skipIntro &&
        (this.focus(a, 30, !0), await this.hud.intro(this.encounter)),
      this.focus(t, s < 1 ? 44 : 35, !0),
      this.surprised.size && !this.shotMode)
    ) {
      let i = [...this.surprised].every((l) => this.creature(l)?.team === 1),
        r = [...this.surprised].every((l) => this.creature(l)?.team === 0);
      i
        ? await this.hud.big(
            '\xA1Sorpresa!',
            'Los enemigos no os han visto venir: tiran la iniciativa con desventaja.',
            '',
            1900,
          )
        : r &&
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
  async loop() {
    let e = 0;
    for (; !this.state.over && !this.disposed && e++ < 3e3;) {
      let t = this.creature(this.state.current);
      if (!t) break;
      if (
        (this.hud.refresh(this.state),
        this.emit('battle:turn', {
          creature: t.id,
          isPc: t.team === 0,
          name: t.name,
          round: this.state.round,
        }),
        t.team === 0 && t.can_act && !this.autoParty && !this.isAuto(t)
          ? await this.playerTurn(t)
          : await this.aiTurn(t),
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
  isAuto(e) {
    return this.meta.auto?.has?.(e.id) || !1;
  }
  toggleAuto(e) {
    this.meta.auto instanceof Set || (this.meta.auto = new Set(this.meta.auto || []));
    let t = !this.meta.auto.has(e);
    if (
      (t ? this.meta.auto.add(e) : this.meta.auto.delete(e),
      this.hud.setAuto(e, t),
      t && this.turnDone && this.state.current === e && this.mode !== 'busy')
    ) {
      let a = this.turnDone;
      ((this.turnDone = null),
        (this.mode = 'busy'),
        this.clearTargeting(),
        this.hud.turnBar(null),
        this.aiTurn(this.creature(e)).then(a));
    }
  }
  async aiTurn(e) {
    ((this.mode = 'busy'), this.clearTargeting());
    let t = e.team === 1;
    ((this.speed = t ? (this.fast ? 2.6 : 1.5) : 1),
      (this.vfx.timeScale = this.turbo * (t && this.fast ? 1.6 : 1)));
    let a = this.unit(e.id);
    if (e.hp > 0 && !e.dead) {
      (this.setActive(e.id),
        this.focusUnit(a, null, !this.comfortable(a.root.position, null)),
        this.hud.thinking(`Turno de ${cr(e)}\u2026`),
        t && !this.fast && !this.shotMode && this.hud.banner(cr(e), 'enemigo', 650),
        await this.wait(t ? 420 : 260));
      let n = this.rules('ai_turn');
      (this.hud.thinking(''), await this.play(n.events || []), await this.wait(t ? 260 : 180));
    }
    ((this.speed = 1), (this.vfx.timeScale = this.turbo));
  }
  playerTurn(e) {
    return new Promise((t) => {
      ((this.turnDone = t),
        (this.speed = 1),
        (this.vfx.timeScale = this.turbo),
        this.focusUnit(this.unit(e.id), null, !1),
        this.hud.banner(`Turno de ${cr(e)}`, 'oro', 900),
        this.enterIdle(e));
    });
  }
  endTurn() {
    if (!this.turnDone) return;
    ((this.mode = 'busy'), this.clearTargeting(), this.hud.turnBar(null));
    let e = this.turnDone;
    ((this.turnDone = null), e());
  }
  setActive(e) {
    for (let t of this.units.list) t.setRing(t.id === e ? 'active' : 'idle');
    this.hud.setActive(e);
  }
  highlight(e, t) {
    let a = this.unit(e);
    !a ||
      a.dead ||
      (t && a.ringState === 'idle' ? a.setRing('hover') : !t && a.ringState === 'hover' && a.setRing('idle'));
  }
  enterIdle(e) {
    ((e = this.creature(e.id) || e),
      (this.mode = 'idle'),
      (this.pending = null),
      this.hud.hidePreview(),
      this.hud.prompt(''),
      this.hud.closeSheet(),
      (this.opts = this.rules('options') || {}),
      this.setActive(e.id),
      this.showMoveRange(e),
      this.hud.turnBar(e, this.opts),
      this.opts.nothing_left &&
        setTimeout(() => {
          this.mode === 'idle' && this.state.current === e.id && this.endTurn();
        }, 700));
  }
  showMoveRange(e) {
    let t = this.opts;
    (this.board.clear(), (this.moveMap = new Map()));
    for (let [n, s, i, r, l] of t.move || [])
      this.moveMap.set(cellKey(n, s), { cell: [n, s], ft: i, prev: [r, l], dash: !1 });
    this.dashMap = new Map();
    for (let [n, s, i, r, l] of t.dash || [])
      this.moveMap.has(cellKey(n, s)) ||
        this.dashMap.set(cellKey(n, s), { cell: [n, s], ft: i, prev: [r, l], dash: !0 });
    let a = cellKey(...e.cell);
    (this.board.set(
      'move',
      [...this.moveMap.values()].filter((n) => cellKey(...n.cell) !== a).map((n) => n.cell),
      5941503,
    ),
      this.board.set(
        'dash',
        [...this.dashMap.values()].map((n) => n.cell),
        16763989,
      ));
  }
  pathTo(e, t) {
    let a = cellKey(...e),
      n = this.moveMap?.has(a) ? this.moveMap : this.dashMap?.has(a) ? this.dashMap : null;
    if (!n) return null;
    let s = [],
      i = n.get(a),
      r = 0;
    for (; i && r++ < 80 && !(i.cell[0] === t[0] && i.cell[1] === t[1]);) {
      s.unshift(i.cell);
      let l = cellKey(...i.prev);
      if (l === cellKey(...i.cell)) break;
      i = n.get(l) || (n === this.dashMap ? this.moveMap.get(l) : null);
    }
    return { path: s, dash: n === this.dashMap, ft: n.get(a).ft };
  }
  clearTargeting() {
    (this.board.clear(),
      this.hud.cursorNote(''),
      (this.hoverKey = ''),
      this.hud.hidePreview(),
      this.hud.prompt(''),
      this.hud.closeSheet(),
      this.hud.hideTip());
    for (let e of this.units.list)
      (e.ringState === 'target' || e.ringState === 'hover' || e.ringState === 'threat') && e.setRing('idle');
  }
  cancelPending() {
    let e = this.creature(this.state.current);
    this.mode === 'target' && e && this.turnDone ? this.enterIdle(e) : this.hud.hidePreview();
  }
  listen(e, t, a, n) {
    (e.addEventListener(t, a, n), this.off.push(() => e.removeEventListener(t, a, n)));
  }
  bindInput() {
    let e = this.S.renderer.domElement,
      t = null;
    (this.listen(e, 'pointerdown', (a) => {
      a.button === 0 && (t = [a.clientX, a.clientY, performance.now()]);
    }),
      this.listen(e, 'pointerup', (a) => {
        if (a.button !== 0 || !t) return;
        let n = Math.hypot(a.clientX - t[0], a.clientY - t[1]);
        ((t = null), !(n > 8) && this.onTap(a));
      }),
      this.listen(e, 'pointermove', (a) => this.onHover(a)),
      this.listen(e, 'contextmenu', (a) => a.preventDefault()),
      this.listen(e, 'pointerleave', () => this.hud.hideTip()),
      (this.keys = new Set()),
      this.listen(window, 'keydown', (a) => {
        if (a.target && (a.target.tagName === 'INPUT' || a.target.tagName === 'TEXTAREA')) return;
        let n = a.key.toLowerCase();
        if (n === 'escape') {
          this.hud.sheetOpen()
            ? this.hud.closeSheet()
            : this.mode === 'target' || this.hud.previewOpen()
              ? this.cancelPending()
              : this.meta.ui?.open && this.meta.ui.open('pausa', { combat: !0 });
          return;
        }
        if (n === ' ' || n === 'enter') {
          this.hud.previewOpen() && this.hud.onConfirm
            ? (a.preventDefault(), this.hud.confirmPreview())
            : this.mode === 'idle' && this.turnDone && (a.preventDefault(), this.endTurn());
          return;
        }
        let s = { 1: 'attack', 2: 'spells', 3: 'features', 4: 'actions', 5: 'items' }[n];
        if (s && this.turnDone) {
          this.menu(s);
          return;
        }
        if (n === 'z' && this.turnDone) return void this.undoMove();
        if (n === 'c') return void this.centerOnCurrent();
        if (n === 'f') return void this.hud.toggleFast();
        if (n === 'l') return void this.hud.toggleLog();
        this.keys.add(n);
      }),
      this.listen(window, 'keyup', (a) => this.keys.delete(a.key.toLowerCase())),
      this.listen(window, 'blur', () => this.keys.clear()));
  }
  pick(e) {
    let t = this.S.renderer.domElement.getBoundingClientRect();
    (this.ptr.set(((e.clientX - t.left) / t.width) * 2 - 1, -((e.clientY - t.top) / t.height) * 2 + 1),
      this.ray.setFromCamera(this.ptr, this.S.camera));
    let a = this.ray.intersectObjects(this.units.proxies, !1),
      n = null;
    for (let l of a) {
      let c = this.unit(l.object.userData.unit),
        d = c && this.creature(c.id);
      if (d && !d.dead) {
        n = c;
        break;
      }
    }
    let s = this.board.ground(this.ray),
      i = s ? this.board.cellAtWorld(s) : null;
    n && (i = n.cell.slice());
    let r = i ? this.state.creatures.find((l) => !l.dead && l.cell[0] === i[0] && l.cell[1] === i[1]) : null;
    return { cell: i, gp: s, creature: r || (n ? this.creature(n.id) : null) };
  }
  onHover(e) {
    if (this.disposed) return;
    let t = this.pick(e),
      a = this.creature(this.state.current),
      n = this.turnDone && a && a.team === 0;
    t.creature
      ? this.hud.tip(t.creature, e.clientX, e.clientY, !1, this.tipExtra(a, t.creature))
      : this.hud.hideTip();
    for (let r of this.units.list) r.ringState === 'hover' && r.setRing('idle');
    if (t.creature && t.creature.id !== this.state.current) {
      let r = this.unit(t.creature.id);
      r && r.ringState === 'idle' && r.setRing('hover');
    }
    let s = t.cell ? cellKey(...t.cell) : '';
    if (!n) {
      (this.board.clear('hover'), (this.S.renderer.domElement.style.cursor = 'default'));
      return;
    }
    let i = 'default';
    if (this.mode === 'idle')
      if (
        (t.creature && t.creature.team !== 0 && t.creature.hp > 0
          ? (i = 'crosshair')
          : t.cell && (this.moveMap?.has(s) || this.dashMap?.has(s)) && (i = 'pointer'),
        s !== this.hoverKey)
      ) {
        ((this.hoverKey = s), this.board.clear('path', 'hover', 'threat'));
        for (let r of this.units.list) r.ringState === 'threat' && r.setRing('idle');
        if (t.cell && !t.creature && (this.moveMap.has(s) || this.dashMap.has(s))) {
          let r = this.pathTo(t.cell, a.cell);
          if (r) {
            let l = this.threatsOf(r.path),
              c = l.length ? 16742992 : r.dash ? 16766842 : 15397631;
            (this.board.route(a.cell, r.path, c), this.board.set('path', [t.cell], c));
            for (let d of l) this.unit(d)?.setRing('threat');
            this.hud.cursorNote(
              `${Ec((r.ft / 5) * 1.5)} m${r.dash ? ' \xB7 corriendo' : ''}${l.length ? ' \xB7 \xA1ataque de oportunidad!' : ''}`,
              e.clientX,
              e.clientY,
            );
          }
        } else this.hud.cursorNote('');
        t.creature &&
          t.creature.team !== 0 &&
          t.creature.hp > 0 &&
          this.board.set('hover', [t.cell], 16734778);
      } else this.hud.cursorNoteVisible() && this.hud.moveCursorNote(e.clientX, e.clientY);
    else if (this.mode === 'target' && this.pending) {
      let r = this.pending.kind;
      if (
        (r === 'spell' || r === 'feature') &&
        (this.pending.target === 'point' || this.pending.target === 'direction') &&
        t.gp
      ) {
        i = 'crosshair';
        let c = performance.now();
        !this.pending.locked &&
          c - (this.lastAreaHover || 0) > 60 &&
          ((this.lastAreaHover = c),
          r === 'spell' ? this.previewArea(worldToPlane(t.gp), !0) : this.previewFeatureArea(t, !0));
      } else t.creature && (i = 'pointer');
    }
    this.S.renderer.domElement.style.cursor = i;
  }
  threatsOf(e) {
    let t = e.map((s) => s.join(',')).join(';');
    if (this._threatKey === t) return this._threatIds;
    let a = this.rules('threats', { path: e }) || [],
      n = [];
    for (let s of Array.isArray(a) ? a : []) {
      let i = this.state.creatures.find((r) => r.name === s && r.team !== 0);
      i && n.push(i.id);
    }
    return ((this._threatKey = t), (this._threatIds = n), n);
  }
  tipExtra(e, t) {
    if (!e || e.team !== 0 || !this.turnDone || t.team === 0 || t.hp <= 0 || this.mode !== 'idle') return '';
    if (!this._planCache || this._planCache.id !== t.id || this._planCache.turn !== e.id) {
      let n = this.rules('attack_plan', { target: t.id, key: '' });
      this._planCache = { id: t.id, turn: e.id, plan: n };
    }
    let a = this._planCache.plan;
    return a?.ok
      ? `<span>${a.name}: ${Math.round(a.p_hit * 100)} % de impacto</span>`
      : a?.reason
        ? `<span class="dim">${a.reason}</span>`
        : '';
  }
  onTap(e) {
    if (this.mode === 'busy' || this.disposed) return;
    if (this.hud.sheetOpen()) {
      this.hud.closeSheet();
      return;
    }
    let t = this.creature(this.state.current);
    if (!t || t.team !== 0 || !this.turnDone) return;
    let a = this.pick(e);
    (!a.cell && !a.gp) ||
      (this.mode === 'idle' ? this.tapIdle(t, a, e) : this.mode === 'target' && this.tapTarget(t, a, e));
  }
  async tapIdle(e, t, a) {
    let n = t.creature;
    if (n && n.team !== e.team && n.hp > 0) {
      this.proposeAttack(e, n, '');
      return;
    }
    if (n) {
      this.hud.tip(n, a.clientX, a.clientY, !0);
      return;
    }
    if (!t.cell) return;
    let s = this.pathTo(t.cell, e.cell);
    if (!s) {
      this.hud.banner('No llegas ah\xED', 'apagado', 700);
      return;
    }
    let i = this.rules('threats', { path: s.path });
    if (i.length) {
      ((this.mode = 'target'),
        (this.pending = { kind: 'move', path: s.path, dash: s.dash, cell: t.cell }),
        this.board.route(e.cell, s.path, 16742992),
        this.hud.preview(
          this.cellToWorld(t.cell),
          [
            {
              t: 'bad',
              s: `Cuidado: al alejarte provocar\xE1s un ataque de oportunidad de ${i.join(', ')}.`,
            },
            { t: 'dim', s: 'Usa Destrabarse para evitarlo.' },
          ],
          'Moverse igualmente',
          () => this.doMove(e, s.path, s.dash),
        ),
        this.hud.prompt('Movimiento arriesgado', !0));
      return;
    }
    await this.doMove(e, s.path, s.dash);
  }
  async doMove(e, t, a) {
    ((this.mode = 'busy'), this.clearTargeting());
    let n = this.rules('move', { path: t, dash: a });
    (await this.play(n.events), this.afterAction(e));
  }
  afterAction(e) {
    if (this.disposed) return;
    if ((this.refresh(), this.state.over)) {
      this.endTurn();
      return;
    }
    let t = this.creature(e.id);
    if (this.state.current !== e.id || !t || !t.can_act) {
      this.endTurn();
      return;
    }
    this.enterIdle(t);
  }
  proposeAttack(e, t, a) {
    let n = this.rules('attack_plan', { target: t.id, key: a });
    if (!n.ok) {
      this.hud.banner(n.reason || 'No puedes', 'apagado', 900);
      return;
    }
    ((this.mode = 'target'), (this.pending = { kind: 'attack', plan: n }));
    let s = this.unit(t.id),
      i = this.unit(e.id);
    (this.board.clear('move', 'dash', 'hover', 'path'),
      this.board.set('target', [t.cell], 16730672),
      n.path.length && this.board.route(e.cell, n.path, n.risky ? 16742992 : 15397631),
      s.setRing('target'),
      this.framePair(i, s));
    let r = n.others.map((l) => ({ label: l.name, on: () => this.proposeAttack(e, t, l.key) }));
    (this.hud.preview(s.headWorld(), n.lines, n.button, () => this.executeAttack(), r, !0, n.p_hit),
      this.hud.prompt(`${mH} ${t.name} o confirma`, !0));
  }
  async executeAttack() {
    let e = this.creature(this.state.current),
      t = this.pending.plan;
    ((this.mode = 'busy'), this.clearTargeting());
    let a = this.rules('attack', { key: t.key, target: t.target, path: t.path });
    if ((await this.play(a.events), this.refresh(), a.offhand && !this.state.over)) {
      this.offerOffhand(e, a.offhand);
      return;
    }
    this.afterAction(e);
  }
  offerOffhand(e, t) {
    ((this.mode = 'target'), (this.pending = { kind: 'offhand', off: t }));
    let a = this.unit(t.target);
    (a.setRing('target'),
      this.hud.preview(
        a.headWorld(),
        [
          { t: 'b', s: 'Ataque con la otra mano' },
          {
            t: '',
            s: `${t.name} contra ${t.target_name} (acci\xF3n adicional, sin modificador al da\xF1o).`,
          },
        ],
        'Golpear',
        async () => {
          ((this.mode = 'busy'),
            this.clearTargeting(),
            await this.play(this.rules('offhand', { key: t.key, target: t.target }).events),
            this.afterAction(e));
        },
      ),
      this.hud.prompt('\xBFAtacar tambi\xE9n con la otra mano?', !0));
  }
  startAttackPick(e, t) {
    ((this.mode = 'target'), (this.pending = { kind: 'attack_pick', key: t }));
    let a = [];
    for (let s of this.state.creatures) {
      if (s.team === e.team || s.dead || s.hp <= 0) continue;
      this.rules('attack_plan', { target: s.id, key: t }).ok && a.push(s.cell);
    }
    (this.board.clear('hover', 'path'), this.board.set('target', a, 16730672));
    let n = (this.opts.profiles || []).find((s) => s.key === t);
    this.hud.prompt(a.length ? `Elige objetivo: ${n ? n.name : ''}` : 'Nadie a tu alcance con esa arma', !0);
  }
  chooseSpell(e, t) {
    let a = t.slots || [];
    if (a.length > 1 && t.upcastable) {
      this.hud.sheet(
        '\xBFA qu\xE9 nivel?',
        a.map((n) => ({
          id: String(n),
          icon: 'magic',
          title: `Nivel ${n}`,
          cost: `${e.slots[n - 1] ?? 0} libres`,
          desc: `Lanzar ${t.name} con un espacio de nivel ${n}.`,
          enabled: !0,
          magic: !0,
        })),
        (n) => this.startSpell(e, t, Number(n.id)),
      );
      return;
    }
    this.startSpell(e, t, a.length ? a[0] : 0);
  }
  startSpell(e, t, a) {
    let n = this.rules('spell_begin', { spell: t.id, slot: a });
    ((this.mode = 'target'),
      (this.pending = {
        kind: 'spell',
        spell: t.id,
        name: n.name,
        slot: a,
        target: n.target,
        area: n.area,
        max: n.max,
        n: n.n,
        valid: n.valid || [],
        cells: n.cells || [],
        targets: [],
      }),
      this.board.clear());
    let s = n.target;
    if (s === 'self') {
      ((this.pending.targets = [e.id]),
        n.area
          ? ((this.pending.locked = !0),
            this.previewArea(null, !1),
            this.hud.prompt(`${n.name}: confirma para lanzarlo a tu alrededor`, !0))
          : this.confirmSpell());
      return;
    }
    if (s === 'point' || s === 'direction') {
      (s === 'point' && this.board.set('range', n.cells, 11832575),
        this.hud.prompt(
          s === 'point'
            ? `${n.name}: elige d\xF3nde centrar el \xE1rea`
            : `${n.name}: elige hacia d\xF3nde lanzarlo`,
          !0,
        ));
      return;
    }
    if (s === 'cell') {
      (this.board.set('range', n.cells, 11832575), this.hud.prompt(`${n.name}: elige una casilla`, !0));
      return;
    }
    if (s === 'darts' || s === 'rays') {
      (this.highlightSpellTargets(e),
        this.hud.prompt(
          n.n === 1
            ? `${n.name}: elige objetivo`
            : `${n.name}: reparte ${n.n} ${s === 'darts' ? 'dardos' : 'rayos'} entre los enemigos`,
          !0,
        ));
      return;
    }
    (this.highlightSpellTargets(e),
      this.pending.valid.length
        ? this.hud.prompt(
            `${n.name}: elige ${n.max === 1 ? 'objetivo' : `hasta ${n.max} objetivos`}`,
            !0,
            n.max > 1
              ? { label: 'Lanzar', on: () => this.pending.targets.length && this.confirmSpell() }
              : null,
          )
        : this.hud.prompt(`${n.name}: no hay objetivos v\xE1lidos`, !0));
  }
  highlightSpellTargets(e) {
    let t = [],
      a = [];
    for (let n of this.pending.valid) {
      let s = this.creature(n);
      s && (t.push(s.cell), a.push(s.team !== e.team ? 12619007 : 7331978));
    }
    this.board.set('target', t, (n, s) => a[s]);
  }
  previewArea(e, t) {
    let a = this.pending,
      n = { spell: a.spell, slot: a.slot, targets: a.targets };
    (e && a.target === 'point' && (n.point = [e.x, e.y]),
      e && a.target === 'direction' && (n.dir = [e.x, e.y]));
    let s = this.rules('spell_preview', n);
    if (!s.ok)
      return (
        this.board.clear('area'),
        t || this.hud.banner(s.reason || 'Fuera de alcance', 'apagado', 700),
        null
      );
    let i = new Set((s.allies_hit || []).map((r) => cellKey(...this.creature(r).cell)));
    this.board.set('area', s.area || [], (r) => (i.has(cellKey(...r)) ? 16728112 : 11566335));
    for (let r of this.units.list) r.ringState === 'target' && r.setRing('idle');
    for (let r of s.area || []) {
      let l = this.state.creatures.find((c) => !c.dead && c.cell[0] === r[0] && c.cell[1] === r[1]);
      l && this.unit(l.id)?.setRing('target');
    }
    if (!t) {
      (s.point && (a.point = s.point), n.dir && (a.dir = n.dir), (a.area = s.area || []));
      let r =
        s.area && s.area.length
          ? this.cellToWorld(s.area[Math.floor(s.area.length / 2)])
          : this.unit(this.state.current).root.position;
      this.hud.preview(r, s.lines, 'Lanzar', () => this.confirmSpell(), [], s.can !== !1);
    }
    return s;
  }
  tapSpell(e, t) {
    let a = this.pending,
      n = a.target;
    if (n === 'point' || n === 'direction') {
      if (!t.gp) return;
      let i = worldToPlane(t.gp);
      if (n === 'point' && a.point && Math.hypot(a.point[0] - i.x, a.point[1] - i.y) < 0.6) {
        this.confirmSpell();
        return;
      }
      if (
        n === 'direction' &&
        a.area &&
        t.cell &&
        a.area.some((r) => r[0] === t.cell[0] && r[1] === t.cell[1]) &&
        a.dir
      ) {
        this.confirmSpell();
        return;
      }
      ((a.locked = !1), this.previewArea(i, !1) && (a.locked = !0));
      return;
    }
    if (n === 'cell') {
      if (!t.cell || !a.cells.some((i) => i[0] === t.cell[0] && i[1] === t.cell[1])) {
        this.hud.banner('Casilla no v\xE1lida', 'apagado', 700);
        return;
      }
      if (a.cell && a.cell[0] === t.cell[0] && a.cell[1] === t.cell[1]) {
        this.confirmSpell();
        return;
      }
      ((a.cell = t.cell),
        this.board.set('target', [t.cell], 11832575),
        this.hud.prompt(`${a.name}: confirma la casilla`, !0, {
          label: 'Lanzar',
          on: () => this.confirmSpell(),
        }));
      return;
    }
    let s = t.creature;
    if (!(!s || !a.valid.includes(s.id))) {
      if (n === 'darts' || n === 'rays') {
        (a.targets.push(s.id),
          this.hud.float(
            this.unit(s.id).headWorld(),
            `\xD7${a.targets.filter((i) => i === s.id).length}`,
            'magia',
          ),
          a.targets.length >= a.n
            ? this.confirmSpell()
            : this.hud.prompt(`${a.name}: ${a.targets.length}/${a.n} \xB7 elige m\xE1s objetivos`, !0, {
                label: 'Todos al \xFAltimo',
                on: () => this.confirmSpell(),
              }));
        return;
      }
      if (a.targets.includes(s.id)) {
        if (a.max === 1) {
          this.confirmSpell();
          return;
        }
        a.targets = a.targets.filter((i) => i !== s.id);
      } else a.max === 1 ? (a.targets = [s.id]) : a.targets.length < a.max && a.targets.push(s.id);
      if (a.max === 1) {
        this.spellPreview(e);
        return;
      }
      (this.board.set(
        'area',
        a.targets.map((i) => this.creature(i).cell),
        16767050,
      ),
        this.hud.prompt(
          `${a.name}: ${a.targets.length}/${a.max} elegidos`,
          !0,
          a.targets.length ? { label: 'Lanzar', on: () => this.confirmSpell() } : null,
        ),
        a.targets.length >= a.max && this.spellPreview(e));
    }
  }
  spellPreview(e) {
    let t = this.pending,
      a = this.rules('spell_preview', { spell: t.spell, slot: t.slot, targets: t.targets }),
      n = this.unit(t.targets[0]) || this.unit(e.id);
    t.targets[0] && t.targets[0] !== e.id && (this.framePair(this.unit(e.id), n), n.setRing('target'));
    let s = (a.lines || []).map((i) => /(\d+) %/.exec(i.s)).find(Boolean);
    this.hud.preview(
      n.headWorld(),
      a.lines || [],
      'Lanzar',
      () => this.confirmSpell(),
      [],
      !0,
      s ? Number(s[1]) / 100 : null,
    );
  }
  async confirmSpell() {
    let e = this.creature(this.state.current),
      t = this.pending;
    if (!t) return;
    if ((t.target === 'darts' || t.target === 'rays') && t.targets.length && t.targets.length < t.n) {
      let s = t.targets[t.targets.length - 1];
      for (; t.targets.length < t.n;) t.targets.push(s);
    }
    if ((t.target === 'point' && !t.point) || (t.target === 'direction' && !t.dir)) return;
    let a = { spell: t.spell, slot: t.slot, targets: t.targets };
    (t.point && (a.point = t.point),
      t.dir && (a.dir = t.dir),
      t.cell && (a.cell = t.cell),
      (this.mode = 'busy'),
      this.clearTargeting());
    let n = this.rules('cast', a);
    (n.ok || this.hud.banner('No se puede lanzar as\xED', 'malo', 900),
      await this.play(n.events || []),
      this.afterAction(e));
  }
  menu(e) {
    let t = this.creature(this.state.current);
    if (!t || !this.turnDone || this.mode === 'busy') return;
    this.mode === 'target' && this.enterIdle(t);
    let a = this.opts;
    if (e === 'attack') {
      let n = (a.profiles || []).map((s) => ({
        id: s.key,
        icon: s.kind === 'melee' ? 'melee' : s.kind === 'thrown' ? 'thrown' : 'ranged',
        title: s.name,
        cost: `${s.bonus >= 0 ? '+' : ''}${s.bonus}`,
        desc: `${s.damage_text.join(' + ')} \xB7 ${s.kind === 'melee' ? `alcance ${Ec(s.reach * 1.5)} m` : `distancia ${Ec(s.range[0] * 1.5)}/${Ec(s.range[1] * 1.5)} m`}${s.mastery_name ? ` \xB7 ${s.mastery_name}` : ''}${s.ammo_left >= 0 ? ` \xB7 quedan ${s.ammo_left}` : ''}`,
        enabled: t.turn.action > 0 || t.turn.attack_left > 0,
      }));
      if (!n.length) return;
      this.hud.sheet('Atacar con\u2026', n, (s) => this.startAttackPick(t, s.id));
    } else if (e === 'spells') {
      let n = (a.spells || []).slice().sort((i, r) => i.level - r.level);
      if (!n.length) return;
      let s = n.map((i) => ({
        id: i.id,
        icon: i.icon || 'magic',
        title: i.name,
        group:
          i.level === 0
            ? 'Trucos'
            : `Nivel ${i.level}${t.slots_max?.[i.level - 1] ? ` \xB7 ${t.slots?.[i.level - 1] ?? 0}/${t.slots_max[i.level - 1]} espacios` : ''}`,
        cost: { action: 'Acci\xF3n', bonus: 'Adicional', reaction: 'Reacci\xF3n' }[i.cost] || '',
        note: i.at_will
          ? 'a voluntad'
          : i.free
            ? 'gratis 1/d\xEDa'
            : i.concentration
              ? 'concentraci\xF3n'
              : '',
        desc: !i.usable && i.reason ? i.reason : i.desc,
        enabled: i.usable,
        magic: !0,
        data: i,
      }));
      this.hud.sheet('Conjuros', s, (i) => this.chooseSpell(t, i.data));
    } else if (e === 'features') {
      if (!(a.features || []).length) return;
      this.hud.sheet(
        'Habilidades',
        (a.features || []).map((n) => ({ ...n, cost: n.cost })),
        (n) => this.useFeature(t, n),
      );
    } else if (e === 'actions') this.hud.sheet('Acciones', a.actions || [], (n) => this.basicAction(t, n));
    else if (e === 'items') {
      if (!(a.items || []).length) return;
      this.hud.sheet('Objetos', a.items || [], (n) =>
        this.startSimple(
          t,
          n.target,
          `${n.title.replace(/ ×\d+$/, '')}: elige a qui\xE9n (t\xFA o un aliado adyacente)`,
        ),
      );
    }
  }
  async runAction(e, t) {
    ((this.mode = 'busy'), this.clearTargeting());
    let a = this.rules(t.op, t);
    (a.ok === !1 && this.hud.banner('No se puede ahora', 'apagado', 800),
      await this.play(a.events || []),
      this.afterAction(e));
  }
  basicAction(e, t) {
    t.target === 'none'
      ? this.runAction(e, { op: 'simple', what: t.id })
      : this.startSimple(
          e,
          t.target,
          {
            help: 'Elige un enemigo adyacente al que distraer',
            shove: 'Elige un enemigo adyacente para derribarlo',
            stabilize: 'Elige un aliado ca\xEDdo adyacente',
          }[t.target] || 'Elige objetivo',
        );
  }
  useFeature(e, t) {
    let a = t.target || 'none';
    a === 'none'
      ? this.runAction(e, { op: 'feature', id: t.id })
      : a === 'choice'
        ? this.hud.sheet(
            t.title,
            (t.options || []).map((n) => ({
              id: n.id,
              icon: n.icon || t.icon,
              title: n.title,
              cost: '',
              desc: n.desc || '',
              enabled: n.enabled !== !1,
            })),
            (n) => this.runAction(e, { op: 'feature', id: t.id, choice: n.id }),
          )
        : ['enemy', 'enemy_adjacent', 'ally_other', 'ally_touch', 'creature'].includes(a)
          ? this.startSimple(e, `feat:${t.id}`, `${t.title}: elige objetivo`)
          : a === 'point' || a === 'direction' || a === 'cell'
            ? this.startFeatureArea(e, t)
            : this.hud.banner('Esta habilidad a\xFAn no se puede usar aqu\xED', 'apagado', 1200);
  }
  startFeatureArea(e, t) {
    let a = t.range ?? (t.target === 'cell' ? 6 : 12);
    this.mode = 'target';
    let n = t.radius ?? (t.zone !== void 0 ? 5 : 10);
    ((this.pending = {
      kind: 'feature',
      id: t.id,
      name: t.title,
      target: t.target,
      range: a,
      radius: Math.max(1, Math.round(n / 5)),
      shape: t.shape || (t.id === 'breath_line' ? 'line' : 'cone'),
      zone: t.zone,
    }),
      this.board.clear());
    let s = [];
    for (let i = 0; i < this.board.h; i++)
      for (let r = 0; r < this.board.w; r++) hexDistance([r, i], e.cell) <= a && s.push([r, i]);
    ((this.pending.cells =
      t.target === 'cell'
        ? s.filter(
            (i) =>
              this.board.tile(...i) !== '#' &&
              !this.state.creatures.some((r) => !r.dead && r.cell[0] === i[0] && r.cell[1] === i[1]),
          )
        : s),
      t.target !== 'direction' && this.board.set('range', this.pending.cells, 11832575),
      this.hud.prompt(
        t.target === 'direction'
          ? `${t.title}: elige hacia d\xF3nde`
          : t.target === 'cell'
            ? `${t.title}: elige una casilla`
            : `${t.title}: elige d\xF3nde`,
        !0,
      ));
  }
  featureCells(e, t) {
    let a = this.pending;
    if (a.target === 'point') {
      if (!t.cell || hexDistance(t.cell, e.cell) > a.range) return null;
      let n = [];
      for (let s = 0; s < this.board.h; s++)
        for (let i = 0; i < this.board.w; i++) hexDistance([i, s], t.cell) <= a.radius && n.push([i, s]);
      return n;
    }
    if (a.target === 'direction' && t.gp) {
      let n = this.cellToWorld(e.cell),
        s = t.gp.clone().sub(n).setY(0);
      if (s.lengthSq() < 0.01) return null;
      s.normalize();
      let i = a.shape === 'line' ? 6 : 3,
        r = [];
      for (let l = 0; l < this.board.h; l++)
        for (let c = 0; c < this.board.w; c++) {
          let d = this.cellToWorld([c, l]).sub(n),
            u = d.x * s.x + d.z * s.z,
            h = Math.abs(d.x * s.z - d.z * s.x);
          u <= 0.3 ||
            u > i * HEX_SIZE + 0.2 ||
            (a.shape === 'line' ? h > 0.75 : h > u * 0.55 + 0.35) ||
            r.push([c, l]);
        }
      return r;
    }
    return a.target === 'cell' && t.cell && a.cells.some((n) => n[0] === t.cell[0] && n[1] === t.cell[1])
      ? [t.cell]
      : null;
  }
  previewFeatureArea(e, t) {
    let a = this.creature(this.state.current),
      n = this.featureCells(a, e);
    if (!n) return (this.board.clear('area'), null);
    let s = [],
      i = [];
    for (let l of n) {
      let c = this.state.creatures.find((d) => !d.dead && d.cell[0] === l[0] && d.cell[1] === l[1]);
      c && (c.team === a.team ? s : i).push(c);
    }
    let r = new Set(s.map((l) => cellKey(...l.cell)));
    if (
      (this.board.set('area', n, (l) =>
        r.has(cellKey(...l)) && this.pending.id.startsWith('breath') ? 16728112 : 11566335,
      ),
      !t)
    ) {
      let l = this.pending;
      ((l.area = n), (l.at = e));
      let c = [{ t: 'b', s: l.name }];
      (l.target !== 'cell' && c.push({ t: '', s: `Enemigos en el \xE1rea: ${i.length}` }),
        s.length &&
          l.id.startsWith('breath') &&
          c.push({ t: 'bad', s: `\xA1Cuidado! Alcanza a ${s.length} aliado(s).` }),
        this.hud.preview(this.cellToWorld(n[Math.floor(n.length / 2)]), c, 'Usar', () =>
          this.confirmFeatureArea(),
        ));
    }
    return n;
  }
  tapFeature(e, t) {
    let a = this.pending;
    if (
      a.area &&
      t.cell &&
      a.area.some((n) => n[0] === t.cell[0] && n[1] === t.cell[1]) &&
      a.target !== 'direction'
    ) {
      this.confirmFeatureArea();
      return;
    }
    if (
      a.target === 'direction' &&
      a.area &&
      t.cell &&
      a.area.some((n) => n[0] === t.cell[0] && n[1] === t.cell[1])
    ) {
      this.confirmFeatureArea();
      return;
    }
    ((a.locked = !1),
      this.previewFeatureArea(t, !1) ? (a.locked = !0) : this.hud.banner('Fuera de alcance', 'apagado', 700));
  }
  confirmFeatureArea() {
    let e = this.creature(this.state.current),
      t = this.pending;
    if (!t || !t.at) return;
    let a = { op: 'feature', id: t.id };
    if ((t.zone !== void 0 && t.zone !== null && (a.zone = t.zone), t.target === 'point')) {
      let n = t.at.cell,
        s = this.cellToWorld(n);
      a.point = [s.x / HEX_SIZE, s.z / HEX_SIZE];
    } else if (t.target === 'direction') {
      let n = worldToPlane(t.at.gp);
      ((a.dir = [n.x, n.y]), (a.point = a.dir));
    } else t.target === 'cell' && (a.cell = t.at.cell);
    this.runAction(e, a);
  }
  startSimple(e, t, a) {
    let n = this.rules('simple_targets', { what: t });
    if (!n.length) {
      (this.hud.banner('No hay objetivos v\xE1lidos', 'apagado', 900), this.enterIdle(e));
      return;
    }
    ((this.mode = 'target'),
      (this.pending = { kind: 'simple', what: t, valid: n }),
      this.board.clear(),
      this.board.set(
        'target',
        n.map((s) => this.creature(s).cell),
        (s) => {
          let i = this.state.creatures.find((r) => r.cell[0] === s[0] && r.cell[1] === s[1] && !r.dead);
          return i && i.team === e.team ? 7331978 : 16734784;
        },
      ),
      this.hud.prompt(a, !0));
  }
  tapTarget(e, t) {
    let a = this.pending;
    if (!a) return;
    let n = t.creature;
    switch (a.kind) {
      case 'move':
        t.cell && t.cell[0] === a.cell[0] && t.cell[1] === a.cell[1]
          ? this.doMove(e, a.path, a.dash)
          : (this.enterIdle(e), this.tapIdle(e, t, {}));
        break;
      case 'attack':
        n && n.id === a.plan.target
          ? this.executeAttack()
          : n && n.team !== e.team && n.hp > 0
            ? this.proposeAttack(e, n, a.plan.key)
            : this.enterIdle(e);
        break;
      case 'attack_pick':
        n && n.team !== e.team && n.hp > 0 && this.proposeAttack(e, n, a.key);
        break;
      case 'offhand':
        n && n.id === a.off.target ? this.hud.confirmPreview() : this.afterAction(e);
        break;
      case 'spell':
        this.tapSpell(e, t);
        break;
      case 'feature':
        this.tapFeature(e, t);
        break;
      case 'simple':
        n && a.valid.includes(n.id) && this.runAction(e, { op: 'simple', what: a.what, target: n.id });
        break;
      default:
        break;
    }
  }
  async undoMove() {
    let e = this.creature(this.state.current);
    if (!e || this.mode === 'busy' || !this.opts?.can_undo) return;
    ((this.mode = 'busy'), this.clearTargeting());
    let t = this.rules('undo_move'),
      a = this.unit(e.id);
    (await this.play(t.events), this.refresh());
    let n = this.creature(e.id);
    (n &&
      (n.cell[0] !== a.cell[0] ||
        n.cell[1] !== a.cell[1] ||
        a.root.position.distanceTo(this.cellToWorld(n.cell)) > 0.1) &&
      a.place(n.cell),
      this.afterAction(e));
  }
  markMerges(e) {
    let t = e || [];
    for (let a = 0; a < t.length; a++) {
      let n = t[a];
      if (n.t === 'save' && !n.success && n.who)
        for (let s = a + 1; s < Math.min(t.length, a + 8); s++) {
          let i = t[s];
          if (i.who === n.who) {
            if ((i.t === 'condition' || i.t === 'effect') && i.on) {
              ((n._merged = !0), (i._saveNote = `salvaci\xF3n ${n.total} vs CD ${n.dc}`));
              break;
            }
            if (i.t === 'damage' || i.t === 'save') break;
          }
        }
      if (n.t === 'effect' && n.on && n.who)
        for (let s = a + 1; s < Math.min(t.length, a + 4); s++) {
          let i = t[s];
          if (i.who === n.who && i.t === 'condition' && i.on) {
            ((n._quiet = !0), (i._saveNote = i._saveNote || n._saveNote || ''), (i._from = n.name));
            break;
          }
        }
    }
  }
  async play(e) {
    this.markMerges(e);
    for (let t of e || []) {
      if (this.disposed) return;
      (this.allEvents.push(t), t.t !== 'log' && this.emit('battle:event', { ev: t }));
      try {
        await this.playOne(t);
      } catch (a) {
        console.error('[combate] evento', t.t, a);
      }
    }
  }
  markImpact(e) {
    this.recentImpact.set(e, performance.now());
  }
  impactedRecently(e) {
    let t = this.recentImpact.get(e);
    return t && performance.now() - t < 900 / this.turbo;
  }
  async playOne(e) {
    let t = this.hud,
      a = this.vfx,
      n = e.who ? this.unit(e.who) : null;
    switch (e.t) {
      case 'log':
        t.log(e.text);
        break;
      case 'round':
        (t.round(e.n), e.n > 1 && t.banner(`Ronda ${e.n}`, 'oro', 700));
        break;
      case 'turn':
        this.setActive(e.who);
        break;
      case 'initiative':
        (t.setInitiative(e.who, e.roll),
          n && !this.shotMode && t.float(n.headWorld(), `Iniciativa ${e.roll}`, 'tirada', 0.9));
        break;
      case 'move': {
        if (!n) break;
        let s = (e.path || []).filter((i, r) => r > 0 || i[0] !== n.cell[0] || i[1] !== n.cell[1]);
        (n.team === 1 && this.focusUnit(n),
          this.emit('battle:fx', { kind: 'step', who: e.who, run: !!e.dash, at: n.root.position.toArray() }),
          await n.walk(s, { run: !!e.dash }));
        break;
      }
      case 'dash':
        n && t.float(n.headWorld(), '\xA1Corre!', 'apagado');
        break;
      case 'disengage':
        n &&
          (t.float(n.headWorld(), 'Se destraba', 'apagado'),
          a.feature('step_of_wind', { caster: this.who(n) }));
        break;
      case 'stand':
        n && (n.idle(0.3), t.float(n.headWorld(), 'Se levanta', 'apagado'));
        break;
      case 'attack':
        await this.playAttack(e);
        break;
      case 'damage':
        await this.playDamage(e, n);
        break;
      case 'heal':
        n &&
          e.amount > 0 &&
          (a.heal(n.root.getWorldPosition(new Vector3()), e.amount),
          t.float(n.chest(), `+${e.amount}`, 'cura', 1.15),
          t.setHp(e.who, e.hp, e.max),
          await this.wait(300));
        break;
      case 'temp_hp':
        n &&
          (t.float(n.chest(), `+${e.amount ?? ''} temporales`, 'bueno', 0.9),
          a.burst(n.chest(), {
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
        (n &&
          (e._merged ||
            t.float(
              n.headWorld(),
              `Salvaci\xF3n ${e.success ? 'superada' : 'fallada'}`,
              e.success ? 'apagado' : 'malo',
              0.85,
              `${e.total} vs CD ${e.dc}`,
            ),
          a.ring(n.root.position, {
            color: e.success ? 9429152 : 16736320,
            radius: 0.7,
            life: 0.4,
            thick: 0.25,
          })),
          await this.wait(220));
        break;
      case 'condition':
        n &&
          ((e.cond !== 'unconscious' || !n.down) &&
            t.float(
              n.headWorld(),
              `${e.on ? '' : 'Ya no: '}${Bm(e.cond)}`,
              e.on ? 'malo' : 'apagado',
              0.9,
              [e._from, e._saveNote].filter(Boolean).join(' \xB7 '),
            ),
          e.cond === 'prone' &&
            (n.prone(e.on),
            e.on &&
              a.burst(n.root.position.clone().setY(n.root.position.y + 0.2), {
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
          e.cond === 'unconscious' && e.on && !n.down && n.fall(),
          this.syncAuras());
        break;
      case 'effect':
        (n &&
          e.name &&
          !e._quiet &&
          !(
            e.on &&
            e.positive &&
            this.lastCast &&
            this.lastCast.name === e.name &&
            performance.now() - this.lastCast.t < 4e3
          ) &&
          t.float(
            n.headWorld(),
            `${e.on ? '' : 'Fin: '}${e.name}`,
            e.positive ? 'bueno' : 'malo',
            0.85,
            e._saveNote || '',
          ),
          this.refresh());
        break;
      case 'downed':
        n &&
          (n.fall(),
          n.team === 0 && a.death(n.root.position.clone(), { pc: !0 }),
          t.float(n.headWorld(), '\xA1Cae!', 'malo', 1.2),
          this.refresh(),
          await this.wait(500));
        break;
      case 'death':
        if (n) {
          let s = this.creature(e.who);
          (a.death(n.root.position.clone(), {
            undead: s3.test(s?.template || '') || s?.ctype === 'undead',
            pc: n.team === 0,
          }),
            n.die(),
            this.vfx.auras.clear(e.who),
            n.team === 0 ? t.float(n.headWorld(), 'Muere', 'malo', 1.3) : this.standalone && n.sink(2.6),
            this.refresh(),
            await this.wait(450));
        }
        break;
      case 'death_save':
        (n &&
          e.roll > 0 &&
          (t.float(
            n.headWorld(),
            `Salvaci\xF3n de muerte: ${e.roll}`,
            e.roll >= 10 ? 'bueno' : 'malo',
            0.9,
            `${e.successes}\u2713 ${e.failures}\u2717`,
          ),
          await this.wait(500)),
          this.refresh());
        break;
      case 'stable':
        n && t.float(n.headWorld(), 'Estable', 'bueno');
        break;
      case 'revive':
        n &&
          (n.revive(),
          a.heal(n.root.position.clone(), 6),
          t.float(n.headWorld(), '\xA1Vuelve en s\xED!', 'bueno', 1.1),
          this.refresh());
        break;
      case 'push':
        n &&
          e.to &&
          (a.burst(n.root.position.clone().setY(n.root.position.y + 0.2), {
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
          await n.walk([e.to], { run: !0 }));
        break;
      case 'teleport':
        if (n && e.to) {
          let s = n.root.position.clone(),
            i = this.cellToWorld(e.to);
          (a.spell('misty_step', { phase: 'teleport', caster: this.who(n), cell: e.to }),
            await this.wait(180),
            n.place(e.to),
            a.burst(i.clone().setY(i.y + 0.8), {
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
        let s = this.unit(e.a),
          i = this.unit(e.b);
        (s && e.a_cell && s.walk([e.a_cell], { run: !0 }),
          i && e.b_cell && (await i.walk([e.b_cell], { run: !0 })));
        break;
      }
      case 'cast':
        await this.playCast(e);
        break;
      case 'missile': {
        let s = this.unit(e.who),
          i = this.unit(e.target);
        s &&
          i &&
          (await a.spell('magic_missile', { phase: 'dart', caster: this.who(s), targets: [this.who(i)] }),
          this.markImpact(e.target));
        break;
      }
      case 'reaction':
        await this.playReaction(e, n);
        break;
      case 'sneak':
        if (n) {
          let s = this.unit(e.target);
          (t.float((s || n).headWorld(), `Ataque furtivo +${e.amount}`, 'oro', 1),
            s && a.slash(s.chest(), { color: 10119935, size: 1.3, life: 0.3, glow: 2.4 }));
        }
        break;
      case 'feature':
        if (n) {
          (t.float(
            n.headWorld(),
            e.name ||
              gH[e.feature] ||
              (this.opts?.features || []).find((l) => l.id === e.feature)?.title ||
              'Habilidad',
            ['rage', 'reckless', 'frenzy'].includes(e.feature) ? 'malo' : 'oro',
            1,
          ),
            ['rage', 'reckless'].includes(e.feature)
              ? n.once('taunt', { speed: 1.1 })
              : [
                  'frenzy',
                  'fires_burn',
                  'frosts_chill',
                  'hills_tumble',
                  'flurry',
                  'uncanny_metabolism',
                  'relentless_endurance',
                ].includes(e.feature) || n.once('cast_buff', { speed: 1.2 }));
          let s = ['fires_burn', 'frosts_chill', 'hills_tumble', 'frenzy'].includes(e.feature),
            i = e.target || (s && this.lastTarget?.id) || null,
            r = i ? this.who(i) : null;
          await a.feature(e.feature, { caster: this.who(n), targets: r ? [r] : [] });
        }
        break;
      case 'item':
        n &&
          (t.float(n.headWorld(), e.item && e.item.includes('potion') ? 'Poci\xF3n' : 'Objeto', 'cura'),
          n.once('use', { speed: 1.2 }),
          a.burst(Um(n), {
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
        n &&
          (t.float(n.headWorld(), e.success === !1 ? 'No logra esconderse' : 'Se esconde', 'apagado'),
          e.success !== !1 && n.anim('crouch_walk', 0.3),
          a.burst(n.root.position.clone().setY(n.root.position.y + 0.5), {
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
        n && (t.float(n.headWorld(), '\xA1Descubierto!', 'apagado'), n.idle(0.3), this.refresh());
        break;
      case 'shove': {
        let s = this.unit(e.target);
        n &&
          s &&
          (n.faceUnit(s),
          n.attack('unarmed'),
          await this.wait(260),
          e.success ? (s.hurt(), a.hit('bludgeoning', s.chest(), { small: !0 })) : a.miss(s.chest()),
          t.float(n.headWorld(), e.success === !1 ? 'Empuj\xF3n fallido' : 'Empuj\xF3n', 'apagado'));
        break;
      }
      case 'blocked':
        if (n) {
          t.float(n.headWorld(), 'No se atreve\u2026', 'apagado');
          let s = this.unit(e.target);
          s && a.dome(s.root.position, { color: 16052479, radius: 1, life: 0.6, alpha: 0.6 });
        }
        break;
      case 'immune':
        n && t.float(n.headWorld(), 'Inmune', 'apagado');
        break;
      case 'concentration':
        (n && !e.on && t.float(n.headWorld(), 'Pierde la concentraci\xF3n', 'malo', 0.85), this.refresh());
        break;
      case 'zone':
        e.on
          ? (this.zoneKinds.set(e.id, e.kind),
            a.zone(e.id, e.kind, e.cells || [], e.color),
            e.moved || (await this.wait(200)))
          : (a.zoneOff(e.id), this.zoneKinds.delete(e.id));
        break;
      case 'zone_hit':
        if (n) {
          let s = e.token
            ? 'fire'
            : { moonbeam: 'radiant', spike: 'piercing', web: 'force' }[this.zoneKinds.get(e.id)] || 'force';
          (s === 'piercing'
            ? a.hit('piercing', n.chest(), { small: !0 })
            : a.element(s, n.chest(), { k: 0.7 }),
            e.token && (await a.tokenStrike(e.token, n.chest())),
            this.markImpact(e.who));
        }
        break;
      case 'burst':
        await a.spell('', {
          phase: 'burst',
          cells: e.cells || [],
          fx: e.fx || 'arcane',
          caster: n ? this.who(n) : null,
        });
        break;
      case 'summon': {
        let s = this.cellToWorld(e.cell);
        (a.token(e.id, e.kind, s), await this.wait(250));
        break;
      }
      case 'summon_move':
        await a.tokenMove(e.id, this.cellToWorld(e.to));
        break;
      case 'unsummon':
        a.tokenOff(e.id);
        break;
      case 'shape':
        n && (await this.wildShape(n, e.form));
        break;
      case 'resize':
        n &&
          (a.burst(n.chest(), {
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
        n &&
          t.float(
            n.headWorld(),
            e.success ? '\xA1Libre!' : 'Sigue apresado',
            e.success ? 'bueno' : 'apagado',
            0.9,
          );
        break;
      case 'mirror':
        n &&
          (a.auras.popGhost(e.who),
          t.float(n.headWorld(), '\xA1Era una imagen!', 'magia', 0.9),
          a.burst(n.chest(), {
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
        n &&
          (t.float(
            n.headWorld(),
            e.kind === 'bardic' ? `\xA1Inspirado! +${e.amount}` : 'Inspiraci\xF3n heroica',
            'oro',
            0.9,
          ),
          a.burst(n.chest(), {
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
        let s = this.unit(e.target);
        n &&
          s &&
          (n.faceUnit(s),
          n.attack('melee'),
          await this.wait(250),
          a.beam(s.chest(), n.chest(), { col: 6961824, width: 0.1, life: 0.6, glow: 2 }),
          t.float(n.headWorld(), e.name || 'Drenar vida', 'malo', 0.9),
          await this.wait(300));
        break;
      }
      case 'buff':
        n && (await a.feature('innate_sorcery', { caster: this.who(n) }));
        break;
      case 'max_hp':
        this.refresh();
        break;
      case 'recharge':
        n &&
          e.ok &&
          (t.float(n.headWorld(), `\xA1${e.name || 'Recargado'} listo!`, 'malo', 0.9),
          a.burst(n.headWorld(), {
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
  async playDamage(e, t) {
    if (!t) return;
    let a = this.hud,
      n = !!e.crit,
      s = e.type || '';
    if (e.amount > 0) {
      t.hurt();
      let r = this.impactedRecently(e.who),
        l = s === 'slashing' || s === 'piercing' || s === 'bludgeoning' || !s,
        c = this.creature(e.who),
        d = s3.test(c?.template || '') || c?.ctype === 'undead';
      (!r || l
        ? this.vfx.hit(s || 'bludgeoning', t.chest(), {
            crit: n,
            dir: this.lastAttackDir,
            small: r,
            blood: !d && c?.ctype !== 'construct',
          })
        : n && this.vfx.crit(t.chest()),
        t.team === 0 && this.vfx.flash(n ? 0.55 : 0.32));
    }
    let i =
      e.amount <= 0 ? 'apagado' : n ? 'critico' : t.team === 0 ? 'dano-pj' : n3[s] ? `dano ${n3[s]}` : 'dano';
    (a.float(
      t.chest(),
      e.amount > 0 ? `${e.amount}` : 'Sin da\xF1o',
      i,
      n ? 1.5 : 1.15,
      n ? '\xA1Cr\xEDtico!' : e.amount > 0 && o3[s] ? o3[s] : '',
    ),
      a.setHp(e.who, e.hp, e.max),
      n && (await this.hitStop([t, this.lastAttacker].filter(Boolean))),
      await this.wait(n ? 380 : 240));
  }
  async hitStop(e) {
    let t = e.map((a) => a.mixer).filter(Boolean);
    for (let a of t) a.timeScale = 0.05;
    await v1(110 / this.turbo);
    for (let a of t) a.timeScale = 1;
  }
  async playAttack(e) {
    let t = this.unit(e.who),
      a = this.unit(e.target);
    if (!t || !a) return;
    ((this.lastAttacker = t),
      (this.lastTarget = a),
      (this.lastAttackDir = a.root.position.clone().sub(t.root.position).setY(0).normalize()),
      e.token || t.faceUnit(a),
      (t.team === 1 || this.autoParty) && this.framePair(t, a));
    let n = this.hud,
      s = this.vfx;
    e.oa && n.float(t.headWorld(), 'Ataque de oportunidad', 'oro', 0.85);
    let i = `${e.natural}${e.rolls && e.rolls.length > 1 ? ` (${e.rolls.join('/')})` : ''} + ${e.bonus}${e.bless ? ` + ${e.bless}` : ''} = ${e.total} vs CA ${e.ac}`;
    if (
      (n.log(`<span class="tirada">${e.name}: ${i}</span>`),
      !this.fast &&
        !this.shotMode &&
        n.float(
          t.headWorld(),
          `${e.mode > 0 ? '\u25B2 ' : e.mode < 0 ? '\u25BC ' : ''}${e.natural} \u2192 ${e.total} vs ${e.ac}`,
          'tirada',
          0.8,
        ),
      e.token)
    ) {
      (await s.tokenStrike(e.token, a.chest()),
        e.hit
          ? (s.element('force', a.chest(), { k: e.crit ? 1.3 : 0.8 }), this.markImpact(e.target))
          : s.miss(a.chest()),
        e.crit && n.float(a.headWorld(), '\xA1Cr\xEDtico!', 'critico', 1.2),
        await this.wait(80));
      return;
    }
    if (e.spell) {
      let l = String(e.kind || '').startsWith('melee');
      (this.castReady && this.castReady.who === e.who && this.castReady.sid === e.sid && !this.castReady.used
        ? (this.castReady.used = !0)
        : (t.once(l ? 'attack_melee' : 'cast', { speed: 1.4 }),
          await this.wait(t.hitTime(l ? 'melee' : 'spell') * 520)),
        await s.spell(e.sid || '', {
          phase: 'attack',
          caster: this.who(t),
          targets: [this.who(a)],
          hit: !!e.hit,
          crit: !!e.crit,
          dtype: e.dtype,
          fx: e.fx,
        }),
        e.hit
          ? this.markImpact(e.target)
          : (n.float(a.headWorld(), e.natural === 1 ? 'Pifia' : 'Falla', 'apagado', 1),
            a.once('dodge', { speed: 1.6 })),
        await this.wait(e.hit ? 60 : 260));
      return;
    }
    let r =
      e.kind === 'melee' ? (e.unarmed ? 'unarmed' : 'melee') : e.kind === 'thrown' ? 'thrown' : 'ranged';
    if (
      (this.emit('battle:fx', {
        kind: r === 'melee' || r === 'unarmed' ? 'swing' : 'shoot',
        weapon: e.weapon,
        who: e.who,
        target: e.target,
        at: t.root.position.toArray(),
      }),
      t.attack(r),
      await this.wait(t.hitTime(r === 'unarmed' ? 'melee' : r) * 1e3),
      r === 'ranged' || r === 'thrown')
    ) {
      let l = String(e.weapon || ''),
        c = l.includes('crossbow')
          ? 'bolt'
          : l.includes('dagger')
            ? 'dagger'
            : l.includes('javelin') || l.includes('spear')
              ? 'javelin'
              : l.includes('sling')
                ? 'orb'
                : 'arrow';
      await s.projectile('physical', t.chest().add(new Vector3(0, 0.15, 0)), a.chest(), {
        kind: c === 'orb' ? 'orb' : c,
        speed: 26 / Math.min(this.speed, 1.6),
        miss: !e.hit,
        size: 0.3,
      });
    } else
      e.hit &&
        s.slash(a.chest().lerp(t.chest(), 0.25), {
          color: e.crit ? 16765056 : 16051420,
          size: 1,
          life: 0.22,
          glow: e.crit ? 3 : 1.6,
          alpha: 0.75,
        });
    (e.hit
      ? (e.crit && n.float(a.headWorld(), '\xA1Cr\xEDtico!', 'critico', 1.2),
        e.flurry &&
          s.burst(a.chest(), {
            n: 10,
            col: 12574975,
            speed: 3,
            life: 0.25,
            size: 0.06,
            stretch: 0.08,
            glow: 2,
          }))
      : (n.float(a.headWorld(), e.natural === 1 ? 'Pifia' : 'Falla', 'apagado', 1),
        (r === 'melee' || r === 'unarmed') && s.miss(a.chest()),
        a.once('dodge', { speed: 1.6 })),
      await this.wait(e.hit ? 60 : 320));
  }
  async playCast(e) {
    let t = this.unit(e.who);
    if (!t) return;
    let a = this.vfx,
      n = e.spell || '',
      s = efectosConjuros[n] || {},
      i = (e.targets || []).map((b) => this.who(b)).filter(Boolean),
      r = e.cells || [];
    (this.hud.float(t.headWorld(), e.name || s.n || 'Conjuro', 'magia', 1),
      (this.lastCast = { name: e.name || s.n, t: performance.now() }));
    let l = {
      caster: this.who(t),
      targets: i,
      cells: r,
      dtype: e.dtype,
      fx: e.fx,
      slot: e.slot,
      cell: e.cell,
    };
    if (
      (e.point && (l.center = this.planeToWorld(e.point)),
      e.dir && !e.point && (l.dir = this.planeToWorld(e.dir).sub(l.caster.pos).setY(0).normalize()),
      r.length &&
        !l.center &&
        (l.center = r
          .map((b) => this.cellToWorld(b))
          .reduce((b, f) => b.add(f), new Vector3())
          .divideScalar(r.length)),
      e.rider)
    ) {
      await a.spell(n, { ...l, phase: 'rider' });
      for (let b of i) this.markImpact(b.id);
      return;
    }
    let c = i.find((b) => b.id !== t.id);
    (c ? t.faceUnit(this.unit(c.id)) : l.center && t.face(l.center.x, l.center.z),
      (t.team === 1 || this.autoParty) &&
        (r.length ? this.frameArea(r) : c && this.framePair(t, this.unit(c.id))));
    let d =
        s.h ||
        ['buff', 'heal', 'wind', 'nature'].includes(s.fx) ||
        ['bardic_inspiration', 'lay_on_hands', 'preserve_life', 'turn_undead'].includes(n),
      u = !!s.a,
      h = e.fx || s.fx,
      p =
        n === 'breath_weapon'
          ? DAMAGE_STYLE[e.dtype] || 'fire'
          : h === 'fire_cone'
            ? 'fire'
            : h || (o1.has(n) ? 'buff' : 'arcane'),
      m = d ? 'buff' : s.a === 'melee' ? 'melee' : 'spell';
    t.attack(m);
    let _ = a.castStart(p, l.caster.pos, l.caster.hand, {
      big: (s.l || 0) >= 1,
      radius: (s.l || 0) >= 1 ? 0.9 : 0.7,
    });
    if (
      (await this.wait(t.hitTime(m) * 1e3),
      _.release(),
      (l.caster = this.who(t)),
      (this.castReady = u ? { who: e.who, sid: n, used: !1 } : null),
      o1.has(n)
        ? (n === 'breath_weapon' &&
            (l.shape = Math.max(0, ...r.map((b) => hexDistance(b, t.cell))) > 3 ? 'line' : 'cone'),
          await a.feature(n, l))
        : await a.spell(n, { ...l, phase: 'cast' }),
      !u)
    )
      for (let b of i) this.markImpact(b.id);
    if (r.length)
      for (let b of this.state.creatures)
        r.some((f) => f[0] === b.cell[0] && f[1] === b.cell[1]) && this.markImpact(b.id);
    await this.wait(100);
  }
  async playReaction(e, t) {
    if (!t) return;
    let a = this.hud,
      n = this.vfx;
    a.float(t.headWorld(), `\xA1${e.name}!`, 'magia', 1.1);
    let s = e.target ? this.unit(e.target) : null;
    (e.spell === 'shield'
      ? await n.spell('shield', { caster: this.who(t) })
      : e.spell === 'hellish_rebuke' && s
        ? (t.once('cast', { speed: 1.4 }),
          await n.spell('hellish_rebuke', { caster: this.who(t), targets: [this.who(s)] }),
          this.markImpact(s.id))
        : /Trueno/.test(e.name) && s
          ? (n.beam(t.chest(), s.chest(), {
              col: 12103935,
              width: 0.12,
              life: 0.35,
              mode: 'bolt',
              glow: 2.4,
            }),
            n.element('thunder', s.chest(), { k: 0.6 }),
            this.markImpact(s.id))
          : /Palabras/.test(e.name) && s
            ? await n.spell('vicious_mockery', { caster: this.who(t), targets: [this.who(s)] })
            : /Desviar/.test(e.name)
              ? (n.burst(t.chest(), {
                  n: 16,
                  col: 16773328,
                  speed: 4,
                  life: 0.25,
                  size: 0.05,
                  stretch: 0.1,
                  glow: 2.4,
                }),
                n.ring(t.chest(), {
                  color: 12574975,
                  radius: 0.8,
                  life: 0.3,
                  thick: 0.25,
                  vertical: this.S.camera.position.clone().sub(t.chest()),
                  y: 0,
                }))
              : /Aguante/.test(e.name)
                ? n.burst(t.chest(), {
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
                : n.burst(t.root.position.clone().setY(t.root.position.y + 0.9), {
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
  async wildShape(e, t) {
    let a = this.vfx;
    if (
      (a.burst(e.chest(), {
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
      a.burst(e.chest(), {
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
      t)
    ) {
      let i = e.headWorld();
      a.p({
        p: i.setY(i.y + 0.5),
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
    (this.emit('battle:fx', { kind: 'shape', who: e.id, form: t }), await this.wait(250));
    let n = this.meta.makeForm,
      s = this.forms.get(e.id);
    if (t) {
      let i = null;
      try {
        i = n ? await n(t, e.id) : null;
      } catch (l) {
        console.warn('[combate] forma salvaje: sin modelo de', t, l);
      }
      if ((i || (i = jm(t, e.id)), !i)) return;
      let r = s ? s.orig : { ch: e.ch, root: e.root, owns: e.owns };
      (s && this.scene.remove(s.beast.root),
        i.root.position.copy(e.root.position),
        (i.root.rotation.y = e.root.rotation.y),
        this.scene.add(i.root),
        (r.root.visible = !1),
        this.forms.set(e.id, { orig: r, beast: i }),
        e.setCharacter(i, !0));
    } else
      s &&
        (s.orig.root.position.copy(e.root.position),
        (s.orig.root.rotation.y = e.root.rotation.y),
        (s.orig.root.visible = !0),
        this.scene.remove(s.beast.root),
        e.setCharacter(s.orig.ch, s.orig.owns),
        this.forms.delete(e.id));
    this.refresh();
  }
  async finish() {
    if (this.finished) return;
    ((this.finished = !0),
      (this.mode = 'busy'),
      this.clearTargeting(),
      this.hud.turnBar(null),
      this.hud.thinking(''));
    let e = this.state.winner === 0;
    await v1(600 / this.turbo);
    let t = this.units.list.filter((n) => n.team === 0 && !n.dead);
    if ((t.length && this.focus(this.centroid(0), 18, !0), e))
      for (let n of t) n.down || n.once('cheer', { speed: 0.9 });
    (this.meta.emitStartEnd &&
      this.emit('battle:end', {
        group: this.meta.group ?? null,
        groups: this.meta.groups ?? null,
        won: e,
        fled: !1,
        level: this.meta.level ?? null,
        rounds: this.state.round,
      }),
      this.shotMode ||
        (await this.hud.big(
          e ? '\xA1Victoria!' : 'Derrota',
          e ? this.encounter.name || '' : 'El grupo ha ca\xEDdo',
          e ? '' : 'malo',
          2e3,
        )));
    let a = this.state.creatures.filter((n) => n.team === 0);
    (this.standalone &&
      this.hud.finish({ won: e, rounds: this.state.round, encounter: this.encounter, party: a }),
      this.resolveRun?.({ won: e, fled: !1, events: this.allEvents, rounds: this.state.round }));
  }
  setFast(e) {
    this.fast = e;
  }
  dispose() {
    this.disposed = !0;
    for (let e of this.off.splice(0)) e();
    if (this.turnDone) {
      let e = this.turnDone;
      ((this.turnDone = null), e());
    }
    for (let [e, t] of this.forms) {
      let a = this.unit(e);
      ((t.orig.root.visible = !0),
        a && t.orig.root.position.copy(a.root.position),
        this.scene.remove(t.beast.root),
        a && a.setCharacter(t.orig.ch, t.orig.owns));
    }
    (this.forms.clear(), (this.S.renderer.domElement.style.cursor = 'default'));
  }
};

export { Controller };
