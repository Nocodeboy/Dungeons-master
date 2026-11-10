// audio/reactions.js
// Reconstruido de publicado/juego.js (módulo __esm «KM»). Nombres locales aún minificados.

import { Vr } from './engine.js';

function hm(o = '', e = 'melee') {
  let t = String(o).toLowerCase();
  return /crossbow/.test(t)
    ? 'ballesta'
    : /bow/.test(t)
      ? 'arco'
      : /sling/.test(t)
        ? 'honda'
        : e === 'thrown' || /thrown|javelin|dart/.test(t)
          ? 'lanzar'
          : e === 'ranged'
            ? 'arco'
            : /unarmed|fist|punch/.test(t)
              ? 'punetazo'
              : /bite|claw|slam|ram|hooves|tentacle|sting|gore|talon/.test(t)
                ? 'natural'
                : /great|maul|halberd|glaive|battleaxe|pike|lance/.test(t)
                  ? 'pesada'
                  : /club|mace|staff|hammer|flail|morningstar|war_pick/.test(t)
                    ? 'contundente'
                    : /dagger|knife|sickle|handaxe|shortsword|rapier|scimitar/.test(t)
                      ? 'ligera'
                      : 'espada';
}
function qv(o) {
  let e = SD(o);
  if (!e) return null;
  for (let [t, a] of MD) if (t.test(e)) return a;
  return 'bestia';
}
function AD(o, e) {
  return o?.rows?.[e[1]]?.[e[0]];
}
function RD(o, e) {
  if (!o || !e) return 'tierra';
  for (let a of o.paint || [])
    if (a.cells?.some((n) => n[0] === e[0] && n[1] === e[1])) return Bv[a.ground] || 'tierra';
  let t = AD(o, e);
  return t === ',' || t === 'b'
    ? 'hierba'
    : t === ':'
      ? 'tierra'
      : t === '=' || t === 'x' || t === 'P' || t === 'S' || t === 'g'
        ? 'piedra'
        : t === 'w'
          ? 'agua'
          : t === '~'
            ? 'barro'
            : t === '.' || t == null
              ? Bv[o.ground?.['.']] ||
                (o.ambient === 'crypt' ? 'piedra' : o.floor ? Bv[o.floor] || 'madera' : 'tierra')
              : 'tierra';
}
function CD(o) {
  let e = Vr(o);
  if (!e) return null;
  let t = Math.round(e.z / (0.8660254 * UM));
  return [Math.round(e.x / UM - 0.5 * (t & 1)), t];
}
function YM(o, e) {
  let t = o.bus,
    a = [],
    n = (M, R) =>
      a.push(
        t.on(M, (A) => {
          try {
            R(A || {});
          } catch (P) {
            console.error(`[sonido] ${M}`, P);
          }
        }),
      ),
    s = (M, R) => e.sfx(M, R),
    i = (M, R) => setTimeout(R, M),
    r = (M) => o.store?.flag?.(M),
    l = {
      scene: null,
      level: null,
      levelId: null,
      emitters: [],
      sprinkles: [],
      battle: null,
      stealth: !1,
      stealthT: 0,
      lastStep: new Map(),
      stepsThisSec: 0,
      stepWindow: 0,
      objectStateSeen: !1,
      lastPos: new Map(),
    },
    c = (M) => ({ ...(xD[M?.id] || {}), ...(M || {}) });
  function d() {
    if (l.scene && l.scene !== 'explore' && um[l.scene]) return um[l.scene];
    let M = c(l.level || { id: l.levelId });
    for (let [R, A] of Object.entries(M.music_flags || {})) if (r(R)) return A;
    return M.music || null;
  }
  function u(M) {
    let R = c(l.level || { id: l.levelId });
    return (R.groups || []).find((P) => P.id === M)?.music || _D[M] || R.music_combat || 'combate';
  }
  function h(M = 2) {
    for (let R of l.emitters) R.stop(M);
    ((l.emitters = []), (l.sprinkles = []));
  }
  function p(M) {
    return M.ambience && gc[M.ambience]
      ? gc[M.ambience]
      : Array.isArray(M.ambience)
        ? { layers: M.ambience, sprinkles: [] }
        : /posada|inn|taberna/.test(M.id || '')
          ? gc.inn
          : M.id === 'kesh'
            ? gc.river
            : gc[M.ambient] || gc.day;
  }
  function m(M) {
    h(1.5);
    let R = c(M),
      A = p(R);
    (e.ambience(A.layers, { fade: 3 }),
      (l.sprinkles = A.sprinkles.map((Z) => ({ ...Z, t: yu(Z.every[0] * 0.4, Z.every[1] * 0.6) }))));
    let P = new Set(A.layers.map((Z) => Z.id)),
      I = o.explore?.world?.spots?.sounds || o.world?.spots?.sounds || null;
    if (I?.length) {
      let Z = {};
      for (let ge of I) ge?.pos && (Z[ge.kind] ||= []).push(ge.pos);
      let K = (ge, ue, Q) => ue?.length && l.emitters.push(e.emitter(ge, { points: ue, ...Q }));
      (K('fuego', [...(Z.fire || []), ...(Z.forge || [])], { vol: 0.9, near: 1.5, far: 13 }),
        K('fuego', Z.torch, { vol: 0.22, near: 0.8, far: 6 }),
        P.has('rio') ||
          K('rio', [...(Z.river || []), ...(Z.watermill || [])], { vol: 0.42, near: 2, far: 14 }),
        K('rio', Z.pond, { vol: 0.15, near: 1.5, far: 9 }),
        K('taberna', Z.tavern, { vol: 0.45, near: 2, far: 12 }),
        Z.blacksmith?.length &&
          l.sprinkles.push({ id: 'yunque', every: [1.1, 3.5], cells: Z.blacksmith, t: 1, near: 3, far: 20 }));
      let ve = [...(Z.windmill || []), ...(Z.watermill || [])];
      ve.length && l.sprinkles.push({ id: 'molino', every: [2.5, 6], cells: ve, t: 2, near: 3, far: 22 });
    } else {
      let Z = [];
      for (let K of R.objects || [])
        (K.type === 'campfire' || /fire|hoguera|brasero|forge/.test(K.id || '')) && K.cell && Z.push(K.cell);
      for (let K of R.decor || [])
        /campfire|bonfire|brazier|hoguera|fogata|forge|hearth|chimenea/.test(K.key || '') &&
          K.cell &&
          Z.push(K.cell);
      Z.length && l.emitters.push(e.emitter('fuego', { points: Z, vol: 0.9, near: 1.5, far: 13 }));
    }
    if (!I?.length && !P.has('rio') && R.rows) {
      let Z = [];
      (R.rows.forEach((K, ve) =>
        [...K].forEach((ge, ue) => ge === 'w' && (ue + ve) % 2 === 0 && Z.push([ue, ve])),
      ),
        Z.length >= 4 && l.emitters.push(e.emitter('rio', { points: Z, vol: 0.3, near: 2, far: 13 })));
    }
    let U = {};
    for (let Z of R.animals || []) jM[Z.kind] && Z.cell && (U[Z.kind] ||= []).push(Z.cell);
    let j = [...(U.sheep || []), ...(U.cow || [])];
    j.length >= 3 && l.emitters.push(e.emitter('rebano', { points: j, vol: 0.6, near: 3, far: 18 }));
    for (let [Z, K] of Object.entries(U)) {
      let [ve, ge, ue] = jM[Z];
      l.sprinkles.push({ id: ve, every: [ge, ue], cells: K, t: yu(ge * 0.3, ue * 0.5), animal: !0 });
    }
    e.preload(['sfx:mundo']);
    let X = R.groups || [],
      J = new Set([u(null), ...X.map((Z) => u(Z.id))].map((Z) => `music:${Z}`));
    (X.length || R.id === 'merrowick') &&
      i(2500, () => e.preload(['sfx:combate', 'sfx:criaturas', 'sfx:magia', ...J]));
  }
  function _(M) {
    if (l.battle || !l.sprinkles.length) return;
    let R = e.engine.listener.focus;
    for (let A of l.sprinkles) {
      if (((A.t -= M), A.t > 0 || ((A.t = yu(A.every[0], A.every[1])), A.unless && r(A.unless)))) continue;
      let P = null;
      if (A.cells?.length) P = yD(A.cells);
      else if (R) {
        let I = A.far ? yu(26, 40) : yu(9, 22),
          U = Math.random() * Math.PI * 2;
        P = [R.x + Math.cos(U) * I, 2, R.z + Math.sin(U) * I];
      }
      s(A.id, {
        at: P,
        volume: A.vol ?? 1,
        near: A.near,
        far: typeof A.far == 'number' ? A.far : A.far ? 60 : 40,
      });
    }
  }
  function b({ at: M, cell: R, surface: A, run: P, who: I, volume: U = 1 } = {}) {
    let j = gi(),
      X = I ?? 'grupo';
    if (
      j - (l.lastStep.get(X) || 0) < (P ? 0.18 : 0.24) ||
      (j - l.stepWindow > 1 && ((l.stepWindow = j), (l.stepsThisSec = 0)), ++l.stepsThisSec > 7)
    )
      return;
    l.lastStep.set(X, j);
    let J = R || (M ? CD(M) : null),
      Z = A || RD(l.level, J),
      K = wD[Z] || 'paso_tierra';
    s(K, {
      at: M || J,
      volume: U * (P ? 1.15 : 1) * (Z === 'barro' ? 0.7 : 1) * (l.stealth ? 0.45 : 1),
      rate: Z === 'barro' ? 0.82 : P ? 1.06 : 1,
    });
  }
  let f = (M, R) => R || (M != null ? l.lastPos.get(M) : null) || null;
  function v(M, R, { chance: A = 1, delay: P = 0, at: I } = {}) {
    let U = qv(M),
      j = U && ED[U][R];
    !j || Math.random() > A || s(j, { at: f(M, I), delay: P });
  }
  function x(M, { target: R, at: A, crit: P, ranged: I, ac: U } = {}) {
    let j = GM[M] || (I ? 'impacto_perforante' : 'impacto_tajo');
    s(j, { at: A, volume: P ? 1.15 : 1 });
    let X = M === 'slashing' || M === 'piercing' || M === 'bludgeoning' || !M;
    (X && qv(R) === 'esqueleto'
      ? s('impacto_hueso', { at: A, volume: 0.8 })
      : X && U >= 16 && s('impacto_metal', { at: A, volume: 0.45 }),
      P && s('critico', { at: A, delay: 0.02 }));
  }
  function g(M, R) {
    let A = hm(M?.weapon, M?.kind);
    if (M?.kind === 'ranged' || M?.kind === 'thrown' || pm[A] == null) return s('flecha_fallo', { at: R });
    if (M?.natural === 1) return s('pifia', { at: R });
    (M?.ac ?? 0) >= 15 && (M?.natural ?? 0) >= 8 && A !== 'natural' && A !== 'punetazo'
      ? s('parada', { at: R })
      : s('fallo', { at: R, volume: 0.9 });
  }
  function y(M, R) {
    (M === 'ballesta'
      ? (s('ballesta', { at: R }), s('arco', { at: R, rate: 0.82, volume: 0.8 }))
      : M === 'lanzar' || M === 'honda'
        ? s('lanzar', { at: R })
        : s('arco', { at: R }),
      l.battle && (l.battle.lastShoot = gi()));
  }
  function w(M) {
    let R = l.battle || (l.battle = T()),
      A = R.fxSeen;
    switch (M.t) {
      case 'attack': {
        if ((R.pending.set(M.who, { ...M, t: gi() }), R.lastAttackOn.set(M.target, gi()), A)) break;
        let P = hm(M.weapon, M.kind),
          I = M.kind === 'ranged' || M.kind === 'thrown' || !pm[P],
          U = f(M.who);
        if (String(M.kind).includes('spell')) {
          s('magia_carga', { at: U });
          break;
        }
        (I ? y(P, U) : s(pm[P], { at: U }),
          v(M.who, 'ataque', { chance: 0.35 }),
          i(I ? 520 : 300, () => {
            M.hit
              ? x(TD[P], { target: M.target, at: f(M.target), crit: M.crit, ranged: I, ac: M.ac })
              : g(M, f(M.target));
          }));
        break;
      }
      case 'damage': {
        let P = gi() - Math.max(R.lastAttackOn.get(M.who) || 0, R.lastCast || 0) < 1.6;
        (!A && !P && M.amount > 0 && x(M.type, { target: M.who, at: f(M.who), crit: M.crit }),
          M.amount > 0 && M.hp > 0 && v(M.who, 'dolor', { chance: 0.55, delay: 0.08 }));
        break;
      }
      case 'cast': {
        if (((R.lastCast = gi()), A)) break;
        let P = xu(M.fx);
        (s(P.cast || 'magia_carga', { at: f(M.who) }),
          i(650, () => {
            let I = (M.targets || [])[0];
            M.cells?.length ? s(P.area || P.impact, {}) : P.impact && s(P.impact, { at: f(I) });
          }));
        break;
      }
      case 'missile':
        A || (s('arcano_lanzar', { at: f(M.who) }), i(380, () => s('arcano_impacto', { at: f(M.target) })));
        break;
      case 'heal':
        !A && M.amount > 0 && s('curacion', { at: f(M.who) });
        break;
      case 'downed':
        s('caida', { at: f(M.who) });
        break;
      case 'death': {
        let P = qv(M.who);
        (v(M.who, 'muerte'),
          P !== 'esqueleto' && P !== 'espectro' && s('caida', { at: f(M.who), delay: 0.35 }));
        break;
      }
      case 'death_save':
        s('dados', { volume: 0.6 });
        break;
      case 'revive':
        s('revivir', { at: f(M.who) });
        break;
      case 'condition':
        M.on && M.cond === 'prone' && s('caida', { at: f(M.who), volume: 0.8 });
        break;
      case 'item':
        (s('pocion_abrir', { at: f(M.who) }), s('pocion_beber', { at: f(M.who), delay: 0.4 }));
        break;
      case 'hide':
        s('sigilo_on', { at: f(M.who) });
        break;
      case 'reveal':
        s('sigilo_off', { at: f(M.who) });
        break;
      case 'shove':
      case 'push':
        s('empujon', { at: f(M.who), volume: M.t === 'push' ? 0.7 : 1 });
        break;
      case 'blocked':
        s('escudo', { at: f(M.target || M.who) });
        break;
      case 'immune':
        s('parada', { at: f(M.who), volume: 0.6 });
        break;
      case 'reaction':
      case 'feature':
      case 'inspiration':
        A || s(M.t === 'feature' ? 'mejora' : 'magia_carga', { at: f(M.who), volume: 0.8 });
        break;
      case 'teleport':
        A || s('teletransporte', {});
        break;
      case 'summon':
        A || s('invocar', {});
        break;
      case 'round':
        M.n > 1 && s('turno', { rate: 0.84, volume: 0.6 });
        break;
      case 'end':
        E(M.winner === 0);
        break;
      default:
        break;
    }
  }
  function k(M) {
    let R = l.battle || (l.battle = T());
    R.fxSeen = !0;
    let A = M.at;
    M.who != null && A && l.lastPos.set(M.who, A);
    let P = M.who != null ? R.pending.get(M.who) : null;
    switch (M.kind) {
      case 'swing': {
        let I = hm(P?.weapon ?? M.weapon, P?.kind);
        (s(pm[I] || 'espada_aire', { at: A }),
          v(M.who, 'ataque', { chance: 0.35, at: A }),
          P && P.hit === !1 && i(110, () => g(P, M.target != null ? f(M.target) : A)));
        break;
      }
      case 'shoot':
        y(hm(P?.weapon ?? M.weapon, P?.kind || 'ranged'), A);
        break;
      case 'launch':
        if (VM.has(M.style))
          gi() - (R.lastShoot || 0) > 0.45 &&
            y(M.style === 'bolt' ? 'ballesta' : M.style === 'arrow' ? 'arco' : 'lanzar', A);
        else {
          let I = xu(M.style).launch;
          I && s(I, { at: A });
        }
        break;
      case 'impact': {
        let I = !M.type || M.type === 'slashing' || M.type === 'piercing' || M.type === 'bludgeoning',
          U = M.who != null ? P : [...R.pending.values()].sort((j, X) => X.t - j.t)[0];
        (I
          ? x(M.type || 'slashing', {
              target: M.target ?? U?.target,
              at: A,
              crit: M.crit,
              ranged: U && U.kind !== 'melee',
              ac: U?.ac,
            })
          : (s(GM[M.type] || xu(M.style).impact || 'arcano_impacto', { at: A, volume: M.crit ? 1.15 : 1 }),
            M.crit && s('critico', { at: A, volume: 0.7 })),
          (R.lastImpact = gi()));
        break;
      }
      case 'whiff':
        VM.has(M.style) ? s('flecha_fallo', { at: A }) : s('fallo', { at: A, volume: 0.7 });
        break;
      case 'miss':
        g(P, A);
        break;
      case 'cast':
        s(xu(M.style).cast || 'magia_carga', { at: A });
        break;
      case 'area': {
        let I = xu(M.style);
        s(I.area || I.impact || 'arcano_impacto', { at: A, volume: 1.1 });
        break;
      }
      case 'heal':
        s('curacion', { at: A });
        break;
      case 'crit':
        gi() - (R.lastImpact || 0) > 0.2 && s('critico', { at: A });
        break;
      case 'shield':
        s('escudo_magico', { at: A });
        break;
      case 'teleport':
        s('teletransporte', { at: A });
        break;
      case 'summon':
        s(M.token === 'flaming_sphere' ? 'fuego_lanzar' : 'invocar', { at: A });
        break;
      case 'shape':
        (s('mejora', { at: A }),
          /wolf|mastiff|dog/.test(String(M.form || '')) && s('lobo_grunido', { at: A, delay: 0.35 }));
        break;
      case 'aura_on':
        s('aura', { at: A, volume: 0.8 });
        break;
      case 'zone_on': {
        let I =
          {
            web: 'naturaleza',
            entangle: 'naturaleza',
            spike: 'naturaleza',
            fog: 'viento_magico',
            darkness: 'oscuridad',
            grease: 'grasa',
            moonbeam: 'luz_carga',
            moon: 'luz_carga',
          }[M.zone || M.style] || 'magia_carga';
        s(I, { at: A, volume: 0.9 });
        break;
      }
      case 'step':
        b({ at: A, who: M.who, run: M.run, surface: M.surface, volume: 0.85 });
        break;
      case 'death':
        break;
      default:
        break;
    }
  }
  function T() {
    return {
      fxSeen: !1,
      pending: new Map(),
      lastAttackOn: new Map(),
      lastCast: 0,
      musicDone: !1,
      lastShoot: 0,
      lastImpact: 0,
    };
  }
  function E(M) {
    let R = l.battle;
    R?.musicDone ||
      (R && (R.musicDone = !0),
      e.unduck('combate'),
      M ? e.music('victoria', { fade: 0.6, then: () => d() }) : e.music('derrota', { fade: 0.8 }));
  }
  (n('settings:changed', ({ settings: M }) => D(M)),
    n('scene:enter', ({ name: M, params: R }) => {
      ((l.scene = M),
        um[M] &&
          (e.music(um[M], { fade: 2 }),
          M !== 'travel'
            ? e.ambience(null, { fade: 2 })
            : e.ambience([{ id: 'viento', vol: 0.5 }], { fade: 2 })),
        M === 'explore' && R?.level && !l.level && (l.levelId = R.level));
    }),
    n('scene:leave', ({ name: M }) => {
      M === 'explore' && (h(1.2), (l.level = null), (l.battle = null));
    }),
    n('level:enter', ({ level: M }) => {
      let R = M && typeof M == 'object' ? M : o.explore?.level?.id === M || !M ? o.explore?.level : null;
      ((l.level = R || null),
        (l.levelId = R?.id || (typeof M == 'string' ? M : null)),
        (l.battle = null),
        (l.stealth = !1),
        m(l.level || { id: l.levelId }));
      let A = d();
      A && e.music(A, { fade: 2.5 });
    }),
    n('level:leave', () => {
      (h(1.5), e.ambience(null, { fade: 1.5 }));
    }),
    n('flag:set', ({ name: M }) => {
      let R = c(l.level || { id: l.levelId });
      if (
        !l.battle &&
        !['victoria', 'derrota'].includes(e.engine.musicName) &&
        R.music_flags &&
        M in R.music_flags
      ) {
        let A = d();
        A && e.music(A, { fade: 3 });
      }
    }),
    n('battle:start', ({ group: M, surprise: R }) => {
      ((l.battle = T()),
        e.preload(['sfx:combate', 'sfx:criaturas', 'sfx:magia']),
        e.music(u(M), { fade: R ? 0.4 : 0.8 }),
        e.duck('combate', 1, { ambience: 0.5 }),
        s('desenvainar', {}),
        i(180, () => s('desenvainar', { volume: 0.8 })));
    }),
    n('battle:turn', ({ isPc: M }) => {
      M && s('turno', { volume: 0.7 });
    }),
    n('battle:event', ({ ev: M }) => M && w(M)),
    n('battle:fx', (M) => k(M)),
    n('battle:end', ({ won: M, fled: R }) => {
      if ((e.unduck('combate'), R)) {
        l.battle && (l.battle.musicDone = !0);
        let A = d();
        A && e.music(A, { fade: 2 });
      } else E(!!M);
      ((l.battle = null), l.lastPos.clear());
    }),
    n('dialog:open', ({ important: M }) => e.duck('dialogo', M ? 0.4 : 0.55, { ambience: 0.75 })),
    n('dialog:close', () => e.unduck('dialogo')));
  let S = (M) => {
    let R = M.roll || M;
    (s('dados'), R && R.success != null && i(750, () => s(R.success ? 'tirada_exito' : 'tirada_fallo')));
  };
  (n('dialog:roll', S),
    n('ui:roll', S),
    n('interact', ({ object: M }) => {
      if (M)
        switch (M.type) {
          case 'door':
            !l.objectStateSeen && !M.locked && !M.lock && s('puerta_abrir', { at: M.cell });
            break;
          case 'chest':
            !l.objectStateSeen && !M.locked && !M.lock && s('cofre_abrir', { at: M.cell });
            break;
          case 'cache':
          case 'loot':
            s('rebuscar', { at: M.cell });
            break;
          case 'sign':
          case 'board':
            s('pagina', { at: M.cell });
            break;
          case 'stairs':
            for (let R = 0; R < 3; R++)
              s('paso_piedra', { delay: R * 0.28, volume: 0.8 - R * 0.15, force: !0 });
            break;
          case 'campfire':
            s('fuego_avivar', { at: M.cell });
            break;
          case 'rune':
            (s('runa', { at: M.cell }), s('runa_brillo', { at: M.cell, delay: 0.25 }));
            break;
          case 'seal':
            s('sello', { at: M.cell });
            break;
          case 'lever':
            s('palanca', { at: M.cell });
            break;
          default:
            break;
        }
    }),
    n('object:state', ({ object: M, id: R, state: A }) => {
      l.objectStateSeen = !0;
      let P = M?.type,
        I = M?.cell;
      P === 'door'
        ? s(
            A === 'open'
              ? /kesh|crypt|stone|piedra/.test(R || M?.id || '')
                ? 'losa'
                : 'puerta_abrir'
              : 'puerta_cerrar',
            { at: I },
          )
        : P === 'chest'
          ? s(A === 'open' ? 'cofre_abrir' : 'cofre_cerrar', { at: I })
          : A === 'revealed'
            ? s('descubrir', { at: I })
            : A === 'lit'
              ? s('fuego_avivar', { at: I })
              : P === 'lever' || A === 'on' || A === 'off'
                ? s('palanca', { at: I })
                : P === 'rune' && A === 'active' && s('runa_brillo', { at: I });
    }),
    n('lock:opened', ({ object: M, how: R }) => {
      let A = M?.cell,
        P = String(R || '');
      /force|break|bash|fuerza/.test(P)
        ? s('forzar', { at: A })
        : /pick|tools|ganz/.test(P)
          ? (s('ganzua', { at: A }),
            s('ganzua', { at: A, delay: 0.45 }),
            s('cerradura', { at: A, delay: 0.9 }))
          : /spell|knock|magic/.test(P)
            ? (s('magia_carga', { at: A }), s('cerradura', { at: A, delay: 0.5 }))
            : (s('llaves', { at: A }), s('cerradura', { at: A, delay: 0.4 }));
    }),
    n('loot:taken', ({ items: M, gold: R }) => {
      (R > 0 && (s('monedas'), s('monedas_recoger', { delay: 0.15 })),
        M?.length && s('objeto', { delay: R > 0 ? 0.3 : 0 }));
    }),
    n('hidden:found', ({ object: M }) => s('descubrir', { at: M?.cell })),
    n('trap:triggered', ({ object: M }) => {
      let R = M?.cell,
        A = String(M?.trap || M?.kind || M?.effect || M?.id || '');
      (s('trampa_click', { at: R }),
        /pit|foso|hoyo/.test(A)
          ? s('caida', { at: R, delay: 0.3 })
          : /blade|cuchilla|scythe|saw/.test(A)
            ? s('trampa_cuchilla', { at: R, delay: 0.12 })
            : /snare|lazo|net|red/.test(A)
              ? s('chirrido', { at: R, delay: 0.1 })
              : s('trampa_dardos', { at: R, delay: 0.1 }));
    }),
    n('trap:disarmed', ({ object: M }) => s('trampa_desarmar', { at: M?.cell })),
    n('stealth:on', () => {
      ((l.stealth = !0), (l.stealthT = 0), s('sigilo_on'));
    }),
    n('stealth:off', () => {
      if (((l.stealth = !1), s('sigilo_off'), e.engine.musicName === 'sigilo' && !l.battle)) {
        let M = d();
        M && e.music(M, { fade: 2.5 });
      }
    }),
    n('spotted', () => s('desenvainar', { volume: 0.9 })),
    n('step', (M) => b(M)),
    n('rest:short', () => s('descanso')),
    n('rest:long', () => {
      (s('descanso'), e.duck('descanso', 0.15, { ambience: 0.6 }), i(6e3, () => e.unduck('descanso')));
    }),
    n('levelup', () => s('subir_nivel')),
    n('quest:update', ({ state: M }) => {
      let R = String(M || '');
      /done|complete|cumplid|hecha|success/.test(R)
        ? s('mision_cumplida')
        : /fail|fallid|lost/.test(R)
          ? s('mision_fallida')
          : s('diario');
    }),
    n('companion:join', () => s('confirmar')),
    n('companion:leave', () => s('atras')),
    n('gold', ({ delta: M }) => s(M > 0 ? 'monedas_recoger' : 'monedas')),
    n('item:gain', () => s('objeto', { volume: 0.8 })),
    n('shop:buy', () => s('monedas')),
    n('shop:sell', () => s('monedas')),
    n('game:saved', ({ slot: M }) => M !== 'auto' && s('guardar')));
  for (let [M, R] of Object.entries(kD)) n(M, () => s(R));
  (n('ui:open', ({ name: M }) => {
    let R = M in $M ? $M[M] : 'abrir';
    R && s(R);
  }),
    n('ui:close', ({ name: M }) => {
      let R = M in WM ? WM[M] : 'cerrar';
      R && s(R);
    }),
    n('ui:equip', ({ slot: M, item: R }) =>
      s(/weapon|arma|main|off|mano/.test(String(M || R?.slot || '')) ? 'equipar_arma' : 'equipar_ropa'),
    ),
    n('ui:sfx', ({ name: M, ...R }) => M && s(M, R)));
  function z(M) {
    (_(M),
      l.stealth &&
        !l.battle &&
        ((l.stealthT += M),
        l.stealthT > 3 &&
          l.stealthT - M <= 3 &&
          e.engine.musicName !== 'sigilo' &&
          e.music('sigilo', { fade: 3 })));
  }
  e.engine.onUpdate.add(z);
  function D(M = {}) {
    e.setVolumes({
      music: M.music,
      sfx: M.sfx,
      ambience: M.ambience,
      ui: M.ui ?? M.sfx,
      master: M.mute ? 0 : (M.master ?? 1),
    });
  }
  return (
    D(o.store?.settings),
    {
      state: l,
      step: b,
      levelMusic: d,
      onRulesEvent: w,
      onFx: k,
      dispose() {
        for (let M of a) M();
        (e.engine.onUpdate.delete(z), h(0.5));
      },
    }
  );
}
const yu = (o, e) => o + Math.random() * (e - o);
const yD = (o) => o[Math.floor(Math.random() * o.length)];
const gi = () => performance.now() / 1e3;
const UM = 1.5;
const um = { menu: 'menu', creator: 'relato', travel: 'viaje', ending: 'epilogo' };
const xD = {
  merrowick: {
    music: 'aldea_tarde',
    music_flags: { e1_done: 'aldea' },
    music_combat: 'combate',
    ambient: 'dusk',
  },
  elderhal: { music: 'bosque', music_combat: 'combate', ambient: 'forest' },
  kesh: { music: 'kesh', music_combat: 'combate', ambient: 'river' },
  tumulo: { music: 'tumulo', music_combat: 'tumulo', ambient: 'crypt' },
  posada: { music: 'posada', ambient: 'inn' },
};
const _D = { guardians: 'jefe' };
const gc = {
  dusk: {
    layers: [
      { id: 'atardecer', vol: 1 },
      { id: 'viento', vol: 0.35 },
    ],
    sprinkles: [{ id: 'cuervo', every: [16, 34] }],
  },
  day: {
    layers: [
      { id: 'dia', vol: 1 },
      { id: 'viento', vol: 0.3 },
    ],
    sprinkles: [{ id: 'cuervo', every: [22, 45] }],
  },
  forest: {
    layers: [
      { id: 'bosque', vol: 1 },
      { id: 'viento', vol: 0.45 },
    ],
    sprinkles: [
      { id: 'cuervo', every: [18, 40] },
      { id: 'lobo_aullido', every: [55, 110], vol: 0.6, far: !0, unless: 'wolves_dead' },
    ],
  },
  night: {
    layers: [
      { id: 'noche', vol: 1 },
      { id: 'viento', vol: 0.4 },
    ],
    sprinkles: [{ id: 'buho', every: [14, 32] }],
  },
  crypt: { layers: [{ id: 'cripta', vol: 1 }], sprinkles: [] },
  river: {
    layers: [
      { id: 'rio', vol: 0.85 },
      { id: 'viento', vol: 0.55 },
      { id: 'atardecer', vol: 0.35 },
    ],
    sprinkles: [{ id: 'cuervo', every: [20, 45] }],
  },
  inn: {
    layers: [
      { id: 'taberna', vol: 1 },
      { id: 'fuego', vol: 0.45 },
    ],
    sprinkles: [],
  },
};
const jM = {
  sheep: ['oveja', 7, 18],
  cow: ['vaca', 25, 55],
  horse: ['caballo', 30, 70],
  donkey: ['caballo', 40, 80],
  dog: ['perro', 30, 70],
};
const Bv = {
  paved: 'piedra',
  stone: 'piedra',
  cobble: 'piedra',
  slabs: 'piedra',
  path: 'tierra',
  dirt: 'tierra',
  road: 'tierra',
  mud: 'barro',
  grass: 'hierba',
  wood: 'madera',
  planks: 'madera',
  floor: 'madera',
  sand: 'tierra',
  water: 'agua',
};
const wD = {
  hierba: 'paso_hierba',
  tierra: 'paso_tierra',
  piedra: 'paso_piedra',
  madera: 'paso_madera',
  agua: 'paso_agua',
  barro: 'paso_agua',
};
const pm = {
  espada: 'espada_aire',
  ligera: 'ligera_aire',
  pesada: 'pesada_aire',
  contundente: 'contundente_aire',
  punetazo: 'punetazo_aire',
  natural: 'punetazo_aire',
};
const TD = {
  contundente: 'bludgeoning',
  punetazo: 'bludgeoning',
  natural: 'piercing',
  arco: 'piercing',
  ballesta: 'piercing',
  lanzar: 'piercing',
  honda: 'bludgeoning',
  ligera: 'slashing',
  espada: 'slashing',
  pesada: 'slashing',
};
const GM = {
  slashing: 'impacto_tajo',
  piercing: 'impacto_perforante',
  bludgeoning: 'impacto_contundente',
  fire: 'fuego_impacto',
  cold: 'hielo_impacto',
  lightning: 'rayo_impacto',
  thunder: 'trueno',
  acid: 'acido',
  poison: 'veneno',
  necrotic: 'necro_impacto',
  radiant: 'luz_impacto',
  psychic: 'mente',
  force: 'arcano_impacto',
};
const XM = { cast: 'magia_carga', launch: 'arcano_lanzar', impact: 'arcano_impacto', area: 'arcano_impacto' };
const Uv = {
  fire: { cast: 'fuego_carga', launch: 'fuego_lanzar', impact: 'fuego_impacto', area: 'fuego_explosion' },
  frost: { cast: 'hielo_carga', launch: 'hielo_lanzar', impact: 'hielo_impacto', area: 'hielo_explosion' },
  lightning: { cast: 'rayo_carga', launch: 'rayo_lanzar', impact: 'rayo_impacto', area: 'rayo_impacto' },
  thunder: { cast: 'magia_carga', launch: 'arcano_lanzar', impact: 'trueno', area: 'trueno' },
  radiant: { cast: 'luz_carga', launch: 'arcano_lanzar', impact: 'luz_impacto', area: 'luz_impacto' },
  necrotic: { cast: 'necro_carga', launch: 'arcano_lanzar', impact: 'necro_impacto', area: 'necro_impacto' },
  poison: { cast: 'magia_carga', launch: 'arcano_lanzar', impact: 'veneno', area: 'veneno' },
  acid: { cast: 'magia_carga', launch: 'arcano_lanzar', impact: 'acido', area: 'acido' },
  arcane: XM,
  psychic: { cast: 'magia_carga', launch: null, impact: 'mente', area: 'mente' },
  curse: { cast: 'necro_carga', launch: null, impact: 'maldicion', area: 'maldicion' },
  nature: { cast: 'magia_carga', launch: 'arcano_lanzar', impact: 'naturaleza', area: 'naturaleza' },
  heal: { cast: 'luz_carga', launch: null, impact: 'curacion', area: 'curacion' },
  buff: { cast: 'magia_carga', launch: null, impact: 'mejora', area: 'mejora' },
  sleep: { cast: 'magia_carga', launch: null, impact: 'sueno', area: 'sueno' },
  wind: { cast: 'magia_carga', launch: null, impact: 'viento_magico', area: 'viento_magico' },
  grease: { cast: 'magia_carga', launch: null, impact: 'grasa', area: 'grasa' },
  darkness: { cast: 'necro_carga', launch: null, impact: 'oscuridad', area: 'oscuridad' },
  faerie: { cast: 'magia_carga', launch: null, impact: 'aura', area: 'descubrir' },
};
for (let [o, e] of Object.entries({
  fire_cone: 'fire',
  shatter: 'thunder',
  moon: 'radiant',
  force: 'arcane',
  missile: 'arcane',
  eldritch: 'arcane',
  charm: 'psychic',
  command: 'psychic',
  mark: 'curse',
  web: 'nature',
  fog: 'wind',
  color: 'faerie',
  cold: 'frost',
}))
  Uv[o] = Uv[e];
