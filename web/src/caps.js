// caps.js
// Reconstruido de publicado/juego.js (parte sin envolver del final del bundle). Nombres locales aún minificados.

var capCache = new Map();
function getCap(o) {
  return (
    capCache.has(o) ||
      capCache.set(
        o,
        (async () => {
          try {
            return !window.claude || typeof window.claude.use != 'function'
              ? null
              : (await window.claude.use(o)) || null;
          } catch {
            return null;
          }
        })(),
      ),
    capCache.get(o)
  );
}
async function getUserId() {
  let o = await getCap('user');
  try {
    return o ? await o.id() : null;
  } catch {
    return null;
  }
}

export { getCap, getUserId };
