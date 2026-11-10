// story/index.js
// Reconstruido de publicado/juego.js (módulo __esm «Jv»). Nombres locales aún minificados.

import { gm } from './story.js';
import { bm } from './narrator.js';
import { lS } from './data.js';
import { ym } from './tips.js';
import { xm } from './codex.js';

function createStory(o, e = {}) {
  let t = new gm(o, e.data || lS, e);
  return (
    (t.narrator = new bm(t)),
    (t.tips = new ym(t, e.tips)),
    (t.lore = new xm(t, e.codex)),
    t.attach(),
    t.tips.attach(),
    t.lore.attach(),
    t
  );
}

export { createStory };
