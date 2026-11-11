// Paso 3: sustituye el three.js empotrado por imports reales de `three` (npm) y sus addons.
// Entrada: tools/salida/02-juego-three-renombrado.js (+ mapa-three.json, 02-renombres-three.json).
// Salida:  tools/salida/03-juego-con-imports.js, un fuente ESM que esbuild empaqueta tomando
//          three de node_modules.
// Se quitan: las sentencias de three (módulos envueltos y addons de la cola) y las llamadas a
// las funciones de inicialización __esm de three (Xe(), Gi()...), que ya no hacen falta.
import fs from 'node:fs';
import { leer, analizar, recorrer } from './lib/ast.mjs';
import { enlacesDelPrograma } from './lib/ambitos.mjs';

const RAIZ = new URL('..', import.meta.url).pathname;
const S = RAIZ + 'tools/salida/';
const m = JSON.parse(fs.readFileSync(S + 'mapa-three.json', 'utf8'));
const renombres = JSON.parse(fs.readFileSync(S + '02-renombres-three.json', 'utf8'));
const cod = leer(S + '02-juego-three-renombrado.js');
const ast = analizar(cod);
const cuerpo = ast.program.body;

const indices = new Set(m.indicesThree);
const inits = new Set(m.initsThree.map((x) => renombres[x]));
const quitar = []; // [start, end]
for (const i of indices) quitar.push([cuerpo[i].start, cuerpo[i].end]);

// Enlaces de three (por nombre nuevo) y si se usan fuera de la región three.
const dentro = (pos) => [...indices].some((i) => pos >= cuerpo[i].start && pos < cuerpo[i].end);
const { enlaces } = enlacesDelPrograma(ast);
const porNuevo = new Map(Object.entries(renombres).map(([min, nuevo]) => [nuevo, min]));
const usados = new Map(); // nuevo -> {modulo, export}
const llamadasInit = [];
for (const [nombre, e] of enlaces) {
  if (!porNuevo.has(nombre)) continue;
  for (const n of e.nodos) {
    if (dentro(n.start)) continue;
    if (inits.has(nombre)) { llamadasInit.push(n); continue; }
    const info = m.mapa[porNuevo.get(nombre)];
    const ex = info.exports.find((x) => x.modulo === 'three') || info.exports[0];
    if (!ex) throw new Error(`El juego usa ${nombre}, que three no exporta`);
    usados.set(nombre, ex);
  }
}
// Las llamadas a inits de three deben ser sentencias sueltas `init();`.
const padres = new Map();
recorrer(ast.program, (n, padre) => { padres.set(n, padre); });
for (const id of llamadasInit) {
  const llamada = padres.get(id);
  const sent = padres.get(llamada);
  if (llamada?.type !== 'CallExpression' || sent?.type !== 'ExpressionStatement') {
    throw new Error('Llamada a init de three con forma inesperada en ' + id.start + ': ' + cod.slice(id.start - 40, id.start + 40));
  }
  quitar.push([sent.start, sent.end]);
}

// Imports agrupados por módulo, en un orden estable.
const porModulo = new Map();
for (const [nombre, ex] of [...usados].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (!porModulo.has(ex.modulo)) porModulo.set(ex.modulo, []);
  porModulo.get(ex.modulo).push(ex.export === nombre ? nombre : `${ex.export} as ${nombre}`);
}
const orden = [...porModulo.keys()].sort((a, b) => (a === 'three' ? -1 : b === 'three' ? 1 : a.localeCompare(b)));
const cabecera = orden.map((mod) => `import { ${porModulo.get(mod).join(', ')} } from '${mod}';`).join('\n') + '\n';

quitar.sort((a, b) => a[0] - b[0]);
const trozos = [cabecera];
let pos = 0;
for (const [a, b] of quitar) {
  if (a < pos) continue; // contenido dentro de algo ya quitado
  trozos.push(cod.slice(pos, a));
  pos = b;
}
trozos.push(cod.slice(pos));
const salida = trozos.join('');
analizar(salida);
fs.writeFileSync(S + '03-juego-con-imports.js', salida);
console.log('imports:', usados.size, 'de', porModulo.size, 'módulos; llamadas init quitadas:', llamadasInit.length, '; bytes', cod.length, '->', salida.length);
