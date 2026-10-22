/**
 * A simulated marathon for the "Try a sample race" button. It is generated,
 * not a real person's run, and the page says so. The script is a classic
 * mistake: a fast first 4 km, steady effort to 28 km, then a fade from 30 km,
 * with three short aid-station stops on a rolling loop.
 */
import { gradeCostFactor } from "./debrief-math";
import type { TimedPoint } from "./types";

const STEP_S = 3;
const TOTAL_M = 42_400; // GPS reads a little long, like a real watch
const START = Date.parse("2026-05-03T07:00:00Z");
const CENTER = { lat: 49.3, lng: -123.14 };
const RADIUS_M = TOTAL_M / (2 * Math.PI);
const AID_STATIONS_M = [10_000, 20_000, 30_000];
const AID_STOP_S = 15;

function elevationAt(m: number): number {
  const km = m / 1000;
  return 40 + 18 * Math.sin((2 * Math.PI * km) / 9) + 8 * Math.sin((2 * Math.PI * km) / 2.7 + 1);
}

/** The effort the simulated runner aims for, as flat-ground seconds per km. */
function effortPaceAt(m: number): number {
  const km = m / 1000;
  if (km < 4) return 312;
  if (km < 28) return 320;
  if (km < 32) return 320 + ((km - 28) / 4) * 35;
  return 355;
}

function position(m: number): { lat: number; lng: number } {
  const theta = m / RADIUS_M;
  const north = RADIUS_M * Math.cos(theta) - RADIUS_M;
  const east = RADIUS_M * Math.sin(theta);
  return {
    lat: CENTER.lat + north / 111_320,
    lng: CENTER.lng + east / (111_320 * Math.cos((CENTER.lat * Math.PI) / 180)),
  };
}

export function simulateSampleRace(): TimedPoint[] {
  // Small deterministic pace noise so splits aren't perfectly smooth.
  let seed = 7;
  const noise = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed / 2147483647 - 0.5) * 0.03;
  };

  const points: TimedPoint[] = [];
  let m = 0;
  let t = START;
  const stopsLeft = [...AID_STATIONS_M];
  const push = () =>
    points.push({ ...position(m), ele: Math.round(elevationAt(m) * 10) / 10, time: t });

  push();
  while (m < TOTAL_M) {
    const grade = (elevationAt(m + 10) - elevationAt(m)) / 10;
    const pace = effortPaceAt(m) * gradeCostFactor(grade) * (1 + noise());
    m = Math.min(TOTAL_M, m + (1000 / pace) * STEP_S);
    t += STEP_S * 1000;
    push();
    if (stopsLeft.length > 0 && m >= stopsLeft[0]) {
      stopsLeft.shift();
      for (let s = 0; s < AID_STOP_S; s += STEP_S) {
        t += STEP_S * 1000;
        push();
      }
    }
  }
  return points;
}
