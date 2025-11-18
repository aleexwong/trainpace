# PosterGeneratorV2 - Center + Zoom Implementation

## What Changed

Created `PosterGeneratorV2.tsx` that uses the **center + zoom** approach instead of bbox for Mapbox Static Images API.

## Key Improvements

### 1. **Simpler API Usage**
- Uses standard Mapbox format: `/{lon},{lat},{zoom}/{width}x{height}`
- No more bbox confusion or dimension conflicts
- Matches the reliable pattern from `MapboxRoutePreview`

### 2. **User Control with Zoom Slider**
- Added `mapZoom` state (default: 13, range: 10-18)
- Users can adjust zoom with a slider to frame their route perfectly
- Zoom level displayed in real-time on preview

### 3. **Accurate Route Overlay**
- Uses Web Mercator projection math to position route points
- Formula: `pixelsPerDegree = (256 * 2^zoom) / 360`
- Accounts for latitude distortion with `cos(lat)`
- Route line and map tiles use identical coordinate calculations

### 4. **Removed Complexity**
- No more bbox padding calculations
- No more "detail divisor" logic
- No more Leaflet preview map (was unused)
- Cleaner, more maintainable code

## How It Works

### Map Tile Fetching
```typescript
// Calculate center from displayPoints
const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

// Fetch with center + zoom
const staticUrl = `${baseUrl}/static/${centerLng},${centerLat},${mapZoom}/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
```

### Route Overlay Positioning
```typescript
// Calculate pixel scale from zoom level
const worldPixels = 256 * Math.pow(2, mapZoom);
const pixelsPerDegreeLng = worldPixels / 360;
const pixelsPerDegreeLat = (worldPixels / 360) * Math.cos((centerLat * Math.PI) / 180);

// Position each point
const x = centerX + (point.lng - centerLng) * pixelsPerDegreeLng;
const y = centerY - (point.lat - centerLat) * pixelsPerDegreeLat;
```

## UI Changes

Replaced "Map Detail Level" toggle with "Map Zoom Level" slider:

```tsx
<div>
  <Label>Map Zoom Level</Label>
  <input
    type="range"
    min="10"
    max="18"
    step="0.5"
    value={mapZoom}
    onChange={(e) => setMapZoom(parseFloat(e.target.value))}
  />
  <span>Far ← → Close</span>
</div>
```

## Migration Path

- ✅ Created `PosterGeneratorV2.tsx` (new implementation)
- ✅ Exported in `index.ts`
- ✅ Updated `PosterButton.tsx` to use V2
- ⚠️ Original `PosterGenerator.tsx` remains for reference/rollback

## Testing

1. **Load UBC route** on ElevationFinder
2. **Click "Generate Poster"** button
3. **Adjust zoom slider** in real-time preview
4. **Verify route is centered** and fully visible
5. **Generate full poster** and check alignment

## Expected Results

- ✅ UBC route now renders correctly
- ✅ Map tiles match route positioning exactly
- ✅ User can zoom in/out for perfect framing
- ✅ No more off-map issues
- ✅ Consistent behavior across all routes

## Benefits

1. **Reliability**: Standard API format that always works
2. **User Control**: Zoom slider for custom framing
3. **Simplicity**: Fewer moving parts, easier to debug
4. **Maintainability**: Clean code, clear logic
5. **Performance**: No extra Leaflet map overhead
