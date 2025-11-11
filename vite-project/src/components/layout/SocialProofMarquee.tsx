import { Marquee, MarqueeItem } from "@/components/ui/marquee";
import { MapPin, Target, Flame, Calculator } from "lucide-react";
import marathonData from "@/data/marathon-data.json";
import { Link } from "react-router-dom";

// Real marathon routes available in the app
const marathonRoutes = Object.entries(marathonData).map(([slug, route]) => ({
  name: route.name,
  slug: slug,
}));

// Real features of the app
const features = [
  {
    text: "Science-Backed Training Zones",
    icon: Target,
  },
  {
    text: "GPX Elevation Analysis",
    icon: MapPin,
  },
  {
    text: "AI Race Fuel Planning",
    icon: Flame,
  },
  {
    text: "Pace Calculator & Predictions",
    icon: Calculator,
  },
];

export default function SocialProofMarquee() {
  return (
    <section className="py-8 bg-gradient-to-r from-blue-50 via-white to-blue-50 border-y border-gray-100 overflow-hidden">
      <div className="relative">
        {/* Top marquee - Features */}
        <Marquee pauseOnHover speed="slow" className="[--duration:40s]">
          {features.map((item, idx) => (
            <MarqueeItem key={idx}>
              <div className="mx-4 flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm border border-blue-200 hover:shadow-md transition-shadow">
                <item.icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">
                  {item.text}
                </span>
              </div>
            </MarqueeItem>
          ))}
        </Marquee>

        {/* Bottom marquee - Real marathon routes available */}
        <Marquee
          pauseOnHover
          reverse
          speed="slow"
          className="[--duration:45s] mt-4"
        >
          {marathonRoutes.map((route, idx) => (
            <MarqueeItem key={idx}>
              <Link to={`/preview-route/${route.slug}`}>
                <div className="mx-4 flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm border border-green-200 hover:shadow-md hover:border-green-300 transition-all cursor-pointer">
                  <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700">
                    {route.name}
                  </span>
                </div>
              </Link>
            </MarqueeItem>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
