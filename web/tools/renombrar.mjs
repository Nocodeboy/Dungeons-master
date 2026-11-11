// Renombrado consciente de ámbitos para la limpieza de áreas de web/src/ (babel + empalme de texto).
//
// Aplica un mapa JSON:
//   {
//     "_base": "<commit>",          commit con los ficheros ORIGINALES (minificados) del área
//     "_area": "src/ui",            carpeta del área (los imports de dentro se renombran enteros)
//     "_rutas": { "src/ui/nuevo.js": "src/ui/viejo.js" },   ficheros renombrados (opcional)
//     "src/ui/dom.js": { "clave": "nombreNuevo", … },
//   }
// Las claves se resuelven SIEMPRE contra el fichero original del commit `_base`, con sus nombres
// minificados de origen. El enlace n-ésimo del original (en orden del código) es el n-ésimo del
// fichero actual, así que el mapa se puede volver a aplicar cuando se quiera (idempotente) y
// conserva los comentarios y el formato del fichero actual.
//
// Formato de clave: segmentos separados por «/». El último es el enlace; los anteriores son anclas
// que acotan dónde buscarlo (cada una se busca dentro de la anterior, a cualquier profundidad):
//   "Xl"                  el único enlace llamado Xl en todo el fichero
//   "createHud/o"         el único enlace llamado o dentro de la declaración createHud
//   "createHud/.render/e" dentro del método o propiedad «render» (ancla de propiedad: con punto)
//   "createHud/e#2"       el 2.º enlace llamado e dentro de createHud (orden del código)
//   "createHud/e*"        todos los enlaces llamados e dentro de createHud
// Un valor igual al nombre original («"i": "i"») marca el nombre como revisado y se deja igual.
//
// Exports: si el enlace se exporta con su propio nombre (export { Xl }) y el módulo no es un
// espacio de nombres (destino de import() o de import * as, o src/*/index.js), se renombra
// también el export y se actualizan los imports de todo src/. Dentro del área también se renombra
// el enlace local; fuera del área solo se toca la línea del import (import { nuevo as viejo }).
//
// Comprobaciones: se simula la resolución de cada identificador con los nombres finales (ninguna
// captura ni duplicado), se comprueba la equivalencia alfa del fichero antes/después y se formatea
// con prettier (mismas opciones que 05-partir-modulos.mjs).
//
// Uso (desde web/):
//   node tools/renombrar.mjs renombres/interfaz.json [--seco]
//   node tools/renombrar.mjs renombres/interfaz.json --listar src/ui/dom.js [--todos]
//   node tools/renombrar.mjs renombres/interfaz.json --medir
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import * as prettier from 'prettier';
import { esPosicionPropiedad } from './lib/ast.mjs';

const traverse = _traverse.default || _traverse;
const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'); // web/
const SRC = path.join(RAIZ, 'src');
const OPCIONES_PRETTIER = { parser: 'babel', printWidth: 110, singleQuote: true };
const RESERVADAS = new Set(
  ('break case catch class const continue debugger default delete do else enum export extends false finally for ' +
    'function if import in instanceof new null return super switch this throw true try typeof var void while with ' +
    'yield let static implements interface package private protected public await arguments eval undefined NaN Infinity')
    .split(' '),
);

// ---------------------------------------------------------------- análisis de un fichero

