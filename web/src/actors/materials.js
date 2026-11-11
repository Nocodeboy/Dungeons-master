// actors/materials.js
// Reconstruido de publicado/juego.js (módulo __esm «Br»).
//
// Materiales de los personajes. makeCharacterMaterial: MeshStandardMaterial con el atlas de
// texturas de los humanoides (assets/chars/tex/atlas_*.webp) teñido por una máscara RGBA (dos
// telas, metal y piel), pelo y ojos, cota de malla y patrones de piel en el shader, más el equipo
// hecho por código (color y metal por vértice). makeGearMaterial: material de vértices para bestias.
// addRimLight añade la luz de borde común (rimUniforms) a cualquier material. Las texturas se
// cachean y, con detalle bajo, se reducen a la mitad. Lo usan humanoid.js, beasts.js, animals.js,
// portraits.js, preview.js e index.js (setCharacterRim, setTextureDetail, texturesReady).

import {
  Color,
  CubeTexture,
  DoubleSide,
  MeshStandardMaterial,
  NoColorSpace,
  SRGBColorSpace,
  TextureLoader,
} from 'three';

/** Ajusta la luz de borde de todos los personajes (intensidad y, opcionalmente, color). */
function setCharacterRim(strength = 0.22, color = null) {
  ((rimUniforms.uRim.value = strength), color && rimUniforms.uRimColor.value.set(color));
}
/** Encadena al onBeforeCompile del material la luz de borde compartida; devuelve el material. */
function addRimLight(material) {
  let prevHook = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    (prevHook?.call(material, shader, renderer),
      Object.assign(shader.uniforms, rimUniforms),
      (shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
${RIM_UNIFORMS_GLSL}`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
${RIM_EMISSIVE_GLSL}`,
        )));
  };
  let prevKey = material.customProgramCacheKey?.call(material) || '';
  return ((material.customProgramCacheKey = () => `${prevKey}|rim`), material);
}
/** Detalle de texturas inicial: ?calidad=baja|media|alta o 0 en pantallas pequeñas y móviles. */
function detectTextureDetail() {
  try {
    let quality = new URLSearchParams(location.search).get('calidad');
    return quality
      ? ({ baja: 0, media: 1, alta: 2 }[quality] ?? 1)
      : Math.min(innerWidth, innerHeight) < 700 || /Android|iPhone|iPad/i.test(navigator.userAgent)
        ? 0
        : 1;
  } catch {
    return 1;
  }
}
/** Cambia el detalle de texturas (0 = reducirlas a la mitad al cargarlas). Solo afecta a las nuevas. */
function setTextureDetail(level) {
  textureDetail = level;
}
/** Textura de assets/chars/tex/<name>.webp (cacheada); `userData.ready` se cumple al cargarla. */
function loadCharTexture(name, srgb = !0) {
  let key = `${name}|${srgb}`;
  if (!textureCache.has(key)) {
    let markReady,
      ready = new Promise((resolve) => (markReady = resolve)),
      onLoad = () => {
        let img = tex.image;
        if (textureDetail > 0 || typeof createImageBitmap != 'function' || !img?.width) return markReady();
        createImageBitmap(img, {
          resizeWidth: img.width >> 1,
          resizeHeight: img.height >> 1,
          resizeQuality: 'high',
          premultiplyAlpha: 'none',
          colorSpaceConversion: 'none',
        })
          .then((bitmap) => {
            ((tex.image = bitmap), (tex.needsUpdate = !0));
          })
          .catch(() => {})
          .finally(markReady);
      },
      tex = textureLoader.load(`assets/chars/tex/${name}.webp`, onLoad, void 0, () => markReady());
    ((tex.flipY = !1),
      (tex.colorSpace = srgb ? SRGBColorSpace : NoColorSpace),
      (tex.anisotropy = 4),
      (tex.userData.ready = ready),
      textureCache.set(key, tex));
  }
  return textureCache.get(key);
}
/** Promesa que se cumple cuando todas las texturas pedidas hasta ahora están listas. */
function allTexturesReady() {
  return Promise.all([...textureCache.values()].map((tex) => tex.userData.ready));
}
/** Mapa de entorno de cubo hecho con degradados (cielo claro, suelo oscuro), compartido. */
function getEnvMap() {
  if (envMap) return envMap;
  let gradient = (top, bottom, middle = null) => {
      let canvas = document.createElement('canvas');
      canvas.width = canvas.height = 32;
      let ctx = canvas.getContext('2d'),
        grad = ctx.createLinearGradient(0, 0, 0, 32);
      return (
        grad.addColorStop(0, top),
        middle && grad.addColorStop(0.5, middle),
        grad.addColorStop(1, bottom),
        (ctx.fillStyle = grad),
        ctx.fillRect(0, 0, 32, 32),
        canvas
      );
    },
    side = gradient('#c9c4bc', '#2a2420', '#8a8078');
  return (
    (envMap = new CubeTexture([
      side,
      side,
      gradient('#e8e2d6', '#e8e2d6'),
      gradient('#1e1a16', '#1e1a16'),
      side,
      side,
    ])),
    (envMap.colorSpace = SRGBColorSpace),
    (envMap.needsUpdate = !0),
    envMap
  );
}
/**
 * Material de humanoide para el atlas `atlas` con los colores de `colors` (cloth1, cloth2, metal,
 * skin, leather, hair, eyes) y opciones `opts` (glowEyes, pattern, patternColor, mail). Expone sus
 * uniformes en `userData.u` (uFlash lo usa Character.flash).
 */
