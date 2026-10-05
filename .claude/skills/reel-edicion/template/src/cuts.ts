// REGISTRO DE CORTES — el único sitio donde se declara qué se renderiza.
// Una entrada por composición. El `id` es el nombre que ves en el studio y
// también el nombre del fichero en out/ y final/.
//
// Al añadir un corte: genera src/data/cN.ts con scripts/gen_data.py, impórtalo
// aquí y añade su línea. Root.tsx no se toca nunca.
import type { ReelData } from "./Reel";
import { c1 } from "./data/c1";

export const CUTS: Array<{ id: string; data: ReelData }> = [
  { id: "Corte1", data: c1 },
];
