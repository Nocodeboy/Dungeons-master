// Renombrado de identificadores consciente de ámbitos para el código reconstruido de src/.
//
//   node tools/renombrar.mjs renombres/efectos.json [--solo src/vfx/atlas.js] [--area src/vfx,src/audio] [--simular]
//   node tools/renombrar.mjs --listar src/vfx/atlas.js [--todos]
//   node tools/renombrar.mjs --estadisticas src/vfx src/audio
//
// Formato del mapa (JSON): { "src/ruta/archivo.js": { "<dirección>": "nombreNuevo", … }, … }
// (el valor también puede ser una lista de mapas, que se aplican en orden). Los archivos se
// procesan en el orden del JSON y cada mapa se resuelve contra el archivo tal como está antes de
// aplicarlo (todas sus claves a la vez).
//
// Direcciones:
//   "km"            enlace de nivel superior km (también los de bloques del nivel superior)
//   "km:o"          enlace o declarado en la función km (parámetros, variables y bloques internos)
//   "DS>n:i"        enlace i de la función asignada a n dentro de DS
//   "CI.glow:o"     método glow del objeto CI;  "s0.update:t" método update de la clase s0
//   "f>map():t"     función anónima pasada a .map(…) dentro de f
//   "f>fn:t"        otra función anónima (IIFE, valor devuelto…)
//   "…#2"           segunda aparición (en orden de fuente) de un elemento o de un enlace homónimo
//   "*:t"           todos los enlaces llamados t del archivo (prioridad mínima)
// «--listar» imprime las direcciones de un archivo. Una dirección sin «#k» abarca a todos sus homónimos.
//
// Exports: si un enlace exportado con `export { x }` cambia de nombre, cambia el nombre exportado
// (salvo en los index.js, que conservan su nombre público con `export { nuevo as viejo }`) y se
// actualizan los import de todo src/: en los archivos del área (por defecto, las carpetas de los
// archivos del mapa) se renombra también el enlace local; en los demás solo la línea del import
// (`import { nuevo as viejo }`).
//
// Seguridad: tras cada cambio se vuelve a analizar el archivo y se comprueba que cada identificador
// sigue resolviendo al mismo enlace (o al mismo global) que antes; si no, no se escribe nada.
// Volver a aplicar un mapa ya aplicado no hace nada (las claves ya aplicadas se saltan).
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;

const WEB = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(WEB, 'src');

// ───────────────────────── utilidades ─────────────────────────

function analizar(codigo, ruta) {
  try {
    return parse(codigo, { sourceType: 'module' });
  } catch (e) {
    throw new Error(`No se puede analizar ${ruta}: ${e.message}`);
  }
}

// ¿Identificador en posición de nombre de propiedad (no es un enlace)?
function esPropiedad(padre, clave) {
  if (!padre) return false;
  switch (padre.type) {
    case 'MemberExpression':
    case 'OptionalMemberExpression':
      return clave === 'property' && !padre.computed;
    case 'ObjectProperty':
    case 'ObjectMethod':
    case 'ClassMethod':
    case 'ClassPrivateMethod':
    case 'ClassProperty':
    case 'ClassPrivateProperty':
    case 'ClassAccessorProperty':
      return clave === 'key' && !padre.computed;
    case 'PrivateName':
    case 'MetaProperty':
      return true;
    case 'LabeledStatement':
    case 'BreakStatement':
    case 'ContinueStatement':
      return clave === 'label';
    case 'ImportSpecifier':
      return clave === 'imported';
    case 'ExportSpecifier':
    case 'ExportNamespaceSpecifier':
    case 'ExportDefaultSpecifier':
      return clave === 'exported';
    default:
      return false;
  }
}

const RESERVADAS = new Set(
  ('break case catch class const continue debugger default delete do else enum export extends false finally for function if ' +
    'import in instanceof new null return super switch this throw true try typeof var void while with yield let static ' +
    'implements package protected interface private public await arguments eval undefined NaN Infinity').split(' '),
);
const IDENT = /^[A-Za-z_$][\w$]*$/;

// Nombres cortos que se consideran legibles (índices, coordenadas, abreviaturas comunes).
const CORTOS_LEGIBLES = new Set('i j k x y z dx dy dz dt id el ui fx hp ok gl ms db cb fn uv up'.split(' '));
export function pareceMinificado(nombre) {
  if (CORTOS_LEGIBLES.has(nombre)) return false;
  if (nombre.length <= 2) return true;
  return nombre.length === 3 && /\d/.test(nombre);
}

