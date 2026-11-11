// caps.js — Capacidades del artefacto publicado (window.claude.use: «db», «user», «sample», «downloads»).
// Cada capacidad se pide una sola vez y se cachea; fuera del artefacto devuelve null.
// Lo usan main.js (game.caps.get), store.js (guardado en la nube) y story/narrator.js (narrador con IA).

var capCache = new Map();
/** Promesa con la capacidad `name` del artefacto, o null si no existe o falla. */
function getCap(name) {
  return (
    capCache.has(name) ||
      capCache.set(
        name,
        (async () => {
          try {
            return !window.claude || typeof window.claude.use != 'function'
              ? null
              : (await window.claude.use(name)) || null;
          } catch {
            return null;
          }
        })(),
      ),
    capCache.get(name)
  );
}
/** Identificador del usuario (capacidad «user»), o null. */
async function getUserId() {
  let user = await getCap('user');
  try {
    return user ? await user.id() : null;
  } catch {
    return null;
  }
}

export { getCap, getUserId };
