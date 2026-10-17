/**
 * World builder for the WebGPU route simulator.
 *
 * Turns a GPX route (lat/lng + elevation profile) into a metric 3D world:
 * an evenly resampled, smoothed centreline; a heightfield terrain that sits the
 * real route elevation under the road and grows procedural hills away from it;
 * scattered trees; km posts; and a grade-adjusted pacing table that says where
 * the runner is at any elapsed time.
 *
 * Axes: +x east, +y up, +z south (so north is -z). Units are metres.
 */
import { clamp, smoothstep } from "./math";

export interface RouteInputPoint {
  lat: number;
  lng: number;
  ele?: number;
}

export interface RouteInputProfilePoint {
  distanceKm: number;
  elevation: number;
}

export interface SimRoute {
  /** Sample count. */
  n: number;
  /** Metres between consecutive samples. */
  spacing: number;
  /** Total route length in metres. */
  length: number;
  x: Float32Array;
  z: Float32Array;
  /** Real (smoothed) elevation in metres, for pacing and the HUD. */
  ele: Float32Array;
  /** Rendered height: (ele - baseEle) * exaggeration. */
  y: Float32Array;
  /** Smoothed grade as a fraction (0.05 = 5 %). */
  grade: Float32Array;
  /** Elapsed seconds at each sample at the simulated effort. */
  time: Float32Array;
  baseEle: number;
  minEle: number;
  maxEle: number;
}

export interface Terrain {
  nx: number;
  nz: number;
  cell: number;
  originX: number;
  originZ: number;
  heights: Float32Array;
  /** Distance from each vertex to the route centreline, metres. */
  routeDist: Float32Array;
  /** Interleaved pos(3) normal(3) routeDist(1). */
  vertices: Float32Array;
  indices: Uint32Array;
}

export const ROAD_HALF_WIDTH = 3.2;
/** Gravel shoulder drawn as part of the road ribbon, each side. */
export const ROAD_SHOULDER = 1.1;

// ---------------------------------------------------------------------------
// Noise
// ---------------------------------------------------------------------------

function hash2(ix: number, iz: number, seed: number): number {
  let h = (ix * 374761393 + iz * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function valueNoise(x: number, z: number, seed: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, seed);
  const b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed);
  const d = hash2(ix + 1, iz + 1, seed);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

/** Fractal value noise in roughly [0, 1]. */
export function fbm(x: number, z: number, octaves = 5, seed = 1): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(x, z, seed + o * 17) * amp;
    norm += amp;
    amp *= 0.5;
    // Rotate between octaves to hide the lattice.
    const nx = x * 1.6 + z * 1.2;
    z = -x * 1.2 + z * 1.6;
    x = nx;
  }
  return sum / norm;
}

/** Deterministic PRNG so the same route always grows the same forest. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Pacing
// ---------------------------------------------------------------------------

/**
 * Energy cost of running on a grade (J/kg/m), Minetti et al. 2002.
 * Valid roughly for -0.45 ≤ i ≤ 0.45.
 */
export function minettiCost(i: number): number {
  return (
    155.4 * i ** 5 - 30.4 * i ** 4 - 43.3 * i ** 3 + 46.3 * i ** 2 + 19.5 * i + 3.6
  );
}

/**
 * Pace multiplier for a grade. Pure Minetti over-predicts the slowdown at race
 * effort and over-rewards descents (runners brake), so the raw cost ratio is
 * damped: 60 % of the extra cost uphill, 30 % of the saving downhill.
 */
export function gradePaceMultiplier(grade: number): number {
  const g = clamp(grade, -0.35, 0.35);
  const ratio = minettiCost(g) / minettiCost(0);
  return ratio >= 1 ? 1 + 0.6 * (ratio - 1) : 1 + 0.3 * (ratio - 1);
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

function boxSmooth(src: Float32Array, radius: number): Float32Array {
  if (radius < 1) return src.slice();
  const n = src.length;
  const out = new Float32Array(n);
  let sum = 0;
  let count = 0;
  let lo = 0;
  let hi = -1;
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - radius);
    const b = Math.min(n - 1, i + radius);
    while (hi < b) {
      sum += src[++hi];
      count++;
    }
    while (lo < a) {
      sum -= src[lo++];
      count--;
    }
    out[i] = sum / count;
  }
  return out;
}

