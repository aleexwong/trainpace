/**
 * Simple Race Plan Card - Test Component
 * 
 * Minimal UI to verify database integration works
 */

import { Target, MapPin, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RacePlan } from '../types';

interface RacePlanCardProps {
  plan: RacePlan;
}

export function RacePlanCard({ plan }: RacePlanCardProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'No date set';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-1">{plan.name}</h3>
          <p className="text-sm text-gray-500">
            {plan.raceType} • {plan.status}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs rounded ${
          plan.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
          plan.status === 'finalized' ? 'bg-green-100 text-green-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {plan.status}
        </span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="text-gray-600 truncate">
            {plan.routeMetadata.distance.toFixed(1)} km
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span className="text-gray-600 truncate">
            {formatTime(plan.targetTime)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-purple-500 flex-shrink-0" />
          <span className="text-gray-600 truncate">
            {plan.paceStrategy.racePace}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-500 text-xs truncate">
            {formatDate(plan.date)}
          </span>
        </div>
      </div>

      {/* Route Info */}
      <div className="bg-blue-50 rounded-lg p-2 mb-3">
        <p className="text-xs text-gray-600 mb-1">Route</p>
        <p className="text-sm font-medium text-gray-800">
          {plan.routeMetadata.name}
        </p>
        {plan.routeMetadata.city && (
          <p className="text-xs text-gray-500">
            {plan.routeMetadata.city}, {plan.routeMetadata.country}
          </p>
        )}
      </div>

      {/* Action Button */}
      <Link
        to={`/race/${plan.id}/edit`}
        className="block w-full text-center bg-blue-500 text-white py-2 px-3 rounded-md text-sm hover:bg-blue-600 transition-colors"
      >
        View / Edit
      </Link>
    </div>
  );
}
