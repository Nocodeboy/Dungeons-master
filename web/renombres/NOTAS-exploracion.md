# Notas del área exploración (`src/explore/`, `src/scenes/`)

Fallos, rarezas y código muerto vistos durante el renombrado. **No se ha arreglado nada**: el código se
comporta igual que el publicado. Los nombres son los nuevos (tras `renombres/exploracion.json`).

## Código muerto o sin uso

- `explore/terrain.js`, `TILE_PROPS`: el 4.º valor de cada carácter (marca «difícil») no se lee nunca; la
  dificultad sale del coste (`cost > 1`).
- `explore/battle.js`, `finishBattle`: `let cp = game.store.cp;` se declara y no se usa.
- `explore/battle.js`, `simulatedBattle(explore, groups, actors)`: el parámetro `actors` no se usa.
- `explore/interact.js`, `applyLootChoice`: en `items.filter((it, k) => …)` el primer parámetro no se usa (normal
  en un filtro por índice). En `openRest`, el id del bucle `for (let [id, obj] of explore.objects)` tampoco.
- `explore/fallback-world.js`, `seededRng`: copia exacta de `seededRng` de `explore/checks.js` (mulberry32).

## Posibles fallos

- `explore/interact.js`, `tryUnlock` con el conjuro Abrir: llama a `cp_cast`, que el núcleo publicado no tiene
  (contesta «op desconocida»; `ExploreRules.call` lo silencia). La cerradura se abre igual, pero no se gasta el
  espacio de conjuro. Ya anotado en `web/MAPA.md`; a decidir con el área motor.
- `explore/interact.js`, `npcMenu`: el texto de la curación del templo nombra a «Hermana Aldis» aunque el PNJ
  sea otro (cualquier PNJ con `temple`).

## Herramienta

- `web/tools/renombrar.mjs` aplica los mapas (lista de tandas). Para volver a aplicar sobre código que ya
  tiene parte de los renombres: `node tools/renombrar.mjs renombres/exploracion.json --tolerante`.
