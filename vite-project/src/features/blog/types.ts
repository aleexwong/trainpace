export interface BlogPost {
  slug: string;
  title: string;
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
  training: "bg-blue-100 text-blue-800",
  nutrition: "bg-green-100 text-green-800",
  "race-strategy": "bg-purple-100 text-purple-800",
  gear: "bg-orange-100 text-orange-800",
  recovery: "bg-teal-100 text-teal-800",
  beginner: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
};
