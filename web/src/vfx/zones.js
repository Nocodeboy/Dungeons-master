// vfx/zones.js
// Reconstruido de publicado/juego.js (módulo __esm «qS»). Nombres locales aún minificados.

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

function JI() {
  let o = new Group(),
    e = new MeshBasicMaterial({
      color: new Color(10469631).multiplyScalar(2.2),
      transparent: !0,
      opacity: 0.75,
      blending: AdditiveBlending,
      depthWrite: !1,
    }),
    t = new Mesh(new BoxGeometry(0.09, 0.95, 0.025), e);
  t.position.y = 0.12;
  let a = new Mesh(new ConeGeometry(0.064, 0.18, 4), e);
  ((a.position.y = 0.68), (a.rotation.y = Math.PI / 4));
  let n = new Mesh(new BoxGeometry(0.36, 0.06, 0.06), e);
  n.position.y = -0.36;
  let s = new Mesh(new CylinderGeometry(0.025, 0.025, 0.22, 6), e);
  return ((s.position.y = -0.5), o.add(t, a, n, s), o.scale.setScalar(1.45), o);
}
function ZI() {
  let o = new Group(),
    e = new Mesh(
      new SphereGeometry(0.38, 20, 14),
      new MeshBasicMaterial({ color: new Color(16747050).multiplyScalar(2.4) }),
    ),
    t = new Mesh(
      new SphereGeometry(0.5, 20, 14),
      new MeshBasicMaterial({
        color: new Color(16734736).multiplyScalar(1.6),
        transparent: !0,
        opacity: 0.35,
        blending: AdditiveBlending,
        depthWrite: !1,
      }),
    );
  return (o.add(e, t), (o.userData.shell = t), o);
}
const In = (o, e) => o + Math.random() * (e - o);
const KI = {
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
const l1 = class {
  constructor(e, t, a, n, s) {
    ((this.vfx = e), (this.id = t), (this.kind = a), (this.t = 0));
    let i = KI[a] || { col: s ? new Color(s).getHex() : 11832575, blend: 'add', alpha: 0.5 };
    if (
      ((this.def = i),
      (this.cells = n),
      (this.pts = n.map((r) => e.cellToWorld(r))),
      (this.center = this.pts
        .reduce((r, l) => r.add(l), new Vector3())
        .divideScalar(Math.max(1, this.pts.length))),
      (this.hex = e.piece(
        new HexWave(n, e.cellToWorld, {
          color: i.col,
          life: 0,
          hold: !0,
          alpha: i.alpha,
          blend: i.blend,
          pulse: 1,
          spread: 0.4,
          glow: i.blend === 'add' ? 1.3 : 1,
        }),
      )),
      (this.hex.keep = !0),
      (this.pillar = null),
      i.pillar)
    ) {
      let r = 0.8;
      for (let l of this.pts) r = Math.max(r, Math.hypot(l.x - this.center.x, l.z - this.center.z) + 0.7);
      ((this.pillar = e.piece(
        new LightPillar(this.center, {
          color: i.col,
          radius: r,
          height: 10,
          life: 0,
          alpha: 0.38,
          glow: 1.1,
        }),
      )),
        (this.pillar.keep = !0));
    }
    this.pins = [];
    for (let r of i.pins || []) {
      let l = e.alp;
      for (let c of this.pts) {
        let d = r.per;
        for (; d > 0 && !(d < 1 && Math.random() > d);) {
          d -= 1;
          let u = [c.x + In(-0.5, 0.5), c.y + In(r.y[0], r.y[1]), c.z + In(-0.5, 0.5)],
            h = l.spawn({
              p: u,
              life: 1,
              pinned: !0,
              size: In(r.size[0], r.size[1]),
              col: r.col,
              a: r.a,
              a1: r.a,
              frame: r.frame,
              rot: Math.random() * 6.28,
            });
          h >= 0 && this.pins.push({ i: h, base: u, pin: r, ph: Math.random() * 6.28, pool: l });
        }
      }
    }
    this.acc = 0;
  }
  update(e) {
    this.t += e;
    for (let a of this.pins)
      a.pin.sway
        ? a.pool.place(
            a.i,
            a.base[0] + Math.sin(this.t * 1.4 + a.ph) * 0.04,
            a.base[1],
            a.base[2] + Math.cos(this.t * 1.1 + a.ph) * 0.04,
          )
        : a.pin.drift &&
          a.pool.place(
            a.i,
            a.base[0] + Math.sin(this.t * 0.3 * a.pin.drift + a.ph) * 0.35,
            a.base[1] + Math.sin(this.t * 0.5 + a.ph) * 0.1,
            a.base[2] + Math.cos(this.t * 0.25 * a.pin.drift + a.ph) * 0.35,
          );
    let t = this.def.motes;
    if (t)
      for (this.acc += e * t.rate * this.vfx.quality; this.acc >= 1;) {
        this.acc -= 1;
        let a = this.pts[Math.floor(Math.random() * this.pts.length)];
        this.vfx.p({
          p: [a.x + In(-0.6, 0.6), a.y + In(0, 0.5), a.z + In(-0.6, 0.6)],
          v: [0, In(0.6, 1.4), 0],
          life: 1.6,
          size: 0.08,
          size1: 0.02,
          col: t.col,
          frame: t.frame,
          glow: 1.8,
          spin: 2,
        });
      }
  }
  dispose(e = !0) {
    for (let t of this.pins) t.pool.kill(t.i);
    ((this.pins = []),
      e
        ? ((this.hex.keep = !1),
          this.hex.release(0.6),
          this.pillar && ((this.pillar.keep = !1), (this.pillar.life = 0.5), (this.pillar.t = 0.25)))
        : (this.vfx.remove(this.hex), this.pillar && this.vfx.remove(this.pillar)));
  }
};
const c1 = class {
  constructor(e, t, a, n) {
    ((this.vfx = e),
      (this.id = t),
      (this.kind = a),
      (this.mesh = a === 'flaming_sphere' ? ZI() : JI()),
      (this.base = n.clone()),
      (this.hover = a === 'flaming_sphere' ? 0.5 : 1.1),
      this.mesh.position.copy(n).setY(n.y + this.hover),
      (this.t = Math.random() * 5),
      (this.anim = null),
      e.root.add(this.mesh));
    let s = a === 'flaming_sphere' ? 16742954 : 10469631;
    ((this.light = e.light(
      this.mesh.position,
      s,
      a === 'flaming_sphere' ? 6 : 3,
      5,
      0,
      () => this.mesh.position,
    )),
      e.burst(this.mesh.position, {
        n: 24,
        col: s,
        speed: 2,
        life: 0.6,
        size: 0.1,
        frame: a === 'flaming_sphere' ? FRAME.flame : FRAME.star,
        glow: 2,
      }),
      e.fx('summon', { token: a, at: n }));
  }
  moveTo(e, t = 0.4) {
    return new Promise((a) => {
      let n = this.base.clone();
      this.anim = { t: 0, dur: t, from: n, to: e.clone(), res: a };
    });
  }
  strike(e) {
    return new Promise((t) => {
      let a = this.mesh.position.clone();
      this.anim = { t: 0, dur: 0.32, strike: !0, from: a, to: e.clone(), res: t, hit: !1 };
    });
  }
  update(e) {
    this.t += e;
    let t = this.vfx,
      a = this.anim;
    if (a) {
      a.t += e;
      let n = Math.min(1, a.t / a.dur);
      if (a.strike) {
        let s = n < 0.45 ? n / 0.45 : 1 - (n - 0.45) / 0.55;
        (this.mesh.position.copy(a.from).lerp(a.to, s * 0.85),
          n >= 0.45 && !a.hit && ((a.hit = !0), a.res()),
          this.kind !== 'flaming_sphere' && (this.mesh.rotation.x = -s * 1.4));
      } else
        (this.base.copy(a.from).lerp(a.to, n),
          this.mesh.position.set(
            this.base.x,
            this.base.y + this.hover + Math.sin(n * Math.PI) * 0.5,
            this.base.z,
          ));
      n >= 1 && ((this.anim = null), a.strike || a.res(), (this.mesh.rotation.x = 0));
    } else
      this.mesh.position.set(
        this.base.x,
        this.base.y + this.hover + Math.sin(this.t * 2) * 0.08,
        this.base.z,
      );
    if (this.kind === 'flaming_sphere') {
      let n = 1 + Math.sin(this.t * 9) * 0.05;
      this.mesh.userData.shell.scale.setScalar(n);
      let s = Math.max(1, Math.round(40 * e * t.quality));
      for (let i = 0; i < s; i++) {
        let r = new Vector3(In(-0.35, 0.35), In(-0.2, 0.3), In(-0.35, 0.35));
        t.p({
          p: this.mesh.position.clone().add(r),
          v: [0, In(1, 2), 0],
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
      ((this.mesh.rotation.y += e * 1.5),
        Math.random() < e * 8 &&
          t.p({
            p: this.mesh.position.clone().add(new Vector3(In(-0.1, 0.1), In(-0.4, 0.6), In(-0.1, 0.1))),
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
      this.mesh.traverse((e) => {
        e.isMesh && (e.geometry.dispose(), e.material.dispose());
      }),
      this.light && this.vfx.lights.release(this.light, 0.2));
  }
};
const Fm = class {
  constructor(e) {
    ((this.vfx = e), (this.zones = new Map()), (this.tokens = new Map()));
  }
  zone(e, t, a, n) {
    (this.zones.has(e) && this.zones.get(e).dispose(!1),
      this.zones.set(e, new l1(this.vfx, e, t, a || [], n)),
      this.vfx.fx('zone_on', { zone: t, at: this.zones.get(e).center }));
  }
  zoneOff(e) {
    let t = this.zones.get(e);
    t && (t.dispose(!0), this.zones.delete(e), this.vfx.fx('zone_off', { zone: t.kind, at: t.center }));
  }
  token(e, t, a) {
    (this.tokens.has(e) && this.tokens.get(e).dispose(), this.tokens.set(e, new c1(this.vfx, e, t, a)));
  }
  tokenMove(e, t) {
    let a = this.tokens.get(e);
    return a ? a.moveTo(t) : Promise.resolve();
  }
  tokenStrike(e, t) {
    let a = this.tokens.get(e);
    return a ? a.strike(t) : Promise.resolve();
  }
  tokenOff(e) {
    let t = this.tokens.get(e);
    t && (t.dispose(), this.tokens.delete(e));
  }
  count() {
    return this.zones.size + this.tokens.size;
  }
  update(e) {
    for (let t of this.zones.values()) t.update(e);
    for (let t of this.tokens.values()) t.update(e);
  }
  dispose() {
    for (let e of this.zones.values()) e.dispose(!1);
    for (let e of this.tokens.values()) e.dispose();
    (this.zones.clear(), this.tokens.clear());
  }
};

export { Fm };
