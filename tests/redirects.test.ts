import { describe, expect, it } from "vitest";
import redirects from "@root/redirects.json";
import { toNextRedirects, validateRedirects } from "@/lib/redirects";

describe("redirects.json", () => {
  it("is valid", () => {
    expect(validateRedirects(redirects)).toEqual([]);
  });

  it("produces 301s by default and 302 when permanent is false", () => {
    expect(
      toNextRedirects([
        { source: "/old/", destination: "/new" },
        { source: "/sale", destination: "/collections/sale", permanent: false },
      ]),
    ).toEqual([
      { source: "/old", destination: "/new", statusCode: 301 },
      { source: "/sale", destination: "/collections/sale", statusCode: 302 },
    ]);
  });

  it("reports common mistakes", () => {
    const problems = validateRedirects([
      { source: "old", destination: "/new" },
      { source: "/a", destination: "/a" },
      { source: "/b?x=1", destination: "/c" },
      { source: "/d", destination: "/e" },
      { source: "/d/", destination: "/f" },
      { source: "/g", destination: "ftp://x" },
    ]);
    expect(problems).toHaveLength(5);
    expect(problems.join("\n")).toMatch(/starting with "\/"/);
    expect(problems.join("\n")).toMatch(/itself/);
    expect(problems.join("\n")).toMatch(/query string/);
    expect(problems.join("\n")).toMatch(/duplicates/);
  });

  it("throws on invalid input so the build fails loudly", () => {
    expect(() => toNextRedirects([{ source: "x", destination: "/y" }])).toThrow(/Invalid redirects.json/);
  });
});
