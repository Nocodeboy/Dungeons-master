// ui/travel-map.js
// Reconstruido de publicado/juego.js (módulo __esm «Lv»). Nombres locales aún minificados.

import datosMapaViaje from '../datos/mapa-viaje.json';
import { iconSvg, escapeHtml, elem } from './dom.js';

function JL(o) {
  let e = o?.R?.data?.('world');
  return e && e.places?.length ? e : datosMapaViaje;
}
function lM(o, e) {
  let t = e?.flags || {};
  return t[`place_${o.id}`]
    ? { open: !0 }
    : o.locked
      ? { open: !1, why: o.locked }
      : o.requires && !t[o.requires]
        ? { open: !1, why: o.why || 'Todav\xEDa no hay motivo para ir all\xED.' }
        : { open: !0 };
}
function ZL(o, e, t) {
  for (let a of o.roads || [])
    if ((a[0] === e && a[1] === t) || (a[0] === t && a[1] === e)) return Number(a[2]);
  return null;
}
function QL(o, e) {
  let t = e?.location?.level;
  if (!t) return null;
  let a = o.places.find((n) => (n.level || n.id) === t || n.id === t);
  return a ? a.id : t === 'tumulo' ? 'merrowick' : null;
}
function eD(o) {
  let e = o;
  return () => (e = (e * 16807) % 2147483647) / 2147483647;
}
function tD() {
  let o = eD(11),
    e = '#4a2e16',
    t = `<defs><radialGradient id="mg-borde" cx="50%" cy="50%" r="72%"><stop offset="62%" stop-color="#5a3a1a" stop-opacity="0"/><stop offset="92%" stop-color="#5a3a1a" stop-opacity=".35"/><stop offset="100%" stop-color="#3a2210" stop-opacity=".7"/></radialGradient>
    <filter id="mg-quemado" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="4"/><feDisplacementMap in="SourceGraphic" scale="26"/></filter></defs>`;
  ((t += `<rect x="0" y="0" width="${Do}" height="${ls}" fill="url(#mg-borde)"/>`),
    (t += `<rect x="6" y="6" width="${Do - 12}" height="${ls - 12}" fill="none" stroke="#2a1608" stroke-width="22" opacity=".55" filter="url(#mg-quemado)"/>`),
    (t += `<rect x="18" y="18" width="${Do - 36}" height="${ls - 36}" fill="none" stroke="${e}" stroke-width="3" opacity=".55"/>`),
    (t += `<rect x="30" y="30" width="${Do - 60}" height="${ls - 60}" fill="none" stroke="${e}" stroke-width="1.2" opacity=".45"/>`));
  let a = [
      [1480, 30],
      [1390, 230],
      [1330, 420],
      [1290, 640],
      [1050, 800],
      [900, 970],
    ],
    n = `M${a[0][0]},${a[0][1]}`;
  for (let l = 1; l < a.length; l++) {
    let [c, d] = a[l - 1],
      [u, h] = a[l];
    n += ` Q${c + (u - c) * 0.5 + (l % 2 ? 60 : -60)},${d + (h - d) * 0.5} ${u},${h}`;
  }
  ((t += `<path d="${n}" fill="none" stroke="#3f6a8a" stroke-width="16" stroke-linecap="round" opacity=".35"/>`),
    (t += `<path d="${n}" fill="none" stroke="#2f5674" stroke-width="5" stroke-linecap="round" opacity=".8"/>`),
    (t += '<text x="1355" y="520" transform="rotate(-72 1355 520)" class="rio">R\xEDo Kesh</text>'));
  let s = (l, c, d) =>
    `<path d="M${l},${c - 18 * d} L${l - 9 * d},${c + 4 * d} L${l + 9 * d},${c + 4 * d} Z" fill="#3e5a2a" opacity=".72"/><path d="M${l},${c + 4 * d} v${6 * d}" stroke="${e}" stroke-width="2" opacity=".6"/>`;
  for (let l = 0; l < 110; l++) t += s(800 + o() * 440, 170 + o() * 300, 0.8 + o() * 0.5);
  for (let l = 0; l < 40; l++) t += s(140 + o() * 330, 180 + o() * 220, 0.7 + o() * 0.4);
  for (let l = 0; l < 18; l++) {
    let c = 220 + o() * 640,
      d = 760 + o() * 150;
    t += `<path d="M${c - 34},${d} Q${c},${d - 34} ${c + 34},${d}" fill="none" stroke="${e}" stroke-width="2.5" opacity=".5"/>`;
  }
  for (let l = 0; l < 11; l++) {
    let c = 1120 + o() * 400,
      d = 90 + o() * 120,
      u = 0.8 + o() * 0.6;
    t += `<path d="M${c - 46 * u},${d + 26 * u} L${c},${d - 46 * u} L${c + 46 * u},${d + 26 * u}" fill="#d8c49a" stroke="${e}" stroke-width="3" opacity=".8"/><path d="M${c},${d - 46 * u} L${c + 12 * u},${d + 10 * u}" stroke="${e}" stroke-width="2" opacity=".5"/>`;
  }
  let i = 1430,
    r = 800;
  t += `<g opacity=".8"><circle cx="${i}" cy="${r}" r="58" fill="none" stroke="${e}" stroke-width="1.5"/><circle cx="${i}" cy="${r}" r="48" fill="none" stroke="${e}" stroke-width="1"/>`;
  for (let l = 0; l < 8; l++) {
    let c = (l * Math.PI) / 4 - Math.PI / 2,
      d = l % 2 ? 40 : 74,
      u = (h, p) => `${i + Math.cos(h) * p},${r + Math.sin(h) * p}`;
    t += `<path d="M${i},${r} L${u(c - 0.18, 14)} L${u(c, d)} Z" fill="${l % 2 ? '#8a6a44' : e}"/><path d="M${i},${r} L${u(c + 0.18, 14)} L${u(c, d)} Z" fill="${l % 2 ? '#c8ad7e' : '#8a5a2e'}"/>`;
  }
  return (
    (t += `<text x="${i}" y="${r - 84}" class="norte">N</text></g>`),
    (t += `<g opacity=".75"><path d="M90,930 h200 M90,922 v16 M190,926 v8 M290,922 v16" stroke="${e}" stroke-width="3"/><text x="190" y="912" class="escala">Un d\xEDa de camino</text></g>`),
    (t += '<text x="1500" y="955" class="nota">Aqu\xED hay trasgos</text>'),
    t
  );
}
function im(o, e, t, { from: a, selectable: n = !0, onSelect: s, onActivate: i } = {}) {
  let r = JL(o),
    l = e.store.cp,
    c = a || QL(r, l),
    d = null,
    u = elem('div.mg-map'),
    h = elem('div.mg-map-scroll', { style: 'position:absolute;inset:0;overflow:auto;scrollbar-width:none' }),
    p = elem('div.mg-map-inner.mg-parchment', { style: 'position:relative;width:100%;height:100%' });
  (h.append(p), u.append(h));
  let _ = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  (_.setAttribute('class', 'mapa'),
    _.setAttribute('viewBox', `0 0 ${Do} ${ls}`),
    _.setAttribute('preserveAspectRatio', 'xMidYMid meet'),
    _.setAttribute('role', 'img'),
    _.setAttribute('aria-label', r.title || 'Mapa'),
    p.append(_));
  let b = (z) => [z.pos[0] * Do, z.pos[1] * ls],
    f = Object.fromEntries(r.places.map((z) => [z.id, z])),
    v = (z, D) => {
      let [M, R] = b(z),
        [A, P] = b(D),
        I = (M + A) / 2,
        U = (R + P) / 2,
        j = -(P - R),
        X = A - M,
        J = Math.hypot(j, X) || 1,
        Z = 0.12 * Math.hypot(A - M, P - R);
      return { x0: M, y0: R, x1: A, y1: P, cx: I + (j / J) * Z, cy: U + (X / J) * Z };
    };
  function x() {
    let z = `<style>
      .rio{font:italic 600 30px Alegreya,Georgia,serif;fill:#2f5674;opacity:.75}
      .norte{font:700 34px Cinzel,Georgia,serif;fill:#4a2e16;text-anchor:middle}
      .escala{font:500 24px 'Alegreya SC',Georgia,serif;fill:#4a2e16;text-anchor:middle}
      .nota{font:italic 24px Alegreya,Georgia,serif;fill:#6b4a2c;text-anchor:end;opacity:.7}
      .lugar{font:700 30px Cinzel,Georgia,serif;fill:#2a170a;text-anchor:middle;paint-order:stroke;stroke:#ead9b4;stroke-width:6px}
      .lugar.bloq{fill:#6b5a44}
      .aqui{font:500 22px 'Alegreya SC',Georgia,serif;fill:#8a2316;text-anchor:middle;paint-order:stroke;stroke:#ead9b4;stroke-width:5px}
      .horas{font:600 22px Alegreya,Georgia,serif;fill:#8a2316;text-anchor:middle;paint-order:stroke;stroke:#ead9b4;stroke-width:5px}
      .pin{cursor:pointer;outline:none}
      .pin .halo{fill:#ead9b4;opacity:.0;transition:opacity .2s}
      .pin:hover .halo,.pin:focus-visible .halo,.pin.sel .halo{opacity:.85}
      .pin:focus-visible .halo{stroke:#8a2316;stroke-width:4}
    </style>`;
    z += tD();
    for (let D of r.roads || []) {
      let M = f[D[0]],
        R = f[D[1]];
      if (!M || !R) continue;
      let A = v(M, R),
        P = d && c && ((D[0] === c && D[1] === d) || (D[1] === c && D[0] === d));
      ((z += `<path d="M${A.x0},${A.y0} Q${A.cx},${A.cy} ${A.x1},${A.y1}" fill="none" stroke="${P ? '#8a2316' : '#5a3a1e'}" stroke-width="${P ? 7 : 4}" stroke-dasharray="${P ? '18 10' : '14 12'}" stroke-linecap="round" opacity="${P ? 0.95 : 0.6}"/>`),
        P &&
          (z += `<text x="${(A.x0 + 2 * A.cx + A.x1) / 4}" y="${(A.y0 + 2 * A.cy + A.y1) / 4 - 14}" class="horas">${D[2]} ${D[2] === 1 ? 'hora' : 'horas'}</text>`));
    }
    for (let D of r.places) {
      let [M, R] = b(D),
        A = lM(D, l),
        P = iconSvg(D.icon || 'map')
          .replace('<svg viewBox="0 0 512 512" aria-hidden="true" focusable="false">', '')
          .replace(/<\/svg>$/, '');
      z += `<g class="pin${D.id === d ? ' sel' : ''}" data-id="${escapeHtml(D.id)}" tabindex="0" role="button" aria-label="${escapeHtml(D.name)}${A.open ? '' : ' (cerrado)'}">
        <circle class="halo" cx="${M}" cy="${R}" r="62"/>
        <svg x="${M - 46}" y="${R - 50}" width="92" height="92" viewBox="0 0 512 512" style="color:${A.open ? (D.id === d ? '#8a2316' : '#3a2210') : '#8a7656'}">${P}</svg>
        <text x="${M}" y="${R + 80}" class="lugar${A.open ? '' : ' bloq'}">${escapeHtml(D.name)}</text>
        ${D.id === c ? `<text x="${M}" y="${R - 62}" class="aqui">Est\xE1is aqu\xED</text>` : ''}
      </g>`;
    }
    _.innerHTML = z;
    for (let D of _.querySelectorAll('.pin')) {
      let M = D.dataset.id;
      (D.addEventListener('click', () => g(M, !0)),
        D.addEventListener('dblclick', () => i?.(f[M])),
        D.addEventListener('keydown', (R) => {
          (R.key === 'Enter' || R.key === ' ') && (R.preventDefault(), d === M ? i?.(f[M]) : g(M, 'teclado'));
        }));
    }
    u.style.setProperty('--fondo', '');
  }
  function g(z, D) {
    let M = f[z];
    if (M) {
      if (!n && D) {
        ((d = z), x(), s?.(M, y(M)));
        return;
      }
      ((d = z),
        x(),
        D === 'teclado' && _.querySelector(`.pin[data-id="${CSS.escape(z)}"]`)?.focus({ preventScroll: !0 }),
        s?.(M, y(M)));
    }
  }
  function y(z) {
    let D = lM(z, l),
      M = c && c !== z.id ? ZL(r, c, z.id) : null;
    return { ...D, here: z.id === c, hours: M, level: z.level || z.id, spawn: z.spawn || 'entry' };
  }
  function w(z) {
    let D = f[c],
      M = f[d];
    if (!D || !M) return null;
    let R = v(D, M),
      A = 1 - z;
    return [A * A * R.x0 + 2 * A * z * R.cx + z * z * R.x1, A * A * R.y0 + 2 * A * z * R.cy + z * z * R.y1];
  }
  function k([z, D]) {
    let M = _.getBoundingClientRect(),
      R = u.getBoundingClientRect(),
      A = Math.min(M.width / Do, M.height / ls),
      P = M.left - R.left + (M.width - Do * A) / 2,
      I = M.top - R.top + (M.height - ls * A) / 2;
    return [P + z * A, I + D * A];
  }
  (x(), t.append(u));
  let T = () => {
      let z = u.clientWidth,
        D = u.clientHeight;
      if (!z || !D) return;
      let M = z / D < 1.15,
        R = M ? Math.round(D * (Do / ls)) : Math.min(z, Math.round(D * (Do / ls))),
        A = Math.round((R * ls) / Do);
      if (
        ((p.style.width = `${R}px`),
        (p.style.height = `${A}px`),
        (p.style.margin = M ? '0' : `${Math.max(0, Math.floor((D - A) / 2))}px auto 0`),
        M && c)
      ) {
        let [P] = b(f[c]);
        h.scrollLeft = (P / Do) * R - z / 2;
      }
    },
    E = typeof ResizeObserver == 'function' ? new ResizeObserver(T) : null;
  return (
    E?.observe(u),
    requestAnimationFrame(T),
    addEventListener('resize', T),
    {
      el: u,
      inner: p,
      world: r,
      here: c,
      select: g,
      info: y,
      routePoint: w,
      toPx: k,
      byId: f,
      dispose: () => {
        (E?.disconnect(), removeEventListener('resize', T));
      },
      get selected() {
        return d;
      },
    }
  );
}
const Do = 1600;
const ls = 1e3;

export { im };
