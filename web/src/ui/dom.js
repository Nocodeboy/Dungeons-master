// ui/dom.js
// Reconstruido de publicado/juego.js (módulo __esm «ha»). Nombres locales aún minificados.

function loadIcons() {
  return (
    Pb ||
      (Pb = fetch(new URL('icons.json', document.baseURI))
        .then((o) => (o.ok ? o.json() : {}))
        .then((o) => {
          ((Zd = o || {}), (hw = !0));
          for (let e of document.querySelectorAll('.mg-i[data-pend]'))
            ((e.innerHTML = wf(e.dataset.pend)), e.removeAttribute('data-pend'));
          return Zd;
        })
        .catch(() => (Zd = {}))),
    Pb
  );
}
function wf(o) {
  return `<svg viewBox="0 0 512 512" aria-hidden="true" focusable="false">${Zd[o] || Zd.magic || ''}</svg>`;
}
function iconHtml(o, e = '') {
  return hw ? `<span class="mg-i ${e}">${wf(o)}</span>` : `<span class="mg-i ${e}" data-pend="${o}"></span>`;
}
function escapeHtml(o) {
  return String(o ?? '').replace(
    /[&<>"']/g,
    (e) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[e],
  );
}
function richText(o) {
  return escapeHtml(o)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n{2,}/g, '</p><p class="mg-p">')
    .replace(/\n/g, '<br>');
}
function Xl(o) {
  return Array.isArray(o)
    ? o.map((e) => `<p class="mg-p">${richText(e)}</p>`).join('')
    : `<p class="mg-p">${richText(o)}</p>`;
}
function elem(o, e, ...t) {
  let a = /^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i.exec(o) || [],
    n = document.createElement(a[1] || 'div');
  for (let s of (a[2] || '').match(/[.#][\w-]+/g) || [])
    s[0] === '.' ? n.classList.add(s.slice(1)) : (n.id = s.slice(1));
  e && (typeof e != 'object' || e instanceof Node || Array.isArray(e)) && (t.unshift(e), (e = null));
  for (let [s, i] of Object.entries(e || {}))
    i == null ||
      i === !1 ||
      (s.startsWith('on') && typeof i == 'function'
        ? n.addEventListener(s.slice(2), i)
        : s === 'html'
          ? (n.innerHTML = i)
          : s === 'text'
            ? (n.textContent = i)
            : s === 'class' || s === 'className'
              ? (n.className += (n.className ? ' ' : '') + i)
              : s === 'dataset'
                ? Object.assign(n.dataset, i)
                : s === 'style' && typeof i == 'object'
                  ? Object.assign(n.style, i)
                  : i === !0
                    ? n.setAttribute(s, '')
                    : n.setAttribute(s, i));
  n.tagName === 'BUTTON' && !n.hasAttribute('type') && (n.type = 'button');
  for (let s of t.flat(1 / 0))
    s == null || s === !1 || n.append(s instanceof Node ? s : document.createTextNode(String(s)));
  return n;
}
function makeButton(
  o,
  {
    icon: e,
    variant: t = '',
    size: a = '',
    onclick: n,
    title: s,
    disabled: i,
    block: r,
    key: l,
    cls: c = '',
  } = {},
) {
  let d = elem(
    `button.mg-btn${t ? `.mg-btn--${t}` : ''}${a ? `.mg-btn--${a}` : ''}${r ? '.mg-btn--block' : ''}`,
    { onclick: n, title: s, disabled: !!i, class: c || null },
  );
  return (
    (d.innerHTML = `${e ? iconHtml(e) : ''}<span>${escapeHtml(o)}</span>${l ? ` <span class="mg-key">${escapeHtml(l)}</span>` : ''}`),
    d
  );
}
function Qd(o, e, { onclick: t, pressed: a, plain: n, cls: s = '', title: i } = {}) {
  let r = elem(`button.mg-ibtn${n ? '.mg-ibtn--plain' : ''}`, {
    onclick: t,
    'aria-label': e,
    title: i ?? e,
    class: s || null,
  });
  return (a != null && r.setAttribute('aria-pressed', String(!!a)), (r.innerHTML = iconHtml(o)), r);
}
function Cn(o, { name: e = '', ic: t = 'person', cls: a = '', id: n = '' } = {}) {
  let s = elem(`span.mg-face${a ? '.' + a.split(' ').join('.') : ''}`),
    i = n ? ` data-retrato="${escapeHtml(n)}"` : '';
  return (
    o
      ? (s.innerHTML = `<img alt=""${i} src="${escapeHtml(o)}">`)
      : (s.innerHTML = `${n ? `<img alt=""${i} hidden>` : ''}${iconHtml(t)}<span class="mg-ini">${escapeHtml(S6(e))}</span>`),
    s
  );
}
function S6(o) {
  return String(o || '')
    .split(/\s+/)
    .filter((e) => e && /^[A-ZÁÉÍÓÚÑ]/.test(e))
    .slice(0, 2)
    .map((e) => e[0])
    .join('');
}
function en(o) {
  return ((o = Number(o) || 0), o >= 0 ? `+${o}` : `\u2212${Math.abs(o)}`);
}
function fw(o, e, t) {
  return `${o} ${o === 1 ? e : t}`;
}
function Yl(o) {
  let e = Math.floor((Number(o) || 0) / 60),
    t = Math.floor(e / 60);
  return t ? `${t} h ${String(e % 60).padStart(2, '0')} min` : `${e} min`;
}
function Kl(o) {
  try {
    return new Date(o).toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
function Jl(o, e) {
  if (document.getElementById(o)) return;
  let t = document.createElement('style');
  ((t.id = o), (t.textContent = e), document.head.append(t));
}
function gw() {
  let o = document.activeElement;
  return (
    !!o &&
    (o.tagName === 'INPUT' || o.tagName === 'TEXTAREA' || o.isContentEditable) &&
    o.type !== 'range' &&
    o.type !== 'checkbox'
  );
}
let Zd = {};
let hw = !1;
let Pb = null;
const sleep = (o) => new Promise((e) => setTimeout(e, o));
const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches ||
  document.documentElement.classList.contains('mg-sin-animaciones');
const coarsePointer = () => matchMedia('(pointer: coarse)').matches;

export {
  Cn,
  Jl,
  Kl,
  Qd,
  Xl,
  Yl,
  coarsePointer,
  elem,
  en,
  escapeHtml,
  fw,
  gw,
  iconHtml,
  loadIcons,
  makeButton,
  reducedMotion,
  richText,
  sleep,
  wf,
};
