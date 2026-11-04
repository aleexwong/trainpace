import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadSans } from "@remotion/google-fonts/DMSans";

// Same families as the app (see vite-project/index.html). Space Grotesk carries tnum, so digits don't jitter.
const display = `${loadDisplay("normal", { weights: ["500", "700"] }).fontFamily}, system-ui, sans-serif`;
const sans = `${loadSans("normal", { weights: ["400", "500"] }).fontFamily}, system-ui, sans-serif`;

const EMERALD = "#059669";
const MINT = "#34d399";
const BG = "#0f172a"; // slate-900
const MUTED = "#94a3b8"; // slate-400

// [start, length] in frames @30fps
const SCENES = {
  title: [0, 90],
  paces: [90, 150],
  course: [240, 150],
  fuel: [390, 120],
  cta: [510, 90],
} as const;
export const DURATION = 600;

const useIn = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200 } });
};

const FadeOut = ({ children, length }: { children: ReactNode; length: number }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [length - 12, length], [1, 0], { extrapolateLeft: "clamp" });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

const Rise = ({ delay = 0, children }: { delay?: number; children: ReactNode }) => {
  const p = useIn(delay);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>{children}</div>;
};

const Heading = ({ kicker, title }: { kicker: string; title: string }) => (
  <Rise>
    <div style={{ fontFamily: sans, fontSize: 32, color: MINT, letterSpacing: 2, textTransform: "uppercase" }}>
      {kicker}
    </div>
    <div style={{ fontFamily: display, fontWeight: 700, fontSize: 80, color: "white", marginTop: 8 }}>{title}</div>
  </Rise>
);

const Title = () => {
  const p = useIn();
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 200, color: "white", transform: `scale(${0.8 + p * 0.2})`, opacity: p }}>
        Train<span style={{ color: MINT }}>Pace</span>
      </div>
      <Rise delay={15}>
        <div style={{ fontFamily: sans, fontSize: 48, color: MUTED }}>Train smarter. Race faster.</div>
      </Rise>
    </AbsoluteFill>
  );
};

// Daniels paces for a 1:40:00 half (VDOT ~45)
const ZONES = [
  { name: "Easy", pace: "5:40", w: 0.55 },
  { name: "Marathon", pace: "4:57", w: 0.68 },
  { name: "Threshold", pace: "4:38", w: 0.78 },
  { name: "Interval", pace: "4:16", w: 0.9 },
  { name: "Repetition", pace: "3:58", w: 1 },
];

const Paces = () => (
  <AbsoluteFill style={{ padding: 140 }}>
    <Heading kicker="Pace calculator" title="One race → every training pace" />
    <Rise delay={10}>
      <div style={{ fontFamily: sans, fontSize: 36, color: MUTED, marginTop: 20 }}>Half marathon in 1:40:00</div>
    </Rise>
    <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 22 }}>
      {ZONES.map((z, i) => (
        <ZoneBar key={z.name} {...z} delay={25 + i * 8} />
      ))}
    </div>
  </AbsoluteFill>
);

const ZoneBar = ({ name, pace, w, delay }: (typeof ZONES)[number] & { delay: number }) => {
  const p = useIn(delay);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 30, opacity: p }}>
      <div style={{ width: 260, fontFamily: sans, fontSize: 34, color: "white" }}>{name}</div>
      <div style={{ flex: 1, height: 56, background: "#1e293b", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ width: `${w * p * 100}%`, height: "100%", background: `linear-gradient(90deg, ${EMERALD}, ${MINT})`, borderRadius: 12 }} />
      </div>
      <div style={{ width: 200, textAlign: "right", fontFamily: display, fontWeight: 700, fontSize: 44, color: "white", fontVariantNumeric: "tabular-nums" }}>
        {pace}<span style={{ fontSize: 24, color: MUTED }}>/km</span>
      </div>
    </div>
  );
};

// Hand-picked rolling course profile, 0–1 heights
const PROFILE = [0.2, 0.25, 0.4, 0.55, 0.5, 0.35, 0.3, 0.45, 0.7, 0.85, 0.75, 0.5, 0.4, 0.3, 0.35, 0.25, 0.2];

