/**
 * Page Document Model
 *
 * A tiny structured block model for page content that has to exist in more than
 * one format. One definition per route feeds:
 *
 *   - `prerender.jsx`  → static HTML inside `#root` (what a no-JS crawler sees)
 *   - `scripts/generateMarkdown.ts` → the `.md` mirror of every page
 *   - `llms-full.txt`  → every page's Markdown, concatenated
 *
 * Keeping one source means the HTML a crawler reads and the Markdown an agent
 * fetches can never drift apart.
 */

export interface DocHeading {
  type: "heading";
  /** 1-3. Level 1 is the page H1 and should appear at most once. */
  level: 1 | 2 | 3;
  text: string;
}

export interface DocParagraph {
  type: "paragraph";
  text: string;
}

export interface DocList {
  type: "list";
  ordered?: boolean;
  items: string[];
}

export interface DocLinkItem {
  href: string;
  label: string;
  /** Optional trailing description, rendered after an em dash. */
  note?: string;
}

/** A list of links that must stay crawlable in both HTML and Markdown. */
export interface DocLinkList {
  type: "linkList";
  /** Optional `aria-label` / section context for the nav element. */
  label?: string;
  items: DocLinkItem[];
}

export interface DocTable {
  type: "table";
  /** Short caption rendered above the table in Markdown, as a <caption> in HTML. */
  caption?: string;
  headers: string[];
  rows: string[][];
}

export interface DocCode {
  type: "code";
  text: string;
  lang?: string;
}

export interface DocQuote {
  type: "quote";
  text: string;
}

export type DocBlock =
  | DocHeading
  | DocParagraph
  | DocList
  | DocLinkList
  | DocTable
  | DocCode
  | DocQuote;

export interface PageDoc {
  /** Route path, e.g. "/calculator". */
  path: string;
  /** <title> value — also the Markdown front-matter title. */
  title: string;
  /** Meta description — also the Markdown front-matter description. */
  description: string;
  blocks: DocBlock[];
}
