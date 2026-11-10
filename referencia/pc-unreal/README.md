# Marca de Granito · versión para PC (Unreal Engine 5.8)

Rol táctico de fantasía con reglas de D&D 5e, con escenarios pintados en vista isométrica.

- **Cómo preparar el equipo y abrir el proyecto**: `GUIA_INSTALACION_SOBREMESA.md` (en la carpeta `PC-Unreal`).
- **Estética y plan de trabajo**: `docs/DIRECCION_DE_ARTE.md`.
- **Cómo conectar el combate con Unreal**: `docs/COMBATE_EN_UNREAL.md`.
- **Instrucciones para Claude Code**: `CLAUDE.md`.

## Estructura

- `Source/MarcaDeGranitoPC/Rules/`: las reglas 5e en C++ portable (personajes, monstruos, tablero, combate, conjuros, rasgos de clase e IA), traducidas de la versión de Godot y comprobadas contra ella combate a combate.
- `Content/Data/`: los datos del juego (JSON), compartidos con la versión de Godot.
- `Tests/`: pruebas del núcleo de reglas.

## Licencias de terceros

- nlohmann/json 3.11.3 (MIT): `Source/MarcaDeGranitoPC/ThirdParty/licenses/`
- doctest 2.4.11 (MIT): `Tests/third_party/`
