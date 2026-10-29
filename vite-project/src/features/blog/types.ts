export interface BlogPost {
  slug: string;
  title: string;
  /** Shorter title for <title> when `title` is over 60 chars on its own. */
  seoTitle?: string;
  excerpt: string;
  content: string; // Markdown content
  date: string; // ISO date string
  author: BlogAuthor;
  category: BlogCategory;
  tags: string[];
  coverImage?: string;
  readingTime: number; // minutes
  featured?: boolean;
}

export interface BlogAuthor {
  name: string;
  avatar?: string;
  bio?: string;
}

export type BlogCategory =
  | "training"
  | "nutrition"
  | "race-strategy"
  | "gear"
  | "recovery"
  | "beginner"
  | "advanced";

export const categoryLabels: Record<BlogCategory, string> = {
  training: "Training",
  nutrition: "Nutrition",
  "race-strategy": "Race Strategy",
  gear: "Gear",
  recovery: "Recovery",
  beginner: "Beginner",
  advanced: "Advanced",
};

export const categoryColors: Record<BlogCategory, string> = {
  training: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300",
  nutrition: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300",
  "race-strategy": "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300",
  gear: "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300",
  recovery: "bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300",
  beginner: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300",
  advanced: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300",
};
