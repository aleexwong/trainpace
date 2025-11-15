import { useRef, useEffect, useState } from "react";
import { Download, MapPin, Clock, Calendar, Trophy } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useAuth } from "../../features/auth/AuthContext";
import { useToast } from "../../hooks/use-toast";

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
    mapStyle: "mapbox://styles/mapbox/outdoors-v12" 
  },
  { 
    name: "Sunset", 
    route: "#f39c12", 
    bg: "#fef7ed", 
    mapStyle: "mapbox://styles/mapbox/light-v11" 
  },
  { 
    name: "Purple", 
    route: "#9b59b6", 
    bg: "#faf5ff", 
    mapStyle: "mapbox://styles/mapbox/dark-v11" 
  },
  {
    name: "Night",
    route: "#e74c3c",
    bg: "#1a1a1a",
    mapStyle: "mapbox://styles/mapbox/navigation-night-v1",
  },
  { 
    name: "Minimal", 
    route: "#f39c12", 
    bg: "#f9fafb", 
    mapStyle: "mapbox://styles/mapbox/light-v11" 
  },
  {
    name: "Satellite",
    route: "#ef4444",
    bg: "#000000",
    mapStyle: "mapbox://styles/mapbox/satellite-v9",
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
    script.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js";
    script.onload = () => {
      mapboxLoaded = true;
      resolve();
    };
    script.onerror = reject;

    const link = document.createElement("link");
    link.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css";
    link.rel = "stylesheet";

    document.head.appendChild(link);
    document.head.appendChild(script);
  });

  return mapboxLoadPromise;
};

