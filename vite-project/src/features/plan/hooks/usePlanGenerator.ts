import { useState, useCallback } from "react";
import { generateTrainingPlan, weeksUntilRace } from "../plan-math";
import type { PlanGeneratorInputs, TrainingPlan } from "../types";
import {
  loadDraftPlan,
  saveDraftPlan,
  clearDraftPlan,
  saveDraftInputs,
  clearPendingSave,
} from "../utils/planPersistence";

export function usePlanGenerator() {
  const [plan, setPlan] = useState<TrainingPlan | null>(() => loadDraftPlan());
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback((inputs: PlanGeneratorInputs) => {
    setError(null);

    if (!inputs.raceDate) {
      setError("Please select a race date.");
      return;
    }

    const weeks = weeksUntilRace(inputs.raceDate);
    if (weeks < 4) {
      setError("Race date must be at least 4 weeks away to generate a plan.");
      return;
    }

    if (inputs.availableDays.length < 2) {
      setError("Select at least 2 training days per week.");
      return;
    }

    try {
      const generated = generateTrainingPlan(inputs);
      setPlan(generated);
      saveDraftPlan(generated);
      saveDraftInputs(inputs);
    } catch (_e) {
      setError("Failed to generate plan. Please check your inputs.");
    }
  }, []);

  const reset = useCallback(() => {
    setPlan(null);
    setError(null);
    // Keep the persisted inputs so the form stays prefilled; only the
    // generated plan (and any stale sign-in handoff) is discarded.
    clearDraftPlan();
    clearPendingSave();
  }, []);

  return { plan, error, generate, reset };
}
