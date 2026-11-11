// vfx/shaders.js
// Piezas de efecto con sombreador propio (ShaderMaterial, ruido fbm en GLSL). Cada clase crea su
// `mesh` y tiene `update(dt)`, que devuelve false cuando la pieza ha terminado, y `dispose()`:
//   Beam        cinta entre puntos (rayo continuo, relámpago que se rehace o estela que se afina)
//   RingWave    onda en anillo que se expande por el suelo (o en vertical)
//   Dome        cúpula o esfera translúcida con borde de Fresnel y retícula hexagonal opcional
//   LightPillar columna de luz que cae y se ensancha
//   HexWave     casillas hexagonales que se encienden en oleada desde un origen
//   RuneCircle  círculo mágico giratorio sobre el suelo (textura del atlas.js)
//   SlashArc    arco de tajo de cuerpo a cuerpo orientado a la cámara
//   Decal       silueta del atlas tumbada en el suelo
// Las usan vfx/index.js (métodos ring, dome, pillar, hexwave, runes, slash, decal, beam…),
// conditions.js y zones.js. Reconstruido de publicado/juego.js (módulo __esm «zm»).

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  DynamicDrawUsage,
  FrontSide,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  NormalBlending,
  PlaneGeometry,
  ShaderMaterial,
  ShapeGeometry,
  SphereGeometry,
  Vector2,
  Vector3,
} from 'three';
import { getParticleAtlas, getMagicCircleTexture, ATLAS_COLS, ATLAS_ROWS } from './atlas.js';
import { hexShape, HEX_SIZE, HEX_RADIUS } from '../explore/hex.js';
import { toColor } from './particles.js';

