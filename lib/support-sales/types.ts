export const SUPPORT_SALE_STATUSES = ["draft", "active", "ended"] as const;
export type SupportSaleStatus = (typeof SUPPORT_SALE_STATUSES)[number];

export const SUPPORT_SALE_SCOPES = ["all", "categories", "members"] as const;
export type SupportSaleMemberScope = (typeof SUPPORT_SALE_SCOPES)[number];

export const SUPPORT_SALE_COLLECTION_MODES = ["reservation", "online"] as const;
export type SupportSaleCollectionMode = (typeof SUPPORT_SALE_COLLECTION_MODES)[number];

export const SUPPORT_SALE_RESERVATION_STATUSES = ["confirmed", "cancelled"] as const;
export type SupportSaleReservationStatus = (typeof SUPPORT_SALE_RESERVATION_STATUSES)[number];

export const SUPPORT_SALE_SELECT_CORE =
  "id, club_id, name, product_name, slug, description, image_path, image_url, price_cents, currency, available_quantity, start_date, reservation_deadline, distribution_info, member_scope, goal_per_member, sponsor_name, sponsor_logo_path, sponsor_logo_url, sponsor_text, collection_mode, status, created_at, updated_at";

export const SUPPORT_SALE_SELECT = `${SUPPORT_SALE_SELECT_CORE}, sponsor_url, public_label, public_title, public_subtitle, public_primary_color, public_secondary_color, public_page_style, public_banner_url, public_banner_path, public_image_position, public_overlay_intensity, club_revenue_id, published_at`;

export type SupportSaleRow = {
  id: string;
  club_id: string;
  name: string;
  product_name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  image_url: string | null;
  price_cents: number;
  currency: string;
  available_quantity: number | null;
  start_date: string | null;
  reservation_deadline: string | null;
  distribution_info: string | null;
  member_scope: SupportSaleMemberScope;
  goal_per_member: number | null;
  sponsor_name: string | null;
  sponsor_logo_path: string | null;
  sponsor_logo_url: string | null;
  sponsor_text: string | null;
  sponsor_url: string | null;
  collection_mode: SupportSaleCollectionMode;
  status: SupportSaleStatus;
  public_label: string | null;
  public_title: string | null;
  public_subtitle: string | null;
  public_primary_color: string | null;
  public_secondary_color: string | null;
  public_page_style: string | null;
  public_banner_url: string | null;
  public_banner_path: string | null;
  public_image_position: string | null;
  public_overlay_intensity: string | null;
  club_revenue_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SupportSaleSummaryStats = {
  reservationsCount: number;
  quantitySold: number;
  revenueCents: number;
  membersSoldCount: number;
};

export type SupportSale = {
  id: string;
  clubId: string;
  name: string;
  productName: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  currency: string;
  availableQuantity: number | null;
  startDate: string | null;
  reservationDeadline: string | null;
  distributionInfo: string | null;
  memberScope: SupportSaleMemberScope;
  goalPerMember: number | null;
  categories: string[];
  memberIds: string[];
  sponsorName: string | null;
  sponsorLogoUrl: string | null;
  sponsorText: string | null;
  sponsorUrl: string | null;
  collectionMode: SupportSaleCollectionMode;
  status: SupportSaleStatus;
  publicPath: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  stats: SupportSaleSummaryStats;
};

export type SupportSaleMemberOption = {
  id: string;
  name: string;
  category: string | null;
};

export type SupportSaleReservation = {
  id: string;
  saleId: string;
  memberId: string;
  memberName: string;
  memberCategory: string | null;
  buyerFirstName: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  status: SupportSaleReservationStatus;
  createdAt: string;
};

export type SupportSaleMemberRow = {
  memberId: string;
  memberName: string;
  memberCategory: string | null;
  buyersCount: number;
  quantitySold: number;
  amountCents: number;
  goalPerMember: number | null;
  personalPath: string;
  reservations: SupportSaleReservation[];
};

export type SupportSaleDashboard = {
  sale: SupportSale;
  remainingQuantity: number | null;
  members: SupportSaleMemberRow[];
};

export type PublicSupportSale = {
  name: string;
  productName: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  currency: string;
  reservationDeadline: string | null;
  distributionInfo: string | null;
  sponsorName: string | null;
  sponsorLogoUrl: string | null;
  sponsorText: string | null;
  sponsorUrl: string | null;
  status: SupportSaleStatus;
  acceptsReservations: boolean;
  remainingQuantity: number | null;
  clubName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  theme: import("@/lib/public-branding/types").PublicVisualTheme;
  members: SupportSaleMemberOption[];
};

export type PublicReservationResult = {
  id: string;
  saleName: string;
  productName: string;
  buyerFirstName: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  memberName: string;
};
