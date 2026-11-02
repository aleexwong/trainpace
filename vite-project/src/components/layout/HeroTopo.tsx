import "./hero-topo.css";

// Contour rings around a few "peaks", wobbled with two sine harmonics so they
// read as terrain. Computed once at module load — pure, deterministic.
const PEAKS = [
  { cx: 1180, cy: 330, rings: 12, a: 0.16, b: 0.07, p: 0.4 },
  { cx: 1450, cy: 760, rings: 9, a: 0.12, b: 0.09, p: 2.1 },
  { cx: 860, cy: 820, rings: 6, a: 0.18, b: 0.05, p: 4.0 },
];

const CONTOURS = PEAKS.flatMap(({ cx, cy, rings, a, b, p }) =>
  Array.from({ length: rings }, (_, k) => {
    const r = 24 + k * 34;
    const pts = Array.from({ length: 96 }, (_, i) => {
      const t = (i / 96) * Math.PI * 2;
      const w = 1 + a * Math.sin(3 * t + p + k * 0.15) + b * Math.sin(5 * t - p);
      return `${(cx + Math.cos(t) * r * w * 1.25).toFixed(1)},${(cy + Math.sin(t) * r * w).toFixed(1)}`;
    });
    // Every 4th ring is an "index contour", drawn heavier like a real topo map.
    return { d: `M${pts.join("L")}Z`, index: k % 4 === 3 };
  })
);

const ROUTE =
  "M600 880 C 760 760, 700 610, 930 570 S 1170 540, 1215 410 S 1320 190, 1560 120";

/** Decorative animated topo map: the route draws itself in, then a pace dot runs it. */
export function HeroTopo() {
  return (
    <svg
      className="tp-topo absolute inset-0 h-full w-full"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden="true"
    >
      <g className="tp-topo-contours">
        {CONTOURS.map((c, i) => (
          <path key={i} d={c.d} className={c.index ? "tp-topo-index" : undefined} />
        ))}
      </g>
      <path d={ROUTE} pathLength={1} className="tp-topo-route-glow" />
      <path id="tp-topo-route" d={ROUTE} pathLength={1} className="tp-topo-route" />
      <circle cx="600" cy="880" r="7" className="tp-topo-marker" />
      <circle cx="1560" cy="120" r="7" className="tp-topo-marker tp-topo-finish" />
      <g className="tp-topo-dot">
        <circle r="16" className="tp-topo-dot-pulse" />
        <circle r="6" />
        <animateMotion dur="10s" begin="2.6s" repeatCount="indefinite" rotate="auto">
          <mpath href="#tp-topo-route" />
        </animateMotion>
      </g>
    </svg>
  );
}
