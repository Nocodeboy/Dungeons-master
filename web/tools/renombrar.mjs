// Renombrado consciente de ámbitos a partir de un mapa JSON (babel: parser + traverse).
//
// Uso (desde web/):
//   node tools/renombrar.mjs renombres/actores.json [--seco] [--estricto] [--area src/actors/] [--solo a.js,b.js]
//   node tools/renombrar.mjs --listar src/actors/anims.js      (árbol de ámbitos con sus enlaces)
//   node tools/renombrar.mjs --listar src/actors/anims.js --detalle [--todos]
//                         (una línea por enlace con aspecto minificado: su clave exacta y su código)
//
// Formato del mapa: { "src/actors/anims.js": { "Hb": "BONE_ALIASES", "play/e": "name", ... }, ... }
//   - "nombre"            enlace del ámbito del programa (nivel superior del archivo).
//   - "a/b/nombre"        enlace local: «a», «b»… son regiones con nombre (funciones, clases, métodos,
//                         funciones asignadas a variables o propiedades y declaradores de nivel
//                         superior) anidadas una dentro de otra; el enlace se busca en todos los
//                         ámbitos cuya región con nombre más cercana es la última (incluye los
//                         callbacks anónimos de dentro). Si hay varios, se renombran todos.
//   - "a/nombre#2"        solo el segundo de esos enlaces (orden de aparición en el código).
//   Todas las claves se resuelven sobre el código ANTES de aplicar el mapa (nombres viejos).
//
// Exports: si un enlace renombrado se exporta, cambia el nombre exportado y se actualizan los
// imports y reexports de todo src/. En los archivos de --area (por defecto, los del mapa) también
// se renombra el enlace local importado; fuera del área solo cambia la línea del import
// (`import { nuevo as viejo }`). Los módulos que son espacios de nombres (destino de `import * as`,
// de `import()` o cualquier `index.js`) conservan sus nombres exportados: renombrar uno es un error.
//
// Comprobación: tras empalmar el texto se vuelve a analizar cada archivo y se exige que cada
// identificador resuelva al mismo enlace (o al mismo global) que antes. Después se formatea con
// prettier (las mismas opciones que tools/05-partir-modulos.mjs). Con --seco no se escribe nada.
// Con --solo se aplican solo las entradas de esos archivos (rutas relativas a web/, separadas por
// comas): sirve para ir por tandas, porque las claves de cada archivo usan sus nombres de partida.
import fs from 'node:fs';
import path from 'node:path';
import * as prettier from 'prettier';
import * as t from '@babel/types';
import { analizar, esPosicionPropiedad } from './lib/ast.mjs';
import { traverse } from './lib/ambitos.mjs';

const WEB = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(WEB, 'src');
const args = process.argv.slice(2);
const opcion = (n) => args.includes(n);
const valor = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : null;
};
const PRETTIER = { parser: 'babel', printWidth: 110, singleQuote: true };
const RESERVADAS = new Set(
  ('break case catch class const continue debugger default delete do else enum export extends false finally ' +
    'for function if import in instanceof new null return super switch this throw true try typeof var void while ' +
    'with yield let static implements interface package private protected public await arguments eval undefined NaN Infinity')
    .split(' '),
);

// ---------------------------------------------------------------------------------------------
// Regiones con nombre

function nombreClave(k, computed) {
  if (computed) return null;
  if (t.isIdentifier(k)) return k.name;
  if (t.isStringLiteral(k)) return k.value;
  if (t.isNumericLiteral(k)) return String(k.value);
  if (t.isPrivateName(k)) return '#' + k.id.name;
  return null;
}

function nombreRegion(p) {
  const n = p.node;
  if (p.isFunctionDeclaration() || p.isClassDeclaration()) return n.id?.name ?? null;
  if (p.isObjectMethod() || p.isClassMethod() || p.isClassPrivateMethod()) return nombreClave(n.key, n.computed);
  if (p.isFunctionExpression() || p.isArrowFunctionExpression() || p.isClassExpression()) {
    const par = p.parentPath;
    if (par.isVariableDeclarator() && par.node.init === n && t.isIdentifier(par.node.id)) return par.node.id.name;
    if (par.isAssignmentExpression() && par.node.right === n) {
      const l = par.node.left;
      if (t.isIdentifier(l)) return l.name;
      if (t.isMemberExpression(l) && !l.computed) return l.property.name;
    }
    if ((par.isObjectProperty() || par.isClassProperty()) && par.node.value === n) return nombreClave(par.node.key, par.node.computed);
    return n.id?.name ?? null;
  }
  if (p.isVariableDeclarator() && t.isIdentifier(n.id)) {
    const decl = p.parentPath;
    const nivel = decl.parentPath;
    const arriba = nivel?.isProgram() || (nivel?.isExportNamedDeclaration() && nivel.parentPath.isProgram());
    const fn = n.init && (t.isFunction(n.init) || t.isClass(n.init));
    if (arriba && !fn) return n.id.name;
  }
  return null;
}

