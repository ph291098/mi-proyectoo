# estilo.md — sacado de `referencia.mp4`

Fuente analizada: 720×1280, 30 fps, 29,5 s, 133 palabras (272 palabras/min). Lo he medido
en 59 fotogramas (2 por segundo), en los cambios de plano (`ffmpeg scene > 0.25`), en la
transcripción de Whisper turbo con tiempos por palabra y con `loudnorm`/`silencedetect`
sobre el audio. Los valores en px están pasados a un lienzo de **1080×1920** (×1,5 sobre la
fuente). Lo que no he podido medir lleva la marca **[SUPOSICIÓN]**.

## 1. Ritmo de cortes

- **Silencios: ninguno de más de 0,3 s** (`silencedetect -35 dB, d=0.3` → 0 resultados).
  La voz va pegada de principio a fin: se cortan todas las pausas y respiraciones.
- **Planos detectados**: 10, que duran 2,43 · 3,0 · 1,37 · 3,63 · 2,03 · 10,83* · 0,8 ·
  2,87 · 2,43 s. **De media, 2,95 s.**
  *El bloque de 10,83 s (12,5 → 23,3) es todo gráfico. Dentro de él la pieza cambia
  cada 1–5 s (móvil → «Sol» → logo de Claude → prompt → tira de fotogramas), así que el
  ritmo real nunca baja de **un cambio visual cada ≤ 3 s**.
- **Reparto**: a cámara 37 % (≈ 11 s) · pantallas gráficas 63 % (≈ 18,5 s). La voz nunca
  se corta: los gráficos tapan la imagen, no el audio.
- **Estructura**: gancho repetido 3 veces en 0–3 s («este vídeo está editado con IA» ×3,
  con tres vídeos distintos) → promesa («son simplemente 2 pasos», 6 s) → paso 1 → paso
  2 → qué hace → cómo personalizarlo → cierre («y ya está», 28 s). Sin CTA final hablado.

## 2. Subtítulos

| Parámetro | Valor |
|---|---|
| Fuente del texto normal | Sans grotesca, peso 600 [SUPOSICIÓN: *Inter Tight* / *Instrument Sans*; no es identificable al 100 % a 720p] |
| Fuente de la palabra destacada | La misma sans a peso 800, con interletraje −0,03 em |
| Fuente para palabras «de concepto» | Serif cursiva (p. ej. «*pasos*» a 6,5 s) [SUPOSICIÓN: *Instrument Serif Italic*] |
| Tamaño del texto normal | **≈ 46 px** de cuerpo (línea de ≈ 56 px) |
| Tamaño de la palabra destacada | **≈ 110 px** (≈ 2,4 × el normal). Número gigante: «2» a ≈ 330 px |
| Posición a cámara | Arriba y centrado: el bloque empieza en **y ≈ 190**, la palabra destacada en **y ≈ 300–340**. Siempre por encima de la cabeza (pelo desde y ≈ 480) |
| Posición sobre gráficos | Debajo del gráfico, centrado: **y ≈ 1300–1500** |
| Palabras por bloque | **2–5 palabras normales + 0–1 destacada** en su propia línea. Puede seguir una línea pequeña debajo («de la carrera de», «etcétera») |
| Aparición | **Palabra a palabra, a su tiempo de Whisper**: entra con desenfoque 8 px → 0, opacidad 0 → 1 y escala 0,95 → 1 en ≈ 5 fotogramas (0,17 s). Hasta que se dice, la palabra no está |
| Palabra destacada | La palabra clave de la frase (el sustantivo o el adjetivo que lleva el sentido: *editado, viendo, fácil, primero, referencia, edición, creador, pegar, estilos, ritmo, textos, colores, branding, pídeselo, está*). Entra igual, pero más lenta (≈ 8 fotogramas) |
| Color, a cámara | Blanco #FFFFFF con una sombra suave negra al 35 % [SUPOSICIÓN en la sombra]. La destacada también va en blanco; azul solo en «viendo» (3,0 s) |
| Color, sobre gráficos | Texto normal en tinta #131112; destacada en **azul #0050FB** |
| Salida | El bloque entero se va con desenfoque 0 → 10 px y opacidad 1 → 0 en ≈ 6 fotogramas al empezar el siguiente bloque. Nunca hay dos bloques a la vez |
| Mayúsculas | Frase normal: mayúscula solo al empezar una frase («Lo», «Si quieres…») |

## 3. Textos en pantalla (no subtítulos)

