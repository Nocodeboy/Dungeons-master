// scenes/travel.js — Escena «travel»: mapa de viaje (ui/travel-map.js) con el panel del destino, la
// animación del viaje con el reloj y el paso de las horas (passHours) y la llegada al nivel elegido.
// La registra ui/index.js; la abre explore/index.js (`travel('travel')`).
// Reconstruido de publicado/juego.js (módulo __esm «zM»).

import { iconHtml, escapeHtml, elem, makeButton, sleep, reducedMotion } from '../ui/dom.js';
import { im } from '../ui/travel-map.js';

/**
 * Crea la escena del mapa de viaje (exportada como `create`). `params`: from, to (viajar directamente)
 * y back (adónde volver con «Quedarse»).
 */
async function crearEscenaTravel(game, params = {}) {
  let ui = game.ui;
  (await ui.ready, ui.hud.hide());
  let root = elem('div.mg-travel');
  ui.root.append(root);
  let info = elem('div.mg-map-info.mg-panel'),
    infoText = elem('div'),
    goBtn = makeButton('Viajar', { icon: 'treasure_map', variant: 'primary', disabled: !0 }),
    stayBtn = makeButton('Quedarse', { icon: 'return' });
  info.append(infoText, stayBtn, goBtn);
  let pick = null,
    traveling = !1,
    map = im(ui, game, root, {
      from: params.from,
      onSelect(place, route) {
        if (traveling) return;
        pick = null;
        let status = route.here
          ? 'Est\xE1is aqu\xED.'
          : route.open
            ? route.hours != null
              ? `${route.hours} ${route.hours === 1 ? 'hora' : 'horas'} de camino.`
              : 'No hay camino directo desde aqu\xED.'
            : route.why;
        ((infoText.innerHTML = `<b>${escapeHtml(place.name)}</b><p>${escapeHtml(place.desc || '')}</p><p class="${route.open && !route.here ? 'mg-oro' : 'mg-dim'}" style="margin:.2rem 0 0">${escapeHtml(status)}</p>`),
          route.open &&
            !route.here &&
            route.hours != null &&
            (pick = {
              place: place.id,
              level: route.level,
              spawn: route.spawn,
              hours: route.hours,
              name: place.name,
            }),
          (goBtn.disabled = !pick));
      },
      onActivate: () => pick && startTravel(),
    });
  (root.append(info),
    (map.inner || map.el).append(elem('div.mg-map-title', map.world.title || 'Las Marcas de Vharen')));
  let clock = elem('div.mg-clock');
  ((clock.hidden = !0),
    map.el.append(clock),
    (infoText.innerHTML =
      '<b>\xBFAd\xF3nde vais?</b><p>Elige un lugar del mapa. Las horas de camino pasan, y con ellas el d\xEDa.</p>'));
  /** Anima la ficha por la ruta mientras avanza el reloj y entra en el nivel de destino. */
  async function startTravel() {
    if (!pick || traveling) return;
    ((traveling = !0), (goBtn.disabled = stayBtn.disabled = !0));
    let token = elem('div.mg-token');
    (map.el.append(token), (clock.hidden = !1));
    let cp = game.store.cp,
      hour0 = cp?.hour ?? 18,
      dur = reducedMotion() ? 200 : Math.min(3600, 900 + pick.hours * 420),
      t0 = performance.now();
    for (game.audio?.sfx?.('pasos_camino'); ;) {
      let k = Math.min(1, (performance.now() - t0) / dur),
        pt = map.routePoint(k);
      if (pt) {
        let [px, py] = map.toPx(pt);
        ((token.style.left = `${px}px`), (token.style.top = `${py}px`));
      }
      let hour = Math.floor((hour0 + pick.hours * k) % 24);
      if (
        ((clock.innerHTML = `${iconHtml(hour >= 7 && hour < 20 ? 'sun' : 'moon')}<span>${String(hour).padStart(2, '0')}:00 \xB7 ${escapeHtml(pick.name)}</span>`),
        k >= 1)
      )
        break;
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    (await sleep(350),
      cp && ui.R.passHours(pick.hours),
      game.bus?.emit('travel', { from: map.here, to: pick.place, hours: pick.hours }),
      game.scenes.registry.has('explore')
        ? game.go('explore', { level: pick.level, spawn: pick.spawn, from: map.here })
        : (ui.toast(
            `Lleg\xE1is a ${pick.name} (la exploraci\xF3n a\xFAn no est\xE1 montada en esta versi\xF3n).`,
            'info',
          ),
          (traveling = !1),
          (goBtn.disabled = stayBtn.disabled = !1),
          token.remove()));
  }
  return (
    goBtn.addEventListener('click', startTravel),
    stayBtn.addEventListener('click', () => {
      let back =
        params.back ||
        (game.store.cp?.location?.level
          ? { level: game.store.cp.location.level, spawn: game.store.cp.location.spawn }
          : null);
      back && game.scenes.registry.has('explore') ? game.go('explore', back) : game.go('menu');
    }),
    params.to
      ? (map.select(params.to), pick && setTimeout(startTravel, 500))
      : map.here && map.select(map.here),
    game.audio?.music?.('viaje', { fade: 1.5 }),
    ui.loading(null),
    {
      dispose() {
        (map.dispose(), root.remove());
      },
    }
  );
}

export { crearEscenaTravel as create };
