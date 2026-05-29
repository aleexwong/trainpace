/**
 * Training Goals - Core Types & Constants
 *
 * A single source of truth captured at onboarding: the athlete's recent race
 * (current fitness) and goal race (their target). Both are stored in canonical
 * units (meters + total seconds) so every tool can derive what it needs.
 */

import type { PaceUnit } from "@/features/pace-calculator/types";

/** Tools a saved goal can fan out into. */
export type GoalIntegration = "pace" | "vdot" | "fuel" | "dashboard";

/** All integrations, enabled by default during onboarding. */
export const ALL_INTEGRATIONS: GoalIntegration[] = [
  "pace",
  "vdot",
  "fuel",
  "dashboard",
];

/** Human-friendly labels for the integration toggles. */
export const INTEGRATION_LABELS: Record<
  GoalIntegration,
  { label: string; description: string }
> = {
  pace: {
    label: "Pace Calculator",
    description: "Pre-fill training zones from your recent race.",
  },
  vdot: {
    label: "VDOT Calculator",
    description: "Pre-fill VDOT and predicted race-time equivalents.",
  },
  fuel: {
    label: "Fuel Planner",
    description: "Pre-select your goal race type and finish time.",
  },
  dashboard: {
    label: "Dashboard",
    description: "Show your goal as a hub on the dashboard.",
  },
};

/** A single race performance, stored in canonical units. */
export interface RaceEntry {
  distanceName: string; // e.g. "Half Marathon"
  distanceMeters: number; // canonical unit (matches vdot-math)
  totalSeconds: number;
}

/** The athlete's saved goal profile (Firestore doc id === userId). */
export interface RaceGoalProfile {
  userId: string;
  recentRace: RaceEntry;
  goalRace: RaceEntry;
  paceUnit: PaceUnit; // "km" | "Miles" – display preference reused across tools
  enabledIntegrations: GoalIntegration[];
  onboardingCompleted: boolean;
  createdAt?: unknown; // Firestore Timestamp
  updatedAt?: unknown; // Firestore Timestamp
}

/** Payload shape for saving (everything except the derived userId). */
export type RaceGoalProfileInput = Omit<
  RaceGoalProfile,
  "userId" | "createdAt" | "updatedAt"
>;
