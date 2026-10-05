---
name: reel-edicion
description: Monta y renderiza reels/TikToks/Shorts verticales (1080x1920) con Remotion a partir de una grabación a cámara, un split de CapCut, una charla o una grabación de pantalla. Subtítulos con resalte palabra a palabra, tarjetas de refuerzo, diagramas con iconos que se dibujan, B-roll a pantalla completa, logos de marca reales, grafismo de suspenso (sellos, cronómetro, censura), música y efectos CC0, difuminado de datos sensibles verificado con OCR, y export a -14 LUFS y color bt709. Viene adaptada a la marca de @pablohernandez.ai (perfil.json + ESTILO.md: lavanda y tinta violeta, Coolvetica, subtítulos en bloque blanco); un cuestionario permite cambiar de estilo. Úsala cuando el usuario quiera "montar el reel", "editar este vídeo para TikTok/Instagram", "ponerle subtítulos", "renderizar el reel", "configurar mi estilo de edición" o retocar una composición existente.
user-invocable: true
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - AskUserQuestion
---

# /reel-edicion — Reels verticales con Remotion

## Paso 0 — el perfil (siempre lo primero)

`SKILL_DIR` es la carpeta de esta skill: `.claude/skills/reel-edicion` en la raíz del
repo, o `~/.claude/skills/reel-edicion` si está instalada para el usuario.

```bash
SKILL_DIR=$(git rev-parse --show-toplevel 2>/dev/null)/.claude/skills/reel-edicion
[ -d "$SKILL_DIR" ] || SKILL_DIR=~/.claude/skills/reel-edicion
cat ~/.config/reel-edicion/perfil.json 2>/dev/null || echo "SIN PERFIL"
```

**Esta skill ya viene adaptada a @pablohernandez.ai.** `perfil.json` (en esta carpeta) es
su perfil de marca, sacado de su moodboard de vídeo, y `ESTILO.md` recoge el resto de su
sistema visual: subtítulos A/B/C, overlays, ritmo, color, audio y portadas. **Lee
`ESTILO.md` antes de montar nada**: sus reglas valen tanto como las de abajo.

- **Sin perfil** → no hagas el cuestionario: instala el de la marca y enseña el resumen.
  ```bash
  mkdir -p ~/.config/reel-edicion && cp "$SKILL_DIR/perfil.json" ~/.config/reel-edicion/perfil.json
  ```
  Comprueba con el usuario lo que el moodboard no dice: la ruta de su Coolvetica
  (`fuente.archivo`), su micro (`audio.micro`) y si en este vídeo la acción del CTA es
  guardar, comentar o seguir. El cuestionario de `CUESTIONARIO.md` queda para cuando el
  usuario pida un estilo distinto.
- **Con perfil** → léelo y respétalo en todo: `notas.tono` decide cómo se redactan
  kickers y tarjetas; `notas.evitar` son reglas tan firmes como las de abajo; `cta.tipo`
  decide el cierre; `plano.fuente_habitual` la plantilla por defecto.
- «Cambia mi estilo», «otros colores», «rehaz mi perfil» → repite solo las preguntas
  afectadas, reescribe el perfil y vuelve a correr `aplica_perfil.py` en el proyecto.

Cada vez que el usuario corrija algo del estilo («los subtítulos más pequeños», «no
pongas X nunca»), **ofrécele guardarlo en su perfil** (`subtitulos.*` o `notas.evitar`):
así la siguiente pieza sale bien a la primera.

## Elegir plantilla

| Fuente | Plantilla | Cuándo |
|---|---|---|
| **Ya vertical 1080x1920** (cámara, OBS, móvil, export de CapCut) | **`template-camara/`** | El plano llena el cuadro; no hay ventana. Casi siempre esta. |
| 16:9 metido en vertical (charla, Zoom/Meet, grabación de pantalla) | `template/` | El 16:9 va en una ventana con fondo desenfocado detrás |

Verifica la resolución real antes de decidir:

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,duration -of default=nw=1 FUENTE
```

Si la fuente ya es 1080x1920 **no hay máster más grande**: reencuadrar en post significa
escalar, y a partir de ×1.25 se nota.

## Probar la plantilla (sin grabación propia)

La demo trae un guion ficticio con tiempos sintéticos y un fondo degradado. Sirve para
ver el perfil aplicado antes del primer vídeo real:

```bash
cp -R "$SKILL_DIR/template-camara" ~/reels/demo && cd ~/reels/demo
npm install
python3 scripts/aplica_perfil.py
python3 scripts/demo_words.py
ffmpeg -v error -f lavfi -i "gradients=s=1080x1920:c0=0x1d2733:c1=0x3a4a5c:speed=0.01:d=40,format=yuv420p" \
  -f lavfi -i "sine=f=220:d=40,volume=0.05" -shortest -c:v libx264 -crf 28 -c:a aac public/c1.mp4
cp cortes.example.json cortes.json
python3 scripts/gen_data.py --work work --cuts c1 --config cortes.json
npx remotion studio            # o: npx remotion still src/index.ts Demo qa/f700.png --frame=700 --image-format=png
```

`cortes.example.json` enseña el formato completo con la doctrina comentada en las claves
`_…`: teaser, secciones, tres diagramas, una tarjeta y la pregunta final.

---

## Zonas protegidas — los números correctos

Medido contra las plataformas en orgánico:

```
TikTok   top ~140 · bottom ~334 (450 en ads) · left ~60 · right 140-180
Reels    top ~180 · bottom ~320-420          · left ~60 · right ~120
Shorts   top ~150 · bottom ~350              · left ~50 · right ~120

UNIÓN →  top 180 · bottom 420 · left 70 · right 180
         zona segura: x 70 → 900 · y 180 → 1500
