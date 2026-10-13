---
name: kinetic-reel-edit
description: Edita reels verticales (9:16) en el estilo "spotlight + tipografía cinética" del usuario — texto palabra por palabra sincronizado con la voz, glow azul sobre fondos claros, texto detrás del sujeto, nubes de palabras con spotlight, cortes secos cada ~1.7 s y B-roll que ilustra literalmente cada frase. Úsala siempre que el usuario quiera hacer, guionizar, planificar, generar con IA (Higgsfield, Kling, Veo, Runway) o editar un reel, TikTok, Short o video vertical "con mi estilo", "como el de la referencia", con motion graphics, kinetic typography, subtítulos animados, texto detrás de la persona o captions palabra por palabra; también para quemar textos animados sobre un video con ffmpeg, o para explicar cómo replicar este estilo en CapCut, After Effects, Premiere o DaVinci — aunque no diga "skill" ni "kinetic". (EN — kinetic typography reel, word-by-word animated captions, text behind subject, spotlight word cloud edit.)
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
La voz del reel de referencia **no** es la suya, así que no la tomes como "su voz" ni intentes imitarla. Antes de
producir, pregunta qué VO usará: su propia grabación, o una voz TTS que elija y tenga derecho a usar (si el conector
de ElevenLabs está disponible, puede generarla ahí). No clones la voz de terceros sin su consentimiento.

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

### 3. Shot list
Una tabla: `# | tiempo | frase | arquetipo | qué se ve | texto en pantalla (modo/estilo)`. Elige arquetipos con
`references/shot-archetypes.md` (8 tipos + prompts listos). Revisa la alternancia claro/oscuro antes de entregar.

### 4. Planos limpios
Genera o filma cada plano **sin texto**. Los modelos de video deforman las letras — eso es exactamente lo que falló
en la referencia ("Nirst", "cleative"). Todos los prompts terminan en `no text, no letters, clean plate` y dejan
aire donde irá el texto.

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
# c) preview rápido y luego final
python scripts/kinetic_captions.py render --plan plan.json --video edit.mp4 --out preview.mp4 --preview
python scripts/kinetic_captions.py render --plan plan.json --video edit.mp4 --matte matte.mp4 --out final.mp4
```
Requisitos: ffmpeg con libass y la fuente instalada (`fc-list | grep -i "Inter Display"`; si no está, instala Inter o
cambia `"font"` en el plan por una bold sans instalada). Sin `--matte`, las palabras `behind` salen delante (avisa).

El plan automático es un punto de partida; lo que lo hace parecerse a la referencia es la edición a mano:
- **Recorta palabras** en planos abiertos/calmos: deja solo las keywords (el escritorio solo mostró "bold", "clean").
- Agrupa palabras pegadas que leen mejor juntas ("let me", "3D space").
- Marca `layer: "behind"` donde algo del sujeto cruce la palabra; requiere matte (cómo sacarlo en
  `references/typography-and-motion.md` §5).
- Usa `clear: true` para "pasar de página" dentro de un plano y `pos` para que el texto haga lo que dice.
- Sustituye sustantivos concretos por un ícono (`images`, ver `assets/key_icon.png`).
- `rot`/`skew` para que la palabra siga un objeto en perspectiva (post-it).
- `mode: "none"` en planos de pantalla o para dejar respirar.
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

- `scripts/kinetic_captions.py` — plan / ass / render (solo Python estándar + ffmpeg).
- `scripts/transcribe.py` — VO → `words.json` (faster-whisper u openai-whisper).
- `references/reference-breakdown.md` — línea de tiempo, guion, ritmos y paleta medidos del original.
- `references/typography-and-motion.md` — tipografía, estilos, modos, animaciones, capas, esquema del plan.
- `references/shot-archetypes.md` — 8 arquetipos de plano con prompts para IA y notas para filmar.
- `references/editor-recipes.md` — recetas manuales por editor + audio/export.
- `assets/reference_plan.json` — la referencia reconstruida (ejemplo completo de plan).
- `assets/key_icon.png` — ícono de ejemplo (llave blanca).
