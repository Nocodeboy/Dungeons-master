// ui/dom.js
// Ayudantes del DOM para toda la interfaz: creación de nodos con «etiqueta.clase#id», botones, iconos SVG
// (icons.json), escapado y texto enriquecido, formatos (duración, fecha, modificadores) y preferencias.
// Lo usan casi todos los módulos de ui/ y las escenas menu, travel y ending.
// Reconstruido de publicado/juego.js (módulo __esm «ha»).

/** Carga icons.json una sola vez y rellena los iconos pintados antes de tenerlo. */
function loadIcons() {
  return (
    iconsPromise ||
      (iconsPromise = fetch(new URL('icons.json', document.baseURI))
        .then((res) => (res.ok ? res.json() : {}))
        .then((data) => {
          ((iconPaths = data || {}), (iconsReady = !0));
          for (let node of document.querySelectorAll('.mg-i[data-pend]'))
            ((node.innerHTML = iconSvg(node.dataset.pend)), node.removeAttribute('data-pend'));
          return iconPaths;
        })
        .catch(() => (iconPaths = {}))),
    iconsPromise
  );
}
/** SVG de un icono por su nombre (el de «magic» si no existe). */
function iconSvg(name) {
  return `<svg viewBox="0 0 512 512" aria-hidden="true" focusable="false">${iconPaths[name] || iconPaths.magic || ''}</svg>`;
}
/** HTML de un icono `<span class="mg-i">`; si aún no hay iconos queda pendiente (data-pend). */
function iconHtml(name, cls = '') {
  return iconsReady
    ? `<span class="mg-i ${cls}">${iconSvg(name)}</span>`
    : `<span class="mg-i ${cls}" data-pend="${name}"></span>`;
}
/** Escapa &, <, >, comillas y apóstrofo para insertar texto en HTML. */
function escapeHtml(text) {
  return String(text ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  );
}
/** Texto escapado con **negrita**, *cursiva*, párrafos (línea en blanco) y saltos de línea. */
function richText(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n{2,}/g, '</p><p class="mg-p">')
    .replace(/\n/g, '<br>');
}
/** Uno o varios textos como párrafos `<p class="mg-p">` (con richText). */
function paragraphsHtml(text) {
  return Array.isArray(text)
    ? text.map((para) => `<p class="mg-p">${richText(para)}</p>`).join('')
    : `<p class="mg-p">${richText(text)}</p>`;
}
/**
 * Crea un elemento: `elem('button.mg-btn#id', {onclick, html, text, class, dataset, style…}, ...hijos)`.
 * Los atributos on* se enganchan como oyentes; los hijos pueden ser nodos o texto.
 */
