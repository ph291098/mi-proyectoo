import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS, CARD_BAND, SAFE } from "./theme";
import { at, outAt, mix, SPR } from "./anim";
import { fontFamily } from "./fonts";


/** Lista DIFUMINADA del hook: enseña que hay cinco temas sin dejar leer cuáles.
 *  Los números van nítidos (son la promesa: "5 categorías"); las etiquetas llevan
 *  un desenfoque que deja ver la silueta de la palabra pero no la letra. Se
 *  paga después: cada etiqueta reaparece nítida en su sección (ver Sections).
 *
 *  `sweepFrom`/`sweepTo` (s): un marcador de acento recorre la lista de arriba abajo
 *  mientras él dice "desde la más básica a la que tiene mejor costo-beneficio". */
export type TeaserData = {
  start: number; end: number; kicker?: string; items: string[];
  sweepFrom?: number; sweepTo?: number; cy?: number; h?: number;
};

/** Desenfoque en reposo. 7 px a 40 px de cuerpo: se ve que es texto, no se lee. */
const BLUR_REST = 7;
const ROW_H = 58;

export const Teaser: React.FC<{ data: TeaserData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < data.start || t >= data.end) return null;

  const inP  = at(frame, fps, data.start, SPR.snap);
  const outP = outAt(t, data.end, 0.34);
  const p = Math.min(inP, outP);
  const cy = data.cy ?? CARD_BAND.cy;
  const alto = data.h ?? CARD_BAND.h;
  const n = data.items.length;

  // marcador: índice fraccionario de fila entre sweepFrom y sweepTo
  const sweep = data.sweepFrom !== undefined && data.sweepTo !== undefined
    ? interpolate(t, [data.sweepFrom, data.sweepTo], [0, n - 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : -1;
  const sweepOn = data.sweepFrom !== undefined && t >= data.sweepFrom - 0.1;
  const kp = at(frame, fps, data.start + 0.1, SPR.soft);

  return (
    <>
      <div style={{
        position: "absolute", left: SAFE.x0, width: SAFE.x1 - SAFE.x0,
        top: cy - alto / 2, minHeight: alto,
        padding: "26px 40px", boxSizing: "border-box", fontFamily,
        display: "flex", flexDirection: "column", justifyContent: "center",
        background: `rgba(10,8,6,${0.86 * p})`,
        backdropFilter: `blur(${12 * p}px)`,
        border: `1px solid rgba(140,130,114,${0.42 * p})`,
        borderRadius: 22,
        boxShadow: `0 26px 70px -22px rgba(0,0,0,${0.85 * p})`,
        // entra con barrido lateral (como las tarjetas); sale cayendo y fundiéndose
        clipPath: `inset(0 ${(1 - inP) * 100}% 0 0 round 22px)`,
        transform: `translateY(${mix(outP, 30, 0)}px)`,
        filter: outP < 1 ? `blur(${mix(outP, 9, 0)}px)` : "none",
        opacity: outP,
      }}>
        {data.kicker ? (
          <div style={{ marginBottom: 14, overflow: "hidden" }}>
            <div style={{
              color: COLORS.line, fontSize: 24, fontWeight: 700, letterSpacing: "0.18em",
              textTransform: "uppercase", clipPath: `inset(0 ${(1 - kp) * 100}% 0 0)`,
            }}>{data.kicker}</div>
          </div>
        ) : null}
        {data.items.map((label, i) => {
          const rp = at(frame, fps, data.start + 0.12 + i * 0.1, SPR.snap);
          // la etiqueta llega MÁS borrosa y asienta en el reposo: nunca llega a nítida
          const blur = mix(rp, 22, BLUR_REST);
          const near = sweepOn ? Math.max(0, 1 - Math.abs(sweep - i)) : 0;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 22, height: ROW_H,
              transform: `translateX(${mix(rp, -26, 0)}px)`, opacity: rp,
            }}>
              <div style={{
                width: 5, height: 34, borderRadius: 3,
                background: COLORS.accent, opacity: near, marginRight: -8,
                boxShadow: `0 0 18px ${COLORS.accent}`,
              }} />
              <div style={{
                color: COLORS.accent, fontSize: 30, fontWeight: 800, width: 52,
                letterSpacing: "0.04em", fontVariantNumeric: "tabular-nums",
              }}>{String(i + 1).padStart(2, "0")}</div>
              <div style={{
                color: COLORS.text, fontSize: 40, fontWeight: 800, letterSpacing: "-0.01em",
                filter: `blur(${blur}px)`,
                opacity: mix(near, 0.72, 0.95),
                whiteSpace: "nowrap",
              }}>{label}</div>
            </div>
          );
        })}
      </div>
    </>
  );
};
