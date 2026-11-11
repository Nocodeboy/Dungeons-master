// audio/reactions.js
// Reacciones sonoras a los eventos del bus del juego: música por escena, nivel, banderas, combate,
// sigilo, victoria y derrota; ambientes y emisores de cada nivel (hogueras, río, taberna, rebaños…)
// con sonidos sueltos al azar («sprinkles»); pasos según el suelo; combate a partir de los eventos
// del núcleo ('battle:event') y de los avisos de efectos visuales ('battle:fx'); objetos, cerraduras,
// trampas, botín, misiones e interfaz. Los nombres de sonido son los de datos/audio.json.
// Lo crea audio/index.js (createAudio) cuando hay bus.
// Reconstruido de publicado/juego.js (módulo __esm «KM»).

import { toPoint } from './engine.js';

/** Familia sonora de un arma (espada, ligera, pesada, contundente, arco, ballesta, honda, lanzar…). */
function weaponSoundClass(weapon = '', kind = 'melee') {
  let id = String(weapon).toLowerCase();
  return /crossbow/.test(id)
    ? 'ballesta'
    : /bow/.test(id)
      ? 'arco'
      : /sling/.test(id)
        ? 'honda'
        : kind === 'thrown' || /thrown|javelin|dart/.test(id)
          ? 'lanzar'
          : kind === 'ranged'
            ? 'arco'
            : /unarmed|fist|punch/.test(id)
              ? 'punetazo'
              : /bite|claw|slam|ram|hooves|tentacle|sting|gore|talon/.test(id)
                ? 'natural'
                : /great|maul|halberd|glaive|battleaxe|pike|lance/.test(id)
                  ? 'pesada'
                  : /club|mace|staff|hammer|flail|morningstar|war_pick/.test(id)
                    ? 'contundente'
                    : /dagger|knife|sickle|handaxe|shortsword|rapier|scimitar/.test(id)
                      ? 'ligera'
                      : 'espada';
}
/** Voz de criatura según el id de unidad («goblin_x#2» → trasgo); null si no es un monstruo. */
function creatureVoice(who) {
  let base = baseId(who);
  if (!base) return null;
  for (let [re, voice] of CREATURE_VOICES) if (re.test(base)) return voice;
  return 'bestia';
}
/** Carácter del terreno del nivel en una casilla. */
function terrainAt(level, cell) {
  return level?.rows?.[cell[1]]?.[cell[0]];
}
/** Superficie para los pasos (hierba, tierra, piedra, madera, agua, barro) en una casilla. */
function surfaceAt(level, cell) {
  if (!level || !cell) return 'tierra';
  for (let patch of level.paint || [])
    if (patch.cells?.some((c) => c[0] === cell[0] && c[1] === cell[1]))
      return GROUND_SURFACE[patch.ground] || 'tierra';
  let ch = terrainAt(level, cell);
  return ch === ',' || ch === 'b'
    ? 'hierba'
    : ch === ':'
      ? 'tierra'
      : ch === '=' || ch === 'x' || ch === 'P' || ch === 'S' || ch === 'g'
        ? 'piedra'
        : ch === 'w'
          ? 'agua'
          : ch === '~'
            ? 'barro'
            : ch === '.' || ch == null
              ? GROUND_SURFACE[level.ground?.['.']] ||
                (level.ambient === 'crypt'
                  ? 'piedra'
                  : level.floor
                    ? GROUND_SURFACE[level.floor] || 'madera'
                    : 'tierra')
              : 'tierra';
}
/** Casilla [col, fila] más cercana a un punto (inversa de toPoint). */
function pointToCell(at) {
  let p = toPoint(at);
  if (!p) return null;
  let row = Math.round(p.z / (0.8660254 * CELL_SIZE));
  return [Math.round(p.x / CELL_SIZE - 0.5 * (row & 1)), row];
}
/**
 * Suscribe las reacciones sonoras al bus de `game` usando la API `audio` de createAudio. Devuelve
 * { state, step, levelMusic, onRulesEvent, onFx, dispose }.
 */
