/**
 * Elevation feature utilities
 */

type ProfileLike = { distanceKm: number; elevation: number };

/**
 * Downsample an elevation profile to at most `maxPoints` using the
 * Largest-Triangle-Three-Buckets (LTTB) algorithm. LTTB preserves the visual
 * shape — peaks and valleys (steep climbs/descents) are kept rather than
 * averaged away — which keeps the rendered profile faithful while drastically
 * cutting the point count Chart.js must hit-test and redraw on hover.
 *
 * Returns the input unchanged when it already fits under the cap, so normal
 * routes are a cheap no-op. First and last points are always retained.
 */
export function downsampleProfile<T extends ProfileLike>(
  data: T[],
  maxPoints: number
): T[] {
  const n = data.length;
  if (maxPoints >= n || maxPoints <= 2) return data;

  const sampled: T[] = [];
  const bucketSize = (n - 2) / (maxPoints - 2);

  let a = 0; // index of the previously selected point
  sampled.push(data[a]); // always keep the first point

  for (let i = 0; i < maxPoints - 2; i++) {
    // Average point of the *next* bucket (used as the triangle's far vertex)
    let avgX = 0;
    let avgY = 0;
    const avgStart = Math.floor((i + 1) * bucketSize) + 1;
    let avgEnd = Math.floor((i + 2) * bucketSize) + 1;
    avgEnd = avgEnd < n ? avgEnd : n;
    const avgLength = avgEnd - avgStart || 1;
    for (let j = avgStart; j < avgEnd; j++) {
      avgX += data[j].distanceKm;
      avgY += data[j].elevation;
    }
    avgX /= avgLength;
    avgY /= avgLength;

    // Pick the point in the current bucket that forms the largest triangle
    // with point `a` and the next bucket's average.
    const rangeStart = Math.floor(i * bucketSize) + 1;
    const rangeEnd = Math.floor((i + 1) * bucketSize) + 1;
    const pointAX = data[a].distanceKm;
    const pointAY = data[a].elevation;

    let maxArea = -1;
    let maxAreaIndex = rangeStart;
    for (let j = rangeStart; j < rangeEnd; j++) {
      const area =
        Math.abs(
          (pointAX - avgX) * (data[j].elevation - pointAY) -
            (pointAX - data[j].distanceKm) * (avgY - pointAY)
        ) * 0.5;
      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = j;
      }
    }

    sampled.push(data[maxAreaIndex]);
    a = maxAreaIndex;
  }

  sampled.push(data[n - 1]); // always keep the last point
  return sampled;
}
