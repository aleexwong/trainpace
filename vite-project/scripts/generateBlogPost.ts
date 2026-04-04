/**
 * AI Blog Post + PSEO Generator for TrainPace
 *
 * Uses the Gemini API to generate:
 *   1. A new blog post → appended to src/data/blog-posts.json
 *   2. A matching PSEO config entry → appended to src/features/seo-pages/seoPages.ts
 *      (blogSeoPages array, adds FAQ schema + HowTo schema to the blog page)
 *
 * Usage:
 *   npm run generate-blog "heart rate training for beginners"
 *   npm run generate-blog "how to run your first 10K" training
 *
 * Arguments:
 *   $1  - Topic (required)
 *   $2  - Category hint (optional): training | nutrition | race-strategy | gear | recovery | beginner | advanced
 *
 * Requirements:
 *   VITE_GEMINI_API_KEY must be set in vite-project/.env or your shell.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from vite-project root
config({ path: path.join(__dirname, "../.env") });
config({ path: path.join(__dirname, "../.env.local") }); // override with .env.local if present

const BLOG_POSTS_PATH = path.join(__dirname, "../src/data/blog-posts.json");
const SEO_PAGES_PATH = path.join(
  __dirname,
  "../src/features/seo-pages/seoPages.ts"
);

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

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

interface FaqItem {
  question: string;
  answer: string;
}

interface HowToStep {
  name: string;
  text: string;
}

interface PseoEntry {
  slug: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  bullets: string[];
  faq: FaqItem[];
  howTo: { name: string; description: string; steps: HowToStep[] };
}

interface GeneratedContent {
  blogPost: Omit<BlogPost, "date" | "author">;
  pseo: PseoEntry;
}

// ---------------------------------------------------------------------------
// Gemini API call
// ---------------------------------------------------------------------------

async function callGemini(prompt: string, systemInstruction: string): Promise<string> {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "VITE_GEMINI_API_KEY is not set.\n" +
        "Add it to vite-project/.env:\n" +
        "  VITE_GEMINI_API_KEY=your-key-here\n" +
        "Get a key at https://aistudio.google.com/app/apikey"
    );
  }

  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = (errorData as { error?: { message?: string } }).error?.message ||
      `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(`Gemini API error: ${msg}`);
  }

  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");
  return text.trim();
}

// ---------------------------------------------------------------------------
// Content generation
// ---------------------------------------------------------------------------

const SYSTEM_INSTRUCTION = `You are Alex — a developer and runner who went from 3:01 to 2:06 in the half marathon at BMO Vancouver.

Your writing voice:
- First-person, direct, no fluff
- Personal anecdotes ground every piece (BMO Vancouver, run club, training decisions you actually made)
- Practical advice over theory
- Tables where they help (pace data, comparisons, nutrition timing)
- Internal links to TrainPace tools where relevant:
    [Pace Calculator](/calculator)
    [Fuel Planner](/fuel)
    [Elevation Finder](/elevation-finder)
    [VDOT Calculator](/vdot)
- Short sentences. Occasional one-liners. No excessive transitions
- Honest about mistakes you made — that's what makes the advice credible

Categories: training, nutrition, race-strategy, gear, recovery, beginner, advanced`;

async function generateContent(
  topic: string,
  categoryHint?: string
): Promise<GeneratedContent> {
  const categoryInstruction = categoryHint
    ? `Use category: "${categoryHint}"`
    : `Pick the most appropriate category from: training, nutrition, race-strategy, gear, recovery, beginner, advanced`;

  const prompt = `Write a blog post AND a matching SEO config for TrainPace about: "${topic}"

${categoryInstruction}

Return a single JSON object with exactly this structure (no markdown, no code fences, raw JSON only):

{
  "blogPost": {
    "slug": "url-friendly-slug-under-60-chars",
    "title": "Full Post Title (under 70 chars)",
    "excerpt": "1-2 sentence teaser under 160 chars",
    "category": "one of: training|nutrition|race-strategy|gear|recovery|beginner|advanced",
    "tags": ["tag1", "tag2", "tag3"],
    "readingTime": 7,
    "featured": false,
    "content": "# Title\\n\\nFull post in markdown, 600-900 words. Use ## for H2 sections, include a table where relevant, link to TrainPace tools."
  },
  "pseo": {
    "slug": "same-slug-as-blogPost",
    "path": "/blog/same-slug-as-blogPost",
    "title": "SEO title tag (under 65 chars) | TrainPace",
    "description": "Meta description under 155 chars",
    "h1": "Page H1 (can differ slightly from title)",
    "intro": "2-3 sentence intro paragraph for SEO landing page",
    "bullets": [
      "Key benefit or takeaway 1",
      "Key benefit or takeaway 2",
      "Key benefit or takeaway 3"
    ],
    "faq": [
      { "question": "Common question about the topic?", "answer": "Direct 2-3 sentence answer." },
      { "question": "Second common question?", "answer": "Direct 2-3 sentence answer." },
      { "question": "Third common question?", "answer": "Direct 2-3 sentence answer." }
    ],
    "howTo": {
      "name": "How to [main action from the topic]",
      "description": "One sentence describing what this guide covers",
      "steps": [
        { "name": "Step 1 name", "text": "What to actually do in step 1." },
        { "name": "Step 2 name", "text": "What to actually do in step 2." },
        { "name": "Step 3 name", "text": "What to actually do in step 3." }
      ]
    }
  }
}`;

  console.log(`Calling Gemini (${GEMINI_MODEL})...`);

  const dotInterval = setInterval(() => process.stdout.write("."), 800);
  let rawJson: string;
  try {
    rawJson = await callGemini(prompt, SYSTEM_INSTRUCTION);
  } finally {
    clearInterval(dotInterval);
    process.stdout.write("\n");
  }

  // Strip accidental code fences
  const jsonText = rawJson
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: GeneratedContent;
  try {
    parsed = JSON.parse(jsonText) as GeneratedContent;
  } catch (e) {
    console.error("Raw response (first 600 chars):\n", jsonText.slice(0, 600));
    throw new Error(`Failed to parse Gemini response as JSON: ${e}`);
  }

  // Validate
  const requiredBlogFields = ["slug", "title", "excerpt", "category", "tags", "content"];
  for (const f of requiredBlogFields) {
    if (!parsed.blogPost?.[f as keyof typeof parsed.blogPost]) {
      throw new Error(`Missing blogPost.${f}`);
    }
  }
  if (!VALID_CATEGORIES.includes(parsed.blogPost.category as Category)) {
    throw new Error(`Invalid category: ${parsed.blogPost.category}`);
  }
  if (!parsed.pseo?.slug || !parsed.pseo?.faq?.length) {
    throw new Error("PSEO entry is missing required fields");
  }

  // Ensure slugs match
  parsed.pseo.slug = parsed.blogPost.slug;
  parsed.pseo.path = `/blog/${parsed.blogPost.slug}`;

  return parsed;
}

// ---------------------------------------------------------------------------
// File writers
// ---------------------------------------------------------------------------

function estimateReadingTime(content: string): number {
  return Math.max(4, Math.round(content.split(/\s+/).length / 200));
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function writeBlogPost(
  partial: Omit<BlogPost, "date" | "author">
): void {
  const raw = fs.readFileSync(BLOG_POSTS_PATH, "utf-8");
  const data: BlogData = JSON.parse(raw);

  const existing = data.posts.find((p) => p.slug === partial.slug);
  if (existing) {
    throw new Error(
      `Slug "${partial.slug}" already exists ("${existing.title}"). ` +
        `Pick a different topic or rename the slug.`
    );
  }

  const post: BlogPost = {
    ...partial,
    date: getToday(),
    author: {
      name: "Alex",
      bio: "Developer & runner. Went from 3:01 to 2:06 in the half marathon.",
    },
    readingTime: estimateReadingTime(partial.content),
  };

  data.posts.unshift(post); // newest first
  fs.writeFileSync(BLOG_POSTS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function writePseoEntry(pseo: PseoEntry): void {
  const raw = fs.readFileSync(SEO_PAGES_PATH, "utf-8");

  // Anchor comment inside blogSeoPages array
  const ANCHOR = "// Generated blog PSEO entries will be inserted above this comment";
  if (!raw.includes(ANCHOR)) {
    throw new Error(
      `Could not find insertion anchor in seoPages.ts.\n` +
        `Expected the comment: ${ANCHOR}`
    );
  }

  // Build the TypeScript object literal to insert
  const indent = "  ";
  const faqTs = pseo.faq
    .map(
      (f) =>
        `${indent}  { question: ${JSON.stringify(f.question)}, answer: ${JSON.stringify(f.answer)} }`
    )
    .join(",\n");

  const stepsTs = pseo.howTo.steps
    .map(
      (s) =>
        `${indent}    { name: ${JSON.stringify(s.name)}, text: ${JSON.stringify(s.text)} }`
    )
    .join(",\n");

  const bulletsTs = pseo.bullets
    .map((b) => `${indent}  ${JSON.stringify(b)}`)
    .join(",\n");

  const entry = `
  {
    id: generatePageId('blog', ${JSON.stringify(pseo.slug)}),
    slug: ${JSON.stringify(pseo.slug)},
    tool: 'blog' as const,
    path: ${JSON.stringify(pseo.path)},
    title: ${JSON.stringify(pseo.title)},
    description: ${JSON.stringify(pseo.description)},
    h1: ${JSON.stringify(pseo.h1)},
    intro: ${JSON.stringify(pseo.intro)},
    bullets: [
${bulletsTs},
    ],
    cta: { href: ${JSON.stringify(pseo.path)}, label: 'Read the full guide' },
    faq: [
${faqTs},
    ],
    howTo: {
      name: ${JSON.stringify(pseo.howTo.name)},
      description: ${JSON.stringify(pseo.howTo.description)},
      steps: [
${stepsTs},
      ],
    },
  },
  ${ANCHOR}`;

  const updated = raw.replace(ANCHOR, entry);
  fs.writeFileSync(SEO_PAGES_PATH, updated, "utf-8");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error(
      "Usage: npm run generate-blog \"<topic>\" [category]\n" +
        "Example: npm run generate-blog \"how to negative split a marathon\" race-strategy\n\n" +
        "Valid categories: " +
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

  console.log(`\nGenerating blog post + PSEO entry: "${topic}"`);
  if (categoryArg) console.log(`Category hint: ${categoryArg}`);
  console.log("");

  try {
    const { blogPost, pseo } = await generateContent(topic, categoryArg);

    // Write blog post
    writeBlogPost(blogPost);

    // Write PSEO entry
    writePseoEntry(pseo);

    console.log(`\nBlog post created:`);
    console.log(`  Title:    ${blogPost.title}`);
    console.log(`  Slug:     ${blogPost.slug}`);
    console.log(`  Category: ${blogPost.category}`);
    console.log(`  Tags:     ${blogPost.tags.join(", ")}`);
    console.log(`  Words:    ~${blogPost.content.split(/\s+/).length}`);
    console.log(`\nPSEO entry created:`);
    console.log(`  Path:     /blog/${pseo.slug}`);
    console.log(`  FAQ items: ${pseo.faq.length}`);
    console.log(`  HowTo steps: ${pseo.howTo.steps.length}`);
    console.log(`\nView at: http://localhost:5173/blog/${blogPost.slug}`);
  } catch (err) {
    console.error("\nError:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
