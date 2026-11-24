# Promo del SUV en carretera nevada (pieza de muestra)

Pieza de muestra, no oficial: no está encargada ni aprobada por Hyundai. El SUV sale de tres imágenes
de referencia que aportó Pablo.

## Qué hay

| Archivo | Qué es |
|---|---|
| `modelo/suv.glb` | Modelo 3D del SUV (153 000 triángulos, texturas PBR de 2048 px), reconstruido a partir de las tres vistas con Meshy (Higgsfield). |
| `modelo/suv-carretera-nevada.blend` | Escena de Blender 5.3: el SUV rodando 10 s por una carretera nevada, con tres cámaras ya animadas. Texturas empaquetadas dentro. |
| `out/suv-nieve-1080p.mp4` | Vídeo fotorrealista de 10 s (1920×1080, 24 fps, H.264, audio a −14 LUFS), generado con Seedance 2.5 a partir de las tres imágenes de referencia: frontal, lateral y dron trasero. |
| `out/suv-nieve-1080p-con-cierre.mp4` | El mismo con el rótulo de cierre («Hecho para el invierno.» + «pieza de muestra · no oficial · @soypablo.ai»). El rótulo se cambia con `scripts/cierre.py`. |
| `out/animacion-blender.mp4` | La animación renderizada en Blender (Cycles por CPU, a 960×540): es la previsualización 3D, no el acabado final. |
| `out/portada.jpg` | Fotograma de portada. |
| `out/hiperrealista/` | Tres fotogramas clave hiperrealistas (2688×1520) hechos con GPT Image 2.6 a partir de las referencias: frontal, lateral y trasera. Son la base para rehacer el vídeo con acabado de rodaje real. |
| `scripts/escena.py` | Construye la escena desde el GLB (carretera, terreno, pinos, nieve, luces, cámaras, animación). |
| `scripts/cierre.py` | Dibuja el rótulo de cierre (PNG transparente) que ffmpeg funde sobre la última toma. |
| `scripts/render.py` | Renderiza la animación a PNG (reanudable). `scripts/foto.py`: fotogramas sueltos. `scripts/giratorio.py`: vistas de revisión del modelo. |

## Cómo se rehace

```bash
pip install bpy==5.3.0
python3 scripts/escena.py -- modelo/suv.glb modelo/suv-carretera-nevada.blend -90
python3 scripts/render.py -- modelo/suv-carretera-nevada.blend work/anim 50      # 50 % = 960×540
ffmpeg -framerate 24 -i work/anim/f%04d.png -c:v libx264 -crf 18 -pix_fmt yuv420p out/animacion-blender.mp4
```

El `.blend` se abre también en Blender de escritorio: con tarjeta gráfica, el render a 1080p completo
tarda minutos en vez de horas.

## Límites del modelo

Es una reconstrucción automática a partir de fotos, no un modelo de fabricante: el coche es una sola
malla (las ruedas no giran por separado), los cristales son opacos y el logo y las letras salen de la
textura, así que de cerca se ven blandos.

## Límites del vídeo fotorrealista

Lo genera un modelo de vídeo a partir de las fotos, así que no es exacto al milímetro: la pintura sale
más gris que el bronce de las referencias y la matrícula delantera queda en blanco. El sonido (rodadura,
viento y música) también es generado.
