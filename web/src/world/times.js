// world/times.js
// Reconstruido de publicado/juego.js (módulo __esm «R3»). Nombres locales aún minificados.

import {
  BackSide,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three';

function k3(o) {
  return {
    sunDir: new Vector3(...o.sunDir).normalize(),
    sun: Ti(o.sun),
    sunI: o.sunI,
    hemiSky: Ti(o.hemiSky),
    hemiGround: Ti(o.hemiGround),
    hemiI: o.hemiI,
    fog: Ti(o.fog),
    fogNear: o.fogNear,
    fogFar: o.fogFar,
    skyTop: Ti(o.skyTop),
    skyMid: Ti(o.skyMid),
    skyHor: Ti(o.skyHor),
    glow: Ti(o.glow),
    bounce: Ti(o.bounce),
    bounceI: o.bounceI,
    lamps: o.lamps,
    windows: o.windows,
    fireflies: o.fireflies,
    tint: new Vector3(...o.tint),
    clouds: o.clouds || 0,
  };
}
function A3(o, e, t, a) {
  a.sunDir.copy(o.sunDir).lerp(e.sunDir, t).normalize();
  for (let n of ['sun', 'hemiSky', 'hemiGround', 'fog', 'skyTop', 'skyMid', 'skyHor', 'glow', 'bounce'])
    a[n].copy(o[n]).lerp(e[n], t);
  for (let n of ['sunI', 'hemiI', 'fogNear', 'fogFar', 'bounceI', 'lamps', 'windows', 'fireflies', 'clouds'])
    a[n] = o[n] + (e[n] - o[n]) * t;
  return (a.tint.copy(o.tint).lerp(e.tint, t), a);
}
const TIMES = {
  dusk: {
    sunDir: [-0.8, 0.48, 0.18],
    sun: 16759936,
    sunI: 3.1,
    hemiSky: 12109030,
    hemiGround: 8415304,
    hemiI: 1.6,
    fog: 13608325,
    fogNear: 42,
    fogFar: 135,
    skyTop: 3428478,
    skyMid: 10194592,
    skyHor: 16756848,
    glow: 16751184,
    bounce: 9414880,
    bounceI: 0.45,
    lamps: 1,
    windows: 1,
    fireflies: 1,
    exposure: 1,
    tint: [1.06, 0.99, 0.9],
  },
  day: {
    sunDir: [-0.45, 0.78, 0.42],
    sun: 16773336,
    sunI: 3.6,
    hemiSky: 12834544,
    hemiGround: 7300164,
    hemiI: 1.25,
    fog: 13818848,
    fogNear: 70,
    fogFar: 190,
    skyTop: 5211848,
    skyMid: 10272996,
    skyHor: 15265520,
    glow: 16774360,
    bounce: 12110056,
    bounceI: 0.35,
    lamps: 0,
    windows: 0.08,
    fireflies: 0,
    exposure: 1,
    tint: [1.02, 1, 0.97],
    clouds: 1,
  },
  forest: {
    sunDir: [-0.5, 0.66, 0.56],
    sun: 16769712,
    sunI: 3.2,
    hemiSky: 11979700,
    hemiGround: 5198386,
    hemiI: 1.15,
    fog: 11451806,
    fogNear: 40,
    fogFar: 140,
    skyTop: 6129840,
    skyMid: 11059112,
    skyHor: 14998708,
    glow: 16769184,
    bounce: 11060400,
    bounceI: 0.35,
    lamps: 0.25,
    windows: 0.2,
    fireflies: 0,
    exposure: 1,
    tint: [1.03, 1, 0.93],
    clouds: 0.7,
  },
  kesh: {
    sunDir: [-0.7, 0.42, -0.4],
    sun: 16763030,
    sunI: 2.7,
    hemiSky: 11057356,
    hemiGround: 4999744,
    hemiI: 1.15,
    fog: 12039340,
    fogNear: 38,
    fogFar: 130,
    skyTop: 5006472,
    skyMid: 10791088,
    skyHor: 15778970,
    glow: 16756848,
    bounce: 10465480,
    bounceI: 0.4,
    lamps: 0.6,
    windows: 0.5,
    fireflies: 0,
    exposure: 1,
    tint: [1.04, 1, 0.94],
    clouds: 0.6,
  },
  night: {
    sunDir: [0.35, 0.7, -0.4],
    sun: 10335466,
    sunI: 1.05,
    hemiSky: 4873872,
    hemiGround: 2236190,
    hemiI: 0.92,
    fog: 2041656,
    fogNear: 30,
    fogFar: 120,
    skyTop: 527644,
    skyMid: 1713216,
    skyHor: 3424350,
    glow: 9349375,
    bounce: 5271728,
    bounceI: 0.25,
    lamps: 1.6,
    windows: 1.5,
    fireflies: 1,
    exposure: 1.05,
    tint: [0.95, 1, 1.08],
  },
  inn: {
    sunDir: [-0.3, 0.88, 0.36],
    sun: 16768180,
    sunI: 1.15,
    hemiSky: 8284760,
    hemiGround: 3810840,
    hemiI: 1.05,
    fog: 1182986,
    fogNear: 40,
    fogFar: 110,
    skyTop: 657414,
    skyMid: 854536,
    skyHor: 1182986,
    glow: 0,
    bounce: 9071184,
    bounceI: 0.32,
    lamps: 1.25,
    windows: 0.6,
    fireflies: 0,
    exposure: 1,
    tint: [1.05, 0.99, 0.92],
  },
  crypt: {
    sunDir: [-0.3, 0.9, 0.3],
    sun: 9083076,
    sunI: 0.55,
    hemiSky: 6713486,
    hemiGround: 2761760,
    hemiI: 0.85,
    fog: 789778,
    fogNear: 32,
    fogFar: 80,
    skyTop: 197381,
    skyMid: 328968,
    skyHor: 526348,
    glow: 0,
    bounce: 4872312,
    bounceI: 0.3,
    lamps: 1.4,
    windows: 0,
    fireflies: 0,
    exposure: 1,
    tint: [1.04, 0.98, 0.94],
  },
};
const Ti = (o) => new Color(o);
const Vm = class {
  constructor(e, { center: t, radius: a, quality: n, ambient: s }) {
    ((this.scene = e),
      (this.center = t.clone()),
      (this.quality = n),
      (this.crypt = s === 'crypt'),
      (this.indoor = this.crypt || s === 'inn'),
      (this.cur = k3(TIMES[s] || TIMES.dusk)),
      (this.from = null),
      (this.to = null),
      (this.t = 1),
      (this.listeners = []),
      (this.uniforms = {
        uSun: { value: this.cur.sunDir.clone() },
        uTop: { value: this.cur.skyTop.clone() },
        uMid: { value: this.cur.skyMid.clone() },
        uHor: { value: this.cur.skyHor.clone() },
        uGlow: { value: this.cur.glow.clone() },
        uBase: { value: new Color(1709330) },
        uTime: { value: 0 },
      }));
    let i = new ShaderMaterial({
      side: BackSide,
      depthWrite: !1,
      fog: !1,
      uniforms: this.uniforms,
      vertexShader:
        'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
      fragmentShader: `
        uniform vec3 uSun, uTop, uMid, uHor, uGlow, uBase; uniform float uTime; varying vec3 vDir;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
        float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a * vn(p); p *= 2.03; a *= 0.5; } return s; }
        void main(){
          vec3 d = normalize(vDir);
          float h = d.y;
          vec3 col = mix(uHor, uMid, smoothstep(0.0, 0.22, h));
          col = mix(col, uTop, smoothstep(0.2, 0.75, h));
          float s = max(dot(d, normalize(uSun)), 0.0);
          col += uGlow * (pow(s, 6.0) * 0.45 + pow(s, 64.0) * 0.6) * smoothstep(-0.1, 0.1, h);
          // nubes altas
          if (h > 0.0) {
            vec2 uv = d.xz / (h + 0.18) * 1.6 + vec2(uTime * 0.004, 0.0);
            float c = smoothstep(0.52, 0.85, fbm(uv));
            vec3 cc = mix(uHor * 1.05, vec3(1.0), 0.35) + uGlow * pow(s, 4.0) * 0.4;
            col = mix(col, cc, c * 0.55 * smoothstep(0.0, 0.25, h));
          }
          // estrellas cuando el cielo est\xE1 oscuro
          float night = 1.0 - smoothstep(0.03, 0.12, dot(uTop, vec3(0.333)));
          if (night > 0.0 && h > 0.05) {
            vec3 q = floor(d * 260.0);
            float st = step(0.9975, h21(q.xy + q.z * 17.0));
            col += vec3(0.9, 0.92, 1.0) * st * night * (0.5 + 0.5 * sin(uTime * 2.0 + q.x)) * smoothstep(0.05, 0.3, h);
          }
          // bajo el horizonte: penumbra de estudio (la maqueta flota)
          col = mix(col, mix(uHor * 0.45, uBase, smoothstep(-0.02, -0.5, h)), smoothstep(0.02, -0.12, h));
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    ((this.dome = new Mesh(new SphereGeometry(500, 32, 16), i)),
      (this.dome.renderOrder = -10),
      (this.dome.frustumCulled = !1),
      (this.dome.name = 'cielo'),
      this.indoor ? (e.background = new Color(this.crypt ? 328966 : 788743)) : e.add(this.dome),
      (e.fog = new Fog(this.cur.fog.clone(), this.cur.fogNear, this.cur.fogFar)),
      (this.hemi = new HemisphereLight(
        this.cur.hemiSky.clone(),
        this.cur.hemiGround.clone(),
        this.cur.hemiI,
      )),
      e.add(this.hemi),
      (this.sun = new DirectionalLight(this.cur.sun.clone(), this.cur.sunI)),
      (this.sun.castShadow = !this.crypt && n.level >= 0));
    let r = Math.max(512, (n.shadowMap || 512) * 2);
    (this.sun.shadow.mapSize.set(r, r),
      (this.shadowSpan = n.level === 2 ? 26 : n.level === 1 ? 22 : 18),
      Object.assign(this.sun.shadow.camera, {
        left: -this.shadowSpan,
        right: this.shadowSpan,
        top: this.shadowSpan,
        bottom: -this.shadowSpan,
        near: 1,
        far: 160,
      }),
      (this.sun.shadow.bias = -5e-4),
      (this.sun.shadow.normalBias = 0.04),
      (this.sun.shadow.radius = 2),
      e.add(this.sun, this.sun.target),
      (this.bounce = new DirectionalLight(this.cur.bounce.clone(), this.cur.bounceI)),
      e.add(this.bounce, this.bounce.target),
      (this.focus = this.center.clone()),
      (this._snap = new Vector3()),
      this.apply());
  }
  set(e, t = 2.5) {
    let a = TIMES[e];
    if (a) {
      ((this.name = e),
        (this.from = { ...this.cur, sunDir: this.cur.sunDir.clone(), tint: this.cur.tint.clone() }));
      for (let n of ['sun', 'hemiSky', 'hemiGround', 'fog', 'skyTop', 'skyMid', 'skyHor', 'glow', 'bounce'])
        this.from[n] = this.cur[n].clone();
      ((this.to = k3(a)),
        (this.dur = Math.max(0.001, t)),
        (this.t = t > 0 ? 0 : 1),
        t <= 0 && (A3(this.from, this.to, 1, this.cur), this.apply()));
    }
  }
  onChange(e) {
    this.listeners.push(e);
  }
  apply() {
    let e = this.cur;
    (this.uniforms.uSun.value.copy(e.sunDir),
      this.uniforms.uTop.value.copy(e.skyTop),
      this.uniforms.uMid.value.copy(e.skyMid),
      this.uniforms.uHor.value.copy(e.skyHor),
      this.uniforms.uGlow.value.copy(e.glow),
      this.scene.fog.color.copy(e.fog),
      (this.scene.fog.near = e.fogNear),
      (this.scene.fog.far = e.fogFar),
      this.hemi.color.copy(e.hemiSky),
      this.hemi.groundColor.copy(e.hemiGround),
      (this.hemi.intensity = e.hemiI),
      this.sun.color.copy(e.sun),
      (this.sun.intensity = e.sunI),
      this.bounce.color.copy(e.bounce),
      (this.bounce.intensity = e.bounceI),
      this.placeLights());
    for (let t of this.listeners) t(e);
  }
  placeLights() {
    let e = this.cur,
      t = this.focus,
      n = (this.shadowSpan * 2) / this.sun.shadow.mapSize.x,
      s = e.sunDir,
      i = Math.abs(s.y) > 0.99 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0),
      r = new Vector3().crossVectors(i, s).normalize(),
      l = new Vector3().crossVectors(s, r).normalize(),
      c = Math.round(t.dot(r) / n) * n,
      d = Math.round(t.dot(l) / n) * n,
      u = t.dot(s);
    (this._snap.copy(r).multiplyScalar(c).addScaledVector(l, d).addScaledVector(s, u),
      this.sun.target.position.copy(this._snap),
      this.sun.position.copy(this._snap).addScaledVector(s, 70),
      this.bounce.target.position.copy(this._snap),
      this.bounce.position.copy(this._snap).add(new Vector3(-s.x * 40, 30, -s.z * 40)),
      this.sun.target.updateMatrixWorld(),
      this.bounce.target.updateMatrixWorld());
  }
  update(e, t, a, n = 0) {
    if (((this.uniforms.uTime.value = t), a && this.focus.copy(a), this.to && this.t < 1)) {
      this.t = Math.min(1, this.t + e / this.dur);
      let i = this.t * this.t * (3 - 2 * this.t);
      (A3(this.from, this.to, i, this.cur), this.apply());
    } else this.placeLights();
    let s = Math.max(0, n - 45);
    ((this.scene.fog.near = this.cur.fogNear + s), (this.scene.fog.far = this.cur.fogFar + s * 1.6));
  }
  dispose() {
    (this.dome.geometry.dispose(),
      this.dome.material.dispose(),
      this.sun.dispose?.(),
      this.bounce.dispose?.(),
      this.hemi.dispose?.());
  }
};

export { TIMES, Vm };
