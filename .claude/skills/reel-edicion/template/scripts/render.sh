#!/bin/bash
# Render de composiciones a out/. Sin argumentos, renderiza TODAS las que
# declare Root.tsx; con argumentos, solo esas.
#   ./scripts/render.sh
#   ./scripts/render.sh Corte1 Corte2
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out

# macOS trae bash 3.2: nada de mapfile ni arrays asociativos.
if [ $# -gt 0 ]; then
  CUTS="$*"
else
  # la lista sale del propio proyecto, no de una copia a mano
  # solo las lineas de composicion de verdad: <id> <fps> <ancho>x<alto> ...
  # (no basta con saltar cabeceras: "The following compositions..." tambien pasa)
  CUTS=$(npx remotion compositions src/index.ts 2>/dev/null \
         | awk '$2 ~ /^[0-9]+$/ && $3 ~ /^[0-9]+x[0-9]+$/ {print $1}')
fi
[ -z "$CUTS" ] && { echo "no se encontraron composiciones"; exit 1; }

for c in $CUTS; do
  echo "=== $c ==="
  # crf 18 y bt709 explícito: sin esto Instagram reinterpreta el color y lava la imagen
  npx remotion render "$c" "out/$c.mp4" \
    --codec h264 --crf 18 --audio-bitrate 256k \
    --color-space=bt709 --concurrency=3 2>&1 | tail -3
done
echo "RENDER_DONE"
