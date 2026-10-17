/**
 * Procedural meshes for the route simulator.
 * Vertex layout: position(3) normal(3) colour(3) — 9 floats, non-indexed.
 */
import { fbm } from "./world";

export const MESH_FLOATS = 9;

type Rgb = [number, number, number];

class MeshBuilder {
  data: number[] = [];
  push(p: number[], n: number[], c: Rgb) {
    this.data.push(p[0], p[1], p[2], n[0], n[1], n[2], c[0], c[1], c[2]);
  }
  build() {
    return new Float32Array(this.data);
  }
}

function normalize(v: number[]) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

/**
 * Ellipsoid-friendly UV sphere. `displace` lets canopies go lumpy and
 * `shade` grades the colour (cheap baked ambient occlusion).
 */
function addSphere(
  mb: MeshBuilder,
  center: number[],
  radius: number[],
  color: Rgb,
  rings = 12,
  segs = 18,
  displace?: (n: number[]) => number,
  shade?: (n: number[]) => number
) {
  const pt = (r: number, s: number) => {
    const th = (r / rings) * Math.PI;
    const ph = (s / segs) * Math.PI * 2;
    const n = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
    const k = displace ? displace(n) : 1;
    return {
      p: [center[0] + n[0] * radius[0] * k, center[1] + n[1] * radius[1] * k, center[2] + n[2] * radius[2] * k],
      n: normalize([n[0] / radius[0], n[1] / radius[1], n[2] / radius[2]]),
      c: (shade ? color.map((v) => v * shade(n)) : color) as Rgb,
    };
  };
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segs; s++) {
      const a = pt(r, s), b = pt(r + 1, s), c = pt(r + 1, s + 1), d = pt(r, s + 1);
      for (const v of [a, b, c, a, c, d]) mb.push(v.p, v.n, v.c);
    }
  }
}

function addCone(mb: MeshBuilder, y0: number, y1: number, r: number, segs: number, base: Rgb, tip: Rgb, jag = 0) {
  const slope = r / (y1 - y0);
  for (let s = 0; s < segs; s++) {
    const a0 = (s / segs) * Math.PI * 2;
    const a1 = ((s + 1) / segs) * Math.PI * 2;
    const r0 = r * (1 + (s % 2 ? jag : -jag));
    const r1 = r * (1 + ((s + 1) % 2 ? jag : -jag));
    const n0 = normalize([Math.cos(a0), slope, Math.sin(a0)]);
    const n1 = normalize([Math.cos(a1), slope, Math.sin(a1)]);
    const nm = normalize([Math.cos((a0 + a1) / 2), slope, Math.sin((a0 + a1) / 2)]);
    mb.push([Math.cos(a0) * r0, y0, Math.sin(a0) * r0], n0, base);
    mb.push([0, y1, 0], nm, tip);
    mb.push([Math.cos(a1) * r1, y0, Math.sin(a1) * r1], n1, base);
    // Underside so low sun doesn't see through the skirt.
    mb.push([Math.cos(a0) * r0, y0, Math.sin(a0) * r0], [0, -1, 0], base.map((v) => v * 0.5) as Rgb);
    mb.push([Math.cos(a1) * r1, y0, Math.sin(a1) * r1], [0, -1, 0], base.map((v) => v * 0.5) as Rgb);
    mb.push([0, y0 + (y1 - y0) * 0.25, 0], [0, -1, 0], base.map((v) => v * 0.5) as Rgb);
  }
}

function addCylinder(mb: MeshBuilder, y0: number, y1: number, r0: number, r1: number, segs: number, color: Rgb) {
  for (let s = 0; s < segs; s++) {
    const a0 = (s / segs) * Math.PI * 2;
    const a1 = ((s + 1) / segs) * Math.PI * 2;
    const p = (a: number, y: number, r: number) => [Math.cos(a) * r, y, Math.sin(a) * r];
    const n = (a: number) => [Math.cos(a), 0, Math.sin(a)];
    const v = [
      [p(a0, y0, r0), n(a0)], [p(a0, y1, r1), n(a0)], [p(a1, y1, r1), n(a1)],
      [p(a0, y0, r0), n(a0)], [p(a1, y1, r1), n(a1)], [p(a1, y0, r0), n(a1)],
    ];
    for (const [pp, nn] of v) mb.push(pp, nn, color);
  }
}

