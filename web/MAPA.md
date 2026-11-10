# Mapa del código web reconstruido (`web/`)

Código fuente de la versión web de *Marca de Granito* reconstruido a partir de la versión publicada «prueba 1» (`publicado/juego.js`, 7 nov). Compila con esbuild y produce un juego que se comporta igual que el publicado (ver «Verificación»).

**Estado:** el código está partido en sus módulos originales, con imports/exports reales, three.js desde npm y los datos en JSON/CSS legibles. Los nombres de nivel superior evidentes están renombrados; **los nombres locales siguen minificados** (`o, e, t, a…`) y muchos enlaces internos de cada área conservan su nombre minificado (`Xl`, `n2`, `fc`…). Renombrarlos y limpiar cada módulo es el trabajo de los agentes de área.

## Uso rápido

```bash
cd web
npm install                 # esbuild, prettier, babel, three 0.186.0 exacto
node build.mjs              # -> dist/ (juego.js minificado + index.html + assets/audio/rules/icons.json copiados)
node build.mjs --sin-minificar --enlazar --salida /tmp/dist-legible   # depuración: legible y recursos enlazados
cd .. && python3 -m http.server 8741   # http://localhost:8741/web/dist/  y  http://localhost:8741/publicado/
node web/tools/verificar.cjs http://localhost:8741/web/dist/ /tmp/capturas --hasta combate
```

`build.mjs` acepta `--entrada`, `--salida`, `--sin-minificar`, `--enlazar` (enlaces simbólicos a `publicado/` en vez de copias) y `--meta`. Los recursos se toman siempre de `publicado/` (no se duplican en git); `dist/` está en `.gitignore`. El build falla si algún archivo pasa de 16 MB. Las `.css` se cargan como texto (`loader: {'.css': 'text'}`), igual que en el original.

## Estructura de `web/`

```
web/
  package.json, package-lock.json   dependencias (three 0.186.0 exacto)
  build.mjs                         compilación -> dist/
  index.html                        copia exacta de publicado/index.html (con su esqueleto de documento)
  MAPA.md                           este documento
  src/                              CÓDIGO FUENTE (punto de entrada: src/main.js)
    main.js  quality.js  stage.js  scenes.js  bus.js  caps.js  store.js  rules.js  assets.js
    actors/ audio/ combat/ explore/ story/ ui/ vfx/ world/   áreas (cada una con su index.js)
    scenes/                         escenas: menu, creator, explore, travel, ending
    ui/screens/                     pantallas (inventario, tienda, diario…)
    datos/                          JSON extraídos (reglas, historia, niveles, audio, efectos…)
  tools/                            herramientas de la reconstrucción (ver más abajo)
```

**Ojo con `src/*/index.js`:** `explore/areas.js` carga las áreas con `import(\`../${area}/index.js\`)`, así que esbuild empaqueta como cargable cualquier `src/<carpeta>/index.js`. No crees `index.js` en carpetas nuevas de `src/` (ni en `scenes/` ni en `datos/`) o cambiará el bundle. Lo mismo con `src/datos/niveles/*.json`, que se cargan con `import(\`../datos/niveles/${id}.json\`)`.

## Arranque y contexto `game`

Punto de entrada: **`src/main.js`** (en el original, la parte sin envolver del final del bundle). Orden de ejecución:

1. Se evalúan los módulos sin envolver en este orden: `quality.js`, `stage.js` (con OrbitControls y el posprocesado), `scenes.js`, `bus.js`, `caps.js`, `store.js`, `rules.js`; luego `main.js` inicializa `ui/`, `audio/`, `story/` y `actors/` (el resto de módulos se inicializa de forma perezosa, ver «Envoltorios»).
2. `params = new URLSearchParams(location.search)`; `bus = new Bus()`; `store = new Store(bus)` (ajustes y partidas en `localStorage` con prefijo `mdg.`, o en la capacidad `db` si existe). Si los ajustes guardan calidad y la URL no trae `calidad`, se usa la guardada.
3. `quality = detectQuality(params)`, `stage = createStage(canvas#escena, quality)` (renderer WebGL, cámara, OrbitControls, `EffectComposer` con RenderPass, GTAO, UnrealBloom, gradación y OutputPass), `tiltShift = createTiltShift(...)` (desenfoque por bandas, solo en exploración).
4. Se arma el contexto:
   ```js
   game = { params, bus, store, stage, quality, rules: null, api: null, ui: null, audio: null, story: null,
            caps: { get: getCap }, errors: bootErrors, go: (n, p) => game.scenes.go(n, p) }
   game.scenes   = new SceneManager(game)
   game.actors   = actors            // espacio de nombres de actors/index.js
   game.portrait = (x, o) => portrait(x, o)
   game.ui       = createUI(game)    // ui/index.js: registra pantallas y las escenas creator/travel/ending
   game.audio    = createAudio(game) // audio/index.js
   game.story    = createStory(game) // story/index.js
   ```
   `loadingManager.onProgress` (de `assets.js`) solo actualiza la pantalla de carga si está visible y hay un cambio de escena en curso. Se registran las escenas `menu` y `explore` y los oyentes del bus que activan el tilt-shift.
