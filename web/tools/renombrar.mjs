// Renombrado de identificadores consciente de ámbitos, a partir de un mapa JSON.
//
//   node tools/renombrar.mjs renombres/mundo.json            aplica el mapa sobre src/
//   node tools/renombrar.mjs renombres/mundo.json --seco     solo comprueba e informa
//   node tools/renombrar.mjs --listar src/world/grid.js      lista los enlaces y su clave
//
// Formato del mapa (rutas relativas a web/):
//
//   { "src/world/grid.js": { "Mi": "initGrid", "Mi/o": "level", "Ym/constructor/e#2": "opts" } }
//
// - Clave sin «/»: enlace del ámbito del módulo. Si se exporta con `export { X }`, cambia también
//   el nombre exportado y los imports (y `ns.X` de `import * as ns`) en todos los archivos de src/.
// - Clave «a/b/n»: enlaces llamados «n» declarados dentro de la función o clase con nombre «a/b».
//   Una función tiene nombre si se declara con él, si se asigna a una variable, a una propiedad
//   (`x.update = () => …`, `{ update() {} }`) o es un método de clase. Las funciones anónimas
//   (callbacks) no cuentan: sus enlaces pertenecen a la función con nombre que las contiene.
// - Si varios enlaces casan con la misma clave se renombran todos; «n#k» elige el k-ésimo (desde 1)
//   en orden de aparición. Una clave «#k» manda sobre la genérica.
// - El mapa es idempotente: los nombres ya aplicados se reconocen y se saltan, también en las rutas.
//
// Usa `scope.rename` de babel y escribe el resultado empalmando texto en las posiciones del AST
// (conserva comentarios y formato) y pasando prettier. Comprueba que nada queda capturado: el grafo
// de resolución de identificadores (a qué declaración apunta cada uso) debe ser idéntico antes y
// después, y cada import debe existir como export en su módulo.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import * as t from '@babel/types';
import * as prettier from 'prettier';
import { esPosicionPropiedad } from './lib/ast.mjs';

const traverse = _traverse.default || _traverse;
const WEB = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(WEB, 'src');
const PRETTIER = { parser: 'babel', printWidth: 110, singleQuote: true };
const RESERVADAS = new Set(['arguments', 'eval', 'undefined', 'NaN', 'Infinity']);

const analizar = (codigo) => parse(codigo, { sourceType: 'module', errorRecovery: false });

function programa(ast) {
  let prog = null;
  traverse(ast, { Program(p) { prog = p; p.stop(); } });
  return prog;
}

// ---------------------------------------------------------------------------------------------
// Nombres de ámbito

// Nombre de una función o clase según su declaración o el sitio donde se asigna (null: anónima).
function nombreDeFuncion(p) {
  const n = p.node;
  if ((p.isFunctionDeclaration() || p.isClassDeclaration()) && n.id) return n.id.name;
  if (p.isObjectMethod() || p.isClassMethod() || p.isClassPrivateMethod()) return nombreDeClave(n.key, n.computed);
  if ((p.isFunctionExpression() || p.isClassExpression()) && n.id) return n.id.name;
  const padre = p.parentPath;
  if (!padre) return null;
  const pn = padre.node;
  if (padre.isVariableDeclarator() && pn.init === n && t.isIdentifier(pn.id)) return pn.id.name;
  if (padre.isAssignmentExpression() && pn.right === n) {
    if (t.isIdentifier(pn.left)) return pn.left.name;
    if (t.isMemberExpression(pn.left)) return nombreDeClave(pn.left.property, pn.left.computed);
  }
  if ((padre.isObjectProperty() || padre.isClassProperty()) && pn.value === n) return nombreDeClave(pn.key, pn.computed);
  if (padre.isExportDefaultDeclaration()) return 'default';
  return null;
}

function nombreDeClave(k, computada) {
  if (computada) return t.isStringLiteral(k) ? k.value : null;
  if (t.isIdentifier(k)) return k.name;
  if (t.isStringLiteral(k)) return k.value;
  if (t.isPrivateName(k)) return '#' + k.id.name;
  return null;
}

