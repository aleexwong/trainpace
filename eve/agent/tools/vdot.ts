import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  calculateVdot,
  buildTrainingZones,
  buildRacePredictions,
  classifyVdot,
} from "@trainpace/core";

/**
 * Tool name is the filename slug ("vdot"). Default export, per Eve convention.
 * All the math lives in @trainpace/core — this is just a typed entry point.
 */
export default defineTool({
  description:
    "Compute VDOT (fitness score), Daniels training pace zones, and equivalent " +
    "race-time predictions from a single race performance. Use whenever a runner " +
    "shares a race result and wants pacing or fitness insight.",
  inputSchema: z.object({
    distanceMeters: z
      .number()
      .positive()
      .describe("Race distance in meters, e.g. 10000 for a 10K"),
    timeSeconds: z
      .number()
      .positive()
      .describe("Finish time in seconds, e.g. 2400 for 40:00"),
    unit: z
      .enum(["km", "miles"])
      .default("km")
      .describe("Output unit for formatted paces"),
  }),
  execute({ distanceMeters, timeSeconds, unit }) {
    const vdot = calculateVdot(distanceMeters, timeSeconds);
    return {
      vdot: Math.round(vdot * 10) / 10,
      level: classifyVdot(vdot),
      trainingZones: buildTrainingZones(vdot),
      racePredictions: buildRacePredictions(vdot, unit),
    };
  },
});
