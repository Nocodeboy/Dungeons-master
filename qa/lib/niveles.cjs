// Extrae los niveles (objetos con id, name y rows) incrustados en un bundle de esbuild,
// p. ej. publicado/juego.js, usando el analizador de TypeScript. No ejecuta el bundle:
// solo evalúa los literales de objeto que tienen forma de nivel.
'use strict';
const fs = require('fs');

function cargarTS() {
  for (const p of ['typescript', '/opt/npm-tools/node_modules/typescript']) {
    try { return require(p); } catch {}
  }
  throw new Error('Hace falta el paquete typescript para leer el bundle');
}

function extraerNiveles(bundle) {
  const ts = cargarTS();
  const codigo = fs.readFileSync(bundle, 'utf8');
  const sf = ts.createSourceFile('b.js', codigo, ts.ScriptTarget.Latest, false, ts.ScriptKind.JS);
  const niveles = {};
  const props = (o) => new Set(o.properties.map((p) => p.name && (p.name.text ?? p.name.escapedText)).filter(Boolean));
  (function visitar(n) {
    if (ts.isObjectLiteralExpression(n)) {
      const ps = props(n);
      if (ps.has('id') && ps.has('rows') && ps.has('name') && (ps.has('objects') || ps.has('spawns'))) {
        try {
          const nivel = new Function(`return (${codigo.slice(n.getStart(sf), n.end)});`)();
          if (typeof nivel.id === 'string' && Array.isArray(nivel.rows)) { niveles[nivel.id] = nivel; return; }
        } catch {}
      }
    }
    ts.forEachChild(n, visitar);
  })(sf);
  return niveles;
}

module.exports = { extraerNiveles };

if (require.main === module) {
  const [, , bundle = 'publicado/juego.js', salida] = process.argv;
  const n = extraerNiveles(bundle);
  for (const [id, l] of Object.entries(n)) console.log(`${id}: ${l.name} · ${l.rows.length} filas · ${(l.objects || []).length} objetos · ${(l.groups || []).length} grupos`);
  if (salida) { fs.mkdirSync(salida, { recursive: true }); for (const [id, l] of Object.entries(n)) fs.writeFileSync(`${salida}/${id}.json`, JSON.stringify(l, null, 1)); }
}
