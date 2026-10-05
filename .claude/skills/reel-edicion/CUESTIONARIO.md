# Cuestionario de perfil

Se hace **una sola vez** (o cuando el usuario diga «cambia mi estilo», «rehaz mi perfil»,
«quiero otros colores»). Resultado: `~/.config/reel-edicion/perfil.json`. Cada proyecto
nuevo lo aplica con `python3 scripts/aplica_perfil.py`.

## Cómo preguntar

- Usa la herramienta de preguntas (`AskUserQuestion`) en **tres rondas** de hasta 4
  preguntas. Las opciones de abajo son las que se ofrecen; el usuario siempre puede
  escribir otra cosa («Other»): un hex, otra Google Font, otra ruta.
- Lo que es texto libre (usuario, notas) pregúntalo en el chat, no con opciones.
- No preguntes lo que ya sabes: si en la conversación ya dijo su @ o su plataforma, úsalo.
- Al terminar, **enséñale el resumen del perfil** en una tabla y ofrece renderizar la demo
  (`scripts/demo_words.py`, ver SKILL.md → «Probar la plantilla») para que vea su estilo
  antes de su primer vídeo real.

## Ronda 1 — quién eres y dónde publicas

| # | Pregunta | Opciones (→ campo del perfil) |
|---|---|---|
| 1 | ¿Qué @ va en el vídeo como firma? | texto libre; vacío = sin firma → `handle` |
| 2 | ¿En qué idioma hablas en tus vídeos? | Español · Inglés · Portugués · Otro → `idioma` (`es`/`en`/`pt`…) |
| 3 | ¿Dónde publicas? (multiselección) | Instagram Reels · TikTok · YouTube Shorts · LinkedIn → `plataformas` |
| 4 | ¿Cómo grabas casi siempre? | A cámara en vertical (móvil, OBS) → `camara` · Pantalla dividida de CapCut (captura arriba, cara abajo) → `split` · Horizontal 16:9 (Zoom, charla, pantalla) → `horizontal` · Demo de pantalla sin cara → `pantalla` → `plano.fuente_habitual` |

## Ronda 2 — cómo se ve

| # | Pregunta | Opciones (→ campo) |
|---|---|---|
| 5 | ¿Qué paleta? (con `preview` de los hex) | **Eléctrico** acento `#3DD6F5` · **Coral** acento `#FF5A36`, resalte `#FFD23F` · **Lima** acento `#C6F432` · **Violeta** acento `#A78BFA`, resalte `#F0ABFC` · Otro: su hex de marca → `colores` |
| 6 | ¿Qué tipografía? | Inter (neutra, técnica) · Montserrat (clásica de redes) · Poppins (redonda, amable) · Plus Jakarta Sans (moderna) · Otra Google Font → `fuente.principal` |
| 7 | ¿Cómo quieres los subtítulos? | MAYÚSCULAS sueltas con sombra · Frase normal sueltas con sombra · MAYÚSCULAS en píldora oscura · Frase normal en píldora → `subtitulos.upper` / `subtitulos.band` |
| 8 | Cuando no hablas de nada concreto, ¿de qué color va la palabra que suena? ¿Y cuando nombras una marca? | Siempre mi color de resalte · Color de la marca que nombro (Notion, WhatsApp…) → `subtitulos.byBrand` |

Paletas completas (lo que se escribe en `colores`):

```json
"electrico": { "accent": "#3DD6F5", "highlight": "#3DD6F5", "ink": "#0B0F14", "text": "#FFFFFF", "soft": "#D6DCE5", "line": "#7C8794", "ok": "#4ADE80", "alert": "#FB7185" }
"coral":     { "accent": "#FF5A36", "highlight": "#FFD23F", "ink": "#120C0A", "text": "#FFFFFF", "soft": "#E8DDD8", "line": "#8F7F78", "ok": "#4ADE80", "alert": "#FF3B5C" }
"lima":      { "accent": "#C6F432", "highlight": "#C6F432", "ink": "#0E0F0C", "text": "#FFFFFF", "soft": "#DDE3D0", "line": "#7F8773", "ok": "#4ADE80", "alert": "#FB7185" }
"violeta":   { "accent": "#A78BFA", "highlight": "#F0ABFC", "ink": "#0F0B16", "text": "#FFFFFF", "soft": "#E2DCF0", "line": "#857C99", "ok": "#4ADE80", "alert": "#FB7185" }
```

Con un hex propio: `accent` y `highlight` = ese hex; `ink` = un negro teñido de su tono
(luminosidad ~5 %); el resto, los de «eléctrico». Si el hex es muy oscuro (no se lee sobre
un vídeo), díselo y propón una versión más clara.

## Ronda 3 — plano, sonido y cierre

| # | Pregunta | Opciones (→ campo) |
|---|---|---|
| 9 | En tu plano habitual, ¿dónde queda espacio libre (pared, fondo) para rótulos pequeños? | A la izquierda de mi cara · A la derecha · Arriba, estoy centrado · No sé, mídelo en cada vídeo → `plano.espacio_libre` (`izquierda`/`derecha`/`arriba`; «no sé» = `izquierda` y medir siempre) |
| 10 | ¿Efectos de sonido y música? | Efectos sutiles, sin música · Efectos y música de fondo · Solo música · Nada, solo mi voz → `audio.efectos`, `audio.musica` |
| 11 | ¿Qué micro usas? | De solapa o de mano cerca de la boca → `cercano` · El del móvil o la cámara, o sala → `sala` → `audio.micro` |
| 12 | ¿Cómo cierras normalmente? | Una pregunta abierta para comentarios · «Comenta PALABRA» y envío un recurso por DM · «Sígueme para más» · Sin CTA → `cta.tipo` (`pregunta`/`keyword`/`seguir`/`ninguno`) |

## Y en el chat, dos preguntas abiertas

- **«¿Hay algo que NUNCA quieras ver en tus vídeos?»** (p.ej. «nada de emojis», «no me
  tapes el producto», «sin transiciones de destello») → `notas.evitar` (lista).
- **«¿Cómo es tu tono?»** (p.ej. «directo y con humor», «sobrio, para empresas») → `notas.tono`.
  Esto decide cómo se redactan kickers y tarjetas.

Si el usuario tiene **logo propio** o una marca que nombra a menudo, añádela ya:
`python3 scripts/logos_gen.py --imagen mimarca ruta/logo.png "Mi Marca" "#HEX"` o
`--add slug` para marcas de Simple Icons. Guarda sus slugs en `marcas_frecuentes`.

## Dónde van las cosas (esquema completo)

Ver `perfil.example.json`. Rutas:

- `audio.biblioteca` — carpeta compartida entre proyectos para el kit de efectos y la
  música. Por defecto `~/ReelKit` (`sfx/` y `musica/` dentro). Pregúntala solo si el
  usuario quiere efectos o música.
- `transcripcion` — `mlx-whisper` en un Mac con Apple Silicon (el más rápido); si no,
  `whisper` (openai-whisper). Detéctalo tú (`uname -m`), no lo preguntes.
