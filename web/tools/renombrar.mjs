// Renombrado de identificadores del código de `src/` consciente de ámbitos (babel scope.rename).
//
// Aplica un mapa JSON `archivo -> {nombreViejo: nombreNuevo}` (una «tanda») o una lista de tandas
// que se aplican en orden. Los archivos van relativos a `web/src/` (se aceptan también con prefijo
// `src/` o `web/src/`). Formato de las claves:
//
//   "Xl"                 enlace de nivel superior Xl (si no lo hay, el único enlace Xl del archivo)
//   "update/o"           enlace `o` declarado dentro de la función/método/clase llamada `update`
//   "Explore/update/o"   anclas encadenadas (cada una se busca dentro de la anterior)
//   "update/t#2"         el 2.º enlace llamado `t` dentro de `update` (orden del código, desde 1)
//   "render#2/o"         la 2.ª ancla llamada `render`
//
// Un ancla es una función o clase con nombre: declaración, expresión con nombre, método o
// propiedad de clase u objeto, `const x = () => …` o `a.x = function …`. Dentro de una tanda todas
// las claves se resuelven contra el estado del archivo antes de la tanda (renombrado simultáneo),
// así que dos tandas no se pueden fusionar en un solo objeto: se guardan como lista.
//
// Exports: si se renombra un enlace de nivel superior exportado como `export { viejo }`, también
// cambia el nombre exportado y se actualizan los imports de todo `src/`. En los archivos del área
// (`--area`, por defecto las carpetas de los archivos del mapa) se renombra también el enlace local
// del import; fuera del área solo cambia la línea de import (`import { nuevo as viejo }`). Los
// módulos que se cargan como espacio de nombres (`import()` o `import * as`) conservan sus nombres
// exportados: solo cambia el nombre local (`export { nuevo as viejo }`), porque esos nombres están
// en el bundle publicado.
//
// Seguridad: tras empalmar el texto, el archivo se vuelve a analizar y se comprueba que cada
// identificador resuelve al mismo enlace que antes (sin capturas ni sombras nuevas) y tiene el
// nombre previsto. Si algo falla no se escribe nada.
//
// Uso (desde web/):
//   node tools/renombrar.mjs <mapa.json> [--seco] [--area explore,scenes] [--tolerante] [--anadir acumulado.json]
//   node tools/renombrar.mjs --listar <archivo> [--minificados]
//
//   --seco        no escribe: solo informa
//   --tolerante   salta las claves que no resuelven si el nombre nuevo ya existe en su sitio
//                 (para volver a aplicar un mapa ya aplicado en parte); los imports se propagan igual
//   --anadir F    si todo va bien, añade la tanda aplicada al final de la lista del archivo F
//   --sin-formato no pasa prettier a los archivos escritos (por defecto sí: 110 columnas, comillas simples)
//   --listar      muestra los enlaces del archivo con una clave válida para cada uno
//   --minificados con --listar, solo los nombres de 1–3 caracteres o con aspecto de minificado
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import * as prettier from 'prettier';
import _traverse from '@babel/traverse';
import * as t from '@babel/types';

const traverse = _traverse.default || _traverse;
const WEB = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(WEB, 'src');

// ---------------------------------------------------------------- utilidades

