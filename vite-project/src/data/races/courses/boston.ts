/**
 * Boston Marathon
 *
 * One of the World Marathon Majors, known for its qualifying standards
 * and the famous Heartbreak Hill.
 */

import type { RaceMetadata, RaceRouteData } from "../types";
import { registerRace } from "../registry";

// ============================================================================
// Metadata (Static - always available)
// ============================================================================

export const bostonMetadata: RaceMetadata = {
  id: "boston",
  name: "Boston Marathon",
  city: "Boston",
  country: "Massachusetts, USA",
  region: "north-america",
  tier: "world-major",
  raceType: "marathon",
  distance: 42.195,
  elevationGain: 156,
  elevationLoss: 245,
  startElevation: 150,
  endElevation: 10,
  slug: "rIeYOrMr0HWRUVkefPSp",
  raceDate: "April 20, 2026",
  website: "https://www.baa.org/",
  description:
    "The Boston Marathon is one of the World Marathon Majors and features a challenging point-to-point course from Hopkinton to Boston. Known for its qualifying standards and historic significance, the course includes the famous Heartbreak Hill between miles 20-21.",
  tips: [
    "Train on hills - Heartbreak Hill comes at mile 20",
    "Negative split strategy recommended due to net downhill",
    "Weather can be unpredictable in April",
    "Qualifying time required for entry",
  ],
  paceStrategy: {
    type: "negative-split",
    summary:
      "Start conservative despite downhill opening. Save energy for Newton Hills (miles 16-21), then use the final downhill miles to close strong.",
    segments: [
      {
        miles: "1-5",
        terrain: "Downhill",
        advice:
          "Resist the temptation to bank time. Run 10-15 sec/mile slower than goal pace.",
      },
      {
        miles: "6-10",
        terrain: "Rolling",
        advice:
          "Settle into goal pace. Stay relaxed through Framingham and Natick.",
      },
      {
        miles: "11-15",
        terrain: "Flat to rolling",
        advice:
          "Maintain rhythm. Wellesley College crowds will energize you at mile 13.",
      },
      {
        miles: "16-20",
        terrain: "Newton Hills",
        advice:
          "Run by effort, not pace. Expect to slow 15-30 sec/mile. This is where races are lost.",
      },
      {
        miles: "20-21",
        terrain: "Heartbreak Hill",
        advice:
          "Stay mentally strong. Shorten stride, maintain cadence. Don't surge at the top.",
      },
      {
        miles: "22-26",
        terrain: "Downhill",
        advice:
          "Let gravity help. Pick up pace gradually. Trust your training.",
      },
    ],
  },
  fuelingNotes:
    "Take an extra gel at mile 15-16 before Newton Hills. The climbs increase energy demand significantly. Consider salt tabs if racing in warmer conditions.",
  faq: [
    {
      question: "How hilly is the Boston Marathon?",
      answer:
        "Boston has 156m (512ft) of elevation gain, with the famous Newton Hills from miles 16-21 including Heartbreak Hill. Despite being net downhill (140m drop), the late hills make it challenging.",
    },
    {
      question: "Is Boston Marathon good for a PR?",
      answer:
        "Boston is harder than flat courses like Chicago or Berlin due to the Newton Hills coming when you're already fatigued. Most runners find it 2-5 minutes slower than their flat marathon potential.",
    },
    {
      question: "What is Heartbreak Hill?",
      answer:
        "Heartbreak Hill is the fourth and final hill in the Newton Hills section, located between miles 20-21. It rises about 27m (88ft) over 0.4 miles. The name comes from the 1936 race when Johnny Kelley's heart was 'broken' after being passed here.",
    },
    {
      question: "What pace should I run at Boston?",
      answer:
        "Start 10-15 seconds per mile slower than goal pace for the first 5 miles. The downhill start tempts fast early splits that you'll pay for on the Newton Hills.",
    },
  ],
  keywords: [
    "boston marathon",
    "heartbreak hill",
    "newton hills",
    "world major",
    "bq",
    "boston qualifier",
    "hopkinton",
  ],
  lastUpdated: "2025-01-27",
};

// ============================================================================
// Route Loader (Lazy - loaded on demand)
// ============================================================================

/**
 * Loads Boston Marathon route data.
 * This is called lazily when the route data is actually needed.
 */
export async function loadBostonRoute(): Promise<RaceRouteData> {
  // Dynamic import for code splitting
  const routeData = await import("../routes/boston-route.json");

  return {
    raceId: "boston",
    thumbnailPoints: routeData.thumbnailPoints,
    firestoreDocId: "rIeYOrMr0HWRUVkefPSp",
  };
}

// ============================================================================
// Register with global registry
// ============================================================================

registerRace(bostonMetadata, loadBostonRoute);

// ============================================================================
// Named exports for direct imports
// ============================================================================

export default bostonMetadata;
