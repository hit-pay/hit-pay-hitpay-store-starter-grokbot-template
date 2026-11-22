import { ImageResponse } from "next/og";
import { storeConfig } from "@root/store.config";

/**
 * Default social sharing image (1200x630), generated at build time from
 * store.config.ts. Point `seo.ogImage` at your own image to replace it.
 */
export async function GET() {
  const { colors, name, tagline } = storeConfig;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: colors.background,
          color: colors.foreground,
          borderBottom: `24px solid ${colors.primary}`,
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.1 }}>{name}</div>
        <div style={{ fontSize: 40, marginTop: 24, color: colors.mutedForeground }}>{tagline}</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
