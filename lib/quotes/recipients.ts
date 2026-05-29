export type CotisationClient = {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  role?: string | null;
  category?: string | null;
};

export type RecipientType = "individual" | "team" | "all";

export type TeamOption = {
  value: string;
  count: number;
};

export type ExistingQuoteSummary = {
  client_id: string;
  date_echeance: string | null;
  total_ttc: number;
  status: string;
};

export function isPlayer(client: CotisationClient): boolean {
  const role = (client.role || "").toLowerCase().trim();
  return role === "player" || role === "joueur";
}

export function getPlayers(clients: CotisationClient[]): CotisationClient[] {
  return clients.filter(isPlayer);
}

export function getTeamsWithCounts(clients: CotisationClient[]): TeamOption[] {
  const map = new Map<string, number>();
  for (const client of clients) {
    const category = client.category?.trim();
    if (!category) continue;
    map.set(category, (map.get(category) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value, "fr"));
}

export function getMembersByCategory(
  clients: CotisationClient[],
  category: string
): CotisationClient[] {
  const normalized = category.trim();
  return clients.filter((client) => (client.category || "").trim() === normalized);
}

export function getCategoryLabel(
  category: string,
  translate: (key: string) => string
): string {
  const key = `dashboard.clients.categories.${category}`;
  const translated = translate(key);
  return translated !== key ? translated : category;
}

export function resolveCotisationTargets(
  recipientType: RecipientType,
  clients: CotisationClient[],
  memberId: string,
  teamCategory: string
): CotisationClient[] {
  if (recipientType === "individual") {
    const member = clients.find((c) => c.id === memberId);
    return member ? [member] : [];
  }

  if (recipientType === "team") {
    return getMembersByCategory(clients, teamCategory);
  }

  return getPlayers(clients);
}

export function findDuplicateTargets(
  targets: CotisationClient[],
  existingQuotes: ExistingQuoteSummary[],
  dateEcheance: string,
  totalTtc: number
): CotisationClient[] {
  if (!dateEcheance.trim()) return [];

  const due = dateEcheance.trim();
  return targets.filter((target) =>
    existingQuotes.some((quote) => {
      if (quote.client_id !== target.id) return false;
      if (quote.status === "refuse") return false;
      if ((quote.date_echeance || "").trim() !== due) return false;
      return Math.abs(Number(quote.total_ttc) - totalTtc) < 0.01;
    })
  );
}
