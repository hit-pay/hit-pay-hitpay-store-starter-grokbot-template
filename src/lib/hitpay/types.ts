/**
 * Raw response shapes from the HitPay REST API, as documented at
 * https://docs.hitpayapp.com/apis/overview. Only the fields the storefront uses
 * are typed; everything else is ignored.
 */

export type HitPayImage = {
  id: string;
  caption: string | null;
  url: string;
  other_dimensions?: Array<{ size: string; path: string }>;
};

export type HitPayVariation = {
  id: string;
  stock_keeping_unit: string | null;
  description: string | null;
  price: number;
  price_display?: string;
  price_stored?: number;
  quantity: number | null;
  variation_value_1: string | null;
  variation_value_2: string | null;
  variation_value_3: string | null;
};

export type HitPayProduct = {
  id: string;
  business_id?: string;
  category_id: string[] | null;
  name: string;
  headline: string | null;
  description: string | null;
  currency: string;
  price: number;
  price_display?: string;
  price_stored?: number;
  status: string;
  is_published?: boolean;
  is_pinned?: boolean;
  has_variations: boolean;
  product_url?: string;
  variations: HitPayVariation[];
  variation_key_1: string | null;
  variation_key_2: string | null;
  variation_key_3: string | null;
  images: HitPayImage[];
  created_at?: string;
  updated_at?: string;
};

export type HitPayCategory = {
  id: string;
  name: string;
  description: string | null;
  is_active?: boolean;
  order?: number;
  is_parent?: boolean;
  children?: HitPayCategory[];
  image?: { url?: string; urls?: Record<string, string> } | null;
};

export type HitPayPaginated<T> = {
  data: T[];
  meta?: { current_page: number; last_page: number; per_page: number; total: number };
};

export type HitPayPaymentRequest = {
  id: string;
  url: string;
  status: string;
  amount: string;
  currency: string;
  reference_number?: string | null;
};

export type HitPayTokenResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
};
