/**
 * Procedural running gait for the simulator's runner.
 *
 * One stride = one cycle of `phase` (0..1) = two steps. The left leg uses
 * `phase`, the right leg `phase + 0.5`. Within a leg's cycle:
 *   0.22–0.60  stance (foot on the ground, thigh sweeping back)
 *   0.60–0.72  flight (both feet off the ground)
 *   0.72–1.22  swing (heel tucks up, thigh drives forward)
 * The pelvis height is solved so the stance foot actually touches the road,
 * which gives the bounce and ground contact for free.
 *
 * Local frame: +z forward, +y up, +x to the runner's left.
 */
import { INSTANCE_FLOATS } from "./world";
import { clamp } from "./math";

type V3 = [number, number, number];

// Linear-space albedos.
const SKIN: V3 = [0.42, 0.21, 0.13];
const HAIR: V3 = [0.035, 0.022, 0.015];
const SINGLET: V3 = [0.01, 0.3, 0.19];
const SHORTS: V3 = [0.018, 0.02, 0.03];
const SHOE: V3 = [0.8, 0.16, 0.035];
const SOCK: V3 = [0.7, 0.7, 0.68];

const THIGH = 0.46;
const SHIN = 0.45;
const FOOT = 0.25;
const UPPER_ARM = 0.29;
const FOREARM = 0.27;

/** Cadence in steps per minute — rises with speed, as in real runners. */
export function cadenceFor(speedMps: number): number {
  return clamp(148 + 9 * speedMps, 160, 196);
}

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
/** Direction at `pitch` radians from straight down, tilted toward +z. */
const sagittal = (pitch: number, len: number, lateral = 0): V3 => [
  lateral,
  -Math.cos(pitch) * len,
  Math.sin(pitch) * len,
];

function rotY(v: V3, a: number): V3 {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}

interface LegPose {
  knee: V3;
  ankle: V3;
  toe: V3;
  stance: boolean;
}

/**
 * Sagittal joint angles through one gait cycle, from foot contact (c = 0),
 * after published running kinematics: hip flexion (+ forward) and knee
 * flexion in radians. Toe-off is at c ≈ 0.38; knee flexion peaks early in
 * swing, the hip reaches full flexion just before the next contact.
 */
const KEYS: [number, number, number][] = [
  [0.0, 0.42, 0.3],
  [0.15, 0.14, 0.68],
  [0.38, -0.3, 0.32],
  [0.5, -0.1, 1.25],
  [0.62, 0.22, 1.8],
  [0.78, 0.56, 1.15],
  [0.9, 0.6, 0.45],
];
const STANCE_END = 0.38;

/** Periodic Catmull-Rom through KEYS. Returns [hip, knee]. */
function jointAngles(c: number): [number, number] {
  const n = KEYS.length;
  let i = n - 1;
  for (let k = 0; k < n; k++) if (KEYS[k][0] <= c) i = k;
  const key = (k: number) => {
    const wrap = Math.floor(k / n);
    const [t, h, kn] = KEYS[((k % n) + n) % n];
    return [t + wrap, h, kn];
  };
  const p0 = key(i - 1), p1 = key(i), p2 = key(i + 1), p3 = key(i + 2);
  const u = (c - p1[0]) / (p2[0] - p1[0]);
  const cr = (a: number, b: number, cc: number, d: number) =>
    0.5 * (2 * b + (cc - a) * u + (2 * a - 5 * b + 4 * cc - d) * u * u + (3 * b - a - 3 * cc + d) * u * u * u);
  return [cr(p0[1], p1[1], p2[1], p3[1]), cr(p0[2], p1[2], p2[2], p3[2])];
}

