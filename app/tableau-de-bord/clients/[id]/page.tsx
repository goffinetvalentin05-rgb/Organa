import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentClub } from "@/lib/auth/rbac";
import { checkPermission, PERMISSIONS } from "@/lib/auth/permissions";
import MemberDetailView, {
  type MemberDetailModel,
  type MemberPlanningParticipation,
} from "./MemberDetailView";
import { normalizeClientsDbRow } from "@/lib/clients/normalizeDbRow";
import { fetchMergedMemberFieldSettings } from "@/lib/member-fields/loadSettings";
import { maskAvsNumber } from "@/lib/member-fields/types";

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await Promise.resolve(params);
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    notFound();
  }

  const { clubId } = await requireCurrentClub();

  const viewOk = await checkPermission(PERMISSIONS.VIEW_MEMBERS);
  if (!viewOk.ok) {
    notFound();
  }

  const manageOk = await checkPermission(PERMISSIONS.MANAGE_MEMBERS);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("user_id", clubId)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const n = normalizeClientsDbRow(data as Record<string, unknown>);
  if (!n) {
    notFound();
  }

  const fieldVisibility = await fetchMergedMemberFieldSettings(supabase, clubId);
  const avs_masked =
    fieldVisibility.avs_number.enabled && n.avs_number
      ? maskAvsNumber(n.avs_number)
      : null;

  const member: MemberDetailModel = {
    id: n.id,
    nom: n.nom,
    prenom: null,
    email: n.email,
    telephone: n.telephone,
    adresse: n.adresse,
    postal_code: n.postal_code,
    city: n.city,
    role: n.role,
    category: n.category,
    date_of_birth: n.date_of_birth,
    avs_masked,
    fieldVisibility,
    created_at: n.created_at,
    updated_at: n.updated_at,
    created_by: n.created_by,
    updated_by: n.updated_by,
  };

  let planningParticipations: MemberPlanningParticipation[] = [];
  const { data: participationRows, error: partErr } = await supabase
    .from("member_participations")
    .select("id, planning_id, created_at")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  if (!partErr && participationRows?.length) {
    const planningIds = [...new Set(participationRows.map((r) => r.planning_id))];
    const { data: planningRows } = await supabase
      .from("plannings")
      .select("id, name, date, status")
      .in("id", planningIds)
      .eq("user_id", clubId);

    const byId = new Map((planningRows || []).map((p) => [p.id, p]));
    planningParticipations = participationRows.map((row) => {
      const pl = byId.get(row.planning_id);
      return {
        id: row.id,
        planningId: row.planning_id,
        name: pl?.name ?? "Planning",
        date: pl?.date ?? "",
        status: pl?.status ?? "",
      };
    });
  }

  return (
    <MemberDetailView
      member={member}
      canManageMembers={manageOk.ok}
      planningParticipations={planningParticipations}
    />
  );
}
