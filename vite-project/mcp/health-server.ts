/**
 * TrainPace Apple Health MCP server.
 *
 * Points Claude at an Apple Health `export.zip` on this machine and lets it ask
 * real questions about the runs inside — "what did I average in July", "how does
 * this month compare to last" — instead of being handed a pasted summary.
 *
 * It reuses the exact parser the /import page runs in the browser
 * (`src/features/health-import/`), so the numbers here and the numbers on the
 * site come from one implementation.
 *
 * The export is read lazily off disk with `fs.openAsBlob()` and streamed, so a
 * multi-hundred-megabyte file costs a few megabytes of memory. Nothing is
 * uploaded, copied, or written anywhere: this process reads one file and
 * answers questions about it.
 *
 * Run:  npm run --silent mcp:health -- --export ~/Downloads/export.zip
 * or set TRAINPACE_HEALTH_EXPORT to the path.
 */

import { openAsBlob } from "node:fs";
import { McpServer, fromJsonSchema } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";

import {
  parseHealthExport,
  type HealthExportHandle,
} from "../src/features/health-import/parseHealthExport";
import {
  bestEffortsFrom,
  formatDistance,
  formatDuration,
  formatPace,
  isRun,
  localDate,
  summarize,
  toClaudeMarkdown,
  weeklyVolume,
  type DistanceUnit,
} from "../src/features/health-import/summarize";
import type { HealthWorkout } from "../src/features/health-import/types";

// ── Configuration ──────────────────────────────────────────────────────────

/** `--export <path>` beats the environment variable. */
function resolveExportPath(): string | null {
  const flag = process.argv.indexOf("--export");
  if (flag !== -1 && process.argv[flag + 1]) return process.argv[flag + 1];
  return process.env.TRAINPACE_HEALTH_EXPORT ?? null;
}

const EXPORT_PATH = resolveExportPath();

const NO_EXPORT_MESSAGE =
  "No Apple Health export is configured. Start the server with " +
  "`--export /path/to/export.zip`, or set TRAINPACE_HEALTH_EXPORT. " +
  "Get the file from Health → your profile picture → Export All Health Data.";

// ── Export loading (parsed once, cached for the process lifetime) ──────────

let cached: Promise<HealthExportHandle> | null = null;

function loadExport(): Promise<HealthExportHandle> {
  if (!EXPORT_PATH) return Promise.reject(new Error(NO_EXPORT_MESSAGE));
  if (!cached) {
    cached = (async () => {
      const blob = await openAsBlob(EXPORT_PATH);
      // Diagnostics go to stderr — stdout carries JSON-RPC and nothing else.
      process.stderr.write(
        `[trainpace-health] reading ${EXPORT_PATH} (${blob.size} bytes)\n`
      );
      const data = await parseHealthExport(blob, { fileName: EXPORT_PATH });
      process.stderr.write(
        `[trainpace-health] parsed ${data.workouts.length} workouts\n`
      );
      return data;
    })().catch((error) => {
      cached = null; // let the next call retry rather than cache the failure
      throw error;
    });
  }
  return cached;
}

// ── Shared helpers ─────────────────────────────────────────────────────────

/**
 * Tool inputs are declared as plain JSON Schema rather than through zod.
 * `@modelcontextprotocol/server` wants a Standard Schema that can emit JSON
 * Schema, which the app's zod 3.25 does not provide - and going through
 * `fromJsonSchema` keeps this server decoupled from the app's zod version
 * entirely, so a future zod upgrade cannot break it.
 *
 * JSON Schema `default` is advisory: a client may still omit the field, so
 * every handler applies its own fallback.
 */
const DATE_RANGE_PROPS = {
  from: {
    type: "string",
    description: "Earliest run date to include, as YYYY-MM-DD. Omit for no limit.",
  },
  to: {
    type: "string",
    description: "Latest run date to include, as YYYY-MM-DD. Omit for no limit.",
  },
} as const;

const UNIT_PROP = {
  type: "string",
  enum: ["km", "mi"],
  default: "km",
  description: "Distance unit used in the reply.",
} as const;

