// explore/animals.js — Vida de fondo de la exploración: animales que pastan y deambulan cerca de su sitio
// (y huyen de los combates) y la charla ambiental (PNJ que saludan al acercarse el grupo y diálogos entre
// compañeros de `story.banter`). Lo usa explore/index.js (`this.animals`, `this.banter`).
// Reconstruido de publicado/juego.js (módulo __esm «Qk»).

import { MathUtils, Vector3 } from 'three';
import { hexDistance, HEX_SIZE } from './hex.js';

/** Número aleatorio uniforme en [min, max). */
const randRange = (min, max) => min + Math.random() * (max - min);
/** Animales del nivel. `explore` es la instancia de Explore (factory, world, xmap, three). */
const AmbientAnimals = class {
  constructor(explore) {
    ((this.x = explore), (this.list = []), (this.v = new Vector3()));
  }
  /** Crea los animales de `defs` ({kind, cell, rot, wander}) y los coloca en su casilla. */
  async spawn(defs) {
    let x = this.x,
      actors = await Promise.all(defs.map((def) => x.factory.animal(def.kind).catch(() => null)));
    defs.forEach((def, i) => {
      let actor = actors[i];
      if (!actor || x.disposed) return;
      let pos = x.world.cellToWorld(def.cell);
      ((pos.x += randRange(-0.3, 0.3)),
        (pos.z += randRange(-0.3, 0.3)),
        actor.root.position.copy(pos),
        (actor.root.rotation.y = def.rot != null ? MathUtils.degToRad(def.rot) : randRange(0, Math.PI * 2)),
        x.three.add(actor.root),
        actor.anim('idle', { speed: randRange(0.85, 1.1) }),
        this.list.push({
          actor,
          kind: def.kind,
          home: pos.clone(),
          radius: (def.wander ?? 0) * HEX_SIZE,
          state: 'idle',
          timer: randRange(0.5, 5),
          target: new Vector3(),
          speed: 0.45,
          yaw: actor.root.rotation.y,
        }));
    });
  }
  /** ¿La posición de mundo cae en una casilla transitable? */
  walkableAt(pos) {
    let cell = this.x.world.worldToCell(pos);
    return this.x.xmap.walkable(cell);
  }
  /** Máquina de estados de cada animal: quieto/comiendo o caminando hacia un punto de su zona. */
  update(dt) {
    for (let a of this.list) {
      (a.actor.update(dt), (a.timer -= dt));
      let root = a.actor.root;
      if (a.state === 'walk') {
        let dx = a.target.x - root.position.x,
          dz = a.target.z - root.position.z,
          dist = Math.hypot(dx, dz);
        if (dist < 0.06 || a.timer <= 0) {
          this.idle(a);
          continue;
        }
        a.yaw = Math.atan2(dx, dz);
        let turn = a.yaw - root.rotation.y;
        ((turn = Math.atan2(Math.sin(turn), Math.cos(turn))),
          (root.rotation.y += turn * Math.min(1, dt * 4)));
        let step = Math.min(dist, a.speed * dt),
          nx = root.position.x + (dx / dist) * step,
          nz = root.position.z + (dz / dist) * step;
        (this.v.set(nx, 0, nz),
          this.walkableAt(this.v)
            ? ((root.position.x = nx),
              (root.position.z = nz),
              this.x.world.heightAt && (root.position.y = this.x.world.heightAt(nx, nz)))
            : this.idle(a));
        continue;
      }
      if (!(a.timer > 0))
        if (a.radius > 0.1 && Math.random() < 0.45) {
          let angle = randRange(0, Math.PI * 2);
          if (
            (a.target
              .copy(a.home)
              .add(new Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(randRange(0.2, a.radius))),
            !this.walkableAt(a.target))
          ) {
            a.timer = randRange(1, 3);
            continue;
          }
          ((a.state = 'walk'), (a.timer = 8), (a.speed = 0.45), a.actor.anim('walk', { mps: a.speed }));
        } else (this.idle(a), Math.random() < 0.3 && (a.actor.root.rotation.y += randRange(-1, 1)));
    }
  }
  /** Pasa el animal a reposo (a veces comiendo) durante 3–9 s. */
  idle(a) {
    a.state = 'idle';
    let eat = a.actor.logical && a.actor.ch.has?.('eat') && Math.random() < 0.45;
    (a.actor.anim(eat ? 'eat' : 'idle', { speed: randRange(0.85, 1.1) }),
      (a.timer = randRange(3, 9)),
      (a.speed = 0.45));
  }
  /** Los animales a menos de 10 m de alguna amenaza (Vector3) corren en dirección contraria. */
  flee(threats) {
    for (let a of this.list) {
      let pos = a.actor.root.position,
        nearest = null;
      for (let p of threats)
        p.distanceTo(pos) < 10 && (!nearest || p.distanceTo(pos) < nearest.distanceTo(pos)) && (nearest = p);
      if (!nearest) continue;
      let dir = pos.clone().sub(nearest).setY(0);
      (dir.lengthSq() < 1e-4 && dir.set(1, 0, 0), dir.normalize());
      let dest = null;
      for (let d = 8; d >= 2; d -= 1.5) {
        let p = pos.clone().addScaledVector(dir, d);
        if (this.walkableAt(p)) {
          dest = p;
          break;
        }
      }
      dest &&
        (a.target.copy(dest),
        a.home.copy(dest),
        (a.radius = Math.min(a.radius, 0.8)),
        (a.state = 'walk'),
        (a.timer = 10),
        (a.speed = 2.4),
        a.actor.anim('run', { mps: a.speed }));
    }
  }
  dispose() {
    for (let a of this.list) a.actor.dispose();
    this.list = [];
  }
};
/** Charla ambiental: saludos de PNJ y conversaciones del grupo cada 18–26 s de marcha. */
const Banter = class {
  constructor(explore) {
    ((this.x = explore),
      (this.t = randRange(16, 24)),
      (this.greeted = new Set()),
      (this.npcT = 0),
      (this.playing = !1));
  }
  update(dt) {
    let x = this.x;
    if (!x.isBusy()) {
      if (((this.npcT -= dt), this.npcT <= 0)) {
        this.npcT = 0.5;
        let lead = x.lead();
        if (lead)
          for (let [id, npc] of x.npcs) {
            if (npc.path.length) continue;
            let dist = hexDistance(npc.cell, lead.cell);
            if (
              dist <= 4 &&
              ((npc.lookAt = lead.actor.root.position.clone()),
              (npc.talkT = 2),
              dist <= 3 && !this.greeted.has(id))
            ) {
              this.greeted.add(id);
              let line = npc.def.bark || (npc.def.greet ? [].concat(npc.def.greet)[0] : null);
              line && line.length < 160 && x.say(id, line.replace(/^«|»$/g, ''), { dur: 3.4 });
            }
          }
      }
      this.playing ||
        x.members.length < 2 ||
        ((this.t -= x.lead()?.moving ? dt : dt * 0.15),
        !(this.t > 0) && ((this.t = randRange(18, 26)), this.play()));
    }
  }
  /** Pide a la historia una charla para el lugar y el grupo actuales y la muestra en bocadillos. */
  async play() {
    let x = this.x,
      story = x.game.story;
    if (typeof story?.banter != 'function') return;
    let lines;
    try {
      lines = await story.banter({
        level: x.levelId,
        cell: x.lead()?.cell,
        members: x.members.map((m) => m.id),
        explore: x.game.explore,
      });
    } catch (err) {
      console.warn('[exploraci\xF3n] banter', err);
      return;
    }
    if (!(!Array.isArray(lines) || !lines.length)) {
      this.playing = !0;
      try {
        for (let line of lines) {
          if (x.isBusy() || x.disposed) break;
          (!x.member(line.who) && !x.npcs.has(line.who)) || (await x.say(line.who, line.text));
        }
      } finally {
        this.playing = !1;
      }
    }
  }
};

export { Banter, AmbientAnimals };
