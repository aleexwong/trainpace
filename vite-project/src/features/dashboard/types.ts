import { Timestamp } from "firebase/firestore";

export interface RouteMetadata {
  id: string;
  type: "uploaded" | "bookmarked";
  filename?: string;
  safeFilename?: string;
  routeSlug?: string; // For bookmarked routes (legacy)
  routeKey?: string; // For bookmarked routes (new)
  routeName?: string; // For bookmarked routes
  uploadedAt?: any;
  savedAt?: any; // For bookmarked routes
  schemaVersion?: number; // For migration tracking
  metadata: {
    routeName: string;
    totalDistance: number;
    elevationGain: number;
    pointCount: number;
    bounds?: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    };
  };
  thumbnailPoints: Array<{
    lat: number;
    lng: number;
    ele: number;
    dist?: number;
  }>;
  displayUrl: string;
  fileUrl?: string;
  previewData?: any; // For bookmarked routes
}

export interface FuelPlan {
  id: string;
  userId: string;
  raceType: "10K" | "Half" | "Full";
  weight?: number;
  finishTime: number;
  carbsPerHour: number;
  totalCarbs: number;
  totalCalories: number;
  gelsNeeded: number;
  userContext?: string;
  selectedPresets?: string[];
  aiRecommendations?: Array<{
    headline: string;
    detail: string;
  }>;
  helpful?: boolean;
  createdAt: Timestamp;
}

export interface PacePlan {
  id: string;
  userId: string;
  distance: number;
  units: "km" | "miles";
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  paceType: "km" | "Miles";
  planName?: string;
  notes?: string;
  raceDate?: string;
  trainingDays?: string[]; // Array of selected training days (e.g., ["Monday", "Wednesday", "Friday"])
  paces: {
    race: string;
    easy: string;
    tempo: string;
    interval: string;
    maximum: string;
    speed: string;
    xlong: string;
    yasso: string;
  };
  createdAt: Timestamp;
}

export type DashboardTab = "routes" | "fuel-plans" | "pace-plans";
