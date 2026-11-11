# Paridad con el núcleo publicado

El oráculo es `publicado/rules/rules.wasm` (+ `rules.mjs`), que no se toca. El núcleo
reconstruido (`motor/src/`) se compara con él petición a petición.

## Compilar y probar

```sh
# Nativo: biblioteca, pruebas (doctest) y herramienta de línea de órdenes
cmake -S motor -B motor/build -DCMAKE_BUILD_TYPE=Release
flock /tmp/mdg-pesado.lock cmake --build motor/build -j2
(cd motor/build && ctest)

# Wasm (Emscripten 7.0.0 en /home/claude/tools/emsdk): deja motor/dist/rules.mjs + rules.wasm
source /home/claude/tools/emsdk/emsdk_env.sh
emcmake cmake -S motor -B motor/build-wasm -DCMAKE_BUILD_TYPE=Release
flock /tmp/mdg-pesado.lock cmake --build motor/build-wasm -j2

# Paridad (wasm de motor/dist, o la herramienta nativa con --cli)
node motor/paridad/comparar.mjs
node motor/paridad/comparar.mjs --cli motor/build/mdg_cli creador
```

`motor/build/mdg_cli` lee una petición JSON por línea y escribe una respuesta por línea (con
`MDG_DETERMINISTA=1`, el mismo azar fijo que el arnés).

## Cómo se mide

1. `node motor/paridad/grabar.mjs [filtro]` ejecuta los escenarios de `motor/paridad/escenarios/`
   contra el wasm publicado y guarda cada petición con su respuesta en
   `motor/paridad/oro/<archivo>.<escenario>.jsonl.gz`. Los escenarios deciden la siguiente
   petición con las respuestas del oráculo (un jugador automático con semilla propia).
2. `node motor/paridad/comparar.mjs [--cli motor/build/mdg_cli] [filtro]` reproduce exactamente
   el mismo texto JSON contra el núcleo nuevo (el wasm de `motor/dist/` o la herramienta nativa)
   y clasifica cada respuesta: **idéntica** (mismo texto byte a byte), **equivalente** (mismo
   JSON con otro orden de claves) o **distinta**.

Determinismo: cuando una petición no trae `seed`, el núcleo siembra su generador global con el
reloj y con `random_device`. El arnés fija las dos fuentes al cargar el wasm (`clock_time_get` y
`random_get` de WASI) y la herramienta nativa hace lo mismo con `MDG_DETERMINISTA=1`
(`Pcg32::entropia`), así que también las tiradas sin semilla son comparables.

## Resultado

Corpus: 28 613 peticiones en 135 escenarios, que cubren las 72 operaciones del núcleo (más
peticiones mal formadas, operaciones inexistentes y documentos de campaña raros).

| Grupo | Escenarios | Peticiones | Idénticas |
|---|---|---:|---:|
| Datos y fichas (`data`, `loc`, `monster_info`, `item_info`, `random_name`) | `datos.*` | 645 | 100 % |
| Combate con IA (`init`, `state`, `ai_turn`, `end_turn`…) | `combate_ia.*` | 1 788 | 100 % |
| Combate con jugador automático (todas las acciones del PJ) | `jugador.*` | 6 136 | 100 % |
| Combate en el mapa del nivel (`battle_start`, `battle_end`) | `mapa_combate.*`, `combate_clases.*` | 8 401 | 100 % |
| Campaña (`cp_*`, `party_summary`, `has_item`) | `campana.*` | 619 | 100 % |
| Pruebas (`check`, `group_check`, `passive`, `best`) | `pruebas.*` | 1 412 | 100 % |
| Inventario y tienda (`inv_*`, `identify`, `shop_*`) | `objetos.*` | 3 032 | 100 % |
| Mapa de exploración (`xmap_*`) | `xmap.*` | 2 958 | 100 % |
| Creador y subida de nivel (`sheet_*`, `level_choices`, `levelup_begin`) | `creador.*` | 3 622 | 100 % |

Las cifras son las de la herramienta nativa y las del wasm de `motor/dist/` (las dos dan el mismo
resultado; el wasm se compila con las mismas opciones que el publicado: Emscripten 7.0.0, `-O2`,
`-fwasm-exceptions`).

## Diferencias conocidas

Dentro del corpus no queda ninguna. Lo que sigue son casos que el corpus no puede distinguir o
decisiones tomadas al reconstruir:

- **Precio con recargo**: el publicado da 55 po por una poción de 50 po con recargo 1,1 (un
  `ceil` directo en coma flotante daría 56). Se usa `ceil(valor × recargo − 1e−9)`, que coincide
  en todo el género de los comerciantes; un redondeo distinto solo se notaría con recargos que no
  estén en los datos.
- **Varios cambios en `sheet_set` (`sets`)**: se aplican todos y el motivo devuelto es el del
  último que falla (así lo hace el publicado en todos los casos grabados con dos errores).
- **Excepciones**: con `op` que no es una cadena (número, `null`, objeto) el publicado lanza una
  excepción de C++ que el JavaScript ve como `Exception`; el nuevo hace lo mismo (las mismas
  aserciones de nlohmann activas, sin `NDEBUG`).
- **`cp_take` y `cp_cast`**: aparecen en las cadenas del publicado pero responden
  `op desconocida`; se mantiene.
- **Datos**: el núcleo lleva dentro los mismos `data/` que el publicado (`--embed-file`). Si se
  cambian los datos, el oro hay que volver a grabarlo.

## Notas de trabajo

- Las compilaciones pesadas se lanzan bajo `flock /tmp/mdg-pesado.lock`. Mientras QA tenía el
  cerrojo durante horas, las compilaciones nativas incrementales se hicieron fuera de él con
  `nice -n 19` (un archivo cada vez) y la del wasm siempre esperó al cerrojo.
- El análisis del wasm publicado (descompilado con wabt, cadenas anotadas) se hizo fuera del
  repositorio; solo quedan aquí el código reconstruido, el arnés y el oro.
