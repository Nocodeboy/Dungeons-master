// bus.js
// Reconstruido de publicado/juego.js (parte sin envolver del final del bundle). Nombres locales aún minificados.

var Bus = class {
  constructor() {
    this.map = new Map();
  }
  on(e, t) {
    return (
      this.map.has(e) || this.map.set(e, new Set()),
      this.map.get(e).add(t),
      () => this.map.get(e)?.delete(t)
    );
  }
  once(e, t) {
    let a = this.on(e, (n) => {
      (a(), t(n));
    });
    return a;
  }
  emit(e, t) {
    for (let a of [...(this.map.get(e) || [])])
      try {
        a(t);
      } catch (n) {
        console.error(`[bus] ${e}:`, n);
      }
    for (let a of [...(this.map.get('*') || [])])
      try {
        a({ name: e, data: t });
      } catch (n) {
        console.error('[bus] *:', n);
      }
  }
};

export { Bus };
