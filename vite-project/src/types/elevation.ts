import { GPXMetadata } from '../lib/gpxMetaData';

export type ProfilePoint = { distanceKm: number; elevation: number };

// Updated types to match the API response
export interface GPXAnalysisResponse {
  message: string;
  raceName: string;
  goalPace: number;
  totalDistanceKm: number;
  elevationGain: number;
  profile: ProfilePoint[];
  elevationInsights: {
    segments: Array<Record<string, unknown>>;
    insights: Record<string, unknown>;
  } | null;
  metadata: {
    pointCount: number;
    hasElevationData: boolean;
    analysisParameters: {
      basePaceMinPerKm: number;
      gradeThreshold: number;
    };
  };
  cacheOptimization?: {
    staticRouteData: {
      elevationProfile: ProfilePoint[];
      totalDistance: number;
      totalElevationGain: number;
      totalElevationLoss: number;
      difficultyRating: string;
      rawSegments: Array<Record<string, unknown>>;
    };
    analysisResults: {
      segmentClassifications: Array<Record<string, unknown>>;
      distanceBreakdown: {
        uphillDistance: number;
        downhillDistance: number;
        flatDistance: number;
      };
      timeEstimate: {
        estimatedTotalTime: number;
      };
      keySegments: {
        steepestUphill: Partial<Segment> | null;
        steepestDownhill: Partial<Segment> | null;
      };
    };
    settings: {
      basePaceMinPerKm: number;
      gradeThreshold: number;
    };
    // cacheStats: {
    //   fullResponseSize: number;
    //   staticDataSize: number;
    //   analysisDataSize: number;
    //   compressionRatio: number;
    // };
  };
}

export interface OptimizedRouteMetadata {
  id: string;
  filename: string;
  safeFilename: string;
  uploadedAt: import("firebase/firestore").Timestamp | null;
  userId?: string; // Owner of the route
  metadata: GPXMetadata;
  displayPoints: Array<{
    lat: number;
    lng: number;
    ele: number;
    dist?: number;
  }>;
  displayUrl: string;
  fileUrl: string;
  fileSize: number;
  // Static route data cached from API
  staticRouteData?: Record<string, unknown>;
  content?: string;
  storageRef?: string;
}

export type SegmentType = "uphill" | "downhill" | "flat";
export type ChallengeRating = "easy" | "moderate" | "hard" | "brutal";
export type RacePosition = "early" | "mid" | "late";
export type EnergyRating = "low" | "medium" | "high";

export interface Segment {
  type: SegmentType;
  startDistance: number;
  endDistance: number;
  startElevation: number;
  endElevation: number;
  grade: number;
  length: number;
  energyRating: EnergyRating;
  pacingAdvice: string;
  estimatedTimeMultiplier: number;
  challengeRating: ChallengeRating;
  racePosition: RacePosition;
}

export interface RouteInsights {
  totalDistance: number;
  uphillDistance: number;
  downhillDistance: number;
  flatDistance: number;
  totalElevationGain: number;
  totalElevationLoss: number;
  steepestUphill: Partial<Segment>;
  steepestDownhill: Partial<Segment>;
  estimatedTotalTime: number;
  difficultyRating: "Easy" | "Medium" | "Hard";
}

export interface ElevationAnalysis {
  segments: Segment[];
  insights: RouteInsights;
}
