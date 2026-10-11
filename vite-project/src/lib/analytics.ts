/**
 * Deferred analytics (PostHog + GA4).
 *
 * Both libraries are dynamically imported after the page has loaded and gone
 * idle, so they stay out of the entry chunk. Calls made before they are ready
 * are queued and flushed in order once the libraries resolve.
 */
import type { PostHog } from "posthog-js";
import type ReactGAType from "react-ga4";

type GA = typeof ReactGAType;
export type GaEventOptions = Parameters<GA["event"]>[0];

const GA_MEASUREMENT_ID = "G-VT160XERPB";

let posthogClient: PostHog | null = null;
let gaClient: GA | null = null;
let started = false;

const posthogQueue: Array<(ph: PostHog) => void> = [];
const gaQueue: Array<(ga: GA) => void> = [];

function runOrQueue<T>(
  client: T | null,
  queue: Array<(c: T) => void>,
  fn: (c: T) => void
) {
  if (client) {
    try {
      fn(client);
    } catch {
      // Analytics must never break the app.
    }
  } else {
    queue.push(fn);
  }
}

function flush<T>(client: T, queue: Array<(c: T) => void>) {
  for (const fn of queue.splice(0)) {
    try {
      fn(client);
    } catch {
      // Analytics must never break the app.
    }
  }
}

async function loadPostHog() {
  const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
  if (!key) {
    posthogQueue.length = 0;
    return;
  }
  const { default: posthog } = await import("posthog-js");
  posthog.init(key, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    capture_exceptions: true,
  });
  posthogClient = posthog;
  flush(posthog, posthogQueue);
}

async function loadGA() {
  const { default: ReactGA } = await import("react-ga4");
  ReactGA.initialize(GA_MEASUREMENT_ID);
  gaClient = ReactGA;
  flush(ReactGA, gaQueue);
}

/** Begin loading analytics once the browser is idle. Safe to call repeatedly. */
export function initAnalytics() {
  if (started || typeof window === "undefined") return;
  started = true;

  const start = () => {
    loadPostHog().catch(() => {
      posthogQueue.length = 0;
    });
    loadGA().catch(() => {
      gaQueue.length = 0;
    });
  };
  const afterLoad = () => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(start, { timeout: 4000 });
    } else {
      setTimeout(start, 2000);
    }
  };

  if (document.readyState === "complete") afterLoad();
  else window.addEventListener("load", afterLoad, { once: true });
}

export function identify(
  distinctId: string,
  properties?: Record<string, unknown>
) {
  runOrQueue(posthogClient, posthogQueue, (ph) =>
    ph.identify(distinctId, properties)
  );
}

export function reset() {
  runOrQueue(posthogClient, posthogQueue, (ph) => ph.reset());
}

export function capture(event: string, properties?: Record<string, unknown>) {
  runOrQueue(posthogClient, posthogQueue, (ph) =>
    ph.capture(event, properties)
  );
}

/** Drop-in replacement for the `ReactGA` default export's `event` method. */
export const ReactGA = {
  event(options: GaEventOptions) {
    runOrQueue(gaClient, gaQueue, (ga) => ga.event(options));
  },
};
