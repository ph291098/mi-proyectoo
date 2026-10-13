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

# Typecheck primero y con la salida ENTERA: el render de Remotion no avisa de errores
# de tipos (un campo de más en spans pasó dos veces sin verse porque se cortaba con tail).
if ! TSC_OUT=$(npx tsc --noEmit -p . 2>&1); then
  echo "$TSC_OUT" | grep -v "npm notice"
  echo "!! typecheck con errores: no se renderiza"; exit 1
fi

for c in $CUTS; do
  echo "=== $c ==="
  # crf 18 y bt709 explícito: sin esto Instagram reinterpreta el color y lava la imagen
  # HQ=1: fotogramas PNG (el jpeg por defecto de remotion.config.ts va al 80 %) y crf 10.
  # Para fuentes ya comprimidas, donde cada generación de pérdida se ve como bloques.
  if [ "${HQ:-0}" = 1 ]; then Q=(--crf 10 --image-format=png); else Q=(--crf 18); fi
  npx remotion render "$c" "out/$c.mp4" \
    --codec h264 "${Q[@]}" --audio-bitrate 320k \
    --color-space=bt709 --concurrency=3 2>&1 | tail -3
done
echo "RENDER_DONE"
