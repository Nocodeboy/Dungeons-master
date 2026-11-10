// world/materials.js
// Reconstruido de publicado/juego.js (módulo __esm «wi»). Nombres locales aún minificados.

import { Color, MeshDepthMaterial, MeshStandardMaterial, RGBADepthPacking, Vector2 } from 'three';

function Zn(o, e = {}) {
  let t = {
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
      ...e,
    },
    a = `${o.uuid}|${t.wind}|${t.windRef}|${t.fade}|${t.contact}|${t.contactH}|${t.contactMin}|${t.squash}|${t.upNormal}|${t.tint}|${t.vcol}`;
  if (kc.has(a)) return kc.get(a);
  let n = o.clone();
  return (
    (n.name = o.name),
    (n.userData = { ...o.userData }),
    t.vcol && (n.vertexColors = !0),
    t.tint != null && (n.color = n.color.clone().multiply(new Color(t.tint))),
    y3(n, t),
    kc.set(a, n),
    n
  );
}
function v3(o, e) {
  let t = `depth|${o.uuid}|${e.wind}|${e.windRef}|${e.squash}`;
  if (kc.has(t)) return kc.get(t);
  let a = new MeshDepthMaterial({
    depthPacking: RGBADepthPacking,
    map: o.map || null,
    alphaTest: o.alphaTest || 0,
  });
  return (y3(a, { ...e, fade: null, contact: null, depthOnly: !0 }), kc.set(t, a), a);
}
function y3(o, e) {
  let t = `mdg|${e.wind > 0}|${e.fade}|${e.contact}|${e.squash}|${e.upNormal > 0}|${!!e.depthOnly}`,
    a = o.customProgramCacheKey?.bind(o);
  ((o.onBeforeCompile = (n) => {
    ((n.uniforms.uTime = No.uTime),
      (n.uniforms.uWind = No.uWind),
      (n.uniforms.uSquash = No.uSquash),
      (n.uniforms.uWindAmp = { value: e.wind }),
      (n.uniforms.uWindRef = { value: e.windRef }),
      (n.uniforms.uContact = { value: new Vector2(e.contactH, e.contactMin) }),
      (n.uniforms.uUpN = { value: e.upNormal }),
      e.fade === 'building' && (n.uniforms.uBld = No.uBld));
    let s = `uniform float uTime; uniform float uWind; uniform float uSquash; uniform float uWindAmp; uniform float uWindRef;
uniform vec2 uContact; uniform float uUpN;
varying float vMdgAO; varying float vMdgFade;
`;
    (e.fade === 'instance' &&
      (s += `attribute float aFade;
`),
      e.fade === 'building' &&
        (s += `attribute float aBld; uniform vec2 uBld[64];
`),
      e.contact === 'attr' &&
        (s += `attribute float aAO;
`));
    let i = '';
    (e.squash &&
      (i += `transformed.y *= uSquash;
`),
      e.wind > 0 &&
        (i += `{
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
      e.depthOnly ||
        (e.contact === 'local'
          ? (i += `vMdgAO = mix(uContact.y, 1.0, smoothstep(0.0, uContact.x, position.y));
`)
          : e.contact === 'attr'
            ? (i += `vMdgAO = aAO;
`)
            : (i += `vMdgAO = 1.0;
`),
        e.fade === 'instance'
          ? (i += `vMdgFade = aFade;
`)
          : e.fade === 'building'
            ? (i += `{ int bi = int(floor(aBld + 0.01)); vec2 bf = uBld[bi]; vMdgFade = fract(aBld) > 0.25 ? bf.y : bf.x; }
`)
            : (i += `vMdgFade = 1.0;
`)),
      (n.vertexShader = n.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
${s}`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
${i}`,
        )),
      e.upNormal > 0 &&
        !e.depthOnly &&
        (n.vertexShader = n.vertexShader.replace(
          '#include <beginnormal_vertex>',
          `#include <beginnormal_vertex>
objectNormal = normalize(mix(objectNormal, vec3(0.0, 1.0, 0.0), uUpN));`,
        )),
      e.depthOnly ||
        (n.fragmentShader = n.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
varying float vMdgAO; varying float vMdgFade;
${RH}`,
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
    (o.customProgramCacheKey = () => t + (a ? a() : '')),
    (o.needsUpdate = !0));
}
function Fo(o, e = {}) {
  return Zn(new MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...o }), e);
}
const No = {
  uTime: { value: 0 },
  uWind: { value: 1 },
  uSquash: { value: 1 },
  uBld: { value: Array.from({ length: 64 }, () => new Vector2(1, 1)) },
};
const RH = `
float mdgBayer(vec2 p){
  return fract(52.9829189 * fract(dot(floor(p), vec2(0.06711056, 0.00583715))));
}`;
const kc = new Map();

export { Fo, No, Zn, v3 };
