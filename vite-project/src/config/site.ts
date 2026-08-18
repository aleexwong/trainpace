/**
 * Canonical site identity.
 *
 * One constant, because the host has to agree in four places that are generated
 * independently: the `<link rel="canonical">` on every page, the JSON-LD `url` /
 * `item` fields, `sitemap.xml`, and the `Link: rel="alternate"` header the edge
 * middleware sets. Before this existed the app hardcoded `https://www.trainpace.com`
 * in 20 files while `scripts/generateSitemap.ts` used `https://www.trainpace.com`,
 * so all 245 prerendered pages canonicalised to a host the sitemap never listed.
 *
 * If this ever changes, the non-canonical host must 301 to the new one at the
 * edge (Vercel project → Domains → set primary). A canonical tag is a hint; a
 * redirect is not.
 */
export const SITE_URL = "https://www.trainpace.com";

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
