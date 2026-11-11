// vfx/zones.js
// Efectos persistentes del combate: zonas de conjuro sobre casillas (rayo de luna, telaraña,
// enmarañar, púas, niebla, oscuridad, grasa…) y fichas invocadas que se mueven y golpean (esfera
// llameante y arma espiritual). `ZoneEffects` las gestiona por id; lo crea vfx/index.js (createVfx)
// y lo manejan las órdenes zone/zoneOff/token… que llegan del controlador de combate.
// Reconstruido de publicado/juego.js (módulo __esm «qS»).

import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { FRAME } from './atlas.js';
import { LightPillar, HexWave } from './shaders.js';

/** Malla de la espada espectral (arma espiritual): hoja, punta, guarda y empuñadura aditivas. */
function buildSpectralWeapon() {
  let group = new Group(),
    material = new MeshBasicMaterial({
      color: new Color(10469631).multiplyScalar(2.2),
      transparent: !0,
      opacity: 0.75,
      blending: AdditiveBlending,
      depthWrite: !1,
    }),
    blade = new Mesh(new BoxGeometry(0.09, 0.95, 0.025), material);
  blade.position.y = 0.12;
  let tip = new Mesh(new ConeGeometry(0.064, 0.18, 4), material);
  ((tip.position.y = 0.68), (tip.rotation.y = Math.PI / 4));
  let guard = new Mesh(new BoxGeometry(0.36, 0.06, 0.06), material);
  guard.position.y = -0.36;
  let grip = new Mesh(new CylinderGeometry(0.025, 0.025, 0.22, 6), material);
  return ((grip.position.y = -0.5), group.add(blade, tip, guard, grip), group.scale.setScalar(1.45), group);
}
/** Malla de la esfera llameante: núcleo y halo (`userData.shell`, que late). */
function buildFlamingSphere() {
  let group = new Group(),
    core = new Mesh(
      new SphereGeometry(0.38, 20, 14),
      new MeshBasicMaterial({ color: new Color(16747050).multiplyScalar(2.4) }),
    ),
    shell = new Mesh(
      new SphereGeometry(0.5, 20, 14),
      new MeshBasicMaterial({
        color: new Color(16734736).multiplyScalar(1.6),
        transparent: !0,
        opacity: 0.35,
        blending: AdditiveBlending,
        depthWrite: !1,
      }),
    );
  return (group.add(core, shell), (group.userData.shell = shell), group);
}
/** Número al azar en [min, max). */
const randRange = (min, max) => min + Math.random() * (max - min);
// Aspecto de cada zona: color y mezcla de las casillas, columna de luz, motas que suben y «pins»
// (partículas fijas repartidas por casilla: `per` por casilla, `sway` se mecen, `drift` derivan).
const ZONE_STYLES = {
  moonbeam: {
    col: 11585791,
    blend: 'add',
    alpha: 0.22,
    pillar: !0,
    motes: { col: 15397631, frame: FRAME.star, rate: 10 },
  },
  web: {
    col: 15262936,
    blend: 'alpha',
    alpha: 0.25,
    pins: [
      { frame: FRAME.web, col: 16052970, a: 0.7, size: [1.1, 1.6], y: [0.05, 0.12], per: 1 },
      { frame: FRAME.web, col: 16052970, a: 0.45, size: [0.8, 1.2], y: [0.7, 1.4], per: 0.5 },
    ],
  },
  entangle: {
    col: 4160034,
    blend: 'alpha',
    alpha: 0.45,
    pins: [
      { frame: FRAME.leaf, col: 6274874, a: 0.95, size: [0.25, 0.4], y: [0.05, 0.5], per: 3, sway: 1 },
      { frame: FRAME.thorn, col: 3824152, a: 1, size: [0.2, 0.35], y: [0.1, 0.4], per: 1.5, sway: 1 },
    ],
  },
  spike: {
    col: 5917216,
    blend: 'alpha',
    alpha: 0.4,
    pins: [{ frame: FRAME.thorn, col: 8020016, a: 1, size: [0.18, 0.3], y: [0.08, 0.16], per: 4 }],
  },
  fog: {
    col: 13160664,
    blend: 'alpha',
    alpha: 0.2,
    pins: [
      { frame: FRAME.cloud, col: 14541544, a: 0.55, size: [2.2, 3.2], y: [0.5, 1.6], per: 0.8, drift: 1 },
    ],
  },
  darkness: {
    col: 656912,
    blend: 'alpha',
    alpha: 0.7,
    pins: [
      { frame: FRAME.cloud, col: 525580, a: 0.9, size: [2.4, 3.4], y: [0.4, 2.2], per: 1.1, drift: 0.5 },
    ],
  },
  grease: {
    col: 2760720,
    blend: 'alpha',
    alpha: 0.65,
    pins: [{ frame: FRAME.drop, col: 5917216, a: 0.8, size: [0.5, 0.8], y: [0.04, 0.06], per: 1, flat: !0 }],
  },
  entangled: null,
};
/** Una zona activa: casillas encendidas (HexWave mantenida), columna opcional y partículas fijas. */
const Zone = class {
  constructor(vfx, id, kind, cells, color) {
    ((this.vfx = vfx), (this.id = id), (this.kind = kind), (this.t = 0));
    let def = ZONE_STYLES[kind] || {
      col: color ? new Color(color).getHex() : 11832575,
      blend: 'add',
      alpha: 0.5,
    };
    if (
      ((this.def = def),
      (this.cells = cells),
      (this.pts = cells.map((cell) => vfx.cellToWorld(cell))),
      (this.center = this.pts
        .reduce((sum, p) => sum.add(p), new Vector3())
        .divideScalar(Math.max(1, this.pts.length))),
      (this.hex = vfx.piece(
        new HexWave(cells, vfx.cellToWorld, {
          color: def.col,
          life: 0,
          hold: !0,
          alpha: def.alpha,
          blend: def.blend,
          pulse: 1,
          spread: 0.4,
          glow: def.blend === 'add' ? 1.3 : 1,
        }),
      )),
      (this.hex.keep = !0),
      (this.pillar = null),
      def.pillar)
    ) {
      let radius = 0.8;
      for (let p of this.pts)
        radius = Math.max(radius, Math.hypot(p.x - this.center.x, p.z - this.center.z) + 0.7);
      ((this.pillar = vfx.piece(
        new LightPillar(this.center, {
          color: def.col,
          radius,
          height: 10,
          life: 0,
          alpha: 0.38,
          glow: 1.1,
        }),
      )),
        (this.pillar.keep = !0));
    }
    this.pins = [];
    for (let pinDef of def.pins || []) {
      let pool = vfx.alp;
      for (let p of this.pts) {
        let remaining = pinDef.per;
        for (; remaining > 0 && !(remaining < 1 && Math.random() > remaining);) {
          remaining -= 1;
          let pos = [
              p.x + randRange(-0.5, 0.5),
              p.y + randRange(pinDef.y[0], pinDef.y[1]),
              p.z + randRange(-0.5, 0.5),
            ],
            index = pool.spawn({
              p: pos,
              life: 1,
              pinned: !0,
              size: randRange(pinDef.size[0], pinDef.size[1]),
              col: pinDef.col,
              a: pinDef.a,
              a1: pinDef.a,
              frame: pinDef.frame,
              rot: Math.random() * 6.28,
            });
          index >= 0 && this.pins.push({ i: index, base: pos, pin: pinDef, ph: Math.random() * 6.28, pool });
        }
      }
    }
    this.acc = 0;
  }
  update(dt) {
    this.t += dt;
    for (let pin of this.pins)
      pin.pin.sway
        ? pin.pool.place(
            pin.i,
            pin.base[0] + Math.sin(this.t * 1.4 + pin.ph) * 0.04,
            pin.base[1],
            pin.base[2] + Math.cos(this.t * 1.1 + pin.ph) * 0.04,
          )
        : pin.pin.drift &&
          pin.pool.place(
            pin.i,
            pin.base[0] + Math.sin(this.t * 0.3 * pin.pin.drift + pin.ph) * 0.35,
            pin.base[1] + Math.sin(this.t * 0.5 + pin.ph) * 0.1,
            pin.base[2] + Math.cos(this.t * 0.25 * pin.pin.drift + pin.ph) * 0.35,
          );
    let motes = this.def.motes;
    if (motes)
      for (this.acc += dt * motes.rate * this.vfx.quality; this.acc >= 1;) {
        this.acc -= 1;
        let p = this.pts[Math.floor(Math.random() * this.pts.length)];
        this.vfx.p({
          p: [p.x + randRange(-0.6, 0.6), p.y + randRange(0, 0.5), p.z + randRange(-0.6, 0.6)],
          v: [0, randRange(0.6, 1.4), 0],
          life: 1.6,
          size: 0.08,
          size1: 0.02,
          col: motes.col,
          frame: motes.frame,
          glow: 1.8,
          spin: 2,
        });
      }
  }
  /** Retira la zona; con `fade` se apaga poco a poco, si no desaparece al momento. */
  dispose(fade = !0) {
    for (let pin of this.pins) pin.pool.kill(pin.i);
    ((this.pins = []),
      fade
        ? ((this.hex.keep = !1),
          this.hex.release(0.6),
          this.pillar && ((this.pillar.keep = !1), (this.pillar.life = 0.5), (this.pillar.t = 0.25)))
        : (this.vfx.remove(this.hex), this.pillar && this.vfx.remove(this.pillar)));
  }
};
/** Ficha invocada (esfera llameante o arma espiritual) que flota sobre su casilla y deja estela. */
const SummonToken = class {
  constructor(vfx, id, kind, pos) {
    ((this.vfx = vfx),
      (this.id = id),
      (this.kind = kind),
      (this.mesh = kind === 'flaming_sphere' ? buildFlamingSphere() : buildSpectralWeapon()),
      (this.base = pos.clone()),
      (this.hover = kind === 'flaming_sphere' ? 0.5 : 1.1),
      this.mesh.position.copy(pos).setY(pos.y + this.hover),
      (this.t = Math.random() * 5),
      (this.anim = null),
      vfx.root.add(this.mesh));
    let color = kind === 'flaming_sphere' ? 16742954 : 10469631;
    ((this.light = vfx.light(
      this.mesh.position,
      color,
      kind === 'flaming_sphere' ? 6 : 3,
      5,
      0,
      () => this.mesh.position,
    )),
      vfx.burst(this.mesh.position, {
        n: 24,
        col: color,
        speed: 2,
        life: 0.6,
        size: 0.1,
        frame: kind === 'flaming_sphere' ? FRAME.flame : FRAME.star,
        glow: 2,
      }),
      vfx.fx('summon', { token: kind, at: pos }));
  }
  /** Desplaza la ficha en arco hasta `target`; la promesa se resuelve al llegar. */
  moveTo(target, duration = 0.4) {
    return new Promise((resolve) => {
      let from = this.base.clone();
      this.anim = { t: 0, dur: duration, from, to: target.clone(), res: resolve };
    });
  }
  /** Embiste hacia `target` y vuelve; la promesa se resuelve en el momento del impacto. */
  strike(target) {
    return new Promise((resolve) => {
      let from = this.mesh.position.clone();
      this.anim = { t: 0, dur: 0.32, strike: !0, from, to: target.clone(), res: resolve, hit: !1 };
    });
  }
  update(dt) {
    this.t += dt;
    let vfx = this.vfx,
      anim = this.anim;
    if (anim) {
      anim.t += dt;
      let progress = Math.min(1, anim.t / anim.dur);
      if (anim.strike) {
        let reach = progress < 0.45 ? progress / 0.45 : 1 - (progress - 0.45) / 0.55;
        (this.mesh.position.copy(anim.from).lerp(anim.to, reach * 0.85),
          progress >= 0.45 && !anim.hit && ((anim.hit = !0), anim.res()),
          this.kind !== 'flaming_sphere' && (this.mesh.rotation.x = -reach * 1.4));
      } else
        (this.base.copy(anim.from).lerp(anim.to, progress),
          this.mesh.position.set(
            this.base.x,
            this.base.y + this.hover + Math.sin(progress * Math.PI) * 0.5,
            this.base.z,
          ));
      progress >= 1 && ((this.anim = null), anim.strike || anim.res(), (this.mesh.rotation.x = 0));
    } else
      this.mesh.position.set(
        this.base.x,
        this.base.y + this.hover + Math.sin(this.t * 2) * 0.08,
        this.base.z,
      );
    if (this.kind === 'flaming_sphere') {
      let pulse = 1 + Math.sin(this.t * 9) * 0.05;
      this.mesh.userData.shell.scale.setScalar(pulse);
      let count = Math.max(1, Math.round(40 * dt * vfx.quality));
      for (let i = 0; i < count; i++) {
        let offset = new Vector3(randRange(-0.35, 0.35), randRange(-0.2, 0.3), randRange(-0.35, 0.35));
        vfx.p({
          p: this.mesh.position.clone().add(offset),
          v: [0, randRange(1, 2), 0],
          life: 0.45,
          size: 0.28,
          size1: 0.06,
          col: 16765562,
          col1: 16726536,
          frame: FRAME.flame,
          glow: 1.8,
        });
      }
    } else
      ((this.mesh.rotation.y += dt * 1.5),
        Math.random() < dt * 8 &&
          vfx.p({
            p: this.mesh.position
              .clone()
              .add(new Vector3(randRange(-0.1, 0.1), randRange(-0.4, 0.6), randRange(-0.1, 0.1))),
            v: [0, 0.3, 0],
            life: 0.7,
            size: 0.06,
            col: 13623551,
            frame: FRAME.star,
            glow: 2,
          }));
  }
  dispose() {
    (this.vfx.burst(this.mesh.position, {
      n: 16,
      col: this.kind === 'flaming_sphere' ? 16742954 : 13623551,
      speed: 1.6,
      life: 0.6,
      size: 0.08,
      frame: FRAME.star,
      glow: 2,
    }),
      this.vfx.root.remove(this.mesh),
      this.mesh.traverse((obj) => {
        obj.isMesh && (obj.geometry.dispose(), obj.material.dispose());
      }),
      this.light && this.vfx.lights.release(this.light, 0.2));
  }
};
/** Gestor de zonas y fichas invocadas del combate, por id. */
const ZoneEffects = class {
  constructor(vfx) {
    ((this.vfx = vfx), (this.zones = new Map()), (this.tokens = new Map()));
  }
  /** Crea (o sustituye) la zona `id` de tipo `kind` sobre `cells`. */
  zone(id, kind, cells, color) {
    (this.zones.has(id) && this.zones.get(id).dispose(!1),
      this.zones.set(id, new Zone(this.vfx, id, kind, cells || [], color)),
      this.vfx.fx('zone_on', { zone: kind, at: this.zones.get(id).center }));
  }
  zoneOff(id) {
    let zone = this.zones.get(id);
    zone &&
      (zone.dispose(!0),
      this.zones.delete(id),
      this.vfx.fx('zone_off', { zone: zone.kind, at: zone.center }));
  }
  /** Crea (o sustituye) la ficha invocada `id` en `pos`. */
  token(id, kind, pos) {
    (this.tokens.has(id) && this.tokens.get(id).dispose(),
      this.tokens.set(id, new SummonToken(this.vfx, id, kind, pos)));
  }
  tokenMove(id, to) {
    let token = this.tokens.get(id);
    return token ? token.moveTo(to) : Promise.resolve();
  }
  tokenStrike(id, target) {
    let token = this.tokens.get(id);
    return token ? token.strike(target) : Promise.resolve();
  }
  tokenOff(id) {
    let token = this.tokens.get(id);
    token && (token.dispose(), this.tokens.delete(id));
  }
  count() {
    return this.zones.size + this.tokens.size;
  }
  update(dt) {
    for (let zone of this.zones.values()) zone.update(dt);
    for (let token of this.tokens.values()) token.update(dt);
  }
  dispose() {
    for (let zone of this.zones.values()) zone.dispose(!1);
    for (let token of this.tokens.values()) token.dispose();
    (this.zones.clear(), this.tokens.clear());
  }
};

export { ZoneEffects };
