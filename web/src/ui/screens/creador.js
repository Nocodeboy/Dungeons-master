// ui/screens/creador.js
// Reconstruido de publicado/juego.js (módulo __esm «bM»). Nombres locales aún minificados.

import { pc } from '../../actors/outfits.js';
import { fc } from '../creator.js';

function opcionesCreador() {
  return { width: '86rem', height: '52rem', cls: 'mg-cr-host' };
}
function pantallaCreador(o, e, t, a) {
  let n = t.R;
  o.el.classList.add('mg-cr-host');
  let s = n.sheetNew({ ...(e.class ? { class: e.class } : {}) });
  if (!s || s.error) {
    (t.toast(`No se puede abrir el creador: ${s?.error || 'sin respuesta'}`, 'mal'),
      setTimeout(() => o.close(null)));
    return;
  }
  let i = null,
    r = fc(t, a, {
      mode: e.mode === 'heroe' ? 'create' : 'mercenario',
      overlay: !0,
      container: o.el,
      sheet: s.sheet,
      options: s.options,
      title: e.title || (e.mode === 'heroe' ? 'Crea tu h\xE9roe' : 'Nuevo mercenario'),
      onChange: (c) => i?.setHero(c),
      onDrag: (c) => i?.drag(c),
      onCancel: () => o.close(null),
      onFinish: async (c) => {
        if ((e.hire ?? e.mode !== 'heroe') && a.store.cp) {
          let d = n.hire(c);
          if (!d || d.error || d.ok === !1)
            return t.toast(d?.reason || d?.error || 'No se ha podido contratar.', 'mal');
          (t.toast(`${c.name} se une al grupo.`, 'bien'),
            a.bus?.emit('companion:join', { id: d.id, mercenary: !0 }));
        }
        o.close(c);
      },
    }),
    l = document.createElement('canvas');
  return (
    r.heroEl.prepend(l),
    (i = new pc(a, l)),
    i.setHero(r.sheet()),
    {
      dispose() {
        (i?.dispose(), r.dispose());
      },
      onEscape: () => o.close(null),
    }
  );
}

export { pantallaCreador as default, opcionesCreador as options };
