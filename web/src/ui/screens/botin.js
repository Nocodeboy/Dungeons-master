// ui/screens/botin.js
// Reconstruido de publicado/juego.js (módulo __esm «sM»). Nombres locales aún minificados.

import { iconHtml, escapeHtml, elem, makeButton } from '../dom.js';
import { screenFrame } from '../modal.js';
import { setTip } from '../tooltip.js';
import { rarityClass, itemIcon, itemTip } from '../items.js';
import { ITEM_KINDS } from '../labels.js';

function opcionesBotin() {
  return { modal: !0, full: !0, width: '38rem', auto: !0 };
}
function pantallaBotin(o, e, t, a) {
  let n = t.R,
    s = a.store.cp,
    i = e.apply !== !1,
    r = (e.items || []).map((y) => {
      let w = n.call('item_info', { id: y.id, unid: !!y.unid }),
        k = w && !w.error ? w : { id: y.id, name: y.id, kind: 'gear' };
      return {
        ...y,
        n: y.n || 1,
        name: k.name,
        kind: k.kind,
        icon: k.icon,
        rarity: y.unid ? '' : k.rarity,
        unid: !!y.unid,
        taken: !1,
        to: '',
      };
    }),
    l = Number(e.gold || 0),
    c = !1,
    d = [],
    u = screenFrame(o, { title: e.title || 'Bot\xEDn', ic: 'chest', closeLabel: 'Dejarlo' }),
    h = elem('div.mg-list');
  (u.body.classList.add('mg-scroll'), (u.body.style.overflowY = 'auto'), u.body.append(h));
  let p = s?.party || [],
    m = elem('select', { 'aria-label': 'Para qui\xE9n' });
  ((m.innerHTML = `<option value="">Al que mejor le venga</option>${p.map((y) => `<option value="${escapeHtml(y)}">${escapeHtml(String(s.members[y]?.name || y).split(' ')[0])}</option>`).join('')}`),
    e.who && (m.value = e.who));
  function _(y) {
    if (y.taken) return;
    let w = m.value || void 0;
    if (i && s) {
      let k = n.give(y.id, y.n, w, y.unid);
      if (!k || k.error || k.ok === !1)
        return t.toast(k?.reason || k?.error || 'No se ha podido coger.', 'mal');
      ((w = k.who || w), a.bus?.emit('item:gain', { id: y.id, n: y.n, who: w }));
    }
    ((y.taken = !0),
      (y.to = w || ''),
      d.push({ id: y.id, n: y.n, to: y.to, unid: y.unid }),
      t.hud?.visible &&
        t.hud.log(
          `${String(s?.members?.[w]?.name || 'El grupo').split(' ')[0]} coge ${y.name}${y.n > 1 ? ` \xD7${y.n}` : ''}.`,
          'botin',
        ),
      v(),
      r.every((k) => k.taken) && (c || !l) && setTimeout(() => o.close(f()), 350));
  }
  function b() {
    if (!(c || !l)) {
      if (i && s) {
        let y = n.gold(l);
        if (!y || y.error) return t.toast(y?.error || 'No se ha podido coger el oro.', 'mal');
        a.bus?.emit('gold', { delta: l });
      }
      ((c = !0), t.toast(`Encontr\xE1is ${l} piezas de oro.`, 'botin'), v());
    }
  }
  function f() {
    return {
      taken: d,
      gold: c ? l : 0,
      left: r.filter((y) => !y.taken).map(({ id: y, n: w, unid: k }) => ({ id: y, n: w, unid: k })),
    };
  }
  function v() {
    if (((h.innerHTML = ''), l)) {
      let y = elem('div.mg-loot-gold');
      ((y.innerHTML = `${iconHtml('coins')}<b>${escapeHtml(l)} po</b><span class="mg-grow mg-dim">${c ? 'Al bolsillo del grupo.' : 'Oro para el grupo'}</span>`),
        c || y.append(makeButton('Coger', { size: 'sm', onclick: b })),
        h.append(y));
    }
    for (let y of r) {
      let w = elem(`div.mg-loot-row${y.taken ? '.cogido' : ''}`),
        k = rarityClass(y);
      ((w.innerHTML = `${iconHtml(itemIcon(y))}<span><b class="${k}">${escapeHtml(y.name)}${y.n > 1 ? ` \xD7${escapeHtml(y.n)}` : ''}</b><small>${escapeHtml(y.unid ? 'Sin identificar' : ITEM_KINDS[y.kind] || '')}${y.taken ? ` \xB7 para ${escapeHtml(String(s?.members?.[y.to]?.name || 'el grupo').split(' ')[0])}` : ''}</small></span><span></span>`),
        setTip(w, itemTip(t, y)),
        y.taken
          ? w.insertAdjacentHTML('beforeend', iconHtml('check', 'mg-bien'))
          : w.append(makeButton('Coger', { size: 'sm', onclick: () => _(y) })),
        h.append(w));
    }
    (!r.length && !l && (h.innerHTML = `<div class="mg-vacio">${iconHtml('chest')}Est\xE1 vac\xEDo.</div>`),
      (g.disabled = r.every((y) => y.taken) && (c || !l)));
  }
  u.foot.hidden = !1;
  let x = elem('label.mg-who', 'Para: ', m),
    g = makeButton('Cogerlo todo', {
      icon: 'check',
      variant: 'primary',
      onclick: () => {
        b();
        for (let y of r) _(y);
        o.close(f());
      },
    });
  return (
    g.setAttribute('autofocus', ''),
    u.foot.append(x, elem('span.mg-grow'), makeButton('Dejarlo', { onclick: () => o.close(f()) }), g),
    v(),
    {
      onEscape: () => o.close(f()),
      onKey(y) {
        return y.key === 'Enter' && !y.target.closest('button,select') ? (g.click(), !0) : !1;
      },
    }
  );
}

export { pantallaBotin as default, opcionesBotin as options };
