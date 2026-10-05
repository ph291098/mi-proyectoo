# Estilo de @pablohernandez.ai

Sacado del moodboard de vídeo (https://claude.ai/artifact/Mz2y1wfY1rrbkaeZWfqJQU).
Los valores que la plantilla puede leer ya están en `perfil.json`. Este documento recoge
el resto: cómo usar cada pieza de la plantilla para que el reel se vea como un vídeo de Pablo.
Estas reglas valen tanto como «Las reglas que no se negocian» de `SKILL.md`.

**Claro, cercano y con criterio.** IA explicada para personas, con la limpieza de una
marca premium y la calidez de un buen profesor. La referencia es una clase bien dada en un
estudio luminoso, no un anuncio de «hazte rico con IA».

## Paleta (y cuánto pesa cada color)

| Color | Hex | Peso | Uso | En el perfil |
|---|---|---|---|---|
| Blanco | `#FFFFFF` | 50 % | Cajas de subtítulos, tarjetas, luz de la toma | `paper`, `text` |
| Lavanda | `#C9B8FF` | 30 % | Color de marca: palabra clave del subtítulo, fondos de portada, gráficos | `highlight` |
| Lila niebla | `#EFEAFF` | 10 % | Fondos secundarios, pantallas de texto, detrás de grabaciones de pantalla | `soft` |
| Violeta eléctrico | `#6A4DF0` | 5 % | Solo acentos: flechas, cursor, barra de pasos, botón del CTA. **Nunca en bloques grandes** | `accent` |
| Tinta violeta | `#1E1433` | 5 % | Texto y contornos. Sustituye al negro | `ink`, `onPaper` |

Como mucho 2 colores de acento en pantalla (lavanda + violeta). No se usan fondos negros:
cuando la plantilla pinta un panel oscuro, lo pinta en tinta violeta.

## Tipografía

- **Coolvetica** (Typodermic) para todo lo que se lee. No está en Google Fonts:
  `aplica_perfil.py` la carga desde `fuente.archivo`, que por defecto es
  `~/Library/Fonts/Coolvetica Rg.otf` (lo que queda al instalarla con doble clic en el Mac).
  Si no la encuentra, usa **Archivo** (`fuente.respaldo`) y avisa.
  **Licencia de escritorio**: se usa en tu ordenador y se publican los vídeos renderizados,
  pero el `.otf` no se sube nunca a un repo, a un servidor ni a la nube (EULA §4.1 y §4.4).
  Por eso la skill guarda solo la ruta y los `.gitignore` bloquean las fuentes.
- **JetBrains Mono** para prompts, datos y código.
- Tamaños sobre 1080×1920: gancho o título 96–120 px · subtítulo 64–72 px · etiqueta o
  lower third 36–44 px.
- Minúsculas por defecto; mayúscula solo en nombres propios. En los títulos, el espaciado
  entre letras va un poco cerrado (`-0.02em` a `-0.03em`).

## Subtítulos: tres estilos de un mismo sistema

| Estilo | Cuándo | En la plantilla |
|---|---|---|
| **A · Bloque blanco** (por defecto) | Siempre, salvo que el vídeo pida otro | `subtitulos.estilo: "bloque"`: caja blanca y texto en tinta; la palabra que suena va en una pastilla lavanda |
| **B · Palabra activa** | Opiniones y frases con energía | `subtitulos.estilo: "palabra"`: texto blanco con sombra en tinta; la palabra activa cambia a lavanda |
| **C · Gancho + subtítulo** | Tutoriales y listas | Estilo A, más el título fijo arriba durante todo el vídeo (`kicker` en `cortes.json`): quien entre a mitad sabe de qué va |

Reglas fijas:

- **Posición**: tercio inferior, con el borde de abajo a unos 420 px del final del cuadro
  (fuera de los botones de Instagram). Se mide en cada grabación (`CAPTION_CY`).
- **Longitud**: 3–4 palabras por línea y como mucho 2 líneas en pantalla.
- **Énfasis**: una sola palabra clave en lavanda por frase (el número, el resultado o la
  herramienta). Por eso `byBrand: false`: el resalte no cambia al color de cada marca.
- **Animación**: «pop» corto (5–6 frames, escala 90 → 100 %). Sin rebotes y sin letras
  que giran.

## Gráficos y overlays: tarjetas blancas con esquinas suaves

- **Lower third**: los primeros 3 s de cada vídeo largo y de las colaboraciones. Es una
  pastilla blanca con el avatar «ph» en lavanda, «Pablo Hernández» y debajo «IA aplicada a
  negocios». Entra deslizando desde la izquierda.
- **Pantalla enmarcada**: toda grabación de pantalla va dentro de una tarjeta blanca sobre
  lila niebla (`Broll.tsx` en modo ventana), nunca cruda a pantalla completa. Los
  indicadores («haz clic aquí», flechas) van en violeta eléctrico.
- **Prompt en pantalla**: en mono, con efecto de máquina de escribir y cursor violeta.
  Dale tiempo: la gente pausa el vídeo para copiarlo.
- **Contador de pasos** en los tutoriales: «paso 2 de 4» con una barra violeta, en la
  esquina superior izquierda.
- **Dato a pantalla completa**: la cifra en grande (el `%` en violeta) sobre lila niebla,
  con la fuente real citada abajo en pequeño. Uno por vídeo como mucho. La regla 10
  (nunca un dato a ojo) sigue valiendo.
- **Cierre y CTA**: los últimos 2 s, sobre lavanda, con una sola acción: guardar,
  comentar una palabra o seguir. Nunca las tres a la vez. La acción por defecto es
  «guárdalo para después» (`cta.texto`), con la firma `@pablohernandez.ai`.

## Reglas de edición

- **Ritmo ágil, no frenético**: un cambio visual (corte, zoom o gráfico) cada 2–4 s. Jump
  cuts para quitar silencios y muletillas. Zoom de 110–120 % en la frase clave
  (punch-in). El primer segundo ya enseña el resultado o el gancho.
- **Transiciones**: corte seco por defecto. Entre secciones, un barrido rápido con
  desenfoque de movimiento o medio segundo de fondo lavanda con el título de la sección.
  Nada de cubos, destellos, glitch ni efectos de plantilla.
- **Color de imagen**: luminoso y limpio. Exposición alta, blancos neutros, saturación
  media-baja y piel natural. Sombras con un toque frío hacia el lila; nunca contraste
  duro ni negros aplastados.
- **Audio, la voz manda**: voz a −14 LUFS (`export.sh`). Música instrumental suave (lo-fi
  o electrónica mínima) 20–25 dB por debajo de la voz. Un «pop» sutil cuando aparece una
  palabra clave o un gráfico.
- **Cuatro tipos de toma**: a cámara (fondo claro, luz frontal suave, a la altura de los
  ojos) · pantalla (enmarcada) · B-roll (manos, portátil, escritorio, móvil) · texto
  completo (un dato o una idea sobre lila niebla).
- **Formatos**: Reels, Shorts y TikTok a 1080×1920 · YouTube a 1920×1080 o 4K ·
  carrusel o post a 1080×1350 · **30 fps**.

**Sí**: mucho blanco y aire · una idea por pantalla · palabra clave en lavanda · cara
visible en los primeros 2 s · el mismo estilo en todos los vídeos.

**No**: fondos negros · más de 2 colores de acento · emojis animados · música con letra
bajo la voz · stock de robots y cerebros brillantes.

## Portadas (si te piden la miniatura)

- **Reel 1080×1920**: título arriba y la cara abajo, sobre lavanda. Todo lo importante va
  dentro del recorte 3:4 del perfil (la franja central), porque es lo que se ve en la
  cuadrícula. Una etiqueta mono blanca («IA · TUTORIAL») y una palabra del título en
  pastilla blanca.
- **YouTube 1280×720**: la foto a la izquierda sobre lavanda y el título a la derecha (6
  palabras como mucho), con una pastilla violeta que hace la promesa. No pongas nada en la
  esquina inferior derecha, que es donde YouTube pone la duración.
- Una sola emoción (sorpresa, curiosidad o seguridad) con la mirada a cámara, y siempre la
  misma plantilla para que la cuadrícula se vea como una marca.
