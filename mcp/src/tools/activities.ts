import { z } from "zod";
import type { StravaClient } from "../strava-client.js";

export const activityTools = (client: StravaClient) => [
  {
    name: "list_activities",
    description:
      "List the authenticated athlete's recent activities. Filter by type (e.g. 'Run'), date range, or page.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number (default: 1)" },
        per_page: {
          type: "number",
          description: "Results per page, max 200 (default: 30)",
        },
        before: {
          type: "number",
          description: "Unix timestamp — return only activities before this time",
        },
        after: {
          type: "number",
          description: "Unix timestamp — return only activities after this time",
        },
        type_filter: {
          type: "string",
          description:
            "Optional post-filter by activity type e.g. 'Run', 'Ride', 'Walk'. Strava API does not natively filter by type so this filters client-side.",
        },
      },
      required: [],
    },
    handler: async (args: Record<string, unknown>) => {
      const parsed = z
        .object({
          page: z.number().optional(),
          per_page: z.number().max(200).optional(),
          before: z.number().optional(),
          after: z.number().optional(),
          type_filter: z.string().optional(),
        })
        .parse(args);

      const params: Record<string, unknown> = {
        page: parsed.page ?? 1,
        per_page: parsed.per_page ?? 30,
      };
      if (parsed.before) params.before = parsed.before;
      if (parsed.after) params.after = parsed.after;

      let activities = await client.get<unknown[]>("/athlete/activities", params);

      if (parsed.type_filter) {
        const filter = parsed.type_filter.toLowerCase();
        activities = activities.filter(
          (a: unknown) =>
            typeof a === "object" &&
            a !== null &&
            "sport_type" in a &&
            typeof (a as { sport_type: string }).sport_type === "string" &&
            (a as { sport_type: string }).sport_type.toLowerCase() === filter
        );
      }

      // Return a concise summary per activity
      const summary = (activities as Record<string, unknown>[]).map((a) => ({
        id: a.id,
        name: a.name,
        sport_type: a.sport_type,
        start_date_local: a.start_date_local,
        distance_m: a.distance,
        distance_km: typeof a.distance === "number" ? (a.distance / 1000).toFixed(2) : null,
        moving_time_s: a.moving_time,
        elapsed_time_s: a.elapsed_time,
        elevation_gain_m: a.total_elevation_gain,
        average_speed_ms: a.average_speed,
        average_heartrate: a.average_heartrate,
        workout_type: a.workout_type, // 1 = Race for runs
        suffer_score: a.suffer_score,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "get_activity",
    description:
      "Get full details of a specific Strava activity by ID, including segment efforts and splits.",
    inputSchema: {
      type: "object" as const,
      properties: {
        activity_id: {
          type: "number",
          description: "Strava activity ID",
        },
      },
      required: ["activity_id"],
    },
    handler: async (args: Record<string, unknown>) => {
      const { activity_id } = z.object({ activity_id: z.number() }).parse(args);
      const activity = await client.get(`/activities/${activity_id}`);
      return { content: [{ type: "text", text: JSON.stringify(activity, null, 2) }] };
    },
  },
  {
    name: "get_activity_streams",
    description:
      "Get GPS, pace, heart rate, and elevation data streams for an activity. Useful for detailed analysis.",
    inputSchema: {
      type: "object" as const,
      properties: {
        activity_id: {
          type: "number",
          description: "Strava activity ID",
        },
        stream_types: {
          type: "array",
          items: { type: "string" },
          description:
            "Stream types to fetch. Options: time, distance, latlng, altitude, velocity_smooth, heartrate, cadence, watts, grade_smooth. Default: time, distance, velocity_smooth, altitude",
        },
        resolution: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Data resolution (default: medium)",
        },
      },
      required: ["activity_id"],
    },
    handler: async (args: Record<string, unknown>) => {
      const parsed = z
        .object({
          activity_id: z.number(),
          stream_types: z.array(z.string()).optional(),
          resolution: z.enum(["low", "medium", "high"]).optional(),
        })
        .parse(args);

      const keys = (
        parsed.stream_types ?? ["time", "distance", "velocity_smooth", "altitude"]
      ).join(",");

      const streams = await client.get(`/activities/${parsed.activity_id}/streams`, {
        keys,
        key_by_type: true,
        resolution: parsed.resolution ?? "medium",
      });

      return { content: [{ type: "text", text: JSON.stringify(streams, null, 2) }] };
    },
  },
];
