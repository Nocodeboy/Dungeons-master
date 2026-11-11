// vfx/atlas.js
// Reconstruido de publicado/juego.js (módulo __esm «yi»). Nombres locales aún minificados.

import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace } from 'three';

function Sm(o) {
  let e = o;
  return () => {
    e = (e + 1831565813) | 0;
    let t = Math.imul(e ^ (e >>> 15), 1 | e);
    return ((t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t), ((t ^ (t >>> 14)) >>> 0) / 4294967296);
  };
}
function Io(o, e, t, a, n) {
  let s = o.createRadialGradient(e, t, 0, e, t, a);
  for (let [i, r] of n) s.addColorStop(i, `rgba(255,255,255,${r})`);
  ((o.fillStyle = s), o.beginPath(), o.arc(e, t, a, 0, Math.PI * 2), o.fill());
}
function km() {
  if (er) return er;
  let o = document.createElement('canvas');
  ((o.width = vi * Qi), (o.height = _c * Qi));
  let e = o.getContext('2d');
  for (let [t, a] of Object.entries(FRAME)) {
    let n = CI[t];
    n &&
      (e.save(),
      e.translate((a % vi) * Qi, Math.floor(a / vi) * Qi),
      e.beginPath(),
      e.rect(0, 0, Qi, Qi),
      e.clip(),
      e.translate(Qi * 0.04, Qi * 0.04),
      e.scale(0.92, 0.92),
      n(e),
      e.restore());
  }
  return (
    (er = new CanvasTexture(o)),
    (er.colorSpace = NoColorSpace),
    (er.generateMipmaps = !0),
    (er.minFilter = LinearMipmapLinearFilter),
    (er.magFilter = LinearFilter),
    er
  );
}
function DS() {
  if (Eu) return Eu;
  let o = 512,
    e = document.createElement('canvas');
  e.width = e.height = o;
  let t = e.getContext('2d'),
    a = o / 2;
  ((t.strokeStyle = '#fff'), (t.fillStyle = '#fff'), (t.shadowColor = '#fff'), (t.shadowBlur = 6));
  let n = (i, r) => {
    ((t.lineWidth = r), t.beginPath(), t.arc(a, a, i, 0, Math.PI * 2), t.stroke());
  };
  (n(244, 6), n(226, 2.5), n(150, 4), n(138, 2));
  let s = Sm(42);
  ((t.lineWidth = 4), (t.lineCap = 'round'));
  for (let i = 0; i < 24; i++) {
    let r = (i / 24) * Math.PI * 2;
    (t.save(),
      t.translate(a + Math.cos(r) * 188, a + Math.sin(r) * 188),
      t.rotate(r + Math.PI / 2),
      t.beginPath());
    let l = 2 + Math.floor(s() * 3),
      c = (s() - 0.5) * 18,
      d = -16;
    t.moveTo(c, d);
    for (let u = 0; u < l; u++) ((c = (s() - 0.5) * 22), (d += 32 / l), t.lineTo(c, d));
    (s() < 0.5 && (t.moveTo(-9, -4), t.lineTo(9, -4)), t.stroke(), t.restore());
  }
  ((t.lineWidth = 3), t.beginPath());
  for (let i = 0; i <= 7; i++) {
    let r = -Math.PI / 2 + (i * 6 * Math.PI) / 7,
      l = a + Math.cos(r) * 138,
      c = a + Math.sin(r) * 138;
    i === 0 ? t.moveTo(l, c) : t.lineTo(l, c);
  }
  return (
    t.stroke(),
    n(54, 3),
    (t.globalAlpha = 0.5),
    n(30, 2),
    (Eu = new CanvasTexture(e)),
    (Eu.colorSpace = NoColorSpace),
    Eu
  );
}
const vi = 8;
const _c = 5;
const Qi = 128;
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
const CI = {
  glow(o) {
    Io(o, 64, 64, 62, [
      [0, 1],
      [0.2, 0.75],
      [0.5, 0.25],
      [1, 0],
    ]);
  },
  spark(o) {
    Io(o, 64, 64, 62, [
      [0, 1],
      [0.12, 1],
      [0.3, 0.45],
      [0.6, 0.08],
      [1, 0],
    ]);
  },
  smoke(o) {
    let e = Sm(11);
    for (let t = 0; t < 26; t++) {
      let a = e() * Math.PI * 2,
        n = e() * 26;
      Io(o, 64 + Math.cos(a) * n, 64 + Math.sin(a) * n, 22 + e() * 18, [
        [0, 0.22],
        [0.6, 0.1],
        [1, 0],
      ]);
    }
  },
  flame(o) {
    let e = o.createRadialGradient(64, 92, 2, 64, 74, 70);
    (e.addColorStop(0, 'rgba(255,255,255,1)'),
      e.addColorStop(0.35, 'rgba(255,255,255,0.75)'),
      e.addColorStop(0.75, 'rgba(255,255,255,0.15)'),
      e.addColorStop(1, 'rgba(255,255,255,0)'),
      (o.fillStyle = e),
      o.beginPath(),
      o.moveTo(64, 6),
      o.bezierCurveTo(104, 52, 112, 96, 64, 122),
      o.bezierCurveTo(16, 96, 24, 52, 64, 6),
      o.fill());
  },
  ring(o) {
    ((o.strokeStyle = 'rgba(255,255,255,1)'),
      (o.lineWidth = 9),
      (o.shadowColor = '#fff'),
      (o.shadowBlur = 10),
      o.beginPath(),
      o.arc(64, 64, 48, 0, Math.PI * 2),
      o.stroke());
  },
  star(o) {
    (Io(o, 64, 64, 28, [
      [0, 1],
      [0.4, 0.5],
      [1, 0],
    ]),
      (o.fillStyle = '#fff'),
      o.translate(64, 64));
    for (let e = 0; e < 2; e++)
      (o.beginPath(),
        o.moveTo(-62, 0),
        o.quadraticCurveTo(0, -7, 62, 0),
        o.quadraticCurveTo(0, 7, -62, 0),
        o.fill(),
        o.rotate(Math.PI / 2));
  },
  flake(o) {
    ((o.strokeStyle = '#fff'), (o.lineWidth = 6), (o.lineCap = 'round'), o.translate(64, 64));
    for (let e = 0; e < 6; e++)
      (o.rotate(Math.PI / 3),
        o.beginPath(),
        o.moveTo(0, 0),
        o.lineTo(0, -50),
        o.moveTo(0, -30),
        o.lineTo(-12, -42),
        o.moveTo(0, -30),
        o.lineTo(12, -42),
        o.stroke());
  },
  shard(o) {
    let e = o.createLinearGradient(30, 10, 98, 118);
    (e.addColorStop(0, 'rgba(255,255,255,1)'),
      e.addColorStop(1, 'rgba(255,255,255,0.5)'),
      (o.fillStyle = e),
      o.beginPath(),
      o.moveTo(64, 6),
      o.lineTo(92, 70),
      o.lineTo(64, 122),
      o.lineTo(40, 64),
      o.closePath(),
      o.fill());
  },
  leaf(o) {
    ((o.fillStyle = '#fff'),
      o.beginPath(),
      o.moveTo(64, 10),
      o.bezierCurveTo(108, 40, 100, 100, 64, 118),
      o.bezierCurveTo(28, 100, 20, 40, 64, 10),
      o.fill(),
      (o.globalCompositeOperation = 'destination-out'),
      (o.strokeStyle = 'rgba(0,0,0,0.6)'),
      (o.lineWidth = 3),
      o.beginPath(),
      o.moveTo(64, 18),
      o.lineTo(64, 112),
      o.stroke());
  },
  drop(o) {
    (Io(o, 64, 78, 40, [
      [0, 1],
      [0.7, 0.9],
      [1, 0],
    ]),
      (o.fillStyle = 'rgba(255,255,255,0.9)'),
      o.beginPath(),
      o.moveTo(64, 14),
      o.quadraticCurveTo(84, 54, 92, 76),
      o.lineTo(36, 76),
      o.quadraticCurveTo(44, 54, 64, 14),
      o.fill());
  },
  bubble(o) {
    ((o.strokeStyle = 'rgba(255,255,255,0.9)'),
      (o.lineWidth = 6),
      o.beginPath(),
      o.arc(64, 64, 44, 0, Math.PI * 2),
      o.stroke(),
      Io(o, 48, 46, 16, [
        [0, 1],
        [1, 0],
      ]));
  },
  note(o) {
    ((o.fillStyle = '#fff'),
      o.beginPath(),
      o.ellipse(46, 92, 20, 14, -0.4, 0, Math.PI * 2),
      o.fill(),
      o.fillRect(60, 24, 8, 70),
      o.beginPath(),
      o.moveTo(68, 24),
      o.quadraticCurveTo(96, 36, 92, 64),
      o.quadraticCurveTo(88, 46, 68, 44),
      o.fill());
  },
  rune(o) {
    ((o.strokeStyle = '#fff'),
      (o.lineWidth = 8),
      (o.lineCap = 'round'),
      (o.lineJoin = 'round'),
      o.beginPath(),
      o.moveTo(44, 20),
      o.lineTo(44, 108),
      o.moveTo(44, 30),
      o.lineTo(86, 54),
      o.lineTo(44, 74),
      o.moveTo(64, 64),
      o.lineTo(90, 106),
      o.stroke());
  },
  spiral(o) {
    ((o.strokeStyle = '#fff'), (o.lineWidth = 7), (o.lineCap = 'round'), o.beginPath());
    for (let e = 0; e < Math.PI * 5; e += 0.1) {
      let t = 4 + e * 3.4,
        a = 64 + Math.cos(e) * t,
        n = 64 + Math.sin(e) * t;
      e === 0 ? o.moveTo(a, n) : o.lineTo(a, n);
    }
    o.stroke();
  },
  skull(o) {
    ((o.fillStyle = '#fff'),
      o.beginPath(),
      o.arc(64, 56, 38, 0, Math.PI * 2),
      o.fill(),
      o.fillRect(44, 80, 40, 26),
      (o.globalCompositeOperation = 'destination-out'),
      o.beginPath(),
      o.arc(50, 58, 11, 0, Math.PI * 2),
      o.arc(78, 58, 11, 0, Math.PI * 2),
      o.fill(),
      o.beginPath(),
      o.moveTo(64, 70),
      o.lineTo(58, 82),
      o.lineTo(70, 82),
      o.fill());
    for (let e of [52, 64, 76]) o.fillRect(e - 2, 92, 4, 14);
  },
  heart(o) {
    ((o.fillStyle = '#fff'),
      o.beginPath(),
      o.moveTo(64, 112),
      o.bezierCurveTo(10, 70, 18, 22, 64, 42),
      o.bezierCurveTo(110, 22, 118, 70, 64, 112),
      o.fill());
  },
  zz(o) {
    ((o.fillStyle = '#fff'),
      (o.font = 'bold 64px Georgia, serif'),
      (o.textAlign = 'center'),
      o.fillText('z', 48, 98),
      (o.font = 'bold 44px Georgia, serif'),
      o.fillText('z', 86, 58));
  },
  cross(o) {
    ((o.strokeStyle = '#fff'),
      (o.lineWidth = 7),
      o.beginPath(),
      o.arc(64, 64, 38, 0, Math.PI * 2),
      o.moveTo(64, 8),
      o.lineTo(64, 40),
      o.moveTo(64, 88),
      o.lineTo(64, 120),
      o.moveTo(8, 64),
      o.lineTo(40, 64),
      o.moveTo(88, 64),
      o.lineTo(120, 64),
      o.stroke(),
      Io(o, 64, 64, 8, [
        [0, 1],
        [1, 0.6],
      ]));
  },
  thorn(o) {
    ((o.fillStyle = '#fff'),
      o.beginPath(),
      o.moveTo(64, 4),
      o.lineTo(76, 120),
      o.lineTo(52, 120),
      o.closePath(),
      o.fill());
  },
  feather(o) {
    ((o.strokeStyle = '#fff'),
      (o.lineWidth = 4),
      o.beginPath(),
      o.moveTo(40, 116),
      o.quadraticCurveTo(70, 70, 90, 12),
      o.stroke(),
      (o.fillStyle = 'rgba(255,255,255,0.8)'),
      o.beginPath(),
      o.moveTo(90, 12),
      o.quadraticCurveTo(110, 60, 58, 96),
      o.quadraticCurveTo(50, 50, 90, 12),
      o.fill());
  },
  cloud(o) {
    let e = Sm(5);
    for (let t = 0; t < 14; t++)
      Io(o, 34 + e() * 60, 40 + e() * 48, 26 + e() * 14, [
        [0, 0.5],
        [0.6, 0.25],
        [1, 0],
      ]);
  },
  dust(o) {
    let e = Sm(9);
    for (let t = 0; t < 90; t++) {
      let a = e() * Math.PI * 2,
        n = Math.sqrt(e()) * 52;
      ((o.fillStyle = `rgba(255,255,255,${0.3 + e() * 0.6})`),
        o.beginPath(),
        o.arc(64 + Math.cos(a) * n, 64 + Math.sin(a) * n, 1.5 + e() * 3.5, 0, Math.PI * 2),
        o.fill());
    }
    Io(o, 64, 64, 60, [
      [0, 0.25],
      [1, 0],
    ]);
  },
  sigil(o) {
    ((o.strokeStyle = '#fff'),
      (o.lineWidth = 6),
      o.beginPath(),
      o.arc(64, 64, 52, 0, Math.PI * 2),
      o.stroke(),
      o.beginPath());
    for (let e = 0; e <= 5; e++) {
      let t = -Math.PI / 2 + (e * 4 * Math.PI) / 5,
        a = 64 + Math.cos(t) * 46,
        n = 64 + Math.sin(t) * 46;
      e === 0 ? o.moveTo(a, n) : o.lineTo(a, n);
    }
    (o.stroke(),
      Io(o, 64, 64, 14, [
        [0, 1],
        [1, 0],
      ]));
  },
  ankh(o) {
    ((o.strokeStyle = '#fff'),
      (o.lineWidth = 10),
      (o.lineCap = 'round'),
      o.beginPath(),
      o.ellipse(64, 36, 16, 22, 0, 0, Math.PI * 2),
      o.moveTo(64, 58),
      o.lineTo(64, 118),
      o.moveTo(34, 70),
      o.lineTo(94, 70),
      o.stroke());
  },
  swirl(o) {
    o.lineCap = 'round';
    for (let e = 0; e < 3; e++)
      ((o.strokeStyle = `rgba(255,255,255,${0.9 - e * 0.25})`),
        (o.lineWidth = 7 - e * 2),
        o.beginPath(),
        o.arc(64, 64, 44 - e * 13, 0.2 + e, Math.PI * 1.4 + e),
        o.stroke());
  },
  bolt(o) {
    ((o.fillStyle = '#fff'),
      o.beginPath(),
      o.moveTo(74, 6),
      o.lineTo(36, 70),
      o.lineTo(62, 70),
      o.lineTo(50, 122),
      o.lineTo(94, 52),
      o.lineTo(68, 52),
      o.closePath(),
      o.fill());
  },
  die(o) {
    ((o.strokeStyle = '#fff'),
      (o.fillStyle = 'rgba(255,255,255,0.25)'),
      (o.lineWidth = 6),
      (o.lineJoin = 'round'),
      o.beginPath());
    for (let e = 0; e < 6; e++) {
      let t = -Math.PI / 2 + (e * Math.PI) / 3,
        a = 64 + Math.cos(t) * 54,
        n = 64 + Math.sin(t) * 54;
      e === 0 ? o.moveTo(a, n) : o.lineTo(a, n);
    }
    (o.closePath(),
      o.fill(),
      o.stroke(),
      o.beginPath(),
      o.moveTo(64, 10),
      o.lineTo(28, 82),
      o.lineTo(100, 82),
      o.closePath(),
      o.stroke());
  },
  eye(o) {
    ((o.strokeStyle = '#fff'),
      (o.lineWidth = 7),
      o.beginPath(),
      o.moveTo(10, 64),
      o.quadraticCurveTo(64, 14, 118, 64),
      o.quadraticCurveTo(64, 114, 10, 64),
      o.stroke(),
      Io(o, 64, 64, 18, [
        [0, 1],
        [0.8, 1],
        [1, 0],
      ]),
      o.beginPath(),
      o.moveTo(20, 108),
      o.lineTo(108, 20),
      o.stroke());
  },
  chain(o) {
    ((o.strokeStyle = '#fff'),
      (o.lineWidth = 9),
      o.beginPath(),
      o.ellipse(46, 50, 30, 18, -0.7, 0, Math.PI * 2),
      o.stroke(),
      o.beginPath(),
      o.ellipse(82, 80, 30, 18, -0.7, 0, Math.PI * 2),
      o.stroke());
  },
  web(o) {
    ((o.strokeStyle = 'rgba(255,255,255,0.9)'), (o.lineWidth = 2.5), o.translate(64, 64));
    for (let e = 0; e < 8; e++) {
      let t = (e * Math.PI) / 4;
      (o.beginPath(), o.moveTo(0, 0), o.lineTo(Math.cos(t) * 62, Math.sin(t) * 62), o.stroke());
    }
    for (let e = 12; e < 62; e += 12) {
      o.beginPath();
      for (let t = 0; t <= 8; t++) {
        let a = (t * Math.PI) / 4,
          n = Math.cos(a) * e,
          s = Math.sin(a) * e;
        t === 0
          ? o.moveTo(n, s)
          : o.quadraticCurveTo(
              Math.cos(a - Math.PI / 8) * e * 0.8,
              Math.sin(a - Math.PI / 8) * e * 0.8,
              n,
              s,
            );
      }
      o.stroke();
    }
  },
  sun(o) {
    (Io(o, 64, 64, 30, [
      [0, 1],
      [0.6, 0.9],
      [1, 0],
    ]),
      (o.fillStyle = 'rgba(255,255,255,0.8)'),
      o.translate(64, 64));
    for (let e = 0; e < 12; e++)
      (o.rotate(Math.PI / 6), o.beginPath(), o.moveTo(-4, -30), o.lineTo(0, -62), o.lineTo(4, -30), o.fill());
  },
  moon(o) {
    ((o.fillStyle = '#fff'),
      o.beginPath(),
      o.arc(64, 64, 46, 0, Math.PI * 2),
      o.fill(),
      (o.globalCompositeOperation = 'destination-out'),
      o.beginPath(),
      o.arc(86, 50, 40, 0, Math.PI * 2),
      o.fill());
  },
  bell(o) {
    ((o.fillStyle = '#fff'),
      o.beginPath(),
      o.moveTo(64, 14),
      o.bezierCurveTo(30, 14, 34, 70, 18, 96),
      o.lineTo(110, 96),
      o.bezierCurveTo(94, 70, 98, 14, 64, 14),
      o.fill(),
      o.fillRect(58, 4, 12, 14),
      o.beginPath(),
      o.arc(64, 106, 11, 0, Math.PI * 2),
      o.fill(),
      (o.globalCompositeOperation = 'destination-out'),
      o.fillRect(24, 84, 80, 4));
  },
  fist(o) {
    o.fillStyle = '#fff';
    for (let e = 0; e < 4; e++)
      (o.beginPath(), o.ellipse(34 + e * 20, 44, 11, 15, 0, 0, Math.PI * 2), o.fill());
    (o.beginPath(),
      o.roundRect(22, 44, 84, 46, 14),
      o.fill(),
      o.beginPath(),
      o.ellipse(40, 84, 24, 10, -0.25, 0, Math.PI * 2),
      o.fill(),
      o.fillRect(44, 88, 50, 30),
      (o.globalCompositeOperation = 'destination-out'),
      (o.lineWidth = 3),
      (o.strokeStyle = '#000'));
    for (let e = 1; e < 4; e++)
      (o.beginPath(), o.moveTo(24 + e * 20, 34), o.lineTo(24 + e * 20, 60), o.stroke());
  },
  shield(o) {
    ((o.fillStyle = 'rgba(255,255,255,0.35)'),
      (o.strokeStyle = '#fff'),
      (o.lineWidth = 8),
      (o.lineJoin = 'round'),
      o.beginPath(),
      o.moveTo(64, 8),
      o.lineTo(112, 24),
      o.bezierCurveTo(112, 74, 94, 104, 64, 122),
      o.bezierCurveTo(34, 104, 16, 74, 16, 24),
      o.closePath(),
      o.fill(),
      o.stroke(),
      (o.lineWidth = 6),
      o.beginPath(),
      o.moveTo(64, 26),
      o.lineTo(64, 104),
      o.moveTo(32, 50),
      o.lineTo(96, 50),
      o.stroke());
  },
  sword(o) {
    ((o.fillStyle = '#fff'),
      o.translate(64, 64),
      o.rotate(-Math.PI / 4),
      o.beginPath(),
      o.moveTo(0, -62),
      o.lineTo(8, -48),
      o.lineTo(8, 22),
      o.lineTo(-8, 22),
      o.lineTo(-8, -48),
      o.closePath(),
      o.fill(),
      o.fillRect(-26, 22, 52, 8),
      o.fillRect(-5, 30, 10, 22),
      o.beginPath(),
      o.arc(0, 56, 7, 0, Math.PI * 2),
      o.fill());
  },
  paw(o) {
    ((o.fillStyle = '#fff'), o.beginPath(), o.ellipse(64, 86, 30, 26, 0, 0, Math.PI * 2), o.fill());
    for (let [e, t, a] of [
      [26, 52, 13],
      [48, 30, 14],
      [80, 30, 14],
      [102, 52, 13],
    ])
      (o.beginPath(), o.ellipse(e, t, a * 0.85, a, 0, 0, Math.PI * 2), o.fill());
  },
  hand(o) {
    ((o.fillStyle = '#fff'), o.beginPath(), o.roundRect(34, 58, 60, 60, 18), o.fill());
    for (let [e, t] of [
      [40, 52],
      [56, 62],
      [72, 60],
      [88, 46],
    ])
      (o.beginPath(), o.roundRect(e - 7, 58 - t + 10, 14, t + 10, 7), o.fill());
    (o.save(),
      o.translate(30, 84),
      o.rotate(-0.8),
      o.beginPath(),
      o.roundRect(-7, -34, 14, 40, 7),
      o.fill(),
      o.restore());
  },
  arrow(o) {
    ((o.strokeStyle = '#fff'),
      (o.fillStyle = '#fff'),
      (o.lineWidth = 6),
      (o.lineCap = 'round'),
      o.beginPath(),
      o.moveTo(18, 110),
      o.lineTo(98, 30),
      o.stroke(),
      o.beginPath(),
      o.moveTo(114, 14),
      o.lineTo(84, 26),
      o.lineTo(102, 44),
      o.closePath(),
      o.fill(),
      (o.lineWidth = 4));
    for (let e = 0; e < 3; e++) {
      let t = 22 + e * 9,
        a = 106 - e * 9;
      (o.beginPath(),
        o.moveTo(t, a),
        o.lineTo(t - 10, a - 18),
        o.moveTo(t, a),
        o.lineTo(t + 18, a + 10),
        o.stroke());
    }
  },
  wave(o) {
    o.lineCap = 'round';
    for (let e = 0; e < 3; e++)
      ((o.strokeStyle = `rgba(255,255,255,${1 - e * 0.28})`),
        (o.lineWidth = 8 - e * 2),
        o.beginPath(),
        o.arc(20, 64, 30 + e * 26, -0.9, 0.9),
        o.stroke());
  },
};
let er = null;
let Eu = null;

export { DS, FRAME, _c, km, vi };
