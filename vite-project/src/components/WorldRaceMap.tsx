import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { worldRaces, racesToGeoJSON } from "@/data/world-races";
import type { WorldRace } from "@/data/world-races";
import type { RaceRegion, RaceTier, RaceType } from "@/data/races/types";

// ---------------------------------------------------------------------------
// Mapbox CDN loader (matches existing pattern in MapboxRoutePreview)
// ---------------------------------------------------------------------------

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN || "YOUR_MAPBOX_ACCESS_TOKEN";

let mapboxLoaded = false;
let mapboxLoadPromise: Promise<void> | null = null;

function loadMapbox(): Promise<void> {
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
}

// ---------------------------------------------------------------------------
// Tier colors
// ---------------------------------------------------------------------------

const TIER_COLORS: Record<RaceTier, string> = {
  "world-major": "#f59e0b", // amber
  platinum: "#8b5cf6",      // purple
  gold: "#eab308",          // yellow
  silver: "#94a3b8",        // slate
  bronze: "#d97706",        // amber-dark
};

const TIER_LABELS: Record<RaceTier, string> = {
  "world-major": "World Major",
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
};

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

interface Filters {
  region: RaceRegion | "all";
  tier: RaceTier | "all";
  raceType: RaceType | "all";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WorldRaceMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const popupRef = useRef<any>(null);
  const navigate = useNavigate();

  const [filters, setFilters] = useState<Filters>({
    region: "all",
    tier: "all",
    raceType: "all",
  });
  const [selectedRace, setSelectedRace] = useState<WorldRace | null>(null);
  const [raceCount, setRaceCount] = useState(worldRaces.length);

  // Filtered races
  const getFilteredRaces = useCallback(() => {
    return worldRaces.filter((race) => {
      if (filters.region !== "all" && race.region !== filters.region) return false;
      if (filters.tier !== "all" && race.tier !== filters.tier) return false;
      if (filters.raceType !== "all" && race.raceType !== filters.raceType) return false;
      return true;
    });
  }, [filters]);

  // Update map source when filters change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource("races")) return;

