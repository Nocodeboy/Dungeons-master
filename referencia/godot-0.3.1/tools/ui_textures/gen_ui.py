#!/usr/bin/env python3
"""Genera las texturas de la interfaz «piedra y bronce» (estilo BG2) en assets/ui/.

Cada textura es un 9-slice: el centro es una baldosa de piedra sin costuras (se repite con
TILE_FIT en Godot) y los bordes llevan el bisel, la moldura de bronce y los remaches.
Uso: python3 tools/ui_textures/gen_ui.py
"""
import os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'ui')
SS = 4  # supermuestreo de los adornos

def norm(a):
    a = a - a.min()
    return a / (a.max() + 1e-9)

def seamless_noise(size, sigma, rng):
    return norm(ndimage.gaussian_filter(rng.random(size), sigma, mode='wrap'))

def granite_tile(t, seed, base, dark, light, speck=0.005):
    """Baldosa de granito sin costuras (t x t) como array float RGB 0..1."""
    rng = np.random.default_rng(seed)
    n = (seamless_noise((t, t), 9, rng) * 0.45 + seamless_noise((t, t), 3.5, rng) * 0.35
         + seamless_noise((t, t), 1.2, rng) * 0.20)
    n = norm(n)
    base = np.array(base) / 255.0
    dark = np.array(dark) / 255.0
    light = np.array(light) / 255.0
    col = dark[None, None, :] * (1 - n[..., None]) + base[None, None, :] * n[..., None]
    sp = rng.random((t, t))
    col = np.where((sp > 1 - speck)[..., None], light[None, None, :], col)
    col = np.where((sp < speck * 0.7)[..., None], dark[None, None, :] * 0.7, col)
    # vetas finas
    v = seamless_noise((t, t), 6, rng)
    vein = np.clip(1 - np.abs(v - 0.5) * 40, 0, 1) * 0.12
    col = col * (1 - vein[..., None]) + light[None, None, :] * vein[..., None]
    return col

def wrap_field(tile, margin):
    """Rodea la baldosa con sus propios bordes envueltos: el centro queda exacto."""
    return np.pad(tile, ((margin, margin), (margin, margin), (0, 0)), mode='wrap')

def edge_dist(h, w):
    y, x = np.mgrid[0:h, 0:w]
    top = y.astype(float)
    left = x.astype(float)
    bottom = (h - 1 - y).astype(float)
    right = (w - 1 - x).astype(float)
    d = np.minimum(np.minimum(top, bottom), np.minimum(left, right))
    # +1 en bordes de arriba/izquierda (luz), -1 abajo/derecha (sombra)
    lit = np.where(np.minimum(top, left) <= np.minimum(bottom, right), 1.0, -1.0)
    return d, lit

def bronze(t, lit, bright=1.0):
    """Perfil de moldura de bronce; t 0..1 a lo ancho de la banda."""
    dark = np.array([74, 50, 24]) / 255.0
    mid = np.array([150, 108, 54]) / 255.0
    hi = np.array([236, 196, 120]) / 255.0
    prof = 0.5 + 0.5 * np.cos((t - 0.32) * np.pi * 1.5)
    prof = np.clip(prof, 0, 1)
    c = dark[None, :] * (1 - prof[:, None]) + mid[None, :] * prof[:, None]
    spec = np.clip(1 - np.abs(t - 0.3) * 6, 0, 1) ** 2
    c = c * (1 - spec[:, None] * 0.7) + hi[None, :] * spec[:, None] * 0.7
    c = c * (1.12 if lit > 0 else 0.78) * bright
    return np.clip(c, 0, 1)

def apply_band(img, d, lit, start, width, bright=1.0):
    h, w, _ = img.shape
    mask = (d >= start) & (d < start + width)
    t = (d[mask] - start) / max(1.0, width - 1)
    out = img.copy()
    l = lit[mask]
    col_lit = bronze(t, 1, bright)
    col_dim = bronze(t, -1, bright)
    out[mask] = np.where(l[:, None] > 0, col_lit, col_dim)
    return out

