// world/ground.js — terreno del nivel (`Ground`): campo de alturas (cauces de agua y barro, colinas
// en las casillas «#», relieve fuera del tablero con salidas de camino y río), capas de pintura en
// lienzos 2D (`LAYER`: camino, empedrado, barro, hojarasca, grava, AO, luz, campo) que se hornean en
// máscaras, y la malla del suelo con un shader que mezcla texturas por altura, dibuja la rejilla de
// hexágonos, la luz de faroles y las sombras de nubes. Añade el zócalo de la maqueta con su placa.
// Reconstruido de publicado/juego.js (módulo __esm «Zr»). Lo usan index.js y casi todo world/.

import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DataTexture,
  DoubleSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  NoColorSpace,
  PlaneGeometry,
  RGBAFormat,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
  Vector4,
} from 'three';
import {
  makeRng,
  cellToWorld,
  worldToCell,
  neighbors,
  smoothstep,
  makeNoise,
  HEX_SIZE,
  cellKey,
} from './grid.js';
import { worldUniforms } from './materials.js';

/** Textura `assets/tex/<name>.webp` repetible (sRGB por defecto), cacheada. */
function worldTexture(name, srgb = !0) {
  return cachedTexture(`assets/tex/${name}.webp`, srgb);
}
/** Carga una textura repetible con anisotropía 8, cacheada por URL y espacio de color. */
function cachedTexture(url, srgb) {
  let key = url + srgb;
  if (!textureCache.has(key)) {
    let tex = textureLoader.load(url);
    ((tex.wrapS = tex.wrapT = RepeatWrapping),
      (tex.colorSpace = srgb ? SRGBColorSpace : NoColorSpace),
      (tex.anisotropy = 8),
      textureCache.set(key, tex));
  }
  return textureCache.get(key);
}
/** Desenfoque de caja separable (dos pasadas) de un campo `w`×`h`, en sitio. */
function boxBlur(data, w, h, radius) {
  let tmp = new Float32Array(data.length);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let sum = 0,
          count = 0;
        for (let k = -radius; k <= radius; k++) {
          let j = x + k;
          j < 0 || j >= w || ((sum += data[y * w + j]), count++);
        }
        tmp[y * w + x] = sum / count;
      }
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let sum = 0,
          count = 0;
        for (let k = -radius; k <= radius; k++) {
          let j = y + k;
          j < 0 || j >= h || ((sum += tmp[j * w + x]), count++);
        }
        data[y * w + x] = sum / count;
      }
  }
}
const TEX_DIR = 'assets/tex/';
/** Texturas [nombre, escala] de cada capa del suelo según el ambiente del nivel. */
const GROUND_SETS = {
  outdoor: {
    grass: ['leafy_grass', 0.2],
    dirt: ['rocky_trail', 0.24],
    pave: ['grassy_cobblestone', 0.3],
    mud: ['brown_mud_02', 0.3],
    litter: ['forest_floor', 0.25],
    gravel: ['river_small_rocks', 0.32],
  },
  forest: {
    grass: ['leafy_grass', 0.2],
    dirt: ['forest_ground_04', 0.24],
    pave: ['grassy_cobblestone', 0.3],
    mud: ['brown_mud_02', 0.3],
    litter: ['forest_floor', 0.22],
    gravel: ['river_small_rocks', 0.32],
  },
  inn: {
    grass: ['old_wood_floor', 0.4],
    dirt: ['slate_floor', 0.3],
    pave: ['monastery_stone_floor', 0.45],
    mud: ['brown_mud_02', 0.3],
    litter: ['old_wood_floor', 0.4],
    gravel: ['river_small_rocks', 0.32],
  },
  crypt: {
    grass: ['monastery_stone_floor', 0.32],
    dirt: ['forest_ground_04', 0.3],
    pave: ['medieval_blocks_06', 0.3],
    mud: ['brown_mud_02', 0.3],
    litter: ['slate_floor', 0.3],
    gravel: ['river_small_rocks', 0.32],
  },
};
/** Texturas que llevan la altura en el canal alfa (para la mezcla por altura). */
const HEIGHT_IN_ALPHA = new Set([
  'grassy_cobblestone',
  'brown_mud_02',
  'river_small_rocks',
  'forest_floor',
  'rocky_trail',
]);
const textureLoader = new TextureLoader();
const textureCache = new Map();
/** Índices de las capas de pintura del suelo (4 canales por máscara, 2 máscaras). */
const LAYER = { path: 0, pave: 1, mud: 2, litter: 3, gravel: 4, ao: 5, light: 6, field: 7 };
/**
 * Terreno de un nivel sobre un `TileMap`. API principal: `heightAt(x, z)`, `waterAt(x, z)`,
 * `kindOf(col, row)`, pintura (`blob`, `splotch`, `stroke`, `hexFill`, `paintTiles`), `readMasks`,
 * `maskAt(capa, x, z)`, `build(scene)` (malla y zócalo), `raycast(ray)` y `dispose()`.
 */
