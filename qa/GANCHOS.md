# Ganchos de prueba de Marca de Granito (versión publicada «prueba 1»)

Inventario de todo lo que permite automatizar el juego, sacado de `publicado/juego.js` (minificado con esbuild, pero con nombres de propiedades y textos legibles) y comprobado en el navegador con Playwright. **Es también el contrato que la reconstrucción (`web/`) tiene que respetar** para que el arnés (`qa/flujo.cjs`, `qa/humo.cjs`) funcione igual contra las dos.

Leyenda: ✅ verificado en ejecución · 📖 leído en el código, no ejercitado por el arnés.

## 1. Parámetros de URL

Se leen de un único `URLSearchParams(location.search)` global (en el bundle se llama `Qn`), que además se expone como `game.params`. **Es un objeto vivo**: cambiar `__mdg.params.set('semilla', '7')` afecta a los combates siguientes sin recargar.

| Parámetro | Efecto | Dónde |
|---|---|---|
| `?depurar` ✅ | Expone `window.__mdg` (contexto `game`), `window.__combate` (controlador del combate en curso: `{ctl, vfx, units, board, hud}`) y `window.__sonido` (audio). Activa la traza de clics de exploración (`explore._trace`, últimas 80 líneas) y escribe en consola los tiempos de carga de cada nivel. | arranque, `runBattle`, audio, exploración |
| `?turbo` / `?turbo=N` ✅ | Con el parámetro presente: paso máximo del bucle 0,35 s (en vez de 1/20), combate a velocidad ×5 (`ctl.turbo = 5`). Con valor numérico (`?turbo=4`) además multiplica por N la velocidad de la exploración (caminar, PNJ, animaciones). `?turbo` sin valor deja la exploración a ×1. | bucle principal, `y0.turbo`, `runBattle` |
| `?escala=F` ✅ | Fuerza la relación de píxeles del render (0,2–2). `0.5` divide por 4 el coste de render en SwiftShader. | arranque |
| `?calidad=baja\|media\|alta` ✅ | Fija el nivel gráfico (0/1/2) y desactiva el ajuste automático de calidad. Sin él, el juego baja de calidad solo si va a menos de 24 fps. | `W_`, `AN` |
| `?escena=NOMBRE` ✅ | Arranca directamente en esa escena (`menu`, `creator`, `explore`, `travel`, `ending`). **Todos los parámetros de la URL se pasan como parámetros de la escena** (`Object.fromEntries(params)`): `level`, `spawn`, `cell`, `clase`, `especie`, `paso`, `to`, `from`… | arranque |
| `?escena=explore&level=L&spawn=S` ✅ | Entra en un nivel (`merrowick`, `posada`, `elderhal`, `kesh`, `tumulo`) con una partida nueva por defecto si no hay ninguna (héroe de serie «Aren», nivel 1). | `ES()` |
| `?grupo=completo\|odvar` ✅ | Solo al crear esa partida por defecto: `completo` = Brenna, Pip, Ilyra; `odvar` = Brenna, Pip, Odvar; sin él, solo Brenna. | `ES()` |
| `?banderas=a,b=valor` 📖 | Banderas iniciales de esa partida por defecto (`flags.a = true`, `flags.b = "valor"`). Sirve para saltar a mitad de capítulo: `?escena=explore&level=merrowick&banderas=e1_done,quest_camp`. | `ES()` |
| `?escena=creator&clase=wizard&especie=elf&paso=look` 📖 | Creador con clase/especie preelegidas y abierto en un paso. | `cD()` |
| `?escena=travel&to=LUGAR` 📖 | Mapa de viaje que selecciona el destino y viaja solo a los 0,5 s. | `dD()` |
| `?semilla=N` ✅ | Semilla de cada combate (`battle_start.seed`). Sin ella, `Math.random()`. Con la misma semilla y el mismo estado, el combate es reproducible. | `Uo()` |
| `?autocombate` ✅ | La IA controla a **todo** el grupo, héroe incluido. Sin él, solo a los compañeros si `settings.autoCompanions` (por defecto sí). | `Uo()` |
| `?autonivel` ✅ | Las subidas de nivel tras combate se aplican solas, sin abrir la pantalla `nivel`. **Ojo:** la subida a nivel 3 tras Kesh (`story.levelUp(3)`) no mira este parámetro y abre la pantalla `nivel` igualmente. | `pN()` |
| `?captura=N` 📖 | Para el bucle de render N fotogramas después de `ready` y pone `document.title = "listo"` (capturas estáticas). También desactiva la calidad adaptativa y el modo «disparo» del combate (`shotMode`). | bucle principal |
| `?captura-nitida` ✅ | Desactiva el desenfoque «maqueta» (tilt-shift) de la exploración: capturas más comparables. | `gy()` |
| `?audio=no\|buffer` 📖 | `no`: audio desactivado; `buffer`: sin streaming. | `jv()` |
| `?encuentro=`, `?nivel=` 📖 | Solo en el banco `combate.html` (selector de encuentro e1_prado / e2_pinar / e3_tumulo y nivel). | banco de combate |

