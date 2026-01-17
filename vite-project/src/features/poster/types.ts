/**
 * Poster Feature - Core Types & Constants
 */

// Types matching GPX structure
export interface GpxPoint {
  lat: number;
  lng: number;
  ele?: number;
}

export interface GPXMetadata {
  routeName: string;
  totalDistance: number;
  elevationGain: number;
  maxElevation: number | null;
  minElevation: number | null;
  pointCount: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  hasElevationData: boolean;
}

export interface PosterData {
  city: string;
  raceName: string;
  time: string;
  distance: string;
  date: string;
  athleteName: string;
  routeColor: string;
  backgroundColor: string;
}

export interface TemplateColor {
  name: string;
  route: string;
  bg: string;
  mapStyle: string;
}

export interface PosterGeneratorProps {
  displayPoints: GpxPoint[];
  metadata: GPXMetadata;
  filename?: string;
  onDataChange?: () => void;
}

export interface PosterButtonProps {
  displayPoints: GpxPoint[];
  metadata: GPXMetadata;
  filename?: string;
  disabled?: boolean;
}

// Print configuration constants
export const PRINT_CONFIG = {
  // 8x10" at 300 DPI
  width: 2400,
  height: 3000,
  dpi: 300,
  // Layout proportions - map is the star, no header needed
  mapHeight: 0.8, // Massive 80% for ultimate map focus
  statsHeight: 0.2, // Compact stats at bottom
  headerHeight: 0.0, // No header - pure map focus
} as const;

// Template color options
export const TEMPLATE_COLORS: TemplateColor[] = [
  {
    name: "Classic",
    route: "#e74c3c",
    bg: "#ffffff",
    mapStyle: "mapbox://styles/mapbox/outdoors-v12",
  },
  {
    name: "Custom",
    route: "#be872b",
    bg: "#ffffff",
    mapStyle: "mapbox://styles/wongalex97/cmfrw0hcc00e401sjchoqg2rp",
  },
  {
    name: "Ocean",
    route: "#3498db",
    bg: "#ecf8ff",
    mapStyle: "mapbox://styles/mapbox/satellite-streets-v12",
  },
  {
    name: "Forest",
    route: "#27ae60",
    bg: "#f0fdf4",
    mapStyle: "mapbox://styles/mapbox/outdoors-v12",
  },
  {
    name: "Sunset",
    route: "#f39c12",
    bg: "#fef7ed",
    mapStyle: "mapbox://styles/mapbox/light-v11",
  },
  {
    name: "Purple",
    route: "#9b59b6",
    bg: "#faf5ff",
    mapStyle: "mapbox://styles/mapbox/dark-v11",
  },
  {
    name: "Night",
    route: "#e74c3c",
    bg: "#1a1a1a",
    mapStyle: "mapbox://styles/mapbox/navigation-night-v1",
  },
] as const;

// Mapbox token from environment
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
