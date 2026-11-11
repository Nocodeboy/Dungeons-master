// combat/units.js
// Reconstruido de publicado/juego.js (módulo __esm «f3»). Nombres locales aún minificados.

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

function u3() {
  let o = new Group(),
    e = new MeshStandardMaterial({ color: 5913118, roughness: 0.75 }),
    t = new QuadraticBezierCurve3(new Vector3(0, -0.48, 0), new Vector3(0, 0, 0.2), new Vector3(0, 0.48, 0));
  (o.add(new Mesh(new TubeGeometry(t, 18, 0.013, 6), e)),
    o.add(
      new Mesh(new CylinderGeometry(0.0025, 0.0025, 0.96, 4), new MeshBasicMaterial({ color: 14209208 })),
    ));
  let a = new Mesh(
    new CylinderGeometry(0.02, 0.02, 0.12, 6),
    new MeshStandardMaterial({ color: 2759184, roughness: 0.9 }),
  );
  return (
    (a.position.z = 0.15),
    o.add(a),
    o.traverse((n) => {
      n.isMesh && (n.castShadow = !0);
    }),
    o
  );
}
function h3() {
  let o = new Group(),
    e = new MeshStandardMaterial({ color: 5978914, roughness: 0.8 }),
    t = new Mesh(new CylinderGeometry(0.018, 0.022, 1.55, 8), e);
  ((t.position.y = 0.35), o.add(t));
  let a = new Mesh(
    new OctahedronGeometry(0.035),
    new MeshStandardMaterial({ color: 10475775, emissive: 3837904, emissiveIntensity: 2.2, roughness: 0.2 }),
  );
  return (
    (a.position.y = 1.18),
    o.add(a),
    o.traverse((n) => {
      n.isMesh && (n.castShadow = !0);
    }),
    o
  );
}
function vH(o) {
  return (e) => {
    let t = e.getObjectByName('Head');
    if (!t) return;
    let a = new MeshStandardMaterial({ color: o, roughness: 0.7 }),
      n = t.getWorldPosition(new Vector3()),
      s = new Matrix4().copy(t.matrixWorld).invert(),
      i = t.getWorldQuaternion(new Quaternion());
    for (let r of [-1, 1]) {
      let l = new Mesh(new ConeGeometry(0.045, 0.3, 6), a);
      l.scale.set(1, 1, 0.42);
      let c = n.clone().add(new Vector3(r * 0.08, 0.1, -0.01)),
        d = new Vector3(r * 1, 0.5, -0.22).normalize(),
        u = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), d);
      (l.position.copy(c.clone().applyMatrix4(s)),
        l.quaternion.copy(i.clone().invert().multiply(u)),
        l.translateY(0.12),
        (l.castShadow = !0),
        t.add(l));
    }
  };
}
function _H(o) {
  let e = xH[o.template] ?? 8033864,
    t = { id: o.id, skin: e, skinLum: !0, scale: 0.64, extras: vH(e), walk: 'Jog_Fwd_Loop' };
  return o.template === 'goblin_warrior' || o.template === 'goblin_boss'
    ? {
        ...t,
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
        scale: o.template === 'goblin_boss' ? 0.72 : 0.66,
      }
    : o.template === 'goblin_archer'
      ? {
          ...t,
          outfit: 'Male_Ranger',
          recolor: { from: 0.33, width: 0.2, shift: 0.02, sat: 0.6, val: 0.7 },
          extras: null,
          anim: 'Idle_Loop',
          attach: [{ make: u3, bone: 'hand_l', scale: 1, pos: [0, 0.08, 0], rot: [0, 0, 90] }],
        }
      : {
          ...t,
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
function wH(o, e = 0) {
  let t = l3[o.cls] || l3.fighter,
    a = t.outfit.startsWith('Female'),
    n = {
      id: o.id,
      outfit: t.outfit,
      variant: t.variant,
      hideParts: t.hideParts,
      recolor: t.recolor,
      anim: t.anim,
      skin: c3[e % c3.length],
      hair: a ? ['Hair_Long'] : e % 2 ? ['Hair_Beard', 'Hair_Buzzed'] : ['Hair_SimpleParted'],
      hairColor: d3[e % d3.length],
      walk: 'Jog_Fwd_Loop',
      attach: [],
    };
  return (
    t.weapon &&
      n.attach.push({ prop: t.weapon, bone: 'hand_r', scale: 0.6, pos: [0, 0.07, 0.03], rot: [0, 0, -90] }),
    t.shield &&
      n.attach.push({
        prop: 'q_Shield_Wooden',
        bone: 'lowerarm_l',
        scale: 0.85,
        pos: [0.06, 0.13, -0.05],
        rot: [0, 90, 0],
      }),
    t.staff && n.attach.push({ make: h3, bone: 'hand_r', scale: 1, pos: [0, 0.06, 0.02], rot: [0, 0, -90] }),
    t.bow && n.attach.push({ make: u3, bone: 'hand_l', scale: 1, pos: [0, 0.08, 0], rot: [0, 0, 90] }),
    (o.species === 'dwarf' || o.species === 'halfling' || o.species === 'gnome') && (n.scale = 0.8),
    n
  );
}
function TH(o, e) {
  let t = hc.find((n) => n.id === o.id);
  if (!t) return wH(o, e);
  let a = { ...t, ...yH[o.id] };
  return (delete a.pos, delete a.lookAt, (a.walk = 'Jog_Fwd_Loop'), a);
}
function MH() {
  if (Iu) return Iu;
  let o = document.createElement('canvas');
  o.width = o.height = 128;
  let e = o.getContext('2d');
  return (
    (e.strokeStyle = '#fff'),
    (e.lineWidth = 8),
    e.beginPath(),
    e.arc(64, 64, 52, 0, Math.PI * 2),
    e.stroke(),
    (e.globalAlpha = 0.35),
    (e.lineWidth = 3),
    e.setLineDash([8, 8]),
    e.beginPath(),
    e.arc(64, 64, 41, 0, Math.PI * 2),
    e.stroke(),
    (Iu = new CanvasTexture(o)),
    (Iu.colorSpace = SRGBColorSpace),
    Iu
  );
}
function EH(o) {
  let e = new Map();
  for (let t of o) t && e.set(t.id, t);
  return {
    byId: e,
    list: [...e.values()],
    proxies: [...e.values()].map((t) => t.proxy),
    add(t) {
      (e.set(t.id, t), (this.list = [...e.values()]), (this.proxies = this.list.map((a) => a.proxy)));
    },
    update(t) {
      for (let a of e.values()) a.update(t);
    },
  };
}
async function SH(o, e = 0) {
  if (isBeast(o.template)) return makeBeast(o.template, o.id);
  let t;
  return (
    o.team === 0 ? (t = TH(o, e)) : (o.template || '').startsWith('goblin') ? (t = _H(o)) : (t = humanoidMonsterLook(o)),
    Fs({ ...t, id: o.id })
  );
}
async function p3(o, e, t, { cellToWorld: a, makeMissing: n = null } = {}) {
  let s = [],
    i = 0;
  for (let r of e) {
    let l = t?.get?.(r.id) || null,
      c = !1;
    if (!l) {
      if (((l = n ? await n(r) : await SH(r, r.team === 0 ? i++ : 0)), !l)) continue;
      ((c = !0), o.add(l.root));
    }
    let d = new x1(r, l, { cellToWorld: a, owns: c });
    (o.add(d.ring, d.proxy),
      c ? (d.place(r.cell), (d.root.rotation.y = r.team === 0 ? i3(90) : i3(-90))) : d.syncHelpers(),
      s.push(d));
  }
  return EH(s);
}
const i3 = MathUtils.degToRad;
const r3 = {
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
const bH = {
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
const yH = {
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
    attach: [{ make: h3, bone: 'hand_r', scale: 1, pos: [0, 0.06, 0.02], rot: [0, 0, -90] }],
  },
};
const xH = { goblin_minion: 9421398, goblin_warrior: 8040008, goblin_archer: 10274914, goblin_boss: 6986302 };
const l3 = {
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
const c3 = [16770774, 15780008, 14264189, 11565650, 9067066];
const d3 = [2825492, 4858900, 11892794, 14731408, 1710618, 9058842];
let Iu = null;
const Jr = {
  party: 7328122,
  enemy: 14701375,
  active: 16765802,
  target: 16734778,
  ally: 9433248,
  down: 7829367,
};
const x1 = class {
  constructor(e, t, { cellToWorld: a = null, owns: n = !0 } = {}) {
    ((this.id = e.id),
      (this.team = e.team),
      (this.name = e.name),
      (this.template = e.template),
      (this.cls = e.cls),
      (this.ch = t),
      (this.root = t.root),
      (this.wrapper =
        typeof t.anim == 'function' && typeof t.once == 'function' && typeof t.playOnce != 'function'),
      (this.inner = this.wrapper ? t.ch || null : t),
      (this.cellToWorld = a || ((r) => cellToWorld(r[0], r[1]))),
      (this.owns = n),
      (this.cell = e.cell.slice()),
      (this.dead = !1),
      (this.down = !1));
    let s = this.inner || t;
    ((this.scale =
      s.def?.scale ?? (typeof s.scale == 'number' ? s.scale : null) ?? (this.root.scale?.x || 1)),
      !this.wrapper && t.def && (t.idle = t.idle || t.def.anim || 'Idle_Loop'),
      (this.ring = new Mesh(
        new PlaneGeometry(1.15, 1.15),
        new MeshBasicMaterial({
          map: MH(),
          color: e.team === 0 ? Jr.party : Jr.enemy,
          transparent: !0,
          opacity: 0.7,
          depthWrite: !1,
          toneMapped: !1,
        }),
      )),
      (this.ring.rotation.x = -Math.PI / 2),
      (this.ring.renderOrder = 2),
      (this.ringState = 'idle'));
    let i = 1.8 * Math.max(this.scale, 0.75);
    ((this.proxy = new Mesh(new CylinderGeometry(0.42, 0.42, i, 8), new MeshBasicMaterial({ visible: !1 }))),
      (this.proxyH = i / 2),
      (this.proxy.userData.unit = this.id),
      (this.t = Math.random() * 10),
      (this.walking = !1));
  }
  knows(e) {
    let t = this.inner;
    return t
      ? typeof t.has == 'function'
        ? t.has(e)
        : t.actions && typeof t.actions.has == 'function'
          ? t.actions.has(e)
          : Array.isArray(t.anims)
            ? t.anims.includes(e)
            : !1
      : !1;
  }
  clip(e) {
    if (this.wrapper)
      return this.inner && typeof this.inner.has == 'function' && this.inner.has(e)
        ? e
        : e === 'dodge'
          ? null
          : bH[e] || e;
    if (e === 'idle' && this.ch.idle && this.knows(this.ch.idle)) return this.ch.idle;
    if (this.knows(e)) return e;
    for (let t of r3[e] || []) if (this.knows(t)) return t;
    return this.ch.actions ? null : e;
  }
  anim(e, t = 0.25) {
    let a = this.clip(e);
    a && (this.wrapper ? this.ch.anim(a, { fade: t }) : this.ch.play(a, t));
  }
  once(e, t = {}) {
    let a = this.clip(e);
    return a
      ? this.wrapper
        ? Promise.resolve(this.ch.once(a, t)).catch(() => {})
        : (this.ch.playOnce && this.ch.playOnce(a, t)) || Promise.resolve()
      : Promise.resolve();
  }
  length(e, t = 1) {
    let a = this.clip(e),
      n = this.inner,
      s = 0;
    if (a && n?.clipLength && ((s = n.clipLength(a)), !(s > 0) && this.wrapper))
      for (let i of r3[e] || []) s > 0 || (s = n.clipLength(i));
    return s > 0 ? s : t;
  }
  setCharacter(e, t) {
    ((this.ch = e),
      (this.root = e.root),
      (this.owns = t),
      (this.wrapper =
        typeof e.anim == 'function' && typeof e.once == 'function' && typeof e.playOnce != 'function'),
      (this.inner = this.wrapper ? e.ch || null : e),
      (this._hand = void 0));
  }
  get mixer() {
    return this.inner?.mixer || null;
  }
  markDown(e = !0) {
    let t = this.inner || this.ch;
    (t && (t._mdgDown = e), (this.ch._mdgDown = e));
  }
  idle(e = 0.3) {
    this.dead || this.down || this.anim('idle', e);
  }
  place(e) {
    this.cell = e.slice();
    let t = this.cellToWorld(e);
    (this.root.position.set(t.x, t.y, t.z), this.syncHelpers());
  }
  syncHelpers() {
    let e = this.root.position;
    (this.ring.position.set(e.x, e.y + 0.03, e.z), this.proxy.position.set(e.x, e.y + this.proxyH, e.z));
  }
  face(e, t) {
    let a = this.root.position;
    Math.abs(e - a.x) + Math.abs(t - a.z) < 0.001 || (this.targetYaw = Math.atan2(e - a.x, t - a.z));
  }
  faceUnit(e) {
    this.face(e.root.position.x, e.root.position.z);
  }
  faceCell(e) {
    let t = this.cellToWorld(e);
    this.face(t.x, t.z);
  }
  walk(e, { run: t = !1 } = {}) {
    if (!e.length) return Promise.resolve();
    let a = e.map((n) => this.cellToWorld(n));
    return (
      (this.cell = e[e.length - 1].slice()),
      this.wrapper || typeof this.ch.walkTo != 'function'
        ? this.ownWalk(a, t)
        : ('speed' in this.ch && (this.ch.speed = t ? 4.6 : 3.2),
          (this.walking = !0),
          new Promise((n) => {
            let s = !1,
              i = () => {
                s || ((s = !0), (this.walking = !1), (this.root.position.y = a[a.length - 1].y), n());
              },
              r = this.ch.walkTo(a, i, { run: t });
            r && typeof r.then == 'function' && r.then(i);
            let l = this.clip(t ? 'run' : 'jog');
            (l && this.ch.actions && this.ch.play(this.ch.def?.walk && !t ? this.ch.def.walk : l, 0.15),
              setTimeout(i, 4e3 + e.length * 2500));
          }))
    );
  }
  ownWalk(e, t) {
    return (
      (this.walking = !0),
      this.anim(t ? 'run' : 'walk', 0.15),
      new Promise((a) => {
        this.route = { pts: e.slice(), speed: t ? 4.6 : 3.2, resolve: a };
      })
    );
  }
  stepRoute(e) {
    let t = this.route,
      a = this.root.position,
      n = t.speed * e;
    for (; n > 0 && t.pts.length;) {
      let s = t.pts[0],
        i = s.x - a.x,
        r = s.z - a.z,
        l = Math.hypot(i, r);
      if (l > 1e-4) {
        let c = Math.atan2(i, r) - this.root.rotation.y;
        ((c = Math.atan2(Math.sin(c), Math.cos(c))), (this.root.rotation.y += c * Math.min(1, e * 12)));
      }
      l <= n
        ? (a.set(s.x, s.y, s.z), t.pts.shift(), (n -= l))
        : ((a.x += (i / l) * n),
          (a.z += (r / l) * n),
          (a.y += (s.y - a.y) * Math.min(1, n / Math.max(l, 0.001))),
          (n = 0));
    }
    t.pts.length || ((this.route = null), (this.walking = !1), this.idle(0.3), t.resolve());
  }
  setRing(e) {
    this.ringState = e;
    let t =
      e === 'active'
        ? Jr.active
        : e === 'target'
          ? Jr.target
          : e === 'hover'
            ? 16777215
            : this.down || this.dead
              ? Jr.down
              : this.team === 0
                ? Jr.party
                : Jr.enemy;
    (this.ring.material.color.setHex(t),
      (this.ring.material.opacity = e === 'idle' ? (this.dead ? 0 : 0.55) : 0.95));
  }
  update(e) {
    (this.owns && this.ch.update(e), this.route && this.stepRoute(e));
    let t = this.root.position;
    if (
      (this.walking && !this.route && this.groundAt && (t.y = this.groundAt(t.x, t.z)),
      this.syncHelpers(),
      this.targetYaw !== void 0 && !(this.ch.path && this.ch.path.length) && !this.walking)
    ) {
      let a = this.targetYaw - this.root.rotation.y;
      ((a = Math.atan2(Math.sin(a), Math.cos(a))),
        (this.root.rotation.y += a * Math.min(1, e * 9)),
        Math.abs(a) < 0.01 && (this.targetYaw = void 0));
    }
    if (this.ringState === 'active') {
      this.t += e;
      let a = 1 + Math.sin(this.t * 4) * 0.06;
      this.ring.scale.set(a, a, 1);
    } else this.ring.scale.set(1, 1, 1);
    this.fade !== void 0 &&
      this.root.visible &&
      ((this.fade = Math.max(0, this.fade - e * 0.35)),
      (this.root.position.y = this.baseY - (1 - this.fade) * 1.3),
      this.fade <= 0 && (this.root.visible = !1));
  }
  headWorld(e = new Vector3()) {
    return this.wrapper && this.ch.head
      ? this.ch.head(e)
      : this.ch.headWorld
        ? this.ch.headWorld(e)
        : (this.root.getWorldPosition(e), (e.y += 1.6 * this.scale), e);
  }
  chest(e = new Vector3()) {
    return (this.headWorld(e), (e.y -= 0.35 * this.scale), e);
  }
  attackAnim(e) {
    return e === 'melee'
      ? 'attack_melee'
      : e === 'thrown'
        ? 'attack_thrown'
        : e === 'spell'
          ? 'cast'
          : e === 'buff'
            ? 'cast_buff'
            : e === 'unarmed'
              ? 'attack_unarmed'
              : 'attack_ranged';
  }
  attack(e) {
    return this.once(this.attackAnim(e), { speed: e === 'melee' ? 1.25 : 1.1 });
  }
  hitTime(e) {
    let t = e === 'melee' ? 0.42 : e === 'spell' || e === 'buff' ? 0.45 : 0.4;
    return (this.length(this.attackAnim(e), 1.1) / 1.2) * t;
  }
  hurt() {
    this.dead || this.down || this.once(Math.random() < 0.5 ? 'hit' : 'hit_head', { speed: 1.2 });
  }
  prone(e) {
    this.dead || this.down || (e ? this.anim('prone', 0.25) : this.idle(0.3));
  }
  fall() {
    ((this.down = !0),
      this.markDown(!0),
      this.once('die', { hold: !0, speed: 1.1 }),
      this.setRing(this.ringState));
  }
  die() {
    (this.down || this.once('die', { hold: !0, speed: 1.1 }),
      (this.down = !0),
      (this.dead = !0),
      this.markDown(!0),
      this.setRing('idle'));
  }
  sink(e = 2.5) {
    setTimeout(() => {
      ((this.baseY = this.root.position.y), (this.fade = 1));
    }, e * 1e3);
  }
  revive() {
    ((this.down = !1),
      this.markDown(!1),
      !this.wrapper && this.ch.current !== void 0 && (this.ch.current = null),
      this.idle(0.4),
      this.setRing(this.ringState));
  }
  detach() {
    (this.ring.parent?.remove(this.ring),
      this.proxy.parent?.remove(this.proxy),
      this.ring.geometry.dispose(),
      this.ring.material.dispose(),
      this.proxy.geometry.dispose());
  }
};

export { p3 };
