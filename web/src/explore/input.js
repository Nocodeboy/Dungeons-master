// explore/input.js
// Reconstruido de publicado/juego.js (módulo __esm «_k»). Nombres locales aún minificados.

import { MOUSE, MathUtils, TOUCH, Vector3 } from 'three';

const tN = 9;
const G1 = 550;
const ExploreInput = class {
  constructor(e, { bounds: t, onTap: a, onLongPress: n, onHover: s, settings: i } = {}) {
    ((this.stage = e),
      (this.camera = e.camera),
      (this.controls = e.controls),
      (this.dom = e.renderer.domElement),
      (this.bounds = t),
      (this.onTap = a),
      (this.onLongPress = n),
      (this.onHover = s),
      (this.settings = i || {}),
      (this.goal = null),
      (this.followFn = null),
      (this.following = !0),
      (this.keys = new Set()),
      (this.enabled = !0),
      (this._saved = {
        mouseButtons: { ...this.controls.mouseButtons },
        touches: { ...this.controls.touches },
        minDistance: this.controls.minDistance,
        maxDistance: this.controls.maxDistance,
        minPolar: this.controls.minPolarAngle,
        maxPolar: this.controls.maxPolarAngle,
        enablePan: this.controls.enablePan,
        screenSpacePanning: this.controls.screenSpacePanning,
      }),
      this.configure(),
      (this.press = null),
      (this.pointers = new Map()),
      this._bind());
  }
  configure() {
    let e = this.controls;
    ((e.enabled = this.enabled),
      (e.enablePan = !0),
      (e.screenSpacePanning = !1),
      (e.mouseButtons = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE }),
      (e.touches = { ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_ROTATE }),
      (e.minDistance = 7),
      (e.maxDistance = 46),
      (e.minPolarAngle = MathUtils.degToRad(24)),
      (e.maxPolarAngle = MathUtils.degToRad(62)),
      (e.panSpeed = 1.1),
      (e.zoomSpeed = 1.1));
  }
  _bind() {
    let e = this.dom;
    ((this._h = {
      down: (t) => {
        if ((this.pointers.set(t.pointerId, { x: t.clientX, y: t.clientY }), this.pointers.size > 1)) {
          this._cancelPress();
          return;
        }
        if (
          !(t.button !== 0 && t.pointerType === 'mouse') &&
          ((this.press = {
            x: t.clientX,
            y: t.clientY,
            ts: t.timeStamp,
            moved: !1,
            long: !1,
            id: t.pointerId,
            type: t.pointerType,
          }),
          clearTimeout(this._longT),
          t.pointerType !== 'mouse')
        ) {
          let a = this.press;
          this._longT = setTimeout(() => {
            requestAnimationFrame(() => {
              this.press === a &&
                !a.moved &&
                this.enabled &&
                performance.now() - a.ts > G1 &&
                ((a.long = !0), this.onLongPress?.(a.x, a.y, a.type));
            });
          }, G1 + 50);
        }
      },
      move: (t) => {
        this.pointers.has(t.pointerId) && this.pointers.set(t.pointerId, { x: t.clientX, y: t.clientY });
        let a = this.press;
        (a &&
          a.id === t.pointerId &&
          !a.moved &&
          Math.hypot(t.clientX - a.x, t.clientY - a.y) > tN &&
          ((a.moved = !0), clearTimeout(this._longT), (this.following = !1), (this.goal = null)),
          t.pointerType === 'mouse' &&
            !a &&
            (t.target === this.dom ? this.onHover?.(t.clientX, t.clientY) : this.onHover?.(null, null)));
      },
      up: (t) => {
        this.pointers.delete(t.pointerId);
        let a = this.press;
        if (
          (clearTimeout(this._longT),
          (this.press = null),
          !a || a.id !== t.pointerId || a.moved || a.long || !this.enabled)
        )
          return;
        if (t.timeStamp - a.ts > G1) {
          this.onLongPress?.(a.x, a.y, a.type);
          return;
        }
        this.onTap?.(t.clientX, t.clientY, {
          shift: t.shiftKey,
          ctrl: t.ctrlKey || t.metaKey,
          type: t.pointerType,
          button: t.button,
        });
      },
      cancel: (t) => {
        (this.pointers.delete(t.pointerId), this._cancelPress());
      },
      leave: () => this.onHover?.(null, null),
      key: (t) => {
        if (
          (t.target && /INPUT|TEXTAREA|SELECT/.test(t.target.tagName)) ||
          (this.suspended && t.type === 'keydown')
        )
          return;
        let a = t.key.toLowerCase();
        t.type === 'keydown'
          ? [
              'w',
              'a',
              's',
              'd',
              'q',
              'e',
              'arrowup',
              'arrowdown',
              'arrowleft',
              'arrowright',
              '+',
              '-',
              '=',
            ].includes(a) &&
            (this.keys.add(a),
            ['q', 'e', '+', '-', '='].includes(a) || ((this.following = !1), (this.goal = null)))
          : this.keys.delete(a);
      },
      blur: () => this.keys.clear(),
      wheel: () => {},
    }),
      e.addEventListener('pointerdown', this._h.down),
      addEventListener('pointermove', this._h.move),
      addEventListener('pointerup', this._h.up),
      addEventListener('pointercancel', this._h.cancel),
      e.addEventListener('pointerleave', this._h.leave),
      addEventListener('keydown', this._h.key),
      addEventListener('keyup', this._h.key),
      addEventListener('blur', this._h.blur));
  }
  _cancelPress() {
    (clearTimeout(this._longT), this.press && (this.press.moved = !0));
  }
  setEnabled(e) {
    ((this.enabled = e), (this.controls.enabled = e), e || this.keys.clear());
  }
  focus(e, t = null, { instant: a = !1 } = {}) {
    let n = new Vector3(e.x, (e.y || 0) + 0.6, e.z);
    if (a) {
      let s = this.controls,
        i = this.camera.position.clone().sub(s.target);
      (t && i.setLength(t), s.target.copy(n), this.camera.position.copy(n).add(i), (this.goal = null));
      return;
    }
    this.goal = { target: n, dist: t ?? this.goal?.dist ?? null };
  }
  place(e, { dist: t = 22, yaw: a = -0.55, pitch: n = 0.92 } = {}) {
    let s = this.controls;
    s.target.set(e.x, 0.6, e.z);
    let i = new Vector3(Math.sin(a) * Math.cos(n), Math.sin(n), Math.cos(a) * Math.cos(n)).multiplyScalar(t);
    (this.camera.position.copy(s.target).add(i), this.camera.lookAt(s.target), s.update());
  }
  follow(e) {
    ((this.followFn = e), (this.following = !0));
  }
  dist() {
    return this.camera.position.distanceTo(this.controls.target);
  }
  rotate(e) {
    let t = this.controls.target,
      a = this.camera.position.clone().sub(t);
    (a.applyAxisAngle(new Vector3(0, 1, 0), e), this.camera.position.copy(t).add(a));
  }
  zoom(e) {
    let t = this.controls.target,
      a = this.camera.position.clone().sub(t),
      n = MathUtils.clamp(a.length() * e, this.controls.minDistance, this.controls.maxDistance);
    (a.setLength(n), this.camera.position.copy(t).add(a));
  }
  update(e) {
    if (this.suspended) return;
    let a = this.controls.target;
    if (this.following && this.followFn && !this.goal) {
      let s = this.followFn();
      if (s) {
        let i = new Vector3(s.x, 0.6, s.z),
          r = 1 - Math.exp(-e * 3),
          l = a.clone();
        (a.lerp(i, r), this.camera.position.add(a.clone().sub(l)));
      }
    }
    if (this.goal) {
      let s = 1 - Math.exp(-e * 4.5),
        i = a.clone();
      if ((a.lerp(this.goal.target, s), this.camera.position.add(a.clone().sub(i)), this.goal.dist)) {
        let r = this.camera.position.clone().sub(a),
          l = r.length();
        (r.setLength(l + (this.goal.dist - l) * s), this.camera.position.copy(a).add(r));
      }
      a.distanceTo(this.goal.target) < 0.03 &&
        (!this.goal.dist || Math.abs(this.dist() - this.goal.dist) < 0.06) &&
        (this.goal = null);
    }
    if (this.keys.size && this.enabled) {
      let s = (this.settings.cameraSpeed || 1) * Math.max(8, this.dist() * 0.75),
        i = new Vector3(),
        r = a.clone().sub(this.camera.position).setY(0).normalize(),
        l = new Vector3(-r.z, 0, r.x),
        c = this.keys;
      ((c.has('w') || c.has('arrowup')) && i.add(r),
        (c.has('s') || c.has('arrowdown')) && i.sub(r),
        (c.has('d') || c.has('arrowright')) && i.add(l),
        (c.has('a') || c.has('arrowleft')) && i.sub(l),
        i.lengthSq() && (i.setLength(e * s), a.add(i), this.camera.position.add(i)),
        c.has('q') && this.rotate(e * 1.7),
        c.has('e') && this.rotate(-e * 1.7),
        (c.has('+') || c.has('=')) && this.zoom(1 - e * 1.4),
        c.has('-') && this.zoom(1 + e * 1.4));
    }
    let n = this.bounds;
    if (n) {
      let s = MathUtils.clamp(a.x, n.min.x, n.max.x),
        i = MathUtils.clamp(a.z, n.min.z, n.max.z);
      (s !== a.x || i !== a.z) &&
        ((this.camera.position.x += s - a.x), (this.camera.position.z += i - a.z), (a.x = s), (a.z = i));
    }
  }
  dispose() {
    let e = this.dom;
    (e.removeEventListener('pointerdown', this._h.down),
      removeEventListener('pointermove', this._h.move),
      removeEventListener('pointerup', this._h.up),
      removeEventListener('pointercancel', this._h.cancel),
      e.removeEventListener('pointerleave', this._h.leave),
      removeEventListener('keydown', this._h.key),
      removeEventListener('keyup', this._h.key),
      removeEventListener('blur', this._h.blur),
      clearTimeout(this._longT));
    let t = this.controls,
      a = this._saved;
    ((t.mouseButtons = a.mouseButtons),
      (t.touches = a.touches),
      (t.minDistance = a.minDistance),
      (t.maxDistance = a.maxDistance),
      (t.minPolarAngle = a.minPolar),
      (t.maxPolarAngle = a.maxPolar),
      (t.enablePan = a.enablePan),
      (t.screenSpacePanning = a.screenSpacePanning),
      (t.enabled = !0));
  }
};

export { ExploreInput };
