// Renombrado de identificadores consciente de ámbitos (babel `scope.rename`) a partir de un mapa JSON.
// Conserva el formato del código: el AST se renombra con babel y el texto se empalma solo en las
// posiciones de los identificadores que han cambiado.
//
// Uso (desde web/):
//   node tools/renombrar.mjs renombres/combate.json            aplica el mapa (las entradas ya aplicadas se saltan)
//   node tools/renombrar.mjs renombres/combate.json --en-seco  solo comprueba y cuenta, sin escribir
//   node tools/renombrar.mjs renombres/combate.json --solo src/combat/units.js
//   node tools/renombrar.mjs renombres/combate.json --abreviar   además escribe «{ x }» donde haya «{ x: x }»
//   node tools/renombrar.mjs --listar src/combat/units.js [--todos]
//        lista los enlaces de un archivo con su clave, línea, tipo, nº de usos y pistas
//        (propiedades que se leen de él, si se llama…). Sin --todos, solo los nombres cortos.
//
// Formato del mapa: { "src/ruta/archivo.js": { "<clave>": "nombreNuevo", … }, … }
// La clave identifica un enlace por su ámbito:
//   "Xl"                    enlace del ámbito del módulo (nivel superior)
//   "Controller/attack/e"   «e» declarado en el método «attack» de la clase «Controller»
//   "runBattle/@2/a"        «a» de la 2.ª función anónima hija directa de runBattle
//   "f/e#2"                 2.º enlace llamado «e» en f (p. ej. en otro bloque de la misma función)
// Cada segmento es el nombre de una función, clase o método (o de la variable o propiedad a la que
// se asigna la función), «@n» para la n-ésima función anónima hija y «nombre#n» si hay varias hermanas
// con el mismo nombre. Los bloques ({…}, for, catch) no son segmentos: sus enlaces cuentan en la
// función que los contiene. Un segmento puede escribirse con el nombre viejo o con el nuevo si el
// mismo mapa renombra esa función, así que el mapa acumulado se puede volver a aplicar sobre el
// código original o sobre el ya renombrado.
//
// Exports e imports: si un enlace del nivel superior se exporta con su mismo nombre, el export pasa
// a llamarse como el nuevo enlace y se actualizan los imports de todo src/. En los archivos que son
// claves del mapa también se renombra el enlace local del import (si no choca); en los demás solo
// cambia la línea del import («import { Nuevo as Viejo }»). Los módulos con espacio de nombres
// visible en el bundle (src/*/index.js, los cargados con import() y los de «import * as») conservan
// su nombre exportado: queda «export { nuevo as viejo }».
//
// Antes de cada renombrado se comprueba que el nombre nuevo no capture ni sea capturado por otro
// enlace (mismo ámbito, ámbitos interiores con ese nombre y referencias externas con ese nombre).
// Para una garantía completa, compara el bundle legible con tools/comparar-enlaces.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import { recorrer, esPosicionPropiedad } from './lib/ast.mjs';

const traverse = _traverse.default || _traverse;
const WEB = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(WEB, 'src');

const RESERVADAS = new Set(('break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield let static implements interface package private protected public await arguments eval undefined NaN Infinity').split(' '));

const analizar = (codigo) => parse(codigo, { sourceType: 'module' });
const relativa = (abs) => path.relative(WEB, abs).split(path.sep).join('/');

function listarJs(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listarJs(p));
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out.sort();
}

// ---------------------------------------------------------------------------------------------
// Modelo de ámbitos de un archivo: árbol de «dueños» (programa, funciones y clases) con etiquetas
// estables y los enlaces de cada dueño.

function nombreClave(k) {
  if (!k) return null;
  if (k.type === 'Identifier') return k.name;
  if (k.type === 'StringLiteral') return k.value;
  if (k.type === 'NumericLiteral') return String(k.value);
  if (k.type === 'PrivateName') return k.id.name;
  return null;
}

