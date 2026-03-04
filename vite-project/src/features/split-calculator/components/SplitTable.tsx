/**
 * SplitTable - Displays the split breakdown in a clean table
 */

import type { SplitResults } from "../types";
import { STRATEGY_INFO } from "../types";

interface SplitTableProps {
  results: SplitResults;
}

export function SplitTable({ results }: SplitTableProps) {
  const strategyInfo = STRATEGY_INFO[results.strategy];

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-gray-500">Total Time</p>
          <p className="text-xl font-bold text-blue-700">{results.totalTime}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <p className="text-sm text-gray-500">Avg Pace</p>
          <p className="text-xl font-bold text-purple-700">
            {results.averagePace}
          </p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm text-gray-500">Strategy</p>
          <p className="text-xl font-bold text-green-700">
            {strategyInfo.label}
          </p>
        </div>
      </div>

      {/* Split Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-700">
                Split
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">
                Distance
              </th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">
                Split Time
              </th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">
                Pace
              </th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">
                Elapsed
              </th>
            </tr>
          </thead>
          <tbody>
            {results.splits.map((row) => (
              <tr
                key={row.split}
                className={`border-b border-gray-100 ${
                  row.isPartial ? "bg-yellow-50" : "hover:bg-gray-50"
                }`}
              >
                <td className="px-4 py-3 font-medium text-gray-900">
                  {row.split}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {row.distanceLabel}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-900">
                  {row.splitTime}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-600">
                  {row.splitPace}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-blue-700">
                  {row.cumulativeTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Partial Split Note */}
      {results.splits.some((s) => s.isPartial) && (
        <p className="text-xs text-gray-500 italic">
          * Final split is a partial distance. Pace shown is per full{" "}
          {results.units === "km" ? "kilometer" : "mile"}.
        </p>
      )}
    </div>
  );
}
