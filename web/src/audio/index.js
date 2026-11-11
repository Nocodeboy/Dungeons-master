// audio/index.js
// Punto de entrada del área de audio: `createAudio(game)` crea el AudioEngine con los volúmenes de
// los ajustes, lo desbloquea con el primer gesto, lo enlaza a la cámara y devuelve `game.audio`, una
// API que no lanza errores (si falla, no suena) y, si hay bus, las reacciones a eventos del juego.
// Con ?audio=no no hay sonido y con ?audio=buffer no se usa la música en flujo; con ?depurar se
// expone como window.__sonido. Lo llama main.js. Es un área cargable: sus exports son públicos.
// Reconstruido de publicado/juego.js (módulo __esm «Gv»).

import { AudioEngine } from './engine.js';
import { createReactions } from './reactions.js';

/** Crea el sonido del juego (ver cabecera); `base` es la carpeta de los archivos de audio. */
function createAudio(game = {}, { reactions = !0, base = 'audio/' } = {}) {
  let settings = game.store?.settings || {},
    engine = new AudioEngine({
      base,
      volumes: {
        music: settings.music ?? 0.7,
        sfx: settings.sfx ?? 0.8,
        ambience: settings.ambience ?? 0.6,
        ui: settings.ui ?? settings.sfx ?? 0.8,
        master: settings.mute ? 0 : (settings.master ?? 1),
      },
      noStream: game.params?.get?.('audio') === 'buffer',
      sampleRate:
        game.quality?.level === 0 ||
        (typeof navigator < 'u' && navigator.deviceMemory && navigator.deviceMemory <= 4)
          ? 32e3
          : null,
    });
  game.params?.get?.('audio') === 'no' && (engine.failed = !0);
  let unlockEvents = ['pointerdown', 'keydown', 'touchend'],
    tryUnlock = () => {
      if (!engine.failed && engine.unlock())
        for (let ev of unlockEvents) removeEventListener(ev, tryUnlock, !0);
    };
  if (typeof addEventListener == 'function') for (let ev of unlockEvents) addEventListener(ev, tryUnlock, !0);
  let uiSprite = engine.m.sprites.interfaz;
  (uiSprite && engine.buffer(uiSprite.file, 'sfx'),
    game.stage?.camera && engine.bindCamera(game.stage.camera, game.stage.controls));
  let safe =
      (fn) =>
      (...args) => {
        if (engine.failed) return null;
        try {
          return fn(...args);
        } catch (err) {
          return (console.error('[sonido]', err), null);
        }
      },
    api = {
      engine,
      unlock: safe(() => engine.unlock()),
      music: safe((name, opts) => engine.music(name, opts)),
      ambience: safe((list, opts) => engine.ambience(list, opts)),
      sfx: safe((id, opts) => engine.sfx(id, opts)),
      setVolumes: safe((vols) => engine.setVolumes(vols)),
      update: safe((dt) => engine.update(dt)),
      duck: safe((key, amount, opts) => engine.duck(key, amount, opts)),
      unduck: safe((key) => engine.unduck(key)),
      emitter: (id, opts) => (engine.failed ? { set() {}, stop() {} } : engine.emitter(id, opts)),
      preload: (list) => (engine.failed ? Promise.resolve([]) : engine.preload(list)),
      bindCamera: safe((camera, controls) => engine.bindCamera(camera, controls)),
      stopAll: safe((fade = 0.3) => {
        (engine.music(null, { fade }), engine.ambience(null, { fade }), engine.stopAllSfx(fade));
      }),
      names: () => engine.names(),
      credits: () => engine.m.credits || [],
      get musicName() {
        return engine.musicName;
      },
      get unlocked() {
        return engine.unlocked;
      },
      step: () => {},
    };
  return (
    game.bus &&
      reactions &&
      ((api.reactions = createReactions(game, api)), (api.step = safe((dt) => api.reactions.step(dt)))),
    game.params?.has?.('depurar') && typeof window < 'u' && (window.__sonido = api),
    api
  );
}

export { createAudio };