def shade(img, d, lit, start, width, amount):
    """Bisel: aclara los bordes con luz y oscurece los de sombra."""
    mask = (d >= start) & (d < start + width)
    f = 1 - (d[mask] - start) / width
    k = np.where(lit[mask] > 0, 1 + amount * f, 1 - amount * f * 1.2)
    out = img.copy()
    out[mask] = np.clip(out[mask] * k[:, None], 0, 1)
    return out

def inner_shadow(img, d, start, width, amount):
    mask = (d >= start) & (d < start + width)
    f = 1 - (d[mask] - start) / width
    out = img.copy()
    out[mask] = out[mask] * (1 - amount * f[:, None] ** 1.5)
    return out

def line(img, d, at, color, alpha=1.0, width=1):
    mask = (d >= at) & (d < at + width)
    out = img.copy()
    c = np.array(color) / 255.0
    out[mask] = out[mask] * (1 - alpha) + c[None, :] * alpha
    return out

def overlay_rivets(img, positions, r, plate=0):
    """Remaches (y placas) dibujados con supermuestreo."""
    h, w, _ = img.shape
    ov = Image.new('RGBA', (w * SS, h * SS), (0, 0, 0, 0))
    dr = ImageDraw.Draw(ov)
    for (cx, cy) in positions:
        if plate > 0:
            p = plate * SS
            x0, y0 = cx * SS - p, cy * SS - p
            dr.rectangle([x0, y0, x0 + 2 * p, y0 + 2 * p], fill=(118, 84, 42, 255), outline=(52, 34, 16, 255), width=SS)
            dr.line([x0 + SS, y0 + SS, x0 + 2 * p - SS, y0 + SS], fill=(214, 172, 98, 255), width=SS)
            dr.line([x0 + SS, y0 + SS, x0 + SS, y0 + 2 * p - SS], fill=(214, 172, 98, 255), width=SS)
        R = r * SS
        dr.ellipse([cx * SS - R, cy * SS - R, cx * SS + R, cy * SS + R], fill=(96, 66, 30, 255), outline=(40, 26, 12, 255), width=max(1, SS // 2))
        R2 = R * 0.55
        dr.ellipse([cx * SS - R2 - R * 0.25, cy * SS - R2 - R * 0.25, cx * SS + R2 - R * 0.25, cy * SS + R2 - R * 0.25], fill=(232, 196, 124, 255))
    ov = ov.resize((w, h), Image.LANCZOS)
    a = np.asarray(ov).astype(float) / 255.0
    return img * (1 - a[..., 3:4]) + a[..., :3] * a[..., 3:4]

def save(img, name):
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), 'RGB')
    im.save(os.path.join(OUT, name))
    print('ok', name, im.size)

STONE = dict(base=(84, 78, 72), dark=(44, 40, 37), light=(132, 124, 114))
STONE_DARK = dict(base=(58, 53, 49), dark=(30, 27, 25), light=(98, 90, 82))

def panel():
    t, m = 96, 28
    f = wrap_field(granite_tile(t, 11, **STONE_DARK), m)
    h, w, _ = f.shape
    d, lit = edge_dist(h, w)
    f = line(f, d, 0, (14, 10, 6), 1.0, 2)
    f = apply_band(f, d, lit, 2, 8)
    f = line(f, d, 10, (22, 16, 10), 1.0, 1)
    f = inner_shadow(f, d, 11, 12, 0.55)
    f = line(f, d, 15, (120, 88, 44), 0.55, 1)
    c = 7
    f = overlay_rivets(f, [(c, c), (w - 1 - c, c), (c, h - 1 - c), (w - 1 - c, h - 1 - c)], 3.2, plate=7)
    save(f, 'panel.png')

