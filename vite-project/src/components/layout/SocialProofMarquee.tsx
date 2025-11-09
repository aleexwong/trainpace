import { Marquee, MarqueeItem } from "@/components/ui/marquee";
import { Star, MapPin, Trophy, Target, Zap, Heart } from "lucide-react";

const testimonials = [
  {
    text: "Perfect for self-coached runners!",
    icon: Star,
  },
  {
    text: "Boston Marathon Ready",
    icon: Trophy,
  },
  {
    text: "Science-backed training zones",
    icon: Target,
  },
  {
    text: "NYC Marathon Route Analyzed",
    icon: MapPin,
  },
  {
    text: "Saved me from bonking!",
    icon: Heart,
  },
  {
    text: "Chicago Marathon Fueling",
    icon: Zap,
  },
  {
    text: "Finally nailed my tempo pace",
    icon: Target,
  },
  {
    text: "Berlin Marathon Elevation",
    icon: MapPin,
  },
  {
    text: "Game changer for race prep",
    icon: Star,
  },
  {
    text: "London Marathon Profile",
    icon: Trophy,
  },
];

export default function SocialProofMarquee() {
  return (
    <section className="py-8 bg-gradient-to-r from-blue-50 via-white to-blue-50 border-y border-gray-100 overflow-hidden">
      <div className="relative">
        {/* Top marquee - moving right */}
        <Marquee pauseOnHover speed="slow" className="[--duration:40s]">
          {testimonials.slice(0, 5).map((item, idx) => (
            <MarqueeItem key={idx}>
              <div className="mx-4 flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <item.icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">
                  {item.text}
                </span>
              </div>
            </MarqueeItem>
          ))}
        </Marquee>

        {/* Bottom marquee - moving left */}
        <Marquee
          pauseOnHover
          reverse
          speed="slow"
          className="[--duration:40s] mt-4"
        >
          {testimonials.slice(5).map((item, idx) => (
            <MarqueeItem key={idx}>
              <div className="mx-4 flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <item.icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">
                  {item.text}
                </span>
              </div>
            </MarqueeItem>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
