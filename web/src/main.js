// main.js
// Reconstruido de publicado/juego.js (parte sin envolver del final del bundle). Nombres locales aún minificados.

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

function makeBlurPass(o) {
  return new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uDir: { value: o },
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
function createTiltShift(o, e, t = null) {
  let a = makeBlurPass(new Vector2(1, 0)),
    n = makeBlurPass(new Vector2(0, 1)),
    s = [a, n];
  t == null ? (o.addPass(a), o.addPass(n)) : (o.insertPass(a, t), o.insertPass(n, t + 1));
  let i = e.level > 0;
  for (let l of s) l.enabled = i;
  let r = {
    passes: s,
    setSize(l, c) {
      for (let d of s) d.uniforms.uRes.value.set(l, c);
    },
    setFocus(l) {
      for (let c of s) c.uniforms.uFocus.value = l;
    },
    setAmount(l) {
      for (let c of s) ((c.uniforms.uAmount.value = l), (c.enabled = i && l > 0.01));
    },
  };
  return (
    r.setSize(innerWidth * (e.pixelRatio || 1), innerHeight * (e.pixelRatio || 1)),
    addEventListener('resize', () =>
      r.setSize(innerWidth * (e.pixelRatio || 1), innerHeight * (e.pixelRatio || 1)),
    ),
    r
  );
}
var params = new URLSearchParams(location.search),
  bootErrors = [];
addEventListener('error', (o) => bootErrors.push((o.message || 'error').slice(0, 160)));
addEventListener('unhandledrejection', (o) =>
  bootErrors.push(String(o.reason?.message || o.reason).slice(0, 160)),
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
function updateTiltShift() {
  let o =
    store.settings.tiltShift !== !1 &&
    quality.level > 0 &&
    game.scenes?.name === 'explore' &&
    !params.has('captura-nitida');
  tiltShift.setAmount(o ? 1 : 0);
}
if (params.has('escala')) {
  let o = Math.max(0.2, Math.min(2, Number(params.get('escala')) || 1));
  (stage.renderer.setPixelRatio(o), stage.composer.setPixelRatio(o), stage.resize());
}
var game = {
  params: params,
  bus: bus,
  store: store,
  stage: stage,
  quality: quality,
  rules: null,
  api: null,
  ui: null,
  audio: null,
  story: null,
  caps: { get: getCap },
  errors: bootErrors,
  go: (o, e) => game.scenes.go(o, e),
};
game.scenes = new SceneManager(game);
game.actors = actors;
game.portrait = (o, e) => portrait(o, e);
game.ui = createUI(game);
game.audio = createAudio(game);
game.story = createStory(game);
loadingManager.onProgress = (o, e, t) => {
  let a = document.getElementById('carga'),
    n = a && !a.hidden && !a.classList.contains('fuera');
  game.scenes.busy && n && game.ui.loading?.('Cargando', e / Math.max(t, 1));
};
game.scenes.register('menu', () => import('./scenes/menu.js'));
bus.on('scene:enter', updateTiltShift);
bus.on('settings:changed', updateTiltShift);
bus.on('quality:changed', updateTiltShift);
game.scenes.register('explore', () => import('./scenes/explore.js'));
var frameStats = { t: 0, n: 0, wait: 4 };
function autoQuality(o) {
  if (quality.forced || params.has('captura') || quality.level === 0) return;
  if (frameStats.wait > 0) {
    frameStats.wait -= o;
    return;
  }
  if (((frameStats.t += o), frameStats.n++, frameStats.t < 2.5)) return;
  let e = frameStats.t / frameStats.n;
  ((frameStats.t = 0),
    (frameStats.n = 0),
    e > 1 / 24 &&
      (stage.setLevel(quality.level - 1, game.scenes.current?.sun),
      (frameStats.wait = 2),
      bus.emit('quality:changed', { level: quality.level }),
      console.info(`calidad ${quality.level} (media ${(1e3 * e).toFixed(0)} ms por fotograma)`)));
}
var clock = new Timer();
function frame(o) {
  clock.update(o);
  let e = clock.getDelta();
  autoQuality(e);
  let t = Math.min(e, turbo ? 0.35 : 1 / 20),
    a = clock.getElapsed();
  if (
    (game.playtimeTick?.(e),
    store.cp && (store.cp.playtime = (store.cp.playtime || 0) + e),
    game.scenes.update(t, a),
    tiltShift.passes[0].enabled &&
      (focusPoint.copy(stage.controls.target).project(stage.camera),
      tiltShift.setFocus(Math.min(0.85, Math.max(0.15, (focusPoint.y + 1) / 2)))),
    game.audio.update?.(t),
    stage.render(a),
    game.scenes.afterRender(Math.min(e, 0.1)),
    game.ready && params.has('captura') && ++game.framesReady >= Number(params.get('captura') || 2))
  ) {
    document.title = 'listo';
    return;
  }
  requestAnimationFrame(frame);
}
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
boot().catch((o) => {
  (console.error(o),
    game.ui.loading(`No se ha podido arrancar: ${String(o.message || o).slice(0, 200)}`),
    (document.title = 'error ' + o.message));
});
