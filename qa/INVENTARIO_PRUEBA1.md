# Inventario de la prueba 1 (versión publicada del 7 nov)

Qué contiene `publicado/` y qué no, contrastado con la lista de «lo que se perdió» de `docs/RECONSTRUCCION.md`, más los fallos encontrados. Fuentes: lectura de `publicado/juego.js` (formateado con el impresor de TypeScript para poder leerlo), llamadas directas al núcleo wasm desde el navegador, y las ejecuciones de `qa/humo.cjs` y `qa/flujo.cjs` (informes en `qa/salida/`, capturas en `qa/referencia/`).

Leyenda: ✅ está · 🟡 está a medias · ❌ no está.

## 1. Lista de «lo perdido» contra la prueba 1

| Elemento | Estado en la prueba 1 | Evidencia |
|---|---|---|
| Interior jugable de la **posada** | ✅ | Nivel `posada` («Posada del Toro Dormido», 11×9, ambiente `inn`, música propia). Se entra por la puerta `inn` de Merrowick (requiere `e1_done`). Dentro: Corwin (posadero, descanso), Pip, Holt Varga y sus dos mozos, el tablón de anuncios, las habitaciones (`inn`) y los compañeros que esperan (`*_waiting`). Salida `door` → Merrowick. |
| Interior del **templo** | ❌ | La puerta `temple` de Merrowick no lleva a ningún nivel: tiene `npc: "aldis"` y abre la conversación con la hermana Aldis en la calle (curar, identificar, resucitar). No existe `data/levels/templo.json`. |
| Interior de la **herrería** | ❌ | Igual: la puerta `smithy` abre la conversación con Dagna (tienda `smith`). Tampoco hay interior de la casa de la alcaldesa (puerta `mayor` → Maren). |
| **Prólogo como escena propia** | ❌ | El gestor solo registra `menu`, `creator`, `explore`, `travel` y `ending`. El prólogo es `story.prologue()`: pantalla `relato` (texto a pantalla completa) + diálogo `prologue` con Brenna, todo **dentro de la escena del creador**, y después `go('explore', {level: 'merrowick', spawn: 'arrival'})`. |
| **Tutorial** | 🟡 | Hay «tutorial contextual» (`story.tips`, 45 consejos: `explore`, `move`, `dialog_check`, `codex`, `battle`, `reaction`, `fled`…, uno la primera vez que pasa algo; ajuste «Consejos»), y la pantalla `ayuda` («Cómo se juega») del menú. No hay nivel, escena ni misión de tutorial. |
| **Libro de saber** | 🟡 (datos sí, interfaz no) | El saber existe: `story.lore` / `story.codex()`, 50 entradas (17 gentes, 9 lugares, 8 objetos, 6 facciones, 5 criaturas, 5 dioses) que se desbloquean con eventos `codex:unlock` y avisos «Saber nuevo: …». Pero **ninguna pantalla lo muestra**: el diario solo tiene las pestañas «Misiones» y «Notas», y no hay pantalla `saber`. Ver fallo F3. |
| **Mercenarios** | ✅ | Tablón de la posada (diálogo `board`): «Contratar a alguien» → `story.hire()` → creador en modo `mercenario` («Nuevo mercenario», botón «Contratar»), precio 20 po × nivel del grupo, máximo 4 en el grupo, despedir y dejar esperando en la posada. Núcleo: `cp_hire`. |
| **Reacciones elegidas** por el jugador | ❌ | El núcleo publicado no tiene `reactions`, `set_manual` ni `react` (responden `op desconocida`). Las reacciones (ataque de oportunidad, Escudo…) son automáticas; no hay ninguna pregunta al jugador. |
| **Retirada** del combate | ❌ | No existen `retreat_info` ni `retreat` en el núcleo, ni botón en la barra de combate (Atacar, Conjuros, Acciones, Objetos, Fin del turno). El único `fled: true` lo genera la recuperación de un error de combate («Retirarse por ahora»). Hay textos preparados (consejo `fled`, `onFlee` en `shrine_goblins`) sin forma de llegar a ellos. |
| **Araña gigante** | ✅ | Monstruo `giant_spider` («Araña gigante») en el núcleo y en el bestiario del juego, modelo procedural `arana_gigante` (cuerpo, abdomen y patas generados), grupo `spiders` (2 arañas) en el vado de Kesh junto a la cartera de Odvar, disparador `kesh.nest` y entrada de saber. |
| Mejoras de **IA de compañeros** | ❔ | No se puede comparar sin la versión perdida. Lo que hay: `autoCompanions` (por defecto activo; IA del núcleo `ai_turn`) y `?autocombate` para todo el grupo. |
| **Reequilibrado de combates (e1 = 3 esbirros)** | ❌ | e1 sigue siendo de **6 trasgos**: 3 esbirros, 2 guerreros y 1 arquero, visión 9 y emboscada (`ambush`), con subida a nivel 2 al ganar. La propia Brenna lo dice tras el combate: «Tres trasgos, dos guerreros y un arquero». Contra el héroe y Brenna a nivel 1 es muy duro (ver F1). |
| Arreglo B2 (la pantalla de carga reaparecía) | ✅ | `onProgress` del gestor de carga solo pinta si `#carga` está visible y `game.scenes.busy` (el arreglo descrito para `main.js` está en el bundle). |
| Arreglo de tooltips que roban clics (`#ui > .mg-tip, #ui > [data-pasante] { pointer-events: none; }`) | ❌ | La regla no está. `.mg-tip` declara `pointer-events: none`, pero `index.html` tiene `#ui > * { pointer-events: auto; }`, más específica, y el tooltip es hijo directo de `#ui`. Ver F2. |
| Arreglo B3 (bloqueo en flujos de historia) | ❔ | Sin detalle conservado; no se ha reproducido ningún bloqueo de historia en las ejecuciones (ver §3). |
| `actors.setKitResolver(hoja => game.api.sheetOptions(hoja).kit)` | ❌ | No aparece en el bundle. |
| `game.actors = actors; game.portrait = (x, o) => actors.portrait(x, o)` | ✅ | Presente (`Jt.actors = fu; Jt.portrait = (o, e) => _v(o, e)`). |
| Fallos abiertos G10, P3, M11, P8, P9 | ❔ | Sin detalle conservado: no se pueden identificar. |

