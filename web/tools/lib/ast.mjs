// Utilidades comunes de AST para la reconstrucción (análisis del bundle minificado).
import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
import * as t from '@babel/types';

export const VISITOR_KEYS = t.VISITOR_KEYS;

export function leer(ruta) {
  return fs.readFileSync(ruta, 'utf8');
}

export function analizar(codigo) {
  return parse(codigo, { sourceType: 'module', errorRecovery: false });
}

// Campos que no son hijos pero sí forman parte de la "forma" del código.
const CAMPOS_FORMA = ['operator', 'computed', 'kind', 'static', 'async', 'generator', 'prefix', 'optional', 'delegate', 'method', 'tail'];

// ¿Este identificador está en posición de nombre de propiedad (no se minifica)?
export function esPosicionPropiedad(padre, clave) {
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
    case 'ClassAccessorProperty':
      return clave === 'key' && !padre.computed;
    case 'PrivateName':
      return true;
    case 'MetaProperty':
      return true;
    case 'LabeledStatement':
    case 'BreakStatement':
    case 'ContinueStatement':
      return clave === 'label';
    default:
      return false;
  }
}

// Firma estructural: tipo de nodo + campos de forma + literales + nombres de propiedad.
// Los identificadores de enlace (variables) se sustituyen por '$'.
export function firma(nodo) {
  const partes = [];
  const visitar = (n, padre, clave) => {
    if (n == null) { partes.push('_'); return; }
    if (Array.isArray(n)) { partes.push('['); for (const x of n) visitar(x, padre, clave); partes.push(']'); return; }
    if (typeof n !== 'object' || !n.type) return;
    const ty = n.type;
    if (ty === 'Identifier') {
      partes.push(esPosicionPropiedad(padre, clave) ? '#' + n.name : '$');
      return;
    }
    // Las propiedades abreviadas ({x}) del original se escriben {x: o} al minificar: misma forma.
    partes.push('(' + ty);
    for (const c of CAMPOS_FORMA) if (n[c] !== undefined && n[c] !== null && n[c] !== false) partes.push(c + '=' + n[c]);
    switch (ty) {
      case 'StringLiteral': partes.push(JSON.stringify(n.value)); break;
      case 'NumericLiteral': partes.push(String(n.value)); break;
      case 'BigIntLiteral': partes.push(n.value + 'n'); break;
      case 'BooleanLiteral': partes.push(String(n.value)); break;
      case 'RegExpLiteral': partes.push('/' + n.pattern + '/' + n.flags); break;
      case 'TemplateElement': partes.push(JSON.stringify(n.value.raw)); break;
      case 'DirectiveLiteral': partes.push(JSON.stringify(n.value)); break;
    }
    const claves = VISITOR_KEYS[ty] || [];
    for (const k of claves) visitar(n[k], n, k);
    partes.push(')');
  };
  visitar(nodo, null, null);
  return partes.join(' ');
}

export function hash(s) {
  return crypto.createHash('md5').update(s).digest('hex').slice(0, 16);
}

// Recorre en paralelo dos nodos de igual forma y llama a fn(idMin, idRef, padre, clave)
// por cada par de identificadores en posición de enlace. Devuelve false si la forma diverge.
export function recorrerEnParalelo(a, b, fn) {
  let ok = true;
  const visitar = (x, y, padre, clave) => {
    if (!ok) return;
    if (x == null || y == null) { if (x != y) ok = false; return; }
    if (Array.isArray(x)) {
      if (!Array.isArray(y) || x.length !== y.length) { ok = false; return; }
      for (let i = 0; i < x.length; i++) visitar(x[i], y[i], padre, clave);
      return;
    }
    if (typeof x !== 'object' || !x.type) return;
    if (x.type !== y.type) { ok = false; return; }
    if (x.type === 'Identifier') {
      if (!esPosicionPropiedad(padre, clave)) fn(x, y, padre, clave);
      return;
    }
    for (const k of VISITOR_KEYS[x.type] || []) visitar(x[k], y[k], x, k);
  };
  visitar(a, b, null, null);
  return ok;
}

// Recorre todos los nodos (con padre y clave). fn puede devolver false para no bajar.
export function recorrer(nodo, fn, padre = null, clave = null) {
  if (nodo == null) return;
  if (Array.isArray(nodo)) { for (const x of nodo) recorrer(x, fn, padre, clave); return; }
  if (typeof nodo !== 'object' || !nodo.type) return;
  if (fn(nodo, padre, clave) === false) return;
  for (const k of VISITOR_KEYS[nodo.type] || []) recorrer(nodo[k], fn, nodo, k);
}

