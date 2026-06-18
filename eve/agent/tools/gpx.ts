import { defineTool } from "eve/tools";
import { z } from "zod";
import { analyzeGpx } from "@trainpace/core";

export default defineTool({
  description:
    "Analyze a GPX route: total distance, elevation gain, high/low points, and " +
    "bounds. Pass the raw GPX file contents as a string. Use when a runner shares " +
    "a route and asks about distance or climbing.",
  inputSchema: z.object({
    gpx: z.string().describe("Raw GPX XML file contents"),
    filename: z
      .string()
      .optional()
      .describe("Original filename, used as a fallback route name"),
  }),
  execute({ gpx, filename }) {
    const { metadata } = analyzeGpx(gpx, filename);
    return metadata;
  },
});
