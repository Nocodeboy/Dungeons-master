# Notas del área Interfaz (`web/src/ui/`)

Limpieza de nombres de `src/ui/` (31 ficheros). La lógica no se ha tocado: los fallos y el código muerto que aparecieron al leer el código se apuntan aquí, sin arreglar.

## Cómo se aplicó

- Herramienta: `web/tools/renombrar.mjs` (babel, consciente de ámbitos). Mapa: `web/renombres/interfaz.json`.
- Las claves se resuelven contra el fichero **original** del commit `_base` (`58502c0`) con sus nombres minificados; el enlace n-ésimo del original es el n-ésimo del fichero actual (se exige la misma forma canónica). Por eso el mapa es idempotente y se puede volver a aplicar sobre cualquier versión del área: `node tools/renombrar.mjs renombres/interfaz.json` (con `--seco` para ver qué haría, `--listar <fichero>` para ver claves y `--medir` para el porcentaje).
- Comprobaciones de la herramienta: simulación de la resolución con los nombres finales (sin capturas, sin duplicados en un ámbito, sin tapar globales), equivalencia alfa antes y después, y prettier con las opciones de `05-partir-modulos.mjs`. `{icon: icon}` se escribe en forma abreviada `{icon}`.
- Comparación de bundles después de cada tanda: **165 de 176 módulos idénticos en forma, igual que antes de empezar** (salida idéntica a la línea base).

## Ficheros renombrados

| Antes | Ahora | Motivo |
|---|---|---|
| `src/ui/catalog.js` | `src/ui/simulator.js` | contiene `createSimulator` (simulador JS de operaciones del núcleo), no un catálogo |
| `src/ui/rules-mock.js` | `src/ui/rules-bridge.js` | es el puente de reglas (`createRulesBridge`), que solo usa el simulador como respaldo |

`_rutas` en el mapa enlaza los nombres nuevos con los originales. `web/MAPA.md` (fuera del área) sigue citando los nombres viejos: conviene actualizarlo al integrar.

## Exports renombrados que tocan otras áreas

Fuera de `src/ui/` solo se ha cambiado la línea del import (alias con el nombre viejo), para no tocar el cuerpo de ficheros ajenos:

- `src/scenes/ending.js`: `paragraphsHtml as Xl` (de `ui/dom.js`).
- `src/scenes/menu.js`: `formatDuration as Yl`, `formatDate as Kl` (de `ui/dom.js`).
- `src/scenes/travel.js`: `createTravelMap as im` (de `ui/travel-map.js`).

Sin cambios de nombre (son propiedades de espacios de nombres: `import()` o `src/*/index.js`): `createUI`, el `default`/`options` de cada pantalla y `CREDITS_HTML`.

Lista completa de exports renombrados del área:
`dom.js` (Cn→faceBadge, Jl→injectStyle, Kl→formatDate, Qd→iconButton, Xl→paragraphsHtml, Yl→formatDuration, en→signed, fw→plural, gw→isTyping, wf→iconSvg), `labels.js` (Kw→ABILITY_NAMES, Jw→ABILITY_ABBR, Zw→ABILITY_ICONS, nu→ABILITY_HINTS, ou→conditionName, Df→SPELL_ROLES, su→RARITIES, as→ITEM_KINDS, e2→ITEM_KIND_ICONS, ns→CLASS_ICONS, t2→SPECIES_ICONS, a2→BACKGROUND_ICONS, Ib→GAME_HINTS), `tooltip.js` (sa→setTip, bw→createTooltip), `dice.js` (yw→installDiceDefs, Wi→makeDie, Xi→rollDie), `items.js` (mi→rarityClass, Zi→itemIcon, Gr→itemTip), `modal.js` (es→makeTabs, Mf→makeSegmented, Tf→ScreenStack), `portraits.js` (AT→createPortraitPainter), `creator-look.js` (om→appearanceOptions, zv→completeAppearance, JT→randomAppearance, Pv→LOOK_GROUPS), `travel-map.js` (im→createTravelMap).

Imports de otras áreas que siguen minificados dentro de `ui/` (son exports de `actors/`, se dejan para que los renombre esa área): `Fs` (`actors/character.js`), `hc` (`actors/roster.js`), `Tv` y `pc` (`actors/outfits.js`).

## Fallos y código muerto (sin arreglar)

1. **`ui/index.js`, atajos de teclado**: `let key = (ev.key.length === 1, ev.key.toLowerCase());` — la comparación de la izquierda de la coma no tiene efecto (ya estaba en el publicado). Probablemente se quería limitar los atajos a teclas de un carácter; hoy solo se comprueba más abajo para el cambio entre pantallas (`key.length !== 1`).
2. **`ui/screens/inventario.js`, `applyResult`**: el segundo `if (res.ok === !1) return …` es inalcanzable; el primero ya devuelve cuando `res.ok === !1` (con otro texto de respaldo).
3. **`ui/dialog.js`**: `history` (array) solo se vacía (`history.length = 0`) y nunca se llena: variable muerta.
4. **`ui/creator.js`, `lookView`**: el `Set` `shown` se llena y no se lee nunca.
5. **`ui/labels.js`**: `EQUIP_SLOTS`, `SLOT_LABELS` y `SLOT_ICONS` no se exportan ni se usan (el inventario tiene su propia tabla `DOLL_SLOTS`).
6. **`ui/simulator.js`, `cp_pass_hours`**: suma como mucho un día aunque pasen 24 horas o más, y el `?? 18` de la comprobación sobra (la hora ya está asignada).
7. **`ui/hud.js`**: el manejador de exploración expone `hint(text)`, pero llama a `hud.prompt(…, {key: ''})` (el aviso de abajo) en vez de `hud.hint` (la pista con farol que también va al registro). Puede ser intencionado; si no, las pistas de explore/ no llegan al registro.
8. **`ui/screens/partidas.js`, importar partida**: si las ranuras 1 a 8 están ocupadas, la importación va a la ranura 8 y la sobrescribe sin preguntar.
9. **`ui/screens/descanso.js`, descanso corto**: el clic de «Descansar una hora» usa `backButton`, declarado con `let` después; funciona porque el clic llega más tarde, pero es frágil si se reordena.
