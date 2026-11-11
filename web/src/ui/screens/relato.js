// ui/screens/relato.js
// Reconstruido de publicado/juego.js (módulo __esm «EM»). Nombres locales aún minificados.

import { richText, elem, makeButton, reducedMotion, coarsePointer } from '../dom.js';

function opcionesRelato() {
  return { full: !0, cls: 'mg-relato' };
}
function pantallaRelato(screen, params, ui, game) {
  let el = screen.el,
    paragraphs = (params.paragraphs || []).map((text) => String(text || '').trim()).filter(Boolean),
    speed = Number(game.store?.settings?.textSpeed) || 1,
    instant = reducedMotion() || speed >= 50,
    scroller = elem('div.mg-relato-scroll.mg-scroll'),
    column = elem('div.mg-relato-col');
  (params.place && column.append(elem('div.mg-relato-place', params.place)),
    params.title && column.append(elem('h1.mg-relato-title', params.title)),
    column.append(elem('div.mg-hr', elem('i'))));
  let textBox = elem('div.mg-relato-text'),
    paras = paragraphs.map((text, index) => {
      let body = /^\*[^*]+\*$/.test(text) ? text.slice(1, -1) : text,
        para = elem(`p${index === 0 ? '.primero' : ''}`, { html: richText(body) });
      return (textBox.append(para), para);
    });
  (column.append(textBox), scroller.append(column));
  let foot = elem('div.mg-relato-foot'),
    hint = elem(
      'span.mg-relato-hint',
      coarsePointer() ? 'Toca el texto para seguir' : 'Clic, Espacio o Intro para seguir',
    ),
    counter = elem('span.mg-relato-count'),
    skipButton = makeButton('Saltar', { icon: 'fast', variant: 'ghost', onclick: () => screen.close(!0) }),
    nextButton = makeButton(params.button || 'Continuar', {
      icon: 'redo',
      variant: 'primary',
      size: 'lg',
      onclick: () => next(),
    });
  (foot.append(
    elem('div.mg-relato-foot-l', hint, counter),
    elem('div.mg-relato-foot-r', skipButton, nextButton),
  ),
    el.append(scroller, foot),
    el.setAttribute('aria-label', params.title || 'Relato'));
  let shown = 0,
    timer = 0,
    updateFoot = () => {
      counter.textContent = paras.length > 1 ? `${shown} / ${paras.length}` : '';
      let done = shown >= paras.length;
      ((hint.hidden = done), (skipButton.hidden = done), nextButton.classList.toggle('listo', done));
    };
  function reveal(index) {
    let para = paras[index];
    para.classList.add('on');
    let bottom = Math.max(0, para.offsetTop + para.offsetHeight - scroller.clientHeight + 24);
    bottom > scroller.scrollTop &&
      scroller.scrollTo({ top: bottom, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }
  function advance() {
    if (
      (clearTimeout(timer),
      shown >= paras.length || (reveal(shown), (shown += 1), updateFoot(), shown >= paras.length))
    )
      return revealAll();
    let length = paragraphs[shown - 1].length,
      delay = Math.min(6500, Math.max(1800, (length * 38) / Math.max(0.25, speed)));
    timer = setTimeout(advance, delay);
  }
  function revealAll() {
    clearTimeout(timer);
    for (let index = 0; index < paras.length; index++) paras[index].classList.contains('on') || reveal(index);
    ((shown = paras.length), updateFoot());
  }
  function next() {
    shown < paras.length ? advance() : screen.close(!0);
  }
  return (
    scroller.addEventListener('click', (ev) => {
      ev.target.closest('button, a') || next();
    }),
    updateFoot(),
    instant || !paras.length ? revealAll() : (timer = setTimeout(advance, 400)),
    requestAnimationFrame(() => nextButton.focus({ preventScroll: !0 })),
    game.bus?.emit('story:relato', { title: params.title || '' }),
    params.music !== !1 && game.audio?.music?.(params.music || 'relato', { fade: 2 }),
    {
      onKey(ev) {
        if (ev.key === ' ' || ev.key === 'Enter' || ev.key === '1') {
          let active = document.activeElement;
          return ev.key !== '1' && active?.tagName === 'BUTTON' && el.contains(active) ? !1 : (next(), !0);
        }
        return ev.key === 'ArrowDown' || ev.key === 'PageDown'
          ? (scroller.scrollBy({ top: scroller.clientHeight * 0.8, behavior: 'smooth' }), !0)
          : ev.key === 'ArrowUp' || ev.key === 'PageUp'
            ? (scroller.scrollBy({ top: -scroller.clientHeight * 0.8, behavior: 'smooth' }), !0)
            : !1;
      },
      onEscape() {
        shown < paras.length ? revealAll() : screen.close(!0);
      },
      dispose() {
        clearTimeout(timer);
      },
    }
  );
}

export { pantallaRelato as default, opcionesRelato as options };