## 2. Qué contiene la prueba 1

- **Versión**: «Capítulo I · versión web 0.9 · Compatible con la quinta edición (SRD 5.2.1)» (pie del menú).
- **Escenas**: `menu` (fondo 3D con el toro), `creator`, `explore` (todo el juego, combates incluidos), `travel` (mapa de las Marcas de Vharen), `ending` (epílogo + créditos).
- **Pantallas**: inventario, tienda, descanso, grupo, diario (Misiones, Notas), guardar, cargar (con exportar/importar a fichero), ajustes, nivel, botín, viaje, pausa, creador, créditos, ayuda, relato, derrota, más los modales confirmar y aviso.
- **Niveles**: Merrowick (46×34), posada, bosque de Elderhal (50×36), vado de Kesh (40×30), túmulo de Durn-Kahl (31×34). Lugares del mapa: Merrowick, Elderhal, Kesh, Túmulo, Valdrecht (cerrado).
- **Creador**: 9 pasos (especie, clase, trasfondo, características, habilidades, rasgos, equipo, aspecto, nombre); 11 especies, 12 clases, 8 trasfondos. La hoja por defecto (humano, guerrero, soldado) ya está completa.
- **Historia** (`story.data`): 41 diálogos, 105 banderas, 6 misiones (`q_toro`, `q_pip`, `q_sedge`, `q_ilyra`, `q_kesh`, `q_sello`), 9 combates (`e1`, `wolves`, `sentries`, `shrine_goblins`, `camp`, `spiders`, `crypt_patrol`, `zombies`, `guardians`), 4 compañeros (Brenna, Pip, Ilyra, Odvar) con aprobación, 21 reacciones a decisiones, 18 charlas entre compañeros, 6 conversaciones de campamento, narrador con IA opcional (con texto de reserva), epílogo de 7 láminas condicionales + cierre (= 8) y créditos.
- **Núcleo wasm**: 79 operaciones (lista en `qa/GANCHOS.md` §8).
- **Audio**: 16 músicas, ambientes y efectos (`audio/CREDITOS.md`).
- **Guardado**: `localStorage` (`mdg.partida.<ranura>`) o la nube del anfitrión de artefactos si está disponible; autoguardado al entrar en cada nivel y tras combates y descansos.

## 3. Fallos encontrados