    const filtered = getFilteredRaces();
    setRaceCount(filtered.length);
    const geojson = racesToGeoJSON(filtered);
    map.getSource("races").setData(geojson);
  }, [filters, getFilteredRaces]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    let map: any = null;

    const init = async () => {
      try {
        await loadMapbox();
        if (mapRef.current) return;

        const mapboxgl = (window as any).mapboxgl;
        mapboxgl.accessToken = MAPBOX_TOKEN;

        map = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/light-v11",
          center: [10, 30],
          zoom: 1.5,
          minZoom: 1,
          maxZoom: 14,
          projection: "mercator",
        });

        map.addControl(new mapboxgl.NavigationControl(), "top-right");

        mapRef.current = map;

        map.on("load", () => {
          const geojson = racesToGeoJSON(worldRaces);

          // Add clustered source
          map.addSource("races", {
            type: "geojson",
            data: geojson,
            cluster: true,
            clusterMaxZoom: 10,
            clusterRadius: 50,
          });

          // Cluster circles
          map.addLayer({
            id: "clusters",
            type: "circle",
            source: "races",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": [
                "step",
                ["get", "point_count"],
                "#60a5fa", // blue-400 for small clusters
                5,
                "#3b82f6", // blue-500
                15,
                "#2563eb", // blue-600
                30,
                "#1d4ed8", // blue-700
              ],
              "circle-radius": [
                "step",
                ["get", "point_count"],
                18,
                5,
                22,
                15,
                28,
                30,
                34,
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            },
          });

          // Cluster count labels
          map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "races",
            filter: ["has", "point_count"],
            layout: {
              "text-field": ["get", "point_count_abbreviated"],
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 13,
            },
            paint: {
              "text-color": "#ffffff",
            },
          });

          // Individual race points
          map.addLayer({
            id: "unclustered-point",
            type: "circle",
            source: "races",
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": [
                "match",
                ["get", "tier"],
                "world-major",
                TIER_COLORS["world-major"],
                "platinum",
                TIER_COLORS["platinum"],
                "gold",
                TIER_COLORS["gold"],
                "silver",
                TIER_COLORS["silver"],
                "bronze",
                TIER_COLORS["bronze"],
                "#3b82f6",
              ],
              "circle-radius": [
                "match",
                ["get", "tier"],
                "world-major",
                10,
                "platinum",
                8,
                7,
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            },
          });

          // Click on cluster to zoom in
          map.on("click", "clusters", (e: any) => {
            const features = map.queryRenderedFeatures(e.point, {
              layers: ["clusters"],
            });
            const clusterId = features[0].properties.cluster_id;
            map
              .getSource("races")
              .getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
                if (err) return;
                map.easeTo({
                  center: features[0].geometry.coordinates,
                  zoom,
                });
              });
          });

          // Click on individual race point
          map.on("click", "unclustered-point", (e: any) => {
            const feature = e.features[0];
            const props = feature.properties;
            const coordinates = feature.geometry.coordinates.slice();

            // Find the full race object
            const race = worldRaces.find((r) => r.slug === props.slug);
            if (race) {
              setSelectedRace(race);
            }

            // Ensure popup wraps correctly across the dateline
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            // Remove existing popup
            if (popupRef.current) {
              popupRef.current.remove();
            }

            const popup = new mapboxgl.Popup({
              closeButton: true,
              closeOnClick: true,
              maxWidth: "280px",
              offset: 15,
            })
              .setLngLat(coordinates)
              .setHTML(
                `<div style="font-family: system-ui, sans-serif; padding: 4px;">
                  <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px;">${props.name}</div>
                  <div style="color: #64748b; font-size: 13px; margin-bottom: 6px;">${props.city}, ${props.country}</div>
                  <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 8px;">
                    <span style="background: ${TIER_COLORS[props.tier as RaceTier] || "#3b82f6"}; color: white; font-size: 11px; padding: 2px 8px; border-radius: 9999px;">
                      ${TIER_LABELS[props.tier as RaceTier] || props.tier}
                    </span>
                    <span style="color: #64748b; font-size: 12px;">${props.raceType}</span>
                    ${props.raceDate ? `<span style="color: #64748b; font-size: 12px;">${props.raceDate}</span>` : ""}
                  </div>
                  <a href="/race/${props.slug}"
                     style="color: #2563eb; font-size: 13px; text-decoration: none; font-weight: 500;"
                     class="race-popup-link"
                     data-slug="${props.slug}">
                    View race details →
                  </a>
                </div>`
              )
              .addTo(map);

            popupRef.current = popup;

            // Handle link click via event delegation (SPA navigation)
            const popupEl = popup.getElement();
            popupEl?.addEventListener("click", (evt: Event) => {
              const target = evt.target as HTMLElement;
              const link = target.closest(".race-popup-link") as HTMLAnchorElement;
              if (link) {
                evt.preventDefault();
                const slug = link.dataset.slug;
                if (slug) {
                  navigate(`/race/${slug}`);
                }
              }
            });
          });

          // Cursor changes
          map.on("mouseenter", "clusters", () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "clusters", () => {
            map.getCanvas().style.cursor = "";
          });
          map.on("mouseenter", "unclustered-point", () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "unclustered-point", () => {
            map.getCanvas().style.cursor = "";
          });
        });
      } catch (error) {
        console.error("Failed to initialize world race map:", error);
      }
    };

    init();

    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [navigate]);

  return (
    <div className="flex flex-col h-full">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Region</label>
          <select
            value={filters.region}
            onChange={(e) =>
              setFilters((f) => ({ ...f, region: e.target.value as Filters["region"] }))
            }
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Regions</option>
            <option value="north-america">North America</option>
            <option value="europe">Europe</option>
            <option value="asia-pacific">Asia-Pacific</option>
            <option value="south-america">South America</option>
            <option value="africa">Africa</option>
            <option value="middle-east">Middle East</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Tier</label>
          <select
            value={filters.tier}
            onChange={(e) =>
              setFilters((f) => ({ ...f, tier: e.target.value as Filters["tier"] }))
            }
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tiers</option>
            <option value="world-major">World Majors</option>
            <option value="platinum">Platinum</option>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="bronze">Bronze</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Distance</label>
          <select
            value={filters.raceType}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                raceType: e.target.value as Filters["raceType"],
              }))
            }
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Distances</option>
            <option value="marathon">Marathon</option>
            <option value="half-marathon">Half Marathon</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-gray-500">
          {raceCount} {raceCount === 1 ? "race" : "races"}
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1 min-h-[400px]">
        <div ref={mapContainer} className="absolute inset-0" />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-3 text-xs z-10">
          <div className="font-medium text-gray-700 mb-2">Race Tier</div>
          {(Object.keys(TIER_COLORS) as RaceTier[]).map((tier) => (
            <div key={tier} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: TIER_COLORS[tier] }}
              />
              <span className="text-gray-600">{TIER_LABELS[tier]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected race detail panel */}
      {selectedRace && (
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{selectedRace.name}</h3>
              <p className="text-gray-500 text-sm">
                {selectedRace.city}, {selectedRace.country}
              </p>
              <div className="flex gap-2 mt-2">
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white"
                  style={{
                    backgroundColor: TIER_COLORS[selectedRace.tier],
                  }}
                >
                  {TIER_LABELS[selectedRace.tier]}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {selectedRace.raceType}
                </span>
                {selectedRace.raceDate && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {selectedRace.raceDate}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/race/${selectedRace.slug}`)}
                className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                View Details
              </button>
              <button
                onClick={() => setSelectedRace(null)}
                className="text-sm px-3 py-2 text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
