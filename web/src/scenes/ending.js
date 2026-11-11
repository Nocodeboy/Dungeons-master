// scenes/ending.js — Escena «ending»: epílogo del capítulo I en láminas sobre el fondo del menú al alba
// (story.epilogue o un epílogo por defecto según el sello) y créditos finales que suben solos.
// La registra ui/index.js.
// Reconstruido de publicado/juego.js (módulo __esm «IM»).

import { buildBackdrop } from './menu.js';
import { CREDITS_HTML } from '../ui/screens/creditos.js';
import { Xl, elem, makeButton, reducedMotion } from '../ui/dom.js';

/** Epílogo por defecto si la historia no da uno; la primera lámina depende de `flags.seal_choice`. */
function defaultEpilogue(cp) {
  return {
    title: 'Fin del cap\xEDtulo I',
    slides: [
      {
        title: 'El primer sello',
        text:
          (cp?.flags || {}).seal_choice === 'broken'
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
/** Crea la escena del final (exportada como `create`); marca la bandera chapter1_done. */
async function crearEscenaEnding(game, params = {}) {
  let ui = game.ui;
  (await ui.ready, ui.loading('El alba sobre Merrowick'), ui.hud.hide());
  let stage = game.stage,
    camera = stage.camera,
    controls = stage.controls,
    saved = {
      enabled: controls.enabled,
      min: controls.minDistance,
      max: controls.maxDistance,
      minP: controls.minPolarAngle,
      maxP: controls.maxPolarAngle,
      damping: controls.enableDamping,
      target: controls.target.clone(),
    };
  (Object.assign(controls, {
    enabled: !1,
    enableDamping: !1,
    minDistance: 0.1,
    maxDistance: 200,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI,
  }),
    controls.target.set(0, 1.4, 0));
  let backdrop = await buildBackdrop(game, { dawn: !0 });
  game.store.setFlag?.('chapter1_done', !0);
  let epi = params.epilogue || null;
  if (!epi?.slides?.length)
    try {
      epi = await game.story?.epilogue?.();
    } catch (err) {
      console.warn('[final] ep\xEDlogo', err);
    }
  (epi?.slides?.length || (epi = defaultEpilogue(game.store.cp)),
    (epi = { ...epi, slides: [...epi.slides] }),
    epi.closing &&
      epi.slides.push({ title: epi.subtitle || 'Fin del cap\xEDtulo I', text: epi.closing, closing: !0 }));
  let root = elem('div.mg-ending');
  ui.root.append(root);
  let idx = 0,
    rolling = !1;
  /** Pinta la lámina actual con su botón «Seguir» (o «Créditos» en la última). */
  function showSlide() {
    let slide = epi.slides[idx];
    root.innerHTML = '';
    let card = elem(`article.mg-ending-slide.mg-parchment${slide.closing ? '.cierre' : ''}`);
    card.append(elem('h1.mg-h1', slide.title || epi.title || 'Ep\xEDlogo'));
    let kicker = (idx === 0 && epi.title) || '';
    (kicker && slide.title && card.prepend(elem('div.mg-ending-kicker', kicker)),
      card.append(elem('div.txt', { html: Xl(String(slide.text || '').split(/\n{2,}/)) })));
    let foot = elem('div.pie');
    foot.append(elem('span.mg-dim', `${idx + 1} / ${epi.slides.length}`));
    let btn = makeButton(idx < epi.slides.length - 1 ? 'Seguir' : 'Cr\xE9ditos', {
      icon: idx < epi.slides.length - 1 ? 'redo' : 'scroll_quill',
      variant: 'primary',
      onclick: () => (idx < epi.slides.length - 1 ? (idx++, showSlide()) : showCredits()),
    });
    (foot.append(btn), card.append(foot), root.append(card), btn.focus());
  }
  /** Créditos con desplazamiento lento; al acabar vuelve al menú. */
  function showCredits() {
    ((rolling = !0), game.audio?.music?.('victoria', { fade: 2 }), (root.innerHTML = ''));
    let roll = elem('div.mg-roll-credits'),
      credits = elem('div.mg-credits', {
        html: `<div class="grande">Marca de Granito</div><p style="font:500 1.2rem/1.3 var(--f-sc);letter-spacing:.1em">Fin del cap\xEDtulo I \xB7 El toro que sangra</p>${CREDITS_HTML}<p style="margin-top:3rem;font-style:italic">Continuar\xE1 en Valdrecht\u2026</p>`,
      });
    (roll.append(credits), root.append(roll));
    let backBtn = makeButton('Volver al men\xFA', { icon: 'return', onclick: () => game.go('menu') });
    ((backBtn.style.cssText =
      'position:fixed;right:max(16px,2vw);bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:5'),
      root.append(backBtn));
    let dist = credits.offsetHeight + innerHeight;
    (reducedMotion()
      ? (credits.style.top = '8%')
      : credits
          .animate([{ transform: 'translate(-50%, 0)' }, { transform: `translate(-50%, ${-dist}px)` }], {
            duration: Math.max(4e4, dist * 28),
            easing: 'linear',
            fill: 'forwards',
          })
          .finished.then(() => rolling && game.go('menu'))
          .catch(() => null),
      backBtn.focus());
  }
  return (
    game.audio?.music?.('epilogo', { fade: 2 }),
    ui.loading(null),
    showSlide(),
    game.store.save?.('auto').catch(() => null),
    {
      three: backdrop.scene,
      sun: backdrop.sun,
      update(dt) {
        backdrop.update(dt, camera);
      },
      dispose() {
        ((rolling = !1),
          root.remove(),
          backdrop.dispose(),
          Object.assign(controls, {
            enabled: saved.enabled,
            minDistance: saved.min,
            maxDistance: saved.max,
            minPolarAngle: saved.minP,
            maxPolarAngle: saved.maxP,
            enableDamping: saved.damping,
          }),
          controls.target.copy(saved.target));
      },
    }
  );
}

export { crearEscenaEnding as create };
