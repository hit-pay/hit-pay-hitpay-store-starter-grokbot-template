/**
 * Store branding and theme settings.
 *
 * This is the single file to edit when rebranding the store. Every part of the
 * theme (header, footer, colours, fonts, SEO defaults, navigation) reads from
 * here. Keep secrets out of this file: it is bundled into the client.
 */
export type StoreConfig = typeof storeConfig;

export const storeConfig = {
  name: "Starter Store",
  tagline: "Thoughtfully made goods, delivered to your door.",
  /** Used for <html lang> and number/currency formatting. */
  locale: "en-SG",
  /** Fallback currency when the catalogue is empty. Products carry their own currency. */
  defaultCurrency: "SGD",

  logo: {
    /** Path under /public or an absolute URL. Set to null to show the store name as text. */
    src: "/brand/logo.svg" as string | null,
    alt: "Starter Store",
    width: 140,
    height: 32,
  },
  /** Path under /public or an absolute URL. */
  favicon: "/brand/favicon.svg",

  /** Any CSS colour value. Exposed as CSS variables (see src/app/layout.tsx). */
  colors: {
    background: "#ffffff",
    foreground: "#1c1917",
    muted: "#f5f5f4",
    mutedForeground: "#57534e",
    border: "#e7e5e4",
    primary: "#1c1917",
    primaryForeground: "#ffffff",
    accent: "#b45309",
  },

  /**
   * Google Fonts family names (loaded from fonts.googleapis.com), or set
   * `googleFonts` to false and use any locally available font stack.
   */
  fonts: {
    googleFonts: true,
    heading: "Fraunces",
    body: "Inter",
    /** Weights requested from Google Fonts for both families. */
    weights: [400, 500, 600, 700],
  },

  /** Rounded corners for buttons, cards and inputs (any CSS length). */
  radius: "0.5rem",

  /** Thin banner above the header, or null to hide it. */
  announcement: "Welcome to our new online store." as string | null,

  navigation: {
    header: [
      { label: "Shop", href: "/products" },
      { label: "Collections", href: "/collections" },
      { label: "Blog", href: "/blog" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    footer: [
      {
        title: "Shop",
        links: [
          { label: "All products", href: "/products" },
          { label: "Collections", href: "/collections" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "About", href: "/about" },
          { label: "Blog", href: "/blog" },
          { label: "Contact", href: "/contact" },
        ],
      },
      {
        title: "Policies",
        links: [
          { label: "Shipping", href: "/policies/shipping-policy" },
          { label: "Returns", href: "/policies/refund-policy" },
          { label: "Privacy", href: "/policies/privacy-policy" },
          { label: "Terms", href: "/policies/terms-of-service" },
        ],
      },
    ],
  },

  /** Leave a value empty ("") to hide that icon. */
  social: {
    instagram: "https://instagram.com/",
    facebook: "",
    tiktok: "",
    x: "",
    youtube: "",
    linkedin: "",
  },

  contact: {
    email: "hello@example.com",
    phone: "",
    address: "",
  },

  seo: {
    /** `%s` is replaced with the page title. */
    titleTemplate: "%s | Starter Store",
    defaultTitle: "Starter Store",
    description:
      "Shop thoughtfully made goods from Starter Store. Secure checkout powered by HitPay.",
    /** Path under /public or absolute URL (1200x630 PNG/JPG). "/og" is generated from this config. */
    ogImage: "/og",
    /** Twitter/X handle including @, or "". */
    twitterHandle: "",
    keywords: [] as string[],
  },

  home: {
    heroTitle: "Everyday goods, made well.",
    heroSubtitle:
      "A small, considered collection of products we use and love. Swap this copy in store.config.ts.",
    heroCta: { label: "Shop all products", href: "/products" },
    /** Path under /public or absolute URL, or null for a colour block. */
    heroImage: null as string | null,
    featuredProductsTitle: "Featured products",
    featuredProductsCount: 8,
  },

  catalog: {
    /** Products per page on /products and collection pages. */
    pageSize: 24,
    /**
     * Restrict to products published on these HitPay sales channels.
     * Empty means "all published products". Valid values per the HitPay API:
     * "online_store", "pos", "invoice".
     */
    channels: [] as Array<"online_store" | "pos" | "invoice">,
  },
};
