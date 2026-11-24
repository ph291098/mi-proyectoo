"""Dibuja el rótulo de cierre (PNG transparente 1920×1080) que se funde sobre la última toma.
Uso: python3 scripts/cierre.py <salida.png> ["Frase"] ["línea pequeña"] [velo 0-255] [desplazamiento vertical px]"""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

sal = sys.argv[1]
frase = sys.argv[2] if len(sys.argv) > 2 else "Hecho para el invierno."
pie = sys.argv[3] if len(sys.argv) > 3 else "PIEZA DE MUESTRA · NO OFICIAL · @soypablo.ai"
VELO = int(sys.argv[4]) if len(sys.argv) > 4 else 150
DY = int(sys.argv[5]) if len(sys.argv) > 5 else 0
W, H = 1920, 1080
F = "/usr/share/fonts/opentype/inter/"
grande = ImageFont.truetype(F + "InterDisplay-Medium.otf", 104)
chica = ImageFont.truetype(F + "Inter-Medium.otf", 26)

def ancho(d, t, f, sep):
    return sum(d.textlength(c, font=f) + sep for c in t) - sep

def escribe(d, t, f, y, sep, color):
    x = (W - ancho(d, t, f, sep)) / 2
    for c in t:
        d.text((x, y), c, font=f, fill=color)
        x += d.textlength(c, font=f) + sep

# velo oscuro suave detrás del texto para que se lea sobre la nieve
velo = Image.new("L", (W, H), 0)
ImageDraw.Draw(velo).ellipse((260, 250 + DY, W - 260, 760 + DY), fill=VELO)
velo = velo.filter(ImageFilter.GaussianBlur(140))
img = Image.new("RGBA", (W, H), (6, 12, 24, 0))
img.putalpha(velo)

d = ImageDraw.Draw(img)
escribe(d, frase, grande, 418 + DY, -1.5, (255, 255, 255, 255))
escribe(d, pie, chica, 566 + DY, 3.2, (255, 255, 255, 215))
img.save(sal)
