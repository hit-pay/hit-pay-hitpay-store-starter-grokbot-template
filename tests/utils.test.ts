import { describe, expect, it } from "vitest";
import { pkceChallenge, seal, unseal } from "@/lib/crypto";
import { htmlToText, truncate } from "@/lib/html";
import { toQueryString } from "@/lib/hitpay/client";
import { buildAuthorizeUrl, OAUTH_SCOPES, parseBusinessInfo } from "@/lib/hitpay/oauth";
import { currencyDigits, formatMoney, minorToDecimalString, toMinorUnits } from "@/lib/money";
import { assignHandles, slugify } from "@/lib/slug";
import { googleFontsUrl, themeCss } from "@/lib/theme";
import { storeConfig } from "@root/store.config";

describe("money", () => {
  it("handles two- and zero-decimal currencies", () => {
    expect(currencyDigits("SGD")).toBe(2);
    expect(currencyDigits("JPY")).toBe(0);
    expect(toMinorUnits(19.99, "SGD")).toBe(1999);
    expect(toMinorUnits(500, "JPY")).toBe(500);
    expect(minorToDecimalString(1999, "SGD")).toBe("19.99");
    expect(formatMoney(12, "SGD", "en-SG")).toContain("12.00");
  });
});

describe("slug", () => {
  it("slugifies names", () => {
    expect(slugify("Café Crème & Co. — 250g")).toBe("cafe-creme-and-co-250g");
    expect(slugify("!!!")).toBe("");
  });

  it("dedupes handles", () => {
    const items = assignHandles([
      { id: "a1", name: "Mug" },
      { id: "b2", name: "Mug" },
      { id: "c3", name: "???" },
    ]);
    expect(items.map((i) => i.handle)).toEqual(["mug", "mug-b2", "item"]);
  });
});

describe("html", () => {
  it("strips tags and truncates on word boundaries", () => {
    expect(htmlToText("<p>Hello&nbsp;<b>world</b></p>")).toBe("Hello world");
    expect(truncate("one two three four five", 16)).toBe("one two three…");
  });
});

describe("crypto", () => {
  const secret = "x".repeat(32);
  it("round-trips sealed values and rejects tampering or wrong secrets", () => {
    const sealed = seal({ a: 1 }, secret);
    expect(unseal(sealed, secret)).toEqual({ a: 1 });
    expect(unseal(sealed, "y".repeat(32))).toBeNull();
    expect(unseal(`${sealed.slice(0, -2)}aa`, secret)).toBeNull();
  });

  it("computes the RFC 7636 S256 challenge", () => {
    expect(pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });
});

describe("oauth", () => {
  it("builds the documented authorize URL with only the store builder scopes", () => {
    const url = new URL(
      buildAuthorizeUrl({
        dashboardHost: "https://dashboard.sandbox.hit-pay.com",
        clientId: "client",
        redirectUri: "https://shop.example/api/auth/hitpay/callback",
        state: "state123",
        codeVerifier: "verifier",
      }),
    );
    expect(url.origin + url.pathname).toBe("https://dashboard.sandbox.hit-pay.com/oauth/authorize");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("commerce:read commerce:create commerce:update customer:read");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("state")).toBe("state123");
  });

  it("never requests delete, refund or cancel scopes", () => {
    expect(OAUTH_SCOPES.filter((s) => /delete|refund|cancel|^payments$|^commerce$|^customer$/.test(s))).toEqual([]);
  });

  it("parses business info defensively", () => {
    expect(parseBusinessInfo({ data: { id: "b1", name: "Acme", country: "sg", currency: "sgd" } })).toEqual({
      id: "b1",
      name: "Acme",
      country: "sg",
      currency: "sgd",
    });
    expect(parseBusinessInfo({ business_id: "b2", business_name: "Beta" })).toMatchObject({ id: "b2", name: "Beta" });
    expect(parseBusinessInfo(null)).toEqual({ id: null, name: null, country: null, currency: null });
  });
});

describe("hitpay client", () => {
  it("encodes arrays Laravel-style", () => {
    expect(toQueryString({ statuses: ["published"], page: 2, skip: undefined })).toBe(
      "?statuses%5B%5D=published&page=2",
    );
  });
});

describe("theme", () => {
  it("exposes brand colours as CSS variables and strips CSS injection", () => {
    const css = themeCss({ ...storeConfig, colors: { ...storeConfig.colors, primary: "red;}</style>" } });
    expect(css).toContain("--brand-primary:red/style;");
    expect(css).not.toContain("</style>");
  });

  it("builds a Google Fonts URL from the configured families", () => {
    expect(googleFontsUrl(storeConfig)).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?family=/);
    expect(googleFontsUrl({ ...storeConfig, fonts: { ...storeConfig.fonts, googleFonts: false } })).toBeNull();
  });
});
