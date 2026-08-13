/**
 * PageDoc → Markdown
 *
 * Renders the shared block model as GitHub-flavored Markdown with a small YAML
 * front matter header. This is what gets served at `<path>.md` and what
 * `llms-full.txt` is assembled from.
 */

import { BASE_URL } from "../seo/types";
import type { DocBlock, PageDoc } from "./types";

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The `.md` mirror path for a route.
 * "/" → "/index.md", "/calculator" → "/calculator.md".
 */
export function markdownPathForRoute(route: string): string {
  if (route === "/") return "/index.md";
  return `${route.replace(/\/$/, "")}.md`;
}

function yamlString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** Pipes would break the table row; escape them. */
function tableCell(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function renderBlock(block: DocBlock): string {
  switch (block.type) {
    case "heading":
      return `${"#".repeat(block.level)} ${block.text}`;

    case "paragraph":
      return block.text;

    case "list":
      return block.items
        .map((item, i) => (block.ordered ? `${i + 1}. ${item}` : `- ${item}`))
        .join("\n");

    case "linkList":
      return block.items
        .map((item) => {
          const link = `- [${item.label}](${absoluteUrl(item.href)})`;
          return item.note ? `${link} — ${item.note}` : link;
        })
        .join("\n");

    case "table": {
      const header = `| ${block.headers.map(tableCell).join(" | ")} |`;
      const divider = `| ${block.headers.map(() => "---").join(" | ")} |`;
      const body = block.rows
        .map((row) => `| ${row.map(tableCell).join(" | ")} |`)
        .join("\n");
      const table = [header, divider, body].join("\n");
      return block.caption ? `**${block.caption}**\n\n${table}` : table;
    }

    case "code":
      return `\`\`\`${block.lang ?? ""}\n${block.text}\n\`\`\``;

    case "quote":
      return block.text
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
  }
}

/**
 * Render a full page document as Markdown, including front matter.
 */
export function renderMarkdown(doc: PageDoc): string {
  const frontMatter = [
    "---",
    `title: ${yamlString(doc.title)}`,
    `description: ${yamlString(doc.description)}`,
    `url: ${absoluteUrl(doc.path)}`,
    "---",
  ].join("\n");

  const body = doc.blocks.map(renderBlock).join("\n\n");

  return `${frontMatter}\n\n${body}\n`;
}

/**
 * Render a document as a section of a larger file (no front matter), with the
 * canonical URL inlined so a reader of the concatenated file can still tell
 * where each section came from. Heading levels are pushed down one so the
 * page H1 nests under the file's own structure.
 */
export function renderMarkdownSection(doc: PageDoc): string {
  const demoted: DocBlock[] = doc.blocks.map((block) =>
    block.type === "heading"
      ? { ...block, level: Math.min(block.level + 1, 3) as 1 | 2 | 3 }
      : block
  );

  const header = `## ${doc.title}\n\nURL: ${absoluteUrl(doc.path)}`;
  const body = demoted.map(renderBlock).join("\n\n");

  return `${header}\n\n${body}\n`;
}