/** Color como Vector3 multiplicado por `glow` (valores > 1 hacen que brille con el bloom). */
function glowColor(color, glow = 1) {
  let rgb = toColor(color).clone();
  return new Vector3(rgb.r * glow, rgb.g * glow, rgb.b * glow);
}
/** ShaderMaterial transparente sin escritura de profundidad; mezcla aditiva salvo `blend: 'alpha'`. */
function makeMaterial(
  uniforms,
  vertexShader,
  fragmentShader,
  { blend = 'add', side = FrontSide, depthTest = !0 } = {},
) {
  return new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: !0,
    depthWrite: !1,
    depthTest,
    side,
    blending: blend === 'add' ? AdditiveBlending : NormalBlending,
  });
}
/** Geometría plana de una casilla hexagonal (95 % del tamaño), compartida. */
function getHexGeometry() {
  return (
    hexGeometry ||
      ((hexGeometry = new ShapeGeometry(hexShape(HEX_RADIUS * HEX_SIZE * 0.95))),
      hexGeometry.rotateX(-Math.PI / 2)),
    hexGeometry
  );
}
// Ruido de valor y fbm en GLSL, compartido por los sombreadores de fragmentos.
const NOISE_GLSL = `
float vh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(vh(i), vh(i+vec2(1,0)), f.x), mix(vh(i+vec2(0,1)), vh(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ return 0.55*vn(p) + 0.3*vn(p*2.1+3.1) + 0.15*vn(p*4.3+7.7); }`;
/** Suavizado cúbico de salida en [0, 1]. */
const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const BEAM_VERTEX_SHADER = `
attribute float aW;
varying vec2 vUv; varying float vW;
void main(){ vUv = uv; vW = aW; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const BEAM_FRAGMENT_SHADER = `
uniform vec3 uColor; uniform float uAlpha; uniform float uTime; uniform float uLen; uniform float uMode; uniform float uSpeed; uniform float uHot;
varying vec2 vUv; varying float vW;
${NOISE_GLSL}
void main(){
  float across = abs(vUv.y * 2.0 - 1.0);
  float core = pow(1.0 - across, 1.6);
  float hot = pow(1.0 - across, 8.0);
  float n = fbm(vec2(vUv.x * uLen * 1.6 - uTime * uSpeed, vUv.y * 2.0 + uTime * 0.7));
  float a = core * (0.55 + 0.9 * n);
  if (uMode > 1.5) a *= smoothstep(0.0, 0.25, vUv.x); // rastro: se apaga hacia la cola
  float alpha = clamp(a, 0.0, 1.0) * uAlpha * vW;
  vec3 col = uColor * (0.7 + 0.8 * n) + uColor * hot * uHot + vec3(hot * uHot * 0.35);
  gl_FragColor = vec4(col, alpha);
}`;
/**
 * Cinta de luz entre puntos. `mode`: 'beam' (rayo), 'bolt' (relámpago: rehace el zigzag al azar) o
 * 'trail' (estela que se afina hacia la cola). `life` 0 = permanente hasta que se retire.
 */
const Beam = class {
  constructor({
    max = 40,
    width = 0.18,
    color = 16777215,
    glow = 2,
    alpha = 1,
    mode = 'beam',
    speed = 6,
    life = 0.5,
    fadeIn = 0.06,
    jitter = 0.25,
    hot = null,
  } = {}) {
    ((this.max = max),
      (this.width = width),
      (this.mode = mode),
      (this.life = life),
      (this.fadeIn = fadeIn),
      (this.alpha = alpha),
      (this.jitter = jitter),
      (this.t = 0),
      (this.pts = []),
      (this.base = []),
      (this.widths = null));
    let geometry = new BufferGeometry();
    (geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(max * 6), 3).setUsage(DynamicDrawUsage),
    ),
      geometry.setAttribute(
        'uv',
        new BufferAttribute(new Float32Array(max * 4), 2).setUsage(DynamicDrawUsage),
      ),
      geometry.setAttribute(
        'aW',
        new BufferAttribute(new Float32Array(max * 2), 1).setUsage(DynamicDrawUsage),
      ));
    let indices = [];
    for (let i = 0; i < max - 1; i++) {
      let v = i * 2;
      indices.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
    }
    (geometry.setIndex(indices),
      (this.geo = geometry),
      (this.uniforms = {
        uColor: { value: glowColor(color, glow) },
        uAlpha: { value: 0 },
        uTime: { value: Math.random() * 10 },
        uLen: { value: 1 },
        uMode: { value: mode === 'trail' ? 2 : mode === 'bolt' ? 1 : 0 },
        uSpeed: { value: speed },
        uHot: { value: hot ?? (mode === 'trail' ? 0.4 : 1.2) },
      }),
      (this.mesh = new Mesh(
        geometry,
        makeMaterial(this.uniforms, BEAM_VERTEX_SHADER, BEAM_FRAGMENT_SHADER, { side: DoubleSide }),
      )),
      (this.mesh.frustumCulled = !1),
      (this.mesh.renderOrder = 13));
  }
  /** Fija los puntos de la cinta (se copian). */
  setPoints(points) {
    return (
      (this.base = points.map((p) => p.clone())),
      this.mode === 'bolt' ? this.rebolt() : (this.pts = this.base.map((p) => p.clone())),
      this
    );
  }
  /** Cinta recta de `from` a `to` partida en `segments` tramos. */
  setLine(from, to, segments = 16) {
    let points = [];
    for (let i = 0; i <= segments; i++) points.push(from.clone().lerp(to, i / segments));
    return this.setPoints(points);
  }
  /** Rehace el zigzag del relámpago a partir de los extremos de `base`. */
  rebolt() {
    let start = this.base[0],
      end = this.base[this.base.length - 1],
      segments = Math.min(this.max - 1, 18),
      length = start.distanceTo(end),
      dir = end.clone().sub(start).normalize(),
      side = new Vector3(-dir.z, 0, dir.x),
      up = new Vector3().crossVectors(dir, side).normalize();
    this.pts = [];
    for (let i = 0; i <= segments; i++) {
      let f = i / segments,
        point = start.clone().lerp(end, f);
      if (i > 0 && i < segments) {
        let amp = this.jitter * Math.min(1, length / 3) * Math.sin(f * Math.PI);
        point
          .addScaledVector(side, (Math.random() - 0.5) * 2 * amp)
          .addScaledVector(up, (Math.random() - 0.5) * 2 * amp);
      }
      this.pts.push(point);
    }
  }
  /** Reconstruye la tira de triángulos encarada a la cámara. */
  build(camera) {
    let pts = this.pts,
      count = Math.min(pts.length, this.max);
    if (count < 2) {
      this.geo.setDrawRange(0, 0);
      return;
    }
    let positions = this.geo.attributes.position.array,
      uvs = this.geo.attributes.uv.array,
      weights = this.geo.attributes.aW.array,
      tangent = new Vector3(),
      toCamera = new Vector3(),
      side = new Vector3(),
      totalLength = 0;
    for (let i = 1; i < count; i++) totalLength += pts[i].distanceTo(pts[i - 1]);
    let traveled = 0;
    for (let i = 0; i < count; i++) {
      i > 0 && (traveled += pts[i].distanceTo(pts[i - 1]));
      let prev = pts[Math.max(0, i - 1)],
        next = pts[Math.min(count - 1, i + 1)];
      (tangent.subVectors(next, prev).normalize(),
        toCamera.subVectors(camera.position, pts[i]).normalize(),
        side.crossVectors(tangent, toCamera).normalize());
      let halfWidth = this.width * (this.widths ? (this.widths[i] ?? 1) : 1);
      (this.mode === 'trail' && (halfWidth *= 0.25 + 0.75 * (i / (count - 1))),
        side.multiplyScalar(halfWidth / 2));
      let o = i * 6;
      ((positions[o] = pts[i].x + side.x),
        (positions[o + 1] = pts[i].y + side.y),
        (positions[o + 2] = pts[i].z + side.z),
        (positions[o + 3] = pts[i].x - side.x),
        (positions[o + 4] = pts[i].y - side.y),
        (positions[o + 5] = pts[i].z - side.z));
      let along = totalLength > 0 ? traveled / totalLength : 0;
      ((uvs[i * 4] = along),
        (uvs[i * 4 + 1] = 0),
        (uvs[i * 4 + 2] = along),
        (uvs[i * 4 + 3] = 1),
        (weights[i * 2] = weights[i * 2 + 1] = 1));
    }
    ((this.uniforms.uLen.value = totalLength),
      (this.geo.attributes.position.needsUpdate = !0),
      (this.geo.attributes.uv.needsUpdate = !0),
      (this.geo.attributes.aW.needsUpdate = !0),
      this.geo.setDrawRange(0, (count - 1) * 6));
  }
  update(dt, camera) {
    ((this.t += dt),
      (this.uniforms.uTime.value += dt),
      this.mode === 'bolt' && Math.random() < dt * 22 && this.rebolt());
    let progress = this.life > 0 ? this.t / this.life : 0,
      fadeIn = this.fadeIn > 0 ? Math.min(1, this.t / this.fadeIn) : 1,
      fadeOut = this.life > 0 ? 1 - Math.max(0, (progress - 0.55) / 0.45) : 1;
    return (
      (this.uniforms.uAlpha.value = this.alpha * fadeIn * Math.max(0, fadeOut)),
      this.build(camera),
      this.life <= 0 || this.t < this.life
    );
  }
  dispose() {
    (this.geo.dispose(), this.mesh.material.dispose());
  }
};
const QUAD_VERTEX_SHADER =
  'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const RING_FRAGMENT_SHADER = `
