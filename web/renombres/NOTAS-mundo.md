# Notas del área mundo (`web/src/world/`)

Hallazgos durante la limpieza de nombres. **No se ha cambiado la lógica**: todo lo de aquí sigue tal cual
en el código y queda para decidir más adelante.

## Código muerto o sin efecto

- `vegetation.js`, `scatterGroundDetail`: la clave de cada trozo de hierba acaba siempre en `|0`, así que
  `tuftGeometry` solo se construye con la variante 0. Las ramas de las variantes 1 (más briznas secas) y 2
  (5 matas, todas altas) no se usan nunca.
- `vegetation.js`, `buildVegetation`: `bushes` declara `Plant_7_Big` y `Rock_Medium_2`, que nunca se llenan
  (solo se añaden `Bush_Common`, `Bush_Common_Flowers` y `Fern_1`).
- `ground.js`, `Ground.raycast`: `prevGap` se asigna en cada paso pero no se lee nunca.
- `water.js`, `buildWater`: el parámetro `quality` no se usa.
- `particles.js`, `makeParticles`: `points.frustumCulled = !!area || !0` vale siempre `true`; el `area` no
  cambia nada ahí (sí se usa para la esfera envolvente).

- `index.js`, `buildLevel`: `props` (resultado de `await J3(ctx)`, el atrezo) y `tmpQ` (un `Vector3`) no se
  usan después de crearse.
- `index.js`, `DEFAULT_TIME`: es la identidad para todos los ambientes que tiene; solo sirve para caer en
  `'dusk'` con uno desconocido.

- `props.js`, `buildFences`: el mapa `degree` (vecinos por casilla) se rellena pero nunca se lee, y el
  `map` desestructurado no se usa.
- `props.js`: parámetros sin uso en `decorSpecial` (`queue`), `smallProp` (`queue`) y `brokenColumn`
  (`place`).

- `procedural.js`, `buildObjects`: `tickFn` es un alias de `tick` que solo usa `update`; sobra la indirección.

## Duplicados

- `grid.js` repite las fórmulas de rejilla de `explore/hex.js` (`cellToWorld`, `worldToCell` ≈
  `planeToCell`, `neighbors`, `cellKey`, `HEX_SIZE`/`ROW_STEP`/`HEX_RADIUS`). Unificarlos cambiaría el bundle.