function interpolateProfile(profile: RouteInputProfilePoint[], km: number): number {
  if (km <= profile[0].distanceKm) return profile[0].elevation;
  const last = profile[profile.length - 1];
  if (km >= last.distanceKm) return last.elevation;
  let lo = 0;
  let hi = profile.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (profile[mid].distanceKm <= km) lo = mid;
    else hi = mid;
  }
  const a = profile[lo];
  const b = profile[hi];
  const t = (km - a.distanceKm) / Math.max(1e-9, b.distanceKm - a.distanceKm);
  return a.elevation + (b.elevation - a.elevation) * t;
}

export function buildRoute(
  points: RouteInputPoint[],
  profile: RouteInputProfilePoint[],
  exaggeration: number
): SimRoute | null {
  const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (valid.length < 2) return null;

  let lat0 = 0;
  let lng0 = 0;
  for (const p of valid) {
    lat0 += p.lat;
    lng0 += p.lng;
  }
  lat0 /= valid.length;
  lng0 /= valid.length;
  const mPerDegLat = 110540;
  const mPerDegLng = 111320 * Math.cos((lat0 * Math.PI) / 180);

  // Project and drop near-duplicates (GPS jitter while standing still).
  const px: number[] = [];
  const pz: number[] = [];
  const pe: (number | undefined)[] = [];
  const cum: number[] = [];
  for (const p of valid) {
    const x = (p.lng - lng0) * mPerDegLng;
    const z = -(p.lat - lat0) * mPerDegLat;
    if (px.length) {
      const d = Math.hypot(x - px[px.length - 1], z - pz[pz.length - 1]);
      if (d < 0.5) continue;
      cum.push(cum[cum.length - 1] + d);
    } else {
      cum.push(0);
    }
    px.push(x);
    pz.push(z);
    pe.push(p.ele);
  }
  const rawLength = cum[cum.length - 1];
  if (px.length < 2 || rawLength < 20) return null;

  // Resample at a fixed spacing so smoothing windows and lookups are uniform.
  const spacing = Math.max(2, rawLength / 9000);
  const n = Math.floor(rawLength / spacing) + 1;
  const xs = new Float32Array(n);
  const zs = new Float32Array(n);
  const ele = new Float32Array(n);

  const profileOk = profile.length >= 2;
  const profileKm = profileOk ? profile[profile.length - 1].distanceKm : 0;
  const eleCount = pe.filter((e) => typeof e === "number" && Number.isFinite(e)).length;
  const useGpsEle = !profileOk && eleCount > pe.length * 0.8;

  let seg = 0;
  for (let i = 0; i < n; i++) {
    const s = Math.min(i * spacing, rawLength);
    while (seg < cum.length - 2 && cum[seg + 1] < s) seg++;
    const t = (s - cum[seg]) / Math.max(1e-9, cum[seg + 1] - cum[seg]);
    xs[i] = px[seg] + (px[seg + 1] - px[seg]) * t;
    zs[i] = pz[seg] + (pz[seg + 1] - pz[seg]) * t;
    if (profileOk) {
      ele[i] = interpolateProfile(profile, (s / rawLength) * profileKm);
    } else if (useGpsEle) {
      const ea = pe[seg] ?? pe[seg + 1] ?? 0;
      const eb = pe[seg + 1] ?? ea;
      ele[i] = ea + (eb - ea) * t;
    } else {
      ele[i] = 0;
    }
  }

  // Round GPS corners (~15 m) and barometric/DEM noise (~50 m, two passes).
  const posR = Math.round(8 / spacing);
  const x = boxSmooth(boxSmooth(xs, posR), posR);
  const z = boxSmooth(boxSmooth(zs, posR), posR);
  const eleR = Math.max(1, Math.round(25 / spacing));
  const eleS = boxSmooth(boxSmooth(ele, eleR), eleR);

  let minEle = Infinity;
  let maxEle = -Infinity;
  for (let i = 0; i < n; i++) {
    minEle = Math.min(minEle, eleS[i]);
    maxEle = Math.max(maxEle, eleS[i]);
  }

  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) y[i] = (eleS[i] - minEle) * exaggeration;

  // Grade over a ±30 m window, then the pacing table.
  const gr = Math.max(1, Math.round(30 / spacing));
  const grade = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - gr);
    const b = Math.min(n - 1, i + gr);
    grade[i] = b > a ? clamp((eleS[b] - eleS[a]) / ((b - a) * spacing), -0.35, 0.35) : 0;
  }

  return {
    n,
    spacing,
    length: (n - 1) * spacing,
    x,
    z,
    ele: eleS,
    y,
    grade,
    time: new Float32Array(n),
    baseEle: minEle,
    minEle,
    maxEle,
  };
}

