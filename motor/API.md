# API del núcleo de reglas (`rules.wasm` + `rules.mjs`)

Ingeniería inversa del núcleo publicado (`publicado/rules/`), reconstruido en `motor/src/`. Todo lo
que se describe aquí lo comprueba el arnés de `motor/paridad/` contra el wasm publicado.

## Módulo

- `rules.mjs` es un módulo ES6 de Emscripten (`MODULARIZE`, `EXPORT_NAME=createRules`):
  `const R = await createRules({ locateFile })`.
- Exporta `_mdg_call(ptr) -> ptr`, `_malloc`, `_free` y los ayudantes `UTF8ToString` y
  `stringToNewUTF8`. Los datos de reglas van dentro (`--embed-file data@/data`).
- Uso (el mismo que `publicado/juego.js`):

  ```js
  const p = R.stringToNewUTF8(JSON.stringify({ op: 'state' }));
  const res = JSON.parse(R.UTF8ToString(R._mdg_call(p)));
  R._free(p);
  ```

  La respuesta vive en un búfer estático del módulo: no se libera y se sobrescribe en la siguiente
  llamada.
- Petición: un objeto JSON con `op` y sus parámetros. Si el texto no es JSON o no es un objeto:
  `{"error":"Petición JSON no válida."}`. Si `op` existe pero no es una cadena, el núcleo lanza una
  excepción de C++ (igual que el publicado). Los errores de las operaciones son `{"error": "..."}`;
  una excepción interna da `{"error":"Error interno del núcleo: ..."}`.
- Los datos se cargan en la primera llamada; si fallan:
  `{"error":"No se han podido cargar los datos de reglas.","details":[...]}`.

## Estado y azar

- El módulo guarda entre llamadas el combate en curso (y su IA) y el mapa de exploración.
- `seed` numérica y no negativa en la petición: generador PCG32 propio para esa llamada. Sin
  `seed`: el generador global del módulo, que se siembra la primera vez con el reloj y dos
  números de `random_device`.
- Los lectores son tolerantes: un número en vez de cadena se convierte, `null` da el valor por
  defecto, las cadenas numéricas valen como enteros, etc. (`src/rules/MdgJson.*`).

## Orden de despacho

1. Datos y fichas: `data`, `loc`, `monster_info`, `item_info`, `random_name`, hojas (`sheet_*`,
   `level_choices`, `levelup_begin`).
2. Campaña: `cp_*`, `party_summary`, `has_item` (si empieza por `cp_` y no existe:
   `op desconocida: cp_x`; `cp_take` y `cp_cast` no existen en el publicado).
3. Objetos y tienda: `inv`, `inv_preview`, `inv_equip`, `inv_unequip`, `inv_give`, `inv_use`,
   `inv_drop`, `identify`, `shop`, `shop_buy`, `shop_sell`.
4. Pruebas: `check`, `group_check`, `passive`, `best`.
5. Mapa de exploración: `xmap_*`.
6. Inicio de combate: `init`, `battle_start`, `battle_end`.
7. Si no hay combate: `{"error":"sin combate"}`; si lo hay, las operaciones del combate; si no
   existe: `op desconocida: ...`.

Todas las operaciones de 3, 4 y las de campaña (salvo `cp_new`) exigen `cp` (objeto); si falta:
`{"error":"Falta el documento de campaña (cp)."}`. El `cp` se normaliza antes de usarlo.

## Datos y fichas

| op | parámetros | respuesta |
|---|---|---|
| `data` | `name` (world, names, armor, backgrounds, classes, feats, features, items, merchants, monsters, party, species, spells, weapons, encounters, levels) | la tabla; si no existe `No hay datos con ese nombre: X` |
| `loc` | `keys` (lista, opcional) | `{clave: texto}`; sin lista, la tabla entera |
| `monster_info` | `id` | ficha del monstruo (CA, PG, características, rasgos, ataques, conjuros…) |
| `item_info` | `id`, `unid` | ficha del objeto (`name`, `real_name`, `desc`, `lines`, `price`, `sell`, `weight`…) |
| `random_name` | `species`, `pronoun`, `seed` | `{name}` |

## Creador y hojas

El estado del creador va en la hoja: `_creator = {mode: "create"|"levelup", level, bg_chosen,
abilities_touched, look_touched, old_skills?, old_expertise?}`. Una hoja sin `_creator` se trata
como ya tocada (todas las banderas a `true`). `level` en la petición (1–3) cambia `_creator.level`.

