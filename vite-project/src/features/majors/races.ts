/**
 * World Majors Globe - Race registry.
 *
 * Metadata (name, city, date, distance, elevation, description) comes from
 * `src/data/marathon-data.json`, the same source the preview-route pages use, so
 * there is one place to correct a race fact. This module adds only what the
 * globe needs on top: which races are Abbott World Marathon Majors, where the
 * marker sits, and where the course GPX lives.
 *
 * Course geometry is deliberately NOT read from here — the globe parses
 * `/gpx/majors/<id>.gpx` at runtime, so replacing a file with a real course GPX
 * upgrades the map without a code change. The stats shown beside the map come
 * from this registry rather than being measured off the line, because the
 * shipped outlines are simplified traces (see scripts/generateMajorsGpx.ts).
 */

import marathonData from "@/data/marathon-data.json";

import type { MajorRace, RaceRegion, RaceTier } from "./types";
import { parseRaceDate } from "./utils";

interface MarathonDataEntry {
  name: string;
  city: string;
  country: string;
  distance: number;
  elevationGain: number;
  elevationLoss: number;
  raceDate: string;
  description: string;
  website: string;
  thumbnailPoints?: Array<{ lat: number; lng: number }>;
}

interface RaceRegistryEntry {
  /** Key in marathon-data.json. */
  id: string;
  shortName: string;
  region: RaceRegion;
  tier: RaceTier;
  /** Slug of the matching race prep page; mirrors raceSeoPages in seo-pages/seoPages.ts. */
  racePrepSlug: string | null;
}

/**
 * Listed in the order they appear on the page: the seven Abbott World Marathon
 * Majors first (Sydney joined the series in 2025), then the other courses
 * TrainPace has data for, grouped by region.
 */
const RACE_REGISTRY: RaceRegistryEntry[] = [
  { id: "tokyo", shortName: "Tokyo", region: "Asia-Pacific", tier: "major", racePrepSlug: "tokyo-marathon" },
  { id: "boston", shortName: "Boston", region: "Americas", tier: "major", racePrepSlug: "boston-marathon" },
  { id: "london", shortName: "London", region: "Europe", tier: "major", racePrepSlug: "london-marathon" },
  { id: "sydney", shortName: "Sydney", region: "Asia-Pacific", tier: "major", racePrepSlug: "sydney-marathon" },
  { id: "berlin", shortName: "Berlin", region: "Europe", tier: "major", racePrepSlug: "berlin-marathon" },
  { id: "chicago", shortName: "Chicago", region: "Americas", tier: "major", racePrepSlug: "chicago-marathon" },
  { id: "nyc", shortName: "New York", region: "Americas", tier: "major", racePrepSlug: "nyc-marathon" },

  { id: "marine-corps", shortName: "Marine Corps", region: "Americas", tier: "featured", racePrepSlug: "marine-corps-marathon" },
  { id: "big-sur", shortName: "Big Sur", region: "Americas", tier: "featured", racePrepSlug: "big-sur-marathon" },
  { id: "california-international", shortName: "Sacramento", region: "Americas", tier: "featured", racePrepSlug: "california-international-marathon" },

  { id: "paris", shortName: "Paris", region: "Europe", tier: "featured", racePrepSlug: "paris-marathon" },
  { id: "valencia", shortName: "Valencia", region: "Europe", tier: "featured", racePrepSlug: "valencia-marathon" },
  { id: "amsterdam", shortName: "Amsterdam", region: "Europe", tier: "featured", racePrepSlug: "amsterdam-marathon" },
  { id: "rotterdam", shortName: "Rotterdam", region: "Europe", tier: "featured", racePrepSlug: "rotterdam-marathon" },
  { id: "oslo", shortName: "Oslo", region: "Europe", tier: "featured", racePrepSlug: "oslo-marathon" },
];

/** Route line + marker colour. Green reads "major", amber "featured course". */
export const TIER_COLOR: Record<RaceTier, string> = {
  major: "#34d399",
  featured: "#fbbf24",
};

export const TIER_LABEL: Record<RaceTier, string> = {
  major: "Abbott World Marathon Major",
  featured: "Featured course",
};

export const REGION_ORDER: RaceRegion[] = ["Americas", "Europe", "Asia-Pacific"];

const raceData = marathonData as unknown as Record<string, MarathonDataEntry>;

function buildRace(entry: RaceRegistryEntry): MajorRace | null {
  const data = raceData[entry.id];
  if (!data) return null;

  const start = data.thumbnailPoints?.[0];
  if (!start) return null;

  return {
    id: entry.id,
    name: data.name,
    shortName: entry.shortName,
    city: data.city,
    country: data.country,
    region: entry.region,
    tier: entry.tier,
    center: [start.lng, start.lat],
    distanceKm: data.distance,
    elevationGainM: data.elevationGain,
    elevationLossM: data.elevationLoss,
    raceDate: data.raceDate,
    raceDateIso: parseRaceDate(data.raceDate),
    description: data.description,
    website: data.website,
    gpxUrl: `/gpx/majors/${entry.id}.gpx`,
    previewPath: `/preview-route/${entry.id}`,
    racePrepPath: entry.racePrepSlug ? `/race/${entry.racePrepSlug}` : null,
  };
}

export const majorRaces: MajorRace[] = RACE_REGISTRY.map(buildRace).filter(
  (race): race is MajorRace => race !== null
);

export const majorRaceById = new Map(majorRaces.map((race) => [race.id, race]));

export const abbottMajors = majorRaces.filter((race) => race.tier === "major");
