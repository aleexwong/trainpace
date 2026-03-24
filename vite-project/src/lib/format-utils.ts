/**
 * Shared formatting utilities
 */

/**
 * Format a Firestore timestamp to a localized date string.
 * Handles null/undefined timestamps and invalid data gracefully.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatTimestamp(timestamp: any): string {
  if (!timestamp) return "Unknown";
  try {
    return timestamp.toDate().toLocaleDateString();
  } catch {
    return "Unknown";
  }
}

/**
 * Format a duration in minutes to a human-readable string (e.g. "2h 30m").
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}
