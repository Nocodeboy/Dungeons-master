// ui/creator.js
// Reconstruido de publicado/juego.js (módulo __esm «sm»). Nombres locales aún minificados.

import { iconHtml, escapeHtml, richText, elem, makeButton, Qd, en } from './dom.js';
import { sa } from './tooltip.js';
import { Wi, Xi } from './dice.js';
import { Zw, nu, Df, t2, a2 } from './labels.js';
import { om, zv, JT, Pv } from './creator-look.js';

function WL(o) {
  return () => ({
    title: o.name,
    sub: `${o.level ? `Nivel ${o.level}` : 'Truco'}${o.school_name ? ` \xB7 ${o.school_name}` : ''}${o.concentration ? ' \xB7 concentraci\xF3n' : ''}`,
    body: o.desc || o.sub || '',
    tags: (o.tags || []).map((e) => QT[e]).filter(Boolean),
    foot: [$L[o.cast] || '', ...(o.bits || [])].filter(Boolean).join(' \xB7 '),
  });
}
function fc(o, e, t) {
  let a = o.R,
    n = t.mode || 'create',
    s = n === 'levelup',
    i = t.sheet,
    r = t.options,
    l = t.level || r?.level || 1,
    c = null,
    d = !1,
    u = !1,
    h = {},
    p = elem(`div.mg-cr${t.overlay ? '.overlay' : ''}`, {
      role: 'region',
      'aria-label': s ? 'Subida de nivel' : 'Creador de personajes',
    }),
    m = elem('header.mg-cr-top'),
    _ = Qd(s ? 'close' : 'return', s ? 'Cerrar' : n === 'mercenario' ? 'Cancelar' : 'Volver al men\xFA', {
      onclick: () => t.onCancel?.(),
    }),
    b = elem(
      'h1.mg-h1',
      t.title || (s ? 'Subida de nivel' : n === 'mercenario' ? 'Nuevo mercenario' : 'Crea tu h\xE9roe'),
    ),
    f = elem('nav.mg-cr-steps', { 'aria-label': 'Pasos' });
  m.append(_, b, f);
  let v = elem('div.mg-cr-hero'),
    x = elem('div.mg-cr-stagearea', { style: 'position:relative;min-height:0' });
  x.innerHTML = `<div class="mg-cr-stagehint">${iconHtml('undo')}Arrastra para girar</div>`;
  let g = elem('div.mg-cr-card.mg-panel.mg-orn');
  v.append(x, g);
  let y = elem('section.mg-cr-panel.mg-panel.mg-orn'),
    w = elem('header.mg-cr-head'),
    k = elem('div.mg-cr-body.mg-scroll'),
    T = elem('footer.mg-cr-nav');
  (y.append(w, k, T), p.append(m, v, y), (t.container || o.root).append(p));
  let E = null;
  (v.addEventListener('pointerdown', (N) => {
    N.target.closest('button, input') || ((E = N.clientX), v.setPointerCapture?.(N.pointerId));
  }),
    v.addEventListener('pointermove', (N) => {
      E != null && (t.onDrag?.(N.clientX - E), (E = N.clientX));
    }));
  let S = () => (E = null);
  (v.addEventListener('pointerup', S), v.addEventListener('pointercancel', S));
  function z() {
    let N = [...(r?.steps || [])];
    if (!s) {
      let L = N.findIndex((B) => B.id === 'species'),
        O = N.findIndex((B) => B.id === 'class');
      L > O && O >= 0 && N.splice(O, 0, N.splice(L, 1)[0]);
    }
    return N;
  }
  function D(N = c) {
    return r?.views?.[N];
  }
  function M(N) {
    if (D(N)) return;
    let L = a.sheetView(i, { level: l, step: N });
    L && !L.error && (r = { ...L, views: { ...(r?.views || {}), ...(L.views || {}) } });
  }
  function R(N, L, O = {}) {
    if (d || u) return;
    let B = document.activeElement?.dataset?.k,
      $ = a.sheetSet(i, { what: N, value: L, ...O }, { level: l, step: c });
    if (!$ || $.error) {
      o.toast($?.error ? `No se ha podido aplicar: ${$.error}` : 'No se ha podido aplicar.', 'mal');
      return;
    }
    ($.ok === !1 && $.reason && o.toast($.reason, 'mal'),
      (i = $.sheet),
      (r = $.options || r),
      $.options && !$.options.views?.[c] && M(c),
      we({ keepScroll: !0 }),
      t.onChange?.(i, r),
      B && k.querySelector(`[data-k="${CSS.escape(B)}"]`)?.focus({ preventScroll: !0 }));
  }
  let A = (N) => !!(N.selected ?? N.on),
    P = (N) => N.enabled !== !1;
  function I(
    N,
    L,
    {
      ic: O,
      min: B,
      cls: $ = '',
      noIcon: ee = !1,
      sub: be = (W) => W.sub ?? W.desc ?? '',
      tipFn: Ce,
      extra: ze,
    } = {},
  ) {
    let W = elem(`div.mg-cards${$ ? '.' + $ : ''}`);
    B && W.style.setProperty('--card-min', B);
    for (let De of N || []) {
      let rt = ee ? '' : O ? O(De) : De.icon,
        V = elem(`button.mg-card${rt ? '' : '.mg-card--noico'}`, {
          'aria-pressed': String(A(De)),
          disabled: !P(De) && !A(De),
          'data-k': `${De.id}`,
        });
      ((V.innerHTML = `${rt ? `<span class="mg-card-ico">${iconHtml(rt)}</span>` : ''}<span class="mg-card-t">${escapeHtml(De.name)}</span>${be(De) ? `<span class="mg-card-s">${escapeHtml(be(De))}</span>` : ''}${ze ? ze(De) : ''}`),
        Ce ? sa(V, Ce(De)) : De.desc && be(De) !== De.desc && sa(V, { title: De.name, body: De.desc }),
        V.addEventListener('click', () => L(De)),
        W.append(V));
    }
    return W;
  }
  function U(N, L, { label: O } = {}) {
    let B = elem('div.mg-cr-chips', { role: 'group', 'aria-label': O || null });
    for (let $ of N || []) {
      let ee = elem(
        'button.mg-chip',
        { 'aria-pressed': String(A($)), disabled: !P($) && !A($), 'data-k': `${$.id}` },
        $.name ?? $.label,
      );
      ($.desc && sa(ee, { title: $.name, body: $.desc }),
        ee.addEventListener('click', () => L($)),
        B.append(ee));
    }
    return B;
  }
  function j(N, L) {
    let O = elem('h3.mg-sec', N);
    return (
      L &&
        O.insertAdjacentHTML(
          'beforeend',
          `<span class="mg-cuenta ${L.ok ? 'ok' : 'falta'}">${escapeHtml(L.text)}</span>`,
        ),
      O
    );
  }
  function X(N) {
    let L = elem('div');
    for (let O of N || [])
      L.append(elem('div.mg-cr-feat', elem('b', O.name), O.desc ? elem('span', O.desc) : null));
    return L;
  }
  function J(...N) {
    return elem('aside.mg-cr-detail.mg-inset', ...N);
  }
  function Z(N, L) {
    return I(N, (O) => R(L, O.id), {
      cls: 'mg-cr-spells',
      ic: (O) => O.icon || 'magic',
      sub: (O) => O.desc || O.sub || '',
      tipFn: WL,
      extra: (O) => {
        let B = (O.tags || [])
          .map(($) => QT[$])
          .filter(Boolean)
          .slice(0, 3);
        return B.length
          ? `<span class="mg-spell-tags">${B.map(([$, ee]) => `<span class="mg-chip ${ee}">${escapeHtml($)}</span>`).join('')}</span>`
          : '';
      },
    });
  }
  let K = (N) =>
      N && N.count ? { ok: (N.picked ?? 0) >= N.count, text: `${N.picked ?? 0}/${N.count}` } : null,
    ve = {
      species(N) {
        let L = elem('div.mg-col');
        (L.append(
          I(N.cards, (B) => R('species', B.id), { ic: (B) => t2[B.id] || B.icon || 'person', min: '10rem' }),
        ),
          N.lineages &&
            (L.append(j(N.lineages.label)),
            L.append(I(N.lineages.cards, (B) => R('lineage', B.id), { noIcon: !0, min: '14rem' }))),
          N.ancestries &&
            (L.append(j(N.ancestries.label)),
            L.append(
              I(N.ancestries.cards, (B) => R('ancestry', B.id), {
                noIcon: !0,
                min: '9.5rem',
                sub: (B) => B.sub || B.desc || '',
                extra: (B) =>
                  B.color
                    ? `<span class="mg-cr-color" style="background:${escapeHtml(B.color)};position:absolute;right:.6rem;top:.65rem"></span>`
                    : '',
              }),
            )),
          N.lineage_ability &&
            (L.append(j(N.lineage_ability.label)),
            L.append(U(N.lineage_ability.chips, (B) => R('lineage_ability', B.id)))),
          N.sizes && (L.append(j(N.sizes.label)), L.append(U(N.sizes.chips, (B) => R('size', B.id)))),
          N.human_feat &&
            (L.append(j(N.human_feat.label)),
            L.append(I(N.human_feat.cards, (B) => R('human_feat', B.id), { noIcon: !0, min: '14rem' }))));
        let O = N.detail || {};
        return elem(
          'div.mg-cr-split',
          L,
          J(
            elem('h3.mg-h3', O.name || ''),
            elem('p', O.desc || ''),
            O.info ? elem('div.mg-cr-info', O.info) : null,
            X(O.traits),
          ),
        );
      },
      class(N) {
        let L = N.detail || {},
          O = elem('div.mg-cr-info'),
          B = [
            ['Dado de golpe', L.hit_die ? `d${L.hit_die}` : ''],
            ['Principal', L.primary],
            ['Salvaciones', L.saves],
            ['Armaduras', L.armor],
            ['Armas', L.weapons],
            ['Dificultad', L.difficulty],
          ].filter(([, ee]) => ee);
        O.innerHTML = B.length
          ? B.map(
              ([ee, be]) => `<b>${escapeHtml(ee)}:</b> ${escapeHtml(Array.isArray(be) ? be.join(', ') : be)}`,
            ).join('<br>')
          : escapeHtml(L.info || '');
        let $ = (L.later || []).length
          ? elem('div', j('M\xE1s adelante'), ...(L.later || []).map((ee) => elem('p.mg-small.mg-dim', ee)))
          : null;
        return elem(
          'div.mg-cr-split',
          I(N.cards, (ee) => R('class', ee.id), { ic: (ee) => ee.icon || 'melee', min: '10rem' }),
          J(
            elem('h3.mg-h3', L.name || ''),
            elem('p', L.desc || ''),
            O,
            j('Rasgos de nivel 1'),
            X(L.features),
            $,
          ),
        );
      },
      background(N) {
        let L = N.detail || {},
          O = elem('div.mg-col');
        O.append(
          I(N.cards, (be) => R('background', be.id), {
            ic: (be) => a2[be.id] || be.icon || 'scroll',
            min: '11rem',
          }),
        );
        let B = N.bonus;
        if (B) {
          O.append(j('Mejora de caracter\xEDsticas'));
          let be = B.mode === '1_1_1',
            Ce = elem('div.mg-seg', { role: 'group', 'aria-label': 'Reparto' });
          for (let [ze, W] of [
            ['2_1', '+2 y +1'],
            ['1_1_1', '+1 a las tres'],
          ]) {
            let De = elem('button', { 'aria-pressed': String(B.mode === ze), 'data-k': `bg_${ze}` }, W);
            (De.addEventListener('click', () => B.mode !== ze && R('bg_mode', ze)), Ce.append(De));
          }
          if ((O.append(Ce), be))
            O.append(elem('p.mg-cr-note', `+1 a ${B.allowed.map((ze) => ze.name).join(', ')}.`));
          else
            for (let ze of [2, 1]) {
              let W = elem('div.mg-cr-row-label', elem('b', `+${ze}`));
              (W.append(
                U(
                  B.allowed.map((De) => ({
                    id: De.id,
                    name: De.name,
                    selected: Number(B.values?.[De.id] || 0) === ze,
                  })),
                  (De) => R('bg_bonus', { ability: De.id, amount: ze }, { ability: De.id, amount: ze }),
                ),
              ),
                O.append(W));
            }
        }
        N.note && O.append(elem('p.mg-cr-note', N.note));
        let $ = L.feat
            ? elem('div.mg-cr-feat', elem('b', `Dote: ${L.feat.name}`), elem('span', L.feat.desc || ''))
            : null,
          ee = elem('div.mg-cr-info');
        return (
          (ee.innerHTML = [
            L.skills?.length ? `<b>Habilidades:</b> ${escapeHtml(L.skills.join(', '))}` : '',
            L.tool ? `<b>Herramienta:</b> ${escapeHtml(L.tool)}` : '',
            L.gold ? `<b>Oro:</b> ${escapeHtml(L.gold)} po` : '',
          ]
            .filter(Boolean)
            .join('<br>')),
          elem('div.mg-cr-split', O, J(elem('h3.mg-h3', L.name || ''), elem('p', L.desc || ''), $, ee))
        );
      },
      abilities(N) {
        let L = elem('div.mg-col'),
          O = elem('div.mg-row-flex'),
          B = elem('div.mg-seg', { role: 'group', 'aria-label': 'M\xE9todo' });
        for (let ee of N.methods || []) {
          let be = elem('button', { 'aria-pressed': String(!!ee.selected), 'data-k': `m_${ee.id}` }, ee.name);
          (be.addEventListener('click', () => !ee.selected && R('method', ee.id)), B.append(be));
        }
        if (
          (O.append(
            B,
            makeButton('Recomendado', {
              icon: 'star',
              size: 'sm',
              variant: 'ghost',
              onclick: () => R('recommended', !0),
              title: 'Vuelve a la matriz est\xE1ndar recomendada para tu clase',
            }),
          ),
          L.append(
            O,
            elem('p.mg-cr-note', { style: 'font-style:normal;margin:.2rem 0 0' }, N.explanation || ''),
          ),
          N.rolls)
        ) {
          let ee = elem('div.mg-cr-rolls');
          ee.append(elem('span.mg-sc.mg-dim', 'Tiradas:'));
          let be = N.rolls.map((Ce) => {
            let ze = Wi(6, Ce, { size: 'sm', title: `4d6: ${Ce}` });
            return (ze.style.setProperty('--d', '2.5rem'), ze);
          });
          (ee.append(...be),
            ee.append(
              makeButton('Volver a tirar', {
                icon: 'dice',
                size: 'sm',
                onclick: async () => {
                  R('reroll', !0);
                  let Ce = [...k.querySelectorAll('.mg-cr-rolls .mg-die')];
                  await Promise.all(
                    Ce.map((ze, W) => Xi(ze, ze.querySelector('b').textContent, { ms: 500 + W * 60 })),
                  );
                },
              }),
            ),
            L.append(ee));
        }
        if (N.points_left != null) {
          let ee = elem('p.mg-cr-points', `Puntos restantes: ${N.points_left}`);
          (ee.classList.add(N.points_left === 0 ? 'mg-bien' : N.points_left > 0 ? 'mg-aviso' : 'mg-mal'),
            L.append(ee));
        }
        let $ = elem('div.mg-cr-abtable', { role: 'table', 'aria-label': 'Caracter\xEDsticas' });
        $.innerHTML =
          '<span class="th">Caracter\xEDstica</span><span class="th"></span><span class="th">Base</span><span class="th"></span><span class="th c-bonus">Trasfondo</span><span class="th">Total</span>';
        for (let ee of N.rows || []) {
          let be = elem(`span.mg-cr-abname${ee.primary ? '.prim' : ''}`);
          ((be.innerHTML = `${iconHtml(Zw[ee.id] || 'star')}<span>${escapeHtml(ee.name)}${ee.primary ? ' <span class="estrella" title="Importante para tu clase">\u2605</span>' : ''}</span>`),
            sa(be, {
              title: ee.name,
              body: nu[ee.id] || '',
              foot: ee.primary ? '\u2605 Importante para tu clase.' : '',
            }));
          let Ce = makeButton('\u2212', {
            size: 'sm',
            cls: 'mg-cr-pm',
            disabled: !ee.can_minus,
            onclick: () => R('adjust', { ability: ee.id, dir: -1 }, { ability: ee.id, dir: -1 }),
          });
          (Ce.setAttribute('aria-label', `Bajar ${ee.name}`), (Ce.dataset.k = `${ee.id}-`));
          let ze = makeButton('+', {
            size: 'sm',
            cls: 'mg-cr-pm',
            disabled: !ee.can_plus,
            onclick: () => R('adjust', { ability: ee.id, dir: 1 }, { ability: ee.id, dir: 1 }),
          });
          (ze.setAttribute('aria-label', `Subir ${ee.name}`),
            (ze.dataset.k = `${ee.id}+`),
            $.append(
              be,
              Ce,
              elem('span.mg-cr-base.mg-num', String(ee.base)),
              ze,
              elem(`span.mg-cr-bonus.c-bonus${ee.bonus ? '.si' : ''}`, ee.bonus ? `+${ee.bonus}` : '\u2014'),
              elem('span.mg-cr-total.mg-num', String(ee.total), elem('small', ee.mod_text ?? en(ee.mod))),
            ));
        }
        return (
          L.append($),
          N.tips?.length &&
            L.append(elem('div.mg-cr-tips', ...N.tips.map((ee) => elem('span', { html: richText(ee) })))),
          L
        );
      },
      skills(N) {
        let L = elem('div.mg-col');
        (L.append(elem('p.mg-cr-note', { style: 'font-style:normal;margin:0' }, N.sources_text || '')),
          L.append(
            j('Habilidades', {
              ok: N.done ?? N.left <= 0,
              text: N.left > 0 ? `Te quedan ${N.left}` : 'Completas',
            }),
          ),
          L.append(
            I(N.cards, (O) => R('skill', O.id), {
              cls: 'mg-cr-skills',
              noIcon: !0,
              sub: (O) => O.sub || O.ability_short,
              extra: (O) =>
                `<span class="mg-card-v mg-num">${escapeHtml(O.bonus_text ?? en(O.bonus))}</span>`,
              tipFn: (O) => ({
                title: O.name,
                sub: `${O.ability_short}${O.class_skill ? ' \xB7 de tu clase' : ''}`,
                body: O.locked
                  ? 'Te la dan tu trasfondo o tu especie: no se puede quitar.'
                  : O.on
                    ? 'Competente: sumas tu bonificador por competencia.'
                    : 'Pulsa para aprenderla.',
              }),
            }),
          ));
        for (let O of L.querySelectorAll('.mg-cr-skills .mg-card'))
          N.cards.find(($) => $.id === O.dataset.k)?.locked && O.classList.add('bloq');
        if (N.expertise) {
          let O = N.expertise;
          (L.append(j(O.title || 'Pericia', K({ count: O.count, picked: O.picked }))),
            L.append(
              elem(
                'p.mg-cr-note',
                { style: 'margin:0 0 .3rem' },
                'Duplicas el bonificador por competencia en esas habilidades.',
              ),
            ),
            L.append(U(O.chips, (B) => R('expertise', B.id))));
        }
        return L;
      },
      options(N) {
        let L = elem('div.mg-col');
        for (let O of N.sections || [])
          (L.append(j(O.title, O.count ? K(O) : null)),
            O.note && L.append(elem('p.mg-cr-note', { style: 'margin:0 0 .3rem' }, O.note)),
            O.cards
              ? L.append(
                  I(O.cards, (B) => R(O.what, B.id), {
                    noIcon: O.kind !== 'metamagic',
                    ic: () => 'metamagic',
                    min: O.kind === 'masteries' ? '13rem' : '16rem',
                    sub: (B) =>
                      O.kind === 'masteries'
                        ? `${B.mine ? '\u2694 ' : ''}${B.mastery_name || ''}`
                        : B.desc || '',
                    tipFn: (B) => ({ title: B.name, body: B.desc || '' }),
                  }),
                )
              : O.chips
                ? L.append(U(O.chips, (B) => R(O.what, B.id)))
                : O.items && L.append(X(O.items)));
        return (
          N.sections?.length ||
            L.append(elem('p.mg-vacio', 'Tu clase no tiene m\xE1s elecciones en este nivel.')),
          L
        );
      },
      spells(N) {
        let L = elem('div.mg-col');
        if (
          (N.head && L.append(elem('p.mg-cr-note', { style: 'font-style:normal;margin:0' }, N.head)),
          N.cantrips &&
            (L.append(j(N.cantrips.title, K(N.cantrips))),
            L.append(Z(N.cantrips.cards, N.cantrips.what || 'cantrip'))),
          N.prepared)
        ) {
          L.append(j(N.prepared.title, K(N.prepared)));
          for (let B of N.prepared.by_level || [])
            ((N.prepared.by_level || []).length > 1 &&
              L.append(elem('h4.mg-h3', { style: 'font-size:.95rem;margin:.4rem 0 .2rem' }, B.title)),
              L.append(Z(B.cards, N.prepared.what || 'prepared')));
        }
        if (N.always?.length) {
          L.append(j('Siempre preparados'));
          let B = Z(
            N.always.map(($) => ({ ...$, selected: !0, enabled: !1 })),
            'none',
          );
          for (let $ of B.querySelectorAll('button')) $.disabled = !0;
          L.append(B);
        }
        let O = N.magic_initiate;
        return (
          O &&
            (L.append(j(O.title || 'Iniciado en la magia')),
            !O.fixed_list &&
              O.lists?.length &&
              L.append(
                elem(
                  'div.mg-cr-row-label',
                  elem('span.mg-sc.mg-dim', 'Lista:'),
                  U(O.lists, (B) => R('mi_list', B.id)),
                ),
              ),
            O.abilities?.length &&
              L.append(
                elem(
                  'div.mg-cr-row-label',
                  elem('span.mg-sc.mg-dim', 'Caracter\xEDstica:'),
                  U(O.abilities, (B) => R('mi_ability', B.id)),
                ),
              ),
            O.cantrips &&
              (L.append(
                elem('h4.mg-h3', { style: 'font-size:.95rem;margin:.4rem 0 .2rem' }, O.cantrips.title),
              ),
              L.append(Z(O.cantrips.cards, 'mi_cantrip'))),
            O.spell &&
              (L.append(elem('h4.mg-h3', { style: 'font-size:.95rem;margin:.4rem 0 .2rem' }, O.spell.title)),
              L.append(Z(O.spell.cards, 'mi_spell')))),
          N.lineage_magic && L.append(elem('p.mg-cr-note', N.lineage_magic)),
          L
        );
      },
      equipment(N) {
        let L = elem('div.mg-col'),
          O = elem('div.mg-cards.mg-cr-kits');
        for (let B of N.kits || []) {
          let $ = elem('button.mg-card.mg-kit', { 'aria-pressed': String(!!B.selected), 'data-k': B.id }),
            ee = Object.entries(B.items || {}).map(([be, Ce]) =>
              typeof Ce == 'number' ? `${be}${Ce > 1 ? ` \xD7${Ce}` : ''}` : Ce,
            );
          (($.innerHTML = `<span class="mg-kit-h"><b>${escapeHtml(B.name)}</b></span>
          <span class="mg-kit-stats"><span>${iconHtml('ac')}CA ${escapeHtml(B.ac)}</span><span>${iconHtml('coins')}${escapeHtml(B.gold)} po</span>${B.shield ? `<span>${iconHtml('shield')}Escudo</span>` : ''}</span>
          <ul>${(B.weapons || []).map((be) => `<li>${escapeHtml(be.name)} <span class="mg-dim">(${escapeHtml(be.damage)})</span></li>`).join('')}${ee.length ? `<li class="mg-dim">${escapeHtml(ee.join(', '))}</li>` : ''}</ul>
          ${B.str_warning ? `<span class="aviso">${iconHtml('info')} ${escapeHtml(typeof B.str_warning == 'string' ? B.str_warning : 'Te falta Fuerza para esa armadura: tu velocidad baja 3 m.')}</span>` : ''}`),
            $.addEventListener('click', () => !B.selected && R('kit', B.id)),
            O.append($));
        }
        return (L.append(O), N.note && L.append(elem('p.mg-cr-note', N.note)), L);
      },
      look() {
        return Q();
      },
      identity(N) {
        let L = elem('div.mg-col'),
          O = elem('div.mg-field'),
          B = `nombre-${Math.random().toString(36).slice(2, 6)}`;
        O.append(elem('label', { for: B }, 'Nombre'));
        let $ = elem('div.mg-cr-name-row'),
          ee = elem('input.mg-input', {
            id: B,
            type: 'text',
            maxlength: N.max_length || 28,
            value: N.name || '',
            autocomplete: 'off',
            spellcheck: 'false',
            'data-k': 'nombre',
          }),
          be = 0;
        (ee.addEventListener('input', () => {
          (clearTimeout(be),
            (be = setTimeout(() => {
              let W = a.sheetSet(i, { what: 'name', value: ee.value }, { level: l, step: c });
              W && !W.error && ((i = W.sheet), (r = W.options || r), ie(), t.onChange?.(i, r));
            }, 220)));
        }),
          ee.addEventListener('keydown', (W) => W.key === 'Enter' && ee.blur()),
          $.append(ee, Qd('dice', 'Nombre al azar', { onclick: () => R('random_name', !0) })),
          O.append($),
          L.append(O),
          N.pronouns &&
            (L.append(j(N.pronoun_label || 'Pronombre')), L.append(U(N.pronouns, (W) => R('pronoun', W.id)))),
          L.append(j('Resumen')));
        let Ce = elem('div.mg-cr-sum');
        for (let W of N.summary || [])
          Ce.append(elem('div.mg-cr-sum-row', elem('b', W.label), elem('span', W.text)));
        L.append(Ce);
        let ze = Object.entries(r.issues || {});
        if (ze.length) {
          let W = elem('ul.mg-cr-issues');
          for (let [De, rt] of ze) {
            let V = z().find((se) => se.id === De),
              F = elem('li');
            ((F.innerHTML = `<b>${escapeHtml(V?.title || De)}:</b> ${escapeHtml(rt)} `),
              F.append(makeButton('Ir', { size: 'sm', variant: 'ghost', onclick: () => ce(De) })),
              W.append(F));
          }
          L.append(W);
        } else
          L.append(
            elem('div.mg-cr-ready', {
              html: `${iconHtml('check')}<span>Todo listo. ${s ? 'Pulsa \xABContinuar\xBB para subir de nivel.' : 'Pulsa \xABComenzar la aventura\xBB cuando quieras.'}</span>`,
            }),
          );
        return L;
      },
      advance(N) {
        let L = elem('div.mg-col');
        L.append(
          elem('div.mg-adv-hp', {
            html: `${iconHtml('hearts')}<div><b>${escapeHtml(N.hp_text || `+${N.hp_gain} PG`)}</b><div class="mg-dim">${escapeHtml(N.hp_note || `M\xE1ximo: ${N.hp_max}`)}</div></div>`,
          }),
        );
        for (let B of N.lines || []) L.append(elem('p.mg-p', B));
        N.features?.length && (L.append(j('Rasgos nuevos')), L.append(X(N.features)));
        let O = N.subclass;
        if (
          (O &&
            (L.append(j(O.label || 'Subclase')),
            O.choices?.length > 1 && L.append(I(O.choices, (B) => R('subclass', B.id), { noIcon: !0 })),
            L.append(
              J(
                elem('h3.mg-h3', O.name || ''),
                elem('p', O.desc || ''),
                X(O.features),
                O.always_prepared?.length
                  ? elem('p.mg-cr-info', {
                      html: `<b>Siempre preparados:</b> ${escapeHtml(O.always_prepared.map((B) => B.name || B).join(', '))}`,
                    })
                  : null,
              ),
            ),
            O.lands &&
              (L.append(j(O.lands.label || 'Tierra de tu c\xEDrculo')),
              L.append(I(O.lands.cards, (B) => R('land', B.id), { ic: () => 'nature' }))),
            O.hunters_prey &&
              (L.append(j(O.hunters_prey.label || 'Presa del cazador')),
              L.append(I(O.hunters_prey.cards, (B) => R('hunters_prey', B.id), { ic: () => 'mark' })))),
          N.new_skills)
        ) {
          let B = N.new_skills;
          (L.append(j(B.title, K(B))), L.append(U(B.chips, ($) => R(B.what || 'new_skill', $.id))));
        }
        return L;
      },
    };
  function ge() {
    return { lineage: i.lineage, ancestry: i.ancestry };
  }
  function ue(N) {
    let L = zv(e, i.species, { ...(i.appearance || {}), ...N }, ge());
    ((i = { ...i, appearance: L }), we({ keepScroll: !0 }), t.onChange?.(i, r));
  }
  function Q() {
    let N = om(e, i.species, ge());
    i.appearance || (i.appearance = zv(e, i.species, {}, ge()));
    let L = i.appearance,
      O = elem('div.mg-look'),
      B = elem('div.mg-row-flex');
    (B.append(
      makeButton('Al azar', { icon: 'dice', size: 'sm', onclick: () => ue(JT(e, i.species, ge())) }),
      makeButton('Restablecer', {
        icon: 'undo',
        size: 'sm',
        variant: 'ghost',
        onclick: () => ue(Object.fromEntries(N.fields.map((ze) => [ze.key, N.defaults?.[ze.key]]))),
      }),
    ),
      O.append(B));
    let $ = new Map(N.fields.map((ze) => [ze.key, ze])),
      ee = new Set(),
      be = Pv.map(([ze, W]) => [ze, W.filter((De) => $.has(De))]),
      Ce = N.fields.filter((ze) => !Pv.some(([, W]) => W.includes(ze.key))).map((ze) => ze.key);
    Ce.length && be.push(['M\xE1s', Ce]);
    for (let [ze, W] of be)
      if (W.length) {
        O.append(j(ze));
        for (let De of W) (ee.add(De), O.append(oe($.get(De), L[De])));
      }
    return O;
  }
  function oe(N, L) {
    let O = elem('div.mg-look-field');
    if ((O.append(elem('span.mg-label', N.label)), N.type === 'color')) {
      let B = elem('div.mg-swatches', { role: 'group', 'aria-label': N.label });
      for (let $ of N.options || []) {
        let ee = typeof $ == 'string' ? $ : $.color || $.id,
          be = elem('button.mg-swatch', {
            'aria-pressed': String(String(ee).toLowerCase() === String(L).toLowerCase()),
            'aria-label': `${N.label}: ${ee}`,
            style: `background:${ee}`,
            'data-k': `${N.key}_${ee}`,
          });
        (be.addEventListener('click', () => ue({ [N.key]: ee })), B.append(be));
      }
      O.append(B);
    } else if (N.type === 'choice') {
      if (
        (O.append(
          U(
            (N.options || []).map((B) => ({ id: B.id, name: B.label, selected: B.id === L })),
            (B) => ue({ [N.key]: B.id }),
            { label: N.label },
          ),
        ),
        (N.options || []).some((B) => B.swatch))
      )
        for (let B of O.querySelectorAll('.mg-chip')) {
          let $ = N.options.find((ee) => String(ee.id) === B.dataset.k);
          $?.swatch &&
            B.insertAdjacentHTML(
              'afterbegin',
              `<span class="mg-cr-color" style="background:${escapeHtml($.swatch)}"></span>`,
            );
        }
    } else if (N.type === 'range') {
      let B = {
          min: N.min ?? N.options?.min ?? 0,
          max: N.max ?? N.options?.max ?? 1,
          step: N.step ?? N.options?.step ?? 0.01,
        },
        $ = elem('input.mg-range', {
          type: 'range',
          min: B.min,
          max: B.max,
          step: B.step || 0.01,
          value: L ?? 1,
          'aria-label': N.label,
          'data-k': N.key,
        }),
        ee = () => $.style.setProperty('--p', `${(($.value - B.min) / (B.max - B.min)) * 100}%`);
      (ee(),
        $.addEventListener('input', ee),
        $.addEventListener('change', () => ue({ [N.key]: Number($.value) })),
        O.append(
          elem(
            'div.mg-row-flex',
            elem('span.mg-dim.mg-small', 'M\xE1s bajo'),
            elem('div.mg-grow', $),
            elem('span.mg-dim.mg-small', 'M\xE1s alto'),
          ),
        ));
    } else if (N.type === 'toggle') {
      let B = elem('button.mg-switch', {
        role: 'switch',
        'aria-checked': String(!!L),
        'aria-label': N.label,
        'data-k': N.key,
      });
      (B.addEventListener('click', () => ue({ [N.key]: !L })), O.append(B));
    }
    return O;
  }
  function ie() {
    let N = z(),
      L = N.findIndex((De) => De.id === c);
    ((f.innerHTML = ''),
      N.forEach((De, rt) => {
        let V = elem('button.mg-cr-step', {
          'aria-current': De.id === c ? 'step' : null,
          title: De.issue || De.hint || '',
        });
        ((V.innerHTML = `<b>${rt + 1}</b><span>${escapeHtml(De.title)}</span>`),
          De.issue ? V.classList.add('falta') : rt < L && V.classList.add('hecho'),
          V.addEventListener('click', () => ce(De.id)),
          f.append(V));
      }),
      f.querySelector('[aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' }));
    let O = r?.hero || {};
    g.innerHTML = '';
    let B = elem('div.mg-cr-stats');
    for (let [De, rt, V] of [
      ['PG', O.hp, 'Puntos de golpe'],
      ['CA', O.ac, 'Clase de Armadura'],
      ['Vel.', O.speed_m ? `${O.speed_m} m` : '', 'Velocidad'],
      ['Inic.', O.initiative_text, 'Iniciativa'],
    ]) {
      let F = elem('span.mg-stat', elem('b.mg-num', String(rt ?? '\u2014')), elem('span', De));
      (sa(F, V), B.append(F));
    }
    let $ = elem('div.mg-cr-abs');
    for (let [De, rt] of Object.entries(O.abilities || {})) {
      let V = elem(
        'span.mg-ab',
        elem('span.mg-ab-n', rt.short),
        elem('span.mg-ab-v.mg-num', String(rt.score)),
        elem('span.mg-ab-m', en(rt.mod)),
      );
      (sa(V, { title: rt.name, body: nu[De] || '' }), $.append(V));
    }
    g.append(
      elem('div.mg-cr-name', O.name || i.name || 'Tu h\xE9roe'),
      elem('div.mg-cr-sub', O.sub || ''),
      B,
      $,
    );
    let ee = N[L] || {};
    ((w.innerHTML = ''),
      w.append(elem('h2.mg-h2', ee.title || ''), elem('p.mg-cr-hint', { style: 'margin:0' }, ee.hint || '')),
      ee.issue &&
        w.append(elem('p.mg-cr-issue', { html: `${iconHtml('info')}<span>${escapeHtml(ee.issue)}</span>` })),
      (T.innerHTML = ''));
    let be = L === N.length - 1,
      Ce = makeButton('Atr\xE1s', { icon: 'undo', onclick: () => ce(N[L - 1]?.id), disabled: L <= 0 }),
      ze = elem('span.mg-grow', `Paso ${L + 1} de ${N.length}`),
      W = be
        ? makeButton(
            r?.finish_label || (s ? 'Continuar' : n === 'mercenario' ? 'Contratar' : 'Comenzar la aventura'),
            {
              icon: s ? 'level_up' : 'attack',
              variant: 'primary',
              size: 'lg',
              onclick: ke,
              disabled: !r?.ready,
            },
          )
        : makeButton('Siguiente', { icon: 'check', variant: 'primary', onclick: () => ce(N[L + 1]?.id) });
    (be && !r?.ready && (W.title = 'A\xFAn falta algo: mira los avisos de los pasos.'), T.append(Ce, ze, W));
  }
  function we({ keepScroll: N } = {}) {
    if (u) return;
    let L = z();
    ((!c || !L.some(($) => $.id === c)) && (c = L[0]?.id), M(c));
    let O = D(c),
      B = k.scrollTop;
    k.innerHTML = '';
    try {
      let $ = ve[c];
      k.append($ ? $(O || {}) : elem('p.mg-vacio', 'Paso sin vista.'));
    } catch ($) {
      (console.error('[creador]', c, $),
        k.append(elem('p.mg-vacio', `No se ha podido pintar este paso (${$.message}).`)));
    }
    (N && (k.scrollTop = B), ie());
  }
  function ce(N) {
    !N ||
      N === c ||
      ((h[c] = k.scrollTop),
      (c = N),
      we(),
      (k.scrollTop = h[N] || 0),
      (
        k.querySelector('.mg-card[aria-pressed="true"]') || k.querySelector('button:not(:disabled), input')
      )?.focus?.({ preventScroll: !0 }),
      e.bus?.emit('ui:step', { step: N }));
  }
  async function ke() {
    if (!(!r?.ready || d)) {
      d = !0;
      try {
        let N = a.sheetFinish(i);
        if (!N || N.error || N.ok === !1) {
          o.toast((N?.errors || [N?.error || 'La hoja no est\xE1 completa.']).join(' '), 'mal');
          return;
        }
        let L = { ...N.sheet };
        (i.appearance && !L.appearance && (L.appearance = i.appearance), await t.onFinish?.(L));
      } finally {
        d = !1;
      }
    }
  }
  let Qe = (N) => {
    if (u || (o.layers.top && !t.overlay)) return;
    let L = z(),
      O = L.findIndex((B) => B.id === c);
    N.key === 'PageDown' && O < L.length - 1
      ? (ce(L[O + 1].id), N.preventDefault())
      : N.key === 'PageUp' && O > 0 && (ce(L[O - 1].id), N.preventDefault());
  };
  return (
    addEventListener('keydown', Qe),
    we(),
    t.onChange?.(i, r),
    {
      el: p,
      heroEl: x,
      sheet: () => i,
      go: ce,
      dispose() {
        ((u = !0), removeEventListener('keydown', Qe), p.remove());
      },
    }
  );
}
const $L = {
  action: 'Acci\xF3n',
  bonus: 'Acci\xF3n adicional',
  reaction: 'Reacci\xF3n',
  minute: '1 minuto',
  ritual: 'Ritual',
};
const QT = {
  ...Df,
  aoe: ['\xC1rea', 't-dano'],
  save: ['Salvaci\xF3n', 't-control'],
  ranged: ['A distancia', 't-dano'],
  melee: ['Cuerpo a cuerpo', 't-dano'],
};

export { fc };
