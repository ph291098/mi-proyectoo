// Geometría del formato "cámara": la fuente YA es 1080x1920, así que no hay ventana
// de contenido — el plano llena el cuadro y las capas se reparten zonas que nunca se
// solapan. El bloque PERFIL lo reescribe scripts/aplica_perfil.py desde tu perfil
// (~/.config/reel-edicion/perfil.json); lo demás es geometría: recalíbrala por fuente.
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// ── PERFIL (generado por aplica_perfil.py) ──
export const COLORS = {
  text:       "#FFFFFF",   // texto principal de paneles y rótulos
  soft:       "#D6DCE5",   // texto secundario
  accent:     "#3DD6F5",   // el color del CTA y de los detalles que mandan: úsalo poco
  highlight:  "#3DD6F5",   // resalte de la palabra activa del subtítulo
  ok:         "#4ADE80",   // checks, «hecho», sellos en verde
  alert:      "#FB7185",   // tachados, errores, sellos en rojo
  ink:        "#0B0F14",   // fondo de paneles y lienzo
  line:       "#7C8794",   // líneas finas, handle, etiquetas apagadas
} as const;
export const CAPTIONS = {
  upper: true,
  size: 80,
  maxWords: 4,
  band: false,
  byBrand: true,
} as const;
export const RAIL = { x: 70, w: 430 } as const;   // columna libre del plano
export const TOPIC_ALIGN_DEFAULT: "chip" | "inline" | "off" = "chip";
// ── FIN PERFIL ──

// ── Zonas protegidas ──
// Unión de TikTok y Reels en orgánico, medida sobre las dos plataformas:
//   TikTok  top ~140 · bottom ~334 · left ~60 · right 140-180 (columna de botones)
//   Reels   top ~180 · bottom ~320-420 · left ~60 · right ~120
// El `right` es el que más se falla: la columna de acciones de TikTok llega a
// 180 px, así que nada de contenido pasa de x=900.
export const DZ = { top: 180, bottom: 420, left: 70, right: 180 } as const;
export const SAFE = {
  x0: DZ.left, x1: WIDTH - DZ.right,      //  70 → 900
  y0: DZ.top,  y1: HEIGHT - DZ.bottom,    // 180 → 1500
} as const;

// En el feed principal de Instagram el reel se ve a 4:5 RECORTADO DESDE EL
// CENTRO: se oculta todo lo que quede fuera de esta franja. El CTA vive aquí
// dentro o desaparece justo donde caen la mayoría de las impresiones.
export const FEED_CROP = { y0: 285, y1: 1635 } as const;

// ── Zonas de trabajo ──
// Valores de partida para una persona encuadrada a un lado con pared libre al otro.
// MÍDELOS en tu fuente (SKILL.md → «Cómo encontrar el espacio muerto»): las gráficas
// pequeñas van sobre la zona muerta (RAIL, en el bloque PERFIL); las anchas, sobre el torso.
export const KICKER_Y = 300;          // dentro de FEED_CROP: el CTA se ve en el feed
export const TOPIC_Y  = 596;
export const TITLE_BAND = { cy: 940, h: 360 } as const;   // 760 → 1120
export const CARD_BAND  = { cy: 965, h: 350 } as const;   // 790 → 1140
export const CAPTION_CY = 1290;       // 2 líneas a 84px caben entre 1188 y 1392
export const HANDLE_Y   = 1445;
// Subtítulos MIENTRAS hay un diagrama (Flow.tsx) en la banda de tarjetas. Depende de la
// geometría: si la banda de tarjetas no pisa la de subtítulos, es CAPTION_CY y no se mueven.
export const FLOW_CAPTION_CY = CAPTION_CY;   // aquí la banda de tarjetas (790→1140) queda ENCIMA de los subtítulos (1290): no hace falta moverlos

// ── Pantalla dividida (split screen de CapCut) ──
// Borde inferior de la captura cuando la fuente es un split. Solo lo usan el scrim
// (junta tenue en la costura, nunca velo sobre la captura) y los valores por defecto
// de censura/glitch. Los TRAMOS en split salen de scripts/layout.py → `split` en
// cortes.json: una fuente de CapCut puede alternar split y cámara completa.
export const SPLIT_Y = 838;

// Chip de marca: "chip" = suelto en el raíl (plano lleno) · "inline" = el logo va
// dentro de la línea del kicker y de las secciones (split: no hay sitio para dos
// cosas en la banda y un chip suelto acaba sobre la cara) · "off" = no se pinta y
// `topics` solo da el color del resalte de los subtítulos.
export const TOPIC_ALIGN: "chip" | "inline" | "off" = TOPIC_ALIGN_DEFAULT;

export const SOURCE = { w: 1080, h: 1920 } as const;