function leg(p: number, effort: number): { stance: boolean; rel: (hip: V3) => LegPose } {
  // Leg cycle starts at foot contact, which is p = 0.22 in stride phase.
  const c = (((p - 0.22) % 1) + 1) % 1;
  const [h0, k0] = jointAngles(c);
  const stance = c < STANCE_END;
  // Faster running: bigger hip range and a higher heel tuck in swing.
  const hip = h0 * (0.72 + 0.36 * effort);
  const knee = stance ? k0 : 0.3 + (k0 - 0.3) * (0.65 + 0.45 * effort);
  const shin = hip - knee;
  let foot: number;
  if (c < 0.06) foot = Math.PI / 2 + 0.2 * (1 - c / 0.06); // heel strike, toes up
  else if (c < 0.24) foot = Math.PI / 2; // flat
  else if (stance) foot = Math.PI / 2 - 0.75 * ((c - 0.24) / (STANCE_END - 0.24)); // heel lift
  else {
    // Toes point down after push-off, then pull up ready for the next contact.
    const plantar = 0.35 - 0.45 * clamp((c - 0.5) / 0.35, 0, 1);
    foot = shin + Math.PI / 2 - plantar;
  }
  const kneeRel = sagittal(hip, THIGH);
  const ankleRel = add(kneeRel, sagittal(shin, SHIN));
  const toeRel = add(ankleRel, sagittal(foot, FOOT));
  return {
    stance,
    rel: (h: V3) => ({ knee: add(h, kneeRel), ankle: add(h, ankleRel), toe: add(h, toeRel), stance }),
  };
}

/**
 * Writes the runner's body parts as ellipsoid instances (sphere mesh) into
 * `out`, already placed in the world. Returns the instance count.
 */
