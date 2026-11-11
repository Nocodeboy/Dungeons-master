# Notas del área limpieza-efectos (`src/vfx/`, `src/audio/`)

Fallos posibles, código muerto y cuellos de botella vistos durante el renombrado. **No se ha
arreglado nada**: el comportamiento es el del publicado. Los nombres son los nuevos.

## vfx/conditions.js

- `AuraEffects.repin()` no se llama desde ningún sitio (código muerto).
