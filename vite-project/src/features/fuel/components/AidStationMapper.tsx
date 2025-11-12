/**
 * Aid Station Mapper Component
 * Upload course map, place aid stations, time gel intake
 */

import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Upload, X, Droplet, Zap, Plus, Trash2 } from "lucide-react";
import { useState, useRef } from "react";
import type { AidStation } from "../types";

interface AidStationMapperProps {
  gelsNeeded: number;
}

export function AidStationMapper({ gelsNeeded }: AidStationMapperProps) {
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [aidStations, setAidStations] = useState<AidStation[]>([]);
  const [distanceUnit, setDistanceUnit] = useState<"km" | "miles">("km");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMapImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapContainerRef.current) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newStation: AidStation = {
      id: `station-${Date.now()}`,
      distance: 0,
      x,
      y,
      gelIntake: false,
      waterAvailable: true,
    };

    setAidStations([...aidStations, newStation]);
  };

  const updateStation = (id: string, updates: Partial<AidStation>) => {
    setAidStations(
      aidStations.map((station) =>
        station.id === id ? { ...station, ...updates } : station
      )
    );
  };

  const removeStation = (id: string) => {
    setAidStations(aidStations.filter((station) => station.id !== id));
  };

  const clearMap = () => {
    setMapImage(null);
    setAidStations([]);
  };

  const gelStations = aidStations.filter((s) => s.gelIntake).length;

  return (
    <Card className="bg-white shadow-lg border-2 border-purple-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-purple-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Aid Station Mapper
            </h3>
          </div>
          {mapImage && (
            <button
              onClick={clearMap}
              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Upload your course map and mark where you'll take gels and find water.
        </p>

        {!mapImage ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-purple-300 rounded-lg p-12 text-center cursor-pointer hover:bg-purple-50 transition-colors"
          >
            <Upload className="h-12 w-12 text-purple-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium mb-1">
              Upload Course Map
            </p>
            <p className="text-xs text-gray-500">
              Click to upload or drag and drop
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Distance Unit Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Distance unit:</span>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setDistanceUnit("km")}
                  className={`px-3 py-1 text-sm rounded ${
                    distanceUnit === "km"
                      ? "bg-purple-600 text-white"
                      : "text-gray-600"
                  }`}
                >
                  km
                </button>
                <button
                  onClick={() => setDistanceUnit("miles")}
                  className={`px-3 py-1 text-sm rounded ${
                    distanceUnit === "miles"
                      ? "bg-purple-600 text-white"
                      : "text-gray-600"
                  }`}
                >
                  miles
                </button>
              </div>
            </div>

            {/* Map Container */}
            <div
              ref={mapContainerRef}
              onClick={handleMapClick}
              className="relative border-2 border-purple-300 rounded-lg overflow-hidden cursor-crosshair"
              style={{ minHeight: "400px" }}
            >
              <img
                src={mapImage}
                alt="Course map"
                className="w-full h-full object-contain"
              />

              {/* Aid station markers */}
              {aidStations.map((station) => (
                <div
                  key={station.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{
                    left: `${station.x}%`,
                    top: `${station.y}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                      station.gelIntake
                        ? "bg-purple-600 text-white"
                        : "bg-blue-500 text-white"
                    }`}
                  >
                    {station.gelIntake ? (
                      <Zap className="h-4 w-4" />
                    ) : (
                      <Droplet className="h-4 w-4" />
                    )}
                  </div>
                </div>
              ))}

              {/* Help overlay */}
              {aidStations.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <div className="bg-white rounded-lg p-4 shadow-lg">
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <Plus className="h-4 w-4 text-purple-600" />
                      Click on the map to add aid stations
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Aid Station List */}
            {aidStations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Aid Stations ({aidStations.length})
                  </h4>
                  <div className="text-xs text-purple-600">
                    {gelStations} gel {gelStations === 1 ? "station" : "stations"} / {gelsNeeded} gels needed
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {aidStations.map((station, idx) => (
                    <div
                      key={station.id}
                      className="bg-gray-50 rounded-lg p-3 flex items-center gap-3"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>

                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={station.distance || ""}
                          onChange={(e) =>
                            updateStation(station.id, {
                              distance: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder={`Distance (${distanceUnit})`}
                          className="text-sm px-2 py-1 border border-gray-300 rounded"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              updateStation(station.id, {
                                gelIntake: !station.gelIntake,
                              })
                            }
                            className={`flex-1 text-xs px-2 py-1 rounded flex items-center justify-center gap-1 ${
                              station.gelIntake
                                ? "bg-purple-600 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                            title="Gel intake"
                          >
                            <Zap className="h-3 w-3" />
                            Gel
                          </button>
                          <button
                            onClick={() =>
                              updateStation(station.id, {
                                waterAvailable: !station.waterAvailable,
                              })
                            }
                            className={`flex-1 text-xs px-2 py-1 rounded flex items-center justify-center gap-1 ${
                              station.waterAvailable
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                            title="Water available"
                          >
                            <Droplet className="h-3 w-3" />
                            Water
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => removeStation(station.id)}
                        className="flex-shrink-0 p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {gelStations > 0 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs text-purple-800">
                  {gelStations < gelsNeeded ? (
                    <>
                      ⚠️ You've marked {gelStations} gel {gelStations === 1 ? "station" : "stations"} but need {gelsNeeded} gels.
                      Consider marking {gelsNeeded - gelStations} more {gelsNeeded - gelStations === 1 ? "station" : "stations"} or carrying extra gels.
                    </>
                  ) : gelStations === gelsNeeded ? (
                    <>
                      ✓ Perfect! You've marked {gelStations} gel {gelStations === 1 ? "station" : "stations"} to match your {gelsNeeded} gel needs.
                    </>
                  ) : (
                    <>
                      💡 You've marked {gelStations} gel {gelStations === 1 ? "station" : "stations"} for {gelsNeeded} gels.
                      You can take multiple gels at some stations or adjust your plan.
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