// Etiqueta base de una función o clase y, si sale de un enlace, ese enlace (para casar nombres nuevos).
function etiquetaBase(p) {
  const n = p.node, par = p.parent, clave = p.key;
  if ((p.isFunctionDeclaration() || p.isClassDeclaration()) && n.id) return { base: n.id.name, enlace: p.parentPath.scope.getBinding(n.id.name) || null };
  if (p.isClassMethod() || p.isClassPrivateMethod() || p.isObjectMethod()) return { base: n.computed ? null : nombreClave(n.key), enlace: null };
  if ((p.isFunctionExpression() || p.isClassExpression()) && n.id) return { base: n.id.name, enlace: p.scope.getBinding(n.id.name) || null };
  if (par.type === 'VariableDeclarator' && clave === 'init' && par.id.type === 'Identifier') return { base: par.id.name, enlace: p.parentPath.scope.getBinding(par.id.name) || null };
  if (par.type === 'AssignmentExpression' && clave === 'right') {
    if (par.left.type === 'Identifier') return { base: par.left.name, enlace: p.parentPath.scope.getBinding(par.left.name) || null };
    if (par.left.type === 'MemberExpression' && !par.left.computed) return { base: nombreClave(par.left.property), enlace: null };
  }
  if ((par.type === 'ObjectProperty' || par.type === 'ClassProperty' || par.type === 'ClassPrivateProperty') && clave === 'value' && !par.computed) return { base: nombreClave(par.key), enlace: null };
  if (par.type === 'AssignmentPattern' && clave === 'right' && par.left.type === 'Identifier') return { base: par.left.name, enlace: p.parentPath.scope.getBinding(par.left.name) || null };
  return { base: null, enlace: null };
}

