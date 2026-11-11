# Notas del área limpieza-combate

Área: `src/combat/`, `src/story/` y los módulos de la raíz de `src/` (`main.js`, `stage.js`, `scenes.js`, `bus.js`, `store.js`, `rules.js`, `assets.js`, `caps.js`, `quality.js`).

## Cómo se ha renombrado

- Mapa acumulado: `renombres/combate.json` (`archivo → {clave: nombreNuevo}`), aplicado con `node tools/renombrar.mjs renombres/combate.json --abreviar` desde `web/`. Las claves de locales llevan la ruta del ámbito (`Controller/attack/e`, `runBattle/@2/a`, `f/e#2`); el formato está explicado en la cabecera de `tools/renombrar.mjs`. Reaplicar el mapa sobre el código ya renombrado no cambia nada (las entradas aplicadas se saltan), y sobre el código original lo deja igual que en esta rama (salvo los comentarios).
- `--abreviar` escribe `{ x }` donde quedaba `{ x: x }` (misma forma de AST).
- Comprobación de cada tanda:
  1. `node build.mjs && node tools/comparar-bundles.mjs ../publicado/juego.js dist/juego.js` → las mismas 11 diferencias de partida (165 de 176 módulos idénticos en forma: A#0, 13, 16, 79, 87, 128, 129, 144, 156, 165 y 175).
  2. `tools/comparar-enlaces.mjs` entre el bundle legible (`--sin-minificar`) de la línea base y el actual: **alfa-equivalentes** (misma forma, propiedades y literales, y cada identificador apunta al mismo enlace). Esto detecta capturas de nombres, que el comparador de bundles no ve.
- Los exports con espacio de nombres (`combat/index.js`, `story/index.js`, cargados con `import()` de plantilla) conservan sus nombres originales.

## Exports renombrados

Todos se importan solo dentro del área, así que ninguna otra área tiene que cambiar nada. Los exports de `combat/index.js`, `story/index.js` y de los módulos raíz (`createStage`, `SceneManager`, `Bus`, `Store`, `loadRules`, `createApi`, `getCap`, `getUserId`, `detectQuality`, `loadGLTF`, `loadProp`, `loadingManager`, `pbrMaterial`, `setAnisotropy`) no cambian.

| Archivo | Antes → ahora |
|---|---|
| `combat/creatures.js` | `a3` → `isBeast`, `jm` → `makeBeast`, `t3` → `humanoidMonsterLook` |
| `combat/hands.js` | `QS` → `anchorsOf`, `Um` → `handWorld` |
| `combat/hud.js` | `Bm` → `conditionName`, `Ec` → `formatNumber`, `cr` → `shortName` |
| `combat/overlay.js` | `Om` → `Overlay` |
| `combat/units.js` | `p3` → `createUnits` |
| `story/actions.js` | `dE` → `parseEffect`, `hE` → `rollDice`, `uE` → `DEFERRED_EFFECTS` |
| `story/conditions.js` | `eE` → `conditionAtoms`, `tE` → `evalCondition` |
| `story/data.js` | `lS` → `storyData` |
| `story/text.js` | `fm` → `formatText`, `lE` → `conditionTag`, `oE` → `SKILL_ABILITIES`, `vc` → `SKILL_NAMES`, `yc` → `ABILITY_NAMES` |

Imports de otras áreas que siguen con nombre minificado (los renombrará su área): `BS` (vfx/conditions.js) y `o1` (vfx/spells.js) en `combat/controller.js`; `Fs` (actors/character.js) y `hc` (actors/roster.js) en `combat/units.js`.

## Para el coordinador

- Si al integrar hay conflictos en mis archivos, se puede partir del `src/` de la base y aplicar `node tools/renombrar.mjs renombres/combate.json --abreviar`: reproduce mis archivos salvo los comentarios (comprobado sobre la base `58502c0`). Los comentarios hay que traerlos de esta rama.
- Los imports de mis archivos que vienen de otras áreas pueden chocar con los renombres de esas áreas; basta con quedarse con el nombre nuevo del export.
- `combat/combat.css` ya tenía su cabecera original; no se le añade nada porque se empaqueta como texto (cambiaría el bundle).

## Fallos y código sospechoso (sin arreglar)

- `story/data.js`: las claves de `DIALOG_FILES` son las originales y los nombres de archivo de `datos/historia/dialogos/` se dedujeron por el lugar donde ocurren, así que no coinciden (`sedge` → `elderhal.json`, `elderhal` → `santuario.json`, `kesh` → `odvar.json`, `runes` → `kesh.json`). No es un fallo; solo puede despistar.
- `story/runner.js`, `takeItem`: si `has_item` funciona pero `inv_drop` solo quita una parte, el paso manual de después vuelve a empezar con la cantidad completa (`remaining = count`) en vez de con lo que falta (`toDrop`), así que puede quitar de más. Solo ocurre cuando falla `cp_take` (que el núcleo publicado no tiene) y `inv_drop` falla a medias.
- `story/runner.js`, efecto `unset`: emite «flag:set» con `old: true` fijo, aunque la bandera valiera otra cosa.
- `combat/controller.js`: `this.autoParty` se lee en `loop`, `playAttack` y `playCast`, pero no se asigna nunca (ni aquí ni en otro módulo): esas ramas son código muerto. El modo «IA para todo el grupo» funciona por `meta.auto` (un `Set` que llega de explore/battle.js).
- `combat/controller.js`: `this.round1` solo se lee y se pone a `false` en `loop`; nunca vale `true` (código muerto).
- `combat/controller.js`, `tapTarget` (caso «move»): si se hace clic en otra casilla, llama a `tapIdle(creature, hit, {})` con un evento vacío; si en esa casilla hay un aliado, `hud.tip` recibe `clientX`/`clientY` indefinidos y la ficha se coloca mal.