5. `boot()`: `game.rules = await loadRules()` (función `mdg_call` del wasm), `game.api = createApi(game.rules)`, con `?depurar` expone `window.__mdg = game`, arranca el bucle `frame()` y va a la escena `params.get('escena') || 'menu'` pasándole todos los parámetros de la URL.
6. Bucle `frame()`: `Timer` de three, dt limitado a 1/20 s (0,35 s con `?turbo`), calidad automática (baja un nivel si la media pasa de 1/24 s), `game.scenes.update`, foco del tilt-shift, `game.audio.update`, `stage.render`, `afterRender`. Con `?captura=N` se detiene tras N fotogramas listos y pone `document.title = 'listo'`.

**Escenas** (`SceneManager.go(nombre, params)` funde a negro, libera la anterior y llama a `create(game, params)` del módulo, que devuelve `{three, sun, update, afterRender, dispose, …}`):

| Escena | Módulo | Registrada en |
|---|---|---|
| `menu` | `scenes/menu.js` (`create`, `buildBackdrop`: toro de granito, pinar) | `main.js` |
| `explore` | `scenes/explore.js` → `explore/index.js` (`createExplore`) | `main.js` |
| `creator` | `scenes/creator.js` (creador + prólogo con el relato y el diálogo de Brenna) | `ui/index.js` |
| `travel` | `scenes/travel.js` (mapa de viaje) | `ui/index.js` |
| `ending` | `scenes/ending.js` (epílogo y créditos) | `ui/index.js` |

El combate no es una escena: `explore/battle.js` llama a `combat/index.js` → `runBattle(game, {...})` sobre el mismo mundo.

**Pantallas** (`game.ui`, cargadas con `import()` desde `ui/index.js`): `inventario`, `tienda`, `descanso`, `grupo`, `diario`, `guardar`/`cargar` (`partidas.js`), `ajustes`, `nivel`, `botin`, `viaje`, `pausa`, `creador`, `creditos`, `ayuda`, `relato`, `derrota`. Cada una exporta `default` (construye la pantalla) y `options` (tamaño, modal…).

## Módulos por área

Los nombres de fichero de las áreas, `src/ui/theme.css`, `src/story/tips.js` y la carpeta de niveles salen de pistas que el propio bundle conservaba (rutas de los `import()` con plantilla, comentarios y notas). El resto se ha deducido del contenido. Entre paréntesis, el nombre minificado de su función init en `publicado/juego.js` (útil para comparar).

**Raíz**
- `main.js` — arranque y contexto `game` (arriba). También `makeBlurPass`/`createTiltShift`.
- `quality.js` — `detectQuality`: nivel 0–2 según GPU (SwiftShader, integradas…), pantalla y `?calidad`.
- `stage.js` — `createStage`: renderer, cámara, OrbitControls, composición de posprocesado, `setLevel`, `fade`.
- `scenes.js` — `SceneManager`. `bus.js` — `Bus` (`on`, `once`, `emit`, comodín `*`).
- `caps.js` — `getCap(nombre)`: capacidades del artefacto (`window.claude.use`: `db`, `user`, `sample`…), `getUserId`.
- `store.js` — `Store`: ajustes (`DEFAULT_SETTINGS`), campaña activa `store.cp`, guardado en ranuras.
- `rules.js` — `loadRules` (carga `rules/rules.mjs` + `rules.wasm`, devuelve `mdg_call`) y `createApi`.
- `assets.js` (Qo) — `GLTFLoader` con meshopt y binarios embebidos en `data:` (extensión `mdg_recursos_embebidos`), `loadGLTF`, `loadModel`, `loadProp`, `loadTexture`, `pbrMaterial`, `loadingManager`.

**`ui/`** (área Interfaz)
- `index.js` (Nv) — `createUI(game)`: inyecta las hojas `theme/menu/hud/creator.css`, registra pantallas y escenas, envoltorio de reglas, diálogo, HUD, retratos, carga.
- `dom.js` (ha) — `elem` (crea nodos con `"div.clase#id"`), `makeButton`, `iconHtml`/`loadIcons` (`icons.json`), `escapeHtml`, `richText`, `sleep`, `reducedMotion`.
- `modal.js` (Pn) — `screenFrame` (cabecera y marco de pantalla), foco atrapado. `tooltip.js` (ci), `dice.js` (eu, dados SVG), `labels.js` (os, textos de características/habilidades/rarezas).
- `rules-mock.js` (Ww, `createRulesBridge`) — envoltorio de reglas de la interfaz: llama al núcleo y, si contesta «op desconocida/sin combate», usa el **simulador** `createSimulator` de `catalog.js` (Vw), que trabaja con `datos/reglas/*.json`.
- `dialog.js` (Yw, `createDialog`: conversaciones con tonos), `hud.js` (o2, `createHud`: HUD de exploración), `portraits.js` (RT), `items.js` (tm).
- `creator.js` (sm, `buildCreator`: el creador y la subida de nivel por pasos), `creator-look.js` (ZT, colores y aspecto), `travel-map.js` (Lv, pergamino SVG del mapa de viaje).
- `screens/*.js` — una por pantalla (lista arriba).