def glass():
    """Marco de bronce con fondo de piedra semitransparente (HUD sobre el tablero)."""
    t, m = 96, 22
    f = wrap_field(granite_tile(t, 13, **STONE_DARK) * 0.7, m)
    h, w, _ = f.shape
    d, lit = edge_dist(h, w)
    f = line(f, d, 0, (14, 10, 6), 1.0, 1)
    f = apply_band(f, d, lit, 1, 5)
    f = line(f, d, 6, (22, 16, 10), 1.0, 1)
    c = 5
    f = overlay_rivets(f, [(c, c), (w - 1 - c, c), (c, h - 1 - c), (w - 1 - c, h - 1 - c)], 2.4, plate=5)
    alpha = np.where(d >= 7, 0.80, 1.0)
    rgba = np.concatenate([np.clip(f, 0, 1), alpha[..., None]], axis=2)
    Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA').save(os.path.join(OUT, 'glass.png'))
    print('ok glass.png')

def inset():
    t, m = 64, 10
    f = wrap_field(granite_tile(t, 23, **STONE_DARK) * 0.82, m)
    h, w, _ = f.shape
    d, lit = edge_dist(h, w)
    f = line(f, d, 0, (110, 80, 42), 0.85, 1)
    # hundido: sombra arriba/izquierda, luz abajo/derecha
    f = shade(f, d, -lit, 1, 6, 0.35)
    save(f, 'inset.png')

def slab(name, bright=1.0, pressed=False, disabled=False, selected=False):
    t, m = 48, 11
    stone = STONE if not disabled else dict(base=(66, 64, 62), dark=(40, 39, 38), light=(90, 88, 86))
    f = wrap_field(granite_tile(t, 37, **stone) * bright, m)
    h, w, _ = f.shape
    d, lit = edge_dist(h, w)
    f = line(f, d, 0, (16, 11, 6), 1.0, 1)
    if selected:
        f = apply_band(f, d, lit, 1, 4, 1.25)
        f = line(f, d, 5, (36, 24, 10), 0.9, 1)
        # resplandor cálido hacia dentro
        mask = (d >= 6) & (d < 12)
        g = 1 - (d[mask] - 6) / 6
        f[mask] = f[mask] * (1 - 0.35 * g[:, None]) + np.array([0.86, 0.62, 0.30])[None, :] * 0.35 * g[:, None]
    else:
        f = apply_band(f, d, lit, 1, 3, 0.55 if disabled else (1.1 if bright > 1 else 1.0))
        f = line(f, d, 4, (30, 22, 14), 0.9, 1)
        f = shade(f, d, -lit if pressed else lit, 5, 5, 0.3 if not pressed else 0.4)
    if not disabled:
        c = 5.5
        f = overlay_rivets(f, [(c, c), (w - 1 - c, c), (c, h - 1 - c), (w - 1 - c, h - 1 - c)], 1.7)
    save(f, name)

def divider():
    w, h = 256, 14
    ov = Image.new('RGBA', (w * SS, h * SS), (0, 0, 0, 0))
    dr = ImageDraw.Draw(ov)
    cy = h * SS // 2
    dr.line([0, cy, w * SS, cy], fill=(150, 108, 54, 255), width=SS * 2)
    dr.line([0, cy - SS, w * SS, cy - SS], fill=(226, 186, 112, 200), width=SS)
    cx = w * SS // 2
    r = 6 * SS
    dr.polygon([(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)], fill=(150, 108, 54, 255), outline=(52, 34, 16, 255))
    dr.polygon([(cx, cy - r * 0.5), (cx + r * 0.5, cy), (cx, cy + r * 0.5), (cx - r * 0.5, cy)], fill=(236, 196, 120, 255))
    ov = ov.resize((w, h), Image.LANCZOS)
    # desvanecer los extremos
    a = np.asarray(ov).astype(float)
    x = np.linspace(0, 1, w)
    fade = np.clip(np.minimum(x, 1 - x) * 6, 0, 1)
    a[..., 3] *= fade[None, :]
    Image.fromarray(a.astype(np.uint8), 'RGBA').save(os.path.join(OUT, 'divider.png'))
    print('ok divider.png')

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    panel()
    glass()
    inset()
    slab('slab.png')
    slab('slab_hover.png', bright=1.14)
    slab('slab_pressed.png', bright=0.8, pressed=True)
    slab('slab_disabled.png', bright=0.75, disabled=True)
    slab('slab_selected.png', bright=1.05, selected=True)
    divider()
