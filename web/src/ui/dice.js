// ui/dice.js
// Reconstruido de publicado/juego.js (módulo __esm «eu»). Nombres locales aún minificados.

import { escapeHtml, elem, sleep, reducedMotion } from './dom.js';

function yw() {
  if (document.getElementById('mg-dados-defs')) return;
  let o = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  ((o.id = 'mg-dados-defs'),
    o.setAttribute('width', '0'),
    o.setAttribute('height', '0'),
    o.setAttribute('aria-hidden', 'true'),
    (o.style.position = 'absolute'),
    (o.innerHTML = `<defs>
    <linearGradient id="mg-dado-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e7c4"/><stop offset=".55" stop-color="#dcc292"/><stop offset="1" stop-color="#a98a58"/></linearGradient>
    <linearGradient id="mg-dado-crit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3b8"/><stop offset=".5" stop-color="#f2c650"/><stop offset="1" stop-color="#b7862a"/></linearGradient>
    <linearGradient id="mg-dado-pifia" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c8584a"/><stop offset=".6" stop-color="#8e2a20"/><stop offset="1" stop-color="#5a1610"/></linearGradient>
  </defs>`),
    document.body.append(o));
}
function Wi(o = 20, e = '', { size: t = '', title: a } = {}) {
  let n = vw[o] || vw[20],
    s = elem(`span.mg-die${t ? `.mg-die--${t}` : ''}`, {
      role: 'img',
      'aria-label': a || `d${o}${e !== '' ? `: ${e}` : ''}`,
    });
  return (
    (s.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><polygon class="cara" points="${n.cara}"/>${n.facetas ? `<path class="faceta" d="${n.facetas}"/>` : ''}<polygon class="brillo" points="${n.cara.split(' ').slice(0, 2).join(' ')} 50,50"/></svg><b>${escapeHtml(e)}</b>`),
    (s.dataset.sides = o),
    s
  );
}
async function Xi(o, e, { ms: t = 900, crit: a, fumble: n } = {}) {
  let s = Number(o.dataset.sides) || 20,
    i = o.querySelector('b');
  if ((o.classList.remove('crit', 'pifia', 'cae'), !reducedMotion())) {
    o.classList.add('rueda');
    let r = performance.now(),
      l = 45;
    for (; performance.now() - r < t;)
      ((i.textContent = 1 + Math.floor(Math.random() * s)), await sleep(l), (l = Math.min(140, l * 1.12)));
    o.classList.remove('rueda');
  }
  ((i.textContent = e),
    o.setAttribute('aria-label', `d${s}: ${e}`),
    o.offsetWidth,
    o.classList.add('cae'),
    (a ?? (s === 20 && Number(e) === 20)) && o.classList.add('crit'),
    (n ?? (s === 20 && Number(e) === 1)) && o.classList.add('pifia'),
    await sleep(reducedMotion() ? 0 : 380));
}
const vw = {
  4: { cara: '50,6 95,88 5,88', facetas: '' },
  6: { cara: '14,10 86,10 92,16 92,84 86,90 14,90 8,84 8,16', facetas: 'M20,20 L80,20 L80,80 L20,80 Z' },
  8: {
    cara: '50,3 95,50 50,97 5,50',
    facetas: 'M5,50 L95,50 M50,3 L28,50 M50,3 L72,50 M50,97 L28,50 M50,97 L72,50',
  },
  10: {
    cara: '50,3 94,40 82,82 50,97 18,82 6,40',
    facetas: 'M50,3 L30,58 L50,72 L70,58 Z M6,40 L30,58 M94,40 L70,58 M50,72 L50,97',
  },
  12: {
    cara: '50,3 95,36 78,92 22,92 5,36',
    facetas:
      'M50,20 L77,40 L67,74 L33,74 L23,40 Z M50,3 L50,20 M95,36 L77,40 M78,92 L67,74 M22,92 L33,74 M5,36 L23,40',
  },
  20: {
    cara: '50,3 93,27 93,73 50,97 7,73 7,27',
    facetas:
      'M50,22 L78,68 L22,68 Z M50,22 L50,3 M50,22 L93,27 M50,22 L7,27 M78,68 L93,27 M78,68 L93,73 M78,68 L50,97 M22,68 L7,27 M22,68 L7,73 M22,68 L50,97',
  },
};

export { Wi, Xi, yw };