function makeCharacterMaterial(atlas, colors, opts = {}) {
  let material = new MeshStandardMaterial({
    map: loadCharTexture(`atlas_${atlas}`),
    normalMap: loadCharTexture(`atlas_${atlas}_n`, !1),
    roughness: 0.82,
    metalness: 0,
    envMap: getEnvMap(),
    envMapIntensity: 0.6,
    side: DoubleSide,
  });
  material.normalScale.set(0.8, 0.8);
  let uniforms = {
    uMask: { value: loadCharTexture(`mascara_${atlas}`, !1) },
    uC1: { value: toColor(colors.cloth1 || '#3f5f9a') },
    uC2: { value: toColor(colors.cloth2 || '#c9b48a') },
    uMetal: { value: toColor(colors.metal || '#b8bec6') },
    uSkin: { value: toColor(colors.skin || '#e0ac83') },
    uLeather: { value: toColor(colors.leather || '#ffffff') },
    uHair: { value: toColor(colors.hair || '#3b2a1e') },
    uEyes: { value: toColor(colors.eyes || '#5a3a1e') },
    uGlow: { value: opts.glowEyes || 0 },
    uPattern: { value: opts.pattern || 0 },
    uPatternColor: { value: toColor(opts.patternColor || '#303030') },
    uMail: { value: opts.mail || 0 },
    uFlash: { value: new Color(0, 0, 0) },
  };
  return (
    (material.userData.u = uniforms),
    (material.onBeforeCompile = (shader) => {
      (Object.assign(shader.uniforms, uniforms, rimUniforms),
        (shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            `#include <common>
attribute vec3 gcol; attribute vec3 gpar; varying vec3 vObj; varying vec3 vGcol; varying vec3 vGpar;`,
          )
          .replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
vObj = position; vGcol = gcol; vGpar = gpar;`,
          )),
        (shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
uniform sampler2D uMask; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uMetal; uniform vec3 uSkin; uniform vec3 uLeather;
uniform vec3 uHair; uniform vec3 uEyes; uniform float uGlow;
uniform float uPattern; uniform vec3 uPatternColor; uniform float uMail; uniform vec3 uFlash;
${RIM_UNIFORMS_GLSL}
varying vec3 vObj; varying vec3 vGcol; varying vec3 vGpar;
float mdgMetal = 0.0; float mdgSkin = 0.0; float mdgRough = -1.0; vec3 mdgEmit = vec3(0.0);
${NOISE_GLSL}`,
          )
          .replace(
            '#include <map_fragment>',
            `
  vec4 texel = texture2D( map, vMapUv );
  vec3 col;
  if ( vGpar.z > 0.5 ) {
    // equipo hecho por c\xF3digo: color y metal por v\xE9rtice
    col = vGcol;
    mdgMetal = vGpar.x;
    mdgRough = mix( 0.78, 0.3, vGpar.x );
    mdgEmit = vGcol * vGpar.y * 2.5;
  } else if ( vMapUv.y > 0.8 ) {
    if ( vMapUv.x < 0.5 ) {
      col = texel.rgb * uHair / 0.214;
      mdgRough = 0.62;
    } else {
      float iris = texture2D( map, vMapUv + vec2( 0.25, 0.0 ) ).r;
      col = mix( texel.rgb, texel.rgb * uEyes / 0.214, iris );
      mdgRough = 0.22;
      mdgEmit = uEyes * iris * uGlow * 3.0;
    }
  } else {
    vec4 mk = texture2D( uMask, vMapUv );
    mk.a = clamp( ( mk.a - 0.5 ) * 2.0, 0.0, 1.0 );
    float tsum = min( 1.0, mk.r + mk.g + mk.b + mk.a );
    vec3 tint = ( uC1 * mk.r + uC2 * mk.g + uMetal * mk.b + uSkin * mk.a ) / max( tsum, 1e-3 );
    // los texels te\xF1ibles est\xE1n en gris con media 0,5 (sRGB) = 0,214 lineal
    col = texel.rgb * mix( uLeather, tint / 0.214, tsum );
    mdgMetal = mk.b;
    mdgSkin = mk.a;
    // cota de malla o de escamas sobre la ropa principal
    if ( uMail > 0.5 && mk.r > 0.01 ) {
      vec3 p = vObj * 70.0;
      float fw = clamp( length( fwidth( p ) ) * 0.6, 0.0, 1.0 );
      float ring;
      if ( uMail < 1.5 ) {
        vec2 q = vec2( p.x + p.z, p.y );
        q.x += step( 1.0, mod( q.y, 2.0 ) ) * 0.5;
        vec2 c = fract( q ) - 0.5;
        float d = length( c * vec2( 1.0, 1.3 ) );
        ring = smoothstep( 0.18, 0.28, d ) * ( 1.0 - smoothstep( 0.38, 0.5, d ) );
      } else {
        vec2 q = vec2( p.x + p.z, p.y * 1.3 ) * 0.7;
        q.x += step( 1.0, mod( q.y, 2.0 ) ) * 0.5;
        vec2 c = fract( q ) - vec2( 0.5, 0.0 );
        ring = 1.0 - smoothstep( 0.35, 0.5, length( c * vec2( 1.0, 0.9 ) ) );
        ring = 0.45 + ring * 0.75;
      }
      ring = mix( ring, 0.62, fw );
      float k = mk.r;
      col = mix( col, uMetal * ( 0.25 + ring * 0.95 ) * ( 0.75 + texel.r * 0.6 ), k );
      mdgMetal = max( mdgMetal, k * ( 0.35 + ring * 0.55 ) );
    }
    // patrones de piel (escamas, marcas de goliat, podredumbre)
    if ( uPattern > 0.5 && mk.a > 0.01 ) {
      vec3 p = vObj;
      float pat = 0.0;
      if ( uPattern < 1.5 ) {
        vec3 q = p * 95.0;
        vec2 sc = vec2( q.x + q.z * 0.7, q.y );
        sc.x += step( 1.0, mod( sc.y, 2.0 ) ) * 0.5;
        vec2 c = fract( sc ) - 0.5;
        float d = length( c * vec2( 1.0, 1.4 ) );
        pat = smoothstep( 0.3, 0.5, d ) * 0.55;
        pat = mix( pat, 0.2, clamp( length( fwidth( q ) ) * 0.5, 0.0, 1.0 ) );
        col *= 1.0 - pat * mk.a;
      } else if ( uPattern < 2.5 ) {
        // l\xEDneas de goliat: vetas finas y a trozos, como grietas de piedra (antes, manchas de vaca)
        float n = mdgNoise( p * vec3( 9.0, 3.0, 9.0 ) ) + 0.5 * mdgNoise( p * 27.0 );
        float band = abs( sin( p.y * 26.0 + n * 4.0 ) );
        pat = smoothstep( 0.9, 0.97, band ) * smoothstep( 0.35, 0.6, n );
        col = mix( col, uPatternColor * texel.rgb / 0.214, pat * 0.7 * mk.a );
      } else if ( uPattern < 3.5 ) {
        // manchas de goliat: sueltas y no muy contrastadas (antes parec\xEDa una vaca)
        float n = mdgNoise( p * 22.0 ) * 0.7 + mdgNoise( p * 55.0 ) * 0.3;
        pat = smoothstep( 0.63, 0.72, n );
        col = mix( col, uPatternColor * texel.rgb / 0.214, pat * 0.55 * mk.a );
      } else if ( uPattern < 4.5 ) {
        float n = mdgNoise( p * 9.0 );
        vec2 gg = fract( vec2( p.x + p.z, p.y ) * 26.0 );
        float lines = step( 0.86, max( gg.x, gg.y ) ) * step( 0.55, n );
        col = mix( col, uPatternColor * 1.6, lines * mk.a );
      } else {
        // podredumbre: manchas m\xE1s peque\xF1as y sueltas (antes parec\xEDa camuflaje)
        float n = mdgNoise( p * 17.0 ) * 0.6 + mdgNoise( p * 52.0 ) * 0.4;
        pat = smoothstep( 0.55, 0.78, n ) * 0.8;
        col = mix( col, uPatternColor * texel.rgb / 0.214 * 0.8, pat * mk.a );
      }
    }
  }
  diffuseColor.rgb *= col;
`,
          )
          .replace(
            '#include <normal_fragment_maps>',
            `#include <normal_fragment_maps>
if ( vGpar.z > 0.5 ) normal = nonPerturbedNormal;`,
          )
          .replace(
            '#include <roughnessmap_fragment>',
            `#include <roughnessmap_fragment>
roughnessFactor = mix( roughnessFactor, 0.36, mdgMetal ); roughnessFactor = mix( roughnessFactor, 0.6, mdgSkin ); if ( mdgRough >= 0.0 ) roughnessFactor = mdgRough;`,
          )
          .replace(
            '#include <metalnessmap_fragment>',
            `#include <metalnessmap_fragment>
metalnessFactor = mdgMetal * 0.9;`,
          )
          .replace(
            '#include <emissivemap_fragment>',
            `#include <emissivemap_fragment>
totalEmissiveRadiance += uFlash + mdgEmit;
${RIM_EMISSIVE_GLSL}`,
          )));
    }),
    (material.customProgramCacheKey = () => 'mdgPersonaje'),
    material
  );
}
/** Material de colores por vértice con metal/brillo en el atributo `metal` (bestias y piezas sueltas). */
function makeGearMaterial() {
  let material = new MeshStandardMaterial({
      vertexColors: !0,
      roughness: 0.75,
      metalness: 0,
      envMap: getEnvMap(),
      envMapIntensity: 0.9,
    }),
    uniforms = { uFlash: { value: new Color(0, 0, 0) } };
  return (
    (material.userData.u = uniforms),
    (material.onBeforeCompile = (shader) => {
      (Object.assign(shader.uniforms, uniforms, rimUniforms),
        (shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            `#include <common>
attribute vec2 metal; varying vec2 vMetal;`,
          )
          .replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
vMetal = metal;`,
          )),
        (shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
varying vec2 vMetal; uniform vec3 uFlash; ${RIM_UNIFORMS_GLSL}`,
          )
          .replace(
            '#include <roughnessmap_fragment>',
            `#include <roughnessmap_fragment>
roughnessFactor = mix(0.78, 0.3, vMetal.x);`,
          )
          .replace(
            '#include <metalnessmap_fragment>',
            `#include <metalnessmap_fragment>
metalnessFactor = vMetal.x * 0.92;`,
          )
          .replace(
            '#include <emissivemap_fragment>',
            `#include <emissivemap_fragment>
totalEmissiveRadiance += uFlash + diffuseColor.rgb * vMetal.y * 2.5;
${RIM_EMISSIVE_GLSL}`,
          )));
    }),
    (material.customProgramCacheKey = () => 'mdgGear'),
    material
  );
}
const textureLoader = new TextureLoader();
const textureCache = new Map();
/** Uniformes compartidos de la luz de borde (los cambia setCharacterRim). */
const rimUniforms = { uRim: { value: 0.22 }, uRimColor: { value: new Color('#ffe6c8') } };
const RIM_UNIFORMS_GLSL = 'uniform float uRim; uniform vec3 uRimColor;';
const RIM_EMISSIVE_GLSL =
  'totalEmissiveRadiance += uRimColor * ( uRim * pow( 1.0 - clamp( abs( dot( normal, normalize( vViewPosition ) ) ), 0.0, 1.0 ), 3.0 ) );';
let textureDetail = detectTextureDetail();
let envMap = null;
const toColor = (c) => new Color(c);
/** Ruido de valor 3D en GLSL para los patrones de piel. */
const NOISE_GLSL = `
float mdgHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float mdgNoise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(mdgHash(i+vec3(0,0,0)), mdgHash(i+vec3(1,0,0)), f.x), mix(mdgHash(i+vec3(0,1,0)), mdgHash(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(mdgHash(i+vec3(0,0,1)), mdgHash(i+vec3(1,0,1)), f.x), mix(mdgHash(i+vec3(0,1,1)), mdgHash(i+vec3(1,1,1)), f.x), f.y), f.z); }
`;

export {
  addRimLight,
  allTexturesReady,
  setCharacterRim,
  setTextureDetail,
  rimUniforms,
  makeGearMaterial,
  makeCharacterMaterial,
};
