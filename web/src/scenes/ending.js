// scenes/ending.js
// Reconstruido de publicado/juego.js (módulo __esm «IM»). Nombres locales aún minificados.

import { buildBackdrop } from './menu.js';
import { CREDITS_HTML } from '../ui/screens/creditos.js';
import { paragraphsHtml as Xl, elem, makeButton, reducedMotion } from '../ui/dom.js';

function fD(o) {
  return {
    title: 'Fin del cap\xEDtulo I',
    slides: [
      {
        title: 'El primer sello',
        text:
          (o?.flags || {}).seal_choice === 'broken'
            ? '*La piedra del sello se parti\xF3 con un ruido de hueso viejo.* La Marca de tu piel dej\xF3 de arder esa misma noche, y por primera vez en tu vida no sentiste el latido de la roca bajo los pies. Lo que dorm\xEDa bajo Merrowick sigue ah\xED, pero ya no te llama por tu nombre.'
            : '*Tu sangre corri\xF3 por los surcos del sello y la piedra bebi\xF3.* El toro de granito dej\xF3 de sangrar al amanecer. La Marca sigue en tu piel, m\xE1s fr\xEDa que nunca, como una promesa que alguien tendr\xE1 que cumplir.',
      },
      {
        title: 'Merrowick',
        text: 'Los pastores volvieron a sacar las ovejas al prado. La alcaldesa Maren mand\xF3 limpiar el pedestal del toro y nadie se atrevi\xF3 a preguntar por la grieta, que ya no supura pero tampoco se cierra.',
      },
      {
        title: 'El camino de Valdrecht',
        text: 'Hay siete sellos y siete toros en las Marcas de Vharen. Uno ya no es un secreto. En Valdrecht, el Gremio de Canteros guarda mapas que nadie ha le\xEDdo en mil a\xF1os\u2026 y el camino empieza ma\xF1ana.',
      },
    ],
  };
}
async function crearEscenaEnding(o, e = {}) {
  let t = o.ui;
  (await t.ready, t.loading('El alba sobre Merrowick'), t.hud.hide());
  let a = o.stage,
    n = a.camera,
    s = a.controls,
    i = {
      enabled: s.enabled,
      min: s.minDistance,
      max: s.maxDistance,
      minP: s.minPolarAngle,
      maxP: s.maxPolarAngle,
      damping: s.enableDamping,
      target: s.target.clone(),
    };
  (Object.assign(s, {
    enabled: !1,
    enableDamping: !1,
    minDistance: 0.1,
    maxDistance: 200,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI,
  }),
    s.target.set(0, 1.4, 0));
  let r = await buildBackdrop(o, { dawn: !0 });
  o.store.setFlag?.('chapter1_done', !0);
  let l = e.epilogue || null;
  if (!l?.slides?.length)
    try {
      l = await o.story?.epilogue?.();
    } catch (m) {
      console.warn('[final] ep\xEDlogo', m);
    }
  (l?.slides?.length || (l = fD(o.store.cp)),
    (l = { ...l, slides: [...l.slides] }),
    l.closing &&
      l.slides.push({ title: l.subtitle || 'Fin del cap\xEDtulo I', text: l.closing, closing: !0 }));
  let c = elem('div.mg-ending');
  t.root.append(c);
  let d = 0,
    u = !1;
  function h() {
    let m = l.slides[d];
    c.innerHTML = '';
    let _ = elem(`article.mg-ending-slide.mg-parchment${m.closing ? '.cierre' : ''}`);
    _.append(elem('h1.mg-h1', m.title || l.title || 'Ep\xEDlogo'));
    let b = (d === 0 && l.title) || '';
    (b && m.title && _.prepend(elem('div.mg-ending-kicker', b)),
      _.append(elem('div.txt', { html: Xl(String(m.text || '').split(/\n{2,}/)) })));
    let f = elem('div.pie');
    f.append(elem('span.mg-dim', `${d + 1} / ${l.slides.length}`));
    let v = makeButton(d < l.slides.length - 1 ? 'Seguir' : 'Cr\xE9ditos', {
      icon: d < l.slides.length - 1 ? 'redo' : 'scroll_quill',
      variant: 'primary',
      onclick: () => (d < l.slides.length - 1 ? (d++, h()) : p()),
    });
    (f.append(v), _.append(f), c.append(_), v.focus());
  }
  function p() {
    ((u = !0), o.audio?.music?.('victoria', { fade: 2 }), (c.innerHTML = ''));
    let m = elem('div.mg-roll-credits'),
      _ = elem('div.mg-credits', {
        html: `<div class="grande">Marca de Granito</div><p style="font:500 1.2rem/1.3 var(--f-sc);letter-spacing:.1em">Fin del cap\xEDtulo I \xB7 El toro que sangra</p>${CREDITS_HTML}<p style="margin-top:3rem;font-style:italic">Continuar\xE1 en Valdrecht\u2026</p>`,
      });
    (m.append(_), c.append(m));
    let b = makeButton('Volver al men\xFA', { icon: 'return', onclick: () => o.go('menu') });
    ((b.style.cssText =
      'position:fixed;right:max(16px,2vw);bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:5'),
      c.append(b));
    let f = _.offsetHeight + innerHeight;
    (reducedMotion()
      ? (_.style.top = '8%')
      : _.animate([{ transform: 'translate(-50%, 0)' }, { transform: `translate(-50%, ${-f}px)` }], {
          duration: Math.max(4e4, f * 28),
          easing: 'linear',
          fill: 'forwards',
        })
          .finished.then(() => u && o.go('menu'))
          .catch(() => null),
      b.focus());
  }
  return (
    o.audio?.music?.('epilogo', { fade: 2 }),
    t.loading(null),
    h(),
    o.store.save?.('auto').catch(() => null),
    {
      three: r.scene,
      sun: r.sun,
      update(m) {
        r.update(m, n);
      },
      dispose() {
        ((u = !1),
          c.remove(),
          r.dispose(),
          Object.assign(s, {
            enabled: i.enabled,
            minDistance: i.min,
            maxDistance: i.max,
            minPolarAngle: i.minP,
            maxPolarAngle: i.maxP,
            enableDamping: i.damping,
          }),
          s.target.copy(i.target));
      },
    }
  );
}

export { crearEscenaEnding as create };
