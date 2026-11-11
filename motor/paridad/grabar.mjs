// Graba las salidas de referencia: ejecuta cada escenario de paridad/escenarios contra el wasm
// publicado (el oráculo) y guarda cada petición con su respuesta en paridad/oro/<escenario>.jsonl.gz
// (una línea JSON {req, res} por llamada, comprimido con gzip).
//
// Uso: node motor/paridad/grabar.mjs [opciones] [filtro]   (filtro = parte del nombre del escenario)
//   --escenarios <dir>  carpeta de escenarios (por defecto paridad/escenarios)
//   --oro <dir>         dónde guardar el oro (por defecto paridad/oro)
//   --motor <dir>       núcleo que responde (por defecto publicado/rules, el oráculo)
//   --cli <ruta>        responde la herramienta nativa en vez de un wasm
//
// Los escenarios deciden la siguiente llamada con las respuestas del oráculo; al comparar se
// reproducen exactamente las mismas peticiones (texto JSON idéntico) contra el núcleo nuevo.
//
// Las ampliaciones del núcleo (que el publicado no tiene) graban su propio oro con el núcleo nuevo:
//   node motor/paridad/grabar.mjs --escenarios motor/paridad/escenarios-ampliaciones \
//        --oro motor/paridad/oro-ampliaciones --cli motor/build/mdg_cli
// y desde entonces se comparan contra sí mismas (comparar.mjs --oro ...) para detectar regresiones.
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cargarModulo, cargarCli } from './modulo.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, def) => {
  const i = args.indexOf(k);
  if (i < 0) return def;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const PUBLICADO = path.resolve(opt('--motor', path.resolve(aqui, '../../publicado/rules')));
const ORO = path.resolve(opt('--oro', path.join(aqui, 'oro')));
const dirEsc = path.resolve(opt('--escenarios', path.join(aqui, 'escenarios')));
const cli = opt('--cli', null);
fs.mkdirSync(ORO, { recursive: true });

const filtro = args[0] ?? '';
const archivos = fs.readdirSync(dirEsc).filter((f) => f.endsWith('.mjs')).sort();
let total = 0;
for (const archivo of archivos) {
  const mod = await import(pathToFileURL(path.join(dirEsc, archivo)).href);
  for (const [nombre, fn] of Object.entries(mod.escenarios ?? {})) {
    const id = `${archivo.replace(/\.mjs$/, '')}.${nombre}`;
    if (filtro && !id.includes(filtro)) continue;
    const m = cli ? cargarCli(cli) : await cargarModulo(PUBLICADO);
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
    m.cerrar?.();
    fs.rmSync(path.join(ORO, `${id}.jsonl`), { force: true });
    fs.writeFileSync(path.join(ORO, `${id}.jsonl.gz`), zlib.gzipSync(lineas.join('\n') + '\n', { level: 9 }));
    total += lineas.length;
    console.log(`${id}: ${lineas.length} llamadas`);
  }
}
console.log(`Total: ${total} llamadas grabadas en ${path.relative(process.cwd(), ORO)}`);
