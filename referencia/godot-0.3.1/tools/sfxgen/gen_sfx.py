"""Genera efectos de sonido mágicos y de interfaz por síntesis (sin música)."""
import numpy as np, subprocess, os, scipy.signal as sg
SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "sfx")
rng = np.random.default_rng(7)

def env(n, a=0.01, d=0.2, curve=3.0):
    t = np.linspace(0, 1, n)
    att = int(n * a)
    e = np.ones(n)
    if att > 0:
        e[:att] = np.linspace(0, 1, att)
    e[att:] = (1 - np.linspace(0, 1, n - att)) ** curve
    return e

def bandnoise(n, lo, hi):
    x = rng.standard_normal(n)
    b, a = sg.butter(3, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    return sg.lfilter(b, a, x)

def save(name, x, gain=0.9):
    x = x / (np.max(np.abs(x)) + 1e-9) * gain
    pcm = (x * 32767).astype(np.int16)
    wav = f"/tmp/{name}.wav"
    import wave
    with wave.open(wav, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-c:a", "libvorbis", "-q:a", "4", os.path.join(OUT, name + ".ogg")], check=True)
    os.remove(wav)

def sweep_noise(dur, f0, f1, q=0.5):
    n = int(SR * dur); out = np.zeros(n); blk = 512
    x = rng.standard_normal(n)
    for i in range(0, n, blk):
        f = f0 + (f1 - f0) * (i / n)
        lo = max(40, f * (1 - q)); hi = min(SR / 2 - 100, f * (1 + q))
        b, a = sg.butter(2, [lo / (SR / 2), hi / (SR / 2)], btype="band")
        out[i:i + blk] = sg.lfilter(b, a, x[i:i + blk])
    return out

t = lambda d: np.linspace(0, d, int(SR * d), endpoint=False)

# Flecha / virote: silbido descendente
d = 0.35; x = sweep_noise(d, 4000, 1200, 0.3) * env(int(SR * d), 0.05, 0, 2)
save("sfx_arrow", x, 0.7)
# Fuego: rugido de ruido grave con chisporroteo
d = 0.8; n = int(SR * d)
x = bandnoise(n, 150, 2500) * env(n, 0.08, 0, 1.6) + (rng.random(n) > 0.997) * rng.standard_normal(n) * 0.8
save("sfx_fire", x)
# Escarcha: brillo agudo con armónicos
d = 0.9; tt = t(d)
x = sum(np.sin(2 * np.pi * f * tt) * (0.6 ** k) for k, f in enumerate([1760, 2637, 3520, 4186])) * env(len(tt), 0.01, 0, 2.5)
x += bandnoise(len(tt), 5000, 12000) * 0.25 * env(len(tt), 0.01, 0, 4)
save("sfx_frost", x, 0.6)
# Rayo: chasquidos
d = 0.6; n = int(SR * d)
x = np.zeros(n)
for k in range(9):
    p = int(rng.random() * n * 0.7); L = int(SR * 0.03)
    x[p:p + L] += bandnoise(L, 800, 9000)[: len(x[p:p + L])] * (1 - k / 10)
x *= env(n, 0.0, 0, 1.2)
save("sfx_lightning", x)
# Trueno: golpe grave
d = 1.2; n = int(SR * d)
x = bandnoise(n, 30, 400) * env(n, 0.01, 0, 2.2) + np.sin(2 * np.pi * 55 * t(d)) * env(n, 0.005, 0, 5) * 0.8
save("sfx_thunder", x)
# Proyectil mágico: zumbido ascendente
d = 0.45; tt = t(d)
f = 300 + 900 * tt / d
x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.02, 0, 1.5) + 0.3 * np.sin(2 * np.pi * np.cumsum(f * 2.01) / SR) * env(len(tt), 0.02, 0, 2)
save("sfx_missile", x, 0.55)
# Curación: acorde luminoso
d = 1.3; tt = t(d)
x = sum(np.sin(2 * np.pi * f * tt) for f in [523.25, 659.25, 783.99, 1046.5]) * env(len(tt), 0.06, 0, 2.2)
x += 0.2 * np.sin(2 * np.pi * 2093 * tt) * env(len(tt), 0.2, 0, 3)
save("sfx_heal", x, 0.5)
# Bendición / mejora: campanitas
d = 1.0; tt = t(d); x = np.zeros(len(tt))
for i, f in enumerate([880, 1108.7, 1318.5]):
    st = int(i * 0.09 * SR)
    seg = tt[: len(tt) - st]
    x[st:] += np.sin(2 * np.pi * f * seg) * np.exp(-seg * 5)
save("sfx_buff", x, 0.5)
# Radiante (saeta guía, llama sagrada)
d = 0.9; tt = t(d)
x = np.sin(2 * np.pi * 660 * tt + 3 * np.sin(2 * np.pi * 7 * tt)) * env(len(tt), 0.03, 0, 2) + bandnoise(len(tt), 2000, 8000) * 0.3 * env(len(tt), 0.01, 0, 3)
save("sfx_radiant", x, 0.6)
# Necrótico / drenar vida: graves descendentes
d = 1.0; tt = t(d); f = 220 - 120 * tt / d
x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.05, 0, 1.4) + bandnoise(len(tt), 80, 600) * 0.4 * env(len(tt), 0.1, 0, 2)
save("sfx_necrotic", x, 0.7)
# Sueño: glissando suave
d = 1.2; tt = t(d); f = 600 - 300 * tt / d
x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.1, 0, 2) * 0.6
save("sfx_sleep", x, 0.45)
# Teletransporte: barrido de ruido
d = 0.6; x = sweep_noise(d, 500, 6000, 0.4) * env(int(SR * d), 0.3, 0, 1.5)
save("sfx_teleport", x, 0.6)
# Escudo mágico
d = 0.5; tt = t(d)
x = np.sin(2 * np.pi * 440 * tt) * np.sin(2 * np.pi * 4 * tt) * env(len(tt), 0.01, 0, 2) + bandnoise(len(tt), 1500, 4000) * 0.2 * env(len(tt), 0.01, 0, 4)
save("sfx_shield", x, 0.6)
# Caída de un personaje (golpe sordo)
d = 0.5; n = int(SR * d)
x = bandnoise(n, 40, 300) * env(n, 0.005, 0, 4)
save("sfx_thud", x, 0.9)
# Crítico: latigazo agudo
d = 0.4; n = int(SR * d)
x = bandnoise(n, 2000, 9000) * env(n, 0.002, 0, 6) + np.sin(2 * np.pi * 1320 * t(d)) * env(n, 0.002, 0, 3) * 0.6
save("sfx_crit", x, 0.8)
# Dados: varios clics de madera
d = 0.7; n = int(SR * d); x = np.zeros(n)
for k, p in enumerate([0.0, 0.08, 0.17, 0.23, 0.31, 0.36, 0.42]):
    s = int(p * SR); L = int(SR * 0.025)
    x[s:s + L] += bandnoise(L, 1500, 5000) * np.exp(-np.linspace(0, 6, L)) * (1 - k * 0.1)
