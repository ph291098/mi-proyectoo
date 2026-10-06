#!/usr/bin/env bash
# out/<nombre>-raw.mp4 -> out/<nombre>.mp4 a -14 LUFS con voz comprimida (estilo.md §8: LRA ≈ 2)
#
#   scripts/sonido.sh out/x-raw.mp4 out/x.mp4                      # solo voz (+ efectos del render)
#   scripts/sonido.sh out/x-raw.mp4 out/x.mp4 public/musica.wav    # + música de fondo con ducking
#
# Música: se lleva a MUSICA_LUFS (por defecto -29: «de fondo, no muy alta») y además se
# agacha unos 6 dB mientras hay voz (sidechaincompress con la voz como llave), así que en
# las pausas respira y debajo de la voz no compite. Fundido de salida de 1,5 s.
set -euo pipefail
IN=$1; OUT=$2; MUS=${3:-}
F="highpass=f=80,acompressor=threshold=-24dB:ratio=3:attack=5:release=120:makeup=2"
MUSICA_LUFS=${MUSICA_LUFS:--29}

if [ -n "$MUS" ]; then
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
  ML=$(ffmpeg -hide_banner -nostats -i "$MUS" -af loudnorm=print_format=json -f null - 2>&1 \
       | python3 -c "import sys,json;t=sys.stdin.read();print(json.loads(t[t.rindex('{'):])['input_i'])")
  G=$(python3 -c "print(round($MUSICA_LUFS - ($ML), 2))")
  FO=$(python3 -c "print(max(0, round($DUR - 1.5, 2)))")
  MIX="[0:a]$F,asplit=2[v][llave];[1:a]atrim=0:$DUR,volume=${G}dB,afade=t=out:st=$FO:d=1.5[m];\
[m][llave]sidechaincompress=threshold=0.03:ratio=4:attack=30:release=400:makeup=1[md];[v][md]amix=inputs=2:normalize=0:duration=first"
  ENTRADAS=(-i "$IN" -i "$MUS")
else
  MIX="[0:a]$F"
  ENTRADAS=(-i "$IN")
fi

read -r I TP LRA TH < <(ffmpeg -hide_banner -nostats "${ENTRADAS[@]}" -filter_complex "$MIX,loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json" -f null - 2>&1 \
  | python3 -c "import sys,json;t=sys.stdin.read();j=json.loads(t[t.rindex('{'):]);print(j['input_i'],j['input_tp'],j['input_lra'],j['input_thresh'])")
ffmpeg -y -v error "${ENTRADAS[@]}" -map 0:v -c:v copy \
  -bsf:v h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1 \
  -filter_complex "$MIX,loudnorm=I=-14:TP=-1.5:LRA=7:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:linear=true,aresample=48000[a]" \
  -map "[a]" -c:a aac -b:a 256k -movflags +faststart "$OUT"
ffmpeg -hide_banner -nostats -i "$OUT" -af loudnorm=I=-14:print_format=summary -f null - 2>&1 | grep -E "Input Integrated|Input True Peak|Input LRA"