// Región con nombre que contiene a p (incluida p si es una).
function regionDe(p, estricta = false) {
  let q = estricta ? p.parentPath : p;
  while (q) {
    if (q.isProgram()) return q;
    if (nombreRegion(q) != null) return q;
    q = q.parentPath;
  }
  return null;
}

// ---------------------------------------------------------------------------------------------
// Análisis de un archivo

function analizarArchivo(ruta) {
  const codigo = fs.readFileSync(ruta, 'utf8');
  const ast = analizar(codigo);
  let programa = null;
  const regiones = []; // paths con nombre
  const ambitos = new Set();
  const importaciones = []; // {decl, fuente}
  const reexportaciones = []; // ExportNamedDeclaration con source
  const especExport = []; // ExportSpecifier locales (sin source)
  const declExportadas = new Set(); // nodos identificador exportados por declaración
  const dinamicos = []; // fuentes de import()
  const todos = []; // fuentes de export * from
  traverse(ast, {
    enter(p) {
      if (p.isProgram()) programa = p;
      if (p.scope) ambitos.add(p.scope);
      if (!p.isProgram() && nombreRegion(p) != null) regiones.push(p);
      if (p.isImportDeclaration()) importaciones.push({ decl: p.node, fuente: p.node.source.value });
      if (p.isExportNamedDeclaration()) {
        if (p.node.source) reexportaciones.push(p.node);
        else {
          for (const s of p.node.specifiers) especExport.push(s);
          const d = p.node.declaration;
          if (d) {
            if (d.id) declExportadas.add(d.id);
            if (t.isVariableDeclaration(d)) for (const v of d.declarations) for (const id of Object.values(t.getBindingIdentifiers(v.id))) declExportadas.add(id);
          }
        }
      }
      if (p.isExportAllDeclaration()) todos.push(p.node.source.value);
      if (p.isImport() && p.parentPath.isCallExpression()) {
        const a = p.parent.arguments[0];
        if (t.isStringLiteral(a)) dinamicos.push(a.value);
        else dinamicos.push(null);
      }
    },
  });
  return { ruta, codigo, ast, programa, regiones, ambitos, importaciones, reexportaciones, especExport, declExportadas, dinamicos, todos };
}

function nodosDelEnlace(b) {
  const nodos = new Set([b.identifier]);
  for (const r of b.referencePaths) nodos.add(r.node);
  for (const v of b.constantViolations) {
    const ids = v.getBindingIdentifiers ? v.getBindingIdentifiers(true) : {};
    for (const lista of Object.values(ids)) for (const id of [].concat(lista)) if (id && id.name === b.identifier.name) nodos.add(id);
    if (v.node.type === 'UpdateExpression' && v.node.argument.type === 'Identifier') nodos.add(v.node.argument);
    if (v.node.type === 'AssignmentExpression' && v.node.left.type === 'Identifier' && v.node.left.name === b.identifier.name) nodos.add(v.node.left);
  }
  return nodos;
}

function enlacesDe(info) {
  const out = [];
  for (const s of info.ambitos) for (const b of Object.values(s.bindings)) out.push(b);
  return out;
}

// Resuelve una clave del mapa a una lista de enlaces de babel.
function resolverClave(info, clave) {
  let [cuerpo, idx] = clave.split('#');
  const partes = cuerpo.split('/');
  const nombre = partes.pop();
  let candidatas = new Set([info.programa]);
  for (const seg of partes) {
    const sig = new Set(info.regiones.filter((r) => nombreRegion(r) === seg && candidatas.has(regionDe(r, true))));
    if (!sig.size) return { error: `no hay región «${seg}» en ${partes.join('/')}` };
    candidatas = sig;
  }
  let enlaces;
  if (!partes.length) {
    const b = info.programa.scope.bindings[nombre];
    enlaces = b ? [b] : [];
  } else {
    enlaces = enlacesDe(info).filter((b) => b.identifier.name === nombre && candidatas.has(regionDe(b.scope.path)));
    // Un enlace de la propia región con nombre (p. ej. la función declarada dentro de otra).
    enlaces.sort((a, b) => a.identifier.start - b.identifier.start);
  }
  if (!enlaces.length) return { error: `no hay enlace «${nombre}»` };
  if (idx) {
    const k = Number(idx);
    if (!(k >= 1 && k <= enlaces.length)) return { error: `«#${idx}» fuera de rango (hay ${enlaces.length})` };
    enlaces = [enlaces[k - 1]];
  }
  return { enlaces };
}

