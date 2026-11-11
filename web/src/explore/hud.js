// explore/hud.js — HUD propio de la exploración (retratos del grupo, lugar y oro, botones de acción,
// avisos, bandera y pistas) y ventanas de sustituto para cuando la interfaz de ui/ no está: diálogo,
// botín y rótulo de transición («Una hora después…»). Lo usan explore/index.js e interact.js.
// Reconstruido de publicado/juego.js (módulo __esm «X1»).

/** Carga (una vez) icons.json: {nombre: contenido SVG}. */
function loadIcons() {
  return (
    iconsPromise ||
      (iconsPromise = fetch('icons.json')
        .then((res) => (res.ok ? res.json() : {}))
        .catch(() => ({}))),
    iconsPromise
  );
}
/** Inyecta la hoja de estilos del HUD y de las ventanas de sustituto (una vez). */
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = !0;
  let style = document.createElement('style');
  ((style.textContent = HUD_CSS), document.head.append(style));
}
/**
 * Crea el HUD dentro de `root`. `opts`: party, place, day, gold, stealth, run y las retrollamadas
 * onAction(acción), onMenu(), onMember(id, {additive, focus}) y onMemberHold(id).
 * Devuelve {el, update, toast, banner, hint, status, show, hide, isOnUi, dispose}.
 */
