// vfx/particles.js
// Reconstruido de publicado/juego.js (módulo __esm «t1»). Nombres locales aún minificados.

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

function Am(o, e = Wr) {
  return o && o.isColor ? e.copy(o) : Array.isArray(o) ? e.setRGB(o[0], o[1], o[2]) : e.set(o ?? 16777215);
}
const PI = `
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
const zI = `
uniform sampler2D uAtlas;
varying vec2 vUv;
varying vec4 vCol;
void main() {
  vec4 t = texture2D(uAtlas, vUv);
  float a = t.a * vCol.a;
  if (a < 0.003) discard;
  gl_FragColor = vec4(vCol.rgb * t.rgb, a);
}`;
const Wr = new Color();
const Su = class {
  constructor(e, t = 'add') {
    ((this.max = e), (this.blend = t));
    let a = e;
    ((this.p = new Float32Array(a * 3)),
      (this.v = new Float32Array(a * 3)),
      (this.age = new Float32Array(a)),
      (this.life = new Float32Array(a).fill(-1)),
      (this.s0 = new Float32Array(a)),
      (this.s1 = new Float32Array(a)),
      (this.c0 = new Float32Array(a * 3)),
      (this.c1 = new Float32Array(a * 3)),
      (this.a0 = new Float32Array(a)),
      (this.a1 = new Float32Array(a)),
      (this.fin = new Float32Array(a)),
      (this.frame = new Float32Array(a)),
      (this.rot = new Float32Array(a)),
      (this.spin = new Float32Array(a)),
      (this.grav = new Float32Array(a)),
      (this.drag = new Float32Array(a)),
      (this.str = new Float32Array(a)),
      (this.flick = new Float32Array(a)),
      (this.pinned = new Uint8Array(a)),
      (this.free = []));
    for (let i = a - 1; i >= 0; i--) this.free.push(i);
    ((this.hw = 0), (this.alive = 0));
    let n = new InstancedBufferGeometry();
    (n.setAttribute(
      'position',
      new BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3),
    ),
      n.setIndex([0, 1, 2, 0, 2, 3]));
    let s = (i) => {
      let r = new InstancedBufferAttribute(new Float32Array(a * i), i);
      return (r.setUsage(DynamicDrawUsage), r);
    };
    ((this.aPos = s(3)),
      (this.aVel = s(3)),
      (this.aCol = s(4)),
      (this.aPar = s(4)),
      n.setAttribute('iPos', this.aPos),
      n.setAttribute('iVel', this.aVel),
      n.setAttribute('iCol', this.aCol),
      n.setAttribute('iPar', this.aPar),
      (n.instanceCount = 0),
      (this.material = new ShaderMaterial({
        uniforms: {
          uAtlas: { value: getParticleAtlas() },
          uCols: { value: ATLAS_COLS },
          uRows: { value: ATLAS_ROWS },
        },
        vertexShader: PI,
        fragmentShader: zI,
        transparent: !0,
        depthWrite: !1,
        depthTest: !0,
        blending: t === 'add' ? AdditiveBlending : NormalBlending,
      })),
      (this.mesh = new Mesh(n, this.material)),
      (this.mesh.frustumCulled = !1),
      (this.mesh.renderOrder = t === 'add' ? 12 : 11),
      (this.mesh.name = `vfx_particulas_${t}`),
      (this.geo = n));
  }
  spawn(e) {
    if (!this.free.length) return -1;
    let t = this.free.pop(),
      a = e.p,
      n = t * 3;
    a.isVector3
      ? ((this.p[n] = a.x), (this.p[n + 1] = a.y), (this.p[n + 2] = a.z))
      : ((this.p[n] = a[0]), (this.p[n + 1] = a[1]), (this.p[n + 2] = a[2]));
    let s = e.v;
    (s
      ? s.isVector3
        ? ((this.v[n] = s.x), (this.v[n + 1] = s.y), (this.v[n + 2] = s.z))
        : ((this.v[n] = s[0]), (this.v[n + 1] = s[1]), (this.v[n + 2] = s[2]))
      : (this.v[n] = this.v[n + 1] = this.v[n + 2] = 0),
      (this.age[t] = 0),
      (this.life[t] = e.life ?? 1),
      (this.s0[t] = e.size ?? 0.2),
      (this.s1[t] = e.size1 ?? this.s0[t]));
    let i = e.glow ?? 1;
    return (
      Am(e.col ?? 16777215),
      (this.c0[n] = Wr.r * i),
      (this.c0[n + 1] = Wr.g * i),
      (this.c0[n + 2] = Wr.b * i),
      e.col1 !== void 0 && Am(e.col1),
      (this.c1[n] = Wr.r * i),
      (this.c1[n + 1] = Wr.g * i),
      (this.c1[n + 2] = Wr.b * i),
      (this.a0[t] = e.a ?? 1),
      (this.a1[t] = e.a1 ?? 0),
      (this.fin[t] = e.fadeIn ?? 0.08),
      (this.frame[t] = e.frame ?? 0),
      (this.rot[t] = e.rot ?? Math.random() * 6.283),
      (this.spin[t] = e.spin ?? 0),
      (this.grav[t] = e.grav ?? 0),
      (this.drag[t] = e.drag ?? 0),
      (this.str[t] = e.stretch ?? 0),
      (this.flick[t] = e.flicker ?? 0),
      (this.pinned[t] = e.pinned ? 1 : 0),
      t + 1 > this.hw && (this.hw = t + 1),
      this.alive++,
      t
    );
  }
  place(e, t, a, n, s = null, i = null) {
    if (e < 0 || this.life[e] < 0) return;
    let r = e * 3;
    ((this.p[r] = t),
      (this.p[r + 1] = a),
      (this.p[r + 2] = n),
      s !== null && (this.a0[e] = this.a1[e] = s),
      i !== null && (this.s0[e] = this.s1[e] = i));
  }
  kill(e) {
    e < 0 || this.life[e] < 0 || ((this.life[e] = -1), this.free.push(e), this.alive--);
  }
  clear(e = !1) {
    for (let t = 0; t < this.hw; t++) this.life[t] >= 0 && !(e && this.pinned[t]) && this.kill(t);
    e || ((this.hw = 0), (this.geo.instanceCount = 0));
  }
  update(e) {
    let t = this.p,
      a = this.v,
      n = this.aPos.array,
      s = this.aVel.array,
      i = this.aCol.array,
      r = this.aPar.array,
      l = 0;
    for (let c = 0; c < this.hw; c++) {
      let d = c * 3,
        u = c * 4;
      if (this.life[c] < 0) {
        r[u] = 0;
        continue;
      }
      let h;
      if (this.pinned[c]) ((this.age[c] += e), (h = 0));
      else {
        let _ = (this.age[c] += e),
          b = this.life[c];
        if (_ >= b) {
          (this.kill(c), (r[u] = 0));
          continue;
        }
        h = _ / b;
        let f = this.drag[c];
        if (f > 0) {
          let v = Math.max(0, 1 - f * e);
          ((a[d] *= v), (a[d + 1] *= v), (a[d + 2] *= v));
        }
        ((a[d + 1] += this.grav[c] * e),
          (t[d] += a[d] * e),
          (t[d + 1] += a[d + 1] * e),
          (t[d + 2] += a[d + 2] * e),
          (this.rot[c] += this.spin[c] * e));
      }
      ((l = c + 1),
        (n[d] = t[d]),
        (n[d + 1] = t[d + 1]),
        (n[d + 2] = t[d + 2]),
        (s[d] = a[d]),
        (s[d + 1] = a[d + 1]),
        (s[d + 2] = a[d + 2]));
      let p = this.fin[c],
        m = this.a0[c] + (this.a1[c] - this.a0[c]) * h;
      (this.pinned[c] ? (m *= Math.min(1, this.age[c] / 0.15)) : p > 0 && h < p && (m *= h / p),
        this.flick[c] > 0 && (m *= 1 - this.flick[c] * (0.5 + 0.5 * Math.sin(this.age[c] * 40 + c))),
        (i[u] = this.c0[d] + (this.c1[d] - this.c0[d]) * h),
        (i[u + 1] = this.c0[d + 1] + (this.c1[d + 1] - this.c0[d + 1]) * h),
        (i[u + 2] = this.c0[d + 2] + (this.c1[d + 2] - this.c0[d + 2]) * h),
        (i[u + 3] = m),
        (r[u] = this.s0[c] + (this.s1[c] - this.s0[c]) * h),
        (r[u + 1] = this.frame[c]),
        (r[u + 2] = this.rot[c]),
        (r[u + 3] = this.str[c]));
    }
    if (((this.hw = l), (this.geo.instanceCount = l), l))
      for (let c of [this.aPos, this.aVel, this.aCol, this.aPar])
        (c.clearUpdateRanges(), c.addUpdateRange(0, l * c.itemSize), (c.needsUpdate = !0));
  }
  dispose() {
    (this.geo.dispose(), this.material.dispose());
  }
};

export { Am, Su };
