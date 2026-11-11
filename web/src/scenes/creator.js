// scenes/creator.js — Escena «creator»: el creador de personajes (ui/creator.js) sobre la vista previa
// 3D del héroe (actors/outfits.js). Al terminar crea la campaña (cp_new con Brenna), lanza el prólogo de la
// historia y entra en Merrowick. Admite ?clase, ?especie y ?paso. La registra ui/index.js.
// Reconstruido de publicado/juego.js (módulo __esm «CM»).

import { mu } from '../actors/outfits.js';
import { buildCreator } from '../ui/creator.js';

/** Crea la escena del creador (exportada como `create`). Bloquea los OrbitControls y los restaura al salir. */
async function crearEscenaCreator(game, params = {}) {
  let ui = game.ui,
    rules = ui.R;
  (await ui.ready, ui.loading('Preparando el creador'));
  let stage = game.stage,
    camera = stage.camera,
    controls = stage.controls,
    saved = {
      pos: camera.position.clone(),
      target: controls.target.clone(),
      enabled: controls.enabled,
      min: controls.minDistance,
      max: controls.maxDistance,
      minP: controls.minPolarAngle,
      maxP: controls.maxPolarAngle,
      damping: controls.enableDamping,
    };
  ((controls.enabled = !1),
    (controls.enableDamping = !1),
    (controls.minDistance = 0.1),
    (controls.maxDistance = 100),
    (controls.minPolarAngle = 0),
    (controls.maxPolarAngle = Math.PI));
  let preview = new mu(game),
    res = rules.sheetNew({
      ...(params.clase ? { class: params.clase } : {}),
      ...(params.especie ? { species: params.especie } : {}),
    });
  if (!res || res.error)
    return (
      ui.loading(null),
      await ui.message(
        'No se puede crear el h\xE9roe',
        `El n\xFAcleo de reglas no responde (${res?.error || 'sin respuesta'}).`,
      ),
      game.go('menu'),
      { three: preview.scene, dispose: () => preview.dispose() }
    );
  let finished = !1,
    creator = buildCreator(ui, game, {
      mode: 'create',
      sheet: res.sheet,
      options: res.options,
      onChange: (sheet) => preview.setHero(sheet),
      onDrag: (dx) => preview.drag(dx),
      onCancel: async () => {
        (await ui.confirm('Volver\xE1s al men\xFA principal y este h\xE9roe se perder\xE1.', {
          titulo: '\xBFSalir del creador?',
          si: 'Salir',
          no: 'Seguir creando',
        })) && game.go('menu');
      },
      onFinish: async (hero) => {
        if (finished) return;
        let res = rules.cpNew(hero, ['brenna']);
        if (!res || res.error || !res.cp) {
          ui.toast(
            `No se ha podido empezar la partida: ${res?.error || 'sin respuesta del n\xFAcleo'}`,
            'mal',
          );
          return;
        }
        ((finished = !0),
          game.store.start(res.cp),
          creator.el.classList.add('cierra'),
          (creator.el.style.transition = 'opacity .5s'),
          (creator.el.style.opacity = '0'),
          (creator.el.style.pointerEvents = 'none'),
          game.store.save('auto').catch(() => null));
        try {
          await game.story?.prologue?.();
        } catch (err) {
          console.warn('[creador] pr\xF3logo', err);
        }
        game.scenes.registry.has('explore')
          ? game.go('explore', { level: 'merrowick', spawn: 'arrival' })
          : (await ui.message(
              '\xA1H\xE9roe creado!',
              `${hero.name} est\xE1 listo para partir hacia Merrowick, pero la exploraci\xF3n a\xFAn no est\xE1 montada en esta versi\xF3n.`,
              { boton: 'Volver al men\xFA' },
            ),
            game.go('menu'));
      },
    });
  (params.paso && creator.go(params.paso),
    await preview.setHero(res.sheet),
    game.audio?.music?.('menu', { fade: 2 }),
    ui.loading(null));
  let heroRect = null,
    rectTime = 0;
  return {
    three: preview.scene,
    sun: preview.sun,
    update(dt, time) {
      (preview.update(dt),
        (!heroRect || time - rectTime > 0.5) &&
          ((heroRect = creator.heroEl.getBoundingClientRect()), (rectTime = time)),
        preview.frame(camera, heroRect),
        controls.target.set(0, preview.lookY ?? 1, 0));
    },
    dispose() {
      (creator.dispose(),
        preview.dispose(),
        camera.clearViewOffset(),
        camera.position.copy(saved.pos),
        controls.target.copy(saved.target),
        Object.assign(controls, {
          enabled: saved.enabled,
          minDistance: saved.min,
          maxDistance: saved.max,
          minPolarAngle: saved.minP,
          maxPolarAngle: saved.maxP,
          enableDamping: saved.damping,
        }),
        camera.updateProjectionMatrix());
    },
  };
}

export { crearEscenaCreator as create };
