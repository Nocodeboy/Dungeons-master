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

## audio/

- `engine.js` y `reactions.js` repiten el tamaño de casilla (`CELL_SIZE = 1.5`) y la conversión
  casilla ↔ punto de la rejilla odd-r (`toPoint`, `pointToCell`) en vez de usar `explore/hex.js`
  (`HEX_SIZE`, `cellToWorld`): si cambia la rejilla, el sonido posicional quedaría desfasado.
- `reactions.js`, `weaponSoundClass`: lanzas, tridentes y otras armas que no casan con ningún
  patrón suenan como espada (valor por defecto).
- `reactions.js`, `onFx`: el caso `'death'` no hace nada (lo cubre `onRulesEvent`); código muerto.
- `engine.js`, `_evict`: el límite de los efectos (`sfx`) es 99 buffers, en la práctica no expulsa.
- `engine.js`, `_play`: cuenta todas las voces activas en cada efecto para el límite de 48
  (recorrido lineal; con pocas voces no es un problema).
