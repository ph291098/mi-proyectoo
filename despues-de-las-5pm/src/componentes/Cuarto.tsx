import React from "react";
import { Img, staticFile } from "remotion";
import { ALTO, ANCHO, CAM0, Camara } from "../tiempos";
import { lerp, ruido, ruidoSuave } from "../util";
import poses from "../data/poses.json";
import { Reloj } from "./Reloj";

// Tamaño del cuarto en unidades de mundo (la ilustración maestra a 1080 px de ancho).
export const MUNDO = { w: 1080, h: 1910 };
// Posiciones de las capas en el mundo.
export const POS = {
  reloj: { cx: 800, cy: 420, d: 280 },
  personaje: { x: 149, y: 765, w: 831 },
  lampara: { x: -24, y: 950, w: 369 },
  laptop: { x: 301, y: 1505, w: 480 },
  tapa: { x: 310, bisagra: 1597, w: 462, h: 249 },
  taza: { x: 852, y: 1425, w: 135 },
  celular: { x: 778, y: 1572, w: 108 },
  halo: { x: 232, y: 1078 },
  cara: { x: 581, y: 1000 },
};

/** Pasa un punto del mundo (a profundidad de pared) a coordenadas de pantalla. */
export const aPantalla = (cam: Camara, x: number, y: number) => ({ x: ANCHO / 2 + (x - cam.x) * cam.z, y: ALTO / 2 + (y - cam.y) * cam.z });

/**
 * Una capa a cierta profundidad. `p` = cuánto se desplaza respecto a la pared cuando la cámara se mueve:
 * 1 = pared; más de 1 = más cerca de cámara (parallax real entre capas).
 */