function nombreClave(key, computed) {
  if (computed) return '[]';
  if (key.type === 'Identifier') return key.name;
  if (key.type === 'StringLiteral') return key.value;
  if (key.type === 'NumericLiteral') return String(key.value);
  if (key.type === 'PrivateName') return '%' + key.id.name;
  return '?';
}

// ───────────────────────── direcciones ─────────────────────────

// Nombre del contexto de una expresión (función anónima, objeto o clase) según dónde está.
function nombreContexto(p) {
  const par = p.parent;
  if (!par) return null;
  switch (par.type) {
    case 'VariableDeclarator':
      return par.init === p.node && par.id.type === 'Identifier' ? par.id.name : null;
    case 'AssignmentExpression':
      if (par.right !== p.node) return null;
      if (par.left.type === 'Identifier') return par.left.name;
      if (par.left.type === 'MemberExpression' && !par.left.computed && par.left.property.type === 'Identifier') return par.left.property.name;
      return null;
    case 'ObjectProperty':
      return par.value === p.node ? prefijoObjeto(p.parentPath.parentPath) + nombreClave(par.key, par.computed) : null;
    case 'ClassProperty':
    case 'ClassPrivateProperty':
      return par.value === p.node ? duenoClase(p.parentPath.parentPath.parentPath) + '.' + nombreClave(par.key, par.computed) : null;
    case 'AssignmentPattern':
      return par.right === p.node && par.left.type === 'Identifier' ? par.left.name : null;
    case 'CallExpression':
    case 'NewExpression':
    case 'OptionalCallExpression': {
      if (par.callee === p.node) return null;
      const c = par.callee;
      if (c.type === 'Identifier') return c.name + '()';
      if ((c.type === 'MemberExpression' || c.type === 'OptionalMemberExpression') && !c.computed) return nombreClave(c.property, false) + '()';
      return 'call()';
    }
    default:
      return null;
  }
}
function prefijoObjeto(objPath) {
  const n = nombreContexto(objPath);
  return n && !n.endsWith('()') ? n + '.' : '';
}
function duenoClase(cls) {
  return cls.node.id ? cls.node.id.name : nombreContexto(cls) || 'class';
}
function elementoFuncion(fp) {
  const n = fp.node;
  if (n.type === 'FunctionDeclaration') return n.id ? n.id.name : 'default';
  if (n.type === 'FunctionExpression' && n.id) return n.id.name;
  if (n.type === 'ObjectMethod') return prefijoObjeto(fp.parentPath) + nombreClave(n.key, n.computed);
  if (n.type === 'ClassMethod' || n.type === 'ClassPrivateMethod') return duenoClase(fp.parentPath.parentPath) + '.' + nombreClave(n.key, n.computed);
  return nombreContexto(fp) || 'fn';
}

// Analiza un archivo: funciones con su dirección, enlaces con su dirección y, para cada enlace,
// los identificadores que resuelven a él.
function estudiar(codigo, ruta) {
  const ast = analizar(codigo, ruta);
  const dirFuncion = new Map(); // nodo función -> dirección
  const cuenta = new Map();
  const ambitos = new Set();
  const visitas = []; // {nodo, padre, clave, abuelo, binding|null, nombre}
  let programa = null;
  traverse(ast, {
    Program(p) {
      programa = p.scope;
      ambitos.add(p.scope);
    },
    Scopable(p) {
      ambitos.add(p.scope);
    },
    Function: {
      enter(p) {
        const padre = p.parentPath.getFunctionParent();
        const dirPadre = padre ? dirFuncion.get(padre.node) : '';
        const base = (dirPadre ? dirPadre + '>' : '') + elementoFuncion(p);
        const k = (cuenta.get(base) || 0) + 1;
        cuenta.set(base, k);
        dirFuncion.set(p.node, k > 1 ? `${base}#${k}` : base);
      },
    },
    Identifier(p) {
      const prop = esPropiedad(p.parent, p.key);
      const b = prop ? null : p.scope.getBinding(p.node.name) || null;
      visitas.push({ nodo: p.node, padre: p.parent, clave: p.key, abuelo: p.parentPath.parent, binding: b, nombre: p.node.name, prop });
    },
  });
  // Enlaces y direcciones.
  const enlaces = [];
  for (const sc of ambitos) {
    for (const [nombre, b] of Object.entries(sc.bindings)) {
      if (b.scope !== sc) continue;
      const sp = sc.path;
      const duena = sp.isProgram() ? null : sp.isFunction() ? sp : sp.getFunctionParent();
      const dirDuena = duena ? dirFuncion.get(duena.node) : '';
      enlaces.push({ binding: b, nombre, base: dirDuena ? `${dirDuena}:${nombre}` : nombre, duena: dirDuena, pos: b.identifier.start, nodos: [] });
    }
  }
  enlaces.sort((a, b) => a.pos - b.pos);
  const grupos = new Map();
  for (const e of enlaces) {
    const g = grupos.get(e.base) || [];
    g.push(e);
    grupos.set(e.base, g);
    e.dir = g.length > 1 ? `${e.base}#${g.length}` : e.base;
  }
  const porBinding = new Map(enlaces.map((e) => [e.binding, e]));
  for (const v of visitas) if (v.binding && porBinding.has(v.binding)) porBinding.get(v.binding).nodos.push(v);
  return { ast, enlaces, grupos, porBinding, visitas, programa };
}

