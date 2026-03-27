import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { createClientFromEnv } from "./strava-client.js";

// Load .env file from /mcp directory if present
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}

async function main() {
  const strava = createClientFromEnv();

  const server = new McpServer({
    name: "trainpace-strava",
    version: "1.0.0",
  });

  // -------------------------------------------------------------------------
  // Athlete tools
  // -------------------------------------------------------------------------

  server.tool(
    "get_athlete",
    "Get the authenticated Strava athlete's profile (name, location, stats summary).",
    {},
    async () => {
      const athlete = await strava.get("/athlete");
      return { content: [{ type: "text", text: JSON.stringify(athlete, null, 2) }] };
    }
  );

  server.tool(
    "get_athlete_stats",
    "Get totals and PRs for the authenticated athlete: recent/ytd/all-time run, ride, and swim totals.",
    { athlete_id: z.number().optional().describe("Strava athlete ID. Defaults to the authenticated athlete.") },
    async ({ athlete_id }) => {
      let id = athlete_id;
      if (!id) {
        const me = await strava.get<{ id: number }>("/athlete");
        id = me.id;
      }
      const stats = await strava.get(`/athletes/${id}/stats`);
      return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] };
    }
  );

  // -------------------------------------------------------------------------
  // Activity tools
  // -------------------------------------------------------------------------

  server.tool(
    "list_activities",
    "List the authenticated athlete's recent activities. Optionally filter by type (e.g. 'Run'), date range, or page.",
    {
      page: z.number().optional().describe("Page number (default: 1)"),
      per_page: z.number().max(200).optional().describe("Results per page, max 200 (default: 30)"),
      before: z.number().optional().describe("Unix timestamp — return only activities before this time"),
      after: z.number().optional().describe("Unix timestamp — return only activities after this time"),
      type_filter: z.string().optional().describe("Post-filter by sport_type e.g. 'Run', 'Ride'"),
    },
    async ({ page, per_page, before, after, type_filter }) => {
      const params: Record<string, number> = { page: page ?? 1, per_page: per_page ?? 30 };
      if (before) params.before = before;
      if (after) params.after = after;

      let activities = await strava.get<Record<string, unknown>[]>("/athlete/activities", params);

      if (type_filter) {
        const filter = type_filter.toLowerCase();
        activities = activities.filter(
          (a) => typeof a.sport_type === "string" && a.sport_type.toLowerCase() === filter
        );
      }

      const summary = activities.map((a) => ({
        id: a.id,
        name: a.name,
        sport_type: a.sport_type,
        start_date_local: a.start_date_local,
        distance_m: a.distance,
        distance_km: typeof a.distance === "number" ? (a.distance / 1000).toFixed(2) : null,
        moving_time_s: a.moving_time,
        elevation_gain_m: a.total_elevation_gain,
        average_speed_ms: a.average_speed,
        average_heartrate: a.average_heartrate,
        workout_type: a.workout_type,
      }));

      return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
    }
  );

  server.tool(
    "get_activity",
    "Get full details of a specific Strava activity by ID, including segment efforts and splits.",
    { activity_id: z.number().describe("Strava activity ID") },
    async ({ activity_id }) => {
      const activity = await strava.get(`/activities/${activity_id}`);
      return { content: [{ type: "text", text: JSON.stringify(activity, null, 2) }] };
    }
  );

  server.tool(
    "get_activity_streams",
    "Get GPS, pace, heart rate, and elevation data streams for an activity.",
    {
      activity_id: z.number().describe("Strava activity ID"),
      stream_types: z
        .array(z.string())
        .optional()
        .describe(
          "Stream types to fetch. Options: time, distance, latlng, altitude, velocity_smooth, heartrate, cadence, watts, grade_smooth. Default: time, distance, velocity_smooth, altitude"
        ),
      resolution: z
        .enum(["low", "medium", "high"])
        .optional()
        .describe("Data resolution (default: medium)"),
    },
    async ({ activity_id, stream_types, resolution }) => {
      const keys = (stream_types ?? ["time", "distance", "velocity_smooth", "altitude"]).join(",");
      const streams = await strava.get(`/activities/${activity_id}/streams`, {
        keys,
        key_by_type: true,
        resolution: resolution ?? "medium",
      });
      return { content: [{ type: "text", text: JSON.stringify(streams, null, 2) }] };
    }
  );

  // -------------------------------------------------------------------------
  // Route tools
  // -------------------------------------------------------------------------

  server.tool(
    "list_routes",
    "List the authenticated athlete's saved Strava routes.",
    {
      page: z.number().optional().describe("Page number (default: 1)"),
      per_page: z.number().max(200).optional().describe("Results per page, max 200 (default: 30)"),
    },
    async ({ page, per_page }) => {
      const me = await strava.get<{ id: number }>("/athlete");
      const routes = await strava.get<Record<string, unknown>[]>(`/athletes/${me.id}/routes`, {
        page: page ?? 1,
        per_page: per_page ?? 30,
      });

      const summary = routes.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        type: r.type,
        distance_km: typeof r.distance === "number" ? (r.distance / 1000).toFixed(2) : null,
        elevation_gain_m: r.elevation_gain,
        estimated_moving_time_s: r.estimated_moving_time,
        starred: r.starred,
      }));

      return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
    }
  );

  server.tool(
    "export_route_gpx",
    "Export a Strava route as GPX XML. The result can be saved as a .gpx file and uploaded to TrainPace's elevation analyzer.",
    { route_id: z.number().describe("Strava route ID") },
    async ({ route_id }) => {
      const gpx = await strava.get<string>(`/routes/${route_id}/export_gpx`);
      return {
        content: [{ type: "text", text: typeof gpx === "string" ? gpx : JSON.stringify(gpx) }],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Keep process alive
  process.stdin.resume();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
