// story/codex.js — Libro de saber (story.lore).
// Desbloquea entradas de datos/historia/saber.json según sus condiciones y apunta lo que el grupo sabe:
// lugares visitados, gente conocida y monstruos contra los que ha luchado o que ha matado (que añaden sus
// datos de reglas a la entrada: CA, PG, velocidad, desafío y, tras matarlos, resistencias y rasgos).
// El estado va en st.codex de la partida. Lo crea story/index.js; lo muestra la pantalla del diario.

import historiaSaber from '../datos/historia/saber.json';

/** Tipos de conocimiento que se apuntan (también los consulta conditions.js con «visited:x», «met:x»…). */
const KNOWLEDGE_KINDS = ['visited', 'met', 'fought', 'killed'];
/** Valor o lista → lista. */
const toList = (value) => (value == null ? [] : Array.isArray(value) ? value : [value]);
/** Valor de desafío con coma decimal. */
const formatCr = (cr) => String(cr).replace('.', ',');
/** Entradas del libro de saber y conocimiento del grupo. */
const Codex = class {
  constructor(story, data = historiaSaber) {
    ((this.story = story),
      (this.game = story.game),
      (this.data = data || { entries: {} }),
      (this._monsters = new Map()),
      (this._t = 0),
      (this._cp = null),
      (this.quiet = !1));
  }
  /** Estado del libro en la partida: u (desbloqueadas, con su día), read y los tipos de conocimiento. */
  get st() {
    let st = this.story.st;
    st.codex ??= {};
    for (let key of ['u', 'read', ...KNOWLEDGE_KINDS]) st.codex[key] ??= {};
    return st.codex;
  }
  /** ¿Consta `id` como `kind` (visited, met, fought, killed)? */
  knows(kind, id) {
    return this.story.cp ? !!this.st[kind]?.[id] : !1;
  }
  /** Apunta un conocimiento nuevo y programa una sincronización; devuelve si era nuevo. */
  note(kind, id) {
    if (!id || typeof id != 'string' || !this.story.cp || !KNOWLEDGE_KINDS.includes(kind)) return !1;
    let known = this.st[kind];
    return known[id] ? !1 : ((known[id] = 1), this.soon(), !0);
  }
  /** Sincroniza en el próximo instante (agrupa varios cambios). */
  soon() {
    (clearTimeout(this._t), (this._t = setTimeout(() => this.sync(), 60)));
  }
  /** Desbloquea las entradas cuyas condiciones se cumplen; sin `quiet`, avisa y emite «codex:unlock». */
  sync({ quiet = this.quiet } = {}) {
    if (!this.story.cp) return [];
    this._cp !== this.story.cp && ((this._cp = this.story.cp), quiet || this.sync({ quiet: !0 }));
    let st = this.st,
      unlocked = [];
    for (let [id, entry] of Object.entries(this.data.entries || {}))
      st.u[id] ||
        (this.story.test(entry.unlock || 'true', {}) &&
          ((st.u[id] = this.story.cp.day || 1), quiet && (st.read[id] = 1), unlocked.push(id)));
    if (!quiet && unlocked.length) {
      for (let id of unlocked)
        this.game.bus?.emit('codex:unlock', { id, cat: this.data.entries[id].cat, title: this.title(id) });
      let msg =
        unlocked.length === 1
          ? `Saber nuevo: ${this.title(unlocked[0])}.`
          : `Saber nuevo: ${unlocked.length} entradas en el diario.`;
      try {
        this.game.ui?.toast?.(msg, 'info');
      } catch {}
    }
    return unlocked;
  }
  /** Título de una entrada (el primero cuya condición se cumple). */
  title(id) {
    let entry = this.data.entries?.[id];
    if (!entry) return '';
    for (let option of toList(entry.title)) {
      if (typeof option == 'string') return this.story.text(option);
      if (option && this.story.test(option.if, {})) return this.story.text(option.text);
    }
    return '';
  }
  /** Ficha de reglas de un monstruo (`monster_info`), cacheada. */
  monsterInfo(id) {
    if (this._monsters.has(id)) return this._monsters.get(id);
    let info = null;
    try {
      ((info = this.story.rules('monster_info', { id })), (!info || info.error) && (info = null));
    } catch {
      info = null;
    }
    return (info && this._monsters.set(id, info), info);
  }
  /** Plantillas de monstruo de un grupo de enemigos (del nivel actual o de los datos). */
  groupMonsters(groupId) {
    let group = (this.game.explore?.level?.groups || []).find((g) => g.id === groupId),
      ids = group ? (group.enemies || []).map((enemy) => enemy.id || enemy.template || enemy) : this.data.groups?.[groupId] || [];
    return [...new Set(ids.filter((id) => typeof id == 'string'))];
  }
  /** Datos de los monstruos de la entrada contra los que se ha luchado. */
  facts(entry) {
    let facts = [];
    for (let id of toList(entry.monsters)) {
      if (!this.knows('fought', id)) continue;
      let info = this.monsterInfo(id);
      if (!info) continue;
      let fact = {
        id,
        name: info.name,
        ac: info.ac,
        hp: info.hp,
        speed: info.speed_text,
        cr: info.cr,
        type: info.type_name,
        lines: [],
      };
      if (this.knows('killed', id)) {
        (info.vulnerable?.length && fact.lines.push(`Vulnerable: ${info.vulnerable.join(', ')}.`),
          info.resist?.length && fact.lines.push(`Resiste: ${info.resist.join(', ')}.`),
          info.immune?.length && fact.lines.push(`Inmune: ${info.immune.join(', ')}.`));
        for (let trait of info.traits || []) trait?.name && trait.desc && fact.lines.push(`${trait.name}: ${trait.desc}`);
      }
      facts.push(fact);
    }
    return facts;
  }
  /** Texto con formato de los datos de monstruos. */
  factsText(facts) {
    if (!facts.length) return '';
    let heading = '*Lo que sab\xE9is tras luchar:*',
      blocks = facts.map((fact) => {
        let line = `**${fact.name}** \xB7 CA ${fact.ac} \xB7 ${fact.hp} PG \xB7 ${fact.speed} \xB7 desaf\xEDo ${formatCr(fact.cr)}`;
        return fact.lines.length
          ? `${line}
${fact.lines.join(`
`)}`
          : line;
      });
    return [heading, ...blocks].join(`

`);
  }
  /** Entrada lista para mostrar (bloqueada: título «???» y sin texto). */
  entry(id) {
    let def = this.data.entries?.[id];
    if (!def) return null;
    let unlocked = !!(this.story.cp && this.st.u[id]),
      cats = this.data.cats || {};
    if (!unlocked)
      return {
        id,
        cat: def.cat,
        catName: cats[def.cat] || def.cat,
        title: '???',
        text: '',
        unlocked: !1,
        fresh: !1,
        facts: [],
      };
    let facts = this.facts(def),
      paragraphs = toList(def.text)
        .map((text) => this.story.text(text))
        .filter(Boolean),
      factsText = this.factsText(facts);
    return (
      factsText && paragraphs.push(factsText),
      {
        id,
        cat: def.cat,
        catName: cats[def.cat] || def.cat,
        title: this.title(id),
        text: paragraphs.join(`

`),
        unlocked: !0,
        fresh: !this.st.read[id],
        facts,
      }
    );
  }
  /** Entradas ordenadas por categoría (`all`: también las bloqueadas). */
  list({ all = !0 } = {}) {
    let cats = Object.keys(this.data.cats || {});
    return Object.keys(this.data.entries || {})
      .map((id) => this.entry(id))
      .filter((entry) => entry && (all || entry.unlocked))
      .sort((a, b) => cats.indexOf(a.cat) - cats.indexOf(b.cat));
  }
  /** Marca una entrada como leída. */
  read(id) {
    this.story.cp && this.st.u[id] && (this.st.read[id] = 1);
  }
  /** Engancha los oyentes del bus que apuntan conocimiento y sincronizan. */
  attach() {
    let bus = this.game.bus;
    if (!bus || this._attached) return;
    this._attached = !0;
    let on = (name, fn) =>
        bus.on(name, (data) => {
          try {
            fn(data || {});
          } catch (err) {
            console.warn('[historia] saber', name, err);
          }
        }),
      onStart = () => {
        let level = this.story.levelId();
        (level && this.story.cp && (this.st.visited[level] = 1),
          (this._cp = this.story.cp),
          this.sync({ quiet: !0 }));
      };
    (on('game:start', onStart),
      on('game:loaded', onStart),
      on('level:enter', (data) => this.note('visited', data.level)),
      on('dialog:open', (data) => {
        (this.note('met', data.id), data.npc && data.npc !== data.id && this.note('met', data.npc));
      }),
      on('interact', (data) => {
        if (data.kind !== 'npc') return;
        let id = typeof data.object == 'string' ? data.object : data.object?.id;
        this.note('met', id);
      }));
    let groupsOf = (data) => (data.groups?.length ? data.groups : [data.group]).filter(Boolean);
    (on('battle:start', (data) => {
      for (let group of groupsOf(data)) for (let id of this.groupMonsters(group)) this.note('fought', id);
    }),
      on('battle:end', (data) => {
        if (data.won) for (let group of groupsOf(data)) for (let id of this.groupMonsters(group)) this.note('killed', id);
      }));
    for (let name of ['flag:set', 'item:gain', 'companion:join', 'quest:update', 'dialog:close'])
      on(name, () => this.soon());
  }
};

export { Codex };