interface DateRangeArgs {
  from?: string;
  to?: string;
  unit?: DistanceUnit;
}

/** Runs inside an inclusive YYYY-MM-DD range, oldest first. */
function runsInRange(
  data: HealthExportHandle,
  from?: string,
  to?: string,
  includeIndoor = true
): HealthWorkout[] {
  return data.workouts
    .filter(isRun)
    .filter((run) => includeIndoor || !run.indoor)
    .filter((run) => {
      const date = localDate(run.start);
      if (from && date < from) return false;
      if (to && date > to) return false;
      return true;
    })
    .sort((a, b) => (a.start < b.start ? -1 : 1));
}

function totals(runs: HealthWorkout[]) {
  return {
    count: runs.length,
    meters: runs.reduce((sum, run) => sum + (run.distanceMeters ?? 0), 0),
    seconds: runs.reduce((sum, run) => sum + run.durationSeconds, 0),
  };
}

function text(body: string) {
  return { content: [{ type: "text" as const, text: body }] };
}

/** Turn a thrown error into a readable tool reply rather than a protocol error. */
function failure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

function rangeLabel(from?: string, to?: string): string {
  if (from && to) return `${from} to ${to}`;
  if (from) return `since ${from}`;
  if (to) return `up to ${to}`;
  return "all recorded runs";
}

// ── Server ─────────────────────────────────────────────────────────────────

