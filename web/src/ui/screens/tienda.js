// ui/screens/tienda.js
// Reconstruido de publicado/juego.js (módulo __esm «IT»). Nombres locales aún minificados.

import { iconHtml, escapeHtml, elem, makeButton, faceBadge } from '../dom.js';
import { screenFrame, es } from '../modal.js';
import { sa } from '../tooltip.js';
import { mi, Zi, Gr } from '../items.js';
import { as } from '../labels.js';

function opcionesTienda() {
  return { width: '76rem', height: '46rem' };
}
function pantallaTienda(o, e, t, a) {
  let n = t.R,
    s = () => a.store.cp,
    i = e.merchant || 'peddler',
    r = null,
    l = null,
    c = 1,
    d = 'comprar',
    u = e.who && s()?.party.includes(e.who) ? e.who : '',
    h = screenFrame(o, { title: 'Tienda', ic: 'shop' }),
    p = elem('span.mg-gold');
  h.head.insertBefore(p, h.head.querySelector('.mg-cerrar'));
  let m = es(
      [
        { id: 'comprar', label: 'Comprar', icon: 'coins' },
        { id: 'detalle', label: 'Detalle', icon: 'info' },
        { id: 'vender', label: 'Vender', icon: 'scales' },
      ],
      d,
      (M) => {
        ((d = M), z());
      },
      { cls: 'mg-panes-tabs' },
    ),
    _ = elem('div.mg-shop'),
    b = elem('section.pane.mg-col', { 'data-pane': 'comprar' }),
    f = elem('section.pane.mg-shop-detail.mg-col', { 'data-pane': 'detalle' }),
    v = elem('section.pane.mg-col', { 'data-pane': 'vender' });
  (_.append(b, f, v),
    (h.body.style.gridTemplateRows = 'auto minmax(0, 1fr)'),
    (m.style.gridRow = '1'),
    (_.style.gridRow = '2'),
    h.body.append(m, _));
  function x() {
    let M = n.shop(i);
    return !M || M.error ? M?.error || 'sin respuesta' : ((r = M), null);
  }
  let g = (M) => String(s()?.members?.[M]?.name || M).split(' ')[0];
  function y(M, R, A) {
    let P = elem(`button.mg-shop-row${R === 'buy' && M.can_afford === !1 ? '.caro' : ''}`, {
        'aria-pressed': String(l?.side === R && l.i === A),
      }),
      I = mi(M),
      U = R === 'buy' ? (M.unlimited || M.n < 0 ? '' : `${M.n} en venta`) : M.n > 1 ? `\xD7${M.n}` : '';
    return (
      (P.innerHTML = `${iconHtml(Zi(M))}<span style="min-width:0"><b class="${I}">${escapeHtml(M.name)}</b><small>${escapeHtml([as[M.kind] || '', U].filter(Boolean).join(' \xB7 '))}</small></span><span class="precio">${escapeHtml(M.price)}${iconHtml('coins')}</span>`),
      sa(P, Gr(t, M)),
      P.addEventListener('click', () => {
        ((l = { side: R, i: A }),
          (c = 1),
          matchMedia('(max-width: 900px)').matches && (m.set('detalle'), (d = 'detalle')),
          w());
      }),
      P
    );
  }
  function w() {
    ((p.innerHTML = `${iconHtml('coins')}${escapeHtml(s()?.gold ?? r?.gold ?? 0)}<small>po</small>`),
      (h.title.textContent = r?.name || 'Tienda'),
      (b.innerHTML = ''),
      b.append(elem('h3.mg-sec', 'Se vende')));
    let M = elem('div.mg-shop-list.mg-scroll', { style: 'overflow-y:auto;min-height:0' });
    ((r?.stock || []).forEach((P, I) => M.append(y(P, 'buy', I))),
      (r?.stock || []).length ||
        (M.innerHTML = `<div class="mg-vacio">${iconHtml('shop')}No le queda nada que vender.</div>`),
      b.append(M),
      (b.style.gridTemplateRows = 'auto minmax(0, 1fr)'),
      (v.innerHTML = ''),
      v.append(elem('h3.mg-sec', 'Lo que pod\xE9is vender')));
    let R = elem('div.mg-shop-list.mg-scroll', { style: 'overflow-y:auto;min-height:0' }),
      A = null;
    ((r?.buys || []).forEach((P, I) => {
      (P.who !== A && ((A = P.who), R.append(elem('div.mg-shop-who', g(P.who)))), R.append(y(P, 'sell', I)));
    }),
      (r?.buys || []).length ||
        (R.innerHTML = `<div class="mg-vacio">${iconHtml('scales')}No llev\xE1is nada que le interese.</div>`),
      v.append(R),
      (v.style.gridTemplateRows = 'auto minmax(0, 1fr)'),
      k(),
      z());
  }
  function k() {
    f.innerHTML = '';
    let M = elem('div.mg-merchant'),
      R = (r?.buys_kinds || []).some((K) => K === 'weapon' || K === 'armor'),
      A = r?.npc || e.npc || null;
    (M.append(faceBadge(t.portrait(A), { name: '', ic: R ? 'hammer' : 'shop', id: A })),
      M.append(
        elem(
          'div',
          elem('b.mg-h3', r?.name || ''),
          elem(
            'div.mg-dim.mg-small',
            'Compra: ' + (r?.buys_kinds || []).map((K) => (as[K] || K).toLowerCase()).join(', '),
          ),
        ),
      ),
      f.append(M));
    let P = elem('div.mg-inv-detail.mg-inset.mg-scroll', { style: 'min-height:0;overflow-y:auto' });
    (f.append(P), (f.style.gridTemplateRows = 'auto minmax(0, 1fr)'));
    let I = l ? (l.side === 'buy' ? r?.stock : r?.buys)?.[l.i] : null;
    if (!I) {
      (P.append(
        elem('p.mg-p', { style: 'font-style:italic;color:var(--pergamino-2)' }, EL[i] || 'Echad un vistazo.'),
      ),
        P.append(elem('p.mg-dim.mg-small', 'Elige algo de la lista para verlo de cerca.')));
      return;
    }
    let U = n.call('item_info', { id: I.id, unid: !!I.unid }),
      j = U && !U.error ? U : {};
    (P.append(elem(`div.mg-item-name.${mi(I) || 'mg-r-comun'}`, I.name)),
      (j.rarity_name || as[j.kind]) &&
        P.append(elem('div.mg-item-kind', [as[j.kind], j.rarity_name].filter(Boolean).join(' \xB7 '))),
      (j.props || []).length &&
        P.append(elem('div.mg-item-props', ...j.props.map((K) => elem('span.mg-chip', K)))),
      P.append(
        elem(
          'div.mg-item-desc',
          ...(j.lines?.length ? j.lines : [j.desc || I.desc || ''])
            .filter(Boolean)
            .map((K) => elem('p.mg-p', K)),
        ),
      ));
    let X = l.side === 'buy' ? (I.n < 0 || I.unlimited ? 20 : I.n) : I.where === 'stack' ? I.n : 1;
    c = Math.max(1, Math.min(c, X));
    let J = I.price * c,
      Z = elem('div.mg-item-acts', { style: 'align-items:center' });
    if (X > 1) {
      let K = elem('span.mg-qty');
      (K.append(
        makeButton('\u2212', { size: 'sm', disabled: c <= 1, onclick: () => ((c -= 1), k()) }),
        elem('b.mg-num', String(c)),
        makeButton('+', { size: 'sm', disabled: c >= X, onclick: () => ((c += 1), k()) }),
      ),
        Z.append(K));
    }
    if (l.side === 'buy') {
      let K = s()?.party || [],
        ve = elem('select', { 'aria-label': 'Para qui\xE9n' });
      ((ve.innerHTML = `<option value="">Al que mejor le venga</option>${K.map((ue) => `<option value="${escapeHtml(ue)}">${escapeHtml(g(ue))}</option>`).join('')}`),
        (ve.value = u),
        ve.addEventListener('change', () => (u = ve.value)),
        Z.append(elem('label.mg-who', 'Para: ', ve)));
      let ge = (s()?.gold ?? 0) >= J;
      (Z.append(
        makeButton(`Comprar \xB7 ${J} po`, {
          icon: 'coins',
          variant: 'primary',
          disabled: !ge,
          onclick: () => T(I),
        }),
      ),
        ge || P.append(elem('p.mg-mal.mg-small', 'No ten\xE9is oro suficiente.')));
    } else
      Z.append(
        makeButton(`Vender \xB7 ${J} po`, { icon: 'scales', variant: 'primary', onclick: () => E(I) }),
      );
    P.append(Z);
  }
  function T(M) {
    let R = n.buy(i, M.id, c, u || void 0);
    if (!R || R.error || R.ok === !1)
      return t.toast(R?.reason || R?.error || 'No se ha podido comprar.', 'mal');
    (t.toast(R.text || `Comprado: ${M.name}.`, 'botin'),
      a.bus?.emit('shop:buy', { merchant: i, item: M.id, n: c, who: R.who || u }),
      a.bus?.emit('gold', { delta: -(M.price * c) }),
      S());
  }
  function E(M) {
    let R = n.sell(i, M.who, M.where === 'pack' ? { idx: M.idx } : M.id, c);
    if (!R || R.error || R.ok === !1)
      return t.toast(R?.reason || R?.error || 'No se ha podido vender.', 'mal');
    (t.toast(R.text || `Vendido: ${M.name}.`, 'botin'),
      a.bus?.emit('shop:sell', { merchant: i, item: M.id, n: c, who: M.who }),
      a.bus?.emit('gold', { delta: R.price ?? M.price * c }),
      S());
  }
  function S() {
    let M = l?.side;
    ((l = null),
      (c = 1),
      x(),
      w(),
      M &&
        matchMedia('(max-width: 900px)').matches &&
        ((d = M === 'buy' ? 'comprar' : 'vender'), m.set(d), z()));
  }
  function z() {
    let M = matchMedia('(max-width: 900px)').matches;
    for (let R of _.querySelectorAll('.pane')) R.classList.toggle('on', !M || R.dataset.pane === d);
  }
  let D = s() ? x() : 'no hay partida en curso';
  D
    ? (h.body.innerHTML = `<div class="mg-vacio">${iconHtml('shop')}No se puede comerciar ahora (${escapeHtml(D)}).</div>`)
    : w();
}
const EL = {
  smith:
    'Dagna deja el martillo sobre el yunque. \xABAcero bueno, precio justo. Lo que no se vende es lo que no se pide.\xBB',
  herbalist:
    'Ysolde aparta unas ramas de salvia. \xAB\xBFHeridas, fiebres o algo peor? Tengo remedio para casi todo.\xBB',
  peddler:
    'Tobin abre las portezuelas del carro con una reverencia. \xAB\xA1De todo un poco y de lo poco, lo mejor!\xBB',
};

export { pantallaTienda as default, opcionesTienda as options };
