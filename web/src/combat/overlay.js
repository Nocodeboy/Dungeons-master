// combat/overlay.js — Superposición del tablero de combate: casillas resaltadas y ruta de movimiento.
// Cada capa (move, dash, range, path, target, area, hover, threat) son dos InstancedMesh (relleno hexagonal y
// borde) a una altura propia; la ruta es una cinta con un sombreador de trazos animados y un anillo en la
// meta. También convierte rayos y puntos del mundo en casillas. La crea combat/index.js (runBattle) y la
// usa combat/controller.js.

import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Plane,
  RingGeometry,
  ShaderMaterial,
  ShapeGeometry,
  Vector3,
} from 'three';
import { cellToWorld, planeToCell, hexShape, HEX_SIZE, HEX_RADIUS } from '../explore/hex.js';

/** Capas de resaltado: altura sobre el suelo y opacidad del relleno y del borde. */
const LAYERS = {
  move: { y: 0.035, fill: 0.1, line: 0.42 },
  dash: { y: 0.034, fill: 0, line: 0.16 },
  range: { y: 0.036, fill: 0.07, line: 0.26 },
  path: { y: 0.04, fill: 0.2, line: 0.6 },
  target: { y: 0.042, fill: 0.22, line: 1 },
  area: { y: 0.044, fill: 0.34, line: 0.95 },
  hover: { y: 0.046, fill: 0.18, line: 1 },
  threat: { y: 0.043, fill: 0.16, line: 0.8 },
};
/** Sombreadores de la cinta de la ruta (trazos que avanzan y se apagan hacia la meta). */
const PATH_VERTEX_SHADER =
  'attribute float aD; varying float vD; varying vec2 vUv; void main(){ vD = aD; vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const PATH_FRAGMENT_SHADER = `
