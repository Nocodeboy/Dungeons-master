// ui/travel-map.js
// Reconstruido de publicado/juego.js (módulo __esm «Lv»). Nombres locales aún minificados.

import datosMapaViaje from '../datos/mapa-viaje.json';
import { iconSvg, escapeHtml, elem } from './dom.js';

function worldData(ui) {
  let world = ui?.R?.data?.('world');
  return world && world.places?.length ? world : datosMapaViaje;
}
function placeAccess(place, cp) {
  let flags = cp?.flags || {};
  return flags[`place_${place.id}`]
    ? { open: !0 }
    : place.locked
      ? { open: !1, why: place.locked }
      : place.requires && !flags[place.requires]
        ? { open: !1, why: place.why || 'Todav\xEDa no hay motivo para ir all\xED.' }
        : { open: !0 };
}
function roadHours(world, from, to) {
  for (let road of world.roads || [])
    if ((road[0] === from && road[1] === to) || (road[0] === to && road[1] === from)) return Number(road[2]);
  return null;
}
function currentPlace(world, cp) {
  let level = cp?.location?.level;
  if (!level) return null;
  let place = world.places.find(
    (candidate) => (candidate.level || candidate.id) === level || candidate.id === level,
  );
  return place ? place.id : level === 'tumulo' ? 'merrowick' : null;
}
function seededRandom(seed) {
  let state = seed;
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
}
function mapDecorSvg() {
  let rand = seededRandom(11),
    ink = '#4a2e16',
    svg = `<defs><radialGradient id="mg-borde" cx="50%" cy="50%" r="72%"><stop offset="62%" stop-color="#5a3a1a" stop-opacity="0"/><stop offset="92%" stop-color="#5a3a1a" stop-opacity=".35"/><stop offset="100%" stop-color="#3a2210" stop-opacity=".7"/></radialGradient>
    <filter id="mg-quemado" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="4"/><feDisplacementMap in="SourceGraphic" scale="26"/></filter></defs>`;
  ((svg += `<rect x="0" y="0" width="${MAP_W}" height="${MAP_H}" fill="url(#mg-borde)"/>`),
    (svg += `<rect x="6" y="6" width="${MAP_W - 12}" height="${MAP_H - 12}" fill="none" stroke="#2a1608" stroke-width="22" opacity=".55" filter="url(#mg-quemado)"/>`),
    (svg += `<rect x="18" y="18" width="${MAP_W - 36}" height="${MAP_H - 36}" fill="none" stroke="${ink}" stroke-width="3" opacity=".55"/>`),
    (svg += `<rect x="30" y="30" width="${MAP_W - 60}" height="${MAP_H - 60}" fill="none" stroke="${ink}" stroke-width="1.2" opacity=".45"/>`));
  let river = [
      [1480, 30],
      [1390, 230],
      [1330, 420],
      [1290, 640],
      [1050, 800],
      [900, 970],
    ],
    riverPath = `M${river[0][0]},${river[0][1]}`;
  for (let i = 1; i < river.length; i++) {
    let [x0, y0] = river[i - 1],
      [x1, y1] = river[i];
    riverPath += ` Q${x0 + (x1 - x0) * 0.5 + (i % 2 ? 60 : -60)},${y0 + (y1 - y0) * 0.5} ${x1},${y1}`;
  }
  ((svg += `<path d="${riverPath}" fill="none" stroke="#3f6a8a" stroke-width="16" stroke-linecap="round" opacity=".35"/>`),
    (svg += `<path d="${riverPath}" fill="none" stroke="#2f5674" stroke-width="5" stroke-linecap="round" opacity=".8"/>`),
    (svg += '<text x="1355" y="520" transform="rotate(-72 1355 520)" class="rio">R\xEDo Kesh</text>'));
  let tree = (x, y, scale) =>
    `<path d="M${x},${y - 18 * scale} L${x - 9 * scale},${y + 4 * scale} L${x + 9 * scale},${y + 4 * scale} Z" fill="#3e5a2a" opacity=".72"/><path d="M${x},${y + 4 * scale} v${6 * scale}" stroke="${ink}" stroke-width="2" opacity=".6"/>`;
  for (let i = 0; i < 110; i++) svg += tree(800 + rand() * 440, 170 + rand() * 300, 0.8 + rand() * 0.5);
  for (let i = 0; i < 40; i++) svg += tree(140 + rand() * 330, 180 + rand() * 220, 0.7 + rand() * 0.4);
  for (let i = 0; i < 18; i++) {
    let x = 220 + rand() * 640,
      y = 760 + rand() * 150;
    svg += `<path d="M${x - 34},${y} Q${x},${y - 34} ${x + 34},${y}" fill="none" stroke="${ink}" stroke-width="2.5" opacity=".5"/>`;
  }
  for (let i = 0; i < 11; i++) {
    let x = 1120 + rand() * 400,
      y = 90 + rand() * 120,
      scale = 0.8 + rand() * 0.6;
    svg += `<path d="M${x - 46 * scale},${y + 26 * scale} L${x},${y - 46 * scale} L${x + 46 * scale},${y + 26 * scale}" fill="#d8c49a" stroke="${ink}" stroke-width="3" opacity=".8"/><path d="M${x},${y - 46 * scale} L${x + 12 * scale},${y + 10 * scale}" stroke="${ink}" stroke-width="2" opacity=".5"/>`;
  }
  let roseX = 1430,
    roseY = 800;
  svg += `<g opacity=".8"><circle cx="${roseX}" cy="${roseY}" r="58" fill="none" stroke="${ink}" stroke-width="1.5"/><circle cx="${roseX}" cy="${roseY}" r="48" fill="none" stroke="${ink}" stroke-width="1"/>`;
  for (let i = 0; i < 8; i++) {
    let angle = (i * Math.PI) / 4 - Math.PI / 2,
      length = i % 2 ? 40 : 74,
      point = (dir, dist) => `${roseX + Math.cos(dir) * dist},${roseY + Math.sin(dir) * dist}`;
    svg += `<path d="M${roseX},${roseY} L${point(angle - 0.18, 14)} L${point(angle, length)} Z" fill="${i % 2 ? '#8a6a44' : ink}"/><path d="M${roseX},${roseY} L${point(angle + 0.18, 14)} L${point(angle, length)} Z" fill="${i % 2 ? '#c8ad7e' : '#8a5a2e'}"/>`;
  }
  return (
    (svg += `<text x="${roseX}" y="${roseY - 84}" class="norte">N</text></g>`),
    (svg += `<g opacity=".75"><path d="M90,930 h200 M90,922 v16 M190,926 v8 M290,922 v16" stroke="${ink}" stroke-width="3"/><text x="190" y="912" class="escala">Un d\xEDa de camino</text></g>`),
    (svg += '<text x="1500" y="955" class="nota">Aqu\xED hay trasgos</text>'),
    svg
  );
}
function createTravelMap(ui, game, container, { from, selectable = !0, onSelect, onActivate } = {}) {
  let world = worldData(ui),
    cp = game.store.cp,
    here = from || currentPlace(world, cp),
    selected = null,
    root = elem('div.mg-map'),
    scroller = elem('div.mg-map-scroll', {
      style: 'position:absolute;inset:0;overflow:auto;scrollbar-width:none',
    }),
    inner = elem('div.mg-map-inner.mg-parchment', { style: 'position:relative;width:100%;height:100%' });
  (scroller.append(inner), root.append(scroller));
  let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  (svg.setAttribute('class', 'mapa'),
    svg.setAttribute('viewBox', `0 0 ${MAP_W} ${MAP_H}`),
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet'),
    svg.setAttribute('role', 'img'),
    svg.setAttribute('aria-label', world.title || 'Mapa'),
    inner.append(svg));
  let toXY = (place) => [place.pos[0] * MAP_W, place.pos[1] * MAP_H],
    byId = Object.fromEntries(world.places.map((place) => [place.id, place])),
    curve = (from, to) => {
      let [x0, y0] = toXY(from),
        [x1, y1] = toXY(to),
        midX = (x0 + x1) / 2,
        midY = (y0 + y1) / 2,
        normX = -(y1 - y0),
        normY = x1 - x0,
        normLen = Math.hypot(normX, normY) || 1,
        bend = 0.12 * Math.hypot(x1 - x0, y1 - y0);
      return { x0, y0, x1, y1, cx: midX + (normX / normLen) * bend, cy: midY + (normY / normLen) * bend };
    };
  function draw() {
    let markup = `<style>
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
    markup += mapDecorSvg();
    for (let road of world.roads || []) {
      let start = byId[road[0]],
        end = byId[road[1]];
      if (!start || !end) continue;
      let path = curve(start, end),
        active =
          selected &&
          here &&
          ((road[0] === here && road[1] === selected) || (road[1] === here && road[0] === selected));
      ((markup += `<path d="M${path.x0},${path.y0} Q${path.cx},${path.cy} ${path.x1},${path.y1}" fill="none" stroke="${active ? '#8a2316' : '#5a3a1e'}" stroke-width="${active ? 7 : 4}" stroke-dasharray="${active ? '18 10' : '14 12'}" stroke-linecap="round" opacity="${active ? 0.95 : 0.6}"/>`),
        active &&
          (markup += `<text x="${(path.x0 + 2 * path.cx + path.x1) / 4}" y="${(path.y0 + 2 * path.cy + path.y1) / 4 - 14}" class="horas">${road[2]} ${road[2] === 1 ? 'hora' : 'horas'}</text>`));
    }
    for (let place of world.places) {
      let [x, y] = toXY(place),
        access = placeAccess(place, cp),
        icon = iconSvg(place.icon || 'map')
          .replace('<svg viewBox="0 0 512 512" aria-hidden="true" focusable="false">', '')
          .replace(/<\/svg>$/, '');
      markup += `<g class="pin${place.id === selected ? ' sel' : ''}" data-id="${escapeHtml(place.id)}" tabindex="0" role="button" aria-label="${escapeHtml(place.name)}${access.open ? '' : ' (cerrado)'}">
        <circle class="halo" cx="${x}" cy="${y}" r="62"/>
        <svg x="${x - 46}" y="${y - 50}" width="92" height="92" viewBox="0 0 512 512" style="color:${access.open ? (place.id === selected ? '#8a2316' : '#3a2210') : '#8a7656'}">${icon}</svg>
        <text x="${x}" y="${y + 80}" class="lugar${access.open ? '' : ' bloq'}">${escapeHtml(place.name)}</text>
        ${place.id === here ? `<text x="${x}" y="${y - 62}" class="aqui">Est\xE1is aqu\xED</text>` : ''}
      </g>`;
    }
    svg.innerHTML = markup;
    for (let pin of svg.querySelectorAll('.pin')) {
      let id = pin.dataset.id;
      (pin.addEventListener('click', () => select(id, !0)),
        pin.addEventListener('dblclick', () => onActivate?.(byId[id])),
        pin.addEventListener('keydown', (ev) => {
          (ev.key === 'Enter' || ev.key === ' ') &&
            (ev.preventDefault(), selected === id ? onActivate?.(byId[id]) : select(id, 'teclado'));
        }));
    }
    root.style.setProperty('--fondo', '');
  }
  function select(id, how) {
    let place = byId[id];
    if (place) {
      if (!selectable && how) {
        ((selected = id), draw(), onSelect?.(place, info(place)));
        return;
      }
      ((selected = id),
        draw(),
        how === 'teclado' &&
          svg.querySelector(`.pin[data-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: !0 }),
        onSelect?.(place, info(place)));
    }
  }
  function info(place) {
    let access = placeAccess(place, cp),
      hours = here && here !== place.id ? roadHours(world, here, place.id) : null;
    return {
      ...access,
      here: place.id === here,
      hours,
      level: place.level || place.id,
      spawn: place.spawn || 'entry',
    };
  }
  function routePoint(t) {
    let start = byId[here],
      end = byId[selected];
    if (!start || !end) return null;
    let path = curve(start, end),
      u = 1 - t;
    return [
      u * u * path.x0 + 2 * u * t * path.cx + t * t * path.x1,
      u * u * path.y0 + 2 * u * t * path.cy + t * t * path.y1,
    ];
  }
  function toPx([x, y]) {
    let svgRect = svg.getBoundingClientRect(),
      rootRect = root.getBoundingClientRect(),
      scale = Math.min(svgRect.width / MAP_W, svgRect.height / MAP_H),
      offsetX = svgRect.left - rootRect.left + (svgRect.width - MAP_W * scale) / 2,
      offsetY = svgRect.top - rootRect.top + (svgRect.height - MAP_H * scale) / 2;
    return [offsetX + x * scale, offsetY + y * scale];
  }
  (draw(), container.append(root));
  let fit = () => {
      let width = root.clientWidth,
        height = root.clientHeight;
      if (!width || !height) return;
      let narrow = width / height < 1.15,
        innerW = narrow
          ? Math.round(height * (MAP_W / MAP_H))
          : Math.min(width, Math.round(height * (MAP_W / MAP_H))),
        innerH = Math.round((innerW * MAP_H) / MAP_W);
      if (
        ((inner.style.width = `${innerW}px`),
        (inner.style.height = `${innerH}px`),
        (inner.style.margin = narrow ? '0' : `${Math.max(0, Math.floor((height - innerH) / 2))}px auto 0`),
        narrow && here)
      ) {
        let [hereX] = toXY(byId[here]);
        scroller.scrollLeft = (hereX / MAP_W) * innerW - width / 2;
      }
    },
    observer = typeof ResizeObserver == 'function' ? new ResizeObserver(fit) : null;
  return (
    observer?.observe(root),
    requestAnimationFrame(fit),
    addEventListener('resize', fit),
    {
      el: root,
      inner,
      world,
      here,
      select,
      info,
      routePoint,
      toPx,
      byId,
      dispose: () => {
        (observer?.disconnect(), removeEventListener('resize', fit));
      },
      get selected() {
        return selected;
      },
    }
  );
}
const MAP_W = 1600;
const MAP_H = 1e3;

export { createTravelMap };