const xu = (o) => Uv[o] || XM;
const VM = new Set(['arrow', 'bolt', 'dagger', 'javelin', 'dart', 'stone', 'physical']);
const MD = [
  [/^goblin/, 'trasgo'],
  [/^(wolf|mastiff|dog|jackal|hound)/, 'lobo'],
  [/^skeleton/, 'esqueleto'],
  [/^(zombie|ghoul)/, 'zombi'],
  [/^(wight|wraith|ghost|specter|spectre|vorhan)/, 'espectro'],
  [/spider/, 'arana'],
  [/^(bandit|cultist|guard|thug|soldier|human|noble|scout|veteran|acolyte|holt)/, 'humano'],
];
const ED = {
  trasgo: { ataque: 'trasgo_grito', dolor: 'trasgo_dolor', muerte: 'trasgo_muerte' },
  lobo: { ataque: 'lobo_grunido', dolor: 'lobo_dolor', muerte: 'lobo_muerte' },
  esqueleto: { ataque: 'esqueleto', dolor: 'impacto_hueso', muerte: 'esqueleto_muerte' },
  zombi: { ataque: 'zombi', dolor: 'zombi_dolor', muerte: 'zombi_muerte' },
  espectro: { ataque: 'espectro', dolor: 'espectro_dolor', muerte: 'espectro_muerte' },
  arana: { ataque: 'arana', dolor: 'arana_dolor', muerte: 'arana_muerte' },
  humano: { ataque: null, dolor: 'humano_dolor', muerte: 'humano_muerte' },
  bestia: { ataque: null, dolor: 'bestia_dolor', muerte: 'bestia_muerte' },
};
const SD = (o) => (String(o ?? '').includes('#') ? String(o).split('#')[0] : null);
const $M = {
  inventario: 'mochila',
  diario: 'libro_abrir',
  tienda: 'monedas',
  viaje: 'pagina',
  mapa: 'pagina',
  guardar: 'libro_abrir',
  cargar: 'libro_abrir',
  grupo: 'pagina',
  nivel: 'libro_abrir',
  botin: 'rebuscar',
  descanso: 'descanso',
  creador: 'libro_abrir',
  ajustes: 'abrir',
  pausa: 'abrir',
  dialogo: null,
  dialog: null,
};
const WM = {
  diario: 'libro_cerrar',
  guardar: 'libro_cerrar',
  cargar: 'libro_cerrar',
  nivel: 'libro_cerrar',
  creador: 'libro_cerrar',
  inventario: 'cerrar',
  dialogo: null,
  dialog: null,
};
const kD = {
  'ui:click': 'click',
  'ui:hover': 'hover',
  'ui:error': 'error',
  'ui:confirm': 'confirmar',
  'ui:back': 'atras',
  'ui:toggle': 'interruptor',
  'ui:tick': 'tic',
  'ui:select': 'seleccion',
  'ui:page': 'pagina',
  'ui:drop': 'soltar',
};

export { YM };