uniform vec3 uColor; uniform float uTime; uniform float uLen;
varying float vD; varying vec2 vUv;
void main(){
  float across = abs(vUv.y * 2.0 - 1.0);
  float dash = step(0.45, fract(vD * 1.6 - uTime * 1.2));
  float edge = 1.0 - smoothstep(0.55, 1.0, across);
  float head = smoothstep(uLen - 0.6, uLen, vD);
  float a = edge * (0.35 + 0.55 * dash) * (1.0 - head * 0.6);
  gl_FragColor = vec4(uColor * (1.0 + dash * 0.6), a);
}`;
/** Resaltado de casillas y ruta sobre el mapa del combate ({w, h, rows}). */
const Overlay = class {
  constructor(scene, map, { cellToWorld: toWorld = null, pick = null } = {}) {
    ((this.scene = scene),
      (this.w = map.w),
      (this.h = map.h),
      (this.rows = map.rows),
      (this.cellToWorld = toWorld || ((cell) => cellToWorld(cell[0], cell[1]))),
      (this.pickFn = pick));
    let radius = HEX_RADIUS * HEX_SIZE,
      fillGeo = new ShapeGeometry(hexShape(radius * 0.93));
    fillGeo.rotateX(-Math.PI / 2);
    let ringShape = hexShape(radius * 0.95);
    ringShape.holes.push(hexShape(radius * 0.84));
    let lineGeo = new ShapeGeometry(ringShape);
    (lineGeo.rotateX(-Math.PI / 2), (this.layers = {}), (this.meshes = []));
    let capacity = this.w * this.h;
    for (let [name, cfg] of Object.entries(LAYERS)) {
      let makeMesh = (geo, opacity) => {
        let mesh = new InstancedMesh(
          geo,
          new MeshBasicMaterial({ transparent: !0, opacity, depthWrite: !1, toneMapped: !1 }),
          capacity,
        );
        return (
          (mesh.count = 0),
          (mesh.renderOrder = 3),
          (mesh.frustumCulled = !1),
          (mesh.instanceColor = new InstancedBufferAttribute(new Float32Array(capacity * 3), 3)),
          scene.add(mesh),
          this.meshes.push(mesh),
          mesh
        );
      };
      this.layers[name] = { cfg, fill: makeMesh(fillGeo, cfg.fill), line: makeMesh(lineGeo, cfg.line) };
    }
    ((this.geos = [fillGeo, lineGeo]),
      (this.plane = new Plane(new Vector3(0, 1, 0), 0)),
      (this.tmp = new Matrix4()),
      (this.col = new Color()),
      (this.pathU = { uColor: { value: new Vector3(1, 1, 1) }, uTime: { value: 0 }, uLen: { value: 1 } }));
    let pathGeo = new BufferGeometry(),
      maxPoints = 160;
    (pathGeo.setAttribute('position', new BufferAttribute(new Float32Array(maxPoints * 6), 3).setUsage(DynamicDrawUsage)),
      pathGeo.setAttribute('uv', new BufferAttribute(new Float32Array(maxPoints * 4), 2).setUsage(DynamicDrawUsage)),
      pathGeo.setAttribute('aD', new BufferAttribute(new Float32Array(maxPoints * 2), 1).setUsage(DynamicDrawUsage)));
    let indices = [];
    for (let k = 0; k < maxPoints - 1; k++) indices.push(k * 2, k * 2 + 1, k * 2 + 2, k * 2 + 1, k * 2 + 3, k * 2 + 2);
    (pathGeo.setIndex(indices),
      pathGeo.setDrawRange(0, 0),
      (this.pathMesh = new Mesh(
        pathGeo,
        new ShaderMaterial({
          uniforms: this.pathU,
          vertexShader: PATH_VERTEX_SHADER,
          fragmentShader: PATH_FRAGMENT_SHADER,
          transparent: !0,
          depthWrite: !1,
          side: DoubleSide,
        }),
      )),
      (this.pathMesh.frustumCulled = !1),
      (this.pathMesh.renderOrder = 4),
      (this.pathMax = maxPoints),
      scene.add(this.pathMesh),
      (this.goal = new Mesh(
        new RingGeometry(0.32, 0.42, 6),
        new MeshBasicMaterial({
          color: 16777215,
          transparent: !0,
          opacity: 0.9,
          depthWrite: !1,
          toneMapped: !1,
          side: DoubleSide,
        }),
      )),
      (this.goal.rotation.x = -Math.PI / 2),
      (this.goal.rotation.z = Math.PI / 6),
      (this.goal.visible = !1),
      (this.goal.renderOrder = 4),
      scene.add(this.goal));
  }
  /** ¿Está la casilla dentro del mapa? */
  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }
  /** Resalta `cells` en una capa; `color` puede ser una función (casilla, índice) → color. */
  set(layerName, cells, color = 16777215) {
    let layer = this.layers[layerName],
      count = 0;
    for (let idx = 0; idx < cells.length; idx++) {
      let [x, y] = cells[idx];
      if (!this.inBounds(x, y)) continue;
      let pos = this.cellToWorld([x, y]);
      (this.tmp.makeTranslation(pos.x, pos.y + layer.cfg.y, pos.z),
        this.col.setHex(typeof color == 'function' ? color(cells[idx], idx) : color));
      for (let mesh of [layer.fill, layer.line]) (mesh.setMatrixAt(count, this.tmp), mesh.setColorAt(count, this.col));
      count++;
    }
    for (let mesh of [layer.fill, layer.line])
      ((mesh.count = count),
        (mesh.instanceMatrix.needsUpdate = !0),
        mesh.instanceColor && (mesh.instanceColor.needsUpdate = !0));
  }
  /** Vacía las capas dadas (todas si no se da ninguna, incluida la ruta). */
  clear(...names) {
    for (let name of names.length ? names : Object.keys(this.layers))
      ((this.layers[name].fill.count = 0), (this.layers[name].line.count = 0));
    (!names.length || names.includes('path')) && this.clearRoute();
  }
  /** Dibuja la ruta desde `from` por las casillas de `path`. */
  route(from, path, color = 15397631) {
    let points = [from, ...path].map((cell) => this.cellToWorld(cell).add(new Vector3(0, 0.07, 0)));
    if (points.length < 2) {
      this.clearRoute();
      return;
    }
    let curve = new CatmullRomCurve3(points, !1, 'centripetal', 0.3),
      samples = Math.min(this.pathMax, Math.max(8, points.length * 8)),
      spaced = curve.getSpacedPoints(samples - 1),
      positions = this.pathMesh.geometry.attributes.position.array,
      uvs = this.pathMesh.geometry.attributes.uv.array,
      dists = this.pathMesh.geometry.attributes.aD.array,
      length = 0,
      halfWidth = 0.13;
    for (let j = 0; j < spaced.length; j++) {
      j > 0 && (length += spaced[j].distanceTo(spaced[j - 1]));
      let prev = spaced[Math.max(0, j - 1)],
        next = spaced[Math.min(spaced.length - 1, j + 1)],
        dx = next.x - prev.x,
        dz = next.z - prev.z,
        len = Math.hypot(dx, dz) || 1,
        ox = (-dz / len) * halfWidth,
        oz = (dx / len) * halfWidth;
      (positions.set([spaced[j].x + ox, spaced[j].y, spaced[j].z + oz, spaced[j].x - ox, spaced[j].y, spaced[j].z - oz], j * 6),
        uvs.set([0, 0, 0, 1], j * 4),
        (dists[j * 2] = dists[j * 2 + 1] = length));
    }
    let geo = this.pathMesh.geometry;
    ((geo.attributes.position.needsUpdate = !0),
      (geo.attributes.uv.needsUpdate = !0),
      (geo.attributes.aD.needsUpdate = !0),
      geo.setDrawRange(0, (spaced.length - 1) * 6));
    let col = new Color(color);
    (this.pathU.uColor.value.set(col.r, col.g, col.b), (this.pathU.uLen.value = length));
    let end = spaced[spaced.length - 1];
    (this.goal.position.set(end.x, end.y, end.z), this.goal.material.color.copy(col), (this.goal.visible = !0));
  }
  /** Oculta la ruta. */
  clearRoute() {
    (this.pathMesh.geometry.setDrawRange(0, 0), (this.goal.visible = !1));
  }
  /** Anima los trazos de la ruta y el giro del anillo de meta. */
  update(dt) {
    ((this.pathU.uTime.value += dt), this.goal.visible && (this.goal.rotation.z += dt * 1.2));
  }
  /** Punto del suelo bajo el rayo (con el selector del mundo si lo hay, o el plano y = 0). */
  ground(raycaster) {
    if (this.pickFn) {
      let hit = this.pickFn(raycaster);
      if (hit) return hit.point;
    }
    let point = new Vector3();
    return raycaster.ray.intersectPlane(this.plane, point) ? point : null;
  }
  /** Casilla del mapa bajo un punto del mundo, o null. */
  cellAtWorld(point) {
    let cell = planeToCell(point.x / HEX_SIZE, point.z / HEX_SIZE);
    return this.inBounds(cell[0], cell[1]) ? cell : null;
  }
  /** Carácter de terreno de una casilla (' ' fuera del mapa). */
  tile(x, y) {
    return this.inBounds(x, y) ? this.rows[y][x] : ' ';
  }
  /** Libera mallas, geometrías y materiales. */
  dispose() {
    for (let mesh of this.meshes) (this.scene.remove(mesh), mesh.material.dispose(), mesh.dispose?.());
    for (let geo of this.geos) geo.dispose();
    (this.scene.remove(this.pathMesh, this.goal),
      this.pathMesh.geometry.dispose(),
      this.pathMesh.material.dispose(),
      this.goal.geometry.dispose(),
      this.goal.material.dispose());
  }
};

export { Overlay };
