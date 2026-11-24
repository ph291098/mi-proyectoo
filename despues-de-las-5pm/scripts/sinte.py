"""Sintetizador compartido por los episodios: instrumentos, efectos, reverb y mezcla.
Todo se genera con numpy; no hay samples de terceros (ver AUDIO-LICENCIAS.md).
"""
import wave
import numpy as np

SR = 48000
rng = np.random.default_rng(23)
NAMES = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}

def tt(d): return np.arange(int(SR * d)) / SR
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
def note(n): return midi(12 * (int(n[-1]) + 1) + NAMES[n[:-1]])

def filt(x, lo=None, hi=None):
    n = len(x); X = np.fft.rfft(x, n * 2); f = np.fft.rfftfreq(n * 2, 1 / SR); g = np.ones_like(f)
    if hi: g *= 1 / (1 + (f / hi) ** 4) ** .5
    if lo: g *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4) ** .5
    return np.fft.irfft(X * g)[:n]

class Bus:
    def __init__(self, dur):
        self.n = int(SR * dur); self.L = np.zeros(self.n + SR * 4); self.R = np.zeros(self.n + SR * 4)
    def add(self, sig, start, gain=1.0, pan=0.0):
        i = int(round(start * SR))
        if i < 0: sig = sig[-i:]; i = 0
        j = min(len(self.L), i + len(sig)); s = sig[: j - i] * gain
        self.L[i:j] += s * np.sqrt((1 - pan) / 2) * 1.414; self.R[i:j] += s * np.sqrt((1 + pan) / 2) * 1.414

# ---------- instrumentos ----------
def kick(d=.45):
    t = tt(d); f = 44 + 70 * np.exp(-t * 26)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8) * 1.4) * .8
def snare(d=.26):
    t = tt(d)
    return filt(rng.standard_normal(len(t)), lo=500, hi=3400) * np.exp(-t * 20) * .45 + np.sin(2 * np.pi * 175 * t) * np.exp(-t * 30) * .3
def hat(d=.05):
    t = tt(d); return filt(rng.standard_normal(len(t)), lo=5500, hi=10000) * np.exp(-t * 90) * .25
def rhodes(f, d, vel=1.0):
    t = tt(d); wob = 1 + .004 * np.sin(2 * np.pi * .7 * t)
    s = (np.sin(2 * np.pi * f * wob * t) + .3 * np.sin(2 * np.pi * 2 * f * wob * t) * np.exp(-t * 3)
         + .14 * np.sin(2 * np.pi * 4 * f * t + 1) * np.exp(-t * 9) * vel)
    return s * np.minimum(1, t / .006) * np.exp(-t * 1.5) * np.clip((d - t) / .1, 0, 1) * (1 + .1 * np.sin(2 * np.pi * 4.2 * t)) * .15
def pad(freqs, d):
    t = tt(d); s = np.zeros_like(t)
    for f in freqs:
        for dt in (-.004, .0, .005):
            ph = f * (1 + dt) * t; s += 2 * (ph - np.floor(ph + .5)) * .05
    return filt(s * np.minimum(1, t / .6) * np.clip((d - t) / .5, 0, 1), hi=700)
def bass(f, d):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + .2 * np.sin(4 * np.pi * f * t)) * np.minimum(1, t / .01) * np.exp(-t * 2.2) * np.clip((d - t) / .04, 0, 1) * .55
def pluck(f, d=.5):
    t = tt(d); tri = 2 * np.abs(2 * (f * t - np.floor(f * t + .5))) - 1
    return (tri * .55 + np.sin(4 * np.pi * f * t) * .12) * np.exp(-t * 7) * np.minimum(1, t / .004)
def bell(f, d=1.2, dec=3.4):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t) * np.exp(-t * 6) + .1 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 9)) * np.exp(-t * dec) * np.minimum(1, t / .002)

# ---------- efectos ----------
def tick(f=2100, d=.035):
    t = tt(d); return (np.sin(2 * np.pi * f * t) * .5 + filt(rng.standard_normal(len(t)), lo=1500) * .35) * np.exp(-t * 130)
