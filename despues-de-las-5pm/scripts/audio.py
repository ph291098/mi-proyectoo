"""Audio de «Después de las 5 PM» (32 s): voz guía recolocada, música lo-fi y diseño de sonido.

Todo el audio que no es la voz se SINTETIZA aquí con numpy (ver AUDIO-LICENCIAS.md):
no hay samples ni música de terceros.

Rejilla: 80 BPM → 1 tiempo = 0,75 s, 1 compás = 3 s. Los golpes del vídeo caen en tiempo:
  1,50 «agotado» · 3,00 las 5:00 · 6,00 corte al celular · 14,25 «tarde» · 15,00 corte a negro
  18,75 sello «1 HORA» · 20,25 vuelve el cuarto · 25,50 portada · 30,00 golpe final

Salidas:
  work/audio/con_voz_raw.wav, work/audio/sin_voz_raw.wav   (se normalizan después con ffmpeg)
  src/data/voz.json                                        (palabras con su tiempo en el vídeo)

Uso: python3 scripts/audio.py <voz.wav 48 kHz mono> <palabras.json de Whisper>
"""
import sys, json, wave, os
import numpy as np

SR = 48000
DUR = 32.0
N = int(SR * DUR)
BEAT, BAR, S16 = 0.75, 3.0, 0.1875
rng = np.random.default_rng(23)

# frases de la voz guía: (inicio, fin) en la toma original → dónde va en el vídeo
SEGS = [
    ('A', 0.00, 1.64, 0.60),    # sé que estás agotado.
    ('B', 2.48, 5.52, 2.80),    # son las cinco, y quieres construir algo con ia.
    ('C', 6.00, 12.67, 6.20),   # abres el celular … otra persona que ya empezó.
    ('D', 13.04, 14.55, 13.20), # y tú sientes que vas tarde.
    ('E', 15.50, 17.20, 15.45), # el problema no es la ia.
    ('F', 17.63, 18.74, 17.85), # es que te queda una hora.
    ('G', 19.28, 20.65, 21.00), # no necesitas más horas.
    ('H', 20.98, 22.94, 22.70), # necesitas un plan para la que te queda.
    ('I', 23.27, 25.00, 25.80), # después de las cinco…
    ('J', 25.33, 27.02, 27.85), # el método en cinco pasos.
    ('K', 27.16, 28.08, 29.80), # link en la bio.
]

def tt(d): return np.arange(int(SR * d)) / SR
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
NAMES = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
def note(n): return midi(12 * (int(n[-1]) + 1) + NAMES[n[:-1]])

def filt(x, lo=None, hi=None):
    n = len(x); X = np.fft.rfft(x, n * 2); f = np.fft.rfftfreq(n * 2, 1 / SR); g = np.ones_like(f)
    if hi: g *= 1 / (1 + (f / hi) ** 4) ** .5
    if lo: g *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4) ** .5
    return np.fft.irfft(X * g)[:n]

class Bus:
    def __init__(self): self.L = np.zeros(N + SR * 4); self.R = np.zeros(N + SR * 4)
    def add(self, sig, start, gain=1.0, pan=0.0):
        i = int(round(start * SR))
        if i < 0: sig = sig[-i:]; i = 0
        j = min(len(self.L), i + len(sig)); s = sig[: j - i] * gain
        self.L[i:j] += s * np.sqrt((1 - pan) / 2) * 1.414; self.R[i:j] += s * np.sqrt((1 + pan) / 2) * 1.414

drums, music, sfx, send, voice = Bus(), Bus(), Bus(), Bus(), Bus()

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
    t = tt(d); wob = 1 + .004 * np.sin(2 * np.pi * .7 * t)      # leve desafinado de cinta
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
def shimmer(d):
    out = np.zeros(int(SR * (d + 1.2)))
    scale = ['D6', 'F6', 'A6', 'C7', 'E7', 'A7', 'D7']
    for k in range(int(d * 16)):
        f = note(scale[rng.integers(len(scale))]); t0 = rng.uniform(0, d); b = bell(f, .5, 9) * rng.uniform(.3, 1) * np.sin(np.pi * t0 / d)
        i = int(t0 * SR); out[i:i + len(b)] += b[: len(out) - i]
    return out * .25
