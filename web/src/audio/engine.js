// audio/engine.js
// Motor de sonido sobre Web Audio. `AudioEngine` crea el contexto al primer gesto del usuario
// (unlock) con un compresor y buses de ganancia (master → música, ambiente, efectos, interfaz), carga
// y descodifica los archivos del manifiesto (datos/audio.json: music, ambience, sfx, sprites,
// credits), reproduce música por bloques o en flujo (MusicTrack: modos 'bucle', 'solape', 'una' o
// repetición con pausa), capas de ambiente con panorama (AmbienceLayer), emisores posicionales y
// efectos de sprites de audio con variantes, límite de voces, atenuación por distancia y «ducking».
// Lo usan audio/index.js (createAudio) y audio/reactions.js (`toPoint`).
// Reconstruido de publicado/juego.js (módulo __esm «Ov»).

import datosAudio from '../datos/audio.json';

/** Punto {x, y, z} a partir de una casilla [col, fila] (rejilla odd-r), de [x, y, z] o de {x, y, z}. */
function toPoint(at) {
  return at
    ? Array.isArray(at)
      ? at.length === 2
        ? { x: (at[0] + 0.5 * (at[1] & 1)) * CELL_SIZE, y: 0, z: at[1] * 0.8660254 * CELL_SIZE }
        : { x: +at[0] || 0, y: +at[1] || 0, z: +at[2] || 0 }
      : typeof at.x == 'number'
        ? { x: at.x, y: at.y || 0, z: at.z || 0 }
        : null
    : null;
}
/** Rampa lineal de un AudioParam hasta `value` en `seconds` (inmediato si es ~0). */
function rampParam(param, value, seconds, ctx) {
  let now = ctx.currentTime;
  (param.cancelScheduledValues(now),
    param.setValueAtTime(param.value, now),
    seconds <= 0.001
      ? param.setValueAtTime(value, now)
      : param.linearRampToValueAtTime(value, now + seconds));
}
/** Aproximación exponencial de un AudioParam a `value` (constante de tiempo seconds/3). */
function glideParam(param, value, seconds, ctx) {
  let now = ctx.currentTime;
  (param.cancelScheduledValues(now), param.setTargetAtTime(value, now, Math.max(0.005, seconds / 3)));
}
/** Reloj en segundos (performance.now). */
const nowSeconds = () => performance.now() / 1e3;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const randRange = (min, max) => min + Math.random() * (max - min);
/** Curva de volumen perceptual: v² con v limitado a [0, 1]. */
const volumeCurve = (v) => clamp(Number(v) || 0, 0, 1) ** 2;
// Tamaño de casilla en metros (el mismo que HEX_SIZE de explore/hex.js).
const CELL_SIZE = 1.5;
/** Una pista de música en reproducción, con su ganancia propia en el bus de música. */
const MusicTrack = class {
  constructor(eng, name, entry, opts) {
    ((this.eng = eng),
      (this.name = name),
      (this.e = entry),
      (this.opts = opts),
      (this.level = clamp(opts.volume ?? 1, 0, 2)));
    let ctx = eng.ctx;
    ((this.gain = ctx.createGain()),
      (this.gain.gain.value = 0),
      this.gain.connect(eng.bus.music),
      (this.sources = new Set()),
      (this.timers = new Set()),
      (this.el = null),
      (this.stopped = !1),
      (this.ready = !1));
  }
  /** Arranca la pista (en flujo con <audio> si se puede, si no descodificada); true si suena. */
  async start(fade) {
    let { e: entry, eng } = this;
    if (entry.stream && !eng.noStream && !this.opts.buffer)
      try {
        return (await this._startStream(), this.stopped ? !1 : (this._fadeIn(fade), !0));
      } catch (err) {
        if (this.stopped) return !1;
        ((eng.noStream = !0),
          console.info(
            '[sonido] reproducci\xF3n en flujo no disponible; se descodifica la m\xFAsica',
            err?.message || err,
          ));
      }
    let buf = await eng.buffer(entry.file, 'music');
    if (!buf || this.stopped) return !1;
    this.buf = buf;
    let when = eng.ctx.currentTime + 0.03;
    return (
      entry.mode === 'bucle'
        ? this._loop(when, this.opts.offset)
        : entry.mode === 'solape'
          ? this._overlap(when, this.opts.offset || 0)
          : this._once(when, this.opts.offset || 0),
      this._fadeIn(fade),
      !0
    );
  }
  _fadeIn(fade) {
    ((this.ready = !0), rampParam(this.gain.gain, this.level, fade, this.eng.ctx));
  }
  _src() {
    let src = this.eng.ctx.createBufferSource();
    return (
      (src.buffer = this.buf),
      src.connect(this.gain),
      this.sources.add(src),
      (src.onended = () => {
        this.sources.delete(src);
        try {
          src.disconnect();
        } catch {}
      }),
      src
    );
  }
  _loop(when, offset = 0) {
    let src = this._src();
    ((src.loop = !0),
      (src.loopStart = this.e.pad),
      (src.loopEnd = this.e.pad + this.e.dur),
      src.start(when, this.e.pad + ((offset || 0) % this.e.dur)));
  }
  _overlap(when, offset = 0) {
    this._src().start(when, offset);
    let next = when + this.e.loopAt - offset;
    this._at(next - 1.5, () => this._overlap(next, 0));
  }
  _once(when, offset = 0) {
    this._src().start(when, offset);
    let end = when + this.buf.duration - offset;
    this.e.mode === 'una'
      ? this._at(end, () => this.eng._afterOnce(this))
      : this._at(end - 0.5, () => this._once(end + (this.e.gap ?? 3), 0));
  }
  _at(time, fn) {
    let delayMs = Math.max(0, (time - this.eng.ctx.currentTime) * 1e3),
      timer = setTimeout(() => {
        (this.timers.delete(timer),
          !this.stopped && (this.eng.ctx.currentTime < time - 0.6 ? this._at(time, fn) : fn()));
      }, delayMs);
    this.timers.add(timer);
  }
  /** Reproducción en flujo con un elemento <audio> (8 s de espera máxima). */
  _startStream() {
    let { eng, e: entry } = this;
    return new Promise((resolve, reject) => {
      let el = new Audio();
      ((el.crossOrigin = 'anonymous'),
        (el.preload = 'auto'),
        (el.src = eng.base + entry.file),
        (this.el = el));
      let settled = !1,
        fail = (reason) => {
          settled || ((settled = !0), this._dropStream(), reject(new Error(reason)));
        },
        timeout = setTimeout(() => fail('tiempo de espera'), 8e3);
      (el.addEventListener('error', () => fail(`error ${el.error?.code ?? ''}`), { once: !0 }),
        el.addEventListener(
          'playing',
          () => {
            (clearTimeout(timeout), settled || ((settled = !0), resolve()));
          },
          { once: !0 },
        ),
        el.addEventListener('ended', () => {
          if (this.stopped) return;
          if (entry.mode === 'una') return eng._afterOnce(this);
          let timer = setTimeout(
            () => {
              (this.timers.delete(timer),
                !(this.stopped || !this.el) && ((this.el.currentTime = 0), this.el.play().catch(() => {})));
            },
            (entry.gap ?? 3) * 1e3,
          );
          this.timers.add(timer);
        }));
      try {
        ((this.node = eng.ctx.createMediaElementSource(el)), this.node.connect(this.gain));
      } catch (err) {
        return (clearTimeout(timeout), fail(err.message));
      }
      (this.opts.offset && (el.currentTime = this.opts.offset),
        el.play().catch((err) => {
          (clearTimeout(timeout), fail(err?.name || 'play'));
        }));
    });
  }
  _dropStream() {
    if (this.el) {
      try {
        (this.el.pause(), this.el.removeAttribute('src'), this.el.load(), this.node?.disconnect());
      } catch {}
      ((this.el = null), (this.node = null));
    }
  }
  pauseStream(paused) {
    this.el && (paused ? this.el.pause() : this.el.play().catch(() => {}));
  }
  setLevel(level, fade = 0.6) {
    ((this.level = clamp(level, 0, 2)),
      this.ready && rampParam(this.gain.gain, this.level, fade, this.eng.ctx));
  }
  /** Funde a silencio en `fade` s y libera fuentes, temporizadores y nodos. */
  stop(fade = 1.2) {
    if (this.stopped) return;
    this.stopped = !0;
    for (let timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    let ctx = this.eng.ctx;
    rampParam(this.gain.gain, 0, fade, ctx);
    let when = ctx.currentTime + fade + 0.05;
    for (let src of this.sources)
      try {
        src.stop(when);
      } catch {}
    setTimeout(
      () => {
        this._dropStream();
        try {
          this.gain.disconnect();
        } catch {}
      },
      (fade + 0.2) * 1e3,
    );
  }
};
/** Capa de ambiente en bucle con nivel, factor espacial (`space`) y panorama. */
const AmbienceLayer = class {
  constructor(eng, id, entry, dest, level) {
    ((this.eng = eng),
      (this.id = id),
      (this.e = entry),
      (this.level = level),
      (this.gain = eng.ctx.createGain()),
      (this.gain.gain.value = 0),
      (this.pan = eng.ctx.createStereoPanner ? eng.ctx.createStereoPanner() : null),
      this.pan ? (this.gain.connect(this.pan), this.pan.connect(dest)) : this.gain.connect(dest),
      (this.stopped = !1),
      (this.src = null),
      (this.space = 1));
  }
  async start(fade) {
    let buf = await this.eng.buffer(this.e.file, 'amb');
    if (!buf || this.stopped) return;
    let src = this.eng.ctx.createBufferSource();
    ((src.buffer = buf),
      (src.loop = !0),
      (src.loopStart = this.e.pad),
      (src.loopEnd = this.e.pad + this.e.dur),
      src.connect(this.gain),
      src.start(this.eng.ctx.currentTime + 0.02, this.e.pad + Math.random() * this.e.dur),
      (this.src = src),
      (this.ready = !0),
      (this.fadeEnd = this.eng.ctx.currentTime + fade),
      rampParam(this.gain.gain, this.level * this.space, fade, this.eng.ctx));
  }
  setLevel(level, fade = 1) {
    ((this.level = level),
      this.ready && glideParam(this.gain.gain, this.level * this.space, fade, this.eng.ctx));
  }
  /** Ajusta la ganancia espacial y el panorama (ignora cambios mínimos). */
  setSpace(space, pan, fade = 0.25) {
    if (Math.abs(space - this.space) < 0.002 && Math.abs(pan - (this.lastPan ?? 9)) < 0.005) return;
    ((this.space = space), (this.lastPan = pan));
    let ctx = this.eng.ctx;
    (this.ready &&
      ctx.currentTime >= (this.fadeEnd || 0) &&
      glideParam(this.gain.gain, this.level * space, fade, ctx),
      this.pan && glideParam(this.pan.pan, pan, fade, this.eng.ctx));
  }
  stop(fade = 2) {
    if (this.stopped) return;
    this.stopped = !0;
    let ctx = this.eng.ctx;
    rampParam(this.gain.gain, 0, fade, ctx);
    try {
      this.src?.stop(ctx.currentTime + fade + 0.05);
    } catch {}
    setTimeout(
      () => {
        try {
          (this.gain.disconnect(), this.pan?.disconnect());
        } catch {}
      },
      (fade + 0.2) * 1e3,
    );
  }
};
/** Motor de audio del juego (ver cabecera). */
const AudioEngine = class {
  constructor({
    base = 'audio/',
    manifest = datosAudio,
    volumes = {},
    noStream = !1,
    sampleRate = null,
  } = {}) {
    ((this.base = base),
      (this.sampleRate = sampleRate),
      (this.m = manifest),
      (this.ctx = null),
      (this.unlocked = !1),
      (this.noStream = noStream),
      (this.vol = { master: 1, music: 0.7, ambience: 0.6, sfx: 0.8, ui: 0.8, ...volumes }),
      (this.raw = new Map()),
      (this.decoded = new Map()),
      (this.ready = new Map()),
      (this.kind = new Map()),
      (this.lastUse = new Map()),
      (this.cur = null),
      (this.fading = new Set()),
      (this.want = { music: null, musicOpts: {}, ambience: [] }),
      (this.layers = new Map()),
      (this.emitters = new Set()),
      (this.ducks = new Map()),
      (this.voices = new Map()),
      (this.lastPlay = new Map()),
      (this.lastVar = new Map()),
      (this.pending = []),
      (this.warned = new Set()),
      (this.listener = {
        pos: null,
        focus: null,
        right: { x: 1, z: 0 },
        fwd: { x: 0, y: 0, z: -1 },
        tanH: 0.6,
        dist: 20,
      }),
      (this.camera = null),
      (this.controls = null),
      (this.onUpdate = new Set()),
      (this.paused = !1),
      (this.failed = !1));
  }
  /** Crea o reanuda el contexto tras un gesto del usuario; devuelve false si no hay audio. */
  unlock() {
    try {
      if ((this.ctx || this._createContext(), !this.ctx)) return !1;
      if (
        (this.ctx.state === 'suspended' && !this.paused && this.ctx.resume().catch(() => {}), !this.unlocked)
      ) {
        this.unlocked = !0;
        let silence = this.ctx.createBuffer(1, 1, this.ctx.sampleRate),
          src = this.ctx.createBufferSource();
        ((src.buffer = silence), src.connect(this.ctx.destination), src.start(), this._realize());
      }
      return !0;
    } catch (err) {
      return (this._fail(err), !1);
    }
  }
  /** Contexto, compresor y buses: master → (musicOut → music), (ambOut → ambience), sfx y ui. */
  _createContext() {
    let AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return this._fail(new Error('sin WebAudio'));
    let ctx;
    try {
      ctx = new AudioCtx(
        this.sampleRate
          ? { latencyHint: 'interactive', sampleRate: this.sampleRate }
          : { latencyHint: 'interactive' },
      );
    } catch {
      ctx = new AudioCtx();
    }
    this.ctx = ctx;
    let gainTo = (dest) => {
        let gain = ctx.createGain();
        return (gain.connect(dest), gain);
      },
      comp = ctx.createDynamicsCompressor();
    ((comp.threshold.value = -12),
      (comp.knee.value = 10),
      (comp.ratio.value = 3),
      (comp.attack.value = 0.004),
      (comp.release.value = 0.25),
      comp.connect(ctx.destination));
    let master = gainTo(comp),
      musicOut = gainTo(master),
      ambOut = gainTo(master);
    ((this.bus = {
      comp,
      master,
      musicOut,
      music: gainTo(musicOut),
      ambOut,
      ambience: gainTo(ambOut),
      sfx: gainTo(master),
      ui: gainTo(master),
    }),
      this._applyVolumes(0),
      document.addEventListener('visibilitychange', () => this.setPaused(document.hidden)));
  }
  _fail(err) {
    return (
      this.failed || console.warn('[sonido] sin audio:', err?.message || err),
      (this.failed = !0),
      null
    );
  }
  /** Al desbloquear: aplica la música y el ambiente pedidos antes, arranca emisores y descodifica lo cargado. */
  _realize() {
    (this.want.music !== void 0 &&
      this.want.music !== (this.cur?.name ?? null) &&
      this.music(this.want.music, { ...this.want.musicOpts, fade: this.want.musicOpts.fade ?? 2 }),
      this.want.ambience.length && this.ambience(this.want.ambience, { fade: 2.5 }));
    for (let em of this.emitters) em.voice || em._start();
    for (let [file, kind] of this.kind)
      this.raw.has(file) && !this.decoded.has(file) && this.buffer(file, kind);
  }
  setPaused(paused) {
    if (((this.paused = paused), !!this.ctx))
      try {
        paused ? this.ctx.suspend() : this.unlocked && this.ctx.resume();
        for (let track of [this.cur, ...this.fading]) track?.pauseStream(paused);
      } catch {}
  }
  /** Descarga (una vez) los bytes de un archivo de audio. */
  fetchRaw(file) {
    if (!this.raw.has(file)) {
      let promise = fetch(this.base + file)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .catch(
          (err) => (
            this._warnOnce(`carga:${file}`, `[sonido] no se puede cargar ${file}: ${err.message || err}`),
            null
          ),
        );
      this.raw.set(file, promise);
    }
    return this.raw.get(file);
  }
  /** AudioBuffer descodificado de `file` (promesa, cacheada); `kind` decide la política de expulsión. */
  buffer(file, kind = 'sfx') {
    if ((this.kind.set(file, kind), this.lastUse.set(file, nowSeconds()), this.decoded.has(file)))
      return this.decoded.get(file);
    if (!this.ctx) return (this.fetchRaw(file), Promise.resolve(null));
    let promise = this.fetchRaw(file).then(async (raw) => {
      if (!raw) return null;
      this.raw.delete(file);
      try {
        let decoded = await new Promise((resolve, reject) => {
          let result = this.ctx.decodeAudioData(raw, resolve, reject);
          result && result.then && result.then(resolve, reject);
        });
        return (
          this.decoded.get(file) === promise && this.ready.set(file, decoded),
          this._evict(kind, file),
          decoded
        );
      } catch (err) {
        return (
          this._warnOnce(
            `dec:${file}`,
            `[sonido] no se puede descodificar ${file} (${err?.message || err}). \xBFNavegador sin Opus?`,
          ),
          null
        );
      }
    });
    return (
      this.decoded.set(file, promise),
      kind === 'sfx' && promise.then((buf) => buf && this._flushPending(file)),
      promise
    );
  }
  /** Expulsa los buffers menos usados de un tipo (música 3, ambiente 7) salvo los que suenan. */
  _evict(kind, keep) {
    let limit = kind === 'music' ? 3 : kind === 'amb' ? 7 : 99,
      inUse = new Set([
        this.cur?.e.file,
        ...[...this.fading].map((track) => track.e.file),
        ...[...this.layers.values()].map((layer) => layer.e.file),
        ...[...this.emitters].map((em) => em.e?.file),
        keep,
      ]),
      files = [...this.decoded.keys()].filter((file) => this.kind.get(file) === kind);
    if (!(files.length <= limit)) {
      files.sort((a, b) => (this.lastUse.get(a) || 0) - (this.lastUse.get(b) || 0));
      for (let file of files) {
        if (files.length <= limit) break;
        inUse.has(file) ||
          (this.decoded.delete(file), this.ready.delete(file), files.splice(files.indexOf(file), 1));
      }
    }
  }
  /** Precarga entradas 'music:id', 'amb:id' o 'sfx:sprite' (la música en flujo no se precarga). */
  preload(list = []) {
    let promises = [];
    for (let item of list) {
      let [kind, id] = item.includes(':') ? item.split(':') : ['music', item],
        entry =
          kind === 'music' ? this.m.music[id] : kind === 'amb' ? this.m.ambience[id] : this.m.sprites[id];
      entry &&
        ((kind === 'music' && entry.stream && !this.noStream) ||
          promises.push(
            this.buffer(entry.file, kind === 'music' ? 'music' : kind === 'amb' ? 'amb' : 'sfx'),
          ));
    }
    return Promise.all(promises);
  }
  _warnOnce(key, msg) {
    this.warned.has(key) || (this.warned.add(key), console.warn(msg));
  }
  /** Fija volúmenes (master, music, ambience, sfx, ui) en [0, 1]. */
  setVolumes(vols = {}) {
    for (let key of ['master', 'music', 'ambience', 'sfx', 'ui'])
      vols[key] != null && Number.isFinite(+vols[key]) && (this.vol[key] = clamp(+vols[key], 0, 1));
    this._applyVolumes(0.15);
  }
  _applyVolumes(fade) {
    if (!this.ctx) return;
    let bus = this.bus;
    (glideParam(bus.master.gain, volumeCurve(this.vol.master), fade, this.ctx),
      glideParam(bus.music.gain, volumeCurve(this.vol.music), fade, this.ctx),
      glideParam(bus.ambience.gain, volumeCurve(this.vol.ambience), fade, this.ctx),
      glideParam(bus.sfx.gain, volumeCurve(this.vol.sfx), fade, this.ctx),
      glideParam(bus.ui.gain, volumeCurve(this.vol.ui), fade, this.ctx),
      this._applyDucks(fade));
  }
  /** Baja la música (a `amount`) y el ambiente mientras esté activo el motivo `key`. */
  duck(key, amount = 0.5, { ambience = null } = {}) {
    (this.ducks.set(key, { m: clamp(amount, 0, 1), a: ambience ?? 0.5 + amount / 2 }),
      this._applyDucks(0.35));
  }
  unduck(key) {
    this.ducks.delete(key) && this._applyDucks(1.2);
  }
  _applyDucks(fade) {
    if (!this.ctx) return;
    let musicGain = 1,
      ambGain = 1;
    for (let duck of this.ducks.values())
      ((musicGain = Math.min(musicGain, duck.m)), (ambGain = Math.min(ambGain, duck.a)));
    (glideParam(this.bus.musicOut.gain, musicGain, fade, this.ctx),
      glideParam(this.bus.ambOut.gain, ambGain, fade, this.ctx));
  }
  /**
   * Cambia la música a `name` (null = silencio) con fundido `opts.fade`; `opts.then` es la pista (o
   * función) que sigue a una pista de modo 'una'. Antes de desbloquear solo se recuerda.
   */
  music(name, opts = {}) {
    let fade = opts.fade ?? 1.5;
    if (name && !this.m.music[name]) {
      this._warnOnce(`m:${name}`, `[sonido] m\xFAsica desconocida: ${name}`);
      return;
    }
    if (!this.ctx || !this.unlocked) {
      ((this.want.music = name), (this.want.musicOpts = opts));
      return;
    }
    if (
      ((this.want.music = name),
      (this.want.musicOpts = opts),
      this.cur && this.cur.name === name && !opts.restart && !this.cur.stopped)
    ) {
      (opts.volume != null && this.cur.setLevel(opts.volume),
        (this.cur.opts.then = opts.then ?? this.cur.opts.then));
      return;
    }
    let prev = this.cur;
    if (((this.cur = null), !name)) {
      prev && this._retire(prev, fade);
      return;
    }
    let track = new MusicTrack(this, name, this.m.music[name], opts);
    this.cur = track;
    let retired = !1,
      retirePrev = () => {
        retired || !prev || ((retired = !0), this._retire(prev, fade));
      },
      timer = setTimeout(retirePrev, 250);
    track.start(fade).then((ok) => {
      (clearTimeout(timer), retirePrev(), !ok && this.cur === track && (this.cur = null));
    });
  }
  _retire(track, fade) {
    (this.fading.add(track),
      track.stop(fade),
      setTimeout(() => this.fading.delete(track), (fade + 0.3) * 1e3));
  }
  _afterOnce(track) {
    if (this.cur !== track) return;
    let next = typeof track.opts.then == 'function' ? track.opts.then() : track.opts.then;
    next
      ? this.music(next, { fade: 2.5 })
      : (this._retire(track, 0.5), (this.cur = null), (this.want.music = null));
  }
  get musicName() {
    return this.cur?.name ?? (this.unlocked ? null : this.want.music);
  }
  /** Deja sonando exactamente las capas de `list` (ids o {id, vol}). */
  ambience(list, { fade = 2.5 } = {}) {
    let wanted = (list == null ? [] : Array.isArray(list) ? list : [list])
      .map((item) => (typeof item == 'string' ? { id: item, vol: 1 } : { vol: 1, ...item }))
      .filter((item) =>
        this.m.ambience[item.id]
          ? !0
          : (this._warnOnce(`a:${item.id}`, `[sonido] ambiente desconocido: ${item.id}`), !1),
      );
    if (((this.want.ambience = wanted), !this.ctx || !this.unlocked)) {
      for (let item of wanted) this.fetchRaw(this.m.ambience[item.id].file);
      return;
    }
    let ids = new Set(wanted.map((item) => item.id));
    for (let [id, layer] of this.layers) ids.has(id) || (layer.stop(fade), this.layers.delete(id));
    for (let item of wanted) {
      let layer = this.layers.get(item.id);
      if (layer) layer.setLevel(item.vol, fade);
      else {
        let layer = new AmbienceLayer(this, item.id, this.m.ambience[item.id], this.bus.ambience, item.vol);
        (this.layers.set(item.id, layer), layer.start(fade));
      }
    }
  }
  /** Emisor posicional de un ambiente en `at` o en el más cercano de `points`; devuelve {set, stop}. */
  emitter(id, { at = null, points = null, vol = 1, near = 3, far = 22 } = {}) {
    let entry = this.m.ambience[id];
    if (!entry)
      return (this._warnOnce(`a:${id}`, `[sonido] ambiente desconocido: ${id}`), { set() {}, stop() {} });
    let eng = this,
      em = {
        e: entry,
        id,
        vol,
        near,
        far,
        at: toPoint(at),
        points: points ? points.map(toPoint).filter(Boolean) : null,
        voice: null,
        _start() {
          if (!eng.ctx || !eng.unlocked || this.voice || this.dead) return;
          this.voice = new AmbienceLayer(eng, id, entry, eng.bus.ambience, this.vol);
          let [gain, pan] = eng._space(this);
          ((this.voice.space = gain),
            this.voice.pan && (this.voice.pan.pan.value = pan),
            this.voice.start(2));
        },
        set(opts = {}) {
          (opts.at !== void 0 && (this.at = toPoint(opts.at)),
            opts.points && (this.points = opts.points.map(toPoint).filter(Boolean)),
            opts.vol != null && ((this.vol = opts.vol), this.voice?.setLevel(opts.vol, 1)));
        },
        stop(fade = 2) {
          ((this.dead = !0), eng.emitters.delete(this), this.voice?.stop(fade));
        },
      };
    return (this.emitters.add(em), this.ctx && this.unlocked ? em._start() : this.fetchRaw(entry.file), em);
  }
  bindCamera(camera, controls = null) {
    ((this.camera = camera), (this.controls = controls));
  }
  /** [ganancia, panorama] de un sonido en `pos` respecto al foco y a la cámara. */
  _gainPan(pos, near = 6, far = 30) {
    let lis = this.listener;
    if (!pos || !lis.focus) return [1, 0];
    let dx = pos.x - lis.focus.x,
      dz = pos.z - lis.focus.z,
      dist = Math.sqrt(dx * dx + dz * dz),
      gain = dist <= near ? 1 : 1 / (1 + ((dist - near) / Math.max(1, (far - near) / 2)) ** 2);
    gain *= clamp(1.25 - lis.dist / 70, 0.55, 1);
    let pan = 0;
    if (lis.pos) {
      let rx = pos.x - lis.pos.x,
        ry = pos.y - lis.pos.y,
        rz = pos.z - lis.pos.z,
        side = rx * lis.right.x + rz * lis.right.z,
        depth = Math.max(1, rx * lis.fwd.x + ry * lis.fwd.y + rz * lis.fwd.z);
      pan = clamp(side / (depth * lis.tanH), -1, 1) * 0.75;
    }
    return [gain, pan];
  }
  _space(em) {
    let pos = em.at;
    if (em.points?.length && this.listener.focus) {
      let focus = this.listener.focus,
        best = 1 / 0;
      for (let p of em.points) {
        let d2 = (p.x - focus.x) ** 2 + (p.z - focus.z) ** 2;
        d2 < best && ((best = d2), (pos = p));
      }
    }
    return pos ? this._gainPan(pos, em.near, em.far) : [1, 0];
  }
  /** Actualiza posición, orientación y foco del oyente a partir de la cámara y sus controles. */
  _updateListener() {
    let camera = this.camera;
    if (!camera) return;
    let m = camera.matrixWorld?.elements,
      lis = this.listener;
    if (((lis.pos = { x: camera.position.x, y: camera.position.y, z: camera.position.z }), m)) {
      let len = Math.hypot(m[0], m[2]) || 1;
      ((lis.right = { x: m[0] / len, z: m[2] / len }), (lis.fwd = { x: -m[8], y: -m[9], z: -m[10] }));
    }
    let target = this.controls?.target;
    ((lis.focus = target
      ? { x: target.x, y: target.y, z: target.z }
      : { x: lis.pos.x + lis.fwd.x * 15, y: 0, z: lis.pos.z + lis.fwd.z * 15 }),
      (lis.dist = Math.hypot(lis.pos.x - lis.focus.x, lis.pos.y - lis.focus.y, lis.pos.z - lis.focus.z)),
      (lis.tanH = Math.tan(((camera.fov || 50) * Math.PI) / 360) * (camera.aspect || 1.6)));
  }
  /**
   * Reproduce el efecto `id`. `opts`: at, volume, rate, pan, delay, variant, vary, near, far, force,
   * late (si el sprite aún no está cargado, sonará al cargarse si llega a tiempo). Devuelve {stop} o null.
   */
  sfx(id, opts = {}) {
    let def = this.m.sfx[id];
    if (!def) return (this._warnOnce(`s:${id}`, `[sonido] efecto desconocido: ${id}`), null);
    if (!this.ctx || !this.unlocked || this.paused) return null;
    let sprite = this.m.sprites[def.s],
      buf = this.ready.get(sprite.file);
    return buf
      ? (this.lastUse.set(sprite.file, nowSeconds()), this._play(id, def, buf, opts))
      : (this.buffer(sprite.file, 'sfx'),
        opts.late !== !1 && this.pending.push({ id, opts, t: nowSeconds(), file: sprite.file }),
        null);
  }
  _flushPending(file) {
    let now = nowSeconds(),
      due = this.pending.filter((item) => item.file === file);
    this.pending = this.pending.filter((item) => item.file !== file && now - item.t < 2);
    for (let item of due) now - item.t < 0.35 && this.sfx(item.id, { ...item.opts, late: !1 });
  }
  /** Reproduce un tramo del sprite con variante, tono y volumen al azar, límite de voces y ducking. */
  _play(id, def, buf, opts) {
    let ctx = this.ctx,
      now = nowSeconds(),
      gap = def.gap ?? 0.025;
    if (now - (this.lastPlay.get(id) || 0) < gap && !opts.force) return null;
    this.lastPlay.set(id, now);
    let voices = (this.voices.get(id) || []).filter((voice) => !voice.done),
      maxVoices = def.max ?? 4;
    for (; voices.length >= maxVoices;) voices.shift().kill(0.04);
    let total = 0;
    for (let list of this.voices.values()) total += list.length;
    if (total > 48) return null;
    let variant = 0;
    if (def.v.length > 1) {
      let last = this.lastVar.get(id);
      do variant = Math.floor(Math.random() * def.v.length);
      while (variant === last && def.v.length > 1);
      this.lastVar.set(id, variant);
    }
    opts.variant != null && (variant = clamp(opts.variant | 0, 0, def.v.length - 1));
    let [offset, dur] = def.v[variant],
      vary = opts.vary !== !1,
      pitch = vary ? (def.pitch ?? 0.04) : 0,
      rate = clamp((opts.rate ?? 1) * (1 + randRange(-pitch, pitch)), 0.25, 4),
      gain = (def.vol ?? 0.5) * (opts.volume ?? 1) * (vary ? randRange(0.9, 1.06) : 1),
      pan = opts.pan ?? 0,
      at = toPoint(opts.at);
    if (at) {
      let [g, p] = this._gainPan(at, opts.near ?? 7, opts.far ?? 34);
      ((gain *= g), opts.pan == null && (pan = p));
    }
    if (gain < 0.003) return null;
    let src = ctx.createBufferSource();
    ((src.buffer = buf), (src.playbackRate.value = rate));
    let gainNode = ctx.createGain();
    ((gainNode.gain.value = gain), src.connect(gainNode));
    let out = gainNode;
    if (pan && ctx.createStereoPanner) {
      let panner = ctx.createStereoPanner();
      ((panner.pan.value = clamp(pan, -1, 1)), gainNode.connect(panner), (out = panner));
    }
    let dest = def.bus === 'ui' ? this.bus.ui : def.bus === 'amb' ? this.bus.ambience : this.bus.sfx;
    out.connect(dest);
    let when = ctx.currentTime + Math.max(0, opts.delay || 0);
    src.start(when, offset, dur);
    let voice = {
      done: !1,
      kill: (fade = 0.08) => {
        if (!voice.done) {
          voice.done = !0;
          try {
            (rampParam(gainNode.gain, 0, fade, ctx), src.stop(ctx.currentTime + fade + 0.02));
          } catch {}
        }
      },
    };
    if (
      ((src.onended = () => {
        voice.done = !0;
        try {
          (out.disconnect(), gainNode.disconnect());
        } catch {}
        let list = this.voices.get(id);
        list &&
          this.voices.set(
            id,
            list.filter((v) => v !== voice),
          );
      }),
      voices.push(voice),
      this.voices.set(id, voices),
      def.duck)
    ) {
      let key = `sfx:${id}`;
      (this.duck(key, def.duck.amount),
        clearTimeout(this._duckT?.[key]),
        ((this._duckT ||= {})[key] = setTimeout(
          () => this.unduck(key),
          (def.duck.dur / rate + (opts.delay || 0)) * 1e3,
        )));
    }
    return { stop: (fade) => voice.kill(fade) };
  }
  stopAllSfx(fade = 0.1) {
    for (let list of this.voices.values()) for (let voice of list) voice.kill(fade);
    (this.voices.clear(), (this.pending = []));
  }
  /** Por fotograma: oyente, espacialización de emisores y oyentes de `onUpdate`. */
  update(dt) {
    if (!(!this.ctx || !this.unlocked)) {
      this._updateListener();
      for (let em of this.emitters) {
        if (!em.voice) continue;
        let [gain, pan] = this._space(em);
        em.voice.setSpace(gain, pan);
      }
      for (let fn of this.onUpdate)
        try {
          fn(dt);
        } catch (err) {
          console.error('[sonido] update', err);
        }
    }
  }
  names() {
    return {
      music: Object.keys(this.m.music),
      ambience: Object.keys(this.m.ambience),
      sfx: Object.keys(this.m.sfx),
      sprites: Object.keys(this.m.sprites),
    };
  }
};

export { toPoint, AudioEngine };
