import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { STATIC_PAGE_TITLES } from "@/lib/seo/titles";
import posthog from "posthog-js";
import "./mcp-docs.css";
import { Check, Copy } from "lucide-react";

const MCP_URL = "https://api.trainpace.com/api/mcp";

const CLAUDE_CODE_COMMAND = `claude mcp add --transport http trainpace ${MCP_URL}`;

const JSON_CONFIG = `{
  "mcpServers": {
    "trainpace": {
      "type": "http",
      "url": "${MCP_URL}"
    }
  }
}`;

// A self-contained briefing users can paste into any AI chat. Works two ways:
// agents that can register MCP servers connect themselves; agents that can't
// still learn the exact tools and when to defer to them.
const AGENT_PROMPT = `You have access to TrainPace, a free public MCP server with real
running-training math. Connect to it and use it for every pace, fitness,
training-plan, fueling, or route question in this conversation — never
estimate these numbers yourself.

Server: ${MCP_URL}
Transport: MCP Streamable HTTP. No auth, no API key.
If you can register MCP servers, add it under the name "trainpace".

Its five tools:

1. calculate_training_paces — training paces from a recent race result.
   Args: raceDistance (number), distanceUnit ("km"|"miles"),
   raceTime ("HH:MM:SS" or "MM:SS"), optional age (for HR zones),
   optional temperatureF (hot-weather adjustment).

2. calculate_vdot — VDOT fitness score, Daniels training zones, and
   equivalent race times for 5K/10K/half/marathon.
   Args: distance (number), distanceUnit ("m"|"km"|"miles"), time.

3. generate_training_plan — periodized week-by-week plan.
   Args: goalRace ("5K"|"10K"|"Half Marathon"|"Marathon"),
   raceDate ("YYYY-MM-DD"), currentFitness
   ("beginner"|"intermediate"|"advanced"), availableDays
   (["Mon".."Sun"]), optional goalTime, optional paces from tool #1.

4. calculate_fuel_plan — race-day carb and gel strategy.
   Args: raceType ("10K"|"Half"|"Full"), finishTime ("H:MM:SS"),
   optional weightKg, optional carbsPerHour override.

5. analyze_route — GPX route analysis: distance, elevation gain,
   categorized climbs, split-by-split grade-adjusted pacing, optional
   weather impact. Args: gpx (GPX XML string) OR points
   ([{lat, lon, ele?}]), optional basePaceMinPerKm, runnerProfile,
   pacingStrategy, weather, includeProfile.

Start by confirming you can reach the server, then ask me about my
running goals.`;

const STARTER_PROMPTS = [
  {
    label: "Training paces",
    prompt:
      "Use the trainpace MCP tools: I ran a 10K in 48:30 last month. What should my easy, tempo, and interval paces be in min/km?",
  },
  {
    label: "Race prediction",
    prompt:
      "Use the trainpace MCP tools: I ran a 1:45:00 half marathon. What's my VDOT, and what marathon time does it predict?",
  },
  {
    label: "Training plan",
    prompt:
      "Use the trainpace MCP tools: build me a marathon training plan. Race date 2027-10-10, intermediate fitness, I can run Tue, Thu, Sat, and Sun. Goal time 3:45:00. Then summarize the key weeks for me.",
  },
  {
    label: "Fueling strategy",
    prompt:
      "Use the trainpace MCP tools: I'm running a full marathon in about 3:45 and weigh 70kg. How many gels do I need and when exactly should I take them?",
  },
  {
    label: "Route analysis",
    prompt:
      "Use the trainpace MCP tools: here's my race course GPX (pasted below). Where are the hardest climbs, and how should I adjust my pacing km by km? My flat pace is 5:20/km.\n\n<paste your GPX file contents here>",
  },
];

const TOOLS = [
  {
    name: "calculate_training_paces",
    summary:
      "Training paces (easy, tempo, interval, speed, long run, Yasso 800s) from a recent race result — plus heart-rate zones and hot-weather adjustments.",
    example: "What should my easy pace be if I ran a 48:30 10K?",
  },
  {
    name: "calculate_vdot",
    summary:
      "VDOT fitness score (Daniels & Gilbert formula) with training zones and equivalent race-time predictions for 5K through marathon.",
    example: "I ran a 1:45 half marathon — what marathon time does that predict?",
  },
  {
    name: "generate_training_plan",
    summary:
      "A periodized week-by-week plan (base, development, sharpening, taper) for 5K to marathon, sized to your fitness level and available run days.",
    example:
      "Build me a 16-week marathon plan. I'm a beginner and can run Tue/Thu/Sat/Sun.",
  },
  {
    name: "calculate_fuel_plan",
    summary:
      "Carbs per hour, total gels, and a front-loaded fuel-stop timeline for a 10K, half, or full marathon.",
    example: "How should I fuel a 3:45 marathon? I weigh 70kg.",
  },
  {
    name: "analyze_route",
    summary:
      "GPX route analysis: distance, elevation gain, climb categorization, split-by-split grade-adjusted pacing, and race-day weather impact.",
    example: "Here's my race GPX — where are the hard climbs and how should I pace them?",
  },
];

