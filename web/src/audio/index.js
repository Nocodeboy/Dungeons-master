// audio/index.js
// Reconstruido de publicado/juego.js (módulo __esm «Gv»). Nombres locales aún minificados.

import { dm } from './engine.js';
import { YM } from './reactions.js';

function createAudio(o = {}, { reactions: e = !0, base: t = 'audio/' } = {}) {
  let a = o.store?.settings || {},
    n = new dm({
      base: t,
      volumes: {
        music: a.music ?? 0.7,
        sfx: a.sfx ?? 0.8,
        ambience: a.ambience ?? 0.6,
        ui: a.ui ?? a.sfx ?? 0.8,
        master: a.mute ? 0 : (a.master ?? 1),
      },
      noStream: o.params?.get?.('audio') === 'buffer',
      sampleRate:
        o.quality?.level === 0 ||
        (typeof navigator < 'u' && navigator.deviceMemory && navigator.deviceMemory <= 4)
          ? 32e3
          : null,
    });
  o.params?.get?.('audio') === 'no' && (n.failed = !0);
  let s = ['pointerdown', 'keydown', 'touchend'],
    i = () => {
      if (!n.failed && n.unlock()) for (let d of s) removeEventListener(d, i, !0);
    };
  if (typeof addEventListener == 'function') for (let d of s) addEventListener(d, i, !0);
  let r = n.m.sprites.interfaz;
  (r && n.buffer(r.file, 'sfx'), o.stage?.camera && n.bindCamera(o.stage.camera, o.stage.controls));
  let l =
      (d) =>
      (...u) => {
        if (n.failed) return null;
        try {
          return d(...u);
        } catch (h) {
          return (console.error('[sonido]', h), null);
        }
      },
    c = {
      engine: n,
      unlock: l(() => n.unlock()),
      music: l((d, u) => n.music(d, u)),
      ambience: l((d, u) => n.ambience(d, u)),
      sfx: l((d, u) => n.sfx(d, u)),
      setVolumes: l((d) => n.setVolumes(d)),
      update: l((d) => n.update(d)),
      duck: l((d, u, h) => n.duck(d, u, h)),
      unduck: l((d) => n.unduck(d)),
      emitter: (d, u) => (n.failed ? { set() {}, stop() {} } : n.emitter(d, u)),
      preload: (d) => (n.failed ? Promise.resolve([]) : n.preload(d)),
      bindCamera: l((d, u) => n.bindCamera(d, u)),
      stopAll: l((d = 0.3) => {
        (n.music(null, { fade: d }), n.ambience(null, { fade: d }), n.stopAllSfx(d));
      }),
      names: () => n.names(),
      credits: () => n.m.credits || [],
      get musicName() {
        return n.musicName;
      },
      get unlocked() {
        return n.unlocked;
      },
      step: () => {},
    };
  return (
    o.bus && e && ((c.reactions = YM(o, c)), (c.step = l((d) => c.reactions.step(d)))),
    o.params?.has?.('depurar') && typeof window < 'u' && (window.__sonido = c),
    c
  );
}

export { createAudio };
