// store.js
// Reconstruido de publicado/juego.js (parte sin envolver del final del bundle). Nombres locales aún minificados.

import { getCap, getUserId } from './caps.js';

var STORAGE_PREFIX = 'mdg.',
  DEFAULT_SETTINGS = {
    music: 0.7,
    sfx: 0.8,
    ambience: 0.6,
    quality: 'auto',
    textSpeed: 1,
    narratorAI: !0,
    autoCompanions: !0,
    confirmEndTurn: !0,
    tips: !0,
    cameraSpeed: 1,
  };
function loadLocal(o, e = null) {
  try {
    let t = localStorage.getItem(STORAGE_PREFIX + o);
    return t == null ? e : JSON.parse(t);
  } catch {
    return e;
  }
}
function saveLocal(o, e) {
  try {
    return (localStorage.setItem(STORAGE_PREFIX + o, JSON.stringify(e)), !0);
  } catch {
    return !1;
  }
}
function removeLocal(o) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + o);
  } catch {}
}
var Store = class {
  constructor(e) {
    ((this.bus = e),
      (this.cp = null),
      (this.settings = { ...DEFAULT_SETTINGS, ...(loadLocal('settings', {}) || {}) }),
      (this._dbFolder = null));
  }
  start(e) {
    ((e.flags ??= {}),
      (e.journal ??= []),
      (e.levels ??= {}),
      (e.location ??= {}),
      (e.story ??= {}),
      (e.web = { version: 1 }),
      (this.cp = e),
      this.bus.emit('game:start', { cp: e }));
  }
  set(e) {
    if (!(!e || e.error)) {
      for (let t of ['story', 'web', 'levels', 'flags', 'journal', 'location'])
        e[t] === void 0 && this.cp?.[t] !== void 0 && (e[t] = this.cp[t]);
      ((this.cp = e), this.bus.emit('cp:changed', { cp: e }));
    }
  }
  flag(e) {
    return this.cp?.flags?.[e];
  }
  setFlag(e, t = !0) {
    if (!this.cp) return;
    let a = this.cp.flags[e];
    ((this.cp.flags[e] = t), a !== t && this.bus.emit('flag:set', { name: e, value: t, old: a }));
  }
  levelState(e) {
    return this.cp ? ((this.cp.levels[e] ??= {}), this.cp.levels[e]) : {};
  }
  saveSettings(e = {}) {
    (Object.assign(this.settings, e),
      saveLocal('settings', this.settings),
      this.bus.emit('settings:changed', { settings: this.settings, patch: e }));
  }
  async _folder() {
    if (this._dbFolder !== null) return this._dbFolder;
    let e = await getCap('db'),
      t = e ? await getUserId() : null;
    return ((this._dbFolder = e && t ? e.collection(`data/users/${t}`) : !1), this._dbFolder);
  }
  async cloud() {
    return !!(await this._folder());
  }
  meta(e) {
    let t = this.cp,
      a = t?.members?.hero || {};
    return {
      slot: String(e),
      hero: a.name || 'Sin nombre',
      cls: a.class || '',
      level: t?.party_level || 1,
      place: t?.location?.name || t?.location?.level || '',
      day: t?.day || 1,
      playtime: Math.round(t?.playtime || 0),
      party: (t?.party || []).map((n) => t.members?.[n]?.name || n),
      savedAt: new Date().toISOString(),
    };
  }
  async save(e = 'auto') {
    if (!this.cp) return !1;
    let t = this.meta(e),
      a = { meta: t, data: JSON.stringify(this.cp) },
      n = await this._folder(),
      s = !1;
    if (n)
      try {
        (await n.doc(`partida_${e}`).set(a), (s = !0));
      } catch (i) {
        console.warn('[guardado] nube:', i?.code || i);
      }
    return (
      s || (s = saveLocal(`partida.${e}`, a)),
      s && this.bus.emit('game:saved', { slot: e, meta: t }),
      s
    );
  }
  async _read(e) {
    let t = await this._folder();
    if (t)
      try {
        let a = await t.doc(`partida_${e}`).get();
        if (a.exists) return a.data();
      } catch (a) {
        console.warn('[guardado] nube:', a?.code || a);
      }
    return loadLocal(`partida.${e}`);
  }
  async load(e) {
    let t = await this._read(e);
    if (!t) return null;
    let a = typeof t.data == 'string' ? JSON.parse(t.data) : t.data;
    return ((this.cp = a), this.bus.emit('game:loaded', { slot: e, cp: a }), a);
  }
  async list() {
    let e = new Map(),
      t = await this._folder();
    if (t)
      try {
        let a = await t.get();
        for (let n of a.docs || []) {
          let s = /^partida_(.+)$/.exec(n.id);
          s && e.set(s[1], n.data().meta);
        }
      } catch (a) {
        console.warn('[guardado] nube:', a?.code || a);
      }
    try {
      for (let a = 0; a < localStorage.length; a++) {
        let n = localStorage.key(a),
          s = n && new RegExp(`^${STORAGE_PREFIX}partida\\.(.+)$`).exec(n);
        s && !e.has(s[1]) && e.set(s[1], loadLocal(`partida.${s[1]}`)?.meta);
      }
    } catch {}
    return [...e.entries()]
      .filter(([, a]) => a)
      .map(([a, n]) => ({ slot: a, meta: n }))
      .sort((a, n) => String(n.meta.savedAt).localeCompare(String(a.meta.savedAt)));
  }
  async remove(e) {
    let t = await this._folder();
    if (t)
      try {
        await t.doc(`partida_${e}`).delete();
      } catch {}
    removeLocal(`partida.${e}`);
  }
  async exportSlot(e) {
    let t = await this._read(e);
    if (!t) return !1;
    let a = `marca-de-granito_${(t.meta?.hero || 'partida').replace(/[^\w-]+/g, '_')}_${e}.json`,
      n = JSON.stringify(t),
      s = await getCap('downloads');
    if (s)
      try {
        return (await s.save({ filename: a, data: n }), !0);
      } catch {
        return !1;
      }
    let i = document.createElement('a');
    return (
      (i.href = URL.createObjectURL(new Blob([n], { type: 'application/json' }))),
      (i.download = a),
      i.click(),
      setTimeout(() => URL.revokeObjectURL(i.href), 2e3),
      !0
    );
  }
  async importFile(e, t = '1') {
    let a = JSON.parse(await e.text());
    if (!a?.data) throw new Error('No es una partida de Marca de Granito');
    return ((this.cp = typeof a.data == 'string' ? JSON.parse(a.data) : a.data), await this.save(t), this.cp);
  }
};

export { Store };
