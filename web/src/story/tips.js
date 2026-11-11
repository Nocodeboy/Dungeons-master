// story/tips.js — Consejos para el jugador (story.tips).
// Escucha el bus (pasos, diálogos, combate, botín, tienda, viaje…) y encola consejos de
// datos/historia/consejos.json, cada uno una sola vez por partida. Los muestra de uno en uno con una
// separación mínima (`gap`), como pista del HUD o, si hay una pantalla o diálogo abierto, como aviso.
// Los textos tienen versión táctil y de ratón. Lo crea story/index.js.

import historiaConsejos from '../datos/historia/consejos.json';

/** ¿Pantalla táctil (puntero grueso)? */
const isTouchDevice = () => {
  try {
    return !!globalThis.matchMedia?.('(pointer: coarse)')?.matches;
  } catch {
    return !1;
  }
};
/** Primera palabra de un nombre. */
const firstWord = (name) => String(name || '').split(/\s+/)[0];
/** Cola de consejos con caducidad (`ttl`) y prioridad para los urgentes (`now`). */
const Tips = class {
  constructor(story, data = historiaConsejos) {
    ((this.story = story),
      (this.game = story.game),
      (this.data = data || { tips: {} }),
      (this.queue = []),
      (this.last = -1e9),
      (this.timer = 0),
      (this.pcs = new Set()),
      (this.shown = []),
      (this._weightT = 0),
      (this._weights = new Map()),
      (this.now = () => Date.now()),
      (this.coarse = isTouchDevice));
  }
  /** Consejos ya vistos en la partida (st.tips). */
  get store() {
    let st = this.story.st;
    return ((st.tips ??= {}), st.tips);
  }
  /** ¿Consejos activados en los ajustes? */
  enabled() {
    return this.game.store?.settings?.tips !== !1;
  }
  /** ¿Ya se mostró el consejo? */
  seen(id) {
    return !!this.store[id];
  }
  /** Olvida los consejos vistos y vacía la cola. */
  reset() {
    (this.story.cp?.story && (this.story.cp.story.tips = {}), (this.queue.length = 0));
  }
  /** Todos los consejos con su texto y si se han visto (pantalla de ayuda). */
  list() {
    return Object.keys(this.data.tips || {}).map((id) => ({ id, text: this.text(id), seen: this.seen(id) }));
  }
  /** Texto del consejo para el dispositivo actual, con {name} sustituido. */
  text(id, vars = {}) {
    let tip = this.data.tips?.[id];
    if (!tip) return '';
    let text = ((this.coarse() ? tip.touch : tip.mouse) || tip.text || '').replace(/\{name\}/g, vars.name || 'Alguien');
    return this.story.text ? this.story.text(text) : text;
  }
  /** Encola un consejo de los datos si no se ha visto ni está en cola; devuelve si se encoló. */
  fire(id, vars = {}) {
    let tip = this.data.tips?.[id];
    return !tip || !this.story.cp || !this.enabled() || this.seen(id) || this.queue.some((queued) => queued.id === id)
      ? !1
      : (this.queue.push({ id, vars, at: this.now(), now: !!tip.now, ttl: (tip.ttl ?? 40) * 1e3 }),
        this.pump(),
        !0);
  }
  /** Encola un texto suelto (si se da `id`, solo una vez por partida). */
  hint(text, id = null) {
    return !text || !this.enabled() || (id && this.store[id])
      ? !1
      : (id && (this.store[id] = 1),
        this.queue.push({ id, text, at: this.now(), now: !1, ttl: 6e4 }),
        this.pump(),
        !0);
  }
  /** 'dialog' o 'screen' si hay un diálogo o una pantalla abiertos; si no, ''. */
  busy() {
    let ui = this.game.ui;
    try {
      if (ui?.dialogOpen?.()) return 'dialog';
      if (ui?.isOpen?.()) return 'screen';
    } catch {}
    return '';
  }
  /** Muestra el siguiente consejo si toca (o programa otro intento). */
  pump() {
    (clearTimeout(this.timer), (this.timer = 0));
    let now = this.now();
    if (((this.queue = this.queue.filter((tip) => now - tip.at <= tip.ttl)), !this.queue.length)) return;
    let gap = (this.data.gap ?? 7) * 1e3,
      busy = this.busy(),
      urgentIndex = this.queue.findIndex((tip) => tip.now),
      next = urgentIndex >= 0 ? this.queue[urgentIndex] : busy ? null : this.queue[0],
      wait = gap - (now - this.last);
    if (!next || (wait > 0 && !(next.now && now - this.last > 2500))) {
      this.timer = setTimeout(() => this.pump(), Math.max(400, Math.min(wait > 0 ? wait : 800, 3e3)));
      return;
    }
    (this.queue.splice(this.queue.indexOf(next), 1),
      this.show(next),
      this.queue.length && (this.timer = setTimeout(() => this.pump(), gap)));
  }
  /** Muestra un consejo (pista del HUD o aviso), lo marca como visto y emite «tip». */
  show(tip) {
    if (!this.enabled()) return;
    let text = tip.text || this.text(tip.id, tip.vars);
    if (!text) return;
    (tip.id && this.data.tips?.[tip.id] && (this.store[tip.id] = 1), (this.last = this.now()));
    let ui = this.game.ui,
      how = 'toast';
    try {
      !this.busy() && typeof ui?.hud?.hint == 'function'
        ? (ui.hud.hint(text), (how = 'hint'))
        : ui?.toast?.(text, 'info');
    } catch {
      try {
        ui?.toast?.(text, 'info');
      } catch {}
    }
    (this.shown.push({ id: tip.id, text, how }), this.game.bus?.emit('tip', { id: tip.id, text }));
  }
  /** ¿Es un personaje del jugador? */
  isPc(id) {
    if (!id) return !1;
    let cp = this.story.cp;
    return this.pcs.has(id) || !!cp?.party?.includes(id);
  }
  /** Nombre corto de un miembro del grupo o compañero. */
  nameOf(id) {
    let member = this.story.cp?.members?.[id];
    return firstWord(
      member?.short_name ||
        member?.name ||
        this.story.data.companions?.[id]?.short ||
        this.story.data.companions?.[id]?.name ||
        id,
    );
  }
  /** Peso de un objeto según el núcleo (`item_info`), cacheado. */
  weightOf(id) {
    if (!id) return 0;
    if (this._weights.has(id)) return this._weights.get(id);
    let weight = 0;
    try {
      let info = this.story.rules('item_info', { id });
      weight = Number(info?.weight) || 0;
    } catch {
      weight = 0;
    }
    return (this._weights.set(id, weight), weight);
  }
  /** Comprueba la carga del grupo y avisa («heavy») si alguien supera Fuerza × 15. */
  checkWeight() {
    (clearTimeout(this._weightT),
      (this._weightT = setTimeout(() => {
        let cp = this.story.cp;
        if (!(!cp || this.seen('heavy')))
          for (let id of cp.party || []) {
            let member = cp.members?.[id];
            if (!member) continue;
            let load = 0;
            for (let item of member.pack || []) load += this.weightOf(item?.id || item);
            for (let [item, count] of Object.entries(member.items || {})) load += this.weightOf(item) * (Number(count) || 0);
            for (let weapon of member.weapons || []) load += this.weightOf(weapon);
            (member.armor && (load += this.weightOf(member.armor)), member.shield && (load += 6));
            let capacity = (member.abilities?.str ?? 10) * 15;
            if (load > capacity) return void this.fire('heavy', { name: this.nameOf(id) });
          }
      }, 300)));
  }
  /** Engancha los oyentes del bus que disparan cada consejo. */
  attach() {
    let bus = this.game.bus;
    if (!bus || this._attached) return;
    this._attached = !0;
    let on = (name, fn) =>
        bus.on(name, (data) => {
          try {
            fn(data || {});
          } catch (err) {
            console.warn('[historia] consejo', name, err);
          }
        }),
      movedOnce = !1;
    (on('step', (data) => {
      movedOnce || !this.isPc(data.who) || ((movedOnce = !0), setTimeout(() => this.fire('move'), 2500));
    }),
      on('story:options', (data) => {
        data.checks
          ? this.fire('dialog_check')
          : data.specials
            ? this.fire('dialog_special')
            : data.tones && this.fire('dialog_tone');
      }),
      on('quest:update', (data) => data.state === 'active' && !data.step && this.fire('journal')),
      on('codex:unlock', () => this.fire('codex')),
      on('companion:join', (data) => this.fire('companion_talk', { name: this.nameOf(data.id) })),
      on('approval', (data) => {
        data.delta < 0
          ? this.fire('approval_down', { name: this.nameOf(data.who) })
          : data.delta > 0 && this.fire('approval_up', { name: this.nameOf(data.who) });
      }),
      on('interact', (data) => {
        let object = data.object;
        object &&
          typeof object == 'object' &&
          object.lock &&
          (object.type === 'chest' || object.type === 'door' || object.type === 'cache') &&
          this.fire('locked');
      }),
      on('hidden:found', (data) => {
        let type = data.object?.type;
        type === 'trap'
          ? this.fire('trap_found')
          : type === 'group' || data.group
            ? this.fire('ambush_found')
            : this.fire('hidden_found', { name: this.nameOf(data.by) });
      }),
      on('trap:triggered', () => this.fire('trap_hit')),
      on('stealth:on', () => this.fire('stealth')),
      on('spotted', (data) => (data.ambush ? this.fire('ambushed') : this.fire('spotted'))),
      on('loot:taken', (data) => {
        let items = data.items || [];
        ((items.length || data.gold) && this.fire('loot'),
          items.some((item) => item && (item.unid || item.unidentified)) && this.fire('unidentified'),
          this.checkWeight());
      }),
      on('item:gain', () => this.checkWeight()),
      on('ui:open', (data) => data.name === 'tienda' && this.fire('shop')),
      on('scene:enter', (data) => data.name === 'travel' && this.fire('travel')),
      on('rest:short', () => this.fire('rest_short')),
      on('rest:long', () => this.fire('rest_long')),
      on('levelup', () => this.fire('levelup')),
      on('battle:start', (data) => {
        (this.fire('battle'),
          data.surprise ? this.fire('surprise') : data.surprisedParty?.length && this.fire('ambushed'));
      }),
      on('battle:turn', (data) => {
        data.isPc && (this.pcs.add(data.creature), this.fire('turn'));
      }),
      on('battle:event', ({ ev }) => {
        if (!ev?.t) return;
        let mine = this.isPc(ev.who),
          whoName = () => this.nameOf(ev.who);
        switch (ev.t) {
          case 'attack':
            if ((ev.oa && this.isPc(ev.target) && this.fire('opportunity'), !mine)) break;
            (this.fire('attack'), ev.mode && this.fire('advantage'));
            break;
          case 'cast':
            mine && this.fire('spell');
            break;
          case 'concentration':
            mine && ev.on !== !1 && this.fire('concentration', { name: whoName() });
            break;
          case 'condition':
            mine && ev.on && ev.cond !== 'unconscious' && this.fire('condition', { name: whoName() });
            break;
          case 'downed':
            mine && this.fire('downed', { name: whoName() });
            break;
          case 'death':
            mine && this.fire('dead', { name: whoName() });
            break;
          case 'sneak':
            mine && this.fire('sneak');
            break;
          case 'hide':
            mine && ev.success !== !1 && this.fire('hide');
            break;
          case 'dash':
            mine && this.fire('dash');
            break;
          case 'disengage':
            mine && this.fire('disengage');
            break;
          case 'item':
            mine && this.fire('potion');
            break;
          case 'reaction':
            mine && this.fire('reaction');
            break;
        }
      }),
      on('battle:end', (data) => {
        data.fled ? this.fire('fled') : data.won && setTimeout(() => this.fire('save'), 4e3);
      }),
      on('game:loaded', () => (this.queue.length = 0)));
  }
};

export { Tips };
