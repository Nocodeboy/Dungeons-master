// ui/tooltip.js
// Reconstruido de publicado/juego.js (módulo __esm «ci»). Nombres locales aún minificados.

import { escapeHtml, richText, elem } from './dom.js';

function A6(o) {
  return o == null
    ? ''
    : typeof o == 'string'
      ? o
      : `${o.title ? `<div class="mg-tip-t">${escapeHtml(o.title)}</div>` : ''}${o.sub ? `<div class="mg-tip-s">${escapeHtml(o.sub)}</div>` : ''}${o.body ? `<div class="mg-tip-b">${Array.isArray(o.body) ? o.body.map((e) => `<p>${richText(e)}</p>`).join('') : o.html ? o.body : `<p>${richText(o.body)}</p>`}</div>` : ''}${o.extra || ''}${o.tags?.length ? `<div class="mg-tip-tags">${o.tags.map(([e, t]) => `<span class="mg-chip ${t || ''}">${escapeHtml(e)}</span>`).join('')}</div>` : ''}${o.foot ? `<div class="mg-tip-f">${richText(o.foot)}</div>` : ''}`;
}
function sa(o, e) {
  return (
    (o._tip = e),
    !o.hasAttribute('tabindex') &&
      !/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(o.tagName) &&
      o.setAttribute('tabindex', '0'),
    o
  );
}
function bw(o) {
  let e = elem('div.mg-tip', { role: 'tooltip', id: 'mg-tip' });
  o.append(e);
  let t = null,
    a = 0,
    n = 0,
    s = null,
    i = !1,
    r = -1e9;
  (addEventListener(
    'keydown',
    (b) => (b.key === 'Tab' || b.key.startsWith('Arrow') ? (r = performance.now()) : null),
    !0,
  ),
    addEventListener('pointerdown', () => (r = -1e9), !0));
  let l = (b) => {
    for (let f = b; f && f !== o; f = f.parentElement) if (f._tip || f.dataset?.tip) return f;
    return null;
  };
  function c(b) {
    let f = b._tip ?? b.dataset.tip;
    try {
      return A6(typeof f == 'function' ? f() : f);
    } catch (v) {
      return (console.warn('[interfaz] ficha', v), '');
    }
  }
  function d(b, f, v) {
    let x = b.getBoundingClientRect(),
      g = e.offsetWidth,
      y = e.offsetHeight,
      w = 10,
      k = f != null ? f + 16 : x.left + x.width / 2 - g / 2,
      T = v != null ? v + 20 : x.bottom + 8;
    (T + y > innerHeight - w && (T = (v != null ? v - 14 : x.top - 8) - y),
      T < w && (T = w),
      k + g > innerWidth - w && (k = f != null ? f - 16 - g : innerWidth - w - g),
      k < w && (k = w),
      (e.style.transform = `translate(${Math.round(k)}px, ${Math.round(T)}px)`));
  }
  function u(b, f, v) {
    if (!b.isConnected) return m();
    clearTimeout(h);
    let x = c(b);
    if (!x) return m();
    ((t = b),
      clearInterval(p),
      (p = setInterval(() => !t?.isConnected && m(), 400)),
      (e.innerHTML = x),
      (e.style.transform = 'translate(-9999px, 0)'),
      e.classList.add('on'),
      b.setAttribute('aria-describedby', 'mg-tip'),
      d(b, f, v));
  }
  let h = 0,
    p = 0;
  function m() {
    (clearTimeout(a),
      clearInterval(p),
      e.classList.remove('on'),
      t?.removeAttribute('aria-describedby'),
      (t = null),
      clearTimeout(h),
      (h = setTimeout(() => {
        e.classList.contains('on') || (e.style.transform = 'translate(-9999px, 0)');
      }, 160)));
  }
  (o.addEventListener('pointerover', (b) => {
    if (b.pointerType !== 'mouse') return;
    let f = l(b.target);
    if (f === t) return;
    if ((clearTimeout(a), !f)) return m();
    let { clientX: v, clientY: x } = b;
    a = setTimeout(() => u(f, v, x), t ? 40 : 260);
  }),
    o.addEventListener('pointermove', (b) => {
      (b.pointerType === 'mouse' && t && e.classList.contains('on') && d(t, b.clientX, b.clientY),
        s && Math.hypot(b.clientX - s[0], b.clientY - s[1]) > 12 && (clearTimeout(n), (s = null)));
    }),
    o.addEventListener('pointerout', (b) => {
      if (b.pointerType !== 'mouse') return;
      (b.relatedTarget && l(b.relatedTarget)) || m();
    }),
    o.addEventListener('pointerdown', (b) => {
      if (b.pointerType === 'mouse') {
        m();
        return;
      }
      let f = l(b.target);
      (t && f !== t && m(),
        f &&
          ((s = [b.clientX, b.clientY]),
          clearTimeout(n),
          (n = setTimeout(() => {
            ((i = !0), u(f), navigator.vibrate?.(8));
          }, 480))));
    }));
  let _ = () => {
    (clearTimeout(n), (s = null));
  };
  return (
    o.addEventListener('pointerup', _),
    o.addEventListener('pointercancel', _),
    o.addEventListener(
      'click',
      (b) => {
        i && ((i = !1), b.stopPropagation(), b.preventDefault());
      },
      !0,
    ),
    o.addEventListener('contextmenu', (b) => {
      l(b.target) && b.pointerType !== 'mouse' && b.preventDefault();
    }),
    o.addEventListener('focusin', (b) => {
      let f = l(b.target);
      f && b.target.matches(':focus-visible') && performance.now() - r < 800 ? u(f) : f || m();
    }),
    o.addEventListener('focusout', () => m()),
    addEventListener('scroll', m, !0),
    addEventListener('keydown', (b) => {
      b.key === 'Escape' && t && m();
    }),
    { show: u, hide: m, refresh: () => t && u(t) }
  );
}

export { bw, sa };
