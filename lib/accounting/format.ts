import { roundChf } from "./money";

const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/** CHF 1'250.00 — apostrophe suisse, deux décimales. */
export function formatChfAmount(amount: number): string {
  const rounded = roundChf(amount);
  const negative = rounded < 0;
  const [whole, frac] = Math.abs(rounded).toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${negative ? "-" : ""}CHF ${grouped}.${frac}`;
}

/** 23.09.2026 */
export function formatSwissDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  return `${match[3]}.${match[2]}.${match[1]}`;
}

/** 23 septembre 2026 */
export function formatSwissDateLong(iso: string | null | undefined): string {
  if (!iso) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return formatSwissDate(iso);
  return `${Number(match[3])} ${month} ${match[1]}`;
}

export function zurichToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function volunteerSentence(input: {
  direction: "in" | "out";
  party?: string | null;
  categoryName?: string | null;
}): string {
  const category = (input.categoryName || "cette opération").trim();
  const party = (input.party || "").trim();
  if (input.direction === "out") {
    return party
      ? `Nous avons payé ${party} — ${category}.`
      : `Dépense enregistrée — ${category}.`;
  }
  return party
    ? `Nous avons reçu un paiement de ${party} pour ${category.toLowerCase()}.`
    : `Paiement reçu — ${category}.`;
}