function buildServer(): McpServer {
  const server = new McpServer(
    { name: "trainpace-health", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.registerTool(
    "export_status",
    {
      title: "Export status",
      description:
        "What Apple Health export is loaded, how many workouts it holds, and the date range it covers. Use this first if anything looks empty.",
      inputSchema: fromJsonSchema<Record<string, never>>({
        type: "object",
        properties: {},
        additionalProperties: false,
      }),
    },
    async () => {
      try {
        const data = await loadExport();
        const runs = data.workouts.filter(isRun);
        const first = runs[0] ? localDate(runs[0].start) : "—";
        const last = runs.length ? localDate(runs[runs.length - 1].start) : "—";
        const activities = new Set(data.workouts.map((w) => w.activityType));
        return text(
          [
            `File: ${EXPORT_PATH}`,
            `Workouts: ${data.workouts.length} (${runs.length} runs)`,
            `Runs from ${first} to ${last}`,
            `Activity types: ${[...activities].sort().join(", ")}`,
            `GPX route files: ${data.routeFiles.length}`,
            `Scalar samples (VO2 max, resting HR, body mass): ${data.metrics.length}`,
          ].join("\n")
        );
      } catch (error) {
        return failure(error);
      }
    }
  );

  server.registerTool(
    "training_summary",
    {
      title: "Training summary",
      description:
        "Overall picture for a recent window: volume, week-by-week, fastest efforts, VDOT, and the latest VO2 max / resting heart rate / body mass. Best starting point for open questions about how training is going.",
      inputSchema: fromJsonSchema<{ windowDays?: number; unit?: DistanceUnit }>({
        type: "object",
        properties: {
          windowDays: {
            type: "integer",
            minimum: 1,
            maximum: 3650,
            default: 90,
            description: "How many days back to summarise. Defaults to 90.",
          },
          unit: UNIT_PROP,
        },
        additionalProperties: false,
      }),
    },
    async ({ windowDays, unit }) => {
      try {
        const data = await loadExport();
        return text(
          toClaudeMarkdown(
            summarize(data, { windowDays: windowDays ?? 90 }),
            unit ?? "km",
            // This client is already connected; the clipboard footer would only
            // tell it to connect to something it is talking to.
            { includeHandoff: false }
          )
        );
      } catch (error) {
        return failure(error);
      }
    }
  );

  server.registerTool(
    "list_runs",
    {
      title: "List runs",
      description:
        "Individual runs in a date range, newest first, with distance, time, pace, heart rate and whether the run was indoors. Use for questions about specific runs or for spotting a workout.",
      inputSchema: fromJsonSchema<
        DateRangeArgs & {
          limit?: number;
          minDistanceKm?: number;
          includeIndoor?: boolean;
        }
      >({
        type: "object",
        properties: {
          ...DATE_RANGE_PROPS,
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 500,
            default: 50,
            description: "Maximum runs to return, newest first.",
          },
          minDistanceKm: {
            type: "number",
            minimum: 0,
            description: "Only runs at least this far, in kilometres.",
          },
          includeIndoor: {
            type: "boolean",
            default: true,
            description: "Include treadmill runs.",
          },
          unit: UNIT_PROP,
        },
        additionalProperties: false,
      }),
    },
    async ({ from, to, limit, minDistanceKm, includeIndoor, unit }) => {
      try {
        const data = await loadExport();
        const runs = runsInRange(data, from, to, includeIndoor ?? true)
          .filter(
            (run) =>
              minDistanceKm == null ||
              (run.distanceMeters ?? 0) >= minDistanceKm * 1000
          )
          .reverse()
          .slice(0, limit ?? 50);

        if (runs.length === 0) {
          return text(`No runs found for ${rangeLabel(from, to)}.`);
        }

        const rows = runs.map((run) => {
          const meters = run.distanceMeters ?? 0;
          return [
            localDate(run.start),
            formatDistance(meters, unit ?? "km"),
            formatDuration(run.durationSeconds),
            formatPace(meters, run.durationSeconds, unit ?? "km"),
            run.avgHeartRate ? `${run.avgHeartRate} bpm` : "—",
            run.indoor ? "indoor" : "outdoor",
            run.source ?? "—",
          ].join(" | ");
        });

        return text(
          [
            `${runs.length} runs, ${rangeLabel(from, to)}, newest first:`,
            "",
            "Date | Distance | Time | Pace | Avg HR | Where | Source",
            ...rows,
          ].join("\n")
        );
      } catch (error) {
        return failure(error);
      }
    }
  );

  server.registerTool(
    "weekly_volume",
    {
      title: "Weekly volume",
      description:
        "Distance and time per week (weeks start Monday) across a date range. Use for trends in training load and for spotting ramp-ups or gaps.",
      inputSchema: fromJsonSchema<DateRangeArgs>({
        type: "object",
        properties: { ...DATE_RANGE_PROPS, unit: UNIT_PROP },
        additionalProperties: false,
      }),
    },
    async ({ from, to, unit }) => {
      try {
        const data = await loadExport();
        const weeks = weeklyVolume(runsInRange(data, from, to));
        if (weeks.length === 0) {
          return text(`No runs found for ${rangeLabel(from, to)}.`);
        }
        const mean =
          weeks.reduce((sum, week) => sum + week.meters, 0) / weeks.length;
        return text(
          [
            `Weekly volume, ${rangeLabel(from, to)} (${weeks.length} weeks, averaging ${formatDistance(mean, unit ?? "km")}):`,
            "",
            "Week of | Runs | Distance | Time",
            ...weeks.map((week) =>
              [
                week.weekStart,
                week.runs,
                formatDistance(week.meters, unit ?? "km"),
                formatDuration(week.seconds),
              ].join(" | ")
            ),
          ].join("\n")
        );
      } catch (error) {
        return failure(error);
      }
    }
  );

  server.registerTool(
    "best_efforts",
    {
      title: "Best efforts",
      description:
        "Fastest run at 5K, 10K, half marathon and marathon inside a date range, each with pace and a VDOT estimate. Treadmill runs are excluded because their distance depends on the machine's calibration. These are usually training runs, not races, so read them as a floor on fitness.",
      inputSchema: fromJsonSchema<DateRangeArgs>({
        type: "object",
        properties: { ...DATE_RANGE_PROPS, unit: UNIT_PROP },
        additionalProperties: false,
      }),
    },
    async ({ from, to, unit }) => {
      try {
        const data = await loadExport();
        const efforts = bestEffortsFrom(runsInRange(data, from, to));
        if (efforts.length === 0) {
          return text(
            `No run reached 5 km for ${rangeLabel(from, to)}, so there is nothing to rank.`
          );
        }
        const best = efforts.reduce((a, b) => (b.vdot > a.vdot ? b : a));
        return text(
          [
            `Fastest efforts, ${rangeLabel(from, to)}:`,
            "",
            "Distance | Measured | Time | Pace | Date | VDOT",
            ...efforts.map((effort) =>
              [
                effort.label,
                formatDistance(effort.meters, unit ?? "km"),
                formatDuration(effort.seconds),
                formatPace(effort.meters, effort.seconds, unit ?? "km"),
                effort.date,
                effort.vdot,
              ].join(" | ")
            ),
            "",
            `Best VDOT in this range: ${best.vdot}, from the ${best.label.toLowerCase()} on ${best.date}.`,
          ].join("\n")
        );
      } catch (error) {
        return failure(error);
      }
    }
  );

  server.registerTool(
    "compare_periods",
    {
      title: "Compare two periods",
      description:
        "Volume, run count and average pace for two date ranges side by side, with the change between them. Use for questions like 'am I running more than last month' or 'how does this build compare to the last one'.",
      inputSchema: fromJsonSchema<{
        periodA: { from: string; to: string };
        periodB: { from: string; to: string };
        unit?: DistanceUnit;
      }>({
        type: "object",
        properties: {
          periodA: {
            type: "object",
            description: "The earlier period, as YYYY-MM-DD dates.",
            properties: { from: { type: "string" }, to: { type: "string" } },
            required: ["from", "to"],
            additionalProperties: false,
          },
          periodB: {
            type: "object",
            description: "The later period, as YYYY-MM-DD dates.",
            properties: { from: { type: "string" }, to: { type: "string" } },
            required: ["from", "to"],
            additionalProperties: false,
          },
          unit: UNIT_PROP,
        },
        required: ["periodA", "periodB"],
        additionalProperties: false,
      }),
    },
    async ({ periodA, periodB, unit: rawUnit }) => {
      try {
        const unit: DistanceUnit = rawUnit ?? "km";
        const data = await loadExport();
        const a = totals(runsInRange(data, periodA.from, periodA.to));
        const b = totals(runsInRange(data, periodB.from, periodB.to));

        const describe = (label: string, range: { from: string; to: string }, t: ReturnType<typeof totals>) =>
          `${label} (${range.from} to ${range.to}): ${t.count} runs, ${formatDistance(t.meters, unit)}, ${formatDuration(t.seconds)}, average pace ${formatPace(t.meters, t.seconds, unit)}`;

        const change = (before: number, after: number) => {
          if (before === 0) return after === 0 ? "no change" : "up from nothing";
          const percent = ((after - before) / before) * 100;
          const direction = percent >= 0 ? "up" : "down";
          return `${direction} ${Math.abs(percent).toFixed(0)}%`;
        };

        // Lower seconds-per-metre is faster, so the sign is inverted on purpose.
        const paceA = a.meters > 0 ? a.seconds / a.meters : 0;
        const paceB = b.meters > 0 ? b.seconds / b.meters : 0;
        const paceVerdict =
          paceA === 0 || paceB === 0
            ? "not comparable"
            : paceB < paceA
              ? `faster by ${formatDuration((paceA - paceB) * (unit === "km" ? 1000 : 1609.344))} per ${unit}`
              : `slower by ${formatDuration((paceB - paceA) * (unit === "km" ? 1000 : 1609.344))} per ${unit}`;

        return text(
          [
            describe("Period A", periodA, a),
            describe("Period B", periodB, b),
            "",
            `Distance: ${change(a.meters, b.meters)}`,
            `Runs: ${change(a.count, b.count)}`,
            `Average pace: ${paceVerdict}`,
          ].join("\n")
        );
      } catch (error) {
        return failure(error);
      }
    }
  );

  return server;
}

serveStdio(buildServer, {
  onerror: (error) => process.stderr.write(`[trainpace-health] ${error.message}\n`),
});
