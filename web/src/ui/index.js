// ui/index.js
// Punto de entrada de la interfaz: createUI(game) inyecta las hojas de estilo, monta #ui, el puente de
// reglas, las fichas, el diálogo, el HUD y los retratos, registra las pantallas y las escenas perezosas
// (creator, travel, ending) y los atajos de teclado. Lo llama main.js (game.ui).
// Reconstruido de publicado/juego.js (módulo __esm «Nv»).

import themeCss from './theme.css';
import menuCss from './menu.css';
import hudCss from './hud.css';
import creatorCss from './creator.css';
import {
  loadIcons,
  iconHtml,
  escapeHtml,
  paragraphsHtml,
  elem,
  makeButton,
  injectStyle,
  isTyping,
} from './dom.js';
import { screenFrame, ScreenStack } from './modal.js';
import { setTip, createTooltip } from './tooltip.js';
import { installDiceDefs, makeDie, rollDie } from './dice.js';
import { createRulesBridge } from './rules-bridge.js';
import { createDialog } from './dialog.js';
import { createHud } from './hud.js';
import { createPortraitPainter } from './portraits.js';
import { GAME_HINTS } from './labels.js';

function ornamentTokensCss() {
  let svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' '))}")`,
    cornerOrnament = (transform) =>
      svgUrl(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 26 26'><g transform='${transform}'><g fill='none' stroke='#c9a55c' stroke-linecap='round'><path d='M2.5 23 V7 Q2.5 2.5 7 2.5 H23' stroke-width='1.4'/><path d='M6.5 18 V10 Q6.5 6.5 10 6.5 H18' stroke-width='1' opacity='.5'/></g><circle cx='4.6' cy='4.6' r='2.3' fill='#e8cc8c' stroke='#5a4320' stroke-width='.6'/><path d='M23 2.5 l2 0 M2.5 23 l0 2' stroke='#c9a55c' stroke-width='1.4'/></g></svg>`,
      ),
    grainUrl = svgUrl(
      "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='0.012 0.55' numOctaves='3' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.85 0 0 0 0 0.62 0 0 0 0 0.38 0 0 0 0.065 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
    ),
    parchmentGrainUrl = svgUrl(
      "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='p' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='0.045' numOctaves='3' seed='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.42 0 0 0 0 0.27 0 0 0 0 0.1 0 0 0 -0.7 0.42'/></filter><filter id='f' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='9' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.3 0 0 0 0 0.2 0 0 0 0 0.1 0 0 0 0.16 0'/></filter><rect width='100%' height='100%' filter='url(#p)'/><rect width='100%' height='100%' filter='url(#f)'/></svg>",
    );
  return `:root{--orn-a:${cornerOrnament('')};--orn-b:${cornerOrnament('translate(26 0) scale(-1 1)')};--orn-c:${cornerOrnament('translate(0 26) scale(1 -1)')};--orn-d:${cornerOrnament('translate(26 26) scale(-1 -1)')};--grano:${grainUrl};--perg-grano:${parchmentGrainUrl};}`;
}
/** Crea el contexto `ui` (toast, roll, loading, confirm, choose, message, open, close, bark, portrait, quickSave…). */
function createUI(game) {
  let root = document.getElementById('ui') || document.body.appendChild(elem('div#ui'));
  (injectStyle('mg-tokens', ornamentTokensCss()),
    injectStyle('mg-theme', themeCss),
    injectStyle('mg-screens', menuCss),
    injectStyle('mg-hud', hudCss),
    injectStyle('mg-creator', creatorCss),
    installDiceDefs());
  let toasts = elem('div.mg-toasts', { role: 'status', 'aria-live': 'polite' });
  root.append(toasts);
  let tips = createTooltip(root),
    rules = createRulesBridge(game),
    portraits = new Map(),
    portraitsAsked = new Set(),
    customKeys = new Map(),
    ui = {
      root,
      R: rules,
      tips,
      game,
      ready: Promise.all([loadIcons(), document.fonts?.ready?.catch(() => null)]).then(() => !0),
      button: makeButton,
      tip: setTip,
      icon: iconHtml,
      toast(text, kind = 'info') {
        let icon = { info: 'info', bien: 'check', mal: 'close', botin: 'coins' }[kind] || 'info',
          toast = elem(`div.mg-toast.${kind}`);
        for (
          toast.innerHTML = `${iconHtml(icon)}<span>${escapeHtml(text)}</span>`, toasts.append(toast);
          toasts.children.length > 4;
        )
          toasts.firstChild.remove();
        let ms = Math.min(7e3, 2600 + String(text).length * 35);
        return (
          setTimeout(() => {
            (toast.classList.add('fuera'), setTimeout(() => toast.remove(), 320));
          }, ms),
          toast
        );
      },
      async roll(result, { title } = {}) {
        if (!result) return;
        let d20s = [].concat(result.d20 ?? []),
          kept =
            result.kept ??
            (d20s.length > 1
              ? result.mode > 0 || result.adv
                ? Math.max(...d20s)
                : Math.min(...d20s)
              : d20s[0]),
          toast = elem('div.mg-toast.mg-rolltoast'),
          dice = d20s.map(() => makeDie(20, '', { size: 'sm' })),
          who = result.name || game.store.cp?.members?.[result.who]?.name?.split(' ')[0] || '',
          line = elem('div.mg-roll-txt');
        line.innerHTML = `<b>${escapeHtml(title || result.label || 'Tirada')}${who ? ` \xB7 ${escapeHtml(who)}` : ''}</b><span></span>`;
        let verdict = elem(
          `span.mg-roll-res.${result.success ? 'ok' : 'ko'}`,
          result.success ? (result.crit ? '\xA1Cr\xEDtico!' : '\xC9xito') : 'Fallo',
        );
        (toast.append(...dice, line, verdict),
          toasts.append(toast),
          await Promise.all(dice.map((die, index) => rollDie(die, d20s[index], { ms: 650 + index * 120 }))),
          d20s.length > 1 &&
            dice.forEach((die, index) => d20s[index] !== kept && die.classList.add('descartado')));
        let mod = Number(result.mod || 0);
        return (
          (line.querySelector('span').textContent =
            `${kept} ${mod >= 0 ? '+' : '\u2212'} ${Math.abs(mod)} = ${result.total}${result.dc != null ? ` contra CD ${result.dc}` : ''}`),
          verdict.classList.add('on'),
          game.bus?.emit('ui:roll', { success: !!result.success, crit: !!result.crit }),
          setTimeout(() => {
            (toast.classList.add('fuera'), setTimeout(() => toast.remove(), 320));
          }, 2600),
          result
        );
      },
      loading(text, progress) {
        let screen = document.getElementById('carga');
        if (text == null) {
          screen &&
            !screen.classList.contains('fuera') &&
            (screen.classList.add('mg-carga', 'fuera'),
            clearInterval(ui._tipTimer),
            setTimeout(() => screen.classList.contains('fuera') && (screen.hidden = !0), 650));
          return;
        }
        let visible = screen && !screen.hidden && !screen.classList.contains('fuera');
        if (!visible && progress != null && !game.scenes?.busy) return;
        (screen || ((screen = elem('div#carga')), document.body.append(screen)),
          (!screen.classList.contains('mg-carga') || !screen.querySelector('.mg-carga-txt')) &&
            ((screen.className = 'mg-carga'),
            (screen.innerHTML = `<div class="mg-carga-sello">${iconHtml('horns')}</div><h1>Marca de Granito</h1><p class="mg-carga-txt"></p><div class="mg-carga-pista"><div class="mg-carga-barra indet"></div></div><p class="mg-carga-consejo"></p>`),
            screen.setAttribute('role', 'status'),
            screen.setAttribute('aria-live', 'polite')),
          (screen.hidden = !1),
          screen.classList.remove('fuera'),
          (screen.querySelector('.mg-carga-txt').textContent = /…$/.test(text) ? text : `${text}\u2026`));
        let bar = screen.querySelector('.mg-carga-barra');
        progress != null
          ? (bar.classList.remove('indet'),
            (bar.style.transform = `scaleX(${Math.max(0.04, Math.min(1, progress))})`))
          : visible || bar.classList.add('indet');
        let hint = screen.querySelector('.mg-carga-consejo');
        if (!hint.textContent) {
          let nextHint = () => (hint.textContent = GAME_HINTS[Math.floor(Math.random() * GAME_HINTS.length)]);
          (nextHint(), clearInterval(ui._tipTimer), (ui._tipTimer = setInterval(nextHint, 6e3)));
        }
      },
      confirm(text, { si: yes = 'S\xED', no = 'No', titulo: title = '', peligro: danger = !1 } = {}) {
        return layers
          .open(
            'confirmar',
            (screen) => {
              let frame = screenFrame(screen, { title: title || '\xBFSeguro?', noClose: !0 });
              ((frame.body.innerHTML = `<div>${paragraphsHtml(text)}</div>`), (frame.foot.hidden = !1));
              let noButton = makeButton(no, { onclick: () => screen.close(!1) }),
                yesButton = makeButton(yes, {
                  variant: danger ? 'danger' : 'primary',
                  onclick: () => screen.close(!0),
                });
              return (
                yesButton.setAttribute('autofocus', ''),
                frame.foot.append(noButton, yesButton),
                { onEscape: () => screen.close(!1) }
              );
            },
            { modal: !0, full: !1, auto: !0 },
          )
          .then((answer) => !!answer);
      },
      choose(title, options, { texto: text = '', cancelar: cancel = 'Cancelar' } = {}) {
        return layers.open(
          'elegir',
          (screen) => {
            let frame = screenFrame(screen, { title });
            text &&
              frame.body.append(elem('div', { html: paragraphsHtml(text), style: 'margin-bottom:.7rem' }));
            let list = elem('div.mg-list');
            for (let option of options) {
              let row = elem('button.mg-row', {
                disabled: !!option.disabled,
                onclick: () => screen.close(option.value ?? option),
              });
              ((row.innerHTML = `<span class="mg-row-ico">${iconHtml(option.icon || 'check')}</span><span class="mg-row-t"><b>${escapeHtml(option.label)}</b>${option.desc ? `<small>${escapeHtml(option.desc)}</small>` : ''}</span><span class="mg-row-x">${escapeHtml(option.right || '')}</span>`),
                list.append(row));
            }
            (frame.body.append(list),
              cancel &&
                ((frame.foot.hidden = !1),
                frame.foot.append(makeButton(cancel, { onclick: () => screen.close(null) }))));
          },
          { modal: !0, full: !1, auto: !0, width: '34rem' },
        );
      },
      message(title, text, { boton: okLabel = 'De acuerdo', ic: icon } = {}) {
        return layers.open(
          'aviso',
          (screen) => {
            let frame = screenFrame(screen, { title, ic: icon, noClose: !0 });
            ((frame.body.innerHTML = `<div>${paragraphsHtml(text)}</div>`), (frame.foot.hidden = !1));
            let okButton = makeButton(okLabel, { variant: 'primary', onclick: () => screen.close(!0) });
            (okButton.setAttribute('autofocus', ''), frame.foot.append(okButton));
          },
          { modal: !0, full: !1, auto: !0 },
        );
      },
      async open(name, params = {}) {
        let load = SCREENS[name];
        if (!load) return (ui.toast(`Pantalla \xAB${name}\xBB desconocida`, 'mal'), null);
        if (layers.isOpen(name) && name !== 'confirmar') return null;
        await ui.ready;
        let mod = await load(),
          opts = mod.options ? mod.options(params, name) : {};
        return layers.open(
          name,
          (screen) => mod.default(screen, { ...params, screen: name }, ui, game),
          opts,
        );
      },
      close(name) {
        for (let entry of [...layers.stack].reverse()) (!name || entry.name === name) && entry.close(null);
      },
      has: (name) => name in SCREENS,
      bark(who, text, { duration = 4200 } = {}) {
        let explore = game.explore;
        if (explore?.say) return explore.say(who, text, { duration });
        let actor = explore?.actor?.(who),
          name = game.store.cp?.members?.[who]?.name?.split(' ')[0] || who;
        if (actor?.headWorld && ui.hud.visible) {
          let labelId = `bark_${who}`;
          (ui.hud.label(labelId, {
            text: `${name}: \xAB${text.replace(/^«|»$/g, '')}\xBB`,
            kind: 'bark',
            at: (target) => actor.headWorld(target).setY(actor.headWorld(target).y + 0.45),
          }),
            clearTimeout(ui._barks?.[labelId]),
            (ui._barks = ui._barks || {}),
            (ui._barks[labelId] = setTimeout(() => ui.hud.unlabel(labelId), duration)));
        } else
          ui.hud.visible
            ? ui.hud.log(`<b>${escapeHtml(name)}:</b> ${escapeHtml(text)}`, 'dialogo')
            : ui.toast(`${name}: ${text}`);
      },
      isOpen: (name) => (name ? layers.isOpen(name) : layers.stack.length > 0),
      portrait(id) {
        if (!id) return null;
        if (portraits.has(id)) return portraits.get(id);
        let render = game.actors?.portrait || game.portrait;
        if (render && !portraitsAsked.has(id)) {
          portraitsAsked.add(id);
          let member = game.store.cp?.members?.[id],
            custom = member && (id === 'hero' || member.mercenary || String(id).startsWith('merc_'));
          Promise.resolve(render(custom ? { ...member, id } : id, { size: 160 }))
            .then((url) => url && ui.setPortrait(id, url))
            .catch(() => null);
        }
        return null;
      },
      setPortrait(id, url) {
        portraits.set(id, url);
        for (let img of root.querySelectorAll(`img[data-retrato="${CSS.escape(id)}"]`))
          ((img.src = url), (img.hidden = !1), img.parentElement?.classList.add('con-retrato'));
        ui.hud?.refresh?.();
      },
      async resume() {
        let cp = game.store.cp;
        if (!cp) return;
        layers.closeAll();
        let loc = cp.location || {},
          scene = loc.level ? 'explore' : 'menu';
        if (!game.scenes.registry.has(scene)) {
          ui.toast('La exploraci\xF3n a\xFAn no est\xE1 disponible en esta versi\xF3n.', 'mal');
          return;
        }
        await game.go(scene, { level: loc.level, spawn: loc.spawn, cell: loc.cell, loaded: !0 });
      },
      async quickSave() {
        if (!game.store.cp) return !1;
        let ok = await game.store.save('rapida');
        return (
          ui.toast(
            ok ? 'Partida guardada (guardado r\xE1pido).' : 'No se ha podido guardar.',
            ok ? 'bien' : 'mal',
          ),
          ok
        );
      },
    },
    layers = new ScreenStack(ui, game);
  ((ui.layers = layers),
    (ui.frame = screenFrame),
    (ui.keys = {
      set: (key, action) => customKeys.set(key.toLowerCase(), action),
      reset: (key) => customKeys.delete(key.toLowerCase()),
      disabled: !1,
    }));
  let dialog = createDialog(ui, game);
  ((ui.dialog = dialog.show),
    (ui.dialogClose = dialog.close),
    (ui.dialogOpen = () => dialog.isOpen()),
    (ui.hud = createHud(ui, game)));
  let hotkeysOn = () => !!game.store.cp && (game.scenes?.name === 'explore' || ui.keys.always),
    inBattle = !1;
  (game.bus?.on('battle:start', () => (inBattle = !0)), game.bus?.on('battle:end', () => (inBattle = !1)));
  let outOfBattle = (action) => () => (inBattle ? ui.toast('No en mitad de un combate.', 'mal') : action()),
    switchableScreens = new Set(['inventario', 'grupo', 'diario', 'viaje']),
    hotkeys = {
      i: outOfBattle(() => ui.open('inventario', { who: ui.hud.selected })),
      p: () => ui.open('grupo', { who: ui.hud.selected }),
      j: () => ui.open('diario'),
      m: outOfBattle(() => ui.open('viaje', { consult: !0 })),
      escape: () => ui.open('pausa', { battle: inBattle }),
      f5: outOfBattle(() => ui.quickSave()),
    };
  (addEventListener('keydown', (ev) => {
    if (ev.defaultPrevented) return;
    if (dialog.isOpen() && !layers.top) {
      dialog.key(ev) && ev.preventDefault();
      return;
    }
    if (layers.key(ev)) {
      ev.preventDefault();
      return;
    }
    if (isTyping() || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    let key = (ev.key.length === 1, ev.key.toLowerCase());
    if (!hotkeysOn() || ui.keys.disabled) return;
    key === 'f5' && ev.preventDefault();
    let action = customKeys.has(key) ? customKeys.get(key) : hotkeys[key];
    if (action && layers.top) {
      if (
        layers.stack.length > 1 ||
        !switchableScreens.has(layers.top.name) ||
        !'ipjm'.includes(key) ||
        key.length !== 1
      )
        return;
      (ev.preventDefault(), layers.top.close(null), action(ev));
      return;
    }
    action && (ev.preventDefault(), action(ev));
  }),
    root.addEventListener('click', (ev) => {
      let button = ev.target.closest?.('button, [role="button"]');
      button && !button.disabled && game.bus?.emit('ui:click', { id: button.id || button.dataset.id || '' });
    }));
  let applySettings = (settings) => {
    (document.documentElement.style.setProperty('--ui-escala', String(settings.uiScale || 1)),
      document.documentElement.classList.toggle('mg-sin-animaciones', !!settings.reduceMotion));
  };
  (applySettings(game.store.settings),
    game.bus?.on('settings:changed', ({ settings }) => applySettings(settings)));
  let clearPortraits = () => {
    (portraits.clear(), portraitsAsked.clear());
  };
  (game.bus?.on('game:start', clearPortraits),
    game.bus?.on('game:loaded', clearPortraits),
    (ui.portraitsGen = createPortraitPainter(ui, game)),
    game.bus?.on('scene:enter', ({ name }) => {
      name !== 'explore' && ui.hud.hide();
    }));
  for (let [name, load] of Object.entries(LAZY_SCENES))
    game.scenes && !game.scenes.registry?.has(name) && game.scenes.register(name, load);
  return ui;
}
const SCREENS = {
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
const LAZY_SCENES = {
  creator: () => import('../scenes/creator.js'),
  travel: () => import('../scenes/travel.js'),
  ending: () => import('../scenes/ending.js'),
};

export { createUI };
