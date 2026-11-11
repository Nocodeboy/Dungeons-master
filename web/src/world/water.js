// world/water.js
// Reconstruido de publicado/juego.js (módulo __esm «R1»). Nombres locales aún minificados.

import {
  Color,
  DataTexture,
  LinearFilter,
  Mesh,
  PlaneGeometry,
  RGBAFormat,
  ShaderMaterial,
  Vector2,
  Vector4,
} from 'three';

function L3(o, e, t, a) {
  let n = e.hr,
    s = 1 / 0,
    i = -1 / 0,
    r = 1 / 0,
    l = -1 / 0;
  for (let S = 0; S < e.hh; S++)
    for (let z = 0; z < e.hw; z++) {
      if (e.H[S * e.hw + z] > fs + 0.02) continue;
      let D = e.x0 + z * n,
        M = e.z0 + S * n;
      ((s = Math.min(s, D)), (i = Math.max(i, D)), (r = Math.min(r, M)), (l = Math.max(l, M)));
    }
  if (!isFinite(s)) return null;
  ((s -= 1),
    (r -= 1),
    (i += 1),
    (l += 1),
    (s = Math.max(s, e.x0)),
    (r = Math.max(r, e.z0)),
    (i = Math.min(i, e.x1)),
    (l = Math.min(l, e.z1)));
  let c = Math.ceil((i - s) / n) + 1,
    d = Math.ceil((l - r) / n) + 1,
    u = new Uint8Array(c * d * 4),
    h = 0,
    p = 0,
    m = 0,
    _ = 0,
    b = 0,
    f = 0;
  for (let S = 0; S < d; S++)
    for (let z = 0; z < c; z++) {
      let D = s + z * n,
        M = r + S * n,
        R = fs - e.heightAt(D, M),
        A = Math.max(0, Math.min(1, (R + 0.05) / 0.5));
      ((u[(S * c + z) * 4] = A * 255), (u[(S * c + z) * 4 + 3] = 255), R > 0.15 && ((_ += D), (b += M), f++));
    }
  ((_ /= f || 1), (b /= f || 1));
  for (let S = 0; S < d; S++)
    for (let z = 0; z < c; z++) {
      let D = s + z * n,
        M = r + S * n;
      fs - e.heightAt(D, M) <= 0.15 || ((h += (D - _) ** 2), (p += (M - b) ** 2), (m += (D - _) * (M - b)));
    }
  let v = 0.5 * Math.atan2(2 * m, h - p),
    x = new Vector2(Math.cos(v), Math.sin(v)),
    g = Math.abs(h - p) / Math.max(1, h + p),
    y = new DataTexture(u, c, d, RGBAFormat);
  ((y.magFilter = LinearFilter), (y.minFilter = LinearFilter), (y.needsUpdate = !0));
  let w = {
    tDepth: { value: y },
    uRect: { value: new Vector4(s, r, i - s, l - r) },
    uTime: { value: 0 },
    uFlow: { value: x.multiplyScalar(g > 0.3 ? 0.35 : 0.04) },
    uSun: { value: t.cur.sunDir.clone() },
    uSunCol: { value: t.cur.sun.clone() },
    uSky: { value: t.cur.skyMid.clone() },
    uHor: { value: t.cur.skyHor.clone() },
    uDeep: { value: new Color(596255) },
    uShallow: { value: new Color(2770495) },
    fogColor: { value: new Color() },
    fogNear: { value: 10 },
    fogFar: { value: 100 },
  };
  t.onChange((S) => {
    (w.uSun.value.copy(S.sunDir),
      w.uSunCol.value.copy(S.sun).multiplyScalar(S.sunI / 3),
      w.uSky.value.copy(S.skyMid),
      w.uHor.value.copy(S.skyHor));
  });
  let k = new ShaderMaterial({
      uniforms: w,
      transparent: !0,
      depthWrite: !1,
      fog: !0,
      vertexShader: `
      varying vec3 vWp; varying float vFogDepth;
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vWp = wp.xyz; vec4 mv = viewMatrix * wp; vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `
      uniform sampler2D tDepth; uniform vec4 uRect; uniform float uTime; uniform vec2 uFlow;
      uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uSky; uniform vec3 uHor; uniform vec3 uDeep; uniform vec3 uShallow;
      uniform vec3 fogColor; uniform float fogNear; uniform float fogFar;
      varying vec3 vWp; varying float vFogDepth;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
      float waves(vec2 p){
        vec2 fl = uFlow * uTime;
        return vn(p * 1.7 - fl * 2.2) * 0.5 + vn(p * 3.9 + vec2(uTime * 0.13, -uTime * 0.09) - fl * 3.0) * 0.3 + vn(p * 8.3 - fl * 4.0) * 0.2;
      }
      void main(){
        vec2 uv = (vWp.xz - uRect.xy) / uRect.zw;
        float depth = texture2D(tDepth, uv).r;
        if (depth < 0.02) discard;
        vec2 p = vWp.xz;
        float e = 0.08;
        float w0 = waves(p);
        vec3 n = normalize(vec3(-(waves(p + vec2(e, 0.0)) - w0) / e * 0.09, 1.0, -(waves(p + vec2(0.0, e)) - w0) / e * 0.09));
        vec3 V = normalize(cameraPosition - vWp);
        float fres = pow(1.0 - max(dot(n, V), 0.0), 4.0) * 0.6 + 0.05;
        vec3 base = mix(uShallow, uDeep, smoothstep(0.05, 0.75, depth));
        vec3 refl = mix(uHor, uSky, 0.6) * 0.62;
        vec3 col = mix(base, refl, fres);
        vec3 H = normalize(normalize(uSun) + V);
        float spec = pow(max(dot(n, H), 0.0), 420.0) * 1.4;
        col += uSunCol * spec;
        // espuma en la orilla y tras las piedras
        // (en agua quieta, casi nada: un estanque no hace espuma)
        float foam = smoothstep(0.1, 0.03, depth) * smoothstep(0.55, 0.85, vn(p * 5.0 - uFlow * uTime * 5.0) + w0 * 0.3) * clamp(length(uFlow) * 2.6, 0.12, 1.0);
        col = mix(col, vec3(0.74, 0.77, 0.74), foam * 0.42);
        float a = smoothstep(0.02, 0.14, depth) * mix(0.74, 0.94, smoothstep(0.1, 0.6, depth));
        a = max(a, foam * 0.8);
        float f = smoothstep(fogNear, fogFar, vFogDepth);
        col = mix(col, fogColor, f);
        gl_FragColor = vec4(col, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    }),
    T = new PlaneGeometry(i - s, l - r, 1, 1).rotateX(-Math.PI / 2),
    E = new Mesh(T, k);
  return (
    E.position.set((s + i) / 2, fs, (r + l) / 2),
    (E.renderOrder = 2),
    (E.name = 'agua'),
    o.add(E),
    { mesh: E, uniforms: w, flow: x, update: (S) => (w.uTime.value = S) }
  );
}
const fs = -0.2;

export { L3, fs };