// ---------------------------------------------------------------------------------------------
// Firma de resolución: a qué enlace apunta cada identificador (para comprobar después).

function esNombreDeInterfaz(p) {
  // Nombres de import/export que no son enlaces.
  const par = p.parentPath;
  if (par.isImportSpecifier() && p.key === 'imported') return true;
  if (par.isExportSpecifier() && p.key === 'exported') return true;
  if (par.isExportSpecifier() && par.parentPath.node.source) return true;
  if (par.isExportNamespaceSpecifier() || par.isExportDefaultSpecifier()) return true;
  return false;
}

function firmaResolucion(ast) {
  const ids = [];
  const pos = new Map();
  traverse(ast, {
    Identifier(p) {
      if (esPosicionPropiedad(p.parent, p.key) || esNombreDeInterfaz(p)) return;
      pos.set(p.node, ids.length);
      ids.push(p);
    },
  });
  return ids.map((p) => {
    const b = p.scope.getBinding(p.node.name);
    if (!b) return 'g:' + p.node.name;
    const k = pos.get(b.identifier);
    return k == null ? 'x:' + p.node.name : 'b:' + k;
  });
}

// ---------------------------------------------------------------------------------------------
// Utilidades de rutas

function resolverImport(desde, fuente) {
  if (!fuente.startsWith('.')) return null;
  let r = path.resolve(path.dirname(desde), fuente);
  if (!r.endsWith('.js') && fs.existsSync(r + '.js')) r += '.js';
  return r;
}

