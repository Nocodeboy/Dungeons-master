// ui/dialog.js
// Caja de diálogo de las conversaciones: retrato, texto que se escribe solo, tiradas con dados, opciones
// numeradas con tono y manejo con teclado. La crea ui/index.js (ui.dialog, ui.dialogClose, ui.dialogOpen).
// Reconstruido de publicado/juego.js (módulo __esm «Yw»).

import { iconHtml, escapeHtml, richText, elem, faceBadge, signed, sleep, reducedMotion } from './dom.js';
import { makeDie, rollDie } from './dice.js';
import { setTip } from './tooltip.js';

/** Devuelve {show(node) → promesa con la opción elegida (-1 si se cierra), close, key(ev), isOpen}. */
function createDialog(ui, game) {
  let box = null,
    pending = null,
    closeTimer = 0,
    history = [];
  function build() {
    return (
      (box = elem('section.mg-dlg', { role: 'dialog', 'aria-label': 'Conversaci\xF3n' })),
      (box.innerHTML = `
      <div class="mg-dlg-in mg-panel mg-orn">
        <div class="mg-dlg-port"><div class="mg-dlg-marco"></div></div>
        <div class="mg-dlg-main">
          <header class="mg-dlg-head"><b class="mg-dlg-name"></b><span class="mg-dlg-title"></span></header>
          <div class="mg-dlg-log mg-scroll" aria-live="polite"></div>
          <ol class="mg-dlg-opts" role="list"></ol>
        </div>
      </div>`),
      ui.root.append(box),
      box.querySelector('.mg-dlg-log').addEventListener('click', () => pending?.finish?.()),
      game.bus?.on('dialog:close', () => close()),
      box
    );
  }
  function firstName(id) {
    return game.store.cp?.members?.[id]?.name?.split(' ')[0] || id || '';
  }
  function showPortrait(node) {
    let frame = box.querySelector('.mg-dlg-port').querySelector('.mg-dlg-marco');
    frame.innerHTML = '';
    let narrator = !node.speaker;
    if ((box.classList.toggle('narrador', narrator), narrator)) return;
    let npcId = node.npc || node.who || null,
      src = node.portrait || (npcId && ui.portrait(npcId)) || null;
    frame.append(
      faceBadge(src, {
        name: node.speaker,
        ic: node.icon || 'person',
        cls: 'mg-dlg-face',
        id: src ? null : npcId,
      }),
    );
  }
  function typewrite(el, html) {
    el.innerHTML = html;
    let speed = Number(game.store.settings.textSpeed ?? 1);
    if (speed >= 50 || reducedMotion()) return { done: Promise.resolve(), finish() {} };
    let texts = [],
      walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let textNode = walker.nextNode(); textNode; textNode = walker.nextNode())
      (texts.push([textNode, textNode.textContent]), (textNode.textContent = ''));
    let charsPerSecond = 48 * speed,
      finished = !1,
      resolveDone,
      done = new Promise((resolve) => (resolveDone = resolve)),
      finish = () => {
        if (!finished) {
          finished = !0;
          for (let [textNode, text] of texts) textNode.textContent = text;
          (el.classList.remove('escribiendo'), resolveDone());
        }
      };
    return (
      el.classList.add('escribiendo'),
      (async () => {
        let start = performance.now(),
          shown = 0;
        for (let [textNode, text] of texts) {
          let pos = 0;
          for (; pos < text.length && !finished;) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
            let now = performance.now(),
              due = Math.floor(((now - start) / 1e3) * charsPerSecond) - shown;
            if (due <= 0) continue;
            let step = Math.min(due, text.length - pos);
            ((pos += step),
              (shown += step),
              (textNode.textContent = text.slice(0, pos)),
              /[.!?…:]$/.test(textNode.textContent) &&
                pos < text.length &&
                (await sleep(160 / speed), (start += 160 / speed)));
          }
          if (finished) return;
        }
        finish();
      })(),
      { done, finish }
    );
  }
  function rollWidget(roll) {
    let who = roll.who ? firstName(roll.who) : '',
      d20s = Array.isArray(roll.d20) ? roll.d20 : [roll.d20],
      el = elem('div.mg-roll.mg-dlg-roll'),
      dice = d20s.map((value) => makeDie(20, '', { size: 'sm' })),
      adv = roll.adv || roll.mode > 0,
      dis = roll.dis || roll.mode < 0,
      kept =
        roll.kept ??
        (d20s.length > 1
          ? adv && !dis
            ? Math.max(...d20s)
            : dis && !adv
              ? Math.min(...d20s)
              : d20s[0]
          : d20s[0]),
      line = elem('div.mg-roll-txt');
    line.innerHTML = `<b>${escapeHtml(roll.label || 'Tirada')}${who ? ` \xB7 ${escapeHtml(who)}` : ''}</b><span>${escapeHtml(kept)} ${signed(
      roll.mod || 0,
    )
      .replace('+', '+ ')
      .replace(
        '\u2212',
        '\u2212 ',
      )} = <b class="mg-num" style="color:var(--pergamino);font:inherit;font-weight:700">${escapeHtml(roll.total)}</b>${roll.dc != null ? ` contra CD ${escapeHtml(roll.dc)}` : ''}</span>`;
    let verdict = elem(
      `span.mg-roll-res.${roll.success ? 'ok' : 'ko'}`,
      roll.success ? (roll.crit ? '\xA1\xC9xito cr\xEDtico!' : '\xC9xito') : 'Fallo',
    );
    if ((el.append(...dice, line, verdict), Array.isArray(roll.group) && roll.group.length)) {
      let group = elem('div.mg-roll-group');
      for (let member of roll.group)
        group.append(
          elem(
            `span.${member.success ? 'ok' : 'ko'}`,
            `${member.name ? String(member.name).split(' ')[0] : firstName(member.id || member.who)} ${member.total}`,
          ),
        );
      el.append(group);
    }
    return {
      el,
      play: async () => {
        if (
          ((line.style.opacity = '0'),
          await Promise.all(dice.map((die, index) => rollDie(die, d20s[index], { ms: 700 + index * 120 }))),
          d20s.length > 1)
        ) {
          let keptIndex = d20s.indexOf(kept);
          dice.forEach((die, index) => index !== keptIndex && die.classList.add('descartado'));
        }
        ((line.style.transition = 'opacity .25s'),
          (line.style.opacity = '1'),
          await sleep(200),
          verdict.classList.add('on'),
          game.bus?.emit('ui:roll', { success: !!roll.success, crit: !!roll.crit }),
          await sleep(350));
      },
    };
  }
  function addLine(cls, html) {
    let log = box.querySelector('.mg-dlg-log'),
      line = elem(`div.mg-dlg-line.${cls}`, { html });
    for (log.append(line); log.children.length > 14;) log.firstChild.remove();
    return line;
  }
  async function show(node) {
    if ((clearTimeout(closeTimer), !node)) return close();
    if (node.who && !node.speaker) {
      let member = game.store.cp?.members?.[node.who];
      node = {
        ...node,
        speaker: member?.name || node.who,
        title: node.title ?? member?.title ?? '',
        npc: node.npc || node.who,
      };
    }
    (box || build(),
      (box.hidden = !1),
      box.classList.remove('fuera'),
      ui.root.classList.add('con-dialogo'),
      ui.hud?.dim?.(!0));
    for (let line of box.querySelectorAll('.mg-dlg-line.actual')) line.classList.replace('actual', 'pasada');
    ((box.querySelector('.mg-dlg-name').textContent = node.speaker || ''),
      (box.querySelector('.mg-dlg-title').textContent = node.title || ''),
      box.setAttribute('aria-label', node.speaker ? `Conversaci\xF3n con ${node.speaker}` : 'Narraci\xF3n'),
      showPortrait(node));
    let optsList = box.querySelector('.mg-dlg-opts');
    if (((optsList.innerHTML = ''), optsList.classList.remove('on'), node.roll)) {
      let rollBox = rollWidget(node.roll);
      (box.querySelector('.mg-dlg-log').append(rollBox.el),
        rollBox.el.scrollIntoView({ block: 'end' }),
        await rollBox.play());
    }
    let line = addLine(
        `actual${node.speaker ? '' : ' narracion'}`,
        `<p class="mg-p">${richText(node.text || '').replace(/<\/p><p class="mg-p">/g, '</p><p class="mg-p">')}</p>`,
      ),
      log = box.querySelector('.mg-dlg-log'),
      typing = typewrite(line, line.innerHTML),
      scroller = setInterval(() => (log.scrollTop = log.scrollHeight), 80),
      resolveAnswer,
      answer = new Promise((resolve) => (resolveAnswer = resolve));
    return (
      (pending = { node, resolve: resolveAnswer, finish: typing.finish, opts: [] }),
      typing.done.then(() => {
        (clearInterval(scroller), (log.scrollTop = log.scrollHeight), showOptions(node));
      }),
      await answer
    );
  }
  function showOptions(node) {
    let list = box.querySelector('.mg-dlg-opts');
    list.innerHTML = '';
    let options = node.options?.length ? node.options : [{ text: 'Continuar', kind: 'continue' }];
    ((pending.opts = []),
      options.forEach((option, index) => {
        let item = elem('li'),
          button = elem(`button.mg-dlg-opt${option.kind ? '.k-' + option.kind : ''}`, {
            disabled: !!option.disabled,
            'data-n': index + 1,
          }),
          tagHtml = option.tag ? `<span class="mg-dlg-tag">${escapeHtml(option.tag)}</span> ` : '',
          tone = TONES[option.tone];
        ((button.innerHTML = `<span class="mg-dlg-n">${index + 1}.</span><span class="mg-dlg-t">${tagHtml}${richText(option.text)}${option.disabled && option.reason ? ` <small>(${escapeHtml(option.reason)})</small>` : ''}</span>${tone ? `<span class="mg-dlg-tone" title="${escapeHtml(tone[1])}">${iconHtml(tone[0])}</span>` : ''}`),
          option.hint && setTip(button, option.hint),
          button.addEventListener('click', () => pick(index)),
          item.append(button),
          list.append(item),
          pending.opts.push(button));
      }),
      requestAnimationFrame(() => list.classList.add('on')),
      matchMedia('(pointer: coarse)').matches ||
        pending.opts.find((button) => !button.disabled)?.focus({ preventScroll: !0 }));
  }
  function pick(index) {
    if (!pending || !pending.opts[index] || pending.opts[index].disabled) return;
    let node = pending.node,
      option = (node.options || [])[index],
      resolve = pending.resolve;
    (option &&
      option.kind !== 'continue' &&
      addLine(
        'jugador',
        `<p class="mg-p">${option.tag ? `<span class="mg-dlg-tag">${escapeHtml(option.tag)}</span> ` : ''}${richText(option.text)}</p>`,
      ),
      (box.querySelector('.mg-dlg-opts').innerHTML = ''),
      (pending = null),
      resolve(index),
      option?.kind === 'end' || (!node.options?.length && node.end)
        ? close()
        : (closeTimer = setTimeout(() => close(), 1500)));
  }
  function close() {
    if ((clearTimeout(closeTimer), !(!box || box.hidden))) {
      if (pending) {
        let resolve = pending.resolve;
        ((pending = null), resolve(-1));
      }
      (box.classList.add('fuera'),
        ui.root.classList.remove('con-dialogo'),
        ui.hud?.dim?.(!1),
        setTimeout(() => {
          box.classList.contains('fuera') &&
            ((box.hidden = !0), (box.querySelector('.mg-dlg-log').innerHTML = ''), (history.length = 0));
        }, 260));
    }
  }
  function key(ev) {
    if (!box || box.hidden) return !1;
    if (/^[1-9]$/.test(ev.key) && pending && box.querySelector('.mg-dlg-line.escribiendo'))
      return (pending.finish(), !0);
    if (/^[1-9]$/.test(ev.key) && pending?.opts?.length) {
      let index = Number(ev.key) - 1;
      if (pending.opts[index]) return (pick(index), !0);
    }
    if (ev.key === ' ' || ev.key === 'Enter') {
      if (pending && box.querySelector('.mg-dlg-line.escribiendo')) return (pending.finish(), !0);
      if (document.activeElement?.classList.contains('mg-dlg-opt')) return !1;
      if (pending?.opts?.length === 1) return (pick(0), !0);
    }
    if ((ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && pending?.opts?.length) {
      let index = pending.opts.indexOf(document.activeElement),
        count = pending.opts.length;
      return (pending.opts[(index + (ev.key === 'ArrowDown' ? 1 : count - 1) + count) % count]?.focus(), !0);
    }
    return !1;
  }
  return { show, close, key, isOpen: () => !!box && !box.hidden && !box.classList.contains('fuera') };
}
const TONES = {
  amable: ['hearts', 'Amable'],
  sarcastico: ['laugh', 'Sarc\xE1stico'],
  frio: ['frost', 'Fr\xEDo'],
  firme: ['shield', 'Firme'],
  agresivo: ['rage', 'Agresivo'],
};

export { createDialog };
