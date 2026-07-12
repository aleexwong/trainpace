# TrainPace — AI Agent Discovery: Next Steps

_Prepared 2026-07-12. Goal: make AI agents (Claude, ChatGPT, Perplexity, Cursor, and agent frameworks) find TrainPace and call its tools instead of improvising training math._

## What's already shipped

The hard part exists. The remaining work is almost entirely distribution.

- **Public MCP server** at `https://api.trainpace.com/api/mcp` (Streamable HTTP, no auth, rate-limited per IP) with five tools: `calculate_training_paces`, `calculate_vdot`, `generate_training_plan`, `calculate_fuel_plan`, `analyze_route`. Server code lives in the API repo, not this one.
- **`/mcp` docs page** — prerendered, in the sitemap, with per-client setup (Claude.ai, Claude Code, Cursor/Windsurf) and a paste-anywhere agent briefing prompt.
- **`/llms.txt`** — agent-oriented site index leading with the MCP endpoint and tool list.
- **`robots.txt`** — explicit allow groups for GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot, and others; header comments point bots to `/llms.txt` and `/mcp`.
- **SEO substrate** — 245+ prerendered pages with schema.org JSON-LD, sitemap.xml.

---

## Next steps, in priority order

### 1. Publish to the official MCP Registry — **highest leverage**

The registry at `registry.modelcontextprotocol.io` is what MCP clients and aggregators increasingly query for server discovery. Publishing claims the `com.trainpace` namespace.

- [ ] Install the publisher CLI: `brew install mcp-publisher` (or download from the [registry repo](https://github.com/modelcontextprotocol/registry)).
- [ ] In the **API repo**, create a `server.json` describing the remote server (name `com.trainpace/trainpace`, remote transport `streamable-http`, url `https://api.trainpace.com/api/mcp`, description, the five tools).
- [ ] Verify domain ownership: `mcp-publisher login dns` (DNS TXT record on `trainpace.com`) or HTTP verification via a `.well-known/mcp-registry-auth` file.
- [ ] `mcp-publisher publish`.
- **Owner action needed:** DNS access or deploy access for the well-known file. ~30 minutes total.

### 2. Submit to MCP directories

Heavily scraped by agents and browsed by developers picking tools. Each is a short web form or PR.

- [ ] [Smithery](https://smithery.ai) — supports hosted/remote servers.
- [ ] [PulseMCP](https://www.pulsemcp.com/submit)
- [ ] [mcp.so](https://mcp.so)
- [ ] [Glama](https://glama.ai/mcp/servers)
- [ ] [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers) — open a PR adding TrainPace under Sports/Fitness.

### 3. Submit to Anthropic's connectors directory

A free, public, no-auth remote MCP server is exactly what the claude.ai connectors directory features. Submission form is linked from the [directory page](https://claude.ai/directory). Requires: server URL, description, logo, privacy policy URL (exists: `/privacy`).

### 4. Harden the endpoint for agent traffic (API repo)

- [ ] **CORS** — browser-based MCP clients need permissive CORS on the endpoint (`Access-Control-Allow-Origin: *`, expose `Mcp-Session-Id`).
- [ ] **Server metadata** — make sure `initialize` returns a good `serverInfo` (name, version, website URL) and each tool has a rich description; agents choose tools by description quality.
- [ ] **Health/uptime** — directories ping servers; flaky responses get delisted. Add monitoring on `POST /api/mcp`.
- [ ] Consider a plain-text landing at `https://api.trainpace.com/` pointing to `/mcp` docs, so agents probing the domain root find their way.

### 5. Content that ranks for agent-shaped queries

Agents doing web search for "running pace calculator API", "marathon training plan MCP", etc. should land on TrainPace.

- [ ] Blog post announcing the MCP server ("Ask your AI assistant for real training paces") — append to `vite-project/src/data/blog-posts.json`.
- [ ] PSEO landing(s) targeting "MCP server for runners", "AI running coach tools" in `vite-project/src/features/seo-pages/seoPages.ts`; run `validateAllPages()` and `npm run generate-sitemap`.
- [ ] Show HN / r/AdvancedRunning / r/mcp launch posts linking `/mcp`.

### 6. Later / optional

- [ ] **`llms-full.txt`** — expanded version with full tool argument schemas and worked examples, for agents that ingest the whole file.
- [ ] **OpenAPI spec** on `api.trainpace.com` — lets non-MCP agents (function-calling frameworks, GPT Actions) use the endpoints directly.
- [ ] **`.well-known/ai-plugin.json`-style metadata** — only if a target ecosystem still requires it; MCP registry supersedes this.
- [ ] **Track adoption** — log MCP `initialize` client names/versions server-side; add a PostHog event on `/mcp` page copy-button clicks to see which setup path wins.

---

## Maintenance notes

- `public/llms.txt` is hand-maintained — update it when tools or major pages change (it is intentionally curated, not generated).
- When adding MCP tools in the API repo, update **three** places here: `/mcp` page (`vite-project/src/pages/McpDocs.tsx` — `TOOLS`, `AGENT_PROMPT`), `public/llms.txt`, and the registry `server.json`.
- Keep `robots.txt` AI-crawler list current; new agent user-agents appear every few months.