/** Fill `route.time` for a flat-ground pace, adjusted for grade at every sample. */
export function applyPacing(route: SimRoute, basePaceMinPerKm: number) {
  const baseSecPerM = (basePaceMinPerKm * 60) / 1000;
  const { grade, time, spacing } = route;
  time[0] = 0;
  for (let i = 1; i < route.n; i++) {
    const g = (grade[i - 1] + grade[i]) / 2;
    time[i] = time[i - 1] + spacing * baseSecPerM * gradePaceMultiplier(g);
  }
}

export interface RouteSample {
  x: number;
  y: number;
  z: number;
  /** Unit heading in the xz plane. */
  dx: number;
  dz: number;
  ele: number;
  grade: number;
  /** Seconds per km at this point. */
  paceSecPerKm: number;
}

/** Interpolated route state at distance s (metres). */
export function sampleRoute(route: SimRoute, s: number): RouteSample {
  const f = clamp(s / route.spacing, 0, route.n - 1);
  const i = Math.min(route.n - 2, Math.floor(f));
  const t = f - i;
  const lerp = (arr: Float32Array) => arr[i] + (arr[i + 1] - arr[i]) * t;

  // Heading from a wider window so the camera doesn't twitch on GPS kinks.
  const w = Math.max(1, Math.round(6 / route.spacing));
  const a = Math.max(0, i - w);
  const b = Math.min(route.n - 1, i + 1 + w);
  let dx = route.x[b] - route.x[a];
  let dz = route.z[b] - route.z[a];
  const len = Math.hypot(dx, dz) || 1;
  dx /= len;
  dz /= len;

  const dt = route.time[i + 1] - route.time[i];
  return {
    x: lerp(route.x),
    y: lerp(route.y),
    z: lerp(route.z),
    dx,
    dz,
    ele: lerp(route.ele),
    grade: lerp(route.grade),
    paceSecPerKm: (dt / route.spacing) * 1000,
  };
}

/** Distance reached after `seconds` of running (inverse of the time table). */
export function distanceAtTime(route: SimRoute, seconds: number): number {
  const { time } = route;
  if (seconds <= 0) return 0;
  if (seconds >= time[route.n - 1]) return route.length;
  let lo = 0;
  let hi = route.n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (time[mid] <= seconds) lo = mid;
    else hi = mid;
  }
  const t = (seconds - time[lo]) / Math.max(1e-9, time[hi] - time[lo]);
  return (lo + t) * route.spacing;
}

export function timeAtDistance(route: SimRoute, s: number): number {
  const f = clamp(s / route.spacing, 0, route.n - 1);
  const i = Math.min(route.n - 2, Math.floor(f));
  const t = f - i;
  return route.time[i] + (route.time[i + 1] - route.time[i]) * t;
}

// ---------------------------------------------------------------------------
// Terrain
// ---------------------------------------------------------------------------

