import { Composition } from "remotion";
import { TrainPace, DURATION } from "./TrainPace";

export const Root = () => (
  <Composition
    id="TrainPace"
    component={TrainPace}
    durationInFrames={DURATION}
    fps={30}
    width={1920}
    height={1080}
  />
);
