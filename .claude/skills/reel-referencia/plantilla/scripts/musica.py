#!/usr/bin/env python3
"""Cama musical lo-fi y efectos, sintetizados desde cero (sin samples: sin licencias).

  uv run --with numpy --with scipy python scripts/musica.py --dur 34 --out public/musica.wav
  uv run --with numpy --with scipy python scripts/musica.py --sfx public/sfx

Música: 88 BPM, Fmaj9 – Em7 – Dm9 – Cmaj7, piano eléctrico + pad + bajo + batería suave,
con swing, paso bajo a 5 kHz y crepitado de vinilo muy bajo. Se mezcla luego bajo la
voz con ducking (scripts/sonido.sh), así que aquí sale a nivel de pista, no de mezcla.
"""
import argparse, pathlib
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 48000
rng = np.random.default_rng(7)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def lp(x, f, order=4):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def env(n, a, d, s=0.0):
    """Ataque lineal + caída exponencial hacia `s` (proporciones en muestras)."""
    t = np.arange(n)
    e = np.where(t < a, t / max(a, 1), s + (1 - s) * np.exp(-(t - a) / max(d, 1)))
    return e


def rhodes(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    trem = 1 + 0.05 * np.sin(2 * np.pi * 4.2 * t)
    x = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 6)
         + 0.12 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 9))
    return x * env(n, int(0.004 * SR), int(0.9 * SR)) * trem


def pad(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for f in fs:
        for det in (-0.12, 0.0, 0.12):           # tres osciladores un poco desafinados
            ph = 2 * np.pi * f * (1 + det / 100) * t
            x += 2 * (ph / (2 * np.pi) % 1) - 1  # diente de sierra
    x = lp(x, 900)
    fade = np.minimum(1, np.minimum(t / 0.6, (dur - t) / 0.6))
    return x / (3 * len(fs)) * fade


def kick():
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 50 + 70 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def snare():
    n = int(0.25 * SR); t = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 900, 5000)
    return (0.6 * noise + 0.3 * np.sin(2 * np.pi * 185 * t)) * np.exp(-t * 18)


def hat():
    n = int(0.06 * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000) * np.exp(-t * 70)


def put(buf, x, at, g=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(x))
    buf[i:j] += g * x[: j - i]


def musica(dur):
    bpm = 88; beat = 60 / bpm; bar = 4 * beat
    acordes = [  # (raíz del bajo, notas del acorde) en MIDI
        (41, [57, 60, 64, 67]),  # Fmaj9: A C E G sobre F
        (40, [55, 59, 62, 64]),  # Em7:   G B D E sobre E
        (38, [57, 60, 64, 65]),  # Dm9:   A C E F sobre D
        (36, [55, 59, 62, 64]),  # Cmaj7: G B D E sobre C
    ]
    n = int((dur + 2) * SR)
    keys, pads, bass, drums = (np.zeros(n) for _ in range(4))
    t, k = 0.0, 0
    while t < dur + 1:
        raiz, notas = acordes[k % 4]
        for at in (0, 1.5 * beat, 3 * beat):              # golpes del piano: 1, «y» del 2, 4
            for m, nota in enumerate(notas):
                put(keys, rhodes(hz(nota), 1.6), t + at + m * 0.012, 0.18)  # rasgueo leve
        put(pads, pad([hz(x) for x in notas], bar), t, 0.5)
        for at in (0, 2 * beat, 2.5 * beat):
            nb = int(0.5 * beat * SR); tb = np.arange(nb) / SR
            put(bass, np.sin(2 * np.pi * hz(raiz) * tb) * env(nb, int(0.01 * SR), int(0.35 * SR)), t + at, 0.55)
        for b in range(4):
            if b in (0, 2) or (b == 3 and k % 2):
                put(drums, kick(), t + b * beat, 0.7)
            if b in (1, 3):
                put(drums, snare(), t + b * beat, 0.32)
            for e in range(2):                             # corcheas con swing (60/40)
                put(drums, hat(), t + b * beat + e * beat * 0.6, 0.12 if e else 0.16)
        t += bar; k += 1
    mezcla = lp(keys, 5000) + pads * 0.6 + lp(bass, 300) + lp(drums, 9000) * 0.8
    vinilo = hp(rng.standard_normal(n) * (rng.random(n) > 0.9993) * 0.4, 1500) + hp(rng.standard_normal(n), 3000) * 0.004
    mezcla = mezcla + vinilo
    mezcla = np.tanh(mezcla * 1.2)                         # saturación suave
    mezcla = mezcla[: int(dur * SR)]
    tt = np.arange(len(mezcla)) / SR
    mezcla *= np.minimum(1, np.minimum(tt / 1.0, (dur - tt) / 1.5))   # entrada 1 s, salida 1,5 s
    L = mezcla
    R = np.concatenate([np.zeros(int(0.011 * SR)), mezcla[: -int(0.011 * SR)]])  # ensancha (Haas)
    est = np.stack([L, 0.85 * R + 0.15 * L], 1)
    return est / np.max(np.abs(est)) * 0.7


def sfx(carpeta):
    carpeta.mkdir(parents=True, exist_ok=True)
    out = {}
    n = int(0.45 * SR); t = np.arange(n) / SR                       # whoosh: ruido con banda que sube
    x = rng.standard_normal(n); y = np.zeros(n)
    for i, (a, b) in enumerate(zip(np.linspace(300, 2500, 12), np.linspace(900, 6000, 12))):
        seg = slice(i * n // 12, (i + 1) * n // 12)
        y[seg] = bp(x, a, b)[seg]
    out["whoosh"] = lp(y, 7000) * np.sin(np.pi * t / t[-1]) ** 2
    n = int(0.09 * SR); t = np.arange(n) / SR                       # pop: blip con caída de tono
    out["pop"] = np.sin(2 * np.pi * np.cumsum(900 * np.exp(-t * 30) + 380) / SR) * np.exp(-t * 45)
    n = int(0.03 * SR); t = np.arange(n) / SR                       # clic de casilla / tecla
    out["clic"] = bp(rng.standard_normal(n), 2000, 7000) * np.exp(-t * 220)
    for k, v in out.items():
        v = v / np.max(np.abs(v)) * 0.7
        wavfile.write(carpeta / f"{k}.wav", SR, (np.stack([v, v], 1) * 32767).astype(np.int16))
    print("efectos:", ", ".join(sorted(out)))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dur", type=float)
    ap.add_argument("--out", default="public/musica.wav")
    ap.add_argument("--sfx")
    a = ap.parse_args()
    if a.sfx:
        sfx(pathlib.Path(a.sfx))
    if a.dur:
        m = musica(a.dur)
        wavfile.write(a.out, SR, (m * 32767).astype(np.int16))
        print(f"música: {a.out} · {a.dur:.1f} s · 88 BPM")
