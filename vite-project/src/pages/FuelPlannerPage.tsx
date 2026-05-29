/**
 * Fuel Planner Page
 * Thin wrapper that renders the Fuel Planner, pre-filled from the athlete's
 * goal race when the "fuel" integration is enabled.
 */

import { FuelPlannerV2 } from "@/features/fuel";
import { useAuth } from "@/features/auth/AuthContext";
import { useTrainingGoals, goalToFuelInputs } from "@/features/goals";

export default function FuelPlannerPage() {
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
    goals && goals.enabledIntegrations.includes("fuel")
      ? goalToFuelInputs(goals.goalRace)
      : undefined;

  return <FuelPlannerV2 initialInputs={initialInputs} />;
}
