/// <reference types="vite/client" />
/**
 * Race guides — researched, sourced facts and pacing advice for race prep
 * pages that have no GPX course data.
 *
 * One JSON file per race in `src/data/race-guides/<race page slug>.json`.
 * The browser loads a single guide on demand (each file is its own small
 * chunk); the prerender and Markdown build read them all eagerly through
 * `src/lib/llm/page-docs.ts`.
 */

export interface RaceGuideSegment {
  /** "km 0–10" for most races, "mile 1–6" for US races. */
  section: string;
  terrain: string;
  advice: string;
}

export interface RaceGuide {
  slug: string;
  name: string;
  city: string;
  country: string;
  distanceKm: number;
  /** Month the race is usually held. */
  month: string;
  courseType: "loop" | "point-to-point" | "out-and-back" | "multi-lap";
  terrain: "flat" | "rolling" | "hilly" | "net downhill" | "net uphill";
  /** Only set when a source states it. */
  elevationGainM: number | null;
  elevationLossM: number | null;
  typicalWeather: string | null;
  website: string;
  summary: string;
  courseHighlights: string[];
  paceStrategy: { summary: string; segments: RaceGuideSegment[] };
  fuelingNotes: string;
  tips: string[];
  faq: Array<{ question: string; answer: string }>;
  sources: string[];
  /** Year-month the facts were last checked, e.g. "2026-10". */
  checked: string;
}

const COURSE_TYPE_LABELS: Record<RaceGuide["courseType"], string> = {
  loop: "loop",
  "point-to-point": "point-to-point",
  "out-and-back": "out-and-back",
  "multi-lap": "multi-lap",
};

export function courseTypeLabel(guide: RaceGuide): string {
  return COURSE_TYPE_LABELS[guide.courseType] ?? guide.courseType;
}

/** "42.195 km (marathon)" / "21.1 km (half marathon)". */
export function distanceLabel(guide: RaceGuide): string {
  if (guide.distanceKm > 40) return "42.195 km (marathon)";
  if (guide.distanceKm > 20 && guide.distanceKm < 22) return "21.1 km (half marathon)";
  return `${guide.distanceKm} km`;
}

/** Elevation gain with feet, or null when no source gave a number. */
export function elevationLabel(metres: number | null): string | null {
  if (metres == null) return null;
  return `${Math.round(metres)} m (${Math.round(metres * 3.28084)} ft)`;
}

/**
 * Meta description for a race prep page with a guide. Unique per race and
 * under 160 characters: the shared template description is the same on
 * every race page apart from the name.
 */
export function raceGuideDescription(guide: RaceGuide): string {
  const gain =
    guide.elevationGainM != null ? ` with ${Math.round(guide.elevationGainM)} m of climbing` : "";
  const tail = ". Pacing by section, fueling, and race-day tips.";
  const course = `${guide.terrain} ${courseTypeLabel(guide)} course`;
  const candidates = [
    `${guide.name}: a ${course} in ${guide.city}${gain}${tail}`,
    `${guide.name}: a ${course}${gain}${tail}`,
    `${guide.name}: a ${course}${tail}`,
  ];
  return candidates.find((c) => c.length <= 160) ?? candidates[candidates.length - 1];
}

// ── Loading ────────────────────────────────────────────────────────────────

const GUIDE_DIR = "../../data/race-guides/";

/** Race pages that are the same event as another page share its guide. */
const GUIDE_ALIASES: Record<string, string> = {
  "rbc-brooklyn-half": "brooklyn-half",
};

/** The guide file slug for a race page slug. */
export function raceGuideSlug(slug: string): string {
  return GUIDE_ALIASES[slug] ?? slug;
}

// Created on first use, not at import: vite.config.ts imports page-docs
// (and through it this module) for the route list, and Vite loads its config
// without the import.meta.glob transform.
let loaders: Record<string, () => Promise<RaceGuide>> | undefined;
function guideLoaders() {
  loaders ??= import.meta.glob<RaceGuide>("../../data/race-guides/*.json", {
    import: "default",
  });
  return loaders;
}

/** Whether a race page has a guide, without loading it. */
export function hasRaceGuide(slug: string): boolean {
  return `${GUIDE_DIR}${raceGuideSlug(slug)}.json` in guideLoaders();
}

/** Load one race's guide (its own small chunk), or undefined if none. */
export function loadRaceGuide(slug: string): Promise<RaceGuide | undefined> {
  const load = guideLoaders()[`${GUIDE_DIR}${raceGuideSlug(slug)}.json`];
  return load ? load() : Promise.resolve(undefined);
}
