// ui/screens/derrota.js
// Pantalla «derrota»: el grupo ha caído; cargar el guardado automático, otra partida o volver al menú.
// La registra ui/index.js (SCREENS) y se abre con ui.open('derrota').
// Reconstruido de publicado/juego.js (módulo __esm «AM»).

import { iconHtml, richText, elem, makeButton, formatDate } from '../dom.js';

/** Opciones de la capa (tamaño, modal, clases) que ui.open pasa a ScreenStack.open. */
function opcionesDerrota() {
  return { full: !0, cls: 'mg-derrota' };
}
/**
 * Construye la pantalla en `screen.el` (`params` son los de ui.open).
 * Devuelve los ganchos de la capa (onKey, onEscape, dispose…), si los hay.
 */
function pantallaDerrota(screen, params, ui, game) {
  let store = game.store,
    el = screen.el,
    column = elem('div.mg-derrota-col');
  (column.append(elem('div.mg-derrota-ico', { html: iconHtml('skull') })),
    column.append(elem('h1.mg-derrota-title', 'Hab\xE9is ca\xEDdo')),
    column.append(elem('div.mg-hr', elem('i'))),
    column.append(
      elem('p.mg-derrota-text', {
        html: richText(
          params.text ||
            'El \xFAltimo de vosotros cae. La oscuridad se cierra sobre el prado y, muy por debajo, algo sonr\xEDe.',
        ),
      }),
    ));
  let actions = elem('div.mg-derrota-acts'),
    loadAutoButton = makeButton('Cargar la \xFAltima partida', {
      icon: 'load',
      variant: 'primary',
      size: 'lg',
    }),
    loadOtherButton = makeButton('Elegir otra partida', { icon: 'scroll_open' }),
    menuButton = makeButton('Volver al men\xFA', { icon: 'exit_door', variant: 'ghost' });
  actions.append(loadAutoButton, loadOtherButton, menuButton);
  let meta = elem('p.mg-derrota-meta');
  (column.append(actions, meta), el.append(column), el.setAttribute('aria-label', 'Derrota'));
  let autoMeta = null;
  store
    .list()
    .then((saves) => {
      ((autoMeta = saves.find((save) => save.slot === 'auto')?.meta || null),
        autoMeta
          ? (meta.textContent = `${autoMeta.hero || ''}${autoMeta.place ? ` \xB7 ${autoMeta.place}` : ''}${autoMeta.savedAt ? ` \xB7 ${formatDate(autoMeta.savedAt)}` : ''}`)
          : ((loadAutoButton.disabled = !0),
            (meta.textContent = 'No hay guardado autom\xE1tico.'),
            loadOtherButton.focus()));
    })
    .catch(() => null);
  let loadSlot = async (slot) => {
    let cp = await store.load(slot);
    if (!cp) return (ui.toast('No se ha podido cargar.', 'mal'), !1);
    let res = ui.R.call('cp_load', { cp });
    return (res?.cp && !res.error && store.set(res.cp), !0);
  };
  return (
    loadAutoButton.addEventListener('click', async () => {
      (await loadSlot('auto')) && (screen.close({ action: 'auto' }), ui.resume());
    }),
    loadOtherButton.addEventListener('click', async () => {
      (await ui.open('cargar', { noConfirm: !0 }))?.slot && (screen.close({ action: 'cargar' }), ui.resume());
    }),
    menuButton.addEventListener('click', () => {
      (screen.close({ action: 'menu' }), game.go('menu'));
    }),
    requestAnimationFrame(() =>
      (loadAutoButton.disabled ? loadOtherButton : loadAutoButton).focus({ preventScroll: !0 }),
    ),
    game.audio?.music?.('derrota', { fade: 1.5 }),
    { dismissable: !1, onEscape() {} }
  );
}

export { pantallaDerrota as default, opcionesDerrota as options };
