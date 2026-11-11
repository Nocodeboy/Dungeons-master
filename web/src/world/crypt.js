// world/crypt.js — muros de mazmorra (`CryptWalls`) a lo largo del borde entre suelo y casillas «#»:
// traza los segmentos sobre una rejilla de medias columnas, los suaviza, los llena de piezas del kit
// «mazmorra» (variantes al azar), pone antorchas y estandartes y recorta los muros que miran a la
// cámara (`updateCutaway`) para ver el interior.
// Reconstruido de publicado/juego.js (módulo __esm «ik»). Lo usa index.js.

import { Group, InstancedMesh, Matrix4, Mesh, Vector3 } from 'three';
import { hasPiece, pieceParts } from './kit.js';
import { worldMaterial } from './materials.js';
import { HEX_SIZE, ROW_STEP } from './grid.js';

/** Variantes de muro [pieza, peso] en la cripta; `PLAIN_WALLS`, en el resto de niveles. */
const CRYPT_WALLS = [
  ['wall', 58],
  ['wall_cracked', 16],
  ['wall_arched', 9],
  ['wall_shelves', 7],
  ['wall_broken', 5],
  ['wall_window', 5],
];
const PLAIN_WALLS = [
  ['wall', 55],
  ['wall_cracked', 28],
  ['wall_broken', 12],
  ['wall_arched', 5],
];
/** Grosor del muro (casillas) y tamaño de las piezas del kit (unidades del modelo). */
const WALL_THICK = 0.3;
const PIECE_W = 4;
const PIECE_H = 4;
/**
 * Muros del nivel. `ctx` es el contexto de buildLevel (map, rnd, ground, fx, ambient); `group` es lo
 * que se añade a la escena. `updateCutaway(dirección de la cámara)` baja los muros que la tapan.
 */
