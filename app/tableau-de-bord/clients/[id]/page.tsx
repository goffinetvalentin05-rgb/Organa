import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentClub } from "@/lib/auth/rbac";
import { checkPermission, PERMISSIONS } from "@/lib/auth/permissions";
import MemberDetailView, { type MemberDetailModel } from "./MemberDetailView";

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
    .select(
      "id, nom, email, telephone, adresse, postal_code, city, user_id, role, category, created_by, updated_by, created_at, updated_at"
    )
    .eq("id", id)
    .eq("user_id", clubId)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const member: MemberDetailModel = {
    id: data.id,
    nom: data.nom,
    prenom: null,
    email: data.email,
    telephone: data.telephone,
    adresse: data.adresse,
    postal_code: data.postal_code,
    city: data.city,
    role: data.role ?? "player",
    category: data.category,
    created_at: data.created_at ?? null,
    updated_at: data.updated_at ?? null,
    created_by: data.created_by ?? null,
    updated_by: data.updated_by ?? null,
  };

  return (
    <MemberDetailView member={member} canManageMembers={manageOk.ok} />
  );
}
