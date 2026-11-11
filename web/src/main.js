// main.js — Punto de entrada del juego web.
// Arma el contexto `game` (params, bus, store, stage, quality, scenes, actors, ui, audio, story, rules, api),
// registra las escenas «menu» y «explore», carga el núcleo de reglas (wasm) y arranca el bucle de fotogramas
// con calidad automática y tilt-shift en exploración. Ver web/MAPA.md («Arranque y contexto game»).

import { Timer, Vector2, Vector3 } from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { detectQuality } from './quality.js';
import { createStage } from './stage.js';
import { SceneManager } from './scenes.js';
import { Bus } from './bus.js';
import { getCap } from './caps.js';
import { Store } from './store.js';
import { loadRules, createApi } from './rules.js';
import { createUI } from './ui/index.js';
import { createAudio } from './audio/index.js';
import { createStory } from './story/index.js';
import { portrait } from './actors/index.js';
import * as actors from './actors/index.js';
import { loadingManager } from './assets.js';

/** Pasada de desenfoque gaussiano en una dirección, más fuerte lejos de la banda de foco. */
function makeBlurPass(direction) {
  return new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uDir: { value: direction },
      uRes: { value: new Vector2(1920, 1080) },
      uFocus: { value: 0.5 },
      uBand: { value: 0.2 },
      uAmount: { value: 1 },
      uMax: { value: 1.9 },
    },
    vertexShader:
      'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform vec2 uDir; uniform vec2 uRes; uniform float uFocus; uniform float uBand;
      uniform float uAmount; uniform float uMax; varying vec2 vUv;
      void main(){
        float d = max(0.0, abs(vUv.y - uFocus) - uBand);
        float r = smoothstep(0.0, 0.3, d) * uMax * uAmount;
        if (r < 0.05) { gl_FragColor = texture2D(tDiffuse, vUv); return; }
        vec2 st = uDir / uRes * r;
        vec4 c = texture2D(tDiffuse, vUv) * 0.2270270270;
        c += texture2D(tDiffuse, vUv + st * 1.3846153846) * 0.3162162162;
        c += texture2D(tDiffuse, vUv - st * 1.3846153846) * 0.3162162162;
        c += texture2D(tDiffuse, vUv + st * 3.2307692308) * 0.0702702703;
        c += texture2D(tDiffuse, vUv - st * 3.2307692308) * 0.0702702703;
        gl_FragColor = c;
      }`,
  });
}
/**
 * Tilt-shift (desenfoque por bandas horizontales) con dos pasadas insertadas en el compositor.
 * @param {number|null} index posición donde insertarlas (si es null, al final)
 * @returns {{passes, setSize, setFocus, setAmount}}
 */
function createTiltShift(composer, quality, index = null) {
  let blurX = makeBlurPass(new Vector2(1, 0)),
    blurY = makeBlurPass(new Vector2(0, 1)),
    passes = [blurX, blurY];
  index == null ? (composer.addPass(blurX), composer.addPass(blurY)) : (composer.insertPass(blurX, index), composer.insertPass(blurY, index + 1));
  let enabled = quality.level > 0;
  for (let pass of passes) pass.enabled = enabled;
  let tilt = {
    passes,
    setSize(width, height) {
      for (let pass of passes) pass.uniforms.uRes.value.set(width, height);
    },
    setFocus(focus) {
      for (let pass of passes) pass.uniforms.uFocus.value = focus;
    },
    setAmount(amount) {
      for (let pass of passes) ((pass.uniforms.uAmount.value = amount), (pass.enabled = enabled && amount > 0.01));
    },
  };
  return (
    tilt.setSize(innerWidth * (quality.pixelRatio || 1), innerHeight * (quality.pixelRatio || 1)),
    addEventListener('resize', () =>
      tilt.setSize(innerWidth * (quality.pixelRatio || 1), innerHeight * (quality.pixelRatio || 1)),
    ),
    tilt
  );
}
// Parámetros de la URL y errores de arranque (se muestran si falla boot).
var params = new URLSearchParams(location.search),
  bootErrors = [];
addEventListener('error', (event) => bootErrors.push((event.message || 'error').slice(0, 160)));
addEventListener('unhandledrejection', (event) =>
  bootErrors.push(String(event.reason?.message || event.reason).slice(0, 160)),
);
var bus = new Bus(),
  store = new Store(bus),
  savedQualityLevel = { baja: 0, media: 1, alta: 2 }[store.settings.quality];
savedQualityLevel !== void 0 && !params.has('calidad') && params.set('calidad', store.settings.quality);
var quality = detectQuality(params),
  canvas = document.getElementById('escena'),
  stage = createStage(canvas, quality),
  turbo = params.has('turbo'),
  tiltShift = createTiltShift(stage.composer, quality, stage.composer.passes.indexOf(stage.grade)),
  focusPoint = new Vector3();
/** Activa el tilt-shift solo en exploración, con calidad > 0 y si los ajustes lo permiten. */
function updateTiltShift() {
  let enabled =
    store.settings.tiltShift !== !1 &&
    quality.level > 0 &&
    game.scenes?.name === 'explore' &&
    !params.has('captura-nitida');
  tiltShift.setAmount(enabled ? 1 : 0);
}
if (params.has('escala')) {
  let ratio = Math.max(0.2, Math.min(2, Number(params.get('escala')) || 1));
  (stage.renderer.setPixelRatio(ratio), stage.composer.setPixelRatio(ratio), stage.resize());
}
/** Contexto del juego: lo reciben todas las escenas y áreas. */
var game = {
  params,
  bus,
  store,
  stage,
  quality,
  rules: null,
  api: null,
  ui: null,
  audio: null,
  story: null,
  caps: { get: getCap },
  errors: bootErrors,
  go: (name, sceneParams) => game.scenes.go(name, sceneParams),
};
game.scenes = new SceneManager(game);
game.actors = actors;
game.portrait = (who, opts) => portrait(who, opts);
game.ui = createUI(game);
game.audio = createAudio(game);
game.story = createStory(game);
loadingManager.onProgress = (url, loaded, total) => {
  let loadingEl = document.getElementById('carga'),
    visible = loadingEl && !loadingEl.hidden && !loadingEl.classList.contains('fuera');
  game.scenes.busy && visible && game.ui.loading?.('Cargando', loaded / Math.max(total, 1));
};
game.scenes.register('menu', () => import('./scenes/menu.js'));
bus.on('scene:enter', updateTiltShift);
bus.on('settings:changed', updateTiltShift);
bus.on('quality:changed', updateTiltShift);
game.scenes.register('explore', () => import('./scenes/explore.js'));
// Calidad automática: si la media de los fotogramas pasa de 1/24 s, baja un nivel.
var frameStats = { t: 0, n: 0, wait: 4 };
function autoQuality(dt) {
  if (quality.forced || params.has('captura') || quality.level === 0) return;
  if (frameStats.wait > 0) {
    frameStats.wait -= dt;
    return;
  }
  if (((frameStats.t += dt), frameStats.n++, frameStats.t < 2.5)) return;
  let avg = frameStats.t / frameStats.n;
  ((frameStats.t = 0),
    (frameStats.n = 0),
    avg > 1 / 24 &&
      (stage.setLevel(quality.level - 1, game.scenes.current?.sun),
      (frameStats.wait = 2),
      bus.emit('quality:changed', { level: quality.level }),
      console.info(`calidad ${quality.level} (media ${(1e3 * avg).toFixed(0)} ms por fotograma)`)));
}
var clock = new Timer();
/** Bucle principal: dt limitado (0,35 s con ?turbo), escena, tilt-shift, audio y render. */
function frame(time) {
  clock.update(time);
  let dt = clock.getDelta();
  autoQuality(dt);
  let step = Math.min(dt, turbo ? 0.35 : 1 / 20),
    elapsed = clock.getElapsed();
  if (
    (game.playtimeTick?.(dt),
    store.cp && (store.cp.playtime = (store.cp.playtime || 0) + dt),
    game.scenes.update(step, elapsed),
    tiltShift.passes[0].enabled &&
      (focusPoint.copy(stage.controls.target).project(stage.camera),
      tiltShift.setFocus(Math.min(0.85, Math.max(0.15, (focusPoint.y + 1) / 2)))),
    game.audio.update?.(step),
    stage.render(elapsed),
    game.scenes.afterRender(Math.min(dt, 0.1)),
    game.ready && params.has('captura') && ++game.framesReady >= Number(params.get('captura') || 2))
  ) {
    document.title = 'listo';
    return;
  }
  requestAnimationFrame(frame);
}
/** Carga el núcleo de reglas, crea la API y entra en la escena inicial (?escena o «menu»). */
async function boot() {
  (game.ui.loading('Despertando las reglas'),
    (game.rules = await loadRules()),
    (game.api = createApi(game.rules)),
    params.has('depurar') && (window.__mdg = game),
    requestAnimationFrame(frame),
    await game.go(params.get('escena') || 'menu', Object.fromEntries(params)),
    (game.framesReady = 0),
    (game.ready = !0));
}
boot().catch((err) => {
  (console.error(err),
    game.ui.loading(`No se ha podido arrancar: ${String(err.message || err).slice(0, 200)}`),
    (document.title = 'error ' + err.message));
});
