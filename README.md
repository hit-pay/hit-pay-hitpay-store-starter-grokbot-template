# HitPay Store Starter

An open-source starter storefront for HitPay merchants. The HitPay Store Builder Grok Bot copies this repository for each merchant and customises it, and it works just as well as a hand-edited template.

- **Next.js 16** (App Router, TypeScript, Cache Components) with **Tailwind CSS 4**
- Deploys to **Vercel** with zero configuration
- Products, collections and product pages from the **HitPay Products API**
- Client-side **cart**, with checkout handed off to the **HitPay hosted checkout**
- **HitPay OAuth** sign-in for the merchant/admin setup page
- **Content pages and blog** from local MDX or JSON files
- **One branding file** (`store.config.ts`) for logo, colours, fonts, name, social links and SEO defaults
- **301 redirects** from a JSON file, per-page SEO, `sitemap.xml`, `robots.txt` and product structured data

Without any credentials the store runs in **preview mode** with sample products, so you can clone, run and deploy it immediately.

---

## Contents

1. [Quick start](#quick-start)
2. [Connect HitPay](#connect-hitpay)
3. [Environment variables](#environment-variables)
4. [How checkout works](#how-checkout-works)
5. [Rebrand the store](#rebrand-the-store)
6. [Content pages and blog](#content-pages-and-blog)
7. [Redirects](#redirects)
8. [SEO](#seo)
9. [Deploy to Vercel](#deploy-to-vercel)
10. [Go-live checklist](#go-live-checklist)
11. [Project structure](#project-structure)
12. [Development and tests](#development-and-tests)
13. [Security notes](#security-notes)
14. [Known limitations](#known-limitations)

---

## Quick start

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
cp .env.example .env.local   # optional for preview mode
npm run dev
```

Open http://localhost:3000. With no HitPay credentials you'll see the sample catalogue from `content/demo-catalog.json` and a "Preview mode" notice. Checkout stays disabled until HitPay is connected, so nobody can pay for sample products.

## Connect HitPay

The store talks to HitPay in two ways:

| Who | What for | Credential |
| --- | --- | --- |
| Merchant/admin | Sign in at `/admin` to connect their HitPay account and check the setup | OAuth (client ID + secret) |
| Storefront (server) | Load the catalogue and create checkouts for shoppers | `HITPAY_ACCESS_TOKEN` (from the OAuth sign-in) or `HITPAY_API_KEY` |

Shoppers never see either credential: all HitPay calls happen on the server.

The steps below use the HitPay **sandbox**, which is the default. See HitPay's [sandbox guide](https://docs.hitpayapp.com/apis/guide/sandbox) and [OAuth guide](https://docs.hitpayapp.com/platforms/oauth) for full details.

### 1. Create an OAuth app

1. Create a sandbox account at https://dashboard.sandbox.hit-pay.com/register and sign in.
2. Go to **Developers → App Builder → New App**.
3. Add the store's callback URL as a **Redirect URI**:
   - local: `http://localhost:3000/api/auth/hitpay/callback`
   - deployed: `https://your-domain.com/api/auth/hitpay/callback`

   `/admin` shows the exact URI the app is using.
4. Copy the **Client ID** and **Client Secret**. The secret is shown only once.
5. Use **Request Scopes** to request the scopes the store asks for:
   `commerce:read`, `commerce:create`, `commerce:update`, `customer:read`.
   The store never requests delete, refund or cancel scopes.

### 2. Configure and sign in

Add these to `.env.local` (or your Vercel project):

```bash
HITPAY_CLIENT_ID=...
HITPAY_CLIENT_SECRET=...
SESSION_SECRET=$(openssl rand -base64 48)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Restart the dev server, open http://localhost:3000/admin and click **Connect HitPay account**. After approving in HitPay you're sent back to `/admin`, which shows the connected business and checks that the token can read products.

### 3. Give the storefront its credential

The public storefront needs a long-lived server-side credential. On `/admin`, click **Reveal access token**, then save it as `HITPAY_ACCESS_TOKEN` in `.env.local` or your Vercel environment variables (marked **Sensitive**), and restart or redeploy.

HitPay access tokens last one year. `/admin` shows the expiry date; sign in again and replace the variable before it expires.

**Alternative:** set `HITPAY_API_KEY` to a business API key from **Settings → API Keys** instead. If both are set, `HITPAY_ACCESS_TOKEN` is used.

> **Checkout needs one more permission.** The HitPay Payment Request API that powers checkout requires the `payments:create` scope, which is not in the Store Builder scope set. Until HitPay confirms a storefront checkout API, use one of these:
> - request `payments:create` for the OAuth app and add it to `OAUTH_SCOPES` in `src/lib/hitpay/oauth.ts`, or
> - set `HITPAY_API_KEY` for checkout.
>
> See [How checkout works](#how-checkout-works).

### 4. Switch to production

Production is a separate HitPay account with its own OAuth app, scopes and tokens. Create the app at https://dashboard.hit-pay.com, set `HITPAY_ENV=production` with the production client ID, secret and token, and redeploy.

## Environment variables

All variables are listed with placeholders in [`.env.example`](.env.example). Never commit real values: `.env*` files other than `.env.example` are git-ignored.

| Variable | Required | Description |
| --- | --- | --- |
| `HITPAY_ENV` | No | `sandbox` (default) or `production`. Selects the HitPay API and dashboard hosts. |
| `HITPAY_CLIENT_ID` | For `/admin` sign-in | OAuth app client ID. |
| `HITPAY_CLIENT_SECRET` | For `/admin` sign-in | OAuth app client secret. Server-only. |
| `SESSION_SECRET` | For `/admin` sign-in | At least 32 random characters. Encrypts the admin session cookie. |
| `HITPAY_OAUTH_REDIRECT_URI` | No | Overrides the callback URL. Defaults to `${NEXT_PUBLIC_SITE_URL}/api/auth/hitpay/callback`. |
| `ADMIN_ALLOWED_BUSINESS_IDS` | No | Comma-separated HitPay business IDs allowed to sign in to `/admin`. |
| `HITPAY_ACCESS_TOKEN` | For live catalogue/checkout | OAuth access token used by the storefront server. |
| `HITPAY_API_KEY` | Alternative | Business API key, used when no access token is set. |
| `HITPAY_WEBHOOK_URL` | No | Sent as `webhook` on each payment request so HitPay can notify your backend. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Public store URL without a trailing slash. Falls back to the Vercel deployment URL. |
| `CATALOG_SOURCE` | No | `auto` (default), `hitpay` or `demo`. |
| `ALLOW_INDEXING` | No | Outside Vercel, `false` blocks search engines. On Vercel only production is indexable. |
| `HITPAY_API_BASE_URL`, `HITPAY_DASHBOARD_URL` | Dev only | Point at the local mock (`npm run mock:hitpay`). |

## How checkout works

1. The cart lives in the shopper's browser (`localStorage`); there's no server-side cart.
2. **Check out** posts the product IDs, variant IDs and quantities to `POST /api/checkout`. The browser's prices are ignored.
3. The server fetches each product from HitPay (uncached), checks it's published, in stock and in a single currency, and totals it (`src/lib/checkout/price-cart.ts`).
4. The checkout adapter creates a HitPay payment request for that total and returns its hosted checkout `url` (`src/lib/hitpay/checkout-adapter.ts`).
5. The shopper pays on HitPay and is sent back to `/checkout/complete?reference=…&status=…`. If the status is `completed`, the cart is cleared.

The `status` on the return URL can be edited by anyone, so treat it as informational. Confirm payments with a webhook (`HITPAY_WEBHOOK_URL`, see HitPay's [webhook guide](https://docs.hitpayapp.com/apis/guide/events)) or in the HitPay dashboard before fulfilling orders. This starter does not include a webhook receiver.

### The checkout adapter

HitPay's public docs don't describe a storefront cart or checkout-session endpoint, and the Orders API creates `draft` orders without a checkout URL. Checkout therefore uses the documented [Create Payment Request](https://docs.hitpayapp.com/apis/payment-request/create-request) API, isolated in a single module, `src/lib/hitpay/checkout-adapter.ts`. The `TODO(hitpay-product)` comment at the top of that file lists the assumed API shape and what needs confirming. When HitPay ships a storefront API, only that file needs to change.

What the current adapter does **not** do: create a HitPay Order with line items, calculate shipping, tax or discounts, or reduce inventory. The cart summary is sent in the payment request's `purpose` and `metadata`.

## Rebrand the store

Everything brand-related is in [`store.config.ts`](store.config.ts):

| Setting | What it controls |
| --- | --- |
| `name`, `tagline` | Header (when there's no logo), footer, default SEO, generated share image |
| `locale`, `defaultCurrency` | `<html lang>` and price formatting |
| `logo` | Header logo: a file in `/public` or an absolute URL. `src: null` shows the name as text. |
| `favicon` | Browser tab icon |
| `colors` | Background, text, muted, border, primary (buttons), primary text and accent (links). Any CSS colour. |
| `fonts` | Heading and body Google Fonts families and weights. Set `googleFonts: false` and use a font stack such as `"Georgia, serif"` to self-host or use system fonts. |
| `radius` | Corner radius for buttons, cards and inputs |
| `announcement` | Thin banner above the header, or `null` |
| `navigation` | Header links and footer link groups |
| `social` | Social profile URLs. Empty strings are hidden. |
| `contact` | Email (and optional phone/address) shown in the footer |
| `seo` | Title template, default title and description, share image, X handle, keywords |
| `home` | Hero copy, call to action, optional hero image and featured product count |
| `catalog` | "Show more" page size and optional HitPay sales-channel filter |

Typical rebrand:

1. Replace `public/brand/logo.svg` and `public/brand/favicon.svg` (or point `logo.src`/`favicon` at new files).
2. Update `name`, `tagline`, `colors`, `fonts`, `social`, `contact`, `seo` and `home` in `store.config.ts`.
3. Replace the copy in `content/pages/` and `content/blog/`, and **replace the placeholder policies** in `content/pages/policies/`.
4. Delete `public/demo/` once the store uses the live HitPay catalogue (the demo catalogue references those images).

Colours and fonts become CSS variables (`--brand-*`), which Tailwind exposes as `bg-primary`, `text-accent`, `font-heading` and so on (see `src/app/globals.css`). Components use those tokens rather than hard-coded colours, so you rarely need to touch them.

The default share image at `/og` is generated from the config. To use your own, set `seo.ogImage` to a 1200×630 PNG or JPG.

## Content pages and blog

Content lives in `content/` as MDX/Markdown with YAML front matter, or JSON.

```
content/
  pages/about.mdx                     -> /about
  pages/contact.mdx                   -> /contact
  pages/policies/refund-policy.mdx    -> /policies/refund-policy
  blog/welcome-to-our-new-store.mdx   -> /blog/welcome-to-our-new-store
  blog/caring-for-ceramics.json       -> /blog/caring-for-ceramics
  seo.json                            -> per-URL SEO overrides
  demo-catalog.json                   -> sample products for preview mode
```

The folder structure under `content/pages/` becomes the URL, so migrated pages can keep their old paths, which means fewer redirects. Paths starting with `admin`, `api`, `blog`, `cart`, `checkout`, `collections` or `products` belong to the app and are ignored.

**Page front matter**

```mdx
---
title: About us              # page heading and default <title>
description: Our story.      # meta description (recommended)
seoTitle: About Acme Coffee  # optional <title> override
updated: 2026-11-01          # optional "Last updated" date
noindex: false               # optional, hides the page from search engines and the sitemap
---

Markdown or MDX content. Links starting with "/" use client-side navigation.
```

**Blog post front matter**: `title`, `description`, `date` (YYYY-MM-DD, sorts newest first), `author`, `image`, `tags`, `seoTitle`, and `draft: true` to hide a post.

**JSON format.** Use JSON when migrating HTML from an existing site. It takes the same fields as front matter, plus an `html` field that is sanitised before rendering (scripts, event handlers and unknown iframes are removed):

```json
{
  "title": "Shipping policy",
  "description": "Delivery options and timelines.",
  "html": "<p>We deliver…</p>"
}
```

MDX is compiled at build time and can run code, so only commit MDX you trust. Use the JSON format for content scraped from elsewhere.

Remember to add new pages to `navigation` in `store.config.ts` if they should appear in the header or footer.

## Redirects

[`redirects.json`](redirects.json) maps old URLs to new ones. It's read by `next.config.ts` and validated at build time, so a bad entry fails the build instead of silently not working.

```json
[
  { "source": "/shop", "destination": "/products" },
  { "source": "/pages/about-us", "destination": "/about" },
  { "source": "/blogs/news/:slug", "destination": "/blog/:slug" },
  { "source": "/old-sale", "destination": "/collections/sale", "permanent": false }
]
```

- Every entry is a **301** unless it sets `"permanent": false`, which makes it a 302.
- `source` must start with `/`. `destination` is a path or a full `https://` URL.
- Use `:param` to match a path segment and `:path*` to match the rest of a path, e.g. `"/products/:handle.html"` → `"/products/:handle"`. Characters `( ) { } : * + ?` have special meaning in `source`; escape them with `\\` to match them literally. See the [Next.js redirects docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects).
- Query strings aren't matched, so don't put `?` in `source`. Trailing slashes are ignored.
- Duplicate sources and redirects to the same URL are rejected.
- Redirects run before pages, so a redirect from `/collections/all` wins over a collection with the handle `all`.

Run `npm test` to validate the file without a full build. Vercel limits the total number of routes per deployment; if a migration needs thousands of redirects, consider moving them into a proxy (middleware) lookup.

## SEO

- **Titles and descriptions:** products use their name and description, collections their name and description, and content pages and posts their front matter. Everything falls back to `seo` in `store.config.ts`.
- **Overrides:** `content/seo.json` sets the title, description or `noindex` for any path, including product, collection and home pages, which have no content file. This is how migrated SEO titles are carried over:

  ```json
  {
    "/": { "title": "Acme Coffee – Small-batch roasters" },
    "/products/house-blend-coffee": { "title": "House Blend Coffee Beans", "description": "…" }
  }
  ```

- **Canonical URLs, Open Graph and X cards** on every page, using `NEXT_PUBLIC_SITE_URL`.
- **`/sitemap.xml`** lists the home page, product and collection pages, content pages and blog posts (minus anything marked `noindex`).
- **`/robots.txt`** allows the storefront and blocks `/admin`, `/api/`, `/cart` and `/checkout/`. Vercel preview deployments disallow everything, so previews are never indexed.
- **Product structured data** (`schema.org/Product` with offers and stock status) on product pages.

## Deploy to Vercel

1. Push this repository to GitHub, GitLab or Bitbucket.
2. In Vercel, **Add New → Project** and import the repository. No settings need changing: Vercel detects Next.js.
3. Before the first deploy (or afterwards, then redeploy), add environment variables under **Settings → Environment Variables**:
   - Preview mode needs none.
   - For the live store: `HITPAY_ENV`, `HITPAY_CLIENT_ID`, `HITPAY_CLIENT_SECRET`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, and later `HITPAY_ACCESS_TOKEN` (or `HITPAY_API_KEY`). Mark secrets as **Sensitive**.
4. Deploy. Add the deployment's callback URL (`https://<domain>/api/auth/hitpay/callback`) to the HitPay OAuth app's Redirect URIs.
5. Open `https://<domain>/admin`, connect HitPay, reveal the access token, save it as `HITPAY_ACCESS_TOKEN`, and **redeploy** so the catalogue is rebuilt from HitPay.
6. Add a custom domain under **Settings → Domains**, then update `NEXT_PUBLIC_SITE_URL` and the OAuth Redirect URI to the new domain and redeploy.

Catalogue pages are prerendered at build time and refreshed in the background about every minute after they're visited, so product changes in HitPay appear without redeploying. Changes to `store.config.ts`, `content/` or `redirects.json` need a new deployment, which Vercel does automatically on every push.

To deploy from the command line instead: `npx vercel` (preview) and `npx vercel --prod` (production).

## Go-live checklist

- [ ] `store.config.ts` has the merchant's name, logo, colours, fonts, contact details, social links and SEO defaults
- [ ] Placeholder policies in `content/pages/policies/` are replaced with the merchant's own
- [ ] `HITPAY_ENV=production` with production OAuth credentials and a production `HITPAY_ACCESS_TOKEN` or `HITPAY_API_KEY`
- [ ] Checkout tested end to end (see the `payments:create` note in [Connect HitPay](#connect-hitpay))
- [ ] `NEXT_PUBLIC_SITE_URL` is the final domain and the OAuth Redirect URI matches it
- [ ] `ADMIN_ALLOWED_BUSINESS_IDS` is set to the merchant's business ID
- [ ] `redirects.json` covers the old site's URLs
- [ ] A webhook receiver or dashboard process confirms payments before orders are fulfilled
- [ ] `public/demo/` deleted

## Project structure

```
store.config.ts            Branding, navigation, SEO defaults (edit this to rebrand)
redirects.json             Old URL -> new URL redirects (301 by default)
content/                   Pages, blog posts, SEO overrides, demo catalogue
public/brand/              Logo and favicon
src/app/                   Routes
  page.tsx                 Home
  products/, collections/  Catalogue pages
  cart/, checkout/         Cart and post-checkout page
  blog/, [...slug]/        Blog and content pages
  admin/                   Merchant setup page (OAuth)
  api/auth/hitpay/         OAuth login, callback, logout
  api/checkout/            Creates the HitPay checkout for a cart
  sitemap.ts, robots.ts, og/
src/components/            UI components
src/lib/
  env.ts                   All environment variable access
  hitpay/client.ts         Minimal HitPay API client (no DELETE support)
  hitpay/oauth.ts          OAuth URLs, token exchange, scopes
  hitpay/checkout-adapter.ts  The single checkout integration point
  catalog/                 Fetch and normalise products and categories
  checkout/price-cart.ts   Server-side cart validation and pricing
  cart/                    Client cart logic and storage
  content.ts, seo.ts, redirects.ts, theme.ts
scripts/mock-hitpay.mjs    Local mock of the HitPay endpoints this app uses
tests/                     Vitest unit tests
```

## Development and tests

```bash
npm run dev         # development server
npm run lint        # ESLint
npm run typecheck   # generates Next.js route types, then runs tsc
npm test            # Vitest unit tests
npm run build       # production build
npm run check       # all of the above
```

**Local HitPay mock.** `npm run mock:hitpay` starts a mock of the HitPay endpoints this app uses on port 4010, serving the demo catalogue. Its OAuth page auto-approves and its checkout page redirects straight back as completed:

```bash
npm run mock:hitpay
# in another terminal
HITPAY_API_BASE_URL=http://localhost:4010 HITPAY_DASHBOARD_URL=http://localhost:4010 \
HITPAY_ACCESS_TOKEN=mock-access-token HITPAY_CLIENT_ID=mock HITPAY_CLIENT_SECRET=mock \
SESSION_SECRET=0123456789abcdef0123456789abcdef npm run dev
```

The mock follows the documented response shapes, but it is not HitPay. Always test against the real sandbox before going live.

## Security notes

- Secrets are only read on the server through `src/lib/env.ts`. Only `NEXT_PUBLIC_SITE_URL` reaches the browser.
- The OAuth flow uses `state` and PKCE (S256). The admin session is an AES-256-GCM encrypted, `httpOnly`, `SameSite=Lax` cookie that expires after 8 hours.
- `/admin` only shows the access token after a click, through a `POST` request that is never cached.
- Checkout re-prices every cart on the server and rejects cross-origin requests. Consider adding rate limiting (for example with Vercel Firewall) to `/api/checkout` on busy stores.
- The HitPay client has no DELETE method, and the app never calls refund or cancel endpoints.
- Product descriptions and JSON content are sanitised before rendering.

## Known limitations

- **Checkout API is assumed.** See [The checkout adapter](#the-checkout-adapter).
- **No webhook receiver.** Confirm payments with HitPay webhooks or the dashboard.
- **No shipping, tax or discount calculation** in the cart.
- **Storefront token storage.** The storefront reads its credential from an environment variable, so after connecting at `/admin` the token has to be copied into the hosting environment, and renewed yearly. A database or KV store would remove that manual step.
- **`/v1/info` shape.** The docs describe this endpoint but don't publish its schema, so `/admin` reads the business name, ID, country and currency defensively.
- **Unknown URLs return HTTP 200** with the not-found page and a `noindex` tag, which is how Next.js streaming works for paths that weren't prerendered. Known products, collections and pages are prerendered and unaffected.
- Product handles come from product names, because the HitPay Products API has no slug field. Renaming a product changes its URL; add a redirect when that happens.

## License

[MIT](LICENSE)
