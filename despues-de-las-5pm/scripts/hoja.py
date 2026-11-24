"""Hoja de contacto con los fotogramas de una carpeta y las zonas seguras marcadas.
Uso: python3 scripts/hoja.py <carpeta de jpg> <salida.jpg> [columnas] [ancho de miniatura]
Línea roja: 20 % inferior. Línea azul: 12 % derecho.
"""
import sys, glob, os
from PIL import Image, ImageDraw
carpeta, salida = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 8
w = int(sys.argv[4]) if len(sys.argv) > 4 else 240
fs = sorted(glob.glob(os.path.join(carpeta, 't*.jpg')))
h = round(w * 1920 / 1080)
filas = (len(fs) + cols - 1) // cols
hoja = Image.new('RGB', (cols * (w + 6), filas * (h + 26)), (245, 245, 245))
d = ImageDraw.Draw(hoja)
for i, f in enumerate(fs):
    im = Image.open(f).convert('RGB').resize((w, h))
    x, y = (i % cols) * (w + 6), (i // cols) * (h + 26)
    hoja.paste(im, (x, y + 20))
    d.line([(x, y + 20 + h * .8), (x + w, y + 20 + h * .8)], fill=(255, 40, 40), width=1)
    d.line([(x + w * .88, y + 20), (x + w * .88, y + 20 + h)], fill=(60, 140, 255), width=1)
    d.text((x + 4, y + 4), os.path.basename(f)[1:-4] + ' s', fill=(20, 20, 20))
hoja.save(salida, quality=88)
print(salida, hoja.size)
