#!/bin/bash
# Mide a qué nivel suenan los efectos y la música, SIN la voz.
#   ./scripts/mide_sfx.sh MiCorte [c1]
#
# Comparar mean_volume entre fuente y render no sirve (un efecto 13 dB bajo la voz
# aporta 0.2 dB) y restar pistas tampoco (no alinean a nivel de muestra). Lo que
# funciona es renderizar SOLO el audio con el vídeo silenciado — REMOTION_MUTE_VIDEO=1
# pone `muted` al OffthreadVideo de Plate.tsx — y medir el RMS en ventanas de 50 ms
# en el segundo de cada cue.
#
# Antes esto se hacía con un sed sobre Plate.tsx y falló en silencio: la etiqueta
# <OffthreadVideo va sola en su línea, el sed no casó y la «capa de efectos» medida
# llevaba la voz dentro.
#
# Objetivo con la voz picando en ~-10 dBFS: golpes −12/−16 · ticks −18/−24 · música −25/−30.
# Una lectura con «~» tiene otro cue a menos de 0.8 s: puede estar midiendo al vecino.
set -euo pipefail
cd "$(dirname "$0")/.."
ID="${1:?id de la composición}"; CID="${2:-c1}"
mkdir -p out
REMOTION_MUTE_VIDEO=1 npx remotion render src/index.ts "$ID" "out/sfx_$ID.wav" --codec=wav --log=error
python3 - "$ID" "$CID" <<'EOF'
import json, subprocess, sys, array, math
ID, CID = sys.argv[1], sys.argv[2]
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f"out/sfx_{ID}.wav", "-ac", "1", "-ar", "48000", "-f", "f32le", "-"],
                     capture_output=True).stdout
a = array.array("f"); a.frombytes(raw)
def pico(t0, d=0.8):
    i0, i1 = int(t0 * 48000), int((t0 + d) * 48000)
    best = 0.0
    for k in range(i0, max(i0 + 1, min(i1, len(a)) - 2400), 1200):
        s = a[k:k + 2400]; best = max(best, math.sqrt(sum(x * x for x in s) / 2400))
    return 20 * math.log10(best + 1e-9)
cfg = json.load(open("cortes.json"))[CID]
FINOS = ("tick", "tick_soft", "coin_1", "coin_2", "coin_3", "coin_4", "coin_5", "notify_a", "notify_b", "notify_c", "clock", "riser")
print(f"{'cue':12s} {'s':>7s} {'gain':>5s} {'pico':>7s}  objetivo")
cues_ord = sorted(cfg.get("sfx", []), key=lambda c: c["at"])
for i, c in enumerate(cues_ord):
    # la ventana acaba donde empieza el cue siguiente: si no, un tick a 0.2 s de un
    # whoosh mide el whoosh (y sale «ALTO» cuando no lo es)
    sig = next((x["at"] for x in cues_ord[i + 1:] if x["at"] > c["at"] + 0.01), c["at"] + 0.8)
    # pero nunca menos de 0.35 s: un braam que crece despacio mediría bajo. Si el
    # siguiente cae antes de 0.8 s la lectura va marcada «~»: puede llevar al vecino.
    gap = sig - c["at"]
    v = pico(c["at"], max(0.35, min(0.8, gap))); fino = c["s"] in FINOS
    lo, hi = (-24, -18) if fino else (-16, -12)
    marca = "✓" if lo <= v <= hi + 1 else ("BAJO" if v < lo else "ALTO")
    print(f"{c['s']:12s} {c['at']:7.2f} {c.get('gain', -18):5} {v:7.1f}{'~' if gap < 0.8 else ' '} {lo}/{hi} {marca}")
# música: mediana de ventanas de 1 s sin cues cerca
cues = [c["at"] for c in cfg.get("sfx", [])]
dur = len(a) / 48000
libres = [t for t in range(1, int(dur) - 1) if all(not (x - 0.2 <= t + 0.5 <= x + 1.4) for x in cues)]
if libres:
    vals = sorted(pico(t, 1.0) for t in libres)
    print(f"\nmúsica (mediana de {len(vals)} s sin cues): {vals[len(vals)//2]:.1f} dBFS   objetivo -30/-25")
EOF
