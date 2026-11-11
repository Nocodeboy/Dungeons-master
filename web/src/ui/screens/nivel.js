// ui/screens/nivel.js
// Pantalla «nivel»: subida de nivel del héroe paso a paso con el creador y resumen de lo que gana el grupo.
// La registra ui/index.js (SCREENS) y se abre con ui.open('nivel').
// Reconstruido de publicado/juego.js (módulo __esm «aM»).

import { iconHtml, escapeHtml, elem, makeButton, faceBadge } from '../dom.js';
import { screenFrame } from '../modal.js';
import { pc } from '../../actors/outfits.js';
import { buildCreator } from '../creator.js';
import { CLASS_ICONS } from '../labels.js';

/** Opciones de la capa (tamaño, modal, clases) que ui.open pasa a ScreenStack.open. */
function opcionesNivel() {
  return { width: '86rem', height: '52rem' };
}
/**
 * Construye la pantalla en `screen.el` (`params` son los de ui.open).
 * Devuelve los ganchos de la capa (onKey, onEscape, dispose…), si los hay.
 */
function pantallaNivel(screen, params, ui, game) {
  let rules = ui.R,
    currentCp = () => game.store.cp;
  if (!currentCp()) {
    setTimeout(() => screen.close(null));
    return;
  }
  let fromLevel = currentCp().party_level || 1,
    targetLevel = Number(params.level || fromLevel + 1);
  if (targetLevel <= fromLevel) {
    (ui.toast(`El grupo ya es de nivel ${fromLevel}.`, 'info'), setTimeout(() => screen.close(null)));
    return;
  }
  let hero = currentCp().members.hero,
    preview = null,
    creator = null;
  function stepTo(level) {
    let choices = rules.levelChoices(hero, level - 1);
    if (!choices || choices.error || !choices.sheet) return applyLevelUp(null);
    (screen.el.classList.add('mg-cr-host'),
      (screen.el.innerHTML = ''),
      (creator = buildCreator(ui, game, {
        mode: 'levelup',
        overlay: !0,
        container: screen.el,
        sheet: choices.sheet,
        options: choices.options,
        level: choices.level || level,
        title: `Subida de nivel \xB7 ${String(hero.name || '').split(' ')[0]} llega a nivel ${choices.level || level}`,
        onChange: (sheet) => preview?.setHero(sheet),
        onDrag: (dx) => preview?.drag(dx),
        onCancel: async () => {
          (await ui.confirm('Podr\xE1s subir de nivel m\xE1s tarde desde la ficha del grupo.', {
            titulo: '\xBFDejarlo para luego?',
            si: 'M\xE1s tarde',
            no: 'Seguir',
          })) && screen.close(null);
        },
        onFinish: (sheet) => {
          ((hero = sheet),
            creator.dispose(),
            preview?.dispose(),
            (preview = null),
            (choices.level || level) < targetLevel
              ? stepTo((choices.level || level) + 1)
              : applyLevelUp(sheet));
        },
      })));
    let canvas = document.createElement('canvas');
    (creator.heroEl.prepend(canvas),
      preview?.dispose(),
      (preview = new pc(game, canvas)),
      preview.setHero(choices.sheet));
  }
  function applyLevelUp(newHero) {
    let res = rules.levelUp(targetLevel, newHero ? { hero: newHero } : void 0);
    (screen.el.classList.remove('mg-cr-host'), (screen.el.innerHTML = ''));
    let frame = screenFrame(screen, { title: `\xA1Nivel ${targetLevel}!`, ic: 'level_up' });
    if (!res || res.error || res.ok === !1) {
      frame.body.innerHTML = `<div class="mg-vacio">${iconHtml('info')}No se ha podido subir de nivel (${escapeHtml(res?.reason || res?.error || 'sin respuesta')}).</div>`;
      return;
    }
    game.bus?.emit('levelup', { level: targetLevel });
    let rows = elem('div.mg-rest-rows.mg-scroll', { style: 'overflow-y:auto;min-height:0' });
    for (let member of rules.partySummary()) {
      let gained = res.gained?.[member.id] || [],
        hp = res.hp?.[member.id],
        row = elem('div.mg-rest-row', { style: 'grid-template-columns:3rem minmax(0,1fr)' });
      row.append(
        faceBadge(ui.portrait(member.id), {
          id: member.id,
          name: member.name,
          ic: CLASS_ICONS[member.class] || 'person',
        }),
      );
      let info = elem('div');
      ((info.innerHTML = `<b class="mg-h3" style="font-size:1.05rem">${escapeHtml(member.name)}</b> <span class="mg-dim">\xB7 ${escapeHtml(member.class_name || '')} ${escapeHtml(targetLevel)}</span><div><span class="mg-bien">${hp ? `+${escapeHtml(hp)} PG` : ''}</span>${hp ? ' \xB7 ' : ''}<span class="mg-dim">${escapeHtml(member.max_hp)} PG m\xE1ximos</span></div>${gained.length ? `<div class="mg-small" style="margin-top:.2rem">${gained.map((feature) => `<b>${escapeHtml(feature.name)}</b>`).join(' \xB7 ')}</div>` : ''}`),
        row.append(info),
        rows.append(row));
    }
    (frame.body.append(
      elem('p.mg-p', { style: 'margin-bottom:.7rem' }, 'El grupo ha ganado experiencia. Esto es lo nuevo:'),
      rows,
    ),
      (frame.foot.hidden = !1));
    let button = makeButton('Seguir', {
      icon: 'check',
      variant: 'primary',
      onclick: () => screen.close({ level: targetLevel }),
    });
    (frame.foot.append(button), button.focus(), game.store.save('auto').catch(() => null));
  }
  return (
    stepTo(fromLevel + 1),
    {
      dispose() {
        (preview?.dispose(), creator?.dispose());
      },
      onEscape: () => creator?.el?.querySelector('.mg-cr-top .mg-ibtn')?.click(),
    }
  );
}

export { pantallaNivel as default, opcionesNivel as options };