**`scenes/`** — ver tabla de escenas.

**`story/`** (historia)
- `index.js` (Jv) — `createStory(game)`.
- `runner.js` (mE, clase `StoryRunner`) — motor de flujos de historia: diálogos, nodos, acciones, pruebas, combates, avisos.
- `story.js` (bE, `Story extends StoryRunner`) — la historia del capítulo: disparadores, después de combate, misiones, compañeros, charlas.
- `conditions.js` (aE, expresiones `a & !b | c>=2`), `actions.js` (pE), `text.js` (cE, plantillas con pronombres y etiquetas), `narrator.js` (vE, `Narrator`: narrador con IA mediante la capacidad `sample`, con textos de respaldo), `tips.js` (hS, `Tips`: consejos), `codex.js` (gS, `Codex`: libro de saber), `data.js` (cS, reúne los JSON de historia).

**`explore/`** (exploración)
- `index.js` (F1) — clase `Explore` y `createExplore`: carga de nivel, grupo, PNJ, enemigos, objetos, cámara, toques, salidas, HUD, guardado de posición. API útil: `scene.explore.moveTo([x,y])`.
- `hex.js` (Kn) — rejilla hexagonal odd-r (K = 1,5 m): `cellToWorld`, `cellToPlane`, `planeToCell`, `worldToPlane`, `neighbors`, `hexDistance`, `cellKey`, `hexShape`, `HEX_SIZE`. Lo usan también combate y efectos.
- `terrain.js` (_S, tabla de caracteres de `rows`), `levels.js` (LS, `loadLevel`: `import()` de `datos/niveles/*.json`), `areas.js` (hk, `loadArea`: carga perezosa de las áreas), `campaign.js` (SS, `ensureCampaign`, `DEFAULT_HERO`, `?grupo`/`?banderas`), `checks.js` (Mu, `rollDice` y pruebas).
- `detection.js` (h0, sigilo, percepción, emboscadas), `battle.js` (p0, paso a combate y vuelta), `interact.js` (ty, objetos, PNJ, cerraduras), `actors.js` (xk), `input.js` (_k, `ExploreInput`), `marks.js` (Mk), `floaters.js` (wk), `hud.js` (X1), `animals.js` (Qk), `fallback-world.js` (gk, mundo de depuración si falla el de `world/`).

**`combat/`** (área Combate y efectos)
- `index.js` (b3) — `runBattle`, `Controller`, `Hud`, `boardBounds`.
- `controller.js` (y1) — turnos, órdenes del jugador, IA, eventos del núcleo → animaciones y efectos.
- `hud.js` (qm, interfaz `.mdg-combate`, ids `cb-*`, banco de pruebas), `combat.css`, `overlay.js` (GS, casillas de movimiento/alcance/área), `units.js` (f3), `creatures.js` (b1), `hands.js` (e3).

**`vfx/`** — `index.js` (p1, `createVfx`, `SPELLS`, `STYLE`…), `atlas.js` (yi, atlas de partículas y `FRAME`), `particles.js` (t1), `shaders.js` (zm), `styles.js` (Lm), `spells.js` (s1, coreografía por conjuro), `conditions.js` (r1, efectos de estado), `zones.js` (qS, zonas persistentes).

**`world/`** — `index.js` (ck, `buildLevel`, `TIMES`), `times.js` (R3, iluminación por momento del día), `grid.js` (Mi), `ground.js` (Zr, terreno y texturas), `kit.js` (pr, piezas glTF de `assets/world`), `materials.js` (wi, viento y AO por shader), `buildings.js` (G3), `interiors.js` (I1), `props.js` (Q3), `procedural.js` (sk), `crypt.js` (ik), `vegetation.js` (N3), `water.js` (R1), `particles.js` (rk).

**`actors/`** (personajes)
- `index.js` (Zf) — `makeHero`, `makeCompanion`, `makeNpc`, `makeMonster`, `makeAnimal`, `portrait`, `Character`, `COMPANIONS`, `MONSTER_DEFS`…
- `character.js` (pi, clase `Character`: animaciones, posturas), `humanoid.js` (Wf, `buildHumanoid`), `rig.js` (p2, `assets/chars/humanos.json`), `look.js` (cu, `heroLook`), `appearance.js` (Ur), `companions.js` (vv), `monsters.js` (pv), `beasts.js` (dT, araña…), `animals.js` (bv), `monster-parts.js` (X2), `sculpt.js` (Of), `geometry.js` (iu), `materials.js` (Br, luz de borde), `poses.js` (K2), `anims.js` (Hf), `portraits.js` (xT, render de retratos), `preview.js` (wT), `roster.js` (Qf), `outfits.js` (gu).

**`audio/`** — `index.js` (Gv, `createAudio`), `engine.js` (Ov, música por bloques, ambientes, efectos, transmisión), `reactions.js` (KM, reacciones a eventos del bus). Manifiesto en `datos/audio.json`.

