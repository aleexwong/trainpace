/**
 * World Majors Globe - Types
 */

export interface RoutePoint {
  lat: number;
  lng: number;
  ele?: number;
}

export type RaceRegion = "Americas" | "Europe" | "Asia-Pacific";

/** Abbott World Marathon Major, or another course TrainPace has data for. */
export type RaceTier = "major" | "featured";

export interface MajorRace {
  /** Key in marathon-data.json; also the GPX filename and the preview-route slug. */
  id: string;
  name: string;
  /** City-only label, for tight spaces like the map legend. */
  shortName: string;
  city: string;
  country: string;
  region: RaceRegion;
  tier: RaceTier;
  /** [lng, lat] of the course start — where the globe marker sits. */
  center: [number, number];
  distanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
  /** Human-readable date exactly as stored in marathon-data.json. */
  raceDate: string;
  /** ISO date, or null when the stored date is too vague to parse (e.g. "September 2026"). */
  raceDateIso: string | null;
  description: string;
  website: string;
  gpxUrl: string;
  previewPath: string;
  racePrepPath: string | null;
}

export type RouteStatus = "idle" | "loading" | "ready" | "error";

export interface RouteState {
  points: RoutePoint[];
  status: RouteStatus;
  error: string | null;
}
