// Paso 2b: aplica el mapa de three (tools/salida/mapa-three.json) a publicado/juego.js.
// Resultado: tools/salida/02-juego-three-renombrado.js, que debe funcionar igual que el publicado.
// Los nombres nuevos son el nombre exportado por three (p. ej. Mesh, Vector3) o, para lo interno,
// el nombre que tiene en el bundle de referencia.
import fs from 'node:fs';
import { leer, analizar } from './lib/ast.mjs';
import { enlacesDelPrograma } from './lib/ambitos.mjs';
import { nombresEnUso, deconflictar, aplicarRenombrado } from './lib/renombrar.mjs';

const RAIZ = new URL('..', import.meta.url).pathname;
const m = JSON.parse(fs.readFileSync(RAIZ + 'tools/salida/mapa-three.json', 'utf8'));
const cod = leer(RAIZ + '../publicado/juego.js');
const ast = analizar(cod);
const { enlaces } = enlacesDelPrograma(ast);

const propuestas = [];
for (const [min, v] of Object.entries(m.mapa)) {
  const ex = v.exports.find((e) => e.modulo === 'three') || v.exports[0];
  propuestas.push([min, ex ? ex.export : v.ref]);
}
const enUso = nombresEnUso(ast);
const mapa = deconflictar(propuestas, enUso);
const cambiados = [...mapa].filter(([v, n]) => n !== propuestas.find((p) => p[0] === v)[1]);
if (cambiados.length) console.log('Nombres con sufijo por conflicto:', cambiados.slice(0, 20));
const salida = aplicarRenombrado(cod, ast, enlaces, mapa);
fs.writeFileSync(RAIZ + 'tools/salida/02-juego-three-renombrado.js', salida);
fs.writeFileSync(RAIZ + 'tools/salida/02-renombres-three.json', JSON.stringify(Object.fromEntries(mapa), null, 1));
// Comprobación: el resultado debe seguir siendo JS válido.
analizar(salida);
console.log('renombrados', mapa.size, 'bytes', cod.length, '->', salida.length);
