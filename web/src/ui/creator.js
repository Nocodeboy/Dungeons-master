// ui/creator.js
// Creador de personajes por pasos (especie, clase, trasfondo, características, habilidades, opciones,
// conjuros, equipo, aspecto, identidad) y subida de nivel. Lo usan scenes/creator.js y las pantallas
// creador y nivel.
// Reconstruido de publicado/juego.js (módulo __esm «sm»).

import { iconHtml, escapeHtml, richText, elem, makeButton, iconButton, signed } from './dom.js';
import { setTip } from './tooltip.js';
import { makeDie, rollDie } from './dice.js';
import { ABILITY_ICONS, ABILITY_HINTS, SPELL_ROLES, SPECIES_ICONS, BACKGROUND_ICONS } from './labels.js';
import { appearanceOptions, completeAppearance, randomAppearance, LOOK_GROUPS } from './creator-look.js';

function spellTip(spell) {
  return () => ({
    title: spell.name,
    sub: `${spell.level ? `Nivel ${spell.level}` : 'Truco'}${spell.school_name ? ` \xB7 ${spell.school_name}` : ''}${spell.concentration ? ' \xB7 concentraci\xF3n' : ''}`,
    body: spell.desc || spell.sub || '',
    tags: (spell.tags || []).map((tag) => SPELL_TAGS[tag]).filter(Boolean),
    foot: [CAST_TIMES[spell.cast] || '', ...(spell.bits || [])].filter(Boolean).join(' \xB7 '),
  });
}
/**
 * Monta el creador en `opts.container` (o en ui.root) y habla con el núcleo por ui.R (sheet_options,
 * sheet_set, sheet_finish). Modos: create, mercenario, levelup. Devuelve {el, heroEl, sheet(), go(step), dispose()}.
 */
