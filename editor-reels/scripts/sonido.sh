#!/usr/bin/env bash
# out/<nombre>-raw.mp4 -> out/<nombre>.mp4 a -14 LUFS con voz comprimida (estilo.md §8: LRA ≈ 2)
set -euo pipefail
IN=$1; OUT=$2
F="highpass=f=80,acompressor=threshold=-24dB:ratio=3:attack=5:release=120:makeup=2"
read -r I TP LRA TH < <(ffmpeg -hide_banner -nostats -i "$IN" -af "$F,loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json" -f null - 2>&1 \
  | python3 -c "import sys,json;t=sys.stdin.read();j=json.loads(t[t.rindex('{'):]);print(j['input_i'],j['input_tp'],j['input_lra'],j['input_thresh'])")
ffmpeg -y -v error -i "$IN" -c:v copy -bsf:v h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1 \
  -af "$F,loudnorm=I=-14:TP=-1.5:LRA=7:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:linear=true,aresample=48000" \
  -c:a aac -b:a 256k -movflags +faststart "$OUT"
ffmpeg -hide_banner -nostats -i "$OUT" -af loudnorm=I=-14:print_format=summary -f null - 2>&1 | grep -E "Input Integrated|Input True Peak|Input LRA"
