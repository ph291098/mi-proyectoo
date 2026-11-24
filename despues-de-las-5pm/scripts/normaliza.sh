#!/usr/bin/env bash
# Lleva una mezcla a -14 LUFS integrados con pico real <= -1.5 dBTP.
# Sube la ganancia y limita en dos pasadas, porque el limitador baja algo la sonoridad.
# Uso: normaliza.sh entrada.wav salida.wav
set -euo pipefail
tmp="$(mktemp --suffix=.wav)"
lufs() { ffmpeg -hide_banner -i "$1" -af ebur128 -f null - 2>&1 | awk '/Summary:/{f=1} f&&/I:/{print $2; exit}'; }
G=$(python3 -c "print(round(-14-($(lufs "$1")),2))")
for paso in 1 2 3; do
  ffmpeg -hide_banner -loglevel error -y -i "$1" -af "volume=${G}dB,alimiter=limit=0.75:attack=2:release=80:level=false" "$tmp"
  G=$(python3 -c "print(round($G+(-14-($(lufs "$tmp"))),2))")
done
ffmpeg -hide_banner -loglevel error -y -i "$1" -af "volume=${G}dB,alimiter=limit=0.75:attack=2:release=80:level=false" "$2"
rm -f "$tmp"
ffmpeg -hide_banner -i "$2" -af ebur128=peak=true -f null - 2>&1 | awk '/Summary:/{f=1} f' | grep -E 'I:|LRA:|Peak:' | tr -s ' ' | tr '\n' ' '; echo " <- $2"
