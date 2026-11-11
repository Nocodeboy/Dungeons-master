// ui/hud.js
// HUD de exploración: retratos y vida del grupo, oro y lugar, registro, avisos, pistas, barra de acciones
// con atajos y etiquetas o textos flotantes sobre el mundo 3D. Lo crea ui/index.js (ui.hud); lo maneja explore/.
// Reconstruido de publicado/juego.js (módulo __esm «o2»).

import { Vector3 } from 'three';
import { iconHtml, escapeHtml, richText, elem, faceBadge } from './dom.js';
import { conditionName, CLASS_ICONS } from './labels.js';
import { setTip } from './tooltip.js';

/**
 * Crea el HUD (oculto al principio). hud.explore(opts) lo pone en modo exploración y devuelve el manejador
 * que usa explore/ (update, banner, hint, status…); también log, prompt, label, float, setActions…
 */
function createHud(ui, game) {
  let listeners = { select: new Set(), action: new Set(), portrait: new Set() },
    emit = (type, payload) => {
      for (let fn of listeners[type])
        try {
          fn(payload);
        } catch (err) {
          console.error('[hud]', type, err);
        }
    },
    root = elem('div.mg-hud', { 'aria-label': 'Interfaz de exploraci\xF3n' });
  ((root.hidden = !0),
    (root.innerHTML = `
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
    ui.root.append(root));
  let find = (selector) => root.querySelector(selector),
    partyBar = find('.mg-hud-party'),
    actionBar = find('.mg-hud-bar'),
    logList = find('.mg-hud-log-list'),
    labelLayer = find('.mg-hud-labels');
  find('.mg-hud-tip').addEventListener('click', (ev) => ev.currentTarget.classList.remove('on'));
  let actionButtons = {},
    selected = null,
    members = [],
    busy = !1;
  for (let def of HUD_ACTIONS) {
    if (!def) {
      actionBar.append(elem('span.mg-hud-sep', { 'aria-hidden': 'true' }));
      continue;
    }
    let [kind, label, icon, key, desc] = def,
      button = elem('button.mg-hud-act', { 'data-kind': kind, 'aria-label': `${label} (${key})` });
    ((button.innerHTML = `${iconHtml(icon)}<span class="mg-hud-act-l">${escapeHtml(label)}</span><span class="mg-key">${escapeHtml(key)}</span>`),
      setTip(button, () => ({ title: label, body: desc, foot: `Atajo: ${key}` })),
      button.addEventListener('click', () => act(kind)),
      actionBar.append(button),
      (actionButtons[kind] = button));
  }
  (actionButtons.stealth.setAttribute('aria-pressed', 'false'),
    actionButtons.run.setAttribute('aria-pressed', 'false'));
  let allButton = elem('button.mg-hud-all', { 'aria-label': 'Seleccionar a todo el grupo' });
  ((allButton.innerHTML = `${iconHtml('meeple')}<span>Todos</span>`),
    setTip(allButton, {
      title: 'Todo el grupo',
      body: 'Selecciona a todos para moveros juntos.',
      foot: 'Atajo: G',
    }),
    allButton.addEventListener('click', () => act('select_all')));
  let defaultActions = {
    inventory: () => ui.open('inventario', { who: selected }),
    party: () => ui.open('grupo', { who: selected }),
    journal: () => ui.open('diario'),
    map: () => ui.open('viaje', { consult: !0 }),
    menu: () => ui.open('pausa'),
    rest: () => ui.open('descanso', { kind: 'elegir' }),
  };
  function act(kind) {
    if (mode) {
      (kind === 'menu'
        ? mode.onMenu
          ? mode.onMenu()
          : ui.open('pausa')
        : mode.onAction
          ? mode.onAction(kind)
          : defaultActions[kind]?.(),
        game.bus?.emit('hud:action', { kind }));
      return;
    }
    if (busy && !['menu', 'journal', 'party', 'inventory'].includes(kind)) return;
    let button = actionButtons[kind];
    if (button?.getAttribute('aria-disabled') === 'true') {
      button.dataset.reason && ui.toast(button.dataset.reason, 'mal');
      return;
    }
    (game.bus?.emit('hud:action', { kind }),
      emit('action', { kind }),
      kind in defaultActions && !hud._handled.has(kind) && defaultActions[kind]());
  }
  (ui.keys.set('c', () => act('stealth')),
    ui.keys.set('b', () => act('search')),
    ui.keys.set('r', () => act('rest')),
    ui.keys.set('x', () => act('run')),
    ui.keys.set('g', () => act('select_all')),
    matchMedia('(max-width: 720px)').matches &&
      (find('.mg-hud-log').classList.add('plegado'),
      find('.mg-hud-log-t').setAttribute('aria-expanded', 'false')),
    find('.mg-hud-log-t').addEventListener('click', () => {
      let open = !find('.mg-hud-log').classList.toggle('plegado');
      find('.mg-hud-log-t').setAttribute('aria-expanded', String(open));
    }));
  function partyRows() {
    let summary = game.store.cp ? ui.R.partySummary() : [];
    if (!mode?.party) return summary;
    let byId = new Map(summary.map((row) => [row.id, row]));
    return mode.party.map((member) => ({
      ...(byId.get(member.id) || {}),
      id: member.id,
      name: member.fullName ?? member.name ?? byId.get(member.id)?.name,
      hp: member.hp ?? byId.get(member.id)?.hp ?? 0,
      max_hp: member.maxHp ?? member.max_hp ?? byId.get(member.id)?.max_hp ?? 1,
      dead: member.dead ?? byId.get(member.id)?.dead,
      down: member.down,
      portrait: member.portrait,
      leader: member.leader,
      sel: member.selected,
    }));
  }
  function renderParty() {
    if (((members = partyRows()), mode?.party)) {
      let lead = members.find((row) => row.leader) || members.find((row) => row.sel);
      lead && (selected = lead.id);
    }
    ((!selected || !members.some((row) => row.id === selected)) && (selected = members[0]?.id || null),
      (partyBar.innerHTML = ''));
    for (let member of members) {
      let hpFrac = Math.max(0, member.hp) / Math.max(1, member.max_hp),
        pressed = mode?.party ? !!(member.sel || member.leader) : member.id === selected,
        button = elem('button.mg-hud-pj', { 'aria-pressed': String(pressed), 'data-id': member.id });
      (member.dead
        ? button.classList.add('muerto')
        : (member.hp <= 0 || member.down) && button.classList.add('caido'),
        member.leader && button.classList.add('lider'));
      let face = faceBadge(member.portrait || ui.portrait(member.id), {
          name: member.name,
          ic: CLASS_ICONS[member.class] || 'person',
          cls: 'mg-hud-face',
        }),
        img = face.querySelector('img');
      (img && (img.dataset.retrato = member.id),
        button.append(face),
        button.insertAdjacentHTML(
          'beforeend',
          `<span class="mg-hud-ca" title="Clase de Armadura">${escapeHtml(member.ac)}</span>
         <span class="mg-hud-pj-d"><b>${escapeHtml(String(member.name || '').split(' ')[0])}</b>
         <span class="mg-hp${hpFrac <= 0.3 && member.hp > 0 ? ' bajo' : ''}"><span class="mg-hp-fill" style="width:${hpFrac * 100}%"></span>${member.temp_hp ? `<span class="mg-hp-temp" style="width:${Math.min(100, (member.temp_hp / member.max_hp) * 100)}%"></span>` : ''}<span class="mg-hp-txt">${member.dead ? 'Muerto' : member.hp <= 0 ? 'Ca\xEDdo' : `${member.hp}/${member.max_hp}`}</span></span>
         <span class="mg-hud-cond">${(member.conditions || []).map((cond) => escapeHtml(conditionName(cond))).join(' \xB7 ')}</span></span>`,
        ),
        button.setAttribute(
          'aria-label',
          `${member.name}, ${member.hp} de ${member.max_hp} puntos de golpe${member.id === selected ? ', seleccionado' : ''}`,
        ),
        setTip(button, () => ({
          title: member.name,
          sub: `${member.species_name || ''} \xB7 ${member.class_name || ''} ${member.level ? `\xB7 nivel ${member.level}` : ''}`,
          body: `CA ${member.ac} \xB7 PG ${member.hp}/${member.max_hp}${member.temp_hp ? ` (+${member.temp_hp} temporales)` : ''}${
            member.conditions?.length
              ? `
*${member.conditions.map(conditionName).join(', ')}*`
              : ''
          }`,
          foot: 'Clic: seleccionar \xB7 Doble clic: ficha',
        })),
        button.addEventListener('click', (ev) => {
          (mode?.onMember && mode.onMember(member.id, { additive: ev.shiftKey || ev.ctrlKey || ev.metaKey }),
            select(member.id, { keep: !!mode?.party }));
        }));
      let openSheet = () =>
        mode?.onMemberHold ? mode.onMemberHold(member.id) : ui.open('grupo', { who: member.id });
      (button.addEventListener('dblclick', () => {
        (emit('portrait', { id: member.id }), ui.open('grupo', { who: member.id }));
      }),
        button.addEventListener('contextmenu', (ev) => {
          (ev.preventDefault(), openSheet());
        }));
      let holdTimer = 0;
      button.addEventListener('pointerdown', (ev) => {
        ev.pointerType !== 'mouse' && (holdTimer = setTimeout(openSheet, 550));
      });
      for (let type of ['pointerup', 'pointercancel', 'pointerleave'])
        button.addEventListener(type, () => clearTimeout(holdTimer));
      partyBar.append(button);
    }
    members.length > 1 &&
      ((allButton.querySelector('[data-pend]') || !allButton.querySelector('svg')) &&
        (allButton.innerHTML = `${iconHtml('meeple')}<span>Todos</span>`),
      partyBar.append(allButton));
    let cp = game.store.cp;
    find('.mg-hud-gold b').textContent = mode?.gold ?? (cp ? (cp.gold ?? 0) : 0);
  }
  function select(id, { silent, keep } = {}) {
    if (members.some((member) => member.id === id)) {
      if (((selected = id), !keep))
        for (let button of partyBar.children)
          button.setAttribute('aria-pressed', String(button.dataset.id === id));
      silent || (emit('select', { id }), game.bus?.emit('hud:select', { id }));
    }
  }
  let refreshQueued = !1,
    queueRefresh = () => {
      refreshQueued ||
        root.hidden ||
        ((refreshQueued = !0),
        requestAnimationFrame(() => {
          ((refreshQueued = !1), renderParty());
        }));
    };
  (game.bus?.on('cp:changed', queueRefresh),
    game.bus?.on('game:loaded', queueRefresh),
    game.bus?.on('level:enter', () => hud.show()),
    game.bus?.on('battle:start', () => root.classList.add('en-combate')),
    game.bus?.on('battle:end', () => {
      (root.classList.remove('en-combate'), queueRefresh());
    }),
    game.bus?.on('stealth:on', () => hud.stealth(!0)),
    game.bus?.on('stealth:off', () => hud.stealth(!1)),
    game.bus?.on('gold', ({ delta } = {}) => {
      if (!delta) return;
      let goldEl = find('.mg-hud-gold');
      (goldEl.classList.remove('sube', 'baja'),
        goldEl.offsetWidth,
        goldEl.classList.add(delta > 0 ? 'sube' : 'baja'));
    }));
  let labels = new Map(),
    floats = [],
    screenPos = new Vector3(),
    rafId = 0;
  function tick() {
    rafId = 0;
    let camera = game.stage?.camera;
    if (!camera || root.hidden) return;
    let width = innerWidth,
      height = innerHeight;
    for (let label of labels.values()) {
      let pos = typeof label.at == 'function' ? label.at(screenPos) : label.at;
      if (!pos) {
        label.el.style.visibility = 'hidden';
        continue;
      }
      screenPos.copy(pos).project(camera);
      let onScreen = screenPos.z < 1 && Math.abs(screenPos.x) < 1.2 && Math.abs(screenPos.y) < 1.2;
      ((label.el.style.visibility = onScreen ? 'visible' : 'hidden'),
        onScreen &&
          (label.el.style.transform = `translate(${((screenPos.x * 0.5 + 0.5) * width).toFixed(1)}px, ${((-screenPos.y * 0.5 + 0.5) * height).toFixed(1)}px) translate(-50%, -100%)`));
    }
    let now = performance.now();
    for (let index = floats.length - 1; index >= 0; index--) {
      let float = floats[index],
        age = (now - float.t0) / 1e3;
      screenPos.copy(float.at).project(camera);
      let x = (screenPos.x * 0.5 + 0.5) * width,
        y = (-screenPos.y * 0.5 + 0.5) * height - age * 40,
        alpha = age < 0.15 ? age / 0.15 : Math.max(0, 1 - (age - 1.1) / 0.6);
      ((float.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`),
        (float.el.style.opacity = alpha.toFixed(3)),
        age > 1.7 && (float.el.remove(), floats.splice(index, 1)));
    }
    (labels.size || floats.length) && (rafId = requestAnimationFrame(tick));
  }
  let wake = () => {
      rafId || (rafId = requestAnimationFrame(tick));
    },
    mode = null;
  function update(patch = {}) {
    mode &&
      (Object.assign(mode, patch),
      ('party' in patch || 'gold' in patch) && renderParty(),
      ('place' in patch || 'day' in patch) &&
        hud.setPlace(
          mode.place || '',
          mode.day != null ? `D\xEDa ${mode.day}${mode.time ? ` \xB7 ${mode.time}` : ''}` : void 0,
        ),
      'stealth' in patch && hud.stealth(!!mode.stealth),
      'run' in patch && actionButtons.run.setAttribute('aria-pressed', String(!!mode.run)),
      'busy' in patch && hud.busy(!!mode.busy),
      'actions' in patch && hud.setActions(mode.actions));
  }
  let bannerTones = { oro: '', bien: 'bien', malo: 'malo', mal: 'malo', apagado: 'apagado', magia: 'magia' },
    hud = {
      explore(opts = {}) {
        return (
          (mode = { ...opts }),
          root.classList.add('modo-explore'),
          (root.hidden = !1),
          update(opts),
          renderParty(),
          wake(),
          {
            update: (patch) => update(patch),
            toast: (text, kind) => ui.toast(text, kind),
            banner: (text, tone = 'oro', ms = 3200) => {
              (hud.banner(text, '', ms), (find('.mg-hud-banner').dataset.tipo = bannerTones[tone] ?? tone));
            },
            hint: (text) => hud.prompt(text || null, { key: '' }),
            status: (text) => hud.status(text),
            show: () => {
              ((root.hidden = !1), renderParty(), wake());
            },
            hide: () => hud.hide(),
            isOnUi: (x, y) => hud.isOnUi(x, y),
            dispose: () => {
              ((mode = null), root.classList.remove('modo-explore'), hud.hide());
            },
          }
        );
      },
      isOnUi(x, y) {
        let el = document.elementFromPoint(x, y);
        return !el || el === ui.root || !ui.root.contains(el) ? !1 : !el.closest('.mg-hud-labels');
      },
      hint(text, { ms = 9e3 } = {}) {
        let tipEl = find('.mg-hud-tip');
        if ((clearTimeout(hud._tipT), !text)) {
          tipEl.classList.remove('on');
          return;
        }
        if (game.store.settings?.tips === !1) {
          hud.log(`<i>Pista:</i> ${richText(String(text))}`, 'pista');
          return;
        }
        if (root.hidden) {
          ui.toast(text, 'info');
          return;
        }
        ((tipEl.innerHTML = `${iconHtml('lantern')}<span><b>Pista</b>${richText(String(text))}</span>`),
          tipEl.classList.remove('on'),
          tipEl.offsetWidth,
          tipEl.classList.add('on'),
          hud.log(`<i>Pista:</i> ${richText(String(text))}`, 'pista'),
          (hud._tipT = setTimeout(() => tipEl.classList.remove('on'), Math.max(4e3, ms))));
      },
      status(text) {
        let el = find('.mg-hud-status');
        ((el.textContent = text || ''), el.classList.toggle('on', !!text));
      },
      root,
      _handled: new Set(),
      get selected() {
        return selected;
      },
      get visible() {
        return !root.hidden;
      },
      show() {
        ((root.hidden = !1), renderParty());
        let cp = game.store.cp;
        (cp?.location?.name && !find('.mg-hud-place b').textContent && hud.setPlace(cp.location.name),
          wake());
      },
      hide() {
        ((root.hidden = !0), hud.prompt(null));
      },
      refresh: () => (root.hidden ? null : renderParty()),
      select,
      on(type, fn) {
        return (listeners[type]?.add(fn), () => listeners[type]?.delete(fn));
      },
      handle(...kinds) {
        for (let kind of kinds) hud._handled.add(kind);
      },
      setActions(actions = {}) {
        for (let [kind, state] of Object.entries(actions)) {
          let button = actionButtons[kind];
          !button ||
            !state ||
            ('on' in state && button.setAttribute('aria-pressed', String(!!state.on)),
            'disabled' in state && button.setAttribute('aria-disabled', String(!!state.disabled)),
            'reason' in state && (button.dataset.reason = state.reason || ''),
            'hidden' in state && (button.hidden = !!state.hidden));
        }
      },
      stealth(on) {
        (actionButtons.stealth.setAttribute('aria-pressed', String(!!on)),
          root.classList.toggle('sigilo', !!on));
      },
      log(html, cls = 'info') {
        let line = elem(`p.mg-hud-msg.${cls}`);
        for (
          line.innerHTML = /<[a-z]/i.test(html) ? html : escapeHtml(html), logList.append(line);
          logList.children.length > 120;
        )
          logList.firstChild.remove();
        return (
          (logList.scrollTop = logList.scrollHeight),
          line.animate?.(
            [
              { opacity: 0, transform: 'translateY(4px)' },
              { opacity: 1, transform: 'none' },
            ],
            { duration: 220, easing: 'ease-out' },
          ),
          line
        );
      },
      prompt(text, { key = 'E', icon = 'hand' } = {}) {
        let el = find('.mg-hud-prompt');
        if (!text) {
          el.classList.remove('on');
          return;
        }
        ((el.innerHTML = `${iconHtml(icon)}<span>${escapeHtml(text)}</span>${key ? `<span class="mg-key">${escapeHtml(key)}</span>` : ''}`),
          el.classList.add('on'));
      },
      banner(title, sub = '', ms = 3200) {
        let el = find('.mg-hud-banner');
        ((el.querySelector('b').textContent = title),
          (el.querySelector('span').textContent = sub),
          el.classList.remove('on'),
          el.offsetWidth,
          el.classList.add('on'),
          clearTimeout(hud._bannerT),
          (hud._bannerT = setTimeout(() => el.classList.remove('on'), ms)));
      },
      setPlace(place, sub) {
        let cp = game.store.cp;
        ((find('.mg-hud-place b').textContent = place || ''),
          (find('.mg-hud-place span').textContent = sub ?? (cp ? `D\xEDa ${cp.day || 1}` : '')));
      },
      label(id, { text, kind = 'obj', at }) {
        let entry = labels.get(id);
        (entry ||
          ((entry = { el: elem(`div.mg-hud-label.${kind}`), at }),
          labelLayer.append(entry.el),
          labels.set(id, entry)),
          (entry.at = at),
          (entry.el.className = `mg-hud-label ${kind}`),
          (entry.el.textContent = text),
          wake());
      },
      unlabel(id) {
        (labels.get(id)?.el.remove(), labels.delete(id));
      },
      clearLabels() {
        for (let id of [...labels.keys()]) hud.unlabel(id);
      },
      float(pos, text, cls = '') {
        let el = elem(`div.mg-hud-float.${cls || 'neutro'}`, text);
        (labelLayer.append(el),
          floats.push({
            el,
            at: pos.clone ? pos.clone() : new Vector3(pos.x, pos.y, pos.z),
            t0: performance.now(),
          }),
          wake());
      },
      dim(on) {
        root.classList.toggle('atenuado', !!on);
      },
      busy(on) {
        ((busy = !!on), root.classList.toggle('ocupado', busy));
      },
    };
  return hud;
}
const HUD_ACTIONS = [
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
