#!/usr/bin/env node
/**
 * Local stand-in for the HitPay API and dashboard, for development and
 * end-to-end checks without a sandbox account. It implements only the
 * endpoints this starter uses, with response shapes taken from
 * docs.hitpayapp.com, and serves the demo catalogue as the merchant's data.
 *
 *   npm run mock:hitpay
 *   HITPAY_API_BASE_URL=http://localhost:4010 HITPAY_DASHBOARD_URL=http://localhost:4010 \
 *   HITPAY_ACCESS_TOKEN=mock-access-token npm run dev
 *
 * The OAuth authorize page auto-approves. The hosted checkout page redirects
 * straight back with status=completed.
 */
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_HITPAY_PORT ?? 4010);
const ACCESS_TOKEN = "mock-access-token";
const API_KEY = "mock-api-key";
const catalog = JSON.parse(readFileSync(new URL("../content/demo-catalog.json", import.meta.url), "utf8"));
const codes = new Map();
const paymentRequests = new Map();

const json = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

const authorized = (req) =>
  req.headers.authorization === `Bearer ${ACCESS_TOKEN}` || req.headers["x-business-api-key"] === API_KEY;

const readBody = (req) =>
  new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });

function paginate(items, page, perPage) {
  const lastPage = Math.max(1, Math.ceil(items.length / perPage));
  return {
    data: items.slice((page - 1) * perPage, page * perPage),
    meta: { current_page: page, last_page: lastPage, per_page: perPage, total: items.length },
  };
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  console.log(`${req.method} ${url.pathname}${url.search}`);

  if (req.method === "DELETE") {
    console.error("!! DELETE request received - the storefront must never send these");
    return json(res, 405, { message: "DELETE is not allowed by the mock" });
  }

  if (req.method === "GET" && url.pathname === "/oauth/authorize") {
    const code = randomUUID();
    codes.set(code, {
      challenge: url.searchParams.get("code_challenge"),
      redirectUri: url.searchParams.get("redirect_uri"),
      scope: url.searchParams.get("scope"),
    });
    console.log(`   scopes requested: ${url.searchParams.get("scope")}`);
    const back = new URL(url.searchParams.get("redirect_uri"));
    back.searchParams.set("code", code);
    back.searchParams.set("state", url.searchParams.get("state") ?? "");
    res.writeHead(302, { Location: back.toString() });
    return res.end();
  }

  if (req.method === "POST" && url.pathname === "/v1/open/oauth/token") {
    const form = new URLSearchParams(await readBody(req));
    if (form.get("grant_type") === "authorization_code") {
      const saved = codes.get(form.get("code"));
      codes.delete(form.get("code"));
      const challenge = createHash("sha256").update(form.get("code_verifier") ?? "").digest("base64url");
      if (!saved || saved.redirectUri !== form.get("redirect_uri") || saved.challenge !== challenge) {
        return json(res, 400, { error: "invalid_grant", error_description: "Invalid code, redirect URI or PKCE verifier" });
      }
    } else if (form.get("grant_type") !== "refresh_token") {
      return json(res, 400, { error: "unsupported_grant_type" });
    }
    return json(res, 200, {
      token_type: "Bearer",
      expires_in: 31536000,
      access_token: ACCESS_TOKEN,
      refresh_token: "mock-refresh-token",
    });
  }

  if (req.method === "GET" && url.pathname.startsWith("/checkout/")) {
    const request = paymentRequests.get(url.pathname.split("/").pop());
    if (!request) return json(res, 404, { message: "Not found" });
    const back = new URL(request.redirect_url);
    back.searchParams.set("reference", request.id);
    back.searchParams.set("status", "completed");
    res.writeHead(302, { Location: back.toString() });
    return res.end();
  }

  if (!url.pathname.startsWith("/v1/")) return json(res, 404, { message: "Not found" });
  if (!authorized(req)) return json(res, 401, { message: "Unauthenticated." });

  if (req.method === "GET" && url.pathname === "/v1/info") {
    return json(res, 200, { id: "mock-business-1", name: "Mock Merchant", country: "sg", currency: "sgd" });
  }
  if (req.method === "GET" && url.pathname === "/v1/products") {
    const page = Number(url.searchParams.get("page") ?? 1);
    const perPage = Number(url.searchParams.get("per_page") ?? 10);
    return json(res, 200, paginate(catalog.products, page, perPage));
  }
  if (req.method === "GET" && url.pathname.startsWith("/v1/products/")) {
    const product = catalog.products.find((p) => p.id === url.pathname.split("/").pop());
    return product ? json(res, 200, product) : json(res, 404, { message: "No query results for model." });
  }
  if (req.method === "GET" && url.pathname === "/v1/product-category") {
    const page = Number(url.searchParams.get("page") ?? 1);
    const perPage = Number(url.searchParams.get("perPage") ?? 20);
    return json(res, 200, paginate(catalog.categories, page, perPage));
  }
  if (req.method === "POST" && url.pathname === "/v1/payment-requests") {
    const body = JSON.parse((await readBody(req)) || "{}");
    console.log("   payment request:", JSON.stringify(body));
    if (!body.currency) return json(res, 422, { message: "The currency field is required." });
    const id = randomUUID();
    const request = {
      id,
      ...body,
      status: "pending",
      url: `http://localhost:${PORT}/checkout/${id}`,
      created_at: new Date().toISOString(),
    };
    paymentRequests.set(id, request);
    return json(res, 200, request);
  }

  return json(res, 404, { message: "Not implemented in mock" });
}).listen(PORT, () => console.log(`Mock HitPay listening on http://localhost:${PORT}`));
