// Graba las salidas de referencia: ejecuta cada escenario de paridad/escenarios contra el wasm
// publicado (el oráculo) y guarda cada petición con su respuesta en paridad/oro/<escenario>.jsonl.gz
// (una línea JSON {req, res} por llamada, comprimido con gzip).
//
// Uso: node motor/paridad/grabar.mjs [filtro]      (filtro = parte del nombre del escenario)
//
// Los escenarios deciden la siguiente llamada con las respuestas del oráculo; al comparar se
// reproducen exactamente las mismas peticiones (texto JSON idéntico) contra el núcleo nuevo.
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cargarModulo } from './modulo.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const PUBLICADO = path.resolve(aqui, '../../publicado/rules');
const ORO = path.join(aqui, 'oro');
fs.mkdirSync(ORO, { recursive: true });

const filtro = process.argv[2] ?? '';
const dirEsc = path.join(aqui, 'escenarios');
const archivos = fs.readdirSync(dirEsc).filter((f) => f.endsWith('.mjs')).sort();
let total = 0;
for (const archivo of archivos) {
  const mod = await import(pathToFileURL(path.join(dirEsc, archivo)).href);
  for (const [nombre, fn] of Object.entries(mod.escenarios ?? {})) {
    const id = `${archivo.replace(/\.mjs$/, '')}.${nombre}`;
    if (filtro && !id.includes(filtro)) continue;
    const m = await cargarModulo(PUBLICADO);
    const lineas = [];
    const crudo = (texto) => {
      const res = m.crudo(texto);
      lineas.push(JSON.stringify({ req: texto, res }));
      return res;
    };
    const call = (op, n = {}) => JSON.parse(crudo(JSON.stringify({ op, ...n })));
    try {
      await fn(call, crudo);
    } catch (e) {
      console.error(`${id}: el escenario ha fallado: ${e?.stack ?? e}`);
    }
    fs.rmSync(path.join(ORO, `${id}.jsonl`), { force: true });
    fs.writeFileSync(path.join(ORO, `${id}.jsonl.gz`), zlib.gzipSync(lineas.join('\n') + '\n', { level: 9 }));
    total += lineas.length;
    console.log(`${id}: ${lineas.length} llamadas`);
  }
}
console.log(`Total: ${total} llamadas grabadas en ${path.relative(process.cwd(), ORO)}`);
