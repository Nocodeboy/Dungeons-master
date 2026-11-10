// Jugador automático para los escenarios de paridad: lleva los PJ con las mismas peticiones que
// la interfaz del juego (publicado/juego.js) y deja los enemigos a la IA (ai_turn). Elige al azar
// con un generador propio con semilla, así que el mismo escenario hace siempre las mismas
// peticiones. Las respuestas del oráculo deciden el paso siguiente.

export function generador(semilla) {
  let a = semilla >>> 0;
  const f = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.int = (n) => Math.floor(f() * n);
  f.pick = (arr) => (arr.length ? arr[Math.floor(f() * arr.length)] : undefined);
  return f;
}

/** Centro de una casilla en unidades del mapa (rejilla hexagonal odd-r, como BattleMap::center). */
export function centro([x, y]) {
  return [x + 0.5 * (y & 1), y * 0.8660254];
}

/** Camino desde el origen hasta `destino` con la lista de movimiento de options ([x,y,coste,px,py]). */
export function camino(lista, destino) {
  const prev = new Map(lista.map((e) => [`${e[0]},${e[1]}`, e]));
  const out = [];
  let cur = prev.get(`${destino[0]},${destino[1]}`);
  let guard = 0;
  while (cur && guard++ < 200) {
    out.unshift([cur[0], cur[1]]);
    if (cur[3] === cur[0] && cur[4] === cur[1]) break;
    cur = prev.get(`${cur[3]},${cur[4]}`);
  }
  return out.slice(1);
}

function vivos(st, equipo) {
  return st.creatures.filter((c) => !c.dead && (equipo === undefined || c.team === equipo));
}

/** Lanza un conjuro como la interfaz: spell_begin, elección de objetivos, spell_preview y cast. */
function conjuro(call, rnd, st, yo, sp) {
  const slot = sp.level > 0 ? sp.level + (rnd() < 0.2 ? 1 : 0) : 0;
  const b = call('spell_begin', { spell: sp.id, slot });
  const pet = { spell: sp.id, slot, targets: [] };
  const valid = b.valid || [];
  const cells = b.cells || [];
  switch (b.target) {
    case 'self':
      pet.targets = [yo.id];
      break;
    case 'point': {
      const c = rnd.pick(cells) || yo.cell;
      pet.point = centro(c);
      break;
    }
    case 'direction': {
      const e = rnd.pick(vivos(st, 1)) || yo;
      const a = centro(yo.cell), d = centro(e.cell);
      pet.dir = [d[0] - a[0] || 1, d[1] - a[1]];
      break;
    }
    case 'cell':
      pet.cell = rnd.pick(cells) || yo.cell;
      break;
    case 'darts':
    case 'rays':
      for (let i = 0; i < (b.n || 1) && valid.length; i++) pet.targets.push(rnd.pick(valid));
      break;
    default: {
      const max = Math.max(1, b.max || 1);
      const pool = valid.slice();
      while (pet.targets.length < max && pool.length) pet.targets.push(pool.splice(rnd.int(pool.length), 1)[0]);
    }
  }
  if (rnd() < 0.8) call('spell_preview', pet);
  if (rnd() < 0.08) {
    // A veces la interfaz manda algo incoherente: objetivo que no vale o sin objetivos
    pet.targets = rnd() < 0.5 ? [] : [rnd.pick(st.creatures).id];
  }
  call('cast', pet);
}

/** Usa un rasgo de clase como la interfaz (useFeature / confirmFeatureArea). */
function rasgo(call, rnd, st, yo, f) {
  const t = f.target || 'none';
  if (t === 'none') return call('feature', { id: f.id });
  if (t === 'choice') {
    const opts = (f.options || []).filter((o) => o.enabled !== false);
    const o = rnd.pick(opts.length ? opts : f.options || []);
    return call('feature', o ? { id: f.id, choice: o.id } : { id: f.id });
  }
  if (['enemy', 'enemy_adjacent', 'ally_other', 'ally_touch', 'creature'].includes(t)) {
    const valid = call('simple_targets', { what: `feat:${f.id}` });
    if (!valid.length) return null;
    return call('simple', { what: `feat:${f.id}`, target: rnd.pick(valid) });
  }
  if (t === 'point' || t === 'direction' || t === 'cell') {
    const pet = { id: f.id };
    if (f.zone !== undefined && f.zone !== null) pet.zone = f.zone;
    const e = rnd.pick(vivos(st, 1)) || yo;
    if (t === 'point') pet.point = centro(e.cell);
    else if (t === 'direction') {
      const a = centro(yo.cell), d = centro(e.cell);
      pet.dir = [d[0] - a[0] || 1, d[1] - a[1]];
      pet.point = pet.dir;
    } else pet.cell = e.cell;
    return call('feature', pet);
  }
  return call('feature', { id: f.id });
}