Gravedad: **alta** (bloquea o rompe la partida), **media** (molesta o confunde, tiene salida), **baja** (cosmético o de texto).

### F1 · El primer combate (e1) se pierde la mitad de las veces — gravedad **media** (equilibrio)

- **Pasos:** Nueva partida → creador con la hoja por defecto (humano, guerrero, soldado) → prólogo → en Merrowick, caminar hacia el toro (≈ casilla 21,18). Salta la emboscada de e1: 6 trasgos (3 esbirros, 2 guerreros, 1 arquero) contra el héroe y Brenna, nivel 1, con el grupo sorprendido.
- **Medido:** con la IA del núcleo en los dos bandos (`qa/simular.mjs --grupo=e1 --n=200`), el grupo gana **94 de 200** combates (47 %); en las derrotas caen los dos. El resto de combates del capítulo, con el grupo que se tiene en ese momento, se ganan 40 de 40 (santuario, centinelas, campamento, arañas, Vorhan): e1 es un pico aislado de dificultad justo en el primer minuto de juego.
- **Esperado:** el reequilibrado perdido dejaba e1 en 3 esbirros; con ese cambio la simulación da 199 de 200.

### F2 · Los tooltips pueden robar clics — gravedad **media**

- **Causa:** `index.html` declara `#ui > * { pointer-events: auto; }` y el tooltip (`#mg-tip`, clase `.mg-tip`, hijo directo de `#ui`) solo tiene `pointer-events: none` en su propia regla, menos específica. Falta el arreglo `#ui > .mg-tip, #ui > [data-pasante] { pointer-events: none; }`.
- **Pasos:** con ratón, pasar sobre un elemento con tooltip (una carta del creador, un botón de la barra de combate, una fila de la tienda) y, mientras el tooltip se ve o se desvanece (≈ 120 ms + retardo), hacer clic en el control que queda debajo: el clic lo recibe el tooltip. `getComputedStyle(document.getElementById('mg-tip')).pointerEvents` devuelve `auto` (lo registra `qa/humo.cjs` en «observaciones»).

### F3 · El «saber» se desbloquea pero no se puede consultar — gravedad **media**

- **Pasos:** empezar partida y avanzar el prólogo: salen avisos «Saber nuevo: …» (eventos `codex:unlock`: La guardia de Valdrecht, Merrowick, El toro de granito, Trasgos, Los Zarpas Grises…) y el consejo `codex` dice «queda apuntado en el diario, en la pestaña Saber». Abrir el diario (J): solo hay «Misiones» y «Notas». No hay ninguna pantalla que muestre `story.codex()`.

### F4 · El jefe trasgo tiene dos nombres — gravedad **baja**

- En la historia es «Krazzik Tres Dedos» (diálogo `chief`, epílogo, diario); el monstruo `goblin_boss` del núcleo y de los datos del juego se llama «Grisk, cabecilla» (y el bestiario visual, «Cabecilla trasgo»). Se ve si se asalta el campamento en vez de negociar: la barra de combate y el registro dicen «Grisk».
- Parecido con Vorhan: «Vorhan, el guardián» en el núcleo y «Vorhan, el tumulario» en el bestiario visual.

### F5 · `posada.js` publicado sin usar — gravedad **baja**

- `posada.html` carga `app.js` (el banco antiguo); `posada.js` (950 KB) no lo referencia ninguna página. No afecta al juego (`index.html` + `juego.js`), pero la publicación lleva un archivo huérfano y el banco de la posada que se ve no es el más reciente.

### F6 · `?autonivel` no cubre la subida a nivel 3 — gravedad **baja** (herramientas)

- La subida a nivel 2 tras e1 respeta `?autonivel`, pero la de nivel 3 al salir de Kesh (`story.levelUp(3)`) abre siempre la pantalla `nivel`. Solo afecta a la automatización (el piloto la resuelve).

### F7 · Los enemigos salen con retrato humano en la barra de iniciativa — gravedad **media**

- **Pasos:** empezar el combate e1 (ver F1). En la barra de iniciativa de arriba, los seis trasgos (marco rojo) aparecen con el mismo retrato de un hombre humano de camisa azul, en vez de una cara de trasgo; solo el héroe y Brenna (marco verde) tienen su retrato. Captura: `qa/referencia/*combate_e1*.webp`.
- Observado con SwiftShader (render por software); conviene confirmarlo con GPU. El retrato de los enemigos sale de `factory.portrait(actor, {...rules.sheet(id)})`, que para un monstruo no tiene hoja de personaje.