const partirSeg = (s) => {
  const m = /^(.*?)(?:#(\d+))?$/.exec(s);
  return [m[1], m[2] ? Number(m[2]) : 1];
};

function construirModelo(codigo) {
  const ast = analizar(codigo);
  const porScope = new Map();
  let programa = null, rutaPrograma = null;
  const dueno = (scope) => { while (scope && !porScope.has(scope)) scope = scope.parent; return porScope.get(scope); };
  traverse(ast, {
    Program(p) {
      rutaPrograma = p;
      programa = { path: p, scope: p.scope, padre: null, base: null, etiqueta: null, enlaceEtiqueta: null, hijos: [], enlaces: [] };
      porScope.set(p.scope, programa);
    },
    'Function|Class'(p) {
      const padre = dueno(p.parentPath.scope);
      const { base, enlace } = etiquetaBase(p);
      const nodo = { path: p, scope: p.scope, padre, base, etiqueta: null, enlaceEtiqueta: enlace, hijos: [], enlaces: [] };
      padre.hijos.push(nodo);
      porScope.set(p.scope, nodo);
    },
  });
  // Etiquetas: «@n» para anónimas y «nombre#n» para repetidas entre hermanas (orden del código).
  const etiquetar = (nodo) => {
    let anon = 0;
    const vistos = new Map();
    for (const h of nodo.hijos) {
      if (h.base == null) h.etiqueta = '@' + ++anon;
      else {
        const k = (vistos.get(h.base) || 0) + 1;
        vistos.set(h.base, k);
        h.etiqueta = k === 1 ? h.base : `${h.base}#${k}`;
      }
      etiquetar(h);
    }
  };
  etiquetar(programa);
  // Enlaces de todos los ámbitos, asignados a su dueño.
  const ambitos = new Set([rutaPrograma.scope]);
  traverse(ast, { Scopable(p) { ambitos.add(p.scope); } });
  const vistosId = new Set();
  for (const sc of ambitos) {
    const d = dueno(sc);
    for (const [nombre, b] of Object.entries(sc.bindings)) {
      if (vistosId.has(b.identifier)) continue;
      vistosId.add(b.identifier);
      d.enlaces.push({ nombre, binding: b, pos: b.identifier.start });
    }
  }
  const rutaDe = (nodo) => (nodo.padre ? [...rutaDe(nodo.padre), nodo.etiqueta] : []);
  for (const nodo of porScope.values()) {
    nodo.enlaces.sort((a, b) => a.pos - b.pos);
    const cuenta = new Map();
    const ruta = rutaDe(nodo);
    for (const e of nodo.enlaces) {
      const k = (cuenta.get(e.nombre) || 0) + 1;
      cuenta.set(e.nombre, k);
      e.indice = k;
      e.clave = [...ruta, k === 1 ? e.nombre : `${e.nombre}#${k}`].join('/');
    }
  }
  return { ast, programa, porScope, rutaPrograma, codigo };
}

// ---------------------------------------------------------------------------------------------
// Resolución de las claves del mapa a enlaces (plan) con casado flexible de segmentos.

function resolverClaves(modelo, mapa, plan, rel) {
  const pendientes = new Set(Object.keys(mapa));
  const aplicadas = [];
  const coincide = (hijo, seg, prefijo) => {
    if (hijo.etiqueta === seg) return true;
    const [b, k] = partirSeg(seg);
    const [hb, hk] = partirSeg(hijo.etiqueta);
    if (k !== hk) return false;
    // El mapa renombra esta función y el segmento usa el nombre nuevo.
    if (hijo.enlaceEtiqueta && plan.get(hijo.enlaceEtiqueta) === b) return true;
    // El segmento usa el nombre viejo y la función ya se renombró (mapa acumulado reaplicado).
    const claveVieja = [...prefijo, seg].join('/');
    return mapa[claveVieja] === hb;
  };
  const buscar = (clave) => {
    const segs = clave.split('/');
    const nombre = segs.pop();
    let nodo = modelo.programa;
    const prefijo = [];
    for (const s of segs) {
      const cands = nodo.hijos.filter((h) => coincide(h, s, prefijo));
      if (cands.length !== 1) return { estado: cands.length ? 'ambigua' : 'no' };
      nodo = cands[0];
      prefijo.push(s);
    }
    const [nb, k] = partirSeg(nombre);
    const conNombre = (n) => nodo.enlaces.filter((e) => e.binding.identifier.name === n);
    const viejo = conNombre(nb)[k - 1];
    if (viejo) return { estado: 'ok', enlace: viejo };
    // Ya no hay enlace con el nombre viejo y sí con el nuevo: entrada ya aplicada. (El índice «#n»
    // del nombre viejo no sirve para el nuevo: varios enlaces pueden acabar llamándose igual.)
    if (conNombre(mapa[clave]).length) return { estado: 'aplicada' };
    return { estado: 'no' };
  };
  let progreso = true;
  while (progreso && pendientes.size) {
    progreso = false;
    for (const clave of [...pendientes]) {
      const r = buscar(clave);
      if (r.estado === 'ok') {
        const nuevo = mapa[clave];
        const ya = plan.get(r.enlace.binding);
        if (ya && ya !== nuevo) throw new Error(`${rel}: «${clave}» resuelve a un enlace que ya va a llamarse «${ya}»`);
        if (r.enlace.binding.identifier.name !== nuevo) plan.set(r.enlace.binding, nuevo);
        pendientes.delete(clave);
        progreso = true;
      } else if (r.estado === 'aplicada') {
        aplicadas.push(clave);
        pendientes.delete(clave);
        progreso = true;
      }
    }
  }
  if (pendientes.size) throw new Error(`${rel}: claves sin resolver (no existen o son ambiguas): ${[...pendientes].join(', ')}`);
  // Sin cadenas (a → b y b → c en el mismo ámbito): al reaplicar el mapa, la clave de «b» encontraría
  // el enlace que ya se llama «b» y el mapa dejaría de ser idempotente.
  const viejosPorAmbito = new Map();
  for (const b of plan.keys()) {
    if (!viejosPorAmbito.has(b.scope)) viejosPorAmbito.set(b.scope, new Set());
    viejosPorAmbito.get(b.scope).add(b.identifier.name);
  }
  for (const [b, nuevo] of plan) {
    for (let sc = b.scope; sc; sc = sc.parent) {
      if (viejosPorAmbito.get(sc)?.has(nuevo) && sc.getOwnBinding(nuevo) !== b) {
        throw new Error(`${rel}:${b.identifier.loc.start.line} «${b.identifier.name}» → «${nuevo}»: «${nuevo}» es también un nombre viejo del mapa en ese ámbito (cadena de renombres)`);
      }
      if (sc === b.scope) break;
    }
  }
  return aplicadas;
}

// ---------------------------------------------------------------------------------------------
// Comprobación de capturas y renombrado.

function esDescendiente(scope, ancestro) {
  for (let s = scope; s; s = s.parent) if (s === ancestro) return true;
  return false;
}

function comprobarConflictos(binding, nuevo, rel) {
  const S = binding.scope;
  const viejo = binding.identifier.name;
  const donde = `${rel}:${binding.identifier.loc.start.line} «${viejo}» → «${nuevo}»`;
  if (!/^[A-Za-z_$][\w$]*$/.test(nuevo) || RESERVADAS.has(nuevo)) throw new Error(`${donde}: nombre no válido`);
  if (S.hasOwnBinding(nuevo)) throw new Error(`${donde}: ya existe «${nuevo}» en el mismo ámbito`);
  // Una referencia al enlace dentro de un ámbito interior que declara «nuevo» quedaría capturada.
  for (const r of [...binding.referencePaths, ...binding.constantViolations]) {
    for (let s = r.scope; s && s !== S; s = s.parent) {
      if (s.hasOwnBinding(nuevo)) throw new Error(`${donde}: un ámbito interior (línea ${s.path.node.loc.start.line}) ya declara «${nuevo}»`);
    }
  }
  // Una referencia existente a «nuevo» (de fuera del ámbito o global) quedaría capturada.
  let choque = null;
  S.path.traverse({
    Identifier(p) {
      if (choque || p.node.name !== nuevo) return;
      if (esPosicionPropiedad(p.parent, p.listKey ?? p.key)) return;
      if (p.parent.type === 'ImportSpecifier' && p.key === 'imported') return;
      if (p.parent.type === 'ExportSpecifier' && p.key === 'exported') return;
      const b = p.scope.getBinding(nuevo);
      if (!b || !esDescendiente(b.scope, S)) choque = p.node.loc.start.line;
    },
  });
  if (choque) throw new Error(`${donde}: «${nuevo}» ya se usa en la línea ${choque} y quedaría capturado`);
  // Sombrear un enlace exterior no cambia nada, pero se lee peor: solo se avisa.
  for (let s = S.parent; s; s = s.parent) {
    const otro = s.getOwnBinding(nuevo);
    if (otro) { console.warn(`aviso ${donde}: sombrea a «${nuevo}» de la línea ${otro.identifier.loc.start.line}`); break; }
  }
}

// Empalma en el texto los identificadores cuyo nombre ha cambiado.
// Las propiedades «clave: valor» cuyo valor pasa a llamarse como la clave se abrevian («{ clave }»);
// con `abreviarTodo`, también las que ya eran así.
function empalmar(codigo, ast, originales, abreviadas, especificadores, propiedades = [], abreviarTodo = false) {
  const cambios = [];
  const tratados = new Set();
  for (const p of propiedades) {
    // «k: k» y, en patrones, «k: k = valor» (se sustituye solo hasta el final del identificador).
    const id = p.value.type === 'AssignmentPattern' ? p.value.left : p.value;
    if (id.name !== p.key.name || p.key.name === '__proto__') continue;
    if (!abreviarTodo && originales.get(id) === id.name) continue;
    tratados.add(id);
    cambios.push([p.start, id.end, p.key.name]);
  }
  for (const { nodo, texto } of especificadores) {
    let nuevoTexto;
    if (nodo.type === 'ImportSpecifier') {
      const imp = nodo.imported.name ?? nodo.imported.value, loc = nodo.local.name;
      nuevoTexto = imp === loc ? loc : `${imp} as ${loc}`;
    } else {
      const loc = nodo.local.name ?? nodo.local.value, exp = nodo.exported.name ?? nodo.exported.value;
      nuevoTexto = loc === exp ? loc : `${loc} as ${exp}`;
    }
    tratados.add(nodo.local);
    tratados.add(nodo.imported || nodo.exported);
    const antes = texto;
    const cambiado = (originales.get(nodo.local) !== nodo.local.name) || (originales.get(nodo.imported || nodo.exported) !== (nodo.imported || nodo.exported).name);
    if (cambiado && nuevoTexto !== antes) cambios.push([nodo.start, nodo.end, nuevoTexto]);
  }
  for (const [nodo, nombre] of originales) {
    if (tratados.has(nodo) || nodo.name === nombre) continue;
    const clave = abreviadas.get(nodo);
    cambios.push([nodo.start, nodo.end, clave !== undefined ? `${clave}: ${nodo.name}` : nodo.name]);
  }
  cambios.sort((a, b) => a[0] - b[0]);
  const trozos = [];
  let pos = 0;
  for (const [a, b, txt] of cambios) {
    if (a < pos) throw new Error('Cambios solapados en la posición ' + a);
    trozos.push(codigo.slice(pos, a), txt);
    pos = b;
  }
  trozos.push(codigo.slice(pos));
  return { texto: trozos.join(''), n: cambios.length };
}

// ---------------------------------------------------------------------------------------------
// Módulos con espacio de nombres (sus nombres exportados se ven en el bundle).

function modulosProtegidos(archivos) {
  const prot = new Set();
  for (const f of archivos) {
    const rel = relativa(f);
    if (/^src\/[^/]+\/index\.js$/.test(rel)) prot.add(f);
    const cod = fs.readFileSync(f, 'utf8');
    for (const m of cod.matchAll(/import\(\s*'([^']+)'\s*\)/g)) if (m[1].startsWith('.')) prot.add(path.resolve(path.dirname(f), m[1]));
    for (const m of cod.matchAll(/import\s*\*\s*as\s+[\w$]+\s+from\s*'([^']+)'/g)) if (m[1].startsWith('.')) prot.add(path.resolve(path.dirname(f), m[1]));
  }
  return prot;
}

// ---------------------------------------------------------------------------------------------
// Aplicación del mapa.

// Cadenas en el mapa: dos claves del mismo dueño (mismo prefijo de ruta) donde el nombre nuevo de una
// es el nombre viejo de la otra («f/b → i» y «f/i → n»). Aunque la primera aplicación salga bien, al
// reaplicar el mapa la clave «f/i» encontraría el enlace que ya se llama «i» (el antiguo «b»).
function cadenasDelMapa(rel, mapa) {
  const grupos = new Map();
  for (const [clave, nuevo] of Object.entries(mapa)) {
    const i = clave.lastIndexOf('/');
    const prefijo = i < 0 ? '' : clave.slice(0, i);
    const viejo = partirSeg(clave.slice(i + 1))[0];
    if (!grupos.has(prefijo)) grupos.set(prefijo, { viejos: new Map(), nuevos: [] });
    const g = grupos.get(prefijo);
    g.viejos.set(viejo, clave);
    g.nuevos.push([clave, nuevo]);
  }
  const errores = [];
  for (const g of grupos.values())
    for (const [clave, nuevo] of g.nuevos)
      if (g.viejos.has(nuevo) && g.viejos.get(nuevo) !== clave) errores.push(`«${clave}» → «${nuevo}» y «${g.viejos.get(nuevo)}» → «${mapa[g.viejos.get(nuevo)]}»`);
  if (errores.length) throw new Error(`${rel}: cadenas de renombres en el mapa:\n  ${errores.join('\n  ')}`);
}

function aplicarMapa(mapaTotal, { enSeco, solo, abreviarTodo }) {
  for (const [rel, mapa] of Object.entries(mapaTotal)) cadenasDelMapa(rel, mapa);
  const archivos = listarJs(SRC);
  const protegidos = modulosProtegidos(archivos);
  const propios = new Set(Object.keys(mapaTotal).map((r) => path.join(WEB, r)));
  // Fase 1: modelos y planes de cada archivo del mapa.
  const estado = new Map(); // abs -> {modelo, plan, aplicadas}
  const cargar = (abs) => {
    if (!estado.has(abs)) {
      const codigo = fs.readFileSync(abs, 'utf8');
      estado.set(abs, { modelo: construirModelo(codigo), plan: new Map(), aplicadas: [], importes: [] });
    }
    return estado.get(abs);
  };
  const objetivo = Object.entries(mapaTotal).filter(([rel]) => !solo || path.resolve(WEB, rel) === path.resolve(WEB, solo));
  for (const [rel, mapa] of objetivo) {
    const abs = path.join(WEB, rel);
    if (!fs.existsSync(abs)) throw new Error('No existe ' + rel);
    const st = cargar(abs);
    st.aplicadas = resolverClaves(st.modelo, mapa, st.plan, rel);
  }
  // Fase 2: exports que cambian de nombre -> imports de otros archivos.
  const exportsCambiados = []; // {abs, viejo, nuevo}
  for (const [abs, st] of estado) {
    const prog = st.modelo.rutaPrograma.scope;
    for (const [b, nuevo] of st.plan) {
      if (b.scope !== prog) continue;
      const viejo = b.identifier.name;
      for (const sent of st.modelo.ast.program.body) {
        if (sent.type === 'ExportNamedDeclaration' && sent.declaration) throw new Error(`${relativa(abs)}: export en declaración no soportado («${viejo}»)`);
        if (sent.type !== 'ExportNamedDeclaration' || sent.source) continue;
        for (const sp of sent.specifiers) {
          if (sp.local.name === viejo && sp.exported.name === viejo && !protegidos.has(abs)) {
            exportsCambiados.push({ abs, viejo, nuevo, sp });
          }
        }
      }
    }
  }
  for (const ex of exportsCambiados) {
    for (const f of archivos) {
      if (f === ex.abs) continue;
      const cod = fs.readFileSync(f, 'utf8');
      if (!cod.includes(ex.viejo)) continue;
      const st = cargar(f);
      for (const sent of st.modelo.ast.program.body) {
        if (!['ImportDeclaration', 'ExportNamedDeclaration'].includes(sent.type) || !sent.source) continue;
        if (path.resolve(path.dirname(f), sent.source.value) !== ex.abs) continue;
        for (const sp of sent.specifiers) {
          if (sp.type === 'ImportSpecifier' && (sp.imported.name ?? sp.imported.value) === ex.viejo) {
            st.importes.push({ nodo: sp.imported, nuevo: ex.nuevo });
            if (propios.has(f) && sp.local.name === ex.viejo) {
              const b = st.modelo.rutaPrograma.scope.getBinding(ex.viejo);
              if (b && !st.plan.has(b)) st.plan.set(b, ex.nuevo);
            }
          } else if (sp.type === 'ExportSpecifier' && sp.local.name === ex.viejo) {
            st.importes.push({ nodo: sp.local, nuevo: ex.nuevo });
          }
        }
      }
    }
  }
  // Fase 3: renombrar y empalmar archivo a archivo.
  let total = 0;
  const informe = [];
  for (const [abs, st] of estado) {
    const rel = relativa(abs);
    const { ast, codigo } = st.modelo;
    const originales = new Map();
    const abreviadas = new Map();
    const especificadores = [];
    const propiedades = [];
    recorrer(ast.program, (n) => {
      if (n.type === 'ObjectProperty' && !n.shorthand && !n.computed && n.key.type === 'Identifier' &&
        (n.value.type === 'Identifier' || (n.value.type === 'AssignmentPattern' && n.value.left.type === 'Identifier'))) propiedades.push(n);
      if (n.type === 'Identifier') originales.set(n, n.name);
      if (n.type === 'ObjectProperty' && n.shorthand) {
        const v = n.value.type === 'AssignmentPattern' ? n.value.left : n.value;
        if (v.type === 'Identifier') abreviadas.set(v, n.key.name);
      }
      if (n.type === 'ImportSpecifier' || n.type === 'ExportSpecifier') especificadores.push({ nodo: n, texto: codigo.slice(n.start, n.end) });
    });
    // Los locales primero (de dentro afuera) y el nivel superior al final.
    const orden = [...st.plan].sort((a, b) => (b[0].scope === st.modelo.rutaPrograma.scope) - (a[0].scope === st.modelo.rutaPrograma.scope));
    for (const [b, nuevo] of orden) {
      const viejo = b.identifier.name;
      if (viejo === nuevo) continue;
      comprobarConflictos(b, nuevo, rel);
      b.scope.rename(viejo, nuevo);
    }
    for (const ex of exportsCambiados) if (ex.abs === abs) ex.sp.exported.name = ex.nuevo;
    for (const im of st.importes) im.nodo.name = im.nuevo;
    // En los archivos que no son del mapa solo cambian las líneas de import.
    const { texto, n } = empalmar(codigo, ast, originales, abreviadas, especificadores, propiedades, abreviarTodo && propios.has(abs));
    if (n === 0) {
      if (st.aplicadas.length) informe.push(`${rel}: sin cambios (${st.aplicadas.length} ya aplicadas)`);
      continue;
    }
    analizar(texto); // debe seguir siendo JS válido
    total += n;
    informe.push(`${rel}: ${st.plan.size} enlaces, ${n} sitios${st.aplicadas.length ? `, ${st.aplicadas.length} ya aplicadas` : ''}`);
    if (!enSeco) fs.writeFileSync(abs, texto);
  }
  for (const l of informe) console.log(l);
  console.log(`${enSeco ? '[en seco] ' : ''}${total} identificadores cambiados`);
}

// ---------------------------------------------------------------------------------------------
// Listado de enlaces con pistas para elegir nombres.

const CORTOS_LEGIBLES = new Set();
const pareceMinificado = (n) => n.length <= 3 && !CORTOS_LEGIBLES.has(n) && !/^[a-z]{3}$/.test(n);

function listar(rel, todos) {
  const abs = path.resolve(WEB, rel);
  const codigo = fs.readFileSync(abs, 'utf8');
  const modelo = construirModelo(codigo);
  const filas = [];
  const visitar = (nodo) => {
    for (const e of nodo.enlaces) {
      const b = e.binding;
      if (!todos && !pareceMinificado(b.identifier.name)) continue;
      const props = new Set();
      let llamada = 0, nuevo = 0;
      for (const r of b.referencePaths) {
        const par = r.parent;
        if ((par.type === 'MemberExpression' || par.type === 'OptionalMemberExpression') && par.object === r.node && !par.computed) props.add(par.property.name);
        if ((par.type === 'CallExpression' || par.type === 'OptionalCallExpression') && par.callee === r.node) llamada++;
        if (par.type === 'NewExpression' && par.callee === r.node) nuevo++;
      }
      let init = '';
      const bp = b.path;
      if (bp.isVariableDeclarator() && bp.node.init) init = codigo.slice(bp.node.init.start, Math.min(bp.node.init.end, bp.node.init.start + 70));
      else if (b.kind === 'param') {
        const fn = bp.isFunction() ? bp : bp.findParent((p) => p.isFunction());
        init = fn ? 'param de ' + (codigo.slice(fn.node.start, Math.min(fn.node.body.start, fn.node.start + 50))) : '';
      }
      const pistas = [props.size ? '.' + [...props].slice(0, 12).join(' .') : '', llamada ? `llamada×${llamada}` : '', nuevo ? `new×${nuevo}` : ''].filter(Boolean).join(' ');
      filas.push(`${String(b.identifier.loc.start.line).padStart(5)}  ${e.clave.padEnd(34)} ${b.kind.padEnd(7)} ×${String(b.referencePaths.length).padEnd(3)} ${pistas}${init ? '  = ' + init.replace(/\s+/g, ' ') : ''}`);
    }
    for (const h of nodo.hijos) visitar(h);
  };
  visitar(modelo.programa);
  console.log(filas.join('\n'));
  console.error(`${filas.length} enlaces${todos ? '' : ' con nombre corto'}`);
}

// ---------------------------------------------------------------------------------------------
const args = process.argv.slice(2);
const valor = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
if (args.includes('--listar')) {
  listar(valor('--listar'), args.includes('--todos'));
} else {
  const ruta = args.find((a) => a.endsWith('.json'));
  if (!ruta) {
    console.error('Uso: node tools/renombrar.mjs <mapa.json> [--en-seco] [--solo archivo] | --listar <archivo> [--todos]');
    process.exit(2);
  }
  const mapa = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), ruta), 'utf8'));
  try {
    aplicarMapa(mapa, { enSeco: args.includes('--en-seco'), solo: valor('--solo'), abreviarTodo: args.includes('--abreviar') });
  } catch (e) {
    console.error('ERROR: ' + e.message);
    process.exit(1);
  }
}