// Cadena de funciones/clases con nombre que contienen el ámbito (de fuera a dentro).
function cadenaDeAmbito(scope) {
  const cadena = [];
  for (let p = scope.path; p; p = p.parentPath) {
    if (p.isFunction() || p.isClass()) {
      const nombre = nombreDeFuncion(p);
      if (nombre !== null) cadena.unshift(nombre);
    }
  }
  return cadena;
}

// Todos los enlaces de todos los ámbitos del archivo, en orden de declaración.
function todosLosEnlaces(prog) {
  const ambitos = new Set([prog.scope]);
  prog.traverse({ Scopable(p) { ambitos.add(p.scope); } });
  const lista = [];
  for (const s of ambitos) for (const b of Object.values(s.bindings)) lista.push(b);
  return lista.sort((a, b) => a.identifier.start - b.identifier.start);
}

// ---------------------------------------------------------------------------------------------
// Grafo de resolución (comprobación de capturas)

// Secuencia de identificadores (en orden de recorrido) con la declaración a la que resuelven: el
// ordinal del enlace o «g:nombre» si es global. Se excluyen nombres de propiedad y de import/export.
function grafo(ast) {
  const prog = programa(ast);
  const enlaces = todosLosEnlaces(prog);
  const ordinal = new Map(enlaces.map((b, i) => [b, i]));
  const sec = [];
  prog.traverse({
    Identifier(p) {
      const { parent, key } = p;
      if (esPosicionPropiedad(parent, key)) return;
      if (p.parentPath.isImportSpecifier() && key === 'imported') return;
      if (p.parentPath.isExportSpecifier() && key === 'exported') return;
      const b = p.scope.getBinding(p.node.name);
      sec.push(b ? ordinal.get(b) ?? `?${p.node.name}` : `g:${p.node.name}`);
    },
  });
  return sec.join(',');
}

// ---------------------------------------------------------------------------------------------
// Resolución del mapa