Combinación que usa el arnés: `?depurar&turbo=4&calidad=baja&escala=0.5&autocombate&autonivel&semilla=42&captura-nitida`.

## 2. Objetos en `window`

| Objeto | Condición | Contenido |
|---|---|---|
| `window.__mdg` | `?depurar` | El contexto `game` (ver §3). |
| `window.__combate` | `?depurar`, durante un combate | `{ctl, vfx, units, board, hud}`. `ctl.state` es el estado del núcleo (`creatures`, `current`, `round`, `over`); `ctl.turbo`; `ctl.toggleAuto(id)`. |
| `window.__sonido` | `?depurar` | Fachada de audio (`names()`, `musicName`, `unlocked`, `credits()`…). |
| `window.__mdgSinSuelo` | se lee | Si es `true` antes de cargar, no se recolocan las animaciones al suelo (depuración de animaciones). |
| `window.claude` | lo da el anfitrión de artefactos | `use('db' \| 'user' \| 'downloads' \| 'sample')`. En local no existe: el juego cae a `localStorage` y a narración sin IA. |

## 3. El contexto `game` (`window.__mdg`)

```
{ params, bus, store, stage, quality, rules, api, ui, audio, story, caps, errors, go(escena, params),
  scenes, actors, portrait(x, o), explore, battle, ready, framesReady, playtimeTick }
```

