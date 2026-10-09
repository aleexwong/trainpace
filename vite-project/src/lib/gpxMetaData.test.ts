/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { processGPXUpload } from "./gpxMetaData";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

/** Build a minimal GPX document from an array of [lat, lng, ele?] tuples. */
function makeGPX(
  points: Array<[number, number, number | undefined]>,
  opts: { name?: string; extra?: string } = {}
): string {
  const trkpts = points
    .map(([lat, lng, ele]) => {
      const eleTag = ele !== undefined ? `<ele>${ele}</ele>` : "";
      return `<trkpt lat="${lat}" lon="${lng}">${eleTag}</trkpt>`;
    })
    .join("");
  const nameTag = opts.name ? `<name>${opts.name}</name>` : "";
  return `<?xml version="1.0"?>
<gpx version="1.1"><trk>${nameTag}<trkseg>${trkpts}</trkseg></trk>${
    opts.extra ?? ""
  }</gpx>`;
}

/** Great-circle distance (km) between two points on the same meridian
 * (lng fixed), computed by hand via the haversine special case, used to
 * derive expected distances independently of the module under test. */
function meridianDistanceKm(dLatDeg: number): number {
  const R = 6371;
  return R * (dLatDeg * Math.PI) / 180;
}

// ---------------------------------------------------------------------------
// processGPXUpload — metadata correctness
// ---------------------------------------------------------------------------