/** Un turno de PJ con varias acciones al azar. */
function turnoJugador(call, rnd, opciones = {}) {
  const maxAcciones = opciones.maxAcciones ?? 6;
  for (let i = 0; i < maxAcciones; i++) {
    const o = call('options');
    if (!o) return;
    const st = call('state');
    if (st.over) return;
    const yo = st.creatures.find((c) => c.id === st.current);
    const enemigos = vivos(st, 1);
    const tiradas = [];
    if (o.move.length > 1) tiradas.push('move', 'move');
    if (o.dash.length > 1) tiradas.push('dash');
    if (enemigos.length && (yo.turn.action > 0 || yo.turn.attack_left > 0)) tiradas.push('attack', 'attack', 'attack');
    if (o.spells.some((s) => s.usable)) tiradas.push('spell', 'spell');
    if (o.features.some((f) => f.enabled)) tiradas.push('feature', 'feature');
    if (o.actions.some((a) => a.enabled)) tiradas.push('action');
    if (o.items.some((a) => a.enabled)) tiradas.push('item');
    if (o.can_undo) tiradas.push('undo');
    if (o.nothing_left) tiradas.push('fin', 'fin', 'fin');
    tiradas.push('fin');
    const que = rnd.pick(tiradas);
    if (que === 'fin') return;
    if (que === 'move' || que === 'dash') {
      const lista = que === 'move' ? o.move : o.dash;
      const dest = rnd.pick(lista.slice(1));
      const path = camino(lista, dest);
      if (rnd() < 0.5) call('threats', { path });
      call('move', { path, dash: que === 'dash' });
    } else if (que === 'attack') {
      const t = rnd.pick(enemigos);
      const key = rnd() < 0.25 && o.profiles.length ? rnd.pick(o.profiles).key : '';
      const plan = call('attack_plan', { target: t.id, key });
      if (plan.ok) {
        const r = call('attack', { key: plan.key, target: plan.target, path: plan.path });
        if (r.offhand && rnd() < 0.7) call('offhand', { key: r.offhand.key, target: r.offhand.target });
      } else if (rnd() < 0.2) {
        call('attack', { key: o.profiles[0]?.key ?? '', target: t.id, path: [] });
      }
    } else if (que === 'spell') {
      conjuro(call, rnd, st, yo, rnd.pick(o.spells.filter((s) => s.usable)));
    } else if (que === 'feature') {
      rasgo(call, rnd, st, yo, rnd.pick(o.features.filter((f) => f.enabled)));
    } else if (que === 'action') {
      const a = rnd.pick(o.actions.filter((x) => x.enabled));
      if (a.target === 'none') call('simple', { what: a.id });
      else {
        const valid = call('simple_targets', { what: a.target });
        if (valid.length) call('simple', { what: a.target, target: rnd.pick(valid) });
      }
    } else if (que === 'item') {
      const it = rnd.pick(o.items.filter((x) => x.enabled));
      const valid = call('simple_targets', { what: it.target });
      if (valid.length) call('simple', { what: it.target, target: rnd.pick(valid) });
    } else if (que === 'undo') {
      call('undo_move');
    }
  }
}

/** Combate completo: PJ con el jugador automático (o la IA a ratos) y enemigos con la IA. */
export function combate(call, init, semilla, { maxTurnos = 160, auto = 0.15 } = {}) {
  const rnd = generador(semilla);
  const r = call('init', init);
  if (!r.state) return;
  for (let t = 0; t < maxTurnos; t++) {
    const st = call('state');
    if (st.over) break;
    const cur = st.creatures.find((c) => c.id === st.current);
    if (cur && cur.team === 0 && cur.can_act && rnd() >= auto) turnoJugador(call, rnd);
    else call('ai_turn');
    const fin = call('end_turn');
    if (fin.events?.some((e) => e.t === 'end')) break;
  }
  call('state');
}

export const escenarios = {};
const ENC = ['e1_prado', 'e2_pinar', 'e3_tumulo'];
for (let i = 0; i < 18; i++) {
  const enc = ENC[i % 3];
  const level = 1 + (Math.floor(i / 3) % 3);
  escenarios[`${enc}_n${level}_${i}`] = (call) => combate(call, { encounter: enc, seed: 100 + i, level }, 1000 + i);
}