async function createExploreHud(root, opts) {
  injectStyles();
  let icons = await loadIcons(),
    el = document.createElement('div');
  ((el.className = 'xh'),
    (el.innerHTML = `
    <div class="xh-grupo"></div>
    <div class="xh-arriba"><div class="xh-lugar"><div class="l"></div><div class="o">${iconSvg(icons, 'coins')}<span></span></div></div>
      <button class="xh-boton" data-a="menu" title="Men\xFA (Esc)">${iconSvg(icons, 'menu') || '\u2630'}</button></div>
    <div class="xh-estado"></div>
    <div class="xh-acciones">${HUD_ACTIONS.map(([action, label, icon, key]) => `<button class="xh-acc" data-a="${action}" title="${label} (${key})">${iconSvg(icons, icon)}<span>${label}</span><kbd>${key}</kbd></button>`).join('')}</div>
    <div class="xh-avisos"></div>
    <div class="xh-bandera"></div>`),
    root.append(el));
  let find = (sel) => el.querySelector(sel),
    state = { ...opts },
    cards = new Map();
  (el.querySelector('.xh-acciones').addEventListener('click', (ev) => {
    let btn = ev.target.closest('[data-a]');
    btn && state.onAction?.(btn.dataset.a);
  }),
    find('[data-a="menu"]').addEventListener('click', () => state.onMenu?.()));
  function renderParty() {
    let box = find('.xh-grupo'),
      ids = (state.party || []).map((m) => m.id).join('|');
    if (box.dataset.ids !== ids) {
      ((box.dataset.ids = ids), (box.innerHTML = ''), cards.clear());
      for (let m of state.party || []) {
        let card = document.createElement('div');
        ((card.className = 'xh-pj'),
          (card.dataset.id = m.id),
          (card.innerHTML =
            '<img alt=""><div class="t" style="min-width:0;flex:1"><div class="n"></div><div class="b"><i></i></div><div class="p"></div></div>'));
        let holdTimer = null,
          held = !1;
        card.addEventListener('pointerdown', (ev) => {
          ((held = !1),
            clearTimeout(holdTimer),
            (holdTimer = setTimeout(() => {
              ((held = !0), state.onMemberHold?.(m.id));
            }, 550)),
            ev.preventDefault());
        });
        let cancelHold = () => clearTimeout(holdTimer);
        (card.addEventListener('pointerleave', cancelHold),
          card.addEventListener('pointerup', (ev) => {
            (clearTimeout(holdTimer),
              held || state.onMember?.(m.id, { additive: ev.shiftKey || ev.ctrlKey || ev.metaKey }));
          }),
          card.addEventListener('dblclick', () => state.onMember?.(m.id, { focus: !0 })),
          card.addEventListener('contextmenu', (ev) => {
            (ev.preventDefault(), state.onMemberHold?.(m.id));
          }),
          box.append(card),
          cards.set(m.id, card));
      }
      let allBtn = document.createElement('button');
      ((allBtn.className = 'xh-todos'),
        (allBtn.textContent = 'Todo el grupo'),
        allBtn.addEventListener('click', () => state.onAction?.('select_all')),
        box.append(allBtn));
    }
    let someOut = !1;
    for (let m of state.party || []) {
      let card = cards.get(m.id);
      if (!card) continue;
      let img = card.querySelector('img');
      (m.portrait && img.src !== m.portrait && (img.src = m.portrait),
        (card.querySelector('.n').textContent = m.name));
      let frac = m.maxHp ? Math.max(0, m.hp / m.maxHp) : 1,
        bar = card.querySelector('.b i');
      ((bar.style.width = `${Math.round(frac * 100)}%`),
        (bar.className = frac < 0.34 ? 'bajo' : frac < 0.67 ? 'medio' : ''),
        (card.querySelector('.p').textContent = m.dead ? 'Muerto' : `${m.hp}/${m.maxHp} PG`),
        card.classList.toggle('lider', !!m.leader),
        card.classList.toggle('sel', !!m.selected),
        card.classList.toggle('fuera', !m.selected && !m.dead),
        card.classList.toggle('muerto', !!m.dead),
        !m.selected && !m.dead && (someOut = !0));
    }
    let allBtn = find('.xh-todos');
    allBtn && (allBtn.style.display = someOut ? '' : 'none');
  }
  function render() {
    (renderParty(),
      (find('.xh-lugar .l').textContent =
        `${state.place || ''}${state.day ? ` \xB7 d\xEDa ${state.day}` : ''}`),
      (find('.xh-lugar .o span').textContent = `${state.gold ?? 0} po`),
      find('[data-a="stealth"]').classList.toggle('on', !!state.stealth));
    let runBtn = find('[data-a="run"]');
    ((runBtn.querySelector('span').textContent = state.run === !1 ? 'Andar' : 'Correr'),
      (runBtn.innerHTML = `${iconSvg(icons, state.run === !1 ? 'footsteps' : 'fast') || ''}<span>${state.run === !1 ? 'Andar' : 'Correr'}</span><kbd>X</kbd>`));
  }
  render();
  let bannerTimer = null,
    hintEl = null;
  return {
    el,
    /** Mezcla `patch` en el estado y vuelve a pintar. */
    update(patch) {
      ((state = { ...state, ...patch }), render());
    },
    /** Aviso temporal abajo a la izquierda (máximo 6 a la vez); `kind`: info, mal, bien, botin, magia, apagado. */
    toast(text, kind = 'info', ms = 4200) {
      let box = find('.xh-avisos'),
        el = document.createElement('div');
      for (el.className = `xh-aviso ${kind}`, el.textContent = text, box.append(el); box.children.length > 5;)
        box.firstChild.remove();
      (setTimeout(() => (el.style.opacity = '0'), ms), setTimeout(() => el.remove(), ms + 600));
    },
    /** Rótulo grande en el centro durante `ms`. */
    banner(text, kind = '', ms = 1500) {
      let el = find('.xh-bandera');
      ((el.textContent = text),
        (el.className = `xh-bandera ${kind}`),
        (el.style.opacity = '1'),
        clearTimeout(bannerTimer),
        (bannerTimer = setTimeout(() => (el.style.opacity = '0'), ms)));
    },
    /** Pista que se cierra al tocarla (sin texto, quita la actual). */
    hint(text) {
      (hintEl?.remove(),
        (hintEl = null),
        text &&
          ((hintEl = document.createElement('div')),
          (hintEl.className = 'xh-pista'),
          (hintEl.innerHTML = `${richText(text)}<small>(toca para cerrar)</small>`),
          hintEl.addEventListener('click', () => {
            (hintEl?.remove(), (hintEl = null));
          }),
          el.append(hintEl)));
    },
    /** Texto de estado arriba en el centro (p. ej. «Sigilo»). */
    status(text) {
      find('.xh-estado').textContent = text || '';
    },
    show() {
      el.style.display = '';
    },
    hide() {
      el.style.display = 'none';
    },
    /** ¿El punto de pantalla cae sobre la interfaz (y no sobre el lienzo de la escena)? */
    isOnUi(x, y) {
      let el = document.elementFromPoint(x, y);
      return !!(el && el !== document.getElementById('escena') && el.closest('#ui'));
    },
    dispose() {
      el.remove();
    },
  };
}
/** Fondo oscuro para una ventana de sustituto (abajo, o centrada). */
function openBackdrop(root, { center = !1 } = {}) {
  injectStyles();
  let el = document.createElement('div');
  return ((el.className = `xd-fondo${center ? ' centro' : ''}`), root.append(el), el);
}
/**
 * Diálogo de sustituto: {speaker, title, portrait, text, roll, options}. Resuelve con el índice
 * de la opción elegida (teclas 1–9; Escape elige la de tipo «end»).
 */
