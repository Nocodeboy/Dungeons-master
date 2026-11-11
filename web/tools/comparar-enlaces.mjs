// Comprueba que dos bundles legibles (sin minificar) son iguales salvo por los nombres de las
// variables: misma forma del AST, mismas propiedades y literales, y cada identificador apunta al
// «mismo» enlace (alfa-equivalencia). Detecta capturas de nombres que tools/comparar-bundles.mjs
// no ve, porque aquel sustituye todas las variables por «$».
//
// Uso (desde web/):
//   node build.mjs --sin-minificar --enlazar --salida /tmp/antes     (antes de renombrar)
//   node build.mjs --sin-minificar --enlazar --salida /tmp/despues   (después)
//   node tools/comparar-enlaces.mjs /tmp/antes/juego.js /tmp/despues/juego.js
//
// Cada identificador en posición de variable se reduce a «E<n>» (n = orden de primera aparición de
// su enlace) o a «G:<nombre>» si es global. Los nombres de propiedad y los literales se comparan tal
// cual. Sale con código 1 y muestra el contexto de la primera diferencia.
import fs from 'node:fs';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import { esPosicionPropiedad, VISITOR_KEYS } from './lib/ast.mjs';

const traverse = _traverse.default || _traverse;
const [a, b] = process.argv.slice(2);
if (!a || !b) {
  console.error('Uso: node tools/comparar-enlaces.mjs <antes.js> <despues.js>');
  process.exit(2);
}

const CAMPOS = ['operator', 'computed', 'kind', 'static', 'async', 'generator', 'prefix', 'optional', 'delegate', 'method', 'tail'];

function esqueleto(ruta) {
  const codigo = fs.readFileSync(ruta, 'utf8');
  const ast = parse(codigo, { sourceType: 'module' });
  // Enlace de cada identificador (resuelto con los ámbitos de babel).
  const enlaceDe = new Map();
  traverse(ast, {
    Identifier(p) {
      if (esPosicionPropiedad(p.parent, p.listKey ?? p.key)) return;
      const bnd = p.scope.getBinding(p.node.name);
      enlaceDe.set(p.node, bnd || null);
    },
  });
  const ids = new Map();
  const fichas = [];
  const posiciones = [];
  const visitar = (n, padre, clave) => {
    if (n == null) { fichas.push('_'); return; }
    if (Array.isArray(n)) { fichas.push('['); for (const x of n) visitar(x, padre, clave); fichas.push(']'); return; }
    if (typeof n !== 'object' || !n.type) return;
    if (n.type === 'Identifier') {
      if (esPosicionPropiedad(padre, clave)) fichas.push('#' + n.name);
      else {
        const bnd = enlaceDe.get(n);
        if (!bnd) fichas.push('G:' + n.name);
        else {
          if (!ids.has(bnd)) ids.set(bnd, ids.size);
          fichas.push('E' + ids.get(bnd));
        }
      }
      posiciones.push([fichas.length - 1, n.start]);
      return;
    }
    let f = '(' + n.type;
    for (const c of CAMPOS) if (n[c] !== undefined && n[c] !== null && n[c] !== false) f += ' ' + c + '=' + n[c];
    switch (n.type) {
      // Las rutas de módulo de node_modules dependen de la carpeta desde la que se compila.
      case 'StringLiteral': case 'DirectiveLiteral': f += ' ' + JSON.stringify(n.value.replace(/^.*?(node_modules\/)/, '$1')); break;
      case 'NumericLiteral': case 'BooleanLiteral': f += ' ' + String(n.value); break;
      case 'BigIntLiteral': f += ' ' + n.value + 'n'; break;
      case 'RegExpLiteral': f += ` /${n.pattern}/${n.flags}`; break;
      case 'TemplateElement': f += ' ' + JSON.stringify(n.value.raw); break;
    }
    fichas.push(f);
    posiciones.push([fichas.length - 1, n.start]);
    for (const k of VISITOR_KEYS[n.type] || []) visitar(n[k], n, k);
    fichas.push(')');
  };
  visitar(ast.program, null, null);
  return { fichas, posiciones, codigo };
}

const A = esqueleto(a), B = esqueleto(b);
let i = 0;
const max = Math.min(A.fichas.length, B.fichas.length);
while (i < max && A.fichas[i] === B.fichas[i]) i++;
if (i === max && A.fichas.length === B.fichas.length) {
  console.log(`equivalentes: ${A.fichas.length} fichas, mismos enlaces y misma forma`);
  process.exit(0);
}
const pos = (E) => { let p = 0; for (const [k, s] of E.posiciones) { if (k > i) break; p = s; } return p; };
const pa = pos(A), pb = pos(B);
console.log(`DIFERENCIA en la ficha ${i}: «${A.fichas[i]}» ≠ «${B.fichas[i]}»`);
console.log('  antes:   …' + A.codigo.slice(Math.max(0, pa - 200), pa + 200).replace(/\s+/g, ' '));
console.log('  después: …' + B.codigo.slice(Math.max(0, pb - 200), pb + 200).replace(/\s+/g, ' '));
process.exit(1);
