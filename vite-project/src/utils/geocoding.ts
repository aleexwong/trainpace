/**
 * Reverse geocoding utilities to get city names from coordinates
 * Uses free Nominatim API first, falls back to Mapbox if needed
 */

type GpxPoint = { lat: number; lng: number; ele?: number };

interface GeocodeResult {
  city: string | null;
  country: string | null;
  source?: "nominatim" | "mapbox" | "fallback";
}

// ========== CACHE & THROTTLE ==========

// In-memory cache for geocoding results
// Keys are rounded coordinates (e.g., "45.52,-122.68")
const geocodeCache = new Map<string, GeocodeResult>();

// Throttle mechanism for Nominatim (1 req/sec limit)
let lastNominatimRequest = 0;
const NOMINATIM_MIN_INTERVAL = 1100; // 1.1 seconds to be safe

/**
 * Generate cache key from coordinates (rounded to 2 decimal places)
 * This prevents cache misses from minor coordinate differences
 */
function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

/**
 * Throttle helper for Nominatim requests
 * Waits if necessary to respect 1 req/sec rate limit
 */
async function throttleNominatim(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastNominatimRequest;

  if (timeSinceLastRequest < NOMINATIM_MIN_INTERVAL) {
    const waitTime = NOMINATIM_MIN_INTERVAL - timeSinceLastRequest;
    console.log(`⏱️  Throttling Nominatim request (waiting ${waitTime}ms)`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastNominatimRequest = Date.now();
}

// ======================================

/**
 * Primary: Use free Nominatim API (OpenStreetMap)
 * No API key needed, rate limited to 1 request per second
 */
export async function getCityFromRouteNominatim(
  points: GpxPoint[]
): Promise<GeocodeResult> {
  if (!points.length) {
    return { city: null, country: null, source: "fallback" };
  }

  try {
    // Use end point of the route (finish line location)
    const endPoint = points[points.length - 1];
    const centerLat = endPoint.lat;
    const centerLng = endPoint.lng;

    // Check cache first
    const cacheKey = getCacheKey(centerLat, centerLng);
    const cached = geocodeCache.get(cacheKey);
    if (cached) {
      console.log("💾 Cache hit for location:", cached.city, "(Nominatim)");
      return cached;
    }

    // Throttle request to respect rate limits
    await throttleNominatim();

    // Nominatim reverse geocoding API (free, no API key)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${centerLat}&lon=${centerLng}&zoom=10`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "TrainPace-PosterGenerator/1.0 (trainpace.com)",
      },
    });

    if (!response.ok) {
      console.error("Nominatim API error:", response.status);
      return { city: null, country: null, source: "fallback" };
    }

    const data = await response.json();

    // Extract city from address
    const address = data.address || {};
    const city =
      address.city || address.town || address.village || address.municipality;
    const country = address.country;

    if (city) {
      const result: GeocodeResult = { city, country, source: "nominatim" };

      // Cache the successful result
      geocodeCache.set(cacheKey, result);
      console.log(
        "📍 Geocoded location (Nominatim):",
        city,
        country,
        "- cached"
      );

      return result;
    }

    return { city: null, country: null, source: "fallback" };
  } catch (error) {
    console.error("Error geocoding location (Nominatim):", error);
    return { city: null, country: null, source: "fallback" };
  }
}

/**
 * Fallback: Use Mapbox API (requires token)
 * Only used if Nominatim fails
 */
// export async function getCityFromRouteMapbox(
//   points: GpxPoint[],
//   mapboxToken: string
// ): Promise<GeocodeResult> {
//   if (!points.length || !mapboxToken) {
//     return { city: null, country: null, source: 'fallback' };
//   }

//   try {
//     // Use end point of the route (finish line location)
//     const endPoint = points[points.length - 1];
//     const centerLat = endPoint.lat;
//     const centerLng = endPoint.lng;

//     // Check cache first
//     const cacheKey = getCacheKey(centerLat, centerLng);
//     const cached = geocodeCache.get(cacheKey);
//     if (cached) {
//       console.log('💾 Cache hit for location:', cached.city, '(Mapbox)');
//       return cached;
//     }

//     // Mapbox reverse geocoding API
//     const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${centerLng},${centerLat}.json?access_token=${mapboxToken}&types=place,locality`;

//     const response = await fetch(url);

//     if (!response.ok) {
//       console.error('Mapbox Geocoding API error:', response.status);
//       return { city: null, country: null, source: 'fallback' };
//     }

//     const data = await response.json();

//     // Extract city name from the first result
//     if (data.features && data.features.length > 0) {
//       const feature = data.features[0];
//       const city = feature.text || feature.place_name.split(',')[0];

//       // Try to extract country from context
//       let country = null;
//       if (feature.context) {
//         const countryContext = feature.context.find((c: any) =>
//           c.id.startsWith('country')
//         );
//         country = countryContext?.text || null;
//       }

//       const result: GeocodeResult = { city, country, source: 'mapbox' };

