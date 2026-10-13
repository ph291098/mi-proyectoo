---
name: kinetic-reel-edit
description: "Estilo FIJO \"spotlight + tipografía cinética\" (texto palabra por palabra con glow azul sobre fondo claro, texto detrás del sujeto, nubes de palabras con spotlight, cortes secos ~1.7 s) producido con scripts Python + ffmpeg, SIN Remotion. Úsala cuando el usuario pida explícitamente ese look kinetic/spotlight, quiera guionizar o planificar plano a plano un reel para generarlo con IA (Higgsfield, Kling, Veo, Runway), quemar captions animados sobre un vídeo con ffmpeg, o que le expliques cómo replicar el estilo en CapCut, After Effects, Premiere o DaVinci. NO la uses para montar con Remotion la grabación del usuario con su marca (usa reel-edicion) ni para copiar el estilo de un vídeo de referencia nuevo que te pasa (usa reel-referencia). (EN: kinetic typography, spotlight word cloud, text behind subject, ffmpeg captions.)"
---

# Kinetic Reel Edit

Estilo extraído de un reel de referencia del usuario (21 s, generado con IA; el sujeto es el usuario, **la voz no es
suya**). Un mini-tutorial donde la voz explica y cada plano + cada palabra en pantalla lo demuestra.
Desglose plano a plano: `references/reference-breakdown.md`. Plan exacto reconstruido: `assets/reference_plan.json`.

## ADN del estilo

Estas seis reglas son lo que hace que se vea "así". Si dudas en una decisión, vuelve aquí.

1. **La voz manda el montaje.** Primero la VO terminada, después todo lo demás. Corte seco en cada frontera de
   frase, 0.1–0.4 s antes de que arranque la frase nueva. Planos de 1.1–2.5 s (media ~1.75 s). Cero transiciones:
   el movimiento lo pone lo que pasa dentro del plano (un objeto que entra, un push-in, un whip).
2. **Cada plano ilustra literalmente la frase.** "Te muestro" → lupa. "Elige" → post-it. "Es clave" → aparece una
   llave. "Aquí… o aquí abajo" → el texto se coloca arriba y luego abajo. Si la frase nombra algo que está en una
   pantalla, se muestra la pantalla y no se pone texto.
3. **Texto palabra por palabra, en sync.** Grotesca bold (Inter Display / SF Pro / Helvetica), minúsculas, tracking
   apretado. Cada palabra entra ~0.1 s antes de oírse con un pop corto (blur→nítido, 112→100 %). Nunca sobrevive a
   un corte. Planos cerrados: una palabra a la vez. Planos abiertos del sujeto: palabras que se acumulan.
4. **El fondo decide el estilo del texto.** Oscuro → blanco con sombra difusa. Claro → blanco con trazo y halo azul
   (para que el blanco se lea sobre blanco). Color saturado → blanco plano. Macro oscuro → glow azul eléctrico.
5. **Profundidad.** 1–2 palabras por plano pasan *detrás* del sujeto (cabeza, mano, bolígrafo); la palabra grande
   de una nube entra desenfocada y hace foco; el spotlight aísla al sujeto en negro.
6. **Contraste entre cortes.** Casi cada corte invierte luminancia o color (negro → blanco → rojo…). Sujeto siempre
   de negro, acento amarillo recurrente en props, y el look del hook vuelve hacia el final (callback).

## Voz e identidad

El sujeto en cámara es el usuario: puedes usar sus fotos como referencia de personaje en generadores de video.
La voz del reel de referencia **no** es la suya, así que no la tomes como "su voz" ni intentes imitarla. La VO puede
ser su propia grabación o una voz TTS que tenga derecho a usar. Si ya la tiene o la eligió, úsala. Si pide el video
ya y no dijo nada de la voz, no te bloquees: genera una VO con TTS (ElevenLabs si está conectado; elige una voz
natural en su idioma y di cuál), y deja claro que con `retime` se cambia por su voz en minutos. No clones la voz de
terceros sin su consentimiento.

