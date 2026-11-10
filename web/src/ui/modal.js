// ui/modal.js
// Reconstruido de publicado/juego.js (módulo __esm «Pn»). Nombres locales aún minificados.

import { iconHtml, escapeHtml, elem, Qd } from './dom.js';

function screenFrame(
  o,
  { title: e, sub: t = '', ic: a = '', extra: n = null, closeLabel: s = 'Cerrar', noClose: i = !1 } = {},
) {
  let { el: r, close: l } = o,
    c = elem('header.mg-screen-head');
  a && c.insertAdjacentHTML('beforeend', iconHtml(a, 'mg-head-ico'));
  let d = elem('h2.mg-h2', e);
  ((d.id = `t-${o.name}-${Math.random().toString(36).slice(2, 7)}`),
    r.setAttribute('aria-labelledby', d.id),
    c.append(d));
  let u = elem('span.mg-sub', t);
  c.append(u);
  let h = elem('span.mg-grow');
  (c.append(h),
    n && c.append(n),
    i || c.append(Qd('close', `${s} (Esc)`, { onclick: () => l(null), cls: 'mg-cerrar mg-ibtn--plain' })));
  let p = elem('div.mg-screen-tabs'),
    m = elem('div.mg-screen-body'),
    _ = elem('footer.mg-screen-foot');
  return (
    r.append(c, p, m, _),
    (p.hidden = !0),
    (_.hidden = !0),
    (r.style.gridTemplateRows = 'auto auto minmax(0, 1fr) auto'),
    [c, p, m, _].forEach((b, f) => (b.style.gridRow = String(f + 1))),
    { head: c, tabs: p, body: m, foot: _, title: d, sub: u, extra: h }
  );
}
function es(o, e, t, { cls: a = '' } = {}) {
  let n = elem(`div.mg-tabs${a ? '.' + a : ''}`, { role: 'tablist' }),
    s = () => {
      n.innerHTML = '';
      for (let i of o) {
        let r = elem('button.mg-tab', {
          role: 'tab',
          'aria-selected': String(i.id === e),
          'data-id': i.id,
          title: i.title || null,
        });
        ((r.innerHTML = `${i.icon ? iconHtml(i.icon) : ''}${i.html ?? `<span>${escapeHtml(i.label)}</span>`}${i.badge ? `<span class="mg-badge">${escapeHtml(i.badge)}</span>` : ''}`),
          r.addEventListener('click', () => {
            e !== i.id && ((e = i.id), s(), t(i.id));
          }),
          n.append(r));
      }
    };
  return (
    s(),
    n.addEventListener('keydown', (i) => {
      if (i.key !== 'ArrowRight' && i.key !== 'ArrowLeft') return;
      let r = o.findIndex((c) => c.id === e),
        l = o[(r + (i.key === 'ArrowRight' ? 1 : o.length - 1)) % o.length];
      ((e = l.id),
        s(),
        t(l.id),
        n.querySelector(`[data-id="${CSS.escape(l.id)}"]`)?.focus(),
        i.preventDefault());
    }),
    (n.set = (i) => {
      ((e = i), s());
    }),
    (n.update = (i) => {
      ((o = i), s());
    }),
    n
  );
}
function Mf(o, e, t, { label: a = '' } = {}) {
  let n = elem('div.mg-seg', { role: 'group', 'aria-label': a || null }),
    s = () => {
      n.innerHTML = '';
      for (let [i, r] of o) {
        let l = elem('button', { 'aria-pressed': String(i === e) }, r);
        (l.addEventListener('click', () => {
          ((e = i), s(), t(i));
        }),
          n.append(l));
      }
    };
  return (s(), n);
}
const k6 =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const Tf = class {
  constructor(e, t) {
    ((this.ui = e), (this.game = t), (this.stack = []));
  }
  get top() {
    return this.stack[this.stack.length - 1] || null;
  }
  isOpen(e) {
    return this.stack.some((t) => t.name === e);
  }
  open(e, t, { modal: a = !1, full: n = !0, width: s, height: i, cls: r = '', auto: l = !1 } = {}) {
    let c = elem(`div.mg-layer${n ? '.mg-full' : ''}`, { role: 'presentation', 'data-capa': e }),
      d = elem(`section.mg-screen.mg-panel.mg-orn${a ? '.mg-modal' : ''}${l ? '.mg-screen--auto' : ''}`, {
        role: 'dialog',
        'aria-modal': 'true',
        tabindex: '-1',
        class: r || null,
      });
    (s && d.style.setProperty('--ancho', s), i && d.style.setProperty('--alto', i), c.append(d));
    let u = document.activeElement,
      h,
      p = new Promise((b) => (h = b)),
      m = { name: e, layer: c, panel: d, prevFocus: u, hooks: {}, closed: !1 },
      _ = (b = null) => {
        if (!m.closed) {
          m.closed = !0;
          try {
            m.hooks.dispose?.();
          } catch (f) {
            console.error('[interfaz] cerrar', e, f);
          }
          ((this.stack = this.stack.filter((f) => f !== m)),
            c.classList.add('cierra'),
            setTimeout(() => c.remove(), 170),
            this.game.bus?.emit('ui:close', { name: e }),
            u && document.contains(u) && u.focus?.({ preventScroll: !0 }),
            h(b));
        }
      };
    ((m.close = _),
      c.addEventListener('pointerdown', (b) => {
        b.target === c && a && m.hooks.dismissable !== !1 && _(null);
      }),
      this.stack.push(m),
      this.ui.root.append(c));
    try {
      m.hooks = t({ el: d, layer: c, close: _, name: e }) || {};
    } catch (b) {
      (console.error('[interfaz] pantalla', e, b),
        (d.innerHTML = `<div class="mg-screen-body"><div class="mg-vacio">${iconHtml('info')}No se ha podido abrir esta pantalla.<br><small>${escapeHtml(b.message)}</small></div></div>`),
        d.append(elem('div.mg-screen-foot', this.ui.button('Cerrar', { onclick: () => _(null) }))));
    }
    return (
      this.game.bus?.emit('ui:open', { name: e }),
      requestAnimationFrame(() => {
        (d.querySelector('[autofocus]') || d).focus?.({ preventScroll: !0 });
      }),
      p
    );
  }
  key(e) {
    let t = this.top;
    if (!t) return !1;
    if (t.hooks.onKey && t.hooks.onKey(e) === !0) return !0;
    if (e.key === 'Escape') return (t.hooks.onEscape ? t.hooks.onEscape() : t.close(null), !0);
    if (e.key === 'Tab') {
      let a = [...t.panel.querySelectorAll(k6)].filter((s) => s.offsetParent !== null);
      if (!a.length) return !1;
      let n = a.indexOf(document.activeElement);
      if (e.shiftKey && n <= 0) return (a[a.length - 1].focus(), !0);
      if (!e.shiftKey && n === a.length - 1) return (a[0].focus(), !0);
    }
    return !1;
  }
  closeAll() {
    for (let e of [...this.stack].reverse()) e.close(null);
  }
};

export { Mf, Tf, es, screenFrame };