```

- **`right` es el que más se falla**: la columna de acciones de TikTok llega a 180 px.
  Nada de contenido pasa de **x = 900**.
- Un `bottom` de 500 es demasiado prudente: regala 80 px por nada.

### El recorte 4:5 del feed de Instagram — lo que más cuesta recordar

En el **feed principal** el reel se ve a **4:5 recortado desde el centro**: se oculta todo
lo que quede fuera de **y 285 → 1635**. **El CTA va dentro de esa franja o desaparece
justo donde caen la mayoría de las impresiones.** Por eso `KICKER_Y = 300`.

---

## Cómo encontrar el espacio muerto de una grabación

No lo estimes a ojo: mídelo. Luminancia media por columna y por fila sobre una docena de
fotogramas revela dónde no pasa nada en toda la pieza.

```bash
ffmpeg -v error -i FUENTE -vf "fps=1/6,scale=108:192,format=gray" -f rawvideo -pix_fmt gray - > lum.raw
# promediar por columna y por fila (108x192 bytes por fotograma)
```

Un resultado típico de alguien encuadrado a la derecha:

```
cara            x 480→900 · y 240→700
pared muerta    x  70→480 · todo el alto (por debajo del 55 % del pico)
franja oscura   y   0→240
```

**Las gráficas pequeñas — kicker, CTA, chips de marca — van sobre la pared muerta, no
apiladas abajo.** Es lo que hace que el cuadro deje de parecer vacío sin tocar el plano.
El perfil da un punto de partida (`plano.espacio_libre` → `RAIL` en `theme.ts`); cada
grabación se comprueba.

Para la **silueta** (barba, pelo oscuro) mide el **máximo por columna**, no la media: lo
oscuro tira la media hacia abajo y la barbilla acaba más abajo de lo que dice.

## Geometría de `template-camara`

```
RAIL         x 70, ancho 430   columna libre (izquierda por defecto; la fija el perfil)
KICKER_Y     300               kicker y CTA; dentro del recorte 4:5
TOPIC_Y      596               chip de marca
TITLE_BAND   cy 940, h 360     760 → 1120
CARD_BAND    cy 965, h 350     790 → 1140, ancho x 70 → 900
CAPTION_CY   1290              2 líneas a 80px caben entre 1188 y 1392
HANDLE_Y     1445
```

**Sin barra de progreso**: come espacio y no dice nada.

`theme.ts` tiene dos partes: el bloque **PERFIL** (colores, `CAPTIONS`, `RAIL`), que
escribe `scripts/aplica_perfil.py`, y la **geometría**, que se recalibra por fuente. Más
constantes para fuentes de CapCut: `SPLIT_Y` (borde inferior de la captura en un split;
lo mide `layout.py`) y `TOPIC_ALIGN` — `"chip"` (plano lleno), `"inline"` (el logo va
dentro de la línea del kicker y de las secciones) u `"off"` (solo da el color del
resalte). `verifica.py` lee todas de `theme.ts`: recalibrar ahí basta.

---

## Las reglas que no se negocian

**1. Una tarjeta NUNCA repite lo que dice la voz.**
Contrasta, deduce o remata. Si dice «esta herramienta trabaja contigo y la otra trabaja
por ti», la tarjeta da la consecuencia — *vive mientras la ventana está abierta* vs *sigue
cuando la cierras* — no la frase.

**2. El subtítulo sigue al AUDIO, no a lo que debió decir.**
Se corrigen errores del transcriptor (marcas y palabras técnicas: `Cloud`→`Claude`,
`Chrome Jobs`→`cron jobs`). No se corrige al hablante: si dijo «en 40 segundos» y el reel
dura 76, se queda.

**3. Cada corrección se verifica por CONTEXTO, no por parecido sonoro.**
Documenta cada arreglo con la frase donde vive, en las claves `_fix_...` y `_no_se_toca`
de `cortes.json` (las que empiezan por `_` el script las ignora a cualquier profundidad).

**4. Una sola cosa que leer a la vez.**
Cuando una tarjeta de TEXTO está en pantalla, los subtítulos callan (`hide`). Los chips
pequeños sí conviven: están en otra banda y se leen de un vistazo. Un **diagrama de
iconos** (`Flow.tsx`) tampoco calla a los subtítulos: es visual. Si en tu geometría la
banda de tarjetas pisa la de subtítulos, `FLOW_CAPTION_CY` (theme.ts) los mueve mientras
dura el diagrama; si no la pisa, vale `CAPTION_CY` y no se mueven.

**5. Entrada y salida no son el mismo movimiento invertido.**
El panel entra con barrido lateral y sale desvaneciéndose hacia abajo con desenfoque. El
título entra desde los lados y sale hacia arriba. El chip entra deslizando desde fuera.

**6. El cierre sigue el perfil (`cta.tipo`), y la keyword solo si hay algo que entregar.**
- `keyword`: el chip «comenta PALABRA» existe para disparar un envío por DM. **Solo si el
  audio lo dice y hay un recurso detrás**; sin recurso es un CTA pegado que no lleva a
  ningún sitio. Si no hay, pregunta antes de ponerlo.
- `pregunta`: el remate es una pregunta abierta, humilde y de barrera baja, y casi
  siempre ya está dicha en el propio vídeo — búscala en la transcripción. Va en grande con
  `grandes.pregunta` y `keyword: null`. La misma pregunta sirve para el caption y el
  comentario fijado.
- `seguir` / `ninguno`: un chip corto al final o nada.

**7. El color de acento es para el CTA.**
El resalte del subtítulo usa `COLORS.highlight` o el color de la marca de la que se habla
(`CAPTIONS.byBrand`; `topics` da el color). Si el acento hace seis trabajos a la vez, no
hay jerarquía.

**8. Ningún velo a pantalla completa cuando entra un panel.**
El panel lleva su propio fondo al 0.88 con blur: se lee solo. Un negro sobre TODO el plano
con diez paneles deja a la persona a oscuras media pieza.

**9. Nada tapa la cara.** Se mide y se verifica (`verifica.py`), no se promete. Ver abajo.

**10. Nunca un dato a ojo.** Cifras, precios, segundos y nombres salen de la pantalla, del
audio o de una web consultada, y se anotan en `cortes.json` (`_precios`, `_broll_…`).

---

## Subtítulos: por qué la palabra NO entra sola

Animar la opacidad de cada palabra con un muelle de ~0.30 s parece bonito y es un error.
Medido sobre un transcript real:

```
páginas 85 · mediana 0.86 s · 55 de 85 por debajo de 1 s
palabras: mediana 0.18 s · 149 de 342 duran menos de 0.15 s
→ el 46 % del tiempo el subtítulo estaba a medio aparecer
```

Por eso:

- **La opacidad de la palabra no se anima nunca.** El movimiento lo lleva un
  desplazamiento en Y escalonado por palabra.
- **La banda no se funde en cada página.** Las páginas son contiguas; lo único que la
  apaga es una tarjeta.
- Lo único que sigue a la voz es el **resalte**. Así se puede leer por delante, que es lo
  que retiene.

`CAPTIONS` en el perfil: `estilo`, `upper`, `size` (80 por defecto), `maxWords` (4), `band`,
`byBrand`. `estilo` puede ser `"sombra"` (texto suelto con trazo y sombra), `"pildora"` (banda
oscura, igual que `band: true`), `"bloque"` (caja `COLORS.paper` con el texto en
`COLORS.onPaper` y la palabra que suena en una pastilla del color de resalte: el estilo A de
`ESTILO.md`) o `"palabra"` (texto claro con sombra de tinta y la palabra activa coloreada: el
estilo B). En `"bloque"` y `"palabra"` la página entra con un pop corto, de escala 90 a 100 %.
Los paneles y los scrims usan la tinta del perfil (`INK_RGB`, que sale de `COLORS.ink`) y no
un negro fijo. `MERGE_LIMIT = 5` para una banda de 720 px:
con 7 palabras a 84 px se van a tres líneas y chocan con el handle.

Muelles: `damping 200` con `stiffness 260` está **sobre**amortiguado (ζ ≈ 9.8) y entra
lentísimo. Para asentar en ~0.12 s hace falta ζ ≈ 1: `{ damping: 20, mass: 0.4, stiffness: 250 }`.

Whisper llega a meter 6 palabras en 0.18 s; esas páginas se **fusionan** con la vecina
(`MIN_PAGE_MS 950`) y tienen techo (`MAX_PAGE_MS 2200`).

El resalte escala la palabra activa a 1.09 desde su centro, así que invade a la vecina:
el margen entre palabras se calcula **una vez por página** a partir de la palabra más
larga (≈0.58em por carácter a peso 800). Con margen fijo «CON DESARROLLO» se leía
«CONDESARROLLO». Si cambias a una fuente muy ancha, revisa un still con palabras largas.

---

## Reels de lista numerada: teaser, índice y diagramas

Tres capas; ejemplo en `cortes.example.json`.

**`Teaser.tsx` — la lista DIFUMINADA del hook.** Cuando se dice «tres tareas», entra un
panel con los temas: números nítidos en color de acento, etiquetas a 40 px con
`blur(7px)` (nunca nítidas). Se ve que hay tres cosas y no se lee cuáles: esa es la
promesa. Un marcador recorre las filas (`sweepFrom`/`sweepTo`) mientras dice «de la más
fácil a la más rentable». Los subtítulos NO callan (es el hook).

**`Sections.tsx` — el índice que paga el teaser.** «01 · CORREOS» en el sitio del kicker
(raíl, y 300, dentro del 4:5), que cambia en cada «Número N». Las etiquetas son las MISMAS
que las del teaser: lo que allí no se leía, aquí se lee. El kicker se apaga al entrar la
primera sección; la última acaba antes del chip de CTA, que vive en la misma banda. **La
línea no puede quedarse vacía**: si entre la última sección y el CTA quedan muchos
segundos, añade una sección de remate («04 · EL VEREDICTO»).

**`Flow.tsx` — diagramas de proceso.** Sustituyen al B-roll en un plano fijo: el proceso
se ve mientras se cuenta. Nodos con icono que entran con rebote cuando se nombra el paso
(`at` de `scripts/words.py`) y flechas SVG que se dibujan entre ellos:

```
chain   a → b → c → d          secuencia; `badge` etiqueta una flecha («tú revisas»)
fanin   [a b c] → hub → out    varias fuentes convergen
fanout  in → hub → [a b c]     una fuente se reparte (1 vídeo → guion + subtítulos + post)
rows    a → b  /  c → d        pares apilados
```

`icon` es un id de Lucide (`scripts/icons_fetch.py clock database bell` los baja y
regenera `src/Icons.ts`) o un `LogoId`. Marcas de Simple Icons, conceptos de Lucide (ISC).
Medidas: **etiquetas a 22 px mínimo**, **6 nodos como mucho en un `chain`** (750 px
interiores), líneas de tarjeta a 50 px **hasta 27 caracteres**.

Un diagrama por paso narrado, no por sección: si se enumeran cuatro cosas en 4 s, son
cuatro nodos con cuatro `at`, no un panel que aparece entero.

## Tarjetas

| tipo | para qué |
|---|---|
| `point` | 1-3 líneas: la deducción o el remate |
| `contrast` | dos columnas con logo: A vs B |
| `logos` | fila de marcas + una línea |
| `stat` | una cifra grande y qué significa |
| `swap` | lo que usas → la alternativa de pago → su precio. `fromIcon`/`toIcon` (Lucide) si no hay marca |
| `specs` | ficha técnica: icono · concepto · valor |
| `bill`  | concepto ⋯ precio con línea de puntos, y un total grande que sube |

```json
{ "t": "swap", "start": 24.9, "end": 30.2, "kicker": "lo que sustituye",
  "rows": [{ "from": "github", "fromLabel": "Git propio", "to": "github", "toLabel": "GitHub Team", "price": "$4", "at": 25.6 }],
  "total": { "label": "al mes", "prefix": "$", "num": 54, "suffix": "" } }
