import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, TITLE_BAND, SAFE, INK_RGB } from "./theme";
import { Logo, LOGO_COLOR, LOGO_NAME, type LogoId } from "./Logos";
import { at, outAt, mix, SPR } from "./anim";
import { fontFamily } from "./fonts";


export type TitleData = { a: LogoId; b: LogoId; start: number; end: number };

/** Título de apertura: los dos contendientes entran cada uno desde su lado y el
 *  "VS" cae entre ellos. Vive en la banda del torso, así que la cara nunca se
 *  tapa y los subtítulos del gancho siguen corriendo debajo. */
const Side: React.FC<{ id: LogoId; from: number; delay: number; start: number }> =
  ({ id, from, delay, start }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = at(frame, fps, start + delay, SPR.snap);
  const lp = at(frame, fps, start + delay + 0.1, SPR.pop);
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      transform: `translateX(${mix(p, from, 0)}px)`, opacity: p,
    }}>
      <div style={{ transform: `scale(${mix(lp, 0.4, 1)}) rotate(${mix(lp, from > 0 ? 14 : -14, 0)}deg)` }}>
        <Logo id={id} size={104} />
      </div>
      <div style={{
        color: COLORS.text, fontSize: 42, fontWeight: 800, letterSpacing: "-0.02em",
        textShadow: `0 0 26px ${LOGO_COLOR[id]}55`,
      }}>{LOGO_NAME[id]}</div>
    </div>
  );
};

export const Title: React.FC<{ title: TitleData }> = ({ title }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < title.start || t >= title.end) return null;

  const shell = at(frame, fps, title.start, SPR.soft);
  const vs    = at(frame, fps, title.start + 0.34, SPR.pop);
  const rule  = at(frame, fps, title.start + 0.5, SPR.soft);
  const out   = outAt(t, title.end, 0.4);
  const p = Math.min(shell, out);

  return (
    <div style={{
      position: "absolute", left: SAFE.x0, width: SAFE.x1 - SAFE.x0,
      top: TITLE_BAND.cy - TITLE_BAND.h / 2, height: TITLE_BAND.h,
      display: "flex", flexDirection: "column", justifyContent: "center",
      fontFamily, opacity: p,
      // la salida se va hacia arriba; la entrada vino de los lados
      transform: `translateY(${mix(out, -26, 0)}px)`,
    }}>
      <div style={{
        position: "absolute", inset: "-6px -26px",
        background: `rgba(${INK_RGB},${0.88 * p})`, backdropFilter: `blur(${16 * p}px)`,
        border: `1px solid rgba(140,130,114,${0.42 * p})`, borderRadius: 26,
        boxShadow: `0 26px 70px -22px rgba(0,0,0,${0.85 * p})`,
      }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <Side id={title.a} from={-120} delay={0.02} start={title.start} />
        <div style={{
          color: COLORS.accent, fontSize: 46, fontWeight: 800, letterSpacing: "0.06em",
          transform: `scale(${mix(vs, 0.2, 1)}) rotate(${mix(vs, -30, 0)}deg)`, opacity: vs,
          textShadow: `0 0 30px ${COLORS.accent}88`,
        }}>VS</div>
        <Side id={title.b} from={120} delay={0.02} start={title.start} />
      </div>
      <div style={{
        position: "relative", height: 3, marginTop: 26, alignSelf: "center",
        width: `${rule * 62}%`, background: COLORS.accent,
        boxShadow: `0 0 20px ${COLORS.accent}`, borderRadius: 2,
      }} />
    </div>
  );
};
