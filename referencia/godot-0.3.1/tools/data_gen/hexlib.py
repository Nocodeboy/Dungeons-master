"""Utilidades de cuadrícula hexagonal (pointy-top, odd-r) para generar niveles.
Mismo sistema que scripts/core/battle_map.gd."""
import math

ODDR_EVEN = [(1, 0), (0, -1), (-1, -1), (-1, 0), (-1, 1), (0, 1)]
ODDR_ODD = [(1, 0), (1, -1), (0, -1), (-1, 0), (0, 1), (1, 1)]
ROW_H = 0.8660254


def to_cube(c):
    x, y = c
    q = x - (y - (y & 1)) // 2
    r = y
    return (q, r, -q - r)


def from_cube(cu):
    q, r, _ = cu
    return (q + (r - (r & 1)) // 2, r)


def dist(a, b):
    ca, cb = to_cube(a), to_cube(b)
    return max(abs(ca[0] - cb[0]), abs(ca[1] - cb[1]), abs(ca[2] - cb[2]))


def neighbors(c):
    x, y = c
    dirs = ODDR_ODD if y & 1 else ODDR_EVEN
    return [(x + dx, y + dy) for dx, dy in dirs]


def center(c):
    x, y = c
    return (x + 0.5 + 0.5 * (y & 1), y * ROW_H + 0.5)


def cube_round(q, r, s):
    rq, rr, rs = round(q), round(r), round(s)
    dq, dr, ds = abs(rq - q), abs(rr - r), abs(rs - s)
    if dq > dr and dq > ds:
        rq = -rr - rs
    elif dr > ds:
        rr = -rq - rs
    else:
        rs = -rq - rr
    return (int(rq), int(rr), int(rs))


def line(a, b):
    n = dist(a, b)
    ca, cb = to_cube(a), to_cube(b)
    out = []
    for i in range(n + 1):
        t = i / n if n else 0
        q = ca[0] + (cb[0] - ca[0]) * t + 1e-6
        r = ca[1] + (cb[1] - ca[1]) * t + 1e-6
        s = ca[2] + (cb[2] - ca[2]) * t - 2e-6
        out.append(from_cube(cube_round(q, r, s)))
    return out


def polyline(points):
    out = []
    for i in range(len(points) - 1):
        for c in line(points[i], points[i + 1]):
            if not out or out[-1] != c:
                out.append(c)
    return out


def disc(c, r):
    cx = to_cube(c)
    out = []
    for dq in range(-r, r + 1):
        for dr in range(max(-r, -dq - r), min(r, -dq + r) + 1):
            out.append(from_cube((cx[0] + dq, cx[1] + dr, -cx[0] - dq - cx[1] - dr)))
    return out


def ring(c, r):
    return [x for x in disc(c, r) if dist(c, x) == r]


def thick(cells, w):
    """Engorda una línea: todas las casillas a distancia < w."""
    out = set()
    for c in cells:
        for d in disc(c, w - 1):
            out.add(d)
    return out


class Grid:
    def __init__(self, w, h, fill=","):
        self.w, self.h = w, h
        self.rows = [[fill] * w for _ in range(h)]

    def inb(self, c):
        return 0 <= c[0] < self.w and 0 <= c[1] < self.h

    def get(self, c):
        return self.rows[c[1]][c[0]] if self.inb(c) else " "

    def set(self, c, ch, only=None):
        if self.inb(c) and (only is None or self.rows[c[1]][c[0]] in only):
            self.rows[c[1]][c[0]] = ch

    def paint(self, cells, ch, only=None):
        for c in cells:
            self.set(c, ch, only)

    def strings(self):
        return ["".join(r) for r in self.rows]
