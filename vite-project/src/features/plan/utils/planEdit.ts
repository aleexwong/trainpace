/**
 * Training Plan — Schedule Editing (pure logic)
 *
 * Moving a workout to another day of the same week. Drop on an empty day =
 * move; drop on an occupied day = the two entries swap days. Completion
 * state follows the workout: the `${weekNumber}:${day}` keys in
 * `completedWorkouts` (see types.ts) are exchanged along with the days, and
 * a dot-path delta is produced for atomic Firestore migration.
 *
 * The race-day workout is immovable — all of the plan's date math anchors on
 * the race date being the last day of the final week (see planSchedule.ts) —
 * and in the final week nothing may land after the race's weekday.
 */

import type { RunDay, TrainingPlan } from "../types";
import { DAY_OFFSET, workoutKey } from "./planSchedule";

export interface WorkoutMove {
  weekNumber: number;
  fromDay: RunDay;
  toDay: RunDay;
}

export interface WorkoutMoveResult {
  plan: TrainingPlan;
  /** Fully-migrated completion map (local state / guest localStorage). */
  completed: Record<string, string>;
  /** Per-key delta for a dot-path Firestore update; null = delete the key. */
  completionDelta: Record<string, string | null>;
}

export function canMoveWorkout(plan: TrainingPlan, move: WorkoutMove): boolean {
  if (move.fromDay === move.toDay) return false;
  const week = plan.weeks.find((w) => w.weekNumber === move.weekNumber);
  if (!week) return false;

  const from = week.days.find((d) => d.day === move.fromDay);
  if (!from) return false;
  const to = week.days.find((d) => d.day === move.toDay);

  if (from.workout.type === "race" || to?.workout.type === "race") return false;

  const raceDay = week.days.find((d) => d.workout.type === "race")?.day;
  if (raceDay && DAY_OFFSET[move.toDay] > DAY_OFFSET[raceDay]) return false;

  return true;
}

/**
 * Apply a move/swap, returning the next plan + migrated completion state,
 * or null if the move is invalid. Never mutates its inputs.
 */
export function applyWorkoutMove(
  plan: TrainingPlan,
  completed: Record<string, string>,
  move: WorkoutMove
): WorkoutMoveResult | null {
  if (!canMoveWorkout(plan, move)) return null;

  const weeks = plan.weeks.map((week) => {
    if (week.weekNumber !== move.weekNumber) return week;
    const days = week.days
      .map((d) => {
        if (d.day === move.fromDay) return { ...d, day: move.toDay };
        if (d.day === move.toDay) return { ...d, day: move.fromDay };
        return d;
      })
      .sort((a, b) => DAY_OFFSET[a.day] - DAY_OFFSET[b.day]);
    return { ...week, days };
  });

  // Exchange the two slots' completion values (covers both move and swap;
  // exchanging with an absent value clears the vacated key).
  const fromKey = workoutKey(move.weekNumber, move.fromDay);
  const toKey = workoutKey(move.weekNumber, move.toDay);
  const fromValue = completed[fromKey];
  const toValue = completed[toKey];

  const nextCompleted = { ...completed };
  delete nextCompleted[fromKey];
  delete nextCompleted[toKey];
  if (toValue) nextCompleted[fromKey] = toValue;
  if (fromValue) nextCompleted[toKey] = fromValue;

  return {
    plan: { ...plan, weeks },
    completed: nextCompleted,
    completionDelta: {
      [fromKey]: toValue ?? null,
      [toKey]: fromValue ?? null,
    },
  };
}
