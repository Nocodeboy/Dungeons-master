// ui/modal.js
// Marco de las pantallas: pila de capas (ScreenStack) con foco atrapado, Esc y Tab, cabecera estándar
// (screenFrame), pestañas y controles segmentados. Lo usan ui/index.js y todas las pantallas.
// Reconstruido de publicado/juego.js (módulo __esm «Pn»).

import { iconHtml, escapeHtml, elem, iconButton } from './dom.js';

/**
 * Monta en el panel de una pantalla la cabecera (icono, título, subtítulo, extra, cerrar), las pestañas,
 * el cuerpo y el pie. Devuelve {head, tabs, body, foot, title, sub, extra}.
 */
function screenFrame(
  screen,
  { title, sub = '', ic: icon = '', extra = null, closeLabel = 'Cerrar', noClose = !1 } = {},
) {
  let { el, close } = screen,
    head = elem('header.mg-screen-head');
  icon && head.insertAdjacentHTML('beforeend', iconHtml(icon, 'mg-head-ico'));
  let heading = elem('h2.mg-h2', title);
  ((heading.id = `t-${screen.name}-${Math.random().toString(36).slice(2, 7)}`),
    el.setAttribute('aria-labelledby', heading.id),
    head.append(heading));
  let subtitle = elem('span.mg-sub', sub);
  head.append(subtitle);
  let spacer = elem('span.mg-grow');
  (head.append(spacer),
    extra && head.append(extra),
    noClose ||
      head.append(
        iconButton('close', `${closeLabel} (Esc)`, {
          onclick: () => close(null),
          cls: 'mg-cerrar mg-ibtn--plain',
        }),
      ));
  let tabs = elem('div.mg-screen-tabs'),
    body = elem('div.mg-screen-body'),
    foot = elem('footer.mg-screen-foot');
  return (
    el.append(head, tabs, body, foot),
    (tabs.hidden = !0),
    (foot.hidden = !0),
    (el.style.gridTemplateRows = 'auto auto minmax(0, 1fr) auto'),
    [head, tabs, body, foot].forEach((row, index) => (row.style.gridRow = String(index + 1))),
    { head, tabs, body, foot, title: heading, sub: subtitle, extra: spacer }
  );
}
/** Barra de pestañas con flechas del teclado; `onChange(id)` al cambiar. El nodo tiene `.set(id)` y `.update(tabs)`. */
function makeTabs(tabs, active, onChange, { cls = '' } = {}) {
  let bar = elem(`div.mg-tabs${cls ? '.' + cls : ''}`, { role: 'tablist' }),
    render = () => {
      bar.innerHTML = '';
      for (let tab of tabs) {
        let button = elem('button.mg-tab', {
          role: 'tab',
          'aria-selected': String(tab.id === active),
          'data-id': tab.id,
          title: tab.title || null,
        });
        ((button.innerHTML = `${tab.icon ? iconHtml(tab.icon) : ''}${tab.html ?? `<span>${escapeHtml(tab.label)}</span>`}${tab.badge ? `<span class="mg-badge">${escapeHtml(tab.badge)}</span>` : ''}`),
          button.addEventListener('click', () => {
            active !== tab.id && ((active = tab.id), render(), onChange(tab.id));
          }),
          bar.append(button));
      }
    };
  return (
    render(),
    bar.addEventListener('keydown', (ev) => {
      if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
      let index = tabs.findIndex((tab) => tab.id === active),
        next = tabs[(index + (ev.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      ((active = next.id),
        render(),
        onChange(next.id),
        bar.querySelector(`[data-id="${CSS.escape(next.id)}"]`)?.focus(),
        ev.preventDefault());
    }),
    (bar.set = (id) => {
      ((active = id), render());
    }),
    (bar.update = (list) => {
      ((tabs = list), render());
    }),
    bar
  );
}
/** Control segmentado (botones con aria-pressed) para elegir uno de `options` ([[valor, texto]…]). */
function makeSegmented(options, current, onChange, { label = '' } = {}) {
  let group = elem('div.mg-seg', { role: 'group', 'aria-label': label || null }),
    render = () => {
      group.innerHTML = '';
      for (let [id, text] of options) {
        let button = elem('button', { 'aria-pressed': String(id === current) }, text);
        (button.addEventListener('click', () => {
          ((current = id), render(), onChange(id));
        }),
          group.append(button));
      }
    };
  return (render(), group);
}
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
/**
 * Pila de pantallas abiertas. open(name, build, opts) devuelve una promesa con el valor de close(); key(ev)
 * atiende Esc y Tab (foco atrapado); closeAll() las cierra todas.
 */
const ScreenStack = class {
  constructor(ui, game) {
    ((this.ui = ui), (this.game = game), (this.stack = []));
  }
  get top() {
    return this.stack[this.stack.length - 1] || null;
  }
  isOpen(name) {
    return this.stack.some((entry) => entry.name === name);
  }
  open(name, build, { modal = !1, full = !0, width, height, cls = '', auto = !1 } = {}) {
    let layer = elem(`div.mg-layer${full ? '.mg-full' : ''}`, { role: 'presentation', 'data-capa': name }),
      panel = elem(
        `section.mg-screen.mg-panel.mg-orn${modal ? '.mg-modal' : ''}${auto ? '.mg-screen--auto' : ''}`,
        {
          role: 'dialog',
          'aria-modal': 'true',
          tabindex: '-1',
          class: cls || null,
        },
      );
    (width && panel.style.setProperty('--ancho', width),
      height && panel.style.setProperty('--alto', height),
      layer.append(panel));
    let prevFocus = document.activeElement,
      settle,
      done = new Promise((resolve) => (settle = resolve)),
      entry = { name, layer, panel, prevFocus, hooks: {}, closed: !1 },
      close = (result = null) => {
        if (!entry.closed) {
          entry.closed = !0;
          try {
            entry.hooks.dispose?.();
          } catch (err) {
            console.error('[interfaz] cerrar', name, err);
          }
          ((this.stack = this.stack.filter((item) => item !== entry)),
            layer.classList.add('cierra'),
            setTimeout(() => layer.remove(), 170),
            this.game.bus?.emit('ui:close', { name }),
            prevFocus && document.contains(prevFocus) && prevFocus.focus?.({ preventScroll: !0 }),
            settle(result));
        }
      };
    ((entry.close = close),
      layer.addEventListener('pointerdown', (ev) => {
        ev.target === layer && modal && entry.hooks.dismissable !== !1 && close(null);
      }),
      this.stack.push(entry),
      this.ui.root.append(layer));
    try {
      entry.hooks = build({ el: panel, layer, close, name }) || {};
    } catch (err) {
      (console.error('[interfaz] pantalla', name, err),
        (panel.innerHTML = `<div class="mg-screen-body"><div class="mg-vacio">${iconHtml('info')}No se ha podido abrir esta pantalla.<br><small>${escapeHtml(err.message)}</small></div></div>`),
        panel.append(elem('div.mg-screen-foot', this.ui.button('Cerrar', { onclick: () => close(null) }))));
    }
    return (
      this.game.bus?.emit('ui:open', { name }),
      requestAnimationFrame(() => {
        (panel.querySelector('[autofocus]') || panel).focus?.({ preventScroll: !0 });
      }),
      done
    );
  }
  key(ev) {
    let top = this.top;
    if (!top) return !1;
    if (top.hooks.onKey && top.hooks.onKey(ev) === !0) return !0;
    if (ev.key === 'Escape') return (top.hooks.onEscape ? top.hooks.onEscape() : top.close(null), !0);
    if (ev.key === 'Tab') {
      let focusables = [...top.panel.querySelectorAll(FOCUSABLE)].filter(
        (node) => node.offsetParent !== null,
      );
      if (!focusables.length) return !1;
      let index = focusables.indexOf(document.activeElement);
      if (ev.shiftKey && index <= 0) return (focusables[focusables.length - 1].focus(), !0);
      if (!ev.shiftKey && index === focusables.length - 1) return (focusables[0].focus(), !0);
    }
    return !1;
  }
  closeAll() {
    for (let entry of [...this.stack].reverse()) entry.close(null);
  }
};

export { makeSegmented, ScreenStack, makeTabs, screenFrame };
