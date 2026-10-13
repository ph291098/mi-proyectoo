import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, KICKER_Y, HANDLE_Y, RAIL, WIDTH, DZ, INK_RGB } from "./theme";
import { at, outAt, mix, SPR, aparta } from "./anim";
import { Logo, LOGO_COLOR, type LogoId } from "./Logos";
import { fontFamily } from "./fonts";


export type Keyword = { verb: string; word: string; start: number };

/** Kicker y chip de keyword viven en la MISMA banda arriba a la izquierda, sobre
 *  la pared muerta y — esto es lo que importa — por debajo de y=285, dentro del
 *  recorte 4:5 del feed de Instagram. Antes estaban en y 250 y el CTA
 *  desaparecía justo donde caen la mayoría de las impresiones. */
export const Kicker: React.FC<{ text: string; from: number; until?: number; mute?: Array<[number, number]>; logo?: LogoId }> = ({ text, from, until, mute, logo }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const t = frame / fps;
  if (!text || t < from) return null;
  const p = at(frame, fps, from, SPR.soft);
  const out = (until === undefined ? 1 : outAt(t, until, 0.3)) * aparta(t, mute);
  if (out <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: RAIL.x, top: KICKER_Y - (logo ? 8 : 0), maxWidth: RAIL.w,
      display: "flex", alignItems: "center", gap: 16,
      fontFamily, color: COLORS.accent, fontSize: 30, fontWeight: 800,
      letterSpacing: "0.2em", textTransform: "uppercase",
      transform: `translateX(${mix(p, -30, 0)}px)`, opacity: p * out,
      textShadow: "0 3px 14px rgba(0,0,0,0.75)",
    }}>
      {/* TOPIC_ALIGN "inline": el logo va en la línea, no en un chip aparte */}
      {logo ? <span style={{ display: "flex", filter: `drop-shadow(0 0 12px ${LOGO_COLOR[logo]}88)` }}><Logo id={logo} size={40} /></span> : null}
      <span>{text}</span>
    </div>
  );
};

/** CTA de palabra clave: se escribe para que se pueda COPIAR. Late despacio para
 *  que el ojo vuelva a ella sin que llegue a molestar. */
export const KeywordChip: React.FC<{ kw: Keyword }> = ({ kw }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < kw.start) return null;
  const p = at(frame, fps, kw.start, SPR.snap);
  const pulse = 1 + 0.022 * Math.sin((t - kw.start) * 3.4);
  const glow = 0.5 + 0.24 * Math.sin((t - kw.start) * 3.4);
  // keyword larga ("QUIERO LOS CASOS DE USO"): cuerpo menor para no pasar de x=900
  const long = kw.word.length > 12;
  return (
    <div style={{
      position: "absolute", left: RAIL.x, top: KICKER_Y - 18, fontFamily,
      transform: `translateX(${mix(p, -40, 0)}px) scale(${mix(p, 0.86, pulse)})`,
      transformOrigin: "left center", opacity: p,
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 15,
        padding: "14px 28px", borderRadius: 999,
        background: `rgba(${INK_RGB},0.82)`, backdropFilter: "blur(10px)",
        border: `1px solid rgba(233,185,73,${glow})`,
        boxShadow: `0 14px 44px -16px rgba(0,0,0,0.9), 0 0 ${glow * 42}px -10px ${COLORS.accent}`,
      }}>
        <span style={{ color: COLORS.soft, fontSize: long ? 23 : 26, fontWeight: 700,
                       letterSpacing: "0.16em", textTransform: "uppercase" }}>{kw.verb}</span>
        <span style={{ color: COLORS.accent, fontSize: long ? 29 : 34, fontWeight: 800,
                       letterSpacing: long ? "0.06em" : "0.1em", whiteSpace: "nowrap" }}>{kw.word}</span>
      </div>
    </div>
  );
};

/** El handle calla con las tarjetas (`hide`, en ms): las altas le pisan la línea. */
export const Handle: React.FC<{ text: string; hide?: Array<[number, number]> }> = ({ text, hide = [] }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  if (!text) return null;   // handle vacío = pieza sin handle (p.ej. si la costura ya va llena)
  let vis = 1;
  for (const [a, b] of hide) {
    if (ms >= a - 200 && ms < b + 200) {
      vis = Math.min(vis, ms < a ? (a - ms) / 200 : ms >= b ? (ms - b) / 200 : 0);
    }
  }
  if (vis <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: DZ.right, width: WIDTH - DZ.right * 2, top: HANDLE_Y,
      textAlign: "center",
      fontFamily, color: COLORS.line, fontSize: 26, fontWeight: 700, letterSpacing: "0.14em",
      opacity: 0.8 * vis,
    }}>{text}</div>
  );
};
