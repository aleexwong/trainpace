/**
 * Oslo Marathon
 *
 * Norway's capital marathon featuring a city-center course that weaves
 * through historic streets and modern waterfront paths near the Oslofjord.
 */

import type { RaceMetadata, RaceRouteData } from "../types";
import { registerRace } from "../registry";

// ============================================================================
// Metadata (Static - always available)
// ============================================================================

export const osloMetadata: RaceMetadata = {
  id: "oslo",
  name: "Oslo Marathon",
  city: "Oslo",
  country: "Norway",
  region: "europe",
  tier: "gold",
  distance: 42.195,
  elevationGain: 220,
  elevationLoss: 220,
  startElevation: 5,
  endElevation: 5,
  slug: "oslo-marathon",
  raceDate: "September 2026",
  website: "https://oslomaraton.no/",
  description:
    "The Oslo Marathon showcases Norway's capital with a city-center course that weaves through historic streets, modern waterfront paths, and lively spectator zones near the Oslofjord.",
  tips: [
    "Expect variable weather: cool air and wind off the fjord are common",
    "Run by effort on short rollers instead of forcing even splits",
    "Use crowds in the city center to stay relaxed early",
    "Practice fueling in cool conditions; you may drink less than usual",
  ],
  paceStrategy: {
    type: "even-effort",
    summary:
      "Treat Oslo as a steady-effort race. Short rollers and wind exposure can disrupt rhythm, so stay controlled early and aim to finish strong over the final 10K.",
    segments: [
      {
        miles: "1-5",
        terrain: "City center, flat to rolling",
        advice:
          "Start relaxed and let the pack settle. Avoid weaving and pace surges in narrow sections.",
      },
      {
        miles: "6-10",
        terrain: "Waterfront exposure",
        advice:
          "If it's windy, tuck behind groups and run by effort, not pace.",
      },
      {
        miles: "11-16",
        terrain: "Urban rollers",
        advice:
          "Accept small pace fluctuations on short climbs. Keep cadence steady.",
      },
      {
        miles: "17-21",
        terrain: "Mixed city terrain",
        advice:
          "Stay patient and fuel on schedule. This is where discipline matters most.",
      },
      {
        miles: "22-26",
        terrain: "Return to center, crowd support",
        advice:
          "If you've stayed controlled, gradually press the pace and use the crowds to close strong.",
      },
    ],
  },
  fuelingNotes:
    "Cool Scandinavian weather can mute thirst. Set a simple reminder-based fueling plan (for example, every 25-30 minutes) so you stay ahead of energy needs even if you don't feel thirsty.",
  faq: [
    {
      question: "Is the Oslo Marathon course flat?",
      answer:
        "It's best described as gently rolling. There are no massive climbs, but frequent small rises and wind exposure can add up over 42.2 km.",
    },
    {
      question: "What weather should I expect in Oslo?",
      answer:
        "Oslo often delivers cool temperatures and occasional wind, especially near the waterfront. Dress in layers you can adjust just before the start.",
    },
    {
      question: "Should I run even splits in Oslo?",
      answer:
        "Aim for even effort rather than perfectly even splits. Short rollers and wind can make strict pace targets misleading in the moment.",
    },
    {
      question: "How do I register for the Oslo Marathon?",
      answer:
        "Registration typically opens in late autumn/early winter for the following year's race. Check the official website for exact dates and pricing.",
    },
    {
      question: "Is the Oslo Marathon a good race for a PR?",
      answer:
        "Oslo is moderately challenging due to the rolling terrain and potential wind. It's not as fast as Berlin or Valencia, but achievable PRs are common for well-prepared runners.",
    },
  ],
  keywords: [
    "oslo marathon",
    "norway marathon",
    "scandinavian marathon",
    "oslofjord",
    "oslo maraton",
    "european marathon",
  ],
  lastUpdated: "2025-01-27",
};

// ============================================================================
// Route Loader (Lazy - loaded on demand)
// ============================================================================

/**
 * Loads Oslo Marathon route data.
 * This is called lazily when the route data is actually needed.
 */
export async function loadOsloRoute(): Promise<RaceRouteData> {
  // Dynamic import for code splitting
  const routeData = await import("../routes/oslo-route.json");

  return {
    raceId: "oslo",
    thumbnailPoints: routeData.thumbnailPoints,
  };
}

// ============================================================================
// Register with global registry
// ============================================================================

registerRace(osloMetadata, loadOsloRoute);

// ============================================================================
// Named exports for direct imports
// ============================================================================

export default osloMetadata;
