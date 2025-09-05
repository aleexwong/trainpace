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
import { useState, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

export function ElevationChart({ points, filename, docId, isOwner, onFilenameUpdate }: ElevationChartProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editFilename, setEditFilename] = useState(filename || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEdit = () => {
    setIsEditing(true);
    setEditFilename(filename || '');
    // Focus input after state update
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = async () => {
    const trimmedFilename = editFilename.trim();
    
    if (!trimmedFilename || trimmedFilename === filename || !docId) {
      setIsEditing(false);
      setEditFilename(filename || '');
      return;
    }

    setIsUpdating(true);
    try {
      // Update Firebase document
      const docRef = doc(db, 'gpx_uploads', docId);
      await updateDoc(docRef, { 
        filename: trimmedFilename,
        updatedAt: new Date().toISOString()
      });
      
      // Notify parent component
      onFilenameUpdate?.(trimmedFilename);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update filename:', error);
      // Reset on error
      setEditFilename(filename || '');
      setIsEditing(false);
      // You could add a toast notification here
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditFilename(filename || '');
      setIsEditing(false);
    }
  };
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
              {filename ? filename.replace('.gpx', '') : 'Elevation Profile'}
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
    </div>
  );
}

// Simple pencil icon component
function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

export default ElevationChart;
