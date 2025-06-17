import { Line } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

type ProfilePoint = { distanceKm: number; elevation: number };

interface ElevationChartProps {
  points: ProfilePoint[];
}

export function ElevationChart({ points }: ElevationChartProps) {
  const labels = points.map((p) => p.distanceKm);
  const elevations = points.map((p) => p.elevation);

  const data = {
    labels,
    datasets: [
      {
        label: "Elevation (m)",
        data: elevations,
        borderColor: "rgba(75,192,192,1)",
        fill: false,
        tension: 0.1,
        pointRadius: 2,
      },
    ],
  };

  let options = {
    responsive: true,
    scales: {
      x: {
        title: { display: true, text: "Distance (km)" },
      },
      y: {
        title: { display: true, text: "Elevation (m)" },
      },
    },
  };

  // If you need to modify options, do it here
  // options = { ...options, ...someOtherOptions };

  return <Line data={data} options={options} />;
}

export default ElevationChart;
// This component renders an elevation chart using Chart.js and React.
