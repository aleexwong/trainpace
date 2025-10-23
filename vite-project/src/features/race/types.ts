/**
 * Race Feature - Core Types & Constants
 *
 * Defines the structure for complete race plans that combine:
 * - Route data (from elevation feature)
 * - Pace strategy (from pace calculator)
 * - Fuel planning (from fuel feature)
 */

import { Timestamp } from "firebase/firestore";

// ============================================================================
// Core Race Plan Types
// ============================================================================

export type RaceType = "5K" | "10K" | "Half" | "Full" | "Custom";
export type RaceStatus = "draft" | "finalized" | "completed";
export type RouteSource = "public" | "uploaded" | "manual";

export interface RacePlan {
  id: string;
  userId: string;

  // Core Info
  name: string;
  date: Date | null;
  raceType: RaceType;

  // Route Information
  routeSource: RouteSource;
  routeId: string | null; // null if manual entry
  routeMetadata: RouteMetadata;

  // Target
  targetTime: number; // minutes

  // Generated Plans (auto-calculated)
  paceStrategy: PaceStrategy;
  fuelPlan: FuelPlanSummary;
  elevationInsights?: ElevationInsightsSummary;

  // Optional
  notes?: string;
  weather?: WeatherConditions;
  goal?: "finish" | "time" | "pr";

  // Status & Completion
  status: RaceStatus;
  completedTime?: number; // actual time in minutes
  reflection?: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Route Metadata (embedded from elevation feature)
// ============================================================================

export interface RouteMetadata {
  name: string;
  distance: number; // km
  elevationGain: number; // meters
  city?: string;
  country?: string;
  hasElevationData: boolean;
}

// ============================================================================
// Pace Strategy (calculated from pace calculator + elevation)
// ============================================================================

export interface PaceStrategy {
  // Base paces
  racePace: string; // "5:20/km"
  easyPace: string; // "6:30/km"
  tempoPace: string; // "5:40/km"

  // Elevation-adjusted splits (optional, if GPX has elevation)
  splits?: PaceSplit[];
}

export interface PaceSplit {
  km: number;
  targetPace: string; // "5:35/km"
  terrainType: "flat" | "uphill" | "downhill";
  advice: string; // "Ease up on the climb"
}

// ============================================================================
// Fuel Plan (calculated from fuel feature)
// ============================================================================

export interface FuelPlanSummary {
  carbsPerHour: number;
  totalCarbs: number;
  totalCalories: number;
  gelsNeeded: number;

  // Timing recommendations
  schedule: FuelScheduleItem[];
}

export interface FuelScheduleItem {
  km: number;
  time: string; // "1:15:00"
  action: string; // "Take gel + 200ml water"
  note?: string; // "Before big climb"
}

// ============================================================================
// Elevation Insights (optional, from elevation feature)
// ============================================================================

export interface ElevationInsightsSummary {
  totalElevationGain: number;
  totalElevationLoss: number;
  difficultyRating: "Easy" | "Medium" | "Hard";
  uphillDistance: number;
  downhillDistance: number;
  flatDistance: number;
  steepestClimb?: ClimbInfo;
}

export interface ClimbInfo {
  startKm: number;
  endKm: number;
  grade: number;
  elevationGain: number;
}

// ============================================================================
// Weather (optional)
// ============================================================================

export interface WeatherConditions {
  temperature: number; // Celsius
  humidity: number; // 0-100
  conditions: "sunny" | "cloudy" | "rainy" | "windy";
  notes?: string;
}

// ============================================================================
// Race Plan Inputs (for creation)
// ============================================================================

export interface RacePlanInputs {
  name: string;
  date: Date | null;
  raceType: RaceType;

  // Route selection
  routeSource: RouteSource;
  routeId: string | null;

  // Target time
  targetTimeHours: string;
  targetTimeMinutes: string;
  targetTimeSeconds: string;

  // Optional
  notes?: string;
  goal?: "finish" | "time" | "pr";
}

// ============================================================================
// Public Route (for featured marathons)
// ============================================================================

export interface PublicRoute {
  id: string;
  name: string;
  city: string;
  country: string;
  date?: string; // Race date if known

  featured: boolean;
  popularity: number; // View count

  // Link to GPX data
  gpxUploadId: string;

  // Route metadata
  metadata: {
    totalDistance: number;
    elevationGain: number;
    routeName: string;
    pointCount: number;
  };

  thumbnailPoints: Array<{
    lat: number;
    lng: number;
    ele?: number;
  }>;

  displayUrl: string;
}

// ============================================================================
// Constants
// ============================================================================

export const RACE_TYPE_DISTANCES: Record<RaceType, number> = {
  "5K": 5,
  "10K": 10,
  Half: 21.1,
  Full: 42.2,
  Custom: 0, // User-defined
};

export const RACE_TYPE_LABELS: Record<RaceType, string> = {
  "5K": "5K",
  "10K": "10K",
  Half: "Half Marathon",
  Full: "Full Marathon",
  Custom: "Custom Distance",
};

export const DEFAULT_PACE_STRATEGY: PaceStrategy = {
  racePace: "5:30/km",
  easyPace: "6:30/km",
  tempoPace: "5:45/km",
};

export const DEFAULT_FUEL_PLAN: FuelPlanSummary = {
  carbsPerHour: 60,
  totalCarbs: 0,
  totalCalories: 0,
  gelsNeeded: 0,
  schedule: [],
};
