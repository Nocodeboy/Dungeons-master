// scenes.js
// Reconstruido de publicado/juego.js (parte sin envolver del final del bundle). Nombres locales aún minificados.

import { Scene } from 'three';

var SceneManager = class {
  constructor(e) {
    ((this.game = e),
      (this.registry = new Map()),
      (this.current = null),
      (this.name = null),
      (this.busy = null),
      (this.empty = new Scene()));
  }
  register(e, t) {
    this.registry.set(e, t);
  }
  async go(e, t = {}) {
    let a = this.registry.get(e);
    if (!a) throw new Error(`escena desconocida: ${e}`);
    for (; this.busy;) await this.busy;
    let n = (async () => {
      let s = this.game;
      this.current && (await s.stage.fade(1, 0.35));
      let i = this.current;
      this.current = null;
      try {
        i?.dispose?.();
      } catch (c) {
        console.error('[escenas] dispose', c);
      }
      (s.stage.setScene(this.empty), s.bus.emit('scene:leave', { name: this.name }));
      let l = await (typeof a == 'function' ? await a() : a).create(s, t);
      ((this.current = l),
        (this.name = e),
        s.stage.setScene(l.three || this.empty),
        s.bus.emit('scene:enter', { name: e, params: t }),
        await s.stage.fade(0, 0.45));
    })();
    this.busy = n;
    try {
      await n;
    } finally {
      this.busy = null;
    }
  }
  update(e, t) {
    this.current?.update?.(e, t);
  }
  afterRender(e) {
    this.current?.afterRender?.(e);
  }
};

export { SceneManager };
