// quality.js — Detección del nivel de calidad gráfica (0 baja, 1 media, 2 alta).
// Se decide por la GPU (integradas y SwiftShader bajan a media), el tamaño de pantalla y móviles (baja)
// o se fuerza con ?calidad=baja|media|alta. Lo usa main.js; stage.js lee los campos del objeto.

import './assets.js';

/** Nombre del renderizador WebGL (extensión de depuración), o '' si no se puede saber. */
function gpuRenderer() {
  try {
    let gl = document.createElement('canvas').getContext('webgl2'),
      debugInfo = gl && gl.getExtension('WEBGL_debug_renderer_info');
    return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
  } catch {
    return '';
  }
}
/** Parámetros de render de un nivel: sombras, AO, MSAA, bloom, hierba y relación de píxeles. */
function qualityLevel(level) {
  return {
    level,
    low: level === 0,
    shadowMap: level === 2 ? 1024 : level === 1 ? 512 : 256,
    ao: level === 2,
    msaa: level === 2,
    bloom: level > 0,
    grass: level,
    pixelRatio: level === 2 ? Math.min(devicePixelRatio, 1.6) : level === 1 ? 1 : Math.min(devicePixelRatio, 0.85),
  };
}
/**
 * Calidad inicial según el equipo y la URL.
 * @param {URLSearchParams} params parámetros de la URL (usa «calidad»)
 * @returns {object} parámetros de `qualityLevel` más { forced, gpu, small, integrated }
 */
function detectQuality(params = new URLSearchParams(location.search)) {
  let gpu = gpuRenderer(),
    small = Math.min(innerWidth, innerHeight) < 700 || /Android|iPhone|iPad/i.test(navigator.userAgent),
    integrated =
      /Intel|Vega \d|Radeon\(TM\) Graphics|Radeon Graphics|UHD|Iris|Mali|Adreno|PowerVR|Apple GPU|SwiftShader|llvmpipe|Microsoft Basic/i.test(
        gpu,
      ),
    forcedLevel = { baja: 0, media: 1, alta: 2 }[params.get('calidad')];
  return { ...qualityLevel(forcedLevel ?? (small ? 0 : integrated ? 1 : 2)), forced: forcedLevel !== void 0, gpu, small, integrated };
}

export { detectQuality };
