// explore/checks.js — Reglas de la exploración (ExploreRules): pruebas de característica, habilidad,
// salvación y herramientas, pasivas, daño, objetos, oro, monstruos y botín. Llama al núcleo de reglas
// (check, group_check, passive, best, cp_damage, cp_give, cp_gold, has_item, item_info, data…) y, si
// una operación no existe, la recuerda y usa un sustituto en JS con las tablas de este módulo.
// También rollDice («2d6+1») y las etiquetas de habilidades. Lo usan explore/index.js, battle.js y
// detection.js.
// Reconstruido de publicado/juego.js (módulo __esm «Mu»).

/** Tira una expresión de dados «NdM±K» (o un número); nunca devuelve menos de 0. */
function rollDice(expr, rng = Math.random) {
  let text = String(expr ?? '0').replace(/\s+/g, ''),
    m = /^(\d*)d(\d+)([+-]\d+)?$/.exec(text);
  if (!m) return Number(text) || 0;
  let count = Number(m[1] || 1),
    sides = Number(m[2]),
    total = Number(m[3] || 0);
  for (let i = 0; i < count; i++) total += 1 + Math.floor(rng() * sides);
  return Math.max(0, total);
}
/** Generador pseudoaleatorio con semilla (mulberry32) en [0, 1). */
function seededRng(seed) {
  return () => {
    ((seed |= 0), (seed = (seed + 1831565813) | 0));
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    return ((x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x), ((x ^ (x >>> 14)) >>> 0) / 4294967296);
  };
}
/** Característica de cada habilidad (para los modificadores del sustituto). */
const SKILL_ABILITY = {
  athletics: 'str',
  acrobatics: 'dex',
  sleight_of_hand: 'dex',
  stealth: 'dex',
  arcana: 'int',
  history: 'int',
  investigation: 'int',
  nature: 'int',
  religion: 'int',
  animal_handling: 'wis',
  insight: 'wis',
  medicine: 'wis',
  perception: 'wis',
  survival: 'wis',
  deception: 'cha',
  intimidation: 'cha',
  performance: 'cha',
  persuasion: 'cha',
};
/** Nombres en español de las habilidades y herramientas. */
const SKILL_LABELS = {
  athletics: 'Atletismo',
  acrobatics: 'Acrobacias',
  sleight_of_hand: 'Juego de manos',
  stealth: 'Sigilo',
  arcana: 'Arcanos',
  history: 'Historia',
  investigation: 'Investigaci\xF3n',
  nature: 'Naturaleza',
  religion: 'Religi\xF3n',
  animal_handling: 'Trato con animales',
  insight: 'Perspicacia',
  medicine: 'Medicina',
  perception: 'Percepci\xF3n',
  survival: 'Supervivencia',
  deception: 'Enga\xF1o',
  intimidation: 'Intimidaci\xF3n',
  performance: 'Interpretaci\xF3n',
  persuasion: 'Persuasi\xF3n',
  thieves_tools: 'Herramientas de ladr\xF3n',
};
const ABILITY_LABELS = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constituci\xF3n',
  int: 'Inteligencia',
  wis: 'Sabidur\xEDa',
  cha: 'Carisma',
};
/** Dado de golpe por clase (para estimar los PG máximos). */
const HIT_DIE = {
  barbarian: 12,
  fighter: 10,
  paladin: 10,
  ranger: 10,
  bard: 8,
  cleric: 8,
  druid: 8,
  monk: 8,
  rogue: 8,
  warlock: 8,
  sorcerer: 6,
  wizard: 6,
};
/** Salvaciones competentes por clase. */
const SAVE_PROFICIENCIES = {
  barbarian: ['str', 'con'],
  bard: ['dex', 'cha'],
  cleric: ['wis', 'cha'],
  druid: ['int', 'wis'],
  fighter: ['str', 'con'],
  monk: ['str', 'dex'],
  paladin: ['wis', 'cha'],
  ranger: ['str', 'dex'],
  rogue: ['dex', 'int'],
  sorcerer: ['con', 'cha'],
  warlock: ['wis', 'cha'],
  wizard: ['int', 'wis'],
};
/** Datos mínimos de monstruos (percepción pasiva, sigilo, tamaño, botín) si el núcleo no los da. */
const FALLBACK_MONSTERS = {
  goblin_minion: {
    name: 'Trasgo esbirro',
    pp: 9,
    stealth: 6,
    size: 'small',
    drops: [
      { id: 'gold', n: '1d4', chance: 0.7 },
      { id: 'goblin_charm', n: 1, chance: 0.25 },
    ],
  },
  goblin_warrior: {
    name: 'Trasgo guerrero',
    pp: 9,
    stealth: 6,
    size: 'small',
    drops: [
      { id: 'gold', n: '1d6', chance: 0.8 },
      { id: 'scimitar', n: 1, chance: 0.25 },
    ],
  },
  goblin_archer: {
    name: 'Trasgo arquero',
    pp: 10,
    stealth: 6,
    size: 'small',
    drops: [
      { id: 'gold', n: '1d4', chance: 0.7 },
      { id: 'arrows', n: 1, chance: 0.35 },
    ],
  },
  goblin_boss: {
    name: 'Grisk, cabecilla',
    pp: 9,
    stealth: 6,
    size: 'small',
    drops: [
      { id: 'gold', n: '3d6', chance: 1 },
      { id: 'key_cache', n: 1, chance: 1 },
      { id: 'potion_healing', n: 1, chance: 0.5 },
    ],
  },
  goblin_shaman: {
    name: 'Trasgo cham\xE1n',
    pp: 10,
    stealth: 6,
    size: 'small',
    drops: [{ id: 'gold', n: '1d6', chance: 0.8 }],
  },
  wolf: { name: 'Lobo', pp: 15, stealth: 4, size: 'medium', drops: [{ id: 'wolf_pelt', n: 1, chance: 0.5 }] },
  skeleton: {
    name: 'Esqueleto',
    pp: 9,
    stealth: 0,
    size: 'medium',
    drops: [{ id: 'coin_durn', n: 1, chance: 0.35 }],
  },
  skeleton_archer: {
    name: 'Esqueleto arquero',
    pp: 10,
    stealth: 0,
    size: 'medium',
    drops: [{ id: 'coin_durn', n: 1, chance: 0.35 }],
  },
  zombie: { name: 'Zombi', pp: 8, stealth: 0, size: 'medium', drops: [] },
  wight: {
    name: 'Vorhan, el guardi\xE1n',
    pp: 13,
    stealth: 4,
    size: 'medium',
    drops: [
      { id: 'gold', n: '2d10', chance: 1 },
      { id: 'coin_durn', n: 3, chance: 1 },
    ],
  },
  giant_spider: { name: 'Ara\xF1a gigante', pp: 14, stealth: 7, size: 'large', drops: [] },
  swarm_of_rats: { name: 'Enjambre de ratas', pp: 10, stealth: 0, size: 'medium', drops: [] },
  mastiff: { name: 'Mast\xEDn', pp: 15, stealth: 0, size: 'medium', drops: [] },
};
/** Nombres de objetos si el núcleo no responde a item_info. */
const ITEM_NAMES = {
  gold: 'Oro',
  potion_healing: 'Poci\xF3n de curaci\xF3n',
  potion_greater_healing: 'Poci\xF3n de curaci\xF3n mayor',
  rope: 'Cuerda',
  bolts: 'Virotes',
  arrows: 'Flechas',
  scroll_cure_wounds: 'Pergamino de Curar heridas',
  scroll_bless: 'Pergamino de Bendici\xF3n',
  scroll_web: 'Pergamino de Telara\xF1a',
  coin_durn: 'Moneda durn',
  torch: 'Antorcha',
  rations: 'Raciones',
  holy_symbol: 'S\xEDmbolo sagrado',
  gloves_thievery: 'Guantes de latrocinio',
  periapt_wound_closure: 'Amuleto de cierre de heridas',
  gem_quartz: 'Cuarzo',
  gem_garnet: 'Granate',
  gem_agate: '\xC1gata',
  durn_tablet: 'Tablilla durn',
  shortbow_p1: 'Arco corto +1',
  shield_p1: 'Escudo +1',
  goblin_charm: 'Amuleto trasgo',
  wolf_pelt: 'Piel de lobo',
  key_cache: 'Llave oxidada',
  key_mill: 'Llave del molino',
  scimitar: 'Cimitarra',
  thieves_tools: 'Herramientas de ladr\xF3n',
  crowbar: 'Palanca',
  healers_kit: 'Kit de curandero',
};
const rollD20 = (rng) => 1 + Math.floor(rng() * 20);
/**
 * Reglas de exploración sobre la campaña activa (`game.store.cp`). Con ?semilla=N las tiradas del
 * sustituto son reproducibles.
 */
