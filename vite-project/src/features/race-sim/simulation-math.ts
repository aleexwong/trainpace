import type { CoursePoint, SimSegment, Checkpoint, SimulationResult } from "./types";

// Minetti et al. energy cost of running on slopes.
// g: grade as decimal fraction (0.05 = 5% uphill)
// Returns ratio of energy cost relative to flat running.
function gapFactor(grade: number): number {
  const g = Math.max(-0.3, Math.min(0.45, grade));
  const ec = 155.4 * g ** 5 - 30.4 * g ** 4 - 43.3 * g ** 3 + 46.3 * g ** 2 + 19.5 * g + 3.6;
  return ec / 3.6;
}

const MARATHON_DIST = 42.195;
const HALF_DIST = 21.0975;

// Slice course points to a target distance (for half marathon mode).
export function slicePointsToDistance(
  points: CoursePoint[],
  targetKm: number
): CoursePoint[] {
  const sliced: CoursePoint[] = [];
  for (const p of points) {
    if (p.dist <= targetKm) {
      sliced.push(p);
    } else {
      // Interpolate a final point at exactly targetKm
      const prev = sliced[sliced.length - 1];
      if (!prev) break;
      const frac = (targetKm - prev.dist) / (p.dist - prev.dist);
      sliced.push({
        lat: prev.lat + (p.lat - prev.lat) * frac,
        lng: prev.lng + (p.lng - prev.lng) * frac,
        ele: prev.ele + (p.ele - prev.ele) * frac,
        dist: targetKm,
      });
      break;
    }
  }
  return sliced;
}

export function simulate(
  points: CoursePoint[],
  goalTimeSeconds: number,
  distanceKm: number = MARATHON_DIST
): SimulationResult {
  if (points.length < 2) throw new Error("Need at least 2 course points");

  // Build raw segments from consecutive thumbnail points
  const segments: SimSegment[] = [];
  let totalFlatEquivKm = 0;
  let totalGain = 0;
  let totalLoss = 0;

  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const distKm = p1.dist - p0.dist;
    if (distKm <= 0) continue;

    const elevChange = p1.ele - p0.ele;
    const grade = elevChange / (distKm * 1000); // rise over run
    const factor = gapFactor(grade);
    const flatEquivKm = distKm * factor;

    totalFlatEquivKm += flatEquivKm;
    if (elevChange > 0) totalGain += elevChange;
    else totalLoss += Math.abs(elevChange);

    segments.push({
      startKm: p0.dist,
      endKm: p1.dist,
      distKm,
      elevationChangeM: elevChange,
      gradePercent: grade * 100,
      gapFactor: factor,
      predictedPaceSecPerKm: 0, // filled below
      predictedTimeSeconds: 0,
      cumulativeTimeSeconds: 0,
    });
  }

  // Even-effort flat pace that produces exactly goalTime
  const flatEquivPace = goalTimeSeconds / totalFlatEquivKm;

  // Apply to each segment
  let cumTime = 0;
  let hardestIdx = 0;
  let fastestIdx = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    seg.predictedPaceSecPerKm = flatEquivPace * seg.gapFactor;
    seg.predictedTimeSeconds = seg.predictedPaceSecPerKm * seg.distKm;
    cumTime += seg.predictedTimeSeconds;
    seg.cumulativeTimeSeconds = cumTime;

    if (seg.predictedPaceSecPerKm > segments[hardestIdx].predictedPaceSecPerKm) {
      hardestIdx = i;
    }
    if (seg.predictedPaceSecPerKm < segments[fastestIdx].predictedPaceSecPerKm) {
      fastestIdx = i;
    }
  }

  // Checkpoints differ by race distance
  const isHalf = distanceKm <= HALF_DIST + 0.5;
  const checkpointDists = isHalf
    ? [5, 10, 15, 20, 21.0975]
    : [5, 10, 15, 20, 21.0975, 25, 30, 35, 40, 42.195];
  const checkpointLabels = isHalf
    ? ["5K", "10K", "15K", "20K", "Finish"]
    : ["5K", "10K", "15K", "20K", "Half", "25K", "30K", "35K", "40K", "Finish"];

  const totalDist = points[points.length - 1].dist;

  const checkpoints: Checkpoint[] = checkpointDists
    .filter((d) => d <= totalDist + 0.1)
    .map((dist, idx) => {
      // Find cumulative time at this distance by interpolating segments
      let cumT = 0;
      let elevAtDist = points[0].ele;

      for (const seg of segments) {
        if (seg.endKm <= dist) {
          cumT = seg.cumulativeTimeSeconds;
          // interpolate elevation from points
          const matchPt = points.find((p) => Math.abs(p.dist - seg.endKm) < 0.01);
          if (matchPt) elevAtDist = matchPt.ele;
        } else if (seg.startKm < dist) {
          // partial segment
          const fraction = (dist - seg.startKm) / seg.distKm;
          const prevCum = seg.cumulativeTimeSeconds - seg.predictedTimeSeconds;
          cumT = prevCum + seg.predictedTimeSeconds * fraction;
          break;
        }
      }

      return {
        label: checkpointLabels[idx],
        distKm: dist,
        cumulativeTimeSeconds: cumT,
        paceSecPerKm: flatEquivPace * (segments.find(
          (s) => dist >= s.startKm - 0.001 && dist <= s.endKm + 0.001
        )?.gapFactor ?? segments[segments.length - 1]?.gapFactor ?? 1),
        elevationM: elevAtDist,
      };
    });

  // Flat-equivalent time: what flat-race fitness this course requires.
  const flatEquivMarathonTimeSeconds = flatEquivPace * distanceKm;
  const courseDifficultyFactorPercent = Math.round(
    ((flatEquivMarathonTimeSeconds - goalTimeSeconds) / goalTimeSeconds) * 100
  );

  return {
    goalTimeSeconds,
    flatEquivPaceSecPerKm: flatEquivPace,
    flatEquivMarathonTimeSeconds,
    courseDifficultyFactorPercent,
    segments,
    checkpoints,
    hardestSegmentIndex: hardestIdx,
    fastestSegmentIndex: fastestIdx,
    totalElevationGain: totalGain,
    totalElevationLoss: totalLoss,
  };
}

