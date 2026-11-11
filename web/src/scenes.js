// scenes.js — Gestor de escenas (game.scenes).
// Cada escena es un módulo con `create(game, params)` que devuelve { three, sun, update, afterRender, dispose, … }.
// `go` funde a negro, libera la escena anterior, crea la nueva y emite «scene:leave»/«scene:enter».
// Lo crea main.js; registran escenas main.js (menu, explore) y ui/index.js (creator, travel, ending).

import { Scene } from 'three';

/** Gestor de escenas con transición fundida y un único cambio a la vez (`busy`). */
var SceneManager = class {
  constructor(game) {
    ((this.game = game),
      (this.registry = new Map()),
      (this.current = null),
      (this.name = null),
      (this.busy = null),
      (this.empty = new Scene()));
  }
  /** Registra una escena: `loader` es el módulo o una función que lo carga (import()). */
  register(name, loader) {
    this.registry.set(name, loader);
  }
  /** Cambia a la escena `name` con `params`; espera a que termine cualquier cambio en curso. */
  async go(name, params = {}) {
    let loader = this.registry.get(name);
    if (!loader) throw new Error(`escena desconocida: ${name}`);
    for (; this.busy;) await this.busy;
    let task = (async () => {
      let game = this.game;
      this.current && (await game.stage.fade(1, 0.35));
      let previous = this.current;
      this.current = null;
      try {
        previous?.dispose?.();
      } catch (err) {
        console.error('[escenas] dispose', err);
      }
      (game.stage.setScene(this.empty), game.bus.emit('scene:leave', { name: this.name }));
      let scene = await (typeof loader == 'function' ? await loader() : loader).create(game, params);
      ((this.current = scene),
        (this.name = name),
        game.stage.setScene(scene.three || this.empty),
        game.bus.emit('scene:enter', { name, params }),
        await game.stage.fade(0, 0.45));
    })();
    this.busy = task;
    try {
      await task;
    } finally {
      this.busy = null;
    }
  }
  /** Avanza la escena actual (llamado en cada fotograma desde main.js). */
  update(dt, elapsed) {
    this.current?.update?.(dt, elapsed);
  }
  /** Trabajo de la escena tras dibujar el fotograma (p. ej. etiquetas HTML). */
  afterRender(dt) {
    this.current?.afterRender?.(dt);
  }
};

export { SceneManager };
