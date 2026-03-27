import type { Timestamp } from "firebase/firestore";

export interface StravaTokens {
  access_token: string;
  refresh_token: string;
  /** Unix timestamp (seconds) when access_token expires */
  expires_at: number;
}

export interface StravaAthleteBasic {
  id: number;
  firstname: string;
  lastname: string;
  profile_medium: string; // Avatar URL
  city?: string;
  country?: string;
}

/** Stored in Firestore under users/{uid}/integrations/strava */
export interface StravaConnection {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete_id: number;
  athlete_name: string;
  athlete_avatar?: string;
  connected_at: Timestamp;
}

/**
 * Strava workout_type values for runs:
 * 0 = default, 1 = Race, 2 = Long Run, 3 = Workout
 */
export const STRAVA_WORKOUT_TYPES = {
  DEFAULT: 0,
  RACE: 1,
  LONG_RUN: 2,
  WORKOUT: 3,
} as const;

export interface StravaActivity {
  id: number;
  name: string;
  sport_type: string; // "Run", "Ride", "Walk", etc.
  start_date: string; // ISO 8601
  start_date_local: string;
  distance: number; // metres
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // metres
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_heartrate?: number;
  max_heartrate?: number;
  workout_type?: number;
  suffer_score?: number;
  map: {
    id: string;
    summary_polyline: string;
    resource_state: number;
  };
}

/** Stored in Firestore under users/{uid}/strava_activities/{id} */
export interface StoredStravaActivity extends StravaActivity {
  userId: string;
  importedAt: Timestamp;
}

export interface StravaActivitySummary {
  id: number;
  name: string;
  sport_type: string;
  start_date_local: string;
  distance_km: number;
  pace_per_km?: string; // "mm:ss" per km, only for runs
  moving_time_s: number;
  elevation_gain_m: number;
  is_race: boolean;
  average_heartrate?: number;
}
