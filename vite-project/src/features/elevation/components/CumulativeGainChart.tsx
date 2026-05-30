/**
 * CumulativeGainChart
 * Plots running total elevation *gain* against distance — "how much have I
 * climbed by km X". Distinct from the raw elevation profile: descents never
 * pull the line down, so the curve's steepness reads directly as climbing
 * effort accumulation.
 */
import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  ChartOptions,
} from "chart.js";
import type { ProfilePoint } from "@/types/elevation";
import { downsampleProfile, computeCumulativeGain } from "../utils";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

const MAX_CHART_POINTS = 1000;

export function CumulativeGainChart({ points }: { points: ProfilePoint[] }) {
  const series = useMemo(() => {
    // Accumulate gain at full resolution first — downsampling before summing
    // would drop intermediate climbs and under-report the total (the final
    // value must match the route's true elevation gain). The cumulative curve
    // is monotonic, so downsampling it for display preserves shape and the
    // last point. LTTB operates on `elevation`, so map gain↔elevation around it.
    const full = computeCumulativeGain(points);
    const reduced = downsampleProfile(
      full.map((p) => ({ distanceKm: p.distanceKm, elevation: p.gain })),
      MAX_CHART_POINTS
    );
    return reduced.map((p) => ({ distanceKm: p.distanceKm, gain: p.elevation }));
  }, [points]);

  const data = useMemo(
    () => ({
      datasets: [
        {
          label: "Cumulative Gain",
          data: series.map((p) => ({ x: p.distanceKm, y: p.gain })),
          borderColor: "rgb(220, 38, 38)",
          backgroundColor: "rgba(220, 38, 38, 0.12)",
          fill: true,
          tension: 0.3,
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
            title: (items) => `Distance: ${items[0].parsed.x.toFixed(1)} km`,
            label: (ctx) => `Climbed: ${ctx.parsed.y.toFixed(0)} m`,
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: "Distance (km)" },
          ticks: { color: "rgba(107,114,128,1)", font: { size: 11 } },
          grid: { color: "rgba(229,231,235,1)" },
        },
        y: {
          title: { display: true, text: "Cumulative gain (m)" },
          ticks: { color: "rgba(107,114,128,1)", font: { size: 11 } },
          grid: { color: "rgba(229,231,235,1)" },
        },
      },
    }),
    []
  );

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="px-4 py-3 border-b border-gray-200 text-base font-semibold text-gray-800">
        Cumulative Climbing
      </h3>
      <div className="w-full h-64 p-4">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default CumulativeGainChart;