function analizarCodigo(codigo) {
  const ast = parse(codigo, { sourceType: 'module', errorRecovery: false });
  const ambitos = new Set();
  const ocurrencias = []; // { nodo, ambito, padre, clave, nombre }
  traverse(ast, {
    enter(p) {
      ambitos.add(p.scope);
    },
    Identifier(p) {
      const clave = p.listKey ?? p.key;
      if (esExterno(p.parent, clave, p.parentPath?.parent) || esPosicionPropiedad(p.parent, clave)) return;
      ocurrencias.push({ nodo: p.node, ambito: p.scope, padre: p.parent, abuelo: p.parentPath?.parent, clave, nombre: p.node.name });
    },
  });
  // Enlaces de todos los ámbitos, con todos sus identificadores.
  const enlacesBabel = new Set();
  for (const s of ambitos) for (const b of Object.values(s.bindings)) enlacesBabel.add(b);
  const enlaces = [...enlacesBabel]
    .map((b) => ({ b, nombre: b.identifier.name, id: b.identifier, ambito: b.scope, tipo: b.kind }))
    .sort((x, y) => x.id.start - y.id.start);
  enlaces.forEach((e, i) => (e.idx = i));
  const porNodo = new Map();
  for (const e of enlaces) {
    porNodo.set(e.id, e);
    for (const r of e.b.referencePaths) porNodo.set(r.node, e);
    for (const v of e.b.constantViolations) {
      const ids = v.getBindingIdentifiers ? v.getBindingIdentifiers(true) : {};
      for (const lista of Object.values(ids)) for (const id of [].concat(lista)) if (id?.name === e.nombre) porNodo.set(id, e);
      if (v.node.type === 'UpdateExpression' && v.node.argument.type === 'Identifier') porNodo.set(v.node.argument, e);
      if (v.node.type === 'AssignmentExpression' && v.node.left.type === 'Identifier') porNodo.set(v.node.left, e);
    }
  }
  const porBabel = new Map(enlaces.map((e) => [e.b, e]));
  for (const o of ocurrencias) {
    o.enlace = porNodo.get(o.nodo) ?? porBabel.get(o.ambito.getBinding(o.nombre)) ?? null;
    o.declaracion = o.enlace?.id === o.nodo;
  }
  // Especificadores de import/export (nombres externos).
  const especificadores = [];
  for (const s of ast.program.body) {
    if (s.type === 'ImportDeclaration') {
      for (const e of s.specifiers)
        especificadores.push({ tipo: e.type === 'ImportSpecifier' ? 'import' : 'import-otro', nodo: e, fuente: s.source.value });
    } else if (s.type === 'ExportNamedDeclaration') {
      if (s.declaration) {
        for (const id of idsDeclaracion(s.declaration)) especificadores.push({ tipo: 'export-decl', nodo: id, fuente: null });
      }
      for (const e of s.specifiers || [])
        especificadores.push({ tipo: s.source ? 'reexport' : 'export', nodo: e, fuente: s.source?.value ?? null });
    }
  }
  return { codigo, ast, enlaces, ocurrencias, especificadores };
}

function idsDeclaracion(d) {
  if (d.type === 'VariableDeclaration') return d.declarations.map((x) => x.id).filter((x) => x.type === 'Identifier');
  return d.id ? [d.id] : [];
}

// Identificadores que son nombres externos de módulo (no enlaces locales).
function esExterno(padre, clave, abuelo) {
  if (!padre) return false;
  if (padre.type === 'ImportSpecifier') return clave === 'imported';
  if (padre.type === 'ExportSpecifier') return clave === 'exported' || (clave === 'local' && !!abuelo?.source);
  if (padre.type === 'ExportNamespaceSpecifier' || padre.type === 'ExportDefaultSpecifier') return clave === 'exported';
  if (padre.type === 'ImportAttribute') return clave === 'key';
  return false;
}

const nombreDe = (n) => (n?.type === 'Identifier' ? n.name : n?.type === 'StringLiteral' ? n.value : null);

// Nodos que pueden servir de ancla de propiedad (.nombre).
function anclasPropiedad(ast) {
  const r = [];
  traverse(ast, {
    'ObjectMethod|ClassMethod|ObjectProperty|ClassProperty|ClassAccessorProperty'(p) {
      if (!p.node.computed && p.node.key?.type === 'Identifier') r.push({ nombre: p.node.key.name, nodo: p.node });
    },
  });
  return r.sort((a, b) => a.nodo.start - b.nodo.start);
}

