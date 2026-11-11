// explore/actors.js — Fábrica de actores de la exploración: crea miembros del grupo, PNJ, monstruos y
// animales con el área actors/ (makeHero, makeNpc, makeMonster, makeAnimal, portrait) y, si falta o
// tarda, con sustitutos (personaje genérico de actors/character.js, animal de cajas, retrato de
// iniciales). Cada uno se envuelve en un ExploreActor con animaciones por nombre lógico.
// Lo usa explore/index.js (`this.factory`).
// Reconstruido de publicado/juego.js (módulo __esm «xk»).

import {
  BoxGeometry,
  Color,
  ConeGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { Fs } from '../actors/character.js';
import { hc } from '../actors/roster.js';

/** Asegura un radio mínimo en las esferas de recorte de las mallas (evita que desaparezcan al animar). */
function ensureCullRadius(root, minRadius = 1.4) {
  root.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry) return;
    let geo = obj.geometry;
    (geo.userData.mdgSphere ||
      (geo.boundingSphere || geo.computeBoundingSphere(),
      (geo.boundingSphere.radius = Math.max(geo.boundingSphere.radius, minRadius)),
      (geo.userData.mdgSphere = !0)),
      (obj.frustumCulled = !0));
  });
}
/** Color CSS o numérico → {h, s, l}. */
function colorToHsl(value) {
  let color = new Color(value),
    hsl = {};
  return (color.getHSL(hsl), hsl);
}
/** Definición de personaje genérico (atuendo, pelo, piel, escala por especie, tinte de la ropa). */
function simpleCharacterDef(id, visual = {}, pronoun = 'm') {
  let female = pronoun === 'f',
    rugged = /rogue|ranger|barbarian|knight/.test(visual.model || ''),
    outfit = `${female ? 'Female' : 'Male'}_${rugged ? 'Ranger' : 'Peasant'}`,
    species = visual.species || 'human',
    hair = female ? ['Hair_Long'] : ['Hair_SimpleParted'];
  (species === 'dwarf' && !female && (hair = ['Hair_Beard', 'Hair_Buzzed']),
    female && /mage|cleric/.test(visual.model || '') && (hair = ['Hair_Buns']));
  let def = {
    id,
    outfit,
    hair,
    hairColor: visual.hair ? new Color(visual.hair).getHex() : 4861984,
    skin: visual.skin ? new Color(visual.skin).getHex() : 15780008,
    scale: SPECIES_SCALE[species] ?? 1,
    anim: 'Idle_Loop',
    hideParts: rugged ? ['Hood'] : [],
  };
  if (visual.cloth) {
    let hue = rugged ? 0.33 : 0.08,
      hsl = colorToHsl(visual.cloth);
    def.recolor = {
      from: hue,
      width: 0.16,
      shift: hsl.h - hue,
      sat: Math.max(0.3, hsl.s * 1.4),
      val: 0.6 + hsl.l,
    };
  }
  return def;
}
/** Devuelve un «extras» que añade orejas puntiagudas a la cabeza del modelo. */
function goblinEars(color) {
  return (root) => {
    let head = root.getObjectByName('Head');
    if (!head) return;
    let mat = new MeshStandardMaterial({ color, roughness: 0.7 }),
      headPos = head.getWorldPosition(new Vector3()),
      toHead = new Matrix4().copy(head.matrixWorld).invert(),
      headQuat = head.getWorldQuaternion(new Quaternion());
    for (let side of [-1, 1]) {
      let ear = new Mesh(new ConeGeometry(0.045, 0.3, 6), mat);
      ear.scale.set(1, 1, 0.42);
      let pos = headPos.clone().add(new Vector3(side * 0.08, 0.1, -0.01)),
        dir = new Vector3(side, 0.5, -0.22).normalize(),
        q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir);
      (ear.position.copy(pos.clone().applyMatrix4(toHead)),
        ear.quaternion.copy(headQuat.clone().invert().multiply(q)),
        ear.translateY(0.12),
        head.add(ear));
    }
  };
}
/** Definición de personaje para trasgos y no muertos sustitutos; null para el resto. */
function monsterCharacterDef(id, kind) {
  if (kind.startsWith('goblin')) {
    let skin = GOBLIN_SKIN[kind] ?? 8033864,
      armed = kind === 'goblin_warrior' || kind === 'goblin_boss';
    return {
      id,
      skin,
      skinLum: !0,
      extras: goblinEars(skin),
      outfit: armed || kind === 'goblin_archer' ? 'Male_Ranger' : 'Male_Peasant',
      variant: armed ? 'T_Ranger_3_BaseColor' : kind === 'goblin_archer' ? void 0 : 'T_Peasant_2_BaseColor',
      hideParts: armed ? ['Hood'] : [],
      recolor: armed
        ? { from: 0.33, width: 0.2, shift: -0.27, sat: 0.55, val: 0.8 }
        : { from: 0.08, width: 0.16, shift: -0.02, sat: 0.75, val: 0.75 },
      anim: 'Sword_Idle',
      attach: armed
        ? [{ prop: 'antique_estoc', bone: 'hand_r', scale: 0.48, pos: [0, 0.07, 0.03], rot: [0, 0, -90] }]
        : [{ prop: 'q_Sword_Bronze', bone: 'hand_r', scale: 0.42, pos: [0, 0.05, 0.02], rot: [0, 0, -90] }],
      scale: kind === 'goblin_boss' ? 0.72 : 0.62,
    };
  }
  return kind.startsWith('skeleton') || kind === 'zombie' || kind === 'wight'
    ? {
        id,
        skin: kind === 'zombie' ? 8227942 : kind === 'wight' ? 12105928 : 14735552,
        skinLum: !0,
        outfit: kind === 'wight' ? 'Male_Ranger' : 'Male_Peasant',
        variant: kind === 'wight' ? 'T_Ranger_3_BaseColor' : 'T_Peasant_2_BaseColor',
        hideParts: kind === 'wight' ? [] : [],
        recolor: { from: 0.08, width: 0.3, shift: 0, sat: 0.1, val: kind === 'wight' ? 0.45 : 0.7 },
        anim: 'Sword_Idle',
        scale: kind === 'wight' ? 1.08 : 0.98,
        attach: [
          { prop: 'antique_estoc', bone: 'hand_r', scale: 0.6, pos: [0, 0.07, 0.03], rot: [0, 0, -90] },
        ],
      }
    : null;
}
/** Retrato de sustituto: iniciales sobre un degradado (PNG en data:, con caché). */
function initialsPortrait(name, color = '#7d6334') {
  let key = `${name}|${color}`;
  if (portraitCache.has(key)) return portraitCache.get(key);
  let canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  let ctx = canvas.getContext('2d'),
    grad = ctx.createRadialGradient(64, 50, 10, 64, 64, 80);
  (grad.addColorStop(0, color),
    grad.addColorStop(1, '#1e150f'),
    (ctx.fillStyle = grad),
    ctx.fillRect(0, 0, 128, 128),
    (ctx.fillStyle = '#ecdfc4'),
    (ctx.font = '600 54px Cinzel, Georgia, serif'),
    (ctx.textAlign = 'center'),
    (ctx.textBaseline = 'middle'));
  let initials = name
    .split(/\s+/)
    .filter((w) => w && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  ctx.fillText(initials || '?', 64, 68);
  let url = canvas.toDataURL('image/png');
  return (portraitCache.set(key, url), url);
}
/** Rechaza si la promesa no se cumple en `ms` milisegundos. */
function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    Promise.resolve(promise).finally(() => clearTimeout(timer)),
    new Promise(
      (resolve, reject) =>
        (timer = setTimeout(() => reject(new Error(`${label}: no ha llegado en ${ms / 1e3} s`)), ms)),
    ),
  ]);
}
/**
 * Fábrica de actores. `mod` es el módulo actors/ (o null para usar solo sustitutos).
 * Devuelve {real, member, npc, monster, animal, portrait}; todo es asíncrono.
 */
