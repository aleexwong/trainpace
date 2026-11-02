import { Composition } from "remotion";
import { Promo, DURATION } from "./Promo";

export const Root = () => (
  <Composition id="Promo" component={Promo} durationInFrames={DURATION} fps={30} width={1920} height={1080} />
);
