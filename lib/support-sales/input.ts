import { parseChfToCents } from "@/lib/shop/money";
import type { SupportSaleMemberScope, SupportSaleStatus } from "./types";
import { SUPPORT_SALE_SCOPES, SUPPORT_SALE_STATUSES } from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function trimOrNull(value: unknown, max = 2000): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function parseDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed;
}

function parsePositiveInt(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export type ParsedSupportSaleInput = {
  name: string;
  productName: string;
  description: string | null;
  priceCents: number;
  availableQuantity: number | null;
  startDate: string | null;
  reservationDeadline: string | null;
  distributionInfo: string | null;
  memberScope: SupportSaleMemberScope;
  goalPerMember: number | null;
  categories: string[];
  memberIds: string[];
  sponsorName: string | null;
  sponsorText: string | null;
  status?: SupportSaleStatus;
};

export function parseSupportSaleInput(
  body: unknown
): { data: ParsedSupportSaleInput } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Données invalides." };
  }
  const input = body as Record<string, unknown>;
  const name = trimOrNull(input.name, 120);
  const productName = trimOrNull(input.productName, 120);
  if (!name) return { error: "Le nom de la vente est requis." };
  if (!productName) return { error: "Le nom du produit est requis." };

  const priceCents =
    typeof input.priceCents === "number"
      ? Math.round(input.priceCents)
      : parseChfToCents(input.price);
  if (priceCents == null || priceCents <= 0) {
    return { error: "Le prix unitaire est requis." };
  }

  const memberScope = SUPPORT_SALE_SCOPES.includes(input.memberScope as SupportSaleMemberScope)
    ? (input.memberScope as SupportSaleMemberScope)
    : "all";

  const categories = Array.isArray(input.categories)
    ? [...new Set(input.categories.map((c) => String(c).trim()).filter(Boolean))].slice(0, 80)
    : [];
  const memberIds = Array.isArray(input.memberIds)
    ? [...new Set(input.memberIds.filter(isUuid))].slice(0, 800)
    : [];

  if (memberScope === "categories" && categories.length === 0) {
    return { error: "Choisissez au moins une équipe." };
  }
  if (memberScope === "members" && memberIds.length === 0) {
    return { error: "Choisissez au moins un membre." };
  }

  const startDate = parseDate(input.startDate);
  const reservationDeadline = parseDate(input.reservationDeadline);
  if (startDate && reservationDeadline && reservationDeadline < startDate) {
    return { error: "La date limite doit être après la date de début." };
  }

  let status: SupportSaleStatus | undefined;
  if (typeof input.status === "string" && SUPPORT_SALE_STATUSES.includes(input.status as SupportSaleStatus)) {
    status = input.status as SupportSaleStatus;
  }

  return {
    data: {
      name,
      productName,
      description: trimOrNull(input.description, 4000),
      priceCents,
      availableQuantity: parsePositiveInt(input.availableQuantity),
      startDate,
      reservationDeadline,
      distributionInfo: trimOrNull(input.distributionInfo, 2000),
      memberScope,
      goalPerMember: parsePositiveInt(input.goalPerMember),
      categories: memberScope === "categories" ? categories : [],
      memberIds: memberScope === "members" ? memberIds : [],
      sponsorName: trimOrNull(input.sponsorName, 120),
      sponsorText: trimOrNull(input.sponsorText, 400),
      status,
    },
  };
}

export function parseBuyerFirstName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 80) return null;
  if (/[\n\r]/.test(name)) return null;
  return name;
}

export function parseQuantity(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 99) return null;
  return n;
}
