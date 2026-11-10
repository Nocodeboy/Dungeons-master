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
  // ui/: piezas principales de la interfaz
  $w: 'createRulesBridge', // envoltorio de reglas con simulador de respaldo
  Gw: 'createSimulator', // simulador JS de operaciones que el núcleo aún no tiene
  Xw: 'createDialog',
  n2: 'createHud',
  fc: 'buildCreator', // creador de personajes y subida de nivel por pasos
  mw: 'coarsePointer',
  // story/: clases de la historia
  mm: 'StoryRunner',
  gm: 'Story',
  bm: 'Narrator',
  ym: 'Tips',
  xm: 'Codex',
  // explore/
  zS: 'loadLevel',
  ES: 'ensureCampaign',
  MS: 'DEFAULT_HERO',
  B1: 'loadArea',
  Tu: 'rollDice',
  s0: 'ExploreInput',
  // explore/hex.js: rejilla hexagonal odd-r, vértice arriba, K = 1,5 m entre centros
  uo: 'cellToPlane',
  xc: 'cellToWorld',
  wm: 'worldToPlane',
  ds: 'planeToCell',
  Ut: 'cellKey',
  Wt: 'hexDistance',
  Us: 'hexShape',
  nt: 'HEX_SIZE',
  _m: 'ROW_STEP',
  fn: 'HEX_RADIUS',
};
