#!/usr/bin/env python3
"""Transcripción por palabra + cortes de silencio -> src/data/montaje.json

  python3 scripts/montaje.py            # lee montaje.config.json

1. Palabras de Whisper (work/mi/audio.json) con las correcciones de `fix` (por índice).
2. Silencios: un hueco SIN palabras de más de `max_silencio` s se corta. Además se
   descuentan los silencios reales del audio (silencedetect), porque Whisper alarga
   la palabra dentro del silencio (p. ej. «Hey» 19.38 -> en realidad 19.82).
3. Cada tramo conservado lleva `pad_in`/`pad_out` para no comerse ataques ni colas.
4. Los tiempos de cada palabra se pasan a la línea de tiempo de SALIDA.
"""
import json, pathlib, re, subprocess

RAIZ = pathlib.Path(__file__).resolve().parent.parent
cfg = json.loads((RAIZ / "montaje.config.json").read_text())
FPS = 30

d = json.loads((RAIZ / cfg["whisper"]).read_text())
words = [{"text": w["word"].strip(), "start": w["start"], "end": w["end"]}
         for s in d["segments"] for w in s["words"]]
for k, v in cfg.get("fix", {}).items():
    if k.startswith("_"):
        continue
    words[int(k)]["text"] = v

# silencios reales del audio
out = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(RAIZ / cfg["audio"]), "-af",
                      f"silencedetect=n={cfg['umbral_db']}dB:d={cfg['max_silencio']}", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
ini = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
fin = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
silencios = list(zip(ini, fin))

# recorta cada palabra contra los silencios reales (sin dejarla a menos de 0.06 s)
for w in words:
    for a, b in silencios:
        if a <= w["start"] < b and b < w["end"] - 0.06:
            w["start"] = b
        if a < w["end"] <= b and a > w["start"] + 0.06:
            w["end"] = a

# tramos de habla: palabras separadas por <= max_silencio se funden
tramos = []
for w in words:
    if tramos and w["start"] - tramos[-1][1] <= cfg["max_silencio"]:
        tramos[-1][1] = max(tramos[-1][1], w["end"])
    else:
        tramos.append([w["start"], w["end"]])
dur_fuente = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                   str(RAIZ / cfg["video"])], capture_output=True, text=True).stdout)
seg, t_out = [], 0.0
for a, b in tramos:
    a = max(0.0, a - cfg["pad_in"]); b = min(dur_fuente, b + cfg["pad_out"])
    if seg and a <= seg[-1]["to"]:          # los pads se solapan: un solo tramo
        t_out += b - seg[-1]["to"]; seg[-1]["to"] = b; continue
    # a fotogramas enteros para que no haya deriva
    fa, fb = round(a * FPS), round(b * FPS)
    seg.append({"from": fa / FPS, "to": fb / FPS, "outStart": round(t_out * FPS) / FPS})
    t_out += (fb - fa) / FPS
for s in seg:
    s["fromF"], s["toF"], s["outF"] = round(s["from"] * FPS), round(s["to"] * FPS), round(s["outStart"] * FPS)
total_f = seg[-1]["outF"] + seg[-1]["toF"] - seg[-1]["fromF"]

def a_salida(t):
    for s in seg:
        if s["from"] - 1e-6 <= t <= s["to"] + 1e-6:
            return s["outStart"] + (t - s["from"])
    return None

palabras = []
for i, w in enumerate(words):
    a, b = a_salida(w["start"]), a_salida(w["end"])
    palabras.append({"i": i, "text": w["text"], "start": round(a, 3), "end": round(b, 3),
                     "src": round(w["start"], 3)})

def mapa(t):  # tiempo de la fuente -> salida (para escenas declaradas en tiempos de fuente)
    v = a_salida(t)
    if v is None:  # cae en un hueco cortado: va al inicio del siguiente tramo
        v = next(s["outStart"] for s in seg if s["from"] > t)
    return round(v, 3)

escenas = []
for e in cfg.get("escenas", []):
    e = {k: v for k, v in e.items() if not k.startswith("_")}
    e["start"], e["end"] = mapa(e.pop("srcStart")), mapa(e.pop("srcEnd"))
    if "expandAt" in e:
        e["expandAt"] = mapa(e["expandAt"])
    escenas.append(e)

data = {"video": cfg["video_public"], "durationInFrames": total_f, "segments": seg,
        "words": palabras, "blocks": [{k: v for k, v in b.items() if not k.startswith("_")} for b in cfg["bloques"]],
        "escenas": escenas, "handle": cfg["handle"], "zooms": cfg["zooms"]}
(RAIZ / "src" / "data").mkdir(exist_ok=True)
(RAIZ / "src" / "data" / "montaje.json").write_text(json.dumps(data, ensure_ascii=False, indent=1))

print(f"silencios reales: {[(round(a,2), round(b,2)) for a, b in silencios]}")
print(f"{len(seg)} tramos · fuente {dur_fuente:.2f} s -> salida {total_f / FPS:.2f} s "
      f"({dur_fuente - total_f / FPS:.2f} s de silencio fuera)")
for s in seg:
    print(f"  fuente {s['from']:6.2f} -> {s['to']:6.2f}   salida {s['outStart']:6.2f}")
