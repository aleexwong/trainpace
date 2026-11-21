/**
 * TemperatureCurveChart — finish time as a function of temperature, with the
 * user's own forecast marked on the curve.
 *
 * This is the part that changes behaviour. A single adjusted time tells you
 * what to expect; the curve tells you what to *do* — it's visibly flat below
 * ~15°C and then bends hard, which is the honest argument for an early start
 * time or a different goal race.
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
  type ChartOptions,
  type TooltipItem,
} from "chart.js";
import { formatTime } from "@/features/vdot-calculator/vdot-math";
import { celsiusToFahrenheit } from "../conditions-math";
import type { SensitivityPoint } from "../conditions-math";
import type { TempUnit } from "../types";

Chart.register(LinearScale, PointElement, LineElement, Tooltip, Filler);

interface Props {
  points: SensitivityPoint[];
  currentTempC: number;
  currentTimeSeconds: number;
  goalTimeSeconds: number;
  tempUnit: TempUnit;
}

export function TemperatureCurveChart({
  points,
  currentTempC,
  currentTimeSeconds,
  goalTimeSeconds,
  tempUnit,
}: Props) {
  const data = useMemo(() => {
    const toDisplayTemp = (c: number) =>
      tempUnit === "C" ? c : celsiusToFahrenheit(c);

    const curve = points.map((p) => ({
      x: toDisplayTemp(p.tempC),
      y: p.adjustedTimeSeconds,
    }));

    return {
      datasets: [
        {
          label: "Predicted finish",
          data: curve,
          borderColor: "#059669",
          backgroundColor: "rgba(5, 150, 105, 0.08)",
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: "#059669",
          fill: true,
          tension: 0.25,
        },
        {
          // Single-point dataset standing in for an annotation plugin — keeps
          // the marker on the same scales without adding a dependency.
          label: "Your forecast",
          data: [
            { x: toDisplayTemp(currentTempC), y: currentTimeSeconds },
          ],
          borderColor: "#ea580c",
          backgroundColor: "#ea580c",
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBorderColor: "#fff",
          pointBorderWidth: 2.5,
          showLine: false,
        },
      ],
    };
  }, [points, currentTempC, currentTimeSeconds, tempUnit]);

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "nearest", axis: "x", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items: TooltipItem<"line">[]) =>
              `${Math.round(items[0].parsed.x)}°${tempUnit}`,
            label: (item: TooltipItem<"line">) => {
              const seconds = item.parsed.y;
              const delta = seconds - goalTimeSeconds;
              const deltaText =
                Math.round(delta) > 0 ? ` (+${formatTime(delta)})` : "";
              return `${formatTime(seconds)}${deltaText}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          title: {
            display: true,
            text: `Temperature (°${tempUnit})`,
            color: "#9ca3af",
            font: { size: 11 },
          },
          ticks: {
            color: "#9ca3af",
            font: { size: 10 },
            maxTicksLimit: 8,
            callback: (value) => `${value}°`,
          },
          grid: { display: false },
        },
        y: {
          title: { display: false },
          ticks: {
            color: "#9ca3af",
            font: { size: 10 },
            maxTicksLimit: 5,
            callback: (value) => formatTime(Number(value)),
          },
          grid: { color: "rgba(0,0,0,0.04)" },
        },
      },
    }),
    [tempUnit, goalTimeSeconds]
  );

  if (points.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg border-0 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            How much does the weather cost you?
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Finish time across the temperature range, holding your forecast
            humidity and race elevation fixed.
          </p>
        </div>
        <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold text-orange-600">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-600 border-2 border-white ring-1 ring-orange-200" />
          You
        </span>
      </div>

      <div className="h-56 sm:h-64 mt-3">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
