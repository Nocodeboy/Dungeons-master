// explore/fallback-world.js — Mundo de depuración: si el área world/ no carga, construye el nivel con
// primitivas (hexágonos de suelo coloreados por carácter, cajas para muros y casas, conos para árboles,
// objetos simples), luces del nivel y la rejilla de combate, con la misma interfaz que world/buildLevel.
// Lo usa explore/index.js.
// Reconstruido de publicado/juego.js (módulo __esm «gk»).

import {
  BoxGeometry,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DodecahedronGeometry,
  Float32BufferAttribute,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  Plane,
  PointLight,
  Quaternion,
  SphereGeometry,
  Vector3,
} from 'three';
import { cellToPlane, planeToCell, hexShape, HEX_SIZE, ROW_STEP, HEX_RADIUS } from './hex.js';

/** Generador con semilla (mulberry32), para que el mundo de depuración sea siempre igual. */
function seededRng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 1831565813) | 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    return ((x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x), ((x ^ (x >>> 14)) >>> 0) / 4294967296);
  };
}
/**
 * Construye el mundo de depuración del nivel en `scene`. Devuelve el objeto mundo: root, sun, hemi,
 * width, height, bounds, objects y los métodos cellToWorld, worldToCell, pick, setObjectState,
 * setObjectGlow, setGrid, setCombatView, update y dispose.
 */
