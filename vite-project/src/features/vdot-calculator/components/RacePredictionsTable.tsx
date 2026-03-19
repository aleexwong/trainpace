/**
 * RacePredictionsTable — Enhanced race predictions with visual bars and mobile cards
 */

import type { RacePrediction } from "../types";

interface RacePredictionsTableProps {
  predictions: RacePrediction[];
  inputDistanceName: string;
}

export function RacePredictionsTable({ predictions, inputDistanceName }: RacePredictionsTableProps) {
  // Find max time for relative bar width
  const maxTime = Math.max(...predictions.map((p) => p.timeSeconds));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
        Race Equivalency
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Predicted finish times across all standard distances
      </p>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-36">Distance</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700 w-28">Pace</th>
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
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {isInput && (
                        <span className="w-1.5 h-6 bg-blue-500 rounded-full shrink-0" />
                      )}
                      <span className={`font-medium ${isInput ? "text-blue-700" : "text-gray-900"}`}>
                        {prediction.name}
                      </span>
                      {isInput && (
                        <span className="text-[10px] font-semibold text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded">
                          YOUR RACE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-semibold min-w-[80px] ${isInput ? "text-blue-700" : "text-gray-900"}`}>
                        {prediction.time}
                      </span>
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
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-500 font-mono text-xs">
                    {prediction.pace}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="sm:hidden space-y-2">
        {predictions.map((prediction) => {
          const isInput = prediction.name === inputDistanceName;
          const barWidth = (prediction.timeSeconds / maxTime) * 100;

          return (
            <div
              key={prediction.name}
              className={`p-3 rounded-xl border-2 transition-all ${
                isInput
                  ? "border-blue-200 bg-blue-50/50"
                  : "border-gray-100 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isInput ? "text-blue-700" : "text-gray-900"}`}>
                    {prediction.name}
                  </span>
                  {isInput && (
                    <span className="text-[9px] font-bold text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded">
                      YOUR RACE
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 font-mono">{prediction.pace}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-base font-bold font-mono ${isInput ? "text-blue-700" : "text-gray-800"}`}>
                  {prediction.time}
                </span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isInput ? "bg-blue-400" : "bg-gray-200"
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
