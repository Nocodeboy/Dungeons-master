# Reconstrucción de Marca de Granito (web)

El 10 nov 2026 se perdió el espacio de trabajo en la nube con todo el código fuente legible de la versión web y del núcleo C++ de la semana del 3 al 8 nov. Este documento es la referencia común del equipo para reconstruirlo. **Todo en español** (código: identificadores en español o inglés como estaban; comentarios y documentos en español).

## Qué tenemos

| Carpeta | Qué es | Uso |
|---|---|---|
| `publicado/` | Copia exacta de la versión publicada «prueba 1» (7 nov): `juego.js` (juego completo, minificado con esbuild), `combate.js`, `posada.js`, `app.js` (bancos de pruebas antiguos), `rules/rules.wasm` + `rules.mjs` (núcleo C++ compilado), todos los assets y el audio. | **Referencia congelada. No se edita nunca.** Es el oráculo: la reconstrucción debe comportarse igual. |
| `referencia/pc-unreal/` | Proyecto Unreal del 24 oct: núcleo de reglas 5e portado a C++ (`Source/MarcaDeGranitoPC/Rules/*`, ~17 000 líneas), tests y paridad con Godot. Sin campaña ni creador de personajes ni puente web. | Base del nuevo `motor/`. |
| `referencia/godot-0.3.1/` | Proyecto Godot 0.3.1 (12 oct): reglas en GDScript (`scripts/core/*`, incluye `campaign.gd` y `character_sheet.gd`), creador (`scripts/ui/character_creator.gd`), datos (`data/*.json`). | Referencia de reglas para lo que falta en C++. |
| `docs/` | Diseño del juego, dirección de arte, este documento. | |

## Arquitectura que tenía la versión web (lo que hay que reconstruir)

- **Render:** three.js 0.186 empaquetado con esbuild en bundles ESM: `juego.js` (juego completo), `combate.js` (banco de combate), `posada.js` (banco de la posada), `dev_<area>.js` (bancos por área).
- **Assets:** glTF en JSON con binarios embebidos en base64 (la CSP del artefacto bloquea `fetch` de `data:`/`blob:`; los modelos se cargan como JSON y se parsean). Texturas WebP.
- **Reglas:** núcleo C++ compilado con Emscripten a `rules.wasm` + `rules.mjs`, con un puente JSON único `mdg_call(json) → json`. Operaciones conocidas (verificar contra el wasm publicado): `init`, `options`, `attack`, `cast`, `ai_turn`…; creador `sheet_new`/`sheet_set`/`sheet_options`/`sheet_finish`; campaña `cp_*`; inventario y tienda `inv*`/`shop*`; pruebas `check`/`group_check`/`passive`/`best`; mapa de exploración `xmap_*`; `battle_start`/`battle_end`; `feature`, `zone`, `move`, `cp_cast`, `monster_info`, `knock`.
- **Mapa táctico:** rejilla hexagonal odd-r, hexágonos con vértice arriba, K = 1,5 m por casilla.
- **Contexto de juego** (`game`): `bus`, `store`, `stage`, `rules`, `api`, `ui`, `audio`, `story`, `explore`, `actors`, `portrait`. Gestor de escenas: `menu`, `creator`, `prologue`, `explore`, `travel`, `ending`. El combate ocurre en el mismo mundo (`runBattle`), sin cambiar de escena.
- **Parámetros de depuración en la URL:** `?turbo` (acelera; dt máximo 0,35), `?escala`, `?depurar`, `?calidad=baja`.
- **Artefacto publicado:** límites ≤16 MB por archivo, ≤255 archivos por publicación; capacidades `db`, `downloads`, `sample`, `user`.

## Flujo del capítulo I (completo en la prueba 1)

Creador → prólogo → Merrowick (encuentro e1) → vecinos e interiores → tienda / descanso / guardar → Elderhal → Kesh → nivel 3 → túmulo → Vorhan → decisión del sello → epílogo (8 láminas) → créditos.

## Lo que se perdió y hay que rehacer después (días 7 y 8)

No todo esto falta necesariamente en la prueba 1: el inventario de QA dirá qué hay y qué no.

- Interiores jugables de la posada, el templo y la herrería.
- Reequilibrado de combates (p. ej. e1 = 3 esbirros).
- Prólogo como escena propia.
- Tutorial, libro de saber, mercenarios.
- Reacciones elegidas por el jugador (`reactions manual`/`set_manual`/`react`) y retirada del combate (`retreat_info`/`retreat`) en el núcleo y la interfaz.
- Araña gigante; mejoras de IA de los compañeros.
- Arreglos de QA: la pantalla de carga reaparecía (B2); los tooltips robaban clics (regla `#ui > .mg-tip, #ui > [data-pasante] { pointer-events: none; }`); bloqueo en flujos de historia (B3); fallos abiertos G10, P3, M11, P8, P9 (sin detalle conservado).
- En `main.js`: `manager.onProgress` solo con la carga visible y `game.scenes.busy`; `actors.setKitResolver(hoja => game.api.sheetOptions(hoja).kit)`; `game.actors = actors; game.portrait = (x, o) => actors.portrait(x, o)`.

## Estructura del repo durante la reconstrucción

```
publicado/        referencia congelada (no tocar)
web/              código fuente reconstruido (esbuild → web/dist/)
motor/            núcleo de reglas C++ (de referencia/pc-unreal) + puente web + tests de paridad
qa/               pruebas automáticas (Playwright) y sus capturas de referencia
referencia/       proyectos antiguos (solo lectura)
docs/             documentación
```

## Normas del equipo

1. Cada área trabaja en su propia copia (`git worktree`) y su rama `equipo/<area>`. Solo el coordinador integra en `main` y sube a GitHub.
2. **Nada de secretos** en el repo (contraseñas, keystores, tokens, correos).
3. Comprobar siempre contra `publicado/`: misma entrada → mismo comportamiento. Cada paso de la reconstrucción deja el juego funcionando.
4. Trabajos pesados (compilar wasm, Playwright largo) bajo `flock /tmp/mdg-pesado.lock`.
5. Commits pequeños con mensaje en español que explique qué y por qué.
