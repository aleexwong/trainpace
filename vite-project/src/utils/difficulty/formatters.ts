/**
 * Formatting utilities for difficulty view
 * Supports metric/imperial units and locale-aware number formatting
 */

export type UnitSystem = "metric" | "imperial";

interface FormatOptions {
  units?: UnitSystem;
  locale?: string;
}

const KM_TO_MILES = 0.621371;
const M_TO_FEET = 3.28084;

/**
 * Formats time in minutes to human-readable string
 * @param minutes - Time in minutes
 * @returns Formatted time (e.g., "2h 30m", "45m")
 */
export function formatTime(minutes: number): string {
  const totalMinutes = Math.round(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

/**
 * Formats pace based on multiplier and base pace
 * @param multiplier - Time multiplier for segment
 * @param basePace - Base pace in min/km
 * @param options - Formatting options
 * @returns Formatted pace string
 */
export function formatPace(
  multiplier: number,
  basePace: number,
  options: FormatOptions = {}
): string {
  const { units = "metric" } = options;
  
  const adjustedPace = basePace * multiplier;
  
  // Convert to minutes per mile if imperial
  const pace = units === "imperial" ? adjustedPace / KM_TO_MILES : adjustedPace;
  
  let minutes = Math.floor(pace);
  let seconds = Math.round((pace - minutes) * 60);
  
  if (seconds === 60) {
    minutes += 1;
    seconds = 0;
  }
  
  const unit = units === "imperial" ? "mi" : "km";
  return `${minutes}:${seconds.toString().padStart(2, "0")}/${unit}`;
}

/**
 * Formats distance with appropriate precision
 * @param distanceKm - Distance in kilometers
 * @param options - Formatting options
 * @returns Formatted distance with unit
 */
export function formatDistance(
  distanceKm: number,
  options: FormatOptions = {}
): string {
  const { units = "metric", locale = "en-US" } = options;
  
  const distance = units === "imperial" ? distanceKm * KM_TO_MILES : distanceKm;
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  
  const unit = units === "imperial" ? "mi" : "km";
  return `${formatter.format(distance)} ${unit}`;
}

/**
 * Formats elevation with appropriate unit
 * @param elevationM - Elevation in meters
 * @param options - Formatting options
 * @returns Formatted elevation with unit
 */
export function formatElevation(
  elevationM: number,
  options: FormatOptions = {}
): string {
  const { units = "metric", locale = "en-US" } = options;
  
  const elevation = units === "imperial" ? elevationM * M_TO_FEET : elevationM;
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  const unit = units === "imperial" ? "ft" : "m";
  return `${formatter.format(elevation)}${unit}`;
}

/**
 * Formats percentage with locale-aware number formatting
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places
 * @param locale - Locale for formatting
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  locale: string = "en-US"
): string {
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return `${formatter.format(value)}%`;
}

/**
 * Formats a distance label for display (e.g., "KM 5.0 − 10.5")
 * @param startKm - Start distance in km
 * @param endKm - End distance in km
 * @param options - Formatting options
 * @returns Formatted distance range label
 */
export function formatDistanceRange(
  startKm: number,
  endKm: number,
  options: FormatOptions = {}
): string {
  const { units = "metric", locale = "en-US" } = options;
  
  const start = units === "imperial" ? startKm * KM_TO_MILES : startKm;
  const end = units === "imperial" ? endKm * KM_TO_MILES : endKm;
  
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  
  const unit = units === "imperial" ? "MI" : "KM";
  return `${unit} ${formatter.format(start)} − ${formatter.format(end)}`;
}
