#!/bin/bash
# out/*.mp4 -> final/*.mp4 normalizado a -14 LUFS.
#
# POR QUÉ COMPRIME ANTES DE NORMALIZAR:
# el audio de sala tiene cresta de 19-22 dB. Subir 22 dB para llegar a -14
# pondría el pico en +5..+8 dBFS, y el limitador de loudnorm no recorta tanto:
# baja la ganancia y el archivo se queda 1-2 LU corto. Por eso se REDUCE la
# cresta antes (highpass del retumbe de sala + compresor suave) y solo después
# se normaliza, con las dos pasadas medidas sobre la cadena YA comprimida.
#
# Si la fuente es voz de micro cercano y limpia (no sala), baja el compresor
# a ratio=2 o quítalo: comprimir de más aplasta la dinámica de la voz.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p final

PRE="${PRE:-highpass=f=80,acompressor=threshold=-26dB:ratio=3:attack=5:release=140:makeup=1}"
# VIDEO=copy: no recomprime la imagen, solo procesa el audio. Para fuentes que ya llegan
# justas (p.ej. un export de CapCut a 720p y 2.2 Mbps): los 6 Mbps de abajo
# sobre un render ya comprimido las dejaban pixeladas. Exige renderizar con calidad alta
# (render.sh con HQ=1). ONLY="Id1 Id2" limita qué renders de out/ se exportan.
VIDEO="${VIDEO:-x264}"
ONLY="${ONLY:-}"
if [ "$VIDEO" = copy ]; then
  VARGS=(-c:v copy)
else
  VARGS=(-c:v libx264 -b:v 6M -maxrate 8M -bufsize 12M -preset slow -pix_fmt yuv420p
         -x264-params "colorprim=bt709:transfer=bt709:colormatrix=bt709")
fi

for f in out/*.mp4; do
  [ -e "$f" ] || { echo "no hay nada en out/"; exit 1; }
  b=$(basename "$f" .mp4)
  if [ -n "$ONLY" ] && [[ " $ONLY " != *" $b "* ]]; then continue; fi
  M=$(ffmpeg -hide_banner -nostats -i "$f" -af "$PRE,loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 \
      | python3 -c "import sys,re;t=sys.stdin.read();m=re.search(r'\{[^{]*input_i.*?\}',t,re.S);print(m.group(0) if m else '')")
  [ -z "$M" ] && { echo "!! $b sin medida"; continue; }
  eval "$(echo "$M" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print(f\"I={d['input_i']} TP={d['input_tp']} LRA={d['input_lra']} TH={d['input_thresh']}\")")"
  ffmpeg -v error -y -i "$f" \
    -af "$PRE,loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:linear=false,aresample=48000" \
    "${VARGS[@]}" \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
    -c:a aac -b:a 256k -ar 48000 -movflags +faststart "final/$b.mp4"
  echo "  $b: tras comprimir I=$I TP=$TP"
done
# Con audio de CapCut (ya limitado, pico +0.4) y efectos encima, la mezcla del render
# llega a +4..+5 dBFS y loudnorm se queda 0.4-0.5 LU corto SIEMPRE. Se mide el resultado
# y, si está fuera de ±0.3 LU, se pasa fixaudio.sh sin esperar a que alguien lo vea.
NEED=0
for f in final/*.mp4; do
  I=$(ffmpeg -hide_banner -nostats -i "$f" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 \
      | python3 -c "import sys,json,re;t=sys.stdin.read();m=re.search(r'\{[^{]*input_i.*?\}',t,re.S);print(json.loads(m.group(0))['input_i'] if m else 0)")
  python3 -c "import sys; sys.exit(0 if abs(-14.0-($I))<=0.3 else 1)" || { echo "  $(basename "$f" .mp4): $I LUFS, fuera de ±0.3 -> fixaudio"; NEED=1; }
done
[ "$NEED" = 1 ] && "$(dirname "$0")/fixaudio.sh"
echo "EXPORT_DONE"
