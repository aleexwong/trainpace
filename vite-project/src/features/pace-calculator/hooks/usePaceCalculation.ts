/**
 * Pace Calculation Hook
 * Handles the business logic for calculating training paces
 */

import { useMemo } from "react";
import type { PaceResults, PaceInputs } from "../types";
import {
  timeToSeconds,
  calculateTrainingPaces,
  validatePaceInputs,
} from "../utils";

interface UsePaceCalculationReturn {
  result: PaceResults | null;
  errors: Record<string, string>;
  isValid: boolean;
}

export function usePaceCalculation(
  inputs: PaceInputs
): UsePaceCalculationReturn {
  return useMemo(() => {
    const { distance, units, hours, minutes, seconds, paceType, age, temperature } = inputs;

    // Validate inputs
    const validation = validatePaceInputs(distance, hours, minutes, seconds);
    if (!validation.isValid) {
      return {
        result: null,
        errors: validation.errors,
        isValid: false,
      };
    }

    // Calculate paces
    const totalSeconds = timeToSeconds(hours, minutes, seconds);
    const distanceNum = parseFloat(distance);

    // Prepare optional parameters
    const options: {
      age?: number;
      temperature?: number;
    } = {};

    if (age && parseInt(age) > 0) {
      options.age = parseInt(age);
    }

    if (temperature && parseFloat(temperature) > 0) {
      options.temperature = parseFloat(temperature);
    }

    const result = calculateTrainingPaces(
      totalSeconds,
      distanceNum,
      units,
      paceType,
      options
    );

    return {
      result,
      errors: {},
      isValid: true,
    };
  }, [inputs]);
}