```

- **`at` por fila** (`swap`, `specs`, `bill`): la fila entra en el segundo en que se NOMBRA
  esa cosa. Sin `at` desfilan escalonadas y se lee como una lista que va sola.
- **El total sube** (`cuenta()` en `anim.ts`): uno que aparece hecho es un dato; uno que
  sube mientras caen las filas es el argumento. Y se oye: `coin_1..5` + `cash`.
- **`from` es opcional.** Si se dice «el gestor de contraseñas» sin la marca, va sin logo.
  Antes eso que inventarse el icono.
- **Cuatro filas es el techo** con la altura de `CARD_BAND`.
- **Verifica cada precio y deja fecha y plan en `_precios`.** Mensual y anual no se suman.

**Un chip de marca puede llevar dato**: `Topic` acepta `spec`. Pasa de decir *de quién*
se habla a decir *qué*.

## Escenas: suspenso, drama e interactividad — `Escenas.tsx`

Para demos de pantalla donde solo subtítulos se queda corto. Todo en `cortes.json → escenas`.

| escena | qué hace | cuándo |
|---|---|---|
| `sellos` | tampón que cae con rebote y hace temblar el cuadro | hook («CONFIDENCIAL»), remate («LISTO» en verde) |
| `tuberias` | fila de pasos con logos: `blur: true` en el hook, `blur: false` + `checkFrom` en el cierre | la promesa y su pago en una línea |
| `pins` | punto que late sobre algo de la PANTALLA + guía + chip | «esto es mi panel» — x,y del OCR |
| `marcas` | recuadro que sigue una línea del terminal a saltos (`keys`) | la línea que importa en un terminal lleno |
| `crono` | cronómetro que COPIA los segundos de la pantalla | un agente trabajando: la espera es el suspenso |
| `expedientes` | campos que «se encuentran» (caracteres barajando) y se tachan | «busca la empresa» |
| `censuras` | barras que barren la captura + sello «CLASIFICADO» | «vamos a borrar los datos privados» |
| `entregas` | casillas 0/N → N/N al nombrarlas | el resumen de lo que hizo |
| `firmas` | cursor que pulsa el botón REAL de la captura, firma y ✓ | lo que hará el cliente |
| `glitches` | franjas de color desplazadas 0.2-0.4 s | cambios bruscos, corte de música |
| `consolas` | terminal que se escribe AL RITMO DE LA VOZ, `tone` red/green | el dolor antes de la solución |
| `memoria` | medidor que copia lecturas del panel (OCR) y cronometra la carga | «cargó en 2,8 s» |

`tone`: `"red"`, `"green"`, `"accent"` o un hex. Los segundos del crono salen de
`scripts/crono_ocr.py`; el botón de la firma, del OCR. **Nunca un número a ojo.**

Capas: escenas encima de tarjetas y diagramas (un sello puede rematar un panel), debajo
de los subtítulos; el crono arriba del todo. `verifica.py` las juzga contra la cara.

Sonido típico: `braam` con el sello del hook, `clock` bajo el expediente, `heart` bajo la
censura con `riser` hasta la revelación, la música de suspenso cortando en seco y la
resolución entrando con un impacto, `coin_1..5` + `cash` en cada casilla.

## B-roll de verdad y grafismo GRANDE — `Broll.tsx` · `Grandes.tsx`

### `broll`: cortes a pantalla completa

```json
{ "kind": "video", "full": true, "src": "broll/producto.mp4", "start": 0.55, "end": 1.18, "from": 0.4,
  "tag": "Nombre", "sub": "dato que la voz no dice", "logo": "github", "zoom": [1.12, 1.04] }
{ "kind": "image", "full": true, "src": "broll/foto.png", "start": 23.45, "end": 24.5,
  "tag": "Producto", "sub": "$1,349 · chip X", "credit": "Fabricante", "plain": true, "bg": "#000000", "zoom": [1.28, 1.36] }
