import type { StoreConfig } from "@root/store.config";

const FALLBACK_SANS =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const FALLBACK_SERIF = 'ui-serif, Georgia, Cambria, "Times New Roman", serif';

function fontStack(family: string, fallback: string): string {
  return family.includes(",") ? family : `"${family}", ${fallback}`;
}

/** CSS custom properties consumed by globals.css. */
export function themeCss(config: StoreConfig): string {
  const { colors, fonts, radius } = config;
  const vars: Record<string, string> = {
    "--brand-background": colors.background,
    "--brand-foreground": colors.foreground,
    "--brand-muted": colors.muted,
    "--brand-muted-foreground": colors.mutedForeground,
    "--brand-border": colors.border,
    "--brand-primary": colors.primary,
    "--brand-primary-foreground": colors.primaryForeground,
    "--brand-accent": colors.accent,
    "--brand-font-body": fontStack(fonts.body, FALLBACK_SANS),
    "--brand-font-heading": fontStack(fonts.heading, FALLBACK_SERIF),
    "--brand-radius": radius,
  };
  const body = Object.entries(vars)
    .map(([key, value]) => `${key}:${value.replace(/[<>{};]/g, "")};`)
    .join("");
  return `:root{${body}}`;
}

/** Google Fonts stylesheet URL for the configured families, or null. */
export function googleFontsUrl(config: StoreConfig): string | null {
  const { fonts } = config;
  if (!fonts.googleFonts) return null;
  const families = Array.from(new Set([fonts.heading, fonts.body])).filter(
    (family) => family && !family.includes(","),
  );
  if (families.length === 0) return null;
  const weights = [...fonts.weights].sort((a, b) => a - b).join(";");
  const query = families
    .map((family) => `family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@${weights}`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
