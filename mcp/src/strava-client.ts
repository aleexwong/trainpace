import axios from "axios";

const TOKEN_URL = "https://www.strava.com/oauth/token";
const API_BASE = "https://www.strava.com/api/v3";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}

export class StravaClient {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private accessToken: string | null = null;
  private expiresAt = 0;

  constructor(clientId: string, clientSecret: string, refreshToken: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.refreshToken = refreshToken;
  }

  private async ensureFreshToken(): Promise<string> {
    const nowSec = Math.floor(Date.now() / 1000);
    // Refresh 60 seconds before expiry
    if (this.accessToken && this.expiresAt > nowSec + 60) {
      return this.accessToken;
    }

    const res = await axios.post<TokenResponse>(TOKEN_URL, {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
      grant_type: "refresh_token",
    });

    this.accessToken = res.data.access_token;
    this.expiresAt = res.data.expires_at;
    // Update the stored refresh token if Strava rotated it
    this.refreshToken = res.data.refresh_token;
    return this.accessToken;
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const token = await this.ensureFreshToken();
    const res = await axios.get<T>(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return res.data;
  }
}

export function createClientFromEnv(): StravaClient {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing required env vars: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN\n" +
        "Copy .env.example to .env and fill in your values."
    );
  }

  return new StravaClient(clientId, clientSecret, refreshToken);
}
