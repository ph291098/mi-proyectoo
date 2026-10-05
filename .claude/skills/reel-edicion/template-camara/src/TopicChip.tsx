import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, TOPIC_Y, RAIL } from "./theme";
import { Logo, LOGO_COLOR, LOGO_NAME, type LogoId } from "./Logos";
import { at, outAt, mix, SPR, aparta } from "./anim";
import { fontFamily } from "./fonts";


/** `spec` convierte el chip de marca en una FICHA: además de decir de quién se
 *  habla, da el dato. En el reel del NAS es lo que lo hace protagonista sin robarle
 *  sitio a nada — vive en el raíl, que es pared, y se aparta solo si él la invade. */
export type Topic = { logo: LogoId; start: number; end: number; spec?: string };

/** Marca de "de quién estamos hablando ahora". Va pegada al margen izquierdo,
 *  debajo de la cara y encima de la banda de tarjetas: no pisa nada. Es lo que
 *  mantiene las marcas presentes durante los tramos largos de plano fijo, sin
 *  robarle la lectura a los subtítulos. */
export const TopicChip: React.FC<{ topics: Topic[]; mute?: Array<[number, number]> }> = ({ topics, mute }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cur = topics.find((x) => t >= x.start && t < x.end);
  if (!cur) return null;

  const p = at(frame, fps, cur.start, SPR.snap);
  const lp = at(frame, fps, cur.start + 0.06, SPR.pop);
  const out = outAt(t, cur.end, 0.28) * aparta(t, mute);
  const accent = LOGO_COLOR[cur.logo];

  return (
    <div style={{
      position: "absolute", left: RAIL.x, top: TOPIC_Y, fontFamily,
      // entra deslizando desde fuera del cuadro; sale hacia arriba, sin volver
      transform: `translateX(${mix(p, -160, 0)}px) translateY(${mix(out, -14, 0)}px)`,
      opacity: p * out,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 15,
        padding: "13px 26px 13px 17px", borderRadius: 999,
        background: "rgba(10,8,6,0.72)", backdropFilter: "blur(10px)",
        border: `1px solid ${accent}66`,
        boxShadow: `0 12px 36px -14px rgba(0,0,0,0.85), 0 0 26px -12px ${accent}`,
      }}>
        <div style={{ transform: `scale(${mix(lp, 0.3, 1)}) rotate(${mix(lp, -28, 0)}deg)`,
                      filter: `drop-shadow(0 0 12px ${accent}88)` }}>
          <Logo id={cur.logo} size={46} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ color: COLORS.text, fontSize: cur.spec ? 27 : 33, fontWeight: 800,
                         letterSpacing: "-0.01em", lineHeight: 1.05 }}>
            {LOGO_NAME[cur.logo]}
          </span>
          {cur.spec ? (
            <span style={{ color: accent, fontSize: 29, fontWeight: 800, letterSpacing: "-0.02em",
                           lineHeight: 1.05, whiteSpace: "nowrap" }}>{cur.spec}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