const CryptWalls = class {
  constructor(ctx, { height = 0.85, torches = !0 } = {}) {
    ((this.torches = torches),
      (this.ctx = ctx),
      (this.map = ctx.map),
      (this.rnd = ctx.rnd),
      (this.fullH = Math.max(1.2, height * 2)),
      (this.midH = 0.95),
      (this.lowH = 0.3),
      (this.pieces = []),
      (this.group = new Group()),
      (this.group.name = 'muros'),
      (this.lastFwd = new Vector3()),
      (this.deco = []));
    let segs = this.segments();
    for (let seg of segs) this.addSegment(seg.a, seg.b, seg.n);
    (this.buildMeshes(), this.decorate(), this.updateCutaway(new Vector3(0.57, 0, -0.82), !0));
  }
  /** ¿La casilla es suelo (dentro del mapa y ni «#» ni vacía)? */
  floor(col, row) {
    return this.map.inside(col, row) && this.map.tile(col, row) !== '#' && this.map.tile(col, row) !== ' ';
  }
  /** Suelo en la media columna `hx` de la fila `row` (las filas impares van desplazadas). */
  block(hx, row) {
    let col = Math.floor((row % 2 === 0 ? hx : hx - 1) / 2);
    return this.floor(col, row);
  }
  rowZ(row) {
    return row * ROW_STEP + 0.5;
  }
  /** Segmentos de muro {a, b, n}: bordes verticales suavizados y horizontales entre filas. */
  segments() {
    let segs = [],
      map = this.map,
      hxMin = -4,
      hxMax = map.w * 2 + 4,
      halfRow = ROW_STEP * 0.5,
      edges = {};
    for (let row = -1; row <= map.h; row++) {
      let list = [];
      for (let hx = hxMin; hx < hxMax; hx++) {
        let inA = this.block(hx, row),
          inB = this.block(hx + 1, row);
        inA !== inB && list.push({ x: (hx + 1) * 0.5, n: inA ? -1 : 1, r: row, next: null, prev: null });
      }
      edges[row] = list;
    }
    for (let row = -1; row < map.h; row++)
      for (let edge of edges[row]) {
        let best = null,
          bestD = 0.51;
        for (let cand of edges[row + 1] || [])
          cand.n === edge.n &&
            !cand.prev &&
            Math.abs(cand.x - edge.x) < bestD &&
            ((bestD = Math.abs(cand.x - edge.x)), (best = cand));
        best && ((edge.next = best), (best.prev = edge));
      }
    for (let row = -1; row <= map.h; row++)
      for (let edge of edges[row]) {
        let xs = edge.x;
        (edge.prev && edge.next
          ? (xs = (edge.prev.x + 2 * edge.x + edge.next.x) / 4)
          : edge.prev
            ? (xs = (edge.prev.x + edge.x) / 2)
            : edge.next && (xs = (edge.next.x + edge.x) / 2),
          (edge.xs = xs));
      }
    this.vc = edges;
    for (let row = -1; row <= map.h; row++)
      for (let edge of edges[row]) {
        if (edge.prev && Math.abs(edge.prev.xs - edge.xs) < 0.01) continue;
        let z0 = this.rowZ(row) - halfRow,
          last = edge;
        for (; last.next && Math.abs(last.next.xs - edge.xs) < 0.01;) last = last.next;
        let z1 = this.rowZ(last.r) + halfRow;
        segs.push({ a: [edge.xs, z0], b: [edge.xs, z1], n: [edge.n, 0] });
      }
    for (let row = -2; row <= map.h; row++) {
      let z = this.rowZ(row) + halfRow,
        hx = hxMin;
      for (; hx < hxMax;) {
        let above = this.block(hx, row),
          below = this.block(hx, row + 1);
        if (above === below) {
          hx++;
          continue;
        }
        let start = hx;
        for (; hx < hxMax && this.block(hx, row) === above && this.block(hx, row + 1) === below;) hx++;
        let x0 = start * 0.5,
          x1 = hx * 0.5;
        if (x1 - x0 <= 0.51) continue;
        let side = above ? -1 : 1;
        ((x0 = this.snapEnd(x0, row, -1)),
          (x1 = this.snapEnd(x1, row, 1)),
          segs.push({ a: [x0, z], b: [x1, z], n: [0, side] }));
      }
    }
    return segs;
  }
  /** Ajusta el extremo de un muro horizontal al muro vertical más cercano. */
  snapEnd(x, row, dir) {
    let best = x,
      bestD = 0.4;
    for (let rr of [row, row + 1])
      for (let edge of this.vc[rr] || []) {
        let dist = Math.abs(edge.xs - x);
        dist < bestD && ((bestD = dist), (best = edge.xs + dir * WALL_THICK * 0.5));
      }
    return best;
  }
  pick() {
    let roll = this.rnd() * 100;
    for (let [name, weight] of this.ctx?.ambient === 'crypt' ? CRYPT_WALLS : PLAIN_WALLS)
      if (((roll -= weight), roll < 0)) return hasPiece(name) ? name : 'wall';
    return 'wall';
  }
  /** Parte un segmento en piezas de ~1,1 casillas y las añade a `pieces`. */
  addSegment(from, to, normal) {
    let dx = to[0] - from[0],
      dz = to[1] - from[1],
      len = Math.hypot(dx, dz);
    if (len < 0.05) return;
    let count = Math.max(1, Math.round(len / 1.1)),
      pieceLen = len / count;
    for (let k = 0; k < count; k++) {
      let x = (from[0] + (dx / len) * pieceLen * (k + 0.5) - normal[0] * WALL_THICK * 0.5 - 0.5) * HEX_SIZE,
        z = (from[1] + (dz / len) * pieceLen * (k + 0.5) - normal[1] * WALL_THICK * 0.5 - 0.5) * HEX_SIZE;
      this.pieces.push({
        variant: this.pick(),
        center: new Vector3(x, 0, z),
        normal: new Vector3(normal[0], 0, normal[1]),
        w: pieceLen * 1.02 * HEX_SIZE,
        h: this.fullH * HEX_SIZE,
        deco: [],
      });
    }
  }
  /** Matriz de una pieza de muro con la altura dada. */
  xform(piece, height, out = new Matrix4()) {
    let normal = piece.normal,
      tangent = new Vector3(0, 1, 0).cross(normal),
      basis = new Matrix4().makeBasis(
        tangent.multiplyScalar(piece.w / PIECE_W),
        new Vector3(0, height / PIECE_H, 0),
        normal.clone().multiplyScalar((WALL_THICK * HEX_SIZE) / 1),
      );
    return out.copy(basis).setPosition(piece.center);
  }
  buildMeshes() {
    let byVariant = new Map();
    for (let piece of this.pieces)
      (byVariant.has(piece.variant) || byVariant.set(piece.variant, []),
        (piece.i = byVariant.get(piece.variant).length),
        byVariant.get(piece.variant).push(piece));
    this.meshes = new Map();
    for (let [variant, list] of byVariant) {
      let meshes = [];
      for (let part of pieceParts(variant)) {
        let mesh = new InstancedMesh(
          part.geo,
          worldMaterial(part.mat, { contact: 'local', contactH: 1.2, contactMin: 0.45 }),
          list.length,
        );
        ((mesh.castShadow = !0),
          (mesh.receiveShadow = !0),
          (mesh.frustumCulled = !1),
          this.group.add(mesh),
          meshes.push(mesh));
      }
      this.meshes.set(variant, meshes);
    }
  }
  /** Antorchas (con llama y luz) y estandartes en algunos muros lisos. */
  decorate() {
    let ctx = this.ctx,
      torchCount = 0;
    for (let piece of this.pieces) {
      if (piece.variant !== 'wall' && piece.variant !== 'wall_cracked') continue;
      let center = piece.center,
        normal = piece.normal,
        slot = ((Math.floor((center.x * 7) / HEX_SIZE + (center.z * 13) / HEX_SIZE) % 9) + 9) % 9;
      if (this.torches) {
        if (slot === 0 && torchCount < 14 && hasPiece('torch_wall')) {
          torchCount++;
          let torch = new Group();
          for (let part of pieceParts('torch_wall')) {
            let mesh = new Mesh(part.geo, worldMaterial(part.mat, {}));
            ((mesh.castShadow = !1), torch.add(mesh));
          }
          (torch.scale.setScalar(0.42),
            torch.position
              .copy(center)
              .addScaledVector(normal, WALL_THICK * HEX_SIZE * 0.5)
              .add(new Vector3(0, 1.35, 0)),
            (torch.rotation.y = Math.atan2(normal.x, normal.z)),
            this.group.add(torch),
            piece.deco.push(torch));
          let flamePos = torch.position
              .clone()
              .addScaledVector(normal, 0.22)
              .add(new Vector3(0, 0.36, 0)),
            flame = { pos: flamePos, scale: 0.55, embers: !1 };
          (ctx.fx.flames.push(flame),
            (piece.flame = flame),
            ctx.fx.addLamp({
              pos: flamePos
                .clone()
                .add(new Vector3(0, 0.1, 0))
                .addScaledVector(normal, 0.2),
              color: 16747066,
              range: 7,
              energy: 1.5,
              kind: 'torch',
              haloSize: 1.4,
              haloAlpha: 0.55,
              piece,
            }));
          let glow = center.clone().addScaledVector(normal, 1.2);
          ctx.ground.blob(6, glow.x, glow.z, 3.2, 0.85);
        } else if (slot === 4 && hasPiece('banner_thin')) {
          let banner = new Group();
          for (let part of pieceParts('banner_thin'))
            banner.add(new Mesh(part.geo, worldMaterial(part.mat, {})));
          (banner.scale.setScalar(0.42),
            banner.position
              .copy(center)
              .addScaledVector(normal, WALL_THICK * HEX_SIZE * 0.5 + 0.02)
              .add(new Vector3(0, 0.15, 0)),
            (banner.rotation.y = Math.atan2(normal.x, normal.z)),
            this.group.add(banner),
            piece.deco.push(banner));
        }
      }
    }
  }
  /** Altura de cada muro según mire o no a la cámara; enciende o apaga sus antorchas. */
  updateCutaway(fwd, force = !1) {
    let dir = new Vector3(fwd.x, 0, fwd.z);
    if (dir.lengthSq() < 1e-6 || (dir.normalize(), !force && dir.dot(this.lastFwd) > 0.985)) return;
    this.lastFwd.copy(dir);
    let matrix = new Matrix4();
    for (let piece of this.pieces) {
      let facing = piece.normal.dot(dir.clone().negate()),
        height = (facing > 0.35 ? this.fullH : facing < -0.35 ? this.lowH : this.midH) * HEX_SIZE;
      ((piece.h = height), this.xform(piece, height, matrix));
      for (let mesh of this.meshes.get(piece.variant)) mesh.setMatrixAt(piece.i, matrix);
      for (let deco of piece.deco) deco.visible = height >= this.fullH * HEX_SIZE - 0.01;
      piece.flame && this.ctx.fx.setFlame(piece.flame, height >= this.fullH * HEX_SIZE - 0.01);
    }
    for (let [, meshes] of this.meshes) for (let mesh of meshes) mesh.instanceMatrix.needsUpdate = !0;
    for (let lamp of this.ctx.fx.lampSources)
      lamp.piece && (lamp.on = lamp.piece.h >= this.fullH * HEX_SIZE - 0.01);
  }
};

export { CryptWalls };
