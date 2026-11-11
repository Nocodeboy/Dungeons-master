// explore/actors.js
// Reconstruido de publicado/juego.js (módulo __esm «xk»). Nombres locales aún minificados.

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
import { makeCharacter as Fs } from '../actors/character.js';
import { hc } from '../actors/roster.js';

function q1(o, e = 1.4) {
  o.traverse((t) => {
    if (!t.isMesh || !t.geometry) return;
    let a = t.geometry;
    (a.userData.mdgSphere ||
      (a.boundingSphere || a.computeBoundingSphere(),
      (a.boundingSphere.radius = Math.max(a.boundingSphere.radius, e)),
      (a.userData.mdgSphere = !0)),
      (t.frustumCulled = !0));
  });
}
function Y9(o) {
  let e = new Color(o),
    t = {};
  return (e.getHSL(t), t);
}
function vk(o, e = {}, t = 'm') {
  let a = t === 'f',
    n = /rogue|ranger|barbarian|knight/.test(e.model || ''),
    s = `${a ? 'Female' : 'Male'}_${n ? 'Ranger' : 'Peasant'}`,
    i = e.species || 'human',
    r = a ? ['Hair_Long'] : ['Hair_SimpleParted'];
  (i === 'dwarf' && !a && (r = ['Hair_Beard', 'Hair_Buzzed']),
    a && /mage|cleric/.test(e.model || '') && (r = ['Hair_Buns']));
  let l = {
    id: o,
    outfit: s,
    hair: r,
    hairColor: e.hair ? new Color(e.hair).getHex() : 4861984,
    skin: e.skin ? new Color(e.skin).getHex() : 15780008,
    scale: X9[i] ?? 1,
    anim: 'Idle_Loop',
    hideParts: n ? ['Hood'] : [],
  };
  if (e.cloth) {
    let c = n ? 0.33 : 0.08,
      d = Y9(e.cloth);
    l.recolor = { from: c, width: 0.16, shift: d.h - c, sat: Math.max(0.3, d.s * 1.4), val: 0.6 + d.l };
  }
  return l;
}
function J9(o) {
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
        d = new Vector3(r, 0.5, -0.22).normalize(),
        u = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), d);
      (l.position.copy(c.clone().applyMatrix4(s)),
        l.quaternion.copy(i.clone().invert().multiply(u)),
        l.translateY(0.12),
        t.add(l));
    }
  };
}
function Z9(o, e) {
  if (e.startsWith('goblin')) {
    let t = K9[e] ?? 8033864,
      a = e === 'goblin_warrior' || e === 'goblin_boss';
    return {
      id: o,
      skin: t,
      skinLum: !0,
      extras: J9(t),
      outfit: a || e === 'goblin_archer' ? 'Male_Ranger' : 'Male_Peasant',
      variant: a ? 'T_Ranger_3_BaseColor' : e === 'goblin_archer' ? void 0 : 'T_Peasant_2_BaseColor',
      hideParts: a ? ['Hood'] : [],
      recolor: a
        ? { from: 0.33, width: 0.2, shift: -0.27, sat: 0.55, val: 0.8 }
        : { from: 0.08, width: 0.16, shift: -0.02, sat: 0.75, val: 0.75 },
      anim: 'Sword_Idle',
      attach: a
        ? [{ prop: 'antique_estoc', bone: 'hand_r', scale: 0.48, pos: [0, 0.07, 0.03], rot: [0, 0, -90] }]
        : [{ prop: 'q_Sword_Bronze', bone: 'hand_r', scale: 0.42, pos: [0, 0.05, 0.02], rot: [0, 0, -90] }],
      scale: e === 'goblin_boss' ? 0.72 : 0.62,
    };
  }
  return e.startsWith('skeleton') || e === 'zombie' || e === 'wight'
    ? {
        id: o,
        skin: e === 'zombie' ? 8227942 : e === 'wight' ? 12105928 : 14735552,
        skinLum: !0,
        outfit: e === 'wight' ? 'Male_Ranger' : 'Male_Peasant',
        variant: e === 'wight' ? 'T_Ranger_3_BaseColor' : 'T_Peasant_2_BaseColor',
        hideParts: e === 'wight' ? [] : [],
        recolor: { from: 0.08, width: 0.3, shift: 0, sat: 0.1, val: e === 'wight' ? 0.45 : 0.7 },
        anim: 'Sword_Idle',
        scale: e === 'wight' ? 1.08 : 0.98,
        attach: [
          { prop: 'antique_estoc', bone: 'hand_r', scale: 0.6, pos: [0, 0.07, 0.03], rot: [0, 0, -90] },
        ],
      }
    : null;
}
function Q9(o, e = '#7d6334') {
  let t = `${o}|${e}`;
  if (U1.has(t)) return U1.get(t);
  let a = document.createElement('canvas');
  a.width = a.height = 128;
  let n = a.getContext('2d'),
    s = n.createRadialGradient(64, 50, 10, 64, 64, 80);
  (s.addColorStop(0, e),
    s.addColorStop(1, '#1e150f'),
    (n.fillStyle = s),
    n.fillRect(0, 0, 128, 128),
    (n.fillStyle = '#ecdfc4'),
    (n.font = '600 54px Cinzel, Georgia, serif'),
    (n.textAlign = 'center'),
    (n.textBaseline = 'middle'));
  let i = o
    .split(/\s+/)
    .filter((l) => l && l[0] === l[0].toUpperCase())
    .slice(0, 2)
    .map((l) => l[0])
    .join('');
  n.fillText(i || '?', 64, 68);
  let r = a.toDataURL('image/png');
  return (U1.set(t, r), r);
}
function Gu(o, e, t) {
  let a;
  return Promise.race([
    Promise.resolve(o).finally(() => clearTimeout(a)),
    new Promise((n, s) => (a = setTimeout(() => s(new Error(`${t}: no ha llegado en ${e / 1e3} s`)), e))),
  ]);
}
function yk(o, e = null) {
  let t = (s) => 1.75 * s,
    a = () => o.quality?.level ?? 1,
    n = (s, i) => {
      typeof s?.setShadows == 'function' &&
        (i === 'animal'
          ? s.setShadows(a() >= 2 ? 'cuerpo' : 'ninguna')
          : i !== 'member' && s.setShadows(a() >= 2 ? 'todas' : a() === 1 ? 'cuerpo' : 'ninguna'));
    };
  return {
    real: !!e,
    async member(s, i = {}) {
      let r = null;
      if (e?.makeHero)
        try {
          r = await Gu(e.makeHero({ ...i, id: s }, { prefer: 'melee' }), 45e3, `makeHero ${s}`);
        } catch (c) {
          console.warn('[exploraci\xF3n] makeHero:', c);
        }
      if (!r) {
        let c = hc.find((u) => u.id === s),
          d;
        if (c) ((d = { ...c, ...W9[s] }), delete d.pos, delete d.lookAt);
        else {
          let u = i.appearance || {};
          d = vk(
            s,
            {
              model: i.class === 'rogue' || i.class === 'ranger' ? 'ranger' : 'peasant',
              species: i.species,
              skin: u.skin,
              hair: u.hair,
              cloth: u.cloth || '#3a5a4a',
            },
            i.pronoun,
          );
        }
        ((d.anim = 'Idle_Loop'), (r = await Fs({ ...d, id: s })), q1(r.root));
      }
      let l = r.root.scale.x || 1;
      return new zc(r, { id: s, kind: 'member', height: r.height || t(l), name: i.name || s });
    },
    async npc(s) {
      let i = null;
      if (e?.makeNpc)
        try {
          i = await Gu(e.makeNpc(s), 3e4, `makeNpc ${s.id}`);
        } catch (r) {
          console.warn('[exploraci\xF3n] makeNpc:', r);
        }
      return (
        i || ((i = await Fs(vk(`npc_${s.id}`, s.visual, s.pronoun))), q1(i.root)),
        n(i, 'npc'),
        new zc(i, { id: s.id, kind: 'npc', height: i.height || t(i.root.scale.x || 1), name: s.name })
      );
    },
    async monster(s, i, r = 1) {
      let l = null;
      if (e?.makeMonster)
        try {
          l = await Gu(e.makeMonster(s, { index: Math.max(0, r - 1) }), 3e4, `makeMonster ${s}`);
        } catch (c) {
          console.warn('[exploraci\xF3n] makeMonster:', c);
        }
      if (!l) {
        let c = Z9(i, s);
        if (c)
          try {
            ((l = await Gu(Fs(c), 15e3, `makeCharacter ${s}`)), q1(l.root));
          } catch (d) {
            console.warn('[exploraci\xF3n] sustituto de monstruo:', d);
          }
        l || (l = new Vu(j1[s] ? s : 'wolf'));
      }
      return (
        n(l, 'enemy'),
        new zc(l, {
          id: i,
          kind: 'enemy',
          height: l.height || (l instanceof Vu ? 0.9 : t(l.root.scale.x || 1)),
          name: s,
        })
      );
    },
    async animal(s) {
      let i = null;
      if (e?.makeAnimal)
        try {
          i = await Gu(e.makeAnimal(s), 3e4, `makeAnimal ${s}`);
        } catch (r) {
          console.warn('[exploraci\xF3n] makeAnimal:', r);
        }
      return (
        i || (i = new Vu(s)),
        n(i, 'animal'),
        new zc(i, { id: s, kind: 'animal', height: i.height || 0.9 })
      );
    },
    async portrait(s, i = {}) {
      if (e?.portrait)
        try {
          let r = i.id && i.id !== 'hero' ? i.id : s?.ch || i,
            l = await e.portrait(r, { size: 128 });
          if (l) return l;
        } catch (r) {
          console.warn('[exploraci\xF3n] portrait:', r);
        }
      return Q9(i.name || s?.name || '?', eN[i.class] || '#7d6334');
    },
  };
}
const $9 = {
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
const zc = class {
  constructor(e, { id: t, kind: a, height: n = 1.7, name: s = '' } = {}) {
    ((this.ch = e),
      (this.root = e.root),
      (this.id = t),
      (this.kind = a),
      (this.name = s),
      (this.height = n),
      (this.cur = null),
      (this.speedScale = 1),
      (this._shadow = null),
      (this.logical = typeof e.has == 'function'),
      (this.ualMode = !this.logical && e.actions instanceof Map && !e.actions.has('idle')),
      (this.gait = e.gait || { walk: 1.35, run: 3.1, sprint: 5, crouch_walk: 1, sneak: 1 }));
  }
  _clip(e) {
    return this.logical
      ? bk[e] || e
      : this.ualMode
        ? e === 'idle'
          ? this.ch.idle || this.ch.def?.anim || 'Idle_Loop'
          : this.ch.actions.has(e)
            ? e
            : $9[e] || null
        : e;
  }
  anim(e, { fade: t = 0.2, speed: a = 1, mps: n = null } = {}) {
    if (n != null) {
      let i = this.gait[bk[e] || e] || this.gait[e];
      i && (a = Math.min(1.9, Math.max(0.55, n / (i * (this.root.scale?.x || 1)))));
    }
    if (this.cur === e && Math.abs(this.speedScale - a) < 0.02) return;
    let s = this._clip(e);
    if (((this.cur = e), (this.speedScale = a), !!s)) {
      if (this.logical) {
        this.ch.play(s, t, { speed: a });
        return;
      }
      if (this.ualMode) {
        let i = this.ch.actions.get(s);
        (i && (i.timeScale = a), this.ch.play(s, t));
      } else (this.ch.play(s, t), this.ch.setSpeed && this.ch.setSpeed(a));
    }
  }
  async once(e, { speed: t = 1, hold: a = !1 } = {}) {
    let n = this._clip(e);
    if (!n || !this.ch.playOnce) return;
    let s = this.cur;
    ((this.cur = null),
      await this.ch.playOnce(n, { speed: t, hold: a }),
      !a && s && !this.cur && this.anim(s));
  }
  update(e) {
    this.ch.update?.(e);
  }
  head(e = new Vector3()) {
    return (
      (this.ch.headWorld && (this.ch.headWorld(e), e.y > 0.2)) ||
        (this.root.getWorldPosition(e), (e.y += this.height * (this.root.scale?.y || 1))),
      e
    );
  }
  setShadowed(e) {
    if (this.logical && typeof this.ch.setTint == 'function') {
      this.ch.setTint(e ? 5921400 : null);
      return;
    }
    if (!this._shadow) {
      if (!e) return;
      ((this._shadow = []),
        this.root.traverse((t) => {
          !t.isMesh ||
            !t.material?.color ||
            ((t.material = t.material.clone()),
            this._shadow.push({ m: t.material, c: t.material.color.clone() }));
        }));
    }
    for (let t of this._shadow) t.m.color.copy(t.c).multiplyScalar(e ? 0.5 : 1);
  }
  dispose() {
    (this.root.parent?.remove(this.root), this.logical && this.ch.dispose?.());
  }
};
const bk = { sneak: 'crouch_walk', crouch: 'crouch_idle' };
const W9 = {
  brenna: {
    anim: 'Idle_Loop',
    attach: [{ prop: 'antique_estoc', bone: 'hand_r', scale: 0.62, pos: [0, 0.07, 0.03], rot: [0, 0, -90] }],
  },
  pip: { anim: 'Idle_Loop', attach: [] },
  ilyra: { anim: 'Idle_Loop', attach: [] },
  odvar: { anim: 'Idle_Loop' },
};
const X9 = { dwarf: 0.82, halfling: 0.72, gnome: 0.7, goliath: 1.1, orc: 1.04 };
const K9 = {
  goblin_minion: 9421398,
  goblin_warrior: 8040008,
  goblin_archer: 10274914,
  goblin_boss: 6986302,
  goblin_shaman: 8696410,
};
const j1 = {
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
const Vu = class {
  constructor(e) {
    let t = j1[e] || j1.sheep;
    ((this.def = t), (this.root = new Group()));
    let a = new MeshStandardMaterial({ color: t.color, roughness: 0.9, flatShading: !0 }),
      n = new MeshStandardMaterial({ color: t.belly, roughness: 0.9, flatShading: !0 }),
      [s, i, r] = t.body,
      l = new Mesh(new BoxGeometry(r, i, s), a);
    ((l.position.y = t.leg + i / 2), this.root.add(l), (this.body = l));
    let c = new Mesh(
      new BoxGeometry(t.head, t.head, t.head * 1.3),
      t.headColor ? new MeshStandardMaterial({ color: t.headColor, roughness: 0.9 }) : a,
    );
    if (
      (c.position.set(0, t.leg + i * (t.neck ? 1.35 : 0.9), s / 2 + t.head * 0.45),
      this.root.add(c),
      (this.headM = c),
      t.snout)
    ) {
      let h = new Mesh(new BoxGeometry(t.head * 0.5, t.head * 0.45, t.head * 0.6), n);
      (h.position.set(0, -t.head * 0.15, t.head * 0.8), c.add(h));
    }
    this.legs = [];
    let d = t.legs || 4,
      u = new BoxGeometry(0.07, t.leg, 0.07).translate(0, -t.leg / 2, 0);
    for (let h = 0; h < d; h++) {
      let p = new Mesh(u, n),
        m = h % 2 ? 1 : -1,
        _ = Math.floor(h / 2) / Math.max(1, d / 2 - 1);
      (p.position.set(m * (r / 2 - 0.03) * (t.legs ? 1.5 : 1), t.leg, (0.5 - _) * s * 0.8),
        t.legs && (p.rotation.z = m * 0.7),
        this.root.add(p),
        this.legs.push(p));
    }
    if (t.tail) {
      let h = new Mesh(new BoxGeometry(0.06, 0.06, 0.35).translate(0, 0, -0.17), a);
      (h.position.set(0, t.leg + i * 0.8, -s / 2), (h.rotation.x = 0.6), this.root.add(h));
    }
    (this.root.traverse((h) => {
      h.isMesh && ((h.castShadow = !0), (h.receiveShadow = !0));
    }),
      (this.t = Math.random() * 10),
      (this.mode = 'idle'),
      (this.rate = 1),
      (this.onceP = null));
  }
  play(e) {
    this.mode = e;
  }
  async playOnce(e, { hold: t = !1 } = {}) {
    if (((this.mode = e), e === 'die' || e === 'Death01')) {
      let a = this.root;
      for (let n = 0; n <= 10; n++)
        ((a.rotation.z = (n / 10) * 1.5), await new Promise((s) => setTimeout(s, 30)));
      return;
    }
    (await new Promise((a) => setTimeout(a, 450)), t || (this.mode = 'idle'));
  }
  setSpeed(e) {
    this.rate = e;
  }
  update(e) {
    this.t += e * this.rate;
    let t = ['walk', 'run', 'sneak', 'sprint', 'crouch_walk'].includes(this.mode),
      a = this.mode === 'run' || this.mode === 'sprint' ? 11 : 6;
    (this.legs.forEach((n, s) => {
      n.rotation.x = t ? Math.sin(this.t * a + (s % 2 ? 0 : Math.PI) + (s > 1 ? Math.PI : 0)) * 0.5 : 0;
    }),
      (this.body.position.y =
        this.def.leg +
        this.def.body[1] / 2 +
        (t ? Math.abs(Math.sin(this.t * a)) * 0.03 : Math.sin(this.t * 1.5) * 0.008)),
      this.mode === 'idle' || this.mode === 'graze'
        ? (this.headM.rotation.x = Math.max(0, Math.sin(this.t * 0.4)) * 0.6)
        : (this.headM.rotation.x = 0));
  }
  headWorld(e) {
    return this.headM.getWorldPosition(e);
  }
};
const U1 = new Map();
const eN = {
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

export { yk };
