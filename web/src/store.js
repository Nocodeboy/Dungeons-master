// store.js — Estado persistente (game.store): ajustes, campaña activa y partidas guardadas.
// Los ajustes van a localStorage (prefijo «mdg.»); las partidas, a la capacidad «db» del artefacto
// (colección data/users/<id>) si existe y, si no, a localStorage. `store.cp` es la campaña del núcleo
// de reglas más los campos propios de la web (flags, journal, levels, location, story, web).
// Emite por el bus «game:start», «cp:changed», «flag:set», «settings:changed», «game:saved», «game:loaded».

import { getCap, getUserId } from './caps.js';

/** Prefijo de las claves de localStorage y ajustes por defecto. */
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
/** Lee y decodifica `mdg.<key>` de localStorage, o devuelve `fallback`. */
function loadLocal(key, fallback = null) {
  try {
    let raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
/** Guarda `value` como JSON en `mdg.<key>`; devuelve si se pudo. */
function saveLocal(key, value) {
  try {
    return (localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)), !0);
  } catch {
    return !1;
  }
}
/** Borra `mdg.<key>` de localStorage. */
function removeLocal(key) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {}
}
/** Ajustes, campaña activa (`cp`) y ranuras de guardado. */
var Store = class {
  constructor(bus) {
    ((this.bus = bus),
      (this.cp = null),
      (this.settings = { ...DEFAULT_SETTINGS, ...(loadLocal('settings', {}) || {}) }),
      (this._dbFolder = null));
  }
  /** Empieza una campaña nueva: completa los campos web y emite «game:start». */
  start(cp) {
    ((cp.flags ??= {}),
      (cp.journal ??= []),
      (cp.levels ??= {}),
      (cp.location ??= {}),
      (cp.story ??= {}),
      (cp.web = { version: 1 }),
      (this.cp = cp),
      this.bus.emit('game:start', { cp }));
  }
  /** Sustituye la campaña por la que devuelve el núcleo conservando los campos web; emite «cp:changed». */
  set(cp) {
    if (!(!cp || cp.error)) {
      for (let key of ['story', 'web', 'levels', 'flags', 'journal', 'location'])
        cp[key] === void 0 && this.cp?.[key] !== void 0 && (cp[key] = this.cp[key]);
      ((this.cp = cp), this.bus.emit('cp:changed', { cp }));
    }
  }
  /** Valor de una bandera de historia. */
  flag(name) {
    return this.cp?.flags?.[name];
  }
  /** Pone una bandera de historia y emite «flag:set» si cambia. */
  setFlag(name, value = !0) {
    if (!this.cp) return;
    let old = this.cp.flags[name];
    ((this.cp.flags[name] = value), old !== value && this.bus.emit('flag:set', { name, value, old }));
  }
  /** Estado guardado de un nivel (se crea vacío si no existe). */
  levelState(level) {
    return this.cp ? ((this.cp.levels[level] ??= {}), this.cp.levels[level]) : {};
  }
  /** Mezcla `patch` en los ajustes, los guarda y emite «settings:changed». */
  saveSettings(patch = {}) {
    (Object.assign(this.settings, patch),
      saveLocal('settings', this.settings),
      this.bus.emit('settings:changed', { settings: this.settings, patch }));
  }
  /** Colección de la nube del usuario (capacidad «db»), o false si no hay. */
  async _folder() {
    if (this._dbFolder !== null) return this._dbFolder;
    let db = await getCap('db'),
      userId = db ? await getUserId() : null;
    return ((this._dbFolder = db && userId ? db.collection(`data/users/${userId}`) : !1), this._dbFolder);
  }
  /** ¿Se guarda en la nube? */
  async cloud() {
    return !!(await this._folder());
  }
  /** Resumen de la partida actual para la lista de ranuras. */
  meta(slot) {
    let cp = this.cp,
      hero = cp?.members?.hero || {};
    return {
      slot: String(slot),
      hero: hero.name || 'Sin nombre',
      cls: hero.class || '',
      level: cp?.party_level || 1,
      place: cp?.location?.name || cp?.location?.level || '',
      day: cp?.day || 1,
      playtime: Math.round(cp?.playtime || 0),
      party: (cp?.party || []).map((id) => cp.members?.[id]?.name || id),
      savedAt: new Date().toISOString(),
    };
  }
  /** Guarda la campaña en la ranura (nube y, si falla, localStorage); emite «game:saved». */
  async save(slot = 'auto') {
    if (!this.cp) return !1;
    let meta = this.meta(slot),
      record = { meta, data: JSON.stringify(this.cp) },
      folder = await this._folder(),
      ok = !1;
    if (folder)
      try {
        (await folder.doc(`partida_${slot}`).set(record), (ok = !0));
      } catch (err) {
        console.warn('[guardado] nube:', err?.code || err);
      }
    return (
      ok || (ok = saveLocal(`partida.${slot}`, record)),
      ok && this.bus.emit('game:saved', { slot, meta }),
      ok
    );
  }
  /** Lee el registro { meta, data } de una ranura (nube primero). */
  async _read(slot) {
    let folder = await this._folder();
    if (folder)
      try {
        let doc = await folder.doc(`partida_${slot}`).get();
        if (doc.exists) return doc.data();
      } catch (err) {
        console.warn('[guardado] nube:', err?.code || err);
      }
    return loadLocal(`partida.${slot}`);
  }
  /** Carga la campaña de una ranura y emite «game:loaded»; null si no existe. */
  async load(slot) {
    let record = await this._read(slot);
    if (!record) return null;
    let cp = typeof record.data == 'string' ? JSON.parse(record.data) : record.data;
    return ((this.cp = cp), this.bus.emit('game:loaded', { slot, cp }), cp);
  }
  /** Ranuras guardadas (nube y locales), de la más reciente a la más antigua. */
  async list() {
    let found = new Map(),
      folder = await this._folder();
    if (folder)
      try {
        let snapshot = await folder.get();
        for (let doc of snapshot.docs || []) {
          let match = /^partida_(.+)$/.exec(doc.id);
          match && found.set(match[1], doc.data().meta);
        }
      } catch (err) {
        console.warn('[guardado] nube:', err?.code || err);
      }
    try {
      for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i),
          match = key && new RegExp(`^${STORAGE_PREFIX}partida\\.(.+)$`).exec(key);
        match && !found.has(match[1]) && found.set(match[1], loadLocal(`partida.${match[1]}`)?.meta);
      }
    } catch {}
    return [...found.entries()]
      .filter(([, meta]) => meta)
      .map(([slot, meta]) => ({ slot, meta }))
      .sort((a, b) => String(b.meta.savedAt).localeCompare(String(a.meta.savedAt)));
  }
  /** Borra una ranura de la nube y de localStorage. */
  async remove(slot) {
    let folder = await this._folder();
    if (folder)
      try {
        await folder.doc(`partida_${slot}`).delete();
      } catch {}
    removeLocal(`partida.${slot}`);
  }
  /** Descarga una ranura como .json (capacidad «downloads» o enlace temporal). */
  async exportSlot(slot) {
    let record = await this._read(slot);
    if (!record) return !1;
    let filename = `marca-de-granito_${(record.meta?.hero || 'partida').replace(/[^\w-]+/g, '_')}_${slot}.json`,
      json = JSON.stringify(record),
      downloads = await getCap('downloads');
    if (downloads)
      try {
        return (await downloads.save({ filename, data: json }), !0);
      } catch {
        return !1;
      }
    let link = document.createElement('a');
    return (
      (link.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }))),
      (link.download = filename),
      link.click(),
      setTimeout(() => URL.revokeObjectURL(link.href), 2e3),
      !0
    );
  }
  /** Importa una partida desde un archivo .json y la guarda en `slot`. */
  async importFile(file, slot = '1') {
    let record = JSON.parse(await file.text());
    if (!record?.data) throw new Error('No es una partida de Marca de Granito');
    return ((this.cp = typeof record.data == 'string' ? JSON.parse(record.data) : record.data), await this.save(slot), this.cp);
  }
};

export { Store };
