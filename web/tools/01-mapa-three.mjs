// Paso 2a: saca el mapa nombre_minificado -> nombre_real de three.js dentro de publicado/juego.js.
//
// Método: se compila con esbuild un bundle de referencia con los mismos módulos de three
// (tools/referencia-three/entrada.js, --minify-syntax sin minificar identificadores). Ambos
// bundles se descomponen en "unidades" (funciones, declaradores y asignaciones dentro de los
// cierres __esm), se calcula una firma estructural que ignora los nombres de variables, se
// alinean por LCS módulo a módulo y, en cada par alineado, se recorren los dos AST en paralelo
// emparejando identificadores. Solo se guardan los enlaces de nivel superior.
//
// Uso: node tools/01-mapa-three.mjs  (desde web/)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { leer, analizar, unidades, firmaUnidad, lcs, recorrerEnParalelo, cuerpoEsm } from './lib/ast.mjs';
import { enlacesDelPrograma } from './lib/ambitos.mjs';

const RAIZ = new URL('..', import.meta.url).pathname; // web/
const PUBLICADO = RAIZ + '../publicado/juego.js';
const REF = RAIZ + 'tools/salida/referencia-three.js';
const SALIDA = RAIZ + 'tools/salida/mapa-three.json';

fs.mkdirSync(RAIZ + 'tools/salida', { recursive: true });
execFileSync(RAIZ + 'node_modules/.bin/esbuild', [
  'tools/referencia-three/entrada.js', '--bundle', '--format=esm', '--minify-syntax', '--log-level=warning',
  '--outfile=tools/salida/referencia-three.js',
], { cwd: RAIZ, stdio: 'inherit' });

console.time('análisis');
const codMin = leer(PUBLICADO);
const astMin = analizar(codMin);
const codRef = leer(REF);
const astRef = analizar(codRef);
console.timeEnd('análisis');

