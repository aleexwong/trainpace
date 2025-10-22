/**
 * Race Plan Generation Hook
 *
 * Auto-generates complete race plans from user inputs
 */

import { useState } from "react";
import type { RacePlan, RacePlanInputs, RouteMetadata } from "../types";
import {
  calculatePaceStrategy,
  parseTimeToMinutes,
} from "../utils/paceCalculations";
import { calculateFuelPlan } from "../utils/fuelSchedule";
import { useRacePlans } from "./useRacePlans";

/**
 * Clean route metadata to remove undefined values
 * Firestore doesn't accept undefined - must omit fields or use null
 */
function cleanRouteMetadata(metadata: RouteMetadata): RouteMetadata {
  const cleaned: RouteMetadata = {
    name: metadata.name,
    distance: metadata.distance,
    elevationGain: metadata.elevationGain,
    hasElevationData: metadata.hasElevationData,
  };

  // Only add optional fields if they have actual values
  if (metadata.city) cleaned.city = metadata.city;
  if (metadata.country) cleaned.country = metadata.country;

  return cleaned;
}

export function useRacePlanGeneration() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createRacePlan } = useRacePlans();

  /**
   * Generate a complete race plan from inputs
   */
  const generateRacePlan = async (
    inputs: RacePlanInputs,
    routeData: {
      routeId: string | null;
      routeMetadata: {
        name: string;
        distance: number;
        elevationGain: number;
        city?: string;
        country?: string;
        hasElevationData: boolean;
      };
    }
  ): Promise<string | null> => {
    try {
      setGenerating(true);
      setError(null);

      // Parse target time
      const targetTime = parseTimeToMinutes(
        Number(inputs.targetTimeHours),
        Number(inputs.targetTimeMinutes),
        Number(inputs.targetTimeSeconds)
      );

      if (targetTime <= 0) {
        throw new Error("Please enter a valid target time");
      }

      // Calculate pace strategy
      const paceStrategy = calculatePaceStrategy({
        distance: routeData.routeMetadata.distance,
        targetTime,
      });

      // Calculate fuel plan
      const fuelPlan = calculateFuelPlan({
        distance: routeData.routeMetadata.distance,
        targetTime,
        raceType: inputs.raceType,
      });

      // Create the race plan - build object conditionally to avoid undefined values
      const racePlan: Omit<
        RacePlan,
        "id" | "userId" | "createdAt" | "updatedAt"
      > = {
        name: inputs.name,
        date: inputs.date,
        raceType: inputs.raceType,
        routeSource: inputs.routeSource,
        routeId: routeData.routeId,
        routeMetadata: cleanRouteMetadata(routeData.routeMetadata),
        targetTime,
        paceStrategy,
        fuelPlan,
        status: "draft",
        // Only include optional fields if they have actual values
        ...(inputs.notes && inputs.notes.trim()
          ? { notes: inputs.notes.trim() }
          : {}),
        ...(inputs.goal ? { goal: inputs.goal } : {}),
      };

      // Save to Firestore
      const planId = await createRacePlan(racePlan);

      return planId;
    } catch (err) {
      console.error("Error generating race plan:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate race plan"
      );
      return null;
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Validate inputs before generation
   */
  const validateInputs = (inputs: RacePlanInputs): string | null => {
    if (!inputs.name.trim()) {
      return "Please enter a race name";
    }

    if (!inputs.routeId && inputs.routeSource !== "manual") {
      return "Please select a route";
    }

    const targetTime = parseTimeToMinutes(
      Number(inputs.targetTimeHours),
      Number(inputs.targetTimeMinutes),
      Number(inputs.targetTimeSeconds)
    );

    if (targetTime <= 0) {
      return "Please enter a valid target time";
    }

    return null;
  };

  return {
    generateRacePlan,
    validateInputs,
    generating,
    error,
  };
}
