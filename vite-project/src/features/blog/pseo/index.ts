// pSEO content generator - combines all templates and data
import { BlogPost } from "../types";
import { races, timeGoals } from "./data";
import { generateRaceTrainingPost } from "./templates/race-training";
import { generateTimeGoalPost } from "./templates/time-goal";

// Generate all pSEO posts
export function getAllPSEOPosts(): BlogPost[] {
  const posts: BlogPost[] = [];

  // Generate race-specific training guides
  for (const race of races) {
    posts.push(generateRaceTrainingPost(race));
  }

  // Generate time-goal training guides
  for (const goal of timeGoals) {
    posts.push(generateTimeGoalPost(goal));
  }

  return posts;
}

// Get all pSEO slugs (for prerendering)
export function getAllPSEOSlugs(): string[] {
  return getAllPSEOPosts().map((post) => post.slug);
}

// Get a specific pSEO post by slug
export function getPSEOPostBySlug(slug: string): BlogPost | undefined {
  return getAllPSEOPosts().find((post) => post.slug === slug);
}

// Export data for use in other modules
export { races, timeGoals };
export { generateRaceTrainingPost } from "./templates/race-training";
export { generateTimeGoalPost } from "./templates/time-goal";