// ---------- Referencia: módulos por comentario de ruta ----------
const comentarios = astRef.comments.filter((c) => c.type === 'CommentLine' && /^ (node_modules|tools)\//.test(c.value));
const modRef = []; // {ruta, sentencias[]}
for (const s of astRef.program.body) {
  let ruta = null;
  for (const c of comentarios) if (c.start < s.start) ruta = c.value.trim();
  if (!ruta) continue; // ayudantes de esbuild
  if (!modRef.length || modRef[modRef.length - 1].ruta !== ruta) modRef.push({ ruta, sentencias: [] });
  modRef[modRef.length - 1].sentencias.push(s);
}
const esmRef = new Set(['__esm']);
const initRef = new Set();
for (const s of astRef.program.body) if (s.type === 'VariableDeclaration') for (const d of s.declarations) if (cuerpoEsm(d.init, esmRef)) initRef.add(d.id.name);

// Exports de cada módulo de referencia (a partir de los __export de los espacios de nombres).
const exportsRef = new Map(); // nombreInterno -> [{modulo, export}]
const nsAModulo = {
  three_module_exports: 'three',
  BufferGeometryUtils_exports: 'three/addons/utils/BufferGeometryUtils.js',
  SkeletonUtils_exports: 'three/addons/utils/SkeletonUtils.js',
  GLTFLoader_exports: 'three/addons/loaders/GLTFLoader.js',
  meshopt_decoder_module_exports: 'three/addons/libs/meshopt_decoder.module.js',
  OrbitControls_exports: 'three/addons/controls/OrbitControls.js',
  CopyShader_exports: 'three/addons/shaders/CopyShader.js',
  Pass_exports: 'three/addons/postprocessing/Pass.js',
  ShaderPass_exports: 'three/addons/postprocessing/ShaderPass.js',
  MaskPass_exports: 'three/addons/postprocessing/MaskPass.js',
  EffectComposer_exports: 'three/addons/postprocessing/EffectComposer.js',
  RenderPass_exports: 'three/addons/postprocessing/RenderPass.js',
  LuminosityHighPassShader_exports: 'three/addons/shaders/LuminosityHighPassShader.js',
  UnrealBloomPass_exports: 'three/addons/postprocessing/UnrealBloomPass.js',
  GTAOShader_exports: 'three/addons/shaders/GTAOShader.js',
  SimplexNoise_exports: 'three/addons/math/SimplexNoise.js',
  PoissonDenoiseShader_exports: 'three/addons/shaders/PoissonDenoiseShader.js',
  GTAOPass_exports: 'three/addons/postprocessing/GTAOPass.js',
  OutputShader_exports: 'three/addons/shaders/OutputShader.js',
  OutputPass_exports: 'three/addons/postprocessing/OutputPass.js',
};
for (const s of astRef.program.body) {
  if (s.type !== 'ExpressionStatement' || s.expression.type !== 'CallExpression') continue;
  const c = s.expression;
  if (c.callee.name !== '__export') continue;
  const ns = c.arguments[0].name;
  const modulo = nsAModulo[ns];
  if (!modulo) continue;
  for (const p of c.arguments[1].properties) {
    const exp = p.key.type === 'Identifier' ? p.key.name : p.key.value;
    const interno = p.value.body.name;
    if (!exportsRef.has(interno)) exportsRef.set(interno, []);
    exportsRef.get(interno).push({ modulo, export: exp });
  }
}

// ---------- Minificado: módulos de three ----------
const cuerpo = astMin.program.body;
const esmMin = new Set(['re']);
const initMin = new Set();
const sentDeInit = new Map();
cuerpo.forEach((s, i) => {
  if (s.type === 'VariableDeclaration') for (const d of s.declarations) if (cuerpoEsm(d.init, esmMin)) { initMin.add(d.id.name); sentDeInit.set(d.id.name, i); }
});
// Los seis primeros módulos envueltos son three: core, module, BufferGeometryUtils, SkeletonUtils, GLTFLoader, meshopt.
const INITS_THREE = ['zg', 'Xe', 'Gi', 'Nr', 'q_', 'j_'];
const RUTAS_ENVUELTAS = [
  'node_modules/three/build/three.core.js',
  'node_modules/three/build/three.module.js',
  'node_modules/three/examples/jsm/utils/BufferGeometryUtils.js',
  'node_modules/three/examples/jsm/utils/SkeletonUtils.js',
  'node_modules/three/examples/jsm/loaders/GLTFLoader.js',
  'node_modules/three/examples/jsm/libs/meshopt_decoder.module.js',
];
const PRIMERA = 9; // tras los ayudantes de esbuild
const modMin = [];
let desde = PRIMERA;
for (const ini of INITS_THREE) {
  const hasta = sentDeInit.get(ini);
  modMin.push({ init: ini, sentencias: cuerpo.slice(desde, hasta + 1), desde, hasta });
  desde = hasta + 1;
}
// Cola sin envolver: tras el último módulo envuelto del juego (n5) hasta el final.
const iCola = sentDeInit.get('n5') + 1;
const cola = { init: null, sentencias: cuerpo.slice(iCola), desde: iCola, hasta: cuerpo.length - 1 };

// ---------- Alineación ----------
console.time('ámbitos');
const { nodoAEnlace } = enlacesDelPrograma(astMin);
console.timeEnd('ámbitos');

const votos = new Map(); // nombreMin -> Map(nombreRef -> n)
const votar = (min, ref, peso = 1) => {
  if (!votos.has(min)) votos.set(min, new Map());
  const m = votos.get(min);
  m.set(ref, (m.get(ref) || 0) + peso);
};
const unidadesTresMin = new Set(); // unidades del minificado reconocidas como three (para la cola)
const informe = [];

function alinear(etiqueta, sentMin, sentRef) {
  const uMin = unidades(sentMin, esmMin, initMin);
  const uRef = unidades(sentRef, esmRef, initRef);
  const fMin = uMin.map(firmaUnidad);
  const fRef = uRef.map(firmaUnidad);
  const pares = lcs(fMin, fRef);
  const cuenta = (l) => l.reduce((m, f) => m.set(f, (m.get(f) || 0) + 1), new Map());
  const cMin = cuenta(fMin), cRef = cuenta(fRef);
  let divergencias = 0;
  for (const [i, j] of pares) {
    const a = uMin[i], b = uRef[j];
    unidadesTresMin.add(a);
    if (a.tipo === 'esm') { votar(a.nombre, b.nombre, 1); continue; }
    // El nombre de la unidad solo es fiable si su firma es única a ambos lados.
    const unica = cMin.get(fMin[i]) === 1 && cRef.get(fRef[j]) === 1;
    if (a.nombre && b.nombre && a.tipo !== 'init' && (a.nodo || a.tipo !== 'var')) votar(a.nombre, b.nombre, unica ? 5 : 0.5);
    if (!a.nodo || !b.nodo) continue;
    const ok = recorrerEnParalelo(a.nodo, b.nodo, (x, y) => {
      const en = nodoAEnlace.get(x);
      if (en) votar(en, y.name);
    });
    if (a.id && b.id && a.id.type !== 'Identifier') recorrerEnParalelo(a.id, b.id, (x, y) => { const en = nodoAEnlace.get(x); if (en) votar(en, y.name); });
    if (!ok) divergencias++;
  }
  const sinPar = uMin.length - pares.length;
  informe.push({ modulo: etiqueta, unidadesMin: uMin.length, unidadesRef: uRef.length, emparejadas: pares.length, sinPar, divergencias });
  return { uMin, pares };
}

for (let k = 0; k < modMin.length; k++) {
  const ref = modRef.find((m) => m.ruta === RUTAS_ENVUELTAS[k]);
  alinear(RUTAS_ENVUELTAS[k], modMin[k].sentencias, ref.sentencias);
}
// Cola: todos los addons sin envolver de la referencia contra la cola del minificado.
const refCola = modRef.filter((m) => !RUTAS_ENVUELTAS.includes(m.ruta) && m.ruta.startsWith('node_modules/'));
const { uMin: uCola, pares: paresCola } = alinear('cola (addons sin envolver)', cola.sentencias, refCola.flatMap((m) => m.sentencias));

// ---------- Resolver votos ----------
const mapa = {};
const conflictos = [];
for (const [min, m] of votos) {
  const orden = [...m.entries()].sort((a, b) => b[1] - a[1]);
  const [ref, n] = orden[0];
  if (orden.length > 1) conflictos.push({ min, opciones: orden.slice(0, 4) });
  mapa[min] = { ref, votos: n, exports: exportsRef.get(ref) || [] };
}
// ¿Algún nombre de referencia recibe varios minificados?
const inverso = new Map();
for (const [min, v] of Object.entries(mapa)) {
  if (!inverso.has(v.ref)) inverso.set(v.ref, []);
  inverso.get(v.ref).push(min);
}
const duplicados = [...inverso.entries()].filter(([, l]) => l.length > 1);

// Sentencias de la cola que pertenecen a three (todas sus unidades emparejadas).
const sentenciasColaThree = [];
for (const s of cola.sentencias) {
  const us = uCola.filter((u) => u.sent === s || u.decl && s.declarations?.includes(u.decl));
  const esInitXe = s.type === 'ExpressionStatement' && s.expression.type === 'CallExpression' && s.expression.callee.name === 'Xe';
  if (us.length && us.every((u) => unidadesTresMin.has(u))) sentenciasColaThree.push({ start: s.start, end: s.end });
  else if (us.some((u) => unidadesTresMin.has(u)) && !esInitXe) console.warn('Sentencia mixta en la cola:', codMin.slice(s.start, s.start + 80));
}

fs.writeFileSync(SALIDA, JSON.stringify({
  informe,
  modulosEnvueltos: modMin.map((m, k) => ({ init: m.init, ruta: RUTAS_ENVUELTAS[k], desde: cuerpo[m.desde].start, hasta: cuerpo[m.hasta].end })),
  ayudantes: { desde: 0, hasta: cuerpo[PRIMERA - 1].end },
  sentenciasColaThree,
  conflictos,
  duplicados,
  mapa,
}, null, 1));
console.table(informe);
console.log('nombres mapeados:', Object.keys(mapa).length, 'conflictos:', conflictos.length, 'duplicados:', duplicados.length);
