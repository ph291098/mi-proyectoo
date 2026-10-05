import React from "react";
import { Composition, staticFile } from "remotion";
import { getVideoMetadata } from "@remotion/media-utils";
import { Reel, type ReelData } from "./Reel";
import { FPS, WIDTH, HEIGHT } from "./theme";
import { CUTS } from "./cuts";

export const RemotionRoot: React.FC = () => (
  <>
    {CUTS.map(({ id, data }) => (
      <Composition
        key={id}
        id={id}
        component={Reel}
        durationInFrames={1}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ data }}
        calculateMetadata={async ({ props }: { props: { data: ReelData } }) => {
          // la duración sale del propio clip, no de un número escrito a mano
          const m = await getVideoMetadata(staticFile(props.data.src));
          return { durationInFrames: Math.floor(m.durationInSeconds * FPS) };
        }}
      />
    ))}
  </>
);