uniform vec3 uColor; uniform float uProg; uniform float uThick; uniform float uAlpha; uniform float uFill;
varying vec2 vUv;
${NOISE_GLSL}
void main(){
  vec2 q = vUv * 2.0 - 1.0;
  float r = length(q);
  float e = 1.0 - pow(1.0 - uProg, 3.0);
  float front = mix(0.08, 1.0, e);
  float band = smoothstep(front - uThick, front, r) * (1.0 - smoothstep(front, front + 0.025, r));
  float ang = atan(q.y, q.x);
  float n = fbm(vec2(ang * 3.0, r * 6.0 - uProg * 4.0));
  float fill = uFill * (1.0 - smoothstep(0.0, front, r)) * 0.35;
  float a = (band * (0.6 + 0.8 * n) + fill * n) * uAlpha * (1.0 - uProg);
  gl_FragColor = vec4(uColor * (0.8 + 0.6 * n), a);
}`;
/** Onda en anillo que se expande desde `pos` hasta `radius` en `life` segundos. */
const RingWave = class {
  constructor(
    pos,
    {
      color = 16777215,
      glow = 2,
      radius = 2,
      life = 0.5,
      thick = 0.18,
      alpha = 1,
      fill = 0,
      y = 0.05,
      vertical = null,
    } = {},
  ) {
    ((this.life = life),
      (this.t = 0),
      (this.uniforms = {
        uColor: { value: glowColor(color, glow) },
        uProg: { value: 0 },
        uThick: { value: thick },
        uAlpha: { value: alpha },
        uFill: { value: fill },
      }));
    let geometry = new PlaneGeometry(2, 2);
    ((this.mesh = new Mesh(
      geometry,
      makeMaterial(this.uniforms, QUAD_VERTEX_SHADER, RING_FRAGMENT_SHADER, { side: DoubleSide }),
    )),
      this.mesh.position.copy(pos),
      (this.mesh.position.y += y),
      vertical ? this.mesh.lookAt(pos.clone().add(vertical)) : (this.mesh.rotation.x = -Math.PI / 2),
      this.mesh.scale.setScalar(radius),
      (this.mesh.renderOrder = 10));
  }
  update(dt) {
    return (
      (this.t += dt),
      (this.uniforms.uProg.value = Math.min(1, this.t / this.life)),
      this.t < this.life
    );
  }
  dispose() {
    (this.mesh.geometry.dispose(), this.mesh.material.dispose());
  }
};
const DOME_VERTEX_SHADER = `
varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vP = position;
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const DOME_FRAGMENT_SHADER = `
uniform vec3 uColor; uniform float uAlpha; uniform float uTime; uniform float uHex;
varying vec3 vN; varying vec3 vV; varying vec3 vP;
${NOISE_GLSL}
void main(){
  float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
  float bands = 0.5 + 0.5 * sin(vP.y * 18.0 - uTime * 4.0);
  float n = fbm(vec2(atan(vP.z, vP.x) * 3.0 + uTime * 0.4, vP.y * 4.0 - uTime));
  vec2 h = vec2(atan(vP.z, vP.x) * 4.0, vP.y * 7.0);
  vec2 g = abs(fract(h) - 0.5);
  float hexl = uHex * smoothstep(0.42, 0.5, max(g.x, g.y));
  float a = (f * f * (0.8 + 0.5 * n) + bands * 0.03 + hexl * 0.3) * uAlpha * smoothstep(-0.02, 0.08, vP.y);
  gl_FragColor = vec4(uColor * (0.9 + 0.4 * n), a);
}`;
/** Cúpula (o esfera si `half` es false) que crece y se desvanece; `life` 0 = permanente. */
const Dome = class {
  constructor(
    pos,
    { color = 16777215, glow = 1.6, radius = 1, life = 0.6, alpha = 0.8, grow = !0, hex = 0, half = !0 } = {},
  ) {
    ((this.life = life),
      (this.t = 0),
      (this.radius = radius),
      (this.grow = grow),
      (this.alpha = alpha),
      (this.uniforms = {
        uColor: { value: glowColor(color, glow) },
        uAlpha: { value: alpha },
        uTime: { value: 0 },
        uHex: { value: hex },
      }));
    let geometry = new SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, half ? Math.PI / 2 : Math.PI);
    ((this.mesh = new Mesh(
      geometry,
      makeMaterial(this.uniforms, DOME_VERTEX_SHADER, DOME_FRAGMENT_SHADER, { side: DoubleSide }),
    )),
      this.mesh.position.copy(pos),
      this.mesh.scale.setScalar(grow ? radius * 0.2 : radius),
      (this.mesh.renderOrder = 9));
  }
  update(dt) {
    if (((this.t += dt), (this.uniforms.uTime.value += dt), this.life <= 0)) return !0;
    let progress = Math.min(1, this.t / this.life);
    return (
      this.grow &&
        this.mesh.scale.setScalar(this.radius * (0.2 + 0.8 * easeOutCubic(Math.min(1, progress * 1.6)))),
      (this.uniforms.uAlpha.value = this.alpha * (1 - progress) ** 1.5),
      progress < 1
    );
  }
  dispose() {
    (this.mesh.geometry.dispose(), this.mesh.material.dispose());
  }
};
const PILLAR_VERTEX_SHADER = `
varying vec2 vUv; varying float vF;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec3 n = normalize(mat3(modelMatrix) * normal);
  vF = abs(dot(n, normalize(cameraPosition - wp.xyz)));
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const PILLAR_FRAGMENT_SHADER = `
uniform vec3 uColor; uniform float uAlpha; uniform float uTime;
varying vec2 vUv; varying float vF;
${NOISE_GLSL}
void main(){
  float n = fbm(vec2(vUv.x * 10.0, vUv.y * 3.0 + uTime * 2.5));
  float streak = smoothstep(0.45, 1.0, fbm(vec2(vUv.x * 22.0, vUv.y * 0.8 + uTime * 1.2)));
  float edge = pow(vF, 0.8);
  float a = (0.18 + 0.4 * n + streak * 0.8) * pow(1.0 - vUv.y, 1.2) * smoothstep(0.0, 0.05, vUv.y) * edge * uAlpha;
  gl_FragColor = vec4(uColor * (0.7 + 0.5 * n + streak), a);
}`;
/** Columna de luz que cae sobre `pos` (`drop`: duración de la caída); `life` 0 = permanente. */
const LightPillar = class {
  constructor(
    pos,
    { color = 16773312, glow = 1.4, radius = 0.6, height = 6, life = 0.8, alpha = 0.8, drop = 0.18 } = {},
  ) {
    ((this.life = life),
      (this.t = 0),
      (this.radius = radius),
      (this.height = height),
      (this.alpha = alpha),
      (this.drop = drop),
      (this.uniforms = {
        uColor: { value: glowColor(color, glow) },
        uAlpha: { value: 0 },
        uTime: { value: Math.random() * 5 },
      }));
    let geometry = new CylinderGeometry(1, 1, 1, 24, 1, !0);
    (geometry.translate(0, 0.5, 0),
      (this.mesh = new Mesh(
        geometry,
        makeMaterial(this.uniforms, PILLAR_VERTEX_SHADER, PILLAR_FRAGMENT_SHADER, { side: DoubleSide }),
      )),
      this.mesh.position.copy(pos),
      this.mesh.scale.set(radius * 0.3, height, radius * 0.3),
      (this.mesh.renderOrder = 10));
  }
  update(dt) {
    if (((this.t += dt), (this.uniforms.uTime.value += dt), this.life <= 0)) {
      this.uniforms.uAlpha.value = this.alpha * Math.min(1, this.t / 0.3);
      let grownRadius = this.radius * Math.min(1, 0.3 + this.t * 3);
      return (this.mesh.scale.set(grownRadius, this.height, grownRadius), !0);
    }
    let progress = Math.min(1, this.t / this.life),
      dropProgress = Math.min(1, this.t / this.drop),
      radius =
        this.radius *
        (0.3 + 0.7 * easeOutCubic(dropProgress)) *
        (1 - (0.5 * Math.max(0, progress - 0.6)) / 0.4);
    return (
      this.mesh.scale.set(radius, this.height, radius),
      (this.uniforms.uAlpha.value = this.alpha * dropProgress * (1 - Math.max(0, (progress - 0.5) / 0.5))),
      progress < 1
    );
  }
  dispose() {
    (this.mesh.geometry.dispose(), this.mesh.material.dispose());
  }
};
const HEXWAVE_VERTEX_SHADER = `
attribute float iDelay;
varying vec2 vL; varying float vD; varying vec2 vW;
void main(){
  vL = position.xz / ${(HEX_RADIUS * HEX_SIZE * 0.95).toFixed(4)};
  vD = iDelay;
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vW = wp.xz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const HEXWAVE_FRAGMENT_SHADER = `
uniform vec3 uColor; uniform float uTime; uniform float uSpread; uniform float uLife; uniform float uHold; uniform float uAlpha; uniform float uPulse;
varying vec2 vL; varying float vD; varying vec2 vW;
${NOISE_GLSL}
void main(){
  // distancia \xABhexagonal\xBB al centro (1 en el borde)
  vec2 q = abs(vL);
  float vR = max(q.x, 0.5 * q.x + 0.8660254 * q.y) / 0.8660254;
  float t = uTime - vD * uSpread;
  if (t < 0.0) discard;
  float rise = smoothstep(0.0, 0.08, t);
  float fall = uHold > 0.0 ? 1.0 : 1.0 - smoothstep(uLife * 0.35, uLife, t);
  float n = fbm(vW * 1.3 + vec2(uTime * 0.6, -uTime * 0.4));
  float edge = smoothstep(0.72, 0.97, vR);
  float flash = exp(-t * 9.0);
  float pulse = uPulse * (0.5 + 0.5 * sin(uTime * 2.4 + vD * 6.0));
  float a = rise * fall * (0.08 + 0.18 * n + edge * 0.5 + flash * 0.35 + pulse * 0.1) * uAlpha;
  gl_FragColor = vec4(uColor * (0.7 + 0.4 * n + flash * 0.6), clamp(a, 0.0, 1.0));
}`;
let hexGeometry = null;
/**
 * Casillas que se encienden en oleada: `cells` son casillas de la rejilla y `cellToWorld` las pasa a
 * posiciones; el retardo de cada una crece con su distancia al origen. `hold` la mantiene hasta
 * `release()`.
 */
const HexWave = class {
  constructor(
    cells,
    cellToWorld,
    {
      origin = null,
      color = 16777215,
      glow = 1,
      life = 0.9,
      spread = 0.35,
      alpha = 1,
      hold = !1,
      pulse = 0,
      blend = 'add',
      y = 0.05,
    } = {},
  ) {
    ((this.life = life), (this.hold = hold), (this.t = 0));
    let count = cells.length,
      mesh = new InstancedMesh(getHexGeometry(), null, Math.max(1, count)),
      delays = new Float32Array(Math.max(1, count)),
      positions = cells.map((cell) => cellToWorld(cell)),
      center =
        origin || positions.reduce((sum, p) => sum.add(p), new Vector3()).divideScalar(Math.max(1, count)),
      maxDist = 0.001;
    for (let p of positions) maxDist = Math.max(maxDist, Math.hypot(p.x - center.x, p.z - center.z));
    let matrix = new Matrix4();
    (positions.forEach((p, i) => {
      (matrix.makeTranslation(p.x, p.y + y, p.z),
        mesh.setMatrixAt(i, matrix),
        (delays[i] = Math.hypot(p.x - center.x, p.z - center.z) / maxDist));
    }),
      (mesh.count = count),
      (mesh.geometry = getHexGeometry().clone()),
      mesh.geometry.setAttribute('iDelay', new InstancedBufferAttribute(delays, 1)),
      (this.uniforms = {
        uColor: { value: glowColor(color, glow) },
        uTime: { value: 0 },
        uSpread: { value: spread },
        uLife: { value: life },
        uHold: { value: hold ? 1 : 0 },
        uAlpha: { value: alpha },
        uPulse: { value: pulse },
      }),
      (mesh.material = makeMaterial(this.uniforms, HEXWAVE_VERTEX_SHADER, HEXWAVE_FRAGMENT_SHADER, {
        blend,
      })),
      (mesh.frustumCulled = !1),
      (mesh.renderOrder = 8),
      (this.mesh = mesh),
      (this.fadeOut = 0));
  }
  /** Apaga la oleada mantenida en `duration` segundos. */
  release(duration = 0.6) {
    ((this.fadeOut = duration), (this.fadeT = 0));
  }
  update(dt) {
    return (
      (this.t += dt),
      (this.uniforms.uTime.value = this.t),
      this.fadeOut > 0
        ? ((this.fadeT += dt),
          (this.uniforms.uAlpha.value *= Math.max(
            0,
            1 - dt / Math.max(0.05, this.fadeOut - this.fadeT + dt),
          )),
          this.fadeT < this.fadeOut)
        : this.hold
          ? !0
          : this.t < this.life + this.uniforms.uSpread.value
    );
  }
  dispose() {
    (this.mesh.geometry.dispose(), this.mesh.material.dispose());
  }
};
const RUNES_FRAGMENT_SHADER = `
uniform sampler2D uTex; uniform vec3 uColor; uniform float uAlpha; uniform float uTime;
varying vec2 vUv;
void main(){
  vec4 t = texture2D(uTex, vUv);
  float pulse = 0.8 + 0.2 * sin(uTime * 5.0);
  gl_FragColor = vec4(uColor * pulse, t.a * uAlpha);
}`;
/** Círculo mágico que gira y crece sobre el suelo; `life` 0 = hasta `close()`. */
const RuneCircle = class {
  constructor(
    pos,
    {
      color = 11832575,
      glow = 2.2,
      radius = 1,
      life = 1,
      alpha = 0.9,
      spin = 0.8,
      y = 0.06,
      grow = 0.25,
    } = {},
  ) {
    ((this.life = life),
      (this.t = 0),
      (this.spin = spin),
      (this.radius = radius),
      (this.alpha = alpha),
      (this.growT = grow),
      (this.uniforms = {
        uTex: { value: getMagicCircleTexture() },
        uColor: { value: glowColor(color, glow) },
        uAlpha: { value: 0 },
        uTime: { value: 0 },
      }),
      (this.mesh = new Mesh(
        new PlaneGeometry(2, 2),
        makeMaterial(this.uniforms, QUAD_VERTEX_SHADER, RUNES_FRAGMENT_SHADER, { side: DoubleSide }),
      )),
      (this.mesh.rotation.x = -Math.PI / 2),
      this.mesh.position.copy(pos),
      (this.mesh.position.y += y),
      this.mesh.scale.setScalar(radius * 0.4),
      (this.mesh.renderOrder = 9),
      (this.closing = -1));
  }
  /** Cierra el círculo (se desvanece y se agranda) en `duration` segundos. */
  close(duration = 0.35) {
    ((this.closing = duration), (this.closeT = 0));
  }
  update(dt) {
    ((this.t += dt), (this.uniforms.uTime.value = this.t), (this.mesh.rotation.z += this.spin * dt));
    let growth = Math.min(1, this.t / Math.max(0.01, this.growT)),
      alpha = this.alpha * growth,
      radius = this.radius * (0.4 + 0.6 * easeOutCubic(growth));
    if (this.closing > 0) {
      this.closeT += dt;
      let progress = Math.min(1, this.closeT / this.closing);
      if (((alpha *= 1 - progress), (radius *= 1 + 0.25 * progress), progress >= 1)) return !1;
    } else if (this.life > 0) {
      let progress = this.t / this.life;
      if (progress >= 1) return !1;
      alpha *= 1 - Math.max(0, (progress - 0.7) / 0.3);
    }
    return ((this.uniforms.uAlpha.value = alpha), this.mesh.scale.setScalar(radius), !0);
  }
  dispose() {
    (this.mesh.geometry.dispose(), this.mesh.material.dispose());
  }
};
const SLASH_FRAGMENT_SHADER = `
uniform vec3 uColor; uniform float uProg; uniform float uAlpha;
varying vec2 vUv;
void main(){
  vec2 q = vUv * 2.0 - 1.0;
  float r = length(q);
  float ang = atan(q.y, q.x);           // -pi..pi
  float span = 2.3;                      // radianes del arco
  float k = (ang + span * 0.5) / span;   // 0..1 a lo largo del arco
  if (k < 0.0 || k > 1.0) discard;
  float head = uProg * 1.25;
  if (k > head) discard;
  float tail = smoothstep(head - 0.75, head, k);
  float thick = 0.13 * sin(k * 3.14159) + 0.015;
  float band = 1.0 - smoothstep(0.0, thick, abs(r - 0.78));
  float hot = 1.0 - smoothstep(0.0, thick * 0.35, abs(r - 0.78));
  float a = band * tail * uAlpha * (1.0 - smoothstep(0.75, 1.0, uProg));
  gl_FragColor = vec4(uColor * (1.0 + hot * 1.5), a);
}`;
/** Arco de tajo orientado como la cámara, con giro `roll` (al azar si es null). */
const SlashArc = class {
  constructor(
    pos,
    camera,
    { color = 16777215, glow = 2.2, size = 1.1, life = 0.28, roll = null, alpha = 1 } = {},
  ) {
    ((this.life = life),
      (this.t = 0),
      (this.uniforms = {
        uColor: { value: glowColor(color, glow) },
        uProg: { value: 0 },
        uAlpha: { value: alpha },
      }),
      (this.mesh = new Mesh(
        new PlaneGeometry(2, 2),
        makeMaterial(this.uniforms, QUAD_VERTEX_SHADER, SLASH_FRAGMENT_SHADER, {
          side: DoubleSide,
          depthTest: !1,
        }),
      )),
      this.mesh.position.copy(pos),
      this.mesh.quaternion.copy(camera.quaternion),
      this.mesh.rotateZ(roll ?? (Math.random() - 0.5) * 2.2 + (Math.random() < 0.5 ? 0 : Math.PI)),
      this.mesh.scale.setScalar(size * 0.5),
      (this.size = size),
      (this.mesh.renderOrder = 14));
  }
  update(dt) {
    this.t += dt;
    let progress = Math.min(1, this.t / this.life);
    return (
      (this.uniforms.uProg.value = progress),
      this.mesh.scale.setScalar(this.size * (0.5 + 0.5 * easeOutCubic(progress))),
      progress < 1
    );
  }
  dispose() {
    (this.mesh.geometry.dispose(), this.mesh.material.dispose());
  }
};
const DECAL_FRAGMENT_SHADER = `
uniform sampler2D uAtlas; uniform vec3 uColor; uniform float uAlpha; uniform vec2 uCell;
varying vec2 vUv;
void main(){
  vec2 uv = vec2((uCell.x + vUv.x) / ${ATLAS_COLS.toFixed(1)}, (${ATLAS_ROWS.toFixed(1)} - uCell.y - 1.0 + vUv.y) / ${ATLAS_ROWS.toFixed(1)});
  vec4 t = texture2D(uAtlas, uv);
  gl_FragColor = vec4(uColor * t.rgb, t.a * uAlpha);
}`;
/** Silueta del atlas (`frame`) tumbada sobre el suelo; `life` 0 = permanente. */
const Decal = class {
  constructor(
    pos,
    {
      frame = 0,
      color = 16777215,
      glow = 1,
      size = 1,
      life = 1.5,
      alpha = 0.8,
      blend = 'add',
      spin = 0,
      y = 0.04,
      rot = Math.random() * 6.28,
    } = {},
  ) {
    ((this.life = life),
      (this.t = 0),
      (this.alpha = alpha),
      (this.spin = spin),
      (this.uniforms = {
        uAtlas: { value: getParticleAtlas() },
        uColor: { value: glowColor(color, glow) },
        uAlpha: { value: alpha },
        uCell: { value: new Vector2(frame % ATLAS_COLS, Math.floor(frame / ATLAS_COLS)) },
      }),
      (this.mesh = new Mesh(
        new PlaneGeometry(1, 1),
        makeMaterial(this.uniforms, QUAD_VERTEX_SHADER, DECAL_FRAGMENT_SHADER, { blend, side: DoubleSide }),
      )),
      this.mesh.rotation.set(-Math.PI / 2, 0, rot),
      this.mesh.position.copy(pos),
      (this.mesh.position.y += y),
      this.mesh.scale.setScalar(size),
      (this.mesh.renderOrder = 7));
  }
  update(dt) {
    if (((this.t += dt), (this.mesh.rotation.z += this.spin * dt), this.life <= 0)) return !0;
    let progress = this.t / this.life;
    return (
      (this.uniforms.uAlpha.value =
        this.alpha * Math.min(1, this.t / 0.1) * (1 - Math.max(0, (progress - 0.5) / 0.5))),
      progress < 1
    );
  }
  dispose() {
    (this.mesh.geometry.dispose(), this.mesh.material.dispose());
  }
};

export { SlashArc, Dome, LightPillar, HexWave, RingWave, RuneCircle, Beam, Decal };
