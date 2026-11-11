// ui/screens/viaje.js
// Reconstruido de publicado/juego.js (módulo __esm «uM»). Nombres locales aún minificados.

import { escapeHtml, elem, makeButton } from '../dom.js';
import { screenFrame } from '../modal.js';
import { im } from '../travel-map.js';

function opcionesViaje() {
  return { width: '86rem', height: '54rem' };
}
function pantallaViaje(screen, params, ui, game) {
  let frame = screenFrame(screen, { title: 'Mapa de viaje', ic: 'treasure_map' });
  (frame.body.classList.add('mg-fill'), (frame.body.style.padding = '0 1rem 1rem'));
  let wrap = elem('div', {
    style: 'position:relative;min-height:0;display:grid;grid-template-rows:minmax(0,1fr) auto;gap:.6rem',
  });
  frame.body.append(wrap);
  let info = elem('div.mg-map-info.mg-panel'),
    infoText = elem('div'),
    travelButton = makeButton('Viajar', { icon: 'treasure_map', variant: 'primary', disabled: !0 });
  (info.append(infoText), params.consult || info.append(travelButton));
  let choice = null,
    map = im(ui, game, wrap, {
      from: params.from,
      onSelect(place, route) {
        choice = null;
        let text = '';
        (route.here
          ? (text = 'Est\xE1is aqu\xED.')
          : route.open
            ? route.hours != null
              ? (text = `${route.hours} ${route.hours === 1 ? 'hora' : 'horas'} de camino.`)
              : (text = 'No hay camino directo desde aqu\xED.')
            : (text = route.why),
          (infoText.innerHTML = `<b>${escapeHtml(place.name)}</b><p>${escapeHtml(place.desc || '')}</p><p class="${route.open && !route.here ? 'mg-oro' : 'mg-dim'}" style="margin:.2rem 0 0">${escapeHtml(text)}</p>`),
          route.open &&
            !route.here &&
            route.hours != null &&
            (choice = { place: place.id, level: route.level, spawn: route.spawn, hours: route.hours }),
          (travelButton.disabled = !choice));
      },
      onActivate() {
        choice && !params.consult && screen.close(choice);
      },
    });
  return (
    wrap.append(info),
    (infoText.innerHTML = `<b>${escapeHtml(map.world.title || 'Las Marcas de Vharen')}</b><p>${params.consult ? 'Para viajar, salid de la zona por uno de sus caminos.' : 'Elige un lugar del mapa.'}</p>`),
    travelButton.addEventListener('click', () => choice && screen.close(choice)),
    map.here && setTimeout(() => map.select(map.here)),
    {
      dispose: () => map.dispose(),
      onKey(ev) {
        return ev.key.toLowerCase() === 'm' && !ev.target.closest?.('input,textarea')
          ? (screen.close(null), !0)
          : !1;
      },
    }
  );
}

export { pantallaViaje as default, opcionesViaje as options };
