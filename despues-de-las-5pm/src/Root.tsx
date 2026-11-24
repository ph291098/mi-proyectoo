import React from "react";
import { Composition, Freeze, Still } from "remotion";
import { FRAMES2 } from "./ep2/contenido";
import { Episodio2 } from "./ep2/Episodio2";
import { Reel } from "./Reel";
import { ALTO, ANCHO, FPS, FRAMES } from "./tiempos";

/** Portada: el último fotograma del reel, congelado, sin audio. */
const Portada: React.FC = () => (
  <Freeze frame={FRAMES - 30}>
    <Reel voz={false} />
  </Freeze>
);

/** Portada del episodio 2: su último fotograma. */
const PortadaEp2: React.FC = () => (
  <Freeze frame={FRAMES2 - 20}>
    <Episodio2 voz={false} />
  </Freeze>
);

export const Root: React.FC = () => (
  <>
    <Composition id="ConVoz" component={Reel} durationInFrames={FRAMES} fps={FPS} width={ANCHO} height={ALTO} defaultProps={{ voz: true }} />
    <Composition id="SinVoz" component={Reel} durationInFrames={FRAMES} fps={FPS} width={ANCHO} height={ALTO} defaultProps={{ voz: false }} />
    <Still id="Portada" component={Portada} width={ANCHO} height={ALTO} />
    {/* episodio 2 · hora 2: elige una sola cosa */}
    <Composition id="Ep2ConVoz" component={Episodio2} durationInFrames={FRAMES2} fps={FPS} width={ANCHO} height={ALTO} defaultProps={{ voz: true }} />
    <Composition id="Ep2SinVoz" component={Episodio2} durationInFrames={FRAMES2} fps={FPS} width={ANCHO} height={ALTO} defaultProps={{ voz: false }} />
    <Still id="Ep2Portada" component={PortadaEp2} width={ANCHO} height={ALTO} />
  </>
);
