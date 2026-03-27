/**
 * Vercel serverless function: POST /api/strava/exchange
 *
 * Exchanges a Strava OAuth authorization code for access + refresh tokens.
 * The client_secret stays server-side and is never exposed to the browser.
 *
 * Body: { code: string }
 * Returns: { access_token, refresh_token, expires_at, athlete }
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = req.body as { code?: string };
  if (!code) {
    return res.status(400).json({ error: "Missing code" });
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
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!stravaRes.ok) {
    const err = await stravaRes.text();
    return res.status(400).json({ error: "Strava token exchange failed", detail: err });
  }

  const data = (await stravaRes.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    athlete: unknown;
  };

  return res.status(200).json({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    athlete: data.athlete,
  });
}
