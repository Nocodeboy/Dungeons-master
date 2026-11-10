// ui/screens/inventario.js
// Reconstruido de publicado/juego.js (módulo __esm «zT»). Nombres locales aún minificados.

import { iconHtml, escapeHtml, elem, makeButton, Cn, en } from '../dom.js';
import { screenFrame, es } from '../modal.js';
import { sa } from '../tooltip.js';
import { mi, Zi, Gr } from '../items.js';
import { su, as, ns } from '../labels.js';

function opcionesInventario() {
  return { width: '78rem', height: '48rem' };
}
function pantallaInventario(o, e, t, a) {
  let n = t.R,
    s = () => a.store.cp;
  if (!s()) {
    let A = screenFrame(o, { title: 'Inventario', ic: 'backpack' });
    A.body.innerHTML = `<div class="mg-vacio">${iconHtml('backpack')}No hay ninguna partida en curso.</div>`;
    return;
  }
  let i = s().party.includes(e.who) ? e.who : s().party[0],
    r = null,
    l = 'equipo',
    c = null,
    d = elem('span.mg-gold'),
    u = screenFrame(o, { title: 'Inventario', ic: 'backpack', extra: null });
  u.head.insertBefore(d, u.head.querySelector('.mg-cerrar'));
  let h = () =>
      s().party.map((A) => {
        let P = s().members[A] || {};
        return { id: A, label: String(P.name || A).split(' ')[0], cls: P.class };
      }),
    p = es(
      h().map((A) => ({ id: A.id, html: m(A) })),
      i,
      (A) => {
        ((i = A), (r = null), R());
      },
    );
  function m(A) {
    return `<span class="mg-memtab">${Cn(t.portrait(A.id), { id: A.id, name: A.label, ic: ns[A.cls] || 'person' }).outerHTML}<span>${escapeHtml(A.label)}</span></span>`;
  }
  ((u.tabs.hidden = !1), u.tabs.append(p));
  let _ = es(
      [
        { id: 'equipo', label: 'Equipo', icon: 'armor' },
        { id: 'detalle', label: 'Detalle', icon: 'info' },
        { id: 'mochila', label: 'Mochila', icon: 'backpack' },
      ],
      l,
      (A) => {
        l = A;
        for (let P of b.querySelectorAll('.pane')) P.classList.toggle('on', P.dataset.pane === A);
      },
      { cls: 'mg-panes-tabs' },
    ),
    b = elem('div.mg-inv'),
    f = elem('section.pane.mg-inv-col', { 'data-pane': 'equipo' }),
    v = elem('section.pane.mg-inv-mid', { 'data-pane': 'detalle' }),
    x = elem('section.pane.mg-inv-col', { 'data-pane': 'mochila' });
  (b.append(f, v, x),
    f.classList.add('on'),
    (u.body.style.gridTemplateRows = 'auto minmax(0, 1fr)'),
    (_.style.gridRow = '1'),
    (b.style.gridRow = '2'),
    u.body.append(_, b));
  function g() {
    let A = n.inv(i);
    return !A || A.error ? ((c = null), A?.error || 'sin respuesta') : ((c = A), null);
  }
  function y() {
    ((f.innerHTML = ''), f.append(elem('h3.mg-sec', 'Equipo')));
    let A = elem('div.mg-doll.mg-inset');
    for (let [I, U, j] of wL) {
      let X = c.slots?.[I] || { key: I, label: U, empty: !0 },
        J = X.empty || !X.id,
        Z = elem(`button.mg-slot.s-${I.replace(':', '')}`, {
          'data-slot': I,
          'aria-pressed': String(r?.where === 'slot' && r.key === I),
          'aria-label': `${U}: ${J ? 'vac\xEDo' : X.name}`,
        });
      (J ? Z.classList.add('vacio') : Z.classList.add(...[mi(X)].filter(Boolean)),
        (Z.innerHTML = `${iconHtml(J ? j : Zi(X))}<span class="mg-slot-n">${escapeHtml(J ? '' : X.name)}</span><span class="mg-slot-l">${escapeHtml(U)}</span>`),
        J || sa(Z, Gr(t, X)),
        Z.addEventListener('click', () => {
          Z._dragged ||
            ((r = { where: 'slot', key: I }),
            matchMedia('(max-width: 860px)').matches && !J && (_.set('detalle'), (l = 'detalle'), D()),
            M());
        }),
        J || S(Z, { from: 'slot', key: I, item: X }),
        A.append(Z));
    }
    let P = elem('div.mg-doll-extra');
    for (let I of c.ammo || [])
      P.append(
        elem('span.mg-chip', { html: `${iconHtml('quiver')}${escapeHtml(I.name)} ${escapeHtml(I.n)}` }),
      );
    (c.attuned &&
      P.append(
        elem(
          'span.mg-chip',
          { title: 'Objetos m\xE1gicos que requieren sinton\xEDa' },
          `Sinton\xEDa ${c.attuned.n}/${c.attuned.max}`,
        ),
      ),
      A.append(P),
      f.append(A));
  }
  function w() {
    v.innerHTML = '';
    let A = c.stats || {},
      P = elem('div.mg-inv-stats.mg-inset'),
      I = elem('div.mg-stats');
    for (let [j, X, J] of [
      [A.ac, 'CA', 'Clase de Armadura'],
      [`${A.hp ?? '\u2014'}/${A.max_hp ?? '\u2014'}`, 'PG', 'Puntos de golpe'],
      [A.speed_text || '', 'Velocidad', 'Velocidad'],
    ]) {
      let Z = elem('span.mg-stat', elem('b.mg-num', String(j ?? '\u2014')), elem('span', X));
      (sa(Z, J), I.append(Z));
    }
    P.append(I);
    let U = elem('div.mg-inv-atk');
    for (let j of A.attacks || [])
      U.append(
        elem('div', elem('b', j.name), elem('span', `${j.to_hit_text ?? en(j.to_hit)} \xB7 ${j.damage}`)),
      );
    ((A.attacks || []).length && P.append(elem('div.mg-label', { style: 'margin-top:.2rem' }, 'Ataques'), U),
      v.append(P, T()));
  }
  function k() {
    if (!r) return null;
    if (r.where === 'slot') {
      let P = c.slots?.[r.key];
      return P && !P.empty && P.id ? { ...P, where: 'slot' } : null;
    }
    let A = c.bag?.[r.i];
    return A ? { ...A, bagIndex: r.i } : null;
  }
  function T() {
    let A = elem('div.mg-inv-detail.mg-inset.mg-scroll'),
      P = k();
    if (!P)
      return (
        (A.innerHTML = `<div class="mg-vacio">${iconHtml('hand')}<span>Toca un objeto para ver qu\xE9 hace.<br>${matchMedia('(pointer: fine)').matches ? 'Tambi\xE9n puedes arrastrarlo a un hueco, a la mochila o a otro personaje.' : ''}</span></div>`),
        A
      );
    let I = n.call('item_info', { id: P.id, unid: !!P.unid }),
      U = I && !I.error ? I : {};
    A.append(
      elem(`div.mg-item-name.${mi(P) || 'mg-r-comun'}`, P.label && P.where !== 'slot' ? P.label : P.name),
    );
    let j = [
      as[U.kind || P.kind] || '',
      U.rarity_name || su[P.rarity]?.[0] || '',
      U.attune ? 'requiere sinton\xEDa' : '',
    ]
      .filter(Boolean)
      .join(' \xB7 ');
    (j && A.append(elem('div.mg-item-kind', P.unid ? 'Sin identificar' : j)),
      (U.props || []).length &&
        A.append(elem('div.mg-item-props', ...U.props.map((K) => elem('span.mg-chip', K)))));
    let X = P.unid
      ? ['No sab\xE9is qu\xE9 es. Un descanso corto (o el conjuro Identificar) lo revelar\xE1.']
      : U.lines?.length
        ? U.lines
        : [U.desc || ''];
    A.append(elem('div.mg-item-desc', ...X.filter(Boolean).map((K) => elem('p.mg-p', K))));
    let J = elem('div.mg-item-meta');
    if (
      ((U.sell || P.value) &&
        J.insertAdjacentHTML(
          'beforeend',
          `<span>${iconHtml('coins')} Se vende por ${escapeHtml(U.sell ?? P.value)} po</span>`,
        ),
      U.weight && J.append(elem('span', `${String(U.weight).replace('.', ',')} lb`)),
      A.append(J),
      P.where === 'pack' && P.equippable)
    ) {
      let K = n.invPreview(i, { idx: P.idx });
      if (K && !K.error) {
        let ve = elem('div.mg-preview');
        ve.append(elem('div.mg-label', 'Si te lo equipas'));
        let ge = K.changes || [];
        if (ge.length) {
          let ue = { ac: 'CA', attack: 'Ataque', speed: 'Velocidad', max_hp: 'PG m\xE1ximos' };
          for (let Q of ge) {
            let oe = (ie) =>
              Q.what === 'attack'
                ? en(ie)
                : Q.what === 'speed'
                  ? `${String(Math.round(ie * 3) / 10).replace('.', ',')} m`
                  : ie;
            ve.append(
              elem(
                'div.fila',
                elem('span', ue[Q.what] || Q.what),
                elem('span', {
                  html: `${escapeHtml(oe(Q.from))} \u2192 <b class="${Q.better ? 'mg-delta-up' : 'mg-delta-down'}">${escapeHtml(oe(Q.to))}</b>`,
                }),
              ),
            );
          }
        }
        for (let ue of (K.lines || []).filter((Q) => !ge.length || !/^(CA|Ataque|Velocidad|PG máx)/.test(Q)))
          ve.append(elem('div', ue));
        if (!ge.length && !(K.lines || []).length) {
          let ue = K.before?.ac,
            Q = K.after?.ac;
          ue != null && Q != null && Q !== ue
            ? ve.append(
                elem(
                  'div.fila',
                  elem('span', 'CA'),
                  elem('span', {
                    html: `${ue} \u2192 <b class="${Q > ue ? 'mg-delta-up' : 'mg-delta-down'}">${Q}</b>`,
                  }),
                ),
              )
            : ve.append(elem('div.mg-dim', 'Sin cambios en CA ni ataques.'));
        }
        (K.ok === !1 && K.reason && ve.append(elem('div.aviso', K.reason)), A.append(ve));
      }
    }
    let Z = elem('div.mg-item-acts');
    if (
      (P.where === 'slot' &&
        Z.append(makeButton('Quitar', { icon: 'undo', size: 'sm', onclick: () => z(n.unequip(i, r.key)) })),
      P.where === 'pack' &&
        P.equippable &&
        (P.slot === 'ring'
          ? (Z.append(
              makeButton('Anillo izquierdo', {
                icon: 'ring',
                size: 'sm',
                variant: 'primary',
                onclick: () => z(n.equip(i, { idx: P.idx }, 'ring1')),
              }),
            ),
            Z.append(
              makeButton('Anillo derecho', {
                icon: 'ring',
                size: 'sm',
                variant: 'primary',
                onclick: () => z(n.equip(i, { idx: P.idx }, 'ring2')),
              }),
            ))
          : Z.append(
              makeButton('Equipar', {
                icon: 'check',
                size: 'sm',
                variant: 'primary',
                onclick: () => z(n.equip(i, { idx: P.idx })),
              }),
            )),
      P.usable)
    )
      for (let K of s().party) {
        let ve = s().members[K];
        Z.append(
          makeButton(K === i ? 'Beber' : `Dar de beber a ${String(ve?.name || K).split(' ')[0]}`, {
            icon: 'potion',
            size: 'sm',
            onclick: () => z(n.use(i, P.id, K), { toastOk: !0 }),
          }),
        );
      }
    if (P.where !== 'slot') {
      for (let K of s().party.filter((ve) => ve !== i)) {
        let ve = s().members[K];
        Z.append(
          makeButton(
            `Dar ${P.where === 'stack' && P.n > 1 ? 'uno ' : ''}a ${String(ve?.name || K).split(' ')[0]}`,
            {
              icon: 'hand',
              size: 'sm',
              variant: 'ghost',
              onclick: () => z(n.giveTo(i, K, P.where === 'pack' ? { idx: P.idx } : P.id, 1)),
            },
          ),
        );
      }
      P.kind !== 'key' &&
        P.kind !== 'quest' &&
        Z.append(
          makeButton('Tirar', {
            icon: 'trash',
            size: 'sm',
            variant: 'danger',
            onclick: async () => {
              (await t.confirm(
                `\xBFTirar ${P.name}${P.n > 1 ? ` (\xD7${P.n})` : ''}? No podr\xE1s recuperarlo.`,
                { titulo: 'Tirar objeto', si: 'Tirar', peligro: !0 },
              )) && z(n.drop(i, P.where === 'pack' ? { idx: P.idx } : P.id, P.n || 1));
            },
          }),
        );
    }
    return (
      P.where === 'stack' &&
        ['scroll', 'wand'].includes(P.kind) &&
        A.append(elem('p.mg-cr-note', 'Se usa en combate, desde el bot\xF3n Objetos.')),
      A.append(Z),
      A
    );
  }
  function E() {
    ((x.innerHTML = ''),
      x.append(
        elem(
          'div.mg-bag-head',
          elem('h3.mg-sec', { style: 'flex:1;margin:0' }, 'Mochila'),
          elem('span.mg-dim.mg-small', `${(c.bag || []).length} objetos`),
        ),
      ));
    let A = elem('div.mg-bag.mg-inset.mg-scroll', { 'data-drop': 'bag' });
    (c.bag || []).forEach((I, U) => {
      let j = elem('button.mg-tile', {
          'aria-pressed': String(r?.where === 'bag' && r.i === U),
          'aria-label': `${I.name}${I.n > 1 ? `, ${I.n}` : ''}`,
        }),
        X = mi(I);
      (X && j.classList.add(X),
        (j.innerHTML = `${iconHtml(Zi(I))}<span class="mg-tile-n">${escapeHtml(I.name)}</span>${I.n > 1 ? `<span class="mg-badge">${escapeHtml(I.n)}</span>` : ''}`),
        sa(j, Gr(t, I)),
        j.addEventListener('click', () => {
          j._dragged ||
            ((r = { where: 'bag', i: U }),
            matchMedia('(max-width: 860px)').matches && (_.set('detalle'), (l = 'detalle'), D()),
            M());
        }),
        S(j, { from: 'bag', i: U, item: I }),
        A.append(j));
    });
    let P = (c.bag || []).length;
    for (let I = P; I < Math.max(24, P + 4 - (P % 4)); I++)
      A.append(elem('div.mg-tile.hueco', { 'aria-hidden': 'true' }));
    (P ||
      A.prepend(
        elem('div.mg-vacio', { style: 'grid-column:1/-1;padding:1rem 0' }, 'La mochila est\xE1 vac\xEDa.'),
      ),
      x.append(A));
  }
  function S(A, P) {
    A.addEventListener('pointerdown', (I) => {
      if (I.pointerType !== 'mouse' || I.button !== 0) return;
      let U = [I.clientX, I.clientY],
        j = null,
        X = null,
        J = () => [...o.el.querySelectorAll('[data-slot], [data-drop], .mg-tab[data-id]')],
        Z = (ge) =>
          ge.dataset.slot
            ? P.from === 'bag' && P.item.equippable && TL(ge.dataset.slot, P.item.slot)
            : ge.dataset.drop === 'bag'
              ? P.from === 'slot'
              : ge.dataset.id
                ? P.from === 'bag' && ge.dataset.id !== i
                : !1,
        K = (ge) => {
          if (!j && Math.hypot(ge.clientX - U[0], ge.clientY - U[1]) > 7) {
            ((j = elem('div.mg-ghost', { html: iconHtml(Zi(P.item)) })), document.body.append(j));
            for (let oe of J()) Z(oe) && oe.classList.add('blanco');
            t.tips.hide();
          }
          if (!j) return;
          j.style.transform = `translate(${ge.clientX - 28}px, ${ge.clientY - 28}px)`;
          let ue = document
              .elementFromPoint(ge.clientX, ge.clientY)
              ?.closest('[data-slot], [data-drop], .mg-tab[data-id]'),
            Q = ue && Z(ue) ? ue : null;
          Q !== X && (X?.classList.remove('encima'), (X = Q), X?.classList.add('encima'));
        },
        ve = () => {
          if (
            (removeEventListener('pointermove', K),
            removeEventListener('pointerup', ve),
            removeEventListener('pointercancel', ve),
            !j)
          )
            return;
          j.remove();
          for (let ue of J()) ue.classList.remove('blanco', 'encima');
          if (((A._dragged = !0), setTimeout(() => (A._dragged = !1), 50), !X)) return;
          let ge = P.item;
          if (X.dataset.slot) {
            let ue = ge.slot === 'ring' ? X.dataset.slot : void 0;
            z(n.equip(i, { idx: ge.idx }, ue));
          } else
            X.dataset.drop === 'bag'
              ? z(n.unequip(i, P.key))
              : X.dataset.id &&
                z(
                  n.giveTo(
                    i,
                    X.dataset.id,
                    ge.where === 'pack' ? { idx: ge.idx } : ge.id,
                    ge.where === 'stack' ? ge.n : 1,
                  ),
                );
        };
      (addEventListener('pointermove', K),
        addEventListener('pointerup', ve),
        addEventListener('pointercancel', ve));
    });
  }
  function z(A, { toastOk: P } = {}) {
    if (!A || A.error || A.ok === !1)
      return t.toast(A?.reason || A?.error || 'No se ha podido hacer.', 'mal');
    if (A.ok === !1) return t.toast(A.reason || A.text || 'No se puede.', 'mal');
    ((P || A.text) && t.hud?.visible && t.hud.log(A.text || 'Hecho.', 'info'),
      P && A.text && t.toast(A.text, 'bien'),
      a.bus?.emit('inv:changed', { who: i }),
      (r = null),
      R());
  }
  function D() {
    for (let A of b.querySelectorAll('.pane')) A.classList.toggle('on', A.dataset.pane === l);
  }
  function M() {
    c &&
      ((d.innerHTML = `${iconHtml('coins')}${escapeHtml(s().gold ?? c.gold ?? 0)}<small>po</small>`),
      y(),
      w(),
      E(),
      D());
  }
  function R() {
    (p.update(h().map((P) => ({ id: P.id, html: m(P) }))), p.set(i));
    let A = g();
    if (A) {
      b.innerHTML = `<div class="mg-vacio" style="grid-column:1/-1">${iconHtml('info')}No se ha podido abrir el inventario (${escapeHtml(A)}).</div>`;
      return;
    }
    M();
  }
  return (
    R(),
    {
      onKey(A) {
        if ((A.key === 'ArrowLeft' || A.key === 'ArrowRight') && !A.target.closest?.('.mg-tabs')) {
          let P = s().party,
            I = P.indexOf(i);
          return ((i = P[(I + (A.key === 'ArrowRight' ? 1 : P.length - 1)) % P.length]), (r = null), R(), !0);
        }
        return A.key.toLowerCase() === 'i' ? (o.close(null), !0) : !1;
      },
    }
  );
}
const wL = [
  ['ring1', 'Anillo', 'ring'],
  ['amulet', 'Amuleto', 'amulet'],
  ['cloak', 'Capa', 'cloak'],
  ['weapon:0', 'Mano principal', 'sword'],
  ['armor', 'Armadura', 'armor'],
  ['shield', 'Escudo', 'shield'],
  ['gloves', 'Guantes', 'gauntlets'],
  ['boots', 'Botas', 'boots'],
  ['ring2', 'Anillo', 'ring'],
  ['weapon:1', 'Mano secundaria', 'dagger'],
  ['weapon:2', 'Arma de repuesto', 'sword2'],
  ['weapon:3', 'Arma de repuesto', 'sword2'],
];
const TL = (o, e) =>
  e === o ||
  (e === 'weapon' && o.startsWith('weapon:')) ||
  (e === 'ring' && (o === 'ring1' || o === 'ring2'));

export { pantallaInventario as default, opcionesInventario as options };
