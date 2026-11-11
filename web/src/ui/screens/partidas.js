// ui/screens/partidas.js
// Reconstruido de publicado/juego.js (módulo __esm «kv»). Nombres locales aún minificados.

import { iconHtml, escapeHtml, elem, makeButton, formatDuration, formatDate } from '../dom.js';
import { screenFrame, makeTabs } from '../modal.js';

function opcionesPartidas() {
  return { width: '52rem', height: '44rem' };
}
function pantallaPartidas(o, e, t, a) {
  let n = a.store,
    s = e.screen === 'guardar' && n.cp ? 'guardar' : 'cargar',
    i = screenFrame(o, {
      title: s === 'guardar' ? 'Guardar partida' : 'Cargar partida',
      ic: s === 'guardar' ? 'save' : 'load',
    });
  if ((i.body.classList.add('mg-fill'), n.cp)) {
    let h = makeTabs(
      [
        { id: 'guardar', label: 'Guardar', icon: 'save' },
        { id: 'cargar', label: 'Cargar', icon: 'load' },
      ],
      s,
      (p) => {
        ((s = p), (i.title.textContent = p === 'guardar' ? 'Guardar partida' : 'Cargar partida'), u());
      },
    );
    ((i.tabs.hidden = !1), i.tabs.append(h));
  }
  let r = elem('div.mg-saves.mg-scroll', { style: 'overflow-y:auto;min-height:0' });
  (i.body.append(r), (i.foot.hidden = !1));
  let l = elem('span.mg-store-info'),
    c = elem('input', { type: 'file', accept: '.json,application/json', hidden: !0 });
  (c.addEventListener('change', async () => {
    let h = c.files?.[0];
    if (h) {
      try {
        let p = Ev.slice(2).find((m) => !d.has(m)) || '8';
        if (
          (await n.importFile(h, p),
          t.toast(`Partida importada en la ranura ${p}.`, 'bien'),
          !e.keepCp && s === 'cargar')
        )
          return o.close({ slot: p, imported: !0 });
        u();
      } catch (p) {
        t.toast(p.message || 'No es una partida v\xE1lida.', 'mal');
      }
      c.value = '';
    }
  }),
    i.foot.append(
      l,
      elem('span.mg-grow'),
      c,
      makeButton('Importar partida', { icon: 'unpack', size: 'sm', onclick: () => c.click() }),
    ),
    n
      .cloud()
      .then(
        (h) =>
          (l.innerHTML = `${iconHtml(h ? 'cloud' : 'save')}<span>${h ? 'Guardado en la nube (tu cuenta)' : 'Guardado en este navegador'}</span>`),
      ));
  let d = new Map();
  async function u() {
    r.innerHTML = `<div class="mg-vacio">${iconHtml('hourglass')}Buscando partidas\u2026</div>`;
    let h = await n.list().catch(() => []);
    ((d = new Map(h.map((m) => [m.slot, m.meta]))), (r.innerHTML = ''));
    let p =
      s === 'guardar'
        ? Ev.filter((m) => m !== 'auto')
        : [...new Set([...h.map((m) => m.slot), ...Ev])].filter((m) => d.has(m));
    if (!p.length) {
      r.innerHTML = `<div class="mg-vacio">${iconHtml('load')}No hay partidas guardadas.</div>`;
      return;
    }
    for (let m of p) {
      let _ = d.get(m),
        b = elem(`div.mg-save${_ ? '' : '.vacia'}`);
      b.innerHTML = `<span class="mg-save-n">${iconHtml(m === 'auto' ? 'hourglass' : m === 'rapida' ? 'fast' : 'save')}${escapeHtml(am(m))}</span>
        <span class="mg-save-t">${_ ? `<b>${escapeHtml(_.hero)} \xB7 nivel ${escapeHtml(_.level)}</b><span>${escapeHtml(_.place || '')}${_.day ? ` \xB7 d\xEDa ${escapeHtml(_.day)}` : ''} \xB7 ${escapeHtml(formatDuration(_.playtime))} de juego</span><span>${escapeHtml((_.party || []).join(', '))}${_.savedAt ? ` \xB7 ${escapeHtml(formatDate(_.savedAt))}` : ''}</span>` : '<b class="mg-dim">Vac\xEDa</b>'}</span>`;
      let f = elem('div.mg-save-acts');
      (s === 'guardar'
        ? f.append(
            makeButton(_ ? 'Sobrescribir' : 'Guardar', {
              icon: 'save',
              size: 'sm',
              variant: _ ? '' : 'primary',
              onclick: async () => {
                if (
                  _ &&
                  !(await t.confirm(`Se sustituir\xE1 la partida de ${_.hero} (${am(m).toLowerCase()}).`, {
                    titulo: '\xBFSobrescribir?',
                    si: 'Sobrescribir',
                  }))
                )
                  return;
                let v = await n.save(m);
                (t.toast(
                  v ? `Partida guardada (${am(m).toLowerCase()}).` : 'No se ha podido guardar.',
                  v ? 'bien' : 'mal',
                ),
                  v && o.close({ slot: m }));
              },
            }),
          )
        : _ &&
          f.append(
            makeButton('Cargar', {
              icon: 'load',
              size: 'sm',
              variant: 'primary',
              onclick: async () => {
                if (
                  n.cp &&
                  !e.noConfirm &&
                  !(await t.confirm('Lo que no hayas guardado de la partida actual se perder\xE1.', {
                    titulo: '\xBFCargar esta partida?',
                    si: 'Cargar',
                  }))
                )
                  return;
                let v = await n.load(m);
                if (!v) return t.toast('No se ha podido cargar.', 'mal');
                let x = t.R.call('cp_load', { cp: v });
                (x?.cp && !x.error && n.set(x.cp), o.close({ slot: m }));
              },
            }),
          ),
        _ &&
          (f.append(
            makeButton('Exportar', {
              icon: 'cloud_down',
              size: 'sm',
              variant: 'ghost',
              onclick: async () =>
                t.toast(
                  (await n.exportSlot(m)) ? 'Partida exportada a un fichero.' : 'No se ha podido exportar.',
                  'info',
                ),
            }),
          ),
          m !== 'auto' &&
            f.append(
              makeButton('Borrar', {
                icon: 'trash',
                size: 'sm',
                variant: 'danger',
                onclick: async () => {
                  (await t.confirm(
                    `\xBFBorrar la partida de ${_.hero} (${am(m).toLowerCase()})? No se puede deshacer.`,
                    { titulo: 'Borrar partida', si: 'Borrar', peligro: !0 },
                  )) && (await n.remove(m), u());
                },
              }),
            )),
        b.append(f),
        r.append(b));
    }
  }
  u();
}
const Ev = ['auto', 'rapida', '1', '2', '3', '4', '5', '6', '7', '8'];
const am = (o) => (o === 'auto' ? 'Autom\xE1tico' : o === 'rapida' ? 'R\xE1pido' : `Ranura ${o}`);

export { pantallaPartidas as default, opcionesPartidas as options };
