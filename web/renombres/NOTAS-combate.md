# Notas del área limpieza-combate

Área: `src/combat/`, `src/story/` y los módulos de la raíz de `src/` (`main.js`, `stage.js`, `scenes.js`, `bus.js`, `store.js`, `rules.js`, `assets.js`, `caps.js`, `quality.js`).

## Cómo se ha renombrado

- Mapa acumulado: `renombres/combate.json` (`archivo → {clave: nombreNuevo}`), aplicado con `node tools/renombrar.mjs renombres/combate.json --abreviar` desde `web/`. Las claves de locales llevan la ruta del ámbito (`Controller/attack/e`, `runBattle/@2/a`, `f/e#2`); el formato está explicado en la cabecera de `tools/renombrar.mjs`. Reaplicar el mapa sobre el código ya renombrado no cambia nada (las entradas aplicadas se saltan), y sobre el código original lo deja igual que en esta rama (salvo los comentarios).
- `--abreviar` escribe `{ x }` donde quedaba `{ x: x }` (misma forma de AST).
- Comprobación de cada tanda:
  1. `node build.mjs && node tools/comparar-bundles.mjs ../publicado/juego.js dist/juego.js` → las mismas 11 diferencias de partida (165 de 176 módulos idénticos en forma: A#0, 13, 16, 79, 87, 128, 129, 144, 156, 165 y 175).
  2. `tools/comparar-enlaces.mjs` entre el bundle legible (`--sin-minificar`) de la línea base y el actual: **alfa-equivalentes** (misma forma, propiedades y literales, y cada identificador apunta al mismo enlace). Esto detecta capturas de nombres, que el comparador de bundles no ve.
- Los exports con espacio de nombres (`combat/index.js`, `story/index.js`, cargados con `import()` de plantilla) conservan sus nombres originales.

## Fallos y código sospechoso (sin arreglar)

(se completa por archivo)