export function buildTerrain(route: SimRoute, exaggeration: number): Terrain {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < route.n; i++) {
    minX = Math.min(minX, route.x[i]);
    maxX = Math.max(maxX, route.x[i]);
    minZ = Math.min(minZ, route.z[i]);
    maxZ = Math.max(maxZ, route.z[i]);
  }
  const span = Math.max(maxX - minX, maxZ - minZ);
  const margin = Math.max(1500, span * 0.35);
  minX -= margin; maxX += margin; minZ -= margin; maxZ += margin;

  const longSide = Math.max(maxX - minX, maxZ - minZ);
  const cell = Math.max(6, longSide / 511);
  const nx = Math.ceil((maxX - minX) / cell) + 1;
  const nz = Math.ceil((maxZ - minZ) / cell) + 1;
  const count = nx * nz;

  // Nearest-route-sample field via seeded two-pass propagation.
  const nearest = new Int32Array(count).fill(-1);
  const dist = new Float32Array(count).fill(Infinity);
  const distTo = (vi: number, si: number) => {
    const gx = minX + (vi % nx) * cell;
    const gz = minZ + Math.floor(vi / nx) * cell;
    return Math.hypot(gx - route.x[si], gz - route.z[si]);
  };
  for (let i = 0; i < route.n; i++) {
    const cx = Math.round((route.x[i] - minX) / cell);
    const cz = Math.round((route.z[i] - minZ) / cell);
    const vi = cz * nx + cx;
    const d = distTo(vi, i);
    if (d < dist[vi]) {
      dist[vi] = d;
      nearest[vi] = i;
    }
  }
  const relax = (vi: number, ni: number) => {
    const si = nearest[ni];
    if (si < 0) return;
    const d = distTo(vi, si);
    if (d < dist[vi]) {
      dist[vi] = d;
      nearest[vi] = si;
    }
  };
  for (let pass = 0; pass < 2; pass++) {
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const vi = j * nx + i;
        if (i > 0) relax(vi, vi - 1);
        if (j > 0) {
          relax(vi, vi - nx);
          if (i > 0) relax(vi, vi - nx - 1);
          if (i < nx - 1) relax(vi, vi - nx + 1);
        }
      }
    }
    for (let j = nz - 1; j >= 0; j--) {
      for (let i = nx - 1; i >= 0; i--) {
        const vi = j * nx + i;
        if (i < nx - 1) relax(vi, vi + 1);
        if (j < nz - 1) {
          relax(vi, vi + nx);
          if (i < nx - 1) relax(vi, vi + nx + 1);
          if (i > 0) relax(vi, vi + nx - 1);
        }
      }
    }
  }

  // Elevation of the nearest route point, plus a heavily blurred regional
  // version so Voronoi seams between far-apart route sections disappear.
  // Propagation finds a sample near the true closest one, off by up to about a
  // cell. On a steep road that error is metres of height, so refine it: search
  // the neighbouring samples, then project onto the segment for a smooth value.
  const near = new Float32Array(count);
  const win = Math.ceil((cell * 2) / route.spacing);
  for (let vi = 0; vi < count; vi++) {
    const gx = minX + (vi % nx) * cell;
    const gz = minZ + Math.floor(vi / nx) * cell;
    let best = nearest[vi];
    if (dist[vi] < cell * 4) {
      let bestD = Infinity;
      const lo = Math.max(0, best - win);
      const hi = Math.min(route.n - 1, best + win);
      for (let k = lo; k <= hi; k++) {
        const d = (gx - route.x[k]) ** 2 + (gz - route.z[k]) ** 2;
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      }
      nearest[vi] = best;
      dist[vi] = Math.sqrt(bestD);
    }
    const a = Math.max(0, best - 1);
    const b = Math.min(route.n - 1, best + 1);
    const ex = route.x[b] - route.x[a];
    const ez = route.z[b] - route.z[a];
    const t = clamp(((gx - route.x[a]) * ex + (gz - route.z[a]) * ez) / (ex * ex + ez * ez || 1), 0, 1);
    near[vi] = route.y[a] + (route.y[b] - route.y[a]) * t;
  }
  const blur = (src: Float32Array, r: number) => {
    const tmp = new Float32Array(count);
    const out = new Float32Array(count);
    for (let j = 0; j < nz; j++) {
      const row = src.subarray(j * nx, j * nx + nx);
      tmp.set(boxSmooth(row, r), j * nx);
    }
    const col = new Float32Array(nz);
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) col[j] = tmp[j * nx + i];
      const sm = boxSmooth(col, r);
      for (let j = 0; j < nz; j++) out[j * nx + i] = sm[j];
    }
    return out;
  };
  const r1 = Math.max(1, Math.round(600 / cell));
  const regional = blur(blur(near, r1), r1);

  const relief = route.maxEle - route.minEle;
  const hillAmp = clamp(relief * 0.5 + 35, 35, 260) * exaggeration;
  const flatEnd = ROAD_HALF_WIDTH + cell * 1.5;
  const heights = new Float32Array(count);
  for (let vi = 0; vi < count; vi++) {
    const gx = minX + (vi % nx) * cell;
    const gz = minZ + Math.floor(vi / nx) * cell;
    const d = dist[vi];
    const base = near[vi] + (regional[vi] - near[vi]) * smoothstep(0, 400, d);
    const hills = fbm(gx / 2200, gz / 2200, 5, 7) * 1.35 - 0.3;
    const ridges = 1 - Math.abs(fbm(gx / 900, gz / 900, 4, 23) * 2 - 1);
    const shape = hills * 0.75 + ridges * ridges * 0.35;
    const w = smoothstep(flatEnd, flatEnd + 450, d);
    // Sink terrain just under the road so the asphalt never z-fights.
    const sink = (1 - smoothstep(ROAD_HALF_WIDTH + ROAD_SHOULDER, flatEnd, d)) * 0.9;
    heights[vi] = base + shape * hillAmp * w - sink;
  }

  const vertices = new Float32Array(count * 7);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const vi = j * nx + i;
      const hl = heights[j * nx + Math.max(0, i - 1)];
      const hr = heights[j * nx + Math.min(nx - 1, i + 1)];
      const hd = heights[Math.max(0, j - 1) * nx + i];
      const hu = heights[Math.min(nz - 1, j + 1) * nx + i];
      let nxv = hl - hr;
      let nyv = 2 * cell;
      let nzv = hd - hu;
      const l = Math.hypot(nxv, nyv, nzv);
      nxv /= l; nyv /= l; nzv /= l;
      const o = vi * 7;
      vertices[o] = minX + i * cell;
      vertices[o + 1] = heights[vi];
      vertices[o + 2] = minZ + j * cell;
      vertices[o + 3] = nxv;
      vertices[o + 4] = nyv;
      vertices[o + 5] = nzv;
      vertices[o + 6] = dist[vi];
    }
  }

  const indices = new Uint32Array((nx - 1) * (nz - 1) * 6);
  let k = 0;
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      const b = a + 1;
      const c = a + nx;
      const d = c + 1;
      // Counter-clockwise seen from above (+y).
      indices[k++] = a; indices[k++] = c; indices[k++] = b;
      indices[k++] = b; indices[k++] = c; indices[k++] = d;
    }
  }

  return { nx, nz, cell, originX: minX, originZ: minZ, heights, routeDist: dist, vertices, indices };
}

