// actors/outfits.js
// Reconstruido de publicado/juego.js (módulo __esm «gu»). Nombres locales aún minificados.

import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  PCFShadowMap,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  SRGBColorSpace,
  Scene,
  SpotLight,
  TorusGeometry,
  WebGLRenderer,
} from 'three';
import { makeCharacter } from './character.js';
import '../assets.js';

function vL(o) {
  let e = new Color(o),
    t = {};
  e.getHSL(t);
  let a = Math.max(e.r, e.g, e.b),
    n = Math.min(e.r, e.g, e.b);
  return { h: t.h, s: a ? (a - n) / a : 0, v: a };
}
function yL() {
  let o = new Group(),
    e = new MeshStandardMaterial({ color: 5978914, roughness: 0.8 }),
    t = new Mesh(new CylinderGeometry(0.018, 0.022, 1.55, 8), e);
  ((t.position.y = 0.35), o.add(t));
  let a = new Mesh(
    new OctahedronGeometry(0.04),
    new MeshStandardMaterial({ color: 16762250, emissive: 16747066, emissiveIntensity: 2.4, roughness: 0.2 }),
  );
  return ((a.position.y = 1.17), o.add(a), o.traverse((n) => n.isMesh && (n.castShadow = !0)), o);
}
function Tv(o) {
  let e = o.appearance || {},
    t = e.body === 'f' || (!e.body && o.pronoun === 'f'),
    a = bL.has(o.class),
    n = `${t ? 'Female' : 'Male'}_${a ? 'Ranger' : 'Peasant'}`,
    s = {
      raya: 'Hair_SimpleParted',
      largo: 'Hair_Long',
      mono: 'Hair_Buns',
      coleta: 'Hair_Long',
      trenza: 'Hair_Long',
      rapado: t ? 'Hair_BuzzedFemale' : 'Hair_Buzzed',
      cresta: 'Hair_Buzzed',
      calvo: null,
    }[e.hair || (t ? 'largo' : 'raya')],
    i = [];
  (s && o.species !== 'dragonborn' && i.push(s),
    !t && e.beard && e.beard !== 'ninguna' && i.push('Hair_Beard'));
  let r = a ? { from: 0.33, width: 0.16, s: 0.45, v: 0.45 } : { from: 0.09, width: 0.12, s: 0.5, v: 0.5 },
    l = vL(e.cloth1 || '#3f5f9a'),
    c = {
      from: r.from,
      width: r.width,
      shift: l.h - r.from,
      sat: Math.max(0.15, Math.min(2.2, l.s / r.s)),
      val: Math.max(0.45, Math.min(1.7, l.v / r.v)),
    },
    d = [];
  ['fighter', 'paladin'].includes(o.class)
    ? (d.push({ prop: 'antique_estoc', bone: 'hand_r', scale: 0.62, pos: [0, 0.07, 0.03], rot: [0, 0, -90] }),
      d.push({
        prop: 'kite_shield',
        bone: 'lowerarm_l',
        scale: 0.48,
        pos: [0.08, 0.12, -0.02],
        rot: [0, 90, 90],
      }))
    : o.class === 'barbarian'
      ? d.push({ prop: 'q_Axe_Bronze', bone: 'hand_r', scale: 1, pos: [0, 0.05, 0], rot: [0, 0, -90] })
      : ['wizard', 'sorcerer', 'druid', 'warlock'].includes(o.class)
        ? d.push({ make: yL, bone: 'hand_r', scale: 1, pos: [0, 0.06, 0.02], rot: [0, 0, -90] })
        : o.class === 'cleric' &&
          d.push({
            prop: 'q_Shield_Wooden',
            bone: 'lowerarm_l',
            scale: 0.9,
            pos: [0.06, 0.1, 0],
            rot: [0, 90, 90],
          });
  let u = (kT[o.species] || 1) * (e.height || 1);
  return {
    id: 'heroe',
    outfit: n,
    hair: i,
    hairColor: e.hairColor || '#5a3a22',
    skin: e.skin || '#e0ac83',
    recolor: c,
    hideParts: ['Hood'],
    attach: d,
    scale: u,
    anim: a && d.length ? 'Sword_Idle' : 'Idle_Loop',
  };
}
function xL() {
  let o = document.createElement('canvas');
  o.width = o.height = 512;
  let e = o.getContext('2d');
  (e.translate(256, 256),
    (e.strokeStyle = 'rgba(255,190,110,0.95)'),
    (e.fillStyle = 'rgba(255,190,110,0.95)'),
    (e.lineWidth = 4));
  for (let a of [238, 214]) (e.beginPath(), e.arc(0, 0, a, 0, Math.PI * 2), e.stroke());
  e.lineWidth = 3;
  for (let a = 0; a < 24; a++) {
    (e.save(), e.rotate((a / 24) * Math.PI * 2), e.translate(0, -226), e.beginPath());
    let n = a % 4;
    (e.moveTo(-6, -8),
      e.lineTo(n === 0 ? 6 : 0, 8),
      n !== 1 && (e.moveTo(6, -8), e.lineTo(n === 2 ? -6 : 0, 2)),
      n === 3 && (e.moveTo(-6, 0), e.lineTo(6, 0)),
      e.stroke(),
      e.restore());
  }
  ((e.lineWidth = 5),
    e.beginPath(),
    e.moveTo(-70, -40),
    e.quadraticCurveTo(-40, -90, -10, -50),
    e.moveTo(70, -40),
    e.quadraticCurveTo(40, -90, 10, -50),
    e.moveTo(-28, -40),
    e.lineTo(0, 60),
    e.lineTo(28, -40),
    e.closePath(),
    e.stroke());
  let t = new CanvasTexture(o);
  return ((t.colorSpace = SRGBColorSpace), t);
}
function _L() {
  let o = document.createElement('canvas');
  o.width = o.height = 256;
  let e = o.getContext('2d'),
    t = e.createRadialGradient(128, 128, 4, 128, 128, 128);
  (t.addColorStop(0, 'rgba(120,80,48,1)'),
    t.addColorStop(0.35, 'rgba(60,40,26,1)'),
    t.addColorStop(1, 'rgba(10,7,5,1)'),
    (e.fillStyle = t),
    e.fillRect(0, 0, 256, 256));
  let a = new CanvasTexture(o);
  return ((a.colorSpace = SRGBColorSpace), a);
}
const kT = {
  human: 1,
  elf: 1,
  half_elf: 1,
  dwarf: 0.8,
  halfling: 0.64,
  gnome: 0.6,
  dragonborn: 1.07,
  goliath: 1.15,
  orc: 1.05,
  half_orc: 1.03,
  tiefling: 1,
};
const bL = new Set(['fighter', 'paladin', 'barbarian', 'ranger', 'rogue', 'monk']);
const mu = class {
  constructor(e) {
    ((this.game = e),
      (this.yaw = -0.35),
      (this.yawVel = 0),
      (this.lastTouch = -10),
      (this.time = 0),
      (this.token = 0),
      (this.vkey = ''),
      (this.hero = null),
      (this.disposables = []));
    let t = (this.scene = new Scene());
    ((t.background = new Color(657157)), (t.fog = new Fog(657157, 8, 20)));
    let a = e.quality?.low,
      n = (v) => (this.disposables.push(v), v),
      s = new Mesh(
        n(new CircleGeometry(14, 48)),
        n(new MeshStandardMaterial({ map: n(_L()), roughness: 1 })),
      );
    ((s.rotation.x = -Math.PI / 2), (s.receiveShadow = !0), t.add(s));
    let i = n(new MeshStandardMaterial({ color: 6050635, roughness: 0.92, metalness: 0 })),
      r = new Mesh(n(new CylinderGeometry(0.82, 0.92, 0.3, 48)), i);
    ((r.position.y = 0.15), (r.receiveShadow = !0), (r.castShadow = !0), t.add(r));
    let l = new Mesh(n(new CylinderGeometry(1.02, 1.1, 0.12, 48)), i);
    ((l.position.y = 0.06), (l.receiveShadow = !0), t.add(l));
    let c = n(new MeshStandardMaterial({ color: 13215068, metalness: 0.85, roughness: 0.35 })),
      d = new Mesh(n(new TorusGeometry(0.85, 0.022, 8, 64)), c);
    ((d.rotation.x = Math.PI / 2),
      (d.position.y = 0.3),
      t.add(d),
      (this.runes = new Mesh(
        n(new CircleGeometry(0.8, 48)),
        n(
          new MeshBasicMaterial({
            map: n(xL()),
            transparent: !0,
            opacity: 0.55,
            blending: AdditiveBlending,
            depthWrite: !1,
          }),
        ),
      )),
      (this.runes.rotation.x = -Math.PI / 2),
      (this.runes.position.y = 0.302),
      t.add(this.runes),
      t.add(new HemisphereLight(8021072, 657414, 1.3)));
    let u = new SpotLight(16767144, 85, 16, 0.52, 0.65, 1.6);
    (u.position.set(2.4, 5.2, 3.6),
      u.target.position.set(0, 0.9, 0),
      (u.castShadow = !a),
      u.shadow.mapSize.set(1024, 1024),
      (u.shadow.bias = -4e-4),
      t.add(u, u.target),
      (this.keyLight = u));
    let h = new DirectionalLight(8824575, 2.2);
    h.position.set(-3, 3, -4);
    let p = new DirectionalLight(16751184, 1.6);
    p.position.set(3.2, 2.2, -3);
    let m = new DirectionalLight(16769216, 1.25);
    (m.position.set(-1.5, 2.2, 5), t.add(h, p, m), (this.sun = u));
    let _ = a ? 70 : 160,
      b = new Float32Array(_ * 3);
    this.dustSeed = new Float32Array(_);
    for (let v = 0; v < _; v++) {
      let x = 0.4 + Math.random() * 2.4,
        g = Math.random() * Math.PI * 2;
      ((b[v * 3] = Math.cos(g) * x),
        (b[v * 3 + 1] = Math.random() * 3.2),
        (b[v * 3 + 2] = Math.sin(g) * x),
        (this.dustSeed[v] = Math.random() * 10));
    }
    let f = n(new BufferGeometry());
    (f.setAttribute('position', new BufferAttribute(b, 3)),
      (this.dust = new Points(
        f,
        n(
          new PointsMaterial({
            color: 16763016,
            size: 0.03,
            transparent: !0,
            opacity: 0.6,
            blending: AdditiveBlending,
            depthWrite: !1,
          }),
        ),
      )),
      t.add(this.dust),
      (this.root = new Group()),
      (this.root.position.y = 0.3),
      t.add(this.root));
  }
  visualKey(e) {
    try {
      let t = this.game.actors?.heroLook?.(e);
      if (t) return JSON.stringify(t);
    } catch {}
    return JSON.stringify([
      e.species,
      e.lineage,
      e.ancestry,
      e.class,
      e.kit,
      e.size,
      e.appearance,
      e.pronoun,
      e.armor,
      e.weapons,
      e.shield,
    ]);
  }
  async setHero(e) {
    let t = this.visualKey(e);
    if (t === this.vkey && this.hero) return;
    this.vkey = t;
    let a = ++this.token,
      n = null,
      s = this.game.actors;
    try {
      ((n = s?.makeHero ? await s.makeHero(e) : await makeCharacter(Tv(e))),
        s?.texturesReady && (await s.texturesReady()));
    } catch (i) {
      console.warn('[interfaz] figura del h\xE9roe', i);
      return;
    }
    if (a !== this.token) {
      n.dispose?.();
      return;
    }
    (s?.makeHero && n.play?.('idle', 0),
      this.hero && (this.root.remove(this.hero.root), s?.makeHero && this.hero.dispose?.()),
      (this.hero = n),
      n.root.position.set(0, 0, 0),
      (n.root.rotation.y = 0),
      this.root.add(n.root),
      (this.height = (s?.makeHero && n.height) || (kT[e.species] || 1) * (e.appearance?.height || 1) * 1.8),
      (this.pop = 0.25));
  }
  drag(e) {
    ((this.yawVel = e * 0.012), (this.yaw += e * 0.012), (this.lastTouch = this.time));
  }
  update(e) {
    if (
      ((this.time += e),
      this.hero?.update?.(e),
      this.time - this.lastTouch > 2.5 && (this.yaw += e * 0.22),
      (this.root.rotation.y = this.yaw),
      this.pop > 0)
    ) {
      this.pop = Math.max(0, this.pop - e);
      let a = 1 - this.pop / 0.25;
      this.root.scale.setScalar(0.94 + 0.06 * (1 - Math.pow(1 - a, 3)));
    }
    ((this.runes.material.opacity = 0.42 + Math.sin(this.time * 1.6) * 0.12),
      (this.runes.rotation.z += e * 0.05));
    let t = this.dust.geometry.attributes.position;
    for (let a = 0; a < t.count; a++) {
      let n = t.getY(a) + e * (0.05 + (this.dustSeed[a] % 1) * 0.06);
      (n > 3.3 && (n = 0.1),
        t.setY(a, n),
        t.setX(a, t.getX(a) + Math.sin(this.time * 0.6 + this.dustSeed[a]) * e * 0.03));
    }
    ((t.needsUpdate = !0),
      (this.keyLight.intensity = 85 + Math.sin(this.time * 7.3) * 1.2 + Math.sin(this.time * 2.1) * 2));
  }
  frame(e, t, a = innerWidth, n = innerHeight) {
    if (!t || t.width < 10 || t.height < 10) return;
    let s = (this.height || 1.8) + 0.3 + 0.25,
      i = Math.tan(MathUtils.degToRad(e.fov / 2)),
      r = Math.min(t.height * 0.9, t.width * 1.9),
      l = MathUtils.clamp((s * n) / (r * 2 * i), 2.4, 14),
      c = s * 0.47;
    (e.position.set(0, c + l * 0.12, l), e.lookAt(0, c, 0), (this.lookY = c));
    let d = t.left + t.width / 2,
      u = t.top + t.height / 2;
    e.setViewOffset(a, n, a / 2 - d, n / 2 - u, a, n);
  }
  dispose() {
    for (let e of this.disposables) e.dispose?.();
    this.scene.clear();
  }
};
const pc = class {
  constructor(e, t) {
    ((this.stage = new mu(e)),
      (this.canvas = t),
      (this.renderer = new WebGLRenderer({ canvas: t, antialias: !0, powerPreference: 'high-performance' })),
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, e.quality?.low ? 1 : 1.5)),
      (this.renderer.toneMapping = ACESFilmicToneMapping),
      (this.renderer.shadowMap.enabled = !e.quality?.low),
      (this.renderer.shadowMap.type = PCFShadowMap),
      (this.camera = new PerspectiveCamera(30, 1, 0.1, 100)),
      (this.last = performance.now()));
    let a = (n) => {
      this.raf = requestAnimationFrame(a);
      let s = Math.min(0.05, (n - this.last) / 1e3);
      this.last = n;
      let i = t.clientWidth,
        r = t.clientHeight;
      !i ||
        !r ||
        ((t.width !== Math.round(i * this.renderer.getPixelRatio()) ||
          t.height !== Math.round(r * this.renderer.getPixelRatio())) &&
          (this.renderer.setSize(i, r, !1),
          (this.camera.aspect = i / r),
          this.camera.updateProjectionMatrix()),
        this.stage.update(s),
        this.stage.frame(this.camera, { left: 0, top: 0, width: i, height: r }, i, r),
        this.renderer.render(this.stage.scene, this.camera));
    };
    this.raf = requestAnimationFrame(a);
  }
  setHero(e) {
    return this.stage.setHero(e);
  }
  drag(e) {
    this.stage.drag(e);
  }
  dispose() {
    (cancelAnimationFrame(this.raf), this.stage.dispose(), this.renderer.dispose());
  }
};

export { Tv, mu, pc };
