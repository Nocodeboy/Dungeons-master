// Comparación estática de dos bundles de esbuild módulo a módulo, ignorando nombres de variables.
// Segmenta ambos en sus módulos envueltos (__esm/__commonJS), los empareja por orden y compara la
// secuencia de firmas de forma de sus unidades (funciones, declaradores, asignaciones del cierre).
// Las llamadas init y los módulos de three se ignoran.
//
// Uso: node tools/comparar-bundles.mjs [publicado/juego.js] [dist/juego.js]
import { leer, analizar, unidades, firmaUnidad, cuerpoEsm, lcs } from './lib/ast.mjs';

const RAIZ = new URL('..', import.meta.url).pathname;
const [a = RAIZ + '../publicado/juego.js', b = RAIZ + 'dist/juego.js'] = process.argv.slice(2);

function modulos(ruta) {
  const cod = leer(ruta);
  const ast = analizar(cod);
  const cuerpo = ast.program.body;
  // Ayudante __esm: la función flecha con `if(x)throw x[0]` y __commonJS: `exports:{}`.
  let esm = null, cjs = null;
  for (const s of cuerpo.slice(0, 20)) {
    if (s.type !== 'VariableDeclaration') continue;
    for (const d of s.declarations) {
      const t = cod.slice(d.start, d.end);
      if (/throw \w+\[0\]/.test(t)) esm = d.id.name;
      if (/exports:\s*\{\}/.test(t) && !/__esModule/.test(t)) cjs = d.id.name;
    }
  }
  const esmSet = new Set([esm]);
  const inits = new Set();
  for (const s of cuerpo) if (s.type === 'VariableDeclaration') for (const d of s.declarations) if (cuerpoEsm(d.init, esmSet)) inits.add(d.id.name);
  const mods = [];
  let actual = [];
  for (const s of cuerpo) {
    actual.push(s);
    if (s.type === 'VariableDeclaration' && s.declarations.some((d) => cuerpoEsm(d.init, esmSet) || (d.init?.type === 'CallExpression' && d.init.callee.name === cjs))) {
      mods.push(actual);
      actual = [];
    }
  }
  mods.push(actual); // cola sin envolver
  return mods.map((sents) => {
    const us = unidades(sents, esmSet, inits).filter((u) => u.tipo !== 'init' && u.tipo !== 'esm');
    // Las sentencias __export(ns, {...}) dependen de los nombres de export: se comparan aparte.
    return { texto: cod.slice(sents[0]?.start ?? 0, (sents[0]?.start ?? 0) + 60), firmas: us.map(firmaUnidad), n: us.length,
      textos: us.map((u) => cod.slice((u.nodo ?? u.sent).start, (u.nodo ?? u.sent).end)) };
  });
}

const A = modulos(a), B = modulos(b);
// Los módulos de three ocupan los primeros puestos del publicado (6 envueltos) y no están en el
// recompilado en el mismo sitio; se emparejan por orden los del juego: se busca el desplazamiento.
console.log(`módulos: ${A.length} (A) y ${B.length} (B)`);
let iguales = 0, distintos = [];
// Emparejamiento por LCS de las firmas concatenadas de cada módulo.
const claveA = A.map((m) => m.firmas.join('|')), claveB = B.map((m) => m.firmas.join('|'));
const pares = lcs(claveA, claveB);
const usadosA = new Set(pares.map(([i]) => i)), usadosB = new Set(pares.map(([, j]) => j));
iguales = pares.length;
const soloA = A.map((m, i) => [i, m]).filter(([i]) => !usadosA.has(i));
const soloB = B.map((m, i) => [i, m]).filter(([i]) => !usadosB.has(i));
console.log(`módulos idénticos en forma: ${iguales}; solo en A: ${soloA.length}; solo en B: ${soloB.length}`);
// Los no emparejados se casan por posición entre anclas y se detalla la primera divergencia.
const anclas = [[-1, -1], ...pares, [A.length, B.length]];
const casados = [];
for (let k = 0; k + 1 < anclas.length; k++) {
  const [a0, b0] = anclas[k], [a1, b1] = anclas[k + 1];
  for (let x = a0 + 1, y = b0 + 1; x < a1 && y < b1; x++, y++) casados.push([x, y]);
}
for (const [i, j] of casados) {
  const m = A[i], n = B[j];
  const pp = lcs(m.firmas, n.firmas);
  console.log(`  A#${i} ~ B#${j}: ${pp.length}/${m.n} unidades iguales · ${m.texto.replace(/\s+/g, ' ')}`);
  if (!process.argv.includes('--detalle') || m.n > 500) continue;
  const ia = new Set(pp.map(([x]) => x)), ib = new Set(pp.map(([, y]) => y));
  const da = m.firmas.map((_, k) => k).filter((k) => !ia.has(k)), db = n.firmas.map((_, k) => k).filter((k) => !ib.has(k));
  for (let k = 0; k < Math.max(da.length, db.length); k++) {
    const ta = da[k] != null ? m.textos[da[k]] : '', tb = db[k] != null ? n.textos[db[k]] : '';
    // Primera diferencia en el texto con nombres normalizados (identificadores -> _).
    const norm = (t) => t.replace(/(?<![\w$])[A-Za-z_$][\w$]*(?![\w$])/g, (w) => (/^(return|function|let|const|var|new|this|typeof|if|else|for|of|in|async|await|class|extends|null|void|true|false|switch|case|break|continue|throw|try|catch|finally|do|while|delete|instanceof|default)$/.test(w) ? w : '_'));
    const na = norm(ta), nb = norm(tb);
    let q = 0; while (q < na.length && na[q] === nb[q]) q++;
    console.log('     A …' + na.slice(Math.max(0, q - 120), q + 120).replace(/\s+/g, ' '));
    console.log('     B …' + nb.slice(Math.max(0, q - 120), q + 120).replace(/\s+/g, ' '));
  }
}
