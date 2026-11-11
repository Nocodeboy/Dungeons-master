// scenes/explore.js — Escena «explore» del gestor de escenas: delega en explore/index.js.
// La registra main.js con import().
// Reconstruido de publicado/juego.js (módulo __esm «n5»).

import { createExplore } from '../explore/index.js';

/** Crea la escena de exploración (exportada como `create`). */
async function crearEscenaExplore(game, params = {}) {
  return createExplore(game, params);
}

export { crearEscenaExplore as create };
