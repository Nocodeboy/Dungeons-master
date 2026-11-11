// scenes/travel.js
// Reconstruido de publicado/juego.js (módulo __esm «zM»). Nombres locales aún minificados.

import { iconHtml, escapeHtml, elem, makeButton, sleep, reducedMotion } from '../ui/dom.js';
import { createTravelMap as im } from '../ui/travel-map.js';

async function crearEscenaTravel(o, e = {}) {
  let t = o.ui;
  (await t.ready, t.hud.hide());
  let a = elem('div.mg-travel');
  t.root.append(a);
  let n = elem('div.mg-map-info.mg-panel'),
    s = elem('div'),
    i = makeButton('Viajar', { icon: 'treasure_map', variant: 'primary', disabled: !0 }),
    r = makeButton('Quedarse', { icon: 'return' });
  n.append(s, r, i);
  let l = null,
    c = !1,
    d = im(t, o, a, {
      from: e.from,
      onSelect(p, m) {
        if (c) return;
        l = null;
        let _ = m.here
          ? 'Est\xE1is aqu\xED.'
          : m.open
            ? m.hours != null
              ? `${m.hours} ${m.hours === 1 ? 'hora' : 'horas'} de camino.`
              : 'No hay camino directo desde aqu\xED.'
            : m.why;
        ((s.innerHTML = `<b>${escapeHtml(p.name)}</b><p>${escapeHtml(p.desc || '')}</p><p class="${m.open && !m.here ? 'mg-oro' : 'mg-dim'}" style="margin:.2rem 0 0">${escapeHtml(_)}</p>`),
          m.open &&
            !m.here &&
            m.hours != null &&
            (l = { place: p.id, level: m.level, spawn: m.spawn, hours: m.hours, name: p.name }),
          (i.disabled = !l));
      },
      onActivate: () => l && h(),
    });
  (a.append(n), (d.inner || d.el).append(elem('div.mg-map-title', d.world.title || 'Las Marcas de Vharen')));
  let u = elem('div.mg-clock');
  ((u.hidden = !0),
    d.el.append(u),
    (s.innerHTML =
      '<b>\xBFAd\xF3nde vais?</b><p>Elige un lugar del mapa. Las horas de camino pasan, y con ellas el d\xEDa.</p>'));
  async function h() {
    if (!l || c) return;
    ((c = !0), (i.disabled = r.disabled = !0));
    let p = elem('div.mg-token');
    (d.el.append(p), (u.hidden = !1));
    let m = o.store.cp,
      _ = m?.hour ?? 18,
      b = reducedMotion() ? 200 : Math.min(3600, 900 + l.hours * 420),
      f = performance.now();
    for (o.audio?.sfx?.('pasos_camino'); ;) {
      let v = Math.min(1, (performance.now() - f) / b),
        x = d.routePoint(v);
      if (x) {
        let [y, w] = d.toPx(x);
        ((p.style.left = `${y}px`), (p.style.top = `${w}px`));
      }
      let g = Math.floor((_ + l.hours * v) % 24);
      if (
        ((u.innerHTML = `${iconHtml(g >= 7 && g < 20 ? 'sun' : 'moon')}<span>${String(g).padStart(2, '0')}:00 \xB7 ${escapeHtml(l.name)}</span>`),
        v >= 1)
      )
        break;
      await new Promise((y) => requestAnimationFrame(y));
    }
    (await sleep(350),
      m && t.R.passHours(l.hours),
      o.bus?.emit('travel', { from: d.here, to: l.place, hours: l.hours }),
      o.scenes.registry.has('explore')
        ? o.go('explore', { level: l.level, spawn: l.spawn, from: d.here })
        : (t.toast(
            `Lleg\xE1is a ${l.name} (la exploraci\xF3n a\xFAn no est\xE1 montada en esta versi\xF3n).`,
            'info',
          ),
          (c = !1),
          (i.disabled = r.disabled = !1),
          p.remove()));
  }
  return (
    i.addEventListener('click', h),
    r.addEventListener('click', () => {
      let p =
        e.back ||
        (o.store.cp?.location?.level
          ? { level: o.store.cp.location.level, spawn: o.store.cp.location.spawn }
          : null);
      p && o.scenes.registry.has('explore') ? o.go('explore', p) : o.go('menu');
    }),
    e.to ? (d.select(e.to), l && setTimeout(h, 500)) : d.here && d.select(d.here),
    o.audio?.music?.('viaje', { fade: 1.5 }),
    t.loading(null),
    {
      dispose() {
        (d.dispose(), a.remove());
      },
    }
  );
}

export { crearEscenaTravel as create };
