// ui/screens/relato.js
// Reconstruido de publicado/juego.js (módulo __esm «EM»). Nombres locales aún minificados.

import { richText, elem, makeButton, reducedMotion, coarsePointer } from '../dom.js';

function opcionesRelato() {
  return { full: !0, cls: 'mg-relato' };
}
function pantallaRelato(o, e, t, a) {
  let n = o.el,
    s = (e.paragraphs || []).map((T) => String(T || '').trim()).filter(Boolean),
    i = Number(a.store?.settings?.textSpeed) || 1,
    r = reducedMotion() || i >= 50,
    l = elem('div.mg-relato-scroll.mg-scroll'),
    c = elem('div.mg-relato-col');
  (e.place && c.append(elem('div.mg-relato-place', e.place)),
    e.title && c.append(elem('h1.mg-relato-title', e.title)),
    c.append(elem('div.mg-hr', elem('i'))));
  let d = elem('div.mg-relato-text'),
    u = s.map((T, E) => {
      let S = /^\*[^*]+\*$/.test(T) ? T.slice(1, -1) : T,
        z = elem(`p${E === 0 ? '.primero' : ''}`, { html: richText(S) });
      return (d.append(z), z);
    });
  (c.append(d), l.append(c));
  let h = elem('div.mg-relato-foot'),
    p = elem(
      'span.mg-relato-hint',
      coarsePointer() ? 'Toca el texto para seguir' : 'Clic, Espacio o Intro para seguir',
    ),
    m = elem('span.mg-relato-count'),
    _ = makeButton('Saltar', { icon: 'fast', variant: 'ghost', onclick: () => o.close(!0) }),
    b = makeButton(e.button || 'Continuar', {
      icon: 'redo',
      variant: 'primary',
      size: 'lg',
      onclick: () => k(),
    });
  (h.append(elem('div.mg-relato-foot-l', p, m), elem('div.mg-relato-foot-r', _, b)),
    n.append(l, h),
    n.setAttribute('aria-label', e.title || 'Relato'));
  let f = 0,
    v = 0,
    x = () => {
      m.textContent = u.length > 1 ? `${f} / ${u.length}` : '';
      let T = f >= u.length;
      ((p.hidden = T), (_.hidden = T), b.classList.toggle('listo', T));
    };
  function g(T) {
    let E = u[T];
    E.classList.add('on');
    let S = Math.max(0, E.offsetTop + E.offsetHeight - l.clientHeight + 24);
    S > l.scrollTop && l.scrollTo({ top: S, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }
  function y() {
    if ((clearTimeout(v), f >= u.length || (g(f), (f += 1), x(), f >= u.length))) return w();
    let T = s[f - 1].length,
      E = Math.min(6500, Math.max(1800, (T * 38) / Math.max(0.25, i)));
    v = setTimeout(y, E);
  }
  function w() {
    clearTimeout(v);
    for (let T = 0; T < u.length; T++) u[T].classList.contains('on') || g(T);
    ((f = u.length), x());
  }
  function k() {
    f < u.length ? y() : o.close(!0);
  }
  return (
    l.addEventListener('click', (T) => {
      T.target.closest('button, a') || k();
    }),
    x(),
    r || !u.length ? w() : (v = setTimeout(y, 400)),
    requestAnimationFrame(() => b.focus({ preventScroll: !0 })),
    a.bus?.emit('story:relato', { title: e.title || '' }),
    e.music !== !1 && a.audio?.music?.(e.music || 'relato', { fade: 2 }),
    {
      onKey(T) {
        if (T.key === ' ' || T.key === 'Enter' || T.key === '1') {
          let E = document.activeElement;
          return T.key !== '1' && E?.tagName === 'BUTTON' && n.contains(E) ? !1 : (k(), !0);
        }
        return T.key === 'ArrowDown' || T.key === 'PageDown'
          ? (l.scrollBy({ top: l.clientHeight * 0.8, behavior: 'smooth' }), !0)
          : T.key === 'ArrowUp' || T.key === 'PageUp'
            ? (l.scrollBy({ top: -l.clientHeight * 0.8, behavior: 'smooth' }), !0)
            : !1;
      },
      onEscape() {
        f < u.length ? w() : o.close(!0);
      },
      dispose() {
        clearTimeout(v);
      },
    }
  );
}

export { pantallaRelato as default, opcionesRelato as options };
