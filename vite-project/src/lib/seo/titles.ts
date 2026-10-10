/**
 * Page titles shared by the prerendered HTML (lib/llm/page-docs.ts) and the
 * client <Helmet> tags, so a crawler sees the same title before and after
 * hydration.
 *
 * Kept free of heavy imports: client pages import this file directly
 * (`@/lib/seo/titles`), and pulling page-docs or seoPages into a page chunk
 * would drag every page's content along with it.
 */

/** Google truncates titles past roughly this many characters. */
export const MAX_TITLE_LENGTH = 60;

/**
 * The first candidate that fits in MAX_TITLE_LENGTH. List candidates from most
 * to least descriptive; the last one is returned as-is if none fit, so make it
 * short.
 */
export function fitTitle(...candidates: string[]): string {
  return (
    candidates.find((c) => c.length <= MAX_TITLE_LENGTH) ??
    candidates[candidates.length - 1]
  );
}

export const STATIC_PAGE_TITLES = {
  "/": "TrainPace – Free Running Pace Calculator & Race Tools",
  "/calculator": "Running Pace Calculator – VDOT Training Zones | TrainPace",
  "/vdot": "VDOT Calculator – Fitness Score & Race Times | TrainPace",
  "/plan": "Training Plan Builder – Free 5K to Marathon | TrainPace",
  "/fuel": "Marathon Fuel Calculator – How Many Gels? | TrainPace",
  "/elevation-finder": "GPX Elevation Profile Viewer & Analyzer | TrainPace",
  "/race": "Race Prep Pages – Pacing, Fueling, Elevation | TrainPace",
  "/mcp": "MCP Server - TrainPace Tools for AI Agents",
  "/blog": "Running Blog – Training, Racing & Nutrition | TrainPace",
  "/about": "About TrainPace – Why a Runner Built It",
  "/faq": "TrainPace FAQ – Pace, GPX & Fuel Planning Help",
  "/privacy": "Privacy Policy | TrainPace",
  "/terms": "Terms of Service | TrainPace",
} as const;

/** `seoTitle` overrides `title` for posts whose headline is too long on its own. */
export function blogPostTitle(post: { title: string; seoTitle?: string }): string {
  const t = post.seoTitle ?? post.title;
  return fitTitle(`${t} | TrainPace Blog`, `${t} | TrainPace`, t);
}

export function previewRouteTitle(marathonName: string): string {
  return fitTitle(
    `${marathonName} Elevation Profile – Course Map & Hills | TrainPace`,
    `${marathonName} Elevation Profile & Course Map | TrainPace`,
    `${marathonName} Elevation Profile | TrainPace`
  );
}

export function racePrepTitle(raceName: string): string {
  return fitTitle(
    `${raceName} Race Prep – Pace, Fueling & Course | TrainPace`,
    `${raceName} Race Prep – Pace & Fueling | TrainPace`,
    `${raceName} Race Prep | TrainPace`,
    `${raceName} – Pace & Fueling Plan`
  );
}