def crackle(d):
    """ruido de vinilo: chasquidos sueltos + siseo muy bajo."""
    n = int(SR * d); x = np.zeros(n)
    for i in rng.integers(0, n - 200, int(d * 9)):
        x[i:i + 60] += rng.standard_normal(60) * np.exp(-np.arange(60) / 9) * rng.uniform(.2, 1)
    return filt(x, lo=800, hi=7000) * .5 + filt(rng.standard_normal(n), lo=2500, hi=9000) * .012

# ---------- armonía ----------
CH = {
    'Dm9':    ['D3', 'F3', 'A3', 'C4', 'E4'],  'Bbmaj7': ['Bb2', 'D3', 'F3', 'A3', 'D4'],
    'Gm9':    ['G2', 'Bb2', 'D3', 'F3', 'A3'], 'A7sus':  ['A2', 'D3', 'E3', 'G3', 'A3'],
    'C69':    ['C3', 'E3', 'G3', 'A3', 'D4'],  'Dadd9':  ['D3', 'A3', 'E4', 'F4', 'A4'],
}
ROOT = {'Dm9': 'D2', 'Bbmaj7': 'Bb1', 'Gm9': 'G1', 'A7sus': 'A1', 'C69': 'C2', 'Dadd9': 'D2'}
#        (inicio, duración, acorde, energía)   energía: 0 sin batería · 1 batería · 2 batería + melodía
plan = [(0, 3, 'Dm9', 0), (3, 3, 'Bbmaj7', 0), (6, 3, 'Dm9', 1), (9, 3, 'Bbmaj7', 1), (12, 3, 'Gm9', 1),
        (15, 3.75, 'A7sus', 0),                       # la gráfica: solo acorde y riser hasta el sello
        (21, 3, 'Bbmaj7', 2), (24, 3, 'C69', 2), (27, 3, 'Dm9', 2), (30, 2, 'Dadd9', 0)]
SW = .03
for t0, d, ch, e in plan:
    fr = [note(n) for n in CH[ch]]
    last = t0 >= 30
    p = pad(fr[:4], d + .4); music.add(p, t0, .9); send.add(p, t0, .4)
    hits = [(0, 1.0, min(d, 2.6))] if e == 0 else [(0, 1.0, 1.5), (6, .55, .9), (11, .6, 1.0)]
    for step, vel, dd in hits:
        for i, f in enumerate(fr):
            r = rhodes(f, dd, vel) * vel
            music.add(r, t0 + step * S16 + i * .014, 1.0, pan=-.25 + .5 * i / 4); send.add(r, t0 + step * S16, .4)
    rf = note(ROOT[ch])
    if e >= 1:
        for step, dd in [(0, .6), (7, .3), (10, .5)]: drums.add(bass(rf, dd), t0 + step * S16, .85)
        for step in (0, 7, 10): drums.add(kick(), t0 + step * S16, .8 if step == 0 else .6)
        for step in (4, 12):
            s = snare(); music.add(s, t0 + step * S16 + .012, .55); send.add(s, t0 + step * S16, .15)
        for step in range(0, 16, 2): music.add(hat(), t0 + step * S16 + (SW if step % 4 == 2 else 0), .4 if step % 4 else .28, pan=.25)
    else:
        drums.add(bass(rf, min(d, 2.4)), t0, .7)
    if e == 2:
        tones = [note(n) * 2 for n in CH[ch]]
        for step, k in [(0, 4), (3, 2), (6, 3), (10, 1), (13, 2)]:
            pl = pluck(tones[k], .6); music.add(pl, t0 + step * S16 + (SW if step % 2 else 0), .1, pan=.3 if step % 4 else -.3); send.add(pl, t0 + step * S16, .08)
