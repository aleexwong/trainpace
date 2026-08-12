import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const REDIRECT_SENTINEL_ORIGIN = "https://trainpace.invalid";

/**
 * Validate a redirect path to prevent open redirect attacks.
 *
 * Only same-origin relative paths are allowed. Rather than blocklisting prefixes
 * ("//", "http"), resolve the candidate with the same URL parser the browser uses
 * and require the result to stay on the sentinel origin. Prefix checks miss the
 * cases where the WHATWG parser treats a backslash as an authority introducer:
 * the paths `/\evil.com` and `/\\evil.com` both resolve to https://evil.com/
 * while looking like relative paths.
 */
export function isValidRedirect(path: string): boolean {
  if (!path || !path.startsWith("/")) return false;
  try {
    return (
      new URL(path, REDIRECT_SENTINEL_ORIGIN).origin === REDIRECT_SENTINEL_ORIGIN
    );
  } catch {
    return false;
  }
}
