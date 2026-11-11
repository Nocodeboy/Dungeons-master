# Notas del área actors (limpieza de nombres)

Observaciones hechas al renombrar `web/src/actors/`. **No se ha cambiado ninguna lógica**: esto es una lista para decidir después. Los nombres son los nuevos (entre paréntesis, el minificado de la base cuando ayuda).

## Cómo reaplicar los renombres

```bash
cd web
node tools/renombrar.mjs renombres/actores.json --area src/actors/ --estricto
```

Las claves de cada archivo usan los nombres del código de partida (commit `58502c0`), así que el mapa se aplica de una vez sobre la base. La entrada `_archivos` mueve después `src/actors/outfits.js` a `src/actors/hero-stage.js` y corrige las rutas de los imports. Fuera de `src/actors/` solo cambian líneas de import, con alias (`import { makeCharacter as Fs } …`), para que cada área renombre sus locales cuando quiera.

Exports que cambian de nombre y se importan desde otras áreas:

| Archivo | Antes | Ahora | Importado en |
|---|---|---|---|
| `character.js` | `Fs` | `makeCharacter` | combat/units.js, explore/actors.js, ui/portraits.js |
| `roster.js` | `hc` | `LEGACY_PARTY` | combat/units.js, explore/actors.js, ui/portraits.js |
| `outfits.js` → `hero-stage.js` | `mu` | `HeroStage` | scenes/creator.js |
| `outfits.js` → `hero-stage.js` | `pc` | `HeroViewer` | ui/screens/creador.js, ui/screens/nivel.js |
| `outfits.js` → `hero-stage.js` | `Tv` | `legacyHeroDef` | ui/portraits.js |

Los exports de `index.js`, `look.js` y `humanoid.js` no cambian: son espacios de nombres (`game.actors`, `import('./look.js')`, `import('./humanoid.js')`).

Pendiente fuera del área: `web/MAPA.md` sigue nombrando `outfits.js (gu)`; ahora es `hero-stage.js`.

## Código muerto o parámetros sin uso

- `geometry.js` `bowGeometry`: `stringLine` (antes `s`, un `BufferGeometry.setFromPoints`) se crea y no se usa; la cuerda real es un cilindro.
- `sculpt.js` `hornsGeometry`: el bucle `for (let k = 1; k < 3; k++) { t = k / 4; point = new CatmullRomCurve3(pts).getPointAt(t) }` calcula puntos y no los usa (crea dos curvas por cuerno para nada). También `pts.map((p) => p.multiplyScalar(1))` no hace nada.
- `sculpt.js` `makeHeadSculpt`: el deformador recibe `normal` y no la usa. Las normales no se ajustan tras deformar, lo que puede notarse en orejas y hocicos muy marcados.
- `monster-parts.js` `skeletonParts`: `spine2` (posición de spine_02) se calcula y no se usa. En las costillas, `y - j * 0.008 + (k > 3, 0)` lleva una expresión con coma que siempre vale 0 (probable resto de un ajuste de las costillas bajas).
- `monster-parts.js` `ragsGeometry`: la opción `w` (anchura, 0,3 por defecto) no se usa; los radios están fijos (0,14–0,2).
- `look.js` `speciesFeatures`: el tercer parámetro (`opts`: linaje, ancestro, pronombre) no se usa.
- `beasts.js` `spiderAnimator`: no se usan ni `rand` ni el segundo argumento de `update` (el Character).
- `portraits.js` `setPortraitRenderer` (lo que hace `index.js` `setRenderer`): guarda el renderer en `externalRenderer`, que nunca se lee. Los retratos siempre crean su propio `WebGLRenderer` (otro contexto WebGL). O se aprovecha el del juego o la función sobra.
- `humanoid.js` `buildHumanoid`: `hairMat` y `gearMat` (antes `v` y `x`) son el mismo material que `atlasMat` (`v = f, x = f`). Parece que hubo materiales distintos para pelo y equipo y luego se unificaron, pero el código sigue distinguiéndolos.
- `preview.js` `createHeroPreview`: `pending` es una variable del cierre que solo se lee en la línea siguiente a asignarla; podría ser un local de `set`.

## Duplicados

- `materials.js` `detectTextureDetail` repite a mano la lectura de `?calidad` y la detección de pantalla pequeña o móvil que ya hace `quality.js` (`detectQuality`): pueden acabar dando niveles distintos.
- `roster.js` `makeStaffProp` y `hero-stage.js` `makeStaffProp` son casi iguales (bastón con gema; cambian el pomo y el color).
- `animals.js`: `ANIMAL_KINDS` repite a mano las claves de `ANIMAL_DEFS`. Si se añade un animal, hay que tocar las dos listas.

## Posibles fallos

- `hero-stage.js` `HeroStage.setHero`: con la definición antigua (cuando no hay `game.actors.makeHero`), el héroe anterior se quita de la escena pero no se libera (`dispose` solo se llama si existe `makeHero`). Cada cambio de aspecto en ese modo deja geometrías y materiales sin liberar.
- `rig.js` `loadAnimClips` depende de una bandera global sin documentar, `globalThis.__mdgSinSuelo`, que desactiva la corrección de suelo de las animaciones (de depuración, supongo).

## Rendimiento

- `humanoid.js` `measureLyingOffset` se ejecuta al construir cada humanoide: pone Death01 en un `AnimationMixer` temporal y recorre un tercio de los vértices de la primera SkinnedMesh con `getVertexPosition`. Es de lo más caro de `buildHumanoid`, y el resultado solo depende del cuerpo y de las proporciones, así que se podría cachear.
- `humanoid.js`: cada humanoide crea su propio `makeCharacterMaterial`. El programa se comparte (`customProgramCacheKey` fijo), pero hay un material con sus uniformes por personaje.
- `beasts.js` `spiderAnimator.update` crea muchos objetos por fotograma: más de una docena de `Vector3` y un `Matrix4` por pata, con 8 patas por araña. Con varias arañas en combate se nota en el recolector de basura; se podrían reutilizar temporales.
- `humanoid.js` `makeRelaxedGrip` también crea cuaterniones por mano en cada fotograma (`parentQ.clone().invert()…`).
- `animals.js` `buildAnimal` clona todos los materiales de cada animal (para teñirlos), así que no se comparten entre ejemplares de la misma especie.
- Contextos WebGL: el juego, el renderer de retratos (`portraits.js`, se libera a los 15 s) y el de `HeroViewer` (creador y subida de nivel) pueden coincidir. En móviles con pocos contextos disponibles puede ser un problema.