function archivosSrc(dir = SRC, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) archivosSrc(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// --listar

function listar(ruta) {
  const info = analizarArchivo(path.resolve(WEB, ruta));
  const porRegion = new Map();
  for (const b of enlacesDe(info)) {
    const r = regionDe(b.scope.path);
    if (!porRegion.has(r)) porRegion.set(r, []);
    porRegion.get(r).push(b);
  }
  const rutaRegion = (r) => {
    const segs = [];
    for (let q = r; q && !q.isProgram(); q = regionDe(q, true)) segs.unshift(nombreRegion(q));
    return segs.join('/');
  };
  const regiones = [info.programa, ...info.regiones];
  if (opcion('--detalle')) {
    // Una línea por enlace: clave exacta para el mapa, línea y código de esa línea.
    const lineas = info.codigo.split('\n');
    const minificado = (n) => opcion('--todos') || /^[A-Za-z_$][\w$]?$|^[A-Za-z_$]\d[\w$]?$|^[A-Z][a-z]$|^[a-z][A-Z]$/.test(n);
    for (const r of regiones) {
      const bs = (porRegion.get(r) || []).filter((b) => b.kind !== 'module');
      const ruta = r.isProgram() ? '' : rutaRegion(r) + '/';
      const cuenta = {};
      for (const b of bs.sort((a, b) => a.identifier.start - b.identifier.start)) {
        const n = b.identifier.name;
        const tot = bs.filter((x) => x.identifier.name === n).length;
        cuenta[n] = (cuenta[n] || 0) + 1;
        if (!minificado(n)) continue;
        const linea = info.codigo.slice(0, b.identifier.start).split('\n').length;
        const clave = ruta + n + (tot > 1 ? '#' + cuenta[n] : '');
        console.log(`${clave.padEnd(28)} l.${String(linea).padEnd(5)}${lineas[linea - 1].trim().slice(0, 100)}`);
      }
    }
    return;
  }
  for (const r of regiones) {
    const bs = porRegion.get(r);
    if (!bs) continue;
    const linea = info.codigo.slice(0, r.node.start).split('\n').length;
    const nombres = bs
      .sort((a, b) => a.identifier.start - b.identifier.start)
      .map((b) => b.identifier.name + (b.kind === 'module' ? '(imp)' : ''));
    console.log(`${(rutaRegion(r) || '(programa)').padEnd(40)} l.${String(linea).padEnd(5)} ${nombres.join(' ')}`);
  }
}

// ---------------------------------------------------------------------------------------------
// Propiedades `{ a: a }` → `{ a }` (no se toca `__proto__`, que no es equivalente en literales).

function abreviar(codigo, ast) {
  const cambios = [];
  traverse(ast, {
    ObjectProperty(p) {
      const n = p.node;
      if (n.shorthand || n.computed || !t.isIdentifier(n.key) || n.key.name === '__proto__') return;
      const v = t.isAssignmentPattern(n.value) ? n.value.left : n.value;
      if (t.isIdentifier(v) && v.name === n.key.name) cambios.push([n.key.start, v.end, v.name]);
    },
  });
  if (!cambios.length) return codigo;
  cambios.sort((a, b) => a[0] - b[0]);
  let pos = 0;
  const trozos = [];
  for (const [a, b, txt] of cambios) {
    trozos.push(codigo.slice(pos, a), txt);
    pos = b;
  }
  trozos.push(codigo.slice(pos));
  return trozos.join('');
}

// ---------------------------------------------------------------------------------------------
// Aplicación del mapa

async function aplicar(rutaMapa) {
  const mapa = JSON.parse(fs.readFileSync(path.resolve(WEB, rutaMapa), 'utf8'));
  const solo = valor('--solo')?.split(',').map((f) => path.resolve(WEB, f));
  if (solo) for (const k of Object.keys(mapa)) if (!solo.includes(path.resolve(WEB, k))) delete mapa[k];
  const area = valor('--area');
  const enArea = (abs) => (area ? abs.startsWith(path.resolve(WEB, area)) : Object.keys(mapa).some((k) => path.resolve(WEB, k) === abs));
  const avisos = [];
  const errores = [];

  // Todos los archivos de src (los analizamos una vez).
  const infos = new Map();
  const info = (abs) => {
    if (!infos.has(abs)) infos.set(abs, analizarArchivo(abs));
    return infos.get(abs);
  };
  const todos = archivosSrc();
  // Módulos protegidos (espacios de nombres).
  const protegidos = new Set(todos.filter((f) => path.basename(f) === 'index.js'));
  for (const f of todos) {
    const i = info(f);
    for (const { decl, fuente } of i.importaciones) {
      if (decl.specifiers.some((s) => t.isImportNamespaceSpecifier(s))) {
        const r = resolverImport(f, fuente);
        if (r) protegidos.add(r);
      }
    }
    for (const fu of i.dinamicos) if (fu) {
      const r = resolverImport(f, fu);
      if (r) protegidos.add(r);
    }
    for (const fu of i.todos) {
      const r = resolverImport(f, fu);
      if (r) protegidos.add(r);
    }
  }

  // Por archivo: enlace -> nombre nuevo.
  const locales = new Map(); // abs -> Map(binding -> nuevo)
  const locDe = (abs) => {
    if (!locales.has(abs)) locales.set(abs, new Map());
    return locales.get(abs);
  };
  for (const [rel, renombres] of Object.entries(mapa)) {
    const abs = path.resolve(WEB, rel);
    if (!fs.existsSync(abs)) {
      errores.push(`${rel}: no existe`);
      continue;
    }
    const i = info(abs);
    for (const [clave, nuevo] of Object.entries(renombres)) {
      if (!/^[A-Za-z_$][\w$]*$/.test(nuevo) || RESERVADAS.has(nuevo)) {
        errores.push(`${rel}: «${clave}» → «${nuevo}» no es un nombre válido`);
        continue;
      }
      const r = resolverClave(i, clave);
      if (r.error) {
        (opcion('--estricto') ? errores : avisos).push(`${rel}: «${clave}»: ${r.error}`);
        continue;
      }
      for (const b of r.enlaces) {
        const previo = locDe(abs).get(b);
        if (previo && previo !== nuevo) errores.push(`${rel}: «${clave}» tiene dos nombres (${previo}, ${nuevo})`);
        if (b.identifier.name !== nuevo) locDe(abs).set(b, nuevo);
      }
    }
  }

  // Exports que cambian de nombre.
  const exportsRenombrados = new Map(); // abs -> Map(viejo -> nuevo)
  for (const [abs, loc] of locales) {
    const i = info(abs);
    for (const [b, nuevo] of loc) {
      if (b.scope !== i.programa.scope) continue;
      const viejo = b.identifier.name;
      const porDecl = i.declExportadas.has(b.identifier);
      const porEspec = i.especExport.filter((s) => s.local.name === viejo);
      if (!porDecl && !porEspec.length) continue;
      const prot = protegidos.has(abs);
      if (porDecl && prot) {
        errores.push(`${path.relative(WEB, abs)}: «${viejo}» se exporta por declaración en un espacio de nombres`);
        continue;
      }
      for (const s of porEspec) {
        const corta = s.exported.name === viejo && s.exported.start === s.local.start;
        if (corta && !prot) {
          if (!exportsRenombrados.has(abs)) exportsRenombrados.set(abs, new Map());
          exportsRenombrados.get(abs).set(viejo, nuevo);
        }
      }
      if (porDecl) {
        if (!exportsRenombrados.has(abs)) exportsRenombrados.set(abs, new Map());
        exportsRenombrados.get(abs).set(viejo, nuevo);
      }
    }
  }

  // Empalmes por archivo.
  const empalmes = new Map(); // abs -> [[ini, fin, texto]]
  const emp = (abs) => {
    if (!empalmes.has(abs)) empalmes.set(abs, []);
    return empalmes.get(abs);
  };
  // Importadores: cambian el nombre importado; dentro del área, también el local si coincidía.
  const importadoRenombrado = new Map(); // ImportSpecifier/ExportSpecifier(reexport) -> nombre nuevo del import
  for (const f of todos) {
    const i = info(f);
    for (const { decl, fuente } of i.importaciones) {
      const r = resolverImport(f, fuente);
      const ren = r && exportsRenombrados.get(r);
      if (!ren) continue;
      for (const s of decl.specifiers) {
        if (!t.isImportSpecifier(s)) continue;
        const imp = nombreClave(s.imported);
        if (!ren.has(imp)) continue;
        importadoRenombrado.set(s, ren.get(imp));
        const corta = s.local.start === s.imported.start;
        if (corta && enArea(f)) {
          const b = i.programa.scope.bindings[s.local.name];
          if (!locDe(f).has(b)) locDe(f).set(b, ren.get(imp));
        }
      }
    }
    for (const decl of i.reexportaciones) {
      const r = resolverImport(f, decl.source.value);
      const ren = r && exportsRenombrados.get(r);
      if (!ren) continue;
      for (const s of decl.specifiers) if (t.isExportSpecifier(s) && ren.has(s.local.name)) importadoRenombrado.set(s, ren.get(s.local.name));
    }
  }

  const archivosTocados = new Set([...locales.keys()].filter((f) => locales.get(f).size));
  for (const s of importadoRenombrado.keys()) for (const f of todos) {
    const i = info(f);
    if (i.importaciones.some(({ decl }) => decl.specifiers.includes(s)) || i.reexportaciones.some((d) => d.specifiers.includes(s))) archivosTocados.add(f);
  }

  for (const abs of archivosTocados) {
    const i = info(abs);
    const loc = locDe(abs);
    const prot = protegidos.has(abs);
    const especiales = new Set(); // nodos cubiertos por el empalme de un especificador
    // Especificadores de import.
    for (const { decl } of i.importaciones) {
      for (const s of decl.specifiers) {
        if (!t.isImportSpecifier(s)) continue;
        const b = i.programa.scope.bindings[s.local.name];
        const nuevoLocal = (b && loc.get(b)) || s.local.name;
        const nuevoImp = importadoRenombrado.get(s) || nombreClave(s.imported);
        if (nuevoLocal === s.local.name && !importadoRenombrado.has(s)) continue;
        especiales.add(s.local);
        emp(abs).push([s.start, s.end, nuevoImp === nuevoLocal ? nuevoLocal : `${nuevoImp} as ${nuevoLocal}`]);
      }
    }
    // Reexportaciones.
    for (const decl of i.reexportaciones) {
      for (const s of decl.specifiers) {
        if (!importadoRenombrado.has(s)) continue;
        const nuevo = importadoRenombrado.get(s);
        emp(abs).push([s.start, s.end, `${nuevo} as ${s.exported.name}`]);
      }
    }
    // Exports locales.
    for (const s of i.especExport) {
      const b = i.programa.scope.bindings[s.local.name];
      const nuevo = b && loc.get(b);
      if (!nuevo) continue;
      especiales.add(s.local);
      const corta = s.exported.start === s.local.start;
      const exportado = corta && !prot ? nuevo : s.exported.name;
      emp(abs).push([s.start, s.end, exportado === nuevo ? nuevo : `${nuevo} as ${exportado}`]);
    }
    // Propiedades abreviadas.
    const abreviadas = new Map();
    traverse(i.ast, {
      ObjectProperty(p) {
        if (!p.node.shorthand) return;
        const v = t.isAssignmentPattern(p.node.value) ? p.node.value.left : p.node.value;
        if (t.isIdentifier(v)) abreviadas.set(v, p.node.key.name);
      },
    });
    for (const [b, nuevo] of loc) {
      for (const nodo of nodosDelEnlace(b)) {
        if (especiales.has(nodo)) continue;
        const clave = abreviadas.get(nodo);
        emp(abs).push([nodo.start, nodo.end, clave !== undefined ? `${clave}: ${nuevo}` : nuevo]);
      }
    }
  }

  // Aplicar, comprobar y formatear.
  let cambiados = 0;
  for (const [abs, cambios] of empalmes) {
    const i = info(abs);
    cambios.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const unicos = [];
    for (const c of cambios) {
      const u = unicos[unicos.length - 1];
      if (u && u[0] === c[0] && u[1] === c[1]) {
        if (u[2] !== c[2]) errores.push(`${path.relative(WEB, abs)}: empalmes distintos en ${c[0]} (${u[2]} / ${c[2]})`);
        continue;
      }
      if (u && c[0] < u[1]) {
        errores.push(`${path.relative(WEB, abs)}: empalmes solapados en ${c[0]}`);
        continue;
      }
      unicos.push(c);
    }
    let pos = 0;
    const trozos = [];
    for (const [a, b, txt] of unicos) {
      trozos.push(i.codigo.slice(pos, a), txt);
      pos = b;
    }
    trozos.push(i.codigo.slice(pos));
    let nuevo = trozos.join('');
    let astNuevo;
    try {
      astNuevo = analizar(nuevo);
    } catch (e) {
      errores.push(`${path.relative(WEB, abs)}: el resultado no se puede analizar: ${e.message}`);
      continue;
    }
    const antes = firmaResolucion(i.ast);
    const comprobar = (ast, fase) => {
      const despues = firmaResolucion(ast);
      if (antes.length !== despues.length) errores.push(`${path.relative(WEB, abs)}: ${fase}: cambia el número de identificadores (${antes.length} → ${despues.length})`);
      else {
        const k = antes.findIndex((x, j) => x !== despues[j]);
        if (k >= 0) errores.push(`${path.relative(WEB, abs)}: ${fase}: el identificador nº ${k} cambia de enlace (${antes[k]} → ${despues[k]}); revisa capturas o sombras`);
      }
    };
    comprobar(astNuevo, 'renombrado');
    // Dentro del área, `{ a: a }` → `{ a }` (y `{ a: a = 1 }` → `{ a = 1 }`): misma semántica.
    if (enArea(abs)) {
      const corto = abreviar(nuevo, astNuevo);
      if (corto !== nuevo) {
        nuevo = corto;
        comprobar(analizar(nuevo), 'abreviado');
      }
    }
    let formateado = nuevo;
    try {
      formateado = await prettier.format(nuevo, PRETTIER);
    } catch (e) {
      errores.push(`${path.relative(WEB, abs)}: prettier: ${e.message.split('\n')[0]}`);
    }
    i.salida = formateado;
    cambiados++;
  }

  for (const a of avisos) console.warn('aviso:', a);
  if (errores.length) {
    for (const e of errores) console.error('error:', e);
    console.error(`${errores.length} errores: no se escribe nada.`);
    process.exit(1);
  }
  const nExports = [...exportsRenombrados.values()].reduce((s, m) => s + m.size, 0);
  if (!opcion('--seco')) for (const [abs] of empalmes) fs.writeFileSync(abs, info(abs).salida);
  const nEnlaces = [...locales.values()].reduce((s, m) => s + m.size, 0);
  console.log(`${opcion('--seco') ? '(seco) ' : ''}${nEnlaces} enlaces renombrados en ${cambiados} archivos; ${nExports} exports con nombre nuevo.`);
  for (const [abs, m] of exportsRenombrados) for (const [v, n] of m) console.log(`  export ${path.relative(WEB, abs)}: ${v} → ${n}`);
}

if (valor('--listar')) listar(valor('--listar'));
else if (args[0] && !args[0].startsWith('--')) await aplicar(args[0]);
else {
  console.error('Uso: node tools/renombrar.mjs <mapa.json> [--seco] [--estricto] [--area src/x/] | --listar <archivo>');
  process.exit(2);
}