- **`ready`** (bool): `true` cuando ha terminado la primera `go()`. El arnés espera a `__mdg.ready && !__mdg.scenes.busy` y a que `#carga` esté oculto.
- **`errors`**: array con los mensajes de `error` y `unhandledrejection` de la página (máx. 160 caracteres cada uno).
- **`scenes`**: gestor de escenas. `name` (escena actual), `current` (objeto de la escena; en exploración `current.explore` es la instancia interna completa), `busy` (promesa de la transición en curso), `registry` (Map). Escenas registradas: `menu`, `creator`, `explore`, `travel`, `ending`. **No hay escena `prologue`**: el prólogo es una pantalla `relato` + el diálogo `prologue` dentro de la escena del creador.
- **`go(nombre, params)`**: cambia de escena (con fundido).
- **`bus`**: `on(evento, f)` (devuelve la baja), `once`, `emit`. `on('*', ({name, data}) => …)` recibe todos. Eventos útiles: `scene:enter`/`scene:leave`, `level:enter`/`level:leave`, `game:start`, `game:saved`, `game:loaded`, `cp:changed`, `flag:set`, `quest:update`, `journal:add`, `dialog:open {id, npc}`/`dialog:close`, `ui:open {name}`/`ui:close`, `battle:start {group, groups, surprise, level}`/`battle:end {won, fled}`, `battle:turn`, `levelup {level}`, `travel {from, to, hours}`, `trigger`, `interact`, `loot:taken`, `item:gain`, `trap:triggered`/`trap:disarmed`, `hidden:found`, `companion:join`/`companion:leave`, `approval`, `decision`, `banter`, `rest:short`/`rest:long`, `game:over`, `ui:error`, `step` (muy frecuente).
- **`store`**: estado persistente. `cp` (documento de campaña: `party`, `members`, `state` [PV por miembro], `gold`, `party_level`, `day`, `hour`, `flags`, `journal`, `levels` [estado por nivel], `location`, `story`, `playtime`), `settings`, `flag(n)`, `setFlag(n, v)`, `start(cp)`, `set(cp)`, `save(ranura)`, `load(ranura)`, `list()`, `remove(ranura)`, `exportSlot`, `importFile`, `levelState(nivel)`.
- **`rules(op, args)`**: llamada cruda al núcleo wasm (`mdg_call` con `{op, ...args}` en JSON). **`api`**: envoltorio con nombres en camelCase (70 funciones: `sheetNew`, `cpNew`, `cpLongRest`, `shop`, `shopBuy`, `check`, `xmapPath`, `battleStart`, `aiTurn`, `endTurn`…; `api.call(op, args)` avisa en consola si hay `error`). Ver §8.
- **`story`**: motor de historia. `data` (todo el guion: 41 diálogos, 105 banderas, 6 misiones, 9 combates, disparadores, objetos, conversaciones de campamento, epílogo…), `active` (id del diálogo abierto), `_inFlow`, `quests()`, `questState(id)`, `talk(id)`, `interact({object, kind})`, `trigger(id)`, `run(dialogo, ctx, nodo)`, `test(condición)`, `setFlag`, `decide`, `approve`, `recruit`, `hire`, `rest`, `levelUp(n)`, `prologue()`, `playEpilogue()`, `codex()` (el «saber»), `debug.rollMode` (`"real"` | `"success"` | `"failure"`: fuerza el resultado de las pruebas de característica de los diálogos).
- **`explore`** (solo en exploración): API pública de la escena: `level`, `levelId`, `world`, `inBattle`, `isBusy`, `moveParty(celda)` (promesa: `true` al llegar, `false` si se cancela), `travel(nivel, spawn)` (`travel("travel")` abre el mapa), `startBattle(grupo, opts)`, `removeGroup`, `spawnNpc`, `removeNpc`, `moveNpc`, `setObjectState`, `objectState`, `members()`, `leader()`, `cell(id)`, `actor(id)`, `say`, `narrate`, `toast`, `hint`, `refresh()`.
- **`scenes.current.explore`** (instancia interna de la exploración): `npcs` (Map id → `{def, actor, cell}`), `objects` (Map id → definición del nivel), `groups` (Map id → `{def, enemies[], alerted, hidden}`), `members`, `lead()`, `xmap` (`walkable`, `path`, `freeNear`, `los`, `rows`), `blocked()`, `pick(x, y)` (qué hay bajo un punto de pantalla), `onTap(x, y)` (el mismo camino que un clic), `entered`, `ls` (estado del nivel: `found`, `opened`, `dead`, `fired`, `npcGone`…), `camera`, `_trace`.
- **`ui`**: `open(pantalla, opts)`, `close(nombre)`, `isOpen(n)`, `has(n)`, `layers.stack` (pantallas abiertas: `[{name, close()}]`), `layers.top`, `dialog(nodo)` → índice elegido, `dialogOpen()`, `toast(texto, tipo)`, `confirm`, `message`, `loading(texto, fracción)`, `resume()` (reanuda la partida cargada en `store.cp`), `quickSave()` (ranura `rapida`), `hud`, `keys` (`disabled`, `set`, `reset`). Pantallas: `inventario`, `tienda`, `descanso`, `grupo`, `diario`, `guardar`, `cargar`, `ajustes`, `nivel`, `botin`, `viaje`, `pausa`, `creador`, `creditos`, `ayuda`, `relato`, `derrota`, más `confirmar` y `aviso` (modales).

## 4. Guardado (`localStorage`)

Prefijo `mdg.`. Si el anfitrión ofrece `window.claude.use('db')` y un usuario, guarda **también** en la nube (`data/users/<id>/partida_<ranura>`); en local solo `localStorage`.

| Clave | Contenido |
|---|---|
| `mdg.settings` | Ajustes: `{music, sfx, ambience, quality: "auto", textSpeed: 1, narratorAI: true, autoCompanions: true, confirmEndTurn: true, tips: true, cameraSpeed: 1, …}`. |
| `mdg.partida.<ranura>` | `{meta: {slot, hero, cls, level, place, day, playtime, party, savedAt}, data: "<cp en JSON>"}`. Ranuras: `auto` (al entrar en cada nivel, tras combates y descansos), `rapida` (F5), `1`, `2`, `3`… |

