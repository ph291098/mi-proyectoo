---
name: reel-referencia
description: Edita un vídeo vertical (1080x1920) copiando el estilo de un VÍDEO DE REFERENCIA con Remotion. Analiza la referencia fotograma a fotograma y escribe un estilo.md con valores medidos (ritmo, subtítulos, textos, b-roll, transiciones, zooms, color, sonido); luego transcribe el vídeo del usuario con Whisper por palabra, corta silencios de más de 0,3 s y tomas falsas, quita barras negras, aplica LUT de D-Log y corrección de color, y lo monta con subtítulos palabra a palabra, motion graphics anclados a la voz, música de fondo con ducking y efectos. Los estilos se guardan en estilos/ para reutilizarlos. Úsala cuando el usuario diga "edítalo como la referencia", "copia el estilo de este vídeo", "analiza este reel de referencia", "corta lo innecesario y ponle motion", "usa el estilo de la referencia" o pase un vídeo de referencia junto a su grabación. Para el estilo de marca lavanda de @soypablo.ai usa la skill reel-edicion.
user-invocable: true
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - AskUserQuestion
---

# /reel-referencia — edita como el vídeo de referencia

Flujo en 5 pasos. **No avances de paso sin terminar el anterior.** Firma por defecto:
`@soypablo.ai` (ver `CLAUDE.md` del repo).

## Paso 0 — preparar

```bash
SKILL_DIR=$(git rev-parse --show-toplevel 2>/dev/null)/.claude/skills/reel-referencia
[ -d "$SKILL_DIR" ] || SKILL_DIR=~/.claude/skills/reel-referencia
node -v && ffmpeg -version | head -1 && uv --version          # faltan → brew install node ffmpeg uv
cp -R "$SKILL_DIR/plantilla" ~/reels/<nombre> && cd ~/reels/<nombre>
npm install
npx skills add remotion-dev/skills -y                         # skills oficiales de Remotion (opcional)
mkdir -p work && cp <referencia> work/referencia.mp4 && cp <grabación> work/mi-video.<ext>
```

Whisper no se instala: se ejecuta con `uvx` (en Mac con Apple Silicon, `mlx-whisper`). El
modelo turbo se descarga la primera vez.

## Paso 1 — el estilo

**¿Hay vídeo de referencia?** Analízalo:

```bash
scripts/analiza_referencia.sh work/referencia.mp4 work/ref
```

Deja 2 fotogramas por segundo, uno por cada cambio de plano, hojas de contacto con el
segundo impreso, fotogramas a 1080x1920, la transcripción y un `resumen.txt` (planos, silencios,
sonoridad, palabras por minuto). **Lee TODAS las hojas (`work/ref/hoja*.jpg`)** y mide con
`scripts/mide_color.py` sobre los `full_*.png` (fondo, acento, texto). Escribe `estilo.md` en el
proyecto con **valores concretos, no adjetivos** y marca con **[SUPOSICIÓN]** lo que no se pueda
medir (fuente exacta, música, efectos que no oyes). Secciones obligatorias:

1. **Ritmo de cortes**: silencios, duración de cada plano y media, % a cámara frente a % de gráficos, estructura.
2. **Subtítulos**: fuente, tamaño normal/destacada en px, posición (a cámara y sobre gráficos), palabras por bloque, animación de entrada y salida, qué palabra se destaca y de qué color.
3. **Textos en pantalla** · 4. **B-roll** · 5. **Transiciones** · 6. **Zooms** · 7. **Color** (hex medidos) · 8. **Sonido** (LUFS, pico real, LRA)
9. **Correcciones del usuario** (vacía al principio: la llena el paso 4).

**Enséñale un resumen de 5 líneas y espera** antes de seguir. Después guarda una copia
reutilizable: `cp estilo.md "$SKILL_DIR/estilos/<nombre>.md"`.

