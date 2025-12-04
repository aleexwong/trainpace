import { useRef, useEffect, useState } from "react";
import {
  Download,
  MapPin,
  Clock,
  Calendar,
  Trophy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useAuth } from "../../features/auth/AuthContext";
import { useToast } from "../../hooks/use-toast";
import { getCityFromRoute } from "../../utils/geocoding";

// Types matching your existing GPX structure
type GpxPoint = { lat: number; lng: number; ele?: number };

interface GPXMetadata {
  routeName: string;
  totalDistance: number;
  elevationGain: number;
  maxElevation: number | null;
  minElevation: number | null;
  pointCount: number;
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  hasElevationData: boolean;
}

interface PosterData {
  city: string;
  raceName: string;
  time: string;
  distance: string;
  date: string;
  athleteName: string;
  routeColor: string;
  backgroundColor: string;
}

interface PosterGeneratorProps {
  displayPoints: GpxPoint[];
  metadata: GPXMetadata;
  filename?: string;
  onDataChange?: () => void; // Callback when user makes changes
}

const PRINT_CONFIG = {
  // 8x10" at 300 DPI
  width: 2400,
  height: 3000,
  dpi: 300,
  // Layout proportions - map is the star, no header needed
  mapHeight: 0.8, // Massive 80% for ultimate map focus
  statsHeight: 0.2, // Compact stats at bottom
  headerHeight: 0.0, // No header - pure map focus
};

const TEMPLATE_COLORS = [
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
];

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN?.trim();

// Load Mapbox GL JS dynamically
let mapboxLoaded = false;
let mapboxLoadPromise: Promise<void> | null = null;

