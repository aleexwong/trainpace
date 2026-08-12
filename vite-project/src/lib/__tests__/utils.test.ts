import { describe, it, expect } from "vitest";
import { isValidRedirect } from "../utils";

describe("isValidRedirect", () => {
  it("accepts same-origin relative paths", () => {
    expect(isValidRedirect("/")).toBe(true);
    expect(isValidRedirect("/dashboard")).toBe(true);
    expect(isValidRedirect("/fuel?savePlan=true")).toBe(true);
    expect(isValidRedirect("/elevation-finder/guides/boston")).toBe(true);
    expect(isValidRedirect("/plan#week-3")).toBe(true);
  });

  it("rejects absolute URLs and protocol-relative paths", () => {
    expect(isValidRedirect("http://evil.com")).toBe(false);
    expect(isValidRedirect("https://evil.com")).toBe(false);
    expect(isValidRedirect("//evil.com")).toBe(false);
    expect(isValidRedirect("javascript:alert(1)")).toBe(false);
  });

  // The WHATWG URL parser treats a backslash as an authority introducer for
  // special schemes, so these resolve to https://evil.com/ despite looking like
  // relative paths. A startsWith("//") check does not catch them.
  it("rejects backslash authority bypasses", () => {
    expect(isValidRedirect("/\\evil.com")).toBe(false);
    expect(isValidRedirect("/\\\\evil.com")).toBe(false);
    expect(isValidRedirect("\\/evil.com")).toBe(false);
    expect(isValidRedirect("/\\@evil.com")).toBe(false);
    expect(isValidRedirect("//\\evil.com")).toBe(false);
  });

  it("rejects empty and non-rooted input", () => {
    expect(isValidRedirect("")).toBe(false);
    expect(isValidRedirect("dashboard")).toBe(false);
  });

  it("does not decode percent-encoded slashes into an authority", () => {
    expect(isValidRedirect("/%2f%2fevil.com")).toBe(true);
  });
});
