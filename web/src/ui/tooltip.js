// ui/tooltip.js
// Fichas emergentes (tooltips) de toda la interfaz: setTip asocia la ficha a un nodo y createTooltip la
// enseña con ratón, pulsación larga o teclado. La instala ui/index.js (ui.tips, ui.tip).
// Reconstruido de publicado/juego.js (módulo __esm «ci»).

import { escapeHtml, richText, elem } from './dom.js';

function tipHtml(tip) {
  return tip == null
    ? ''
    : typeof tip == 'string'
      ? tip
      : `${tip.title ? `<div class="mg-tip-t">${escapeHtml(tip.title)}</div>` : ''}${tip.sub ? `<div class="mg-tip-s">${escapeHtml(tip.sub)}</div>` : ''}${tip.body ? `<div class="mg-tip-b">${Array.isArray(tip.body) ? tip.body.map((para) => `<p>${richText(para)}</p>`).join('') : tip.html ? tip.body : `<p>${richText(tip.body)}</p>`}</div>` : ''}${tip.extra || ''}${tip.tags?.length ? `<div class="mg-tip-tags">${tip.tags.map(([label, cls]) => `<span class="mg-chip ${cls || ''}">${escapeHtml(label)}</span>`).join('')}</div>` : ''}${tip.foot ? `<div class="mg-tip-f">${richText(tip.foot)}</div>` : ''}`;
}
/**
 * Asocia una ficha a un nodo: texto, objeto {title, sub, body, tags, foot, extra} o función que la
 * devuelve. Hace el nodo enfocable para el teclado.
 */
function setTip(node, tip) {
  return (
    (node._tip = tip),
    !node.hasAttribute('tabindex') &&
      !/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(node.tagName) &&
      node.setAttribute('tabindex', '0'),
    node
  );
}
/**
 * Instala las fichas sobre `root`: ratón (pasar por encima), táctil (mantener pulsado) y teclado
 * (foco). Devuelve {show, hide, refresh}.
 */
function createTooltip(root) {
  let box = elem('div.mg-tip', { role: 'tooltip', id: 'mg-tip' });
  root.append(box);
  let current = null,
    hoverTimer = 0,
    pressTimer = 0,
    pressAt = null,
    longPressed = !1,
    lastKeyNav = -1e9;
  (addEventListener(
    'keydown',
    (ev) => (ev.key === 'Tab' || ev.key.startsWith('Arrow') ? (lastKeyNav = performance.now()) : null),
    !0,
  ),
    addEventListener('pointerdown', () => (lastKeyNav = -1e9), !0));
  let tipTarget = (node) => {
    for (let el = node; el && el !== root; el = el.parentElement) if (el._tip || el.dataset?.tip) return el;
    return null;
  };
  function tipContent(target) {
    let tip = target._tip ?? target.dataset.tip;
    try {
      return tipHtml(typeof tip == 'function' ? tip() : tip);
    } catch (err) {
      return (console.warn('[interfaz] ficha', err), '');
    }
  }
  function place(target, mouseX, mouseY) {
    let rect = target.getBoundingClientRect(),
      width = box.offsetWidth,
      height = box.offsetHeight,
      margin = 10,
      left = mouseX != null ? mouseX + 16 : rect.left + rect.width / 2 - width / 2,
      top = mouseY != null ? mouseY + 20 : rect.bottom + 8;
    (top + height > innerHeight - margin && (top = (mouseY != null ? mouseY - 14 : rect.top - 8) - height),
      top < margin && (top = margin),
      left + width > innerWidth - margin &&
        (left = mouseX != null ? mouseX - 16 - width : innerWidth - margin - width),
      left < margin && (left = margin),
      (box.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`));
  }
  function show(target, mouseX, mouseY) {
    if (!target.isConnected) return hide();
    clearTimeout(hideTimer);
    let html = tipContent(target);
    if (!html) return hide();
    ((current = target),
      clearInterval(watchTimer),
      (watchTimer = setInterval(() => !current?.isConnected && hide(), 400)),
      (box.innerHTML = html),
      (box.style.transform = 'translate(-9999px, 0)'),
      box.classList.add('on'),
      target.setAttribute('aria-describedby', 'mg-tip'),
      place(target, mouseX, mouseY));
  }
  let hideTimer = 0,
    watchTimer = 0;
  function hide() {
    (clearTimeout(hoverTimer),
      clearInterval(watchTimer),
      box.classList.remove('on'),
      current?.removeAttribute('aria-describedby'),
      (current = null),
      clearTimeout(hideTimer),
      (hideTimer = setTimeout(() => {
        box.classList.contains('on') || (box.style.transform = 'translate(-9999px, 0)');
      }, 160)));
  }
  (root.addEventListener('pointerover', (ev) => {
    if (ev.pointerType !== 'mouse') return;
    let target = tipTarget(ev.target);
    if (target === current) return;
    if ((clearTimeout(hoverTimer), !target)) return hide();
    let { clientX, clientY } = ev;
    hoverTimer = setTimeout(() => show(target, clientX, clientY), current ? 40 : 260);
  }),
    root.addEventListener('pointermove', (ev) => {
      (ev.pointerType === 'mouse' &&
        current &&
        box.classList.contains('on') &&
        place(current, ev.clientX, ev.clientY),
        pressAt &&
          Math.hypot(ev.clientX - pressAt[0], ev.clientY - pressAt[1]) > 12 &&
          (clearTimeout(pressTimer), (pressAt = null)));
    }),
    root.addEventListener('pointerout', (ev) => {
      if (ev.pointerType !== 'mouse') return;
      (ev.relatedTarget && tipTarget(ev.relatedTarget)) || hide();
    }),
    root.addEventListener('pointerdown', (ev) => {
      if (ev.pointerType === 'mouse') {
        hide();
        return;
      }
      let target = tipTarget(ev.target);
      (current && target !== current && hide(),
        target &&
          ((pressAt = [ev.clientX, ev.clientY]),
          clearTimeout(pressTimer),
          (pressTimer = setTimeout(() => {
            ((longPressed = !0), show(target), navigator.vibrate?.(8));
          }, 480))));
    }));
  let cancelPress = () => {
    (clearTimeout(pressTimer), (pressAt = null));
  };
  return (
    root.addEventListener('pointerup', cancelPress),
    root.addEventListener('pointercancel', cancelPress),
    root.addEventListener(
      'click',
      (ev) => {
        longPressed && ((longPressed = !1), ev.stopPropagation(), ev.preventDefault());
      },
      !0,
    ),
    root.addEventListener('contextmenu', (ev) => {
      tipTarget(ev.target) && ev.pointerType !== 'mouse' && ev.preventDefault();
    }),
    root.addEventListener('focusin', (ev) => {
      let target = tipTarget(ev.target);
      target && ev.target.matches(':focus-visible') && performance.now() - lastKeyNav < 800
        ? show(target)
        : target || hide();
    }),
    root.addEventListener('focusout', () => hide()),
    addEventListener('scroll', hide, !0),
    addEventListener('keydown', (ev) => {
      ev.key === 'Escape' && current && hide();
    }),
    { show, hide, refresh: () => current && show(current) }
  );
}

export { createTooltip, setTip };
