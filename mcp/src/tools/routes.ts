import { z } from "zod";
import type { StravaClient } from "../strava-client.js";

export const routeTools = (client: StravaClient) => [
  {
    name: "list_routes",
    description: "List the authenticated athlete's saved Strava routes.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number (default: 1)" },
        per_page: {
          type: "number",
          description: "Results per page, max 200 (default: 30)",
        },
      },
      required: [],
    },
    handler: async (args: Record<string, unknown>) => {
      const parsed = z
        .object({ page: z.number().optional(), per_page: z.number().max(200).optional() })
        .parse(args);

      const me = await client.get<{ id: number }>("/athlete");
      const routes = await client.get<unknown[]>(`/athletes/${me.id}/routes`, {
        page: parsed.page ?? 1,
        per_page: parsed.per_page ?? 30,
      });

      const summary = (routes as Record<string, unknown>[]).map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        type: r.type, // 1 = Ride, 2 = Run
        distance_m: r.distance,
        distance_km: typeof r.distance === "number" ? (r.distance / 1000).toFixed(2) : null,
        elevation_gain_m: r.elevation_gain,
        estimated_moving_time_s: r.estimated_moving_time,
        created_at: r.created_at,
        updated_at: r.updated_at,
        starred: r.starred,
      }));

      return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
    },
  },
  {
    name: "export_route_gpx",
    description:
      "Export a Strava route as GPX XML text. The result can be saved as a .gpx file and uploaded to TrainPace's elevation analyzer.",
    inputSchema: {
      type: "object" as const,
      properties: {
        route_id: {
          type: "number",
          description: "Strava route ID",
        },
      },
      required: ["route_id"],
    },
    handler: async (args: Record<string, unknown>) => {
      const { route_id } = z.object({ route_id: z.number() }).parse(args);
      // Strava returns GPX as plain text/xml
      const gpxData = await client.get<string>(`/routes/${route_id}/export_gpx`);
      return {
        content: [
          {
            type: "text",
            text:
              typeof gpxData === "string"
                ? gpxData
                : JSON.stringify(gpxData),
          },
        ],
      };
    },
  },
];
