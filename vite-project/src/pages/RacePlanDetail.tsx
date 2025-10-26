/**
 * Race Plan Detail - Read-Only View
 * 
 * Complete race plan visualization with:
 * - Full pace strategy breakdown
 * - Detailed fuel schedule timeline
 * - Route information and elevation
 * - Export options (copy, download)
 * - Edit/Delete actions
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Target, MapPin, Clock, Calendar, Edit, Trash2, Copy, Download, 
  ChevronLeft, Activity, Flame, TrendingUp, Info, CheckCircle, AlertCircle
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/features/auth/AuthContext';
import { useRacePlans } from '@/features/race/hooks/useRacePlans';
import type { RacePlan } from '@/features/race/types';
import { formatTimeFromMinutes } from '@/features/race/utils/paceCalculations';

export default function RacePlanDetail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const { racePlans, deleteRacePlan } = useRacePlans();

  const [plan, setPlan] = useState<RacePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !id) return;

    // Try to find in existing plans first
    const existing = racePlans.find(p => p.id === id);
    if (existing) {
      setPlan(existing);
      setLoading(false);
      return;
    }

    // Fallback: fetch from Firestore
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'user_race_plans', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error('Race plan not found');
        }

        const data = docSnap.data();
        const racePlan: RacePlan = {
          id: docSnap.id,
          ...(data as any),
          date: data.date?.toDate ? data.date.toDate() : data.date ?? null,
        };

        setPlan(racePlan);
      } catch (err) {
        console.error('Error loading race plan:', err);
        setError(err instanceof Error ? err.message : 'Failed to load race plan');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [id, user, racePlans]);

  const formatDate = (date: Date | null) => {
    if (!date) return 'No date set';
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
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

  const handleCopy = async () => {
    if (!plan) return;

    let text = `Race Plan: ${plan.name}\n\n`;
    text += `Race Type: ${plan.raceType}\n`;
    text += `Distance: ${plan.routeMetadata.distance.toFixed(1)} km\n`;
    text += `Target Time: ${formatTimeFromMinutes(plan.targetTime)}\n`;
    if (plan.date) text += `Date: ${formatDate(plan.date)}\n`;
    text += `\n--- Pace Strategy ---\n`;
    text += `Race Pace: ${plan.paceStrategy.racePace}\n`;
    text += `Easy Pace: ${plan.paceStrategy.easyPace}\n`;
    text += `Tempo Pace: ${plan.paceStrategy.tempoPace}\n`;
    text += `\n--- Fuel Plan ---\n`;
    text += `Carbs per Hour: ${plan.fuelPlan.carbsPerHour}g\n`;
    text += `Total Carbs: ${plan.fuelPlan.totalCarbs}g\n`;
    text += `Gels Needed: ${plan.fuelPlan.gelsNeeded}\n`;
    
    if (plan.fuelPlan.schedule.length > 0) {
      text += `\nFuel Schedule:\n`;
      plan.fuelPlan.schedule.forEach(item => {
        text += `\nkm ${item.km} (${item.time})\n`;
        text += `  ${item.action}\n`;
        if (item.note) text += `  💡 ${item.note}\n`;
      });
    }

    if (plan.notes) {
      text += `\n--- Notes ---\n${plan.notes}\n`;
    }

    try {
      await navigator.clipboard.writeText(text);
      alert('Race plan copied to clipboard!');
    } catch {
      alert('Failed to copy race plan.');
    }
  };

  const handleDownload = () => {
    if (!plan) return;

    let text = `Race Plan: ${plan.name}\n\n`;
    text += `Race Type: ${plan.raceType}\n`;
    text += `Distance: ${plan.routeMetadata.distance.toFixed(1)} km\n`;
    text += `Target Time: ${formatTimeFromMinutes(plan.targetTime)}\n`;
    if (plan.date) text += `Date: ${formatDate(plan.date)}\n`;
    text += `\n--- Pace Strategy ---\n`;
    text += `Race Pace: ${plan.paceStrategy.racePace}\n`;
    text += `Easy Pace: ${plan.paceStrategy.easyPace}\n`;
    text += `Tempo Pace: ${plan.paceStrategy.tempoPace}\n`;
    text += `\n--- Fuel Plan ---\n`;
    text += `Carbs per Hour: ${plan.fuelPlan.carbsPerHour}g\n`;
    text += `Total Carbs: ${plan.fuelPlan.totalCarbs}g\n`;
    text += `Gels Needed: ${plan.fuelPlan.gelsNeeded}\n`;
    
    if (plan.fuelPlan.schedule.length > 0) {
      text += `\nFuel Schedule:\n`;
      plan.fuelPlan.schedule.forEach(item => {
        text += `\nkm ${item.km} (${item.time})\n`;
        text += `  ${item.action}\n`;
        if (item.note) text += `  💡 ${item.note}\n`;
      });
    }

    if (plan.notes) {
      text += `\n--- Notes ---\n${plan.notes}\n`;
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `race-plan-${plan.name.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!plan) return;

    try {
      setDeleting(true);
      await deleteRacePlan(plan.id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete race plan:', error);
      alert('Failed to delete race plan. Please try again.');
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-8">Please sign in to view race plans.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 font-medium transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading race plan...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Plan Not Found</h2>
          <p className="text-gray-600 mb-8">{error || 'This race plan does not exist.'}</p>
          <Link
            to="/dashboard"
            className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 font-medium transition-colors inline-block"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const daysUntil = getDaysUntilRace(plan.date);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <Helmet>
        <title>{plan.name} | Race Plan | TrainPace</title>
      </Helmet>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{plan.name}</h1>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(plan.status)}`}>
                  {plan.status}
                </span>
              </div>
              <p className="text-gray-600">
                {plan.raceType} • {plan.routeMetadata.distance.toFixed(1)} km
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <Link
                to={`/race/${plan.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Race Countdown Banner */}
        {daysUntil !== null && daysUntil >= 0 && (
          <div className={`rounded-xl p-6 mb-6 ${
            daysUntil === 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
            daysUntil <= 7 ? 'bg-gradient-to-r from-orange-500 to-red-600' :
            'bg-gradient-to-r from-blue-500 to-indigo-600'
          }`}>
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-sm font-medium opacity-90 mb-1">
                  {daysUntil === 0 ? 'IT\'S RACE DAY!' : 
                   daysUntil === 1 ? 'RACE TOMORROW' : 
                   'DAYS UNTIL RACE'}
                </p>
                <p className="text-4xl font-bold">
                  {daysUntil === 0 ? 'Good luck! 🏃' : 
                   daysUntil === 1 ? '1 day' : 
                   `${daysUntil} days`}
                </p>
              </div>
              <Calendar className="w-16 h-16 opacity-50" />
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-green-500" />
              <p className="text-sm font-medium text-gray-600">Target Time</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatTimeFromMinutes(plan.targetTime)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <p className="text-sm font-medium text-gray-600">Race Pace</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {plan.paceStrategy.racePace}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <p className="text-sm font-medium text-gray-600">Gels Needed</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {plan.fuelPlan.gelsNeeded}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <p className="text-sm font-medium text-gray-600">Race Date</p>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {plan.date ? new Date(plan.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
            </p>
          </div>
        </div>

        {/* Route Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Route Information</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Route Name</span>
              <span className="font-semibold text-gray-900">{plan.routeMetadata.name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Distance</span>
              <span className="font-semibold text-gray-900">{plan.routeMetadata.distance.toFixed(2)} km</span>
            </div>
            {plan.routeMetadata.hasElevationData && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  Elevation Gain
                </span>
                <span className="font-semibold text-gray-900">{plan.routeMetadata.elevationGain.toFixed(0)} m</span>
              </div>
            )}
            {plan.routeMetadata.city && (
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Location</span>
                <span className="font-semibold text-gray-900">
                  {plan.routeMetadata.city}, {plan.routeMetadata.country}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Pace Strategy */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Pace Strategy</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
              <p className="text-sm font-medium text-blue-700 mb-2">Race Pace</p>
              <p className="text-3xl font-bold text-blue-900 mb-1">
                {plan.paceStrategy.racePace}
              </p>
              <p className="text-xs text-blue-600">Your target race pace</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
              <p className="text-sm font-medium text-green-700 mb-2">Easy Pace</p>
              <p className="text-3xl font-bold text-green-900 mb-1">
                {plan.paceStrategy.easyPace}
              </p>
              <p className="text-xs text-green-600">Training and recovery runs</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200">
              <p className="text-sm font-medium text-orange-700 mb-2">Tempo Pace</p>
              <p className="text-3xl font-bold text-orange-900 mb-1">
                {plan.paceStrategy.tempoPace}
              </p>
              <p className="text-xs text-orange-600">Threshold workouts</p>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Pacing Tips</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Start conservatively - aim for negative splits</li>
                  <li>• Use easy pace for warm-up and cool-down</li>
                  <li>• Tempo pace is for sustained efforts during training</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Fuel Plan */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">Fuel Plan</h2>
          </div>

          {/* Fuel Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <p className="text-sm text-orange-700 mb-1">Carbs per Hour</p>
              <p className="text-2xl font-bold text-orange-900">
                {plan.fuelPlan.carbsPerHour}g
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <p className="text-sm text-orange-700 mb-1">Total Carbs</p>
              <p className="text-2xl font-bold text-orange-900">
                {plan.fuelPlan.totalCarbs}g
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <p className="text-sm text-orange-700 mb-1">Total Calories</p>
              <p className="text-2xl font-bold text-orange-900">
                {plan.fuelPlan.totalCalories}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <p className="text-sm text-orange-700 mb-1">Gels Needed</p>
              <p className="text-2xl font-bold text-orange-900">
                {plan.fuelPlan.gelsNeeded}
              </p>
            </div>
          </div>

          {/* Fuel Schedule */}
          {plan.fuelPlan.schedule.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Fuel Schedule</h3>
              <div className="space-y-3">
                {plan.fuelPlan.schedule.map((item, idx) => (
                  <div 
                    key={idx}
                    className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border-l-4 border-orange-400"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded">
                          km {item.km}
                        </span>
                        <span className="text-sm font-medium text-gray-600">
                          {item.time}
                        </span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">{item.action}</p>
                    {item.note && (
                      <p className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-orange-500">💡</span>
                        {item.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-900 mb-1">Fueling Tips</p>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Practice your fueling strategy in training</li>
                  <li>• Take fuel before you feel you need it</li>
                  <li>• Always consume with water to aid absorption</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {plan.notes && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notes</h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {plan.notes}
            </p>
          </div>
        )}

        {/* Metadata Footer */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
            <span>
              Created {plan.createdAt.toDate().toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
            <span>
              Last updated {plan.updatedAt.toDate().toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Race Plan?</h3>
            </div>
            
            <p className="text-gray-600 mb-8">
              Are you sure you want to delete <strong>"{plan.name}"</strong>? This action cannot be undone and all pace and fuel recommendations will be lost.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Plan'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
