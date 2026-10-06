import { Composition } from "remotion";
import { Reel } from "./Reel";
import { PromptReel } from "./Prompt";
import { M, P } from "./data";
import "./fonts";

// Vertical 1080x1920 a 30 fps. La duración sale de cada montaje (silencios ya cortados).
export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} width={1080} height={1920} fps={30} durationInFrames={M.durationInFrames} />
    <Composition id="Prompt" component={PromptReel} width={1080} height={1920} fps={30} durationInFrames={P.durationInFrames} />
  </>
);
