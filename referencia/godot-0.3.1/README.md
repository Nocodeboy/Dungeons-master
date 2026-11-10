# Marca de Granito — Hito 1

Rol táctico por turnos para móviles (horizontal), inspirado en los clásicos de rol de los noventa y compatible con la quinta edición (SRD 5.2.1). Hecho con Godot 4.7 (renderizador Compatibility).

## Qué incluye este hito

- **Combate táctico 5e completo**: iniciativa, movimiento por casillas (1 casilla = 1,5 m), acción / acción adicional / reacción, ataques de oportunidad, ventaja y desventaja, cobertura, crítico, salvaciones contra la muerte, concentración, maestrías de armas (2024) y estados.
- **Cuatro compañeros jugables** (niveles 1 a 3): Brenna (guerrera), Pip (pícaro), Ilyra Sorendel (clériga) y Maese Odvar (mago), con sus conjuros y rasgos.
- **Tres encuentros** del Capítulo 1 «El toro que sangra»: el prado, el pinar y el túmulo (jefe final), con relato de entrada y salida, consejos y subida de nivel entre combates.
- **IA enemiga** por perfiles (manada, arqueros, jefe…) y modo **Auto** para que la IA lleve a cualquier compañero.
- **Interfaz táctil**: tocar para moverse o atacar (con probabilidad de impacto y daño medio antes de confirmar), mantener pulsado para ver la ficha, arrastrar/pellizcar/girar la cámara, Deshacer movimiento.
- Menú principal, ajustes (velocidad, reacciones, tamaño de texto, daltonismo, calidad gráfica, volumen), pausa, guía «Cómo se juega», créditos y guardado automático del progreso.

## Instalar en Android

1. Copia `MarcaDeGranito.apk` al móvil.
2. Ábrelo y permite «instalar apps de origen desconocido» cuando lo pida.
3. Requisitos: Android 7.0 o superior (ARM de 32 o 64 bits).

## Jugar en Windows

Ejecuta `MarcaDeGranito.exe`. Con ratón: clic = tocar, arrastrar = mover la cámara, rueda = zoom, botón derecho = girar. Windows puede avisar de que es una app sin firmar («Más información» → «Ejecutar de todas formas»).

## Abrir el proyecto

1. Instala Godot 4.7 (versión estándar, no .NET).
2. Abre `project.godot`. La escena principal es `scenes/main.tscn`.

Estructura:

- `scripts/core/` — motor de reglas 5e, sin dependencias visuales (dados, criaturas, mapa, combate, conjuros).
- `scripts/ai/` — IA de combate.
- `scripts/view/` — escenario 3D, unidades, efectos, cámara y retratos.
- `scripts/battle/` — pantalla de combate y HUD.
- `scripts/ui/` — menús, relato, resultados, ajustes, créditos.
- `data/` — reglas en JSON (armas, armaduras, conjuros, monstruos, clases, grupo, encuentros, textos).
- `tests/` — pruebas del motor: `godot --headless --path . -s tests/run_tests.gd`.
- `tools/simulate.gd` — bot de equilibrado: `godot --headless --path . -s tools/simulate.gd -- e3_tumulo 40 2000`.

## Exportar

- Android: `tools/export_android.sh` (necesita el SDK de Android y las plantillas de exportación de Godot 4.7.2).
- La firma usa `android/marca-de-granito-release.keystore`. **Guarda ese archivo y su contraseña**: sin ellos no podrás publicar actualizaciones que se instalen encima de esta versión. No están en git a propósito.

## Licencias

- Reglas: SRD 5.2.1 de Wizards of the Coast (CC BY 4.0). Atribución completa en la pantalla de créditos.
- Modelos: KayKit (Kay Lousberg) y Quaternius, CC0.
- Iconos: game-icons.net (Lorc, Delapouite, Skoll, Sbed, Zeromancer, Felbrigg, Guard13007), CC BY 3.0.
- Música: RandomMind, CC0. Efectos: Kenney, CC0, y efectos sintetizados propios.
- Tipografías: Cinzel y Alegreya Sans, SIL Open Font License 1.1.
- Motor: Godot Engine, licencia MIT.
