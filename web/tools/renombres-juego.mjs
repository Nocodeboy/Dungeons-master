// Renombres manuales "evidentes" de enlaces de nivel superior del juego (nombre minificado en
// publicado/juego.js -> nombre legible). Se aplican además de los que salen solos de los espacios
// de nombres exportados (p. ej. Ns -> Character, Hv -> createUI). El resto de nombres locales
// queda minificado: lo renombrarán los agentes de cada área.
export const RENOMBRES = {
  // main.js: el contexto del juego y el arranque
  Jt: 'game',
  fu: 'actors', // espacio de nombres de actors/index.js (game.actors)
  Qn: 'params',
  my: 'bootErrors',
  Hc: 'bus',
  el: 'store',
  EN: 'savedQualityLevel',
  Ei: 'quality',
  SN: 'canvas',
  gs: 'stage',
  kN: 'turbo',
  fy: 'tiltShift',
  o5: 'focusPoint',
  gy: 'updateTiltShift',
  Gs: 'frameStats',
  AN: 'autoQuality',
  py: 'clock',
  s5: 'frame',
  RN: 'boot',
  vS: 'makeBlurPass',
  yS: 'createTiltShift',
  // quality.js
  t6: 'gpuRenderer',
  a6: 'qualityLevel',
  W_: 'detectQuality',
  // stage.js
  Q_: 'createStage',
  // scenes.js, bus.js, store.js
  bf: 'SceneManager',
  vf: 'Bus',
  yf: 'Store',
  xf: 'STORAGE_PREFIX',
  x6: 'DEFAULT_SETTINGS',
  Cb: 'loadLocal',
  tw: 'saveLocal',
  _6: 'removeLocal',
  // caps.js: capacidades del artefacto (window.claude.use)
  Rb: 'capCache',
  Wl: 'getCap',
  ew: 'getUserId',
  // rules.js: núcleo de reglas en wasm y su API JSON
  _f: 'rulesPromise',
  aw: 'loadRules',
  nw: 'createApi',
  // assets.js
  lf: 'loadingManager',
  G_: 'gltfLoader',
  ZP: 'textureLoader',
  Tb: 'gltfCache',
  Mb: 'textureCache',
  V_: 'anisotropy',
  JP: 'dataUriToBuffer',
  $_: 'setAnisotropy',
  An: 'loadGLTF',
  Vd: 'loadProp',
  QP: 'loadModel',
  e6: 'loadTexture',
  Ka: 'pbrMaterial',
  // ui/dom.js
  pw: 'loadIcons',
  je: 'iconHtml',
  fe: 'escapeHtml',
  Ta: 'richText',
  H: 'elem',
  Ge: 'makeButton',
  li: 'sleep',
  Po: 'reducedMotion',
  // ui/modal.js
  Kt: 'screenFrame',
};
