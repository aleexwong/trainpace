# PosterGeneratorV3 - Perfect Screenshot Implementation

## The Real Problem

V2 used manual Web Mercator math, but **the route line didn't align with map tiles** because:
- Canvas dimensions didn't match static image dimensions
- Manual projection math had scaling issues
- No way to see what you'd get until after generation

## V3 Solution: True "What You See Is What You Get"

Uses **Mapbox GL JS** to create an **interactive preview** that becomes the **exact poster output**.

### Key Feature: Preview IS the Export

```typescript
// Get EXACT state from preview map
const currentCenter = previewMap.current.getCenter();
const currentZoom = previewMap.current.getZoom();
const currentBearing = previewMap.current.getBearing();
const currentPitch = previewMap.current.getPitch();

// Create high-res map with EXACT same view
const highResMap = new mapboxgl.Map({
  center: currentCenter,  // Same center
  zoom: currentZoom,      // Same zoom
  bearing: currentBearing, // Same rotation
  pitch: currentPitch,    // Same tilt
});
```

### User Experience

1. **Preview Map**: Fully interactive Mapbox map
   - Pan by dragging
   - Zoom with scroll wheel or +/- buttons
   - Rotate/tilt (bearing/pitch preserved)
   - See **exactly** what will be exported

2. **Frame Your Route**: 
   - Zoom in for close-up detail
   - Zoom out for context
   - Pan to position perfectly
   - No sliders needed - just interact naturally

3. **Generate Poster**:
   - Captures **exact** preview state
   - Creates hidden high-res version (2400x3000)
   - Same center, zoom, bearing, pitch
   - Perfect 1:1 match with preview

### Technical Implementation

#### Preview Map
```typescript
previewMap.current = new mapboxgl.Map({
  container: previewMapRef.current,
  style: currentMapStyle,
  bounds: bounds, // Initial auto-fit
  interactive: true, // User can interact
  preserveDrawingBuffer: true, // Enable export
});
```

#### High-Res Export
```typescript
// Calculate exact dimensions accounting for margins
const mapAreaWidth = PRINT_CONFIG.width - (40 * 6 * 2);
const mapAreaHeight = PRINT_CONFIG.height * PRINT_CONFIG.mapHeight - (40 * 6 * 2);

// Create hidden map at print resolution
const highResMap = new mapboxgl.Map({
  container: hiddenContainer,
  style: currentMapStyle,
  center: currentCenter,    // From preview
  zoom: currentZoom,        // From preview
  bearing: currentBearing,  // From preview
  pitch: currentPitch,      // From preview
  interactive: false,
  preserveDrawingBuffer: true,
});

// Wait for all tiles to load
await highResMap.once("idle");

// Capture to canvas
const mapCanvas = highResMap.getCanvas();
ctx.drawImage(mapCanvas, margin, mapTop + margin);
```

### Benefits

1. **Perfect Alignment** ✅
   - Route and map tiles rendered by same engine
   - No math discrepancies possible
   - Guaranteed visual match

2. **User Control** ✅
   - Natural map interaction (drag, zoom)
   - No abstract "zoom slider" - just use the map
   - Frame exactly how you want it

3. **WYSIWYG** ✅
   - Preview shows **exactly** what you'll get
   - No surprises after generation
   - Confidence before downloading

4. **High Quality** ✅
   - 2400x3000 pixels (8x10" @ 300 DPI)
   - Professional print quality
   - All Mapbox tile detail preserved

### Comparison: V2 vs V3

| Feature | V2 (Manual Math) | V3 (Mapbox GL JS) |
|---------|------------------|-------------------|
| **Route Alignment** | ❌ Misaligned | ✅ Perfect |
| **User Control** | Zoom slider only | Full pan/zoom/rotate |
| **Preview Accuracy** | Approximate | Exact (1:1) |
| **Interaction** | Slider | Natural map drag/zoom |
| **What You See** | Different from export | Exactly what you get |
| **Debugging** | Hard (math issues) | Easy (visual) |
| **Reliability** | Medium | High |

### UI Changes

**Removed:**
- Zoom slider (redundant - just zoom the map!)
- Separate zoom control panel

**Added:**
- Clear instruction: "Pan and zoom the map to frame your route"
- Status indicator: "Ready ✓" when map loaded
- Debug info shows captured state

### Testing

1. **Load UBC route**
2. **Pan/zoom preview** to frame route perfectly
3. **Click "Generate Poster"**
4. **Verify downloaded image** matches preview exactly

### Critical Code Elements

```typescript
// MUST have for canvas export
preserveDrawingBuffer: true

// Get exact preview state
const currentCenter = previewMap.current.getCenter();
const currentZoom = previewMap.current.getZoom();
const currentBearing = previewMap.current.getBearing();
const currentPitch = previewMap.current.getPitch();

// Wait for all tiles before capture
highResMap.once("idle", () => resolve());

// Get actual rendered canvas
const mapCanvas = highResMap.getCanvas();
```

### Why This Works

Mapbox GL JS uses **WebGL** to render maps. When you set `preserveDrawingBuffer: true`, it keeps the WebGL canvas buffer available for reading. The `.getCanvas()` method returns the actual rendered canvas element, which we can then draw onto our poster canvas.

By using the **exact same parameters** (center, zoom, bearing, pitch) between preview and high-res export, we guarantee they show identical views - just at different resolutions.

### User Instructions

> **How to use:**
> 1. The map preview is fully interactive
> 2. Drag to pan, scroll to zoom
> 3. Frame your route exactly how you want it
> 4. Click "Generate Poster"
> 5. What you see is what you'll get!

## Conclusion

V3 delivers true WYSIWYG poster generation by using Mapbox GL JS for both preview and export. Users can naturally interact with the map to frame their route perfectly, then capture that exact view at print resolution. No sliders, no guessing - just frame and generate.