function elem(spec, attrs, ...children) {
  let match = /^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i.exec(spec) || [],
    node = document.createElement(match[1] || 'div');
  for (let part of (match[2] || '').match(/[.#][\w-]+/g) || [])
    part[0] === '.' ? node.classList.add(part.slice(1)) : (node.id = part.slice(1));
  attrs &&
    (typeof attrs != 'object' || attrs instanceof Node || Array.isArray(attrs)) &&
    (children.unshift(attrs), (attrs = null));
  for (let [attr, value] of Object.entries(attrs || {}))
    value == null ||
      value === !1 ||
      (attr.startsWith('on') && typeof value == 'function'
        ? node.addEventListener(attr.slice(2), value)
        : attr === 'html'
          ? (node.innerHTML = value)
          : attr === 'text'
            ? (node.textContent = value)
            : attr === 'class' || attr === 'className'
              ? (node.className += (node.className ? ' ' : '') + value)
              : attr === 'dataset'
                ? Object.assign(node.dataset, value)
                : attr === 'style' && typeof value == 'object'
                  ? Object.assign(node.style, value)
                  : value === !0
                    ? node.setAttribute(attr, '')
                    : node.setAttribute(attr, value));
  node.tagName === 'BUTTON' && !node.hasAttribute('type') && (node.type = 'button');
  for (let child of children.flat(1 / 0))
    child == null ||
      child === !1 ||
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
}
/** Botón `.mg-btn` con etiqueta, icono, variante, tamaño, atajo (key) y clases extra. */
function makeButton(
  label,
  { icon, variant = '', size = '', onclick, title, disabled, block, key, cls = '' } = {},
) {
  let button = elem(
    `button.mg-btn${variant ? `.mg-btn--${variant}` : ''}${size ? `.mg-btn--${size}` : ''}${block ? '.mg-btn--block' : ''}`,
    { onclick, title, disabled: !!disabled, class: cls || null },
  );
  return (
    (button.innerHTML = `${icon ? iconHtml(icon) : ''}<span>${escapeHtml(label)}</span>${key ? ` <span class="mg-key">${escapeHtml(key)}</span>` : ''}`),
    button
  );
}
/** Botón solo de icono `.mg-ibtn` con aria-label (y aria-pressed si se pasa `pressed`). */
function iconButton(icon, label, { onclick, pressed, plain, cls = '', title } = {}) {
  let button = elem(`button.mg-ibtn${plain ? '.mg-ibtn--plain' : ''}`, {
    onclick,
    'aria-label': label,
    title: title ?? label,
    class: cls || null,
  });
  return (
    pressed != null && button.setAttribute('aria-pressed', String(!!pressed)),
    (button.innerHTML = iconHtml(icon)),
    button
  );
}
/**
 * Retrato redondo `.mg-face`: la imagen si hay `src`; si no, icono e iniciales y, con `id`, un <img>
 * oculto que rellenará ui.setPortrait cuando llegue el retrato.
 */
function faceBadge(src, { name = '', ic: icon = 'person', cls = '', id = '' } = {}) {
  let face = elem(`span.mg-face${cls ? '.' + cls.split(' ').join('.') : ''}`),
    dataAttr = id ? ` data-retrato="${escapeHtml(id)}"` : '';
  return (
    src
      ? (face.innerHTML = `<img alt=""${dataAttr} src="${escapeHtml(src)}">`)
      : (face.innerHTML = `${id ? `<img alt=""${dataAttr} hidden>` : ''}${iconHtml(icon)}<span class="mg-ini">${escapeHtml(initials(name))}</span>`),
    face
  );
}
function initials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter((word) => word && /^[A-ZÁÉÍÓÚÑ]/.test(word))
    .slice(0, 2)
    .map((word) => word[0])
    .join('');
}
/** Modificador con signo: +2, −1 (signo menos tipográfico). */
function signed(value) {
  return ((value = Number(value) || 0), value >= 0 ? `+${value}` : `\u2212${Math.abs(value)}`);
}
/** «1 descanso» / «2 descansos»: el número con la forma singular o plural. */
function plural(count, one, many) {
  return `${count} ${count === 1 ? one : many}`;
}
/** Segundos de partida como «1 h 05 min» o «12 min». */
function formatDuration(seconds) {
  let minutes = Math.floor((Number(seconds) || 0) / 60),
    hours = Math.floor(minutes / 60);
  return hours ? `${hours} h ${String(minutes % 60).padStart(2, '0')} min` : `${minutes} min`;
}
/** Fecha y hora cortas en español (vacío si no es válida). */
function formatDate(date) {
  try {
    return new Date(date).toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
/** Inserta una hoja de estilo en <head> con ese id, una sola vez. */
function injectStyle(id, css) {
  if (document.getElementById(id)) return;
  let style = document.createElement('style');
  ((style.id = id), (style.textContent = css), document.head.append(style));
}
/** ¿Está el foco en un campo de texto? (para no disparar atajos al escribir). */
function isTyping() {
  let active = document.activeElement;
  return (
    !!active &&
    (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable) &&
    active.type !== 'range' &&
    active.type !== 'checkbox'
  );
}
let iconPaths = {};
let iconsReady = !1;
let iconsPromise = null;
/** Promesa que se resuelve pasados `ms` milisegundos. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/** ¿Hay que reducir animaciones? (preferencia del sistema o ajuste del juego). */
const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches ||
  document.documentElement.classList.contains('mg-sin-animaciones');
/** ¿Es táctil (impreciso) el puntero principal? */
const coarsePointer = () => matchMedia('(pointer: coarse)').matches;

export {
  faceBadge,
  injectStyle,
  formatDate,
  iconButton,
  paragraphsHtml,
  formatDuration,
  coarsePointer,
  elem,
  signed,
  escapeHtml,
  plural,
  isTyping,
  iconHtml,
  loadIcons,
  makeButton,
  reducedMotion,
  richText,
  sleep,
  iconSvg,
};
