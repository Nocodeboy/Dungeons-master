// ui/screens/pausa.js
// Reconstruido de publicado/juego.js (módulo __esm «fM»). Nombres locales aún minificados.

import { elem, makeButton, Yl } from '../dom.js';
import { screenFrame } from '../modal.js';

function opcionesPausa() {
  return { modal: !0, full: !1, auto: !0, width: '24rem' };
}
function pantallaPausa(o, e, t, a) {
  let n = screenFrame(o, { title: 'Pausa', ic: 'pause' }),
    s = a.store.cp,
    i = !!e.battle || a.battle?.active;
  s && (n.sub.textContent = `${s.location?.name || ''}${s.day ? ` \xB7 d\xEDa ${s.day}` : ''}`);
  let r = elem('div.mg-pause'),
    l = (c, d, u, h = {}) => {
      let p = makeButton(c, { icon: d, block: !0, ...h, onclick: u });
      return (r.append(p), p);
    };
  return (
    l('Continuar', 'play', () => o.close(null), { variant: 'primary' }).setAttribute('autofocus', ''),
    s &&
      !i &&
      l('Guardar partida', 'save', async () => {
        (await t.open('guardar'))?.slot && o.close(null);
      }),
    l('Cargar partida', 'load', async () => {
      (await t.open('cargar', { noConfirm: !1 }))?.slot && (o.close(null), t.resume());
    }),
    l('Ajustes', 'settings', () => t.open('ajustes')),
    l('C\xF3mo se juega', 'open_book', () => t.open('ayuda')),
    l(
      'Salir al men\xFA',
      'exit_door',
      async () => {
        let c = i
          ? 'Se perder\xE1 el progreso de este combate.'
          : 'Lo que no hayas guardado se perder\xE1 (hay un guardado autom\xE1tico al cambiar de zona, tras cada combate y tras descansar).';
        (await t.confirm(c, { titulo: '\xBFSalir al men\xFA?', si: 'Salir', peligro: !0 })) &&
          (t.close(), t.dialogClose(), a.go('menu'));
      },
      { variant: 'danger' },
    ),
    n.body.append(r),
    s?.playtime &&
      n.body.append(
        elem('p.mg-help', { style: 'margin:.7rem 0 0;text-align:center' }, `${Yl(s.playtime)} de partida`),
      ),
    a.bus?.emit('game:pause', { on: !0 }),
    {
      dispose: () => a.bus?.emit('game:pause', { on: !1 }),
      onKey(c) {
        return c.key === 'Escape' ? (o.close(null), !0) : !1;
      },
    }
  );
}

export { pantallaPausa as default, opcionesPausa as options };
