// ui/screens/diario.js
// Pantalla «diario»: misiones (en curso y terminadas) y notas del jugador.
// La registra ui/index.js (SCREENS) y se abre con ui.open('diario').
// Reconstruido de publicado/juego.js (módulo __esm «VT»).

import { iconHtml, escapeHtml, richText, elem, makeButton } from '../dom.js';
import { screenFrame, makeTabs } from '../modal.js';

/** Opciones de la capa (tamaño, modal, clases) que ui.open pasa a ScreenStack.open. */
function opcionesDiario() {
  return { width: '64rem', height: '44rem' };
}
/**
 * Construye la pantalla en `screen.el` (`params` son los de ui.open).
 * Devuelve los ganchos de la capa (onKey, onEscape, dispose…), si los hay.
 */
function pantallaDiario(screen, params, ui, game) {
  let currentCp = () => game.store.cp,
    frame = screenFrame(screen, { title: 'Diario', ic: 'open_book' });
  frame.body.classList.add('mg-fill');
  let tab = params.tab || 'misiones',
    quests = [];
  try {
    quests = game.story?.quests?.() || [];
  } catch (err) {
    console.warn('[diario]', err);
  }
  let open = quests.filter((quest) => !['done', 'completed', 'failed'].includes(quest.state)),
    closed = quests.filter((quest) => ['done', 'completed', 'failed'].includes(quest.state)),
    selected = params.quest || open[0]?.id || closed[0]?.id || null,
    tabs = makeTabs(
      [
        { id: 'misiones', label: 'Misiones', icon: 'scroll', badge: open.length || '' },
        { id: 'notas', label: 'Notas', icon: 'quill' },
      ],
      tab,
      (id) => {
        ((tab = id), render());
      },
    );
  ((frame.tabs.hidden = !1), frame.tabs.append(tabs));
  let page = elem('div.mg-journal');
  frame.body.append(page);
  function questRow(quest) {
    let state = quest.state || 'active',
      row = elem(
        `button.mg-row.mg-quest-row${state === 'failed' ? '.fallida' : ['done', 'completed'].includes(state) ? '.hecha' : ''}`,
        { 'aria-selected': String(quest.id === selected) },
      ),
      steps = quest.steps || [],
      doneSteps = steps.filter((step) => step.done).length;
    return (
      (row.innerHTML = `<span class="mg-row-ico">${iconHtml(state === 'failed' ? 'cross' : ['done', 'completed'].includes(state) ? 'check' : quest.main ? 'wax_seal' : 'scroll')}</span><span class="mg-row-t"><b>${escapeHtml(quest.name)}</b><small>${escapeHtml(QUEST_STATES[state] || '')}${steps.length ? ` \xB7 ${doneSteps}/${steps.length}` : ''}</small></span><span></span>`),
      row.addEventListener('click', () => {
        ((selected = quest.id), render());
      }),
      row
    );
  }
  function renderQuests() {
    let list = elem('div.mg-list.mg-scroll', { style: 'overflow-y:auto;min-height:0;align-content:start' });
    (open.length && list.append(elem('h3.mg-sec', 'En curso'), ...open.map(questRow)),
      closed.length && list.append(elem('h3.mg-sec', 'Terminadas'), ...closed.map(questRow)),
      quests.length || list.append(elem('div.mg-vacio', 'A\xFAn no ten\xE9is ninguna misi\xF3n.')));
    let sheet = elem('article.mg-page.mg-parchment.mg-scroll', { style: 'overflow-y:auto' }),
      quest = quests.find((quest) => quest.id === selected);
    if (quest) {
      if (
        (sheet.append(
          elem('h2.mg-h2', quest.name),
          elem(
            'div.mg-page-sub',
            `${quest.main ? 'Misi\xF3n principal \xB7 ' : ''}${QUEST_STATES[quest.state || 'active'] || ''}`,
          ),
        ),
        quest.desc && sheet.append(elem('div', { html: `<p class="mg-p">${richText(quest.desc)}</p>` })),
        quest.steps?.length)
      ) {
        sheet.append(elem('div.mg-hr', elem('i')));
        let stepsList = elem('ul.mg-steps');
        for (let step of quest.steps) stepsList.append(elem(`li${step.done ? '.hecho' : ''}`, step.text));
        sheet.append(stepsList);
      }
      quest.reward &&
        sheet.append(elem('p.mg-p', { style: 'margin-top:1rem' }, elem('b', 'Recompensa: '), quest.reward));
    } else
      sheet.append(
        elem('p.mg-p', { style: 'font-style:italic' }, 'Las p\xE1ginas est\xE1n en blanco\u2026 por ahora.'),
      );
    page.append(list, sheet);
  }
  function renderNotes() {
    let notes = [...(currentCp()?.journal || [])]
        .map((note, index) => (typeof note == 'string' ? { text: note, i: index } : { ...note, i: index }))
        .reverse(),
      sheet = elem('article.mg-page.mg-parchment.mg-scroll', { style: 'overflow-y:auto;grid-column:1/-1' });
    sheet.append(
      elem('h2.mg-h2', 'Notas'),
      elem('div.mg-page-sub', 'Lo que hab\xE9is visto, o\xEDdo y apuntado'),
    );
    let editor = elem('div.mg-col', { style: 'gap:.4rem;margin-bottom:.8rem' }),
      textarea = elem('textarea.mg-input', {
        placeholder: 'Escribe una nota\u2026',
        'aria-label': 'Nota nueva',
        rows: '2',
        maxlength: '600',
      });
    (editor.append(
      textarea,
      elem(
        'div',
        makeButton('Apuntar', {
          icon: 'quill',
          size: 'sm',
          onclick: () => {
            let text = textarea.value.trim();
            !text ||
              !currentCp() ||
              ((currentCp().journal ??= []),
              currentCp().journal.push({ text, day: currentCp().day || 1, own: !0 }),
              game.bus?.emit('cp:changed', { cp: currentCp() }),
              render());
          },
        }),
      ),
    ),
      currentCp() && sheet.append(editor),
      notes.length ||
        sheet.append(
          elem('p.mg-p', { style: 'font-style:italic' }, 'Todav\xEDa no hab\xE9is apuntado nada.'),
        ));
    for (let note of notes) {
      let noteEl = elem(`div.mg-note${note.own ? '.propia' : ''}`, {
        html: `${note.day ? `<small>D\xEDa ${escapeHtml(note.day)}${note.own ? ' \xB7 nota tuya' : ''}</small>` : ''}${richText(note.text || '')}`,
      });
      if (note.own) {
        let deleteButton = makeButton('Borrar', {
          size: 'sm',
          variant: 'ghost',
          onclick: () => {
            (currentCp().journal.splice(note.i, 1), render());
          },
        });
        ((deleteButton.style.float = 'right'), noteEl.prepend(deleteButton));
      }
      sheet.append(noteEl);
    }
    page.append(sheet);
  }
  function render() {
    ((page.innerHTML = ''),
      (page.style.gridTemplateColumns = tab === 'notas' ? 'minmax(0,1fr)' : ''),
      tab === 'misiones' ? renderQuests() : renderNotes());
  }
  return (
    render(),
    {
      onKey(ev) {
        return ev.key.toLowerCase() === 'j' && !ev.target.closest?.('input,textarea')
          ? (screen.close(null), !0)
          : !1;
      },
    }
  );
}
const QUEST_STATES = { active: 'En curso', done: 'Cumplida', completed: 'Cumplida', failed: 'Fallida' };

export { pantallaDiario as default, opcionesDiario as options };
