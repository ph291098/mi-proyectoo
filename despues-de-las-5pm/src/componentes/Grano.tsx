import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { ruido } from "../util";

/** Grano fino de película + viñeta. Cambia de textura y de posición en cada fotograma. */
export const Grano: React.FC<{ fuerza?: number }> = ({ fuerza = 0.2 }) => {
  const f = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 62% at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)" }} />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile(`arte/grano${f % 6}.png`)})`,
          backgroundSize: "512px 512px",
          backgroundPosition: `${Math.round(ruido(f) * 512)}px ${Math.round(ruido(f + 9.3) * 512)}px`,
          mixBlendMode: "overlay",
          opacity: fuerza,
        }}
      />
    </>
  );
};

/** Carga por adelantado lo que se usa como fondo o máscara CSS (Remotion solo espera a los <Img>). */
export const Precarga: React.FC = () => (
  <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>
    {["grano0.png", "grano1.png", "grano2.png", "grano3.png", "grano4.png", "grano5.png", "mano_pantalla.png", "maestra.jpg", "fondo.jpg", "personaje.webp"].map((a) => (
      <Img key={a} src={staticFile(`arte/${a}`)} />
    ))}
  </div>
);
