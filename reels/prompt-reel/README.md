# Reel: cómo crear un buen prompt

Hecho con la skill `kinetic-reel-edit`. 24.2 s · 1080×1920 · 24 fps · -14 LUFS.
Versión 1: avatar con fotos (modo avatar con fotos) + voz TTS de ElevenLabs ("Hache – Voz Comercial LATAM").
El video y las fotos **no** están en este repo porque es público.

## Guion (63 palabras)

> ¿La IA te responde cosas genéricas? No es la IA… es tu prompt. Te paso la fórmula.
> Primero, dale un rol: "actúa como experto en…". Después, contexto: quién eres, para quién es y qué quieres lograr.
> Luego, la tarea exacta, con un ejemplo. Y al final, el formato: lista, tabla o guion.
> Rol, contexto, tarea, formato. **Escribe la palabra PROMPT y te envío mi guía.**

- **Hook (0–3 s)**: pregunta que nombra el dolor + giro ("no es la IA… es tu prompt").
- **Promesa**: "te paso la fórmula". **Cuerpo**: 4 pasos con marcadores (primero, después, luego, al final).
- **Recap**: las 4 palabras de la fórmula mientras el prompt completo se arma en pantalla.
- **CTA**: comentar PROMPT → guía.

## Plano por plano

| # | Tiempo | VO | Plano | Texto en pantalla |
|---|---|---|---|---|
| 1 | 0.00–2.18 | ¿La IA te responde cosas genéricas? | Spotlight, cara hablando | nube: la IA · te responde · cosas · **genéricas** (entra desenfocada, detrás de la cabeza) |
| 2 | 2.18–3.06 | No es la IA… | Cyc blanco, cara neutra | **no es / la IA** (glow azul, "la IA" detrás) |
| 3 | 3.06–3.99 | …es tu prompt. | Pantalla: se tipea "escribe un post sobre marketing" y aparece un subrayado rojo | (la pantalla es el texto) |
| 4 | 3.99–5.03 | Te paso la fórmula. | Pared roja, perfil derecho | te paso · la · **fórmula** |
| 5 | 5.03–6.46 | Primero, dale un rol: | Cyc, perfil izquierdo (mira el texto) | primero · dale un · **rol** |
| 6 | 6.46–8.19 | "actúa como experto en…" | Pantalla: etiqueta ROL + se tipea el rol | (pantalla) |
| 7 | 8.19–9.60 | Después, contexto: | Cyc, perfil derecho | después · **contexto** |
| 8 | 9.60–12.36 | quién eres, para quién es y qué quieres lograr | Spotlight (callback del hook), cara neutra | nube: quién eres · para quién es · qué quieres · **lograr** |
| 9 | 12.36–14.99 | Luego, la tarea exacta, con un ejemplo. | Post-it amarillo entra deslizando | luego → la tarea → exacta → con un ejemplo |
| 10 | 14.99–16.49 | Y al final, el formato: | Pared roja, perfil izquierdo | al final · el · **formato** |
| 11 | 16.49–18.07 | lista, tabla o guion. | Cyc, cara neutra | lista / tabla / o guion |
| 12 | 18.07–20.90 | Rol, contexto, tarea, formato. | Pantalla: el prompt completo se arma línea por línea (ROL, CONTEXTO, TAREA, FORMATO) | (pantalla) |
| 13 | 20.90–22.36 | Escribe la palabra PROMPT | Cyc, cara hablando | escribe · la palabra · **PROMPT** (detrás de la cabeza) |
| 14 | 22.36–24.20 | y te envío mi guía. | Pared roja, sonrisa | y te envío · **mi guía** + ícono de documento |

`plan.json` (tipografía) y `shots.json` (planos) de esta versión están en esta carpeta.

## Versión 2 con video real (Higgsfield)

Crea tu personaje (Soul ID) con tus 5 fotos y genera estos planos en 9:16, 5 s cada uno. Todos terminan en
"No text, no letters, no captions, no watermark, clean plate." para que el texto lo ponga la skill sin errores.
Viste igual en todos: camisa o hoodie negro.

1. **Hook** — High-angle wide shot looking down at [personaje] crouching on a dark concrete floor, looking up and talking to the camera with an intrigued expression, black shirt. A single hard circular spotlight from above, everything outside the circle pure black, cool blue falloff at the edge. Slow pull-back. 24mm, cinematic, high contrast.
2. **No es la IA** — Medium shot of [personaje] sitting on the floor of an infinite white studio, small in frame, shaking head slightly, soft high-key light, lots of empty space above. Static camera.
3. **Pantalla** — mejor graba tu pantalla real escribiendo "escribe un post sobre marketing" en ChatGPT/Claude, recórtala a 9:16 con zoom al 180 % y un paneo lento.
4. **La fórmula** — Medium shot of [personaje] leaning against a saturated crimson red wall, arms crossed, confident half smile, soft key light front-left, gentle vignette. Static. Empty space above the head.
5. **Rol** — Wide shot of [personaje] in the white studio, turning the head to look at frame left, pointing up. Static camera.
6. **Pantalla** — grabación real escribiendo "Actúa como experto en marketing de contenido."
7. **Contexto** — Close-up of [personaje] in the white studio in profile looking to the right, thoughtful. Slow push-in.
8. **Preguntas** — Same spotlight look as shot 1, [personaje] sitting cross-legged in the circle of light, writing on a yellow notepad. Static high angle.
9. **Tarea** — Extreme close-up of a yellow sticky note sliding onto a light grey desk, shallow depth of field, soft daylight, smooth lateral motion.
10. **Formato** — [personaje] against the red wall in profile looking left, counting on fingers. Static.
11. **Opciones** — [personaje] in the white studio, three quick gestures toward camera. Static.
12. **Recap** — grabación real del prompt completo (las 4 partes) en tu herramienta de IA.
13. **CTA** — Medium close-up of [personaje] in the white studio talking straight to camera, energetic, slight push-in.
14. **Guía** — [personaje] against the red wall, big genuine smile, nodding at camera. Static.

Luego: monta los clips en el mismo orden y duración de la tabla, exporta `edit.mp4` con la voz y corre
`kinetic_captions.py retime` (si cambias la voz) y `render` con este `plan.json`.

## Cambiar la voz por la tuya

Graba el mismo guion, luego:
```bash
python .claude/skills/kinetic-reel-edit/scripts/transcribe.py tu_voz.wav --out words.json --lang es
python .claude/skills/kinetic-reel-edit/scripts/kinetic_captions.py retime --plan reels/prompt-reel/plan.json \
  --words words.json --out plan_tu_voz.json
```
`retime` mueve los cortes y cada palabra a tu voz sin perder las ediciones del plan.

## Copy para el post

> La IA no te da respuestas genéricas porque sea mala… es tu prompt 👀
> Usa la fórmula R-C-T-F: **Rol · Contexto · Tarea · Formato**.
> 💬 Comenta **PROMPT** y te envío mi guía con plantillas listas para copiar.
>
> #inteligenciaartificial #chatgpt #prompts #ia #productividad #marketingdigital
