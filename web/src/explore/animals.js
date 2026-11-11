// explore/animals.js
// Reconstruido de publicado/juego.js (módulo __esm «Qk»). Nombres locales aún minificados.

import { MathUtils, Vector3 } from 'three';
import { hexDistance, HEX_SIZE } from './hex.js';

const go = (o, e) => o + Math.random() * (e - o);
const g0 = class {
  constructor(e) {
    ((this.x = e), (this.list = []), (this.v = new Vector3()));
  }
  async spawn(e) {
    let t = this.x,
      a = await Promise.all(e.map((n) => t.factory.animal(n.kind).catch(() => null)));
    e.forEach((n, s) => {
      let i = a[s];
      if (!i || t.disposed) return;
      let r = t.world.cellToWorld(n.cell);
      ((r.x += go(-0.3, 0.3)),
        (r.z += go(-0.3, 0.3)),
        i.root.position.copy(r),
        (i.root.rotation.y = n.rot != null ? MathUtils.degToRad(n.rot) : go(0, Math.PI * 2)),
        t.three.add(i.root),
        i.anim('idle', { speed: go(0.85, 1.1) }),
        this.list.push({
          actor: i,
          kind: n.kind,
          home: r.clone(),
          radius: (n.wander ?? 0) * HEX_SIZE,
          state: 'idle',
          timer: go(0.5, 5),
          target: new Vector3(),
          speed: 0.45,
          yaw: i.root.rotation.y,
        }));
    });
  }
  walkableAt(e) {
    let t = this.x.world.worldToCell(e);
    return this.x.xmap.walkable(t);
  }
  update(e) {
    for (let t of this.list) {
      (t.actor.update(e), (t.timer -= e));
      let a = t.actor.root;
      if (t.state === 'walk') {
        let n = t.target.x - a.position.x,
          s = t.target.z - a.position.z,
          i = Math.hypot(n, s);
        if (i < 0.06 || t.timer <= 0) {
          this.idle(t);
          continue;
        }
        t.yaw = Math.atan2(n, s);
        let r = t.yaw - a.rotation.y;
        ((r = Math.atan2(Math.sin(r), Math.cos(r))), (a.rotation.y += r * Math.min(1, e * 4)));
        let l = Math.min(i, t.speed * e),
          c = a.position.x + (n / i) * l,
          d = a.position.z + (s / i) * l;
        (this.v.set(c, 0, d),
          this.walkableAt(this.v)
            ? ((a.position.x = c),
              (a.position.z = d),
              this.x.world.heightAt && (a.position.y = this.x.world.heightAt(c, d)))
            : this.idle(t));
        continue;
      }
      if (!(t.timer > 0))
        if (t.radius > 0.1 && Math.random() < 0.45) {
          let n = go(0, Math.PI * 2);
          if (
            (t.target
              .copy(t.home)
              .add(new Vector3(Math.cos(n), 0, Math.sin(n)).multiplyScalar(go(0.2, t.radius))),
            !this.walkableAt(t.target))
          ) {
            t.timer = go(1, 3);
            continue;
          }
          ((t.state = 'walk'), (t.timer = 8), (t.speed = 0.45), t.actor.anim('walk', { mps: t.speed }));
        } else (this.idle(t), Math.random() < 0.3 && (t.actor.root.rotation.y += go(-1, 1)));
    }
  }
  idle(e) {
    e.state = 'idle';
    let t = e.actor.logical && e.actor.ch.has?.('eat') && Math.random() < 0.45;
    (e.actor.anim(t ? 'eat' : 'idle', { speed: go(0.85, 1.1) }), (e.timer = go(3, 9)), (e.speed = 0.45));
  }
  flee(e) {
    for (let t of this.list) {
      let a = t.actor.root.position,
        n = null;
      for (let r of e) r.distanceTo(a) < 10 && (!n || r.distanceTo(a) < n.distanceTo(a)) && (n = r);
      if (!n) continue;
      let s = a.clone().sub(n).setY(0);
      (s.lengthSq() < 1e-4 && s.set(1, 0, 0), s.normalize());
      let i = null;
      for (let r = 8; r >= 2; r -= 1.5) {
        let l = a.clone().addScaledVector(s, r);
        if (this.walkableAt(l)) {
          i = l;
          break;
        }
      }
      i &&
        (t.target.copy(i),
        t.home.copy(i),
        (t.radius = Math.min(t.radius, 0.8)),
        (t.state = 'walk'),
        (t.timer = 10),
        (t.speed = 2.4),
        t.actor.anim('run', { mps: t.speed }));
    }
  }
  dispose() {
    for (let e of this.list) e.actor.dispose();
    this.list = [];
  }
};
const b0 = class {
  constructor(e) {
    ((this.x = e), (this.t = go(16, 24)), (this.greeted = new Set()), (this.npcT = 0), (this.playing = !1));
  }
  update(e) {
    let t = this.x;
    if (!t.isBusy()) {
      if (((this.npcT -= e), this.npcT <= 0)) {
        this.npcT = 0.5;
        let a = t.lead();
        if (a)
          for (let [n, s] of t.npcs) {
            if (s.path.length) continue;
            let i = hexDistance(s.cell, a.cell);
            if (
              i <= 4 &&
              ((s.lookAt = a.actor.root.position.clone()), (s.talkT = 2), i <= 3 && !this.greeted.has(n))
            ) {
              this.greeted.add(n);
              let r = s.def.bark || (s.def.greet ? [].concat(s.def.greet)[0] : null);
              r && r.length < 160 && t.say(n, r.replace(/^«|»$/g, ''), { dur: 3.4 });
            }
          }
      }
      this.playing ||
        t.members.length < 2 ||
        ((this.t -= t.lead()?.moving ? e : e * 0.15), !(this.t > 0) && ((this.t = go(18, 26)), this.play()));
    }
  }
  async play() {
    let e = this.x,
      t = e.game.story;
    if (typeof t?.banter != 'function') return;
    let a;
    try {
      a = await t.banter({
        level: e.levelId,
        cell: e.lead()?.cell,
        members: e.members.map((n) => n.id),
        explore: e.game.explore,
      });
    } catch (n) {
      console.warn('[exploraci\xF3n] banter', n);
      return;
    }
    if (!(!Array.isArray(a) || !a.length)) {
      this.playing = !0;
      try {
        for (let n of a) {
          if (e.isBusy() || e.disposed) break;
          (!e.member(n.who) && !e.npcs.has(n.who)) || (await e.say(n.who, n.text));
        }
      } finally {
        this.playing = !1;
      }
    }
  }
};

export { b0, g0 };
