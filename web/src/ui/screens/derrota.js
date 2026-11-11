// ui/screens/derrota.js
// Reconstruido de publicado/juego.js (módulo __esm «AM»). Nombres locales aún minificados.

import { iconHtml, richText, elem, makeButton, formatDate } from '../dom.js';

function opcionesDerrota() {
  return { full: !0, cls: 'mg-derrota' };
}
function pantallaDerrota(o, e, t, a) {
  let n = a.store,
    s = o.el,
    i = elem('div.mg-derrota-col');
  (i.append(elem('div.mg-derrota-ico', { html: iconHtml('skull') })),
    i.append(elem('h1.mg-derrota-title', 'Hab\xE9is ca\xEDdo')),
    i.append(elem('div.mg-hr', elem('i'))),
    i.append(
      elem('p.mg-derrota-text', {
        html: richText(
          e.text ||
            'El \xFAltimo de vosotros cae. La oscuridad se cierra sobre el prado y, muy por debajo, algo sonr\xEDe.',
        ),
      }),
    ));
  let r = elem('div.mg-derrota-acts'),
    l = makeButton('Cargar la \xFAltima partida', { icon: 'load', variant: 'primary', size: 'lg' }),
    c = makeButton('Elegir otra partida', { icon: 'scroll_open' }),
    d = makeButton('Volver al men\xFA', { icon: 'exit_door', variant: 'ghost' });
  r.append(l, c, d);
  let u = elem('p.mg-derrota-meta');
  (i.append(r, u), s.append(i), s.setAttribute('aria-label', 'Derrota'));
  let h = null;
  n.list()
    .then((m) => {
      ((h = m.find((_) => _.slot === 'auto')?.meta || null),
        h
          ? (u.textContent = `${h.hero || ''}${h.place ? ` \xB7 ${h.place}` : ''}${h.savedAt ? ` \xB7 ${formatDate(h.savedAt)}` : ''}`)
          : ((l.disabled = !0), (u.textContent = 'No hay guardado autom\xE1tico.'), c.focus()));
    })
    .catch(() => null);
  let p = async (m) => {
    let _ = await n.load(m);
    if (!_) return (t.toast('No se ha podido cargar.', 'mal'), !1);
    let b = t.R.call('cp_load', { cp: _ });
    return (b?.cp && !b.error && n.set(b.cp), !0);
  };
  return (
    l.addEventListener('click', async () => {
      (await p('auto')) && (o.close({ action: 'auto' }), t.resume());
    }),
    c.addEventListener('click', async () => {
      (await t.open('cargar', { noConfirm: !0 }))?.slot && (o.close({ action: 'cargar' }), t.resume());
    }),
    d.addEventListener('click', () => {
      (o.close({ action: 'menu' }), a.go('menu'));
    }),
    requestAnimationFrame(() => (l.disabled ? c : l).focus({ preventScroll: !0 })),
    a.audio?.music?.('derrota', { fade: 1.5 }),
    { dismissable: !1, onEscape() {} }
  );
}

export { pantallaDerrota as default, opcionesDerrota as options };
