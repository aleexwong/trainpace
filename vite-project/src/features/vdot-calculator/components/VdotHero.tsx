/**
 * VdotHero — Premium gradient header with breadcrumbs and VDOT explainer
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Activity } from "lucide-react";

export function VdotHero() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 sm:p-10 mb-8">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

      <div className="relative z-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-blue-200 mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-1">
            <li>
              <Link to="/" className="hover:text-white transition-colors">
                Home
              </Link>
            </li>
            <li><span className="mx-1">/</span></li>
            <li>
              <Link to="/calculator" className="hover:text-white transition-colors">
                Pace Calculator
              </Link>
            </li>
            <li><span className="mx-1">/</span></li>
            <li className="text-white font-medium">VDOT Calculator</li>
          </ol>
        </nav>

        {/* Title */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            VDOT Running Calculator
          </h1>
        </div>

        <p className="text-blue-100 text-base sm:text-lg max-w-2xl mb-4">
          Calculate your VDOT score from any race result using Jack Daniels&apos; proven formula.
          Get personalized training paces and race predictions across all distances.
        </p>

        {/* What is VDOT expandable */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 transition-all"
        >
          What is VDOT?
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${showInfo ? "rotate-180" : ""}`}
          />
        </button>

        {showInfo && (
          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-5 text-white/90 text-sm leading-relaxed max-w-2xl">
            <p className="mb-3">
              VDOT is a measure of your current running fitness developed by legendary coach
              Jack Daniels. It represents your effective VO&#8322;max — how much oxygen your body
              can use while running.
            </p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mt-1.5 shrink-0" />
                Enter any recent race result to get your VDOT score
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mt-1.5 shrink-0" />
                Get equivalent race time predictions from 800m to the marathon
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mt-1.5 shrink-0" />
                Receive science-based paces for 5 Daniels training zones
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mt-1.5 shrink-0" />
                Easy, Marathon, Threshold, Interval, and Repetition paces
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
