import { useRef, useEffect, useState } from "react";
import { Download, MapPin, Clock, Calendar, Trophy } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useAuth } from "../../features/auth/AuthContext";
import { useToast } from "../../hooks/use-toast";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
  // Total: 100% with built-in margin consideration
};

const TEMPLATE_COLORS = [
  {
    name: "Classic",
    route: "#e74c3c",
    bg: "#ffffff",
    mapStyle: "outdoors-v12",
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
  { name: "Minimal", route: "#374151", bg: "#f9fafb", mapStyle: "light-v11" },
  {
    name: "Satellite",
    route: "#ef4444",
    bg: "#000000",
    mapStyle: "satellite-v9",
  },
];

// Clean the token from your env (remove spaces)
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN?.trim();

export default function PosterGenerator({
  displayPoints,
  metadata,
  filename,
}: PosterGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenMapRef = useRef<HTMLDivElement>(null);
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
  const [mapTilesLoaded, setMapTilesLoaded] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Debug logging function
  const addDebugInfo = (info: string) => {
    console.log("DEBUG:", info);
    setDebugInfo((prev) => [...prev.slice(-4), info]); // Keep last 5 messages
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

  // Direct tile fetching with bbox for exact bounds matching
  const fetchMapboxStaticImage = async (
    bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
    width: number,
    height: number
  ): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (!MAPBOX_TOKEN) {
        reject(new Error("No Mapbox token"));
        return;
      }

      try {
        // Use bbox instead of center/zoom for exact bounds matching
        // Format: [minLng, minLat, maxLng, maxLat]
        // const bbox = `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`;

        // Add padding to the bbox to ensure route isn't at the very edge
        const latPadding = (bounds.maxLat - bounds.minLat) * 0.15; // 15% padding
        const lngPadding = (bounds.maxLng - bounds.minLng) * 0.15;

        const paddedBbox = `${bounds.minLng - lngPadding},${
          bounds.minLat - latPadding
        },${bounds.maxLng + lngPadding},${bounds.maxLat + latPadding}`;

        // Use Mapbox Static Images API with bbox and current style
        const staticUrl = `https://api.mapbox.com/styles/v1/mapbox/${currentMapStyle}/static/[${paddedBbox}]/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;

        // Log API call for monitoring
        console.log("🚨 MAPBOX API CALL:", {
          timestamp: new Date().toISOString(),
          style: currentMapStyle,
          dimensions: `${width}x${height}`,
          bbox: paddedBbox,
          trigger: width < 1000 ? "PREVIEW_UPDATE" : "FULL_POSTER_GENERATION",
          url: staticUrl.replace(MAPBOX_TOKEN, "TOKEN_HIDDEN"),
        });

        addDebugInfo(
          `📍 API Call: ${currentMapStyle} (${
            width < 1000 ? "preview" : "full"
          })`
        );

        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          addDebugInfo("✅ Static map loaded with bbox");
          resolve(img);
        };

        img.onerror = (error) => {
          addDebugInfo("❌ Static map with bbox failed");
          console.error("Static image load error:", error);
          reject(new Error("Failed to load static map"));
        };

        img.src = staticUrl;
      } catch (error) {
        addDebugInfo("❌ Static map bbox setup failed");
        reject(error);
      }
    });
  };

  // Alternative: Create a simple Leaflet map for preview
  const createPreviewMap = () => {
    if (!hiddenMapRef.current || !MAPBOX_TOKEN || !displayPoints.length) return;

    addDebugInfo("🗺️ Creating preview map");

    // Clear existing content
    hiddenMapRef.current.innerHTML = "";
    hiddenMapRef.current.style.width = "400px";
    hiddenMapRef.current.style.height = "300px";
    hiddenMapRef.current.style.display = "block";

    try {
      const map = L.map(hiddenMapRef.current, {
        attributionControl: false,
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      });

      // Add Mapbox tile layer
      L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`,
        {
          attribution: "",
          tileSize: 512,
          zoomOffset: -1,
          maxZoom: 18,
        }
      ).addTo(map);

      // Fit bounds
      const leafletBounds = L.latLngBounds(
        [metadata.bounds.minLat, metadata.bounds.minLng],
        [metadata.bounds.maxLat, metadata.bounds.maxLng]
      );

      map.fitBounds(leafletBounds, { padding: [20, 20] });

      // Add route as polyline for visual confirmation
      const routeCoords = displayPoints.map(
        (p) => [p.lat, p.lng] as [number, number]
      );
      L.polyline(routeCoords, {
        color: posterData.routeColor,
        weight: 4,
        opacity: 0.8,
      }).addTo(map);

      addDebugInfo("✅ Preview map created");
      setMapTilesLoaded(true);
    } catch (error) {
      addDebugInfo("❌ Preview map failed");
      console.error("Preview map error:", error);
    }
  };

  // Generate preview (now with real map tiles)
  const generatePreview = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Preview size (400x500 = 4:5 ratio)
    canvas.width = 400;
    canvas.height = 500;

    await renderPosterWithTiles(ctx, 400, 500, true); // true = isPreview
  };

  // Unified render function that works for both preview and full poster
  const renderPosterWithTiles = async (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    isPreview: boolean = false
  ) => {
    // const scale = isPreview ? 1 : 6; // Unused for now

    // Clear canvas
    ctx.fillStyle = posterData.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Calculate layout areas
    const headerHeight = height * PRINT_CONFIG.headerHeight;
    const mapHeight = height * PRINT_CONFIG.mapHeight;
    const statsHeight = height * PRINT_CONFIG.statsHeight;

    const mapTop = headerHeight;
    const statsTop = headerHeight + mapHeight;

    // Render header
    // renderHeader(ctx, width, headerHeight, isPreview ? 1 : 6);

    // Load and render map with tiles
    const margin = 40 * (isPreview ? 1 : 6);
    const mapWidth = width - margin * 2;
    const mapCanvasHeight = mapHeight - margin * 2;

    try {
      if (MAPBOX_TOKEN) {
        addDebugInfo(
          `📡 Fetching ${isPreview ? "preview" : "full"} map tiles...`
        );

        // Scale tile resolution properly based on canvas size
        const tileWidth = isPreview
          ? Math.floor(mapWidth / 2) // Preview: smaller tiles for speed
          : Math.floor(mapWidth / 1.5); // Full: higher resolution tiles
        const tileHeight = isPreview
          ? Math.floor(mapCanvasHeight / 2)
          : Math.floor(mapCanvasHeight / 1.5);

        addDebugInfo(
          `📐 Tile size: ${tileWidth}x${tileHeight} (canvas: ${mapWidth}x${mapCanvasHeight})`
        );

        const mapImage = await fetchMapboxStaticImage(
          metadata.bounds,
          tileWidth,
          tileHeight
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
    } catch (error) {
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

  // const renderHeader = (
  //   ctx: CanvasRenderingContext2D,
  //   width: number,
  //   height: number,
  //   scale: number
  // ) => {
  //   // Header is now just for spacing - no text since course info moved to stats
  //   // This maintains the layout proportions but keeps it clean

  //   addDebugInfo(`Header: maintaining layout spacing only`);
  // };

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

    // Calculate route positioning with bbox padding consideration
    const bounds = metadata.bounds;

    // Account for the 15% padding we added to the bbox
    const latPadding = (bounds.maxLat - bounds.minLat) * 0.15;
    const lngPadding = (bounds.maxLng - bounds.minLng) * 0.15;

    const paddedBounds = {
      minLat: bounds.minLat - latPadding,
      maxLat: bounds.maxLat + latPadding,
      minLng: bounds.minLng - lngPadding,
      maxLng: bounds.maxLng + lngPadding,
    };

    const latRange = paddedBounds.maxLat - paddedBounds.minLat;
    const lonRange = paddedBounds.maxLng - paddedBounds.minLng;

    // Determine scale to fit route in map area
    const latScale = mapHeight / latRange;
    const lonScale = mapWidth / lonRange;
    const mapScale = Math.min(latScale, lonScale);

    // Center the route using padded bounds
    const centerLat = (paddedBounds.maxLat + paddedBounds.minLat) / 2;
    const centerLon = (paddedBounds.maxLng + paddedBounds.minLng) / 2;
    const centerX = margin + mapWidth / 2;
    const centerY = top + margin + mapHeight / 2;

    // Draw route with very thin, elegant styling
    ctx.strokeStyle = posterData.routeColor;
    ctx.lineWidth = Math.max(1, 2 * scale); // Even thinner: 2px preview, 12px full
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Remove shadow for cleaner look
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.beginPath();

    displayPoints.forEach((point, index) => {
      const x = centerX + (point.lng - centerLon) * mapScale;
      const y = centerY - (point.lat - centerLat) * mapScale;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // Smaller, more elegant start marker (green circle)
    const startPoint = displayPoints[0];
    const startX = centerX + (startPoint.lng - centerLon) * mapScale;
    const startY = centerY - (startPoint.lat - centerLat) * mapScale;

    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(startX, startY, Math.max(4, 8 * scale), 0, Math.PI * 2); // Smaller: 8px preview, 48px full
    ctx.fill();

    // Thinner white border on start marker
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(1, 2 * scale); // Thinner border
    ctx.stroke();

    // Finish marker if different from start
    const endPoint = displayPoints[displayPoints.length - 1];
    const endX = centerX + (endPoint.lng - centerLon) * mapScale;
    const endY = centerY - (endPoint.lat - centerLat) * mapScale;

    const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
    if (distance > 20) {
      ctx.fillStyle = posterData.routeColor;
      ctx.beginPath();
      ctx.arc(endX, endY, Math.max(4, 8 * scale), 0, Math.PI * 2); // Smaller end marker too
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(1, 2 * scale); // Thinner border
      ctx.stroke();
    }
  };

  const renderStats = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    top: number,
    scale: number
  ) => {
    // Even smaller font sizes for more compact look
    const fontSize = Math.max(8, 14 * scale);
    const headerFontSize = Math.max(10, 16 * scale); // Slightly larger for course/city
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

  // Update preview when data changes (now async)
  useEffect(() => {
    generatePreview().catch((error) => {
      console.error("Preview generation failed:", error);
      addDebugInfo("❌ Preview generation failed, using fallback");
    });
  }, [posterData, displayPoints, metadata]);

  // Create preview map when component mounts
  useEffect(() => {
    if (displayPoints.length > 0) {
      createPreviewMap();
    }
  }, [displayPoints, metadata.bounds, MAPBOX_TOKEN]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Course Poster Generator
        </CardTitle>
        <p className="text-sm text-gray-600">
          Create a printable 8x10" poster of your race course with Mapbox
          satellite imagery
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
                <Label htmlFor="raceName" className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  Race Name
                </Label>
                <Input
                  id="raceName"
                  value={posterData.raceName}
                  onChange={(e) =>
                    setPosterData({ ...posterData, raceName: e.target.value })
                  }
                  placeholder="Marathon"
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
              <div>• Uses Mapbox satellite and street data</div>
              <div>• File size: ~25-30MB for optimal print quality</div>
              <div>• Generation time: 10-20 seconds (loading map tiles)</div>
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
                Preview
                {mapTilesLoaded && MAPBOX_TOKEN && (
                  <span className="text-green-600"> • Map ready ✓</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Test Map Preview - for debugging */}
        {/* {MAPBOX_TOKEN && (
          <div className="mt-4">
            <Label className="text-base font-medium">Map Preview (Debug)</Label>
            <div
              ref={hiddenMapRef}
              className="w-full h-64 border border-gray-300 rounded"
              style={{
                position: "relative",
                left: "0",
                top: "0",
                zIndex: 1,
              }}
            />
          </div>
        )} */}

        {/* Hidden full-size canvas */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </CardContent>
    </Card>
  );
}
