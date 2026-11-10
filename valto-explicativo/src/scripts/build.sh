#!/usr/bin/env bash
# Renderiza los dos formatos en paralelo (2 tramos cada uno) y los une con la mezcla de audio.
# Uso: build.sh <carpeta de trabajo> <mezcla.wav> <carpeta de salida>
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; WORK="$1"; MIX="$2"; OUT="$3"
mkdir -p "$WORK/seg"
for fmt in v h; do
  node "$HERE/render.js" $fmt "$WORK/seg/$fmt-a.mp4" 0 891 &
  node "$HERE/render.js" $fmt "$WORK/seg/$fmt-b.mp4" 891 1782 &
done
wait
for fmt in v h; do
  name=$([ $fmt = v ] && echo vertical || echo horizontal)
  printf "file '%s'\nfile '%s'\n" "$WORK/seg/$fmt-a.mp4" "$WORK/seg/$fmt-b.mp4" > "$WORK/seg/$fmt.txt"
  ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$WORK/seg/$fmt.txt" -i "$MIX" -map 0:v -map 1:a \
    -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart "$OUT/valto-explicativo-$name.mp4"
done
echo BUILD_OK
