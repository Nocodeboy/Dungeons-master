// Compila el juego web con esbuild y monta web/dist/ listo para servir o publicar.
//
//   node build.mjs                      -> dist/ con juego.js minificado y los recursos copiados
//   node build.mjs --sin-minificar      -> juego.js legible (para depurar)
//   node build.mjs --enlazar            -> enlaza los recursos en vez de copiarlos (pruebas rápidas)
//   node build.mjs --entrada X --salida Y
//
// Los recursos (assets/, audio/, rules/, icons.json) se toman de ../publicado/, que es la
// referencia congelada: no se duplican en git. index.html es web/index.html.
// Límites del artefacto publicado: ≤16 MB por archivo y salida ESM.
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

const RAIZ = path.dirname(new URL(import.meta.url).pathname);
const PUBLICADO = path.join(RAIZ, '..', 'publicado');
const args = process.argv.slice(2);
const opcion = (n) => args.includes(n);
const valor = (n, def) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : def; };

const entrada = path.resolve(RAIZ, valor('--entrada', 'src/main.js'));
const salida = path.resolve(RAIZ, valor('--salida', 'dist'));
const minificar = !opcion('--sin-minificar');
const enlazar = opcion('--enlazar');
const LIMITE = 16 * 1024 * 1024;
const RECURSOS = ['assets', 'audio', 'rules', 'icons.json'];

fs.rmSync(salida, { recursive: true, force: true });
fs.mkdirSync(salida, { recursive: true });

const r = await esbuild.build({
  entryPoints: [entrada],
  bundle: true,
  format: 'esm',
  minify: minificar,
  outfile: path.join(salida, 'juego.js'),
  legalComments: 'none',
  loader: { '.css': 'text' }, // las hojas de estilo se inyectan desde JS como texto
  logLevel: 'warning',
  metafile: true,
});

fs.copyFileSync(path.join(RAIZ, 'index.html'), path.join(salida, 'index.html'));
for (const rec of RECURSOS) {
  const origen = path.join(PUBLICADO, rec);
  const destino = path.join(salida, rec);
  if (enlazar) fs.symlinkSync(origen, destino);
  else fs.cpSync(origen, destino, { recursive: true });
}

// Comprobación de límites.
const grandes = [];
const revisar = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) revisar(p);
    else if (fs.statSync(p).size > LIMITE) grandes.push(p);
  }
};
revisar(salida);
if (grandes.length) {
  console.error('Archivos por encima de 16 MB:', grandes);
  process.exit(1);
}
const tam = fs.statSync(path.join(salida, 'juego.js')).size;
console.log(`dist listo en ${path.relative(RAIZ, salida)}/ · juego.js ${(tam / 1024 / 1024).toFixed(2)} MB${minificar ? '' : ' (sin minificar)'}`);
if (opcion('--meta')) fs.writeFileSync(path.join(salida, '..', 'meta.json'), JSON.stringify(r.metafile));