| op | parámetros | respuesta |
|---|---|---|
| `sheet_new` | `class`, `species`, `pronoun`, `seed` | `{sheet, options}` con todo lo recomendado y nombre al azar |
| `sheet_set` | `sheet`, `set: {what, value, …}` o `sets: [...]`, `step`, `level`, `seed` | `{sheet, ok, reason, options}`; con `sets` se aplican todos y `reason` es el del último que falla |
| `sheet_options` | `sheet`, `step`, `level` | opciones (solo la vista de `step`, o todas) |
| `sheet_complete` | `sheet`, `level` | hoja completada (sin `_creator`) |
| `sheet_validate` | `sheet`, `level` | `{ok, errors}` (validación de la hoja + avisos de los pasos) |
| `sheet_finish` | `sheet` | `{sheet, ok, errors}`: hoja final con `id: "hero"`, `is_hero`, `ai`, `choices_level` |
| `sheet_summary` | `sheet`, `level`, `state` | hoja resumida (la de `party_summary`) |
| `level_choices` | `sheet`, `from`, `to` | `{level, remaining, sheet, options}` para subir a `from + 1` |
| `levelup_begin` | `sheet`, `level` | igual, para subir a `level`; por encima de 3: `No se puede subir más.` |

Valores de `what` en `sheet_set`: `class`, `species`, `lineage`, `ancestry`, `lineage_ability`,
`size`, `human_feat`, `background`, `bg_mode` (`2_1`/`1_1_1`), `bg_bonus` (`ability`, `amount`),
`method` (`standard`/`point_buy`/`roll`), `reroll`, `recommended`, `adjust` (`ability`, `dir`),
`skill`, `new_skill`, `expertise`, `fighting_style`, `order`, `mastery`, `invocation`,
`tome_cantrip`, `lessons_feat`, `metamagic`, `cantrip`, `prepared`, `mi_list`, `mi_ability`,
`mi_cantrip`, `mi_spell`, `kit`, `visual` (`key`, `value`), `visual_toggle` (la clave va en
`value`), `random_look`, `name`, `random_name`, `pronoun`, `subclass`, `land`, `hunters_prey`.
Las listas con tope rechazan añadir con `Ya has elegido N. Quita alguna primero.`

`options` = `{mode, level, title, steps: [{id, title, hint, issue}], issues, errors, ready,
finish_label, hero, final_abilities, point_buy_spent, point_buy_max, standard_array,
recommended_abilities, skill_slots, fixed_skills, expertise_count, expertise_from, feats_needed,
origin_feats, fighting_styles, invocations, masteries, cantrips, spells, kit, bg_gold, gold, hp, ac,
views}`. `views` tiene una entrada por paso (`class`, `species`, `background`, `abilities`,
`skills`, `options`, `spells`, `equipment`, `look`, `identity` y, al subir de nivel, `advance`) con
lo que dibujaba cada `_build_*` de `character_creator.gd`.

## Campaña

`cp = {version, members{id: hoja}, party[ids], state{id: {hp, temp_hp, slots, resources,
free_casts, hit_dice, dead, buffs?}}, party_level, gold, location, flags, journal, day, playtime,
short_rests_left, levels, merchants}`. Las operaciones que cambian el documento devuelven el `cp`
nuevo.

| op | parámetros | respuesta |
|---|---|---|
| `cp_new` | `hero`, `companions` (por defecto `["brenna"]`), `seed` | `{cp}` |
| `cp_load` | `cp` | `{cp}` normalizado |
| `cp_recruit` / `cp_dismiss` | `cp`, `id` | `{cp, ...}` o error (grupo completo, no puedes despedir al héroe…) |
| `cp_hire` | `cp`, `sheet` | mercenario `merc_N` |
| `cp_short_rest` | `cp`, `spend`, `force`, `seed` | `{cp, report, text, left}` |
| `cp_long_rest` | `cp`, `seed` | `{cp, text: "Amanece. Día N."}` |
| `cp_level_up` | `cp`, `level`, `choices` | `{cp, ok, gained, hp}` |
| `cp_gold` | `cp`, `delta` | `{cp}` o `No tenéis oro suficiente.` |
| `cp_give` | `cp`, `item`, `n`, `unid`, `to` | `{cp, who}` (sin `to`, el primero que pueda usarlo) |
| `cp_heal` / `cp_damage` | `cp`, `id` (o `all`/`party`; sin id, el primero vivo), `amount`, `type`, `lethal` | `{cp, ok, results}` (+ los campos del resultado si es uno) |
| `cp_pass_hours` | `cp`, `hours` | `{cp}` |
| `cp_revive` | `cp`, `id` | `{cp}` o `No está muerto.` |
| `cp_level_state` | `cp`, `level`, `state` | estado guardado de un nivel |
| `party_summary` | `cp` | lista de hojas resumidas |
| `has_item` | `cp`, `item` | cuenta en mochila, pila y equipo |

