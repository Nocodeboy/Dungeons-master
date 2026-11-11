// actors/character.js
// Reconstruido de publicado/juego.js (módulo __esm «pi»).
//
// Clase Character: envoltorio común de todos los personajes 3D (humanoides, bestias, animales).
// Gestiona el AnimationMixer (animaciones lógicas → clips, bucles y de una sola vez, posturas),
// el movimiento por una ruta de puntos, el LOD de animación, destellos de impacto y la liberación.
// makeCharacter crea un personaje a partir de una definición de nivel (explore/actors.js,
// combat/units.js, ui/portraits.js, hero-stage.js).

import { Color, LoopOnce, LoopRepeat, MathUtils, Vector3 } from 'three';
import { LOOPING_ANIMS, ANIM_FALLBACK, CLIP_ALIASES, ANIM_CLIPS } from './anims.js';

/**
 * Crea un personaje a partir de una definición de nivel/escena ({id, pos, y, face, anim, walk…}):
 * compañero si el id es de uno, trasgo si lo parece (piel o nombre) y PNJ en otro caso.
 * Lo coloca, lo orienta y arranca su animación de reposo en un instante al azar.
 */
async function makeCharacter(def) {
  let actorsApi = await import('./index.js'),
    character,
    id = def.id || '';
  if (actorsApi.COMPANIONS[id]) character = await actorsApi.makeCompanion(id);
  else if (def.skinLum || /goblin|trasgo/i.test(id)) {
    let monsterId = (def.attach || []).some((item) => item.bone === 'hand_l' && item.make)
      ? 'goblin_archer'
      : (def.scale ?? 0) >= 0.7
        ? 'goblin_boss'
        : def.outfit === 'Male_Ranger'
          ? 'goblin_warrior'
          : 'goblin_minion';
    character = await actorsApi.makeMonster(monsterId, {
      index: [...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0),
    });
  } else character = await actorsApi.makeNpc({ id });
  return (
    (character.def = {
      ...def,
      scale: character.def.scale,
      anim: def.anim || 'idle',
      walk: def.walk || 'walk',
    }),
    (character.idle = character.def.anim),
    character.root.position.set(def.pos?.[0] ?? 0, def.y ?? 0, def.pos?.[1] ?? 0),
    (character.root.rotation.y = MathUtils.degToRad(def.face ?? 0)),
    character.play(character.idle, 0),
    character.current && (character.current.time = Math.random() * character.current.getClip().duration),
    character
  );
}
const tmpRootPos = new Vector3();
/**
 * Personaje animado. Se construye con un objeto de opciones ({def, root, mixer, clips, anims,
 * actions, procedural, head, height, radius, gait…}) o con la firma antigua (def, root, mixer, actions).
 */