function bilinear(t: Terrain, field: Float32Array, x: number, z: number): number {
  const fx = clamp((x - t.originX) / t.cell, 0, t.nx - 1.001);
  const fz = clamp((z - t.originZ) / t.cell, 0, t.nz - 1.001);
  const i = Math.floor(fx);
  const j = Math.floor(fz);
  const u = fx - i;
  const v = fz - j;
  const a = field[j * t.nx + i];
  const b = field[j * t.nx + i + 1];
  const c = field[(j + 1) * t.nx + i];
  const d = field[(j + 1) * t.nx + i + 1];
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export const terrainHeight = (t: Terrain, x: number, z: number) => bilinear(t, t.heights, x, z);

// ---------------------------------------------------------------------------
// Road ribbon
// ---------------------------------------------------------------------------

/** Interleaved pos(3) normal(3) uv(2): u ∈ [-1, 1] across, v = metres along. */
export function buildRoad(route: SimRoute): { vertices: Float32Array; indices: Uint32Array } {
  const { n } = route;
  const vertices = new Float32Array(n * 2 * 8);
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1);
    const b = Math.min(n - 1, i + 1);
    let dx = route.x[b] - route.x[a];
    let dz = route.z[b] - route.z[a];
    const l = Math.hypot(dx, dz) || 1;
    dx /= l;
    dz /= l;
    // Right-hand side of travel.
    const rx = -dz;
    const rz = dx;
    const half = ROAD_HALF_WIDTH + ROAD_SHOULDER;
    for (let side = 0; side < 2; side++) {
      const sgn = side === 0 ? -1 : 1;
      const o = (i * 2 + side) * 8;
      vertices[o] = route.x[i] + rx * half * sgn;
      vertices[o + 1] = route.y[i] + 0.05;
      vertices[o + 2] = route.z[i] + rz * half * sgn;
      vertices[o + 3] = 0;
      vertices[o + 4] = 1;
      vertices[o + 5] = 0;
      vertices[o + 6] = sgn;
      vertices[o + 7] = i * route.spacing;
    }
  }
  const indices = new Uint32Array((n - 1) * 6);
  let k = 0;
  for (let i = 0; i < n - 1; i++) {
    const l0 = i * 2, r0 = l0 + 1, l1 = l0 + 2, r1 = l0 + 3;
    // Upward-facing regardless of turn direction; culling is off for the road.
    indices[k++] = l0; indices[k++] = r0; indices[k++] = l1;
    indices[k++] = r0; indices[k++] = r1; indices[k++] = l1;
  }
  return { vertices, indices };
}

