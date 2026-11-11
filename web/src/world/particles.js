// world/particles.js — efectos ambientales del mundo (`WorldFx`): sistemas de partículas por shader
// (humo de chimeneas, fuego y brasas, halos de faroles, luciérnagas, hojas, polvo), haces de sol en el
// bosque y un puñado de PointLight que se reparten cada 0,3 s entre las fuentes de luz más cercanas.
// Reconstruido de publicado/juego.js (módulo __esm «rk»). Lo usan index.js y crypt.js (antorchas).

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

/**
 * Sistema de `Points` del tipo `kind` (smoke, fire, ember, firefly, leaf, dust, halo) con `count`
 * partículas por origen. `extra(origen, k)` da el atributo `aExtra` (vec4) de cada partícula.
 */
function makeParticles(
  kind,
  origins,
  { count = 12, size = 1, color = 16777215, extra = null, area = null } = {},
) {
  let total = origins.length * count;
  if (!total) return null;
  let positions = new Float32Array(total * 3),
    seeds = new Float32Array(total),
    extras = new Float32Array(total * 4),
    k = 0;
  for (let j = 0; j < origins.length; j++) {
    let origin = origins[j];
    for (let q = 0; q < count; q++, k++) {
      (positions.set([origin.x, origin.y, origin.z], k * 3), (seeds[k] = (q + Math.random()) / count));
      let ex = extra ? extra(j, q) : [0, 0, 0, 0];
      extras.set(ex, k * 4);
    }
  }
  let geo = new BufferGeometry();
  (geo.setAttribute('position', new BufferAttribute(positions, 3)),
    geo.setAttribute('aSeed', new BufferAttribute(seeds, 1)),
    geo.setAttribute('aExtra', new BufferAttribute(extras, 4)),
    area ? (geo.boundingSphere = area) : geo.computeBoundingSphere(),
    geo.boundingSphere && (geo.boundingSphere.radius += 6));
  let uniforms = {
      uTime: { value: 0 },
      uSize: { value: size },
      uColor: { value: new Color(color) },
      uScale: { value: 400 },
      uAmount: { value: 1 },
      uWind: { value: new Vector2(0.25, 0.08) },
      uLight: { value: 1 },
      fogColor: { value: new Color() },
      fogNear: { value: 10 },
      fogFar: { value: 100 },
    },
    motion = {
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
    }[kind],
    material = new ShaderMaterial({
      uniforms,
      transparent: !0,
      depthWrite: !1,
      blending: kind === 'smoke' || kind === 'leaf' ? NormalBlending : AdditiveBlending,
      fog: !0,
      vertexShader: `
      attribute float aSeed; attribute vec4 aExtra;
      uniform float uTime; uniform float uSize; uniform float uScale; uniform float uAmount; uniform float uLight; uniform vec2 uWind; uniform vec3 uColor;
      varying float vAlpha; varying vec3 vTint; varying float vSize; varying float vFogDepth; varying float vKind;
      ${FX_HASH_GLSL}
      void main(){
        ${motion}
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
        ${kind === 'smoke' ? 'float a = smoothstep(1.0, 0.2, d) * vAlpha; vec3 c = vTint; float f = smoothstep(fogNear, fogFar, vFogDepth); c = mix(c, fogColor, f);' : ''}
        ${kind === 'leaf' ? 'float a = step(d, 0.9) * vAlpha; vec3 c = vTint;' : ''}
        ${kind !== 'smoke' && kind !== 'leaf' ? 'float a = pow(max(0.0, 1.0 - d), 2.0) * vAlpha; vec3 c = vTint; float f = smoothstep(fogNear, fogFar, vFogDepth); a *= 1.0 - f * 0.8;' : ''}
        if (a < 0.003) discard;
        gl_FragColor = vec4(c, a);
      }`,
    }),
    points = new Points(geo, material);
  return (
    (points.frustumCulled = !!area || !0),
    (points.renderOrder = kind === 'halo' ? 5 : 4),
    (points.name = `fx:${kind}`),
    points
  );
}
/** Hash 1D en GLSL que comparten los shaders de partículas. */
const FX_HASH_GLSL = `
float fxH(float n){ return fract(sin(n * 12.9898) * 43758.5453); }
`;
/**
 * Efectos del nivel. Se rellenan `flames`, `lampSources` (con `addLamp`) y `smokeOrigins` y luego
 * `build(fog)` crea los sistemas. `update(dt, time, camera, focus, viewH)` anima y reparte las luces.
 */
