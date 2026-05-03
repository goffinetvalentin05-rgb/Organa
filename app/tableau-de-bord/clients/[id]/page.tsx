import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentClub } from "@/lib/auth/rbac";
import { checkPermission, PERMISSIONS } from "@/lib/auth/permissions";
import MemberDetailView, { type MemberDetailModel } from "./MemberDetailView";
import { normalizeClientsDbRow } from "@/lib/clients/normalizeDbRow";

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
    created_at: n.created_at,
    updated_at: n.updated_at,
    created_by: n.created_by,
    updated_by: n.updated_by,
  };

  return (
    <MemberDetailView member={member} canManageMembers={manageOk.ok} />
  );
}
