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
    segments: Array<any>;
    insights: any;
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
      rawSegments: Array<any>;
    };
    analysisResults: {
      segmentClassifications: Array<any>;
      distanceBreakdown: {
        uphillDistance: number;
        downhillDistance: number;
        flatDistance: number;
      };
      timeEstimate: {
        estimatedTotalTime: number;
      };
      keySegments: {
        steepestUphill: any;
        steepestDownhill: any;
      };
    };
    settings: {
      basePaceMinPerKm: number;
      gradeThreshold: number;
    };
    cacheStats: {
      fullResponseSize: number;
      staticDataSize: number;
      analysisDataSize: number;
      compressionRatio: number;
    };
  };
}

export interface OptimizedRouteMetadata {
  id: string;
  filename: string;
  safeFilename: string;
  uploadedAt: any;
  metadata: {
    routeName: string;
    totalDistance: number;
    elevationGain: number;
    pointCount: number;
    bounds: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    };
  };
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
  staticRouteData?: any;
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
