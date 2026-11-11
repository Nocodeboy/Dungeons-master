// Paso 4: extrae los datos grandes a ficheros legibles en web/src/datos/ (JSON) y las hojas de
// estilo a .css (que esbuild carga como texto, igual que en el original).
// Escribe los ficheros definitivos en web/src/ y, para verificar este paso por separado,
// tools/salida/04-juego-con-datos.js: el mismo fuente del paso 3 pero importando esos ficheros.
import fs from 'node:fs';
import path from 'node:path';
import { leer, analizar } from './lib/ast.mjs';
import { segmentar } from './lib/modulos.mjs';
import { esLiteralPuro, valorDeLiteral, valorDeCadena, asignacionUnica, exportsDeCommonJS } from './lib/datos.mjs';
import { MODULOS } from './nombres-modulos.mjs';

const RAIZ = new URL('..', import.meta.url).pathname;
const S = RAIZ + 'tools/salida/';
const SRC = RAIZ + 'src/';

// Devuelve [{init, ruta, tipo, nombre, nodoValor, contenido}] para todos los módulos de datos.
export function extraerDatos(cod, ast) {
  const { modulos } = segmentar(ast);
  const salida = [];
  for (const m of modulos) {
    const conf = MODULOS[m.init];
    if (!conf || typeof conf === 'string' || !['json', 'css'].includes(conf.tipo)) {
      if (m.tipo === 'json') throw new Error('Módulo JSON sin ruta: ' + m.init);
      continue;
    }
    let nodoValor, nombre = null;
    if (m.tipo === 'json') {
      nodoValor = exportsDeCommonJS(m.sentencias[0].declarations[0].init);
    } else {
      const a = asignacionUnica(m.cuerpo);
      if (!a) throw new Error('El módulo de datos no es una asignación única: ' + m.init);
      nodoValor = a.valor;
      nombre = a.nombre;
    }
    let contenido;
    if (conf.tipo === 'json') {
      if (!esLiteralPuro(nodoValor)) throw new Error('Datos no puros en ' + m.init + ' (' + conf.ruta + ')');
      contenido = JSON.stringify(valorDeLiteral(cod.slice(nodoValor.start, nodoValor.end)), null, 2) + '\n';
    } else {
      contenido = valorDeCadena(nodoValor);
    }
    salida.push({ init: m.init, ruta: conf.ruta, tipo: conf.tipo, nombre, nodoValor, contenido, commonjs: m.tipo === 'json' });
  }
  return salida;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cod = leer(S + '03-juego-con-imports.js');
  const ast = analizar(cod);
  const datos = extraerDatos(cod, ast);
  const imports = [];
  const ediciones = [];
  let bytes = 0;
  for (const d of datos) {
    const destino = SRC + d.ruta;
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, d.contenido);
    bytes += d.nodoValor.end - d.nodoValor.start;
    const id = `__dato_${d.init}`;
    imports.push(`import ${id} from ${JSON.stringify(path.relative(S, destino))};`);
    ediciones.push([d.nodoValor.start, d.nodoValor.end, id]);
  }
  ediciones.sort((a, b) => a[0] - b[0]);
  const trozos = [imports.join('\n') + '\n'];
  let pos = 0;
  for (const [a, b, t] of ediciones) { trozos.push(cod.slice(pos, a), t); pos = b; }
  trozos.push(cod.slice(pos));
  const res = trozos.join('');
  analizar(res);
  fs.writeFileSync(S + '04-juego-con-datos.js', res);
  console.log(`ficheros de datos: ${datos.filter((d) => d.tipo === 'json').length} JSON y ${datos.filter((d) => d.tipo === 'css').length} CSS; ${(bytes / 1024).toFixed(0)} KB de código fuera; fuente ${cod.length} -> ${res.length}`);
}
