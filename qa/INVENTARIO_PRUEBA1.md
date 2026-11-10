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

<!-- FALLOS -->

## 4. Hasta dónde llega la partida automática

<!-- RECORRIDO -->
