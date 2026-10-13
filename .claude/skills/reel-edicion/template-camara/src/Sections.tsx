import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, KICKER_Y, RAIL } from "./theme";
import { at, outAt, mix, SPR, aparta } from "./anim";
import { Logo, LOGO_COLOR, type LogoId } from "./Logos";
import { fontFamily } from "./fonts";


export type Section = { n: number; label: string; start: number; end: number; logo?: LogoId };

/** Índice de sección: ocupa el sitio del kicker (raíl izquierdo, y=300, dentro
 *  del recorte 4:5) cuando la pieza es una lista numerada larga. Es el pago de
 *  la lista difuminada del hook: la etiqueta que allí no se leía, aquí se lee.
 *  Número grande en color de acento, etiqueta en color de texto a dos líneas como mucho. */
export const Sections: React.FC<{ sections: Section[]; mute?: Array<[number, number]> }> = ({ sections, mute }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cur = sections.find((s) => t >= s.start && t < s.end);
  if (!cur) return null;
  const p = at(frame, fps, cur.start, SPR.snap);
  const np = at(frame, fps, cur.start + 0.05, SPR.pop);
  const out = outAt(t, cur.end, 0.28) * aparta(t, mute);
  return (
    <div style={{
      position: "absolute", left: RAIL.x, top: KICKER_Y - 14, fontFamily,
      display: "flex", alignItems: "center", gap: 18,
      // entra deslizando desde fuera; sale hacia arriba (no es la entrada al revés)
      transform: `translateX(${mix(p, -60, 0)}px) translateY(${mix(out, -14, 0)}px)`,
      opacity: p * out,
    }}>
      {cur.logo ? (
        /* El logo va DENTRO de la línea (split screen): en esa banda solo hay
           una columna libre. Entra con el mismo muelle que el número. */
        <div style={{ display: "flex", alignItems: "center",
                      transform: `scale(${mix(np, 0.4, 1)}) rotate(${mix(np, -24, 0)}deg)`,
                      filter: `drop-shadow(0 0 12px ${LOGO_COLOR[cur.logo]}88)` }}>
          <Logo id={cur.logo} size={44} />
        </div>
      ) : null}
      <div style={{
        color: COLORS.accent, fontSize: 60, fontWeight: 800, lineHeight: 1,
        letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums",
        transform: `scale(${mix(np, 0.5, 1)})`, transformOrigin: "left center",
        textShadow: "0 3px 16px rgba(0,0,0,0.8)",
      }}>{String(cur.n).padStart(2, "0")}</div>
      <div style={{
        color: COLORS.text, fontSize: 27, fontWeight: 800, lineHeight: 1.12,
        letterSpacing: "0.12em", textTransform: "uppercase", maxWidth: RAIL.w - 90,
        textShadow: "0 3px 14px rgba(0,0,0,0.8)",
      }}>{cur.label}</div>
    </div>
  );
};
