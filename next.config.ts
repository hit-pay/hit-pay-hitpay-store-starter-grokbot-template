import type { NextConfig } from "next";
import redirects from "./redirects.json";
import { toNextRedirects, type RedirectEntry } from "./src/lib/redirects";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Content files are read at request time for paths not prerendered at build.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
  async redirects() {
    return toNextRedirects(redirects as RedirectEntry[]);
  },
};

export default nextConfig;
