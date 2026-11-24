"""Convierte las capas originales (work/arte/*.png) en los assets que usa Remotion (public/arte/).

- recorta cada capa a su contenido y la guarda en WebP con alfa
- saca la tapa de la laptop de la ilustración maestra
- crea la máscara de la pantalla del celular (lo negro puro dentro del marco)
- genera 6 texturas de grano de película

Uso: python3 scripts/prepara_arte.py
"""
import json, os
import numpy as np
from PIL import Image, ImageFilter

SRC, DST = 'work/arte', 'public/arte'
os.makedirs(DST, exist_ok=True)
meta = {}

def recorta(nombre, maxlado=None, pad=4):
    im = Image.open(f'{SRC}/{nombre}.png').convert('RGBA')
    a = np.array(im)[..., 3]
    ys, xs = np.where(a > 8)
    box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(im.width, xs.max() + pad), min(im.height, ys.max() + pad))
    im = im.crop(box)
    if maxlado and max(im.size) > maxlado:
        k = maxlado / max(im.size); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    im.save(f'{DST}/{nombre}.webp', quality=93, method=6)
    meta[nombre] = {'w': im.width, 'h': im.height}
    return im

# fondo y maestra (opacos)
Image.open(f'{SRC}/fondo.png').convert('RGB').save(f'{DST}/fondo.jpg', quality=93)
meta['fondo'] = {'w': 1520, 'h': 2688}
Image.open(f'{SRC}/maestro.png').convert('RGB').save(f'{DST}/maestra.jpg', quality=92)

recorta('personaje', 1800)
recorta('lampara')
recorta('reloj')
recorta('taza', 700)
recorta('celular', 700)
recorta('laptop_cerrada')

# tapa de la laptop: rectángulo de la maestra
lid = Image.open(f'{SRC}/maestro.png').convert('RGB').crop((432, 1820, 1092, 2176))
lid.save(f'{DST}/tapa.jpg', quality=93); meta['tapa'] = {'w': lid.width, 'h': lid.height}

# mano con celular + máscara de pantalla
mano = Image.open(f'{SRC}/mano.png').convert('RGBA')
m = np.array(mano); rgb = m[..., :3].astype(int); a = m[..., 3]
negro = (a > 200) & (rgb.sum(-1) < 30)
X0, Y0, X1, Y1 = 298, 103, 1096, 1594          # rectángulo denso de la pantalla (medido)
mask = np.zeros(a.shape, np.uint8)
mask[Y0:Y1, X0:X1] = 255                       # la pantalla es todo el rectángulo…
dedo = (a > 200) & (rgb.sum(-1) >= 60)          # …menos lo que no sea negro (dedos encima)
mask[dedo] = 0
mk = Image.fromarray(mask).filter(ImageFilter.GaussianBlur(1.2))
# esquinas redondeadas de la pantalla
from PIL import ImageDraw
rr = Image.new('L', mano.size, 0); ImageDraw.Draw(rr).rounded_rectangle((X0, Y0, X1, Y1), radius=70, fill=255)
mk = Image.fromarray(np.minimum(np.array(mk), np.array(rr)))
out = Image.new('RGBA', mano.size, (255, 255, 255, 0)); out.putalpha(mk)
mano.save(f'{DST}/mano.webp', quality=93, method=6)
out.save(f'{DST}/mano_pantalla.png', optimize=True)
meta['mano'] = {'w': mano.width, 'h': mano.height, 'pantalla': [X0, Y0, X1, Y1]}

# grano de película: 6 texturas de 512 px, gris medio ± ruido (para mezclar en overlay)
rng = np.random.default_rng(5)
for i in range(6):
    n = rng.normal(0, 1, (512, 512))
    n = np.array(Image.fromarray((n * 40 + 128).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)))
    n = ((n.astype(float) - 128) * 1.9 + 128).clip(0, 255).astype(np.uint8)
    Image.fromarray(n, 'L').save(f'{DST}/grano{i}.png', optimize=True)

json.dump(meta, open('src/data/arte.json', 'w'), indent=1)
for f in sorted(os.listdir(DST)): print(f, os.path.getsize(f'{DST}/{f}') // 1024, 'KB')
print(json.dumps(meta))
