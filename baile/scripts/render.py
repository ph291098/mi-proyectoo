#!/usr/bin/env python3
"""Edit de baile dembow sincronizado al bombo: 1080x1920 a 30 fps.

  uv run --with numpy --with "opencv-python-headless<5" python scripts/render.py [--solo 0,60,120] [--out out/baile.mp4]

Entradas (en work/):
  f24/%04d.jpg   fotogramas originales estabilizados (24 fps, 1620x2880, SDR)
  (cámara lenta y speed ramps: fotogramas intermedios por flujo óptico DIS, calculados aquí)
  rejilla.json   bombo: t0 + i·P
  movimiento.json  caja de la bailarina por fotograma (para encuadrar)

Todo el montaje se describe en TIEMPOS DE BOMBO (P = 0,5217 s): ver EDL más abajo.
"""
import argparse, json, math, pathlib, subprocess, sys
from functools import lru_cache
import numpy as np
import cv2

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from grade import grade

RAIZ = pathlib.Path(__file__).resolve().parent.parent
W, H, FPS = 1080, 1920, 30
SW, SH = 1620, 2880                       # resolución del intermedio
rej = json.loads((RAIZ / "work/rejilla.json").read_text())
T0, P = rej["t0"], rej["P"]
k = lambda i: T0 + i * P                  # tiempo (fuente) del bombo i

# ── EDL en tiempos de bombo de SALIDA ──────────────────────────────────────────
# vid: cómo se mapea el tiempo de salida a tiempo de vídeo fuente; enc: encuadre
EDL = [
    dict(nombre="gancho",  b=(0, 4),   vid=("lento", 7.02, 0.40), enc="cerca",  audio=(4, 8)),
    dict(nombre="baile",   b=(4, 18),  vid=("sinc", 0),            enc="ritmo",  audio=(0, 14)),
    dict(nombre="climaxA", b=(18, 22), vid=("lento", 7.00, 0.45), enc="medio",  audio=(14, 18)),
    dict(nombre="climaxB", b=(22, 25), vid=("lento", 1.10, 0.50), enc="medio2", audio=(18, 21)),
    dict(nombre="final",   b=(25, 29), vid=("sinc", 8),            enc="final",  audio=(0, 4)),
]
TOTAL_B = 29
DUR = TOTAL_B * P
NF = int(round(DUR * FPS))
RAMPAS = [(k(2), k(4)), (k(10), k(12))]  # speed ramps neutros (vuelven a sincronía): lento en medio
WHIPS = {0: -1, 4: 1, 22: -1, 25: 1, 29: -1}  # bombo de salida → dirección; 29→0 es el loop (misma dirección)
GLITCH = [8, 14]
DROP = 18
# encuadres del desarrollo, cada 2 tiempos (índice de bombo de la FUENTE): de espaldas nunca «cerca»
RITMO = {0: "ancho", 2: "medio", 4: "ancho", 6: "ancho", 8: "ancho", 10: "cerca2", 12: "ancho"}
# Vibe «sensual, elegante, nunca vulgar»: mientras está girada o de espaldas (fuente 2,3–5,3 s), plano
# abierto como el original y golpes de zoom suaves. Ningún zoom sobre el cuerpo; los cerrados, a la cara.
PUDOR = (2.3, 5.3)
ESCALA = {"ancho": 1.04, "medio": 1.30, "medio2": 1.45, "cerca": 2.15, "cerca2": 1.75}
AIRE = 0.09        # aire sobre la cabeza, en fracción del alto del recorte


def tramo(tb):
    for e in EDL:
        if e["b"][0] <= tb < e["b"][1]:
            return e
    return EDL[-1]


def rampa(s):
    """Time remap neutro dentro de cada ventana: g'(u) = 1 + A·cos(2πu) → 1,55x en los bordes, 0,45x en medio."""
    A = 0.55
    for a, b in RAMPAS:
        if a <= s < b:
            u = (s - a) / (b - a)
            return a + (b - a) * (u + A / (2 * math.pi) * math.sin(2 * math.pi * u)), True
    return s, False


def fuente(t):
    """Tiempo de salida → (tiempo de vídeo fuente, ¿necesita fotogramas interpolados?, tramo, tb)."""
    tb = t / P
    e = tramo(tb)
    t_ini = e["b"][0] * P
    modo = e["vid"]
    if modo[0] == "lento":
        return modo[1] + modo[2] * (t - t_ini), True, e, tb
    s = k(modo[1]) + (t - t_ini)
    s, en_rampa = rampa(s)
    return s, en_rampa, e, tb


