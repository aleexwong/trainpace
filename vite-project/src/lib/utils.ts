import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validate a redirect path to prevent open redirect attacks.
 * Only allows relative paths starting with "/" and blocks protocol-relative URLs.
 */
export function isValidRedirect(path: string): boolean {
  if (!path || path.startsWith("//") || path.startsWith("http")) return false;
  return path.startsWith("/");
}