def tock(): return tick(1500, .045)
def boom(d=1.6, f0=38, dec=2.6):
    t = tt(d); f = f0 + 30 * np.exp(-t * 14)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * 1.6) * np.exp(-t * dec) * .9
def thud(d=.25):
    t = tt(d); return filt(rng.standard_normal(len(t)), lo=60, hi=600) * np.exp(-t * 22) * .9
def whoosh(d=.5, peak=.35, lo=400, hi=5000):
    t = tt(d); env = np.where(t < peak, (t / peak) ** 2.2, np.exp(-(t - peak) * 11))
    return filt(rng.standard_normal(len(t)), lo=lo, hi=hi) * env * .35
def riser(d):
    t = tt(d); x = t / d
    s = filt(rng.standard_normal(len(t)), lo=900, hi=9000) * x ** 2.4 * .3
    return s + np.sin(2 * np.pi * np.cumsum(180 * 2 ** (x * 2.2)) / SR) * x ** 2 * .1 + np.sin(2 * np.pi * np.cumsum(271 * 2 ** (x * 2.2)) / SR) * x ** 2 * .06
def ping(f, d=.6):
    a = bell(f, d, 6); b = bell(f * 1.5, d, 6)
    out = np.zeros(len(a) + int(.07 * SR)); out[:len(a)] += a; out[int(.07 * SR):] += b * .8
    return out
def pop(f=480, d=.1):
    t = tt(d); fr = f * (1 + .8 * (1 - np.exp(-t * 55)))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 36) * np.minimum(1, t / .002)
def click(d=.045):
    t = tt(d); return (np.sin(2 * np.pi * 900 * t) * np.exp(-t * 140) + filt(rng.standard_normal(len(t)), lo=2000) * np.exp(-t * 240) * .6) * .8
def rasgueo(d=.07):
    """roce de bolígrafo sobre papel: ruido agudo muy corto."""
    t = tt(d); return filt(rng.standard_normal(len(t)), lo=2200, hi=7500) * np.sin(np.pi * t / d) ** 2 * .5
def shimmer(d):
    out = np.zeros(int(SR * (d + 1.2))); scale = ['D6', 'F6', 'A6', 'C7', 'E7', 'A7', 'D7']
    for _ in range(int(d * 16)):
        f = note(scale[rng.integers(len(scale))]); t0 = rng.uniform(0, d); b = bell(f, .5, 9) * rng.uniform(.3, 1) * np.sin(np.pi * t0 / d)
        i = int(t0 * SR); out[i:i + len(b)] += b[: len(out) - i]
    return out * .25
def crackle(d):
    n = int(SR * d); x = np.zeros(n)
    for i in rng.integers(0, n - 200, int(d * 9)):
        x[i:i + 60] += rng.standard_normal(60) * np.exp(-np.arange(60) / 9) * rng.uniform(.2, 1)
    return filt(x, lo=800, hi=7000) * .5 + filt(rng.standard_normal(n), lo=2500, hi=9000) * .012

# ---------- reverb y utilidades de mezcla ----------
def _ir(seed, d=1.9):
    r = np.random.default_rng(seed); t = tt(d); return filt(r.standard_normal(len(t)), hi=4500) * np.exp(-t * 3.4) * .05
def _conv(x, h):
    n = len(x) + len(h); return np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(h, n))[: len(x)]
def reverb(send): return _conv(send.L, _ir(1)), _conv(send.R, _ir(2))

def cargar(path):
    w = wave.open(path); assert w.getframerate() == SR and w.getnchannels() == 1
    return np.frombuffer(w.readframes(w.getnframes()), '<i2') / 32768
def rms_activo(x):
    hop = SR // 100; n = len(x) // hop; r = np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    return np.sqrt((r[r > r.max() * .1] ** 2).mean())
def escribir(path, L, R, n, cola=.6):
    L, R = L[:n].copy(), R[:n].copy()
    fade = np.ones(n); fl = int(cola * SR); fade[-fl:] = np.linspace(1, 0, fl) ** 1.5
    L *= fade; R *= fade
    peak = max(np.abs(L).max(), np.abs(R).max())
    if peak > .97: L, R = L / peak * .97, R / peak * .97
    pcm = (np.clip(np.stack([L, R], 1), -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print('ok', path, 'pico', round(float(peak), 3))
