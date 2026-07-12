import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Check,
  Copy,
  Gauge,
  Mountain,
  CalendarRange,
  Fuel,
  Activity,
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

function CopyBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. non-secure context) — nothing to do
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors"
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
      </div>
      <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function McpDocs() {
  return (
    <div className="bg-white text-slate-900 min-h-screen">
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
          <div className="inline-block bg-white border border-emerald-200 rounded-lg px-6 py-3 shadow-sm">
            <code className="text-emerald-700 font-mono text-sm md:text-base">
              {MCP_URL}
            </code>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Streamable HTTP · No account or API key required
          </p>
        </div>
      </section>

      {/* Setup */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <Zap className="w-8 h-8 text-emerald-600" />
          Connect in Under a Minute
        </h2>

        <div className="prose prose-lg max-w-none text-left mb-8">
          <p className="text-slate-700 leading-relaxed">
            <strong>Claude.ai / Claude Desktop:</strong> go to{" "}
            <em>Settings → Connectors → Add custom connector</em>, name it{" "}
            <code>trainpace</code>, and paste the server URL above.
          </p>
        </div>

        <CopyBlock label="Claude Code (one command)" code={CLAUDE_CODE_COMMAND} />
        <CopyBlock
          label="Generic MCP client config (Cursor, Windsurf, and others)"
          code={JSON_CONFIG}
        />

        <p className="text-slate-600 text-sm">
          The server is stateless and anonymous — nothing you send is tied to an
          account, and route files are analyzed in memory, not stored. Requests
          are rate-limited per IP to keep the service free for everyone.
        </p>
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
          <p className="text-slate-700 leading-relaxed">
            The TrainPace MCP server gives your assistant the deterministic
            math: Daniels &amp; Gilbert VDOT, grade-adjusted pacing from real
            elevation data, and sports-science fueling targets. Your agent does
            the conversation; TrainPace does the calculation.
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
