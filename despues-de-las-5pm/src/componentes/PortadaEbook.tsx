import React from "react";
import { Img, staticFile } from "remotion";
import { EBOOK } from "../contenido";
import { C, SANS, SERIF } from "../fuentes";
import { Reloj } from "./Reloj";

export const LIBRO = { w: 540, h: 780, lomo: 46 };

/** Cara de la portada. Si hay portada real (EBOOK.portadaReal) se usa esa imagen; si no, esta tipográfica. */
export const CaraPortada: React.FC = () => {
  if (EBOOK.portadaReal) {
    return <Img src={staticFile(EBOOK.portadaReal)} style={{ width: LIBRO.w, height: LIBRO.h, objectFit: "cover", display: "block" }} />;
  }
  return (
    <div style={{ width: LIBRO.w, height: LIBRO.h, position: "relative", overflow: "hidden", background: "#0a0705" }}>
      {/* textura pictórica de la pared de la ilustración */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("arte/fondo.jpg")})`, backgroundSize: "330%", backgroundPosition: "78% 22%", opacity: 0.85 }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 90% 55% at 50% 108%, rgba(255,106,26,.62) 0%, rgba(255,106,26,.14) 45%, rgba(255,106,26,0) 72%)" }} />
      <div style={{ position: "absolute", inset: 18, border: `1.5px solid rgba(201,161,90,.55)` }} />
      <div style={{ position: "absolute", left: (LIBRO.w - 210) / 2, top: 64, filter: "drop-shadow(6px 10px 10px rgba(0,0,0,.6))" }}>
        <Reloj minutos={17 * 60} diametro={210} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 318, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 92, lineHeight: 0.98, color: C.crema, letterSpacing: "-0.01em" }}>
        {EBOOK.titulo.map((l) => (
          <div key={l}>{l}</div>
        ))}
        <div style={{ color: C.naranja, fontWeight: 900, fontSize: 118 }}>{EBOOK.tituloAcento}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 646, display: "flex", justifyContent: "center" }}>
        <div style={{ width: 54, height: 3, background: C.laton }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 668, textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 21, letterSpacing: "0.22em", color: C.crema }}>{EBOOK.subtitulo}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 718, textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 17, letterSpacing: "0.26em", color: C.laton }}>{EBOOK.autor}</div>
    </div>
  );
};
