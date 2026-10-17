/**
 * RouteSimulator
 * Real-time WebGPU run-through of the loaded route: the GPX course on terrain
 * built from its own elevation, physically based sky and sun shadows, and a
 * runner whose speed follows a grade-adjusted pace model.
 *
 * Lazy-loaded by RouteSimulatorCard so none of this (or the GPU device) is
 * paid for until the user asks for it. The animation loop writes the HUD
 * straight to DOM refs instead of React state so it never re-renders at 60 fps.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minimize2, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeLighting } from "../simulator/atmosphere";
import { cadenceFor, writeRunner, RUNNER_MAX_PARTS } from "../simulator/gait";
import { clamp, type Vec3 } from "../simulator/math";
import {
  SimRenderer,
  WebGpuUnavailableError,
  type CameraState,
} from "../simulator/renderer";
import {
  INSTANCE_FLOATS,
  applyPacing,
  buildMarkers,
  buildRoad,
  buildRoute,
  buildTerrain,
  distanceAtTime,
  sampleRoute,
  scatterTrees,
  terrainHeight,
  timeAtDistance,
  type RouteInputPoint,
  type RouteInputProfilePoint,
  type SimRoute,
  type Terrain,
} from "../simulator/world";

type CameraMode = "chase" | "side" | "drone" | "aerial";

const CAMERA_MODES: { id: CameraMode; label: string }[] = [
  { id: "chase", label: "Chase" },
  { id: "side", label: "Side" },
  { id: "drone", label: "Drone" },
  { id: "aerial", label: "Aerial" },
];

const SPEEDS = [1, 5, 20, 60, 180];

interface RouteSimulatorProps {
  displayPoints: RouteInputPoint[];
  profile: RouteInputProfilePoint[];
  basePaceMinPerKm: number;
  routeName: string;
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  return `${h ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function RouteSimulator({
  displayPoints,
  profile,
  basePaceMinPerKm,
  routeName,
}: RouteSimulatorProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const distanceRef = useRef<HTMLSpanElement>(null);
  const elapsedRef = useRef<HTMLSpanElement>(null);
  const paceRef = useRef<HTMLSpanElement>(null);
  const gradeRef = useRef<HTMLSpanElement>(null);
  const elevationRef = useRef<HTMLSpanElement>(null);
  const scrubRef = useRef<HTMLInputElement>(null);

  const [renderer, setRenderer] = useState<SimRenderer | null>(null);
  const [builtRoute, setBuiltRoute] = useState<SimRoute | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Respect reduced-motion: start paused and let the user press play.
  const [playing, setPlaying] = useState(
    () => !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
  const [speed, setSpeed] = useState(20);
  const [mode, setMode] = useState<CameraMode>("chase");
  const [hour, setHour] = useState(8.5);
  const [relief, setRelief] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [finished, setFinished] = useState(false);

  // Mutable simulation state shared with the animation loop.
  const sim = useRef({
    distance: 0,
    phase: 0,
    camYaw: 0,
    camPos: null as Vec3 | null,
    orbitYaw: 0,
    orbitPitch: 0,
    zoom: 1,
    playing: true,
    speed: 20,
    mode: "chase" as CameraMode,
  });
  const world = useRef<{ route: SimRoute; terrain: Terrain } | null>(null);
  const runnerBuf = useRef(
    new Float32Array(RUNNER_MAX_PARTS * INSTANCE_FLOATS),
  );

  useEffect(() => {
    sim.current.playing = playing;
    sim.current.speed = speed;
    sim.current.mode = mode;
  }, [playing, speed, mode]);

  const route = useMemo(
    () => buildRoute(displayPoints, profile, relief),
    [displayPoints, profile, relief],
  );

  const totalTime = useMemo(() => {
    if (!route) return 0;
    applyPacing(route, basePaceMinPerKm);
    return route.time[route.n - 1];
  }, [route, basePaceMinPerKm]);

  const ready = renderer !== null && route !== null && builtRoute === route;
  const status = error
    ? "error"
    : !renderer
      ? "init"
      : ready
        ? "ready"
        : "building";

  // GPU device: created once per mount.
  useEffect(() => {
    let cancelled = false;
    let created: SimRenderer | null = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    SimRenderer.create(canvas, () =>
      setError("The graphics device was reset. Reload the page to restart the simulation.")
    )
      .then((r) => {
        if (cancelled) {
          r.destroy();
          return;
        }
        created = r;
        setRenderer(r);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof WebGpuUnavailableError
            ? `${e.message} The 3D simulation needs WebGPU — try a recent Chrome, Edge or Safari.`
            : "The 3D simulation could not start on this device's graphics hardware.",
        );
      });
    return () => {
      cancelled = true;
      created?.destroy();
    };
  }, []);

  // World geometry: rebuilt when the route or relief exaggeration changes.
  useEffect(() => {
    if (!renderer || !route) return;
    // Yield a frame so the "building" overlay paints before the heavy work.
    const id = window.setTimeout(() => {
      const terrain = buildTerrain(route, relief);
      renderer.setWorld({
        terrain,
        road: buildRoad(route),
        forest: scatterTrees(route, terrain, Math.round(route.length) + 7),
        markers: buildMarkers(route),
        routeLength: route.length,
      });
      world.current = { route, terrain };
      sim.current.camPos = null;
      setBuiltRoute(route);
    }, 30);
    return () => window.clearTimeout(id);
  }, [renderer, route, relief]);

  useEffect(() => {
    renderer?.setLighting(computeLighting(hour));
  }, [renderer, hour]);

  // Animation loop.
  useEffect(() => {
    if (!ready || !renderer) return;
    let raf = 0;
    let last = performance.now();
    const start = last;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const w = world.current;
      if (!w) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const st = sim.current;
      const { route: r, terrain } = w;

      if (st.playing && st.distance < r.length) {
        const t = timeAtDistance(r, st.distance) + dt * st.speed;
        st.distance = distanceAtTime(r, t);
        if (st.distance >= r.length) {
          st.distance = r.length;
          setPlaying(false);
          setFinished(true);
        }
      }

      const p = sampleRoute(r, st.distance);
      const mps = 1000 / Math.max(60, p.paceSecPerKm);
      const moving = st.playing && st.distance < r.length;
      // Gait runs in real time even when the clock is fast-forwarded.
      if (moving) st.phase = (st.phase + dt * (cadenceFor(mps) / 120)) % 1;
      const heading = Math.atan2(p.dx, p.dz);
      const pos: Vec3 = [p.x, p.y, p.z];
      const count = writeRunner(
        runnerBuf.current,
        moving ? st.phase : 0.4,
        moving ? mps : 0,
        p.grade,
        pos,
        heading,
      );
      renderer.setRunner(runnerBuf.current, count);

      // Camera: follow the smoothed heading, plus user orbit and zoom.
      let dy = heading - st.camYaw;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      st.camYaw += dy * Math.min(1, dt * 2.2);
      const yaw = st.camYaw + st.orbitYaw;
      const preset = {
        chase: {
          dist: 5.2,
          height: 1.9,
          look: 1.15,
          fov: 52,
          shadow: 30,
          side: 0,
        },
        side: {
          dist: 5.5,
          height: 1.2,
          look: 1.0,
          fov: 45,
          shadow: 30,
          side: Math.PI / 2,
        },
        drone: {
          dist: 34,
          height: 18,
          look: 1,
          fov: 50,
          shadow: 80,
          side: 0.35,
        },
        aerial: {
          dist: 480,
          height: 190,
          look: 0,
          fov: 45,
          shadow: 600,
          side: 0.6,
        },
      }[st.mode];
      const z = st.zoom;
      const a = yaw + preset.side;
      const pitchLift = st.orbitPitch * preset.dist * z;
      let eye: Vec3 = [
        p.x - Math.sin(a) * preset.dist * z,
        p.y + preset.height * z + pitchLift,
        p.z - Math.cos(a) * preset.dist * z,
      ];
      eye[1] = Math.max(
        eye[1],
        terrainHeight(terrain, eye[0], eye[2]) + 1.2,
        p.y + 0.4,
      );
      // Ease the camera so time-lapse jumps don't snap the view.
      if (st.camPos) {
        const k = Math.min(1, dt * 8);
        eye = [
          st.camPos[0] + (eye[0] - st.camPos[0]) * k,
          st.camPos[1] + (eye[1] - st.camPos[1]) * k,
          st.camPos[2] + (eye[2] - st.camPos[2]) * k,
        ];
      }
      st.camPos = eye;
      const target: Vec3 = [
        p.x + p.dx * 1.5,
        p.y + preset.look,
        p.z + p.dz * 1.5,
      ];
      const cam: CameraState = {
        eye,
        target,
        fovY: (preset.fov * Math.PI) / 180,
        shadowCenter: [
          p.x + p.dx * preset.shadow * 0.4,
          p.y,
          p.z + p.dz * preset.shadow * 0.4,
        ],
        shadowRadius: preset.shadow * Math.max(1, z),
      };
      renderer.render(cam, (now - start) / 1000);

      // HUD.
      const elapsed = timeAtDistance(r, st.distance);
      const text = (el: HTMLElement | null, value: string) => {
        if (el) el.textContent = value;
      };
      text(distanceRef.current, (st.distance / 1000).toFixed(2));
      text(elapsedRef.current, formatClock(elapsed));
      text(paceRef.current, formatClock(p.paceSecPerKm));
      text(
        gradeRef.current,
        `${p.grade >= 0 ? "+" : ""}${(p.grade * 100).toFixed(1)}`,
      );
      text(elevationRef.current, Math.round(p.ele).toString());
      const scrub = scrubRef.current;
      if (scrub && document.activeElement !== scrub)
        scrub.value = String(st.distance / r.length);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, renderer]);

  // Drag to orbit, wheel / pinch to zoom.
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const st = sim.current;
    st.orbitYaw -= (e.clientX - d.x) * 0.006;
    st.orbitPitch = clamp(st.orbitPitch + (e.clientY - d.y) * 0.004, -0.3, 1.4);
    d.x = e.clientX;
    d.y = e.clientY;
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      sim.current.zoom = clamp(
        sim.current.zoom * Math.exp(e.deltaY * 0.0012),
        0.4,
        4,
      );
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  const resetView = useCallback(() => {
    Object.assign(sim.current, { orbitYaw: 0, orbitPitch: 0, zoom: 1 });
  }, []);

  const restart = useCallback(() => {
    sim.current.distance = 0;
    sim.current.camPos = null;
    setFinished(false);
    setPlaying(true);
  }, []);

  const onScrub = (value: number) => {
    const r = world.current?.route;
    if (!r) return;
    sim.current.distance = value * r.length;
    sim.current.camPos = null;
    setFinished(value >= 1);
  };

  const toggleFullscreen = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (!route) {
    return (
      <div className="rounded-lg border bg-white p-6 text-sm text-gray-600">
        This route has too few GPS points to build a 3D simulation.
      </div>
    );
  }

  const chip = "rounded-md px-2.5 py-1 text-xs font-medium transition-colors";

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative w-full overflow-hidden bg-slate-900 text-left select-none",
        fullscreen ? "h-screen" : "aspect-[4/5] sm:aspect-video rounded-xl",
      )}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none cursor-grab active:cursor-grabbing"
        aria-label={`3D simulation of a runner on ${routeName}`}
        role="img"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={resetView}
      />

      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 p-6 text-center">
          {status === "error" ? (
            <p className="max-w-sm text-sm text-slate-200">{error}</p>
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-200">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
              <p className="text-sm">
                {status === "init"
                  ? "Starting the GPU…"
                  : "Building terrain, road and forest…"}
              </p>
            </div>
          )}
        </div>
      )}

      {status === "ready" && (
        <>
          {/* HUD + camera: stacked on phones, side by side from sm up. */}
          <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-col items-start gap-2 sm:flex-row sm:justify-between">
            <div className="grid w-full grid-cols-5 gap-x-3 rounded-lg bg-black/45 px-3 py-2 font-display text-white backdrop-blur-sm sm:w-auto sm:gap-x-5">
              {[
                { ref: distanceRef, label: "km", unit: "" },
                { ref: elapsedRef, label: "time", unit: "" },
                { ref: paceRef, label: "pace", unit: "/km" },
                { ref: gradeRef, label: "grade", unit: "%" },
                { ref: elevationRef, label: "elev", unit: "m" },
              ].map(({ ref, label, unit }) => (
                <div key={label} className="leading-tight">
                  <div className="text-[10px] uppercase tracking-wider text-white/60">
                    {label}
                  </div>
                  <div className="text-sm tabular-nums sm:text-lg">
                    <span ref={ref}>–</span>
                    <span className="ml-0.5 text-xs text-white/60">{unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pointer-events-auto flex w-full items-start justify-between gap-2 sm:w-auto sm:flex-col sm:items-end">
              <div className="flex gap-1 rounded-lg bg-black/45 p-1 backdrop-blur-sm">
                {CAMERA_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMode(m.id);
                      resetView();
                    }}
                    className={cn(
                      chip,
                      mode === m.id
                        ? "bg-white text-slate-900"
                        : "bg-transparent text-white hover:bg-white/15",
                    )}
                    aria-pressed={mode === m.id}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="rounded-lg bg-black/45 p-2 text-white backdrop-blur-sm hover:bg-black/60"
                aria-label={fullscreen ? "Exit full screen" : "Full screen"}
              >
                {fullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {finished && (
            <div className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center">
              <div className="rounded-xl bg-black/55 px-6 py-4 text-center text-white backdrop-blur">
                <div className="text-xs uppercase tracking-widest text-white/70">
                  Finish
                </div>
                <div className="font-display text-4xl font-bold tabular-nums">
                  {formatClock(totalTime)}
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8 text-white">
            <input
              ref={scrubRef}
              type="range"
              min={0}
              max={1}
              step={0.0005}
              defaultValue={0}
              onChange={(e) => onScrub(Number(e.target.value))}
              className="mb-2 w-full accent-emerald-400"
              aria-label="Position on the route"
            />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => (finished ? restart() : setPlaying((p) => !p))}
                  className="rounded-full bg-white p-2 text-slate-900 hover:bg-emerald-100"
                  aria-label={
                    finished ? "Run again" : playing ? "Pause" : "Play"
                  }
                >
                  {finished ? (
                    <RotateCcw className="h-4 w-4" />
                  ) : playing ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div
                className="flex items-center gap-1"
                role="group"
                aria-label="Simulation speed"
              >
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={cn(
                      chip,
                      "px-2",
                      speed === s
                        ? "bg-emerald-500 text-white"
                        : "bg-white/10 hover:bg-white/20",
                    )}
                    aria-pressed={speed === s}
                  >
                    {s}×
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2">
                <span className="text-white/70">Time</span>
                <input
                  type="range"
                  min={5.75}
                  max={20.5}
                  step={0.05}
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="w-24 accent-amber-400 sm:w-32"
                  aria-label="Time of day"
                />
                <span className="w-10 font-display tabular-nums">
                  {formatHour(hour)}
                </span>
              </label>
              <div
                className="flex items-center gap-1"
                role="group"
                aria-label="Relief exaggeration"
              >
                <span className="mr-1 text-white/70">Relief</span>
                {[1, 2, 3].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRelief(v)}
                    className={cn(
                      chip,
                      "px-2",
                      relief === v
                        ? "bg-white text-slate-900"
                        : "bg-white/10 hover:bg-white/20",
                    )}
                    aria-pressed={relief === v}
                  >
                    {v}×
                  </button>
                ))}
              </div>
              <span className="ml-auto hidden text-white/60 sm:inline">
                Projected finish{" "}
                <span className="font-display tabular-nums text-white">
                  {formatClock(totalTime)}
                </span>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
