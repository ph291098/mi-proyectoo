import React from "react";
import { Composition, Freeze, Still } from "remotion";
import { Reel } from "./Reel";
import { ALTO, ANCHO, FPS, FRAMES } from "./tiempos";

/** Portada: el último fotograma del reel, congelado, sin audio. */
const Portada: React.FC = () => (
  <Freeze frame={FRAMES - 30}>
    <Reel voz={false} />
  </Freeze>
);

export const Root: React.FC = () => (
  <>
    <Composition id="ConVoz" component={Reel} durationInFrames={FRAMES} fps={FPS} width={ANCHO} height={ALTO} defaultProps={{ voz: true }} />
    <Composition id="SinVoz" component={Reel} durationInFrames={FRAMES} fps={FPS} width={ANCHO} height={ALTO} defaultProps={{ voz: false }} />
    <Still id="Portada" component={Portada} width={ANCHO} height={ALTO} />
  </>
);
