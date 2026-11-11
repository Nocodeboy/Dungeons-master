// vfx/atlas.js
// Atlas de partículas: dibuja en un canvas (8 × 5 celdas de 128 px) las 40 siluetas blancas que usan
// los efectos (brillo, chispa, humo, llama, runa, calavera…) y lo sube como CanvasTexture. También
// genera la textura del círculo mágico de 512 px. `FRAME` da el índice de celda de cada silueta.
// Lo usan particles.js y shaders.js (texturas) y casi todo vfx/ y combat/controller.js (`FRAME`).
// Reconstruido de publicado/juego.js (módulo __esm «yi»).

import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace } from 'three';

/** Generador pseudoaleatorio determinista (mulberry32): devuelve una función que da valores en [0, 1). */
function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state + 1831565813) | 0;
    let h = Math.imul(state ^ (state >>> 15), 1 | state);
    return ((h = (h + Math.imul(h ^ (h >>> 7), 61 | h)) ^ h), ((h ^ (h >>> 14)) >>> 0) / 4294967296);
  };
}
/** Rellena un círculo blanco con degradado radial; `stops` es una lista de pares [posición, alfa]. */
function fillRadialGlow(ctx, cx, cy, radius, stops) {
  let gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  for (let [offset, alpha] of stops) gradient.addColorStop(offset, `rgba(255,255,255,${alpha})`);
  ((ctx.fillStyle = gradient), ctx.beginPath(), ctx.arc(cx, cy, radius, 0, Math.PI * 2), ctx.fill());
}
/** Textura del atlas de partículas (se dibuja una sola vez y se reutiliza). */
function getParticleAtlas() {
  if (atlasTexture) return atlasTexture;
  let canvas = document.createElement('canvas');
  ((canvas.width = ATLAS_COLS * ATLAS_CELL), (canvas.height = ATLAS_ROWS * ATLAS_CELL));
  let ctx = canvas.getContext('2d');
  for (let [name, index] of Object.entries(FRAME)) {
    let draw = FRAME_DRAWERS[name];
    draw &&
      (ctx.save(),
      ctx.translate((index % ATLAS_COLS) * ATLAS_CELL, Math.floor(index / ATLAS_COLS) * ATLAS_CELL),
      ctx.beginPath(),
      ctx.rect(0, 0, ATLAS_CELL, ATLAS_CELL),
      ctx.clip(),
      ctx.translate(ATLAS_CELL * 0.04, ATLAS_CELL * 0.04),
      ctx.scale(0.92, 0.92),
      draw(ctx),
      ctx.restore());
  }
  return (
    (atlasTexture = new CanvasTexture(canvas)),
    (atlasTexture.colorSpace = NoColorSpace),
    (atlasTexture.generateMipmaps = !0),
    (atlasTexture.minFilter = LinearMipmapLinearFilter),
    (atlasTexture.magFilter = LinearFilter),
    atlasTexture
  );
}
/** Textura del círculo mágico (anillos, runas y estrella de siete puntas), cacheada. */
function getMagicCircleTexture() {
  if (magicCircleTexture) return magicCircleTexture;
  let size = 512,
    canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  let ctx = canvas.getContext('2d'),
    center = size / 2;
  ((ctx.strokeStyle = '#fff'), (ctx.fillStyle = '#fff'), (ctx.shadowColor = '#fff'), (ctx.shadowBlur = 6));
  let strokeCircle = (radius, width) => {
    ((ctx.lineWidth = width), ctx.beginPath(), ctx.arc(center, center, radius, 0, Math.PI * 2), ctx.stroke());
  };
  (strokeCircle(244, 6), strokeCircle(226, 2.5), strokeCircle(150, 4), strokeCircle(138, 2));
  let rand = seededRandom(42);
  ((ctx.lineWidth = 4), (ctx.lineCap = 'round'));
  for (let i = 0; i < 24; i++) {
    let angle = (i / 24) * Math.PI * 2;
    (ctx.save(),
      ctx.translate(center + Math.cos(angle) * 188, center + Math.sin(angle) * 188),
      ctx.rotate(angle + Math.PI / 2),
      ctx.beginPath());
    let segments = 2 + Math.floor(rand() * 3),
      x = (rand() - 0.5) * 18,
      y = -16;
    ctx.moveTo(x, y);
    for (let seg = 0; seg < segments; seg++)
      ((x = (rand() - 0.5) * 22), (y += 32 / segments), ctx.lineTo(x, y));
    (rand() < 0.5 && (ctx.moveTo(-9, -4), ctx.lineTo(9, -4)), ctx.stroke(), ctx.restore());
  }
  ((ctx.lineWidth = 3), ctx.beginPath());
  for (let i = 0; i <= 7; i++) {
    let angle = -Math.PI / 2 + (i * 6 * Math.PI) / 7,
      x = center + Math.cos(angle) * 138,
      y = center + Math.sin(angle) * 138;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  return (
    ctx.stroke(),
    strokeCircle(54, 3),
    (ctx.globalAlpha = 0.5),
    strokeCircle(30, 2),
    (magicCircleTexture = new CanvasTexture(canvas)),
    (magicCircleTexture.colorSpace = NoColorSpace),
    magicCircleTexture
  );
}
// Rejilla del atlas: columnas, filas y tamaño de celda en píxeles.
const ATLAS_COLS = 8;
const ATLAS_ROWS = 5;
const ATLAS_CELL = 128;
/** Índice de celda del atlas para cada silueta de partícula. */
const FRAME = {
  glow: 0,
  spark: 1,
  smoke: 2,
  flame: 3,
  ring: 4,
  star: 5,
  flake: 6,
  shard: 7,
  leaf: 8,
  drop: 9,
  bubble: 10,
  note: 11,
  rune: 12,
  spiral: 13,
  skull: 14,
  heart: 15,
  zz: 16,
  cross: 17,
  thorn: 18,
  feather: 19,
  cloud: 20,
  dust: 21,
  sigil: 22,
  ankh: 23,
  swirl: 24,
  bolt: 25,
  die: 26,
  eye: 27,
  chain: 28,
  web: 29,
  sun: 30,
  moon: 31,
  bell: 32,
  fist: 33,
  shield: 34,
  sword: 35,
  paw: 36,
  hand: 37,
  arrow: 38,
  wave: 39,
};
// Funciones de dibujo de cada silueta, en una celda de 128 × 128 (escalada al 92 % con margen).
const FRAME_DRAWERS = {
  glow(ctx) {
    fillRadialGlow(ctx, 64, 64, 62, [
      [0, 1],
      [0.2, 0.75],
      [0.5, 0.25],
      [1, 0],
    ]);
  },
  spark(ctx) {
    fillRadialGlow(ctx, 64, 64, 62, [
      [0, 1],
      [0.12, 1],
      [0.3, 0.45],
      [0.6, 0.08],
      [1, 0],
    ]);
  },
  smoke(ctx) {
    let rand = seededRandom(11);
    for (let i = 0; i < 26; i++) {
      let angle = rand() * Math.PI * 2,
        dist = rand() * 26;
      fillRadialGlow(ctx, 64 + Math.cos(angle) * dist, 64 + Math.sin(angle) * dist, 22 + rand() * 18, [
        [0, 0.22],
        [0.6, 0.1],
        [1, 0],
      ]);
    }
  },
  flame(ctx) {
    let gradient = ctx.createRadialGradient(64, 92, 2, 64, 74, 70);
    (gradient.addColorStop(0, 'rgba(255,255,255,1)'),
      gradient.addColorStop(0.35, 'rgba(255,255,255,0.75)'),
      gradient.addColorStop(0.75, 'rgba(255,255,255,0.15)'),
      gradient.addColorStop(1, 'rgba(255,255,255,0)'),
      (ctx.fillStyle = gradient),
      ctx.beginPath(),
      ctx.moveTo(64, 6),
      ctx.bezierCurveTo(104, 52, 112, 96, 64, 122),
      ctx.bezierCurveTo(16, 96, 24, 52, 64, 6),
      ctx.fill());
  },
  ring(ctx) {
    ((ctx.strokeStyle = 'rgba(255,255,255,1)'),
      (ctx.lineWidth = 9),
      (ctx.shadowColor = '#fff'),
      (ctx.shadowBlur = 10),
      ctx.beginPath(),
      ctx.arc(64, 64, 48, 0, Math.PI * 2),
      ctx.stroke());
  },
  star(ctx) {
    (fillRadialGlow(ctx, 64, 64, 28, [
      [0, 1],
      [0.4, 0.5],
      [1, 0],
    ]),
      (ctx.fillStyle = '#fff'),
      ctx.translate(64, 64));
    for (let i = 0; i < 2; i++)
      (ctx.beginPath(),
        ctx.moveTo(-62, 0),
        ctx.quadraticCurveTo(0, -7, 62, 0),
        ctx.quadraticCurveTo(0, 7, -62, 0),
        ctx.fill(),
        ctx.rotate(Math.PI / 2));
  },
  flake(ctx) {
    ((ctx.strokeStyle = '#fff'), (ctx.lineWidth = 6), (ctx.lineCap = 'round'), ctx.translate(64, 64));
    for (let i = 0; i < 6; i++)
      (ctx.rotate(Math.PI / 3),
        ctx.beginPath(),
        ctx.moveTo(0, 0),
        ctx.lineTo(0, -50),
        ctx.moveTo(0, -30),
        ctx.lineTo(-12, -42),
        ctx.moveTo(0, -30),
        ctx.lineTo(12, -42),
        ctx.stroke());
  },
  shard(ctx) {
    let gradient = ctx.createLinearGradient(30, 10, 98, 118);
    (gradient.addColorStop(0, 'rgba(255,255,255,1)'),
      gradient.addColorStop(1, 'rgba(255,255,255,0.5)'),
      (ctx.fillStyle = gradient),
      ctx.beginPath(),
      ctx.moveTo(64, 6),
      ctx.lineTo(92, 70),
      ctx.lineTo(64, 122),
      ctx.lineTo(40, 64),
      ctx.closePath(),
      ctx.fill());
  },
  leaf(ctx) {
    ((ctx.fillStyle = '#fff'),
      ctx.beginPath(),
      ctx.moveTo(64, 10),
      ctx.bezierCurveTo(108, 40, 100, 100, 64, 118),
      ctx.bezierCurveTo(28, 100, 20, 40, 64, 10),
      ctx.fill(),
      (ctx.globalCompositeOperation = 'destination-out'),
      (ctx.strokeStyle = 'rgba(0,0,0,0.6)'),
      (ctx.lineWidth = 3),
      ctx.beginPath(),
      ctx.moveTo(64, 18),
      ctx.lineTo(64, 112),
      ctx.stroke());
  },
  drop(ctx) {
    (fillRadialGlow(ctx, 64, 78, 40, [
      [0, 1],
      [0.7, 0.9],
      [1, 0],
    ]),
      (ctx.fillStyle = 'rgba(255,255,255,0.9)'),
      ctx.beginPath(),
      ctx.moveTo(64, 14),
      ctx.quadraticCurveTo(84, 54, 92, 76),
      ctx.lineTo(36, 76),
      ctx.quadraticCurveTo(44, 54, 64, 14),
      ctx.fill());
  },
  bubble(ctx) {
    ((ctx.strokeStyle = 'rgba(255,255,255,0.9)'),
      (ctx.lineWidth = 6),
      ctx.beginPath(),
      ctx.arc(64, 64, 44, 0, Math.PI * 2),
      ctx.stroke(),
      fillRadialGlow(ctx, 48, 46, 16, [
        [0, 1],
        [1, 0],
      ]));
  },
  note(ctx) {
    ((ctx.fillStyle = '#fff'),
      ctx.beginPath(),
      ctx.ellipse(46, 92, 20, 14, -0.4, 0, Math.PI * 2),
      ctx.fill(),
      ctx.fillRect(60, 24, 8, 70),
      ctx.beginPath(),
      ctx.moveTo(68, 24),
      ctx.quadraticCurveTo(96, 36, 92, 64),
      ctx.quadraticCurveTo(88, 46, 68, 44),
      ctx.fill());
  },
  rune(ctx) {
    ((ctx.strokeStyle = '#fff'),
      (ctx.lineWidth = 8),
      (ctx.lineCap = 'round'),
      (ctx.lineJoin = 'round'),
      ctx.beginPath(),
      ctx.moveTo(44, 20),
      ctx.lineTo(44, 108),
      ctx.moveTo(44, 30),
      ctx.lineTo(86, 54),
      ctx.lineTo(44, 74),
      ctx.moveTo(64, 64),
      ctx.lineTo(90, 106),
      ctx.stroke());
  },
  spiral(ctx) {
    ((ctx.strokeStyle = '#fff'), (ctx.lineWidth = 7), (ctx.lineCap = 'round'), ctx.beginPath());
    for (let angle = 0; angle < Math.PI * 5; angle += 0.1) {
      let radius = 4 + angle * 3.4,
        x = 64 + Math.cos(angle) * radius,
        y = 64 + Math.sin(angle) * radius;
      angle === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  },
  skull(ctx) {
    ((ctx.fillStyle = '#fff'),
      ctx.beginPath(),
      ctx.arc(64, 56, 38, 0, Math.PI * 2),
      ctx.fill(),
      ctx.fillRect(44, 80, 40, 26),
      (ctx.globalCompositeOperation = 'destination-out'),
      ctx.beginPath(),
      ctx.arc(50, 58, 11, 0, Math.PI * 2),
      ctx.arc(78, 58, 11, 0, Math.PI * 2),
      ctx.fill(),
      ctx.beginPath(),
      ctx.moveTo(64, 70),
      ctx.lineTo(58, 82),
      ctx.lineTo(70, 82),
      ctx.fill());
    for (let x of [52, 64, 76]) ctx.fillRect(x - 2, 92, 4, 14);
  },
  heart(ctx) {
    ((ctx.fillStyle = '#fff'),
      ctx.beginPath(),
      ctx.moveTo(64, 112),
      ctx.bezierCurveTo(10, 70, 18, 22, 64, 42),
      ctx.bezierCurveTo(110, 22, 118, 70, 64, 112),
      ctx.fill());
  },
  zz(ctx) {
    ((ctx.fillStyle = '#fff'),
      (ctx.font = 'bold 64px Georgia, serif'),
      (ctx.textAlign = 'center'),
      ctx.fillText('z', 48, 98),
      (ctx.font = 'bold 44px Georgia, serif'),
      ctx.fillText('z', 86, 58));
  },
  cross(ctx) {
    ((ctx.strokeStyle = '#fff'),
      (ctx.lineWidth = 7),
      ctx.beginPath(),
      ctx.arc(64, 64, 38, 0, Math.PI * 2),
      ctx.moveTo(64, 8),
      ctx.lineTo(64, 40),
      ctx.moveTo(64, 88),
      ctx.lineTo(64, 120),
      ctx.moveTo(8, 64),
      ctx.lineTo(40, 64),
      ctx.moveTo(88, 64),
      ctx.lineTo(120, 64),
      ctx.stroke(),
      fillRadialGlow(ctx, 64, 64, 8, [
        [0, 1],
        [1, 0.6],
      ]));
  },
  thorn(ctx) {
    ((ctx.fillStyle = '#fff'),
      ctx.beginPath(),
      ctx.moveTo(64, 4),
      ctx.lineTo(76, 120),
      ctx.lineTo(52, 120),
      ctx.closePath(),
      ctx.fill());
  },
  feather(ctx) {
    ((ctx.strokeStyle = '#fff'),
      (ctx.lineWidth = 4),
      ctx.beginPath(),
      ctx.moveTo(40, 116),
      ctx.quadraticCurveTo(70, 70, 90, 12),
      ctx.stroke(),
      (ctx.fillStyle = 'rgba(255,255,255,0.8)'),
      ctx.beginPath(),
      ctx.moveTo(90, 12),
      ctx.quadraticCurveTo(110, 60, 58, 96),
      ctx.quadraticCurveTo(50, 50, 90, 12),
      ctx.fill());
  },
  cloud(ctx) {
    let rand = seededRandom(5);
    for (let i = 0; i < 14; i++)
      fillRadialGlow(ctx, 34 + rand() * 60, 40 + rand() * 48, 26 + rand() * 14, [
        [0, 0.5],
        [0.6, 0.25],
        [1, 0],
      ]);
  },
  dust(ctx) {
    let rand = seededRandom(9);
    for (let i = 0; i < 90; i++) {
      let angle = rand() * Math.PI * 2,
        dist = Math.sqrt(rand()) * 52;
      ((ctx.fillStyle = `rgba(255,255,255,${0.3 + rand() * 0.6})`),
        ctx.beginPath(),
        ctx.arc(64 + Math.cos(angle) * dist, 64 + Math.sin(angle) * dist, 1.5 + rand() * 3.5, 0, Math.PI * 2),
        ctx.fill());
    }
    fillRadialGlow(ctx, 64, 64, 60, [
      [0, 0.25],
      [1, 0],
    ]);
  },
  sigil(ctx) {
    ((ctx.strokeStyle = '#fff'),
      (ctx.lineWidth = 6),
      ctx.beginPath(),
      ctx.arc(64, 64, 52, 0, Math.PI * 2),
      ctx.stroke(),
      ctx.beginPath());
    for (let i = 0; i <= 5; i++) {
      let angle = -Math.PI / 2 + (i * 4 * Math.PI) / 5,
        x = 64 + Math.cos(angle) * 46,
        y = 64 + Math.sin(angle) * 46;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    (ctx.stroke(),
      fillRadialGlow(ctx, 64, 64, 14, [
        [0, 1],
        [1, 0],
      ]));
  },
  ankh(ctx) {
    ((ctx.strokeStyle = '#fff'),
      (ctx.lineWidth = 10),
      (ctx.lineCap = 'round'),
      ctx.beginPath(),
      ctx.ellipse(64, 36, 16, 22, 0, 0, Math.PI * 2),
      ctx.moveTo(64, 58),
      ctx.lineTo(64, 118),
      ctx.moveTo(34, 70),
      ctx.lineTo(94, 70),
      ctx.stroke());
  },
  swirl(ctx) {
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++)
      ((ctx.strokeStyle = `rgba(255,255,255,${0.9 - i * 0.25})`),
        (ctx.lineWidth = 7 - i * 2),
        ctx.beginPath(),
        ctx.arc(64, 64, 44 - i * 13, 0.2 + i, Math.PI * 1.4 + i),
        ctx.stroke());
  },
  bolt(ctx) {
    ((ctx.fillStyle = '#fff'),
      ctx.beginPath(),
      ctx.moveTo(74, 6),
      ctx.lineTo(36, 70),
      ctx.lineTo(62, 70),
      ctx.lineTo(50, 122),
      ctx.lineTo(94, 52),
      ctx.lineTo(68, 52),
      ctx.closePath(),
      ctx.fill());
  },
  die(ctx) {
    ((ctx.strokeStyle = '#fff'),
      (ctx.fillStyle = 'rgba(255,255,255,0.25)'),
      (ctx.lineWidth = 6),
      (ctx.lineJoin = 'round'),
      ctx.beginPath());
    for (let i = 0; i < 6; i++) {
      let angle = -Math.PI / 2 + (i * Math.PI) / 3,
        x = 64 + Math.cos(angle) * 54,
        y = 64 + Math.sin(angle) * 54;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    (ctx.closePath(),
      ctx.fill(),
      ctx.stroke(),
      ctx.beginPath(),
      ctx.moveTo(64, 10),
      ctx.lineTo(28, 82),
      ctx.lineTo(100, 82),
      ctx.closePath(),
      ctx.stroke());
  },
  eye(ctx) {
    ((ctx.strokeStyle = '#fff'),
      (ctx.lineWidth = 7),
      ctx.beginPath(),
      ctx.moveTo(10, 64),
      ctx.quadraticCurveTo(64, 14, 118, 64),
      ctx.quadraticCurveTo(64, 114, 10, 64),
      ctx.stroke(),
      fillRadialGlow(ctx, 64, 64, 18, [
        [0, 1],
        [0.8, 1],
        [1, 0],
      ]),
      ctx.beginPath(),
      ctx.moveTo(20, 108),
      ctx.lineTo(108, 20),
      ctx.stroke());
  },
  chain(ctx) {
    ((ctx.strokeStyle = '#fff'),
      (ctx.lineWidth = 9),
      ctx.beginPath(),
      ctx.ellipse(46, 50, 30, 18, -0.7, 0, Math.PI * 2),
      ctx.stroke(),
      ctx.beginPath(),
      ctx.ellipse(82, 80, 30, 18, -0.7, 0, Math.PI * 2),
      ctx.stroke());
  },
  web(ctx) {
    ((ctx.strokeStyle = 'rgba(255,255,255,0.9)'), (ctx.lineWidth = 2.5), ctx.translate(64, 64));
    for (let i = 0; i < 8; i++) {
      let angle = (i * Math.PI) / 4;
      (ctx.beginPath(),
        ctx.moveTo(0, 0),
        ctx.lineTo(Math.cos(angle) * 62, Math.sin(angle) * 62),
        ctx.stroke());
    }
    for (let radius = 12; radius < 62; radius += 12) {
      ctx.beginPath();
      for (let k = 0; k <= 8; k++) {
        let angle = (k * Math.PI) / 4,
          x = Math.cos(angle) * radius,
          y = Math.sin(angle) * radius;
        k === 0
          ? ctx.moveTo(x, y)
          : ctx.quadraticCurveTo(
              Math.cos(angle - Math.PI / 8) * radius * 0.8,
              Math.sin(angle - Math.PI / 8) * radius * 0.8,
              x,
              y,
            );
      }
      ctx.stroke();
    }
  },
  sun(ctx) {
    (fillRadialGlow(ctx, 64, 64, 30, [
      [0, 1],
      [0.6, 0.9],
      [1, 0],
    ]),
      (ctx.fillStyle = 'rgba(255,255,255,0.8)'),
      ctx.translate(64, 64));
    for (let i = 0; i < 12; i++)
      (ctx.rotate(Math.PI / 6),
        ctx.beginPath(),
        ctx.moveTo(-4, -30),
        ctx.lineTo(0, -62),
        ctx.lineTo(4, -30),
        ctx.fill());
  },
  moon(ctx) {
    ((ctx.fillStyle = '#fff'),
      ctx.beginPath(),
      ctx.arc(64, 64, 46, 0, Math.PI * 2),
      ctx.fill(),
      (ctx.globalCompositeOperation = 'destination-out'),
      ctx.beginPath(),
      ctx.arc(86, 50, 40, 0, Math.PI * 2),
      ctx.fill());
  },
  bell(ctx) {
    ((ctx.fillStyle = '#fff'),
      ctx.beginPath(),
      ctx.moveTo(64, 14),
      ctx.bezierCurveTo(30, 14, 34, 70, 18, 96),
      ctx.lineTo(110, 96),
      ctx.bezierCurveTo(94, 70, 98, 14, 64, 14),
      ctx.fill(),
      ctx.fillRect(58, 4, 12, 14),
      ctx.beginPath(),
      ctx.arc(64, 106, 11, 0, Math.PI * 2),
      ctx.fill(),
      (ctx.globalCompositeOperation = 'destination-out'),
      ctx.fillRect(24, 84, 80, 4));
  },
  fist(ctx) {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 4; i++)
      (ctx.beginPath(), ctx.ellipse(34 + i * 20, 44, 11, 15, 0, 0, Math.PI * 2), ctx.fill());
    (ctx.beginPath(),
      ctx.roundRect(22, 44, 84, 46, 14),
      ctx.fill(),
      ctx.beginPath(),
      ctx.ellipse(40, 84, 24, 10, -0.25, 0, Math.PI * 2),
      ctx.fill(),
      ctx.fillRect(44, 88, 50, 30),
      (ctx.globalCompositeOperation = 'destination-out'),
      (ctx.lineWidth = 3),
      (ctx.strokeStyle = '#000'));
    for (let i = 1; i < 4; i++)
      (ctx.beginPath(), ctx.moveTo(24 + i * 20, 34), ctx.lineTo(24 + i * 20, 60), ctx.stroke());
  },
  shield(ctx) {
    ((ctx.fillStyle = 'rgba(255,255,255,0.35)'),
      (ctx.strokeStyle = '#fff'),
      (ctx.lineWidth = 8),
      (ctx.lineJoin = 'round'),
      ctx.beginPath(),
      ctx.moveTo(64, 8),
      ctx.lineTo(112, 24),
      ctx.bezierCurveTo(112, 74, 94, 104, 64, 122),
      ctx.bezierCurveTo(34, 104, 16, 74, 16, 24),
      ctx.closePath(),
      ctx.fill(),
      ctx.stroke(),
      (ctx.lineWidth = 6),
      ctx.beginPath(),
      ctx.moveTo(64, 26),
      ctx.lineTo(64, 104),
      ctx.moveTo(32, 50),
      ctx.lineTo(96, 50),
      ctx.stroke());
  },
  sword(ctx) {
    ((ctx.fillStyle = '#fff'),
      ctx.translate(64, 64),
      ctx.rotate(-Math.PI / 4),
      ctx.beginPath(),
      ctx.moveTo(0, -62),
      ctx.lineTo(8, -48),
      ctx.lineTo(8, 22),
      ctx.lineTo(-8, 22),
      ctx.lineTo(-8, -48),
      ctx.closePath(),
      ctx.fill(),
      ctx.fillRect(-26, 22, 52, 8),
      ctx.fillRect(-5, 30, 10, 22),
      ctx.beginPath(),
      ctx.arc(0, 56, 7, 0, Math.PI * 2),
      ctx.fill());
  },
  paw(ctx) {
    ((ctx.fillStyle = '#fff'), ctx.beginPath(), ctx.ellipse(64, 86, 30, 26, 0, 0, Math.PI * 2), ctx.fill());
    for (let [x, y, radius] of [
      [26, 52, 13],
      [48, 30, 14],
      [80, 30, 14],
      [102, 52, 13],
    ])
      (ctx.beginPath(), ctx.ellipse(x, y, radius * 0.85, radius, 0, 0, Math.PI * 2), ctx.fill());
  },
  hand(ctx) {
    ((ctx.fillStyle = '#fff'), ctx.beginPath(), ctx.roundRect(34, 58, 60, 60, 18), ctx.fill());
    for (let [x, height] of [
      [40, 52],
      [56, 62],
      [72, 60],
      [88, 46],
    ])
      (ctx.beginPath(), ctx.roundRect(x - 7, 58 - height + 10, 14, height + 10, 7), ctx.fill());
    (ctx.save(),
      ctx.translate(30, 84),
      ctx.rotate(-0.8),
      ctx.beginPath(),
      ctx.roundRect(-7, -34, 14, 40, 7),
      ctx.fill(),
      ctx.restore());
  },
  arrow(ctx) {
    ((ctx.strokeStyle = '#fff'),
      (ctx.fillStyle = '#fff'),
      (ctx.lineWidth = 6),
      (ctx.lineCap = 'round'),
      ctx.beginPath(),
      ctx.moveTo(18, 110),
      ctx.lineTo(98, 30),
      ctx.stroke(),
      ctx.beginPath(),
      ctx.moveTo(114, 14),
      ctx.lineTo(84, 26),
      ctx.lineTo(102, 44),
      ctx.closePath(),
      ctx.fill(),
      (ctx.lineWidth = 4));
    for (let i = 0; i < 3; i++) {
      let x = 22 + i * 9,
        y = 106 - i * 9;
      (ctx.beginPath(),
        ctx.moveTo(x, y),
        ctx.lineTo(x - 10, y - 18),
        ctx.moveTo(x, y),
        ctx.lineTo(x + 18, y + 10),
        ctx.stroke());
    }
  },
  wave(ctx) {
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++)
      ((ctx.strokeStyle = `rgba(255,255,255,${1 - i * 0.28})`),
        (ctx.lineWidth = 8 - i * 2),
        ctx.beginPath(),
        ctx.arc(20, 64, 30 + i * 26, -0.9, 0.9),
        ctx.stroke());
  },
};
// Texturas cacheadas.
let atlasTexture = null;
let magicCircleTexture = null;

export { getMagicCircleTexture, FRAME, ATLAS_ROWS, getParticleAtlas, ATLAS_COLS };
