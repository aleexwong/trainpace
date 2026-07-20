/**
 * Weather Service — Open-Meteo
 *
 * Client-side weather for training plans, backed by Open-Meteo
 * (https://open-meteo.com): free, keyless, CORS-enabled. Two endpoints:
 *
 * - Forecast API with `past_days`: one request returns both recent history
 *   (up to 92 days back) and the forward forecast (up to 16 days), so the
 *   plan page's "this week + history trends" view is a single fetch.
 * - Geocoding API: city-name search for users who deny browser geolocation
 *   (or want weather for their race city instead of where they live).
 *
 * Also owns the persisted weather location (localStorage, guest-style
 * persistence per app convention) and the training-condition score that
 * ranks days for running.
 */

export interface WeatherLocation {
  latitude: number;
  longitude: number;
  /** Display label — city name from geocoding, or "My location" for geolocation. */
  label: string;
}

export interface DailyWeather {
  /** ISO date "YYYY-MM-DD" in the location's local timezone. */
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  /** 0–100; null for past days (the forecast API only predicts forward). */
  precipProbability: number | null;
  precipSum: number;
  windMax: number;
  /** 0–100 training-condition score (higher = better running weather). */
  score: number;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  name: string;
  /** e.g. region / country for disambiguation ("British Columbia, Canada"). */
  detail: string;
}

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

const LOCATION_KEY = "trainpace_weather_location";

// ---------------------------------------------------------------------------
// Location persistence (localStorage, try/catch-wrapped per app convention)
// ---------------------------------------------------------------------------

export function loadWeatherLocation(): WeatherLocation | null {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const loc = parsed as Partial<WeatherLocation>;
    if (
      typeof loc.latitude !== "number" ||
      typeof loc.longitude !== "number" ||
      typeof loc.label !== "string"
    ) {
      return null;
    }
    return { latitude: loc.latitude, longitude: loc.longitude, label: loc.label };
  } catch {
    return null;
  }
}

export function saveWeatherLocation(location: WeatherLocation): void {
  try {
    localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
  } catch {
    // Storage unavailable (private browsing) — weather still works this session.
  }
}

export function clearWeatherLocation(): void {
  try {
    localStorage.removeItem(LOCATION_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Training-condition score
// ---------------------------------------------------------------------------

/**
 * Score a day's running conditions 0–100. Anchored on an ideal running band
 * of roughly 6–14°C daytime-mean temperature, with penalties for heat
 * (steeper than cold — heat degrades running performance faster), rain
 * likelihood/amount, and strong wind.
 */
export function trainingScore(day: {
  tempMax: number;
  tempMin: number;
  precipProbability: number | null;
  precipSum: number;
  windMax: number;
}): number {
  let score = 100;

  const mid = (day.tempMax + day.tempMin) / 2;
  if (mid < 6) {
    score -= (6 - mid) * 2.5;
  } else if (mid > 14) {
    const over = mid - 14;
    // 2.5 pts/°C up to 22°C-mid, 4.5 pts/°C beyond — hot days fall off fast.
    score -= over <= 8 ? over * 2.5 : 8 * 2.5 + (over - 8) * 4.5;
  }

  if (day.precipProbability !== null) {
    score -= day.precipProbability * 0.35;
  } else {
    score -= Math.min(day.precipSum * 5, 30);
  }

  if (day.windMax > 20) {
    score -= Math.min((day.windMax - 20) * 1.2, 25);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreLabel(score: number): "Great" | "Good" | "Fair" | "Tough" {
  if (score >= 75) return "Great";
  if (score >= 55) return "Good";
  if (score >= 35) return "Fair";
  return "Tough";
}

// ---------------------------------------------------------------------------
// Weather-code display (WMO codes)
// ---------------------------------------------------------------------------

export function weatherCodeMeta(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: "☀️", label: "Clear" };
  if (code <= 2) return { icon: "⛅", label: "Partly cloudy" };
  if (code === 3) return { icon: "☁️", label: "Overcast" };
  if (code === 45 || code === 48) return { icon: "🌫️", label: "Fog" };
  if (code >= 51 && code <= 57) return { icon: "🌦️", label: "Drizzle" };
  if (code >= 61 && code <= 67) return { icon: "🌧️", label: "Rain" };
  if (code >= 71 && code <= 77) return { icon: "🌨️", label: "Snow" };
  if (code >= 80 && code <= 82) return { icon: "🌧️", label: "Showers" };
  if (code === 85 || code === 86) return { icon: "🌨️", label: "Snow showers" };
  if (code >= 95) return { icon: "⛈️", label: "Thunderstorm" };
  return { icon: "🌤️", label: "Mixed" };
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

interface ForecastResponse {
  daily?: {
    time?: string[];
    weather_code?: (number | null)[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    precipitation_probability_max?: (number | null)[];
    precipitation_sum?: (number | null)[];
    wind_speed_10m_max?: (number | null)[];
  };
}

/**
 * Daily weather spanning `pastDays` back through `forecastDays` forward
 * (today included in the forecast side). Dates are local to the coordinates
 * (`timezone=auto`). Days the API can't fill (rare gaps) are dropped.
 */
export async function fetchDailyWeather(
  location: WeatherLocation,
  pastDays: number,
  forecastDays: number
): Promise<DailyWeather[]> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "precipitation_sum",
      "wind_speed_10m_max",
    ].join(","),
    timezone: "auto",
    past_days: String(Math.min(Math.max(pastDays, 0), 92)),
    forecast_days: String(Math.min(Math.max(forecastDays, 1), 16)),
  });

  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) {
    throw new Error(`Weather request failed (${res.status})`);
  }
  const data = (await res.json()) as ForecastResponse;
  const d = data.daily;
  if (!d?.time) {
    throw new Error("Weather response missing daily data");
  }

  const days: DailyWeather[] = [];
  for (let i = 0; i < d.time.length; i++) {
    const tempMax = d.temperature_2m_max?.[i];
    const tempMin = d.temperature_2m_min?.[i];
    if (tempMax == null || tempMin == null) continue;
    const precipProbability = d.precipitation_probability_max?.[i] ?? null;
    const precipSum = d.precipitation_sum?.[i] ?? 0;
    const windMax = d.wind_speed_10m_max?.[i] ?? 0;
    days.push({
      date: d.time[i],
      weatherCode: d.weather_code?.[i] ?? -1,
      tempMax,
      tempMin,
      precipProbability,
      precipSum,
      windMax,
      score: trainingScore({ tempMax, tempMin, precipProbability, precipSum, windMax }),
    });
  }
  return days;
}

interface GeocodeResponse {
  results?: {
    latitude: number;
    longitude: number;
    name: string;
    admin1?: string;
    country?: string;
  }[];
}

/** Search cities by name; up to 5 results. */
export async function searchCity(query: string): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({ name: query, count: "5", language: "en", format: "json" });
  const res = await fetch(`${GEOCODE_URL}?${params}`);
  if (!res.ok) {
    throw new Error(`Location search failed (${res.status})`);
  }
  const data = (await res.json()) as GeocodeResponse;
  return (data.results ?? []).map((r) => ({
    latitude: r.latitude,
    longitude: r.longitude,
    name: r.name,
    detail: [r.admin1, r.country].filter(Boolean).join(", "),
  }));
}
