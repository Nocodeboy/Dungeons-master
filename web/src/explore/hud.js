// explore/hud.js
// Reconstruido de publicado/juego.js (módulo __esm «X1»). Nombres locales aún minificados.

function sN() {
  return (
    V1 ||
      (V1 = fetch('icons.json')
        .then((o) => (o.ok ? o.json() : {}))
        .catch(() => ({}))),
    V1
  );
}
function $1() {
  if (Ek) return;
  Ek = !0;
  let o = document.createElement('style');
  ((o.textContent = oN), document.head.append(o));
}
async function kk(o, e) {
  $1();
  let t = await sN(),
    a = document.createElement('div');
  ((a.className = 'xh'),
    (a.innerHTML = `
    <div class="xh-grupo"></div>
    <div class="xh-arriba"><div class="xh-lugar"><div class="l"></div><div class="o">${l0(t, 'coins')}<span></span></div></div>
      <button class="xh-boton" data-a="menu" title="Men\xFA (Esc)">${l0(t, 'menu') || '\u2630'}</button></div>
    <div class="xh-estado"></div>
    <div class="xh-acciones">${iN.map(([u, h, p, m]) => `<button class="xh-acc" data-a="${u}" title="${h} (${m})">${l0(t, p)}<span>${h}</span><kbd>${m}</kbd></button>`).join('')}</div>
    <div class="xh-avisos"></div>
    <div class="xh-bandera"></div>`),
    o.append(a));
  let n = (u) => a.querySelector(u),
    s = { ...e },
    i = new Map();
  (a.querySelector('.xh-acciones').addEventListener('click', (u) => {
    let h = u.target.closest('[data-a]');
    h && s.onAction?.(h.dataset.a);
  }),
    n('[data-a="menu"]').addEventListener('click', () => s.onMenu?.()));
  function r() {
    let u = n('.xh-grupo'),
      h = (s.party || []).map((_) => _.id).join('|');
    if (u.dataset.ids !== h) {
      ((u.dataset.ids = h), (u.innerHTML = ''), i.clear());
      for (let b of s.party || []) {
        let f = document.createElement('div');
        ((f.className = 'xh-pj'),
          (f.dataset.id = b.id),
          (f.innerHTML =
            '<img alt=""><div class="t" style="min-width:0;flex:1"><div class="n"></div><div class="b"><i></i></div><div class="p"></div></div>'));
        let v = null,
          x = !1;
        f.addEventListener('pointerdown', (y) => {
          ((x = !1),
            clearTimeout(v),
            (v = setTimeout(() => {
              ((x = !0), s.onMemberHold?.(b.id));
            }, 550)),
            y.preventDefault());
        });
        let g = () => clearTimeout(v);
        (f.addEventListener('pointerleave', g),
          f.addEventListener('pointerup', (y) => {
            (clearTimeout(v), x || s.onMember?.(b.id, { additive: y.shiftKey || y.ctrlKey || y.metaKey }));
          }),
          f.addEventListener('dblclick', () => s.onMember?.(b.id, { focus: !0 })),
          f.addEventListener('contextmenu', (y) => {
            (y.preventDefault(), s.onMemberHold?.(b.id));
          }),
          u.append(f),
          i.set(b.id, f));
      }
      let _ = document.createElement('button');
      ((_.className = 'xh-todos'),
        (_.textContent = 'Todo el grupo'),
        _.addEventListener('click', () => s.onAction?.('select_all')),
        u.append(_));
    }
    let p = !1;
    for (let _ of s.party || []) {
      let b = i.get(_.id);
      if (!b) continue;
      let f = b.querySelector('img');
      (_.portrait && f.src !== _.portrait && (f.src = _.portrait),
        (b.querySelector('.n').textContent = _.name));
      let v = _.maxHp ? Math.max(0, _.hp / _.maxHp) : 1,
        x = b.querySelector('.b i');
      ((x.style.width = `${Math.round(v * 100)}%`),
        (x.className = v < 0.34 ? 'bajo' : v < 0.67 ? 'medio' : ''),
        (b.querySelector('.p').textContent = _.dead ? 'Muerto' : `${_.hp}/${_.maxHp} PG`),
        b.classList.toggle('lider', !!_.leader),
        b.classList.toggle('sel', !!_.selected),
        b.classList.toggle('fuera', !_.selected && !_.dead),
        b.classList.toggle('muerto', !!_.dead),
        !_.selected && !_.dead && (p = !0));
    }
    let m = n('.xh-todos');
    m && (m.style.display = p ? '' : 'none');
  }
  function l() {
    (r(),
      (n('.xh-lugar .l').textContent = `${s.place || ''}${s.day ? ` \xB7 d\xEDa ${s.day}` : ''}`),
      (n('.xh-lugar .o span').textContent = `${s.gold ?? 0} po`),
      n('[data-a="stealth"]').classList.toggle('on', !!s.stealth));
    let u = n('[data-a="run"]');
    ((u.querySelector('span').textContent = s.run === !1 ? 'Andar' : 'Correr'),
      (u.innerHTML = `${l0(t, s.run === !1 ? 'footsteps' : 'fast') || ''}<span>${s.run === !1 ? 'Andar' : 'Correr'}</span><kbd>X</kbd>`));
  }
  l();
  let c = null,
    d = null;
  return {
    el: a,
    update(u) {
      ((s = { ...s, ...u }), l());
    },
    toast(u, h = 'info', p = 4200) {
      let m = n('.xh-avisos'),
        _ = document.createElement('div');
      for (_.className = `xh-aviso ${h}`, _.textContent = u, m.append(_); m.children.length > 5;)
        m.firstChild.remove();
      (setTimeout(() => (_.style.opacity = '0'), p), setTimeout(() => _.remove(), p + 600));
    },
    banner(u, h = '', p = 1500) {
      let m = n('.xh-bandera');
      ((m.textContent = u),
        (m.className = `xh-bandera ${h}`),
        (m.style.opacity = '1'),
        clearTimeout(c),
        (c = setTimeout(() => (m.style.opacity = '0'), p)));
    },
    hint(u) {
      (d?.remove(),
        (d = null),
        u &&
          ((d = document.createElement('div')),
          (d.className = 'xh-pista'),
          (d.innerHTML = `${Sk(u)}<small>(toca para cerrar)</small>`),
          d.addEventListener('click', () => {
            (d?.remove(), (d = null));
          }),
          a.append(d)));
    },
    status(u) {
      n('.xh-estado').textContent = u || '';
    },
    show() {
      a.style.display = '';
    },
    hide() {
      a.style.display = 'none';
    },
    isOnUi(u, h) {
      let p = document.elementFromPoint(u, h);
      return !!(p && p !== document.getElementById('escena') && p.closest('#ui'));
    },
    dispose() {
      a.remove();
    },
  };
}
function Ak(o, { center: e = !1 } = {}) {
  $1();
  let t = document.createElement('div');
  return ((t.className = `xd-fondo${e ? ' centro' : ''}`), o.append(t), t);
}
function Rk(o, e) {
  return new Promise((t) => {
    let a = Ak(o),
      n = e.options?.length ? e.options : [{ text: 'Continuar', kind: 'end' }],
      s = e.roll
        ? `<div class="xd-tirada ${e.roll.success ? 'si' : 'no'}">[${ms(e.roll.label)} ${e.roll.total} contra CD ${e.roll.dc}: ${e.roll.success ? '\xE9xito' : 'fallo'}]</div>`
        : '';
    a.innerHTML = `<div class="xd-caja">${e.portrait ? `<img src="${ms(e.portrait)}" alt="">` : ''}<div style="flex:1;min-width:0">
      ${e.speaker ? `<div class="xd-quien">${ms(e.speaker)}</div>` : ''}${e.title ? `<div class="xd-titulo">${ms(e.title)}</div>` : ''}
      <div class="xd-texto">${Sk(e.text)}</div>${s}
      <div class="xd-opciones">${n.map((l, c) => `<button class="xd-op" data-i="${c}" ${l.disabled ? 'disabled' : ''}><span class="k">${c + 1}.</span>${l.tag ? `<span class="tag">${ms(l.tag)}</span>` : ''}${ms(l.text)}${l.hint ? `<span class="hint">(${ms(l.hint)})</span>` : ''}</button>`).join('')}</div></div></div>`;
    let i = (l) => {
        (removeEventListener('keydown', r, !0), a.remove(), t(l));
      },
      r = (l) => {
        let c = Number(l.key);
        if (c >= 1 && c <= n.length && !n[c - 1].disabled) (l.stopPropagation(), i(c - 1));
        else if (l.key === 'Escape') {
          let d = n.findIndex((u) => u.kind === 'end');
          d >= 0 && (l.stopPropagation(), i(d));
        }
      };
    (addEventListener('keydown', r, !0),
      a.addEventListener('click', (l) => {
        let c = l.target.closest('.xd-op');
        c && !c.disabled && i(Number(c.dataset.i));
      }),
      a.querySelector('.xd-op:not([disabled])')?.focus());
  });
}
function Ck(o, { title: e, items: t, gold: a, names: n }) {
  return new Promise((s) => {
    let i = Ak(o, { center: !0 }),
      r = t.map((p, m) => ({ ...p, i: m })),
      l = [],
      c = a || 0,
      d = () => {
        i.innerHTML = `<div class="xd-caja" style="display:block;margin:0"><div class="xd-quien">${ms(e)}</div>
        <div class="xd-lista">${c ? `<div class="xd-obj" data-g="1">Oro<span>${c} po</span></div>` : ''}${r.map((p) => `<div class="xd-obj" data-i="${p.i}">${ms(n(p.id))}${p.unid ? ' (sin identificar)' : ''}<span>\xD7${p.n}</span></div>`).join('')}${!c && !r.length ? '<i style="color:#9a8c74">Vac\xEDo.</i>' : ''}</div>
        <div class="xd-opciones" style="grid-template-columns:1fr 1fr"><button class="xd-op" data-a="todo">Cogerlo todo</button><button class="xd-op" data-a="cerrar">Cerrar</button></div></div>`;
      };
    d();
    let u = () => {
        (removeEventListener('keydown', h, !0), i.remove(), s({ taken: l, gold: (a || 0) - c }));
      },
      h = (p) => {
        p.key === 'Escape'
          ? (p.stopPropagation(), u())
          : (p.key === 'Enter' || p.key === ' ') &&
            (p.stopPropagation(),
            p.preventDefault(),
            l.push(...r.map((m) => m.i)),
            (r.length = 0),
            (c = 0),
            u());
      };
    (addEventListener('keydown', h, !0),
      i.addEventListener('click', (p) => {
        let m = p.target.closest('[data-a]')?.dataset.a;
        if (m === 'todo') {
          (l.push(...r.map((b) => b.i)), (r.length = 0), (c = 0), u());
          return;
        }
        if (m === 'cerrar' || p.target === i) {
          u();
          return;
        }
        let _ = p.target.closest('.xd-obj');
        if (_) {
          if (_.dataset.g) c = 0;
          else {
            let b = Number(_.dataset.i),
              f = r.findIndex((v) => v.i === b);
            f >= 0 && l.push(...r.splice(f, 1).map((v) => v.i));
          }
          !c && !r.length ? u() : d();
        }
      }));
  });
}
function W1(o, e, t = 1600) {
  return (
    $1(),
    new Promise((a) => {
      let n = document.createElement('div');
      ((n.style.cssText =
        'position:fixed;inset:0;background:#050302;opacity:0;transition:opacity .6s;display:grid;place-items:center;z-index:40;pointer-events:auto'),
        (n.innerHTML = `<div style="font:700 32px Cinzel,Georgia,serif;color:#e8c060;letter-spacing:.06em;text-align:center;padding:16px">${ms(e)}</div>`),
        o.append(n),
        requestAnimationFrame(() => (n.style.opacity = '0.94')),
        setTimeout(() => (n.style.opacity = '0'), 600 + t),
        setTimeout(() => {
          (n.remove(), a());
        }, 1250 + t));
    })
  );
}
const oN = `
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
let V1 = null;
const l0 = (o, e) => (o?.[e] ? `<svg viewBox="0 0 512 512" aria-hidden="true">${o[e]}</svg>` : '');
const ms = (o) =>
  String(o ?? '').replace(/[&<>"]/g, (e) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[e]);
const Sk = (o) => ms(o).replace(/\*([^*]+)\*/g, '<em>$1</em>');
let Ek = !1;
const iN = [
  ['inventory', 'Equipo', 'bag', 'I'],
  ['stealth', 'Sigilo', 'stealth', 'C'],
  ['search', 'Buscar', 'search', 'B'],
  ['run', 'Correr', 'footsteps', 'X'],
  ['rest', 'Descanso', 'rest', 'R'],
  ['journal', 'Diario', 'book', 'J'],
];

export { Ck, Rk, W1, kk };