### F8 · Falta el sonido de pasos del mapa de viaje — gravedad **baja**

- **Pasos:** en exploración, salir de Merrowick por el este hacia el mapa de viaje, elegir Elderhal y pulsar «Viajar». La consola avisa `[sonido] efecto desconocido: pasos_camino`: la escena `travel` pide un efecto que no está en el manifiesto de audio y el viaje se hace en silencio.

### F9 · Aviso `item_info: Ese objeto no existe: gold` al abrir cofres con oro — gravedad **baja**

- **Pasos:** en el vado de Kesh, resolver las piedras rúnicas y abrir el «Pedestal del cuerno» (botín: cuerno de piedra, 40 po, monedas durn, poción mayor). El oro se suma bien (70 → 110 po), pero la consola avisa `[exploración] item_info: Ese objeto no existe: gold`: la exploración pide al núcleo la ficha de «gold» como si fuera un objeto.

### F10 · Con el grupo lleno, Odvar promete esperar en la posada pero no espera — gravedad **media**

- **Pasos:** llegar al vado de Kesh con cuatro en el grupo (héroe, Brenna, Pip, Ilyra). Hablar con Odvar hasta «¿Venís con nosotros?» → «Bienvenido, Maese»: sale el aviso de grupo completo y se elige «Que Odvar espere en la posada de Merrowick» (`odvar_waiting = true`). Volver a hablarle: nodo `waiting` → «Nos vamos, Maese.», cuyo efecto es `["recruit:odvar", "set:odvar_waiting=false"]`. Con el grupo lleno, `recruit` vuelve a preguntar; si se elige otra vez que Odvar espere, `recruit` pone `odvar_waiting = true`… y la opción lo pisa inmediatamente con `false`.
- **Resultado:** el aviso dice «Odvar os esperará en la posada», pero no está en el grupo ni en la posada (`odvar_waiting = false`, `odvar_joined` sin poner); solo queda la figura de Odvar en Kesh. Observado en `qa/salida/flujo3` (eventos `flag:set odvar_waiting false (antes true)` a los 247 s). Además, después de la primera promesa de esperar, Odvar sigue de pie en Kesh.
- Arreglo probable: que la opción no fuerce `odvar_waiting=false` si `recruit` no llega a reclutar (o que `recruit` lo haga él).

### F11 · Dos flujos de historia a la vez: el primero se queda colgado (posible B3) — gravedad **media**

- **Causa (código):** al entrar en un nivel, `story.onLevelEnter` programa con `setTimeout` la narración de «vuelta» (`returns`, a los 1,2 s) y, si toca, la subida a nivel 3 (a los 2,5 s), ambas dentro de `story.exclusive()`. Pero `exclusive()` no encola cuando ya hay un flujo en curso (`if (this._inFlow) return e()`): el segundo se ejecuta a la vez. Su narración llama a `ui.dialog`, que sustituye la conversación visible **sin resolver la promesa pendiente** del primero. El primer flujo no termina nunca y `story._inFlow` queda en `true` hasta recargar.
- **Pasos:** con el cuerno de piedra (`seal_key`) y Kesh terminado, viajar de Kesh a Merrowick y quedarse leyendo la narración del cuerno («El cuerno de piedra pesa en la mochila…») más de 1,3 s: la sustituye de golpe «Lo que habéis visto en Kesh os ha cambiado…» y se abre la subida a nivel 3.
- **Efecto:** el texto del cuerno desaparece a medio leer; después, con `_inFlow` atascado, no vuelven a salir charlas entre compañeros (`banter` exige `!_inFlow`) y `exclusive()` ya no serializa ningún flujo, así que cualquier otra pareja de flujos simultáneos (tras combate, disparadores, descansos) puede chocar igual. Lo detectó `qa/flujo.cjs` en `qa/salida/flujo3`: tras el viaje Kesh → Merrowick y la subida a nivel 3 la exploración no volvía a quedar libre (`story._inFlow` en `true` sin diálogo ni pantalla abiertos). El arnés ahora lo anota como aviso y sigue.

<!-- MAS_FALLOS -->

## 4. Hasta dónde llega la partida automática

<!-- RECORRIDO -->