function partirClave(clave) {
  const m = /^(.*?)(?:#(\d+))?$/.exec(clave);
  const partes = m[1].split('/');
  return { ruta: partes.slice(0, -1), nombre: partes[partes.length - 1], k: m[2] ? Number(m[2]) : null };
}

// Devuelve [{binding, nuevo, clave}] para el mapa de un archivo.
function resolver(prog, mapa, archivo) {
  const enlaces = todosLosEnlaces(prog);
  const cadenas = new Map(enlaces.map((b) => [b, cadenaDeAmbito(b.scope)]));
  // Una componente de ruta «c» (prefijo p) casa con el nombre actual «c» o con su nombre nuevo.
  const casaRuta = (ruta, cadena) =>
    ruta.length === cadena.length &&
    ruta.every((c, i) => {
      const prefijo = ruta.slice(0, i + 1).join('/');
      return cadena[i] === c || cadena[i] === mapa[prefijo];
    });
  const plan = [];
  const aplicadas = []; // claves del módulo ya aplicadas (para propagar a importadores rezagados)
  const asignado = new Map(); // binding -> clave
  const errores = [];
  // Para que el mapa sea idempotente, un nombre nuevo no puede ser también nombre viejo de otra
  // clave del mismo ámbito (si no, tras aplicarlo no se sabría qué enlace es cuál).
  const viejosPorRuta = new Map();
  for (const clave of Object.keys(mapa)) {
    const { ruta, nombre } = partirClave(clave);
    const r = ruta.join('/');
    if (!viejosPorRuta.has(r)) viejosPorRuta.set(r, new Set());
    viejosPorRuta.get(r).add(nombre);
  }
  for (const [clave, nuevo] of Object.entries(mapa)) {
    const { ruta } = partirClave(clave);
    if (viejosPorRuta.get(ruta.join('/')).has(nuevo)) errores.push(`${archivo}: «${clave}» → «${nuevo}», que también es un nombre viejo de ese ámbito; elige otro`);
  }
  // Primero las claves #k (mandan sobre las genéricas).
  const claves = Object.keys(mapa).sort((a, b) => (b.includes('#') ? 1 : 0) - (a.includes('#') ? 1 : 0));
  const delAmbito = (ruta, n) =>
    enlaces.filter((b) => {
      if (b.identifier.name !== n) return false;
      if (ruta.length === 0) return b.scope === prog.scope;
      return b.scope !== prog.scope && casaRuta(ruta, cadenas.get(b));
    });
  for (const clave of claves) {
    const nuevo = mapa[clave];
    const { ruta, nombre, k } = partirClave(clave);
    // Idempotencia: si ya no queda ningún enlace con el nombre viejo en ese ámbito, la clave se da
    // por aplicada cuando existe uno con el nombre nuevo (y entonces no se toca nada).
    const viejos = delAmbito(ruta, nombre);
    if (!viejos.length) {
      const hechos = delAmbito(ruta, nuevo);
      if (!hechos.length) errores.push(`${archivo}: no encuentro «${clave}»`);
      else if (ruta.length === 0) aplicadas.push({ binding: hechos[0], viejo: nombre, nuevo });
      continue;
    }
    let elegidos;
    if (k !== null) elegidos = viejos[k - 1] ? [viejos[k - 1]] : [];
    else elegidos = viejos.filter((b) => !asignado.has(b));
    if (!elegidos.length) { errores.push(`${archivo}: no encuentro «${clave}»`); continue; }
    for (const b of elegidos) {
      if (asignado.has(b)) {
        if (k === null) continue;
        errores.push(`${archivo}: «${clave}» y «${asignado.get(b)}» eligen el mismo enlace`);
        continue;
      }
      asignado.set(b, clave);
      if (b.identifier.name !== nuevo) plan.push({ binding: b, nuevo, clave });
    }
  }
  return { plan, aplicadas, errores };
}

// ---------------------------------------------------------------------------------------------
// Renombrado de un enlace con comprobación de conflictos

function conflicto(binding, nuevo) {
  if (!t.isValidIdentifier(nuevo) || RESERVADAS.has(nuevo)) return `«${nuevo}» no es un identificador válido`;
  const s = binding.scope;
  if (s.hasOwnBinding(nuevo)) return `ya existe «${nuevo}» en el mismo ámbito`;
  // Captura: un ámbito entre un uso y la declaración declara ya el nombre nuevo.
  const usos = [binding.path, ...binding.referencePaths, ...binding.constantViolations];
  for (const u of usos) {
    for (let a = u.scope; a && a !== s; a = a.parent) {
      if (a.hasOwnBinding(nuevo)) return `«${nuevo}» capturaría un uso en la línea ${u.node.loc?.start.line}`;
    }
  }
  // Ocultación: dentro del ámbito hay usos de «nuevo» que resuelven fuera de él (o a un global).
  let oculta = null;
  s.path.traverse({
    Identifier(p) {
      if (oculta || p.node.name !== nuevo) return;
      if (esPosicionPropiedad(p.parent, p.key)) return;
      if (p.parentPath.isImportSpecifier() && p.key === 'imported') return;
      if (p.parentPath.isExportSpecifier() && p.key === 'exported') return;
      const b = p.scope.getBinding(nuevo);
      if (!b || !esDescendiente(b.scope, s)) oculta = p.node.loc?.start.line;
    },
  });
  if (oculta !== null) return `«${nuevo}» ocultaría un uso exterior en la línea ${oculta}`;
  return null;
}

function esDescendiente(scope, ancestro) {
  for (let a = scope; a; a = a.parent) if (a === ancestro) return true;
  return false;
}

// ---------------------------------------------------------------------------------------------
// Escritura por empalme de texto

function nombresOriginales(ast) {
  const orig = new Map();
  const abreviadas = [];
  const especificadores = [];
  traverse(ast, {
    Identifier(p) { orig.set(p.node, p.node.name); },
    ObjectProperty(p) { if (p.node.shorthand) abreviadas.push(p.node); },
    ImportSpecifier(p) { especificadores.push(p.node); },
    ExportSpecifier(p) { especificadores.push(p.node); },
  });
  return { orig, abreviadas, especificadores };
}

function empalmar(codigo, ast, { orig, abreviadas, especificadores }) {
  const cambios = [];
  const hechos = new Set();
  for (const prop of abreviadas) {
    const v = t.isAssignmentPattern(prop.value) ? prop.value.left : prop.value;
    hechos.add(v); hechos.add(prop.key);
    if (v.name !== orig.get(v)) cambios.push([prop.key.start, prop.key.end, `${orig.get(prop.key)}: ${v.name}`]);
  }
  for (const e of especificadores) {
    const [a, b] = e.type === 'ImportSpecifier' ? [e.imported, e.local] : [e.local, e.exported];
    if (!t.isIdentifier(a) || !t.isIdentifier(b)) continue;
    const unido = a.start === b.start; // `{ x }` sin `as`
    if (!unido) continue; // con `as` cada parte se trata como identificador suelto
    hechos.add(a); hechos.add(b);
    if (a.name !== orig.get(a) || b.name !== orig.get(b)) {
      cambios.push([a.start, a.end, a.name === b.name ? a.name : `${a.name} as ${b.name}`]);
    }
  }
  traverse(ast, {
    Identifier(p) {
      const n = p.node;
      if (hechos.has(n) || n.name === orig.get(n)) return;
      cambios.push([n.start, n.end, n.name]);
    },
  });
  cambios.sort((x, y) => x[0] - y[0]);
  const trozos = [];
  let pos = 0;
  for (const [a, b, txt] of cambios) {
    if (a < pos) throw new Error(`cambios solapados en la posición ${a}`);
    trozos.push(codigo.slice(pos, a), txt);
    pos = b;
  }
  trozos.push(codigo.slice(pos));
  return trozos.join('');
}

// ---------------------------------------------------------------------------------------------
// Módulos de src/

function archivosSrc(dir = SRC, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) archivosSrc(p, acc);
    else if (e.name.endsWith('.js')) acc.push(p);
  }
  return acc;
}

