/**
 * Fuel Planner - Core Types & Constants
 */

export const RACE_SETTINGS = {
  "10K": 30,
  Half: 45,
  Full: 75,
} as const;

export type RaceType = keyof typeof RACE_SETTINGS;

export interface FuelPlanResult {
  carbsPerHour: number;
  totalCarbs: number;
  totalCalories: number;
  gelsNeeded: number;
}

export interface FuelPlanInputs {
  raceType: RaceType;
  weight: string;
  timeHours: string;
  timeMinutes: string;
}

export interface AIRecommendation {
  headline: string;
  detail: string;
}

export interface FuelContextPreset {
  id: string;
  icon: string;
  label: string;
  value: string;
}

export const FUEL_CONTEXT_PRESETS: FuelContextPreset[] = [
  {
    id: "bonking-late",
    icon: "😰",
    label: "Bonking late",
    value: "I typically bonk around the 30-32km mark with sudden energy crashes.",
  },
  {
    id: "gi-issues",
    icon: "🤢",
    label: "GI issues",
    value: "I experience nausea and stomach cramps when I take gels.",
  },
  {
    id: "hot-weather",
    icon: "🌡️",
    label: "Hot weather",
    value: "I'm racing in hot conditions (26°C/80°F+) and tend to sweat heavily.",
  },
  {
    id: "first-timer",
    icon: "🎯",
    label: "First timer",
    value: "This is my first time racing this distance and I need a beginner-friendly fueling approach.",
  },
  {
    id: "real-food",
    icon: "🍌",
    label: "Prefer real food",
    value: "I prefer real food like bananas or energy bars instead of gels.",
  },
  {
    id: "no-appetite",
    icon: "😐",
    label: "No appetite",
    value: "I lose my appetite during runs and struggle to force food down.",
  },
  {
    id: "caffeine",
    icon: "☕",
    label: "Caffeine sensitive",
    value: "Caffeine makes me jittery or causes GI issues.",
  },
  {
    id: "fasted",
    icon: "⏰",
    label: "Train fasted",
    value: "I usually train fasted and need help transitioning to race-day fueling.",
  },
];

// Calculation constants
export const CALORIES_PER_GRAM_CARB = 4;
export const CARBS_PER_KG_MULTIPLIER = 0.7;
export const GELS_PER_HOUR = 1.5;
export const MAX_GELS = 7;
export const MIN_10K_TIME_FOR_GEL = 0.75; // 45 minutes in hours
export const AI_COOLDOWN_SECONDS = 30;
