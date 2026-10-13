#!/usr/bin/env bash
# Extrae TODO lo que hace falta para escribir estilo.md a partir de un vídeo de referencia.
#
#   scripts/analiza_referencia.sh work/referencia.mp4 [work/ref]
#
# Deja en la carpeta de salida:
#   f2/f_###.jpg        2 fotogramas por segundo (360 px de ancho)
#   escenas/e_###.jpg   un fotograma por cada cambio de plano (scene > 0.25) + cortes.txt
#   hoja0..N.jpg        hojas de contacto de 12 fotogramas con el segundo impreso (para LEERLAS)
#   full_<t>.png        fotogramas a 1080x1920 para medir colores y posiciones
#   audio.wav           mono 16 kHz  ·  audio.json  transcripción de Whisper por palabra
#   resumen.txt         resolución, fps, duración, planos, silencios, sonoridad, palabras/min
set -euo pipefail
REF=$1; OUT=${2:-work/ref}
mkdir -p "$OUT/f2" "$OUT/escenas"

ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate:format=duration -of compact "$REF" > "$OUT/resumen.txt"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$REF")

ffmpeg -y -v error -i "$REF" -vf "fps=2,scale=360:-2" "$OUT/f2/f_%03d.jpg"
ffmpeg -v info -i "$REF" -vf "select='gt(scene,0.25)',showinfo,scale=360:-2" -vsync vfr "$OUT/escenas/e_%03d.jpg" 2>&1 \
  | grep -o "pts_time:[0-9.]*" | cut -d: -f2 > "$OUT/cortes.txt" || true

N=$(ls "$OUT/f2" | wc -l); H=$(( (N + 11) / 12 ))
for i in $(seq 0 $((H - 1))); do
  s=$((i * 12 + 1))
  ffmpeg -y -v error -start_number $s -i "$OUT/f2/f_%03d.jpg" -frames:v 12 \
    -vf "drawtext=text='%{eif\:($s-1+n)/2\:d}.%{eif\:mod($s-1+n,2)*5\:d}s':x=6:y=6:fontsize=22:fontcolor=red:box=1:boxcolor=white@0.7,tile=6x2:padding=3" \
    -frames:v 1 "$OUT/hoja$i.jpg" 2>/dev/null || true
done
for t in $(python3 -c "d=$DUR; print(' '.join(f'{d*k/6:.1f}' for k in range(1,6)))"); do
  ffmpeg -y -v error -ss "$t" -i "$REF" -frames:v 1 -vf "scale=1080:1920" "$OUT/full_$t.png"
done

ffmpeg -y -v error -i "$REF" -vn -ac 1 -ar 16000 "$OUT/audio.wav"
{
  echo "--- planos (s) ---"
  python3 - "$OUT/cortes.txt" "$DUR" <<'EOF'
import sys
c = [0.0] + [float(x) for x in open(sys.argv[1]) if x.strip()] + [float(sys.argv[2])]
d = [round(b - a, 2) for a, b in zip(c, c[1:])]
print(f"{len(d)} planos: {d}\nmedia {sum(d)/len(d):.2f} s")
EOF
  echo "--- silencios > 0,3 s (-35 dB) ---"
  ffmpeg -hide_banner -nostats -i "$OUT/audio.wav" -af "silencedetect=n=-35dB:d=0.3" -f null - 2>&1 | grep -c silence_start || true
  echo "--- sonoridad ---"
  ffmpeg -hide_banner -nostats -i "$REF" -af loudnorm=I=-14:print_format=summary -f null - 2>&1 | grep -E "Input Integrated|Input True Peak|Input LRA"
} >> "$OUT/resumen.txt"

# Transcripción por palabra: mlx-whisper en Mac con Apple Silicon, openai-whisper en lo demás
if [ "$(uname -s)" = Darwin ] && [ "$(uname -m)" = arm64 ]; then
  uvx --python 3.11 --from mlx-whisper mlx_whisper "$OUT/audio.wav" --model mlx-community/whisper-large-v3-turbo \
    --language es --word-timestamps True --output-format json --output-dir "$OUT" >/dev/null
else
  uvx --from openai-whisper whisper "$OUT/audio.wav" --model turbo --language es \
    --word_timestamps True --output_format json --output_dir "$OUT" >/dev/null 2>&1
fi
python3 - "$OUT/audio.json" >> "$OUT/resumen.txt" <<'EOF'
import json, sys
d = json.load(open(sys.argv[1])); w = [x for s in d["segments"] for x in s["words"]]
print("--- transcripción ---")
for s in d["segments"]:
    print(f"{s['start']:6.2f}-{s['end']:6.2f} {s['text'].strip()}")
if w:
    print(f"{len(w)} palabras · {len(w) / (w[-1]['end'] - w[0]['start']) * 60:.0f} palabras/min")
EOF
cat "$OUT/resumen.txt"
echo "hojas de contacto: $OUT/hoja*.jpg — léelas TODAS antes de escribir estilo.md"