function buildCreator(ui, game, opts) {
  let rules = ui.R,
    mode = opts.mode || 'create',
    isLevelUp = mode === 'levelup',
    sheet = opts.sheet,
    options = opts.options,
    level = opts.level || options?.level || 1,
    currentStep = null,
    finishing = !1,
    disposed = !1,
    scrollByStep = {},
    root = elem(`div.mg-cr${opts.overlay ? '.overlay' : ''}`, {
      role: 'region',
      'aria-label': isLevelUp ? 'Subida de nivel' : 'Creador de personajes',
    }),
    top = elem('header.mg-cr-top'),
    backButton = iconButton(
      isLevelUp ? 'close' : 'return',
      isLevelUp ? 'Cerrar' : mode === 'mercenario' ? 'Cancelar' : 'Volver al men\xFA',
      {
        onclick: () => opts.onCancel?.(),
      },
    ),
    heading = elem(
      'h1.mg-h1',
      opts.title ||
        (isLevelUp ? 'Subida de nivel' : mode === 'mercenario' ? 'Nuevo mercenario' : 'Crea tu h\xE9roe'),
    ),
    stepsNav = elem('nav.mg-cr-steps', { 'aria-label': 'Pasos' });
  top.append(backButton, heading, stepsNav);
  let heroBox = elem('div.mg-cr-hero'),
    stageArea = elem('div.mg-cr-stagearea', { style: 'position:relative;min-height:0' });
  stageArea.innerHTML = `<div class="mg-cr-stagehint">${iconHtml('undo')}Arrastra para girar</div>`;
  let summaryCard = elem('div.mg-cr-card.mg-panel.mg-orn');
  heroBox.append(stageArea, summaryCard);
  let panel = elem('section.mg-cr-panel.mg-panel.mg-orn'),
    head = elem('header.mg-cr-head'),
    body = elem('div.mg-cr-body.mg-scroll'),
    nav = elem('footer.mg-cr-nav');
  (panel.append(head, body, nav), root.append(top, heroBox, panel), (opts.container || ui.root).append(root));
  let dragX = null;
  (heroBox.addEventListener('pointerdown', (ev) => {
    ev.target.closest('button, input') || ((dragX = ev.clientX), heroBox.setPointerCapture?.(ev.pointerId));
  }),
    heroBox.addEventListener('pointermove', (ev) => {
      dragX != null && (opts.onDrag?.(ev.clientX - dragX), (dragX = ev.clientX));
    }));
  let endDrag = () => (dragX = null);
  (heroBox.addEventListener('pointerup', endDrag), heroBox.addEventListener('pointercancel', endDrag));
  function orderedSteps() {
    let list = [...(options?.steps || [])];
    if (!isLevelUp) {
      let speciesAt = list.findIndex((step) => step.id === 'species'),
        classAt = list.findIndex((step) => step.id === 'class');
      speciesAt > classAt && classAt >= 0 && list.splice(classAt, 0, list.splice(speciesAt, 1)[0]);
    }
    return list;
  }
  function viewFor(stepId = currentStep) {
    return options?.views?.[stepId];
  }
  function ensureView(stepId) {
    if (viewFor(stepId)) return;
    let res = rules.sheetView(sheet, { level, step: stepId });
    res && !res.error && (options = { ...res, views: { ...(options?.views || {}), ...(res.views || {}) } });
  }
  function set(what, value, extra = {}) {
    if (finishing || disposed) return;
    let focusKey = document.activeElement?.dataset?.k,
      res = rules.sheetSet(sheet, { what, value, ...extra }, { level, step: currentStep });
    if (!res || res.error) {
      ui.toast(res?.error ? `No se ha podido aplicar: ${res.error}` : 'No se ha podido aplicar.', 'mal');
      return;
    }
    (res.ok === !1 && res.reason && ui.toast(res.reason, 'mal'),
      (sheet = res.sheet),
      (options = res.options || options),
      res.options && !res.options.views?.[currentStep] && ensureView(currentStep),
      render({ keepScroll: !0 }),
      opts.onChange?.(sheet, options),
      focusKey && body.querySelector(`[data-k="${CSS.escape(focusKey)}"]`)?.focus({ preventScroll: !0 }));
  }
  let isOn = (item) => !!(item.selected ?? item.on),
    isEnabled = (item) => item.enabled !== !1;
  function cards(
    items,
    onPick,
    { ic, min, cls = '', noIcon = !1, sub = (item) => item.sub ?? item.desc ?? '', tipFn, extra } = {},
  ) {
    let grid = elem(`div.mg-cards${cls ? '.' + cls : ''}`);
    min && grid.style.setProperty('--card-min', min);
    for (let item of items || []) {
      let icon = noIcon ? '' : ic ? ic(item) : item.icon,
        button = elem(`button.mg-card${icon ? '' : '.mg-card--noico'}`, {
          'aria-pressed': String(isOn(item)),
          disabled: !isEnabled(item) && !isOn(item),
          'data-k': `${item.id}`,
        });
      ((button.innerHTML = `${icon ? `<span class="mg-card-ico">${iconHtml(icon)}</span>` : ''}<span class="mg-card-t">${escapeHtml(item.name)}</span>${sub(item) ? `<span class="mg-card-s">${escapeHtml(sub(item))}</span>` : ''}${extra ? extra(item) : ''}`),
        tipFn
          ? setTip(button, tipFn(item))
          : item.desc && sub(item) !== item.desc && setTip(button, { title: item.name, body: item.desc }),
        button.addEventListener('click', () => onPick(item)),
        grid.append(button));
    }
    return grid;
  }
  function chips(items, onPick, { label } = {}) {
    let group = elem('div.mg-cr-chips', { role: 'group', 'aria-label': label || null });
    for (let item of items || []) {
      let chip = elem(
        'button.mg-chip',
        {
          'aria-pressed': String(isOn(item)),
          disabled: !isEnabled(item) && !isOn(item),
          'data-k': `${item.id}`,
        },
        item.name ?? item.label,
      );
      (item.desc && setTip(chip, { title: item.name, body: item.desc }),
        chip.addEventListener('click', () => onPick(item)),
        group.append(chip));
    }
    return group;
  }
  function section(title, count) {
    let heading = elem('h3.mg-sec', title);
    return (
      count &&
        heading.insertAdjacentHTML(
          'beforeend',
          `<span class="mg-cuenta ${count.ok ? 'ok' : 'falta'}">${escapeHtml(count.text)}</span>`,
        ),
      heading
    );
  }
  function featureList(features) {
    let list = elem('div');
    for (let feat of features || [])
      list.append(elem('div.mg-cr-feat', elem('b', feat.name), feat.desc ? elem('span', feat.desc) : null));
    return list;
  }
  function detailPanel(...children) {
    return elem('aside.mg-cr-detail.mg-inset', ...children);
  }
  function spellCards(spells, what) {
    return cards(spells, (spell) => set(what, spell.id), {
      cls: 'mg-cr-spells',
      ic: (spell) => spell.icon || 'magic',
      sub: (spell) => spell.desc || spell.sub || '',
      tipFn: spellTip,
      extra: (spell) => {
        let tags = (spell.tags || [])
          .map((tag) => SPELL_TAGS[tag])
          .filter(Boolean)
          .slice(0, 3);
        return tags.length
          ? `<span class="mg-spell-tags">${tags.map(([label, cls]) => `<span class="mg-chip ${cls}">${escapeHtml(label)}</span>`).join('')}</span>`
          : '';
      },
    });
  }
  let countBadge = (info) =>
      info && info.count
        ? { ok: (info.picked ?? 0) >= info.count, text: `${info.picked ?? 0}/${info.count}` }
        : null,
    views = {
      species(view) {
        let col = elem('div.mg-col');
        (col.append(
          cards(view.cards, (card) => set('species', card.id), {
            ic: (card) => SPECIES_ICONS[card.id] || card.icon || 'person',
            min: '10rem',
          }),
        ),
          view.lineages &&
            (col.append(section(view.lineages.label)),
            col.append(
              cards(view.lineages.cards, (card) => set('lineage', card.id), { noIcon: !0, min: '14rem' }),
            )),
          view.ancestries &&
            (col.append(section(view.ancestries.label)),
            col.append(
              cards(view.ancestries.cards, (card) => set('ancestry', card.id), {
                noIcon: !0,
                min: '9.5rem',
                sub: (card) => card.sub || card.desc || '',
                extra: (card) =>
                  card.color
                    ? `<span class="mg-cr-color" style="background:${escapeHtml(card.color)};position:absolute;right:.6rem;top:.65rem"></span>`
                    : '',
              }),
            )),
          view.lineage_ability &&
            (col.append(section(view.lineage_ability.label)),
            col.append(chips(view.lineage_ability.chips, (card) => set('lineage_ability', card.id)))),
          view.sizes &&
            (col.append(section(view.sizes.label)),
            col.append(chips(view.sizes.chips, (card) => set('size', card.id)))),
          view.human_feat &&
            (col.append(section(view.human_feat.label)),
            col.append(
              cards(view.human_feat.cards, (card) => set('human_feat', card.id), {
                noIcon: !0,
                min: '14rem',
              }),
            )));
        let about = view.detail || {};
        return elem(
          'div.mg-cr-split',
          col,
          detailPanel(
            elem('h3.mg-h3', about.name || ''),
            elem('p', about.desc || ''),
            about.info ? elem('div.mg-cr-info', about.info) : null,
            featureList(about.traits),
          ),
        );
      },
      class(view) {
        let about = view.detail || {},
          info = elem('div.mg-cr-info'),
          rows = [
            ['Dado de golpe', about.hit_die ? `d${about.hit_die}` : ''],
            ['Principal', about.primary],
            ['Salvaciones', about.saves],
            ['Armaduras', about.armor],
            ['Armas', about.weapons],
            ['Dificultad', about.difficulty],
          ].filter(([, value]) => value);
        info.innerHTML = rows.length
          ? rows
              .map(
                ([label, value]) =>
                  `<b>${escapeHtml(label)}:</b> ${escapeHtml(Array.isArray(value) ? value.join(', ') : value)}`,
              )
              .join('<br>')
          : escapeHtml(about.info || '');
        let later = (about.later || []).length
          ? elem(
              'div',
              section('M\xE1s adelante'),
              ...(about.later || []).map((line) => elem('p.mg-small.mg-dim', line)),
            )
          : null;
        return elem(
          'div.mg-cr-split',
          cards(view.cards, (card) => set('class', card.id), {
            ic: (card) => card.icon || 'melee',
            min: '10rem',
          }),
          detailPanel(
            elem('h3.mg-h3', about.name || ''),
            elem('p', about.desc || ''),
            info,
            section('Rasgos de nivel 1'),
            featureList(about.features),
            later,
          ),
        );
      },
      background(view) {
        let about = view.detail || {},
          col = elem('div.mg-col');
        col.append(
          cards(view.cards, (card) => set('background', card.id), {
            ic: (card) => BACKGROUND_ICONS[card.id] || card.icon || 'scroll',
            min: '11rem',
          }),
        );
        let bonus = view.bonus;
        if (bonus) {
          col.append(section('Mejora de caracter\xEDsticas'));
          let isTriple = bonus.mode === '1_1_1',
            splitSeg = elem('div.mg-seg', { role: 'group', 'aria-label': 'Reparto' });
          for (let [split, label] of [
            ['2_1', '+2 y +1'],
            ['1_1_1', '+1 a las tres'],
          ]) {
            let button = elem(
              'button',
              { 'aria-pressed': String(bonus.mode === split), 'data-k': `bg_${split}` },
              label,
            );
            (button.addEventListener('click', () => bonus.mode !== split && set('bg_mode', split)),
              splitSeg.append(button));
          }
          if ((col.append(splitSeg), isTriple))
            col.append(
              elem('p.mg-cr-note', `+1 a ${bonus.allowed.map((ability) => ability.name).join(', ')}.`),
            );
          else
            for (let amount of [2, 1]) {
              let row = elem('div.mg-cr-row-label', elem('b', `+${amount}`));
              (row.append(
                chips(
                  bonus.allowed.map((ability) => ({
                    id: ability.id,
                    name: ability.name,
                    selected: Number(bonus.values?.[ability.id] || 0) === amount,
                  })),
                  (ability) =>
                    set('bg_bonus', { ability: ability.id, amount }, { ability: ability.id, amount }),
                ),
              ),
                col.append(row));
            }
        }
        view.note && col.append(elem('p.mg-cr-note', view.note));
        let feat = about.feat
            ? elem(
                'div.mg-cr-feat',
                elem('b', `Dote: ${about.feat.name}`),
                elem('span', about.feat.desc || ''),
              )
            : null,
          info = elem('div.mg-cr-info');
        return (
          (info.innerHTML = [
            about.skills?.length ? `<b>Habilidades:</b> ${escapeHtml(about.skills.join(', '))}` : '',
            about.tool ? `<b>Herramienta:</b> ${escapeHtml(about.tool)}` : '',
            about.gold ? `<b>Oro:</b> ${escapeHtml(about.gold)} po` : '',
          ]
            .filter(Boolean)
            .join('<br>')),
          elem(
            'div.mg-cr-split',
            col,
            detailPanel(elem('h3.mg-h3', about.name || ''), elem('p', about.desc || ''), feat, info),
          )
        );
      },
      abilities(view) {
        let col = elem('div.mg-col'),
          methodRow = elem('div.mg-row-flex'),
          methodSeg = elem('div.mg-seg', { role: 'group', 'aria-label': 'M\xE9todo' });
        for (let method of view.methods || []) {
          let button = elem(
            'button',
            { 'aria-pressed': String(!!method.selected), 'data-k': `m_${method.id}` },
            method.name,
          );
          (button.addEventListener('click', () => !method.selected && set('method', method.id)),
            methodSeg.append(button));
        }
        if (
          (methodRow.append(
            methodSeg,
            makeButton('Recomendado', {
              icon: 'star',
              size: 'sm',
              variant: 'ghost',
              onclick: () => set('recommended', !0),
              title: 'Vuelve a la matriz est\xE1ndar recomendada para tu clase',
            }),
          ),
          col.append(
            methodRow,
            elem('p.mg-cr-note', { style: 'font-style:normal;margin:.2rem 0 0' }, view.explanation || ''),
          ),
          view.rolls)
        ) {
          let rollsBox = elem('div.mg-cr-rolls');
          rollsBox.append(elem('span.mg-sc.mg-dim', 'Tiradas:'));
          let dice = view.rolls.map((roll) => {
            let die = makeDie(6, roll, { size: 'sm', title: `4d6: ${roll}` });
            return (die.style.setProperty('--d', '2.5rem'), die);
          });
          (rollsBox.append(...dice),
            rollsBox.append(
              makeButton('Volver a tirar', {
                icon: 'dice',
                size: 'sm',
                onclick: async () => {
                  set('reroll', !0);
                  let dieEls = [...body.querySelectorAll('.mg-cr-rolls .mg-die')];
                  await Promise.all(
                    dieEls.map((die, index) =>
                      rollDie(die, die.querySelector('b').textContent, { ms: 500 + index * 60 }),
                    ),
                  );
                },
              }),
            ),
            col.append(rollsBox));
        }
        if (view.points_left != null) {
          let pointsEl = elem('p.mg-cr-points', `Puntos restantes: ${view.points_left}`);
          (pointsEl.classList.add(
            view.points_left === 0 ? 'mg-bien' : view.points_left > 0 ? 'mg-aviso' : 'mg-mal',
          ),
            col.append(pointsEl));
        }
        let table = elem('div.mg-cr-abtable', { role: 'table', 'aria-label': 'Caracter\xEDsticas' });
        table.innerHTML =
          '<span class="th">Caracter\xEDstica</span><span class="th"></span><span class="th">Base</span><span class="th"></span><span class="th c-bonus">Trasfondo</span><span class="th">Total</span>';
        for (let row of view.rows || []) {
          let nameEl = elem(`span.mg-cr-abname${row.primary ? '.prim' : ''}`);
          ((nameEl.innerHTML = `${iconHtml(ABILITY_ICONS[row.id] || 'star')}<span>${escapeHtml(row.name)}${row.primary ? ' <span class="estrella" title="Importante para tu clase">\u2605</span>' : ''}</span>`),
            setTip(nameEl, {
              title: row.name,
              body: ABILITY_HINTS[row.id] || '',
              foot: row.primary ? '\u2605 Importante para tu clase.' : '',
            }));
          let minus = makeButton('\u2212', {
            size: 'sm',
            cls: 'mg-cr-pm',
            disabled: !row.can_minus,
            onclick: () => set('adjust', { ability: row.id, dir: -1 }, { ability: row.id, dir: -1 }),
          });
          (minus.setAttribute('aria-label', `Bajar ${row.name}`), (minus.dataset.k = `${row.id}-`));
          let plus = makeButton('+', {
            size: 'sm',
            cls: 'mg-cr-pm',
            disabled: !row.can_plus,
            onclick: () => set('adjust', { ability: row.id, dir: 1 }, { ability: row.id, dir: 1 }),
          });
          (plus.setAttribute('aria-label', `Subir ${row.name}`),
            (plus.dataset.k = `${row.id}+`),
            table.append(
              nameEl,
              minus,
              elem('span.mg-cr-base.mg-num', String(row.base)),
              plus,
              elem(
                `span.mg-cr-bonus.c-bonus${row.bonus ? '.si' : ''}`,
                row.bonus ? `+${row.bonus}` : '\u2014',
              ),
              elem(
                'span.mg-cr-total.mg-num',
                String(row.total),
                elem('small', row.mod_text ?? signed(row.mod)),
              ),
            ));
        }
        return (
          col.append(table),
          view.tips?.length &&
            col.append(
              elem('div.mg-cr-tips', ...view.tips.map((tip) => elem('span', { html: richText(tip) }))),
            ),
          col
        );
      },
      skills(view) {
        let col = elem('div.mg-col');
        (col.append(elem('p.mg-cr-note', { style: 'font-style:normal;margin:0' }, view.sources_text || '')),
          col.append(
            section('Habilidades', {
              ok: view.done ?? view.left <= 0,
              text: view.left > 0 ? `Te quedan ${view.left}` : 'Completas',
            }),
          ),
          col.append(
            cards(view.cards, (card) => set('skill', card.id), {
              cls: 'mg-cr-skills',
              noIcon: !0,
              sub: (card) => card.sub || card.ability_short,
              extra: (card) =>
                `<span class="mg-card-v mg-num">${escapeHtml(card.bonus_text ?? signed(card.bonus))}</span>`,
              tipFn: (card) => ({
                title: card.name,
                sub: `${card.ability_short}${card.class_skill ? ' \xB7 de tu clase' : ''}`,
                body: card.locked
                  ? 'Te la dan tu trasfondo o tu especie: no se puede quitar.'
                  : card.on
                    ? 'Competente: sumas tu bonificador por competencia.'
                    : 'Pulsa para aprenderla.',
              }),
            }),
          ));
        for (let cardEl of col.querySelectorAll('.mg-cr-skills .mg-card'))
          view.cards.find((card) => card.id === cardEl.dataset.k)?.locked && cardEl.classList.add('bloq');
        if (view.expertise) {
          let expertise = view.expertise;
          (col.append(
            section(
              expertise.title || 'Pericia',
              countBadge({ count: expertise.count, picked: expertise.picked }),
            ),
          ),
            col.append(
              elem(
                'p.mg-cr-note',
                { style: 'margin:0 0 .3rem' },
                'Duplicas el bonificador por competencia en esas habilidades.',
              ),
            ),
            col.append(chips(expertise.chips, (chip) => set('expertise', chip.id))));
        }
        return col;
      },
      options(view) {
        let col = elem('div.mg-col');
        for (let sec of view.sections || [])
          (col.append(section(sec.title, sec.count ? countBadge(sec) : null)),
            sec.note && col.append(elem('p.mg-cr-note', { style: 'margin:0 0 .3rem' }, sec.note)),
            sec.cards
              ? col.append(
                  cards(sec.cards, (card) => set(sec.what, card.id), {
                    noIcon: sec.kind !== 'metamagic',
                    ic: () => 'metamagic',
                    min: sec.kind === 'masteries' ? '13rem' : '16rem',
                    sub: (card) =>
                      sec.kind === 'masteries'
                        ? `${card.mine ? '\u2694 ' : ''}${card.mastery_name || ''}`
                        : card.desc || '',
                    tipFn: (card) => ({ title: card.name, body: card.desc || '' }),
                  }),
                )
              : sec.chips
                ? col.append(chips(sec.chips, (card) => set(sec.what, card.id)))
                : sec.items && col.append(featureList(sec.items)));
        return (
          view.sections?.length ||
            col.append(elem('p.mg-vacio', 'Tu clase no tiene m\xE1s elecciones en este nivel.')),
          col
        );
      },
      spells(view) {
        let col = elem('div.mg-col');
        if (
          (view.head && col.append(elem('p.mg-cr-note', { style: 'font-style:normal;margin:0' }, view.head)),
          view.cantrips &&
            (col.append(section(view.cantrips.title, countBadge(view.cantrips))),
            col.append(spellCards(view.cantrips.cards, view.cantrips.what || 'cantrip'))),
          view.prepared)
        ) {
          col.append(section(view.prepared.title, countBadge(view.prepared)));
          for (let group of view.prepared.by_level || [])
            ((view.prepared.by_level || []).length > 1 &&
              col.append(elem('h4.mg-h3', { style: 'font-size:.95rem;margin:.4rem 0 .2rem' }, group.title)),
              col.append(spellCards(group.cards, view.prepared.what || 'prepared')));
        }
        if (view.always?.length) {
          col.append(section('Siempre preparados'));
          let grid = spellCards(
            view.always.map((spell) => ({ ...spell, selected: !0, enabled: !1 })),
            'none',
          );
          for (let button of grid.querySelectorAll('button')) button.disabled = !0;
          col.append(grid);
        }
        let initiate = view.magic_initiate;
        return (
          initiate &&
            (col.append(section(initiate.title || 'Iniciado en la magia')),
            !initiate.fixed_list &&
              initiate.lists?.length &&
              col.append(
                elem(
                  'div.mg-cr-row-label',
                  elem('span.mg-sc.mg-dim', 'Lista:'),
                  chips(initiate.lists, (list) => set('mi_list', list.id)),
                ),
              ),
            initiate.abilities?.length &&
              col.append(
                elem(
                  'div.mg-cr-row-label',
                  elem('span.mg-sc.mg-dim', 'Caracter\xEDstica:'),
                  chips(initiate.abilities, (ability) => set('mi_ability', ability.id)),
                ),
              ),
            initiate.cantrips &&
              (col.append(
                elem('h4.mg-h3', { style: 'font-size:.95rem;margin:.4rem 0 .2rem' }, initiate.cantrips.title),
              ),
              col.append(spellCards(initiate.cantrips.cards, 'mi_cantrip'))),
            initiate.spell &&
              (col.append(
                elem('h4.mg-h3', { style: 'font-size:.95rem;margin:.4rem 0 .2rem' }, initiate.spell.title),
              ),
              col.append(spellCards(initiate.spell.cards, 'mi_spell')))),
          view.lineage_magic && col.append(elem('p.mg-cr-note', view.lineage_magic)),
          col
        );
      },
      equipment(view) {
        let col = elem('div.mg-col'),
          grid = elem('div.mg-cards.mg-cr-kits');
        for (let kit of view.kits || []) {
          let button = elem('button.mg-card.mg-kit', {
              'aria-pressed': String(!!kit.selected),
              'data-k': kit.id,
            }),
            items = Object.entries(kit.items || {}).map(([name, count]) =>
              typeof count == 'number' ? `${name}${count > 1 ? ` \xD7${count}` : ''}` : count,
            );
          ((button.innerHTML = `<span class="mg-kit-h"><b>${escapeHtml(kit.name)}</b></span>
          <span class="mg-kit-stats"><span>${iconHtml('ac')}CA ${escapeHtml(kit.ac)}</span><span>${iconHtml('coins')}${escapeHtml(kit.gold)} po</span>${kit.shield ? `<span>${iconHtml('shield')}Escudo</span>` : ''}</span>
          <ul>${(kit.weapons || []).map((weapon) => `<li>${escapeHtml(weapon.name)} <span class="mg-dim">(${escapeHtml(weapon.damage)})</span></li>`).join('')}${items.length ? `<li class="mg-dim">${escapeHtml(items.join(', '))}</li>` : ''}</ul>
          ${kit.str_warning ? `<span class="aviso">${iconHtml('info')} ${escapeHtml(typeof kit.str_warning == 'string' ? kit.str_warning : 'Te falta Fuerza para esa armadura: tu velocidad baja 3 m.')}</span>` : ''}`),
            button.addEventListener('click', () => !kit.selected && set('kit', kit.id)),
            grid.append(button));
        }
        return (col.append(grid), view.note && col.append(elem('p.mg-cr-note', view.note)), col);
      },
      look() {
        return lookView();
      },
      identity(view) {
        let col = elem('div.mg-col'),
          field = elem('div.mg-field'),
          inputId = `nombre-${Math.random().toString(36).slice(2, 6)}`;
        field.append(elem('label', { for: inputId }, 'Nombre'));
        let nameRow = elem('div.mg-cr-name-row'),
          input = elem('input.mg-input', {
            id: inputId,
            type: 'text',
            maxlength: view.max_length || 28,
            value: view.name || '',
            autocomplete: 'off',
            spellcheck: 'false',
            'data-k': 'nombre',
          }),
          nameTimer = 0;
        (input.addEventListener('input', () => {
          (clearTimeout(nameTimer),
            (nameTimer = setTimeout(() => {
              let res = rules.sheetSet(
                sheet,
                { what: 'name', value: input.value },
                { level, step: currentStep },
              );
              res &&
                !res.error &&
                ((sheet = res.sheet),
                (options = res.options || options),
                renderChrome(),
                opts.onChange?.(sheet, options));
            }, 220)));
        }),
          input.addEventListener('keydown', (ev) => ev.key === 'Enter' && input.blur()),
          nameRow.append(
            input,
            iconButton('dice', 'Nombre al azar', { onclick: () => set('random_name', !0) }),
          ),
          field.append(nameRow),
          col.append(field),
          view.pronouns &&
            (col.append(section(view.pronoun_label || 'Pronombre')),
            col.append(chips(view.pronouns, (pronoun) => set('pronoun', pronoun.id)))),
          col.append(section('Resumen')));
        let summary = elem('div.mg-cr-sum');
        for (let row of view.summary || [])
          summary.append(elem('div.mg-cr-sum-row', elem('b', row.label), elem('span', row.text)));
        col.append(summary);
        let issues = Object.entries(options.issues || {});
        if (issues.length) {
          let list = elem('ul.mg-cr-issues');
          for (let [stepId, issue] of issues) {
            let stepInfo = orderedSteps().find((step) => step.id === stepId),
              item = elem('li');
            ((item.innerHTML = `<b>${escapeHtml(stepInfo?.title || stepId)}:</b> ${escapeHtml(issue)} `),
              item.append(makeButton('Ir', { size: 'sm', variant: 'ghost', onclick: () => goStep(stepId) })),
              list.append(item));
          }
          col.append(list);
        } else
          col.append(
            elem('div.mg-cr-ready', {
              html: `${iconHtml('check')}<span>Todo listo. ${isLevelUp ? 'Pulsa \xABContinuar\xBB para subir de nivel.' : 'Pulsa \xABComenzar la aventura\xBB cuando quieras.'}</span>`,
            }),
          );
        return col;
      },
      advance(view) {
        let col = elem('div.mg-col');
        col.append(
          elem('div.mg-adv-hp', {
            html: `${iconHtml('hearts')}<div><b>${escapeHtml(view.hp_text || `+${view.hp_gain} PG`)}</b><div class="mg-dim">${escapeHtml(view.hp_note || `M\xE1ximo: ${view.hp_max}`)}</div></div>`,
          }),
        );
        for (let line of view.lines || []) col.append(elem('p.mg-p', line));
        view.features?.length &&
          (col.append(section('Rasgos nuevos')), col.append(featureList(view.features)));
        let subclass = view.subclass;
        if (
          (subclass &&
            (col.append(section(subclass.label || 'Subclase')),
            subclass.choices?.length > 1 &&
              col.append(cards(subclass.choices, (choice) => set('subclass', choice.id), { noIcon: !0 })),
            col.append(
              detailPanel(
                elem('h3.mg-h3', subclass.name || ''),
                elem('p', subclass.desc || ''),
                featureList(subclass.features),
                subclass.always_prepared?.length
                  ? elem('p.mg-cr-info', {
                      html: `<b>Siempre preparados:</b> ${escapeHtml(subclass.always_prepared.map((spell) => spell.name || spell).join(', '))}`,
                    })
                  : null,
              ),
            ),
            subclass.lands &&
              (col.append(section(subclass.lands.label || 'Tierra de tu c\xEDrculo')),
              col.append(
                cards(subclass.lands.cards, (land) => set('land', land.id), { ic: () => 'nature' }),
              )),
            subclass.hunters_prey &&
              (col.append(section(subclass.hunters_prey.label || 'Presa del cazador')),
              col.append(
                cards(subclass.hunters_prey.cards, (prey) => set('hunters_prey', prey.id), {
                  ic: () => 'mark',
                }),
              ))),
          view.new_skills)
        ) {
          let newSkills = view.new_skills;
          (col.append(section(newSkills.title, countBadge(newSkills))),
            col.append(chips(newSkills.chips, (chip) => set(newSkills.what || 'new_skill', chip.id))));
        }
        return col;
      },
    };
  function lookOpts() {
    return { lineage: sheet.lineage, ancestry: sheet.ancestry };
  }
  function updateLook(patch) {
    let look = completeAppearance(game, sheet.species, { ...(sheet.appearance || {}), ...patch }, lookOpts());
    ((sheet = { ...sheet, appearance: look }), render({ keepScroll: !0 }), opts.onChange?.(sheet, options));
  }
  function lookView() {
    let spec = appearanceOptions(game, sheet.species, lookOpts());
    sheet.appearance || (sheet.appearance = completeAppearance(game, sheet.species, {}, lookOpts()));
    let look = sheet.appearance,
      box = elem('div.mg-look'),
      buttons = elem('div.mg-row-flex');
    (buttons.append(
      makeButton('Al azar', {
        icon: 'dice',
        size: 'sm',
        onclick: () => updateLook(randomAppearance(game, sheet.species, lookOpts())),
      }),
      makeButton('Restablecer', {
        icon: 'undo',
        size: 'sm',
        variant: 'ghost',
        onclick: () =>
          updateLook(Object.fromEntries(spec.fields.map((field) => [field.key, spec.defaults?.[field.key]]))),
      }),
    ),
      box.append(buttons));
    let fieldsByKey = new Map(spec.fields.map((field) => [field.key, field])),
      shown = new Set(),
      groups = LOOK_GROUPS.map(([title, keys]) => [title, keys.filter((key) => fieldsByKey.has(key))]),
      otherKeys = spec.fields
        .filter((field) => !LOOK_GROUPS.some(([, keys]) => keys.includes(field.key)))
        .map((field) => field.key);
    otherKeys.length && groups.push(['M\xE1s', otherKeys]);
    for (let [title, keys] of groups)
      if (keys.length) {
        box.append(section(title));
        for (let key of keys) (shown.add(key), box.append(lookField(fieldsByKey.get(key), look[key])));
      }
    return box;
  }
  function lookField(field, value) {
    let box = elem('div.mg-look-field');
    if ((box.append(elem('span.mg-label', field.label)), field.type === 'color')) {
      let swatches = elem('div.mg-swatches', { role: 'group', 'aria-label': field.label });
      for (let option of field.options || []) {
        let color = typeof option == 'string' ? option : option.color || option.id,
          swatch = elem('button.mg-swatch', {
            'aria-pressed': String(String(color).toLowerCase() === String(value).toLowerCase()),
            'aria-label': `${field.label}: ${color}`,
            style: `background:${color}`,
            'data-k': `${field.key}_${color}`,
          });
        (swatch.addEventListener('click', () => updateLook({ [field.key]: color })), swatches.append(swatch));
      }
      box.append(swatches);
    } else if (field.type === 'choice') {
      if (
        (box.append(
          chips(
            (field.options || []).map((option) => ({
              id: option.id,
              name: option.label,
              selected: option.id === value,
            })),
            (picked) => updateLook({ [field.key]: picked.id }),
            { label: field.label },
          ),
        ),
        (field.options || []).some((option) => option.swatch))
      )
        for (let chip of box.querySelectorAll('.mg-chip')) {
          let option = field.options.find((opt) => String(opt.id) === chip.dataset.k);
          option?.swatch &&
            chip.insertAdjacentHTML(
              'afterbegin',
              `<span class="mg-cr-color" style="background:${escapeHtml(option.swatch)}"></span>`,
            );
        }
    } else if (field.type === 'range') {
      let range = {
          min: field.min ?? field.options?.min ?? 0,
          max: field.max ?? field.options?.max ?? 1,
          step: field.step ?? field.options?.step ?? 0.01,
        },
        input = elem('input.mg-range', {
          type: 'range',
          min: range.min,
          max: range.max,
          step: range.step || 0.01,
          value: value ?? 1,
          'aria-label': field.label,
          'data-k': field.key,
        }),
        paint = () =>
          input.style.setProperty('--p', `${((input.value - range.min) / (range.max - range.min)) * 100}%`);
      (paint(),
        input.addEventListener('input', paint),
        input.addEventListener('change', () => updateLook({ [field.key]: Number(input.value) })),
        box.append(
          elem(
            'div.mg-row-flex',
            elem('span.mg-dim.mg-small', 'M\xE1s bajo'),
            elem('div.mg-grow', input),
            elem('span.mg-dim.mg-small', 'M\xE1s alto'),
          ),
        ));
    } else if (field.type === 'toggle') {
      let toggle = elem('button.mg-switch', {
        role: 'switch',
        'aria-checked': String(!!value),
        'aria-label': field.label,
        'data-k': field.key,
      });
      (toggle.addEventListener('click', () => updateLook({ [field.key]: !value })), box.append(toggle));
    }
    return box;
  }
  function renderChrome() {
    let steps = orderedSteps(),
      index = steps.findIndex((step) => step.id === currentStep);
    ((stepsNav.innerHTML = ''),
      steps.forEach((step, stepIndex) => {
        let button = elem('button.mg-cr-step', {
          'aria-current': step.id === currentStep ? 'step' : null,
          title: step.issue || step.hint || '',
        });
        ((button.innerHTML = `<b>${stepIndex + 1}</b><span>${escapeHtml(step.title)}</span>`),
          step.issue ? button.classList.add('falta') : stepIndex < index && button.classList.add('hecho'),
          button.addEventListener('click', () => goStep(step.id)),
          stepsNav.append(button));
      }),
      stepsNav.querySelector('[aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' }));
    let hero = options?.hero || {};
    summaryCard.innerHTML = '';
    let stats = elem('div.mg-cr-stats');
    for (let [label, value, tip] of [
      ['PG', hero.hp, 'Puntos de golpe'],
      ['CA', hero.ac, 'Clase de Armadura'],
      ['Vel.', hero.speed_m ? `${hero.speed_m} m` : '', 'Velocidad'],
      ['Inic.', hero.initiative_text, 'Iniciativa'],
    ]) {
      let stat = elem('span.mg-stat', elem('b.mg-num', String(value ?? '\u2014')), elem('span', label));
      (setTip(stat, tip), stats.append(stat));
    }
    let abs = elem('div.mg-cr-abs');
    for (let [key, ability] of Object.entries(hero.abilities || {})) {
      let el = elem(
        'span.mg-ab',
        elem('span.mg-ab-n', ability.short),
        elem('span.mg-ab-v.mg-num', String(ability.score)),
        elem('span.mg-ab-m', signed(ability.mod)),
      );
      (setTip(el, { title: ability.name, body: ABILITY_HINTS[key] || '' }), abs.append(el));
    }
    summaryCard.append(
      elem('div.mg-cr-name', hero.name || sheet.name || 'Tu h\xE9roe'),
      elem('div.mg-cr-sub', hero.sub || ''),
      stats,
      abs,
    );
    let current = steps[index] || {};
    ((head.innerHTML = ''),
      head.append(
        elem('h2.mg-h2', current.title || ''),
        elem('p.mg-cr-hint', { style: 'margin:0' }, current.hint || ''),
      ),
      current.issue &&
        head.append(
          elem('p.mg-cr-issue', { html: `${iconHtml('info')}<span>${escapeHtml(current.issue)}</span>` }),
        ),
      (nav.innerHTML = ''));
    let isLast = index === steps.length - 1,
      prevButton = makeButton('Atr\xE1s', {
        icon: 'undo',
        onclick: () => goStep(steps[index - 1]?.id),
        disabled: index <= 0,
      }),
      counter = elem('span.mg-grow', `Paso ${index + 1} de ${steps.length}`),
      nextButton = isLast
        ? makeButton(
            options?.finish_label ||
              (isLevelUp ? 'Continuar' : mode === 'mercenario' ? 'Contratar' : 'Comenzar la aventura'),
            {
              icon: isLevelUp ? 'level_up' : 'attack',
              variant: 'primary',
              size: 'lg',
              onclick: finish,
              disabled: !options?.ready,
            },
          )
        : makeButton('Siguiente', {
            icon: 'check',
            variant: 'primary',
            onclick: () => goStep(steps[index + 1]?.id),
          });
    (isLast && !options?.ready && (nextButton.title = 'A\xFAn falta algo: mira los avisos de los pasos.'),
      nav.append(prevButton, counter, nextButton));
  }
  function render({ keepScroll } = {}) {
    if (disposed) return;
    let steps = orderedSteps();
    ((!currentStep || !steps.some((step) => step.id === currentStep)) && (currentStep = steps[0]?.id),
      ensureView(currentStep));
    let view = viewFor(currentStep),
      scroll = body.scrollTop;
    body.innerHTML = '';
    try {
      let renderer = views[currentStep];
      body.append(renderer ? renderer(view || {}) : elem('p.mg-vacio', 'Paso sin vista.'));
    } catch (err) {
      (console.error('[creador]', currentStep, err),
        body.append(elem('p.mg-vacio', `No se ha podido pintar este paso (${err.message}).`)));
    }
    (keepScroll && (body.scrollTop = scroll), renderChrome());
  }
  function goStep(stepId) {
    !stepId ||
      stepId === currentStep ||
      ((scrollByStep[currentStep] = body.scrollTop),
      (currentStep = stepId),
      render(),
      (body.scrollTop = scrollByStep[stepId] || 0),
      (
        body.querySelector('.mg-card[aria-pressed="true"]') ||
        body.querySelector('button:not(:disabled), input')
      )?.focus?.({ preventScroll: !0 }),
      game.bus?.emit('ui:step', { step: stepId }));
  }
  async function finish() {
    if (!(!options?.ready || finishing)) {
      finishing = !0;
      try {
        let res = rules.sheetFinish(sheet);
        if (!res || res.error || res.ok === !1) {
          ui.toast((res?.errors || [res?.error || 'La hoja no est\xE1 completa.']).join(' '), 'mal');
          return;
        }
        let hero = { ...res.sheet };
        (sheet.appearance && !hero.appearance && (hero.appearance = sheet.appearance),
          await opts.onFinish?.(hero));
      } finally {
        finishing = !1;
      }
    }
  }
  let onKey = (ev) => {
    if (disposed || (ui.layers.top && !opts.overlay)) return;
    let steps = orderedSteps(),
      index = steps.findIndex((step) => step.id === currentStep);
    ev.key === 'PageDown' && index < steps.length - 1
      ? (goStep(steps[index + 1].id), ev.preventDefault())
      : ev.key === 'PageUp' && index > 0 && (goStep(steps[index - 1].id), ev.preventDefault());
  };
  return (
    addEventListener('keydown', onKey),
    render(),
    opts.onChange?.(sheet, options),
    {
      el: root,
      heroEl: stageArea,
      sheet: () => sheet,
      go: goStep,
      dispose() {
        ((disposed = !0), removeEventListener('keydown', onKey), root.remove());
      },
    }
  );
}
const CAST_TIMES = {
  action: 'Acci\xF3n',
  bonus: 'Acci\xF3n adicional',
  reaction: 'Reacci\xF3n',
  minute: '1 minuto',
  ritual: 'Ritual',
};
const SPELL_TAGS = {
  ...SPELL_ROLES,
  aoe: ['\xC1rea', 't-dano'],
  save: ['Salvaci\xF3n', 't-control'],
  ranged: ['A distancia', 't-dano'],
  melee: ['Cuerpo a cuerpo', 't-dano'],
};

export { buildCreator };
