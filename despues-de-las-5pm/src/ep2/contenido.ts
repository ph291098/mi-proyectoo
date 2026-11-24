// Episodio 2 · «hora 2: elige una sola cosa». Todo el texto y los tiempos (segundos) en un solo sitio.
// Los tiempos salen de src/data/voz_ep2.json (scripts/audio_ep2.py). Al grabar la voz final hay que revisarlos.
import { Caption, Palabra } from "../contenido";

export const DUR2 = 20.5;
export const FRAMES2 = 615;

// Golpes del episodio, en la misma rejilla de 80 BPM (1 tiempo = 0,75 s).
export const T2 = {
  corte: 1.58,       // del reloj a él
  pierdes: 2.25,     // «pierdes»
  laptop: 3.0,       // abre la laptop
  agobio: 6.75,      // corte a la pose agobiada
  acabo: 8.25,       // «se acabó»
  leccion: 9.0,      // corte a negro
  sentado: 11.25,    // «sentado»
  paso: 12.0,        // «paso 1»
  nota: 13.38,       // la nota aterriza
  escribe: 15.5,     // se escribe la línea
  vuelve: 16.9,      // vuelve el cuarto
  hecho: 18.0,       // «hecho»
  sigueme: 19.25,    // «sígueme para la hora 3»
  final: 19.5,
};

const p = (t: string, a: number, acento = false): Palabra => ({ t, a, acento });

export const CAPTIONS2: Caption[] = [
  // gancho — «tienes 1 hora.» ya está en pantalla desde el frame 0 (ver Episodio2.tsx)
  { estilo: "sans", y: 1320, hasta: 2.95, lineas: [[p("y", 1.65), p("así", 1.82), p("la", 2.02)], [p("pierdes.", 2.25, true)]], tam: 96 },
  // tropiezo
  { estilo: "sans", y: 1400, hasta: 3.88, lineas: [[p("abres", 3.0), p("la", 3.16), p("laptop.", 3.31)]], tam: 80 },
  { estilo: "sans", y: 1400, hasta: 4.86, lineas: [[p("una", 3.92), p("pestaña.", 4.07, true)]], tam: 88 },
  { estilo: "sans", y: 1400, hasta: 5.24, lineas: [[p("otra.", 4.9, true)]], tam: 96 },
  { estilo: "sans", y: 1400, hasta: 5.93, lineas: [[p("un", 5.28), p("tutorial.", 5.47, true)]], tam: 88 },
  { estilo: "sans", y: 1400, hasta: 8.0, lineas: [[p("y", 5.97), p("cuando", 6.14), p("por", 6.37), p("fin", 6.57)], [p("decides…", 6.82, true)]], tam: 78 },
  { estilo: "serif", y: 1330, hasta: 9.0, lineas: [[p("se", 8.08), p("acabó.", 8.25, true)]], tam: 150 },
  // lección
  { estilo: "sans", y: 1330, hasta: 10.62, lineas: [[p("el", 9.03), p("error", 9.2), p("no", 9.43), p("fue", 9.67)], [p("elegir", 9.82), p("mal.", 10.24)]] },
  { estilo: "serif", y: 1330, hasta: 11.95, lineas: [[p("fue", 10.69), p("elegir", 10.81)], [p("sentado.", 11.22, true)]], tam: 128 },
  { estilo: "sans", y: 1330, hasta: 14.48, lineas: [[p("elige", 12.82), p("una", 13.19)], [p("sola", 13.65), p("cosa", 13.87, true)]], tam: 96 },
  { estilo: "sans", y: 1330, hasta: 15.5, lineas: [[p("antes", 14.53), p("de", 14.63)], [p("sentarte.", 14.89, true)]], tam: 96 },
  { estilo: "sans", y: 1330, hasta: 16.84, lineas: [[p("escríbela", 15.61)], [p("en", 15.97), p("una", 16.16), p("línea.", 16.36, true)]] },
  // vuelta al cuarto
  { estilo: "sans", y: 1400, hasta: 18.5, lineas: [[p("y", 16.92), p("termina", 17.08)], [p("solo", 17.51), p("eso.", 17.87, true)]], tam: 84 },
];

// Las pestañas que se van abriendo. Sin marcas ni promesas: solo ruido.
export const PESTANAS = [
  "¿cuál ia es mejor?", "top 10 herramientas", "tutorial: empieza aquí", "comparativa completa", "curso de agentes",
  "el prompt perfecto", "otra herramienta nueva", "review: ¿vale la pena?", "10 ia que debes probar", "guía definitiva",
  "¿y si uso otra?", "hilo: mi stack de ia", "nueva versión hoy", "alternativas gratis", "empieza por aquí",
];
export const T_PESTANAS = [4.07, 4.75, 5.47, 5.95, 6.3, 6.6, 6.85, 7.05, 7.25, 7.4, 7.55, 7.7, 7.82, 7.94, 8.05];

// ⚠️ PROVISIONAL: el paso 1 y el ejemplo de la nota los escribí yo, no salen del ebook.
export const PASO = { numero: 1, texto: "elige una sola cosa" };
export const NOTA = { etiqueta: "hoy, en mi hora:", linea: "terminar el formulario" };
export const SIGUIENTE = "sígueme para la hora 3";
