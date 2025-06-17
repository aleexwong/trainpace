import { useEffect, useState } from "react";
import ElevationChart from "./ElevationChart";

type ProfilePoint = { distanceKm: number; elevation: number };

export default function ElevationPage() {
  const [points, setPoints] = useState<ProfilePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:3000/api/analyze-gpx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gpx: '<gpx version="1.1" creator="example"><trk><name>Test Track</name><trkseg><trkpt lat="49.2827" lon="-123.1207"><ele>10</ele></trkpt><trkpt lat="49.2830" lon="-123.1210"><ele>15</ele></trkpt><trkpt lat="49.2835" lon="-123.1215"><ele>20</ele></trkpt></trkseg></trk></gpx>',
            goalPace: 5,
            raceName: "Test Race",
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
    }
    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!points.length) return <p>No data available</p>;

  return <ElevationChart points={points} />;
}
