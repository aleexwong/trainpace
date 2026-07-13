import { useCallback, useEffect, useRef, useState } from "react";
import { BoltIcon, CountUp, sv, useInView } from "./shared";
import "./feature-shots.css";

/* ═══════════════════════════════════════════════════════════
   01 · PACE LADDER  (hover-expand zones)
   ═══════════════════════════════════════════════════════════ */
const PACE_ZONES = [
  {
    name: "Easy",
    pace: "8:42",
    w: "54%",
    z: "var(--z1)",
    desc: "Aerobic base & recovery — most weekly miles live here.",
  },
  {
    name: "Marathon",
    pace: "7:45",
    w: "64%",
    z: "var(--z2)",
    desc: "Goal marathon race pace — long-run rehearsal effort.",
  },
  {
    name: "Threshold",
    pace: "7:08",
    w: "74%",
    z: "var(--z3)",
    desc: "Comfortably hard — about a one-hour race effort.",
  },
  {
    name: "Interval",
    pace: "6:21",
    w: "86%",
    z: "var(--z4)",
    desc: "VO₂max — 3–5 min repeats to lift your ceiling.",
  },
  {
    name: "Repetition",
    pace: "5:58",
    w: "96%",
    z: "var(--z5)",
    desc: "Speed & economy — short, fast, full recovery.",
  },
];