describe("processGPXUpload — metadata on well-formed GPX", () => {
  it("counts track points correctly", () => {
    const gpx = makeGPX([
      [0, 0, 0],
      [1, 0, 10],
      [2, 0, 20],
    ]);
    const result = processGPXUpload(gpx);
    expect(result.metadata.pointCount).toBe(3);
  });

  it("computes total distance for points on a single meridian by hand-verified geometry", () => {
    // Two 1-degree hops due north along lng=0. Haversine with dLng=0 reduces
    // to 2*asin(sin(dLat/2)) = dLat exactly, so distance = R * dLat(rad).
    const gpx = makeGPX([
      [0, 0, undefined],
      [1, 0, undefined],
      [2, 0, undefined],
    ]);
    const expectedKm =
      Math.round((meridianDistanceKm(1) + meridianDistanceKm(1)) * 10) / 10;
    const result = processGPXUpload(gpx);
    expect(result.metadata.totalDistance).toBeCloseTo(expectedKm, 1);
  });

  it("computes elevation gain as the sum of positive deltas only, not net change", () => {
    // 0 -> 100 (+100) -> 50 (-50). Net change is +50; total absolute change
    // is 150. Correct "gain" must be exactly 100.
    const gpx = makeGPX([
      [0, 0, 0],
      [0.001, 0, 100],
      [0.002, 0, 50],
    ]);
    const result = processGPXUpload(gpx);
    expect(result.metadata.elevationGain).toBeCloseTo(100, 0);
  });

  it("does not conflate loss with gain on a longer up/down/up route", () => {
    // Deltas: +100, -30, +40, -10. Only positive deltas count: 100+40 = 140.
    const gpx = makeGPX([
      [0, 0, 0],
      [0.001, 0, 100],
      [0.002, 0, 70],
      [0.003, 0, 110],
      [0.004, 0, 100],
    ]);
    const result = processGPXUpload(gpx);
    expect(result.metadata.elevationGain).toBeCloseTo(140, 0);
  });

  it("reports correct min/max elevation", () => {
    const gpx = makeGPX([
      [0, 0, 10],
      [0.001, 0, 250],
      [0.002, 0, -5],
    ]);
    const result = processGPXUpload(gpx);
    expect(result.metadata.maxElevation).toBeCloseTo(250, 0);
    expect(result.metadata.minElevation).toBeCloseTo(-5, 0);
  });

  it("computes correct lat/lng bounds", () => {
    const gpx = makeGPX([
      [10, 20, 0],
      [12, 18, 0],
      [11, 25, 0],
    ]);
    const result = processGPXUpload(gpx);
    expect(result.metadata.bounds).toEqual({
      minLat: 10,
      maxLat: 12,
      minLng: 18,
      maxLng: 25,
    });
  });

  it("uses the trk > name element as routeName when present", () => {
    const gpx = makeGPX(
      [
        [0, 0, 0],
        [1, 0, 0],
      ],
      { name: "Morning Run" }
    );
    const result = processGPXUpload(gpx, "some-file.gpx");
    expect(result.metadata.routeName).toBe("Morning Run");
  });

  it("falls back to a cleaned-up filename when no name element exists", () => {
    const gpx = makeGPX([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const result = processGPXUpload(gpx, "central_park-loop.gpx");
    expect(result.metadata.routeName).toBe("central park loop");
  });
});

// ---------------------------------------------------------------------------
// Malformed / degenerate input handling
// ---------------------------------------------------------------------------

describe("processGPXUpload — malformed input handling", () => {
  it("throws a clear error for content that is not XML at all", () => {
    expect(() => processGPXUpload("this is just plain text, not xml")).toThrow();
  });

  it("throws a clear error for well-formed XML that is not GPX", () => {
    expect(() =>
      processGPXUpload("<foo><bar>not gpx</bar></foo>")
    ).toThrow();
  });

  it("throws a clear error for a GPX document with no track points", () => {
    const gpx = `<?xml version="1.0"?><gpx version="1.1"><trk><trkseg></trkseg></trk></gpx>`;
    expect(() => processGPXUpload(gpx)).toThrow(/no track points/i);
  });

  it("handles a GPX with points missing elevation data without throwing or producing NaN", () => {
    const gpx = makeGPX([
      [0, 0, undefined],
      [1, 0, undefined],
      [2, 0, undefined],
    ]);
    let result: ReturnType<typeof processGPXUpload> | undefined;
    expect(() => {
      result = processGPXUpload(gpx);
    }).not.toThrow();
    expect(result!.metadata.hasElevationData).toBe(false);
    expect(result!.metadata.maxElevation).toBeNull();
    expect(result!.metadata.minElevation).toBeNull();
    expect(result!.metadata.elevationGain).toBe(0);
    expect(Number.isNaN(result!.metadata.elevationGain)).toBe(false);
  });

  it("handles a single-point GPX gracefully (zero distance, zero gain, no throw)", () => {
    const gpx = makeGPX([[45, -73, 100]]);
    let result: ReturnType<typeof processGPXUpload> | undefined;
    expect(() => {
      result = processGPXUpload(gpx);
    }).not.toThrow();
    expect(result!.metadata.pointCount).toBe(1);
    expect(result!.metadata.totalDistance).toBe(0);
    expect(result!.metadata.elevationGain).toBe(0);
    expect(result!.metadata.maxElevation).toBeCloseTo(100, 0);
    expect(result!.displayPoints).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Security hardening — hostile embedded content
// ---------------------------------------------------------------------------

describe("processGPXUpload — hostile content embedded in an otherwise-valid GPX", () => {
  it("FINDING: parses successfully and echoes <script>/<iframe>/<object>/<embed> verbatim in `original` with no sanitization", () => {
    // The security review recommends rejecting documents that carry these
    // elements. Today the module does no such check: it only ever queries
    // for trkpt/name/ele nodes, so hostile siblings are simply ignored during
    // extraction — but the raw `original` string (which callers may render,
    // e.g. as a preview or re-download) passes through completely unmodified.
    const hostileExtra = `
      <script>alert('xss')</script>
      <iframe src="https://evil.example/"></iframe>
      <object data="https://evil.example/payload"></object>
      <embed src="https://evil.example/payload.swf"></embed>
    `;
    const gpx = makeGPX(
      [
        [0, 0, 0],
        [1, 0, 10],
      ],
      { extra: hostileExtra }
    );

    let result: ReturnType<typeof processGPXUpload> | undefined;
    expect(() => {
      result = processGPXUpload(gpx);
    }).not.toThrow();

    // Parsing/metadata extraction is unaffected by the hostile elements...
    expect(result!.metadata.pointCount).toBe(2);

    // ...but nothing strips or rejects them. This is a gap, not a guarantee:
    // downstream code that trusts `original` as safe-to-render markup would
    // be exposed. Documenting the current (insecure) behaviour, not
    // endorsing it.
    expect(result!.original).toContain("<script>");
    expect(result!.original).toContain("<iframe");
    expect(result!.original).toContain("<object");
    expect(result!.original).toContain("<embed");
  });
});

// ---------------------------------------------------------------------------
// Simplification: maxPoints cap + the suspected last-point slice bug
// ---------------------------------------------------------------------------

/**
 * Build a long, sharply zig-zagging track so Douglas-Peucker cannot reduce it
 * under maxPoints even at its maximum tolerance (0.01 degrees), forcing
 * processGPXUpload's fallback step-filter path to run.
 */
function makeZigzagGPX(count: number): Array<[number, number, number | undefined]> {
  const pts: Array<[number, number, number | undefined]> = [];
  for (let i = 0; i < count; i++) {
    const lat = i * 0.0005; // steadily increasing, never colinear-degenerate
    const lng = i % 2 === 0 ? 0 : 0.05; // amplitude (0.05) far exceeds the
    // DP tolerance ceiling (0.01), so every interior point stays far from
    // whatever chord DP measures against, and DP can't collapse the route.
    pts.push([lat, lng, 100 + i]);
  }
  return pts;
}

/** A perfectly straight line: colinear points collapse trivially under DP. */
function makeStraightLineGPX(count: number): Array<[number, number, number | undefined]> {
  const pts: Array<[number, number, number | undefined]> = [];
  for (let i = 0; i < count; i++) {
    pts.push([i * 0.001, 0, 100 + i]);
  }
  return pts;
}

describe("processGPXUpload — simplification respects maxPoints and endpoints", () => {
  it("caps displayPoints at 300 and thumbnailPoints at 50 for a large route", () => {
    const gpx = makeGPX(makeZigzagGPX(1000));
    const result = processGPXUpload(gpx);
    expect(result.displayPoints.length).toBeLessThanOrEqual(300);
    expect(result.thumbnailPoints.length).toBeLessThanOrEqual(50);
  });

  it("preserves the true final point through the Douglas-Peucker path", () => {
    const rawPoints = makeStraightLineGPX(1000);
    const gpx = makeGPX(rawPoints);
    const result = processGPXUpload(gpx);
    const lastInput = rawPoints[rawPoints.length - 1];
    const lastOutput = result.displayPoints[result.displayPoints.length - 1];
    expect(lastOutput.lat).toBeCloseTo(lastInput[0], 6);
    expect(lastOutput.lng).toBeCloseTo(lastInput[1], 6);
  });

  it("preserves the true final point through the fallback step-filter path (suspected bug check)", () => {
    // With 1000 zig-zagging points and maxPoints=300, Douglas-Peucker cannot
    // get under the cap even at tolerance=0.01, so simplifyToMaxPoints()
    // falls into its step-filter branch (gpxMetaData.ts ~lines 187-199):
    //
    //   simplified = points.filter((_, index) => index % step === 0);
    //   simplified = simplified.slice(0, maxPoints);
    //   if (simplified.length >= 2) {
    //     simplified[0] = points[0];
    //     simplified[simplified.length - 1] = points[points.length - 1];
    //   } ...
    //
    // A naive version of this pattern (push the true last point, THEN slice)
    // would drop it again since slice(0, maxPoints) trims from the end. But
    // the code actually present here does the slice FIRST and then
    // overwrites simplified[0] and simplified[last] by direct index
    // assignment — which is immune to that ordering problem. Verified by
    // reading gpxMetaData.ts as committed (no local modifications: `git diff
    // HEAD -- src/lib/gpxMetaData.ts` is empty) — the "push then slice"
    // shape described in the bug report is NOT what is in this file. The
    // endpoint-forcing lines even carry a comment acknowledging exactly this
    // risk ("the slice above can otherwise omit the last point").
    //
    // This test forces the fallback path and asserts the CORRECT behaviour.
    // It currently passes — the suspected bug is NOT present in this
    // module as it stands.
    const rawPoints = makeZigzagGPX(1000);
    const gpx = makeGPX(rawPoints);
    const result = processGPXUpload(gpx);

    const lastInput = rawPoints[rawPoints.length - 1];
    const lastOutput = result.displayPoints[result.displayPoints.length - 1];
    expect(lastOutput.lat).toBeCloseTo(lastInput[0], 6);
    expect(lastOutput.lng).toBeCloseTo(lastInput[1], 6);

    // Same check against the more aggressive 50-point thumbnail cap.
    const lastThumb =
      result.thumbnailPoints[result.thumbnailPoints.length - 1];
    expect(lastThumb.lat).toBeCloseTo(lastInput[0], 6);
    expect(lastThumb.lng).toBeCloseTo(lastInput[1], 6);
  });

  it("preserves the true first point through both simplification paths", () => {
    const straight = makeStraightLineGPX(1000);
    const zigzag = makeZigzagGPX(1000);

    const straightResult = processGPXUpload(makeGPX(straight));
    expect(straightResult.displayPoints[0].lat).toBeCloseTo(straight[0][0], 6);

    const zigzagResult = processGPXUpload(makeGPX(zigzag));
    expect(zigzagResult.displayPoints[0].lat).toBeCloseTo(zigzag[0][0], 6);
    expect(zigzagResult.thumbnailPoints[0].lat).toBeCloseTo(zigzag[0][0], 6);
  });

  it("leaves routes already under the cap untouched", () => {
    const rawPoints: Array<[number, number, number | undefined]> = [
      [0, 0, 0],
      [1, 0, 10],
      [2, 0, 20],
    ];
    const gpx = makeGPX(rawPoints);
    const result = processGPXUpload(gpx);
    expect(result.displayPoints).toHaveLength(3);
    expect(result.thumbnailPoints).toHaveLength(3);
  });
});
