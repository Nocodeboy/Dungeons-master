// vfx/conditions.js
// Reconstruido de publicado/juego.js (módulo __esm «r1»). Nombres locales aún minificados.

import {
  AdditiveBlending,
  Color,
  Euler,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  Quaternion,
  TorusGeometry,
  Vector3,
} from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { FRAME } from './atlas.js';
import { Xr, nr, xi } from './shaders.js';

function BS(o) {
  let e = new Set();
  if (!o || o.dead) return e;
  let t = new Set((o.effects || []).map((a) => a.kind));
  for (let a of o.conditions || [])
    (a === 'restrained' &&
      (t.has('webbed') || t.has('spider_web') || t.has('entangled') || t.has('ensnared'))) ||
      a === 'prone' ||
      a === 'unconscious' ||
      (a === 'paralyzed' && t.has('held')) ||
      (a === 'incapacitated' && t.has('laughing')) ||
      (Hm[a] && e.add(a));
  for (let a of t) {
    let n =
      {
        invisible_spell: 'invisible',
        frightened_spell: 'frightened',
        blinded_spell: 'blinded',
        blinded_long: 'blinded',
        poisoned_spell: 'poisoned',
        charmed_by: 'charmed',
        hold_person: 'held',
        paralyzed_spell: 'held',
        dodge: 'dodging',
        guiding_bolt: 'guiding',
        sleep: 'sleeping',
        asleep: 'sleeping',
        turn_undead: 'turned',
        slowed_frost: 'slowed',
        slowed_weapon: 'slowed',
        frosts_chill: 'slowed',
        agathys: 'armor_of_agathys',
        bardic_inspiration: 'inspired',
        shield_spell: 'shield_spell',
        command: 'commanded',
        spider_web: 'webbed',
      }[a] || a;
    Hm[n] && e.add(n);
  }
  return (
    o.concentration && e.add('concentration'),
    o.hidden && e.add('hidden'),
    (o.conditions || []).includes('unconscious') &&
      (t.has('sleep') || t.has('asleep') || t.has('sleeping')) &&
      e.add('sleeping'),
    e.has('invisible') && e.delete('hidden'),
    e
  );
}
const on = (o, e) => o + Math.random() * (e - o);
const Hm = {
  frightened: {
    glyph: { frame: FRAME.skull, col: 11567359 },
    motes: { col: 2756672, frame: FRAME.smoke, rate: 8, mode: 'head', blend: 'alpha', size: 0.3 },
    pri: 6,
  },
  poisoned: {
    motes: { col: 10288986, frame: FRAME.bubble, rate: 6, mode: 'rise', size: 0.09 },
    look: { emissive: 2775560, intensity: 0.5 },
    pri: 3,
  },
  invisible: {
    look: { opacity: 0.22 },
    motes: { col: 13162751, frame: FRAME.star, rate: 3, mode: 'body', size: 0.06 },
  },
  hidden: { look: { opacity: 0.55 } },
  charmed: {
    glyph: { frame: FRAME.heart, col: 16743128 },
    motes: { col: 16751328, frame: FRAME.heart, rate: 2, mode: 'head', size: 0.1 },
    pri: 7,
  },
  paralyzed: { glyph: { frame: FRAME.chain, col: 13148415 }, bands: 11567359, pri: 8 },
  stunned: {
    glyph: { frame: FRAME.star, col: 16773280, spin: 3 },
    motes: { col: 16773280, frame: FRAME.star, rate: 4, mode: 'halo', size: 0.12 },
    pri: 8,
  },
  incapacitated: { glyph: { frame: FRAME.spiral, col: 16751328, spin: 3 }, pri: 5 },
  blinded: { glyph: { frame: FRAME.eye, col: 13684944 }, pri: 5 },
  restrained: { glyph: { frame: FRAME.chain, col: 14207136 }, pri: 4 },
  grappled: { glyph: { frame: FRAME.chain, col: 14207136 }, pri: 3 },
  deafened: { pri: 1 },
  bless: { ring: 16766314, motes: { col: 16769162, frame: FRAME.star, rate: 5, mode: 'orbit', size: 0.08 } },
  bane: { motes: { col: 9054928, frame: FRAME.skull, rate: 3, mode: 'fall', size: 0.1 } },
  heroism: { motes: { col: 16766314, frame: FRAME.sun, rate: 4, mode: 'rise', size: 0.1 } },
  aid: { ring: 16771232 },
  shield_of_faith: { dome: { col: 16766314, hex: 1, alpha: 0.35 } },
  sanctuary: {
    dome: { col: 16052479, hex: 0, alpha: 0.3 },
    motes: { col: 16777215, frame: FRAME.star, rate: 2, mode: 'orbit', size: 0.06 },
  },
  prot_evil: { motes: { col: 16773312, frame: FRAME.ankh, rate: 2, mode: 'orbit', size: 0.1 } },
  armor_of_agathys: {
    dome: { col: 10477823, hex: 1, alpha: 0.35 },
    motes: { col: 15268607, frame: FRAME.flake, rate: 4, mode: 'body', size: 0.07 },
  },
  mage_armor: {},
  barkskin: {
    look: { emissive: 3810320, intensity: 0.6 },
    motes: { col: 9424992, frame: FRAME.leaf, rate: 2, mode: 'orbit', size: 0.1, blend: 'alpha' },
  },
  blur: {
    look: { opacity: 0.7 },
    motes: { col: 11575551, frame: FRAME.swirl, rate: 4, mode: 'body', size: 0.25 },
  },
  mirror_image: { ghosts: 3, motes: { col: 12628223, frame: FRAME.star, rate: 3, mode: 'body', size: 0.06 } },
  rage: {
    ring: 16726554,
    motes: { col: 16742954, frame: FRAME.spark, rate: 14, mode: 'rise', size: 0.05 },
    look: { emissive: 6949376, intensity: 0.55 },
  },
  reckless: { motes: { col: 16738848, frame: FRAME.spark, rate: 5, mode: 'rise', size: 0.04 } },
  hunters_mark: { glyph: { frame: FRAME.cross, col: 12123978, spin: 0.8 }, pri: 9 },
  hexed: { glyph: { frame: FRAME.sigil, col: 12607743, spin: 0.8 }, pri: 9 },
  webbed: { web: !0, pri: 4 },
  entangled: { vines: 6274874, pri: 4 },
  ensnared: { vines: 6274874, pri: 4 },
  laughing: {
    glyph: { frame: FRAME.spiral, col: 16751328, spin: 4 },
    motes: { col: 16756968, frame: FRAME.note, rate: 3, mode: 'head', size: 0.1 },
    pri: 8,
  },
  held: { glyph: { frame: FRAME.chain, col: 13148415 }, bands: 11567359, pri: 8 },
  sleeping: { glyph: { frame: FRAME.zz, col: 13156607, spin: 0 }, pri: 9 },
  concentration: { runes: 10320895 },
  dodging: { ring: 10471679 },
  searing: { motes: { col: 16752704, frame: FRAME.flame, rate: 14, mode: 'body', size: 0.18 } },
  acid_dot: { motes: { col: 12123978, frame: FRAME.drop, rate: 6, mode: 'drip', size: 0.07 } },
  outlined: {
    motes: { col: 12620031, frame: FRAME.star, rate: 8, mode: 'body', size: 0.07 },
    look: { emissive: 4858016, intensity: 0.7 },
  },
  outlined_wisp: {
    motes: { col: 16773296, frame: FRAME.star, rate: 6, mode: 'body', size: 0.06 },
    look: { emissive: 5917200, intensity: 0.6 },
  },
  outlined_shine: {
    motes: { col: 16773296, frame: FRAME.star, rate: 6, mode: 'body', size: 0.06 },
    look: { emissive: 5917200, intensity: 0.6 },
  },
  guiding: {
    motes: { col: 16769162, frame: FRAME.star, rate: 6, mode: 'body', size: 0.07 },
    look: { emissive: 6967312, intensity: 0.7 },
  },
  inspired: { motes: { col: 16769162, frame: FRAME.note, rate: 2, mode: 'orbit', size: 0.12 } },
  divine_favor: { motes: { col: 16769162, frame: FRAME.spark, rate: 10, mode: 'hand', size: 0.05 } },
  flame_blade: { motes: { col: 16752704, frame: FRAME.flame, rate: 22, mode: 'hand', size: 0.14 } },
  produce_flame: { motes: { col: 16752704, frame: FRAME.flame, rate: 16, mode: 'hand', size: 0.12 } },
  shillelagh: { motes: { col: 9437024, frame: FRAME.spark, rate: 10, mode: 'hand', size: 0.06 } },
  magic_weapon: { motes: { col: 10467583, frame: FRAME.spark, rate: 10, mode: 'hand', size: 0.05 } },
  sacred_weapon: { motes: { col: 16769162, frame: FRAME.star, rate: 10, mode: 'hand', size: 0.07 } },
  true_strike: { motes: { col: 16769162, frame: FRAME.spark, rate: 8, mode: 'hand', size: 0.05 } },
  steady_aim: { glyph: { frame: FRAME.cross, col: 16769162, spin: 1.5 }, pri: 2 },
  innate_sorcery: {
    ring: 11567359,
    motes: { col: 12624127, frame: FRAME.rune, rate: 3, mode: 'orbit', size: 0.1 },
  },
  slowed: { motes: { col: 12577023, frame: FRAME.flake, rate: 5, mode: 'feet', size: 0.08 } },
  mocked: { motes: { col: 16751328, frame: FRAME.spiral, rate: 2, mode: 'head', size: 0.08 } },
  no_heal: { motes: { col: 6961824, frame: FRAME.smoke, rate: 4, mode: 'body', size: 0.18, blend: 'alpha' } },
  no_reactions: { glyph: { frame: FRAME.bolt, col: 10467583 }, pri: 1 },
  longstrider: { motes: { col: 15267071, frame: FRAME.swirl, rate: 3, mode: 'feet', size: 0.2 } },
  exp_retreat: { motes: { col: 15267071, frame: FRAME.swirl, rate: 5, mode: 'feet', size: 0.22 } },
  warding_bond: { motes: { col: 16766314, frame: FRAME.chain, rate: 1.5, mode: 'orbit', size: 0.1 } },
  enfeebled: { motes: { col: 6961824, frame: FRAME.skull, rate: 2, mode: 'head', size: 0.08 } },
  mind_spiked: { glyph: { frame: FRAME.eye, col: 16739024 }, pri: 2 },
  suggested: { glyph: { frame: FRAME.spiral, col: 16751328, spin: 2 }, pri: 6 },
  turned: { glyph: { frame: FRAME.ankh, col: 16769162 }, pri: 7 },
  wild_shape: {
    motes: { col: 9424992, frame: FRAME.leaf, rate: 2, mode: 'orbit', size: 0.1, blend: 'alpha' },
  },
  dragons_breath: { motes: { col: 16752704, frame: FRAME.flame, rate: 8, mode: 'head', size: 0.1 } },
  shield_spell: { dome: { col: 10471679, hex: 1, alpha: 0.4 } },
  commanded: { glyph: { frame: FRAME.rune, col: 13148415 }, pri: 5 },
};
const Du = new Vector3();
const i1 = class {
  constructor(e, t) {
    ((this.vfx = e),
      (this.anchor = t),
      (this.states = new Map()),
      (this.glyph = -1),
      (this.glyphState = null),
      (this.t = Math.random() * 10),
      (this.lookKey = ''),
      (this.saved = null));
  }
  has(e) {
    return this.states.has(e);
  }
  add(e) {
    if (this.states.has(e)) return;
    let t = Hm[e] || {},
      a = { def: t, parts: [], acc: 0 },
      n = this.vfx,
      s = this.anchor.feet();
    (t.ring &&
      a.parts.push(
        n.piece(
          new xi(s, {
            frame: FRAME.ring,
            color: t.ring,
            size: 1.25,
            life: 0,
            alpha: 0.55,
            glow: 1.6,
            spin: 0.6,
          }),
        ),
      ),
      t.dome &&
        a.parts.push(
          n.piece(
            new Xr(s, {
              color: t.dome.col,
              radius: 0.95,
              life: 0,
              alpha: t.dome.alpha ?? 0.35,
              grow: !1,
              hex: t.dome.hex ?? 0,
            }),
          ),
        ),
      t.runes &&
        a.parts.push(
          n.piece(new nr(s, { color: t.runes, radius: 0.75, life: 0, alpha: 0.45, spin: 0.5, glow: 1.6 })),
        ));
    for (let i of a.parts) i.keep = !0;
    (t.web && (a.web = this.makeWeb()),
      t.vines && (a.vines = this.makeVines(t.vines)),
      t.bands && (a.bands = this.makeBands(t.bands)),
      t.ghosts && (a.ghosts = this.makeGhosts(t.ghosts)),
      this.states.set(e, a),
      this.refreshGlyph(),
      this.refreshLook(),
      n.fx('aura_on', { state: e, at: s }));
  }
  remove(e) {
    let t = this.states.get(e);
    if (t) {
      for (let a of t.parts) this.vfx.remove(a);
      if (t.ghosts) {
        for (let { g: a } of t.ghosts.list) this.vfx.root.remove(a);
        t.ghosts.mat.dispose();
      }
      for (let a of ['web', 'vines', 'bands'])
        if (t[a]) {
          if (t[a].pinned) for (let n of t[a].pinned) (t[a].pool || this.vfx.alp).kill(n);
          t[a].mesh &&
            (this.vfx.root.remove(t[a].mesh), t[a].mesh.geometry?.dispose(), t[a].mesh.material?.dispose());
        }
      (this.states.delete(e),
        this.refreshGlyph(),
        this.refreshLook(),
        this.vfx.fx('aura_off', { state: e, at: this.anchor.feet() }));
    }
  }
  makeWeb() {
    let e = [];
    for (let t = 0; t < 6; t++)
      e.push(
        this.vfx.alp.spawn({
          p: [0, 0, 0],
          life: 1,
          pinned: !0,
          size: on(0.7, 1.1),
          col: 16052970,
          a: 0.75,
          a1: 0.75,
          frame: FRAME.web,
          rot: Math.random() * 6,
        }),
      );
    return {
      pinned: e,
      pool: this.vfx.alp,
      offs: e.map((t, a) => [Math.cos(a * 2.1) * 0.25, 0.25 + (a % 3) * 0.45, Math.sin(a * 2.1) * 0.25]),
    };
  }
  makeVines(e) {
    let t = [];
    for (let a = 0; a < 9; a++)
      t.push(
        this.vfx.alp.spawn({
          p: [0, 0, 0],
          life: 1,
          pinned: !0,
          size: on(0.18, 0.3),
          col: a % 3 ? e : 3828250,
          a: 0.95,
          a1: 0.95,
          frame: a % 3 ? FRAME.leaf : FRAME.thorn,
          rot: Math.random() * 6,
        }),
      );
    return {
      pinned: t,
      pool: this.vfx.alp,
      offs: t.map((a, n) => [Math.cos(n * 1.7) * 0.3, 0.08 + (n / 9) * 0.7, Math.sin(n * 1.7) * 0.3]),
    };
  }
  makeGhosts(e) {
    let t = this.anchor.root;
    if (!t) return null;
    let a;
    try {
      a = clone(t);
    } catch {
      return null;
    }
    let n = new MeshBasicMaterial({
        color: new Color(10127615).multiplyScalar(1.2),
        transparent: !0,
        opacity: 0.32,
        blending: AdditiveBlending,
        depthWrite: !1,
      }),
      s = (l) => {
        let c = [];
        l.traverse((d) => {
          d.isLight || d.isSprite || d.isPoints
            ? c.push(d)
            : d.isMesh &&
              ((d.material = n), (d.castShadow = !1), (d.receiveShadow = !1), (d.userData.vfxGhost = !0));
        });
        for (let d of c) d.parent?.remove(d);
      };
    s(a);
    let i = [];
    t.traverse((l) => i.push(l));
    let r = [];
    for (let l = 0; l < e; l++) {
      let c = l === 0 ? a : clone(a);
      l > 0 && s(c);
      let d = [];
      (c.traverse((u) => d.push(u)),
        (c.userData.vfxGhost = !0),
        this.vfx.root.add(c),
        r.push({ g: c, dst: d }));
    }
    return { list: r, src: i, mat: n };
  }
  makeBands(e) {
    let t = new TorusGeometry(0.42, 0.025, 6, 32),
      a = new Color(e).multiplyScalar(2.2),
      n = new MeshBasicMaterial({
        color: a,
        transparent: !0,
        opacity: 0.8,
        blending: AdditiveBlending,
        depthWrite: !1,
      }),
      s = new InstancedMesh(t, n, 3);
    return (
      (s.frustumCulled = !1),
      this.vfx.root.add(s),
      { mesh: s, mat: new Matrix4(), q: new Quaternion() }
    );
  }
  refreshGlyph() {
    let e = null,
      t = -1;
    for (let [a, n] of this.states) n.def.glyph && (n.def.pri ?? 0) > t && ((t = n.def.pri ?? 0), (e = a));
    if (
      e !== this.glyphState &&
      (this.glyph >= 0 && this.vfx.add.kill(this.glyph), (this.glyph = -1), (this.glyphState = e), e)
    ) {
      let a = Hm[e].glyph;
      this.glyph = this.vfx.add.spawn({
        p: this.anchor.head(),
        life: 1,
        pinned: !0,
        size: a.size ?? 0.42,
        col: a.col,
        a: 0.95,
        a1: 0.95,
        frame: a.frame,
        rot: 0,
        spin: a.spin ?? 0,
        glow: 1.6,
      });
    }
  }
  refreshLook() {
    let e = 1,
      t = null,
      a = 0;
    for (let i of this.states.values()) {
      let r = i.def.look;
      r &&
        (r.opacity !== void 0 && (e = Math.min(e, r.opacity)),
        r.emissive !== void 0 && r.intensity > a && ((t = r.emissive), (a = r.intensity)));
    }
    let n = `${e}|${t}|${a}`;
    if (n === this.lookKey || ((this.lookKey = n), this.restoreLook(), e >= 1 && !t)) return;
    let s = this.anchor.root;
    s &&
      ((this.saved = []),
      s.traverse((i) => {
        if (!i.isMesh || !i.material || Array.isArray(i.material) || i.userData.vfxGhost) return;
        let r = i.material,
          l = r.clone();
        ((l.onBeforeCompile = r.onBeforeCompile),
          (l.customProgramCacheKey = r.customProgramCacheKey),
          e < 1 && ((l.transparent = !0), (l.opacity = r.opacity * e), (l.depthWrite = e > 0.5)),
          t && l.emissive && ((l.emissive = new Color(t)), (l.emissiveIntensity = a)),
          this.saved.push([i, r, l]),
          (i.material = l));
      }));
  }
  restoreLook() {
    if (this.saved) {
      for (let [e, t, a] of this.saved) (e.material === a && (e.material = t), a.dispose());
      this.saved = null;
    }
  }
  update(e) {
    this.t += e;
    let t = this.anchor,
      a = t.feet(),
      n = this.vfx,
      s = t.root ? t.root.visible : !0,
      i = null,
      r = null,
      l = () => (i ||= t.head()),
      c = () => (r ||= t.chest());
    if (this.glyph >= 0) {
      let d = l();
      n.add.place(this.glyph, d.x, d.y + 0.55 + Math.sin(this.t * 2.2) * 0.05, d.z, s ? 0.95 : 0);
    }
    for (let d of this.states.values()) {
      for (let h of d.parts)
        ((h.mesh.position.x = a.x),
          (h.mesh.position.z = a.z),
          (h.mesh.position.y = a.y + (h instanceof xi ? 0.04 : h instanceof nr ? 0.05 : 0)),
          (h.mesh.visible = s));
      if (
        (d.web &&
          d.web.pinned.forEach((h, p) => {
            let m = d.web.offs[p];
            n.alp.place(h, a.x + m[0], a.y + m[1], a.z + m[2], s ? 0.75 : 0);
          }),
        d.vines &&
          d.vines.pinned.forEach((h, p) => {
            let m = d.vines.offs[p],
              _ = Math.sin(this.t * 1.5 + p) * 0.03;
            n.alp.place(h, a.x + m[0] + _, a.y + m[1], a.z + m[2], s ? 0.95 : 0);
          }),
        d.bands)
      ) {
        let h = d.bands;
        for (let p = 0; p < 3; p++)
          (h.q.setFromEuler(
            new Euler(
              Math.PI / 2 + Math.sin(this.t * 1.3 + p) * 0.25,
              this.t * (1 + p * 0.4),
              Math.cos(this.t + p) * 0.2,
            ),
          ),
            h.mat.compose(Du.set(a.x, a.y + 0.45 + p * 0.4, a.z), h.q, new Vector3(1, 1, 1)),
            h.mesh.setMatrixAt(p, h.mat));
        ((h.mesh.instanceMatrix.needsUpdate = !0), (h.mesh.visible = s));
      }
      if (d.ghosts) {
        let h = d.ghosts,
          p = t.root;
        (p.updateMatrixWorld(),
          h.list.forEach(({ g: m, dst: _ }, b) => {
            let f = Math.min(_.length, h.src.length);
            for (let x = 1; x < f; x++) {
              let g = h.src[x],
                y = _[x];
              (y.position.copy(g.position), y.quaternion.copy(g.quaternion), y.scale.copy(g.scale));
            }
            let v = this.t * 0.8 + (b * Math.PI * 2) / h.list.length;
            (p.getWorldPosition(Du),
              m.position.set(Du.x + Math.cos(v) * 0.55, Du.y, Du.z + Math.sin(v) * 0.55),
              (m.rotation.y = p.rotation.y),
              m.scale.copy(p.scale),
              (m.visible = s));
          }));
      }
      let u = d.def.motes;
      if (u && s)
        for (d.acc += e * u.rate * Math.max(0.4, n.quality); d.acc >= 1;)
          ((d.acc -= 1), this.mote(u, a, l, c));
    }
  }
  mote(e, t, a, n) {
    let s = this.vfx,
      i = Math.random() * Math.PI * 2,
      r = {
        col: e.col,
        frame: e.frame,
        size: e.size,
        size1: e.size * 0.4,
        glow: 1.6,
        blend: e.blend || 'add',
        a: e.blend === 'alpha' ? 0.6 : 0.9,
        spin: 1.5,
      };
    switch (e.mode) {
      case 'orbit': {
        let c = on(0.3, 1.6);
        s.p({
          ...r,
          p: [t.x + Math.cos(i) * 0.5, t.y + c, t.z + Math.sin(i) * 0.5],
          v: [-Math.sin(i) * 1.2, 0.15, Math.cos(i) * 1.2],
          life: 0.9,
        });
        break;
      }
      case 'rise':
        s.p({
          ...r,
          p: [t.x + Math.cos(i) * 0.3, t.y + on(0.1, 1.2), t.z + Math.sin(i) * 0.3],
          v: [0, on(0.5, 1.2), 0],
          life: 1,
        });
        break;
      case 'fall': {
        let l = a();
        s.p({
          ...r,
          p: [l.x + Math.cos(i) * 0.4, l.y + 0.6, l.z + Math.sin(i) * 0.4],
          v: [0, -0.6, 0],
          life: 1.4,
        });
        break;
      }
      case 'head': {
        let l = a();
        s.p({
          ...r,
          p: [l.x + Math.cos(i) * 0.15, l.y + 0.15, l.z + Math.sin(i) * 0.15],
          v: [Math.cos(i) * 0.2, on(0.4, 0.8), Math.sin(i) * 0.2],
          life: 1.2,
          size1: e.size * 1.8,
        });
        break;
      }
      case 'halo': {
        let l = a(),
          c = this.t * 4 + Math.random();
        s.p({ ...r, p: [l.x + Math.cos(c) * 0.3, l.y + 0.25, l.z + Math.sin(c) * 0.3], life: 0.5 });
        break;
      }
      case 'body': {
        let l = n();
        s.p({
          ...r,
          p: [l.x + on(-0.3, 0.3), t.y + on(0.1, (l.y - t.y) * 1.6), l.z + on(-0.3, 0.3)],
          v: [0, on(0.1, 0.6), 0],
          life: 0.8,
        });
        break;
      }
      case 'feet':
        s.p({
          ...r,
          p: [t.x + Math.cos(i) * 0.4, t.y + 0.08, t.z + Math.sin(i) * 0.4],
          v: [-Math.sin(i) * 0.8, 0.2, Math.cos(i) * 0.8],
          life: 0.8,
        });
        break;
      case 'drip': {
        let l = n();
        s.p({
          ...r,
          p: [l.x + on(-0.25, 0.25), l.y + on(-0.3, 0.3), l.z + on(-0.25, 0.25)],
          v: [0, -0.2, 0],
          grav: -6,
          life: 0.6,
        });
        break;
      }
      case 'hand': {
        let l = this.anchor.hand ? this.anchor.hand() : n();
        s.p({
          ...r,
          p: [l.x + on(-0.06, 0.06), l.y + on(-0.06, 0.1), l.z + on(-0.06, 0.06)],
          v: [0, on(0.3, 0.9), 0],
          life: 0.4,
        });
        break;
      }
      case 'ghost': {
        let l = n(),
          c = 0.7;
        s.p({
          ...r,
          p: [l.x + Math.cos(i) * c, l.y, l.z + Math.sin(i) * c],
          life: 0.6,
          size1: e.size,
          a: 0.25,
        });
        break;
      }
      default:
        break;
    }
  }
  dispose() {
    for (let e of [...this.states.keys()]) this.remove(e);
    (this.glyph >= 0 && this.vfx.add.kill(this.glyph), this.restoreLook());
  }
};
const Nm = class {
  constructor(e) {
    ((this.vfx = e), (this.units = new Map()));
  }
  unit(e, t) {
    let a = this.units.get(e);
    return (a ? t && (a.anchor = t) : ((a = new i1(this.vfx, t)), this.units.set(e, a)), a);
  }
  set(e, t, a, n) {
    let s = this.unit(e, t);
    n ? s.add(a) : s.remove(a);
  }
  sync(e, t, a) {
    let n = a instanceof Set ? a : new Set(a),
      s = this.unit(e, t);
    for (let i of [...s.states.keys()]) n.has(i) || s.remove(i);
    for (let i of n) s.has(i) || s.add(i);
  }
  popGhost(e) {
    let a = this.units.get(e)?.states.get('mirror_image')?.ghosts;
    if (!a || !a.list.length) return;
    let { g: n } = a.list.pop();
    (this.vfx.burst(n.position.clone().setY(n.position.y + 0.9), {
      n: 16,
      col: 12628223,
      speed: 1.6,
      life: 0.6,
      size: 0.1,
      frame: FRAME.star,
      glow: 2,
    }),
      this.vfx.root.remove(n));
  }
  clear(e) {
    let t = this.units.get(e);
    t && (t.dispose(), this.units.delete(e));
  }
  count() {
    let e = 0;
    for (let t of this.units.values()) e += t.states.size;
    return e;
  }
  repin() {
    for (let e of this.units.values()) {
      let t = [...e.states.keys()];
      e.dispose();
      for (let a of t) e.add(a);
    }
  }
  update(e) {
    for (let t of this.units.values()) t.update(e);
  }
  dispose() {
    for (let e of this.units.values()) e.dispose();
    this.units.clear();
  }
};

export { BS, Nm };
