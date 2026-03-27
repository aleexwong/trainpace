import { z } from "zod";
import type { StravaClient } from "../strava-client.js";

export const athleteTools = (client: StravaClient) => [
  {
    name: "get_athlete",
    description:
      "Get the authenticated Strava athlete's profile (name, location, stats summary).",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
    handler: async (_args: Record<string, unknown>) => {
      const athlete = await client.get("/athlete");
      return { content: [{ type: "text", text: JSON.stringify(athlete, null, 2) }] };
    },
  },
  {
    name: "get_athlete_stats",
    description:
      "Get totals and PRs for the authenticated athlete: recent/ytd/all-time run, ride, and swim totals.",
    inputSchema: {
      type: "object" as const,
      properties: {
        athlete_id: {
          type: "number",
          description: "Strava athlete ID. If omitted, the authenticated athlete's ID is used.",
        },
      },
      required: [],
    },
    handler: async (args: Record<string, unknown>) => {
      const parsed = z.object({ athlete_id: z.number().optional() }).parse(args);

      let athleteId = parsed.athlete_id;
      if (!athleteId) {
        const me = await client.get<{ id: number }>("/athlete");
        athleteId = me.id;
      }

      const stats = await client.get(`/athletes/${athleteId}/stats`);
      return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] };
    },
  },
];
