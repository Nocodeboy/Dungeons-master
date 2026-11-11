// explore/areas.js — Carga perezosa de las áreas del juego (`src/<área>/index.js`) con import() dinámico.
// Si un área falla o no existe, devuelve null y la exploración usa sus sustitutos (fallback-world.js…).
// Ojo: esbuild empaqueta como cargable cualquier src/*/index.js por la plantilla del import().
// Lo usa explore/index.js.
// Reconstruido de publicado/juego.js (módulo __esm «hk»).

/** Importa (una sola vez) el módulo `../<name>/index.js`; promesa del espacio de nombres o null. */
function loadArea(name) {
  return (
    areaCache.has(name) ||
      areaCache.set(
        name,
        (async () => {
          try {
            let mod = await import(`../${name}/index.js`);
            return mod && Object.keys(mod).length ? mod : null;
          } catch {
            return null;
          }
        })(),
      ),
    areaCache.get(name)
  );
}
/** Carga world, actors y combat; cada uno es null si no tiene la API esperada. */
async function loadAreaModules() {
  let [world, actors, combat] = await Promise.all([
    loadArea('world'),
    loadArea('actors'),
    loadArea('combat'),
  ]);
  return {
    world: world?.buildLevel ? world : null,
    actors: actors?.makeHero || actors?.makeNpc ? actors : null,
    combat: combat?.runBattle ? combat : null,
  };
}
const areaCache = new Map();

export { loadAreaModules };
