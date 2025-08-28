import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, MapPin, Activity } from 'lucide-react';

interface MarathonRoute {
  id: string;
  name: string;
  city: string;
  distance: number;
  elevationGain: number;
  thumbnailPoints: Array<{
    lat: number;
    lng: number;
    ele: number;
  }>;
  slug: string;
}

// Major 6 marathon routes data
const majorMarathonRoutes: MarathonRoute[] = [
  {
    id: '1',
    name: 'Boston Marathon',
    city: 'Boston, MA',
    distance: 42.2,
    elevationGain: 156,
    slug: 'boston',
    thumbnailPoints: [
      { lat: 42.373, lng: -71.265, ele: 150 },
      { lat: 42.351, lng: -71.060, ele: 10 }
    ]
  },
  {
    id: '2', 
    name: 'NYC Marathon',
    city: 'New York, NY',
    distance: 42.2,
    elevationGain: 234,
    slug: 'nyc',
    thumbnailPoints: [
      { lat: 40.606, lng: -74.064, ele: 45 },
      { lat: 40.774, lng: -73.982, ele: 35 }
    ]
  },
  {
    id: '3',
    name: 'Chicago Marathon', 
    city: 'Chicago, IL',
    distance: 42.2,
    elevationGain: 89,
    slug: 'chicago',
    thumbnailPoints: [
      { lat: 41.878, lng: -87.638, ele: 180 },
      { lat: 41.875, lng: -87.624, ele: 176 }
    ]
  },
  {
    id: '4',
    name: 'Berlin Marathon',
    city: 'Berlin, Germany', 
    distance: 42.2,
    elevationGain: 45,
    slug: 'berlin',
    thumbnailPoints: [
      { lat: 52.5145, lng: 13.3501, ele: 42 },
      { lat: 52.5164, lng: 13.3777, ele: 36 }
    ]
  },
  {
    id: '5',
    name: 'London Marathon',
    city: 'London, UK',
    distance: 42.2,
    elevationGain: 67,
    slug: 'london',
    thumbnailPoints: [
      { lat: 51.4669, lng: 0.0005, ele: 12 },
      { lat: 51.5014, lng: -0.1419, ele: 18 }
    ]
  },
  {
    id: '6',
    name: 'Tokyo Marathon',
    city: 'Tokyo, Japan',
    distance: 42.2,
    elevationGain: 123,
    slug: 'tokyo',
    thumbnailPoints: [
      { lat: 35.6762, lng: 139.6503, ele: 15 },
      { lat: 35.6887, lng: 139.6922, ele: 8 }
    ]
  }
];

export default function PreviewRoutesDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we're on a preview route page
  const isPreviewRouteActive = location.pathname.startsWith('/preview-route/');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
          <div className="p-3 border-b" style={{ backgroundColor: '#f9fafb', borderColor: '#f3f4f6' }}>
            <h3 className="font-semibold text-gray-900 text-sm">Major Marathon Routes</h3>
            <p className="text-xs text-gray-600 mt-1">Explore world-famous marathon courses</p>
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
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-sm truncate ${
                      location.pathname === `/preview-route/${route.slug}`
                        ? "text-blue-700"
                        : "text-gray-900"
                    }`}>
                      {route.name}
                    </h4>
                    <p className={`text-xs truncate mt-0.5 ${
                      location.pathname === `/preview-route/${route.slug}`
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}>
                      {route.city}
                    </p>
                    
                    {/* Route Stats */}
                    <div className="flex items-center space-x-3 mt-2">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-blue-500" />
                        <span className="text-xs text-gray-600">
                          {route.distance}km
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Activity className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-gray-600">
                          {route.elevationGain}m
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mini route visualization */}
                  <div className="ml-3 w-12 h-8 bg-gradient-to-r from-blue-50 to-green-50 rounded border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3 h-3 text-blue-500" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="p-3 border-t" style={{ backgroundColor: '#f9fafb', borderColor: '#f3f4f6' }}>
            <p className="text-xs text-gray-500 text-center">
              View detailed elevation profiles and race insights
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
