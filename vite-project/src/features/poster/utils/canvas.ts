/**
 * Poster Feature - Canvas Rendering Utilities
 */

import { PRINT_CONFIG, type PosterData } from "../types";

/**
 * Render stats overlay on the poster canvas
 */
export const renderStats = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  top: number,
  scale: number,
  posterData: PosterData
): void => {
  // Enable text rendering quality hints
  (ctx as any).textRendering = "optimizeLegibility";
  (ctx as any).fontKerning = "normal";

  const fontSize = Math.max(8, 14 * scale);
  const headerFontSize = Math.max(10, 16 * scale);
  const margin = 60 * scale;

  const textColor =
    posterData.backgroundColor === "#1a1a1a" ? "#ffffff" : "#000000";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const courseText = `${posterData.city.toUpperCase()} | ${posterData.raceName.toUpperCase()}`;
  const statsText = `${posterData.athleteName} | ${posterData.time} | ${posterData.distance} | ${posterData.date}`;

  const lineSpacing = Math.max(20, 35 * scale);
  const centerY = top + height / 2;
  const courseY = centerY - lineSpacing / 2;
  const statsY = centerY + lineSpacing / 2;

  const maxWidth = width - margin * 2;

  // Calculate course font size to fit
  let actualCourseFontSize = headerFontSize;
  do {
    ctx.font = `bold ${actualCourseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    const textWidth = ctx.measureText(courseText).width;
    if (textWidth <= maxWidth) break;
    actualCourseFontSize -= 1;
  } while (actualCourseFontSize > 8);

  // Calculate stats font size to fit
  let actualStatsFontSize = fontSize;
  do {
    ctx.font = `${actualStatsFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    const textWidth = ctx.measureText(statsText).width;
    if (textWidth <= maxWidth) break;
    actualStatsFontSize -= 1;
  } while (actualStatsFontSize > 6);

  // Draw course text
  ctx.fillStyle = textColor;
  ctx.font = `bold ${actualCourseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.fillText(courseText, width / 2, courseY);

  // Draw stats text
  ctx.font = `${actualStatsFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.fillText(statsText, width / 2, statsY);
};

/**
 * Update preview canvas with stats overlay
 */
export const updatePreviewCanvas = (
  canvas: HTMLCanvasElement,
  posterData: PosterData
): void => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const displayWidth = canvas.offsetWidth;
  const displayHeight = canvas.offsetHeight;
  const scale = window.devicePixelRatio || 2;

  canvas.width = displayWidth * scale;
  canvas.height = displayHeight * scale;
  canvas.style.width = displayWidth + "px";
  canvas.style.height = displayHeight + "px";
  ctx.scale(scale, scale);

  // Clear canvas
  ctx.clearRect(0, 0, displayWidth, displayHeight);

  // Only draw stats at the bottom - map is already visible underneath
  const statsHeight = displayHeight * PRINT_CONFIG.statsHeight;
  const statsTop = displayHeight * PRINT_CONFIG.mapHeight;

  // Draw stats background
  ctx.fillStyle = posterData.backgroundColor;
  ctx.fillRect(0, statsTop, displayWidth, statsHeight);

  // Draw stats text
  const statsScale = displayWidth / PRINT_CONFIG.width;
  renderStats(ctx, displayWidth, statsHeight, statsTop, statsScale, posterData);
};

/**
 * Generate full quality poster from map canvas
 */
export const generatePosterImage = async (
  mapCanvas: HTMLCanvasElement,
  posterData: PosterData
): Promise<Blob | null> => {
  // Create final poster canvas at print resolution
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = PRINT_CONFIG.width;
  finalCanvas.height = PRINT_CONFIG.height;
  const ctx = finalCanvas.getContext("2d", {
    alpha: false,
    desynchronized: false,
  })!;

  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Fill background
  ctx.fillStyle = posterData.backgroundColor;
  ctx.fillRect(0, 0, PRINT_CONFIG.width, PRINT_CONFIG.height);

  // Calculate map area with margins
  const margin = PRINT_CONFIG.width * 0.05;
  const mapWidth = PRINT_CONFIG.width - margin * 2;
  const mapHeight = PRINT_CONFIG.height * PRINT_CONFIG.mapHeight - margin * 2;

  // Draw the preview map scaled up to print resolution
  ctx.drawImage(
    mapCanvas,
    0,
    0,
    mapCanvas.width,
    mapCanvas.height,
    margin,
    margin,
    mapWidth,
    mapHeight
  );

  // Draw stats
  const statsTop = PRINT_CONFIG.height * PRINT_CONFIG.mapHeight;
  renderStats(
    ctx,
    PRINT_CONFIG.width,
    PRINT_CONFIG.height * PRINT_CONFIG.statsHeight,
    statsTop,
    6,
    posterData
  );

  // Export as blob
  return new Promise((resolve) => {
    finalCanvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
  });
};
