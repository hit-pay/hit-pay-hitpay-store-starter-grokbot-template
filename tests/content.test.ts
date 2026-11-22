import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { getPage, getPages, getPosts, getSeoOverride, RESERVED_SEGMENTS } from "@/lib/content";

describe("bundled content", () => {
  it("includes the starter pages and policies", () => {
    const paths = getPages().map((p) => p.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/about",
        "/contact",
        "/policies/privacy-policy",
        "/policies/refund-policy",
        "/policies/shipping-policy",
        "/policies/terms-of-service",
      ]),
    );
    for (const page of getPages()) {
      expect(page.title).toBeTruthy();
      expect(page.description, `${page.path} needs an SEO description`).toBeTruthy();
      expect(RESERVED_SEGMENTS.has(page.slug[0])).toBe(false);
    }
  });

  it("loads MDX and JSON blog posts newest first", () => {
    const posts = getPosts();
    expect(posts.map((p) => p.slug)).toEqual(["welcome-to-our-new-store", "caring-for-ceramics"]);
    expect(posts[0].body.format).toBe("mdx");
    expect(posts[1].body.format).toBe("html");
  });

  it("reads SEO overrides", () => {
    expect(getSeoOverride("/")?.title).toBeTruthy();
    expect(getSeoOverride("/does-not-exist")).toBeUndefined();
  });
});

describe("content loader", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "content-"));
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  fs.mkdirSync(path.join(dir, "pages", "legal"), { recursive: true });
  fs.mkdirSync(path.join(dir, "pages", "products"), { recursive: true });
  fs.mkdirSync(path.join(dir, "blog"), { recursive: true });
  fs.writeFileSync(path.join(dir, "pages", "legal", "imprint.json"), JSON.stringify({ title: "Imprint", html: "<p>Hi</p>" }));
  fs.writeFileSync(path.join(dir, "pages", "products", "clash.mdx"), "---\ntitle: Clash\n---\nNo");
  fs.writeFileSync(path.join(dir, "blog", "draft.mdx"), "---\ntitle: Draft\ndate: 2026-01-01\ndraft: true\n---\nWIP");

  it("maps nested files to URL paths and skips reserved segments", () => {
    expect(getPages(dir).map((p) => p.path)).toEqual(["/legal/imprint"]);
    expect(getPage(["legal", "imprint"], dir)?.body).toEqual({ format: "html", html: "<p>Hi</p>" });
  });

  it("hides drafts unless asked", () => {
    expect(getPosts({}, dir)).toEqual([]);
    expect(getPosts({ includeDrafts: true }, dir)[0].date).toBe("2026-01-01");
  });
});
