// actors/character.js
// Reconstruido de publicado/juego.js (módulo __esm «pi»). Nombres locales aún minificados.

import { Color, LoopOnce, LoopRepeat, MathUtils, Vector3 } from 'three';
import { Hb, s2, If, nc } from './anims.js';

async function Fs(o) {
  let e = await import('./index.js'),
    t,
    a = o.id || '';
  if (e.COMPANIONS[a]) t = await e.makeCompanion(a);
  else if (o.skinLum || /goblin|trasgo/i.test(a)) {
    let s = (o.attach || []).some((i) => i.bone === 'hand_l' && i.make)
      ? 'goblin_archer'
      : (o.scale ?? 0) >= 0.7
        ? 'goblin_boss'
        : o.outfit === 'Male_Ranger'
          ? 'goblin_warrior'
          : 'goblin_minion';
    t = await e.makeMonster(s, { index: [...a].reduce((i, r) => i + r.charCodeAt(0), 0) });
  } else t = await e.makeNpc({ id: a });
  return (
    (t.def = { ...o, scale: t.def.scale, anim: o.anim || 'idle', walk: o.walk || 'walk' }),
    (t.idle = t.def.anim),
    t.root.position.set(o.pos?.[0] ?? 0, o.y ?? 0, o.pos?.[1] ?? 0),
    (t.root.rotation.y = MathUtils.degToRad(o.face ?? 0)),
    t.play(t.idle, 0),
    t.current && (t.current.time = Math.random() * t.current.getClip().duration),
    t
  );
}
const wv = new Vector3();
const Character = class {
  constructor(e, t, a, n) {
    (t &&
      (e = {
        def: e,
        root: t,
        mixer: a,
        clips: new Map([...n].map(([s, i]) => [s, i.getClip()])),
        anims: nc,
        actions: n,
      }),
      (this.def = e.def || {}),
      (this.id = e.id || this.def.id || ''),
      (this.kind = e.kind || 'hero'),
      (this.root = e.root),
      (this.model = e.model || e.root),
      (this.mixer = e.mixer || null),
      (this.clips = e.clips || new Map()),
      (this.anims = e.anims || nc),
      (this.speeds = e.speeds || {}),
      (this.actions = e.actions || new Map()),
      (this.procedural = e.procedural || null),
      (this.current = null),
      (this.currentName = ''),
      (this.path = []),
      (this.speed = 1.45),
      (this.walkAnim = 'walk'),
      (this.stance = 'calm'),
      (this.idle = this.def.anim || 'idle'),
      (this.headBone = e.head || this.root.getObjectByName('Head')),
      (this.height = e.height || 1.8),
      (this.radius = e.radius || 0.35),
      (this.post = []),
      (this.gait = e.gait || { walk: 1.35, run: 3.1, sprint: 5, crouch_walk: 1 }),
      (this.onDispose = []),
      (this.userData = {}));
  }
  resolve(e, t = -1) {
    let a = e;
    for (let s = 0; a && s < 8; s++) {
      let i = this.anims[a];
      if (i) {
        let r = i.filter((l) => this.clips.has(l));
        if (r.length) return r[t >= 0 ? t % r.length : Math.floor(Math.random() * r.length)];
      } else {
        if (this.clips.has(a)) return a;
        if (If[a]) {
          a = If[a];
          continue;
        }
      }
      a = s2[a];
    }
    return this.anims.idle?.find((s) => this.clips.has(s)) || null;
  }
  has(e) {
    let t = this.anims[e];
    return t ? t.some((a) => this.clips.has(a)) : this.clips.has(e);
  }
  action(e) {
    if (!this.actions.has(e)) {
      let t = this.clips.get(e);
      if (!t || !this.mixer) return null;
      this.actions.set(e, this.mixer.clipAction(t));
    }
    return this.actions.get(e);
  }
  isLoop(e) {
    if (Hb.has(e)) return !0;
    let t = this.anims[e] ? e : If[e];
    return t ? Hb.has(t) : /Loop|Idle|Walk|Run|Gallop|Sprint|Eating/.test(e);
  }
  play(e, t = 0.3, { speed: a, variant: n = -1 } = {}) {
    if (this.procedural) return this.procedural.play?.(e, { fade: t, speed: a, loop: !0 });
    if (!this.isLoop(e) && e !== this.idle) {
      this.playOnce(e, { fade: Math.min(t, 0.15), speed: a, variant: n });
      return;
    }
    let s = this.resolve(e, n),
      i = s && this.action(s);
    if (i) {
      if (((i.timeScale = a ?? this.speeds[e] ?? 1), i === this.current)) {
        this.currentName = e;
        return;
      }
      (i.reset(),
        i.setLoop(LoopRepeat, 1 / 0),
        (i.clampWhenFinished = !1),
        i.setEffectiveWeight(1).fadeIn(t).play(),
        this.current && this.current.fadeOut(t),
        (this.current = i),
        (this.currentName = e));
    }
  }
  playOnce(e, { fade: t = 0.12, speed: a, hold: n = !1, variant: s = -1 } = {}) {
    if (this.procedural)
      return this.procedural.playOnce?.(e, { fade: t, speed: a, hold: n }) || Promise.resolve();
    let i = this.resolve(e, s),
      r = i && this.action(i);
    return r
      ? (r.reset(),
        r.setLoop(LoopOnce, 1),
        (r.clampWhenFinished = n),
        (r.timeScale = a ?? this.speeds[e] ?? 1),
        r.setEffectiveWeight(1).fadeIn(t).play(),
        this.current && this.current !== r && this.current.fadeOut(t),
        (this.current = r),
        (this.currentName = e),
        new Promise((l) => {
          let c = (d) => {
            d.action === r &&
              (this.mixer.removeEventListener('finished', c),
              !n && this.current === r && this.play(this.restName(), 0.2),
              l());
          };
          this.mixer.addEventListener('finished', c);
        }))
      : Promise.resolve();
  }
  restName() {
    return this.path.length
      ? this.walkAnim
      : this.stance === 'combat' && this.idle === 'idle'
        ? 'idle_combat'
        : this.idle;
  }
  setStance(e) {
    ((this.stance = e),
      !this.path.length && this.current && this.isLoop(this.currentName) && this.play(this.restName(), 0.35));
  }
  clipLength(e) {
    if (this.procedural) return this.procedural.length?.(e) ?? 0.8;
    let t = this.clips.get(this.resolve(e, 0));
    return t ? t.duration / (this.speeds[e] ?? 1) : 0;
  }
  walkTo(e, t, { run: a = !1, anim: n } = {}) {
    ((this.path = e.slice()),
      (this.onArrive = t),
      this.path.length &&
        ((this.walkAnim = n || (a ? 'run' : this.def.walk || 'walk')), this.play(this.walkAnim, 0.2)));
  }
  stopWalking() {
    ((this.path = []), this.play(this.restName(), 0.3));
  }
  setLod(e) {
    this.lod = e;
  }
  setShadows(e) {
    let t = !0;
    this.root.traverse((a) => {
      a.isMesh && ((a.castShadow = e === 'todas' || (e === 'cuerpo' && t)), (t = !1));
    });
  }
  update(e) {
    if (
      ((this._lodAcc = (this._lodAcc || 0) + e),
      (this._lodN = ((this._lodN || 0) + 1) % (this.lod ? 1 << this.lod : 1)),
      this._lodN === 0)
    ) {
      let c = this._lodAcc;
      ((this._lodAcc = 0),
        this.mixer && this.mixer.update(c),
        this.procedural && this.procedural.update(c, this));
      for (let d of this.post) d(c, this);
    }
    if (!this.path.length) return;
    let t = this.gait[this.walkAnim];
    t &&
      this.current &&
      !this.procedural &&
      (this.current.timeScale = Math.min(1.9, Math.max(0.55, this.speed / t)));
    let a = this.path[0],
      n = this.root.position,
      s = a.x - n.x,
      i = a.z - n.z,
      r = Math.hypot(s, i),
      l = this.speed * e;
    if (r > 1e-4) {
      let d = Math.atan2(s, i) - this.root.rotation.y;
      ((d = Math.atan2(Math.sin(d), Math.cos(d))), (this.root.rotation.y += d * Math.min(1, e * 10)));
    }
    if ((a.y !== void 0 && (n.y += (a.y - n.y) * Math.min(1, e * 8)), r <= l)) {
      if (((n.x = a.x), (n.z = a.z), this.path.shift(), !this.path.length)) {
        this.play(this.restName(), 0.35);
        let c = this.onArrive;
        ((this.onArrive = null), c && c());
      }
    } else ((n.x += (s / r) * l), (n.z += (i / r) * l));
  }
  headWorld(e = new Vector3()) {
    return this.headBone
      ? (this.headBone.getWorldPosition(e), e)
      : (this.root.getWorldPosition(e), (e.y += this.height * this.root.scale.y), e);
  }
  chestWorld(e = new Vector3()) {
    return (this.headWorld(e), this.root.getWorldPosition(wv), (e.y = wv.y + (e.y - wv.y) * 0.78), e);
  }
  handWorld(e = 'r', t = new Vector3()) {
    let a = this.root.getObjectByName(`hand_${e}`);
    return a ? a.getWorldPosition(t) : this.chestWorld(t);
  }
  flash(e = 16777215, t = 0.6, a = 0.25) {
    let n = this.materials(),
      s = new Color(e).multiplyScalar(t);
    ((this._flash = { c: s, t: a, total: a, mats: n }),
      this._flashPost ||
        ((this._flashPost = (i) => {
          let r = this._flash;
          if (!r) return;
          r.t -= i;
          let l = Math.max(0, r.t / r.total);
          for (let c of r.mats) c.userData.u?.uFlash && c.userData.u.uFlash.value.copy(r.c).multiplyScalar(l);
          r.t <= 0 && (this._flash = null);
        }),
        this.post.push(this._flashPost)));
  }
  setTint(e) {
    for (let t of this.materials())
      t.userData.u?.uFlash && t.userData.u.uFlash.value.set(e || 0).multiplyScalar(e ? 0.25 : 0);
  }
  materials() {
    let e = new Set();
    return (
      this.root.traverse((t) => {
        if (t.isMesh) for (let a of [].concat(t.material)) e.add(a);
      }),
      [...e]
    );
  }
  setWeapon(e) {
    this.userData.setWeapon?.(e);
  }
  dispose() {
    for (let e of this.onDispose) e();
    (this.mixer?.stopAllAction(),
      this.root.traverse((e) => {
        e.isMesh && e.userData.ownGeometry !== !1 && e.geometry?.dispose();
      }),
      this.root.removeFromParent());
  }
};

export { Character, Fs };
