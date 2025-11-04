// src/pages/Dashboard.tsx (updated for route keys)
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../features/auth/AuthContext";
import {
  MapPin,
  Activity,
  Calendar,
  Trash2,
  Eye,
  Bookmark,
  AlertTriangle,
  Flame,
  Copy,
  ChevronDown,
  ChevronUp,
  Edit,
} from "lucide-react";
import MapboxRoutePreview from "../components/utils/MapboxRoutePreview";
import { EditPlanDialog } from "../components/EditPlanDialog";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useToast } from "../hooks/use-toast";

interface RouteMetadata {
  id: string;
  type: "uploaded" | "bookmarked";
  filename?: string;
  safeFilename?: string;
  routeSlug?: string; // For bookmarked routes (legacy)
  routeKey?: string; // For bookmarked routes (new)
  routeName?: string; // For bookmarked routes
  uploadedAt?: any;
  savedAt?: any; // For bookmarked routes
  schemaVersion?: number; // For migration tracking
  metadata: {
    routeName: string;
    totalDistance: number;
    elevationGain: number;
    pointCount: number;
    bounds?: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    };
  };
  thumbnailPoints: Array<{
    lat: number;
    lng: number;
    ele: number;
    dist?: number;
  }>;
  displayUrl: string;
  fileUrl?: string;
  previewData?: any; // For bookmarked routes
}

interface FuelPlan {
  id: string;
  userId: string;
  raceType: "10K" | "Half" | "Full";
  weight?: number;
  finishTime: number;
  carbsPerHour: number;
  totalCarbs: number;
  totalCalories: number;
  gelsNeeded: number;
  userContext?: string;
  selectedPresets?: string[];
  aiRecommendations?: Array<{
    headline: string;
    detail: string;
  }>;
  helpful?: boolean;
  createdAt: Timestamp;
}

interface PacePlan {
  id: string;
  userId: string;
  distance: number;
  units: "km" | "miles";
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  paceType: "km" | "Miles";
  planName?: string;
  notes?: string;
  raceDate?: string;
  paces: {
    race: string;
    easy: string;
    tempo: string;
    interval: string;
    maximum: string;
    speed: string;
    xlong: string;
    yasso: string;
  };
  createdAt: Timestamp;
}

