// Pure geometry and race-state helpers for the home page race-watch hero.
// No React here, so the component file only exports components.
import type { FuelStop } from "@/features/fuel/types";

export type CoursePoint = {
  lat: number;
  lng: number;
  ele: number;
  dist: number;
};
type Pt = [number, number];

/** Catmull-Rom spline through the points, as cubic Bézier path data. */
export function smoothPath(p: Pt[]) {
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Projects a course onto a w×h box (equirectangular, corrected for latitude). */
export function routePath(
  src: CoursePoint[],
  w: number,
  h: number,
  margin = 12,
) {
  const meanLat = src.reduce((a, p) => a + p.lat, 0) / src.length;
  const k = Math.cos((meanLat * Math.PI) / 180);
  const xs = src.map((p) => p.lng * k);
  const ys = src.map((p) => -p.lat);
  const [x0, x1, y0, y1] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  const s = Math.min(
    (w - margin * 2) / (x1 - x0),
    (h - margin * 2) / (y1 - y0),
  );
  const ox = (w - (x1 - x0) * s) / 2;
  const oy = (h - (y1 - y0) * s) / 2;
  return smoothPath(
    src.map((_, i) => [ox + (xs[i] - x0) * s, oy + (ys[i] - y0) * s]),
  );
}

/** Decorative topographic contour rings for the hero background. */
export function contourPaths(w: number, h: number) {
  const paths: string[] = [];
  [
    [w * 0.78, h * 0.35],
    [w * 0.2, h * 0.85],
  ].forEach(([cx, cy], c) => {
    for (let k = 1; k <= 14; k++) {
      const r = k * 38;
      const pts: Pt[] = [];
      for (let a = 0; a <= 64; a++) {
        const t = (a / 64) * Math.PI * 2;
        const wob =
          1 +
          0.12 * Math.sin(3 * t + k * 0.5 + c) +
          0.07 * Math.sin(5 * t - k * 0.3);
        pts.push([
          cx + Math.cos(t) * r * wob * 1.3,
          cy + Math.sin(t) * r * wob,
        ]);
      }
      paths.push(smoothPath(pts));
    }
  });
  return paths;
}

/** Where the runner is at progress p (0–1) of a race run at even pace. */
export function raceState(
  src: CoursePoint[],
  p: number,
  fuelStops: FuelStop[],
  finishSeconds: number,
) {
  const total = src[src.length - 1].dist;
  const km = p * total;
  const nextIdx = fuelStops.findIndex((st) => st.distanceKm > km);
  const toNext =
    nextIdx >= 0
      ? ((fuelStops[nextIdx].distanceKm - km) / total) * finishSeconds
      : null;
  return { total, km, elapsed: p * finishSeconds, toNext };
}
