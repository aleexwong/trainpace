/**
 * Pace Plan Persistence Hook
 * Thin wrapper around usePlanPersistence with pace-specific configuration.
 */

import { usePlanPersistence } from "@/hooks/usePlanPersistence";
import type { PaceInputs, PaceResults } from "../types";

interface SavePlanParams {
  inputs: PaceInputs;
  results: PaceResults;
  planName?: string;
  notes?: string;
  raceDate?: string;
}

export function usePacePlanPersistence() {
  return usePlanPersistence<SavePlanParams>({
    collectionName: "user_pace_plans",
    sessionStorageKey: "pending_pace_plan",
    returnToPath: "/pace-calculator",
    gaCategory: "Pace Calculator",
    successDescription: "Your pace plan is now in your dashboard.",
    buildGaLabel: (params) =>
      `${params.inputs.distance}${params.inputs.units}`,
    buildSessionData: (params) => ({
      inputs: params.inputs,
      results: params.results,
      planName: params.planName,
      notes: params.notes,
      raceDate: params.raceDate,
    }),
    buildFirestoreDoc: (params) => {
      const { inputs, results } = params;
      const hours = inputs.hours ? parseInt(inputs.hours, 10) : 0;
      const minutes = inputs.minutes ? parseInt(inputs.minutes, 10) : 0;
      const seconds = inputs.seconds ? parseInt(inputs.seconds, 10) : 0;
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;

      return {
        distance: parseFloat(inputs.distance),
        units: inputs.units,
        hours,
        minutes,
        seconds,
        totalSeconds,
        paceType: inputs.paceType,
        planName: params.planName || null,
        notes: params.notes || null,
        raceDate: params.raceDate || null,
        paces: {
          race: results.race,
          easy: results.easy,
          tempo: results.tempo,
          interval: results.interval,
          maximum: results.maximum,
          speed: results.speed,
          xlong: results.xlong,
          yasso: results.yasso,
        },
      };
    },
  });
}
