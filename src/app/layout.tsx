import type { Metadata } from "next";
import { storeConfig } from "@root/store.config";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { allowIndexing, siteUrl } from "@/lib/env";
import { googleFontsUrl, themeCss } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: storeConfig.seo.defaultTitle, template: storeConfig.seo.titleTemplate },
  description: storeConfig.seo.description,
  keywords: storeConfig.seo.keywords,
  applicationName: storeConfig.name,
  icons: { icon: storeConfig.favicon },
  robots: allowIndexing() ? undefined : { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: storeConfig.name,
    title: storeConfig.seo.defaultTitle,
    description: storeConfig.seo.description,
    images: [storeConfig.seo.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    site: storeConfig.seo.twitterHandle || undefined,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const fontsUrl = googleFontsUrl(storeConfig);
  return (
    <html lang={storeConfig.locale} className="h-full antialiased">
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss(storeConfig) }} />
        {fontsUrl && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={fontsUrl} />
          </>
        )}
      </head>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-4">
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