function fallbackDialog(root, dlg) {
  return new Promise((resolve) => {
    let back = openBackdrop(root),
      options = dlg.options?.length ? dlg.options : [{ text: 'Continuar', kind: 'end' }],
      rollHtml = dlg.roll
        ? `<div class="xd-tirada ${dlg.roll.success ? 'si' : 'no'}">[${escapeHtml(dlg.roll.label)} ${dlg.roll.total} contra CD ${dlg.roll.dc}: ${dlg.roll.success ? '\xE9xito' : 'fallo'}]</div>`
        : '';
    back.innerHTML = `<div class="xd-caja">${dlg.portrait ? `<img src="${escapeHtml(dlg.portrait)}" alt="">` : ''}<div style="flex:1;min-width:0">
      ${dlg.speaker ? `<div class="xd-quien">${escapeHtml(dlg.speaker)}</div>` : ''}${dlg.title ? `<div class="xd-titulo">${escapeHtml(dlg.title)}</div>` : ''}
      <div class="xd-texto">${richText(dlg.text)}</div>${rollHtml}
      <div class="xd-opciones">${options.map((opt, i) => `<button class="xd-op" data-i="${i}" ${opt.disabled ? 'disabled' : ''}><span class="k">${i + 1}.</span>${opt.tag ? `<span class="tag">${escapeHtml(opt.tag)}</span>` : ''}${escapeHtml(opt.text)}${opt.hint ? `<span class="hint">(${escapeHtml(opt.hint)})</span>` : ''}</button>`).join('')}</div></div></div>`;
    let close = (choice) => {
        (removeEventListener('keydown', onKey, !0), back.remove(), resolve(choice));
      },
      onKey = (ev) => {
        let num = Number(ev.key);
        if (num >= 1 && num <= options.length && !options[num - 1].disabled)
          (ev.stopPropagation(), close(num - 1));
        else if (ev.key === 'Escape') {
          let endIdx = options.findIndex((opt) => opt.kind === 'end');
          endIdx >= 0 && (ev.stopPropagation(), close(endIdx));
        }
      };
    (addEventListener('keydown', onKey, !0),
      back.addEventListener('click', (ev) => {
        let btn = ev.target.closest('.xd-op');
        btn && !btn.disabled && close(Number(btn.dataset.i));
      }),
      back.querySelector('.xd-op:not([disabled])')?.focus());
  });
}
/**
 * Ventana de botín: el jugador coge objetos sueltos, el oro o todo. Resuelve con
 * {taken: índices cogidos, gold: oro cogido}.
 */
