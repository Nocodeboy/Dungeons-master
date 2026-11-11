// actors/materials.js
// Reconstruido de publicado/juego.js (módulo __esm «Br»). Nombres locales aún minificados.

import {
  Color,
  CubeTexture,
  DoubleSide,
  MeshStandardMaterial,
  NoColorSpace,
  SRGBColorSpace,
  TextureLoader,
} from 'three';

function setCharacterRim(o = 0.22, e = null) {
  ((ui.uRim.value = o), e && ui.uRimColor.value.set(e));
}
function m2(o) {
  let e = o.onBeforeCompile;
  o.onBeforeCompile = (a, n) => {
    (e?.call(o, a, n),
      Object.assign(a.uniforms, ui),
      (a.fragmentShader = a.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
${Wb}`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
${Xb}`,
        )));
  };
  let t = o.customProgramCacheKey?.call(o) || '';
  return ((o.customProgramCacheKey = () => `${t}|rim`), o);
}
function mz() {
  try {
    let o = new URLSearchParams(location.search).get('calidad');
    return o
      ? ({ baja: 0, media: 1, alta: 2 }[o] ?? 1)
      : Math.min(innerWidth, innerHeight) < 700 || /Android|iPhone|iPad/i.test(navigator.userAgent)
        ? 0
        : 1;
  } catch {
    return 1;
  }
}
function setTextureDetail(o) {
  g2 = o;
}
function $b(o, e = !0) {
  let t = `${o}|${e}`;
  if (!Nf.has(t)) {
    let a,
      n = new Promise((r) => (a = r)),
      s = () => {
        let r = i.image;
        if (g2 > 0 || typeof createImageBitmap != 'function' || !r?.width) return a();
        createImageBitmap(r, {
          resizeWidth: r.width >> 1,
          resizeHeight: r.height >> 1,
          resizeQuality: 'high',
          premultiplyAlpha: 'none',
          colorSpaceConversion: 'none',
        })
          .then((l) => {
            ((i.image = l), (i.needsUpdate = !0));
          })
          .catch(() => {})
          .finally(a);
      },
      i = fz.load(`assets/chars/tex/${o}.webp`, s, void 0, () => a());
    ((i.flipY = !1),
      (i.colorSpace = e ? SRGBColorSpace : NoColorSpace),
      (i.anisotropy = 4),
      (i.userData.ready = n),
      Nf.set(t, i));
  }
  return Nf.get(t);
}
function sc() {
  return Promise.all([...Nf.values()].map((o) => o.userData.ready));
}
function v2() {
  if (oc) return oc;
  let o = (t, a, n = null) => {
      let s = document.createElement('canvas');
      s.width = s.height = 32;
      let i = s.getContext('2d'),
        r = i.createLinearGradient(0, 0, 0, 32);
      return (
        r.addColorStop(0, t),
        n && r.addColorStop(0.5, n),
        r.addColorStop(1, a),
        (i.fillStyle = r),
        i.fillRect(0, 0, 32, 32),
        s
      );
    },
    e = o('#c9c4bc', '#2a2420', '#8a8078');
  return (
    (oc = new CubeTexture([e, e, o('#e8e2d6', '#e8e2d6'), o('#1e1a16', '#1e1a16'), e, e])),
    (oc.colorSpace = SRGBColorSpace),
    (oc.needsUpdate = !0),
    oc
  );
}
function y2(o, e, t = {}) {
  let a = new MeshStandardMaterial({
    map: $b(`atlas_${o}`),
    normalMap: $b(`atlas_${o}_n`, !1),
    roughness: 0.82,
    metalness: 0,
    envMap: v2(),
    envMapIntensity: 0.6,
    side: DoubleSide,
  });
  a.normalScale.set(0.8, 0.8);
  let n = {
    uMask: { value: $b(`mascara_${o}`, !1) },
    uC1: { value: Ki(e.cloth1 || '#3f5f9a') },
    uC2: { value: Ki(e.cloth2 || '#c9b48a') },
    uMetal: { value: Ki(e.metal || '#b8bec6') },
    uSkin: { value: Ki(e.skin || '#e0ac83') },
    uLeather: { value: Ki(e.leather || '#ffffff') },
    uHair: { value: Ki(e.hair || '#3b2a1e') },
    uEyes: { value: Ki(e.eyes || '#5a3a1e') },
    uGlow: { value: t.glowEyes || 0 },
    uPattern: { value: t.pattern || 0 },
    uPatternColor: { value: Ki(t.patternColor || '#303030') },
    uMail: { value: t.mail || 0 },
    uFlash: { value: new Color(0, 0, 0) },
  };
  return (
    (a.userData.u = n),
    (a.onBeforeCompile = (s) => {
      (Object.assign(s.uniforms, n, ui),
        (s.vertexShader = s.vertexShader
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
        (s.fragmentShader = s.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
uniform sampler2D uMask; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uMetal; uniform vec3 uSkin; uniform vec3 uLeather;
uniform vec3 uHair; uniform vec3 uEyes; uniform float uGlow;
uniform float uPattern; uniform vec3 uPatternColor; uniform float uMail; uniform vec3 uFlash;
${Wb}
varying vec3 vObj; varying vec3 vGcol; varying vec3 vGpar;
float mdgMetal = 0.0; float mdgSkin = 0.0; float mdgRough = -1.0; vec3 mdgEmit = vec3(0.0);
${gz}`,
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
${Xb}`,
          )));
    }),
    (a.customProgramCacheKey = () => 'mdgPersonaje'),
    a
  );
}
function x2() {
  let o = new MeshStandardMaterial({
      vertexColors: !0,
      roughness: 0.75,
      metalness: 0,
      envMap: v2(),
      envMapIntensity: 0.9,
    }),
    e = { uFlash: { value: new Color(0, 0, 0) } };
  return (
    (o.userData.u = e),
    (o.onBeforeCompile = (t) => {
      (Object.assign(t.uniforms, e, ui),
        (t.vertexShader = t.vertexShader
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
        (t.fragmentShader = t.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
varying vec2 vMetal; uniform vec3 uFlash; ${Wb}`,
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
${Xb}`,
          )));
    }),
    (o.customProgramCacheKey = () => 'mdgGear'),
    o
  );
}
const fz = new TextureLoader();
const Nf = new Map();
const ui = { uRim: { value: 0.22 }, uRimColor: { value: new Color('#ffe6c8') } };
const Wb = 'uniform float uRim; uniform vec3 uRimColor;';
const Xb =
  'totalEmissiveRadiance += uRimColor * ( uRim * pow( 1.0 - clamp( abs( dot( normal, normalize( vViewPosition ) ) ), 0.0, 1.0 ), 3.0 ) );';
let g2 = mz();
let oc = null;
const Ki = (o) => new Color(o);
const gz = `
float mdgHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float mdgNoise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(mdgHash(i+vec3(0,0,0)), mdgHash(i+vec3(1,0,0)), f.x), mix(mdgHash(i+vec3(0,1,0)), mdgHash(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(mdgHash(i+vec3(0,0,1)), mdgHash(i+vec3(1,0,1)), f.x), mix(mdgHash(i+vec3(0,1,1)), mdgHash(i+vec3(1,1,1)), f.x), f.y), f.z); }
`;

export { m2, sc, setCharacterRim, setTextureDetail, ui, x2, y2 };