# anacrusa al volver al cuarto (20,25–21,00)
sw = pad([note(n) for n in CH['Bbmaj7'][:4]], 1.0) * np.linspace(0, 1, int(SR * 1.0)) ** 2
music.add(sw, 20.1, 1.0); send.add(sw, 20.1, .5)
# vinilo durante todo el vídeo
cr = crackle(DUR); music.add(cr, 0, .35)

# ---------- diseño de sonido ----------
def fx(sig, t, gain, pan=0.0, rev=0.0):
    sfx.add(sig, t, gain, pan)
    if rev: send.add(sig, t, gain * rev)

# 1 · gancho: tic-tac, golpe grave en «agotado», campanada de las 5:00
for i, t0 in enumerate([0.0, 0.75, 2.25]): fx(tick() if i % 2 == 0 else tock(), t0, .5, .2)
for t0 in [0.375, 1.125, 1.875, 2.625]: fx(tock(), t0, .28, .2)
fx(whoosh(.35, .3, 200, 1800), 1.2, .5)
fx(boom(1.5), 1.5, .95); fx(thud(), 1.5, .5)
for i, n in enumerate(['D5', 'A5']): fx(bell(note(n), 1.8, 2.4), 3.0 + i * .02, .16, .3, rev=.8)
fx(tick(), 3.0, .5, .2)
# el celular se enciende sobre la mesa
fx(ping(note('A5')), 5.25, .2, .3, rev=.6)
# 2 · celular: whip, scroll, tarjetas, lluvia de notificaciones
fx(whoosh(.45, .33, 300, 6000), 5.67, .7)
for t0 in [7.15, 8.3, 9.95, 11.1]: fx(whoosh(.3, .12, 1200, 7000), t0, .3, -.2)
for i, t0 in enumerate([8.64, 10.26, 11.44]): fx(pop(420 + i * 40), t0, .32, rev=.2)
PN = ['A5', 'D6', 'F6', 'A5', 'C6', 'E6', 'D6', 'F6', 'A6', 'C6', 'E6', 'A6']
for i, t0 in enumerate([9.0, 9.75, 10.5, 11.25, 12.0, 12.375, 12.75, 13.125, 13.5, 13.6875, 13.875, 14.0625]):
    fx(ping(note(PN[i]), .45), t0, .11 + .006 * i, pan=(-.5 if i % 2 else .5), rev=.6)
fx(whoosh(.5, .44, 150, 1500), 13.8, .5)
fx(boom(1.1, 42, 3.6), 14.25, .8); fx(thud(), 14.25, .45)
# 3 · gráfica: corte, tics del contador, riser y golpe del sello
fx(whoosh(.3, .22, 300, 5000), 14.8, .5)
for k in range(22): fx(tick(1700 - k * 30, .02), 15.3 + k * .14, .12, -.3)
fx(riser(2.3), 16.45, .8)
fx(boom(2.2, 36, 1.9), 18.75, 1.0); fx(thud(.35), 18.75, .8); fx(click(), 18.75, .5)
# 4 · plan: la laptop se abre, checklist
fx(click(), 20.4, .45, 0); fx(click(), 20.52, .3, 0)
fx(whoosh(.9, .6, 250, 2500), 20.4, .3)
for i, t0 in enumerate([22.75, 23.25, 23.75, 24.25, 24.75]):
    fx(pop(480 + i * 45), t0, .26, -.2); fx(bell(note(['D5', 'F5', 'A5', 'C6', 'D6'][i]), .5, 7), t0 + .05, .08, -.2, rev=.7)