const Course = () => {
  const frame = useCurrentFrame();
  const W = 1640;
  const H = 420;
  const pts = PROFILE.map((y, i) => `${(i / (PROFILE.length - 1)) * W},${H - y * H}`);
  const line = `M${pts.join(" L")}`;
  const draw = interpolate(frame, [15, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const gain = Math.round(interpolate(frame, [15, 90], [0, 312], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <AbsoluteFill style={{ padding: 140 }}>
      <Heading kicker="Course analysis" title="Know every hill before race day" />
      <svg width={W} height={H} style={{ marginTop: 60, overflow: "visible" }}>
        <defs>
          <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={EMERALD} stopOpacity={0.5} />
            <stop offset="1" stopColor={EMERALD} stopOpacity={0} />
          </linearGradient>
          <clipPath id="reveal">
            <rect width={W * draw} height={H} />
          </clipPath>
        </defs>
        <path d={`${line} L${W},${H} L0,${H} Z`} fill="url(#fill)" clipPath="url(#reveal)" />
        <path d={line} fill="none" stroke={MINT} strokeWidth={6} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
      </svg>
      <div style={{ position: "absolute", right: 140, top: 150, textAlign: "right", fontFamily: display, fontWeight: 700, fontSize: 72, color: "white", fontVariantNumeric: "tabular-nums" }}>
        +{gain} m
        <div style={{ fontFamily: sans, fontWeight: 400, fontSize: 28, color: MUTED }}>elevation gain</div>
      </div>
    </AbsoluteFill>
  );
};

const GELS = [45, 75, 105, 135, 165]; // minutes into a ~3h marathon
const RACE_MIN = 180;

const Fuel = () => {
  const frame = useCurrentFrame();
  const carbs = Math.round(interpolate(frame, [10, 50], [0, 60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <AbsoluteFill style={{ padding: 140 }}>
      <Heading kicker="Fuel planner" title="Never bonk again" />
      <div style={{ marginTop: 50, fontFamily: display, fontWeight: 700, fontSize: 160, color: MINT, fontVariantNumeric: "tabular-nums" }}>
        {carbs}g <span style={{ fontSize: 48, color: MUTED, fontFamily: sans, fontWeight: 400 }}>carbs / hour</span>
      </div>
      <div style={{ position: "relative", marginTop: 60, height: 8, background: "#1e293b", borderRadius: 4 }}>
        {GELS.map((m, i) => (
          <GelDot key={m} left={(m / RACE_MIN) * 100} delay={40 + i * 8} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 30, fontFamily: sans, fontSize: 28, color: MUTED }}>
        <span>Start</span>
        <span>Finish</span>
      </div>
    </AbsoluteFill>
  );
};

const GelDot = ({ left, delay }: { left: number; delay: number }) => {
  const p = useIn(delay);
  return (
    <div style={{ position: "absolute", left: `${left}%`, top: -18, width: 44, height: 44, marginLeft: -22, borderRadius: 22, background: EMERALD, border: "4px solid white", transform: `scale(${p})` }} />
  );
};

const Cta = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
    <Rise>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 140, color: "white" }}>trainpace.com</div>
    </Rise>
    <Rise delay={12}>
      <div style={{ fontFamily: sans, fontSize: 44, color: MINT, marginTop: 10 }}>Free. No account needed.</div>
    </Rise>
  </AbsoluteFill>
);

const SCENE_COMPONENTS: Record<keyof typeof SCENES, () => JSX.Element> = { title: Title, paces: Paces, course: Course, fuel: Fuel, cta: Cta };

export const TrainPace = () => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 20% 10%, #064e3b 0%, ${BG} 55%)` }}>
    {(Object.keys(SCENES) as (keyof typeof SCENES)[]).map((k) => {
      const [from, len] = SCENES[k];
      const Scene = SCENE_COMPONENTS[k];
      return (
        <Sequence key={k} from={from} durationInFrames={len}>
          {k === "cta" ? <Scene /> : <FadeOut length={len}><Scene /></FadeOut>}
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
