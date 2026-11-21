export { ConditionsCalculator } from "./components/ConditionsCalculator";
export { useConditionsCalculator } from "./hooks/useConditionsCalculator";
export {
  calculateConditions,
  calculateAdjustedZones,
  temperatureSensitivity,
  heatStressSum,
  heatRiskBand,
  dewPointC,
  altitudeVo2Fraction,
  baseHeatSlowdown,
  durationHeatFactor,
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  metersToFeet,
  feetToMeters,
} from "./conditions-math";
export type { SensitivityPoint } from "./conditions-math";
export type {
  ConditionsInput,
  ConditionsResult,
  ConditionsFormState,
  AdjustedZone,
  HeatRiskBand,
  TempUnit,
  AltitudeUnit,
  PaceUnit,
} from "./types";
export { CONDITION_DISTANCES, CONDITION_PRESETS } from "./types";
