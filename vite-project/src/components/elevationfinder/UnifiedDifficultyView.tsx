import { useState, useMemo, useEffect } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartEvent,
  ActiveElement,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
} from "lucide-react";
import { Segment, ChallengeRating } from "@/types/elevation";
import {
  clusterSegments,
  formatTime,
  formatPace,
  formatDistanceRange,
  formatPercentage,
  formatElevation,
  computeTotalTime,
  computeDifficultyWeight,
  computeWeightedMultiplier,
} from "@/utils/difficulty";
import type { DifficultyGroupData } from "@/utils/difficulty";

ChartJS.register(ArcElement, Tooltip, Legend);

interface UnifiedDifficultyViewProps {
  segments: Segment[];
  basePaceMinPerKm: number;
  totalRaceTime?: number; // Optional: will compute from segments if not provided
  clusterThreshold?: number;
  adjacencyEpsilonKm?: number;
  units?: "metric" | "imperial";
  locale?: string;
}

const DIFFICULTY_COLORS: Record<ChallengeRating, string> = {
  brutal: "#dc2626",
  hard: "#ea580c",
  moderate: "#eab308",
  easy: "#16a34a",
};

const DIFFICULTY_LABELS: Record<ChallengeRating, string> = {
  brutal: "Brutal",
  hard: "Hard",
  moderate: "Moderate",
  easy: "Easy",
};

const DIFFICULTY_CONFIG: Record<
  ChallengeRating,
  {
    label: string;
    order: number;
    color: {
      bg: string;
      text: string;
      accent: string;
      header: string;
    };
  }
> = {
  brutal: {
    label: "Brutal Climbs",
    order: 0,
    color: {
      bg: "bg-red-50",
      text: "text-red-900",
      accent: "text-red-600",
      header: "bg-red-100 border-red-200",
    },
  },
  hard: {
    label: "Hard Climbs",
    order: 1,
    color: {
      bg: "bg-orange-50",
      text: "text-orange-900",
      accent: "text-orange-600",
      header: "bg-orange-100 border-orange-200",
    },
  },
  moderate: {
    label: "Moderate Sections",
    order: 2,
    color: {
      bg: "bg-yellow-50",
      text: "text-yellow-900",
      accent: "text-yellow-600",
      header: "bg-yellow-100 border-yellow-200",
    },
  },
  easy: {
    label: "Easy / Flat Sections",
    order: 3,
    color: {
      bg: "bg-green-50",
      text: "text-green-900",
      accent: "text-green-600",
      header: "bg-green-100 border-green-200",
    },
  },
};

const getChallengeIcon = (rating: ChallengeRating) => {
  switch (rating) {
    case "easy":
      return <span className="text-lg">😊</span>;
    case "moderate":
      return <span className="text-lg">😐</span>;
    case "hard":
      return <span className="text-lg">😰</span>;
    case "brutal":
      return <span className="text-lg">💀</span>;
  }
};

const getSegmentIcon = (type: Segment["type"]) => {
  switch (type) {
    case "uphill":
      return <TrendingUp className="w-4 h-4" />;
    case "downhill":
      return <TrendingDown className="w-4 h-4" />;
    case "flat":
      return <Minus className="w-4 h-4" />;
  }
};

