// explore/index.js
// Reconstruido de publicado/juego.js (módulo __esm «F1»). Nombres locales aún minificados.

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
import { Em } from './checks.js';
import { ensureCampaign } from './campaign.js';
import { loadLevel } from './levels.js';
import { loadAreaModules } from './areas.js';
import { mk } from './fallback-world.js';
import { yk } from './actors.js';
import { ExploreInput } from './input.js';
import { i0 } from './floaters.js';
import { r0 } from './marks.js';
import { kk, Rk } from './hud.js';
import { Ju, Xu, cy, Xk, Yk, m0, uy, Zk } from './interact.js';
import { perceive, search, toggleStealth, detect, checkTriggers } from './detection.js';
import { Uk, Uo, Gk } from './battle.js';
import { g0, b0 } from './animals.js';

async function createExplore(o, e = {}) {
  let t = new Explore(o, e);
  return (await t.init(), t.scene());
}
const SPEED = { run: 3.9, walk: 1.75, sneak: 1.3 };
const e5 = 0.2;
const Ic = MathUtils.degToRad;
const v0 = (o) => new Promise((e) => setTimeout(e, o));
const Explore = class {
  constructor(e, t) {
    ((this.game = e), (this.params = t));
    let a = ensureCampaign(e);
    ((this.levelId = t.level || a.location?.level || 'merrowick'),
      (this.spawn =
        t.spawn || (a.location?.level === this.levelId && a.location?.cell ? 'saved' : 'default')),
      (this.startCell = Array.isArray(t.cell) ? t.cell.slice() : null),
      t.loaded &&
        a.location?.level === this.levelId &&
        a.location?.cell &&
        ((this.startCell ??= a.location.cell.slice()), (this.spawn = 'saved')),
      (this.three = new Scene()),
      (this.rules = new Em(e)),
      (this.xmap = new ExploreMap({ call: (n, s) => this.rules.call(n, s) })),
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
      (this.run = !e.store.settings.walk),
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
      (this.turbo = Math.max(1, Number(t.turbo || e.params?.get?.('turbo')) || 1)));
  }
  get ls() {
    let e = this.game.store.levelState(this.levelId);
    if (!e.npcGone || !e.spawned) {
      for (let t of ['found', 'opened', 'dead', 'disarmed', 'unlocked', 'fired', 'gone', 'talked', 'npcGone'])
        e[t] ??= [];
      for (let t of ['loot', 'drops', 'states', 'npcCells', 'spawned']) e[t] ??= {};
    }
    return e;
  }
  async init() {
    let e = this.game,
      t = e.ui,
      a = performance.now(),
      n = a;
    this.timings = {};
    let s = (c, d, u) => {
      let h = performance.now();
      ((this.timings[c] = Math.round(h - n)), (n = h), d && t.loading?.(d, u));
    };
    (t.loading?.('Preparando el camino', 0.02),
      (this.mods = await loadAreaModules()),
      (this.level = await loadLevel(this.levelId, this.mods.world)));
    let i = this.level;
    (s('nivel', `Llegando a ${i.name || this.levelId}`, 0.05),
      this.ls,
      (this.factory = yk(e, this.mods.actors)));
    let r = this.makePartyActors();
    if (((this.world = null), this.mods.world))
      try {
        this.world = await this.mods.world.buildLevel(this.three, i, {
          quality: e.quality,
          store: e.store,
          game: e,
          stage: e.stage,
        });
      } catch (c) {
        console.error(
          '[exploraci\xF3n] buildLevel de Escenarios ha fallado; uso el mundo de depuraci\xF3n',
          c,
        );
      }
    (this.world || (this.world = await mk(this.three, i, { quality: e.quality })),
      (this.world.width ??= Math.max(...i.rows.map((c) => c.length))),
      (this.world.height ??= i.rows.length),
      s('mundo', 'Reuniendo al grupo', 0.7),
      this.xmap.load(i.rows));
    for (let [c, d] of Object.entries(this.ls.states)) {
      let u = (i.objects || []).find((h) => h.id === c);
      u?.type === 'door' &&
        d === 'open' &&
        u.cell &&
        !u.target &&
        this.xmap.setTile(u.cell, u.open_tile || '.');
    }
    if (
      (this.loadObjects(),
      (this.camera = new ExploreInput(e.stage, {
        bounds: this.world.bounds,
        settings: e.store.settings,
        onTap: (c, d, u) => this.onTap(c, d, u),
        onLongPress: (c, d) => this.onLongPress(c, d),
        onHover: (c, d) => (this.mouse = c == null ? null : { x: c, y: d }),
      })),
      (this.overlay = new i0(e.stage.camera, t.root)),
      (this.marks = new r0(this.three, this.world)),
      this.spawnGroups(),
      await this.spawnParty(await r),
      s('grupo', 'Saludando a los vecinos', 0.85),
      await this.spawnNpcs(),
      s('pnj', 'Casi listo', 0.95),
      (this.animals = new g0(this)),
      (this.banter = new b0(this)),
      await this.makeHud(),
      this.refreshObjects(),
      this.updateExits(),
      this.lead())
    ) {
      let c = this.clearView(this.groupCenter(), { pitch: Ic(54), prefer: this.startYaw() });
      (this.camera.place(this.groupCenter(), {
        dist: innerWidth < innerHeight ? 26 : 21,
        yaw: c.yaw,
        pitch: c.pitch,
      }),
        this.camera.follow(() => (this.lead()?.moving ? this.lead().actor.root.position : null)),
        this.world.fadeOccluders?.(
          e.stage.camera,
          this.members.map((d) => d.actor.root.position.clone()),
        ));
    }
    (this.bindKeys(),
      (e.explore = this.api()),
      this.offs.push(
        e.bus.on('scene:enter', ({ name: c }) => c === 'explore' && !this.entered && this.afterEnter()),
      ),
      this.offs.push(e.bus.on('cp:changed', () => (this.pp = null))),
      this.offs.push(e.bus.on('flag:set', () => this.flagsChanged())),
      this.offs.push(
        e.bus.on(
          'ui:close',
          ({ name: c } = {}) => !this.inBattle && !this.disposed && c !== 'dialogo' && this.rebuildParty(),
        ),
      ),
      this.offs.push(e.bus.on('cp:changed', () => this.updateHudSoon())),
      this.offs.push(e.bus.on('quality:changed', ({ level: c } = {}) => this.world.setQuality?.(c))),
      s('hud', 'Encendiendo los faroles', 0.97));
    try {
      let c = e.stage.renderer;
      c.compileAsync && (await Promise.race([c.compileAsync(this.three, e.stage.camera), v0(5e3)]));
    } catch (c) {
      console.warn('[exploraci\xF3n] compileAsync', c);
    }
    (s('sombreadores'),
      (this.timings.total = Math.round(performance.now() - a)),
      t.loading?.(null),
      (this.background = (async () => {
        if ((await v0(50), this.disposed)) return;
        let c = performance.now();
        (await this.animals.spawn(i.animals || []),
          (this.timings.animales = Math.round(performance.now() - c)),
          await this.loadPortraits(),
          (this.timings.retratos = Math.round(performance.now() - c - this.timings.animales)),
          await this.groupsReady,
          (this.timings.enemigos = Math.round(performance.now() - c)),
          e.params?.has?.('depurar') &&
            console.info('[exploraci\xF3n] tiempos de carga (ms)', JSON.stringify(this.timings)));
      })()));
  }
  async afterEnter() {
    if (this.entered) return;
    this.entered = !0;
    let e = this.game,
      t = e.store.cp;
    ((t.location = {
      level: this.levelId,
      spawn: this.spawn === 'saved' ? t.location?.spawn || 'default' : this.spawn,
      cell: this.lead()?.cell?.slice(),
      name: this.level.name,
    }),
      e.bus.emit('level:enter', { level: this.levelId, spawn: this.spawn }),
      await checkTriggers(this, !0),
      this.disposed || e.store.save('auto'));
  }
  scene() {
    return {
      three: this.three,
      sun: this.world.sun,
      update: (e, t) => this.update(e, t),
      afterRender: (e) => {
        (this.overlay?.update(e), this.inBattle && this.game.battle?.afterRender?.(e));
      },
      dispose: () => this.dispose(),
      explore: this,
    };
  }
  levelMusic() {
    let e = this.level.music || 'aldea';
    for (let [t, a] of Object.entries(this.level.music_flags || {})) this.flag(t) && (e = a);
    return e;
  }
  startYaw() {
    let e = this.lead().actor.root.position,
      a = new Vector3(
        ((this.world.width || 20) * HEX_SIZE) / 2,
        0,
        ((this.world.height || 20) * HEX_SIZE * 0.866) / 2,
      )
        .clone()
        .sub(e);
    return Math.atan2(a.x, a.z) + Math.PI + 0.35;
  }
  groupCenter() {
    let e = new Vector3();
    for (let t of this.members) e.add(t.actor.root.position);
    return this.members.length ? e.divideScalar(this.members.length) : e;
  }
  clearView(e, { pitch: t = Ic(54), prefer: a = 0 } = {}) {
    let n = {
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
      s = this.level.ambient === 'crypt' ? 3 : 6,
      i = (l, c) => {
        let d = Math.sin(l),
          u = Math.cos(l),
          h = Math.tan(c),
          p = 0;
        for (let _ = 0.6; _ <= 9; _ += 0.45) {
          let b = 1.4 + _ * h;
          for (let [f, v] of [
            [0, 1],
            [0.9, 0.5],
            [-0.9, 0.5],
          ]) {
            let x = e.x + d * _ + u * f,
              g = e.z + u * _ - d * f,
              y = this.world.worldToCell({ x, y: 0, z: g });
            (this.xmap.inBounds(y) ? n[this.xmap.tile(y)] || 0 : s) > b && (p += v);
          }
        }
        let m = Math.abs(l - a) % (2 * Math.PI);
        return (m > Math.PI && (m = 2 * Math.PI - m), p + m * 0.25);
      },
      r = { yaw: a, pitch: t, s: 1 / 0 };
    for (let l of [t, t + Ic(6), t + Ic(12)]) {
      for (let c = 0; c < 16; c++) {
        let d = (c * Math.PI) / 8,
          u = i(d, l) + (l - t) * 2;
        u < r.s && (r = { yaw: d, pitch: l, s: u });
      }
      if (r.s < 0.9) break;
    }
    return r;
  }
  flag(e) {
    if (!e) return !0;
    if (Array.isArray(e)) return e.every((n) => this.flag(n));
    if (/^[\w.-]+$/.test(e)) return !!this.game.store.flag(e);
    let t = this.game.story?.test;
    if (typeof t == 'function')
      try {
        return !!t.call(this.game.story, e);
      } catch (n) {
        console.warn('[exploraci\xF3n] story.test', e, n);
      }
    let a = /^!\s*([\w.-]+)$/.exec(e);
    return a ? !this.game.store.flag(a[1]) : !!this.game.store.flag(e);
  }
  member(e) {
    return this.members.find((t) => t.id === e) || null;
  }
  lead() {
    let e = this.member(this.leader);
    return (!e && this.members.length && ((e = this.members[0]), (this.leader = e.id)), e);
  }
  movers() {
    return this.members.filter((e) => this.selected.has(e.id));
  }
  makePartyActors() {
    let t = this.game.store.cp.party.filter((a) => !this.rules.state(a).dead);
    return Promise.all(t.map((a) => this.factory.member(a, this.rules.sheet(a)))).then((a) => ({
      ids: t,
      made: a,
    }));
  }
  async spawnParty(e = null) {
    let t = this.game.store.cp,
      a = this.level,
      n = a.spawns?.[this.spawn] || a.spawns?.default || [2, 2];
    (this.spawn === 'saved' &&
      t.location?.level === this.levelId &&
      t.location?.cell &&
      (n = t.location.cell),
      this.startCell && (n = this.startCell));
    let { ids: s, made: i } = e || (await this.makePartyActors());
    this.dead = t.party.filter((u) => this.rules.state(u).dead);
    let r = this.xmap.freeNear(n, s.length, this.blocked()),
      l = this.world.cellToWorld(n),
      c = new Vector3(
        ((this.world.width || 20) * HEX_SIZE) / 2,
        0,
        ((this.world.height || 20) * HEX_SIZE * 0.866) / 2,
      ),
      d = Math.atan2(c.x - l.x, c.z - l.z);
    (s.forEach((u, h) => {
      let p = i[h],
        m = r[Math.min(h, r.length - 1)] || n;
      (this.world.cellToWorld(m, p.root.position),
        (p.root.rotation.y = d),
        this.three.add(p.root),
        p.anim('idle'),
        this.members.push({ id: u, actor: p, cell: m.slice(), path: [], moving: !1, delay: 0 }));
    }),
      (this.leader = this.members.find((u) => u.id === 'hero')?.id || this.members[0]?.id || null),
      (this.selected = new Set(this.members.map((u) => u.id))),
      (this.portraits = new Map()),
      this.updateRings());
  }
  async loadPortraits() {
    if (typeof this.game.ui.portrait == 'function') return;
    let e = this.game.store.cp;
    for (let t of e?.party || []) {
      if (this.disposed) return;
      this.portraits.has(t) ||
        (this.portraits.set(
          t,
          await this.factory.portrait(this.member(t)?.actor, { ...this.rules.sheet(t), id: t }),
        ),
        this.updateHudSoon());
    }
  }
  async rebuildParty() {
    let e = this.game.store.cp,
      t = e.party.filter((n) => !this.rules.state(n).dead);
    this.dead = e.party.filter((n) => this.rules.state(n).dead);
    for (let n of [...this.members])
      t.includes(n.id) ||
        (n.actor.dispose(),
        this.marks.removeRing(n.id),
        this.members.splice(this.members.indexOf(n), 1),
        this.selected.delete(n.id));
    let a = this.lead();
    for (let n of t) {
      if (this.member(n)) continue;
      let s = this.npcs.get(n),
        i = this.xmap.freeNear(a?.cell || [2, 2], 1, this.blocked(!0))[0] || a?.cell || [2, 2];
      s && ((i = s.cell.slice()), this.removeNpcNow(n));
      let r = await this.factory.member(n, this.rules.sheet(n));
      (this.world.cellToWorld(i, r.root.position),
        this.three.add(r.root),
        r.anim('idle'),
        this.members.push({ id: n, actor: r, cell: i.slice(), path: [], moving: !1, delay: 0 }),
        this.selected.add(n),
        !this.portraits.has(n) &&
          typeof this.game.ui.portrait != 'function' &&
          this.portraits.set(n, await this.factory.portrait(r, { ...this.rules.sheet(n), id: n })));
    }
    for (let n of this.members)
      (n.down && ((n.down = !1), n.actor.anim('idle', { fade: 0.4 })), n.actor.setShadowed(this.stealth));
    (this.members.sort((n, s) => e.party.indexOf(n.id) - e.party.indexOf(s.id)),
      this.member(this.leader) || (this.leader = this.members[0]?.id || null),
      (this.pp = null),
      this.updateRings(),
      this.updateHud());
  }
  updateRings() {
    for (let e of this.members)
      this.marks.ring(
        e.id,
        e.actor.root,
        this.inBattle
          ? null
          : e.id === this.leader
            ? 'leader'
            : this.selected.has(e.id)
              ? 'selected'
              : 'member',
      );
  }
  setLeader(e, { additive: t = !1, focus: a = !1 } = {}) {
    let n = this.member(e);
    if (n) {
      if (a) {
        (this.camera.focus(n.actor.root.position), (this.camera.following = !0));
        return;
      }
      (t
        ? this.selected.has(e) && this.selected.size > 1
          ? (this.selected.delete(e), this.leader === e && (this.leader = [...this.selected][0]))
          : this.selected.add(e)
        : (this.leader === e && (this.camera.focus(n.actor.root.position), (this.camera.following = !0)),
          (this.leader = e),
          this.selected.add(e)),
        this.game.bus.emit('ui:select', { id: e }),
        this.updateRings(),
        this.updateHud());
    }
  }
  selectAll() {
    ((this.selected = new Set(this.members.map((e) => e.id))), this.updateRings(), this.updateHud());
  }
  blocked(e = !1) {
    let t = new Set();
    for (let a of this.npcs.values()) a.cell && t.add(cellKey(a.cell[0], a.cell[1]));
    for (let a of this.groups.values())
      for (let n of a.enemies) n.dead || t.add(cellKey(n.cell[0], n.cell[1]));
    for (let [a, n] of this.objects)
      (n.type === 'trap' &&
        this.objectVisible(n) &&
        !this.ls.disarmed.includes(a) &&
        t.add(cellKey(n.cell[0], n.cell[1])),
        n.type === 'door' &&
          !n.target &&
          n.cell &&
          this.ls.states[a] !== 'open' &&
          this.flag(n.requires_visible) &&
          t.add(cellKey(n.cell[0], n.cell[1])),
        n.blocks && this.objectVisible(n) && t.add(cellKey(n.cell[0], n.cell[1])));
    if (e) for (let a of this.members) t.add(cellKey(a.cell[0], a.cell[1]));
    return t;
  }
  formation(e, t, a, n) {
    let s = [e],
      i = new Set([cellKey(e[0], e[1])]);
    for (let r = t.length - 2; r >= 0 && s.length < n; r--) {
      let l = t[r],
        c = cellKey(l[0], l[1]);
      if (!(i.has(c) || a.has(c))) {
        if (hexDistance(l, e) > 3) break;
        (s.push(l), i.add(c));
      }
    }
    if (s.length < n) {
      let r = t[Math.max(0, t.length - 3)] || e,
        l = this.xmap
          .freeNear(e, n + 10, a)
          .sort(
            (c, d) =>
              hexDistance(c, e) + 0.6 * hexDistance(c, r) - (hexDistance(d, e) + 0.6 * hexDistance(d, r)),
          );
      for (let c of l) {
        if (s.length >= n) break;
        let d = cellKey(c[0], c[1]);
        i.has(d) || (s.push(c), i.add(d));
      }
    }
    return s;
  }
  moveParty(e, { leaderId: t = null, marker: a = !0, solo: n = !1 } = {}) {
    let s = this.member(t) || this.lead();
    if (!s || this.inBattle) return Promise.resolve(!1);
    let i = this.blocked(),
      r = this.xmap.path(s.cell, e, i);
    if ((this.trace(`mover ${s.id} ${s.cell} -> ${e}: ${r.length} casillas`), !r.length))
      return Promise.resolve(!1);
    let l = n ? [s] : [s, ...this.movers().filter((d) => d !== s)],
      c = this.formation(e, r, i, l.length);
    return (
      this.cancelArrive(),
      (s.path = r.slice(1)),
      (s.delay = 0),
      this.prepareWalk(s),
      l.slice(1).forEach((d, u) => {
        let h = c[Math.min(u + 1, c.length - 1)],
          p = this.xmap.path(d.cell, h, i);
        ((d.path = p.slice(1)), (d.delay = d.moving ? 0 : 0.1 + 0.12 * u), this.prepareWalk(d));
      }),
      a && this.marks.destination(e, !0),
      (this.camera.following = !0),
      this.overlay.clearBubbles(),
      new Promise((d) => {
        if (!s.path.length && !s.moving) {
          d(!0);
          return;
        }
        s.onArrive = d;
      })
    );
  }
  cancelArrive() {
    for (let e of this.members)
      if (e.onArrive) {
        this.trace(`llegada cancelada (${e.id})`);
        let t = e.onArrive;
        ((e.onArrive = null), t(!1));
      }
  }
  stopAll() {
    for (let e of this.members)
      ((e.path = []),
        e.moving && ((e.moving = !1), e.actor.anim(this.stealth ? 'crouch' : 'idle', { fade: 0.25 })));
    (this.cancelArrive(), this.marks.clearDestination(), this.saveCell());
  }
  saveCell() {
    let e = this.game.store.cp,
      t = this.lead();
    e &&
      t &&
      (e.location = {
        ...(e.location || {}),
        level: this.levelId,
        cell: t.cell.slice(),
        name: this.level.name,
      });
  }
  prepareWalk(e) {
    this.pullString(e);
  }
  pullString(e) {
    if (e.path.length < 2) return;
    let t = e.actor.root.position,
      a = { x: t.x / HEX_SIZE, y: t.z / HEX_SIZE },
      n = this.blocked(),
      s = 0;
    for (let i = 1; i < Math.min(e.path.length, 6); i++) {
      let r = e.path[i];
      if (this.xmap.straight(a, cellToPlane(r[0], r[1]), n)) s = i;
      else break;
    }
    s > 0 && e.path.splice(0, s);
  }
  moveMembers(e) {
    let t = this.stealth ? 'sneak' : this.run ? 'run' : 'walk',
      a = SPEED[t],
      n = this.lead(),
      s = !1;
    for (let i of this.members) {
      if (!i.path.length) continue;
      if (i.delay > 0) {
        i.delay -= e;
        continue;
      }
      s = !0;
      let r = i.actor.root.position,
        l = this.world.cellToWorld(i.path[0], this.v),
        c = l.x - r.x,
        d = l.z - r.z,
        u = Math.hypot(c, d),
        h = a;
      if (i !== n && n?.moving) {
        let b = r.distanceTo(n.actor.root.position);
        h *= 1 + MathUtils.clamp((b - 3) / 5, 0, 0.45);
      }
      (!i.moving || i.actor.cur !== t || Math.abs((i.lastSpeed || 0) - h) > 0.15) &&
        ((i.moving = !0), (i.lastSpeed = h), i.actor.anim(t, { mps: h }));
      let p = h * e;
      if (u > 1e-4) {
        let f = Math.atan2(c, d) - i.actor.root.rotation.y;
        ((f = Math.atan2(Math.sin(f), Math.cos(f))), (i.actor.root.rotation.y += f * Math.min(1, e * 11)));
      }
      u <= p
        ? ((r.x = l.x), (r.z = l.z), i.path.shift(), this.pullString(i))
        : ((r.x += (c / u) * p), (r.z += (d / u) * p));
      let m = this.world.heightAt ? this.world.heightAt(r.x, r.z) : l.y;
      r.y += (m - r.y) * Math.min(1, e * 14);
      let _ = this.world.worldToCell(r);
      if ((_[0] !== i.cell[0] || _[1] !== i.cell[1]) && ((i.cell = _), this.onEnterCell(i, _))) return;
      if (
        !i.path.length &&
        ((i.moving = !1), i.actor.anim(this.stealth ? 'crouch' : 'idle', { fade: 0.3 }), i.onArrive)
      ) {
        let b = i.onArrive;
        ((i.onArrive = null), i === n && this.saveCell(), b(!0));
      }
    }
    if (s && ((this.stepT += e), this.stepT > (this.stealth ? 0.55 : this.run ? 0.3 : 0.45))) {
      this.stepT = 0;
      let i = this.members.filter((r) => r.moving);
      this._stepI = ((this._stepI || 0) + 1) % Math.max(1, i.length);
      for (let r of new Set([n, i[this._stepI]]))
        r?.moving &&
          this.game.bus.emit('step', {
            who: r.id,
            at: r.actor.root.position.clone(),
            cell: r.cell,
            run: this.run && !this.stealth,
          });
    }
  }
  onEnterCell(e, t) {
    if (this.inBattle) return !1;
    for (let [a, n] of this.objects)
      if (
        !(n.type !== 'trap' || !n.cell || n.cell[0] !== t[0] || n.cell[1] !== t[1]) &&
        !(this.ls.disarmed.includes(a) || !this.flag(n.requires))
      )
        return (cy(this, a, e.id), !0);
    return (perceive(this, e), !!(e.id === this.leader && (this.saveCell(), checkTriggers(this, !1, t))));
  }
  async spawnNpcs() {
    let t = [
      ...(this.level.objects || []).filter((a) => a.type === 'npc'),
      ...Object.values(this.ls.spawned || {}),
    ];
    await Promise.all(t.map((a) => this.addNpc(a)));
  }
  npcAllowed(e) {
    return (
      this.flag(e.requires) &&
      !this.ls.npcGone.includes(e.id) &&
      !(e.hidden_until && !this.flag(e.hidden_until)) &&
      !(e.hide_if && this.game.store.flag(e.hide_if))
    );
  }
  async addNpc(e) {
    if (this.npcs.has(e.id) || !this.npcAllowed(e)) return null;
    let t = await this.factory.npc(e);
    if (this.disposed) return null;
    let a = (this.ls.npcCells[e.id] || e.cell).slice();
    (this.world.cellToWorld(a, t.root.position),
      (t.root.rotation.y = Ic(e.face ?? 0)),
      t.anim(e.anim || 'idle'),
      this.three.add(t.root));
    let n = {
      def: e,
      actor: t,
      cell: a,
      yaw: t.root.rotation.y,
      home: t.root.rotation.y,
      talkT: 0,
      path: [],
    };
    return (this.npcs.set(e.id, n), n);
  }
  removeNpcNow(e, { fade: t = !1 } = {}) {
    let a = this.npcs.get(e);
    if (!a) return;
    if ((this.npcs.delete(e), !t)) {
      a.actor.dispose();
      return;
    }
    let n = a.actor.root,
      s = n.scale.x,
      i = performance.now(),
      r = () => {
        let l = Math.min(1, (performance.now() - i) / 500);
        (n.scale.setScalar(s * Math.max(0.001, 1 - l)),
          l < 1 && !this.disposed ? requestAnimationFrame(r) : a.actor.dispose());
      };
    r();
  }
  updateNpcs(e) {
    for (let t of this.npcs.values()) {
      t.actor.update(e);
      let a = t.actor.root;
      if (t.path.length) {
        let s = this.world.cellToWorld(t.path[0], this.v),
          i = s.x - a.position.x,
          r = s.z - a.position.z,
          l = Math.hypot(i, r),
          c = (t.speed || 1.6) * e;
        ((t.yaw = Math.atan2(i, r)),
          l <= c
            ? ((a.position.x = s.x),
              (a.position.z = s.z),
              (t.cell = t.path.shift()),
              t.path.length || (t.actor.anim(t.def.anim || 'idle'), t.onArrive?.(), (t.onArrive = null)))
            : ((a.position.x += (i / l) * c), (a.position.z += (r / l) * c)),
          this.world.heightAt && (a.position.y = this.world.heightAt(a.position.x, a.position.z)));
      } else
        t.lookAt &&
          ((t.yaw = Math.atan2(t.lookAt.x - a.position.x, t.lookAt.z - a.position.z)),
          (t.talkT -= e),
          t.talkT <= 0 && ((t.lookAt = null), (t.yaw = t.home)));
      let n = t.yaw - a.rotation.y;
      ((n = Math.atan2(Math.sin(n), Math.cos(n))),
        Math.abs(n) > 0.001 && (a.rotation.y += n * Math.min(1, e * 6)));
    }
  }
  spawnGroups(e = this.level.groups || []) {
    let t = [];
    for (let a of e) {
      let n = a.id;
      if (
        this.groups.has(n) ||
        this.ls.dead.includes(n) ||
        this.ls.gone.includes(n) ||
        !this.flag(a.requires) ||
        (a.flag && this.game.store.flag(a.flag))
      )
        continue;
      let s = {},
        i = {};
      for (let c of a.enemies || []) i[c.id] = (i[c.id] || 0) + 1;
      let r = { def: a, enemies: [], roll: null, cooldown: 0, hidden: !!a.ambush, alerted: !1, ready: null },
        l = [];
      ((a.enemies || []).forEach((c, d) => {
        s[c.id] = (s[c.id] || 0) + 1;
        let u = s[c.id],
          h = `${n}_${c.id}_${u}`,
          p = this.rules.monster(c.id),
          m = i[c.id] > 1 ? `${p.name} ${u}` : p.name,
          _ = {
            id: h,
            monster: c.id,
            actor: null,
            cell: c.cell.slice(),
            face: c.face ?? 180,
            dead: !1,
            name: m,
            group: n,
            index: u,
            order: d,
          };
        (r.enemies.push(_),
          l.push(
            this.factory.monster(c.id, h, u).then((b) => {
              if (this.disposed || !this.groups.has(n)) {
                b.dispose();
                return;
              }
              (this.world.cellToWorld(_.cell, b.root.position),
                (b.root.rotation.y = Ic(_.face)),
                b.anim('idle'),
                (b.root.visible = !r.hidden),
                this.three.add(b.root),
                (_.actor = b));
            }),
          ));
      }),
        (r.ready = Promise.all(l).catch((c) => console.error('[exploraci\xF3n] enemigos', n, c))),
        t.push(r.ready),
        this.groups.set(n, r));
    }
    return ((this.groupsReady = Promise.all([this.groupsReady, ...t])), this.groupsReady);
  }
  enemy(e) {
    for (let t of this.groups.values()) for (let a of t.enemies) if (a.id === e) return a;
    return null;
  }
  groupPP(e) {
    let t = 0;
    for (let a of e.enemies) a.dead || (t = Math.max(t, this.rules.monster(a.monster).pp ?? 10));
    return t;
  }
  loadObjects() {
    this.objects.clear();
    for (let e of this.level.objects || []) e.type !== 'npc' && this.objects.set(e.id, e);
    for (let [e, t] of Object.entries(this.ls.drops || {}))
      (this.ls.loot[e] || []).length && this.objects.set(e, t);
  }
  objectVisible(e) {
    return !(
      (e.type !== 'door' && !this.flag(e.requires)) ||
      !this.flag(e.hidden_until) ||
      (e.hide_if && this.game.store.flag(e.hide_if)) ||
      (e.hidden && !this.ls.found.includes(e.id)) ||
      (e.type === 'trap' && this.ls.disarmed.includes(e.id)) ||
      ((e.type === 'cache' || e.type === 'loot') && this.ls.opened.includes(e.id) && !Ju(this, e).length) ||
      this.ls.states[e.id] === 'hidden'
    );
  }
  refreshObjects() {
    for (let [e, t] of this.objects) this.refreshObject(e, t);
  }
  refreshObject(e, t = this.objects.get(e)) {
    if (!t) return;
    let a = this.objectVisible(t),
      n = this.world.objects?.get?.(e);
    (n && (n.visible = a || (t.type === 'door' && !!t.target)),
      n && a && t.type === 'trap' && !n.visible && (n.visible = !0));
    let s = this.ls.states[e];
    if (
      (s && this.world.setObjectState
        ? this.world.setObjectState(e, s)
        : (t.type === 'chest' || t.type === 'cache' || t.type === 'loot') &&
          this.ls.opened.includes(e) &&
          this.world.setObjectState?.(e, Ju(this, t).length ? 'open' : 'empty'),
      t.type === 'trap' &&
        this.marks.trap(e, a && this.ls.found.includes(e) && !this.ls.disarmed.includes(e) ? t.cell : null),
      this.world.setObjectGlow)
    ) {
      let i = a && this.ls.found.includes(e) && !this.ls.opened.includes(e) && t.type !== 'trap';
      this.world.setObjectGlow(e, i ? 16762960 : null);
    }
  }
  addObject(e) {
    if ((this.objects.set(e.id, e), !this.world.objects?.get?.(e.id) && this.world.addObject))
      try {
        this.world.addObject(e);
      } catch (t) {
        console.warn('[exploraci\xF3n] addObject', t);
      }
    if (!this.world.objects?.get?.(e.id)) {
      let t = new Group(),
        a = new Mesh(
          new SphereGeometry(0.3, 9, 7).scale(1, 0.7, 1).translate(0, 0.2, 0),
          new MeshStandardMaterial({ color: 9071162, roughness: 0.85 }),
        );
      ((a.castShadow = !0),
        t.add(a),
        this.world.cellToWorld(e.cell, t.position),
        this.three.add(t),
        (this.ownAnchors ??= new Map()),
        this.ownAnchors.set(e.id, t));
    }
    this.refreshObject(e.id, e);
  }
  anchorOf(e) {
    return this.world.objects?.get?.(e) || this.ownAnchors?.get(e) || null;
  }
  async flagsChanged() {
    if (!(this._flagsBusy || this.disposed)) {
      ((this._flagsBusy = !0), await v0(0));
      try {
        await this.refreshWorld();
      } finally {
        this._flagsBusy = !1;
      }
    }
  }
  async refreshWorld() {
    this.refreshObjects();
    for (let e of this.level.objects || [])
      e.type === 'npc' &&
        (this.npcAllowed(e) && !this.npcs.has(e.id)
          ? await this.addNpc(e)
          : !this.npcAllowed(e) && this.npcs.has(e.id) && this.removeNpcNow(e.id, { fade: !0 }));
    if (!this.inBattle) {
      for (let [e, t] of [...this.groups])
        if (t.def.flag && this.game.store.flag(t.def.flag)) {
          this.groups.delete(e);
          for (let a of t.enemies) a.actor?.dispose();
        }
    }
    (this.inBattle || this.spawnGroups(), this.updateExits(), this.updateHud());
  }
  updateExits() {
    let e = (this.level.exits || []).map((t) => ({ ...t, usable: this.flag(t.requires) && !!t.to }));
    this.marks.setExits(e);
  }
  exitAt(e) {
    for (let t of this.level.exits || [])
      for (let a of t.cells || []) if (a[0] === e[0] && a[1] === e[1]) return t;
    return null;
  }
  async makeHud() {
    let e = this.game,
      t = {
        ...this.hudState(),
        onMember: (n, s = {}) => !this.isBusy() && this.setLeader(n, s),
        onMemberHold: (n) => !this.isBusy() && this.openScreen('inventario', { who: n }),
        onAction: (n) => this.action(n),
        onMenu: () => this.action('menu'),
      };
    ((this.realUi = typeof e.ui.has == 'function'),
      (this.realDialog = this.realUi || !String(e.ui.dialog).includes('prompt(')));
    let a = null;
    if (e.ui.hud?.explore)
      try {
        a = await e.ui.hud.explore(t);
      } catch (n) {
        console.warn('[exploraci\xF3n] ui.hud.explore:', n);
      }
    this.hud = a || (await kk(e.ui.root, t));
  }
  hudState() {
    let e = this.game.store.cp;
    return {
      party: (e?.party || []).map((a) => {
        let n = this.member(a),
          s = this.rules.hp(a);
        return {
          id: a,
          name: this.rules.shortName(a),
          fullName: this.rules.name(a),
          portrait: this.portraits?.get(a) || null,
          hp: s.hp,
          maxHp: s.max,
          leader: a === this.leader,
          selected: this.selected.has(a),
          dead: !n && this.dead.includes(a),
          down: !!n?.down,
        };
      }),
      gold: e?.gold ?? 0,
      place: this.level?.name || '',
      day: e?.day || 1,
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
  toast(e, t = 'info', a) {
    this.hud?.toast?.(e, t, a);
  }
  hint(e) {
    if (!e || this.game.store.settings.tips === !1) return;
    let t = this.game.ui.hud;
    t && typeof t.hint == 'function' && t !== this.hud ? t.hint(e) : this.hud?.hint?.(e);
  }
  trace(e) {
    this.game.params?.has?.('depurar') &&
      ((this._trace ??= []).push(`${(performance.now() / 1e3).toFixed(1)} ${e}`),
      this._trace.length > 80 && this._trace.shift());
  }
  isBusy() {
    return this.busyN > 0 || this.inBattle || this.disposed;
  }
  async withBusy(e) {
    (this.busyN++, this.busySignal());
    try {
      return await e();
    } finally {
      ((this.busyN = Math.max(0, this.busyN - 1)), this.busySignal());
    }
  }
  busySignal() {
    let e = this.busyN > 0 || this.inBattle;
    e !== this._busyShown && ((this._busyShown = e), this.hud?.update?.({ busy: e }));
  }
  dialog(e) {
    return this.withBusy(() => (this.realDialog ? this.game.ui.dialog(e) : Rk(this.game.ui.root, e)));
  }
  async choose({ speaker: e = '', title: t = '', text: a = '', portrait: n = null, options: s = [] }) {
    let i = await this.dialog({
        speaker: e,
        title: t,
        text: a,
        portrait: n,
        options: s.map((l) => ({
          text: l.text,
          tag: l.tag || null,
          kind: l.kind || null,
          disabled: !!l.disabled,
          hint: l.hint || null,
        })),
      }),
      r = s[i];
    return r && !r.disabled ? (r.value ?? i) : null;
  }
  async narrate(e, { title: t = this.level.name, sub: a = this.level.place } = {}) {
    let n = [].concat(e).map((s) => this.heroText(String(s))).join(`

`);
    await this.dialog({ speaker: t, title: a, text: n, options: [{ text: 'Continuar', kind: 'end' }] });
  }
  heroText(e) {
    let t = this.rules.sheet('hero');
    return e.replace(/\{heroe\}|\{hero\}/g, t.name || 't\xFA').replace(/\[\/?[a-z]+(=[^\]]*)?\]/g, '');
  }
  hasScreen(e) {
    return typeof this.game.ui.has == 'function' ? !!this.game.ui.has(e) : !1;
  }
  async openScreen(e, t = {}) {
    this.stopAll();
    let a = await this.withBusy(() => this.game.ui.open(e, t));
    return (await this.rebuildParty(), a);
  }
  addJournal(e) {
    let t = this.game.store.cp;
    !e ||
      !t ||
      ((t.journal ??= []),
      !t.journal.includes(e) && (t.journal.push(e), this.toast('Diario actualizado.', 'botin')));
  }
  action(e) {
    if (!(this.isBusy() && e !== 'menu'))
      switch (e) {
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
          uy(this);
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
  bindKeys() {
    let e = this.game.ui;
    if (((this.uiKeys = !!e.keys?.set), this.uiKeys)) {
      let t = { c: 'stealth', b: 'search', r: 'rest', x: 'run', g: 'select_all' };
      for (let [a, n] of Object.entries(t)) e.keys.set(a, () => this.action(n));
      (e.keys.set('p', () => !this.isBusy() && e.open('grupo', { who: this.leader })),
        e.keys.set('s', null),
        e.keys.set('q', null),
        (this._uiKeys = [...Object.keys(t), 'p', 's', 'q']));
    }
    ((this._key = (t) => {
      if (
        (t.target && /INPUT|TEXTAREA|SELECT/.test(t.target.tagName)) ||
        t.repeat ||
        t.defaultPrevented ||
        this.inBattle ||
        this.disposed
      )
        return;
      let a = t.key.toLowerCase();
      if ((t.ctrlKey || t.metaKey) && a === 'a') {
        (t.preventDefault(), this.selectAll());
        return;
      }
      if (!(t.ctrlKey || t.metaKey || t.altKey)) {
        if (!this.uiKeys) {
          let n = {
            i: 'inventory',
            c: 'stealth',
            b: 'search',
            x: 'run',
            r: 'rest',
            j: 'journal',
            g: 'select_all',
            escape: 'menu',
          };
          if (n[a]) {
            this.action(n[a]);
            return;
          }
        }
        if (a === 'tab') {
          t.preventDefault();
          let n = this.members.findIndex((i) => i.id === this.leader),
            s = this.members[(n + 1) % this.members.length];
          s && this.setLeader(s.id);
          return;
        }
        if (a === 'f' || a === ' ') {
          let n = this.lead();
          n && (t.preventDefault(), this.camera.focus(n.actor.root.position), (this.camera.following = !0));
          return;
        }
        if (/^[1-6]$/.test(a)) {
          let n = this.members[Number(a) - 1];
          n && this.setLeader(n.id, { additive: t.shiftKey });
        }
      }
    }),
      addEventListener('keydown', this._key));
  }
  pick(e, t) {
    let a = this.game.stage.camera,
      n = innerWidth,
      s = innerHeight,
      i = this.v,
      r = null,
      l = innerWidth < 700 ? 46 : 38,
      c = (_, b) => (
        i.copy(_).project(a),
        i.z > 1 ? 1 / 0 : Math.hypot((i.x * 0.5 + 0.5) * n - e, (-i.y * 0.5 + 0.5) * s - t) * b
      ),
      d = (_, b, f, v) => {
        if (!_?.root.visible) return;
        let x = _.root.position,
          g = _.height || 1.7;
        for (let y of [0.15, 0.5, 0.85]) {
          let w = c(new Vector3(x.x, x.y + g * y, x.z), 1);
          w < l && ((l = w), (r = { kind: b, id: f, cell: v, actor: _ }));
        }
      };
    for (let _ of this.npcs.values()) d(_.actor, 'npc', _.def.id, _.cell);
    for (let _ of this.groups.values())
      for (let b of _.enemies) !b.dead && !_.hidden && d(b.actor, 'enemy', b.id, b.cell);
    for (let _ of this.members) d(_.actor, 'member', _.id, _.cell);
    for (let [_, b] of this.objects) {
      if (!this.objectVisible(b) || !b.cell) continue;
      let f = this.anchorOf(_);
      if (!f && b.type !== 'trap') continue;
      let v = f ? f.getWorldPosition(new Vector3()) : this.world.cellToWorld(b.cell, new Vector3());
      v.y += b.type === 'sign' || b.type === 'board' ? 1 : 0.4;
      let x = c(v, 0.9);
      x < l && ((l = x), (r = { kind: 'object', id: _, cell: b.cell }));
    }
    if (r) return r;
    let u = new Vector2((e / n) * 2 - 1, -(t / s) * 2 + 1);
    this.ray.setFromCamera(u, a);
    let h = this.world.pick(this.ray);
    if (!h) return null;
    let p = h.cell;
    for (let [_, b] of this.objects)
      if (!(!this.objectVisible(b) || !b.cell)) {
        if (b.cell[0] === p[0] && b.cell[1] === p[1]) return { kind: 'object', id: _, cell: b.cell };
        if (b.type === 'door' && b.target && hexDistance(b.target, p) <= (b.foot ?? 2))
          return { kind: 'object', id: _, cell: b.cell };
      }
    let m = this.exitAt(p);
    return m ? { kind: 'exit', id: m.id, cell: p, exit: m } : { kind: 'ground', cell: p, point: h.point };
  }
  onTap(e, t, a = {}) {
    if (this.isBusy()) return;
    this.game.audio?.unlock?.();
    let n = this.pick(e, t);
    if (
      (this.trace(
        `clic ${Math.round(e)},${Math.round(t)} -> ${n ? `${n.kind} ${n.id || ''} ${n.cell}` : 'nada'}`,
      ),
      !!n)
    )
      switch (n.kind) {
        case 'member': {
          let s = performance.now(),
            i = this._lastMemberTap;
          if (
            ((this._lastMemberTap = { id: n.id, t: s }), i?.id === n.id && s - i.t < 450 && n.id !== 'hero')
          ) {
            ((this._lastMemberTap = null), Yk(this, n.id));
            break;
          }
          this.setLeader(n.id, { additive: a.shift || a.ctrl });
          break;
        }
        case 'npc':
          m0(this, n.id);
          break;
        case 'enemy':
          Uk(this, n.id);
          break;
        case 'object':
          Xk(this, n.id);
          break;
        case 'exit':
          this.goExit(n.exit, n.cell);
          break;
        case 'ground': {
          let s = n.cell;
          if (!this.xmap.walkable(s)) {
            let i = this.xmap.freeNear(s, 1, this.blocked(), { maxR: 2 })[0];
            if (!i) {
              (this.marks.destination(s, !1), this.game.bus.emit('ui:error', {}));
              return;
            }
            this.moveTo(i);
            return;
          }
          this.moveTo(s);
          break;
        }
        default:
          break;
      }
  }
  async moveTo(e) {
    (await this.moveParty(e)) === !1 &&
      !this.lead()?.moving &&
      (this.xmap.path(this.lead().cell, e, this.blocked()).length ||
        (this.marks.destination(e, !1), this.game.bus.emit('ui:error', {})));
  }
  async goExit(e, t) {
    if (!this.flag(e.requires) || !e.to) {
      (this.toast(e.blocked || 'Por aqu\xED no se puede ir.', 'apagado', 5e3), this.moveParty(t));
      return;
    }
    (await this.moveParty(t)) && this.useExit(e);
  }
  useExit(e) {
    let t = e.to || '';
    if (t === 'travel') this.travel('travel', e.id && this.level.spawns?.[e.id] ? e.id : 'saved');
    else if (t.startsWith('level:')) {
      let [, a, n] = t.split(':');
      this.travel(a, n || 'default');
    }
  }
  onLongPress(e, t) {
    if (this.isBusy()) return;
    let a = this.pick(e, t);
    if (a) {
      if (a.kind === 'member') this.openScreen('inventario', { who: a.id });
      else if (a.kind === 'enemy') {
        let n = this.enemy(a.id),
          s = this.rules.monster(n.monster);
        this.toast(`${n.name}${s.ac ? ` \xB7 CA ${s.ac}` : ''}${s.hp ? ` \xB7 ${s.hp} PG` : ''}`, 'mal');
      } else if (a.kind === 'npc') {
        let n = this.npcs.get(a.id);
        this.toast(`${n.def.name}${n.def.title ? `, ${n.def.title.toLowerCase()}` : ''}`, 'apagado');
      }
    }
  }
  updateHover(e) {
    if (((this.hoverT -= e), this.hoverT > 0)) return;
    this.hoverT = 0.066;
    let t = this.game.stage.renderer.domElement;
    if (!this.mouse || this.isBusy()) {
      (this.overlay.setLabel(null), this.marks.setHover(null), (t.style.cursor = ''));
      return;
    }
    let a = this.pick(this.mouse.x, this.mouse.y),
      n = a ? Zk(this, a) : null;
    if (!n) {
      (this.overlay.setLabel(null),
        this.marks.setHover(null),
        (t.style.cursor = a?.kind === 'ground' && !this.xmap.walkable(a.cell) ? 'not-allowed' : ''));
      return;
    }
    ((t.style.cursor = a.kind === 'enemy' ? 'crosshair' : 'pointer'),
      this.overlay.setLabel(n.anchor, n.title, n.sub, n.bad),
      this.marks.setHover(n.ring ? { kind: n.ringKind || a.kind, pos: n.ring, size: n.size || 1 } : null));
  }
  update(e, t) {
    if (!this.disposed) {
      (this.inBattle && this.game.battle?.update?.(e, t),
        (e *= this.turbo),
        this.inBattle || this.moveMembers(e));
      for (let a of this.members) a.actor.update(e);
      this.updateNpcs(e);
      for (let a of this.groups.values()) for (let n of a.enemies) n.actor?.update(e);
      if (
        (this.animals?.update(e),
        this.camera.update(e),
        this.world.update?.(e, t, this.game.stage.camera),
        this.marks.update(e),
        !this.inBattle)
      ) {
        if (((this.detectT += e), this.detectT >= e5)) {
          ((this.detectT = 0), this.isBusy() || detect(this));
          for (let a of this.groups.values()) a.cooldown = Math.max(0, a.cooldown - e5);
        }
        (this.banter?.update(e), this.updateHover(e));
      }
      if (
        ((this.lodT = (this.lodT || 0) + e),
        this.lodT > 0.5 && ((this.lodT = 0), this.updateLod()),
        (this.occT += e),
        this.occT > 0.12 && this.world.fadeOccluders)
      ) {
        this.occT = 0;
        let a = [],
          n = this.inBattle
            ? [
                ...this.members.map((s) => s.actor),
                ...[...this.groups.values()].flatMap((s) =>
                  s.enemies.filter((i) => !i.dead && i.actor).map((i) => i.actor),
                ),
              ]
            : this.members.map((s) => s.actor);
        for (let s of n) a.push(s.root.position.clone().add(new Vector3(0, 0.9, 0)));
        (this.inBattle || a.push(this.game.stage.controls.target.clone()),
          this.world.fadeOccluders(this.game.stage.camera, a));
      }
    }
  }
  updateLod() {
    let e = this.game.stage.camera.position,
      t = (this.game.quality?.level ?? 1) === 0,
      a = (n) => {
        let s = n?.ch;
        if (!s?.setLod) return;
        let i = n.root.position.distanceTo(e),
          r = this.inBattle ? 0 : i > 34 ? 2 : i > (t ? 16 : 22) ? 1 : 0;
        s.lod !== r && s.setLod(r);
      };
    for (let n of this.npcs.values()) a(n.actor);
    for (let n of this.groups.values()) for (let s of n.enemies) s.actor && a(s.actor);
    for (let n of this.animals?.list || []) a(n.actor);
  }
  travel(e, t = 'default') {
    if (this.leaving) return;
    let a = this.game;
    if (e === 'travel') {
      if (!a.scenes.registry.has('travel')) {
        this.toast('El mapa de viaje todav\xEDa no est\xE1 listo.', 'apagado');
        return;
      }
      ((this.leaving = !0),
        this.saveCell(),
        (a.store.cp.location = {
          ...a.store.cp.location,
          level: this.levelId,
          spawn: t === 'default' ? 'saved' : t,
        }),
        a.store.save('auto'),
        a.go('travel', {
          from: this.levelId,
          back: { level: this.levelId, spawn: a.store.cp.location.spawn },
        }));
      return;
    }
    ((this.leaving = !0),
      (a.store.cp.location = { level: e, spawn: t, name: '' }),
      a.go('explore', { level: e, spawn: t }));
  }
  api() {
    let e = this;
    return {
      get level() {
        return e.level;
      },
      levelId: e.levelId,
      get world() {
        return e.world;
      },
      get inBattle() {
        return e.inBattle;
      },
      get isBusy() {
        return e.isBusy();
      },
      startBattle: (t, a = {}) => Uo(e, t, a),
      removeGroup: (t, a = {}) => Gk(e, t, a),
      addCompanion: async () => {
        await e.rebuildParty();
      },
      removeCompanion: async (t) => {
        let a = e.member(t);
        if (a) {
          let n = e.xmap.freeNear(a.cell, 12, e.blocked(!0)).pop();
          n && ((a.path = e.xmap.path(a.cell, n, e.blocked()).slice(1)), await v0(1600));
        }
        await e.rebuildParty();
      },
      spawnNpc: async (t) => (
        (e.ls.spawned[t.id] = t),
        (e.ls.npcGone = e.ls.npcGone.filter((a) => a !== t.id)),
        !!(await e.addNpc(t))
      ),
      removeNpc: async (t, { walkTo: a = null } = {}) => {
        (e.npcs.get(t) && a && (await e.api().moveNpc(t, a)),
          e.ls.npcGone.includes(t) || e.ls.npcGone.push(t),
          delete e.ls.spawned[t],
          e.removeNpcNow(t));
      },
      moveNpc: (t, a, { speed: n = 1.6, run: s = !1 } = {}) =>
        new Promise((i) => {
          let r = e.npcs.get(t);
          if (!r) return i(!1);
          let l = e.blocked(!0);
          l.delete(cellKey(r.cell[0], r.cell[1]));
          let c = e.xmap.path(r.cell, a, l);
          if (c.length < 2) {
            c.length === 1 ? i(!0) : i(!1);
            return;
          }
          ((r.path = c.slice(1)),
            (r.speed = s ? 3.8 : n),
            r.actor.anim(s ? 'run' : 'walk', { mps: r.speed }),
            (r.onArrive = () => {
              ((e.ls.npcCells[t] = a.slice()), (r.home = r.yaw), i(!0));
            }));
        }),
      setObjectState: (t, a) => {
        e.ls.states[t] = a;
        let n = e.objects.get(t);
        (n?.type === 'door' &&
          n.cell &&
          !n.target &&
          a === 'open' &&
          e.xmap.setTile(n.cell, n.open_tile || '.'),
          a === 'revealed' && !e.ls.found.includes(t) && e.ls.found.push(t),
          e.world.setObjectState?.(t, a),
          e.game.bus.emit('object:state', { id: t, object: n || null, state: a }),
          e.refreshObject(t));
      },
      objectState: (t) => e.ls.states[t] || null,
      focus: (t, a, n) => e.camera.focus(e.world.cellToWorld(t), a, n),
      moveParty: (t, a) => e.moveParty(t, a),
      travel: (t, a) => e.travel(t, a),
      refresh: () => e.refreshWorld(),
      busy: (t) => {
        (t ? (e.busyN++, e.stopAll()) : (e.busyN = Math.max(0, e.busyN - 1)), e.busySignal());
      },
      say: (t, a, n) => e.say(t, a, n),
      narrate: (t, a) => e.narrate(t, a),
      actor: (t) => e.member(t)?.actor || e.npcs.get(t)?.actor || e.enemy(t)?.actor || null,
      face: (t, a) => e.faceTo(t, a),
      anim: (t, a, { once: n = !1, hold: s = !1 } = {}) => {
        let i = e.api().actor(t);
        return i ? (n ? i.once(a, { hold: s }) : (i.anim(a), Promise.resolve())) : Promise.resolve();
      },
      reveal: (t) => Xu(e, t, e.leader, ''),
      members: () => e.members.map((t) => t.id),
      leader: () => e.leader,
      cell: (t) => (e.member(t) || e.npcs.get(t) || e.enemy(t))?.cell?.slice() || null,
      toast: (t, a) => e.toast(t, a),
      hint: (t) => e.hint(t),
      flash: (t, a) => e.hud?.banner?.(t, a),
    };
  }
  say(e, t, { dur: a, duration: n } = {}) {
    a == null && n != null && (a = n / 1e3);
    let s = this.member(e)?.actor || this.npcs.get(e)?.actor || this.enemy(e)?.actor;
    if (!s) return Promise.resolve();
    let i = this.member(e)
      ? this.rules.shortName(e)
      : this.npcs.get(e)?.def.name || this.enemy(e)?.name || '';
    return this.overlay.bubble((r) => s.head(r).add(new Vector3(0, 0.32, 0)), i, t, { dur: a });
  }
  faceTo(e, t) {
    let a = Array.isArray(t)
      ? this.world.cellToWorld(t)
      : (this.member(t) || this.npcs.get(t) || this.enemy(t))?.actor?.root.position;
    if (!a) return;
    let n = this.npcs.get(e);
    if (n) {
      ((n.lookAt = a.clone()), (n.talkT = 12));
      return;
    }
    let s = this.member(e)?.actor || this.enemy(e)?.actor;
    s && (s.root.rotation.y = Math.atan2(a.x - s.root.position.x, a.z - s.root.position.z));
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = !0;
    let e = this.game;
    (this.saveCell(), e.bus.emit('level:leave', { level: this.levelId }));
    for (let t of this.offs) t();
    removeEventListener('keydown', this._key);
    for (let t of this._uiKeys || []) e.ui.keys?.reset?.(t);
    (clearTimeout(this._hudT),
      this.camera?.dispose(),
      this.overlay?.dispose(),
      this.hud?.dispose?.(),
      this.marks?.dispose(),
      this.animals?.dispose());
    for (let t of this.members) t.actor.dispose();
    for (let t of this.npcs.values()) t.actor.dispose();
    for (let t of this.groups.values()) for (let a of t.enemies) a.actor?.dispose();
    for (let t of this.corpses || []) t.actor?.dispose();
    (this.world?.dispose?.(),
      (e.stage.renderer.domElement.style.cursor = ''),
      e.explore && e.explore.levelId === this.levelId && (e.explore = null));
  }
};

export { neighbors } from './hex.js';
export { Explore, SPEED, createExplore };
