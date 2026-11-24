import React from "react";
import { spring, useCurrentFrame } from "remotion";
import { CAPTIONS, Caption } from "../contenido";
import { C, SANS, SERIF } from "../fuentes";
import { FPS } from "../tiempos";

export const SOMBRA = "0 6px 34px rgba(0,0,0,.9), 0 2px 6px rgba(0,0,0,.95), 0 0 2px rgba(0,0,0,1)";

/** Un caption: 2 a 4 palabras por bloque, cada palabra aparece con un pop (spring) cuando la dice la voz. */
export const BloqueCaption: React.FC<{ c: Caption }> = ({ c }) => {
  const frame = useCurrentFrame();
  const serif = c.estilo === "serif";
  const tam = c.tam ?? (serif ? 110 : 86);
  return (
    <div
      style={{
        position: "absolute", left: 90, width: 860, top: c.y, transform: "translateY(-50%)", textAlign: "center",
        fontFamily: serif ? SERIF : SANS, fontStyle: serif ? "italic" : "normal", fontWeight: serif ? 700 : 900,
        fontSize: tam, lineHeight: serif ? 1.0 : 1.04, letterSpacing: serif ? "-0.01em" : "-0.03em",
        color: C.crema, textShadow: SOMBRA, textTransform: "lowercase",
      }}
    >
      {c.lineas.map((linea, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "center", gap: "0.24em", whiteSpace: "nowrap" }}>
          {linea.map((w, j) => {
            const s = spring({ frame: frame - Math.round(w.a * FPS), fps: FPS, config: { damping: 11, stiffness: 240, mass: 0.55 } });
            const visible = frame >= Math.round(w.a * FPS);
            return (
              <span key={j} style={{ display: "inline-block", opacity: visible ? 1 : 0, transform: `scale(${0.55 + 0.45 * s}) translateY(${(1 - s) * 18}px)`, color: w.acento ? C.naranja : undefined }}>
                {w.t}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const Captions: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const activos = CAPTIONS.filter((c) => t >= c.lineas[0][0].a - 0.001 && t < c.hasta);
  return (
    <>
      {activos.map((c, i) => (
        <BloqueCaption key={`${c.y}-${c.lineas[0][0].a}-${i}`} c={c} />
      ))}
    </>
  );
};
