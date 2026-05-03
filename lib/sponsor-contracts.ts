export type SponsorContractStatus = "pending" | "active" | "expired";

export type SponsorType = "gold" | "silver" | "bronze";

function parseLocalDate(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const date = new Date(y, mo, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) {
    return null;
  }
  return date;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Statut dérivé des dates (source de vérité côté app).
 */
export function deriveContractStatus(
  startDate: string,
  endDate: string,
  today: Date = new Date()
): SponsorContractStatus {
  const t = startOfDay(today).getTime();
  const s = parseLocalDate(startDate);
  const e = parseLocalDate(endDate);
  if (!s || !e) return "pending";
  if (t < s.getTime()) return "pending";
  if (t > e.getTime()) return "expired";
  return "active";
}

function addDays(base: Date, days: number): Date {
  const d = startOfDay(base);
  d.setDate(d.getDate() + days);
  return d;
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Ajoute des mois à une date `YYYY-MM-DD` (calendrier local). */
export function addMonthsToStartDate(startDateYmd: string, months: number): string {
  const parsed = parseLocalDate(startDateYmd);
  if (!parsed || !Number.isFinite(months) || months < 1) return startDateYmd;
  const day = parsed.getDate();
  const d = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) {
    d.setDate(0);
  }
  return toYmd(d);
}

export type ContractRenewalInfo = {
  daysUntilEnd: number;
  isExpired: boolean;
};

export function getContractRenewalInfo(
  endDate: string,
  today: Date = new Date()
): ContractRenewalInfo | null {
  const end = parseLocalDate(endDate);
  if (!end) return null;
  const t = startOfDay(today).getTime();
  const diffMs = end.getTime() - t;
  const daysUntilEnd = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return {
    daysUntilEnd,
    isExpired: daysUntilEnd < 0,
  };
}

/**
 * Contrats dont la date de fin est au plus tard dans `horizonDays` jours
 * (inclus : expire dans les N prochains jours ou déjà expiré).
 * Équivalent à : end_date <= today + horizonDays (comparaison sur chaînes ISO date).
 */
export function getContractsToRenew<T extends { end_date: string }>(
  contracts: T[],
  options?: { horizonDays?: number; today?: Date }
): T[] {
  const horizonDays = options?.horizonDays ?? 30;
  const today = options?.today ?? new Date();
  const cutoff = addDays(today, horizonDays);
  const cutoffStr = toYmd(cutoff);
  return contracts.filter((c) => {
    const end = c.end_date;
    if (!end) return false;
    return end <= cutoffStr;
  });
}

export function buildDefaultContractTemplate(params: {
  clubName: string;
  sponsorName: string;
}): string {
  const { clubName, sponsorName } = params;
  return `Contrat de sponsoring

Entre les soussignés :

- Le club « ${clubName} », ci-après « le Club »,
- Et « ${sponsorName} », ci-après « le Sponsor »,

Il a été convenu ce qui suit :

1. Objet
Le Sponsor apporte un soutien financier et/ou en nature au Club, qui en contrepartie accorde les contreparties décrites ci-dessous (visibilité, mentions, emplacements publicitaires, etc.).

2. Durée et montant
La présente convention prend effet aux dates indiquées dans ce dossier. Le montant ou la valeur du sponsoring est celui précisé dans l'application.

3. Contreparties du Club
Le Club s'engage à fournir les contreparties convenues (logo, annonces, accueil lors d'événements, etc.) dans le respect du planning communiqué au Sponsor.

4. Confidentialité
Les parties s'engagent à garder confidentielles les informations sensibles échangées dans le cadre de ce partenariat.

5. Résiliation
En cas de manquement grave d'une partie, l'autre pourra mettre fin au contrat avec un préavis raisonnable, conformément au droit applicable.

Fait pour servir et valoir ce que de droit.

Signatures :

Pour le Club : _______________________

Pour le Sponsor : _______________________
`;
}
