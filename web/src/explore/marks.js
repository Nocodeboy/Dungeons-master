// explore/marks.js — Marcas en el suelo de la exploración: destino del movimiento, anillos de los
// miembros del grupo (líder, seleccionado), resalte bajo el puntero, flechas de salida y trampas
// descubiertas. Lo usa explore/index.js.
// Reconstruido de publicado/juego.js (módulo __esm «Mk»).

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
import { hexShape, HEX_SIZE, HEX_RADIUS } from './hex.js';

/** Malla plana tumbada sobre el suelo, sin niebla ni mapeo de tonos. */
function flatMesh(geo, color, opacity = 0.8, map = null) {
  let mesh = new Mesh(
    geo,
    new MeshBasicMaterial({
      color,
      map,
      transparent: !0,
      opacity,
      depthWrite: !1,
      toneMapped: !1,
      fog: !1,
      side: DoubleSide,
    }),
  );
  return ((mesh.rotation.x = -Math.PI / 2), (mesh.renderOrder = 3), mesh);
}
/** Textura de anillo doble (se tiñe con el color de la marca). */
const RING_TEXTURE = (() => {
  let canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  let ctx = canvas.getContext('2d');
  ((ctx.strokeStyle = '#fff'),
    (ctx.lineWidth = 7),
    ctx.beginPath(),
    ctx.arc(64, 64, 54, 0, Math.PI * 2),
    ctx.stroke(),
    (ctx.globalAlpha = 0.4),
    (ctx.lineWidth = 3),
    ctx.beginPath(),
    ctx.arc(64, 64, 44, 0, Math.PI * 2),
    ctx.stroke());
  let tex = new CanvasTexture(canvas);
  return ((tex.colorSpace = SRGBColorSpace), tex);
})();
/** Textura de doble flecha para las salidas del nivel. */
const EXIT_TEXTURE = (() => {
  let canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  let ctx = canvas.getContext('2d');
  ((ctx.strokeStyle = '#fff'), (ctx.lineWidth = 14), (ctx.lineCap = 'round'), (ctx.lineJoin = 'round'));
  for (let y of [34, 70])
    (ctx.beginPath(), ctx.moveTo(30, y + 26), ctx.lineTo(64, y), ctx.lineTo(98, y + 26), ctx.stroke());
  let tex = new CanvasTexture(canvas);
  return ((tex.colorSpace = SRGBColorSpace), tex);
})();
/** Colores por tipo de marca o de objeto señalado. */
const MARK_COLORS = {
  leader: 15779936,
  selected: 9425018,
  member: 9425018,
  hover: 16777215,
  npc: 9423103,
  enemy: 16734778,
  object: 15784080,
  bad: 16728112,
};
/** Marcas del suelo. `world` da cellToWorld y el tamaño del mapa. */
const ExploreMarks = class {
  constructor(three, world) {
    ((this.three = three),
      (this.world = world),
      (this.group = new Group()),
      (this.group.name = 'marcas_exploracion'),
      three.add(this.group));
    let geo = new RingGeometry(HEX_RADIUS * HEX_SIZE * 0.62, HEX_RADIUS * HEX_SIZE * 0.86, 6, 1);
    (geo.rotateZ(Math.PI / 6),
      (this.dest = flatMesh(geo, 15779936, 0)),
      (this.dest.visible = !1),
      this.group.add(this.dest),
      (this.destT = 0),
      (this.ringGeo = new PlaneGeometry(1.25, 1.25)),
      (this.rings = new Map()),
      (this.hover = flatMesh(new PlaneGeometry(1.4, 1.4), MARK_COLORS.hover, 0, RING_TEXTURE)),
      (this.hover.visible = !1),
      this.group.add(this.hover),
      (this.hoverTarget = null),
      (this.exits = []),
      (this.traps = new Map()),
      (this.t = 0),
      (this.v = new Vector3()));
  }
  /** Muestra el hexágono de destino (rojo si no se puede llegar). */
  destination(cell, ok = !0) {
    (this.world.cellToWorld(cell, this.v),
      this.dest.position.set(this.v.x, this.v.y + 0.04, this.v.z),
      this.dest.material.color.setHex(ok ? 15779936 : MARK_COLORS.bad),
      (this.dest.visible = !0),
      (this.destT = 0));
  }
  clearDestination() {
    this.dest.visible = !1;
  }
  /** Anillo bajo un personaje; `state`: leader, selected, member… o falso para ocultarlo. */
  ring(id, root, state) {
    let ring = this.rings.get(id);
    if (!state) {
      ring && (ring.mesh.visible = !1);
      return;
    }
    (ring ||
      ((ring = { mesh: flatMesh(this.ringGeo, MARK_COLORS.member, 0.75, RING_TEXTURE), root }),
      this.group.add(ring.mesh),
      this.rings.set(id, ring)),
      (ring.root = root),
      (ring.mesh.visible = !0),
      ring.mesh.material.color.setHex(MARK_COLORS[state] ?? MARK_COLORS.member),
      (ring.mesh.material.opacity = state === 'leader' ? 0.95 : state === 'selected' ? 0.75 : 0.35),
      (ring.state = state));
  }
  removeRing(id) {
    let ring = this.rings.get(id);
    ring && (this.group.remove(ring.mesh), ring.mesh.material.dispose(), this.rings.delete(id));
  }
  /** Oculta o vuelve a mostrar todos los anillos. */
  hideRings(hidden) {
    for (let ring of this.rings.values()) ring.mesh.visible = !hidden && !!ring.state;
  }
  /** Resalte bajo el objeto señalado (`target.kind`, `size`, `pos(v)`), o null. */
  setHover(target) {
    if (((this.hoverTarget = target), (this.hover.visible = !!target), target)) {
      this.hover.material.color.setHex(MARK_COLORS[target.kind] ?? MARK_COLORS.hover);
      let size = target.size || 1;
      this.hover.scale.set(size, size, 1);
    }
  }
  /** Flechas en las casillas de salida, giradas hacia el borde del mapa. */
  setExits(exits) {
    for (let mesh of this.exits) this.group.remove(mesh);
    this.exits = [];
    for (let exit of exits)
      for (let cell of exit.cells || []) {
        let mesh = flatMesh(
          new PlaneGeometry(1.1, 1.1),
          exit.usable ? 15782016 : 10128500,
          exit.usable ? 0.7 : 0.35,
          EXIT_TEXTURE,
        );
        (this.world.cellToWorld(cell, this.v), mesh.position.set(this.v.x, this.v.y + 0.05, this.v.z));
        let w = this.world.width || 0,
          h = this.world.height || 0,
          rot = 0;
        (cell[0] <= 0
          ? (rot = Math.PI / 2)
          : w && cell[0] >= w - 1
            ? (rot = -Math.PI / 2)
            : cell[1] <= 0
              ? (rot = Math.PI)
              : h && cell[1] >= h - 1 && (rot = 0),
          (mesh.rotation.z = rot),
          (mesh.userData.base = exit.usable ? 0.7 : 0.35),
          this.group.add(mesh),
          this.exits.push(mesh));
      }
  }
  /** Marca (o quita, sin `cell`) una trampa descubierta. */
  trap(id, cell) {
    let old = this.traps.get(id);
    if ((old && (this.group.remove(old), this.traps.delete(id)), !cell)) return;
    let shape = hexShape(HEX_RADIUS * HEX_SIZE * 0.9),
      mesh = flatMesh(new ShapeGeometry(shape), 16724e3, 0.32);
    (this.world.cellToWorld(cell, this.v),
      mesh.position.set(this.v.x, this.v.y + 0.045, this.v.z),
      this.group.add(mesh),
      this.traps.set(id, mesh));
  }
  /** Animación: pulso del destino, del líder, del resalte, de las salidas y de las trampas. */
  update(dt) {
    if (((this.t += dt), this.dest.visible)) {
      this.destT += dt;
      let age = this.destT;
      this.dest.material.opacity = Math.max(0, 0.95 - age * 0.55);
      let scale = 1 + Math.sin(age * 7) * 0.06;
      (this.dest.scale.set(scale, scale, 1), age > 1.8 && (this.dest.visible = !1));
    }
    for (let ring of this.rings.values()) {
      if (!ring.mesh.visible || !ring.root) continue;
      let pos = ring.root.position;
      if ((ring.mesh.position.set(pos.x, pos.y + 0.035, pos.z), ring.state === 'leader')) {
        let scale = 1 + Math.sin(this.t * 3) * 0.04;
        ring.mesh.scale.set(scale, scale, 1);
      }
    }
    if (this.hover.visible && this.hoverTarget?.pos) {
      let p = this.hoverTarget.pos(this.v);
      (this.hover.position.set(p.x, p.y + 0.04, p.z),
        (this.hover.material.opacity = 0.55 + Math.sin(this.t * 6) * 0.2));
    }
    for (let mesh of this.exits)
      mesh.material.opacity = mesh.userData.base * (0.75 + 0.25 * Math.sin(this.t * 3));
    for (let mesh of this.traps.values()) mesh.material.opacity = 0.25 + 0.12 * Math.sin(this.t * 4);
  }
  dispose() {
    (this.three.remove(this.group),
      this.group.traverse((obj) => {
        (obj.geometry?.dispose?.(), obj.material?.dispose?.());
      }));
  }
};

export { ExploreMarks };
