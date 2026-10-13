#!/usr/bin/env python3
"""¿Pantalla dividida o cámara completa? Tramo a tramo, al fotograma.

  uv run --with numpy python scripts/layout.py --src public/c1.mp4 [--cid c1]

Un export de CapCut puede ALTERNAR split screen (captura arriba, cámara abajo) y
cámara a cuadro completo — por ejemplo, split de 0 a 3 s y de 6 a 66 s, y cámara
completa el resto. Los subtítulos de la costura, puestos a
cámara completa, caen sobre la boca; y la junta del scrim, sobre la barba. Hay que
saber dónde cambia.

CÓMO: la costura es un borde HORIZONTAL nítido que dura todo el split. Para cada
fotograma se mide el salto de luminancia entre las filas de encima y de debajo de
cada altura, relativo a la textura normal de ese fotograma (un terminal oscuro
sobre la pared oscura del set da un salto de solo 14, pero la textura es 1-2). La
altura que más fotogramas marcan es la costura; luego cada fotograma es split si
su salto en esa altura destaca. Los cambios se afinan a fotograma completo y los
tramos de menos de 0.25 s (glitches de las transiciones de CapCut) se funden.

Escribe work/<cid>_layout.json: { seam_y, split: [[a,b]...], full: [[a,b]...],
cap_zones } — gen_data.py lee `split` si cortes.json no lo declara, y las
cap_zones son una SUGERENCIA ya ajustada a las palabras (un cambio no parte una
palabra por la mitad) para copiar a cortes.json.
"""
import argparse, json, pathlib, re, subprocess
import numpy as np

RAIZ = pathlib.Path(__file__).resolve().parent.parent
Y0, Y1 = 560, 1320          # dónde se busca la costura (los splits de CapCut van a ~840-960)
COLS = 108
MIN_TRAMO = 0.25

def probe(src):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=r_frame_rate:format=duration", "-of", "json", src], capture_output=True, text=True).stdout
    j = json.loads(out)
    n, d = j["streams"][0]["r_frame_rate"].split("/")
    return float(n) / float(d), float(j["format"]["duration"])

