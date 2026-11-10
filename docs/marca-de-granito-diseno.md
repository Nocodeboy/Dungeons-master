# Marca de Granito — documento de diseño (v0.1)

> Título provisional. RPG táctico por turnos para móvil, inspirado en Baldur's Gate 2 e Icewind Dale 2, con reglas de D&D 5e (SRD 5.2) y mundo propio. Proyecto personal.

---

## 1. Ficha de concepto

| | |
|---|---|
| **Fantasía del jugador** | Liderar un grupo de aventureros con personalidad propia por una frontera antigua y peligrosa, donde cada combate es un pequeño puzle táctico y cada compañero tiene algo que decir. |
| **Bucle de 30 segundos** | Turno de combate: eliges personaje → te mueves → eliges acción → ves el dado y el resultado → el enemigo reacciona. |
| **Bucle de sesión (10–15 min)** | Explorar una zona → hablar y decidir → 1–3 combates → botín y subida de nivel → campamento con charla entre compañeros. |
| **Meta** | Capítulos que avanzan la historia, misiones personales de cada compañero y decisiones con consecuencias. |
| **Referentes** | BG2 (compañeros, diálogo, aventura), IWD2 (combate denso, mazmorras), BG3 (combate por turnos de 5e), XCOM (lectura clara de la cuadrícula en táctil). Se toma su bucle, no su estética ni su mundo. |
| **Plataformas** | Android primero (Play Console ya disponible). Web para pruebas rápidas. iOS más adelante vía CI con macOS. |
| **Idioma** | Español primero, con sistema de traducción desde el día 1 para añadir inglés. |

### Cuándo replantear (criterios escritos antes de empezar)

- Si tras el Hito 1 un combate de 4 contra 5 no se siente táctico y divertido en menos de 10 minutos con el móvil en la mano, se rehacen los controles antes de crear contenido.
- Si un turno normal exige más de 3 toques o más de 20 segundos de "pelearse" con la interfaz, se simplifica.
- Si el juego baja de 30 fps en un Android de gama media, se recorta el estilo visual antes de seguir.

---

## 2. El mundo (propuesta)

**Propuesta principal: "La Marca de Granito".** Una frontera de fantasía medieval inspirada en la Castilla de sierra: una ciudad amurallada en lo alto de un cerro, pinares, ríos de montaña, cañadas de pastores y, por todas partes, enormes animales de granito tallados por un pueblo antiguo (inspirado en los vetones y sus verracos).

**Gancho:** hace mil años, el pueblo de la sierra selló algo bajo la montaña y dejó a sus toros de piedra vigilándolo. Ahora los toros empiezan a agrietarse y a sangrar. El protagonista nace con una veta de granito en la piel que nadie sabe explicar, y todos —la Iglesia, el gremio de canteros y algo que susurra desde la roca— quieren saber por qué.

Funciona como el "hijo de Bhaal" de BG: una pregunta personal que sostiene toda la campaña.

**Alternativas, por si te tira más otra cosa:**
- **Frontera helada** (estilo IWD): un puerto al borde de un glaciar y un culto que quiere despertar el invierno.
- **Ciudad de gremios** (estilo Athkatla en BG2): intriga, ladrones, magos perseguidos y una conspiración en los bajos fondos.

### Capítulo 1 — "El toro que sangra" (niveles 1 → 3, 30–45 min)

1. **Prólogo en la aldea** al pie de la sierra: el toro de piedra del prado amanece agrietado. Asalto de goblins (tutorial de combate en 2 encuentros cortos).
2. **Zona abierta:** pinar, río y una venta en la cañada. Se conoce a los compañeros, misiones secundarias pequeñas, un encuentro opcional más duro.
3. **Mazmorra:** túmulo del pueblo antiguo bajo el toro. Esqueletos, arañas gigantes, trampas y puzle de piedras rúnicas.
4. **Jefe:** un tumulario (*wight* del SRD) que guarda el primer sello.
5. **Cierre:** el sello se rompe, la veta del protagonista brilla y el camino lleva a la ciudad amurallada (Capítulo 2).

