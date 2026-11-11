// story/index.js — Entrada del área de historia: crea game.story.
// Monta Story (motor de flujos + historia del capítulo) con su narrador, consejos y libro de saber, y
// los engancha al bus. Lo usa main.js; sus exports conservan el nombre original (módulo con espacio de nombres).

import { Story } from './story.js';
import { Narrator } from './narrator.js';
import { storyData } from './data.js';
import { Tips } from './tips.js';
import { Codex } from './codex.js';

/**
 * Crea la historia del juego (game.story).
 * @param {object} game contexto del juego
 * @param {object} [opts] data (datos de historia), tips y codex (opciones de consejos y saber)
 */
function createStory(game, opts = {}) {
  let story = new Story(game, opts.data || storyData, opts);
  return (
    (story.narrator = new Narrator(story)),
    (story.tips = new Tips(story, opts.tips)),
    (story.lore = new Codex(story, opts.codex)),
    story.attach(),
    story.tips.attach(),
    story.lore.attach(),
    story
  );
}

export { createStory };
