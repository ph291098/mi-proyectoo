// Todo el texto del vídeo en un solo sitio. Los tiempos (segundos) salen de src/data/voz.json,
// que genera scripts/audio.py a partir de la voz guía. Al grabar la voz final hay que revisarlos.

export type Palabra = { t: string; a: number; acento?: boolean };
export type Caption = {
  estilo: "sans" | "serif";
  y: number;                 // centro vertical del bloque, en px
  hasta: number;             // cuándo desaparece
  lineas: Palabra[][];       // saltos de línea decididos a mano: nada de frases partidas feo
  tam?: number;
};

const p = (t: string, a: number, acento = false): Palabra => ({ t, a, acento });

export const CAPTIONS: Caption[] = [
  // 1 · gancho — «sé que estás agotado.» ya está en pantalla desde el frame 0 (ver beats/Gancho.tsx)
  { estilo: "sans", y: 1320, hasta: 3.95, lineas: [[p("son", 2.9), p("las", 3.0), p("5:00", 3.2, true)]] },
  { estilo: "sans", y: 1320, hasta: 4.75, lineas: [[p("y", 3.58), p("quieres", 4.02)], [p("construir", 4.3)]] },
  { estilo: "sans", y: 1320, hasta: 5.95, lineas: [[p("algo", 4.8), p("con", 5.08), p("ia.", 5.4, true)]] },
  // 2 · celular
  { estilo: "sans", y: 230, hasta: 7.05, lineas: [[p("abres", 6.36), p("el", 6.54), p("celular", 6.72, true)]], tam: 76 },
  { estilo: "sans", y: 230, hasta: 8.55, lineas: [[p("y", 7.08), p("es", 7.4), p("lo", 7.55), p("de", 7.68), p("siempre:", 7.86, true)]], tam: 70 },
  { estilo: "serif", y: 900, hasta: 15.0, lineas: [[p("y", 13.24), p("sientes", 13.5)], [p("que", 13.88), p("vas", 14.06)], [p("tarde.", 14.25, true)]], tam: 132 },
  // 3 · gráfica
  { estilo: "sans", y: 1340, hasta: 17.6, lineas: [[p("el", 15.49), p("problema", 15.69)], [p("no", 16.07), p("es", 16.41), p("la", 16.61), p("ia.", 16.81, true)]] },
  { estilo: "sans", y: 1340, hasta: 20.25, lineas: [[p("es", 17.9), p("que", 18.0), p("te", 18.08), p("queda", 18.3)], [p("1", 18.5, true), p("hora.", 18.75, true)]] },
  // 4 · plan
  { estilo: "sans", y: 1400, hasta: 22.75, lineas: [[p("no", 21.04), p("necesitas", 21.26)], [p("más", 21.88), p("horas.", 22.14, true)]], tam: 80 },
  { estilo: "sans", y: 1400, hasta: 25.45, lineas: [[p("necesitas", 22.9), p("un", 23.28), p("plan", 23.6, true)], [p("para", 23.78), p("la", 24.04), p("que", 24.18)], [p("te", 24.34), p("queda.", 24.48)]], tam: 74 },
  // 5 · cta
  { estilo: "serif", y: 1245, hasta: 99, lineas: [[p("el", 27.95), p("método", 28.08), p("en", 28.5)], [p("5", 28.76, true), p("pasos.", 29.08, true)]], tam: 92 },
];

// Tarjetas del feed (beat 2). Los textos son los del guion.
export const TARJETAS = [
  { antes: "otro video de ", acento: "ia", tipo: "video" },
  { antes: "otra ", acento: "herramienta", tipo: "herramienta" },
  { antes: "otra persona que ", acento: "ya empezó", tipo: "persona" },
] as const;

// Notificaciones que llueven. Sin promesas de dinero ni resultados.
export const AVISOS = [
  "nuevo: 7 herramientas de ia",
  "tutorial: tu primer agente",
  "¿todavía no usas ia?",
  "lanzó su app en un fin de semana",
  "3 prompts que debes saber",
  "curso de ia · empieza hoy",
  "nuevo modelo disponible",
  "hilo: cómo empecé con ia",
  "en vivo: construyendo con ia",
  "otra herramienta nueva",
  "todos ya la están usando",
  "no te quedes atrás",
];

// ⚠️ PROVISIONAL: no tengo el contenido real del ebook. Cambia estos cinco pasos por los del método.
export const PASOS = [
  "elige una sola cosa",
  "prepárala antes",
  "60 min sin pestañas",
  "termina algo pequeño",
  "deja lista la de mañana",
];

// ⚠️ PROVISIONAL: portada tipográfica hecha en código. Si ya tienes la portada real, pon el archivo en
// public/ y escribe su nombre aquí (por ejemplo "portada-ebook.png"); se usará en su lugar.
export const EBOOK = {
  portadaReal: null as string | null,
  titulo: ["después", "de las"],
  tituloAcento: "5 pm",
  subtitulo: "el método en 5 pasos",
  autor: "pablo hernández",
};

export const HANDLE = "@soypablo.ai";