### Compañeros del Capítulo 1 (4 disponibles, el grupo lleva 3)

| Compañero | Clase | Gancho |
|---|---|---|
| Veterana de la guardia de la muralla | Guerrera | Sarcástica, expulsada por algo que no cuenta. |
| Contrabandista de las cañadas | Pícaro | Conoce todos los caminos y todas las deudas. |
| Novicio de un monasterio de la sierra | Clérigo | Duda de su fe justo cuando más falta hace. |
| Erudito obsesionado con las piedras | Mago | Medio loco, alivio cómico y, quizá, el que más sabe. |

Charlas entre compañeros en el camino y en el campamento (lo que más "sabe a BG"), con opiniones sobre tus decisiones.

---

## 3. Reglas: D&D 5e (SRD 5.2)

Base legal: el SRD 5.2 se publica con licencia CC-BY-4.0. Se puede usar y adaptar (incluso de forma comercial) siempre que los créditos incluyan la frase de atribución oficial de Wizards (texto exacto en el apartado Legal del SRD 5.2). Se puede decir "compatible con quinta edición". **No** se puede usar nada fuera del SRD: Reinos Olvidados, contempladores, azotamentes, nombres de personajes o lugares de Wizards.

**Contenido del Capítulo 1:**
- **Especies:** humano, elfo, enano y mediano (orco y goliat más adelante).
- **Clases:** guerrero, pícaro, clérigo y mago, de nivel 1 a 3, con la subclase del SRD a nivel 3.
- **Trasfondos:** acólito, criminal, sabio y soldado.
- **Maestrías de armas** (reglas de 2024): derribar, empujar, fragilizar… dan mucha profundidad táctica sin añadir interfaz.
- **Condiciones:** derribado, apresado, envenenado, asustado, etc.
- **Conjuros:** unos 20 de nivel 0 a 2.
- **Monstruos:** goblins, lobos, arañas gigantes, esqueletos, zombis, enjambres y un tumulario.

**Adaptaciones al móvil (sin romper las reglas):**
- Cuadrícula de 1,5 m (5 pies) que aparece al empezar el combate.
- Tiradas de habilidad dentro del diálogo, con CD y dado visibles.
- Reacciones (ataques de oportunidad, *escudo*): con ajuste "automático / preguntar / nunca".
- El "director de juego" se sustituye por diálogos con opciones y consecuencias escritas.

---

## 4. Adaptación al móvil

### Combate por turnos
- Barra de iniciativa arriba; botones de acción grandes abajo (Atacar, Conjuro, Objeto, Correr, Destrabarse, Esquivar, Fin de turno).
- Tocas al personaje → ves alcance de movimiento (azul) y de carrera (amarillo) → tocas casilla para moverte.
- Tocas un enemigo → ves % de impacto y daño esperado → segundo toque para confirmar.
- Se puede deshacer el movimiento mientras no hayas actuado.
- Dados flotantes con el desglose de la tirada (opcional).
- Velocidad de animación ×1 / ×2 y fin de turno automático cuando no quedan acciones.
- **Guiones de compañero** (guiño a los scripts de BG): reglas sencillas como "cura si alguien baja del 30 %" para delegar turnos en combates fáciles.

### Exploración
- Toque para mover al grupo (siguen al líder), toque para interactuar, pulsación larga para información.
- Cámara isométrica con zoom (pellizco) y giro.
- Niebla de guerra y antorchas como en el original.

### Sesiones y guardado
- Zonas de 10–15 minutos.
- Autoguardado al entrar en zona y antes de cada combate, más 3 ranuras manuales.
- Descanso corto y largo en el campamento.

