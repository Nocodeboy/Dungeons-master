// world/materials.js — materiales del mundo con el shader parcheado: balanceo por viento, oclusión
// de contacto con el suelo (AO por altura o por atributo), fundido por tramado Bayer (instancias y
// edificios que tapan la cámara) y normales hacia arriba para follaje. Los uniformes compartidos
// (`worldUniforms`: tiempo, viento, aplastado, fundido de edificios) los actualiza world/index.js.
// Reconstruido de publicado/juego.js (módulo __esm «wi»). Lo usan casi todos los módulos de world/.

import { Color, MeshDepthMaterial, MeshStandardMaterial, RGBADepthPacking, Vector2 } from 'three';

/**
 * Copia `base` y le aplica el parche de shader según `opts` (wind, windRef, fade: null|'instance'|
 * 'building', contact: 'local'|'attr'|null, contactH, contactMin, squash, upNormal, tint, vcol).
 * Cachea por material y opciones.
 */
function worldMaterial(base, opts = {}) {
  let cfg = {
      wind: 0,
      windRef: 3,
      fade: null,
      contact: 'local',
      contactH: 0.9,
      contactMin: 0.55,
      squash: !1,
      upNormal: 0,
      tint: null,
      vcol: !1,
      ...opts,
    },
    key = `${base.uuid}|${cfg.wind}|${cfg.windRef}|${cfg.fade}|${cfg.contact}|${cfg.contactH}|${cfg.contactMin}|${cfg.squash}|${cfg.upNormal}|${cfg.tint}|${cfg.vcol}`;
  if (materialCache.has(key)) return materialCache.get(key);
  let mat = base.clone();
  return (
    (mat.name = base.name),
    (mat.userData = { ...base.userData }),
    cfg.vcol && (mat.vertexColors = !0),
    cfg.tint != null && (mat.color = mat.color.clone().multiply(new Color(cfg.tint))),
    patchShader(mat, cfg),
    materialCache.set(key, mat),
    mat
  );
}
/** Material de profundidad para sombras que reproduce el balanceo por viento de `base`. */
function worldDepthMaterial(base, cfg) {
  let key = `depth|${base.uuid}|${cfg.wind}|${cfg.windRef}|${cfg.squash}`;
  if (materialCache.has(key)) return materialCache.get(key);
  let mat = new MeshDepthMaterial({
    depthPacking: RGBADepthPacking,
    map: base.map || null,
    alphaTest: base.alphaTest || 0,
  });
  return (
    patchShader(mat, { ...cfg, fade: null, contact: null, depthOnly: !0 }),
    materialCache.set(key, mat),
    mat
  );
}
/** Instala el `onBeforeCompile` del parche y su clave de caché de programa. */
function patchShader(mat, cfg) {
  let cacheKey = `mdg|${cfg.wind > 0}|${cfg.fade}|${cfg.contact}|${cfg.squash}|${cfg.upNormal > 0}|${!!cfg.depthOnly}`,
    baseCacheKey = mat.customProgramCacheKey?.bind(mat);
  ((mat.onBeforeCompile = (shader) => {
    ((shader.uniforms.uTime = worldUniforms.uTime),
      (shader.uniforms.uWind = worldUniforms.uWind),
      (shader.uniforms.uSquash = worldUniforms.uSquash),
      (shader.uniforms.uWindAmp = { value: cfg.wind }),
      (shader.uniforms.uWindRef = { value: cfg.windRef }),
      (shader.uniforms.uContact = { value: new Vector2(cfg.contactH, cfg.contactMin) }),
      (shader.uniforms.uUpN = { value: cfg.upNormal }),
      cfg.fade === 'building' && (shader.uniforms.uBld = worldUniforms.uBld));
    let decls = `uniform float uTime; uniform float uWind; uniform float uSquash; uniform float uWindAmp; uniform float uWindRef;
uniform vec2 uContact; uniform float uUpN;
varying float vMdgAO; varying float vMdgFade;
`;
    (cfg.fade === 'instance' &&
      (decls += `attribute float aFade;
`),
      cfg.fade === 'building' &&
        (decls += `attribute float aBld; uniform vec2 uBld[64];
`),
      cfg.contact === 'attr' &&
        (decls += `attribute float aAO;
`));
    let body = '';
    (cfg.squash &&
      (body += `transformed.y *= uSquash;
`),
      cfg.wind > 0 &&
        (body += `{
  #ifdef USE_INSTANCING
    vec3 org = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  #else
    vec3 org = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  #endif
  float hh = max(transformed.y, 0.0) / uWindRef;
  float k = hh * hh * uWindAmp * uWind;
  float t = uTime;
  float ph = org.x * 0.21 + org.z * 0.17;
  vec3 wv = transformed;
  float sw = sin(t * 1.3 + ph) * 0.7 + sin(t * 2.7 + ph * 1.7 + wv.x * 0.6) * 0.3;
  float sw2 = sin(t * 1.1 + ph * 1.3 + 1.7) * 0.6 + sin(t * 3.1 + wv.z * 0.8) * 0.25;
  transformed.x += sw * k;
  transformed.z += sw2 * k * 0.7;
}
`),
      cfg.depthOnly ||
        (cfg.contact === 'local'
          ? (body += `vMdgAO = mix(uContact.y, 1.0, smoothstep(0.0, uContact.x, position.y));
`)
          : cfg.contact === 'attr'
            ? (body += `vMdgAO = aAO;
`)
            : (body += `vMdgAO = 1.0;
`),
        cfg.fade === 'instance'
          ? (body += `vMdgFade = aFade;
`)
          : cfg.fade === 'building'
            ? (body += `{ int bi = int(floor(aBld + 0.01)); vec2 bf = uBld[bi]; vMdgFade = fract(aBld) > 0.25 ? bf.y : bf.x; }
`)
            : (body += `vMdgFade = 1.0;
`)),
      (shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
${decls}`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
${body}`,
        )),
      cfg.upNormal > 0 &&
        !cfg.depthOnly &&
        (shader.vertexShader = shader.vertexShader.replace(
          '#include <beginnormal_vertex>',
          `#include <beginnormal_vertex>
objectNormal = normalize(mix(objectNormal, vec3(0.0, 1.0, 0.0), uUpN));`,
        )),
      cfg.depthOnly ||
        (shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
varying float vMdgAO; varying float vMdgFade;
${BAYER_GLSL}`,
          )
          .replace(
            '#include <clipping_planes_fragment>',
            `#include <clipping_planes_fragment>
if (vMdgFade < 0.999 && mdgBayer(gl_FragCoord.xy) > vMdgFade) discard;`,
          )
          .replace(
            '#include <aomap_fragment>',
            `#include <aomap_fragment>
reflectedLight.indirectDiffuse *= vMdgAO; reflectedLight.directDiffuse *= mix(1.0, vMdgAO, 0.6);`,
          )));
  }),
    (mat.customProgramCacheKey = () => cacheKey + (baseCacheKey ? baseCacheKey() : '')),
    (mat.needsUpdate = !0));
}
/** `MeshStandardMaterial` mate (roughness 0,9) ya parcheado con `worldMaterial`. */
function standardMaterial(params, opts = {}) {
  return worldMaterial(new MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...params }), opts);
}
/** Uniformes compartidos por todos los materiales parcheados. `uBld`: fundido de 64 edificios. */
const worldUniforms = {
  uTime: { value: 0 },
  uWind: { value: 1 },
  uSquash: { value: 1 },
  uBld: { value: Array.from({ length: 64 }, () => new Vector2(1, 1)) },
};
/** Umbral de tramado (ruido de gradiente entrelazado) para el fundido por descarte. */
const BAYER_GLSL = `
float mdgBayer(vec2 p){
  return fract(52.9829189 * fract(dot(floor(p), vec2(0.06711056, 0.00583715))));
}`;
const materialCache = new Map();

export { standardMaterial, worldUniforms, worldMaterial, worldDepthMaterial };
