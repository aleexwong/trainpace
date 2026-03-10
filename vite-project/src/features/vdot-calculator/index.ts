export { VdotCalculator } from "./components/VdotCalculator";
export type {
  VdotResult,
  VdotInputs,
  TrainingZone,
  RacePrediction,
  PaceDisplayUnit,
} from "./types";
export {
  calculateVdot,
  predictRaceTime,
  calculateTrainingZones,
  formatTime,
  formatPace,
} from "./vdot-math";
