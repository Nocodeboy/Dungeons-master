// ui/dice.js
// Reconstruido de publicado/juego.js (módulo __esm «eu»). Nombres locales aún minificados.

import { escapeHtml, elem, sleep, reducedMotion } from './dom.js';

function installDiceDefs() {
  if (document.getElementById('mg-dados-defs')) return;
  let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  ((svg.id = 'mg-dados-defs'),
    svg.setAttribute('width', '0'),
    svg.setAttribute('height', '0'),
    svg.setAttribute('aria-hidden', 'true'),
    (svg.style.position = 'absolute'),
    (svg.innerHTML = `<defs>
    <linearGradient id="mg-dado-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e7c4"/><stop offset=".55" stop-color="#dcc292"/><stop offset="1" stop-color="#a98a58"/></linearGradient>
    <linearGradient id="mg-dado-crit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3b8"/><stop offset=".5" stop-color="#f2c650"/><stop offset="1" stop-color="#b7862a"/></linearGradient>
    <linearGradient id="mg-dado-pifia" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c8584a"/><stop offset=".6" stop-color="#8e2a20"/><stop offset="1" stop-color="#5a1610"/></linearGradient>
  </defs>`),
    document.body.append(svg));
}
function makeDie(sides = 20, value = '', { size = '', title } = {}) {
  let shape = DIE_SHAPES[sides] || DIE_SHAPES[20],
    die = elem(`span.mg-die${size ? `.mg-die--${size}` : ''}`, {
      role: 'img',
      'aria-label': title || `d${sides}${value !== '' ? `: ${value}` : ''}`,
    });
  return (
    (die.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><polygon class="cara" points="${shape.cara}"/>${shape.facetas ? `<path class="faceta" d="${shape.facetas}"/>` : ''}<polygon class="brillo" points="${shape.cara.split(' ').slice(0, 2).join(' ')} 50,50"/></svg><b>${escapeHtml(value)}</b>`),
    (die.dataset.sides = sides),
    die
  );
}
async function rollDie(die, value, { ms = 900, crit, fumble } = {}) {
  let sides = Number(die.dataset.sides) || 20,
    face = die.querySelector('b');
  if ((die.classList.remove('crit', 'pifia', 'cae'), !reducedMotion())) {
    die.classList.add('rueda');
    let start = performance.now(),
      delay = 45;
    for (; performance.now() - start < ms;)
      ((face.textContent = 1 + Math.floor(Math.random() * sides)),
        await sleep(delay),
        (delay = Math.min(140, delay * 1.12)));
    die.classList.remove('rueda');
  }
  ((face.textContent = value),
    die.setAttribute('aria-label', `d${sides}: ${value}`),
    die.offsetWidth,
    die.classList.add('cae'),
    (crit ?? (sides === 20 && Number(value) === 20)) && die.classList.add('crit'),
    (fumble ?? (sides === 20 && Number(value) === 1)) && die.classList.add('pifia'),
    await sleep(reducedMotion() ? 0 : 380));
}
const DIE_SHAPES = {
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

export { makeDie, rollDie, installDiceDefs };
