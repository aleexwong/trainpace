/**
 * RacePredictionsTable — Enhanced race predictions with visual bars
 * Supports compact mode for dashboard grid layout.
 */

import type { RacePrediction } from "../types";

interface RacePredictionsTableProps {
  predictions: RacePrediction[];
  inputDistanceName: string;
  compact?: boolean;
}

export function RacePredictionsTable({ predictions, inputDistanceName, compact }: RacePredictionsTableProps) {
  const maxTime = Math.max(...predictions.map((p) => p.timeSeconds));

  return (
    <div className={`bg-white rounded-2xl shadow-lg h-full ${compact ? "p-4" : "p-5 sm:p-8"}`}>
      <h2 className={`font-bold text-gray-900 ${compact ? "text-lg mb-0.5" : "text-xl sm:text-2xl mb-1"}`}>
        Race Equivalency
      </h2>
      <p className={`text-gray-500 ${compact ? "text-xs mb-3" : "text-sm mb-6"}`}>
        Predicted finish times across all distances
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className={`text-left font-semibold text-gray-700 ${compact ? "py-2 px-2 text-xs" : "py-3 px-4"}`}>Distance</th>
              <th className={`text-left font-semibold text-gray-700 ${compact ? "py-2 px-2 text-xs" : "py-3 px-4"}`}>Time</th>
              <th className={`text-right font-semibold text-gray-700 ${compact ? "py-2 px-2 text-xs" : "py-3 px-4"}`}>Pace</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((prediction) => {
              const isInput = prediction.name === inputDistanceName;
              const barWidth = (prediction.timeSeconds / maxTime) * 100;

              return (
                <tr
                  key={prediction.name}
                  className={`border-b border-gray-50 transition-colors hover:bg-gray-50 ${
                    isInput ? "bg-blue-50/70" : ""
                  }`}
                >
                  <td className={compact ? "py-1.5 px-2" : "py-3 px-4"}>
                    <div className="flex items-center gap-1.5">
                      {isInput && (
                        <span className="w-1 h-5 bg-blue-500 rounded-full shrink-0" />
                      )}
                      <span className={`font-medium ${compact ? "text-xs" : "text-sm"} ${isInput ? "text-blue-700" : "text-gray-900"}`}>
                        {prediction.name}
                      </span>
                      {isInput && !compact && (
                        <span className="text-[10px] font-semibold text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded">
                          YOUR RACE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={compact ? "py-1.5 px-2" : "py-3 px-4"}>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-semibold ${compact ? "text-xs min-w-[60px]" : "text-sm min-w-[80px]"} ${isInput ? "text-blue-700" : "text-gray-900"}`}>
                        {prediction.time}
                      </span>
                      {!compact && (
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isInput
                                ? "bg-gradient-to-r from-blue-400 to-blue-500"
                                : "bg-gradient-to-r from-gray-200 to-gray-300"
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={`text-right text-gray-500 font-mono ${compact ? "py-1.5 px-2 text-[11px]" : "py-3 px-4 text-xs"}`}>
                    {prediction.pace}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
