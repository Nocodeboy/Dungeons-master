// ui/screens/partidas.js
// Reconstruido de publicado/juego.js (módulo __esm «kv»). Nombres locales aún minificados.

import { iconHtml, escapeHtml, elem, makeButton, formatDuration, formatDate } from '../dom.js';
import { screenFrame, makeTabs } from '../modal.js';

function opcionesPartidas() {
  return { width: '52rem', height: '44rem' };
}
function pantallaPartidas(screen, params, ui, game) {
  let store = game.store,
    mode = params.screen === 'guardar' && store.cp ? 'guardar' : 'cargar',
    frame = screenFrame(screen, {
      title: mode === 'guardar' ? 'Guardar partida' : 'Cargar partida',
      ic: mode === 'guardar' ? 'save' : 'load',
    });
  if ((frame.body.classList.add('mg-fill'), store.cp)) {
    let tabs = makeTabs(
      [
        { id: 'guardar', label: 'Guardar', icon: 'save' },
        { id: 'cargar', label: 'Cargar', icon: 'load' },
      ],
      mode,
      (id) => {
        ((mode = id),
          (frame.title.textContent = id === 'guardar' ? 'Guardar partida' : 'Cargar partida'),
          render());
      },
    );
    ((frame.tabs.hidden = !1), frame.tabs.append(tabs));
  }
  let list = elem('div.mg-saves.mg-scroll', { style: 'overflow-y:auto;min-height:0' });
  (frame.body.append(list), (frame.foot.hidden = !1));
  let storeInfo = elem('span.mg-store-info'),
    fileInput = elem('input', { type: 'file', accept: '.json,application/json', hidden: !0 });
  (fileInput.addEventListener('change', async () => {
    let file = fileInput.files?.[0];
    if (file) {
      try {
        let slot = SLOTS.slice(2).find((free) => !metas.has(free)) || '8';
        if (
          (await store.importFile(file, slot),
          ui.toast(`Partida importada en la ranura ${slot}.`, 'bien'),
          !params.keepCp && mode === 'cargar')
        )
          return screen.close({ slot, imported: !0 });
        render();
      } catch (err) {
        ui.toast(err.message || 'No es una partida v\xE1lida.', 'mal');
      }
      fileInput.value = '';
    }
  }),
    frame.foot.append(
      storeInfo,
      elem('span.mg-grow'),
      fileInput,
      makeButton('Importar partida', { icon: 'unpack', size: 'sm', onclick: () => fileInput.click() }),
    ),
    store
      .cloud()
      .then(
        (cloud) =>
          (storeInfo.innerHTML = `${iconHtml(cloud ? 'cloud' : 'save')}<span>${cloud ? 'Guardado en la nube (tu cuenta)' : 'Guardado en este navegador'}</span>`),
      ));
  let metas = new Map();
  async function render() {
    list.innerHTML = `<div class="mg-vacio">${iconHtml('hourglass')}Buscando partidas\u2026</div>`;
    let saves = await store.list().catch(() => []);
    ((metas = new Map(saves.map((save) => [save.slot, save.meta]))), (list.innerHTML = ''));
    let slots =
      mode === 'guardar'
        ? SLOTS.filter((slot) => slot !== 'auto')
        : [...new Set([...saves.map((save) => save.slot), ...SLOTS])].filter((slot) => metas.has(slot));
    if (!slots.length) {
      list.innerHTML = `<div class="mg-vacio">${iconHtml('load')}No hay partidas guardadas.</div>`;
      return;
    }
    for (let slot of slots) {
      let meta = metas.get(slot),
        row = elem(`div.mg-save${meta ? '' : '.vacia'}`);
      row.innerHTML = `<span class="mg-save-n">${iconHtml(slot === 'auto' ? 'hourglass' : slot === 'rapida' ? 'fast' : 'save')}${escapeHtml(slotName(slot))}</span>
        <span class="mg-save-t">${meta ? `<b>${escapeHtml(meta.hero)} \xB7 nivel ${escapeHtml(meta.level)}</b><span>${escapeHtml(meta.place || '')}${meta.day ? ` \xB7 d\xEDa ${escapeHtml(meta.day)}` : ''} \xB7 ${escapeHtml(formatDuration(meta.playtime))} de juego</span><span>${escapeHtml((meta.party || []).join(', '))}${meta.savedAt ? ` \xB7 ${escapeHtml(formatDate(meta.savedAt))}` : ''}</span>` : '<b class="mg-dim">Vac\xEDa</b>'}</span>`;
      let acts = elem('div.mg-save-acts');
      (mode === 'guardar'
        ? acts.append(
            makeButton(meta ? 'Sobrescribir' : 'Guardar', {
              icon: 'save',
              size: 'sm',
              variant: meta ? '' : 'primary',
              onclick: async () => {
                if (
                  meta &&
                  !(await ui.confirm(
                    `Se sustituir\xE1 la partida de ${meta.hero} (${slotName(slot).toLowerCase()}).`,
                    {
                      titulo: '\xBFSobrescribir?',
                      si: 'Sobrescribir',
                    },
                  ))
                )
                  return;
                let ok = await store.save(slot);
                (ui.toast(
                  ok ? `Partida guardada (${slotName(slot).toLowerCase()}).` : 'No se ha podido guardar.',
                  ok ? 'bien' : 'mal',
                ),
                  ok && screen.close({ slot }));
              },
            }),
          )
        : meta &&
          acts.append(
            makeButton('Cargar', {
              icon: 'load',
              size: 'sm',
              variant: 'primary',
              onclick: async () => {
                if (
                  store.cp &&
                  !params.noConfirm &&
                  !(await ui.confirm('Lo que no hayas guardado de la partida actual se perder\xE1.', {
                    titulo: '\xBFCargar esta partida?',
                    si: 'Cargar',
                  }))
                )
                  return;
                let cp = await store.load(slot);
                if (!cp) return ui.toast('No se ha podido cargar.', 'mal');
                let res = ui.R.call('cp_load', { cp });
                (res?.cp && !res.error && store.set(res.cp), screen.close({ slot }));
              },
            }),
          ),
        meta &&
          (acts.append(
            makeButton('Exportar', {
              icon: 'cloud_down',
              size: 'sm',
              variant: 'ghost',
              onclick: async () =>
                ui.toast(
                  (await store.exportSlot(slot))
                    ? 'Partida exportada a un fichero.'
                    : 'No se ha podido exportar.',
                  'info',
                ),
            }),
          ),
          slot !== 'auto' &&
            acts.append(
              makeButton('Borrar', {
                icon: 'trash',
                size: 'sm',
                variant: 'danger',
                onclick: async () => {
                  (await ui.confirm(
                    `\xBFBorrar la partida de ${meta.hero} (${slotName(slot).toLowerCase()})? No se puede deshacer.`,
                    { titulo: 'Borrar partida', si: 'Borrar', peligro: !0 },
                  )) && (await store.remove(slot), render());
                },
              }),
            )),
        row.append(acts),
        list.append(row));
    }
  }
  render();
}
const SLOTS = ['auto', 'rapida', '1', '2', '3', '4', '5', '6', '7', '8'];
const slotName = (slot) =>
  slot === 'auto' ? 'Autom\xE1tico' : slot === 'rapida' ? 'R\xE1pido' : `Ranura ${slot}`;

export { pantallaPartidas as default, opcionesPartidas as options };
