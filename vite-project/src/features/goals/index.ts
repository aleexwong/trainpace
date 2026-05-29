/**
 * Training Goals Feature - Public Exports
 */

export { OnboardingFlow } from "./components/OnboardingFlow";
export { GoalsSettingsCard } from "./components/GoalsSettingsCard";
export { GoalGreeting } from "./components/GoalGreeting";
export { useTrainingGoals } from "./hooks/useTrainingGoals";
export {
  goalToPaceInputs,
  goalToVdotInputs,
  goalToFuelInputs,
  mapDistanceToFuelType,
  formatRaceLabel,
  secondsToFields,
} from "./utils";
export {
  ALL_INTEGRATIONS,
  INTEGRATION_LABELS,
} from "./types";
export type {
  GoalIntegration,
  RaceEntry,
  RaceGoalProfile,
  RaceGoalProfileInput,
} from "./types";
