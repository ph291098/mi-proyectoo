"""Banda sonora del vídeo explicativo de Valto (59,4 s).

Música original a 100 BPM en do mayor (compases de 2,4 s), efectos en la misma
tonalidad y sincronizados con la animación, y la locución colocada escena a
escena con la música bajando cuando habla. Escribe mezcla.wav (48 kHz estéreo).

Uso: python3 audio.py <carpeta con escena1..8.wav a 48 kHz mono> <salida.wav> [--sin-voz]
"""
import sys, wave
import numpy as np

SR = 48000
DUR = 59.4
N = int(SR * DUR)
BEAT = 0.6
BAR = 2.4
S16 = 0.15
rng = np.random.default_rng(11)

# dónde empieza cada locución (s)
VO_AT = {1: 1.5, 2: 5.9, 3: 9.8, 4: 19.5, 5: 27.8, 6: 37.4, 7: 45.2, 8: 50.6}

def tt(d): return np.arange(int(SR * d)) / SR
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
NAMES = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
def note(n): return midi(12 * (int(n[-1]) + 1) + NAMES[n[:-1]])

def filt(x, lo=None, hi=None):
    n = len(x)
    X = np.fft.rfft(x, n * 2)
    f = np.fft.rfftfreq(n * 2, 1 / SR)
    g = np.ones_like(f)
    if hi: g *= 1 / (1 + (f / hi) ** 4) ** .5
    if lo: g *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4) ** .5
    return np.fft.irfft(X * g)[:n]

class Bus:
    def __init__(self):
        self.L = np.zeros(N + SR * 4); self.R = np.zeros(N + SR * 4)
    def add(self, sig, start, gain=1.0, pan=0.0):
        i = int(round(start * SR))
        if i < 0: sig = sig[-i:]; i = 0
        j = min(len(self.L), i + len(sig))
        s = sig[: j - i] * gain
        self.L[i:j] += s * np.sqrt((1 - pan) / 2) * 1.414
        self.R[i:j] += s * np.sqrt((1 + pan) / 2) * 1.414

drums, music, sfx, send, voice = Bus(), Bus(), Bus(), Bus(), Bus()

# ---------- instrumentos ----------
def kick(d=.4):
    t = tt(d); f = 46 + 80 * np.exp(-t * 30)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 1.5) * .8

def snare(d=.22):
    t = tt(d)
    n = filt(rng.standard_normal(len(t)), lo=700, hi=4200) * np.exp(-t * 26)
    return (n * .5 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 34) * .35)

def hat(d=.05, bright=6500):
    t = tt(d)
    return filt(rng.standard_normal(len(t)), lo=bright) * np.exp(-t * 95) * .3

def shaker(d=.09):
    t = tt(d)
    return filt(rng.standard_normal(len(t)), lo=4000, hi=9000) * np.sin(np.pi * t / d) ** 2 * .22

def rhodes(f, d, vel=1.0):
    t = tt(d)
    trem = 1 + .12 * np.sin(2 * np.pi * 4.6 * t)
    s = (np.sin(2 * np.pi * f * t) + .32 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3)
         + .16 * np.sin(2 * np.pi * 4 * f * t + 1) * np.exp(-t * 9) * vel)
    env = np.minimum(1, t / .006) * np.exp(-t * 1.7) * np.clip((d - t) / .08, 0, 1)
    return s * env * trem * .16

def bass(f, d):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + .18 * np.sin(2 * np.pi * 2 * f * t)
    return s * np.minimum(1, t / .008) * np.exp(-t * 2.4) * np.clip((d - t) / .03, 0, 1) * .55

def pluck(f, d=.4):
    t = tt(d)
    tri = 2 * np.abs(2 * (f * t - np.floor(f * t + .5))) - 1
    return (tri * .6 + np.sin(2 * np.pi * 2 * f * t) * .15) * np.exp(-t * 9) * np.minimum(1, t / .003)

def bell(f, d=1.2):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 6) + .1 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 9)
    return s * np.exp(-t * 3.4) * np.minimum(1, t / .002)

def pop(f=520, d=.11):
    """pop redondo de burbuja: barrido corto hacia arriba."""
    t = tt(d); fr = f * (1 + .9 * (1 - np.exp(-t * 55)))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 34) * np.minimum(1, t / .002)

