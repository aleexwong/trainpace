# TrainPace Strava MCP Server

MCP (Model Context Protocol) server that exposes your Strava data to Claude.
Use it in Claude Code sessions to analyze training history, sync activities to
TrainPace, and explore routes.

## Available Tools

| Tool | Description |
|------|-------------|
| `get_athlete` | Your Strava profile |
| `get_athlete_stats` | Run/ride totals and PRs |
| `list_activities` | Recent activities (filterable by type, date) |
| `get_activity` | Full activity details by ID |
| `get_activity_streams` | GPS, pace, HR streams |
| `list_routes` | Your saved Strava routes |
| `export_route_gpx` | Download a route as GPX for TrainPace elevation analysis |

## Setup

### 1. Create a Strava API Application

1. Go to https://www.strava.com/settings/api
2. Create an app (any name/website is fine for personal use)
3. Note your **Client ID** and **Client Secret**
4. Set "Authorization Callback Domain" to `localhost`

### 2. Get Your Refresh Token

Run this one-time OAuth flow to get a refresh token with the required scopes:

**Step 1 — Open this URL in your browser** (replace `YOUR_CLIENT_ID`):
```
https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost&response_type=code&scope=read,activity:read_all,profile:read_all
```

**Step 2 — Authorize the app.** Strava will redirect to `http://localhost/?code=XXXX`.
Copy the `code` value from the URL.

**Step 3 — Exchange the code for tokens** (replace values):
```bash
curl -X POST https://www.strava.com/oauth/token \
  -d client_id=YOUR_CLIENT_ID \
  -d client_secret=YOUR_CLIENT_SECRET \
  -d code=CODE_FROM_STEP_2 \
  -d grant_type=authorization_code
```

Copy the `refresh_token` from the JSON response.

### 3. Configure Credentials

```bash
cp .env.example .env
# Edit .env with your CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN
```

### 4. Install Dependencies and Build

```bash
cd mcp
npm install
npm run build
```

### 5. Add to Claude Code

Add to your `~/.claude/settings.json` (or project `.claude/settings.json`):

```json
{
  "mcpServers": {
    "trainpace-strava": {
      "command": "node",
      "args": ["/absolute/path/to/trainpace/mcp/dist/index.js"]
    }
  }
}
```

Or for development (no build step):
```json
{
  "mcpServers": {
    "trainpace-strava": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/trainpace/mcp/src/index.ts"]
    }
  }
}
```

## Local Development

```bash
npm run dev   # Run with tsx (no build step)
npm run build # Compile TypeScript
npm start     # Run compiled JS
```
