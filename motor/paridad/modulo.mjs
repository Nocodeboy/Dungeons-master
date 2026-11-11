// Carga un núcleo de reglas (rules.mjs + rules.wasm de Emscripten) en Node y lo envuelve con la
// misma función que usa el juego (publicado/juego.js): call(op, args) -> objeto.
//
// Con `determinista` (por defecto) se fijan las dos fuentes de azar que usa el núcleo cuando no
// recibe semilla (Pcg32::randomize: reloj del sistema + std::random_device), para que el wasm
// publicado y el reconstruido partan del mismo estado y se puedan comparar salida a salida.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** Reloj fijo: 7 nov 2026 12:00:00 UTC (en nanosegundos, como clock_time_get de WASI). */
export const RELOJ_FIJO_NS = 1794052800000000000n;

export async function cargarModulo(dir, { determinista = true } = {}) {
  const abs = path.resolve(dir);
  const fabrica = (await import(pathToFileURL(path.join(abs, 'rules.mjs')).href + `?t=${Math.random()}`)).default;
  let memoria = null;
  let contador = 0;
  const opciones = { locateFile: (a) => path.join(abs, a) };
  if (determinista) {
    opciones.instantiateWasm = (info, recibir) => {
      const env = info.env;
      if (env.random_get) {
        env.random_get = (buf, size) => {
          const h = new Uint8Array(memoria.buffer, buf, size);
          for (let i = 0; i < size; i++) h[i] = (contador++ * 37 + 11) & 255;
          return 0;
        };
      }
      if (env.clock_time_get) {
        const original = env.clock_time_get;
        env.clock_time_get = (id, precision, ptr) => {
          if (id !== 0) return original(id, precision, ptr);
          new DataView(memoria.buffer).setBigInt64(ptr, RELOJ_FIJO_NS, true);
          return 0;
        };
      }
      WebAssembly.instantiate(fs.readFileSync(path.join(abs, 'rules.wasm')), info).then((r) => {
        memoria = r.instance.exports.memory;
        recibir(r.instance);
      });
      return {};
    };
  }
  const t = await fabrica(opciones);
  /** Llamada en bruto: texto JSON de entrada -> texto JSON de salida (o {excepcion}). */
  const crudo = (texto) => {
    const s = t.stringToNewUTF8(texto);
    try {
      return t.UTF8ToString(t._mdg_call(s));
    } catch (e) {
      return JSON.stringify({ excepcion: e?.constructor?.name ?? String(e) });
    } finally {
      t._free(s);
    }
  };
  const call = (op, n = {}) => JSON.parse(crudo(JSON.stringify({ op, ...n })));
  return { call, crudo };
}
