# Recetas por editor (hacerlo a mano)

Para cuando el usuario quiere editar en su programa en vez de usar `scripts/kinetic_captions.py`.
Los valores salen de `typography-and-motion.md`.

## Contenido
- CapCut (móvil / desktop)
- After Effects
- Premiere Pro
- DaVinci Resolve
- Sonido y exportación (todos)

---

## CapCut

1. Proyecto 9:16, 24 fps (o 30). Pista 1: VO. Pista 2: planos cortados en las fronteras de frase.
2. **Subtítulos automáticos** → genera el texto por palabra (o "Una palabra por línea"). Úsalos solo como guía de tiempos.
3. Por cada palabra: texto nuevo, fuente **Inter / SF Pro Display Bold** (importa la fuente), minúsculas,
   espaciado -2.
   - Fondo oscuro → Sombra: negro, opacidad 55 %, desenfoque 12, distancia 6, ángulo 90°.
   - Fondo claro → Contorno azul `#4070B0` grosor 2 + Brillo/Resplandor `#90A0C0` intensidad media.
   - Fondo de color → sin efectos.
4. Animación de entrada: "Desenfoque" o "Zoom in suave", 0.2 s. Sin animación de salida.
5. Mueve cada texto 3 frames antes del inicio de la palabra en la onda de la VO.
6. Texto detrás del sujeto: duplica el clip en una pista superior → "Eliminar fondo" → deja el texto entre el
   clip original y el recorte.
7. Spotlight: superposición de "Viñeta" fuerte o máscara circular invertida con calado 80 y relleno negro;
   keyframe de tamaño 145 % → 100 % en 1 s para el hook.

## After Effects

- Comp 1080×1920, 24 fps. Fuente Inter Display Bold, tracking -20, leading ajustado.
- Preset de entrada "pop" (aplicar a cada capa de texto):
  - Gaussian Blur: 30 → 0 en 4 frames; Scale: 112 % → 100 % en 4 frames; Opacity 0 → 100 % en 2 frames.
  - Easy Ease Out en el primer key, influencia 80 % en el segundo.
- "focus": Camera Lens Blur 40 → 0 en 8 frames + opacidad 0 → 100 %.
- "slide": Position X -300 px → 0 en 5 frames, Directional Blur 40 → 0, Motion Blur activado.
- Glow (fondos claros): Layer Styles → Stroke 4 px `#4070B0` + Outer Glow `#90A0C0`, opacidad 70 %, tamaño 30.
- Sombra (fondos oscuros): Drop Shadow negro 55 %, distancia 8, softness 25, ángulo 90°.
- Texto detrás: Roto Brush 3 sobre el sujeto → duplica el clip encima del texto con Track Matte del roto.
- Texto en perspectiva (post-it): capa 3D o Corner Pin + tracking del objeto.
- Ícono: shape layer blanco, Position desde fuera de cuadro con easing "Ease Out Cubic", 8 frames.
- Para ahorrar tiempo: importa `front.ass` como referencia de tiempos (`python kinetic_captions.py ass --plan plan.json`).

## Premiere Pro

- Secuencia 1080×1920 24p. Texto con Essential Graphics (Inter Display Bold, tracking -20).
- Transcribe la VO (Text panel → Transcribe) → Create Captions con "Max length 1 palabra" para tener los tiempos;
  luego reemplaza por gráficos con estilo.
- Entrada: Gaussian Blur 30 → 0 + Scale 112 → 100 en 4 frames (Bezier, ease out).
- Glow: Stroke + Shadow azul con blur alto en Essential Graphics; o efecto "Glow" de terceros.
- Texto detrás: duplica el clip, máscara del sujeto (Object Mask, Premiere 25+) y ponlo arriba del texto.

## DaVinci Resolve

- Timeline 1080×1920 24 fps. Fusion Text+ (Inter Display Bold, Tracking 0.98).
- Fusion: Text+ → Transform (Size 1.12 → 1.0) → Blur (3 → 0) keyframeados 4 frames, spline ease out.
- Glow: Fusion "Soft Glow" con tinte azul sobre un duplicado del texto debajo del original.
- Texto detrás: Magic Mask sobre el sujeto (Color page) → en Fusion, MatteControl para poner el sujeto encima.
- O importa el `.ass` generado por el script como subtítulo para usarlo de guía.

## Sonido y exportación

- La VO manda: todo el montaje se corta sobre la VO terminada. Normaliza a **-14 LUFS** integrado, picos ≤ -1 dBTP.
- Música (opcional): bed muy bajo (≈ -25 dB respecto a la voz), sin letras. Efectos opcionales y sutiles: "pop"
  en palabras-golpe, "whoosh" en slides y whips.
- Export: H.264 o HEVC, 1080×1920, 24 fps, 12–16 Mbps, AAC 48 kHz 192 kbps.
