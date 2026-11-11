// vfx/particles.js
// Sistema de partículas por instancias: un solo Mesh de quads (InstancedBufferGeometry) con un
// ShaderMaterial que toma las siluetas del atlas. Cada partícula tiene posición, velocidad, vida,
// tamaño y color interpolados, casilla del atlas, giro, gravedad, rozamiento, estiramiento según la
// velocidad, parpadeo y modo «fijada» (no envejece; la mueve quien la creó con `place`).
// Lo usa vfx/index.js (un sistema aditivo y otro con mezcla normal); shaders.js usa `toColor`.
// Reconstruido de publicado/juego.js (módulo __esm «t1»).

import {
  AdditiveBlending,
  BufferAttribute,
  Color,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  NormalBlending,
  ShaderMaterial,
} from 'three';
import { getParticleAtlas, ATLAS_COLS, ATLAS_ROWS } from './atlas.js';

/** Convierte un color (Color, [r, g, b] o número/cadena) en un Color; por defecto escribe en `tmpColor`. */
function toColor(value, target = tmpColor) {
  return value && value.isColor
    ? target.copy(value)
    : Array.isArray(value)
      ? target.setRGB(value[0], value[1], value[2])
      : target.set(value ?? 16777215);
}
// Sombreador de vértices: billboard orientado a cámara, girado o estirado según la velocidad.
const PARTICLE_VERTEX_SHADER = `
attribute vec3 iPos;
attribute vec3 iVel;
attribute vec4 iCol;
attribute vec4 iPar; // tama\xF1o, casilla del atlas, giro, estiramiento
varying vec2 vUv;
varying vec4 vCol;
uniform float uCols;
uniform float uRows;
void main() {
  vec4 mv = modelViewMatrix * vec4(iPos, 1.0);
  vec2 corner = position.xy;
  float size = iPar.x;
  vec2 c;
  if (iPar.w > 0.0) {
    vec2 d = (modelViewMatrix * vec4(iVel, 0.0)).xy;
    float L = length(d);
    if (L > 1e-4) {
      d /= L;
      vec2 n = vec2(-d.y, d.x);
      c = d * corner.y * size * (1.0 + L * iPar.w) + n * corner.x * size;
    } else c = corner * size;
  } else {
    float cs = cos(iPar.z);
    float sn = sin(iPar.z);
    c = vec2(corner.x * cs - corner.y * sn, corner.x * sn + corner.y * cs) * size;
  }
  mv.xy += c;
  gl_Position = projectionMatrix * mv;
  float f = iPar.y;
  vec2 cell = vec2(mod(f, uCols), floor(f / uCols));
  vUv = vec2((cell.x + corner.x + 0.5) / uCols, (uRows - cell.y - 1.0 + corner.y + 0.5) / uRows);
  vCol = iCol;
  if (size <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
const PARTICLE_FRAGMENT_SHADER = `
uniform sampler2D uAtlas;
varying vec2 vUv;
varying vec4 vCol;
void main() {
  vec4 t = texture2D(uAtlas, vUv);
  float a = t.a * vCol.a;
  if (a < 0.003) discard;
  gl_FragColor = vec4(vCol.rgb * t.rgb, a);
}`;
const tmpColor = new Color();
/** Sistema de hasta `capacity` partículas; `blend` es 'add' (aditiva) o cualquier otro valor (normal). */
const ParticleSystem = class {
  constructor(capacity, blend = 'add') {
    ((this.max = capacity), (this.blend = blend));
    let count = capacity;
    ((this.p = new Float32Array(count * 3)),
      (this.v = new Float32Array(count * 3)),
      (this.age = new Float32Array(count)),
      (this.life = new Float32Array(count).fill(-1)),
      (this.s0 = new Float32Array(count)),
      (this.s1 = new Float32Array(count)),
      (this.c0 = new Float32Array(count * 3)),
      (this.c1 = new Float32Array(count * 3)),
      (this.a0 = new Float32Array(count)),
      (this.a1 = new Float32Array(count)),
      (this.fin = new Float32Array(count)),
      (this.frame = new Float32Array(count)),
      (this.rot = new Float32Array(count)),
      (this.spin = new Float32Array(count)),
      (this.grav = new Float32Array(count)),
      (this.drag = new Float32Array(count)),
      (this.str = new Float32Array(count)),
      (this.flick = new Float32Array(count)),
      (this.pinned = new Uint8Array(count)),
      (this.free = []));
    for (let i = count - 1; i >= 0; i--) this.free.push(i);
    ((this.hw = 0), (this.alive = 0));
    let geometry = new InstancedBufferGeometry();
    (geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3),
    ),
      geometry.setIndex([0, 1, 2, 0, 2, 3]));
    let makeAttribute = (itemSize) => {
      let attribute = new InstancedBufferAttribute(new Float32Array(count * itemSize), itemSize);
      return (attribute.setUsage(DynamicDrawUsage), attribute);
    };
    ((this.aPos = makeAttribute(3)),
      (this.aVel = makeAttribute(3)),
      (this.aCol = makeAttribute(4)),
      (this.aPar = makeAttribute(4)),
      geometry.setAttribute('iPos', this.aPos),
      geometry.setAttribute('iVel', this.aVel),
      geometry.setAttribute('iCol', this.aCol),
      geometry.setAttribute('iPar', this.aPar),
      (geometry.instanceCount = 0),
      (this.material = new ShaderMaterial({
        uniforms: {
          uAtlas: { value: getParticleAtlas() },
          uCols: { value: ATLAS_COLS },
          uRows: { value: ATLAS_ROWS },
        },
        vertexShader: PARTICLE_VERTEX_SHADER,
        fragmentShader: PARTICLE_FRAGMENT_SHADER,
        transparent: !0,
        depthWrite: !1,
        depthTest: !0,
        blending: blend === 'add' ? AdditiveBlending : NormalBlending,
      })),
      (this.mesh = new Mesh(geometry, this.material)),
      (this.mesh.frustumCulled = !1),
      (this.mesh.renderOrder = blend === 'add' ? 12 : 11),
      (this.mesh.name = `vfx_particulas_${blend}`),
      (this.geo = geometry));
  }
  /**
   * Crea una partícula. `opts`: p (posición), v (velocidad), life, size/size1, col/col1, glow, a/a1
   * (alfa inicial/final), fadeIn, frame, rot, spin, grav, drag, stretch, flicker, pinned.
   * Devuelve su índice o -1 si no quedan huecos.
   */
  spawn(opts) {
    if (!this.free.length) return -1;
    let index = this.free.pop(),
      pos = opts.p,
      i3 = index * 3;
    pos.isVector3
      ? ((this.p[i3] = pos.x), (this.p[i3 + 1] = pos.y), (this.p[i3 + 2] = pos.z))
      : ((this.p[i3] = pos[0]), (this.p[i3 + 1] = pos[1]), (this.p[i3 + 2] = pos[2]));
    let vel = opts.v;
    (vel
      ? vel.isVector3
        ? ((this.v[i3] = vel.x), (this.v[i3 + 1] = vel.y), (this.v[i3 + 2] = vel.z))
        : ((this.v[i3] = vel[0]), (this.v[i3 + 1] = vel[1]), (this.v[i3 + 2] = vel[2]))
      : (this.v[i3] = this.v[i3 + 1] = this.v[i3 + 2] = 0),
      (this.age[index] = 0),
      (this.life[index] = opts.life ?? 1),
      (this.s0[index] = opts.size ?? 0.2),
      (this.s1[index] = opts.size1 ?? this.s0[index]));
    let glow = opts.glow ?? 1;
    return (
      toColor(opts.col ?? 16777215),
      (this.c0[i3] = tmpColor.r * glow),
      (this.c0[i3 + 1] = tmpColor.g * glow),
      (this.c0[i3 + 2] = tmpColor.b * glow),
      opts.col1 !== void 0 && toColor(opts.col1),
      (this.c1[i3] = tmpColor.r * glow),
      (this.c1[i3 + 1] = tmpColor.g * glow),
      (this.c1[i3 + 2] = tmpColor.b * glow),
      (this.a0[index] = opts.a ?? 1),
      (this.a1[index] = opts.a1 ?? 0),
      (this.fin[index] = opts.fadeIn ?? 0.08),
      (this.frame[index] = opts.frame ?? 0),
      (this.rot[index] = opts.rot ?? Math.random() * 6.283),
      (this.spin[index] = opts.spin ?? 0),
      (this.grav[index] = opts.grav ?? 0),
      (this.drag[index] = opts.drag ?? 0),
      (this.str[index] = opts.stretch ?? 0),
      (this.flick[index] = opts.flicker ?? 0),
      (this.pinned[index] = opts.pinned ? 1 : 0),
      index + 1 > this.hw && (this.hw = index + 1),
      this.alive++,
      index
    );
  }
  /** Mueve una partícula viva (y opcionalmente fija su alfa y su tamaño). */
  place(index, x, y, z, alpha = null, size = null) {
    if (index < 0 || this.life[index] < 0) return;
    let i3 = index * 3;
    ((this.p[i3] = x),
      (this.p[i3 + 1] = y),
      (this.p[i3 + 2] = z),
      alpha !== null && (this.a0[index] = this.a1[index] = alpha),
      size !== null && (this.s0[index] = this.s1[index] = size));
  }
  kill(index) {
    index < 0 || this.life[index] < 0 || ((this.life[index] = -1), this.free.push(index), this.alive--);
  }
  /** Elimina todas las partículas (o todas menos las fijadas). */
  clear(keepPinned = !1) {
    for (let i = 0; i < this.hw; i++) this.life[i] >= 0 && !(keepPinned && this.pinned[i]) && this.kill(i);
    keepPinned || ((this.hw = 0), (this.geo.instanceCount = 0));
  }
  /** Avanza la simulación `dt` segundos y sube a la GPU solo el tramo usado (hasta la marca alta). */
  update(dt) {
    let pos = this.p,
      vel = this.v,
      posArray = this.aPos.array,
      velArray = this.aVel.array,
      colArray = this.aCol.array,
      parArray = this.aPar.array,
      highWater = 0;
    for (let i = 0; i < this.hw; i++) {
      let i3 = i * 3,
        i4 = i * 4;
      if (this.life[i] < 0) {
        parArray[i4] = 0;
        continue;
      }
      let progress;
      if (this.pinned[i]) ((this.age[i] += dt), (progress = 0));
      else {
        let age = (this.age[i] += dt),
          life = this.life[i];
        if (age >= life) {
          (this.kill(i), (parArray[i4] = 0));
          continue;
        }
        progress = age / life;
        let drag = this.drag[i];
        if (drag > 0) {
          let damping = Math.max(0, 1 - drag * dt);
          ((vel[i3] *= damping), (vel[i3 + 1] *= damping), (vel[i3 + 2] *= damping));
        }
        ((vel[i3 + 1] += this.grav[i] * dt),
          (pos[i3] += vel[i3] * dt),
          (pos[i3 + 1] += vel[i3 + 1] * dt),
          (pos[i3 + 2] += vel[i3 + 2] * dt),
          (this.rot[i] += this.spin[i] * dt));
      }
      ((highWater = i + 1),
        (posArray[i3] = pos[i3]),
        (posArray[i3 + 1] = pos[i3 + 1]),
        (posArray[i3 + 2] = pos[i3 + 2]),
        (velArray[i3] = vel[i3]),
        (velArray[i3 + 1] = vel[i3 + 1]),
        (velArray[i3 + 2] = vel[i3 + 2]));
      let fadeIn = this.fin[i],
        alpha = this.a0[i] + (this.a1[i] - this.a0[i]) * progress;
      (this.pinned[i]
        ? (alpha *= Math.min(1, this.age[i] / 0.15))
        : fadeIn > 0 && progress < fadeIn && (alpha *= progress / fadeIn),
        this.flick[i] > 0 && (alpha *= 1 - this.flick[i] * (0.5 + 0.5 * Math.sin(this.age[i] * 40 + i))),
        (colArray[i4] = this.c0[i3] + (this.c1[i3] - this.c0[i3]) * progress),
        (colArray[i4 + 1] = this.c0[i3 + 1] + (this.c1[i3 + 1] - this.c0[i3 + 1]) * progress),
        (colArray[i4 + 2] = this.c0[i3 + 2] + (this.c1[i3 + 2] - this.c0[i3 + 2]) * progress),
        (colArray[i4 + 3] = alpha),
        (parArray[i4] = this.s0[i] + (this.s1[i] - this.s0[i]) * progress),
        (parArray[i4 + 1] = this.frame[i]),
        (parArray[i4 + 2] = this.rot[i]),
        (parArray[i4 + 3] = this.str[i]));
    }
    if (((this.hw = highWater), (this.geo.instanceCount = highWater), highWater))
      for (let attr of [this.aPos, this.aVel, this.aCol, this.aPar])
        (attr.clearUpdateRanges(),
          attr.addUpdateRange(0, highWater * attr.itemSize),
          (attr.needsUpdate = !0));
  }
  dispose() {
    (this.geo.dispose(), this.material.dispose());
  }
};

export { toColor, ParticleSystem };
