/**
 * Reverse geocoding utilities to get city names from coordinates
 * Uses free Nominatim API first, falls back to Mapbox if needed
 */

type GpxPoint = { lat: number; lng: number; ele?: number };

interface GeocodeResult {
  city: string | null;
  country: string | null;
  source?: 'nominatim' | 'mapbox' | 'fallback';
}

/**
 * Primary: Use free Nominatim API (OpenStreetMap)
 * No API key needed, rate limited to 1 request per second
 */
export async function getCityFromRouteNominatim(
  points: GpxPoint[]
): Promise<GeocodeResult> {
  if (!points.length) {
    return { city: null, country: null, source: 'fallback' };
  }

  try {
    // Calculate center point of the route
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    // Nominatim reverse geocoding API (free, no API key)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${centerLat}&lon=${centerLng}&zoom=10`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TrainPace-PosterGenerator/1.0 (trainpace.com)'
      }
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return { city: null, country: null, source: 'fallback' };
    }

    const data = await response.json();

    // Extract city from address
    const address = data.address || {};
    const city = address.city || address.town || address.village || address.municipality;
    const country = address.country;

    if (city) {
      console.log('📍 Geocoded location (Nominatim):', city, country);
      return { city, country, source: 'nominatim' };
    }

    return { city: null, country: null, source: 'fallback' };
  } catch (error) {
    console.error('Error geocoding location (Nominatim):', error);
    return { city: null, country: null, source: 'fallback' };
  }
}

/**
 * Fallback: Use Mapbox API (requires token)
 * Only used if Nominatim fails
 */
export async function getCityFromRouteMapbox(
  points: GpxPoint[],
  mapboxToken: string
): Promise<GeocodeResult> {
  if (!points.length || !mapboxToken) {
    return { city: null, country: null, source: 'fallback' };
  }

  try {
    // Calculate center point of the route
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    // Mapbox reverse geocoding API
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${centerLng},${centerLat}.json?access_token=${mapboxToken}&types=place,locality`;

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Mapbox Geocoding API error:', response.status);
      return { city: null, country: null, source: 'fallback' };
    }

    const data = await response.json();

    // Extract city name from the first result
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const city = feature.text || feature.place_name.split(',')[0];
      
      // Try to extract country from context
      let country = null;
      if (feature.context) {
        const countryContext = feature.context.find((c: any) => 
          c.id.startsWith('country')
        );
        country = countryContext?.text || null;
      }

      console.log('📍 Geocoded location (Mapbox):', city, country);
      return { city, country, source: 'mapbox' };
    }

    return { city: null, country: null, source: 'fallback' };
  } catch (error) {
    console.error('Error geocoding location (Mapbox):', error);
    return { city: null, country: null, source: 'fallback' };
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
    return { city: null, country: null, source: 'fallback' };
  }

  // Try free Nominatim API first
  console.log('🌍 Trying Nominatim (free) for geocoding...');
  const nominatimResult = await getCityFromRouteNominatim(points);
  
  if (nominatimResult.city) {
    console.log('✅ Nominatim succeeded:', nominatimResult.city);
    return nominatimResult;
  }

  // Fallback to Mapbox if Nominatim fails and token is available
  if (mapboxToken) {
    console.log('🔄 Nominatim failed, trying Mapbox fallback...');
    const mapboxResult = await getCityFromRouteMapbox(points, mapboxToken);
    
    if (mapboxResult.city) {
      console.log('✅ Mapbox fallback succeeded:', mapboxResult.city);
      return mapboxResult;
    }
  }

  // Both failed
  console.log('⚠️ All geocoding methods failed');
  return { city: null, country: null, source: 'fallback' };
}