function createActorFactory(game, mod = null) {
  let heightFor = (scale) => 1.75 * scale,
    qualityLevel = () => game.quality?.level ?? 1,
    applyShadows = (ch, kind) => {
      typeof ch?.setShadows == 'function' &&
        (kind === 'animal'
          ? ch.setShadows(qualityLevel() >= 2 ? 'cuerpo' : 'ninguna')
          : kind !== 'member' &&
            ch.setShadows(qualityLevel() >= 2 ? 'todas' : qualityLevel() === 1 ? 'cuerpo' : 'ninguna'));
    };
  return {
    real: !!mod,
    /** Actor de un miembro del grupo a partir de su ficha. */
    async member(id, sheet = {}) {
      let ch = null;
      if (mod?.makeHero)
        try {
          ch = await withTimeout(mod.makeHero({ ...sheet, id }, { prefer: 'melee' }), 45e3, `makeHero ${id}`);
        } catch (err) {
          console.warn('[exploraci\xF3n] makeHero:', err);
        }
      if (!ch) {
        let preset = hc.find((p) => p.id === id),
          def;
        if (preset) ((def = { ...preset, ...COMPANION_PRESETS[id] }), delete def.pos, delete def.lookAt);
        else {
          let look = sheet.appearance || {};
          def = simpleCharacterDef(
            id,
            {
              model: sheet.class === 'rogue' || sheet.class === 'ranger' ? 'ranger' : 'peasant',
              species: sheet.species,
              skin: look.skin,
              hair: look.hair,
              cloth: look.cloth || '#3a5a4a',
            },
            sheet.pronoun,
          );
        }
        ((def.anim = 'Idle_Loop'), (ch = await Fs({ ...def, id })), ensureCullRadius(ch.root));
      }
      let scale = ch.root.scale.x || 1;
      return new ExploreActor(ch, {
        id,
        kind: 'member',
        height: ch.height || heightFor(scale),
        name: sheet.name || id,
      });
    },
    /** Actor de un PNJ del nivel ({id, name, visual, pronoun}). */
    async npc(def) {
      let ch = null;
      if (mod?.makeNpc)
        try {
          ch = await withTimeout(mod.makeNpc(def), 3e4, `makeNpc ${def.id}`);
        } catch (err) {
          console.warn('[exploraci\xF3n] makeNpc:', err);
        }
      return (
        ch ||
          ((ch = await Fs(simpleCharacterDef(`npc_${def.id}`, def.visual, def.pronoun))),
          ensureCullRadius(ch.root)),
        applyShadows(ch, 'npc'),
        new ExploreActor(ch, {
          id: def.id,
          kind: 'npc',
          height: ch.height || heightFor(ch.root.scale.x || 1),
          name: def.name,
        })
      );
    },
    /** Actor de un monstruo; `index` distingue varios del mismo tipo. */
    async monster(kind, id, index = 1) {
      let ch = null;
      if (mod?.makeMonster)
        try {
          ch = await withTimeout(
            mod.makeMonster(kind, { index: Math.max(0, index - 1) }),
            3e4,
            `makeMonster ${kind}`,
          );
        } catch (err) {
          console.warn('[exploraci\xF3n] makeMonster:', err);
        }
      if (!ch) {
        let def = monsterCharacterDef(id, kind);
        if (def)
          try {
            ((ch = await withTimeout(Fs(def), 15e3, `makeCharacter ${kind}`)), ensureCullRadius(ch.root));
          } catch (err) {
            console.warn('[exploraci\xF3n] sustituto de monstruo:', err);
          }
        ch || (ch = new BoxBeast(BEAST_SHAPES[kind] ? kind : 'wolf'));
      }
      return (
        applyShadows(ch, 'enemy'),
        new ExploreActor(ch, {
          id,
          kind: 'enemy',
          height: ch.height || (ch instanceof BoxBeast ? 0.9 : heightFor(ch.root.scale.x || 1)),
          name: kind,
        })
      );
    },
    /** Actor de un animal de ambiente. */
    async animal(kind) {
      let ch = null;
      if (mod?.makeAnimal)
        try {
          ch = await withTimeout(mod.makeAnimal(kind), 3e4, `makeAnimal ${kind}`);
        } catch (err) {
          console.warn('[exploraci\xF3n] makeAnimal:', err);
        }
      return (
        ch || (ch = new BoxBeast(kind)),
        applyShadows(ch, 'animal'),
        new ExploreActor(ch, { id: kind, kind: 'animal', height: ch.height || 0.9 })
      );
    },
    /** URL del retrato de un actor o ficha (o uno de iniciales). */
    async portrait(actor, info = {}) {
      if (mod?.portrait)
        try {
          let who = info.id && info.id !== 'hero' ? info.id : actor?.ch || info,
            url = await mod.portrait(who, { size: 128 });
          if (url) return url;
        } catch (err) {
          console.warn('[exploraci\xF3n] portrait:', err);
        }
      return initialsPortrait(info.name || actor?.name || '?', CLASS_COLORS[info.class] || '#7d6334');
    },
  };
}
/** Nombre lógico → clip de animación del esqueleto UAL (personajes sin capa lógica). */
const UAL_CLIPS = {
  walk: 'Walk_Loop',
  run: 'Jog_Fwd_Loop',
  sprint: 'Sprint_Loop',
  sneak: 'Walk_Loop',
  crouch_walk: 'Walk_Loop',
  crouch: 'Crouch_Idle_Loop',
  interact: 'Interact',
  talk: 'Idle_Talking_Loop',
  attack_melee: 'Sword_Attack',
  attack_ranged: 'Pistol_Shoot',
  cast: 'Spell_Simple_Shoot',
  hit: 'Hit_Chest',
  die: 'Death01',
  dodge: 'Roll',
  pickup: 'PickUp_Table',
  kneel: 'Fixing_Kneeling',
  sit: 'Sitting_Idle_Loop',
  cheer: 'Jump_Start',
  dance: 'Dance_Loop',
  torch: 'Idle_Torch_Loop',
};
/**
 * Envoltorio común de los actores: raíz, altura, animaciones por nombre lógico (idle, walk, run,
 * sneak…), animaciones de una vez, posición de la cabeza y sombreado (oculto en sigilo).
 */
