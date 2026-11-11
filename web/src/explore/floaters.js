// explore/floaters.js — Capa DOM sobre el lienzo con textos flotantes (oro, daño…), alertas «¡!»,
// bocadillos de diálogo y la etiqueta del objeto bajo el puntero, anclados a posiciones del mundo 3D.
// Lo usa explore/index.js.
// Reconstruido de publicado/juego.js (módulo __esm «wk»).

import { Vector3 } from 'three';

const FLOATERS_CSS = `
.xp-capa{position:fixed;inset:0;pointer-events:none!important;overflow:hidden}
.xp-capa>*{position:absolute;left:0;top:0;will-change:transform}
.xp-flota{font:700 17px Alegreya,Georgia,serif;color:#ecdfc4;text-shadow:0 1px 2px #000,0 0 6px #000;white-space:nowrap;transform-origin:50% 100%}
.xp-flota.oro{color:#f0c860}.xp-flota.mal{color:#ff8a70}.xp-flota.bien{color:#9de08a}.xp-flota.magia{color:#b8a8ff}.xp-flota.apagado{color:#c8bca8;font-weight:600;font-size:15px}
.xp-flota.grande{font-size:24px;font-family:Cinzel,Georgia,serif}
.xp-bocadillo{max-width:min(300px,70vw);background:rgba(244,232,206,.96);color:#2a1d14;border:1px solid #7d6334;border-radius:10px;padding:7px 11px 8px;font:16px/1.3 Alegreya,Georgia,serif;box-shadow:0 3px 10px rgba(0,0,0,.45);transition:opacity .25s}
.xp-bocadillo b{display:block;font:700 12px 'Alegreya SC',Georgia,serif;letter-spacing:.06em;color:#7d4a22;margin-bottom:1px}
.xp-bocadillo:after{content:'';position:absolute;left:50%;bottom:-8px;margin-left:-8px;border:8px solid transparent;border-bottom:0;border-top-color:rgba(244,232,206,.96)}
.xp-etiqueta{background:rgba(24,17,12,.88);border:1px solid #7d6334;color:#ecdfc4;border-radius:4px;padding:3px 9px 4px;font:600 15px Alegreya,Georgia,serif;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.5)}
.xp-etiqueta small{display:block;font:500 12px 'Alegreya SC',Georgia,serif;color:#c9a55c;letter-spacing:.05em}
.xp-etiqueta.mal{border-color:#a8442e}.xp-etiqueta.mal small{color:#ff9a7a}
.xp-alerta{font:900 30px Cinzel,Georgia,serif;color:#ffcc40;text-shadow:0 0 8px #000,0 2px 2px #000}
`;
/** Capa de textos anclados. Un ancla es un Vector3 o una función (v) => Vector3 | null. */
const Floaters = class {
  constructor(camera, parent = document.body) {
    ((this.camera = camera), (this.el = document.createElement('div')), (this.el.className = 'xp-capa'));
    let style = document.createElement('style');
    ((style.textContent = FLOATERS_CSS),
      this.el.append(style),
      parent.prepend(this.el),
      (this.items = new Set()),
      (this.v = new Vector3()),
      (this.label = null));
  }
  _add(node, anchor, opts) {
    let item = { node, anchor, t: 0, ...opts };
    return (this.el.append(node), this.items.add(item), item);
  }
  /** Texto que sube y se desvanece; `cls`: oro, mal, bien, magia, apagado, grande. */
  float(anchor, text, cls = '', { dur = 1.4, size = 1 } = {}) {
    let el = document.createElement('div');
    ((el.className = `xp-flota ${cls}`),
      (el.textContent = text),
      size !== 1 && (el.style.fontSize = `${17 * size}px`));
    let pos = typeof anchor == 'function' ? anchor().clone() : anchor.clone();
    return this._add(el, pos, { kind: 'float', dur, rise: 46 });
  }
  /** Alerta grande (por defecto «¡!») sobre un personaje. */
  alert(anchor, text = '\xA1!', dur = 1.2) {
    let el = document.createElement('div');
    return (
      (el.className = 'xp-alerta'),
      (el.textContent = text),
      this._add(el, anchor, { kind: 'float', dur, rise: 14 })
    );
  }
  /** Bocadillo de diálogo; la promesa se resuelve cuando desaparece. */
  bubble(anchor, speaker, text, { dur = null } = {}) {
    let el = document.createElement('div');
    if (((el.className = 'xp-bocadillo'), speaker)) {
      let nameEl = document.createElement('b');
      ((nameEl.textContent = speaker), el.append(nameEl));
    }
    el.append(document.createTextNode(text));
    let time = dur ?? Math.min(9, 2.2 + text.length * 0.055),
      item = this._add(el, anchor, { kind: 'bubble', dur: time });
    return new Promise((resolve) => (item.done = resolve));
  }
  /** Muestra (o quita, si no hay `title`) la etiqueta del objeto señalado; `bad` la pinta en rojo. */
  setLabel(anchor, title, sub = '', bad = !1) {
    if (!title) {
      this.label && (this.label.node.remove(), this.items.delete(this.label), (this.label = null));
      return;
    }
    if (!this.label) {
      let el = document.createElement('div');
      ((el.className = 'xp-etiqueta'), (this.label = this._add(el, anchor, { kind: 'label', dur: 1 / 0 })));
    }
    let label = this.label;
    if (
      ((label.anchor = anchor),
      (label.title !== title || label.sub !== sub || label.bad !== bad) &&
        ((label.title = title),
        (label.sub = sub),
        (label.bad = bad),
        (label.w = null),
        (label.node.className = `xp-etiqueta${bad ? ' mal' : ''}`),
        (label.node.innerHTML = ''),
        label.node.append(document.createTextNode(title)),
        sub))
    ) {
      let small = document.createElement('small');
      ((small.textContent = sub), label.node.append(small));
    }
  }
  /** Quita todos los bocadillos. */
  clearBubbles() {
    for (let item of [...this.items])
      item.kind === 'bubble' && (item.node.remove(), this.items.delete(item), item.done?.());
  }
  /** Proyecta cada elemento a pantalla y anima su opacidad y posición. */
  update(dt) {
    let vw = innerWidth,
      vh = innerHeight;
    for (let item of [...this.items]) {
      if (((item.t += dt), item.t >= item.dur)) {
        (item.node.remove(), this.items.delete(item), item.done?.());
        continue;
      }
      let p = typeof item.anchor == 'function' ? item.anchor(this.v) : this.v.copy(item.anchor);
      if (!p) continue;
      if ((p.project(this.camera), p.z > 1 || p.z < -1)) {
        item.node.style.opacity = '0';
        continue;
      }
      let x = (p.x * 0.5 + 0.5) * vw,
        y = (-p.y * 0.5 + 0.5) * vh;
      item.w == null && ((item.w = item.node.offsetWidth), (item.h = item.node.offsetHeight));
      let w = item.w,
        h = item.h,
        alpha = 1;
      if (item.kind === 'float') {
        let k = item.t / item.dur;
        ((y -= item.rise * k + 8),
          (alpha = k < 0.15 ? k / 0.15 : k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1),
          (x -= w / 2),
          (y -= h));
      } else
        item.kind === 'bubble'
          ? ((x -= w / 2),
            (y -= h + 14),
            (alpha = item.t < 0.2 ? item.t / 0.2 : item.dur - item.t < 0.4 ? (item.dur - item.t) / 0.4 : 1),
            (x = Math.max(8, Math.min(vw - w - 8, x))),
            (y = Math.max(8, y)))
          : ((x -= w / 2), (y -= h + 10), (x = Math.max(6, Math.min(vw - w - 6, x))));
      ((item.node.style.opacity = String(alpha)),
        (item.node.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`));
    }
  }
  dispose() {
    (this.el.remove(), this.items.clear());
  }
};

export { Floaters };
