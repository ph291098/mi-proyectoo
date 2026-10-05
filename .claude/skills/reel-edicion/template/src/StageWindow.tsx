import React from "react";
import { OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { STAGE, SOURCE, COLORS } from "./theme";

export type Rect = { x: number; y: number; w: number; h: number };
// Fuente de hablante activo: no hay diapositiva, solo el plano. `crop` sigue
// disponible por si un tramo pide cerrar sobre la cara.
export type Span = { kind: "room"; start: number; end: number; crop?: Rect };

const rectOf = (s: Span): Rect =>
  s.crop ?? { x: 0, y: 0, w: SOURCE.w, h: SOURCE.h };

/** Geometría del vídeo y alto de ventana para un tramo. */
const geom = (s: Span) => {
  const c = rectOf(s);
  const k = STAGE.w / c.w;                          // el recorte llena el ancho
  const h = Math.min(STAGE.hMax, c.h * k);          // alto según el recorte, con tope
  return { w: SOURCE.w * k, h: SOURCE.h * k, left: -c.x * k, top: -c.y * k, boxH: h };
};

const GLIDE = 0.45;

/** Costuras del densificado: al quitar el aire muerto el plano SALTA. Sobre un
 *  salto lo que funciona no es un destello sino cambiar la escala: se alterna
 *  entre 1 y SEAM_SCALE en cada costura, con muelle, y el cambio de encuadre
 *  hace de corte. Solo entran las costuras que quitaron bastante — tapar un
 *  salto que no se ve solo añade mareo. */
const SEAM_SCALE = 1.05;

export const StageWindow: React.FC<{ src: string; spans: Span[]; seams?: number[] }> = ({ src, spans, seams = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const i = Math.max(0, spans.findIndex((s) => t < s.end));
  const cur = spans[i] ?? spans[spans.length - 1];
  const prev = spans[i - 1];
  const a = geom(cur);
  let g = a;
  if (prev && t - cur.start < GLIDE) {
    const b = geom(prev);
    const p = interpolate(t - cur.start, [0, GLIDE], [0, 1], { extrapolateRight: "clamp" });
    const m = (x: number, y: number) => x + (y - x) * p;
    g = { w: m(b.w,a.w), h: m(b.h,a.h), left: m(b.left,a.left), top: m(b.top,a.top), boxH: m(b.boxH,a.boxH) };
  }

  const pasadas = seams.filter((x) => t >= x);
  const ultima = pasadas.length ? pasadas[pasadas.length - 1] : null;
  const destino = pasadas.length % 2 === 0 ? 1 : SEAM_SCALE;
  const previo = pasadas.length % 2 === 0 ? SEAM_SCALE : 1;
  const sp = ultima === null ? 1
    : spring({ frame: frame - ultima * fps, fps, config: { damping: 20, mass: 0.4, stiffness: 250 } });
  const escala = previo + (destino - previo) * sp;

  return (
    <div
      style={{
        position: "absolute", left: 0, top: STAGE.cy - g.boxH / 2,
        width: STAGE.w, height: g.boxH,
        overflow: "hidden", background: COLORS.ink,
        boxShadow: "0 26px 70px -22px rgba(0,0,0,0.85)",
      }}
    >
      <OffthreadVideo
        src={staticFile(src)}
        style={{ position: "absolute", width: g.w, height: g.h, left: g.left, top: g.top,
                 transform: `scale(${escala})`, transformOrigin: "50% 42%" }}
      />
    </div>
  );
};
