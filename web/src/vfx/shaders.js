// vfx/shaders.js
// Reconstruido de publicado/juego.js (módulo __esm «zm»). Nombres locales aún minificados.

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
import { Am } from './particles.js';

function or(o, e = 1) {
  let t = Am(o).clone();
  return new Vector3(t.r * e, t.g * e, t.b * e);
}
function sr(o, e, t, { blend: a = 'add', side: n = FrontSide, depthTest: s = !0 } = {}) {
  return new ShaderMaterial({
    uniforms: o,
    vertexShader: e,
    fragmentShader: t,
    transparent: !0,
    depthWrite: !1,
    depthTest: s,
    side: n,
    blending: a === 'add' ? AdditiveBlending : NormalBlending,
  });
}
function IS() {
  return (
    Rm || ((Rm = new ShapeGeometry(hexShape(HEX_RADIUS * HEX_SIZE * 0.95))), Rm.rotateX(-Math.PI / 2)),
    Rm
  );
}
const Ru = `
float vh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(vh(i), vh(i+vec2(1,0)), f.x), mix(vh(i+vec2(0,1)), vh(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ return 0.55*vn(p) + 0.3*vn(p*2.1+3.1) + 0.15*vn(p*4.3+7.7); }`;
const Cm = (o) => 1 - (1 - o) ** 3;
const LI = `
attribute float aW;
varying vec2 vUv; varying float vW;
void main(){ vUv = uv; vW = aW; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const DI = `
uniform vec3 uColor; uniform float uAlpha; uniform float uTime; uniform float uLen; uniform float uMode; uniform float uSpeed; uniform float uHot;
varying vec2 vUv; varying float vW;
${Ru}
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
const tr = class {
  constructor({
    max: e = 40,
    width: t = 0.18,
    color: a = 16777215,
    glow: n = 2,
    alpha: s = 1,
    mode: i = 'beam',
    speed: r = 6,
    life: l = 0.5,
    fadeIn: c = 0.06,
    jitter: d = 0.25,
    hot: u = null,
  } = {}) {
    ((this.max = e),
      (this.width = t),
      (this.mode = i),
      (this.life = l),
      (this.fadeIn = c),
      (this.alpha = s),
      (this.jitter = d),
      (this.t = 0),
      (this.pts = []),
      (this.base = []),
      (this.widths = null));
    let h = new BufferGeometry();
    (h.setAttribute('position', new BufferAttribute(new Float32Array(e * 6), 3).setUsage(DynamicDrawUsage)),
      h.setAttribute('uv', new BufferAttribute(new Float32Array(e * 4), 2).setUsage(DynamicDrawUsage)),
      h.setAttribute('aW', new BufferAttribute(new Float32Array(e * 2), 1).setUsage(DynamicDrawUsage)));
    let p = [];
    for (let m = 0; m < e - 1; m++) {
      let _ = m * 2;
      p.push(_, _ + 1, _ + 2, _ + 1, _ + 3, _ + 2);
    }
    (h.setIndex(p),
      (this.geo = h),
      (this.uniforms = {
        uColor: { value: or(a, n) },
        uAlpha: { value: 0 },
        uTime: { value: Math.random() * 10 },
        uLen: { value: 1 },
        uMode: { value: i === 'trail' ? 2 : i === 'bolt' ? 1 : 0 },
        uSpeed: { value: r },
        uHot: { value: u ?? (i === 'trail' ? 0.4 : 1.2) },
      }),
      (this.mesh = new Mesh(h, sr(this.uniforms, LI, DI, { side: DoubleSide }))),
      (this.mesh.frustumCulled = !1),
      (this.mesh.renderOrder = 13));
  }
  setPoints(e) {
    return (
      (this.base = e.map((t) => t.clone())),
      this.mode === 'bolt' ? this.rebolt() : (this.pts = this.base.map((t) => t.clone())),
      this
    );
  }
  setLine(e, t, a = 16) {
    let n = [];
    for (let s = 0; s <= a; s++) n.push(e.clone().lerp(t, s / a));
    return this.setPoints(n);
  }
  rebolt() {
    let e = this.base[0],
      t = this.base[this.base.length - 1],
      a = Math.min(this.max - 1, 18),
      n = e.distanceTo(t),
      s = t.clone().sub(e).normalize(),
      i = new Vector3(-s.z, 0, s.x),
      r = new Vector3().crossVectors(s, i).normalize();
    this.pts = [];
    for (let l = 0; l <= a; l++) {
      let c = l / a,
        d = e.clone().lerp(t, c);
      if (l > 0 && l < a) {
        let u = this.jitter * Math.min(1, n / 3) * Math.sin(c * Math.PI);
        d.addScaledVector(i, (Math.random() - 0.5) * 2 * u).addScaledVector(r, (Math.random() - 0.5) * 2 * u);
      }
      this.pts.push(d);
    }
  }
  build(e) {
    let t = this.pts,
      a = Math.min(t.length, this.max);
    if (a < 2) {
      this.geo.setDrawRange(0, 0);
      return;
    }
    let n = this.geo.attributes.position.array,
      s = this.geo.attributes.uv.array,
      i = this.geo.attributes.aW.array,
      r = new Vector3(),
      l = new Vector3(),
      c = new Vector3(),
      d = 0;
    for (let h = 1; h < a; h++) d += t[h].distanceTo(t[h - 1]);
    let u = 0;
    for (let h = 0; h < a; h++) {
      h > 0 && (u += t[h].distanceTo(t[h - 1]));
      let p = t[Math.max(0, h - 1)],
        m = t[Math.min(a - 1, h + 1)];
      (r.subVectors(m, p).normalize(),
        l.subVectors(e.position, t[h]).normalize(),
        c.crossVectors(r, l).normalize());
      let _ = this.width * (this.widths ? (this.widths[h] ?? 1) : 1);
      (this.mode === 'trail' && (_ *= 0.25 + 0.75 * (h / (a - 1))), c.multiplyScalar(_ / 2));
      let b = h * 6;
      ((n[b] = t[h].x + c.x),
        (n[b + 1] = t[h].y + c.y),
        (n[b + 2] = t[h].z + c.z),
        (n[b + 3] = t[h].x - c.x),
        (n[b + 4] = t[h].y - c.y),
        (n[b + 5] = t[h].z - c.z));
      let f = d > 0 ? u / d : 0;
      ((s[h * 4] = f),
        (s[h * 4 + 1] = 0),
        (s[h * 4 + 2] = f),
        (s[h * 4 + 3] = 1),
        (i[h * 2] = i[h * 2 + 1] = 1));
    }
    ((this.uniforms.uLen.value = d),
      (this.geo.attributes.position.needsUpdate = !0),
      (this.geo.attributes.uv.needsUpdate = !0),
      (this.geo.attributes.aW.needsUpdate = !0),
      this.geo.setDrawRange(0, (a - 1) * 6));
  }
  update(e, t) {
    ((this.t += e),
      (this.uniforms.uTime.value += e),
      this.mode === 'bolt' && Math.random() < e * 22 && this.rebolt());
    let a = this.life > 0 ? this.t / this.life : 0,
      n = this.fadeIn > 0 ? Math.min(1, this.t / this.fadeIn) : 1,
      s = this.life > 0 ? 1 - Math.max(0, (a - 0.55) / 0.45) : 1;
    return (
      (this.uniforms.uAlpha.value = this.alpha * n * Math.max(0, s)),
      this.build(t),
      this.life <= 0 || this.t < this.life
    );
  }
  dispose() {
    (this.geo.dispose(), this.mesh.material.dispose());
  }
};
const Pm =
  'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const II = `
