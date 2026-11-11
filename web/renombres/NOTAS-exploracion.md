# Notas del área exploración (`src/explore/`, `src/scenes/`)

Fallos, rarezas y código muerto vistos durante el renombrado. **No se ha arreglado nada**: el código se
comporta igual que el publicado. Los nombres son los nuevos (tras `renombres/exploracion.json`).

## Código muerto o sin uso

- `explore/terrain.js`, `TILE_PROPS`: el 4.º valor de cada carácter (marca «difícil») no se lee nunca; la
  dificultad sale del coste (`cost > 1`).
- `explore/battle.js`, `finishBattle`: `let cp = game.store.cp;` se declara y no se usa.
- `explore/battle.js`, `simulatedBattle(explore, groups, actors)`: el parámetro `actors` no se usa.

- `explore/fallback-world.js`, `seededRng`: copia exacta de `seededRng` de `explore/checks.js` (mulberry32).

## Posibles fallos

## Herramienta

- `web/tools/renombrar.mjs` aplica los mapas (lista de tandas). Para volver a aplicar sobre código que ya
  tiene parte de los renombres: `node tools/renombrar.mjs renombres/exploracion.json --tolerante`.
