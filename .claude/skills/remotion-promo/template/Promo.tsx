import type { ReactNode } from "react";
import { AbsoluteFill, Easing, Series, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadSans } from "@remotion/google-fonts/DMSans";

// ─── Edit everything above the "scene kit" line. Nothing below needs touching for a new product. ───

// Swap the font imports above for the product's own families. Keep a fallback stack.
const display = `${loadDisplay("normal", { weights: ["500", "700"] }).fontFamily}, system-ui, sans-serif`;
const sans = `${loadSans("normal", { weights: ["400", "500"] }).fontFamily}, system-ui, sans-serif`;

const BRAND = {
  name: ["Train", "Pace"], // second part renders in accent colour; use ["Acme", ""] for none
  tagline: "Train smarter. Race faster.",
  url: "trainpace.com",
  ctaSub: "Free. No account needed.",
  primary: "#059669",
  accent: "#34d399",
  bg: "#0f172a",
  bgGlow: "#064e3b",
  surface: "#1e293b",
  muted: "#94a3b8",
};

// Each scene: frames @30fps + one of the kit types. Total length = sum of frames.
export const SCENES: Scene[] = [
  { frames: 90, type: "title" },
  {
    frames: 150,
    type: "bars",
    kicker: "Pace calculator",
    title: "One race → every training pace",
    sub: "Half marathon in 1:40:00",
    unit: "/km",
    rows: [
      { label: "Easy", value: "5:40", w: 0.55 },
      { label: "Marathon", value: "4:57", w: 0.68 },
      { label: "Threshold", value: "4:38", w: 0.78 },
      { label: "Interval", value: "4:16", w: 0.9 },
    ],
  },
  {
    frames: 150,
    type: "chart",
    kicker: "Course analysis",
    title: "Know every hill before race day",
    points: [0.2, 0.4, 0.55, 0.35, 0.45, 0.85, 0.5, 0.3, 0.2],
    stat: { to: 312, prefix: "+", suffix: " m", label: "elevation gain" },
  },
  { frames: 120, type: "stat", kicker: "Fuel planner", title: "Never bonk again", to: 60, suffix: "g", label: "carbs / hour" },
  { frames: 90, type: "cta" },
];

// ─── scene kit ───

type Head = { kicker: string; title: string };
type Scene = { frames: number } & (
  | { type: "title" }
  | { type: "cta" }
  | ({ type: "bars"; sub?: string; unit?: string; rows: { label: string; value: string; w: number }[] } & Head)
  | ({ type: "chart"; points: number[]; stat?: Count & { label: string } } & Head)
  | ({ type: "stat"; label: string } & Count & Head)
);
type Count = { to: number; prefix?: string; suffix?: string };

export const DURATION = SCENES.reduce((n, s) => n + s.frames, 0);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const num = { fontFamily: display, fontWeight: 700, color: "white", fontVariantNumeric: "tabular-nums" } as const;

const useIn = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200 } });
};

const Rise = ({ delay = 0, children }: { delay?: number; children: ReactNode }) => {
  const p = useIn(delay);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>{children}</div>;
};

const FadeOut = ({ length, children }: { length: number; children: ReactNode }) => {
  const opacity = interpolate(useCurrentFrame(), [length - 12, length], [1, 0], clamp);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

const Counter = ({ to, prefix = "", suffix = "", from = 10, len = 60 }: Count & { from?: number; len?: number }) => {
  const v = Math.round(interpolate(useCurrentFrame(), [from, from + len], [0, to], clamp));
  return <>{prefix}{v}{suffix}</>;
};

const Heading = ({ kicker, title }: Head) => (
  <Rise>
    <div style={{ fontFamily: sans, fontSize: 32, color: BRAND.accent, letterSpacing: 2, textTransform: "uppercase" }}>{kicker}</div>
    <div style={{ fontFamily: display, fontWeight: 700, fontSize: 80, color: "white", marginTop: 8 }}>{title}</div>
  </Rise>
);

const Title = () => {
  const p = useIn();
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 200, color: "white", opacity: p, transform: `scale(${0.8 + p * 0.2})` }}>
        {BRAND.name[0]}<span style={{ color: BRAND.accent }}>{BRAND.name[1]}</span>
      </div>
      <Rise delay={15}>
        <div style={{ fontFamily: sans, fontSize: 48, color: BRAND.muted }}>{BRAND.tagline}</div>
      </Rise>
    </AbsoluteFill>
  );
};

