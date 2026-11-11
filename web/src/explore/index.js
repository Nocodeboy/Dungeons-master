// explore/index.js — Exploración de un nivel (clase Explore): carga el nivel y el mundo (world/ o el de
// depuración), el grupo, PNJ, grupos de enemigos y objetos; mueve al grupo en formación por la rejilla
// hexagonal, gestiona la cámara, los toques y el puntero, el HUD, los disparadores, el sigilo y la
// detección, y pasa al combate en el mismo mundo. Expone `game.explore` (api()) para la historia y la
// interfaz. La crea scenes/explore.js; su espacio de nombres (createExplore, Explore, SPEED, neighbors) es
// el del bundle publicado. Para depurar: `scene.explore.moveTo([x, y])`.
// Reconstruido de publicado/juego.js (módulo __esm «F1»).

import {
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
} from 'three';
import { cellToPlane, cellKey, hexDistance, HEX_SIZE } from './hex.js';
import { ExploreMap } from './terrain.js';
import { ExploreRules } from './checks.js';
import { ensureCampaign } from './campaign.js';
import { loadLevel } from './levels.js';
import { loadAreaModules } from './areas.js';
import { buildFallbackWorld } from './fallback-world.js';
import { createActorFactory } from './actors.js';
import { ExploreInput } from './input.js';
import { Floaters } from './floaters.js';
import { ExploreMarks } from './marks.js';
import { createExploreHud, fallbackDialog } from './hud.js';
import {
  lootOf,
  revealObject,
  springTrap,
  useObject,
  talkToMember,
  talkToNpc,
  openRest,
  hoverInfo,
} from './interact.js';
import { perceive, search, toggleStealth, detect, checkTriggers } from './detection.js';
import { attackEnemy, startBattle, withdrawGroup } from './battle.js';
import { AmbientAnimals, Banter } from './animals.js';

/** Crea la escena de exploración: `params` admite level, spawn, cell, loaded y turbo. */
async function createExplore(game, params = {}) {
  let x = new Explore(game, params);
  return (await x.init(), x.scene());
}
/** Velocidad de marcha del grupo (m/s) según el modo. */
const SPEED = { run: 3.9, walk: 1.75, sneak: 1.3 };
/** Cada cuántos segundos se comprueba si los enemigos ven al grupo. */
const DETECT_INTERVAL = 0.2;
const degToRad = MathUtils.degToRad;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Estado y lógica de la exploración de un nivel. Los miembros son {id, actor, cell, path, moving,
 * delay}; los PNJ {def, actor, cell, path…}; los grupos {def, enemies, roll, hidden, alerted, ready}.
 */
