#!/usr/bin/env bash
# Interpola a 60 fps solo el tramo [ini, fin] de work/estable.mp4 y deja los fotogramas en work/f60/
# con su índice ABSOLUTO a 60 fps (ini debe ser múltiplo de 1/12 s: cae a la vez en un fotograma
# de 24 y de 60 fps). Se lanzan varios en paralelo: el filtro de interpolación usa un solo núcleo.
set -euo pipefail
ini=$1; fin=$2; dir=work/f60_tmp_$ini
mkdir -p "$dir" work/f60
ffmpeg -y -v error -i work/estable.mp4 \
  -vf "trim=start=$ini:end=$fin,setpts=PTS-STARTPTS,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none" \
  -q:v 2 "$dir/%04d.jpg"
off=$(python3 -c "print(round($ini*60))")
for f in "$dir"/*.jpg; do
  n=$((10#$(basename "$f" .jpg) - 1 + off + 1))
  mv "$f" "work/f60/$(printf %04d "$n").jpg"
done
rmdir "$dir"
echo "tramo $ini-$fin listo"
