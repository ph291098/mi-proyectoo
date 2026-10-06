import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FPS } from "./theme";
import { M } from "./data";
import { Camara, Firma, Subtitulos, tarjetaActiva } from "./comun";

// Borrador 1 (outfit): plano + tarjetas que se expanden + subtítulos + firma.
export const Reel: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const tj = tarjetaActiva(M, t);
  const grafico = !!tj && tj.p < 0.5;
  return (
    <AbsoluteFill style={{ background: C.tinta }}>
      <Camara m={M} t={t} />
      <Firma m={M} grafico={grafico} />
      <Subtitulos m={M} t={t} grafico={grafico} />
    </AbsoluteFill>
  );
};
