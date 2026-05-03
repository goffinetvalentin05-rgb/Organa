/**
 * Correspondance nom/prénom saisi (lien public) → membre club (clients),
 * limitée à la liste fournie (déjà filtrée par club côté appelant).
 */

export type MemberMatchOutcome =
  | { kind: "unique"; clientId: string }
  | { kind: "none" }
  | { kind: "ambiguous"; clientIds: string[] };

export interface ClubMemberForMatch {
  id: string;
  /** Nom complet ou champ unique (schéma historique) */
  nom?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

/** Normalise pour comparaison : casse, accents, espaces. */
export function normalizeForNameMatch(input: string): string {
  const trimmed = String(input || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  try {
    return trimmed
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase();
  } catch {
    return trimmed.toLowerCase();
  }
}

function tokensFromNormalized(normalized: string): string[] {
  return normalized.split(" ").filter(Boolean);
}

/**
 * Texte utilisé pour le matching : d’abord le nom complet (`nom` / `name`),
 * sinon prénom + nom séparés (évite d’ignorer « Dupuit Simon » si first/last sont vides ou partiels).
 */
export function memberDisplayStringForMatch(m: ClubMemberForMatch): string {
  const nomFull = String(m.nom ?? m.name ?? "").trim();
  if (nomFull) {
    return nomFull;
  }
  const fn = String(m.first_name ?? "").trim();
  const ln = String(m.last_name ?? "").trim();
  if (fn || ln) {
    return `${fn} ${ln}`.trim();
  }
  return "";
}

function multisetKey(tokens: string[]): string {
  return [...tokens].sort().join("\u0001");
}

/**
 * Compare le nom saisi (ex. « Simon Dupuit », « Dupuit Simon ») aux membres.
 * - Au moins 2 jetons : égalité des multiensembles de jetons (insensible accents / casse).
 * - Un seul jeton : égalité stricte sur le nom affiché entier normalisé (ex. « Émilie » / « Emilie »).
 */
export function matchPublicNameToMember(
  rawInput: string,
  members: ClubMemberForMatch[]
): MemberMatchOutcome {
  const normalizedInput = normalizeForNameMatch(rawInput);
  if (!normalizedInput) return { kind: "none" };

  const inputTokens = tokensFromNormalized(normalizedInput);
  if (inputTokens.length === 0) return { kind: "none" };

  const candidates: string[] = [];

  for (const m of members) {
    const display = memberDisplayStringForMatch(m);
    const normDisplay = normalizeForNameMatch(display);
    if (!normDisplay) continue;

    const memberTokens = tokensFromNormalized(normDisplay);
    if (memberTokens.length === 0) continue;

    let match = false;

    /* Chaîne complète (ex. « Dupuit Simon » = « Dupuit Simon », accents/casse/espaces) */
    if (normalizedInput === normDisplay) {
      match = true;
    } else if (inputTokens.length >= 2 && memberTokens.length >= 2) {
      /* Prénom/nom ou nom/prénom : même multiensemble de jetons */
      match = multisetKey(inputTokens) === multisetKey(memberTokens);
    } else if (inputTokens.length === 1 && memberTokens.length === 1) {
      match = inputTokens[0] === memberTokens[0];
    } else if (inputTokens.length === 1 && memberTokens.length >= 2) {
      /* Saisie un seul mot vs membre « Prénom Nom » : pas d’auto-match (ambiguïté) */
      match = false;
    } else if (inputTokens.length >= 2 && memberTokens.length === 1) {
      match = false;
    } else {
      match = normalizedInput === normDisplay;
    }

    if (match) {
      candidates.push(m.id);
    }
  }

  if (candidates.length === 0) return { kind: "none" };
  if (candidates.length === 1) return { kind: "unique", clientId: candidates[0] };
  return { kind: "ambiguous", clientIds: candidates };
}
