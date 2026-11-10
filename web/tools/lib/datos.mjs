// Extracción de datos literales (JSON) y cadenas (CSS) de los módulos envueltos.
import { recorrer } from './ast.mjs';

// ¿Es un literal puro de datos (convertible a JSON sin pérdida)?
export function esLiteralPuro(nodo) {
  let ok = true;
  recorrer(nodo, (n, padre, clave) => {
    if (!ok) return false;
    switch (n.type) {
      case 'ObjectExpression': case 'ArrayExpression': case 'StringLiteral': case 'NumericLiteral':
      case 'BooleanLiteral': case 'NullLiteral': case 'TemplateElement':
        return true;
      case 'TemplateLiteral':
        if (n.expressions.length) ok = false;
        return true;
      case 'ObjectProperty':
        if (n.computed || n.shorthand) ok = false;
        if (n.key.type === 'Identifier' && n.key.name === '__proto__') ok = false;
        if (n.key.type === 'StringLiteral' && n.key.value === '__proto__') ok = false;
        return true;
      case 'Identifier':
        // Solo como clave de propiedad.
        if (!(padre?.type === 'ObjectProperty' && clave === 'key')) ok = false;
        return true;
      case 'UnaryExpression':
        if (n.operator === '-' && n.argument.type === 'NumericLiteral' && n.argument.value !== 0) return true;
        if (n.operator === '!' && n.argument.type === 'NumericLiteral' && (n.argument.value === 0 || n.argument.value === 1)) return true;
        ok = false;
        return false;
      default:
        ok = false;
        return false;
    }
  });
  if (ok) {
    // Huecos en arrays ([1,,2]) no son JSON.
    recorrer(nodo, (n) => { if (n.type === 'ArrayExpression' && n.elements.some((e) => e == null)) ok = false; });
  }
  return ok;
}

// Evalúa un literal puro (ya validado) y comprueba que JSON lo conserva tal cual.
export function valorDeLiteral(texto) {
  // eslint-disable-next-line no-new-func
  const v = new Function(`return (${texto});`)();
  const ida = JSON.stringify(v);
  if (!igual(JSON.parse(ida), v)) throw new Error('El literal no sobrevive a JSON');
  return v;
}

function igual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) return false;
  return ka.every((k) => igual(a[k], b[k]));
}

// Valor de una cadena literal (StringLiteral o TemplateLiteral sin expresiones).
export function valorDeCadena(nodo) {
  if (nodo.type === 'StringLiteral') return nodo.value;
  if (nodo.type === 'TemplateLiteral' && nodo.expressions.length === 0) return nodo.quasis[0].value.cooked;
  throw new Error('No es una cadena literal: ' + nodo.type);
}

// Del cuerpo de un módulo de datos (una sola asignación X = valor) saca {nombre, valorNodo}.
export function asignacionUnica(cuerpo) {
  const sents = cuerpo.filter((s) => !(s.type === 'ExpressionStatement' && s.expression.type === 'CallExpression' && s.expression.arguments.length === 0));
  if (sents.length !== 1 || sents[0].type !== 'ExpressionStatement') return null;
  const e = sents[0].expression;
  if (e.type !== 'AssignmentExpression' || e.left.type !== 'Identifier') return null;
  return { nombre: e.left.name, valor: e.right, sentencia: sents[0] };
}

// Del cuerpo de un módulo __commonJS de JSON: module.exports = valor.
export function exportsDeCommonJS(init) {
  const f = init.arguments[0];
  const cuerpo = f.body.type === 'BlockStatement' ? f.body.body : null;
  if (!cuerpo || cuerpo.length !== 1) return null;
  const e = cuerpo[0].expression;
  if (e?.type !== 'AssignmentExpression' || e.left.type !== 'MemberExpression' || e.left.property.name !== 'exports') return null;
  return e.right;
}