// ¿Es una llamada a un envoltorio __esm? Devuelve el cuerpo (lista de sentencias) o null.
// Formas: re(()=>{...}) (minificado) y __esm({ "ruta"() {...} }) (referencia).
export function cuerpoEsm(init, nombresEsm) {
  if (!init || init.type !== 'CallExpression' || init.callee.type !== 'Identifier') return null;
  if (!nombresEsm.has(init.callee.name)) return null;
  const arg = init.arguments[0];
  if (!arg) return null;
  if (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') {
    return arg.body.type === 'BlockStatement' ? arg.body.body : [{ type: 'ExpressionStatement', expression: arg.body }];
  }
  if (arg.type === 'ObjectExpression' && arg.properties[0]?.type === 'ObjectMethod') {
    return arg.properties[0].body.body;
  }
  return null;
}

// Descompone una lista de sentencias de nivel superior en "unidades" alineables.
export function unidades(sentencias, nombresEsm, nombresInit = new Set()) {
  const out = [];
  const deExpresion = (e, sent) => {
    if (e.type === 'SequenceExpression') { for (const x of e.expressions) deExpresion(x, sent); return; }
    if (e.type === 'AssignmentExpression' && e.operator === '=' && e.left.type === 'Identifier') {
      out.push({ tipo: 'asg', nombre: e.left.name, nodo: e.right, id: e.left, sent });
      return;
    }
    if (e.type === 'CallExpression' && e.callee.type === 'Identifier' && e.arguments.length === 0 && nombresInit.has(e.callee.name)) {
      out.push({ tipo: 'init', nombre: e.callee.name, nodo: e, sent });
      return;
    }
    out.push({ tipo: 'expr', nodo: e, sent });
  };
  const deSentencia = (s, envoltorio) => {
    switch (s.type) {
      case 'FunctionDeclaration':
      case 'ClassDeclaration':
        out.push({ tipo: s.type === 'FunctionDeclaration' ? 'fn' : 'cls', nombre: s.id.name, nodo: s, id: s.id, sent: s, envoltorio });
        break;
      case 'VariableDeclaration':
        for (const d of s.declarations) {
          const cuerpo = cuerpoEsm(d.init, nombresEsm);
          if (cuerpo) {
            out.push({ tipo: 'esm', nombre: d.id.name, nodo: d, sent: s });
            for (const x of cuerpo) deSentencia(x, d.id.name);
          } else {
            out.push({ tipo: 'var', nombre: d.id.type === 'Identifier' ? d.id.name : null, nodo: d.init, id: d.id, decl: d, sent: s, envoltorio });
          }
        }
        break;
      case 'ExpressionStatement':
        deExpresion(s.expression, s);
        break;
      default:
        out.push({ tipo: 'stmt', nodo: s, sent: s, envoltorio });
    }
  };
  for (const s of sentencias) deSentencia(s, null);
  return out;
}

// Firma de una unidad (tipo + forma del valor).
export function firmaUnidad(u) {
  switch (u.tipo) {
    case 'fn': case 'cls': {
      // La firma de la declaración sin su propio nombre.
      const n = u.nodo;
      return u.tipo + ':' + hash(firma({ ...n, id: null }));
    }
    case 'var': return 'v:' + (u.id && u.id.type !== 'Identifier' ? 'pat' + hash(firma(u.id)) : '') + (u.nodo ? hash(firma(u.nodo)) : 'vacía');
    case 'asg': return 'v:' + hash(firma(u.nodo));
    case 'init': return 'init';
    case 'esm': return 'esm';
    case 'expr': return 'e:' + hash(firma(u.nodo));
    default: return 's:' + hash(firma(u.nodo));
  }
}

// LCS clásico sobre dos listas de cadenas. Devuelve pares [i, j].
export function lcs(a, b) {
  const n = a.length, m = b.length;
  // Tabla de longitudes (n+1)*(m+1) en Uint16/Int32 según tamaño.
  const ancho = m + 1;
  const T = new Int32Array((n + 1) * ancho);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      T[i * ancho + j] = a[i] === b[j] ? T[(i + 1) * ancho + j + 1] + 1 : Math.max(T[(i + 1) * ancho + j], T[i * ancho + j + 1]);
    }
  }
  const pares = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { pares.push([i, j]); i++; j++; }
    else if (T[(i + 1) * ancho + j] >= T[i * ancho + j + 1]) i++;
    else j++;
  }
  return pares;
}
