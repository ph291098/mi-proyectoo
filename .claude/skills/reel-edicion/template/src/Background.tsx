import React from "react";
import { OffthreadVideo, staticFile } from "remotion";
import { COLORS } from "./theme";

/** Cama de fondo: copia MUY desenfocada del propio plano, para que el 16:9 no
 *  flote sobre negro. La ventana de escenario va encima, nítida y sin filtrar. */
export const Background: React.FC<{ src: string }> = ({ src }) => (
  <div style={{ position: "absolute", inset: 0, background: COLORS.ink, overflow: "hidden" }}>
    <OffthreadVideo
      src={staticFile(src)}
      muted
      style={{
        position: "absolute", left: "50%", top: "50%",
        width: 1920 * 1.35, height: 1080 * 1.35, transform: "translate(-50%,-50%)",
        filter: "blur(46px) saturate(0.65) brightness(0.34)",
      }}
    />
    <div style={{ position: "absolute", inset: 0, background:
      "radial-gradient(120% 78% at 50% 34%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.82) 100%)" }} />
  </div>
);
