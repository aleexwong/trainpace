import { Link } from "react-router-dom";
import LeafletRoutePreview from "@/components/utils/LeafletRoutePreview";
import marathonData from "@/data/marathon-data.json";

interface RoutePoint {
  lat: number;
  lng: number;
  ele: number;
  dist: number;
}

interface RouteData {
  name: string;
  city: string;
  country: string;
  distance: number;
  elevationGain: number;
  slug: string;
  thumbnailPoints: RoutePoint[];
}

const routes = marathonData as Record<string, RouteData>;

// Routes that have a full preview page
const PREVIEW_SLUGS = new Set(["boston", "nyc", "chicago", "berlin", "london", "tokyo", "sydney", "oslo"]);

interface Props {
  routeKey: string;
  caption?: string;
}

export default function BlogRouteMap({ routeKey, caption }: Props) {
  const route = routes[routeKey];

  if (!route || route.thumbnailPoints.length === 0) {
    return (
      <div className="my-6 p-4 bg-gray-100 rounded-lg text-sm text-gray-500 text-center">
        Unknown route: {routeKey}
      </div>
    );
  }

  const hasPreviewPage = PREVIEW_SLUGS.has(routeKey);

  return (
    <figure className="my-8 not-prose">
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Course Map</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {route.name} · {route.city}, {route.country}
            </p>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div>
              <p className="text-xs text-gray-400">Distance</p>
              <p className="text-sm font-bold text-gray-700">{route.distance} km</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Gain</p>
              <p className="text-sm font-bold text-emerald-600">+{route.elevationGain} m</p>
            </div>
            {hasPreviewPage && (
              <Link
                to={`/preview-route/${routeKey}`}
                className="ml-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors whitespace-nowrap"
              >
                Full route →
              </Link>
            )}
          </div>
        </div>
        {/* Map */}
        <div className="h-64 w-full">
          <LeafletRoutePreview
            routePoints={route.thumbnailPoints.map(({ lat, lng }) => ({ lat, lng }))}
            routeName={route.name}
            height="100%"
            width="100%"
            showStartEnd
            interactive
            lineColor="#10b981"
            lineWidth={3}
          />
        </div>
      </div>
      {caption && (
        <figcaption className="mt-2 text-xs text-gray-400 text-center">{caption}</figcaption>
      )}
    </figure>
  );
}
