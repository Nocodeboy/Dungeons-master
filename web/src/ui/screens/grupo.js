// ui/screens/grupo.js
// Reconstruido de publicado/juego.js (módulo __esm «qT»). Nombres locales aún minificados.

import { iconHtml, escapeHtml, elem, makeButton, faceBadge, signed } from '../dom.js';
import { screenFrame, es } from '../modal.js';
import { sa } from '../tooltip.js';
import { Kw, Jw, nu, ou, Df, ns } from '../labels.js';

function opcionesGrupo() {
  return { width: '80rem', height: '50rem' };
}
function pantallaGrupo(o, e, t, a) {
  let n = t.R,
    s = () => a.store.cp,
    i = screenFrame(o, { title: 'Fichas del grupo', ic: 'person' });
  if ((i.body.classList.add('mg-fill'), !s())) {
    i.body.innerHTML = `<div class="mg-vacio">${iconHtml('person')}No hay ninguna partida en curso.</div>`;
    return;
  }
  let r = n.partySummary(),
    l = r.some((p) => p.id === e.who) ? e.who : r[0]?.id,
    c = (() => {
      try {
        return a.story?.companions?.() || [];
      } catch {
        return [];
      }
    })(),
    d = es(
      r.map((p) => ({
        id: p.id,
        html: `<span class="mg-memtab">${faceBadge(t.portrait(p.id), { id: p.id, name: p.name, ic: ns[p.class] || 'person' }).outerHTML}<span>${escapeHtml(p.short_name || String(p.name).split(' ')[0])}</span></span>`,
      })),
      l,
      (p) => {
        ((l = p), h());
      },
    );
  ((i.tabs.hidden = !1),
    i.tabs.append(d),
    (i.foot.hidden = !1),
    i.foot.append(
      makeButton('Inventario', {
        icon: 'backpack',
        onclick: () => t.open('inventario', { who: l }),
        key: 'I',
      }),
    ));
  let u = elem('div.mg-sheet.mg-scroll', { style: 'overflow-y:auto' });
  i.body.append(u);
  function h() {
    let p = r.find((D) => D.id === l);
    if (((u.innerHTML = ''), !p)) return;
    let m = elem('div.mg-col'),
      _ = elem('div.mg-sheet-head');
    _.append(
      faceBadge(t.portrait(p.id), {
        id: p.id,
        name: p.name,
        ic: ns[p.class] || 'person',
        cls: 'mg-sheet-face',
      }),
    );
    let b = [
      p.species_name,
      `${p.class_name || ''}${p.subclass_name ? ` (${p.subclass_name})` : ''}`,
      `nivel ${p.level}`,
    ]
      .filter(Boolean)
      .join(' \xB7 ');
    (_.append(
      elem(
        'div',
        elem('div.mg-sheet-name', p.name),
        elem('div.mg-sheet-sub', b),
        p.background_name ? elem('div.mg-sheet-sub', p.background_name) : null,
        p.title ? elem('div.mg-sheet-title', p.title) : null,
      ),
    ),
      m.append(_));
    let f = c.find((D) => D.id === p.id),
      v = f?.approval ?? (p.id !== 'hero' ? a.story?.approval?.(p.id) : null);
    if (v != null && p.id !== 'hero') {
      let D = Math.max(-100, Math.min(100, Number(v) || 0)),
        M = elem('div.mg-col', { style: 'gap:.25rem' });
      (M.append(
        elem(
          'div.mg-row-flex',
          { style: 'justify-content:space-between' },
          elem('span.mg-label', 'Opini\xF3n del grupo'),
          elem('span.mg-num.mg-small', `${D > 0 ? '+' : ''}${D}`),
        ),
      ),
        M.append(
          elem('div.mg-approval', {
            html: `<i style="left:${(D + 100) / 2}%"></i>`,
            role: 'meter',
            'aria-valuemin': '-100',
            'aria-valuemax': '100',
            'aria-valuenow': String(D),
            'aria-label': 'Aprobaci\xF3n',
          }),
        ),
        M.append(elem('div.mg-mood', f?.mood || RL(D))),
        m.append(M));
    }
    let x = elem('div.mg-stats'),
      g = (D, M, R) => {
        let A = elem('span.mg-stat', elem('b.mg-num', String(D)), elem('span', M));
        (sa(A, R), x.append(A));
      };
    (g(p.ac, 'CA', {
      title: 'Clase de Armadura',
      body: (p.ac_parts || []).join(' \xB7 ') || 'Lo dif\xEDcil que es acertarte.',
    }),
      g(`${p.hp}/${p.max_hp}`, 'PG', {
        title: 'Puntos de golpe',
        body: p.temp_hp ? `M\xE1s ${p.temp_hp} temporales.` : 'Si llegan a 0, caes inconsciente.',
      }),
      g(
        p.speed_text || `${String((p.speed || 30) * 0.3).replace('.', ',')} m`,
        'Velocidad',
        'Lo que avanzas en un turno.',
      ),
      g(signed(p.initiative || 0), 'Iniciativa', 'Se suma a la tirada de iniciativa al empezar un combate.'),
      m.append(x));
    let y = elem('div.mg-abs');
    for (let [D, M] of Object.entries(p.abilities || {})) {
      let R = elem(
        `span.mg-ab${M.save_prof ? '.prim' : ''}`,
        elem('span.mg-ab-n', Jw[D] || M.short || D.toUpperCase()),
        elem('span.mg-ab-v.mg-num', String(M.score)),
        elem('span.mg-ab-m', signed(M.mod)),
        elem(`span.mg-ab-s${M.save_prof ? '.prof' : ''}`, `Salv. ${signed(M.save)}`),
      );
      (sa(R, {
        title: Kw[D] || M.name || D,
        body: nu[D] || '',
        foot: M.save_prof ? 'Competente en sus salvaciones.' : '',
      }),
        y.append(R));
    }
    m.append(y);
    let w = p.passive || {};
    (m.append(
      elem(
        'dl.mg-kv',
        elem('dt', 'Bonificador de competencia'),
        elem('dd', signed(p.prof || 2)),
        elem('dt', 'Percepci\xF3n pasiva'),
        elem('dd', String(w.perception ?? '\u2014')),
        elem('dt', 'Investigaci\xF3n pasiva'),
        elem('dd', String(w.investigation ?? '\u2014')),
        elem('dt', 'Perspicacia pasiva'),
        elem('dd', String(w.insight ?? '\u2014')),
        p.darkvision ? elem('dt', 'Visi\xF3n en la oscuridad') : null,
        p.darkvision ? elem('dd', p.darkvision_text || `${p.darkvision} pies`) : null,
        elem('dt', 'Dados de golpe'),
        elem(
          'dd',
          `${p.hit_dice?.cur ?? '\u2014'} / ${p.hit_dice?.max ?? '\u2014'} (d${String(p.hit_dice?.die ?? '?').replace(/^d/, '')})`,
        ),
      ),
    ),
      (p.conditions || []).length &&
        m.append(elem('p.mg-magia', (p.conditions || []).map(ou).join(' \xB7 '))));
    let k = elem('div.mg-col');
    k.append(elem('h3.mg-sec', 'Habilidades'));
    let T = elem('div.mg-skill-list');
    for (let D of p.skills || []) {
      let M = elem(
        `div.mg-skill${D.expert ? '.expert' : D.prof ? '.prof' : ''}${D.adv ? '.adv' : ''}`,
        elem('i'),
        elem('span', D.name),
        elem('small', D.ability_short || ''),
        elem('b.mg-num', signed(D.mod)),
      );
      (sa(M, {
        title: D.name,
        sub: D.ability_short,
        body: D.expert
          ? 'Pericia: duplica el bonificador por competencia.'
          : D.prof
            ? 'Competente.'
            : 'Sin competencia.',
      }),
        T.append(M));
    }
    if ((k.append(T), (p.attacks || []).length)) {
      k.append(elem('h3.mg-sec', 'Ataques'));
      let D = elem('div.mg-inv-atk');
      for (let M of p.attacks) {
        let R = elem(
          'div',
          elem('b', M.name),
          elem('span', `${M.to_hit_text ?? signed(M.to_hit)} \xB7 ${M.damage}`),
        );
        (sa(R, {
          title: M.name,
          body:
            [
              M.range ? `Alcance: ${M.range}` : '',
              M.mastery ? `Maestr\xEDa: ${M.mastery}` : '',
              M.ammo != null ? `Munici\xF3n: ${M.ammo}` : '',
            ].filter(Boolean).join(`
`) || 'Ataque con arma.',
        }),
          D.append(R));
      }
      k.append(D);
    }
    ((p.languages || []).length || (p.tools || []).length) &&
      k.append(
        elem('h3.mg-sec', 'Idiomas y herramientas'),
        elem('p.mg-p.mg-small', [...(p.languages || []), ...(p.tools || [])].join(', ')),
      );
    let E = elem('div.mg-col.c3'),
      S = p.spells;
    if (S) {
      (E.append(elem('h3.mg-sec', 'Conjuros')),
        E.append(
          elem(
            'p.mg-small.mg-dim',
            { style: 'margin:0' },
            `${S.ability_name || ''} \xB7 CD ${S.dc} \xB7 ataque ${signed(S.attack)}`,
          ),
        ));
      for (let M of S.slots || []) {
        let R = elem('div.mg-slots-row', elem('span.mg-small', `Nivel ${M.level}:`));
        for (let A = 0; A < M.max; A++)
          R.append(
            elem(`span.mg-pip${A >= M.cur ? '.gastado' : ''}`, {
              title: A < M.cur ? 'Disponible' : 'Gastado',
            }),
          );
        E.append(R);
      }
      let D = (M) => {
        let R = elem('div.mg-cr-chips');
        for (let A of M || []) {
          let P = elem('span.mg-chip', { html: `${iconHtml(A.icon || 'magic')}${escapeHtml(A.name)}` });
          (sa(P, {
            title: A.name,
            sub: `${A.level ? `Nivel ${A.level}` : 'Truco'}${A.school_name ? ` \xB7 ${A.school_name}` : ''}`,
            body: A.desc || '',
            tags: (A.tags || []).map((I) => Df[I]).filter(Boolean),
          }),
            R.append(P));
        }
        return R;
      };
      (S.cantrips?.length && E.append(elem('div.mg-label', 'Trucos'), D(S.cantrips)),
        S.prepared?.length && E.append(elem('div.mg-label', 'Preparados'), D(S.prepared)));
    }
    let z = [
      ...(p.features || []),
      ...(p.traits || []).filter((D) => typeof D == 'object'),
      ...(p.feats || []),
    ];
    if (z.length) {
      E.append(elem('h3.mg-sec', 'Rasgos y dotes'));
      let D = elem('div'),
        M = new Set();
      for (let R of z) {
        if (M.has(R.id)) continue;
        M.add(R.id);
        let A = p.resources?.[R.id],
          P = R.uses != null && R.max != null ? `${R.uses}/${R.max}` : A ? `${A.cur}/${A.max}` : '';
        D.append(
          elem(
            'div.mg-feature',
            elem('b', R.name),
            P ? elem('em', P) : null,
            R.desc ? elem('span', R.desc) : null,
          ),
        );
      }
      E.append(D);
    }
    u.append(m, k, E);
  }
  return (
    h(),
    {
      onKey(p) {
        if (p.key.toLowerCase() === 'p' && !p.target.closest?.('input,textarea')) return (o.close(null), !0);
        if ((p.key === 'ArrowLeft' || p.key === 'ArrowRight') && !p.target.closest?.('.mg-tabs')) {
          let m = r.map((b) => b.id),
            _ = m.indexOf(l);
          return ((l = m[(_ + (p.key === 'ArrowRight' ? 1 : m.length - 1)) % m.length]), d.set(l), h(), !0);
        }
        return !1;
      },
    }
  );
}
const RL = (o) =>
  o >= 60
    ? 'Os aprecia de verdad.'
    : o >= 25
      ? 'Est\xE1 a gusto en el grupo.'
      : o > -25
        ? 'Os observa sin decidirse.'
        : o > -50
          ? 'Empieza a dudar de vosotros.'
          : 'Est\xE1 a punto de marcharse.';

export { pantallaGrupo as default, opcionesGrupo as options };