function rangoDeEnlace(e) {
  const n = e.b.path.node;
  return [n.start, n.end];
}

// ---------------------------------------------------------------- resolución de claves

function partirSegmento(seg) {
  const m = /^(\.?)([A-Za-z_$][\w$]*)(?:#(\d+)|(\*))?$/.exec(seg);
  if (!m) throw new Error(`Segmento de clave no válido: «${seg}»`);
  return { prop: !!m[1], nombre: m[2], k: m[3] ? Number(m[3]) : null, todos: !!m[4] };
}

// Rango [inicio, fin) que acotan las anclas `segs` (todas menos el último segmento de una clave).
function rangoDeAnclas(a, segs, clave) {
  let rango = [0, a.codigo.length + 1];
  for (const seg of segs) {
    const s = partirSegmento(seg);
    if (s.todos) throw new Error(`«*» solo vale en el último segmento: «${clave}»`);
    const dentro = (x) => x >= rango[0] && x < rango[1];
    if (s.prop) {
      a.props ??= anclasPropiedad(a.ast);
      const el = elegir(a.props.filter((x) => x.nombre === s.nombre && dentro(x.nodo.start)), s, clave);
      rango = [el.nodo.start, el.nodo.end];
    } else rango = rangoDeEnlace(elegir(a.enlaces.filter((e) => e.nombre === s.nombre && dentro(e.id.start)), s, clave));
  }
  return rango;
}

// Devuelve los índices de enlace (en el análisis `a`, el original) que designa la clave.
function resolverClave(a, clave) {
  const segs = clave.split('/');
  const rango = rangoDeAnclas(a, segs.slice(0, -1), clave);
  const s = partirSegmento(segs[segs.length - 1]);
  if (s.prop) throw new Error(`La clave «${clave}» termina en un ancla de propiedad`);
  const cand = a.enlaces.filter((e) => e.nombre === s.nombre && e.id.start >= rango[0] && e.id.start < rango[1]);
  if (s.todos) {
    if (!cand.length) throw new Error(`La clave «${clave}» no designa ningún enlace`);
    return cand.map((e) => e.idx);
  }
  return [elegir(cand, s, clave).idx];
}

function elegir(cand, s, clave) {
  if (s.k != null) {
    if (s.k < 1 || s.k > cand.length) throw new Error(`«${clave}»: hay ${cand.length} candidatos para «${s.nombre}», no ${s.k}`);
    return cand[s.k - 1];
  }
  if (cand.length !== 1) throw new Error(`«${clave}»: ${cand.length} candidatos para «${s.nombre}» (usa un ancla o #k)`);
  return cand[0];
}

// ---------------------------------------------------------------- utilidades de proyecto

function listarJs(dir) {
  const r = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...listarJs(p));
    else if (e.name.endsWith('.js')) r.push(p);
  }
  return r.sort();
}
const rel = (abs) => path.relative(RAIZ, abs).split(path.sep).join('/');
const abs = (r) => path.join(RAIZ, r);

function resolverModulo(desde, fuente) {
  if (!fuente.startsWith('.')) return null;
  return rel(path.resolve(path.dirname(abs(desde)), fuente));
}

