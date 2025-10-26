/**
 * Enhanced Race Plan Card - Dashboard Display
 * 
 * Features:
 * - Visual status badges
 * - Expandable pace/fuel details
 * - Delete confirmation modal
 * - Race countdown (if date set)
 * - Quick stats grid
 */

import { useState } from 'react';
import { Target, MapPin, Clock, Calendar, Trash2, ChevronDown, ChevronUp, Flame, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RacePlan } from '../types';
import { useRacePlans } from '../hooks/useRacePlans';
import { formatTimeFromMinutes } from '../utils/paceCalculations';

interface RacePlanCardProps {
  plan: RacePlan;
}

export function RacePlanCard({ plan }: RacePlanCardProps) {
  const { deleteRacePlan } = useRacePlans();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return 'No date set';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getDaysUntilRace = (date: Date | null) => {
    if (!date) return null;
    const today = new Date();
    const raceDate = new Date(date);
    const diffTime = raceDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntil = getDaysUntilRace(plan.date);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'finalized':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteRacePlan(plan.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete race plan:', error);
      alert('Failed to delete race plan. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
        {/* Header */}
        <div className="p-5 pb-4 bg-gradient-to-br from-gray-50 to-white">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-gray-900 text-lg truncate">
                  {plan.name}
                </h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(plan.status)}`}>
                  {plan.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {plan.raceType} • {plan.routeMetadata.distance.toFixed(1)} km
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-gray-400 hover:text-red-500 transition-colors ml-2 p-2 rounded-full hover:bg-red-50"
              title="Delete race plan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Race Countdown */}
          {daysUntil !== null && daysUntil >= 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3">
              <p className="text-sm font-semibold text-blue-800">
                {daysUntil === 0 ? '🏃 Race Day!' : 
                 daysUntil === 1 ? '⏰ Tomorrow!' : 
                 `📅 ${daysUntil} days to go`}
              </p>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2 bg-white rounded-lg p-2 border border-gray-100">
              <Target className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Target</p>
                <p className="font-semibold text-gray-800">
                  {formatTimeFromMinutes(plan.targetTime)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-white rounded-lg p-2 border border-gray-100">
              <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Pace</p>
                <p className="font-semibold text-gray-800">
                  {plan.paceStrategy.racePace}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-white rounded-lg p-2 border border-gray-100">
              <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Gels</p>
                <p className="font-semibold text-gray-800">
                  {plan.fuelPlan.gelsNeeded}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-white rounded-lg p-2 border border-gray-100">
              <Calendar className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-semibold text-gray-800 truncate">
                  {plan.date ? new Date(plan.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Route Info */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {plan.routeMetadata.name}
              </p>
              {plan.routeMetadata.hasElevationData && (
                <div className="flex items-center gap-2 mt-1">
                  <Activity className="w-3 h-3 text-green-500" />
                  <p className="text-xs text-gray-600">
                    {plan.routeMetadata.elevationGain.toFixed(0)}m elevation
                  </p>
                </div>
              )}
              {plan.routeMetadata.city && (
                <p className="text-xs text-gray-500 mt-1">
                  {plan.routeMetadata.city}, {plan.routeMetadata.country}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        {expanded && (
          <div className="px-5 py-4 border-t border-gray-100 bg-white space-y-4">
            {/* Pace Strategy */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Pace Strategy
              </h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-600 mb-1">Race</p>
                  <p className="font-bold text-blue-700">
                    {plan.paceStrategy.racePace}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-600 mb-1">Easy</p>
                  <p className="font-bold text-green-700">
                    {plan.paceStrategy.easyPace}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-600 mb-1">Tempo</p>
                  <p className="font-bold text-orange-700">
                    {plan.paceStrategy.tempoPace}
                  </p>
                </div>
              </div>
            </div>

            {/* Fuel Summary */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Fuel Plan
              </h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-orange-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-600 mb-1">Carbs/hr</p>
                  <p className="font-bold text-orange-700">
                    {plan.fuelPlan.carbsPerHour}g
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-600 mb-1">Total</p>
                  <p className="font-bold text-orange-700">
                    {plan.fuelPlan.totalCarbs}g
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-600 mb-1">Stops</p>
                  <p className="font-bold text-orange-700">
                    {plan.fuelPlan.schedule.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {plan.notes && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Notes
                </h4>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100">
                  {plan.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex gap-2">
            <Link
              to={`/race/${plan.id}`}
              className="flex-1 text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow"
            >
              View Plan
            </Link>
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              title={expanded ? 'Show less' : 'Show more'}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Created timestamp (bottom) */}
        <div className="px-5 py-2 bg-gray-100 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Created {plan.createdAt.toDate().toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Race Plan?</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>"{plan.name}"</strong>? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Plan'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
