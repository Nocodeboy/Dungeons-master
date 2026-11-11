// world/vegetation.js
// Reconstruido de publicado/juego.js (módulo __esm «N3»). Nombres locales aún minificados.

import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  InstancedMesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import { hasPiece, pieceBounds, instancePiece, composeMatrix, MeshMerger } from './kit.js';
import { worldMaterial } from './materials.js';
import { LAYER } from './ground.js';
import { cellToWorld, worldToCell, neighbors, HEX_SIZE } from './grid.js';
import { WATER_LEVEL } from './water.js';

function I3(o, e) {
  let t = 0;
  for (let [, n] of e) t += n;
  let a = o() * t;
  for (let [n, s] of e) if (((a -= s), a <= 0)) return n;
  return e[0][0];
}
function HH(o) {
  if (((Km ??= new Map()), Km.has(o))) return Km.get(o);
  let e = 1e3 + o * 77,
    t = () => (e = (e * 16807) % 2147483647) / 2147483647,
    a = [],
    n = [],
    s = o === 2 ? 5 : 6;
  for (let l = 0; l < s; l++) {
    let c = (t() - 0.5) * 0.9,
      d = (t() - 0.5) * 0.9,
      u = 9 + Math.floor(t() * 5),
      h = o === 2 || t() < 0.2,
      p = (0.17 + t() * 0.13) * (h ? 1.6 : 1),
      m = t() < (o === 1 ? 0.35 : 0.16),
      _ = new Color().setRGB(0.16 + t() * 0.04, 0.24 + t() * 0.04, 0.08),
      b = m
        ? new Color().setRGB(0.56 + t() * 0.08, 0.5, 0.24)
        : new Color().setRGB(0.36 + t() * 0.08, 0.5 + t() * 0.06, 0.16);
    for (let f = 0; f < u; f++) {
      let v = t() * Math.PI * 2,
        x = Math.cos(v),
        g = Math.sin(v),
        y = 0.04 + t() * 0.1,
        w = p * (0.6 + t() * 0.5),
        k = 0.014 + t() * 0.012,
        T = c + x * t() * 0.06,
        E = d + g * t() * 0.06,
        S = -g * k,
        z = x * k;
      a.push(T - S, 0, E - z, T + S, 0, E + z, T + x * y, w, E + g * y);
      for (let D of [_, _, b]) n.push(D.r, D.g, D.b);
    }
  }
  let i = new BufferGeometry();
  (i.setAttribute('position', new Float32BufferAttribute(a, 3)),
    i.setAttribute('color', new Float32BufferAttribute(n, 3)));
  let r = new Float32Array(a.length);
  for (let l = 1; l < r.length; l += 3) r[l] = 1;
  return (
    i.setAttribute('normal', new BufferAttribute(r, 3)),
    i.setAttribute('uv', new BufferAttribute(new Float32Array((a.length / 3) * 2), 2)),
    Km.set(o, i),
    i
  );
}
function NH() {
  if (!C1) {
    let o = new MeshStandardMaterial({ vertexColors: !0, roughness: 0.9, side: DoubleSide });
    ((o.name = 'Briznas'),
      (C1 = worldMaterial(o, {
        wind: 0.05,
        windRef: 0.35,
        squash: !0,
        upNormal: 1,
        contact: 'local',
        contactH: 0.3,
        contactMin: 0.7,
      })));
  }
  return C1;
}
function H3(o) {
  let { scene: e, map: t, ground: a, rnd: n, quality: s, ambient: i } = o,
    r = D3[i] || D3.dusk,
    l = [],
    c = [],
    d = new Vector3(),
    u = new Map(),
    h = new Map(),
    p = (D, M, R) => {
      (D.has(M) || D.set(M, []), D.get(M).push(R));
    },
    m = new Map(),
    _ = (D) => (m.has(D) || m.set(D, pieceBounds(D)), m.get(D)),
    b = (D, M, R, A, P, I = !1) => {
      let U = a.heightAt(M, R) - 0.05,
        j = composeMatrix(M, U, R, n() * Math.PI * 2, A),
        X = _(D),
        J = {
          m: j,
          pos: new Vector3(M, U, R),
          h: X.max.y * A,
          r: Math.max(X.max.x - X.min.x, X.max.z - X.min.z) * 0.5 * A,
          fadeable: I,
        };
      p(P ? u : h, D, J);
    },
    f = (D, M) => t.inside(D, M) && t.tile(D, M) !== 'T',
    v = (D, M) => neighbors(D, M).some(([R, A]) => f(R, A) || neighbors(R, A).some(([P, I]) => f(P, I)));
  t.each((D, M, R) => {
    if (R !== 'T') return;
    cellToWorld(D, M, d);
    let A = I3(n, r),
      P = (i === 'forest' ? 0.6 : i === 'kesh' ? 0.72 : 0.8) + n() * 0.26,
      I = s.level >= 2 || v(D, M);
    (b(A, d.x + (n() - 0.5) * 0.4, d.z + (n() - 0.5) * 0.4, P, I, !I), a.blob(LAYER.ao, d.x, d.z, 1.6, 0.35));
  });
  let x = -HEX_SIZE * 0.5,
    g = t.sizeX,
    y = -HEX_SIZE * 0.5,
    w = t.sizeZ + HEX_SIZE * 0.5,
    k = { dusk: 0.42, day: 0.42, forest: 0.85, kesh: 0.5, crypt: 0, inn: 0 }[i] ?? 0.4,
    T = s.level === 0 ? 110 : s.level === 1 ? 190 : 280,
    E = 0,
    S = 2.6;
  for (let D = a.z0 + 1; D < a.z1 - 1 && k > 0; D += S)
    for (let M = a.x0 + 1; M < a.x1 - 1; M += S) {
      let R = M + (n() - 0.5) * S * 0.9,
        A = D + (n() - 0.5) * S * 0.9,
        P = Math.max(x - R, R - g, y - A, A - w);
      if (
        P < 1.2 ||
        o.blocked?.(R, A) ||
        a.maskAt(LAYER.path, R, A) > 0.25 ||
        a.maskAt(LAYER.gravel, R, A) > 0.3 ||
        a.waterAt(R, A) > 0.05
      )
        continue;
      let I = 0.5 + a.noise(R * 0.08, A * 0.08) * 1.2;
      if (n() > k * I * Math.min(1, P / 3) || E++ > T) continue;
      let U = I3(n, r);
      b(U, R, A, 0.85 + n() * 0.45, P < 5);
    }
  for (let [D, M] of u) {
    let R = s.level < 2 && hasPiece(`${D}_lod`) ? `${D}_lod` : D,
      A = instancePiece(
        R,
        M.map((P) => P.m),
        { fade: !0, cast: !0, finish: { windRef: M[0].h, wind: 0.16 } },
      );
    ((A.name = `arboles:${D}`),
      e.add(A),
      c.push(A),
      M.forEach((P, I) => l.push({ pos: P.pos, h: P.h, r: P.r, attr: A.userData.fade, i: I, kind: 'tree' })));
  }
  for (let [D, M] of h) {
    let R = hasPiece(`${D}_lod`) ? `${D}_lod` : D,
      A = M.some((I) => I.fadeable),
      P = instancePiece(
        R,
        M.map((I) => I.m),
        { fade: A, cast: s.level === 2, finish: { windRef: M[0].h, wind: 0.14 } },
      );
    ((P.name = `arboles_lejos:${D}`),
      e.add(P),
      c.push(P),
      A &&
        M.forEach(
          (I, U) =>
            I.fadeable && l.push({ pos: I.pos, h: I.h, r: I.r, attr: P.userData.fade, i: U, kind: 'tree' }),
        ));
  }
  let z = { Bush_Common: [], Bush_Common_Flowers: [], Fern_1: [], Plant_7_Big: [], Rock_Medium_2: [] };
  t.each((D, M, R) => {
    if (R !== 'b') return;
    cellToWorld(D, M, d);
    let A =
        i === 'forest' || i === 'kesh'
          ? n() < 0.45
            ? 'Fern_1'
            : 'Bush_Common'
          : n() < 0.35
            ? 'Bush_Common_Flowers'
            : 'Bush_Common',
      P = d.x + (n() - 0.5) * 0.3,
      I = d.z + (n() - 0.5) * 0.3;
    if ((z[A].push(composeMatrix(P, a.heightAt(P, I) - 0.05, I, n() * 6.28, 0.95 + n() * 0.35)), n() < 0.7)) {
      let U = d.x + (n() - 0.5) * 1,
        j = d.z + (n() - 0.5) * 1;
      z.Bush_Common.push(composeMatrix(U, a.heightAt(U, j) - 0.05, j, n() * 6.28, 0.55 + n() * 0.25));
    }
  });
  for (let [D, M] of Object.entries(z)) {
    if (!M.length) continue;
    let R = instancePiece(D, M, { cast: !0, finish: { wind: 0.04, windRef: 1 } });
    (e.add(R), c.push(R));
  }
  return (i !== 'crypt' && i !== 'inn' && c.push(...OH(o)), { occluders: l, groups: c });
}
function FH(o, e) {
  let { map: t, ground: a, rnd: n, quality: s, ambient: i } = o,
    r = s.level === 0 ? 0.9 : 0.5,
    l = i === 'forest' ? 1 : i === 'kesh' ? 0.08 : 0.5;
  for (let d of ['waterplant', 'waterlily', 'waterlily_b']) e[d] ??= [];
  let c = new Vector3(1, 1, 1);
  for (let d = a.z0 + 0.4; d < a.z1 - 0.4; d += r)
    for (let u = a.x0 + 0.4; u < a.x1 - 0.4; u += r) {
      let h = u + (n() - 0.5) * r,
        p = d + (n() - 0.5) * r;
      if (a.waterAt(h, p) < 0.06) continue;
      let [_, b] = worldToCell(h, p),
        f = t.tile(_, b);
      if (f === '~' || f === ':' || f === '=' || f === 'P' || o.blocked?.(h, p, !0)) continue;
      let v = WATER_LEVEL - a.heightAt(h, p),
        x = a.noise(h * 0.32 + 11, p * 0.32 - 4);
      if (v > -0.14 && v < 0.24) {
        if (n() > 0.18 + x * 1.1) continue;
        let g = composeMatrix(
          h,
          Math.min(a.heightAt(h, p), WATER_LEVEL) - 0.04,
          p,
          n() * 6.28,
          0.9 + n() * 0.5,
        );
        n() < 0.3 ? e.waterplant.push(g) : e.Grass_Wispy_Tall.push(g.scale(c.set(1, 1.5 + n() * 0.6, 1)));
      } else
        v > 0.3 &&
          v < 0.75 &&
          n() < 0.05 * l * (1 + x * 2) &&
          e[n() < 0.6 ? 'waterlily' : 'waterlily_b'].push(
            composeMatrix(h, WATER_LEVEL + 0.012, p, n() * 6.28, 0.7 + n() * 0.6),
          );
    }
}
function OH(o) {
  let { scene: e, map: t, ground: a, rnd: n, quality: s, ambient: i } = o,
    r = s.level,
    l = r === 0 ? 1.15 : r === 1 ? 0.78 : 0.6,
    c = r >= 2 ? 24 : 40,
    d = new Map(),
    u = {
      Flower_3_Group: [],
      Flower_4_Group: [],
      Flower_3_Single: [],
      Clover_1: [],
      Clover_2: [],
      Fern_1: [],
      Mushroom_Common: [],
      Mushroom_Laetiporus: [],
      Plant_1: [],
      Grass_Wispy_Tall: [],
      Pebble_Round_1: [],
      Pebble_Round_4: [],
      Pebble_Square_3: [],
    },
    h = -HEX_SIZE * 0.5,
    p = t.sizeX,
    m = -HEX_SIZE * 0.5,
    _ = t.sizeZ + HEX_SIZE * 0.5,
    b = i === 'forest';
  for (let y = a.z0 + 0.4; y < a.z1 - 0.4; y += l)
    for (let w = a.x0 + 0.4; w < a.x1 - 0.4; w += l) {
      let k = w + (n() - 0.5) * l,
        T = y + (n() - 0.5) * l,
        E = Math.max(h - k, k - p, m - T, T - _);
      if ((E > 2 && n() > Math.max(0.25, 1 - E / 14)) || o.blocked?.(k, T) || a.waterAt(k, T) > 0.02)
        continue;
      let S = a.maskAt(LAYER.path, k, T),
        z = a.maskAt(LAYER.pave, k, T),
        D = a.maskAt(LAYER.mud, k, T),
        M = a.maskAt(LAYER.gravel, k, T),
        R = a.maskAt(LAYER.field, k, T),
        A = a.maskAt(LAYER.litter, k, T),
        P = a.heightAt(k, T);
      if (S > 0.45 || z > 0.3 || M > 0.35 || R > 0.3) {
        (S > 0.45 || M > 0.35) &&
          n() < 0.035 &&
          u[n() < 0.5 ? 'Pebble_Round_1' : n() < 0.5 ? 'Pebble_Round_4' : 'Pebble_Square_3'].push(
            composeMatrix(k, P, T, n() * 6.28, 0.8 + n() * 0.8),
          );
        continue;
      }
      if (D > 0.5) continue;
      let I = Math.max(0, a.noise(k * 0.18, T * 0.18) * 1.6 + a.noise(k * 0.6 + 7, T * 0.6) * 0.5 + 0.3),
        U = S > 0.12 || z > 0.08 || D > 0.2 ? 0.7 : 0;
      if (n() > Math.min(1, I + U) * (b ? 0.75 + (1 - A) * 0.25 : 0.9)) continue;
      if (n() < (b ? 0.035 : 0.045)) {
        let Z = 0.8 + n() * 0.5,
          K = composeMatrix(k, P, T, n() * 6.28, Z);
        if (b) {
          let ve = n();
          ve < 0.45
            ? u.Fern_1.push(K)
            : ve < 0.62
              ? u.Mushroom_Common.push(K)
              : ve < 0.7
                ? u.Mushroom_Laetiporus.push(K)
                : ve < 0.85
                  ? u.Plant_1.push(K)
                  : u.Clover_2.push(K);
        } else {
          let ve = n();
          ve < 0.3
            ? u.Flower_3_Group.push(K)
            : ve < 0.5
              ? u.Flower_4_Group.push(K)
              : ve < 0.6
                ? u.Flower_3_Single.push(K)
                : ve < 0.8
                  ? u.Clover_1.push(K)
                  : ve < 0.9
                    ? u.Grass_Wispy_Tall.push(K)
                    : u.Plant_1.push(K);
        }
        continue;
      }
      let J = `${Math.floor(k / c)},${Math.floor(T / c)}|0`;
      (d.has(J) || d.set(J, []), d.get(J).push(composeMatrix(k, P - 0.02, T, n() * 6.28, 0.85 + n() * 0.5)));
    }
  let f = [],
    v = NH();
  for (let [y, w] of d) {
    let k = Number(y.split('|')[1]),
      T = new InstancedMesh(HH(k), v, w.length);
    (w.forEach((E, S) => T.setMatrixAt(S, E)),
      (T.instanceMatrix.needsUpdate = !0),
      (T.castShadow = !1),
      (T.receiveShadow = !0),
      T.computeBoundingSphere(),
      (T.name = `hierba:${y}`),
      e.add(T),
      f.push(T));
  }
  FH(o, u);
  let x = new MeshMerger({
    contactH: 0.3,
    contactMin: 0.7,
    cast: !1,
    finish: { squash: !0, wind: 0.05, windRef: 0.6 },
    groundAt: (y, w) => a.heightAt(y, w),
  });
  for (let [y, w] of Object.entries(u)) for (let k of w) hasPiece(y) && x.add(y, k);
  let g = x.build('detalle');
  for (let y of g.children) y.castShadow = !1;
  return (e.add(g), f.push(g), f);
}
const D3 = {
  dusk: [
    ['CommonTree_3', 3],
    ['CommonTree_4', 3],
    ['CommonTree_1', 2.5],
    ['Pine_2', 1.2],
  ],
  day: [
    ['CommonTree_3', 3],
    ['CommonTree_4', 3],
    ['CommonTree_1', 2.5],
    ['Pine_2', 1.2],
  ],
  forest: [
    ['Pine_1', 3],
    ['Pine_2', 3],
    ['Pine_5', 3],
    ['Pine_4', 1.5],
    ['DeadTree_1', 0.3],
  ],
  kesh: [
    ['Pine_2', 2.5],
    ['Pine_5', 2.5],
    ['DeadTree_2', 0.9],
    ['TwistedTree_3', 0.3],
  ],
  crypt: [
    ['DeadTree_1', 1],
    ['DeadTree_2', 1],
  ],
};
let Km = null;
let C1 = null;

export { H3 };
