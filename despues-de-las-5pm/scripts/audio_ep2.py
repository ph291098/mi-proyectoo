"""Audio del episodio 2, «hora 2 · elige una sola cosa» (20,5 s).

Misma rejilla que el capítulo 1: 80 BPM (1 tiempo = 0,75 s). Golpes del vídeo:
  2,25 «pierdes» · 3,00 se abre la laptop · 8,25 «se acabó» · 9,00 corte a negro · 11,25 «sentado»
  12,00 «paso 1» · 16,90 vuelve el cuarto · 18,00 «hecho» · 19,50 golpe final

Salidas: work/audio/ep2_con_voz_raw.wav, work/audio/ep2_sin_voz_raw.wav y src/data/voz_ep2.json

Uso: python3 scripts/audio_ep2.py <voz.wav 48 kHz mono, ya acelerada> <palabras.json de Whisper> [aceleración]
"""
import sys, json, os
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sinte import *

DUR = 20.5
N = int(SR * DUR)
S16 = 0.1875
ACEL = float(sys.argv[3]) if len(sys.argv) > 3 else 1.06      # la voz guía va un 6 % más rápida que la toma original

# frases de la voz guía: (inicio, fin) en la toma ORIGINAL → dónde va en el vídeo
SEGS = [
    ('A1', 0.00, 0.99, 0.25),    # tienes una hora.
    ('A2', 1.47, 2.61, 1.58),    # y así la pierdes.
    ('B1', 3.23, 4.18, 2.85),    # abres la laptop.
    ('B2', 4.46, 5.35, 3.83),    # una pestaña.
    ('B3', 5.66, 6.10, 4.75),    # otra.
    ('B4', 6.37, 7.03, 5.25),    # un tutorial.
    ('B5', 7.38, 8.98, 5.95),    # y cuando por fin decides…
    ('B6', 9.35, 9.88, 8.01),    # se acabó.
    ('C1', 10.55, 12.06, 9.00),  # el error no fue elegir mal.
    ('C2', 12.38, 13.51, 10.60), # fue elegir sentado.
    ('D1', 14.11, 14.70, 12.00), # paso uno.
    ('D2', 14.99, 17.60, 12.75), # elige una sola cosa, antes de sentarte.
    ('E', 17.86, 20.75, 15.40),  # escríbela en una línea. y termina solo eso.
    ('F', 21.16, 22.70, 18.40),  # sígueme para la hora tres.
]

drums, music, sfx, send, voice = Bus(DUR), Bus(DUR), Bus(DUR), Bus(DUR), Bus(DUR)

CH = {
    'Dm9':    ['D3', 'F3', 'A3', 'C4', 'E4'],  'Bbmaj7': ['Bb2', 'D3', 'F3', 'A3', 'D4'],
    'Gm9':    ['G2', 'Bb2', 'D3', 'F3', 'A3'], 'A7sus':  ['A2', 'D3', 'E3', 'G3', 'A3'],
    'C69':    ['C3', 'E3', 'G3', 'A3', 'D4'],  'Dadd9':  ['D3', 'A3', 'E4', 'F4', 'A4'],
}
ROOT = {'Dm9': 'D2', 'Bbmaj7': 'Bb1', 'Gm9': 'G1', 'A7sus': 'A1', 'C69': 'C2', 'Dadd9': 'D2'}
#        (inicio, duración, acorde, energía)   0 sin batería · 1 batería · 2 batería + melodía
plan = [(0, 3, 'Dm9', 0), (3, 3, 'Bbmaj7', 1), (6, 2.25, 'Gm9', 1),
        (9, 3, 'A7sus', 0),                                  # la lección: aire
        (12, 3, 'Bbmaj7', 2), (15, 3, 'C69', 2), (18, 1.5, 'Dm9', 2), (19.5, 1.0, 'Dadd9', 0)]
SW = .03
for t0, d, ch, e in plan:
    fr = [note(n) for n in CH[ch]]
    p = pad(fr[:4], d + .4); music.add(p, t0, .9); send.add(p, t0, .4)
    hits = [(0, 1.0, min(d, 2.6))] if e == 0 else [(0, 1.0, 1.5), (6, .55, .9), (11, .6, 1.0)]
    for step, vel, dd in hits:
        if step * S16 >= d: continue
        for i, f in enumerate(fr):
            r = rhodes(f, dd, vel) * vel
            music.add(r, t0 + step * S16 + i * .014, 1.0, pan=-.25 + .5 * i / 4); send.add(r, t0 + step * S16, .4)
    rf = note(ROOT[ch])
    if e >= 1:
        for step, dd in [(0, .6), (7, .3), (10, .5)]:
            if step * S16 < d: drums.add(bass(rf, dd), t0 + step * S16, .85)
        for step in (0, 7, 10):
            if step * S16 < d: drums.add(kick(), t0 + step * S16, .8 if step == 0 else .6)
        for step in (4, 12):
            if step * S16 < d:
                s = snare(); music.add(s, t0 + step * S16 + .012, .55); send.add(s, t0 + step * S16, .15)
        for step in range(0, 16, 2):
            if step * S16 < d: music.add(hat(), t0 + step * S16 + (SW if step % 4 == 2 else 0), .4 if step % 4 else .28, pan=.25)
    else:
        drums.add(bass(rf, min(d, 2.4)), t0, .7)
    if e == 2:
        tones = [note(n) * 2 for n in CH[ch]]
        for step, k in [(0, 4), (3, 2), (6, 3), (10, 1), (13, 2)]:
            if step * S16 < d:
                pl = pluck(tones[k], .6); music.add(pl, t0 + step * S16 + (SW if step % 2 else 0), .1, pan=.3 if step % 4 else -.3); send.add(pl, t0 + step * S16, .08)
