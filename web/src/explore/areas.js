// explore/areas.js
// Reconstruido de publicado/juego.js (módulo __esm «hk»). Nombres locales aún minificados.

function loadArea(o) {
  return (
    O1.has(o) ||
      O1.set(
        o,
        (async () => {
          try {
            let e = await import(`../${o}/index.js`);
            return e && Object.keys(e).length ? e : null;
          } catch {
            return null;
          }
        })(),
      ),
    O1.get(o)
  );
}
async function uk() {
  let [o, e, t] = await Promise.all([loadArea('world'), loadArea('actors'), loadArea('combat')]);
  return {
    world: o?.buildLevel ? o : null,
    actors: e?.makeHero || e?.makeNpc ? e : null,
    combat: t?.runBattle ? t : null,
  };
}
const O1 = new Map();

export { uk };
