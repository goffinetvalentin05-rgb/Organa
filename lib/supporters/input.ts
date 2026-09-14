import { parseChfToCents } from "@/lib/shop/money";
import {
  SUPPORTER_DURATION_TYPES,
  type SupporterDurationType,
} from "./types";
import { toYmd } from "./status";

export type ParsedOfferInput = {
  name: string;
  description: string | null;
  priceCents: number;
  durationType: SupporterDurationType;
  startDate: string | null;
  endDate: string | null;
  maxSupporters: number | null;
  isActive: boolean;
  isFeatured: boolean;
  showSupporterCount: boolean;
  benefits: string[];
};

function parseBenefits(input: unknown): string[] | { error: string } {
  if (input == null) return [];
  if (!Array.isArray(input)) return { error: "Les avantages sont invalides." };
  const labels: string[] = [];
  for (const raw of input) {
    let label = "";
    if (typeof raw === "string") label = raw.trim();
    else if (raw && typeof raw === "object" && "label" in raw) {
      label = typeof raw.label === "string" ? raw.label.trim() : "";
    }
    if (!label) continue;
    if (label.length > 200) return { error: "Un avantage est trop long (200 caractères max)." };
    labels.push(label);
    if (labels.length > 20) return { error: "20 avantages maximum par offre." };
  }
  return labels;
}

export function parseOfferInput(body: unknown): ParsedOfferInput | { error: string } {
  if (!body || typeof body !== "object") return { error: "Données invalides." };
  const o = body as Record<string, unknown>;

  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (name.length < 2) return { error: "Le nom de l’offre est requis." };
  if (name.length > 80) return { error: "Le nom de l’offre est trop long." };

  const description =
    typeof o.description === "string" && o.description.trim()
      ? o.description.trim().slice(0, 500)
      : null;

  const priceCents =
    typeof o.priceCents === "number" && Number.isFinite(o.priceCents)
      ? Math.round(o.priceCents)
      : parseChfToCents(o.price);
  if (priceCents == null || priceCents < 100) {
    return { error: "Le prix minimum est de CHF 1.00." };
  }
  if (priceCents > 1_000_000_00) {
    return { error: "Le prix est trop élevé." };
  }

  const durationType = o.durationType;
  if (
    typeof durationType !== "string" ||
    !SUPPORTER_DURATION_TYPES.includes(durationType as SupporterDurationType)
  ) {
    return { error: "Type de durée invalide." };
  }

  let startDate = toYmd(typeof o.startDate === "string" ? o.startDate : null);
  let endDate = toYmd(typeof o.endDate === "string" ? o.endDate : null);

  if (durationType === "year") {
    startDate = null;
    endDate = null;
  } else {
    if (!startDate || !endDate) {
      return { error: "Les dates de début et de fin sont requises." };
    }
    if (endDate < startDate) {
      return { error: "La date de fin doit être après la date de début." };
    }
  }

  let maxSupporters: number | null = null;
  if (o.maxSupporters != null && o.maxSupporters !== "") {
    const n = Number(o.maxSupporters);
    if (!Number.isInteger(n) || n < 1 || n > 100000) {
      return { error: "Le nombre maximum de supporters est invalide." };
    }
    maxSupporters = n;
  }

  const benefits = parseBenefits(o.benefits);
  if ("error" in benefits) return benefits;

  return {
    name,
    description,
    priceCents,
    durationType: durationType as SupporterDurationType,
    startDate,
    endDate,
    maxSupporters,
    isActive: o.isActive !== false,
    isFeatured: o.isFeatured === true,
    showSupporterCount: o.showSupporterCount !== false,
    benefits,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ParsedCheckoutCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  publicNameEnabled: boolean;
  offerId: string;
};

export function parseCheckoutCustomer(body: unknown): ParsedCheckoutCustomer | { error: string } {
  if (!body || typeof body !== "object") return { error: "Données invalides." };
  const o = body as Record<string, unknown>;
  const firstName = typeof o.firstName === "string" ? o.firstName.trim() : "";
  const lastName = typeof o.lastName === "string" ? o.lastName.trim() : "";
  const email = typeof o.email === "string" ? o.email.trim().toLowerCase() : "";
  const phone = typeof o.phone === "string" ? o.phone.trim() : "";
  const offerId = typeof o.offerId === "string" ? o.offerId.trim() : "";

  if (firstName.length < 1) return { error: "Le prénom est requis." };
  if (firstName.length > 80) return { error: "Le prénom est trop long." };
  if (lastName.length < 1) return { error: "Le nom est requis." };
  if (lastName.length > 80) return { error: "Le nom est trop long." };
  if (!EMAIL_RE.test(email)) return { error: "E-mail invalide." };
  if (!offerId) return { error: "Offre manquante." };

  return {
    firstName,
    lastName,
    email,
    phone: phone || null,
    publicNameEnabled: o.publicNameEnabled === true,
    offerId,
  };
}
