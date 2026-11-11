// ui/screens/tienda.js
// Reconstruido de publicado/juego.js (módulo __esm «IT»). Nombres locales aún minificados.

import { iconHtml, escapeHtml, elem, makeButton, faceBadge } from '../dom.js';
import { screenFrame, makeTabs } from '../modal.js';
import { setTip } from '../tooltip.js';
import { rarityClass, itemIcon, itemTip } from '../items.js';
import { ITEM_KINDS } from '../labels.js';

function opcionesTienda() {
  return { width: '76rem', height: '46rem' };
}
function pantallaTienda(screen, params, ui, game) {
  let rules = ui.R,
    currentCp = () => game.store.cp,
    merchant = params.merchant || 'peddler',
    shop = null,
    picked = null,
    qty = 1,
    pane = 'comprar',
    buyer = params.who && currentCp()?.party.includes(params.who) ? params.who : '',
    frame = screenFrame(screen, { title: 'Tienda', ic: 'shop' }),
    goldEl = elem('span.mg-gold');
  frame.head.insertBefore(goldEl, frame.head.querySelector('.mg-cerrar'));
  let tabs = makeTabs(
      [
        { id: 'comprar', label: 'Comprar', icon: 'coins' },
        { id: 'detalle', label: 'Detalle', icon: 'info' },
        { id: 'vender', label: 'Vender', icon: 'scales' },
      ],
      pane,
      (id) => {
        ((pane = id), showPane());
      },
      { cls: 'mg-panes-tabs' },
    ),
    panes = elem('div.mg-shop'),
    buyPane = elem('section.pane.mg-col', { 'data-pane': 'comprar' }),
    detailPane = elem('section.pane.mg-shop-detail.mg-col', { 'data-pane': 'detalle' }),
    sellPane = elem('section.pane.mg-col', { 'data-pane': 'vender' });
  (panes.append(buyPane, detailPane, sellPane),
    (frame.body.style.gridTemplateRows = 'auto minmax(0, 1fr)'),
    (tabs.style.gridRow = '1'),
    (panes.style.gridRow = '2'),
    frame.body.append(tabs, panes));
  function loadShop() {
    let res = rules.shop(merchant);
    return !res || res.error ? res?.error || 'sin respuesta' : ((shop = res), null);
  }
  let firstName = (id) => String(currentCp()?.members?.[id]?.name || id).split(' ')[0];
  function itemRow(item, side, index) {
    let row = elem(`button.mg-shop-row${side === 'buy' && item.can_afford === !1 ? '.caro' : ''}`, {
        'aria-pressed': String(picked?.side === side && picked.i === index),
      }),
      cls = rarityClass(item),
      note =
        side === 'buy'
          ? item.unlimited || item.n < 0
            ? ''
            : `${item.n} en venta`
          : item.n > 1
            ? `\xD7${item.n}`
            : '';
    return (
      (row.innerHTML = `${iconHtml(itemIcon(item))}<span style="min-width:0"><b class="${cls}">${escapeHtml(item.name)}</b><small>${escapeHtml([ITEM_KINDS[item.kind] || '', note].filter(Boolean).join(' \xB7 '))}</small></span><span class="precio">${escapeHtml(item.price)}${iconHtml('coins')}</span>`),
      setTip(row, itemTip(ui, item)),
      row.addEventListener('click', () => {
        ((picked = { side, i: index }),
          (qty = 1),
          matchMedia('(max-width: 900px)').matches && (tabs.set('detalle'), (pane = 'detalle')),
          render());
      }),
      row
    );
  }
  function render() {
    ((goldEl.innerHTML = `${iconHtml('coins')}${escapeHtml(currentCp()?.gold ?? shop?.gold ?? 0)}<small>po</small>`),
      (frame.title.textContent = shop?.name || 'Tienda'),
      (buyPane.innerHTML = ''),
      buyPane.append(elem('h3.mg-sec', 'Se vende')));
    let buyList = elem('div.mg-shop-list.mg-scroll', { style: 'overflow-y:auto;min-height:0' });
    ((shop?.stock || []).forEach((item, index) => buyList.append(itemRow(item, 'buy', index))),
      (shop?.stock || []).length ||
        (buyList.innerHTML = `<div class="mg-vacio">${iconHtml('shop')}No le queda nada que vender.</div>`),
      buyPane.append(buyList),
      (buyPane.style.gridTemplateRows = 'auto minmax(0, 1fr)'),
      (sellPane.innerHTML = ''),
      sellPane.append(elem('h3.mg-sec', 'Lo que pod\xE9is vender')));
    let sellList = elem('div.mg-shop-list.mg-scroll', { style: 'overflow-y:auto;min-height:0' }),
      lastWho = null;
    ((shop?.buys || []).forEach((item, index) => {
      (item.who !== lastWho &&
        ((lastWho = item.who), sellList.append(elem('div.mg-shop-who', firstName(item.who)))),
        sellList.append(itemRow(item, 'sell', index)));
    }),
      (shop?.buys || []).length ||
        (sellList.innerHTML = `<div class="mg-vacio">${iconHtml('scales')}No llev\xE1is nada que le interese.</div>`),
      sellPane.append(sellList),
      (sellPane.style.gridTemplateRows = 'auto minmax(0, 1fr)'),
      renderDetail(),
      showPane());
  }
  function renderDetail() {
    detailPane.innerHTML = '';
    let merchantBox = elem('div.mg-merchant'),
      isSmith = (shop?.buys_kinds || []).some((kind) => kind === 'weapon' || kind === 'armor'),
      npc = shop?.npc || params.npc || null;
    (merchantBox.append(faceBadge(ui.portrait(npc), { name: '', ic: isSmith ? 'hammer' : 'shop', id: npc })),
      merchantBox.append(
        elem(
          'div',
          elem('b.mg-h3', shop?.name || ''),
          elem(
            'div.mg-dim.mg-small',
            'Compra: ' +
              (shop?.buys_kinds || []).map((kind) => (ITEM_KINDS[kind] || kind).toLowerCase()).join(', '),
          ),
        ),
      ),
      detailPane.append(merchantBox));
    let detail = elem('div.mg-inv-detail.mg-inset.mg-scroll', { style: 'min-height:0;overflow-y:auto' });
    (detailPane.append(detail), (detailPane.style.gridTemplateRows = 'auto minmax(0, 1fr)'));
    let item = picked ? (picked.side === 'buy' ? shop?.stock : shop?.buys)?.[picked.i] : null;
    if (!item) {
      (detail.append(
        elem(
          'p.mg-p',
          { style: 'font-style:italic;color:var(--pergamino-2)' },
          MERCHANT_GREETINGS[merchant] || 'Echad un vistazo.',
        ),
      ),
        detail.append(elem('p.mg-dim.mg-small', 'Elige algo de la lista para verlo de cerca.')));
      return;
    }
    let info = rules.call('item_info', { id: item.id, unid: !!item.unid }),
      data = info && !info.error ? info : {};
    (detail.append(elem(`div.mg-item-name.${rarityClass(item) || 'mg-r-comun'}`, item.name)),
      (data.rarity_name || ITEM_KINDS[data.kind]) &&
        detail.append(
          elem('div.mg-item-kind', [ITEM_KINDS[data.kind], data.rarity_name].filter(Boolean).join(' \xB7 ')),
        ),
      (data.props || []).length &&
        detail.append(elem('div.mg-item-props', ...data.props.map((prop) => elem('span.mg-chip', prop)))),
      detail.append(
        elem(
          'div.mg-item-desc',
          ...(data.lines?.length ? data.lines : [data.desc || item.desc || ''])
            .filter(Boolean)
            .map((line) => elem('p.mg-p', line)),
        ),
      ));
    let maxQty =
      picked.side === 'buy'
        ? item.n < 0 || item.unlimited
          ? 20
          : item.n
        : item.where === 'stack'
          ? item.n
          : 1;
    qty = Math.max(1, Math.min(qty, maxQty));
    let total = item.price * qty,
      acts = elem('div.mg-item-acts', { style: 'align-items:center' });
    if (maxQty > 1) {
      let qtyBox = elem('span.mg-qty');
      (qtyBox.append(
        makeButton('\u2212', { size: 'sm', disabled: qty <= 1, onclick: () => ((qty -= 1), renderDetail()) }),
        elem('b.mg-num', String(qty)),
        makeButton('+', { size: 'sm', disabled: qty >= maxQty, onclick: () => ((qty += 1), renderDetail()) }),
      ),
        acts.append(qtyBox));
    }
    if (picked.side === 'buy') {
      let party = currentCp()?.party || [],
        whoSelect = elem('select', { 'aria-label': 'Para qui\xE9n' });
      ((whoSelect.innerHTML = `<option value="">Al que mejor le venga</option>${party.map((id) => `<option value="${escapeHtml(id)}">${escapeHtml(firstName(id))}</option>`).join('')}`),
        (whoSelect.value = buyer),
        whoSelect.addEventListener('change', () => (buyer = whoSelect.value)),
        acts.append(elem('label.mg-who', 'Para: ', whoSelect)));
      let canPay = (currentCp()?.gold ?? 0) >= total;
      (acts.append(
        makeButton(`Comprar \xB7 ${total} po`, {
          icon: 'coins',
          variant: 'primary',
          disabled: !canPay,
          onclick: () => buy(item),
        }),
      ),
        canPay || detail.append(elem('p.mg-mal.mg-small', 'No ten\xE9is oro suficiente.')));
    } else
      acts.append(
        makeButton(`Vender \xB7 ${total} po`, {
          icon: 'scales',
          variant: 'primary',
          onclick: () => sell(item),
        }),
      );
    detail.append(acts);
  }
  function buy(item) {
    let res = rules.buy(merchant, item.id, qty, buyer || void 0);
    if (!res || res.error || res.ok === !1)
      return ui.toast(res?.reason || res?.error || 'No se ha podido comprar.', 'mal');
    (ui.toast(res.text || `Comprado: ${item.name}.`, 'botin'),
      game.bus?.emit('shop:buy', { merchant, item: item.id, n: qty, who: res.who || buyer }),
      game.bus?.emit('gold', { delta: -(item.price * qty) }),
      afterTrade());
  }
  function sell(item) {
    let res = rules.sell(merchant, item.who, item.where === 'pack' ? { idx: item.idx } : item.id, qty);
    if (!res || res.error || res.ok === !1)
      return ui.toast(res?.reason || res?.error || 'No se ha podido vender.', 'mal');
    (ui.toast(res.text || `Vendido: ${item.name}.`, 'botin'),
      game.bus?.emit('shop:sell', { merchant, item: item.id, n: qty, who: item.who }),
      game.bus?.emit('gold', { delta: res.price ?? item.price * qty }),
      afterTrade());
  }
  function afterTrade() {
    let side = picked?.side;
    ((picked = null),
      (qty = 1),
      loadShop(),
      render(),
      side &&
        matchMedia('(max-width: 900px)').matches &&
        ((pane = side === 'buy' ? 'comprar' : 'vender'), tabs.set(pane), showPane()));
  }
  function showPane() {
    let narrow = matchMedia('(max-width: 900px)').matches;
    for (let paneEl of panes.querySelectorAll('.pane'))
      paneEl.classList.toggle('on', !narrow || paneEl.dataset.pane === pane);
  }
  let error = currentCp() ? loadShop() : 'no hay partida en curso';
  error
    ? (frame.body.innerHTML = `<div class="mg-vacio">${iconHtml('shop')}No se puede comerciar ahora (${escapeHtml(error)}).</div>`)
    : render();
}
const MERCHANT_GREETINGS = {
  smith:
    'Dagna deja el martillo sobre el yunque. \xABAcero bueno, precio justo. Lo que no se vende es lo que no se pide.\xBB',
  herbalist:
    'Ysolde aparta unas ramas de salvia. \xAB\xBFHeridas, fiebres o algo peor? Tengo remedio para casi todo.\xBB',
  peddler:
    'Tobin abre las portezuelas del carro con una reverencia. \xAB\xA1De todo un poco y de lo poco, lo mejor!\xBB',
};

export { pantallaTienda as default, opcionesTienda as options };