### Pantalla y accesibilidad
- **Horizontal:** un mapa táctico necesita anchura; en vertical la cuadrícula queda diminuta.
- Botones de al menos 48 dp, tamaño de texto ajustable y paletas aptas para daltónicos.

---

## 5. Decisión visual: 3D estilizado isométrico

Elegido sobre el 2D pintado por estas razones:
1. **Viabilidad:** el 2D pintado exige animar cada personaje en 8 direcciones con cada arma y armadura; sin un equipo de arte no es viable. En 3D, un modelo con su esqueleto sirve para todo.
2. **Legibilidad en pantalla pequeña:** zoom y giro de cámara evitan que una columna tape al pícaro.
3. **Atmósfera:** luz dinámica de antorchas, niebla y sombras dan el tono oscuro de BG e IWD.
4. **Táctica:** la cuadrícula y las alturas se leen de forma natural.

**Estilo:** "diorama" low-poly con paleta cálida de granito, pino y ocre; contornos suaves; luz de tarde y antorchas.

---

## 6. Stack técnico

| Pieza | Elección | Motivo |
|---|---|---|
| Motor | **Godot 4** (última estable, se comprueba al empezar), GDScript, renderer Mobile con Compatibility como respaldo | Exporta a Android, iOS y web; escenas en texto plano, ideal para trabajar todo por código desde Linux. |
| Reglas | Datos en JSON/Resources (clases, conjuros, monstruos) separados del código | Añadir contenido sin tocar el motor de reglas. |
| Diálogos | Plugin Dialogue Manager (texto plano) | Escribir diálogos como guiones; se verifica la versión compatible. |
| Pruebas | gdUnit4 en modo *headless* | Tests del motor de reglas: tiradas, ataques, condiciones. |
| Equilibrado | **Bot de combate** que juega cada encuentro cientos de veces sin gráficos | Medir tasa de victoria y duración de cada combate antes de probarlo tú. |
| Modelos 3D | Kits CC0 (KayKit, Quaternius; licencia a verificar al descargar) + piezas únicas generadas con IA 3D (toros de piedra, jefe) | Coherencia visual sin equipo de arte. |
| Música | Pistas libres de derechos o generadas con IA (dulzaina, gaita, percusión de sierra) | Sin música sintetizada por código. |
| Efectos de sonido | Packs CC0 + síntesis puntual | |
| Traducción | CSV de Godot (TranslationServer) | Español primero, inglés después. |
| Repositorio | GitHub (privado) + carpeta local | |

**Objetivos técnicos:** 60 fps en gama media y 30 fps estables en gama baja (es por turnos, se tolera), descarga inicial por debajo de 100 MB.

**Lo que no se usa:** ni código del juego original (no está disponible) ni de GemRB (es GPL y está atado a los formatos del Infinity Engine). GemRB solo como referencia para estudiar ideas.

---

## 7. Hoja de ruta

| Hito | Contenido | Resultado |
|---|---|---|
| **1 · Combate** | Motor de reglas 5e (tiradas, ataques, conjuros, condiciones, maestrías), cuadrícula, interfaz táctil, IA enemiga, bot de equilibrado. 3 encuentros reales del Capítulo 1. | Build Android + web jugable. Es una pieza final del juego, no un prototipo desechable. |
| **2 · Mundo** | Creación de personaje, exploración, diálogos, compañeros y charlas, la aldea y el pinar, guardado. | Prólogo y zona abierta completos. |
| **3 · Capítulo 1** | Mazmorra, puzle, jefe, campamento, música y sonido, pulido y créditos con la atribución del SRD. | Capítulo 1 completo de 30–45 min. |
| **4+** | Ciudad amurallada (Capítulo 2), más clases y especies, misiones personales. | |

---

## 8. Decisiones pendientes

1. ¿Te convence "La Marca de Granito" o prefieres una de las alternativas?
2. Nombre definitivo del juego.
3. ¿Protagonista con voz y personalidad propia, o personaje en blanco como en BG?
