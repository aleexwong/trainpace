import React, { useState } from "react";
import { Upload, Activity, MapPin } from "lucide-react";

interface GpxUploaderProps {
  onFileParsed: (gpxText: string, filename: string) => void;
}

export default function GpxUploader({ onFileParsed }: GpxUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onFileParsed(reader.result, file.name);
      }
      setIsUploading(false);
    };
    reader.readAsText(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".gpx")) {
      handleFile(file);
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept=".gpx"
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={isUploading}
      />

      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
          ${
            isDragging
              ? "border-blue-400 bg-blue-50 scale-105"
              : "border-gray-300 hover:border-blue-300 hover:bg-blue-25"
          }
          ${
            isUploading
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:shadow-lg"
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-4">
          {/* Icon */}
          <div
            className={`
            relative p-4 rounded-full transition-all duration-300
            ${
              isDragging
                ? "bg-blue-500 text-white"
                : "bg-gradient-to-br from-blue-400 to-cyan-500 text-white"
            }
            ${isUploading ? "animate-pulse" : ""}
          `}
          >
            {isUploading ? (
              <div className="animate-spin">
                <Activity className="w-8 h-8" />
              </div>
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>

          {/* Text content */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {isUploading ? "Processing GPX..." : "Upload Your Route"}
            </h3>
            <p className="text-gray-600 text-sm">
              {isUploading
                ? "Analyzing your fitness data..."
                : "Drop your GPX file here or click to browse"}
            </p>
          </div>

          {/* Features */}
          <div className="flex items-center space-x-6 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>Track Analysis</span>
            </div>
            <div className="flex items-center space-x-1">
              <Activity className="w-4 h-4 text-blue-500" />
              <span>Fitness Metrics</span>
            </div>
          </div>

          {/* Format info */}
          <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
            Supports .GPX files
          </div>
        </div>
      </div>
    </div>
  );
}
