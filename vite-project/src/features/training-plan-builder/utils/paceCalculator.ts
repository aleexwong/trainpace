/**
 * Pace Calculator for Training Plans
 */

import type { WorkoutType, TrainingDistance } from "../types";
import { PACE_ADJUSTMENTS } from "./workoutTemplates";

/**
 * Convert total seconds to pace string (MM:SS/km)
 */
export function secondsToPaceString(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}

/**
 * Convert pace string to seconds per km
 */
export function paceStringToSeconds(paceString: string): number {
  const match = paceString.match(/(\d+):(\d+)/);
  if (!match) return 0;
  const [, minutes, seconds] = match;
  return parseInt(minutes) * 60 + parseInt(seconds);
}

/**
 * Calculate goal race pace from goal time and distance
 */
export function calculateRacePace(
  goalTimeSeconds: number,
  distance: TrainingDistance
): number {
  const distanceKm = {
    "5K": 5,
    "10K": 10,
    Half: 21.1,
    Marathon: 42.2,
  }[distance];

  return goalTimeSeconds / distanceKm; // seconds per km
}

/**
 * Calculate workout pace based on race pace and workout type
 */
export function calculateWorkoutPace(
  racePaceSecondsPerKm: number,
  workoutType: WorkoutType
): string {
  const adjustment = PACE_ADJUSTMENTS[workoutType];
  const workoutPace = racePaceSecondsPerKm + adjustment;
  return secondsToPaceString(workoutPace);
}

/**
 * Calculate all training paces from goal time
 */
export function calculateTrainingPaces(
  goalTimeSeconds: number,
  distance: TrainingDistance
): Record<WorkoutType, string> {
  const racePace = calculateRacePace(goalTimeSeconds, distance);

  return {
    easy: calculateWorkoutPace(racePace, "easy"),
    long: calculateWorkoutPace(racePace, "long"),
    tempo: calculateWorkoutPace(racePace, "tempo"),
    intervals: calculateWorkoutPace(racePace, "intervals"),
    hills: calculateWorkoutPace(racePace, "hills"),
    fartlek: calculateWorkoutPace(racePace, "fartlek"),
    recovery: calculateWorkoutPace(racePace, "recovery"),
    race_pace: secondsToPaceString(racePace),
    rest: "N/A",
    cross_training: "N/A",
  };
}

/**
 * Validate if goal time is realistic for the distance and experience level
 */
export function validateGoalTime(
  goalTimeSeconds: number,
  distance: TrainingDistance,
  experienceLevel: string
): { isValid: boolean; message?: string } {
  const racePace = calculateRacePace(goalTimeSeconds, distance);

  // Very ambitious: <3:30/km for any distance
  if (racePace < 210) {
    return {
      isValid: false,
      message:
        "This goal time is extremely ambitious (sub-3:30/km pace). Consider adjusting your goal.",
    };
  }

  // Unrealistic: <3:00/km for any distance
  if (racePace < 180) {
    return {
      isValid: false,
      message:
        "This goal time is unrealistic (sub-3:00/km pace). Please enter a more achievable goal.",
    };
  }

  // Very slow: >10:00/km might indicate data entry error
  if (racePace > 600) {
    return {
      isValid: false,
      message:
        "This pace is very slow (over 10:00/km). Please verify your goal time is correct.",
    };
  }

  return { isValid: true };
}

/**
 * Format time in seconds to HH:MM:SS
 */
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Calculate estimated finish time based on distance and pace
 */
export function calculateFinishTime(distanceKm: number, paceSecondsPerKm: number): number {
  return distanceKm * paceSecondsPerKm;
}

/**
 * Convert time inputs to total seconds
 */
export function timeInputsToSeconds(hours: string, minutes: string, seconds: string): number {
  const h = parseInt(hours) || 0;
  const m = parseInt(minutes) || 0;
  const s = parseInt(seconds) || 0;
  return h * 3600 + m * 60 + s;
}
