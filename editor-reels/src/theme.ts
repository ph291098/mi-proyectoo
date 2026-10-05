// Valores de estilo.md (medidos en referencia.mp4 y pasados a 1080x1920).
export const FPS = 30;
export const C = {
  lienzo: "#F5F3F7", luz: "#D7E0F5", azul: "#0050FB", tinta: "#131112",
  azulSuave: "#A9C2FC", gris: "#E2E7F4", blanco: "#FFFFFF",
} as const;
export const SUB = {
  normal: 46,        // px, texto normal
  destacada: 110,    // px, palabra destacada (≈2,4×)
  topCamara: 190,    // y del bloque a cámara (sobre la cabeza)
  topGrafico: 1360,  // y del bloque sobre gráficos (debajo de la tarjeta, que acaba en 1310)
  entra: 5,          // fotogramas de entrada de una palabra (desenfoque 8→0)
  entraDestacada: 8,
  sale: 6,           // fotogramas de salida del bloque (desenfoque 0→10)
} as const;
export const TARJETA = { escala: 0.5, cy: 830, radio: 28, expande: 15 }; // 0,5 s
