// Utilidades de animación. Todo es función pura del tiempo (segundos) para que el render sea determinista.
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
export const eo = (x: number) => 1 - Math.pow(1 - x, 3);
export const eo5 = (x: number) => 1 - Math.pow(1 - x, 5);
export const ei = (x: number) => x * x * x;
export const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** Resorte subamortiguado: 0 antes de t0, pasa de 1 y se asienta en 1. */
export const resorte = (t: number, t0: number, rigidez = 16, amort = 0.5) => {
  const d = t - t0;
  if (d <= 0) return 0;
  const w = rigidez * Math.sqrt(1 - amort * amort);
  return 1 - Math.exp(-rigidez * amort * d) * (Math.cos(w * d) + ((amort * rigidez) / w) * Math.sin(w * d));
};

/** Golpe de zoom: sube de golpe en t0 y decae. Se suma a la escala. */
export const golpe = (t: number, t0: number, amp = 0.06, dec = 8) => (t < t0 ? 0 : amp * Math.exp(-(t - t0) * dec));

/** Micro temblor de cámara que decae tras t0. */
export const temblor = (t: number, t0: number, amp = 10, dec = 7): [number, number] => {
  if (t < t0) return [0, 0];
  const d = t - t0, e = amp * Math.exp(-d * dec);
  return [e * Math.sin(d * 71), e * Math.cos(d * 93)];
};

/** Ruido determinista 0..1 a partir de un número. */
export const ruido = (x: number) => {
  const s = Math.sin(x * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Ruido suave (interpolado) para parpadeos y flotaciones. */
export const ruidoSuave = (x: number) => {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(ruido(i), ruido(i + 1), u);
};
