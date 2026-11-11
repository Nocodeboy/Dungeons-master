// ui/hud.js
// Reconstruido de publicado/juego.js (módulo __esm «o2»). Nombres locales aún minificados.

import { Vector3 } from 'three';
import { iconHtml, escapeHtml, richText, elem, Cn } from './dom.js';
import { ou, ns } from './labels.js';
import { sa } from './tooltip.js';

function createHud(o, e) {
  let t = { select: new Set(), action: new Set(), portrait: new Set() },
    a = (P, I) => {
      for (let U of t[P])
        try {
          U(I);
        } catch (j) {
          console.error('[hud]', P, j);
        }
    },
    n = elem('div.mg-hud', { 'aria-label': 'Interfaz de exploraci\xF3n' });
  ((n.hidden = !0),
    (n.innerHTML = `
    <nav class="mg-hud-party" aria-label="El grupo"></nav>
    <div class="mg-hud-top mg-glass">
      <div class="mg-hud-place"><b></b><span></span></div>
      <div class="mg-hud-gold" title="Oro del grupo">${iconHtml('coins')}<b class="mg-num">0</b><span>po</span></div>
    </div>
    <aside class="mg-hud-log mg-glass" aria-label="Registro">
      <button class="mg-hud-log-t" type="button" aria-expanded="true">${iconHtml('log')}<span>Registro</span></button>
      <div class="mg-hud-log-list mg-scroll" aria-live="polite"></div>
    </aside>
    <div class="mg-hud-prompt mg-glass" role="status"></div>
    <div class="mg-hud-status" role="status"></div>
    <button type="button" class="mg-hud-tip mg-glass" aria-live="polite" title="Cerrar la pista"></button>
    <div class="mg-hud-banner" aria-live="polite"><b></b><span></span></div>
    <nav class="mg-hud-bar mg-panel" aria-label="Acciones"></nav>
    <div class="mg-hud-labels" aria-hidden="true"></div>`),
    o.root.append(n));
  let s = (P) => n.querySelector(P),
    i = s('.mg-hud-party'),
    r = s('.mg-hud-bar'),
    l = s('.mg-hud-log-list'),
    c = s('.mg-hud-labels');
  s('.mg-hud-tip').addEventListener('click', (P) => P.currentTarget.classList.remove('on'));
  let d = {},
    u = null,
    h = [],
    p = !1;
  for (let P of lz) {
    if (!P) {
      r.append(elem('span.mg-hud-sep', { 'aria-hidden': 'true' }));
      continue;
    }
    let [I, U, j, X, J] = P,
      Z = elem('button.mg-hud-act', { 'data-kind': I, 'aria-label': `${U} (${X})` });
    ((Z.innerHTML = `${iconHtml(j)}<span class="mg-hud-act-l">${escapeHtml(U)}</span><span class="mg-key">${escapeHtml(X)}</span>`),
      sa(Z, () => ({ title: U, body: J, foot: `Atajo: ${X}` })),
      Z.addEventListener('click', () => b(I)),
      r.append(Z),
      (d[I] = Z));
  }
  (d.stealth.setAttribute('aria-pressed', 'false'), d.run.setAttribute('aria-pressed', 'false'));
  let m = elem('button.mg-hud-all', { 'aria-label': 'Seleccionar a todo el grupo' });
  ((m.innerHTML = `${iconHtml('meeple')}<span>Todos</span>`),
    sa(m, { title: 'Todo el grupo', body: 'Selecciona a todos para moveros juntos.', foot: 'Atajo: G' }),
    m.addEventListener('click', () => b('select_all')));
  let _ = {
    inventory: () => o.open('inventario', { who: u }),
    party: () => o.open('grupo', { who: u }),
    journal: () => o.open('diario'),
    map: () => o.open('viaje', { consult: !0 }),
    menu: () => o.open('pausa'),
    rest: () => o.open('descanso', { kind: 'elegir' }),
  };
  function b(P) {
    if (D) {
      (P === 'menu' ? (D.onMenu ? D.onMenu() : o.open('pausa')) : D.onAction ? D.onAction(P) : _[P]?.(),
        e.bus?.emit('hud:action', { kind: P }));
      return;
    }
    if (p && !['menu', 'journal', 'party', 'inventory'].includes(P)) return;
    let I = d[P];
    if (I?.getAttribute('aria-disabled') === 'true') {
      I.dataset.reason && o.toast(I.dataset.reason, 'mal');
      return;
    }
    (e.bus?.emit('hud:action', { kind: P }),
      a('action', { kind: P }),
      P in _ && !A._handled.has(P) && _[P]());
  }
  (o.keys.set('c', () => b('stealth')),
    o.keys.set('b', () => b('search')),
    o.keys.set('r', () => b('rest')),
    o.keys.set('x', () => b('run')),
    o.keys.set('g', () => b('select_all')),
    matchMedia('(max-width: 720px)').matches &&
      (s('.mg-hud-log').classList.add('plegado'), s('.mg-hud-log-t').setAttribute('aria-expanded', 'false')),
    s('.mg-hud-log-t').addEventListener('click', () => {
      let I = !s('.mg-hud-log').classList.toggle('plegado');
      s('.mg-hud-log-t').setAttribute('aria-expanded', String(I));
    }));
  function f() {
    let P = e.store.cp ? o.R.partySummary() : [];
    if (!D?.party) return P;
    let I = new Map(P.map((U) => [U.id, U]));
    return D.party.map((U) => ({
      ...(I.get(U.id) || {}),
      id: U.id,
      name: U.fullName ?? U.name ?? I.get(U.id)?.name,
      hp: U.hp ?? I.get(U.id)?.hp ?? 0,
      max_hp: U.maxHp ?? U.max_hp ?? I.get(U.id)?.max_hp ?? 1,
      dead: U.dead ?? I.get(U.id)?.dead,
      down: U.down,
      portrait: U.portrait,
      leader: U.leader,
      sel: U.selected,
    }));
  }
  function v() {
    if (((h = f()), D?.party)) {
      let I = h.find((U) => U.leader) || h.find((U) => U.sel);
      I && (u = I.id);
    }
    ((!u || !h.some((I) => I.id === u)) && (u = h[0]?.id || null), (i.innerHTML = ''));
    for (let I of h) {
      let U = Math.max(0, I.hp) / Math.max(1, I.max_hp),
        j = D?.party ? !!(I.sel || I.leader) : I.id === u,
        X = elem('button.mg-hud-pj', { 'aria-pressed': String(j), 'data-id': I.id });
      (I.dead ? X.classList.add('muerto') : (I.hp <= 0 || I.down) && X.classList.add('caido'),
        I.leader && X.classList.add('lider'));
      let J = Cn(I.portrait || o.portrait(I.id), {
          name: I.name,
          ic: ns[I.class] || 'person',
          cls: 'mg-hud-face',
        }),
        Z = J.querySelector('img');
      (Z && (Z.dataset.retrato = I.id),
        X.append(J),
        X.insertAdjacentHTML(
          'beforeend',
          `<span class="mg-hud-ca" title="Clase de Armadura">${escapeHtml(I.ac)}</span>
         <span class="mg-hud-pj-d"><b>${escapeHtml(String(I.name || '').split(' ')[0])}</b>
         <span class="mg-hp${U <= 0.3 && I.hp > 0 ? ' bajo' : ''}"><span class="mg-hp-fill" style="width:${U * 100}%"></span>${I.temp_hp ? `<span class="mg-hp-temp" style="width:${Math.min(100, (I.temp_hp / I.max_hp) * 100)}%"></span>` : ''}<span class="mg-hp-txt">${I.dead ? 'Muerto' : I.hp <= 0 ? 'Ca\xEDdo' : `${I.hp}/${I.max_hp}`}</span></span>
         <span class="mg-hud-cond">${(I.conditions || []).map((ge) => escapeHtml(ou(ge))).join(' \xB7 ')}</span></span>`,
        ),
        X.setAttribute(
          'aria-label',
          `${I.name}, ${I.hp} de ${I.max_hp} puntos de golpe${I.id === u ? ', seleccionado' : ''}`,
        ),
        sa(X, () => ({
          title: I.name,
          sub: `${I.species_name || ''} \xB7 ${I.class_name || ''} ${I.level ? `\xB7 nivel ${I.level}` : ''}`,
          body: `CA ${I.ac} \xB7 PG ${I.hp}/${I.max_hp}${I.temp_hp ? ` (+${I.temp_hp} temporales)` : ''}${
            I.conditions?.length
              ? `
*${I.conditions.map(ou).join(', ')}*`
              : ''
          }`,
          foot: 'Clic: seleccionar \xB7 Doble clic: ficha',
        })),
        X.addEventListener('click', (ge) => {
          (D?.onMember && D.onMember(I.id, { additive: ge.shiftKey || ge.ctrlKey || ge.metaKey }),
            x(I.id, { keep: !!D?.party }));
        }));
      let K = () => (D?.onMemberHold ? D.onMemberHold(I.id) : o.open('grupo', { who: I.id }));
      (X.addEventListener('dblclick', () => {
        (a('portrait', { id: I.id }), o.open('grupo', { who: I.id }));
      }),
        X.addEventListener('contextmenu', (ge) => {
          (ge.preventDefault(), K());
        }));
      let ve = 0;
      X.addEventListener('pointerdown', (ge) => {
        ge.pointerType !== 'mouse' && (ve = setTimeout(K, 550));
      });
      for (let ge of ['pointerup', 'pointercancel', 'pointerleave'])
        X.addEventListener(ge, () => clearTimeout(ve));
      i.append(X);
    }
    h.length > 1 &&
      ((m.querySelector('[data-pend]') || !m.querySelector('svg')) &&
        (m.innerHTML = `${iconHtml('meeple')}<span>Todos</span>`),
      i.append(m));
    let P = e.store.cp;
    s('.mg-hud-gold b').textContent = D?.gold ?? (P ? (P.gold ?? 0) : 0);
  }
  function x(P, { silent: I, keep: U } = {}) {
    if (h.some((j) => j.id === P)) {
      if (((u = P), !U)) for (let j of i.children) j.setAttribute('aria-pressed', String(j.dataset.id === P));
      I || (a('select', { id: P }), e.bus?.emit('hud:select', { id: P }));
    }
  }
  let g = !1,
    y = () => {
      g ||
        n.hidden ||
        ((g = !0),
        requestAnimationFrame(() => {
          ((g = !1), v());
        }));
    };
  (e.bus?.on('cp:changed', y),
    e.bus?.on('game:loaded', y),
    e.bus?.on('level:enter', () => A.show()),
    e.bus?.on('battle:start', () => n.classList.add('en-combate')),
    e.bus?.on('battle:end', () => {
      (n.classList.remove('en-combate'), y());
    }),
    e.bus?.on('stealth:on', () => A.stealth(!0)),
    e.bus?.on('stealth:off', () => A.stealth(!1)),
    e.bus?.on('gold', ({ delta: P } = {}) => {
      if (!P) return;
      let I = s('.mg-hud-gold');
      (I.classList.remove('sube', 'baja'), I.offsetWidth, I.classList.add(P > 0 ? 'sube' : 'baja'));
    }));
  let w = new Map(),
    k = [],
    T = new Vector3(),
    E = 0;
  function S() {
    E = 0;
    let P = e.stage?.camera;
    if (!P || n.hidden) return;
    let I = innerWidth,
      U = innerHeight;
    for (let X of w.values()) {
      let J = typeof X.at == 'function' ? X.at(T) : X.at;
      if (!J) {
        X.el.style.visibility = 'hidden';
        continue;
      }
      T.copy(J).project(P);
      let Z = T.z < 1 && Math.abs(T.x) < 1.2 && Math.abs(T.y) < 1.2;
      ((X.el.style.visibility = Z ? 'visible' : 'hidden'),
        Z &&
          (X.el.style.transform = `translate(${((T.x * 0.5 + 0.5) * I).toFixed(1)}px, ${((-T.y * 0.5 + 0.5) * U).toFixed(1)}px) translate(-50%, -100%)`));
    }
    let j = performance.now();
    for (let X = k.length - 1; X >= 0; X--) {
      let J = k[X],
        Z = (j - J.t0) / 1e3;
      T.copy(J.at).project(P);
      let K = (T.x * 0.5 + 0.5) * I,
        ve = (-T.y * 0.5 + 0.5) * U - Z * 40,
        ge = Z < 0.15 ? Z / 0.15 : Math.max(0, 1 - (Z - 1.1) / 0.6);
      ((J.el.style.transform = `translate(${K.toFixed(1)}px, ${ve.toFixed(1)}px) translate(-50%, -100%)`),
        (J.el.style.opacity = ge.toFixed(3)),
        Z > 1.7 && (J.el.remove(), k.splice(X, 1)));
    }
    (w.size || k.length) && (E = requestAnimationFrame(S));
  }
  let z = () => {
      E || (E = requestAnimationFrame(S));
    },
    D = null;
  function M(P = {}) {
    D &&
      (Object.assign(D, P),
      ('party' in P || 'gold' in P) && v(),
      ('place' in P || 'day' in P) &&
        A.setPlace(
          D.place || '',
          D.day != null ? `D\xEDa ${D.day}${D.time ? ` \xB7 ${D.time}` : ''}` : void 0,
        ),
      'stealth' in P && A.stealth(!!D.stealth),
      'run' in P && d.run.setAttribute('aria-pressed', String(!!D.run)),
      'busy' in P && A.busy(!!D.busy),
      'actions' in P && A.setActions(D.actions));
  }
  let R = { oro: '', bien: 'bien', malo: 'malo', mal: 'malo', apagado: 'apagado', magia: 'magia' },
    A = {
      explore(P = {}) {
        return (
          (D = { ...P }),
          n.classList.add('modo-explore'),
          (n.hidden = !1),
          M(P),
          v(),
          z(),
          {
            update: (I) => M(I),
            toast: (I, U) => o.toast(I, U),
            banner: (I, U = 'oro', j = 3200) => {
              (A.banner(I, '', j), (s('.mg-hud-banner').dataset.tipo = R[U] ?? U));
            },
            hint: (I) => A.prompt(I || null, { key: '' }),
            status: (I) => A.status(I),
            show: () => {
              ((n.hidden = !1), v(), z());
            },
            hide: () => A.hide(),
            isOnUi: (I, U) => A.isOnUi(I, U),
            dispose: () => {
              ((D = null), n.classList.remove('modo-explore'), A.hide());
            },
          }
        );
      },
      isOnUi(P, I) {
        let U = document.elementFromPoint(P, I);
        return !U || U === o.root || !o.root.contains(U) ? !1 : !U.closest('.mg-hud-labels');
      },
      hint(P, { ms: I = 9e3 } = {}) {
        let U = s('.mg-hud-tip');
        if ((clearTimeout(A._tipT), !P)) {
          U.classList.remove('on');
          return;
        }
        if (e.store.settings?.tips === !1) {
          A.log(`<i>Pista:</i> ${richText(String(P))}`, 'pista');
          return;
        }
        if (n.hidden) {
          o.toast(P, 'info');
          return;
        }
        ((U.innerHTML = `${iconHtml('lantern')}<span><b>Pista</b>${richText(String(P))}</span>`),
          U.classList.remove('on'),
          U.offsetWidth,
          U.classList.add('on'),
          A.log(`<i>Pista:</i> ${richText(String(P))}`, 'pista'),
          (A._tipT = setTimeout(() => U.classList.remove('on'), Math.max(4e3, I))));
      },
      status(P) {
        let I = s('.mg-hud-status');
        ((I.textContent = P || ''), I.classList.toggle('on', !!P));
      },
      root: n,
      _handled: new Set(),
      get selected() {
        return u;
      },
      get visible() {
        return !n.hidden;
      },
      show() {
        ((n.hidden = !1), v());
        let P = e.store.cp;
        (P?.location?.name && !s('.mg-hud-place b').textContent && A.setPlace(P.location.name), z());
      },
      hide() {
        ((n.hidden = !0), A.prompt(null));
      },
      refresh: () => (n.hidden ? null : v()),
      select: x,
      on(P, I) {
        return (t[P]?.add(I), () => t[P]?.delete(I));
      },
      handle(...P) {
        for (let I of P) A._handled.add(I);
      },
      setActions(P = {}) {
        for (let [I, U] of Object.entries(P)) {
          let j = d[I];
          !j ||
            !U ||
            ('on' in U && j.setAttribute('aria-pressed', String(!!U.on)),
            'disabled' in U && j.setAttribute('aria-disabled', String(!!U.disabled)),
            'reason' in U && (j.dataset.reason = U.reason || ''),
            'hidden' in U && (j.hidden = !!U.hidden));
        }
      },
      stealth(P) {
        (d.stealth.setAttribute('aria-pressed', String(!!P)), n.classList.toggle('sigilo', !!P));
      },
      log(P, I = 'info') {
        let U = elem(`p.mg-hud-msg.${I}`);
        for (U.innerHTML = /<[a-z]/i.test(P) ? P : escapeHtml(P), l.append(U); l.children.length > 120;)
          l.firstChild.remove();
        return (
          (l.scrollTop = l.scrollHeight),
          U.animate?.(
            [
              { opacity: 0, transform: 'translateY(4px)' },
              { opacity: 1, transform: 'none' },
            ],
            { duration: 220, easing: 'ease-out' },
          ),
          U
        );
      },
      prompt(P, { key: I = 'E', icon: U = 'hand' } = {}) {
        let j = s('.mg-hud-prompt');
        if (!P) {
          j.classList.remove('on');
          return;
        }
        ((j.innerHTML = `${iconHtml(U)}<span>${escapeHtml(P)}</span>${I ? `<span class="mg-key">${escapeHtml(I)}</span>` : ''}`),
          j.classList.add('on'));
      },
      banner(P, I = '', U = 3200) {
        let j = s('.mg-hud-banner');
        ((j.querySelector('b').textContent = P),
          (j.querySelector('span').textContent = I),
          j.classList.remove('on'),
          j.offsetWidth,
          j.classList.add('on'),
          clearTimeout(A._bannerT),
          (A._bannerT = setTimeout(() => j.classList.remove('on'), U)));
      },
      setPlace(P, I) {
        let U = e.store.cp;
        ((s('.mg-hud-place b').textContent = P || ''),
          (s('.mg-hud-place span').textContent = I ?? (U ? `D\xEDa ${U.day || 1}` : '')));
      },
      label(P, { text: I, kind: U = 'obj', at: j }) {
        let X = w.get(P);
        (X || ((X = { el: elem(`div.mg-hud-label.${U}`), at: j }), c.append(X.el), w.set(P, X)),
          (X.at = j),
          (X.el.className = `mg-hud-label ${U}`),
          (X.el.textContent = I),
          z());
      },
      unlabel(P) {
        (w.get(P)?.el.remove(), w.delete(P));
      },
      clearLabels() {
        for (let P of [...w.keys()]) A.unlabel(P);
      },
      float(P, I, U = '') {
        let j = elem(`div.mg-hud-float.${U || 'neutro'}`, I);
        (c.append(j),
          k.push({ el: j, at: P.clone ? P.clone() : new Vector3(P.x, P.y, P.z), t0: performance.now() }),
          z());
      },
      dim(P) {
        n.classList.toggle('atenuado', !!P);
      },
      busy(P) {
        ((p = !!P), n.classList.toggle('ocupado', p));
      },
    };
  return A;
}
const lz = [
  [
    'stealth',
    'Sigilo',
    'stealth',
    'C',
    'Ir en sigilo: el grupo avanza agachado (Sigilo contra la Percepci\xF3n de los enemigos).',
  ],
  [
    'search',
    'Buscar',
    'search',
    'B',
    'Buscar con atenci\xF3n: Investigaci\xF3n del grupo para encontrar trampas, cofres y pasadizos.',
  ],
  ['run', 'Correr', 'dash', 'X', 'Correr o andar: corriendo lleg\xE1is antes, pero hac\xE9is m\xE1s ruido.'],
  ['rest', 'Descansar', 'campfire', 'R', 'Descanso corto (1 hora, dados de golpe) o largo donde sea seguro.'],
  null,
  ['inventory', 'Inventario', 'backpack', 'I', 'Equipo y mochila de cada personaje.'],
  ['party', 'Fichas', 'person', 'P', 'Hojas de personaje del grupo.'],
  ['journal', 'Diario', 'open_book', 'J', 'Misiones y notas.'],
  ['map', 'Mapa', 'treasure_map', 'M', 'Mapa de las Marcas de Vharen.'],
  null,
  ['menu', 'Men\xFA', 'menu', 'Esc', 'Pausa: guardar, cargar, ajustes y salir.'],
];

export { createHud };
