#!/usr/bin/env python3
"""Música del edit: el audio original reordenado en trozos cortados JUSTO en el bombo.

Mismo tempo y cortes en el golpe → el groove no se rompe; el final acaba en el bombo 4 y el
principio empieza en el bombo 4, así que el loop de Instagram/TikTok suena continuo.
"""
import json, pathlib, subprocess, sys
import numpy as np

RAIZ = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "scripts"))
SR = 48000
rej = json.loads((RAIZ / "work/rejilla.json").read_text()); T0, P = rej["t0"], rej["P"]
k = lambda i: T0 + i * P
# (bombos de salida, bombos de la fuente) — igual que la EDL de render.py
TRAMOS = [((0, 4), (4, 8)), ((4, 18), (0, 14)), ((18, 25), (14, 21)), ((25, 29), (0, 4))]
WHOOSH = [4, 22, 25, 29]          # bombos de salida con barrido
X = int(0.008 * SR)               # fundido cruzado de 8 ms en cada costura (sin clics)


def leer(ruta, extra=()):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(ruta), *extra, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


src = leer(RAIZ / "work/fuente.mov", ["-map", "0:a:0"])
total = int(round(29 * P * SR))
out = np.zeros((total + X, 2), np.float32)
for (b0, b1), (s0, s1) in TRAMOS:
    o0 = int(round(b0 * P * SR)); n = int(round((b1 - b0) * P * SR))
    a0 = int(round(k(s0) * SR))
    trozo = src[a0:a0 + n + X].copy()
    if len(trozo) < n + X:
        trozo = np.pad(trozo, ((0, n + X - len(trozo)), (0, 0)))
    rampa = np.sin(np.linspace(0, np.pi / 2, X))[:, None] ** 2
    if o0 > 0:
        trozo[:X] *= rampa                       # entra mientras el anterior sale
    trozo[n:n + X] *= rampa[::-1]
    out[o0:o0 + n + X] += trozo
out = out[:total]
w = leer(RAIZ / "sfx/whoosh.wav")[:, :]
for b in WHOOSH:
    c = int(round((b * P - 0.18) * SR))          # el barrido culmina en el corte
    seg = w[:max(0, min(len(w), total - c))] * 10 ** (-17 / 20)
    out[c:c + len(seg)] += seg
pathlib.Path(RAIZ / "work").mkdir(exist_ok=True)
tmp = RAIZ / "work/musica_raw.wav"
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(tmp)],
               input=out.astype(np.float32).tobytes(), check=True)
# EQ suave (bombo y aire) + loudnorm a -14 LUFS en dos pasadas
F = "highpass=f=32,bass=g=2.5:f=75,treble=g=1.5:f=8000"
m = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(tmp), "-af", f"{F},loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json", "-f", "null", "-"],
                   capture_output=True, text=True).stderr
j = json.loads(m[m.rindex("{"):])
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(tmp), "-af",
                f"{F},loudnorm=I=-14:TP=-1.5:LRA=9:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:linear=true,aresample=48000",
                "-c:a", "pcm_s16le", str(RAIZ / "work/musica.wav")], check=True)
print(f"música: work/musica.wav · {total / SR:.2f} s · {len(TRAMOS)} tramos cortados en el bombo")
