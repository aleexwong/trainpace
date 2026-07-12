import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useInView } from "@/components/feature-shots/shared";
import {
  Bot,
  Check,
  Copy,
  Gauge,
  MessageSquareText,
  Mountain,
  CalendarRange,
  Fuel,
  Activity,
  Terminal,
  MonitorSmartphone,
  Blocks,
  Zap,
} from "lucide-react";

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
      "Use the trainpace MCP tools: build me a marathon training plan. Race date 2026-10-11, intermediate fitness, I can run Tue, Thu, Sat, and Sun. Goal time 3:45:00. Then summarize the key weeks for me.",
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
    icon: Gauge,
    name: "calculate_training_paces",
    summary:
      "Training paces (easy, tempo, interval, speed, long run, Yasso 800s) from a recent race result — plus heart-rate zones and hot-weather adjustments.",
    example: "What should my easy pace be if I ran a 48:30 10K?",
  },
  {
    icon: Activity,
    name: "calculate_vdot",
    summary:
      "VDOT fitness score (Daniels & Gilbert formula) with training zones and equivalent race-time predictions for 5K through marathon.",
    example: "I ran a 1:45 half marathon — what marathon time does that predict?",
  },
  {
    icon: CalendarRange,
    name: "generate_training_plan",
    summary:
      "A periodized week-by-week plan (base, development, sharpening, taper) for 5K to marathon, sized to your fitness level and available run days.",
    example:
      "Build me a 16-week marathon plan. I'm a beginner and can run Tue/Thu/Sat/Sun.",
  },
  {
    icon: Fuel,
    name: "calculate_fuel_plan",
    summary:
      "Carbs per hour, total gels, and a front-loaded fuel-stop timeline for a 10K, half, or full marathon.",
    example: "How should I fuel a 3:45 marathon? I weigh 70kg.",
  },
  {
    icon: Mountain,
    name: "analyze_route",
    summary:
      "GPX route analysis: distance, elevation gain, climb categorization, split-by-split grade-adjusted pacing, and race-day weather impact.",
    example: "Here's my race GPX — where are the hard climbs and how should I pace them?",
  },
];

