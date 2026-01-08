// src/pages/PreviewRoute.tsx
import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  MapPin,
  Activity,
  Calendar,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronUp,
  Utensils,
} from "lucide-react";
import { Link } from "react-router-dom";
import LeafletRoutePreview from "../components/utils/LeafletRoutePreview";
import { Helmet } from "react-helmet-async";
import { SavePreviewRouteButton } from "../components/SavePreviewRouteButton";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getCurrentDocumentId } from "../config/routes";
import marathonData from "@/data/marathon-data.json";

interface PaceSegment {
  miles: string;
  terrain: string;
  advice: string;
}

interface PaceStrategy {
  type: string;
  summary: string;
  segments: PaceSegment[];
}

interface FAQItem {
  question: string;
  answer: string;
}

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
  paceStrategy?: PaceStrategy;
  fuelingNotes?: string;
  faq?: FAQItem[];
}

const marathonRoutesData: Record<string, MarathonRoute> = marathonData;

// FAQ Accordion Item Component
function FAQAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900 pr-4">{item.question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 pr-8">
          <p className="text-gray-600 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

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
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(0);

  if (!slug) {
    return <Navigate to="/" replace />;
  }

  // Get the preview data
  const route = marathonRoutesData[slug];

  if (!route) {
    return <Navigate to="/" replace />;
  }

  // Generate FAQ Schema JSON-LD
  const faqSchema = route.faq
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: route.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;

  // Generate Course/Event Schema
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: route.name,
    description: route.description,
    location: {
      "@type": "Place",
      name: `${route.city}, ${route.country}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: route.city,
        addressCountry: route.country,
      },
    },
    url: route.website,
    startDate: route.raceDate,
    sport: "Running",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  };

  // Generate BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://trainpace.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Race Courses",
        item: "https://trainpace.com/preview-route",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: route.name,
        item: `https://trainpace.com/preview-route/${slug}`,
      },
    ],
  };

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

  // Generate SEO-optimized description
  const seoDescription = `${route.name} elevation profile and course analysis. ${Math.round(
    routeStats.elevationGain ?? route.elevationGain
  )}m elevation gain, ${(routeStats.distanceKm ?? route.distance).toFixed(
    1
  )}km distance. Get pace strategy, fueling tips, and race day advice for ${
    route.city
  }.`;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Helmet>
        <title>
          {route.name} Elevation Profile & Course Analysis | TrainPace
        </title>
        <meta name="description" content={seoDescription} />
        <meta
          name="keywords"
          content={`${route.name} elevation, ${route.name} course, ${route.city} marathon elevation profile, ${route.name} pace strategy, ${route.name} hills`}
        />
        <link
          rel="canonical"
          href={`https://trainpace.com/preview-route/${slug}`}
        />

        {/* Open Graph */}
        <meta
          property="og:title"
          content={`${route.name} Elevation Profile & Course Analysis`}
        />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="article" />
        <meta
          property="og:url"
          content={`https://trainpace.com/preview-route/${slug}`}
        />

        {/* Structured Data */}
        {faqSchema && (
          <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        )}
        <script type="application/ld+json">
          {JSON.stringify(courseSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      {/* Breadcrumb */}
      <nav className="text-sm mb-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-gray-500">
          <li>
            <Link to="/" className="hover:text-blue-600">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <span className="text-gray-900">{route.name}</span>
          </li>
        </ol>
      </nav>

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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden relative z-0">
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

      {/* Pace Strategy Section */}
      {route.paceStrategy && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Pace Strategy</h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full capitalize">
              {route.paceStrategy.type.replace("-", " ")}
            </span>
          </div>

          <p className="text-gray-700 mb-6 leading-relaxed">
            {route.paceStrategy.summary}
          </p>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Mile-by-Mile Breakdown</h4>
            <div className="grid gap-3">
              {route.paceStrategy.segments.map((segment, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-start gap-2 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 sm:w-32 flex-shrink-0">
                    <span className="font-bold text-blue-600">
                      Miles {segment.miles}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-500 block mb-1">
                      {segment.terrain}
                    </span>
                    <span className="text-gray-700">{segment.advice}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              to="/calculator"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Zap className="w-4 h-4" />
              <span>Calculate your personalized training paces →</span>
            </Link>
          </div>
        </div>
      )}

      {/* Fueling Notes Section */}
      {route.fuelingNotes && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Utensils className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-bold text-gray-900">Race Day Fueling</h3>
          </div>

          <p className="text-gray-700 leading-relaxed mb-4">
            {route.fuelingNotes}
          </p>

          <Link
            to="/fuel"
            className="inline-flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium"
          >
            <span>Create your personalized fuel plan →</span>
          </Link>
        </div>
      )}

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

      {/* FAQ Section */}
      {route.faq && route.faq.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions about {route.name}
          </h3>
          <div className="divide-y divide-gray-200">
            {route.faq.map((item, index) => (
              <FAQAccordionItem
                key={index}
                item={item}
                isOpen={openFAQIndex === index}
                onToggle={() =>
                  setOpenFAQIndex(openFAQIndex === index ? null : index)
                }
              />
            ))}
          </div>
        </div>
      )}

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
            routeKey={route.slug}
            routeSlug={route.slug}
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
            to={`/elevationfinder/${route.slug}`}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            ElevationFinder
          </Link>
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