// ---------------------------------------------------------------------------
// Instances (trees, km posts, arches)
// ---------------------------------------------------------------------------

/** 20 floats per instance: mat4 (16) + tint rgba (a = material). */
export const INSTANCE_FLOATS = 20;

export function writeInstance(
  out: Float32Array,
  index: number,
  x: number, y: number, z: number,
  yaw: number,
  sx: number, sy: number, sz: number,
  r: number, g: number, b: number, material: number
) {
  const o = index * INSTANCE_FLOATS;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  out.set(
    [c * sx, 0, -s * sx, 0, 0, sy, 0, 0, s * sz, 0, c * sz, 0, x, y, z, 1, r, g, b, material],
    o
  );
}

/** A contiguous run of instances that fall in one square tile of the world. */
export interface InstanceTile {
  x: number;
  z: number;
  first: number;
  count: number;
}

export interface TiledInstances {
  data: Float32Array;
  tiles: InstanceTile[];
}

export interface Forest {
  conifers: TiledInstances;
  broadleaf: TiledInstances;
}

const TREE_TILE = 400;

/** Sort instances by tile so each tile can be drawn (or culled) as one range. */
export function tileInstances(data: Float32Array, tileSize = TREE_TILE): TiledInstances {
  const n = data.length / INSTANCE_FLOATS;
  const keyed: { key: string; tx: number; tz: number; i: number }[] = [];
  for (let i = 0; i < n; i++) {
    const tx = Math.floor(data[i * INSTANCE_FLOATS + 12] / tileSize);
    const tz = Math.floor(data[i * INSTANCE_FLOATS + 14] / tileSize);
    keyed.push({ key: `${tx},${tz}`, tx, tz, i });
  }
  keyed.sort((a, b) => a.tx - b.tx || a.tz - b.tz);
  const out = new Float32Array(data.length);
  const tiles: InstanceTile[] = [];
  keyed.forEach((k, j) => {
    out.set(data.subarray(k.i * INSTANCE_FLOATS, (k.i + 1) * INSTANCE_FLOATS), j * INSTANCE_FLOATS);
    const last = tiles[tiles.length - 1];
    const cx = (k.tx + 0.5) * tileSize;
    const cz = (k.tz + 0.5) * tileSize;
    if (last && last.x === cx && last.z === cz) last.count++;
    else tiles.push({ x: cx, z: cz, first: j, count: 1 });
  });
  return { data: out, tiles };
}

