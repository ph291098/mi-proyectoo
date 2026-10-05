import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, DZ, HANDLE_Y, KICKER_Y, WIDTH } from "./theme";
import { fontFamily } from "./fonts";


// Caja simétrica respecto al centro del cuadro y a la vez dentro de la zona
// segura: 180 → 900. Centrarla en SAFE (70 → 900) la dejaba 55 px a la
// izquierda del centro y sobre una ventana simétrica se lee como un error.
const BOX = { left: DZ.right, width: WIDTH - DZ.right * 2 } as const;

export const Kicker: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 18, mass: 0.6 } });
  return (
    <div style={{
      position: "absolute", left: BOX.left, width: BOX.width, top: KICKER_Y,
      fontFamily, color: COLORS.accent, fontSize: 30, fontWeight: 800,
      letterSpacing: "0.2em", textTransform: "uppercase", textAlign: "center",
      transform: `translateY(${interpolate(p, [0, 1], [-14, 0])}px)`, opacity: p,
      textShadow: "0 3px 14px rgba(0,0,0,0.6)",
    }}>{text}</div>
  );
};

// Sin barra de progreso: come espacio y no dice nada.

export const Handle: React.FC<{ text: string }> = ({ text }) => (
  <div style={{
    position: "absolute", left: BOX.left, width: BOX.width, top: HANDLE_Y, textAlign: "center",
    fontFamily, color: COLORS.line, fontSize: 26, fontWeight: 700, letterSpacing: "0.14em",
    opacity: 0.82,
  }}>{text}</div>
);
