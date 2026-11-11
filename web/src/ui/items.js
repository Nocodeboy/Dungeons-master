// ui/items.js
// Reconstruido de publicado/juego.js (módulo __esm «tm»). Nombres locales aún minificados.

import './dom.js';
import { su, as, e2 } from './labels.js';

function mi(o) {
  return o ? (o.unid ? 'mg-r-sinid' : su[o.rarity]?.[1] || (o.magic ? 'mg-r-poco' : '')) : '';
}
function Zi(o) {
  return o?.icon || e2[o?.kind] || 'bag';
}
function Gr(o, e) {
  return () => {
    if (!e?.id) return null;
    let t = o.R.call('item_info', { id: e.id, unid: !!e.unid }),
      a = t && !t.error ? t : { name: e.name, desc: '' },
      n = [as[a.kind] || '', a.rarity_name || su[a.rarity]?.[0] || '', a.attune ? 'requiere sinton\xEDa' : '']
        .filter(Boolean)
        .join(' \xB7 '),
      s = a.lines?.length ? a.lines : a.desc ? [a.desc] : [];
    return {
      title: e.unid ? e.name || a.name : a.name || e.name,
      sub: e.unid ? 'Sin identificar: un descanso corto basta para saber qu\xE9 es.' : n,
      body: s.join(`
`),
      tags: (a.props || []).map((i) => [i, '']),
      foot: [
        a.price ? `Valor ${a.price} po` : '',
        a.weight ? `${String(a.weight).replace('.', ',')} lb` : '',
        e.n > 1 ? `\xD7${e.n}` : '',
      ]
        .filter(Boolean)
        .join(' \xB7 '),
    };
  };
}

export { Gr, Zi, mi };
