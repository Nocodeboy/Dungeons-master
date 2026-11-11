// ui/screens/inventario.js
// Reconstruido de publicado/juego.js (módulo __esm «zT»). Nombres locales aún minificados.

import { iconHtml, escapeHtml, elem, makeButton, faceBadge, signed } from '../dom.js';
import { screenFrame, makeTabs } from '../modal.js';
import { setTip } from '../tooltip.js';
import { rarityClass, itemIcon, itemTip } from '../items.js';
import { RARITIES, ITEM_KINDS, CLASS_ICONS } from '../labels.js';

function opcionesInventario() {
  return { width: '78rem', height: '48rem' };
}
function pantallaInventario(screen, params, ui, game) {
  let rules = ui.R,
    currentCp = () => game.store.cp;
  if (!currentCp()) {
    let emptyFrame = screenFrame(screen, { title: 'Inventario', ic: 'backpack' });
    emptyFrame.body.innerHTML = `<div class="mg-vacio">${iconHtml('backpack')}No hay ninguna partida en curso.</div>`;
    return;
  }
  let who = currentCp().party.includes(params.who) ? params.who : currentCp().party[0],
    picked = null,
    pane = 'equipo',
    inv = null,
    goldEl = elem('span.mg-gold'),
    frame = screenFrame(screen, { title: 'Inventario', ic: 'backpack', extra: null });
  frame.head.insertBefore(goldEl, frame.head.querySelector('.mg-cerrar'));
  let members = () =>
      currentCp().party.map((id) => {
        let member = currentCp().members[id] || {};
        return { id, label: String(member.name || id).split(' ')[0], cls: member.class };
      }),
    memberTabs = makeTabs(
      members().map((member) => ({ id: member.id, html: memberTabHtml(member) })),
      who,
      (id) => {
        ((who = id), (picked = null), refresh());
      },
    );
  function memberTabHtml(member) {
    return `<span class="mg-memtab">${faceBadge(ui.portrait(member.id), { id: member.id, name: member.label, ic: CLASS_ICONS[member.cls] || 'person' }).outerHTML}<span>${escapeHtml(member.label)}</span></span>`;
  }
  ((frame.tabs.hidden = !1), frame.tabs.append(memberTabs));
  let paneTabs = makeTabs(
      [
        { id: 'equipo', label: 'Equipo', icon: 'armor' },
        { id: 'detalle', label: 'Detalle', icon: 'info' },
        { id: 'mochila', label: 'Mochila', icon: 'backpack' },
      ],
      pane,
      (id) => {
        pane = id;
        for (let paneEl of panes.querySelectorAll('.pane'))
          paneEl.classList.toggle('on', paneEl.dataset.pane === id);
      },
      { cls: 'mg-panes-tabs' },
    ),
    panes = elem('div.mg-inv'),
    equipPane = elem('section.pane.mg-inv-col', { 'data-pane': 'equipo' }),
    detailPane = elem('section.pane.mg-inv-mid', { 'data-pane': 'detalle' }),
    bagPane = elem('section.pane.mg-inv-col', { 'data-pane': 'mochila' });
  (panes.append(equipPane, detailPane, bagPane),
    equipPane.classList.add('on'),
    (frame.body.style.gridTemplateRows = 'auto minmax(0, 1fr)'),
    (paneTabs.style.gridRow = '1'),
    (panes.style.gridRow = '2'),
    frame.body.append(paneTabs, panes));
  function loadInv() {
    let res = rules.inv(who);
    return !res || res.error ? ((inv = null), res?.error || 'sin respuesta') : ((inv = res), null);
  }
  function renderEquip() {
    ((equipPane.innerHTML = ''), equipPane.append(elem('h3.mg-sec', 'Equipo')));
    let doll = elem('div.mg-doll.mg-inset');
    for (let [slotKey, label, icon] of DOLL_SLOTS) {
      let slot = inv.slots?.[slotKey] || { key: slotKey, label, empty: !0 },
        empty = slot.empty || !slot.id,
        button = elem(`button.mg-slot.s-${slotKey.replace(':', '')}`, {
          'data-slot': slotKey,
          'aria-pressed': String(picked?.where === 'slot' && picked.key === slotKey),
          'aria-label': `${label}: ${empty ? 'vac\xEDo' : slot.name}`,
        });
      (empty ? button.classList.add('vacio') : button.classList.add(...[rarityClass(slot)].filter(Boolean)),
        (button.innerHTML = `${iconHtml(empty ? icon : itemIcon(slot))}<span class="mg-slot-n">${escapeHtml(empty ? '' : slot.name)}</span><span class="mg-slot-l">${escapeHtml(label)}</span>`),
        empty || setTip(button, itemTip(ui, slot)),
        button.addEventListener('click', () => {
          button._dragged ||
            ((picked = { where: 'slot', key: slotKey }),
            matchMedia('(max-width: 860px)').matches &&
              !empty &&
              (paneTabs.set('detalle'), (pane = 'detalle'), showPane()),
            render());
        }),
        empty || makeDraggable(button, { from: 'slot', key: slotKey, item: slot }),
        doll.append(button));
    }
    let extra = elem('div.mg-doll-extra');
    for (let ammo of inv.ammo || [])
      extra.append(
        elem('span.mg-chip', { html: `${iconHtml('quiver')}${escapeHtml(ammo.name)} ${escapeHtml(ammo.n)}` }),
      );
    (inv.attuned &&
      extra.append(
        elem(
          'span.mg-chip',
          { title: 'Objetos m\xE1gicos que requieren sinton\xEDa' },
          `Sinton\xEDa ${inv.attuned.n}/${inv.attuned.max}`,
        ),
      ),
      doll.append(extra),
      equipPane.append(doll));
  }
  function renderStats() {
    detailPane.innerHTML = '';
    let stats = inv.stats || {},
      box = elem('div.mg-inv-stats.mg-inset'),
      statsRow = elem('div.mg-stats');
    for (let [value, label, tip] of [
      [stats.ac, 'CA', 'Clase de Armadura'],
      [`${stats.hp ?? '\u2014'}/${stats.max_hp ?? '\u2014'}`, 'PG', 'Puntos de golpe'],
      [stats.speed_text || '', 'Velocidad', 'Velocidad'],
    ]) {
      let stat = elem('span.mg-stat', elem('b.mg-num', String(value ?? '\u2014')), elem('span', label));
      (setTip(stat, tip), statsRow.append(stat));
    }
    box.append(statsRow);
    let attacks = elem('div.mg-inv-atk');
    for (let attack of stats.attacks || [])
      attacks.append(
        elem(
          'div',
          elem('b', attack.name),
          elem('span', `${attack.to_hit_text ?? signed(attack.to_hit)} \xB7 ${attack.damage}`),
        ),
      );
    ((stats.attacks || []).length &&
      box.append(elem('div.mg-label', { style: 'margin-top:.2rem' }, 'Ataques'), attacks),
      detailPane.append(box, itemDetail()));
  }
  function pickedItem() {
    if (!picked) return null;
    if (picked.where === 'slot') {
      let slot = inv.slots?.[picked.key];
      return slot && !slot.empty && slot.id ? { ...slot, where: 'slot' } : null;
    }
    let entry = inv.bag?.[picked.i];
    return entry ? { ...entry, bagIndex: picked.i } : null;
  }
  function itemDetail() {
    let box = elem('div.mg-inv-detail.mg-inset.mg-scroll'),
      item = pickedItem();
    if (!item)
      return (
        (box.innerHTML = `<div class="mg-vacio">${iconHtml('hand')}<span>Toca un objeto para ver qu\xE9 hace.<br>${matchMedia('(pointer: fine)').matches ? 'Tambi\xE9n puedes arrastrarlo a un hueco, a la mochila o a otro personaje.' : ''}</span></div>`),
        box
      );
    let info = rules.call('item_info', { id: item.id, unid: !!item.unid }),
      data = info && !info.error ? info : {};
    box.append(
      elem(
        `div.mg-item-name.${rarityClass(item) || 'mg-r-comun'}`,
        item.label && item.where !== 'slot' ? item.label : item.name,
      ),
    );
    let kindLine = [
      ITEM_KINDS[data.kind || item.kind] || '',
      data.rarity_name || RARITIES[item.rarity]?.[0] || '',
      data.attune ? 'requiere sinton\xEDa' : '',
    ]
      .filter(Boolean)
      .join(' \xB7 ');
    (kindLine && box.append(elem('div.mg-item-kind', item.unid ? 'Sin identificar' : kindLine)),
      (data.props || []).length &&
        box.append(elem('div.mg-item-props', ...data.props.map((prop) => elem('span.mg-chip', prop)))));
    let lines = item.unid
      ? ['No sab\xE9is qu\xE9 es. Un descanso corto (o el conjuro Identificar) lo revelar\xE1.']
      : data.lines?.length
        ? data.lines
        : [data.desc || ''];
    box.append(elem('div.mg-item-desc', ...lines.filter(Boolean).map((line) => elem('p.mg-p', line))));
    let meta = elem('div.mg-item-meta');
    if (
      ((data.sell || item.value) &&
        meta.insertAdjacentHTML(
          'beforeend',
          `<span>${iconHtml('coins')} Se vende por ${escapeHtml(data.sell ?? item.value)} po</span>`,
        ),
      data.weight && meta.append(elem('span', `${String(data.weight).replace('.', ',')} lb`)),
      box.append(meta),
      item.where === 'pack' && item.equippable)
    ) {
      let preview = rules.invPreview(who, { idx: item.idx });
      if (preview && !preview.error) {
        let previewBox = elem('div.mg-preview');
        previewBox.append(elem('div.mg-label', 'Si te lo equipas'));
        let changes = preview.changes || [];
        if (changes.length) {
          let statNames = { ac: 'CA', attack: 'Ataque', speed: 'Velocidad', max_hp: 'PG m\xE1ximos' };
          for (let change of changes) {
            let fmt = (v) =>
              change.what === 'attack'
                ? signed(v)
                : change.what === 'speed'
                  ? `${String(Math.round(v * 3) / 10).replace('.', ',')} m`
                  : v;
            previewBox.append(
              elem(
                'div.fila',
                elem('span', statNames[change.what] || change.what),
                elem('span', {
                  html: `${escapeHtml(fmt(change.from))} \u2192 <b class="${change.better ? 'mg-delta-up' : 'mg-delta-down'}">${escapeHtml(fmt(change.to))}</b>`,
                }),
              ),
            );
          }
        }
        for (let line of (preview.lines || []).filter(
          (line) => !changes.length || !/^(CA|Ataque|Velocidad|PG máx)/.test(line),
        ))
          previewBox.append(elem('div', line));
        if (!changes.length && !(preview.lines || []).length) {
          let acBefore = preview.before?.ac,
            acAfter = preview.after?.ac;
          acBefore != null && acAfter != null && acAfter !== acBefore
            ? previewBox.append(
                elem(
                  'div.fila',
                  elem('span', 'CA'),
                  elem('span', {
                    html: `${acBefore} \u2192 <b class="${acAfter > acBefore ? 'mg-delta-up' : 'mg-delta-down'}">${acAfter}</b>`,
                  }),
                ),
              )
            : previewBox.append(elem('div.mg-dim', 'Sin cambios en CA ni ataques.'));
        }
        (preview.ok === !1 && preview.reason && previewBox.append(elem('div.aviso', preview.reason)),
          box.append(previewBox));
      }
    }
    let acts = elem('div.mg-item-acts');
    if (
      (item.where === 'slot' &&
        acts.append(
          makeButton('Quitar', {
            icon: 'undo',
            size: 'sm',
            onclick: () => applyResult(rules.unequip(who, picked.key)),
          }),
        ),
      item.where === 'pack' &&
        item.equippable &&
        (item.slot === 'ring'
          ? (acts.append(
              makeButton('Anillo izquierdo', {
                icon: 'ring',
                size: 'sm',
                variant: 'primary',
                onclick: () => applyResult(rules.equip(who, { idx: item.idx }, 'ring1')),
              }),
            ),
            acts.append(
              makeButton('Anillo derecho', {
                icon: 'ring',
                size: 'sm',
                variant: 'primary',
                onclick: () => applyResult(rules.equip(who, { idx: item.idx }, 'ring2')),
              }),
            ))
          : acts.append(
              makeButton('Equipar', {
                icon: 'check',
                size: 'sm',
                variant: 'primary',
                onclick: () => applyResult(rules.equip(who, { idx: item.idx })),
              }),
            )),
      item.usable)
    )
      for (let memberId of currentCp().party) {
        let member = currentCp().members[memberId];
        acts.append(
          makeButton(
            memberId === who ? 'Beber' : `Dar de beber a ${String(member?.name || memberId).split(' ')[0]}`,
            {
              icon: 'potion',
              size: 'sm',
              onclick: () => applyResult(rules.use(who, item.id, memberId), { toastOk: !0 }),
            },
          ),
        );
      }
    if (item.where !== 'slot') {
      for (let memberId of currentCp().party.filter((id) => id !== who)) {
        let member = currentCp().members[memberId];
        acts.append(
          makeButton(
            `Dar ${item.where === 'stack' && item.n > 1 ? 'uno ' : ''}a ${String(member?.name || memberId).split(' ')[0]}`,
            {
              icon: 'hand',
              size: 'sm',
              variant: 'ghost',
              onclick: () =>
                applyResult(
                  rules.giveTo(who, memberId, item.where === 'pack' ? { idx: item.idx } : item.id, 1),
                ),
            },
          ),
        );
      }
      item.kind !== 'key' &&
        item.kind !== 'quest' &&
        acts.append(
          makeButton('Tirar', {
            icon: 'trash',
            size: 'sm',
            variant: 'danger',
            onclick: async () => {
              (await ui.confirm(
                `\xBFTirar ${item.name}${item.n > 1 ? ` (\xD7${item.n})` : ''}? No podr\xE1s recuperarlo.`,
                { titulo: 'Tirar objeto', si: 'Tirar', peligro: !0 },
              )) &&
                applyResult(
                  rules.drop(who, item.where === 'pack' ? { idx: item.idx } : item.id, item.n || 1),
                );
            },
          }),
        );
    }
    return (
      item.where === 'stack' &&
        ['scroll', 'wand'].includes(item.kind) &&
        box.append(elem('p.mg-cr-note', 'Se usa en combate, desde el bot\xF3n Objetos.')),
      box.append(acts),
      box
    );
  }
  function renderBag() {
    ((bagPane.innerHTML = ''),
      bagPane.append(
        elem(
          'div.mg-bag-head',
          elem('h3.mg-sec', { style: 'flex:1;margin:0' }, 'Mochila'),
          elem('span.mg-dim.mg-small', `${(inv.bag || []).length} objetos`),
        ),
      ));
    let grid = elem('div.mg-bag.mg-inset.mg-scroll', { 'data-drop': 'bag' });
    (inv.bag || []).forEach((item, index) => {
      let tile = elem('button.mg-tile', {
          'aria-pressed': String(picked?.where === 'bag' && picked.i === index),
          'aria-label': `${item.name}${item.n > 1 ? `, ${item.n}` : ''}`,
        }),
        cls = rarityClass(item);
      (cls && tile.classList.add(cls),
        (tile.innerHTML = `${iconHtml(itemIcon(item))}<span class="mg-tile-n">${escapeHtml(item.name)}</span>${item.n > 1 ? `<span class="mg-badge">${escapeHtml(item.n)}</span>` : ''}`),
        setTip(tile, itemTip(ui, item)),
        tile.addEventListener('click', () => {
          tile._dragged ||
            ((picked = { where: 'bag', i: index }),
            matchMedia('(max-width: 860px)').matches &&
              (paneTabs.set('detalle'), (pane = 'detalle'), showPane()),
            render());
        }),
        makeDraggable(tile, { from: 'bag', i: index, item }),
        grid.append(tile));
    });
    let count = (inv.bag || []).length;
    for (let cell = count; cell < Math.max(24, count + 4 - (count % 4)); cell++)
      grid.append(elem('div.mg-tile.hueco', { 'aria-hidden': 'true' }));
    (count ||
      grid.prepend(
        elem('div.mg-vacio', { style: 'grid-column:1/-1;padding:1rem 0' }, 'La mochila est\xE1 vac\xEDa.'),
      ),
      bagPane.append(grid));
  }
  function makeDraggable(el, drag) {
    el.addEventListener('pointerdown', (ev) => {
      if (ev.pointerType !== 'mouse' || ev.button !== 0) return;
      let start = [ev.clientX, ev.clientY],
        ghost = null,
        over = null,
        targets = () => [...screen.el.querySelectorAll('[data-slot], [data-drop], .mg-tab[data-id]')],
        accepts = (target) =>
          target.dataset.slot
            ? drag.from === 'bag' && drag.item.equippable && slotFits(target.dataset.slot, drag.item.slot)
            : target.dataset.drop === 'bag'
              ? drag.from === 'slot'
              : target.dataset.id
                ? drag.from === 'bag' && target.dataset.id !== who
                : !1,
        onMove = (ev) => {
          if (!ghost && Math.hypot(ev.clientX - start[0], ev.clientY - start[1]) > 7) {
            ((ghost = elem('div.mg-ghost', { html: iconHtml(itemIcon(drag.item)) })),
              document.body.append(ghost));
            for (let target of targets()) accepts(target) && target.classList.add('blanco');
            ui.tips.hide();
          }
          if (!ghost) return;
          ghost.style.transform = `translate(${ev.clientX - 28}px, ${ev.clientY - 28}px)`;
          let hit = document
              .elementFromPoint(ev.clientX, ev.clientY)
              ?.closest('[data-slot], [data-drop], .mg-tab[data-id]'),
            target = hit && accepts(hit) ? hit : null;
          target !== over &&
            (over?.classList.remove('encima'), (over = target), over?.classList.add('encima'));
        },
        onUp = () => {
          if (
            (removeEventListener('pointermove', onMove),
            removeEventListener('pointerup', onUp),
            removeEventListener('pointercancel', onUp),
            !ghost)
          )
            return;
          ghost.remove();
          for (let target of targets()) target.classList.remove('blanco', 'encima');
          if (((el._dragged = !0), setTimeout(() => (el._dragged = !1), 50), !over)) return;
          let item = drag.item;
          if (over.dataset.slot) {
            let slot = item.slot === 'ring' ? over.dataset.slot : void 0;
            applyResult(rules.equip(who, { idx: item.idx }, slot));
          } else
            over.dataset.drop === 'bag'
              ? applyResult(rules.unequip(who, drag.key))
              : over.dataset.id &&
                applyResult(
                  rules.giveTo(
                    who,
                    over.dataset.id,
                    item.where === 'pack' ? { idx: item.idx } : item.id,
                    item.where === 'stack' ? item.n : 1,
                  ),
                );
        };
      (addEventListener('pointermove', onMove),
        addEventListener('pointerup', onUp),
        addEventListener('pointercancel', onUp));
    });
  }
  function applyResult(res, { toastOk } = {}) {
    if (!res || res.error || res.ok === !1)
      return ui.toast(res?.reason || res?.error || 'No se ha podido hacer.', 'mal');
    if (res.ok === !1) return ui.toast(res.reason || res.text || 'No se puede.', 'mal');
    ((toastOk || res.text) && ui.hud?.visible && ui.hud.log(res.text || 'Hecho.', 'info'),
      toastOk && res.text && ui.toast(res.text, 'bien'),
      game.bus?.emit('inv:changed', { who }),
      (picked = null),
      refresh());
  }
  function showPane() {
    for (let paneEl of panes.querySelectorAll('.pane'))
      paneEl.classList.toggle('on', paneEl.dataset.pane === pane);
  }
  function render() {
    inv &&
      ((goldEl.innerHTML = `${iconHtml('coins')}${escapeHtml(currentCp().gold ?? inv.gold ?? 0)}<small>po</small>`),
      renderEquip(),
      renderStats(),
      renderBag(),
      showPane());
  }
  function refresh() {
    (memberTabs.update(members().map((member) => ({ id: member.id, html: memberTabHtml(member) }))),
      memberTabs.set(who));
    let error = loadInv();
    if (error) {
      panes.innerHTML = `<div class="mg-vacio" style="grid-column:1/-1">${iconHtml('info')}No se ha podido abrir el inventario (${escapeHtml(error)}).</div>`;
      return;
    }
    render();
  }
  return (
    refresh(),
    {
      onKey(ev) {
        if ((ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') && !ev.target.closest?.('.mg-tabs')) {
          let party = currentCp().party,
            index = party.indexOf(who);
          return (
            (who = party[(index + (ev.key === 'ArrowRight' ? 1 : party.length - 1)) % party.length]),
            (picked = null),
            refresh(),
            !0
          );
        }
        return ev.key.toLowerCase() === 'i' ? (screen.close(null), !0) : !1;
      },
    }
  );
}
const DOLL_SLOTS = [
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
const slotFits = (slot, itemSlot) =>
  itemSlot === slot ||
  (itemSlot === 'weapon' && slot.startsWith('weapon:')) ||
  (itemSlot === 'ring' && (slot === 'ring1' || slot === 'ring2'));

export { pantallaInventario as default, opcionesInventario as options };
