#!/usr/bin/env python3
"""Descarga el kit de SFX desde Freesound y lo deja listo para montar.

Kit COMPARTIDO en la biblioteca del perfil (por defecto ~/ReelKit/sfx) — se genera una
vez y se reutiliza en todas las piezas. Que el whoosh sea siempre el mismo es lo que
hace que suene "tuyo"; regenerarlo por reel sería ruido, no identidad.

Los ids de abajo son un KIT DE PARTIDA neutro. Para el tuyo: busca con sfx_search.py,
escucha, y escribe tus elecciones en <KIT>/picks.json ({"slot": [id, "para qué"]}):
manda sobre la lista de abajo.

Todo CC0: sin atribución y sin reclamaciones de copyright en Reels ni TikTok.

Cada sonido se procesa igual:
  1. se recorta el silencio de cabeza  (si no, el golpe llega tarde y desincroniza)
  2. se normaliza el pico a -3 dBFS    (para que las ganancias del montaje sean predecibles)
  3. se saca a WAV 48 kHz estéreo      (mismo sample rate que el render, sin remuestreo)
"""
import json, os, pathlib, re, subprocess, sys, urllib.request
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from perfil import KIT

KEY = os.environ["FREESOUND_API_KEY"]

# slot -> (freesound id, para qué es)
PICKS = {
    "impact":    (648729, "entra el título: esto va en serio"),
    "hit":       (686282, "cae el VS: choque metálico seco"),
    "whoosh_in": (786514, "entra una tarjeta"),
    "tick":      (384187, "entra un chip: precisión, control"),
    "riser":     (648732, "la tesis: ahora escucha"),
    "sub_drop":  (755054, "punch-in: énfasis grave"),
    "notify_a":  (750607, "aviso 1 (llega un mensaje)"),
    "notify_b":  (750608, "aviso 2"),
    "notify_c":  (750609, "aviso 3"),
    "chime":     (789596, "chip de keyword: invitación"),
    "close":     (754771, "cierre: resolución con cola"),
}

def api(sid):
    url = (f"https://freesound.org/apiv2/sounds/{sid}/"
           "?fields=id,name,license,duration,previews,username,url")
    req = urllib.request.Request(url, headers={"Authorization": f"Token {KEY}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def peak_db(path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path),
                        "-af", "volumedetect", "-f", "null", "-"],
                       capture_output=True, text=True)
    m = re.search(r"max_volume:\s*(-?[\d.]+) dB", p.stderr)
    return float(m.group(1)) if m else 0.0

KIT.mkdir(parents=True, exist_ok=True)
manifest = {}
_propios = KIT / "picks.json"
if _propios.exists():
    PICKS = {k: tuple(v) for k, v in json.loads(_propios.read_text()).items()}
KIT.mkdir(parents=True, exist_ok=True)

for slot, (sid, why) in PICKS.items():
    info = api(sid)
    raw = KIT / f".raw_{slot}.mp3"
    urllib.request.urlretrieve(info["previews"]["preview-hq-mp3"], raw)

    # 1+3: recorte de cabeza y formato de destino
    tmp = KIT / f".tmp_{slot}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw),
                    "-af", "silenceremove=start_periods=1:start_silence=0:start_threshold=-50dB",
                    "-ar", "48000", "-ac", "2", str(tmp)], check=True)
    # 2: normalización de pico a -3 dBFS
    gain = -3.0 - peak_db(tmp)
    out = KIT / f"{slot}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp),
                    "-af", f"volume={gain:.2f}dB", "-ar", "48000", "-ac", "2", str(out)], check=True)
    raw.unlink(); tmp.unlink()

    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                "-of", "csv=p=0", str(out)], capture_output=True, text=True).stdout)
    manifest[slot] = {"id": info["id"], "name": info["name"], "author": info["username"],
                      "license": info["license"], "url": info["url"], "para": why,
                      "duracion": round(dur, 3), "ganancia_aplicada_db": round(gain, 2)}
    print(f"  {slot:<10} {dur:5.2f}s  gain {gain:+6.2f} dB  ·  {info['name'][:40]}")

# whoosh_out se DERIVA del de entrada: invertido y más apagado. Entrada y salida
# emparentadas pero no idénticas — la misma regla que las animaciones.
src, out = KIT / "whoosh_in.wav", KIT / "whoosh_out.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src),
                "-af", "areverse,lowpass=f=3200,volume=-2dB", str(out)], check=True)
manifest["whoosh_out"] = {"derivado_de": "whoosh_in", "proceso": "areverse + lowpass 3.2k + -2 dB",
                          "para": "sale una tarjeta", "license": manifest["whoosh_in"]["license"]}
print(f"  {'whoosh_out':<10} derivado de whoosh_in (invertido + lowpass)")

(KIT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
print(f"\nkit -> {KIT}  ({len(manifest)} sonidos)")
