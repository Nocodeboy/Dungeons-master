# Marca de Granito PC · instrucciones para Claude Code

Proyecto de Unreal Engine 5.8 de la versión para PC de **Marca de Granito**, un juego de rol táctico de fantasía con reglas de D&D 5e (2024). La versión original está hecha en Godot para móvil; esta rama la rehace para PC con estética de **escenario pintado en vista isométrica, al estilo de Baldur's Gate 2**.

- Habla siempre en **español** con el usuario. Sé directo y sincero: si algo no va a quedar bien, dilo.
- Todos los textos del juego van en español.
- Lee `docs/DIRECCION_DE_ARTE.md` antes de tocar nada visual. Manda sobre cualquier otra idea de estilo.

## Mapa del proyecto

| Ruta | Qué es |
|---|---|
| `Source/MarcaDeGranitoPC/Rules/` | **Núcleo de reglas portable** (C++20, `namespace mdg`, sin nada de Unreal). Traducción fiel del GDScript de Godot |
| `Source/MarcaDeGranitoPC/Game/` | Código de Unreal: `UMdgRulesSubsystem` (carga las reglas y las ofrece a Blueprints) |
| `Source/MarcaDeGranitoPC/ThirdParty/` | `nlohmann/json.hpp` (MIT), solo cabecera |
| `Content/Data/` | JSON de reglas y contenido (clases, conjuros, monstruos, encuentros, niveles). **Los mismos que la versión de Godot**. Se empaquetan fuera del .pak |
| `Tests/` | Pruebas del núcleo con CMake + doctest, y el comparador con Godot (`Tests/parity/`) |
| `reference/godot/` | GDScript original (solo para consultar al portar; no se compila) |
| `docs/` | Dirección de arte, filtros HLSL para el posproceso |

## El núcleo de reglas (Rules/)

Es la parte más delicada. Se ha portado línea a línea desde `reference/godot/` y **produce exactamente los mismos resultados que Godot**: el generador de números es el PCG32 de Godot con la misma siembra, y los diccionarios conservan el orden de inserción (`OMap`, `nlohmann::ordered_json`).

Estado del port:

| GDScript | C++ | Estado |
|---|---|---|
| `dice.gd`, `rules_db.gd`, `effect.gd` | `MdgDice`, `MdgRulesDB`, `MdgEffect` | Hecho, idéntico a Godot |
| `creature.gd`, `factory.gd`, `character_sheet.gd` | `MdgCreature`, `MdgFactory`, `MdgCharacterSheet` | Hecho, idéntico (1.122 casos comparados) |
| `battle_map.gd` | `MdgBattleMap` | Hecho, idéntico (cobertura, áreas, rutas) |
| `items.gd` | `MdgItems` | Hecho salvo `describe()` (textos de interfaz) |
| `loc.gd` | `MdgLoc` | Hecho (textos de `Content/Data/lang/es.json`) |
| `battle.gd`, `spell_resolver.gd`, `class_actions.gd`, `ai_brain.gd` | `MdgBattle`, `MdgSpells`, `MdgClassActions`, `MdgAI` | Hecho, idéntico: 504 combates completos IA contra IA comparados con Godot (registro, eventos y estado final) |
| `battle_setup.gd` | `MdgBattleSetup` | Hecho sin campaña (los PJ entran con el estado de inicio) |
| `campaign.gd` | — | Pendiente (estado guardado entre combates, descansos, botín) |

Los valores de Godot (`Var`, en `MdgVar.h`) imitan los tipos dinámicos de GDScript: `Dictionary` con orden de inserción, `int` y `float` distintos, `==` de Godot. El orden de `sort_custom` se reproduce con `godot_sort` (`MdgSort.h`), empates incluidos: si ordenas algo que afecte al combate, usa `godot_sort`, nunca `std::sort`.

Normas para tocar `Rules/` (Unreal compila estos .cpp con sus macros y juntando varios en uno):
- Nada de `#include` de Unreal ni tipos de Unreal. La conversión FString ↔ std::string se hace solo en `Game/`.
- No uses identificadores que choquen con macros de Unreal: `check`, `verify`, `ensure`, `PI`, `IN`, `OUT`, `TEXT`, `DELTA`, `INDEX_NONE`. Constantes en `kCamelCase`.
- Nada de `using namespace` en los .cpp ni funciones con el mismo nombre en espacios anónimos de varios archivos: usa un espacio `mdg::<archivo>_detail`.
- Sin sombrear variables ni miembros (en Unreal es un error de compilación).
- Para leer JSON usa los lectores tolerantes de `MdgJson.h` (`jstr`, `jint`, `jobj`, `jarr`...), que imitan `d.get(k, defecto)` de GDScript y nunca lanzan excepciones.
- Si cambias una regla, cámbiala también en la versión de Godot o avisa al usuario: las dos versiones comparten los datos.

### Pruebas

Visual Studio trae CMake. Desde la carpeta del proyecto, en la «Developer PowerShell for VS»:

```powershell
cmake -S Tests -B Tests/build
cmake --build Tests/build --config Release
Tests\build\Release\mdg_tests.exe
```

Pasa las pruebas después de cualquier cambio en `Rules/`. Deben salir todas en verde. Incluyen cinco combates «de oro» cuyo registro completo tiene que coincidir con el de Godot.

Comparación completa con Godot (si cambias reglas en las dos versiones, o si una prueba de oro falla):

```powershell
godot --headless --path <proyecto-godot> -s Tests/parity/battle_dump.gd -- godot.json 2
Tests\build\Release\mdg_battle_dump.exe cpp.json 2
python Tests/parity/compare_battles.py godot.json cpp.json
```

## El equipo de desarrollo (sobremesa «OFICINA»)