## Flujo de trabajo

Adapta la profundidad a lo que pida: un guion + shot list no necesita render; "edita este video" sí.

### 1. Guion (≤ 25 s, ~3 palabras/seg)
Estructura de la referencia: **gancho** ("Me preguntan cómo hago esto… te muestro") → **3–4 pasos** con marcadores
verbales ("Primero…", "Después…", "Ahora…") → **cierre imperativo**. Frases cortas: cada frase = un plano.
Escríbelo en el idioma del usuario. Marca en el guion las palabras clave (las que van grandes) y las que piden un
ícono o una demostración literal.

### 2. VO y transcripción
Con la VO final (wav/mp3 o el video ya editado), saca tiempos por palabra:
```bash
python scripts/transcribe.py voz.wav --out words.json --lang es
```
También acepta el JSON de ElevenLabs STT o de whisper tal cual. Normaliza la VO a -14 LUFS.
- **Recorta las pausas**: las TTS y las grabaciones dejan 0.4–0.7 s entre frases; el estilo pide ~0.2 s. Detecta
  silencios (`ffmpeg -af silencedetect=n=-38dB:d=0.22`), quita el centro de cada uno dejando 0.09 s por lado y
  desplaza los tiempos de las palabras lo mismo (suele bajar un 12–15 % la duración).
- **Sin VO todavía**: estima ~3 palabras/s, 0.25 s de pausa entre frases, y marca el plan como provisional. Cuando
  llegue la voz, `kinetic_captions.py retime` mueve el plan editado a los tiempos reales sin perder las ediciones.

### 3. Shot list
Una tabla: `# | tiempo | frase | arquetipo | qué se ve | texto en pantalla (modo/estilo)`. Elige arquetipos con
`references/shot-archetypes.md` (8 tipos + prompts listos). Revisa la alternancia claro/oscuro antes de entregar.

### 4. Planos limpios
Genera o filma cada plano **sin texto**. Los modelos de video deforman las letras — eso es exactamente lo que falló
en la referencia ("Nirst", "cleative"). Todos los prompts terminan en
`No text, no letters, no captions, no watermark, clean plate.` y dejan aire donde irá el texto.

**Sin generador de video** (solo fotos del usuario): modo avatar con fotos. Recorta las fotos
(`scripts/cutout.py`), describe los planos en un `shots.json` y renderiza fondos + avatar animado + pantallas de
prompt + post-it + matte con `scripts/photo_plates.py`. Detalles y esquema en `references/photo-avatar.md`.

### 5. Montaje
El usuario puede montar en su editor. Con ffmpeg, un concat simple (clips ya recortados a la duración de cada frase):
```bash
printf "file '%s'\n" shot01.mp4 shot02.mp4 ... > list.txt
ffmpeg -f concat -safe 0 -i list.txt -i voz.wav -map 0:v -map 1:a -c:v libx264 -crf 18 \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=24" -shortest edit.mp4
```

### 6. Motion graphics con el script
```bash
# a) plan inicial: detecta cortes y brillo de cada plano, asigna modo/estilo y pone las palabras
python scripts/kinetic_captions.py plan --words words.json --video edit.mp4 --out plan.json
# b) refina plan.json a mano (ver abajo)
# (si cambia la VO: retime conserva las ediciones y rehace los cortes)
python scripts/kinetic_captions.py retime --plan plan.json --words words_nuevas.json --out plan.json
# c) preview rápido y luego final
python scripts/kinetic_captions.py render --plan plan.json --video edit.mp4 --out preview.mp4 --preview
python scripts/kinetic_captions.py render --plan plan.json --video edit.mp4 --matte matte.mp4 --out final.mp4
```
Requisitos: ffmpeg con libass y la fuente instalada (`fc-list | grep -i "Inter Display"`; si no está, instala Inter o
cambia `"font"` en el plan por una bold sans instalada). Sin `--matte`, las palabras e íconos `behind` salen delante
(el script avisa).

