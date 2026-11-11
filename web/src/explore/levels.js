// explore/levels.js
// Reconstruido de publicado/juego.js (módulo __esm «LS»). Nombres locales aún minificados.

async function loadLevel(o, e = null) {
  if (e1.has(o)) return structuredClone(e1.get(o));
  let t = null;
  if (e?.loadLevel)
    try {
      t = await e.loadLevel(o);
    } catch (a) {
      console.warn('[exploraci\xF3n] loadLevel de Escenarios:', a);
    }
  if (!t)
    try {
      t = (await import(`../datos/niveles/${o}.json`)).default;
    } catch {
      t = null;
    }
  if (!t) throw new Error(`No existe el nivel \xAB${o}\xBB`);
  return ((t.id ??= o), e1.set(o, t), structuredClone(t));
}
const e1 = new Map();

export { loadLevel };
