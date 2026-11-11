// actors/portraits.js
// Reconstruido de publicado/juego.js (módulo __esm «xT»). Nombres locales aún minificados.

import {
  ACESFilmicToneMapping,
  Box3,
  DirectionalLight,
  HemisphereLight,
  MathUtils,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { allTexturesReady, rimUniforms } from './materials.js';
import { COMPANIONS, NPC_LOOKS } from './companions.js';
import { MONSTER_DEFS } from './monsters.js';
import { uu } from './animals.js';

function vT(o) {
  nL = o;
}
function oL(o) {
  if (!rs) {
    let e = document.createElement('canvas');
    ((rs = new WebGLRenderer({ canvas: e, antialias: !0, alpha: !0, preserveDrawingBuffer: !0 })),
      (rs.toneMapping = ACESFilmicToneMapping),
      (rs.toneMappingExposure = 1.1),
      (rs.outputColorSpace = SRGBColorSpace));
  }
  return (
    rs.setPixelRatio(1),
    rs.setSize(o, o, !1),
    clearTimeout(fT),
    (fT = setTimeout(() => {
      (rs?.dispose(), rs?.forceContextLoss?.(), (rs = null));
    }, 15e3)),
    rs
  );
}
function sL() {
  let o = new Scene();
  o.add(new HemisphereLight(15262426, 3812902, 1.1));
  let e = new DirectionalLight(16769216, 2.6);
  (e.position.set(1.2, 1.6, 2.2), o.add(e));
  let t = new DirectionalLight(10139903, 2);
  (t.position.set(-1.6, 1.2, -1.8), o.add(t));
  let a = new DirectionalLight(16763034, 0.5);
  return (a.position.set(-2, 0.2, 1.5), o.add(a), o);
}
function iL(o) {
  for (let e = 0; e < 4 && o && typeof o == 'object' && !(o.root && o.userData); e++) {
    let t = o.ch || o.inner || o.character || o.actor || null;
    if (!t || t === o || typeof t != 'object') break;
    o = t;
  }
  return o;
}
function yv(o) {
  try {
    return JSON.stringify(o);
  } catch {
    return String(o?.id ?? Math.random());
  }
}
function rL(o) {
  if (typeof o == 'string') return `id:${o}`;
  if (o && o.root && o.userData)
    return o.userData.look
      ? `look:${yv(o.userData.look)}`
      : `ch:${o.kind}:${o.userData.monster || o.userData.kind || o.id}`;
  if (o && typeof o == 'object') {
    let {
      id: e,
      name: t,
      species: a,
      lineage: n,
      ancestry: s,
      size: i,
      pronoun: r,
      class: l,
      armor: c,
      weapons: d,
      shield: u,
      appearance: h,
      visual: p,
    } = o;
    return `sheet:${yv({ id: e, name: t, species: a, lineage: n, ancestry: s, size: i, pronoun: r, cls: l, armor: c, weapons: d, shield: u, appearance: h, visual: p })}`;
  }
  return `sheet:${yv(o)}`;
}
async function lL(o, e) {
  if (o && o.root && o.userData) {
    let t = o.userData.look;
    if (t) {
      let { buildHumanoid: a } = await import('./humanoid.js');
      return a(t);
    }
    return o.kind === 'animal'
      ? e.makeAnimal(o.userData.kind || o.id)
      : o.userData.monster
        ? e.makeMonster(o.userData.monster)
        : null;
  }
  if (typeof o == 'string') {
    let t = { chief: 'goblin_boss', krazzik: 'goblin_boss', grisk: 'goblin_boss', vorhan: 'wight' }[o] || o;
    return COMPANIONS[t]
      ? e.makeCompanion(t)
      : NPC_LOOKS[t]
        ? e.makeNpc({ id: t })
        : MONSTER_DEFS[t]
          ? e.makeMonster(t)
          : uu(t)
            ? e.makeAnimal(t)
            : e.makeNpc({ id: t });
  }
  return e.makeHero(o || {});
}
function cL(o, e) {
  let t = o.headWorld(new Vector3()),
    a = o.height / 1.8,
    n = t.clone().add(new Vector3(0, 0.075 * a, 0)),
    s = 1.06 * Math.max(0.55, a);
  (e.position.set(n.x + s * 0.28, n.y + s * 0.06, n.z + s * 0.96), e.lookAt(n.x, n.y - 0.03 * a, n.z));
}
function gT(o, e, t = !1) {
  let a = new Box3().setFromObject(o.root, !0),
    n = a.getSize(new Vector3());
  if (t) {
    let r = new Vector3((a.min.x + a.max.x) / 2, a.max.y - n.y * 0.16, (a.min.z + a.max.z) / 2),
      l = Math.max(0.5, n.y * 0.55);
    (e.position.set(r.x + l * 0.28, r.y + l * 0.06, r.z + l * 0.96 + n.z * 0.5), e.lookAt(r));
    return;
  }
  let s = o.headBone
      ? o.headBone.getWorldPosition(new Vector3())
      : new Vector3(0, a.max.y - n.y * 0.25, a.max.z - n.z * 0.25),
    i = Math.max(n.y, n.x) * 0.9 + 0.4;
  (e.position.set(s.x + i * 0.45, s.y + i * 0.18, s.z + i * 0.9), e.lookAt(s.x, s.y - n.y * 0.05, s.z));
}
function bT(o) {
  try {
    let e = document.createElement('canvas');
    e.width = e.height = 32;
    let t = e.getContext('2d', { willReadFrequently: !0 });
    t.drawImage(o, 0, 0, 32, 32);
    let a = t.getImageData(0, 0, 32, 32).data,
      n = 0;
    for (let s = 3; s < a.length; s += 4) a[s] > 24 && n++;
    return n / 1024;
  } catch {
    return 1;
  }
}
function dL(o) {
  let e = o.userData?.look || {};
  return e.family === 'skeleton' || e.family === 'zombie'
    ? ['#3a4652', '#0d1115', 'rgba(150,190,255,0.22)']
    : o.kind === 'monster' || e.family === 'goblin'
      ? ['#45472f', '#100f0b', 'rgba(255,170,90,0.20)']
      : o.kind === 'animal'
        ? ['#4a4634', '#12100c', 'rgba(255,220,160,0.18)']
        : ['#5c4532', '#140f0b', 'rgba(255,205,150,0.26)'];
}
function uL(o, e, t, a) {
  let n = document.createElement('canvas');
  n.width = n.height = e;
  let s = n.getContext('2d'),
    i = t === !1 || t === 'transparente' || t === 'transparent',
    r = !i && (t == null || t === 'pintado');
  if (r) {
    let [l, c, d] = dL(a),
      u = s.createRadialGradient(e * 0.44, e * 0.4, e * 0.04, e * 0.5, e * 0.5, e * 0.78);
    (u.addColorStop(0, l), u.addColorStop(1, c), (s.fillStyle = u), s.fillRect(0, 0, e, e));
    let h = s.createRadialGradient(e * 0.52, e * 0.38, 0, e * 0.52, e * 0.38, e * 0.42);
    (h.addColorStop(0, d), h.addColorStop(1, 'rgba(0,0,0,0)'), (s.fillStyle = h), s.fillRect(0, 0, e, e));
  } else i || ((s.fillStyle = t), s.fillRect(0, 0, e, e));
  if ((s.drawImage(o, 0, 0, e, e), r)) {
    let l = s.createRadialGradient(e * 0.5, e * 0.42, e * 0.38, e * 0.5, e * 0.5, e * 0.8);
    (l.addColorStop(0, 'rgba(0,0,0,0)'),
      l.addColorStop(1, 'rgba(0,0,0,0.45)'),
      (s.fillStyle = l),
      s.fillRect(0, 0, e, e));
  }
  return n.toDataURL('image/png');
}
async function hL(o, { size: e = 256, background: t } = {}, a) {
  let n = await lL(o, a);
  if (!n) return null;
  await allTexturesReady();
  let s = sL();
  (s.add(n.root),
    n.root.position.set(0, 0, 0),
    n.root.rotation.set(0, MathUtils.degToRad(-14), 0),
    (n.root.visible = !0),
    n.setLod?.(0),
    n.play('idle', 0),
    n.mixer && n.mixer.setTime(0.35));
  for (let h of n.post) h(0, n);
  (n.procedural?.update(0.35, n, !0),
    s.updateMatrixWorld(!0),
    n.root.traverse((h) => {
      h.isSkinnedMesh && h.skeleton.update();
    }));
  let i = new PerspectiveCamera(26, 1, 0.05, 50),
    r = n.kind === 'animal' || n.procedural || !n.headBone || n.headBone.isBone === !1;
  r ? gT(n, i) : cL(n, i);
  let l = oL(e);
  (l.setRenderTarget(null), l.setClearColor(0, 0));
  let c = rimUniforms.uRim.value;
  ((rimUniforms.uRim.value = c * 0.4), l.render(s, i));
  let d = bT(l.domElement);
  if (d < 0.05) {
    (gT(n, i, !r), l.render(s, i));
    let h = bT(l.domElement);
    (console.warn('[personajes] retrato vac\xEDo con el primer encuadre', {
      id: n.id,
      cov: d,
      cov2: h,
      head: n.headWorld(new Vector3()).toArray(),
    }),
      (d = h));
  }
  rimUniforms.uRim.value = c;
  let u = null;
  return (d >= 0.02 && (u = uL(l.domElement, e, t, n)), s.remove(n.root), n.dispose(), u);
}
function yT(o, e = {}, t) {
  o = iL(o);
  let a = `${rL(o)}|${e.size || 256}|${e.background ?? 'pintado'}`;
  if (!pu.has(a)) {
    let n = mT
      .then(() => hL(o, e, t))
      .then((s) => (s || pu.delete(a), s))
      .catch((s) => (console.error('[personajes] retrato', s), pu.delete(a), null));
    ((mT = n), pu.set(a, n));
  }
  return pu.get(a);
}
let rs = null;
let nL = null;
let fT = 0;
const pu = new Map();
let mT = Promise.resolve();

export { vT, yT };