// Módulos cuyos exports son propiedades de un espacio de nombres: no se renombran sus exports.
function modulosConEspacio(ficheros) {
  const r = new Set();
  for (const f of ficheros) {
    const t = fs.readFileSync(abs(f), 'utf8');
    for (const m of t.matchAll(/import\(\s*['"`](\.[^'"`$]+)['"`]\s*\)/g)) r.add(resolverModulo(f, m[1]));
    for (const m of t.matchAll(/import\s*\*\s*as\s+[\w$]+\s+from\s*['"](\.[^'"]+)['"]/g)) r.add(resolverModulo(f, m[1]));
  }
  for (const d of fs.readdirSync(SRC, { withFileTypes: true }))
    if (d.isDirectory() && fs.existsSync(path.join(SRC, d.name, 'index.js'))) r.add(`src/${d.name}/index.js`);
  return r;
}

function leerBase(mapa, f) {
  const original = mapa._rutas?.[f] ?? f;
  try {
    return execFileSync('git', ['-C', RAIZ, 'show', `${mapa._base}:web/${original}`], { encoding: 'utf8', maxBuffer: 64 << 20 });
  } catch {
    return null; // fichero nuevo
  }
}

// ¿Nombre con pinta de minificado? (para medir y listar). Un nombre corto que se quiera conservar
// (i, x, ev…) se marca en el mapa como revisado («"i": "i"») o se pone al renombrar.
export function pareceMinificado(n) {
  return n.length <= 2 || (n.length === 3 && /[\d_$]/.test(n));
}

// ---------------------------------------------------------------- plan global

function cargarMapa(ruta) {
  const mapa = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  if (!mapa._base) throw new Error('El mapa necesita "_base" (commit con los ficheros originales)');
  return mapa;
}
const ficherosDelMapa = (mapa) => Object.keys(mapa).filter((k) => !k.startsWith('_'));

// Para cada fichero del mapa: análisis del original, nombres deseados (idx -> nombre) y tabla de
// exports renombrados (nombre exportado original -> nuevo).
function planificar(mapa, espacios) {
  const plan = new Map(); // fichero -> { base, deseados: Map(idx->nombre), explicitos:Set(idx) }
  const exportes = new Map(); // fichero -> Map(viejo -> nuevo)
  const errores = [];
  for (const f of ficherosDelMapa(mapa)) {
    const texto = leerBase(mapa, f);
    if (texto == null) { errores.push(`${f}: no está en ${mapa._base}`); continue; }
    const base = analizarCodigo(texto);
    const deseados = new Map();
    for (const [clave, nuevo] of Object.entries(mapa[f])) {
      if (!/^[A-Za-z_$][\w$]*$/.test(nuevo) || RESERVADAS.has(nuevo)) { errores.push(`${f}: nombre no válido «${nuevo}» (${clave})`); continue; }
      try {
        for (const idx of resolverClave(base, clave)) {
          const previo = deseados.get(idx);
          if (previo && previo !== nuevo) errores.push(`${f}: «${clave}» choca con otra clave (${previo} / ${nuevo})`);
          deseados.set(idx, nuevo);
        }
      } catch (e) {
        errores.push(`${f}: ${e.message}`);
      }
    }
    const tabla = new Map();
    if (!espacios.has(f)) {
      for (const esp of base.especificadores) {
        if (esp.tipo !== 'export') continue;
        const local = base.ocurrencias.find((o) => o.nodo === esp.nodo.local)?.enlace;
        const exportado = nombreDe(esp.nodo.exported);
        if (!local || exportado !== local.nombre || local.ambito.path.type !== 'Program') continue;
        const nuevo = deseados.get(local.idx);
        if (nuevo && nuevo !== exportado) tabla.set(exportado, nuevo);
      }
    }
    plan.set(f, { base, deseados });
    exportes.set(f, tabla);
  }
  return { plan, exportes, errores };
}

// Añade a los ficheros del área los renombres de imports abreviados de módulos con exports nuevos.
function deseadosDeImports(f, base, deseados, exportes) {
  const r = new Map(deseados);
  for (const esp of base.especificadores) {
    if (esp.tipo !== 'import') continue;
    const mod = resolverModulo(f, esp.fuente);
    const nuevo = exportes.get(mod)?.get(nombreDe(esp.nodo.imported));
    if (!nuevo) continue;
    const local = base.ocurrencias.find((o) => o.nodo === esp.nodo.local)?.enlace;
    if (local && local.nombre === nombreDe(esp.nodo.imported) && !r.has(local.idx)) r.set(local.idx, nuevo);
  }
  return r;
}

// ---------------------------------------------------------------- aplicar a un fichero

// Devuelve el código nuevo (o el mismo) y lanza si hay capturas o la estructura no casa.
function reescribir(f, actual, base, deseados, exportes) {
  // Nombre final de cada enlace del fichero actual.
  const final = new Map();
  if (base) {
    // El enlace n-ésimo del original es el n-ésimo del actual solo si ambos tienen la misma forma
    // canónica (mismo código salvo nombres de variables).
    if (base.enlaces.length !== actual.enlaces.length || formaCanonica(base) !== formaCanonica(actual))
      throw new Error(`${f}: el fichero actual no tiene la misma estructura que el original (¿cambió la lógica?)`);
    for (const e of actual.enlaces) final.set(e, deseados.get(e.idx) ?? e.nombre);
  } else for (const e of actual.enlaces) final.set(e, e.nombre);
  const nombreFinal = (e) => final.get(e);

  // 1) Simulación de la resolución con los nombres finales.
  const indice = new Map(); // ámbito -> Map(nombre -> [enlaces])
  for (const e of actual.enlaces) {
    let m = indice.get(e.ambito);
    if (!m) indice.set(e.ambito, (m = new Map()));
    const n = nombreFinal(e);
    if (!m.has(n)) m.set(n, []);
    m.get(n).push(e);
  }
  const problemas = [];
  for (const m of indice.values())
    for (const [n, l] of m) if (l.length > 1) problemas.push(`dos enlaces con el nombre «${n}» en el mismo ámbito (línea ${l[0].id.loc.start.line})`);
  for (const o of actual.ocurrencias) {
    if (o.declaracion) continue;
    const n = o.enlace ? nombreFinal(o.enlace) : o.nombre;
    let s = o.ambito, hallado = null;
    while (s) {
      const l = indice.get(s)?.get(n);
      if (l) { hallado = l[0]; break; }
      s = s.parent;
    }
    if (hallado !== o.enlace) {
      const que = o.enlace ? `«${o.enlace.nombre}» → «${n}»` : `la global «${n}»`;
      problemas.push(`captura en la línea ${o.nodo.loc.start.line}: ${que} resolvería a ${hallado ? `otro enlace (línea ${hallado.id.loc.start.line})` : 'una global'}`);
    }
  }
  if (problemas.length) throw new Error(`${f}:\n    ` + [...new Set(problemas)].slice(0, 20).join('\n    '));

  // 2) Empalmes.
  const cambios = [];
  const hechos = new Set();
  const externoNuevo = (esp) => {
    const n = nombreDe(esp.tipo === 'import' ? esp.nodo.imported : esp.tipo === 'reexport' ? esp.nodo.local : esp.nodo.exported);
    if (esp.tipo === 'import' || esp.tipo === 'reexport') return exportes.get(resolverModulo(f, esp.fuente))?.get(n) ?? n;
    return exportes.get(f)?.get(n) ?? n;
  };
  for (const esp of actual.especificadores) {
    const nodo = esp.nodo;
    if (esp.tipo === 'import-otro' || esp.tipo === 'export-decl') continue; // el local se trata como ocurrencia normal
    const localNodo = nodo.local;
    const externoNodo = esp.tipo === 'import' ? nodo.imported : nodo.exported;
    const ocu = actual.ocurrencias.find((o) => o.nodo === localNodo);
    const localViejo = localNodo.name;
    const localNuevo = esp.tipo === 'reexport' ? localViejo : ocu?.enlace ? nombreFinal(ocu.enlace) : localViejo;
    if (ocu) hechos.add(ocu.nodo);
    if (esp.tipo === 'reexport') {
      const nuevo = externoNuevo(esp);
      if (nuevo === localViejo) continue;
      cambios.push([localNodo.start, localNodo.end, localNodo.start === nodo.exported.start ? `${nuevo} as ${localViejo}` : nuevo]);
      continue;
    }
    const extViejo = nombreDe(externoNodo);
    const extNuevo = externoNuevo(esp);
    if (extViejo === extNuevo && localViejo === localNuevo) continue;
    const abreviado = localNodo.start === externoNodo.start;
    if (abreviado) {
      const texto = extNuevo === localNuevo ? localNuevo : esp.tipo === 'import' ? `${extNuevo} as ${localNuevo}` : `${localNuevo} as ${extNuevo}`;
      cambios.push([localNodo.start, localNodo.end, texto]);
    } else {
      if (localViejo !== localNuevo) cambios.push([localNodo.start, localNodo.end, localNuevo]);
      if (extViejo !== extNuevo) {
        if (externoNodo.type !== 'Identifier') throw new Error(`${f}: export con nombre de cadena`);
        cambios.push([externoNodo.start, externoNodo.end, extNuevo]);
      }
    }
  }
  for (const o of actual.ocurrencias) {
    if (!o.enlace || hechos.has(o.nodo)) continue;
    const nuevo = nombreFinal(o.enlace);
    if (nuevo === o.nombre) continue;
    let texto = nuevo;
    // Propiedad abreviada ({x} o {x = 1}): conserva la clave.
    const p = o.padre;
    let inicio = o.nodo.start;
    if (p.type === 'ObjectProperty' && p.shorthand && o.clave === 'value') texto = `${p.key.name}: ${nuevo}`;
    if (p.type === 'AssignmentPattern' && o.clave === 'left') {
      const prop = buscarPropiedadAbreviada(actual.ast, p);
      if (prop) texto = `${prop.key.name}: ${nuevo}`;
    }
    // Y al revés: {icon: e} con e -> icon pasa a la forma abreviada {icon} (también {icon: e = 1}).
    const prop = p.type === 'ObjectProperty' && o.clave === 'value' ? p : p.type === 'AssignmentPattern' && o.clave === 'left' && o.abuelo?.type === 'ObjectProperty' && o.abuelo.value === p ? o.abuelo : null;
    if (prop && !prop.shorthand && !prop.computed && prop.key.type === 'Identifier' && prop.key.name === nuevo && nuevo !== '__proto__') inicio = prop.key.start;
    cambios.push([inicio, o.nodo.end, texto]);
  }
  if (!cambios.length) return actual.codigo;
  cambios.sort((a, b) => a[0] - b[0]);
  const trozos = [];
  let pos = 0;
  for (const [a, b, t] of cambios) {
    if (a < pos) throw new Error(`${f}: empalmes solapados en ${a}`);
    trozos.push(actual.codigo.slice(pos, a), t);
    pos = b;
  }
  trozos.push(actual.codigo.slice(pos));
  return trozos.join('');
}

function buscarPropiedadAbreviada(ast, patron) {
  ast._abreviadas ??= (() => {
    const m = new Map();
    traverse(ast, {
      ObjectProperty(p) {
        if (p.node.shorthand && p.node.value.type === 'AssignmentPattern') m.set(p.node.value, p.node);
      },
    });
    return m;
  })();
  return ast._abreviadas.get(patron);
}

// Forma canónica: cada identificador de variable se sustituye por el índice de su enlace (o su
// nombre si es global). Dos códigos con la misma forma son equivalentes salvo nombres.
function formaCanonica(a) {
  return a.ocurrencias.map((o) => (o.enlace ? '#' + o.enlace.idx : 'g:' + o.nombre)).join(' ');
}

// ---------------------------------------------------------------- órdenes

async function aplicar(rutaMapa, seco) {
  const mapa = cargarMapa(rutaMapa);
  const area = mapa._area ?? 'src/ui';
  const todos = listarJs(SRC).map(rel);
  const espacios = modulosConEspacio(todos);
  const { plan, exportes, errores } = planificar(mapa, espacios);
  if (errores.length) throw new Error('Errores en el mapa:\n  ' + errores.join('\n  '));
  const resumen = [];
  for (const f of todos) {
    const enArea = f === area || f.startsWith(area + '/');
    const codigo = fs.readFileSync(abs(f), 'utf8');
    const importaCambios = [...exportes].some(([m, t]) => t.size && codigo.includes(path.basename(m)));
    if (!plan.has(f) && !importaCambios) continue;
    const actual = analizarCodigo(codigo);
    let base = plan.get(f)?.base ?? null;
    let deseados = plan.get(f)?.deseados ?? new Map();
    if (enArea) {
      if (!base) { const t = leerBase(mapa, f); base = t != null ? analizarCodigo(t) : null; }
      if (base) deseados = deseadosDeImports(f, base, deseados, exportes);
    } else base = plan.get(f)?.base ?? null;
    const nuevo = reescribir(f, actual, base, deseados, exportes);
    if (nuevo === codigo) continue;
    const despues = analizarCodigo(nuevo);
    if (formaCanonica(despues) !== formaCanonica(actual)) throw new Error(`${f}: la forma canónica cambia tras renombrar (captura no detectada)`);
    const formateado = await prettier.format(nuevo, OPCIONES_PRETTIER);
    if (formaCanonica(analizarCodigo(formateado)) !== formaCanonica(actual)) throw new Error(`${f}: prettier cambia la forma`);
    const n = cambiosDeNombre(actual, despues);
    resumen.push(`${f}: ${n} enlaces renombrados${enArea ? '' : ' (fuera del área: solo imports)'}`);
    if (!seco) fs.writeFileSync(abs(f), formateado);
  }
  console.log(resumen.length ? resumen.join('\n') : 'Nada que cambiar.');
  for (const [m, t] of exportes) if (t.size) console.log(`exports renombrados en ${m}: ${[...t].map(([a, b]) => `${a}→${b}`).join(', ')}`);
}

function cambiosDeNombre(a, b) {
  let n = 0;
  for (let i = 0; i < a.enlaces.length; i++) if (a.enlaces[i].nombre !== b.enlaces[i]?.nombre) n++;
  return n;
}

// Lista los enlaces de un fichero con su clave más corta, para escribir el mapa.
function listar(rutaMapa, f, todosLosEnlaces) {
  const mapa = cargarMapa(rutaMapa);
  const texto = leerBase(mapa, f);
  if (texto == null) throw new Error(`${f} no está en ${mapa._base}`);
  const base = analizarCodigo(texto);
  const actual = analizarCodigo(fs.readFileSync(abs(f), 'utf8'));
  const deseados = new Map();
  for (const [clave, nuevo] of Object.entries(mapa[f] || {})) for (const idx of resolverClave(base, clave)) deseados.set(idx, nuevo);
  const lineas = actual.codigo.split('\n');
  let pend = 0;
  for (const e of base.enlaces) {
    const act = actual.enlaces[e.idx];
    const nombre = deseados.get(e.idx) ?? act?.nombre ?? e.nombre;
    const revisado = deseados.has(e.idx) || act?.nombre !== e.nombre;
    if (!todosLosEnlaces && (revisado || !pareceMinificado(e.nombre))) continue;
    pend++;
    const clave = claveSugerida(base, e);
    const lin = act ? act.id.loc.start.line : e.id.loc.start.line;
    console.log(`${JSON.stringify(clave).padEnd(28)} ${e.tipo.padEnd(7)} ${nombre.padEnd(14)} L${String(lin).padEnd(5)} ${(lineas[lin - 1] || '').trim().slice(0, 110)}`);
  }
  console.error(`${pend} enlaces pendientes en ${f}`);
}

function cadenaDeAnclas(e) {
  const r = [];
  let p = e.b.path;
  if (p.isFunctionDeclaration() || p.isClassDeclaration() || p.isVariableDeclarator()) p = p.parentPath;
  for (; p; p = p.parentPath) {
    const n = p.node;
    if ((n.type === 'FunctionDeclaration' || n.type === 'ClassDeclaration') && n.id) r.unshift(n.id.name);
    else if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init) r.unshift(n.id.name);
    else if (/^(ObjectMethod|ClassMethod|ObjectProperty|ClassProperty)$/.test(n.type) && !n.computed && n.key?.type === 'Identifier') r.unshift('.' + n.key.name);
  }
  return r;
}

function claveSugerida(base, e) {
  const anclas = cadenaDeAnclas(e);
  const prueba = (c) => {
    try {
      const r = resolverClave(base, c);
      return r.length === 1 && r[0] === e.idx;
    } catch {
      return false;
    }
  };
  const opciones = [e.nombre];
  for (let i = anclas.length - 1; i >= 0; i--) opciones.push(`${anclas[i]}/${e.nombre}`);
  for (let i = anclas.length - 1; i >= 1; i--) opciones.push(`${anclas[0]}/${anclas[i]}/${e.nombre}`);
  if (anclas.length) opciones.push(`${anclas.join('/')}/${e.nombre}`);
  for (const c of opciones) if (prueba(c)) return c;
  const pref = [...anclas];
  while (true) {
    try {
      const r = rangoDeAnclas(base, pref, e.nombre);
      const cand = base.enlaces.filter((x) => x.nombre === e.nombre && x.id.start >= r[0] && x.id.start < r[1]);
      const k = cand.indexOf(e) + 1;
      const c = [...pref, `${e.nombre}#${k}`].join('/');
      if (k && prueba(c)) return c;
    } catch {}
    if (!pref.length) break;
    pref.pop();
  }
  return '?';
}

// Porcentaje de enlaces propios legibles (sin contar imports) en el área.
function medir(rutaMapa) {
  const mapa = cargarMapa(rutaMapa);
  const area = mapa._area ?? 'src/ui';
  let total = 0, legibles = 0, imp = 0, impLeg = 0;
  const filas = [];
  for (const f of listarJs(abs(area)).map(rel)) {
    const texto = leerBase(mapa, f);
    const base = texto != null ? analizarCodigo(texto) : null;
    const actual = analizarCodigo(fs.readFileSync(abs(f), 'utf8'));
    const deseados = new Map();
    if (base) for (const [clave, nuevo] of Object.entries(mapa[f] || {})) for (const idx of resolverClave(base, clave)) deseados.set(idx, nuevo);
    let t = 0, l = 0;
    for (const e of actual.enlaces) {
      const orig = base?.enlaces[e.idx]?.nombre ?? e.nombre;
      const ok = deseados.has(e.idx) || e.nombre !== orig || !pareceMinificado(orig);
      if (e.tipo === 'module') { imp++; if (ok) impLeg++; continue; }
      t++;
      if (ok) l++;
    }
    total += t;
    legibles += l;
    filas.push(`${f.padEnd(34)} ${String(l).padStart(5)}/${String(t).padEnd(5)} ${t ? ((100 * l) / t).toFixed(0) : 100}%`);
  }
  console.log(filas.join('\n'));
  console.log(`TOTAL enlaces propios legibles: ${legibles}/${total} = ${((100 * legibles) / total).toFixed(1)}%  ·  imports legibles: ${impLeg}/${imp}`);
}

// ---------------------------------------------------------------- main

const args = process.argv.slice(2);
const rutaMapa = args.find((a) => a.endsWith('.json'));
if (!rutaMapa) {
  console.error('Uso: node tools/renombrar.mjs <mapa.json> [--seco | --listar <fichero> [--todos] | --medir]');
  process.exit(2);
}
try {
  if (args.includes('--listar')) listar(path.resolve(rutaMapa), args[args.indexOf('--listar') + 1], args.includes('--todos'));
  else if (args.includes('--medir')) medir(path.resolve(rutaMapa));
  else await aplicar(path.resolve(rutaMapa), args.includes('--seco'));
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