const analizar = (codigo) => parse(codigo, { sourceType: 'module' });
const rel = (abs) => path.relative(SRC, abs).split(path.sep).join('/');
const normalizarArchivo = (a) => {
  let r = a.replace(/\\/g, '/').replace(/^\.\//, '');
  if (r.startsWith('web/')) r = r.slice(4);
  if (r.startsWith('src/')) r = r.slice(4);
  return r;
};
const ES_RESERVADA = new Set(('break case catch class const continue debugger default delete do else export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield let static implements interface package private protected public await enum arguments eval undefined NaN Infinity').split(' '));

function todosLosJs(dir = SRC, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) todosLosJs(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

// Recorrido simple de todos los nodos en orden de VISITOR_KEYS (el mismo que usa babel).
function recorrer(nodo, fn, padre = null, clave = null) {
  if (nodo == null) return;
  if (Array.isArray(nodo)) { for (const x of nodo) recorrer(x, fn, padre, clave); return; }
  if (typeof nodo !== 'object' || !nodo.type) return;
  fn(nodo, padre, clave);
  for (const k of t.VISITOR_KEYS[nodo.type] || []) recorrer(nodo[k], fn, nodo, k);
}

function esPosicionPropiedad(padre, clave) {
  if (!padre) return false;
  switch (padre.type) {
    case 'MemberExpression': case 'OptionalMemberExpression': return clave === 'property' && !padre.computed;
    case 'ObjectProperty': case 'ObjectMethod': case 'ClassMethod': case 'ClassPrivateMethod':
    case 'ClassProperty': case 'ClassAccessorProperty': case 'ClassPrivateProperty':
      return clave === 'key' && !padre.computed;
    case 'PrivateName': case 'MetaProperty': return true;
    case 'LabeledStatement': case 'BreakStatement': case 'ContinueStatement': return clave === 'label';
    case 'ImportSpecifier': return clave === 'imported';
    case 'ExportSpecifier': return clave === 'exported';
    default: return false;
  }
}

// ---------------------------------------------------------------- análisis de un archivo

// Devuelve { codigo, ast, scopes, bindings (lista ordenada por posición), anclas }.
function analizarArchivo(abs) {
  const codigo = fs.readFileSync(abs, 'utf8');
  const ast = analizar(codigo);
  const scopes = [];
  let programa = null;
  traverse(ast, {
    Program(p) { programa = p.scope; },
    Scopable(p) { if (!scopes.includes(p.scope)) scopes.push(p.scope); },
  });
  if (!scopes.includes(programa)) scopes.unshift(programa);
  const bindings = [];
  for (const s of scopes) for (const [nombre, b] of Object.entries(s.bindings)) bindings.push({ nombre, b, scope: s });
  bindings.sort((x, y) => x.b.identifier.start - y.b.identifier.start);
  return { abs, codigo, ast, scopes, programa, bindings, anclas: anclasDe(ast) };
}

// Nombre de ancla de un nodo (función o clase con nombre) o null. Devuelve [nombre, nodoRango].
function nombreClave(k) {
  if (!k) return null;
  if (k.type === 'Identifier') return k.name;
  if (k.type === 'StringLiteral') return k.value;
  if (k.type === 'PrivateName') return '#' + k.id.name;
  return null;
}
const esFuncionOClase = (n) => n && /^(FunctionExpression|ArrowFunctionExpression|ClassExpression|FunctionDeclaration|ClassDeclaration)$/.test(n.type);
function anclasDe(ast) {
  const out = [];
  recorrer(ast.program, (n) => {
    let nombre = null, nodo = null;
    switch (n.type) {
      case 'FunctionDeclaration': case 'FunctionExpression': case 'ClassDeclaration': case 'ClassExpression':
        if (n.id) { nombre = n.id.name; nodo = n; }
        break;
      case 'ClassMethod': case 'ClassPrivateMethod': case 'ObjectMethod':
        if (!n.computed) { nombre = nombreClave(n.key); nodo = n; }
        break;
      case 'ClassProperty': case 'ClassPrivateProperty': case 'ObjectProperty':
        if (!n.computed && esFuncionOClase(n.value)) { nombre = nombreClave(n.key); nodo = n.value; }
        break;
      case 'VariableDeclarator':
        if (n.id.type === 'Identifier' && esFuncionOClase(n.init) && !n.init.id) { nombre = n.id.name; nodo = n.init; }
        break;
      case 'AssignmentExpression':
        if (esFuncionOClase(n.right) && !n.right.id) {
          if (n.left.type === 'Identifier') nombre = n.left.name;
          else if (n.left.type === 'MemberExpression' && !n.left.computed) nombre = nombreClave(n.left.property);
          nodo = nombre ? n.right : null;
        }
        break;
    }
    if (nombre && nodo) out.push({ nombre, nodo, start: nodo.start, end: nodo.end });
  });
  out.sort((a, b) => a.start - b.start || b.end - a.end);
  return out;
}

const dentro = (n, r) => n.start >= r.start && n.end <= r.end;
const partirSeg = (s) => { const m = /^(.*?)(?:#(\d+))?$/.exec(s); return [m[1], m[2] ? +m[2] : null]; };

// Resuelve una clave a un binding. `nombreDe(id)` da el nombre a comparar (actual u original).
function resolverClave(A, clave) {
  const segs = clave.split('/');
  const [nombre, idx] = partirSeg(segs.pop());
  let raiz = { start: 0, end: Infinity };
  let ruta = [];
  for (const s of segs) {
    const [an, ai] = partirSeg(s);
    const cand = A.anclas.filter((a) => a.nombre === an && dentro(a, raiz) && !(a.start === raiz.start && a.end === raiz.end));
    if (!cand.length) return { error: `ancla «${s}» no encontrada` + (ruta.length ? ` dentro de ${ruta.join('/')}` : '') };
    if (ai == null && cand.length > 1) return { error: `ancla «${s}» ambigua (${cand.length}); usa ${an}#1…#${cand.length}` };
    const a = ai == null ? cand[0] : cand[ai - 1];
    if (!a) return { error: `ancla «${s}» fuera de rango (${cand.length})` };
    raiz = a;
    ruta.push(s);
  }
  if (!segs.length) {
    const b = A.programa.bindings[nombre];
    if (b && idx == null) return { binding: b };
    const todas = A.bindings.filter((x) => x.nombre === nombre);
    if (idx != null) return todas[idx - 1] ? { binding: todas[idx - 1].b } : { error: `«${clave}» fuera de rango (${todas.length})` };
    if (todas.length === 1) return { binding: todas[0].b };
    return { error: todas.length ? `«${nombre}» ambiguo en el archivo (${todas.length})` : `«${nombre}» no existe` };
  }
  const cand = A.bindings.filter((x) => x.nombre === nombre && dentro(x.scope.block, raiz));
  if (!cand.length) return { error: `«${nombre}» no está dentro de ${ruta.join('/')}` };
  if (idx == null && cand.length > 1) return { error: `«${nombre}» ambiguo dentro de ${ruta.join('/')} (${cand.length}); usa ${nombre}#1…#${cand.length}` };
  const x = idx == null ? cand[0] : cand[idx - 1];
  return x ? { binding: x.b } : { error: `«${clave}» fuera de rango (${cand.length})` };
}

// Clave más corta que resuelve a este binding (para --listar).
function claveDe(A, item) {
  const b = item.b;
  const prueba = (k) => resolverClave(A, k).binding === b;
  if (A.programa.bindings[item.nombre] === b) return item.nombre;
  const cadena = A.anclas.filter((a) => dentro(item.scope.block, a));
  const mismaRaiz = (x, r) => x.start === r.start && x.end === r.end;
  // Etiqueta de cada ancla relativa a la anterior (con #n si hay varias con ese nombre).
  const etiquetas = (segs) => segs.map((a, i) => {
    const raiz = i ? segs[i - 1] : { start: 0, end: Infinity };
    const cand = A.anclas.filter((x) => x.nombre === a.nombre && dentro(x, raiz) && !mismaRaiz(x, raiz));
    return cand.length > 1 ? `${a.nombre}#${cand.indexOf(a) + 1}` : a.nombre;
  });
  // Sufijos de la cadena de anclas, del más corto al más largo; después, con #n en el nombre.
  for (let n = 1; n <= cadena.length; n++) {
    const k = etiquetas(cadena.slice(-n)).join('/') + '/' + item.nombre;
    if (prueba(k)) return k;
  }
  for (let n = 1; n <= cadena.length; n++) {
    const segs = cadena.slice(-n);
    const raiz = segs[segs.length - 1];
    const cand = A.bindings.filter((x) => x.nombre === item.nombre && dentro(x.scope.block, raiz));
    const k = `${etiquetas(segs).join('/')}/${item.nombre}#${cand.findIndex((x) => x.b === b) + 1}`;
    if (prueba(k)) return k;
  }
  if (prueba(item.nombre)) return item.nombre;
  const todas = A.bindings.filter((x) => x.nombre === item.nombre);
  return item.nombre + '#' + (todas.findIndex((x) => x.b === b) + 1);
}

// ---------------------------------------------------------------- resolución y verificación

// Firma de resolución: para cada identificador (en orden), a qué enlace apunta.
function firmaResolucion(ast) {
  const ids = [];
  const pos = new Map();
  recorrer(ast.program, (n, padre, clave) => {
    if (n.type !== 'Identifier') return;
    const prop = esPosicionPropiedad(padre, clave);
    pos.set(n, ids.length);
    ids.push({ n, prop });
  });
  const enlace = new Map(); // nodo -> id del binding (posición de su identificador)
  const vistos = new Set();
  traverse(ast, {
    Scopable(p) {
      if (vistos.has(p.scope)) return;
      vistos.add(p.scope);
      for (const b of Object.values(p.scope.bindings)) {
        const id = pos.get(b.identifier);
        enlace.set(b.identifier, id);
        for (const r of b.referencePaths) enlace.set(r.node, id);
        for (const v of b.constantViolations) {
          const idsV = v.getBindingIdentifiers ? v.getBindingIdentifiers(true) : {};
          for (const l of Object.values(idsV)) for (const x of [].concat(l)) if (x && x.name === b.identifier.name) enlace.set(x, id);
          if (v.node.type === 'UpdateExpression' && v.node.argument.type === 'Identifier') enlace.set(v.node.argument, id);
          if (v.node.type === 'AssignmentExpression' && v.node.left.type === 'Identifier') enlace.set(v.node.left, id);
        }
      }
    },
  });
  return ids.map(({ n, prop }) => ({ nombre: n.name, prop, enlace: prop ? null : enlace.has(n) ? enlace.get(n) : 'G' }));
}

// ---------------------------------------------------------------- módulos y espacios de nombres

function resolverImport(desdeAbs, fuente) {
  if (!fuente.startsWith('.')) return null;
  return path.resolve(path.dirname(desdeAbs), fuente);
}

// Archivos de src/ cuyos exports están fijados (espacio de nombres o import dinámico).
function modulosConEspacio(archivos, cache) {
  const fijos = new Set();
  const patrones = [];
  for (const abs of archivos) {
    const cod = cache.texto(abs);
    if (!/import\s*\*|import\(|export\s*\*/.test(cod)) continue;
    const ast = cache.ast(abs);
    recorrer(ast.program, (n) => {
      if ((n.type === 'ImportDeclaration' && n.specifiers.some((s) => s.type === 'ImportNamespaceSpecifier')) || n.type === 'ExportAllDeclaration') {
        const r = resolverImport(abs, n.source.value); if (r) fijos.add(r);
      }
      if (n.type === 'ImportExpression' || (n.type === 'CallExpression' && n.callee.type === 'Import')) {
        const s = n.source ?? n.arguments[0];
        if (s?.type === 'StringLiteral') { const r = resolverImport(abs, s.value); if (r) fijos.add(r); }
        else if (s?.type === 'TemplateLiteral') {
          const marca = '\u0001';
          const crudo = s.quasis.map((q) => q.value.cooked).join(marca);
          if (!crudo.startsWith('.')) return;
          const ruta = path.resolve(path.dirname(abs), crudo);
          const re = new RegExp('^' + ruta.split(marca).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
          patrones.push(re);
        }
      }
    });
  }
  return (abs) => fijos.has(abs) || patrones.some((re) => re.test(abs));
}

// ---------------------------------------------------------------- aplicación de una tanda

function crearCache() {
  const textos = new Map(), asts = new Map();
  return {
    texto(abs) { if (!textos.has(abs)) textos.set(abs, fs.readFileSync(abs, 'utf8')); return textos.get(abs); },
    ast(abs) { if (!asts.has(abs)) asts.set(abs, analizar(this.texto(abs))); return asts.get(abs); },
  };
}

function aplicarTanda(tanda, opciones) {
  const archivos = todosLosJs();
  const cache = crearCache();
  const esFijo = modulosConEspacio(archivos, cache);
  const area = opciones.area ?? [...new Set(Object.keys(tanda).map((a) => normalizarArchivo(a).split('/').slice(0, -1).join('/')))];
  const enArea = (abs) => area.some((d) => (d ? rel(abs).startsWith(d + '/') : !rel(abs).includes('/')));

  // Estado por archivo tocado: análisis + lista de [binding, nuevo] + cambios de specifiers.
  const estado = new Map();
  const estadoDe = (abs) => {
    if (!estado.has(abs)) {
      const A = analizarArchivo(abs);
      A.orig = new Map();
      recorrer(A.ast.program, (n) => { if (n.type === 'Identifier') A.orig.set(n, n.name); });
      A.abreviadas = new Map();
      recorrer(A.ast.program, (n) => {
        if (n.type === 'ObjectProperty' && n.shorthand) {
          const v = n.value.type === 'AssignmentPattern' ? n.value.left : n.value;
          A.abreviadas.set(v, n.key.name);
        }
      });
      A.renombres = new Map(); // binding -> nuevo
      A.specifiers = new Set();
      estado.set(abs, A);
    }
    return estado.get(abs);
  };

  const errores = [], avisos = [], exportsRenombrados = [];
  for (const [archivo, mapa] of Object.entries(tanda)) {
    const abs = path.join(SRC, normalizarArchivo(archivo));
    if (!fs.existsSync(abs)) { errores.push(`${archivo}: no existe`); continue; }
    const A = estadoDe(abs);
    for (const [clave, nuevo] of Object.entries(mapa)) {
      if (!/^[A-Za-z_$][\w$]*$/.test(nuevo) || ES_RESERVADA.has(nuevo)) { errores.push(`${archivo}: «${nuevo}» no es un nombre válido`); continue; }
      const r = resolverClave(A, clave);
      const viejoTop = !clave.includes('/') && !clave.includes('#') ? clave : null;
      if (r.error) {
        // ¿Ya aplicado? (mismo sitio con el nombre nuevo)
        const segs = clave.split('/');
        segs[segs.length - 1] = nuevo;
        const ya = resolverClave(A, segs.join('/'));
        if (opciones.tolerante && ya.binding) {
          avisos.push(`${archivo}: «${clave}» ya aplicado (${nuevo})`);
          if (viejoTop && ya.binding.scope === A.programa) exportsRenombrados.push({ abs, viejo: viejoTop, nuevo, yaAplicado: true });
          continue;
        }
        errores.push(`${archivo}: ${r.error}`);
        continue;
      }
      if (A.renombres.has(r.binding)) { errores.push(`${archivo}: «${clave}» repetido en la tanda`); continue; }
      if (r.binding.identifier.name === nuevo) { avisos.push(`${archivo}: «${clave}» ya se llama ${nuevo}`); continue; }
      A.renombres.set(r.binding, nuevo);
      if (r.binding.scope === A.programa) exportsRenombrados.push({ abs, viejo: r.binding.identifier.name, nuevo, binding: r.binding });
    }
  }
  if (errores.length) return { errores, avisos };

  // Exports: nombre exportado y propagación a los importadores.
  for (const ex of exportsRenombrados) {
    const A = estadoDe(ex.abs);
    let exportado = false;
    recorrer(A.ast.program, (n) => {
      if (n.type !== 'ExportNamedDeclaration') return;
      if (n.declaration) {
        const ids = t.getBindingIdentifiers(n.declaration);
        if (ids[ex.viejo]) errores.push(`${rel(ex.abs)}: export en línea de «${ex.viejo}» no admitido`);
        return;
      }
      if (n.source) return;
      for (const s of n.specifiers) {
        if (s.type !== 'ExportSpecifier') continue;
        const loc = s.local.name, exp = s.exported.name ?? s.exported.value;
        if (loc === (ex.yaAplicado ? ex.nuevo : ex.viejo) && exp === ex.viejo) {
          if (esFijo(ex.abs)) { avisos.push(`${rel(ex.abs)}: «${ex.viejo}» se exporta en un espacio de nombres; se conserva el nombre exportado`); continue; }
          s.exported.name = ex.nuevo;
          A.specifiers.add(s);
          exportado = true;
        }
        if (exp === ex.nuevo && ex.yaAplicado) exportado = true;
      }
    });
    if (!exportado) continue;
    // Importadores en todo src/.
    const base = path.basename(ex.abs);
    for (const otro of archivos) {
      if (otro === ex.abs || !cache.texto(otro).includes(base)) continue;
      const ast = cache.ast(otro);
      const hay = ast.program.body.some((n) => (n.type === 'ImportDeclaration' || (n.type === 'ExportNamedDeclaration' && n.source)) && resolverImport(otro, n.source.value) === ex.abs
        && n.specifiers.some((s) => (s.imported?.name ?? s.local?.name) === ex.viejo));
      if (!hay) continue;
      const B = estadoDe(otro);
      for (const n of B.ast.program.body) {
        if (!((n.type === 'ImportDeclaration' || (n.type === 'ExportNamedDeclaration' && n.source)) && resolverImport(otro, n.source.value) === ex.abs)) continue;
        for (const s of n.specifiers) {
          if (s.type === 'ImportSpecifier' && s.imported.name === ex.viejo) {
            s.imported.name = ex.nuevo;
            B.specifiers.add(s);
            const b = B.programa.bindings[s.local.name];
            if (s.local.name === ex.viejo && enArea(otro) && b && !B.renombres.has(b)) B.renombres.set(b, ex.nuevo);
          } else if (s.type === 'ExportSpecifier' && s.local.name === ex.viejo) {
            s.local.name = ex.nuevo;
            B.specifiers.add(s);
            if (esFijo(otro)) continue;
            avisos.push(`${rel(otro)}: reexporta «${ex.viejo}» como «${s.exported.name}»; el nombre reexportado no cambia`);
          }
        }
      }
      if (!enArea(otro)) avisos.push(`${rel(otro)}: import de «${ex.viejo}» -> «${ex.nuevo}» (solo la línea de import)`);
    }
  }
  if (errores.length) return { errores, avisos };

  // Renombrado con babel en dos fases (temporales -> definitivos) para evitar choques en cadena.
  const resultados = [];
  for (const A of estado.values()) {
    const pares = [...A.renombres];
    pares.forEach(([b], i) => b.scope.rename(b.identifier.name, `__ren${i}__`));
    pares.forEach(([b, nuevo], i) => b.scope.rename(`__ren${i}__`, nuevo));
    // Empalme de texto.
    const cambios = [];
    const enSpecifier = new Set();
    for (const s of A.specifiers) {
      const izq = s.type === 'ImportSpecifier' ? s.imported : s.local;
      const der = s.type === 'ImportSpecifier' ? s.local : s.exported;
      enSpecifier.add(izq).add(der);
      const ni = izq.name ?? JSON.stringify(izq.value), nd = der.name ?? JSON.stringify(der.value);
      cambios.push([s.start, s.end, ni === nd ? ni : `${ni} as ${nd}`]);
    }
    recorrer(A.ast.program, (n, padre) => {
      if (n.type !== 'Identifier' || enSpecifier.has(n)) return;
      if (padre && (padre.type === 'ImportSpecifier' || padre.type === 'ExportSpecifier')) {
        if (A.orig.get(n) !== n.name) {
          // El otro lado del specifier no cambia: hay que escribir «a as b».
          const s = padre;
          const izq = s.type === 'ImportSpecifier' ? s.imported : s.local;
          const der = s.type === 'ImportSpecifier' ? s.local : s.exported;
          if (!enSpecifier.has(izq)) {
            enSpecifier.add(izq).add(der);
            const ni = izq.name ?? JSON.stringify(izq.value), nd = der.name ?? JSON.stringify(der.value);
            cambios.push([s.start, s.end, ni === nd ? ni : `${ni} as ${nd}`]);
          }
        }
        return;
      }
      const viejo = A.orig.get(n);
      if (viejo === undefined) throw new Error(`${rel(A.abs)}: nodo nuevo sin posición (babel reestructuró el AST)`);
      if (viejo === n.name) return;
      const clave = A.abreviadas.get(n);
      cambios.push([n.start, n.end, clave !== undefined ? `${clave}: ${n.name}` : n.name]);
    });
    cambios.sort((a, b) => a[0] - b[0]);
    const unicos = [];
    for (const c of cambios) {
      const u = unicos[unicos.length - 1];
      if (u && u[0] === c[0] && u[1] === c[1] && u[2] === c[2]) continue;
      if (u && c[0] < u[1]) throw new Error(`${rel(A.abs)}: cambios solapados en ${c[0]}`);
      unicos.push(c);
    }
    let pos = 0;
    const trozos = [];
    for (const [a, b, txt] of unicos) { trozos.push(A.codigo.slice(pos, a), txt); pos = b; }
    trozos.push(A.codigo.slice(pos));
    const nuevoCodigo = trozos.join('');

    // Verificación: misma resolución y nombres previstos.
    let antes, despues;
    try {
      antes = firmaResolucion(analizar(A.codigo));
      const astNuevo = analizar(nuevoCodigo);
      despues = firmaResolucion(astNuevo);
    } catch (e) {
      errores.push(`${rel(A.abs)}: el resultado no analiza: ${e.message}`);
      continue;
    }
    const previstos = [];
    recorrer(A.ast.program, (n) => { if (n.type === 'Identifier') previstos.push(n.name); });
    if (antes.length !== despues.length || previstos.length !== despues.length) {
      errores.push(`${rel(A.abs)}: cambia el número de identificadores (${antes.length} -> ${despues.length})`);
      continue;
    }
    for (let i = 0; i < antes.length; i++) {
      const x = antes[i], y = despues[i];
      if (x.prop !== y.prop || x.enlace !== y.enlace || y.nombre !== previstos[i]) {
        errores.push(`${rel(A.abs)}: el identificador n.º ${i} («${x.nombre}» -> «${y.nombre}», previsto «${previstos[i]}») cambia de enlace (${x.enlace} -> ${y.enlace}): captura o sombra`);
        break;
      }
    }
    resultados.push({ abs: A.abs, codigo: nuevoCodigo, n: pares.length, cambios: unicos.length });
  }
  return { errores, avisos, resultados };
}

// ---------------------------------------------------------------- CLI

const args = process.argv.slice(2);
const opcion = (n) => args.includes(n);
const valor = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };

if (opcion('--listar')) {
  const archivo = valor('--listar');
  const A = analizarArchivo(path.join(SRC, normalizarArchivo(archivo)));
  const lineas = A.codigo.split('\n');
  const linea = (p) => A.codigo.slice(0, p).split('\n').length;
  const pareceMin = (n) => n.length <= 3 || /^[A-Za-z_$][A-Za-z_$]?\d[\w$]?$/.test(n);
  for (const item of A.bindings) {
    if (opcion('--minificados') && !pareceMin(item.nombre)) continue;
    const l = linea(item.b.identifier.start);
    console.log(`${claveDe(A, item).padEnd(40)} ${item.b.kind.padEnd(7)} l.${String(l).padEnd(5)} refs ${String(item.b.references).padEnd(3)} ${lineas[l - 1].trim().slice(0, 90)}`);
  }
  process.exit(0);
}

const rutaMapa = args.find((a) => !a.startsWith('--') && a !== valor('--area') && a !== valor('--anadir'));
if (!rutaMapa) { console.error('Uso: node tools/renombrar.mjs <mapa.json> [--seco] [--area a,b] [--tolerante] [--anadir F] | --listar <archivo>'); process.exit(2); }
const contenido = JSON.parse(fs.readFileSync(rutaMapa, 'utf8'));
const tandas = Array.isArray(contenido) ? contenido : [contenido];
const opciones = { tolerante: opcion('--tolerante'), area: valor('--area')?.split(',').map((x) => x.replace(/\/$/, '')) };
let total = 0;
for (const [i, tanda] of tandas.entries()) {
  const r = aplicarTanda(tanda, opciones);
  for (const a of r.avisos) console.log('aviso: ' + a);
  if (r.errores.length) {
    for (const e of r.errores) console.error('ERROR: ' + e);
    console.error(`Tanda ${i + 1}: no se ha escrito nada.`);
    process.exit(1);
  }
  for (const x of r.resultados) {
    // Mismo formato que el resto de src/ (05-partir-modulos.mjs): prettier, 110 columnas.
    const codigo = opcion('--sin-formato') ? x.codigo : await prettier.format(x.codigo, { parser: 'babel', printWidth: 110, singleQuote: true });
    if (!opcion('--seco')) fs.writeFileSync(x.abs, codigo);
    console.log(`${rel(x.abs)}: ${x.n} enlaces renombrados, ${x.cambios} empalmes${opcion('--seco') ? ' (seco)' : ''}`);
    total += x.n;
  }
}
console.log(`Total: ${total} enlaces${tandas.length > 1 ? ` en ${tandas.length} tandas` : ''}.`);
if (valor('--anadir') && !opcion('--seco')) {
  const f = valor('--anadir');
  const lista = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : [];
  lista.push(...tandas);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(lista, null, 2) + '\n');
  console.log(`Añadida(s) ${tandas.length} tanda(s) a ${f} (${lista.length} en total).`);
}
