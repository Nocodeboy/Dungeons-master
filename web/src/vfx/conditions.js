// vfx/conditions.js
// Efectos visuales de estados y condiciones sobre cada unidad del combate («auras»): icono sobre la
// cabeza (el de mayor prioridad), anillo, cúpula o runas en el suelo, motas de partículas, telaraña,
// enredaderas, bandas de retención, imágenes del reflejo (copias fantasma del modelo) y cambios de
// aspecto del material (opacidad, emisivo). `auraStatesOf` traduce condiciones y efectos del núcleo
// a claves de `AURA_STYLES`; `AuraEffects` (vfx.auras en vfx/index.js) las mantiene por unidad.
// combat/controller.js llama a `vfx.auras.sync(id, anclaje, auraStatesOf(unidad))`.
// Reconstruido de publicado/juego.js (módulo __esm «r1»).

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
import { Dome, RuneCircle, Decal } from './shaders.js';

/**
 * Claves de aura que corresponden a una unidad del núcleo (sus `conditions` y `effects`, más
 * concentración y oculto). Omite las condiciones que ya muestra otro efecto (p. ej. «apresado» por
 * una telaraña) o que no se dibujan (derribado, inconsciente).
 */
function auraStatesOf(unit) {
  let states = new Set();
  if (!unit || unit.dead) return states;
  let effectKinds = new Set((unit.effects || []).map((effect) => effect.kind));
  for (let condition of unit.conditions || [])
    (condition === 'restrained' &&
      (effectKinds.has('webbed') ||
        effectKinds.has('spider_web') ||
        effectKinds.has('entangled') ||
        effectKinds.has('ensnared'))) ||
      condition === 'prone' ||
      condition === 'unconscious' ||
      (condition === 'paralyzed' && effectKinds.has('held')) ||
      (condition === 'incapacitated' && effectKinds.has('laughing')) ||
      (AURA_STYLES[condition] && states.add(condition));
  for (let kind of effectKinds) {
    let state =
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
      }[kind] || kind;
    AURA_STYLES[state] && states.add(state);
  }
  return (
    unit.concentration && states.add('concentration'),
    unit.hidden && states.add('hidden'),
    (unit.conditions || []).includes('unconscious') &&
      (effectKinds.has('sleep') || effectKinds.has('asleep') || effectKinds.has('sleeping')) &&
      states.add('sleeping'),
    states.has('invisible') && states.delete('hidden'),
    states
  );
}
/** Número al azar en [min, max). */
const randRange = (min, max) => min + Math.random() * (max - min);
// Aspecto de cada aura: glyph (icono sobre la cabeza; pri = prioridad), motes (partículas: rate por
// segundo y mode = dónde nacen), look (opacidad/emisivo del modelo), ring, dome, runes, web, vines,
// bands y ghosts (número de imágenes).
const AURA_STYLES = {
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
const tmpVec = new Vector3();
/**
 * Auras de una unidad. `anchor` da los puntos del modelo: feet(), head(), chest(), hand() opcional y
 * root (el objeto 3D, para fantasmas y aspecto).
 */
const UnitAuras = class {
  constructor(vfx, anchor) {
    ((this.vfx = vfx),
      (this.anchor = anchor),
      (this.states = new Map()),
      (this.glyph = -1),
      (this.glyphState = null),
      (this.t = Math.random() * 10),
      (this.lookKey = ''),
      (this.saved = null));
  }
  has(key) {
    return this.states.has(key);
  }
  /** Activa el aura `key` y crea sus piezas. */
  add(key) {
    if (this.states.has(key)) return;
    let def = AURA_STYLES[key] || {},
      state = { def, parts: [], acc: 0 },
      vfx = this.vfx,
      feet = this.anchor.feet();
    (def.ring &&
      state.parts.push(
        vfx.piece(
          new Decal(feet, {
            frame: FRAME.ring,
            color: def.ring,
            size: 1.25,
            life: 0,
            alpha: 0.55,
            glow: 1.6,
            spin: 0.6,
          }),
        ),
      ),
      def.dome &&
        state.parts.push(
          vfx.piece(
            new Dome(feet, {
              color: def.dome.col,
              radius: 0.95,
              life: 0,
              alpha: def.dome.alpha ?? 0.35,
              grow: !1,
              hex: def.dome.hex ?? 0,
            }),
          ),
        ),
      def.runes &&
        state.parts.push(
          vfx.piece(
            new RuneCircle(feet, {
              color: def.runes,
              radius: 0.75,
              life: 0,
              alpha: 0.45,
              spin: 0.5,
              glow: 1.6,
            }),
          ),
        ));
    for (let part of state.parts) part.keep = !0;
    (def.web && (state.web = this.makeWeb()),
      def.vines && (state.vines = this.makeVines(def.vines)),
      def.bands && (state.bands = this.makeBands(def.bands)),
      def.ghosts && (state.ghosts = this.makeGhosts(def.ghosts)),
      this.states.set(key, state),
      this.refreshGlyph(),
      this.refreshLook(),
      vfx.fx('aura_on', { state: key, at: feet }));
  }
  /** Desactiva el aura `key` y libera sus piezas. */
  remove(key) {
    let state = this.states.get(key);
    if (state) {
      for (let part of state.parts) this.vfx.remove(part);
      if (state.ghosts) {
        for (let { g: ghost } of state.ghosts.list) this.vfx.root.remove(ghost);
        state.ghosts.mat.dispose();
      }
      for (let kind of ['web', 'vines', 'bands'])
        if (state[kind]) {
          if (state[kind].pinned)
            for (let index of state[kind].pinned) (state[kind].pool || this.vfx.alp).kill(index);
          state[kind].mesh &&
            (this.vfx.root.remove(state[kind].mesh),
            state[kind].mesh.geometry?.dispose(),
            state[kind].mesh.material?.dispose());
        }
      (this.states.delete(key),
        this.refreshGlyph(),
        this.refreshLook(),
        this.vfx.fx('aura_off', { state: key, at: this.anchor.feet() }));
    }
  }
  makeWeb() {
    let pinned = [];
    for (let i = 0; i < 6; i++)
      pinned.push(
        this.vfx.alp.spawn({
          p: [0, 0, 0],
          life: 1,
          pinned: !0,
          size: randRange(0.7, 1.1),
          col: 16052970,
          a: 0.75,
          a1: 0.75,
          frame: FRAME.web,
          rot: Math.random() * 6,
        }),
      );
    return {
      pinned,
      pool: this.vfx.alp,
      offs: pinned.map((index, i) => [
        Math.cos(i * 2.1) * 0.25,
        0.25 + (i % 3) * 0.45,
        Math.sin(i * 2.1) * 0.25,
      ]),
    };
  }
  makeVines(color) {
    let pinned = [];
    for (let i = 0; i < 9; i++)
      pinned.push(
        this.vfx.alp.spawn({
          p: [0, 0, 0],
          life: 1,
          pinned: !0,
          size: randRange(0.18, 0.3),
          col: i % 3 ? color : 3828250,
          a: 0.95,
          a1: 0.95,
          frame: i % 3 ? FRAME.leaf : FRAME.thorn,
          rot: Math.random() * 6,
        }),
      );
    return {
      pinned,
      pool: this.vfx.alp,
      offs: pinned.map((index, i) => [
        Math.cos(i * 1.7) * 0.3,
        0.08 + (i / 9) * 0.7,
        Math.sin(i * 1.7) * 0.3,
      ]),
    };
  }
  /** Copias fantasma del modelo (imagen múltiple) que orbitan e imitan su pose. */
  makeGhosts(count) {
    let root = this.anchor.root;
    if (!root) return null;
    let template;
    try {
      template = clone(root);
    } catch {
      return null;
    }
    let material = new MeshBasicMaterial({
        color: new Color(10127615).multiplyScalar(1.2),
        transparent: !0,
        opacity: 0.32,
        blending: AdditiveBlending,
        depthWrite: !1,
      }),
      ghostify = (obj) => {
        let extras = [];
        obj.traverse((node) => {
          node.isLight || node.isSprite || node.isPoints
            ? extras.push(node)
            : node.isMesh &&
              ((node.material = material),
              (node.castShadow = !1),
              (node.receiveShadow = !1),
              (node.userData.vfxGhost = !0));
        });
        for (let node of extras) node.parent?.remove(node);
      };
    ghostify(template);
    let srcNodes = [];
    root.traverse((node) => srcNodes.push(node));
    let list = [];
    for (let i = 0; i < count; i++) {
      let ghost = i === 0 ? template : clone(template);
      i > 0 && ghostify(ghost);
      let dstNodes = [];
      (ghost.traverse((node) => dstNodes.push(node)),
        (ghost.userData.vfxGhost = !0),
        this.vfx.root.add(ghost),
        list.push({ g: ghost, dst: dstNodes }));
    }
    return { list, src: srcNodes, mat: material };
  }
  makeBands(color) {
    let geometry = new TorusGeometry(0.42, 0.025, 6, 32),
      col = new Color(color).multiplyScalar(2.2),
      material = new MeshBasicMaterial({
        color: col,
        transparent: !0,
        opacity: 0.8,
        blending: AdditiveBlending,
        depthWrite: !1,
      }),
      mesh = new InstancedMesh(geometry, material, 3);
    return (
      (mesh.frustumCulled = !1),
      this.vfx.root.add(mesh),
      { mesh, mat: new Matrix4(), q: new Quaternion() }
    );
  }
  /** Muestra sobre la cabeza el icono del aura activa de mayor prioridad. */
  refreshGlyph() {
    let bestKey = null,
      bestPri = -1;
    for (let [key, state] of this.states)
      state.def.glyph && (state.def.pri ?? 0) > bestPri && ((bestPri = state.def.pri ?? 0), (bestKey = key));
    if (
      bestKey !== this.glyphState &&
      (this.glyph >= 0 && this.vfx.add.kill(this.glyph),
      (this.glyph = -1),
      (this.glyphState = bestKey),
      bestKey)
    ) {
      let glyph = AURA_STYLES[bestKey].glyph;
      this.glyph = this.vfx.add.spawn({
        p: this.anchor.head(),
        life: 1,
        pinned: !0,
        size: glyph.size ?? 0.42,
        col: glyph.col,
        a: 0.95,
        a1: 0.95,
        frame: glyph.frame,
        rot: 0,
        spin: glyph.spin ?? 0,
        glow: 1.6,
      });
    }
  }
  /** Aplica al modelo la menor opacidad y el emisivo más intenso de las auras activas (clona materiales). */
  refreshLook() {
    let opacity = 1,
      emissive = null,
      intensity = 0;
    for (let state of this.states.values()) {
      let look = state.def.look;
      look &&
        (look.opacity !== void 0 && (opacity = Math.min(opacity, look.opacity)),
        look.emissive !== void 0 &&
          look.intensity > intensity &&
          ((emissive = look.emissive), (intensity = look.intensity)));
    }
    let lookKey = `${opacity}|${emissive}|${intensity}`;
    if (lookKey === this.lookKey || ((this.lookKey = lookKey), this.restoreLook(), opacity >= 1 && !emissive))
      return;
    let root = this.anchor.root;
    root &&
      ((this.saved = []),
      root.traverse((obj) => {
        if (!obj.isMesh || !obj.material || Array.isArray(obj.material) || obj.userData.vfxGhost) return;
        let original = obj.material,
          material = original.clone();
        ((material.onBeforeCompile = original.onBeforeCompile),
          (material.customProgramCacheKey = original.customProgramCacheKey),
          opacity < 1 &&
            ((material.transparent = !0),
            (material.opacity = original.opacity * opacity),
            (material.depthWrite = opacity > 0.5)),
          emissive &&
            material.emissive &&
            ((material.emissive = new Color(emissive)), (material.emissiveIntensity = intensity)),
          this.saved.push([obj, original, material]),
          (obj.material = material));
      }));
  }
  /** Devuelve al modelo sus materiales originales. */
  restoreLook() {
    if (this.saved) {
      for (let [obj, original, material] of this.saved)
        (obj.material === material && (obj.material = original), material.dispose());
      this.saved = null;
    }
  }
  update(dt) {
    this.t += dt;
    let anchor = this.anchor,
      feet = anchor.feet(),
      vfx = this.vfx,
      visible = anchor.root ? anchor.root.visible : !0,
      headPos = null,
      chestPos = null,
      head = () => (headPos ||= anchor.head()),
      chest = () => (chestPos ||= anchor.chest());
    if (this.glyph >= 0) {
      let pos = head();
      vfx.add.place(
        this.glyph,
        pos.x,
        pos.y + 0.55 + Math.sin(this.t * 2.2) * 0.05,
        pos.z,
        visible ? 0.95 : 0,
      );
    }
    for (let state of this.states.values()) {
      for (let part of state.parts)
        ((part.mesh.position.x = feet.x),
          (part.mesh.position.z = feet.z),
          (part.mesh.position.y =
            feet.y + (part instanceof Decal ? 0.04 : part instanceof RuneCircle ? 0.05 : 0)),
          (part.mesh.visible = visible));
      if (
        (state.web &&
          state.web.pinned.forEach((index, i) => {
            let off = state.web.offs[i];
            vfx.alp.place(index, feet.x + off[0], feet.y + off[1], feet.z + off[2], visible ? 0.75 : 0);
          }),
        state.vines &&
          state.vines.pinned.forEach((index, i) => {
            let off = state.vines.offs[i],
              sway = Math.sin(this.t * 1.5 + i) * 0.03;
            vfx.alp.place(
              index,
              feet.x + off[0] + sway,
              feet.y + off[1],
              feet.z + off[2],
              visible ? 0.95 : 0,
            );
          }),
        state.bands)
      ) {
        let bands = state.bands;
        for (let i = 0; i < 3; i++)
          (bands.q.setFromEuler(
            new Euler(
              Math.PI / 2 + Math.sin(this.t * 1.3 + i) * 0.25,
              this.t * (1 + i * 0.4),
              Math.cos(this.t + i) * 0.2,
            ),
          ),
            bands.mat.compose(
              tmpVec.set(feet.x, feet.y + 0.45 + i * 0.4, feet.z),
              bands.q,
              new Vector3(1, 1, 1),
            ),
            bands.mesh.setMatrixAt(i, bands.mat));
        ((bands.mesh.instanceMatrix.needsUpdate = !0), (bands.mesh.visible = visible));
      }
      if (state.ghosts) {
        let ghosts = state.ghosts,
          root = anchor.root;
        (root.updateMatrixWorld(),
          ghosts.list.forEach(({ g: ghost, dst }, i) => {
            let count = Math.min(dst.length, ghosts.src.length);
            for (let k = 1; k < count; k++) {
              let from = ghosts.src[k],
                to = dst[k];
              (to.position.copy(from.position),
                to.quaternion.copy(from.quaternion),
                to.scale.copy(from.scale));
            }
            let angle = this.t * 0.8 + (i * Math.PI * 2) / ghosts.list.length;
            (root.getWorldPosition(tmpVec),
              ghost.position.set(
                tmpVec.x + Math.cos(angle) * 0.55,
                tmpVec.y,
                tmpVec.z + Math.sin(angle) * 0.55,
              ),
              (ghost.rotation.y = root.rotation.y),
              ghost.scale.copy(root.scale),
              (ghost.visible = visible));
          }));
      }
      let motes = state.def.motes;
      if (motes && visible)
        for (state.acc += dt * motes.rate * Math.max(0.4, vfx.quality); state.acc >= 1;)
          ((state.acc -= 1), this.mote(motes, feet, head, chest));
    }
  }
  /** Emite una mota según `def.mode` (orbit, rise, fall, head, halo, body, feet, drip, hand, ghost). */
  mote(def, feet, head, chest) {
    let vfx = this.vfx,
      angle = Math.random() * Math.PI * 2,
      base = {
        col: def.col,
        frame: def.frame,
        size: def.size,
        size1: def.size * 0.4,
        glow: 1.6,
        blend: def.blend || 'add',
        a: def.blend === 'alpha' ? 0.6 : 0.9,
        spin: 1.5,
      };
    switch (def.mode) {
      case 'orbit': {
        let height = randRange(0.3, 1.6);
        vfx.p({
          ...base,
          p: [feet.x + Math.cos(angle) * 0.5, feet.y + height, feet.z + Math.sin(angle) * 0.5],
          v: [-Math.sin(angle) * 1.2, 0.15, Math.cos(angle) * 1.2],
          life: 0.9,
        });
        break;
      }
      case 'rise':
        vfx.p({
          ...base,
          p: [feet.x + Math.cos(angle) * 0.3, feet.y + randRange(0.1, 1.2), feet.z + Math.sin(angle) * 0.3],
          v: [0, randRange(0.5, 1.2), 0],
          life: 1,
        });
        break;
      case 'fall': {
        let pos = head();
        vfx.p({
          ...base,
          p: [pos.x + Math.cos(angle) * 0.4, pos.y + 0.6, pos.z + Math.sin(angle) * 0.4],
          v: [0, -0.6, 0],
          life: 1.4,
        });
        break;
      }
      case 'head': {
        let pos = head();
        vfx.p({
          ...base,
          p: [pos.x + Math.cos(angle) * 0.15, pos.y + 0.15, pos.z + Math.sin(angle) * 0.15],
          v: [Math.cos(angle) * 0.2, randRange(0.4, 0.8), Math.sin(angle) * 0.2],
          life: 1.2,
          size1: def.size * 1.8,
        });
        break;
      }
      case 'halo': {
        let pos = head(),
          orbitAngle = this.t * 4 + Math.random();
        vfx.p({
          ...base,
          p: [pos.x + Math.cos(orbitAngle) * 0.3, pos.y + 0.25, pos.z + Math.sin(orbitAngle) * 0.3],
          life: 0.5,
        });
        break;
      }
      case 'body': {
        let pos = chest();
        vfx.p({
          ...base,
          p: [
            pos.x + randRange(-0.3, 0.3),
            feet.y + randRange(0.1, (pos.y - feet.y) * 1.6),
            pos.z + randRange(-0.3, 0.3),
          ],
          v: [0, randRange(0.1, 0.6), 0],
          life: 0.8,
        });
        break;
      }
      case 'feet':
        vfx.p({
          ...base,
          p: [feet.x + Math.cos(angle) * 0.4, feet.y + 0.08, feet.z + Math.sin(angle) * 0.4],
          v: [-Math.sin(angle) * 0.8, 0.2, Math.cos(angle) * 0.8],
          life: 0.8,
        });
        break;
      case 'drip': {
        let pos = chest();
        vfx.p({
          ...base,
          p: [pos.x + randRange(-0.25, 0.25), pos.y + randRange(-0.3, 0.3), pos.z + randRange(-0.25, 0.25)],
          v: [0, -0.2, 0],
          grav: -6,
          life: 0.6,
        });
        break;
      }
      case 'hand': {
        let pos = this.anchor.hand ? this.anchor.hand() : chest();
        vfx.p({
          ...base,
          p: [pos.x + randRange(-0.06, 0.06), pos.y + randRange(-0.06, 0.1), pos.z + randRange(-0.06, 0.06)],
          v: [0, randRange(0.3, 0.9), 0],
          life: 0.4,
        });
        break;
      }
      case 'ghost': {
        let pos = chest(),
          radius = 0.7;
        vfx.p({
          ...base,
          p: [pos.x + Math.cos(angle) * radius, pos.y, pos.z + Math.sin(angle) * radius],
          life: 0.6,
          size1: def.size,
          a: 0.25,
        });
        break;
      }
      default:
        break;
    }
  }
  dispose() {
    for (let key of [...this.states.keys()]) this.remove(key);
    (this.glyph >= 0 && this.vfx.add.kill(this.glyph), this.restoreLook());
  }
};
/** Gestor de auras de todas las unidades, por id de unidad. */
const AuraEffects = class {
  constructor(vfx) {
    ((this.vfx = vfx), (this.units = new Map()));
  }
  unit(id, anchor) {
    let auras = this.units.get(id);
    return (
      auras
        ? anchor && (auras.anchor = anchor)
        : ((auras = new UnitAuras(this.vfx, anchor)), this.units.set(id, auras)),
      auras
    );
  }
  /** Activa o desactiva un aura de la unidad `id`. */
  set(id, anchor, key, on) {
    let auras = this.unit(id, anchor);
    on ? auras.add(key) : auras.remove(key);
  }
  /** Deja en la unidad `id` exactamente las auras de `keys`. */
  sync(id, anchor, keys) {
    let wanted = keys instanceof Set ? keys : new Set(keys),
      auras = this.unit(id, anchor);
    for (let key of [...auras.states.keys()]) wanted.has(key) || auras.remove(key);
    for (let key of wanted) auras.has(key) || auras.add(key);
  }
  /** Hace estallar una de las imágenes del reflejo de la unidad. */
  popGhost(id) {
    let ghosts = this.units.get(id)?.states.get('mirror_image')?.ghosts;
    if (!ghosts || !ghosts.list.length) return;
    let { g: ghost } = ghosts.list.pop();
    (this.vfx.burst(ghost.position.clone().setY(ghost.position.y + 0.9), {
      n: 16,
      col: 12628223,
      speed: 1.6,
      life: 0.6,
      size: 0.1,
      frame: FRAME.star,
      glow: 2,
    }),
      this.vfx.root.remove(ghost));
  }
  clear(id) {
    let auras = this.units.get(id);
    auras && (auras.dispose(), this.units.delete(id));
  }
  count() {
    let total = 0;
    for (let auras of this.units.values()) total += auras.states.size;
    return total;
  }
  /** Vuelve a crear todas las auras de todas las unidades (sin uso en el código actual). */
  repin() {
    for (let auras of this.units.values()) {
      let keys = [...auras.states.keys()];
      auras.dispose();
      for (let key of keys) auras.add(key);
    }
  }
  update(dt) {
    for (let auras of this.units.values()) auras.update(dt);
  }
  dispose() {
    for (let auras of this.units.values()) auras.dispose();
    this.units.clear();
  }
};

export { auraStatesOf, AuraEffects };