async function buildFallbackWorld(scene, level, { quality } = {}) {
  let rows = level.rows || [],
    h = rows.length,
    w = Math.max(0, ...rows.map((row) => row.length)),
    amb = AMBIENTS[level.ambient] || AMBIENTS.dusk,
    rng = seededRng(1234),
    root = new Group();
  ((root.name = 'mundo_depuracion'),
    scene.add(root),
    (scene.background = new Color(amb.sky)),
    (scene.fog = new Fog(amb.fog, 40, 120)));
  let hemi = new HemisphereLight(amb.hemiS, amb.hemiG, amb.hemiI);
  scene.add(hemi);
  let sun = new DirectionalLight(amb.sun, amb.sunI),
    center = new Vector3((w * HEX_SIZE) / 2, 0, (h * ROW_STEP * HEX_SIZE) / 2),
    sunDir = new Vector3(...amb.dir).normalize();
  (sun.position.copy(center).addScaledVector(sunDir, 60),
    sun.target.position.copy(center),
    scene.add(sun, sun.target),
    (sun.castShadow = (quality?.level ?? 1) > 0));
  let shadowSize = (quality?.shadowMap || 512) * 2;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  let extent = Math.max(w, h) * HEX_SIZE * 0.62;
  (Object.assign(sun.shadow.camera, {
    left: -extent,
    right: extent,
    top: extent,
    bottom: -extent,
    near: 1,
    far: 160,
  }),
    (sun.shadow.bias = -8e-4),
    (sun.shadow.normalBias = 0.03));
  let nLights = 0,
    maxLights = (quality?.level ?? 1) === 0 ? 2 : (quality?.level ?? 1) === 1 ? 5 : 9,
    lights = [];
  for (let def of level.lights || []) {
    if (!def.energy || nLights >= maxLights) continue;
    let light = new PointLight(
        new Color(def.color || '#ffb060'),
        def.energy * 6,
        (def.range || 3) * HEX_SIZE * 1.6,
        1.6,
      ),
      p = cellToPlane(def.cell[0], def.cell[1]);
    (light.position.set(p.x * HEX_SIZE, (def.height || 1) * HEX_SIZE, p.y * HEX_SIZE),
      (light.userData.base = light.intensity),
      (light.userData.phase = rng() * 10),
      scene.add(light),
      lights.push(light),
      nLights++);
  }
  let tileGeo = new CylinderGeometry(HEX_RADIUS * HEX_SIZE * 0.995, HEX_RADIUS * HEX_SIZE * 1.02, 0.3, 6, 1);
  tileGeo.translate(0, -0.15, 0);
  let tileMat = new MeshStandardMaterial({ roughness: 0.95, metalness: 0 }),
    count = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) (rows[y][x] ?? ' ') !== ' ' && count++;
  let tiles = new InstancedMesh(tileGeo, tileMat, Math.max(1, count));
  tiles.receiveShadow = !0;
  let mat4 = new Matrix4(),
    tmpColor = new Color(),
    heights = new Map(),
    idx = 0,
    paint = new Map();
  for (let area of level.paint || [])
    for (let c of area.cells || []) paint.set(`${c[0]},${c[1]}`, area.ground);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let ch = rows[y][x] ?? ' ';
      if (ch === ' ') continue;
      let p = cellToPlane(x, y),
        hgt = ch === 'w' ? -0.22 : (rng() - 0.5) * 0.03;
      (heights.set(`${x},${y}`, hgt),
        mat4.makeTranslation(p.x * HEX_SIZE, hgt, p.y * HEX_SIZE),
        tiles.setMatrixAt(idx, mat4));
      let ground = paint.get(`${x},${y}`);
      (tmpColor.setHex(ground === 'dirt' ? 8019520 : (TILE_COLORS[ch] ?? TILE_COLORS['.'])),
        tmpColor.offsetHSL(0, 0, (rng() - 0.5) * 0.06),
        tiles.setColorAt(idx, tmpColor),
        idx++);
    }
  ((tiles.instanceMatrix.needsUpdate = !0), root.add(tiles));
  let props = { box: [], tree: [], rock: [], pillar: [], fence: [] };
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let ch = rows[y][x],
        p = cellToPlane(x, y),
        pos = new Vector3(p.x * HEX_SIZE, 0, p.y * HEX_SIZE);
      ch === 'B' || ch === 'H'
        ? props.box.push({ p: pos, h: 2.6 + rng() * 0.8, w: 1.3, color: 9071178, tall: !0 })
        : ch === '#'
          ? props.box.push({
              p: pos,
              h: (level.wall_height || 1.3) * HEX_SIZE,
              w: 1.32,
              color: 6117458,
              tall: !0,
            })
          : ch === 'S'
            ? props.box.push({ p: pos, h: 2.2, w: 0.9, color: 10131088, tall: !0 })
            : ch === 'O'
              ? props.box.push({ p: pos, h: 1.7, w: 0.9, color: 6967864, tall: !0 })
              : ch === 'o'
                ? props.box.push({ p: pos, h: 0.7, w: 0.8, color: 9071170 })
                : ch === 'c'
                  ? props.box.push({ p: pos, h: 0.9, w: 0.9, color: 10123850 })
                  : ch === 'g'
                    ? props.box.push({ p: pos, h: 0.8, w: 0.5, color: 9078400 })
                    : ch === 'T'
                      ? props.tree.push({ p: pos, s: 0.85 + rng() * 0.5, r: rng() * 6 })
                      : ch === 'r'
                        ? props.rock.push({ p: pos, s: 0.45 + rng() * 0.3, r: rng() * 6 })
                        : ch === 'P'
                          ? props.pillar.push({ p: pos })
                          : ch === 'f' && props.fence.push({ p: pos, r: rng() });
    }
  /**
   * Crea una malla instanciada con una instancia por elemento de `list` (`place` escribe su matriz)
   * y guarda las matrices originales en userData.base (para la vista de combate).
   */
  let instanced = (geo, mat, list, place, cast = !0) => {
      if (!list.length) return null;
      let mesh = new InstancedMesh(geo, mat, list.length);
      return (
        list.forEach((it, i) => {
          (place(it, mat4),
            mesh.setMatrixAt(i, mat4),
            it.color !== void 0 &&
              mesh.setColorAt(i, tmpColor.setHex(it.color).offsetHSL(0, 0, (rng() - 0.5) * 0.08)));
        }),
        (mesh.castShadow = cast),
        (mesh.receiveShadow = !0),
        (mesh.userData.base = list.map((it, i) => {
          let m = new Matrix4();
          return (mesh.getMatrixAt(i, m), m);
        })),
        root.add(mesh),
        mesh
      );
    },
    quat = new Quaternion(),
    scale = new Vector3(),
    pos = new Vector3(),
    boxGeo = new BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
    boxes = instanced(boxGeo, new MeshStandardMaterial({ roughness: 0.85 }), props.box, (it, out) => {
      (quat.setFromAxisAngle(new Vector3(0, 1, 0), 0),
        out.compose(pos.copy(it.p), quat, scale.set(it.w, it.h, it.w)));
    }),
    trunkGeo = new CylinderGeometry(0.12, 0.18, 1.4, 6).translate(0, 0.7, 0),
    crownGeo = new ConeGeometry(0.95, 2.6, 7).translate(0, 2.6, 0),
    trunks = instanced(
      trunkGeo,
      new MeshStandardMaterial({ color: 5914152, roughness: 0.9 }),
      props.tree,
      (it, out) => {
        (quat.setFromAxisAngle(new Vector3(0, 1, 0), it.r),
          out.compose(pos.copy(it.p), quat, scale.setScalar(it.s)));
      },
    ),
    crowns = instanced(
      crownGeo,
      new MeshStandardMaterial({
        color: level.ambient === 'forest' ? 3099180 : 4020786,
        roughness: 0.9,
        flatShading: !0,
      }),
      props.tree,
      (it, out) => {
        (quat.setFromAxisAngle(new Vector3(0, 1, 0), it.r),
          out.compose(pos.copy(it.p), quat, scale.setScalar(it.s)));
      },
    );
  instanced(
    new DodecahedronGeometry(1, 0).translate(0, 0.4, 0),
    new MeshStandardMaterial({ color: 7828332, roughness: 0.95, flatShading: !0 }),
    props.rock,
    (it, out) => {
      (quat.setFromAxisAngle(new Vector3(0.3, 1, 0.1).normalize(), it.r),
        out.compose(pos.copy(it.p), quat, scale.set(it.s * 1.2, it.s, it.s)));
    },
  );
  let pillars = instanced(
    new CylinderGeometry(0.32, 0.38, 3, 10).translate(0, 1.5, 0),
    new MeshStandardMaterial({ color: 9407106, roughness: 0.8 }),
    props.pillar,
    (it, out) => {
      out.compose(pos.copy(it.p), quat.identity(), scale.setScalar(1));
    },
  );
  instanced(
    new BoxGeometry(1.3, 0.75, 0.08).translate(0, 0.38, 0),
    new MeshStandardMaterial({ color: 8018488, roughness: 0.9 }),
    props.fence,
    (it, out) => {
      (quat.setFromAxisAngle(new Vector3(0, 1, 0), it.r * Math.PI),
        out.compose(pos.copy(it.p), quat, scale.setScalar(1)));
    },
  );
  let tallMeshes = [boxes, trunks, crowns, pillars].filter(Boolean),
    objectRoots = new Map(),
    objectMeshes = new Map(),
    stdMat = (color, extra = {}) => new MeshStandardMaterial({ color, roughness: 0.8, ...extra });
  for (let obj of level.objects || []) {
    if (obj.type === 'npc' || !obj.cell) continue;
    let g = new Group();
    g.name = `obj_${obj.id}`;
    let p = cellToPlane(obj.cell[0], obj.cell[1]);
    g.position.set(p.x * HEX_SIZE, 0, p.y * HEX_SIZE);
    let mesh = null;
    switch (obj.type) {
      case 'chest':
        ((mesh = new Group()),
          mesh.add(new Mesh(new BoxGeometry(0.7, 0.4, 0.45).translate(0, 0.2, 0), stdMat(6964262))));
        {
          let lid = new Mesh(new BoxGeometry(0.72, 0.14, 0.47).translate(0, 0.07, 0.235), stdMat(8015920));
          (lid.position.set(0, 0.4, -0.235), (lid.name = 'tapa'), mesh.add(lid));
        }
        break;
      case 'cache':
        mesh = new Mesh(new CylinderGeometry(0.25, 0.3, 0.2, 7).translate(0, 0.1, 0), stdMat(6969928));
        break;
      case 'loot':
        mesh = new Mesh(
          new SphereGeometry(0.28, 8, 6).scale(1, 0.7, 1).translate(0, 0.18, 0),
          stdMat(9072704),
        );
        break;
      case 'sign':
      case 'board':
        ((mesh = new Group()),
          mesh.add(new Mesh(new BoxGeometry(0.1, 1.4, 0.1).translate(0, 0.7, 0), stdMat(5914152))),
          mesh.add(
            new Mesh(
              new BoxGeometry(obj.type === 'board' ? 1.1 : 0.8, 0.5, 0.06).translate(0, 1.25, 0.06),
              stdMat(10123850),
            ),
          ));
        break;
      case 'trap':
        mesh = new Mesh(new CylinderGeometry(0.45, 0.45, 0.05, 6), stdMat(8006176, { emissive: 4198408 }));
        break;
      case 'stairs':
        mesh = new Mesh(new CylinderGeometry(0.7, 0.7, 0.06, 6), stdMat(1709072));
        break;
      case 'campfire':
        ((mesh = new Group()),
          mesh.add(
            new Mesh(
              new ConeGeometry(0.3, 0.6, 6).translate(0, 0.3, 0),
              stdMat(16747056, { emissive: 16734736, emissiveIntensity: 1.5 }),
            ),
          ));
        break;
      case 'rune':
      case 'seal':
        mesh = new Mesh(
          new BoxGeometry(0.8, 0.9, 0.3).translate(0, 0.45, 0),
          stdMat(9078400, { emissive: 3153944 }),
        );
        break;
      case 'inspect':
        mesh = new Mesh(
          new OctahedronGeometry(0.18).translate(0, 1.1, 0),
          stdMat(14205040, { emissive: 8413216, emissiveIntensity: 0.6 }),
        );
        break;
      case 'door':
        obj.target || (mesh = new Mesh(new BoxGeometry(1.1, 2, 0.2).translate(0, 1, 0), stdMat(5913122)));
        break;
      default:
        break;
    }
    (mesh &&
      (mesh.traverse((c) => {
        c.isMesh && ((c.castShadow = !0), (c.receiveShadow = !0));
      }),
      g.add(mesh),
      objectMeshes.set(obj.id, mesh)),
      root.add(g),
      objectRoots.set(obj.id, g));
  }
  let gridGeo = (() => {
      let verts = [],
        corners = hexShape(HEX_RADIUS * HEX_SIZE * 0.97).getPoints();
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          let ch = rows[y][x];
          if (!'.,:=~bxf'.includes(ch)) continue;
          let p = cellToPlane(x, y),
            lift = 0.035;
          for (let i = 0; i < 6; i++) {
            let a = corners[i],
              b = corners[(i + 1) % 6];
            verts.push(
              p.x * HEX_SIZE + a.x,
              lift,
              p.y * HEX_SIZE - a.y,
              p.x * HEX_SIZE + b.x,
              lift,
              p.y * HEX_SIZE - b.y,
            );
          }
        }
      let geo = new BufferGeometry();
      return (geo.setAttribute('position', new Float32BufferAttribute(verts, 3)), geo);
    })(),
    gridMat = new LineBasicMaterial({ color: 16773320, transparent: !0, opacity: 0, depthWrite: !1 }),
    grid = new LineSegments(gridGeo, gridMat);
  ((grid.visible = !1), (grid.renderOrder = 1), root.add(grid));
  let groundPlane = new Plane(new Vector3(0, 1, 0), 0),
    hit = new Vector3(),
    glowSaved = new Map();
  return {
    debug: !0,
    root,
    sun,
    hemi,
    width: w,
    height: h,
    bounds: {
      min: new Vector3(-1.5, 0, -1.5),
      max: new Vector3(w * HEX_SIZE + 1.5, 0, h * ROW_STEP * HEX_SIZE + 1.5),
    },
    objects: objectRoots,
    /** Centro de la casilla en coordenadas de mundo. */
    cellToWorld([col, row], out = new Vector3()) {
      let p = cellToPlane(col, row);
      return out.set(p.x * HEX_SIZE, 0, p.y * HEX_SIZE);
    },
    /** Casilla bajo una posición de mundo. */
    worldToCell(pos) {
      return planeToCell(pos.x / HEX_SIZE, pos.z / HEX_SIZE);
    },
    groundHeight() {
      return 0;
    },
    /** Punto y casilla del suelo (plano y = 0) bajo el rayo, o null. */
    pick(raycaster) {
      return raycaster.ray.intersectPlane(groundPlane, hit)
        ? { point: hit.clone(), cell: planeToCell(hit.x / HEX_SIZE, hit.z / HEX_SIZE) }
        : null;
    },
    /** Refleja el estado de un objeto: hidden, revealed/shown, open, empty, disarmed. */
    setObjectState(id, state) {
      let g = objectRoots.get(id),
        mesh = objectMeshes.get(id);
      if (
        g &&
        (state === 'hidden'
          ? (g.visible = !1)
          : (state === 'revealed' || state === 'shown') && (g.visible = !0),
        mesh)
      ) {
        let lid = mesh.getObjectByName?.('tapa');
        (lid && (lid.rotation.x = state === 'open' || state === 'empty' ? -1.9 : 0),
          state === 'open' &&
            !lid &&
            mesh.isMesh &&
            objectRoots.get(id)?.name.includes('door') &&
            (mesh.visible = !1),
          state === 'empty' && !lid && mesh.scale.setScalar(0.6),
          state === 'disarmed' && (mesh.visible = !1));
      }
    },
    /** Resalta un objeto con brillo emisivo (`color` null lo quita). */
    setObjectGlow(id, color) {
      let mesh = objectMeshes.get(id);
      mesh &&
        mesh.traverse((m) => {
          if (m.isMesh)
            if (
              (glowSaved.has(m) ||
                glowSaved.set(m, {
                  e: m.material.emissive?.clone(),
                  i: m.material.emissiveIntensity,
                  mat: m.material,
                }),
              color == null)
            ) {
              let saved = glowSaved.get(m);
              m.material = saved.mat;
            } else {
              let mat = glowSaved.get(m).mat.clone();
              ((mat.emissive = new Color(color)), (mat.emissiveIntensity = 0.7), (m.material = mat));
            }
        });
    },
    /** Opacidad de la rejilla de combate (0 la oculta). */
    setGrid(alpha) {
      ((gridMat.opacity = alpha * 0.55), (grid.visible = alpha > 0.01));
    },
    /** Vista de combate: aplasta árboles y muros para que no tapen el tablero. */
    setCombatView(on) {
      for (let mesh of tallMeshes) {
        let base = mesh.userData.base;
        for (let i = 0; i < base.length; i++)
          (mat4.copy(base[i]),
            on &&
              (mat4.decompose(pos, quat, scale),
              (scale.y *= mesh === crowns ? 0.001 : 0.4),
              mat4.compose(pos, quat, scale)),
            mesh.setMatrixAt(i, mat4));
        mesh.instanceMatrix.needsUpdate = !0;
      }
    },
    fadeOccluders() {},
    update(dt, t) {
      for (let light of lights)
        light.intensity =
          light.userData.base *
          (0.85 + 0.15 * Math.sin(t * 9 + light.userData.phase) * Math.sin(t * 3.1 + light.userData.phase));
    },
    dispose() {
      (root.traverse((obj) => {
        obj.geometry?.dispose?.();
      }),
        scene.remove(root, hemi, sun, sun.target, ...lights));
    },
  };
}
/** Color del suelo por carácter del mapa. */
const TILE_COLORS = {
  '.': 10918524,
  ',': 7309898,
  ':': 10126434,
  '=': 9407622,
  '~': 6179379,
  b: 5204788,
  x: 8024680,
  f: 7309898,
  w: 4024970,
  T: 5006902,
  B: 8221282,
  H: 8221282,
  '#': 5985872,
  P: 9407622,
  S: 9407622,
  r: 7309898,
  c: 10126434,
  g: 7309898,
  o: 10126434,
  O: 10126434,
};
/** Cielo, niebla y luces por ambiente del nivel (dusk, day, forest, crypt, night). */
const AMBIENTS = {
  dusk: {
    sky: 7166574,
    fog: 9072232,
    sun: 16757370,
    sunI: 2.2,
    hemiS: 10128048,
    hemiG: 4864554,
    hemiI: 1,
    dir: [-0.8, 0.45, 0.4],
  },
  day: {
    sky: 10272992,
    fog: 12111072,
    sun: 16773852,
    sunI: 2.8,
    hemiS: 13623551,
    hemiG: 6969920,
    hemiI: 1.2,
    dir: [-0.5, 0.8, 0.3],
  },
  forest: {
    sky: 6257258,
    fog: 5926488,
    sun: 16769200,
    sunI: 1.9,
    hemiS: 10139802,
    hemiG: 2765856,
    hemiI: 1,
    dir: [-0.4, 0.75, 0.5],
  },
  crypt: {
    sky: 724242,
    fog: 921622,
    sun: 8425664,
    sunI: 0.5,
    hemiS: 3818592,
    hemiG: 1314828,
    hemiI: 0.55,
    dir: [0.2, 1, 0.3],
  },
  night: {
    sky: 1054760,
    fog: 1317932,
    sun: 10137824,
    sunI: 0.8,
    hemiS: 4872832,
    hemiG: 1446416,
    hemiI: 0.6,
    dir: [0.3, 0.8, -0.4],
  },
};

export { buildFallbackWorld };
