export type ProductImage = { url: string; alt: string };

export type ProductVariant = {
  id: string;
  title: string;
  sku: string | null;
  price: number;
  /** null means HitPay is not tracking stock for this variant. */
  quantity: number | null;
  available: boolean;
  /** Values for each product option, in the same order as `Product.options`. */
  optionValues: string[];
};

export type ProductOption = { name: string; values: string[] };

export type Product = {
  id: string;
  handle: string;
  name: string;
  headline: string | null;
  descriptionHtml: string;
  descriptionText: string;
  currency: string;
  /** Lowest variant price, in major units. */
  price: number;
  /** Highest variant price, in major units. */
  maxPrice: number;
  images: ProductImage[];
  categoryIds: string[];
  options: ProductOption[];
  variants: ProductVariant[];
  available: boolean;
  pinned: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type Collection = {
  id: string;
  handle: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  productIds: string[];
};

export type Catalog = {
  source: "hitpay" | "demo";
  products: Product[];
  collections: Collection[];
  /** Set when the HitPay API could not be reached; the storefront shows an empty catalogue. */
  error?: string;
};
