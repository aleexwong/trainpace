/**
 * Training Plan Generator — localStorage Persistence
 *
 * Guest users lose an in-memory plan on refresh. This module persists the
 * generated plan, the form inputs used to generate it, and a "pending save"
 * flag (set when a guest clicks the sign-in banner so we can auto-save once
 * they return authenticated) to localStorage.
 *
 * Naming follows the existing convention in
 * features/vdot-calculator/hooks/useVdotCalculator.ts (`trainpace_<feature>_<name>`).
 *
 * All reads/writes are wrapped in try/catch — localStorage can throw in
 * private browsing / storage-disabled contexts, and this feature must not
 * crash as a result.
 */

import type { PlanGeneratorInputs, TrainingPlan } from "../types";

const DRAFT_PLAN_KEY = "trainpace_plan_draft";
const DRAFT_INPUTS_KEY = "trainpace_plan_inputs";
const PENDING_SAVE_KEY = "trainpace_plan_pending_save";
const PROGRESS_KEY = "trainpace_plan_progress";

function isRaceDateInPast(raceDate: unknown): boolean {
  if (typeof raceDate !== "string") return false;
  const ms = new Date(raceDate).getTime();
  if (Number.isNaN(ms)) return false;
  return ms < Date.now();
}

function isTrainingPlan(value: unknown): value is TrainingPlan {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<TrainingPlan>;
  return Array.isArray(p.weeks) && typeof p.raceDate === "string";
}

function isPlanGeneratorInputs(value: unknown): value is PlanGeneratorInputs {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<PlanGeneratorInputs>;
  return typeof p.raceDate === "string" && Array.isArray(p.availableDays);
}

/** Load the persisted draft plan, if any. Discards (and clears) stale drafts whose race date has passed. */
export function loadDraftPlan(): TrainingPlan | null {
  try {
    const raw = localStorage.getItem(DRAFT_PLAN_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isTrainingPlan(parsed)) return null;
    if (isRaceDateInPast(parsed.raceDate)) {
      clearDraftPlan();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraftPlan(plan: TrainingPlan): void {
  try {
    localStorage.setItem(DRAFT_PLAN_KEY, JSON.stringify(plan));
  } catch {
    // localStorage may be unavailable (e.g. private browsing) — ignore.
  }
}

export function clearDraftPlan(): void {
  try {
    localStorage.removeItem(DRAFT_PLAN_KEY);
  } catch {
    // ignore
  }
}

/** Load the persisted form inputs, if any. Discards inputs for a race date that has already passed. */
export function loadDraftInputs(): PlanGeneratorInputs | null {
  try {
    const raw = localStorage.getItem(DRAFT_INPUTS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isPlanGeneratorInputs(parsed)) return null;
    if (isRaceDateInPast(parsed.raceDate)) {
      clearDraftInputs();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraftInputs(inputs: PlanGeneratorInputs): void {
  try {
    localStorage.setItem(DRAFT_INPUTS_KEY, JSON.stringify(inputs));
  } catch {
    // ignore
  }
}

export function clearDraftInputs(): void {
  try {
    localStorage.removeItem(DRAFT_INPUTS_KEY);
  } catch {
    // ignore
  }
}

/** Whether a guest flagged this draft for auto-save after signing in. */
export function getPendingSave(): boolean {
  try {
    return localStorage.getItem(PENDING_SAVE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setPendingSave(): void {
  try {
    localStorage.setItem(PENDING_SAVE_KEY, "1");
  } catch {
    // ignore
  }
}

export function clearPendingSave(): void {
  try {
    localStorage.removeItem(PENDING_SAVE_KEY);
  } catch {
    // ignore
  }
}

function isCompletedWorkoutsMap(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every((v) => typeof v === "string");
}

/**
 * Guest-mode workout completion tracking (mirrors `TrainingPlan.completedWorkouts`
 * for signed-out users, and for signed-in users viewing an unsaved plan — see
 * `useSavePlan`, which merges this into the Firestore doc on save).
 */
export function readGuestProgress(): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isCompletedWorkoutsMap(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeGuestProgress(progress: Record<string, string>): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // ignore
  }
}

export function clearGuestProgress(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // ignore
  }
}
