// story/index.js
// Reconstruido de publicado/juego.js (módulo __esm «Jv»). Nombres locales aún minificados.

import { Story } from './story.js';
import { Narrator } from './narrator.js';
import { lS } from './data.js';
import { Tips } from './tips.js';
import { Codex } from './codex.js';

function createStory(o, e = {}) {
  let t = new Story(o, e.data || lS, e);
  return (
    (t.narrator = new Narrator(t)),
    (t.tips = new Tips(t, e.tips)),
    (t.lore = new Codex(t, e.codex)),
    t.attach(),
    t.tips.attach(),
    t.lore.attach(),
    t
  );
}

export { createStory };
