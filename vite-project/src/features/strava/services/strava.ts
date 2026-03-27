import type { StravaActivity, StravaAthleteBasic, StravaTokens } from "../types";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";

async function stravaFetch<T>(
  path: string,
  accessToken: string,
  params?: Record<string, string | number>
): Promise<T> {
  const url = new URL(`${STRAVA_API_BASE}${path}`);
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      url.searchParams.set(key, String(val));
    }
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Strava API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// OAuth helpers (call our own Vercel serverless functions)
// ---------------------------------------------------------------------------

export interface ExchangeResult extends StravaTokens {
  athlete: StravaAthleteBasic;
}

export async function exchangeCodeForTokens(code: string): Promise<ExchangeResult> {
  const res = await fetch("/api/strava/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Token exchange failed");
  }
  return res.json() as Promise<ExchangeResult>;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<StravaTokens> {
  const res = await fetch("/api/strava/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Token refresh failed");
  }
  return res.json() as Promise<StravaTokens>;
}

// ---------------------------------------------------------------------------
// Strava API calls
// ---------------------------------------------------------------------------

export async function getAthlete(accessToken: string): Promise<StravaAthleteBasic> {
  return stravaFetch<StravaAthleteBasic>("/athlete", accessToken);
}

export interface ListActivitiesOptions {
  page?: number;
  per_page?: number;
  before?: number;
  after?: number;
}

export async function listActivities(
  accessToken: string,
  options: ListActivitiesOptions = {}
): Promise<StravaActivity[]> {
  const params: Record<string, number> = {
    page: options.page ?? 1,
    per_page: options.per_page ?? 30,
  };
  if (options.before) params.before = options.before;
  if (options.after) params.after = options.after;
  return stravaFetch<StravaActivity[]>("/athlete/activities", accessToken, params);
}

export async function getActivity(
  accessToken: string,
  activityId: number
): Promise<StravaActivity> {
  return stravaFetch<StravaActivity>(`/activities/${activityId}`, accessToken);
}
