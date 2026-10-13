# Arquetipos de plano + prompts de generación

Ocho tipos de plano cubren todo el reel de referencia. Para cada frase del guion elige el arquetipo que
**ilustre literalmente** lo que se dice, y alterna claro/oscuro entre planos consecutivos.

Reglas comunes para generar con IA (Higgsfield, Kling, Veo, Runway, Sora, Hailuo…):
- **Nunca pidas texto en el plano.** Los modelos de video deforman las letras (en la referencia: "Nirst",
  "cleative"). Termina cada prompt con: `No text, no letters, no captions, no watermark, clean plate.`
  Deja aire negativo donde irá el texto (arriba o a un lado del sujeto).
- Escribe los prompts **en inglés** (los modelos de video los siguen mejor), aunque el guion sea en español.
- **Higgsfield**: crea el personaje con 3–5 fotos del usuario (frente, ambos perfiles, sonrisa) y úsalo en cada
  plano; elige el movimiento de cámara con sus presets (Push In, Dolly Out, Crash Zoom, Whip Pan…) en vez de
  describirlo largo en el prompt; 9:16 y 5 s por clip. En otros generadores, sube las mismas fotos como imagen de
  referencia de personaje.
- 9:16, 24 fps, clips de 3–5 s (luego se recortan a 1–2.5 s).
- Personaje consistente: usa la función de identidad del generador (Soul ID / character reference /
  imagen de referencia) con fotos del usuario. Vestuario fijo en todos los planos: **hoodie y pantalón negros**.
- Movimiento de cámara sutil y uno solo por plano (push-in, pull-back, slide). Nada de cortes dentro del clip.
- Si se filma de verdad: celular en 4K 24 fps, vertical, shutter 1/50, exposición bloqueada; las indicaciones
  de luz de cada arquetipo valen igual.

---

## A. Spotlight hook
Uso: arranque y callback. Sujeto entero, el resto del mundo negro.
```
High-angle wide shot looking down at [SUBJECT] crouching on a dark concrete floor, pointing up at the
camera with an excited expression, wearing a black hoodie and black pants. A single hard circular
spotlight from directly above creates a sharp round pool of light around the subject, everything outside the
circle falls to pure black, cool blue-teal falloff at the edge of the light. Slow camera pull-back,
24mm lens, cinematic, high contrast. 9:16 vertical. No text, no letters, no captions, no watermark, clean plate.
```
Real: un foco duro cenital (o una linterna con snoot) en cuarto oscuro, cámara alta con gran angular.

## B. Macro prop
Uso: ilustrar un verbo o un objeto ("show", "pick", "write"). Objeto en movimiento, fondo desenfocado.
```
Extreme close-up macro of a [OBJECT: magnifying glass sliding across a laptop keyboard | yellow sticky note
sliding onto a light grey desk], shallow depth of field, soft daylight, slight chromatic aberration on
lens edges, smooth lateral motion, product-commercial look. 9:16 vertical. No text, no letters, no captions, no watermark, clean plate.
```
Deja el centro del objeto (la lente de la lupa, la cara del post-it) libre para la palabra.

## C. Establishing del espacio de trabajo
Uso: contexto, frases largas explicativas. Texto mínimo (1–2 keywords con fade).
```
Moody night shot of a video-editing desk: laptop with a timeline on screen, a large monitor behind,
warm tungsten table lamp on the left, teal screen glow, dark room, slow push-in, 35mm, shallow depth of
field, cinematic teal-and-orange grade. 9:16 vertical. No readable text on screens, no letters, no captions, no watermark, clean plate.
```

## D. Screen B-roll
Uso: cuando la frase nombra algo que existe en una pantalla (una fuente, una app, un ajuste). Sin overlay.
Mejor que generarlo: **grabación real de pantalla** del software, recortada a 9:16 con zoom 150–200 % y un
paneo lento; un whip pan corto (blur direccional 3–4 frames) para entrar.

## E. Detalle de manos
Uso: acciones ("type", "click", "edit"), palabras-golpe ("Next").
```
Close-up of hands typing on a laptop keyboard at night, mouse and yellow highlighter on a wooden desk,
monitor glow in the soft-focus background, 50mm, shallow depth of field, warm and teal tones. 9:16 vertical.
No text, no letters, no captions, no watermark, clean plate.
```

## F. Fondo de color sólido
Uso: afirmaciones fuertes, conceptos clave. Sujeto de cintura para arriba, pose firme, mirando a cámara.
```
Medium shot of [SUBJECT] leaning against a saturated crimson red seamless wall, arms crossed, confident
neutral expression, black hoodie, soft key light from the front-left with a gentle vignette on the wall,
static camera. Empty space above the head. 9:16 vertical. No text, no letters, no captions, no watermark, clean plate.
```
Variantes de color: rojo `#A92025`, azul cobalto, amarillo — uno por reel, no más.

## G. White cyc (estudio infinito blanco)
Uso: demostrar "posición" o ideas simples; el texto se mueve alrededor de un sujeto pequeño.
```
Wide shot of [SUBJECT] sitting on the floor of an infinite white photo studio (seamless white cyclorama),
small in frame, lots of empty space above and below, soft even high-key lighting, soft contact shadow,
black clothing, [ACTION: looking up and pointing | writing on a yellow notepad]. Static camera. 9:16
vertical. No text, no letters, no captions, no watermark, clean plate.
```

## H. Macro extremo con oclusión
Uso: frase de cierre o imperativa ("keep it engaging"). Algo pasa por delante de la palabra → `layer: behind`.
```
Extreme macro of a hand writing with a black ballpoint pen on a yellow legal pad, the pen tip moving
across the page, dramatic low-key lighting, black background, very shallow depth of field. 9:16 vertical.
No readable writing, no text, no letters, no captions, no watermark, clean plate.
```

## Outro
Reusar C con el sujeto: medio plano, mano en el mentón, mirando la pantalla, luz cálida lateral. El texto
desliza desde la izquierda sobre la mitad libre del cuadro.

---

## Tabla rápida: frase → arquetipo

| La frase habla de… | Arquetipo |
|---|---|
| gancho, pregunta al público, "les voy a mostrar" | A |
| ver, buscar, elegir, anotar, un objeto concreto | B |
| el proceso, el lugar de trabajo, explicación larga | C |
| un nombre de software, fuente, ajuste, número | D |
| hacer, editar, escribir, "siguiente paso" | E |
| una regla, "esto es clave", afirmación fuerte | F |
| posición, espacio, opciones ("aquí o allá") | G |
| cierre, imperativo, consejo final | H / outro |

Secuencia probada (12 planos en ~21 s): A · B · B · C · D · E · F · G · G · A · H · outro.