export function writeRunner(
  out: Float32Array,
  phase: number,
  speedMps: number,
  grade: number,
  pos: V3,
  heading: number
): number {
  const effort = clamp(speedMps / 4.5, 0.4, 1.4);
  const lean = 0.1 + 0.05 * effort + clamp(grade, -0.15, 0.2) * 0.8;

  const L = leg(phase, effort);
  const R = leg(phase + 0.5, effort);

  const hipL: V3 = [0.095, 0, 0];
  const hipR: V3 = [-0.095, 0, 0];
  const legL = L.rel(hipL);
  const legR = R.rel(hipR);

  // Ground follows the grade along the direction of travel.
  const ground = (p: V3) => p[1] + 0.035 - p[2] * grade;
  const lowL = Math.min(ground(legL.ankle) - 0.04, ground(legL.toe));
  const lowR = Math.min(ground(legR.ankle) - 0.04, ground(legR.toe));
  let pelvisY: number;
  if (legL.stance || legR.stance) {
    pelvisY = -Math.min(legL.stance ? lowL : Infinity, legR.stance ? lowR : Infinity);
    // Never let the swinging foot scuff through the road.
    pelvisY = Math.max(pelvisY, -Math.min(lowL, lowR) - 0.01);
  } else {
    // Flight: ballistic hop between the two contacts.
    const t = ((phase % 0.5) + 0.5) % 0.5;
    const f = clamp((t - 0.1) / 0.12, 0, 1);
    // Lowest foot just clears the road, plus the hop; matches the stance
    // formula at both ends so the body never jumps.
    pelvisY = -Math.min(lowL, lowR) + 0.045 * Math.sin(Math.PI * f);
  }
  pelvisY = Math.min(pelvisY, 1.05);

  const pelvis: V3 = [0, pelvisY, 0];
  const twist = 0.12 * Math.sin(2 * Math.PI * phase);
  const tw = (v: V3, a: number): V3 => rotY(v, a);

  const torsoLen = 0.56;
  const chest = add(pelvis, [0, Math.cos(lean) * torsoLen, Math.sin(lean) * torsoLen]);
  const neck = add(chest, [0, 0.06, 0.02]);
  const head = add(neck, [0, 0.14, 0.05 + lean * 0.05]);

  const shoulder = (side: number) => add(chest, tw([0.19 * side, -0.05, -0.02], -twist));
  const shL = shoulder(1);
  const shR = shoulder(-1);
  // Arms swing opposite to the legs, elbows held near 90°.
  const armAmp = 0.35 + 0.25 * effort;
  const arm = (sh: V3, p: number, side: number) => {
    // Each arm is furthest back when the same-side leg is furthest forward.
    const swing = -armAmp * Math.cos(2 * Math.PI * (p - 0.12)) - 0.1;
    const elbow = add(sh, sagittal(swing, UPPER_ARM, 0.02 * side));
    const fore = swing + 1.4 + 0.25 * Math.max(0, -Math.cos(2 * Math.PI * (p - 0.12)));
    const wrist = add(elbow, sagittal(fore, FOREARM, -0.07 * side));
    return { elbow, wrist };
  };
  const aL = arm(shL, phase, 1);
  const aR = arm(shR, phase + 0.5, -1);

  const pl = (v: V3): V3 => add(pelvis, tw(v, twist));
  const parts: [V3, V3, number, number, V3][] = [];
  const seg = (a: V3, b: V3, rx: number, rz: number, c: V3) => parts.push([a, b, rx, rz, c]);

  const hipLW = pl(hipL), hipRW = pl(hipR);
  const lw = { knee: pl(legL.knee), ankle: pl(legL.ankle), toe: pl(legL.toe) };
  const rw = { knee: pl(legR.knee), ankle: pl(legR.ankle), toe: pl(legR.toe) };

  seg(add(pelvis, [0, -0.08, 0]), add(pelvis, [0, 0.14, 0.01]), 0.17, 0.12, SHORTS);
  seg(add(pelvis, [0, 0.06, 0]), chest, 0.17, 0.11, SINGLET);
  seg(add(chest, [0, -0.12, 0]), add(chest, [0, 0.04, 0]), 0.2, 0.11, SINGLET);
  seg(chest, add(head, [0, -0.08, -0.02]), 0.05, 0.05, SKIN);
  seg(add(head, [0, -0.11, 0]), add(head, [0, 0.12, 0]), 0.095, 0.108, SKIN);
  seg(add(head, [0, -0.02, -0.02]), add(head, [0, 0.135, -0.01]), 0.1, 0.112, HAIR);

  for (const [h, l] of [[hipLW, lw], [hipRW, rw]] as const) {
    const shortsEnd = add(h, scale([l.knee[0] - h[0], l.knee[1] - h[1], l.knee[2] - h[2]], 0.45));
    seg(h, l.knee, 0.075, 0.08, SKIN);
    seg(add(h, [0, 0.03, 0]), shortsEnd, 0.085, 0.09, SHORTS);
    seg(l.knee, l.ankle, 0.055, 0.06, SKIN);
    seg(add(l.ankle, [0, 0.07, 0]), l.ankle, 0.045, 0.045, SOCK);
    seg(add(l.ankle, sagittal(0, 0.0)), l.toe, 0.05, 0.045, SHOE);
  }

  for (const [sh, a] of [[shL, aL], [shR, aR]] as const) {
    seg(sh, a.elbow, 0.048, 0.05, SKIN);
    seg(a.elbow, a.wrist, 0.04, 0.04, SKIN);
    seg(a.wrist, add(a.wrist, sagittal(1.6, 0.08)), 0.04, 0.035, SKIN);
  }

  const cosH = Math.cos(heading);
  const sinH = Math.sin(heading);
  const toWorld = (v: V3): V3 => [
    pos[0] + v[0] * cosH + v[2] * sinH,
    pos[1] + v[1],
    pos[2] - v[0] * sinH + v[2] * cosH,
  ];
  const lateral: V3 = [cosH, 0, -sinH];

  parts.forEach(([a, b, rx, rz, c], i) => {
    const A = toWorld(a);
    const B = toWorld(b);
    const center: V3 = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];
    let y: V3 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
    const len = Math.hypot(y[0], y[1], y[2]) || 1e-4;
    y = scale(y, 1 / len);
    const d = lateral[0] * y[0] + lateral[1] * y[1] + lateral[2] * y[2];
    let x: V3 = [lateral[0] - y[0] * d, lateral[1] - y[1] * d, lateral[2] - y[2] * d];
    const xl = Math.hypot(x[0], x[1], x[2]) || 1;
    x = scale(x, 1 / xl);
    const z: V3 = [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]];
    // Half-length along the bone, padded so joints overlap without gaps.
    const hy = len / 2 + Math.min(rx, rz) * 0.5;
    const o = i * INSTANCE_FLOATS;
    out.set(
      [
        x[0] * rx, x[1] * rx, x[2] * rx, 0,
        y[0] * hy, y[1] * hy, y[2] * hy, 0,
        z[0] * rz, z[1] * rz, z[2] * rz, 0,
        center[0], center[1], center[2], 1,
        c[0], c[1], c[2], 2,
      ],
      o
    );
  });
  return parts.length;
}

export const RUNNER_MAX_PARTS = 32;