const loadMapbox = (): Promise<void> => {
  if (mapboxLoaded) return Promise.resolve();
  if (mapboxLoadPromise) return mapboxLoadPromise;

  mapboxLoadPromise = new Promise((resolve, reject) => {
    if ((window as any).mapboxgl) {
      mapboxLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.8.0/mapbox-gl.js";
    script.onload = () => {
      mapboxLoaded = true;
      resolve();
    };
    script.onerror = reject;

    const link = document.createElement("link");
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.8.0/mapbox-gl.css";
    link.rel = "stylesheet";

    document.head.appendChild(link);
    document.head.appendChild(script);
  });

  return mapboxLoadPromise;
};

// Collapsible Section Component
function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-sm font-medium transition-colors"
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isOpen && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

export default function PosterGeneratorV3({
  displayPoints,
  metadata,
  filename,
  onDataChange,
}: PosterGeneratorProps) {
  const previewMapRef = useRef<HTMLDivElement>(null);
  const previewMap = useRef<any>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const markersRef = useRef<any[]>([]); // Track markers for cleanup
  const { user } = useAuth();
  const { toast } = useToast();

  const [posterData, setPosterData] = useState<PosterData>({
    city: "Vancouver",
    raceName:
      metadata.routeName || filename?.replace(/\.[^/.]+$/, "") || "My Race",
    time: "1:30:00",
    distance: `${metadata.totalDistance.toFixed(1)} km`,
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    athleteName: user?.displayName || user?.email?.split("@")[0] || "Athlete",
    routeColor: "#e74c3c",
    backgroundColor: "#ffffff",
  });

  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [hasClickedTemplate, setHasClickedTemplate] = useState(false);
  const [currentMapStyle, setCurrentMapStyle] = useState(
    TEMPLATE_COLORS[0].mapStyle
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [, setDebugInfo] = useState<string[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [isGeocodingCity, setIsGeocodingCity] = useState(false);
  const updatePreviewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug logging function
  const addDebugInfo = (info: string) => {
    console.log("DEBUG:", info);
    setDebugInfo((prev) => [...prev.slice(-4), info]);
  };

  // Check if Mapbox token is available
  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      addDebugInfo("❌ VITE_MAPBOX_TOKEN not found");
      toast({
        title: "Configuration Error",
        description: "Mapbox token not configured. Map tiles will not load.",
        variant: "destructive",
      });
    } else {
      addDebugInfo("✅ Mapbox token found");
    }
  }, []);

  // Geocode city name from route coordinates
  useEffect(() => {
    if (!displayPoints.length || !MAPBOX_TOKEN) return;

    const geocodeCity = async () => {
      setIsGeocodingCity(true);
      addDebugInfo("🌍 Geocoding city from route...");

      const result = await getCityFromRoute(displayPoints, MAPBOX_TOKEN);

      if (result.city) {
        setPosterData((prev) => ({
          ...prev,
          city: result.city || "Vancouver",
        }));
        addDebugInfo(`📍 City detected: ${result.city}`);
      } else {
        addDebugInfo("⚠️ Could not detect city, using default");
      }

      setIsGeocodingCity(false);
    };

    geocodeCity();
  }, [displayPoints, MAPBOX_TOKEN]);

  // Update template colors and map style when template changes
  useEffect(() => {
    const template = TEMPLATE_COLORS[selectedTemplate];
    console.log(
      "🎯 Template changed to:",
      template.name,
      "| Style:",
      template.mapStyle,
      "| Color:",
      template.route
    );

    setPosterData((prev) => ({
      ...prev,
      routeColor: template.route,
      backgroundColor: template.bg,
    }));
    setCurrentMapStyle(template.mapStyle);
  }, [selectedTemplate]);

  // Initialize preview map
  useEffect(() => {
    if (!previewMapRef.current || !MAPBOX_TOKEN || !displayPoints.length)
      return;

    const initializeMap = async () => {
      try {
        await loadMapbox();

        if (previewMap.current) {
          previewMap.current.remove();
          previewMap.current = null;
        }

        const mapboxgl = (window as any).mapboxgl;
        mapboxgl.accessToken = MAPBOX_TOKEN;

        // Calculate center and proper zoom from bounds
        const lats = displayPoints.map((p) => p.lat);
        const lngs = displayPoints.map((p) => p.lng);
        const center = [
          (Math.min(...lngs) + Math.max(...lngs)) / 2,
          (Math.min(...lats) + Math.max(...lats)) / 2,
        ];

        // Calculate zoom using proper web mercator math
        const latSpan = Math.max(...lats) - Math.min(...lats);
        const lngSpan = Math.max(...lngs) - Math.min(...lngs);

        // Get container dimensions
        const containerWidth = previewMapRef.current?.offsetWidth || 400;
        const containerHeight = previewMapRef.current?.offsetHeight || 500;

        // Calculate zoom for lat and lng separately, use the smaller
        const WORLD_DIM = { height: 256, width: 256 };
        const ZOOM_MAX = 18;

        function latRad(lat: number) {
          const sin = Math.sin((lat * Math.PI) / 180);
          const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
          return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
        }

        function zoom(mapPx: number, worldPx: number, fraction: number) {
          return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
        }

        const latFraction =
          (latRad(Math.max(...lats)) - latRad(Math.min(...lats))) / Math.PI;
        const lngFraction = lngSpan / 360;

        const latZoom = zoom(containerHeight, WORLD_DIM.height, latFraction);
        const lngZoom = zoom(containerWidth, WORLD_DIM.width, lngFraction);

        // Use the lower zoom to ensure route fits, subtract 1 for padding
        const calculatedZoom = Math.min(latZoom, lngZoom, ZOOM_MAX) - 1;
        const maxSpan = Math.max(latSpan, lngSpan);
        addDebugInfo(
          `🗺️ Initial zoom: ${calculatedZoom} (span: ${(maxSpan * 111).toFixed(
            1
          )}km)`
        );

        // Initialize map with manual center/zoom - user has full control from start
        previewMap.current = new mapboxgl.Map({
          container: previewMapRef.current!,
          style: currentMapStyle,
          center: center as [number, number],
          zoom: calculatedZoom,
          interactive: true,
          preserveDrawingBuffer: true, // CRITICAL for canvas export
        });

        previewMap.current.on("load", () => {
          // Add route line
          previewMap.current.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: displayPoints.map((p) => [p.lng, p.lat]),
              },
            },
          });

          previewMap.current.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": posterData.routeColor,
              "line-width": 3,
            },
          });

          setMapReady(true);
          addDebugInfo("✅ Preview map ready");
        });
      } catch (error) {
        console.error("Failed to load Mapbox:", error);
        addDebugInfo("❌ Map initialization failed");
      }
    };

    initializeMap();

    return () => {
      if (previewMap.current) {
        previewMap.current.remove();
        previewMap.current = null;
      }
    };
  }, [displayPoints, MAPBOX_TOKEN]);

  // Update map style when template changes
  useEffect(() => {
    if (previewMap.current && mapReady) {
      const currentStyle = previewMap.current.getStyle();
      const currentStyleUrl = currentStyle?.sprite
        ?.split("/styles/")[1]
        ?.split("/")[0];
      const newStyleUrl = currentMapStyle.split("/styles/")[1]?.split("/")[0];

      console.log(
        "🎨 Style check - current:",
        currentStyleUrl,
        "| new:",
        newStyleUrl
      );

      // Only reload style if it actually changed
      if (currentStyleUrl !== newStyleUrl) {
        console.log("🔄 Style changing to:", currentMapStyle);
        previewMap.current.setStyle(currentMapStyle);

        // Re-add route after style loads
        previewMap.current.once("styledata", () => {
          console.log(
            "🎨 Style loaded, re-adding route with color:",
            posterData.routeColor
          );

          if (previewMap.current.getSource("route")) {
            previewMap.current.removeLayer("route");
            previewMap.current.removeSource("route");
          }

          previewMap.current.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: displayPoints.map((p) => [p.lng, p.lat]),
              },
            },
          });

          previewMap.current.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": posterData.routeColor,
              "line-width": 3,
            },
          });

          console.log("✅ Route layer added after style change");

          // Wait for idle to ensure everything is rendered
          previewMap.current.once("idle", () => {
            console.log("✅ Map idle after style change");
            previewMap.current.fire("moveend"); // Trigger canvas redraw
          });
        });
      } else {
        console.log(
          "⏭️ Same style, skipping reload - color will update separately"
        );
      }
    }
  }, [currentMapStyle, mapReady, displayPoints]);

  // Update route color when it changes
  useEffect(() => {
    if (!previewMap.current || !mapReady) {
      console.log("⏳ Color update blocked: map not ready");
      return;
    }

    // Short delay to ensure style change effect completed if triggered
    const timer = setTimeout(() => {
      // Wait for style to be fully loaded before updating paint properties
      if (!previewMap.current.isStyleLoaded()) {
        console.log("⏳ Style not loaded, skipping color update");
        return;
      }

      // Check if layer exists before updating
      if (previewMap.current.getLayer("route")) {
        console.log("🎨 Updating route color to:", posterData.routeColor);
        previewMap.current.setPaintProperty(
          "route",
          "line-color",
          posterData.routeColor
        );

        // Force a repaint to ensure the color change is visible
        previewMap.current.triggerRepaint();
      } else {
        console.log("⚠️ Route layer not found for color update");
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [posterData.routeColor, mapReady]);

  // Manage markers when toggle changes
  useEffect(() => {
    if (!previewMap.current || !mapReady || !displayPoints.length) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  }, [mapReady, displayPoints, posterData.routeColor]);

  // Update poster preview canvas whenever map or data changes
  useEffect(() => {
    if (!previewMap.current || !mapReady || !previewCanvasRef.current) return;

    const updatePreview = () => {
      if (updatePreviewTimeoutRef.current) {
        clearTimeout(updatePreviewTimeoutRef.current);
      }

      updatePreviewTimeoutRef.current = setTimeout(() => {
        if (!previewMap.current || !previewCanvasRef.current) {
          console.log("Preview update skipped: missing refs");
          return;
        }

        console.log(
          "Drawing stats overlay with data:",
          posterData.city,
          posterData.time
        );
        const canvas = previewCanvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size to match container (retina)
        const displayWidth = canvas.offsetWidth;
        const displayHeight = canvas.offsetHeight;
        const scale = window.devicePixelRatio || 2;
        canvas.width = displayWidth * scale;
        canvas.height = displayHeight * scale;
        canvas.style.width = displayWidth + "px";
        canvas.style.height = displayHeight + "px";
        ctx.scale(scale, scale);

        // Clear canvas
        ctx.clearRect(0, 0, displayWidth, displayHeight);

        // Only draw stats at the bottom - map is already visible underneath
        const statsHeight = displayHeight * PRINT_CONFIG.statsHeight;
        const statsTop = displayHeight * PRINT_CONFIG.mapHeight;

        // Draw stats background
        ctx.fillStyle = posterData.backgroundColor;
        ctx.fillRect(0, statsTop, displayWidth, statsHeight);

        // Draw stats text
        const statsScale = displayWidth / PRINT_CONFIG.width;
        renderStats(ctx, displayWidth, statsHeight, statsTop, statsScale);
      }, 50);
    };

    updatePreview();
  }, [posterData]);

  // Set up map event listeners separately (only once)
  useEffect(() => {
    if (!previewMap.current || !mapReady) return;

    const updatePreview = () => {
      if (updatePreviewTimeoutRef.current) {
        clearTimeout(updatePreviewTimeoutRef.current);
      }

      updatePreviewTimeoutRef.current = setTimeout(() => {
        if (!previewMap.current || !previewCanvasRef.current) return;

        const canvas = previewCanvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const displayWidth = canvas.offsetWidth;
        const displayHeight = canvas.offsetHeight;
        const scale = window.devicePixelRatio || 2;
        canvas.width = displayWidth * scale;
        canvas.height = displayHeight * scale;
        canvas.style.width = displayWidth + "px";
        canvas.style.height = displayHeight + "px";
        ctx.scale(scale, scale);

        ctx.clearRect(0, 0, displayWidth, displayHeight);

        const statsHeight = displayHeight * PRINT_CONFIG.statsHeight;
        const statsTop = displayHeight * PRINT_CONFIG.mapHeight;

        ctx.fillStyle = posterData.backgroundColor;
        ctx.fillRect(0, statsTop, displayWidth, statsHeight);

        const statsScale = displayWidth / PRINT_CONFIG.width;
        renderStats(ctx, displayWidth, statsHeight, statsTop, statsScale);
      }, 50);
    };

    const onMapUpdate = () => {
      updatePreview();
      onDataChange?.(); // Track map movements as changes
    };
    previewMap.current.on("moveend", onMapUpdate);

    return () => {
      if (previewMap.current) {
        previewMap.current.off("moveend", onMapUpdate);
      }
      if (updatePreviewTimeoutRef.current) {
        clearTimeout(updatePreviewTimeoutRef.current);
      }
    };
  }, [mapReady]);

  // Generate full quality poster DIRECTLY from preview map
  const generateFullPoster = async () => {
    if (!previewMap.current || !mapReady) {
      toast({
        title: "Map Not Ready",
        description: "Please wait for the map to finish loading.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    addDebugInfo("🚀 Starting poster generation");

    try {
      // Wait for preview map to be fully loaded
      await new Promise<void>((resolve) => {
        if (previewMap.current.loaded()) {
          resolve();
        } else {
          previewMap.current.once("idle", () => resolve());
        }
      });

      addDebugInfo("📸 Capturing preview map");

      // Get the preview map canvas directly
      const previewCanvas = previewMap.current.getCanvas();

      // Create final poster canvas at print resolution
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = PRINT_CONFIG.width;
      finalCanvas.height = PRINT_CONFIG.height;
      const ctx = finalCanvas.getContext("2d", {
        alpha: false,
        desynchronized: false,
      })!;

      // Enable high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fill background
      ctx.fillStyle = posterData.backgroundColor;
      ctx.fillRect(0, 0, PRINT_CONFIG.width, PRINT_CONFIG.height);

      // Calculate map area with margins
      const margin = PRINT_CONFIG.width * 0.05;
      const mapWidth = PRINT_CONFIG.width - margin * 2;
      const mapHeight =
        PRINT_CONFIG.height * PRINT_CONFIG.mapHeight - margin * 2;

      // Draw the preview map scaled up to print resolution
      ctx.drawImage(
        previewCanvas,
        0,
        0,
        previewCanvas.width,
        previewCanvas.height,
        margin,
        margin,
        mapWidth,
        mapHeight
      );

      // Draw stats
      const statsTop = PRINT_CONFIG.height * PRINT_CONFIG.mapHeight;
      renderStats(
        ctx,
        PRINT_CONFIG.width,
        PRINT_CONFIG.height * PRINT_CONFIG.statsHeight,
        statsTop,
        6
      );

      addDebugInfo("💾 Exporting poster");

      // Export
      finalCanvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const safeRaceName = posterData.raceName.replace(
              /[^a-zA-Z0-9]/g,
              "_"
            );
            link.download = `${safeRaceName}_poster_8x10_300dpi.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);

            addDebugInfo("✅ Poster downloaded!");
            toast({
              title: "Poster Generated!",
              description: "Your high-quality poster has been downloaded.",
            });
          }

          setIsGenerating(false);
        },
        "image/png",
        1.0
      );
    } catch (error) {
      addDebugInfo("❌ Generation failed");
      console.error("Error generating poster:", error);
      toast({
        title: "Generation Failed",
        description:
          "There was an error creating your poster. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  const renderStats = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    top: number,
    scale: number
  ) => {
    // Enable text rendering quality hints
    ctx.textRendering = "optimizeLegibility" as any;
    ctx.fontKerning = "normal" as any;

    const fontSize = Math.max(8, 14 * scale);
    const headerFontSize = Math.max(10, 16 * scale);
    const margin = 60 * scale;

    const textColor =
      posterData.backgroundColor === "#1a1a1a" ? "#ffffff" : "#000000";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const courseText = `${posterData.city.toUpperCase()} | ${posterData.raceName.toUpperCase()}`;
    const statsText = `${posterData.athleteName} | ${posterData.time} | ${posterData.distance} | ${posterData.date}`;

    const lineSpacing = Math.max(20, 35 * scale);
    const centerY = top + height / 2;
    const courseY = centerY - lineSpacing / 2;
    const statsY = centerY + lineSpacing / 2;

    const maxWidth = width - margin * 2;

    let actualCourseFontSize = headerFontSize;
    do {
      ctx.font = `bold ${actualCourseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      const textWidth = ctx.measureText(courseText).width;
      if (textWidth <= maxWidth) break;
      actualCourseFontSize -= 1;
    } while (actualCourseFontSize > 8);

    let actualStatsFontSize = fontSize;
    do {
      ctx.font = `${actualStatsFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      const textWidth = ctx.measureText(statsText).width;
      if (textWidth <= maxWidth) break;
      actualStatsFontSize -= 1;
    } while (actualStatsFontSize > 6);

    ctx.fillStyle = textColor;
    ctx.font = `bold ${actualCourseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.fillText(courseText, width / 2, courseY);

    ctx.font = `${actualStatsFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.fillText(statsText, width / 2, statsY);
  };

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Course Poster Generator
        </CardTitle>
        <p className="text-sm text-gray-600">
          Create your custom race poster with live preview and full
          customization
        </p>
      </CardHeader>

      <CardContent>
        {/* Two-Column Layout */}
        <div className="grid lg:grid-cols-[60%_40%] gap-6">
          {/* LEFT: POSTER PREVIEW (Dominant 60%) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Live Preview</Label>
              {mapReady && (
                <span className="text-xs text-green-600 font-medium">
                  Ready ✓
                </span>
              )}
            </div>

            <div className="relative">
              <div
                className="border-2 border-gray-300 rounded-lg overflow-hidden relative shadow-lg"
                style={{
                  aspectRatio: "4/5",
                  backgroundColor: posterData.backgroundColor,
                }}
              >
                {/* Interactive map with 5% padding to match final poster */}
                <div
                  ref={previewMapRef}
                  style={{
                    position: "absolute",
                    top: "2.5%",
                    left: "2.5%",
                    width: "95%",
                    height: `${80 * 0.95}%`,
                    zIndex: 1,
                  }}
                />
                {/* Canvas overlay with stats text */}
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 2,
                  }}
                />
              </div>

              {/* Loading overlay */}
              {!hasClickedTemplate && (
                <div
                  className="absolute inset-0 border-2 border-gray-300 rounded-lg bg-white/65 flex items-center justify-center backdrop-blur-sm"
                  style={{
                    zIndex: 50,
                  }}
                >
                  <div className="text-center space-y-2 px-4">
                    <p className="text-base text-gray-700 font-semibold">
                      👉 Select a color template to start
                    </p>
                    <p className="text-sm text-gray-500">
                      Preview will appear here
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500 space-y-1 text-center">
              <p className="font-medium">
                🖱️ Drag to pan • 🔍 Scroll to zoom • Frame your route
              </p>
              <p className="text-blue-600 font-medium">
                This exact poster will be downloaded at 300 DPI
              </p>
            </div>
          </div>

          {/* RIGHT: CONTROLS PANEL (40%) - Stacked Collapsible Groups */}
          <div className="space-y-4">
            {/* Export */}
            <CollapsibleSection title="💾 Export" defaultOpen={true}>
              <Button
                onClick={generateFullPoster}
                disabled={isGenerating || !MAPBOX_TOKEN || !mapReady}
                className="w-full"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                {isGenerating
                  ? "Generating..."
                  : 'Download 8×10" Poster (300 DPI)'}
              </Button>

              <div className="text-xs text-gray-500 space-y-1 mt-3">
                <div>✓ Frame your route with the map controls</div>
                <div>✓ Customize all details below</div>
                <div>✓ Download print-ready 300 DPI poster</div>
                {!MAPBOX_TOKEN && (
                  <div className="text-red-500">
                    ⚠️ Mapbox token not configured
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Color Template */}
            <CollapsibleSection title="🎨 Color Template" defaultOpen={true}>
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATE_COLORS.slice(1).map((template, index) => {
                  const actualIndex = index + 1;
                  return (
                    <button
                      key={template.name}
                      onClick={() => {
                        setSelectedTemplate(actualIndex);
                        setHasClickedTemplate(true);
                        onDataChange?.();
                      }}
                      className={`
                        relative h-16 rounded-lg border-2 transition-all
                        ${
                          selectedTemplate === actualIndex
                            ? "border-blue-500 ring-2 ring-blue-200 scale-105"
                            : "border-gray-200 hover:border-gray-300"
                        }
                      `}
                      style={{ backgroundColor: template.bg }}
                    >
                      <div
                        className="absolute inset-2 rounded-md"
                        style={{
                          backgroundColor: template.route,
                          opacity: 0.7,
                        }}
                      />
                      <span className="absolute bottom-0 left-0 right-0 text-[10px] font-medium text-center bg-black bg-opacity-60 text-white rounded-b-lg py-1">
                        {template.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CollapsibleSection>

            {/* Race Details */}
            <CollapsibleSection title="🏁 Race Details" defaultOpen={true}>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="raceName" className="text-sm">
                    Race Title
                  </Label>
                  <Input
                    id="raceName"
                    value={posterData.raceName}
                    onChange={(e) => {
                      setPosterData({
                        ...posterData,
                        raceName: e.target.value,
                      });
                      onDataChange?.();
                    }}
                    placeholder="Bank of America Chicago Marathon"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label
                      htmlFor="city"
                      className="text-sm flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      City
                      {isGeocodingCity && (
                        <span className="text-xs text-blue-600">...</span>
                      )}
                    </Label>
                    <Input
                      id="city"
                      value={posterData.city}
                      onChange={(e) => {
                        setPosterData({ ...posterData, city: e.target.value });
                        onDataChange?.();
                      }}
                      placeholder="Vancouver"
                      disabled={isGeocodingCity}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="distance" className="text-sm">
                      Distance
                    </Label>
                    <Input
                      id="distance"
                      value={posterData.distance}
                      onChange={(e) => {
                        setPosterData({
                          ...posterData,
                          distance: e.target.value,
                        });
                        onDataChange?.();
                      }}
                      placeholder="42.195 km"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label
                      htmlFor="time"
                      className="text-sm flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      Time
                    </Label>
                    <Input
                      id="time"
                      value={posterData.time}
                      onChange={(e) => {
                        setPosterData({ ...posterData, time: e.target.value });
                        onDataChange?.();
                      }}
                      placeholder="3:45:22"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="date"
                      className="text-sm flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      Race Date
                    </Label>
                    <Input
                      id="date"
                      value={posterData.date}
                      onChange={(e) => {
                        setPosterData({ ...posterData, date: e.target.value });
                        onDataChange?.();
                      }}
                      placeholder="Sep 21, 2025"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Athlete Details */}
            <CollapsibleSection title="👤 Athlete Details" defaultOpen={false}>
              <div>
                <Label htmlFor="athleteName" className="text-sm">
                  Athlete Name
                </Label>
                <Input
                  id="athleteName"
                  value={posterData.athleteName}
                  onChange={(e) => {
                    setPosterData({
                      ...posterData,
                      athleteName: e.target.value,
                    });
                    onDataChange?.();
                  }}
                  placeholder="Runner Name"
                  className="mt-1"
                />
              </div>
            </CollapsibleSection>

            {/* Route Styling */}
            <CollapsibleSection title="🎨 Route Styling" defaultOpen={false}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="routeColor" className="text-sm">
                    Route Color
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="color"
                      id="routeColor"
                      value={posterData.routeColor}
                      onChange={(e) => {
                        setPosterData({
                          ...posterData,
                          routeColor: e.target.value,
                        });
                        onDataChange?.();
                      }}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <Input
                      value={posterData.routeColor}
                      onChange={(e) => {
                        setPosterData({
                          ...posterData,
                          routeColor: e.target.value,
                        });
                        onDataChange?.();
                      }}
                      placeholder="#e74c3c"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="backgroundColor" className="text-sm">
                    Background
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="color"
                      id="backgroundColor"
                      value={posterData.backgroundColor}
                      onChange={(e) => {
                        setPosterData({
                          ...posterData,
                          backgroundColor: e.target.value,
                        });
                        onDataChange?.();
                      }}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <Input
                      value={posterData.backgroundColor}
                      onChange={(e) => {
                        setPosterData({
                          ...posterData,
                          backgroundColor: e.target.value,
                        });
                        onDataChange?.();
                      }}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
