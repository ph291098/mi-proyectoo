# Tipografía, motion graphics y esquema de `plan.json`

## Contenido
1. Tipografía
2. Los 4 estilos de texto (cuándo usar cada uno)
3. Los 5 modos de layout
4. Animaciones de entrada (valores exactos)
5. Capas: texto detrás del sujeto
6. Spotlight (iris)
7. Íconos que reemplazan palabras
8. Esquema completo de `plan.json`

---

## 1. Tipografía

- **Familia**: grotesca neo-geométrica muy bold, estilo San Francisco / Helvetica Now Display.
  Recomendada y gratuita: **Inter Display Bold** (Google Fonts / rsms.me/inter). Alternativas: SF Pro Display
  Bold (Apple), Helvetica Now Display Bold, Neue Haas Grotesk Display 65.
- **Caja**: minúsculas por defecto. Mayúscula inicial solo en palabras-transición ("Next", "Now") o nombres propios.
- **Tracking**: apretado, ≈ -2 % (`tracking: -2` en ASS ≈ -20 en After Effects).
- **Interlineado**: negativo; en stacks las líneas casi se tocan (≈ 0.85 × tamaño).
- **Tamaños** (px sobre 1080 de ancho; escalan con la resolución):

| Token | px | Uso |
|---|---|---|
| `s` | 95 | palabras de relleno en una nube ("in", "the") |
| `m` | 120 | palabras de nube / laterales de un stack |
| `l` | 160 | palabras importantes de la nube, keywords en planos abiertos |
| `xl` | 240 | palabra héroe de la nube, swap en macro |
| `hero` | 360 | swap a pantalla completa ("Next"), palabras grandes de stack ("keep", "here") |

  Las palabras héroe se ajustan solas para ocupar como máximo ~82 % del ancho.
- **Zona segura 9:16**: evita el 12 % inferior (UI de TikTok/IG/Shorts) y el 8 % superior. La cara nunca se tapa
  con texto delante: si la palabra cruza la cabeza, va **detrás** (`layer: "behind"`).

## 2. Estilos de texto

Regla: el estilo depende del fondo del plano, no del gusto. El script `plan` lo detecta midiendo luminancia y saturación.

| Estilo | Fondo | Aspecto | Construcción |
|---|---|---|---|
| `shadow` | oscuro o cálido de noche (luma < 150) | blanco puro + sombra negra difusa debajo | capa sombra: negro 56 % opac., blur 12 % del tamaño, desplazada 4 % hacia abajo |
| `glow` | high-key, papel, cyc blanco (luma ≥ 150) | blanco con trazo azul fino + halo azul-gris difuso: el blanco se lee sobre blanco | halo `#90A0C0` 69 % opac., borde 9 % y blur 11 %; trazo `#4070B0` ≈ 2 % |
| `glow-dark` | macro oscuro con un objeto brillante (lupa, pantalla) | blanco con resplandor azul eléctrico | halo `#0050D0` 87 % opac., borde 10 %, blur 14 % |
| `flat` | color saturado (pared roja) | blanco plano, sin efectos | sin borde, sin sombra: el contraste ya lo da el color |

## 3. Modos de layout (uno por plano)

| Modo | Qué hace | Cuándo |
|---|---|---|
| `swap` | una palabra a la vez en un ancla; cada palabra reemplaza a la anterior | planos cerrados, macros, props, detalles |
| `cloud` | las palabras se acumulan alrededor del sujeto en 8 posiciones; la última de la página va grande abajo | hook, planos generales del sujeto con spotlight |
| `stack` | palabras grandes arriba y abajo "abrazando" al sujeto, pequeñas a sus lados | sujeto entero sobre fondo limpio (cyc, pared de color) |
| `slide` | palabras alineadas a la izquierda que entran deslizando | cierre / outro |
| `none` | sin texto | cuando la imagen ya es el texto (pantallas, carteles) o para respirar |

`clear: true` en una palabra limpia la pantalla y empieza una "página" nueva dentro del mismo plano
(ej. "keep it classic" → limpia → "here … down here").

## 4. Animaciones de entrada

Todas son cortas (< 0.35 s) y desaceleran (ease-out). La salida siempre es un corte seco al final del plano o
cuando entra la siguiente palabra (swap). No hay animaciones de salida.

| `enter` | Valores | Dónde se ve en la referencia |
|---|---|---|
| `pop` (default) | fade 60 ms; blur 8 % del tamaño → 0 y escala 112 % → 100 % en 160 ms, ease-out | casi todas las palabras |
| `focus` | fade 320 ms; blur 20 % → 0 en 320 ms (rack focus) | palabra grande inferior de las nubes ("do this", "3D space") |
| `fade` | opacidad 0 → 100 % en 260 ms, sin escala | planos abiertos y calmos (escritorio) |
| `slide` | entra desde 1.8× su tamaño a la izquierda en 200 ms con blur 8 % → 0 (motion blur) | outro |
| `cut` | aparece seca, sin animación | palabras-golpe ("Next") |

