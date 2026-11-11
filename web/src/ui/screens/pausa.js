// ui/screens/pausa.js
// Pantalla «pausa»: continuar, guardar, cargar, ajustes, ayuda y salir al menú.
// La registra ui/index.js (SCREENS) y se abre con ui.open('pausa').
// Reconstruido de publicado/juego.js (módulo __esm «fM»).

import { elem, makeButton, formatDuration } from '../dom.js';
import { screenFrame } from '../modal.js';

/** Opciones de la capa (tamaño, modal, clases) que ui.open pasa a ScreenStack.open. */
function opcionesPausa() {
  return { modal: !0, full: !1, auto: !0, width: '24rem' };
}
/**
 * Construye la pantalla en `screen.el` (`params` son los de ui.open).
 * Devuelve los ganchos de la capa (onKey, onEscape, dispose…), si los hay.
 */
function pantallaPausa(screen, params, ui, game) {
  let frame = screenFrame(screen, { title: 'Pausa', ic: 'pause' }),
    cp = game.store.cp,
    inBattle = !!params.battle || game.battle?.active;
  cp && (frame.sub.textContent = `${cp.location?.name || ''}${cp.day ? ` \xB7 d\xEDa ${cp.day}` : ''}`);
  let list = elem('div.mg-pause'),
    addButton = (label, icon, onclick, opts = {}) => {
      let button = makeButton(label, { icon, block: !0, ...opts, onclick });
      return (list.append(button), button);
    };
  return (
    addButton('Continuar', 'play', () => screen.close(null), { variant: 'primary' }).setAttribute(
      'autofocus',
      '',
    ),
    cp &&
      !inBattle &&
      addButton('Guardar partida', 'save', async () => {
        (await ui.open('guardar'))?.slot && screen.close(null);
      }),
    addButton('Cargar partida', 'load', async () => {
      (await ui.open('cargar', { noConfirm: !1 }))?.slot && (screen.close(null), ui.resume());
    }),
    addButton('Ajustes', 'settings', () => ui.open('ajustes')),
    addButton('C\xF3mo se juega', 'open_book', () => ui.open('ayuda')),
    addButton(
      'Salir al men\xFA',
      'exit_door',
      async () => {
        let warning = inBattle
          ? 'Se perder\xE1 el progreso de este combate.'
          : 'Lo que no hayas guardado se perder\xE1 (hay un guardado autom\xE1tico al cambiar de zona, tras cada combate y tras descansar).';
        (await ui.confirm(warning, { titulo: '\xBFSalir al men\xFA?', si: 'Salir', peligro: !0 })) &&
          (ui.close(), ui.dialogClose(), game.go('menu'));
      },
      { variant: 'danger' },
    ),
    frame.body.append(list),
    cp?.playtime &&
      frame.body.append(
        elem(
          'p.mg-help',
          { style: 'margin:.7rem 0 0;text-align:center' },
          `${formatDuration(cp.playtime)} de partida`,
        ),
      ),
    game.bus?.emit('game:pause', { on: !0 }),
    {
      dispose: () => game.bus?.emit('game:pause', { on: !1 }),
      onKey(ev) {
        return ev.key === 'Escape' ? (screen.close(null), !0) : !1;
      },
    }
  );
}

export { pantallaPausa as default, opcionesPausa as options };
