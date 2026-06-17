#!/usr/bin/env node
/**
 * trainpace CLI — thin wrapper over @trainpace/core. JSON in, JSON out.
 * Every command prints JSON to stdout; errors print {"error": "..."} and exit 1.
 *
 *   trainpace vdot  --distance 10000 --time 40:00
 *   trainpace paces --distance 10000 --time 40:00 --unit km [--age 35] [--temp 82]
 *   trainpace gpx   ./route.gpx
 */

import { readFileSync } from "fs";
import {
  calculateVdot,
  buildTrainingZones,
  buildRacePredictions,
  classifyVdot,
  calculateTrainingPaces,
  analyzeGpx,
} from "./index";
import type { PaceOutputUnit } from "./types";

type Flags = Record<string, string | boolean>;

function parseArgs(argv: string[]): { positionals: string[]; flags: Flags } {
  const positionals: string[] = [];
  const flags: Flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
    } else {
      positionals.push(arg);
    }
  }
  return { positionals, flags };
}

/** Parse "HH:MM:SS", "MM:SS", or "SS" into total seconds. */
function parseTime(value: string | boolean | undefined): number {
  if (typeof value !== "string") throw new Error("--time is required (e.g. 40:00)");
  const parts = value.split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid --time "${value}". Use HH:MM:SS or MM:SS.`);
  }
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

function num(value: string | boolean | undefined, flag: string): number {
  if (typeof value !== "string") throw new Error(`${flag} is required`);
  const n = parseFloat(value);
  if (Number.isNaN(n)) throw new Error(`Invalid ${flag} "${value}"`);
  return n;
}

function resolveUnit(value: string | boolean | undefined): PaceOutputUnit {
  if (value === "miles" || value === "mi") return "miles";
  return "km";
}

function emit(data: unknown, pretty: boolean): void {
  process.stdout.write(JSON.stringify(data, null, pretty ? 2 : 0) + "\n");
}

function run(): void {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  const command = positionals[0];
  const pretty = flags.pretty === true;

  switch (command) {
    case "vdot": {
      const distance = num(flags.distance, "--distance");
      const timeSeconds = parseTime(flags.time);
      const unit = resolveUnit(flags.unit);
      const vdot = calculateVdot(distance, timeSeconds);
      emit(
        {
          vdot: Math.round(vdot * 10) / 10,
          level: classifyVdot(vdot),
          trainingZones: buildTrainingZones(vdot).map((z) => ({
            name: z.name,
            shortName: z.shortName,
            pacePerKm: z.pacePerKm,
            pacePerMile: z.pacePerMile,
          })),
          racePredictions: buildRacePredictions(vdot, unit).map((r) => ({
            distance: r.name,
            time: r.time,
            pace: r.pace,
          })),
        },
        pretty
      );
      break;
    }

    case "paces": {
      const distance = num(flags.distance, "--distance");
      const timeSeconds = parseTime(flags.time);
      const unit = resolveUnit(flags.unit);
      const options: { age?: number; temperature?: number } = {};
      if (typeof flags.age === "string") options.age = parseInt(flags.age, 10);
      if (typeof flags.temp === "string") options.temperature = parseFloat(flags.temp);
      emit(calculateTrainingPaces(timeSeconds, distance, unit, options), pretty);
      break;
    }

    case "gpx": {
      const file = positionals[1];
      if (!file) throw new Error("Usage: trainpace gpx <file.gpx>");
      const content = readFileSync(file, "utf8");
      const { metadata } = analyzeGpx(content, file);
      emit(metadata, pretty);
      break;
    }

    case undefined:
    case "help":
    case "--help":
      process.stdout.write(
        [
          "trainpace — running coach math (JSON out)",
          "",
          "Commands:",
          "  vdot  --distance <m> --time <HH:MM:SS> [--unit km|miles]",
          "  paces --distance <m> --time <HH:MM:SS> [--unit km|miles] [--age N] [--temp F]",
          "  gpx   <file.gpx>",
          "",
          "Add --pretty for human-readable JSON.",
          "",
        ].join("\n")
      );
      break;

    default:
      throw new Error(`Unknown command "${command}". Try: vdot, paces, gpx, help.`);
  }
}

try {
  run();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  process.stdout.write(JSON.stringify({ error: message }) + "\n");
  process.exit(1);
}
