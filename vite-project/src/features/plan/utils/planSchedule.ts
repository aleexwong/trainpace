/**
 * Training Plan — Calendar / Schedule Math
 *
 * Canonical date math for mapping a plan's abstract (weekNumber, day) grid
 * onto real calendar dates. Race day is the last day of the final week;
 * every other week's Monday is derived by walking backwards from there in
 * whole 7-day steps. All arithmetic here operates in the browser's LOCAL
 * timezone (via `Date` local getters/setters) so "today" and workout dates
 * agree with what the user sees on their wall calendar.
 *
 * `exportIcal.ts` needs the same Monday-from-race-date formula but must stay
 * in UTC (so exported .ics timestamps don't drift with the exporting
 * browser's timezone) — it imports `DAY_OFFSET` and the shared
 * `mondayOffsetFromDayOfWeek` helper from here rather than reimplementing
 * the offset table / weekday math, but keeps its own UTC date arithmetic.
 */

import type { TrainingPlan, RunDay, Workout, TrainingDay } from "../types";

export const DAY_OFFSET: Record<RunDay, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

/**
 * Given a JS day-of-week number (0=Sun..6=Sat), return the signed day
 * offset that walks back to that week's Monday.
 */
export function mondayOffsetFromDayOfWeek(dayOfWeek: number): number {
  return dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
}

/** Parse an ISO date string ("YYYY-MM-DD") at LOCAL noon, to avoid DST/timezone drift. */
function parseLocalNoon(dateStr: string): Date {
  // If the string already carries a time component, respect it; otherwise pin to local noon.
  const hasTime = /T\d{2}:\d{2}/.test(dateStr);
  return new Date(hasTime ? dateStr : `${dateStr}T12:00:00`);
}

/** Add whole calendar days to a date via `setDate` (DST-safe for noon-anchored dates). */
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Local-noon `Date` for "today". */
export function todayNoon(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

/** The race date itself, at local noon. */
export function raceDateNoon(raceDate: string): Date {
  return parseLocalNoon(raceDate);
}

/**
 * Monday of the given week, in LOCAL time. Race day is the last day of the
 * final week (`totalWeeks`); week 1's Monday is `(totalWeeks - 1) * 7` days
 * before the race week's Monday.
 */
export function weekStartMonday(raceDate: string, weekNumber: number, totalWeeks: number): Date {
  const race = parseLocalNoon(raceDate);
  const daysToMonday = mondayOffsetFromDayOfWeek(race.getDay());
  const raceMonday = addDays(race, daysToMonday);
  const weeksBack = totalWeeks - weekNumber;
  return addDays(raceMonday, -weeksBack * 7);
}

/** The local-noon calendar date for a specific (weekNumber, day) slot. */
export function workoutDate(plan: TrainingPlan, weekNumber: number, day: RunDay): Date {
  const monday = weekStartMonday(plan.raceDate, weekNumber, plan.totalWeeks);
  return addDays(monday, DAY_OFFSET[day]);
}

/** Stable map key for a (weekNumber, day) slot — e.g. "3:Tue". */
export function workoutKey(weekNumber: number, day: RunDay): string {
  return `${weekNumber}:${day}`;
}

/** Rest days aren't trackable; every other workout type (including "race") is. */
export function isTrackableWorkout(workout: Workout): boolean {
  return workout.type !== "rest";
}

/**
 * The week number whose [Monday, Monday+7d) span contains local-noon
 * "today" — null if today is before the plan starts or after race day.
 */
export function currentWeekNumber(plan: TrainingPlan, now: Date = new Date()): number | null {
  const today = todayNoon(now);
  for (const week of plan.weeks) {
    const monday = weekStartMonday(plan.raceDate, week.weekNumber, plan.totalWeeks);
    const weekEnd = addDays(monday, 7);
    if (today >= monday && today < weekEnd) {
      return week.weekNumber;
    }
  }
  return null;
}

export interface ScheduledWorkout {
  weekNumber: number;
  day: RunDay;
  workout: Workout;
  date: Date;
}

/**
 * The earliest trackable, incomplete workout dated today-or-later; falls
 * back to the chronologically-first incomplete workout overall (e.g. all
 * remaining workouts are in the past); null if everything is complete.
 */
export function nextWorkout(
  plan: TrainingPlan,
  completed: Record<string, string> | undefined
): ScheduledWorkout | null {
  const today = todayNoon();
  const scheduled: ScheduledWorkout[] = [];

  for (const week of plan.weeks) {
    for (const { day, workout } of week.days as TrainingDay[]) {
      if (!isTrackableWorkout(workout)) continue;
      const key = workoutKey(week.weekNumber, day);
      if (completed?.[key]) continue;
      scheduled.push({ weekNumber: week.weekNumber, day, workout, date: workoutDate(plan, week.weekNumber, day) });
    }
  }

  scheduled.sort((a, b) => a.date.getTime() - b.date.getTime());
  const upcoming = scheduled.find((s) => s.date.getTime() >= today.getTime());
  return upcoming ?? scheduled[0] ?? null;
}

/**
 * The plan a user is "currently in" — the one whose [week1 Monday, raceDate]
 * span contains today (nearest raceDate wins ties), else the plan with the
 * soonest upcoming raceDate, else null.
 */
export function selectActivePlan(plans: TrainingPlan[]): TrainingPlan | null {
  const today = todayNoon();

  let active: TrainingPlan | null = null;
  let activeRaceMs = Infinity;
  for (const plan of plans) {
    if (!plan.raceDate || plan.weeks.length === 0) continue;
    const week1Monday = weekStartMonday(plan.raceDate, 1, plan.totalWeeks);
    const race = raceDateNoon(plan.raceDate);
    if (today >= week1Monday && today <= race) {
      const raceMs = race.getTime();
      if (raceMs < activeRaceMs) {
        active = plan;
        activeRaceMs = raceMs;
      }
    }
  }
  if (active) return active;

  let soonest: TrainingPlan | null = null;
  let soonestMs = Infinity;
  for (const plan of plans) {
    if (!plan.raceDate) continue;
    const raceMs = raceDateNoon(plan.raceDate).getTime();
    if (raceMs >= today.getTime() && raceMs < soonestMs) {
      soonest = plan;
      soonestMs = raceMs;
    }
  }
  return soonest;
}