function CopyButton({
  text,
  label,
}: {
  text: string;
  label: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const resetTimer = useRef<number>();
  useEffect(() => () => window.clearTimeout(resetTimer.current), []);
  const copied = status === "copied";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      window.clearTimeout(resetTimer.current);
      setStatus("copied");
      resetTimer.current = window.setTimeout(() => setStatus("idle"), 2000);
      posthog.capture("mcp_docs_copy", { item: label });
    } catch {
      window.clearTimeout(resetTimer.current);
      setStatus("failed");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="mcp-copy"
      aria-label={`Copy ${label}`}
      data-copied={copied}
    >
      <span className="mcp-copy-icons" aria-hidden="true">
        <Copy strokeWidth={2} />
        <Check strokeWidth={2} />
      </span>
      {copied ? "Copied" : "Copy"}
      <span className="sr-only" role="status">
        {copied ? `${label} copied` : status === "failed" ? "Clipboard unavailable. Select the text to copy it manually." : ""}
      </span>
    </button>
  );
}

function CopyBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="mcp-code-block">
      <div className="mcp-code-heading">
        <span>{label}</span>
        <CopyButton text={code} label={label} />
      </div>
      <pre tabIndex={0} aria-label={label}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function McpDocs() {
  return (
    <div className="mcp-docs">
      <Helmet>
        <title>{STATIC_PAGE_TITLES["/mcp"]}</title>
        <meta
          name="description"
          content="Connect any AI assistant to TrainPace's free public MCP server: training paces, VDOT, race plans, fueling strategy, and GPX route analysis as agent tools."
        />
        <link rel="canonical" href="https://trainpace.com/mcp" />
      </Helmet>

      <nav aria-label="On this page" className="mcp-contents">
        <p>On this page</p>
        <a href="#endpoint">Server endpoint</a>
        <a href="#connect">Client setup</a>
        <a href="#tools">Tool reference</a>
        <a href="#prompts">Starter prompts</a>
        <a href="#about-mcp">Server behavior</a>
      </nav>

      <article className="mcp-article">
        <header>
          <h1>TrainPace MCP</h1>
          <p>
            The TrainPace{" "}
            <a href="https://modelcontextprotocol.io">Model Context Protocol</a>{" "}
            server provides five tools for training paces, VDOT, training plans,
            race fueling, and GPX route analysis.
          </p>
        </header>

        <section id="endpoint" className="mcp-endpoint">
          <h2>Server endpoint</h2>
          <div className="mcp-endpoint-value">
            <code>{MCP_URL}</code>
            <CopyButton text={MCP_URL} label="server URL" />
          </div>
          <dl>
            <div><dt>Transport</dt><dd>Streamable HTTP</dd></div>
            <div><dt>Authentication</dt><dd>None</dd></div>
          </dl>
        </section>

        <section id="connect">
          <h2>Client setup</h2>

          <div className="mcp-entry">
            <h3>Claude Code</h3>
            <CopyBlock label="Setup command" code={CLAUDE_CODE_COMMAND} />
            <p>Run <code>claude mcp list</code> to verify that TrainPace is connected.</p>
          </div>

          <div className="mcp-entry">
            <h3>Claude.ai and Claude Desktop</h3>
            <ol>
              <li>Open <strong>Settings → Connectors</strong>. Custom connectors on Claude.ai require a paid plan.</li>
              <li>Choose <strong>Add custom connector</strong>, name it <code>trainpace</code>, and paste the server URL above.</li>
              <li>In a new chat, open <strong>Search &amp; tools</strong> and enable <strong>trainpace</strong>.</li>
            </ol>
          </div>

          <div className="mcp-entry">
            <h3>Cursor, Windsurf, and other MCP clients</h3>
            <p>
              Add this entry to <code>.cursor/mcp.json</code> in Cursor,
              {" "}<code>mcp_config.json</code> in Windsurf, or the equivalent
              config file for your client. Then reload the client.
            </p>
            <CopyBlock label="MCP config JSON" code={JSON_CONFIG} />
          </div>

          <details className="mcp-entry">
            <summary>Agent briefing</summary>
            <p>
              Paste this into a new chat for a summary of the available tools and
              their parameters. The assistant needs MCP support to call them.
            </p>
            <CopyBlock label="Agent briefing" code={AGENT_PROMPT} />
          </details>
        </section>

        <section id="tools">
          <h2>Tool reference</h2>
          <p>Clients discover these tools when they connect.</p>
          <dl className="mcp-reference">
            {TOOLS.map((tool) => (
              <div key={tool.name}>
                <dt><code>{tool.name}</code></dt>
                <dd>{tool.summary}</dd>
                <dd className="mcp-example">“{tool.example}”</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="prompts">
          <h2>Starter prompts</h2>
          <ul className="mcp-reference">
            {STARTER_PROMPTS.map(({ label, prompt }) => (
              <li key={label}>
                <div className="mcp-prompt-heading">
                  <h3>{label}</h3>
                  <CopyButton text={prompt} label={`${label} prompt`} />
                </div>
                <p className="whitespace-pre-line">{prompt}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="about-mcp">
          <h2>Server behavior</h2>
          <p>
            The server is stateless. Requests are rate limited by IP and GPX
            files are analyzed in memory without being stored.
          </p>
          <p>
            The same calculations are available in the{" "}
            <Link to="/calculator">pace calculator</Link>,{" "}
            <Link to="/vdot">VDOT calculator</Link>,{" "}
            <Link to="/plan">training plan builder</Link>,{" "}
            <Link to="/fuel">fuel planner</Link>, and{" "}
            <Link to="/elevation-finder">elevation finder</Link>.
          </p>
        </section>
      </article>
    </div>
  );
}
