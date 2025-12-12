/**
 * Elevation Feature - Core Types & Constants
 */

export interface ProfilePoint {
  distanceKm: number;
  elevation: number;
}

export interface OptimizedRouteMetadata {
  userId?: string;
  filename: string;
  safeFilename?: string;
  fileSize: number;
  fileUrl: string;
  storageRef?: string;
  fileHash?: string;
  uploadedAt: any;
  contentValidated?: boolean;
  deleted?: boolean;
  metadata: RouteMetadata;
  displayPoints: Array<{ lat: number; lng: number; ele?: number }>;
  thumbnailPoints?: Array<{ lat: number; lng: number }>;
  docId?: string;
  displayUrl?: string;
  content?: string;
  staticRouteData?: StaticRouteData;
  staticDataCached?: string;
  staticDataSize?: number;
}

export interface RouteMetadata {
  routeName: string;
  totalDistance: number;
  elevationGain: number;
  maxElevation: number | null;
  minElevation: number | null;
  pointCount: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  hasElevationData: boolean;
}

export interface StaticRouteData {
  totalDistance: number;
  totalElevationGain: number;
  totalElevationLoss: number;
  difficultyRating: string;
  elevationProfile: ProfilePoint[];
  rawSegments: any[];
}

export interface GPXAnalysisResponse {
  message: string;
  raceName: string;
  goalPace: number;
  totalDistanceKm: number;
  elevationGain: number;
  profile: ProfilePoint[];
  elevationInsights: ElevationAnalysis;
  metadata: {
    pointCount: number;
    hasElevationData: boolean;
    analysisParameters?: AnalysisSettings;
  };
  cacheOptimization?: {
    staticRouteData: StaticRouteData;
    analysisResults: any;
    settings: AnalysisSettings;
  };
}

export interface ElevationAnalysis {
  segments: Segment[];
  insights: RouteInsights;
}

export interface Segment {
  startDistance: number;
  endDistance: number;
  length: number;
  type: SegmentType;
  grade: number;
  startElevation: number;
  endElevation: number;
  challengeRating: ChallengeRating;
  energyRating: EnergyRating;
  racePosition: RacePosition;
  estimatedTimeMultiplier: number;
  pacingAdvice: string;
}

export interface RouteInsights {
  totalDistance: number;
  totalElevationGain: number;
  totalElevationLoss: number;
  difficultyRating: "Easy" | "Medium" | "Hard";
  uphillDistance: number;
  downhillDistance: number;
  flatDistance: number;
  steepestUphill: Partial<Segment>;
  steepestDownhill: Partial<Segment>;
  estimatedTotalTime: number;
}

export type SegmentType = "uphill" | "downhill" | "flat";
export type ChallengeRating = "easy" | "moderate" | "hard" | "brutal";
export type EnergyRating = "low" | "medium" | "high";
export type RacePosition = "early" | "mid" | "late";

export interface AnalysisSettings {
  basePaceMinPerKm: number;
  gradeThreshold: number;
}

// Constants
export const DEFAULT_ANALYSIS_SETTINGS: AnalysisSettings = {
  basePaceMinPerKm: 5,
  gradeThreshold: 2,
};

export const API_ENDPOINTS = {
  // ANALYZE_GPX: "https://api.trainpace.com/api/analyze-gpx-cache", // Production
  ANALYZE_GPX: "http://localhost:3000/api/analyze-gpx-cache", // Dev
};

export const CACHE_SETTINGS = {
  EXPIRY_YEARS: 10,
  MIN_API_INTERVAL: 2000, // 2 seconds between API calls
};

export const FILE_SETTINGS = {
  MAX_SIZE_MB: 10,
  MAX_UPLOADS_PER_DAY: 15,
  MAX_UPLOADS_PER_HOUR: 10,
  ALLOWED_TYPES: [".gpx"],
  CONTENT_STORAGE_THRESHOLD: 1024 * 1024, // 1MB
};
