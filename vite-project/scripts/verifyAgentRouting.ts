/**
 * Verifies the agent-facing routing contract.
 *
 * Two implementations of the same rules have to agree or the site quietly
 * breaks: `src/lib/llm/agent-detection.ts` (used by the edge middleware to
 * decide what to serve) and `src/lib/llm/markdown.ts` (used at build time to
 * decide where files are written). This checks they do, and pins the Accept
 * negotiation behavior — most importantly that ordinary browser requests keep
 * getting HTML.
 *
 * Run with: npm run verify-agent-routing
 */

/* eslint-disable no-console -- this script's output is the point */

import { identifyAgent, wantsMarkdown, markdownPathFor } from "../src/lib/llm/agent-detection";
import { markdownPathForRoute } from "../src/lib/llm/markdown";
import { getAllDocPaths } from "../src/lib/llm/page-docs";

let fail = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  got=${JSON.stringify(actual)} want=${JSON.stringify(expected)}`);
}
const q = (s = "") => new URLSearchParams(s);

console.log("--- Accept negotiation: browsers must keep HTML ---");
check("Chrome nav", wantsMarkdown(q(), "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"), false);
check("Firefox nav", wantsMarkdown(q(), "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"), false);
check("Safari nav", wantsMarkdown(q(), "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"), false);
check("curl default */*", wantsMarkdown(q(), "*/*"), false);
check("empty accept", wantsMarkdown(q(), ""), false);

console.log("--- Accept negotiation: agents must get Markdown ---");
check("text/markdown", wantsMarkdown(q(), "text/markdown"), true);
check("markdown then html", wantsMarkdown(q(), "text/markdown,text/html;q=0.9"), true);
check("html then markdown, md higher q", wantsMarkdown(q(), "text/html;q=0.5,text/markdown;q=0.9"), true);
check("html higher q than md", wantsMarkdown(q(), "text/html;q=0.9,text/markdown;q=0.5"), false);
check("text/x-markdown", wantsMarkdown(q(), "text/x-markdown"), true);
check("explicit text/plain", wantsMarkdown(q(), "text/plain"), true);
check("?format=md", wantsMarkdown(q("format=md"), "text/html"), true);
check("?format=markdown", wantsMarkdown(q("format=markdown"), ""), true);
check("md with q=0 is not a request", wantsMarkdown(q(), "text/markdown;q=0,text/html"), false);

console.log("--- Agent identification ---");
check("ClaudeBot", identifyAgent("Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)"), "ClaudeBot");
check("GPTBot", identifyAgent("Mozilla/5.0 AppleWebKit/537.36 (compatible; GPTBot/1.2; +https://openai.com/gptbot)"), "GPTBot");
check("PerplexityBot", identifyAgent("Mozilla/5.0 (compatible; PerplexityBot/1.0)"), "PerplexityBot");
check("python-requests", identifyAgent("python-requests/2.31.0"), "python-requests");
check("real Chrome is not an agent", identifyAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"), null);
check("Googlebot is not an LLM agent", identifyAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"), null);

console.log("--- Path mapping agrees with the generator ---");
for (const route of ["/", "/calculator", "/blog/how-to-pace-a-marathon", "/race/boston-marathon"]) {
  check(`path ${route}`, markdownPathFor(route), markdownPathForRoute(route));
}
check("trailing slash", markdownPathFor("/calculator/"), "/calculator.md");

// Every generated route must map identically in both implementations.
const mismatched = getAllDocPaths().filter((r) => markdownPathFor(r) !== markdownPathForRoute(r));
check("all 245 routes map identically", mismatched, []);

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILURES`);
process.exit(fail === 0 ? 0 : 1);
