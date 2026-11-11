// combat/hud.js — Interfaz HTML del combate (`.mdg-combate`, ids «cb-*»).
// Iniciativa con retratos, tarjetas del grupo (PG, espacios de conjuro, estados, IA), rótulos sobre las
// unidades, barra de turno con recursos y botones de acción, hoja de opciones, previsión de ataque, avisos,
// carteles, números flotantes, registro y ficha al pasar el ratón. En el banco de pruebas (`standalone`)
// añade la cabecera, la introducción con el selector de encuentro y grupo, y la pantalla final. La crea
// combat/index.js; la maneja combat/controller.js (bind, setup, refresh, turnBar, sheet, preview, float…).
// Los estilos están en combat.css y se inyectan una sola vez.

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

/** Carga icons.json (SVG de game-icons.net) una sola vez. */
function loadIcons() {
  return (
    iconsPromise ||
      (iconsPromise = fetch(new URL('icons.json', document.baseURI))
        .then((res) => res.json())
        .then((data) => {
          icons = data;
        })
        .catch(() => {
          icons = {};
        })),
    iconsPromise
  );
}
/** SVG de un icono (el de «magic» si no existe). */
function iconSvg(name) {
  return `<svg viewBox="0 0 512 512" aria-hidden="true" focusable="false">${(icons && (icons[name] || icons.magic)) || ''}</svg>`;
}
/** Nombre en español de un estado (prone → Derribado…). */
function conditionName(cond) {
  return CONDITION_NAMES[cond] || cond;
}
/** Nombre corto: sin «Maese» y, en el grupo, solo el nombre de pila. */
function shortName(creature) {
  return creature
    ? creature.name.startsWith('Maese ')
      ? creature.name.slice(6)
      : creature.team === 0
        ? creature.name.split(' ')[0]
        : creature.name
    : '';
}
/** Escapa &, <, > y comillas. */
function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
}
/** Escapa un valor para un selector CSS. */
function cssEscape(value) {
  return window.CSS && window.CSS.escape ? window.CSS.escape(value) : String(value).replace(/"/g, '\\"');
}
/** Número con coma decimal y un decimal si no es entero. */
function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
}
const tmpVec = new Vector3();
let icons = null;
let iconsPromise = null;
/** Nombres de clase (masculino y, para Brenna e Ilyra, femenino). */
const CLASS_NAMES = {
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
const CLASS_NAMES_F = {
  fighter: 'Guerrera',
  cleric: 'Cl\xE9riga',
  wizard: 'Maga',
  barbarian: 'B\xE1rbara',
  ranger: 'Exploradora',
  sorcerer: 'Hechicera',
  warlock: 'Bruja',
  rogue: 'P\xEDcara',
};
const FEMALE_COMPANIONS = new Set(['brenna', 'ilyra']);
/** Nombres de los estados. */
const CONDITION_NAMES = {
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
/** HTML del HUD; `standalone` añade la cabecera, la introducción y la pantalla final del banco de pruebas. */
const hudHtml = (standalone) => `
${standalone ? '<header id="cb-marca" class="hud placa"><h1>Marca de Granito</h1><p id="cb-marca-sub"></p><a href="./">\u2190 Volver a la posada</a></header>' : ''}
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
  standalone
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
let cssInjected = !1;
/** HUD del combate. */
const Hud = class {
  constructor(mount = document.body, { standalone = !1, portrait = null } = {}) {
    if (!cssInjected) {
      let style = document.createElement('style');
      ((style.dataset.area = 'combate'), (style.textContent = combatCss), document.head.appendChild(style), (cssInjected = !0));
    }
    ((this.root = document.createElement('div')),
      (this.root.className = 'mdg-combate'),
      (this.root.style.pointerEvents = 'none'),
      (this.root.innerHTML = hudHtml(standalone)),
      mount.appendChild(this.root),
      (this.standalone = standalone),
      standalone ||
        (this.root.classList.add('oculto'),
        requestAnimationFrame(() => requestAnimationFrame(() => this.root.classList.remove('oculto')))),
      (this.portraitFn = portrait),
      (this.labels = new Map()),
      (this.floats = []),
      (this.cards = new Map()),
      (this.chips = new Map()),
      (this.portraits = {}),
      (this.initRolls = {}),
      (this.surprised = new Set()),
      loadIcons().then(() => this.paintIcons()));
  }
  /** querySelector dentro del HUD. */
  $(selector) {
    return this.root.querySelector(selector);
  }
  /** Inserta los SVG en los elementos con data-icon (una vez). */
  paintIcons() {
    for (let el of this.root.querySelectorAll('[data-icon]'))
      el.dataset.painted ||
        ((el.dataset.painted = '1'), el.insertAdjacentHTML('afterbegin', iconSvg(el.dataset.icon)));
  }
  visible(on) {
    this.root.classList.toggle('oculto', !on);
  }
  dispose() {
    (clearTimeout(this._banner),
      clearTimeout(this._big),
      clearTimeout(this._tip),
      this.root.classList.add('oculto'));
    let root = this.root;
    setTimeout(() => root.remove(), 400);
  }
  /** Conecta los botones con el controlador. */
  bind(ctl) {
    this.ctl = ctl;
    let onClick = (selector, fn) => this.$(selector)?.addEventListener('click', fn);
    (onClick('#cb-b-atacar', () => ctl.menu('attack')),
      onClick('#cb-b-conjuros', () => ctl.menu('spells')),
      onClick('#cb-b-habilidades', () => ctl.menu('features')),
      onClick('#cb-b-acciones', () => ctl.menu('actions')),
      onClick('#cb-b-objetos', () => ctl.menu('items')),
      onClick('#cb-b-deshacer', () => ctl.undoMove()),
      onClick('#cb-b-fin', () => ctl.mode !== 'busy' && ctl.endTurn()),
      onClick('#cb-b-cancelar', () => ctl.cancelPending()),
      onClick('#cb-prevista-no', () => ctl.cancelPending()),
      onClick('#cb-b-rapido', () => this.toggleFast()),
      onClick('#cb-b-girar-izq', () => ctl.rotate(0.5)),
      onClick('#cb-b-girar-der', () => ctl.rotate(-0.5)),
      onClick('#cb-b-centrar', () => ctl.centerOnCurrent()),
      onClick('#cb-b-registro', () => this.toggleLog()),
      onClick('#cb-hoja-cerrar', () => this.closeSheet()));
  }
  toggleFast() {
    let fast = !this.ctl.fast;
    (this.ctl.setFast(fast), this.$('#cb-b-rapido').setAttribute('aria-pressed', String(fast)));
  }
  toggleLog() {
    let log = this.$('#cb-registro');
    (log.classList.toggle('plegado'),
      this.$('#cb-b-registro').setAttribute('aria-expanded', String(!log.classList.contains('plegado'))));
  }
  /** Monta tarjetas, rótulos y retratos para el estado inicial. */
  setup(state, units, encounter = null) {
    ((this.units = units),
      this.standalone && encounter && (this.$('#cb-marca-sub').textContent = `${encounter.name} \xB7 ${encounter.place || ''}`));
    let party = this.$('#cb-grupo');
    ((party.innerHTML = ''), this.cards.clear());
    for (let creature of state.creatures.filter((c) => c.team === 0)) this.addCard(creature);
    let labels = this.$('#cb-rotulos');
    ((labels.innerHTML = ''), this.labels.clear());
    for (let creature of state.creatures) this.addLabel(creature);
    ((this.state = state), this.renderPortraits(units), this.refresh(state));
  }
  /** Tarjeta de un miembro del grupo (clic: centrar; interruptor: IA). */
  addCard(creature) {
    let card = document.createElement('button');
    ((card.type = 'button'), (card.className = 'pj'));
    let role = (FEMALE_COMPANIONS.has(creature.id) ? CLASS_NAMES_F[creature.cls] : null) || CLASS_NAMES[creature.cls] || creature.cls || '';
    ((card.innerHTML = `
      <span class="auto" role="switch" aria-checked="false" title="Que lo juegue la IA" data-icon="auto"></span>
      <span class="marco"><img alt="" data-retrato="${creature.id}"><span class="ca" title="Clase de armadura">${creature.ac}</span></span>
      <span class="datos">
        <span class="nombre">${shortName(creature)}</span>
        <span class="rol">${role}${creature.level ? ` \xB7 nivel ${creature.level}` : ''}</span>
        <span class="vida" role="meter" aria-label="Puntos de golpe"><span class="relleno"></span><span class="temp"></span><span class="cifra"></span></span>
        <span class="espacios"></span>
        <span class="estados"></span>
      </span>`),
      card.addEventListener('click', (ev) => {
        if (ev.target.closest('.auto')) {
          (ev.stopPropagation(), this.ctl.toggleAuto(creature.id));
          return;
        }
        let unit = this.units?.byId.get(creature.id);
        unit && this.ctl.focusUnit(unit, null, !0);
      }),
      this.$('#cb-grupo').appendChild(card),
      this.cards.set(creature.id, card),
      icons && this.paintIcons());
  }
  /** Rótulo con nombre y vida sobre la unidad. */
  addLabel(creature) {
    let label = document.createElement('div');
    ((label.className = `rotulo ${creature.team === 0 ? 'de-grupo' : 'de-enemigo'}`),
      (label.innerHTML = `<b>${shortName(creature)}</b><span class="mini"><span></span></span>`),
      this.$('#cb-rotulos').appendChild(label),
      this.labels.set(creature.id, label));
  }
  /** Retratos de todas las unidades (función externa o render propio) y barra de iniciativa. */
  async renderPortraits(units) {
    let list = units.list;
    this.portraitFn &&
      (await Promise.all(
        list.map(async (unit) => {
          try {
            this.portraits[unit.id] = await this.portraitFn(unit);
          } catch {}
        }),
      ));
    let missing = list.filter((unit) => !this.portraits[unit.id]);
    missing.length && this.renderOwnPortraits(missing);
    for (let [id, src] of Object.entries(this.portraits))
      for (let img of this.root.querySelectorAll(`img[data-retrato="${cssEscape(id)}"]`)) img.src = src;
    this.buildInitiative();
  }
  /** Retratos propios: clona la figura en una escena aparte y la fotografía (por plantilla). */
  renderOwnPortraits(units) {
    let renderer;
    try {
      renderer = new WebGLRenderer({ antialias: !0, alpha: !0, preserveDrawingBuffer: !0 });
    } catch {
      return;
    }
    (renderer.setSize(168, 200), (renderer.toneMapping = ACESFilmicToneMapping), (renderer.toneMappingExposure = 1.15));
    let byKey = new Map();
    for (let unit of units) {
      let key = unit.team === 0 ? unit.id : unit.template;
      if (byKey.has(key)) {
        this.portraits[unit.id] = byKey.get(key);
        continue;
      }
      try {
        (unit.ch.mixer?.update(0.01), unit.root.updateMatrixWorld(!0));
        let scene = new Scene(),
          copy = clone(unit.root);
        (copy.position.set(0, 0, 0),
          copy.rotation.set(0, 0, 0),
          copy.traverse((obj) => {
            (obj.isLight && (obj.intensity = 0), (obj.isSprite || obj.isPoints) && (obj.visible = !1));
          }),
          scene.add(copy),
          copy.updateMatrixWorld(!0));
        let head = copy.getObjectByName('Head');
        if (!head) continue;
        let headPos = head.getWorldPosition(new Vector3()),
          scale = unit.scale || 1,
          keyLight = new DirectionalLight(16765600, 3);
        keyLight.position.set(1.2, headPos.y + 1.2, 2.2);
        let fillLight = new DirectionalLight(7309e3, 1.1);
        fillLight.position.set(-2, headPos.y + 0.5, 0.5);
        let rimLight = new DirectionalLight(16754784, 2.2);
        (rimLight.position.set(-0.6, headPos.y + 1, -2.5), scene.add(keyLight, fillLight, rimLight, new AmbientLight(2760752, 1.2)));
        let beast = !copy.getObjectByName('hand_r'),
          camera = new PerspectiveCamera(24, 168 / 200, 0.02, 20);
        (beast
          ? (camera.position.set(headPos.x + 0.95 * scale, headPos.y + 0.3 * scale, headPos.z + 1.55 * scale),
            camera.lookAt(headPos.x, headPos.y - 0.12 * scale, headPos.z - 0.15 * scale))
          : (camera.position.set(0.22 * scale, headPos.y + 0.06 * scale, 0.95 * scale), camera.lookAt(0, headPos.y - 0.03 * scale, 0)),
          renderer.render(scene, camera));
        let dataUrl = renderer.domElement.toDataURL('image/png');
        (byKey.set(key, dataUrl), (this.portraits[unit.id] = dataUrl));
      } catch (err) {
        console.warn('[combate] retrato', unit.id, err);
      }
    }
    (renderer.dispose(), renderer.forceContextLoss?.());
  }
  /** Rehace la barra de iniciativa. */
  buildInitiative() {
    if (!this.state) return;
    this._orderKey = '';
    let list = this.$('#cb-iniciativa-lista');
    ((list.innerHTML = ''), this.chips.clear());
    for (let id of this.state.order) {
      let creature = this.state.creatures.find((c) => c.id === id);
      creature && this.addChip(creature);
    }
    ((this.sep = document.createElement('li')),
      (this.sep.className = 'ficha ronda-nueva'),
      (this.sep.title = 'Ronda siguiente'),
      this.refresh(this.state));
  }
  /** Ficha de iniciativa (clic: centrar; ratón encima: resaltar). */
  addChip(creature) {
    let chip = document.createElement('li');
    ((chip.className = `ficha ${creature.team === 0 ? 'de-grupo' : 'de-enemigo'}`),
      (chip.title = creature.name),
      (chip.innerHTML = `<img alt="" src="${this.portraits[creature.id] || ''}"><span class="ini"></span><span class="mini"><span></span></span>`),
      chip.addEventListener('click', () => {
        let unit = this.units?.byId.get(creature.id);
        unit && this.ctl.focusUnit(unit, null, !0);
      }),
      chip.addEventListener('mouseenter', () => this.ctl?.highlight?.(creature.id, !0)),
      chip.addEventListener('mouseleave', () => this.ctl?.highlight?.(creature.id, !1)),
      this.$('#cb-iniciativa-lista').appendChild(chip),
      this.chips.set(creature.id, chip),
      (this._orderKey = ''));
  }
  /** Marca la tarjeta como llevada por la IA. */
  setAuto(id, on) {
    let card = this.cards.get(id);
    card && (card.classList.toggle('ia', on), card.querySelector('.auto')?.setAttribute('aria-checked', String(on)));
  }
  /** Muestra la tirada de iniciativa en la ficha. */
  setInitiative(id, roll) {
    this.initRolls[id] = roll;
    let chip = this.chips.get(id);
    chip && (chip.querySelector('.ini').textContent = roll);
  }
  /** Marca las fichas sorprendidas. */
  setSurprised(ids) {
    this.surprised = new Set(ids || []);
    for (let [id, chip] of this.chips) chip.classList.toggle('sorpresa', this.surprised.has(id));
  }
  /** Ordena las fichas a partir del turno actual, con un separador de ronda. */
  orderChips(state) {
    let list = this.$('#cb-iniciativa-lista'),
      order = (state.order || []).filter((id) => this.chips.has(id)),
      currentIndex = Math.max(0, order.indexOf(state.current)),
      rotated = [...order.slice(currentIndex), ...order.slice(0, currentIndex)],
      key = `${rotated.join(',')}|${order.length - currentIndex}`;
    if (key === this._orderKey) return;
    this._orderKey = key;
    let frag = document.createDocumentFragment();
    (rotated.forEach((id, k) => {
      (k === order.length - currentIndex && k > 0 && this.sep && frag.appendChild(this.sep), frag.appendChild(this.chips.get(id)));
    }),
      list.appendChild(frag),
      (list.scrollLeft = 0));
  }
  /** Actualiza tarjetas, fichas y rótulos con el estado del núcleo. */
  refresh(state) {
    ((this.state = state), !this.chips.size && Object.keys(this.portraits).length && this.buildInitiative());
    for (let creature of state.creatures) {
      (this.labels.has(creature.id) || this.addLabel(creature),
        creature.team === 0 && !this.cards.has(creature.id) && creature.is_pc !== !1 && !creature.summon && this.addCard(creature),
        this.chips.size && !this.chips.has(creature.id) && (state.order || []).includes(creature.id) && this.addChip(creature));
      let card = this.cards.get(creature.id),
        hpFrac = Math.max(0, creature.hp) / Math.max(1, creature.max_hp);
      if (card) {
        ((card.querySelector('.relleno').style.width = `${hpFrac * 100}%`),
          (card.querySelector('.temp').style.width =
            `${Math.min(1, (creature.temp_hp || 0) / Math.max(1, creature.max_hp)) * 100}%`),
          (card.querySelector('.cifra').textContent = creature.dead
            ? 'Muerto'
            : creature.hp <= 0
              ? `Ca\xEDdo \xB7 ${creature.death_successes}\u2713 ${creature.death_failures}\u2717`
              : `${creature.hp} / ${creature.max_hp}${creature.temp_hp ? ` +${creature.temp_hp}` : ''}`),
          (card.querySelector('.ca').textContent = creature.ac),
          card.classList.toggle('caido', creature.hp <= 0),
          card.classList.toggle('activo', state.current === creature.id));
        let states = [...(creature.conditions || []).map(conditionName), ...(creature.effects || []).map((effect) => effect.name)];
        (creature.concentration && states.push('Concentrado'),
          (card.querySelector('.estados').textContent = states.slice(0, 4).join(' \xB7 ')));
        let slotsEl = card.querySelector('.espacios'),
          slots = creature.slots || [],
          slotsMax = creature.slots_max || [],
          key = `${slots.join(',')}/${slotsMax.join(',')}`;
        if (slotsEl.dataset.k !== key) {
          slotsEl.dataset.k = key;
          let html = '';
          for (let lvl = 0; lvl < Math.min(3, slotsMax.length); lvl++)
            for (let k = 0; k < slotsMax[lvl]; k++)
              html += `<i class="${k < (slots[lvl] ?? 0) ? 'lleno' : ''}" title="Espacio de nivel ${lvl + 1}"></i>`;
          slotsEl.innerHTML = html;
        }
      }
      let chip = this.chips.get(creature.id);
      chip &&
        (chip.classList.toggle('activo', state.current === creature.id),
        chip.classList.toggle('fuera', !!creature.dead || (creature.team !== 0 && creature.hp <= 0)),
        (chip.querySelector('.mini span').style.width = `${hpFrac * 100}%`),
        this.portraits[creature.id] &&
          !chip.querySelector('img').src &&
          (chip.querySelector('img').src = this.portraits[creature.id]));
      let label = this.labels.get(creature.id);
      label &&
        ((label.querySelector('.mini span').style.width = `${hpFrac * 100}%`),
        label.classList.toggle('fuera', !!creature.dead),
        label.classList.toggle('herido', hpFrac <= 0.5),
        label.classList.toggle('activo', state.current === creature.id));
    }
    this.chips.size && this.orderChips(state);
  }
  /** Resalta a quien tiene el turno. */
  setActive(id) {
    for (let [key, chip] of this.chips) chip.classList.toggle('activo', key === id);
    for (let [key, card] of this.cards) card.classList.toggle('activo', key === id);
    for (let [key, label] of this.labels) label.classList.toggle('activo', key === id);
    this.state && this.orderChips({ ...this.state, current: id });
  }
  /** Cambia los PG mostrados (con sacudida de la tarjeta si bajan). */
  setHp(id, hp, maxHp) {
    let creature = this.state?.creatures.find((c) => c.id === id);
    if (creature) {
      let hurt = hp < creature.hp;
      if (((creature.hp = hp), maxHp && (creature.max_hp = maxHp), this.refresh(this.state), hurt)) {
        let card = this.cards.get(id);
        card && (card.classList.remove('golpe'), card.offsetWidth, card.classList.add('golpe'));
      }
    }
  }
  round(n) {
    this.$('#cb-ronda').innerHTML = `Ronda ${n}`;
  }
  /** Texto «pensando» del turno de la IA. */
  thinking(text) {
    let el = this.$('#cb-pensando');
    ((el.textContent = text), el.classList.toggle('visible', !!text));
  }
  /** Cartel breve en la parte superior. */
  banner(text, kind = 'oro', ms = 1e3, sub = '') {
    let el = this.$('#cb-cartel');
    ((el.innerHTML = `${escapeHtml(text)}${sub ? `<small>${escapeHtml(sub)}</small>` : ''}`),
      (el.className = `hud visible ${kind}`),
      clearTimeout(this._banner),
      (this._banner = setTimeout(() => {
        el.className = `hud ${kind}`;
      }, ms)));
  }
  /** Cartel grande (inicio de combate, ronda…); promesa al ocultarse. */
  big(text, sub = '', kind = '', ms = 2200) {
    let el = this.$('#cb-gran');
    return (
      (el.innerHTML = `<b>${escapeHtml(text)}</b>${sub ? `<span>${escapeHtml(sub)}</span>` : ''}`),
      (el.className = `hud visible ${kind}`),
      clearTimeout(this._big),
      new Promise((resolve) => {
        this._big = setTimeout(() => {
          ((el.className = `hud ${kind}`), resolve());
        }, ms);
      })
    );
  }
  /** Añade una línea al registro (máximo 160). */
  log(html) {
    let p = document.createElement('p');
    p.innerHTML = html;
    let list = this.$('#cb-registro-lista');
    for (list.appendChild(p); list.children.length > 160;) list.firstChild.remove();
    list.scrollTop = list.scrollHeight;
  }
  /** Barra del turno del jugador: recursos, movimiento y botones según `options` del núcleo. */
  turnBar(creature, options) {
    let bar = this.$('#cb-turno');
    if (!creature) {
      bar.classList.remove('visible');
      return;
    }
    (bar.classList.add('visible'), (this.$('#cb-turno-nombre').textContent = shortName(creature)));
    let turn = creature.turn,
      setSpent = (selector, available) => this.$(selector).classList.toggle('gastado', !available);
    (setSpent('#cb-r-accion', turn.action > 0 || turn.attack_left > 0),
      setSpent('#cb-r-adicional', turn.bonus > 0),
      setSpent('#cb-r-reaccion', turn.reaction > 0));
    let movement = Math.max(0, turn.movement);
    ((this.$('#cb-r-mov').textContent = `${formatNumber((movement / 5) * 1.5)} m`),
      (this.$('#cb-mov-barra').style.width = `${Math.min(100, (movement / Math.max(creature.speed, 5)) * 100)}%`));
    let hasAction = turn.action > 0 || turn.attack_left > 0,
      enable = (selector, on) => {
        this.$(selector).disabled = !on;
      };
    enable('#cb-b-atacar', hasAction && (options.profiles || []).length > 0);
    let spells = options.spells || [];
    ((this.$('#cb-b-conjuros').hidden = !spells.length),
      enable(
        '#cb-b-conjuros',
        spells.some((spell) => spell.usable),
      ));
    let features = options.features || [];
    ((this.$('#cb-b-habilidades').hidden = !features.length),
      enable(
        '#cb-b-habilidades',
        features.some((f) => f.enabled),
      ),
      enable(
        '#cb-b-acciones',
        (options.actions || []).some((act) => act.enabled),
      ),
      (this.$('#cb-b-objetos').hidden = !(options.items || []).length),
      enable(
        '#cb-b-objetos',
        (options.items || []).some((item) => item.enabled),
      ),
      (this.$('#cb-b-deshacer').hidden = !options.can_undo),
      this.$('#cb-b-fin').classList.toggle('pulsa', !!options.nothing_left || (!hasAction && turn.movement < 5)));
  }
  /** Hoja de opciones (conjuros, habilidades, acciones, objetos) agrupadas. */
  sheet(title, entries, onPick) {
    this.cursorNote('');
    let panel = this.$('#cb-hoja');
    this.$('#cb-hoja-titulo').textContent = title;
    let list = this.$('#cb-hoja-lista');
    list.innerHTML = '';
    let group = null;
    for (let entry of entries) {
      if (entry.group && entry.group !== group) {
        group = entry.group;
        let heading = document.createElement('div');
        ((heading.className = 'grupo-titulo'), (heading.textContent = group), list.appendChild(heading));
      }
      let btn = document.createElement('button');
      ((btn.type = 'button'),
        (btn.className = `opcion${entry.magic ? ' magia' : ''}`),
        (btn.disabled = entry.enabled === !1),
        (btn.innerHTML = `<span class="opcion-icono">${iconSvg(entry.icon || 'magic')}</span><span class="opcion-texto"><b>${entry.title}</b><i>${entry.desc || ''}</i></span><span class="opcion-coste">${entry.cost || ''}${entry.note ? `<em>${entry.note}</em>` : ''}</span>`),
        btn.addEventListener('click', (ev) => {
          (ev.stopPropagation(), this.closeSheet(), onPick(entry));
        }),
        list.appendChild(btn));
    }
    ((panel.hidden = !1), list.querySelector('button:not([disabled])')?.focus({ preventScroll: !0 }));
  }
  closeSheet() {
    this.$('#cb-hoja').hidden = !0;
  }
  sheetOpen() {
    return !this.$('#cb-hoja').hidden;
  }
  /** Previsión junto al objetivo (líneas, probabilidad, armas alternativas y botón de confirmar). */
  preview(at, lines, label, onConfirm, weapons = [], enabled = !0, chance = null) {
    let panel = this.$('#cb-prevista');
    ((this.previewAt = at.clone ? at.clone() : new Vector3(at.x, at.y, at.z)),
      (this.previewAt.y = Math.max(this.previewAt.y, 1.6)));
    let html = lines.map((line) => `<p class="${line.t || ''}">${line.s}</p>`).join('');
    (chance != null &&
      (html = html.replace(
        /(<\/p>)/,
        `$1<div class="probabilidad" title="Probabilidad de impacto"><span style="width:${Math.round(chance * 100)}%"></span></div>`,
      )),
      (this.$('#cb-prevista-texto').innerHTML = html));
    let ok = this.$('#cb-prevista-ok');
    ((ok.textContent = label), (ok.disabled = !enabled), (this.onConfirm = onConfirm), (ok.onclick = () => this.confirmPreview()));
    let weaponsEl = this.$('#cb-prevista-armas');
    weaponsEl.innerHTML = '';
    for (let weapon of weapons) {
      let chip = document.createElement('button');
      ((chip.type = 'button'),
        (chip.className = 'chip'),
        (chip.textContent = weapon.label),
        (chip.onclick = weapon.on),
        weaponsEl.appendChild(chip));
    }
    ((weaponsEl.hidden = !weapons.length), (panel.hidden = !1));
  }
  confirmPreview() {
    let fn = this.onConfirm;
    ((this.onConfirm = null), fn && fn());
  }
  hidePreview() {
    ((this.$('#cb-prevista').hidden = !0), (this.onConfirm = null));
  }
  previewOpen() {
    return !this.$('#cb-prevista').hidden;
  }
  /** Indicación inferior con botones de cancelar y extra opcionales. */
  prompt(text, cancellable = !1, extra = null) {
    let el = this.$('#cb-indicacion');
    ((this.$('#cb-indicacion-texto').textContent = text), (this.$('#cb-b-cancelar').hidden = !cancellable));
    let extraBtn = this.$('#cb-b-extra');
    (extra ? ((extraBtn.hidden = !1), (extraBtn.textContent = extra.label), (extraBtn.onclick = extra.on)) : (extraBtn.hidden = !0),
      el.classList.toggle('visible', !!text));
  }
  /** Ficha de una criatura junto al cursor. */
  tip(creature, x, y, autoHide = !1, extraHtml = '') {
    let el = this.$('#cb-ficha'),
      hpText =
        creature.team === 0
          ? `${Math.max(0, creature.hp)} / ${creature.max_hp} PG`
          : creature.dead
            ? 'Muerto'
            : creature.hp <= 0
              ? 'Ca\xEDdo'
              : creature.hp <= creature.max_hp / 2
                ? `Malherido \xB7 ${creature.hp}/${creature.max_hp} PG`
                : `${creature.hp}/${creature.max_hp} PG`,
      states = [...(creature.conditions || []).map(conditionName), ...(creature.effects || []).map((effect) => effect.name)];
    ((el.innerHTML = `<b>${escapeHtml(creature.name)}</b><span>CA ${creature.ac} \xB7 ${hpText}</span>${states.length ? `<i>${states.join(' \xB7 ')}</i>` : ''}${extraHtml}`),
      (el.style.transform = `translate(${Math.min(x + 18, innerWidth - 250)}px, ${Math.max(8, y - 70)}px)`),
      el.classList.add('visible'),
      clearTimeout(this._tip),
      autoHide && (this._tip = setTimeout(() => this.hideTip(), 2600)));
  }
  hideTip() {
    this.$('#cb-ficha').classList.remove('visible');
  }
  /** Nota junto al cursor (coste de movimiento, objetivo…). */
  cursorNote(text, x, y) {
    let el = this.$('#cb-nota');
    ((el.textContent = text), el.classList.toggle('visible', !!text), text && this.moveCursorNote(x, y));
  }
  cursorNoteVisible() {
    return this.$('#cb-nota').classList.contains('visible');
  }
  moveCursorNote(x, y) {
    this.$('#cb-nota').style.transform = `translate(${x + 16}px, ${y + 14}px)`;
  }
  /** Número o texto flotante sobre un punto del mundo (daño, curación, fallo…). */
  float(pos, text, kind = '', scale = 1, sub = '') {
    let el = document.createElement('div');
    ((el.className = `flota ${kind}`),
      (el.innerHTML = `${escapeHtml(String(text))}${sub ? `<small>${escapeHtml(sub)}</small>` : ''}`),
      el.style.setProperty('--s', scale),
      this.$('#cb-flotantes').appendChild(el));
    let lane = this.floats.filter((f) => f.pos.distanceTo(pos) < 0.6 && f.t < 0.5).length,
      big = /dano|critico|cura/.test(kind),
      w = (el.offsetWidth || 80) * scale,
      h = (el.offsetHeight || 22) * scale;
    for (
      this.floats.push({
        el,
        pos: pos.clone(),
        t: 0,
        life: 1.5 + scale * 0.3,
        lane,
        big,
        side: big ? (Math.random() - 0.5) * 30 : 0,
        scale,
        w,
        h,
        push: 0,
      });
      this.floats.length > 40;
    )
      this.floats.shift().el.remove();
  }
  /** Coloca flotantes (sin solaparse), rótulos y previsión en pantalla; se llama tras cada fotograma. */
  place(camera, canvas, dt = 1 / 60) {
    let width = canvas.clientWidth || innerWidth,
      height = canvas.clientHeight || innerHeight,
      placed = [];
    for (let f of this.floats) {
      ((f.t += dt),
        tmpVec.copy(f.pos).project(camera),
        (f.x = (tmpVec.x * 0.5 + 0.5) * width + f.side * Math.min(1, f.t * 3)),
        (f.z = tmpVec.z));
      let y = (-tmpVec.y * 0.5 + 0.5) * height - f.t * 46 - f.lane * 24 - f.push;
      if (f.t < 0.6) {
        for (let other of placed)
          if (Math.abs(other.x - f.x) < (other.w + f.w) * 0.5 - 4 && Math.abs(other.y - y) < (other.h + f.h) * 0.5) {
            let overlap = y - (other.y - (other.h + f.h) * 0.5);
            ((f.push += overlap), (y -= overlap));
          }
      }
      ((f.y = y), placed.push(f));
    }
    for (let k = this.floats.length - 1; k >= 0; k--) {
      let f = this.floats[k];
      tmpVec.z = f.z;
      let x = f.x,
        y = f.y,
        opacity = f.t < 0.12 ? f.t / 0.12 : Math.max(0, 1 - (f.t - f.life * 0.6) / (f.life * 0.4)),
        pop = f.big ? 1 + 0.7 * Math.exp(-f.t * 10) : 1;
      ((f.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%) scale(${(f.scale * pop).toFixed(3)})`),
        (f.el.style.opacity = opacity.toFixed(3)),
        (f.t >= f.life || tmpVec.z > 1) && (f.el.remove(), this.floats.splice(k, 1)));
    }
    if (this.units)
      for (let [id, label] of this.labels) {
        let unit = this.units.byId.get(id);
        if (!unit || !unit.root.visible) {
          label.style.visibility = 'hidden';
          continue;
        }
        (unit.headWorld(tmpVec),
          (tmpVec.y += 0.38 * (unit.scale || 1)),
          tmpVec.project(camera),
          (label.style.visibility = tmpVec.z < 1 ? 'visible' : 'hidden'),
          (label.style.transform = `translate(${((tmpVec.x * 0.5 + 0.5) * width).toFixed(1)}px, ${((-tmpVec.y * 0.5 + 0.5) * height).toFixed(1)}px) translate(-50%, -100%)`));
      }
    let panel = this.$('#cb-prevista');
    if (this.previewAt && !panel.hidden) {
      tmpVec.copy(this.previewAt).project(camera);
      let panelW = panel.offsetWidth,
        panelH = panel.offsetHeight,
        px = (tmpVec.x * 0.5 + 0.5) * width + 30,
        py = (-tmpVec.y * 0.5 + 0.5) * height - panelH / 2;
      (px + panelW > width - 12 && (px = (tmpVec.x * 0.5 + 0.5) * width - panelW - 30), (px = Math.max(12, Math.min(px, width - panelW - 12))));
      let top = Math.max(70, Math.min(py, height - panelH - 150));
      panel.style.transform = `translate(${px.toFixed(0)}px, ${top.toFixed(0)}px)`;
    }
  }
  /** Pantalla de carga del banco de pruebas: barra, texto, aviso de atasco, fallo y listo. */
  progress(frac) {
    let bar = document.getElementById('carga-barra');
    bar && (bar.style.transform = `scaleX(${Math.max(0.04, frac)})`);
  }
  stage(text) {
    let el = document.getElementById('carga-texto');
    el && !this._stuck && (el.textContent = `${text}\u2026`);
  }
  stuck(text, details) {
    this._stuck = !0;
    let el = document.getElementById('carga-texto');
    if (el) {
      el.textContent = text;
      for (let line of details) {
        let p = document.createElement('p');
        ((p.className = 'carga-detalle'), (p.textContent = line), el.after(p));
      }
    }
  }
  fail(err) {
    let el = document.getElementById('carga-texto');
    el && (el.textContent = `No se ha podido preparar el combate: ${String(err.message).slice(0, 200)}`);
  }
  ready() {
    (document.body.classList.add('lista'), setTimeout(() => document.getElementById('carga')?.remove(), 900));
  }
  /** Introducción del encuentro por párrafos con consejos (banco de pruebas). */
  intro(encounter) {
    let panel = this.$('#cb-intro');
    if (!panel) return Promise.resolve();
    ((this.$('#cb-intro-titulo').textContent = encounter.name),
      (this.$('#cb-intro-lugar').textContent = encounter.place || ''));
    let paras = encounter.intro || [],
      textEl = this.$('#cb-intro-texto'),
      step = 0,
      tips = (encounter.tips || []).slice(0, 3),
      touch = matchMedia('(pointer: coarse)').matches,
      render = () => {
        ((textEl.innerHTML =
          paras
            .slice(0, step + 1)
            .map((p) => `<p>${p}</p>`)
            .join('') +
          (step >= paras.length - 1 && tips.length
            ? `<ul class="consejos">${tips
                .map(
                  (tip) =>
                    `<li>${
                      touch
                        ? tip
                        : tip
                            .replace(/^Toca /, 'Haz clic en ')
                            .replace(/ Toca /g, ' Haz clic en ')
                            .replace('Vuelve a tocarlo', 'Vuelve a hacer clic')
                    }</li>`,
                )
                .join('')}</ul>`
            : '')),
          (this.$('#cb-intro-seguir').textContent = step < paras.length - 1 ? 'Seguir' : '\xA1A las armas!'));
      };
    return (
      render(),
      this.testPicker(),
      (panel.hidden = !1),
      new Promise((resolve) => {
        ((this.$('#cb-intro-seguir').onclick = () => {
          if (step < paras.length - 1) {
            (step++, render());
            return;
          }
          ((panel.hidden = !0), resolve());
        }),
          (this.$('#cb-intro-saltar').onclick = () => {
            ((panel.hidden = !0), resolve());
          }));
      })
    );
  }
  /** Selector de encuentro, grupo y nivel del banco de pruebas (recarga con ?encuentro, ?grupo, ?nivel). */
  testPicker() {
    let rows = this.$('#cb-prueba .prueba-filas');
    if (!rows || rows.childElementCount) return;
    let params = new URLSearchParams(location.search),
      members = [
        ['brenna', 'Brenna (guerrera)'],
        ['pip', 'Pip (p\xEDcaro)'],
        ['ilyra', 'Ilyra (cl\xE9riga)'],
        ['odvar', 'Odvar (mago)'],
        ...Object.entries(CLASS_NAMES).map(([id, label]) => [id, label]),
      ],
      party = (params.get('grupo') || 'brenna,pip,ilyra,odvar').split(','),
      select = (label, opts, selected) =>
        `<label>${label}<select>${opts.map(([value, text]) => `<option value="${value}"${value === selected ? ' selected' : ''}>${text}</option>`).join('')}</select></label>`,
      html = select(
        'Encuentro',
        [
          ['e1_prado', 'El toro que sangra'],
          ['e2_pinar', 'Lobos en Elderhal'],
          ['e3_tumulo', 'El t\xFAmulo'],
        ],
        params.get('encuentro') || 'e1_prado',
      );
    for (let k = 0; k < 4; k++) html += select(`Miembro ${k + 1}`, [['', '\u2014'], ...members], party[k] || '');
    ((html += select(
      'Nivel',
      [
        ['', 'del encuentro'],
        ['1', '1'],
        ['2', '2'],
        ['3', '3'],
      ],
      params.get('nivel') || '',
    )),
      (html += '<button class="boton principal" type="button">Probar</button>'),
      (rows.innerHTML = html),
      (rows.querySelector('button').onclick = () => {
        let values = [...rows.querySelectorAll('select')].map((sel) => sel.value),
          url = new URL(location.href);
        url.searchParams.set('encuentro', values[0]);
        let group = values.slice(1, 5).filter(Boolean);
        (group.length ? url.searchParams.set('grupo', group.join(',')) : url.searchParams.delete('grupo'),
          values[5] ? url.searchParams.set('nivel', values[5]) : url.searchParams.delete('nivel'),
          url.searchParams.delete('semilla'),
          (location.href = url.toString()));
      }));
  }
  /** Pantalla final del banco de pruebas. */
  finish({ won, rounds, encounter, party }) {
    let panel = this.$('#cb-final');
    if (!panel) return;
    ((this.$('#cb-final-titulo').textContent = won ? '\xA1Victoria!' : 'Derrota'),
      panel.classList.toggle('derrota', !won));
    let outro = encounter.outro,
      paras = [];
    (won && outro && (paras = Array.isArray(outro) ? outro : typeof outro == 'string' ? [outro] : [outro.win || '']),
      won ||
        (paras = [
          typeof outro == 'object' && outro?.lose
            ? outro.lose
            : 'El grupo cae. Esta vez nadie podr\xE1 contarlo en la posada.',
        ]),
      (this.$('#cb-final-texto').innerHTML = `${paras
        .filter(Boolean)
        .map((p) => `<p>${p}</p>`)
        .join(
          '',
        )}<p class="apagado">${rounds} ${rounds === 1 ? 'ronda' : 'rondas'} \xB7 ${party.map((c) => `${shortName(c)} ${c.dead ? '(muerto)' : c.hp <= 0 ? '(ca\xEDdo)' : `${c.hp}/${c.max_hp}`}`).join(' \xB7 ')}</p>`),
      (panel.hidden = !1),
      (this.$('#cb-final-otra').onclick = () => {
        let url = new URL(location.href);
        (url.searchParams.delete('semilla'), (location.href = url.toString()));
      }));
  }
};

export { conditionName, formatNumber, Hud, shortName };
