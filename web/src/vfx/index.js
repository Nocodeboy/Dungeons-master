// vfx/index.js
// Reconstruido de publicado/juego.js (módulo __esm «p1»). Nombres locales aún minificados.

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

function rsphere(o = 1, e = Oa()) {
  let t, a, n;
  do ((t = Math.random() * 2 - 1), (a = Math.random() * 2 - 1), (n = Math.random() * 2 - 1));
  while (t * t + a * a + n * n > 1);
  return e.set(t * o, a * o, n * o);
}
function rcone(o, e, t = Oa()) {
  let a = o.clone().normalize(),
    n = Math.abs(a.y) < 0.95 ? Oa(0, 1, 0) : Oa(1, 0, 0),
    s = Oa().crossVectors(a, n).normalize(),
    i = Oa().crossVectors(s, a).normalize(),
    r = Math.random() * Math.PI * 2,
    l = Math.tan(e) * Math.sqrt(Math.random());
  return t
    .copy(a)
    .addScaledVector(s, Math.cos(r) * l)
    .addScaledVector(i, Math.sin(r) * l)
    .normalize();
}
function QI(o) {
  if (!d1) {
    let i = new MeshStandardMaterial({ color: 6965802, roughness: 0.8 }),
      r = new MeshStandardMaterial({ color: 10132128, metalness: 0.7, roughness: 0.35 }),
      l = new MeshStandardMaterial({ color: 15261904, side: DoubleSide, roughness: 0.9 }),
      c = new MeshStandardMaterial({ color: 13684952, metalness: 0.85, roughness: 0.25 }),
      d = new MeshStandardMaterial({ color: 3810322, roughness: 0.9 });
    d1 = { wood: i, iron: r, fletch: l, steel: c, leather: d };
  }
  let e = d1,
    t = new Group();
  if (o === 'dagger') {
    let i = new Mesh(new BoxGeometry(0.035, 0.008, 0.24), e.steel);
    i.position.z = 0.09;
    let r = new Mesh(new BoxGeometry(0.026, 0.026, 0.1), e.leather);
    r.position.z = -0.07;
    let l = new Mesh(new BoxGeometry(0.09, 0.02, 0.02), e.iron);
    return ((l.position.z = -0.02), t.add(i, r, l), t);
  }
  let a = o === 'bolt' ? 0.42 : o === 'javelin' ? 1.25 : 0.72,
    n = new Mesh(
      new CylinderGeometry(o === 'javelin' ? 0.02 : 0.011, o === 'javelin' ? 0.02 : 0.011, a, 5),
      e.wood,
    );
  n.rotation.x = Math.PI / 2;
  let s = new Mesh(
    new ConeGeometry(o === 'javelin' ? 0.04 : 0.024, o === 'javelin' ? 0.16 : 0.08, 5),
    e.iron,
  );
  if (((s.rotation.x = Math.PI / 2), (s.position.z = a / 2 + 0.03), t.add(n, s), o !== 'javelin'))
    for (let i of [0, Math.PI / 2]) {
      let r = new Mesh(new PlaneGeometry(0.05, 0.12), e.fletch);
      (r.rotation.set(Math.PI / 2, i, 0), (r.position.z = -a / 2 + 0.06), t.add(r));
    }
  return t;
}
function createVfx({
  scene: o,
  camera: e,
  quality: t = { level: 1 },
  cellToWorld: a = null,
  grade: n = null,
} = {}) {
  let s = t.level ?? 1,
    i = [0.45, 0.75, 1][s] ?? 0.75,
    r = new Group();
  ((r.name = 'vfx'), o.add(r));
  let l = new ParticleSystem(s === 0 ? 1400 : s === 1 ? 2600 : 4e3, 'add'),
    c = new ParticleSystem(s === 0 ? 500 : s === 1 ? 900 : 1400, 'alpha');
  r.add(c.mesh, l.mesh);
  let d = new u1(r, s === 0 ? 1 : s === 1 ? 2 : 4),
    u = [],
    h = [],
    p = 0,
    m = 0,
    _ = 0,
    b = 0,
    f = typeof matchMedia == 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    v = {
      root: r,
      camera: e,
      quality: i,
      level: s,
      add: l,
      alp: c,
      lights: d,
      cellToWorld: a || ((x) => Oa(x[0], 0, x[1])),
      onFx: null,
      timeScale: 1,
      setLevel(x) {
        ((i = [0.45, 0.75, 1][x] ?? i), (this.quality = i), (this.level = x));
      },
      wait(x) {
        return new Promise((g) => h.push({ at: p + x, fn: g }));
      },
      after(x, g) {
        h.push({ at: p + x, fn: g });
      },
      stream(x, g) {
        u.push({
          t: 0,
          update(y) {
            return ((this.t += y), g(y, Math.min(1, this.t / x), this.t), this.t < x);
          },
          dispose() {},
        });
      },
      fx(x, g = {}) {
        if (this.onFx)
          try {
            let y = g.at ? (g.at.isVector3 ? [g.at.x, g.at.y, g.at.z] : g.at) : void 0;
            this.onFx(x, { ...g, at: y });
          } catch (y) {
            console.error('[vfx] onFx', y);
          }
      },
      p(x) {
        return (x.blend === 'alpha' ? c : l).spawn(x);
      },
      burst(
        x,
        {
          n: g = 20,
          col: y = 16777215,
          col1: w,
          speed: k = 3,
          speedMin: T = null,
          up: E = 0,
          life: S = 0.6,
          lifeVar: z = 0.4,
          size: D = 0.12,
          size1: M,
          frame: R = FRAME.spark,
          grav: A = 0,
          drag: P = 1.5,
          stretch: I = 0,
          blend: U = 'add',
          glow: j = 1.5,
          a: X = 1,
          a1: J = 0,
          dir: Z = null,
          cone: K = 0.6,
          radius: ve = 0,
          spin: ge = 0,
          fadeIn: ue = 0.05,
          flicker: Q = 0,
          flat: oe = !1,
        } = {},
      ) {
        let ie = Math.max(1, Math.round(g * i)),
          we = Oa(),
          ce = Oa();
        for (let ke = 0; ke < ie; ke++) {
          (Z ? rcone(Z, K, we) : rsphere(1, we).normalize(),
            oe && ((we.y = Math.abs(we.y) * 0.15), we.normalize()));
          let Qe = T !== null ? ps(T, k) : k * (0.35 + 0.65 * Math.random());
          (ce.copy(x),
            ve > 0 && ce.add(rsphere(ve, Oa())),
            this.p({
              p: ce,
              v: [we.x * Qe, we.y * Qe + E, we.z * Qe],
              life: S * (1 - z / 2 + Math.random() * z),
              size: D * ps(0.7, 1.3),
              size1: M ?? D * 0.3,
              col: y,
              col1: w ?? y,
              a: X,
              a1: J,
              frame: R,
              grav: A,
              drag: P,
              stretch: I,
              blend: U,
              glow: j,
              spin: ge ? ps(-ge, ge) : 0,
              fadeIn: ue,
              flicker: Q,
            }));
        }
      },
      glow(x, g = 16777215, y = 1.5, w = 0.25, k = 2.5) {
        this.p({
          p: x,
          life: w,
          size: y * 0.6,
          size1: y,
          col: g,
          a: 1,
          a1: 0,
          frame: FRAME.glow,
          glow: k,
          fadeIn: 0.02,
        });
      },
      ring(x, g = {}) {
        return this.piece(new RingWave(x, g));
      },
      dome(x, g = {}) {
        return this.piece(new Dome(x, g));
      },
      pillar(x, g = {}) {
        return this.piece(new LightPillar(x, g));
      },
      hexwave(x, g = {}) {
        return !x || !x.length ? null : this.piece(new HexWave(x, this.cellToWorld, g));
      },
      runes(x, g = {}) {
        return this.piece(new RuneCircle(x, g));
      },
      slash(x, g = {}) {
        return this.piece(new SlashArc(x, e, g));
      },
      decal(x, g = {}) {
        return this.piece(new Decal(x, g));
      },
      beam(
        x,
        g,
        {
          col: y = 16777215,
          width: w = 0.16,
          life: k = 0.45,
          mode: T = 'beam',
          glow: E = 2.2,
          speed: S = 8,
          jitter: z = 0.3,
          alpha: D = 1,
          hot: M = null,
        } = {},
      ) {
        let R = new Beam({
          width: w,
          color: y,
          life: k,
          mode: T,
          glow: E,
          speed: S,
          jitter: z,
          alpha: D,
          hot: M,
        });
        return (R.setLine(x, g, T === 'bolt' ? 18 : 14), this.piece(R));
      },
      ribbon(x, g = {}) {
        let y = new Beam({
          width: g.width ?? 0.12,
          color: g.col ?? 16777215,
          life: g.life ?? 0.5,
          mode: g.mode ?? 'beam',
          glow: g.glow ?? 2,
          speed: g.speed ?? 6,
          alpha: g.alpha ?? 1,
        });
        return (y.setPoints(x), this.piece(y));
      },
      light(x, g, y = 6, w = 6, k = 0.4, T = null) {
        return d.flash(x, g, y, w, k, T);
      },
      piece(x) {
        return (r.add(x.mesh), u.push(x), x);
      },
      remove(x) {
        let g = u.indexOf(x);
        (g >= 0 && u.splice(g, 1), r.remove(x.mesh), x.dispose());
      },
      shake(x = 0.006, g = 0.3) {
        f || this.noShake || (s === 0 && (x *= 0.6), (m = Math.max(m, x)), (_ = Math.max(_, g)));
      },
      flash(x = 0.45) {
        (f && (x *= 0.4), (b = Math.max(b, x)));
      },
      castStart(x, g, y, { radius: w = 0.9, big: k = !1 } = {}) {
        let T = getStyle(x),
          E = this.runes(g, { color: T.c, radius: k ? w * 1.5 : w, life: 0, spin: 1.2, alpha: 0.85 }),
          S = (D) => {
            if (!y) return;
            let M = Math.max(1, Math.round(60 * D * i));
            for (let R = 0; R < M; R++) {
              let A = rsphere(0.55, Oa()).add(Oa(0, 0.1, 0));
              this.p({
                p: y.clone().add(A),
                v: A.clone().multiplyScalar(-2.2),
                life: 0.28,
                size: 0.07,
                size1: 0.02,
                col: T.c2,
                col1: T.c,
                frame: FRAME.spark,
                glow: 2,
                a: 0.9,
                a1: 0.2,
                stretch: 0.05,
              });
            }
            Math.random() < 0.5 &&
              this.p({
                p: y,
                life: 0.12,
                size: 0.28,
                size1: 0.34,
                col: T.c,
                frame: FRAME.glow,
                glow: 1.8,
                a: 0.8,
              });
          },
          z = !0;
        return (
          this.stream(1.2, (D) => z && S(D)),
          this.fx('cast', { style: x, at: g }),
          {
            release: () => {
              ((z = !1), E.close(0.35));
            },
          }
        );
      },
      projectile(
        x,
        g,
        y,
        {
          kind: w = 'orb',
          speed: k = 16,
          arc: T = null,
          miss: E = !1,
          size: S = 1,
          trail: z = !0,
          curve: D = 0,
          light: M = !0,
        } = {},
      ) {
        let R = getStyle(x),
          A = y.clone();
        if (E) {
          let oe = y.clone().sub(g).setY(0).normalize(),
            ie = Oa(-oe.z, 0, oe.x).multiplyScalar(ps(-1, 1) * 0.9);
          ((A = y.clone().addScaledVector(oe, 2.6).add(ie)), (A.y = Math.max(0.05, y.y - 1.2)));
        }
        let P = g.distanceTo(A),
          I = Math.max(0.12, P / k),
          U = w !== 'orb' && w !== 'dart',
          j = T ?? (U ? Math.min(1.4, P * 0.06) : P * 0.02),
          X = Oa().subVectors(A, g).setY(0).normalize();
        X.set(-X.z, 0, X.x).multiplyScalar(D * P * 0.25);
        let J = null;
        U && ((J = QI(w === 'dart' ? 'arrow' : w)), r.add(J));
        let Z = z
          ? new Beam({
              width: U ? 0.05 : 0.34 * S,
              color: U ? 16774368 : R.c,
              glow: U ? 0.8 : 1.5,
              life: 0,
              mode: 'trail',
              alpha: U ? 0.35 : 0.85,
              speed: 10,
              hot: U ? 0.2 : 0.3,
            })
          : null;
        Z && this.piece(Z);
        let K = [],
          ve = g.clone(),
          ge = Oa(),
          ue = M && !U ? d.flash(g, R.c, 5 * S, 5, 0, () => ve) : null;
        this.fx('launch', { style: U ? w : x, at: g });
        let Q = this;
        return new Promise((oe) => {
          let ie = !1;
          u.push({
            t: 0,
            update(we) {
              this.t += we;
              let ce = Math.min(1, this.t / I),
                ke = (Qe, N) => (
                  N.copy(g).lerp(A, Qe),
                  (N.y += Math.sin(Qe * Math.PI) * j),
                  N.addScaledVector(X, Math.sin(Qe * Math.PI)),
                  N
                );
              if ((ke(ce, ve), ke(Math.min(1, ce + 0.02), ge), J))
                (J.position.copy(ve), w === 'dagger' ? (J.lookAt(ge), J.rotateX(this.t * 22)) : J.lookAt(ge));
              else {
                (Q.p({
                  p: ve,
                  life: 0.06,
                  size: 0.3 * S,
                  size1: 0.26 * S,
                  col: R.c2,
                  frame: FRAME.glow,
                  glow: 2.4,
                  a: 1,
                }),
                  Q.p({
                    p: ve,
                    life: 0.1,
                    size: 0.75 * S,
                    size1: 0.6 * S,
                    col: R.c,
                    frame: FRAME.glow,
                    glow: 1.4,
                    a: 0.6,
                  }));
                let Qe = Math.max(1, Math.round(90 * we * i * S));
                for (let N = 0; N < Qe; N++) {
                  let L = rsphere(0.1 * S, Oa()).add(ve);
                  Q.p({
                    p: L,
                    v: rsphere(0.7, Oa()),
                    life: ps(0.2, 0.5),
                    size: (x === 'fire' ? 0.24 : 0.13) * S,
                    size1: 0.03,
                    col: R.c2,
                    col1: R.c,
                    frame: R.p,
                    glow: 1.6,
                    a: 0.85,
                    grav: x === 'fire' ? 1.4 : x === 'acid' ? -3 : 0,
                    spin: 3,
                  });
                }
                (x === 'fire' &&
                  Math.random() < 0.6 &&
                  Q.p({
                    p: ve,
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
                  x === 'necrotic' &&
                    Math.random() < 0.7 &&
                    Q.p({
                      p: ve,
                      v: rsphere(0.3, Oa()),
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
                Z && (K.push(ve.clone()), K.length > 14 && K.shift(), Z.setPoints(K)),
                ce >= 1 &&
                  !ie &&
                  ((ie = !0),
                  J && (E ? (J.position.copy(A), Q.after(1.4, () => r.remove(J))) : r.remove(J)),
                  Z && ((Z.life = 0.18), (Z.t = 0)),
                  ue && d.release(ue, 0.15),
                  E && Q.fx('whiff', { style: x, at: A }),
                  oe(A)),
                !ie
              );
            },
            dispose() {
              J && r.remove(J);
            },
          });
        });
      },
      hit(x, g, { crit: y = !1, dir: w = null, small: k = !1, blood: T = !0 } = {}) {
        let E = y ? 1.6 : k ? 0.6 : 1,
          S = w ? w.clone().normalize() : null;
        switch (((this._noBlood = !T), this.fx('impact', { type: x, crit: y, at: g }), x)) {
          case 'slashing':
            (this.slash(g, { color: 16773852, size: 1.2 * E, life: 0.26 }),
              this.burst(g, {
                n: 10 * E,
                col: 16769712,
                speed: 4,
                life: 0.3,
                size: 0.06,
                stretch: 0.08,
                dir: S,
                cone: 1.2,
              }),
              this.blood(g, E, S));
            break;
          case 'piercing':
            (this.burst(g, {
              n: 12 * E,
              col: 16773328,
              speed: 6,
              life: 0.22,
              size: 0.05,
              stretch: 0.12,
              dir: S,
              cone: 0.5,
            }),
              this.glow(g, 16771264, 0.5 * E, 0.12, 2),
              this.blood(g, E * 0.8, S));
            break;
          case 'bludgeoning':
            (this.ring(g.clone().setY(g.y - 0.2), {
              color: 16773336,
              radius: 0.9 * E,
              life: 0.3,
              thick: 0.3,
              vertical: e.position.clone().sub(g),
              y: 0,
            }),
              this.burst(g, {
                n: 14 * E,
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
              this.burst(g, { n: 6 * E, col: 16773328, speed: 4, life: 0.2, size: 0.06, stretch: 0.06 }),
              this.blood(g, E * 0.6, S));
            break;
          default:
            this.element(DAMAGE_STYLE[x] || 'arcane', g, { k: E, dir: S });
        }
        y && this.crit(g);
      },
      blood(x, g = 1, y = null, w = 7998728) {
        if (this._noBlood) {
          (this.burst(x, {
            n: 7 * g,
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
            this.burst(x, {
              n: 4 * g,
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
          this.burst(x, {
            n: 8 * g,
            col: w,
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
            dir: y ? y.clone().setY(0.3) : null,
            cone: 1,
            stretch: 0.05,
          });
      },
      element(x, g, { k: y = 1, dir: w = null } = {}) {
        let k = getStyle(x);
        switch (x) {
          case 'fire':
            (this.glow(g, 16752704, 1.4 * y, 0.22, 3),
              this.burst(g, {
                n: 26 * y,
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
              this.burst(g, {
                n: 14 * y,
                col: 16760928,
                speed: 5,
                life: 0.5,
                size: 0.05,
                stretch: 0.06,
                grav: -4,
                glow: 2.5,
              }),
              this.burst(g, {
                n: 8 * y,
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
              this.light(g, 16742954, 9 * y, 7, 0.45));
            break;
          case 'frost':
            (this.glow(g, 12577023, 1.1 * y, 0.2, 2.4),
              this.burst(g, {
                n: 16 * y,
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
              this.burst(g, {
                n: 12 * y,
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
              this.burst(g, {
                n: 6 * y,
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
              this.decal(g.clone().setY(0), {
                frame: FRAME.flake,
                color: 12577023,
                size: 1.2 * y,
                life: 2.2,
                alpha: 0.5,
                glow: 1.2,
              }),
              this.light(g, 9427199, 6 * y, 6, 0.4));
            break;
          case 'lightning': {
            let T = g.clone();
            for (let E = 0; E < 4 * y; E++)
              this.after(E * 0.03, () =>
                this.beam(T, T.clone().add(rsphere(1.1, Oa()).setY(ps(-0.6, 0.8))), {
                  col: 12112127,
                  width: 0.07,
                  life: 0.26,
                  mode: 'bolt',
                  jitter: 0.35,
                  glow: 3,
                }),
              );
            (this.glow(g, 14674175, 1.2 * y, 0.15, 3.5),
              this.burst(g, {
                n: 18 * y,
                col: 15791871,
                speed: 6,
                life: 0.3,
                size: 0.05,
                stretch: 0.1,
                glow: 3,
              }),
              this.light(g, 11061503, 10 * y, 7, 0.25));
            break;
          }
          case 'thunder':
          case 'shatter':
            (this.ring(g.clone().setY(0), { color: k.c, radius: 2.2 * y, life: 0.5, thick: 0.15, fill: 0.6 }),
              this.dome(g.clone().setY(0), { color: k.c2, radius: 1.3 * y, life: 0.4, alpha: 0.7, half: !0 }),
              this.burst(g, {
                n: 14 * y,
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
              x === 'shatter' &&
                this.burst(g, {
                  n: 16 * y,
                  col: 15261439,
                  speed: 5,
                  life: 0.6,
                  size: 0.12,
                  frame: FRAME.shard,
                  grav: -8,
                  spin: 8,
                  glow: 1.6,
                }),
              this.shake(0.007 * y, 0.3));
            break;
          case 'radiant':
          case 'moon':
            (this.glow(g, 16773312, 1.6 * y, 0.3, 3),
              this.burst(g, {
                n: 18 * y,
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
              this.burst(g, {
                n: 10 * y,
                col: 16769168,
                speed: 6,
                life: 0.3,
                size: 0.05,
                stretch: 0.12,
                glow: 3,
              }),
              this.light(g, 16766842, 8 * y, 7, 0.5));
            break;
          case 'necrotic': {
            for (let E = 0; E < Math.round(18 * y * i); E++) {
              let S = rsphere(1.1, Oa());
              this.p({
                p: g.clone().add(S),
                v: S.clone().multiplyScalar(-2.6),
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
            let T = g.clone();
            (this.after(0.12, () => {
              (this.glow(T, 10514656, 1.1 * y, 0.3, 2.2),
                this.ring(T, {
                  color: 10119896,
                  radius: 0.7 * y,
                  life: 0.4,
                  thick: 0.25,
                  vertical: e.position.clone().sub(T),
                  y: 0,
                }));
            }),
              this.burst(g, {
                n: 10 * y,
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
              this.burst(g, {
                n: 6 * y,
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
              this.light(g, 8014591, 4 * y, 5, 0.5));
            break;
          }
          case 'poison':
            (this.burst(g, {
              n: 12 * y,
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
              this.burst(g, {
                n: 14 * y,
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
            (this.burst(g, {
              n: 18 * y,
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
              this.burst(g, {
                n: 8 * y,
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
              this.decal(g.clone().setY(0), {
                frame: FRAME.drop,
                color: 10288954,
                size: 0.9 * y,
                life: 2.5,
                alpha: 0.45,
              }));
            break;
          case 'psychic':
            for (let T = 0; T < 3; T++)
              this.after(T * 0.08, () =>
                this.ring(g, {
                  color: 16743128,
                  radius: (0.8 + T * 0.4) * y,
                  life: 0.45,
                  thick: 0.12,
                  vertical: e.position.clone().sub(g),
                  y: 0,
                }),
              );
            this.burst(g, {
              n: 10 * y,
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
            (this.glow(g, k.c2, 1 * y, 0.18, 2.6),
              this.ring(g, {
                color: k.c,
                radius: 0.8 * y,
                life: 0.3,
                thick: 0.2,
                vertical: e.position.clone().sub(g),
                y: 0,
              }),
              this.burst(g, {
                n: 16 * y,
                col: k.c2,
                col1: k.c,
                speed: 4.5,
                life: 0.35,
                size: 0.07,
                stretch: 0.08,
                glow: 2.4,
              }),
              this.light(g, k.c, 5 * y, 5, 0.3));
            break;
          case 'nature':
            (this.burst(g, {
              n: 14 * y,
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
              this.burst(g, {
                n: 8 * y,
                col: 14221210,
                speed: 3,
                life: 0.3,
                size: 0.05,
                stretch: 0.06,
                glow: 2,
              }));
            break;
          default:
            (this.glow(g, k.c2, 0.9 * y, 0.2, 2.2),
              this.burst(g, {
                n: 14 * y,
                col: k.c2,
                col1: k.c,
                speed: 3,
                life: 0.5,
                size: 0.12,
                size1: 0.03,
                frame: k.p,
                glow: 1.8,
                spin: 3,
                blend: k.blend || 'add',
              }));
        }
      },
      crit(x) {
        (this.glow(x, 16765056, 2.6, 0.3, 3.2),
          this.p({
            p: x,
            life: 0.4,
            size: 1.2,
            size1: 2.2,
            col: 16771248,
            frame: FRAME.star,
            glow: 3,
            rot: Math.random(),
            spin: 2,
          }),
          this.burst(x, { n: 18, col: 16767120, speed: 7, life: 0.35, size: 0.06, stretch: 0.12, glow: 3 }),
          this.shake(0.01, 0.32),
          this.fx('crit', { at: x }));
      },
      miss(x) {
        (this.burst(x, { n: 6, col: 16773328, speed: 3, life: 0.2, size: 0.04, stretch: 0.08 }),
          this.burst(x.clone().setY(0.2), {
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
      heal(x, g = 8) {
        let y = Math.min(1.6, 0.7 + g / 20);
        (this.ring(x, { color: 7339936, radius: 0.9, life: 0.7, thick: 0.25, fill: 0.5 }),
          this.stream(0.6, (w) => {
            let k = Math.max(1, Math.round(45 * w * i * y));
            for (let T = 0; T < k; T++) {
              let E = Math.random() * Math.PI * 2,
                S = ps(0.15, 0.45);
              this.p({
                p: [x.x + Math.cos(E) * S, x.y + ps(0, 0.4), x.z + Math.sin(E) * S],
                v: [0, ps(1, 2.2), 0],
                life: ps(0.6, 1),
                size: ps(0.06, 0.13),
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
            p: x.clone().setY(x.y + 1),
            life: 0.6,
            size: 1.2,
            size1: 1.6,
            col: 7339936,
            frame: FRAME.glow,
            glow: 1.2,
            a: 0.5,
          }),
          this.light(x.clone().setY(x.y + 1), 8388520, 4, 4, 0.7),
          this.fx('heal', { at: x, amount: g }));
      },
      death(x, { undead: g = !1, pc: y = !1 } = {}) {
        let w = x.clone().setY(x.y + 0.9);
        if ((this.fx('death', { at: x, undead: g, pc: y }), g)) {
          (this.burst(w, {
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
            this.burst(w, {
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
            this.light(w, 9109424, 3, 4, 0.8));
          return;
        }
        if (y) {
          (this.flash(0.6), this.ring(x, { color: 16728112, radius: 1.4, life: 0.8, thick: 0.15 }));
          return;
        }
        (this.burst(w, {
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
              p: w,
              v: [0, 1.2, 0],
              life: 1.4,
              size: 0.35,
              size1: 0.1,
              col: 14215423,
              frame: FRAME.glow,
              glow: 1.5,
              a: 0.6,
            }),
              this.burst(w, {
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
      spell(x, g = {}) {
        let y = efectosConjuros[x] || {},
          w = resolveStyleKey(g.fx ?? y.fx, g.dtype || y.d);
        return playSpellFx(this, x, y, w, g);
      },
      feature(x, g = {}) {
        return playFeatureFx(this, x, g);
      },
      update(x) {
        ((x *= this.timeScale), (p += x));
        for (let g = h.length - 1; g >= 0; g--)
          if (h[g].at <= p) {
            let y = h[g];
            h.splice(g, 1);
            try {
              y.fn();
            } catch (w) {
              console.error('[vfx]', w);
            }
          }
        for (let g = u.length - 1; g >= 0; g--) {
          let y = u[g],
            w = !1;
          try {
            w = y.update(x, e);
          } catch (k) {
            console.error('[vfx] pieza', k);
          }
          w || (u.splice(g, 1), y.mesh && r.remove(y.mesh), y.dispose?.());
        }
        if ((this.auras.update(x), this.zones.update(x), l.update(x), c.update(x), d.update(x), _ > 0)) {
          _ -= x;
          let g = m * Math.max(0, _ / 0.3),
            y = 1e3,
            w = y / e.aspect;
          (e.setViewOffset(y, w, (Math.random() - 0.5) * 2 * g * y, (Math.random() - 0.5) * 2 * g * w, y, w),
            _ <= 0 && ((m = 0), e.clearViewOffset()));
        }
        n &&
          n.uniforms.uFlash &&
          b > 0 &&
          ((n.uniforms.uFlash.value = b),
          (b = Math.max(0, b - x * 1.6)),
          b === 0 && (n.uniforms.uFlash.value = 0));
      },
      async prewarm(x, g = o) {
        let y = new Vector3(0, -50, 0),
          w = [
            new Beam({ life: 0 }).setLine(y, y.clone().add(new Vector3(1, 0, 0)), 2),
            new Beam({ life: 0, mode: 'trail' }),
            new RingWave(y, { life: 1 }),
            new Dome(y, { life: 0 }),
            new LightPillar(y, { life: 0 }),
            new HexWave([[0, 0]], () => y.clone(), { life: 1 }),
            new HexWave([[0, 0]], () => y.clone(), { life: 1, blend: 'alpha' }),
            new RuneCircle(y, { life: 0 }),
            new SlashArc(y, e, {}),
            new Decal(y, { life: 0 }),
            new Decal(y, { life: 0, blend: 'alpha' }),
          ];
        for (let k of w) r.add(k.mesh);
        (l.spawn({ p: y, life: 0.01, size: 0.01 }), c.spawn({ p: y, life: 0.01, size: 0.01 }));
        try {
          x.compileAsync ? await x.compileAsync(g, e) : x.compile(g, e);
        } catch (k) {
          console.warn('[vfx] prewarm', k);
        }
        for (let k of w) (r.remove(k.mesh), k.dispose());
      },
      stats() {
        return {
          add: l.alive,
          alpha: c.alive,
          pieces: u.length,
          auras: this.auras.count(),
          zones: this.zones.count(),
        };
      },
      clearTransient() {
        for (let x = u.length - 1; x >= 0; x--) {
          let g = u[x];
          g.keep || (u.splice(x, 1), g.mesh && r.remove(g.mesh), g.dispose?.());
        }
        (l.clear(!0), c.clear(!0));
      },
      dispose() {
        (this.clearTransient(),
          this.auras.dispose(),
          this.zones.dispose(),
          (h.length = 0),
          _ > 0 && e.clearViewOffset(),
          n && n.uniforms.uFlash && (n.uniforms.uFlash.value = 0),
          o.remove(r),
          l.dispose(),
          c.dispose());
      },
    };
  return (
    (v.auras = new AuraEffects(v)),
    (v.zones = new ZoneEffects(v)),
    (v.aura = (x, g, y, w) => v.auras.set(x, g, y, w)),
    (v.zone = (x, g, y, w) => v.zones.zone(x, g, y, w)),
    (v.zoneOff = (x) => v.zones.zoneOff(x)),
    (v.token = (x, g, y) => v.zones.token(x, g, y)),
    (v.tokenMove = (x, g) => v.zones.tokenMove(x, g)),
    (v.tokenStrike = (x, g) => v.zones.tokenStrike(x, g)),
    (v.tokenOff = (x) => v.zones.tokenOff(x)),
    v
  );
}
const Oa = (o = 0, e = 0, t = 0) => new Vector3(o, e, t);
const ps = (o, e) => o + Math.random() * (e - o);
const u1 = class {
  constructor(e, t) {
    this.list = [];
    for (let a = 0; a < t; a++) {
      let n = new PointLight(16777215, 0, 6, 2);
      ((n.userData = { life: 0, t: 0, base: 0, follow: null }), e.add(n), this.list.push(n));
    }
  }
  flash(e, t, a = 6, n = 6, s = 0.4, i = null) {
    if (!this.list.length) return null;
    let r = this.list.filter((d) => !(d.userData.base > 0 && d.userData.life === 0)),
      l = r.length ? r : this.list,
      c = l[0];
    for (let d of l) d.intensity < c.intensity && (c = d);
    return (
      c.position.copy(e),
      c.color.set(t),
      (c.distance = n),
      (c.intensity = a),
      Object.assign(c.userData, { life: s, t: 0, base: a, follow: i }),
      c
    );
  }
  update(e) {
    for (let t of this.list) {
      let a = t.userData;
      if (!(a.base <= 0)) {
        if (((a.t += e), a.follow)) {
          let n = a.follow();
          n && t.position.copy(n);
        }
        if (a.life > 0) {
          let n = a.t / a.life;
          ((t.intensity = a.base * Math.max(0, 1 - n) ** 1.5),
            n >= 1 && ((a.base = 0), (a.follow = null), (t.intensity = 0)));
        }
      }
    }
  }
  release(e, t = 0.2) {
    e &&
      ((e.userData.follow = null),
      (e.userData.life = t),
      (e.userData.t = 0),
      (e.userData.base = e.intensity));
  }
};
let d1 = null;

export { DAMAGE_STYLE, STYLE } from './styles.js';
export { FRAME } from './atlas.js';
export { default as SPELLS } from '../datos/efectos/conjuros.json';
export { createVfx, rcone, rsphere };
