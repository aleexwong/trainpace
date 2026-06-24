/**
 * Route slug helpers for ElevationFinder shareable URLs.
 *
 * Uploaded routes use human-readable URLs of the form:
 *   /elevationfinder/{slug}-{shortId}      e.g. /elevationfinder/boston-marathon-a3f9c
 *
 * - `slug`    — derived from the route/filename, freely editable by the owner.
 * - `shortId` — an immutable lowercase base36 token, the real resolution key.
 *
 * The slug is purely cosmetic: routes always resolve on the trailing `shortId`,
 * so renaming the slug never breaks an existing link. Legacy URLs that are a
 * raw Firestore doc id (20 hyphen-free alphanumerics) keep working because the
 * loader falls back to a direct document lookup when no shortId is present.
 */

const SHORT_ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

/**
 * Turn an arbitrary route name / filename into a URL-safe slug.
 * Lowercases, drops a trailing `.gpx`, strips accents, and collapses any run
 * of non-alphanumerics into single hyphens. Returns "" if nothing usable
 * remains (callers fall back to a default via buildRouteSlugPath).
 */
export function slugify(input: string, maxLength = 60): string {
  return input
    .toLowerCase()
    .replace(/\.gpx$/i, "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accent marks
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

/**
 * Generate a short, URL-safe, hyphen-free resolution token. 6 base36 chars
 * gives ~2.2B combinations — collisions are astronomically unlikely at any
 * realistic upload volume, and the alphabet guarantees no hyphens so the token
 * is always the last hyphen-delimited segment of a slug path.
 */
export function generateShortId(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += SHORT_ID_ALPHABET[bytes[i] % SHORT_ID_ALPHABET.length];
  }
  return out;
}

/**
 * Build the `{slug}-{shortId}` path segment. Falls back to a "route" slug when
 * the name produced no usable slug, so the result always contains a hyphen and
 * is therefore always distinguishable from a legacy raw doc id.
 */
export function buildRouteSlugPath(slug: string, shortId: string): string {
  const safeSlug = slug && slug.length > 0 ? slug : "route";
  return `${safeSlug}-${shortId}`;
}

/** Full app path for a route slug segment. */
export function buildRouteUrl(slugPath: string): string {
  return `/elevationfinder/${slugPath}`;
}

/**
 * Extract the resolution shortId from a URL param.
 * Returns the segment after the final hyphen for pretty `{slug}-{shortId}`
 * paths, or null when the param has no hyphen (a legacy raw doc id), in which
 * case callers should resolve via a direct document lookup.
 */
export function extractShortId(param: string): string | null {
  if (!param.includes("-")) return null;
  const seg = param.slice(param.lastIndexOf("-") + 1);
  return seg.length > 0 ? seg : null;
}