uniform vec3 uColor; uniform float uProg; uniform float uThick; uniform float uAlpha; uniform float uFill;
varying vec2 vUv;
${Ru}
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
const ku = class {
  constructor(
    e,
    {
      color: t = 16777215,
      glow: a = 2,
      radius: n = 2,
      life: s = 0.5,
      thick: i = 0.18,
      alpha: r = 1,
      fill: l = 0,
      y: c = 0.05,
      vertical: d = null,
    } = {},
  ) {
    ((this.life = s),
      (this.t = 0),
      (this.uniforms = {
        uColor: { value: or(t, a) },
        uProg: { value: 0 },
        uThick: { value: i },
        uAlpha: { value: r },
        uFill: { value: l },
      }));
    let u = new PlaneGeometry(2, 2);
    ((this.mesh = new Mesh(u, sr(this.uniforms, Pm, II, { side: DoubleSide }))),
      this.mesh.position.copy(e),
      (this.mesh.position.y += c),
      d ? this.mesh.lookAt(e.clone().add(d)) : (this.mesh.rotation.x = -Math.PI / 2),
      this.mesh.scale.setScalar(n),
      (this.mesh.renderOrder = 10));
  }
  update(e) {
    return ((this.t += e), (this.uniforms.uProg.value = Math.min(1, this.t / this.life)), this.t < this.life);
  }
  dispose() {
    (this.mesh.geometry.dispose(), this.mesh.material.dispose());
  }
};
const HI = `
varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vP = position;
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const NI = `
uniform vec3 uColor; uniform float uAlpha; uniform float uTime; uniform float uHex;
varying vec3 vN; varying vec3 vV; varying vec3 vP;
${Ru}
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
const Xr = class {
  constructor(
    e,
    {
      color: t = 16777215,
      glow: a = 1.6,
      radius: n = 1,
      life: s = 0.6,
      alpha: i = 0.8,
      grow: r = !0,
      hex: l = 0,
      half: c = !0,
    } = {},
  ) {
    ((this.life = s),
      (this.t = 0),
      (this.radius = n),
      (this.grow = r),
      (this.alpha = i),
      (this.uniforms = {
        uColor: { value: or(t, a) },
        uAlpha: { value: i },
        uTime: { value: 0 },
        uHex: { value: l },
      }));
    let d = new SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, c ? Math.PI / 2 : Math.PI);
    ((this.mesh = new Mesh(d, sr(this.uniforms, HI, NI, { side: DoubleSide }))),
      this.mesh.position.copy(e),
      this.mesh.scale.setScalar(r ? n * 0.2 : n),
      (this.mesh.renderOrder = 9));
  }
  update(e) {
    if (((this.t += e), (this.uniforms.uTime.value += e), this.life <= 0)) return !0;
    let t = Math.min(1, this.t / this.life);
    return (
      this.grow && this.mesh.scale.setScalar(this.radius * (0.2 + 0.8 * Cm(Math.min(1, t * 1.6)))),
      (this.uniforms.uAlpha.value = this.alpha * (1 - t) ** 1.5),
      t < 1
    );
  }
  dispose() {
    (this.mesh.geometry.dispose(), this.mesh.material.dispose());
  }
};
const FI = `
varying vec2 vUv; varying float vF;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec3 n = normalize(mat3(modelMatrix) * normal);
  vF = abs(dot(n, normalize(cameraPosition - wp.xyz)));
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const OI = `
uniform vec3 uColor; uniform float uAlpha; uniform float uTime;
varying vec2 vUv; varying float vF;
${Ru}
void main(){
  float n = fbm(vec2(vUv.x * 10.0, vUv.y * 3.0 + uTime * 2.5));
  float streak = smoothstep(0.45, 1.0, fbm(vec2(vUv.x * 22.0, vUv.y * 0.8 + uTime * 1.2)));
  float edge = pow(vF, 0.8);
  float a = (0.18 + 0.4 * n + streak * 0.8) * pow(1.0 - vUv.y, 1.2) * smoothstep(0.0, 0.05, vUv.y) * edge * uAlpha;
  gl_FragColor = vec4(uColor * (0.7 + 0.5 * n + streak), a);
}`;
const Yr = class {
  constructor(
    e,
    {
      color: t = 16773312,
      glow: a = 1.4,
      radius: n = 0.6,
      height: s = 6,
      life: i = 0.8,
      alpha: r = 0.8,
      drop: l = 0.18,
    } = {},
  ) {
    ((this.life = i),
      (this.t = 0),
      (this.radius = n),
      (this.height = s),
      (this.alpha = r),
      (this.drop = l),
      (this.uniforms = {
        uColor: { value: or(t, a) },
        uAlpha: { value: 0 },
        uTime: { value: Math.random() * 5 },
      }));
    let c = new CylinderGeometry(1, 1, 1, 24, 1, !0);
    (c.translate(0, 0.5, 0),
      (this.mesh = new Mesh(c, sr(this.uniforms, FI, OI, { side: DoubleSide }))),
      this.mesh.position.copy(e),
      this.mesh.scale.set(n * 0.3, s, n * 0.3),
      (this.mesh.renderOrder = 10));
  }
  update(e) {
    if (((this.t += e), (this.uniforms.uTime.value += e), this.life <= 0)) {
      this.uniforms.uAlpha.value = this.alpha * Math.min(1, this.t / 0.3);
      let s = this.radius * Math.min(1, 0.3 + this.t * 3);
      return (this.mesh.scale.set(s, this.height, s), !0);
    }
    let t = Math.min(1, this.t / this.life),
      a = Math.min(1, this.t / this.drop),
      n = this.radius * (0.3 + 0.7 * Cm(a)) * (1 - (0.5 * Math.max(0, t - 0.6)) / 0.4);
    return (
      this.mesh.scale.set(n, this.height, n),
      (this.uniforms.uAlpha.value = this.alpha * a * (1 - Math.max(0, (t - 0.5) / 0.5))),
      t < 1
    );
  }
  dispose() {
    (this.mesh.geometry.dispose(), this.mesh.material.dispose());
  }
};
const BI = `
attribute float iDelay;
varying vec2 vL; varying float vD; varying vec2 vW;
void main(){
  vL = position.xz / ${(HEX_RADIUS * HEX_SIZE * 0.95).toFixed(4)};
  vD = iDelay;
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vW = wp.xz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const qI = `
uniform vec3 uColor; uniform float uTime; uniform float uSpread; uniform float uLife; uniform float uHold; uniform float uAlpha; uniform float uPulse;
varying vec2 vL; varying float vD; varying vec2 vW;
${Ru}
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
let Rm = null;
const ar = class {
  constructor(
    e,
    t,
    {
      origin: a = null,
      color: n = 16777215,
      glow: s = 1,
      life: i = 0.9,
      spread: r = 0.35,
      alpha: l = 1,
      hold: c = !1,
      pulse: d = 0,
      blend: u = 'add',
      y: h = 0.05,
    } = {},
  ) {
    ((this.life = i), (this.hold = c), (this.t = 0));
    let p = e.length,
      m = new InstancedMesh(IS(), null, Math.max(1, p)),
      _ = new Float32Array(Math.max(1, p)),
      b = e.map((g) => t(g)),
      f = a || b.reduce((g, y) => g.add(y), new Vector3()).divideScalar(Math.max(1, p)),
      v = 0.001;
    for (let g of b) v = Math.max(v, Math.hypot(g.x - f.x, g.z - f.z));
    let x = new Matrix4();
    (b.forEach((g, y) => {
      (x.makeTranslation(g.x, g.y + h, g.z),
        m.setMatrixAt(y, x),
        (_[y] = Math.hypot(g.x - f.x, g.z - f.z) / v));
    }),
      (m.count = p),
      (m.geometry = IS().clone()),
      m.geometry.setAttribute('iDelay', new InstancedBufferAttribute(_, 1)),
      (this.uniforms = {
        uColor: { value: or(n, s) },
        uTime: { value: 0 },
        uSpread: { value: r },
        uLife: { value: i },
        uHold: { value: c ? 1 : 0 },
        uAlpha: { value: l },
        uPulse: { value: d },
      }),
      (m.material = sr(this.uniforms, BI, qI, { blend: u })),
      (m.frustumCulled = !1),
      (m.renderOrder = 8),
      (this.mesh = m),
      (this.fadeOut = 0));
  }
  release(e = 0.6) {
    ((this.fadeOut = e), (this.fadeT = 0));
  }
  update(e) {
    return (
      (this.t += e),
      (this.uniforms.uTime.value = this.t),
      this.fadeOut > 0
        ? ((this.fadeT += e),
          (this.uniforms.uAlpha.value *= Math.max(0, 1 - e / Math.max(0.05, this.fadeOut - this.fadeT + e))),
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
const UI = `
uniform sampler2D uTex; uniform vec3 uColor; uniform float uAlpha; uniform float uTime;
varying vec2 vUv;
void main(){
  vec4 t = texture2D(uTex, vUv);
  float pulse = 0.8 + 0.2 * sin(uTime * 5.0);
  gl_FragColor = vec4(uColor * pulse, t.a * uAlpha);
}`;
const nr = class {
  constructor(
    e,
    {
      color: t = 11832575,
      glow: a = 2.2,
      radius: n = 1,
      life: s = 1,
      alpha: i = 0.9,
      spin: r = 0.8,
      y: l = 0.06,
      grow: c = 0.25,
    } = {},
  ) {
    ((this.life = s),
      (this.t = 0),
      (this.spin = r),
      (this.radius = n),
      (this.alpha = i),
      (this.growT = c),
      (this.uniforms = {
        uTex: { value: getMagicCircleTexture() },
        uColor: { value: or(t, a) },
        uAlpha: { value: 0 },
        uTime: { value: 0 },
      }),
      (this.mesh = new Mesh(new PlaneGeometry(2, 2), sr(this.uniforms, Pm, UI, { side: DoubleSide }))),
      (this.mesh.rotation.x = -Math.PI / 2),
      this.mesh.position.copy(e),
      (this.mesh.position.y += l),
      this.mesh.scale.setScalar(n * 0.4),
      (this.mesh.renderOrder = 9),
      (this.closing = -1));
  }
  close(e = 0.35) {
    ((this.closing = e), (this.closeT = 0));
  }
  update(e) {
    ((this.t += e), (this.uniforms.uTime.value = this.t), (this.mesh.rotation.z += this.spin * e));
    let t = Math.min(1, this.t / Math.max(0.01, this.growT)),
      a = this.alpha * t,
      n = this.radius * (0.4 + 0.6 * Cm(t));
    if (this.closing > 0) {
      this.closeT += e;
      let s = Math.min(1, this.closeT / this.closing);
      if (((a *= 1 - s), (n *= 1 + 0.25 * s), s >= 1)) return !1;
    } else if (this.life > 0) {
      let s = this.t / this.life;
      if (s >= 1) return !1;
      a *= 1 - Math.max(0, (s - 0.7) / 0.3);
    }
    return ((this.uniforms.uAlpha.value = a), this.mesh.scale.setScalar(n), !0);
  }
  dispose() {
    (this.mesh.geometry.dispose(), this.mesh.material.dispose());
  }
};
const jI = `
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
const Au = class {
  constructor(
    e,
    t,
    { color: a = 16777215, glow: n = 2.2, size: s = 1.1, life: i = 0.28, roll: r = null, alpha: l = 1 } = {},
  ) {
    ((this.life = i),
      (this.t = 0),
      (this.uniforms = { uColor: { value: or(a, n) }, uProg: { value: 0 }, uAlpha: { value: l } }),
      (this.mesh = new Mesh(
        new PlaneGeometry(2, 2),
        sr(this.uniforms, Pm, jI, { side: DoubleSide, depthTest: !1 }),
      )),
      this.mesh.position.copy(e),
      this.mesh.quaternion.copy(t.quaternion),
      this.mesh.rotateZ(r ?? (Math.random() - 0.5) * 2.2 + (Math.random() < 0.5 ? 0 : Math.PI)),
      this.mesh.scale.setScalar(s * 0.5),
      (this.size = s),
      (this.mesh.renderOrder = 14));
  }
  update(e) {
    this.t += e;
    let t = Math.min(1, this.t / this.life);
    return (
      (this.uniforms.uProg.value = t),
      this.mesh.scale.setScalar(this.size * (0.5 + 0.5 * Cm(t))),
      t < 1
    );
  }
  dispose() {
    (this.mesh.geometry.dispose(), this.mesh.material.dispose());
  }
};
const GI = `
uniform sampler2D uAtlas; uniform vec3 uColor; uniform float uAlpha; uniform vec2 uCell;
varying vec2 vUv;
void main(){
  vec2 uv = vec2((uCell.x + vUv.x) / ${ATLAS_COLS.toFixed(1)}, (${ATLAS_ROWS.toFixed(1)} - uCell.y - 1.0 + vUv.y) / ${ATLAS_ROWS.toFixed(1)});
  vec4 t = texture2D(uAtlas, uv);
  gl_FragColor = vec4(uColor * t.rgb, t.a * uAlpha);
}`;
const xi = class {
  constructor(
    e,
    {
      frame: t = 0,
      color: a = 16777215,
      glow: n = 1,
      size: s = 1,
      life: i = 1.5,
      alpha: r = 0.8,
      blend: l = 'add',
      spin: c = 0,
      y: d = 0.04,
      rot: u = Math.random() * 6.28,
    } = {},
  ) {
    ((this.life = i),
      (this.t = 0),
      (this.alpha = r),
      (this.spin = c),
      (this.uniforms = {
        uAtlas: { value: getParticleAtlas() },
        uColor: { value: or(a, n) },
        uAlpha: { value: r },
        uCell: { value: new Vector2(t % ATLAS_COLS, Math.floor(t / ATLAS_COLS)) },
      }),
      (this.mesh = new Mesh(
        new PlaneGeometry(1, 1),
        sr(this.uniforms, Pm, GI, { blend: l, side: DoubleSide }),
      )),
      this.mesh.rotation.set(-Math.PI / 2, 0, u),
      this.mesh.position.copy(e),
      (this.mesh.position.y += d),
      this.mesh.scale.setScalar(s),
      (this.mesh.renderOrder = 7));
  }
  update(e) {
    if (((this.t += e), (this.mesh.rotation.z += this.spin * e), this.life <= 0)) return !0;
    let t = this.t / this.life;
    return (
      (this.uniforms.uAlpha.value =
        this.alpha * Math.min(1, this.t / 0.1) * (1 - Math.max(0, (t - 0.5) / 0.5))),
      t < 1
    );
  }
  dispose() {
    (this.mesh.geometry.dispose(), this.mesh.material.dispose());
  }
};

export { Au, Xr, Yr, ar, ku, nr, tr, xi };
