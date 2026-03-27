/**
 * Vercel serverless function: POST /api/strava/refresh
 *
 * Refreshes a Strava access token using a stored refresh token.
 *
 * Body: { refresh_token: string }
 * Returns: { access_token, refresh_token, expires_at }
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { refresh_token } = req.body as { refresh_token?: string };
  if (!refresh_token) {
    return res.status(400).json({ error: "Missing refresh_token" });
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Strava credentials not configured on server" });
  }

  const stravaRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!stravaRes.ok) {
    const err = await stravaRes.text();
    return res.status(400).json({ error: "Strava token refresh failed", detail: err });
  }

  const data = (await stravaRes.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };

  return res.status(200).json({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
  });
}
