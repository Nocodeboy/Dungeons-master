// stage.js
// Reconstruido de publicado/juego.js (parte sin envolver del final del bundle). Nombres locales aún minificados.

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

function createStage(o, e) {
  let t = new WebGLRenderer({ canvas: o, antialias: !1, powerPreference: 'high-performance' });
  (t.setPixelRatio(e.pixelRatio),
    t.setSize(innerWidth, innerHeight, !1),
    (t.toneMapping = ACESFilmicToneMapping),
    (t.toneMappingExposure = 1),
    (t.shadowMap.enabled = !0),
    (t.shadowMap.type = PCFShadowMap),
    setAnisotropy(Math.min(8, t.capabilities.getMaxAnisotropy())));
  let a = new Scene(),
    n = new PerspectiveCamera(32, innerWidth / innerHeight, 0.5, 600),
    s = new OrbitControls(n, o);
  ((s.enableDamping = !0),
    (s.dampingFactor = 0.08),
    (s.minDistance = 9),
    (s.maxDistance = 58),
    (s.minPolarAngle = MathUtils.degToRad(22)),
    (s.maxPolarAngle = MathUtils.degToRad(64)),
    (s.screenSpacePanning = !1),
    (s.mouseButtons = { LEFT: null, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE }),
    (s.touches = { ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_ROTATE }),
    (s.panSpeed = 1.2));
  let i = new Vector2(innerWidth, innerHeight),
    r = new WebGLRenderTarget(innerWidth * e.pixelRatio, innerHeight * e.pixelRatio, {
      type: HalfFloatType,
      samples: e.msaa ? 4 : 0,
    }),
    l = new EffectComposer(t, r);
  l.setPixelRatio(e.pixelRatio);
  let c = new RenderPass(a, n);
  l.addPass(c);
  let d = null;
  e.ao &&
    ((d = new GTAOPass(a, n, innerWidth, innerHeight)),
    d.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.5, thickness: 1.5, scale: 1, samples: 12 }),
    d.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 }),
    (d.blendIntensity = 0.65),
    l.addPass(d));
  let u = new UnrealBloomPass(i, 0.28, 0.5, 0.95);
  ((u.enabled = e.bloom !== !1), l.addPass(u));
  let h = new ShaderPass({
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
  (l.addPass(h), l.addPass(new OutputPass()));
  function p() {
    ((n.aspect = innerWidth / innerHeight),
      n.updateProjectionMatrix(),
      t.setSize(innerWidth, innerHeight, !1),
      l.setSize(innerWidth, innerHeight),
      (h.uniforms.uAspect.value = innerWidth / innerHeight));
  }
  addEventListener('resize', p);
  function m(v) {
    ((a = v), (c.scene = v), d && (d.scene = v));
  }
  function _(v, x) {
    if (((e.level = v), v < 2 && d && (d.enabled = !1), v < 2))
      for (let y of [l.renderTarget1, l.renderTarget2]) y.samples && ((y.samples = 0), y.dispose());
    let g = v === 0 ? Math.min(devicePixelRatio, 0.85) : 1;
    if (
      (t.setPixelRatio(g),
      l.setPixelRatio(g),
      p(),
      v === 0 && (u.enabled = !1),
      x && x.shadow.mapSize.x > (v === 0 ? 512 : 1024))
    ) {
      let y = v === 0 ? 512 : 1024;
      (x.shadow.mapSize.set(y, y), x.shadow.map && (x.shadow.map.dispose(), (x.shadow.map = null)));
    }
  }
  function b(v, x = 0.5) {
    let g = h.uniforms.uFade.value,
      y = performance.now();
    return new Promise((w) => {
      let k = () => {
        let T = Math.min(1, (performance.now() - y) / (x * 1e3));
        ((h.uniforms.uFade.value = g + (v - g) * T), T < 1 ? requestAnimationFrame(k) : w());
      };
      k();
    });
  }
  function f(v) {
    ((h.uniforms.uTime.value = v), s.update(), l.render());
  }
  return {
    renderer: t,
    get scene() {
      return a;
    },
    camera: n,
    controls: s,
    composer: l,
    grade: h,
    bloom: u,
    quality: e,
    resize: p,
    setScene: m,
    setLevel: _,
    fade: b,
    render: f,
  };
}

export { createStage };
