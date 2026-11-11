// ui/screens/nivel.js
// Reconstruido de publicado/juego.js (módulo __esm «aM»). Nombres locales aún minificados.

import { iconHtml, escapeHtml, elem, makeButton, faceBadge } from '../dom.js';
import { screenFrame } from '../modal.js';
import { pc } from '../../actors/outfits.js';
import { buildCreator } from '../creator.js';
import { ns } from '../labels.js';

function opcionesNivel() {
  return { width: '86rem', height: '52rem' };
}
function pantallaNivel(o, e, t, a) {
  let n = t.R,
    s = () => a.store.cp;
  if (!s()) {
    setTimeout(() => o.close(null));
    return;
  }
  let i = s().party_level || 1,
    r = Number(e.level || i + 1);
  if (r <= i) {
    (t.toast(`El grupo ya es de nivel ${i}.`, 'info'), setTimeout(() => o.close(null)));
    return;
  }
  let l = s().members.hero,
    c = null,
    d = null;
  function u(p) {
    let m = n.levelChoices(l, p - 1);
    if (!m || m.error || !m.sheet) return h(null);
    (o.el.classList.add('mg-cr-host'),
      (o.el.innerHTML = ''),
      (d = buildCreator(t, a, {
        mode: 'levelup',
        overlay: !0,
        container: o.el,
        sheet: m.sheet,
        options: m.options,
        level: m.level || p,
        title: `Subida de nivel \xB7 ${String(l.name || '').split(' ')[0]} llega a nivel ${m.level || p}`,
        onChange: (b) => c?.setHero(b),
        onDrag: (b) => c?.drag(b),
        onCancel: async () => {
          (await t.confirm('Podr\xE1s subir de nivel m\xE1s tarde desde la ficha del grupo.', {
            titulo: '\xBFDejarlo para luego?',
            si: 'M\xE1s tarde',
            no: 'Seguir',
          })) && o.close(null);
        },
        onFinish: (b) => {
          ((l = b), d.dispose(), c?.dispose(), (c = null), (m.level || p) < r ? u((m.level || p) + 1) : h(b));
        },
      })));
    let _ = document.createElement('canvas');
    (d.heroEl.prepend(_), c?.dispose(), (c = new pc(a, _)), c.setHero(m.sheet));
  }
  function h(p) {
    let m = n.levelUp(r, p ? { hero: p } : void 0);
    (o.el.classList.remove('mg-cr-host'), (o.el.innerHTML = ''));
    let _ = screenFrame(o, { title: `\xA1Nivel ${r}!`, ic: 'level_up' });
    if (!m || m.error || m.ok === !1) {
      _.body.innerHTML = `<div class="mg-vacio">${iconHtml('info')}No se ha podido subir de nivel (${escapeHtml(m?.reason || m?.error || 'sin respuesta')}).</div>`;
      return;
    }
    a.bus?.emit('levelup', { level: r });
    let b = elem('div.mg-rest-rows.mg-scroll', { style: 'overflow-y:auto;min-height:0' });
    for (let v of n.partySummary()) {
      let x = m.gained?.[v.id] || [],
        g = m.hp?.[v.id],
        y = elem('div.mg-rest-row', { style: 'grid-template-columns:3rem minmax(0,1fr)' });
      y.append(faceBadge(t.portrait(v.id), { id: v.id, name: v.name, ic: ns[v.class] || 'person' }));
      let w = elem('div');
      ((w.innerHTML = `<b class="mg-h3" style="font-size:1.05rem">${escapeHtml(v.name)}</b> <span class="mg-dim">\xB7 ${escapeHtml(v.class_name || '')} ${escapeHtml(r)}</span><div><span class="mg-bien">${g ? `+${escapeHtml(g)} PG` : ''}</span>${g ? ' \xB7 ' : ''}<span class="mg-dim">${escapeHtml(v.max_hp)} PG m\xE1ximos</span></div>${x.length ? `<div class="mg-small" style="margin-top:.2rem">${x.map((k) => `<b>${escapeHtml(k.name)}</b>`).join(' \xB7 ')}</div>` : ''}`),
        y.append(w),
        b.append(y));
    }
    (_.body.append(
      elem('p.mg-p', { style: 'margin-bottom:.7rem' }, 'El grupo ha ganado experiencia. Esto es lo nuevo:'),
      b,
    ),
      (_.foot.hidden = !1));
    let f = makeButton('Seguir', { icon: 'check', variant: 'primary', onclick: () => o.close({ level: r }) });
    (_.foot.append(f), f.focus(), a.store.save('auto').catch(() => null));
  }
  return (
    u(i + 1),
    {
      dispose() {
        (c?.dispose(), d?.dispose());
      },
      onEscape: () => d?.el?.querySelector('.mg-cr-top .mg-ibtn')?.click(),
    }
  );
}

export { pantallaNivel as default, opcionesNivel as options };