export default function Dashboard() {
  const [routes, setRoutes] = useState<RouteMetadata[]>([]);
  const [fuelPlans, setFuelPlans] = useState<FuelPlan[]>([]);
  const [pacePlans, setPacePlans] = useState<PacePlan[]>([]);
  const [activeTab, setActiveTab] = useState<"routes" | "fuel-plans" | "pace-plans">("routes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<PacePlan | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserRoutes();
      loadUserFuelPlans();
      loadUserPacePlans();
    }
  }, [user]);

  const loadUserRoutes = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load uploaded GPX files
      const routesQuery = query(
        collection(db, "gpx_uploads"),
        where("userId", "==", user.uid),
        where("deleted", "==", false),
        orderBy("uploadedAt", "desc")
      );

      // Load bookmarked preview routes
      const bookmarksQuery = query(
        collection(db, "user_bookmarks"),
        where("userId", "==", user.uid),
        where("type", "==", "preview_route"),
        orderBy("savedAt", "desc")
      );

      const [routesSnapshot, bookmarksSnapshot] = await Promise.all([
        getDocs(routesQuery),
        getDocs(bookmarksQuery),
      ]);

      const routeData: RouteMetadata[] = [];

      // Process uploaded routes
      routesSnapshot.forEach((doc) => {
        const data = doc.data();
        routeData.push({
          id: doc.id,
          type: "uploaded",
          filename: data.filename,
          safeFilename: data.safeFilename,
          uploadedAt: data.uploadedAt,
          metadata: data.metadata,
          thumbnailPoints: data.thumbnailPoints || [],
          displayUrl: data.displayUrl,
          fileUrl: data.fileUrl,
        });
      });

      // Process bookmarked routes
      bookmarksSnapshot.forEach((doc) => {
        const data = doc.data();

        routeData.push({
          id: doc.id,
          type: "bookmarked",
          routeSlug: data.routeSlug, // Keep for backwards compatibility
          routeKey: data.routeKey,
          routeName: data.routeName,
          savedAt: data.savedAt,
          schemaVersion: data.schemaVersion || 1,
          metadata: {
            routeName: data.routeName || "Unknown Route",
            totalDistance: data.previewData?.distance || 0,
            elevationGain: data.previewData?.elevationGain || 0,
            pointCount: data.previewData?.thumbnailPoints?.length || 0,
          },
          thumbnailPoints: data.previewData?.thumbnailPoints || [],
          displayUrl: data.displayUrl,
          previewData: data.previewData,
        });
      });

      // Sort all routes by date (most recent first)
      routeData.sort((a, b) => {
        const dateA = a.uploadedAt || a.savedAt;
        const dateB = b.uploadedAt || b.savedAt;
        return (dateB?.seconds || 0) - (dateA?.seconds || 0);
      });

      setRoutes(routeData);
    } catch (err) {
      console.error("Error loading routes:", err);
      setError("Failed to load routes");
    } finally {
      setLoading(false);
    }
  };

  const loadUserFuelPlans = async () => {
    if (!user) return;

    try {
      const fuelPlansQuery = query(
        collection(db, "user_fuel_plans"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(fuelPlansQuery);
      const plans = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FuelPlan[];

      setFuelPlans(plans);
    } catch (err) {
      console.error("Error loading fuel plans:", err);
      // Don't set error state - fuel plans are optional
    }
  };

  const loadUserPacePlans = async () => {
    if (!user) return;

    try {
      const pacePlansQuery = query(
        collection(db, "user_pace_plans"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(pacePlansQuery);
      const plans = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PacePlan[];

      // Sort by race date if available, otherwise by created date
      plans.sort((a, b) => {
        // If both have race dates, sort by race date (ascending - upcoming races first)
        if (a.raceDate && b.raceDate) {
          return new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime();
        }
        // Plans with race dates come first
        if (a.raceDate && !b.raceDate) return -1;
        if (!a.raceDate && b.raceDate) return 1;
        // Otherwise sort by creation date (newest first)
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });

      setPacePlans(plans);
    } catch (err) {
      console.error("Error loading pace plans:", err);
      // Don't set error state - pace plans are optional
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    try {
      return timestamp.toDate().toLocaleDateString();
    } catch {
      return "Unknown";
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleCopyPlan = async (plan: FuelPlan) => {
    let text = `Fuel Plan for ${plan.raceType}\n\n`;
    text += `Finish Time: ${formatTime(plan.finishTime)}\n`;
    text += `Carbs/hr: ${plan.carbsPerHour}g\n`;
    text += `Total Carbs: ${plan.totalCarbs}g\n`;
    text += `Calories: ${plan.totalCalories} kcal\n`;
    text += `Gels: ${plan.gelsNeeded}\n`;

    if (plan.aiRecommendations && plan.aiRecommendations.length > 0) {
      text += `\n--- AI Recommendations ---\n`;
      plan.aiRecommendations.forEach((rec, idx) => {
        text += `\n${idx + 1}. ${rec.headline}\n`;
        if (rec.detail) {
          text += `   ${rec.detail}\n`;
        }
      });
    }

    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Fuel plan copied successfully",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Failed to copy fuel plan to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFuelPlan = async (planId: string) => {
    try {
      if (!user) return;

      const docRef = doc(db, "user_fuel_plans", planId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Plan does not exist");
      }

      const data = docSnap.data();
      if (!data.userId || data.userId !== user.uid) {
        throw new Error("You are not authorized to delete this plan");
      }

      await deleteDoc(docRef);
      setFuelPlans((prev) => prev.filter((p) => p.id !== planId));
      
      toast({
        title: "Plan deleted",
        description: "Fuel plan deleted successfully",
      });
    } catch (err) {
      console.error("Delete failed:", err);
      toast({
        title: "Delete failed",
        description: "Failed to delete fuel plan",
        variant: "destructive",
      });
    }
  };

  const handleDeletePacePlan = async (planId: string) => {
    try {
      if (!user) return;

      const docRef = doc(db, "user_pace_plans", planId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Plan does not exist");
      }

      const data = docSnap.data();
      if (!data.userId || data.userId !== user.uid) {
        throw new Error("You are not authorized to delete this plan");
      }

      await deleteDoc(docRef);
      setPacePlans((prev) => prev.filter((p) => p.id !== planId));
      
      toast({
        title: "Plan deleted",
        description: "Pace plan deleted successfully",
      });
    } catch (err) {
      console.error("Delete failed:", err);
      toast({
        title: "Delete failed",
        description: "Failed to delete pace plan",
        variant: "destructive",
      });
    }
  };

  const handleCopyPacePlan = async (plan: PacePlan) => {
    const raceTime = `${plan.hours}h ${plan.minutes}m ${plan.seconds}s`;
    let text = `Training Paces for ${plan.distance}${plan.units} in ${raceTime}\n\n`;
    
    Object.entries(plan.paces).forEach(([key, value]) => {
      const displayName = key === "xlong" ? "Long Run" : key;
      text += `${displayName.charAt(0).toUpperCase() + displayName.slice(1)}: ${value}\n`;
    });

    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Pace plan copied successfully",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Failed to copy pace plan to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleEditPacePlan = async (
    planId: string,
    planName?: string,
    notes?: string,
    raceDate?: string
  ) => {
    try {
      if (!user) return;

      const docRef = doc(db, "user_pace_plans", planId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Plan does not exist");
      }

      const data = docSnap.data();
      if (!data.userId || data.userId !== user.uid) {
        throw new Error("You are not authorized to edit this plan");
      }

      await updateDoc(docRef, {
        planName: planName || null,
        notes: notes || null,
        raceDate: raceDate || null,
      });

      // Update local state
      setPacePlans((prev) =>
        prev.map((p) =>
          p.id === planId
            ? { ...p, planName, notes, raceDate }
            : p
        )
      );

      toast({
        title: "Plan updated",
        description: "Your changes have been saved successfully",
      });
    } catch (err) {
      console.error("Update failed:", err);
      toast({
        title: "Update failed",
        description: "Failed to update pace plan",
        variant: "destructive",
      });
    }
  };

  // async function softDeleteRouteDoc(routeId: string) {
  //   const docRef = doc(db, "gpx_uploads", routeId);
  //   await updateDoc(docRef, { deleted: true, deletedAt: Date.now() });
  // }

  async function handleDeleteRoute(
    routeId: string,
    routeType: "uploaded" | "bookmarked"
  ) {
    try {
      if (!user) {
        throw new Error("Not authenticated");
      }

      if (routeType === "uploaded") {
        // Soft delete uploaded routes
        const docRef = doc(db, "gpx_uploads", routeId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error("Route does not exist");
        }

        const data = docSnap.data();
        if (!data.userId || data.userId !== user.uid) {
          throw new Error("You are not authorized to delete this route");
        }

        await updateDoc(docRef, { deleted: true, deletedAt: Date.now() });
        console.log(`Soft deleted route ${routeId}`);
      } else {
        // Hard delete bookmarked routes
        const docRef = doc(db, "user_bookmarks", routeId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error("Bookmark does not exist");
        }

        const data = docSnap.data();
        if (!data.userId || data.userId !== user.uid) {
          throw new Error("You are not authorized to delete this bookmark");
        }

        await deleteDoc(docRef);
        console.log(`Deleted bookmark ${routeId}`);
      }

      setRoutes((prevRoutes) =>
        prevRoutes.filter((route) => route.id !== routeId)
      );
      
      toast({
        title: "Route deleted",
        description: `${routeType === "uploaded" ? "Route" : "Bookmark"} deleted successfully`,
      });
    } catch (err) {
      console.error("Delete failed:", err);
      toast({
        title: "Delete failed",
        description: "Failed to delete route",
        variant: "destructive",
      });
    }
  }

  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    filename: string;
    name: string;
  } | null>(null);

  const getRouteLink = (route: RouteMetadata) => {
    if (route.type === "uploaded") {
      return `/elevationfinder/${route.id}`;
    } else {
      // For bookmarked routes, link directly to the Firebase doc ID
      // This will automatically handle any document ID migrations
      if (route.routeSlug) {
        return `/elevationfinder/${route.routeSlug}`;
      }
      return `/elevationfinder/unknown`;
    }
  };

  const RouteCard = ({ route }: { route: RouteMetadata }) => {
    const [showPreview, setShowPreview] = useState(true);
    const isBookmarked = route.type === "bookmarked";
    const needsMigration =
      isBookmarked && (!route.routeKey || (route.schemaVersion || 1) < 2);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Route Header */}
        <div className="p-4 pb-0">
          {/* Migration Notice */}
          {needsMigration && (
            <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <p className="text-xs text-yellow-800">
                  This bookmark uses an older format. It will still work but may
                  need updating.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-800 truncate">
                  {route.metadata?.routeName || route.filename}
                </h3>
                {isBookmarked && (
                  <Bookmark className="w-4 h-4 text-purple-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-gray-500">
                {isBookmarked ? "Bookmarked" : "Uploaded"} •{" "}
                {formatDate(route.uploadedAt || route.savedAt)}
              </p>
              {isBookmarked && route.previewData && (
                <p className="text-xs text-gray-400 mt-1">
                  {route.previewData.city}, {route.previewData.country}
                </p>
              )}
            </div>
            <button
              onClick={() =>
                setDeleteConfirm({
                  id: route.id,
                  filename:
                    route.safeFilename ||
                    route.routeSlug ||
                    route.routeKey ||
                    "Unknown",
                  name:
                    route.metadata?.routeName ||
                    route.filename ||
                    "Unknown Route",
                })
              }
              className="text-gray-400 hover:text-red-500 transition-colors ml-2 bg-transparent rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              title={isBookmarked ? "Remove bookmark" : "Delete route"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && deleteConfirm.id === route.id && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-2">Delete Route</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete "
                {deleteConfirm.name || "Unknown Route"}"? This action cannot be
                undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    handleDeleteRoute(deleteConfirm.id, route.type);
                    setDeleteConfirm(null);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-white text-black rounded hover:text-gray-800 outline-none border border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Route Preview Map */}
        <div className="px-4 pb-3">
          {showPreview && route.thumbnailPoints?.length > 0 ? (
            <MapboxRoutePreview
              routePoints={route.thumbnailPoints}
              routeName={route.metadata?.routeName}
              lineColor={isBookmarked ? "#8b5cf6" : "#3b82f6"}
              height="225px"
              showStartEnd={true}
              className="border border-gray-200"
              mapStyle="mapbox://styles/mapbox/outdoors-v11"
              interactive={false}
            />
          ) : (
            <div className="h-32 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <div className="text-xs text-gray-500">
                  {route.thumbnailPoints?.length > 0
                    ? "Preview unavailable"
                    : "No route data"}
                </div>
                {route.thumbnailPoints?.length > 0 && (
                  <button
                    onClick={() => setShowPreview(true)}
                    className="text-blue-500 text-xs mt-1 hover:underline"
                  >
                    Try loading preview
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Route Stats */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="text-gray-600 truncate">
                {route.metadata?.totalDistance?.toFixed(1) || "0"} km
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-gray-600 truncate">
                {route.metadata?.elevationGain?.toFixed(0) || "0"} m
              </span>
            </div>
            <div className="flex items-center space-x-2 col-span-2">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-500 text-xs truncate">
                {route.metadata?.pointCount || 0} data points
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 pb-4">
          <div className="flex space-x-2">
            <Link
              to={getRouteLink(route)}
              className={`flex-1 text-white text-sm py-2 px-3 rounded-md transition-colors flex items-center justify-center space-x-1 ${
                route.type === "uploaded"
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-purple-500 hover:bg-purple-600"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>
                {route.type === "uploaded" ? "View Upload" : "View Preview"}
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  };
  const PacePlanCard = ({ plan }: { plan: PacePlan }) => {
    const [expanded, setExpanded] = useState(false);
    const raceTime = `${plan.hours}:${String(plan.minutes).padStart(2, '0')}:${String(plan.seconds).padStart(2, '0')}`;
    const paceUnit = plan.paceType === "km" ? "min/km" : "min/mi";

    // Format race date
    const formatRaceDate = (dateStr?: string) => {
      if (!dateStr) return null;
      try {
        return new Date(dateStr).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } catch {
        return null;
      }
    };

    const raceDate = formatRaceDate(plan.raceDate);
    const hasNotes = plan.notes && plan.notes.trim().length > 0;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-1">
              {plan.planName || `${plan.distance}${plan.units} Race`}
            </h3>
            <p className="text-sm text-gray-500">
              {formatDate(plan.createdAt)} • {raceTime}
            </p>
            {raceDate && (
              <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Race: {raceDate}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setEditingPlan(plan)}
              className="text-gray-400 hover:text-blue-500 transition-colors bg-transparent rounded-full p-1 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title="Edit plan"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeletePacePlan(plan.id)}
              className="text-gray-400 hover:text-red-500 transition-colors bg-transparent rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              title="Delete pace plan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pace Unit Badge */}
        <div className="mb-3">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            Paces in {paceUnit}
          </span>
        </div>

        {/* Paces Grid */}
        <div className="space-y-2 mb-3 bg-blue-50 p-3 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-xs text-gray-600 mb-0.5">Race Pace</div>
              <div className="font-bold text-blue-600">{plan.paces.race}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-0.5">Easy</div>
              <div className="font-bold text-blue-600">{plan.paces.easy}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-0.5">Tempo</div>
              <div className="font-bold text-blue-600">{plan.paces.tempo}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-0.5">Interval</div>
              <div className="font-bold text-blue-600">{plan.paces.interval}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-0.5">Long Run</div>
              <div className="font-bold text-blue-600">{plan.paces.xlong}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-0.5">Yasso 800s</div>
              <div className="font-bold text-blue-600">{plan.paces.yasso}</div>
            </div>
          </div>
        </div>

        {/* Notes (Expandable) */}
        {hasNotes && (
          <div className="mb-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full text-sm text-purple-600 hover:text-purple-700 flex items-center justify-between bg-purple-50 p-2 rounded-lg"
            >
              <span className="font-medium">Training Notes</span>
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {expanded && (
              <div className="mt-2 bg-purple-50 p-3 rounded-lg border border-purple-100">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {plan.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => handleCopyPacePlan(plan)}
          className="w-full bg-blue-500 text-white py-2 px-3 rounded-md text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
        >
          <Copy className="w-4 h-4" />
          Copy Paces
        </button>
      </div>
    );
  };

  const FuelPlanCard = ({ plan }: { plan: FuelPlan }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-800">
                {plan.raceType} {plan.raceType !== "10K" && "Marathon"}
              </h3>
              {plan.aiRecommendations && plan.aiRecommendations.length > 0 && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  AI Enhanced
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {formatDate(plan.createdAt)} • {formatTime(plan.finishTime)}
            </p>
          </div>
          <button
            onClick={() => handleDeleteFuelPlan(plan.id)}
            className="text-gray-400 hover:text-red-500 transition-colors ml-2 bg-transparent rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            title="Delete fuel plan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-sm mb-3 bg-orange-50 p-3 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">Carbs/hr</div>
            <div className="font-bold text-orange-600">
              {plan.carbsPerHour}g
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">Gels</div>
            <div className="font-bold text-orange-600">{plan.gelsNeeded}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">Calories</div>
            <div className="font-bold text-orange-600">
              {plan.totalCalories}
            </div>
          </div>
        </div>

        {/* AI Recommendations (Expandable) */}
        {plan.aiRecommendations && plan.aiRecommendations.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full text-sm text-purple-600 hover:text-purple-700 flex items-center justify-between bg-purple-50 p-2 rounded-lg"
            >
              <span className="font-medium">
                {plan.aiRecommendations.length} AI Recommendation
                {plan.aiRecommendations.length > 1 ? "s" : ""}
              </span>
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {expanded && (
              <div className="mt-2 space-y-2 bg-purple-50 p-3 rounded-lg border border-purple-100">
                {plan.aiRecommendations.map((rec, idx) => (
                  <div key={idx} className="text-sm">
                    <p className="font-semibold text-gray-800 mb-1">
                      {idx + 1}. {rec.headline}
                    </p>
                    {rec.detail && (
                      <p className="text-gray-600 text-xs leading-relaxed pl-4">
                        {rec.detail}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleCopyPlan(plan)}
            className="flex-1 bg-orange-500 text-white py-2 px-3 rounded-md text-sm hover:bg-orange-600 transition-colors flex items-center justify-center gap-1"
          >
            <Copy className="w-4 h-4" />
            Copy Plan
          </button>
        </div>
      </div>
    );
  };
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Sign In Required
          </h2>
          <p className="text-gray-600">
            Please sign in to view your uploaded routes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Helmet>
        <title>Dashboard | TrainPace</title>
        <meta
          name="description"
          content="View and manage your uploaded GPX routes, bookmarked marathons, and AI fuel plans."
        />
      </Helmet>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Dashboard</h1>
        <p className="text-gray-600">Manage your routes and fuel plans</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setActiveTab("routes")}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === "routes"
                ? "bg-blue-600 text-black hover:text-blue-600 hover:bg-blue-50"
                : "bg-white text-blue-600 shadow-sm hover:bg-white hover:text-blue-600"
            }`}
          >
            Routes ({routes.length})
          </button>
          <button
            onClick={() => setActiveTab("pace-plans")}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === "pace-plans"
                ? "bg-purple-600 text-black hover:text-purple-600 hover:bg-purple-50"
                : "bg-white text-purple-600 shadow-sm hover:bg-white hover:text-purple-600"
            }`}
          >
            Pace Plans ({pacePlans.length})
          </button>
          <button
            onClick={() => setActiveTab("fuel-plans")}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === "fuel-plans"
                ? "bg-orange-600 text-black hover:text-orange-600 hover:bg-orange-50"
                : "bg-white text-orange-600 shadow-sm hover:bg-white hover:text-orange-600"
            }`}
          >
            Fuel Plans ({fuelPlans.length})
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Routes Tab Content */}
      {!loading && activeTab === "routes" && (
        <>
          {routes.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                No Routes Yet
              </h2>
              <p className="text-gray-600 mb-6">
                Upload your first GPX file or bookmark a marathon route to get
                started.
              </p>
              <a
                href="/elevationfinder"
                className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Upload GPX File
              </a>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="text-sm text-gray-600">
                  {routes.length} route{routes.length !== 1 ? "s" : ""} found
                </div>
                <a
                  href="/elevationfinder"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
                >
                  Upload New Route
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {routes.map((route) => (
                  <RouteCard key={route.id} route={route} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Pace Plans Tab Content */}
      {!loading && activeTab === "pace-plans" && (
        <>
          {pacePlans.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                No Pace Plans Yet
              </h2>
              <p className="text-gray-600 mb-6">
                Create your first training pace plan based on your race times.
              </p>
              <a
                href="/pace-calculator"
                className="inline-block bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
              >
                Create Pace Plan
              </a>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="text-sm text-gray-600">
                  {pacePlans.length} pace plan
                  {pacePlans.length !== 1 ? "s" : ""} saved
                </div>
                <a
                  href="/pace-calculator"
                  className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors text-sm"
                >
                  Create New Plan
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pacePlans.map((plan) => (
                  <PacePlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Fuel Plans Tab Content */}
      {!loading && activeTab === "fuel-plans" && (
        <>
          {fuelPlans.length === 0 ? (
            <div className="text-center py-12">
              <Flame className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                No Fuel Plans Yet
              </h2>
              <p className="text-gray-600 mb-6">
                Create your first AI-powered fuel plan to see it here. Plans are
                automatically saved when you generate AI recommendations.
              </p>
              <a
                href="/fuel"
                className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Create Fuel Plan
              </a>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="text-sm text-gray-600">
                  {fuelPlans.length} fuel plan
                  {fuelPlans.length !== 1 ? "s" : ""} saved
                </div>
                <a
                  href="/fuel"
                  className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors text-sm"
                >
                  Create New Plan
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fuelPlans.map((plan) => (
                  <FuelPlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Edit Plan Dialog */}
      {editingPlan && (
        <EditPlanDialog
          isOpen={!!editingPlan}
          onClose={() => setEditingPlan(null)}
          onSave={async (planName, notes, raceDate) => {
            await handleEditPacePlan(editingPlan.id, planName, notes, raceDate);
            setEditingPlan(null);
          }}
          currentPlanName={editingPlan.planName}
          currentNotes={editingPlan.notes}
          currentRaceDate={editingPlan.raceDate}
          raceDistance={`${editingPlan.distance}${editingPlan.units}`}
          raceTime={`${editingPlan.hours}:${String(editingPlan.minutes).padStart(2, '0')}:${String(editingPlan.seconds).padStart(2, '0')}`}
        />
      )}
    </div>
  );
}
