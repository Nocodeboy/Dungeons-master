// combat/hud.js
// Reconstruido de publicado/juego.js (módulo __esm «qm»). Nombres locales aún minificados.

import {
  ACESFilmicToneMapping,
  AmbientLight,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import combatCss from './combat.css';

function oH() {
  return (
    f1 ||
      (f1 = fetch(new URL('icons.json', document.baseURI))
        .then((o) => o.json())
        .then((o) => {
          Tc = o;
        })
        .catch(() => {
          Tc = {};
        })),
    f1
  );
}
function WS(o) {
  return `<svg viewBox="0 0 512 512" aria-hidden="true" focusable="false">${(Tc && (Tc[o] || Tc.magic)) || ''}</svg>`;
}
function Bm(o) {
  return rH[o] || o;
}
function cr(o) {
  return o
    ? o.name.startsWith('Maese ')
      ? o.name.slice(6)
      : o.team === 0
        ? o.name.split(' ')[0]
        : o.name
    : '';
}
function Kr(o) {
  return String(o).replace(/[&<>"]/g, (e) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[e]);
}
function cH(o) {
  return window.CSS && window.CSS.escape ? window.CSS.escape(o) : String(o).replace(/"/g, '\\"');
}
function Ec(o) {
  return Number.isInteger(o) ? String(o) : o.toFixed(1).replace('.', ',');
}
const mn = new Vector3();
let Tc = null;
let f1 = null;
const XS = {
  fighter: 'Guerrero',
  rogue: 'P\xEDcaro',
  cleric: 'Cl\xE9rigo',
  wizard: 'Mago',
  barbarian: 'B\xE1rbaro',
  bard: 'Bardo',
  druid: 'Druida',
  monk: 'Monje',
  paladin: 'Palad\xEDn',
  ranger: 'Explorador',
  sorcerer: 'Hechicero',
  warlock: 'Brujo',
};
const sH = {
  fighter: 'Guerrera',
  cleric: 'Cl\xE9riga',
  wizard: 'Maga',
  barbarian: 'B\xE1rbara',
  ranger: 'Exploradora',
  sorcerer: 'Hechicera',
  warlock: 'Bruja',
  rogue: 'P\xEDcara',
};
const iH = new Set(['brenna', 'ilyra']);
const rH = {
  prone: 'Derribado',
  frightened: 'Asustado',
  poisoned: 'Envenenado',
  restrained: 'Apresado',
  grappled: 'Agarrado',
  incapacitated: 'Incapacitado',
  unconscious: 'Inconsciente',
  paralyzed: 'Paralizado',
  stunned: 'Aturdido',
  blinded: 'Cegado',
  charmed: 'Hechizado',
  deafened: 'Ensordecido',
  invisible: 'Invisible',
  petrified: 'Petrificado',
  exhaustion: 'Agotamiento',
};
const lH = (o) => `
${o ? '<header id="cb-marca" class="hud placa"><h1>Marca de Granito</h1><p id="cb-marca-sub"></p><a href="./">\u2190 Volver a la posada</a></header>' : ''}
<div id="cb-rotulos" aria-hidden="true"></div>
<div id="cb-flotantes" aria-hidden="true"></div>
<div id="cb-iniciativa" class="hud placa" aria-label="Orden de iniciativa"><span id="cb-ronda">Ronda 1</span><ol id="cb-iniciativa-lista"></ol></div>
<div id="cb-pensando" class="hud" aria-live="polite"></div>
<div id="cb-arriba" class="hud">
  <button id="cb-b-girar-izq" class="boton-icono placa solo-escritorio" type="button" title="Girar la c\xE1mara (Q)" aria-label="Girar la c\xE1mara a la izquierda" data-icon="undo"></button>
  <button id="cb-b-girar-der" class="boton-icono placa solo-escritorio" type="button" title="Girar la c\xE1mara (E)" aria-label="Girar la c\xE1mara a la derecha" data-icon="redo"></button>
  <button id="cb-b-centrar" class="boton-icono placa" type="button" title="Centrar en quien tiene el turno (C)" aria-label="Centrar la c\xE1mara" data-icon="target"></button>
  <button id="cb-b-rapido" class="boton-icono placa" type="button" title="Turnos enemigos r\xE1pidos (F)" aria-label="Turnos enemigos r\xE1pidos" aria-pressed="false" data-icon="fast"></button>
  <button id="cb-b-registro" class="boton-icono placa solo-escritorio" type="button" title="Registro del combate (L)" aria-label="Mostrar u ocultar el registro" aria-expanded="true" data-icon="log"></button>
</div>
<aside id="cb-registro" class="hud placa" aria-label="Registro del combate"><h2>Registro</h2><div id="cb-registro-lista" aria-live="polite"></div></aside>
<nav id="cb-grupo" class="hud" aria-label="El grupo"></nav>
<div id="cb-indicacion" class="hud placa" role="status"><span id="cb-indicacion-texto"></span><button id="cb-b-extra" class="boton principal" type="button" hidden></button><button id="cb-b-cancelar" class="boton" type="button" hidden>Cancelar</button></div>
<section id="cb-hoja" class="hud placa" hidden aria-labelledby="cb-hoja-titulo"><div class="hoja-cab"><h2 id="cb-hoja-titulo"></h2><button id="cb-hoja-cerrar" class="boton" type="button">Cerrar</button></div><div id="cb-hoja-lista"></div></section>
<section id="cb-prevista" class="hud placa" hidden aria-live="polite"><div id="cb-prevista-texto"></div><div id="cb-prevista-armas"></div><div class="prevista-pie"><button id="cb-prevista-no" class="boton" type="button">Cancelar</button><button id="cb-prevista-ok" class="boton principal" type="button">Atacar</button></div></section>
<section id="cb-turno" class="hud placa" aria-label="Tu turno">
  <div class="turno-cab">
    <span id="cb-turno-nombre"></span>
    <span id="cb-r-accion" class="recurso">Acci\xF3n</span>
    <span id="cb-r-adicional" class="recurso">Adicional</span>
    <span id="cb-r-reaccion" class="recurso">Reacci\xF3n</span>
    <span class="mov"><span data-icon="footsteps"></span><span class="mov-pista"><span id="cb-mov-barra"></span></span><span id="cb-r-mov">9 m</span></span>
  </div>
  <div class="acciones">
    <button id="cb-b-atacar" class="accion" type="button" title="Atacar (o haz clic en un enemigo)"><kbd>1</kbd><span data-icon="attack"></span><span>Atacar</span></button>
    <button id="cb-b-conjuros" class="accion" type="button"><kbd>2</kbd><span data-icon="spells"></span><span>Conjuros</span></button>
    <button id="cb-b-habilidades" class="accion" type="button"><kbd>3</kbd><span data-icon="features"></span><span>Habilidades</span></button>
    <button id="cb-b-acciones" class="accion" type="button"><kbd>4</kbd><span data-icon="actions"></span><span>Acciones</span></button>
    <button id="cb-b-objetos" class="accion" type="button"><kbd>5</kbd><span data-icon="potion"></span><span>Objetos</span></button>
    <button id="cb-b-deshacer" class="accion" type="button" title="Deshacer el \xFAltimo movimiento (Z)"><span data-icon="undo"></span><span>Deshacer</span></button>
    <button id="cb-b-fin" class="accion" type="button" title="Terminar el turno (espacio)"><span data-icon="end_turn"></span><span>Fin del turno</span></button>
  </div>
</section>
<div id="cb-cartel" class="hud" aria-live="assertive"></div>
<div id="cb-gran" class="hud" aria-live="assertive"></div>
<div id="cb-ficha" class="hud placa"></div>
<div id="cb-nota" class="hud"></div>
${
  o
    ? `
<section id="cb-intro" class="hud placa modal" hidden aria-labelledby="cb-intro-titulo">
  <h2 id="cb-intro-titulo"></h2><p id="cb-intro-lugar" class="lugar"></p><div id="cb-intro-texto"></div>
  <details id="cb-prueba"><summary>Banco de pruebas: otro encuentro, otro grupo</summary><div class="prueba-filas"></div></details>
  <div class="pie"><span class="ayuda">Clic en una casilla azul para moverte, en un enemigo para atacar. Rueda: zoom \xB7 bot\xF3n derecho: girar \xB7 Q/E: girar \xB7 1\u20135: men\xFAs.</span>
  <span style="display:flex; gap:8px"><button id="cb-intro-saltar" class="boton" type="button">Saltar</button><button id="cb-intro-seguir" class="boton principal" type="button">Seguir</button></span></div>
</section>
<section id="cb-final" class="hud placa modal" hidden aria-labelledby="cb-final-titulo">
  <h2 id="cb-final-titulo"></h2><div id="cb-final-texto"></div>
  <div class="pie"><a class="boton" href="./">Volver a la posada</a><button id="cb-final-otra" class="boton principal" type="button">Jugar otra vez</button></div>
  <p class="ayuda">Reglas: SRD 5.2.1 (CC BY 4.0), el mismo n\xFAcleo de reglas del juego compilado a WebAssembly. Modelos de Poly Haven y Quaternius (CC0); iconos de game-icons.net (CC BY 3.0).</p>
</section>`
    : ''
}`;
let YS = !1;
const Hud = class {
  constructor(e = document.body, { standalone: t = !1, portrait: a = null } = {}) {
    if (!YS) {
      let n = document.createElement('style');
      ((n.dataset.area = 'combate'), (n.textContent = combatCss), document.head.appendChild(n), (YS = !0));
    }
    ((this.root = document.createElement('div')),
      (this.root.className = 'mdg-combate'),
      (this.root.style.pointerEvents = 'none'),
      (this.root.innerHTML = lH(t)),
      e.appendChild(this.root),
      (this.standalone = t),
      t ||
        (this.root.classList.add('oculto'),
        requestAnimationFrame(() => requestAnimationFrame(() => this.root.classList.remove('oculto')))),
      (this.portraitFn = a),
      (this.labels = new Map()),
      (this.floats = []),
      (this.cards = new Map()),
      (this.chips = new Map()),
      (this.portraits = {}),
      (this.initRolls = {}),
      (this.surprised = new Set()),
      oH().then(() => this.paintIcons()));
  }
  $(e) {
    return this.root.querySelector(e);
  }
  paintIcons() {
    for (let e of this.root.querySelectorAll('[data-icon]'))
      e.dataset.painted ||
        ((e.dataset.painted = '1'), e.insertAdjacentHTML('afterbegin', WS(e.dataset.icon)));
  }
  visible(e) {
    this.root.classList.toggle('oculto', !e);
  }
  dispose() {
    (clearTimeout(this._banner),
      clearTimeout(this._big),
      clearTimeout(this._tip),
      this.root.classList.add('oculto'));
    let e = this.root;
    setTimeout(() => e.remove(), 400);
  }
  bind(e) {
    this.ctl = e;
    let t = (a, n) => this.$(a)?.addEventListener('click', n);
    (t('#cb-b-atacar', () => e.menu('attack')),
      t('#cb-b-conjuros', () => e.menu('spells')),
      t('#cb-b-habilidades', () => e.menu('features')),
      t('#cb-b-acciones', () => e.menu('actions')),
      t('#cb-b-objetos', () => e.menu('items')),
      t('#cb-b-deshacer', () => e.undoMove()),
      t('#cb-b-fin', () => e.mode !== 'busy' && e.endTurn()),
      t('#cb-b-cancelar', () => e.cancelPending()),
      t('#cb-prevista-no', () => e.cancelPending()),
      t('#cb-b-rapido', () => this.toggleFast()),
      t('#cb-b-girar-izq', () => e.rotate(0.5)),
      t('#cb-b-girar-der', () => e.rotate(-0.5)),
      t('#cb-b-centrar', () => e.centerOnCurrent()),
      t('#cb-b-registro', () => this.toggleLog()),
      t('#cb-hoja-cerrar', () => this.closeSheet()));
  }
  toggleFast() {
    let e = !this.ctl.fast;
    (this.ctl.setFast(e), this.$('#cb-b-rapido').setAttribute('aria-pressed', String(e)));
  }
  toggleLog() {
    let e = this.$('#cb-registro');
    (e.classList.toggle('plegado'),
      this.$('#cb-b-registro').setAttribute('aria-expanded', String(!e.classList.contains('plegado'))));
  }
  setup(e, t, a = null) {
    ((this.units = t),
      this.standalone && a && (this.$('#cb-marca-sub').textContent = `${a.name} \xB7 ${a.place || ''}`));
    let n = this.$('#cb-grupo');
    ((n.innerHTML = ''), this.cards.clear());
    for (let i of e.creatures.filter((r) => r.team === 0)) this.addCard(i);
    let s = this.$('#cb-rotulos');
    ((s.innerHTML = ''), this.labels.clear());
    for (let i of e.creatures) this.addLabel(i);
    ((this.state = e), this.renderPortraits(t), this.refresh(e));
  }
  addCard(e) {
    let t = document.createElement('button');
    ((t.type = 'button'), (t.className = 'pj'));
    let a = (iH.has(e.id) ? sH[e.cls] : null) || XS[e.cls] || e.cls || '';
    ((t.innerHTML = `
      <span class="auto" role="switch" aria-checked="false" title="Que lo juegue la IA" data-icon="auto"></span>
      <span class="marco"><img alt="" data-retrato="${e.id}"><span class="ca" title="Clase de armadura">${e.ac}</span></span>
      <span class="datos">
        <span class="nombre">${cr(e)}</span>
        <span class="rol">${a}${e.level ? ` \xB7 nivel ${e.level}` : ''}</span>
        <span class="vida" role="meter" aria-label="Puntos de golpe"><span class="relleno"></span><span class="temp"></span><span class="cifra"></span></span>
        <span class="espacios"></span>
        <span class="estados"></span>
      </span>`),
      t.addEventListener('click', (n) => {
        if (n.target.closest('.auto')) {
          (n.stopPropagation(), this.ctl.toggleAuto(e.id));
          return;
        }
        let s = this.units?.byId.get(e.id);
        s && this.ctl.focusUnit(s, null, !0);
      }),
      this.$('#cb-grupo').appendChild(t),
      this.cards.set(e.id, t),
      Tc && this.paintIcons());
  }
  addLabel(e) {
    let t = document.createElement('div');
    ((t.className = `rotulo ${e.team === 0 ? 'de-grupo' : 'de-enemigo'}`),
      (t.innerHTML = `<b>${cr(e)}</b><span class="mini"><span></span></span>`),
      this.$('#cb-rotulos').appendChild(t),
      this.labels.set(e.id, t));
  }
  async renderPortraits(e) {
    let t = e.list;
    this.portraitFn &&
      (await Promise.all(
        t.map(async (n) => {
          try {
            this.portraits[n.id] = await this.portraitFn(n);
          } catch {}
        }),
      ));
    let a = t.filter((n) => !this.portraits[n.id]);
    a.length && this.renderOwnPortraits(a);
    for (let [n, s] of Object.entries(this.portraits))
      for (let i of this.root.querySelectorAll(`img[data-retrato="${cH(n)}"]`)) i.src = s;
    this.buildInitiative();
  }
  renderOwnPortraits(e) {
    let n;
    try {
      n = new WebGLRenderer({ antialias: !0, alpha: !0, preserveDrawingBuffer: !0 });
    } catch {
      return;
    }
    (n.setSize(168, 200), (n.toneMapping = ACESFilmicToneMapping), (n.toneMappingExposure = 1.15));
    let s = new Map();
    for (let i of e) {
      let r = i.team === 0 ? i.id : i.template;
      if (s.has(r)) {
        this.portraits[i.id] = s.get(r);
        continue;
      }
      try {
        (i.ch.mixer?.update(0.01), i.root.updateMatrixWorld(!0));
        let l = new Scene(),
          c = clone(i.root);
        (c.position.set(0, 0, 0),
          c.rotation.set(0, 0, 0),
          c.traverse((x) => {
            (x.isLight && (x.intensity = 0), (x.isSprite || x.isPoints) && (x.visible = !1));
          }),
          l.add(c),
          c.updateMatrixWorld(!0));
        let d = c.getObjectByName('Head');
        if (!d) continue;
        let u = d.getWorldPosition(new Vector3()),
          h = i.scale || 1,
          p = new DirectionalLight(16765600, 3);
        p.position.set(1.2, u.y + 1.2, 2.2);
        let m = new DirectionalLight(7309e3, 1.1);
        m.position.set(-2, u.y + 0.5, 0.5);
        let _ = new DirectionalLight(16754784, 2.2);
        (_.position.set(-0.6, u.y + 1, -2.5), l.add(p, m, _, new AmbientLight(2760752, 1.2)));
        let b = !c.getObjectByName('hand_r'),
          f = new PerspectiveCamera(24, 168 / 200, 0.02, 20);
        (b
          ? (f.position.set(u.x + 0.95 * h, u.y + 0.3 * h, u.z + 1.55 * h),
            f.lookAt(u.x, u.y - 0.12 * h, u.z - 0.15 * h))
          : (f.position.set(0.22 * h, u.y + 0.06 * h, 0.95 * h), f.lookAt(0, u.y - 0.03 * h, 0)),
          n.render(l, f));
        let v = n.domElement.toDataURL('image/png');
        (s.set(r, v), (this.portraits[i.id] = v));
      } catch (l) {
        console.warn('[combate] retrato', i.id, l);
      }
    }
    (n.dispose(), n.forceContextLoss?.());
  }
  buildInitiative() {
    if (!this.state) return;
    this._orderKey = '';
    let e = this.$('#cb-iniciativa-lista');
    ((e.innerHTML = ''), this.chips.clear());
    for (let t of this.state.order) {
      let a = this.state.creatures.find((n) => n.id === t);
      a && this.addChip(a);
    }
    ((this.sep = document.createElement('li')),
      (this.sep.className = 'ficha ronda-nueva'),
      (this.sep.title = 'Ronda siguiente'),
      this.refresh(this.state));
  }
  addChip(e) {
    let t = document.createElement('li');
    ((t.className = `ficha ${e.team === 0 ? 'de-grupo' : 'de-enemigo'}`),
      (t.title = e.name),
      (t.innerHTML = `<img alt="" src="${this.portraits[e.id] || ''}"><span class="ini"></span><span class="mini"><span></span></span>`),
      t.addEventListener('click', () => {
        let a = this.units?.byId.get(e.id);
        a && this.ctl.focusUnit(a, null, !0);
      }),
      t.addEventListener('mouseenter', () => this.ctl?.highlight?.(e.id, !0)),
      t.addEventListener('mouseleave', () => this.ctl?.highlight?.(e.id, !1)),
      this.$('#cb-iniciativa-lista').appendChild(t),
      this.chips.set(e.id, t),
      (this._orderKey = ''));
  }
  setAuto(e, t) {
    let a = this.cards.get(e);
    a && (a.classList.toggle('ia', t), a.querySelector('.auto')?.setAttribute('aria-checked', String(t)));
  }
  setInitiative(e, t) {
    this.initRolls[e] = t;
    let a = this.chips.get(e);
    a && (a.querySelector('.ini').textContent = t);
  }
  setSurprised(e) {
    this.surprised = new Set(e || []);
    for (let [t, a] of this.chips) a.classList.toggle('sorpresa', this.surprised.has(t));
  }
  orderChips(e) {
    let t = this.$('#cb-iniciativa-lista'),
      a = (e.order || []).filter((l) => this.chips.has(l)),
      n = Math.max(0, a.indexOf(e.current)),
      s = [...a.slice(n), ...a.slice(0, n)],
      i = `${s.join(',')}|${a.length - n}`;
    if (i === this._orderKey) return;
    this._orderKey = i;
    let r = document.createDocumentFragment();
    (s.forEach((l, c) => {
      (c === a.length - n && c > 0 && this.sep && r.appendChild(this.sep), r.appendChild(this.chips.get(l)));
    }),
      t.appendChild(r),
      (t.scrollLeft = 0));
  }
  refresh(e) {
    ((this.state = e), !this.chips.size && Object.keys(this.portraits).length && this.buildInitiative());
    for (let t of e.creatures) {
      (this.labels.has(t.id) || this.addLabel(t),
        t.team === 0 && !this.cards.has(t.id) && t.is_pc !== !1 && !t.summon && this.addCard(t),
        this.chips.size && !this.chips.has(t.id) && (e.order || []).includes(t.id) && this.addChip(t));
      let a = this.cards.get(t.id),
        n = Math.max(0, t.hp) / Math.max(1, t.max_hp);
      if (a) {
        ((a.querySelector('.relleno').style.width = `${n * 100}%`),
          (a.querySelector('.temp').style.width =
            `${Math.min(1, (t.temp_hp || 0) / Math.max(1, t.max_hp)) * 100}%`),
          (a.querySelector('.cifra').textContent = t.dead
            ? 'Muerto'
            : t.hp <= 0
              ? `Ca\xEDdo \xB7 ${t.death_successes}\u2713 ${t.death_failures}\u2717`
              : `${t.hp} / ${t.max_hp}${t.temp_hp ? ` +${t.temp_hp}` : ''}`),
          (a.querySelector('.ca').textContent = t.ac),
          a.classList.toggle('caido', t.hp <= 0),
          a.classList.toggle('activo', e.current === t.id));
        let r = [...(t.conditions || []).map(Bm), ...(t.effects || []).map((h) => h.name)];
        (t.concentration && r.push('Concentrado'),
          (a.querySelector('.estados').textContent = r.slice(0, 4).join(' \xB7 ')));
        let l = a.querySelector('.espacios'),
          c = t.slots || [],
          d = t.slots_max || [],
          u = `${c.join(',')}/${d.join(',')}`;
        if (l.dataset.k !== u) {
          l.dataset.k = u;
          let h = '';
          for (let p = 0; p < Math.min(3, d.length); p++)
            for (let m = 0; m < d[p]; m++)
              h += `<i class="${m < (c[p] ?? 0) ? 'lleno' : ''}" title="Espacio de nivel ${p + 1}"></i>`;
          l.innerHTML = h;
        }
      }
      let s = this.chips.get(t.id);
      s &&
        (s.classList.toggle('activo', e.current === t.id),
        s.classList.toggle('fuera', !!t.dead || (t.team !== 0 && t.hp <= 0)),
        (s.querySelector('.mini span').style.width = `${n * 100}%`),
        this.portraits[t.id] &&
          !s.querySelector('img').src &&
          (s.querySelector('img').src = this.portraits[t.id]));
      let i = this.labels.get(t.id);
      i &&
        ((i.querySelector('.mini span').style.width = `${n * 100}%`),
        i.classList.toggle('fuera', !!t.dead),
        i.classList.toggle('herido', n <= 0.5),
        i.classList.toggle('activo', e.current === t.id));
    }
    this.chips.size && this.orderChips(e);
  }
  setActive(e) {
    for (let [t, a] of this.chips) a.classList.toggle('activo', t === e);
    for (let [t, a] of this.cards) a.classList.toggle('activo', t === e);
    for (let [t, a] of this.labels) a.classList.toggle('activo', t === e);
    this.state && this.orderChips({ ...this.state, current: e });
  }
  setHp(e, t, a) {
    let n = this.state?.creatures.find((s) => s.id === e);
    if (n) {
      let s = t < n.hp;
      if (((n.hp = t), a && (n.max_hp = a), this.refresh(this.state), s)) {
        let i = this.cards.get(e);
        i && (i.classList.remove('golpe'), i.offsetWidth, i.classList.add('golpe'));
      }
    }
  }
  round(e) {
    this.$('#cb-ronda').innerHTML = `Ronda ${e}`;
  }
  thinking(e) {
    let t = this.$('#cb-pensando');
    ((t.textContent = e), t.classList.toggle('visible', !!e));
  }
  banner(e, t = 'oro', a = 1e3, n = '') {
    let s = this.$('#cb-cartel');
    ((s.innerHTML = `${Kr(e)}${n ? `<small>${Kr(n)}</small>` : ''}`),
      (s.className = `hud visible ${t}`),
      clearTimeout(this._banner),
      (this._banner = setTimeout(() => {
        s.className = `hud ${t}`;
      }, a)));
  }
  big(e, t = '', a = '', n = 2200) {
    let s = this.$('#cb-gran');
    return (
      (s.innerHTML = `<b>${Kr(e)}</b>${t ? `<span>${Kr(t)}</span>` : ''}`),
      (s.className = `hud visible ${a}`),
      clearTimeout(this._big),
      new Promise((i) => {
        this._big = setTimeout(() => {
          ((s.className = `hud ${a}`), i());
        }, n);
      })
    );
  }
  log(e) {
    let t = document.createElement('p');
    t.innerHTML = e;
    let a = this.$('#cb-registro-lista');
    for (a.appendChild(t); a.children.length > 160;) a.firstChild.remove();
    a.scrollTop = a.scrollHeight;
  }
  turnBar(e, t) {
    let a = this.$('#cb-turno');
    if (!e) {
      a.classList.remove('visible');
      return;
    }
    (a.classList.add('visible'), (this.$('#cb-turno-nombre').textContent = cr(e)));
    let n = e.turn,
      s = (u, h) => this.$(u).classList.toggle('gastado', !h);
    (s('#cb-r-accion', n.action > 0 || n.attack_left > 0),
      s('#cb-r-adicional', n.bonus > 0),
      s('#cb-r-reaccion', n.reaction > 0));
    let i = Math.max(0, n.movement);
    ((this.$('#cb-r-mov').textContent = `${Ec((i / 5) * 1.5)} m`),
      (this.$('#cb-mov-barra').style.width = `${Math.min(100, (i / Math.max(e.speed, 5)) * 100)}%`));
    let r = n.action > 0 || n.attack_left > 0,
      l = (u, h) => {
        this.$(u).disabled = !h;
      };
    l('#cb-b-atacar', r && (t.profiles || []).length > 0);
    let c = t.spells || [];
    ((this.$('#cb-b-conjuros').hidden = !c.length),
      l(
        '#cb-b-conjuros',
        c.some((u) => u.usable),
      ));
    let d = t.features || [];
    ((this.$('#cb-b-habilidades').hidden = !d.length),
      l(
        '#cb-b-habilidades',
        d.some((u) => u.enabled),
      ),
      l(
        '#cb-b-acciones',
        (t.actions || []).some((u) => u.enabled),
      ),
      (this.$('#cb-b-objetos').hidden = !(t.items || []).length),
      l(
        '#cb-b-objetos',
        (t.items || []).some((u) => u.enabled),
      ),
      (this.$('#cb-b-deshacer').hidden = !t.can_undo),
      this.$('#cb-b-fin').classList.toggle('pulsa', !!t.nothing_left || (!r && n.movement < 5)));
  }
  sheet(e, t, a) {
    this.cursorNote('');
    let n = this.$('#cb-hoja');
    this.$('#cb-hoja-titulo').textContent = e;
    let s = this.$('#cb-hoja-lista');
    s.innerHTML = '';
    let i = null;
    for (let r of t) {
      if (r.group && r.group !== i) {
        i = r.group;
        let c = document.createElement('div');
        ((c.className = 'grupo-titulo'), (c.textContent = i), s.appendChild(c));
      }
      let l = document.createElement('button');
      ((l.type = 'button'),
        (l.className = `opcion${r.magic ? ' magia' : ''}`),
        (l.disabled = r.enabled === !1),
        (l.innerHTML = `<span class="opcion-icono">${WS(r.icon || 'magic')}</span><span class="opcion-texto"><b>${r.title}</b><i>${r.desc || ''}</i></span><span class="opcion-coste">${r.cost || ''}${r.note ? `<em>${r.note}</em>` : ''}</span>`),
        l.addEventListener('click', (c) => {
          (c.stopPropagation(), this.closeSheet(), a(r));
        }),
        s.appendChild(l));
    }
    ((n.hidden = !1), s.querySelector('button:not([disabled])')?.focus({ preventScroll: !0 }));
  }
  closeSheet() {
    this.$('#cb-hoja').hidden = !0;
  }
  sheetOpen() {
    return !this.$('#cb-hoja').hidden;
  }
  preview(e, t, a, n, s = [], i = !0, r = null) {
    let l = this.$('#cb-prevista');
    ((this.previewAt = e.clone ? e.clone() : new Vector3(e.x, e.y, e.z)),
      (this.previewAt.y = Math.max(this.previewAt.y, 1.6)));
    let c = t.map((h) => `<p class="${h.t || ''}">${h.s}</p>`).join('');
    (r != null &&
      (c = c.replace(
        /(<\/p>)/,
        `$1<div class="probabilidad" title="Probabilidad de impacto"><span style="width:${Math.round(r * 100)}%"></span></div>`,
      )),
      (this.$('#cb-prevista-texto').innerHTML = c));
    let d = this.$('#cb-prevista-ok');
    ((d.textContent = a), (d.disabled = !i), (this.onConfirm = n), (d.onclick = () => this.confirmPreview()));
    let u = this.$('#cb-prevista-armas');
    u.innerHTML = '';
    for (let h of s) {
      let p = document.createElement('button');
      ((p.type = 'button'),
        (p.className = 'chip'),
        (p.textContent = h.label),
        (p.onclick = h.on),
        u.appendChild(p));
    }
    ((u.hidden = !s.length), (l.hidden = !1));
  }
  confirmPreview() {
    let e = this.onConfirm;
    ((this.onConfirm = null), e && e());
  }
  hidePreview() {
    ((this.$('#cb-prevista').hidden = !0), (this.onConfirm = null));
  }
  previewOpen() {
    return !this.$('#cb-prevista').hidden;
  }
  prompt(e, t = !1, a = null) {
    let n = this.$('#cb-indicacion');
    ((this.$('#cb-indicacion-texto').textContent = e), (this.$('#cb-b-cancelar').hidden = !t));
    let s = this.$('#cb-b-extra');
    (a ? ((s.hidden = !1), (s.textContent = a.label), (s.onclick = a.on)) : (s.hidden = !0),
      n.classList.toggle('visible', !!e));
  }
  tip(e, t, a, n = !1, s = '') {
    let i = this.$('#cb-ficha'),
      r =
        e.team === 0
          ? `${Math.max(0, e.hp)} / ${e.max_hp} PG`
          : e.dead
            ? 'Muerto'
            : e.hp <= 0
              ? 'Ca\xEDdo'
              : e.hp <= e.max_hp / 2
                ? `Malherido \xB7 ${e.hp}/${e.max_hp} PG`
                : `${e.hp}/${e.max_hp} PG`,
      l = [...(e.conditions || []).map(Bm), ...(e.effects || []).map((c) => c.name)];
    ((i.innerHTML = `<b>${Kr(e.name)}</b><span>CA ${e.ac} \xB7 ${r}</span>${l.length ? `<i>${l.join(' \xB7 ')}</i>` : ''}${s}`),
      (i.style.transform = `translate(${Math.min(t + 18, innerWidth - 250)}px, ${Math.max(8, a - 70)}px)`),
      i.classList.add('visible'),
      clearTimeout(this._tip),
      n && (this._tip = setTimeout(() => this.hideTip(), 2600)));
  }
  hideTip() {
    this.$('#cb-ficha').classList.remove('visible');
  }
  cursorNote(e, t, a) {
    let n = this.$('#cb-nota');
    ((n.textContent = e), n.classList.toggle('visible', !!e), e && this.moveCursorNote(t, a));
  }
  cursorNoteVisible() {
    return this.$('#cb-nota').classList.contains('visible');
  }
  moveCursorNote(e, t) {
    this.$('#cb-nota').style.transform = `translate(${e + 16}px, ${t + 14}px)`;
  }
  float(e, t, a = '', n = 1, s = '') {
    let i = document.createElement('div');
    ((i.className = `flota ${a}`),
      (i.innerHTML = `${Kr(String(t))}${s ? `<small>${Kr(s)}</small>` : ''}`),
      i.style.setProperty('--s', n),
      this.$('#cb-flotantes').appendChild(i));
    let r = this.floats.filter((u) => u.pos.distanceTo(e) < 0.6 && u.t < 0.5).length,
      l = /dano|critico|cura/.test(a),
      c = (i.offsetWidth || 80) * n,
      d = (i.offsetHeight || 22) * n;
    for (
      this.floats.push({
        el: i,
        pos: e.clone(),
        t: 0,
        life: 1.5 + n * 0.3,
        lane: r,
        big: l,
        side: l ? (Math.random() - 0.5) * 30 : 0,
        scale: n,
        w: c,
        h: d,
        push: 0,
      });
      this.floats.length > 40;
    )
      this.floats.shift().el.remove();
  }
  place(e, t, a = 1 / 60) {
    let n = t.clientWidth || innerWidth,
      s = t.clientHeight || innerHeight,
      i = [];
    for (let l of this.floats) {
      ((l.t += a),
        mn.copy(l.pos).project(e),
        (l.x = (mn.x * 0.5 + 0.5) * n + l.side * Math.min(1, l.t * 3)),
        (l.z = mn.z));
      let c = (-mn.y * 0.5 + 0.5) * s - l.t * 46 - l.lane * 24 - l.push;
      if (l.t < 0.6) {
        for (let d of i)
          if (Math.abs(d.x - l.x) < (d.w + l.w) * 0.5 - 4 && Math.abs(d.y - c) < (d.h + l.h) * 0.5) {
            let u = c - (d.y - (d.h + l.h) * 0.5);
            ((l.push += u), (c -= u));
          }
      }
      ((l.y = c), i.push(l));
    }
    for (let l = this.floats.length - 1; l >= 0; l--) {
      let c = this.floats[l];
      mn.z = c.z;
      let d = c.x,
        u = c.y,
        h = c.t < 0.12 ? c.t / 0.12 : Math.max(0, 1 - (c.t - c.life * 0.6) / (c.life * 0.4)),
        p = c.big ? 1 + 0.7 * Math.exp(-c.t * 10) : 1;
      ((c.el.style.transform = `translate(${d.toFixed(1)}px, ${u.toFixed(1)}px) translate(-50%, -100%) scale(${(c.scale * p).toFixed(3)})`),
        (c.el.style.opacity = h.toFixed(3)),
        (c.t >= c.life || mn.z > 1) && (c.el.remove(), this.floats.splice(l, 1)));
    }
    if (this.units)
      for (let [l, c] of this.labels) {
        let d = this.units.byId.get(l);
        if (!d || !d.root.visible) {
          c.style.visibility = 'hidden';
          continue;
        }
        (d.headWorld(mn),
          (mn.y += 0.38 * (d.scale || 1)),
          mn.project(e),
          (c.style.visibility = mn.z < 1 ? 'visible' : 'hidden'),
          (c.style.transform = `translate(${((mn.x * 0.5 + 0.5) * n).toFixed(1)}px, ${((-mn.y * 0.5 + 0.5) * s).toFixed(1)}px) translate(-50%, -100%)`));
      }
    let r = this.$('#cb-prevista');
    if (this.previewAt && !r.hidden) {
      mn.copy(this.previewAt).project(e);
      let l = r.offsetWidth,
        c = r.offsetHeight,
        d = (mn.x * 0.5 + 0.5) * n + 30,
        u = (-mn.y * 0.5 + 0.5) * s - c / 2;
      (d + l > n - 12 && (d = (mn.x * 0.5 + 0.5) * n - l - 30), (d = Math.max(12, Math.min(d, n - l - 12))));
      let h = Math.max(70, Math.min(u, s - c - 150));
      r.style.transform = `translate(${d.toFixed(0)}px, ${h.toFixed(0)}px)`;
    }
  }
  progress(e) {
    let t = document.getElementById('carga-barra');
    t && (t.style.transform = `scaleX(${Math.max(0.04, e)})`);
  }
  stage(e) {
    let t = document.getElementById('carga-texto');
    t && !this._stuck && (t.textContent = `${e}\u2026`);
  }
  stuck(e, t) {
    this._stuck = !0;
    let a = document.getElementById('carga-texto');
    if (a) {
      a.textContent = e;
      for (let n of t) {
        let s = document.createElement('p');
        ((s.className = 'carga-detalle'), (s.textContent = n), a.after(s));
      }
    }
  }
  fail(e) {
    let t = document.getElementById('carga-texto');
    t && (t.textContent = `No se ha podido preparar el combate: ${String(e.message).slice(0, 200)}`);
  }
  ready() {
    (document.body.classList.add('lista'), setTimeout(() => document.getElementById('carga')?.remove(), 900));
  }
  intro(e) {
    let t = this.$('#cb-intro');
    if (!t) return Promise.resolve();
    ((this.$('#cb-intro-titulo').textContent = e.name),
      (this.$('#cb-intro-lugar').textContent = e.place || ''));
    let a = e.intro || [],
      n = this.$('#cb-intro-texto'),
      s = 0,
      i = (e.tips || []).slice(0, 3),
      r = matchMedia('(pointer: coarse)').matches,
      l = () => {
        ((n.innerHTML =
          a
            .slice(0, s + 1)
            .map((c) => `<p>${c}</p>`)
            .join('') +
          (s >= a.length - 1 && i.length
            ? `<ul class="consejos">${i
                .map(
                  (c) =>
                    `<li>${
                      r
                        ? c
                        : c
                            .replace(/^Toca /, 'Haz clic en ')
                            .replace(/ Toca /g, ' Haz clic en ')
                            .replace('Vuelve a tocarlo', 'Vuelve a hacer clic')
                    }</li>`,
                )
                .join('')}</ul>`
            : '')),
          (this.$('#cb-intro-seguir').textContent = s < a.length - 1 ? 'Seguir' : '\xA1A las armas!'));
      };
    return (
      l(),
      this.testPicker(),
      (t.hidden = !1),
      new Promise((c) => {
        ((this.$('#cb-intro-seguir').onclick = () => {
          if (s < a.length - 1) {
            (s++, l());
            return;
          }
          ((t.hidden = !0), c());
        }),
          (this.$('#cb-intro-saltar').onclick = () => {
            ((t.hidden = !0), c());
          }));
      })
    );
  }
  testPicker() {
    let e = this.$('#cb-prueba .prueba-filas');
    if (!e || e.childElementCount) return;
    let t = new URLSearchParams(location.search),
      a = [
        ['brenna', 'Brenna (guerrera)'],
        ['pip', 'Pip (p\xEDcaro)'],
        ['ilyra', 'Ilyra (cl\xE9riga)'],
        ['odvar', 'Odvar (mago)'],
        ...Object.entries(XS).map(([r, l]) => [r, l]),
      ],
      n = (t.get('grupo') || 'brenna,pip,ilyra,odvar').split(','),
      s = (r, l, c) =>
        `<label>${r}<select>${l.map(([d, u]) => `<option value="${d}"${d === c ? ' selected' : ''}>${u}</option>`).join('')}</select></label>`,
      i = s(
        'Encuentro',
        [
          ['e1_prado', 'El toro que sangra'],
          ['e2_pinar', 'Lobos en Elderhal'],
          ['e3_tumulo', 'El t\xFAmulo'],
        ],
        t.get('encuentro') || 'e1_prado',
      );
    for (let r = 0; r < 4; r++) i += s(`Miembro ${r + 1}`, [['', '\u2014'], ...a], n[r] || '');
    ((i += s(
      'Nivel',
      [
        ['', 'del encuentro'],
        ['1', '1'],
        ['2', '2'],
        ['3', '3'],
      ],
      t.get('nivel') || '',
    )),
      (i += '<button class="boton principal" type="button">Probar</button>'),
      (e.innerHTML = i),
      (e.querySelector('button').onclick = () => {
        let r = [...e.querySelectorAll('select')].map((d) => d.value),
          l = new URL(location.href);
        l.searchParams.set('encuentro', r[0]);
        let c = r.slice(1, 5).filter(Boolean);
        (c.length ? l.searchParams.set('grupo', c.join(',')) : l.searchParams.delete('grupo'),
          r[5] ? l.searchParams.set('nivel', r[5]) : l.searchParams.delete('nivel'),
          l.searchParams.delete('semilla'),
          (location.href = l.toString()));
      }));
  }
  finish({ won: e, rounds: t, encounter: a, party: n }) {
    let s = this.$('#cb-final');
    if (!s) return;
    ((this.$('#cb-final-titulo').textContent = e ? '\xA1Victoria!' : 'Derrota'),
      s.classList.toggle('derrota', !e));
    let i = a.outro,
      r = [];
    (e && i && (r = Array.isArray(i) ? i : typeof i == 'string' ? [i] : [i.win || '']),
      e ||
        (r = [
          typeof i == 'object' && i?.lose
            ? i.lose
            : 'El grupo cae. Esta vez nadie podr\xE1 contarlo en la posada.',
        ]),
      (this.$('#cb-final-texto').innerHTML = `${r
        .filter(Boolean)
        .map((l) => `<p>${l}</p>`)
        .join(
          '',
        )}<p class="apagado">${t} ${t === 1 ? 'ronda' : 'rondas'} \xB7 ${n.map((l) => `${cr(l)} ${l.dead ? '(muerto)' : l.hp <= 0 ? '(ca\xEDdo)' : `${l.hp}/${l.max_hp}`}`).join(' \xB7 ')}</p>`),
      (s.hidden = !1),
      (this.$('#cb-final-otra').onclick = () => {
        let l = new URL(location.href);
        (l.searchParams.delete('semilla'), (location.href = l.toString()));
      }));
  }
};

export { Bm, Ec, Hud, cr };