const Bar = ({ label, value, w, unit, delay }: { label: string; value: string; w: number; unit?: string; delay: number }) => {
  const p = useIn(delay);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 30, opacity: p }}>
      <div style={{ width: 260, fontFamily: sans, fontSize: 34, color: "white" }}>{label}</div>
      <div style={{ flex: 1, height: 56, background: BRAND.surface, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ width: `${w * p * 100}%`, height: "100%", borderRadius: 12, background: `linear-gradient(90deg, ${BRAND.primary}, ${BRAND.accent})` }} />
      </div>
      <div style={{ ...num, width: 220, textAlign: "right", fontSize: 44 }}>
        {value}<span style={{ fontSize: 24, color: BRAND.muted }}>{unit}</span>
      </div>
    </div>
  );
};

const Bars = ({ kicker, title, sub, unit, rows }: Extract<Scene, { type: "bars" }>) => (
  <AbsoluteFill style={{ padding: 140 }}>
    <Heading kicker={kicker} title={title} />
    {sub && <Rise delay={10}><div style={{ fontFamily: sans, fontSize: 36, color: BRAND.muted, marginTop: 20 }}>{sub}</div></Rise>}
    <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 22 }}>
      {rows.map((r, i) => <Bar key={r.label} {...r} unit={unit} delay={25 + i * 8} />)}
    </div>
  </AbsoluteFill>
);

const Chart = ({ kicker, title, points, stat }: Extract<Scene, { type: "chart" }>) => {
  const [W, H] = [1640, 420];
  const draw = interpolate(useCurrentFrame(), [15, 90], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const line = `M${points.map((y, i) => `${(i / (points.length - 1)) * W},${H - y * H}`).join(" L")}`;
  return (
    <AbsoluteFill style={{ padding: 140 }}>
      <Heading kicker={kicker} title={title} />
      <svg width={W} height={H} style={{ marginTop: 60, overflow: "visible" }}>
        <defs>
          <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={BRAND.primary} stopOpacity={0.5} />
            <stop offset="1" stopColor={BRAND.primary} stopOpacity={0} />
          </linearGradient>
          <clipPath id="reveal"><rect width={W * draw} height={H} /></clipPath>
        </defs>
        <path d={`${line} L${W},${H} L0,${H} Z`} fill="url(#fill)" clipPath="url(#reveal)" />
        <path d={line} fill="none" stroke={BRAND.accent} strokeWidth={6} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
      </svg>
      {stat && (
        <div style={{ ...num, position: "absolute", right: 140, top: 150, textAlign: "right", fontSize: 72 }}>
          <Counter {...stat} from={15} len={75} />
          <div style={{ fontFamily: sans, fontWeight: 400, fontSize: 28, color: BRAND.muted }}>{stat.label}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const Stat = ({ kicker, title, label, ...count }: Extract<Scene, { type: "stat" }>) => (
  <AbsoluteFill style={{ padding: 140 }}>
    <Heading kicker={kicker} title={title} />
    <div style={{ ...num, marginTop: 50, fontSize: 200, color: BRAND.accent }}>
      <Counter {...count} len={40} />
      <span style={{ fontFamily: sans, fontWeight: 400, fontSize: 48, color: BRAND.muted }}> {label}</span>
    </div>
  </AbsoluteFill>
);

const Cta = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
    <Rise><div style={{ fontFamily: display, fontWeight: 700, fontSize: 140, color: "white" }}>{BRAND.url}</div></Rise>
    <Rise delay={12}><div style={{ fontFamily: sans, fontSize: 44, color: BRAND.accent, marginTop: 10 }}>{BRAND.ctaSub}</div></Rise>
  </AbsoluteFill>
);

const render = (s: Scene) => {
  switch (s.type) {
    case "title": return <Title />;
    case "cta": return <Cta />;
    case "bars": return <Bars {...s} />;
    case "chart": return <Chart {...s} />;
    case "stat": return <Stat {...s} />;
  }
};

export const Promo = () => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 20% 10%, ${BRAND.bgGlow} 0%, ${BRAND.bg} 55%)` }}>
    <Series>
      {SCENES.map((s, i) => (
        <Series.Sequence key={i} durationInFrames={s.frames}>
          {i === SCENES.length - 1 ? render(s) : <FadeOut length={s.frames}>{render(s)}</FadeOut>}
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
