import React from "react";
import { Img, staticFile } from "remotion";
import { C } from "../fuentes";
import { eo, prog } from "../util";

/**
 * Reloj de pared: la esfera es la capa pintada (sin manecillas) y las manecillas se dibujan encima.
 * `minutos` = minutos desde las 0:00 con decimales. `aTics`: el segundero salta de segundo en segundo.
 */
export const Reloj: React.FC<{ minutos: number; diametro: number; aTics?: boolean }> = ({ minutos, diametro, aTics = false }) => {
  const seg = minutos * 60;
  const segVisto = aTics ? Math.floor(seg) + eo(prog(seg - Math.floor(seg), 0, 0.16)) : seg;
  const angHora = ((minutos / 60) % 12) * 30;
  const angMin = (minutos % 60) * 6;
  const angSeg = (segVisto % 60) * 6;
  const mano = (ang: number, largo: number, ancho: number, cola: number, color: string) => (
    <g transform={`rotate(${ang})`}>
      <path d={`M ${-ancho / 2} ${cola} L ${-ancho * 0.28} ${-largo} L ${ancho * 0.28} ${-largo} L ${ancho / 2} ${cola} Z`} fill={color} />
    </g>
  );
  return (
    <div style={{ position: "relative", width: diametro, height: diametro * (1010 / 999) }}>
      <Img src={staticFile("arte/reloj.webp")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <svg viewBox="-100 -100 200 200" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
        <g transform="translate(1.6 2.4)" opacity={0.35}>
          {mano(angHora, 44, 9, 9, "#000")}
          {mano(angMin, 66, 6.5, 11, "#000")}
        </g>
        {mano(angHora, 44, 9, 9, "#1d140d")}
        {mano(angMin, 66, 6.5, 11, "#1d140d")}
        {mano(angSeg, 72, 2.2, 18, C.naranja)}
        <circle r={4.6} fill="#8a6a34" />
        <circle r={1.8} fill="#1d140d" />
      </svg>
    </div>
  );
};
