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
import { useState, useRef, useMemo } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

interface ElevationChartProps {
  points: ProfilePoint[];
  filename?: string;
  // New props for editing functionality
  docId?: string;
  isOwner?: boolean;
  onFilenameUpdate?: (newFilename: string) => void;
}

// Calculate grade percentage between two points
function calculateGrade(p1: ProfilePoint, p2: ProfilePoint): number {
  const distanceMeters = (p2.distanceKm - p1.distanceKm) * 1000;
  const elevationChange = p2.elevation - p1.elevation;
  if (distanceMeters === 0) return 0;
  return (elevationChange / distanceMeters) * 100;
}

// Map grade to color (green = downhill, red = uphill)
function getGradeColor(grade: number): string {
  // Clamp grade between -15% and +15%
  const clampedGrade = Math.max(-15, Math.min(15, grade));

  if (clampedGrade < 0) {
    // Downhill: bright green to yellow-green
    const intensity = Math.abs(clampedGrade) / 15;
    const r = Math.round(34 + (154 - 34) * (1 - intensity)); // 34 -> 154
    const g = Math.round(197 + (205 - 197) * (1 - intensity)); // 197 -> 205
    const b = Math.round(94 + (50 - 94) * (1 - intensity)); // 94 -> 50
    return `rgb(${r}, ${g}, ${b})`;
  } else if (clampedGrade > 0) {
    // Uphill: yellow-orange to bright red
    const intensity = clampedGrade / 15;
    const r = Math.round(234 + (220 - 234) * intensity); // 234 -> 220
    const g = Math.round(179 - 179 * intensity); // 179 -> 0
    const b = Math.round(8 - 8 * intensity); // 8 -> 0
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Flat: neutral blue-gray
    return "rgb(100, 116, 139)";
  }
}

export function ElevationChart({
  points,
  filename,
  docId,
  isOwner,
  onFilenameUpdate,
}: ElevationChartProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editFilename, setEditFilename] = useState(filename || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEdit = () => {
    setIsEditing(true);
    setEditFilename(filename || "");
    // Focus input after state update
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = async () => {
    const trimmedFilename = editFilename.trim();

    if (!trimmedFilename || trimmedFilename === filename || !docId) {
      setIsEditing(false);
      setEditFilename(filename || "");
      return;
    }

    setIsUpdating(true);
    try {
      // Update Firebase document
      const docRef = doc(db, "gpx_uploads", docId);
      await updateDoc(docRef, {
        filename: trimmedFilename,
        updatedAt: new Date().toISOString(),
      });

      // Notify parent component
      onFilenameUpdate?.(trimmedFilename);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update filename:", error);
      // Reset on error
      setEditFilename(filename || "");
      setIsEditing(false);
      // You could add a toast notification here
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditFilename(filename || "");
      setIsEditing(false);
    }
  };

  // Calculate grades for all segments
  const grades = useMemo(() => {
    const result: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      result.push(calculateGrade(points[i], points[i + 1]));
    }
    // Add last grade (same as second to last) for consistent length
    result.push(result[result.length - 1] || 0);
    return result;
  }, [points]);

  const data = {
    datasets: [
      {
        label: filename ? filename.replace(".gpx", "") : "Elevation Profile",
        data: points.map((p) => ({ x: p.distanceKm, y: p.elevation })),
        segment: {
          borderColor: (ctx: any) => {
            // ctx.p0DataIndex is the starting point of the segment
            const idx = ctx.p0DataIndex;
            return getGradeColor(grades[idx]);
          },
        },
        backgroundColor: "rgba(25, 170, 56, 0.15)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "rgba(59, 130, 246, 1)",
        pointHoverBorderColor: "rgba(255, 255, 255, 1)",
        pointHoverBorderWidth: 2,
        borderWidth: 3,
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
            const idx = context.dataIndex;
            const grade = grades[idx];
            return [
              `Elevation: ${context.parsed.y.toFixed(0)} m`,
              `Grade: ${grade.toFixed(1)}%`,
            ];
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
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Editable filename header */}
      <div className="px-4 py-3 border-b border-gray-200">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={editFilename}
              onChange={(e) => setEditFilename(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyPress}
              disabled={isUpdating}
              className="flex-1 px-2 py-1 text-lg font-semibold border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={100}
              placeholder="Enter filename..."
            />
            {isUpdating && (
              <div className="w-4 h-4 animate-spin border-2 border-blue-500 border-t-transparent rounded-full" />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {filename ? filename.replace(".gpx", "") : "Elevation Profile"}
            </h3>
            {isOwner && docId && (
              <button
                onClick={handleEdit}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Edit filename"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Chart container */}
      <div className="w-full h-80 p-4">
        <Line data={data} options={options} />
      </div>

      {/* Grade legend */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-700">
          <div className="flex items-center gap-2">
            <div
              className="w-16 h-4 rounded border border-gray-300"
              style={{
                background:
                  "linear-gradient(to right, rgb(34, 197, 94), rgb(154, 205, 50))",
              }}
            />
            <span className="font-medium">Downhill (-15% to 0%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: "rgb(100, 116, 139)" }}
            />
            <span className="font-medium">Flat</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-16 h-4 rounded border border-gray-300"
              style={{
                background:
                  "linear-gradient(to right, rgb(234, 179, 8), rgb(220, 38, 38))",
              }}
            />
            <span className="font-medium">Uphill (0% to +15%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple pencil icon component
function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}

export default ElevationChart;
