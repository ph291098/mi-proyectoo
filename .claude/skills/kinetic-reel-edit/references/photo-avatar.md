# Modo avatar con fotos

Para cuando el usuario quiere el video **ya**, pero en la sesión no hay un generador de video (Higgsfield, Kling,
Veo, Runway…). El sujeto sale de 3–5 fotos suyas recortadas y animadas como si hubiera cámara (asentamiento en cada
corte + push-in lento). El resultado es un reel publicable con todo el estilo (spotlight, cyc blanco, pared roja,
texto detrás de la cabeza). Lo que no tiene es movimiento real del sujeto: la boca no habla. Dilo al entregar y
acompáñalo de los prompts de `shot-archetypes.md` para la versión con video generado.

## Pasos

1. **Fotos**: mismas prendas (idealmente negras), luz pareja. Lo ideal: frente neutro, perfil izquierdo, perfil
   derecho, sonrisa y boca abierta "hablando". Selfies sirven: el recorte queda como busto.
2. **Recorte**: `python scripts/cutout.py fotos/ recortes/`. Compón uno sobre rojo para revisar bordes y pelo.
3. **VO + palabras**: VO final → `transcribe.py` → recorta pausas (SKILL.md §2).
4. **`shots.json`**: un plano por frase, con los cortes calculados desde las palabras
   (corte = inicio de la primera palabra − 0.12 s, nunca antes del final de la palabra anterior).
5. **Render**: `python scripts/photo_plates.py shots.json plates.mp4 matte.mp4` (~1 s por frame en 4 CPU).
6. Mezcla con la VO y pasa `kinetic_captions.py render --matte matte.mp4`.

## Asignar fotos a planos

- Perfil que mira a la izquierda del cuadro → `cx: 0.6` y texto a la izquierda (el sujeto "mira" la palabra).
  Perfil que mira a la derecha → `cx: 0.42` y texto a la derecha.
- Sonrisa para el CTA; boca abierta para el hook y la frase del CTA; neutra para la frase de "problema".
- Repetir una foto está bien si cambia el fondo. No espejes la cara (las asimetrías se notan).
- Alterna fondos: spot (oscuro) → cyc (claro) → ui (oscuro) → red (color) → …

## Esquema de `shots.json`

```jsonc
{
  "duration": 24.2,                                   // = duración de la VO ya recortada
  "cutouts": {"p1": "recortes/frente.png", "p2": "recortes/perfil_izq.png"},  // relativas a shots.json
  "shots": [
    {"start": 0.0, "end": 2.18, "type": "spot", "photo": "p5"},
    {"start": 2.18, "end": 3.06, "type": "cyc", "photo": "p1", "cx": 0.5, "width": 1.0},
    {"start": 3.06, "end": 3.99, "type": "ui", "y": 0.45, "card_w": 1000, "fs": 78,
     "items": [{"text": "escribe un post sobre marketing", "t": 0.05, "type_cps": 42, "squiggle_t": 0.8}]},
    {"start": 3.99, "end": 5.03, "type": "red", "photo": "p3", "cx": 0.42, "width": 1.05},
    {"start": 18.07, "end": 20.9, "type": "ui", "label": "Tu prompt",
     "items": [{"pill": "ROL", "text": "Actúa como…", "t": 0.0},
               {"pill": "CONTEXTO", "text": "Soy…", "t": 0.75}]},
    {"start": 12.36, "end": 14.99, "type": "sticky", "rot": -9}
  ]
}
```

| Campo | Tipos | Qué hace |
|---|---|---|
| `photo` | spot, cyc, red | clave de `cutouts` |
| `cx` | spot, cyc, red | centro horizontal del avatar (0–1) |
| `width` | spot, cyc, red | ancho del avatar relativo al cuadro (1.0 = 1080 px) |
| `items[]` | ui | bloques del prompt: `text`, `t` (s desde el inicio del plano), `pill` (ROL, CONTEXTO, TAREA, FORMATO), `type_cps` (tipea a N caracteres/s), `squiggle_t` (subrayado rojo de "mal prompt") |
| `fs`, `card_w`, `y`, `label`, `zoom` | ui | tamaño de letra, ancho de la tarjeta, posición vertical, etiqueta, zoom extra |
| `rot` | sticky | rotación del post-it |

Pon el texto grande del plan (kinetic_captions) en el 40 % superior: el busto ocupa el resto. En planos `ui` usa
`mode: "none"` en el plan: la pantalla ya es el texto.

## Límites

- Sin labios ni gestos: compensa con cortes cortos (≤ 2 s) y cambios de foto/fondo en cada frase.
- La luz de las fotos no cambia con el fondo; el script aplica un grade suave por tipo (frío en spot, limpio en cyc,
  cálido en rojo), pero fotos con luz muy dura o de color se notarán pegadas.
- Para la versión "real", genera los mismos planos con el generador de video usando las fotos como referencia de
  personaje y reutiliza el mismo `plan.json` con `retime`.
