// explore/floaters.js
// Reconstruido de publicado/juego.js (módulo __esm «wk»). Nombres locales aún minificados.

import { Vector3 } from 'three';

const aN = `
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
const i0 = class {
  constructor(e, t = document.body) {
    ((this.camera = e), (this.el = document.createElement('div')), (this.el.className = 'xp-capa'));
    let a = document.createElement('style');
    ((a.textContent = aN),
      this.el.append(a),
      t.prepend(this.el),
      (this.items = new Set()),
      (this.v = new Vector3()),
      (this.label = null));
  }
  _add(e, t, a) {
    let n = { node: e, anchor: t, t: 0, ...a };
    return (this.el.append(e), this.items.add(n), n);
  }
  float(e, t, a = '', { dur: n = 1.4, size: s = 1 } = {}) {
    let i = document.createElement('div');
    ((i.className = `xp-flota ${a}`), (i.textContent = t), s !== 1 && (i.style.fontSize = `${17 * s}px`));
    let r = typeof e == 'function' ? e().clone() : e.clone();
    return this._add(i, r, { kind: 'float', dur: n, rise: 46 });
  }
  alert(e, t = '\xA1!', a = 1.2) {
    let n = document.createElement('div');
    return (
      (n.className = 'xp-alerta'),
      (n.textContent = t),
      this._add(n, e, { kind: 'float', dur: a, rise: 14 })
    );
  }
  bubble(e, t, a, { dur: n = null } = {}) {
    let s = document.createElement('div');
    if (((s.className = 'xp-bocadillo'), t)) {
      let l = document.createElement('b');
      ((l.textContent = t), s.append(l));
    }
    s.append(document.createTextNode(a));
    let i = n ?? Math.min(9, 2.2 + a.length * 0.055),
      r = this._add(s, e, { kind: 'bubble', dur: i });
    return new Promise((l) => (r.done = l));
  }
  setLabel(e, t, a = '', n = !1) {
    if (!t) {
      this.label && (this.label.node.remove(), this.items.delete(this.label), (this.label = null));
      return;
    }
    if (!this.label) {
      let i = document.createElement('div');
      ((i.className = 'xp-etiqueta'), (this.label = this._add(i, e, { kind: 'label', dur: 1 / 0 })));
    }
    let s = this.label;
    if (
      ((s.anchor = e),
      (s.title !== t || s.sub !== a || s.bad !== n) &&
        ((s.title = t),
        (s.sub = a),
        (s.bad = n),
        (s.w = null),
        (s.node.className = `xp-etiqueta${n ? ' mal' : ''}`),
        (s.node.innerHTML = ''),
        s.node.append(document.createTextNode(t)),
        a))
    ) {
      let i = document.createElement('small');
      ((i.textContent = a), s.node.append(i));
    }
  }
  clearBubbles() {
    for (let e of [...this.items]) e.kind === 'bubble' && (e.node.remove(), this.items.delete(e), e.done?.());
  }
  update(e) {
    let t = innerWidth,
      a = innerHeight;
    for (let n of [...this.items]) {
      if (((n.t += e), n.t >= n.dur)) {
        (n.node.remove(), this.items.delete(n), n.done?.());
        continue;
      }
      let s = typeof n.anchor == 'function' ? n.anchor(this.v) : this.v.copy(n.anchor);
      if (!s) continue;
      if ((s.project(this.camera), s.z > 1 || s.z < -1)) {
        n.node.style.opacity = '0';
        continue;
      }
      let i = (s.x * 0.5 + 0.5) * t,
        r = (-s.y * 0.5 + 0.5) * a;
      n.w == null && ((n.w = n.node.offsetWidth), (n.h = n.node.offsetHeight));
      let l = n.w,
        c = n.h,
        d = 1;
      if (n.kind === 'float') {
        let u = n.t / n.dur;
        ((r -= n.rise * u + 8),
          (d = u < 0.15 ? u / 0.15 : u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1),
          (i -= l / 2),
          (r -= c));
      } else
        n.kind === 'bubble'
          ? ((i -= l / 2),
            (r -= c + 14),
            (d = n.t < 0.2 ? n.t / 0.2 : n.dur - n.t < 0.4 ? (n.dur - n.t) / 0.4 : 1),
            (i = Math.max(8, Math.min(t - l - 8, i))),
            (r = Math.max(8, r)))
          : ((i -= l / 2), (r -= c + 10), (i = Math.max(6, Math.min(t - l - 6, i))));
      ((n.node.style.opacity = String(d)),
        (n.node.style.transform = `translate(${i.toFixed(1)}px,${r.toFixed(1)}px)`));
    }
  }
  dispose() {
    (this.el.remove(), this.items.clear());
  }
};

export { i0 };
