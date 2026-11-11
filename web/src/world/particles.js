// world/particles.js
// Reconstruido de publicado/juego.js (módulo __esm «rk»). Nombres locales aún minificados.

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  MathUtils,
  Mesh,
  NormalBlending,
  PointLight,
  Points,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three';

function ju(o, e, { count: t = 12, size: a = 1, color: n = 16777215, extra: s = null, area: i = null } = {}) {
  let r = e.length * t;
  if (!r) return null;
  let l = new Float32Array(r * 3),
    c = new Float32Array(r),
    d = new Float32Array(r * 4),
    u = 0;
  for (let f = 0; f < e.length; f++) {
    let v = e[f];
    for (let x = 0; x < t; x++, u++) {
      (l.set([v.x, v.y, v.z], u * 3), (c[u] = (x + Math.random()) / t));
      let g = s ? s(f, x) : [0, 0, 0, 0];
      d.set(g, u * 4);
    }
  }
  let h = new BufferGeometry();
  (h.setAttribute('position', new BufferAttribute(l, 3)),
    h.setAttribute('aSeed', new BufferAttribute(c, 1)),
    h.setAttribute('aExtra', new BufferAttribute(d, 4)),
    i ? (h.boundingSphere = i) : h.computeBoundingSphere(),
    h.boundingSphere && (h.boundingSphere.radius += 6));
  let p = {
      uTime: { value: 0 },
      uSize: { value: a },
      uColor: { value: new Color(n) },
      uScale: { value: 400 },
      uAmount: { value: 1 },
      uWind: { value: new Vector2(0.25, 0.08) },
      uLight: { value: 1 },
      fogColor: { value: new Color() },
      fogNear: { value: 10 },
      fogFar: { value: 100 },
    },
    m = {
      smoke: `
      float age = fract(uTime * 0.16 + aSeed + aExtra.x);
      vec3 p = position + vec3(uWind.x * age * age * 4.0 + sin(age * 6.0 + aSeed * 30.0) * 0.15, age * 3.6, uWind.y * age * age * 4.0);
      vSize = mix(0.3, 1.7, sqrt(age)) * uSize;
      vAlpha = smoothstep(0.0, 0.15, age) * (1.0 - smoothstep(0.3, 1.0, age)) * 0.28;
      vTint = mix(vec3(0.42, 0.4, 0.4), vec3(0.62, 0.6, 0.6), age) * uLight;`,
      fire: `
      float age = fract(uTime * 1.6 + aSeed + aExtra.x);
      float sd = fxH(aSeed * 91.0 + floor(uTime * 1.6 + aSeed));
      vec3 p = position + vec3((sd - 0.5) * 0.18 * aExtra.y, age * 0.55 * aExtra.y, (fxH(sd * 7.0) - 0.5) * 0.18 * aExtra.y);
      vSize = mix(0.42, 0.08, age) * uSize * aExtra.y;
      vAlpha = smoothstep(0.0, 0.1, age) * (1.0 - age);
      vTint = mix(vec3(1.0, 0.8, 0.35), vec3(1.0, 0.25, 0.05), age) * 2.2;`,
      ember: `
      float age = fract(uTime * 0.45 + aSeed + aExtra.x);
      float sd = fxH(aSeed * 31.0 + floor(uTime * 0.45 + aSeed));
      vec3 p = position + vec3((sd - 0.5) * 0.8 * age + sin(age * 9.0 + sd * 20.0) * 0.1, age * 2.4, (fxH(sd * 5.0) - 0.5) * 0.8 * age);
      vSize = 0.05 * uSize;
      vAlpha = (1.0 - age) * step(0.2, sd);
      vTint = vec3(1.0, 0.55, 0.15) * 3.0;`,
      firefly: `
      float t = uTime * 0.35 + aSeed * 40.0;
      vec3 p = position + vec3(sin(t * 1.3 + aSeed * 7.0) * 1.6 + sin(t * 2.9) * 0.4, 0.4 + sin(t * 0.9 + aSeed * 3.0) * 0.45, cos(t * 1.1 + aSeed * 5.0) * 1.6);
      float blink = smoothstep(0.55, 1.0, sin(uTime * 1.7 + aSeed * 50.0) * 0.5 + 0.5);
      vSize = 0.11 * uSize;
      vAlpha = blink * uAmount;
      vTint = vec3(1.0, 0.92, 0.45) * 3.5;`,
      leaf: `
      float age = fract(uTime * 0.06 + aSeed);
      float sd = fxH(aSeed * 13.0 + floor(uTime * 0.06 + aSeed));
      vec3 p = position + vec3((sd - 0.5) * 18.0 + sin(age * 12.0 + sd * 9.0) * 0.6 + age * 3.0, 7.0 - age * 7.5, (fxH(sd * 3.0) - 0.5) * 18.0 + cos(age * 10.0) * 0.5);
      vSize = 0.09 * uSize;
      vAlpha = smoothstep(0.0, 0.08, age) * (1.0 - smoothstep(0.9, 1.0, age)) * uAmount;
      vTint = mix(vec3(0.62, 0.55, 0.2), vec3(0.75, 0.42, 0.15), sd);`,
      dust: `
      float t = uTime * 0.05 + aSeed * 20.0;
      vec3 p = position + vec3(sin(t + aSeed * 9.0) * 2.5, 0.3 + fract(aSeed * 7.3 + uTime * 0.01) * 2.6, cos(t * 0.8 + aSeed * 4.0) * 2.5);
      vSize = 0.035 * uSize;
      vAlpha = 0.55 * (0.5 + 0.5 * sin(uTime * 0.6 + aSeed * 30.0)) * uAmount;
      vTint = vec3(0.85, 0.82, 0.75) * 1.4;`,
      halo: `
      vec3 p = position;
      float fl = 0.9 + 0.1 * sin(uTime * 7.0 + aSeed * 40.0) * sin(uTime * 3.3 + aSeed * 11.0);
      vSize = aExtra.y * uSize * fl;
      vAlpha = uAmount * aExtra.z;
      vTint = uColor * 1.6;`,
    }[o],
    _ = new ShaderMaterial({
      uniforms: p,
      transparent: !0,
      depthWrite: !1,
      blending: o === 'smoke' || o === 'leaf' ? NormalBlending : AdditiveBlending,
      fog: !0,
      vertexShader: `
      attribute float aSeed; attribute vec4 aExtra;
      uniform float uTime; uniform float uSize; uniform float uScale; uniform float uAmount; uniform float uLight; uniform vec2 uWind; uniform vec3 uColor;
      varying float vAlpha; varying vec3 vTint; varying float vSize; varying float vFogDepth; varying float vKind;
      ${B9}
      void main(){
        ${m}
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = vSize * uScale / max(0.1, -mv.z);
        vFogDepth = -mv.z;
      }`,
      fragmentShader: `
      uniform vec3 fogColor; uniform float fogNear; uniform float fogFar;
      varying float vAlpha; varying vec3 vTint; varying float vSize; varying float vFogDepth;
      void main(){
        vec2 q = gl_PointCoord - 0.5;
        float d = length(q) * 2.0;
        ${o === 'smoke' ? 'float a = smoothstep(1.0, 0.2, d) * vAlpha; vec3 c = vTint; float f = smoothstep(fogNear, fogFar, vFogDepth); c = mix(c, fogColor, f);' : ''}
        ${o === 'leaf' ? 'float a = step(d, 0.9) * vAlpha; vec3 c = vTint;' : ''}
        ${o !== 'smoke' && o !== 'leaf' ? 'float a = pow(max(0.0, 1.0 - d), 2.0) * vAlpha; vec3 c = vTint; float f = smoothstep(fogNear, fogFar, vFogDepth); a *= 1.0 - f * 0.8;' : ''}
        if (a < 0.003) discard;
        gl_FragColor = vec4(c, a);
      }`,
    }),
    b = new Points(h, _);
  return ((b.frustumCulled = !!i || !0), (b.renderOrder = o === 'halo' ? 5 : 4), (b.name = `fx:${o}`), b);
}
const B9 = `
float fxH(float n){ return fract(sin(n * 12.9898) * 43758.5453); }
`;
const o0 = class {
  constructor(e, { quality: t, ambient: a }) {
    ((this.scene = e),
      (this.quality = t),
      (this.ambient = a),
      (this.systems = []),
      (this.lampSources = []),
      (this.flames = []),
      (this.lampFactor = 1));
    let n = t.level === 0 ? 2 : t.level === 1 ? 4 : 6;
    this.lights = [];
    for (let s = 0; s < n; s++) {
      let i = new PointLight(16752720, 0, 6, 1.6);
      ((i.castShadow = !1), e.add(i), this.lights.push(i));
    }
    ((this._t = 0), (this._v = new Vector3()));
  }
  add(e) {
    return e ? (this.scene.add(e), this.systems.push(e), e) : null;
  }
  addLamp(e) {
    let t = { on: !0, ...e };
    return (this.lampSources.push(t), t);
  }
  build(e) {
    let t = this.quality.level,
      a = this.smokeOrigins || [];
    (a.length &&
      t > 0 &&
      this.add(ju('smoke', a, { count: t === 2 ? 14 : 9, size: 1, extra: (n) => [n * 0.37, 0, 0, 0] })),
      this.buildFire(),
      this.buildHalos(),
      (this.fog = e),
      (this.built = !0));
  }
  drop(e) {
    e &&
      (this.scene.remove(e),
      e.geometry.dispose(),
      e.material.dispose(),
      (this.systems = this.systems.filter((t) => t !== e)));
  }
  buildFire() {
    (this.drop(this.fireSys), this.drop(this.emberSys), (this.fireSys = this.emberSys = null));
    let e = this.flames;
    if (e.length) {
      (e.forEach((t, a) => (t.index = a)),
        (this.fireSys = this.add(
          ju(
            'fire',
            e.map((t) => t.pos),
            { count: 14, size: 1, extra: (t) => [t * 0.21, e[t].scale || 1, 0, 0] },
          ),
        )),
        this.quality.level > 0 &&
          (this.emberSys = this.add(
            ju(
              'ember',
              e.filter((t) => t.embers !== !1).map((t) => t.pos),
              { count: 6, size: 1, extra: (t) => [t * 0.13, 1, 0, 0] },
            ),
          )));
      for (let t of e) t.on === !1 && ((t.on = void 0), this.setFlame(t, !1));
    }
  }
  buildHalos() {
    (this.drop(this.halo), (this.halo = null));
    let e = this.lampSources.filter((a) => a.halo !== !1);
    if (!e.length) return;
    let t = ju(
      'halo',
      e.map((a) => a.pos),
      {
        count: 1,
        size: 1,
        color: 16756832,
        extra: (a) => [0, e[a].haloSize || 1.6, e[a].haloAlpha ?? 0.5, 0],
      },
    );
    ((this.halo = this.add(t)),
      (this.halo.material.uniforms.uAmount.value = Math.min(1, this.lampFactor ?? 1)));
  }
  addFire(e) {
    (this.flames.push(e), this.built && (this.buildFire(), this.buildHalos()));
  }
  ambientAround(e, t) {
    let a = this.quality.level;
    if (a === 0) return;
    let n = [],
      s = e === 'firefly' ? (a === 2 ? 60 : 36) : e === 'leaf' ? (a === 2 ? 50 : 30) : a === 2 ? 70 : 44;
    for (let r = 0; r < s; r++)
      n.push(new Vector3((Math.random() - 0.5) * 30, 0, (Math.random() - 0.5) * 30));
    let i = ju(e, n, { count: 1, size: 1 });
    ((i.frustumCulled = !1),
      (i.userData.follow = !0),
      this.add(i),
      e === 'firefly' && (this.fireflies = i),
      e === 'leaf' && (this.leaves = i),
      e === 'dust' && (this.dust = i),
      i.position.copy(t));
  }
  setFlame(e, t) {
    if (!this.fireSys || e.index == null || e.on === t) return;
    e.on = t;
    let a = this.fireSys.geometry.getAttribute('aExtra');
    for (let n = 0; n < 14; n++) a.array[(e.index * 14 + n) * 4 + 1] = t ? e.scale || 1 : 0;
    a.needsUpdate = !0;
  }
  sunShafts(e, t, a = 16769696) {
    if (!e.length || this.quality.level === 0) return;
    let n = [],
      s = [],
      i = [],
      r = t.clone().normalize(),
      l = new Vector3(0, 1, 0);
    for (let h of e) {
      let m = 1.4 + Math.random() * 1.6,
        _ = h.clone().addScaledVector(r, 16);
      for (let b = 0; b < 2; b++) {
        let f = new Vector3()
            .crossVectors(r, b === 0 ? l : new Vector3(1, 0, 0))
            .normalize()
            .multiplyScalar(m / 2),
          v = _.clone().add(f),
          x = _.clone().sub(f),
          g = h.clone().add(f),
          y = h.clone().sub(f);
        (n.push(
          ...v.toArray(),
          ...x.toArray(),
          ...g.toArray(),
          ...x.toArray(),
          ...y.toArray(),
          ...g.toArray(),
        ),
          s.push(0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0));
        let w = Math.random();
        for (let k = 0; k < 6; k++) i.push(w);
      }
    }
    let c = new BufferGeometry();
    (c.setAttribute('position', new Float32BufferAttribute(n, 3)),
      c.setAttribute('uv', new Float32BufferAttribute(s, 2)),
      c.setAttribute('aSeed', new Float32BufferAttribute(i, 1)));
    let d = new ShaderMaterial({
        transparent: !0,
        depthWrite: !1,
        blending: AdditiveBlending,
        side: DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new Color(a) },
          uAmount: { value: 1 },
          uScale: { value: 1 },
          uSize: { value: 1 },
          uWind: { value: new Vector2() },
          fogColor: { value: new Color() },
          fogNear: { value: 1 },
          fogFar: { value: 100 },
        },
        vertexShader:
          'attribute float aSeed; varying vec2 vUv; varying float vSeed; void main(){ vUv = uv; vSeed = aSeed; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform float uTime; uniform vec3 uColor; uniform float uAmount; varying vec2 vUv; varying float vSeed;
        void main(){
          float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
          float along = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
          float fl = 0.75 + 0.25 * sin(uTime * 0.4 + vSeed * 40.0);
          float a = edge * along * fl * 0.05 * uAmount;
          gl_FragColor = vec4(uColor * a, a);
        }`,
      }),
      u = new Mesh(c, d);
    ((u.renderOrder = 6), (u.name = 'fx:rayos'), this.scene.add(u), this.systems.push(u), (this.shafts = u));
  }
  setLevels({ lamps: e = 1, fireflies: t = 1, light: a = 1 } = {}) {
    this.lampFactor = e;
    for (let n of this.systems) n.material.uniforms.uLight && (n.material.uniforms.uLight.value = a);
    ((this.light = a),
      this.halo && (this.halo.material.uniforms.uAmount.value = Math.min(1, e)),
      this.fireflies && (this.fireflies.material.uniforms.uAmount.value = t));
  }
  update(e, t, a, n, s) {
    let i = s / (2 * Math.tan(MathUtils.degToRad(a.fov) / 2));
    for (let l of this.systems) {
      let c = l.material.uniforms;
      ((c.uTime.value = t),
        (c.uScale.value = i),
        this.fog &&
          (c.fogColor.value.copy(this.fog.color),
          (c.fogNear.value = this.fog.near),
          (c.fogFar.value = this.fog.far)),
        l.userData.follow && n && l.position.set(n.x, n.y, n.z));
    }
    if (((this._t -= e), this._t <= 0 && n)) {
      this._t = 0.3;
      let l = this.lampSources.filter(
        (c) => c.on && (c.kind === 'fire' || c.kind === 'forge' || this.lampFactor > 0.05),
      );
      (l.sort((c, d) => c.pos.distanceToSquared(n) / c.energy - d.pos.distanceToSquared(n) / d.energy),
        (this.assigned = l.slice(0, Math.min(this.lights.length, this.maxLights ?? this.lights.length))));
    }
    let r = this.assigned || [];
    for (let l = 0; l < this.lights.length; l++) {
      let c = this.lights[l],
        d = r[l];
      if (!d) {
        c.intensity = Math.max(0, c.intensity - e * 4);
        continue;
      }
      (c.position.copy(d.pos), (d._c ??= new Color(d.color)), c.color.copy(d._c), (c.distance = d.range));
      let u =
          d.kind === 'fire' || d.kind === 'forge' || d.kind === 'torch'
            ? 0.82 + 0.12 * Math.sin(t * 9.1 + l * 3) + 0.06 * Math.sin(t * 17.3 + l)
            : 0.96 + 0.04 * Math.sin(t * 5 + l),
        h =
          d.kind === 'fire' || d.kind === 'forge' || d.kind === 'torch'
            ? Math.max(0.35, this.lampFactor)
            : this.lampFactor,
        p = d.energy * 4.5 * u * h;
      c.intensity += (p - c.intensity) * Math.min(1, e * 6);
    }
  }
  dispose() {
    for (let e of this.systems) (e.geometry.dispose(), e.material.dispose(), this.scene.remove(e));
    for (let e of this.lights) (this.scene.remove(e), e.dispose?.());
  }
};

export { o0 };
