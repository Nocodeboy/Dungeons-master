// ui/items.js
// Ayudantes de objetos compartidos por inventario, tienda y botín: clase CSS de rareza, icono y ficha
// emergente (consulta item_info al núcleo).
// Reconstruido de publicado/juego.js (módulo __esm «tm»).

import './dom.js';
import { RARITIES, ITEM_KINDS, ITEM_KIND_ICONS } from './labels.js';

/** Clase CSS de rareza de un objeto («mg-r-sinid» si no está identificado). */
function rarityClass(item) {
  return item
    ? item.unid
      ? 'mg-r-sinid'
      : RARITIES[item.rarity]?.[1] || (item.magic ? 'mg-r-poco' : '')
    : '';
}
/** Icono de un objeto: el suyo o el de su tipo. */
function itemIcon(item) {
  return item?.icon || ITEM_KIND_ICONS[item?.kind] || 'bag';
}
/** Ficha emergente perezosa de un objeto (pide item_info al núcleo al enseñarla). */
function itemTip(ui, item) {
  return () => {
    if (!item?.id) return null;
    let info = ui.R.call('item_info', { id: item.id, unid: !!item.unid }),
      data = info && !info.error ? info : { name: item.name, desc: '' },
      sub = [
        ITEM_KINDS[data.kind] || '',
        data.rarity_name || RARITIES[data.rarity]?.[0] || '',
        data.attune ? 'requiere sinton\xEDa' : '',
      ]
        .filter(Boolean)
        .join(' \xB7 '),
      lines = data.lines?.length ? data.lines : data.desc ? [data.desc] : [];
    return {
      title: item.unid ? item.name || data.name : data.name || item.name,
      sub: item.unid ? 'Sin identificar: un descanso corto basta para saber qu\xE9 es.' : sub,
      body: lines.join(`
`),
      tags: (data.props || []).map((prop) => [prop, '']),
      foot: [
        data.price ? `Valor ${data.price} po` : '',
        data.weight ? `${String(data.weight).replace('.', ',')} lb` : '',
        item.n > 1 ? `\xD7${item.n}` : '',
      ]
        .filter(Boolean)
        .join(' \xB7 '),
    };
  };
}

export { itemTip, itemIcon, rarityClass };