const Ground = class {
  constructor(map, level, { ambient = 'dusk', quality, seed = 1, margin = 12 } = {}) {
    ((this.map = map),
      (this.level = level),
      (this.ambient = ambient),
      (this.inn = ambient === 'inn'),
      (this.crypt = ambient === 'crypt' || this.inn),
      (this.quality = quality),
      (this.rnd = makeRng(seed)),
      (this.noise = makeNoise(seed + 7)),
      (this.margin = margin),
      (this.x0 = -HEX_SIZE * 0.5 - margin),
      (this.z0 = -HEX_SIZE * 0.5 - margin),
      (this.x1 = map.sizeX + margin),
      (this.z1 = map.sizeZ + HEX_SIZE * 0.5 + margin),
      (this.S = quality.level === 0 ? 4 : 6),
      (this.cw = Math.ceil((this.x1 - this.x0) * this.S)),
      (this.chh = Math.ceil((this.z1 - this.z0) * this.S)),
      (this.layers = []));
    for (let k = 0; k < 8; k++) {
      let canvas = document.createElement('canvas');
      ((canvas.width = this.cw), (canvas.height = this.chh));
      let ctx = canvas.getContext('2d', { willReadFrequently: !0 });
      ((ctx.fillStyle = '#000'),
        ctx.fillRect(0, 0, this.cw, this.chh),
        (ctx.globalCompositeOperation = 'lighter'),
        this.layers.push({ cv: canvas, g: ctx }));
    }
    ((this.groundKind = level.ground || {}), this.buildHeights());
  }
  /** Tipo de suelo de una casilla: pintura del nivel, `level.ground` o el carácter del mapa. */
  kindOf(col, row) {
    let map = this.map,
      ch = map.tile(col, row),
      painted = map.paint.get(cellKey(col, row));
    if (painted) return painted === 'dirt' ? 'field' : painted === 'paved' ? 'pave' : painted;
    if (this.groundKind[ch]) {
      let kind = this.groundKind[ch];
      return kind === 'paved' ? 'pave' : kind;
    }
    switch (ch) {
      case ':':
        return 'path';
      case '.':
        return this.inn ? 'grass' : this.crypt ? 'pave' : 'dirt';
      case '=':
      case 'P':
      case 'S':
        return 'pave';
      case '~':
        return 'mud';
      case 'w':
        return 'water';
      case 'x':
        return 'rubble';
      case 'H':
      case 'B':
        return 'dirt';
      case '#':
        return this.crypt ? 'rock' : 'hill';
      case ' ':
        return 'void';
      default:
        return 'grass';
    }
  }
  /** Calcula el campo de alturas `H` (rejilla de 0,5 m) y `waterField`. */
  buildHeights() {
    let map = this.map,
      res = 0.5;
    ((this.hr = res),
      (this.hw = Math.ceil((this.x1 - this.x0) / res) + 1),
      (this.hh = Math.ceil((this.z1 - this.z0) / res) + 1));
    let heights = new Float32Array(this.hw * this.hh),
      water = new Float32Array(this.hw * this.hh),
      mud = new Float32Array(this.hw * this.hh),
      pos = new Vector3();
    (map.each((col, row, ch) => {
      if (ch !== 'w' && ch !== '~') return;
      cellToWorld(col, row, pos);
      let field = ch === 'w' ? water : mud,
        radius = ch === 'w' ? 1.05 : 0.95,
        ix0 = Math.floor((pos.x - radius - this.x0) / res),
        ix1 = Math.ceil((pos.x + radius - this.x0) / res),
        iz0 = Math.floor((pos.z - radius - this.z0) / res),
        iz1 = Math.ceil((pos.z + radius - this.z0) / res);
      for (let iz = iz0; iz <= iz1; iz++)
        for (let ix = ix0; ix <= ix1; ix++) {
          if (ix < 0 || iz < 0 || ix >= this.hw || iz >= this.hh) continue;
          let wx = this.x0 + ix * res,
            wz = this.z0 + iz * res,
            dist = Math.hypot(wx - pos.x, wz - pos.z) / radius,
            fall = Math.max(0, 1 - dist * dist);
          field[iz * this.hw + ix] = Math.max(field[iz * this.hw + ix], fall);
        }
    }),
      boxBlur(water, this.hw, this.hh, 2),
      boxBlur(mud, this.hw, this.hh, 1),
      (this.waterField = water));
    let hills = new Float32Array(this.hw * this.hh);
    if (!this.crypt) {
      let hillDist = new Map(),
        queue = [];
      for (
        map.each((col, row, ch) => {
          ch !== '#' && (hillDist.set(cellKey(col, row), 0), queue.push([col, row]));
        });
        queue.length;
      ) {
        let [col, row] = queue.shift(),
          steps = hillDist.get(cellKey(col, row));
        for (let [nc, nr] of neighbors(col, row))
          !map.inside(nc, nr) ||
            hillDist.has(cellKey(nc, nr)) ||
            (hillDist.set(cellKey(nc, nr), steps + 1), queue.push([nc, nr]));
      }
      this.hillDist = hillDist;
      for (let iz = 0; iz < this.hh; iz++)
        for (let ix = 0; ix < this.hw; ix++) {
          let [tc, tr] = worldToCell(this.x0 + ix * res, this.z0 + iz * res);
          map.tile(tc, tr) === '#' &&
            (hills[iz * this.hw + ix] = smoothstep(0.5, 3, hillDist.get(cellKey(tc, tr)) || 0));
        }
      boxBlur(hills, this.hw, this.hh, 1);
      for (let iz = 0; iz < this.hh; iz++)
        for (let ix = 0; ix < this.hw; ix++) {
          let [tc, tr] = worldToCell(this.x0 + ix * res, this.z0 + iz * res);
          map.inside(tc, tr) && map.tile(tc, tr) !== '#' && (hills[iz * this.hw + ix] = 0);
        }
    }
    let noise = this.noise,
      minX = -HEX_SIZE * 0.5,
      maxX = map.sizeX,
      minZ = -HEX_SIZE * 0.5,
      maxZ = map.sizeZ + HEX_SIZE * 0.5,
      exitAt = this.edgeWater();
    for (let iz = 0; iz < this.hh; iz++)
      for (let ix = 0; ix < this.hw; ix++) {
        let wx = this.x0 + ix * res,
          wz = this.z0 + iz * res,
          outside = Math.max(minX - wx, wx - maxX, minZ - wz, wz - maxZ, 0),
          elev = noise.fbm(wx * 0.11, wz * 0.11, 3) * 0.06;
        if (this.crypt) {
          heights[iz * this.hw + ix] = 0;
          continue;
        }
        if (outside > 0) {
          let rise = smoothstep(0.5, 9, outside) * (0.9 + 1.6 * (0.5 + noise.fbm(wx * 0.045, wz * 0.045, 3)));
          elev += rise * (this.ambient === 'kesh' ? 1.4 : 1);
          let exit = exitAt(wx, wz);
          ((elev *= 1 - exit.path * 0.85), (elev -= exit.water * 0.55));
        }
        elev += hills[iz * this.hw + ix] * 2.6;
        let wet = water[iz * this.hw + ix] + (outside > 0 ? exitAt(wx, wz).water : 0);
        ((elev -= Math.min(1, wet * 1.2) * 0.95),
          (elev -= mud[iz * this.hw + ix] * 0.08),
          (heights[iz * this.hw + ix] = elev));
      }
    this.H = heights;
  }
  /**
   * Registra en `exits` las casillas de borde con camino o agua y devuelve `(x, z) => {water, path}`:
   * cuánto se prolonga cada uno fuera del tablero en ese punto.
   */
  edgeWater() {
    let map = this.map,
      exits = [],
      pos = new Vector3();
    return (
      map.each((col, row, ch) => {
        if (!(col === 0 || row === 0 || col === map.w - 1 || row === map.h - 1)) return;
        let kind =
          ch === 'w' || ch === '~'
            ? 'water'
            : ch === ':' || (ch === '.' && this.kindOf(col, row) !== 'grass')
              ? 'path'
              : null;
        if (!kind) return;
        cellToWorld(col, row, pos);
        let dir = new Vector2(
          col === 0 ? -1 : col === map.w - 1 ? 1 : 0,
          row === 0 ? -1 : row === map.h - 1 ? 1 : 0,
        );
        (dir.lengthSq() > 1 && dir.normalize(),
          exits.push({ x: pos.x, z: pos.z, dx: dir.x, dz: dir.y, kind }));
      }),
      (this.exits = exits),
      (wx, wz) => {
        let water = 0,
          path = 0;
        for (let exit of exits) {
          let dx = wx - exit.x,
            dz = wz - exit.z,
            along = dx * exit.dx + dz * exit.dz;
          if (along < 0) continue;
          let across = Math.abs(dx * -exit.dz + dz * exit.dx),
            wobble = this.noise(along * 0.15 + exit.x, exit.z) * 1.2,
            weight =
              1 -
              smoothstep(
                exit.kind === 'water' ? 0.6 : 0.8,
                exit.kind === 'water' ? 1.6 : 2.4,
                Math.abs(across - wobble * 0.3),
              );
          exit.kind === 'water' ? (water = Math.max(water, weight)) : (path = Math.max(path, weight));
        }
        return { water, path };
      }
    );
  }
  /** Altura del terreno en (x, z), interpolada bilinealmente. */
  heightAt(x, z) {
    let fx = (x - this.x0) / this.hr,
      fz = (z - this.z0) / this.hr,
      ix = Math.max(0, Math.min(this.hw - 2, Math.floor(fx))),
      iz = Math.max(0, Math.min(this.hh - 2, Math.floor(fz))),
      tx = Math.min(1, Math.max(0, fx - ix)),
      tz = Math.min(1, Math.max(0, fz - iz)),
      H = this.H,
      h00 = H[iz * this.hw + ix],
      h10 = H[iz * this.hw + ix + 1],
      h01 = H[(iz + 1) * this.hw + ix],
      h11 = H[(iz + 1) * this.hw + ix + 1];
    return h00 + (h10 - h00) * tx + (h01 - h00) * tz + (h00 - h10 - h01 + h11) * tx * tz;
  }
  waterAt(x, z) {
    let ix = Math.round((x - this.x0) / this.hr),
      iz = Math.round((z - this.z0) / this.hr);
    return ix < 0 || iz < 0 || ix >= this.hw || iz >= this.hh ? 0 : this.waterField[iz * this.hw + ix];
  }
  px(x) {
    return (x - this.x0) * this.S;
  }
  pz(z) {
    return (z - this.z0) * this.S;
  }
  /** Pinta una mancha radial en la capa `layer` (suma aditiva). */
  blob(layer, x, z, radius, strength = 1, mid = 0.5) {
    let g = this.layers[layer].g,
      cx = this.px(x),
      cz = this.pz(z),
      rad = radius * this.S,
      grad = g.createRadialGradient(cx, cz, 0, cx, cz, rad),
      v = Math.round(strength * 255);
    (grad.addColorStop(0, `rgb(${v},${v},${v})`),
      grad.addColorStop(mid, `rgb(${Math.round(v * 0.8)},${Math.round(v * 0.8)},${Math.round(v * 0.8)})`),
      grad.addColorStop(1, 'rgb(0,0,0)'),
      (g.fillStyle = grad),
      g.fillRect(cx - rad, cz - rad, rad * 2, rad * 2));
  }
  /** Varias manchas aleatorias alrededor de (x, z). */
  splotch(layer, x, z, radius, strength = 1, count = 4) {
    for (let k = 0; k < count; k++) {
      let angle = this.rnd() * Math.PI * 2,
        dist = this.rnd() * radius * 0.45;
      this.blob(
        layer,
        x + Math.cos(angle) * dist,
        z + Math.sin(angle) * dist,
        radius * (0.55 + this.rnd() * 0.35),
        strength * (0.6 + this.rnd() * 0.4),
      );
    }
  }
  /** Trazo difuminado por `points` ([[x, z]…]) en la capa `layer`. */
  stroke(layer, points, width, strength = 1, blur = 4) {
    let g = this.layers[layer].g;
    (g.save(), (g.filter = `blur(${blur}px)`));
    let v = Math.round(strength * 255);
    ((g.strokeStyle = `rgb(${v},${v},${v})`),
      (g.lineWidth = width * this.S),
      (g.lineCap = 'round'),
      (g.lineJoin = 'round'),
      g.beginPath(),
      g.moveTo(this.px(points[0][0]), this.pz(points[0][1])));
    for (let k = 1; k < points.length; k++) g.lineTo(this.px(points[k][0]), this.pz(points[k][1]));
    (g.stroke(), g.restore());
  }
  /** Rellena el hexágono de una casilla en la capa `layer`. */
  hexFill(layer, col, row, strength = 1, scale = 1.08, blur = 2) {
    let g = this.layers[layer].g,
      center = cellToWorld(col, row),
      radius = 0.5773503 * HEX_SIZE * scale;
    (g.save(), (g.filter = `blur(${blur}px)`));
    let v = Math.round(strength * 255);
    ((g.fillStyle = `rgb(${v},${v},${v})`), g.beginPath());
    for (let k = 0; k < 6; k++) {
      let angle = (Math.PI / 3) * k + Math.PI / 6,
        x = this.px(center.x + Math.cos(angle) * radius),
        z = this.pz(center.z + Math.sin(angle) * radius);
      k === 0 ? g.moveTo(x, z) : g.lineTo(x, z);
    }
    (g.closePath(), g.fill(), g.restore());
  }
  /** Pinta las capas a partir de las casillas del mapa, las salidas y manchas sueltas. */
  paintTiles() {
    let map = this.map,
      pos = new Vector3(),
      other = new Vector3(),
      rnd = this.rnd,
      joined = new Set();
    map.each((col, row, ch) => {
      let kind = this.kindOf(col, row);
      if ((cellToWorld(col, row, pos), kind === 'path' || kind === 'dirt')) {
        let width = kind === 'path' ? 1.55 : 1.9;
        this.blob(LAYER.path, pos.x, pos.z, width * 0.62, kind === 'path' ? 0.9 : 0.75);
        for (let [nc, nr] of neighbors(col, row)) {
          let nkind = this.kindOf(nc, nr);
          if (nkind !== 'path' && nkind !== 'dirt') continue;
          let key = [cellKey(col, row), cellKey(nc, nr)].sort().join('|');
          if (joined.has(key)) continue;
          (joined.add(key), cellToWorld(nc, nr, other));
          let mx = (pos.x + other.x) / 2 + (rnd() - 0.5) * 0.35,
            mz = (pos.z + other.z) / 2 + (rnd() - 0.5) * 0.35;
          this.stroke(
            LAYER.path,
            [
              [pos.x, pos.z],
              [mx, mz],
              [other.x, other.z],
            ],
            width * (0.85 + rnd() * 0.2),
            kind === 'path' ? 0.85 : 0.7,
            3,
          );
        }
        (this.blob(LAYER.path, pos.x, pos.z, 2.3, 0.18),
          rnd() < 0.25 &&
            this.blob(LAYER.mud, pos.x + (rnd() - 0.5), pos.z + (rnd() - 0.5), 0.5 + rnd() * 0.4, 0.5));
      } else
        kind === 'pave'
          ? (this.hexFill(LAYER.pave, col, row, 1, 1.12, 3), this.blob(LAYER.path, pos.x, pos.z, 1.5, 0.25))
          : kind === 'mud'
            ? (this.splotch(LAYER.mud, pos.x, pos.z, 1.4, 0.95),
              this.blob(LAYER.gravel, pos.x, pos.z, 0.7, 0.25))
            : kind === 'water'
              ? (this.blob(LAYER.gravel, pos.x, pos.z, 1.5, 1), this.blob(LAYER.mud, pos.x, pos.z, 2.1, 0.55))
              : kind === 'rubble'
                ? (this.splotch(this.crypt ? LAYER.path : LAYER.gravel, pos.x, pos.z, 1.1, 0.8),
                  this.blob(LAYER.path, pos.x, pos.z, 1.2, 0.5))
                : kind === 'litter'
                  ? this.splotch(LAYER.litter, pos.x, pos.z, 1.3, 0.9)
                  : kind === 'hill'
                    ? (rnd() < 0.5 &&
                        this.blob(LAYER.gravel, pos.x + (rnd() - 0.5), pos.z + (rnd() - 0.5), 0.9, 0.5),
                      this.blob(LAYER.litter, pos.x, pos.z, 1.2, 0.35))
                    : kind === 'field'
                      ? this.hexFill(LAYER.field, col, row, 1, 1.18, 4)
                      : kind === 'rock' && this.hexFill(LAYER.path, col, row, 0.8, 1.1, 3);
      ch === 'T'
        ? (this.blob(
            LAYER.litter,
            pos.x,
            pos.z,
            this.ambient === 'forest' ? 2.2 : 1.6,
            this.ambient === 'forest' ? 0.85 : 0.55,
          ),
          this.blob(LAYER.ao, pos.x, pos.z, 1.3, 0.5))
        : ch === 'b'
          ? (this.blob(LAYER.litter, pos.x, pos.z, 1.2, 0.5), this.blob(LAYER.ao, pos.x, pos.z, 0.9, 0.35))
          : ch === 'r'
            ? (this.blob(LAYER.gravel, pos.x, pos.z, 1.1, 0.6), this.blob(LAYER.ao, pos.x, pos.z, 1, 0.55))
            : ch === 'c' || ch === 'o' || ch === 'O'
              ? (this.blob(LAYER.ao, pos.x, pos.z, 0.9, 0.4),
                this.inn || this.blob(LAYER.path, pos.x, pos.z, 1, 0.25))
              : ch === 'B' || ch === 'H'
                ? this.blob(LAYER.path, pos.x, pos.z, 1.2, 0.45)
                : ch === 'f'
                  ? this.blob(LAYER.path, pos.x, pos.z, 0.8, 0.22)
                  : ch === ',' &&
                    this.ambient === 'forest' &&
                    rnd() < 0.35 &&
                    this.blob(LAYER.litter, pos.x + (rnd() - 0.5), pos.z + (rnd() - 0.5), 1.2 + rnd(), 0.5);
    });
    for (let exit of this.exits || []) {
      let pts = [];
      for (let dist = 0; dist <= this.margin + 4; dist += 1.5) {
        let wob = this.noise(dist * 0.15 + exit.x, exit.z) * 1.2;
        pts.push([
          exit.x + exit.dx * dist + -exit.dz * wob * 0.3,
          exit.z + exit.dz * dist + exit.dx * wob * 0.3,
        ]);
      }
      exit.kind === 'path'
        ? (this.stroke(LAYER.path, pts, 1.7, 0.85, 3), this.stroke(LAYER.path, pts, 3.6, 0.15, 8))
        : (this.stroke(LAYER.gravel, pts, 2.6, 1, 4), this.stroke(LAYER.mud, pts, 3.6, 0.5, 6));
    }
    let count = this.inn ? 0 : this.ambient === 'forest' ? 70 : this.crypt ? 30 : 40;
    for (let k = 0; k < count; k++) {
      let x = this.x0 + rnd() * (this.x1 - this.x0),
        z = this.z0 + rnd() * (this.z1 - this.z0);
      this.crypt
        ? this.blob(rnd() < 0.5 ? LAYER.litter : LAYER.path, x, z, 1 + rnd() * 2.5, 0.35)
        : this.blob(
            this.ambient === 'forest' ? LAYER.litter : LAYER.path,
            x,
            z,
            1.2 + rnd() * 2.8,
            0.12 + rnd() * 0.2,
          );
    }
  }
  /** Lee los lienzos de las capas y los empaqueta en dos máscaras RGBA (`maskData`). */
  readMasks() {
    let size = this.cw * this.chh,
      layerData = (layer) => this.layers[layer].g.getImageData(0, 0, this.cw, this.chh).data,
      masks = [new Uint8Array(size * 4), new Uint8Array(size * 4)];
    for (let m = 0; m < 2; m++)
      for (let channel = 0; channel < 4; channel++) {
        let src = layerData(m * 4 + channel),
          dst = masks[m];
        for (let p = 0; p < size; p++) dst[p * 4 + channel] = src[p * 4];
      }
    return ((this.maskData = masks), masks);
  }
  bakeMasks() {
    let data = this.readMasks();
    this.masks = data.map((bytes) => {
      let tex = new DataTexture(bytes, this.cw, this.chh, RGBAFormat);
      return (
        (tex.flipY = !1),
        (tex.magFilter = LinearFilter),
        (tex.minFilter = LinearMipmapLinearFilter),
        (tex.generateMipmaps = !0),
        (tex.needsUpdate = !0),
        tex
      );
    });
  }
  /** Valor en [0, 1] de la capa `layer` en (x, z), según las máscaras leídas. */
  maskAt(layer, x, z) {
    if (!this.maskData) return 0;
    let px = Math.floor(this.px(x)),
      pz = Math.floor(this.pz(z));
    return px < 0 || pz < 0 || px >= this.cw || pz >= this.chh
      ? 0
      : this.maskData[layer >> 2][(pz * this.cw + px) * 4 + (layer & 3)] / 255;
  }
  /** Textura de casillas del tablero (para dibujar la rejilla solo donde se puede pisar). */
  cellTexture() {
    let map = this.map,
      data = new Uint8Array(map.w * map.h * 4);
    map.each((col, row, ch) => {
      let on = !' #'.includes(ch) && !(this.crypt && ch === '#');
      data[(row * map.w + col) * 4] = on ? 255 : 0;
    });
    let tex = new DataTexture(data, map.w, map.h, RGBAFormat);
    return (
      (tex.magFilter = NearestFilter),
      (tex.minFilter = NearestFilter),
      (tex.needsUpdate = !0),
      (this.cellTex = tex),
      tex
    );
  }
  /** Crea el material y la malla del suelo y el zócalo, y los añade a `scene`. */
  build(scene) {
    this.bakeMasks();
    let texSet =
        GROUND_SETS[
          this.inn ? 'inn' : this.crypt ? 'crypt' : this.ambient === 'forest' ? 'forest' : 'outdoor'
        ],
      low = this.quality.level === 0,
      used = (layer) => {
        let data = this.maskData[layer >> 2];
        for (let k = layer & 3; k < data.length; k += 4) if (data[k] > 6) return !0;
        return !1;
      },
      present = {
        grass: !0,
        dirt: used(LAYER.path) || used(LAYER.field),
        pave: used(LAYER.pave),
        mud: used(LAYER.mud) || used(LAYER.field),
        litter: used(LAYER.litter),
        gravel: used(LAYER.gravel),
      },
      tex = {},
      [grassName] = texSet.grass;
    for (let [kind, [name, scale]] of Object.entries(texSet)) {
      let file = present[kind] ? name : grassName,
        withNormal = !low && present[kind] && ['grass', 'dirt', 'pave', 'gravel'].includes(kind);
      tex[kind] = {
        d: cachedTexture(`${TEX_DIR}${file}_diff.webp`, !0),
        n: withNormal ? cachedTexture(`${TEX_DIR}${file}_nor.webp`, !1) : null,
        s: scale,
        h: HEIGHT_IN_ALPHA.has(file),
      };
    }
    let flatNormal =
      this.flatNormal ||
      (this.flatNormal = (() => {
        let flat = new DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1, RGBAFormat);
        return ((flat.needsUpdate = !0), flat);
      })());
    this.uniforms = {
      tMask1: { value: this.masks[0] },
      tMask2: { value: this.masks[1] },
      tCells: { value: this.cellTexture() },
      uRect: { value: new Vector4(this.x0, this.z0, this.x1 - this.x0, this.z1 - this.z0) },
      uBoard: { value: new Vector2(this.map.w, this.map.h) },
      uGrid: { value: 0 },
      uGridColor: { value: new Color(this.crypt ? 14207144 : 16773840) },
      uLamp: { value: 0 },
      uLampColor: { value: new Color(16752704) },
      uGrassTint: {
        value: new Color(
          this.inn
            ? 10525332
            : this.ambient === 'forest'
              ? 9676916
              : this.ambient === 'kesh'
                ? 11052674
                : 10663028,
        ),
      },
      uWet: { value: 1 },
      uClouds: { value: 0 },
      uTime: worldUniforms.uTime,
    };
    for (let [kind, entry] of Object.entries(tex))
      ((this.uniforms[`t_${kind}`] = { value: entry.d }),
        (this.uniforms[`s_${kind}`] = { value: entry.s }),
        !low &&
          ['grass', 'dirt', 'pave', 'gravel'].includes(kind) &&
          (this.uniforms[`n_${kind}`] = { value: entry.n || flatNormal }));
    let material = new MeshStandardMaterial({ color: 16777215, roughness: 0.95, metalness: 0 }),
      uniforms = this.uniforms,
      heightFlag = (kind) => (tex[kind].h ? '1.0' : '0.0');
    ((material.onBeforeCompile = (shader) => {
      (Object.assign(shader.uniforms, uniforms),
        (shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            `#include <common>
varying vec3 vWp; varying vec3 vWn;`,
          )
          .replace(
            '#include <worldpos_vertex>',
            `#include <worldpos_vertex>
vWp = (modelMatrix * vec4(transformed, 1.0)).xyz; vWn = normalize(mat3(modelMatrix) * objectNormal);`,
          )));
      let samplerDecls = Object.keys(uniforms)
          .filter((name) => name.startsWith('t_') || name.startsWith('n_'))
          .map((name) => `uniform sampler2D ${name};`).join(`
`),
        scaleDecls = Object.keys(uniforms)
          .filter((name) => name.startsWith('s_'))
          .map((name) => `uniform float ${name};`).join(`
`);
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
varying vec3 vWp; varying vec3 vWn;
uniform sampler2D tMask1; uniform sampler2D tMask2; uniform sampler2D tCells;
uniform vec4 uRect; uniform vec2 uBoard; uniform float uGrid; uniform vec3 uGridColor;
uniform float uLamp; uniform vec3 uLampColor; uniform vec3 uGrassTint; uniform float uWet; uniform float uClouds; uniform float uTime;
${samplerDecls}
${scaleDecls}
float gLum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
float gH21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float gVn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(gH21(i), gH21(i+vec2(1,0)), f.x), mix(gH21(i+vec2(0,1)), gH21(i+vec2(1,1)), f.x), f.y); }
// Casilla (odd-r) y distancia al borde del hex\xE1gono, en el plano de casillas
vec3 gHex(vec2 p){
  float q = (0.57735027 * p.x - p.y / 3.0) / 0.57735027;
  float r = (2.0 / 3.0 * p.y) / 0.57735027;
  float s = -q - r;
  float rq = floor(q + 0.5), rr = floor(r + 0.5), rs = floor(s + 0.5);
  float dq = abs(rq - q), dr = abs(rr - r), ds = abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs; else if (dr > ds) rr = -rq - rs;
  float row = rr;
  float col = rq + floor((rr - mod(rr, 2.0)) / 2.0);
  vec2 c = vec2(col + 0.5 * mod(row, 2.0), row * 0.8660254);
  vec2 d = abs(p - c);
  float e = 0.5 - max(d.x, d.x * 0.5 + d.y * 0.8660254);
  return vec3(col, row, e);
}`,
        )
        .replace(
          '#include <map_fragment>',
          `
  vec2 w = vWp.xz;
  vec2 muv = (w - uRect.xy) / uRect.zw;
  vec4 m1 = texture2D(tMask1, muv);
  vec4 m2 = texture2D(tMask2, muv);
  // bordes org\xE1nicos: el ruido mueve un poco los l\xEDmites de las capas
  float nz = gVn(w * 1.3) * 0.6 + gVn(w * 4.1) * 0.4;
  float macro = texture2D(t_grass, w * 0.013).g;
  // muestras
  vec4 cg1 = texture2D(t_grass, w * s_grass);
  vec4 cg2 = texture2D(t_grass, w * s_grass * 0.31 + 0.37);
  vec4 cg = mix(cg1, cg2, 0.35);
  vec4 cd = texture2D(t_dirt, w * s_dirt);
  vec4 cp = texture2D(t_pave, w * s_pave);
  vec4 cm = texture2D(t_mud, w * s_mud);
  vec4 cl = texture2D(t_litter, w * s_litter);
  vec4 cr = texture2D(t_gravel, w * s_gravel);
  float hg = ${heightFlag('grass')} > 0.5 ? cg.a : gLum(cg.rgb);
  float hd = ${heightFlag('dirt')} > 0.5 ? cd.a : gLum(cd.rgb) * 1.2;
  float hp = ${heightFlag('pave')} > 0.5 ? cp.a : gLum(cp.rgb) * 1.4;
  float hm = ${heightFlag('mud')} > 0.5 ? cm.a : gLum(cm.rgb);
  float hl = ${heightFlag('litter')} > 0.5 ? cl.a : gLum(cl.rgb);
  float hr = ${heightFlag('gravel')} > 0.5 ? cr.a : gLum(cr.rgb);
  // pesos pintados (con borde roto por el ruido)
  float aP = clamp(m1.r * 1.25 - (nz - 0.5) * 0.45, 0.0, 1.0);
  float aV = clamp(m1.g * 1.3 - (nz - 0.5) * 0.25, 0.0, 1.0);
  float aM = clamp(m1.b * 1.2 - (nz - 0.5) * 0.4, 0.0, 1.0);
  float aL = clamp(m1.a * 1.15 - (nz - 0.5) * 0.5, 0.0, 1.0);
  float aR = clamp(m2.r * 1.2 - (nz - 0.5) * 0.35, 0.0, 1.0);
  float aF = clamp(m2.a, 0.0, 1.0);
  float aG = clamp(1.0 - max(max(max(aP, aV), max(aM, aL)), max(aR, aF)), 0.0, 1.0);
  // mezcla por altura: las piedras asoman sobre el barro y la hierba
  float dep = 0.28;
  float bG = aG + hg * dep, bP = aP + hd * dep, bV = aV + hp * dep * 1.3, bM = aM + hm * dep * 0.6, bL = aL + hl * dep, bR = aR + hr * dep * 1.2, bF = aF + hd * dep * 0.5;
  float mx = max(max(max(bG, bP), max(bV, bM)), max(max(bL, bR), bF)) - 0.12;
  vec4 wA = max(vec4(bG, bP, bV, bM) - mx, 0.0);
  vec3 wB = max(vec3(bL, bR, bF) - mx, 0.0);
  float wsum = wA.x + wA.y + wA.z + wA.w + wB.x + wB.y + wB.z + 1e-4;
  wA /= wsum; wB /= wsum;
  vec3 grassC = cg.rgb * uGrassTint * 1.6;
  grassC *= mix(0.78, 1.16, smoothstep(0.2, 0.75, macro));
  grassC = mix(grassC, grassC * vec3(1.18, 1.02, 0.68), smoothstep(0.55, 0.85, gVn(w * 0.07)) * 0.6);
  vec3 dirtC = cd.rgb * vec3(1.08, 1.0, 0.88);
  vec3 paveC = cp.rgb * 1.02;
  vec3 mudC = cm.rgb * 0.8;
  vec3 litC = cl.rgb * vec3(1.0, 0.95, 0.85);
  vec3 grvC = cr.rgb * 0.95;
  vec3 fieldC = mix(cm.rgb * 1.15, cd.rgb * 0.8, 0.35) * (0.82 + 0.18 * smoothstep(-0.3, 0.3, sin(w.x * 6.0 + gVn(w * 0.5) * 2.0)));
  vec3 gcol = grassC * wA.x + dirtC * wA.y + paveC * wA.z + mudC * wA.w + litC * wB.x + grvC * wB.y + fieldC * wB.z;
  // oscurecido de contacto pintado (bajo casas, \xE1rboles, rocas) y humedad del barro
  float ao = 1.0 - m2.g * 0.55;
  gcol *= ao;
  float wetK = (wA.w + wB.y * 0.6) * uWet;
  // sombras de nubes que pasan (de d\xEDa)
  if (uClouds > 0.001) {
    vec2 cw = w * 0.022 + vec2(uTime * 0.012, uTime * 0.005);
    float cl = smoothstep(0.52, 0.8, gVn(cw) * 0.65 + gVn(cw * 2.3 + 3.1) * 0.35);
    gcol *= 1.0 - cl * 0.22 * uClouds;
  }
  diffuseColor.rgb *= gcol;`,
        )
        .replace(
          '#include <roughnessmap_fragment>',
          `
  float roughnessFactor = mix(roughness, 0.42, wetK * 0.8);`,
        )
        .replace(
          '#include <normal_fragment_maps>',
          low
            ? ''
            : `
  {
    vec3 tn = vec3(0.0);
    tn += (texture2D(n_grass, w * s_grass).xyz * 2.0 - 1.0) * (wA.x + wB.x * 0.5);
    tn += (texture2D(n_dirt, w * s_dirt).xyz * 2.0 - 1.0) * (wA.y + wB.z + wA.w * 0.5);
    tn += (texture2D(n_pave, w * s_pave).xyz * 2.0 - 1.0) * wA.z * 1.4;
    tn += (texture2D(n_gravel, w * s_gravel).xyz * 2.0 - 1.0) * (wB.y * 1.3 + wB.x * 0.5);
    vec3 nW = normalize(vWn + vec3(tn.x, 0.0, tn.y) * 0.9);
    normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz);
  }`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
  totalEmissiveRadiance += uLampColor * m2.b * m2.b * uLamp * 0.55 * gcol * 2.2;
  // rejilla de hex\xE1gonos (solo dentro del tablero)
  if (uGrid > 0.001) {
    vec3 hx = gHex(w / ${HEX_SIZE.toFixed(2)});
    vec2 cuv = (hx.xy + 0.5) / uBoard;
    float inside = step(0.0, hx.x) * step(0.0, hx.y) * step(hx.x, uBoard.x - 1.0) * step(hx.y, uBoard.y - 1.0);
    float on = inside * texture2D(tCells, cuv).r;
    float aa = fwidth(hx.z) * 1.2;
    float line = 1.0 - smoothstep(0.011, 0.011 + aa, hx.z);
    float inner = (1.0 - smoothstep(0.0, 0.16, hx.z)) * 0.18;
    float g = (line * 0.85 + inner) * on * uGrid;
    diffuseColor.rgb = mix(diffuseColor.rgb, uGridColor * 0.9, g * 0.5);
    totalEmissiveRadiance += uGridColor * g * 0.14;
  }`,
        );
    }),
      (material.customProgramCacheKey = () => `suelo|${this.crypt}|${this.ambient}|${low}`),
      (this.material = material));
    let nx = this.hw,
      nz = this.hh,
      geo = new PlaneGeometry(this.x1 - this.x0, this.z1 - this.z0, nx - 1, nz - 1);
    geo.rotateX(-Math.PI / 2);
    let pos = geo.getAttribute('position');
    for (let k = 0; k < pos.count; k++) {
      let wx = pos.getX(k) + (this.x0 + this.x1) / 2,
        wz = pos.getZ(k) + (this.z0 + this.z1) / 2;
      pos.setXYZ(k, wx, this.heightAt(wx, wz), wz);
    }
    (geo.computeVertexNormals(), geo.computeBoundingBox(), geo.computeBoundingSphere());
    let mesh = new Mesh(geo, material);
    return (
      (mesh.receiveShadow = !0),
      (mesh.name = 'suelo'),
      scene.add(mesh),
      (this.mesh = mesh),
      this.buildPlinth(scene),
      mesh
    );
  }
  /** Zócalo de la maqueta: laterales de tierra estratificada, base de madera, filete y placa con el nombre. */
  buildPlinth(scene) {
    let bottom = this.crypt ? -1.2 : -2.6,
      ring = [],
      step = 0.5,
      push = (px, pz) => ring.push([px, pz]);
    for (let q = this.x0; q < this.x1; q += step) push(q, this.z0);
    for (let q = this.z0; q < this.z1; q += step) push(this.x1, q);
    for (let q = this.x1; q > this.x0; q -= step) push(q, this.z1);
    for (let q = this.z1; q > this.z0; q -= step) push(this.x0, q);
    push(this.x0, this.z0);
    let count = ring.length,
      positions = new Float32Array(count * 2 * 3),
      uvs = new Float32Array(count * 2 * 2),
      run = 0;
    for (let j = 0; j < count; j++) {
      let [px, pz] = ring[j];
      j > 0 && (run += Math.hypot(px - ring[j - 1][0], pz - ring[j - 1][1]));
      let top = this.heightAt(px, pz);
      (positions.set([px, top, pz, px, bottom, pz], j * 6), uvs.set([run, top, run, bottom], j * 4));
    }
    let indices = [];
    for (let j = 0; j < count - 1; j++) {
      let vi = j * 2;
      indices.push(vi, vi + 2, vi + 1, vi + 1, vi + 2, vi + 3);
    }
    let geo = new BufferGeometry();
    (geo.setAttribute('position', new BufferAttribute(positions, 3)),
      geo.setAttribute('uv', new BufferAttribute(uvs, 2)),
      geo.setIndex(indices),
      geo.computeVertexNormals());
    let rockTex = cachedTexture(`${TEX_DIR}rock_ground_diff.webp`, !0),
      sideMat = new MeshStandardMaterial({ color: 16777215, roughness: 1, side: DoubleSide }),
      isCrypt = this.crypt;
    ((sideMat.onBeforeCompile = (shader) => {
      ((shader.uniforms.tRock = { value: rockTex }),
        (shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            `#include <common>
varying vec2 vSide;`,
          )
          .replace(
            '#include <uv_vertex>',
            `#include <uv_vertex>
vSide = uv;`,
          )),
        (shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
varying vec2 vSide; uniform sampler2D tRock;
float sH(float x){ return fract(sin(x * 91.7) * 4375.85); }`,
          )
          .replace(
            '#include <map_fragment>',
            `
  float d = vSide.x;
  float y = vSide.y;
  vec3 rk = texture2D(tRock, vec2(d * 0.35, y * 0.35)).rgb;
  // estratos: tierra oscura arriba, capas de piedra y arcilla debajo
  float wav = sin(d * 0.9) * 0.08 + sin(d * 2.3 + 1.0) * 0.04;
  float t = y + wav;
  vec3 soil = vec3(0.30, 0.21, 0.14);
  vec3 clay = vec3(0.46, 0.33, 0.22);
  vec3 stone = vec3(0.42, 0.40, 0.37);
  vec3 c = mix(soil, clay, smoothstep(-0.5, -0.9, t));
  c = mix(c, stone, smoothstep(-1.3, -1.6, t) * (1.0 - smoothstep(-1.9, -2.1, t)));
  c = mix(c, clay * 0.8, smoothstep(-2.0, -2.3, t));
  c *= 0.75 + rk * 0.55;
  ${isCrypt ? 'c = mix(c, vec3(0.22, 0.21, 0.22) * (0.6 + rk), 0.7);' : ''}
  // labio de hierba en el borde superior
  ${isCrypt ? '' : 'c = mix(c, vec3(0.32, 0.36, 0.16) * (0.7 + rk * 0.5), smoothstep(-0.12, -0.02, y));'}
  diffuseColor.rgb *= c;`,
          )));
    }),
      (sideMat.customProgramCacheKey = () => `zocalo|${isCrypt}`));
    for (let j = 0; j < count; j++) {
      let topY = positions[j * 6 + 1];
      ((uvs[j * 4 + 1] = 0), (uvs[j * 4 + 3] = bottom - topY));
    }
    geo.getAttribute('uv').needsUpdate = !0;
    let side = new Mesh(geo, sideMat);
    ((side.receiveShadow = !0), (side.name = 'zocalo'), scene.add(side));
    let woodTex = cachedTexture(`${TEX_DIR}medieval_wood_diff.webp`, !0).clone();
    (woodTex.repeat.set(8, 0.4), (woodTex.needsUpdate = !0));
    let woodMat = new MeshStandardMaterial({ map: woodTex, color: 6964784, roughness: 0.55, metalness: 0 }),
      width = this.x1 - this.x0,
      depth = this.z1 - this.z0,
      woodBase = new Mesh(new BoxGeometry(width + 0.9, 0.9, depth + 0.9), woodMat);
    (woodBase.position.set((this.x0 + this.x1) / 2, bottom - 0.45, (this.z0 + this.z1) / 2),
      (woodBase.receiveShadow = !0),
      (woodBase.name = 'base'),
      scene.add(woodBase));
    let trimMat = new MeshStandardMaterial({ color: 13146698, roughness: 0.32, metalness: 0.85 }),
      trim = new Mesh(new BoxGeometry(width + 0.96, 0.06, depth + 0.96), trimMat);
    (trim.position.set(woodBase.position.x, bottom - 0.02, woodBase.position.z), scene.add(trim));
    let title = this.level.name || '',
      plate = null;
    if (title) {
      let canvas = document.createElement('canvas');
      ((canvas.width = 1024), (canvas.height = 128));
      let ctx = canvas.getContext('2d'),
        grad = ctx.createLinearGradient(0, 0, 0, 128);
      (grad.addColorStop(0, '#d9b36a'),
        grad.addColorStop(0.5, '#a9803c'),
        grad.addColorStop(1, '#7a5a26'),
        (ctx.fillStyle = grad),
        ctx.fillRect(0, 0, 1024, 128),
        (ctx.strokeStyle = '#5a3f18'),
        (ctx.lineWidth = 6),
        ctx.strokeRect(8, 8, 1008, 112),
        (ctx.fillStyle = '#3a2810'),
        (ctx.font = '600 64px Cinzel, "Alegreya SC", Georgia, serif'),
        (ctx.textAlign = 'center'),
        (ctx.textBaseline = 'middle'),
        ctx.fillText(title.toUpperCase(), 512, 68));
      let tex = new CanvasTexture(canvas);
      ((tex.colorSpace = SRGBColorSpace),
        (tex.anisotropy = 4),
        (plate = new Mesh(
          new PlaneGeometry(5.2, 0.62),
          new MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.75 }),
        )),
        plate.position.set((this.x0 + this.x1) / 2, bottom - 0.45, this.z1 + 0.455),
        scene.add(plate));
    }
    ((this.plinth = [side, woodBase, trim, ...(plate ? [plate] : [])]), (this.bottom = bottom));
  }
  /** Intersección de un rayo con el terreno (marcha de rayos y bisección), o null. */
  raycast(ray, maxDist = 400) {
    let origin = ray.origin,
      dir = ray.direction;
    if (dir.y >= -1e-4 && origin.y < -3) return null;
    let dist = 0,
      prevGap = origin.y - this.heightAt(origin.x, origin.z),
      step = 0.4;
    (origin.y > 4 && dir.y < 0 && (dist = Math.max(0, (origin.y - 4) / -dir.y)),
      (prevGap = origin.y + dir.y * dist - this.heightAt(origin.x + dir.x * dist, origin.z + dir.z * dist)));
    for (let k = 0; k < 600 && dist < maxDist; k++) {
      let next = dist + step,
        y = origin.y + dir.y * next,
        x = origin.x + dir.x * next,
        z = origin.z + dir.z * next,
        gap = y - this.heightAt(x, z);
      if (gap <= 0) {
        let lo = dist,
          hi = next;
        for (let j = 0; j < 10; j++) {
          let mid = (lo + hi) / 2;
          origin.y + dir.y * mid - this.heightAt(origin.x + dir.x * mid, origin.z + dir.z * mid) > 0
            ? (lo = mid)
            : (hi = mid);
        }
        let hit = (lo + hi) / 2;
        return new Vector3(origin.x + dir.x * hit, origin.y + dir.y * hit, origin.z + dir.z * hit);
      }
      ((prevGap = gap), (dist = next));
    }
    return null;
  }
  dispose() {
    (this.mesh?.geometry.dispose(), this.material?.dispose());
    for (let tex of this.masks || []) tex.dispose();
    this.cellTex?.dispose();
    for (let mesh of this.plinth || []) (mesh.geometry.dispose(), mesh.material.dispose());
  }
};

export { LAYER, Ground, worldTexture };
