import { Composition } from "remotion";
import { Reel } from "./Reel";
import { M } from "./data";
import "./fonts";

// Vertical 1080x1920 a 30 fps. La duración sale del montaje (silencios ya cortados).
export const Root: React.FC = () => (
  <Composition id="Reel" component={Reel} width={1080} height={1920} fps={30} durationInFrames={M.durationInFrames} />
);