function lootDialog(root, { title, items, gold, names }) {
  return new Promise((resolve) => {
    let back = openBackdrop(root, { center: !0 }),
      left = items.map((item, idx) => ({ ...item, i: idx })),
      taken = [],
      goldLeft = gold || 0,
      render = () => {
        back.innerHTML = `<div class="xd-caja" style="display:block;margin:0"><div class="xd-quien">${escapeHtml(title)}</div>
        <div class="xd-lista">${goldLeft ? `<div class="xd-obj" data-g="1">Oro<span>${goldLeft} po</span></div>` : ''}${left.map((item) => `<div class="xd-obj" data-i="${item.i}">${escapeHtml(names(item.id))}${item.unid ? ' (sin identificar)' : ''}<span>\xD7${item.n}</span></div>`).join('')}${!goldLeft && !left.length ? '<i style="color:#9a8c74">Vac\xEDo.</i>' : ''}</div>
        <div class="xd-opciones" style="grid-template-columns:1fr 1fr"><button class="xd-op" data-a="todo">Cogerlo todo</button><button class="xd-op" data-a="cerrar">Cerrar</button></div></div>`;
      };
    render();
    let close = () => {
        (removeEventListener('keydown', onKey, !0),
          back.remove(),
          resolve({ taken, gold: (gold || 0) - goldLeft }));
      },
      onKey = (ev) => {
        ev.key === 'Escape'
          ? (ev.stopPropagation(), close())
          : (ev.key === 'Enter' || ev.key === ' ') &&
            (ev.stopPropagation(),
            ev.preventDefault(),
            taken.push(...left.map((item) => item.i)),
            (left.length = 0),
            (goldLeft = 0),
            close());
      };
    (addEventListener('keydown', onKey, !0),
      back.addEventListener('click', (ev) => {
        let action = ev.target.closest('[data-a]')?.dataset.a;
        if (action === 'todo') {
          (taken.push(...left.map((item) => item.i)), (left.length = 0), (goldLeft = 0), close());
          return;
        }
        if (action === 'cerrar' || ev.target === back) {
          close();
          return;
        }
        let row = ev.target.closest('.xd-obj');
        if (row) {
          if (row.dataset.g) goldLeft = 0;
          else {
            let idx = Number(row.dataset.i),
              pos = left.findIndex((item) => item.i === idx);
            pos >= 0 && taken.push(...left.splice(pos, 1).map((item) => item.i));
          }
          !goldLeft && !left.length ? close() : render();
        }
      }));
  });
}
/** Rótulo a pantalla casi negra durante `ms` (paso del tiempo, amanecer…). */
function showInterlude(root, text, ms = 1600) {
  return (
    injectStyles(),
    new Promise((resolve) => {
      let el = document.createElement('div');
      ((el.style.cssText =
        'position:fixed;inset:0;background:#050302;opacity:0;transition:opacity .6s;display:grid;place-items:center;z-index:40;pointer-events:auto'),
        (el.innerHTML = `<div style="font:700 32px Cinzel,Georgia,serif;color:#e8c060;letter-spacing:.06em;text-align:center;padding:16px">${escapeHtml(text)}</div>`),
        root.append(el),
        requestAnimationFrame(() => (el.style.opacity = '0.94')),
        setTimeout(() => (el.style.opacity = '0'), 600 + ms),
        setTimeout(() => {
          (el.remove(), resolve());
        }, 1250 + ms));
    })
  );
}
const HUD_CSS = `
.xh{position:fixed;inset:0;pointer-events:none!important;font-family:Alegreya,Georgia,serif;color:#ecdfc4;z-index:5}
.xh *{box-sizing:border-box}
.xh button{font:inherit;color:inherit;cursor:pointer}
.xh-grupo{position:absolute;left:max(10px,env(safe-area-inset-left));top:max(10px,env(safe-area-inset-top));display:grid;gap:6px;pointer-events:auto}
.xh-pj{display:flex;gap:7px;align-items:center;width:172px;padding:4px 8px 4px 4px;background:linear-gradient(#2b1f16f0,#1c140ef0);border:1px solid #5a4528;border-radius:6px;box-shadow:0 2px 8px #0008;touch-action:manipulation;user-select:none;-webkit-user-select:none}
.xh-pj.lider{border-color:#d8b060;box-shadow:0 0 0 1px #d8b06080,0 2px 10px #000a}
.xh-pj.sel:not(.lider){border-color:#7fb86a}
.xh-pj.fuera{opacity:.55}
.xh-pj.muerto{filter:grayscale(1);opacity:.5}
.xh-pj img{width:48px;height:48px;border-radius:4px;object-fit:cover;border:1px solid #00000080;flex:none;background:#120c08}
.xh-pj .n{font:700 14px/1.1 'Alegreya SC',Georgia,serif;letter-spacing:.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.xh-pj .b{height:7px;background:#00000090;border-radius:4px;margin-top:4px;overflow:hidden}
.xh-pj .b i{display:block;height:100%;background:linear-gradient(#8fd06a,#5a9a3c);border-radius:4px;transition:width .3s}
.xh-pj .b i.medio{background:linear-gradient(#e0c050,#a8862c)}.xh-pj .b i.bajo{background:linear-gradient(#e06a4a,#a03a28)}
.xh-pj .p{font-size:12px;color:#c8bca8;margin-top:1px}
.xh-arriba{position:absolute;right:max(10px,env(safe-area-inset-right));top:max(10px,env(safe-area-inset-top));display:flex;gap:8px;align-items:flex-start;pointer-events:auto}
.xh-lugar{padding:5px 12px 6px;background:linear-gradient(#2b1f16e8,#1c140ee8);border:1px solid #5a4528;border-radius:6px;text-align:right;box-shadow:0 2px 8px #0008}
.xh-lugar .l{font:600 14px 'Alegreya SC',Georgia,serif;color:#c8bca8;letter-spacing:.04em}
.xh-lugar .o{font:700 19px Cinzel,Georgia,serif;color:#e8c060;display:flex;gap:5px;justify-content:flex-end;align-items:center}
.xh-lugar .o svg{width:18px;height:18px}
.xh-boton{display:grid;place-items:center;min-width:48px;height:48px;padding:0 8px;background:linear-gradient(#3a2a1c,#22180f);border:1px solid #7d6334;border-radius:6px;box-shadow:inset 0 1px 0 #ffffff14,0 2px 6px #0008}
.xh-boton:hover{border-color:#c9a55c}.xh-boton svg{width:26px;height:26px;color:#e0c890}
.xh-acciones{position:absolute;right:max(10px,env(safe-area-inset-right));bottom:max(10px,env(safe-area-inset-bottom));display:flex;gap:6px;padding:6px;background:linear-gradient(#2b1f16e0,#1c140ee0);border:1px solid #5a4528;border-radius:8px;pointer-events:auto;box-shadow:0 2px 10px #0009;flex-wrap:wrap;justify-content:flex-end;max-width:calc(100vw - 20px)}
.xh-acc{display:grid;justify-items:center;gap:1px;width:64px;padding:5px 2px 4px;background:linear-gradient(#3a2a1c,#22180f);border:1px solid #6a5230;border-radius:6px;font:600 12px 'Alegreya SC',Georgia,serif;letter-spacing:.03em;color:#e8dcc4}
.xh-acc svg{width:24px;height:24px;color:#e0c890}
.xh-acc:hover{border-color:#c9a55c}.xh-acc.on{background:linear-gradient(#4a3a6a,#2a2040);border-color:#a898e0}.xh-acc.on svg{color:#d8ccff}
.xh-acc kbd{font:10px Alegreya,Georgia,serif;color:#9a8c74;margin-top:-1px}
.xh-avisos{position:absolute;left:max(12px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));display:grid;gap:5px;max-width:min(520px,calc(100vw - 24px));pointer-events:none}
.xh-aviso{padding:6px 12px 7px;background:#1c140ee8;border:1px solid #5a4528;border-left:3px solid #c9a55c;border-radius:4px;font-size:16px;line-height:1.3;box-shadow:0 2px 6px #0008;animation:xhIn .25s ease-out;transition:opacity .5s}
.xh-aviso.mal{border-left-color:#d0583c}.xh-aviso.bien{border-left-color:#7fb86a}.xh-aviso.botin{border-left-color:#e8c060;color:#f4e2b0}.xh-aviso.magia{border-left-color:#a898e0}.xh-aviso.apagado{color:#c8bca8;border-left-color:#7a6a54}
@keyframes xhIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.xh-bandera{position:absolute;left:50%;top:26%;transform:translate(-50%,-50%);padding:10px 30px 12px;background:linear-gradient(#2b1f16f4,#1c140ef4);border:1px solid #c9a55c;border-radius:6px;font:700 30px Cinzel,Georgia,serif;letter-spacing:.06em;color:#e8c060;text-shadow:0 2px 4px #000;box-shadow:0 4px 24px #000c;opacity:0;transition:opacity .25s;white-space:nowrap;pointer-events:none}
.xh-bandera.mal{color:#ff8a6a;border-color:#a8442e}.xh-bandera.bien{color:#a8e090}
.xh-pista{position:absolute;left:50%;bottom:calc(max(10px,env(safe-area-inset-bottom)) + 84px);transform:translateX(-50%);width:min(620px,calc(100vw - 24px));padding:10px 16px 12px;background:#1c140ef0;border:1px solid #7d6334;border-radius:6px;font-size:17px;line-height:1.35;box-shadow:0 4px 16px #000a;pointer-events:auto;cursor:pointer}
.xh-pista small{display:block;color:#9a8c74;font-size:13px;margin-top:4px}
.xh-estado{position:absolute;left:50%;top:max(12px,env(safe-area-inset-top));transform:translateX(-50%);font:600 17px 'Alegreya SC',Georgia,serif;letter-spacing:.06em;color:#c8b8ff;text-shadow:0 1px 3px #000;pointer-events:none;white-space:nowrap}
.xh-todos{font:600 12px 'Alegreya SC',Georgia,serif;padding:4px 8px;background:#2b1f16e8;border:1px solid #7fb86a;border-radius:5px;color:#c8e8b8;justify-self:start}
@media (max-width:640px){.xh-pj{width:56px;padding:3px}.xh-pj .t{display:none}.xh-acc{width:52px;font-size:11px}.xh-acc kbd{display:none}.xh-bandera{font-size:22px;padding:8px 18px}}
/* ventanas de sustituto */
.xd-fondo{position:fixed;inset:0;background:#0006;display:grid;align-items:end;justify-items:center;z-index:30;pointer-events:auto!important;animation:xhIn .2s}
.xd-fondo.centro{align-items:center}
.xd-caja{width:min(760px,calc(100vw - 16px));margin-bottom:max(10px,env(safe-area-inset-bottom));display:flex;gap:14px;padding:14px 18px 16px;background:linear-gradient(#2e2218f8,#1c140ef8);border:1px solid #7d6334;border-radius:8px;box-shadow:0 6px 30px #000c;color:#ecdfc4;font-family:Alegreya,Georgia,serif;max-height:80vh;overflow:auto}
.xd-caja img{width:96px;height:96px;border-radius:6px;border:1px solid #7d6334;object-fit:cover;flex:none}
.xd-quien{font:700 19px Cinzel,Georgia,serif;color:#e8c060;letter-spacing:.04em}
.xd-titulo{font:500 14px 'Alegreya SC',Georgia,serif;color:#b09d7f;margin-bottom:6px}
.xd-texto{font-size:18px;line-height:1.42;white-space:pre-wrap}
.xd-texto em{color:#d8ccb4}
.xd-tirada{margin:8px 0 2px;font:600 15px 'Alegreya SC',Georgia,serif;color:#c8bca8}.xd-tirada.si{color:#9de08a}.xd-tirada.no{color:#ff8a70}
.xd-opciones{display:grid;gap:4px;margin-top:10px}
.xd-op{text-align:left;padding:7px 11px;background:#00000040;border:1px solid #5a4528;border-radius:5px;font:17px Alegreya,Georgia,serif;color:#ecdfc4;cursor:pointer}
.xd-op:hover,.xd-op:focus{border-color:#c9a55c;background:#c9a55c22;outline:none}
.xd-op[disabled]{opacity:.45;cursor:default}
.xd-op .k{color:#c9a55c;margin-right:6px;font-weight:700}.xd-op .tag{color:#b8a8ff;margin-right:6px}.xd-op .hint{color:#9a8c74;font-size:14px;margin-left:6px}
.xd-lista{display:grid;gap:4px;margin:8px 0}
.xd-obj{display:flex;justify-content:space-between;gap:10px;padding:6px 10px;background:#00000040;border:1px solid #5a4528;border-radius:5px;cursor:pointer;font-size:17px}
.xd-obj:hover{border-color:#e8c060}.xd-obj span{color:#c9a55c}
`;
let iconsPromise = null;
/** SVG de un icono de icons.json, o cadena vacía. */
const iconSvg = (icons, name) =>
  icons?.[name] ? `<svg viewBox="0 0 512 512" aria-hidden="true">${icons[name]}</svg>` : '';
/** Escapa & < > " para insertar texto en HTML. */
const escapeHtml = (text) =>
  String(text ?? '').replace(
    /[&<>"]/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch],
  );
/** Texto escapado con *cursiva* convertida en <em>. */
const richText = (text) => escapeHtml(text).replace(/\*([^*]+)\*/g, '<em>$1</em>');
let stylesInjected = !1;
/** Botones de acción del HUD: [acción, etiqueta, icono, tecla]. */
const HUD_ACTIONS = [
  ['inventory', 'Equipo', 'bag', 'I'],
  ['stealth', 'Sigilo', 'stealth', 'C'],
  ['search', 'Buscar', 'search', 'B'],
  ['run', 'Correr', 'footsteps', 'X'],
  ['rest', 'Descanso', 'rest', 'R'],
  ['journal', 'Diario', 'book', 'J'],
];

export { lootDialog, fallbackDialog, showInterlude, createExploreHud };