//       // Cache the successful result
//       geocodeCache.set(cacheKey, result);
//       console.log('📍 Geocoded location (Mapbox):', city, country, '- cached');

//       return result;
//     }

//     return { city: null, country: null, source: 'fallback' };
//   } catch (error) {
//     console.error('Error geocoding location (Mapbox):', error);
//     return { city: null, country: null, source: 'fallback' };
//   }
// }
export async function getCityFromRouteMapbox(
  points: GpxPoint[],
  mapboxToken: string
): Promise<GeocodeResult> {
  if (!points.length || !mapboxToken) {
    return { city: null, country: null, source: "fallback" };
  }

  try {
    // Use end point of the route (finish line location)
    const endPoint = points[points.length - 1];
    const centerLat = endPoint.lat;
    const centerLng = endPoint.lng;

    // Check cache first
    const cacheKey = getCacheKey(centerLat, centerLng);
    const cached = geocodeCache.get(cacheKey);
    if (cached) {
      console.log("💾 Cache hit for location:", cached.city, "(Mapbox)");
      return cached;
    }

    // Mapbox reverse geocoding API
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${centerLng},${centerLat}.json?access_token=${mapboxToken}&types=place,locality`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error("Mapbox Geocoding API error:", response.status);
      return { city: null, country: null, source: "fallback" };
    }

    const data = await response.json();
    const features: any[] = data.features || [];
    if (!features.length) {
      return { city: null, country: null, source: "fallback" };
    }

    // --- Helper: pick the best feature (prefer place, then locality) ---
    const pickBestFeature = (features: any[]): any | null => {
      // First try to find a city-level "place"
      const placeFeature = features.find((f: any) =>
        f.place_type?.includes("place")
      );
      if (placeFeature) return placeFeature;

      // Fallback: take a locality if no place exists
      const localityFeature = features.find((f: any) =>
        f.place_type?.includes("locality")
      );
      if (localityFeature) return localityFeature;

      // Absolute fallback: first feature
      return features[0] || null;
    };

    // --- Helper: extract main city + country from a feature ---
    const extractMainCityAndCountry = (feature: any): GeocodeResult => {
      let city: string | null = null;
      let country: string | null = null;

      // If this feature is already a "place", treat it as the city
      if (feature.place_type?.includes("place")) {
        city = feature.text || feature.place_name?.split(",")[0] || null;
      } else if (feature.place_type?.includes("locality")) {
        // Locality (neighborhood / smaller area) – try to climb up to a parent place
        const ctx = feature.context || [];
        const parentPlace = ctx.find((c: any) => c.id?.startsWith("place"));
        if (parentPlace) {
          city = parentPlace.text || null;
        } else {
          // No parent place – fall back to locality name
          city = feature.text || feature.place_name?.split(",")[0] || null;
        }
      } else {
        // Other types – just fall back to basic text/name
        city = feature.text || feature.place_name?.split(",")[0] || null;
      }

      // Country from context (same as before, but guarded)
      if (feature.context) {
        const countryContext = feature.context.find((c: any) =>
          c.id?.startsWith("country")
        );
        country = countryContext?.text || null;
      }

      return {
        city,
        country,
        source: "mapbox",
      };
    };

    const bestFeature = pickBestFeature(features);
    if (!bestFeature) {
      return { city: null, country: null, source: "fallback" };
    }

    const result = extractMainCityAndCountry(bestFeature);

    if (result.city) {
      geocodeCache.set(cacheKey, result);
      console.log(
        "📍 Geocoded location (Mapbox):",
        result.city,
        result.country,
        "- cached"
      );
      return result;
    }

    return { city: null, country: null, source: "fallback" };
  } catch (error) {
    console.error("Error geocoding location (Mapbox):", error);
    return { city: null, country: null, source: "fallback" };
  }
}
/**
 * Smart geocoding: Try free Nominatim first, fall back to Mapbox if needed
 * This saves API costs and respects rate limits
 */
export async function getCityFromRoute(
  points: GpxPoint[],
  mapboxToken?: string
): Promise<GeocodeResult> {
  if (!points.length) {
    return { city: null, country: null, source: "fallback" };
  }

  // Try free Nominatim API first
  console.log("🌍 Trying Nominatim (free) for geocoding...");
  const nominatimResult = await getCityFromRouteNominatim(points);

  if (nominatimResult.city) {
    console.log("✅ Nominatim succeeded:", nominatimResult.city);
    return nominatimResult;
  }

  // Fallback to Mapbox if Nominatim fails and token is available
  if (mapboxToken) {
    console.log("🔄 Nominatim failed, trying Mapbox fallback...");
    const mapboxResult = await getCityFromRouteMapbox(points, mapboxToken);

    if (mapboxResult.city) {
      console.log("✅ Mapbox fallback succeeded:", mapboxResult.city);
      return mapboxResult;
    }
  }

  // Both failed
  console.log("⚠️ All geocoding methods failed");
  return { city: null, country: null, source: "fallback" };
}