const resolverImport = (desde, spec) => (spec.startsWith('.') ? path.resolve(path.dirname(desde), spec) : null);

// Módulos que esbuild carga con import() de plantilla (src/<carpeta>/index.js): sus exports no se tocan.
const esCargable = (abs) => path.basename(abs) === 'index.js' && path.dirname(path.dirname(abs)) === SRC;

class Archivo {
  constructor(abs) {
    this.abs = abs;
    this.rel = path.relative(WEB, abs);
    this.codigo = fs.readFileSync(abs, 'utf8');
    this.ast = analizar(this.codigo);
    this.prog = programa(this.ast);
    this.plan = new Map(); // binding -> {nuevo, motivo}
    this.nombresNodo = []; // [nodo, nombre nuevo] (especificadores de import/export, ns.X)
  }
  planear(binding, nuevo, motivo, errores) {
    const previo = this.plan.get(binding);
    if (previo && previo.nuevo !== nuevo) errores.push(`${this.rel}: «${motivo}» y «${previo.motivo}» chocan (${nuevo} / ${previo.nuevo})`);
    else this.plan.set(binding, { nuevo, motivo });
  }
  get tocado() {
    return this.plan.size > 0 || this.nombresNodo.length > 0;
  }
  // Aplica el plan: primero a nombres temporales (así el orden no importa y se admiten
  // permutaciones), luego a los definitivos comprobando conflictos.
  ejecutar(errores) {
    this.antes = grafo(analizar(this.codigo));
    this.originales = nombresOriginales(this.ast);
    const usados = new Set();
    this.prog.traverse({ Identifier(p) { usados.add(p.node.name); } });
    let i = 0;
    const temporales = [];
    for (const [binding, { nuevo, motivo }] of this.plan) {
      let tmp;
      do tmp = `$ren${i++}$`; while (usados.has(tmp));
      binding.scope.rename(binding.identifier.name, tmp);
      temporales.push([binding, nuevo, motivo, tmp]);
    }
    for (const [binding, nuevo, motivo, tmp] of temporales) {
      const c = conflicto(binding, nuevo);
      if (c) { errores.push(`${this.rel}: ${motivo} (→ ${nuevo}): ${c}`); continue; }
      binding.scope.rename(tmp, nuevo);
    }
    for (const [nodo, nombre] of this.nombresNodo) nodo.name = nombre;
  }
}

// ---------------------------------------------------------------------------------------------
// Programa principal