## Objetos y tienda

| op | parámetros | respuesta |
|---|---|---|
| `inv` | `cp`, `who` | vista de inventario: `slots`, `slot_order`, `weapons`, `bag`, `ammo`, `attuned`, `gold`, `stats`, `dead` |
| `inv_preview` | `cp`, `who`, `item`, `slot` | `{ok, reason, item, before, after, lines, changes}` |
| `inv_equip` | `cp`, `who`, `item`, `slot` | `{cp, ok, reason, text}` |
| `inv_unequip` | `cp`, `who`, `slot` | `{cp, ok, reason, text}` |
| `inv_give` | `cp`, `from`, `to`, `item`, `n` | `{cp, ok, reason, text}` |
| `inv_drop` | `cp`, `who`, `item`, `n` | `{cp, ok, reason, text}` |
| `inv_use` | `cp`, `who`, `item`, `target`, `seed` | pociones de curación y perla de poder |
| `identify` | `cp`, `cost` | `{cp, ok, reason, identified, text}` |
| `shop` | `cp`, `merchant`, `who` | `{id, name, npc, markup, buys_kinds, stock, buys, gold, who}` |
| `shop_buy` | `cp`, `merchant`, `item`, `n`, `who` | `{cp, ok, reason, who, price, gold, text}` |
| `shop_sell` | `cp`, `merchant`, `who`, `item`, `n` | `{cp, ok, reason, price, gold, text}` |

`item` puede ser `{idx}` o un número (índice de la mochila), un id o `{id}`. `who` que no es del
grupo pasa al primero vivo del grupo (o `hero`).

## Pruebas

| op | parámetros | respuesta |
|---|---|---|
| `check` | `cp`, `who` (`best`, un miembro; si no, el primero vivo), `skill`/`ability`/`save`/`tool`, `dc`, `adv`, `dis`, `bonus`, `seed` | `{who, name, kind, id, label, d20, kept, mode, mod, total, success, crit, fumble, text, dc, margin}` |
| `group_check` | lo mismo, `who` = lista | `{results, success, passed, needed, label, text}` (hace falta la mitad redondeada hacia arriba) |
| `passive` | `cp`, `skill` | `{id: 10 + mod}` de los vivos |
| `best` | `cp`, prueba | `{who, name, mod, label}` |

## Mapa de exploración

`xmap_load {rows}` → `{w, h}` carga las filas en una rejilla hexagonal (la del combate). El resto
exige mapa cargado (`No hay mapa cargado (llama antes a xmap_load).`):
`xmap_cell {cell}`, `xmap_walkable {cells}` → `{ok[], difficult[]}`,
`xmap_path {from, to, blocked, adjacent, max}` → `{path, cost, ok, goal}`,
`xmap_los {from, to, blockers}` → `{los, cover, dist}`,
`xmap_reach {from, max=6, blocked}` → `{cells: [[x, y, coste]]}`,
`xmap_free {near, n=1, blocked}` → `{cells}`.

## Combate

| op | parámetros | respuesta |
|---|---|---|
| `init` | `encounter`, `seed`, `party`, `level` | `{state, events}` (encuentro de `encounters`) |
| `battle_start` | `cp`, `rows`, `party`, `enemies`, `encounter`, `surprised`, `hidden`, `surprise`, `seed` | `{state, events, cp}` sobre el mapa del nivel |
| `battle_end` | `cp`, `won`, `loot`, `seed` | `{cp, won, dead, survivors, hero_dead, xp, loot, enemies_dead, enemies_alive, rounds, captured}` |
| `state` | — | estado completo (mapa, criaturas, orden, zonas, encuentro) |
| `options` | — | opciones del PJ en turno (o `null`) |
| `threats` | `path` | quién da ataque de oportunidad |
| `move` / `undo_move` | `path`, `dash` | `{ok, events, ...}` |
| `attack_plan` / `attack` / `offhand` | `target`, `key`, `path` | plan con probabilidades; ataque y eventos |
| `spell_begin` / `spell_preview` / `cast` | `spell`, `slot`, `targets`, `point`, `dir`, `cell` | objetivos válidos, vista previa, lanzamiento |
| `simple_targets` / `simple` | `what`, `target` | acciones sencillas (esquivar, ayudar, empujar, pociones…) |
| `feature` | `id`, `choice`, `point`, `dir`, `cell`, `zone` | rasgos de clase |
| `ai_turn` / `end_turn` | — | turno de la IA y fin de turno |
