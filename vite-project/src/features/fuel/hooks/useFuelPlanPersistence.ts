/**
 * Fuel Plan Persistence Hook
 * Thin wrapper around usePlanPersistence with fuel-specific configuration.
 */

import { usePlanPersistence } from "@/hooks/usePlanPersistence";
import type { RaceType, FuelPlanResult, AIRecommendation } from "../types";

interface SavePlanParams {
  raceType: RaceType;
  weight: string;
  timeHours: string;
  timeMinutes: string;
  finishTimeMin: number;
  result: FuelPlanResult;
  userContext: string;
  selectedPresets: string[];
  recommendations: AIRecommendation[];
}

export function useFuelPlanPersistence() {
  return usePlanPersistence<SavePlanParams>({
    collectionName: "user_fuel_plans",
    sessionStorageKey: "pending_fuel_plan",
    returnToPath: "/fuel",
    gaCategory: "Fuel Planner",
    successDescription: "Your fuel plan is now in your dashboard.",
    buildGaLabel: (params) => params.raceType,
    buildSessionData: (params) => ({
      raceType: params.raceType,
      weight: params.weight,
      timeHours: params.timeHours,
      timeMinutes: params.timeMinutes,
      result: params.result,
      aiAdvice: params.recommendations,
      userContext: params.userContext,
      selectedPresets: params.selectedPresets,
    }),
    buildFirestoreDoc: (params) => ({
      raceType: params.raceType,
      weight: params.weight ? parseFloat(params.weight) : null,
      finishTime: params.finishTimeMin,
      carbsPerHour: params.result.carbsPerHour,
      totalCarbs: params.result.totalCarbs,
      totalCalories: params.result.totalCalories,
      gelsNeeded: params.result.gelsNeeded,
      userContext: params.userContext || null,
      selectedPresets: params.selectedPresets,
      aiRecommendations:
        params.recommendations.length > 0 ? params.recommendations : null,
    }),
  });
}
