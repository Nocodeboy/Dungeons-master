# Marca de Granito PC · Dirección de arte y plan de la rebanada vertical

Versión para PC en Unreal Engine 5.8, con estética de rol clásico de los noventa: escenarios que parecen pintados a mano, vistos desde arriba en tres cuartos, como Baldur's Gate 2.

## 1. La idea en una frase

**Un cuadro de fantasía que se mueve.** Se construye un escenario 3D realista, se mira siempre desde el mismo ángulo y un filtro de pintura convierte el detalle en pinceladas. Al jugador le tiene que parecer una lámina de un módulo de D&D en la que sus personajes caminan y pelean.

## 2. Qué tomamos de cada referencia

Son referencias para entender la intención; no se copia nada de ellas.

| Referencia | Qué nos llevamos |
|---|---|
| Baldur's Gate 2 | Cámara cenital de tres cuartos que no gira, decorado denso, paleta cálida de ocres y verdes oscuros, círculos de selección bajo los personajes e interfaz de piedra y metal |
| Pillars of Eternity | Escenarios con pinta de pintados y personajes 3D integrados con luz dinámica (antorchas, hechizos) |
| Ilustración clásica de D&D (años 80 y 90) | Proporciones heroicas pero realistas, armaduras creíbles, monstruos con peso, luz de atardecer |

## 3. Cómo se consigue en Unreal

### Cámara
- **Fija, sin girar.** Inclinación de unos 50° hacia abajo y orientación fija. Cada escena se diseña y se ilumina para ese único ángulo, como en BG2. Por eso desaparecen los problemas de muros que tapan (se resuelven al montar la escena) y el decorado puede ser mucho más denso.
- Perspectiva con campo de visión estrecho (unos 22°) desde lejos: parece isométrica, pero conserva profundidad y la niebla funciona bien.
- Desplazamiento con el ratón en los bordes, con WASD o arrastrando. Zoom entre dos o tres distancias, nada de primeros planos.

### Luz
- Una luz principal cálida y baja (atardecer en Merrowick, sol de mediodía filtrado en Elderhal, antorchas en el túmulo).
- Luz ambiental horneada (Lightmass por CPU; la RX 570 del sobremesa no tiene trazado de rayos para GPU Lightmass) para la sombra suave «pintada». Las antorchas, los hechizos y el resplandor del toro son luces dinámicas.
- Niebla de altura y una niebla volumétrica muy ligera para dar profundidad.
- Lumen solo como opción en la calidad «Épica». La calidad base no lo necesita, y así va bien en gráficas de 6 a 8 GB.

### El filtro de pintura (lo que da el estilo)
Un material de posproceso con cuatro capas:
1. **Kuwahara**: agrupa los colores en manchas como pinceladas y conserva los bordes. Es la clave.
2. **Textura de lienzo** muy suave encima.
3. **Bordes**: un oscurecido ligero de contornos sacado de la profundidad, como la línea de un ilustrador.
4. **Gradación de color** con una tabla (LUT) cálida y una viñeta.

La intensidad se podrá regular en Ajustes («Pincelada: suave, media, fuerte»). El código del Kuwahara para el nodo Custom de Unreal está en el proyecto: `docs/arte/kuwahara.hlsl`.

### Materiales y modelos
- Se usan **assets realistas** (piedra, madera, vegetación con fotos de verdad). El filtro los unifica y los convierte en pintura. Es lo que hace que no se vean «de plástico».
- **Nada de low poly ni de chibis.** No mezclar estilos: si un modelo desentona con el filtro puesto, se descarta.
- Escala real: un humano mide 1,80 m, un enano 1,30 y un mediano 1. Las casillas de combate son hexágonos de 1,5 m (5 pies), como ahora.

### Personajes
- Proporciones realistas o heroicas, con armaduras y armas legibles desde lejos.
- **Círculos de selección** proyectados en el suelo: verde para el grupo, rojo para enemigos y amarillo para neutrales. Contorno al pasar el ratón.
- Retratos pintados para la interfaz. Se pueden generar después a partir de los modelos con el filtro puesto, para que encajen.

### Combate
- La rejilla de hexágonos aparece solo en combate, como un material proyectado sobre el terreno (decal). Las casillas alcanzables, el alcance de los conjuros y las áreas se resaltan encima.
- Números de daño, tiradas visibles y registro de combate, como ahora.

### Interfaz
- Se conserva la estética de piedra y bronce del juego actual, que ya es muy de BG2: las texturas `panel`, `slab` y `divider` pasan a UMG.
- Barra inferior con retratos del grupo, acciones y registro. Diseñada para ratón y teclado (atajos 1-9, espacio para pausa táctica, Tab para resaltar objetos).

### Paleta
Ocres, umbras, tierra tostada y verdes musgo. Cielos de atardecer anaranjados. El **rojo de la grieta del toro** es el color de acento de la historia: no se usa para nada más. La magia va en azul frío y oro.

## 4. Qué se aprovecha del proyecto de Godot

| Se conserva tal cual | Se rehace |
|---|---|
| Datos: clases, especies, conjuros, objetos, monstruos, encuentros, niveles (JSON) | Todo lo visual: escenarios, personajes, efectos |
| Textos y traducciones | Interfaz (misma estética, en UMG) |
| Música y efectos de sonido | Cámara y controles (ratón y teclado) |
| Iconos y texturas de la interfaz | — |
| **Reglas 5e**: se pasan a C++ con el mismo comportamiento y con pruebas | — |

