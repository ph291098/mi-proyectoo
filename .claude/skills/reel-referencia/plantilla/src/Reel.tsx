import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FPS } from "./theme";
import { M } from "./data";
import { Camara, Efectos, Firma, Lienzo, Subtitulos, tarjetaActiva } from "./comun";
import { ESCENAS } from "./Escenas";

// Plano (con la tarjeta del gancho) → escena gráfica activa (corte seco, la voz sigue debajo)
// → firma solo a cámara → subtítulos (arriba a cámara, abajo sobre gráficos) → efectos.
export const Reel: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const g = M.escenas.find((e) => e.t !== "tarjeta" && t >= e.start && t < e.end);
  const tj = tarjetaActiva(M, t);
  const grafico = !!g || (!!tj && tj.p < 0.5);
  const Esc = g ? ESCENAS[g.t] : null;
  return (
    <AbsoluteFill style={{ background: C.tinta }}>
      <Camara m={M} t={t} />
      {g && Esc ? (<><Lienzo /><Esc e={g} t={t} /></>) : null}
      {grafico ? null : <Firma m={M} grafico={false} />}
      <Subtitulos m={M} t={t} grafico={grafico} />
      <Efectos m={M} />
    </AbsoluteFill>
  );
};
