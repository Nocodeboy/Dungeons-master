# Notas del área mundo (`web/src/world/`)

Hallazgos durante la limpieza de nombres. **No se ha cambiado la lógica**: todo lo de aquí sigue tal cual
en el código y queda para decidir más adelante. Los nombres son los ya renombrados (mapa en `mundo.json`).

## Posibles fallos

- `buildings.js`, `buildBuildings`: el índice de fundido `idx` de los edificios del nivel crece sin límite
  (`nextIdx++`), pero `worldUniforms.uBld` solo tiene 64 entradas (`buildLevel.update` escribe
  `uBld.value[idx]`). Con más de 63 edificios con planta fallaría; las casas de las afueras sí se cortan en 62.
- `crypt.js`, `CryptWalls.decorate`: pinta la luz de las antorchas con `ground.blob(6, …)`, el número
  literal de `LAYER.light`. Si cambia el orden de `LAYER`, se rompe en silencio.
- `particles.js`, `WorldFx.setFlame`: supone 14 partículas por llama (el `count` de `buildFire`) con el
  número repetido a mano.

## Código muerto o sin efecto

- `vegetation.js`, `scatterGroundDetail`: la clave de cada trozo de hierba acaba siempre en `|0`, así que
  `tuftGeometry` solo se construye con la variante 0. Las ramas de las variantes 1 (más briznas secas) y 2
  (5 matas, todas altas) no se usan nunca.
- `vegetation.js`, `buildVegetation`: `bushes` declara `Plant_7_Big` y `Rock_Medium_2`, que nunca se llenan
  (solo se añaden `Bush_Common`, `Bush_Common_Flowers` y `Fern_1`).
- `ground.js`, `Ground.raycast`: `prevGap` se asigna en cada paso pero no se lee nunca.
- `water.js`, `buildWater`: el parámetro `quality` no se usa.
- `particles.js`, `makeParticles`: `points.frustumCulled = !!area || !0` vale siempre `true`; `area` no
  cambia nada ahí (sí se usa para la esfera envolvente).
- `kit.js`, `MeshMerger.addGeometry`: `geos.push((copy.index, copy))`: el `copy.index` de la coma no hace nada.
- `index.js`, `buildLevel`: `props` (resultado de `buildProps`, con su lista `dynamic`) y `tmpQ` (un
  `Vector3`) no se usan después de crearse.
- `index.js`, `DEFAULT_TIME`: es la identidad para todos los ambientes que tiene; solo sirve para caer en
  `'dusk'` con uno desconocido.
- `props.js`, `buildFences`: el mapa `degree` (vecinos por casilla) se rellena pero nunca se lee, y el
  `map` desestructurado no se usa.
- `props.js`: parámetros sin uso en `decorSpecial` (`queue`), `smallProp` (`queue`) y `brokenColumn`
  (`place`).
- `procedural.js`, `buildObjects`: `tickFn` es un alias de `tick` que solo usa `update`; sobra la indirección.
- `interiors.js`: `tmpMatrix` (un `Matrix4` del módulo) no se usa nunca, y el parámetro `item` de
  `buildBar` tampoco.

## Rendimiento (todo en la carga del nivel, no por fotograma)

- `ground.js`, `Ground.buildHeights`: la búsqueda en anchura de `hillDist` usa `queue.shift()` (coste
  cuadrático en casillas). Con los mapas actuales (~1 500 casillas) no se nota.
- `ground.js`, `Ground.buildHeights`: fuera del tablero llama dos veces a `exitAt(wx, wz)` por punto
  (recorre todas las salidas cada vez); se podría reutilizar el primer resultado.
- `ground.js`, `Ground.readMasks`: lee los 8 lienzos de capas con `getImageData` completo; se llama dos
  veces por nivel (`buildLevel` y `bakeMasks`).

## Duplicados

- `grid.js` repite las fórmulas de rejilla de `explore/hex.js` (`cellToWorld`, `worldToCell` ≈
  `planeToCell`, `neighbors`, `cellKey`, `HEX_SIZE`/`ROW_STEP`/`HEX_RADIUS`). Unificarlos cambiaría el bundle.
- `interiors.js` `blockGeometry` es idéntica a la de `props.js`, y `xform` hace lo mismo que
  `composeMatrix` de `kit.js` (con escala solo uniforme).
- `kit.js` `MeshMerger.addGeometry` y `bakeGeometry` invierten el orden de los triángulos con el mismo bucle.
