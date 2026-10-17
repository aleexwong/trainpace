/**
 * CPU side of the sky model: the same single-scattering Rayleigh + Mie
 * atmosphere the sky shader uses, evaluated a handful of times per sun change
 * to derive sunlight colour (sun seen through the air) and sky ambient.
 */
import type { Vec3 } from "./math";

export const PLANET_RADIUS = 6371e3;
export const ATMOS_RADIUS = 6471e3;
export const VIEW_HEIGHT = 1000;
export const K_RAYLEIGH: Vec3 = [5.5e-6, 13.0e-6, 22.4e-6];
export const K_MIE = 21e-6;
export const H_RAYLEIGH = 8e3;
export const H_MIE = 1.2e3;
export const MIE_G = 0.758;
export const SUN_INTENSITY = 22;

function raySphereFar(oy: number, d: Vec3, r: number): number {
  // Origin is (0, oy, 0).
  const b = 2 * d[1] * oy;
  const c = oy * oy - r * r;
  const disc = b * b - 4 * c;
  if (disc < 0) return -1;
  return (-b + Math.sqrt(disc)) / 2;
}

/** Optical depth (Rayleigh, Mie) from altitude `h` along `d` to space. */
function opticalDepth(h: number, d: Vec3, steps = 16): [number, number] {
  const oy = PLANET_RADIUS + h;
  const len = raySphereFar(oy, d, ATMOS_RADIUS);
  const ds = len / steps;
  let r = 0;
  let m = 0;
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) * ds;
    const py = oy + d[1] * t;
    const px = d[0] * t;
    const pz = d[2] * t;
    const alt = Math.hypot(px, py, pz) - PLANET_RADIUS;
    if (alt < 0) return [1e9, 1e9];
    r += Math.exp(-alt / H_RAYLEIGH) * ds;
    m += Math.exp(-alt / H_MIE) * ds;
  }
  return [r, m];
}

/** Colour of direct sunlight at the viewer (transmittance × intensity). */
export function sunTransmittance(sun: Vec3): Vec3 {
  const [r, m] = opticalDepth(VIEW_HEIGHT, sun, 32);
  return [0, 1, 2].map((c) => Math.exp(-(K_RAYLEIGH[c] * r + K_MIE * 1.1 * m))) as Vec3;
}

/** Single-scattered sky radiance looking along `dir`. */
export function skyRadiance(dir: Vec3, sun: Vec3): Vec3 {
  const steps = 12;
  const oy = PLANET_RADIUS + VIEW_HEIGHT;
  const len = raySphereFar(oy, dir, ATMOS_RADIUS);
  const ds = len / steps;
  const mu = dir[0] * sun[0] + dir[1] * sun[1] + dir[2] * sun[2];
  const g = MIE_G;
  const pR = (3 / (16 * Math.PI)) * (1 + mu * mu);
  const pM =
    (3 / (8 * Math.PI)) * ((1 - g * g) * (1 + mu * mu)) /
    ((2 + g * g) * Math.pow(1 + g * g - 2 * mu * g, 1.5));
  const total: Vec3 = [0, 0, 0];
  const totM: Vec3 = [0, 0, 0];
  let odR = 0;
  let odM = 0;
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) * ds;
    const p: Vec3 = [dir[0] * t, oy + dir[1] * t, dir[2] * t];
    const r = Math.hypot(p[0], p[1], p[2]);
    const alt = r - PLANET_RADIUS;
    const hr = Math.exp(-alt / H_RAYLEIGH) * ds;
    const hm = Math.exp(-alt / H_MIE) * ds;
    odR += hr;
    odM += hm;
    const [lr, lm] = opticalDepth(alt, sun, 6);
    for (let c = 0; c < 3; c++) {
      const att = Math.exp(-(K_MIE * (odM + lm) + K_RAYLEIGH[c] * (odR + lr)));
      total[c] += hr * att;
      totM[c] += hm * att;
    }
  }
  return [0, 1, 2].map(
    (c) => SUN_INTENSITY * (pR * K_RAYLEIGH[c] * total[c] + pM * K_MIE * totM[c])
  ) as Vec3;
}

export interface Lighting {
  sunDir: Vec3;
  /** Direct sun irradiance in the same units as sky radiance. */
  sunColor: Vec3;
  /** Mean sky radiance over the upper hemisphere (diffuse ambient). */
  skyAmbient: Vec3;
  /** Light bounced up from the ground. */
  groundAmbient: Vec3;
}

/**
 * Sun position for a clock time. A simple mid-latitude summer arc: rises in
 * the east around 05:30, peaks at ~62° at 13:00, sets in the west near 20:30.
 */
export function sunDirection(hour: number): Vec3 {
  const t = (hour - 5.5) / 15;
  const elevation = (Math.sin(Math.PI * t) * 66 - 4) * (Math.PI / 180);
  const azimuth = (75 + t * 210) * (Math.PI / 180); // from north, clockwise
  const ce = Math.cos(elevation);
  return [Math.sin(azimuth) * ce, Math.sin(elevation), -Math.cos(azimuth) * ce];
}

/**
 * Sun irradiance scale. Calibrated so a sunlit white Lambert surface is ~6×
 * the mean sky radiance at noon, close to the real sun:sky illuminance ratio.
 */
const SUN_IRRADIANCE = 2.2;

export function computeLighting(hour: number): Lighting {
  const sunDir = sunDirection(hour);
  const tr = sunTransmittance(sunDir);
  const horizonFade = Math.min(1, Math.max(0, (sunDir[1] + 0.02) / 0.06));
  const sunColor = tr.map((v) => v * SUN_IRRADIANCE * horizonFade) as Vec3;

  const sky: Vec3 = [0, 0, 0];
  let w = 0;
  for (let e = 0; e < 3; e++) {
    const el = ((e + 0.5) / 3) * (Math.PI / 2);
    for (let a = 0; a < 8; a++) {
      const az = (a / 8) * Math.PI * 2;
      const d: Vec3 = [Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)];
      const r = skyRadiance(d, sunDir);
      const weight = Math.sin(el) * Math.cos(el);
      for (let c = 0; c < 3; c++) sky[c] += r[c] * weight;
      w += weight;
    }
  }
  const skyAmbient = sky.map((v) => (v / w) * 1.1 + 0.002) as Vec3;
  const up = Math.max(0, sunDir[1]);
  const groundAmbient = [0, 1, 2].map(
    (c) => (sunColor[c] * up * 0.06 + skyAmbient[c] * 0.25) * [0.9, 1.0, 0.75][c]
  ) as Vec3;
  return { sunDir, sunColor, skyAmbient, groundAmbient };
}
