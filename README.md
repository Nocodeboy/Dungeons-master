# Marca de Granito

RPG táctico por turnos (reglas de la quinta edición, SRD 5.2.1). Capítulo I · *El toro que sangra*.

## Contenido del repositorio

- `publicado/`: copia exacta de la versión publicada «prueba 1» (7 nov 2026), la última que se publicó antes de perder el espacio de trabajo el 10 nov. **No se edita**: es la referencia contra la que se compara la reconstrucción.
  - `index.html` + `juego.js`: el juego completo (menú → creador → prólogo → Merrowick → … → epílogo).
  - `combate.html` / `posada.html`: bancos de pruebas.
  - `rules/rules.wasm` + `rules.mjs`: núcleo de reglas C++ compilado a WebAssembly.
  - `assets/`: modelos glTF (JSON con binarios embebidos) y texturas WebP.
  - `audio/`: música, ambientes y efectos (créditos en `audio/CREDITOS.md`).

Para probarla en local: `cd publicado && python3 -m http.server 8000` y abrir `http://localhost:8000/`.
