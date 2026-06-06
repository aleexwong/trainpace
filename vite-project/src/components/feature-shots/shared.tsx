import { useEffect, useRef, useState, type CSSProperties } from "react";

/** Build an inline style object that may include CSS custom properties (`--x`). */
export const sv = (o: Record<string, string | number>): CSSProperties =>
  o as unknown as CSSProperties;

/**
 * Fires once when the element scrolls ~halfway into view. Drives the
 * `.shot.in` reveal/draw animations across every feature shot.
 */
export function useInView<T extends HTMLElement>(threshold = 0.5) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Eased count-up (quartic ease-out) matching the design's `countUp()`.
 * Renders the live value as a locale-formatted number.
 */
export function CountUp({
  value,
  decimals = 0,
  play,
  durationMs = 1300,
}: {
  value: number;
  decimals?: number;
  play: boolean;
  durationMs?: number;
}) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!play) {
      setN(0);
      return;
    }
    if (prefersReducedMotion()) {
      setN(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      let p = Math.min((now - start) / durationMs, 1);
      p = 1 - Math.pow(1 - p, 4);
      setN(value * p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [play, value, durationMs]);

  return (
    <>
      {n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </>
  );
}

/** Gel / fuel-station bolt mark used in the fuel shot. */
export const BoltIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9z" />
  </svg>
);
