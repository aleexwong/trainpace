#!/usr/bin/env npx ts-node

/**
 * Migration Script: marathon-data.json to new race architecture
 *
 * This script converts the existing marathon-data.json into the new
 * scalable race data architecture with:
 * - Individual TypeScript files per race (in courses/)
 * - Separate JSON files for route data (in routes/)
 * - Auto-registration with the race registry
 *
 * Usage:
 *   npx ts-node scripts/migrate-marathon-data.ts
 *
 * Or add to package.json scripts:
 *   "migrate-races": "ts-node scripts/migrate-marathon-data.ts"
 */

import * as fs from "fs";
import * as path from "path";

// ============================================================================
// Configuration
// ============================================================================

const SOURCE_FILE = path.join(
  __dirname,
  "../vite-project/src/data/marathon-data.json"
);

const OUTPUT_DIR = path.join(__dirname, "../vite-project/src/data/races");
const COURSES_DIR = path.join(OUTPUT_DIR, "courses");
const ROUTES_DIR = path.join(OUTPUT_DIR, "routes");

// ============================================================================
// Region/Tier Inference (copied from helpers.ts for standalone script)
// ============================================================================

type RaceRegion =
  | "north-america"
  | "europe"
  | "asia-pacific"
  | "south-america"
  | "africa"
  | "middle-east";

type RaceTier = "world-major" | "platinum" | "gold" | "silver" | "bronze";

const REGION_MAP: Record<string, RaceRegion> = {
  usa: "north-america",
  "united states": "north-america",
  massachusetts: "north-america",
  "new york": "north-america",
  illinois: "north-america",
  california: "north-america",
  dc: "north-america",
  uk: "europe",
  england: "europe",
  germany: "europe",
  france: "europe",
  spain: "europe",
  netherlands: "europe",
  norway: "europe",
  japan: "asia-pacific",
  australia: "asia-pacific",
};

const WORLD_MAJORS = [
  "boston",
  "new york",
  "nyc",
  "chicago",
  "london",
  "berlin",
  "tokyo",
  "sydney",
];

const PLATINUM_RACES = [
  "valencia",
  "rotterdam",
  "amsterdam",
  "paris",
];

function inferRegion(country: string): RaceRegion {
  const lower = country.toLowerCase();
  for (const [key, region] of Object.entries(REGION_MAP)) {
    if (lower.includes(key)) {
      return region;
    }
  }
  return "europe";
}

function inferTier(name: string, elevationGain: number): RaceTier {
  const lower = name.toLowerCase();
  if (WORLD_MAJORS.some((m) => lower.includes(m))) return "world-major";
  if (PLATINUM_RACES.some((r) => lower.includes(r))) return "platinum";
  if (elevationGain > 400) return "silver";
  return "gold";
}

// ============================================================================
// Template Generation
// ============================================================================