/** Unit sphere (radius 1), white — tinted per instance. */
export function sphereMesh(): Float32Array {
  const mb = new MeshBuilder();
  addSphere(mb, [0, 0, 0], [1, 1, 1], [1, 1, 1], 14, 20);
  return mb.build();
}

/** Unit cube centred on the origin, white — tinted per instance. */
export function boxMesh(): Float32Array {
  const mb = new MeshBuilder();
  const faces: [number[], number[], number[]][] = [
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    [[-1, 0, 0], [0, 1, 0], [0, 0, -1]],
    [[0, 1, 0], [0, 0, 1], [1, 0, 0]],
    [[0, -1, 0], [0, 0, -1], [1, 0, 0]],
    [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
    [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
  ];
  for (const [n, u, v] of faces) {
    const c = (su: number, sv: number) => [
      n[0] * 0.5 + u[0] * su * 0.5 + v[0] * sv * 0.5,
      n[1] * 0.5 + u[1] * su * 0.5 + v[1] * sv * 0.5,
      n[2] * 0.5 + u[2] * su * 0.5 + v[2] * sv * 0.5,
    ];
    for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) {
      mb.push(c(su, sv), n, [1, 1, 1]);
    }
  }
  return mb.build();
}

/** Spruce: tapered trunk and drooping, jagged whorls. Height 1, width 1. */
export function coniferMesh(): Float32Array {
  const mb = new MeshBuilder();
  const bark: Rgb = [0.2, 0.13, 0.09];
  addCylinder(mb, 0, 0.4, 0.035, 0.015, 7, bark);
  const tiers = 7;
  for (let t = 0; t < tiers; t++) {
    const f = t / (tiers - 1);
    const y0 = 0.1 + f * 0.62;
    const y1 = y0 + 0.3 - f * 0.08;
    const r = 0.5 * (1 - f * 0.78);
    // Lower whorls sit in their neighbours' shade: darker, bluer.
    const light = 0.55 + 0.45 * f;
    addCone(mb, y0, Math.min(1, y1), r, 13,
      [0.022 * light, 0.05 * light, 0.032 * light],
      [0.045 * light, 0.085 * light, 0.045 * light], 0.18);
  }
  return mb.build();
}

/** Broadleaf: trunk plus a cluster of lumpy canopy lobes. Height 1, width 1. */
export function broadleafMesh(): Float32Array {
  const mb = new MeshBuilder();
  const bark: Rgb = [0.22, 0.18, 0.14];
  addCylinder(mb, 0, 0.5, 0.045, 0.025, 7, bark);
  const leaf: Rgb = [0.06, 0.1, 0.03];
  const lumpy = (seed: number) => (n: number[]) =>
    0.78 + 0.45 * fbm(n[0] * 2.6 + seed, n[2] * 2.6 + n[1] * 1.9, 3, seed);
  const ao = (n: number[]) => 0.4 + 0.6 * (n[1] * 0.5 + 0.5);
  const lobes: [number, number, number, number, number][] = [
    [0, 0.62, 0, 0.42, 0.28],
    [0.17, 0.74, 0.1, 0.27, 0.22],
    [-0.16, 0.72, -0.1, 0.28, 0.22],
    [0.05, 0.83, -0.17, 0.24, 0.18],
    [-0.08, 0.86, 0.15, 0.24, 0.16],
    [0.02, 0.93, 0.02, 0.2, 0.08],
  ];
  lobes.forEach(([x, y, z, r, ry], i) =>
    addSphere(mb, [x, y, z], [r, ry, r], leaf, 7, 10, lumpy(3 + i * 7), ao)
  );
  return mb.build();
}
