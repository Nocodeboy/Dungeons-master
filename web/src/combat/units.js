// combat/units.js — Unidades del combate: la figura de cada criatura con su anillo y su cilindro de selección.
// `createUnits` reutiliza las figuras de la exploración (grupo y enemigos ya colocados) y crea las que faltan:
// héroe y compañeros con el aspecto de su clase o de roster.js, trasgos con orejas, no muertos y bandidos
// (creatures.js) y bestias procedurales. La clase Unit unifica dos tipos de figura: Character de actors/ y
// los envoltorios con `anim`/`once` de la exploración, y añade caminar por casillas, encararse, animaciones
// de ataque/golpe/caída, el anillo de estado y el hundimiento de los muertos. Lo usan combat/index.js y
// combat/controller.js.

import {
  CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  Group,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  QuadraticBezierCurve3,
  Quaternion,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
} from 'three';
import { Fs } from '../actors/character.js';
import { hc } from '../actors/roster.js';
import { cellToWorld } from '../explore/hex.js';
import { humanoidMonsterLook, isBeast, makeBeast } from './creatures.js';

/** Arco con cuerda y empuñadura (arqueros trasgo y exploradores). */
function makeBowProp() {
  let bow = new Group(),
    mat = new MeshStandardMaterial({ color: 5913118, roughness: 0.75 }),
    curve = new QuadraticBezierCurve3(new Vector3(0, -0.48, 0), new Vector3(0, 0, 0.2), new Vector3(0, 0.48, 0));
  (bow.add(new Mesh(new TubeGeometry(curve, 18, 0.013, 6), mat)),
    bow.add(
      new Mesh(new CylinderGeometry(0.0025, 0.0025, 0.96, 4), new MeshBasicMaterial({ color: 14209208 })),
    ));
  let grip = new Mesh(
    new CylinderGeometry(0.02, 0.02, 0.12, 6),
    new MeshStandardMaterial({ color: 2759184, roughness: 0.9 }),
  );
  return (
    (grip.position.z = 0.15),
    bow.add(grip),
    bow.traverse((obj) => {
      obj.isMesh && (obj.castShadow = !0);
    }),
    bow
  );
}
/** Bastón con gema brillante (magos, druidas, Odvar). */
function makeStaff() {
  let staff = new Group(),
    mat = new MeshStandardMaterial({ color: 5978914, roughness: 0.8 }),
    shaft = new Mesh(new CylinderGeometry(0.018, 0.022, 1.55, 8), mat);
  ((shaft.position.y = 0.35), staff.add(shaft));
  let gem = new Mesh(
    new OctahedronGeometry(0.035),
    new MeshStandardMaterial({ color: 10475775, emissive: 3837904, emissiveIntensity: 2.2, roughness: 0.2 }),
  );
  return (
    (gem.position.y = 1.18),
    staff.add(gem),
    staff.traverse((obj) => {
      obj.isMesh && (obj.castShadow = !0);
    }),
    staff
  );
}
/** Extra que añade dos orejas puntiagudas al hueso «Head». */
function goblinEars(color) {
  return (root) => {
    let head = root.getObjectByName('Head');
    if (!head) return;
    let mat = new MeshStandardMaterial({ color, roughness: 0.7 }),
      headPos = head.getWorldPosition(new Vector3()),
      inverse = new Matrix4().copy(head.matrixWorld).invert(),
      headQuat = head.getWorldQuaternion(new Quaternion());
    for (let side of [-1, 1]) {
      let ear = new Mesh(new ConeGeometry(0.045, 0.3, 6), mat);
      ear.scale.set(1, 1, 0.42);
      let pos = headPos.clone().add(new Vector3(side * 0.08, 0.1, -0.01)),
        dir = new Vector3(side * 1, 0.5, -0.22).normalize(),
        quat = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir);
      (ear.position.copy(pos.clone().applyMatrix4(inverse)),
        ear.quaternion.copy(headQuat.clone().invert().multiply(quat)),
        ear.translateY(0.12),
        (ear.castShadow = !0),
        head.add(ear));
    }
  };
}
/** Aspecto de un trasgo según su plantilla (esbirro, guerrero, arquero, jefe). */
function goblinLook(creature) {
  let skin = GOBLIN_SKINS[creature.template] ?? 8033864,
    base = { id: creature.id, skin, skinLum: !0, scale: 0.64, extras: goblinEars(skin), walk: 'Jog_Fwd_Loop' };
  return creature.template === 'goblin_warrior' || creature.template === 'goblin_boss'
    ? {
        ...base,
        outfit: 'Male_Ranger',
        variant: 'T_Ranger_3_BaseColor',
        hideParts: ['Hood'],
        recolor: { from: 0.33, width: 0.2, shift: -0.27, sat: 0.55, val: 0.8 },
        anim: 'Sword_Idle',
        attach: [
          { prop: 'antique_estoc', bone: 'hand_r', scale: 0.48, pos: [0, 0.07, 0.03], rot: [0, 0, -90] },
          {
            prop: 'q_Shield_Wooden',
            bone: 'lowerarm_l',
            scale: 0.8,
            pos: [0.06, 0.13, -0.05],
            rot: [0, 90, 0],
          },
        ],
        scale: creature.template === 'goblin_boss' ? 0.72 : 0.66,
      }
    : creature.template === 'goblin_archer'
      ? {
          ...base,
          outfit: 'Male_Ranger',
          recolor: { from: 0.33, width: 0.2, shift: 0.02, sat: 0.6, val: 0.7 },
          extras: null,
          anim: 'Idle_Loop',
          attach: [{ make: makeBowProp, bone: 'hand_l', scale: 1, pos: [0, 0.08, 0], rot: [0, 0, 90] }],
        }
      : {
          ...base,
          outfit: 'Male_Peasant',
          variant: 'T_Peasant_2_BaseColor',
          recolor: { from: 0.08, width: 0.16, shift: -0.02, sat: 0.75, val: 0.75 },
          anim: 'Sword_Idle',
          attach: [
            { prop: 'q_Sword_Bronze', bone: 'hand_r', scale: 0.42, pos: [0, 0.05, 0.02], rot: [0, 0, -90] },
          ],
          scale: 0.6,
        };
}
/** Aspecto genérico de un miembro del grupo por su clase (piel y pelo según `index`). */
function classLook(creature, index = 0) {
  let look = CLASS_LOOKS[creature.cls] || CLASS_LOOKS.fighter,
    female = look.outfit.startsWith('Female'),
    def = {
      id: creature.id,
      outfit: look.outfit,
      variant: look.variant,
      hideParts: look.hideParts,
      recolor: look.recolor,
      anim: look.anim,
      skin: SKIN_TONES[index % SKIN_TONES.length],
      hair: female ? ['Hair_Long'] : index % 2 ? ['Hair_Beard', 'Hair_Buzzed'] : ['Hair_SimpleParted'],
      hairColor: HAIR_COLORS[index % HAIR_COLORS.length],
      walk: 'Jog_Fwd_Loop',
      attach: [],
    };
  return (
    look.weapon &&
      def.attach.push({ prop: look.weapon, bone: 'hand_r', scale: 0.6, pos: [0, 0.07, 0.03], rot: [0, 0, -90] }),
    look.shield &&
      def.attach.push({
        prop: 'q_Shield_Wooden',
        bone: 'lowerarm_l',
        scale: 0.85,
        pos: [0.06, 0.13, -0.05],
        rot: [0, 90, 0],
      }),
    look.staff && def.attach.push({ make: makeStaff, bone: 'hand_r', scale: 1, pos: [0, 0.06, 0.02], rot: [0, 0, -90] }),
    look.bow && def.attach.push({ make: makeBowProp, bone: 'hand_l', scale: 1, pos: [0, 0.08, 0], rot: [0, 0, 90] }),
    (creature.species === 'dwarf' || creature.species === 'halfling' || creature.species === 'gnome') && (def.scale = 0.8),
    def
  );
}
/** Aspecto de un miembro: el de roster.js con sus ajustes de combate, o el de su clase. */
function partyLook(creature, index) {
  let preset = hc.find((p) => p.id === creature.id);
  if (!preset) return classLook(creature, index);
  let def = { ...preset, ...COMPANION_OVERRIDES[creature.id] };
  return (delete def.pos, delete def.lookAt, (def.walk = 'Jog_Fwd_Loop'), def);
}
/** Textura del anillo bajo las unidades (círculo y trazo interior), creada una vez. */
function ringTexture() {
  if (ringTextureCache) return ringTextureCache;
  let canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  let ctx = canvas.getContext('2d');
  return (
    (ctx.strokeStyle = '#fff'),
    (ctx.lineWidth = 8),
    ctx.beginPath(),
    ctx.arc(64, 64, 52, 0, Math.PI * 2),
    ctx.stroke(),
    (ctx.globalAlpha = 0.35),
    (ctx.lineWidth = 3),
    ctx.setLineDash([8, 8]),
    ctx.beginPath(),
    ctx.arc(64, 64, 41, 0, Math.PI * 2),
    ctx.stroke(),
    (ringTextureCache = new CanvasTexture(canvas)),
    (ringTextureCache.colorSpace = SRGBColorSpace),
    ringTextureCache
  );
}
/** Lista de unidades con índice por id, cilindros de selección (`proxies`), `add` y `update`. */
function makeUnitList(units) {
  let byId = new Map();
  for (let unit of units) unit && byId.set(unit.id, unit);
  return {
    byId,
    list: [...byId.values()],
    proxies: [...byId.values()].map((unit) => unit.proxy),
    add(unit) {
      (byId.set(unit.id, unit), (this.list = [...byId.values()]), (this.proxies = this.list.map((u) => u.proxy)));
    },
    update(dt) {
      for (let unit of byId.values()) unit.update(dt);
    },
  };
}
/** Crea la figura de una criatura que no viene de la exploración. */
async function makeFigure(creature, index = 0) {
  if (isBeast(creature.template)) return makeBeast(creature.template, creature.id);
  let look;
  return (
    creature.team === 0 ? (look = partyLook(creature, index)) : (creature.template || '').startsWith('goblin') ? (look = goblinLook(creature)) : (look = humanoidMonsterLook(creature)),
    Fs({ ...look, id: creature.id })
  );
}
/**
 * Unidades del combate para las criaturas del estado inicial.
 * @param {Map} actors figuras existentes por id (se reutilizan; no son «propias»)
 * @param {object} opts cellToWorld, makeMissing (crea la figura de una criatura sin figura)
 */
