/**
 * Poster Feature - Mapbox Utilities
 *
 * GL JS loading and request metering are shared app-wide (@/lib/mapbox); this
 * module keeps only the poster-specific viewport maths.
 */

/**
 * Calculate zoom level for given bounds and container dimensions
 */
export const calculateZoom = (
  lats: number[],
  lngs: number[],
  containerWidth: number,
  containerHeight: number
): number => {
  const WORLD_DIM = { height: 256, width: 256 };
  const ZOOM_MAX = 18;

  function latRad(lat: number) {
    const sin = Math.sin((lat * Math.PI) / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  }

  function zoom(mapPx: number, worldPx: number, fraction: number) {
    return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  }

  const latFraction =
    (latRad(Math.max(...lats)) - latRad(Math.min(...lats))) / Math.PI;
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  const lngFraction = lngSpan / 360;

  const latZoom = zoom(containerHeight, WORLD_DIM.height, latFraction);
  const lngZoom = zoom(containerWidth, WORLD_DIM.width, lngFraction);

  // Use the lower zoom to ensure route fits, subtract 1 for padding
  return Math.min(latZoom, lngZoom, ZOOM_MAX) - 1;
};

/**
 * Calculate center point from coordinate arrays
 */
export const calculateCenter = (
  lats: number[],
  lngs: number[]
): [number, number] => {
  return [
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ];
};
