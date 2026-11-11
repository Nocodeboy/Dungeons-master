// actors/hero-stage.js (antes outfits.js)
// Reconstruido de publicado/juego.js (módulo __esm «gu»).
//
// Pedestal 3D del héroe en el creador de personajes y en la subida de nivel: HeroStage monta la
// escena (suelo, peana de piedra con anillo de latón y runas, luces, polvo en suspensión) y gira la
// figura del héroe; HeroViewer la dibuja en su propio canvas con un WebGLRenderer y su bucle.
// legacyHeroDef traduce una hoja a la definición antigua de personaje (modelos Male/Female_Ranger o
// _Peasant con pelo, recoloreado y armas) para makeCharacter cuando no hay game.actors.
// Lo usan scenes/creator.js (HeroStage), ui/screens/creador.js y nivel.js (HeroViewer) y
// ui/portraits.js (legacyHeroDef).

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

/** Tono (HSL), saturación y valor (HSV) de un color. */
function colorHsv(hex) {
  let c = new Color(hex),
    hsl = {};
  c.getHSL(hsl);
  let max = Math.max(c.r, c.g, c.b),
    min = Math.min(c.r, c.g, c.b);
  return { h: hsl.h, s: max ? (max - min) / max : 0, v: max };
}
/** Bastón con gema brillante para los lanzadores de conjuros en la definición antigua. */
function makeStaffProp() {
  let group = new Group(),
    woodMat = new MeshStandardMaterial({ color: 5978914, roughness: 0.8 }),
    shaft = new Mesh(new CylinderGeometry(0.018, 0.022, 1.55, 8), woodMat);
  ((shaft.position.y = 0.35), group.add(shaft));
  let gem = new Mesh(
    new OctahedronGeometry(0.04),
    new MeshStandardMaterial({ color: 16762250, emissive: 16747066, emissiveIntensity: 2.4, roughness: 0.2 }),
  );
  return (
    (gem.position.y = 1.17),
    group.add(gem),
    group.traverse((obj) => obj.isMesh && (obj.castShadow = !0)),
    group
  );
}
/** Definición antigua de héroe para makeCharacter (modelo, pelo, recoloreado de la ropa, armas, escala). */
function legacyHeroDef(sheet) {
  let look = sheet.appearance || {},
    female = look.body === 'f' || (!look.body && sheet.pronoun === 'f'),
    martial = MARTIAL_CLASSES.has(sheet.class),
    outfit = `${female ? 'Female' : 'Male'}_${martial ? 'Ranger' : 'Peasant'}`,
    hairMesh = {
      raya: 'Hair_SimpleParted',
      largo: 'Hair_Long',
      mono: 'Hair_Buns',
      coleta: 'Hair_Long',
      trenza: 'Hair_Long',
      rapado: female ? 'Hair_BuzzedFemale' : 'Hair_Buzzed',
      cresta: 'Hair_Buzzed',
      calvo: null,
    }[look.hair || (female ? 'largo' : 'raya')],
    hair = [];
  (hairMesh && sheet.species !== 'dragonborn' && hair.push(hairMesh),
    !female && look.beard && look.beard !== 'ninguna' && hair.push('Hair_Beard'));
  let ref = martial
      ? { from: 0.33, width: 0.16, s: 0.45, v: 0.45 }
      : { from: 0.09, width: 0.12, s: 0.5, v: 0.5 },
    hsv = colorHsv(look.cloth1 || '#3f5f9a'),
    recolor = {
      from: ref.from,
      width: ref.width,
      shift: hsv.h - ref.from,
      sat: Math.max(0.15, Math.min(2.2, hsv.s / ref.s)),
      val: Math.max(0.45, Math.min(1.7, hsv.v / ref.v)),
    },
    attach = [];
  ['fighter', 'paladin'].includes(sheet.class)
    ? (attach.push({
        prop: 'antique_estoc',
        bone: 'hand_r',
        scale: 0.62,
        pos: [0, 0.07, 0.03],
        rot: [0, 0, -90],
      }),
      attach.push({
        prop: 'kite_shield',
        bone: 'lowerarm_l',
        scale: 0.48,
        pos: [0.08, 0.12, -0.02],
        rot: [0, 90, 90],
      }))
    : sheet.class === 'barbarian'
      ? attach.push({ prop: 'q_Axe_Bronze', bone: 'hand_r', scale: 1, pos: [0, 0.05, 0], rot: [0, 0, -90] })
      : ['wizard', 'sorcerer', 'druid', 'warlock'].includes(sheet.class)
        ? attach.push({
            make: makeStaffProp,
            bone: 'hand_r',
            scale: 1,
            pos: [0, 0.06, 0.02],
            rot: [0, 0, -90],
          })
        : sheet.class === 'cleric' &&
          attach.push({
            prop: 'q_Shield_Wooden',
            bone: 'lowerarm_l',
            scale: 0.9,
            pos: [0.06, 0.1, 0],
            rot: [0, 90, 90],
          });
  let scale = (SPECIES_HEIGHT[sheet.species] || 1) * (look.height || 1);
  return {
    id: 'heroe',
    outfit,
    hair,
    hairColor: look.hairColor || '#5a3a22',
    skin: look.skin || '#e0ac83',
    recolor,
    hideParts: ['Hood'],
    attach,
    scale,
    anim: martial && attach.length ? 'Sword_Idle' : 'Idle_Loop',
  };
}
/** Textura de canvas con el círculo de runas de la peana. */
function runesTexture() {
  let canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  let ctx = canvas.getContext('2d');
  (ctx.translate(256, 256),
    (ctx.strokeStyle = 'rgba(255,190,110,0.95)'),
    (ctx.fillStyle = 'rgba(255,190,110,0.95)'),
    (ctx.lineWidth = 4));
  for (let r of [238, 214]) (ctx.beginPath(), ctx.arc(0, 0, r, 0, Math.PI * 2), ctx.stroke());
  ctx.lineWidth = 3;
  for (let k = 0; k < 24; k++) {
    (ctx.save(), ctx.rotate((k / 24) * Math.PI * 2), ctx.translate(0, -226), ctx.beginPath());
    let kind = k % 4;
    (ctx.moveTo(-6, -8),
      ctx.lineTo(kind === 0 ? 6 : 0, 8),
      kind !== 1 && (ctx.moveTo(6, -8), ctx.lineTo(kind === 2 ? -6 : 0, 2)),
      kind === 3 && (ctx.moveTo(-6, 0), ctx.lineTo(6, 0)),
      ctx.stroke(),
      ctx.restore());
  }
  ((ctx.lineWidth = 5),
    ctx.beginPath(),
    ctx.moveTo(-70, -40),
    ctx.quadraticCurveTo(-40, -90, -10, -50),
    ctx.moveTo(70, -40),
    ctx.quadraticCurveTo(40, -90, 10, -50),
    ctx.moveTo(-28, -40),
    ctx.lineTo(0, 60),
    ctx.lineTo(28, -40),
    ctx.closePath(),
    ctx.stroke());
  let tex = new CanvasTexture(canvas);
  return ((tex.colorSpace = SRGBColorSpace), tex);
}
/** Textura de canvas del suelo: degradado radial cálido que se pierde en negro. */
function floorTexture() {
  let canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  let ctx = canvas.getContext('2d'),
    grad = ctx.createRadialGradient(128, 128, 4, 128, 128, 128);
  (grad.addColorStop(0, 'rgba(120,80,48,1)'),
    grad.addColorStop(0.35, 'rgba(60,40,26,1)'),
    grad.addColorStop(1, 'rgba(10,7,5,1)'),
    (ctx.fillStyle = grad),
    ctx.fillRect(0, 0, 256, 256));
  let tex = new CanvasTexture(canvas);
  return ((tex.colorSpace = SRGBColorSpace), tex);
}
const SPECIES_HEIGHT = {
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
const MARTIAL_CLASSES = new Set(['fighter', 'paladin', 'barbarian', 'ranger', 'rogue', 'monk']);
/**
 * Escena del pedestal del héroe. `setHero(hoja)` cambia la figura (solo si cambia su aspecto),
 * `drag(dx)` la gira, `update(dt)` anima y `frame(camera, rect)` encuadra la cámara en un rectángulo.
 */
const HeroStage = class {
  constructor(game) {
    ((this.game = game),
      (this.yaw = -0.35),
      (this.yawVel = 0),
      (this.lastTouch = -10),
      (this.time = 0),
      (this.token = 0),
      (this.vkey = ''),
      (this.hero = null),
      (this.disposables = []));
    let scene = (this.scene = new Scene());
    ((scene.background = new Color(657157)), (scene.fog = new Fog(657157, 8, 20)));
    let low = game.quality?.low,
      track = (obj) => (this.disposables.push(obj), obj),
      floor = new Mesh(
        track(new CircleGeometry(14, 48)),
        track(new MeshStandardMaterial({ map: track(floorTexture()), roughness: 1 })),
      );
    ((floor.rotation.x = -Math.PI / 2), (floor.receiveShadow = !0), scene.add(floor));
    let stoneMat = track(new MeshStandardMaterial({ color: 6050635, roughness: 0.92, metalness: 0 })),
      plinth = new Mesh(track(new CylinderGeometry(0.82, 0.92, 0.3, 48)), stoneMat);
    ((plinth.position.y = 0.15), (plinth.receiveShadow = !0), (plinth.castShadow = !0), scene.add(plinth));
    let base = new Mesh(track(new CylinderGeometry(1.02, 1.1, 0.12, 48)), stoneMat);
    ((base.position.y = 0.06), (base.receiveShadow = !0), scene.add(base));
    let brassMat = track(new MeshStandardMaterial({ color: 13215068, metalness: 0.85, roughness: 0.35 })),
      ring = new Mesh(track(new TorusGeometry(0.85, 0.022, 8, 64)), brassMat);
    ((ring.rotation.x = Math.PI / 2),
      (ring.position.y = 0.3),
      scene.add(ring),
      (this.runes = new Mesh(
        track(new CircleGeometry(0.8, 48)),
        track(
          new MeshBasicMaterial({
            map: track(runesTexture()),
            transparent: !0,
            opacity: 0.55,
            blending: AdditiveBlending,
            depthWrite: !1,
          }),
        ),
      )),
      (this.runes.rotation.x = -Math.PI / 2),
      (this.runes.position.y = 0.302),
      scene.add(this.runes),
      scene.add(new HemisphereLight(8021072, 657414, 1.3)));
    let key = new SpotLight(16767144, 85, 16, 0.52, 0.65, 1.6);
    (key.position.set(2.4, 5.2, 3.6),
      key.target.position.set(0, 0.9, 0),
      (key.castShadow = !low),
      key.shadow.mapSize.set(1024, 1024),
      (key.shadow.bias = -4e-4),
      scene.add(key, key.target),
      (this.keyLight = key));
    let rim = new DirectionalLight(8824575, 2.2);
    rim.position.set(-3, 3, -4);
    let warm = new DirectionalLight(16751184, 1.6);
    warm.position.set(3.2, 2.2, -3);
    let fill = new DirectionalLight(16769216, 1.25);
    (fill.position.set(-1.5, 2.2, 5), scene.add(rim, warm, fill), (this.sun = key));
    let dustCount = low ? 70 : 160,
      positions = new Float32Array(dustCount * 3);
    this.dustSeed = new Float32Array(dustCount);
    for (let k = 0; k < dustCount; k++) {
      let r = 0.4 + Math.random() * 2.4,
        ang = Math.random() * Math.PI * 2;
      ((positions[k * 3] = Math.cos(ang) * r),
        (positions[k * 3 + 1] = Math.random() * 3.2),
        (positions[k * 3 + 2] = Math.sin(ang) * r),
        (this.dustSeed[k] = Math.random() * 10));
    }
    let dustGeo = track(new BufferGeometry());
    (dustGeo.setAttribute('position', new BufferAttribute(positions, 3)),
      (this.dust = new Points(
        dustGeo,
        track(
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
      scene.add(this.dust),
      (this.root = new Group()),
      (this.root.position.y = 0.3),
      scene.add(this.root));
  }
  /** Clave que cambia solo si cambia el aspecto visible del héroe. */
  visualKey(sheet) {
    try {
      let look = this.game.actors?.heroLook?.(sheet);
      if (look) return JSON.stringify(look);
    } catch {}
    return JSON.stringify([
      sheet.species,
      sheet.lineage,
      sheet.ancestry,
      sheet.class,
      sheet.kit,
      sheet.size,
      sheet.appearance,
      sheet.pronoun,
      sheet.armor,
      sheet.weapons,
      sheet.shield,
    ]);
  }
  async setHero(sheet) {
    let key = this.visualKey(sheet);
    if (key === this.vkey && this.hero) return;
    this.vkey = key;
    let token = ++this.token,
      hero = null,
      actors = this.game.actors;
    try {
      ((hero = actors?.makeHero ? await actors.makeHero(sheet) : await makeCharacter(legacyHeroDef(sheet))),
        actors?.texturesReady && (await actors.texturesReady()));
    } catch (err) {
      console.warn('[interfaz] figura del h\xE9roe', err);
      return;
    }
    if (token !== this.token) {
      hero.dispose?.();
      return;
    }
    (actors?.makeHero && hero.play?.('idle', 0),
      this.hero && (this.root.remove(this.hero.root), actors?.makeHero && this.hero.dispose?.()),
      (this.hero = hero),
      hero.root.position.set(0, 0, 0),
      (hero.root.rotation.y = 0),
      this.root.add(hero.root),
      (this.height =
        (actors?.makeHero && hero.height) ||
        (SPECIES_HEIGHT[sheet.species] || 1) * (sheet.appearance?.height || 1) * 1.8),
      (this.pop = 0.25));
  }
  drag(dx) {
    ((this.yawVel = dx * 0.012), (this.yaw += dx * 0.012), (this.lastTouch = this.time));
  }
  update(dt) {
    if (
      ((this.time += dt),
      this.hero?.update?.(dt),
      this.time - this.lastTouch > 2.5 && (this.yaw += dt * 0.22),
      (this.root.rotation.y = this.yaw),
      this.pop > 0)
    ) {
      this.pop = Math.max(0, this.pop - dt);
      let k = 1 - this.pop / 0.25;
      this.root.scale.setScalar(0.94 + 0.06 * (1 - Math.pow(1 - k, 3)));
    }
    ((this.runes.material.opacity = 0.42 + Math.sin(this.time * 1.6) * 0.12),
      (this.runes.rotation.z += dt * 0.05));
    let pos = this.dust.geometry.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      let y = pos.getY(k) + dt * (0.05 + (this.dustSeed[k] % 1) * 0.06);
      (y > 3.3 && (y = 0.1),
        pos.setY(k, y),
        pos.setX(k, pos.getX(k) + Math.sin(this.time * 0.6 + this.dustSeed[k]) * dt * 0.03));
    }
    ((pos.needsUpdate = !0),
      (this.keyLight.intensity = 85 + Math.sin(this.time * 7.3) * 1.2 + Math.sin(this.time * 2.1) * 2));
  }
  /** Coloca la cámara para que el héroe quepa en `rect` (px) dentro de una vista de vw × vh. */
  frame(camera, rect, vw = innerWidth, vh = innerHeight) {
    if (!rect || rect.width < 10 || rect.height < 10) return;
    let height = (this.height || 1.8) + 0.3 + 0.25,
      tanHalf = Math.tan(MathUtils.degToRad(camera.fov / 2)),
      px = Math.min(rect.height * 0.9, rect.width * 1.9),
      dist = MathUtils.clamp((height * vh) / (px * 2 * tanHalf), 2.4, 14),
      lookY = height * 0.47;
    (camera.position.set(0, lookY + dist * 0.12, dist), camera.lookAt(0, lookY, 0), (this.lookY = lookY));
    let cx = rect.left + rect.width / 2,
      cy = rect.top + rect.height / 2;
    camera.setViewOffset(vw, vh, vw / 2 - cx, vh / 2 - cy, vw, vh);
  }
  dispose() {
    for (let d of this.disposables) d.dispose?.();
    this.scene.clear();
  }
};
/** HeroStage con renderer, cámara y bucle propios sobre `canvas` (pantallas del creador y de nivel). */
const HeroViewer = class {
  constructor(game, canvas) {
    ((this.stage = new HeroStage(game)),
      (this.canvas = canvas),
      (this.renderer = new WebGLRenderer({ canvas, antialias: !0, powerPreference: 'high-performance' })),
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, game.quality?.low ? 1 : 1.5)),
      (this.renderer.toneMapping = ACESFilmicToneMapping),
      (this.renderer.shadowMap.enabled = !game.quality?.low),
      (this.renderer.shadowMap.type = PCFShadowMap),
      (this.camera = new PerspectiveCamera(30, 1, 0.1, 100)),
      (this.last = performance.now()));
    let loop = (now) => {
      this.raf = requestAnimationFrame(loop);
      let dt = Math.min(0.05, (now - this.last) / 1e3);
      this.last = now;
      let w = canvas.clientWidth,
        h = canvas.clientHeight;
      !w ||
        !h ||
        ((canvas.width !== Math.round(w * this.renderer.getPixelRatio()) ||
          canvas.height !== Math.round(h * this.renderer.getPixelRatio())) &&
          (this.renderer.setSize(w, h, !1),
          (this.camera.aspect = w / h),
          this.camera.updateProjectionMatrix()),
        this.stage.update(dt),
        this.stage.frame(this.camera, { left: 0, top: 0, width: w, height: h }, w, h),
        this.renderer.render(this.stage.scene, this.camera));
    };
    this.raf = requestAnimationFrame(loop);
  }
  setHero(sheet) {
    return this.stage.setHero(sheet);
  }
  drag(dx) {
    this.stage.drag(dx);
  }
  dispose() {
    (cancelAnimationFrame(this.raf), this.stage.dispose(), this.renderer.dispose());
  }
};

export { legacyHeroDef, HeroStage, HeroViewer };