async function createUnits(scene, creatures, actors, { cellToWorld: toWorld, makeMissing = null } = {}) {
  let units = [],
    partyIndex = 0;
  for (let creature of creatures) {
    let figure = actors?.get?.(creature.id) || null,
      owns = !1;
    if (!figure) {
      if (((figure = makeMissing ? await makeMissing(creature) : await makeFigure(creature, creature.team === 0 ? partyIndex++ : 0)), !figure)) continue;
      ((owns = !0), scene.add(figure.root));
    }
    let unit = new Unit(creature, figure, { cellToWorld: toWorld, owns });
    (scene.add(unit.ring, unit.proxy),
      owns ? (unit.place(creature.cell), (unit.root.rotation.y = creature.team === 0 ? degToRad(90) : degToRad(-90))) : unit.syncHelpers(),
      units.push(unit));
  }
  return makeUnitList(units);
}
const degToRad = MathUtils.degToRad;
/** Clips de animación alternativos por acción para las figuras Character. */
const CLIP_FALLBACKS = {
  idle: ['Idle_Loop'],
  walk: ['Walk_Loop', 'Jog_Fwd_Loop'],
  run: ['Sprint_Loop', 'Jog_Fwd_Loop'],
  jog: ['Jog_Fwd_Loop', 'Walk_Loop'],
  attack_melee: ['Sword_Attack', 'Punch_Jab'],
  attack_ranged: ['Pistol_Shoot', 'Spell_Simple_Shoot'],
  attack_thrown: ['Punch_Jab', 'Sword_Attack'],
  attack_unarmed: ['Punch_Jab'],
  cast: ['Spell_Simple_Shoot'],
  cast_buff: ['Spell_Simple_Enter', 'Spell_Simple_Shoot'],
  hit: ['Hit_Chest', 'Hit_Head'],
  hit_head: ['Hit_Head', 'Hit_Chest'],
  die: ['Death01'],
  dodge: [],
  prone: ['Crouch_Idle_Loop', 'Fixing_Kneeling'],
  kneel: ['Fixing_Kneeling', 'Crouch_Idle_Loop'],
  crouch_walk: ['Crouch_Idle_Loop'],
  cheer: ['Jump_Start', 'Dance_Loop'],
  taunt: ['Spell_Simple_Enter', 'Jump_Start'],
  interact: ['Interact', 'PickUp_Table'],
  use: ['Interact', 'PickUp_Table'],
  block: ['Hit_Head'],
};
/** Acción equivalente para las figuras envoltorio que no tienen la pedida. */
const WRAPPER_CLIP_ALIASES = {
  jog: 'run',
  attack_thrown: 'attack_ranged',
  attack_unarmed: 'attack_melee',
  cast_buff: 'cast',
  hit_head: 'hit',
  prone: 'kneel',
  taunt: 'cheer',
  use: 'interact',
  block: 'hit',
  crouch_walk: 'crouch',
};
/** Ajustes de combate de los compañeros sobre su aspecto de roster.js (pose y armas). */
const COMPANION_OVERRIDES = {
  brenna: { anim: 'Sword_Idle' },
  pip: {
    anim: 'Idle_Loop',
    attach: [{ prop: 'q_Sword_Bronze', bone: 'hand_r', scale: 0.62, pos: [0, 0.05, 0.02], rot: [0, 0, -90] }],
  },
  ilyra: {
    anim: 'Sword_Idle',
    attach: [
      { prop: 'antique_estoc', bone: 'hand_r', scale: 0.6, pos: [0, 0.07, 0.03], rot: [0, 0, -90] },
      { prop: 'q_Shield_Wooden', bone: 'lowerarm_l', scale: 0.85, pos: [0.06, 0.13, -0.05], rot: [0, 90, 0] },
    ],
  },
  odvar: {
    anim: 'Spell_Simple_Idle_Loop',
    attach: [{ make: makeStaff, bone: 'hand_r', scale: 1, pos: [0, 0.06, 0.02], rot: [0, 0, -90] }],
  },
};
/** Piel de cada tipo de trasgo. */
const GOBLIN_SKINS = { goblin_minion: 9421398, goblin_warrior: 8040008, goblin_archer: 10274914, goblin_boss: 6986302 };
/** Ropa, pose y armas por clase. */
const CLASS_LOOKS = {
  fighter: {
    outfit: 'Male_Ranger',
    hideParts: ['Hood'],
    anim: 'Sword_Idle',
    weapon: 'antique_estoc',
    shield: !0,
  },
  paladin: {
    outfit: 'Male_Ranger',
    hideParts: ['Hood'],
    anim: 'Sword_Idle',
    weapon: 'antique_estoc',
    shield: !0,
    recolor: { from: 0.33, width: 0.2, shift: 0.3, sat: 0.6, val: 1.1 },
  },
  barbarian: {
    outfit: 'Male_Peasant',
    anim: 'Sword_Idle',
    weapon: 'q_Axe_Bronze',
    recolor: { from: 0.08, width: 0.16, shift: -0.05, sat: 1.2, val: 0.8 },
  },
  ranger: { outfit: 'Female_Ranger', anim: 'Idle_Loop', bow: !0 },
  rogue: {
    outfit: 'Male_Ranger',
    variant: 'T_Ranger_3_BaseColor',
    anim: 'Idle_Loop',
    weapon: 'q_Sword_Bronze',
  },
  monk: {
    outfit: 'Male_Peasant',
    anim: 'Idle_Loop',
    recolor: { from: 0.08, width: 0.16, shift: 0.05, sat: 1.4, val: 1.1 },
  },
  cleric: {
    outfit: 'Female_Peasant',
    anim: 'Sword_Idle',
    weapon: 'antique_estoc',
    shield: !0,
    recolor: { from: 0.08, width: 0.1, shift: 0, sat: 0.4, val: 1.35 },
  },
  druid: {
    outfit: 'Female_Peasant',
    anim: 'Spell_Simple_Idle_Loop',
    staff: !0,
    recolor: { from: 0.08, width: 0.16, shift: 0.25, sat: 0.9, val: 0.9 },
  },
  wizard: {
    outfit: 'Male_Peasant',
    anim: 'Spell_Simple_Idle_Loop',
    staff: !0,
    recolor: { from: 0.12, width: 0.14, shift: 0.48, sat: 1.4, val: 1 },
  },
  sorcerer: {
    outfit: 'Female_Peasant',
    anim: 'Spell_Simple_Idle_Loop',
    recolor: { from: 0.08, width: 0.16, shift: 0.75, sat: 1.2, val: 0.9 },
  },
  warlock: {
    outfit: 'Male_Ranger',
    anim: 'Spell_Simple_Idle_Loop',
    recolor: { from: 0.33, width: 0.2, shift: 0.45, sat: 0.6, val: 0.55 },
  },
  bard: {
    outfit: 'Male_Ranger',
    variant: 'T_Ranger_3_BaseColor',
    anim: 'Idle_Loop',
    weapon: 'antique_estoc',
    recolor: { from: 0.33, width: 0.2, shift: 0.62, sat: 0.9, val: 1 },
  },
};
const SKIN_TONES = [16770774, 15780008, 14264189, 11565650, 9067066];
const HAIR_COLORS = [2825492, 4858900, 11892794, 14731408, 1710618, 9058842];
let ringTextureCache = null;
/** Colores del anillo por estado. */
const RING_COLORS = {
  party: 7328122,
  enemy: 14701375,
  active: 16765802,
  target: 16734778,
  ally: 9433248,
  down: 7829367,
};
/** Unidad de combate: figura, casilla, anillo de estado y cilindro de selección. */
const Unit = class {
  constructor(creature, figure, { cellToWorld: toWorld = null, owns = !0 } = {}) {
    ((this.id = creature.id),
      (this.team = creature.team),
      (this.name = creature.name),
      (this.template = creature.template),
      (this.cls = creature.cls),
      (this.ch = figure),
      (this.root = figure.root),
      (this.wrapper =
        typeof figure.anim == 'function' && typeof figure.once == 'function' && typeof figure.playOnce != 'function'),
      (this.inner = this.wrapper ? figure.ch || null : figure),
      (this.cellToWorld = toWorld || ((cell) => cellToWorld(cell[0], cell[1]))),
      (this.owns = owns),
      (this.cell = creature.cell.slice()),
      (this.dead = !1),
      (this.down = !1));
    let inner = this.inner || figure;
    ((this.scale =
      inner.def?.scale ?? (typeof inner.scale == 'number' ? inner.scale : null) ?? (this.root.scale?.x || 1)),
      !this.wrapper && figure.def && (figure.idle = figure.idle || figure.def.anim || 'Idle_Loop'),
      (this.ring = new Mesh(
        new PlaneGeometry(1.15, 1.15),
        new MeshBasicMaterial({
          map: ringTexture(),
          color: creature.team === 0 ? RING_COLORS.party : RING_COLORS.enemy,
          transparent: !0,
          opacity: 0.7,
          depthWrite: !1,
          toneMapped: !1,
        }),
      )),
      (this.ring.rotation.x = -Math.PI / 2),
      (this.ring.renderOrder = 2),
      (this.ringState = 'idle'));
    let height = 1.8 * Math.max(this.scale, 0.75);
    ((this.proxy = new Mesh(new CylinderGeometry(0.42, 0.42, height, 8), new MeshBasicMaterial({ visible: !1 }))),
      (this.proxyH = height / 2),
      (this.proxy.userData.unit = this.id),
      (this.t = Math.random() * 10),
      (this.walking = !1));
  }
  /** ¿Tiene la figura ese clip de animación? */
  knows(clip) {
    let inner = this.inner;
    return inner
      ? typeof inner.has == 'function'
        ? inner.has(clip)
        : inner.actions && typeof inner.actions.has == 'function'
          ? inner.actions.has(clip)
          : Array.isArray(inner.anims)
            ? inner.anims.includes(clip)
            : !1
      : !1;
  }
  /** Clip real para una acción (o null si la figura no tiene ninguno equivalente). */
  clip(name) {
    if (this.wrapper)
      return this.inner && typeof this.inner.has == 'function' && this.inner.has(name)
        ? name
        : name === 'dodge'
          ? null
          : WRAPPER_CLIP_ALIASES[name] || name;
    if (name === 'idle' && this.ch.idle && this.knows(this.ch.idle)) return this.ch.idle;
    if (this.knows(name)) return name;
    for (let alt of CLIP_FALLBACKS[name] || []) if (this.knows(alt)) return alt;
    return this.ch.actions ? null : name;
  }
  /** Pone una animación en bucle. */
  anim(name, fade = 0.25) {
    let clip = this.clip(name);
    clip && (this.wrapper ? this.ch.anim(clip, { fade }) : this.ch.play(clip, fade));
  }
  /** Reproduce una animación una vez; la promesa se cumple al terminar. */
  once(name, opts = {}) {
    let clip = this.clip(name);
    return clip
      ? this.wrapper
        ? Promise.resolve(this.ch.once(clip, opts)).catch(() => {})
        : (this.ch.playOnce && this.ch.playOnce(clip, opts)) || Promise.resolve()
      : Promise.resolve();
  }
  /** Duración del clip de una acción (o `fallback`). */
  length(name, fallback = 1) {
    let clip = this.clip(name),
      inner = this.inner,
      len = 0;
    if (clip && inner?.clipLength && ((len = inner.clipLength(clip)), !(len > 0) && this.wrapper))
      for (let alt of CLIP_FALLBACKS[name] || []) len > 0 || (len = inner.clipLength(alt));
    return len > 0 ? len : fallback;
  }
  /** Cambia la figura (p. ej. Forma salvaje). */
  setCharacter(figure, owns) {
    ((this.ch = figure),
      (this.root = figure.root),
      (this.owns = owns),
      (this.wrapper =
        typeof figure.anim == 'function' && typeof figure.once == 'function' && typeof figure.playOnce != 'function'),
      (this.inner = this.wrapper ? figure.ch || null : figure),
      (this._hand = void 0));
  }
  get mixer() {
    return this.inner?.mixer || null;
  }
  /** Marca la figura como caída (lo leen otras partes de la animación). */
  markDown(down = !0) {
    let inner = this.inner || this.ch;
    (inner && (inner._mdgDown = down), (this.ch._mdgDown = down));
  }
  idle(fade = 0.3) {
    this.dead || this.down || this.anim('idle', fade);
  }
  /** Coloca la unidad en una casilla sin animación. */
  place(cell) {
    this.cell = cell.slice();
    let pos = this.cellToWorld(cell);
    (this.root.position.set(pos.x, pos.y, pos.z), this.syncHelpers());
  }
  /** Lleva el anillo y el cilindro de selección a la posición de la figura. */
  syncHelpers() {
    let pos = this.root.position;
    (this.ring.position.set(pos.x, pos.y + 0.03, pos.z), this.proxy.position.set(pos.x, pos.y + this.proxyH, pos.z));
  }
  /** Gira poco a poco hacia un punto del plano. */
  face(x, z) {
    let pos = this.root.position;
    Math.abs(x - pos.x) + Math.abs(z - pos.z) < 0.001 || (this.targetYaw = Math.atan2(x - pos.x, z - pos.z));
  }
  faceUnit(unit) {
    this.face(unit.root.position.x, unit.root.position.z);
  }
  faceCell(cell) {
    let pos = this.cellToWorld(cell);
    this.face(pos.x, pos.z);
  }
  /** Camina por las casillas (con el walkTo de la figura o el propio); promesa al llegar. */
  walk(cells, { run = !1 } = {}) {
    if (!cells.length) return Promise.resolve();
    let points = cells.map((cell) => this.cellToWorld(cell));
    return (
      (this.cell = cells[cells.length - 1].slice()),
      this.wrapper || typeof this.ch.walkTo != 'function'
        ? this.ownWalk(points, run)
        : ('speed' in this.ch && (this.ch.speed = run ? 4.6 : 3.2),
          (this.walking = !0),
          new Promise((resolve) => {
            let done = !1,
              finish = () => {
                done || ((done = !0), (this.walking = !1), (this.root.position.y = points[points.length - 1].y), resolve());
              },
              res = this.ch.walkTo(points, finish, { run });
            res && typeof res.then == 'function' && res.then(finish);
            let clip = this.clip(run ? 'run' : 'jog');
            (clip && this.ch.actions && this.ch.play(this.ch.def?.walk && !run ? this.ch.def.walk : clip, 0.15),
              setTimeout(finish, 4e3 + cells.length * 2500));
          }))
    );
  }
  /** Caminar propio para figuras sin walkTo (ver stepRoute). */
  ownWalk(points, run) {
    return (
      (this.walking = !0),
      this.anim(run ? 'run' : 'walk', 0.15),
      new Promise((resolve) => {
        this.route = { pts: points.slice(), speed: run ? 4.6 : 3.2, resolve };
      })
    );
  }
  /** Avanza el caminar propio un fotograma. */
  stepRoute(dt) {
    let route = this.route,
      pos = this.root.position,
      budget = route.speed * dt;
    for (; budget > 0 && route.pts.length;) {
      let target = route.pts[0],
        dx = target.x - pos.x,
        dz = target.z - pos.z,
        dist = Math.hypot(dx, dz);
      if (dist > 1e-4) {
        let turn = Math.atan2(dx, dz) - this.root.rotation.y;
        ((turn = Math.atan2(Math.sin(turn), Math.cos(turn))), (this.root.rotation.y += turn * Math.min(1, dt * 12)));
      }
      dist <= budget
        ? (pos.set(target.x, target.y, target.z), route.pts.shift(), (budget -= dist))
        : ((pos.x += (dx / dist) * budget),
          (pos.z += (dz / dist) * budget),
          (pos.y += (target.y - pos.y) * Math.min(1, budget / Math.max(dist, 0.001))),
          (budget = 0));
    }
    route.pts.length || ((this.route = null), (this.walking = !1), this.idle(0.3), route.resolve());
  }
  /** Estado del anillo: idle, active (late), target, hover. */
  setRing(state) {
    this.ringState = state;
    let color =
      state === 'active'
        ? RING_COLORS.active
        : state === 'target'
          ? RING_COLORS.target
          : state === 'hover'
            ? 16777215
            : this.down || this.dead
              ? RING_COLORS.down
              : this.team === 0
                ? RING_COLORS.party
                : RING_COLORS.enemy;
    (this.ring.material.color.setHex(color),
      (this.ring.material.opacity = state === 'idle' ? (this.dead ? 0 : 0.55) : 0.95));
  }
  /** Fotograma: figura propia, caminar, giro, latido del anillo y hundimiento. */
  update(dt) {
    (this.owns && this.ch.update(dt), this.route && this.stepRoute(dt));
    let pos = this.root.position;
    if (
      (this.walking && !this.route && this.groundAt && (pos.y = this.groundAt(pos.x, pos.z)),
      this.syncHelpers(),
      this.targetYaw !== void 0 && !(this.ch.path && this.ch.path.length) && !this.walking)
    ) {
      let turn = this.targetYaw - this.root.rotation.y;
      ((turn = Math.atan2(Math.sin(turn), Math.cos(turn))),
        (this.root.rotation.y += turn * Math.min(1, dt * 9)),
        Math.abs(turn) < 0.01 && (this.targetYaw = void 0));
    }
    if (this.ringState === 'active') {
      this.t += dt;
      let pulse = 1 + Math.sin(this.t * 4) * 0.06;
      this.ring.scale.set(pulse, pulse, 1);
    } else this.ring.scale.set(1, 1, 1);
    this.fade !== void 0 &&
      this.root.visible &&
      ((this.fade = Math.max(0, this.fade - dt * 0.35)),
      (this.root.position.y = this.baseY - (1 - this.fade) * 1.3),
      this.fade <= 0 && (this.root.visible = !1));
  }
  /** Posición de la cabeza en el mundo. */
  headWorld(out = new Vector3()) {
    return this.wrapper && this.ch.head
      ? this.ch.head(out)
      : this.ch.headWorld
        ? this.ch.headWorld(out)
        : (this.root.getWorldPosition(out), (out.y += 1.6 * this.scale), out);
  }
  chest(out = new Vector3()) {
    return (this.headWorld(out), (out.y -= 0.35 * this.scale), out);
  }
  /** Acción de animación de un tipo de ataque (melee, ranged, thrown, spell, buff, unarmed). */
  attackAnim(kind) {
    return kind === 'melee'
      ? 'attack_melee'
      : kind === 'thrown'
        ? 'attack_thrown'
        : kind === 'spell'
          ? 'cast'
          : kind === 'buff'
            ? 'cast_buff'
            : kind === 'unarmed'
              ? 'attack_unarmed'
              : 'attack_ranged';
  }
  /** Animación de ataque. */
  attack(kind) {
    return this.once(this.attackAnim(kind), { speed: kind === 'melee' ? 1.25 : 1.1 });
  }
  /** Segundos desde el inicio del ataque hasta el impacto. */
  hitTime(kind) {
    let frac = kind === 'melee' ? 0.42 : kind === 'spell' || kind === 'buff' ? 0.45 : 0.4;
    return (this.length(this.attackAnim(kind), 1.1) / 1.2) * frac;
  }
  /** Animación de recibir un golpe. */
  hurt() {
    this.dead || this.down || this.once(Math.random() < 0.5 ? 'hit' : 'hit_head', { speed: 1.2 });
  }
  /** Derribado (o de pie otra vez). */
  prone(on) {
    this.dead || this.down || (on ? this.anim('prone', 0.25) : this.idle(0.3));
  }
  /** Cae a 0 PG (inconsciente). */
  fall() {
    ((this.down = !0),
      this.markDown(!0),
      this.once('die', { hold: !0, speed: 1.1 }),
      this.setRing(this.ringState));
  }
  /** Muere. */
  die() {
    (this.down || this.once('die', { hold: !0, speed: 1.1 }),
      (this.down = !0),
      (this.dead = !0),
      this.markDown(!0),
      this.setRing('idle'));
  }
  /** Tras `delay` s, la figura se hunde en el suelo y desaparece. */
  sink(delay = 2.5) {
    setTimeout(() => {
      ((this.baseY = this.root.position.y), (this.fade = 1));
    }, delay * 1e3);
  }
  /** Vuelve a estar en pie. */
  revive() {
    ((this.down = !1),
      this.markDown(!1),
      !this.wrapper && this.ch.current !== void 0 && (this.ch.current = null),
      this.idle(0.4),
      this.setRing(this.ringState));
  }
  /** Quita y libera el anillo y el cilindro. */
  detach() {
    (this.ring.parent?.remove(this.ring),
      this.proxy.parent?.remove(this.proxy),
      this.ring.geometry.dispose(),
      this.ring.material.dispose(),
      this.proxy.geometry.dispose());
  }
};

export { createUnits };
