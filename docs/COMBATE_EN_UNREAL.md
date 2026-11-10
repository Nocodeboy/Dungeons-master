# Cómo usar el núcleo de combate desde Unreal (etapa B)

El combate ya está portado a C++ (`Source/MarcaDeGranitoPC/Rules/`) y da **exactamente** los mismos resultados que la versión de Godot: 504 combates completos IA contra IA (3 encuentros × niveles 1-3 × 7 grupos con las 12 clases × 8 semillas) salen idénticos línea a línea, evento a evento y en el estado final de cada criatura. Las consultas que usa la interfaz (casillas alcanzables, previsión de cada ataque, conjuros y rasgos disponibles con sus objetivos, ataques de oportunidad de una ruta, mover y deshacer) también se compararon en 995 turnos de PJ: idénticas. Unreal solo tiene que **dibujar** lo que pasa y **traducir los clics** a llamadas del núcleo.

Este documento es el mapa para hacerlo. La referencia de cómo lo hace Godot está en el proyecto original, `scripts/battle/battle_screen.gd` y `battle_hud.gd`.

## La regla de oro

El núcleo es **síncrono y determinista**. Una llamada (`do_move`, `do_attack`, `spells->cast`, `ai.take_turn`...) resuelve todo al instante, tiradas incluidas, y deja una cola de **eventos**. La vista los saca con `pop_events()` y los reproduce uno a uno como animaciones. Nunca se toca el estado de las criaturas desde Unreal: solo se lee.

## Quién es el dueño

Crea un `UObject` o `UActorComponent` (por ejemplo `UMdgBattleComponent` en el nivel de combate) que guarde:

```cpp
std::unique_ptr<mdg::Battle> Battle;   // dueño de las criaturas
std::unique_ptr<mdg::AIBrain> Brain;   // referencia a *Battle: créalo después y destrúyelo antes
```

- Cabeceras: `MdgBattleSetup.h` y `MdgAI.h`; para usar `Battle->spells` y `Battle->cls` incluye también `MdgSpells.h` y `MdgClassActions.h` (si no, el compilador dice «incomplete type»).
- `mdg::BattleSetup::build("e1_prado", Semilla)` monta el combate (grupo por defecto, casillas de salida, enemigos numerados, conjuros previos como Armadura de mago).
- Para un grupo hecho en el creador: pasa un array JSON de hojas (`{"id", "name", "class", "species", ...}`) como tercer argumento.
- Las reglas tienen que estar cargadas: `UMdgRulesSubsystem` lo hace al arrancar (`RulesDB::load_all` y `Loc::load`).
- Los punteros `mdg::Creature*` viven mientras viva `Battle`. No los guardes en `UPROPERTY`; guarda el `id` (`std::string`) y búscalo con `Battle->get_creature(id)`.

## El bucle del combate

Traducción directa de `_run_battle()` de Godot:

```
Battle->start();                 reproducir pop_events()  (iniciativa, ronda 1, primer turno)
mientras !Battle->over:
    c = Battle->current
    si c->team == 0 y lo controla el jugador y c->can_act():
        turno del jugador (esperar clics; cada acción -> llamada al núcleo -> reproducir eventos)
    si no:
        Brain->take_turn(c)      reproducir pop_events()
    si Battle->over: salir
    Battle->end_turn()           reproducir pop_events()
fin: Battle->winner (0 = gana el grupo, 1 = ganan los enemigos)
```

`take_turn` tarda menos de 25 ms incluso en los turnos más complicados (medido en Release), así que se puede llamar en el hilo del juego sin tirones. Reproduce los eventos con un temporizador o una cola latente; la lógica ya terminó.

## Lo que necesita el turno del jugador

| Para... | Llamada |
|---|---|
| Casillas a las que puede ir (y con Carrera) | `Battle->move_options(c)` → `cost`, `prev`, `dash_cost`, `dash_prev` |
| Ataques de oportunidad que provocaría una ruta | `Battle->path_threats(c, ruta)` |
| Moverse | `Battle->do_move(c, ruta, carrera)` · deshacer: `can_undo_move` / `undo_move` |
| Ataques disponibles | `Battle->attack_profiles(c)` (cada uno con `key`, `kind`, `name`...) |
| Alcance y previsión (probabilidad, daño medio) | `in_attack_range(c, perfil, t)`, `preview_attack(...)`, `attack_mode(...)`, `cover(...)`, `target_ac(...)` |
| Atacar | `Battle->do_attack(c, key, t, opciones)` (opciones: `offhand`, `rider` de `spells->rider_options`) |
| Conjuros disponibles | `Battle->spells->available(c)` (`usable`, `reason`, `slots`, `cost`...) |
| Objetivos y áreas | `spells->valid_targets`, `spells->area_cells`, `spells->point_in_range`, `spells->preview` |
| Lanzar | `Battle->spells->cast(c, id, espacio, datos)` (datos: `targets`, `point`, `dir`, `cell`, `meta`) |
| Rasgos de clase (Furia, Segundo aliento, Forma salvaje...) | `Battle->cls->list(c)`, `cls->entry(...)`, `cls->valid_targets(...)`, `cls->use(c, id, datos)` |
| Acciones comunes | `do_dash`, `do_disengage`, `do_dodge`, `do_hide`, `do_help`, `do_shove`, `do_stabilize`, `do_wake`, `do_potion`, `do_item`, `do_escape` |
| Terminar el turno | volver al bucle (`end_turn` lo llama el bucle) |

