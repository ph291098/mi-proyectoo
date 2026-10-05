import { spring, interpolate } from "remotion";

/** Helpers de animación compartidos. Todo el montaje respira con los mismos
 *  tres muelles: nada entra con una curva inventada por elemento. */
export const SPR = {
  soft:  { damping: 20, mass: 0.7, stiffness: 110 },
  snap:  { damping: 15, mass: 0.5, stiffness: 190 },
  pop:   { damping: 11, mass: 0.45, stiffness: 220 },   // rebota: para logos y cifras
} as const;

type Cfg = typeof SPR[keyof typeof SPR];

/** Muelle que arranca en un instante en SEGUNDOS, no en frames. */
export const at = (frame: number, fps: number, startSec: number, cfg: Cfg = SPR.soft) =>
  spring({ frame: frame - startSec * fps, fps, config: cfg });

/** Salida: NUNCA es la entrada al revés (regla 5). Rampa corta y lineal. */
export const outAt = (t: number, endSec: number, dur = 0.32) =>
  interpolate(t, [endSec - dur, endSec], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const mix = (p: number, a: number, b: number) => a + (b - a) * p;

/** Factor 0..1 que APARTA un gráfico mientras él invade su banda.
 *
 *  El raíl (kicker, secciones, chip de keyword) y el chip de marca viven arriba a
 *  la izquierda, que casi siempre es pared. Casi: cuando se acerca a la cámara, la
 *  cara sube y entra en esa banda. En vez de dejar el rótulo encima de su cara —
 *  nada tapa la cara — se desvanece durante esos tramos y
 *  vuelve solo. Los tramos los calcula scripts/aparta.py contra la pista de caras.
 *
 *  La rampa de 0.3 s es deliberada: más corta se lee como un parpadeo de error. */
export const aparta = (t: number, tramos?: Array<[number, number]>, rampa = 0.3): number => {
  if (!tramos?.length) return 1;
  let f = 1;
  for (const [a, b] of tramos) {
    if (t <= a - rampa || t >= b + rampa) continue;
    const dentro = t >= a && t <= b
      ? 0
      : t < a ? 1 - (t - (a - rampa)) / rampa
              : (t - b) / rampa;
    f = Math.min(f, Math.max(0, Math.min(1, dentro)));
  }
  return f;
};

/** Número que sube. Devuelve el valor y su formato con separador de miles.
 *
 *  Un total que aparece hecho es un dato; un total que sube mientras caen las
 *  filas es el argumento de la tarjeta — se VE acumularse lo que cuesta el mismo
 *  stack en SaaS. Arranca cuando cae la primera fila y asienta con la última. */
export const cuenta = (p: number, hasta: number, decimales = 0): string => {
  const v = hasta * Math.max(0, Math.min(1, p));
  const s = v.toFixed(decimales);
  const [ent, dec] = s.split(".");
  const miles = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return dec ? `${miles},${dec}` : miles;
};
