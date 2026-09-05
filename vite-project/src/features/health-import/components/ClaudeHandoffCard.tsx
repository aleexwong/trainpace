import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, Check, Copy, Download } from "lucide-react";
import { toClaudeMarkdown, toJson, type DistanceUnit } from "../summarize";
import { downloadTextFile } from "../utils";
import type { HealthSummary } from "../types";

interface ClaudeHandoffCardProps {
  summary: HealthSummary;
  unit: DistanceUnit;
}

/** Clipboard write with a fallback for browsers that block the async API. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand?.("copy") ?? false;
    textarea.remove();
    return ok;
  }
}

export default function ClaudeHandoffCard({
  summary,
  unit,
}: ClaudeHandoffCardProps) {
  const [copied, setCopied] = useState(false);
  const markdown = toClaudeMarkdown(summary, unit);

  const handleCopy = useCallback(async () => {
    const ok = await copyText(markdown);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [markdown]);

  return (
    <div className="text-left rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-2">
        <Bot className="w-6 h-6 text-emerald-600 shrink-0" />
        Hand it to Claude
      </h3>
      <p className="text-slate-600 mb-5">
        Your export is far too big to paste into a chat. This is the same data
        boiled down to about a page — volume, fastest efforts, week by week, and
        the physiology numbers — plus a note telling the assistant to do the
        running maths with{" "}
        <Link to="/mcp" className="text-emerald-600 hover:underline">
          TrainPace's MCP server
        </Link>{" "}
        instead of guessing.
      </p>

      <div className="flex flex-wrap gap-3 mb-5">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-emerald-700"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy for Claude
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() =>
            downloadTextFile("trainpace-running-summary.md", markdown, "text/markdown;charset=utf-8")
          }
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Download className="w-4 h-4" />
          Markdown
        </button>
        <button
          type="button"
          onClick={() =>
            downloadTextFile(
              "trainpace-running-summary.json",
              toJson(summary),
              "application/json"
            )
          }
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Download className="w-4 h-4" />
          JSON
        </button>
      </div>

      <details>
        <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900">
          Preview what gets copied ({markdown.length.toLocaleString()} characters)
        </summary>
        <pre
          data-testid="claude-markdown-preview"
          className="mt-3 max-h-80 overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100 whitespace-pre-wrap break-words">
          {markdown}
        </pre>
      </details>
    </div>
  );
}