El plan automático es un punto de partida; lo que lo hace parecerse a la referencia es la edición a mano:
- **Recorta palabras** en planos abiertos/calmos: deja solo las keywords (el escritorio solo mostró "bold", "clean").
- Agrupa palabras pegadas que leen mejor juntas ("let me", "3D space").
- Marca `layer: "behind"` donde algo del sujeto cruce la palabra; requiere matte (cómo sacarlo en
  `references/typography-and-motion.md` §5).
- Usa `clear: true` para "pasar de página" dentro de un plano y `pos` para que el texto haga lo que dice.
- Sustituye sustantivos concretos por un ícono (`images`; hay `assets/key_icon.png` y `assets/guide_icon.png`).
  Para otro: silueta blanca plana sobre PNG transparente, ~1200 px, dibujada con Pillow a 4× y reducida.
- `rot`/`skew` para que la palabra siga un objeto en perspectiva (post-it).
- `mode: "none"` en planos de pantalla o para dejar respirar; ponle `"say"` (primera palabra que suena en ese plano)
  para que `retime` sepa dónde cortar.
- Se vale escribir distinto de lo que se dice ("24" por "veinticuatro", "fps" por "cuadros por segundo"): añade
  `"say": "veinticuatro"` a esa palabra para que `retime` la encuentre.
- Una palabra-marcador ("Next", "Ahora") puede cerrar el plano anterior en vez de abrir el siguiente, como en la
  referencia, si así el plano siguiente queda por debajo de ~2.5 s.

**Planos cerrados (busto/cara grande)**: los slots automáticos están pensados para un sujeto pequeño en cuadro. Con
la cara ocupando el centro, pon `pos` a casi todas las palabras en el 40 % superior; parte palabras largas para que
la clave vaya en tamaño héroe ("la" + "fórmula", "el" + "formato"); y recuerda que `behind` solo se nota si la
palabra se solapa de verdad con el sujeto (p. ej. a la altura de la coronilla), sin tapar lo que hace legible la palabra.
Esquema completo y valores de cada animación: `references/typography-and-motion.md`.

### 7. QA visual
Saca una hoja de contacto del render y mírala antes de entregar:
```bash
ffmpeg -i final.mp4 -vf "fps=2,scale=270:-1,tile=6x4" -frames:v 1 hoja.jpg
```
Revisa: ninguna palabra tapa la cara · texto legible en todos los fondos · nada en el 12 % inferior (UI de la red) ·
el texto no cruza cortes · palabras bien escritas · 1–2 palabras detrás del sujeto por plano como mucho.

## Si el usuario edita a mano

Para CapCut, After Effects, Premiere o DaVinci da los pasos de `references/editor-recipes.md` con los valores
exactos (fuente, sombra, glow, keyframes). Puedes generarle igual el `plan.json`/`front.ass` como guía de tiempos.

## Archivos

- `scripts/kinetic_captions.py` — plan / retime / ass / render (solo Python estándar + ffmpeg).
- `scripts/transcribe.py` — VO → `words.json` (faster-whisper u openai-whisper).
- `scripts/cutout.py` — recorta fotos del sujeto (rembg) para el modo avatar con fotos.
- `scripts/photo_plates.py` — renderiza planos limpios + matte desde fotos recortadas (`shots.json`).
- `references/photo-avatar.md` — modo avatar con fotos: cuándo usarlo, esquema de `shots.json`, límites.
- `references/reference-breakdown.md` — línea de tiempo, guion, ritmos y paleta medidos del original.
- `references/typography-and-motion.md` — tipografía, estilos, modos, animaciones, capas, esquema del plan.
- `references/shot-archetypes.md` — 8 arquetipos de plano con prompts para IA y notas para filmar.
- `references/editor-recipes.md` — recetas manuales por editor + audio/export.
- `assets/reference_plan.json` — la referencia reconstruida (ejemplo completo de plan).
- `assets/key_icon.png`, `assets/guide_icon.png` — íconos de ejemplo (llave, guía/documento).
