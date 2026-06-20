import { useEffect, useRef } from "react";
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from "chart.js";
import marathonData from "@/data/marathon-data.json";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

interface RoutePoint {
  lat: number;
  lng: number;
  ele: number;
  dist: number;
}

interface RouteData {
  name: string;
  elevationGain: number;
  elevationLoss: number;
  thumbnailPoints: RoutePoint[];
}

const routes = marathonData as Record<string, RouteData>;

interface Props {
  routeKey: string;
  caption?: string;
}

export default function BlogElevationChart({ routeKey, caption }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const route = routes[routeKey];

  useEffect(() => {
    if (!canvasRef.current || !route) return;

    const pts = route.thumbnailPoints;
    const labels = pts.map((p) => `${p.dist.toFixed(1)} km`);
    const elevations = pts.map((p) => p.ele);
    const minEle = Math.min(...elevations);
    const maxEle = Math.max(...elevations);
    const padding = Math.max((maxEle - minEle) * 0.15, 8);

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            data: elevations,
            fill: true,
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            borderColor: "rgb(16, 185, 129)",
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: "rgb(16, 185, 129)",
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} m elevation`,
              title: (items) => items[0].label,
            },
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            titleColor: "#94a3b8",
            bodyColor: "#f1f5f9",
            padding: 10,
            cornerRadius: 6,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: "#94a3b8",
              font: { size: 11 },
              maxTicksLimit: 8,
              maxRotation: 0,
            },
            border: { display: false },
          },
          y: {
            min: Math.floor(minEle - padding),
            max: Math.ceil(maxEle + padding),
            grid: { color: "rgba(148, 163, 184, 0.12)" },
            ticks: {
              color: "#94a3b8",
              font: { size: 11 },
              callback: (v) => `${v} m`,
            },
            border: { display: false },
          },
        },
      },
    });

    return () => { chartRef.current?.destroy(); };
  }, [routeKey, route]);

  if (!route) {
    return (
      <div className="my-6 p-4 bg-gray-100 rounded-lg text-sm text-gray-500 text-center">
        Unknown route: {routeKey}
      </div>
    );
  }

  const gain = route.elevationGain;
  const loss = route.elevationLoss;
  const pts = route.thumbnailPoints;
  const maxEle = Math.max(...pts.map((p) => p.ele));

  return (
    <figure className="my-8 not-prose">
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        {/* Header */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-gray-100">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Elevation Profile</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{route.name}</p>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-xs text-gray-400">Gain</p>
              <p className="text-sm font-bold text-emerald-600">+{gain} m</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Loss</p>
              <p className="text-sm font-bold text-rose-500">−{loss} m</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Peak</p>
              <p className="text-sm font-bold text-gray-700">{maxEle} m</p>
            </div>
          </div>
        </div>
        {/* Chart */}
        <div className="px-4 pt-3 pb-4 h-48">
          <canvas ref={canvasRef} />
        </div>
      </div>
      {caption && (
        <figcaption className="mt-2 text-xs text-gray-400 text-center">{caption}</figcaption>
      )}
    </figure>
  );
}
