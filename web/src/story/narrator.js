// story/narrator.js
// Reconstruido de publicado/juego.js (módulo __esm «vE»). Nombres locales aún minificados.

const BD = new Set(['not_granted', 'sampling_disabled', 'invalid_request', 'prompt_too_large']);
const Narrator = class {
  constructor(e) {
    ((this.story = e),
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
  enabled() {
    return this.game.store?.settings?.narratorAI !== !1 && !this.off;
  }
  async sampleFn() {
    let e = this.game.caps?.get;
    if (typeof e != 'function') return null;
    try {
      let t = await Promise.race([e('sample'), new Promise((a) => setTimeout(() => a(null), 2500))]);
      return typeof t == 'function' ? t : null;
    } catch {
      return null;
    }
  }
  key(e, t) {
    let a = (this.story.party() || []).join(',');
    return `${e}|${t.key || t.group || t.level || t.place || ''}|${a}`;
  }
  cacheGet(e) {
    return this.story.st.narr?.[e] || null;
  }
  cacheSet(e, t) {
    let a = this.story.st.narr;
    a[e] = t;
    let n = Object.keys(a);
    if (n.length > 60) for (let s of n.slice(0, n.length - 60)) s.startsWith('epilogue|') || delete a[s];
  }
  async narrate(e, t = {}) {
    let a = this.story,
      n = a.narrationFallback(e, t);
    if (!this.enabled() || !a.cp) return n;
    let s = this.key(e, t),
      i = this.cacheGet(s);
    if (i) return i;
    if (this.inflight.has(s)) return this.race(this.inflight.get(s), n);
    if (Date.now() < this.pauseUntil || this.calls >= this.maxCalls) return n;
    let r = await this.sampleFn();
    if (!r) return n;
    let l = this.prompt(e, t, n),
      c = new AbortController();
    this.calls++;
    let d = r(l, { modelTier: 'quick', signal: c.signal })
        .then((h) => {
          let p = this.clean(h?.text || '');
          return (p && this.cacheSet(s, p), p || null);
        })
        .catch((h) => {
          let p = h?.code || 'upstream_error';
          return (
            BD.has(p) && (this.off = !0),
            p === 'rate_limited' && (this.pauseUntil = Date.now() + 12e4),
            p !== 'cancelled' && console.info('[narrador] sin IA:', p),
            null
          );
        })
        .finally(() => {
          (clearTimeout(u), this.inflight.delete(s));
        }),
      u = setTimeout(() => c.abort(), 4e4);
    return (
      this.inflight.set(s, d),
      d.then((h) => h && this.game.bus?.emit('narrate:late', { moment: e, key: s, text: h })),
      this.race(d, n)
    );
  }
  async race(e, t) {
    let a,
      n = await Promise.race([e, new Promise((s) => (a = setTimeout(() => s(null), this.timeout)))]);
    return (clearTimeout(a), n || t);
  }
  prefetch(e, t = {}) {
    this.enabled() && this.narrate(e, t).catch(() => {});
  }
  clean(e) {
    let t = String(e || '')
      .replace(/[*_#`]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^[«"“]?\s*(narraci[oó]n|narrador)\s*:\s*[»"”]?\s*/i, '');
    return (
      /^[«"“][^«»"“”]*[»"”]$/.test(t) && (t = t.slice(1, -1).trim()),
      t.length > 700 && (t = t.slice(0, 700).replace(/[^.!?…]*$/, '')),
      t.length < 25 ? '' : t
    );
  }
  facts() {
    let e = this.story,
      t = [];
    for (let a of e.data.narration?.facts || []) e.test(a.if, {}) && t.push(e.text(a.text));
    return t.slice(-8);
  }
  partyText() {
    let e = this.story,
      t = [];
    for (let a of e.party()) {
      if (a === 'hero') continue;
      let n = e.data.companions?.[a];
      n ? t.push(`${n.name} (${n.voice || n.title})`) : t.push(e.name(a));
    }
    return t.length ? t.join('; ') : 'viajas sin compa\xF1eros';
  }
  heroText() {
    let e = this.story,
      t = e.hero(),
      a = Object.entries(e.st.tone || {}).sort((i, r) => r[1] - i[1])[0]?.[0],
      n = { amable: 'amable', sarcastico: 'sarc\xE1stico', frio: 'fr\xEDo' }[a] || 'sin definir',
      s = t.pronoun === 'f' ? 'femenino' : t.pronoun === 'n' ? 'neutro' : 'masculino';
    return `${t.name || 'el protagonista'}: ${e.text('{especie}')} ${e.text('{clase}')}, trasfondo ${e.text('{trasfondo}')}, g\xE9nero gramatical ${s}. Tono que suele elegir: ${n}.`;
  }
  prompt(e, t, a) {
    let n = this.story,
      s = n.data.narration?.moments?.[e] || {},
      i = n.data.narration?.places?.[t.level || n.levelId()] || '';
    return [
      "Eres el narrador de \xABMarca de Granito\xBB, un juego de rol de fantas\xEDa al estilo de Baldur's Gate. Escribe UNA narraci\xF3n breve para el momento que se describe al final.",
      '',
      'Gu\xEDa de estilo (obligatoria):',
      ...(n.data.narration?.style || []).map((l) => `- ${l}`),
      '',
      `Mundo: ${n.data.narration?.world || ''}`,
      `Protagonista: ${this.heroText()}`,
      `Compa\xF1eros presentes: ${this.partyText()}.`,
      i ? `Lugar: ${i}` : '',
      `Lo que ha pasado hasta ahora: ${this.facts().join(' ') || 'la historia acaba de empezar.'}`,
      `Momento: ${n.text(s.desc || e)}`,
      a
        ? `Hechos de esta escena que debes respetar (dilos con tus palabras, sin a\xF1adir otros): ${a.replace(/\*/g, '')}`
        : '',
      '',
      'Devuelve solo el texto de la narraci\xF3n, en un \xFAnico p\xE1rrafo.',
    ].filter((l) => l !== '').join(`
`);
  }
};

export { Narrator };
