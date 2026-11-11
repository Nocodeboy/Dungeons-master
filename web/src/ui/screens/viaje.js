// ui/screens/viaje.js
// Reconstruido de publicado/juego.js (módulo __esm «uM»). Nombres locales aún minificados.

import { escapeHtml, elem, makeButton } from '../dom.js';
import { screenFrame } from '../modal.js';
import { im } from '../travel-map.js';

function opcionesViaje() {
  return { width: '86rem', height: '54rem' };
}
function pantallaViaje(o, e, t, a) {
  let n = screenFrame(o, { title: 'Mapa de viaje', ic: 'treasure_map' });
  (n.body.classList.add('mg-fill'), (n.body.style.padding = '0 1rem 1rem'));
  let s = elem('div', {
    style: 'position:relative;min-height:0;display:grid;grid-template-rows:minmax(0,1fr) auto;gap:.6rem',
  });
  n.body.append(s);
  let i = elem('div.mg-map-info.mg-panel'),
    r = elem('div'),
    l = makeButton('Viajar', { icon: 'treasure_map', variant: 'primary', disabled: !0 });
  (i.append(r), e.consult || i.append(l));
  let c = null,
    d = im(t, a, s, {
      from: e.from,
      onSelect(u, h) {
        c = null;
        let p = '';
        (h.here
          ? (p = 'Est\xE1is aqu\xED.')
          : h.open
            ? h.hours != null
              ? (p = `${h.hours} ${h.hours === 1 ? 'hora' : 'horas'} de camino.`)
              : (p = 'No hay camino directo desde aqu\xED.')
            : (p = h.why),
          (r.innerHTML = `<b>${escapeHtml(u.name)}</b><p>${escapeHtml(u.desc || '')}</p><p class="${h.open && !h.here ? 'mg-oro' : 'mg-dim'}" style="margin:.2rem 0 0">${escapeHtml(p)}</p>`),
          h.open &&
            !h.here &&
            h.hours != null &&
            (c = { place: u.id, level: h.level, spawn: h.spawn, hours: h.hours }),
          (l.disabled = !c));
      },
      onActivate() {
        c && !e.consult && o.close(c);
      },
    });
  return (
    s.append(i),
    (r.innerHTML = `<b>${escapeHtml(d.world.title || 'Las Marcas de Vharen')}</b><p>${e.consult ? 'Para viajar, salid de la zona por uno de sus caminos.' : 'Elige un lugar del mapa.'}</p>`),
    l.addEventListener('click', () => c && o.close(c)),
    d.here && setTimeout(() => d.select(d.here)),
    {
      dispose: () => d.dispose(),
      onKey(u) {
        return u.key.toLowerCase() === 'm' && !u.target.closest?.('input,textarea')
          ? (o.close(null), !0)
          : !1;
      },
    }
  );
}

export { pantallaViaje as default, opcionesViaje as options };