Las reacciones de los PJ (Escudo, ataque de oportunidad...) se resuelven solas según `Battle->settings["pc_reactions"]`: `"auto"` (por defecto) o `"never"`.

## Los eventos

Cada evento es un diccionario `Var` con `"t"` (tipo) y datos. Las criaturas van por `id`. Los que más importan para la vista:

| `t` | Datos | Qué dibujar |
|---|---|---|
| `initiative` | `who`, `roll` | Barra de iniciativa |
| `round`, `turn`, `turn_end` | `n` / `who`, `round` | Anillo del personaje activo, cámara |
| `move` | `who`, `path` (casillas), `dash` | Andar por la ruta casilla a casilla |
| `attack` | `who`, `target`, `kind` (melee/ranged/spell), `hit`, `crit`, `total`, `ac`, `natural`, `oa`... | Animación de ataque, texto «¡Impacta!» / «Falla» |
| `damage` | `who`, `amount`, `type`, `hp`, `max`, `crit`, `source` | Número flotante, barra de vida |
| `heal`, `temp_hp`, `max_hp` | `who`, `amount`, `hp`, `max` | Número verde, barra |
| `cast` | `who`, `spell`, `slot`, `targets`, `cells`, `point`, `fx` | Efecto del conjuro |
| `missile`, `burst` | `who`, `target` / `cells`, `fx` | Proyectil, explosión |
| `save` | `who`, `ability`, `dc`, `total`, `success` | Texto «Salva» / «Falla» |
| `condition`, `effect`, `concentration` | `who`, `cond`/`kind`/`spell`, `on` | Iconos de estado |
| `downed`, `death`, `death_save`, `stable`, `revive`, `stand` | `who`... | Caer, morir, levantarse |
| `zone`, `zone_hit` | `id`, `cells`, `color`, `kind`, `on`, `moved` | Decal de la zona (Nube, Telaraña...) |
| `summon`, `summon_move`, `unsummon` | `id`, `kind`, `cell` / `from`, `to` | Arma espiritual, esfera llameante |
| `push`, `teleport`, `swap` | `who`, `from`, `to` | Desplazamiento forzado |
| `shape` | `who`, `form` | Forma salvaje (cambio de modelo) |
| `hide`, `reveal` | `who`, `success` | Transparencia del personaje |
| `log` | `text` | Registro de combate (ya en español) |
| `end` | `winner` | Pantalla de victoria o derrota |

Lista completa de tipos: `attack blocked buff burst cast concentration condition damage dash death death_save disengage downed effect end escape feature heal hide immune initiative inspiration item log max_hp mirror missile move push reaction resize reveal revive round save shape shove sneak special stable stand summon summon_move swap teleport temp_hp turn turn_end unsummon zone zone_hit`.

## Casillas y mundo

Hexágonos con vértice arriba, «odd-r». `mdg::BattleMap::center(cell)` da la posición en el plano de casillas; en Unreal multiplica por 150 uu (1,5 m). Para el clic: proyecta el ratón al suelo, divide entre 150 y pasa el punto a `BattleMap::cell_at(punto)`. Para convertir el `prev` de `move_options` en una ruta: `BattleMap::build_path(prev, origen, destino)`.

## Prueba rápida en el editor

En la casilla «Cmd» del Output Log: `Mdg.Simulate e1_prado 1000`. También desde Blueprint: `UMdgRulesSubsystem::SimulateEncounter("e1_prado", 1000)`. Juega el encuentro entero con la IA en los dos bandos y escribe en el registro de salida quién gana, en cuántas rondas y lo que tardó el turno de IA más lento. El comando vuelca además el registro de combate completo; desde Blueprint, el resultado lo trae en `Log` para enseñarlo en una ventana de depuración.

## Si algo no cuadra con Godot

1. En Godot: `godot --headless --path <proyecto-godot> -s Tests/parity/battle_dump.gd -- godot.json 2`
2. En C++: `mdg_battle_dump cpp.json 2`
3. `python3 Tests/parity/compare_battles.py godot.json cpp.json` dice el primer combate, la primera línea del registro y el primer evento en que se separan.

Añade `probe` al final de los dos primeros comandos (`... godot.json 1 probe` y `... cpp.json 1 probe`) para comparar también las consultas de la interfaz.
