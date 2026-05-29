/**
 * Training Pace Calculator Page
 * Thin page wrapper that renders the pace calculator feature, pre-filled from
 * the athlete's saved goal profile when the "pace" integration is enabled.
 */

import { PaceCalculatorV2 } from "@/features/pace-calculator";
import { useAuth } from "@/features/auth/AuthContext";
import { useTrainingGoals, goalToPaceInputs } from "@/features/goals";

const TrainingPaceCalculator = () => {
  const { user } = useAuth();
  const { goals, loading } = useTrainingGoals(user?.uid);

  // Wait for the profile before mounting (prefill is applied on mount only).
  if (user && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  const initialInputs =
    goals && goals.enabledIntegrations.includes("pace")
      ? goalToPaceInputs(goals.recentRace, goals.paceUnit)
      : undefined;

  return <PaceCalculatorV2 initialInputs={initialInputs} />;
};

export default TrainingPaceCalculator;
