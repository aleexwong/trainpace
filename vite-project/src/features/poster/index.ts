/**
 * Poster Feature - Main Export
 */

export * from "./types";
export * from "./hooks";
export * from "./utils";
export * from "./components";

// Default exports for backwards compatibility
export { PosterGenerator as default } from "./components/PosterGenerator";
export { PosterGenerator as PosterGeneratorV3 } from "./components/PosterGenerator";