const WorldFx = class {
  constructor(scene, { quality, ambient }) {
    ((this.scene = scene),
      (this.quality = quality),
      (this.ambient = ambient),
      (this.systems = []),
      (this.lampSources = []),
      (this.flames = []),
      (this.lampFactor = 1));
    let count = quality.level === 0 ? 2 : quality.level === 1 ? 4 : 6;
    this.lights = [];
    for (let k = 0; k < count; k++) {
      let light = new PointLight(16752720, 0, 6, 1.6);
      ((light.castShadow = !1), scene.add(light), this.lights.push(light));
    }
    ((this._t = 0), (this._v = new Vector3()));
  }
  add(sys) {
    return sys ? (this.scene.add(sys), this.systems.push(sys), sys) : null;
  }
  /** Registra una fuente de luz {pos, color, range, energy, kind, halo…}; devuelve el registro. */
  addLamp(def) {
    let lamp = { on: !0, ...def };
    return (this.lampSources.push(lamp), lamp);
  }
  /** Crea humo, fuego y halos y guarda la niebla de la escena para los shaders. */
  build(fog) {
    let level = this.quality.level,
      smoke = this.smokeOrigins || [];
    (smoke.length &&
      level > 0 &&
      this.add(
        makeParticles('smoke', smoke, {
          count: level === 2 ? 14 : 9,
          size: 1,
          extra: (k) => [k * 0.37, 0, 0, 0],
        }),
      ),
      this.buildFire(),
      this.buildHalos(),
      (this.fog = fog),
      (this.built = !0));
  }
  /** Quita y libera un sistema. */
  drop(sys) {
    sys &&
      (this.scene.remove(sys),
      sys.geometry.dispose(),
      sys.material.dispose(),
      (this.systems = this.systems.filter((s) => s !== sys)));
  }
  /** (Re)crea los sistemas de fuego y brasas de `flames`. */
  buildFire() {
    (this.drop(this.fireSys), this.drop(this.emberSys), (this.fireSys = this.emberSys = null));
    let flames = this.flames;
    if (flames.length) {
      (flames.forEach((flame, k) => (flame.index = k)),
        (this.fireSys = this.add(
          makeParticles(
            'fire',
            flames.map((flame) => flame.pos),
            { count: 14, size: 1, extra: (k) => [k * 0.21, flames[k].scale || 1, 0, 0] },
          ),
        )),
        this.quality.level > 0 &&
          (this.emberSys = this.add(
            makeParticles(
              'ember',
              flames.filter((flame) => flame.embers !== !1).map((flame) => flame.pos),
              { count: 6, size: 1, extra: (k) => [k * 0.13, 1, 0, 0] },
            ),
          )));
      for (let flame of flames) flame.on === !1 && ((flame.on = void 0), this.setFlame(flame, !1));
    }
  }
  /** (Re)crea los halos de las fuentes de luz. */
  buildHalos() {
    (this.drop(this.halo), (this.halo = null));
    let lamps = this.lampSources.filter((lamp) => lamp.halo !== !1);
    if (!lamps.length) return;
    let sys = makeParticles(
      'halo',
      lamps.map((lamp) => lamp.pos),
      {
        count: 1,
        size: 1,
        color: 16756832,
        extra: (k) => [0, lamps[k].haloSize || 1.6, lamps[k].haloAlpha ?? 0.5, 0],
      },
    );
    ((this.halo = this.add(sys)),
      (this.halo.material.uniforms.uAmount.value = Math.min(1, this.lampFactor ?? 1)));
  }
  /** Añade una llama; si ya se construyó, rehace fuego y halos. */
  addFire(flame) {
    (this.flames.push(flame), this.built && (this.buildFire(), this.buildHalos()));
  }
  /** Partículas ambientales de `kind` alrededor de `center` que siguen al foco. */
  ambientAround(kind, center) {
    let level = this.quality.level;
    if (level === 0) return;
    let origins = [],
      count =
        kind === 'firefly'
          ? level === 2
            ? 60
            : 36
          : kind === 'leaf'
            ? level === 2
              ? 50
              : 30
            : level === 2
              ? 70
              : 44;
    for (let k = 0; k < count; k++)
      origins.push(new Vector3((Math.random() - 0.5) * 30, 0, (Math.random() - 0.5) * 30));
    let sys = makeParticles(kind, origins, { count: 1, size: 1 });
    ((sys.frustumCulled = !1),
      (sys.userData.follow = !0),
      this.add(sys),
      kind === 'firefly' && (this.fireflies = sys),
      kind === 'leaf' && (this.leaves = sys),
      kind === 'dust' && (this.dust = sys),
      sys.position.copy(center));
  }
  /** Enciende o apaga una llama (ajusta el tamaño de sus partículas en `aExtra`). */
  setFlame(flame, on) {
    if (!this.fireSys || flame.index == null || flame.on === on) return;
    flame.on = on;
    let attr = this.fireSys.geometry.getAttribute('aExtra');
    for (let k = 0; k < 14; k++) attr.array[(flame.index * 14 + k) * 4 + 1] = on ? flame.scale || 1 : 0;
    attr.needsUpdate = !0;
  }
  /** Haces de luz de sol (cuadriláteros aditivos) sobre los puntos dados. */
  sunShafts(points, sunDir, color = 16769696) {
    if (!points.length || this.quality.level === 0) return;
    let positions = [],
      uvs = [],
      seeds = [],
      dir = sunDir.clone().normalize(),
      up = new Vector3(0, 1, 0);
    for (let base of points) {
      let width = 1.4 + Math.random() * 1.6,
        top = base.clone().addScaledVector(dir, 16);
      for (let pass = 0; pass < 2; pass++) {
        let side = new Vector3()
            .crossVectors(dir, pass === 0 ? up : new Vector3(1, 0, 0))
            .normalize()
            .multiplyScalar(width / 2),
          topA = top.clone().add(side),
          topB = top.clone().sub(side),
          baseA = base.clone().add(side),
          baseB = base.clone().sub(side);
        (positions.push(
          ...topA.toArray(),
          ...topB.toArray(),
          ...baseA.toArray(),
          ...topB.toArray(),
          ...baseB.toArray(),
          ...baseA.toArray(),
        ),
          uvs.push(0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0));
        let seed = Math.random();
        for (let j = 0; j < 6; j++) seeds.push(seed);
      }
    }
    let geo = new BufferGeometry();
    (geo.setAttribute('position', new Float32BufferAttribute(positions, 3)),
      geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2)),
      geo.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1)));
    let material = new ShaderMaterial({
        transparent: !0,
        depthWrite: !1,
        blending: AdditiveBlending,
        side: DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new Color(color) },
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
      mesh = new Mesh(geo, material);
    ((mesh.renderOrder = 6),
      (mesh.name = 'fx:rayos'),
      this.scene.add(mesh),
      this.systems.push(mesh),
      (this.shafts = mesh));
  }
  /** Intensidad de faroles, luciérnagas y luz general según el momento del día. */
  setLevels({ lamps = 1, fireflies = 1, light = 1 } = {}) {
    this.lampFactor = lamps;
    for (let sys of this.systems)
      sys.material.uniforms.uLight && (sys.material.uniforms.uLight.value = light);
    ((this.light = light),
      this.halo && (this.halo.material.uniforms.uAmount.value = Math.min(1, lamps)),
      this.fireflies && (this.fireflies.material.uniforms.uAmount.value = fireflies));
  }
  update(dt, time, camera, focus, viewH) {
    let pxScale = viewH / (2 * Math.tan(MathUtils.degToRad(camera.fov) / 2));
    for (let sys of this.systems) {
      let uniforms = sys.material.uniforms;
      ((uniforms.uTime.value = time),
        (uniforms.uScale.value = pxScale),
        this.fog &&
          (uniforms.fogColor.value.copy(this.fog.color),
          (uniforms.fogNear.value = this.fog.near),
          (uniforms.fogFar.value = this.fog.far)),
        sys.userData.follow && focus && sys.position.set(focus.x, focus.y, focus.z));
    }
    if (((this._t -= dt), this._t <= 0 && focus)) {
      this._t = 0.3;
      let active = this.lampSources.filter(
        (lamp) => lamp.on && (lamp.kind === 'fire' || lamp.kind === 'forge' || this.lampFactor > 0.05),
      );
      (active.sort(
        (lampA, lampB) =>
          lampA.pos.distanceToSquared(focus) / lampA.energy -
          lampB.pos.distanceToSquared(focus) / lampB.energy,
      ),
        (this.assigned = active.slice(
          0,
          Math.min(this.lights.length, this.maxLights ?? this.lights.length),
        )));
    }
    let assigned = this.assigned || [];
    for (let k = 0; k < this.lights.length; k++) {
      let light = this.lights[k],
        lamp = assigned[k];
      if (!lamp) {
        light.intensity = Math.max(0, light.intensity - dt * 4);
        continue;
      }
      (light.position.copy(lamp.pos),
        (lamp._c ??= new Color(lamp.color)),
        light.color.copy(lamp._c),
        (light.distance = lamp.range));
      let flicker =
          lamp.kind === 'fire' || lamp.kind === 'forge' || lamp.kind === 'torch'
            ? 0.82 + 0.12 * Math.sin(time * 9.1 + k * 3) + 0.06 * Math.sin(time * 17.3 + k)
            : 0.96 + 0.04 * Math.sin(time * 5 + k),
        factor =
          lamp.kind === 'fire' || lamp.kind === 'forge' || lamp.kind === 'torch'
            ? Math.max(0.35, this.lampFactor)
            : this.lampFactor,
        target = lamp.energy * 4.5 * flicker * factor;
      light.intensity += (target - light.intensity) * Math.min(1, dt * 6);
    }
  }
  dispose() {
    for (let sys of this.systems) (sys.geometry.dispose(), sys.material.dispose(), this.scene.remove(sys));
    for (let light of this.lights) (this.scene.remove(light), light.dispose?.());
  }
};

export { WorldFx };
