<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Customising this store (for agents)

This repository is a template that is copied per merchant. Keep changes in the customisation surfaces below; avoid editing components unless the merchant needs a layout change.

| Task | Edit |
| --- | --- |
| Branding, navigation, social links, SEO defaults, home page copy | `store.config.ts` |
| Logo and favicon | `public/brand/` (and `logo`/`favicon` in `store.config.ts`) |
| About, contact, policies, other migrated pages | `content/pages/**` (`.mdx`, `.md` or `.json` with `html`) |
| Blog posts | `content/blog/*` |
| SEO titles/descriptions for products, collections or home | `content/seo.json` (keyed by path) |
| Old URL -> new URL | `redirects.json` (301 by default) |
| How checkout talks to HitPay | `src/lib/hitpay/checkout-adapter.ts` only |

Rules:

- Never commit secrets. Credentials go in environment variables; `.env.example` holds placeholders only.
- Do not add HitPay fees, rates, payout times or market/payment-method availability to any page or copy.
- Do not add API calls that delete, refund or cancel anything. `src/lib/hitpay/client.ts` intentionally has no DELETE support.
- Do not request OAuth scopes beyond `OAUTH_SCOPES` in `src/lib/hitpay/oauth.ts` unless the merchant opts in.
- Use JSON content with an `html` field for content scraped from another site; it is sanitised. Only write MDX you authored.
- Content pages cannot live under `admin`, `api`, `blog`, `cart`, `checkout`, `collections` or `products`.
- Product URLs are `/products/<handle>`, where the handle is the slugified product name. Collection URLs are `/collections/<handle>` from HitPay category names.

Before finishing, run `npm run check` (lint, typecheck, tests, build).
