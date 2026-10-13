# Desglose del reel de referencia

Video fuente: 21.0 s · 1080×1920 (9:16) · 24 fps · HEVC · audio AAC 48 kHz estéreo, -14.3 LUFS integrado.
Generado con IA (archivo `hf_…`, Higgsfield): el sujeto es el usuario; **la voz no es la suya** (VO sintética/de otra persona).
El texto en pantalla lo dibujó el propio modelo de video, por eso sale deformado ("Nirst", "hest",
"cleative", "flaistılas"). La skill corrige eso: los planos se generan limpios y el texto se pone en post.

Guion de la VO (transcrito, 63 palabras ≈ 3.1 palabras/seg):

> You all have been asking how I do this. So let me show you how. First, pick a font. I usually go
> for something bold and clean like San Francisco or Helvetica. It's got a pop on screen. Next,
> placement is key. You can keep it classic here or down here or get creative and make your text
> move in the 3D space. Keep it engaging. Now tweak the look.

Es un reel **meta**: explica el estilo mientras lo usa. Cada plano ilustra literalmente la frase que suena.

## Línea de tiempo

| # | Tiempo | Dur | Plano (arquetipo) | VO | Texto en pantalla (intención → render IA) | Modo / estilo |
|---|---|---|---|---|---|---|
| 1 | 0.00–2.08 | 2.1 | **Spotlight hook**: picado cenital gran angular, sujeto agachado señalando a cámara, círculo de luz sobre piso negro, la cámara se aleja (el círculo se encoge) | "You all have been asking how I do this." | nube de palabras alrededor del sujeto, una palabra grande abajo que entra desenfocada; la mano tapa una palabra (texto detrás) | cloud · shadow · spotlight |
| 2 | 2.08–3.50 | 1.4 | **Macro prop**: lupa deslizándose sobre teclado, aberración cromática en el borde | "So let me show you how." | 1 palabra dentro de la lupa, blanco con glow azul eléctrico ("hest") | swap · glow-dark |
| 3 | 3.50–4.58 | 1.1 | **Macro prop**: post-it amarillo entra deslizando sobre escritorio claro | "First, pick a…" | palabra en cursiva/inclinada siguiendo el plano del post-it: first → pick → a | swap · glow, rot+skew |
| 4 | 4.58–7.08 | 2.5 | **Establishing**: escritorio de edición de noche, lámpara cálida + monitores, push-in lento | "…font. I usually go for something bold and clean" | solo palabras clave, aparecen con fade a la izquierda, entre monitor y laptop ("sleen" = clean) | swap · shadow · fade |
| 5 | 7.08–9.21 | 2.1 | **Screen B-roll**: whip hacia la UI, macro del menú de fuentes, cursor | "like San Francisco or Helvetica." | **ninguno**: la pantalla ya es el texto | none |
| 6 | 9.21–11.04 | 1.8 | **Detalle**: manos tecleando, DOF corto | "It's got a pop on screen. Next," | "Next" gigante, corte seco, justo en la palabra | swap · shadow · cut |
| 7 | 11.04–12.33 | 1.3 | **Fondo de color**: sujeto brazos cruzados contra pared roja saturada | "placement is key." | "place / ment" partido en dos líneas enormes, la cabeza tapa la 2.ª; "key" no se escribe: entra un **ícono de llave** blanco desde la izquierda, detrás del sujeto | stack · flat + icono |
| 8 | 12.33–14.63 | 2.3 | **White cyc**: sujeto pequeño sentado en el piso, high-key | "You can keep it classic here or down here" | keep / it / classic; luego limpia y "here" arriba… "down here" abajo: **el texto demuestra lo que dice** | stack · glow · clear |
| 9 | 14.63–15.96 | 1.3 | **White cyc** (otro ángulo): sujeto escribiendo en libreta amarilla | "or get creative" | or → get (arriba izq.), "creative" grande sobre el cuerpo | stack · glow |
| 10 | 15.96–17.88 | 1.9 | **Spotlight callback**: mismo look del hook, sujeto escribiendo en el piso | "and make your text move in the 3D space." | nube densa a varias profundidades; la palabra grande inferior entra con rack-focus (desenfocada → nítida) = "3D space" | cloud · shadow · spotlight · focus |
| 11 | 17.88–19.75 | 1.9 | **Macro extremo**: bolígrafo escribiendo en legal pad amarillo | "Keep it engaging." | palabra al centro, **el bolígrafo pasa por delante** del texto; keep → engaging → Now | swap · shadow · behind |
| 12 | 19.75–21.04 | 1.3 | **Outro**: sujeto en el escritorio de noche, mano en el mentón, mirando el timeline | "Now tweak the look." | palabras entran deslizando desde la izquierda con motion blur, "look" grande | slide · shadow |

El plan completo, con las palabras correctas, está en `assets/reference_plan.json`.

## Patrones medidos

- **Ritmo de corte**: 12 planos en 21 s → 1.75 s de media (1.1–2.5 s). Todos cortes secos, sin transiciones.
  El movimiento lo aporta el contenido del plano (lupa que se desliza, post-it que entra, whip en la UI).
- **Corte vs. frase**: el corte cae en la frontera de frase, 0.1–0.4 s **antes** de que empiece la nueva frase.
  Ninguna palabra sobrevive a un corte: el texto muere con su plano.
- **Texto vs. voz**: cada palabra aparece 2–4 frames (≈0.1 s) **antes** de oírse. Se siente "a tiempo".
- **Densidad de texto**: en planos cerrados, una palabra a la vez (swap). En planos abiertos del sujeto,
  palabras que se acumulan (cloud/stack). En el plano más "informativo" (la UI) no hay texto.
- **Alternancia de luminancia**: oscuro → claro → claro → oscuro cálido → oscuro → oscuro → rojo → blanco → blanco →
  oscuro → amarillo/negro → cálido. Casi cada corte invierte brillo o color: eso da el "golpe" visual.
- **Callback**: el look del hook (spotlight) vuelve en el plano 10, cerrando el arco visual.
- **Motivo de color**: amarillo recurrente (post-it, libreta, legal pad, resaltador en el escritorio) contra un
  sujeto siempre vestido de negro (hoodie + pantalón), que se recorta sobre fondos claros y se funde en los oscuros.
- **Ilustración literal**: "show you" → lupa; "pick" → post-it/nota; "font" → menú de fuentes; "key" → llave;
  "here / down here" → posición del texto; "3D space" → profundidad de campo; "look" → sujeto mirando la pantalla.

## Paleta medida

| Elemento | Color |
|---|---|
| Fondo white cyc | `#E6E2E5` (gris cálido muy claro) |
| Pared roja | `#A92025` → `#851016` en sombras |
| Spotlight: borde frío | `#1E3550` aprox. sobre negro `#050505` |
| Glow sobre fondo claro: trazo / halo | `#4070B0` / `#90A0C0` |
| Glow sobre fondo oscuro (lupa) | `#0050D0` |
| Lámpara escritorio (cálido) | `#CD966F` |
| Amarillo de props | `#E8E040` aprox. |
