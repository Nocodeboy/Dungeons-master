// quality.js
// Reconstruido de publicado/juego.js (parte sin envolver del final del bundle). Nombres locales aún minificados.

import './assets.js';

function gpuRenderer() {
  try {
    let o = document.createElement('canvas').getContext('webgl2'),
      e = o && o.getExtension('WEBGL_debug_renderer_info');
    return e ? o.getParameter(e.UNMASKED_RENDERER_WEBGL) : '';
  } catch {
    return '';
  }
}
function qualityLevel(o) {
  return {
    level: o,
    low: o === 0,
    shadowMap: o === 2 ? 1024 : o === 1 ? 512 : 256,
    ao: o === 2,
    msaa: o === 2,
    bloom: o > 0,
    grass: o,
    pixelRatio: o === 2 ? Math.min(devicePixelRatio, 1.6) : o === 1 ? 1 : Math.min(devicePixelRatio, 0.85),
  };
}
function detectQuality(o = new URLSearchParams(location.search)) {
  let e = gpuRenderer(),
    t = Math.min(innerWidth, innerHeight) < 700 || /Android|iPhone|iPad/i.test(navigator.userAgent),
    a =
      /Intel|Vega \d|Radeon\(TM\) Graphics|Radeon Graphics|UHD|Iris|Mali|Adreno|PowerVR|Apple GPU|SwiftShader|llvmpipe|Microsoft Basic/i.test(
        e,
      ),
    n = { baja: 0, media: 1, alta: 2 }[o.get('calidad')];
  return { ...qualityLevel(n ?? (t ? 0 : a ? 1 : 2)), forced: n !== void 0, gpu: e, small: t, integrated: a };
}

export { detectQuality };