Ajustes que fija el arnés antes de cargar: `textSpeed: 100` (≥ 50 = texto instantáneo en diálogos y relatos), `narratorAI: false`, `tips: false` (sin consejos que tapen la pantalla), volúmenes a 0, `confirmEndTurn: false`.

Para empezar en un punto concreto basta con escribir un `mdg.partida.auto` antes de cargar y pulsar «Continuar» en el menú (`.mg-menu-btn[data-k="continuar"]`).

## 5. Cómo avanzar diálogos y relatos

- **Diálogo** (`section.mg-dlg`, no oculto y sin la clase `fuera`): opciones en `button.mg-dlg-opt` (texto en `.mg-dlg-t`, etiqueta de prueba en `.mg-dlg-tag`, `disabled` si no se puede). Quien habla en `.mg-dlg-name`. Mientras se escribe el texto hay una `.mg-dlg-line.escribiendo`. Teclas: `1`–`9` eligen; `Espacio`/`Intro` completan el texto o eligen la única opción. **Cuidado:** el cuadro es `position: fixed`, así que `offsetParent` es `null` aunque se vea; hay que mirar `getBoundingClientRect()`.
- El id del diálogo de historia llega por el evento `dialog:open {id}`. Los menús de PNJ sin guion (Comerciar / Pasar la noche / Preguntar / Adiós), escaleras y cofres usan el mismo cuadro sin `dialog:open`.
- **Relato** (`.mg-layer[data-capa="relato"]`): botón principal `.mg-relato-foot-r .mg-btn--primary` («Continuar»); con `textSpeed ≥ 50` sale todo el texto de golpe y el primer clic cierra.
- Alternativa programática: sustituir `__mdg.ui.dialog` por una función que devuelva el índice. El arnés no lo hace para que la interfaz también quede probada.

## 6. Cómo resolver combates rápido

- `?autocombate` + `?turbo` (+ `?semilla=N` para reproducir). El combate ocurre dentro de la escena de exploración (`explore.inBattle`), termina con `battle:end {won, fled}` y vuelve solo a exploración.
- Durante el combate, `__combate.ctl.toggleAuto(id)` pasa un personaje a IA en caliente.
- Derrota → pantalla `derrota` con «Cargar la última partida» (ranura `auto`). El piloto cambia `__mdg.params.semilla` y recarga.
- No hay atajo para ganar un combate al instante (ni «matar a todos»), ni retirada (`retreat` no existe en el núcleo publicado); el único `fled: true` lo produce la recuperación de un error de combate.

## 7. Cómo moverse e interactuar en exploración

- Mover: `await __mdg.explore.moveParty([col, fila])` (rejilla hex odd-r, ver `scenes.current.explore.xmap`). Al entrar en casillas pueden saltar disparadores (narraciones), trampas o la detección de enemigos (radio `sight`, 8 por defecto, con línea de visión), que cancelan el movimiento.
- Hablar con un PNJ / usar un objeto como el jugador: proyectar `npc.actor.root.position` con la cámara (`__mdg.stage.camera`) a coordenadas de pantalla, comprobar con `scenes.current.explore.pick(x, y)` que apunta al objetivo y hacer clic en el lienzo. El juego acerca al grupo y abre la conversación. Fallback: `scenes.current.explore.onTap(x, y)`.
- Viajar: salidas del nivel (casillas `exits`) o `__mdg.explore.travel('travel')` → escena `travel` con el mapa (`.mg-map` y botón «Viajar»); `__mdg.go('travel', {to: 'elderhal'})` viaja solo.

## 8. Operaciones del núcleo wasm publicado

Verificadas llamando a `__mdg.rules(op, {})` con todas las cadenas candidatas del binario (las desconocidas responden `op desconocida`):

