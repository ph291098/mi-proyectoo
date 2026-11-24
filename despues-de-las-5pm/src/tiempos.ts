import { eio, eo, lerp, prog } from "./util";

export const FPS = 30;
export const ANCHO = 1080;
export const ALTO = 1920;
export const DUR = 32;                       // segundos
export const FRAMES = DUR * FPS;

// Rejilla musical: 80 BPM → 1 tiempo = 0,75 s. Los golpes caen en tiempo (ver scripts/audio.py).
export const T = {
  agotado: 1.5,        // golpe grave + corte al personaje
  abierto: 2.8,        // corte al plano general
  lasCinco: 3.0,       // el reloj marca las 5:00
  aviso: 5.25,         // el celular se enciende en la mesa
  celular: 6.0,        // whip al celular
  tarjeta1: 8.64, tarjeta2: 10.26, tarjeta3: 11.44,
  tarde: 14.25,        // «tarde»
  grafica: 15.0,       // corte a negro
  sello: 18.75,        // «1 HORA»
  plan: 20.25,         // vuelve el cuarto, se abre la laptop
  cta: 25.5,           // portada del ebook
  final: 30.0,         // golpe final
};

// Zonas seguras: nada de texto importante en el 20 % inferior ni en el 12 % derecho.
export const SEGURO = { xMax: ANCHO * 0.88, yMax: ALTO * 0.8, xMin: 70, yMin: 150 };

// ---------- cámara del cuarto ----------
// El cuarto mide 1080×1910 (la ilustración a escala). La cámara mira a (x, y) con zoom z.
export type Camara = { x: number; y: number; z: number };
export const CAM0: Camara = { x: 540, y: 955, z: 1 };

export type Toma = { a: number; b: number; de: Camara; hasta: Camara; curva?: (x: number) => number };
// Cada toma tiene un dolly-in lento; entre tomas hay corte seco, whip o dip a negro.
const TOMAS: Toma[] = [
  { a: 0, b: T.agotado, de: { x: 750, y: 520, z: 2.2 }, hasta: { x: 753, y: 514, z: 2.4 } },               // reloj
  { a: T.agotado, b: T.abierto, de: { x: 581, y: 1088, z: 1.7 }, hasta: { x: 581, y: 1080, z: 1.84 } },     // él, agotado
  { a: T.abierto, b: T.aviso + 0.15, de: { x: 540, y: 955, z: 1.03 }, hasta: { x: 548, y: 968, z: 1.1 } },  // plano general
  { a: T.aviso + 0.15, b: T.celular, de: { x: 548, y: 968, z: 1.1 }, hasta: { x: 770, y: 1385, z: 1.9 }, curva: (x) => x * x * x }, // empuje al celular
  { a: T.celular, b: T.grafica, de: { x: 581, y: 1010, z: 1.85 }, hasta: { x: 581, y: 1000, z: 2.05 } },    // detrás del celular
  { a: T.plan, b: T.cta, de: { x: 541, y: 1020, z: 1.12 }, hasta: { x: 541, y: 1036, z: 1.22 } },           // el plan
];

/** Cámara en el instante t para una lista de tomas (cada episodio tiene la suya). */
export const camaraDeTomas = (tomas: Toma[], t: number): Camara => {
  const toma = tomas.find((s) => t >= s.a && t < s.b) ?? tomas[tomas.length - 1];
  const p = (toma.curva ?? ((x: number) => lerp(x, eio(x), 0.35)))(prog(t, toma.a, toma.b));
  return { x: lerp(toma.de.x, toma.hasta.x, p), y: lerp(toma.de.y, toma.hasta.y, p), z: lerp(toma.de.z, toma.hasta.z, p) };
};

export const camaraEn = (t: number): Camara => camaraDeTomas(TOMAS, t);

/** Hora que marca el reloj (en minutos desde las 0:00, con decimales). 4:58 → 5:00 en los 3 primeros segundos. */
export const horaReloj = (t: number) => {
  const base = 16 * 60 + 58;
  if (t < T.lasCinco) return base + 2 * eo(prog(t, 0, T.lasCinco) * 0.999) ;
  return 17 * 60 + (t - T.lasCinco) / 60;          // después corre en tiempo real
};