## 5. La rebanada vertical

Sirve para validar el aspecto y el combate antes de rehacer todo.

### Etapa A · El aspecto (sin combate)
**La plaza de Merrowick al atardecer**: el toro de granito agrietado sobre su pedestal con el resplandor rojo, el empedrado, las fachadas de la posada y el templo, un carro, faroles, humo de chimeneas y algo de vida (Maren y un par de aldeanos).
- Cámara fija con su zoom y desplazamiento.
- El grupo de cuatro camina en formación al hacer clic en el suelo.
- Filtro de pintura y luz definitivos.

**Hecho cuando**: una captura de la plaza parece una lámina pintada y se mueve a 60 fps a 1080p en el sobremesa.

### Etapa B · El primer combate
**La emboscada de los trasgos** (el combate `e1` actual) con las reglas portadas.
- Rejilla en el suelo, iniciativa, mover, atacar, ataque furtivo, Disengage/Dash/Dodge, ataques de oportunidad, los conjuros de nivel 1 del grupo y la IA de los trasgos.
- Barra de retratos, acciones y registro.

**Hecho cuando**: el combate se puede jugar de principio a fin y los resultados de la simulación cuadran con los de la versión de Godot.

### Etapa C · Pulido y ejecutable
Sonido, música, transición del paseo al combate sin cortes, menú principal mínimo y un ejecutable de Windows para probar.

## 6. Quién hace qué

| Dónde | Qué |
|---|---|
| **Aquí (sesión en la nube)** | Reglas 5e en C++ con pruebas, conversión de datos, proyecto base, documentación y revisiones |
| **Sobremesa (Claude Code + plugin de Epic, con el editor abierto)** | Montar escenas, materiales, el filtro, personajes, animaciones, interfaz y compilar |
| **Tú** | Instalar, reclamar los assets en Fab, aprobar las acciones en el editor y decidir sobre el aspecto |

## 7. Lista de la compra en Fab

Fab cambia cada mes y no puedo consultarlo desde aquí, así que esto es una lista de criterios y candidatos. Todo se reclama con tu cuenta de Epic y lo gratuito queda en tu biblioteca para siempre.

**Imprescindible para la etapa A**
- **Pueblo medieval**: casas modulares de piedra y entramado de madera, empedrado, carros, barriles, faroles. Busca en Fab con el filtro «Gratis» y «Unreal Engine», ordenado por popularidad. En 2023 y a finales de 2025 Fab regaló kits de pueblo medieval de 250 y 400 piezas; si los reclamaste entonces, ya los tienes.
- **Estatua o roca para el toro**: un toro o bisonte realista que se pueda poner en piedra con un material de granito.
- **Personajes**: los de **Paragon** son gratuitos y de Epic. Candidatos que encajan en fantasía: Greystone (guerrero), Terra (paladina), Sparrow (arquera), Kallari (pícara) y Gideon (mago). Habrá que quitarles lo más futurista.

**Para la etapa B**
- **Trasgos**: un pack de goblins con animaciones de ataque, golpe y muerte. Es lo más difícil de encontrar gratis; puede que haga falta comprar uno (suelen costar 20-40 €).
- **Animaciones**: Epic regala el **Game Animation Sample** con cientos de animaciones de movimiento, y el retargeting de Unreal permite pasarlas a otros esqueletos. Las animaciones de ataque de Paragon también sirven.

**Para después**
- Bosque: el **Electric Dreams Environment** de Epic (gratis) trae bosque realista de Megascans.
- Mazmorra: kit modular de cripta.

**Criterio para todo**: con el filtro de pintura activado, ¿parece de la misma lámina? Si no, fuera.

## 8. Rendimiento

- Objetivo: **60 fps a 1080p con calidad Alta en una gráfica de 8 GB** (la referencia es la Radeon RX 570 del sobremesa de desarrollo), y 1440p en «Épica» con Lumen en gráficas mejores (Lumen pide una AMD RX 6000, NVIDIA RTX 2000 o más nuevas).
- Preajustes Baja, Media, Alta y Épica. El filtro de pintura tiene coste: en Baja se usa un Kuwahara de radio pequeño.
- Escenas compactas (como los mapas de BG2) en lugar de mundos abiertos.

## 9. Riesgos, sin adornos

1. **Los personajes son lo más difícil.** Es fácil conseguir escenarios bonitos gratis; personajes de fantasía coherentes y animados, no tanto. Puede que haga falta gastar algo en un pack de personajes o de monstruos.
2. **El plugin de Epic es experimental** en 5.8. Puede fallar o cambiar entre versiones; en ese caso se trabaja con el editor a mano y Claude escribiendo el C++.
3. **Reescribir las reglas lleva tiempo**: unas 8.000 líneas de GDScript. Se hace por partes y con pruebas que comparan con la versión de Godot.
4. **El móvil se queda fuera de esta rama.** La versión de Godot sigue existiendo y funcionando. Si algún día se quiere la de Unreal en móvil, habrá que hacer otra versión del filtro y de los escenarios.
