# PosterGeneratorV3 - Mapbox GL JS Implementation

## The Problem with V2

V2 used **manual Web Mercator projection math** to draw the route line on canvas:
- Calculated pixel positions based on zoom level
- Route line didn't align with map tiles because canvas dimensions != image dimensions
- Required perfect math synchronization between static image and canvas overlay

## The Solution: V3 with Mapbox GL JS

Uses **Mapbox GL JS** to render everything - same library as ElevationPageV2!

### Key Features

1. **Perfect Alignment** ✅
   - Mapbox GL JS handles ALL coordinate transformations automatically
   - Route line and map tiles use the same rendering engine
   - No math discrepancies - guaranteed alignment

2. **Interactive Preview** ✅
   - User can pan and zoom the map
   - What you see is exactly what you get
   - Adjust framing in real-time

3. **Canvas Export** ✅
   - Uses `preserveDrawingBuffer: true` to enable canvas export
   - Creates hidden high-res map at print dimensions
   - Captures map to canvas with `.getCanvas()`

4. **Simple Implementation** ✅
   - No manual projection math
   - Same patterns as MapboxRoutePreview
   - Clean, maintainable code

## How It Works

### Preview Map
```typescript
previewMap.current = new mapboxgl.Map({
  container: previewMapRef.current!,
  style: currentMapStyle,
  bounds: bounds,
  interactive: true,
  preserveDrawingBuffer: true, // CRITICAL for export
});

// Add route using GeoJSON (same as ElevationPageV2)
previewMap.current.addSource("route", {
  type: "geojson",
  data: {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: displayPoints.map((p) => [p.lng, p.lat]),
    },
  },
});
```

### High-Res Export
```typescript
// Create hidden high-res map
const highResMap = new mapboxgl.Map({
  container: hiddenContainer,
  style: currentMapStyle,
  center: previewMap.current.getCenter(),
  zoom: mapZoom,
  preserveDrawingBuffer: true,
});

// Wait for map to load and idle
await new Promise((resolve) => {
  highResMap.on("load", () => {
    // Add route
    highResMap.addLayer({ ... });
    highResMap.once("idle", resolve);
  });
});

// Capture to canvas
const mapCanvas = highResMap.getCanvas();
ctx.drawImage(mapCanvas, margin, mapTop + margin);
```

## Comparison

| Feature | V1 (bbox) | V2 (manual math) | V3 (Mapbox GL JS) |
|---------|-----------|------------------|-------------------|
| **Route Alignment** | ❌ Off-map | ❌ Misaligned | ✅ Perfect |
| **Implementation** | Complex bbox | Manual projection | Simple GL JS |
| **Preview** | Static image | Static canvas | Interactive map |
| **User Control** | None | Zoom slider | Pan + zoom + interact |
| **Reliability** | Low | Medium | High |
| **Maintenance** | Hard | Medium | Easy |

## Benefits Over V2

1. **No Math Required**: Mapbox handles all projections
2. **Guaranteed Accuracy**: Same rendering for preview and export
3. **Interactive**: Users can frame their route perfectly
4. **Debuggable**: Can see exactly what will be exported
5. **Future-Proof**: Uses maintained Mapbox library

## Map Styles

All styles use `mapbox://styles/...` format:
```typescript
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
  // ... more templates
];
```

## Critical Configuration

```typescript
preserveDrawingBuffer: true  // MUST be set for canvas export!
```

Without this, `.getCanvas()` returns a blank canvas.

## User Experience

1. Open poster generator
2. See interactive preview with route
3. Adjust zoom slider (10-18)
4. Pan/zoom map to frame route perfectly
5. Click "Generate Poster"
6. V3 creates hidden high-res version
7. Captures to canvas at 2400x3000 (8x10" @ 300 DPI)
8. Downloads as PNG

## Testing Checklist

- ✅ UBC route renders correctly
- ✅ Route line matches map perfectly
- ✅ Zoom slider works smoothly
- ✅ Pan/zoom in preview works
- ✅ Color changes update preview
- ✅ High-res export works
- ✅ All map styles work
- ✅ Stats render correctly

## Performance Notes

- Preview map: Lightweight, loads quickly
- High-res map: Created on-demand, takes 2-3 seconds
- Memory: Cleaned up after export
- Network: Only loads tiles for visible area

## Migration

- ✅ Created `PosterGeneratorV3.tsx`
- ✅ Exported in `index.ts`
- ✅ Updated `PosterButton.tsx` to use V3
- ⚠️ V1 and V2 remain for reference

## Conclusion

V3 uses the battle-tested Mapbox GL JS library to ensure perfect alignment between map tiles and route lines. No manual math, no misalignment issues - just reliable, beautiful posters every time.