// Firma de resolución: para cada identificador (en orden), a qué enlace (ordinal de su
// declaración) o global resuelve. Debe ser idéntica antes y después de renombrar.
function firmaResolucion(est) {
  const ordinal = new Map();
  est.visitas.forEach((v, i) => {
    if (!ordinal.has(v.nodo)) ordinal.set(v.nodo, i);
  });
  return est.visitas.map((v) => (v.prop ? '.' : v.binding ? 'b' + ordinal.get(v.binding.identifier) : 'g:' + v.nombre));
}

// ───────────────────────── empalme de texto ─────────────────────────

// Texto que sustituye a un identificador del enlace renombrado según su contexto.
function sustituto(v, nuevo, opciones) {
  const { padre, clave, abuelo } = v;
  // `{ clave: viejo }` → `{ clave }` (y `{ clave: viejo = 1 }` → `{ clave = 1 }`) cuando el nombre nuevo coincide.
  const coincide = (p) => p?.type === 'ObjectProperty' && !p.shorthand && !p.computed && p.key.type === 'Identifier' && p.key.name === nuevo;
  if (clave === 'value' && coincide(padre) && padre.value === v.nodo) return { inicio: padre.start, fin: v.nodo.end, texto: nuevo };
  if (padre.type === 'AssignmentPattern' && clave === 'left' && coincide(abuelo) && abuelo.value === padre)
    return { inicio: abuelo.start, fin: v.nodo.end, texto: nuevo };
  if (padre.type === 'ObjectProperty' && padre.shorthand && clave === 'value') return `${nombreClave(padre.key)}: ${nuevo}`;
  if (padre.type === 'AssignmentPattern' && clave === 'left' && abuelo?.type === 'ObjectProperty' && abuelo.shorthand && abuelo.value === padre)
    return `${nombreClave(abuelo.key)}: ${nuevo}`;
  if (padre.type === 'ImportSpecifier' && clave === 'local' && padre.imported.start === padre.local.start) {
    const imp = nombreClave(padre.imported);
    return opciones.importSigue || imp === nuevo ? nuevo : `${imp} as ${nuevo}`;
  }
  if (padre.type === 'ExportSpecifier' && clave === 'local') {
    const exp = nombreClave(padre.exported);
    const abreviado = padre.exported.start === padre.local.start;
    if (abreviado) {
      if (opciones.conservarPublicos) return `${nuevo} as ${exp}`;
      opciones.exportados?.set(exp, nuevo);
      return nuevo;
    }
    if (exp === nuevo) return { inicio: padre.start, fin: padre.end, texto: nuevo };
  }
  return nuevo;
}

function empalmar(codigo, cambios) {
  cambios.sort((a, b) => a.inicio - b.inicio);
  const unicos = [];
  for (const c of cambios) {
    const u = unicos[unicos.length - 1];
    if (u && u.inicio === c.inicio && u.fin === c.fin) {
      if (u.texto !== c.texto) throw new Error(`Cambios distintos en la misma posición ${c.inicio}: «${u.texto}» / «${c.texto}»`);
      continue;
    }
    if (u && c.inicio < u.fin) throw new Error(`Cambios solapados en ${c.inicio}`);
    unicos.push(c);
  }
  let out = '', pos = 0;
  for (const c of unicos) {
    out += codigo.slice(pos, c.inicio) + c.texto;
    pos = c.fin;
  }
  return out + codigo.slice(pos);
}

function cambiosDeEnlace(e, nuevo, opciones) {
  const cambios = [];
  for (const v of e.nodos) {
    const s = sustituto(v, nuevo, opciones);
    if (typeof s === 'string') cambios.push({ inicio: v.nodo.start, fin: v.nodo.end, texto: s });
    else cambios.push(s);
  }
  return cambios;
}

