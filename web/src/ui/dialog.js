// ui/dialog.js
// Reconstruido de publicado/juego.js (módulo __esm «Yw»). Nombres locales aún minificados.

import { iconHtml, escapeHtml, richText, elem, Cn, en, sleep, reducedMotion } from './dom.js';
import { Wi, Xi } from './dice.js';
import { sa } from './tooltip.js';

function Xw(o, e) {
  let t = null,
    a = null,
    n = 0,
    s = [];
  function i() {
    return (
      (t = elem('section.mg-dlg', { role: 'dialog', 'aria-label': 'Conversaci\xF3n' })),
      (t.innerHTML = `
      <div class="mg-dlg-in mg-panel mg-orn">
        <div class="mg-dlg-port"><div class="mg-dlg-marco"></div></div>
        <div class="mg-dlg-main">
          <header class="mg-dlg-head"><b class="mg-dlg-name"></b><span class="mg-dlg-title"></span></header>
          <div class="mg-dlg-log mg-scroll" aria-live="polite"></div>
          <ol class="mg-dlg-opts" role="list"></ol>
        </div>
      </div>`),
      o.root.append(t),
      t.querySelector('.mg-dlg-log').addEventListener('click', () => a?.finish?.()),
      e.bus?.on('dialog:close', () => _()),
      t
    );
  }
  function r(f) {
    return e.store.cp?.members?.[f]?.name?.split(' ')[0] || f || '';
  }
  function l(f) {
    let x = t.querySelector('.mg-dlg-port').querySelector('.mg-dlg-marco');
    x.innerHTML = '';
    let g = !f.speaker;
    if ((t.classList.toggle('narrador', g), g)) return;
    let y = f.npc || f.who || null,
      w = f.portrait || (y && o.portrait(y)) || null;
    x.append(Cn(w, { name: f.speaker, ic: f.icon || 'person', cls: 'mg-dlg-face', id: w ? null : y }));
  }
  function c(f, v) {
    f.innerHTML = v;
    let x = Number(e.store.settings.textSpeed ?? 1);
    if (x >= 50 || reducedMotion()) return { done: Promise.resolve(), finish() {} };
    let g = [],
      y = document.createTreeWalker(f, NodeFilter.SHOW_TEXT);
    for (let z = y.nextNode(); z; z = y.nextNode()) (g.push([z, z.textContent]), (z.textContent = ''));
    let w = 48 * x,
      k = !1,
      T,
      E = new Promise((z) => (T = z)),
      S = () => {
        if (!k) {
          k = !0;
          for (let [z, D] of g) z.textContent = D;
          (f.classList.remove('escribiendo'), T());
        }
      };
    return (
      f.classList.add('escribiendo'),
      (async () => {
        let z = performance.now(),
          D = 0;
        for (let [M, R] of g) {
          let A = 0;
          for (; A < R.length && !k;) {
            await new Promise((j) => requestAnimationFrame(j));
            let P = performance.now(),
              I = Math.floor(((P - z) / 1e3) * w) - D;
            if (I <= 0) continue;
            let U = Math.min(I, R.length - A);
            ((A += U),
              (D += U),
              (M.textContent = R.slice(0, A)),
              /[.!?…:]$/.test(M.textContent) && A < R.length && (await sleep(160 / x), (z += 160 / x)));
          }
          if (k) return;
        }
        S();
      })(),
      { done: E, finish: S }
    );
  }
  function d(f) {
    let v = f.who ? r(f.who) : '',
      x = Array.isArray(f.d20) ? f.d20 : [f.d20],
      g = elem('div.mg-roll.mg-dlg-roll'),
      y = x.map((D) => Wi(20, '', { size: 'sm' })),
      w = f.adv || f.mode > 0,
      k = f.dis || f.mode < 0,
      T = f.kept ?? (x.length > 1 ? (w && !k ? Math.max(...x) : k && !w ? Math.min(...x) : x[0]) : x[0]),
      E = elem('div.mg-roll-txt');
    E.innerHTML = `<b>${escapeHtml(f.label || 'Tirada')}${v ? ` \xB7 ${escapeHtml(v)}` : ''}</b><span>${escapeHtml(T)} ${en(
      f.mod || 0,
    )
      .replace('+', '+ ')
      .replace(
        '\u2212',
        '\u2212 ',
      )} = <b class="mg-num" style="color:var(--pergamino);font:inherit;font-weight:700">${escapeHtml(f.total)}</b>${f.dc != null ? ` contra CD ${escapeHtml(f.dc)}` : ''}</span>`;
    let S = elem(
      `span.mg-roll-res.${f.success ? 'ok' : 'ko'}`,
      f.success ? (f.crit ? '\xA1\xC9xito cr\xEDtico!' : '\xC9xito') : 'Fallo',
    );
    if ((g.append(...y, E, S), Array.isArray(f.group) && f.group.length)) {
      let D = elem('div.mg-roll-group');
      for (let M of f.group)
        D.append(
          elem(
            `span.${M.success ? 'ok' : 'ko'}`,
            `${M.name ? String(M.name).split(' ')[0] : r(M.id || M.who)} ${M.total}`,
          ),
        );
      g.append(D);
    }
    return {
      el: g,
      play: async () => {
        if (
          ((E.style.opacity = '0'),
          await Promise.all(y.map((D, M) => Xi(D, x[M], { ms: 700 + M * 120 }))),
          x.length > 1)
        ) {
          let D = x.indexOf(T);
          y.forEach((M, R) => R !== D && M.classList.add('descartado'));
        }
        ((E.style.transition = 'opacity .25s'),
          (E.style.opacity = '1'),
          await sleep(200),
          S.classList.add('on'),
          e.bus?.emit('ui:roll', { success: !!f.success, crit: !!f.crit }),
          await sleep(350));
      },
    };
  }
  function u(f, v) {
    let x = t.querySelector('.mg-dlg-log'),
      g = elem(`div.mg-dlg-line.${f}`, { html: v });
    for (x.append(g); x.children.length > 14;) x.firstChild.remove();
    return g;
  }
  async function h(f) {
    if ((clearTimeout(n), !f)) return _();
    if (f.who && !f.speaker) {
      let S = e.store.cp?.members?.[f.who];
      f = { ...f, speaker: S?.name || f.who, title: f.title ?? S?.title ?? '', npc: f.npc || f.who };
    }
    (t || i(),
      (t.hidden = !1),
      t.classList.remove('fuera'),
      o.root.classList.add('con-dialogo'),
      o.hud?.dim?.(!0));
    for (let S of t.querySelectorAll('.mg-dlg-line.actual')) S.classList.replace('actual', 'pasada');
    ((t.querySelector('.mg-dlg-name').textContent = f.speaker || ''),
      (t.querySelector('.mg-dlg-title').textContent = f.title || ''),
      t.setAttribute('aria-label', f.speaker ? `Conversaci\xF3n con ${f.speaker}` : 'Narraci\xF3n'),
      l(f));
    let v = t.querySelector('.mg-dlg-opts');
    if (((v.innerHTML = ''), v.classList.remove('on'), f.roll)) {
      let S = d(f.roll);
      (t.querySelector('.mg-dlg-log').append(S.el), S.el.scrollIntoView({ block: 'end' }), await S.play());
    }
    let x = u(
        `actual${f.speaker ? '' : ' narracion'}`,
        `<p class="mg-p">${richText(f.text || '').replace(/<\/p><p class="mg-p">/g, '</p><p class="mg-p">')}</p>`,
      ),
      g = t.querySelector('.mg-dlg-log'),
      y = c(x, x.innerHTML),
      w = setInterval(() => (g.scrollTop = g.scrollHeight), 80),
      k,
      T = new Promise((S) => (k = S));
    return (
      (a = { node: f, resolve: k, finish: y.finish, opts: [] }),
      y.done.then(() => {
        (clearInterval(w), (g.scrollTop = g.scrollHeight), p(f));
      }),
      await T
    );
  }
  function p(f) {
    let v = t.querySelector('.mg-dlg-opts');
    v.innerHTML = '';
    let x = f.options?.length ? f.options : [{ text: 'Continuar', kind: 'continue' }];
    ((a.opts = []),
      x.forEach((g, y) => {
        let w = elem('li'),
          k = elem(`button.mg-dlg-opt${g.kind ? '.k-' + g.kind : ''}`, {
            disabled: !!g.disabled,
            'data-n': y + 1,
          }),
          T = g.tag ? `<span class="mg-dlg-tag">${escapeHtml(g.tag)}</span> ` : '',
          E = iz[g.tone];
        ((k.innerHTML = `<span class="mg-dlg-n">${y + 1}.</span><span class="mg-dlg-t">${T}${richText(g.text)}${g.disabled && g.reason ? ` <small>(${escapeHtml(g.reason)})</small>` : ''}</span>${E ? `<span class="mg-dlg-tone" title="${escapeHtml(E[1])}">${iconHtml(E[0])}</span>` : ''}`),
          g.hint && sa(k, g.hint),
          k.addEventListener('click', () => m(y)),
          w.append(k),
          v.append(w),
          a.opts.push(k));
      }),
      requestAnimationFrame(() => v.classList.add('on')),
      matchMedia('(pointer: coarse)').matches ||
        a.opts.find((g) => !g.disabled)?.focus({ preventScroll: !0 }));
  }
  function m(f) {
    if (!a || !a.opts[f] || a.opts[f].disabled) return;
    let v = a.node,
      x = (v.options || [])[f],
      g = a.resolve;
    (x &&
      x.kind !== 'continue' &&
      u(
        'jugador',
        `<p class="mg-p">${x.tag ? `<span class="mg-dlg-tag">${escapeHtml(x.tag)}</span> ` : ''}${richText(x.text)}</p>`,
      ),
      (t.querySelector('.mg-dlg-opts').innerHTML = ''),
      (a = null),
      g(f),
      x?.kind === 'end' || (!v.options?.length && v.end) ? _() : (n = setTimeout(() => _(), 1500)));
  }
  function _() {
    if ((clearTimeout(n), !(!t || t.hidden))) {
      if (a) {
        let f = a.resolve;
        ((a = null), f(-1));
      }
      (t.classList.add('fuera'),
        o.root.classList.remove('con-dialogo'),
        o.hud?.dim?.(!1),
        setTimeout(() => {
          t.classList.contains('fuera') &&
            ((t.hidden = !0), (t.querySelector('.mg-dlg-log').innerHTML = ''), (s.length = 0));
        }, 260));
    }
  }
  function b(f) {
    if (!t || t.hidden) return !1;
    if (/^[1-9]$/.test(f.key) && a && t.querySelector('.mg-dlg-line.escribiendo')) return (a.finish(), !0);
    if (/^[1-9]$/.test(f.key) && a?.opts?.length) {
      let v = Number(f.key) - 1;
      if (a.opts[v]) return (m(v), !0);
    }
    if (f.key === ' ' || f.key === 'Enter') {
      if (a && t.querySelector('.mg-dlg-line.escribiendo')) return (a.finish(), !0);
      if (document.activeElement?.classList.contains('mg-dlg-opt')) return !1;
      if (a?.opts?.length === 1) return (m(0), !0);
    }
    if ((f.key === 'ArrowDown' || f.key === 'ArrowUp') && a?.opts?.length) {
      let v = a.opts.indexOf(document.activeElement),
        x = a.opts.length;
      return (a.opts[(v + (f.key === 'ArrowDown' ? 1 : x - 1) + x) % x]?.focus(), !0);
    }
    return !1;
  }
  return { show: h, close: _, key: b, isOpen: () => !!t && !t.hidden && !t.classList.contains('fuera') };
}
const iz = {
  amable: ['hearts', 'Amable'],
  sarcastico: ['laugh', 'Sarc\xE1stico'],
  frio: ['frost', 'Fr\xEDo'],
  firme: ['shield', 'Firme'],
  agresivo: ['rage', 'Agresivo'],
};

export { Xw };
