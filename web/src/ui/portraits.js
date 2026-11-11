// ui/portraits.js
// Reconstruido de publicado/juego.js (módulo __esm «RT»). Nombres locales aún minificados.

import {
  ACESFilmicToneMapping,
  AmbientLight,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { makeCharacter as Fs } from '../actors/character.js';
import { hc } from '../actors/roster.js';
import { legacyHeroDef as Tv } from '../actors/hero-stage.js';

function AT(o, e) {
  let t = new Set();
  async function a() {
    if (em || e.actors?.portrait || e.portrait) return;
    let s = e.store.cp;
    if (!s) return;
    let i = (s.party || []).filter((r) => !o.portrait(r) && !t.has(r));
    if (i.length) {
      (i.forEach((r) => t.add(r)),
        (em = (async () => {
          let c;
          try {
            c = new WebGLRenderer({ antialias: !0, alpha: !0, preserveDrawingBuffer: !0 });
          } catch {
            return;
          }
          (c.setSize(160, 190), (c.toneMapping = ACESFilmicToneMapping), (c.toneMappingExposure = 1.15));
          for (let d of i)
            try {
              let u = s.members?.[d],
                h = hc.find((w) => w.id === d),
                p = h ? { ...h, attach: [], pos: [0, 0], face: 0, anim: 'Idle_Loop' } : Tv(u || {}),
                m = await Fs({ ...p, id: `retrato_${d}`, attach: [] }),
                _ = new Scene();
              (_.add(m.root),
                m.root.position.set(0, 0, 0),
                (m.root.rotation.y = 0),
                m.mixer.update(0.4),
                m.root.updateMatrixWorld(!0));
              let b = m.headWorld(new Vector3()),
                f = m.root.scale.x || 1,
                v = new DirectionalLight(16765600, 3);
              v.position.set(1.2, b.y + 1.2, 2.2);
              let x = new DirectionalLight(7309e3, 1.1);
              x.position.set(-2, b.y + 0.5, 0.5);
              let g = new DirectionalLight(16754784, 2.2);
              (g.position.set(-0.6, b.y + 1, -2.5), _.add(v, x, g, new AmbientLight(2760752, 1.2)));
              let y = new PerspectiveCamera(24, 160 / 190, 0.02, 10);
              (y.position.set(0.2 * f, b.y + 0.05 * f, 0.92 * f),
                y.lookAt(0, b.y - 0.03 * f, 0),
                c.render(_, y),
                o.setPortrait(d, c.domElement.toDataURL('image/png')),
                _.clear());
            } catch (u) {
              console.warn('[interfaz] retrato', d, u);
            }
          (c.dispose(), c.forceContextLoss?.());
        })()),
        await em,
        (em = null));
      for (let r of i) t.delete(r);
    }
  }
  let n = () => setTimeout(a, 1500);
  return (
    e.bus?.on('game:start', n),
    e.bus?.on('game:loaded', n),
    e.bus?.on('companion:join', n),
    e.bus?.on('level:enter', n),
    { run: a }
  );
}
let em = null;

export { AT };
