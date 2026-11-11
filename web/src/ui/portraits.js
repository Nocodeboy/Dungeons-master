// ui/portraits.js
// Pintor de retratos de respaldo: si el juego no trae su generador (game.actors.portrait), renderiza con
// three.js el busto de cada miembro del grupo y lo guarda con ui.setPortrait. Lo crea ui/index.js.
// Reconstruido de publicado/juego.js (módulo __esm «RT»).

import {
  ACESFilmicToneMapping,
  AmbientLight,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { Fs } from '../actors/character.js';
import { hc } from '../actors/roster.js';
import { Tv } from '../actors/outfits.js';

/** Pinta los retratos que falten al empezar, cargar, entrar en un nivel o unirse un compañero. Devuelve {run}. */
function createPortraitPainter(ui, game) {
  let pending = new Set();
  async function run() {
    if (paintJob || game.actors?.portrait || game.portrait) return;
    let cp = game.store.cp;
    if (!cp) return;
    let missing = (cp.party || []).filter((id) => !ui.portrait(id) && !pending.has(id));
    if (missing.length) {
      (missing.forEach((id) => pending.add(id)),
        (paintJob = (async () => {
          let renderer;
          try {
            renderer = new WebGLRenderer({ antialias: !0, alpha: !0, preserveDrawingBuffer: !0 });
          } catch {
            return;
          }
          (renderer.setSize(160, 190),
            (renderer.toneMapping = ACESFilmicToneMapping),
            (renderer.toneMappingExposure = 1.15));
          for (let memberId of missing)
            try {
              let member = cp.members?.[memberId],
                companion = hc.find((entry) => entry.id === memberId),
                spec = companion
                  ? { ...companion, attach: [], pos: [0, 0], face: 0, anim: 'Idle_Loop' }
                  : Tv(member || {}),
                actor = await Fs({ ...spec, id: `retrato_${memberId}`, attach: [] }),
                scene = new Scene();
              (scene.add(actor.root),
                actor.root.position.set(0, 0, 0),
                (actor.root.rotation.y = 0),
                actor.mixer.update(0.4),
                actor.root.updateMatrixWorld(!0));
              let head = actor.headWorld(new Vector3()),
                scale = actor.root.scale.x || 1,
                keyLight = new DirectionalLight(16765600, 3);
              keyLight.position.set(1.2, head.y + 1.2, 2.2);
              let fillLight = new DirectionalLight(7309e3, 1.1);
              fillLight.position.set(-2, head.y + 0.5, 0.5);
              let rimLight = new DirectionalLight(16754784, 2.2);
              (rimLight.position.set(-0.6, head.y + 1, -2.5),
                scene.add(keyLight, fillLight, rimLight, new AmbientLight(2760752, 1.2)));
              let camera = new PerspectiveCamera(24, 160 / 190, 0.02, 10);
              (camera.position.set(0.2 * scale, head.y + 0.05 * scale, 0.92 * scale),
                camera.lookAt(0, head.y - 0.03 * scale, 0),
                renderer.render(scene, camera),
                ui.setPortrait(memberId, renderer.domElement.toDataURL('image/png')),
                scene.clear());
            } catch (err) {
              console.warn('[interfaz] retrato', memberId, err);
            }
          (renderer.dispose(), renderer.forceContextLoss?.());
        })()),
        await paintJob,
        (paintJob = null));
      for (let id of missing) pending.delete(id);
    }
  }
  let schedule = () => setTimeout(run, 1500);
  return (
    game.bus?.on('game:start', schedule),
    game.bus?.on('game:loaded', schedule),
    game.bus?.on('companion:join', schedule),
    game.bus?.on('level:enter', schedule),
    { run }
  );
}
let paintJob = null;

export { createPortraitPainter };