async function aplicar(rutaMapa, seco) {
  const mapaTotal = JSON.parse(fs.readFileSync(path.resolve(rutaMapa), 'utf8'));
  const archivos = new Map();
  const abrir = (abs) => {
    if (!archivos.has(abs)) archivos.set(abs, new Archivo(abs));
    return archivos.get(abs);
  };
  const todos = archivosSrc();
  const errores = [];
  const exportados = []; // {abs, viejo, nuevo}
  // 1. Planear los renombres de cada mapa (sin tocar todavía el AST).
  for (const [rel, mapa] of Object.entries(mapaTotal)) {
    if (rel.startsWith('_')) continue; // comentarios del mapa
    const abs = path.resolve(WEB, rel);
    if (!fs.existsSync(abs)) { errores.push(`no existe ${rel}`); continue; }
    const a = abrir(abs);
    const { plan, aplicadas, errores: e } = resolver(a.prog, mapa, rel);
    errores.push(...e);
    for (const { binding, viejo, nuevo } of aplicadas) {
      if (binding.referencePaths.some((r) => r.parentPath.isExportSpecifier() && r.parent.exported.name === nuevo)) exportados.push({ abs, viejo, nuevo });
    }
    for (const { binding, nuevo, clave } of plan) {
      const viejo = binding.identifier.name;
      if (binding.scope === a.prog.scope) {
        // ¿Se exporta? Las declaraciones exportadas en línea no se admiten.
        const decl = binding.path.parentPath;
        if (binding.path.parentPath?.isExportDeclaration() || decl?.parentPath?.isExportDeclaration()) {
          errores.push(`${rel}: «${clave}» se declara dentro de un export; conviértelo a export { … }`);
          continue;
        }
        for (const r of binding.referencePaths) {
          if (r.parentPath.isExportSpecifier() && r.parent.exported.name === viejo) {
            if (esCargable(abs)) { errores.push(`${rel}: «${viejo}» se exporta desde un módulo cargado con import(); no se renombra`); continue; }
            a.nombresNodo.push([r.parent.exported, nuevo]);
            exportados.push({ abs, viejo, nuevo });
          }
        }
      }
      a.planear(binding, nuevo, clave, errores);
    }
  }
  // 2. Propagar los exports renombrados a los importadores (y reexportadores, en cadena).
  for (let i = 0; i < exportados.length; i++) {
    const { abs, viejo, nuevo } = exportados[i];
    for (const otro of todos) {
      const cod = archivos.get(otro)?.codigo ?? fs.readFileSync(otro, 'utf8');
      if (!cod.includes(viejo)) continue;
      const b = abrir(otro);
      for (const sent of b.ast.program.body) {
        if (!sent.source || resolverImport(otro, sent.source.value) !== abs) continue;
        if (t.isImportDeclaration(sent)) {
          for (const sp of sent.specifiers) {
            if (t.isImportSpecifier(sp) && sp.imported.name === viejo) {
              b.nombresNodo.push([sp.imported, nuevo]);
              if (sp.local.name === viejo) b.planear(b.prog.scope.getBinding(viejo), nuevo, `import de ${viejo}`, errores);
            } else if (t.isImportNamespaceSpecifier(sp)) {
              const ns = b.prog.scope.getBinding(sp.local.name);
              for (const r of ns.referencePaths) {
                if (r.parentPath.isMemberExpression({ object: r.node, computed: false }) && r.parent.property.name === viejo) {
                  b.nombresNodo.push([r.parent.property, nuevo]);
                }
              }
            }
          }
        } else if (t.isExportNamedDeclaration(sent)) {
          for (const sp of sent.specifiers) {
            if (sp.local?.name !== viejo) continue;
            if (sp.exported.name === viejo) {
              if (esCargable(otro)) { errores.push(`${b.rel}: reexporta «${viejo}» desde un módulo cargado con import()`); continue; }
              b.nombresNodo.push([sp.exported, nuevo]);
              exportados.push({ abs: otro, viejo, nuevo });
            }
            b.nombresNodo.push([sp.local, nuevo]);
          }
        }
      }
    }
  }
  // 3. Ejecutar los planes.
  let n = 0;
  for (const a of archivos.values()) if (a.tocado) { a.ejecutar(errores); n += a.plan.size; }
  // Escribir, formatear y verificar.
  const salidas = new Map();
  for (const a of archivos.values()) {
    if (!a.tocado) continue;
    let nuevoCod = empalmar(a.codigo, a.ast, a.originales);
    try {
      nuevoCod = await prettier.format(nuevoCod, PRETTIER);
    } catch (err) {
      errores.push(`${a.rel}: prettier falla: ${err.message.split('\n')[0]}`);
      continue;
    }
    if (grafo(analizar(nuevoCod)) !== a.antes) errores.push(`${a.rel}: el grafo de resolución ha cambiado (captura de nombres)`);
    salidas.set(a.abs, nuevoCod);
  }
  // Coherencia de imports/exports en todo src/ tras el cambio.
  const leerFinal = (abs) => salidas.get(abs) ?? fs.readFileSync(abs, 'utf8');
  const exportsDe = new Map();
  const nombresExportados = (abs) => {
    if (!exportsDe.has(abs)) {
      const s = new Set();
      for (const sent of analizar(leerFinal(abs)).program.body) {
        if (t.isExportNamedDeclaration(sent)) {
          for (const sp of sent.specifiers) s.add(sp.exported.name ?? sp.exported.value);
          const d = sent.declaration;
          if (d?.id) s.add(d.id.name);
          if (t.isVariableDeclaration(d)) for (const v of d.declarations) Object.keys(t.getBindingIdentifiers(v.id)).forEach((x) => s.add(x));
        }
        if (t.isExportDefaultDeclaration(sent)) s.add('default');
        if (t.isExportAllDeclaration(sent)) s.add('*');
      }
      exportsDe.set(abs, s);
    }
    return exportsDe.get(abs);
  };
  for (const abs of salidas.keys()) {
    for (const otro of todos) {
      const ast = analizar(leerFinal(otro));
      for (const sent of ast.program.body) {
        if (!sent.source || !t.isImportDeclaration(sent) && !t.isExportNamedDeclaration(sent)) continue;
        if (resolverImport(otro, sent.source.value) !== abs) continue;
        const ex = nombresExportados(abs);
        for (const sp of sent.specifiers) {
          const nom = t.isImportSpecifier(sp) ? sp.imported.name : t.isExportSpecifier(sp) ? sp.local.name : null;
          if (nom && !ex.has(nom) && !ex.has('*')) errores.push(`${path.relative(WEB, otro)}: importa «${nom}», que ${path.relative(WEB, abs)} no exporta`);
        }
      }
    }
  }
  if (errores.length) {
    console.error(`${errores.length} errores; no se escribe nada:\n  ` + errores.join('\n  '));
    process.exit(1);
  }
  if (!seco) for (const [abs, cod] of salidas) fs.writeFileSync(abs, cod);
  console.log(`${seco ? '[seco] ' : ''}${n} enlaces renombrados en ${salidas.size} archivos (${exportados.length} exports propagados)`);
}

