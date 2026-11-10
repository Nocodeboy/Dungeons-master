// explore/marks.js
// Reconstruido de publicado/juego.js (módulo __esm «Mk»). Nombres locales aún minificados.

import {
  CanvasTexture,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RingGeometry,
  SRGBColorSpace,
  ShapeGeometry,
  Vector3,
} from 'three';
import { Us, nt, fn } from './hex.js';

function $u(o, e, t = 0.8, a = null) {
  let n = new Mesh(
    o,
    new MeshBasicMaterial({
      color: e,
      map: a,
      transparent: !0,
      opacity: t,
      depthWrite: !1,
      toneMapped: !1,
      fog: !1,
      side: DoubleSide,
    }),
  );
  return ((n.rotation.x = -Math.PI / 2), (n.renderOrder = 3), n);
}
const Tk = (() => {
  let o = document.createElement('canvas');
  o.width = o.height = 128;
  let e = o.getContext('2d');
  ((e.strokeStyle = '#fff'),
    (e.lineWidth = 7),
    e.beginPath(),
    e.arc(64, 64, 54, 0, Math.PI * 2),
    e.stroke(),
    (e.globalAlpha = 0.4),
    (e.lineWidth = 3),
    e.beginPath(),
    e.arc(64, 64, 44, 0, Math.PI * 2),
    e.stroke());
  let t = new CanvasTexture(o);
  return ((t.colorSpace = SRGBColorSpace), t);
})();
const nN = (() => {
  let o = document.createElement('canvas');
  o.width = o.height = 128;
  let e = o.getContext('2d');
  ((e.strokeStyle = '#fff'), (e.lineWidth = 14), (e.lineCap = 'round'), (e.lineJoin = 'round'));
  for (let a of [34, 70])
    (e.beginPath(), e.moveTo(30, a + 26), e.lineTo(64, a), e.lineTo(98, a + 26), e.stroke());
  let t = new CanvasTexture(o);
  return ((t.colorSpace = SRGBColorSpace), t);
})();
const Qr = {
  leader: 15779936,
  selected: 9425018,
  member: 9425018,
  hover: 16777215,
  npc: 9423103,
  enemy: 16734778,
  object: 15784080,
  bad: 16728112,
};
const r0 = class {
  constructor(e, t) {
    ((this.three = e),
      (this.world = t),
      (this.group = new Group()),
      (this.group.name = 'marcas_exploracion'),
      e.add(this.group));
    let a = new RingGeometry(fn * nt * 0.62, fn * nt * 0.86, 6, 1);
    (a.rotateZ(Math.PI / 6),
      (this.dest = $u(a, 15779936, 0)),
      (this.dest.visible = !1),
      this.group.add(this.dest),
      (this.destT = 0),
      (this.ringGeo = new PlaneGeometry(1.25, 1.25)),
      (this.rings = new Map()),
      (this.hover = $u(new PlaneGeometry(1.4, 1.4), Qr.hover, 0, Tk)),
      (this.hover.visible = !1),
      this.group.add(this.hover),
      (this.hoverTarget = null),
      (this.exits = []),
      (this.traps = new Map()),
      (this.t = 0),
      (this.v = new Vector3()));
  }
  destination(e, t = !0) {
    (this.world.cellToWorld(e, this.v),
      this.dest.position.set(this.v.x, this.v.y + 0.04, this.v.z),
      this.dest.material.color.setHex(t ? 15779936 : Qr.bad),
      (this.dest.visible = !0),
      (this.destT = 0));
  }
  clearDestination() {
    this.dest.visible = !1;
  }
  ring(e, t, a) {
    let n = this.rings.get(e);
    if (!a) {
      n && (n.mesh.visible = !1);
      return;
    }
    (n ||
      ((n = { mesh: $u(this.ringGeo, Qr.member, 0.75, Tk), root: t }),
      this.group.add(n.mesh),
      this.rings.set(e, n)),
      (n.root = t),
      (n.mesh.visible = !0),
      n.mesh.material.color.setHex(Qr[a] ?? Qr.member),
      (n.mesh.material.opacity = a === 'leader' ? 0.95 : a === 'selected' ? 0.75 : 0.35),
      (n.state = a));
  }
  removeRing(e) {
    let t = this.rings.get(e);
    t && (this.group.remove(t.mesh), t.mesh.material.dispose(), this.rings.delete(e));
  }
  hideRings(e) {
    for (let t of this.rings.values()) t.mesh.visible = !e && !!t.state;
  }
  setHover(e) {
    if (((this.hoverTarget = e), (this.hover.visible = !!e), e)) {
      this.hover.material.color.setHex(Qr[e.kind] ?? Qr.hover);
      let t = e.size || 1;
      this.hover.scale.set(t, t, 1);
    }
  }
  setExits(e) {
    for (let t of this.exits) this.group.remove(t);
    this.exits = [];
    for (let t of e)
      for (let a of t.cells || []) {
        let n = $u(new PlaneGeometry(1.1, 1.1), t.usable ? 15782016 : 10128500, t.usable ? 0.7 : 0.35, nN);
        (this.world.cellToWorld(a, this.v), n.position.set(this.v.x, this.v.y + 0.05, this.v.z));
        let s = this.world.width || 0,
          i = this.world.height || 0,
          r = 0;
        (a[0] <= 0
          ? (r = Math.PI / 2)
          : s && a[0] >= s - 1
            ? (r = -Math.PI / 2)
            : a[1] <= 0
              ? (r = Math.PI)
              : i && a[1] >= i - 1 && (r = 0),
          (n.rotation.z = r),
          (n.userData.base = t.usable ? 0.7 : 0.35),
          this.group.add(n),
          this.exits.push(n));
      }
  }
  trap(e, t) {
    let a = this.traps.get(e);
    if ((a && (this.group.remove(a), this.traps.delete(e)), !t)) return;
    let n = Us(fn * nt * 0.9),
      s = $u(new ShapeGeometry(n), 16724e3, 0.32);
    (this.world.cellToWorld(t, this.v),
      s.position.set(this.v.x, this.v.y + 0.045, this.v.z),
      this.group.add(s),
      this.traps.set(e, s));
  }
  update(e) {
    if (((this.t += e), this.dest.visible)) {
      this.destT += e;
      let t = this.destT;
      this.dest.material.opacity = Math.max(0, 0.95 - t * 0.55);
      let a = 1 + Math.sin(t * 7) * 0.06;
      (this.dest.scale.set(a, a, 1), t > 1.8 && (this.dest.visible = !1));
    }
    for (let t of this.rings.values()) {
      if (!t.mesh.visible || !t.root) continue;
      let a = t.root.position;
      if ((t.mesh.position.set(a.x, a.y + 0.035, a.z), t.state === 'leader')) {
        let n = 1 + Math.sin(this.t * 3) * 0.04;
        t.mesh.scale.set(n, n, 1);
      }
    }
    if (this.hover.visible && this.hoverTarget?.pos) {
      let t = this.hoverTarget.pos(this.v);
      (this.hover.position.set(t.x, t.y + 0.04, t.z),
        (this.hover.material.opacity = 0.55 + Math.sin(this.t * 6) * 0.2));
    }
    for (let t of this.exits) t.material.opacity = t.userData.base * (0.75 + 0.25 * Math.sin(this.t * 3));
    for (let t of this.traps.values()) t.material.opacity = 0.25 + 0.12 * Math.sin(this.t * 4);
  }
  dispose() {
    (this.three.remove(this.group),
      this.group.traverse((e) => {
        (e.geometry?.dispose?.(), e.material?.dispose?.());
      }));
  }
};

export { r0 };