`init`, `state`, `options`, `threats`, `move`, `undo_move`, `attack_plan`, `attack`, `offhand`, `spell_begin`, `spell_preview`, `cast`, `simple_targets`, `simple`, `feature`, `ai_turn`, `end_turn`, `battle_start`, `battle_end`, `data`, `loc`, `monster_info`, `item_info`, `sheet_new`, `sheet_set`, `sheet_options`, `sheet_complete`, `sheet_validate`, `sheet_finish`, `sheet_summary`, `random_name`, `level_choices`, `levelup_begin`, `cp_new`, `cp_load`, `cp_recruit`, `cp_dismiss`, `cp_hire`, `cp_rest`, `cp_short_rest`, `cp_long_rest`, `cp_level_up`, `cp_level_state`, `cp_gold`, `cp_give`, `cp_heal`, `cp_damage`, `cp_pass_hours`, `cp_revive`, `cp_cast`, `party_summary`, `identify`, `inv`, `inv_preview`, `inv_equip`, `inv_unequip`, `inv_give`, `inv_use`, `inv_drop`, `shop`, `shop_buy`, `shop_sell`, `check`, `group_check`, `passive`, `best`, `xmap_load`, `xmap_path`, `xmap_los`, `xmap_walkable`, `xmap_reach`, `xmap_free`, `xmap_cell`.

**No existen** en el wasm publicado: `reactions`, `set_manual`, `react`, `retreat_info`, `retreat`, `zone`, `knock` (los dos últimos figuraban como «conocidos» en `docs/RECONSTRUCCION.md`).

## 9. Lo que usa el arnés (contrato mínimo para `web/dist/`)

1. `?depurar` → `window.__mdg` con `ready`, `scenes.{name,busy,current}`, `bus.on('*')`, `store.cp`, `store.settings`, `story.{quests,active,_inFlow}`, `ui.{layers.stack, layers.top, dialogOpen}`, `params` vivo, `errors`, `stage.{camera,renderer}`, `explore.moveParty`.
2. `scenes.current.explore` con `npcs`, `objects`, `members`, `lead()`, `inBattle`, `isBusy()`, `entered`, `xmap.{walkable,freeNear}`, `blocked()`, `pick()`, `onTap()`, `anchorOf()`, `world.cellToWorld()`.
3. Los parámetros `turbo`, `calidad`, `escala`, `autocombate`, `autonivel`, `semilla`, `captura-nitida`.
4. El DOM: `.mg-menu-btn[data-k]`, `.mg-cr-step`, `.mg-cr-nav .mg-btn--primary`, `.mg-cr-body input[type=text]`, `section.mg-dlg`, `button.mg-dlg-opt`, `.mg-dlg-t`, `.mg-dlg-name`, `.mg-layer[data-capa=…]`, `.mg-btn--primary`, `#carga`.
5. Eventos `dialog:open`, `battle:start`, `battle:end`, `ui:open`.

## 10. Uso del arnés

```bash
cd publicado && python3 -m http.server 8751 &          # la referencia
flock /tmp/mdg-pesado.lock node qa/humo.cjs            # < 2 min: menú → creador → Merrowick → combate e1
flock /tmp/mdg-pesado.lock node qa/humo.cjs --entero   # … y espera a que termine el combate
flock /tmp/mdg-pesado.lock node qa/flujo.cjs           # capítulo completo (largo)
node qa/flujo.cjs --hasta=posada                       # solo hasta una etapa
node qa/flujo.cjs --desde=kesh                         # retoma desde el punto de control de la etapa anterior
node qa/flujo.cjs --base=http://localhost:8752/        # lo mismo contra web/dist/
node qa/referencia.cjs                                 # capturas seleccionadas → qa/referencia/*.webp
```

- Salida en `qa/salida/<prueba>/` (fuera de git): capturas `NN_etapa.png`, `informe.json` (etapas con el estado observable de cada una: escena, nivel, nivel del grupo, PV, oro, inventario, misiones, banderas, errores; consola; eventos del bus; conversaciones con la opción elegida y por qué; combates con semilla y resultado) y `puntos/<etapa>.json` (partida guardada al terminar cada etapa, formato `mdg.partida.*`).
- `--tiradas=exito` (por defecto) pone `story.debug.rollMode = "success"`: las pruebas de característica de los diálogos salen siempre bien, para que el recorrido no dependa del azar. `--tiradas=real` las deja al dado. Los combates usan `?semilla` y, si se pierden, se repiten con otra semilla.
- El piloto (`qa/lib/piloto.js`) expone `window.__qa` en la página: `politica` (preferencias de diálogo por id, opciones a evitar, pantallas que cerrar, qué hacer al descansar o perder), `pararEn` (detenerse al aparecer una capa o un diálogo, para capturar), `eventos`, `dialogos`, `combates`, `errores`, `derrotas`.
