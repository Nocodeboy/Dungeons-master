// actors/portraits.js
// Reconstruido de publicado/juego.js (módulo __esm «xT»).
//
// Retratos de personajes como imagen PNG (data URL): construye el personaje (o reutiliza su look),
// lo pone en reposo en una escena con luces propias, encuadra la cabeza (o el cuerpo si no tiene
// hueso de cabeza), lo dibuja con un WebGLRenderer compartido que se libera tras 15 s sin uso y
// compone un fondo pintado con viñeta. Los retratos se cachean por clave y se generan de uno en
// uno. Lo usa index.js (portrait), que la interfaz llama como game.portrait.

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
import { resolveAnimalKind } from './animals.js';

/** Guarda un renderer externo (no se usa: los retratos siempre usan su renderer propio). */
function setPortraitRenderer(r) {
  externalRenderer = r;
}
/** Renderer compartido de retratos a `size` px; programa su liberación tras 15 s sin uso. */
function portraitRenderer(size) {
  if (!sharedRenderer) {
    let canvas = document.createElement('canvas');
    ((sharedRenderer = new WebGLRenderer({ canvas, antialias: !0, alpha: !0, preserveDrawingBuffer: !0 })),
      (sharedRenderer.toneMapping = ACESFilmicToneMapping),
      (sharedRenderer.toneMappingExposure = 1.1),
      (sharedRenderer.outputColorSpace = SRGBColorSpace));
  }
  return (
    sharedRenderer.setPixelRatio(1),
    sharedRenderer.setSize(size, size, !1),
    clearTimeout(disposeTimer),
    (disposeTimer = setTimeout(() => {
      (sharedRenderer?.dispose(), sharedRenderer?.forceContextLoss?.(), (sharedRenderer = null));
    }, 15e3)),
    sharedRenderer
  );
}
/** Escena con luz de cielo, principal, de contra y de relleno. */
function portraitScene() {
  let scene = new Scene();
  scene.add(new HemisphereLight(15262426, 3812902, 1.1));
  let key = new DirectionalLight(16769216, 2.6);
  (key.position.set(1.2, 1.6, 2.2), scene.add(key));
  let rim = new DirectionalLight(10139903, 2);
  (rim.position.set(-1.6, 1.2, -1.8), scene.add(rim));
  let fill = new DirectionalLight(16763034, 0.5);
  return (fill.position.set(-2, 0.2, 1.5), scene.add(fill), scene);
}
/** Saca el Character de envoltorios (unidades de combate, actores de exploración: .ch, .inner…). */
function unwrapCharacter(x) {
  for (let k = 0; k < 4 && x && typeof x == 'object' && !(x.root && x.userData); k++) {
    let inner = x.ch || x.inner || x.character || x.actor || null;
    if (!inner || inner === x || typeof inner != 'object') break;
    x = inner;
  }
  return x;
}
function safeJson(x) {
  try {
    return JSON.stringify(x);
  } catch {
    return String(x?.id ?? Math.random());
  }
}
/** Clave de caché del retrato: id, look o los campos de la hoja que afectan al aspecto. */
function portraitKey(subject) {
  if (typeof subject == 'string') return `id:${subject}`;
  if (subject && subject.root && subject.userData)
    return subject.userData.look
      ? `look:${safeJson(subject.userData.look)}`
      : `ch:${subject.kind}:${subject.userData.monster || subject.userData.kind || subject.id}`;
  if (subject && typeof subject == 'object') {
    let {
      id,
      name,
      species,
      lineage,
      ancestry,
      size,
      pronoun,
      class: cls,
      armor,
      weapons,
      shield,
      appearance,
      visual,
    } = subject;
    return `sheet:${safeJson({ id, name, species, lineage, ancestry, size, pronoun, cls, armor, weapons, shield, appearance, visual })}`;
  }
  return `sheet:${safeJson(subject)}`;
}
/**
 * Construye una copia del personaje para el retrato: desde su look si es un Character humanoide, o
 * con `makers` (makeHero, makeNpc, makeMonster, makeCompanion, makeAnimal) según el id o la hoja.
 */