// Lista los enlaces de un archivo con la clave que los designa en el mapa.
function listar(rel, filtro) {
  const a = new Archivo(path.resolve(WEB, rel));
  const enlaces = todosLosEnlaces(a.prog);
  const lineas = a.codigo.split('\n');
  const porClave = new Map();
  for (const b of enlaces) {
    const cadena = b.scope === a.prog.scope ? [] : cadenaDeAmbito(b.scope);
    const base = [...cadena, b.identifier.name].join('/');
    if (!porClave.has(base)) porClave.set(base, []);
    porClave.get(base).push(b);
  }
  for (const [base, bs] of porClave) {
    if (filtro && !base.startsWith(filtro)) continue;
    bs.forEach((b, i) => {
      const clave = bs.length > 1 ? `${base}#${i + 1}` : base;
      const l = b.identifier.loc.start.line;
      const uso = lineas[l - 1].trim().slice(0, 90);
      console.log(`${String(l).padStart(4)}  ${clave.padEnd(34)} ${b.kind.padEnd(7)} ${String(b.references).padStart(3)}  ${uso}`);
    });
  }
}

const args = process.argv.slice(2);
if (args[0] === '--listar') listar(args[1], args[2]);
else if (args[0]) await aplicar(args[0], args.includes('--seco'));
else console.log('Uso: node tools/renombrar.mjs <mapa.json> [--seco] | --listar <archivo> [prefijo]');
