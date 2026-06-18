import { defineTool } from "eve/tools";
import { z } from "zod";
import { calculateTrainingPaces } from "@trainpace/core";

export default defineTool({
  description:
    "Training pace ranges (easy / tempo / interval / etc.) from a race time, with " +
    "optional heart-rate zones (when age given) and heat adjustment (when " +
    "temperature in °F given). Use for 'what pace should I train at?' questions.",
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
    age: z.number().int().positive().optional().describe("Adds HR zones"),
    temperatureF: z
      .number()
      .optional()
      .describe("Ambient temperature °F; ≥80 slows easy pace"),
  }),
  execute({ distanceMeters, timeSeconds, unit, age, temperatureF }) {
    return calculateTrainingPaces(timeSeconds, distanceMeters, unit, {
      age,
      temperature: temperatureF,
    });
  },
});
