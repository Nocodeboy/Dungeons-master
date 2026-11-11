// story/narrator.js — Narrador con IA (story.narrator).
// Pide a la capacidad «sample» del artefacto una narración breve para un momento de la historia, con un
// prompt hecho de la guía de estilo, el mundo, el héroe, el grupo, el lugar y los hechos conocidos. Siempre
// devuelve algo: si no hay IA, tarda más de `timeout` o falla, usa el texto de respaldo de la historia; la
// respuesta que llega tarde se cachea en la partida y se anuncia con «narrate:late». Lo crea story/index.js.

/** Errores de «sample» que apagan el narrador para el resto de la sesión. */
const FATAL_SAMPLE_ERRORS = new Set(['not_granted', 'sampling_disabled', 'invalid_request', 'prompt_too_large']);
/** Narrador con IA y textos de respaldo; máximo `maxCalls` llamadas por sesión. */
const Narrator = class {
  constructor(story) {
    ((this.story = story),
      (this.inflight = new Map()),
      (this.off = !1),
      (this.pauseUntil = 0),
      (this.calls = 0),
      (this.maxCalls = 40),
      (this.timeout = 6e3));
  }
  get game() {
    return this.story.game;
  }
  /** ¿Se puede usar la IA? (ajuste «narratorAI» y no apagado por un error). */
  enabled() {
    return this.game.store?.settings?.narratorAI !== !1 && !this.off;
  }
  /** Función de la capacidad «sample», o null si no llega en 2,5 s. */
  async sampleFn() {
    let getCap = this.game.caps?.get;
    if (typeof getCap != 'function') return null;
    try {
      let sample = await Promise.race([getCap('sample'), new Promise((resolve) => setTimeout(() => resolve(null), 2500))]);
      return typeof sample == 'function' ? sample : null;
    } catch {
      return null;
    }
  }
  /** Clave de caché del momento: momento, clave/grupo/nivel/lugar y grupo actual. */
  key(moment, data) {
    let party = (this.story.party() || []).join(',');
    return `${moment}|${data.key || data.group || data.level || data.place || ''}|${party}`;
  }
  /** Narración cacheada en la partida (st.narr). */
  cacheGet(key) {
    return this.story.st.narr?.[key] || null;
  }
  /** Cachea una narración (máximo 60; las del epílogo no se borran). */
  cacheSet(key, text) {
    let cache = this.story.st.narr;
    cache[key] = text;
    let keys = Object.keys(cache);
    if (keys.length > 60) for (let old of keys.slice(0, keys.length - 60)) old.startsWith('epilogue|') || delete cache[old];
  }
  /**
   * Narración del momento `moment`: caché, petición en curso o petición nueva a la IA.
   * @returns {Promise<string>} el texto de la IA si llega a tiempo; si no, el de respaldo
   */
  async narrate(moment, data = {}) {
    let story = this.story,
      fallback = story.narrationFallback(moment, data);
    if (!this.enabled() || !story.cp) return fallback;
    let key = this.key(moment, data),
      cached = this.cacheGet(key);
    if (cached) return cached;
    if (this.inflight.has(key)) return this.race(this.inflight.get(key), fallback);
    if (Date.now() < this.pauseUntil || this.calls >= this.maxCalls) return fallback;
    let sample = await this.sampleFn();
    if (!sample) return fallback;
    let promptText = this.prompt(moment, data, fallback),
      controller = new AbortController();
    this.calls++;
    let request = sample(promptText, { modelTier: 'quick', signal: controller.signal })
        .then((res) => {
          let text = this.clean(res?.text || '');
          return (text && this.cacheSet(key, text), text || null);
        })
        .catch((err) => {
          let code = err?.code || 'upstream_error';
          return (
            FATAL_SAMPLE_ERRORS.has(code) && (this.off = !0),
            code === 'rate_limited' && (this.pauseUntil = Date.now() + 12e4),
            code !== 'cancelled' && console.info('[narrador] sin IA:', code),
            null
          );
        })
        .finally(() => {
          (clearTimeout(timer), this.inflight.delete(key));
        }),
      timer = setTimeout(() => controller.abort(), 4e4);
    return (
      this.inflight.set(key, request),
      request.then((text) => text && this.game.bus?.emit('narrate:late', { moment, key, text })),
      this.race(request, fallback)
    );
  }
  /** Espera `promise` como mucho `timeout` ms; si no llega o es vacía, devuelve `fallback`. */
  async race(promise, fallback) {
    let timer,
      res = await Promise.race([promise, new Promise((resolve) => (timer = setTimeout(() => resolve(null), this.timeout)))]);
    return (clearTimeout(timer), res || fallback);
  }
  /** Lanza la narración por adelantado para tenerla en caché. */
  prefetch(moment, data = {}) {
    this.enabled() && this.narrate(moment, data).catch(() => {});
  }
  /** Limpia la respuesta: sin markdown, comillas ni «Narrador:», máximo 700 caracteres ('' si es muy corta). */
  clean(raw) {
    let text = String(raw || '')
      .replace(/[*_#`]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^[«"“]?\s*(narraci[oó]n|narrador)\s*:\s*[»"”]?\s*/i, '');
    return (
      /^[«"“][^«»"“”]*[»"”]$/.test(text) && (text = text.slice(1, -1).trim()),
      text.length > 700 && (text = text.slice(0, 700).replace(/[^.!?…]*$/, '')),
      text.length < 25 ? '' : text
    );
  }
  /** Últimos hechos de la historia cuyas condiciones se cumplen (datos narration.facts). */
  facts() {
    let story = this.story,
      facts = [];
    for (let fact of story.data.narration?.facts || []) story.test(fact.if, {}) && facts.push(story.text(fact.text));
    return facts.slice(-8);
  }
  /** Descripción de los compañeros presentes para el prompt. */
  partyText() {
    let story = this.story,
      parts = [];
    for (let id of story.party()) {
      if (id === 'hero') continue;
      let companion = story.data.companions?.[id];
      companion ? parts.push(`${companion.name} (${companion.voice || companion.title})`) : parts.push(story.name(id));
    }
    return parts.length ? parts.join('; ') : 'viajas sin compa\xF1eros';
  }
  /** Descripción del héroe para el prompt (especie, clase, trasfondo, género y tono habitual). */
  heroText() {
    let story = this.story,
      hero = story.hero(),
      tone = Object.entries(story.st.tone || {}).sort((i, b) => b[1] - i[1])[0]?.[0],
      toneWord = { amable: 'amable', sarcastico: 'sarc\xE1stico', frio: 'fr\xEDo' }[tone] || 'sin definir',
      gender = hero.pronoun === 'f' ? 'femenino' : hero.pronoun === 'n' ? 'neutro' : 'masculino';
    return `${hero.name || 'el protagonista'}: ${story.text('{especie}')} ${story.text('{clase}')}, trasfondo ${story.text('{trasfondo}')}, g\xE9nero gramatical ${gender}. Tono que suele elegir: ${toneWord}.`;
  }
  /** Prompt completo para la IA; `fallback` son los hechos de la escena que debe respetar. */
  prompt(moment, data, fallback) {
    let story = this.story,
      momentDef = story.data.narration?.moments?.[moment] || {},
      place = story.data.narration?.places?.[data.level || story.levelId()] || '';
    return [
      "Eres el narrador de \xABMarca de Granito\xBB, un juego de rol de fantas\xEDa al estilo de Baldur's Gate. Escribe UNA narraci\xF3n breve para el momento que se describe al final.",
      '',
      'Gu\xEDa de estilo (obligatoria):',
      ...(story.data.narration?.style || []).map((line) => `- ${line}`),
      '',
      `Mundo: ${story.data.narration?.world || ''}`,
      `Protagonista: ${this.heroText()}`,
      `Compa\xF1eros presentes: ${this.partyText()}.`,
      place ? `Lugar: ${place}` : '',
      `Lo que ha pasado hasta ahora: ${this.facts().join(' ') || 'la historia acaba de empezar.'}`,
      `Momento: ${story.text(momentDef.desc || moment)}`,
      fallback
        ? `Hechos de esta escena que debes respetar (dilos con tus palabras, sin a\xF1adir otros): ${fallback.replace(/\*/g, '')}`
        : '',
      '',
      'Devuelve solo el texto de la narraci\xF3n, en un \xFAnico p\xE1rrafo.',
    ].filter((line) => line !== '').join(`
`);
  }
};

export { Narrator };