- **Etiqueta píldora mono**: «VÍDEO 1 · EDITADO CON IA», «guardado», «tu marca ✓»,
  «pegar · Ctrl+V». Fondo tinta #131112, texto blanco en mono ≈ 22 px con espaciado 0,08 em,
  radio 999 y un punto azul delante.
- **Chip de fichero**: «📄 referencia.mp4», mono ≈ 22 px, fondo blanco, borde #E2E7F4,
  radio 10.
- **Lista numerada**: tarjetas blancas de 520×64 px con radio 14 y sombra suave; número
  en un círculo azul #0050FB de 34 px y texto a ≈ 30 px, peso 600.
- **Botón de acción**: «HAZ CAPTURA» en píldora tinta con icono de cámara y un punto rojo
  que parpadea, más una barra de progreso azul que se vacía en 5 s («pausa o haz captura · 5 s»).
- **Checklist** («estilo.md»): las casillas se marcan una a una, a la vez que la voz
  nombra cada punto.

## 4. B-roll

No es metraje: son **pantallas de motion graphics** a pantalla completa sobre el lienzo
claro, el 63 % del vídeo.

- Maqueta de móvil (≈ 380×760 px, borde negro de 10 px, radio 48) con **corchetes azules
  en las esquinas** (#0050FB, trazo de 6 px) que la «enfocan».
- El vídeo a cámara dentro de una tarjeta de radio 28 px y sombra, que **se expande a
  pantalla completa** (2,4 → 3,0 s).
- Gráficos de producto: barras, logos (Claude, OpenAI) y una tarjeta de prompt con el
  texto real.
- Una tira de fotogramas con perforaciones que se desplaza en horizontal, con un
  cursor azul que la recorre.
- Tarjetas de tipografía («Aa» a ≈ 170 px) y de muestras de color (cuadrados de 90 px con
  radio 18), que cambian cada ≈ 0,5 s (2 cambios) hasta quedarse en la marca.

## 5. Transiciones

- **Cámara ↔ gráfico: corte seco**, sin fundido.
- **Tarjeta → pantalla completa**: escala de la tarjeta de ≈ 0,55 a 1, con el radio de
  28 a 0, en ≈ 0,5 s con ease-out [SUPOSICIÓN en la curva].
- **Elementos gráficos**: entran con escala 0,9 → 1, desenfoque 10 → 0 px y opacidad
  0 → 1 en ≈ 8 fotogramas, y salen con desenfoque y fundido. Nada de cortinillas, cubos
  ni destellos.

## 6. Zooms

- **Alternancia de encuadre en cada salto de corte a cámara**: abierto (cabeza desde
  y ≈ 760, a 3,0 s) ↔ cerrado (cabeza desde y ≈ 480, a 7,0 s). Equivale a **escala 1,0 ↔
  ≈ 1,2** [SUPOSICIÓN: puede venir de la propia grabación].
- No hay zoom lento continuo (Ken Burns) dentro de un plano.

## 7. Color

- **Lienzo de los gráficos**: **#F5F3F7** con dos manchas de luz azul en esquinas opuestas
  (arriba a la derecha y abajo a la izquierda) de **#D7E0F5**, desenfoque muy grande
  (≈ 600 px).
- **Paleta**: azul acento **#0050FB** · tinta **#131112** · azul suave **#A9C2FC** · gris
  azulado **#E2E7F4** · lienzo **#F5F3F7**.
- **Imagen a cámara**: sin etalonaje visible. Blancos neutros, piel natural, fondo gris
  cálido [SUPOSICIÓN: como mucho una corrección suave].
- **Marca de agua**: icono de Instagram con el @ en blanco a ≈ 18 px, en el lado derecho
  (x ≈ 960, y ≈ 430) a cámara y abajo a la izquierda en algunos planos.

## 8. Sonido

- Sonoridad integrada **−14,3 LUFS**, pico real **0,0 dBTP** y LRA **2,1 LU**: una voz
  muy comprimida, con el mismo volumen de principio a fin.
- [SUPOSICIÓN] Hay efectos cortos («whoosh» o «pop») al entrar cada pantalla gráfica y
  un «clic» al marcar cada casilla. No los he podido escuchar, así que lo deduzco de cómo
  está montado.
- [SUPOSICIÓN] La música de fondo, si la hay, va muy baja: no se distingue por energía
  porque la voz no deja huecos.

## Correcciones del usuario (paso 4)

_(vacío: aquí se añadirá cada corrección que te guste)_