export function UnifiedDifficultyView({
  segments,
  basePaceMinPerKm,
  totalRaceTime: providedTotalRaceTime,
  clusterThreshold = 1.5,
  adjacencyEpsilonKm = 0.01,
  units = "metric",
  locale = "en-US",
}: UnifiedDifficultyViewProps) {
  const [expandedGroup, setExpandedGroup] = useState<ChallengeRating | null>(
    null
  );
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  // Reset state when segments or threshold changes
  useEffect(() => {
    setExpandedGroup(null);
    setExpandedCluster(null);
  }, [segments, clusterThreshold]);

  // Compute total race time from segments if not provided
  const computedTotalTime = useMemo(
    () => computeTotalTime(segments, basePaceMinPerKm),
    [segments, basePaceMinPerKm]
  );

  const totalRaceTime = providedTotalRaceTime ?? computedTotalTime;

  // Prepare grouped data for both chart and accordion
  const groupedData = useMemo(() => {
    const groups: Record<ChallengeRating, Segment[]> = {
      brutal: [],
      hard: [],
      moderate: [],
      easy: [],
    };

    segments.forEach((seg) => {
      groups[seg.challengeRating].push(seg);
    });

    // Compute difficulty weight as positive overhead beyond base pace
    const totalDifficultyWeight = computeDifficultyWeight(
      segments,
      basePaceMinPerKm
    );

    return Object.entries(groups)
      .filter(([_, segs]) => segs.length > 0)
      .map(([rating, segs]) => {
        const config = DIFFICULTY_CONFIG[rating as ChallengeRating];

        // Cluster segments WITHOUT mutating original array
        const clustered = clusterSegments(segs, {
          gradeThreshold: clusterThreshold,
          adjacencyEpsilonKm,
        });

        // Compute average pace for each cluster
        clustered.forEach((cluster) => {
          const weightedMultiplier = computeWeightedMultiplier(cluster);
          cluster.avgPace = formatPace(weightedMultiplier, basePaceMinPerKm, {
            units,
            locale,
          });
        });

        const totalTime = clustered.reduce((sum, cluster) => {
          return sum + computeTotalTime(cluster.segments, basePaceMinPerKm);
        }, 0);

        // CORRECT: Sum elevation gain across clusters (already computed correctly in buildCluster)
        const totalElevationGain = clustered.reduce(
          (sum, cluster) => sum + cluster.elevationGain,
          0
        );

        const percentOfTotalTime = (totalTime / totalRaceTime) * 100;

        // Group difficulty share based on positive overhead only
        const groupDifficultyWeight = computeDifficultyWeight(
          clustered.flatMap((c) => c.segments),
          basePaceMinPerKm
        );

        const percentOfTotalDifficulty =
          totalDifficultyWeight > 0
            ? (groupDifficultyWeight / totalDifficultyWeight) * 100
            : 0;

        return {
          rating: rating as ChallengeRating,
          clusters: clustered,
          totalTime,
          totalElevationGain,
          percentOfTotalTime,
          percentOfTotalDifficulty,
          label: config.label,
          color: config.color,
        } as DifficultyGroupData;
      })
      .sort(
        (a, b) =>
          DIFFICULTY_CONFIG[a.rating].order - DIFFICULTY_CONFIG[b.rating].order
      );
  }, [
    segments,
    basePaceMinPerKm,
    totalRaceTime,
    clusterThreshold,
    adjacencyEpsilonKm,
    units,
    locale,
  ]);

  // Chart data
  const chartData = useMemo(() => {
    return groupedData.map((group) => ({
      name: DIFFICULTY_LABELS[group.rating],
      value: group.percentOfTotalTime,
      time: formatTime(group.totalTime),
      percentage: formatPercentage(group.percentOfTotalTime, 1, locale),
      difficulty: group.rating,
      segmentCount: group.clusters.length,
    }));
  }, [groupedData, locale]);

  const chart = useMemo(() => {
    return {
      labels: chartData.map((d) => d.name),
      datasets: [
        {
          label: "Race Time Distribution",
          data: chartData.map((d) => d.value),
          backgroundColor: chartData.map(
            (d) => DIFFICULTY_COLORS[d.difficulty]
          ),
          borderColor: "#ffffff",
          borderWidth: 2,
          hoverOffset: 10,
        },
      ],
    };
  }, [chartData]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
      plugins: {
        legend: {
          position: "bottom" as const,
          align: "center" as const,
          labels: {
            font: { size: 11 },
            padding: 12,
            usePointStyle: true,
            boxWidth: 12,
            boxHeight: 12,
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          padding: 14,
          cornerRadius: 8,
          titleFont: { size: 14, weight: "bold" as const },
          bodyFont: { size: 13 },
          bodySpacing: 6,
          callbacks: {
            title: (ctx: any) => {
              const idx = ctx[0]?.dataIndex;
              return chartData[idx]?.name || "";
            },
            label: (ctx: any) => {
              const idx = ctx?.dataIndex;
              const data = chartData[idx];
              return [
                `${data?.segmentCount} section${
                  data?.segmentCount !== 1 ? "s" : ""
                }`,
                `Time: ${data?.time}`,
                `${data?.percentage} of race`,
              ];
            },
            footer: () => {
              return "Click to expand details";
            },
          },
        },
      },
      onClick: (_event: ChartEvent, activeElements: ActiveElement[]) => {
        if (activeElements && activeElements.length > 0) {
          const idx = activeElements[0].index;
          const difficulty = chartData[idx]?.difficulty;
          if (difficulty) {
            setExpandedGroup(expandedGroup === difficulty ? null : difficulty);
            setExpandedCluster(null);
            // Scroll to accordion section
            setTimeout(() => {
              const element = document.getElementById(`difficulty-group-${difficulty}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 100);
          }
        }
      },
    }),
    [chartData, expandedGroup]
  );

  if (groupedData.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No segments to display
      </div>
    );
  }

  // Compute summary for screen readers
  const totalSections = groupedData.reduce(
    (sum, g) => sum + g.clusters.length,
    0
  );
  const totalElevationGain = groupedData.reduce(
    (sum, g) => sum + g.totalElevationGain,
    0
  );

  return (
    <div className="space-y-6">
      {/* Screen reader summary */}
      <div className="sr-only">
        Race difficulty analysis: {totalSections} total sections across{" "}
        {groupedData.length} difficulty levels. Total elevation gain:{" "}
        {formatElevation(totalElevationGain, { units, locale })}. Total race
        time: {formatTime(totalRaceTime)}.
      </div>

      {/* Donut Chart Section */}
      <div className="w-full bg-white rounded-lg border border-gray-200 py-4 sm:py-6">
        <div className="text-center mb-4">
          <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-1 sm:mb-2">
            Race Difficulty Distribution
          </h3>
          <p className="text-xs sm:text-sm text-gray-600">
            Click a chart segment to jump to details
          </p>
        </div>

        <div className="w-full mb-6 flex justify-center">
          <div className="w-full max-w-sm" style={{ maxHeight: '400px' }}>
            <Doughnut data={chart} options={options} />
          </div>
        </div>

        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Race Time</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {formatTime(totalRaceTime)}
          </p>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-3 overflow-hidden px-4">
        {groupedData.map((group) => {
          const isExpanded = expandedGroup === group.rating;
          const groupId = `difficulty-group-${group.rating}`;
          const contentId = `${groupId}-content`;

          return (
            <div
              key={group.rating}
              id={`difficulty-group-${group.rating}`}
              className={`rounded-lg border ${group.color.bg} transition-all ${
                isExpanded ? "shadow-lg ring-2 ring-blue-400" : "shadow-sm"
              }`}
            >
              <button
                onClick={() => {
                  setExpandedGroup(isExpanded ? null : group.rating);
                  setExpandedCluster(null);
                }}
                className={`w-full px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 ${
                  group.color.header
                }font-semibold transition-colors ${
                  isExpanded ? "opacity-100" : "opacity-80"
                } hover:opacity-90`}
                aria-expanded={isExpanded}
                aria-controls={contentId}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      isExpanded ? "rotate-0" : "-rotate-90"
                    }`}
                    aria-hidden="true"
                  />
                  <span className={`${group.color.text} truncate`}>{group.label}</span>
                  <span className={`text-xs sm:text-sm ${group.color.accent} whitespace-nowrap`}>
                    ({group.clusters.length})
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end sm:space-x-4 text-sm w-full sm:w-auto">
                  <div className={`text-left sm:text-right ${group.color.accent}`}>
                    <div className="font-bold text-sm sm:text-base">
                      {formatTime(group.totalTime)}
                    </div>
                    <div className="text-xs opacity-75">
                      {formatPercentage(group.percentOfTotalTime, 0, locale)} of
                      race
                    </div>
                  </div>
                  <div className={`text-right ${group.color.accent}`}>
                    <div className="font-bold text-sm sm:text-base">
                      +
                      {formatElevation(group.totalElevationGain, {
                        units,
                        locale,
                      })}
                    </div>
                    <div className="text-xs opacity-75">elevation</div>
                  </div>
                  <div className="shrink-0">
                    {getChallengeIcon(group.rating)}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div id={contentId} className="divide-y">
                  <div className={`p-4 ${group.color.bg}`}>
                    <div className="flex items-start space-x-2 mb-2">
                      <AlertCircle
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${group.color.accent}`}
                      />
                      <div className="text-sm space-y-1">
                        <p className={`font-medium ${group.color.text}`}>
                          This accounts for{" "}
                          {formatPercentage(
                            group.percentOfTotalDifficulty,
                            0,
                            locale
                          )}{" "}
                          of your race difficulty.
                        </p>
                      </div>
                    </div>
                  </div>

                  {group.clusters.map((cluster, idx) => {
                    const clusterId = `${group.rating}-cluster-${idx}`;
                    const isClusterExpanded = expandedCluster === clusterId;
                    const clusterContentId = `${clusterId}-content`;

                    return (
                      <div
                        key={idx}
                        className={`border-b last:border-b-0 transition-colors ${
                          isClusterExpanded
                            ? `${group.color.bg} border-l-4 ${group.color.accent}`
                            : ""
                        }`}
                      >
                        <button
                          onClick={() =>
                            setExpandedCluster(
                              isClusterExpanded ? null : clusterId
                            )
                          }
                          className="w-full p-3 sm:p-4 bg-white hover:bg-opacity-75 transition-colors text-left"
                          aria-expanded={isClusterExpanded}
                          aria-controls={clusterContentId}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              {getSegmentIcon(cluster.segments[0].type)}
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`font-medium ${group.color.text} text-sm sm:text-base truncate`}
                                >
                                  {formatDistanceRange(
                                    cluster.startDistance,
                                    cluster.endDistance,
                                    { units, locale }
                                  )}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {cluster.clusterLength.toFixed(1)}{" "}
                                  {units === "imperial" ? "mi" : "km"} • Avg {cluster.avgGrade.toFixed(1)}%
                                </p>
                              </div>
                            </div>

                            <div className="text-left sm:text-right shrink-0 space-y-1 pl-6 sm:pl-0">
                              <p className={`font-bold ${group.color.accent} text-sm sm:text-base`}>
                                {cluster.avgPace}
                              </p>
                              <p className="text-xs text-gray-600">
                                {formatTime(
                                  computeTotalTime(
                                    cluster.segments,
                                    basePaceMinPerKm
                                  )
                                )}
                              </p>
                            </div>
                          </div>
                        </button>

                        {isClusterExpanded && (
                          <div
                            id={clusterContentId}
                            className="px-4 pb-4 space-y-3 bg-white/50"
                          >
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                Elevation:{" "}
                                {formatElevation(cluster.startElevation, {
                                  units,
                                  locale,
                                })}
                                {" → "}
                                {formatElevation(cluster.endElevation, {
                                  units,
                                  locale,
                                })}
                              </span>
                              <span className="font-medium text-gray-700">
                                {cluster.elevationGain > 0 ? "+" : ""}
                                {formatElevation(cluster.elevationGain, {
                                  units,
                                  locale,
                                })}
                              </span>
                            </div>

                            <div className="text-sm space-y-2">
                              <p className={`font-medium ${group.color.text}`}>
                                Individual{" "}
                                {units === "imperial" ? "mile" : "km"}{" "}
                                breakdown:
                              </p>
                              <div className="space-y-1 pl-2 border-l border-gray-300">
                                {cluster.segments.map((seg, sidx) => (
                                  <div
                                    key={sidx}
                                    className="text-xs text-gray-700"
                                  >
                                    <span className="font-medium">
                                      {units === "imperial" ? "MI" : "KM"}{" "}
                                      {seg.startDistance.toFixed(1)}
                                    </span>
                                    :{" "}
                                    {formatPace(
                                      seg.estimatedTimeMultiplier,
                                      basePaceMinPerKm,
                                      { units, locale }
                                    )}{" "}
                                    • {seg.grade.toFixed(1)}%
                                  </div>
                                ))}
                              </div>
                            </div>

                            {cluster.segments[0].pacingAdvice && (
                              <div className="p-3 bg-white rounded text-sm">
                                <p className="font-medium text-gray-800 mb-1">
                                  💡 Strategy
                                </p>
                                <p className="text-gray-700">
                                  {cluster.segments[0].pacingAdvice}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default UnifiedDifficultyView;