Intel Core i5-4690K (4 núcleos, 4 hilos), 16 GB de RAM, Radeon RX 570 de 8 GB, Windows 11. Da para este proyecto, pero hay que respetar sus límites:

- **Sin trazado de rayos**: nada de GPU Lightmass, Lumen, MegaLights ni reflejos por trazado. La luz se hornea con Lightmass por CPU.
- **Sin Nanite ni sombras virtuales** (desactivados en `DefaultEngine.ini`): mallas normales con LOD y mapas de sombras clásicos.
- **CPU modesta**: la primera vez que se abre el proyecto compila muchos shaders y tarda; hornear la luz en «Production» también. Avisa al usuario antes de operaciones largas.
- **16 GB de RAM**: con el editor, Visual Studio y Claude Code abiertos va justo. No abras varios editores ni compiles mientras se hornea.
- **Objetivo de rendimiento**: 60 fps a 1080p en esta RX 570 con la calidad por defecto. Mide con `stat fps` y `stat unit` en cada etapa.

## Reglas de trabajo con el editor (plugin de Epic)

- El editor de Unreal tiene que estar **abierto** con el servidor MCP arrancado. Comprueba con `/mcp` que aparece `unreal-mcp`.
- Pide permiso para cada acción en el editor; no se usa `--dangerously-skip-permissions`.
- **Guarda y haz commit antes de operaciones largas** (hornear luz, importar muchos assets, cambios masivos en un nivel). Los `.uasset` y `.umap` van por Git LFS (`.gitattributes`).
- No compres nada ni aceptes licencias en nombre del usuario. Si hace falta un asset de pago, explícale cuál y por qué, y que decida él.
- Assets de Fab: solo los que el usuario haya añadido a su biblioteca. Si falta algo, usa un sustituto provisional (formas básicas) y apúntalo en `docs/PENDIENTES.md`.
- Nunca guardes contraseñas, claves ni datos personales en el repositorio.

## Rebanada vertical: lo que toca ahora

### Etapa A · El aspecto (sin combate)

Objetivo: **la plaza de Merrowick al atardecer** parece una lámina pintada y va a 60 fps a 1080p.

1. **Estructura**: carpetas `/Game/Maps`, `/Game/Art` (Materials, Meshes, Textures, PostProcess), `/Game/Blueprints`, `/Game/UI`, `/Game/Characters`.
2. **Cámara y control** en C++ (`Source/MarcaDeGranitoPC/Game/`): `AMdgGameMode`, `AMdgPlayerController` y `AMdgCameraPawn`.
   - Cámara fija sin rotación: inclinación de -50°, campo de visión de unos 22°, brazo largo (unos 4.000 uu), tres niveles de zoom.
   - Desplazamiento con WASD, con el ratón en los bordes y arrastrando con el botón central. Enhanced Input.
   - Clic izquierdo en el suelo: el grupo va allí en formación (NavMesh). Clic en un personaje: lo selecciona. Arrastrar: selección múltiple.
3. **Nivel `Merrowick_Plaza`**: luz direccional baja y cálida, Sky Atmosphere, Exponential Height Fog, Post Process Volume infinito. La plaza tiene el toro de granito agrietado en el centro (resplandor rojo de la grieta, el único rojo de acento), empedrado, fachadas de la posada y el templo, un carro, faroles y humo de chimeneas. El trazado de referencia está en `Content/Data/levels/merrowick.json` (cada carácter de `rows` es un hexágono de 1,5 m).
4. **Filtro de pintura**: material `M_PP_Pintura` con el Kuwahara de `docs/arte/kuwahara.hlsl`, la línea de `docs/arte/bordes_profundidad.hlsl`, una textura de lienzo suave y una LUT cálida. Parámetro «Pincelada» (2/3/4).
5. **Grupo**: cuatro personajes provisionales (maniquíes de Unreal o los de Paragon si el usuario los ha añadido) con animación de andar, círculos de selección proyectados en el suelo (verde grupo, rojo enemigos, amarillo neutrales).
6. **Luz**: hornear con **Lightmass por CPU** (no GPU Lightmass: la gráfica no tiene trazado de rayos), antorchas y faroles como luces dinámicas. Mientras se itera, hornea en calidad «Preview»; «Production» solo al final.
7. **Comprobar**: `stat fps` y `stat unit` a 1080p. Haz una captura y enséñasela al usuario para que la apruebe antes de seguir.

### Etapa B · El primer combate

La emboscada de los trasgos (`Content/Data/encounters/e1_prado.json`) con las reglas portadas: rejilla hexagonal proyectada (decal), iniciativa, mover, atacar, ataques de oportunidad, conjuros de nivel 1 y la IA de los trasgos. El núcleo de combate ya está portado y comprobado: **lee `docs/COMBATE_EN_UNREAL.md`** antes de empezar (bucle de turnos, llamadas para cada acción y lista de eventos que hay que animar). Primera comprobación en el editor: escribe `Mdg.Simulate e1_prado 1000` en la casilla «Cmd» del Output Log (o llama a `UMdgRulesSubsystem::SimulateEncounter` desde un Blueprint); el registro de salida vuelca el combate entero y dice quién gana.

### Etapa C · Pulido

Sonido y música (están en el proyecto de Godot, `assets/audio`), transición del paseo al combate, menú mínimo y ejecutable de Windows.

## Geometría del tablero

Hexágonos con vértice arriba, coordenadas «odd-r» (columna, fila; las filas impares se desplazan medio hexágono a la derecha). En el plano de casillas hay 1 unidad entre centros vecinos: `BattleMap::center(cell)` da (x, y). En Unreal, 1 unidad = 150 uu (1,5 m): `X = x * 150`, `Y = y * 150`. Usa siempre `BattleMap` para pasar de casilla a mundo y viceversa.
