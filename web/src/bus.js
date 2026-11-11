// bus.js — Bus de eventos del juego (game.bus).
// Publicación/suscripción por nombre («scene:enter», «flag:set», «cp:changed»…) con el comodín «*»,
// que recibe { name, data } de todos los eventos. Lo crean main.js y lo usan casi todos los módulos.

/** Bus de eventos con suscripción por nombre y comodín «*». */
var Bus = class {
  constructor() {
    this.map = new Map();
  }
  /** Suscribe `fn` al evento `name`; devuelve la función que anula la suscripción. */
  on(name, fn) {
    return (
      this.map.has(name) || this.map.set(name, new Set()),
      this.map.get(name).add(fn),
      () => this.map.get(name)?.delete(fn)
    );
  }
  /** Como `on`, pero se anula tras la primera llamada. */
  once(name, fn) {
    let off = this.on(name, (data) => {
      (off(), fn(data));
    });
    return off;
  }
  /** Llama a los oyentes de `name` y a los de «*»; los errores de un oyente no cortan el resto. */
  emit(name, data) {
    for (let fn of [...(this.map.get(name) || [])])
      try {
        fn(data);
      } catch (err) {
        console.error(`[bus] ${name}:`, err);
      }
    for (let fn of [...(this.map.get('*') || [])])
      try {
        fn({ name, data });
      } catch (err) {
        console.error('[bus] *:', err);
      }
  }
};

export { Bus };
