// audio/engine.js
// Reconstruido de publicado/juego.js (módulo __esm «Ov»). Nombres locales aún minificados.

import datosAudio from '../datos/audio.json';

function Vr(o) {
  return o
    ? Array.isArray(o)
      ? o.length === 2
        ? { x: (o[0] + 0.5 * (o[1] & 1)) * qM, y: 0, z: o[1] * 0.8660254 * qM }
        : { x: +o[0] || 0, y: +o[1] || 0, z: +o[2] || 0 }
      : typeof o.x == 'number'
        ? { x: o.x, y: o.y || 0, z: o.z || 0 }
        : null
    : null;
}
function mc(o, e, t, a) {
  let n = a.currentTime;
  (o.cancelScheduledValues(n),
    o.setValueAtTime(o.value, n),
    t <= 0.001 ? o.setValueAtTime(e, n) : o.linearRampToValueAtTime(e, n + t));
}
function qs(o, e, t, a) {
  let n = a.currentTime;
  (o.cancelScheduledValues(n), o.setTargetAtTime(e, n, Math.max(0.005, t / 3)));
}
const bu = () => performance.now() / 1e3;
const Bs = (o, e, t) => Math.max(e, Math.min(t, o));
const BM = (o, e) => o + Math.random() * (e - o);
const vu = (o) => Bs(Number(o) || 0, 0, 1) ** 2;
const qM = 1.5;
const Fv = class {
  constructor(e, t, a, n) {
    ((this.eng = e), (this.name = t), (this.e = a), (this.opts = n), (this.level = Bs(n.volume ?? 1, 0, 2)));
    let s = e.ctx;
    ((this.gain = s.createGain()),
      (this.gain.gain.value = 0),
      this.gain.connect(e.bus.music),
      (this.sources = new Set()),
      (this.timers = new Set()),
      (this.el = null),
      (this.stopped = !1),
      (this.ready = !1));
  }
  async start(e) {
    let { e: t, eng: a } = this;
    if (t.stream && !a.noStream && !this.opts.buffer)
      try {
        return (await this._startStream(), this.stopped ? !1 : (this._fadeIn(e), !0));
      } catch (r) {
        if (this.stopped) return !1;
        ((a.noStream = !0),
          console.info(
            '[sonido] reproducci\xF3n en flujo no disponible; se descodifica la m\xFAsica',
            r?.message || r,
          ));
      }
    let s = await a.buffer(t.file, 'music');
    if (!s || this.stopped) return !1;
    this.buf = s;
    let i = a.ctx.currentTime + 0.03;
    return (
      t.mode === 'bucle'
        ? this._loop(i, this.opts.offset)
        : t.mode === 'solape'
          ? this._overlap(i, this.opts.offset || 0)
          : this._once(i, this.opts.offset || 0),
      this._fadeIn(e),
      !0
    );
  }
  _fadeIn(e) {
    ((this.ready = !0), mc(this.gain.gain, this.level, e, this.eng.ctx));
  }
  _src() {
    let e = this.eng.ctx.createBufferSource();
    return (
      (e.buffer = this.buf),
      e.connect(this.gain),
      this.sources.add(e),
      (e.onended = () => {
        this.sources.delete(e);
        try {
          e.disconnect();
        } catch {}
      }),
      e
    );
  }
  _loop(e, t = 0) {
    let a = this._src();
    ((a.loop = !0),
      (a.loopStart = this.e.pad),
      (a.loopEnd = this.e.pad + this.e.dur),
      a.start(e, this.e.pad + ((t || 0) % this.e.dur)));
  }
  _overlap(e, t = 0) {
    this._src().start(e, t);
    let n = e + this.e.loopAt - t;
    this._at(n - 1.5, () => this._overlap(n, 0));
  }
  _once(e, t = 0) {
    this._src().start(e, t);
    let n = e + this.buf.duration - t;
    this.e.mode === 'una'
      ? this._at(n, () => this.eng._afterOnce(this))
      : this._at(n - 0.5, () => this._once(n + (this.e.gap ?? 3), 0));
  }
  _at(e, t) {
    let a = Math.max(0, (e - this.eng.ctx.currentTime) * 1e3),
      n = setTimeout(() => {
        (this.timers.delete(n), !this.stopped && (this.eng.ctx.currentTime < e - 0.6 ? this._at(e, t) : t()));
      }, a);
    this.timers.add(n);
  }
  _startStream() {
    let { eng: e, e: t } = this;
    return new Promise((a, n) => {
      let s = new Audio();
      ((s.crossOrigin = 'anonymous'), (s.preload = 'auto'), (s.src = e.base + t.file), (this.el = s));
      let i = !1,
        r = (c) => {
          i || ((i = !0), this._dropStream(), n(new Error(c)));
        },
        l = setTimeout(() => r('tiempo de espera'), 8e3);
      (s.addEventListener('error', () => r(`error ${s.error?.code ?? ''}`), { once: !0 }),
        s.addEventListener(
          'playing',
          () => {
            (clearTimeout(l), i || ((i = !0), a()));
          },
          { once: !0 },
        ),
        s.addEventListener('ended', () => {
          if (this.stopped) return;
          if (t.mode === 'una') return e._afterOnce(this);
          let c = setTimeout(
            () => {
              (this.timers.delete(c),
                !(this.stopped || !this.el) && ((this.el.currentTime = 0), this.el.play().catch(() => {})));
            },
            (t.gap ?? 3) * 1e3,
          );
          this.timers.add(c);
        }));
      try {
        ((this.node = e.ctx.createMediaElementSource(s)), this.node.connect(this.gain));
      } catch (c) {
        return (clearTimeout(l), r(c.message));
      }
      (this.opts.offset && (s.currentTime = this.opts.offset),
        s.play().catch((c) => {
          (clearTimeout(l), r(c?.name || 'play'));
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
  pauseStream(e) {
    this.el && (e ? this.el.pause() : this.el.play().catch(() => {}));
  }
  setLevel(e, t = 0.6) {
    ((this.level = Bs(e, 0, 2)), this.ready && mc(this.gain.gain, this.level, t, this.eng.ctx));
  }
  stop(e = 1.2) {
    if (this.stopped) return;
    this.stopped = !0;
    for (let n of this.timers) clearTimeout(n);
    this.timers.clear();
    let t = this.eng.ctx;
    mc(this.gain.gain, 0, e, t);
    let a = t.currentTime + e + 0.05;
    for (let n of this.sources)
      try {
        n.stop(a);
      } catch {}
    setTimeout(
      () => {
        this._dropStream();
        try {
          this.gain.disconnect();
        } catch {}
      },
      (e + 0.2) * 1e3,
    );
  }
};
const cm = class {
  constructor(e, t, a, n, s) {
    ((this.eng = e),
      (this.id = t),
      (this.e = a),
      (this.level = s),
      (this.gain = e.ctx.createGain()),
      (this.gain.gain.value = 0),
      (this.pan = e.ctx.createStereoPanner ? e.ctx.createStereoPanner() : null),
      this.pan ? (this.gain.connect(this.pan), this.pan.connect(n)) : this.gain.connect(n),
      (this.stopped = !1),
      (this.src = null),
      (this.space = 1));
  }
  async start(e) {
    let t = await this.eng.buffer(this.e.file, 'amb');
    if (!t || this.stopped) return;
    let a = this.eng.ctx.createBufferSource();
    ((a.buffer = t),
      (a.loop = !0),
      (a.loopStart = this.e.pad),
      (a.loopEnd = this.e.pad + this.e.dur),
      a.connect(this.gain),
      a.start(this.eng.ctx.currentTime + 0.02, this.e.pad + Math.random() * this.e.dur),
      (this.src = a),
      (this.ready = !0),
      (this.fadeEnd = this.eng.ctx.currentTime + e),
      mc(this.gain.gain, this.level * this.space, e, this.eng.ctx));
  }
  setLevel(e, t = 1) {
    ((this.level = e), this.ready && qs(this.gain.gain, this.level * this.space, t, this.eng.ctx));
  }
  setSpace(e, t, a = 0.25) {
    if (Math.abs(e - this.space) < 0.002 && Math.abs(t - (this.lastPan ?? 9)) < 0.005) return;
    ((this.space = e), (this.lastPan = t));
    let n = this.eng.ctx;
    (this.ready && n.currentTime >= (this.fadeEnd || 0) && qs(this.gain.gain, this.level * e, a, n),
      this.pan && qs(this.pan.pan, t, a, this.eng.ctx));
  }
  stop(e = 2) {
    if (this.stopped) return;
    this.stopped = !0;
    let t = this.eng.ctx;
    mc(this.gain.gain, 0, e, t);
    try {
      this.src?.stop(t.currentTime + e + 0.05);
    } catch {}
    setTimeout(
      () => {
        try {
          (this.gain.disconnect(), this.pan?.disconnect());
        } catch {}
      },
      (e + 0.2) * 1e3,
    );
  }
};
const dm = class {
  constructor({
    base: e = 'audio/',
    manifest: t = datosAudio,
    volumes: a = {},
    noStream: n = !1,
    sampleRate: s = null,
  } = {}) {
    ((this.base = e),
      (this.sampleRate = s),
      (this.m = t),
      (this.ctx = null),
      (this.unlocked = !1),
      (this.noStream = n),
      (this.vol = { master: 1, music: 0.7, ambience: 0.6, sfx: 0.8, ui: 0.8, ...a }),
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
  unlock() {
    try {
      if ((this.ctx || this._createContext(), !this.ctx)) return !1;
      if (
        (this.ctx.state === 'suspended' && !this.paused && this.ctx.resume().catch(() => {}), !this.unlocked)
      ) {
        this.unlocked = !0;
        let e = this.ctx.createBuffer(1, 1, this.ctx.sampleRate),
          t = this.ctx.createBufferSource();
        ((t.buffer = e), t.connect(this.ctx.destination), t.start(), this._realize());
      }
      return !0;
    } catch (e) {
      return (this._fail(e), !1);
    }
  }
  _createContext() {
    let e = window.AudioContext || window.webkitAudioContext;
    if (!e) return this._fail(new Error('sin WebAudio'));
    let t;
    try {
      t = new e(
        this.sampleRate
          ? { latencyHint: 'interactive', sampleRate: this.sampleRate }
          : { latencyHint: 'interactive' },
      );
    } catch {
      t = new e();
    }
    this.ctx = t;
    let a = (l) => {
        let c = t.createGain();
        return (c.connect(l), c);
      },
      n = t.createDynamicsCompressor();
    ((n.threshold.value = -12),
      (n.knee.value = 10),
      (n.ratio.value = 3),
      (n.attack.value = 0.004),
      (n.release.value = 0.25),
      n.connect(t.destination));
    let s = a(n),
      i = a(s),
      r = a(s);
    ((this.bus = {
      comp: n,
      master: s,
      musicOut: i,
      music: a(i),
      ambOut: r,
      ambience: a(r),
      sfx: a(s),
      ui: a(s),
    }),
      this._applyVolumes(0),
      document.addEventListener('visibilitychange', () => this.setPaused(document.hidden)));
  }
  _fail(e) {
    return (this.failed || console.warn('[sonido] sin audio:', e?.message || e), (this.failed = !0), null);
  }
  _realize() {
    (this.want.music !== void 0 &&
      this.want.music !== (this.cur?.name ?? null) &&
      this.music(this.want.music, { ...this.want.musicOpts, fade: this.want.musicOpts.fade ?? 2 }),
      this.want.ambience.length && this.ambience(this.want.ambience, { fade: 2.5 }));
    for (let e of this.emitters) e.voice || e._start();
    for (let [e, t] of this.kind) this.raw.has(e) && !this.decoded.has(e) && this.buffer(e, t);
  }
  setPaused(e) {
    if (((this.paused = e), !!this.ctx))
      try {
        e ? this.ctx.suspend() : this.unlocked && this.ctx.resume();
        for (let t of [this.cur, ...this.fading]) t?.pauseStream(e);
      } catch {}
  }
  fetchRaw(e) {
    if (!this.raw.has(e)) {
      let t = fetch(this.base + e)
        .then((a) => {
          if (!a.ok) throw new Error(`HTTP ${a.status}`);
          return a.arrayBuffer();
        })
        .catch(
          (a) => (this._warnOnce(`carga:${e}`, `[sonido] no se puede cargar ${e}: ${a.message || a}`), null),
        );
      this.raw.set(e, t);
    }
    return this.raw.get(e);
  }
  buffer(e, t = 'sfx') {
    if ((this.kind.set(e, t), this.lastUse.set(e, bu()), this.decoded.has(e))) return this.decoded.get(e);
    if (!this.ctx) return (this.fetchRaw(e), Promise.resolve(null));
    let a = this.fetchRaw(e).then(async (n) => {
      if (!n) return null;
      this.raw.delete(e);
      try {
        let s = await new Promise((i, r) => {
          let l = this.ctx.decodeAudioData(n, i, r);
          l && l.then && l.then(i, r);
        });
        return (this.decoded.get(e) === a && this.ready.set(e, s), this._evict(t, e), s);
      } catch (s) {
        return (
          this._warnOnce(
            `dec:${e}`,
            `[sonido] no se puede descodificar ${e} (${s?.message || s}). \xBFNavegador sin Opus?`,
          ),
          null
        );
      }
    });
    return (this.decoded.set(e, a), t === 'sfx' && a.then((n) => n && this._flushPending(e)), a);
  }
  _evict(e, t) {
    let a = e === 'music' ? 3 : e === 'amb' ? 7 : 99,
      n = new Set([
        this.cur?.e.file,
        ...[...this.fading].map((i) => i.e.file),
        ...[...this.layers.values()].map((i) => i.e.file),
        ...[...this.emitters].map((i) => i.e?.file),
        t,
      ]),
      s = [...this.decoded.keys()].filter((i) => this.kind.get(i) === e);
    if (!(s.length <= a)) {
      s.sort((i, r) => (this.lastUse.get(i) || 0) - (this.lastUse.get(r) || 0));
      for (let i of s) {
        if (s.length <= a) break;
        n.has(i) || (this.decoded.delete(i), this.ready.delete(i), s.splice(s.indexOf(i), 1));
      }
    }
  }
  preload(e = []) {
    let t = [];
    for (let a of e) {
      let [n, s] = a.includes(':') ? a.split(':') : ['music', a],
        i = n === 'music' ? this.m.music[s] : n === 'amb' ? this.m.ambience[s] : this.m.sprites[s];
      i &&
        ((n === 'music' && i.stream && !this.noStream) ||
          t.push(this.buffer(i.file, n === 'music' ? 'music' : n === 'amb' ? 'amb' : 'sfx')));
    }
    return Promise.all(t);
  }
  _warnOnce(e, t) {
    this.warned.has(e) || (this.warned.add(e), console.warn(t));
  }
  setVolumes(e = {}) {
    for (let t of ['master', 'music', 'ambience', 'sfx', 'ui'])
      e[t] != null && Number.isFinite(+e[t]) && (this.vol[t] = Bs(+e[t], 0, 1));
    this._applyVolumes(0.15);
  }
  _applyVolumes(e) {
    if (!this.ctx) return;
    let t = this.bus;
    (qs(t.master.gain, vu(this.vol.master), e, this.ctx),
      qs(t.music.gain, vu(this.vol.music), e, this.ctx),
      qs(t.ambience.gain, vu(this.vol.ambience), e, this.ctx),
      qs(t.sfx.gain, vu(this.vol.sfx), e, this.ctx),
      qs(t.ui.gain, vu(this.vol.ui), e, this.ctx),
      this._applyDucks(e));
  }
  duck(e, t = 0.5, { ambience: a = null } = {}) {
    (this.ducks.set(e, { m: Bs(t, 0, 1), a: a ?? 0.5 + t / 2 }), this._applyDucks(0.35));
  }
  unduck(e) {
    this.ducks.delete(e) && this._applyDucks(1.2);
  }
  _applyDucks(e) {
    if (!this.ctx) return;
    let t = 1,
      a = 1;
    for (let n of this.ducks.values()) ((t = Math.min(t, n.m)), (a = Math.min(a, n.a)));
    (qs(this.bus.musicOut.gain, t, e, this.ctx), qs(this.bus.ambOut.gain, a, e, this.ctx));
  }
  music(e, t = {}) {
    let a = t.fade ?? 1.5;
    if (e && !this.m.music[e]) {
      this._warnOnce(`m:${e}`, `[sonido] m\xFAsica desconocida: ${e}`);
      return;
    }
    if (!this.ctx || !this.unlocked) {
      ((this.want.music = e), (this.want.musicOpts = t));
      return;
    }
    if (
      ((this.want.music = e),
      (this.want.musicOpts = t),
      this.cur && this.cur.name === e && !t.restart && !this.cur.stopped)
    ) {
      (t.volume != null && this.cur.setLevel(t.volume), (this.cur.opts.then = t.then ?? this.cur.opts.then));
      return;
    }
    let n = this.cur;
    if (((this.cur = null), !e)) {
      n && this._retire(n, a);
      return;
    }
    let s = new Fv(this, e, this.m.music[e], t);
    this.cur = s;
    let i = !1,
      r = () => {
        i || !n || ((i = !0), this._retire(n, a));
      },
      l = setTimeout(r, 250);
    s.start(a).then((c) => {
      (clearTimeout(l), r(), !c && this.cur === s && (this.cur = null));
    });
  }
  _retire(e, t) {
    (this.fading.add(e), e.stop(t), setTimeout(() => this.fading.delete(e), (t + 0.3) * 1e3));
  }
  _afterOnce(e) {
    if (this.cur !== e) return;
    let t = typeof e.opts.then == 'function' ? e.opts.then() : e.opts.then;
    t ? this.music(t, { fade: 2.5 }) : (this._retire(e, 0.5), (this.cur = null), (this.want.music = null));
  }
  get musicName() {
    return this.cur?.name ?? (this.unlocked ? null : this.want.music);
  }
  ambience(e, { fade: t = 2.5 } = {}) {
    let a = (e == null ? [] : Array.isArray(e) ? e : [e])
      .map((s) => (typeof s == 'string' ? { id: s, vol: 1 } : { vol: 1, ...s }))
      .filter((s) =>
        this.m.ambience[s.id]
          ? !0
          : (this._warnOnce(`a:${s.id}`, `[sonido] ambiente desconocido: ${s.id}`), !1),
      );
    if (((this.want.ambience = a), !this.ctx || !this.unlocked)) {
      for (let s of a) this.fetchRaw(this.m.ambience[s.id].file);
      return;
    }
    let n = new Set(a.map((s) => s.id));
    for (let [s, i] of this.layers) n.has(s) || (i.stop(t), this.layers.delete(s));
    for (let s of a) {
      let i = this.layers.get(s.id);
      if (i) i.setLevel(s.vol, t);
      else {
        let r = new cm(this, s.id, this.m.ambience[s.id], this.bus.ambience, s.vol);
        (this.layers.set(s.id, r), r.start(t));
      }
    }
  }
  emitter(e, { at: t = null, points: a = null, vol: n = 1, near: s = 3, far: i = 22 } = {}) {
    let r = this.m.ambience[e];
    if (!r) return (this._warnOnce(`a:${e}`, `[sonido] ambiente desconocido: ${e}`), { set() {}, stop() {} });
    let l = this,
      c = {
        e: r,
        id: e,
        vol: n,
        near: s,
        far: i,
        at: Vr(t),
        points: a ? a.map(Vr).filter(Boolean) : null,
        voice: null,
        _start() {
          if (!l.ctx || !l.unlocked || this.voice || this.dead) return;
          this.voice = new cm(l, e, r, l.bus.ambience, this.vol);
          let [d, u] = l._space(this);
          ((this.voice.space = d), this.voice.pan && (this.voice.pan.pan.value = u), this.voice.start(2));
        },
        set(d = {}) {
          (d.at !== void 0 && (this.at = Vr(d.at)),
            d.points && (this.points = d.points.map(Vr).filter(Boolean)),
            d.vol != null && ((this.vol = d.vol), this.voice?.setLevel(d.vol, 1)));
        },
        stop(d = 2) {
          ((this.dead = !0), l.emitters.delete(this), this.voice?.stop(d));
        },
      };
    return (this.emitters.add(c), this.ctx && this.unlocked ? c._start() : this.fetchRaw(r.file), c);
  }
  bindCamera(e, t = null) {
    ((this.camera = e), (this.controls = t));
  }
  _gainPan(e, t = 6, a = 30) {
    let n = this.listener;
    if (!e || !n.focus) return [1, 0];
    let s = e.x - n.focus.x,
      i = e.z - n.focus.z,
      r = Math.sqrt(s * s + i * i),
      l = r <= t ? 1 : 1 / (1 + ((r - t) / Math.max(1, (a - t) / 2)) ** 2);
    l *= Bs(1.25 - n.dist / 70, 0.55, 1);
    let c = 0;
    if (n.pos) {
      let d = e.x - n.pos.x,
        u = e.y - n.pos.y,
        h = e.z - n.pos.z,
        p = d * n.right.x + h * n.right.z,
        m = Math.max(1, d * n.fwd.x + u * n.fwd.y + h * n.fwd.z);
      c = Bs(p / (m * n.tanH), -1, 1) * 0.75;
    }
    return [l, c];
  }
  _space(e) {
    let t = e.at;
    if (e.points?.length && this.listener.focus) {
      let a = this.listener.focus,
        n = 1 / 0;
      for (let s of e.points) {
        let i = (s.x - a.x) ** 2 + (s.z - a.z) ** 2;
        i < n && ((n = i), (t = s));
      }
    }
    return t ? this._gainPan(t, e.near, e.far) : [1, 0];
  }
  _updateListener() {
    let e = this.camera;
    if (!e) return;
    let t = e.matrixWorld?.elements,
      a = this.listener;
    if (((a.pos = { x: e.position.x, y: e.position.y, z: e.position.z }), t)) {
      let s = Math.hypot(t[0], t[2]) || 1;
      ((a.right = { x: t[0] / s, z: t[2] / s }), (a.fwd = { x: -t[8], y: -t[9], z: -t[10] }));
    }
    let n = this.controls?.target;
    ((a.focus = n
      ? { x: n.x, y: n.y, z: n.z }
      : { x: a.pos.x + a.fwd.x * 15, y: 0, z: a.pos.z + a.fwd.z * 15 }),
      (a.dist = Math.hypot(a.pos.x - a.focus.x, a.pos.y - a.focus.y, a.pos.z - a.focus.z)),
      (a.tanH = Math.tan(((e.fov || 50) * Math.PI) / 360) * (e.aspect || 1.6)));
  }
  sfx(e, t = {}) {
    let a = this.m.sfx[e];
    if (!a) return (this._warnOnce(`s:${e}`, `[sonido] efecto desconocido: ${e}`), null);
    if (!this.ctx || !this.unlocked || this.paused) return null;
    let n = this.m.sprites[a.s],
      s = this.ready.get(n.file);
    return s
      ? (this.lastUse.set(n.file, bu()), this._play(e, a, s, t))
      : (this.buffer(n.file, 'sfx'),
        t.late !== !1 && this.pending.push({ id: e, opts: t, t: bu(), file: n.file }),
        null);
  }
  _flushPending(e) {
    let t = bu(),
      a = this.pending.filter((n) => n.file === e);
    this.pending = this.pending.filter((n) => n.file !== e && t - n.t < 2);
    for (let n of a) t - n.t < 0.35 && this.sfx(n.id, { ...n.opts, late: !1 });
  }
  _play(e, t, a, n) {
    let s = this.ctx,
      i = bu(),
      r = t.gap ?? 0.025;
    if (i - (this.lastPlay.get(e) || 0) < r && !n.force) return null;
    this.lastPlay.set(e, i);
    let l = (this.voices.get(e) || []).filter((S) => !S.done),
      c = t.max ?? 4;
    for (; l.length >= c;) l.shift().kill(0.04);
    let d = 0;
    for (let S of this.voices.values()) d += S.length;
    if (d > 48) return null;
    let u = 0;
    if (t.v.length > 1) {
      let S = this.lastVar.get(e);
      do u = Math.floor(Math.random() * t.v.length);
      while (u === S && t.v.length > 1);
      this.lastVar.set(e, u);
    }
    n.variant != null && (u = Bs(n.variant | 0, 0, t.v.length - 1));
    let [h, p] = t.v[u],
      m = n.vary !== !1,
      _ = m ? (t.pitch ?? 0.04) : 0,
      b = Bs((n.rate ?? 1) * (1 + BM(-_, _)), 0.25, 4),
      f = (t.vol ?? 0.5) * (n.volume ?? 1) * (m ? BM(0.9, 1.06) : 1),
      v = n.pan ?? 0,
      x = Vr(n.at);
    if (x) {
      let [S, z] = this._gainPan(x, n.near ?? 7, n.far ?? 34);
      ((f *= S), n.pan == null && (v = z));
    }
    if (f < 0.003) return null;
    let g = s.createBufferSource();
    ((g.buffer = a), (g.playbackRate.value = b));
    let y = s.createGain();
    ((y.gain.value = f), g.connect(y));
    let w = y;
    if (v && s.createStereoPanner) {
      let S = s.createStereoPanner();
      ((S.pan.value = Bs(v, -1, 1)), y.connect(S), (w = S));
    }
    let k = t.bus === 'ui' ? this.bus.ui : t.bus === 'amb' ? this.bus.ambience : this.bus.sfx;
    w.connect(k);
    let T = s.currentTime + Math.max(0, n.delay || 0);
    g.start(T, h, p);
    let E = {
      done: !1,
      kill: (S = 0.08) => {
        if (!E.done) {
          E.done = !0;
          try {
            (mc(y.gain, 0, S, s), g.stop(s.currentTime + S + 0.02));
          } catch {}
        }
      },
    };
    if (
      ((g.onended = () => {
        E.done = !0;
        try {
          (w.disconnect(), y.disconnect());
        } catch {}
        let S = this.voices.get(e);
        S &&
          this.voices.set(
            e,
            S.filter((z) => z !== E),
          );
      }),
      l.push(E),
      this.voices.set(e, l),
      t.duck)
    ) {
      let S = `sfx:${e}`;
      (this.duck(S, t.duck.amount),
        clearTimeout(this._duckT?.[S]),
        ((this._duckT ||= {})[S] = setTimeout(
          () => this.unduck(S),
          (t.duck.dur / b + (n.delay || 0)) * 1e3,
        )));
    }
    return { stop: (S) => E.kill(S) };
  }
  stopAllSfx(e = 0.1) {
    for (let t of this.voices.values()) for (let a of t) a.kill(e);
    (this.voices.clear(), (this.pending = []));
  }
  update(e) {
    if (!(!this.ctx || !this.unlocked)) {
      this._updateListener();
      for (let t of this.emitters) {
        if (!t.voice) continue;
        let [a, n] = this._space(t);
        t.voice.setSpace(a, n);
      }
      for (let t of this.onUpdate)
        try {
          t(e);
        } catch (a) {
          console.error('[sonido] update', a);
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

export { Vr, dm };