const Character = class {
  constructor(opts, root, mixer, actions) {
    (root &&
      (opts = {
        def: opts,
        root,
        mixer,
        clips: new Map([...actions].map(([name, action]) => [name, action.getClip()])),
        anims: ANIM_CLIPS,
        actions,
      }),
      (this.def = opts.def || {}),
      (this.id = opts.id || this.def.id || ''),
      (this.kind = opts.kind || 'hero'),
      (this.root = opts.root),
      (this.model = opts.model || opts.root),
      (this.mixer = opts.mixer || null),
      (this.clips = opts.clips || new Map()),
      (this.anims = opts.anims || ANIM_CLIPS),
      (this.speeds = opts.speeds || {}),
      (this.actions = opts.actions || new Map()),
      (this.procedural = opts.procedural || null),
      (this.current = null),
      (this.currentName = ''),
      (this.path = []),
      (this.speed = 1.45),
      (this.walkAnim = 'walk'),
      (this.stance = 'calm'),
      (this.idle = this.def.anim || 'idle'),
      (this.headBone = opts.head || this.root.getObjectByName('Head')),
      (this.height = opts.height || 1.8),
      (this.radius = opts.radius || 0.35),
      (this.post = []),
      (this.gait = opts.gait || { walk: 1.35, run: 3.1, sprint: 5, crouch_walk: 1 }),
      (this.onDispose = []),
      (this.userData = {}));
  }
  /** Clip real para una animación lógica, siguiendo alias y sustitutas (variante o al azar). */
  resolve(name, variant = -1) {
    let current = name;
    for (let hop = 0; current && hop < 8; hop++) {
      let candidates = this.anims[current];
      if (candidates) {
        let available = candidates.filter((clipName) => this.clips.has(clipName));
        if (available.length)
          return available[
            variant >= 0 ? variant % available.length : Math.floor(Math.random() * available.length)
          ];
      } else {
        if (this.clips.has(current)) return current;
        if (CLIP_ALIASES[current]) {
          current = CLIP_ALIASES[current];
          continue;
        }
      }
      current = ANIM_FALLBACK[current];
    }
    return this.anims.idle?.find((clipName) => this.clips.has(clipName)) || null;
  }
  /** ¿Tiene el modelo algún clip para esta animación? */
  has(name) {
    let candidates = this.anims[name];
    return candidates ? candidates.some((clipName) => this.clips.has(clipName)) : this.clips.has(name);
  }
  /** AnimationAction de un clip (se crea y se guarda la primera vez). */
  action(clipName) {
    if (!this.actions.has(clipName)) {
      let clip = this.clips.get(clipName);
      if (!clip || !this.mixer) return null;
      this.actions.set(clipName, this.mixer.clipAction(clip));
    }
    return this.actions.get(clipName);
  }
  /** ¿Es una animación en bucle? */
  isLoop(name) {
    if (LOOPING_ANIMS.has(name)) return !0;
    let logical = this.anims[name] ? name : CLIP_ALIASES[name];
    return logical ? LOOPING_ANIMS.has(logical) : /Loop|Idle|Walk|Run|Gallop|Sprint|Eating/.test(name);
  }
  /** Reproduce una animación en bucle con fundido; las de una sola vez pasan a playOnce. */
  play(name, fade = 0.3, { speed, variant = -1 } = {}) {
    if (this.procedural) return this.procedural.play?.(name, { fade, speed, loop: !0 });
    if (!this.isLoop(name) && name !== this.idle) {
      this.playOnce(name, { fade: Math.min(fade, 0.15), speed, variant });
      return;
    }
    let clipName = this.resolve(name, variant),
      action = clipName && this.action(clipName);
    if (action) {
      if (((action.timeScale = speed ?? this.speeds[name] ?? 1), action === this.current)) {
        this.currentName = name;
        return;
      }
      (action.reset(),
        action.setLoop(LoopRepeat, 1 / 0),
        (action.clampWhenFinished = !1),
        action.setEffectiveWeight(1).fadeIn(fade).play(),
        this.current && this.current.fadeOut(fade),
        (this.current = action),
        (this.currentName = name));
    }
  }
  /**
   * Reproduce una animación una vez y devuelve una promesa que se cumple al terminar; después
   * vuelve a la de reposo salvo con `hold`.
   */
  playOnce(name, { fade = 0.12, speed, hold = !1, variant = -1 } = {}) {
    if (this.procedural) return this.procedural.playOnce?.(name, { fade, speed, hold }) || Promise.resolve();
    let clipName = this.resolve(name, variant),
      action = clipName && this.action(clipName);
    return action
      ? (action.reset(),
        action.setLoop(LoopOnce, 1),
        (action.clampWhenFinished = hold),
        (action.timeScale = speed ?? this.speeds[name] ?? 1),
        action.setEffectiveWeight(1).fadeIn(fade).play(),
        this.current && this.current !== action && this.current.fadeOut(fade),
        (this.current = action),
        (this.currentName = name),
        new Promise((resolveDone) => {
          let onFinished = (ev) => {
            ev.action === action &&
              (this.mixer.removeEventListener('finished', onFinished),
              !hold && this.current === action && this.play(this.restName(), 0.2),
              resolveDone());
          };
          this.mixer.addEventListener('finished', onFinished);
        }))
      : Promise.resolve();
  }
  /** Animación de reposo según la situación: caminar si hay ruta, guardia en combate o reposo. */
  restName() {
    return this.path.length
      ? this.walkAnim
      : this.stance === 'combat' && this.idle === 'idle'
        ? 'idle_combat'
        : this.idle;
  }
  /** Cambia la postura («calm» o «combat») y actualiza la animación de reposo si toca. */
  setStance(stance) {
    ((this.stance = stance),
      !this.path.length && this.current && this.isLoop(this.currentName) && this.play(this.restName(), 0.35));
  }
  /** Duración en segundos de una animación con su velocidad. */
  clipLength(name) {
    if (this.procedural) return this.procedural.length?.(name) ?? 0.8;
    let clip = this.clips.get(this.resolve(name, 0));
    return clip ? clip.duration / (this.speeds[name] ?? 1) : 0;
  }
  /** Recorre una lista de puntos (Vector3) y llama a onArrive al llegar al último. */
  walkTo(path, onArrive, { run = !1, anim } = {}) {
    ((this.path = path.slice()),
      (this.onArrive = onArrive),
      this.path.length &&
        ((this.walkAnim = anim || (run ? 'run' : this.def.walk || 'walk')), this.play(this.walkAnim, 0.2)));
  }
  /** Detiene el recorrido y vuelve al reposo. */
  stopWalking() {
    ((this.path = []), this.play(this.restName(), 0.3));
  }
  /** Nivel de detalle de animación: el mixer se actualiza 1 de cada 2^level fotogramas. */
  setLod(level) {
    this.lod = level;
  }
  /** Sombras: «todas», «cuerpo» (solo la primera malla) u otra cosa para ninguna. */
  setShadows(mode) {
    let first = !0;
    this.root.traverse((obj) => {
      obj.isMesh && ((obj.castShadow = mode === 'todas' || (mode === 'cuerpo' && first)), (first = !1));
    });
  }
  /** Avanza animaciones, efectos posteriores (`post`) y el movimiento por la ruta. */
  update(dt) {
    if (
      ((this._lodAcc = (this._lodAcc || 0) + dt),
      (this._lodN = ((this._lodN || 0) + 1) % (this.lod ? 1 << this.lod : 1)),
      this._lodN === 0)
    ) {
      let elapsed = this._lodAcc;
      ((this._lodAcc = 0),
        this.mixer && this.mixer.update(elapsed),
        this.procedural && this.procedural.update(elapsed, this));
      for (let post of this.post) post(elapsed, this);
    }
    if (!this.path.length) return;
    let gaitSpeed = this.gait[this.walkAnim];
    gaitSpeed &&
      this.current &&
      !this.procedural &&
      (this.current.timeScale = Math.min(1.9, Math.max(0.55, this.speed / gaitSpeed)));
    let target = this.path[0],
      pos = this.root.position,
      dx = target.x - pos.x,
      dz = target.z - pos.z,
      dist = Math.hypot(dx, dz),
      step = this.speed * dt;
    if (dist > 1e-4) {
      let turn = Math.atan2(dx, dz) - this.root.rotation.y;
      ((turn = Math.atan2(Math.sin(turn), Math.cos(turn))),
        (this.root.rotation.y += turn * Math.min(1, dt * 10)));
    }
    if ((target.y !== void 0 && (pos.y += (target.y - pos.y) * Math.min(1, dt * 8)), dist <= step)) {
      if (((pos.x = target.x), (pos.z = target.z), this.path.shift(), !this.path.length)) {
        this.play(this.restName(), 0.35);
        let onArrive = this.onArrive;
        ((this.onArrive = null), onArrive && onArrive());
      }
    } else ((pos.x += (dx / dist) * step), (pos.z += (dz / dist) * step));
  }
  /** Posición mundial de la cabeza (o de la altura estimada si no hay hueso). */
  headWorld(out = new Vector3()) {
    return this.headBone
      ? (this.headBone.getWorldPosition(out), out)
      : (this.root.getWorldPosition(out), (out.y += this.height * this.root.scale.y), out);
  }
  /** Posición mundial aproximada del pecho (78 % de la altura de la cabeza). */
  chestWorld(out = new Vector3()) {
    return (
      this.headWorld(out),
      this.root.getWorldPosition(tmpRootPos),
      (out.y = tmpRootPos.y + (out.y - tmpRootPos.y) * 0.78),
      out
    );
  }
  /** Posición mundial de una mano («r» o «l»); el pecho si no hay hueso. */
  handWorld(side = 'r', out = new Vector3()) {
    let hand = this.root.getObjectByName(`hand_${side}`);
    return hand ? hand.getWorldPosition(out) : this.chestWorld(out);
  }
  /** Destello de color que se desvanece (uniforme uFlash de los materiales del personaje). */
  flash(color = 16777215, intensity = 0.6, duration = 0.25) {
    let mats = this.materials(),
      tint = new Color(color).multiplyScalar(intensity);
    ((this._flash = { c: tint, t: duration, total: duration, mats }),
      this._flashPost ||
        ((this._flashPost = (dt) => {
          let state = this._flash;
          if (!state) return;
          state.t -= dt;
          let k = Math.max(0, state.t / state.total);
          for (let mat of state.mats)
            mat.userData.u?.uFlash && mat.userData.u.uFlash.value.copy(state.c).multiplyScalar(k);
          state.t <= 0 && (this._flash = null);
        }),
        this.post.push(this._flashPost)));
  }
  /** Tinte fijo con el mismo uniforme uFlash (0 o vacío lo quita). */
  setTint(color) {
    for (let mat of this.materials())
      mat.userData.u?.uFlash && mat.userData.u.uFlash.value.set(color || 0).multiplyScalar(color ? 0.25 : 0);
  }
  /** Materiales distintos de todas las mallas del personaje. */
  materials() {
    let set = new Set();
    return (
      this.root.traverse((obj) => {
        if (obj.isMesh) for (let mat of [].concat(obj.material)) set.add(mat);
      }),
      [...set]
    );
  }
  setWeapon(weapon) {
    this.userData.setWeapon?.(weapon);
  }
  /** Libera geometrías propias, para el mixer y saca el modelo de la escena. */
  dispose() {
    for (let fn of this.onDispose) fn();
    (this.mixer?.stopAllAction(),
      this.root.traverse((obj) => {
        obj.isMesh && obj.userData.ownGeometry !== !1 && obj.geometry?.dispose();
      }),
      this.root.removeFromParent());
  }
};

export { Character, makeCharacter };
