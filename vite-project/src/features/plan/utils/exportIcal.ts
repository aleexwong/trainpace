/**
 * Training Plan → iCalendar (.ics) export
 *
 * Generates a .ics file with one VEVENT per non-rest training day.
 * Each event lands on the correct calendar date based on the week's
 * position relative to race day and the day-of-week label.
 */

import type { TrainingPlan, TrainingDay, TrainingWeek } from "../types";
import { DAY_OFFSET, mondayOffsetFromDayOfWeek } from "./planSchedule";

function formatIcalDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function uid(planId: string, week: number, day: string): string {
  return `trainpace-${planId}-w${week}-${day}@trainpace.com`;
}

function escapeIcal(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Compute the Monday of the week that contains `raceDate`, in UTC (so the
 * exported .ics timestamps don't drift with the exporting browser's
 * timezone). Week 1 starts (totalWeeks - 1) weeks before raceDate's week.
 * Reuses the shared Monday-offset formula from planSchedule.ts; only the
 * UTC vs. local date arithmetic differs from planSchedule's own
 * `weekStartMonday`.
 */
function getWeekStartMonday(raceDate: Date, weekNumber: number, totalWeeks: number): Date {
  const daysToMonday = mondayOffsetFromDayOfWeek(raceDate.getUTCDay());
  const raceMondayMs = raceDate.getTime() + daysToMonday * 86400000;

  // Weeks are numbered 1..totalWeeks. Race week = totalWeeks.
  const weeksBack = totalWeeks - weekNumber;
  return new Date(raceMondayMs - weeksBack * 7 * 86400000);
}

function buildEvent(
  day: TrainingDay,
  weekMonday: Date,
  week: TrainingWeek,
  planId: string,
  planName: string
): string {
  const offset = DAY_OFFSET[day.day] ?? 0;
  const eventDate = new Date(weekMonday.getTime() + offset * 86400000);
  // Default workout time: 7:00 AM UTC (reasonable morning run time)
  eventDate.setUTCHours(7, 0, 0, 0);

  const durationMs = (day.workout.durationMin || 60) * 60 * 1000;
  const endDate = new Date(eventDate.getTime() + durationMs);

  const distPart = day.workout.distanceKm
    ? ` (${day.workout.distanceKm}km)`
    : "";
  const summary = `${day.workout.label}${distPart} — ${week.phase}`;

  let description = day.workout.description;
  if (day.workout.paceZone) {
    description += `\\nPace: ${day.workout.paceZone}`;
  }
  description += `\\nWeek ${week.weekNumber} of ${planName}`;

  const now = new Date();

  return [
    "BEGIN:VEVENT",
    `UID:${uid(planId, week.weekNumber, day.day)}`,
    `DTSTAMP:${formatIcalDate(now)}`,
    `DTSTART:${formatIcalDate(eventDate)}`,
    `DTEND:${formatIcalDate(endDate)}`,
    `SUMMARY:${escapeIcal(summary)}`,
    `DESCRIPTION:${escapeIcal(description)}`,
    `CATEGORIES:Training,Running,${escapeIcal(week.phase)}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
  ].join("\r\n");
}

export function exportPlanAsIcal(plan: TrainingPlan): void {
  const planId = plan.id ?? `plan-${Date.now()}`;
  const raceDate = new Date(plan.raceDate + "T12:00:00Z");

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TrainPace//Training Plan//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcal(plan.name)}`,
    "X-WR-TIMEZONE:UTC",
  ];

  for (const week of plan.weeks) {
    const weekMonday = getWeekStartMonday(raceDate, week.weekNumber, plan.totalWeeks);

    for (const day of week.days) {
      if (day.workout.type === "rest") continue;
      lines.push(buildEvent(day, weekMonday, week, planId, plan.name));
    }
  }

  // Add the race day as an all-day event
  const raceDateStr = `${raceDate.getUTCFullYear()}${String(raceDate.getUTCMonth() + 1).padStart(2, "0")}${String(raceDate.getUTCDate()).padStart(2, "0")}`;
  lines.push(
    "BEGIN:VEVENT",
    `UID:trainpace-${planId}-raceday@trainpace.com`,
    `DTSTAMP:${formatIcalDate(new Date())}`,
    `DTSTART;VALUE=DATE:${raceDateStr}`,
    `DTEND;VALUE=DATE:${raceDateStr}`,
    `SUMMARY:🏁 ${escapeIcal(plan.goalRace)} — Race Day!`,
    `DESCRIPTION:${escapeIcal(`${plan.goalRace} race day. Trained with TrainPace. Good luck!`)}`,
    "CATEGORIES:Race,Running",
    "STATUS:CONFIRMED",
    "END:VEVENT"
  );

  lines.push("END:VCALENDAR");

  const icsContent = lines.join("\r\n");
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${plan.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
