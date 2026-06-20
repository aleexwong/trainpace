/**
 * Fuel Planner Page
 * Thin wrapper that renders the Fuel Planner, pre-filled from the athlete's
 * goal race when the "fuel" integration is enabled.
 */

import { useSearchParams } from "react-router-dom";
import { FuelPlannerV2 } from "@/features/fuel";
import type { FuelPlanInputs, RaceType } from "@/features/fuel/types";
import { useAuth } from "@/features/auth/AuthContext";
import { useTrainingGoals, goalToFuelInputs } from "@/features/goals";

export default function FuelPlannerPage() {
  const { user } = useAuth();
  const { goals, loading } = useTrainingGoals(user?.uid);
  const [searchParams] = useSearchParams();

  if (user && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  // URL params from Race Simulator override goal-based prefill
  const simRaceType = searchParams.get("raceType") as RaceType | null;
  const simHours = searchParams.get("hours");
  const simMinutes = searchParams.get("minutes");

  let initialInputs: Partial<FuelPlanInputs> | undefined;
  if (simRaceType && simHours !== null && simMinutes !== null) {
    initialInputs = { raceType: simRaceType, timeHours: simHours, timeMinutes: simMinutes };
  } else if (goals?.enabledIntegrations?.includes("fuel")) {
    initialInputs = goalToFuelInputs(goals.goalRace);
  }

  return <FuelPlannerV2 initialInputs={initialInputs} />;
}