def ding(f1, f2, d=.5):
    """aviso suave de mensaje: dos notas."""
    a = bell(f1, d); b = bell(f2, d)
    out = np.zeros(len(a) + int(.085 * SR)); out[:len(a)] += a; out[int(.085 * SR):] += b * .9
    return out

def tick(f=1900, d=.03):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) * .6 + rng.standard_normal(len(t)) * .15) * np.exp(-t * 150)

def click(d=.05):
    t = tt(d)
    return (np.sin(2 * np.pi * 1300 * t) * np.exp(-t * 110) + filt(rng.standard_normal(len(t)), lo=2500) * np.exp(-t * 200) * .5) * .8

def swoosh(d=.5, peak=.3, lo=500, hi=4500):
    t = tt(d)
    env = np.where(t < peak, (t / peak) ** 2, np.exp(-(t - peak) * 9))
    return filt(rng.standard_normal(len(t)), lo=lo, hi=hi) * env * .3

def riser(d):
    t = tt(d); x = t / d
    s = filt(rng.standard_normal(len(t)), lo=1200, hi=8000) * x ** 2.2 * .22
    return s + np.sin(2 * np.pi * np.cumsum(260 * 2 ** (x * 1.6)) / SR) * x ** 2 * .06

def buzz(d=.16):
    t = tt(d)
    return np.sign(np.sin(2 * np.pi * 150 * t)) * np.sin(np.pi * t / d) ** 2 * .1

# ---------- armonía ----------
CH = {
    'Am7':   ['A3', 'C4', 'E4', 'G4'],  'Fmaj7': ['F3', 'A3', 'C4', 'E4'],
    'Dm7':   ['D3', 'F3', 'A3', 'C4'],  'Em7':   ['E3', 'G3', 'B3', 'D4'],
    'Cmaj7': ['C3', 'E3', 'G3', 'B3', 'E4'], 'G6': ['G3', 'B3', 'D4', 'E4'],
    'Cadd9': ['C3', 'G3', 'D4', 'E4', 'G4'],
}
ROOT = {'Am7': 'A1', 'Fmaj7': 'F1', 'Dm7': 'D2', 'Em7': 'E2', 'Cmaj7': 'C2', 'G6': 'G1', 'Cadd9': 'C2'}
LOOP = ['Cmaj7', 'Am7', 'Fmaj7', 'G6']
bars = ['Am7', 'Fmaj7', 'Dm7', 'Em7']                 # 0–3: noche y problema
bars += LOOP                                          # 4–7: aparece Valto
bars += LOOP + LOOP + ['Cmaj7', 'Am7']                # 8–17: los tres pasos
bars += ['Fmaj7', 'G6', 'Am7']                        # 18–20: demo
bars += ['Cmaj7', 'Fmaj7', 'G6', 'Cadd9']             # 21–24: cierre
#  nivel de energía por compás: 0 intro · 1 pulso · 2 base · 3 completo
energy = [0, 0, 1, 1, 3, 3, 3, 3] + [2] * 10 + [3, 3, 3] + [2, 2, 2, 0]