function createReactions(game, audio) {
  let bus = game.bus,
    offs = [],
    listen = (event, fn) =>
      offs.push(
        bus.on(event, (data) => {
          try {
            fn(data || {});
          } catch (err) {
            console.error(`[sonido] ${event}`, err);
          }
        }),
      ),
    sfx = (id, opts) => audio.sfx(id, opts),
    later = (ms, fn) => setTimeout(fn, ms),
    flag = (name) => game.store?.flag?.(name),
    state = {
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
    levelInfo = (level) => ({ ...(LEVEL_SOUND[level?.id] || {}), ...(level || {}) });
  /** Música que toca ahora: la de la escena o la del nivel según sus banderas. */
  function levelMusic() {
    if (state.scene && state.scene !== 'explore' && SCENE_MUSIC[state.scene]) return SCENE_MUSIC[state.scene];
    let info = levelInfo(state.level || { id: state.levelId });
    for (let [flagName, track] of Object.entries(info.music_flags || {})) if (flag(flagName)) return track;
    return info.music || null;
  }
  /** Música de combate para un grupo de enemigos. */
  function combatMusic(group) {
    let info = levelInfo(state.level || { id: state.levelId });
    return (
      (info.groups || []).find((g) => g.id === group)?.music ||
      GROUP_MUSIC[group] ||
      info.music_combat ||
      'combate'
    );
  }
  function stopEmitters(fade = 2) {
    for (let em of state.emitters) em.stop(fade);
    ((state.emitters = []), (state.sprinkles = []));
  }
  function ambienceFor(info) {
    return info.ambience && AMBIENCE_PRESETS[info.ambience]
      ? AMBIENCE_PRESETS[info.ambience]
      : Array.isArray(info.ambience)
        ? { layers: info.ambience, sprinkles: [] }
        : /posada|inn|taberna/.test(info.id || '')
          ? AMBIENCE_PRESETS.inn
          : info.id === 'kesh'
            ? AMBIENCE_PRESETS.river
            : AMBIENCE_PRESETS[info.ambient] || AMBIENCE_PRESETS.day;
  }
  /** Ambiente, emisores y sonidos sueltos de un nivel; precarga los sonidos de combate. */
  function setupLevelSound(level) {
    stopEmitters(1.5);
    let info = levelInfo(level),
      amb = ambienceFor(info);
    (audio.ambience(amb.layers, { fade: 3 }),
      (state.sprinkles = amb.sprinkles.map((sp) => ({
        ...sp,
        t: randRange(sp.every[0] * 0.4, sp.every[1] * 0.6),
      }))));
    let layerIds = new Set(amb.layers.map((layer) => layer.id)),
      spots = game.explore?.world?.spots?.sounds || game.world?.spots?.sounds || null;
    if (spots?.length) {
      let byKind = {};
      for (let spot of spots) spot?.pos && (byKind[spot.kind] ||= []).push(spot.pos);
      let addEmitter = (id, points, opts) =>
        points?.length && state.emitters.push(audio.emitter(id, { points, ...opts }));
      (addEmitter('fuego', [...(byKind.fire || []), ...(byKind.forge || [])], {
        vol: 0.9,
        near: 1.5,
        far: 13,
      }),
        addEmitter('fuego', byKind.torch, { vol: 0.22, near: 0.8, far: 6 }),
        layerIds.has('rio') ||
          addEmitter('rio', [...(byKind.river || []), ...(byKind.watermill || [])], {
            vol: 0.42,
            near: 2,
            far: 14,
          }),
        addEmitter('rio', byKind.pond, { vol: 0.15, near: 1.5, far: 9 }),
        addEmitter('taberna', byKind.tavern, { vol: 0.45, near: 2, far: 12 }),
        byKind.blacksmith?.length &&
          state.sprinkles.push({
            id: 'yunque',
            every: [1.1, 3.5],
            cells: byKind.blacksmith,
            t: 1,
            near: 3,
            far: 20,
          }));
      let mills = [...(byKind.windmill || []), ...(byKind.watermill || [])];
      mills.length &&
        state.sprinkles.push({ id: 'molino', every: [2.5, 6], cells: mills, t: 2, near: 3, far: 22 });
    } else {
      let fires = [];
      for (let obj of info.objects || [])
        (obj.type === 'campfire' || /fire|hoguera|brasero|forge/.test(obj.id || '')) &&
          obj.cell &&
          fires.push(obj.cell);
      for (let decor of info.decor || [])
        /campfire|bonfire|brazier|hoguera|fogata|forge|hearth|chimenea/.test(decor.key || '') &&
          decor.cell &&
          fires.push(decor.cell);
      fires.length &&
        state.emitters.push(audio.emitter('fuego', { points: fires, vol: 0.9, near: 1.5, far: 13 }));
    }
    if (!spots?.length && !layerIds.has('rio') && info.rows) {
      let water = [];
      (info.rows.forEach((row, y) =>
        [...row].forEach((ch, x) => ch === 'w' && (x + y) % 2 === 0 && water.push([x, y])),
      ),
        water.length >= 4 &&
          state.emitters.push(audio.emitter('rio', { points: water, vol: 0.3, near: 2, far: 13 })));
    }
    let herds = {};
    for (let animal of info.animals || [])
      ANIMAL_SOUNDS[animal.kind] && animal.cell && (herds[animal.kind] ||= []).push(animal.cell);
    let flock = [...(herds.sheep || []), ...(herds.cow || [])];
    flock.length >= 3 &&
      state.emitters.push(audio.emitter('rebano', { points: flock, vol: 0.6, near: 3, far: 18 }));
    for (let [kind, cells] of Object.entries(herds)) {
      let [id, min, max] = ANIMAL_SOUNDS[kind];
      state.sprinkles.push({ id, every: [min, max], cells, t: randRange(min * 0.3, max * 0.5), animal: !0 });
    }
    audio.preload(['sfx:mundo']);
    let groups = info.groups || [],
      musicIds = new Set(
        [combatMusic(null), ...groups.map((g) => combatMusic(g.id))].map((track) => `music:${track}`),
      );
    (groups.length || info.id === 'merrowick') &&
      later(2500, () => audio.preload(['sfx:combate', 'sfx:criaturas', 'sfx:magia', ...musicIds]));
  }
  function updateSprinkles(dt) {
    if (state.battle || !state.sprinkles.length) return;
    let focus = audio.engine.listener.focus;
    for (let sp of state.sprinkles) {
      if (
        ((sp.t -= dt),
        sp.t > 0 || ((sp.t = randRange(sp.every[0], sp.every[1])), sp.unless && flag(sp.unless)))
      )
        continue;
      let at = null;
      if (sp.cells?.length) at = pick(sp.cells);
      else if (focus) {
        let dist = sp.far ? randRange(26, 40) : randRange(9, 22),
          angle = Math.random() * Math.PI * 2;
        at = [focus.x + Math.cos(angle) * dist, 2, focus.z + Math.sin(angle) * dist];
      }
      sfx(sp.id, {
        at,
        volume: sp.vol ?? 1,
        near: sp.near,
        far: typeof sp.far == 'number' ? sp.far : sp.far ? 60 : 40,
      });
    }
  }
  /** Paso (limitado a 7 por segundo y uno cada 0,18–0,24 s por quien camina). */
  function playStep({ at, cell, surface, run, who, volume = 1 } = {}) {
    let now = nowSeconds(),
      key = who ?? 'grupo';
    if (
      now - (state.lastStep.get(key) || 0) < (run ? 0.18 : 0.24) ||
      (now - state.stepWindow > 1 && ((state.stepWindow = now), (state.stepsThisSec = 0)),
      ++state.stepsThisSec > 7)
    )
      return;
    state.lastStep.set(key, now);
    let stepCell = cell || (at ? pointToCell(at) : null),
      ground = surface || surfaceAt(state.level, stepCell),
      sound = STEP_SOUND[ground] || 'paso_tierra';
    sfx(sound, {
      at: at || stepCell,
      volume: volume * (run ? 1.15 : 1) * (ground === 'barro' ? 0.7 : 1) * (state.stealth ? 0.45 : 1),
      rate: ground === 'barro' ? 0.82 : run ? 1.06 : 1,
    });
  }
  let posOf = (id, at) => at || (id != null ? state.lastPos.get(id) : null) || null;
  function creatureCry(who, kind, { chance = 1, delay = 0, at } = {}) {
    let voice = creatureVoice(who),
      sound = voice && VOICE_SOUNDS[voice][kind];
    !sound || Math.random() > chance || sfx(sound, { at: posOf(who, at), delay });
  }
  function impactSound(type, { target, at, crit, ranged, ac } = {}) {
    let sound = IMPACT_SOUND[type] || (ranged ? 'impacto_perforante' : 'impacto_tajo');
    sfx(sound, { at, volume: crit ? 1.15 : 1 });
    let physical = type === 'slashing' || type === 'piercing' || type === 'bludgeoning' || !type;
    (physical && creatureVoice(target) === 'esqueleto'
      ? sfx('impacto_hueso', { at, volume: 0.8 })
      : physical && ac >= 16 && sfx('impacto_metal', { at, volume: 0.45 }),
      crit && sfx('critico', { at, delay: 0.02 }));
  }
  function missSound(attack, at) {
    let wclass = weaponSoundClass(attack?.weapon, attack?.kind);
    if (attack?.kind === 'ranged' || attack?.kind === 'thrown' || SWING_SOUND[wclass] == null)
      return sfx('flecha_fallo', { at });
    if (attack?.natural === 1) return sfx('pifia', { at });
    (attack?.ac ?? 0) >= 15 && (attack?.natural ?? 0) >= 8 && wclass !== 'natural' && wclass !== 'punetazo'
      ? sfx('parada', { at })
      : sfx('fallo', { at, volume: 0.9 });
  }
  function shootSound(kind, at) {
    (kind === 'ballesta'
      ? (sfx('ballesta', { at }), sfx('arco', { at, rate: 0.82, volume: 0.8 }))
      : kind === 'lanzar' || kind === 'honda'
        ? sfx('lanzar', { at })
        : sfx('arco', { at }),
      state.battle && (state.battle.lastShoot = nowSeconds()));
  }
  /** Sonidos de un evento del núcleo de reglas (si no llegan avisos de efectos visuales). */
  function onRulesEvent(ev) {
    let battle = state.battle || (state.battle = newBattleState()),
      fxSeen = battle.fxSeen;
    switch (ev.t) {
      case 'attack': {
        if (
          (battle.pending.set(ev.who, { ...ev, t: nowSeconds() }),
          battle.lastAttackOn.set(ev.target, nowSeconds()),
          fxSeen)
        )
          break;
        let wclass = weaponSoundClass(ev.weapon, ev.kind),
          ranged = ev.kind === 'ranged' || ev.kind === 'thrown' || !SWING_SOUND[wclass],
          at = posOf(ev.who);
        if (String(ev.kind).includes('spell')) {
          sfx('magia_carga', { at });
          break;
        }
        (ranged ? shootSound(wclass, at) : sfx(SWING_SOUND[wclass], { at }),
          creatureCry(ev.who, 'ataque', { chance: 0.35 }),
          later(ranged ? 520 : 300, () => {
            ev.hit
              ? impactSound(WEAPON_DAMAGE[wclass], {
                  target: ev.target,
                  at: posOf(ev.target),
                  crit: ev.crit,
                  ranged,
                  ac: ev.ac,
                })
              : missSound(ev, posOf(ev.target));
          }));
        break;
      }
      case 'damage': {
        let recent =
          nowSeconds() - Math.max(battle.lastAttackOn.get(ev.who) || 0, battle.lastCast || 0) < 1.6;
        (!fxSeen &&
          !recent &&
          ev.amount > 0 &&
          impactSound(ev.type, { target: ev.who, at: posOf(ev.who), crit: ev.crit }),
          ev.amount > 0 && ev.hp > 0 && creatureCry(ev.who, 'dolor', { chance: 0.55, delay: 0.08 }));
        break;
      }
      case 'cast': {
        if (((battle.lastCast = nowSeconds()), fxSeen)) break;
        let sounds = styleSounds(ev.fx);
        (sfx(sounds.cast || 'magia_carga', { at: posOf(ev.who) }),
          later(650, () => {
            let target = (ev.targets || [])[0];
            ev.cells?.length
              ? sfx(sounds.area || sounds.impact, {})
              : sounds.impact && sfx(sounds.impact, { at: posOf(target) });
          }));
        break;
      }
      case 'missile':
        fxSeen ||
          (sfx('arcano_lanzar', { at: posOf(ev.who) }),
          later(380, () => sfx('arcano_impacto', { at: posOf(ev.target) })));
        break;
      case 'heal':
        !fxSeen && ev.amount > 0 && sfx('curacion', { at: posOf(ev.who) });
        break;
      case 'downed':
        sfx('caida', { at: posOf(ev.who) });
        break;
      case 'death': {
        let voice = creatureVoice(ev.who);
        (creatureCry(ev.who, 'muerte'),
          voice !== 'esqueleto' && voice !== 'espectro' && sfx('caida', { at: posOf(ev.who), delay: 0.35 }));
        break;
      }
      case 'death_save':
        sfx('dados', { volume: 0.6 });
        break;
      case 'revive':
        sfx('revivir', { at: posOf(ev.who) });
        break;
      case 'condition':
        ev.on && ev.cond === 'prone' && sfx('caida', { at: posOf(ev.who), volume: 0.8 });
        break;
      case 'item':
        (sfx('pocion_abrir', { at: posOf(ev.who) }), sfx('pocion_beber', { at: posOf(ev.who), delay: 0.4 }));
        break;
      case 'hide':
        sfx('sigilo_on', { at: posOf(ev.who) });
        break;
      case 'reveal':
        sfx('sigilo_off', { at: posOf(ev.who) });
        break;
      case 'shove':
      case 'push':
        sfx('empujon', { at: posOf(ev.who), volume: ev.t === 'push' ? 0.7 : 1 });
        break;
      case 'blocked':
        sfx('escudo', { at: posOf(ev.target || ev.who) });
        break;
      case 'immune':
        sfx('parada', { at: posOf(ev.who), volume: 0.6 });
        break;
      case 'reaction':
      case 'feature':
      case 'inspiration':
        fxSeen || sfx(ev.t === 'feature' ? 'mejora' : 'magia_carga', { at: posOf(ev.who), volume: 0.8 });
        break;
      case 'teleport':
        fxSeen || sfx('teletransporte', {});
        break;
      case 'summon':
        fxSeen || sfx('invocar', {});
        break;
      case 'round':
        ev.n > 1 && sfx('turno', { rate: 0.84, volume: 0.6 });
        break;
      case 'end':
        endBattleMusic(ev.winner === 0);
        break;
      default:
        break;
    }
  }
  /** Sonidos de un aviso del director de efectos visuales (vfx.onFx). */
  function onFx(fx) {
    let battle = state.battle || (state.battle = newBattleState());
    battle.fxSeen = !0;
    let at = fx.at;
    fx.who != null && at && state.lastPos.set(fx.who, at);
    let pending = fx.who != null ? battle.pending.get(fx.who) : null;
    switch (fx.kind) {
      case 'swing': {
        let wclass = weaponSoundClass(pending?.weapon ?? fx.weapon, pending?.kind);
        (sfx(SWING_SOUND[wclass] || 'espada_aire', { at }),
          creatureCry(fx.who, 'ataque', { chance: 0.35, at }),
          pending &&
            pending.hit === !1 &&
            later(110, () => missSound(pending, fx.target != null ? posOf(fx.target) : at)));
        break;
      }
      case 'shoot':
        shootSound(weaponSoundClass(pending?.weapon ?? fx.weapon, pending?.kind || 'ranged'), at);
        break;
      case 'launch':
        if (AMMO_STYLES.has(fx.style))
          nowSeconds() - (battle.lastShoot || 0) > 0.45 &&
            shootSound(fx.style === 'bolt' ? 'ballesta' : fx.style === 'arrow' ? 'arco' : 'lanzar', at);
        else {
          let launch = styleSounds(fx.style).launch;
          launch && sfx(launch, { at });
        }
        break;
      case 'impact': {
        let physical =
            !fx.type || fx.type === 'slashing' || fx.type === 'piercing' || fx.type === 'bludgeoning',
          last = fx.who != null ? pending : [...battle.pending.values()].sort((a, b) => b.t - a.t)[0];
        (physical
          ? impactSound(fx.type || 'slashing', {
              target: fx.target ?? last?.target,
              at,
              crit: fx.crit,
              ranged: last && last.kind !== 'melee',
              ac: last?.ac,
            })
          : (sfx(IMPACT_SOUND[fx.type] || styleSounds(fx.style).impact || 'arcano_impacto', {
              at,
              volume: fx.crit ? 1.15 : 1,
            }),
            fx.crit && sfx('critico', { at, volume: 0.7 })),
          (battle.lastImpact = nowSeconds()));
        break;
      }
      case 'whiff':
        AMMO_STYLES.has(fx.style) ? sfx('flecha_fallo', { at }) : sfx('fallo', { at, volume: 0.7 });
        break;
      case 'miss':
        missSound(pending, at);
        break;
      case 'cast':
        sfx(styleSounds(fx.style).cast || 'magia_carga', { at });
        break;
      case 'area': {
        let sounds = styleSounds(fx.style);
        sfx(sounds.area || sounds.impact || 'arcano_impacto', { at, volume: 1.1 });
        break;
      }
      case 'heal':
        sfx('curacion', { at });
        break;
      case 'crit':
        nowSeconds() - (battle.lastImpact || 0) > 0.2 && sfx('critico', { at });
        break;
      case 'shield':
        sfx('escudo_magico', { at });
        break;
      case 'teleport':
        sfx('teletransporte', { at });
        break;
      case 'summon':
        sfx(fx.token === 'flaming_sphere' ? 'fuego_lanzar' : 'invocar', { at });
        break;
      case 'shape':
        (sfx('mejora', { at }),
          /wolf|mastiff|dog/.test(String(fx.form || '')) && sfx('lobo_grunido', { at, delay: 0.35 }));
        break;
      case 'aura_on':
        sfx('aura', { at, volume: 0.8 });
        break;
      case 'zone_on': {
        let sound =
          {
            web: 'naturaleza',
            entangle: 'naturaleza',
            spike: 'naturaleza',
            fog: 'viento_magico',
            darkness: 'oscuridad',
            grease: 'grasa',
            moonbeam: 'luz_carga',
            moon: 'luz_carga',
          }[fx.zone || fx.style] || 'magia_carga';
        sfx(sound, { at, volume: 0.9 });
        break;
      }
      case 'step':
        playStep({ at, who: fx.who, run: fx.run, surface: fx.surface, volume: 0.85 });
        break;
      case 'death':
        break;
      default:
        break;
    }
  }
  function newBattleState() {
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
  /** Música de victoria (y luego la del nivel) o de derrota, una sola vez por combate. */
  function endBattleMusic(won) {
    let battle = state.battle;
    battle?.musicDone ||
      (battle && (battle.musicDone = !0),
      audio.unduck('combate'),
      won
        ? audio.music('victoria', { fade: 0.6, then: () => levelMusic() })
        : audio.music('derrota', { fade: 0.8 }));
  }
  (listen('settings:changed', ({ settings }) => applySettings(settings)),
    listen('scene:enter', ({ name, params }) => {
      ((state.scene = name),
        SCENE_MUSIC[name] &&
          (audio.music(SCENE_MUSIC[name], { fade: 2 }),
          name !== 'travel'
            ? audio.ambience(null, { fade: 2 })
            : audio.ambience([{ id: 'viento', vol: 0.5 }], { fade: 2 })),
        name === 'explore' && params?.level && !state.level && (state.levelId = params.level));
    }),
    listen('scene:leave', ({ name }) => {
      name === 'explore' && (stopEmitters(1.2), (state.level = null), (state.battle = null));
    }),
    listen('level:enter', ({ level }) => {
      let lvl =
        level && typeof level == 'object'
          ? level
          : game.explore?.level?.id === level || !level
            ? game.explore?.level
            : null;
      ((state.level = lvl || null),
        (state.levelId = lvl?.id || (typeof level == 'string' ? level : null)),
        (state.battle = null),
        (state.stealth = !1),
        setupLevelSound(state.level || { id: state.levelId }));
      let track = levelMusic();
      track && audio.music(track, { fade: 2.5 });
    }),
    listen('level:leave', () => {
      (stopEmitters(1.5), audio.ambience(null, { fade: 1.5 }));
    }),
    listen('flag:set', ({ name }) => {
      let info = levelInfo(state.level || { id: state.levelId });
      if (
        !state.battle &&
        !['victoria', 'derrota'].includes(audio.engine.musicName) &&
        info.music_flags &&
        name in info.music_flags
      ) {
        let track = levelMusic();
        track && audio.music(track, { fade: 3 });
      }
    }),
    listen('battle:start', ({ group, surprise }) => {
      ((state.battle = newBattleState()),
        audio.preload(['sfx:combate', 'sfx:criaturas', 'sfx:magia']),
        audio.music(combatMusic(group), { fade: surprise ? 0.4 : 0.8 }),
        audio.duck('combate', 1, { ambience: 0.5 }),
        sfx('desenvainar', {}),
        later(180, () => sfx('desenvainar', { volume: 0.8 })));
    }),
    listen('battle:turn', ({ isPc }) => {
      isPc && sfx('turno', { volume: 0.7 });
    }),
    listen('battle:event', ({ ev }) => ev && onRulesEvent(ev)),
    listen('battle:fx', (fx) => onFx(fx)),
    listen('battle:end', ({ won, fled }) => {
      if ((audio.unduck('combate'), fled)) {
        state.battle && (state.battle.musicDone = !0);
        let track = levelMusic();
        track && audio.music(track, { fade: 2 });
      } else endBattleMusic(!!won);
      ((state.battle = null), state.lastPos.clear());
    }),
    listen('dialog:open', ({ important }) =>
      audio.duck('dialogo', important ? 0.4 : 0.55, { ambience: 0.75 }),
    ),
    listen('dialog:close', () => audio.unduck('dialogo')));
  let rollSound = (ev) => {
    let roll = ev.roll || ev;
    (sfx('dados'),
      roll && roll.success != null && later(750, () => sfx(roll.success ? 'tirada_exito' : 'tirada_fallo')));
  };
  (listen('dialog:roll', rollSound),
    listen('ui:roll', rollSound),
    listen('interact', ({ object }) => {
      if (object)
        switch (object.type) {
          case 'door':
            !state.objectStateSeen &&
              !object.locked &&
              !object.lock &&
              sfx('puerta_abrir', { at: object.cell });
            break;
          case 'chest':
            !state.objectStateSeen &&
              !object.locked &&
              !object.lock &&
              sfx('cofre_abrir', { at: object.cell });
            break;
          case 'cache':
          case 'loot':
            sfx('rebuscar', { at: object.cell });
            break;
          case 'sign':
          case 'board':
            sfx('pagina', { at: object.cell });
            break;
          case 'stairs':
            for (let i = 0; i < 3; i++)
              sfx('paso_piedra', { delay: i * 0.28, volume: 0.8 - i * 0.15, force: !0 });
            break;
          case 'campfire':
            sfx('fuego_avivar', { at: object.cell });
            break;
          case 'rune':
            (sfx('runa', { at: object.cell }), sfx('runa_brillo', { at: object.cell, delay: 0.25 }));
            break;
          case 'seal':
            sfx('sello', { at: object.cell });
            break;
          case 'lever':
            sfx('palanca', { at: object.cell });
            break;
          default:
            break;
        }
    }),
    listen('object:state', ({ object, id, state: objState }) => {
      state.objectStateSeen = !0;
      let type = object?.type,
        cell = object?.cell;
      type === 'door'
        ? sfx(
            objState === 'open'
              ? /kesh|crypt|stone|piedra/.test(id || object?.id || '')
                ? 'losa'
                : 'puerta_abrir'
              : 'puerta_cerrar',
            { at: cell },
          )
        : type === 'chest'
          ? sfx(objState === 'open' ? 'cofre_abrir' : 'cofre_cerrar', { at: cell })
          : objState === 'revealed'
            ? sfx('descubrir', { at: cell })
            : objState === 'lit'
              ? sfx('fuego_avivar', { at: cell })
              : type === 'lever' || objState === 'on' || objState === 'off'
                ? sfx('palanca', { at: cell })
                : type === 'rune' && objState === 'active' && sfx('runa_brillo', { at: cell });
    }),
    listen('lock:opened', ({ object, how }) => {
      let cell = object?.cell,
        method = String(how || '');
      /force|break|bash|fuerza/.test(method)
        ? sfx('forzar', { at: cell })
        : /pick|tools|ganz/.test(method)
          ? (sfx('ganzua', { at: cell }),
            sfx('ganzua', { at: cell, delay: 0.45 }),
            sfx('cerradura', { at: cell, delay: 0.9 }))
          : /spell|knock|magic/.test(method)
            ? (sfx('magia_carga', { at: cell }), sfx('cerradura', { at: cell, delay: 0.5 }))
            : (sfx('llaves', { at: cell }), sfx('cerradura', { at: cell, delay: 0.4 }));
    }),
    listen('loot:taken', ({ items, gold }) => {
      (gold > 0 && (sfx('monedas'), sfx('monedas_recoger', { delay: 0.15 })),
        items?.length && sfx('objeto', { delay: gold > 0 ? 0.3 : 0 }));
    }),
    listen('hidden:found', ({ object }) => sfx('descubrir', { at: object?.cell })),
    listen('trap:triggered', ({ object }) => {
      let cell = object?.cell,
        kind = String(object?.trap || object?.kind || object?.effect || object?.id || '');
      (sfx('trampa_click', { at: cell }),
        /pit|foso|hoyo/.test(kind)
          ? sfx('caida', { at: cell, delay: 0.3 })
          : /blade|cuchilla|scythe|saw/.test(kind)
            ? sfx('trampa_cuchilla', { at: cell, delay: 0.12 })
            : /snare|lazo|net|red/.test(kind)
              ? sfx('chirrido', { at: cell, delay: 0.1 })
              : sfx('trampa_dardos', { at: cell, delay: 0.1 }));
    }),
    listen('trap:disarmed', ({ object }) => sfx('trampa_desarmar', { at: object?.cell })),
    listen('stealth:on', () => {
      ((state.stealth = !0), (state.stealthT = 0), sfx('sigilo_on'));
    }),
    listen('stealth:off', () => {
      if (((state.stealth = !1), sfx('sigilo_off'), audio.engine.musicName === 'sigilo' && !state.battle)) {
        let track = levelMusic();
        track && audio.music(track, { fade: 2.5 });
      }
    }),
    listen('spotted', () => sfx('desenvainar', { volume: 0.9 })),
    listen('step', (ev) => playStep(ev)),
    listen('rest:short', () => sfx('descanso')),
    listen('rest:long', () => {
      (sfx('descanso'),
        audio.duck('descanso', 0.15, { ambience: 0.6 }),
        later(6e3, () => audio.unduck('descanso')));
    }),
    listen('levelup', () => sfx('subir_nivel')),
    listen('quest:update', ({ state }) => {
      let text = String(state || '');
      /done|complete|cumplid|hecha|success/.test(text)
        ? sfx('mision_cumplida')
        : /fail|fallid|lost/.test(text)
          ? sfx('mision_fallida')
          : sfx('diario');
    }),
    listen('companion:join', () => sfx('confirmar')),
    listen('companion:leave', () => sfx('atras')),
    listen('gold', ({ delta }) => sfx(delta > 0 ? 'monedas_recoger' : 'monedas')),
    listen('item:gain', () => sfx('objeto', { volume: 0.8 })),
    listen('shop:buy', () => sfx('monedas')),
    listen('shop:sell', () => sfx('monedas')),
    listen('game:saved', ({ slot }) => slot !== 'auto' && sfx('guardar')));
  for (let [event, sound] of Object.entries(UI_EVENT_SOUND)) listen(event, () => sfx(sound));
  (listen('ui:open', ({ name }) => {
    let sound = name in UI_OPEN_SOUND ? UI_OPEN_SOUND[name] : 'abrir';
    sound && sfx(sound);
  }),
    listen('ui:close', ({ name }) => {
      let sound = name in UI_CLOSE_SOUND ? UI_CLOSE_SOUND[name] : 'cerrar';
      sound && sfx(sound);
    }),
    listen('ui:equip', ({ slot, item }) =>
      sfx(
        /weapon|arma|main|off|mano/.test(String(slot || item?.slot || '')) ? 'equipar_arma' : 'equipar_ropa',
      ),
    ),
    listen('ui:sfx', ({ name, ...opts }) => name && sfx(name, opts)));
  function tick(dt) {
    (updateSprinkles(dt),
      state.stealth &&
        !state.battle &&
        ((state.stealthT += dt),
        state.stealthT > 3 &&
          state.stealthT - dt <= 3 &&
          audio.engine.musicName !== 'sigilo' &&
          audio.music('sigilo', { fade: 3 })));
  }
  audio.engine.onUpdate.add(tick);
  function applySettings(settings = {}) {
    audio.setVolumes({
      music: settings.music,
      sfx: settings.sfx,
      ambience: settings.ambience,
      ui: settings.ui ?? settings.sfx,
      master: settings.mute ? 0 : (settings.master ?? 1),
    });
  }
  return (
    applySettings(game.store?.settings),
    {
      state,
      step: playStep,
      levelMusic,
      onRulesEvent,
      onFx,
      dispose() {
        for (let off of offs) off();
        (audio.engine.onUpdate.delete(tick), stopEmitters(0.5));
      },
    }
  );
}
/** Número al azar en [min, max). */
const randRange = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const nowSeconds = () => performance.now() / 1e3;
// Tamaño de casilla en metros (el mismo que HEX_SIZE de explore/hex.js).
const CELL_SIZE = 1.5;
// Música fija de cada escena (exploración depende del nivel).
const SCENE_MUSIC = { menu: 'menu', creator: 'relato', travel: 'viaje', ending: 'epilogo' };
// Música, música por banderas, música de combate y ambiente de cada nivel.
const LEVEL_SOUND = {
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
const GROUP_MUSIC = { guardians: 'jefe' };
// Capas de ambiente y sonidos sueltos (`every`: intervalo en s) de cada tipo de ambiente.
const AMBIENCE_PRESETS = {
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
// Sonido e intervalo [mín, máx] de cada animal.
const ANIMAL_SOUNDS = {
  sheep: ['oveja', 7, 18],
  cow: ['vaca', 25, 55],
  horse: ['caballo', 30, 70],
  donkey: ['caballo', 40, 80],
  dog: ['perro', 30, 70],
};
const GROUND_SURFACE = {
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
const STEP_SOUND = {
  hierba: 'paso_hierba',
  tierra: 'paso_tierra',
  piedra: 'paso_piedra',
  madera: 'paso_madera',
  agua: 'paso_agua',
  barro: 'paso_agua',
};
const SWING_SOUND = {
  espada: 'espada_aire',
  ligera: 'ligera_aire',
  pesada: 'pesada_aire',
  contundente: 'contundente_aire',
  punetazo: 'punetazo_aire',
  natural: 'punetazo_aire',
};
const WEAPON_DAMAGE = {
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
const IMPACT_SOUND = {
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
const ARCANE_SOUNDS = {
  cast: 'magia_carga',
  launch: 'arcano_lanzar',
  impact: 'arcano_impacto',
  area: 'arcano_impacto',
};
// Sonidos de cast/launch/impact/area de cada estilo de efecto (más los alias de abajo).
const STYLE_SOUNDS = {
  fire: { cast: 'fuego_carga', launch: 'fuego_lanzar', impact: 'fuego_impacto', area: 'fuego_explosion' },
  frost: { cast: 'hielo_carga', launch: 'hielo_lanzar', impact: 'hielo_impacto', area: 'hielo_explosion' },
  lightning: { cast: 'rayo_carga', launch: 'rayo_lanzar', impact: 'rayo_impacto', area: 'rayo_impacto' },
  thunder: { cast: 'magia_carga', launch: 'arcano_lanzar', impact: 'trueno', area: 'trueno' },
  radiant: { cast: 'luz_carga', launch: 'arcano_lanzar', impact: 'luz_impacto', area: 'luz_impacto' },
  necrotic: { cast: 'necro_carga', launch: 'arcano_lanzar', impact: 'necro_impacto', area: 'necro_impacto' },
  poison: { cast: 'magia_carga', launch: 'arcano_lanzar', impact: 'veneno', area: 'veneno' },
  acid: { cast: 'magia_carga', launch: 'arcano_lanzar', impact: 'acido', area: 'acido' },
  arcane: ARCANE_SOUNDS,
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
for (let [alias, base] of Object.entries({
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
  STYLE_SOUNDS[alias] = STYLE_SOUNDS[base];
const styleSounds = (style) => STYLE_SOUNDS[style] || ARCANE_SOUNDS;
const AMMO_STYLES = new Set(['arrow', 'bolt', 'dagger', 'javelin', 'dart', 'stone', 'physical']);
// Patrón del id de criatura → voz.
const CREATURE_VOICES = [
  [/^goblin/, 'trasgo'],
  [/^(wolf|mastiff|dog|jackal|hound)/, 'lobo'],
  [/^skeleton/, 'esqueleto'],
  [/^(zombie|ghoul)/, 'zombi'],
  [/^(wight|wraith|ghost|specter|spectre|vorhan)/, 'espectro'],
  [/spider/, 'arana'],
  [/^(bandit|cultist|guard|thug|soldier|human|noble|scout|veteran|acolyte|holt)/, 'humano'],
];
const VOICE_SOUNDS = {
  trasgo: { ataque: 'trasgo_grito', dolor: 'trasgo_dolor', muerte: 'trasgo_muerte' },
  lobo: { ataque: 'lobo_grunido', dolor: 'lobo_dolor', muerte: 'lobo_muerte' },
  esqueleto: { ataque: 'esqueleto', dolor: 'impacto_hueso', muerte: 'esqueleto_muerte' },
  zombi: { ataque: 'zombi', dolor: 'zombi_dolor', muerte: 'zombi_muerte' },
  espectro: { ataque: 'espectro', dolor: 'espectro_dolor', muerte: 'espectro_muerte' },
  arana: { ataque: 'arana', dolor: 'arana_dolor', muerte: 'arana_muerte' },
  humano: { ataque: null, dolor: 'humano_dolor', muerte: 'humano_muerte' },
  bestia: { ataque: null, dolor: 'bestia_dolor', muerte: 'bestia_muerte' },
};
const baseId = (id) => (String(id ?? '').includes('#') ? String(id).split('#')[0] : null);
// Sonidos al abrir y cerrar cada pantalla (null = ninguno).
const UI_OPEN_SOUND = {
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
const UI_CLOSE_SOUND = {
  diario: 'libro_cerrar',
  guardar: 'libro_cerrar',
  cargar: 'libro_cerrar',
  nivel: 'libro_cerrar',
  creador: 'libro_cerrar',
  inventario: 'cerrar',
  dialogo: null,
  dialog: null,
};
const UI_EVENT_SOUND = {
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

export { createReactions };