const ExploreActor = class {
  constructor(ch, { id, kind, height = 1.7, name = '' } = {}) {
    ((this.ch = ch),
      (this.root = ch.root),
      (this.id = id),
      (this.kind = kind),
      (this.name = name),
      (this.height = height),
      (this.cur = null),
      (this.speedScale = 1),
      (this._shadow = null),
      (this.logical = typeof ch.has == 'function'),
      (this.ualMode = !this.logical && ch.actions instanceof Map && !ch.actions.has('idle')),
      (this.gait = ch.gait || { walk: 1.35, run: 3.1, sprint: 5, crouch_walk: 1, sneak: 1 }));
  }
  _clip(name) {
    return this.logical
      ? LOGICAL_ANIMS[name] || name
      : this.ualMode
        ? name === 'idle'
          ? this.ch.idle || this.ch.def?.anim || 'Idle_Loop'
          : this.ch.actions.has(name)
            ? name
            : UAL_CLIPS[name] || null
        : name;
  }
  /** Pone una animación en bucle; con `mps` ajusta la velocidad al paso real (m/s). */
  anim(name, { fade = 0.2, speed = 1, mps = null } = {}) {
    if (mps != null) {
      let gaitSpeed = this.gait[LOGICAL_ANIMS[name] || name] || this.gait[name];
      gaitSpeed && (speed = Math.min(1.9, Math.max(0.55, mps / (gaitSpeed * (this.root.scale?.x || 1)))));
    }
    if (this.cur === name && Math.abs(this.speedScale - speed) < 0.02) return;
    let clip = this._clip(name);
    if (((this.cur = name), (this.speedScale = speed), !!clip)) {
      if (this.logical) {
        this.ch.play(clip, fade, { speed });
        return;
      }
      if (this.ualMode) {
        let action = this.ch.actions.get(clip);
        (action && (action.timeScale = speed), this.ch.play(clip, fade));
      } else (this.ch.play(clip, fade), this.ch.setSpeed && this.ch.setSpeed(speed));
    }
  }
  /** Reproduce una animación una vez y vuelve a la anterior (salvo `hold`). */
  async once(name, { speed = 1, hold = !1 } = {}) {
    let clip = this._clip(name);
    if (!clip || !this.ch.playOnce) return;
    let prev = this.cur;
    ((this.cur = null),
      await this.ch.playOnce(clip, { speed, hold }),
      !hold && prev && !this.cur && this.anim(prev));
  }
  update(dt) {
    this.ch.update?.(dt);
  }
  /** Posición de mundo de la cabeza (o la raíz más la altura). */
  head(out = new Vector3()) {
    return (
      (this.ch.headWorld && (this.ch.headWorld(out), out.y > 0.2)) ||
        (this.root.getWorldPosition(out), (out.y += this.height * (this.root.scale?.y || 1))),
      out
    );
  }
  /** Oscurece el actor (escondido) o lo devuelve a su color. */
  setShadowed(on) {
    if (this.logical && typeof this.ch.setTint == 'function') {
      this.ch.setTint(on ? 5921400 : null);
      return;
    }
    if (!this._shadow) {
      if (!on) return;
      ((this._shadow = []),
        this.root.traverse((obj) => {
          !obj.isMesh ||
            !obj.material?.color ||
            ((obj.material = obj.material.clone()),
            this._shadow.push({ m: obj.material, c: obj.material.color.clone() }));
        }));
    }
    for (let entry of this._shadow) entry.m.color.copy(entry.c).multiplyScalar(on ? 0.5 : 1);
  }
  dispose() {
    (this.root.parent?.remove(this.root), this.logical && this.ch.dispose?.());
  }
};
/** Alias de animación para los personajes con capa lógica. */
const LOGICAL_ANIMS = { sneak: 'crouch_walk', crouch: 'crouch_idle' };
/** Ajustes de los compañeros cuando se construyen con el sustituto. */
const COMPANION_PRESETS = {
  brenna: {
    anim: 'Idle_Loop',
    attach: [{ prop: 'antique_estoc', bone: 'hand_r', scale: 0.62, pos: [0, 0.07, 0.03], rot: [0, 0, -90] }],
  },
  pip: { anim: 'Idle_Loop', attach: [] },
  ilyra: { anim: 'Idle_Loop', attach: [] },
  odvar: { anim: 'Idle_Loop' },
};
const SPECIES_SCALE = { dwarf: 0.82, halfling: 0.72, gnome: 0.7, goliath: 1.1, orc: 1.04 };
const GOBLIN_SKIN = {
  goblin_minion: 9421398,
  goblin_warrior: 8040008,
  goblin_archer: 10274914,
  goblin_boss: 6986302,
  goblin_shaman: 8696410,
};
/** Proporciones y colores de los animales hechos de cajas. */
const BEAST_SHAPES = {
  wolf: {
    body: [0.95, 0.38, 0.32],
    leg: 0.42,
    head: 0.24,
    color: 5920336,
    belly: 9077882,
    tail: !0,
    snout: !0,
  },
  giant_spider: { body: [0.9, 0.45, 0.8], leg: 0.55, head: 0.3, color: 2761248, belly: 4860448, legs: 8 },
  mastiff: {
    body: [0.8, 0.36, 0.3],
    leg: 0.38,
    head: 0.24,
    color: 9071176,
    belly: 10123864,
    tail: !0,
    snout: !0,
  },
  sheep: {
    body: [0.75, 0.42, 0.45],
    leg: 0.28,
    head: 0.2,
    color: 15394008,
    belly: 14209216,
    headColor: 3814448,
  },
  cow: { body: [1.3, 0.6, 0.55], leg: 0.55, head: 0.3, color: 15789284, belly: 2761760, spots: !0, tail: !0 },
  pig: { body: [0.8, 0.42, 0.42], leg: 0.22, head: 0.24, color: 15247520, belly: 14194832, snout: !0 },
  horse: { body: [1.4, 0.55, 0.45], leg: 0.8, head: 0.3, color: 8016434, belly: 6964264, tail: !0, neck: !0 },
  donkey: {
    body: [1.1, 0.5, 0.4],
    leg: 0.6,
    head: 0.28,
    color: 9076848,
    belly: 10129536,
    tail: !0,
    neck: !0,
  },
  deer: {
    body: [1, 0.42, 0.34],
    leg: 0.75,
    head: 0.24,
    color: 10119738,
    belly: 13148272,
    tail: !0,
    neck: !0,
  },
  dog: {
    body: [0.7, 0.32, 0.26],
    leg: 0.32,
    head: 0.22,
    color: 11565120,
    belly: 14200960,
    tail: !0,
    snout: !0,
  },
  chicken: { body: [0.3, 0.26, 0.24], leg: 0.14, head: 0.12, color: 15788248, belly: 14733496 },
};
/** Animal de sustituto hecho de cajas, con patas que se mueven al andar y cabeza que pace. */
const BoxBeast = class {
  constructor(kind) {
    let def = BEAST_SHAPES[kind] || BEAST_SHAPES.sheep;
    ((this.def = def), (this.root = new Group()));
    let mat = new MeshStandardMaterial({ color: def.color, roughness: 0.9, flatShading: !0 }),
      bellyMat = new MeshStandardMaterial({ color: def.belly, roughness: 0.9, flatShading: !0 }),
      [len, tall, wide] = def.body,
      body = new Mesh(new BoxGeometry(wide, tall, len), mat);
    ((body.position.y = def.leg + tall / 2), this.root.add(body), (this.body = body));
    let head = new Mesh(
      new BoxGeometry(def.head, def.head, def.head * 1.3),
      def.headColor ? new MeshStandardMaterial({ color: def.headColor, roughness: 0.9 }) : mat,
    );
    if (
      (head.position.set(0, def.leg + tall * (def.neck ? 1.35 : 0.9), len / 2 + def.head * 0.45),
      this.root.add(head),
      (this.headM = head),
      def.snout)
    ) {
      let snout = new Mesh(new BoxGeometry(def.head * 0.5, def.head * 0.45, def.head * 0.6), bellyMat);
      (snout.position.set(0, -def.head * 0.15, def.head * 0.8), head.add(snout));
    }
    this.legs = [];
    let legCount = def.legs || 4,
      legGeo = new BoxGeometry(0.07, def.leg, 0.07).translate(0, -def.leg / 2, 0);
    for (let k = 0; k < legCount; k++) {
      let leg = new Mesh(legGeo, bellyMat),
        side = k % 2 ? 1 : -1,
        row = Math.floor(k / 2) / Math.max(1, legCount / 2 - 1);
      (leg.position.set(side * (wide / 2 - 0.03) * (def.legs ? 1.5 : 1), def.leg, (0.5 - row) * len * 0.8),
        def.legs && (leg.rotation.z = side * 0.7),
        this.root.add(leg),
        this.legs.push(leg));
    }
    if (def.tail) {
      let tail = new Mesh(new BoxGeometry(0.06, 0.06, 0.35).translate(0, 0, -0.17), mat);
      (tail.position.set(0, def.leg + tall * 0.8, -len / 2), (tail.rotation.x = 0.6), this.root.add(tail));
    }
    (this.root.traverse((obj) => {
      obj.isMesh && ((obj.castShadow = !0), (obj.receiveShadow = !0));
    }),
      (this.t = Math.random() * 10),
      (this.mode = 'idle'),
      (this.rate = 1),
      (this.onceP = null));
  }
  play(mode) {
    this.mode = mode;
  }
  /** Animación de una vez (la de muerte lo tumba de lado). */
  async playOnce(name, { hold = !1 } = {}) {
    if (((this.mode = name), name === 'die' || name === 'Death01')) {
      let root = this.root;
      for (let i = 0; i <= 10; i++)
        ((root.rotation.z = (i / 10) * 1.5), await new Promise((resolve) => setTimeout(resolve, 30)));
      return;
    }
    (await new Promise((resolve) => setTimeout(resolve, 450)), hold || (this.mode = 'idle'));
  }
  setSpeed(rate) {
    this.rate = rate;
  }
  update(dt) {
    this.t += dt * this.rate;
    let moving = ['walk', 'run', 'sneak', 'sprint', 'crouch_walk'].includes(this.mode),
      freq = this.mode === 'run' || this.mode === 'sprint' ? 11 : 6;
    (this.legs.forEach((leg, i) => {
      leg.rotation.x = moving
        ? Math.sin(this.t * freq + (i % 2 ? 0 : Math.PI) + (i > 1 ? Math.PI : 0)) * 0.5
        : 0;
    }),
      (this.body.position.y =
        this.def.leg +
        this.def.body[1] / 2 +
        (moving ? Math.abs(Math.sin(this.t * freq)) * 0.03 : Math.sin(this.t * 1.5) * 0.008)),
      this.mode === 'idle' || this.mode === 'graze'
        ? (this.headM.rotation.x = Math.max(0, Math.sin(this.t * 0.4)) * 0.6)
        : (this.headM.rotation.x = 0));
  }
  headWorld(out) {
    return this.headM.getWorldPosition(out);
  }
};
const portraitCache = new Map();
/** Color de fondo del retrato de iniciales por clase. */
const CLASS_COLORS = {
  fighter: '#8a5a3a',
  rogue: '#4a6a3a',
  cleric: '#a89048',
  wizard: '#3a5a8a',
  ranger: '#3a6a4a',
  paladin: '#a07838',
  bard: '#7a3a6a',
  barbarian: '#8a3a2a',
  druid: '#5a7a3a',
  monk: '#6a6a3a',
  sorcerer: '#8a3a5a',
  warlock: '#4a2a6a',
};

export { createActorFactory };
