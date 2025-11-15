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
    mapStyle: "outdoors-v12",
  },
  {
    name: "Custom",
    route: "#be872b",
    bg: "#ffffff",
    mapStyle: "wongalex97/cmfrw0hcc00e401sjchoqg2rp",
  },
  {
    name: "Ocean",
    route: "#3498db",
    bg: "#ecf8ff",
    mapStyle: "satellite-streets-v12",
  },
  { name: "Forest", route: "#27ae60", bg: "#f0fdf4", mapStyle: "outdoors-v12" },
  { name: "Sunset", route: "#f39c12", bg: "#fef7ed", mapStyle: "light-v11" },
  { name: "Purple", route: "#9b59b6", bg: "#faf5ff", mapStyle: "dark-v11" },
  {
    name: "Night",
    route: "#e74c3c",
    bg: "#1a1a1a",
    mapStyle: "navigation-night-v1",
  },
  { name: "Minimal", route: "#f39c12", bg: "#f9fafb", mapStyle: "light-v11" },
  {
    name: "Satellite",
    route: "#ef4444",
    bg: "#000000",
    mapStyle: "satellite-v9",
  },
];

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN?.trim();

export default function PosterGeneratorV2({
  displayPoints,
  metadata,
  filename,
}: PosterGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const [currentMapStyle, setCurrentMapStyle] = useState("outdoors-v12");
  const [isGenerating, setIsGenerating] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showStartEndMarkers, setShowStartEndMarkers] = useState(true);
  const [mapZoom, setMapZoom] = useState(13); // User-controllable zoom level

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

  // Simple center + zoom fetching for reliable positioning
  const fetchMapboxStaticImage = async (
    width: number,
    height: number
  ): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (!MAPBOX_TOKEN) {
        reject(new Error("No Mapbox token"));
        return;
      }

      try {
        // Calculate center point from displayPoints
        const lats = displayPoints.map((p) => p.lat);
        const lngs = displayPoints.map((p) => p.lng);
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

        // Use center + zoom approach (reliable and simple)
        const baseUrl = currentMapStyle.includes("/")
          ? `https://api.mapbox.com/styles/v1/${currentMapStyle}`
          : `https://api.mapbox.com/styles/v1/mapbox/${currentMapStyle}`;

        // Format: /static/{lon},{lat},{zoom}/{width}x{height}@2x
        const staticUrl = `${baseUrl}/static/${centerLng},${centerLat},${mapZoom}/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}&logo=false&attribution=false`;

        console.log("🚨 MAPBOX API CALL:", {
          timestamp: new Date().toISOString(),
          style: currentMapStyle,
          center: `${centerLng.toFixed(6)}, ${centerLat.toFixed(6)}`,
          zoom: mapZoom,
          dimensions: `${width}x${height}`,
          trigger: width < 1000 ? "PREVIEW_UPDATE" : "FULL_POSTER_GENERATION",
          url: staticUrl.replace(MAPBOX_TOKEN, "TOKEN_HIDDEN"),
        });

        addDebugInfo(
          `📍 API Call: zoom ${mapZoom} (${
            width < 1000 ? "preview" : "full"
          })`
        );

        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          addDebugInfo("✅ Static map loaded");
          resolve(img);
        };

        img.onerror = (error) => {
          console.error("DETAILED ERROR:", error);
          console.error(
            "FAILED URL:",
            staticUrl.replace(MAPBOX_TOKEN, "TOKEN_HIDDEN")
          );
          addDebugInfo("❌ Static map failed");
          reject(new Error("Failed to load static map"));
        };

        img.src = staticUrl;
      } catch (error) {
        addDebugInfo("❌ Static map setup failed");
        reject(error);
      }
    });
  };

  // Generate preview
  const generatePreview = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Preview size (400x500 = 4:5 ratio)
    canvas.width = 400;
    canvas.height = 500;

    await renderPosterWithTiles(ctx, 400, 500, true);
  };

  // Unified render function that works for both preview and full poster
  const renderPosterWithTiles = async (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    isPreview: boolean = false
  ) => {
    // Clear canvas
    ctx.fillStyle = posterData.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Calculate layout areas
    const headerHeight = height * PRINT_CONFIG.headerHeight;
    const mapHeight = height * PRINT_CONFIG.mapHeight;
    const statsHeight = height * PRINT_CONFIG.statsHeight;

    const mapTop = headerHeight;
    const statsTop = headerHeight + mapHeight;

    // Load and render map with tiles
    const margin = 40 * (isPreview ? 1 : 6);
    const mapWidth = width - margin * 2;
    const mapCanvasHeight = mapHeight - margin * 2;

    try {
      if (MAPBOX_TOKEN) {
        addDebugInfo(
          `📡 Fetching ${isPreview ? "preview" : "full"} map tiles...`
        );

        const mapImage = await fetchMapboxStaticImage(
          mapWidth,
          mapCanvasHeight
        );

        // Draw the map image
        ctx.drawImage(
          mapImage,
          margin,
          mapTop + margin,
          mapWidth,
          mapCanvasHeight
        );

        addDebugInfo(`✅ ${isPreview ? "Preview" : "Full"} map tiles rendered`);
      } else {
        throw new Error("No Mapbox token");
      }
    } catch (_error) {
      addDebugInfo(`❌ Map tiles failed, using fallback`);

      // Fallback: draw simple background
      const bgColor =
        posterData.backgroundColor === "#1a1a1a" ? "#2a2a2a" : "#f8f9fa";
      ctx.fillStyle = bgColor;
      ctx.fillRect(margin, mapTop + margin, mapWidth, mapCanvasHeight);

      // Add a border to show the map area
      ctx.strokeStyle =
        posterData.backgroundColor === "#1a1a1a" ? "#404040" : "#e5e7eb";
      ctx.lineWidth = 4;
      ctx.strokeRect(margin, mapTop + margin, mapWidth, mapCanvasHeight);
    }

    // Draw route overlay (this will always work)
    renderRouteOverlay(ctx, width, mapHeight, mapTop, isPreview ? 1 : 6);

    // Render stats
    renderStats(ctx, width, statsHeight, statsTop, isPreview ? 1 : 6);
  };

  // Generate full quality poster with map tiles
  const generateFullPoster = async () => {
    if (!canvasRef.current) return;

    setIsGenerating(true);
    addDebugInfo("🚀 Starting poster generation");

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Full print quality
      canvas.width = PRINT_CONFIG.width;
      canvas.height = PRINT_CONFIG.height;

      // Use the unified render function
      await renderPosterWithTiles(
        ctx,
        PRINT_CONFIG.width,
        PRINT_CONFIG.height,
        false
      );

      addDebugInfo("💾 Exporting poster...");

      // Export as blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Auto-download
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

  const renderRouteOverlay = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    top: number,
    scale: number
  ) => {
    if (!displayPoints || displayPoints.length === 0) return;

    const margin = 40 * scale;
    const mapWidth = width - margin * 2;
    const mapHeight = height - margin * 2;

    // Calculate center point (same as map tiles)
    const lats = displayPoints.map((p) => p.lat);
    const lngs = displayPoints.map((p) => p.lng);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    // Calculate pixel scale based on zoom level
    // At zoom level z, the map is 256 * 2^z pixels wide for the whole world
    // So 1 degree longitude = (256 * 2^z) / 360 pixels
    const worldPixels = 256 * Math.pow(2, mapZoom);
    const pixelsPerDegreeLng = worldPixels / 360;
    const pixelsPerDegreeLat =
      (worldPixels / 360) * Math.cos((centerLat * Math.PI) / 180);

    const centerX = margin + mapWidth / 2;
    const centerY = top + margin + mapHeight / 2;

    // Draw route
    ctx.strokeStyle = posterData.routeColor;
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();

    displayPoints.forEach((point, index) => {
      const x = centerX + (point.lng - centerLng) * pixelsPerDegreeLng;
      const y = centerY - (point.lat - centerLat) * pixelsPerDegreeLat;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Start/end markers
    if (showStartEndMarkers) {
      const startPoint = displayPoints[0];
      const startX = centerX + (startPoint.lng - centerLng) * pixelsPerDegreeLng;
      const startY = centerY - (startPoint.lat - centerLat) * pixelsPerDegreeLat;

      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(startX, startY, Math.max(4, 8 * scale), 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(1, 2 * scale);
      ctx.stroke();

      const endPoint = displayPoints[displayPoints.length - 1];
      const endX = centerX + (endPoint.lng - centerLng) * pixelsPerDegreeLng;
      const endY = centerY - (endPoint.lat - centerLat) * pixelsPerDegreeLat;

      const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
      if (distance > 20) {
        ctx.fillStyle = posterData.routeColor;
        ctx.beginPath();
        ctx.arc(endX, endY, Math.max(4, 8 * scale), 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(1, 2 * scale);
        ctx.stroke();
      }
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

    // Create two lines: course/city header and athlete stats
    const courseText = `${posterData.city.toUpperCase()} | ${posterData.raceName.toUpperCase()}`;
    const statsText = `${posterData.athleteName} | ${posterData.time} | ${posterData.distance} | ${posterData.date}`;

    // Calculate positioning for two centered lines
    const lineSpacing = Math.max(20, 35 * scale);
    const centerY = top + height / 2;
    const courseY = centerY - lineSpacing / 2;
    const statsY = centerY + lineSpacing / 2;

    const maxWidth = width - margin * 2;

    // Auto-scale course text if too long
    let actualCourseFontSize = headerFontSize;
    do {
      ctx.font = `bold ${actualCourseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      const textWidth = ctx.measureText(courseText).width;
      if (textWidth <= maxWidth) break;
      actualCourseFontSize -= 1;
    } while (actualCourseFontSize > 8);

    // Auto-scale stats text if too long
    let actualStatsFontSize = fontSize;
    do {
      ctx.font = `${actualStatsFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      const textWidth = ctx.measureText(statsText).width;
      if (textWidth <= maxWidth) break;
      actualStatsFontSize -= 1;
    } while (actualStatsFontSize > 6);

    // Render the course/city line (bold)
    ctx.fillStyle = textColor;
    ctx.font = `bold ${actualCourseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.fillText(courseText, width / 2, courseY);

    // Render the athlete stats line (regular weight)
    ctx.font = `${actualStatsFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.fillText(statsText, width / 2, statsY);

    addDebugInfo(
      `✅ Course: "${courseText}" at fontSize=${actualCourseFontSize}`
    );
    addDebugInfo(`✅ Stats: "${statsText}" at fontSize=${actualStatsFontSize}`);
  };

  // Update preview when data changes
  useEffect(() => {
    generatePreview().catch((error) => {
      console.error("Preview generation failed:", error);
      addDebugInfo("❌ Preview generation failed, using fallback");
    });
  }, [posterData, displayPoints, mapZoom, showStartEndMarkers]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Course Poster Generator V2
        </CardTitle>
        <p className="text-sm text-gray-600">
          Create a printable 8x10" poster with adjustable zoom control
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

        {/* Map Zoom Level */}
        <div>
          <Label className="text-base font-medium">Map Zoom Level</Label>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-sm text-gray-600 w-12">Far</span>
            <input
              type="range"
              min="10"
              max="18"
              step="0.5"
              value={mapZoom}
              onChange={(e) => setMapZoom(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-gray-600 w-12">Close</span>
            <span className="text-sm font-medium text-blue-600 w-12">
              {mapZoom.toFixed(1)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Adjust zoom to frame your route perfectly
          </p>
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
              disabled={isGenerating || !MAPBOX_TOKEN}
              className="w-full"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating
                ? "Generating Map..."
                : 'Generate 8×10" Poster (300 DPI)'}
            </Button>

            <div className="text-xs text-gray-500 space-y-1">
              <div>• Uses center + zoom for reliable positioning</div>
              <div>• Adjust zoom slider to frame your route</div>
              <div>• File size: ~25-30MB for optimal print quality</div>
              <div>• Ready for professional printing</div>
              {!MAPBOX_TOKEN && (
                <div className="text-red-500">
                  ⚠ Mapbox token not configured - maps will use fallback
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Preview</Label>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <canvas
                ref={previewCanvasRef}
                className="w-full max-w-[300px] mx-auto h-auto border border-gray-300 rounded shadow-lg"
                style={{ aspectRatio: "4/5" }}
              />
              <p className="text-xs text-gray-500 text-center mt-2">
                Preview (zoom: {mapZoom.toFixed(1)})
              </p>
            </div>
          </div>
        </div>

        {/* Hidden full-size canvas */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </CardContent>
    </Card>
  );
}
