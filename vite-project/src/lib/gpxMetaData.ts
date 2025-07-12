type GpxPoint = { lat: number; lng: number; ele?: number };

function extractGPXMetadata(gpxContent: string, filename?: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxContent, "text/xml");

  const fallbackName = filename
    ? filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ") // Clean up filename
    : "Unnamed Route";

  const routeName =
    doc.querySelector("trk > name")?.textContent?.trim() ||
    doc.querySelector("metadata > name")?.textContent?.trim() ||
    fallbackName; // Actually use the fallback!

  const trackPoints = doc.querySelectorAll("trkpt");
  const pointCount = trackPoints.length;

  if (pointCount === 0) {
    throw new Error("No track points found");
  }

  let minLat = Infinity,
    maxLat = -Infinity;
  let minLng = Infinity,
    maxLng = -Infinity;
  let totalDistance = 0;
  let elevationGain = 0;
  let maxElevation = -Infinity;
  let minElevation = Infinity;
  let lastElevation: number | null = null;
  let lastPoint: { lat: number; lng: number } | null = null;

  trackPoints.forEach((point) => {
    const lat = parseFloat(point.getAttribute("lat") ?? "0");
    const lng = parseFloat(point.getAttribute("lon") ?? "0");
    const eleText = point.querySelector("ele")?.textContent;
    const ele = eleText ? parseFloat(eleText) : null;

    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);

    if (lastPoint) {
      const R = 6371; // km
      const dLat = ((lat - lastPoint.lat) * Math.PI) / 180;
      const dLng = ((lng - lastPoint.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lastPoint.lat * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }

    // Only process elevation if it exists
    if (ele !== null && !isNaN(ele)) {
      if (lastElevation !== null && ele > lastElevation) {
        elevationGain += ele - lastElevation;
      }
      maxElevation = Math.max(maxElevation, ele);
      minElevation = Math.min(minElevation, ele);
      lastElevation = ele;
    }

    lastPoint = { lat, lng };
  });

  return {
    routeName,
    totalDistance: Math.round(totalDistance * 10) / 10,
    elevationGain: Math.round(elevationGain),
    maxElevation: maxElevation > -Infinity ? Math.round(maxElevation) : null,
    minElevation: minElevation < Infinity ? Math.round(minElevation) : null,
    pointCount,
    bounds: { minLat, maxLat, minLng, maxLng },
    hasElevationData: maxElevation > -Infinity,
  };
}

function parseGPXToPoints(gpxContent: string): GpxPoint[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxContent, "text/xml");
  const trackPoints = doc.querySelectorAll("trkpt");

  const points: GpxPoint[] = [];
  trackPoints.forEach((point) => {
    const lat = parseFloat(point.getAttribute("lat") ?? "0");
    const lng = parseFloat(point.getAttribute("lon") ?? "0");
    const eleText = point.querySelector("ele")?.textContent;
    const ele = eleText ? parseFloat(eleText) : undefined;

    points.push({ lat, lng, ...(ele !== undefined && { ele }) });
  });

  return points;
}

function douglasPeucker(points: GpxPoint[], tolerance: number): GpxPoint[] {
  if (points.length <= 2) return points;

  const perpendicularDistance = (
    point: GpxPoint,
    lineStart: GpxPoint,
    lineEnd: GpxPoint
  ): number => {
    const A = point.lat - lineStart.lat;
    const B = point.lng - lineStart.lng;
    const C = lineEnd.lat - lineStart.lat;
    const D = lineEnd.lng - lineStart.lng;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    if (lenSq === 0) return Math.sqrt(A * A + B * B);

    const param = dot / lenSq;
    let xx, yy;

    if (param < 0) {
      xx = lineStart.lat;
      yy = lineStart.lng;
    } else if (param > 1) {
      xx = lineEnd.lat;
      yy = lineEnd.lng;
    } else {
      xx = lineStart.lat + param * C;
      yy = lineStart.lng + param * D;
    }

    const dx = point.lat - xx;
    const dy = point.lng - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  let maxDistance = 0;
  let maxIndex = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(
      points[i],
      points[0],
      points[points.length - 1]
    );
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  if (maxDistance > tolerance) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIndex), tolerance);
    return left.slice(0, -1).concat(right);
  } else {
    return [points[0], points[points.length - 1]];
  }
}

function simplifyToMaxPoints(
  points: GpxPoint[],
  maxPoints: number
): GpxPoint[] {
  if (points.length <= maxPoints) return points;

  let tolerance = 0.0001;
  let simplified = douglasPeucker(points, tolerance);

  while (simplified.length > maxPoints && tolerance < 0.01) {
    tolerance *= 1.5;
    simplified = douglasPeucker(points, tolerance);
  }

  if (simplified.length > maxPoints) {
    const step = Math.floor(points.length / maxPoints);
    simplified = points.filter((_, index) => index % step === 0);

    // Ensure first and last are kept
    if (simplified[0] !== points[0]) simplified.unshift(points[0]);
    if (simplified[simplified.length - 1] !== points[points.length - 1])
      simplified.push(points[points.length - 1]);
    simplified = simplified.slice(0, maxPoints);
  }

  return simplified;
}

export function processGPXUpload(
  gpxContent: string,
  filename?: string
): {
  original: string;
  displayPoints: GpxPoint[];
  thumbnailPoints: GpxPoint[];
  metadata: ReturnType<typeof extractGPXMetadata>;
} {
  const allPoints = parseGPXToPoints(gpxContent);
  const metadata = extractGPXMetadata(gpxContent, filename);

  return {
    original: gpxContent,
    displayPoints: simplifyToMaxPoints(allPoints, 300),
    thumbnailPoints: simplifyToMaxPoints(allPoints, 50),
    metadata,
  };
}