music.add(crackle(DUR), 0, .35)

def fx(sig, t, gain, pan=0.0, rev=0.0):
    sfx.add(sig, t, gain, pan)
    if rev: send.add(sig, t, gain * rev)

# gancho: tic-tac y golpe en «pierdes»
for i, t0 in enumerate([0.0, 0.75, 1.5]): fx(tick() if i % 2 == 0 else tock(), t0, .5, .2)
for t0 in [0.375, 1.125]: fx(tock(), t0, .28, .2)
fx(whoosh(.3, .22, 300, 4000), 1.36, .45)
fx(boom(1.2, 42, 3.4), 2.25, .8); fx(thud(), 2.25, .45)
# tropiezo: laptop, pestañas que se multiplican, reloj acelerado, «se acabó»
fx(click(), 3.0, .45); fx(click(), 3.11, .3); fx(whoosh(.7, .5, 250, 2500), 3.0, .28)
T_PEST = [4.07, 4.75, 5.47, 5.95, 6.3, 6.6, 6.85, 7.05, 7.25, 7.4, 7.55, 7.7, 7.82, 7.94, 8.05]
for i, t0 in enumerate(T_PEST):
    fx(pop(400 + i * 28), t0, .2 + .008 * i, pan=(-.4 if i % 2 else .4), rev=.15)
for k in range(34):                                             # tic-tac cada vez más rápido
    u = k / 33; fx(tick(1500 + 500 * u, .02), 4.0 + 4.1 * (1 - (1 - u) ** 1.8), .07 + .05 * u, .3)
fx(riser(1.3), 6.95, .7)
fx(boom(1.8, 38, 2.4), 8.25, 1.0); fx(thud(.35), 8.25, .8); fx(click(), 8.25, .5)
# lección
fx(whoosh(.3, .22, 300, 5000), 8.82, .4)
fx(boom(1.0, 46, 4.0), 11.25, .55)
fx(thud(.2), 12.0, .55); fx(pop(300, .16), 12.0, .25, rev=.3)
fx(whoosh(.75, .6, 500, 6000), 12.7, .4)
fx(pop(520, .12), 13.38, .3, rev=.3); fx(bell(note('D5'), .8, 5), 13.4, .08, rev=.8)
for k in range(22): fx(rasgueo(.05 + .03 * rng.random()), 15.5 + k * 0.055 + rng.random() * .015, .16, -.15)
# vuelta al cuarto: progreso, «hecho», cierre
fx(whoosh(.3, .22, 300, 5000), 16.72, .45)
for k in range(9): fx(tick(1300 + k * 110, .025), 17.0 + k * .1, .1, .2)
fx(ping(note('A5')), 18.0, .2, rev=.7); fx(boom(1.2, 46, 3.2), 18.0, .55)
fx(shimmer(1.0), 18.05, .35, rev=.8)
fx(pop(520, .12), 19.25, .28)
fx(boom(2.0, 38, 2.0), 19.5, .95); fx(thud(.3), 19.5, .5)
for i, n in enumerate(['D5', 'A5', 'E6']): fx(bell(note(n), 2.0, 2.2), 19.5 + i * .03, .1, rev=.9)

revL, revR = reverb(send)
mL = filt(drums.L + music.L + revL, hi=9000); mR = filt(drums.R + music.R + revR, hi=9000)

# voz
vo = cargar(sys.argv[1]); palabras = json.load(open(sys.argv[2]))
VO_RMS = .12
vo = vo * (VO_RMS / rms_activo(vo))
out_words = []
for name, a, b, at in SEGS:
    a2, b2 = max(0, a / ACEL - .03), b / ACEL + .06
    seg = vo[int(a2 * SR):int(b2 * SR)].copy(); f = int(.025 * SR)
    seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    voice.add(seg, at - .03, 1.0)
    for w in palabras:
        if a - .06 <= w['a'] < b:
            out_words.append({'w': w['w'], 'a': round((w['a'] - a) / ACEL + at, 3), 'seg': name})
json.dump(out_words, open('src/data/voz_ep2.json', 'w'), ensure_ascii=False, indent=0)

def rms(a, t0, t1): return np.sqrt((a[int(t0 * SR):int(t1 * SR)] ** 2).mean())
g = VO_RMS * 10 ** (-9 / 20) / max(rms(mL, 3, 8), 1e-9)
mL *= g; mR *= g
sL, sR = sfx.L * VO_RMS * 3.0, sfx.R * VO_RMS * 3.0
env = np.abs(voice.L); w1 = int(.2 * SR); env = np.convolve(env, np.ones(w1) / w1, mode='same')
env = np.clip(env / (VO_RMS * .25), 0, 1); w2 = int(.3 * SR); env = np.convolve(env, np.ones(w2) / w2, mode='same')
duck = 1 - .5 * env
os.makedirs('work/audio', exist_ok=True)
escribir('work/audio/ep2_con_voz_raw.wav', mL * duck + sL + voice.L, mR * duck + sR + voice.R, N)
escribir('work/audio/ep2_sin_voz_raw.wav', mL * 1.5 + sL * 1.2, mR * 1.5 + sR * 1.2, N)
print(' '.join(f"{w['w']}[{w['a']}]" for w in out_words))
