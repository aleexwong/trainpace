/**
 * Fuel Planner Page
 * Thin wrapper that renders the Fuel Planner, pre-filled from the athlete's
 * goal race when the "fuel" integration is enabled, or from the Race
 * Simulator's "Plan your fueling" link (?raceType=&hours=&minutes=).
 */

import { useSearchParams } from "react-router-dom";
import { FuelPlannerV2 } from "@/features/fuel";
import { RACE_SETTINGS, type RaceType } from "@/features/fuel/types";
import { useAuth } from "@/features/auth/AuthContext";
import { useTrainingGoals, goalToFuelInputs } from "@/features/goals";

export default function FuelPlannerPage() {
  const { user } = useAuth();
  const { goals, loading } = useTrainingGoals(user?.uid);
  const [searchParams] = useSearchParams();

  // Wait for the profile before mounting (prefill is applied on mount only).
  if (user && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  // A link from the Race Simulator wins over the goal-race prefill.
  const fromLink = fuelInputsFromParams(searchParams);
  const initialInputs =
    fromLink ??
    (goals?.enabledIntegrations?.includes("fuel")
      ? goalToFuelInputs(goals.goalRace)
      : undefined);

  return <FuelPlannerV2 initialInputs={initialInputs} />;
}

function fuelInputsFromParams(params: URLSearchParams) {
  const raceType = params.get("raceType");
  const hours = params.get("hours");
  const minutes = params.get("minutes");
  if (!raceType || !(raceType in RACE_SETTINGS)) return undefined;
  if (!hours || !minutes || !/^\d{1,2}$/.test(hours) || !/^\d{1,2}$/.test(minutes)) {
    return undefined;
  }
  return {
    raceType: raceType as RaceType,
    timeHours: hours,
    timeMinutes: minutes,
  };
}
