/**
 * Lignes clients : schémas possibles (nom FR après migration, name côté API JS, prénom/nom si ajoutés).
 */
export type PlanningClientRow = {
  id?: string;
  nom?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

/**
 * PostgREST peut renvoyer la relation comme objet ou tableau selon le cas.
 */
export function unwrapPlanningClient(
  clients: PlanningClientRow | PlanningClientRow[] | null | undefined
): PlanningClientRow | null {
  if (!clients) return null;
  if (Array.isArray(clients)) return clients[0] ?? null;
  return clients;
}

/** Extrait un libellé depuis une ligne client (toutes colonnes possibles). */
export function displayNameFromClientRow(
  row: PlanningClientRow | Record<string, unknown> | null | undefined
): string {
  if (!row || typeof row !== "object") return "";
  const r = row as Record<string, unknown>;
  const first = String(r.first_name ?? "").trim();
  const last = String(r.last_name ?? "").trim();
  const fromParts = `${first} ${last}`.trim();
  if (fromParts) return fromParts;

  const nom = String(r.nom ?? "").trim();
  if (nom) return nom;

  const name = String(r.name ?? "").trim();
  if (name) return name;

  return "";
}

function normalizePublicDisplayName(raw: string | null | undefined): string {
  return (raw ?? "").trim();
}

/**
 * Détermine si l’affectation est une inscription publique (sans membre club lié).
 */
function isPublicAssignment(input: {
  source?: string | null;
  client_id?: string | null;
  public_name?: string | null;
}): boolean {
  if (input.source === "public_signup") return true;
  if (!input.client_id && normalizePublicDisplayName(input.public_name)) return true;
  return false;
}

/**
 * Libellé PDF pour une affectation : même logique métier que l’API affectations (name vs nom).
 *
 * Priorité :
 * 1) Inscription publique → public_name (ou « Bénévole » si vide)
 * 2) Membre club (ligne résolue par requête directe clients.*) → prénom+nom, sinon nom/name
 * 3) Ancienne relation embed `clients` si fournie
 * 4) public_name en secours si source incohérent
 * 5) « Membre inconnu » uniquement si aucune donnée exploitable
 */
export function formatVolunteerDisplayNameForPdf(input: {
  source?: string | null;
  public_name?: string | null;
  client_id?: string | null;
  /** Ligne issue de `clients` chargée en batch (`select('*')`) — source de vérité pour le SaaS */
  clientRow?: PlanningClientRow | Record<string, unknown> | null;
  /** Ancien chemin : relation PostgREST (souvent vide si mauvais champs dans le select) */
  clients?: PlanningClientRow | PlanningClientRow[] | null;
}): string {
  const publicLabel = normalizePublicDisplayName(input.public_name);

  if (isPublicAssignment(input)) {
    if (publicLabel) return publicLabel;
    return "Bénévole";
  }

  const fromBatch = displayNameFromClientRow(input.clientRow ?? null);
  if (fromBatch) return fromBatch;

  const fromEmbed = displayNameFromClientRow(unwrapPlanningClient(input.clients ?? null));
  if (fromEmbed) return fromEmbed;

  if (publicLabel) return publicLabel;

  return "Membre inconnu";
}

/** TIME / string → clé de tri HH:MM:SS */
export function normalizeTimeKeyForSort(t: string | undefined | null): string {
  if (!t) return "00:00:00";
  const s = String(t).trim();
  if (s.length >= 8) return s.slice(0, 8);
  if (s.length === 5) return `${s}:00`;
  return s.padStart(8, "0");
}

/**
 * Tri PDF : date du créneau croissante, puis heure de début croissante (pas l’ordre de création).
 */
export function sortPlanningSlotsForPdf<
  T extends {
    id: string;
    slotDate: string;
    startTime: string;
  },
>(slots: T[]): T[] {
  return [...slots].sort((a, b) => {
    const da = a.slotDate || "";
    const db = b.slotDate || "";
    if (da !== db) return da.localeCompare(db);
    const ta = normalizeTimeKeyForSort(a.startTime);
    const tb = normalizeTimeKeyForSort(b.startTime);
    if (ta !== tb) return ta.localeCompare(tb);
    return a.id.localeCompare(b.id);
  });
}
