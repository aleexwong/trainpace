/**
 * Vercel Routing Middleware — agent-aware request handling.
 *
 * Two jobs, both aimed at traffic that client-side analytics cannot see:
 *
 * 1. **Content negotiation.** A request for an HTML page carrying
 *    `Accept: text/markdown` (or `?format=md`) is served the page's Markdown
 *    mirror instead of the JavaScript app shell. The mirrors are generated at
 *    build time by `scripts/generateMarkdown.ts`.
 *
 * 2. **Server-side agent logging.** Crawlers and LLM fetchers do not execute
 *    JavaScript, so PostHog and GA4 never fire for them — in analytics this
 *    traffic simply does not exist. Every request from a known AI agent (and
 *    every Markdown negotiation) is written to stdout as a single JSON line,
 *    which lands in Vercel's runtime logs where it can be queried or drained.
 *    See docs/agent-traffic.md for how to read them.
 *
 * Failure is always non-fatal: any error falls through to normal delivery.
 */

import { next } from "@vercel/functions";
import {
  identifyAgent,
  wantsMarkdown,
  markdownPathFor,
} from "./src/lib/llm/agent-detection";

export const config = {
  // Skip hashed assets, images, and files that are already machine-readable.
  // Everything else — HTML routes — passes through.
  matcher: [
    "/((?!assets/|_vercel/|favicon|apple-touch-icon|android-chrome|.*\\.(?:js|css|png|jpg|jpeg|svg|webp|ico|txt|xml|json|webmanifest|md|gpx)$).*)",
  ],
};

/**
 * Emit one structured line per agent request.
 *
 * Deliberately `console.log` rather than an analytics SDK: this has to work
 * for clients that never run JavaScript. Vercel captures middleware stdout
 * into runtime logs, which are queryable in the dashboard and drainable to a
 * log service. Filter on `trainpace_agent_request`.
 */
function logAgentRequest(fields: Record<string, unknown>) {
  try {
    // Intentional: stdout is the transport. Vite's esbuild `drop: ["console"]`
    // does not reach this file — Vercel bundles middleware separately from the
    // app build — so these lines survive into production.
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        event: "trainpace_agent_request",
        ts: new Date().toISOString(),
        ...fields,
      })
    );
  } catch {
    // Logging must never break a request.
  }
}

export default async function middleware(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const headers = request.headers;
    const userAgent = headers.get("user-agent") ?? "";
    const accept = headers.get("accept") ?? "";

    const agent = identifyAgent(userAgent);
    const markdownRequested = wantsMarkdown(url.searchParams, accept);

    if (agent || markdownRequested) {
      logAgentRequest({
        agent: agent ?? "unknown",
        path: url.pathname,
        query: url.search || undefined,
        method: request.method,
        format: markdownRequested ? "markdown" : "html",
        referer: headers.get("referer") ?? undefined,
        // Full UA string: the pattern list will always lag new agents, and
        // this is the only record of the ones it has not learned yet.
        ua: userAgent.slice(0, 300),
      });
    }

    // Only reads negotiate; a POST to a page path is not a content request.
    const isRead = request.method === "GET" || request.method === "HEAD";

    if (markdownRequested && isRead) {
      // The matcher excludes `.md`, so this sub-request does not re-enter
      // middleware — no loop.
      const mdUrl = new URL(markdownPathFor(url.pathname), url.origin);
      const mdResponse = await fetch(mdUrl, {
        headers: { accept: "text/plain" },
      });

      if (mdResponse.ok) {
        const body =
          request.method === "HEAD" ? null : await mdResponse.text();
        return new Response(body, {
          status: 200,
          headers: {
            "content-type": "text/markdown; charset=utf-8",
            "cache-control": "public, max-age=3600",
            // Caches must not reuse this for a browser asking for HTML.
            vary: "Accept",
            link: `<${url.origin}${url.pathname}>; rel="canonical"`,
            "x-trainpace-format": "markdown",
          },
        });
      }
      // No mirror for this route (an app-only page such as /dashboard) —
      // fall through and serve the normal response.
    }

    // Continue to normal delivery, advertising the Markdown alternate so a
    // client can discover it without having read llms.txt first. `Vary` is
    // required for correctness: the same URL serves HTML or Markdown depending
    // on Accept, and caches must not mix the two.
    return next({
      headers: {
        link: `<${url.origin}${markdownPathFor(
          url.pathname
        )}>; rel="alternate"; type="text/markdown"`,
        vary: "Accept",
      },
    });
  } catch {
    // Never let middleware take the site down.
    return next();
  }
}
