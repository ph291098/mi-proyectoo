// Formato "charla": una única VENTANA DE CONTENIDO sobre cama desenfocada.
// Zonas protegidas de la doctrina actual y sin barra de progreso.
// STAGE.hMax y SOURCE SE RECALIBRAN POR PROYECTO: dependen del recorte que pidan
// los `spans`. Los valores de abajo son de ejemplo: una videollamada 640x360 recortada
// a 480x338 -> ventana 1080x760, ×2.25. El bloque PERFIL lo escribe aplica_perfil.py.
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

// Unión TikTok + Reels, peor caso de cada lado. La columna de acciones de
// TikTok llega a 180 px: nada de texto pasa de x = 900.
export const DZ = { top: 180, bottom: 420, left: 70, right: 180 } as const;
export const SAFE = {
  x0: DZ.left, x1: WIDTH - DZ.right,
  y0: DZ.top,  y1: HEIGHT - DZ.bottom,
} as const;

// ── Geometría vertical ──
// Todo cabe dentro del recorte 4:5 del feed de Instagram (y 285 → 1635), que es
// donde caen la mayoría de las impresiones.
export const KICKER_Y = 305;
// La ventana se ancla por su centro. El recorte de los `spans` (x 60→540,
// y 0→338) deja fuera el rótulo con el nombre que Zoom quema abajo a la
// izquierda y la pared muerta de ese lado, y cierra sobre el que habla: 480x338 = 1.42:1,
// o sea 1080x760 a ancho completo. Escala ×2.25, que es donde se para — a ×2.54
// el fondo ya se deshace en bloques.
export const STAGE = { cy: 755, w: WIDTH, hMax: 760 } as const;
export const CAPTION_CY = 1295;
export const HANDLE_Y = 1455;

// La fuente es una grabación de Zoom en vista de hablante activo: no hay
// diapositiva que recortar, el cuadro entero es el plano.
export const SOURCE = { w: 640, h: 360 } as const;
