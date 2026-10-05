import raw from "./data/montaje.json";
export type Seg = { from: number; to: number; outStart: number; fromF: number; toF: number; outF: number };
export type Word = { i: number; text: string; start: number; end: number };
export type Block = { from: number; to: number; key: number[]; serif?: boolean };
export type Escena = { t: "tarjeta"; start: number; end: number; expandAt: number; label: string };
export const M = raw as unknown as {
  video: string; durationInFrames: number; segments: Seg[]; words: Word[]; blocks: Block[];
  escenas: Escena[]; handle: string; zooms: { escalas: number[]; origen: string };
};