# 5 · portada: aparición, barrido de luz, golpe final
fx(whoosh(.4, .3, 300, 6000), 25.2, .5)
fx(boom(1.4, 44, 3.0), 25.5, .7)
fx(shimmer(1.7), 25.7, .5, rev=.8)
fx(whoosh(.8, .5, 2500, 9000), 26.3, .22)
fx(pop(400, .12), 27.95, .25); fx(pop(520, .12), 29.8, .28)
fx(boom(2.0, 38, 2.0), 30.0, .95); fx(thud(.3), 30.0, .5)
for i, n in enumerate(['D5', 'A5', 'E6']): fx(bell(note(n), 2.0, 2.2), 30.0 + i * .03, .1, rev=.9)

# ---------- reverb ----------
def ir(seed, d=1.9):
    r = np.random.default_rng(seed); t = tt(d); return filt(r.standard_normal(len(t)), hi=4500) * np.exp(-t * 3.4) * .05
def conv(x, h):
    n = len(x) + len(h); return np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(h, n))[: len(x)]
revL, revR = conv(send.L, ir(1)), conv(send.R, ir(2))
mL = filt(drums.L + music.L + revL, hi=9000); mR = filt(drums.R + music.R + revR, hi=9000)   # techo lo-fi

# ---------- voz ----------
def load(path):
    w = wave.open(path); assert w.getframerate() == SR and w.getnchannels() == 1
    return np.frombuffer(w.readframes(w.getnframes()), '<i2') / 32768
vo = load(sys.argv[1]); palabras = json.load(open(sys.argv[2]))
def arms(x):
    hop = SR // 100; n = len(x) // hop; r = np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    return np.sqrt((r[r > r.max() * .1] ** 2).mean())
VO_RMS = .12
vo = vo * (VO_RMS / arms(vo))
out_words = []
for name, a, b, at in SEGS:
    a2, b2 = max(0, a - .04), b + .08
    seg = vo[int(a2 * SR):int(b2 * SR)].copy(); f = int(.03 * SR)
    seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    voice.add(seg, at - .04, 1.0)
    for w in palabras:
        if a - .05 <= w['a'] < b:
            out_words.append({'w': w['w'], 'a': round(w['a'] - a + at, 3), 'b': round(min(w['b'], b) - a + at, 3), 'seg': name})
os.makedirs('src/data', exist_ok=True)
json.dump(out_words, open('src/data/voz.json', 'w'), ensure_ascii=False, indent=0)

# ---------- mezclas ----------
def rms(a, t0, t1): return np.sqrt((a[int(t0 * SR):int(t1 * SR)] ** 2).mean())
music_gain = VO_RMS * 10 ** (-9 / 20) / max(rms(mL, 6, 15), 1e-9)
mL *= music_gain; mR *= music_gain
sL, sR = sfx.L * VO_RMS * 3.0, sfx.R * VO_RMS * 3.0
env = np.abs(voice.L); w1 = int(.2 * SR); env = np.convolve(env, np.ones(w1) / w1, mode='same')
env = np.clip(env / (VO_RMS * .25), 0, 1); w2 = int(.3 * SR); env = np.convolve(env, np.ones(w2) / w2, mode='same')
duck = 1 - .5 * env                                        # sidechain: −6 dB bajo la voz

def write(path, L, R):
    L, R = L[:N].copy(), R[:N].copy()
    fade = np.ones(N); fl = int(.6 * SR); fade[-fl:] = np.linspace(1, 0, fl) ** 1.5
    L *= fade; R *= fade
    peak = max(np.abs(L).max(), np.abs(R).max())
    if peak > .97: L, R = L / peak * .97, R / peak * .97
    pcm = (np.clip(np.stack([L, R], 1), -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print('ok', path, 'pico', round(float(peak), 3))

os.makedirs('work/audio', exist_ok=True)
write('work/audio/con_voz_raw.wav', mL * duck + sL + voice.L, mR * duck + sR + voice.R)
write('work/audio/sin_voz_raw.wav', mL * 1.5 + sL * 1.2, mR * 1.5 + sR * 1.2)     # sin ducking: música algo más arriba
print(' '.join(f"{w['w']}[{w['a']}]" for w in out_words))
