/**
 * AI Blog Post Generator for TrainPace
 *
 * Generates new blog posts in Alex's voice using Claude, then appends them
 * to src/data/blog-posts.json automatically.
 *
 * Usage:
 *   npm run generate-blog "heart rate training for beginners"
 *   npm run generate-blog "how to run your first 10K" training
 *
 * Arguments:
 *   $1  - Topic (required)
 *   $2  - Category (optional): training | nutrition | race-strategy | gear | recovery | beginner | advanced
 *
 * Requirements:
 *   ANTHROPIC_API_KEY environment variable must be set.
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_POSTS_PATH = path.join(__dirname, "../src/data/blog-posts.json");

const VALID_CATEGORIES = [
  "training",
  "nutrition",
  "race-strategy",
  "gear",
  "recovery",
  "beginner",
  "advanced",
] as const;

type Category = (typeof VALID_CATEGORIES)[number];

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: { name: string; bio: string };
  category: Category;
  tags: string[];
  readingTime: number;
  featured: boolean;
  content: string;
}

interface BlogData {
  posts: BlogPost[];
}

const SYSTEM_PROMPT = `You are Alex — a developer and runner who went from 3:01 to 2:06 in the half marathon.

Your writing voice:
- First-person, direct, no fluff
- Personal anecdotes ground every piece
- Practical advice over theory
- Tables where they help (pace data, comparisons)
- Internal links to TrainPace tools: [Pace Calculator](/calculator), [Fuel Planner](/fuel), [Elevation Finder](/elevation-finder), [VDOT Calculator](/vdot)
- Short sentences. Occasional one-liners. No excessive transitions
- Write about things you've actually done, not just things runners "should" do

What NOT to do:
- No "In conclusion..." or "In summary..."
- No excessive hedging ("it might be worth considering...")
- No padding or filler sentences
- Don't start every section the same way

Blog categories available: training, nutrition, race-strategy, gear, recovery, beginner, advanced`;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function estimateReadingTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(4, Math.round(words / 200));
}

async function generateBlogPost(
  topic: string,
  categoryHint?: string
): Promise<BlogPost> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is not set.\nAdd it to vite-project/.env or export it in your shell."
    );
  }

  const client = new Anthropic({ apiKey });

  const categoryInstruction = categoryHint
    ? `Category: ${categoryHint}`
    : "Pick the most appropriate category from the list.";

  const userPrompt = `Write a blog post for TrainPace about: "${topic}"

${categoryInstruction}

Return ONLY a valid JSON object with this exact schema (no markdown, no code fences, just raw JSON):
{
  "slug": "url-friendly-slug",
  "title": "Full Post Title",
  "excerpt": "1-2 sentence teaser (under 160 chars)",
  "category": "one of: training|nutrition|race-strategy|gear|recovery|beginner|advanced",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "readingTime": 7,
  "featured": false,
  "content": "# Full post in markdown...\\n\\n..."
}

Requirements:
- title: Under 70 characters
- excerpt: Under 160 characters
- content: 600-900 words of markdown. Use ## for sections, tables where useful, and link to TrainPace tools where relevant
- tags: 3-5 lowercase strings
- readingTime: estimated minutes (200 words/min)
- Do not include date or author (added by script)`;

  console.log(`Calling Claude claude-opus-4-6 to generate post about: "${topic}"...`);

  const stream = client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  // Stream progress dots while waiting
  let dotInterval: ReturnType<typeof setInterval> | null = null;
  dotInterval = setInterval(() => process.stdout.write("."), 1000);

  const finalMessage = await stream.finalMessage();

  if (dotInterval) clearInterval(dotInterval);
  process.stdout.write("\n");

  // Extract the text content (thinking blocks come first, skip them)
  const textBlock = finalMessage.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  const rawText = textBlock.text.trim();

  // Strip any accidental markdown code fences
  const jsonText = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: Partial<BlogPost>;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    console.error("Raw response:\n", rawText.slice(0, 500));
    throw new Error(`Failed to parse Claude response as JSON: ${e}`);
  }

  // Validate required fields
  const required = [
    "slug",
    "title",
    "excerpt",
    "category",
    "tags",
    "content",
  ];
  for (const field of required) {
    if (!parsed[field as keyof BlogPost]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (!VALID_CATEGORIES.includes(parsed.category as Category)) {
    throw new Error(
      `Invalid category: ${parsed.category}. Must be one of: ${VALID_CATEGORIES.join(", ")}`
    );
  }

  const content = parsed.content as string;

  return {
    slug: parsed.slug as string,
    title: parsed.title as string,
    excerpt: parsed.excerpt as string,
    date: getToday(),
    author: {
      name: "Alex",
      bio: "Developer & runner. Went from 3:01 to 2:06 in the half marathon.",
    },
    category: parsed.category as Category,
    tags: (parsed.tags as string[]) || [],
    readingTime: estimateReadingTime(content),
    featured: false,
    content,
  };
}

function appendPost(post: BlogPost): void {
  const raw = fs.readFileSync(BLOG_POSTS_PATH, "utf-8");
  const data: BlogData = JSON.parse(raw);

  // Check for slug collision
  const existing = data.posts.find((p) => p.slug === post.slug);
  if (existing) {
    throw new Error(
      `A post with slug "${post.slug}" already exists (title: "${existing.title}"). ` +
        `Choose a different topic or manually rename the slug.`
    );
  }

  // Prepend so newest posts appear first
  data.posts.unshift(post);
  fs.writeFileSync(BLOG_POSTS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error(
      "Usage: npm run generate-blog \"<topic>\" [category]\n" +
        "Example: npm run generate-blog \"how to negative split a marathon\" race-strategy\n" +
        "\nValid categories: " +
        VALID_CATEGORIES.join(", ")
    );
    process.exit(1);
  }

  const topic = args[0];
  const categoryArg = args[1]?.toLowerCase();

  if (categoryArg && !VALID_CATEGORIES.includes(categoryArg as Category)) {
    console.error(
      `Invalid category: "${categoryArg}"\nValid: ${VALID_CATEGORIES.join(", ")}`
    );
    process.exit(1);
  }

  console.log(`\nGenerating blog post: "${topic}"`);
  if (categoryArg) console.log(`Category hint: ${categoryArg}`);
  console.log("");

  try {
    const post = await generateBlogPost(topic, categoryArg);

    console.log(`\nGenerated post:`);
    console.log(`  Title:    ${post.title}`);
    console.log(`  Slug:     ${post.slug}`);
    console.log(`  Category: ${post.category}`);
    console.log(`  Tags:     ${post.tags.join(", ")}`);
    console.log(`  Reading:  ~${post.readingTime} min`);
    console.log(`  Words:    ~${post.content.split(/\s+/).length}`);

    appendPost(post);

    console.log(`\nAdded to blog-posts.json`);
    console.log(`View at: /blog/${post.slug}`);
  } catch (err) {
    console.error("\nError:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