Equivalencias para editores: After Effects → Gaussian Blur 30→0 + Scale 112→100 % en 4 frames @24 fps con
easing 0/80 %; CapCut → animación de entrada "Desenfoque" o "Zoom in" a 0.2 s; Premiere → Essential Graphics +
Gaussian Blur keyframeado.

**Timing**: cada palabra entra ≈ 0.1 s (2–3 frames) antes de oírse (`--lead 0.1`).

## 5. Capas: texto detrás del sujeto

Es lo que hace que el texto parezca estar "en el espacio 3D". Orden de capas, de abajo arriba:

1. plano de video (con spotlight si aplica)
2. texto e íconos con `layer: "behind"`
3. recorte del sujeto (video × matte)
4. texto e íconos `front`

Necesita un **matte** del sujeto: video en blanco y negro, blanco = sujeto, mismo tamaño y duración que el edit.
Cómo conseguirlo:
- CapCut: Recortar → "Eliminar fondo" en un duplicado del clip; exporta sobre fondo negro y súbele el contraste.
- After Effects: Roto Brush 3 → exporta el canal alfa como luma matte.
- DaVinci Resolve: Magic Mask (Color page) → exporta el key como matte.
- Desde un recorte con alfa (ProRes 4444/PNG): `ffmpeg -i recorte.mov -vf alphaextract -c:v libx264 -crf 10 matte.mp4`

Úsalo con criterio: 1–2 palabras por plano detrás de una mano, la cabeza, un bolígrafo. Si todo va detrás, se pierde el efecto.

## 6. Spotlight (iris)

Elipse transparente (≈ 0.42 del ancho, un poco más alta que ancha), borde suave con un charco de luz fría
`#1E3550`, exterior casi negro (95 %). `zoom: [1.45, 1.0]` hace que el círculo se cierre sobre el sujeto en ~1 s
(ease-out), imitando el alejamiento de cámara del hook. Mejor aún si el plano ya viene iluminado así (prompt o luz real);
el overlay solo refuerza.

## 7. Íconos que reemplazan palabras

Cuando una palabra es un objeto concreto ("key", "idea", "money", "time"), en vez de escribirla entra un ícono
plano blanco (silueta, sin detalles) que desliza desde un lado con ease-out cúbico de 0.35 s, normalmente detrás del
sujeto. `assets/key_icon.png` es el ejemplo de la referencia. Para otros íconos: PNG blanco con alfa, ~1200 px de ancho.

## 8. Esquema de `plan.json`

```jsonc
{
  "width": 1080, "height": 1920,          // se ajusta al video si difiere
  "font": "Inter Display",                // nombre de familia instalada
  "bold": true, "tracking": -2, "lowercase": true,
  "palette": {"glow_core": "#4070B0", "glow_halo": "#90A0C0", "glow_dark": "#0050D0"},  // opcional
  "scenes": [
    {
      "start": 0.0, "end": 2.08,          // segundos; un plano = una escena
      "mode": "cloud",                    // swap | cloud | stack | slide | none
      "style": "shadow",                  // shadow | glow | glow-dark | flat
      "enter": "pop",                     // default de la escena (opcional)
      "anchor": [0.5, 0.40],              // solo swap: centro normalizado
      "rot": 12, "skew": -0.2,            // opcional: rotación (°) e inclinación para seguir un plano en perspectiva
      "keep_case": false,
      "layer": "front",                   // default de la escena
      "fx": ["spotlight"],
      "say": "like",                      // opcional: 1.ª palabra que suena (anclar planos sin texto en retime)
      "spotlight": {"x": 0.5, "y": 0.45, "r": 0.42, "edge": 0.07, "tint": "#1E3550",
                    "zoom": [1.45, 1.0], "zoom_dur": 1.0},
      "words": [
        {"text": "you", "t": 0.0},                         // t = cuándo aparece (absoluto)
        {"text": "asking", "t": 0.76, "layer": "behind"},
        {"text": "do this", "t": 1.7, "enter": "focus", "size": "xl"},
        {"text": "here", "t": 13.14, "clear": true, "pos": [0.5, 0.17]},   // pos normalizada
        {"text": "Next", "t": 10.6, "keep_case": true, "end": 11.0},
        {"text": "24", "t": 12.0, "say": "veinticuatro"}      // say = lo que suena (para retime)
      ],
      "images": [
        {"src": "key_icon.png", "t": 11.62, "x": 0.5, "y": 0.66, "w": 0.6,
         "from": "left", "dur": 0.35, "layer": "behind"}     // src relativo al plan.json
      ]
    }
  ]
}
```

Claves que empiezan por `_` (`_shot`, `_bg`, `_about`) son notas y el script las ignora.

**Retime**: `kinetic_captions.py retime --plan plan.json --words nuevas.json --out plan2.json` busca cada palabra del
plan, en orden, en la nueva transcripción (por su primer token, o por `say`), le pone el nuevo `t` (− `--lead`) y
rehace los cortes (`--cut-lead` antes de la primera palabra de cada escena). Las escenas sin palabras usan `say` o se
interpolan; las palabras sin coincidencia conservan su desfase dentro de la escena y se listan al final.
`size` acepta un token (`s`…`hero`) o px. Todas las palabras se pueden agrupar ("let me", "3D space").
