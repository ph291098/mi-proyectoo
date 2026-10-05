import React from "react";
import { AbsoluteFill } from "remotion";
import { type Caption } from "@remotion/captions";
import { Background } from "./Background";
import { StageWindow, type Span } from "./StageWindow";
import { Card, type CardData } from "./Card";
import { Captions } from "./Captions";
import { Kicker, Handle } from "./Chrome";
import { CAPTION_CY, COLORS } from "./theme";

export type ReelData = {
  src: string; voice: string; kicker: string; handle: string;
  spans: Span[]; cards: CardData[]; captions: Caption[]; seams: number[];
};

export const Reel: React.FC<{ data: ReelData }> = ({ data }) => {
  // Una sola cosa que leer a la vez: mientras una tarjeta está en pantalla los
  // subtítulos callan. Se saca de las propias tarjetas, no se configura aparte;
  // la rampa del cruce la pone `presence()` DENTRO del tramo, así que los dos se
  // cruzan en vez de dejar un hueco vacío entre medias.
  const hide = React.useMemo<Array<[number, number]>>(
    () => data.cards.map((c) => [c.start * 1000, c.end * 1000]),
    [data.cards],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <Background src={data.src} />
      <StageWindow src={data.src} spans={data.spans} seams={data.seams} />
      {data.cards.map((c, i) => <Card key={i} card={c} />)}
      <Kicker text={data.kicker} />
      <Captions captions={data.captions} cy={CAPTION_CY} band maxWords={3} size={76} hide={hide} />
      <Handle text={data.handle} />
    </AbsoluteFill>
  );
};