SW = 0.022  # swing de las semicorcheas impares
for b, ch in enumerate(bars):
    t0 = b * BAR
    e = energy[b]
    fr = [note(n) for n in CH[ch]]
    last = b == len(bars) - 1
    # piano eléctrico: acorde en el 1 y recolocaciones suaves
    hits = [(0, 1.0, BAR * .98)] if e == 0 else [(0, 1.0, 1.3), (6, .55, .8), (11, .6, .9)]
    if last: hits = [(0, 1.1, 1.8)]
    for step, vel, d in hits:
        for i, f in enumerate(fr):
            r = rhodes(f, d, vel) * vel
            music.add(r, t0 + step * S16 + i * .012, 1.0, pan=(-.25 + .5 * i / max(1, len(fr) - 1)))
            send.add(r, t0 + step * S16 + i * .012, .35)
    # bajo
    if e >= 1 and not last:
        rf = note(ROOT[ch])
        for step, d in ([(0, .5), (7, .25), (10, .45)] if e >= 2 else [(0, .9)]):
            drums.add(bass(rf, d), t0 + step * S16, .8)
    if last:
        drums.add(bass(note(ROOT[ch]), 1.6), t0, .8)
    # batería
    if e >= 2:
        for step in (0, 7, 10): drums.add(kick(), t0 + step * S16, .78 if step == 0 else .6)
        for step in (4, 12):
            s = snare(); music.add(s, t0 + step * S16, .5 if e == 3 else .36); send.add(s, t0 + step * S16, .12)
    elif e == 1:
        for step in (0, 8): drums.add(kick(), t0 + step * S16, .5)
    if e >= 1 and not last:
        for step in range(16):
            sw = SW if step % 2 else 0
            if step % 2 == 0: music.add(hat(), t0 + step * S16, .42 if step % 4 else .3, pan=.2)
            elif e >= 2: music.add(hat(.03), t0 + step * S16 + sw, .2, pan=.2)
        if e == 3:
            for step in range(0, 16, 2): music.add(shaker(), t0 + step * S16 + .075, .5, pan=-.3)
    # melodía (solo donde sube la energía)
    if e == 3:
        tones = [note(n) * 2 for n in CH[ch]]
        motif = [(0, 2), (3, 1), (6, 3), (8, 2), (11, 0), (14, 1)]
        for step, k in motif:
            p = pluck(tones[k % len(tones)] * (2 if b >= 18 and step in (6, 14) else 1), .45)
            music.add(p, t0 + step * S16 + (SW if step % 2 else 0), .11, pan=(.3 if step % 4 else -.3)); send.add(p, t0 + step * S16, .06)

# acorde de aparición de Valto y redobles suaves
for t0, g in [(9.6, .5), (43.2, .35), (57.6, .5)]:
    for i, n in enumerate(['C5', 'E5', 'G5', 'C6']):
        bl = bell(note(n), 1.6); music.add(bl, t0 + i * .05, .07 * g / .5); send.add(bl, t0 + i * .05, .12)
drums.add(kick(), 57.6, .8)

# ---------- efectos ----------
def fx(sig, t, gain, pan=0.0, rev=.0):
    sfx.add(sig, t, gain, pan)
    if rev: send.add(sig, t, gain * rev)

PENT = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6']
# transiciones
for t0, g in [(4.5, .5), (18.9, .45), (27.3, .45), (36.9, .45), (50.1, .5), (53.7, .45)]:
    fx(swoosh(.5, .3), t0, g)
fx(riser(.9), 8.7, .6); fx(riser(.7), 42.5, .5)
# 1 · notificaciones que se acumulan
for i, t0 in enumerate([.35, .8, 1.25, 1.7]):
    fx(ding(note('A5'), note('E6')), t0, .12, rev=.5); fx(buzz(), t0, .5)
# 2 · preguntas, reloj acelerado, sin respuesta
for t0 in (5.0, 5.75, 6.5): fx(pop(480), t0, .2, -.2)
for i, t0 in enumerate(np.arange(5.6, 9.2, .15)): fx(tick(1500 if i % 2 else 1250, .025), t0, .07, .35)
fx(bell(note('D4'), .7), 7.5, .1, rev=.4)
# 3 · logo, burbuja de Vera y capacidades
fx(pop(300, .18), 10.35, .32, rev=.3)
for i, t0 in enumerate([12.45, 13.45, 14.25, 15.0, 16.3, 17.8, 18.5]):
    fx(pop(520 + i * 40), t0, .16); fx(bell(note(PENT[i]), .5), t0, .045, rev=.6)
# 4 · URL, fuentes, datos que entran en Valto
for i in range(13): fx(tick(1800 + (i % 3) * 140), 19.9 + i * .1, .09)
for i, t0 in enumerate([21.8, 22.5, 23.4]): fx(bell(note(PENT[2 + i]), .4), t0, .05, rev=.5)
for i, t0 in enumerate([24.3, 24.9, 25.5]):
    fx(pop(600), t0, .13); fx(swoosh(.5, .38, 900, 6000), t0 + .4, .2); fx(bell(note(PENT[3 + i]), .6), t0 + 1.0, .07, rev=.6)
# 5 · tarjetas e interruptores
for i in range(4): fx(pop(440 + i * 30), 28.0 + i * .14, .12)
for i, t0 in enumerate([31.0, 33.5, 35.6, 36.45]):
    fx(click(), t0, .3); fx(bell(note(PENT[1 + i]), .5), t0 + .03, .07, rev=.6)
