import outfit from "./data/montaje.json";
import prompt from "./data/prompt.json";

export type Seg = { from: number; to: number; outStart: number; fromF: number; toF: number; outF: number };
export type Word = { i: number; text: string; start: number; end: number };
export type Block = { from: number; to: number; key: number[]; serif?: boolean };
/** Cada escena trae t, start y end (segundos de SALIDA); el resto depende del tipo. */
export type Escena = { t: string; start: number; end: number; [k: string]: any };
export type Sfx = { s: string; at: number; gain: number };
export type Montaje = {
  video: string; durationInFrames: number; segments: Seg[]; words: Word[]; blocks: Block[];
  escenas: Escena[]; handle: string; zooms: { escalas: number[]; origen: string };
  sfx?: Sfx[]; musica?: { src: string } | null;
};

export const M = outfit as unknown as Montaje;   // borrador 1: outfit
export const P = prompt as unknown as Montaje;   // borrador 2: «4 partes de un buen prompt»
