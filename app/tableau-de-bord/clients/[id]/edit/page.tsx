import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EditClientForm from "./EditClientForm";
import { requireCurrentClub } from "@/lib/auth/rbac";
import { checkPermission, PERMISSIONS } from "@/lib/auth/permissions";

interface EditClientPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { id } = await Promise.resolve(params);

  if (!id || typeof id !== "string" || id.trim().length === 0) {
    notFound();
  }

  const { clubId } = await requireCurrentClub();
  const canManage = await checkPermission(PERMISSIONS.MANAGE_MEMBERS);
  if (!canManage.ok) {
    notFound();
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, nom, email, telephone, adresse, postal_code, city, user_id, role, category"
    )
    .eq("id", id)
    .eq("user_id", clubId)
    .single();

  if (error || !data) {
    notFound();
  }

  const initialData = {
    id: data.id,
    nom: data.nom ?? "",
    email: data.email ?? "",
    telephone: data.telephone ?? "",
    adresse: data.adresse ?? "",
    postal_code: data.postal_code ?? "",
    city: data.city ?? "",
    role: data.role ?? "player",
    category: data.category ?? "",
  };

  return <EditClientForm clientId={id} initialData={initialData} />;
}