# ── caja de la bailarina (suavizada) para encuadrar ────────────────────────────
mov = json.loads((RAIZ / "work/movimiento.json").read_text())
ts = np.array([m["t"] for m in mov])
def _serie(f):
    v = np.array([np.nan if m["box"] is None else f(m["box"]) for m in mov], float)
    ok = ~np.isnan(v); v = np.interp(ts, ts[ok], v[ok])
    return np.convolve(np.pad(v, 6, mode="edge"), np.ones(13) / 13, "valid")
CX = _serie(lambda b: b[0] + b[2] / 2)
TOP = _serie(lambda b: b[1])
ALT = _serie(lambda b: b[3])


def caja(s):
    return (float(np.interp(s, ts, CX)), float(np.interp(s, ts, TOP)), float(np.interp(s, ts, ALT)))


# ── cabeza (YuNet): el encuadre se ancla aquí, con aire por encima como en un plano de verdad ──
cab = json.loads((RAIZ / "work/cabeza.json").read_text())
tc = np.array([c["t"] for c in cab])
_ok = np.array([c["cx"] is not None for c in cab])
def _suave(v):
    v = np.interp(tc, tc[_ok], np.array([c[v] for c in cab], dtype=object)[_ok].astype(float))
    return np.convolve(np.pad(v, 3, mode="edge"), np.ones(7) / 7, "valid")
HX, HY, HH = _suave("cx"), _suave("cy"), _suave("h")
ESPALDAS = np.convolve((~_ok).astype(float), np.ones(5) / 5, "same") > 0.4   # sin cara = de espaldas


def cabeza(s):
    i = int(min(max(round(s * 24), 0), len(tc) - 1))
    return float(np.interp(s, tc, HX)), float(np.interp(s, tc, HY)), float(np.interp(s, tc, HH)), bool(ESPALDAS[i])


# ── lectura de fotogramas ──────────────────────────────────────────────────────
@lru_cache(maxsize=16)
def leer(i):
    img = cv2.imread(str(RAIZ / f"work/f24/{i + 1:04d}.jpg"))
    return img.astype(np.float32)


N24 = len(list((RAIZ / "work/f24").glob("*.jpg")))
DIS = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
FL = 2                                           # el flujo se calcula a la mitad de resolución


