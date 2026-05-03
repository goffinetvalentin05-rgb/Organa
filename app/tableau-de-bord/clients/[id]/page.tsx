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
import type { MemberParticipationStatus } from "@/lib/planning/participationStatus";

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
    .select("id, planning_id, event_title, event_date, status, created_at")
    .eq("member_id", id)
    .eq("club_id", clubId);

  if (!partErr && participationRows?.length) {
    const sorted = [...participationRows].sort((a, b) => {
      const da = a.event_date ? new Date(`${a.event_date}T12:00:00`).getTime() : 0;
      const db = b.event_date ? new Date(`${b.event_date}T12:00:00`).getTime() : 0;
      if (db !== da) return db - da;
      const ca = a.created_at ? new Date(a.created_at).getTime() : 0;
      const cb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return cb - ca;
    });

    planningParticipations = sorted.map((row) => ({
      id: row.id,
      planningId: row.planning_id,
      eventTitle: row.event_title ?? "Planning",
      eventDate: row.event_date ?? null,
      participationStatus: (row.status ?? "registered") as MemberParticipationStatus,
      createdAt: row.created_at ?? "",
    }));
  }

  return (
    <MemberDetailView
      member={member}
      canManageMembers={manageOk.ok}
      planningParticipations={planningParticipations}
    />
  );
}
