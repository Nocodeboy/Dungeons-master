// explore/input.js — Entrada de la exploración (ExploreInput): toques y clics (tocar = mover o usar,
// pulsación larga = menú contextual), puntero encima, teclado (WASD/flechas mueven la cámara, Q/E giran,
// +/- acercan) y la cámara que sigue al grupo sobre los OrbitControls de stage.js (se restauran al salir).
// Lo usa explore/index.js.
// Reconstruido de publicado/juego.js (módulo __esm «_k»).

import { MOUSE, MathUtils, TOUCH, Vector3 } from 'three';

/** Píxeles de desplazamiento a partir de los que una pulsación es un arrastre (no un toque). */
const DRAG_THRESHOLD = 9;
/** Duración de una pulsación larga (ms). */
const LONG_PRESS_MS = 550;
/**
 * Control de cámara y puntero. Las retrollamadas reciben coordenadas de pantalla:
 * onTap(x, y, {shift, ctrl, type, button}), onLongPress(x, y, type) y onHover(x, y) (null, null al salir).
 */
const ExploreInput = class {
  constructor(stage, { bounds, onTap, onLongPress, onHover, settings } = {}) {
    ((this.stage = stage),
      (this.camera = stage.camera),
      (this.controls = stage.controls),
      (this.dom = stage.renderer.domElement),
      (this.bounds = bounds),
      (this.onTap = onTap),
      (this.onLongPress = onLongPress),
      (this.onHover = onHover),
      (this.settings = settings || {}),
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
  /** Ajusta los OrbitControls para la exploración: arrastrar desplaza, rueda/pellizco acerca, botón derecho gira. */
  configure() {
    let controls = this.controls;
    ((controls.enabled = this.enabled),
      (controls.enablePan = !0),
      (controls.screenSpacePanning = !1),
      (controls.mouseButtons = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE }),
      (controls.touches = { ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_ROTATE }),
      (controls.minDistance = 7),
      (controls.maxDistance = 46),
      (controls.minPolarAngle = MathUtils.degToRad(24)),
      (controls.maxPolarAngle = MathUtils.degToRad(62)),
      (controls.panSpeed = 1.1),
      (controls.zoomSpeed = 1.1));
  }
  /** Registra los oyentes de puntero y teclado (en el lienzo y en la ventana). */
  _bind() {
    let dom = this.dom;
    ((this._h = {
      down: (ev) => {
        if ((this.pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY }), this.pointers.size > 1)) {
          this._cancelPress();
          return;
        }
        if (
          !(ev.button !== 0 && ev.pointerType === 'mouse') &&
          ((this.press = {
            x: ev.clientX,
            y: ev.clientY,
            ts: ev.timeStamp,
            moved: !1,
            long: !1,
            id: ev.pointerId,
            type: ev.pointerType,
          }),
          clearTimeout(this._longT),
          ev.pointerType !== 'mouse')
        ) {
          let press = this.press;
          this._longT = setTimeout(() => {
            requestAnimationFrame(() => {
              this.press === press &&
                !press.moved &&
                this.enabled &&
                performance.now() - press.ts > LONG_PRESS_MS &&
                ((press.long = !0), this.onLongPress?.(press.x, press.y, press.type));
            });
          }, LONG_PRESS_MS + 50);
        }
      },
      move: (ev) => {
        this.pointers.has(ev.pointerId) && this.pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        let press = this.press;
        (press &&
          press.id === ev.pointerId &&
          !press.moved &&
          Math.hypot(ev.clientX - press.x, ev.clientY - press.y) > DRAG_THRESHOLD &&
          ((press.moved = !0), clearTimeout(this._longT), (this.following = !1), (this.goal = null)),
          ev.pointerType === 'mouse' &&
            !press &&
            (ev.target === this.dom ? this.onHover?.(ev.clientX, ev.clientY) : this.onHover?.(null, null)));
      },
      up: (ev) => {
        this.pointers.delete(ev.pointerId);
        let press = this.press;
        if (
          (clearTimeout(this._longT),
          (this.press = null),
          !press || press.id !== ev.pointerId || press.moved || press.long || !this.enabled)
        )
          return;
        if (ev.timeStamp - press.ts > LONG_PRESS_MS) {
          this.onLongPress?.(press.x, press.y, press.type);
          return;
        }
        this.onTap?.(ev.clientX, ev.clientY, {
          shift: ev.shiftKey,
          ctrl: ev.ctrlKey || ev.metaKey,
          type: ev.pointerType,
          button: ev.button,
        });
      },
      cancel: (ev) => {
        (this.pointers.delete(ev.pointerId), this._cancelPress());
      },
      leave: () => this.onHover?.(null, null),
      key: (ev) => {
        if (
          (ev.target && /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) ||
          (this.suspended && ev.type === 'keydown')
        )
          return;
        let key = ev.key.toLowerCase();
        ev.type === 'keydown'
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
            ].includes(key) &&
            (this.keys.add(key),
            ['q', 'e', '+', '-', '='].includes(key) || ((this.following = !1), (this.goal = null)))
          : this.keys.delete(key);
      },
      blur: () => this.keys.clear(),
      wheel: () => {},
    }),
      dom.addEventListener('pointerdown', this._h.down),
      addEventListener('pointermove', this._h.move),
      addEventListener('pointerup', this._h.up),
      addEventListener('pointercancel', this._h.cancel),
      dom.addEventListener('pointerleave', this._h.leave),
      addEventListener('keydown', this._h.key),
      addEventListener('keyup', this._h.key),
      addEventListener('blur', this._h.blur));
  }
  _cancelPress() {
    (clearTimeout(this._longT), this.press && (this.press.moved = !0));
  }
  /** Activa o desactiva la entrada y los controles de cámara. */
  setEnabled(on) {
    ((this.enabled = on), (this.controls.enabled = on), on || this.keys.clear());
  }
  /** Lleva la cámara hacia `pos` (suave, o al instante) y opcionalmente a la distancia `dist`. */
  focus(pos, dist = null, { instant = !1 } = {}) {
    let target = new Vector3(pos.x, (pos.y || 0) + 0.6, pos.z);
    if (instant) {
      let controls = this.controls,
        offset = this.camera.position.clone().sub(controls.target);
      (dist && offset.setLength(dist),
        controls.target.copy(target),
        this.camera.position.copy(target).add(offset),
        (this.goal = null));
      return;
    }
    this.goal = { target, dist: dist ?? this.goal?.dist ?? null };
  }
  /** Coloca la cámara al instante mirando a `pos` con distancia, guiñada y cabeceo dados. */
  place(pos, { dist = 22, yaw = -0.55, pitch = 0.92 } = {}) {
    let controls = this.controls;
    controls.target.set(pos.x, 0.6, pos.z);
    let offset = new Vector3(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch),
    ).multiplyScalar(dist);
    (this.camera.position.copy(controls.target).add(offset),
      this.camera.lookAt(controls.target),
      controls.update());
  }
  /** Sigue la posición que devuelve `fn` (normalmente el líder) hasta que el jugador mueva la cámara. */
  follow(fn) {
    ((this.followFn = fn), (this.following = !0));
  }
  /** Distancia actual de la cámara a su objetivo. */
  dist() {
    return this.camera.position.distanceTo(this.controls.target);
  }
  /** Gira la cámara alrededor del objetivo (eje vertical). */
  rotate(angle) {
    let target = this.controls.target,
      offset = this.camera.position.clone().sub(target);
    (offset.applyAxisAngle(new Vector3(0, 1, 0), angle), this.camera.position.copy(target).add(offset));
  }
  /** Acerca o aleja la cámara multiplicando su distancia (dentro de los límites). */
  zoom(factor) {
    let target = this.controls.target,
      offset = this.camera.position.clone().sub(target),
      len = MathUtils.clamp(offset.length() * factor, this.controls.minDistance, this.controls.maxDistance);
    (offset.setLength(len), this.camera.position.copy(target).add(offset));
  }
  /** Seguimiento, enfoque suave, movimiento con teclado y límites del mapa (`bounds`). */
  update(dt) {
    if (this.suspended) return;
    let target = this.controls.target;
    if (this.following && this.followFn && !this.goal) {
      let p = this.followFn();
      if (p) {
        let goal = new Vector3(p.x, 0.6, p.z),
          k = 1 - Math.exp(-dt * 3),
          prev = target.clone();
        (target.lerp(goal, k), this.camera.position.add(target.clone().sub(prev)));
      }
    }
    if (this.goal) {
      let k = 1 - Math.exp(-dt * 4.5),
        prev = target.clone();
      if (
        (target.lerp(this.goal.target, k), this.camera.position.add(target.clone().sub(prev)), this.goal.dist)
      ) {
        let offset = this.camera.position.clone().sub(target),
          len = offset.length();
        (offset.setLength(len + (this.goal.dist - len) * k), this.camera.position.copy(target).add(offset));
      }
      target.distanceTo(this.goal.target) < 0.03 &&
        (!this.goal.dist || Math.abs(this.dist() - this.goal.dist) < 0.06) &&
        (this.goal = null);
    }
    if (this.keys.size && this.enabled) {
      let speed = (this.settings.cameraSpeed || 1) * Math.max(8, this.dist() * 0.75),
        move = new Vector3(),
        fwd = target.clone().sub(this.camera.position).setY(0).normalize(),
        right = new Vector3(-fwd.z, 0, fwd.x),
        keys = this.keys;
      ((keys.has('w') || keys.has('arrowup')) && move.add(fwd),
        (keys.has('s') || keys.has('arrowdown')) && move.sub(fwd),
        (keys.has('d') || keys.has('arrowright')) && move.add(right),
        (keys.has('a') || keys.has('arrowleft')) && move.sub(right),
        move.lengthSq() && (move.setLength(dt * speed), target.add(move), this.camera.position.add(move)),
        keys.has('q') && this.rotate(dt * 1.7),
        keys.has('e') && this.rotate(-dt * 1.7),
        (keys.has('+') || keys.has('=')) && this.zoom(1 - dt * 1.4),
        keys.has('-') && this.zoom(1 + dt * 1.4));
    }
    let bounds = this.bounds;
    if (bounds) {
      let cx = MathUtils.clamp(target.x, bounds.min.x, bounds.max.x),
        cz = MathUtils.clamp(target.z, bounds.min.z, bounds.max.z);
      (cx !== target.x || cz !== target.z) &&
        ((this.camera.position.x += cx - target.x),
        (this.camera.position.z += cz - target.z),
        (target.x = cx),
        (target.z = cz));
    }
  }
  /** Quita los oyentes y deja los OrbitControls como estaban. */
  dispose() {
    let dom = this.dom;
    (dom.removeEventListener('pointerdown', this._h.down),
      removeEventListener('pointermove', this._h.move),
      removeEventListener('pointerup', this._h.up),
      removeEventListener('pointercancel', this._h.cancel),
      dom.removeEventListener('pointerleave', this._h.leave),
      removeEventListener('keydown', this._h.key),
      removeEventListener('keyup', this._h.key),
      removeEventListener('blur', this._h.blur),
      clearTimeout(this._longT));
    let controls = this.controls,
      saved = this._saved;
    ((controls.mouseButtons = saved.mouseButtons),
      (controls.touches = saved.touches),
      (controls.minDistance = saved.minDistance),
      (controls.maxDistance = saved.maxDistance),
      (controls.minPolarAngle = saved.minPolar),
      (controls.maxPolarAngle = saved.maxPolar),
      (controls.enablePan = saved.enablePan),
      (controls.screenSpacePanning = saved.screenSpacePanning),
      (controls.enabled = !0));
  }
};

export { ExploreInput };
