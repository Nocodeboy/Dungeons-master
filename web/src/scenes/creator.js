// scenes/creator.js
// Reconstruido de publicado/juego.js (módulo __esm «CM»). Nombres locales aún minificados.

import { mu } from '../actors/outfits.js';
import { fc } from '../ui/creator.js';

async function crearEscenaCreator(o, e = {}) {
  let t = o.ui,
    a = t.R;
  (await t.ready, t.loading('Preparando el creador'));
  let n = o.stage,
    s = n.camera,
    i = n.controls,
    r = {
      pos: s.position.clone(),
      target: i.target.clone(),
      enabled: i.enabled,
      min: i.minDistance,
      max: i.maxDistance,
      minP: i.minPolarAngle,
      maxP: i.maxPolarAngle,
      damping: i.enableDamping,
    };
  ((i.enabled = !1),
    (i.enableDamping = !1),
    (i.minDistance = 0.1),
    (i.maxDistance = 100),
    (i.minPolarAngle = 0),
    (i.maxPolarAngle = Math.PI));
  let l = new mu(o),
    c = a.sheetNew({ ...(e.clase ? { class: e.clase } : {}), ...(e.especie ? { species: e.especie } : {}) });
  if (!c || c.error)
    return (
      t.loading(null),
      await t.message(
        'No se puede crear el h\xE9roe',
        `El n\xFAcleo de reglas no responde (${c?.error || 'sin respuesta'}).`,
      ),
      o.go('menu'),
      { three: l.scene, dispose: () => l.dispose() }
    );
  let d = !1,
    u = fc(t, o, {
      mode: 'create',
      sheet: c.sheet,
      options: c.options,
      onChange: (m) => l.setHero(m),
      onDrag: (m) => l.drag(m),
      onCancel: async () => {
        (await t.confirm('Volver\xE1s al men\xFA principal y este h\xE9roe se perder\xE1.', {
          titulo: '\xBFSalir del creador?',
          si: 'Salir',
          no: 'Seguir creando',
        })) && o.go('menu');
      },
      onFinish: async (m) => {
        if (d) return;
        let _ = a.cpNew(m, ['brenna']);
        if (!_ || _.error || !_.cp) {
          t.toast(`No se ha podido empezar la partida: ${_?.error || 'sin respuesta del n\xFAcleo'}`, 'mal');
          return;
        }
        ((d = !0),
          o.store.start(_.cp),
          u.el.classList.add('cierra'),
          (u.el.style.transition = 'opacity .5s'),
          (u.el.style.opacity = '0'),
          (u.el.style.pointerEvents = 'none'),
          o.store.save('auto').catch(() => null));
        try {
          await o.story?.prologue?.();
        } catch (b) {
          console.warn('[creador] pr\xF3logo', b);
        }
        o.scenes.registry.has('explore')
          ? o.go('explore', { level: 'merrowick', spawn: 'arrival' })
          : (await t.message(
              '\xA1H\xE9roe creado!',
              `${m.name} est\xE1 listo para partir hacia Merrowick, pero la exploraci\xF3n a\xFAn no est\xE1 montada en esta versi\xF3n.`,
              { boton: 'Volver al men\xFA' },
            ),
            o.go('menu'));
      },
    });
  (e.paso && u.go(e.paso), await l.setHero(c.sheet), o.audio?.music?.('menu', { fade: 2 }), t.loading(null));
  let h = null,
    p = 0;
  return {
    three: l.scene,
    sun: l.sun,
    update(m, _) {
      (l.update(m),
        (!h || _ - p > 0.5) && ((h = u.heroEl.getBoundingClientRect()), (p = _)),
        l.frame(s, h),
        i.target.set(0, l.lookY ?? 1, 0));
    },
    dispose() {
      (u.dispose(),
        l.dispose(),
        s.clearViewOffset(),
        s.position.copy(r.pos),
        i.target.copy(r.target),
        Object.assign(i, {
          enabled: r.enabled,
          minDistance: r.min,
          maxDistance: r.max,
          minPolarAngle: r.minP,
          maxPolarAngle: r.maxP,
          enableDamping: r.damping,
        }),
        s.updateProjectionMatrix());
    },
  };
}

export { crearEscenaCreator as create };
