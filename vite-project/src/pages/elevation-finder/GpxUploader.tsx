import React from "react";

interface GpxUploaderProps {
  onFileParsed: (gpxText: string) => void;
}

export default function GpxUploader({ onFileParsed }: GpxUploaderProps) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onFileParsed(reader.result);
      }
    };
    reader.readAsText(file);
  };

  return <input type="file" accept=".gpx" onChange={handleFile} />;
}
