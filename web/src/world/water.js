// world/water.js — superficie de agua del nivel: busca las zonas del terreno bajo `WATER_LEVEL`,
// hornea una textura de profundidad, deduce la dirección de la corriente (eje principal de la zona:
// río si es alargada, estanque si no) y crea un plano con shader de oleaje, reflejo, brillo y espuma.
// Reconstruido de publicado/juego.js (módulo __esm «R1»). Lo usan index.js y vegetation.js.

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

/**
 * Crea el agua sobre el terreno `ground` (Ground de ground.js) y la añade a `scene`. Sigue los
 * cambios de luz de `sky` (Sky de times.js). Devuelve null si no hay agua, o
 * `{mesh, uniforms, flow, update(time)}`.
 */
function buildWater(scene, ground, sky, quality) {
  let step = ground.hr,
    minX = 1 / 0,
    maxX = -1 / 0,
    minZ = 1 / 0,
    maxZ = -1 / 0;
  for (let iz = 0; iz < ground.hh; iz++)
    for (let ix = 0; ix < ground.hw; ix++) {
      if (ground.H[iz * ground.hw + ix] > WATER_LEVEL + 0.02) continue;
      let wx = ground.x0 + ix * step,
        wz = ground.z0 + iz * step;
      ((minX = Math.min(minX, wx)),
        (maxX = Math.max(maxX, wx)),
        (minZ = Math.min(minZ, wz)),
        (maxZ = Math.max(maxZ, wz)));
    }
  if (!isFinite(minX)) return null;
  ((minX -= 1),
    (minZ -= 1),
    (maxX += 1),
    (maxZ += 1),
    (minX = Math.max(minX, ground.x0)),
    (minZ = Math.max(minZ, ground.z0)),
    (maxX = Math.min(maxX, ground.x1)),
    (maxZ = Math.min(maxZ, ground.z1)));
  let cols = Math.ceil((maxX - minX) / step) + 1,
    rows = Math.ceil((maxZ - minZ) / step) + 1,
    data = new Uint8Array(cols * rows * 4),
    sxx = 0,
    szz = 0,
    sxz = 0,
    cx = 0,
    cz = 0,
    count = 0;
  for (let iz = 0; iz < rows; iz++)
    for (let ix = 0; ix < cols; ix++) {
      let wx = minX + ix * step,
        wz = minZ + iz * step,
        depth = WATER_LEVEL - ground.heightAt(wx, wz),
        norm = Math.max(0, Math.min(1, (depth + 0.05) / 0.5));
      ((data[(iz * cols + ix) * 4] = norm * 255),
        (data[(iz * cols + ix) * 4 + 3] = 255),
        depth > 0.15 && ((cx += wx), (cz += wz), count++));
    }
  ((cx /= count || 1), (cz /= count || 1));
  for (let iz = 0; iz < rows; iz++)
    for (let ix = 0; ix < cols; ix++) {
      let wx = minX + ix * step,
        wz = minZ + iz * step;
      WATER_LEVEL - ground.heightAt(wx, wz) <= 0.15 ||
        ((sxx += (wx - cx) ** 2), (szz += (wz - cz) ** 2), (sxz += (wx - cx) * (wz - cz)));
    }
  let angle = 0.5 * Math.atan2(2 * sxz, sxx - szz),
    flow = new Vector2(Math.cos(angle), Math.sin(angle)),
    elong = Math.abs(sxx - szz) / Math.max(1, sxx + szz),
    depthTex = new DataTexture(data, cols, rows, RGBAFormat);
  ((depthTex.magFilter = LinearFilter), (depthTex.minFilter = LinearFilter), (depthTex.needsUpdate = !0));
  let uniforms = {
    tDepth: { value: depthTex },
    uRect: { value: new Vector4(minX, minZ, maxX - minX, maxZ - minZ) },
    uTime: { value: 0 },
    uFlow: { value: flow.multiplyScalar(elong > 0.3 ? 0.35 : 0.04) },
    uSun: { value: sky.cur.sunDir.clone() },
    uSunCol: { value: sky.cur.sun.clone() },
    uSky: { value: sky.cur.skyMid.clone() },
    uHor: { value: sky.cur.skyHor.clone() },
    uDeep: { value: new Color(596255) },
    uShallow: { value: new Color(2770495) },
    fogColor: { value: new Color() },
    fogNear: { value: 10 },
    fogFar: { value: 100 },
  };
  sky.onChange((state) => {
    (uniforms.uSun.value.copy(state.sunDir),
      uniforms.uSunCol.value.copy(state.sun).multiplyScalar(state.sunI / 3),
      uniforms.uSky.value.copy(state.skyMid),
      uniforms.uHor.value.copy(state.skyHor));
  });
  let material = new ShaderMaterial({
      uniforms,
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
    geometry = new PlaneGeometry(maxX - minX, maxZ - minZ, 1, 1).rotateX(-Math.PI / 2),
    mesh = new Mesh(geometry, material);
  return (
    mesh.position.set((minX + maxX) / 2, WATER_LEVEL, (minZ + maxZ) / 2),
    (mesh.renderOrder = 2),
    (mesh.name = 'agua'),
    scene.add(mesh),
    { mesh, uniforms, flow, update: (time) => (uniforms.uTime.value = time) }
  );
}
/** Altura de la lámina de agua (m). El terreno más bajo queda sumergido. */
const WATER_LEVEL = -0.2;

export { buildWater, WATER_LEVEL };