export function formatTime(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function formatPace(secPerKm: number): string {
  const s = Math.round(secPerKm);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")} /km`;
}

// Pre-compute course difficulty factor for ranking purposes.
// Uses a 4:00:00 reference goal — the GAP factors are geometry-based
// so relative rankings hold regardless of target time.
function totalFlatEquivKmForPoints(points: { dist: number; ele: number }[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const distKm = points[i].dist - points[i - 1].dist;
    if (distKm <= 0) continue;
    const grade = (points[i].ele - points[i - 1].ele) / (distKm * 1000);
    total += distKm * gapFactor(grade);
  }
  return total;
}

// Pre-compute course difficulty factor for ranking purposes.
// Uses a 4:00:00 reference goal — the GAP factors are geometry-based
// so relative rankings hold regardless of target time.
export function courseDifficultyFactor(points: { dist: number; ele: number }[]): number {
  const REF_GOAL = 14400; // 4:00:00
  if (points.length < 2) return 0;
  const totalFlatEquivKm = totalFlatEquivKmForPoints(points);
  const flatEquivPace = REF_GOAL / totalFlatEquivKm;
  const flatEquivMarathonTime = flatEquivPace * 42.195;
  return Math.round(((flatEquivMarathonTime - REF_GOAL) / REF_GOAL) * 100);
}

// Given flat-equivalent fitness time and course points, compute the
// realistic goal time for that course at the same effort level.
export function realisticCourseTime(
  flatTimeSecs: number,
  points: CoursePoint[],
  distanceKm: number
): number {
  if (points.length < 2) return flatTimeSecs;
  const totalFlatEquivKm = totalFlatEquivKmForPoints(points);
  // flatTimeSecs = flatEquivPace * distanceKm
  // realisticTime = flatEquivPace * totalFlatEquivKm
  return (flatTimeSecs / distanceKm) * totalFlatEquivKm;
}

export function timeStringToSeconds(value: string): number {
  // Accepts HH:MM:SS or H:MM:SS or MM:SS
  const parts = value.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}
