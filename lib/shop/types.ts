export const SHOP_CURRENCY = "CHF" as const;
export type ShopCurrency = typeof SHOP_CURRENCY;

export const PAYMENT_PROVIDERS = ["stripe"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PRODUCT_STATUSES = ["active", "hidden", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ORDER_PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "expired",
  "refunded",
] as const;
export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];

export const ORDER_FULFILLMENT_STATUSES = [
  "none",
  "to_prepare",
  "ready",
  "handed_over",
  "cancelled",
] as const;
export type OrderFulfillmentStatus = (typeof ORDER_FULFILLMENT_STATUSES)[number];

export const FULFILLMENT_METHODS = ["pickup", "shipping"] as const;
export type FulfillmentMethod = (typeof FULFILLMENT_METHODS)[number];

export const PAYMENT_ACCOUNT_STATUSES = [
  "not_connected",
  "onboarding",
  "pending",
  "complete",
  "restricted",
  "disabled",
] as const;
export type PaymentAccountStatus = (typeof PAYMENT_ACCOUNT_STATUSES)[number];

export const SHOP_CATEGORIES = [
  "Maillot",
  "Training",
  "T-shirt",
  "Écharpe",
  "Casquette",
  "Gourde",
  "Accessoire",
  "Autre",
] as const;

export type ShopCategory = (typeof SHOP_CATEGORIES)[number] | string;

export type ShopSettings = {
  clubId: string;
  slug: string | null;
  isEnabled: boolean;
  displayName: string;
  introText: string;
  pickupInfo: string;
  ordersEmail: string;
  trackStockDefault: boolean;
  currency: ShopCurrency;
  publicUrlPath: string | null;
  canEnablePublicSales: boolean;
};

export type ShopProductImage = {
  id: string;
  productId: string;
  storagePath: string;
  publicUrl: string;
  altText: string | null;
  sortOrder: number;
};

export type ShopProductVariant = {
  id: string;
  productId: string;
  label: string;
  attributes: Record<string, string>;
  sku: string | null;
  stockQuantity: number | null;
  isActive: boolean;
  sortOrder: number;
};

export type ShopProduct = {
  id: string;
  clubId: string;
  name: string;
  description: string | null;
  category: string | null;
  priceCents: number;
  promotionalPriceCents: number | null;
  currency: ShopCurrency;
  trackStock: boolean;
  stockQuantity: number | null;
  hasVariants: boolean;
  status: ProductStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  images: ShopProductImage[];
  variants: ShopProductVariant[];
};

export type ShopOrderItem = {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantLabel: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type ShopOrder = {
  id: string;
  clubId: string;
  orderNumber: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string | null;
  fulfillmentMethod: FulfillmentMethod;
  pickupInfo: string | null;
  shippingAddress: Record<string, string> | null;
  currency: ShopCurrency;
  subtotalCents: number;
  totalCents: number;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  paymentProvider: PaymentProvider;
  paidAt: string | null;
  createdAt: string;
  items: ShopOrderItem[];
};

export type ClubPaymentAccount = {
  id: string;
  clubId: string;
  provider: PaymentProvider;
  providerAccountId: string | null;
  status: PaymentAccountStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  displayName: string | null;
  accountEmail: string | null;
  livemode: boolean | null;
};

export type ShopStats = {
  revenueTotalCents: number;
  revenueMonthCents: number;
  ordersCount: number;
  ordersToPrepare: number;
  unitsSold: number;
  averageBasketCents: number;
  topProducts: Array<{ name: string; units: number; revenueCents: number }>;
};

export type PublicShopCatalog = {
  slug: string;
  clubName: string;
  logoUrl: string | null;
  primaryColor: string;
  introText: string | null;
  pickupInfo: string | null;
  isEnabled: boolean;
  canCheckout: boolean;
  checkoutBlockedReason: string | null;
  currency: ShopCurrency;
};

export type CartItemInput = {
  productId: string;
  variantId?: string | null;
  quantity: number;
};

export const SIZE_PRESETS = ["XS", "S", "M", "L", "XL", "XXL"] as const;
