export interface CoursePoint {
  lat: number;
  lng: number;
  ele: number;
  dist: number; // km from start
}

export interface CourseStrategySegment {
  miles: string;
  terrain: string;
  advice: string;
}

export interface RaceCourse {
  key: string;
  name: string;
  city: string;
  country: string;
  distance: number; // km
  elevationGain: number;
  elevationLoss: number;
  thumbnailPoints: CoursePoint[];
  paceStrategy?: {
    type: string;
    summary: string;
    segments?: CourseStrategySegment[];
  };
  fuelingNotes?: string;
}

export interface SimSegment {
  startKm: number;
  endKm: number;
  distKm: number;
  elevationChangeM: number;
  gradePercent: number;
  gapFactor: number;
  predictedPaceSecPerKm: number;
  predictedTimeSeconds: number;
  cumulativeTimeSeconds: number;
}

export interface Checkpoint {
  label: string;
  distKm: number;
  cumulativeTimeSeconds: number;
  paceSecPerKm: number;
  elevationM: number;
}

export interface SimulationResult {
  goalTimeSeconds: number;
  flatEquivPaceSecPerKm: number;
  flatEquivMarathonTimeSeconds: number; // fitness needed to run this course in goalTime
  courseDifficultyFactorPercent: number; // how much harder vs flat, as a %
  segments: SimSegment[];
  checkpoints: Checkpoint[];
  hardestSegmentIndex: number;
  fastestSegmentIndex: number;
  totalElevationGain: number;
  totalElevationLoss: number;
}