save("sfx_dice", x, 0.7)
# Subida de nivel: arpegio breve (jingle)
d = 1.6; tt = t(d); x = np.zeros(len(tt))
for i, f in enumerate([392, 523.25, 659.25, 783.99, 1046.5]):
    st = int(i * 0.12 * SR); seg = tt[: len(tt) - st]
    x[st:] += (np.sin(2 * np.pi * f * seg) + 0.3 * np.sin(4 * np.pi * f * seg)) * np.exp(-seg * 2.5)
save("sfx_levelup", x, 0.55)
# Victoria y derrota (gong + acorde)
d = 2.2; tt = t(d)
x = sum(np.sin(2 * np.pi * f * tt) for f in [261.6, 329.6, 392, 523.3]) * np.exp(-tt * 1.4)
save("sfx_victory", x, 0.55)
d = 2.4; tt = t(d)
x = sum(np.sin(2 * np.pi * f * tt) for f in [220, 261.6, 311.1]) * np.exp(-tt * 1.1) + bandnoise(len(tt), 40, 200) * 0.3 * np.exp(-tt * 2)
save("sfx_defeat", x, 0.55)
# Golpe de garra / mordisco
d = 0.25; n = int(SR * d)
x = bandnoise(n, 300, 3000) * env(n, 0.005, 0, 5)
save("sfx_bite", x, 0.8)
print("ok")
