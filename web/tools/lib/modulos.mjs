// Segmentación del bundle (ya sin three) en los módulos originales.
//
// esbuild, cuando un módulo ESM se carga con import() sin code splitting, lo "envuelve":
//   var ns = {}; __export(ns, { nombre: () => local, ... });   // solo si se usa como espacio de nombres
//   function f() {...}                                          // funciones elevadas
//   var a, b, init_x = __esm(() => { init_dep1(); init_dep2(); a = ...; b = ...; });
// y los JSON importados así van como `var x = __commonJS((exports, module) => { module.exports = {...} })`.
// Los módulos sin envolver (solo importados de forma estática por la entrada) quedan al final.
import { cuerpoEsm } from './ast.mjs';

// Nombres (minificados) de los ayudantes de esbuild en publicado/juego.js.
export const AYUDANTES = {
  p5: '__create', w0: '__defProp', f5: '__getOwnPropDesc', m5: '__getOwnPropNames', g5: '__getProtoOf',
  b5: '__hasOwnProp', eh: '__glob', re: '__esm', Nc: '__commonJS', Xt: '__export', v5: '__copyProps', Fc: '__toESM',
};

export function segmentar(ast) {
  const cuerpo = ast.program.body;
  const esm = new Set(['re']);
  const modulos = [];
  // Ayudantes: hasta la última sentencia que declara alguno de ellos.
  let i = 0;
  while (i < cuerpo.length && cuerpo[i].type === 'ImportDeclaration') i++;
  const imports = cuerpo.slice(0, i);
  const declara = (s) => (s.type === 'VariableDeclaration' ? s.declarations.map((d) => d.id.name) : s.id ? [s.id.name] : []);
  while (i < cuerpo.length && declara(cuerpo[i]).some((n) => AYUDANTES[n])) i++;
  const ayudantes = { desde: imports.length, hasta: i };
  let actual = [];
  let ultimoEnvuelto = -1;
  for (let k = i; k < cuerpo.length; k++) {
    const s = cuerpo[k];
    // Módulo JSON (__commonJS): sentencia propia.
    if (s.type === 'VariableDeclaration' && s.declarations.length === 1 && s.declarations[0].init?.type === 'CallExpression' && s.declarations[0].init.callee.name === 'Nc') {
      if (actual.length) throw new Error('Sentencias sueltas antes de un módulo JSON en ' + k);
      modulos.push({ tipo: 'json', sentencias: [s], init: s.declarations[0].id.name });
      ultimoEnvuelto = k;
      continue;
    }
    actual.push(s);
    if (s.type === 'VariableDeclaration') {
      const d = s.declarations.find((d) => cuerpoEsm(d.init, esm));
      if (d) {
        modulos.push({ tipo: 'esm', sentencias: actual, init: d.id.name, decl: d, cuerpo: cuerpoEsm(d.init, esm) });
        actual = [];
        ultimoEnvuelto = k;
      }
    }
  }
  // Lo que queda tras el último módulo envuelto es la cola sin envolver.
  const cola = actual;
  return { imports, ayudantes, modulos, cola, ultimoEnvuelto };
}

// Información de un módulo envuelto: espacio de nombres, declaraciones, dependencias.
export function describir(m, initsConocidos) {
  const info = { init: m.init, tipo: m.tipo, ns: null, exportsNs: [], funciones: [], vars: [], deps: [], resto: [] };
  if (m.tipo === 'json') return info;
  for (const s of m.sentencias) {
    if (s.type === 'FunctionDeclaration') info.funciones.push(s.id.name);
    else if (s.type === 'ClassDeclaration') info.funciones.push(s.id.name);
    else if (s.type === 'VariableDeclaration') {
      for (const d of s.declarations) {
        if (d === m.decl) continue;
        if (d.init && d.init.type === 'ObjectExpression' && d.init.properties.length === 0 && !info.ns) { info.ns = d.id.name; continue; }
        if (d.init) throw new Error(`Declarador con valor fuera del cierre en ${m.init}: ${d.id.name}`);
        info.vars.push(d.id.name);
      }
    } else if (s.type === 'ExpressionStatement' && s.expression.type === 'CallExpression' && s.expression.callee.name === 'Xt') {
      const [ns, obj] = s.expression.arguments;
      if (ns.name !== info.ns) throw new Error('__export de otro espacio de nombres en ' + m.init);
      for (const p of obj.properties) {
        const exp = p.key.type === 'Identifier' ? p.key.name : p.key.value;
        info.exportsNs.push({ export: exp, local: p.value.body.name });
      }
    } else info.resto.push(s);
  }
  for (const s of m.cuerpo) {
    if (s.type === 'ExpressionStatement' && s.expression.type === 'CallExpression' && s.expression.arguments.length === 0 && initsConocidos.has(s.expression.callee.name)) info.deps.push(s.expression.callee.name);
  }
  return info;
}
