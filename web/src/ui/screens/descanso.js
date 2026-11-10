// ui/screens/descanso.js
// Reconstruido de publicado/juego.js (módulo __esm «FT»). Nombres locales aún minificados.

import { iconHtml, escapeHtml, richText, elem, makeButton, Cn, fw } from '../dom.js';
import { screenFrame } from '../modal.js';
import { Wi, Xi } from '../dice.js';
import { ns } from '../labels.js';

function opcionesDescanso() {
  return { width: '46rem', auto: !0, full: !0 };
}
function pantallaDescanso(o, e, t, a) {
  let n = t.R,
    s = () => a.store.cp,
    i = e.kind === 'corto' || e.kind === 'largo' ? e.kind : 'elegir',
    r = e.where || '',
    l = screenFrame(o, { title: 'Descanso', ic: 'campfire' });
  if (((l.foot.hidden = !1), !s())) {
    l.body.innerHTML = `<div class="mg-vacio">${iconHtml('campfire')}No hay ninguna partida en curso.</div>`;
    return;
  }
  let c = null,
    d = async (_, b) => {
      ((c = { k: _, report: b }), a.store.save('auto').catch(() => null));
    },
    u = () => {
      if (!c) return o.close(null);
      (o.close({ kind: c.k }),
        a.bus?.emit(
          c.k === 'corto' ? 'rest:short' : 'rest:long',
          c.k === 'corto' ? { report: c.report, where: r } : { where: r },
        ));
    };
  function h() {
    ((l.title.textContent = 'Descanso'),
      (l.sub.textContent = r ? Mv[r] || r : ''),
      (l.body.innerHTML = ''),
      (l.foot.innerHTML = ''));
    let _ = e.shortLeft ?? s().short_rests_left ?? 2,
      b = _ > 0 && e.allowShort !== !1,
      f = e.allowLong !== !1,
      v = elem('div.mg-rest-choice'),
      x = elem('button.mg-rest-card.corto', { disabled: !b }),
      g =
        _ <= 0
          ? 'Ya no pod\xE9is hacer m\xE1s hasta un descanso largo'
          : b
            ? `Quedan ${fw(_, 'descanso corto', 'descansos cortos')} hasta el siguiente largo`
            : `Ahora no: ${e.reason || 'no es un buen sitio'}`;
    ((x.innerHTML = `${iconHtml('campfire')}<b>Descanso corto</b><p>Una hora para vendar heridas y recobrar el aliento. Cada uno puede gastar sus dados de golpe para curarse; algunos rasgos se recuperan.</p><small>${escapeHtml(g)}</small>`),
      x.addEventListener('click', p));
    let y = elem('button.mg-rest-card.largo', { disabled: !f }),
      w = f
        ? e.paid
          ? 'Ya est\xE1 pagado'
          : r === 'posada'
            ? 'La posadera os espera'
            : 'Pasa la noche: amanece un nuevo d\xEDa'
        : `Ahora no: ${e.reason || 'solo en la posada o junto a una hoguera segura'}`;
    ((y.innerHTML = `${iconHtml('night')}<b>Descanso largo</b><p>Una noche entera ${escapeHtml(Mv[r] || 'a resguardo')}. Recuper\xE1is todos los puntos de golpe, los espacios de conjuro, los rasgos y los dados de golpe.</p><small>${escapeHtml(w)}</small>`),
      y.addEventListener('click', m),
      v.append(x, y),
      l.body.append(v),
      l.foot.append(makeButton('Seguir sin descansar', { onclick: () => o.close(null) })),
      (b ? x : f ? y : l.foot.querySelector('button'))?.focus());
  }
  function p() {
    ((i = 'corto'),
      (l.title.textContent = 'Descanso corto'),
      (l.sub.textContent = 'Una hora'),
      (l.body.innerHTML = ''),
      (l.foot.innerHTML = ''));
    let _ = n.partySummary();
    n._lastParty = _;
    let b = {},
      f = elem('div.mg-rest-rows');
    l.body.append(
      elem(
        'p.mg-p.mg-dim',
        { style: 'margin-bottom:.6rem' },
        'Elige cu\xE1ntos dados de golpe gasta cada uno. Cada dado cura lo que saque m\xE1s la Constituci\xF3n.',
      ),
      f,
    );
    for (let g of _) {
      if (g.dead) continue;
      let y = g.hit_dice || { cur: 0, max: 0, die: 8 },
        w = { ...y, die: Number(String(y.die ?? 8).replace(/^d/i, '')) || 8 },
        k = (g.max_hp || 0) - (g.hp || 0),
        T = Math.max(1, Math.floor(w.die / 2) + 1 + (g.abilities?.con?.mod || 0));
      b[g.id] = Math.min(w.cur, Math.ceil(Math.max(0, k) / T));
      let E = elem('div.mg-rest-row', { 'data-id': g.id }),
        S = Math.max(0, g.hp) / Math.max(1, g.max_hp);
      (E.append(Cn(t.portrait(g.id), { id: g.id, name: g.name, ic: ns[g.class] || 'person' })),
        E.append(
          elem(
            'div.who',
            elem('b', String(g.name).split(' ')[0]),
            elem(
              'span',
              `d${w.die} \xB7 Constituci\xF3n ${g.abilities?.con?.mod >= 0 ? '+' : '\u2212'}${Math.abs(g.abilities?.con?.mod || 0)}`,
            ),
          ),
        ));
      let z = elem('div.mg-hp', {
        html: `<span class="mg-hp-fill" style="width:${S * 100}%"></span><span class="mg-hp-txt">${escapeHtml(g.hp)} / ${escapeHtml(g.max_hp)}</span>`,
      });
      E.append(z);
      let D = elem('div.mg-hd'),
        M = elem('span.n'),
        R = () => {
          ((M.innerHTML = `${b[g.id]} de ${w.cur}<small>dados de golpe</small>`),
            (A.disabled = b[g.id] <= 0),
            (P.disabled = b[g.id] >= w.cur));
        },
        A = makeButton('\u2212', { size: 'sm', onclick: () => ((b[g.id] -= 1), R()) }),
        P = makeButton('+', { size: 'sm', onclick: () => ((b[g.id] += 1), R()) });
      (A.setAttribute('aria-label', `Un dado menos para ${g.name}`),
        P.setAttribute('aria-label', `Un dado m\xE1s para ${g.name}`),
        D.append(A, M, P),
        R(),
        E.append(D, elem('div.mg-rest-dice')),
        f.append(E));
    }
    let v = makeButton('Descansar una hora', { icon: 'hourglass', variant: 'primary' });
    v.addEventListener('click', async () => {
      ((v.disabled = !0), (x.disabled = !0));
      for (let T of f.querySelectorAll('button')) T.disabled = !0;
      let g = n.shortRest(b);
      if (!g || g.error || g.ok === !1) {
        (t.toast(g?.reason || g?.error || 'No se ha podido descansar.', 'mal'),
          (v.disabled = x.disabled = !1));
        return;
      }
      c = { k: 'corto', report: g.report };
      for (let [T, E] of Object.entries(g.report || {})) {
        if (T.startsWith('_')) continue;
        let S = f.querySelector(`[data-id="${CSS.escape(T)}"]`);
        if (!S) continue;
        let z = S.querySelector('.mg-rest-dice'),
          D = (n._lastParty || []).find((P) => P.id === T),
          M = Number(String(E.die || D?.hit_dice?.die || 8).replace(/^d/i, '')) || 8,
          R = E.rolls || Array.from({ length: E.dice || 0 }, () => ''),
          A = R.map(() => Wi(M, '', { size: 'sm' }));
        (z.append(...A),
          await Promise.all(A.map((P, I) => Xi(P, R[I] === '' ? '' : R[I], { ms: 450 + I * 90 }))),
          E.healed
            ? z.append(elem('span.mg-rest-res', `+${E.healed} PG`))
            : E.dice || z.append(elem('span.mg-dim.mg-small', 'No gasta dados.')));
      }
      let y = n.partySummary();
      for (let T of y) {
        let E = f.querySelector(`[data-id="${CSS.escape(T.id)}"]`);
        E &&
          ((E.querySelector('.mg-hp-fill').style.width =
            `${(Math.max(0, T.hp) / Math.max(1, T.max_hp)) * 100}%`),
          (E.querySelector('.mg-hp-txt').textContent = `${T.hp} / ${T.max_hp}`));
      }
      let w = g.identified || g.report?._identified || [];
      (w.length && t.toast(`Identific\xE1is: ${w.map((T) => T.name || T).join(', ')}.`, 'botin'),
        g.text && t.hud?.visible && t.hud.log(g.text, 'bien'),
        await d('corto', g.report),
        (l.foot.innerHTML = ''));
      let k = makeButton('Seguir', { icon: 'check', variant: 'primary', onclick: u });
      (l.foot.append(k), k.focus());
    });
    let x = makeButton(e.kind === 'corto' ? 'Cancelar' : 'Atr\xE1s', {
      onclick: () => (e.kind === 'corto' ? o.close(null) : h()),
    });
    (l.foot.append(x, v), v.focus());
  }
  async function m() {
    ((i = 'largo'),
      (l.title.textContent = 'Descanso largo'),
      (l.sub.textContent = r ? Mv[r] || r : ''),
      (l.body.innerHTML = ''),
      (l.foot.innerHTML = ''));
    let _ = n.longRest();
    if (!_ || _.error || _.ok === !1)
      return (t.toast(_?.reason || _?.error || 'No se ha podido descansar.', 'mal'), h());
    let b = elem('div.mg-col', { style: 'justify-items:center;text-align:center;padding:1rem 0' }),
      f = e.text ? richText(e.text) : 'La noche pasa sin sobresaltos.';
    ((b.innerHTML = `${iconHtml('sunrise', 'mg-big')}<p class="mg-p" style="font-size:1.15rem;max-width:30rem">${f} Al amanecer del d\xEDa ${escapeHtml(s().day || '')}, el grupo se levanta descansado: puntos de golpe, espacios de conjuro y rasgos, recuperados.</p>`),
      (b.querySelector('.mg-big').style.cssText =
        'width:4.5rem;height:4.5rem;color:var(--oro);filter:drop-shadow(0 0 14px rgba(242,207,122,.5))'),
      _.text && b.append(elem('p.mg-dim', _.text)),
      l.body.append(b),
      await d('largo'));
    let v = makeButton('Seguir', { icon: 'check', variant: 'primary', onclick: u });
    (l.foot.append(v), v.focus());
  }
  return (i === 'corto' ? p() : i === 'largo' ? m() : h(), { onEscape: u });
}
const Mv = { posada: 'en la posada', campamento: 'junto a la hoguera', templo: 'en el templo' };

export { pantallaDescanso as default, opcionesDescanso as options };
