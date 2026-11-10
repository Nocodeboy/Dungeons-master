// Compara el núcleo reconstruido con las salidas de referencia de paridad/oro/*.jsonl.
//
// Uso: node motor/paridad/comparar.mjs [opciones] [filtro]
//   --motor <dir>   carpeta con rules.mjs + rules.wasm (por defecto motor/dist)
//   --cli <ruta>    usa la herramienta nativa (motor/build/mdg_cli) en vez del wasm
//   --ver <n>       muestra hasta n diferencias por operación (por defecto 3)
//   --op <op>       solo esa operación en el detalle
//   --json <ruta>   guarda el resumen en JSON
//
// Cada petición grabada se reproduce con el mismo texto JSON y se clasifica la respuesta:
//   idéntica     el mismo texto, byte a byte
//   equivalente  el mismo JSON salvo el orden de las claves de los objetos
//   distinta     cualquier otra diferencia
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cargarModulo } from './modulo.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, def) => {
  const i = args.indexOf(k);
  if (i < 0) return def;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const motorDir = path.resolve(opt('--motor', path.join(aqui, '../dist')));
const cli = opt('--cli', null);
const ver = Number(opt('--ver', '3'));
const soloOp = opt('--op', null);
const salidaJson = opt('--json', null);
const filtro = args[0] ?? '';

const ORO = path.join(aqui, 'oro');
const archivos = fs.readdirSync(ORO).filter((f) => f.endsWith('.jsonl') && f.includes(filtro)).sort();

/** JSON con las claves ordenadas (para comparar sin orden de claves). */
function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).sort()) o[k] = canon(v[k]);
    return o;
  }
  return v;
}

/** Primera ruta donde difieren dos valores JSON. */
function primeraDif(a, b, p = '') {
  if (JSON.stringify(canon(a)) === JSON.stringify(canon(b))) return null;
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (i >= a.length) return `${p}[${i}]: sobra en el nuevo ${JSON.stringify(b[i]).slice(0, 160)}`;
      if (i >= b.length) return `${p}[${i}]: falta en el nuevo ${JSON.stringify(a[i]).slice(0, 160)}`;
      const d = primeraDif(a[i], b[i], `${p}[${i}]`);
      if (d) return d;
    }
  } else if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    for (const k of Object.keys(a)) if (!(k in b)) return `${p}.${k}: falta en el nuevo (${JSON.stringify(a[k]).slice(0, 160)})`;
    for (const k of Object.keys(b)) if (!(k in a)) return `${p}.${k}: sobra en el nuevo (${JSON.stringify(b[k]).slice(0, 160)})`;
    for (const k of Object.keys(a)) {
      const d = primeraDif(a[k], b[k], `${p}.${k}`);
      if (d) return d;
    }
  }
  return `${p}: publicado ${JSON.stringify(a).slice(0, 200)} | nuevo ${JSON.stringify(b).slice(0, 200)}`;
}

/** Primera clave fuera de orden (cuando solo cambia el orden). */
function difOrden(a, b, p = '') {
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < a.length; i++) {
      const d = difOrden(a[i], b[i], `${p}[${i}]`);
      if (d) return d;
    }
  } else if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a).join(','), kb = Object.keys(b).join(',');
    if (ka !== kb) return `${p}: publicado {${ka}} | nuevo {${kb}}`;
    for (const k of Object.keys(a)) {
      const d = difOrden(a[k], b[k], `${p}.${k}`);
      if (d) return d;
    }
  }
  return null;
}

async function reproducir(peticiones) {
  if (cli) {
    const r = spawnSync(path.resolve(cli), [], {
      input: peticiones.join('\n') + '\n',
      env: { ...process.env, MDG_DETERMINISTA: '1' },
      maxBuffer: 1 << 30,
    });
    const lineas = r.stdout.toString('utf8').split('\n');
    return peticiones.map((_, i) => lineas[i] ?? JSON.stringify({ excepcion: 'sin respuesta' }));
  }
  const m = await cargarModulo(motorDir);
  return peticiones.map((p) => m.crudo(p));
}

const porOp = {};
const detalles = {};
let totales = { n: 0, identica: 0, equivalente: 0, distinta: 0 };
for (const archivo of archivos) {
  const casos = fs.readFileSync(path.join(ORO, archivo), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const respuestas = await reproducir(casos.map((c) => c.req));
  casos.forEach((caso, i) => {
    let op;
    try {
      op = JSON.parse(caso.req)?.op;
    } catch {
      op = undefined;
    }
    op = typeof op === 'string' ? op || '(vacía)' : '(sin op)';
    const st = (porOp[op] ??= { n: 0, identica: 0, equivalente: 0, distinta: 0 });
    st.n++;
    totales.n++;
    const nuevo = respuestas[i];
    let clase;
    if (nuevo === caso.res) clase = 'identica';
    else {
      let a, b;
      try {
        a = JSON.parse(caso.res);
        b = JSON.parse(nuevo);
      } catch {
        a = caso.res;
        b = nuevo;
      }
      clase = JSON.stringify(canon(a)) === JSON.stringify(canon(b)) ? 'equivalente' : 'distinta';
      if ((!soloOp || soloOp === op) && ver > 0) {
        const lista = (detalles[op] ??= []);
        if (lista.length < ver) {
          lista.push(`${archivo}:${i + 1} [${clase}] ${clase === 'equivalente' ? difOrden(a, b) : primeraDif(a, b)}`);
        }
      }
    }
    st[clase]++;
    totales[clase]++;
  });
}

const pct = (x, n) => (n ? ((100 * x) / n).toFixed(1) : '0.0').padStart(5);
console.log('operación'.padEnd(18), 'casos'.padStart(6), ' idént.', ' equiv.', ' dist.');
for (const op of Object.keys(porOp).sort()) {
  const s = porOp[op];
  console.log(op.padEnd(18), String(s.n).padStart(6), pct(s.identica, s.n) + '%', pct(s.equivalente, s.n) + '%', String(s.distinta).padStart(5));
}
console.log('TOTAL'.padEnd(18), String(totales.n).padStart(6), pct(totales.identica, totales.n) + '%', pct(totales.equivalente, totales.n) + '%', String(totales.distinta).padStart(5));
for (const [op, lista] of Object.entries(detalles)) {
  console.log(`\n== ${op}`);
  for (const l of lista) console.log('  ' + l);
}
if (salidaJson) fs.writeFileSync(salidaJson, JSON.stringify({ totales, porOp }, null, 1));
