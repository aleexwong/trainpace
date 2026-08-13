/**
 * Agent detection and content negotiation.
 *
 * Pure helpers used by `middleware.ts` at the edge. Kept out of the middleware
 * file so they can be exercised directly — negotiation logic is easy to get
 * subtly wrong, and getting it wrong means serving Markdown to browsers.
 */

/**
 * User-agent substrings for crawlers and assistants that read pages on behalf
 * of an LLM. Matched case-insensitively. Kept broad on purpose: the cost of a
 * false positive is one extra log line.
 */
export const AGENT_PATTERNS: { pattern: string; name: string }[] = [
  // OpenAI
  { pattern: "gptbot", name: "GPTBot" },
  { pattern: "oai-searchbot", name: "OAI-SearchBot" },
  { pattern: "chatgpt-user", name: "ChatGPT-User" },
  // Anthropic
  { pattern: "claudebot", name: "ClaudeBot" },
  { pattern: "claude-user", name: "Claude-User" },
  { pattern: "claude-searchbot", name: "Claude-SearchBot" },
  { pattern: "anthropic-ai", name: "anthropic-ai" },
  // Perplexity
  { pattern: "perplexitybot", name: "PerplexityBot" },
  { pattern: "perplexity-user", name: "Perplexity-User" },
  // Google / Apple LLM crawlers
  { pattern: "google-extended", name: "Google-Extended" },
  { pattern: "googleother", name: "GoogleOther" },
  { pattern: "applebot-extended", name: "Applebot-Extended" },
  { pattern: "applebot", name: "Applebot" },
  // Others
  { pattern: "bytespider", name: "Bytespider" },
  { pattern: "ccbot", name: "CCBot" },
  { pattern: "cohere-ai", name: "cohere-ai" },
  { pattern: "diffbot", name: "Diffbot" },
  { pattern: "meta-externalagent", name: "Meta-ExternalAgent" },
  { pattern: "amazonbot", name: "Amazonbot" },
  { pattern: "youbot", name: "YouBot" },
  { pattern: "phindbot", name: "PhindBot" },
  { pattern: "firecrawl", name: "Firecrawl" },
  // Agent frameworks and scripted fetchers, which usually keep default UAs
  { pattern: "python-requests", name: "python-requests" },
  { pattern: "httpx", name: "httpx" },
  { pattern: "aiohttp", name: "aiohttp" },
  { pattern: "node-fetch", name: "node-fetch" },
  { pattern: "axios", name: "axios" },
  { pattern: "curl/", name: "curl" },
  { pattern: "wget/", name: "wget" },
  { pattern: "go-http-client", name: "Go-http-client" },
  { pattern: "langchain", name: "LangChain" },
  { pattern: "llamaindex", name: "LlamaIndex" },
  { pattern: "scrapy", name: "Scrapy" },
];

/** Identify the calling agent, or null for ordinary browser traffic. */
export function identifyAgent(userAgent: string): string | null {
  const ua = userAgent.toLowerCase();
  for (const { pattern, name } of AGENT_PATTERNS) {
    if (ua.includes(pattern)) return name;
  }
  return null;
}

/**
 * Whether the caller asked for Markdown.
 *
 * Honors an explicit `?format=md`, and an `Accept` header that ranks a
 * Markdown (or explicitly requested plain-text) type at least as high as
 * `text/html`. Ranking matters: a browser navigation lists `text/html` first
 * and a low-q wildcard last, and must keep getting HTML. A bare wildcard
 * (curl's default) is not a Markdown request either — only a named type
 * counts, so unnamed clients are never surprised with Markdown.
 */
export function wantsMarkdown(
  searchParams: URLSearchParams,
  accept: string
): boolean {
  const format = searchParams.get("format");
  if (format === "md" || format === "markdown") return true;
  if (!accept) return false;

  let markdownQ = -1;
  let htmlQ = -1;

  for (const raw of accept.split(",")) {
    const [typePart, ...params] = raw.trim().split(";");
    const type = typePart.trim().toLowerCase();
    if (!type) continue;

    const qParam = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    const q = qParam ? parseFloat(qParam.slice(2)) : 1;
    if (Number.isNaN(q)) continue;

    if (
      type === "text/markdown" ||
      type === "text/x-markdown" ||
      // Only an explicit text/plain counts, never a wildcard.
      type === "text/plain"
    ) {
      markdownQ = Math.max(markdownQ, q);
    } else if (type === "text/html" || type === "application/xhtml+xml") {
      htmlQ = Math.max(htmlQ, q);
    }
  }

  return markdownQ > 0 && markdownQ >= htmlQ;
}

/**
 * The Markdown mirror path for a route.
 * "/" → "/index.md", "/calculator" → "/calculator.md".
 *
 * Must stay in step with `markdownPathForRoute` in `./markdown.ts`, which
 * decides where the generator writes the files.
 */
export function markdownPathFor(pathname: string): string {
  if (pathname === "/" || pathname === "") return "/index.md";
  return `${pathname.replace(/\/$/, "")}.md`;
}