function CopyButton({
  text,
  label,
  className = "",
}: {
  text: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. non-secure context) — nothing to do
    }
  };

  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors shrink-0 ${className}`}
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-600" />
          <span className="text-emerald-600">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copy
        </>
      )}
    </button>
  );
}

// ── Animated terminal ──────────────────────────────────────────────────
// Types the setup commands out like a real shell session, then idles on a
// blinking prompt. Reduced-motion users see the finished session instantly.

const TERMINAL_SCRIPT: { kind: "cmd" | "out"; text: string; ok?: boolean }[] = [
  { kind: "cmd", text: CLAUDE_CODE_COMMAND },
  { kind: "out", text: 'Added HTTP MCP server "trainpace"' },
  { kind: "cmd", text: "claude mcp list" },
  {
    kind: "out",
    text: "trainpace: https://api.trainpace.com/api/mcp (HTTP) - ✓ Connected",
    ok: true,
  },
];

function AnimatedTerminal() {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const [line, setLine] = useState(-1); // -1 = not started
  const [chars, setChars] = useState(0);
  const timer = useRef<number>();

  const finished = line >= TERMINAL_SCRIPT.length;

  const play = useCallback(() => {
    window.clearTimeout(timer.current);
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) {
      setLine(TERMINAL_SCRIPT.length);
      return;
    }
    setLine(0);
    setChars(0);
  }, []);

  useEffect(() => {
    if (inView && line === -1) play();
  }, [inView, line, play]);

  useEffect(() => {
    if (line < 0 || finished) return;
    const cur = TERMINAL_SCRIPT[line];
    if (cur.kind === "cmd" && chars < cur.text.length) {
      // Type command characters with a little human jitter
      timer.current = window.setTimeout(() => {
        setChars((c) => c + 2);
      }, 24 + Math.random() * 30);
    } else {
      // Command fully typed (or output line): pause, then advance
      timer.current = window.setTimeout(
        () => {
          setLine((l) => l + 1);
          setChars(0);
        },
        cur.kind === "cmd" ? 420 : 650
      );
    }
    return () => window.clearTimeout(timer.current);
  }, [line, chars, finished]);

  return (
    <div ref={ref} className="mb-4">
      <div className="rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900 shadow-lg">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 border-b border-slate-700/60">
          <span className="w-3 h-3 rounded-full bg-red-400/80" />
          <span className="w-3 h-3 rounded-full bg-amber-400/80" />
          <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
          <span className="ml-2 text-xs text-slate-400 font-mono">
            zsh — your terminal
          </span>
          <div className="ml-auto flex items-center gap-3">
            {finished && (
              <button
                onClick={play}
                className="text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors"
                aria-label="Replay terminal session"
              >
                ↺ replay
              </button>
            )}
            <CopyButton
              text={CLAUDE_CODE_COMMAND}
              label="setup command"
              className="text-slate-400 hover:text-emerald-400"
            />
          </div>
        </div>
        <div className="p-4 font-mono text-[13px] leading-relaxed min-h-[150px]">
          {TERMINAL_SCRIPT.map((entry, i) => {
            if (i > line) return null;
            const isCurrent = i === line;
            if (entry.kind === "cmd") {
              const text = isCurrent
                ? entry.text.slice(0, chars)
                : entry.text;
              // Pending output lines render nothing until "executed"
              return (
                <div key={i} className="text-slate-100 break-all">
                  <span className="text-emerald-400 select-none">$ </span>
                  {text}
                  {isCurrent && (
                    <span className="inline-block w-2 h-3.5 ml-0.5 align-middle bg-emerald-400 animate-pulse" />
                  )}
                </div>
              );
            }
            if (isCurrent) return null; // output appears once executed
            return (
              <div
                key={i}
                className={`break-all ${entry.ok ? "text-emerald-400" : "text-slate-400"}`}
              >
                {entry.text}
              </div>
            );
          })}
          {finished && (
            <div className="text-slate-100">
              <span className="text-emerald-400 select-none">$ </span>
              <span className="inline-block w-2 h-3.5 ml-0.5 align-middle bg-emerald-400 animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CopyBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <CopyButton text={code} label={label} />
      </div>
      <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-auto max-h-96 text-left text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function SetupCard({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: typeof Terminal;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-emerald-100 rounded-lg p-2.5 shrink-0">
          <Icon className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        {badge && (
          <span className="text-xs font-medium bg-slate-100 text-slate-600 rounded-full px-2.5 py-1">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function McpDocs() {
  return (
    <div className="bg-white text-slate-900 min-h-screen text-left">
      <Helmet>
        <title>MCP Server - TrainPace Tools for AI Agents</title>
        <meta
          name="description"
          content="Connect any AI assistant to TrainPace's free public MCP server: training paces, VDOT, race plans, fueling strategy, and GPX route analysis as agent tools."
        />
        <link rel="canonical" href="https://trainpace.com/mcp" />
      </Helmet>

      {/* Hero */}
      <section className="py-20 px-6 bg-gradient-to-br from-emerald-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Bot className="w-4 h-4" />
            For AI assistants & agents
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Use TrainPace from Your AI Assistant
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            TrainPace runs a free, public{" "}
            <a
              href="https://modelcontextprotocol.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              Model Context Protocol
            </a>{" "}
            server. Connect Claude, ChatGPT, or any MCP client and ask training
            questions in plain English — the agent calls the same math that
            powers this site.
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-3 max-w-full bg-white border border-emerald-200 rounded-lg px-4 sm:px-6 py-3 shadow-sm">
            <code className="text-emerald-700 font-mono text-sm md:text-base break-all">
              {MCP_URL}
            </code>
            <CopyButton text={MCP_URL} label="server URL" />
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Streamable HTTP · No account or API key required
          </p>
        </div>
      </section>

      {/* Setup, step by step */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
            <Zap className="w-8 h-8 text-emerald-600" />
            Connect Your Assistant
          </h2>
          <p className="text-lg text-slate-600 mb-10">
            Pick your client below — each takes about a minute. Once connected,
            just ask training questions; the assistant discovers the tools on
            its own.
          </p>

          <SetupCard
            icon={MonitorSmartphone}
            title="Claude.ai & Claude Desktop"
            badge="no code"
          >
            <ol className="list-decimal pl-6 space-y-3 text-slate-700 mb-5">
              <li>
                Open <strong>Settings → Connectors</strong> (on claude.ai it's
                under your profile menu; custom connectors require a paid
                plan).
              </li>
              <li>
                Click <strong>Add custom connector</strong>.
              </li>
              <li>
                Name it <strong>trainpace</strong> and paste the server URL
                below, then click <strong>Add</strong>. There's no login step —
                it connects instantly.
              </li>
              <li>
                In a new chat, open the <strong>search &amp; tools</strong>{" "}
                menu (sliders icon) and make sure <strong>trainpace</strong> is
                enabled.
              </li>
              <li>Ask a training question — try a starter prompt below.</li>
            </ol>
            <CopyBlock label="Server URL" code={MCP_URL} />
          </SetupCard>

          <SetupCard icon={Terminal} title="Claude Code" badge="terminal">
            <p className="text-slate-700 mb-4">
              One command and you're connected — this is the whole setup:
            </p>
            <AnimatedTerminal />
            <p className="text-slate-700 text-sm">
              Then start a session and ask away.
            </p>
          </SetupCard>

          <SetupCard
            icon={Blocks}
            title="Cursor, Windsurf & other MCP clients"
            badge="config file"
          >
            <p className="text-slate-700 mb-4">
              Add this to your client's MCP config —{" "}
              <code className="font-mono">.cursor/mcp.json</code> in Cursor,{" "}
              <code className="font-mono">mcp_config.json</code> in Windsurf,
              or the equivalent for your tool — then reload:
            </p>
            <CopyBlock label="MCP config JSON" code={JSON_CONFIG} />
          </SetupCard>

          <SetupCard
            icon={MessageSquareText}
            title="Any other agent — just paste this"
            badge="zero setup"
          >
            <p className="text-slate-700 mb-4">
              Can't edit settings, or using an agent that manages its own
              tools? Paste this whole block as your first message. Agents that
              can register MCP servers will connect themselves; the rest still
              learn exactly which tools exist and when to use them.
            </p>
            <CopyBlock label="Agent briefing (paste as your first message)" code={AGENT_PROMPT} />
          </SetupCard>
        </div>
      </section>

      {/* Starter prompts */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Starter Prompts</h2>
        <p className="text-lg text-slate-600 mb-8">
          Copy one of these into your connected assistant to see the tools in
          action.
        </p>
        <div className="space-y-4">
          {STARTER_PROMPTS.map((item) => (
            <div
              key={item.label}
              className="bg-slate-50 border border-slate-200 rounded-lg p-5"
            >
              <div className="flex items-center justify-between gap-4 mb-2">
                <p className="font-semibold text-slate-900">{item.label}</p>
                <CopyButton text={item.prompt} label={`${item.label} prompt`} />
              </div>
              <p className="text-slate-600 text-sm whitespace-pre-line">
                {item.prompt}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">
            What Your Agent Can Do
          </h2>
          <p className="text-lg text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Five tools, discovered automatically when a client connects. Every
            one runs the exact same math as the calculators on trainpace.com.
          </p>

          <div className="space-y-6">
            {TOOLS.map((tool) => (
              <div
                key={tool.name}
                className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-emerald-100 rounded-lg p-2.5 shrink-0">
                    <tool.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-mono font-semibold text-slate-900 mb-2 break-words">
                      {tool.name}
                    </h3>
                    <p className="text-slate-700 mb-3">{tool.summary}</p>
                    <p className="text-sm text-slate-500 italic">
                      “{tool.example}”
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Why an MCP Server?</h2>
        <div className="prose prose-lg max-w-none text-left">
          <p className="text-slate-700 leading-relaxed mb-4">
            Runners increasingly plan training by talking to an AI assistant.
            Generic models are good at conversation but improvise the numbers —
            paces, fueling, and plan structure deserve real formulas, not
            plausible-sounding guesses.
          </p>
          <p className="text-slate-700 leading-relaxed mb-4">
            The TrainPace MCP server gives your assistant the deterministic
            math: Daniels &amp; Gilbert VDOT, grade-adjusted pacing from real
            elevation data, and sports-science fueling targets. Your agent does
            the conversation; TrainPace does the calculation.
          </p>
          <p className="text-slate-600 text-sm">
            The server is stateless and anonymous — nothing you send is tied to
            an account, and route files are analyzed in memory, not stored.
            Requests are rate-limited per IP to keep the service free for
            everyone.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <div className="text-center bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4">Prefer to Click Around?</h2>
          <p className="text-lg mb-8 text-emerald-100">
            Every tool the MCP server exposes is also a free calculator on this
            site — no AI required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/calculator">
              <Button
                size="lg"
                className="bg-white text-emerald-600 hover:bg-slate-100"
              >
                Pace Calculator
              </Button>
            </Link>
            <Link to="/plan">
              <Button
                size="lg"
                className="bg-white text-emerald-600 hover:bg-slate-100"
              >
                Training Plan Builder
              </Button>
            </Link>
            <Link to="/elevation-finder">
              <Button
                size="lg"
                className="bg-white text-emerald-600 hover:bg-slate-100"
              >
                Elevation Finder
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
