// src/pages/PreviewRoute.tsx
import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { MapPin, Activity, Calendar, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
// import MapboxRoutePreview from "../components/utils/MapboxRoutePreview";
import LeafletRoutePreview from "../components/utils/LeafletRoutePreview";
import { Helmet } from "react-helmet-async";
import { SavePreviewRouteButton } from "../components/SavePreviewRouteButton";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getCurrentDocumentId } from "../config/routes";
import marathonData from "@/data/marathon-data.json";

interface MarathonRoute {
  id: string;
  name: string;
  city: string;
  country: string;
  distance: number;
  elevationGain: number;
  elevationLoss: number;
  startElevation: number;
  endElevation: number;
  description: string;
  raceDate: string;
  thumbnailPoints: Array<{
    lat: number;
    lng: number;
    ele: number;
    dist?: number;
  }>;
  slug: string;
  website: string;
  tips: string[];
}

const marathonRoutesData: Record<string, MarathonRoute> = marathonData;

export default function PreviewRoute() {
  const { slug } = useParams<{ slug: string }>();
  const [firebaseThumbPoints, setFirebaseThumbPoints] = useState<
    Array<{ lat: number; lng: number; ele?: number }>
  >([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [routeStats, setRouteStats] = useState<{
    distanceKm?: number;
    elevationGain?: number;
    elevationLoss?: number;
    startElevation?: number;
    endElevation?: number;
  }>({});

  if (!slug) {
    return <Navigate to="/" replace />;
  }

  // Get the preview data
  const route = marathonRoutesData[slug];

  if (!route) {
    return <Navigate to="/" replace />;
  }

  // Load display/thumbnail points and dynamic stats from ElevationFinder doc
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingPoints(true);
        setLoadError(null);
        const resolvedId = getCurrentDocumentId(route.slug);
        const ref = doc(db, "gpx_uploads", resolvedId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const data: any = snap.data();
        const pts: Array<{ lat: number; lng: number; ele?: number }> =
          data?.thumbnailPoints || data?.displayPoints || [];
        if (!cancelled && pts?.length) setFirebaseThumbPoints(pts);

        const nextStats: typeof routeStats = {};
        const staticData = data?.staticRouteData;
        const meta = data?.metadata;
        if (staticData) {
          if (typeof staticData.totalDistance === "number")
            nextStats.distanceKm = staticData.totalDistance;
          if (typeof staticData.totalElevationGain === "number")
            nextStats.elevationGain = staticData.totalElevationGain;
          if (typeof staticData.totalElevationLoss === "number")
            nextStats.elevationLoss = staticData.totalElevationLoss;
          const profile: Array<{ distanceKm: number; elevation: number }> =
            staticData.elevationProfile || [];
          if (profile.length > 0) {
            nextStats.startElevation = Math.round(profile[0].elevation);
            nextStats.endElevation = Math.round(
              profile[profile.length - 1].elevation
            );
          }
        } else if (meta) {
          if (typeof meta.totalDistance === "number")
            nextStats.distanceKm = meta.totalDistance;
          if (typeof meta.elevationGain === "number")
            nextStats.elevationGain = meta.elevationGain;
          const elevateFrom = (
            pts?.length ? pts : route.thumbnailPoints
          ) as Array<{ lat: number; lng: number; ele?: number }>;
          if (elevateFrom.length) {
            const firstEle = elevateFrom[0]?.ele;
            const lastEle = elevateFrom[elevateFrom.length - 1]?.ele;
            if (typeof firstEle === "number")
              nextStats.startElevation = Math.round(firstEle);
            if (typeof lastEle === "number")
              nextStats.endElevation = Math.round(lastEle);
          }
        }
        if (!cancelled) setRouteStats(nextStats);
      } catch (e: any) {
        if (!cancelled)
          setLoadError(e?.message ?? "Failed to load route points");
      } finally {
        if (!cancelled) setLoadingPoints(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [route.slug]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Helmet>
        <title>
          {route.name} Preview | TrainPace - Marathon Route Analysis
        </title>
        <meta
          name="description"
          content={`Explore the ${
            route.name
          } course profile, elevation changes, and race insights. Distance: ${(
            routeStats.distanceKm ?? route.distance
          ).toFixed(1)}km, Elevation gain: ${Math.round(
            routeStats.elevationGain ?? route.elevationGain
          )}m.`}
        />
      </Helmet>

      {/* Back Link */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Calculator</span>
        </Link>
      </div>

      {/* Route Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{route.name}</h1>
        <p className="text-xl text-gray-600 mb-4">
          {route.city}, {route.country}
        </p>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-2 mb-1">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-500">Distance</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(routeStats.distanceKm ?? route.distance).toFixed(1)}km
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-500">Elevation Gain</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(routeStats.elevationGain ?? route.elevationGain)}m
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-500">Elevation Loss</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(routeStats.elevationLoss ?? route.elevationLoss)}m
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-500">Race Date</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{route.raceDate}</p>
          </div>
        </div>
      </div>

      {/* Route Map */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Course Profile
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Use Leaflet for public preview to avoid requiring a Mapbox token */}
          <LeafletRoutePreview
            routePoints={
              firebaseThumbPoints.length
                ? firebaseThumbPoints
                : route.thumbnailPoints
            }
            routeName={route.name}
            lineColor="#3b82f6"
            height="400px"
            showStartEnd={true}
            className=""
            interactive={true}
          />
          {loadingPoints && (
            <div className="p-3 text-sm text-gray-500">
              Loading latest route preview…
            </div>
          )}
          {loadError && (
            <div className="p-3 text-sm text-red-600">{loadError}</div>
          )}
        </div>
      </div>

      {/* Route Description & Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Course Description
          </h3>
          <p className="text-gray-700 leading-relaxed">{route.description}</p>

          <div className="mt-6">
            <a
              href={route.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <span>Official Race Website</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Training Tips
          </h3>
          <ul className="space-y-3">
            {route.tips.map((tip, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Elevation Profile Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Elevation Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {Math.round(routeStats.startElevation ?? route.startElevation)}m
            </p>
            <p className="text-sm text-gray-500 mt-1">Start Elevation</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {Math.round(routeStats.endElevation ?? route.endElevation)}m
            </p>
            <p className="text-sm text-gray-500 mt-1">Finish Elevation</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {(routeStats.startElevation ?? route.startElevation) >
              (routeStats.endElevation ?? route.endElevation)
                ? "-"
                : "+"}
              {Math.abs(
                (routeStats.endElevation ?? route.endElevation) -
                  (routeStats.startElevation ?? route.startElevation)
              )}
              m
            </p>
            <p className="text-sm text-gray-500 mt-1">Net Elevation Change</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Ready to Train for {route.name}?
        </h3>
        <p className="text-gray-600 mb-4">
          Use our training tools to prepare for this incredible marathon course.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <SavePreviewRouteButton
            routeKey={route.slug} // Use the Firebase document ID from route.slug
            routeSlug={route.slug} // Also pass as routeSlug for backwards compatibility
            routeName={route.name}
            size="lg"
            routeData={{
              city: route.city,
              country: route.country,
              distance: routeStats.distanceKm ?? route.distance,
              elevationGain: routeStats.elevationGain ?? route.elevationGain,
              elevationLoss: routeStats.elevationLoss ?? route.elevationLoss,
              raceDate: route.raceDate,
              website: route.website,
              thumbnailPoints: firebaseThumbPoints.length
                ? (firebaseThumbPoints as Array<{
                    lat: number;
                    lng: number;
                    ele: number;
                    dist?: number;
                  }>)
                : route.thumbnailPoints,
              description: route.description,
              tips: route.tips,
            }}
          />
          <Link
            to="/calculator"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Pace Calculator
          </Link>
          <Link
            to="/fuel"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Fuel Planner
          </Link>
        </div>
      </div>
    </div>
  );
}
