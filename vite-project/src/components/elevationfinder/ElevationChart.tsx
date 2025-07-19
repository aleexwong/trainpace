import { ProfilePoint } from "@/types/elevation";
import { Line } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartOptions,
  Filler,
} from "chart.js";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

// type ProfilePoint = { distanceKm: number; elevation: number };

interface ElevationChartProps {
  points: ProfilePoint[];
  filename?: string;
}

export function ElevationChart({ points, filename }: ElevationChartProps) {
  const data = {
    datasets: [
      {
        label: filename ? filename.replace(".gpx", "") : "Elevation Profile",
        data: points.map((p) => ({ x: p.distanceKm, y: p.elevation })),
        borderColor: "rgba(59, 130, 246, 1)", // Blue-500
        backgroundColor: "rgba(59, 130, 246, 0.1)", // Blue-500 with transparency
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "rgba(59, 130, 246, 1)",
        pointHoverBorderColor: "rgba(255, 255, 255, 1)",
        pointHoverBorderWidth: 2,
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index",
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "start",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          font: {
            size: 12,
            weight: "bold",
          },
          color: "rgba(55, 65, 81, 1)", // Gray-700
        },
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.95)", // Gray-900 with transparency
        titleColor: "rgba(255, 255, 255, 1)",
        bodyColor: "rgba(255, 255, 255, 1)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (tooltipItems) => {
            return `Distance: ${tooltipItems[0].parsed.x.toFixed(1)} km`;
          },
          label: (context) => {
            return `Elevation: ${context.parsed.y.toFixed(0)} m`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        title: {
          display: true,
          text: "Distance (km)",
          color: "rgba(75, 85, 99, 1)", // Gray-600
          font: {
            size: 14,
            weight: "bold",
          },
        },
        ticks: {
          stepSize: 1.0,
          color: "rgba(107, 114, 128, 1)", // Gray-500
          font: {
            size: 11,
          },
        },
        grid: {
          color: "rgba(229, 231, 235, 1)", // Gray-200
          lineWidth: 1,
        },
        border: {
          color: "rgba(209, 213, 219, 1)", // Gray-300
        },
      },
      y: {
        title: {
          display: true,
          text: "Elevation (m)",
          color: "rgba(75, 85, 99, 1)", // Gray-600
          font: {
            size: 14,
            weight: "bold",
          },
        },
        ticks: {
          color: "rgba(107, 114, 128, 1)", // Gray-500
          font: {
            size: 11,
          },
        },
        grid: {
          color: "rgba(229, 231, 235, 1)", // Gray-200
          lineWidth: 1,
        },
        border: {
          color: "rgba(209, 213, 219, 1)", // Gray-300
        },
      },
    },
  };

  return (
    <div className="w-full h-80 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <Line data={data} options={options} />
    </div>
  );
}

export default ElevationChart;