**`datos/`** — JSON tal cual estaban (con sus claves `_fuente`/`_nota`): `reglas/` (especies, clases, trasfondos, dotes, conjuros, armas, armaduras, objetos, comerciantes, compañeros, nombres, rasgos: los usa el simulador de la interfaz), `historia/` (flags, misiones, combates, disparadores, objetos, charlas, narrador, prólogo, epílogo, reacciones, saber, consejos y `dialogos/`), `niveles/` (elderhal, kesh, merrowick, posada, tumulo), `efectos/conjuros.json`, `animaciones.json`, `audio.json`, `mapa-viaje.json`.

## Núcleo de reglas (`mdg_call`)

`rules.js`:
```js
const t = await (await import(`${base}rules.mjs`)).default({ locateFile: (f) => base + f }); // base = new URL('rules/', document.baseURI)
const call = (op, args = {}) => {
  const s = t.stringToNewUTF8(JSON.stringify({ op, ...args }));
  try { return JSON.parse(t.UTF8ToString(t._mdg_call(s))); } finally { t._free(s); }
};
```
- `game.rules(op, args)` es esa función; `game.api = createApi(game.rules)` añade métodos (`api.sheetNew(...)`) y avisa por consola si la respuesta trae `error`.
- La interfaz usa su propio envoltorio (`ui/rules-mock.js`): si el núcleo responde `op desconocida`, `unknown op` o `sin combate`, cae al simulador JS de `ui/catalog.js` (`createSimulator`) y lo anota en consola. El combate tiene su sustituto si falta `battle_start` (`explore/battle.js`).
- Funciona igual en Node: `node web/tools/ejemplos-reglas.mjs [ruta/a/rules/]` llama al núcleo con una secuencia realista y guarda petición y respuesta en `tools/salida/ejemplos-reglas.json` (útil para comprobar el núcleo reconstruido del área motor).

**Operaciones** (ejemplos reales contra `publicado/rules/`; `<hoja>`/`<campaña>` abrevian objetos completos; respuestas recortadas):