```

- **`full`** sustituye al plano mientras la voz sigue: entra y sale en SECO (es un corte)
  con un empujón de escala. Vídeo en `cover`; imagen en `contain` sobre sí misma
  desenfocada, o sobre fondo liso con `plain`. Sin `full` es una ventana (`cy`, `w`, `h`).
- **`tag`/`sub`** abajo a la izquierda, **`credit`** arriba a la derecha: abajo choca con
  los subtítulos. Material ajeno: el crédito va siempre.
- **El rótulo da un dato que la voz NO dice** (regla 1). Y **nada que caduque** («salió
  ayer»): se publica días después.
- **Patrón pantalla → foto**: si la captura enseña la lista, primero la etiqueta anclada en
  la pantalla (la prueba) y cuando se NOMBRA el producto, corte a la foto.
- **Capas**: el B-roll va por DEBAJO de las escenas y de `grandes`.

De dónde sale el material, por orden:

1. **Su propio archivo**: vídeos anteriores, desde el clip limpio del proyecto (nunca
   desde un export con subtítulos quemados). Tira de contacto a `fps=1/2` para elegir,
   luego a `fps=4` para el segundo exacto; corta con `-an -crf 12`.
2. **Web**: un agente aparte con la lista de productos. Webs oficiales, notas de prensa,
   `yt-dlp` solo para vídeo del fabricante. Que MIRE cada imagen y descarte lo dudoso
   (fotos «de producto» generadas con IA existen). Fuente y fecha en `_broll_…`.
3. Recorta marcas de agua con `crop` antes de meterlo en `public/broll/`.

**No etiquetes nada como colaboración o patrocinio sin preguntar.**

### `grandes`: iconos grandes que se dibujan

```json
"grandes": {
  "pasos": [{ "start": 29.1, "end": 41.3, "top": 190, "mode": "live", "kicker": "lo que hace solo",
              "nodes": [{ "icon": "search", "label": "investiga", "color": "#4CC4F4", "at": 31.48 }],
              "badge": { "text": "tú envías", "icon": "user-round", "after": 3, "at": 36.24 } }],
  "pregunta": { "start": 41.46, "top": 205, "icon": "message-circle-question", "pre": "¿y tú qué le", "word": "DELEGARÍAS?" }
}
```

- **`Pasos` `live`** sustituye a un `Flow` chain cuando hay ~300 px libres sobre la cabeza:
  baldosa grande para el paso que se NOMBRA, check en las hechas, punteadas las pendientes;
  el icono se dibuja trazo a trazo, rebote, onda y chispas. Cinco nodos caben en 830 px.
- **`Pasos` `teaser`**: el gancho — todas en cascada, etiquetas difuminadas.
- **`Pregunta`**: el cierre de `cta.tipo = "pregunta"` en grande. Sustituye al chip.
- **`DrawIcon`** inyecta `pathLength="1"` en cada trazo de Lucide y anima
  `strokeDashoffset` 1→0. Vale para cualquier icono.

## Demo grabada con el MÓVIL apuntando a la pantalla

Sin cara, cámara en mano:

- **La línea de tiempo sale del OCR, no del ojo.** OCR a 5 fps en toda la pieza y a 30 fps
  ±0.5 s alrededor de cada clic. Un clic = el último fotograma con el texto del botón; el
  cambio = el primero con el texto nuevo. Sellos, sonidos y punches caen ahí.
- **Seguir un botón con `rastrea.py` funciona** aunque la cámara vaya en mano:
  compruébalo contra el OCR, no solo mirando.
- Subtítulos abajo del todo (`cy 1465`, 56 px) si el panel ocupa el centro.
- `verifica.py` / `caras.py` no aplican.

## Datos sensibles en la captura — `tapar.py`

Una captura real enseña nombres, correos, teléfonos, IPs, tokens. **No se decide solo qué
se tapa**: se busca, se enseña al usuario y él elige (a veces solo quiere tapar al cliente).

```bash
# work/tapar.json: src, out, alto, patron, rapidos, antes, bajo, manual (ejemplo: work/tapar.example.json)
uv run --with numpy --with opencv-python-headless python scripts/tapar.py ocr
uv run --with numpy python scripts/tapar.py busca --nombres Acme "Juan Pérez"   # -> PREGUNTAR
uv run --with numpy --with opencv-python-headless python scripts/tapar.py render       # -> public/c1.mp4
uv run --with numpy --with opencv-python-headless python scripts/tapar.py verifica     # LIMPIO o nada
```

OCR con Vision de macOS (`scripts/ocr/ocr.swift`, se compila solo). Lo que costó:

- **Por token, no por línea**, con margen vertical con techo de 6 px.
- El `patron` lleva **las lecturas torcidas del OCR** («Acrne», «Aeme»): `busca` las enseña.
- 30 fps + unión de ±4 muestras cubre un terminal. **No cubre un documento que se desplaza
  40-90 px entre muestras**: esos tramos van en `rapidos` — OCR de cada fotograma al doble
  de tamaño y vecinos unidos **compensados en movimiento**.
- `antes`, `bajo` y `manual` para los casos que el OCR no ve.
- Se difumina sobre los **planos YUV**: sin matriz de color que falle.
- `verifica` hace OCR del resultado en fotogramas que el primer pase no miró. Solo vale
  LIMPIO. Anota en `cortes.json` (`_src`) que el fuente es el vídeo tapado.

**Barre por tramos, no cada N segundos**: un panel claro de 3 s con una IP puede colarse
entre dos muestras.

## Cuando la fuente ALTERNA cámara y B-roll

Aquí la pregunta no es dónde va un panel, sino **en qué segundos cabe**. Sale de una
tabla: luminancia máxima por banda de 240 px en cada plano. **Los paneles grandes solo
caben sobre el B-roll**: en los planos de cámara la cara ocupa el centro y la tarjeta le
tapa la boca. Lista los tramos sin cara y mete ahí los paneles; lo demás se cuenta con
secciones, chips y diagramas.

La luminancia engaña (un objeto plateado en la mano parece «ocupado»): **mira el still
antes de mover una tarjeta**; la tabla dice dónde mirar, no qué decidir.

## Nada tapa la cara — y se comprueba

```bash
uv run --with opencv-python-headless --with numpy python scripts/caras.py       # pista de caras + ventanas sin cara
uv run --with opencv-python-headless --with numpy python scripts/subtitulos.py  # cap_zones bajo la barbilla
uv run --with opencv-python-headless --with numpy python scripts/aparta.py --escribe
uv run --with opencv-python-headless --with numpy python scripts/verifica.py    # el juez
```

- **`caras.py`** (YuNet) devuelve las **ventanas SIN cara**. Fuera de ahí, un panel fijo a
  ancho completo no cabe. Dos cajas: **casco** (con pelo/barba: lo que un panel no invade)
  y **cara** (frente → barbilla: lo que NADA tapa). **Calibra la caja contra un still.**
- **`verifica.py` manda**: fotograma a fotograma, sale con código 1 si algo pisa la cara.
  Encadénalo antes del render.
- **`subtitulos.py`** coloca los subtítulos bajo la barbilla (2 líneas a 72 px) o al lado
  libre (`x0`/`x1`). Si no hay salida, lo dice y los oculta en ese tramo.
- **`aparta.py`**: cuando la cara sube a la banda del raíl, kicker y chips **se desvanecen
  y vuelven solos** (rampa de 0.3 s: más corta parece un parpadeo de error).

## Etiquetas con SEGUIMIENTO — `Track.tsx`

En un recorrido por un espacio o equipo, un panel tapa lo que se ha venido a ver. Una
etiqueta anclada al objeto, no.

```bash
python3 scripts/rastrea.py --id obj1 --desde 11.40 --hasta 18.80 --x 470 --y 1020
```
```json
{ "id": "obj1", "start": 11.40, "end": 18.80, "n": 1, "label": "Servidor", "sub": "24 contenedores", "side": "above" }
```

Movimiento global de cámara (Lucas-Kanade + `estimateAffinePartial2D` con RANSAC), no
seguimiento de objeto: aguanta aunque una mano cruce por delante.

- **Un tramo NUNCA cruza un corte de plano** (`select='gt(scene,0.15)'`).
- **Comprueba el punto dibujándolo sobre el vídeo**, no por los números. Si se despega,
  acorta el tramo y re-siembra.
- **`bounds`** limita dónde cae el chip cuando hay cara.

Un track no calla a los subtítulos, salvo que su etiqueta caiga en su banda.

## Versión en otro idioma

```bash
python3 scripts/traduce.py --de c1 --a c1en --texto work/traduccion_en.json
```

**Se traduce por FRASES, no por palabras**: se conserva la ventana de cada segmento y las
palabras nuevas se reparten en proporción a su longitud. Es **otro corte** en
`cortes.json` (`c1en`) con `"src": "c1.mp4"` y `fix` vacío. **Traduce también el
grafismo**, y cuida la persona (en su propio vídeo es *I*, no *he*).

## Cruces, transiciones y ritmo

- **La rampa va POR DENTRO**: cuando una tarjeta releva a los subtítulos, la rampa de los
  subtítulos va dentro del tramo `hide`. Los dos se cruzan en vez de dejar un hueco.
- **Transiciones en un plano continuo: con movimiento, no con destellos de color.** Golpe
  de escala (+5 %), desenfoque corto (2.6 px) y +10 % de brillo, 0.06 s de subida y 0.28 de
  caída (`impulse()` en `Plate.tsx`). Un lavado de color a pantalla completa se lee como
  fallo de render.
- **Los punch-ins tienen que verse**: ×1.09 no se percibe. ×1.16–×1.22 con muelle, origen
  `50% 42%` para crecer alrededor de la cara.
- **Jump cuts de CapCut** (mismo encuadre): `gt(scene,0.2)` no los ve; salen con **0.05**,
  mezclados con gestos, y se separan porque coinciden con marcas del guion. Sobre un jump
  cut: **alterna la escala en `spans`** (1.0 / 1.13). `punches: []` — un golpe encima de un
  corte real se lee doble.
- **Scrim mínimo**: 0.30 arriba, 0.42 abajo, centro limpio. Más enterraba el decorado.

## Logos de marca

```bash
python3 scripts/logos_gen.py --add notion figma              # Simple Icons: baja, aclara si es oscuro, regenera
python3 scripts/logos_gen.py --imagen mimarca logo.png "Mi Marca" "#FF5A36"   # fuera de Simple Icons: pegatina
```

`src/Logos.tsx` se genera desde `public/logos/marcas.json`; no se edita a mano.
**Nunca inventes un logo** y **no metas marcas que no se nombran** — si no dice «Docker»,
no hay logo de Docker. El color oficial se aclara cuando es negro o casi negro (queda
anotado); el trazo no se toca nunca. Las marcas del perfil (`marcas_frecuentes`) añádelas
en cada proyecto nuevo.

## Efectos de sonido — kit CC0 compartido

**El kit vive en la biblioteca del perfil** (`audio.biblioteca`, por defecto
`~/ReelKit/sfx`), no en el proyecto: que el whoosh sea siempre el mismo es lo que hace que
suene tuyo. Fuente: **Freesound APIv2** con `license:"Creative Commons 0"` — sin atribución
ni reclamaciones. API key gratis en freesound.org → guárdala fuera de todo repo:

```bash
mkdir -p ~/.config/reel-edicion && echo 'FREESOUND_API_KEY=xxxx' > ~/.config/reel-edicion/freesound.env
set -a; . ~/.config/reel-edicion/freesound.env; set +a
python3 scripts/sfx_search.py     # candidatos CC0 por hueco del kit (la elección es humana)
python3 scripts/sfx_fetch.py      # descarga y procesa (kit de partida, o <KIT>/picks.json si existe)
python3 scripts/sfx_deriva.py     # coin_1..5, cash, swell, air, reveal, tick_soft derivados del kit
```

`sfx_fetch.py` trae un **kit de partida neutro**; para uno propio, escucha los candidatos
de `sfx_search.py` y escribe `<KIT>/picks.json` (`{"slot": [id, "para qué"]}`). Cada sonido
se procesa igual: silencio de cabeza fuera, pico a −3 dBFS, WAV 48 kHz estéreo.

- **Consultas de una palabra**: CC0 es un pool estrecho (`"whoosh"` sí, `"reverse whoosh soft"` no).
- **Tira de un mismo pack**: mismo autor, coherencia gratis.
- **Deriva en vez de descargar**: `whoosh_out` = `whoosh_in` invertido con paso bajo.

| Momento | Sonido | Ganancia de partida |
|---|---|---|
| entra el título | `impact` | −8 |
| choque del «VS» | `hit` | −10 |
| entra un chip | `tick` | −19 |
| la tesis | `riser` + `sub_drop` | −13 / −9 |
| entra/sale una tarjeta | `whoosh_in` / `whoosh_out` | −12 / −15 |
| llegan avisos | `notify_a/b/c` escalonados | −12 |
| CTA | `chime` | −12 |
| cierre | `close` | −8 |

Si el perfil dice `audio.efectos: false`, `sfx: []` y listo.

### Verifica que suenan, y a qué nivel

Comparar `mean_volume` no sirve (un efecto 13 dB bajo aporta 0.2 dB). **Renderiza solo la
capa de sonido**:

```bash
./scripts/mide_sfx.sh MiCorte c1     # REMOTION_MUTE_VIDEO=1 + tabla por cue
```

Objetivos con la voz picando en −10: **golpes −12/−16, ticks −18/−24, música −25/−30 dBFS**.
La tabla de ganancias es un punto de partida; **el nivel se mide**.

**El mezclador de Remotion NO es lineal** (reescala según cuántas pistas suenan a la vez:
doblar un cue puede dejarlo más bajo). Si las lecturas no responden, mezcla con ffmpeg:

```bash
python3 scripts/mezcla.py --cid c1 --objetivos              # gain de cada cue = objetivo − pico de su fichero
python3 scripts/mezcla.py --cid c1 --pega out/MiCorte.mp4    # vídeo copiado, audio nuevo
```

### Música

Solo si el perfil la pide (`audio.musica`). Tus pistas en `<biblioteca>/musica/` (CC0 o
con licencia para redes), con un `manifest.json` de autor y uso. La cama se declara en
`music.tramos` y la monta `scripts/musica.py` → `public/musica.wav`. **El suspenso corta EN
SECO justo antes de la revelación** y la resolución entra encima de la frase que la da.
Con micro cercano `gain: 0`; a −5 puede no oírse.

---

## Fuente SPLIT SCREEN de CapCut (captura arriba, cámara abajo)

`template-camara` sirve, pero **la geometría de `theme.ts` se recalibra entera**: no hay
pared muerta ni torso libre. **Mide el borde**: luminancia media por fila sobre un
fotograma con la captura clara. Ejemplo:

```
captura        y    0 → 841    intocable: es lo que se ha venido a ver
COSTURA        y  841 → 1030   fondo oscuro del set
cara           y 1040 → 1360
torso          y 1400 → 1520
               y 1560 → 1920   ya es zona de UI
