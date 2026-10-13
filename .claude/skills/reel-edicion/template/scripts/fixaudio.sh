#!/bin/bash
# Repaso de loudness sobre final/*.mp4, SIN recodificar vídeo (-c:v copy).
#
# loudnorm con linear=true se queda corto cuando el techo de pico limita la
# ganancia. Se mide, se aplica ganancia + alimiter, y se ITERA hasta ±0.3 LU.
# Úsalo solo si export.sh dejó algún corte fuera de rango.
set -euo pipefail
cd "$(dirname "$0")/.."

mid() { ffmpeg -hide_banner -nostats -i "$1" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 \
        | python3 -c "import sys,json,re;t=sys.stdin.read();m=re.search(r'\{[^{]*input_i.*?\}',t,re.S);print(json.loads(m.group(0))['input_i'] if m else 0)"; }

for f in final/*.mp4; do
  [ -e "$f" ] || { echo "no hay nada en final/"; exit 1; }
  b=$(basename "$f" .mp4); cur="$f"
  for i in 1 2 3; do
    I=$(mid "$cur")
    G=$(python3 -c "print(round(-14.0 - ($I), 3))")
    OK=$(python3 -c "print(1 if abs($G) <= 0.3 else 0)")
    if [ "$OK" = "1" ]; then echo "  $b: $I LUFS ✓ (iter $i)"; break; fi
    ffmpeg -v error -y -i "$cur" -c:v copy \
      -af "volume=${G}dB,alimiter=level_in=1:level_out=1:level=0:limit=0.84:attack=5:release=50" \
      -c:a aac -b:a 256k -ar 48000 -movflags +faststart "final/${b}__t.mp4"
    mv "final/${b}__t.mp4" "final/${b}.mp4"; cur="final/${b}.mp4"
    echo "  $b: iter $i  medido $I → ganancia ${G} dB"
  done
done
echo "FIXAUDIO_DONE"
