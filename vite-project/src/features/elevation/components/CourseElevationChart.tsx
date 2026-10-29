/**
 * CourseElevationChart
 * Read-only elevation profile for a race course page (/preview-route/:slug).
 * Unlike ElevationChart it has no editing, grade colouring or map linking —
 * just the shape of the course, so a runner can see where the hills are.
 */
import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  ChartOptions,
} from "chart.js";
import type { ProfilePoint } from "@/types/elevation";
import { downsampleProfile } from "../utils";

Chart.register(LinearScale, PointElement, LineElement, Tooltip, Filler);

const MAX_CHART_POINTS = 1000;
const KM_PER_MILE = 1.609344;
// Auto-scaling a near-flat course stretches 10 m of noise into "hills".
// Never let the y-axis span less than this.
const MIN_Y_SPAN_M = 60;

interface CourseElevationChartProps {
  points: ProfilePoint[];
  courseName: string;
}

export function CourseElevationChart({
  points,
  courseName,
}: CourseElevationChartProps) {
  const series = useMemo(
    () => downsampleProfile(points, MAX_CHART_POINTS),
    [points]
  );

  const { yMin, yMax, low, high } = useMemo(() => {
    const eles = series.map((p) => p.elevation);
    const low = Math.min(...eles);
    const high = Math.max(...eles);
    const pad = Math.max(0, MIN_Y_SPAN_M - (high - low)) / 2;
    // Don't push a sea-level course below 0 m; put the padding above instead.
    const yMin = low >= 0 ? Math.max(0, low - pad) : low - pad;
    return { yMin, yMax: yMin + Math.max(MIN_Y_SPAN_M, high - low), low, high };
  }, [series]);

  const data = useMemo(
    () => ({
      datasets: [
        {
          label: "Elevation",
          data: series.map((p) => ({ x: p.distanceKm, y: p.elevation })),
          borderColor: "rgb(5, 150, 105)",
          backgroundColor: "rgba(5, 150, 105, 0.15)",
          fill: "start" as const,
          // Monotone: sparse points must not overshoot into fake peaks/dips.
          cubicInterpolationMode: "monotone" as const,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
      ],
    }),
    [series]
  );

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(17, 24, 39, 0.95)",
          displayColors: false,
          callbacks: {
            title: (items) => {
              const km = items[0].parsed.x;
              return `${km.toFixed(1)} km · mile ${(km / KM_PER_MILE).toFixed(1)}`;
            },
            label: (ctx) => `Elevation: ${Math.round(ctx.parsed.y)} m`,
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          min: 0,
          max: series[series.length - 1]?.distanceKm,
          title: { display: true, text: "Distance (km)" },
          ticks: { color: "rgba(107,114,128,1)", font: { size: 11 } },
          grid: { color: "rgba(229,231,235,1)" },
        },
        y: {
          // Suggested, not hard, bounds so Chart.js rounds to clean ticks.
          suggestedMin: yMin,
          suggestedMax: yMax,
          title: { display: true, text: "Elevation (m)" },
          ticks: { color: "rgba(107,114,128,1)", font: { size: 11 } },
          grid: { color: "rgba(229,231,235,1)" },
        },
      },
    }),
    [series, yMin, yMax]
  );

  if (series.length < 2) return null;

  return (
    <div className="w-full h-64 sm:h-72 p-4">
      <Line
        data={data}
        options={options}
        role="img"
        aria-label={`${courseName} elevation profile: lowest point ${Math.round(
          low
        )} m, highest point ${Math.round(high)} m.`}
      />
    </div>
  );
}

export default CourseElevationChart;
