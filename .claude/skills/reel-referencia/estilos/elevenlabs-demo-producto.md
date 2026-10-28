# Estilo · «ElevenLabs product demo» (referencia: anuncio de ElevenLabs Music v2.5, 34 s)

Fuente: `work/referencia.mp4` · 1080×608 (16:9) · 30 fps · 34,07 s · −14,1 LUFS · pico +0,0 dBTP · LRA 8,7 LU.
Nota: el vídeo subido es la demo de **Music v2.5 / efectos de sonido**, no el de «Ads Engine» del enlace de YouTube.

## 1. Ritmo de cortes
- **Sin locución ni subtítulos**: toda la historia la cuentan la interfaz, el cursor y la música (Whisper solo devuelve una alucinación sobre música).
- Casi **sin cortes secos**: `scene > 0,25` solo detecta 3 cortes (13,9 s · 28,1 s · 30,0 s). El resto son **movimientos de cámara continuos** sobre la interfaz (acercamientos, paneos y planos macro).
- Estructura medida:
  | s | bloque |
  |---|---|
  | 0,0–1,0 | Logo (dos barras «II») sobre lienzo claro; las barras se separan como puertas |
  | 1,0–2,0 | Entre las barras aparece una tarjeta redondeada con vídeo real que crece hasta pantalla completa |
  | 2,0–4,3 | Vídeo real (playa al atardecer), 2,3 s |
  | 4,5–8,5 | Interfaz: subida del vídeo («Analyzing video…»), prompt escrito, chips «v2.5», plano macro del botón de enviar (círculo negro con flecha) al pulsarlo |
  | 8,0–10,5 | Resultado: título de la canción, onda de audio y lista con «Edit Song» |
  | 11,0–13,5 | Interfaz sobre el vídeo desenfocado: desplegable de modelos y botón «Generate music» en grande |
  | 14,0–24,5 | Editor de línea de tiempo: pista de vídeo, pista «Generating music» y fichas de efectos; el cursor arrastra y hace clic (resaltado azul claro) |
  | 25,0–28,0 | Vuelta al vídeo real a pantalla completa (la tarjeta crece otra vez) y plano final del grupo |
  | 28,5–29,5 | Cierre con el logo: las barras se juntan (el inverso de la apertura) |
  | 30,0–34,0 | Tarjeta final gris oscuro: icono de Instagram con degradado animado + «@ELEVENLABS» |
- Gráficos (interfaz y logo) ≈ 70 %; vídeo real ≈ 30 %.

## 2. Subtítulos
- No hay. Los únicos textos son los de la propia interfaz (los prompts escritos en directo hacen de guion).

## 3. Textos en pantalla
- **Prompt escrito letra a letra** en gris medio sobre una tarjeta blanca, enorme por el zoom (≈ 40–60 px a 1080 de ancho).
- Títulos de resultado en negro, peso medio y tamaño grande («Chic Brilliance»).
- Etiquetas pequeñas tipo chip («v2.5», «No Finetune», «Newest first», «Edit Song →»).
- Marca de agua: icono de Instagram + «@ELEVENLABS» arriba a la derecha (≈ 18 px), presente en casi todo el vídeo.
- Fuente de la interfaz: sans geométrica tipo Inter [SUPOSICIÓN: la de la web de ElevenLabs].

## 4. B-roll
- Vídeo real cinematográfico (playa al atardecer, cámara en mano, luz cálida) **dentro de una tarjeta redondeada** que crece hasta pantalla completa, y como fondo desenfocado detrás de la interfaz.

## 5. Transiciones
- **Puertas del logo**: las barras se separan y descubren el contenido; al final se cierran.
- **Tarjeta que crece**: un rectángulo redondeado (radio ≈ 24 px) con vídeo se expande a pantalla completa.
- **Movimiento de cámara continuo** de un elemento de la interfaz al siguiente, sin cortes.
- Fundido lento a la tarjeta final.

## 6. Zooms
- Constantes y suaves: push-in de ≈ 1,0→1,6 en 2–3 s sobre el elemento con el que se interactúa (prompt, botón, ficha de efecto), con desenfoque de profundidad en los bordes [SUPOSICIÓN: easing tipo ease-in-out].
- Planos macro del botón de enviar (×3–4) con desplazamiento lateral.

## 7. Color (hex medidos)
- Lienzo: `#F5F2F8` (apertura) · `#F0F0F8` / `#F8F8F8` (interfaz).
- Tarjetas: blanco `#FFFFFF` con sombra suave; bordes `#E8E8F0`.
- Texto e iconos: negro `#000000`–`#010000`; secundario gris (≈ `#8A8A93`).
- Acento de selección: azul claro `#B8CEE5`–`#BCD3E3` (resaltado de la ficha, degradado de fondo).
- Vídeo real: tonos cálidos de atardecer (amarillo, azul, verde).
- Tarjeta final: gris `#383838`.

## 8. Sonido
- −14,1 LUFS integrados · pico real +0,0 dBTP · LRA 8,7 LU.
- Música protagonista (la que «genera» el producto) con **efectos sincronizados a cada interacción** (clic, whoosh). [SUPOSICIÓN: el pico a 0 dBTP indica limitación fuerte].

## 9. Correcciones del usuario
(vacía)