function toVariableName(id: string): string {
  // Convert kebab-case to camelCase
  return id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function toPascalCase(id: string): string {
  const camel = toVariableName(id);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function generateCourseFile(id: string, data: any): string {
  const varName = toVariableName(id);
  const pascalName = toPascalCase(id);
  const region = inferRegion(data.country);
  const tier = inferTier(data.name, data.elevationGain);

  const metadata = {
    id,
    name: data.name,
    city: data.city,
    country: data.country,
    region,
    tier,
    distance: data.distance,
    elevationGain: data.elevationGain,
    elevationLoss: data.elevationLoss,
    startElevation: data.startElevation,
    endElevation: data.endElevation,
    slug: data.slug,
    raceDate: data.raceDate,
    website: data.website,
    description: data.description,
    tips: data.tips || [],
    paceStrategy: data.paceStrategy || {
      type: "even-pace",
      summary: "Run at consistent effort throughout the race.",
      segments: [],
    },
    fuelingNotes: data.fuelingNotes || "",
    faq: data.faq || [],
    keywords: generateKeywords(data),
    lastUpdated: new Date().toISOString().split("T")[0],
  };

  const metadataJson = JSON.stringify(metadata, null, 2)
    .split("\n")
    .map((line, i) => (i === 0 ? line : "  " + line))
    .join("\n");

  return `/**
 * ${data.name}
 *
 * ${data.description.split(".")[0]}.
 */

import type { RaceMetadata, RaceRouteData } from "../types";
import { registerRace } from "../registry";

// ============================================================================
// Metadata (Static - always available)
// ============================================================================

export const ${varName}Metadata: RaceMetadata = ${metadataJson};

// ============================================================================
// Route Loader (Lazy - loaded on demand)
// ============================================================================

/**
 * Loads ${data.name} route data.
 * This is called lazily when the route data is actually needed.
 */
export async function load${pascalName}Route(): Promise<RaceRouteData> {
  // Dynamic import for code splitting
  const routeData = await import("../routes/${id}-route.json");

  return {
    raceId: "${id}",
    thumbnailPoints: routeData.thumbnailPoints,
    ${data.slug ? `firestoreDocId: "${data.slug}",` : ""}
  };
}

// ============================================================================
// Register with global registry
// ============================================================================

registerRace(${varName}Metadata, load${pascalName}Route);

// ============================================================================
// Named exports for direct imports
// ============================================================================

export default ${varName}Metadata;
`;
}

function generateKeywords(data: any): string[] {
  const keywords: string[] = [];

  // Add name variations
  keywords.push(data.name.toLowerCase());
  keywords.push(data.city.toLowerCase() + " marathon");

  // Add common terms
  if (data.elevationGain < 100) {
    keywords.push("flat marathon", "pr course", "fast course");
  }
  if (data.elevationGain > 300) {
    keywords.push("hilly marathon", "challenging course");
  }

  return keywords;
}

function generateRouteFile(id: string, data: any): string {
  const routeData = {
    raceId: id,
    thumbnailPoints: data.thumbnailPoints || [],
  };

  return JSON.stringify(routeData, null, 2);
}

// ============================================================================
// Main Migration Logic
// ============================================================================

function migrate() {
  console.log("Starting marathon-data.json migration...\n");

  // Read source file
  const sourceData = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf-8"));
  const raceIds = Object.keys(sourceData);

  console.log(`Found ${raceIds.length} races to migrate.\n`);

  // Ensure output directories exist
  fs.mkdirSync(COURSES_DIR, { recursive: true });
  fs.mkdirSync(ROUTES_DIR, { recursive: true });

  const imports: string[] = [];
  const skipped: string[] = [];

  for (const id of raceIds) {
    const data = sourceData[id];
    const courseFile = path.join(COURSES_DIR, `${id}.ts`);
    const routeFile = path.join(ROUTES_DIR, `${id}-route.json`);

    // Skip if course file already exists
    if (fs.existsSync(courseFile)) {
      console.log(`  [SKIP] ${id} - course file already exists`);
      skipped.push(id);
      imports.push(`import "./courses/${id}";`);
      continue;
    }

    // Generate course file
    const courseContent = generateCourseFile(id, data);
    fs.writeFileSync(courseFile, courseContent);
    console.log(`  [OK] Created ${id}.ts`);

    // Generate route file
    const routeContent = generateRouteFile(id, data);
    fs.writeFileSync(routeFile, routeContent);
    console.log(`  [OK] Created ${id}-route.json`);

    imports.push(`import "./courses/${id}";`);
  }

  console.log("\n--- Migration Summary ---");
  console.log(`Migrated: ${raceIds.length - skipped.length} races`);
  console.log(`Skipped:  ${skipped.length} races (already exist)`);
  console.log(`\nAdd these imports to src/data/races/index.ts:\n`);
  console.log(imports.join("\n"));
  console.log("\n--- Done ---");
}

// Run migration
migrate();
