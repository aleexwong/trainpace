import { Link } from "react-router-dom";
import { ArrowRight, Calculator, Fuel, Mountain, MapPin } from "lucide-react";
import { INTERNAL_LINKS, MARATHON_COURSES } from "@/config/seo";

type ToolType = "calculator" | "fuel" | "elevation" | "marathons";

interface RelatedToolsProps {
  currentTool: ToolType;
  className?: string;
  title?: string;
  showMarathons?: boolean;
  maxItems?: number;
}

const TOOL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/calculator": Calculator,
  "/fuel": Fuel,
  "/elevationfinder": Mountain,
};

export default function RelatedTools({
  currentTool,
  className = "",
  title = "Related Tools",
  showMarathons = true,
  maxItems = 3,
}: RelatedToolsProps) {
  const links = INTERNAL_LINKS[currentTool] || [];
  const marathonLinks = showMarathons ? INTERNAL_LINKS.marathons.slice(0, 3) : [];

  return (
    <section className={`bg-gray-50 rounded-xl p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="space-y-3">
        {links.slice(0, maxItems).map((link) => {
          const Icon = TOOL_ICONS[link.href] || ArrowRight;
          return (
            <Link
              key={link.href}
              to={link.href}
              className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-colors group"
            >
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {link.text}
                </span>
                {"description" in link && (
                  <p className="text-sm text-gray-500">{link.description}</p>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </Link>
          );
        })}
      </div>

      {showMarathons && marathonLinks.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Preview Marathon Courses
          </h4>
          <div className="flex flex-wrap gap-2">
            {marathonLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-full hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
              >
                {link.text}
              </Link>
            ))}
            <Link
              to="/preview-route/berlin"
              className="px-3 py-1.5 text-sm text-blue-600 hover:underline"
            >
              + More
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

// Marathon course cards for internal linking
interface MarathonCardProps {
  slug: keyof typeof MARATHON_COURSES;
  compact?: boolean;
}

export function MarathonCard({ slug, compact = false }: MarathonCardProps) {
  const course = MARATHON_COURSES[slug];

  if (compact) {
    return (
      <Link
        to={`/preview-route/${slug}`}
        className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
      >
        <MapPin className="w-4 h-4 text-blue-600" />
        <span className="font-medium text-sm">{course.name}</span>
      </Link>
    );
  }

  return (
    <Link
      to={`/preview-route/${slug}`}
      className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {course.name}
        </h4>
        <span
          className={`px-2 py-0.5 text-xs rounded-full ${
            course.difficulty === "Easy"
              ? "bg-green-100 text-green-700"
              : course.difficulty === "Moderate"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {course.difficulty}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {course.description}
      </p>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>
          +{course.elevation.gain}m / -{course.elevation.loss}m
        </span>
        <span>{course.month}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {course.keyFeatures.slice(0, 2).map((feature) => (
          <span
            key={feature}
            className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
          >
            {feature}
          </span>
        ))}
      </div>
    </Link>
  );
}

// Grid of marathon cards
interface MarathonGridProps {
  className?: string;
  columns?: 2 | 3;
}

export function MarathonGrid({ className = "", columns = 3 }: MarathonGridProps) {
  const slugs = Object.keys(MARATHON_COURSES) as (keyof typeof MARATHON_COURSES)[];

  return (
    <div
      className={`grid gap-4 ${
        columns === 3 ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"
      } ${className}`}
    >
      {slugs.map((slug) => (
        <MarathonCard key={slug} slug={slug} />
      ))}
    </div>
  );
}
