# Notas del área limpieza-efectos (`src/vfx/`, `src/audio/`)

Fallos posibles, código muerto y cuellos de botella vistos durante el renombrado. **No se ha
arreglado nada**: el comportamiento es el del publicado. Los nombres son los nuevos.

## vfx/conditions.js

- `AuraEffects.repin()` no se llama desde ningún sitio (código muerto).

## vfx/spells.js

- `playSpellFx`, fase `burst`: `let burstStyle = style === 'nature' ? 'nature' : style;` siempre vale
  `style` (ternario redundante; quizá se quería forzar otro estilo).
- `SPELL_FX.hail_of_thorns` devuelve `null`, así que cae en la coreografía genérica (¿a propósito?).
- `smiteRider` llama a `getStyle(style)` dentro del bucle de objetivos (inofensivo, siempre igual).
