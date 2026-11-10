// explore/fallback-world.js
// Reconstruido de publicado/juego.js (módulo __esm «gk»). Nombres locales aún minificados.

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
import { uo, ds, Us, nt, _m, fn } from './hex.js';

function V9(o) {
  let e = o | 0;
  return () => {
    e = (e + 1831565813) | 0;
    let t = Math.imul(e ^ (e >>> 15), 1 | e);
    return ((t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t), ((t ^ (t >>> 14)) >>> 0) / 4294967296);
  };
}
async function mk(o, e, { quality: t } = {}) {
  let a = e.rows || [],
    n = a.length,
    s = Math.max(0, ...a.map((N) => N.length)),
    i = fk[e.ambient] || fk.dusk,
    r = V9(1234),
    l = new Group();
  ((l.name = 'mundo_depuracion'),
    o.add(l),
    (o.background = new Color(i.sky)),
    (o.fog = new Fog(i.fog, 40, 120)));
  let c = new HemisphereLight(i.hemiS, i.hemiG, i.hemiI);
  o.add(c);
  let d = new DirectionalLight(i.sun, i.sunI),
    u = new Vector3((s * nt) / 2, 0, (n * _m * nt) / 2),
    h = new Vector3(...i.dir).normalize();
  (d.position.copy(u).addScaledVector(h, 60),
    d.target.position.copy(u),
    o.add(d, d.target),
    (d.castShadow = (t?.level ?? 1) > 0));
  let p = (t?.shadowMap || 512) * 2;
  d.shadow.mapSize.set(p, p);
  let m = Math.max(s, n) * nt * 0.62;
  (Object.assign(d.shadow.camera, { left: -m, right: m, top: m, bottom: -m, near: 1, far: 160 }),
    (d.shadow.bias = -8e-4),
    (d.shadow.normalBias = 0.03));
  let _ = 0,
    b = (t?.level ?? 1) === 0 ? 2 : (t?.level ?? 1) === 1 ? 5 : 9,
    f = [];
  for (let N of e.lights || []) {
    if (!N.energy || _ >= b) continue;
    let L = new PointLight(new Color(N.color || '#ffb060'), N.energy * 6, (N.range || 3) * nt * 1.6, 1.6),
      O = uo(N.cell[0], N.cell[1]);
    (L.position.set(O.x * nt, (N.height || 1) * nt, O.y * nt),
      (L.userData.base = L.intensity),
      (L.userData.phase = r() * 10),
      o.add(L),
      f.push(L),
      _++);
  }
  let v = new CylinderGeometry(fn * nt * 0.995, fn * nt * 1.02, 0.3, 6, 1);
  v.translate(0, -0.15, 0);
  let x = new MeshStandardMaterial({ roughness: 0.95, metalness: 0 }),
    g = 0;
  for (let N = 0; N < n; N++) for (let L = 0; L < s; L++) (a[N][L] ?? ' ') !== ' ' && g++;
  let y = new InstancedMesh(v, x, Math.max(1, g));
  y.receiveShadow = !0;
  let w = new Matrix4(),
    k = new Color(),
    T = new Map(),
    E = 0,
    S = new Map();
  for (let N of e.paint || []) for (let L of N.cells || []) S.set(`${L[0]},${L[1]}`, N.ground);
  for (let N = 0; N < n; N++)
    for (let L = 0; L < s; L++) {
      let O = a[N][L] ?? ' ';
      if (O === ' ') continue;
      let B = uo(L, N),
        $ = O === 'w' ? -0.22 : (r() - 0.5) * 0.03;
      (T.set(`${L},${N}`, $), w.makeTranslation(B.x * nt, $, B.y * nt), y.setMatrixAt(E, w));
      let ee = S.get(`${L},${N}`);
      (k.setHex(ee === 'dirt' ? 8019520 : (pk[O] ?? pk['.'])),
        k.offsetHSL(0, 0, (r() - 0.5) * 0.06),
        y.setColorAt(E, k),
        E++);
    }
  ((y.instanceMatrix.needsUpdate = !0), l.add(y));
  let z = { box: [], tree: [], rock: [], pillar: [], fence: [] };
  for (let N = 0; N < n; N++)
    for (let L = 0; L < s; L++) {
      let O = a[N][L],
        B = uo(L, N),
        $ = new Vector3(B.x * nt, 0, B.y * nt);
      O === 'B' || O === 'H'
        ? z.box.push({ p: $, h: 2.6 + r() * 0.8, w: 1.3, color: 9071178, tall: !0 })
        : O === '#'
          ? z.box.push({ p: $, h: (e.wall_height || 1.3) * nt, w: 1.32, color: 6117458, tall: !0 })
          : O === 'S'
            ? z.box.push({ p: $, h: 2.2, w: 0.9, color: 10131088, tall: !0 })
            : O === 'O'
              ? z.box.push({ p: $, h: 1.7, w: 0.9, color: 6967864, tall: !0 })
              : O === 'o'
                ? z.box.push({ p: $, h: 0.7, w: 0.8, color: 9071170 })
                : O === 'c'
                  ? z.box.push({ p: $, h: 0.9, w: 0.9, color: 10123850 })
                  : O === 'g'
                    ? z.box.push({ p: $, h: 0.8, w: 0.5, color: 9078400 })
                    : O === 'T'
                      ? z.tree.push({ p: $, s: 0.85 + r() * 0.5, r: r() * 6 })
                      : O === 'r'
                        ? z.rock.push({ p: $, s: 0.45 + r() * 0.3, r: r() * 6 })
                        : O === 'P'
                          ? z.pillar.push({ p: $ })
                          : O === 'f' && z.fence.push({ p: $, r: r() });
    }
  let D = (N, L, O, B, $ = !0) => {
      if (!O.length) return null;
      let ee = new InstancedMesh(N, L, O.length);
      return (
        O.forEach((be, Ce) => {
          (B(be, w),
            ee.setMatrixAt(Ce, w),
            be.color !== void 0 && ee.setColorAt(Ce, k.setHex(be.color).offsetHSL(0, 0, (r() - 0.5) * 0.08)));
        }),
        (ee.castShadow = $),
        (ee.receiveShadow = !0),
        (ee.userData.base = O.map((be, Ce) => {
          let ze = new Matrix4();
          return (ee.getMatrixAt(Ce, ze), ze);
        })),
        l.add(ee),
        ee
      );
    },
    M = new Quaternion(),
    R = new Vector3(),
    A = new Vector3(),
    P = new BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
    I = D(P, new MeshStandardMaterial({ roughness: 0.85 }), z.box, (N, L) => {
      (M.setFromAxisAngle(new Vector3(0, 1, 0), 0), L.compose(A.copy(N.p), M, R.set(N.w, N.h, N.w)));
    }),
    U = new CylinderGeometry(0.12, 0.18, 1.4, 6).translate(0, 0.7, 0),
    j = new ConeGeometry(0.95, 2.6, 7).translate(0, 2.6, 0),
    X = D(U, new MeshStandardMaterial({ color: 5914152, roughness: 0.9 }), z.tree, (N, L) => {
      (M.setFromAxisAngle(new Vector3(0, 1, 0), N.r), L.compose(A.copy(N.p), M, R.setScalar(N.s)));
    }),
    J = D(
      j,
      new MeshStandardMaterial({
        color: e.ambient === 'forest' ? 3099180 : 4020786,
        roughness: 0.9,
        flatShading: !0,
      }),
      z.tree,
      (N, L) => {
        (M.setFromAxisAngle(new Vector3(0, 1, 0), N.r), L.compose(A.copy(N.p), M, R.setScalar(N.s)));
      },
    );
  D(
    new DodecahedronGeometry(1, 0).translate(0, 0.4, 0),
    new MeshStandardMaterial({ color: 7828332, roughness: 0.95, flatShading: !0 }),
    z.rock,
    (N, L) => {
      (M.setFromAxisAngle(new Vector3(0.3, 1, 0.1).normalize(), N.r),
        L.compose(A.copy(N.p), M, R.set(N.s * 1.2, N.s, N.s)));
    },
  );
  let Z = D(
    new CylinderGeometry(0.32, 0.38, 3, 10).translate(0, 1.5, 0),
    new MeshStandardMaterial({ color: 9407106, roughness: 0.8 }),
    z.pillar,
    (N, L) => {
      L.compose(A.copy(N.p), M.identity(), R.setScalar(1));
    },
  );
  D(
    new BoxGeometry(1.3, 0.75, 0.08).translate(0, 0.38, 0),
    new MeshStandardMaterial({ color: 8018488, roughness: 0.9 }),
    z.fence,
    (N, L) => {
      (M.setFromAxisAngle(new Vector3(0, 1, 0), N.r * Math.PI), L.compose(A.copy(N.p), M, R.setScalar(1)));
    },
  );
  let K = [I, X, J, Z].filter(Boolean),
    ve = new Map(),
    ge = new Map(),
    ue = (N, L = {}) => new MeshStandardMaterial({ color: N, roughness: 0.8, ...L });
  for (let N of e.objects || []) {
    if (N.type === 'npc' || !N.cell) continue;
    let L = new Group();
    L.name = `obj_${N.id}`;
    let O = uo(N.cell[0], N.cell[1]);
    L.position.set(O.x * nt, 0, O.y * nt);
    let B = null;
    switch (N.type) {
      case 'chest':
        ((B = new Group()),
          B.add(new Mesh(new BoxGeometry(0.7, 0.4, 0.45).translate(0, 0.2, 0), ue(6964262))));
        {
          let $ = new Mesh(new BoxGeometry(0.72, 0.14, 0.47).translate(0, 0.07, 0.235), ue(8015920));
          ($.position.set(0, 0.4, -0.235), ($.name = 'tapa'), B.add($));
        }
        break;
      case 'cache':
        B = new Mesh(new CylinderGeometry(0.25, 0.3, 0.2, 7).translate(0, 0.1, 0), ue(6969928));
        break;
      case 'loot':
        B = new Mesh(new SphereGeometry(0.28, 8, 6).scale(1, 0.7, 1).translate(0, 0.18, 0), ue(9072704));
        break;
      case 'sign':
      case 'board':
        ((B = new Group()),
          B.add(new Mesh(new BoxGeometry(0.1, 1.4, 0.1).translate(0, 0.7, 0), ue(5914152))),
          B.add(
            new Mesh(
              new BoxGeometry(N.type === 'board' ? 1.1 : 0.8, 0.5, 0.06).translate(0, 1.25, 0.06),
              ue(10123850),
            ),
          ));
        break;
      case 'trap':
        B = new Mesh(new CylinderGeometry(0.45, 0.45, 0.05, 6), ue(8006176, { emissive: 4198408 }));
        break;
      case 'stairs':
        B = new Mesh(new CylinderGeometry(0.7, 0.7, 0.06, 6), ue(1709072));
        break;
      case 'campfire':
        ((B = new Group()),
          B.add(
            new Mesh(
              new ConeGeometry(0.3, 0.6, 6).translate(0, 0.3, 0),
              ue(16747056, { emissive: 16734736, emissiveIntensity: 1.5 }),
            ),
          ));
        break;
      case 'rune':
      case 'seal':
        B = new Mesh(
          new BoxGeometry(0.8, 0.9, 0.3).translate(0, 0.45, 0),
          ue(9078400, { emissive: 3153944 }),
        );
        break;
      case 'inspect':
        B = new Mesh(
          new OctahedronGeometry(0.18).translate(0, 1.1, 0),
          ue(14205040, { emissive: 8413216, emissiveIntensity: 0.6 }),
        );
        break;
      case 'door':
        N.target || (B = new Mesh(new BoxGeometry(1.1, 2, 0.2).translate(0, 1, 0), ue(5913122)));
        break;
      default:
        break;
    }
    (B &&
      (B.traverse(($) => {
        $.isMesh && (($.castShadow = !0), ($.receiveShadow = !0));
      }),
      L.add(B),
      ge.set(N.id, B)),
      l.add(L),
      ve.set(N.id, L));
  }
  let Q = (() => {
      let N = [],
        L = Us(fn * nt * 0.97).getPoints();
      for (let B = 0; B < n; B++)
        for (let $ = 0; $ < s; $++) {
          let ee = a[B][$];
          if (!'.,:=~bxf'.includes(ee)) continue;
          let be = uo($, B),
            Ce = 0.035;
          for (let ze = 0; ze < 6; ze++) {
            let W = L[ze],
              De = L[(ze + 1) % 6];
            N.push(be.x * nt + W.x, Ce, be.y * nt - W.y, be.x * nt + De.x, Ce, be.y * nt - De.y);
          }
        }
      let O = new BufferGeometry();
      return (O.setAttribute('position', new Float32BufferAttribute(N, 3)), O);
    })(),
    oe = new LineBasicMaterial({ color: 16773320, transparent: !0, opacity: 0, depthWrite: !1 }),
    ie = new LineSegments(Q, oe);
  ((ie.visible = !1), (ie.renderOrder = 1), l.add(ie));
  let we = new Plane(new Vector3(0, 1, 0), 0),
    ce = new Vector3(),
    ke = new Map();
  return {
    debug: !0,
    root: l,
    sun: d,
    hemi: c,
    width: s,
    height: n,
    bounds: { min: new Vector3(-1.5, 0, -1.5), max: new Vector3(s * nt + 1.5, 0, n * _m * nt + 1.5) },
    objects: ve,
    cellToWorld([N, L], O = new Vector3()) {
      let B = uo(N, L);
      return O.set(B.x * nt, 0, B.y * nt);
    },
    worldToCell(N) {
      return ds(N.x / nt, N.z / nt);
    },
    groundHeight() {
      return 0;
    },
    pick(N) {
      return N.ray.intersectPlane(we, ce) ? { point: ce.clone(), cell: ds(ce.x / nt, ce.z / nt) } : null;
    },
    setObjectState(N, L) {
      let O = ve.get(N),
        B = ge.get(N);
      if (
        O &&
        (L === 'hidden' ? (O.visible = !1) : (L === 'revealed' || L === 'shown') && (O.visible = !0), B)
      ) {
        let $ = B.getObjectByName?.('tapa');
        ($ && ($.rotation.x = L === 'open' || L === 'empty' ? -1.9 : 0),
          L === 'open' && !$ && B.isMesh && ve.get(N)?.name.includes('door') && (B.visible = !1),
          L === 'empty' && !$ && B.scale.setScalar(0.6),
          L === 'disarmed' && (B.visible = !1));
      }
    },
    setObjectGlow(N, L) {
      let O = ge.get(N);
      O &&
        O.traverse((B) => {
          if (B.isMesh)
            if (
              (ke.has(B) ||
                ke.set(B, {
                  e: B.material.emissive?.clone(),
                  i: B.material.emissiveIntensity,
                  mat: B.material,
                }),
              L == null)
            ) {
              let $ = ke.get(B);
              B.material = $.mat;
            } else {
              let $ = ke.get(B).mat.clone();
              (($.emissive = new Color(L)), ($.emissiveIntensity = 0.7), (B.material = $));
            }
        });
    },
    setGrid(N) {
      ((oe.opacity = N * 0.55), (ie.visible = N > 0.01));
    },
    setCombatView(N) {
      for (let L of K) {
        let O = L.userData.base;
        for (let B = 0; B < O.length; B++)
          (w.copy(O[B]),
            N && (w.decompose(A, M, R), (R.y *= L === J ? 0.001 : 0.4), w.compose(A, M, R)),
            L.setMatrixAt(B, w));
        L.instanceMatrix.needsUpdate = !0;
      }
    },
    fadeOccluders() {},
    update(N, L) {
      for (let O of f)
        O.intensity =
          O.userData.base *
          (0.85 + 0.15 * Math.sin(L * 9 + O.userData.phase) * Math.sin(L * 3.1 + O.userData.phase));
    },
    dispose() {
      (l.traverse((N) => {
        N.geometry?.dispose?.();
      }),
        o.remove(l, c, d, d.target, ...f));
    },
  };
}
const pk = {
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
const fk = {
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

export { mk };