const ExploreRules = class {
  constructor(game) {
    ((this.game = game), (this.missing = new Set()), (this.used = new Set()));
    let seed = Number(game.params?.get?.('semilla'));
    ((this.rng = Number.isFinite(seed) && seed ? seededRng(seed) : Math.random),
      (this.summaryCache = null),
      game.bus?.on?.('cp:changed', () => (this.summaryCache = null)));
  }
  get cp() {
    return this.game.store.cp;
  }
  /** Llama a una operación del núcleo; null si falla o no existe (y no la vuelve a intentar). */
  call(op, args = {}) {
    if (this.missing.has(op) || typeof this.game.rules != 'function') return null;
    let res;
    try {
      res = this.game.rules(op, args);
    } catch (err) {
      return (console.warn(`[exploraci\xF3n] ${op}:`, err), null);
    }
    return res && res.error && /op desconocida|sin combate|desconocid/i.test(String(res.error))
      ? (this.missing.add(op), null)
      : (res && res.error && console.warn(`[exploraci\xF3n] ${op}: ${res.error}`), res);
  }
  /** Anota en consola (una vez por operación) que se usa el sustituto en JS. */
  fallback(op) {
    this.used.has(op) || (this.used.add(op), console.info(`[exploraci\xF3n] sustituto en JS: ${op}`));
  }
  /** Si la respuesta trae campaña (`cp`), la guarda en el almacén. */
  apply(res) {
    return (res?.cp && !res.cp.error && this.game.store.set(res.cp), res);
  }
  sheet(id) {
    return this.cp?.members?.[id] || {};
  }
  state(id) {
    let cp = this.cp;
    return cp ? ((cp.state ??= {}), (cp.state[id] ??= {}), cp.state[id]) : {};
  }
  name(id) {
    return this.sheet(id).name || id;
  }
  /** Nombre corto de un miembro («Maese Odvar…» → «Odvar Stonebrow», si no el primer nombre). */
  shortName(id) {
    let full = this.name(id);
    return full.startsWith('Maese ') ? full.slice(6) : full.split(' ')[0];
  }
  /** Ids de los miembros del grupo que no han muerto. */
  alive() {
    return (this.cp?.party || []).filter((id) => !this.state(id).dead);
  }
  level() {
    return this.cp?.party_level || 1;
  }
  /** Bonificador de competencia según el nivel del grupo. */
  prof() {
    return 2 + Math.floor((this.level() - 1) / 4);
  }
  abilityMod(id, ability) {
    let sheet = this.sheet(id),
      score = sheet.final_abilities?.[ability] ?? sheet.abilities?.[ability] ?? 10;
    return Math.floor((score - 10) / 2);
  }
  /** Modificador de habilidad: el del resumen del núcleo o uno calculado (competencia, pericia, sentidos agudos). */
  skillMod(id, skill) {
    let entry = this.summary(id)?.skills?.find?.((s) => s.id === skill);
    if (entry) return entry.mod;
    let sheet = this.sheet(id),
      ability = SKILL_ABILITY[skill] || 'wis',
      mod = this.abilityMod(id, ability),
      skills = sheet.skills || [],
      keenSenses = skill === 'perception' && (sheet.species === 'elf' || /elf/.test(sheet.lineage || ''));
    return (
      (skills.includes(skill) || keenSenses) && (mod += this.prof()),
      (sheet.expertise || []).includes(skill) && (mod += this.prof()),
      mod
    );
  }
  saveMod(id, ability) {
    let sum = this.summary(id);
    if (sum?.abilities?.[ability]?.save !== void 0) return sum.abilities[ability].save;
    let sheet = this.sheet(id),
      mod = this.abilityMod(id, ability);
    return ((SAVE_PROFICIENCIES[sheet.class] || []).includes(ability) && (mod += this.prof()), mod);
  }
  /** Modificador con herramientas (de ladrón: competencia del pícaro/criminal y +5 con guantes de latrocinio). */
  toolMod(id, tool) {
    let sheet = this.sheet(id),
      mod = this.abilityMod(id, 'dex');
    return (
      tool === 'thieves_tools' &&
        (sheet.class === 'rogue' || sheet.background === 'criminal' || (sheet.tools || []).includes(tool)) &&
        (mod += this.prof()),
      this.count(id, 'gloves_thievery') > 0 && (mod += 5),
      mod
    );
  }
  /** Resumen del miembro según party_summary (en caché hasta el siguiente «cp:changed»). */
  summary(id) {
    if (!this.summaryCache) {
      let res = this.cp ? this.call('party_summary', { cp: this.cp }) : null;
      this.summaryCache = new Map();
      let list = Array.isArray(res) ? res : res?.party || res?.members || [];
      for (let entry of list) entry?.id && this.summaryCache.set(entry.id, entry);
    }
    return this.summaryCache.get(id) || null;
  }
  /** PG actuales, máximos y temporales de un miembro. */
  hp(id) {
    let st = this.state(id),
      max = this.summary(id)?.max_hp ?? st.max_hp ?? this.maxHpGuess(id);
    return { hp: st.hp ?? max, max, temp: st.temp_hp || 0 };
  }
  maxHpGuess(id) {
    let sheet = this.sheet(id),
      die = HIT_DIE[sheet.class] || 8,
      conMod = this.abilityMod(id, 'con'),
      level = this.level();
    return Math.max(1, die + conMod + (level - 1) * (die / 2 + 1 + conMod));
  }
  /** Puntuación pasiva de cada miembro vivo: {id: valor}. */
  passive(skill = 'perception') {
    let cp = this.cp,
      res = cp ? this.call('passive', { cp, skill }) : null;
    if (res && !res.error && typeof res == 'object') return res;
    this.fallback('passive');
    let out = {};
    for (let id of this.alive()) out[id] = 10 + this.skillMod(id, skill);
    return out;
  }
  /** El miembro con mejor modificador para una habilidad, característica o herramienta: {who, mod}. */
  best(what) {
    let cp = this.cp,
      res = cp
        ? this.call(
            'best',
            what === 'thieves_tools'
              ? { cp, tool: what }
              : SKILL_ABILITY[what]
                ? { cp, skill: what }
                : { cp, ability: what },
          )
        : null;
    if (res && !res.error && res.who) return res;
    let top = null;
    for (let id of this.alive()) {
      let mod =
        what === 'thieves_tools'
          ? this.toolMod(id, what)
          : SKILL_ABILITY[what]
            ? this.skillMod(id, what)
            : this.abilityMod(id, what);
      (!top || mod > top.mod) && (top = { who: id, mod });
    }
    return top || { who: null, mod: 0 };
  }
  /**
   * Prueba individual. `req`: {who, skill|ability|save|tool, dc, adv, dis}; `who` puede ser «best».
   * Devuelve {who, label, d20, mod, total, dc, success, crit, text}.
   */
  check(req) {
    let cp = this.cp,
      args = { cp, ...req };
    if (cp) {
      let res = this.call('check', args);
      if (res && !res.error && res.total !== void 0) return res;
    }
    this.fallback('check');
    let who = req.who,
      what = req.tool || req.skill || req.save || req.ability;
    (!who || who === 'best') && (who = this.best(what).who || this.alive()[0]);
    let mod, label;
    req.tool
      ? ((mod = this.toolMod(who, req.tool)), (label = SKILL_LABELS[req.tool] || req.tool))
      : req.skill
        ? ((mod = this.skillMod(who, req.skill)), (label = SKILL_LABELS[req.skill] || req.skill))
        : req.save
          ? ((mod = this.saveMod(who, req.save)),
            (label = `Salvaci\xF3n de ${ABILITY_LABELS[req.save] || req.save}`))
          : ((mod = this.abilityMod(who, req.ability)), (label = ABILITY_LABELS[req.ability] || req.ability));
    let first = rollD20(this.rng),
      rolls = [first],
      kept = first;
    req.adv && !req.dis
      ? (rolls.push(rollD20(this.rng)), (kept = Math.max(...rolls)))
      : req.dis && !req.adv && (rolls.push(rollD20(this.rng)), (kept = Math.min(...rolls)));
    let total = kept + mod,
      dc = req.dc ?? null,
      success = dc == null ? !0 : total >= dc;
    return {
      who,
      label,
      d20: rolls,
      mod,
      total,
      dc,
      success,
      crit: kept === 20,
      text: `${this.shortName(who)}: ${label} ${total}${dc != null ? ` contra CD ${dc}` : ''}`,
    };
  }
  /** Prueba de grupo (éxito si al menos la mitad supera la CD); sigilo con desventaja en armadura pesada. */
  groupCheck(skill, dc) {
    let cp = this.cp,
      res = cp ? this.call('group_check', { cp, skill, dc }) : null;
    if (res && !res.error && Array.isArray(res.results)) return res;
    this.fallback('group_check');
    let results = this.alive().map((id) => {
        let sheet = this.sheet(id),
          heavyArmor =
            skill === 'stealth' && ['chain_mail', 'splint', 'plate', 'ring_mail'].includes(sheet.armor);
        return this.check({ who: id, skill, dc, dis: heavyArmor });
      }),
      passed = results.filter((r) => r.success).length;
    return { results, success: passed * 2 >= results.length };
  }
  /** Daño fuera de combate (trampas…). El sustituto nunca deja a nadie por debajo de 1 PG. */
  damage(id, amount, type = 'piercing') {
    let cp = this.cp,
      res = cp ? this.call('cp_damage', { cp, id, amount, type }) : null;
    if (res && !res.error && res.cp) return (this.apply(res), res);
    this.fallback('cp_damage');
    let st = this.state(id),
      { hp, max } = this.hp(id),
      left = amount,
      absorbed = Math.min(st.temp_hp || 0, left);
    return (
      (st.temp_hp = (st.temp_hp || 0) - absorbed),
      (left -= absorbed),
      (st.hp = Math.max(1, hp - left)),
      (st.max_hp ??= max),
      this.game.store.set(cp),
      { hp: st.hp, down: !1, dead: !1 }
    );
  }
  /** Unidades de un objeto que lleva un miembro. */
  count(id, item) {
    let sheet = this.sheet(id),
      n = Number(sheet.items?.[item] || 0);
    for (let entry of sheet.pack || []) entry.id === item && (n += Number(entry.n || 1));
    return (item === 'thieves_tools' && n === 0 && (sheet.kit?.items || []).includes?.(item) && (n = 1), n);
  }
  /** Quién del grupo (vivo) lleva el objeto; las herramientas de ladrón se suponen en el pícaro. */
  holder(item) {
    let cp = this.cp,
      res = cp ? this.call('has_item', { cp, item }) : null;
    if (res && !res.error && 'who' in res) {
      let who =
        (res.holders || []).find((h) => !h.dead && this.alive().includes(h.id))?.id ||
        (res.who && this.alive().includes(res.who) ? res.who : null);
      if (who || item !== 'thieves_tools') return who;
    } else for (let id of this.alive()) if (this.count(id, item) > 0) return id;
    if (item === 'thieves_tools') {
      for (let id of this.alive())
        if (this.sheet(id).class === 'rogue' || this.sheet(id).background === 'criminal') return id;
    }
    return null;
  }
  /** Da un objeto al grupo (o a `to`) y emite «item:gain»; devuelve quién lo recibe. */
  give(item, count = 1, unid = !1, to = void 0) {
    let cp = this.cp;
    if (!cp) return null;
    if (item === 'gold') return (this.gold(count), null);
    let res = this.call('cp_give', { cp, item, n: count, unid, to });
    if (res && !res.error && res.cp)
      return (
        this.apply(res),
        this.game.bus.emit('item:gain', { id: item, n: count, who: res.who }),
        res.who
      );
    this.fallback('cp_give');
    let who = to || this.alive()[0] || 'hero',
      sheet = cp.members[who] || (cp.members[who] = {});
    return (
      (sheet.items ??= {}),
      (sheet.items[item] = (sheet.items[item] || 0) + count),
      this.game.store.set(cp),
      this.game.bus.emit('item:gain', { id: item, n: count, who }),
      who
    );
  }
  /** Suma o resta oro; false si no alcanza. Emite «gold». */
  gold(delta) {
    let cp = this.cp;
    if (!cp) return !1;
    let res = this.call('cp_gold', { cp, delta });
    return res && !res.error && res.cp
      ? (this.apply(res), res.ok !== !1 && this.game.bus.emit('gold', { delta }), res.ok !== !1)
      : (this.fallback('cp_gold'),
        (cp.gold || 0) + delta < 0
          ? !1
          : ((cp.gold = (cp.gold || 0) + delta),
            this.game.store.set(cp),
            this.game.bus.emit('gold', { delta }),
            !0));
  }
  /** Ficha del objeto según item_info (en caché). */
  info(id) {
    if (((this._info ??= new Map()), !this._info.has(id))) {
      let res = this.call('item_info', { id });
      this._info.set(id, res && !res.error ? res : null);
    }
    return this._info.get(id);
  }
  itemName(id) {
    let info = this.info(id);
    return info?.name ? info.name : ITEM_NAMES[id] || id.replace(/_/g, ' ');
  }
  /** ¿Se recibe sin identificar? (objetos mágicos de equipo). */
  unidentified(id) {
    let info = this.info(id);
    return info
      ? !!(info.magic && ['weapon', 'armor', 'shield', 'wondrous'].includes(info.kind))
      : /_p1$|^cloak_|^ring_|^boots_|^gloves_|^gauntlets_|^bracers_|^periapt_|^amulet_|^brooch_|^stone_/.test(
          id,
        );
  }
  /** Datos de exploración de un monstruo: nombre, percepción pasiva, sigilo, tamaño y botín. */
  monster(id) {
    if (!this._monsters) {
      let res = this.call('data', { name: 'monsters' });
      this._monsters = res && !res.error && typeof res == 'object' ? res : null;
    }
    let m = this._monsters?.[id];
    return m
      ? {
          name: m.name,
          pp: m.passive_perception ?? 10,
          stealth: m.skills?.stealth ?? 0,
          size: m.size,
          drops: m.drops || [],
          hp: m.hp,
          ac: m.ac,
        }
      : FALLBACK_MONSTERS[id] || { name: id, pp: 10, stealth: 0, size: 'medium', drops: [] };
  }
  /** Tira el botín de un monstruo: [{id, n}]. */
  drops(id) {
    let out = [];
    for (let drop of this.monster(id).drops || []) {
      if (this.rng() > (drop.chance ?? 1)) continue;
      let n = typeof drop.n == 'string' ? rollDice(drop.n, this.rng) : Number(drop.n ?? 1);
      n > 0 && out.push({ id: drop.id, n });
    }
    return out;
  }
  /** Tira 1d20 con el generador de la exploración. */
  d20() {
    return rollD20(this.rng);
  }
  /** Tira una expresión de dados con el generador de la exploración. */
  roll(expr) {
    return rollDice(expr, this.rng);
  }
};

export { ExploreRules, rollDice, SKILL_LABELS };
