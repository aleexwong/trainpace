import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import marathonData from "@/data/marathon-data.json";

// Use the actual marathon data
const majorMarathonRoutes = Object.entries(marathonData).map(([slug, route]) => ({
  ...route,
  slug, // Use the key as the slug for routing
}));

export default function PreviewRoutesDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we're on a preview route page
  const isPreviewRouteActive = location.pathname.startsWith("/preview-route/");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      // Clean up timeout on unmount
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    // Add a small delay before closing to prevent flickering
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Dropdown Trigger */}
      <button
        onClick={toggleDropdown}
        className={`flex items-center space-x-1 transition-colors focus:outline-none bg-transparent border-none p-0 ${
          isPreviewRouteActive
            ? "text-blue-600 font-medium"
            : "text-gray-700 hover:text-blue-600"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>Preview Routes</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
        className="absolute top-full left-0 mt-2 w-72 border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}
        >
          <div
            className="p-3 border-b"
            style={{ backgroundColor: "#f9fafb", borderColor: "#f3f4f6" }}
          >
            <h3 className="font-semibold text-gray-900 text-sm">
              Major Marathon Routes
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Explore world-famous marathon courses
            </p>
          </div>

          <div className="py-2">
            {majorMarathonRoutes.map((route) => (
              <Link
                key={route.id}
                to={`/preview-route/${route.slug}`}
                className={`block px-4 py-3 transition-colors border-b border-gray-50 last:border-b-0 ${
                  location.pathname === `/preview-route/${route.slug}`
                    ? "bg-blue-50 border-blue-100"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-medium text-sm truncate ${
                        location.pathname === `/preview-route/${route.slug}`
                          ? "text-blue-700"
                          : "text-gray-900"
                      }`}
                    >
                      {route.name}
                    </h4>
                    <p
                      className={`text-xs truncate mt-0.5 ${
                        location.pathname === `/preview-route/${route.slug}`
                          ? "text-blue-600"
                          : "text-gray-500"
                      }`}
                    >
                      {route.city}, {route.country}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div
            className="p-3 border-t"
            style={{ backgroundColor: "#f9fafb", borderColor: "#f3f4f6" }}
          >
            <p className="text-xs text-gray-500 text-center">
              View detailed elevation profiles and race insights
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