const Capa: React.FC<{ cam: Camara; p: number; children: React.ReactNode }> = ({ cam, p, children }) => {
  const tx = ANCHO / 2 - CAM0.x * cam.z + (CAM0.x - cam.x) * cam.z * p;
  const ty = ALTO / 2 - CAM0.y * cam.z + (CAM0.y - cam.y) * cam.z * p;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: MUNDO.w, height: MUNDO.h, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${cam.z})` }}>
      {children}
    </div>
  );
};

/** Parpadeo sutil de la lámpara: casi estable, con alguna caída breve. */
export const parpadeo = (t: number) => {
  const base = 0.93 + 0.07 * ruidoSuave(t * 11);
  const caida = ruidoSuave(t * 2.7 + 40) > 0.83 ? 0.82 + 0.18 * ruidoSuave(t * 31) : 1;
  return base * caida;
};

export type EstadoCuarto = {
  cam: Camara;
  t: number;
  minutos: number;      // hora del reloj
  aTics: boolean;
  tapa: number;         // 0 laptop cerrada · 1 abierta
  luz: number;          // 0..1 luz de la pantalla en la cara
  aviso: number;        // 0..1 el celular de la mesa encendido
  pose?: Pose;          // qué ilustración del personaje se ve (por defecto, la del capítulo 1)
  brillo?: number;      // 0..1 intensidad de la lámpara (1 = normal)
};

// Poses del personaje. Entre poses distintas solo se cambia con corte seco: nunca morph ni crossfade.
export type Pose = "cansado" | "mirando" | "agobiado" | "aliviado";

const fondo: React.CSSProperties = { position: "absolute", left: -16, top: -28, width: 1112, height: 1966.5 };

export const Cuarto: React.FC<EstadoCuarto> = ({ cam, t, minutos, aTics, tapa, luz, aviso, pose = "cansado", brillo = 1 }) => {
  const fl = parpadeo(t) * brillo;
  const otra = pose === "cansado" ? null : poses[pose];
  const { personaje: pj, lampara, laptop, tapa: tp, taza, celular, reloj, halo } = POS;
  const hPj = pj.w * (1796 / 1800);
  const angulo = lerp(86, 4, tapa);
  // respiración lenta y cansada: el torso sube apenas (es la misma ilustración, solo se estira un 0,7 %)
  const respira = `scaleY(${1 + 0.007 * Math.sin(t * 1.55)}) scaleX(${1 + 0.002 * Math.sin(t * 1.55)})`;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#050302" }}>
      {/* pared y ventana */}
      <Capa cam={cam} p={1}>
        <Img src={staticFile("arte/fondo.jpg")} style={fondo} />
        <div style={{ position: "absolute", left: reloj.cx - reloj.d / 2, top: reloj.cy - reloj.d / 2, filter: "drop-shadow(10px 16px 14px rgba(0,0,0,.55)) brightness(.9)" }}>
          <Reloj minutos={minutos} diametro={reloj.d} aTics={aTics} />
        </div>
        {/* resplandor de la lámpara en la pared */}
        <div style={{ position: "absolute", left: halo.x - 620, top: halo.y - 700, width: 1240, height: 1240, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,106,26,.30) 0%, rgba(255,106,26,.10) 34%, rgba(255,106,26,0) 62%)", mixBlendMode: "screen", opacity: fl }} />
      </Capa>

      {/* mesa: la misma ilustración, recortada desde el borde, un poco más cerca */}
      <Capa cam={cam} p={1.05}>
        <Img src={staticFile("arte/fondo.jpg")} style={{ ...fondo, maskImage: "linear-gradient(to bottom, transparent 75.9%, #000 76.8%)", WebkitMaskImage: "linear-gradient(to bottom, transparent 75.9%, #000 76.8%)" }} />
      </Capa>

      {/* personaje: siempre la misma ilustración */}
      <Capa cam={cam} p={1.05}>
        {otra ? (
          <Img src={staticFile(`arte/pose_${pose}.webp`)} style={{ position: "absolute", left: otra.x, top: otra.y, width: otra.w, height: otra.h, transformOrigin: "50% 100%", transform: respira }} />
        ) : (
          <Img src={staticFile("arte/personaje.webp")} style={{ position: "absolute", left: pj.x, top: pj.y, width: pj.w, height: hPj, transformOrigin: "50% 100%", transform: respira }} />
        )}
        {/* luz de la pantalla sobre cara y pecho: un velo claro recortado con la silueta del personaje */}
        {luz > 0.001 && !otra ? (
          <div
            style={{
              position: "absolute", left: pj.x, top: pj.y, width: pj.w, height: hPj, background: "#FFE9CF", mixBlendMode: "soft-light", opacity: luz, transformOrigin: "50% 100%", transform: respira,
              maskImage: `url(${staticFile("arte/personaje.webp")}), radial-gradient(ellipse 46% 62% at 52% 78%, #000 0%, rgba(0,0,0,.75) 45%, transparent 82%)`,
              WebkitMaskImage: `url(${staticFile("arte/personaje.webp")}), radial-gradient(ellipse 46% 62% at 52% 78%, #000 0%, rgba(0,0,0,.75) 45%, transparent 82%)`,
              maskSize: "100% 100%, 100% 100%", WebkitMaskSize: "100% 100%, 100% 100%", maskComposite: "intersect", WebkitMaskComposite: "source-in" as never,
            }}
          />
        ) : null}
      </Capa>

      {/* taza */}
      <Capa cam={cam} p={1.07}>
        <div style={{ position: "absolute", left: taza.x - 6, top: taza.y + taza.w * 0.93, width: taza.w * 1.1, height: 26, borderRadius: "50%", background: "rgba(0,0,0,.5)", filter: "blur(8px)" }} />
        <Img src={staticFile("arte/taza.webp")} style={{ position: "absolute", left: taza.x, top: taza.y, width: taza.w }} />
        {[0, 1, 2].map((i) => {
          const u = (t * 0.22 + i / 3) % 1;                               // cada voluta sube y se deshace
          return <div key={i} style={{ position: "absolute", left: taza.x + 26 + i * 16 + Math.sin(t * 1.1 + i * 2) * 12 * u, top: taza.y - 20 - u * 150, width: 30 + u * 34, height: 80 + u * 40, borderRadius: "50%", background: "rgba(255,225,195,.5)", filter: "blur(13px)", opacity: Math.sin(u * Math.PI) * 0.34 }} />;
        })}
      </Capa>

      {/* laptop: base + tapa con bisagra (la tapa gira de verdad en 3D) */}
      <Capa cam={cam} p={1.08}>
        <div style={{ position: "absolute", left: laptop.x + 14, top: laptop.y + 106, width: laptop.w - 28, height: 30, borderRadius: "50%", background: "rgba(0,0,0,.6)", filter: "blur(10px)" }} />
        <Img src={staticFile("arte/laptop_cerrada.webp")} style={{ position: "absolute", left: laptop.x, top: laptop.y, width: laptop.w }} />
        {tapa > 0.001 ? (
          <>
            {/* luz que escapa por encima de la tapa */}
            <div style={{ position: "absolute", left: tp.x - 150, top: tp.bisagra - tp.h - 330, width: tp.w + 300, height: 520, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,233,207,.55) 0%, rgba(255,233,207,0) 62%)", mixBlendMode: "screen", opacity: luz * 0.8 }} />
            <div style={{ position: "absolute", left: tp.x, top: tp.bisagra - tp.h, width: tp.w, height: tp.h, perspective: 1100, perspectiveOrigin: "50% 100%" }}>
              <div style={{ width: "100%", height: "100%", transformOrigin: "50% 100%", transform: `rotateX(${angulo}deg)` }}>
                <Img src={staticFile("arte/tapa.jpg")} style={{ width: "100%", height: "100%", borderRadius: 13, filter: `brightness(${lerp(1.25, 0.86, tapa)})`, boxShadow: `0 -2px 0 rgba(255,233,207,${0.55 * luz})` }} />
              </div>
            </div>
          </>
        ) : null}
      </Capa>

      {/* celular sobre la mesa */}
      <Capa cam={cam} p={1.09}>
        <Img src={staticFile("arte/celular.webp")} style={{ position: "absolute", left: celular.x, top: celular.y, width: celular.w }} />
        {aviso > 0.001 ? (
          <div style={{ position: "absolute", left: celular.x - 70, top: celular.y - 80, width: celular.w + 140, height: 230, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,240,220,.9) 0%, rgba(255,160,90,.35) 30%, rgba(255,106,26,0) 66%)", mixBlendMode: "screen", opacity: aviso }} />
        ) : null}
      </Capa>

      {/* lámpara de latón con su halo */}
      <Capa cam={cam} p={1.1}>
        <Img src={staticFile("arte/lampara.webp")} style={{ position: "absolute", left: lampara.x, top: lampara.y, width: lampara.w, filter: `brightness(${0.9 + 0.12 * fl})` }} />
        {Array.from({ length: 16 }, (_, i) => {
          const u = (t * (0.035 + 0.03 * ruido(i * 2.3)) + ruido(i * 9.1)) % 1;
          const x = halo.x - 170 + ruido(i * 4.7) * 560 + Math.sin(t * 0.6 + i) * 22;
          const y = halo.y + 330 - u * 620;
          const r = 2.2 + ruido(i * 6.1) * 3.4;
          return <div key={i} style={{ position: "absolute", left: x, top: y, width: r, height: r, borderRadius: "50%", background: "#FFD9B0", filter: "blur(1px)", opacity: Math.sin(u * Math.PI) * (0.25 + 0.5 * ruido(i * 3.3)) * fl }} />;
        })}
        <div style={{ position: "absolute", left: halo.x - 230, top: halo.y - 190, width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,190,120,.75) 0%, rgba(255,106,26,.32) 26%, rgba(255,106,26,0) 64%)", mixBlendMode: "screen", opacity: fl }} />
      </Capa>
    </div>
  );
};
