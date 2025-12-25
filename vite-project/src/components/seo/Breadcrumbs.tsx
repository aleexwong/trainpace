import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import StructuredData from "./StructuredData";
import { BASE_URL } from "@/config/seo";

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

// Default breadcrumb mappings based on path
const PATH_NAMES: Record<string, string> = {
  "/": "Home",
  "/calculator": "Pace Calculator",
  "/fuel": "Fuel Planner",
  "/elevationfinder": "Elevation Finder",
  "/elevation-finder": "Elevation Finder",
  "/dashboard": "Dashboard",
  "/faq": "FAQ",
  "/about": "About",
  "/ethos": "About",
  "/privacy": "Privacy Policy",
  "/terms": "Terms of Service",
  "/settings": "Settings",
  "/preview-route": "Marathon Courses",
};

export default function Breadcrumbs({
  items,
  className = "",
  showHome = true,
}: BreadcrumbsProps) {
  const location = useLocation();

  // Generate breadcrumbs from current path if not provided
  const getBreadcrumbsFromPath = (): BreadcrumbItem[] => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    if (showHome) {
      breadcrumbs.push({ name: "Home", href: "/" });
    }

    let currentPath = "";
    for (const part of pathParts) {
      currentPath += `/${part}`;

      // Special handling for preview-route with slug
      if (currentPath.startsWith("/preview-route/")) {
        const slug = part;
        const cityName = slug.charAt(0).toUpperCase() + slug.slice(1);
        // Add parent "Marathon Courses" if we're at the slug level
        if (pathParts.length === 2 && pathParts[0] === "preview-route") {
          breadcrumbs.push({ name: "Marathon Courses", href: "/preview-route/boston" });
          breadcrumbs.push({ name: `${cityName} Marathon`, href: currentPath });
        }
        continue;
      }

      const name = PATH_NAMES[currentPath] || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
      breadcrumbs.push({ name, href: currentPath });
    }

    return breadcrumbs;
  };

  const breadcrumbs = items || getBreadcrumbsFromPath();

  // Don't show breadcrumbs on home page
  if (location.pathname === "/" && !items) {
    return null;
  }

  // Generate schema items
  const schemaItems = breadcrumbs.map((item) => ({
    name: item.name,
    url: `${BASE_URL}${item.href}`,
  }));

  return (
    <>
      <StructuredData type="BreadcrumbList" items={schemaItems} />
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center text-sm text-gray-600 ${className}`}
      >
        <ol className="flex items-center flex-wrap gap-1">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const isFirst = index === 0;

            return (
              <li key={item.href} className="flex items-center">
                {!isFirst && (
                  <ChevronRight className="w-4 h-4 mx-1 text-gray-400" aria-hidden="true" />
                )}
                {isLast ? (
                  <span className="font-medium text-gray-900" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    to={item.href}
                    className="hover:text-blue-600 transition-colors flex items-center gap-1"
                  >
                    {isFirst && item.name === "Home" && (
                      <Home className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span className={isFirst && item.name === "Home" ? "sr-only sm:not-sr-only" : ""}>
                      {item.name}
                    </span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
