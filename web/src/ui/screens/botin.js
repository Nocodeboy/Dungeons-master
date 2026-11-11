// ui/screens/botin.js
// Pantalla «botin»: objetos y oro encontrados, para cogerlos uno a uno o todos (a quién va cada cosa);
// devuelve lo cogido y lo que se deja.
// La registra ui/index.js (SCREENS) y se abre con ui.open('botin').
// Reconstruido de publicado/juego.js (módulo __esm «sM»).

import { iconHtml, escapeHtml, elem, makeButton } from '../dom.js';
import { screenFrame } from '../modal.js';
import { setTip } from '../tooltip.js';
import { rarityClass, itemIcon, itemTip } from '../items.js';
import { ITEM_KINDS } from '../labels.js';

/** Opciones de la capa (tamaño, modal, clases) que ui.open pasa a ScreenStack.open. */
function opcionesBotin() {
  return { modal: !0, full: !0, width: '38rem', auto: !0 };
}
/**
 * Construye la pantalla en `screen.el` (`params` son los de ui.open).
 * Devuelve los ganchos de la capa (onKey, onEscape, dispose…), si los hay.
 */
function pantallaBotin(screen, params, ui, game) {
  let rules = ui.R,
    cp = game.store.cp,
    apply = params.apply !== !1,
    items = (params.items || []).map((entry) => {
      let info = rules.call('item_info', { id: entry.id, unid: !!entry.unid }),
        data = info && !info.error ? info : { id: entry.id, name: entry.id, kind: 'gear' };
      return {
        ...entry,
        n: entry.n || 1,
        name: data.name,
        kind: data.kind,
        icon: data.icon,
        rarity: entry.unid ? '' : data.rarity,
        unid: !!entry.unid,
        taken: !1,
        to: '',
      };
    }),
    gold = Number(params.gold || 0),
    goldTaken = !1,
    taken = [],
    frame = screenFrame(screen, { title: params.title || 'Bot\xEDn', ic: 'chest', closeLabel: 'Dejarlo' }),
    list = elem('div.mg-list');
  (frame.body.classList.add('mg-scroll'), (frame.body.style.overflowY = 'auto'), frame.body.append(list));
  let party = cp?.party || [],
    whoSelect = elem('select', { 'aria-label': 'Para qui\xE9n' });
  ((whoSelect.innerHTML = `<option value="">Al que mejor le venga</option>${party.map((id) => `<option value="${escapeHtml(id)}">${escapeHtml(String(cp.members[id]?.name || id).split(' ')[0])}</option>`).join('')}`),
    params.who && (whoSelect.value = params.who));
  function take(item) {
    if (item.taken) return;
    let who = whoSelect.value || void 0;
    if (apply && cp) {
      let res = rules.give(item.id, item.n, who, item.unid);
      if (!res || res.error || res.ok === !1)
        return ui.toast(res?.reason || res?.error || 'No se ha podido coger.', 'mal');
      ((who = res.who || who), game.bus?.emit('item:gain', { id: item.id, n: item.n, who }));
    }
    ((item.taken = !0),
      (item.to = who || ''),
      taken.push({ id: item.id, n: item.n, to: item.to, unid: item.unid }),
      ui.hud?.visible &&
        ui.hud.log(
          `${String(cp?.members?.[who]?.name || 'El grupo').split(' ')[0]} coge ${item.name}${item.n > 1 ? ` \xD7${item.n}` : ''}.`,
          'botin',
        ),
      render(),
      items.every((entry) => entry.taken) &&
        (goldTaken || !gold) &&
        setTimeout(() => screen.close(result()), 350));
  }
  function takeGold() {
    if (!(goldTaken || !gold)) {
      if (apply && cp) {
        let res = rules.gold(gold);
        if (!res || res.error) return ui.toast(res?.error || 'No se ha podido coger el oro.', 'mal');
        game.bus?.emit('gold', { delta: gold });
      }
      ((goldTaken = !0), ui.toast(`Encontr\xE1is ${gold} piezas de oro.`, 'botin'), render());
    }
  }
  function result() {
    return {
      taken,
      gold: goldTaken ? gold : 0,
      left: items.filter((item) => !item.taken).map(({ id, n, unid }) => ({ id, n, unid })),
    };
  }
  function render() {
    if (((list.innerHTML = ''), gold)) {
      let goldRow = elem('div.mg-loot-gold');
      ((goldRow.innerHTML = `${iconHtml('coins')}<b>${escapeHtml(gold)} po</b><span class="mg-grow mg-dim">${goldTaken ? 'Al bolsillo del grupo.' : 'Oro para el grupo'}</span>`),
        goldTaken || goldRow.append(makeButton('Coger', { size: 'sm', onclick: takeGold })),
        list.append(goldRow));
    }
    for (let item of items) {
      let row = elem(`div.mg-loot-row${item.taken ? '.cogido' : ''}`),
        cls = rarityClass(item);
      ((row.innerHTML = `${iconHtml(itemIcon(item))}<span><b class="${cls}">${escapeHtml(item.name)}${item.n > 1 ? ` \xD7${escapeHtml(item.n)}` : ''}</b><small>${escapeHtml(item.unid ? 'Sin identificar' : ITEM_KINDS[item.kind] || '')}${item.taken ? ` \xB7 para ${escapeHtml(String(cp?.members?.[item.to]?.name || 'el grupo').split(' ')[0])}` : ''}</small></span><span></span>`),
        setTip(row, itemTip(ui, item)),
        item.taken
          ? row.insertAdjacentHTML('beforeend', iconHtml('check', 'mg-bien'))
          : row.append(makeButton('Coger', { size: 'sm', onclick: () => take(item) })),
        list.append(row));
    }
    (!items.length &&
      !gold &&
      (list.innerHTML = `<div class="mg-vacio">${iconHtml('chest')}Est\xE1 vac\xEDo.</div>`),
      (takeAllButton.disabled = items.every((item) => item.taken) && (goldTaken || !gold)));
  }
  frame.foot.hidden = !1;
  let whoLabel = elem('label.mg-who', 'Para: ', whoSelect),
    takeAllButton = makeButton('Cogerlo todo', {
      icon: 'check',
      variant: 'primary',
      onclick: () => {
        takeGold();
        for (let item of items) take(item);
        screen.close(result());
      },
    });
  return (
    takeAllButton.setAttribute('autofocus', ''),
    frame.foot.append(
      whoLabel,
      elem('span.mg-grow'),
      makeButton('Dejarlo', { onclick: () => screen.close(result()) }),
      takeAllButton,
    ),
    render(),
    {
      onEscape: () => screen.close(result()),
      onKey(ev) {
        return ev.key === 'Enter' && !ev.target.closest('button,select') ? (takeAllButton.click(), !0) : !1;
      },
    }
  );
}

export { pantallaBotin as default, opcionesBotin as options };
