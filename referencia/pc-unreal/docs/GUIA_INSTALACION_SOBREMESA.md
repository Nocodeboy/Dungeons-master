# Marca de Granito PC · Preparar el sobremesa para Unreal Engine 5.8

Esta guía es para el PC de sobremesa. En el portátil no merece la pena: tiene 8 GB de RAM y una gráfica de 4 GB, y el editor de Unreal pide 32 GB y 8 GB de gráfica para ir con soltura. En la carpeta tienes `informe-equipo.txt` con la comprobación del portátil.

Calcula una tarde: las descargas suman unos 100 GB y casi todo el tiempo es esperar.

## 0. Comprueba el equipo (2 minutos)

1. Copia esta carpeta `PC-Unreal` al sobremesa, por ejemplo con un pendrive o por la red de casa.
2. Haz doble clic en **COMPROBAR_EQUIPO.bat**. Solo lee datos del sistema; no instala ni toca nada.
3. Se crea `informe-equipo.txt` (sustituye al del portátil). Pásamelo o pégamelo en el chat.

Lo que Epic recomienda para Unreal 5.8:

| | Recomendado | Se puede trabajar con |
|---|---|---|
| Sistema | Windows 11 | Windows 10 22H2 |
| RAM | 32 GB | 16 GB, cerrando el navegador mientras compila |
| Gráfica | 8 GB de VRAM, DirectX 12 | 6 GB bajando la calidad del editor |
| Disco | SSD con ~200 GB libres | — (en disco mecánico el editor tarda muchísimo) |

Si el informe sale con alguna `[FALTA]` en RAM o gráfica, para aquí y lo hablamos antes de descargar nada.

**Resultado de tu sobremesa (24 de octubre): vale.** Intel i5-4690K, 16 GB de RAM y Radeon RX 570 de 8 GB. Ya tiene Epic Games Launcher, Git y Claude Code: solo faltan **Unreal 5.8** (paso 1) y **Visual Studio 2026** (paso 2); los pasos 3 y 4 sáltatelos salvo el plugin de Epic. Lo que hay que saber de este equipo:

- La RX 570 no tiene trazado de rayos: el proyecto ya está configurado para hornear la luz por CPU y sin Lumen ni Nanite. El aspecto pintado no los necesita.
- El procesador es de 4 hilos: la primera apertura del proyecto (compilar shaders) y el horneado de luz van a tardar. Es normal; no lo cierres.
- Con 16 GB, mientras Unreal trabaja cierra el navegador y lo que no uses.

## 1. Epic Games Launcher y Unreal Engine 5.8 (~60 GB)

