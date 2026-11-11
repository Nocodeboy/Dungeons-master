// stage.js — Escenario de render (game.stage): renderer WebGL, cámara, OrbitControls y posprocesado.
// Cadena del compositor: RenderPass → GTAO (calidad alta) → UnrealBloom → gradación de color propia
// (viñeta, tinte, destello de daño, grano y fundido a negro) → OutputPass; main.js inserta después el
// tilt-shift antes de la gradación. Lo crea main.js; escenas, combate y exploración usan camera, controls,
// setScene, fade y grade.

import {
  ACESFilmicToneMapping,
  HalfFloatType,
  MOUSE,
  MathUtils,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  TOUCH,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { setAnisotropy } from './assets.js';

/**
 * Crea el escenario sobre `canvas` con los parámetros de calidad de quality.js.
 * @returns {{renderer, scene, camera, controls, composer, grade, bloom, quality, resize, setScene, setLevel, fade, render}}
 */
function createStage(canvas, quality) {
  let renderer = new WebGLRenderer({ canvas, antialias: !1, powerPreference: 'high-performance' });
  (renderer.setPixelRatio(quality.pixelRatio),
    renderer.setSize(innerWidth, innerHeight, !1),
    (renderer.toneMapping = ACESFilmicToneMapping),
    (renderer.toneMappingExposure = 1),
    (renderer.shadowMap.enabled = !0),
    (renderer.shadowMap.type = PCFShadowMap),
    setAnisotropy(Math.min(8, renderer.capabilities.getMaxAnisotropy())));
  let scene = new Scene(),
    camera = new PerspectiveCamera(32, innerWidth / innerHeight, 0.5, 600),
    controls = new OrbitControls(camera, canvas);
  ((controls.enableDamping = !0),
    (controls.dampingFactor = 0.08),
    (controls.minDistance = 9),
    (controls.maxDistance = 58),
    (controls.minPolarAngle = MathUtils.degToRad(22)),
    (controls.maxPolarAngle = MathUtils.degToRad(64)),
    (controls.screenSpacePanning = !1),
    (controls.mouseButtons = { LEFT: null, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE }),
    (controls.touches = { ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_ROTATE }),
    (controls.panSpeed = 1.2));
  let resolution = new Vector2(innerWidth, innerHeight),
    renderTarget = new WebGLRenderTarget(innerWidth * quality.pixelRatio, innerHeight * quality.pixelRatio, {
      type: HalfFloatType,
      samples: quality.msaa ? 4 : 0,
    }),
    composer = new EffectComposer(renderer, renderTarget);
  composer.setPixelRatio(quality.pixelRatio);
  let renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  let gtaoPass = null;
  quality.ao &&
    ((gtaoPass = new GTAOPass(scene, camera, innerWidth, innerHeight)),
    gtaoPass.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.5, thickness: 1.5, scale: 1, samples: 12 }),
    gtaoPass.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 }),
    (gtaoPass.blendIntensity = 0.65),
    composer.addPass(gtaoPass));
  let bloom = new UnrealBloomPass(resolution, 0.28, 0.5, 0.95);
  ((bloom.enabled = quality.bloom !== !1), composer.addPass(bloom));
  let grade = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uAspect: { value: innerWidth / innerHeight },
      uFlash: { value: 0 },
      uVignette: { value: 0.62 },
      uTint: { value: new Vector3(1.05, 0.99, 0.9) },
      uFade: { value: 0 },
    },
    vertexShader:
      'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uTime; uniform float uAspect; uniform float uFlash;
      uniform float uVignette; uniform vec3 uTint; uniform float uFade; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){
        vec4 c = texture2D(tDiffuse, vUv);
        vec2 q = vUv - 0.5; q.x *= uAspect * 0.75;
        float v = smoothstep(1.05, 0.3, length(q));
        c.rgb *= mix(uVignette, 1.0, v);
        float l = dot(c.rgb, vec3(0.2126,0.7152,0.0722));
        c.rgb = mix(c.rgb, c.rgb * uTint, smoothstep(0.1, 0.7, l));
        c.rgb = mix(vec3(l), c.rgb, 1.08);
        c.rgb += vec3(0.6, 0.08, 0.04) * uFlash * (1.0 - v);
        c.rgb += (hash(vUv * 900.0 + uTime) - 0.5) * 0.01;
        c.rgb *= 1.0 - uFade;
        gl_FragColor = c;
      }`,
  });
  (composer.addPass(grade), composer.addPass(new OutputPass()));
  /** Ajusta cámara, renderer y compositor al tamaño de la ventana. */
  function resize() {
    ((camera.aspect = innerWidth / innerHeight),
      camera.updateProjectionMatrix(),
      renderer.setSize(innerWidth, innerHeight, !1),
      composer.setSize(innerWidth, innerHeight),
      (grade.uniforms.uAspect.value = innerWidth / innerHeight));
  }
  addEventListener('resize', resize);
  /** Cambia la escena three que se dibuja. */
  function setScene(next) {
    ((scene = next), (renderPass.scene = next), gtaoPass && (gtaoPass.scene = next));
  }
  /** Baja la calidad en caliente (sin AO ni MSAA, menos píxeles y sombras más pequeñas). */
  function setLevel(level, sun) {
    if (((quality.level = level), level < 2 && gtaoPass && (gtaoPass.enabled = !1), level < 2))
      for (let target of [composer.renderTarget1, composer.renderTarget2]) target.samples && ((target.samples = 0), target.dispose());
    let ratio = level === 0 ? Math.min(devicePixelRatio, 0.85) : 1;
    if (
      (renderer.setPixelRatio(ratio),
      composer.setPixelRatio(ratio),
      resize(),
      level === 0 && (bloom.enabled = !1),
      sun && sun.shadow.mapSize.x > (level === 0 ? 512 : 1024))
    ) {
      let size = level === 0 ? 512 : 1024;
      (sun.shadow.mapSize.set(size, size), sun.shadow.map && (sun.shadow.map.dispose(), (sun.shadow.map = null)));
    }
  }
  /** Funde la imagen hacia `to` (0 visible, 1 negro) en `seconds`; devuelve una promesa. */
  function fade(to, seconds = 0.5) {
    let from = grade.uniforms.uFade.value,
      start = performance.now();
    return new Promise((resolve) => {
      let step = () => {
        let progress = Math.min(1, (performance.now() - start) / (seconds * 1e3));
        ((grade.uniforms.uFade.value = from + (to - from) * progress), progress < 1 ? requestAnimationFrame(step) : resolve());
      };
      step();
    });
  }
  /** Dibuja un fotograma con el compositor. */
  function render(time) {
    ((grade.uniforms.uTime.value = time), controls.update(), composer.render());
  }
  return {
    renderer,
    get scene() {
      return scene;
    },
    camera,
    controls,
    composer,
    grade,
    bloom,
    quality,
    resize,
    setScene,
    setLevel,
    fade,
    render,
  };
}

export { createStage };