| op | método de `api` | petición | respuesta |
|---|---|---|---|
| `data` | `api.data` | `{"op":"data","name":"species"}` | `{"human":{"name":"Humano","plural":"humanos","desc":"Versátiles y ambiciosos, los humanos están en todas partes de Eredhal. Ganan una habilidad y una …` |
| `loc` | `api.loc` | `{"op":"loc","keys":["ability.str"]}` | `{"ability.str":"ability.str"}` |
| `random_name` | `api.randomName` | `{"op":"random_name","species":"elf","pronoun":"f","seed":3}` | `{"name":"Thalia Selenthor"}` |
| `sheet_new` | `api.sheetNew` | `{"op":"sheet_new"}` | `{"sheet":{"class":"fighter","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"knight","head":"knight","hat":false,"cape":…` |
| `sheet_options` | `api.sheetOptions` | `{"op":"sheet_options","sheet":"<hoja>"}` | `{"mode":"create","level":1,"title":"Crea tu héroe","steps":[{"id":"class","title":"Clase","hint":"Tu clase decide cómo luchas y qué papel tienes en el…` |
| `sheet_set` | `api.sheetSet` | `{"op":"sheet_set","sheet":"<hoja>","set":{"what":"class","value":"wizard"}}` | `{"sheet":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"mage","hat":false,"cape":true,…` |
| `sheet_complete` | `api.sheetComplete` | `{"op":"sheet_complete","sheet":"<hoja>","level":1}` | `{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"mage","hat":false,"cape":true,"cloth":"…` |
| `sheet_validate` | `api.sheetValidate` | `{"op":"sheet_validate","sheet":"<hoja>"}` | `{"ok":true,"errors":[]}` |
| `sheet_summary` | `api.sheetSummary` | `{"op":"sheet_summary","sheet":"<hoja>","level":1}` | `{"id":"pc","name":"Tamrec Kestrel","short_name":"Tamrec","title":"","pronoun":"m","species":"human","species_name":"Humano","class":"wizard","class_na…` |
| `sheet_finish` | `api.sheetFinish` | `{"op":"sheet_finish","sheet":"<hoja>"}` | `{"sheet":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"mage","hat":false,"cape":true,…` |
| `cp_new` | `api.cpNew` | `{"op":"cp_new","hero":"<héroe de sheet_finish>","companions":["brenna"],"seed":7}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `party_summary` | `api.partySummary` | `{"op":"party_summary","cp":"<campaña>"}` | `[{"id":"hero","name":"Tamrec Kestrel","short_name":"Tamrec","title":"","pronoun":"m","species":"human","species_name":"Humano","class":"wizard","class…` |
| `cp_load` | `api.cpLoad` | `{"op":"cp_load","cp":"<campaña>"}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `cp_recruit` | `api.cpRecruit` | `{"op":"cp_recruit","cp":"<campaña>","id":"pip"}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `cp_gold` | `api.cpGold` | `{"op":"cp_gold","cp":"<campaña>","delta":25}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `cp_give` | `api.cpGive` | `{"op":"cp_give","cp":"<campaña>","item":"potion_healing","n":1}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `has_item` | — | `{"op":"has_item","cp":"<campaña>","item":"potion_healing"}` | `{"who":"hero","n":2,"holders":[{"id":"hero","n":1,"dead":false},{"id":"brenna","n":1,"dead":false}]}` |
| `cp_take` | — | `{"op":"cp_take","cp":"<campaña>","item":"potion_healing","n":1}` | `{"error":"op desconocida: cp_take"}` |
| `cp_damage` | `api.cpDamage` | `{"op":"cp_damage","cp":"<campaña>","id":"brenna","amount":3,"type":"slashing"}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `cp_heal` | `api.cpHeal` | `{"op":"cp_heal","cp":"<campaña>","id":"brenna","amount":2}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `cp_short_rest` | `api.cpShortRest` | `{"op":"cp_short_rest","cp":"<campaña>","seed":1}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `cp_long_rest` | `api.cpLongRest` | `{"op":"cp_long_rest","cp":"<campaña>","seed":1}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `cp_pass_hours` | `api.cpPassHours` | `{"op":"cp_pass_hours","cp":"<campaña>","hours":2}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `cp_cast` | — | `{"op":"cp_cast","cp":"<campaña>","who":"hero","spell":"knock"}` | `{"error":"op desconocida: cp_cast"}` |
| `item_info` | `api.itemInfo` | `{"op":"item_info","id":"longsword","unid":false}` | `{"id":"longsword","name":"Espada larga","real_name":"Espada larga","kind":"weapon","slot":"weapon","slot_name":"Arma","base":"longsword","desc":"Arma …` |
| `inv` | `api.inv` | `{"op":"inv","cp":"<campaña>","who":"hero"}` | `{"who":"hero","name":"Tamrec Kestrel","short_name":"Tamrec","slots":{"weapon:0":{"key":"weapon:0","label":"Arma 1","empty":false,"id":"quarterstaff","…` |
| `inv_preview` | `api.invPreview` | `{"op":"inv_preview","cp":"<campaña>","who":"brenna","item":"longsword"}` | `{"ok":false,"reason":"No existe ese objeto.","lines":["No existe ese objeto."]}` |
| `inv_equip` | `api.invEquip` | `{"op":"inv_equip","cp":"<campaña>","who":"brenna","item":"longsword"}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `inv_unequip` | `api.invUnequip` | `{"op":"inv_unequip","cp":"<campaña>","who":"brenna","slot":"main"}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `inv_give` | `api.invGive` | `{"op":"inv_give","cp":"<campaña>","from":"hero","to":"brenna","item":"potion_healing","n":1}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `inv_use` | `api.invUse` | `{"op":"inv_use","cp":"<campaña>","who":"brenna","item":"potion_healing"}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `inv_drop` | `api.invDrop` | `{"op":"inv_drop","cp":"<campaña>","who":"hero","item":"potion_healing","n":1}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `identify` | `api.identify` | `{"op":"identify","cp":"<campaña>"}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `shop` | `api.shop` | `{"op":"shop","cp":"<campaña>","merchant":"smith"}` | `{"id":"smith","name":"Herrería de Dagna","npc":"dagna","markup":1,"buys_kinds":["weapon","armor","shield","ammo","treasure"],"stock":[{"id":"javelin",…` |
| `shop_buy` | `api.shopBuy` | `{"op":"shop_buy","cp":"<campaña>","merchant":"smith","item":"shield","n":1}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `shop_sell` | `api.shopSell` | `{"op":"shop_sell","cp":"<campaña>","merchant":"smith","who":"hero","item":"shield","n":1}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `check` | `api.check` | `{"op":"check","cp":"<campaña>","who":"hero","skill":"perception","dc":12}` | `{"who":"hero","name":"Tamrec","kind":"skill","id":"perception","label":"Percepción","d20":[20],"kept":20,"mode":0,"mod":2,"total":22,"success":true,"c…` |
| `group_check` | `api.groupCheck` | `{"op":"group_check","cp":"<campaña>","skill":"stealth","dc":12}` | `{"results":[{"who":"hero","name":"Tamrec","kind":"skill","id":"stealth","label":"Sigilo","d20":[16],"kept":16,"mode":0,"mod":1,"total":17,"success":tr…` |
| `passive` | `api.passive` | `{"op":"passive","cp":"<campaña>","skill":"perception"}` | `{"hero":12,"brenna":13}` |
| `best` | `api.best` | `{"op":"best","cp":"<campaña>","skill":"athletics"}` | `{"who":"brenna","name":"Brenna","mod":5,"label":"Atletismo"}` |
| `level_choices` | `api.levelChoices` | `{"op":"level_choices","sheet":"<hoja>","from":1,"to":2}` | `{"level":2,"remaining":0,"sheet":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"mage",…` |
| `cp_level_up` | `api.cpLevelUp` | `{"op":"cp_level_up","cp":"<campaña>","level":2}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `monster_info` | `api.monsterInfo` | `{"op":"monster_info","id":"goblin_minion"}` | `{"id":"goblin_minion","name":"Trasgo esbirro","size":"small","size_name":"Pequeño","type":"fey","type_name":"Feérico","cr":"1/8","xp":25,"ac":12,"hp":…` |
| `xmap_load` | `api.xmapLoad` | `{"op":"xmap_load","rows":["T,T,TTTT,TT,T,,TTT,T…","…"]}` | `{"w":46,"h":34}` |
| `xmap_cell` | `api.xmapCell` | `{"op":"xmap_cell","cell":[2,17]}` | `{"in_bounds":true,"terrain":":","name":"camino","walkable":true,"difficult":false,"cover":0,"blocks_los":false,"obscure":0}` |
| `xmap_walkable` | `api.xmapWalkable` | `{"op":"xmap_walkable","cells":[[2,17],[0,0]]}` | `{"ok":[true,false],"difficult":[false,false]}` |
| `xmap_path` | `api.xmapPath` | `{"op":"xmap_path","from":[2,17],"to":[20,15]}` | `{"path":[[2,17],[3,17],[4,17],[5,17],[6,17],[7,17],[8,17],[9,16],[10,16],[11,16],[12,16],[13,16],[14,16],[14,15],[15,15],[16,15],[17,15],[18,15],[19,1…` |
| `xmap_los` | `api.xmapLos` | `{"op":"xmap_los","from":[2,17],"to":[20,15]}` | `{"los":true,"cover":1,"dist":19}` |
| `xmap_reach` | `api.xmapReach` | `{"op":"xmap_reach","from":[2,17],"max":4}` | `{"cells":[[2,17,0],[3,17,1],[3,16,1],[1,17,1],[2,18,1],[3,18,1],[4,17,2],[4,16,2],[0,17,2],[2,19,2],[3,19,2],[5,17,3],[5,16,3],[5,18,3],[4,15,3],[0,16…` |
| `xmap_free` | `api.xmapFree` | `{"op":"xmap_free","near":[2,17],"n":3}` | `{"cells":[[2,17],[3,17],[3,16]]}` |
| `battle_start` | `api.battleStart` | `{"op":"battle_start","cp":"<campaña>","rows":["…"],"party":[{"id":"hero","cell":[20,15],"face":90},{"id":"brenna","cell":[20,16],"face":90},{"id":"pip","cell":[19,15],"fa…` | `{"state":{"round":1,"current":"goblin_warrior_4","over":false,"winner":-1,"order":["goblin_warrior_4","goblin_warrior_3","hero","goblin_minion_1","gob…` |
| `state` | `api.state` | `{"op":"state"}` | `{"round":1,"current":"goblin_warrior_4","over":false,"winner":-1,"order":["goblin_warrior_4","goblin_warrior_3","hero","goblin_minion_1","goblin_minio…` |
| `options` | `api.options` | `{"op":"options"}` | `null` |
| `threats` | `api.threats` | `{"op":"threats","path":[[20,15],[21,15]]}` | `[]` |
| `attack_plan` | `api.attackPlan` | `{"op":"attack_plan","target":"goblin_minion_0"}` | `{"ok":false,"reason":"Objetivo no válido"}` |
| `simple_targets` | `api.simpleTargets` | `{"op":"simple_targets","what":"dodge"}` | `[]` |
| `feature` | `api.feature` | `{"op":"feature","name":"second_wind"}` | `{"events":[]}` |
| `ai_turn` | `api.aiTurn` | `{"op":"ai_turn"}` | `{"events":[{"t":"move","who":"goblin_warrior_4","path":[[28,17],[28,16],[27,15],[27,14],[26,13],[26,12]],"dash":false},{"t":"effect","who":"hero","kin…` |
| `end_turn` | `api.endTurn` | `{"op":"end_turn"}` | `{"events":[{"t":"turn_end","who":"goblin_warrior_4"},{"t":"turn","who":"goblin_warrior_3","round":1}]}` |
| `undo_move` | `api.undoMove` | `{"op":"undo_move"}` | `{"events":[]}` |
| `battle_end` | `api.battleEnd` | `{"op":"battle_end","cp":"<campaña>","won":true}` | `{"cp":{"version":1,"members":{"hero":{"class":"wizard","species":"human","ability_method":"standard","pronoun":"m","visual":{"model":"mage","head":"ma…` |
| `init` | `api.init` | `{"op":"init","encounter":"e1_prado","seed":1}` | `{"state":{"round":1,"current":"brenna","over":false,"winner":-1,"order":["brenna","pip","goblin_warrior#1","goblin_minion#1","goblin_minion#2","goblin…` |
| `op_inexistente` | — | `{"op":"op_inexistente"}` | `{"error":"op desconocida: op_inexistente"}` |

Otras operaciones de la API sin ejemplo arriba (forma de la petición): `cp_dismiss {cp, id}`, `cp_hire {cp, sheet}`, `cp_revive {cp, id}`, `move {path:[[x,y]…], dash}`, `attack {key, target, path}`, `offhand {key, target}`, `spell_begin {spell, slot}`, `spell_preview {…}`, `cast {…}`, `simple {what, target}`. `options`, `threats`, `attack_plan`… dependen del turno actual (en el ejemplo era el turno de un trasgo, por eso vienen vacías).

**Llamadas fuera de `createApi`** que el núcleo publicado **no** tiene (contesta `op desconocida`; el JS tiene alternativa): `cp_take {cp, item, n}` (`story/runner.js`) y `cp_cast {cp, who, spell:'knock'}` (`explore/interact.js`). También `has_item {cp, item}` (sí existe).

## Parámetros de depuración de la URL

| Parámetro | Efecto |
|---|---|
| `depurar` | Expone `window.__mdg` (contexto `game`), `window.__sonido` (audio) y `window.__combate` (`{ctl, vfx, units, board, hud}` durante un combate); trazas de exploración y tiempos de carga en consola. |
| `calidad=baja\|media\|alta` | Fuerza el nivel de calidad (sin ajuste automático). |
| `turbo[=N]` | Acelera: dt máximo 0,35 s; combate ×5; exploración ×N. |
| `escala=0.2..2` | Fuerza la relación de píxeles. |
| `captura[=N]` | Modo captura: sin calidad automática; tras N fotogramas listos (2 por defecto) pone `document.title='listo'` y para el bucle. |
| `captura-nitida` | Desactiva el tilt-shift. |
| `escena=<nombre>` | Arranca en esa escena (`menu`, `explore`, `creator`, `travel`, `ending`) con todos los parámetros de la URL; p. ej. `?escena=explore&level=kesh&spawn=default`. |
| `grupo=completo\|odvar\|…` | Grupo inicial si no hay campaña (exploración directa); en el banco de combate, lista separada por comas. |
| `banderas=a,b=valor` | Pone banderas de historia al crear la campaña. |
| `semilla=N` | Semilla de combates y pruebas. |
| `autocombate` | La IA lleva a todo el grupo (también al héroe). |
| `autonivel` | No abre la pantalla de subida de nivel. |
| `audio=no\|buffer` | Sin audio / sin transmisión de música. |
| `encuentro`, `nivel` | Solo en el banco de pruebas del combate (`combat/hud.js`). |

## Cómo se reconstruyó (`web/tools/`)

`publicado/juego.js` es un bundle ESM de esbuild sin *code splitting*: como el juego usa `import()`, esbuild envolvió casi todos los módulos en `__esm` (inicialización perezosa) con sus funciones elevadas y sus variables declaradas fuera del cierre. Eso conserva los límites de módulo y el orden de sus imports, que es lo que aprovechan las herramientas. Se ejecutan en orden desde `web/` y dejan sus intermedios en `tools/salida/` (ignorada):

1. `01-mapa-three.mjs` — compila `tools/referencia-three/entrada.js` (los mismos módulos de three 0.186 que lleva el publicado, en el mismo orden y envoltura) con `--minify-syntax` sin minificar identificadores; descompone ambos bundles en unidades (funciones, declaradores y asignaciones de los cierres), calcula una firma de forma que ignora nombres de variables pero conserva propiedades y literales, las alinea por LCS módulo a módulo y empareja identificadores recorriendo los AST en paralelo. Resultado: 1041 enlaces de three con nombre real, sin duplicados (cobertura completa de la región three).
2. `02-renombrar-three.mjs` — aplica el mapa con un renombrador por ámbitos (babel) que empalma texto en las posiciones del AST.
3. `03-imports-three.mjs` — quita el three empotrado y sus llamadas init y añade `import { … } from 'three'` y de los addons (OrbitControls, GLTFLoader, meshopt, EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, GTAOPass, OutputPass, BufferGeometryUtils, SkeletonUtils).
4. `04-extraer-datos.mjs` — extrae los módulos de datos a JSON (literales puros, comprobados con ida y vuelta) y las hojas de estilo a `.css`.
5. `05-partir-modulos.mjs` — parte en módulos (`nombres-modulos.mjs` da la ruta de cada uno; `renombres-juego.mjs`, los renombres manuales). **Regenera `src/` entero** (pide `--forzar`): a partir de ahora `src/` es la fuente y se edita a mano; no lo vuelvas a ejecutar sobre trabajo hecho.

Otras: `verificar.cjs` (recorrido con Playwright), `ejemplos-reglas.mjs` (contrato de `mdg_call`), `lib/` (AST, ámbitos, renombrado, segmentación, datos).

### Decisiones

- **Fidelidad antes que belleza.** Se conserva el código tal cual salió del minificador (`!0`, comas, ternarios) y solo se formatea con prettier. Recompilado, el bundle tiene la misma estructura que el publicado: **170 `__esm`, 5 `__commonJS`, 2 `__glob` y 32 espacios de nombres**, igual número y los 167 módulos con nombre en el mismo orden que el publicado.
- **Comparación estática** (`node tools/comparar-bundles.mjs ../publicado/juego.js dist/juego.js --detalle`): de 176 módulos, 165 son idénticos en forma (firmas que ignoran nombres de variables). Los 11 restantes difieren solo en (a) simplificaciones equivalentes del esbuild actual (0.28; p. ej. `if(!c)return;x()` ↔ `c&&x()`, `!!x` en contexto booleano, una comparación sin efecto en una coma), (b) el orden de claves de `clases.json` (las claves enteras van primero: en JS el orden de enumeración es el mismo), (c) las rutas de los niveles (`../../data/levels/` → `../datos/niveles/`) y (d) el orden interno de los addons de three y de los ayudantes.
- **Imports en el orden de las llamadas init** de cada cierre (determinan el orden de inicialización). Three y sus addons se importan en el orden en que los inicializaba el publicado. Si un módulo reexporta (tenía espacio de nombres), sus exports son exactamente los del original, con reexportaciones desde el módulo que declara; los demás exportan lo que otros usan.
- **`const`/`let`**: las asignaciones del cierre a variables propias se vuelven `const` (si no se reasignan nunca) o `let`; las que se asignaban dentro de bloques se declaran con `let` arriba. En los módulos sin envolver de la raíz (`main.js`, `store.js`…) se deja `var`, como estaba, para no introducir zonas muertas temporales.
- **Nombres de fichero en inglés**, como los originales conocidos (`index.js`, `tips.js`, `theme.css`); pantallas con su clave de registro en español; datos en `src/datos/` con nombres en español (en el original estaban en `data/`, fuera de `src/`).
- **`index.html`** es copia exacta del publicado (incluye el esqueleto de documento que añadía la publicación), para que el `dist/` se comporte igual en local.
- **Renombres**: nombres exportados por los espacios de nombres (p. ej. `Ns`→`Character`, `Hv`→`createUI`), `default`/`options`/`create` según el módulo (`pantallaInventario`, `opcionesInventario`, `crearEscenaMenu`), variables de datos según su fichero (`reglasEspecies`, `themeCss`) y una tabla manual (`game`, `params`, `bus`, `store`, `stage`, `loadRules`, `createApi`, `elem`, `makeButton`…). Cuidado: renombrar cambia el `.name` de funciones y clases respecto al publicado (no se ha visto código que dependa de ello).
- Three se importa desde npm (0.186.0 exacto). Los nombres de los módulos de three pasan a ser los suyos, así que el código del juego lee `new Mesh(...)`, `Vector3`, etc.

## Verificación

`tools/verificar.cjs <url> <carpeta> [--hasta merrowick|combate|victoria]` abre Chromium (SwiftShader) con `?depurar&calidad=baja`, `Math.random` con semilla y recorre: menú → Nueva partida → creador (9 pasos con los valores por defecto) → «Comenzar la aventura» → prólogo (relato y diálogo) → llegada a Merrowick (escena `explore`) → camina hacia el este hasta que salta la emboscada e1 (`window.__combate`). `--hasta victoria` añade `?autocombate&autonivel` y espera a ganar e1 (`store.cp.flags.e1_done`). Falla ante cualquier `console.error`, excepción, petición fallida o HTTP ≥ 400 (filtra solo el ruido del controlador de SwiftShader) y deja `resumen.json` y capturas.

Resultados del 11 nov (capturas en `tools/salida/capturas/`, no versionado; `comparacion/` las pone lado a lado):

| Versión | Recorrido | Resultado |
|---|---|---|
| `publicado/` | hasta el combate e1 | sin errores; Merrowick a los 104 s, combate a los 478 s |
| `web/dist/` (código de `src/`) | hasta el combate e1 | sin errores; Merrowick a los 104 s, combate a los 394 s |
| paso 3 (three desde npm, fichero único) | hasta Merrowick | sin errores |
| paso 4 (datos extraídos, fichero único) | hasta Merrowick | sin errores |

En todas aparece el mismo único aviso de consola, del controlador de SwiftShader (`KHR_parallel_shader_compile extension not supported`). Las capturas coinciden salvo lo que depende del azar con tiempos (nombre por defecto del héroe, tiradas de iniciativa).

## Problemas abiertos y siguientes pasos

- **Nombres locales minificados** en todos los módulos y muchos enlaces de nivel superior sin nombre (`Xl`, `n2`, `fc`…). Sugerencia para cada área: renombrar primero los exports de su `index.js` hacia dentro, luego locales función a función, comprobando con `node build.mjs` y `tools/verificar.cjs` (y, mejor, comparando el bundle legible antes/después con `--sin-minificar`).
- Los nombres de fichero deducidos (todos salvo los `index.js`, `theme.css`, `tips.js` y niveles) son propuestas: se pueden cambiar, pero sin crear `index.js` nuevos en `src/*/`.
- `cp_take` y `cp_cast` no existen en el núcleo publicado (el JS usa alternativas); a decidir con el área motor.
- Bancos de pruebas (`combate.js`, `posada.js`, `app.js`, `dev_<área>.js`) no reconstruidos: comparten casi todo el código con `juego.js`; si hacen falta, son entradas nuevas de esbuild sobre los mismos módulos.
- Pendientes de los días 7–8 (ver `docs/RECONSTRUCCION.md`): no están en la prueba 1 y no se han tocado.