1. Descarga el launcher desde [epicgames.com](https://store.epicgames.com/es-ES/download), instálalo e inicia sesión con tu cuenta de Epic (la misma que usarás en Fab).
2. Pestaña **Unreal Engine → Biblioteca → (+) junto a «Versiones del motor»**, elige **5.8** e **Instalar**. Instálalo en el SSD.
3. En **Opciones** antes de instalar deja marcado lo que viene por defecto y **desmarca** «Símbolos del editor para depuración» (ocupa más de 60 GB y no lo necesitamos). No hace falta ninguna plataforma de destino extra.

## 2. Visual Studio 2026 Community (~30 GB)

Unreal 5.8 compila el C++ con Visual Studio 2026.

1. Descarga **Visual Studio 2026 Community** (gratis) desde [visualstudio.microsoft.com](https://visualstudio.microsoft.com/es/downloads/).
2. En el instalador marca las cargas de trabajo:
   - **Desarrollo de juegos con C++**. En el panel de la derecha marca también, si aparecen, los componentes de **Unreal Engine** (instalador y compatibilidad del IDE) y deja el **Windows SDK** más reciente.
   - **Desarrollo para el escritorio con C++**.
3. Instala y reinicia el PC.

## 3. Git y Claude Code (en tu sobremesa ya están; ve al paso 4)

1. **Git para Windows**: [git-scm.com/downloads/win](https://git-scm.com/downloads/win), con las opciones por defecto. Claude Code usa Git Bash, y el plugin de Epic lo necesita para su aviso de inicio.
2. **Claude Code**: abre **PowerShell** (no hace falta como administrador) y pega:

   ```powershell
   irm https://claude.ai/install.ps1 | iex
   ```

   Cierra PowerShell, abre otro y comprueba con `claude --version`. Si prefieres no usar terminal, la **app de escritorio de Claude** trae Claude Code en la pestaña **Code**.
3. Ejecuta `claude` una vez para iniciar sesión con tu cuenta.

## 4. El plugin de Epic (Unreal Engine Skills)

Dentro de Claude Code escribe:

```text
/plugin install unreal-engine-skills-for-claude-code@claude-plugins-official
```

Si dice que no encuentra el catálogo, antes ejecuta `/plugin marketplace add anthropics/claude-plugins-official` y repite. En la app de escritorio también puedes buscar **Unreal Engine Skills** en el directorio de plugins.

## 5. Abrir el proyecto

1. Descomprime `MarcaDeGranitoPC.zip` (está en `PC-Unreal`) en una ruta corta del SSD, por ejemplo `C:\Juegos\MarcaDeGranitoPC` (en tu sobremesa, C: tiene sitio de sobra). Evita OneDrive y rutas con acentos o espacios. Dentro ya va el historial de Git.
2. Abre PowerShell en esa carpeta y ejecuta una sola vez `git lfs install` (Git para Windows ya trae Git LFS; sirve para los archivos grandes de Unreal).
3. Clic derecho en `MarcaDeGranitoPC.uproject` → **Generate Visual Studio project files**. Si no aparece esa opción, en Windows 11 está en «Mostrar más opciones».
4. Doble clic en `MarcaDeGranitoPC.uproject`. Te preguntará si quieres compilar los módulos: **Sí**. La primera vez tarda varios minutos y después compila los shaders: con tu procesador puede pasar de media hora. Verás un contador abajo a la derecha; déjalo terminar.
5. Ya en el editor:
   - **Editar → Plugins**: comprueba que **Unreal MCP** y **All Toolsets** están activados (el proyecto ya los pide).
   - **Editar → Preferencias del editor → General → Model Context Protocol**: activa **Auto Start Server**.
   - Abre **Ventana → Registro de salida** (Output Log). Abajo hay un campo **Cmd**: escribe `ModelContextProtocol.GenerateClientConfig ClaudeCode` y pulsa Intro. Crea el archivo `.mcp.json` en la carpeta del proyecto.
   - En el mismo registro debería salir una línea `Reglas cargadas de ...: 12 clases, ... conjuros, ... monstruos`. Si sale, las reglas en C++ funcionan dentro de Unreal.
   - Prueba el combate: en el mismo campo **Cmd** escribe `Mdg.Simulate e1_prado 1000` y pulsa Intro. Sale la emboscada de los trasgos jugada entera por la IA, línea a línea, y al final quién gana. Es el mismo combate que daría la versión de Godot con esa semilla.

## 6. Primera sesión con Claude Code en el sobremesa

1. Con el editor de Unreal **abierto**, abre PowerShell en la carpeta del proyecto (`cd C:\Juegos\MarcaDeGranitoPC`) y ejecuta `claude`.
2. Escribe `/mcp` y comprueba que aparece **unreal-mcp** conectado.
3. Dile: **«Lee CLAUDE.md y empieza la etapa A de la rebanada vertical»**. El archivo `CLAUDE.md` del proyecto le explica todo lo que hay hecho, las normas y los pasos.

Claude te irá pidiendo permiso para cada acción en el editor. Conviene aceptarlas una a una; no uses `--dangerously-skip-permissions` con este plugin. Antes de sesiones largas, guarda y haz un commit (Claude puede hacerlo por ti).

## 7. Assets de Fab (a la vez que lo anterior)

Mientras se descarga todo, entra en [fab.com](https://www.fab.com) con tu cuenta de Epic y añade a tu biblioteca lo que aparece en la lista de `DIRECCION_DE_ARTE.md` (apartado «Lista de la compra en Fab»). Lo gratuito que reclames queda en tu cuenta para siempre aunque luego deje de ser gratis. Desde el launcher se añade al proyecto con **Añadir al proyecto**.

## Si algo falla

- **«Could not be compiled»** al abrir el proyecto: falta la carga de trabajo de C++ de Visual Studio o el Windows SDK. Repite el paso 2 y vuelve a generar los archivos de proyecto.
- **«The following modules are missing or built with a different engine version»**: es normal la primera vez; contesta **Sí** para compilarlos.
- **Avisa de que no encuentra un plugin** (Unreal MCP o All Toolsets) al abrir: contesta que lo desactive, entra en el editor, búscalo en **Editar → Plugins** por su nombre visible, actívalo y reinicia. Dime el nombre exacto que aparece y lo corrijo en el proyecto.
- **`/mcp` no muestra unreal-mcp**: el editor tiene que estar abierto con el servidor arrancado. Escribe `ModelContextProtocol.StartServer` en el campo Cmd del registro de salida y vuelve a generar `.mcp.json`.
- **Claude Code no encuentra Git Bash**: reinstala Git con las opciones por defecto o dime la ruta y te digo qué poner en la configuración.
