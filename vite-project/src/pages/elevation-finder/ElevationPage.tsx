import { useState } from "react";
import ElevationChart from "./ElevationChart";
import GpxUploader from "./GpxUploader";

type ProfilePoint = { distanceKm: number; elevation: number };

export default function ElevationPage() {
  const [points, setPoints] = useState<ProfilePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileParsed = async (gpxText: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/api/analyze-gpx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gpx: gpxText,
          goalPace: 5,
          raceName: "User Upload",
        }),
      });

      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      setPoints(data.profile || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <GpxUploader onFileParsed={handleFileParsed} />
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {points.length > 0 && <ElevationChart points={points} />}
    </div>
  );
}
