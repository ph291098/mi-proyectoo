"""Poses nuevas del personaje (episodio 2 en adelante): las recorta, las escala igual que la pose
original y calcula dónde van en el cuarto para que el torso quede en el mismo sitio.

Uso: python3 scripts/prepara_poses.py
"""
import json
import numpy as np
from PIL import Image

SRC, DST = 'work/arte', 'public/arte'
K = 831 / 1955            # px de mundo por px de la ilustración original (el personaje base mide 831 de ancho)
CENTRO_X, BASE_Y = 564.5, 1594   # centro horizontal y borde inferior (manos) del personaje base en el mundo
poses = {}
for nombre in ['mirando', 'agobiado', 'aliviado']:
    im = Image.open(f'{SRC}/pose_{nombre}.png').convert('RGBA')
    a = np.array(im)[..., 3]
    ys, xs = np.where(a > 8)
    im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    w, h = im.width * K, im.height * K
    k = 1800 / max(im.size)
    im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).save(f'{DST}/pose_{nombre}.webp', quality=93, method=6)
    poses[nombre] = {'x': round(CENTRO_X - w / 2, 1), 'y': round(BASE_Y - h, 1), 'w': round(w, 1), 'h': round(h, 1)}
json.dump(poses, open('src/data/poses.json', 'w'), indent=1)
print(json.dumps(poses))
