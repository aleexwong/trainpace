// src/pages/PreviewRoute.tsx
import { useParams, Navigate } from "react-router-dom";
import { MapPin, Activity, Calendar, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import MapboxRoutePreview from "../components/utils/MapboxRoutePreview";
import { Helmet } from "react-helmet-async";

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

// Detailed route data
const marathonRoutesData: Record<string, MarathonRoute> = {
  boston: {
    id: "1",
    name: "Boston Marathon",
    city: "Boston",
    country: "Massachusetts, USA",
    distance: 42.2,
    elevationGain: 156,
    elevationLoss: 245,
    startElevation: 150,
    endElevation: 10,
    slug: "boston",
    raceDate: "April 21, 2025",
    website: "https://www.baa.org/",
    description:
      "The Boston Marathon is one of the World Marathon Majors and features a challenging point-to-point course from Hopkinton to Boston. Known for its qualifying standards and historic significance, the course includes the famous Heartbreak Hill between miles 20-21.",
    tips: [
      "Train on hills - Heartbreak Hill comes at mile 20",
      "Negative split strategy recommended due to net downhill",
      "Weather can be unpredictable in April",
      "Qualifying time required for entry",
    ],
    thumbnailPoints: [
      { lat: 42.2287, lng: -71.5226, ele: 150, dist: 0 },
      { lat: 42.2334, lng: -71.4956, ele: 140, dist: 2.1 },
      { lat: 42.2401, lng: -71.4234, ele: 125, dist: 6.4 },
      { lat: 42.2567, lng: -71.3578, ele: 110, dist: 11.2 },
      { lat: 42.2789, lng: -71.2945, ele: 95, dist: 16.8 },
      { lat: 42.3012, lng: -71.2234, ele: 120, dist: 21.1 }, // Heartbreak Hill
      { lat: 42.3234, lng: -71.1567, ele: 85, dist: 26.2 },
      { lat: 42.3445, lng: -71.0845, ele: 45, dist: 32.5 },
      { lat: 42.3556, lng: -71.0634, ele: 25, dist: 37.8 },
      { lat: 42.3501, lng: -71.0603, ele: 10, dist: 42.2 },
    ],
  },
  nyc: {
    id: "2",
    name: "New York City Marathon",
    city: "New York",
    country: "New York, USA",
    distance: 42.2,
    elevationGain: 234,
    elevationLoss: 198,
    startElevation: 45,
    endElevation: 35,
    slug: "nyc",
    raceDate: "November 2, 2025",
    website: "https://www.tcsnycmarathon.org/",
    description:
      "The NYC Marathon takes runners through all five boroughs of New York City. Starting on Staten Island and finishing in Central Park, this course offers incredible crowd support and iconic city views throughout the 26.2-mile journey.",
    tips: [
      "Prepare for bridges - Verrazzano, Queensboro, Willis Ave, and Madison Ave",
      "Crowd energy is amazing but can lead to going out too fast",
      "Weather in November can vary greatly",
      "Lottery system for entry - very competitive",
    ],
    thumbnailPoints: [
      { lat: 40.6062, lng: -74.0641, ele: 45, dist: 0 }, // Staten Island start
      { lat: 40.6089, lng: -74.0234, ele: 78, dist: 3.2 }, // Verrazzano Bridge
      { lat: 40.6456, lng: -74.0123, ele: 25, dist: 8.1 }, // Brooklyn
      { lat: 40.6789, lng: -73.9567, ele: 35, dist: 13.5 },
      { lat: 40.7234, lng: -73.9012, ele: 42, dist: 18.7 }, // Queensboro Bridge
      { lat: 40.7567, lng: -73.8345, ele: 28, dist: 22.3 }, // Queens
      { lat: 40.7789, lng: -73.9234, ele: 45, dist: 26.8 }, // Bronx
      { lat: 40.7812, lng: -73.9567, ele: 65, dist: 30.1 }, // Madison Ave Bridge
      { lat: 40.7723, lng: -73.9789, ele: 55, dist: 35.7 }, // Manhattan
      { lat: 40.7829, lng: -73.9654, ele: 35, dist: 42.2 }, // Central Park finish
    ],
  },
  chicago: {
    id: "3",
    name: "Chicago Marathon",
    city: "Chicago",
    country: "Illinois, USA",
    distance: 42.2,
    elevationGain: 89,
    elevationLoss: 76,
    startElevation: 180,
    endElevation: 176,
    slug: "chicago",
    raceDate: "October 12, 2025",
    website: "https://www.chicagomarathon.com/",
    description:
      "Known as one of the flattest and fastest World Marathon Major courses, the Chicago Marathon takes runners through diverse neighborhoods of the Windy City. The loop course offers excellent crowd support and spectacular city skyline views.",
    tips: [
      "Fast and flat course - great for PR attempts",
      "October weather can be ideal but watch for wind",
      "Loop course means you see other runners throughout",
      "Excellent crowd support in every neighborhood",
    ],
    thumbnailPoints: [
      { lat: 41.8781, lng: -87.6298, ele: 180, dist: 0 }, // Grant Park start
      { lat: 41.8845, lng: -87.6234, ele: 178, dist: 2.1 },
      { lat: 41.8923, lng: -87.6089, ele: 175, dist: 5.3 },
      { lat: 41.9034, lng: -87.6456, ele: 182, dist: 8.7 },
      { lat: 41.9156, lng: -87.6712, ele: 185, dist: 12.4 },
      { lat: 41.8967, lng: -87.7234, ele: 188, dist: 16.8 },
      { lat: 41.8712, lng: -87.7456, ele: 184, dist: 21.1 },
      { lat: 41.8534, lng: -87.6789, ele: 179, dist: 26.2 },
      { lat: 41.8623, lng: -87.6456, ele: 177, dist: 31.5 },
      { lat: 41.8756, lng: -87.6298, ele: 176, dist: 42.2 }, // Grant Park finish
    ],
  },
  berlin: {
    id: "4",
    name: "Berlin Marathon",
    city: "Berlin",
    country: "Germany",
    distance: 42.2,
    elevationGain: 45,
    elevationLoss: 52,
    startElevation: 42,
    endElevation: 36,
    slug: "berlin",
    raceDate: "September 28, 2025",
    website: "https://www.bmw-berlin-marathon.com/",
    description:
      "The Berlin Marathon is renowned as the fastest marathon course in the world, passing by many of Berlin's historic landmarks including the Brandenburg Gate. The flat, fast course has seen numerous world records broken.",
    tips: [
      "Extremely flat and fast - world record course",
      "September weather is usually ideal for running",
      "Finish through the Brandenburg Gate is iconic",
      "Lottery entry system with high demand",
    ],
    thumbnailPoints: [
      { lat: 52.5145, lng: 13.3501, ele: 42, dist: 0 }, // Start near Tiergarten
      { lat: 52.5089, lng: 13.3789, ele: 40, dist: 3.2 },
      { lat: 52.4967, lng: 13.4123, ele: 38, dist: 7.8 },
      { lat: 52.4823, lng: 13.4456, ele: 35, dist: 12.5 },
      { lat: 52.4712, lng: 13.4789, ele: 33, dist: 17.1 },
      { lat: 52.4634, lng: 13.5012, ele: 31, dist: 21.1 },
      { lat: 52.4756, lng: 13.4234, ele: 34, dist: 26.2 },
      { lat: 52.4923, lng: 13.3789, ele: 37, dist: 31.8 },
      { lat: 52.5089, lng: 13.3567, ele: 39, dist: 37.5 },
      { lat: 52.5164, lng: 13.3777, ele: 36, dist: 42.2 }, // Brandenburg Gate finish
    ],
  },
  london: {
    id: "5",
    name: "London Marathon",
    city: "London",
    country: "United Kingdom",
    distance: 42.2,
    elevationGain: 67,
    elevationLoss: 89,
    startElevation: 12,
    endElevation: 18,
    slug: "london",
    raceDate: "April 26, 2025",
    website: "https://www.virginmoneylondonmarathon.com/",
    description:
      "The London Marathon takes runners past many of the city's most famous landmarks, including Tower Bridge, Big Ben, and Buckingham Palace. Known for its incredible atmosphere and charity fundraising, it's one of the most popular marathons worldwide.",
    tips: [
      "Relatively flat with some gentle rolling hills",
      "April weather can be unpredictable - train in all conditions",
      "Tower Bridge halfway point creates amazing atmosphere",
      "Ballot entry system - very competitive to get in",
    ],
    thumbnailPoints: [
      { lat: 51.4669, lng: 0.0005, ele: 12, dist: 0 }, // Greenwich start
      { lat: 51.4756, lng: -0.0234, ele: 15, dist: 3.2 },
      { lat: 51.4834, lng: -0.0567, ele: 18, dist: 7.1 },
      { lat: 51.4912, lng: -0.0789, ele: 22, dist: 10.8 },
      { lat: 51.5023, lng: -0.0845, ele: 25, dist: 14.2 }, // Tower Bridge area
      { lat: 51.5089, lng: -0.0923, ele: 28, dist: 18.7 },
      { lat: 51.5134, lng: -0.1023, ele: 24, dist: 21.1 }, // Halfway point
      { lat: 51.5067, lng: -0.1234, ele: 20, dist: 26.2 },
      { lat: 51.4998, lng: -0.1367, ele: 22, dist: 31.5 },
      { lat: 51.5014, lng: -0.1419, ele: 18, dist: 42.2 }, // The Mall finish
    ],
  },
  tokyo: {
    id: "6",
    name: "Tokyo Marathon",
    city: "Tokyo",
    country: "Japan",
    distance: 42.2,
    elevationGain: 123,
    elevationLoss: 134,
    startElevation: 15,
    endElevation: 8,
    slug: "tokyo",
    raceDate: "March 2, 2025",
    website: "https://www.marathon.tokyo/en/",
    description:
      "The Tokyo Marathon showcases Japan's capital city, taking runners through diverse districts from the metropolitan government building to the Imperial Palace. Known for incredible organization, enthusiastic crowds, and unique aid station offerings.",
    tips: [
      "March weather is generally mild and good for running",
      "Incredible aid stations with unique Japanese offerings",
      "Very organized with precise timing and logistics",
      "Lottery system with extremely high demand",
    ],
    thumbnailPoints: [
      { lat: 35.6762, lng: 139.6503, ele: 15, dist: 0 }, // Shinjuku start
      { lat: 35.6823, lng: 139.6634, ele: 18, dist: 2.8 },
      { lat: 35.6889, lng: 139.6789, ele: 22, dist: 6.2 },
      { lat: 35.6945, lng: 139.6923, ele: 25, dist: 9.7 },
      { lat: 35.6712, lng: 139.7234, ele: 28, dist: 13.5 },
      { lat: 35.6634, lng: 139.7456, ele: 24, dist: 18.1 },
      { lat: 35.6567, lng: 139.7678, ele: 20, dist: 21.1 }, // Halfway
      { lat: 35.6723, lng: 139.7234, ele: 16, dist: 26.8 },
      { lat: 35.6834, lng: 139.6989, ele: 12, dist: 32.3 },
      { lat: 35.6887, lng: 139.6922, ele: 8, dist: 42.2 }, // Imperial Palace area finish
    ],
  },
};

export default function PreviewRoute() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug || !marathonRoutesData[slug]) {
    return <Navigate to="/" replace />;
  }

  const route = marathonRoutesData[slug];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Helmet>
        <title>
          {route.name} Preview | TrainPace - Marathon Route Analysis
        </title>
        <meta
          name="description"
          content={`Explore the ${route.name} course profile, elevation changes, and race insights. Distance: ${route.distance}km, Elevation gain: ${route.elevationGain}m.`}
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
              {route.distance}km
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-500">Elevation Gain</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {route.elevationGain}m
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-500">Elevation Loss</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {route.elevationLoss}m
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
          <MapboxRoutePreview
            routePoints={route.thumbnailPoints}
            routeName={route.name}
            lineColor="#3b82f6"
            height="400px"
            showStartEnd={true}
            className=""
            mapStyle="mapbox://styles/mapbox/outdoors-v11"
            interactive={true}
          />
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
              {route.startElevation}m
            </p>
            <p className="text-sm text-gray-500 mt-1">Start Elevation</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {route.endElevation}m
            </p>
            <p className="text-sm text-gray-500 mt-1">Finish Elevation</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {route.startElevation > route.endElevation ? "-" : "+"}
              {Math.abs(route.endElevation - route.startElevation)}m
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
