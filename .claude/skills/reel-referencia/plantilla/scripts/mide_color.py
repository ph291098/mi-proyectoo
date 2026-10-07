#!/usr/bin/env python3
"""RGB medio de zonas de un fotograma, para corregir el color midiendo y no a ojo.

  uv run --with pillow python scripts/mide_color.py qa/f.png "pared:300,60,800,180" "piel:470,1000,600,1060"

Una zona neutra (pared blanca, techo, camiseta gris) debería salir con R≈G≈B; la piel, con
R > G > B (si B > G, la piel se ha ido a magenta: has corregido de más). Prueba filtros con
  ffmpeg -ss 10 -i public/fuente.mp4 -frames:v 1 -vf "curves=b='0/0 0.34/0.43 1/1'" qa/f.png
y vuelve a medir.
"""
import sys
from PIL import Image

im = Image.open(sys.argv[1]).convert("RGB")
for arg in sys.argv[2:]:
    nombre, caja = arg.split(":")
    x0, y0, x1, y1 = map(int, caja.split(","))
    px = [im.getpixel((x, y)) for x in range(x0, x1, 4) for y in range(y0, y1, 4)]
    rgb = tuple(round(sum(p[i] for p in px) / len(px)) for i in range(3))
    print(f"{nombre:>12}: {rgb}")
