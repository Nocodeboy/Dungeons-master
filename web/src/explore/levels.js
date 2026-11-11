// explore/levels.js — Carga de niveles de exploración: primero `world.loadLevel` (área de escenarios) y,
// si no hay, el JSON de src/datos/niveles/<id>.json (import() con plantilla). Guarda en caché y
// devuelve copias. Lo usa explore/index.js.
// Reconstruido de publicado/juego.js (módulo __esm «LS»).

/** Devuelve una copia del nivel `id`; `world` es el módulo de escenarios (opcional). */
async function loadLevel(id, world = null) {
  if (levelCache.has(id)) return structuredClone(levelCache.get(id));
  let level = null;
  if (world?.loadLevel)
    try {
      level = await world.loadLevel(id);
    } catch (err) {
      console.warn('[exploraci\xF3n] loadLevel de Escenarios:', err);
    }
  if (!level)
    try {
      level = (await import(`../datos/niveles/${id}.json`)).default;
    } catch {
      level = null;
    }
  if (!level) throw new Error(`No existe el nivel \xAB${id}\xBB`);
  return ((level.id ??= id), levelCache.set(id, level), structuredClone(level));
}
const levelCache = new Map();

export { loadLevel };