```

- **Los SUBTÍTULOS van en la costura** (`size 60`, `maxWords 3`, `cy 945`). Bajo la
  barbilla, las páginas de dos líneas se comen la cara.
- **El grafismo pequeño baja al torso** (`KICKER_Y = 1400`).
- **El logo va DENTRO de la línea** (`TOPIC_ALIGN = "inline"`): en esa banda no caben dos
  cosas y un chip suelto acaba sobre la barbilla.
- **`punches: []` y `spans` a escala 1**: un punch-in amplía LAS DOS mitades.
- **Sin scrim arriba** (oscurecería la captura); una junta tenue en la costura.
- **Sin handle** si no hay banda libre (`handle: ""`).
- **Tarjetas ENCIMA de la captura solo cuando lo que enseña no se lee** (un terminal
  esperando, comandos desfilando): ahí es tu B-roll (`CARD_BAND = { cy: 546, h: 330 }`).
  Si la captura es la protagonista, no la tapes. Decide tramo a tramo.
- **Cámara del split muy cerca** (cara hasta y 1540): `TOPIC_ALIGN = "off"`, sin kicker.

### Fuente MIXTA: split y cámara completa alternando — `layout.py`

A cámara completa, los subtítulos de la costura caen en la boca. Hay que saber dónde
cambia, al fotograma:

```bash
uv run --with numpy python scripts/layout.py --src public/c1.mp4
#   costura en y ≈ 838 · 0.000 → 3.300 SPLIT · 3.300 → 6.017 cámara completa · …
```

Deja `work/c1_layout.json` con `split` (el scrim cambia en el tiempo) y `cap_zones`
sugeridas que no parten una palabra.

## Fuente de videollamada (Zoom, Meet) — `template/`

1. **El rótulo del nombre va quemado**: se recorta en `spans` (`crop`). El recorte deja un
   formato menos ancho que 16:9 y la ventana crece — mejora el encuadre.
2. **La imagen va por detrás del audio** (~1 s en hablante activo). **Una tarjeta cubre ese
   retraso** y suelta justo en la primera palabra del remate.
3. **Sin punch-ins**: a 640x360 la ventana ya va a ×2.25.
4. El AGC deja el audio aplastado: `PRE="highpass=f=80"` sin compresor.
5. Si el clip llega densificado (sin silencios, acelerado), `src` configurable y `seams`
   desde `work/<cid>_costuras.json`: la ventana alterna escala 1 / 1.05 en cada costura
   notoria. **Transcribe el clip YA densificado**, nunca el original.

---

## Correcciones ancladas en tiempo

```json
"fix": { "cloud@16.70": "Nextcloud", "next@16.50": "", "24@86.48": "24/7" }
```

`"token@12.34"` solo corrige la ocurrencia que empieza en ese segundo (±0.06 s), para
palabras comunes que una corrección global pisaría. `""` borra el token. `gen_data.py`
**avisa si un ancla no casa**.

## Trampas conocidas (ya resueltas en la plantilla; no las reintroduzcas)

- **Las notas `_` de `fix`** se filtran ANTES de normalizar; si no, `"_nota"` se volvía
  `"nota"` y pisaba una corrección real.
- **Las claves `_` dentro de tarjetas** se quitan a cualquier profundidad (`sin_notas()`);
  si no, rompen el typecheck.
- **`spring()` con `Infinity` revienta el render**: un evento que no llega va a un instante
  lejano y finito.
- **Remotion no sirve symlinks desde `public/`**: 404. Copia o enlace duro.
- **`remotion still` exige que la extensión case con `--image-format`.**
- **macOS no distingue mayúsculas**: nombres de QA en minúsculas (`qa/f675.png`).
- **whisper con varios ficheros a la vez escribe todos en el mismo JSON.** Un fichero por
  llamada, y comprueba que la duración del transcript cuadra con la del audio.
- **Whisper alucina en los silencios largos**: si el audio tiene mucho aire, recórtalo
  antes de transcribir.
- **El typecheck no se corta con `tail`**: Remotion renderiza aunque `tsc` falle.
  `render.sh` corre `tsc` entero y para si hay errores.

---

## Flujo de un reel real

```bash
cp -R "$SKILL_DIR/template-camara" ~/reels/mi-reel && cd ~/reels/mi-reel
npm install                                  # una vez por proyecto
python3 scripts/aplica_perfil.py             # tu estilo en theme.ts + fonts.ts
python3 scripts/logos_gen.py --add notion    # marcas que se NOMBRAN en este vídeo
mkdir -p public/sfx && cp ~/ReelKit/sfx/*.wav public/sfx/   # si usas efectos (Remotion solo sirve public/)
cp ../grabacion/mi-video.mp4 public/c1.mp4

# 0. ¿split, mixta? ¿datos sensibles en pantalla?
uv run --with numpy python scripts/layout.py --src public/c1.mp4
uv run --with numpy --with opencv-python-headless python scripts/tapar.py ocr   # busca -> PREGUNTAR -> render -> verifica

# 1. transcripción local, por palabra
ffmpeg -v error -i public/c1.mp4 -vn -ac 1 -ar 16000 work/c1.wav
#   Mac Apple Silicon:
uvx --python 3.11 --from mlx-whisper mlx_whisper work/c1.wav --model mlx-community/whisper-large-v3-turbo \
    --language es --word-timestamps True --output-format json --output-dir work
#   cualquier otro equipo:
uvx --from openai-whisper whisper work/c1.wav --model turbo --language es \
    --word_timestamps True --output_format json --output_dir work

# 2. palabras con tiempos + encuadres
python3 scripts/words.py work/c1.json --convert          # -> work/c1_words.json
python3 scripts/words.py work/c1_words.json --find Número comenta
python3 scripts/words.py work/c1_words.json 58-76        # para los `at` de un flow
#    work/c1_spans.json: [{"start","end","scale"?,"x"?,"y"?}] — SIN "kind" (eso es de template/)
# 3. cortes.json: kicker, topics, cards, flows, teaser, sections, punches, hide, sfx, fix…
python3 scripts/icons_fetch.py ticket git-branch         # iconos nuevos
python3 scripts/musica.py                                # si hay music.tramos
python3 scripts/gen_data.py --work work --cuts c1 --config cortes.json

# 4. registrar en src/cuts.ts (Root.tsx no se toca nunca)
npx remotion studio
uv run --with opencv-python-headless --with numpy python scripts/verifica.py   # nada tapa la cara
./scripts/mide_sfx.sh MiCorte
HQ=1 ./scripts/render.sh MiCorte                       # typecheck entero; PNG + crf 10 -> out/
VIDEO=copy ONLY=MiCorte ./scripts/export.sh            # -> final/, -14 LUFS
```

- **`PRE` según el micro del perfil**: `audio.micro = "cercano"` → `PRE="highpass=f=80"`
  (el compresor por defecto aplasta un micro cercano); `"sala"` → el valor por defecto.
- **`HQ=1` + `VIDEO=copy`** siempre que la fuente llegue ya comprimida (todo lo de CapCut
  o del móvil): la cadena por defecto suma tres generaciones de pérdida.
- `fixaudio.sh` si el export quedó fuera de ±0.3 LU (`export.sh` ya lo encadena).
- **Color:** `bt709` declarado en el render *y* en el export. Sin eso Instagram lava la imagen.

## QA antes de renderizar entero

Un render completo son minutos; un `still`, segundos.

```bash
npx remotion still src/index.ts MiCorte qa/f660.png --frame=660 --image-format=png
ffmpeg -i final/MiCorte.mp4 -vf "fps=1/3.2,scale=200:-1,tile=6x4:padding=4" -frames:v 1 qa/sheet.jpg   # ritmo
ffmpeg -ss 20.95 -i final/MiCorte.mp4 -vf "fps=15,scale=200:-1,tile=6x1:padding=4" -frames:v 1 qa/tira.jpg  # una animación
```

En la tira de contacto se ve la monotonía: si 22 de 24 fotogramas son el mismo plano con
la misma caja abajo, faltan eventos visuales. **Se arregla con B-roll de verdad, no con más
tarjetas**; si no hay material, dilo en vez de rellenar. Excepción: en una demo de
pantalla ilegible en el móvil, las `escenas` SON el B-roll.

Antes de entregar, repasa el perfil: ¿se coló algo de `notas.evitar`? Repasa también
`ESTILO.md`: una sola palabra clave en lavanda por frase, la pantalla siempre enmarcada,
un cambio visual cada 2–4 s y una sola acción en el CTA.

---

## Ficheros

```
reel-edicion/
├── SKILL.md · CUESTIONARIO.md · perfil.example.json
├── perfil.json · ESTILO.md          ← marca @pablohernandez.ai (perfil por defecto + guía de estilo)
├── template-camara/                 ← vertical a cuadro completo (casi siempre)
│   ├── cortes.example.json          demo comentada
│   ├── src/
│   │   ├── cuts.ts        REGISTRO: lo único que editas para añadir cortes
│   │   ├── theme.ts       bloque PERFIL (colores, CAPTIONS, RAIL) + geometría
│   │   ├── fonts.ts       tipografía (la genera aplica_perfil.py)
│   │   ├── Plate.tsx      plano + punch-ins + golpe de transición + scrim
│   │   ├── Captions.tsx   motor de subtítulos
│   │   ├── Card.tsx       tarjetas: point · contrast · logos · stat · swap · specs · bill
│   │   ├── Flow.tsx       diagramas: chain · fanin · fanout · rows
│   │   ├── Track.tsx      etiqueta anclada que sigue a un objeto
│   │   ├── Broll.tsx      B-roll a pantalla completa o ventana
│   │   ├── Grandes.tsx    Pasos (iconos grandes que se dibujan) · Pregunta del cierre
│   │   ├── Teaser.tsx · Sections.tsx · Title.tsx · TopicChip.tsx · Chrome.tsx (kicker, CTA, handle)
│   │   ├── Escenas.tsx    sellos · pins · marcas · crono · expedientes · censuras · entregas · firmas · …
│   │   ├── Logos.tsx · Icons.ts   (generados)
│   │   ├── Sfx.tsx · anim.ts · Reel.tsx
│   └── scripts/
│       ├── aplica_perfil.py · perfil.py      perfil → theme.ts/fonts.ts
│       ├── demo_words.py                     tiempos sintéticos para la demo
│       ├── gen_data.py    transcript + spans + cortes.json -> src/data/*.ts
│       ├── words.py · icons_fetch.py · logos_gen.py
│       ├── caras.py · subtitulos.py · aparta.py · verifica.py · rastrea.py · layout.py
│       ├── tapar.py (+ ocr/ocr.swift) · crono_ocr.py · traduce.py
│       ├── sfx_search.py · sfx_fetch.py · sfx_deriva.py · musica.py · mezcla.py · mide_sfx.sh
│       └── render.sh (HQ=1) · export.sh (VIDEO=copy, ONLY=) · fixaudio.sh
└── template/                        ← 16:9 en ventana (charlas, videollamadas)
```

## Requisitos

Node 18+, `ffmpeg`, `python3` y [`uv`](https://docs.astral.sh/uv/) (para whisper y los
scripts con OpenCV). Los scripts `.sh` son bash 3.2 (el de macOS): sin `mapfile` ni arrays
asociativos. `tapar.py` y el OCR usan Vision de macOS (necesita `swiftc`, que viene con las
Command Line Tools); en otros sistemas esa parte no está disponible. Si tu `ffmpeg` viene
sin `drawtext`, usa `drawbox` para diagramas de zonas y pon las etiquetas fuera.