export function PaceLadderShot() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div className="tpfs">
      <div className="stage">
        <div className="pad">
          <div ref={ref} className={`shot${inView ? " in" : ""}`}>
            <div className="pl-grid">
              <div className="pl-input reveal" style={sv({ "--i": 0 })}>
                <div className="kicker">Recent 10K</div>
                <div className="pl-readout">
                  <span className="t numeral">44:30</span>
                </div>
                <div className="pl-cap">
                  Five training zones, paced to your fitness and{" "}
                  <b>saved to your dashboard.</b>
                </div>
              </div>
              <div className="pl-lanes">
                {PACE_ZONES.map((zone, i) => (
                  <div
                    key={zone.name}
                    className="pl-lane reveal"
                    tabIndex={0}
                    style={sv({ "--i": i + 1 })}
                  >
                    <div className="pl-lane-top">
                      <span className="pl-zone">
                        <span className="dot" style={{ background: zone.z }} />
                        {zone.name}
                      </span>
                      <span className="pl-pace mono">
                        {zone.pace}
                        <span className="u">/mi</span>
                      </span>
                    </div>
                    <div className="pl-track">
                      <div
                        className="pl-fill"
                        style={sv({ "--w": zone.w, "--d": i, background: zone.z })}
                      />
                    </div>
                    <div className="pl-desc">{zone.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   02 · VDOT DIAL  (ring sweep + count-up + prediction rows)
   ═══════════════════════════════════════════════════════════ */
const VD_R = 42;
const VD_C = 2 * Math.PI * VD_R;
const VD_PCT = 0.71;
const VD_PREDS = [
  { d: "5K", t: "21:14" },
  { d: "10K", t: "44:02" },
  { d: "Half marathon", t: "1:37:48" },
  { d: "Marathon", t: "3:24:30" },
];

export function VdotDialShot() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div className="tpfs">
      <div className="stage">
        <div className="pad">
          <div ref={ref} className={`shot${inView ? " in" : ""}`}>
            <div className="vd-grid">
              <div className="vd-dial reveal" style={sv({ "--i": 0 })}>
                <svg viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="vdGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--z3)" />
                      <stop offset="100%" stopColor="var(--accent-bright)" />
                    </linearGradient>
                  </defs>
                  <circle className="vd-ring-bg" cx="50" cy="50" r={VD_R} />
                  <circle
                    className="vd-ring"
                    cx="50"
                    cy="50"
                    r={VD_R}
                    style={{
                      strokeDasharray: VD_C,
                      strokeDashoffset: inView ? VD_C * (1 - VD_PCT) : VD_C,
                    }}
                  />
                </svg>
                <div className="vd-center">
                  <span className="score">
                    <CountUp value={49.8} decimals={1} play={inView} />
                  </span>
                  <span className="lbl">VDOT</span>
                </div>
              </div>
              <div className="vd-side">
                <div className="vd-rating reveal" style={sv({ "--i": 1 })}>
                  <span className="pip" />
                  Advanced runner
                </div>
                <div className="vd-title reveal" style={sv({ "--i": 2 })}>
                  Equivalent race times
                </div>
                <div className="vd-preds">
                  {VD_PREDS.map((p, i) => (
                    <div
                      key={p.d}
                      className="vd-pred reveal"
                      style={sv({ "--i": i + 3 })}
                    >
                      <span className="d">{p.d}</span>
                      <span className="t">{p.t}</span>
                    </div>
                  ))}
                </div>
                <div className="vd-foot reveal" style={sv({ "--i": 7 })}>
                  Jack Daniels' Running Formula · 9 distances
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   03 · ELEVATION  (path draw + scrub)
   ═══════════════════════════════════════════════════════════ */
const EL_PTS: [number, number][] = [
  [0, 150],
  [50, 164],
  [100, 138],
  [150, 176],
  [200, 160],
  [250, 108],
  [300, 72],
  [350, 98],
  [400, 66],
  [450, 120],
  [500, 150],
  [550, 186],
  [600, 170],
];
const EL_PATH_D =
  "M0,150 L50,164 L100,138 L150,176 L200,160 L250,108 L300,72 L350,98 L400,66 L450,120 L500,150 L550,186 L600,170";

function yAt(xVB: number) {
  for (let i = 0; i < EL_PTS.length - 1; i++) {
    const [x0, y0] = EL_PTS[i];
    const [x1, y1] = EL_PTS[i + 1];
    if (xVB >= x0 && xVB <= x1) {
      const t = (xVB - x0) / (x1 - x0);
      return { y: y0 + (y1 - y0) * t, slope: (y1 - y0) / (x1 - x0) };
    }
  }
  return { y: EL_PTS[EL_PTS.length - 1][1], slope: 0 };
}
const ftAt = (y: number) => Math.round((200 - y) * 2.4 + 30);

export function ElevationShot() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const pathRef = useRef<SVGPathElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const lenRef = useRef(0);
  const demoRAF = useRef(0);

  const showAtX = useCallback((xVB: number) => {
    const wrap = wrapRef.current;
    const chart = wrap?.querySelector(".el-chart") as HTMLElement | null;
    const guide = guideRef.current;
    const cursor = cursorRef.current;
    const tip = tipRef.current;
    if (!wrap || !chart || !guide || !cursor || !tip) return;
    const w = wrap.clientWidth;
    const h = chart.clientHeight;
    const { y, slope } = yAt(xVB);
    const xPx = (xVB / 600) * w;
    const yPx = (y / 220) * h;
    guide.style.left = xPx + "px";
    guide.style.height = h + "px";
    guide.style.opacity = "1";
    cursor.style.left = xPx + "px";
    cursor.style.top = yPx + "px";
    cursor.classList.add("show");
    const mile = ((xVB / 600) * 26.2).toFixed(1);
    const ft = ftAt(y);
    const grade = -slope * 3.9; // scaled so steepest pitch ≈ 4%
    const gtxt = (grade >= 0 ? "+" : "−") + Math.abs(grade).toFixed(1) + "%";
    tip.innerHTML =
      '<span class="mi">Mile ' +
      mile +
      '</span><div class="row"><span><b>' +
      ft +
      "</b> ft</span><span>grade <b>" +
      gtxt +
      "</b></span></div>";
    tip.style.left = xPx + "px";
    tip.style.top = yPx + "px";
    tip.classList.add("show");
  }, []);

  const hideScrub = useCallback(() => {
    guideRef.current?.style.setProperty("opacity", "0");
    cursorRef.current?.classList.remove("show");
    tipRef.current?.classList.remove("show");
  }, []);

  const runDemo = useCallback(() => {
    cancelAnimationFrame(demoRAF.current);
    const dur = 1700;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      showAtX(e * 600);
      if (p < 1) {
        demoRAF.current = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          if (!wrapRef.current?.matches(":hover")) hideScrub();
        }, 700);
      }
    };
    demoRAF.current = requestAnimationFrame(tick);
  }, [showAtX, hideScrub]);

  // Measure once, then keep the line hidden until revealed.
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    lenRef.current = len;
    path.style.strokeDasharray = String(len);
    if (!inView) path.style.strokeDashoffset = String(len);
  }, [inView]);

  // Draw the line on reveal, then auto-trace the profile once.
  useEffect(() => {
    if (!inView) return;
    const path = pathRef.current;
    if (!path) return;
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    path.style.transition = reduce
      ? "none"
      : "stroke-dashoffset 1.6s var(--ease)";
    path.style.strokeDashoffset = "0";
    if (reduce) return;
    const t = setTimeout(runDemo, 800);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(demoRAF.current);
    };
  }, [inView, runDemo]);

  const toVB = (clientX: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return 0;
    const r = wrap.getBoundingClientRect();
    return Math.max(0, Math.min(600, ((clientX - r.left) / r.width) * 600));
  };

  return (
    <div className="tpfs">
      <div className="stage">
        <div className="pad">
          <div ref={ref} className={`shot${inView ? " in" : ""}`}>
            <div className="el-head reveal" style={sv({ "--i": 0 })}>
              <div className="el-name">
                Boston Marathon<span className="sub">26.2 mi</span>
              </div>
              <span className="el-terrain">Rolling Hills</span>
            </div>
            <div
              ref={wrapRef}
              className="el-chartwrap"
              onPointerMove={(e) => {
                cancelAnimationFrame(demoRAF.current);
                showAtX(toVB(e.clientX));
              }}
              onPointerLeave={hideScrub}
            >
              <svg
                className="el-chart"
                viewBox="0 0 600 220"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="elGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <g className="el-grid">
                  <line x1="0" y1="55" x2="600" y2="55" />
                  <line x1="0" y1="110" x2="600" y2="110" />
                  <line x1="0" y1="165" x2="600" y2="165" />
                </g>
                <path
                  className="el-area"
                  d={`${EL_PATH_D} L600,220 L0,220 Z`}
                  fill="url(#elGrad)"
                />
                <path ref={pathRef} className="el-line" d={EL_PATH_D} />
                <g className="el-flag">
                  <line
                    x1="400"
                    y1="66"
                    x2="400"
                    y2="40"
                    stroke="var(--clay)"
                    strokeWidth="2"
                  />
                  <path d="M400,40 L416,45 L400,50 Z" fill="var(--clay)" />
                  <circle
                    cx="400"
                    cy="66"
                    r="3.5"
                    fill="var(--panel)"
                    stroke="var(--clay)"
                    strokeWidth="2.5"
                  />
                </g>
              </svg>
              <div ref={guideRef} className="el-guide" />
              <div ref={cursorRef} className="el-cursor" />
              <div ref={tipRef} className="el-tip" />
            </div>
            <div className="el-stats">
              <div
                className="el-stat gain reveal"
                style={sv({ "--i": 6, "--base": "500ms" })}
              >
                <div className="k">Total gain</div>
                <div className="v">
                  <CountUp value={952} play={inView} />
                  <span className="u">ft</span>
                </div>
              </div>
              <div
                className="el-stat loss reveal"
                style={sv({ "--i": 7, "--base": "500ms" })}
              >
                <div className="k">Total loss</div>
                <div className="v">
                  <CountUp value={1284} play={inView} />
                  <span className="u">ft</span>
                </div>
              </div>
              <div
                className="el-stat reveal"
                style={sv({ "--i": 8, "--base": "500ms" })}
              >
                <div className="k">Steepest</div>
                <div className="v">
                  4.2<span className="u">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   04 · FUEL STATIONS  (2-way station ↔ row highlight)
   ═══════════════════════════════════════════════════════════ */
const FUEL_STATIONS = [
  { left: "5%", delay: ".6s" },
  { left: "50%", delay: "1.05s" },
  { left: "95%", delay: "1.5s" },
];
const FUEL_ROWS = [
  { when: "At the start", what: "Caffeine gel · 25g carbs" },
  { when: "Minute 45", what: "Standard gel · 25g carbs" },
  { when: "Minute 90", what: "Caffeine gel · 25g carbs" },
];

export function FuelStationsShot() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [hl, setHl] = useState<number | null>(null);

  return (
    <div className="tpfs">
      <div className="stage">
        <div className="pad">
          <div ref={ref} className={`shot${inView ? " in" : ""}`}>
            <div className="fp-grid">
              <div className="fp-target">
                <div className="reveal" style={sv({ "--i": 0 })}>
                  <div className="kicker">Carb target</div>
                </div>
                <div className="fp-num reveal" style={sv({ "--i": 1 })}>
                  <span className="n">
                    <CountUp value={50} play={inView} />
                  </span>
                  <span className="u">g / hour</span>
                </div>
                <div className="fp-sub reveal" style={sv({ "--i": 2 })}>
                  One gel every ~40 minutes
                </div>
                <div className="fp-meta reveal" style={sv({ "--i": 3 })}>
                  Tuned for a <b>3:45 marathon</b> at <b>154 lb</b> — three
                  caffeine-timed stations across the race. <b>Hover a station</b>{" "}
                  to trace it.
                </div>
                <div className="fp-track" style={{ marginTop: 24 }}>
                  <div className="fp-prog" />
                  {FUEL_STATIONS.map((s, i) => (
                    <div
                      key={i}
                      className={`fp-stn${hl === i ? " hl" : ""}`}
                      style={{ left: s.left, transitionDelay: s.delay }}
                      onMouseEnter={() => setHl(i)}
                      onMouseLeave={() => setHl(null)}
                    >
                      <BoltIcon />
                    </div>
                  ))}
                </div>
                <div className="fp-labels">
                  <span>Start</span>
                  <span>Min&nbsp;45</span>
                  <span>Min&nbsp;90</span>
                </div>
              </div>
              <div className="fp-rows">
                {FUEL_ROWS.map((row, i) => (
                  <div
                    key={i}
                    className={`fp-row reveal${hl === i ? " hl" : ""}`}
                    style={sv({ "--i": i + 6, "--base": "600ms" })}
                    onMouseEnter={() => setHl(i)}
                    onMouseLeave={() => setHl(null)}
                  >
                    <span className="ic">
                      <BoltIcon />
                    </span>
                    <span>
                      <div className="when">{row.when}</div>
                      <div className="what">{row.what}</div>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   05 · AGENT CHAT  (scripted MCP conversation, replayable)
   ═══════════════════════════════════════════════════════════ */

// Cumulative reveal times (ms) for phases 1..N of the conversation.
const AC_TIMELINE = [200, 900, 1700, 2700, 4400, 5100, 5900, 6900];

const AC_ZONES = [
  // Real calculate_training_paces output for a 48:30 10K
  { name: "Easy", pace: "5:49–6:18", w: "58%", z: "var(--z1)" },
  { name: "Tempo", pace: "4:36–5:05", w: "76%", z: "var(--z3)" },
  { name: "Interval", pace: "4:21–4:51", w: "90%", z: "var(--z5)" },
];

const AcCheck = () => (
  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

function AcToolChip({ tool, done }: { tool: string; done: boolean }) {
  return (
    <div className="ac-chip">
      {done ? (
        <span className="ac-ok"><AcCheck /></span>
      ) : (
        <span className="ac-spin" />
      )}
      <span>{tool}</span>
    </div>
  );
}

export function AgentChatShot() {
  const { ref, inView } = useInView<HTMLDivElement>(0.35);
  const [phase, setPhase] = useState(0);
  const timers = useRef<number[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  const play = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase(AC_TIMELINE.length);
      return;
    }
    setPhase(0);
    AC_TIMELINE.forEach((t, i) => {
      timers.current.push(window.setTimeout(() => setPhase(i + 1), t));
    });
  }, []);

  useEffect(() => {
    if (inView) play();
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, [inView, play]);

  // Keep the newest message in view as the script advances.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [phase]);

  const typing = phase === 2 || phase === 6;
  const done = phase >= AC_TIMELINE.length;

  return (
    <div className="tpfs">
      <div className="stage">
        <div ref={ref} className={`shot ac${inView ? " in" : ""}`}>
          <div className="ac-head">
            <span className="ac-dot" />
            <span className="ac-dot" />
            <span className="ac-dot" />
            <span className="ac-title">Your chatbot</span>
            {done && (
              <button className="ac-replay" onClick={play} aria-label="Replay conversation">
                ↺ replay
              </button>
            )}
            <span className="ac-status">trainpace</span>
          </div>

          <div className="ac-body" ref={bodyRef} aria-live="polite">
            {phase >= 1 && (
              <div className="ac-msg ac-user">
                What easy pace should I run? My last 10K was 48:30.
              </div>
            )}

            {phase >= 3 && (
              <AcToolChip tool="calculate_training_paces" done={phase >= 4} />
            )}

            {phase >= 4 && (
              <div className="ac-msg ac-bot">
                From your 48:30 10K, your zones are:
                <div className="ac-zones">
                  {AC_ZONES.map((zone, i) => (
                    <div key={zone.name} className="ac-zrow">
                      <span className="n">{zone.name}</span>
                      <span className="bar">
                        <i style={sv({ "--w": zone.w, "--d": `${i * 140}ms`, background: zone.z })} />
                      </span>
                      <span className="v">{zone.pace} /km</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {phase >= 5 && (
              <div className="ac-msg ac-user">
                Nice. How many gels for a 3:45 marathon? I'm 70 kg.
              </div>
            )}

            {phase >= 7 && (
              <AcToolChip tool="calculate_fuel_plan" done={phase >= 8} />
            )}

            {phase >= 8 && (
              <div className="ac-msg ac-bot">
                You'll need about 281 g of carbs total:
                <div className="ac-stats">
                  <span className="ac-stat"><b>6</b>gels</span>
                  <span className="ac-stat"><b>75 g</b>carbs / hr</span>
                  <span className="ac-stat"><b>0:15</b>first gel</span>
                </div>
                Fuel every 17–30 minutes, front-loaded while your stomach is
                fresh.
              </div>
            )}

            {typing && (
              <div className="ac-typing">
                <i />
                <i />
                <i />
              </div>
            )}
          </div>

          <div className="ac-input">
            <span>Ask about paces, plans, fuel, routes…</span>
            <span className="ac-caret" />
            <span className="ac-send">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   06 · TRAINING PLAN  (periodization bar + week strip)
   ═══════════════════════════════════════════════════════════ */
const TP_PHASES = [
  { name: "Base", weeks: "Wk 1–5", span: 5, z: "var(--z1)" },
  { name: "Development", weeks: "Wk 6–10", span: 5, z: "var(--z2)" },
  { name: "Sharpening", weeks: "Wk 11–14", span: 4, z: "var(--z4)" },
  { name: "Taper", weeks: "Wk 15–16", span: 2, z: "var(--z5)" },
];

type TpIntensity = "easy" | "long" | "quality" | "rest";

const TP_INTENSITY_COLOR: Record<TpIntensity, string> = {
  easy: "var(--z1)",
  long: "var(--z2)",
  quality: "var(--z4)",
  rest: "var(--ink-4)",
};

const TP_DAYS: {
  day: string;
  type: string;
  detail: string;
  intensity: TpIntensity;
}[] = [
  { day: "Mon", type: "Easy", detail: "5 mi · 8:42/mi", intensity: "easy" },
  {
    day: "Tue",
    type: "Intervals",
    detail: "6×800 · 6:21/mi",
    intensity: "quality",
  },
  { day: "Wed", type: "Rest", detail: "Recovery day", intensity: "rest" },
  {
    day: "Thu",
    type: "Tempo",
    detail: "4 mi · 7:08/mi",
    intensity: "quality",
  },
  { day: "Fri", type: "Rest", detail: "Recovery day", intensity: "rest" },
  {
    day: "Sat",
    type: "Long run",
    detail: "10 mi · 8:55/mi",
    intensity: "long",
  },
  { day: "Sun", type: "Recovery", detail: "3 mi easy", intensity: "easy" },
];

export function TrainingPlanShot() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div className="tpfs">
      <div className="stage">
        <div className="pad">
          <div ref={ref} className={`shot${inView ? " in" : ""}`}>
            <div className="tp-head reveal" style={sv({ "--i": 0 })}>
              <div className="tp-title">
                16-week <span className="race">Half Marathon</span> plan
              </div>
              <span className="tp-pill">Week 6 · Development</span>
            </div>

            <div className="tp-phasebar reveal" style={sv({ "--i": 1 })}>
              <div
                className="tp-phasebar-track"
                style={sv({
                  gridTemplateColumns: TP_PHASES.map(
                    (p) => `${p.span}fr`
                  ).join(" "),
                })}
              >
                {TP_PHASES.map((p, i) => (
                  <div key={p.name} className="tp-phase-col">
                    <div
                      className="tp-phase-track"
                      style={sv({ "--d": i })}
                      tabIndex={0}
                    >
                      <div
                        className="tp-phase-fill"
                        style={sv({ background: p.z })}
                      />
                    </div>
                    <div className="tp-phase-meta">
                      <span className="name">{p.name}</span>
                      <span className="wk">{p.weeks}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="tp-week">
              {TP_DAYS.map((d, i) => (
                <div
                  key={d.day}
                  className={`tp-day reveal${
                    d.intensity === "rest" ? " rest" : ""
                  }`}
                  style={sv({
                    "--i": i + 2,
                    "--base": "150ms",
                    borderLeftColor: TP_INTENSITY_COLOR[d.intensity],
                  })}
                >
                  <div className="tp-day-top">
                    <span className="dow">{d.day}</span>
                    <span
                      className="dot"
                      style={{ background: TP_INTENSITY_COLOR[d.intensity] }}
                    />
                  </div>
                  <div className="tp-day-type">{d.type}</div>
                  <div className="tp-day-detail">{d.detail}</div>
                </div>
              ))}
            </div>

            <div className="tp-foot reveal" style={sv({ "--i": 10 })}>
              Every session paced to your fitness · Export to Google or Apple
              Calendar
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