function verificar(antes, despues, ruta) {
  const est2 = estudiar(despues, ruta);
  const f1 = firmaResolucion(antes), f2 = firmaResolucion(est2);
  if (f1.length !== f2.length) throw new Error(`${ruta}: cambia el número de identificadores (${f1.length} → ${f2.length})`);
  for (let i = 0; i < f1.length; i++) {
    if (f1[i] !== f2[i]) {
      const v = est2.visitas[i];
      const linea = despues.slice(0, v.nodo.start).split('\n').length;
      throw new Error(`${ruta}:${linea}: «${v.nombre}» cambiaría de enlace (${f1[i]} → ${f2[i]}); elige otro nombre`);
    }
  }
  return est2;
}

// ───────────────────────── aplicación de un mapa ─────────────────────────

const contenidos = new Map(); // ruta absoluta -> texto actual (en memoria)
const tocados = new Set();
function leerSrc(abs) {
  if (!contenidos.has(abs)) contenidos.set(abs, fs.readFileSync(abs, 'utf8'));
  return contenidos.get(abs);
}
function todosLosJs(dir = SRC, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) todosLosJs(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}
const rel = (abs) => path.relative(WEB, abs);

// Traduce una dirección a los nombres nuevos del propio mapa (para detectar claves ya aplicadas
// cuando también se renombró la función que las contiene).
function traducirRuta(ruta, mapa) {
  if (!ruta) return ruta;
  const elems = ruta.split('>');
  const out = [];
  const viejos = [];
  for (const el of elems) {
    const m = /^(.*?)(\(\))?(#\d+)?$/.exec(el);
    let [, cuerpo, llamada = '', suf = ''] = m;
    const partes = cuerpo.split('.');
    const dueno = partes[0];
    // Buscar el enlace «dueno» en la ruta actual o en sus antecesoras.
    let nuevo = null;
    for (let k = viejos.length; k >= 0 && nuevo == null; k--) {
      const pref = viejos.slice(0, k).join('>');
      const clave = pref ? `${pref}:${dueno}` : dueno;
      if (typeof mapa[clave] === 'string') nuevo = mapa[clave];
    }
    if (nuevo != null) partes[0] = nuevo;
    out.push(partes.join('.') + llamada + suf);
    viejos.push(el);
  }
  return out.join('>');
}

function aplicarMapa(abs, mapa, opciones) {
  const ruta = rel(abs);
  let codigo = leerSrc(abs);
  const est = estudiar(codigo, ruta);
  const porDir = new Map(est.enlaces.map((e) => [e.dir, e]));
  const asignado = new Map(); // enlace -> {nuevo, clave, prioridad}
  const informe = { aplicadas: 0, yaAplicadas: 0, errores: [] };
  const asignar = (e, nuevo, clave, prioridad) => {
    const prev = asignado.get(e);
    if (prev && prev.prioridad > prioridad) return;
    if (prev && prev.prioridad === prioridad && prev.nuevo !== nuevo) {
      informe.errores.push(`${clave} y ${prev.clave} asignan nombres distintos a ${e.dir}`);
      return;
    }
    asignado.set(e, { nuevo, clave, prioridad });
  };
  for (const [clave, nuevo] of Object.entries(mapa)) {
    if (clave.startsWith('//')) continue; // comentarios en el JSON
    if (!IDENT.test(nuevo) || RESERVADAS.has(nuevo)) {
      informe.errores.push(`${clave}: «${nuevo}» no es un nombre válido`);
      continue;
    }
    if (clave.startsWith('*:')) {
      const nombre = clave.slice(2);
      for (const e of est.enlaces) if (e.nombre === nombre) asignar(e, nuevo, clave, 0);
      continue;
    }
    const exacta = /#\d+$/.test(clave.split(':').pop());
    const buscar = (dir) => (exacta ? (porDir.has(dir) ? [porDir.get(dir)] : []) : est.grupos.get(dir) || []);
    let encontrados = buscar(clave);
    if (!encontrados.length) {
      // ¿La función contenedora ya tiene su nombre nuevo?
      const i = clave.lastIndexOf(':');
      const rutaVieja = i >= 0 ? clave.slice(0, i) : '';
      const nombreViejo = i >= 0 ? clave.slice(i + 1) : clave;
      const rutaNueva = traducirRuta(rutaVieja, mapa);
      const junta = (r, n) => (r ? `${r}:${n}` : n);
      // Primero, ¿ya está aplicada? (el nombre nuevo existe en la ruta; tras renombrar cambian los
      // índices «#k» de los homónimos, así que basta con el nombre). Se mira antes que el nombre viejo
      // en la ruta traducida porque otro enlace puede haber recibido ya ese nombre viejo.
      const hay = (r) => (est.grupos.get(junta(r, nuevo)) || []).length > 0;
      if (rutaNueva !== rutaVieja && (hay(rutaNueva) || hay(rutaVieja))) {
        informe.yaAplicadas++;
        continue;
      }
      encontrados = buscar(junta(rutaNueva, nombreViejo));
      if (!encontrados.length) {
        if (hay(rutaNueva) || hay(rutaVieja)) {
          informe.yaAplicadas++;
          continue;
        }
        informe.errores.push(`${clave}: no existe ese enlace en ${ruta}`);
        continue;
      }
    }
    for (const e of encontrados) asignar(e, nuevo, clave, exacta ? 2 : 1);
  }
  if (informe.errores.length) return informe;

  const exportados = new Map(); // nombre exportado viejo -> nuevo
  const conservarPublicos = path.basename(abs) === 'index.js';
  let cambios = [];
  for (const [e, { nuevo }] of asignado) {
    if (e.nombre === nuevo) continue;
    cambios.push(...cambiosDeEnlace(e, nuevo, { exportados, conservarPublicos }));
    informe.aplicadas++;
  }
  if (!cambios.length) return informe;
  codigo = empalmar(codigo, cambios);
  verificar(est, codigo, ruta);
  contenidos.set(abs, codigo);
  tocados.add(abs);
  if (exportados.size) propagarExports(abs, exportados, opciones, informe);
  return informe;
}

// Actualiza los import (y reexportaciones) de los nombres exportados que han cambiado.
function propagarExports(absOrigen, exportados, opciones, informe) {
  informe.exports = Object.fromEntries(exportados);
  informe.importadores = [];
  for (const abs of todosLosJs()) {
    if (abs === absOrigen) continue;
    const codigo = leerSrc(abs);
    if (!codigo.includes(path.basename(absOrigen, '.js'))) continue;
    const ruta = rel(abs);
    const est = estudiar(codigo, ruta);
    const cambios = [];
    const enArea = opciones.area.some((d) => abs.startsWith(d + path.sep));
    for (const s of est.ast.program.body) {
      if (!s.source || !['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(s.type)) continue;
      if (!s.source.value.startsWith('.')) continue;
      if (path.resolve(path.dirname(abs), s.source.value) !== absOrigen) continue;
      if (s.type === 'ExportAllDeclaration') {
        console.warn(`  aviso: ${ruta} reexporta todo (export *) de ${rel(absOrigen)}; revisa los nombres a mano`);
        continue;
      }
      for (const sp of s.specifiers) {
        if (sp.type === 'ImportNamespaceSpecifier') {
          console.warn(`  aviso: ${ruta} importa el espacio de nombres de ${rel(absOrigen)}; revisa los usos a mano`);
          continue;
        }
        if (sp.type === 'ImportDefaultSpecifier') continue;
        if (sp.type === 'ImportSpecifier') {
          const imp = nombreClave(sp.imported);
          if (!exportados.has(imp)) continue;
          const nuevo = exportados.get(imp);
          const abreviado = sp.imported.start === sp.local.start;
          if (enArea && abreviado) {
            // Renombrar también el enlace local del archivo del área.
            const e = est.porBinding.get(est.programa.getBinding(sp.local.name));
            cambios.push(...cambiosDeEnlace(e, nuevo, { importSigue: true }));
          } else if (abreviado) {
            cambios.push({ inicio: sp.start, fin: sp.end, texto: `${nuevo} as ${sp.local.name}` });
          } else if (nuevo === sp.local.name) {
            cambios.push({ inicio: sp.start, fin: sp.end, texto: nuevo });
          } else {
            cambios.push({ inicio: sp.imported.start, fin: sp.imported.end, texto: nuevo });
          }
        } else if (sp.type === 'ExportSpecifier') {
          const loc = nombreClave(sp.local);
          if (!exportados.has(loc)) continue;
          const nuevo = exportados.get(loc);
          const exp = nombreClave(sp.exported);
          cambios.push({ inicio: sp.start, fin: sp.end, texto: nuevo === exp ? nuevo : `${nuevo} as ${exp}` });
        }
      }
    }
    if (!cambios.length) continue;
    const nuevoCodigo = empalmar(codigo, cambios);
    verificar(est, nuevoCodigo, ruta);
    contenidos.set(abs, nuevoCodigo);
    tocados.add(abs);
    informe.importadores.push(ruta + (enArea ? '' : ' (solo import)'));
  }
}

// ───────────────────────── modos ─────────────────────────

function listar(rutas, todos) {
  for (const r of rutas) {
    const abs = path.resolve(WEB, r);
    const codigo = fs.readFileSync(abs, 'utf8');
    const est = estudiar(codigo, rel(abs));
    const lineas = codigo.split('\n');
    console.log(`# ${rel(abs)}`);
    for (const e of est.enlaces) {
      if (!todos && !pareceMinificado(e.nombre) && e.nombre.length > 2) continue;
      const n = codigo.slice(0, e.pos).split('\n').length;
      const txt = lineas[n - 1].trim().slice(0, 110);
      console.log(`${e.dir.padEnd(34)} ${String(n).padStart(5)} ${e.binding.kind.padEnd(7)} ${String(e.nodos.length).padStart(3)}  ${txt}`);
    }
  }
}

function estadisticas(rutas) {
  let total = 0, mini = 0;
  const archivos = [];
  for (const r of rutas) {
    const abs = path.resolve(WEB, r);
    if (fs.statSync(abs).isDirectory()) archivos.push(...todosLosJs(abs));
    else archivos.push(abs);
  }
  for (const abs of archivos) {
    const est = estudiar(fs.readFileSync(abs, 'utf8'), rel(abs));
    const m = est.enlaces.filter((e) => pareceMinificado(e.nombre)).length;
    total += est.enlaces.length;
    mini += m;
    console.log(`${rel(abs).padEnd(32)} enlaces ${String(est.enlaces.length).padStart(5)} · con pinta de minificados ${String(m).padStart(5)}`);
  }
  console.log(`TOTAL enlaces ${total} · minificados ${mini} · legibles ${(((total - mini) / Math.max(1, total)) * 100).toFixed(1)} %`);
}

function principal() {
  const args = process.argv.slice(2);
  const valor = (n) => {
    const i = args.indexOf(n);
    return i >= 0 ? args[i + 1] : null;
  };
  const sueltos = args.filter((a, i) => !a.startsWith('--') && !['--solo', '--area'].includes(args[i - 1]));
  if (args.includes('--listar')) return listar(sueltos, args.includes('--todos'));
  if (args.includes('--estadisticas')) return estadisticas(sueltos);
  if (!sueltos.length) {
    console.error('Uso: node tools/renombrar.mjs <mapa.json> [--solo archivo,…] [--area dir,…] [--simular] | --listar archivo… | --estadisticas ruta…');
    process.exit(2);
  }
  const mapaTotal = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), sueltos[0]), 'utf8'));
  const solo = valor('--solo')?.split(',').map((r) => path.resolve(WEB, r));
  const entradas = Object.entries(mapaTotal).filter(([r]) => !r.startsWith('//'));
  const area = (valor('--area')?.split(',') ?? [...new Set(entradas.map(([r]) => path.dirname(r)))]).map((d) => path.resolve(WEB, d));
  let error = false;
  for (const [r, valorMapa] of entradas) {
    const abs = path.resolve(WEB, r);
    if (solo && !solo.includes(abs)) continue;
    for (const mapa of [].concat(valorMapa)) {
      const inf = aplicarMapa(abs, mapa, { area });
      if (inf.errores.length) {
        error = true;
        for (const e of inf.errores) console.error(`ERROR ${e}`);
        continue;
      }
      let linea = `${r}: ${inf.aplicadas} renombrados`;
      if (inf.yaAplicadas) linea += `, ${inf.yaAplicadas} ya aplicados`;
      if (inf.exports) linea += ` · exports ${JSON.stringify(inf.exports)} → ${inf.importadores.join(', ') || 'sin importadores'}`;
      console.log(linea);
    }
  }
  if (error) {
    console.error('No se ha escrito nada.');
    process.exit(1);
  }
  if (args.includes('--simular')) {
    console.log(`(simulación: ${tocados.size} archivos cambiarían)`);
    return;
  }
  for (const abs of tocados) fs.writeFileSync(abs, contenidos.get(abs));
  console.log(`${tocados.size} archivos escritos.`);
}

try {
  principal();
} catch (e) {
  console.error('ERROR ' + e.message);
  console.error('No se ha escrito nada.');
  process.exit(1);
}