def filas(src, fps_muestra, ss=None, dur=None):
    cmd = ["ffmpeg", "-v", "error"]
    if ss is not None: cmd += ["-ss", f"{ss:.3f}", "-t", f"{dur:.3f}"]
    vf = f"crop=1080:{Y1-Y0}:0:{Y0},scale={COLS}:{Y1-Y0},format=gray"
    if fps_muestra: vf = f"fps={fps_muestra}," + vf
    raw = subprocess.run(cmd + ["-i", src, "-vf", vf, "-f", "rawvideo", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, Y1 - Y0, COLS).astype(np.float32).mean(axis=2)

def saltos(r):
    """|media(y-6..y-2) - media(y+2..y+6)| por fila; r: (n, filas)."""
    c = np.cumsum(np.pad(r, ((0, 0), (1, 0))), axis=1)
    arriba = (c[:, 4:-8] - c[:, 0:-12]) / 4       # filas y-6..y-3
    abajo = (c[:, 12:] - c[:, 8:-4]) / 4          # filas y+2..y+5
    d = np.abs(arriba - abajo)
    return np.pad(d, ((0, 0), (6, 6)))

def es_split(d, y):
    fondo = np.median(d, axis=1) + 1.0
    pico = d[:, max(0, y - 3):y + 4].max(axis=1)
    return (pico > 6) & (pico > 3.5 * fondo)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="public/c1.mp4")
    ap.add_argument("--cid", default="c1")
    ap.add_argument("--muestra", type=float, default=10, help="fps del primer barrido")
    a = ap.parse_args()
    src = str(RAIZ / a.src) if not pathlib.Path(a.src).is_absolute() else a.src
    fps, dur = probe(src)

    r = filas(src, a.muestra)
    d = saltos(r)
    fondo = np.median(d, axis=1, keepdims=True) + 1.0
    votos = ((d > 6) & (d > 3.5 * fondo)).sum(axis=0)
    y = int(votos.argmax())
    seam = Y0 + y
    frac = votos[y] / len(d)
    print(f"costura en y ≈ {seam} (la marcan {frac*100:.0f} % de las muestras)")
    if frac < 0.08:
        print("no hay pantalla dividida: todo es cámara completa")
        res = {"seam_y": None, "split": [], "full": [[0, round(dur, 3)]], "cap_zones": []}
        json.dump(res, open(RAIZ / "work" / f"{a.cid}_layout.json", "w"), indent=1)
        return

    m = es_split(d, y)
    t = np.arange(len(m)) / a.muestra
    # cambios afinados a fotograma completo: se decodifica ±1 muestra alrededor
    cambios = []
    for i in range(1, len(m)):
        if m[i] != m[i - 1]:
            ss = max(0, t[i - 1] - 0.05)
            rr = filas(src, None, ss=ss, dur=1.0 / a.muestra + 0.1)
            mm = es_split(saltos(rr), y)
            k = next((j for j in range(1, len(mm)) if mm[j] != mm[j - 1] and mm[j] == m[i]), None)
            cambios.append((round(ss + (k if k is not None else len(mm) / 2) / fps, 3), bool(m[i])))
    # tramos
    tramos, ini, estado = [], 0.0, bool(m[0])
    for tc, nuevo in cambios:
        tramos.append([ini, tc, estado]); ini, estado = tc, nuevo
    tramos.append([ini, round(dur, 3), estado])
    # fundir los tramos cortos (glitches de transición) con el anterior
    limpio = []
    for tr in tramos:
        if limpio and (tr[1] - tr[0] < MIN_TRAMO or tr[2] == limpio[-1][2]):
            limpio[-1][1] = tr[1]
        else:
            limpio.append(tr)
    # el primero no tiene anterior: si es corto (un fundido de entrada), manda el siguiente
    if len(limpio) > 1 and limpio[0][1] - limpio[0][0] < MIN_TRAMO:
        limpio[1][0] = limpio[0][0]; limpio.pop(0)
    fusion = []
    for tr in limpio:
        if fusion and tr[2] == fusion[-1][2]: fusion[-1][1] = tr[1]
        else: fusion.append(tr)
    split = [[round(x, 3), round(y2, 3)] for x, y2, s in fusion if s]
    full = [[round(x, 3), round(y2, 3)] for x, y2, s in fusion if not s]

    # sugerencia de cap_zones ajustada a las palabras
    theme = (RAIZ / "src" / "theme.ts").read_text()
    mcap = re.search(r"CAPTION_CY\s*=\s*(\d+)", theme)
    cap_full = int(mcap.group(1)) if mcap else 1290
    wf = RAIZ / "work" / f"{a.cid}_words.json"
    words = json.load(open(wf)) if wf.exists() else []
    def ajusta(b):
        for w in words:
            if w["start"] < b < w["end"]:
                return round(w["end"] + 0.02, 2) if w["end"] - b < 0.35 else round(w["start"] - 0.02, 2)
        return round(b, 2)
    zonas = []
    for x, y2, s in fusion:
        z = {"start": ajusta(x) if x > 0 else 0, "end": ajusta(y2) if y2 < dur - 0.01 else 999}
        z.update({"cy": seam + 87, "size": 60, "maxWords": 3} if s else {"cy": cap_full, "size": 64, "maxWords": 3})
        zonas.append(z)

    res = {"seam_y": seam, "split": split, "full": full, "cap_zones": zonas}
    json.dump(res, open(RAIZ / "work" / f"{a.cid}_layout.json", "w"), indent=1)
    for x, y2, s in fusion:
        print(f"  {x:7.3f} → {y2:7.3f}  {'SPLIT' if s else 'cámara completa'}")
    print(f"-> work/{a.cid}_layout.json  (cap_zones sugeridas: costura cy {seam + 87}, cámara completa cy {cap_full})")

if __name__ == "__main__":
    main()
