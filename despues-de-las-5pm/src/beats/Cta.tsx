import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { SOMBRA } from "../componentes/Captions";
import { parpadeo } from "../componentes/Cuarto";
import { CaraPortada, LIBRO } from "../componentes/PortadaEbook";
import { HANDLE } from "../contenido";
import { C, SANS } from "../fuentes";
import { T } from "../tiempos";
import { golpe, lerp, prog, resorte } from "../util";

/** Beat 5: la portada del ebook en 3D ligero con barrido de luz, «el método en 5 pasos.» y «link en la bio». */
export const Cta: React.FC<{ t: number }> = ({ t }) => {
  const entra = resorte(t, T.cta + 0.05, 9, 0.62);
  const giro = lerp(-46, -17, Math.min(1, entra)) + Math.sin(t * 0.9) * 2.2;
  const barrido = prog(t, 26.3, 27.15);
  const link = resorte(t, 29.8, 18, 0.45);
  const fl = parpadeo(t);
  const zoom = 1 + 0.03 * prog(t, T.cta, 32) + golpe(t, T.final, 0.05, 5);
  return (
    <AbsoluteFill style={{ background: "#060403" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "50% 40%" }}>
        {/* luz cálida de la lámpara detrás del libro */}
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 42% at 46% 37%, rgba(255,106,26,.34) 0%, rgba(255,106,26,.09) 48%, rgba(255,106,26,0) 76%)", opacity: (0.75 + 0.25 * Math.min(1, entra)) * fl + golpe(t, T.final, 0.5, 3) }} />
        <Img src={staticFile("arte/lampara.webp")} style={{ position: "absolute", left: -70, top: 1130, width: 400, filter: `brightness(${0.8 + 0.1 * fl})`, opacity: Math.min(1, entra * 1.5) }} />
        <div style={{ position: "absolute", left: -10, top: 1140, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,190,120,.55) 0%, rgba(255,106,26,.22) 30%, rgba(255,106,26,0) 64%)", mixBlendMode: "screen", opacity: fl * Math.min(1, entra) }} />

        {/* libro */}
        <div style={{ position: "absolute", left: 540 - LIBRO.w / 2 + 14, top: 300, width: LIBRO.w, height: LIBRO.h, perspective: 2000, transform: `translateY(${(1 - Math.min(1, entra)) * 140 + Math.sin(t * 1.3) * 6}px) scale(${0.72 + 0.28 * entra})`, opacity: Math.min(1, prog(t, T.cta, T.cta + 0.2)) }}>
          <div style={{ position: "absolute", left: 30, top: LIBRO.h - 10, width: LIBRO.w, height: 70, borderRadius: "50%", background: "rgba(0,0,0,.75)", filter: "blur(22px)" }} />
          <div style={{ width: "100%", height: "100%", transformStyle: "preserve-3d", transform: `rotateY(${giro}deg) rotateX(3deg)` }}>
            {/* lomo */}
            <div style={{ position: "absolute", left: 0, top: 0, width: LIBRO.lomo, height: LIBRO.h, background: "linear-gradient(90deg, #1b120a 0%, #0c0805 100%)", borderRight: `1px solid rgba(201,161,90,.35)`, transformOrigin: "0 50%", transform: `rotateY(-90deg)` }} />
            {/* cara */}
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", boxShadow: "inset 6px 0 14px rgba(0,0,0,.55), 0 0 0 1px rgba(201,161,90,.25)" }}>
              <CaraPortada />
              {/* barrido de luz */}
              <div style={{ position: "absolute", top: -60, bottom: -60, left: `${lerp(-70, 130, barrido)}%`, width: "46%", background: "linear-gradient(100deg, rgba(255,240,215,0) 0%, rgba(255,240,215,.55) 50%, rgba(255,240,215,0) 100%)", mixBlendMode: "screen", transform: "skewX(-14deg)", opacity: barrido > 0 && barrido < 1 ? 1 : 0 }} />
            </div>
          </div>
        </div>

        {/* «link en la bio» */}
        <div style={{ position: "absolute", left: 90, width: 860, top: 1388, display: "flex", justifyContent: "center", opacity: Math.min(1, link * 3), transform: `scale(${0.6 + 0.4 * link + golpe(t, T.final, 0.08, 6)})` }}>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 56, letterSpacing: "-0.03em", color: "#140a03", background: C.naranja, padding: "16px 44px 20px", borderRadius: 999, boxShadow: "0 14px 50px rgba(255,106,26,.45)" }}>link en la bio</div>
        </div>
        <div style={{ position: "absolute", left: 90, width: 860, top: 1492, textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: "0.06em", color: C.crema, opacity: 0.85 * prog(t, 30.1, 30.5), textShadow: SOMBRA }}>{HANDLE}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
