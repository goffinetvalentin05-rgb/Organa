import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  deriveContractStatus,
  getContractRenewalInfo,
  getContractsToRenew,
} from "@/lib/sponsor-contracts";
import { ToolError } from "@/lib/obillz-tools/core/errors";

function mapRow(row: Record<string, unknown> | null) {
  if (!row) return null;
  const startDate = String(row.start_date ?? "");
  const endDate = String(row.end_date ?? "");
  return {
    id: row.id as string,
    clubId: row.club_id as string,
    sponsorName: row.sponsor_name as string,
    title: row.title as string,
    content: (row.content as string) ?? "",
    amount: row.amount != null && row.amount !== "" ? Number(row.amount) : null,
    startDate,
    endDate,
    status: deriveContractStatus(startDate, endDate),
    sponsorType: (row.sponsor_type as string | null) ?? null,
  };
}

const SELECT =
  "id, club_id, sponsor_name, title, content, amount, start_date, end_date, status, sponsor_type, created_by, created_at, updated_at";

export async function listSponsorsForClub(clubId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsor_contracts")
    .select(SELECT)
    .eq("club_id", clubId)
    .order("end_date", { ascending: true });
  if (error) {
    throw new ToolError(
      "Erreur lors du chargement des contrats",
      "SPONSORS_LIST_FAILED",
      500
    );
  }
  return (data || []).map((r) => mapRow(r as Record<string, unknown>)).filter(Boolean);
}

export async function searchSponsorsForClub(clubId: string, query: string) {
  const all = await listSponsorsForClub(clubId);
  const q = query.trim().toLowerCase();
  return all.filter(
    (s) =>
      s &&
      (s.sponsorName.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q))
  );
}

export async function createSponsorContractForClub(params: {
  clubId: string;
  actorUserId: string;
  sponsorName: string;
  title: string;
  startDate: string;
  endDate: string;
  content?: string;
  amount?: number | null;
  sponsorType?: string | null;
}) {
  if (!params.sponsorName?.trim() || !params.title?.trim()) {
    throw new ToolError("Nom du sponsor et titre requis", "SPONSOR_FIELDS_REQUIRED");
  }
  if (params.startDate > params.endDate) {
    throw new ToolError(
      "La date de fin doit être postérieure ou égale au début",
      "SPONSOR_DATES_INVALID"
    );
  }
  const supabase = await createClient();
  const payload: Record<string, unknown> = {
    club_id: params.clubId,
    sponsor_name: params.sponsorName.trim(),
    title: params.title.trim(),
    content: params.content || "",
    start_date: params.startDate,
    end_date: params.endDate,
    created_by: params.actorUserId,
  };
  if (params.amount != null) payload.amount = params.amount;
  if (
    params.sponsorType === "gold" ||
    params.sponsorType === "silver" ||
    params.sponsorType === "bronze"
  ) {
    payload.sponsor_type = params.sponsorType;
  }

  const { data, error } = await supabase
    .from("sponsor_contracts")
    .insert(payload)
    .select(SELECT)
    .single();
  if (error) {
    throw new ToolError("Erreur lors de la création", "SPONSOR_CREATE_FAILED", 500);
  }
  return mapRow(data as Record<string, unknown>);
}

export async function updateSponsorContractForClub(params: {
  clubId: string;
  contractId: string;
  patch: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsor_contracts")
    .update(params.patch)
    .eq("id", params.contractId)
    .eq("club_id", params.clubId)
    .select(SELECT)
    .single();
  if (error || !data) {
    throw new ToolError("Contrat introuvable", "SPONSOR_NOT_FOUND", 404);
  }
  return mapRow(data as Record<string, unknown>);
}

export async function listSponsorRenewalsForClub(clubId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsor_contracts")
    .select(SELECT)
    .eq("club_id", clubId);
  if (error) {
    throw new ToolError("Erreur lors du chargement", "SPONSOR_RENEWALS_FAILED", 500);
  }
  const toWatch = getContractsToRenew(data || [], { horizonDays: 30 });
  return toWatch.map((row) => {
    const endDate = String(row.end_date ?? "");
    const info = getContractRenewalInfo(endDate);
    return {
      id: row.id as string,
      sponsorName: row.sponsor_name as string,
      title: row.title as string,
      endDate,
      status: deriveContractStatus(String(row.start_date ?? ""), endDate),
      daysUntilEnd: info?.daysUntilEnd ?? null,
      isExpired: info?.isExpired ?? false,
    };
  });
}

export { createAdminClient };
