import React, { useState, useEffect } from "react";
import {
  Upload,
  Activity,
  MapPin,
  AlertCircle,
  CheckCircle,
  FileX,
} from "lucide-react";
import { toast } from "../../hooks/use-toast";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  setDoc,
  query,
  where,
  collection,
  getDocs,
  serverTimestamp,
  addDoc,
  doc,
} from "firebase/firestore";
import { storage, db } from "../../lib/firebase";
import { useAuth } from "../../features/auth/AuthContext";
import { processGPXUpload } from "../../lib/gpxMetaData";

interface GpxUploaderProps {
  onFileParsed: (
    gpxText: string,
    filename: string,
    fileUrl: string,
    docId: string | null,
    displayPoints?: Array<{ lat: number; lng: number; ele?: number }>,
    displayUrl?: string // Optional: URL for displaying the GPX file
  ) => void;
  maxFileSize?: number; // in MB
  maxUploadsPerDay?: number;
  maxUploadsPerHour?: number;
  allowedFileTypes?: string[];
}

interface DuplicateFile {
  filename: string;
  uploadedAt: any;
  fileUrl: string;
  content?: string; // Optional: content stored in Firestore
  storageRef?: string; // Storage reference path
  docId?: string; // Firestore document ID
}

export default function GpxUploader({
  onFileParsed,
  maxFileSize = 10, // 10MB default
  maxUploadsPerDay = 15,
  maxUploadsPerHour = 10,
  allowedFileTypes = [".gpx"],
}: GpxUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [duplicateFound, setDuplicateFound] = useState<DuplicateFile | null>(
    null
  );
  const { user } = useAuth(); // Get current user

  // Rate limiting state
  const [uploadsToday, setUploadsToday] = useState(0);
  const [uploadsThisHour, setUploadsThisHour] = useState(0);
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false);

  useEffect(() => {
    if (user) {
      checkRateLimits();
    }
  }, [user]);

  // Generate SHA-256 hash of file content
  const generateFileHash = async (content: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  // Check for duplicate files
  const checkForDuplicate = async (
    fileHash: string
  ): Promise<DuplicateFile | null> => {
    if (!user) return null;

    try {
      const duplicateQuery = query(
        collection(db, "gpx_uploads"),
        where("userId", "==", user.uid),
        where("fileHash", "==", fileHash),
        where("deleted", "==", false) // Exclude deleted files
      );

      const duplicateSnapshot = await getDocs(duplicateQuery);

      if (!duplicateSnapshot.empty) {
        const duplicateDoc = duplicateSnapshot.docs[0];
        const data = duplicateDoc.data();
        return {
          filename: data.filename,
          uploadedAt: data.uploadedAt,
          fileUrl: data.fileUrl,
          content: data.content, // Include content if stored
          storageRef: data.storageRef,
          docId: duplicateDoc.id, // Include document ID for reference
        };
      }

      return null;
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      return null;
    }
  };

  // Check rate limits for current user
  const checkRateLimits = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Check today's uploads
      const todayQuery = query(
        collection(db, "gpx_uploads"),
        where("userId", "==", user.uid),
        where("uploadedAt", ">=", today)
      );
      const todaySnapshot = await getDocs(todayQuery);
      setUploadsToday(todaySnapshot.size);

      // Check this hour's uploads
      const hourQuery = query(
        collection(db, "gpx_uploads"),
        where("userId", "==", user.uid),
        where("uploadedAt", ">=", oneHourAgo)
      );
      const hourSnapshot = await getDocs(hourQuery);
      setUploadsThisHour(hourSnapshot.size);

      // Set rate limit status
      setRateLimitExceeded(
        todaySnapshot.size >= maxUploadsPerDay ||
          hourSnapshot.size >= maxUploadsPerHour
      );
    } catch (error) {
      console.error("Error checking rate limits:", error);
    }
  };

  // Validate file before upload
  const validateFile = (file: File): string | null => {
    // Check file type
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedFileTypes.includes(fileExtension)) {
      return `Invalid file type. Allowed types: ${allowedFileTypes.join(", ")}`;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return `File too large. Maximum size: ${maxFileSize}MB`;
    }

    return null;
  };

  // Validate GPX content
  const validateGpxContent = (content: string): boolean => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/xml");

      // Check for parsing errors
      if (doc.querySelector("parsererror")) {
        return false;
      }

      // Check for GPX root element
      const gpxElement = doc.querySelector("gpx");
      if (!gpxElement) {
        return false;
      }

      // Check for required GPX structure
      const hasTrack = doc.querySelector("trk");
      const hasRoute = doc.querySelector("rte");
      const hasWaypoint = doc.querySelector("wpt");

      return !!(hasTrack || hasRoute || hasWaypoint);
    } catch (error) {
      return false;
    }
  };

  // Generate safe filename
  const generateSafeFilename = (originalName: string): string => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `${user?.uid}_${timestamp}_${randomString}_${sanitized}`;
  };

  // 🚀 UPDATED: Upload file to Firebase Storage with optimized caching setup
  const uploadToFirebase = async (
    file: File,
    content: string,
    fileHash: string
  ): Promise<{
    fileUrl: string;
    displayPoints: Array<{ lat: number; lng: number; ele?: number }>;
    docId: string; // Return docId for immediate caching
  }> => {
    const safeFilename = generateSafeFilename(file.name);
    const storageRef = ref(storage, `gpx_files/${safeFilename}`);

    try {
      // Upload file
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: "application/gpx+xml",
        customMetadata: {
          originalName: file.name,
          uploadedBy: user?.uid || "anonymous",
          uploadedAt: new Date().toISOString(),
          fileHash,
        },
      });

      const downloadURL = await getDownloadURL(snapshot.ref);
      const shouldStoreContent = file.size < 1024 * 1024; // Store content for files < 1MB
      const processed = processGPXUpload(content);

      // Create document with random ID
      const docRef = doc(collection(db, "gpx_uploads"));
      const docId = docRef.id;
      const displayUrl = `/elevation-finder/${docId}`;

      const docData: any = {
        userId: user?.uid,
        filename: file.name,
        safeFilename,
        fileSize: file.size,
        fileUrl: downloadURL,
        storageRef: snapshot.ref.fullPath,
        fileHash,
        uploadedAt: serverTimestamp(),
        contentValidated: true,
        deleted: false,
        metadata: processed.metadata,
        displayPoints: processed.displayPoints,
        thumbnailPoints: processed.thumbnailPoints,
        docId,
        displayUrl,

        // 🚀 NEW: Prepare for optimized caching (will be populated by API)
        staticRouteData: null, // Will be filled by first API call
        staticDataCached: null,
        staticDataSize: 0,

        // Cache performance tracking
        cacheInfo: {
          totalCacheEntries: 0,
          lastCached: null,
          totalCacheSize: 0,
          apiCallsSaved: 0,
          costSavings: 0,
        },
      };

      if (shouldStoreContent) {
        docData.content = content;
      }

      await setDoc(docRef, docData);

      console.log(`Route document created: ${docId}`);
      console.log(`File size: ${(file.size / 1024).toFixed(1)}KB`);
      console.log(`Ready for smart caching on first analysis`);

      return {
        fileUrl: downloadURL,
        displayPoints: processed.displayPoints,
        docId, // Return docId so ElevationPage can cache analysis immediately
      };
    } catch (error) {
      console.error("Upload failed:", error);
      throw new Error("Upload failed. Please try again.");
    }
  };

  // Handle duplicate file action
  const handleDuplicateAction = (action: "use" | "cancel") => {
    if (action === "use" && duplicateFound) {
      // Use the existing file
      toast({
        title: "Using Existing File",
        description: "Loading your previously uploaded GPX file.",
        variant: "default",
      });

      // Fetch the content from the existing file
      fetchExistingFileContent(duplicateFound.fileUrl);
    }

    setDuplicateFound(null);
  };

  // Fetch existing file content using multiple fallback methods
  const fetchExistingFileContent = async (fileUrl: string) => {
    try {
      const filename = duplicateFound?.filename || "existing_file.gpx";

      // Method 1: Use content stored in Firestore (fastest)
      if (duplicateFound?.content) {
        console.log("Loading content from Firestore cache");
        onFileParsed(
          duplicateFound.content,
          filename,
          fileUrl,
          duplicateFound.docId || null
        );
        return;
      }

      // Method 2: Get fresh download URL from storage reference
      if (duplicateFound?.storageRef) {
        console.log("Loading content from Firebase Storage");
        const fileRef = ref(storage, duplicateFound.storageRef);
        const freshUrl = await getDownloadURL(fileRef);

        const response = await fetch(freshUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const content = await response.text();
        onFileParsed(content, filename, freshUrl, duplicateFound.docId || null);
        return;
      }

      // Method 3: Direct fetch with original URL (fallback)
      console.log("Trying direct fetch with original URL");
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const content = await response.text();
      const processed = processGPXUpload(content);

      // Create new document for fallback case
      const docRef = await addDoc(collection(db, "gpx_uploads"), {
        filename,
        content,
        uploadedAt: serverTimestamp(),
        userId: user?.uid,
        fileUrl,
        displayPoints: processed.displayPoints,
        metadata: processed.metadata,
        staticRouteData: null,
        cacheInfo: {
          totalCacheEntries: 0,
          lastCached: null,
          totalCacheSize: 0,
          apiCallsSaved: 0,
          costSavings: 0,
        },
      });

      const docId = docRef.id;
      const displayUrl = `/elevation-finder/${docId}`;

      onFileParsed(
        content,
        filename,
        fileUrl,
        docId,
        processed.displayPoints,
        displayUrl
      );
    } catch (error) {
      console.error("All fetch methods failed:", error);
      toast({
        title: "Error Loading File",
        description:
          "Could not load existing file. Please try uploading again.",
        variant: "destructive",
      });
    }
  };

  // Main file handler
  const handleFile = async (file: File) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload files.",
        variant: "destructive",
      });
      return;
    }

    if (rateLimitExceeded) {
      toast({
        title: "Rate Limit Exceeded",
        description: `You've reached your upload limit. Try again later.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Invalid File",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Read file content
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      setUploadProgress(15);

      // Validate GPX content
      if (!validateGpxContent(content)) {
        throw new Error("Invalid GPX file format");
      }

      setUploadProgress(30);

      // Generate file hash
      const fileHash = await generateFileHash(content);
      setUploadProgress(45);

      // Check for duplicates
      const duplicate = await checkForDuplicate(fileHash);
      if (duplicate) {
        setDuplicateFound(duplicate);
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }

      setUploadProgress(60);

      // Upload to Firebase
      const { fileUrl, displayPoints, docId } = await uploadToFirebase(
        file,
        content,
        fileHash
      );
      setUploadProgress(85);

      // Update rate limit counters
      await checkRateLimits();
      setUploadProgress(100);

      // 🚀 NEW: Pass docId to enable immediate caching
      onFileParsed(content, file.name, fileUrl, docId, displayPoints);

      toast({
        title: "Upload Successful",
        description:
          "Your GPX file has been uploaded and is ready for analysis.",
        variant: "default",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Event handlers
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
    if (file) handleFile(file);
  };

  const isDisabled = isUploading || rateLimitExceeded || !user;

  return (
    <div className="relative">
      {/* Duplicate File Modal */}
      {duplicateFound && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <FileX className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-semibold">Duplicate File Detected</h3>
            </div>

            <p className="text-gray-600 mb-4">
              You've already uploaded this file:{" "}
              <strong>{duplicateFound.filename}</strong>
            </p>

            <div className="text-sm text-gray-500 mb-6">
              Previously uploaded:{" "}
              {duplicateFound.uploadedAt?.toDate?.()?.toLocaleDateString() ||
                "Recently"}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleDuplicateAction("use")}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Use Existing File
              </button>
              <button
                onClick={() => handleDuplicateAction("cancel")}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Limit Warning */}
      {rateLimitExceeded && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">
            Upload limit reached. You can upload {maxUploadsPerHour} files per
            hour and {maxUploadsPerDay} per day.
          </span>
        </div>
      )}

      {/* Auth Warning */}
      {!user && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-yellow-700">
            Please log in to upload GPX files.
          </span>
        </div>
      )}

      <input
        type="file"
        accept={allowedFileTypes.join(",")}
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={isDisabled}
      />

      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
          ${
            isDragging && !isDisabled
              ? "border-blue-400 bg-blue-50 scale-105"
              : "border-gray-300 hover:border-blue-300 hover:bg-blue-25"
          }
          ${
            isDisabled
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
              isDragging && !isDisabled
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

          {/* Progress Bar */}
          {isUploading && (
            <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* Text content */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {isUploading ? "Processing GPX..." : "Upload Your Route"}
            </h3>
            <p className="text-gray-600 text-sm">
              {isUploading
                ? "Checking for duplicates and validating data..."
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
              <span>Smart Caching</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Duplicate Detection</span>
            </div>
          </div>

          {/* Limits info */}
          <div className="flex flex-col items-center space-y-1 text-xs text-gray-400">
            <div className="bg-gray-50 px-3 py-1 rounded-full">
              Max {maxFileSize}MB • {allowedFileTypes.join(", ")} files
            </div>
            {user && (
              <div className="text-xs text-gray-500">
                Today: {uploadsToday}/{maxUploadsPerDay} • This hour:{" "}
                {uploadsThisHour}/{maxUploadsPerHour}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
