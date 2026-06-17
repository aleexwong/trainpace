/**
 * @trainpace/core — shared types
 */

/** Output unit for formatted paces. Inputs to the library are always meters. */
export type PaceOutputUnit = "km" | "miles";

/** Daniels training zone, formatted for display. */
export interface TrainingZone {
  name: string;
  shortName: string;
  description: string;
  pacePerKm: string;
  pacePerMile: string;
  intensityRange: string;
  color: string;
}

/** Race equivalency prediction from a VDOT value. */
export interface RacePrediction {
  name: string;
  distance: number; // meters
  time: string; // formatted HH:MM:SS
  timeSeconds: number;
  pace: string; // pace per km or mile, formatted
}

/** Heart-rate training zones derived from age. */
export interface HeartRateZones {
  maxHR: number;
  easyZone: string;
  tempoZone: string;
  intervalZone: string;
  maximumZone: string;
}

/** Optional pace adjustments for conditions. */
export interface PaceAdjustments {
  weather?: {
    temperature: number;
    adjustedEasyPace?: string;
    message: string;
  };
}

/** Base training paces from a race time. */
export interface PaceResultsBase {
  race: string;
  easy: string;
  tempo: string;
  interval: string;
  maximum: string;
  speed: string;
  xlong: string;
  yasso: string;
}

/** Full training-pace result, with optional HR zones and adjustments. */
export interface PaceResults extends PaceResultsBase {
  heartRateZones?: HeartRateZones;
  adjustments?: PaceAdjustments;
}

/** A parsed GPX track point. */
export interface GpxPoint {
  lat: number;
  lng: number;
  ele?: number;
}

/** Summary metadata for a GPX route. */
export interface GpxMetadata {
  routeName: string;
  totalDistance: number; // km
  elevationGain: number; // m
  maxElevation: number | null; // m
  minElevation: number | null; // m
  pointCount: number;
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  hasElevationData: boolean;
}