export function scatterTrees(route: SimRoute, terrain: Terrain, seed: number): Forest {
  const rand = mulberry32(seed);
  // Density per km of route, so long courses stay as wooded as short ones.
  const target = Math.round(clamp(route.length * 0.16, 2500, 14000));
  const conifers = new Float32Array(target * INSTANCE_FLOATS);
  const broadleaf = new Float32Array(target * INSTANCE_FLOATS);
  let nc = 0;
  let nb = 0;
  for (let attempt = 0; attempt < target * 8 && (nc < target || nb < target); attempt++) {
    const i = Math.floor(rand() * route.n);
    const a = Math.max(0, i - 1);
    const b = Math.min(route.n - 1, i + 1);
    let dx = route.x[b] - route.x[a];
    let dz = route.z[b] - route.z[a];
    const l = Math.hypot(dx, dz) || 1;
    dx /= l; dz /= l;
    const side = rand() < 0.5 ? -1 : 1;
    const off = ROAD_HALF_WIDTH + 9 + 900 * rand() ** 1.8;
    const along = (rand() - 0.5) * route.spacing * 4;
    const x = route.x[i] + -dz * off * side + dx * along;
    const z = route.z[i] + dx * off * side + dz * along;

    // Keep clear of every part of the road, not just the section we started from.
    if (bilinear(terrain, terrain.routeDist, x, z) < ROAD_HALF_WIDTH + 7) continue;

    // Clumped forest with open meadows between.
    const forest = fbm(x / 520, z / 520, 4, 41);
    if (rand() > smoothstep(0.38, 0.62, forest) * 0.95 + 0.03) continue;

    const h = terrainHeight(terrain, x, z);
    const e = 2;
    const slope = Math.hypot(
      terrainHeight(terrain, x + e, z) - terrainHeight(terrain, x - e, z),
      terrainHeight(terrain, x, z + e) - terrainHeight(terrain, x, z - e)
    ) / (2 * e);
    if (slope > 0.9) continue;

    const coniferBias = smoothstep(0.35, 0.65, fbm(x / 1400, z / 1400, 3, 77));
    const yaw = rand() * Math.PI * 2;
    const tone = 0.8 + rand() * 0.35;
    const wantConifer = rand() < coniferBias;
    if (wantConifer) {
      if (nc >= target) continue;
      const height = 9 + rand() * 14;
      const width = height * (0.32 + rand() * 0.1);
      writeInstance(conifers, nc++, x, h - 0.4, z, yaw, width, height, width,
        0.75 * tone, 0.9 * tone, 0.8 * tone, 1);
    } else {
      if (nb >= target) continue;
      const height = 7 + rand() * 9;
      const width = height * (0.75 + rand() * 0.3);
      const autumn = rand() < 0.04 ? 1 : 0;
      writeInstance(broadleaf, nb++, x, h - 0.4, z, yaw, width, height, width,
        (1 + autumn * 1.6) * tone, (1 + autumn * 0.3) * tone, (0.9 - autumn * 0.5) * tone, 1);
    }
  }
  return {
    conifers: tileInstances(conifers.subarray(0, nc * INSTANCE_FLOATS)),
    broadleaf: tileInstances(broadleaf.subarray(0, nb * INSTANCE_FLOATS)),
  };
}

/** Km posts on the right shoulder plus start and finish gantries (box mesh). */
export function buildMarkers(route: SimRoute): Float32Array {
  const items: number[][] = [];
  const box = (x: number, y: number, z: number, yaw: number, sx: number, sy: number, sz: number, rgb: [number, number, number]) =>
    items.push([x, y, z, yaw, sx, sy, sz, ...rgb]);

  const place = (s: number, offset: number) => {
    const p = sampleRoute(route, s);
    const yaw = Math.atan2(p.dx, p.dz);
    return { x: p.x + -p.dz * offset, z: p.z + p.dx * offset, y: p.y, yaw };
  };

  for (let km = 1; km * 1000 < route.length - 50; km++) {
    const p = place(km * 1000, ROAD_HALF_WIDTH + 1.4);
    box(p.x, p.y + 1.1, p.z, p.yaw, 0.09, 2.2, 0.09, [0.9, 0.9, 0.9]);
    box(p.x, p.y + 2.35, p.z, p.yaw, 0.95, 0.55, 0.06, [0.95, 0.42, 0.05]);
  }

  const gantry = (s: number, rgb: [number, number, number]) => {
    const w = ROAD_HALF_WIDTH + 0.8;
    const l = place(s, -w);
    const r = place(s, w);
    const c = place(s, 0);
    box(l.x, l.y + 2.6, l.z, l.yaw, 0.35, 5.2, 0.35, [0.15, 0.15, 0.17]);
    box(r.x, r.y + 2.6, r.z, r.yaw, 0.35, 5.2, 0.35, [0.15, 0.15, 0.17]);
    box(c.x, c.y + 5.0, c.z, c.yaw, w * 2 + 0.35, 1.1, 0.3, rgb);
  };
  gantry(Math.min(2, route.length * 0.001), [0.02, 0.45, 0.32]);
  gantry(route.length - 2, [0.85, 0.12, 0.1]);

  const out = new Float32Array(items.length * INSTANCE_FLOATS);
  items.forEach(([x, y, z, yaw, sx, sy, sz, r, g, b], i) =>
    writeInstance(out, i, x, y, z, yaw, sx, sy, sz, r, g, b, 0)
  );
  return out;
}