async function buildSubject(subject, makers) {
  if (subject && subject.root && subject.userData) {
    let look = subject.userData.look;
    if (look) {
      let { buildHumanoid } = await import('./humanoid.js');
      return buildHumanoid(look);
    }
    return subject.kind === 'animal'
      ? makers.makeAnimal(subject.userData.kind || subject.id)
      : subject.userData.monster
        ? makers.makeMonster(subject.userData.monster)
        : null;
  }
  if (typeof subject == 'string') {
    let id =
      { chief: 'goblin_boss', krazzik: 'goblin_boss', grisk: 'goblin_boss', vorhan: 'wight' }[subject] ||
      subject;
    return COMPANIONS[id]
      ? makers.makeCompanion(id)
      : NPC_LOOKS[id]
        ? makers.makeNpc({ id })
        : MONSTER_DEFS[id]
          ? makers.makeMonster(id)
          : resolveAnimalKind(id)
            ? makers.makeAnimal(id)
            : makers.makeNpc({ id });
  }
  return makers.makeHero(subject || {});
}
/** Encuadre de busto a partir de la cabeza. */
function frameHead(character, camera) {
  let head = character.headWorld(new Vector3()),
    k = character.height / 1.8,
    target = head.clone().add(new Vector3(0, 0.075 * k, 0)),
    dist = 1.06 * Math.max(0.55, k);
  (camera.position.set(target.x + dist * 0.28, target.y + dist * 0.06, target.z + dist * 0.96),
    camera.lookAt(target.x, target.y - 0.03 * k, target.z));
}
/** Encuadre por la caja del modelo (animales, araña); con `top`, la parte alta de la caja. */
function frameBounds(character, camera, top = !1) {
  let box = new Box3().setFromObject(character.root, !0),
    size = box.getSize(new Vector3());
  if (top) {
    let target = new Vector3(
        (box.min.x + box.max.x) / 2,
        box.max.y - size.y * 0.16,
        (box.min.z + box.max.z) / 2,
      ),
      reach = Math.max(0.5, size.y * 0.55);
    (camera.position.set(
      target.x + reach * 0.28,
      target.y + reach * 0.06,
      target.z + reach * 0.96 + size.z * 0.5,
    ),
      camera.lookAt(target));
    return;
  }
  let head = character.headBone
      ? character.headBone.getWorldPosition(new Vector3())
      : new Vector3(0, box.max.y - size.y * 0.25, box.max.z - size.z * 0.25),
    dist = Math.max(size.y, size.x) * 0.9 + 0.4;
  (camera.position.set(head.x + dist * 0.45, head.y + dist * 0.18, head.z + dist * 0.9),
    camera.lookAt(head.x, head.y - size.y * 0.05, head.z));
}
/** Fracción de píxeles no transparentes del lienzo (muestreo a 32 × 32). */
function coverage(canvas) {
  try {
    let small = document.createElement('canvas');
    small.width = small.height = 32;
    let ctx = small.getContext('2d', { willReadFrequently: !0 });
    ctx.drawImage(canvas, 0, 0, 32, 32);
    let data = ctx.getImageData(0, 0, 32, 32).data,
      count = 0;
    for (let k = 3; k < data.length; k += 4) data[k] > 24 && count++;
    return count / 1024;
  } catch {
    return 1;
  }
}
/** Colores del fondo pintado según el tipo de personaje (no muertos, monstruos, animales, héroes). */
function backdropColors(character) {
  let look = character.userData?.look || {};
  return look.family === 'skeleton' || look.family === 'zombie'
    ? ['#3a4652', '#0d1115', 'rgba(150,190,255,0.22)']
    : character.kind === 'monster' || look.family === 'goblin'
      ? ['#45472f', '#100f0b', 'rgba(255,170,90,0.20)']
      : character.kind === 'animal'
        ? ['#4a4634', '#12100c', 'rgba(255,220,160,0.18)']
        : ['#5c4532', '#140f0b', 'rgba(255,205,150,0.26)'];
}
/** Compone el retrato final: fondo pintado (o color, o transparente), figura y viñeta; devuelve PNG. */
function composePortrait(src, size, background, character) {
  let canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  let ctx = canvas.getContext('2d'),
    transparent = background === !1 || background === 'transparente' || background === 'transparent',
    painted = !transparent && (background == null || background === 'pintado');
  if (painted) {
    let [inner, outer, glow] = backdropColors(character),
      grad = ctx.createRadialGradient(
        size * 0.44,
        size * 0.4,
        size * 0.04,
        size * 0.5,
        size * 0.5,
        size * 0.78,
      );
    (grad.addColorStop(0, inner),
      grad.addColorStop(1, outer),
      (ctx.fillStyle = grad),
      ctx.fillRect(0, 0, size, size));
    let halo = ctx.createRadialGradient(size * 0.52, size * 0.38, 0, size * 0.52, size * 0.38, size * 0.42);
    (halo.addColorStop(0, glow),
      halo.addColorStop(1, 'rgba(0,0,0,0)'),
      (ctx.fillStyle = halo),
      ctx.fillRect(0, 0, size, size));
  } else transparent || ((ctx.fillStyle = background), ctx.fillRect(0, 0, size, size));
  if ((ctx.drawImage(src, 0, 0, size, size), painted)) {
    let vignette = ctx.createRadialGradient(
      size * 0.5,
      size * 0.42,
      size * 0.38,
      size * 0.5,
      size * 0.5,
      size * 0.8,
    );
    (vignette.addColorStop(0, 'rgba(0,0,0,0)'),
      vignette.addColorStop(1, 'rgba(0,0,0,0.45)'),
      (ctx.fillStyle = vignette),
      ctx.fillRect(0, 0, size, size));
  }
  return canvas.toDataURL('image/png');
}
/** Genera un retrato (data URL) o null si el personaje no se puede construir o queda vacío. */
async function renderPortrait(subject, { size = 256, background } = {}, makers) {
  let character = await buildSubject(subject, makers);
  if (!character) return null;
  await allTexturesReady();
  let scene = portraitScene();
  (scene.add(character.root),
    character.root.position.set(0, 0, 0),
    character.root.rotation.set(0, MathUtils.degToRad(-14), 0),
    (character.root.visible = !0),
    character.setLod?.(0),
    character.play('idle', 0),
    character.mixer && character.mixer.setTime(0.35));
  for (let post of character.post) post(0, character);
  (character.procedural?.update(0.35, character, !0),
    scene.updateMatrixWorld(!0),
    character.root.traverse((obj) => {
      obj.isSkinnedMesh && obj.skeleton.update();
    }));
  let camera = new PerspectiveCamera(26, 1, 0.05, 50),
    wholeBody =
      character.kind === 'animal' ||
      character.procedural ||
      !character.headBone ||
      character.headBone.isBone === !1;
  wholeBody ? frameBounds(character, camera) : frameHead(character, camera);
  let renderer = portraitRenderer(size);
  (renderer.setRenderTarget(null), renderer.setClearColor(0, 0));
  let rim = rimUniforms.uRim.value;
  ((rimUniforms.uRim.value = rim * 0.4), renderer.render(scene, camera));
  let cov = coverage(renderer.domElement);
  if (cov < 0.05) {
    (frameBounds(character, camera, !wholeBody), renderer.render(scene, camera));
    let cov2 = coverage(renderer.domElement);
    (console.warn('[personajes] retrato vac\xEDo con el primer encuadre', {
      id: character.id,
      cov,
      cov2,
      head: character.headWorld(new Vector3()).toArray(),
    }),
      (cov = cov2));
  }
  rimUniforms.uRim.value = rim;
  let url = null;
  return (
    cov >= 0.02 && (url = composePortrait(renderer.domElement, size, background, character)),
    scene.remove(character.root),
    character.dispose(),
    url
  );
}
/**
 * Retrato cacheado de un personaje, id u hoja: promesa de data URL (o null). `opts`: {size = 256,
 * background: 'pintado' | 'transparente' | color}. Las peticiones se encolan de una en una.
 */
function cachedPortrait(subject, opts = {}, makers) {
  subject = unwrapCharacter(subject);
  let key = `${portraitKey(subject)}|${opts.size || 256}|${opts.background ?? 'pintado'}`;
  if (!portraitCache.has(key)) {
    let job = queue
      .then(() => renderPortrait(subject, opts, makers))
      .then((url) => (url || portraitCache.delete(key), url))
      .catch((err) => (console.error('[personajes] retrato', err), portraitCache.delete(key), null));
    ((queue = job), portraitCache.set(key, job));
  }
  return portraitCache.get(key);
}
let sharedRenderer = null;
let externalRenderer = null;
let disposeTimer = 0;
const portraitCache = new Map();
let queue = Promise.resolve();

export { setPortraitRenderer, cachedPortrait };