export default function PosterGeneratorV3({
  displayPoints,
  metadata,
  filename,
}: PosterGeneratorProps) {
  const previewMapRef = useRef<HTMLDivElement>(null);
  const previewMap = useRef<any>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const [posterData, setPosterData] = useState<PosterData>({
    city: "Vancouver",
    raceName:
      metadata.routeName || filename?.replace(/\.[^/.]+$/, "") || "My Race",
    time: "",
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
  const [currentMapStyle, setCurrentMapStyle] = useState(TEMPLATE_COLORS[0].mapStyle);
  const [isGenerating, setIsGenerating] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showStartEndMarkers, setShowStartEndMarkers] = useState(true);
  const [mapReady, setMapReady] = useState(false);
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

  // Update template colors and map style when template changes
  useEffect(() => {
    const template = TEMPLATE_COLORS[selectedTemplate];
    setPosterData((prev) => ({
      ...prev,
      routeColor: template.route,
      backgroundColor: template.bg,
    }));
    setCurrentMapStyle(template.mapStyle);
  }, [selectedTemplate]);

  // Initialize preview map
  useEffect(() => {
    if (!previewMapRef.current || !MAPBOX_TOKEN || !displayPoints.length) return;

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
        const containerWidth = previewMapRef.current.offsetWidth;
        const containerHeight = previewMapRef.current.offsetHeight;
        
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
        
        const latFraction = (latRad(Math.max(...lats)) - latRad(Math.min(...lats))) / Math.PI;
        const lngFraction = lngSpan / 360;
        
        const latZoom = zoom(containerHeight, WORLD_DIM.height, latFraction);
        const lngZoom = zoom(containerWidth, WORLD_DIM.width, lngFraction);
        
        // Use the lower zoom to ensure route fits, subtract 1 for padding
        const calculatedZoom = Math.min(latZoom, lngZoom, ZOOM_MAX) - 1;
        const maxSpan = Math.max(latSpan, lngSpan);
        addDebugInfo(`🗺️ Initial zoom: ${calculatedZoom} (span: ${(maxSpan * 111).toFixed(1)}km)`);

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

          if (showStartEndMarkers && displayPoints.length > 1) {
            const start = displayPoints[0];
            const end = displayPoints[displayPoints.length - 1];

            new mapboxgl.Marker({ color: "#22c55e" })
              .setLngLat([start.lng, start.lat])
              .addTo(previewMap.current);

            new mapboxgl.Marker({ color: posterData.routeColor })
              .setLngLat([end.lng, end.lat])
              .addTo(previewMap.current);
          }

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
      previewMap.current.setStyle(currentMapStyle);
      
      // Re-add route after style loads
      previewMap.current.once("styledata", () => {
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
      });
    }
  }, [currentMapStyle, mapReady]);

  // Update route color when it changes
  useEffect(() => {
    if (previewMap.current && mapReady && previewMap.current.getLayer("route")) {
      previewMap.current.setPaintProperty("route", "line-color", posterData.routeColor);
    }
  }, [posterData.routeColor, mapReady]);

  // Update poster preview canvas whenever map or data changes
  useEffect(() => {
    if (!previewMap.current || !mapReady || !previewCanvasRef.current) return;

    const updatePreview = () => {
      if (updatePreviewTimeoutRef.current) {
        clearTimeout(updatePreviewTimeoutRef.current);
      }

      updatePreviewTimeoutRef.current = setTimeout(() => {
        if (!previewMap.current || !previewCanvasRef.current) return;

        const mapCanvas = previewMap.current.getCanvas();
        const canvas = previewCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match container (retina)
        const displayWidth = canvas.offsetWidth;
        const displayHeight = canvas.offsetHeight;
        const scale = window.devicePixelRatio || 2;
        canvas.width = displayWidth * scale;
        canvas.height = displayHeight * scale;
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        ctx.scale(scale, scale);

        // Calculate layout
        const margin = displayWidth * 0.05;
        const mapHeight = displayHeight * PRINT_CONFIG.mapHeight;
        const statsHeight = displayHeight * PRINT_CONFIG.statsHeight;

        // Fill background
        ctx.fillStyle = posterData.backgroundColor;
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        // Draw map
        const mapWidth = displayWidth - (margin * 2);
        const mapDrawHeight = mapHeight - (margin * 2);
        ctx.drawImage(mapCanvas, margin, margin, mapWidth, mapDrawHeight);

        // Draw stats
        const statsScale = displayWidth / PRINT_CONFIG.width;
        renderStats(ctx, displayWidth, statsHeight, mapHeight, statsScale);
      }, 150);
    };

    updatePreview();

    // Update on map move
    const onMapUpdate = () => updatePreview();
    previewMap.current.on('moveend', onMapUpdate);
    previewMap.current.on('idle', onMapUpdate);

    return () => {
      if (previewMap.current) {
        previewMap.current.off('moveend', onMapUpdate);
        previewMap.current.off('idle', onMapUpdate);
      }
      if (updatePreviewTimeoutRef.current) {
        clearTimeout(updatePreviewTimeoutRef.current);
      }
    };
  }, [mapReady, posterData, showStartEndMarkers]);

  // Generate full quality poster DIRECTLY from preview map (no hidden map)
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
          previewMap.current.once('idle', () => resolve());
        }
      });

      addDebugInfo("📸 Capturing preview map");

      // Get the preview map canvas directly - this is what you see
      const previewCanvas = previewMap.current.getCanvas();

      // Create final poster canvas at print resolution
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = PRINT_CONFIG.width;
      finalCanvas.height = PRINT_CONFIG.height;
      const ctx = finalCanvas.getContext("2d")!;

      // Fill background
      ctx.fillStyle = posterData.backgroundColor;
      ctx.fillRect(0, 0, PRINT_CONFIG.width, PRINT_CONFIG.height);

      // Calculate map area with margins
      const margin = PRINT_CONFIG.width * 0.05;
      const mapWidth = PRINT_CONFIG.width - (margin * 2);
      const mapHeight = PRINT_CONFIG.height * PRINT_CONFIG.mapHeight - (margin * 2);

      // Draw the preview map scaled up to print resolution
      // This is EXACTLY what you see in the preview
      ctx.drawImage(
        previewCanvas,
        0, 0, previewCanvas.width, previewCanvas.height, // source
        margin, margin, mapWidth, mapHeight // destination
      );

      // Draw stats
      const statsTop = PRINT_CONFIG.height * PRINT_CONFIG.mapHeight;
      renderStats(ctx, PRINT_CONFIG.width, PRINT_CONFIG.height * PRINT_CONFIG.statsHeight, statsTop, 6);

      addDebugInfo("💾 Exporting poster");

      // Export
      finalCanvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const safeRaceName = posterData.raceName.replace(/[^a-zA-Z0-9]/g, "_");
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
        description: "There was an error creating your poster. Please try again.",
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Course Poster Generator V3
        </CardTitle>
        <p className="text-sm text-gray-600">
          Using Mapbox GL JS for perfect route alignment
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Debug Info */}
        {debugInfo.length > 0 && (
          <div className="bg-gray-100 p-3 rounded text-xs font-mono">
            <div className="font-bold mb-1">Debug Info:</div>
            {debugInfo.map((info, i) => (
              <div key={i}>{info}</div>
            ))}
          </div>
        )}

        {/* Template Selection */}
        <div>
          <Label className="text-base font-medium">Color Template</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {TEMPLATE_COLORS.map((template, index) => (
              <button
                key={template.name}
                onClick={() => setSelectedTemplate(index)}
                className={`
                  relative h-12 rounded-lg border-2 transition-all
                  ${
                    selectedTemplate === index
                      ? "border-blue-500 scale-105"
                      : "border-gray-200 hover:border-gray-300"
                  }
                `}
                style={{ backgroundColor: template.bg }}
              >
                <div
                  className="absolute inset-2 rounded-md"
                  style={{ backgroundColor: template.route, opacity: 0.7 }}
                />
                <span className="absolute bottom-0 left-0 right-0 text-xs font-medium text-center bg-black bg-opacity-50 text-white rounded-b-lg py-0.5">
                  {template.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Start/End Markers Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showMarkers"
            checked={showStartEndMarkers}
            onChange={(e) => setShowStartEndMarkers(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <Label
            htmlFor="showMarkers"
            className="text-sm font-medium cursor-pointer"
          >
            Show start/end markers
          </Label>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city" className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  City
                </Label>
                <Input
                  id="city"
                  value={posterData.city}
                  onChange={(e) =>
                    setPosterData({ ...posterData, city: e.target.value })
                  }
                  placeholder="Vancouver"
                />
              </div>

              <div>
                <Label htmlFor="time" className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Time
                </Label>
                <Input
                  id="time"
                  value={posterData.time}
                  onChange={(e) =>
                    setPosterData({ ...posterData, time: e.target.value })
                  }
                  placeholder="3:45:22"
                />
              </div>

              <div>
                <Label htmlFor="distance">Distance</Label>
                <Input
                  id="distance"
                  value={posterData.distance}
                  onChange={(e) =>
                    setPosterData({ ...posterData, distance: e.target.value })
                  }
                  placeholder="42.195 km"
                />
              </div>

              <div>
                <Label htmlFor="date" className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Date
                </Label>
                <Input
                  id="date"
                  value={posterData.date}
                  onChange={(e) =>
                    setPosterData({ ...posterData, date: e.target.value })
                  }
                  placeholder="Sep 21, 2025"
                />
              </div>

              <div>
                <Label htmlFor="athleteName">Athlete Name</Label>
                <Input
                  id="athleteName"
                  value={posterData.athleteName}
                  onChange={(e) =>
                    setPosterData({
                      ...posterData,
                      athleteName: e.target.value,
                    })
                  }
                  placeholder="Runner Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="routeColor">Route Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="routeColor"
                    value={posterData.routeColor}
                    onChange={(e) =>
                      setPosterData({
                        ...posterData,
                        routeColor: e.target.value,
                      })
                    }
                    className="w-12 h-10 rounded border border-gray-300"
                  />
                  <Input
                    value={posterData.routeColor}
                    onChange={(e) =>
                      setPosterData({
                        ...posterData,
                        routeColor: e.target.value,
                      })
                    }
                    placeholder="#e74c3c"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="backgroundColor">Background</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="backgroundColor"
                    value={posterData.backgroundColor}
                    onChange={(e) =>
                      setPosterData({
                        ...posterData,
                        backgroundColor: e.target.value,
                      })
                    }
                    className="w-12 h-10 rounded border border-gray-300"
                  />
                  <Input
                    value={posterData.backgroundColor}
                    onChange={(e) =>
                      setPosterData({
                        ...posterData,
                        backgroundColor: e.target.value,
                      })
                    }
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={generateFullPoster}
              disabled={isGenerating || !MAPBOX_TOKEN || !mapReady}
              className="w-full"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating
                ? "Generating Map..."
                : 'Generate 8×10" Poster (300 DPI)'}
            </Button>

            <div className="text-xs text-gray-500 space-y-1">
              <div>• Use the map to frame your route perfectly</div>
              <div>• Customize colors, text, and markers below</div>
              <div>• Download at 300 DPI for print-ready quality</div>
              <div className="font-semibold text-blue-600">• Simple workflow: frame, customize, download</div>
              {!MAPBOX_TOKEN && (
                <div className="text-red-500">
                  ⚠ Mapbox token not configured
                </div>
              )}
            </div>
          </div>

          {/* Preview - Map with poster overlay */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Preview Poster</Label>
            <div className="border border-gray-200 rounded-lg overflow-hidden relative" style={{ aspectRatio: "4/5" }}>
              {/* Hidden interactive map */}
              <div
                ref={previewMapRef}
                style={{
                  position: 'absolute',
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  pointerEvents: 'all'
                }}
              />
              {/* Visible poster preview */}
              <canvas
                ref={previewCanvasRef}
                style={{
                  position: 'absolute',
                  width: "100%",
                  height: "100%",
                  pointerEvents: 'none'
                }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              <span className="font-medium">Pan & zoom</span> to frame your route perfectly
              {mapReady && <span className="text-green-600"> • Ready ✓</span>}
            </p>
            <p className="text-xs text-blue-600 text-center font-medium">
              This exact poster will be downloaded at 300 DPI
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