@lru_cache(maxsize=8)
def flujos(i):
    """Flujo óptico entre los originales i e i+1, en los dos sentidos (a resolución completa, en px)."""
    g0 = cv2.cvtColor(cv2.resize(leer(i), (SW // FL, SH // FL)).astype(np.uint8), cv2.COLOR_BGR2GRAY)
    g1 = cv2.cvtColor(cv2.resize(leer(i + 1), (SW // FL, SH // FL)).astype(np.uint8), cv2.COLOR_BGR2GRAY)
    f01 = DIS.calc(g0, g1, None); f10 = DIS.calc(g1, g0, None)
    sube = lambda f: cv2.resize(f, (SW, SH), interpolation=cv2.INTER_LINEAR) * FL
    return sube(f01), sube(f10)


_yy, _xx = np.mgrid[0:SH, 0:SW].astype(np.float32)


def intermedio(s):
    """Fotograma en el tiempo fuente s (cámara lenta / speed ramp): interpolación por flujo óptico
    bidireccional entre los dos originales vecinos, con mezcla ponderada por cercanía."""
    x = min(max(s * 24, 0), N24 - 1.001)
    i = int(x); a = x - i
    if a < 0.04:
        return leer(i)
    if a > 0.96:
        return leer(i + 1)
    f01, f10 = flujos(i)
    w0 = cv2.remap(leer(i), _xx - a * f01[..., 0], _yy - a * f01[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    w1 = cv2.remap(leer(i + 1), _xx - (1 - a) * f10[..., 0], _yy - (1 - a) * f10[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return w0 * (1 - a) + w1 * a


def fotograma(s, interp):
    if interp:
        return intermedio(s)
    return leer(int(min(max(round(s * 24), 0), N24 - 1)))  # 1x: fotograma original más cercano


# ── envolventes de efectos ─────────────────────────────────────────────────────
def golpe(t, tb):
    """Punch-in: +3,5 % en cada bombo, +9 % en el primero de cada compás, +13 % en el drop."""
    b = 0.0
    for i in range(int(tb) - 2, int(tb) + 1):
        if i < 0 or i >= TOTAL_B:
            continue
        e = tramo(i)
        aud = e["audio"][0] + (i - e["b"][0])            # bombo de la FUENTE que suena aquí
        if aud in (12, 13):                               # el break no tiene bombo
            continue
        dt = t - i * P
        if dt < 0:
            continue
        amp = 0.13 if i == DROP else (0.09 if (i - 4) % 4 == 0 and 4 <= i < 18 else 0.035)
        if e["nombre"] in ("gancho", "climaxB"):
            amp *= 0.6
        ataque = min(1.0, dt / (2 / FPS))
        b += amp * ataque * math.exp(-dt / 0.16)
    return b


def ruido(t, semilla, f=7.0):
    r = np.random.default_rng(semilla).random(6) * 2 * math.pi
    return (math.sin(t * f + r[0]) * 0.5 + math.sin(t * f * 2.3 + r[1]) * 0.3 + math.sin(t * f * 4.1 + r[2]) * 0.2)


def temblor(t, tb):
    a = 0.0
    if 16 <= tb < 18:
        a = 5 * (tb - 16) / 2                              # el break sube la tensión
    if tb >= DROP:
        a = max(a, 3 + 7 * math.exp(-(t - DROP * P) / 0.6)) if tb < 22 else a
    for i in range(int(tb) - 1, int(tb) + 1):             # golpes fuertes del desarrollo
        if 4 <= i < 18 and (i - 4) % 4 == 0 and t >= i * P:
            a = max(a, 4 * math.exp(-(t - i * P) / 0.18))
    return a * ruido(t, 1), a * ruido(t, 2), a * 0.06 * ruido(t, 3)


def fuga(t, tb):
    """Intensidad del light leak."""
    v = 0.0
    v = max(v, 0.40 * math.exp(-t / 0.5))                                  # entrada del gancho
    if 16 <= tb < 18:
        v = max(v, 0.32 * (tb - 16) / 2)                                    # build-up del break
    if tb >= DROP:
        v = max(v, 0.62 * math.exp(-(t - DROP * P) / 0.7))                 # drop
    if tb >= TOTAL_B - 1:
        v = max(v, 0.40 * (tb - (TOTAL_B - 1)))                            # sube para enlazar el loop
    return v


def brillo(t, tb):
    v = 0.08
    v = max(v, 0.22 * math.exp(-t / 0.8))
    if tb >= DROP:
        v = max(v, 0.38 * math.exp(-(t - DROP * P) / 0.9))
    return v


def encuadre(t, tb, e, s):
    """Escala del plano. La posición sale de la cabeza (componer); de espaldas, nunca más cerca que un medio."""
    n = e["enc"]
    if n == "ritmo":                                          # cambia cada 2 tiempos: es el «corte»
        bi = int(tb) - e["b"][0]
        if bi >= 12:                                          # break: zoom lento que aprieta hacia la cara
            return 1.04 + 0.30 * ((tb - e["b"][0] - 12) / 2) ** 1.5
        n = RITMO[max(c for c in RITMO if c <= bi)]
    elif n == "medio":
        u = (tb - e["b"][0]) / (e["b"][1] - e["b"][0])
        return 1.30 + 0.25 * u                                # empuje lento durante el clímax
    elif n == "final":
        u = (tb - e["b"][0]) / (e["b"][1] - e["b"][0])
        return 1.20 + 0.95 * u * u                            # acaba cerca, en su sonrisa → enlaza con el gancho
    return ESCALA[n]


def whip(tb):
    """Barrido: el plano que sale se va de lado con desenfoque creciente (4 fotogramas) y el que entra
    llega desde el lado contrario frenando (4 fotogramas). El corte queda escondido en el desenfoque."""
    for b, d in WHIPS.items():
        dt = (tb - b) * P * FPS                                # fotogramas respecto al corte
        if -4 <= dt < 0 and b > 0:                             # sale
            u = (dt + 4) / 4
            return d * 0.35 * u * u, u
        if 0 <= dt < 4 and b < TOTAL_B:                        # entra
            u = dt / 4
            return -d * 0.35 * (1 - u) ** 2, 1 - u
    return 0.0, 0.0


# ── capa de luz (light leak) precalculada a baja resolución ─────────────────────
def capa_fuga(t):
    h, w = H // 8, W // 8
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    out = np.zeros((h, w, 3), np.float32)
    manchas = [((0.85, 0.15), (1.0, 0.55, 0.20), 0.55), ((0.10, 0.40), (1.0, 0.36, 0.45), 0.45), ((0.75, 0.85), (1.0, 0.78, 0.40), 0.5)]
    for j, ((cx, cy), col, r) in enumerate(manchas):
        cx += 0.08 * math.sin(t * 0.9 + j * 2.1); cy += 0.06 * math.cos(t * 0.7 + j)
        d = ((xx / w - cx) ** 2 + ((yy / h - cy) * 1.4) ** 2) / (r * r)
        out += np.exp(-d * 3)[..., None] * np.array(col, np.float32)
    return cv2.resize(np.clip(out, 0, 1), (W, H), interpolation=cv2.INTER_CUBIC)


yv, xv = np.mgrid[0:H, 0:W].astype(np.float32)
VIÑETA = (1 - 0.20 * (((xv / W - 0.5) * 1.6) ** 2 + ((yv / H - 0.5) * 1.2) ** 2))[..., None]
RNG = np.random.default_rng(7)


def componer(n):
    t = n / FPS
    s, interp, e, tb = fuente(t)
    img = fotograma(s, interp)                                 # BGR float 0..255, 1620x2880
    bx, _, _ = caja(s)
    hx, hy, hh, espaldas = cabeza(s)
    esc = encuadre(t, tb, e, s)
    pudor = espaldas or PUDOR[0] <= s <= PUDOR[1]
    if pudor:
        esc = min(esc, 1.04)                                   # de espaldas o girándose: plano abierto, como el original
    esc_base = esc
    g = golpe(t, tb)
    esc *= 1 + (min(g, 0.025) if pudor else g)
    dx, dy, rot = temblor(t, tb)
    z = (W / SW) * esc                                         # px de salida por px de fuente
    cw, ch = W / z, H / z                                      # tamaño del recorte en la fuente
    if esc_base > 1.1:                                         # anclado a la cabeza, con aire encima
        cy = hy - hh / 2 - AIRE * ch + ch / 2
        cx = 0.6 * hx + 0.4 * bx if not espaldas else bx
    else:
        cy = SH / 2
        cx = SW / 2 + (bx - SW / 2) * 0.3                      # en plano ancho apenas se sigue
    cx = min(max(cx, cw / 2), SW - cw / 2); cy = min(max(cy, ch / 2), SH - ch / 2)
    M = cv2.getRotationMatrix2D((cx, cy), rot, z)
    M[0, 2] += W / 2 - cx + dx; M[1, 2] += H / 2 - cy + dy
    off, vel = whip(tb)
    M[0, 2] += off * W
    out = cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    if vel > 0.05:                                             # desenfoque de movimiento horizontal del barrido
        L = int(8 + 180 * vel) | 1
        ker = np.zeros((1, L), np.float32); ker[0, :] = 1 / L
        out = cv2.filter2D(out, -1, ker)
    rgb = cv2.cvtColor(out, cv2.COLOR_BGR2RGB) / 255.0
    rgb = grade(rgb)
    # glitch suave: separación RGB + dos franjas desplazadas, 3 fotogramas
    for g in GLITCH:
        dtf = (tb - g) * P * FPS
        if 0 <= dtf < 3:
            sh = int(10 * (1 - dtf / 3))
            rgb[..., 0] = np.roll(rgb[..., 0], sh, axis=1); rgb[..., 2] = np.roll(rgb[..., 2], -sh, axis=1)
            for y0 in RNG.integers(200, H - 200, 2):
                rgb[y0:y0 + 40] = np.roll(rgb[y0:y0 + 40], int(RNG.integers(-40, 40)), axis=1)
    # glow: las altas luces sangran
    gb = brillo(t, tb)
    alto = np.clip(rgb - 0.68, 0, 1)
    peq = cv2.resize(alto, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    peq = cv2.GaussianBlur(peq, (0, 0), 9)
    rgb = rgb + gb * 1.6 * cv2.resize(peq, (W, H), interpolation=cv2.INTER_LINEAR)
    # light leak (pantalla)
    fl = fuga(t, tb)
    if fl > 0.01:
        L = capa_fuga(t) * fl
        rgb = 1 - (1 - np.clip(rgb, 0, 1)) * (1 - L)
    rgb = rgb * VIÑETA
    # grano de película (luminancia, algo suavizado)
    gr = RNG.normal(0, 0.022, (H // 2, W // 2)).astype(np.float32)
    gr = cv2.resize(cv2.GaussianBlur(gr, (0, 0), 0.6), (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
    rgb = np.clip(rgb + gr * (0.6 + 0.4 * (1 - rgb)), 0, 1)
    return cv2.cvtColor((rgb * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--solo", help="fotogramas sueltos para QA: 0,60,120")
    ap.add_argument("--out", default=str(RAIZ / "out/baile-video.mp4"))
    a = ap.parse_args()
    if a.solo:
        for n in map(int, a.solo.split(",")):
            cv2.imwrite(str(RAIZ / f"qa/r{n:04d}.png"), componer(n))
        return
    pathlib.Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "15",
                           "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709",
                           "-color_trc", "bt709", a.out], stdin=subprocess.PIPE)
    for n in range(NF):
        ff.stdin.write(componer(n).tobytes())
        if n % 30 == 0:
            print(f"  {n}/{NF}", flush=True)
    ff.stdin.close(); ff.wait()
    print(f"vídeo: {a.out} · {NF} fotogramas · {DUR:.2f} s")


if __name__ == "__main__":
    main()