const Explore = class {
  constructor(game, params) {
    ((this.game = game), (this.params = params));
    let cp = ensureCampaign(game);
    ((this.levelId = params.level || cp.location?.level || 'merrowick'),
      (this.spawn =
        params.spawn || (cp.location?.level === this.levelId && cp.location?.cell ? 'saved' : 'default')),
      (this.startCell = Array.isArray(params.cell) ? params.cell.slice() : null),
      params.loaded &&
        cp.location?.level === this.levelId &&
        cp.location?.cell &&
        ((this.startCell ??= cp.location.cell.slice()), (this.spawn = 'saved')),
      (this.three = new Scene()),
      (this.rules = new ExploreRules(game)),
      (this.xmap = new ExploreMap({ call: (op, args) => this.rules.call(op, args) })),
      (this.members = []),
      (this.dead = []),
      (this.leader = null),
      (this.selected = new Set()),
      (this.npcs = new Map()),
      (this.groups = new Map()),
      (this.objects = new Map()),
      (this.busyN = 0),
      (this.inBattle = !1),
      (this.stealth = !1),
      (this.run = !game.store.settings.walk),
      (this.detectT = 0),
      (this.occT = 0),
      (this.stepT = 0),
      (this.hoverT = 0),
      (this.mouse = null),
      (this.offs = []),
      (this.disposed = !1),
      (this.pp = null),
      (this.ray = new Raycaster()),
      (this.v = new Vector3()),
      (this.turbo = Math.max(1, Number(params.turbo || game.params?.get?.('turbo')) || 1)));
  }
  /** Estado persistente del nivel en la campaña (encontrados, abiertos, muertos, botín…), con sus listas. */
  get ls() {
    let st = this.game.store.levelState(this.levelId);
    if (!st.npcGone || !st.spawned) {
      for (let k of ['found', 'opened', 'dead', 'disarmed', 'unlocked', 'fired', 'gone', 'talked', 'npcGone'])
        st[k] ??= [];
      for (let k of ['loot', 'drops', 'states', 'npcCells', 'spawned']) st[k] ??= {};
    }
    return st;
  }
  /** Carga todo con la pantalla de carga: nivel, mundo, objetos, cámara, grupo, PNJ, enemigos y HUD. */
  async init() {
    let game = this.game,
      ui = game.ui,
      t0 = performance.now(),
      last = t0;
    this.timings = {};
    let mark = (key, text, frac) => {
      let now = performance.now();
      ((this.timings[key] = Math.round(now - last)), (last = now), text && ui.loading?.(text, frac));
    };
    (ui.loading?.('Preparando el camino', 0.02),
      (this.mods = await loadAreaModules()),
      (this.level = await loadLevel(this.levelId, this.mods.world)));
    let level = this.level;
    (mark('nivel', `Llegando a ${level.name || this.levelId}`, 0.05),
      this.ls,
      (this.factory = createActorFactory(game, this.mods.actors)));
    let partyActors = this.makePartyActors();
    if (((this.world = null), this.mods.world))
      try {
        this.world = await this.mods.world.buildLevel(this.three, level, {
          quality: game.quality,
          store: game.store,
          game,
          stage: game.stage,
        });
      } catch (err) {
        console.error(
          '[exploraci\xF3n] buildLevel de Escenarios ha fallado; uso el mundo de depuraci\xF3n',
          err,
        );
      }
    (this.world || (this.world = await buildFallbackWorld(this.three, level, { quality: game.quality })),
      (this.world.width ??= Math.max(...level.rows.map((row) => row.length))),
      (this.world.height ??= level.rows.length),
      mark('mundo', 'Reuniendo al grupo', 0.7),
      this.xmap.load(level.rows));
    for (let [id, state] of Object.entries(this.ls.states)) {
      let obj = (level.objects || []).find((o) => o.id === id);
      obj?.type === 'door' &&
        state === 'open' &&
        obj.cell &&
        !obj.target &&
        this.xmap.setTile(obj.cell, obj.open_tile || '.');
    }
    if (
      (this.loadObjects(),
      (this.camera = new ExploreInput(game.stage, {
        bounds: this.world.bounds,
        settings: game.store.settings,
        onTap: (x, y, mods) => this.onTap(x, y, mods),
        onLongPress: (x, y) => this.onLongPress(x, y),
        onHover: (x, y) => (this.mouse = x == null ? null : { x, y }),
      })),
      (this.overlay = new Floaters(game.stage.camera, ui.root)),
      (this.marks = new ExploreMarks(this.three, this.world)),
      this.spawnGroups(),
      await this.spawnParty(await partyActors),
      mark('grupo', 'Saludando a los vecinos', 0.85),
      await this.spawnNpcs(),
      mark('pnj', 'Casi listo', 0.95),
      (this.animals = new AmbientAnimals(this)),
      (this.banter = new Banter(this)),
      await this.makeHud(),
      this.refreshObjects(),
      this.updateExits(),
      this.lead())
    ) {
      let view = this.clearView(this.groupCenter(), { pitch: degToRad(54), prefer: this.startYaw() });
      (this.camera.place(this.groupCenter(), {
        dist: innerWidth < innerHeight ? 26 : 21,
        yaw: view.yaw,
        pitch: view.pitch,
      }),
        this.camera.follow(() => (this.lead()?.moving ? this.lead().actor.root.position : null)),
        this.world.fadeOccluders?.(
          game.stage.camera,
          this.members.map((m) => m.actor.root.position.clone()),
        ));
    }
    (this.bindKeys(),
      (game.explore = this.api()),
      this.offs.push(
        game.bus.on('scene:enter', ({ name }) => name === 'explore' && !this.entered && this.afterEnter()),
      ),
      this.offs.push(game.bus.on('cp:changed', () => (this.pp = null))),
      this.offs.push(game.bus.on('flag:set', () => this.flagsChanged())),
      this.offs.push(
        game.bus.on(
          'ui:close',
          ({ name } = {}) => !this.inBattle && !this.disposed && name !== 'dialogo' && this.rebuildParty(),
        ),
      ),
      this.offs.push(game.bus.on('cp:changed', () => this.updateHudSoon())),
      this.offs.push(game.bus.on('quality:changed', ({ level } = {}) => this.world.setQuality?.(level))),
      mark('hud', 'Encendiendo los faroles', 0.97));
    try {
      let renderer = game.stage.renderer;
      renderer.compileAsync &&
        (await Promise.race([renderer.compileAsync(this.three, game.stage.camera), sleep(5e3)]));
    } catch (err) {
      console.warn('[exploraci\xF3n] compileAsync', err);
    }
    (mark('sombreadores'),
      (this.timings.total = Math.round(performance.now() - t0)),
      ui.loading?.(null),
      (this.background = (async () => {
        if ((await sleep(50), this.disposed)) return;
        let t1 = performance.now();
        (await this.animals.spawn(level.animals || []),
          (this.timings.animales = Math.round(performance.now() - t1)),
          await this.loadPortraits(),
          (this.timings.retratos = Math.round(performance.now() - t1 - this.timings.animales)),
          await this.groupsReady,
          (this.timings.enemigos = Math.round(performance.now() - t1)),
          game.params?.has?.('depurar') &&
            console.info('[exploraci\xF3n] tiempos de carga (ms)', JSON.stringify(this.timings)));
      })()));
  }
  /** Al terminar el fundido de entrada: guarda la posición, emite «level:enter» y lanza los disparadores. */
  async afterEnter() {
    if (this.entered) return;
    this.entered = !0;
    let game = this.game,
      cp = game.store.cp;
    ((cp.location = {
      level: this.levelId,
      spawn: this.spawn === 'saved' ? cp.location?.spawn || 'default' : this.spawn,
      cell: this.lead()?.cell?.slice(),
      name: this.level.name,
    }),
      game.bus.emit('level:enter', { level: this.levelId, spawn: this.spawn }),
      await checkTriggers(this, !0),
      this.disposed || game.store.save('auto'));
  }
  /** Objeto escena para el SceneManager: {three, sun, update, afterRender, dispose, explore}. */
  scene() {
    return {
      three: this.three,
      sun: this.world.sun,
      update: (dt, time) => this.update(dt, time),
      afterRender: (dt) => {
        (this.overlay?.update(dt), this.inBattle && this.game.battle?.afterRender?.(dt));
      },
      dispose: () => this.dispose(),
      explore: this,
    };
  }
  /** Pieza musical del nivel (puede cambiar con banderas: `music_flags`). */
  levelMusic() {
    let music = this.level.music || 'aldea';
    for (let [flag, track] of Object.entries(this.level.music_flags || {}))
      this.flag(flag) && (music = track);
    return music;
  }
  /** Guiñada inicial de la cámara: desde fuera del mapa hacia el centro. */
  startYaw() {
    let pos = this.lead().actor.root.position,
      toCenter = new Vector3(
        ((this.world.width || 20) * HEX_SIZE) / 2,
        0,
        ((this.world.height || 20) * HEX_SIZE * 0.866) / 2,
      )
        .clone()
        .sub(pos);
    return Math.atan2(toCenter.x, toCenter.z) + Math.PI + 0.35;
  }
  groupCenter() {
    let c = new Vector3();
    for (let m of this.members) c.add(m.actor.root.position);
    return this.members.length ? c.divideScalar(this.members.length) : c;
  }
  /** Busca una orientación de cámara cuya vista del centro no tapen árboles, casas ni muros. */
  clearView(center, { pitch = degToRad(54), prefer = 0 } = {}) {
    let heights = {
        T: 6.5,
        B: 7.5,
        H: 7.5,
        O: 2.6,
        P: 4.5,
        S: 3.6,
        '#': (this.level.wall_height || 2) * HEX_SIZE + 0.5,
        r: 1.2,
        c: 1.2,
      },
      outside = this.level.ambient === 'crypt' ? 3 : 6,
      score = (yaw, pitch) => {
        let sin = Math.sin(yaw),
          cos = Math.cos(yaw),
          tan = Math.tan(pitch),
          blocked = 0;
        for (let dist = 0.6; dist <= 9; dist += 0.45) {
          let rayY = 1.4 + dist * tan;
          for (let [side, w] of [
            [0, 1],
            [0.9, 0.5],
            [-0.9, 0.5],
          ]) {
            let x = center.x + sin * dist + cos * side,
              z = center.z + cos * dist - sin * side,
              cell = this.world.worldToCell({ x, y: 0, z });
            (this.xmap.inBounds(cell) ? heights[this.xmap.tile(cell)] || 0 : outside) > rayY &&
              (blocked += w);
          }
        }
        let turn = Math.abs(yaw - prefer) % (2 * Math.PI);
        return (turn > Math.PI && (turn = 2 * Math.PI - turn), blocked + turn * 0.25);
      },
      best = { yaw: prefer, pitch, s: 1 / 0 };
    for (let p of [pitch, pitch + degToRad(6), pitch + degToRad(12)]) {
      for (let k = 0; k < 16; k++) {
        let yaw = (k * Math.PI) / 8,
          s = score(yaw, p) + (p - pitch) * 2;
        s < best.s && (best = { yaw, pitch: p, s });
      }
      if (best.s < 0.9) break;
    }
    return best;
  }
  /** Evalúa una condición de bandera (nombre, lista, «!nombre» o expresión de story.test); vacía = true. */
  flag(expr) {
    if (!expr) return !0;
    if (Array.isArray(expr)) return expr.every((f) => this.flag(f));
    if (/^[\w.-]+$/.test(expr)) return !!this.game.store.flag(expr);
    let test = this.game.story?.test;
    if (typeof test == 'function')
      try {
        return !!test.call(this.game.story, expr);
      } catch (err) {
        console.warn('[exploraci\xF3n] story.test', expr, err);
      }
    let m = /^!\s*([\w.-]+)$/.exec(expr);
    return m ? !this.game.store.flag(m[1]) : !!this.game.store.flag(expr);
  }
  member(id) {
    return this.members.find((m) => m.id === id) || null;
  }
  /** Miembro que va en cabeza (si falta, el primero). */
  lead() {
    let m = this.member(this.leader);
    return (!m && this.members.length && ((m = this.members[0]), (this.leader = m.id)), m);
  }
  /** Miembros seleccionados (se mueven con el líder). */
  movers() {
    return this.members.filter((m) => this.selected.has(m.id));
  }
  /** Empieza a crear los actores de los miembros vivos (promesa de {ids, made}). */
  makePartyActors() {
    let ids = this.game.store.cp.party.filter((id) => !this.rules.state(id).dead);
    return Promise.all(ids.map((id) => this.factory.member(id, this.rules.sheet(id)))).then((made) => ({
      ids,
      made,
    }));
  }
  /** Coloca al grupo en la entrada del nivel (`spawn`), en la posición guardada o en `startCell`. */
  async spawnParty(pre = null) {
    let cp = this.game.store.cp,
      level = this.level,
      cell = level.spawns?.[this.spawn] || level.spawns?.default || [2, 2];
    (this.spawn === 'saved' &&
      cp.location?.level === this.levelId &&
      cp.location?.cell &&
      (cell = cp.location.cell),
      this.startCell && (cell = this.startCell));
    let { ids, made } = pre || (await this.makePartyActors());
    this.dead = cp.party.filter((id) => this.rules.state(id).dead);
    let cells = this.xmap.freeNear(cell, ids.length, this.blocked()),
      pos = this.world.cellToWorld(cell),
      center = new Vector3(
        ((this.world.width || 20) * HEX_SIZE) / 2,
        0,
        ((this.world.height || 20) * HEX_SIZE * 0.866) / 2,
      ),
      yaw = Math.atan2(center.x - pos.x, center.z - pos.z);
    (ids.forEach((id, k) => {
      let actor = made[k],
        c = cells[Math.min(k, cells.length - 1)] || cell;
      (this.world.cellToWorld(c, actor.root.position),
        (actor.root.rotation.y = yaw),
        this.three.add(actor.root),
        actor.anim('idle'),
        this.members.push({ id, actor, cell: c.slice(), path: [], moving: !1, delay: 0 }));
    }),
      (this.leader = this.members.find((m) => m.id === 'hero')?.id || this.members[0]?.id || null),
      (this.selected = new Set(this.members.map((m) => m.id))),
      (this.portraits = new Map()),
      this.updateRings());
  }
  async loadPortraits() {
    if (typeof this.game.ui.portrait == 'function') return;
    let cp = this.game.store.cp;
    for (let id of cp?.party || []) {
      if (this.disposed) return;
      this.portraits.has(id) ||
        (this.portraits.set(
          id,
          await this.factory.portrait(this.member(id)?.actor, { ...this.rules.sheet(id), id }),
        ),
        this.updateHudSoon());
    }
  }
  /** Sincroniza los actores con la campaña: quita muertos y despedidos y añade reclutas. */
  async rebuildParty() {
    let cp = this.game.store.cp,
      alive = cp.party.filter((id) => !this.rules.state(id).dead);
    this.dead = cp.party.filter((id) => this.rules.state(id).dead);
    for (let m of [...this.members])
      alive.includes(m.id) ||
        (m.actor.dispose(),
        this.marks.removeRing(m.id),
        this.members.splice(this.members.indexOf(m), 1),
        this.selected.delete(m.id));
    let lead = this.lead();
    for (let id of alive) {
      if (this.member(id)) continue;
      let npc = this.npcs.get(id),
        cell = this.xmap.freeNear(lead?.cell || [2, 2], 1, this.blocked(!0))[0] || lead?.cell || [2, 2];
      npc && ((cell = npc.cell.slice()), this.removeNpcNow(id));
      let actor = await this.factory.member(id, this.rules.sheet(id));
      (this.world.cellToWorld(cell, actor.root.position),
        this.three.add(actor.root),
        actor.anim('idle'),
        this.members.push({ id, actor, cell: cell.slice(), path: [], moving: !1, delay: 0 }),
        this.selected.add(id),
        !this.portraits.has(id) &&
          typeof this.game.ui.portrait != 'function' &&
          this.portraits.set(id, await this.factory.portrait(actor, { ...this.rules.sheet(id), id })));
    }
    for (let m of this.members)
      (m.down && ((m.down = !1), m.actor.anim('idle', { fade: 0.4 })), m.actor.setShadowed(this.stealth));
    (this.members.sort((a, b) => cp.party.indexOf(a.id) - cp.party.indexOf(b.id)),
      this.member(this.leader) || (this.leader = this.members[0]?.id || null),
      (this.pp = null),
      this.updateRings(),
      this.updateHud());
  }
  updateRings() {
    for (let m of this.members)
      this.marks.ring(
        m.id,
        m.actor.root,
        this.inBattle
          ? null
          : m.id === this.leader
            ? 'leader'
            : this.selected.has(m.id)
              ? 'selected'
              : 'member',
      );
  }
  /** Pone a un miembro en cabeza; con `additive` lo añade o quita de la selección; con `focus` centra la cámara. */
  setLeader(id, { additive = !1, focus = !1 } = {}) {
    let m = this.member(id);
    if (m) {
      if (focus) {
        (this.camera.focus(m.actor.root.position), (this.camera.following = !0));
        return;
      }
      (additive
        ? this.selected.has(id) && this.selected.size > 1
          ? (this.selected.delete(id), this.leader === id && (this.leader = [...this.selected][0]))
          : this.selected.add(id)
        : (this.leader === id && (this.camera.focus(m.actor.root.position), (this.camera.following = !0)),
          (this.leader = id),
          this.selected.add(id)),
        this.game.bus.emit('ui:select', { id }),
        this.updateRings(),
        this.updateHud());
    }
  }
  selectAll() {
    ((this.selected = new Set(this.members.map((m) => m.id))), this.updateRings(), this.updateHud());
  }
  /** Casillas ocupadas (Set de «x,y»): PNJ, enemigos vivos, trampas visibles, puertas cerradas y obstáculos. */
  blocked(withParty = !1) {
    let out = new Set();
    for (let npc of this.npcs.values()) npc.cell && out.add(cellKey(npc.cell[0], npc.cell[1]));
    for (let group of this.groups.values())
      for (let en of group.enemies) en.dead || out.add(cellKey(en.cell[0], en.cell[1]));
    for (let [id, obj] of this.objects)
      (obj.type === 'trap' &&
        this.objectVisible(obj) &&
        !this.ls.disarmed.includes(id) &&
        out.add(cellKey(obj.cell[0], obj.cell[1])),
        obj.type === 'door' &&
          !obj.target &&
          obj.cell &&
          this.ls.states[id] !== 'open' &&
          this.flag(obj.requires_visible) &&
          out.add(cellKey(obj.cell[0], obj.cell[1])),
        obj.blocks && this.objectVisible(obj) && out.add(cellKey(obj.cell[0], obj.cell[1])));
    if (withParty) for (let m of this.members) out.add(cellKey(m.cell[0], m.cell[1]));
    return out;
  }
  /** Casillas de destino para `count` miembros: el final del camino y huecos libres cercanos. */
  formation(dest, path, blocked, count) {
    let out = [dest],
      used = new Set([cellKey(dest[0], dest[1])]);
    for (let k = path.length - 2; k >= 0 && out.length < count; k--) {
      let c = path[k],
        key = cellKey(c[0], c[1]);
      if (!(used.has(key) || blocked.has(key))) {
        if (hexDistance(c, dest) > 3) break;
        (out.push(c), used.add(key));
      }
    }
    if (out.length < count) {
      let back = path[Math.max(0, path.length - 3)] || dest,
        extra = this.xmap
          .freeNear(dest, count + 10, blocked)
          .sort(
            (a, b) =>
              hexDistance(a, dest) +
              0.6 * hexDistance(a, back) -
              (hexDistance(b, dest) + 0.6 * hexDistance(b, back)),
          );
      for (let c of extra) {
        if (out.length >= count) break;
        let key = cellKey(c[0], c[1]);
        used.has(key) || (out.push(c), used.add(key));
      }
    }
    return out;
  }
  /** Mueve al líder (o a `leaderId`) y a los seleccionados hacia `dest`; true al llegar el líder. */
  moveParty(dest, { leaderId = null, marker = !0, solo = !1 } = {}) {
    let lead = this.member(leaderId) || this.lead();
    if (!lead || this.inBattle) return Promise.resolve(!1);
    let blocked = this.blocked(),
      path = this.xmap.path(lead.cell, dest, blocked);
    if ((this.trace(`mover ${lead.id} ${lead.cell} -> ${dest}: ${path.length} casillas`), !path.length))
      return Promise.resolve(!1);
    let movers = solo ? [lead] : [lead, ...this.movers().filter((m) => m !== lead)],
      slots = this.formation(dest, path, blocked, movers.length);
    return (
      this.cancelArrive(),
      (lead.path = path.slice(1)),
      (lead.delay = 0),
      this.prepareWalk(lead),
      movers.slice(1).forEach((m, k) => {
        let slot = slots[Math.min(k + 1, slots.length - 1)],
          sub = this.xmap.path(m.cell, slot, blocked);
        ((m.path = sub.slice(1)), (m.delay = m.moving ? 0 : 0.1 + 0.12 * k), this.prepareWalk(m));
      }),
      marker && this.marks.destination(dest, !0),
      (this.camera.following = !0),
      this.overlay.clearBubbles(),
      new Promise((resolve) => {
        if (!lead.path.length && !lead.moving) {
          resolve(!0);
          return;
        }
        lead.onArrive = resolve;
      })
    );
  }
  cancelArrive() {
    for (let m of this.members)
      if (m.onArrive) {
        this.trace(`llegada cancelada (${m.id})`);
        let cb = m.onArrive;
        ((m.onArrive = null), cb(!1));
      }
  }
  /** Detiene a todos los miembros y guarda la posición. */
  stopAll() {
    for (let m of this.members)
      ((m.path = []),
        m.moving && ((m.moving = !1), m.actor.anim(this.stealth ? 'crouch' : 'idle', { fade: 0.25 })));
    (this.cancelArrive(), this.marks.clearDestination(), this.saveCell());
  }
  /** Guarda en la campaña la casilla del líder. */
  saveCell() {
    let cp = this.game.store.cp,
      lead = this.lead();
    cp &&
      lead &&
      (cp.location = {
        ...(cp.location || {}),
        level: this.levelId,
        cell: lead.cell.slice(),
        name: this.level.name,
      });
  }
  prepareWalk(m) {
    this.pullString(m);
  }
  /** Acorta el camino saltando casillas intermedias si se puede ir en línea recta. */
  pullString(m) {
    if (m.path.length < 2) return;
    let pos = m.actor.root.position,
      from = { x: pos.x / HEX_SIZE, y: pos.z / HEX_SIZE },
      blocked = this.blocked(),
      skip = 0;
    for (let k = 1; k < Math.min(m.path.length, 6); k++) {
      let c = m.path[k];
      if (this.xmap.straight(from, cellToPlane(c[0], c[1]), blocked)) skip = k;
      else break;
    }
    skip > 0 && m.path.splice(0, skip);
  }
  /** Avanza a los miembros por su camino (los rezagados aceleran) y emite «step». */
  moveMembers(dt) {
    let gait = this.stealth ? 'sneak' : this.run ? 'run' : 'walk',
      baseSpeed = SPEED[gait],
      lead = this.lead(),
      anyMoving = !1;
    for (let m of this.members) {
      if (!m.path.length) continue;
      if (m.delay > 0) {
        m.delay -= dt;
        continue;
      }
      anyMoving = !0;
      let pos = m.actor.root.position,
        target = this.world.cellToWorld(m.path[0], this.v),
        dx = target.x - pos.x,
        dz = target.z - pos.z,
        dist = Math.hypot(dx, dz),
        speed = baseSpeed;
      if (m !== lead && lead?.moving) {
        let gap = pos.distanceTo(lead.actor.root.position);
        speed *= 1 + MathUtils.clamp((gap - 3) / 5, 0, 0.45);
      }
      (!m.moving || m.actor.cur !== gait || Math.abs((m.lastSpeed || 0) - speed) > 0.15) &&
        ((m.moving = !0), (m.lastSpeed = speed), m.actor.anim(gait, { mps: speed }));
      let step = speed * dt;
      if (dist > 1e-4) {
        let turn = Math.atan2(dx, dz) - m.actor.root.rotation.y;
        ((turn = Math.atan2(Math.sin(turn), Math.cos(turn))),
          (m.actor.root.rotation.y += turn * Math.min(1, dt * 11)));
      }
      dist <= step
        ? ((pos.x = target.x), (pos.z = target.z), m.path.shift(), this.pullString(m))
        : ((pos.x += (dx / dist) * step), (pos.z += (dz / dist) * step));
      let groundY = this.world.heightAt ? this.world.heightAt(pos.x, pos.z) : target.y;
      pos.y += (groundY - pos.y) * Math.min(1, dt * 14);
      let cell = this.world.worldToCell(pos);
      if ((cell[0] !== m.cell[0] || cell[1] !== m.cell[1]) && ((m.cell = cell), this.onEnterCell(m, cell)))
        return;
      if (
        !m.path.length &&
        ((m.moving = !1), m.actor.anim(this.stealth ? 'crouch' : 'idle', { fade: 0.3 }), m.onArrive)
      ) {
        let cb = m.onArrive;
        ((m.onArrive = null), m === lead && this.saveCell(), cb(!0));
      }
    }
    if (anyMoving && ((this.stepT += dt), this.stepT > (this.stealth ? 0.55 : this.run ? 0.3 : 0.45))) {
      this.stepT = 0;
      let moving = this.members.filter((m) => m.moving);
      this._stepI = ((this._stepI || 0) + 1) % Math.max(1, moving.length);
      for (let m of new Set([lead, moving[this._stepI]]))
        m?.moving &&
          this.game.bus.emit('step', {
            who: m.id,
            at: m.actor.root.position.clone(),
            cell: m.cell,
            run: this.run && !this.stealth,
          });
    }
  }
  /** Al pisar una casilla: trampas, percepción pasiva y disparadores (si es el líder). */
  onEnterCell(m, cell) {
    if (this.inBattle) return !1;
    for (let [id, obj] of this.objects)
      if (
        !(obj.type !== 'trap' || !obj.cell || obj.cell[0] !== cell[0] || obj.cell[1] !== cell[1]) &&
        !(this.ls.disarmed.includes(id) || !this.flag(obj.requires))
      )
        return (springTrap(this, id, m.id), !0);
    return (perceive(this, m), !!(m.id === this.leader && (this.saveCell(), checkTriggers(this, !1, cell))));
  }
  async spawnNpcs() {
    let defs = [
      ...(this.level.objects || []).filter((o) => o.type === 'npc'),
      ...Object.values(this.ls.spawned || {}),
    ];
    await Promise.all(defs.map((def) => this.addNpc(def)));
  }
  /** ¿Debe estar el PNJ en el nivel según sus banderas y el estado del nivel? */
  npcAllowed(def) {
    return (
      this.flag(def.requires) &&
      !this.ls.npcGone.includes(def.id) &&
      !(def.hidden_until && !this.flag(def.hidden_until)) &&
      !(def.hide_if && this.game.store.flag(def.hide_if))
    );
  }
  /** Crea y coloca un PNJ (en su casilla guardada si se movió). */
  async addNpc(def) {
    if (this.npcs.has(def.id) || !this.npcAllowed(def)) return null;
    let actor = await this.factory.npc(def);
    if (this.disposed) return null;
    let cell = (this.ls.npcCells[def.id] || def.cell).slice();
    (this.world.cellToWorld(cell, actor.root.position),
      (actor.root.rotation.y = degToRad(def.face ?? 0)),
      actor.anim(def.anim || 'idle'),
      this.three.add(actor.root));
    let npc = {
      def,
      actor,
      cell,
      yaw: actor.root.rotation.y,
      home: actor.root.rotation.y,
      talkT: 0,
      path: [],
    };
    return (this.npcs.set(def.id, npc), npc);
  }
  /** Quita un PNJ (con `fade`, encogiéndolo). */
  removeNpcNow(id, { fade = !1 } = {}) {
    let npc = this.npcs.get(id);
    if (!npc) return;
    if ((this.npcs.delete(id), !fade)) {
      npc.actor.dispose();
      return;
    }
    let root = npc.actor.root,
      scale0 = root.scale.x,
      t0 = performance.now(),
      step = () => {
        let k = Math.min(1, (performance.now() - t0) / 500);
        (root.scale.setScalar(scale0 * Math.max(0.001, 1 - k)),
          k < 1 && !this.disposed ? requestAnimationFrame(step) : npc.actor.dispose());
      };
    step();
  }
  /** Movimiento de los PNJ por su camino y giro hacia quien les habla. */
  updateNpcs(dt) {
    for (let npc of this.npcs.values()) {
      npc.actor.update(dt);
      let root = npc.actor.root;
      if (npc.path.length) {
        let target = this.world.cellToWorld(npc.path[0], this.v),
          dx = target.x - root.position.x,
          dz = target.z - root.position.z,
          dist = Math.hypot(dx, dz),
          step = (npc.speed || 1.6) * dt;
        ((npc.yaw = Math.atan2(dx, dz)),
          dist <= step
            ? ((root.position.x = target.x),
              (root.position.z = target.z),
              (npc.cell = npc.path.shift()),
              npc.path.length ||
                (npc.actor.anim(npc.def.anim || 'idle'), npc.onArrive?.(), (npc.onArrive = null)))
            : ((root.position.x += (dx / dist) * step), (root.position.z += (dz / dist) * step)),
          this.world.heightAt && (root.position.y = this.world.heightAt(root.position.x, root.position.z)));
      } else
        npc.lookAt &&
          ((npc.yaw = Math.atan2(npc.lookAt.x - root.position.x, npc.lookAt.z - root.position.z)),
          (npc.talkT -= dt),
          npc.talkT <= 0 && ((npc.lookAt = null), (npc.yaw = npc.home)));
      let turn = npc.yaw - root.rotation.y;
      ((turn = Math.atan2(Math.sin(turn), Math.cos(turn))),
        Math.abs(turn) > 0.001 && (root.rotation.y += turn * Math.min(1, dt * 6)));
    }
  }
  /** Crea los grupos de enemigos del nivel que siguen vivos y sus actores (asíncrono: `group.ready`). */
  spawnGroups(defs = this.level.groups || []) {
    let readies = [];
    for (let def of defs) {
      let gid = def.id;
      if (
        this.groups.has(gid) ||
        this.ls.dead.includes(gid) ||
        this.ls.gone.includes(gid) ||
        !this.flag(def.requires) ||
        (def.flag && this.game.store.flag(def.flag))
      )
        continue;
      let seen = {},
        totals = {};
      for (let ed of def.enemies || []) totals[ed.id] = (totals[ed.id] || 0) + 1;
      let group = {
          def,
          enemies: [],
          roll: null,
          cooldown: 0,
          hidden: !!def.ambush,
          alerted: !1,
          ready: null,
        },
        loads = [];
      ((def.enemies || []).forEach((ed, k) => {
        seen[ed.id] = (seen[ed.id] || 0) + 1;
        let index = seen[ed.id],
          id = `${gid}_${ed.id}_${index}`,
          info = this.rules.monster(ed.id),
          name = totals[ed.id] > 1 ? `${info.name} ${index}` : info.name,
          en = {
            id,
            monster: ed.id,
            actor: null,
            cell: ed.cell.slice(),
            face: ed.face ?? 180,
            dead: !1,
            name,
            group: gid,
            index,
            order: k,
          };
        (group.enemies.push(en),
          loads.push(
            this.factory.monster(ed.id, id, index).then((actor) => {
              if (this.disposed || !this.groups.has(gid)) {
                actor.dispose();
                return;
              }
              (this.world.cellToWorld(en.cell, actor.root.position),
                (actor.root.rotation.y = degToRad(en.face)),
                actor.anim('idle'),
                (actor.root.visible = !group.hidden),
                this.three.add(actor.root),
                (en.actor = actor));
            }),
          ));
      }),
        (group.ready = Promise.all(loads).catch((err) =>
          console.error('[exploraci\xF3n] enemigos', gid, err),
        )),
        readies.push(group.ready),
        this.groups.set(gid, group));
    }
    return ((this.groupsReady = Promise.all([this.groupsReady, ...readies])), this.groupsReady);
  }
  enemy(id) {
    for (let group of this.groups.values()) for (let en of group.enemies) if (en.id === id) return en;
    return null;
  }
  /** Mejor percepción pasiva de los enemigos vivos del grupo. */
  groupPP(group) {
    let best = 0;
    for (let en of group.enemies) en.dead || (best = Math.max(best, this.rules.monster(en.monster).pp ?? 10));
    return best;
  }
  /** Objetos del nivel (sin los PNJ) más los restos de combate que aún tienen botín. */
  loadObjects() {
    this.objects.clear();
    for (let obj of this.level.objects || []) obj.type !== 'npc' && this.objects.set(obj.id, obj);
    for (let [id, obj] of Object.entries(this.ls.drops || {}))
      (this.ls.loot[id] || []).length && this.objects.set(id, obj);
  }
  /** ¿Se ve el objeto? (banderas, oculto sin encontrar, trampa desactivada, contenedor vacío…). */
  objectVisible(obj) {
    return !(
      (obj.type !== 'door' && !this.flag(obj.requires)) ||
      !this.flag(obj.hidden_until) ||
      (obj.hide_if && this.game.store.flag(obj.hide_if)) ||
      (obj.hidden && !this.ls.found.includes(obj.id)) ||
      (obj.type === 'trap' && this.ls.disarmed.includes(obj.id)) ||
      ((obj.type === 'cache' || obj.type === 'loot') &&
        this.ls.opened.includes(obj.id) &&
        !lootOf(this, obj).length) ||
      this.ls.states[obj.id] === 'hidden'
    );
  }
  refreshObjects() {
    for (let [id, obj] of this.objects) this.refreshObject(id, obj);
  }
  /** Aplica al mundo la visibilidad, el estado y el brillo de un objeto. */
  refreshObject(id, obj = this.objects.get(id)) {
    if (!obj) return;
    let visible = this.objectVisible(obj),
      node = this.world.objects?.get?.(id);
    (node && (node.visible = visible || (obj.type === 'door' && !!obj.target)),
      node && visible && obj.type === 'trap' && !node.visible && (node.visible = !0));
    let state = this.ls.states[id];
    if (
      (state && this.world.setObjectState
        ? this.world.setObjectState(id, state)
        : (obj.type === 'chest' || obj.type === 'cache' || obj.type === 'loot') &&
          this.ls.opened.includes(id) &&
          this.world.setObjectState?.(id, lootOf(this, obj).length ? 'open' : 'empty'),
      obj.type === 'trap' &&
        this.marks.trap(
          id,
          visible && this.ls.found.includes(id) && !this.ls.disarmed.includes(id) ? obj.cell : null,
        ),
      this.world.setObjectGlow)
    ) {
      let glow = visible && this.ls.found.includes(id) && !this.ls.opened.includes(id) && obj.type !== 'trap';
      this.world.setObjectGlow(id, glow ? 16762960 : null);
    }
  }
  /** Añade un objeto en tiempo de juego (p. ej. restos de combate), con un marcador propio si el mundo no lo pinta. */
  addObject(obj) {
    if ((this.objects.set(obj.id, obj), !this.world.objects?.get?.(obj.id) && this.world.addObject))
      try {
        this.world.addObject(obj);
      } catch (err) {
        console.warn('[exploraci\xF3n] addObject', err);
      }
    if (!this.world.objects?.get?.(obj.id)) {
      let g = new Group(),
        mesh = new Mesh(
          new SphereGeometry(0.3, 9, 7).scale(1, 0.7, 1).translate(0, 0.2, 0),
          new MeshStandardMaterial({ color: 9071162, roughness: 0.85 }),
        );
      ((mesh.castShadow = !0),
        g.add(mesh),
        this.world.cellToWorld(obj.cell, g.position),
        this.three.add(g),
        (this.ownAnchors ??= new Map()),
        this.ownAnchors.set(obj.id, g));
    }
    this.refreshObject(obj.id, obj);
  }
  anchorOf(id) {
    return this.world.objects?.get?.(id) || this.ownAnchors?.get(id) || null;
  }
  async flagsChanged() {
    if (!(this._flagsBusy || this.disposed)) {
      ((this._flagsBusy = !0), await sleep(0));
      try {
        await this.refreshWorld();
      } finally {
        this._flagsBusy = !1;
      }
    }
  }
  /** Tras cambiar banderas: objetos, PNJ, grupos, salidas y HUD. */
  async refreshWorld() {
    this.refreshObjects();
    for (let def of this.level.objects || [])
      def.type === 'npc' &&
        (this.npcAllowed(def) && !this.npcs.has(def.id)
          ? await this.addNpc(def)
          : !this.npcAllowed(def) && this.npcs.has(def.id) && this.removeNpcNow(def.id, { fade: !0 }));
    if (!this.inBattle) {
      for (let [gid, group] of [...this.groups])
        if (group.def.flag && this.game.store.flag(group.def.flag)) {
          this.groups.delete(gid);
          for (let en of group.enemies) en.actor?.dispose();
        }
    }
    (this.inBattle || this.spawnGroups(), this.updateExits(), this.updateHud());
  }
  updateExits() {
    let exits = (this.level.exits || []).map((ex) => ({ ...ex, usable: this.flag(ex.requires) && !!ex.to }));
    this.marks.setExits(exits);
  }
  /** Salida del nivel en esa casilla, o null. */
  exitAt(cell) {
    for (let ex of this.level.exits || [])
      for (let c of ex.cells || []) if (c[0] === cell[0] && c[1] === cell[1]) return ex;
    return null;
  }
  /** HUD de exploración: el de la interfaz (`ui.hud.explore`) o el propio de explore/hud.js. */
  async makeHud() {
    let game = this.game,
      opts = {
        ...this.hudState(),
        onMember: (id, o = {}) => !this.isBusy() && this.setLeader(id, o),
        onMemberHold: (id) => !this.isBusy() && this.openScreen('inventario', { who: id }),
        onAction: (action) => this.action(action),
        onMenu: () => this.action('menu'),
      };
    ((this.realUi = typeof game.ui.has == 'function'),
      (this.realDialog = this.realUi || !String(game.ui.dialog).includes('prompt(')));
    let hud = null;
    if (game.ui.hud?.explore)
      try {
        hud = await game.ui.hud.explore(opts);
      } catch (err) {
        console.warn('[exploraci\xF3n] ui.hud.explore:', err);
      }
    this.hud = hud || (await createExploreHud(game.ui.root, opts));
  }
  /** Estado que pinta el HUD: grupo (retratos, PG, líder, selección), oro, lugar, día, sigilo y marcha. */
  hudState() {
    let cp = this.game.store.cp;
    return {
      party: (cp?.party || []).map((id) => {
        let m = this.member(id),
          hp = this.rules.hp(id);
        return {
          id,
          name: this.rules.shortName(id),
          fullName: this.rules.name(id),
          portrait: this.portraits?.get(id) || null,
          hp: hp.hp,
          maxHp: hp.max,
          leader: id === this.leader,
          selected: this.selected.has(id),
          dead: !m && this.dead.includes(id),
          down: !!m?.down,
        };
      }),
      gold: cp?.gold ?? 0,
      place: this.level?.name || '',
      day: cp?.day || 1,
      stealth: this.stealth,
      run: this.run,
      level: this.levelId,
    };
  }
  updateHud() {
    this.hud?.update?.(this.hudState());
  }
  updateHudSoon() {
    this._hudT ||
      (this._hudT = setTimeout(() => {
        ((this._hudT = null), this.disposed || this.updateHud());
      }, 50));
  }
  toast(text, kind = 'info', ms) {
    this.hud?.toast?.(text, kind, ms);
  }
  /** Muestra una pista (si los ajustes no las desactivan). */
  hint(text) {
    if (!text || this.game.store.settings.tips === !1) return;
    let uiHud = this.game.ui.hud;
    uiHud && typeof uiHud.hint == 'function' && uiHud !== this.hud
      ? uiHud.hint(text)
      : this.hud?.hint?.(text);
  }
  /** Traza de depuración (solo con ?depurar), últimas 80 líneas en `_trace`. */
  trace(msg) {
    this.game.params?.has?.('depurar') &&
      ((this._trace ??= []).push(`${(performance.now() / 1e3).toFixed(1)} ${msg}`),
      this._trace.length > 80 && this._trace.shift());
  }
  /** ¿Hay un diálogo, una pantalla, un combate u otra acción en curso? */
  isBusy() {
    return this.busyN > 0 || this.inBattle || this.disposed;
  }
  /** Ejecuta `fn` marcando la exploración como ocupada. */
  async withBusy(fn) {
    (this.busyN++, this.busySignal());
    try {
      return await fn();
    } finally {
      ((this.busyN = Math.max(0, this.busyN - 1)), this.busySignal());
    }
  }
  busySignal() {
    let busy = this.busyN > 0 || this.inBattle;
    busy !== this._busyShown && ((this._busyShown = busy), this.hud?.update?.({ busy }));
  }
  /** Abre un diálogo (el de la interfaz o el de sustituto); resuelve con el índice elegido. */
  dialog(dlg) {
    return this.withBusy(() =>
      this.realDialog ? this.game.ui.dialog(dlg) : fallbackDialog(this.game.ui.root, dlg),
    );
  }
  /** Diálogo de opciones {text, value, tag, kind, disabled, hint}; devuelve el `value` elegido o null. */
  async choose({ speaker = '', title = '', text = '', portrait = null, options = [] }) {
    let idx = await this.dialog({
        speaker,
        title,
        text,
        portrait,
        options: options.map((o) => ({
          text: o.text,
          tag: o.tag || null,
          kind: o.kind || null,
          disabled: !!o.disabled,
          hint: o.hint || null,
        })),
      }),
      opt = options[idx];
    return opt && !opt.disabled ? (opt.value ?? idx) : null;
  }
  /** Narración (uno o varios párrafos) con un botón «Continuar». */
  async narrate(text, { title = this.level.name, sub = this.level.place } = {}) {
    let body = [].concat(text).map((line) => this.heroText(String(line))).join(`

`);
    await this.dialog({
      speaker: title,
      title: sub,
      text: body,
      options: [{ text: 'Continuar', kind: 'end' }],
    });
  }
  /** Sustituye {heroe}/{hero} por el nombre del héroe y quita las etiquetas [x]…[/x]. */
  heroText(text) {
    let hero = this.rules.sheet('hero');
    return text.replace(/\{heroe\}|\{hero\}/g, hero.name || 't\xFA').replace(/\[\/?[a-z]+(=[^\]]*)?\]/g, '');
  }
  hasScreen(name) {
    return typeof this.game.ui.has == 'function' ? !!this.game.ui.has(name) : !1;
  }
  /** Abre una pantalla de la interfaz y, al cerrarla, reconstruye el grupo. */
  async openScreen(name, params = {}) {
    this.stopAll();
    let res = await this.withBusy(() => this.game.ui.open(name, params));
    return (await this.rebuildParty(), res);
  }
  /** Añade una entrada al diario (una sola vez) y avisa. */
  addJournal(entry) {
    let cp = this.game.store.cp;
    !entry ||
      !cp ||
      ((cp.journal ??= []),
      !cp.journal.includes(entry) && (cp.journal.push(entry), this.toast('Diario actualizado.', 'botin')));
  }
  /**
   * Acciones del HUD y del teclado: inventory, stealth, search, run, rest, journal, select_all, map,
   * party y menu.
   */
  action(name) {
    if (!(this.isBusy() && name !== 'menu'))
      switch (name) {
        case 'inventory':
          this.openScreen('inventario', { who: this.leader });
          break;
        case 'stealth':
          toggleStealth(this);
          break;
        case 'search':
          search(this);
          break;
        case 'run':
          ((this.run = !this.run),
            this.game.store.saveSettings?.({ walk: !this.run }),
            this.toast(this.run ? 'El grupo corre.' : 'El grupo anda con calma.', 'apagado', 2e3),
            this.updateHud());
          break;
        case 'rest':
          openRest(this);
          break;
        case 'journal':
          this.openScreen('diario');
          break;
        case 'select_all':
          this.selectAll();
          break;
        case 'map':
          this.openScreen('viaje', { consult: !0 });
          break;
        case 'party':
          this.openScreen('grupo', { who: this.leader });
          break;
        case 'menu':
          this.isBusy() || this.openScreen('pausa', { context: 'explore' });
          break;
        default:
          break;
      }
  }
  /** Atajos de teclado (con el gestor de teclas de la interfaz si existe): acciones, Tab, F/espacio, 1–6. */
  bindKeys() {
    let ui = this.game.ui;
    if (((this.uiKeys = !!ui.keys?.set), this.uiKeys)) {
      let keymap = { c: 'stealth', b: 'search', r: 'rest', x: 'run', g: 'select_all' };
      for (let [key, action] of Object.entries(keymap)) ui.keys.set(key, () => this.action(action));
      (ui.keys.set('p', () => !this.isBusy() && ui.open('grupo', { who: this.leader })),
        ui.keys.set('s', null),
        ui.keys.set('q', null),
        (this._uiKeys = [...Object.keys(keymap), 'p', 's', 'q']));
    }
    ((this._key = (ev) => {
      if (
        (ev.target && /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) ||
        ev.repeat ||
        ev.defaultPrevented ||
        this.inBattle ||
        this.disposed
      )
        return;
      let key = ev.key.toLowerCase();
      if ((ev.ctrlKey || ev.metaKey) && key === 'a') {
        (ev.preventDefault(), this.selectAll());
        return;
      }
      if (!(ev.ctrlKey || ev.metaKey || ev.altKey)) {
        if (!this.uiKeys) {
          let keymap = {
            i: 'inventory',
            c: 'stealth',
            b: 'search',
            x: 'run',
            r: 'rest',
            j: 'journal',
            g: 'select_all',
            escape: 'menu',
          };
          if (keymap[key]) {
            this.action(keymap[key]);
            return;
          }
        }
        if (key === 'tab') {
          ev.preventDefault();
          let idx = this.members.findIndex((m) => m.id === this.leader),
            next = this.members[(idx + 1) % this.members.length];
          next && this.setLeader(next.id);
          return;
        }
        if (key === 'f' || key === ' ') {
          let lead = this.lead();
          lead &&
            (ev.preventDefault(), this.camera.focus(lead.actor.root.position), (this.camera.following = !0));
          return;
        }
        if (/^[1-6]$/.test(key)) {
          let m = this.members[Number(key) - 1];
          m && this.setLeader(m.id, { additive: ev.shiftKey });
        }
      }
    }),
      addEventListener('keydown', this._key));
  }
  /**
   * Qué hay bajo un punto de pantalla: actor u objeto cercano en pantalla, o la casilla del suelo
   * (objeto, salida o «ground»).
   */
  pick(x, y) {
    let camera = this.game.stage.camera,
      vw = innerWidth,
      vh = innerHeight,
      v = this.v,
      best = null,
      bestDist = innerWidth < 700 ? 46 : 38,
      screenDist = (pos, weight) => (
        v.copy(pos).project(camera),
        v.z > 1 ? 1 / 0 : Math.hypot((v.x * 0.5 + 0.5) * vw - x, (-v.y * 0.5 + 0.5) * vh - y) * weight
      ),
      consider = (actor, kind, id, cell) => {
        if (!actor?.root.visible) return;
        let pos = actor.root.position,
          h = actor.height || 1.7;
        for (let k of [0.15, 0.5, 0.85]) {
          let dist = screenDist(new Vector3(pos.x, pos.y + h * k, pos.z), 1);
          dist < bestDist && ((bestDist = dist), (best = { kind, id, cell, actor }));
        }
      };
    for (let npc of this.npcs.values()) consider(npc.actor, 'npc', npc.def.id, npc.cell);
    for (let group of this.groups.values())
      for (let en of group.enemies) !en.dead && !group.hidden && consider(en.actor, 'enemy', en.id, en.cell);
    for (let m of this.members) consider(m.actor, 'member', m.id, m.cell);
    for (let [id, obj] of this.objects) {
      if (!this.objectVisible(obj) || !obj.cell) continue;
      let anchor = this.anchorOf(id);
      if (!anchor && obj.type !== 'trap') continue;
      let pos = anchor
        ? anchor.getWorldPosition(new Vector3())
        : this.world.cellToWorld(obj.cell, new Vector3());
      pos.y += obj.type === 'sign' || obj.type === 'board' ? 1 : 0.4;
      let dist = screenDist(pos, 0.9);
      dist < bestDist && ((bestDist = dist), (best = { kind: 'object', id, cell: obj.cell }));
    }
    if (best) return best;
    let ndc = new Vector2((x / vw) * 2 - 1, -(y / vh) * 2 + 1);
    this.ray.setFromCamera(ndc, camera);
    let hit = this.world.pick(this.ray);
    if (!hit) return null;
    let cell = hit.cell;
    for (let [id, obj] of this.objects)
      if (!(!this.objectVisible(obj) || !obj.cell)) {
        if (obj.cell[0] === cell[0] && obj.cell[1] === cell[1]) return { kind: 'object', id, cell: obj.cell };
        if (obj.type === 'door' && obj.target && hexDistance(obj.target, cell) <= (obj.foot ?? 2))
          return { kind: 'object', id, cell: obj.cell };
      }
    let exit = this.exitAt(cell);
    return exit ? { kind: 'exit', id: exit.id, cell, exit } : { kind: 'ground', cell, point: hit.point };
  }
  /** Toque o clic: seleccionar o hablar con un miembro, hablar con un PNJ, atacar, usar, salir o andar. */
  onTap(x, y, mods = {}) {
    if (this.isBusy()) return;
    this.game.audio?.unlock?.();
    let hit = this.pick(x, y);
    if (
      (this.trace(
        `clic ${Math.round(x)},${Math.round(y)} -> ${hit ? `${hit.kind} ${hit.id || ''} ${hit.cell}` : 'nada'}`,
      ),
      !!hit)
    )
      switch (hit.kind) {
        case 'member': {
          let now = performance.now(),
            last = this._lastMemberTap;
          if (
            ((this._lastMemberTap = { id: hit.id, t: now }),
            last?.id === hit.id && now - last.t < 450 && hit.id !== 'hero')
          ) {
            ((this._lastMemberTap = null), talkToMember(this, hit.id));
            break;
          }
          this.setLeader(hit.id, { additive: mods.shift || mods.ctrl });
          break;
        }
        case 'npc':
          talkToNpc(this, hit.id);
          break;
        case 'enemy':
          attackEnemy(this, hit.id);
          break;
        case 'object':
          useObject(this, hit.id);
          break;
        case 'exit':
          this.goExit(hit.exit, hit.cell);
          break;
        case 'ground': {
          let cell = hit.cell;
          if (!this.xmap.walkable(cell)) {
            let free = this.xmap.freeNear(cell, 1, this.blocked(), { maxR: 2 })[0];
            if (!free) {
              (this.marks.destination(cell, !1), this.game.bus.emit('ui:error', {}));
              return;
            }
            this.moveTo(free);
            return;
          }
          this.moveTo(cell);
          break;
        }
        default:
          break;
      }
  }
  /** Mueve al grupo a la casilla (marca en rojo si no hay camino). */
  async moveTo(cell) {
    (await this.moveParty(cell)) === !1 &&
      !this.lead()?.moving &&
      (this.xmap.path(this.lead().cell, cell, this.blocked()).length ||
        (this.marks.destination(cell, !1), this.game.bus.emit('ui:error', {})));
  }
  /** Va hasta una salida y la usa, si está abierta. */
  async goExit(exit, cell) {
    if (!this.flag(exit.requires) || !exit.to) {
      (this.toast(exit.blocked || 'Por aqu\xED no se puede ir.', 'apagado', 5e3), this.moveParty(cell));
      return;
    }
    (await this.moveParty(cell)) && this.useExit(exit);
  }
  /** Sale del nivel: «travel» abre el mapa de viaje; «level:id:spawn» carga otro nivel. */
  useExit(exit) {
    let to = exit.to || '';
    if (to === 'travel') this.travel('travel', exit.id && this.level.spawns?.[exit.id] ? exit.id : 'saved');
    else if (to.startsWith('level:')) {
      let [, level, spawn] = to.split(':');
      this.travel(level, spawn || 'default');
    }
  }
  /** Pulsación larga: inventario del miembro o datos del enemigo o del PNJ. */
  onLongPress(x, y) {
    if (this.isBusy()) return;
    let hit = this.pick(x, y);
    if (hit) {
      if (hit.kind === 'member') this.openScreen('inventario', { who: hit.id });
      else if (hit.kind === 'enemy') {
        let en = this.enemy(hit.id),
          info = this.rules.monster(en.monster);
        this.toast(
          `${en.name}${info.ac ? ` \xB7 CA ${info.ac}` : ''}${info.hp ? ` \xB7 ${info.hp} PG` : ''}`,
          'mal',
        );
      } else if (hit.kind === 'npc') {
        let npc = this.npcs.get(hit.id);
        this.toast(`${npc.def.name}${npc.def.title ? `, ${npc.def.title.toLowerCase()}` : ''}`, 'apagado');
      }
    }
  }
  /** Etiqueta y resalte de lo que hay bajo el puntero (unas 15 veces por segundo). */
  updateHover(dt) {
    if (((this.hoverT -= dt), this.hoverT > 0)) return;
    this.hoverT = 0.066;
    let canvas = this.game.stage.renderer.domElement;
    if (!this.mouse || this.isBusy()) {
      (this.overlay.setLabel(null), this.marks.setHover(null), (canvas.style.cursor = ''));
      return;
    }
    let hit = this.pick(this.mouse.x, this.mouse.y),
      info = hit ? hoverInfo(this, hit) : null;
    if (!info) {
      (this.overlay.setLabel(null),
        this.marks.setHover(null),
        (canvas.style.cursor = hit?.kind === 'ground' && !this.xmap.walkable(hit.cell) ? 'not-allowed' : ''));
      return;
    }
    ((canvas.style.cursor = hit.kind === 'enemy' ? 'crosshair' : 'pointer'),
      this.overlay.setLabel(info.anchor, info.title, info.sub, info.bad),
      this.marks.setHover(
        info.ring ? { kind: info.ringKind || hit.kind, pos: info.ring, size: info.size || 1 } : null,
      ));
  }
  /** Fotograma: movimiento, actores, cámara, mundo, marcas, detección, charla, LOD y transparencias. */
  update(dt, time) {
    if (!this.disposed) {
      (this.inBattle && this.game.battle?.update?.(dt, time),
        (dt *= this.turbo),
        this.inBattle || this.moveMembers(dt));
      for (let m of this.members) m.actor.update(dt);
      this.updateNpcs(dt);
      for (let group of this.groups.values()) for (let en of group.enemies) en.actor?.update(dt);
      if (
        (this.animals?.update(dt),
        this.camera.update(dt),
        this.world.update?.(dt, time, this.game.stage.camera),
        this.marks.update(dt),
        !this.inBattle)
      ) {
        if (((this.detectT += dt), this.detectT >= DETECT_INTERVAL)) {
          ((this.detectT = 0), this.isBusy() || detect(this));
          for (let group of this.groups.values())
            group.cooldown = Math.max(0, group.cooldown - DETECT_INTERVAL);
        }
        (this.banter?.update(dt), this.updateHover(dt));
      }
      if (
        ((this.lodT = (this.lodT || 0) + dt),
        this.lodT > 0.5 && ((this.lodT = 0), this.updateLod()),
        (this.occT += dt),
        this.occT > 0.12 && this.world.fadeOccluders)
      ) {
        this.occT = 0;
        let points = [],
          actors = this.inBattle
            ? [
                ...this.members.map((m) => m.actor),
                ...[...this.groups.values()].flatMap((g) =>
                  g.enemies.filter((en) => !en.dead && en.actor).map((en) => en.actor),
                ),
              ]
            : this.members.map((m) => m.actor);
        for (let actor of actors) points.push(actor.root.position.clone().add(new Vector3(0, 0.9, 0)));
        (this.inBattle || points.push(this.game.stage.controls.target.clone()),
          this.world.fadeOccluders(this.game.stage.camera, points));
      }
    }
  }
  /** Nivel de detalle de PNJ, enemigos y animales según la distancia a la cámara. */
  updateLod() {
    let camPos = this.game.stage.camera.position,
      low = (this.game.quality?.level ?? 1) === 0,
      apply = (actor) => {
        let ch = actor?.ch;
        if (!ch?.setLod) return;
        let dist = actor.root.position.distanceTo(camPos),
          lod = this.inBattle ? 0 : dist > 34 ? 2 : dist > (low ? 16 : 22) ? 1 : 0;
        ch.lod !== lod && ch.setLod(lod);
      };
    for (let npc of this.npcs.values()) apply(npc.actor);
    for (let group of this.groups.values()) for (let en of group.enemies) en.actor && apply(en.actor);
    for (let animal of this.animals?.list || []) apply(animal.actor);
  }
  /** Cambia de nivel o abre el mapa de viaje (`level` = «travel»). */
  travel(level, spawn = 'default') {
    if (this.leaving) return;
    let game = this.game;
    if (level === 'travel') {
      if (!game.scenes.registry.has('travel')) {
        this.toast('El mapa de viaje todav\xEDa no est\xE1 listo.', 'apagado');
        return;
      }
      ((this.leaving = !0),
        this.saveCell(),
        (game.store.cp.location = {
          ...game.store.cp.location,
          level: this.levelId,
          spawn: spawn === 'default' ? 'saved' : spawn,
        }),
        game.store.save('auto'),
        game.go('travel', {
          from: this.levelId,
          back: { level: this.levelId, spawn: game.store.cp.location.spawn },
        }));
      return;
    }
    ((this.leaving = !0),
      (game.store.cp.location = { level, spawn, name: '' }),
      game.go('explore', { level, spawn }));
  }
  /** API pública de la exploración (`game.explore`) para la historia, la interfaz y la depuración. */
  api() {
    let explore = this;
    return {
      get level() {
        return explore.level;
      },
      levelId: explore.levelId,
      get world() {
        return explore.world;
      },
      get inBattle() {
        return explore.inBattle;
      },
      get isBusy() {
        return explore.isBusy();
      },
      startBattle: (gid, opts = {}) => startBattle(explore, gid, opts),
      removeGroup: (gid, opts = {}) => withdrawGroup(explore, gid, opts),
      addCompanion: async () => {
        await explore.rebuildParty();
      },
      removeCompanion: async (id) => {
        let m = explore.member(id);
        if (m) {
          let dest = explore.xmap.freeNear(m.cell, 12, explore.blocked(!0)).pop();
          dest && ((m.path = explore.xmap.path(m.cell, dest, explore.blocked()).slice(1)), await sleep(1600));
        }
        await explore.rebuildParty();
      },
      spawnNpc: async (def) => (
        (explore.ls.spawned[def.id] = def),
        (explore.ls.npcGone = explore.ls.npcGone.filter((id) => id !== def.id)),
        !!(await explore.addNpc(def))
      ),
      removeNpc: async (id, { walkTo = null } = {}) => {
        (explore.npcs.get(id) && walkTo && (await explore.api().moveNpc(id, walkTo)),
          explore.ls.npcGone.includes(id) || explore.ls.npcGone.push(id),
          delete explore.ls.spawned[id],
          explore.removeNpcNow(id));
      },
      moveNpc: (id, cell, { speed = 1.6, run = !1 } = {}) =>
        new Promise((resolve) => {
          let npc = explore.npcs.get(id);
          if (!npc) return resolve(!1);
          let blocked = explore.blocked(!0);
          blocked.delete(cellKey(npc.cell[0], npc.cell[1]));
          let path = explore.xmap.path(npc.cell, cell, blocked);
          if (path.length < 2) {
            path.length === 1 ? resolve(!0) : resolve(!1);
            return;
          }
          ((npc.path = path.slice(1)),
            (npc.speed = run ? 3.8 : speed),
            npc.actor.anim(run ? 'run' : 'walk', { mps: npc.speed }),
            (npc.onArrive = () => {
              ((explore.ls.npcCells[id] = cell.slice()), (npc.home = npc.yaw), resolve(!0));
            }));
        }),
      setObjectState: (id, state) => {
        explore.ls.states[id] = state;
        let obj = explore.objects.get(id);
        (obj?.type === 'door' &&
          obj.cell &&
          !obj.target &&
          state === 'open' &&
          explore.xmap.setTile(obj.cell, obj.open_tile || '.'),
          state === 'revealed' && !explore.ls.found.includes(id) && explore.ls.found.push(id),
          explore.world.setObjectState?.(id, state),
          explore.game.bus.emit('object:state', { id, object: obj || null, state }),
          explore.refreshObject(id));
      },
      objectState: (id) => explore.ls.states[id] || null,
      focus: (cell, dist, opts) => explore.camera.focus(explore.world.cellToWorld(cell), dist, opts),
      moveParty: (cell, opts) => explore.moveParty(cell, opts),
      travel: (level, spawn) => explore.travel(level, spawn),
      refresh: () => explore.refreshWorld(),
      busy: (on) => {
        (on ? (explore.busyN++, explore.stopAll()) : (explore.busyN = Math.max(0, explore.busyN - 1)),
          explore.busySignal());
      },
      say: (id, text, opts) => explore.say(id, text, opts),
      narrate: (text, opts) => explore.narrate(text, opts),
      actor: (id) =>
        explore.member(id)?.actor || explore.npcs.get(id)?.actor || explore.enemy(id)?.actor || null,
      face: (id, target) => explore.faceTo(id, target),
      anim: (id, name, { once = !1, hold = !1 } = {}) => {
        let actor = explore.api().actor(id);
        return actor
          ? once
            ? actor.once(name, { hold })
            : (actor.anim(name), Promise.resolve())
          : Promise.resolve();
      },
      reveal: (id) => revealObject(explore, id, explore.leader, ''),
      members: () => explore.members.map((m) => m.id),
      leader: () => explore.leader,
      cell: (id) => (explore.member(id) || explore.npcs.get(id) || explore.enemy(id))?.cell?.slice() || null,
      toast: (text, kind) => explore.toast(text, kind),
      hint: (text) => explore.hint(text),
      flash: (text, kind) => explore.hud?.banner?.(text, kind),
    };
  }
  /** Bocadillo sobre un miembro, PNJ o enemigo; la promesa se resuelve al desaparecer. */
  say(id, text, { dur, duration } = {}) {
    dur == null && duration != null && (dur = duration / 1e3);
    let actor = this.member(id)?.actor || this.npcs.get(id)?.actor || this.enemy(id)?.actor;
    if (!actor) return Promise.resolve();
    let name = this.member(id)
      ? this.rules.shortName(id)
      : this.npcs.get(id)?.def.name || this.enemy(id)?.name || '';
    return this.overlay.bubble((v) => actor.head(v).add(new Vector3(0, 0.32, 0)), name, text, { dur });
  }
  /** Gira a un actor hacia otro actor o hacia una casilla. */
  faceTo(id, target) {
    let pos = Array.isArray(target)
      ? this.world.cellToWorld(target)
      : (this.member(target) || this.npcs.get(target) || this.enemy(target))?.actor?.root.position;
    if (!pos) return;
    let npc = this.npcs.get(id);
    if (npc) {
      ((npc.lookAt = pos.clone()), (npc.talkT = 12));
      return;
    }
    let actor = this.member(id)?.actor || this.enemy(id)?.actor;
    actor &&
      (actor.root.rotation.y = Math.atan2(pos.x - actor.root.position.x, pos.z - actor.root.position.z));
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = !0;
    let game = this.game;
    (this.saveCell(), game.bus.emit('level:leave', { level: this.levelId }));
    for (let off of this.offs) off();
    removeEventListener('keydown', this._key);
    for (let key of this._uiKeys || []) game.ui.keys?.reset?.(key);
    (clearTimeout(this._hudT),
      this.camera?.dispose(),
      this.overlay?.dispose(),
      this.hud?.dispose?.(),
      this.marks?.dispose(),
      this.animals?.dispose());
    for (let m of this.members) m.actor.dispose();
    for (let npc of this.npcs.values()) npc.actor.dispose();
    for (let group of this.groups.values()) for (let en of group.enemies) en.actor?.dispose();
    for (let c of this.corpses || []) c.actor?.dispose();
    (this.world?.dispose?.(),
      (game.stage.renderer.domElement.style.cursor = ''),
      game.explore && game.explore.levelId === this.levelId && (game.explore = null));
  }
};

export { neighbors } from './hex.js';
export { Explore, SPEED, createExplore };
