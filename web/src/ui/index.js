// ui/index.js
// Reconstruido de publicado/juego.js (módulo __esm «Nv»). Nombres locales aún minificados.

import themeCss from './theme.css';
import menuCss from './menu.css';
import hudCss from './hud.css';
import creatorCss from './creator.css';
import { loadIcons, iconHtml, escapeHtml, Xl, elem, makeButton, Jl, gw } from './dom.js';
import { screenFrame, Tf } from './modal.js';
import { sa, bw } from './tooltip.js';
import { yw, Wi, Xi } from './dice.js';
import { $w } from './rules-mock.js';
import { Xw } from './dialog.js';
import { n2 } from './hud.js';
import { AT } from './portraits.js';
import { Ib } from './labels.js';

function bD() {
  let o = (n) => `url("data:image/svg+xml,${encodeURIComponent(n.replace(/\s+/g, ' '))}")`,
    e = (n) =>
      o(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 26 26'><g transform='${n}'><g fill='none' stroke='#c9a55c' stroke-linecap='round'><path d='M2.5 23 V7 Q2.5 2.5 7 2.5 H23' stroke-width='1.4'/><path d='M6.5 18 V10 Q6.5 6.5 10 6.5 H18' stroke-width='1' opacity='.5'/></g><circle cx='4.6' cy='4.6' r='2.3' fill='#e8cc8c' stroke='#5a4320' stroke-width='.6'/><path d='M23 2.5 l2 0 M2.5 23 l0 2' stroke='#c9a55c' stroke-width='1.4'/></g></svg>`,
      ),
    t = o(
      "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='0.012 0.55' numOctaves='3' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.85 0 0 0 0 0.62 0 0 0 0 0.38 0 0 0 0.065 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
    ),
    a = o(
      "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='p' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='0.045' numOctaves='3' seed='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.42 0 0 0 0 0.27 0 0 0 0 0.1 0 0 0 -0.7 0.42'/></filter><filter id='f' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='9' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.3 0 0 0 0 0.2 0 0 0 0 0.1 0 0 0 0.16 0'/></filter><rect width='100%' height='100%' filter='url(#p)'/><rect width='100%' height='100%' filter='url(#f)'/></svg>",
    );
  return `:root{--orn-a:${e('')};--orn-b:${e('translate(26 0) scale(-1 1)')};--orn-c:${e('translate(0 26) scale(1 -1)')};--orn-d:${e('translate(26 26) scale(-1 -1)')};--grano:${t};--perg-grano:${a};}`;
}
function createUI(o) {
  let e = document.getElementById('ui') || document.body.appendChild(elem('div#ui'));
  (Jl('mg-tokens', bD()),
    Jl('mg-theme', themeCss),
    Jl('mg-screens', menuCss),
    Jl('mg-hud', hudCss),
    Jl('mg-creator', creatorCss),
    yw());
  let t = elem('div.mg-toasts', { role: 'status', 'aria-live': 'polite' });
  e.append(t);
  let a = bw(e),
    n = $w(o),
    s = new Map(),
    i = new Set(),
    r = new Map(),
    l = {
      root: e,
      R: n,
      tips: a,
      game: o,
      ready: Promise.all([loadIcons(), document.fonts?.ready?.catch(() => null)]).then(() => !0),
      button: makeButton,
      tip: sa,
      icon: iconHtml,
      toast(v, x = 'info') {
        let g = { info: 'info', bien: 'check', mal: 'close', botin: 'coins' }[x] || 'info',
          y = elem(`div.mg-toast.${x}`);
        for (y.innerHTML = `${iconHtml(g)}<span>${escapeHtml(v)}</span>`, t.append(y); t.children.length > 4;)
          t.firstChild.remove();
        let w = Math.min(7e3, 2600 + String(v).length * 35);
        return (
          setTimeout(() => {
            (y.classList.add('fuera'), setTimeout(() => y.remove(), 320));
          }, w),
          y
        );
      },
      async roll(v, { title: x } = {}) {
        if (!v) return;
        let g = [].concat(v.d20 ?? []),
          y = v.kept ?? (g.length > 1 ? (v.mode > 0 || v.adv ? Math.max(...g) : Math.min(...g)) : g[0]),
          w = elem('div.mg-toast.mg-rolltoast'),
          k = g.map(() => Wi(20, '', { size: 'sm' })),
          T = v.name || o.store.cp?.members?.[v.who]?.name?.split(' ')[0] || '',
          E = elem('div.mg-roll-txt');
        E.innerHTML = `<b>${escapeHtml(x || v.label || 'Tirada')}${T ? ` \xB7 ${escapeHtml(T)}` : ''}</b><span></span>`;
        let S = elem(
          `span.mg-roll-res.${v.success ? 'ok' : 'ko'}`,
          v.success ? (v.crit ? '\xA1Cr\xEDtico!' : '\xC9xito') : 'Fallo',
        );
        (w.append(...k, E, S),
          t.append(w),
          await Promise.all(k.map((D, M) => Xi(D, g[M], { ms: 650 + M * 120 }))),
          g.length > 1 && k.forEach((D, M) => g[M] !== y && D.classList.add('descartado')));
        let z = Number(v.mod || 0);
        return (
          (E.querySelector('span').textContent =
            `${y} ${z >= 0 ? '+' : '\u2212'} ${Math.abs(z)} = ${v.total}${v.dc != null ? ` contra CD ${v.dc}` : ''}`),
          S.classList.add('on'),
          o.bus?.emit('ui:roll', { success: !!v.success, crit: !!v.crit }),
          setTimeout(() => {
            (w.classList.add('fuera'), setTimeout(() => w.remove(), 320));
          }, 2600),
          v
        );
      },
      loading(v, x) {
        let g = document.getElementById('carga');
        if (v == null) {
          g &&
            !g.classList.contains('fuera') &&
            (g.classList.add('mg-carga', 'fuera'),
            clearInterval(l._tipTimer),
            setTimeout(() => g.classList.contains('fuera') && (g.hidden = !0), 650));
          return;
        }
        let y = g && !g.hidden && !g.classList.contains('fuera');
        if (!y && x != null && !o.scenes?.busy) return;
        (g || ((g = elem('div#carga')), document.body.append(g)),
          (!g.classList.contains('mg-carga') || !g.querySelector('.mg-carga-txt')) &&
            ((g.className = 'mg-carga'),
            (g.innerHTML = `<div class="mg-carga-sello">${iconHtml('horns')}</div><h1>Marca de Granito</h1><p class="mg-carga-txt"></p><div class="mg-carga-pista"><div class="mg-carga-barra indet"></div></div><p class="mg-carga-consejo"></p>`),
            g.setAttribute('role', 'status'),
            g.setAttribute('aria-live', 'polite')),
          (g.hidden = !1),
          g.classList.remove('fuera'),
          (g.querySelector('.mg-carga-txt').textContent = /…$/.test(v) ? v : `${v}\u2026`));
        let w = g.querySelector('.mg-carga-barra');
        x != null
          ? (w.classList.remove('indet'), (w.style.transform = `scaleX(${Math.max(0.04, Math.min(1, x))})`))
          : y || w.classList.add('indet');
        let k = g.querySelector('.mg-carga-consejo');
        if (!k.textContent) {
          let T = () => (k.textContent = Ib[Math.floor(Math.random() * Ib.length)]);
          (T(), clearInterval(l._tipTimer), (l._tipTimer = setInterval(T, 6e3)));
        }
      },
      confirm(v, { si: x = 'S\xED', no: g = 'No', titulo: y = '', peligro: w = !1 } = {}) {
        return c
          .open(
            'confirmar',
            (k) => {
              let T = screenFrame(k, { title: y || '\xBFSeguro?', noClose: !0 });
              ((T.body.innerHTML = `<div>${Xl(v)}</div>`), (T.foot.hidden = !1));
              let E = makeButton(g, { onclick: () => k.close(!1) }),
                S = makeButton(x, { variant: w ? 'danger' : 'primary', onclick: () => k.close(!0) });
              return (S.setAttribute('autofocus', ''), T.foot.append(E, S), { onEscape: () => k.close(!1) });
            },
            { modal: !0, full: !1, auto: !0 },
          )
          .then((k) => !!k);
      },
      choose(v, x, { texto: g = '', cancelar: y = 'Cancelar' } = {}) {
        return c.open(
          'elegir',
          (w) => {
            let k = screenFrame(w, { title: v });
            g && k.body.append(elem('div', { html: Xl(g), style: 'margin-bottom:.7rem' }));
            let T = elem('div.mg-list');
            for (let E of x) {
              let S = elem('button.mg-row', { disabled: !!E.disabled, onclick: () => w.close(E.value ?? E) });
              ((S.innerHTML = `<span class="mg-row-ico">${iconHtml(E.icon || 'check')}</span><span class="mg-row-t"><b>${escapeHtml(E.label)}</b>${E.desc ? `<small>${escapeHtml(E.desc)}</small>` : ''}</span><span class="mg-row-x">${escapeHtml(E.right || '')}</span>`),
                T.append(S));
            }
            (k.body.append(T),
              y && ((k.foot.hidden = !1), k.foot.append(makeButton(y, { onclick: () => w.close(null) }))));
          },
          { modal: !0, full: !1, auto: !0, width: '34rem' },
        );
      },
      message(v, x, { boton: g = 'De acuerdo', ic: y } = {}) {
        return c.open(
          'aviso',
          (w) => {
            let k = screenFrame(w, { title: v, ic: y, noClose: !0 });
            ((k.body.innerHTML = `<div>${Xl(x)}</div>`), (k.foot.hidden = !1));
            let T = makeButton(g, { variant: 'primary', onclick: () => w.close(!0) });
            (T.setAttribute('autofocus', ''), k.foot.append(T));
          },
          { modal: !0, full: !1, auto: !0 },
        );
      },
      async open(v, x = {}) {
        let g = HM[v];
        if (!g) return (l.toast(`Pantalla \xAB${v}\xBB desconocida`, 'mal'), null);
        if (c.isOpen(v) && v !== 'confirmar') return null;
        await l.ready;
        let y = await g(),
          w = y.options ? y.options(x, v) : {};
        return c.open(v, (k) => y.default(k, { ...x, screen: v }, l, o), w);
      },
      close(v) {
        for (let x of [...c.stack].reverse()) (!v || x.name === v) && x.close(null);
      },
      has: (v) => v in HM,
      bark(v, x, { duration: g = 4200 } = {}) {
        let y = o.explore;
        if (y?.say) return y.say(v, x, { duration: g });
        let w = y?.actor?.(v),
          k = o.store.cp?.members?.[v]?.name?.split(' ')[0] || v;
        if (w?.headWorld && l.hud.visible) {
          let T = `bark_${v}`;
          (l.hud.label(T, {
            text: `${k}: \xAB${x.replace(/^«|»$/g, '')}\xBB`,
            kind: 'bark',
            at: (E) => w.headWorld(E).setY(w.headWorld(E).y + 0.45),
          }),
            clearTimeout(l._barks?.[T]),
            (l._barks = l._barks || {}),
            (l._barks[T] = setTimeout(() => l.hud.unlabel(T), g)));
        } else
          l.hud.visible
            ? l.hud.log(`<b>${escapeHtml(k)}:</b> ${escapeHtml(x)}`, 'dialogo')
            : l.toast(`${k}: ${x}`);
      },
      isOpen: (v) => (v ? c.isOpen(v) : c.stack.length > 0),
      portrait(v) {
        if (!v) return null;
        if (s.has(v)) return s.get(v);
        let x = o.actors?.portrait || o.portrait;
        if (x && !i.has(v)) {
          i.add(v);
          let g = o.store.cp?.members?.[v],
            y = g && (v === 'hero' || g.mercenary || String(v).startsWith('merc_'));
          Promise.resolve(x(y ? { ...g, id: v } : v, { size: 160 }))
            .then((w) => w && l.setPortrait(v, w))
            .catch(() => null);
        }
        return null;
      },
      setPortrait(v, x) {
        s.set(v, x);
        for (let g of e.querySelectorAll(`img[data-retrato="${CSS.escape(v)}"]`))
          ((g.src = x), (g.hidden = !1), g.parentElement?.classList.add('con-retrato'));
        l.hud?.refresh?.();
      },
      async resume() {
        let v = o.store.cp;
        if (!v) return;
        c.closeAll();
        let x = v.location || {},
          g = x.level ? 'explore' : 'menu';
        if (!o.scenes.registry.has(g)) {
          l.toast('La exploraci\xF3n a\xFAn no est\xE1 disponible en esta versi\xF3n.', 'mal');
          return;
        }
        await o.go(g, { level: x.level, spawn: x.spawn, cell: x.cell, loaded: !0 });
      },
      async quickSave() {
        if (!o.store.cp) return !1;
        let v = await o.store.save('rapida');
        return (
          l.toast(
            v ? 'Partida guardada (guardado r\xE1pido).' : 'No se ha podido guardar.',
            v ? 'bien' : 'mal',
          ),
          v
        );
      },
    },
    c = new Tf(l, o);
  ((l.layers = c),
    (l.frame = screenFrame),
    (l.keys = {
      set: (v, x) => r.set(v.toLowerCase(), x),
      reset: (v) => r.delete(v.toLowerCase()),
      disabled: !1,
    }));
  let d = Xw(l, o);
  ((l.dialog = d.show), (l.dialogClose = d.close), (l.dialogOpen = () => d.isOpen()), (l.hud = n2(l, o)));
  let u = () => !!o.store.cp && (o.scenes?.name === 'explore' || l.keys.always),
    h = !1;
  (o.bus?.on('battle:start', () => (h = !0)), o.bus?.on('battle:end', () => (h = !1)));
  let p = (v) => () => (h ? l.toast('No en mitad de un combate.', 'mal') : v()),
    m = new Set(['inventario', 'grupo', 'diario', 'viaje']),
    _ = {
      i: p(() => l.open('inventario', { who: l.hud.selected })),
      p: () => l.open('grupo', { who: l.hud.selected }),
      j: () => l.open('diario'),
      m: p(() => l.open('viaje', { consult: !0 })),
      escape: () => l.open('pausa', { battle: h }),
      f5: p(() => l.quickSave()),
    };
  (addEventListener('keydown', (v) => {
    if (v.defaultPrevented) return;
    if (d.isOpen() && !c.top) {
      d.key(v) && v.preventDefault();
      return;
    }
    if (c.key(v)) {
      v.preventDefault();
      return;
    }
    if (gw() || v.ctrlKey || v.metaKey || v.altKey) return;
    let x = (v.key.length === 1, v.key.toLowerCase());
    if (!u() || l.keys.disabled) return;
    x === 'f5' && v.preventDefault();
    let g = r.has(x) ? r.get(x) : _[x];
    if (g && c.top) {
      if (c.stack.length > 1 || !m.has(c.top.name) || !'ipjm'.includes(x) || x.length !== 1) return;
      (v.preventDefault(), c.top.close(null), g(v));
      return;
    }
    g && (v.preventDefault(), g(v));
  }),
    e.addEventListener('click', (v) => {
      let x = v.target.closest?.('button, [role="button"]');
      x && !x.disabled && o.bus?.emit('ui:click', { id: x.id || x.dataset.id || '' });
    }));
  let b = (v) => {
    (document.documentElement.style.setProperty('--ui-escala', String(v.uiScale || 1)),
      document.documentElement.classList.toggle('mg-sin-animaciones', !!v.reduceMotion));
  };
  (b(o.store.settings), o.bus?.on('settings:changed', ({ settings: v }) => b(v)));
  let f = () => {
    (s.clear(), i.clear());
  };
  (o.bus?.on('game:start', f),
    o.bus?.on('game:loaded', f),
    (l.portraitsGen = AT(l, o)),
    o.bus?.on('scene:enter', ({ name: v }) => {
      v !== 'explore' && l.hud.hide();
    }));
  for (let [v, x] of Object.entries(gD)) o.scenes && !o.scenes.registry?.has(v) && o.scenes.register(v, x);
  return l;
}
const HM = {
  inventario: () => import('./screens/inventario.js'),
  tienda: () => import('./screens/tienda.js'),
  descanso: () => import('./screens/descanso.js'),
  grupo: () => import('./screens/grupo.js'),
  diario: () => import('./screens/diario.js'),
  guardar: () => import('./screens/partidas.js'),
  cargar: () => import('./screens/partidas.js'),
  ajustes: () => import('./screens/ajustes.js'),
  nivel: () => import('./screens/nivel.js'),
  botin: () => import('./screens/botin.js'),
  viaje: () => import('./screens/viaje.js'),
  pausa: () => import('./screens/pausa.js'),
  creador: () => import('./screens/creador.js'),
  creditos: () => import('./screens/creditos.js'),
  ayuda: () => import('./screens/ayuda.js'),
  relato: () => import('./screens/relato.js'),
  derrota: () => import('./screens/derrota.js'),
};
const gD = {
  creator: () => import('../scenes/creator.js'),
  travel: () => import('../scenes/travel.js'),
  ending: () => import('../scenes/ending.js'),
};

export { createUI };
