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
- `explore/input.js`, `_bind`: el manejador `wheel: () => {}` se define pero nunca se registra.
- `scenes/creator.js` y `scenes/travel.js`: las ramas «la exploración aún no está montada en esta versión» no
  se ejecutan nunca (main.js siempre registra la escena `explore`).
- `explore/interact.js`: `import './checks.js'` solo conserva el orden de inicialización del bundle original.

## Posibles fallos

- `explore/interact.js`, `tryUnlock` con el conjuro Abrir: llama a `cp_cast`, que el núcleo publicado no tiene
  (contesta «op desconocida»; `ExploreRules.call` lo silencia). La cerradura se abre igual, pero no se gasta el
  espacio de conjuro. Ya anotado en `web/MAPA.md`; a decidir con el área motor.
- `explore/interact.js`, `npcMenu`: el texto de la curación del templo nombra a «Hermana Aldis» aunque el PNJ
  sea otro (cualquier PNJ con `temple`).

## Exports y nombres compartidos

- Ningún export usado fuera del área ha cambiado: `explore/hex.js` ya tenía sus nombres reales, y los módulos
  que se cargan como espacio de nombres (`explore/index.js`, `explore/detection.js`, `scenes/*.js`) conservan
  los suyos porque están en el bundle publicado (`create`, `buildBackdrop`, `createExplore`, `Explore`, `SPEED`,
  `neighbors`, `perceive`, `search`…).
- Exports internos renombrados (solo los importan archivos del área): `Tm`→`ExploreMap`, `uk`→`loadAreaModules`,
  `Em`→`ExploreRules`, `wu`→`SKILL_LABELS`, `i0`→`Floaters`, `r0`→`ExploreMarks`, `g0`→`AmbientAnimals`,
  `b0`→`Banter`, `kk`→`createExploreHud`, `Rk`→`fallbackDialog`, `Ck`→`lootDialog`, `W1`→`showInterlude`,
  `yk`→`createActorFactory`, `mk`→`buildFallbackWorld`, `Uk`→`attackEnemy`, `Uo`→`startBattle`,
  `Gk`→`withdrawGroup`, `Ju`→`lootOf`, `Wu`→`storyInteract`, `Xk`→`useObject`, `Xu`→`revealObject`,
  `Yk`→`talkToMember`, `Zk`→`hoverInfo`, `cy`→`springTrap`, `m0`→`talkToNpc`, `uy`→`openRest`.
- Imports de otras áreas que se dejan con su nombre actual (para no tocar sus líneas): `Fs` (actors/character.js),
  `hc` (actors/roster.js), `mu` (actors/outfits.js), `im` (ui/travel-map.js), `Xl`, `Yl`, `Kl` (ui/dom.js). Cuando
  esas áreas los renombren, sus herramientas cambiarán estas líneas de import.

## Herramienta

- `web/tools/renombrar.mjs` aplica los mapas (lista de tandas). Para volver a aplicar sobre código que ya
  tiene parte de los renombres: `node tools/renombrar.mjs renombres/exploracion.json --tolerante`.
- Comprobado: aplicar `renombres/exploracion.json` (11 tandas, 2419 enlaces) sobre el `src/` del commit
  58502c0 da el mismo código que esta rama, salvo los comentarios.
- Verificación final (11 nov): `node build.mjs` + `tools/comparar-bundles.mjs` igual que la base (165/176) y
  `tools/verificar.cjs --hasta combate` sin errores (Merrowick a los 149 s, combate e1 a los 715 s; el único
  aviso es el del controlador de SwiftShader).