**¿No hay referencia?** Lista `$SKILL_DIR/estilos/` y pregunta cuál usar
(`ejemplo-referencia.md` es el estilo del primer análisis: lienzo claro, azul #0050FB, Inter Tight).

**Del estilo al código.** Pasa los valores a `src/theme.ts` (colores `C`, `SUB` con tamaños,
posiciones y fotogramas de animación, `TARJETA`) y las fuentes a `src/fonts.ts`. Las fuentes de
Google (licencia OFL) se bajan de `raw.githubusercontent.com/google/fonts/main/ofl/<familia>/`
a `public/fonts/`, con su `OFL.txt`. **Una fuente comercial (p. ej. Coolvetica) nunca va a
`public/fonts` del repo**: se carga desde su ruta local.

## Paso 2 — preparar la grabación

```bash
python3 scripts/prepara_fuente.py work/mi-video.mov                              # barras + escala + bt709
python3 scripts/prepara_fuente.py work/mi-video.mov --lut luts/DLogM_Rec709.cube  # D-Log / D-Log M
python3 scripts/prepara_fuente.py work/mi-video.mov --color "curves=b='0/0 0.34/0.43 1/1'"
```

Deja `public/fuente.mp4` (1080x1920, H.264 crf 14, bt709) y `work/audio.wav` en una sola pasada.

- **Barras negras**: `cropdetect` sobre todo el vídeo, 1 px más por lado (las columnas de
  transición dejan una línea gris) y 9:16 exacto. Si amplía más de ×1,2 lo avisa: dile al usuario
  que se verá algo blando y que exportar en vertical desde el origen lo evita.
- **D-Log**: pide el **LUT oficial de DJI de esa cámara y ese perfil** (D-Log y D-Log M no son
  intercambiables) y el archivo ORIGINAL, sin reexportar. Se aplica primero, en RGB de 16 bits.
- **Color**: mide zonas neutras (pared, techo, una camiseta) con `scripts/mide_color.py` y prueba
  filtros sobre un fotograma hasta que salgan R≈G≈B. **Vigila la piel**: si B > G se ha ido a magenta.
  Con luz cálida, las `curves` en azul solo sobre medios tonos funcionan mejor que `colorbalance`.
- **iPhone en HDR (HLG/bt2020)**: antes hay que pasarlo a SDR con tonemapping
  (`zscale=t=linear,tonemap=hable,zscale=t=bt709:m=bt709:p=bt709`) o se verá lavado.

## Paso 3 — editar

1. **Transcribe** por palabra:
   `uvx --from openai-whisper whisper work/audio.wav --model turbo --language es --word_timestamps True --output_format json --output_dir work`
   (en Mac: `mlx-whisper`, ver `analiza_referencia.sh`). Imprime las palabras con su índice.
2. **Palabras dudosas** (marcas, nombres): **pregunta al usuario** antes de corregirlas. Solo se
   corrigen errores del transcriptor (`fix` por índice), nunca lo que dijo. Si Whisper parte un token
   («90» «%»), fúndelo: `"14": "90%", "15": ""`.
3. **Tomas falsas y repeticiones** (frase cortada, pausa larga y la misma frase otra vez):
   `quitar: [[i, j]]` con los índices de la toma mala. Díselo al usuario.
4. **`montaje.config.json`** (parte de `montaje.config.example.json`, un ejemplo real comentado):
   - `bloques`: palabras por bloque y cuál se destaca (`key`); `serif: true` para una palabra concepto.
   - `escenas`: ancladas a PALABRAS (`desde`/`en` = inicio de la palabra i, `hasta` = su final).
   - `sfx` en palabras, `zooms` (escalas alternas por salto; **máx. 1,1 si la fuente se amplió**), `handle`.
5. `python3 scripts/montaje.py` corta los silencios de más de `max_silencio` cruzando Whisper con
   `silencedetect` (Whisper alarga palabras dentro del silencio) y escribe `src/data/montaje.json`.

### Escenas (`src/Escenas.tsx`)

| tipo | para qué | campos |
|---|---|---|
| `tarjeta` | gancho: el plano en una tarjeta sobre el lienzo que se expande a pantalla completa | `label`, `expandEn` |
| `buscador` | «escribes como en Google»: barra que se escribe sola + cifra que cuenta | `consulta`, `dato{en,valor,sufijo,label}` |
| `numero` | «son 2 pasos / 4 partes»: número gigante + palabra serif + lista | `valor`, `num{en}`, `palabra`, `palabraEn{en}`, `items` |
| `filas` | tarjeta cuyas filas se escriben cuando la voz las nombra (puede reaparecer) | `titulo`, `filas[{label,texto,en}]`, `completo{en,label}` |
| `comparacion` | antes/después: la mala se apaga, la buena entra | `mala`, `buena{en,label}` |
| `comentario` | CTA «comenta PALABRA» + lo que se envía | `palabra`, `titulo`, `recurso{en,label,sub}` |

Reglas: **cada elemento entra cuando la voz lo nombra**; corte seco cámara ↔ gráfico con la voz
debajo; apunta al % de gráficos que mida la referencia; ningún dato inventado (las cifras son las
que dice el usuario). **Si escribes un texto de ejemplo** (como el prompt de `filas`), díselo para
que lo revise. Un tipo nuevo de escena se añade a `ESCENAS` en `Escenas.tsx` siguiendo el mismo patrón.

## Paso 4 — QA, render y sonido

```bash
npx tsc --noEmit
npx remotion still src/index.ts Reel qa/f300.png --frame=300 --image-format=png   # uno por escena
uv run --with numpy --with scipy python scripts/musica.py --sfx public/sfx --dur <s> --out public/musica.wav
npx remotion render Reel out/reel-raw.mp4 --codec h264 --crf 16 --audio-bitrate 320k --color-space=bt709 --concurrency=2 --timeout=120000
scripts/sonido.sh out/reel-raw.mp4 out/reel.mp4 public/musica.wav                  # -14 LUFS + música con ducking
ffmpeg -i out/reel.mp4 -vf "fps=1.1,scale=150:-1,tile=10x3" -frames:v 1 qa/tira.jpg  # mira la tira entera
```

- **Música**: `musica.py` sintetiza un lo-fi original (sin licencias) y los efectos (whoosh, pop,
  clic). Si el usuario tiene una pista con licencia, pásala como tercer argumento de `sonido.sh`.
  `MUSICA_LUFS` (por defecto −29) y el ducking la dejan unos 17 dB por debajo de la voz.
- **Mira los 3 primeros fotogramas** (`select='lt(n\,3)'`): ahí se ven los saltos de escena.
- Entrega con la **lista de decisiones**: qué cortaste (silencios, tomas falsas), qué corregiste,
  dónde te apartaste de `estilo.md` y por qué, y qué textos inventaste.

## Paso 5 — correcciones que se quedan

Cuando el usuario corrija algo y le guste el resultado, **añádelo a «Correcciones del usuario»**
en `estilo.md` y en `$SKILL_DIR/estilos/<nombre>.md`, con el valor concreto
(«subtítulos a cámara en y=240, no 190»). Si la corrección es de código (un tipo de escena nuevo,
un valor por defecto), llévala también a `plantilla/` para que el siguiente vídeo salga bien.

## Trampas conocidas

- **Render que se cuelga** («delayRender … Loading font … not cleared»): el compositor se cae con
  muchos procesos. `--concurrency=2 --timeout=120000`.
- **En la nube de Claude Code**: Chromium sin H.264 → usa el headless shell de Playwright
  (`--browser-executable=/opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell`);
  Google Fonts no carga en el navegador de render → fuentes locales en `public/fonts`; si Whisper
  o un LUT no se descargan, el dominio está bloqueado en Network access del entorno.
- **Escena al principio**: la primera palabra no cae en 0 s; `tarjetaActiva` trata un inicio
  < 0,1 s como 0 (si no, salen 1–2 fotogramas sin tarjeta).
- **Subtítulo blanco sobre pared clara**: no se lee con sombra suave; usa la sombra doble de
  `comun.tsx` o pásalos a la zona oscura.
- **La firma tapa tarjetas**: solo se pinta a cámara.
- **`public/` no sirve symlinks** y `remotion still` exige que la extensión case con `--image-format`.

## Ficheros

```
reel-referencia/
├── SKILL.md
├── estilos/                     estilos guardados (uno por referencia analizada)
│   └── ejemplo-referencia.md
└── plantilla/                   se copia entera a cada proyecto
    ├── montaje.config.example.json
    ├── scripts/  analiza_referencia.sh · prepara_fuente.py · mide_color.py
    │             montaje.py · musica.py · sonido.sh
    ├── src/      Root.tsx · Reel.tsx · Escenas.tsx · comun.tsx · theme.ts · fonts.ts · data.ts
    └── public/fonts/  Inter Tight · Instrument Serif · JetBrains Mono (OFL, con licencia)
```
