// ui/screens/diario.js
// Reconstruido de publicado/juego.js (módulo __esm «VT»). Nombres locales aún minificados.

import { iconHtml, escapeHtml, richText, elem, makeButton } from '../dom.js';
import { screenFrame, makeTabs } from '../modal.js';

function opcionesDiario() {
  return { width: '64rem', height: '44rem' };
}
function pantallaDiario(o, e, t, a) {
  let n = () => a.store.cp,
    s = screenFrame(o, { title: 'Diario', ic: 'open_book' });
  s.body.classList.add('mg-fill');
  let i = e.tab || 'misiones',
    r = [];
  try {
    r = a.story?.quests?.() || [];
  } catch (f) {
    console.warn('[diario]', f);
  }
  let l = r.filter((f) => !['done', 'completed', 'failed'].includes(f.state)),
    c = r.filter((f) => ['done', 'completed', 'failed'].includes(f.state)),
    d = e.quest || l[0]?.id || c[0]?.id || null,
    u = makeTabs(
      [
        { id: 'misiones', label: 'Misiones', icon: 'scroll', badge: l.length || '' },
        { id: 'notas', label: 'Notas', icon: 'quill' },
      ],
      i,
      (f) => {
        ((i = f), b());
      },
    );
  ((s.tabs.hidden = !1), s.tabs.append(u));
  let h = elem('div.mg-journal');
  s.body.append(h);
  function p(f) {
    let v = f.state || 'active',
      x = elem(
        `button.mg-row.mg-quest-row${v === 'failed' ? '.fallida' : ['done', 'completed'].includes(v) ? '.hecha' : ''}`,
        { 'aria-selected': String(f.id === d) },
      ),
      g = f.steps || [],
      y = g.filter((w) => w.done).length;
    return (
      (x.innerHTML = `<span class="mg-row-ico">${iconHtml(v === 'failed' ? 'cross' : ['done', 'completed'].includes(v) ? 'check' : f.main ? 'wax_seal' : 'scroll')}</span><span class="mg-row-t"><b>${escapeHtml(f.name)}</b><small>${escapeHtml(UT[v] || '')}${g.length ? ` \xB7 ${y}/${g.length}` : ''}</small></span><span></span>`),
      x.addEventListener('click', () => {
        ((d = f.id), b());
      }),
      x
    );
  }
  function m() {
    let f = elem('div.mg-list.mg-scroll', { style: 'overflow-y:auto;min-height:0;align-content:start' });
    (l.length && f.append(elem('h3.mg-sec', 'En curso'), ...l.map(p)),
      c.length && f.append(elem('h3.mg-sec', 'Terminadas'), ...c.map(p)),
      r.length || f.append(elem('div.mg-vacio', 'A\xFAn no ten\xE9is ninguna misi\xF3n.')));
    let v = elem('article.mg-page.mg-parchment.mg-scroll', { style: 'overflow-y:auto' }),
      x = r.find((g) => g.id === d);
    if (x) {
      if (
        (v.append(
          elem('h2.mg-h2', x.name),
          elem(
            'div.mg-page-sub',
            `${x.main ? 'Misi\xF3n principal \xB7 ' : ''}${UT[x.state || 'active'] || ''}`,
          ),
        ),
        x.desc && v.append(elem('div', { html: `<p class="mg-p">${richText(x.desc)}</p>` })),
        x.steps?.length)
      ) {
        v.append(elem('div.mg-hr', elem('i')));
        let g = elem('ul.mg-steps');
        for (let y of x.steps) g.append(elem(`li${y.done ? '.hecho' : ''}`, y.text));
        v.append(g);
      }
      x.reward && v.append(elem('p.mg-p', { style: 'margin-top:1rem' }, elem('b', 'Recompensa: '), x.reward));
    } else
      v.append(
        elem('p.mg-p', { style: 'font-style:italic' }, 'Las p\xE1ginas est\xE1n en blanco\u2026 por ahora.'),
      );
    h.append(f, v);
  }
  function _() {
    let f = [...(n()?.journal || [])]
        .map((y, w) => (typeof y == 'string' ? { text: y, i: w } : { ...y, i: w }))
        .reverse(),
      v = elem('article.mg-page.mg-parchment.mg-scroll', { style: 'overflow-y:auto;grid-column:1/-1' });
    v.append(
      elem('h2.mg-h2', 'Notas'),
      elem('div.mg-page-sub', 'Lo que hab\xE9is visto, o\xEDdo y apuntado'),
    );
    let x = elem('div.mg-col', { style: 'gap:.4rem;margin-bottom:.8rem' }),
      g = elem('textarea.mg-input', {
        placeholder: 'Escribe una nota\u2026',
        'aria-label': 'Nota nueva',
        rows: '2',
        maxlength: '600',
      });
    (x.append(
      g,
      elem(
        'div',
        makeButton('Apuntar', {
          icon: 'quill',
          size: 'sm',
          onclick: () => {
            let y = g.value.trim();
            !y ||
              !n() ||
              ((n().journal ??= []),
              n().journal.push({ text: y, day: n().day || 1, own: !0 }),
              a.bus?.emit('cp:changed', { cp: n() }),
              b());
          },
        }),
      ),
    ),
      n() && v.append(x),
      f.length ||
        v.append(elem('p.mg-p', { style: 'font-style:italic' }, 'Todav\xEDa no hab\xE9is apuntado nada.')));
    for (let y of f) {
      let w = elem(`div.mg-note${y.own ? '.propia' : ''}`, {
        html: `${y.day ? `<small>D\xEDa ${escapeHtml(y.day)}${y.own ? ' \xB7 nota tuya' : ''}</small>` : ''}${richText(y.text || '')}`,
      });
      if (y.own) {
        let k = makeButton('Borrar', {
          size: 'sm',
          variant: 'ghost',
          onclick: () => {
            (n().journal.splice(y.i, 1), b());
          },
        });
        ((k.style.float = 'right'), w.prepend(k));
      }
      v.append(w);
    }
    h.append(v);
  }
  function b() {
    ((h.innerHTML = ''),
      (h.style.gridTemplateColumns = i === 'notas' ? 'minmax(0,1fr)' : ''),
      i === 'misiones' ? m() : _());
  }
  return (
    b(),
    {
      onKey(f) {
        return f.key.toLowerCase() === 'j' && !f.target.closest?.('input,textarea')
          ? (o.close(null), !0)
          : !1;
      },
    }
  );
}
const UT = { active: 'En curso', done: 'Cumplida', completed: 'Cumplida', failed: 'Fallida' };

export { pantallaDiario as default, opcionesDiario as options };
