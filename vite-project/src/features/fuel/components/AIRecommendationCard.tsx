/**
 * AI Recommendation Card Component
 * Displays AI recommendations in flashcard or list view
 */

import { ChevronLeft, ChevronRight, Copy, Download, List, Layers } from "lucide-react";
import type { AIRecommendation } from "../types";

interface AIRecommendationCardProps {
  recommendations: AIRecommendation[];
  currentSlide: number;
  showAsList: boolean;
  onToggleView: () => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onCopy: () => void;
  onDownload: () => void;
}

export function AIRecommendationCard({
  recommendations,
  currentSlide,
  showAsList,
  onToggleView,
  onPrevSlide,
  onNextSlide,
  onCopy,
  onDownload,
}: AIRecommendationCardProps) {
  return (
    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-8 text-white relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>

      <div className="relative z-10">
        {/* Header with toggle and action buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleView}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              title={showAsList ? "Show as cards" : "Show as list"}
            >
              {showAsList ? (
                <Layers className="h-5 w-5" />
              ) : (
                <List className="h-5 w-5" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCopy}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              title="Copy recommendations"
            >
              <Copy className="h-5 w-5" />
            </button>
            <button
              onClick={onDownload}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              title="Download recommendations"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showAsList ? (
          // List View
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {recommendations.map((advice, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-2 text-base">
                      {advice.headline}
                    </p>
                    {advice.detail && (
                      <p className="text-sm text-white/90 leading-relaxed">
                        {advice.detail}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Flashcard View
          <>
            {/* Flashcard Content */}
            <div className="min-h-[200px] sm:min-h-[180px] flex flex-col justify-center px-4 sm:px-6">
              <p className="text-base sm:text-lg font-semibold text-center mb-3">
                {recommendations[currentSlide].headline}
              </p>

              {recommendations[currentSlide].detail && (
                <p className="text-sm sm:text-base leading-relaxed text-center text-white/90 mt-2">
                  {recommendations[currentSlide].detail}
                </p>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={onPrevSlide}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-30"
                disabled={recommendations.length <= 1}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex gap-1.5">
                {recommendations.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 w-1.5 rounded-full transition-all ${
                      idx === currentSlide
                        ? "bg-white scale-150"
                        : "bg-white/40"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={onNextSlide}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-30"
                disabled={recommendations.length <= 1}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