# 6 · enlace con WhatsApp y chat web
fx(pop(420), 37.5, .14, -.3); fx(pop(520), 37.75, .14, .3)
for i in range(6): fx(tick(1400 + i * 120, .025), 38.3 + i * .13, .08)
fx(ding(note('G5'), note('C6')), 39.1, .12, rev=.6)
fx(pop(560), 39.9, .16, .3); fx(pop(380, .14), 40.2, .16, .3)
for i in range(10): fx(tick(1900 + (i % 3) * 120), 40.5 + i * .07, .07)
fx(bell(note('E6'), .6), 40.7, .06, rev=.6)
# 7 · conversación y cita anotada
fx(ding(note('A5'), note('E6')), 43.55, .11, -.3, rev=.5)
fx(pop(620), 44.95, .18, .3)
fx(ding(note('A5'), note('E6')), 46.3, .11, -.3, rev=.5)
fx(pop(620), 47.35, .18, .3)
fx(pop(340, .16), 48.2, .2, rev=.3)
fx(swoosh(.6, .42, 900, 6000), 48.85, .28)
fx(ding(note('G5'), note('C6')), 49.42, .14, .3, rev=.6)
# 8 · mañana y cierre
for i, t0 in enumerate([51.2, 51.75, 52.3]): fx(pop(520 + i * 50), t0, .14); fx(bell(note(PENT[2 + i]), .5), t0 + .15, .06, rev=.6)
for i, n in enumerate(['C5', 'E5', 'G5']): fx(bell(note(n), .9), 52.95 + i * .04, .05, rev=.6)
fx(pop(300, .18), 54.05, .22, rev=.3)
fx(pop(420, .16), 57.0, .26, rev=.3)

# ---------- reverb ----------
def ir(seed, d=1.5):
    r = np.random.default_rng(seed); t = tt(d)
    return filt(r.standard_normal(len(t)), hi=5000) * np.exp(-t * 4.2) * .05
def conv(x, h):
    n = len(x) + len(h)
    return np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(h, n))[: len(x)]
revL, revR = conv(send.L, ir(1)), conv(send.R, ir(2))

mL = filt(drums.L + music.L + revL, hi=11000); mR = filt(drums.R + music.R + revR, hi=11000)
sL, sR = sfx.L, sfx.R

# ---------- locución ----------
def load(path):
    w = wave.open(path)
    assert w.getframerate() == SR and w.getnchannels() == 1
    return np.frombuffer(w.readframes(w.getnframes()), '<i2') / 32768

def active_rms(x):
    hop = SR // 100; n = len(x) // hop
    r = np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    return np.sqrt((r[r > r.max() * .1] ** 2).mean())

with_voice = '--sin-voz' not in sys.argv
VO_RMS = 0.12
if with_voice:
    for k, at in VO_AT.items():
        x = load(f'{sys.argv[1]}/escena{k}.wav')
        x = filt(x, lo=75) * (VO_RMS / active_rms(x))
        voice.add(x, at, 1.0)

# niveles respecto a la voz
def rms(a): return np.sqrt((a[:N] ** 2).mean())
music_gain = VO_RMS * 10 ** (-10 / 20) / max(rms(mL[int(9.6 * SR):int(43 * SR)]), 1e-9)
mL *= music_gain; mR *= music_gain
sfx_gain = VO_RMS * 2.4
sL = sL * sfx_gain; sR = sR * sfx_gain

# la música baja cuando hay voz (−6,5 dB), con entrada y salida suaves
env = np.abs(voice.L)
win = int(.25 * SR); env = np.convolve(env, np.ones(win) / win, mode='same')
env = np.clip(env / (VO_RMS * .25), 0, 1)
win2 = int(.35 * SR); env = np.convolve(env, np.ones(win2) / win2, mode='same')
duck = 1 - .53 * env
mL *= duck; mR *= duck

L = (mL + sL + voice.L)[:N]; R = (mR + sR + voice.R)[:N]
fade = np.ones(N); fl = int(.5 * SR); fade[-fl:] = np.linspace(1, 0, fl) ** 1.5
fi = int(.05 * SR); fade[:fi] = np.linspace(0, 1, fi)
L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max())
if peak > .97: L, R = L / peak * .97, R / peak * .97
pcm = (np.clip(np.stack([L, R], 1), -1, 1) * 32767).astype('<i2')
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok', sys.argv[2], 'pico', round(float(peak), 3))
