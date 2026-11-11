// ui/screens/creador.js
// Pantalla «creador»: el creador de personajes en una capa (héroe o mercenario que se contrata), con vista
// previa 3D del personaje.
// La registra ui/index.js (SCREENS) y se abre con ui.open('creador').
// Reconstruido de publicado/juego.js (módulo __esm «bM»).

import { pc } from '../../actors/outfits.js';
import { buildCreator } from '../creator.js';

/** Opciones de la capa (tamaño, modal, clases) que ui.open pasa a ScreenStack.open. */
function opcionesCreador() {
  return { width: '86rem', height: '52rem', cls: 'mg-cr-host' };
}
/**
 * Construye la pantalla en `screen.el` (`params` son los de ui.open).
 * Devuelve los ganchos de la capa (onKey, onEscape, dispose…), si los hay.
 */
function pantallaCreador(screen, params, ui, game) {
  let rules = ui.R;
  screen.el.classList.add('mg-cr-host');
  let created = rules.sheetNew({ ...(params.class ? { class: params.class } : {}) });
  if (!created || created.error) {
    (ui.toast(`No se puede abrir el creador: ${created?.error || 'sin respuesta'}`, 'mal'),
      setTimeout(() => screen.close(null)));
    return;
  }
  let preview = null,
    creator = buildCreator(ui, game, {
      mode: params.mode === 'heroe' ? 'create' : 'mercenario',
      overlay: !0,
      container: screen.el,
      sheet: created.sheet,
      options: created.options,
      title: params.title || (params.mode === 'heroe' ? 'Crea tu h\xE9roe' : 'Nuevo mercenario'),
      onChange: (sheet) => preview?.setHero(sheet),
      onDrag: (dx) => preview?.drag(dx),
      onCancel: () => screen.close(null),
      onFinish: async (sheet) => {
        if ((params.hire ?? params.mode !== 'heroe') && game.store.cp) {
          let res = rules.hire(sheet);
          if (!res || res.error || res.ok === !1)
            return ui.toast(res?.reason || res?.error || 'No se ha podido contratar.', 'mal');
          (ui.toast(`${sheet.name} se une al grupo.`, 'bien'),
            game.bus?.emit('companion:join', { id: res.id, mercenary: !0 }));
        }
        screen.close(sheet);
      },
    }),
    canvas = document.createElement('canvas');
  return (
    creator.heroEl.prepend(canvas),
    (preview = new pc(game, canvas)),
    preview.setHero(creator.sheet()),
    {
      dispose() {
        (preview?.dispose(), creator.dispose());
      },
      onEscape: () => screen.close(null),
    }
  );
}

export { pantallaCreador as default, opcionesCreador as options };
